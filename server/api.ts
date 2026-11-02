import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { db } from './db.ts';
import {
  getSessionUser,
  requireAuth,
  requireAdmin,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getRedirectUri,
  generateOAuthState,
  verifyOAuthState,
  setOAuthStateCookie,
  clearOAuthStateCookie,
  OAUTH_STATE_COOKIE_NAME,
} from './auth.ts';
import {
  validateDiscordId,
  resolveDiscordAvatar,
  getTierRank,
  getTierDefinition,
  resolveUserRoles,
} from '../src/utils/pvpLogic.ts';

export const apiRouter = express.Router();

// --- Public Configuration & App Data ---
apiRouter.get('/config', (req: Request, res: Response) => {
  const isDiscordConfigured = !!(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET);
  const redirectUri = getRedirectUri(req);
  const settings = db.getSettings();

  const devRedirectUri = 'https://ais-dev-dp23obbeui2s6ee2zzaska-953765324818.europe-west2.run.app/auth/callback';
  const sharedRedirectUri = 'https://ais-pre-dp23obbeui2s6ee2zzaska-953765324818.europe-west2.run.app/auth/callback';

  res.json({
    serverName: settings.serverName,
    logoUrl: settings.logoUrl,
    youtubeUrl: settings.youtubeUrl,
    isDiscordConfigured,
    discordClientId: process.env.DISCORD_CLIENT_ID ? 'Configured (Active)' : null,
    redirectUri,
    devRedirectUri,
    sharedRedirectUri,
    allowedRedirectUris: [
      devRedirectUri,
      sharedRedirectUri,
      redirectUri,
    ].filter((v, i, a) => a.indexOf(v) === i),
  });
});

apiRouter.get('/public-data', (req: Request, res: Response) => {
  const settings = db.getSettings();
  const testServers = db.getTestServers();
  const testers = db.getTesters();
  const leaderboard = db.getLeaderboardPublic();
  const newsArticles = db.getNewsArticles();
  const roles = db.getRoles();
  const tiers = db.getTiers();

  res.json({
    settings,
    testServers,
    testers,
    leaderboard,
    newsArticles,
    roles,
    tiers,
  });
});

apiRouter.get('/testers', (req: Request, res: Response) => {
  const testers = db.getTesters();
  res.json({ testers });
});

apiRouter.get('/tiers', (req: Request, res: Response) => {
  const tiers = db.getTiers();
  res.json({ tiers });
});

apiRouter.get('/news', (req: Request, res: Response) => {
  const newsArticles = db.getNewsArticles();
  res.json({ news: newsArticles });
});

apiRouter.get('/roles', (req: Request, res: Response) => {
  const roles = db.getRoles();
  res.json({ roles });
});

apiRouter.get('/leaderboard', (req: Request, res: Response) => {
  const leaderboard = db.getLeaderboardPublic();
  res.json({ leaderboard });
});

apiRouter.get('/servers', (req: Request, res: Response) => {
  const testServers = db.getTestServers();
  res.json({ servers: testServers });
});

// --- Discord OAuth2 Initiation ---
apiRouter.get('/auth/discord/url', (req: Request, res: Response) => {
  const redirectUri = getRedirectUri(req);
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.json({
      configured: false,
      message: 'Discord OAuth credentials are not set in environment variables.',
      redirectUri,
      guide: {
        step1: 'Go to Discord Developer Portal (https://discord.com/developers/applications)',
        step2: 'Select your application -> OAuth2 -> General',
        step3: `Add this exact Redirect URI: ${redirectUri}`,
        step4: 'Copy Client ID and Client Secret into your AI Studio environment variables (DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET).',
      },
    });
    return;
  }

  // Generate cryptographically secure CSRF state token and set HTTP-only cookie
  const { state, signedToken } = generateOAuthState(redirectUri);
  setOAuthStateCookie(res, signedToken);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify email',
    state,
    prompt: 'consent',
  });

  const url = `https://discord.com/oauth2/authorize?${params.toString()}`;
  res.json({
    configured: true,
    url,
    redirectUri,
    state,
  });
});

