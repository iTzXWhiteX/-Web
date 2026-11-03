import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db } from './db.ts';
import type { UserProfile } from '../src/types/pvp.ts';

const SESSION_COOKIE_NAME = 'wk_session_token';
const SESSION_SECRET = process.env.SESSION_SECRET || 'white_kingdom_pvp_secret_key_2026';

// In-memory active session map: token -> { discordId, expiresAt }
interface SessionData {
  discordId: string;
  createdAt: number;
}
const activeSessions = new Map<string, SessionData>();

export function createSessionToken(discordId: string): string {
  const payload = `${discordId}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`;
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  const token = Buffer.from(`${payload}:${hmac}`).toString('base64url');
  activeSessions.set(token, {
    discordId,
    createdAt: Date.now(),
  });
  return token;
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;

  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 4) return null;

    const [discordId, timestamp, nonce, signature] = parts;
    const payload = `${discordId}:${timestamp}:${nonce}`;
    const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return discordId;
    }
  } catch (err) {
    // Invalid token format
    return null;
  }
  return null;
}

export function getSessionUser(req: Request): UserProfile | null {
  const token = req.cookies?.[SESSION_COOKIE_NAME] || req.headers['authorization']?.replace('Bearer ', '');
  const discordId = verifySessionToken(token);
  if (!discordId) return null;

  const user = db.getUser(discordId);
  if (!user) {
    // If user record doesn't exist yet, create basic stub
    return db.upsertUserSync({ discordId });
  }

  // Ensure admin status is fresh
  user.isAdmin = db.isAdmin(discordId);
  return user;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required. Please log in with Discord.' });
    return;
  }
  (req as any).user = user;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required. Please log in with Discord.' });
    return;
  }

  const isAdmin = db.isAdmin(user.discordId);
  if (!isAdmin) {
    res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    return;
  }

  (req as any).user = user;
  next();
}

export const OAUTH_STATE_COOKIE_NAME = 'wk_oauth_state';

/**
 * Generates an HMAC-signed CSRF state token embedding a random nonce, timestamp, and redirect URI.
 * The signed token is used directly as the Discord OAuth2 state parameter, ensuring immunity to
 * third-party cookie restrictions in popups and embedded environments while remaining 100% tamper-proof.
 */
export function generateOAuthState(redirectUri: string): { state: string; signedToken: string } {
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  const payload = `${nonce}:${timestamp}:${redirectUri}`;
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  const signedToken = Buffer.from(`${payload}:${sig}`).toString('base64url');
  // Use signedToken as the state parameter so Discord returns it in query on callback
  return { state: signedToken, signedToken };
}

/**
 * Validates the OAuth2 state parameter against the HMAC signature to protect against CSRF attacks.
 * Accepts either the signed state returned by Discord in query parameters, or the signed token cookie.
 */
export function verifyOAuthState(
  incomingState: string,
  signedToken?: string
): { valid: boolean; redirectUri?: string } {
  // Check the incoming state parameter first (which is the signed token), then the fallback cookie
  const candidateTokens = [incomingState, signedToken].filter(Boolean) as string[];

  for (const token of candidateTokens) {
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf-8');
      const parts = decoded.split(':');
      if (parts.length < 4) continue;

      const nonce = parts[0];
      const timestampStr = parts[1];
      const sig = parts[parts.length - 1];
      const redirectUri = parts.slice(2, parts.length - 1).join(':');

      // Validate 15-minute expiration
      const timestamp = parseInt(timestampStr, 10);
      if (isNaN(timestamp) || Date.now() - timestamp > 15 * 60 * 1000) {
        continue;
      }

      // Verify HMAC signature
      const payload = `${nonce}:${timestampStr}:${redirectUri}`;
      const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');

      if (sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
        return { valid: true, redirectUri };
      }
    } catch {
      // Continue to next candidate
    }
  }

  return { valid: false };
}

export function setOAuthStateCookie(res: Response, signedToken: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(OAUTH_STATE_COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000,
    path: '/',
  });
}

export function clearOAuthStateCookie(res: Response): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie(OAUTH_STATE_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  });
}

/**
 * Returns administrator Discord User IDs configured via ADMIN_DISCORD_IDS environment variable.
 */
export function getAdminDiscordIds(): string[] {
  const envVal = process.env.ADMIN_DISCORD_IDS || '';
  return envVal
    .split(/[\s,;]+/)
    .map(id => id.trim())
    .filter(id => /^\d{17,20}$/.test(id));
}

/**
 * Returns the effective redirect URI for Discord OAuth.
 * Prioritizes DISCORD_REDIRECT_URI environment variable, then valid request origins (e.g. dev or preview run.app URLs),
 * followed by forwarded host headers and APP_URL.
 */
export function getRedirectUri(req: Request): string {
  // 1. Explicit override via DISCORD_REDIRECT_URI
  if (process.env.DISCORD_REDIRECT_URI) {
    return process.env.DISCORD_REDIRECT_URI.trim();
  }

  // 2. Check client-supplied origin hint (from query or headers), ensuring it's not the aistudio container frame
  const clientOrigin = (req.query?.origin as string) || (req.headers['origin'] as string) || '';
  if (clientOrigin && typeof clientOrigin === 'string' && clientOrigin.startsWith('http')) {
    try {
      const parsed = new URL(clientOrigin);
      // Ensure we do not use the google container iframe domain
      if (!parsed.hostname.includes('aistudio.google.com')) {
        return `${parsed.protocol}//${parsed.host}/auth/callback`;
      }
    } catch {
      // Invalid URL syntax, ignore
    }
  }

  // 3. Check referer header
  const referer = req.headers['referer'] as string;
  if (referer && typeof referer === 'string' && referer.startsWith('http')) {
    try {
      const parsed = new URL(referer);
      if (!parsed.hostname.includes('aistudio.google.com')) {
        return `${parsed.protocol}//${parsed.host}/auth/callback`;
      }
    } catch {
      // Invalid referer URL, ignore
    }
  }

  // 4. Check Forwarded Host header
  const forwardedHost = req.get('x-forwarded-host');
  if (forwardedHost && !forwardedHost.includes('aistudio.google.com')) {
    const proto = req.get('x-forwarded-proto') || 'https';
    return `${proto}://${forwardedHost}/auth/callback`;
  }

  // 5. Host header
  const host = req.get('host');
  if (host && !host.includes('aistudio.google.com') && host !== 'localhost:3000' && host !== '127.0.0.1:3000') {
    const proto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
    return `${proto}://${host}/auth/callback`;
  }

  // 6. Configured APP_URL
  const appUrl = process.env.APP_URL;
  if (appUrl) {
    const cleanUrl = appUrl.startsWith('http') ? appUrl : `https://${appUrl}`;
    return `${cleanUrl.replace(/\/$/, '')}/auth/callback`;
  }

  // 7. Localhost fallback
  const fallbackProto = req.secure ? 'https' : 'http';
  return `${fallbackProto}://${host || 'localhost:3000'}/auth/callback`;
}

export function setSessionCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/',
  });
}

export function clearSessionCookie(res: Response): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  });
}



