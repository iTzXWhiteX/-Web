import React from 'react';

/**
 * Self-contained SVG data URI fallback avatar.
 * Renders an elegant gaming silhouette with cyan accents that never fails,
 * even with no network connection or blocked Discord CDN.
 */
export const FALLBACK_AVATAR_DATA_URI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0a1329"/>
          <stop offset="100%" stop-color="#030712"/>
        </linearGradient>
        <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00e5ff"/>
          <stop offset="100%" stop-color="#2563eb"/>
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="32" fill="url(#bg)"/>
      <rect x="2" y="2" width="124" height="124" rx="30" fill="none" stroke="#00e5ff" stroke-width="2" stroke-opacity="0.35"/>
      <circle cx="64" cy="48" r="22" fill="url(#glow)" opacity="0.9"/>
      <path d="M28 104 C28 82, 44 76, 64 76 C84 76, 100 82, 100 104 Z" fill="url(#glow)" opacity="0.75"/>
      <path d="M48 46 L54 52 L50 56 L44 50 Z M80 46 L74 52 L78 56 L84 50 Z" fill="#ffffff" opacity="0.9"/>
    </svg>`
  );

/**
 * Deterministically computes the Discord default embed avatar based on user snowflake ID.
 * Discord formula: (snowflake >> 22) % 6 gives index 0..5.
 */
export function getDiscordDefaultAvatar(discordId?: string | null): string {
  if (!discordId) return 'https://cdn.discordapp.com/embed/avatars/0.png';
  try {
    const clean = discordId.trim();
    if (!/^\d+$/.test(clean)) return 'https://cdn.discordapp.com/embed/avatars/0.png';
    const index = (BigInt(clean) >> 22n) % 6n;
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  } catch {
    return 'https://cdn.discordapp.com/embed/avatars/0.png';
  }
}

/**
 * Returns a valid avatar URL for a user with fallback to Discord default embed.
 */
export function resolveAvatarUrl(avatar?: string | null, discordId?: string | null): string {
  if (avatar && typeof avatar === 'string' && avatar.trim().length > 0) {
    return avatar.trim();
  }
  return getDiscordDefaultAvatar(discordId);
}

/**
 * Bulletproof onError handler for all Discord and user avatar <img> elements across the app.
 * Step 1: If custom avatar fails (404, expired CDN hash, network blip), fall back to official Discord embed avatar.
 * Step 2: If Discord CDN itself fails or is blocked, fall back to self-contained SVG data URI.
 * Guaranteed to never enter infinite loops.
 */
export function handleAvatarImgError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  discordId?: string | null
): void {
  const img = event.currentTarget;
  const stage = img.dataset.errorStage || '0';

  if (stage === '0') {
    img.dataset.errorStage = '1';
    img.src = getDiscordDefaultAvatar(discordId);
  } else if (stage === '1') {
    img.dataset.errorStage = '2';
    img.src = FALLBACK_AVATAR_DATA_URI;
  } else {
    img.onerror = null;
  }
}