// OAuth Callback handler mounted on root `/auth/callback` in server.ts
export async function handleDiscordCallback(req: Request, res: Response): Promise<void> {
  const { code, state, error, error_description } = req.query;
  const redirectUri = getRedirectUri(req);

  // Validate OAuth2 state parameter to protect against CSRF attacks
  const signedToken = req.cookies?.[OAUTH_STATE_COOKIE_NAME];
  const stateVerification = verifyOAuthState(String(state || ''), signedToken);
  clearOAuthStateCookie(res);

  if (error || !code) {
    res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authentication Canceled</title></head>
        <body style="font-family: sans-serif; background: #070a13; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="background: rgba(255,255,255,0.05); padding: 30px; border-radius: 12px; border: 1px solid #ef4444; max-width: 450px; text-align: center;">
            <h2 style="color: #ef4444;">Discord Authorization Canceled</h2>
            <p style="color: #94a3b8;">${error_description || error || 'Authorization was not completed.'}</p>
            <button onclick="window.close()" style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">Close Window</button>
          </div>
        </body>
      </html>
    `);
    return;
  }

  if (!stateVerification.valid) {
    res.status(403).send(`
      <!DOCTYPE html>
      <html>
        <head><title>CSRF Verification Failed</title></head>
        <body style="font-family: sans-serif; background: #070a13; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="background: rgba(255,255,255,0.05); padding: 30px; border-radius: 12px; border: 1px solid #ef4444; max-width: 450px; text-align: center;">
            <h2 style="color: #ef4444;">Security Verification Failed</h2>
            <p style="color: #94a3b8;">The OAuth2 state parameter was missing, invalid, or expired. Please try signing in again.</p>
            <button onclick="window.close()" style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">Close Window</button>
          </div>
        </body>
      </html>
    `);
    return;
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.status(500).send('Discord credentials missing on server.');
    return;
  }

  try {
    const effectiveRedirectUri = stateVerification.redirectUri || redirectUri;

    // 1. Exchange code for access token securely on the server
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: effectiveRedirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      console.error('Discord token exchange failed:', errBody, 'effectiveRedirectUri:', effectiveRedirectUri);
      let parsedErr: any = {};
      try {
        parsedErr = JSON.parse(errBody);
      } catch {
        parsedErr = { error: errBody };
      }

      res.status(400).send(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
          <head>
            <meta charset="utf-8" />
            <title>تعذر إتمام توثيق ديسكورد</title>
          </head>
          <body style="font-family: system-ui, -apple-system, sans-serif; background: #060913; color: #f1f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px;">
            <div style="background: rgba(10, 16, 31, 0.95); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 20px; padding: 32px; max-width: 520px; width: 100%; box-shadow: 0 0 50px rgba(239, 68, 68, 0.2); text-align: right;">
              <h2 style="color: #ef4444; margin-top: 0; font-size: 22px; display: flex; align-items: center; gap: 8px;">
                <span>فشل توثيق حساب ديسكورد</span>
              </h2>
              <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
                رفضت خوادم ديسكورد استبدال رمز التوثيق. السبب المرجع من ديسكورد:
              </p>
              <div style="background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 12px 16px; margin: 16px 0; font-family: monospace; font-size: 13px; color: #fca5a5; direction: ltr; text-align: left; word-break: break-all;">
                ${parsedErr.error_description || parsedErr.error || errBody}
              </div>
              <div style="background: rgba(37, 99, 235, 0.1); border: 1px solid rgba(0, 229, 255, 0.3); border-radius: 12px; padding: 14px; margin-bottom: 20px; font-size: 13px; color: #cbd5e1;">
                <div style="font-weight: bold; color: #00e5ff; margin-bottom: 6px;">الرابط المستخدم للتحويل (Redirect URI):</div>
                <div style="font-family: monospace; font-size: 12px; color: #ffffff; direction: ltr; text-align: left; background: rgba(0,0,0,0.4); padding: 8px; border-radius: 6px; word-break: break-all;">
                  ${effectiveRedirectUri}
                </div>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #94a3b8;">
                  تأكد من إضافة هذا الرابط بالضبط داخل <strong style="color: #fff;">Discord Developer Portal -> OAuth2 -> Redirects</strong>
                </p>
              </div>
              <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="window.close()" style="background: #2563eb; color: white; border: none; padding: 10px 24px; border-radius: 10px; font-weight: bold; font-size: 14px; cursor: pointer;">إغلاق النافذة</button>
              </div>
            </div>
          </body>
        </html>
      `);
      return;
    }

    const tokenData = await tokenResponse.json() as { access_token: string; token_type: string };

    // 2. Fetch authenticated Discord user info (identify + email)
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `${tokenData.token_type} ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to retrieve Discord user profile.');
    }

    const discordUser = await userResponse.json() as {
      id: string;
      username: string;
      global_name?: string;
      avatar?: string;
      discriminator?: string;
      email?: string;
    };

    // Construct Discord CDN avatar URL
    let avatarUrl = '';
    if (discordUser.avatar) {
      const isAnimated = discordUser.avatar.startsWith('a_');
      const format = isAnimated ? 'gif' : 'png';
      avatarUrl = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.${format}?size=256`;
    } else {
      const defaultIndex = (BigInt(discordUser.id) >> 22n) % 6n;
      avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
    }

    // 3. Upsert authenticated user profile in persistent database
    const user = await db.upsertUser({
      discordId: discordUser.id,
      username: discordUser.username,
      globalName: discordUser.global_name,
      avatar: avatarUrl,
      discriminator: discordUser.discriminator,
      email: discordUser.email,
    });

    // Record login entry in persistent database
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress;
    const userAgent = (req.headers['user-agent'] as string) || undefined;
    await db.recordLogin({
      discordId: discordUser.id,
      username: discordUser.username,
      globalName: discordUser.global_name,
      avatar: avatarUrl,
      discriminator: discordUser.discriminator,
      email: discordUser.email,
      ipAddress,
      userAgent,
    });

    // If the authenticated user is an admin, automatically synchronize the owner profile info
    if (db.isAdmin(user.discordId)) {
      await db.updateSettings({
        ownerDiscordId: user.discordId,
        ownerName: user.globalName || user.username,
        ownerAvatar: user.avatar,
        ownerTag: 'صاحب السيرفر ومؤسس الموقع',
      });
    }

    // 4. Create server-side session token and set secure SameSite cookie
    const sessionToken = createSessionToken(user.discordId);
    setSessionCookie(res, sessionToken);

    // 5. Send postMessage HTML and close popup
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authentication Successful</title></head>
        <body style="font-family: sans-serif; background: #070a13; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="background: rgba(0, 229, 255, 0.05); padding: 30px; border-radius: 12px; border: 1px solid #00e5ff; max-width: 450px; text-align: center;">
            <h2 style="color: #00e5ff; margin-bottom: 8px;">White Kingdom Authentication</h2>
            <p style="color: #94a3b8; margin-bottom: 20px;">Welcome, <strong>${user.username}</strong>! Your account has been verified.</p>
            <p style="color: #64748b; font-size: 13px;">Closing authorization window...</p>
          </div>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_AUTH_SUCCESS',
                  user: ${JSON.stringify(user)},
                  token: ${JSON.stringify(sessionToken)}
                }, '*');
                setTimeout(() => window.close(), 600);
              } else {
                window.location.href = '/';
              }
            } catch(e) {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('OAuth callback processing error:', err);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif; background: #070a13; color: #fff; padding: 40px; text-align: center;">
          <h2 style="color: #ef4444;">Authentication Error</h2>
          <p style="color: #94a3b8;">${err.message || 'An error occurred during Discord authentication.'}</p>
          <button onclick="window.close()" style="margin-top: 15px; padding: 10px 20px; background: #334155; color: white; border: none; border-radius: 6px; cursor: pointer;">Close</button>
        </body>
      </html>
    `);
  }
}

// Development / Testing Instant Login endpoint (Strictly disabled in production)
apiRouter.post('/auth/dev-login', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEV_LOGIN) {
    res.status(403).json({ error: 'تم تعطيل الدخول التجريبي في بيئة التشغيل. يرجى تسجيل الدخول الرسمي عبر ديسكورد.' });
    return;
  }

  const { discordId, username, asAdmin } = req.body;
  const validation = validateDiscordId(discordId);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const defaultAvatar = resolveDiscordAvatar(discordId.trim());

  const user = await db.upsertUser({
    discordId: discordId.trim(),
    username: username?.trim() || `Player_${discordId.slice(-4)}`,
    globalName: username?.trim() || `Player_${discordId.slice(-4)}`,
    avatar: defaultAvatar,
  });

  if (asAdmin) {
    await db.setAdminStatus(user.discordId, true);
    user.isAdmin = true;
  }

  const token = createSessionToken(user.discordId);
  setSessionCookie(res, token);

  res.json({
    success: true,
    user,
    token,
  });
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  clearSessionCookie(res);
  res.json({ success: true, message: 'Logged out successfully.' });
});

apiRouter.get('/auth/session', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user) {
    res.json({ authenticated: false, user: null });
    return;
  }
  res.json({
    authenticated: true,
    user,
  });
});

// Authenticated user's full profile and resolved role badges
apiRouter.get('/user/my-profile', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: 'غير مصرح. يرجى تسجيل الدخول بحساب ديسكورد.' });
    return;
  }
  const allRoles = db.getRoles();
  const allTiers = db.getTiers();
  const resolvedRoles = resolveUserRoles(user.assignedRoles, allRoles);
  const tierDef = getTierDefinition(user.tier, allTiers);

  res.json({
    profile: user,
    roles: resolvedRoles,
    tierDefinition: tierDef,
  });
});

// ==========================================
// --- PROTECTED ADMINISTRATOR ENDPOINTS ---
// ==========================================

// Complete admin panel state
apiRouter.get('/admin/data', requireAdmin, (req: Request, res: Response) => {
  const settings = db.getSettings();
  const testServers = db.getTestServers();
  const testers = db.getTesters();
  const leaderboard = db.getLeaderboardPlayersAdmin();
  const newsArticles = db.getNewsArticles();
  const roles = db.getRoles();
  const users = db.getAllUsers();
  const tiers = db.getTiers();
  const loginLogs = db.getLoginLogs();

  res.json({
    settings,
    testServers,
    testers,
    leaderboard,
    newsArticles,
    roles,
    users,
    tiers,
    loginLogs,
  });
});

// 1. Update Website Settings (Server name, logo URL, YouTube URL, Discord invite, Owner info, About text, Tier Test text, News text)
apiRouter.patch('/admin/settings', requireAdmin, async (req: Request, res: Response) => {
  const {
    serverName,
    logoUrl,
    youtubeUrl,
    discordInviteUrl,
    ownerDiscordId,
    ownerName,
    ownerAvatar,
    ownerTag,
    aboutContent,
    tierTestContent,
    newsContent,
    welcomeBadgeText,
  } = req.body;

  const updates: any = {};
  if (typeof serverName === 'string') updates.serverName = serverName.trim();
  if (typeof logoUrl === 'string') updates.logoUrl = logoUrl.trim();
  if (typeof youtubeUrl === 'string') updates.youtubeUrl = youtubeUrl.trim();
  if (typeof discordInviteUrl === 'string') updates.discordInviteUrl = discordInviteUrl.trim();
  if (typeof ownerDiscordId === 'string') {
    updates.ownerDiscordId = ownerDiscordId.trim();
    // If owner Discord ID is supplied, attempt to autofill name & avatar if user exists
    const matchedUser = db.getUser(ownerDiscordId.trim());
    if (matchedUser) {
      if (!ownerName) updates.ownerName = matchedUser.globalName || matchedUser.username;
      if (!ownerAvatar) updates.ownerAvatar = matchedUser.avatar;
    } else if (ownerDiscordId.trim()) {
      if (!ownerAvatar) updates.ownerAvatar = resolveDiscordAvatar(ownerDiscordId.trim());
    }
  }
  if (typeof ownerName === 'string') updates.ownerName = ownerName.trim();
  if (typeof ownerAvatar === 'string') updates.ownerAvatar = ownerAvatar.trim();
  if (typeof ownerTag === 'string') updates.ownerTag = ownerTag.trim();
  if (typeof aboutContent === 'string') updates.aboutContent = aboutContent;
  if (typeof tierTestContent === 'string') updates.tierTestContent = tierTestContent;
  if (typeof newsContent === 'string') updates.newsContent = newsContent;
  if (typeof welcomeBadgeText === 'string') updates.welcomeBadgeText = welcomeBadgeText.trim();

  const updatedSettings = await db.updateSettings(updates);
  res.json({ success: true, settings: updatedSettings });
});

// 2. Manage Supported Servers
apiRouter.post('/admin/servers', requireAdmin, async (req: Request, res: Response) => {
  const { name, info, imageUrl, order } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'اسم السيرفر مطلوب.' });
    return;
  }

  const newServer = await db.addTestServer({
    name: name.trim(),
    info: (info || '').trim(),
    imageUrl: imageUrl ? String(imageUrl).trim() : undefined,
    order: typeof order === 'number' ? order : 1,
  });

  res.status(201).json({ success: true, server: newServer });
});

apiRouter.put('/admin/servers/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, info, imageUrl, order } = req.body;

  const updated = await db.updateTestServer(id, {
    ...(name !== undefined ? { name: String(name).trim() } : {}),
    ...(info !== undefined ? { info: String(info).trim() } : {}),
    ...(imageUrl !== undefined ? { imageUrl: String(imageUrl).trim() } : {}),
    ...(typeof order === 'number' ? { order } : {}),
  });

  if (!updated) {
    res.status(404).json({ error: 'السيرفر غير موجود.' });
    return;
  }

  res.json({ success: true, server: updated });
});

apiRouter.delete('/admin/servers/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = await db.deleteTestServer(id);
  if (!deleted) {
    res.status(404).json({ error: 'السيرفر غير موجود.' });
    return;
  }
  res.json({ success: true, message: 'تم حذف السيرفر بنجاح.' });
});

// 3. Manage Leaderboard Entries & Tests
apiRouter.post('/admin/leaderboard', requireAdmin, async (req: Request, res: Response) => {
  const { minecraftName, discordId, discordDisplayName, discordUsername, discordAvatar, tierName, gamesPlayed, notes } = req.body;

  // Validate Minecraft name
  if (!minecraftName || typeof minecraftName !== 'string' || !minecraftName.trim()) {
    res.status(400).json({ error: 'اسم اللاعب في ماين كرافت (Minecraft Username) مطلوب.' });
    return;
  }

  // Validate Discord User ID
  const validation = validateDiscordId(discordId);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const cleanTier = (tierName || 'HT1').trim().toUpperCase();

  const newPlayer = await db.addLeaderboardPlayer({
    minecraftName: minecraftName.trim(),
    discordId: discordId.trim(),
    discordDisplayName: discordDisplayName ? String(discordDisplayName).trim() : undefined,
    discordUsername: discordUsername ? String(discordUsername).trim() : undefined,
    discordAvatar: discordAvatar ? String(discordAvatar).trim() : undefined,
    tierName: cleanTier,
    gamesPlayed: Array.isArray(gamesPlayed) ? gamesPlayed : [],
    notes: notes ? String(notes).trim() : '',
  });

  res.status(201).json({ success: true, player: newPlayer });
});

apiRouter.put('/admin/leaderboard/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { minecraftName, discordId, discordDisplayName, discordUsername, discordAvatar, tierName, gamesPlayed, notes } = req.body;

  const updates: any = {};
  if (minecraftName !== undefined) {
    if (!String(minecraftName).trim()) {
      res.status(400).json({ error: 'اسم اللاعب في ماين كرافت لا يمكن أن يكون فارغاً.' });
      return;
    }
    updates.minecraftName = String(minecraftName).trim();
  }

  if (discordId !== undefined) {
    const validation = validateDiscordId(discordId);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }
    updates.discordId = String(discordId).trim();
  }

  if (discordDisplayName !== undefined) {
    updates.discordDisplayName = String(discordDisplayName).trim();
  }

  if (discordUsername !== undefined) {
    updates.discordUsername = String(discordUsername).trim();
  }

  if (discordAvatar !== undefined) {
    updates.discordAvatar = String(discordAvatar).trim();
  }

  if (tierName !== undefined) {
    updates.tierName = String(tierName).trim().toUpperCase();
    updates.tierRank = getTierRank(updates.tierName);
  }

  if (gamesPlayed !== undefined) {
    updates.gamesPlayed = Array.isArray(gamesPlayed) ? gamesPlayed : [];
  }

  if (notes !== undefined) {
    updates.notes = String(notes).trim();
  }

  const updated = await db.updateLeaderboardPlayer(id, updates);
  if (!updated) {
    res.status(404).json({ error: 'اللاعب غير موجود في لوحة الصدارة.' });
    return;
  }

  res.json({ success: true, player: updated });
});

apiRouter.delete('/admin/leaderboard/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = await db.deleteLeaderboardPlayer(id);
  if (!deleted) {
    res.status(404).json({ error: 'Leaderboard entry not found.' });
    return;
  }
  res.json({ success: true, message: 'Player removed from leaderboard.' });
});

// Helper for admin to lookup Discord User info from snowflake ID (supports offline & invisible users)
apiRouter.get('/admin/discord-lookup/:discordId', requireAdmin, async (req: Request, res: Response) => {
  const { discordId } = req.params;
  const validation = validateDiscordId(discordId);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const cleanId = discordId.trim();

  // 1. Check persistent database cache first
  const cachedProfile = db.getCachedDiscordProfile(cleanId);
  if (cachedProfile && cachedProfile.username) {
    res.json({
      found: true,
      source: 'database_cache',
      username: cachedProfile.username,
      displayName: cachedProfile.displayName || cachedProfile.username,
      avatar: cachedProfile.avatar,
    });
    return;
  }

  // 2. Check if user already exists in persistent database
  const existingUser = db.getUser(cleanId);
  if (existingUser && existingUser.username && existingUser.avatar && !existingUser.avatar.includes('/embed/avatars/')) {
    const profile = {
      username: existingUser.username,
      displayName: existingUser.globalName || existingUser.username,
      avatar: existingUser.avatar,
    };
    await db.cacheDiscordProfile(cleanId, profile);
    res.json({
      found: true,
      source: 'database_user',
      ...profile,
    });
    return;
  }

  // 3. Check if Discord Bot token is available in environment
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (botToken) {
    try {
      const resp = await fetch(`https://discord.com/api/v10/users/${cleanId}`, {
        headers: { Authorization: `Bot ${botToken}` },
        signal: AbortSignal.timeout(4000),
      });
      if (resp.ok) {
        const d = await resp.json() as any;
        let avatarUrl = '';
        if (d.avatar) {
          const isGif = d.avatar.startsWith('a_');
          avatarUrl = `https://cdn.discordapp.com/avatars/${d.id}/${d.avatar}.${isGif ? 'gif' : 'png'}?size=256`;
        } else {
          avatarUrl = resolveDiscordAvatar(cleanId);
        }
        const profile = {
          username: d.username,
          displayName: d.global_name || d.username,
          avatar: avatarUrl,
        };
        await db.cacheDiscordProfile(cleanId, profile);
        res.json({
          found: true,
          source: 'discord_bot_api',
          ...profile,
        });
        return;
      }
    } catch (err) {
      console.warn('Bot API lookup failed:', err);
    }
  }

  // 4. Query public Discord user profile resolver
  try {
    const japiResp = await fetch(`https://japi.rest/discord/v1/user/${cleanId}`, {
      headers: {
        'User-Agent': 'WhiteKingdom-PvP/1.0',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(4000),
    });
    if (japiResp.ok) {
      const jdata = await japiResp.json() as any;
      if (jdata?.data && !jdata.data.message && jdata.data.username) {
        const d = jdata.data;
        const avatarUrl = d.avatarURL || resolveDiscordAvatar(cleanId);
        const profile = {
          username: d.username,
          displayName: d.global_name || d.username,
          avatar: avatarUrl,
        };
        await db.cacheDiscordProfile(cleanId, profile);
        res.json({
          found: true,
          source: 'discord_public_api',
          ...profile,
          banner: d.bannerURL || null,
        });
        return;
      }
    }
  } catch (err) {
    console.warn('Public resolver lookup failed:', err);
  }

  // 5. Existing user record fallback even if default avatar
  if (existingUser) {
    const profile = {
      username: existingUser.username,
      displayName: existingUser.globalName || existingUser.username,
      avatar: existingUser.avatar || resolveDiscordAvatar(cleanId),
    };
    await db.cacheDiscordProfile(cleanId, profile);
    res.json({
      found: true,
      source: 'database_user',
      ...profile,
    });
    return;
  }

  // 6. Mathematical deterministic fallback for offline / unreachable users
  // Formula: (BigInt(discordId) >> 22n) % 6n guarantees exact Discord default avatar
  const fallbackAvatar = resolveDiscordAvatar(cleanId);
  const fallbackProfile = {
    username: `user_${cleanId.slice(-4)}`,
    displayName: `User ${cleanId.slice(-4)}`,
    avatar: fallbackAvatar,
  };
  await db.cacheDiscordProfile(cleanId, fallbackProfile);
  res.json({
    found: true,
    source: 'discord_cdn_deterministic',
    ...fallbackProfile,
  });
});

