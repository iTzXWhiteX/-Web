import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  type UserProfile,
  type TestServer,
  type LeaderboardPlayer,
  type WebsiteSettings,
  type PublicLeaderboardItem,
  WHITE_KINGDOM_TIERS,
  type NewsArticle,
  type ServerRole,
} from '../src/types/pvp.ts';
import {
  resolveDiscordAvatar,
  getTierRank,
  formatPublicLeaderboard,
} from '../src/utils/pvpLogic.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'white_kingdom_db.json');

export interface DatabaseSchema {
  users: Record<string, UserProfile>; // Keyed by discordId
  adminDiscordIds: string[];
  settings: WebsiteSettings;
  testServers: TestServer[];
  leaderboard: LeaderboardPlayer[];
  newsArticles: NewsArticle[];
  roles: ServerRole[];
}

const DEFAULT_SETTINGS: WebsiteSettings = {
  serverName: '𝑾𝒉𝒊𝒕𝒆 𝑲𝒊𝒏𝒈𝒅𝒐𝒎',
  logoUrl: '/logo.png',
  youtubeUrl: 'https://www.youtube.com/@WhiteKingdom',
  discordInviteUrl: 'https://discord.gg/whitekingdom',
  ownerDiscordId: '1324725244073873539',
  ownerName: 'ᎳᎻᏆᎿᎬ ᏚᎪᎷᎪ',
  ownerAvatar: 'https://cdn.discordapp.com/avatars/1324725244073873539/94f6605b6a3c19a765e66e00e7c2caa2.png?size=256',
  ownerTag: 'صاحب السيرفر ومؤسس الموقع',
  aboutContent: `أهلاً بكم في مجتمع 𝑾𝒉𝒊𝒕𝒆 𝑲𝒊𝒏𝒈𝒅𝒐𝒎، سيرفر ديسكورد التنافسي المخصص لعشاق الألعاب والمبارزات.

تم تأسيس السيرفر لجمع اللاعبين المتميزين لخوض التحديات والمباريات الحماسية، ومشاركة الاستراتيجيات، واختبار المستويات التنافسية.

انضم إلينا في سيرفر الديسكورد لتكون جزءاً من هذا المجتمع وشارك في البطولات والتحديات المستمرة!`,
  tierTestContent: `تنبيه هام وملاحظة توضيحية:
هذا نظام اختبار وتحديد مستويات (Tier Test) مجتمعي شخصي تم إنشاؤه لاستخدامنا الخاص داخل مجتمع الألعاب وسيرفر ديسكورد 𝑾𝒉𝒊𝒕𝒆 𝑲𝒊𝒏𝒈𝒅𝒐𝒎.

هذا الاختبار ليس نظام تصنيف رسمي لأي سيرفر ماين كرافت، ولا يرتبط بأي سيرفر أو جهة أو منصة تصنيف رسمية على الإطلاق.

تُجرى الاختبارات في أي سيرفر يختاره الأدمن وبأي مود لعب، والترتيب يعكس التقييم التنافسي داخل مجتمعنا.

أدناه قائمة بالسيرفرات المعتمدة لإجراء الاختبارات، وزر عرض قائمة المتصدرين.`,
  newsContent: `تابع آخر أخبار وتحديثات مجتمع 𝑾𝒉𝒊𝒕𝒆 𝑲𝒊𝒏𝒈𝒅𝒐𝒎، مواعيد بطولات المبارزات، وقوائم التحديثات الرسمية أولاً بأول.`,
  welcomeBadgeText: `المجتمع التنافسي الرسمي 2026`,
};

