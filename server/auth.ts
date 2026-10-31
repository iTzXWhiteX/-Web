import { Request, Response, NextFunction } from 'express';
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
 */
export function generateOAuthState(redirectUri: string): { state: string; signedToken: string } {
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  const payload = `${nonce}:${timestamp}:${redirectUri}`;
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  const signedToken = Buffer.from(`${payload}:${sig}`).toString('base64url');
  return { state: nonce, signedToken };
}

/**
 * Validates the OAuth2 state parameter against the HMAC-signed token to protect against CSRF attacks.
 */
export function verifyOAuthState(
  incomingState: string,
  signedToken: string | undefined
): { valid: boolean; redirectUri?: string } {
  if (!incomingState || !signedToken) return { valid: false };

  try {
    const decoded = Buffer.from(signedToken, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length < 4) return { valid: false };

    const nonce = parts[0];
    const timestampStr = parts[1];
    const sig = parts[parts.length - 1];
    const redirectUri = parts.slice(2, parts.length - 1).join(':');

    // Validate 15-minute expiration
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp) || Date.now() - timestamp > 15 * 60 * 1000) {
      return { valid: false };
    }

    // Verify HMAC signature
    const payload = `${nonce}:${timestampStr}:${redirectUri}`;
    const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');

    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return { valid: false };
    }

    // Verify incoming state nonce matches original nonce
    if (nonce !== incomingState) {
      return { valid: false };
    }

    return { valid: true, redirectUri };
  } catch (err) {
    return { valid: false };
  }
}

export function setOAuthStateCookie(res: Response, signedToken: string): void {
  res.cookie(OAUTH_STATE_COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 15 * 60 * 1000,
    path: '/',
  });
}

export function clearOAuthStateCookie(res: Response): void {
  res.clearCookie(OAUTH_STATE_COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
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
 * Uses query or request headers if valid, otherwise falls back to APP_URL.
 */
export function getRedirectUri(req: Request): string {
  const appUrl = process.env.APP_URL;
  if (appUrl) {
    const cleanUrl = appUrl.startsWith('http') ? appUrl : `https://${appUrl}`;
    return `${cleanUrl.replace(/\/$/, '')}/auth/callback`;
  }
  const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
  const proto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
  return `${proto}://${host}/auth/callback`;
}

export function setSessionCookie(res: Response, token: string): void {
  // If running in development on plain HTTP localhost, secure: false allows browser to accept cookie
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