// 4. Server Roles Management (Custom Roles with color & emoji)
apiRouter.post('/admin/roles', requireAdmin, async (req: Request, res: Response) => {
  const { name, color, emoji, order, description, criteria, showInList } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'اسم الرول مطلوب.' });
    return;
  }
  const newRole = await db.addRole({
    name: name.trim(),
    color: color ? String(color).trim() : '#00e5ff',
    emoji: emoji ? String(emoji).trim() : '🛡️',
    order: typeof order === 'number' ? order : 1,
    description: description ? String(description).trim() : '',
    criteria: criteria ? String(criteria).trim() : '',
    showInList: showInList !== undefined ? !!showInList : true,
  });
  res.status(201).json({ success: true, role: newRole });
});

apiRouter.put('/admin/roles/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, color, emoji, order, description, criteria, showInList } = req.body;
  const updated = await db.updateRole(id, {
    ...(name !== undefined ? { name: String(name).trim() } : {}),
    ...(color !== undefined ? { color: String(color).trim() } : {}),
    ...(emoji !== undefined ? { emoji: String(emoji).trim() } : {}),
    ...(typeof order === 'number' ? { order } : {}),
    ...(description !== undefined ? { description: String(description).trim() } : {}),
    ...(criteria !== undefined ? { criteria: String(criteria).trim() } : {}),
    ...(showInList !== undefined ? { showInList: !!showInList } : {}),
  });
  if (!updated) {
    res.status(404).json({ error: 'الرول غير موجود.' });
    return;
  }
  res.json({ success: true, role: updated });
});