const DEFAULT_NEWS: NewsArticle[] = [
  {
    id: 'news_1',
    title: 'افتتاح باب اختبارات المستويات الرسمية (Tier Tests)',
    content: 'أعلنت إدارة السيرفر عن فتح باب تقييم واختبار المستويات لجميع أعضاء المجتمع في مودات النيذرلايت والكريستال والـ Axe & Shield. يمكنكم التواصل مع الإدارة لتحديد موعد الاختبار.',
    category: 'إعلان هام',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    createdAt: '2026-10-28T18:00:00.000Z',
    updatedAt: '2026-10-28T18:00:00.000Z',
  },
  {
    id: 'news_2',
    title: 'إطلاق بطولة White Kingdom الأولى للمبارزات الثنائية',
    content: 'استعدوا لأقوى بطولة تنافسية للمبارزات في السيرفر! جوائز حصرية للمراكز الأولى، وترقية مباشرة لتصنيفات HT1 للمتوجين باللقب.',
    category: 'بطولات',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
    createdAt: '2026-10-25T14:30:00.000Z',
    updatedAt: '2026-10-25T14:30:00.000Z',
  },
];

const DEFAULT_ROLES: ServerRole[] = [
  {
    id: 'role_founder',
    name: 'Founder & Owner',
    color: '#00e5ff',
    emoji: '👑',
    order: 1,
    description: 'مؤسس السيرفر وصاحب الموقع وإدارته العليا.',
    criteria: 'تُمنح حصرياً لمالك ومؤسس سيرفر ومجتمع White Kingdom وله كامل الصلاحيات الإدارية والتقنية.',
    showInList: true,
  },
  {
    id: 'role_tester',
    name: 'Official Tester',
    color: '#38bdf8',
    emoji: '⚔️',
    order: 2,
    description: 'المسؤول عن اختبارات وتقييم المستويات والمبارزات.',
    criteria: 'تُمنح للمختبرين المعتمدين والموثوقين من قبل الإدارة بعد اجتياز فحص الخبرة في التحكيم وتقييم مهارات اللاعبين.',
    showInList: true,
  },
  {
    id: 'role_ht1',
    name: 'Tier 1 Apex',
    color: '#f59e0b',
    emoji: '🏆',
    order: 3,
    description: 'حملة تصنيف HT1 النخبوي وأعلى رتبة تنافسية.',
    criteria: 'تُمنح للمقاتلين الذين يجتازون اختبار المستويات بمستوى استثنائي (High Tier 1) ويثبتون جدارتهم في المبارزات المعتمدة.',
    showInList: true,
  },
  {
    id: 'role_gladiator',
    name: 'Gladiator',
    color: '#a855f7',
    emoji: '🛡️',
    order: 4,
    description: 'مقاتلو السيرفر المعتمدين والمشاركين بالبطولات.',
    criteria: 'تُمنح لجميع المقاتلين الذين أتموا اختبار المستوى الأولي أو شاركوا في بطولات وتحديات السيرفر.',
    showInList: true,
  },
  {
    id: 'role_member',
    name: 'Kingdom Member',
    color: '#94a3b8',
    emoji: '⚡',
    order: 5,
    description: 'أعضاء مجتمع White Kingdom.',
    criteria: 'الرول العام الممنوح لجميع الأعضاء فور انضمامهم لسيرفر الديسكورد وتوثيق عضويتهم.',
    showInList: true,
  },
];

const DEFAULT_SERVERS: TestServer[] = [
  {
    id: 'srv_1',
    name: 'Minemen Club',
    info: 'Global competitive practice network. Supported regions: EU, NA, AS. Ideal for practice duels and mechanical sparring.',
    order: 1,
  },
  {
    id: 'srv_2',
    name: 'PvP Land',
    info: 'Custom bot practice and ranked duel queues. High-tick rate testing colosseums.',
    order: 2,
  },
  {
    id: 'srv_3',
    name: 'Hypixel',
    info: 'Classic duels and tournament matches.',
    order: 3,
  },
];

