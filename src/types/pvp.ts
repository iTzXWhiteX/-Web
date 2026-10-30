export interface TierDefinition {
  name: string;        // e.g. "HT1" or "LT1"
  label: string;       // e.g. "High Tier 1"
  rank: number;        // Higher number = higher ranking (10 for HT1 down to 1 for LT5)
  color?: string;
  badgeBg?: string;
  badgeBorder?: string;
  description?: string;
}

export const WHITE_KINGDOM_TIERS: TierDefinition[] = [
  { name: 'HT1', label: 'High Tier 1 (Apex Master)', rank: 10, color: '#00e5ff', badgeBg: 'bg-cyan-500/20', badgeBorder: 'border-cyan-400/60' },
  { name: 'LT1', label: 'Low Tier 1', rank: 9, color: '#38bdf8', badgeBg: 'bg-sky-500/20', badgeBorder: 'border-sky-400/60' },
  { name: 'HT2', label: 'High Tier 2', rank: 8, color: '#0088ff', badgeBg: 'bg-blue-600/20', badgeBorder: 'border-blue-500/60' },
  { name: 'LT2', label: 'Low Tier 2', rank: 7, color: '#60a5fa', badgeBg: 'bg-blue-400/20', badgeBorder: 'border-blue-400/50' },
  { name: 'HT3', label: 'High Tier 3', rank: 6, color: '#818cf8', badgeBg: 'bg-indigo-500/20', badgeBorder: 'border-indigo-400/50' },
  { name: 'LT3', label: 'Low Tier 3', rank: 5, color: '#a5b4fc', badgeBg: 'bg-indigo-400/20', badgeBorder: 'border-indigo-300/40' },
  { name: 'HT4', label: 'High Tier 4', rank: 4, color: '#94a3b8', badgeBg: 'bg-slate-500/20', badgeBorder: 'border-slate-400/50' },
  { name: 'LT4', label: 'Low Tier 4', rank: 3, color: '#64748b', badgeBg: 'bg-slate-600/20', badgeBorder: 'border-slate-500/50' },
  { name: 'HT5', label: 'High Tier 5', rank: 2, color: '#475569', badgeBg: 'bg-slate-700/20', badgeBorder: 'border-slate-600/50' },
  { name: 'LT5', label: 'Low Tier 5 (Novice)', rank: 1, color: '#334155', badgeBg: 'bg-slate-800/30', badgeBorder: 'border-slate-700/50' },
];

export interface TestServer {
  id: string;
  name: string;
  info: string;
  imageUrl?: string; // Support for images alongside text in Tier Test list
  order: number;
}

export interface GameDiscipline {
  gameName: string;
  score?: string;
  details?: string;
}

export interface LeaderboardPlayer {
  id: string;
  minecraftName: string;
  discordId: string;
  discordDisplayName: string;
  discordUsername?: string;
  discordAvatar: string;
  tierName: string;
  tierRank: number;
  gamesPlayed?: GameDiscipline[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServerRole {
  id: string;
  name: string;
  color: string;
  emoji?: string;
  order: number;
  description?: string;
  criteria?: string;       // شروط ومن يُعطى له الرول / في أي حالة وسبب المنح
  showInList?: boolean;    // خيار يحدد هل يظهر في قائمة الرولات العامة أم يظهر فقط عند المنشن
}

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteSettings {
  serverName: string;
  logoUrl: string;
  youtubeUrl: string;
  discordInviteUrl?: string;   // رابط الانضمام لسيرفر ديسكورد
  ownerDiscordId?: string;     // آيدي ديسكورد لصاحب السيرفر والموقع
  ownerName?: string;          // اسم صاحب السيرفر من ديسكورد
  ownerAvatar?: string;        // صورة صاحب السيرفر من ديسكورد
  ownerTag?: string;           // وسم أو لقب المالك
  aboutContent: string;
  tierTestContent: string;
  newsContent?: string;
  welcomeBadgeText?: string;
}

export interface UserProfile {
  id: string;
  discordId: string;
  username: string;
  globalName?: string;
  avatar?: string;
  discriminator?: string;
  email?: string;
  bio?: string;
  createdAt: string;
  lastLogin: string;
  isAdmin: boolean;
}

// Public view of leaderboard entry with tier and popup details, with Discord ID strictly hidden
export interface PublicLeaderboardItem {
  id: string;
  rank: number;
  minecraftName: string;
  discordDisplayName: string;
  discordUsername?: string;
  discordAvatar: string;
  tierName: string;
  tierRank: number;
  gamesPlayed?: GameDiscipline[];
  notes?: string;
}