apiRouter.delete('/admin/roles/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = await db.deleteRole(id);
  if (!deleted) {
    res.status(404).json({ error: 'الرول غير موجود.' });
    return;
  }
  res.json({ success: true, message: 'تم حذف الرول بنجاح.' });
});

// 5. News & Announcements Management
apiRouter.post('/admin/news', requireAdmin, async (req: Request, res: Response) => {
  const { title, content, category, imageUrl, pinned } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: 'عنوان الخبر مطلوب.' });
    return;
  }
  if (!content || typeof content !== 'string' || !content.trim()) {
    res.status(400).json({ error: 'محتوى الخبر مطلوب.' });
    return;
  }
  const newArticle = await db.addNewsArticle({
    title: title.trim(),
    content: content.trim(),
    category: category ? String(category).trim() : 'إعلان',
    imageUrl: imageUrl ? String(imageUrl).trim() : undefined,
    pinned: !!pinned,
  });
  res.status(201).json({ success: true, article: newArticle });
});

apiRouter.put('/admin/news/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content, category, imageUrl, pinned } = req.body;
  const updated = await db.updateNewsArticle(id, {
    ...(title !== undefined ? { title: String(title).trim() } : {}),
    ...(content !== undefined ? { content: String(content).trim() } : {}),
    ...(category !== undefined ? { category: String(category).trim() } : {}),
    ...(imageUrl !== undefined ? { imageUrl: String(imageUrl).trim() } : {}),
    ...(pinned !== undefined ? { pinned: !!pinned } : {}),
  });
  if (!updated) {
    res.status(404).json({ error: 'الخبر غير موجود.' });
    return;
  }
  res.json({ success: true, article: updated });
});