const DEFAULT_USERS: Record<string, UserProfile> = {
  '184719284719284719': {
    id: 'user_white_knight',
    discordId: '184719284719284719',
    username: 'WhiteKnight',
    globalName: 'WhiteKnight',
    avatar: '/logo.png',
    discriminator: '0',
    bio: 'Founder & Head Evaluator of 𝑾𝒉𝒊𝒕𝒆 𝑲𝒊𝒏𝒈𝒅𝒐𝒎.',
    createdAt: '2026-01-01T00:00:00.000Z',
    lastLogin: '2026-10-27T10:00:00.000Z',
    isAdmin: true,
  },
  '482910482910482910': {
    id: 'user_vortex',
    discordId: '482910482910482910',
    username: 'VortexPvP',
    globalName: 'Vortex',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    bio: 'Competitive duel grinder.',
    createdAt: '2026-01-15T12:00:00.000Z',
    lastLogin: '2026-10-26T18:30:00.000Z',
    isAdmin: false,
  },
  '819203810293819201': {
    id: 'user_frostbyte',
    discordId: '819203810293819201',
    username: 'FrostByte',
    globalName: 'FrostByte',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    bio: 'Shield & timing specialist.',
    createdAt: '2026-02-01T15:20:00.000Z',
    lastLogin: '2026-10-25T20:10:00.000Z',
    isAdmin: false,
  },
  '391029384756102938': {
    id: 'user_khaos',
    discordId: '391029384756102938',
    username: 'KhaosDuelist',
    globalName: 'Khaos',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    bio: 'Fast paced duelist.',
    createdAt: '2026-02-10T09:40:00.000Z',
    lastLogin: '2026-10-24T14:15:00.000Z',
    isAdmin: false,
  },
};

