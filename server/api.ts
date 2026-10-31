import express, { Request, Response } from 'express';
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
import { validateDiscordId, resolveDiscordAvatar, getTierRank } from '../src/utils/pvpLogic.ts';

export const apiRouter = express.Router();

// --- Public Configuration & App Data ---
apiRouter.get('/config', (req: Request, res: Response) => {
  const isDiscordConfigured = !!(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET);
  const redirectUri = getRedirectUri(req);
  const settings = db.getSettings();

  res.json({
    serverName: settings.serverName,
    logoUrl: settings.logoUrl,
    youtubeUrl: settings.youtubeUrl,
    isDiscordConfigured,
    discordClientId: process.env.DISCORD_CLIENT_ID ? 'Configured (Active)' : null,
    redirectUri,
  });
});

apiRouter.get('/public-data', (req: Request, res: Response) => {
  const settings = db.getSettings();
  const testServers = db.getTestServers();
  const leaderboard = db.getLeaderboardPublic();
  const newsArticles = db.getNewsArticles();
  const roles = db.getRoles();
  const tiers = db.getTiers();

  res.json({
    settings,
    testServers,
    leaderboard,
    newsArticles,
    roles,
    tiers,
  });
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
      console.error('Discord token exchange failed:', errBody);
      throw new Error(`Failed to exchange code: ${tokenResponse.statusText}`);
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

// Development / Testing Instant Login endpoint
apiRouter.post('/auth/dev-login', async (req: Request, res: Response) => {
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

// ==========================================
// --- PROTECTED ADMINISTRATOR ENDPOINTS ---
// ==========================================

// Complete admin panel state
apiRouter.get('/admin/data', requireAdmin, (req: Request, res: Response) => {
  const settings = db.getSettings();
  const testServers = db.getTestServers();
  const leaderboard = db.getLeaderboardPlayersAdmin();
  const newsArticles = db.getNewsArticles();
  const roles = db.getRoles();
  const users = db.getAllUsers();
  const tiers = db.getTiers();

  res.json({
    settings,
    testServers,
    leaderboard,
    newsArticles,
    roles,
    users,
    tiers,
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

// Helper for admin to lookup Discord User info from snowflake ID
apiRouter.get('/admin/discord-lookup/:discordId', requireAdmin, async (req: Request, res: Response) => {
  const { discordId } = req.params;
  const validation = validateDiscordId(discordId);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const cleanId = discordId.trim();

  // 1. Check if user already exists in persistent database
  const existingUser = db.getUser(cleanId);
  if (existingUser && existingUser.avatar && !existingUser.avatar.includes('/embed/avatars/')) {
    res.json({
      found: true,
      source: 'database_user',
      username: existingUser.username,
      displayName: existingUser.globalName || existingUser.username,
      avatar: existingUser.avatar,
    });
    return;
  }

  // 2. Check if Discord Bot token is available in environment
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
        res.json({
          found: true,
          source: 'discord_bot_api',
          username: d.username,
          displayName: d.global_name || d.username,
          avatar: avatarUrl,
        });
        return;
      }
    } catch (err) {
      console.warn('Bot API lookup failed:', err);
    }
  }

  // 3. Query high-reliability public Discord user profile resolver
  try {
    const japiResp = await fetch(`https://japi.rest/discord/v1/user/${cleanId}`, {
      headers: {
        'User-Agent': 'WhiteKingdom-PvP/1.0',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });
    if (japiResp.ok) {
      const jdata = await japiResp.json() as any;
      if (jdata?.data && !jdata.data.message && jdata.data.username) {
        const d = jdata.data;
        const avatarUrl = d.avatarURL || resolveDiscordAvatar(cleanId);
        res.json({
          found: true,
          source: 'discord_public_api',
          username: d.username,
          displayName: d.global_name || d.username,
          avatar: avatarUrl,
          banner: d.bannerURL || null,
        });
        return;
      }
    }
  } catch (err) {
    console.warn('japi lookup failed:', err);
  }

  // 4. Secondary fallback: check existingUser even if fallback avatar
  if (existingUser) {
    res.json({
      found: true,
      source: 'database_user',
      username: existingUser.username,
      displayName: existingUser.globalName || existingUser.username,
      avatar: existingUser.avatar,
    });
    return;
  }

  // 5. Mathematical fallback using Discord CDN avatar algorithm
  const fallbackAvatar = resolveDiscordAvatar(cleanId);
  res.json({
    found: true,
    source: 'discord_cdn',
    username: `user_${cleanId.slice(-4)}`,
    displayName: `Player ${cleanId.slice(-4)}`,
    avatar: fallbackAvatar,
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