apiRouter.delete('/admin/news/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = await db.deleteNewsArticle(id);
  if (!deleted) {
    res.status(404).json({ error: 'الخبر غير موجود.' });
    return;
  }
  res.json({ success: true, message: 'تم حذف الخبر بنجاح.' });
});

// --- Custom Tiers Management (Add tiers, edit colors/labels/ranks, delete) ---
apiRouter.post('/admin/tiers', requireAdmin, async (req: Request, res: Response) => {
  const { name, color, label, rank } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'اسم التصنيف (Tier Name) مطلوب.' });
    return;
  }
  if (!color || typeof color !== 'string' || !color.trim()) {
    res.status(400).json({ error: 'لون التصنيف (Tier Color) مطلوب.' });
    return;
  }

  const newTier = await db.addTier({
    name: name.trim().toUpperCase(),
    color: color.trim(),
    label: label ? String(label).trim() : undefined,
    rank: typeof rank === 'number' ? rank : undefined,
  });

  res.status(201).json({
    success: true,
    tier: newTier,
    tiers: db.getTiers(),
    message: `تم إضافة/تحديث المستوى ${newTier.name} بنجاح.`,
  });
});

apiRouter.put('/admin/tiers/:name', requireAdmin, async (req: Request, res: Response) => {
  const { name } = req.params;
  const { name: newName, color, label, rank } = req.body;

  const updated = await db.updateTier(name, {
    ...(newName ? { name: String(newName).trim().toUpperCase() } : {}),
    ...(color ? { color: String(color).trim() } : {}),
    ...(label !== undefined ? { label: String(label).trim() } : {}),
    ...(typeof rank === 'number' ? { rank } : {}),
  });

  if (!updated) {
    res.status(404).json({ error: 'المستوى غير موجود.' });
    return;
  }

  res.json({
    success: true,
    tier: updated,
    tiers: db.getTiers(),
    message: `تم تحديث المستوى ${updated.name} بنجاح.`,
  });
});