const DEFAULT_LEADERBOARD: LeaderboardPlayer[] = [
  {
    id: 'lead_1',
    minecraftName: 'WhiteKnightMC',
    discordId: '184719284719284719',
    discordDisplayName: 'WhiteKnight',
    discordAvatar: '/logo.png',
    tierName: 'HT1',
    tierRank: 10,
    createdAt: '2026-01-01T12:00:00.000Z',
    updatedAt: '2026-01-01T12:00:00.000Z',
  },
  {
    id: 'lead_2',
    minecraftName: 'Vortex_1v1',
    discordId: '482910482910482910',
    discordDisplayName: 'Vortex',
    discordAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    tierName: 'HT1',
    tierRank: 10,
    createdAt: '2026-01-18T16:30:00.000Z',
    updatedAt: '2026-01-18T16:30:00.000Z',
  },
  {
    id: 'lead_3',
    minecraftName: 'FrostByte_',
    discordId: '819203810293819201',
    discordDisplayName: 'FrostByte',
    discordAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    tierName: 'LT1',
    tierRank: 9,
    createdAt: '2026-02-05T19:00:00.000Z',
    updatedAt: '2026-02-05T19:00:00.000Z',
  },
  {
    id: 'lead_4',
    minecraftName: 'KhaosDuelist',
    discordId: '391029384756102938',
    discordDisplayName: 'Khaos',
    discordAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    tierName: 'HT2',
    tierRank: 8,
    createdAt: '2026-02-22T17:45:00.000Z',
    updatedAt: '2026-02-22T17:45:00.000Z',
  },
];

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);

        // Migrate / populate simplified schema fields
        const settings: WebsiteSettings = {
          serverName: parsed.settings?.serverName || DEFAULT_SETTINGS.serverName,
          logoUrl: parsed.settings?.logoUrl || DEFAULT_SETTINGS.logoUrl,
          youtubeUrl: parsed.settings?.youtubeUrl || DEFAULT_SETTINGS.youtubeUrl,
          discordInviteUrl: parsed.settings?.discordInviteUrl || DEFAULT_SETTINGS.discordInviteUrl,
          ownerDiscordId: parsed.settings?.ownerDiscordId || DEFAULT_SETTINGS.ownerDiscordId,
          ownerName: parsed.settings?.ownerName || DEFAULT_SETTINGS.ownerName,
          ownerAvatar: parsed.settings?.ownerAvatar || DEFAULT_SETTINGS.ownerAvatar,
          ownerTag: parsed.settings?.ownerTag || DEFAULT_SETTINGS.ownerTag,
          aboutContent: parsed.settings?.aboutContent || DEFAULT_SETTINGS.aboutContent,
          tierTestContent: parsed.settings?.tierTestContent || DEFAULT_SETTINGS.tierTestContent,
          newsContent: parsed.settings?.newsContent || DEFAULT_SETTINGS.newsContent,
          welcomeBadgeText: parsed.settings?.welcomeBadgeText || DEFAULT_SETTINGS.welcomeBadgeText,
        };

        const testServers: TestServer[] = Array.isArray(parsed.testServers) && parsed.testServers.length > 0
          ? parsed.testServers
          : DEFAULT_SERVERS;

        let leaderboard: LeaderboardPlayer[] = Array.isArray(parsed.leaderboard) && parsed.leaderboard.length > 0
          ? parsed.leaderboard
          : [];

        const newsArticles: NewsArticle[] = Array.isArray(parsed.newsArticles) && parsed.newsArticles.length > 0
          ? parsed.newsArticles
          : DEFAULT_NEWS;

        const roles: ServerRole[] = Array.isArray(parsed.roles) && parsed.roles.length > 0
          ? parsed.roles
          : DEFAULT_ROLES;

        // If leaderboard is empty but old tierTests existed, migrate them cleanly
        if (leaderboard.length === 0 && parsed.tierTests) {
          const testRecords = Object.values(parsed.tierTests) as any[];
          const seen = new Set<string>();
          for (const test of testRecords) {
            if (!seen.has(test.discordId)) {
              seen.add(test.discordId);
              const user = (parsed.users && parsed.users[test.discordId]) || null;
              leaderboard.push({
                id: `lead_${test.id || Date.now()}`,
                minecraftName: test.minecraftName || `Gladiator_${test.discordId.slice(-4)}`,
                discordId: test.discordId,
                discordDisplayName: user?.username || user?.globalName || `Discord_${test.discordId.slice(-4)}`,
                discordAvatar: resolveDiscordAvatar(test.discordId, user?.avatar),
                tierName: test.tier || 'HT1',
                tierRank: test.tierRank || getTierRank(test.tier || 'HT1'),
                createdAt: test.createdAt || new Date().toISOString(),
                updatedAt: test.updatedAt || new Date().toISOString(),
              });
            }
          }
        }

        if (leaderboard.length === 0) {
          leaderboard = DEFAULT_LEADERBOARD;
        }

        return {
          users: parsed.users || DEFAULT_USERS,
          adminDiscordIds: parsed.adminDiscordIds || ['184719284719284719'],
          settings,
          testServers,
          leaderboard,
          newsArticles,
          roles,
        };
      }
    } catch (err) {
      console.error('Failed to load database file, using defaults:', err);
    }

    const initial: DatabaseSchema = {
      users: DEFAULT_USERS,
      adminDiscordIds: ['1324725244073873539', '184719284719284719'],
      settings: DEFAULT_SETTINGS,
      testServers: DEFAULT_SERVERS,
      leaderboard: DEFAULT_LEADERBOARD,
      newsArticles: DEFAULT_NEWS,
      roles: DEFAULT_ROLES,
    };

    this.saveDatabaseSync(initial);
    return initial;
  }

  private saveDatabaseSync(data: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Error writing to database:', err);
    }
  }

  public save(): void {
    this.saveDatabaseSync(this.data);
  }

  // --- Settings ---
  public getSettings(): WebsiteSettings {
    return this.data.settings;
  }

  public updateSettings(partial: Partial<WebsiteSettings>): WebsiteSettings {
    this.data.settings = {
      ...this.data.settings,
      ...partial,
    };
    this.save();
    return this.data.settings;
  }

  // --- Test Servers ---
  public getTestServers(): TestServer[] {
    return [...this.data.testServers].sort((a, b) => a.order - b.order);
  }

  public addTestServer(server: Omit<TestServer, 'id'>): TestServer {
    const id = `srv_${Date.now()}`;
    const newServer: TestServer = {
      ...server,
      id,
      order: server.order ?? (this.data.testServers.length + 1),
    };
    this.data.testServers.push(newServer);
    this.save();
    return newServer;
  }

  public updateTestServer(id: string, updates: Partial<TestServer>): TestServer | null {
    const idx = this.data.testServers.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.data.testServers[idx] = {
      ...this.data.testServers[idx],
      ...updates,
      id,
    };
    this.save();
    return this.data.testServers[idx];
  }

  public deleteTestServer(id: string): boolean {
    const initialLen = this.data.testServers.length;
    this.data.testServers = this.data.testServers.filter(s => s.id !== id);
    if (this.data.testServers.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Leaderboard ---
  public getLeaderboardPlayersAdmin(): LeaderboardPlayer[] {
    return [...this.data.leaderboard].sort((a, b) => b.tierRank - a.tierRank);
  }

  public getLeaderboardPublic(): PublicLeaderboardItem[] {
    return formatPublicLeaderboard(this.data.leaderboard);
  }

  public addLeaderboardPlayer(player: {
    minecraftName: string;
    discordId: string;
    discordDisplayName?: string;
    discordUsername?: string;
    discordAvatar?: string;
    tierName: string;
    gamesPlayed?: any[];
    notes?: string;
  }): LeaderboardPlayer {
    const id = `player_${Date.now()}`;
    const user = this.data.users[player.discordId];
    const tierName = player.tierName.trim().toUpperCase() || 'HT1';
    const tierRank = getTierRank(tierName);
    const resolvedAvatar = player.discordAvatar || (user?.avatar) || resolveDiscordAvatar(player.discordId);
    const resolvedName = player.discordDisplayName || (user?.globalName || user?.username) || `Discord_${player.discordId.slice(-4)}`;
    const resolvedUsername = player.discordUsername || user?.username || undefined;

    const newPlayer: LeaderboardPlayer = {
      id,
      minecraftName: player.minecraftName.trim(),
      discordId: player.discordId.trim(),
      discordDisplayName: resolvedName,
      discordUsername: resolvedUsername,
      discordAvatar: resolvedAvatar,
      tierName,
      tierRank,
      gamesPlayed: Array.isArray(player.gamesPlayed) ? player.gamesPlayed : [],
      notes: (player.notes || '').trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.leaderboard.push(newPlayer);
    this.save();
    return newPlayer;
  }

  public updateLeaderboardPlayer(id: string, updates: Partial<LeaderboardPlayer>): LeaderboardPlayer | null {
    const idx = this.data.leaderboard.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const existing = this.data.leaderboard[idx];
    const tierName = (updates.tierName || existing.tierName).trim().toUpperCase();
    const tierRank = updates.tierRank || getTierRank(tierName);

    this.data.leaderboard[idx] = {
      ...existing,
      ...updates,
      id,
      tierName,
      tierRank,
      gamesPlayed: updates.gamesPlayed !== undefined ? updates.gamesPlayed : existing.gamesPlayed,
      notes: updates.notes !== undefined ? updates.notes : existing.notes,
      updatedAt: new Date().toISOString(),
    };

    this.save();
    return this.data.leaderboard[idx];
  }

  public deleteLeaderboardPlayer(id: string): boolean {
    const player = this.data.leaderboard.find(p => p.id === id);
    const initialLen = this.data.leaderboard.length;
    this.data.leaderboard = this.data.leaderboard.filter(p => p.id !== id);

    // Also purge from tierTests if present
    if (player && (this.data as any).tierTests) {
      const tests = (this.data as any).tierTests;
      for (const [testId, t] of Object.entries(tests)) {
        if ((t as any).discordId === player.discordId || (t as any).minecraftName === player.minecraftName) {
          delete tests[testId];
        }
      }
    }

    if (this.data.leaderboard.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Users & Auth ---
  public getUser(discordId: string): UserProfile | undefined {
    return this.data.users[discordId];
  }

  public getAllUsers(): UserProfile[] {
    return Object.values(this.data.users);
  }

  public upsertUser(profile: Partial<UserProfile> & { discordId: string }): UserProfile {
    const existing = this.data.users[profile.discordId];
    const isAdmin = this.isAdmin(profile.discordId);

    const updated: UserProfile = {
      id: existing?.id || `user_${profile.discordId}`,
      discordId: profile.discordId,
      username: profile.username || existing?.username || `Player_${profile.discordId.slice(-4)}`,
      globalName: profile.globalName ?? existing?.globalName,
      avatar: profile.avatar ?? existing?.avatar ?? resolveDiscordAvatar(profile.discordId),
      discriminator: profile.discriminator ?? existing?.discriminator ?? '0',
      email: profile.email ?? existing?.email,
      bio: profile.bio ?? existing?.bio ?? '',
      createdAt: existing?.createdAt || new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      isAdmin,
    };

    this.data.users[profile.discordId] = updated;

    // Automatically synchronize any leaderboard entry matching this Discord ID
    for (const entry of this.data.leaderboard) {
      if (entry.discordId === profile.discordId) {
        if (updated.username) entry.discordDisplayName = updated.globalName || updated.username;
        if (updated.avatar) entry.discordAvatar = updated.avatar;
      }
    }

    this.save();
    return updated;
  }

  public isAdmin(discordId: string): boolean {
    if (!discordId) return false;
    const cleanId = String(discordId).trim();

    // The server/site owner specified in settings is always an administrator
    if (this.data.settings?.ownerDiscordId && this.data.settings.ownerDiscordId.trim() === cleanId) {
      return true;
    }

    const envAdmins = (process.env.ADMIN_DISCORD_IDS || '')
      .split(/[\s,;]+/)
      .map(id => id.trim())
      .filter(id => /^\d{17,20}$/.test(id));
    if (envAdmins.includes(cleanId)) return true;
    if (this.data.adminDiscordIds.map(id => String(id).trim()).includes(cleanId)) return true;
    return !!this.data.users[cleanId]?.isAdmin;
  }

  public setAdminStatus(discordId: string, status: boolean): void {
    if (status) {
      if (!this.data.adminDiscordIds.includes(discordId)) {
        this.data.adminDiscordIds.push(discordId);
      }
    } else {
      this.data.adminDiscordIds = this.data.adminDiscordIds.filter(id => id !== discordId);
    }
    if (this.data.users[discordId]) {
      this.data.users[discordId].isAdmin = status;
    }
    this.save();
  }

  // --- Server Roles (for Discord-like role mentions & badges) ---
  public getRoles(): ServerRole[] {
    return [...this.data.roles].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  public addRole(role: Omit<ServerRole, 'id'>): ServerRole {
    const id = `role_${Date.now()}`;
    const newRole: ServerRole = {
      ...role,
      id,
      name: role.name.trim(),
      color: role.color?.trim() || '#38bdf8',
      emoji: role.emoji?.trim() || '🛡️',
      order: role.order ?? (this.data.roles.length + 1),
      description: role.description?.trim() || '',
      criteria: role.criteria?.trim() || '',
      showInList: role.showInList !== false,
    };
    this.data.roles.push(newRole);
    this.save();
    return newRole;
  }

  public updateRole(id: string, updates: Partial<ServerRole>): ServerRole | null {
    const idx = this.data.roles.findIndex(r => r.id === id);
    if (idx === -1) return null;
    this.data.roles[idx] = {
      ...this.data.roles[idx],
      ...updates,
      id,
    };
    this.save();
    return this.data.roles[idx];
  }

  public deleteRole(id: string): boolean {
    const initialLen = this.data.roles.length;
    this.data.roles = this.data.roles.filter(r => r.id !== id);
    if (this.data.roles.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- News Articles ---
  public getNewsArticles(): NewsArticle[] {
    return [...this.data.newsArticles].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  public addNewsArticle(article: {
    title: string;
    content: string;
    category?: string;
    imageUrl?: string;
    pinned?: boolean;
  }): NewsArticle {
    const id = `news_${Date.now()}`;
    const newArticle: NewsArticle = {
      id,
      title: article.title.trim(),
      content: article.content.trim(),
      category: article.category?.trim() || 'إعلان',
      imageUrl: article.imageUrl?.trim() || undefined,
      pinned: !!article.pinned,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.newsArticles.unshift(newArticle);
    this.save();
    return newArticle;
  }

  public updateNewsArticle(id: string, updates: Partial<NewsArticle>): NewsArticle | null {
    const idx = this.data.newsArticles.findIndex(a => a.id === id);
    if (idx === -1) return null;
    this.data.newsArticles[idx] = {
      ...this.data.newsArticles[idx],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.newsArticles[idx];
  }

  public deleteNewsArticle(id: string): boolean {
    const initialLen = this.data.newsArticles.length;
    this.data.newsArticles = this.data.newsArticles.filter(a => a.id !== id);
    if (this.data.newsArticles.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }
}

export const db = new DatabaseManager();
