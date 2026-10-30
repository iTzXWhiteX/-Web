import { WHITE_KINGDOM_TIERS, type TierDefinition, type LeaderboardPlayer, type PublicLeaderboardItem } from '../types/pvp.ts';

export { WHITE_KINGDOM_TIERS };

/**
 * Validates a Discord snowflake ID (17-20 numeric digits).
 */
export function validateDiscordId(id: unknown): { valid: boolean; error?: string } {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'معرّف ديسكورد (Discord User ID) مطلوب.' };
  }
  const trimmed = id.trim();
  if (!/^\d{17,20}$/.test(trimmed)) {
    return { valid: false, error: 'صيغة معرّف الديسكورد غير صحيحة. يجب أن يتكون من 17 إلى 20 رقماً.' };
  }
  return { valid: true };
}

/**
 * Computes standard Discord CDN avatar from a snowflake ID if custom avatar is not set.
 */
export function resolveDiscordAvatar(discordId: string, customAvatar?: string): string {
  if (customAvatar && customAvatar.trim().length > 0) {
    return customAvatar;
  }
  try {
    const defaultIndex = (BigInt(discordId) >> 22n) % 6n;
    return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
  } catch {
    return 'https://cdn.discordapp.com/embed/avatars/0.png';
  }
}

/**
 * Maps a tier name string (e.g. HT1, LT1, HT2, etc.) to a ranking number (10 down to 1).
 */
export function getTierRank(tierName: string, tierDefinitions: TierDefinition[] = WHITE_KINGDOM_TIERS): number {
  if (!tierName) return 0;
  const match = tierDefinitions.find(t => t.name.toLowerCase() === tierName.trim().toLowerCase());
  return match ? match.rank : 0;
}

/**
 * Formats leaderboard players into the ordered public view containing:
 * - rank
 * - minecraftName
 * - discordDisplayName
 * - discordAvatar
 * - tierName (to display tier badge e.g. HT1)
 * - tierRank
 * - gamesPlayed (for the details popup)
 * - notes (for the details popup)
 * Strictly omits discordId to preserve user privacy as requested.
 */
export function formatPublicLeaderboard(players: LeaderboardPlayer[]): PublicLeaderboardItem[] {
  const sorted = [...players].sort((a, b) => {
    if (b.tierRank !== a.tierRank) {
      return b.tierRank - a.tierRank;
    }
    return (a.createdAt || '').localeCompare(b.createdAt || '');
  });

  return sorted.map((p, index) => ({
    id: p.id,
    rank: index + 1,
    minecraftName: p.minecraftName,
    discordDisplayName: p.discordDisplayName || `Discord_${p.discordId.slice(-4)}`,
    discordUsername: p.discordUsername || undefined,
    discordAvatar: resolveDiscordAvatar(p.discordId, p.discordAvatar),
    tierName: p.tierName || 'HT1',
    tierRank: p.tierRank || getTierRank(p.tierName || 'HT1'),
    gamesPlayed: Array.isArray(p.gamesPlayed) ? p.gamesPlayed : [],
    notes: p.notes || '',
  }));
}