apiRouter.delete('/admin/tiers/:name', requireAdmin, async (req: Request, res: Response) => {
  const { name } = req.params;
  const deleted = await db.deleteTier(name);
  if (!deleted) {
    res.status(404).json({ error: 'المستوى غير موجود.' });
    return;
  }

  res.json({
    success: true,
    tiers: db.getTiers(),
    message: `تم حذف المستوى ${name.toUpperCase()} بنجاح.`,
  });
});

apiRouter.post('/admin/tiers/reset', requireAdmin, async (req: Request, res: Response) => {
  const resetTiers = await db.resetTiers();
  res.json({
    success: true,
    tiers: resetTiers,
    message: 'تمت استعادة تصنيفات ومستويات السيرفر الافتراضية بنجاح.',
  });
});

// 6. Direct Image Upload from Device (handles file uploads with base64 data URLs)
apiRouter.post('/admin/upload', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { dataUrl, filename } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string') {
      res.status(400).json({ error: 'لم يتم إرسال بيانات الصورة (dataUrl مطلوب).' });
      return;
    }

    const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!match) {
      res.status(400).json({ error: 'صيغة ملف الصورة غير صحيحة. يرجى رفع صورة بصيغة صالحة (PNG, JPG, WebP, GIF).' });
      return;
    }

    let ext = match[1].toLowerCase();
    if (ext === 'jpeg') ext = 'jpg';
    if (ext === 'svg+xml') ext = 'svg';
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Limit image size to 15MB
    if (buffer.length > 15 * 1024 * 1024) {
      res.status(400).json({ error: 'حجم الصورة كبير جداً. الحد الأقصى هو 15 ميغابايت.' });
      return;
    }

    const uploadsDir = path.resolve(process.cwd(), 'data', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safeRand = crypto.randomBytes(6).toString('hex');
    const savedName = `wk_${Date.now()}_${safeRand}.${ext}`;
    const filePath = path.join(uploadsDir, savedName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${savedName}`;
    res.json({
      success: true,
      url: publicUrl,
      size: buffer.length,
      filename: savedName,
    });
  } catch (err: any) {
    console.error('Image upload error:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء حفظ الصورة على السيرفر.' });
  }
});

// 7. Administrator Discord Profiles, Roles & Ratings Management
// Allows admin to create/manage player profiles by Discord ID without requiring player to log in first!
apiRouter.get('/admin/profiles', requireAdmin, (_req: Request, res: Response) => {
  const profiles = db.getAllProfiles();
  const roles = db.getRoles();
  const tiers = db.getTiers();
  res.json({ profiles, roles, tiers });
});

apiRouter.get('/admin/profiles/:discordId', requireAdmin, (req: Request, res: Response) => {
  const { discordId } = req.params;
  const profile = db.getProfile(discordId);
  if (!profile) {
    res.status(404).json({ error: 'الملف الشخصي غير موجود.' });
    return;
  }
  res.json({ profile });
});

apiRouter.post('/admin/profiles', requireAdmin, async (req: Request, res: Response) => {
  const { discordId, username, globalName, avatar, assignedRoles, tier, evaluationNotes } = req.body;
  const validation = validateDiscordId(discordId);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const cleanId = String(discordId).trim();
  const adminUser = getSessionUser(req);
  const evaluatorName = adminUser?.globalName || adminUser?.username || 'الإدارة';

  const profile = await db.upsertAdminProfile({
    discordId: cleanId,
    username: username ? String(username).trim() : undefined,
    globalName: globalName ? String(globalName).trim() : undefined,
    avatar: avatar ? String(avatar).trim() : undefined,
    assignedRoles: Array.isArray(assignedRoles) ? assignedRoles.map(String) : [],
    tier: tier ? String(tier).trim().toUpperCase() : undefined,
    evaluationNotes: evaluationNotes ? String(evaluationNotes).trim() : undefined,
    evaluatorName,
  });

  res.status(201).json({
    success: true,
    profile,
    message: 'تم حفظ الملف الشخصي وتعيين الرولات والتقييم بنجاح.',
  });
});

apiRouter.put('/admin/profiles/:discordId', requireAdmin, async (req: Request, res: Response) => {
  const { discordId } = req.params;
  const validation = validateDiscordId(discordId);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const cleanId = String(discordId).trim();
  const { username, globalName, avatar, assignedRoles, tier, evaluationNotes } = req.body;
  const adminUser = getSessionUser(req);
  const evaluatorName = adminUser?.globalName || adminUser?.username || 'الإدارة';

  const profile = await db.upsertAdminProfile({
    discordId: cleanId,
    username: username !== undefined ? String(username).trim() : undefined,
    globalName: globalName !== undefined ? String(globalName).trim() : undefined,
    avatar: avatar !== undefined ? String(avatar).trim() : undefined,
    assignedRoles: Array.isArray(assignedRoles) ? assignedRoles.map(String) : undefined,
    tier: tier !== undefined ? (tier ? String(tier).trim().toUpperCase() : '') : undefined,
    evaluationNotes: evaluationNotes !== undefined ? String(evaluationNotes).trim() : undefined,
    evaluatorName,
  });

  res.json({
    success: true,
    profile,
    message: 'تم تحديث الملف الشخصي بنجاح.',
  });
});

apiRouter.delete('/admin/profiles/:discordId', requireAdmin, async (req: Request, res: Response) => {
  const { discordId } = req.params;
  const deleted = await db.deleteProfile(discordId);
  if (!deleted) {
    res.status(404).json({ error: 'الملف الشخصي غير موجود.' });
    return;
  }
  res.json({ success: true, message: 'تم حذف الملف الشخصي بنجاح.' });
});

// 8. Tier Testers Management (Add, update, delete, reorder)
apiRouter.post('/admin/testers', requireAdmin, async (req: Request, res: Response) => {
  const { discordId, minecraftName, discordUsername, discordDisplayName, discordAvatar, specialty, order, notes } = req.body;
  
  if (!minecraftName || typeof minecraftName !== 'string' || !minecraftName.trim()) {
    res.status(400).json({ error: 'اسم اللاعب في ماين كرافت (Minecraft IGN) مطلوب.' });
    return;
  }

  const validation = validateDiscordId(discordId);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const newTester = await db.addTester({
    discordId: String(discordId).trim(),
    minecraftName: String(minecraftName).trim(),
    discordUsername: discordUsername ? String(discordUsername).trim() : undefined,
    discordDisplayName: discordDisplayName ? String(discordDisplayName).trim() : undefined,
    discordAvatar: discordAvatar ? String(discordAvatar).trim() : undefined,
    specialty: specialty ? String(specialty).trim() : undefined,
    order: typeof order === 'number' ? order : undefined,
    notes: notes ? String(notes).trim() : undefined,
  });

  res.status(201).json({
    success: true,
    tester: newTester,
    testers: db.getTesters(),
    message: 'تم إضافة المختبر الرسمي بنجاح.',
  });
});

apiRouter.put('/admin/testers/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const updated = await db.updateTester(id, updates);
  if (!updated) {
    res.status(404).json({ error: 'المختبر غير موجود.' });
    return;
  }

  res.json({
    success: true,
    tester: updated,
    testers: db.getTesters(),
    message: 'تم تحديث بيانات المختبر بنجاح.',
  });
});

apiRouter.delete('/admin/testers/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = await db.deleteTester(id);
  if (!deleted) {
    res.status(404).json({ error: 'المختبر غير موجود.' });
    return;
  }

  res.json({
    success: true,
    testers: db.getTesters(),
    message: 'تم حذف المختبر بنجاح.',
  });
});

apiRouter.post('/admin/testers/reorder', requireAdmin, async (req: Request, res: Response) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) {
    res.status(400).json({ error: 'قائمة ترتيب المختبرين مطلوبة.' });
    return;
  }

  const testers = await db.reorderTesters(orderedIds);
  res.json({
    success: true,
    testers,
    message: 'تم حفظ ترتيب المختبرين بنجاح.',
  });
});

// 9. Login Logs and User Management Endpoints
apiRouter.get('/admin/login-logs', requireAdmin, (_req: Request, res: Response) => {
  const logs = db.getLoginLogs();
  const users = db.getAllUsers();
  res.json({ logs, users });
});

apiRouter.patch('/admin/users/:discordId/minecraft-name', requireAdmin, async (req: Request, res: Response) => {
  const { discordId } = req.params;
  const { minecraftName } = req.body;

  const updated = await db.updateUserMinecraftName(discordId, String(minecraftName || ''));
  if (!updated) {
    res.status(404).json({ error: 'المستخدم غير موجود في قاعدة البيانات.' });
    return;
  }

  res.json({
    success: true,
    user: updated,
    message: 'تم تحديث اسم حساب ماين كرافت بنجاح.',
  });
});



