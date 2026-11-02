import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Shield,
  Save,
  Plus,
  Trash2,
  Edit2,
  Check,
  Server,
  Trophy,
  Globe,
  FileText,
  Search,
  AlertCircle,
  Image as ImageIcon,
  Newspaper,
  Pin,
  Tag,
  ShieldCheck,
  Palette,
  Smile,
  Sparkles,
  Crown,
  AtSign,
  ExternalLink,
  HelpCircle,
  Award,
  RefreshCw,
  User,
  Users,
  History,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Gamepad2,
  Copy,
  UserCheck,
} from 'lucide-react';
import {
  UserProfile,
  WebsiteSettings,
  TestServer,
  LeaderboardPlayer,
  TierDefinition,
  WHITE_KINGDOM_TIERS,
  GameDiscipline,
  NewsArticle,
  ServerRole,
  TierTester,
  LoginLogEntry,
} from '../types/pvp.js';
import { DiscordFormattedText } from '../utils/discordMentionParser.js';
import { ImageUploadInput } from '../components/ImageUploadInput.js';
import { resolveUserRoles, getTierDefinition } from '../utils/pvpLogic.js';

interface AdminDashboardPageProps {
  user: UserProfile;
  tiers?: TierDefinition[];
  testers?: TierTester[];
  onRefreshPublicData: () => void;
  onNavigate: (page: string) => void;
}

const EMOJI_PRESETS = ['👑', '🛡️', '⚔️', '⭐', '🔥', '💎', '🎮', '⚡', '🏆', '🎯', '🌟', '⚜️'];

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  user,
  tiers,
  testers,
  onRefreshPublicData,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'loginLogs' | 'testers' | 'profiles' | 'settings' | 'about' | 'tierTest' | 'tiers' | 'news' | 'roles' | 'servers' | 'leaderboard'>('loginLogs');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Settings state
  const [settings, setSettings] = useState<WebsiteSettings>({
    serverName: '𝑾𝒉𝒊𝒕𝒆 𝑲𝒊𝒏𝒈𝒅𝒐𝒎',
    logoUrl: '/logo.png',
    youtubeUrl: '',
    discordInviteUrl: '',
    ownerDiscordId: '',
    ownerName: '',
    ownerAvatar: '',
    ownerTag: '',
    aboutContent: '',
    tierTestContent: '',
    newsContent: '',
    welcomeBadgeText: 'المجتمع التنافسي الرسمي 2026',
  });

  // News State
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);
  const [newNewsTitle, setNewNewsTitle] = useState('');
  const [newNewsContent, setNewNewsContent] = useState('');
  const [newNewsCategory, setNewNewsCategory] = useState('إعلان هام');
  const [newNewsImageUrl, setNewNewsImageUrl] = useState('');
  const [newNewsPinned, setNewNewsPinned] = useState(false);

  // Interactive @ Mention autocomplete state
  const [mentionDropdownOpen, setMentionDropdownOpen] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [cursorPos, setCursorPos] = useState<number | null>(null);
  const newsTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Roles State
  const [roles, setRoles] = useState<ServerRole[]>([]);
  const [editingRole, setEditingRole] = useState<ServerRole | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#00e5ff');
  const [newRoleEmoji, setNewRoleEmoji] = useState('🛡️');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRoleCriteria, setNewRoleCriteria] = useState('');
  const [newRoleShowInList, setNewRoleShowInList] = useState(true);

  // Servers state (with imageUrl support)
  const [servers, setServers] = useState<TestServer[]>([]);
  const [editingServer, setEditingServer] = useState<TestServer | null>(null);
  const [newServerName, setNewServerName] = useState('');
  const [newServerInfo, setNewServerInfo] = useState('');
  const [newServerImageUrl, setNewServerImageUrl] = useState('');

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [editingPlayer, setEditingPlayer] = useState<LeaderboardPlayer | null>(null);
  const [playerSearchFilter, setPlayerSearchFilter] = useState('');

  // Add player form state
  const [playerMinecraftName, setPlayerMinecraftName] = useState('');
  const [playerDiscordId, setPlayerDiscordId] = useState('');
  const [playerDiscordName, setPlayerDiscordName] = useState('');
  const [playerDiscordAvatar, setPlayerDiscordAvatar] = useState('');
  const [playerTier, setPlayerTier] = useState('HT1');
  const [playerNotes, setPlayerNotes] = useState('');
  const [playerGames, setPlayerGames] = useState<GameDiscipline[]>([
    { gameName: 'Netherite Pot (SMP)', score: '3 - 1', details: 'تحكم ممتاز في الشيلد وتوقيت التوتم' },
    { gameName: 'Crystal PvP', score: '3 - 0', details: 'سرعة وضع وتفجير الكريستال بدقة' },
  ]);
  const [lookingUpDiscord, setLookingUpDiscord] = useState(false);

  // Color Presets for Discord Roles and Tiers
  const COLOR_PRESETS = [
    { label: 'Red / أحمر', color: '#ef4444' },
    { label: 'Orange / برتقالي', color: '#f97316' },
    { label: 'Amber/Gold / ذهبي', color: '#f59e0b' },
    { label: 'Emerald / أخضر', color: '#10b981' },
    { label: 'Cyan / سماوي مشع', color: '#00e5ff' },
    { label: 'Sky / أزرق فاتح', color: '#38bdf8' },
    { label: 'Blue / أزرق ملكي', color: '#3b82f6' },
    { label: 'Purple / بنفسجي', color: '#a855f7' },
    { label: 'Pink / وردي', color: '#ec4899' },
    { label: 'Rose / قرمزي', color: '#f43f5e' },
    { label: 'White / أبيض ناصع', color: '#f8fafc' },
  ];

  // Custom Tiers State
  const [tiersList, setTiersList] = useState<TierDefinition[]>(tiers && tiers.length > 0 ? tiers : WHITE_KINGDOM_TIERS);
  const [newTierName, setNewTierName] = useState('');
  const [newTierColor, setNewTierColor] = useState('#ef4444');
  const [newTierLabel, setNewTierLabel] = useState('');
  const [newTierRank, setNewTierRank] = useState<number | ''>('');
  const [editingTier, setEditingTier] = useState<TierDefinition | null>(null);

  // Additional player username state
  const [playerDiscordUsername, setPlayerDiscordUsername] = useState('');
  const lookupDebounceRef = useRef<any>(null);

  // Profiles, Roles & Ratings state
  const [profilesList, setProfilesList] = useState<UserProfile[]>([]);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [profileDiscordId, setProfileDiscordId] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [profileGlobalName, setProfileGlobalName] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [profileAssignedRoles, setProfileAssignedRoles] = useState<string[]>([]);
  const [profileTier, setProfileTier] = useState<string>('');
  const [profileEvaluationNotes, setProfileEvaluationNotes] = useState('');
  const [profileSearchFilter, setProfileSearchFilter] = useState('');
  const [lookingUpProfileDiscord, setLookingUpProfileDiscord] = useState(false);

  // --- Testers Management State ---
  const [testersList, setTestersList] = useState<TierTester[]>(testers || []);
  const [editingTester, setEditingTester] = useState<TierTester | null>(null);
  const [testerDiscordId, setTesterDiscordId] = useState('');
  const [testerMinecraftName, setTesterMinecraftName] = useState('');
  const [testerDiscordName, setTesterDiscordName] = useState('');
  const [testerDiscordUsername, setTesterDiscordUsername] = useState('');
  const [testerDiscordAvatar, setTesterDiscordAvatar] = useState('');
  const [testerSpecialty, setTesterSpecialty] = useState('');
  const [testerNotes, setTesterNotes] = useState('');
  const [lookingUpTesterDiscord, setLookingUpTesterDiscord] = useState(false);

  // --- Login Logs & User Tracking State ---
  const [loginLogsList, setLoginLogsList] = useState<LoginLogEntry[]>([]);
  const [loginLogSearchFilter, setLoginLogSearchFilter] = useState('');
  const [loginLogSortBy, setLoginLogSortBy] = useState<'date' | 'count'>('date');
  const [editingMinecraftNameUser, setEditingMinecraftNameUser] = useState<{ discordId: string; currentName: string } | null>(null);
  const [newMinecraftNameInput, setNewMinecraftNameInput] = useState('');
  const [copiedDiscordId, setCopiedDiscordId] = useState<string | null>(null);

  // Helper to attach authorization header if present in localStorage (avoids iframe third-party cookie restrictions)
  const getAuthHeaders = useCallback((extraHeaders?: Record<string, string>) => {
    const token = localStorage.getItem('wk_token');
    const headers: Record<string, string> = { ...(extraHeaders || {}) };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, []);

  // In-App Delete Confirmation Modal state (bypasses window.confirm which is blocked by iframe sandboxes)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'role' | 'player' | 'server' | 'news' | 'tier' | 'profile' | 'tester';
    id: string;
    title: string;
    message: string;
  } | null>(null);

  // Fetch all admin data
  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/data', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        if (data.testServers) setServers(data.testServers);
        if (data.testers) setTestersList(data.testers);
        if (data.leaderboard) setLeaderboard(data.leaderboard);
        if (data.newsArticles) setNewsArticles(data.newsArticles);
        if (data.roles) setRoles(data.roles);
        if (data.tiers) setTiersList(data.tiers);
        if (data.users) setProfilesList(Array.isArray(data.users) ? data.users : Object.values(data.users));
        if (data.loginLogs) setLoginLogsList(data.loginLogs);
      } else {
        setStatusMessage({ text: 'فشل تحميل بيانات لوحة الإدارة.', type: 'error' });
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
      setStatusMessage({ text: 'خطأ في الاتصال أثناء تحميل البيانات.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // 1. Save Settings
  const handleSaveSettings = async (overrideSettings?: Partial<WebsiteSettings>) => {
    try {
      setSaving(true);
      const payload = overrideSettings ? { ...settings, ...overrideSettings } : settings;
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const d = await res.json();
        setSettings(d.settings);
        showNotification('تم حفظ الإعدادات بنجاح!');
        onRefreshPublicData();
      } else {
        const err = await res.json();
        showNotification(err.error || 'فشل حفظ الإعدادات.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('حدث خطأ أثناء حفظ الإعدادات.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Lookup Discord profile for site owner
  const handleLookupOwnerDiscord = async (discordId: string) => {
    if (!discordId.trim()) {
      showNotification('يرجى إدخال معرّف (ID) حساب ديسكورد أولاً.', 'error');
      return;
    }
    try {
      setLookingUpDiscord(true);
      const res = await fetch(`/api/admin/discord-lookup/${discordId.trim()}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({
          ...prev,
          ownerDiscordId: discordId.trim(),
          ownerName: data.username || prev.ownerName || 'White',
          ownerAvatar: data.avatar || prev.ownerAvatar,
        }));
        showNotification('تم جلب صورة واسم حساب ديسكورد بنجاح!');
      } else {
        const err = await res.json();
        showNotification(err.error || 'فشل جلب بيانات ديسكورد.', 'error');
      }
    } catch (err) {
      showNotification('حدث خطأ في الاتصال أثناء جلب البيانات.', 'error');
    } finally {
      setLookingUpDiscord(false);
    }
  };

  const handleSetCurrentAccountAsOwner = () => {
    if (!user) return;
    setSettings(prev => ({
      ...prev,
      ownerDiscordId: user.discordId,
      ownerName: user.globalName || user.username,
      ownerAvatar: user.avatar,
      ownerTag: 'صاحب السيرفر ومؤسس الموقع',
    }));
    showNotification('تم استخدام حسابك المسجل حالياً كمعلومات للمالك!');
  };

  // 2. Roles Management
  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      showNotification('اسم الرول مطلوب.', 'error');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          name: newRoleName.trim(),
          color: newRoleColor.trim() || '#00e5ff',
          emoji: newRoleEmoji.trim() || '🛡️',
          description: newRoleDescription.trim(),
          criteria: newRoleCriteria.trim(),
          showInList: newRoleShowInList,
          order: roles.length + 1,
        }),
      });

      if (res.ok) {
        setNewRoleName('');
        setNewRoleDescription('');
        setNewRoleCriteria('');
        setNewRoleShowInList(true);
        showNotification('تمت إضافة الرول بنجاح!');
        fetchAdminData();
        onRefreshPublicData();
      } else {
        const err = await res.json();
        showNotification(err.error || 'فشل إضافة الرول.', 'error');
      }
    } catch (err) {
      showNotification('حدث خطأ أثناء إضافة الرول.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async (role: ServerRole) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/roles/${role.id}`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(role),
      });

      if (res.ok) {
        setEditingRole(null);
        showNotification('تم تعديل بيانات الرول بنجاح!');
        fetchAdminData();
        onRefreshPublicData();
      } else {
        const err = await res.json();
        showNotification(err.error || 'فشل تعديل الرول.', 'error');
      }
    } catch (err) {
      showNotification('حدث خطأ أثناء تعديل الرول.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = (id: string, roleName: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'role',
      id,
      title: `رول @${roleName}`,
      message: `هل أنت متأكد من رغبتك في حذف رول @${roleName} نهائياً؟ سيتم حذفه من قائمة الرولات بالموقع فوراً.`,
    });
  };

  // 3. News Articles Management
  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNewsTitle.trim()) {
      showNotification('عنوان الخبر مطلوب.', 'error');
      return;
    }
    if (!newNewsContent.trim()) {
      showNotification('محتوى الخبر مطلوب.', 'error');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          title: newNewsTitle.trim(),
          content: newNewsContent.trim(),
          category: newNewsCategory.trim() || 'إعلان',
          imageUrl: newNewsImageUrl.trim() || undefined,
          pinned: newNewsPinned,
        }),
      });

      if (res.ok) {
        setNewNewsTitle('');
        setNewNewsContent('');
        setNewNewsImageUrl('');
        setNewNewsPinned(false);
        showNotification('تم نشر الخبر بنجاح!');
        fetchAdminData();
        onRefreshPublicData();
      } else {
        const err = await res.json();
        showNotification(err.error || 'فشل نشر الخبر.', 'error');
      }
    } catch (err) {
      showNotification('حدث خطأ أثناء نشر الخبر.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNews = async (article: NewsArticle) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/news/${article.id}`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(article),
      });

      if (res.ok) {
        setEditingNews(null);
        showNotification('تم تعديل الخبر بنجاح!');
        fetchAdminData();
        onRefreshPublicData();
      } else {
        const err = await res.json();
        showNotification(err.error || 'فشل تعديل الخبر.', 'error');
      }
    } catch (err) {
      showNotification('حدث خطأ أثناء تعديل الخبر.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNews = (id: string, title: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'news',
      id,
      title: `الخبر "${title}"`,
      message: `هل أنت متأكد من حذف هذا الخبر نهائياً من الموقع؟`,
    });
  };

  // Handle typing inside news textarea to trigger @ mention popup
  const checkMentionTrigger = (val: string, pos: number) => {
    setCursorPos(pos);
    const textBefore = val.slice(0, pos);
    const lastWordMatch = textBefore.match(/@([^\s@]*)$/);
    if (lastWordMatch) {
      setMentionDropdownOpen(true);
      setMentionFilter(lastWordMatch[1].toLowerCase());
    } else {
      setMentionDropdownOpen(false);
    }
  };

  const handleNewsContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setNewNewsContent(val);
    checkMentionTrigger(val, pos);
  };

  const handleNewsCursorCheck = () => {
    if (newsTextareaRef.current) {
      checkMentionTrigger(newsTextareaRef.current.value, newsTextareaRef.current.selectionStart);
    }
  };

  const handleSelectMentionRole = (roleName: string) => {
    if (!newsTextareaRef.current) {
      setNewNewsContent(prev => `${prev} @${roleName} `);
      setMentionDropdownOpen(false);
      return;
    }

    const pos = cursorPos ?? newsTextareaRef.current.selectionStart;
    const textBefore = newNewsContent.slice(0, pos);
    const textAfter = newNewsContent.slice(pos);

    // Replace the trailing @...
    const replacedBefore = textBefore.replace(/@([^\s@]*)$/, `@${roleName} `);
    const nextVal = replacedBefore + textAfter;
    setNewNewsContent(nextVal);
    setMentionDropdownOpen(false);

    setTimeout(() => {
      if (newsTextareaRef.current) {
        newsTextareaRef.current.focus();
        const newPos = replacedBefore.length;
        newsTextareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 20);
  };

  const handleInsertMentionToNews = (roleName: string) => {
    handleSelectMentionRole(roleName);
  };

  // 4. Server Management
  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerName.trim()) {
      showNotification('اسم السيرفر مطلوب.', 'error');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/admin/servers', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          name: newServerName.trim(),
          info: newServerInfo.trim(),
          imageUrl: newServerImageUrl.trim() || undefined,
          order: servers.length + 1,
        }),
      });

      if (res.ok) {
        setNewServerName('');
        setNewServerInfo('');
        setNewServerImageUrl('');
        showNotification('تمت إضافة السيرفر بنجاح!');
        fetchAdminData();
        onRefreshPublicData();
      } else {
        const err = await res.json();
        showNotification(err.error || 'فشل إضافة السيرفر.', 'error');
      }
    } catch (err) {
      showNotification('حدث خطأ أثناء إضافة السيرفر.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateServer = async (server: TestServer) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/servers/${server.id}`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(server),
      });

      if (res.ok) {
        setEditingServer(null);
        showNotification('تم تعديل بيانات السيرفر بنجاح!');
        fetchAdminData();
        onRefreshPublicData();
      } else {
        const err = await res.json();
        showNotification(err.error || 'فشل تعديل السيرفر.', 'error');
      }
    } catch (err) {
      showNotification('حدث خطأ أثناء تعديل السيرفر.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteServer = (id: string, serverName?: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'server',
      id,
      title: serverName ? `سيرفر ${serverName}` : 'السيرفر',
      message: `هل أنت متأكد من حذف هذا السيرفر من قائمة سيرفرات الاختبار المعتمدة؟`,
    });
  };

  // 5. Discord Lookup for Player Add
  const handleDiscordIdChange = (val: string) => {
    setPlayerDiscordId(val);
    const clean = val.trim();
    if (/^\d{17,20}$/.test(clean)) {
      if (lookupDebounceRef.current) clearTimeout(lookupDebounceRef.current);
      lookupDebounceRef.current = setTimeout(() => {
        handleLookupDiscord(clean);
      }, 400);
    }
  };

  const handleLookupDiscord = async (idParam?: string) => {
    const id = (idParam || playerDiscordId).trim();
    if (!id) {
      showNotification('يرجى إدخال معرّف ديسكورد (Discord User ID).', 'error');
      return;
    }

    try {
      setLookingUpDiscord(true);
      const res = await fetch(`/api/admin/discord-lookup/${id}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.displayName || d.username) setPlayerDiscordName(d.displayName || d.username);
        if (d.username) setPlayerDiscordUsername(d.username);
        if (d.avatar) setPlayerDiscordAvatar(d.avatar);
        showNotification(`تم جلب بيانات الحساب: ${d.displayName || d.username} (@${d.username})`);
      } else {
        const err = await res.json();
        showNotification(err.error || 'فشل التحقق من حساب الديسكورد.', 'error');
      }
    } catch (err) {
      showNotification('خطأ في الاتصال أثناء التحقق من الديسكورد.', 'error');
    } finally {
      setLookingUpDiscord(false);
    }
  };

  // --- 6. Custom Tiers Operations (Add, Change Color/Label/Rank, Delete, Reset) ---
  const handleAddTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTierName.trim()) {
      showNotification('اسم المستوى مطلوب (مثال: LT6 أو HT6).', 'error');
      return;
    }
    if (!newTierColor.trim()) {
      showNotification('لون المستوى مطلوب.', 'error');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/admin/tiers', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          name: newTierName.trim().toUpperCase(),
          color: newTierColor.trim(),
          label: newTierLabel.trim() || undefined,
          rank: typeof newTierRank === 'number' ? newTierRank : undefined,
        }),
      });

      if (res.ok) {
        const d = await res.json();
        setTiersList(d.tiers);
        setNewTierName('');
        setNewTierLabel('');
        setNewTierRank('');
        showNotification(d.message || 'تمت إضافة المستوى بنجاح!');
        onRefreshPublicData();
      } else {
        const err = await res.json();
        showNotification(err.error || 'فشل إضافة المستوى.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('حدث خطأ أثناء إضافة المستوى.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTier = async (tier: TierDefinition) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/tiers/${encodeURIComponent(tier.name)}`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(tier),
      });

      if (res.ok) {
        const d = await res.json();
        setTiersList(d.tiers);
        setEditingTier(null);
        showNotification(d.message || `تم تحديث لون ومستوى ${tier.name} بنجاح!`);
        fetchAdminData();
        onRefreshPublicData();
      } else {
        const err = await res.json();
        showNotification(err.error || 'فشل تعديل المستوى.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('حدث خطأ أثناء تعديل المستوى.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTier = (name: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'tier',
      id: name,
      title: `المستوى ${name}`,
      message: `هل أنت متأكد من رغبتك في حذف المستوى "${name}" نهائياً من تصنيفات السيرفر؟`,
    });
  };

  const handleResetTiers = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/tiers/reset', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const d = await res.json();
        setTiersList(d.tiers);
        showNotification(d.message || 'تمت استعادة التصنيفات الافتراضية بنجاح!');
        fetchAdminData();
        onRefreshPublicData();
      } else {
        const err = await res.json();
        showNotification(err.error || 'فشل استعادة التصنيفات.', 'error');
      }
    } catch (err) {
      showNotification('حدث خطأ أثناء استعادة التصنيفات.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Games dynamic controls in player form
  const handleAddGameRow = () => {
    setPlayerGames([...playerGames, { gameName: '', score: '', details: '' }]);
  };

  const handleUpdateGameRow = (index: number, field: keyof GameDiscipline, val: string) => {
    const updated = [...playerGames];
    updated[index] = { ...updated[index], [field]: val };
    setPlayerGames(updated);
  };

  const handleRemoveGameRow = (index: number) => {
    setPlayerGames(playerGames.filter((_, i) => i !== index));
  };

  // 7. Leaderboard Player Management
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerMinecraftName.trim()) {
      showNotification('اسم اللاعب في ماين كرافت مطلوب.', 'error');
      return;
    }
    if (!playerDiscordId.trim()) {
      showNotification('معرّف ديسكورد (Discord User ID) مطلوب.', 'error');
      return;
    }

    try {
      setSaving(true);
      const cleanGames = playerGames.filter(g => g.gameName.trim());
      const res = await fetch('/api/admin/leaderboard', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          minecraftName: playerMinecraftName.trim(),
          discordId: playerDiscordId.trim(),
          discordDisplayName: playerDiscordName.trim() || undefined,
          discordUsername: playerDiscordUsername.trim() || undefined,
          discordAvatar: playerDiscordAvatar.trim() || undefined,
          tierName: playerTier,
          gamesPlayed: cleanGames,
          notes: playerNotes.trim(),
        }),
      });

      if (res.ok) {
        setPlayerMinecraftName('');
        setPlayerDiscordId('');
        setPlayerDiscordName('');
        setPlayerDiscordUsername('');
        setPlayerDiscordAvatar('');
        setPlayerTier(tiersList[0]?.name || 'HT1');
        setPlayerNotes('');
        setPlayerGames([
          { gameName: 'Netherite Pot (SMP)', score: '3 - 1', details: 'تحكم ممتاز في الشيلد وتوقيت التوتم' },
          { gameName: 'Crystal PvP', score: '3 - 0', details: 'سرعة وضع وتفجير الكريستال بدقة' },
        ]);
        showNotification('تمت إضافة اللاعب ونتائج اختباره بنجاح!');
        fetchAdminData();
        onRefreshPublicData();
      } else {
        const err = await res.json();
        showNotification(err.error || 'فشل إضافة اللاعب.', 'error');
      }
    } catch (err) {
      showNotification('حدث خطأ أثناء إضافة اللاعب.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePlayer = async (player: LeaderboardPlayer) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/leaderboard/${player.id}`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(player),
      });

      if (res.ok) {
        setEditingPlayer(null);
        showNotification('تم تعديل بيانات اللاعب والاختبار بنجاح!');
        fetchAdminData();
        onRefreshPublicData();
      } else {
        const err = await res.json();
        showNotification(err.error || 'فشل تعديل بيانات اللاعب.', 'error');
      }
    } catch (err) {
      showNotification('حدث خطأ أثناء تعديل اللاعب.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlayer = (id: string, playerName?: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'player',
      id,
      title: playerName ? `اللاعب ${playerName}` : 'اللاعب',
      message: `هل أنت متأكد من رغبتك في حذف اللاعب ${playerName || ''} وإلغاء اختباره نهائياً من قائمة المتصدرين؟`,
    });
  };

  // Execute Confirmed Deletion (Reliable across all browser contexts and iframe sandboxes)
  const executeConfirmedDelete = async () => {
    if (!deleteConfirm) return;
    const { type, id, title } = deleteConfirm;
    try {
      setSaving(true);
      let endpoint = '';
      if (type === 'role') endpoint = `/api/admin/roles/${id}`;
      else if (type === 'news') endpoint = `/api/admin/news/${id}`;
      else if (type === 'server') endpoint = `/api/admin/servers/${id}`;
      else if (type === 'player') endpoint = `/api/admin/leaderboard/${id}`;
      else if (type === 'tier') endpoint = `/api/admin/tiers/${encodeURIComponent(id)}`;
      else if (type === 'profile') endpoint = `/api/admin/profiles/${encodeURIComponent(id)}`;
      else if (type === 'tester') endpoint = `/api/admin/testers/${encodeURIComponent(id)}`;

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        showNotification(`تم حذف ${title} بنجاح!`);
        setDeleteConfirm(null);
        await fetchAdminData();
        onRefreshPublicData();
      } else {
        const err = await res.json().catch(() => ({}));
        showNotification(err.error || `فشل حذف ${title}.`, 'error');
      }
    } catch (err) {
      console.error('Delete execution error:', err);
      showNotification('حدث خطأ في الاتصال أثناء تنفيذ الحذف.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // --- Profile Management Handlers ---
  const handleLookupProfileDiscord = async (idToLookup?: string) => {
    const targetId = (idToLookup || profileDiscordId).trim();
    if (!targetId) {
      showNotification('يرجى إدخال معرّف (ID) حساب ديسكورد أولاً.', 'error');
      return;
    }
    try {
      setLookingUpProfileDiscord(true);
      const res = await fetch(`/api/admin/discord-lookup/${targetId}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setProfileUsername(data.username || '');
        setProfileGlobalName(data.displayName || data.username || '');
        setProfileAvatar(data.avatar || '');
        showNotification('تم جلب بيانات وصورة حساب ديسكورد بنجاح!');
      } else {
        const err = await res.json();
        showNotification(err.error || 'فشل جلب بيانات الحساب.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('خطأ أثناء جلب بيانات حساب ديسكورد.', 'error');
    } finally {
      setLookingUpProfileDiscord(false);
    }
  };

  const handleToggleProfileRole = (roleId: string) => {
    setProfileAssignedRoles(prev =>
      prev.includes(roleId) ? prev.filter(r => r !== roleId) : [...prev, roleId]
    );
  };

  const handleSaveProfile = async () => {
    if (!profileDiscordId.trim()) {
      showNotification('معرّف ديسكورد (Discord User ID) مطلوب.', 'error');
      return;
    }

    try {
      setSaving(true);
      const isEditing = !!editingProfile;
      const endpoint = isEditing
        ? `/api/admin/profiles/${encodeURIComponent(profileDiscordId.trim())}`
        : '/api/admin/profiles';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          discordId: profileDiscordId.trim(),
          username: profileUsername.trim() || undefined,
          globalName: profileGlobalName.trim() || undefined,
          avatar: profileAvatar.trim() || undefined,
          assignedRoles: profileAssignedRoles,
          tier: profileTier || '',
          evaluationNotes: profileEvaluationNotes.trim() || '',
        }),
      });

      if (res.ok) {
        showNotification(isEditing ? 'تم تحديث الملف الشخصي والرولات والتقييم بنجاح!' : 'تم إنشاء وحفظ الملف الشخصي بنجاح!');
        setEditingProfile(null);
        setProfileDiscordId('');
        setProfileUsername('');
        setProfileGlobalName('');
        setProfileAvatar('');
        setProfileAssignedRoles([]);
        setProfileTier('');
        setProfileEvaluationNotes('');
        await fetchAdminData();
        onRefreshPublicData();
      } else {
        const err = await res.json();
        showNotification(err.error || 'فشل حفظ الملف الشخصي.', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('حدث خطأ أثناء حفظ الملف الشخصي في قاعدة البيانات.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditProfile = (p: UserProfile) => {
    setEditingProfile(p);
    setProfileDiscordId(p.discordId);
    setProfileUsername(p.username || '');
    setProfileGlobalName(p.globalName || '');
    setProfileAvatar(p.avatar || '');
    setProfileAssignedRoles(p.assignedRoles || []);
    setProfileTier(p.tier || '');
    setProfileEvaluationNotes(p.evaluationNotes || '');
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleCancelEditProfile = () => {
    setEditingProfile(null);
    setProfileDiscordId('');
    setProfileUsername('');
    setProfileGlobalName('');
    setProfileAvatar('');
    setProfileAssignedRoles([]);
    setProfileTier('');
    setProfileEvaluationNotes('');
  };

  const handleDeleteProfile = (p: UserProfile) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'profile',
      id: p.discordId,
      title: p.globalName || p.username || `الحساب ${p.discordId}`,
      message: `هل أنت متأكد من حذف الملف الشخصي للحساب (${p.globalName || p.username} - ID: ${p.discordId}) نهائياً؟`,
    });
  };

  // --- Testers Management Handlers ---
  const handleLookupTesterDiscord = async (id: string) => {
    const cleanId = id.trim();
    if (!cleanId) {
      showNotification('يرجى إدخال معرّف ديسكورد (Discord ID) للمختبر أولاً.', 'error');
      return;
    }
    try {
      setLookingUpTesterDiscord(true);
      const res = await fetch(`/api/admin/discord-lookup/${cleanId}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.displayName || d.username) setTesterDiscordName(d.displayName || d.username);
        if (d.username) setTesterDiscordUsername(d.username);
        if (d.avatar) setTesterDiscordAvatar(d.avatar);
        showNotification(`تم جلب بيانات المختبر: ${d.displayName || d.username}`);
      } else {
        const err = await res.json().catch(() => ({}));
        showNotification(err.error || 'فشل التحقق من حساب ديسكورد.', 'error');
      }
    } catch (err) {
      showNotification('خطأ في الاتصال أثناء التحقق من حساب ديسكورد.', 'error');
    } finally {
      setLookingUpTesterDiscord(false);
    }
  };

  const handleAddOrUpdateTester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testerMinecraftName.trim()) {
      showNotification('اسم اللاعب في ماين كرافت (Minecraft IGN) مطلوب.', 'error');
      return;
    }
    if (!testerDiscordId.trim()) {
      showNotification('معرّف ديسكورد (Discord ID) مطلوب.', 'error');
      return;
    }

    try {
      setSaving(true);
      const isEditing = !!editingTester;
      const url = isEditing ? `/api/admin/testers/${editingTester.id}` : '/api/admin/testers';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          discordId: testerDiscordId.trim(),
          minecraftName: testerMinecraftName.trim(),
          discordDisplayName: testerDiscordName.trim() || undefined,
          discordUsername: testerDiscordUsername.trim() || undefined,
          discordAvatar: testerDiscordAvatar.trim() || undefined,
          specialty: testerSpecialty.trim() || undefined,
          notes: testerNotes.trim() || undefined,
          order: isEditing ? editingTester.order : (testersList.length + 1),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.testers) setTestersList(data.testers);
        showNotification(isEditing ? 'تم تحديث بيانات المختبر بنجاح!' : 'تمت إضافة المختبر الرسمي بنجاح!');
        setEditingTester(null);
        setTesterDiscordId('');
        setTesterMinecraftName('');
        setTesterDiscordName('');
        setTesterDiscordUsername('');
        setTesterDiscordAvatar('');
        setTesterSpecialty('');
        setTesterNotes('');
        await fetchAdminData();
        onRefreshPublicData();
      } else {
        const err = await res.json().catch(() => ({}));
        showNotification(err.error || 'فشل حفظ بيانات المختبر.', 'error');
      }
    } catch (err) {
      showNotification('حدث خطأ أثناء حفظ بيانات المختبر.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditTester = (t: TierTester) => {
    setEditingTester(t);
    setTesterDiscordId(t.discordId);
    setTesterMinecraftName(t.minecraftName);
    setTesterDiscordName(t.discordDisplayName || '');
    setTesterDiscordUsername(t.discordUsername || '');
    setTesterDiscordAvatar(t.discordAvatar || '');
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleCancelEditTester = () => {
    setEditingTester(null);
    setTesterDiscordId('');
    setTesterMinecraftName('');
    setTesterDiscordName('');
    setTesterDiscordUsername('');
    setTesterDiscordAvatar('');
    setTesterSpecialty('');
    setTesterNotes('');
  };

  const handleDeleteTester = (t: TierTester) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'tester',
      id: t.id,
      title: `المختبر ${t.discordDisplayName || t.minecraftName}`,
      message: `هل أنت متأكد من حذف المختبر ${t.discordDisplayName || t.minecraftName} (ماين كرافت: ${t.minecraftName}) نهائياً من قائمة مختبري المستويات؟`,
    });
  };

  const handleMoveTester = async (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === testersList.length - 1)) {
      return;
    }
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...testersList];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);

    setTestersList(reordered);
    try {
      const res = await fetch('/api/admin/testers/reorder', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ orderedIds: reordered.map(t => t.id) }),
      });
      if (res.ok) {
        showNotification('تم تحديث ترتيب المختبرين بنجاح!');
        onRefreshPublicData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Login Logs & User Minecraft Name Handlers ---
  const handleSaveUserMinecraftName = async (discordId: string, name: string) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/users/${discordId}/minecraft-name`, {
        method: 'PATCH',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ minecraftName: name.trim() }),
      });
      if (res.ok) {
        showNotification('تم تحديث اسم ماين كرافت للمستخدم بنجاح!');
        setEditingMinecraftNameUser(null);
        setNewMinecraftNameInput('');
        await fetchAdminData();
        onRefreshPublicData();
      } else {
        const err = await res.json().catch(() => ({}));
        showNotification(err.error || 'فشل تحديث اسم ماين كرافت.', 'error');
      }
    } catch (err) {
      showNotification('حدث خطأ أثناء تحديث اسم ماين كرافت.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyDiscordId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedDiscordId(id);
    setTimeout(() => setCopiedDiscordId(null), 2500);
  };

  // Filtered and sorted login logs
  const filteredLoginLogs = useMemo(() => {
    let list = [...loginLogsList];
    if (loginLogSearchFilter.trim()) {
      const q = loginLogSearchFilter.trim().toLowerCase();
      list = list.filter(
        log =>
          log.discordId.toLowerCase().includes(q) ||
          log.username.toLowerCase().includes(q) ||
          log.displayName?.toLowerCase().includes(q) ||
          (log.minecraftName && log.minecraftName.toLowerCase().includes(q))
      );
    }
    if (loginLogSortBy === 'count') {
      list.sort((a, b) => (b.loginCount || 1) - (a.loginCount || 1));
    } else {
      list.sort((a, b) => new Date(b.loginAt).getTime() - new Date(a.loginAt).getTime());
    }
    return list;
  }, [loginLogsList, loginLogSearchFilter, loginLogSortBy]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-400" dir="rtl">
        جاري تحميل لوحة التحكم...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 relative z-10 animate-in fade-in duration-500" dir="rtl">
      
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8 text-right">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.25)]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-white">
              لوحة الإدارة الخاصة بالسيرفر
            </h1>
            <p className="text-xs text-slate-400">
              تم تسجيل الدخول بصلاحية الأدمن كـ <span className="text-cyan-300 font-bold">{user.username}</span> (معرّف ديسكورد: <span dir="ltr">{user.discordId}</span>)
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('home')}
          className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
        >
          عرض الموقع العام
        </button>
      </div>

      {/* Status Notification */}
      {statusMessage && (
        <div
          className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/60 border border-red-500/40 text-red-300'
          }`}
        >
          {statusMessage.type === 'success' ? <Check className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Arabic Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('loginLogs')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer backdrop-blur-md ${
            activeTab === 'loginLogs'
              ? 'border-t-2 border-cyan-300 bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
              : 'border-t-2 border-cyan-500/20 text-slate-300 bg-slate-900/60 hover:text-white hover:border-cyan-400/50 hover:bg-slate-800/80'
          }`}
        >
          <History className="w-4 h-4" />
          <span>سجل تسجيل الدخول وإدارة المستخدمين ({loginLogsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('testers')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer backdrop-blur-md ${
            activeTab === 'testers'
              ? 'border-t-2 border-cyan-300 bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
              : 'border-t-2 border-cyan-500/20 text-slate-300 bg-slate-900/60 hover:text-white hover:border-cyan-400/50 hover:bg-slate-800/80'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>إدارة مختبري المستويات ({testersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profiles')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer backdrop-blur-md ${
            activeTab === 'profiles'
              ? 'border-t-2 border-cyan-300 bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
              : 'border-t-2 border-cyan-500/20 text-slate-300 bg-slate-900/60 hover:text-white hover:border-cyan-400/50 hover:bg-slate-800/80'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>حسابات ديسكورد والرولات والتقييمات ({profilesList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer backdrop-blur-md ${
            activeTab === 'settings'
              ? 'border-t-2 border-cyan-300 bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
              : 'border-t-2 border-cyan-500/20 text-slate-300 bg-slate-900/60 hover:text-white hover:border-cyan-400/50 hover:bg-slate-800/80'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>إعدادات السيرفر</span>
        </button>

        <button
          onClick={() => setActiveTab('news')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer backdrop-blur-md ${
            activeTab === 'news'
              ? 'border-t-2 border-cyan-300 bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
              : 'border-t-2 border-cyan-500/20 text-slate-300 bg-slate-900/60 hover:text-white hover:border-cyan-400/50 hover:bg-slate-800/80'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>الأخبار والإعلانات ({newsArticles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer backdrop-blur-md ${
            activeTab === 'roles'
              ? 'border-t-2 border-cyan-300 bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
              : 'border-t-2 border-cyan-500/20 text-slate-300 bg-slate-900/60 hover:text-white hover:border-cyan-400/50 hover:bg-slate-800/80'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>رولات ديسكورد والمنشن ({roles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('about')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer backdrop-blur-md ${
            activeTab === 'about'
              ? 'border-t-2 border-cyan-300 bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
              : 'border-t-2 border-cyan-500/20 text-slate-300 bg-slate-900/60 hover:text-white hover:border-cyan-400/50 hover:bg-slate-800/80'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>صفحة عن السيرفر</span>
        </button>

        <button
          onClick={() => setActiveTab('tierTest')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer backdrop-blur-md ${
            activeTab === 'tierTest'
              ? 'border-t-2 border-cyan-300 bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
              : 'border-t-2 border-cyan-500/20 text-slate-300 bg-slate-900/60 hover:text-white hover:border-cyan-400/50 hover:bg-slate-800/80'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>صفحة اختبار المستويات</span>
        </button>

        <button
          onClick={() => setActiveTab('tiers')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer backdrop-blur-md ${
            activeTab === 'tiers'
              ? 'border-t-2 border-cyan-300 bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
              : 'border-t-2 border-cyan-500/20 text-slate-300 bg-slate-900/60 hover:text-white hover:border-cyan-400/50 hover:bg-slate-800/80'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>إدارة وتلوين المستويات Tiers ({tiersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('servers')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer backdrop-blur-md ${
            activeTab === 'servers'
              ? 'border-t-2 border-cyan-300 bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
              : 'border-t-2 border-cyan-500/20 text-slate-300 bg-slate-900/60 hover:text-white hover:border-cyan-400/50 hover:bg-slate-800/80'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>سيرفرات الاختبار ({servers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer backdrop-blur-md ${
            activeTab === 'leaderboard'
              ? 'border-t-2 border-cyan-300 bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
              : 'border-t-2 border-cyan-500/20 text-slate-300 bg-slate-900/60 hover:text-white hover:border-cyan-400/50 hover:bg-slate-800/80'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>إدارة وتعديل اللاعبين ({leaderboard.length})</span>
        </button>
      </div>

      {/* --- TAB: Login Logs & User Tracking Management --- */}
      {activeTab === 'loginLogs' && (
        <div className="space-y-6 text-right" dir="rtl">
          {/* Header Card */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/25 relative overflow-hidden space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.2)]">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-white">
                    سجل تسجيل الدخول وإدارة المستخدمين
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    متابعة فورية لجميع المستخدمين الذين سجلوا دخولهم عبر Discord OAuth مع تاريخ وتكرار تسجيل الدخول وإمكانية تعيين اسم ماين كرافت وإدارة الرتب
                  </p>
                </div>
              </div>

              {/* Stats badges */}
              <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
                <div className="px-3 py-1.5 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-xs font-mono text-cyan-300">
                  <span>إجمالي عمليات الدخول: </span>
                  <span className="font-bold text-white">{loginLogsList.length}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300">
                  <span>المستخدمين الفريدين: </span>
                  <span className="font-bold text-cyan-300">{profilesList.length}</span>
                </div>
              </div>
            </div>

            {/* Filter and Sort bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={loginLogSearchFilter}
                  onChange={e => setLoginLogSearchFilter(e.target.value)}
                  placeholder="ابحث باسم المستخدم، معرّف Discord ID، أو حساب ماين كرافت..."
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-xs sm:text-sm focus:border-cyan-400 focus:outline-none transition-colors"
                />
                {loginLogSearchFilter && (
                  <button
                    onClick={() => setLoginLogSearchFilter('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    مسح
                  </button>
                )}
              </div>

              {/* Sorting */}
              <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>الترتيب:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setLoginLogSortBy('date')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    loginLogSortBy === 'date'
                      ? 'bg-cyan-500 text-black shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  حسب الأحدث
                </button>
                <button
                  type="button"
                  onClick={() => setLoginLogSortBy('count')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    loginLogSortBy === 'count'
                      ? 'bg-cyan-500 text-black shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  الأكثر دخولاً
                </button>
              </div>
            </div>

            {/* List of Login Logs */}
            <div className="space-y-3 pt-2">
              {filteredLoginLogs.map((log, idx) => {
                const userProfile = profilesList.find(p => p.discordId === log.discordId);
                const assignedRoles = userProfile?.assignedRoles || [];
                const resolvedRoles = resolveUserRoles(assignedRoles, roles);
                const tierDef = getTierDefinition(userProfile?.tier, tiersList);
                const isEditingMC = editingMinecraftNameUser?.discordId === log.discordId;
                const formattedDate = new Date(log.loginAt).toLocaleString('ar-SA', {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={log.id || `${log.discordId}_${idx}`}
                    className="p-4 sm:p-5 rounded-2xl glass-card border border-slate-800/80 hover:border-cyan-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    {/* Left/Main Column: Avatar & Names & ID */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <img
                        src={log.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                        alt={log.displayName || log.username}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-cyan-500/30 flex-shrink-0 shadow-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/logo.png';
                        }}
                      />
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-heading font-bold text-white text-sm sm:text-base truncate">
                            {log.displayName || log.username}
                          </span>
                          {log.username && log.username !== log.displayName && (
                            <span className="text-xs font-mono text-cyan-400" dir="ltr">
                              @{log.username}
                            </span>
                          )}
                          {userProfile?.isAdmin && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                              أدمن
                            </span>
                          )}
                        </div>

                        {/* Discord ID with copy button */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="text-[11px] font-mono">Discord ID:</span>
                          <code className="font-mono text-[11px] text-slate-300 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800" dir="ltr">
                            {log.discordId}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopyDiscordId(log.discordId)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
                            title="نسخ معرّف Discord ID"
                          >
                            {copiedDiscordId === log.discordId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Middle Column: Minecraft IGN & Login Stats */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 flex-shrink-0 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                      {/* Minecraft Name */}
                      <div className="min-w-[170px]">
                        {isEditingMC ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={newMinecraftNameInput}
                              onChange={e => setNewMinecraftNameInput(e.target.value)}
                              placeholder="اسم حساب ماين كرافت..."
                              className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-cyan-400 text-white font-mono focus:outline-none"
                              dir="ltr"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveUserMinecraftName(log.discordId, newMinecraftNameInput)}
                              disabled={saving}
                              className="px-2 py-1 rounded-lg bg-cyan-500 text-black font-bold text-xs hover:bg-cyan-400 transition-colors cursor-pointer"
                            >
                              حفظ
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingMinecraftNameUser(null)}
                              className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {userProfile?.minecraftName || log.minecraftName ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
                                <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="font-mono text-xs font-bold text-cyan-300" dir="ltr">
                                  {userProfile?.minecraftName || log.minecraftName}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMinecraftNameUser({
                                      discordId: log.discordId,
                                      currentName: userProfile?.minecraftName || log.minecraftName || '',
                                    });
                                    setNewMinecraftNameInput(userProfile?.minecraftName || log.minecraftName || '');
                                  }}
                                  className="p-1 rounded text-slate-400 hover:text-cyan-300"
                                  title="تعديل اسم حساب ماين كرافت"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMinecraftNameUser({ discordId: log.discordId, currentName: '' });
                                  setNewMinecraftNameInput('');
                                }}
                                className="px-2.5 py-1 rounded-xl border border-dashed border-slate-700 hover:border-cyan-400 text-slate-400 hover:text-cyan-300 text-xs transition-colors flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>ربط حساب ماين كرافت</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Login Stats Pill */}
                      <div className="text-right sm:text-center space-y-0.5">
                        <div className="text-xs font-mono font-bold text-slate-200">
                          {log.loginCount || 1} تسجيل دخول
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {formattedDate}
                        </div>
                      </div>

                      {/* Tier Badge */}
                      <div className="flex-shrink-0">
                        {tierDef ? (
                          <span
                            className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold shadow-sm"
                            style={{
                              backgroundColor: `${tierDef.color || '#00e5ff'}20`,
                              color: tierDef.color || '#00e5ff',
                              border: `1px solid ${tierDef.color || '#00e5ff'}40`,
                            }}
                          >
                            {tierDef.name}
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-500">
                            بدون تصنيف
                          </span>
                        )}
                      </div>

                      {/* Manage Roles & Tier button */}
                      <button
                        type="button"
                        onClick={() => {
                          const targetUser = userProfile || {
                            id: `user_${log.discordId}`,
                            discordId: log.discordId,
                            username: log.username,
                            globalName: log.displayName,
                            avatar: log.avatar,
                            isAdmin: false,
                            createdAt: log.loginAt,
                          };
                          handleEditProfile(targetUser);
                          setActiveTab('profiles');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-black text-cyan-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>الرتب والتقييم</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredLoginLogs.length === 0 && (
                <div className="p-12 text-center text-slate-400 text-xs sm:text-sm rounded-2xl bg-slate-900/40 border border-dashed border-slate-800">
                  {loginLogSearchFilter
                    ? 'لم يتم العثور على أي نتائج تطابق البحث.'
                    : 'لم يقم أي مستخدم بتسجيل الدخول بعد عبر ديسكورد.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: Tier Testers Management --- */}
      {activeTab === 'testers' && (
        <div className="space-y-8 text-right" dir="rtl">
          {/* Header Card */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/25 relative overflow-hidden space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.2)]">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-white">
                    إدارة مختبري المستويات المعتمدين (Tier Testers)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    إضافة وتعديل وحذف وإعادة ترتيب المختبرين المعتمدين المعروضين في صفحة اختبار المستويات العامة
                  </p>
                </div>
              </div>

              <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 self-start sm:self-auto">
                <span>إجمالي المختبرين: </span>
                <span className="font-bold text-white text-sm">{testersList.length}</span>
              </div>
            </div>

            {/* Tester Form */}
            <form onSubmit={handleAddOrUpdateTester} className="space-y-4 pt-2">
              <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                <span>{editingTester ? `تعديل المختبر (${editingTester.discordDisplayName || editingTester.minecraftName})` : 'إضافة مختبر معتمد جديد'}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Discord ID with Lookup */}
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1.5">
                    1. معرّف حساب ديسكورد (Discord User ID) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={testerDiscordId}
                      onChange={e => setTesterDiscordId(e.target.value)}
                      placeholder="مثال: 819203810293819201"
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                      dir="ltr"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handleLookupTesterDiscord(testerDiscordId)}
                      disabled={lookingUpTesterDiscord || !testerDiscordId.trim()}
                      className="px-3.5 py-2.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{lookingUpTesterDiscord ? 'جاري الفحص...' : 'فحص وجلب'}</span>
                    </button>
                  </div>
                </div>

                {/* Minecraft IGN */}
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1.5">
                    2. اسم حساب ماين كرافت (Minecraft IGN) *
                  </label>
                  <input
                    type="text"
                    value={testerMinecraftName}
                    onChange={e => setTesterMinecraftName(e.target.value)}
                    placeholder="مثال: FrostByte_ أو WhiteKnightMC"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              {/* Fetched Discord Profile Preview if present */}
              {(testerDiscordName || testerDiscordAvatar) && (
                <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center gap-3">
                  <img
                    src={testerDiscordAvatar || '/logo.png'}
                    alt="Preview"
                    className="w-10 h-10 rounded-xl object-cover border border-cyan-400"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                  />
                  <div className="text-xs space-y-0.5">
                    <div className="font-bold text-white">{testerDiscordName}</div>
                    {testerDiscordUsername && (
                      <div className="font-mono text-cyan-400 text-[11px]" dir="ltr">@{testerDiscordUsername}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Optional Specialty / Specialty Tag */}
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1.5">
                  3. التخصص / المودات المعتمدة للاختبار (اختياري)
                </label>
                <input
                  type="text"
                  value={testerSpecialty}
                  onChange={e => setTesterSpecialty(e.target.value)}
                  placeholder="مثال: Netherite Pot & Crystal PvP أو Axe & Shield"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-blue-600 via-cyan-500 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-white shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingTester ? 'حفظ التعديلات' : 'إضافة المختبر الرسمي'}</span>
                </button>
                {editingTester && (
                  <button
                    type="button"
                    onClick={handleCancelEditTester}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </div>
            </form>

            {/* List of Testers with Reordering */}
            <div className="pt-6 border-t border-slate-800/80 space-y-3">
              <h3 className="font-heading font-bold text-sm text-slate-200">
                قائمة المختبرين المعتمدين الحالية ({testersList.length})
              </h3>

              <div className="space-y-2.5">
                {testersList.map((tester, idx) => (
                  <div
                    key={tester.id}
                    className="p-4 rounded-2xl glass-card border border-slate-800/80 hover:border-cyan-500/30 transition-all flex items-center justify-between gap-3"
                  >
                    {/* Position and details */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Up/Down buttons */}
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveTester(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded bg-slate-800 hover:bg-cyan-500 hover:text-black text-slate-400 disabled:opacity-30 transition-colors"
                          title="تحريك لأعلى"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveTester(idx, 'down')}
                          disabled={idx === testersList.length - 1}
                          className="p-1 rounded bg-slate-800 hover:bg-cyan-500 hover:text-black text-slate-400 disabled:opacity-30 transition-colors"
                          title="تحريك لأسفل"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="font-mono font-bold text-xs text-cyan-400 w-6 text-center">
                        #{idx + 1}
                      </span>

                      <img
                        src={tester.discordAvatar || '/logo.png'}
                        alt={tester.discordDisplayName || tester.minecraftName}
                        className="w-11 h-11 rounded-xl object-cover border border-cyan-500/30 flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                      />

                      <div className="min-w-0 space-y-0.5 text-right">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-heading font-bold text-white text-sm">
                            {tester.discordDisplayName || tester.minecraftName}
                          </span>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300" dir="ltr">
                            {tester.minecraftName}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2" dir="ltr">
                          {tester.discordUsername && <span>@{tester.discordUsername}</span>}
                          <span className="text-slate-500">({tester.discordId})</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditTester(tester)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                        title="تعديل"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTester(tester)}
                        className="p-2 rounded-xl bg-red-950/50 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 transition-colors cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {testersList.length === 0 && (
                  <div className="p-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-slate-400 text-xs">
                    لم تتم إضافة أي مختبرين معتمدين بعد.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Settings (Server Name, Logo, YouTube, Badge) */}
      {activeTab === 'settings' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/25 space-y-6 text-right">
          <div>
            <h2 className="font-heading font-bold text-xl text-white">الإعدادات العامة لموقع المجتمع</h2>
            <p className="text-xs text-slate-400">تعديل اسم السيرفر، اللوجو، رابط اليوتيوب، وشارة الترحيب العلوية.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-2">
                1. اسم مجتمع سيرفر ديسكورد
              </label>
              <input
                type="text"
                value={settings.serverName}
                onChange={e => setSettings({ ...settings, serverName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none"
                placeholder="مثال: 𝑾𝒉𝒊𝒕𝒆 𝑲𝒊𝒏𝒈𝒅𝒐𝒎"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-2">
                2. شارة الترحيب العلوية في الصفحة الرئيسية
              </label>
              <input
                type="text"
                value={settings.welcomeBadgeText || ''}
                onChange={e => setSettings({ ...settings, welcomeBadgeText: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none"
                placeholder="مثال: المجتمع التنافسي الرسمي 2026"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <ImageUploadInput
                label="3. صورة أو لوجو مجتمع السيرفر (Server Logo)"
                sublabel="يمكنك رفع اللوجو مباشرة من جهازك أو إدخال رابط خارجي"
                value={settings.logoUrl || '/logo.png'}
                onChange={url => setSettings({ ...settings, logoUrl: url })}
                aspectRatio="square"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-2">
                4. رابط قناتي على يوتيوب
              </label>
              <input
                type="text"
                value={settings.youtubeUrl}
                onChange={e => setSettings({ ...settings, youtubeUrl: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none text-left font-mono"
                placeholder="https://www.youtube.com/@YourChannel"
                dir="ltr"
              />
            </div>

            {/* Field 5: Discord Server Invite URL */}
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-2">
                5. رابط دعوة سيرفر ديسكورد (زر انضمام للسيرفر)
              </label>
              <input
                type="text"
                value={settings.discordInviteUrl || ''}
                onChange={e => setSettings({ ...settings, discordInviteUrl: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none text-left font-mono"
                placeholder="https://discord.gg/whitekingdom"
                dir="ltr"
              />
              <p className="text-[11px] text-slate-400 mt-1">يظهر هذا الرابط في زر "انضمام للسيرفر" في أعلى الموقع والصفحة الرئيسية.</p>
            </div>

            {/* Field 6: Owner Discord Profile Settings */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>6. صورة واسم حساب صاحب السيرفر والموقع (من ديسكورد)</span>
                </div>
                <button
                  type="button"
                  onClick={handleSetCurrentAccountAsOwner}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500 hover:text-black transition-all cursor-pointer self-start sm:self-auto"
                >
                  استخدام حسابي المسجل حالياً كمالك
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    معرف ديسكورد للمالك (Discord ID)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settings.ownerDiscordId || ''}
                      onChange={e => setSettings({ ...settings, ownerDiscordId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono"
                      placeholder="184719284719284719"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      disabled={lookingUpDiscord}
                      onClick={() => handleLookupOwnerDiscord(settings.ownerDiscordId || '')}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-black hover:bg-cyan-400 cursor-pointer flex-shrink-0"
                    >
                      {lookingUpDiscord ? 'جلب...' : 'جلب من ديسكورد'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    اسم المالك المعروض
                  </label>
                  <input
                    type="text"
                    value={settings.ownerName || ''}
                    onChange={e => setSettings({ ...settings, ownerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                    placeholder="White"
                  />
                </div>

                <div className="sm:col-span-2">
                  <ImageUploadInput
                    label="صورة حساب المالك (Owner Avatar)"
                    sublabel="ارفع صورتك مباشرة من جهازك أو اتركها لجلبها تلقائياً من ديسكورد"
                    value={settings.ownerAvatar || ''}
                    onChange={url => setSettings({ ...settings, ownerAvatar: url })}
                    aspectRatio="square"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    وسم / لقب المالك
                  </label>
                  <input
                    type="text"
                    value={settings.ownerTag || ''}
                    onChange={e => setSettings({ ...settings, ownerTag: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                    placeholder="صاحب السيرفر ومؤسس الموقع"
                  />
                </div>
              </div>

              {/* Owner Live Preview */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                <span className="text-xs text-slate-400 font-mono">معاينة بطاقة المالك في الموقع:</span>
                <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#070b16] border border-cyan-500/40">
                  {settings.ownerAvatar ? (
                    <img
                      src={settings.ownerAvatar}
                      alt={settings.ownerName || 'Owner'}
                      className="w-7 h-7 rounded-full border border-cyan-400 object-cover"
                    />
                  ) : (
                    <Crown className="w-5 h-5 text-amber-400" />
                  )}
                  <div className="text-right">
                    <span className="text-xs font-bold text-white">@{settings.ownerName || 'اسم المالك'}</span>
                    <span className="text-[10px] text-amber-300 mr-2 font-mono">👑 {settings.ownerTag || 'مؤسس'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => handleSaveSettings()}
              disabled={saving}
              className="px-6 py-3 rounded-xl font-heading font-bold text-sm bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab: News & Announcements Management */}
      {activeTab === 'news' && (
        <div className="space-y-8 text-right">
          {/* News Intro Header Editor */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/25 space-y-4">
            <h3 className="font-heading font-bold text-lg text-white">النص الترحيبي لصفحة الأخبار</h3>
            <textarea
              rows={3}
              value={settings.newsContent || ''}
              onChange={e => setSettings({ ...settings, newsContent: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
              placeholder="اكتب هنا مقدمة صفحة الأخبار..."
            />
            <div className="flex justify-end">
              <button
                onClick={() => handleSaveSettings()}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-black flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ مقدمة صفحة الأخبار</span>
              </button>
            </div>
          </div>

          {/* Add News Article Form with Role Mention Helper */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/25 space-y-5">
            <div>
              <h2 className="font-heading font-bold text-xl text-white">نشر خبر أو تحديث جديد</h2>
              <p className="text-xs text-slate-400">
                يمكنك كتابة العنوان، الفئة، رابط الصورة، وعمل منشن لرولات السيرفر لتظهر بألوانها وشاراتها مثل ديسكورد!
              </p>
            </div>

            <form onSubmit={handleAddNews} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">
                    عنوان الخبر / التحديث
                  </label>
                  <input
                    type="text"
                    value={newNewsTitle}
                    onChange={e => setNewNewsTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                    placeholder="مثال: إطلاق بطولة White Kingdom الأولى أو تعديل رولات السيرفر"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">
                    تصنيف الخبر
                  </label>
                  <input
                    type="text"
                    value={newNewsCategory}
                    onChange={e => setNewNewsCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                    placeholder="مثال: إعلان هام، تحديثات، بطولات"
                    required
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <ImageUploadInput
                  label="صورة أو بانر الخبر التوضيحي (اختياري)"
                  sublabel="ارفع صورة توضيحية من جهازك أو الصق رابط صورة خارجي"
                  value={newNewsImageUrl}
                  onChange={setNewNewsImageUrl}
                  aspectRatio="banner"
                />
              </div>

              {/* Quick Mention Toolbar */}
              {roles && roles.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>اضغط على أي رول لإدراج منشن له في محتوى الخبر:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {roles.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleInsertMentionToNews(r.name)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer hover:scale-105"
                        style={{
                          backgroundColor: `${r.color}20`,
                          borderColor: `${r.color}60`,
                          color: r.color,
                        }}
                      >
                        {r.emoji} @{r.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-mono font-semibold text-slate-300 uppercase">
                    محتوى الخبر والتفاصيل (يدعم منشن الرولات والرومات)
                  </label>
                  <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                    <AtSign className="w-3.5 h-3.5" />
                    <span>اكتب @ لاختيار رول تلقائياً</span>
                  </span>
                </div>

                <textarea
                  ref={newsTextareaRef}
                  rows={5}
                  value={newNewsContent}
                  onChange={handleNewsContentChange}
                  onKeyUp={handleNewsCursorCheck}
                  onClick={handleNewsCursorCheck}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-sans leading-relaxed focus:border-cyan-400 focus:outline-none"
                  placeholder="اكتب تفاصيل التحديث هنا، اكتب @ وستظهر لك قائمة الرولات لاختيار أي رول مباشرة..."
                  required
                />

                {/* Floating Role Mention Autocomplete Dropdown */}
                {mentionDropdownOpen && (
                  <div className="absolute bottom-full right-0 mb-2 z-40 w-full sm:w-80 bg-[#0c1427] border border-cyan-400/60 rounded-2xl shadow-2xl p-2.5 animate-in fade-in zoom-in-95 duration-150 text-right">
                    <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1 text-cyan-300 font-bold">
                        <AtSign className="w-3.5 h-3.5" />
                        <span>اختر رول لإدراجه في المنشن:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setMentionDropdownOpen(false)}
                        className="text-slate-400 hover:text-white px-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1 p-1">
                      {roles
                        .filter(r => !mentionFilter || r.name.toLowerCase().includes(mentionFilter))
                        .map(role => (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => handleSelectMentionRole(role.name)}
                            className="w-full flex items-center justify-between p-2 rounded-xl text-xs hover:bg-cyan-500/15 border border-transparent hover:border-cyan-500/30 transition-all text-right group cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">{role.emoji}</span>
                              <span className="font-bold font-mono" style={{ color: role.color }}>
                                @{role.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {role.showInList === false ? 'مخفي' : 'عام'}
                            </span>
                          </button>
                        ))}
                      {roles.filter(r => !mentionFilter || r.name.toLowerCase().includes(mentionFilter)).length === 0 && (
                        <div className="p-3 text-center text-xs text-slate-500">
                          لا يوجد رول يطابق "{mentionFilter}"
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={newNewsPinned}
                    onChange={e => setNewNewsPinned(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-400 w-4 h-4"
                  />
                  <span>تثبيت هذا الخبر في أعلى الصفحة (Pinned) 📌</span>
                </label>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-black flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>نشر الخبر</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Published News */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/25 space-y-4">
            <h3 className="font-heading font-bold text-lg text-white">الأخبار والتحديثات المنشورة ({newsArticles.length})</h3>

            <div className="divide-y divide-slate-800">
              {newsArticles.map(article => (
                <div key={article.id} className="py-5 space-y-3">
                  {editingNews?.id === article.id ? (
                    <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-cyan-500/30">
                      <input
                        type="text"
                        value={editingNews.title}
                        onChange={e => setEditingNews({ ...editingNews, title: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-bold"
                      />
                      <textarea
                        rows={4}
                        value={editingNews.content}
                        onChange={e => setEditingNews({ ...editingNews, content: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
                      />
                      <ImageUploadInput
                        label="صورة أو بانر الخبر"
                        sublabel="ارفع صورة جديدة من جهازك أو عدل الرابط"
                        value={editingNews.imageUrl || ''}
                        onChange={url => setEditingNews({ ...editingNews, imageUrl: url })}
                        aspectRatio="banner"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateNews(editingNews)}
                          className="px-4 py-1.5 rounded-lg bg-cyan-500 text-black font-bold text-xs"
                        >
                          حفظ التعديل
                        </button>
                        <button
                          onClick={() => setEditingNews(null)}
                          className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 text-xs">
                          {article.pinned && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">مثبت</span>
                          )}
                          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">{article.category}</span>
                          <span className="text-slate-500 text-[11px]">{new Date(article.createdAt).toLocaleDateString('ar-EG')}</span>
                        </div>
                        <h4 className="font-bold text-white text-base">{article.title}</h4>
                        <div className="text-xs text-slate-300 line-clamp-2">
                          <DiscordFormattedText text={article.content} roles={roles} />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setEditingNews(article)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors"
                          title="تعديل الخبر"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNews(article.id, article.title)}
                          className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 transition-colors"
                          title="حذف الخبر"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Server Roles Management */}
      {activeTab === 'roles' && (
        <div className="space-y-8 text-right">
          {/* Add Role Form */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/25 space-y-5">
            <div>
              <h2 className="font-heading font-bold text-xl text-white">إضافة رول ديسكورد جديد مع لونه وإيموجي</h2>
              <p className="text-xs text-slate-400">
                يمكنك ضبط رولات السيرفر باللون والإيموجي المخصص لها لتعمل ميزة المنشن في الأخبار والتحديثات.
              </p>
            </div>

            <form onSubmit={handleAddRole} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-5">
                  <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">
                    اسم الرول (Role Name)
                  </label>
                  <input
                    type="text"
                    value={newRoleName}
                    onChange={e => setNewRoleName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                    placeholder="مثال: Tier 1 Apex أو Official Tester"
                    required
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">
                    رمز الإيموجي
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newRoleEmoji}
                      onChange={e => setNewRoleEmoji(e.target.value)}
                      className="w-16 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-center text-lg"
                      placeholder="👑"
                    />
                    <div className="flex-1 flex items-center gap-1 overflow-x-auto p-1 bg-slate-900/60 rounded-xl border border-slate-800">
                      {EMOJI_PRESETS.map((em, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setNewRoleEmoji(em)}
                          className="p-1 text-base hover:scale-125 transition-transform"
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">
                    لون الرول (Hex Color)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newRoleColor}
                      onChange={e => setNewRoleColor(e.target.value)}
                      className="w-10 h-10 rounded-xl border border-slate-700 cursor-pointer bg-slate-900"
                    />
                    <input
                      type="text"
                      value={newRoleColor}
                      onChange={e => setNewRoleColor(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs uppercase"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* Color Presets */}
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 font-mono">ألوان شائعة لديسكورد:</span>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewRoleColor(p.color)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer hover:scale-105"
                      style={{
                        backgroundColor: `${p.color}20`,
                        borderColor: `${p.color}60`,
                        color: p.color,
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">
                  الوصف والمهام داخل سيرفر ديسكورد (اختياري)
                </label>
                <input
                  type="text"
                  value={newRoleDescription}
                  onChange={e => setNewRoleDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                  placeholder="مثال: رول رسمي لمختبري ومحكمي المستويات"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-cyan-300 uppercase mb-1">
                  لمن تُمنح هذه الرتبة؟ وفي أي حالة أو سبب؟ (شروط وحالات المنح)
                </label>
                <textarea
                  rows={2}
                  value={newRoleCriteria}
                  onChange={e => setNewRoleCriteria(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm leading-relaxed"
                  placeholder="مثال: تُمنح للاعبين الذين يجتازون اختبار HT1 بنجاح ويحققون أعلى تقييم، أو يمنح لأعضاء الإدارة..."
                />
                <p className="text-[11px] text-slate-400 mt-1">يظهر هذا النص لأي زائر يضغط على الرول في الموقع لمعرفة شروط الحصول عليه.</p>
              </div>

              {/* Show in list toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="text-right">
                  <span className="block text-xs font-bold text-slate-200">إظهار في قائمة الرولات العامة (Show in Role Bar)</span>
                  <span className="block text-[11px] text-slate-400">
                    عند التفعيل: يظهر في شريط الرولات العامة أعلى الأخبار. عند الإلغاء: يختفي من القائمة العامة ويظهر فقط عند عمل منشن له في الأخبار.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={newRoleShowInList}
                  onChange={e => setNewRoleShowInList(e.target.checked)}
                  className="w-5 h-5 rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                />
              </div>

              {/* Live Preview */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">معاينة شكل المنشن في الموقع:</span>
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm"
                  style={{
                    backgroundColor: `${newRoleColor}20`,
                    borderColor: `${newRoleColor}60`,
                    color: newRoleColor,
                    boxShadow: `0 0 15px ${newRoleColor}30`,
                  }}
                >
                  <span className="text-sm">{newRoleEmoji}</span>
                  <span>@{newRoleName || 'اسم الرول'}</span>
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-black flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة الرول</span>
                </button>
              </div>
            </form>
          </div>

          {/* Roles List */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/25 space-y-4">
            <h3 className="font-heading font-bold text-lg text-white">رولات السيرفر الحالية ({roles.length})</h3>

            <div className="divide-y divide-slate-800">
              {roles.map(role => (
                <div key={role.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {editingRole?.id === role.id ? (
                    <div className="w-full space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-cyan-500/30">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={editingRole.name}
                          onChange={e => setEditingRole({ ...editingRole, name: e.target.value })}
                          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                          placeholder="اسم الرول"
                        />
                        <input
                          type="text"
                          value={editingRole.emoji || ''}
                          onChange={e => setEditingRole({ ...editingRole, emoji: e.target.value })}
                          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs text-center"
                          placeholder="إيموجي"
                        />
                        <input
                          type="color"
                          value={editingRole.color}
                          onChange={e => setEditingRole({ ...editingRole, color: e.target.value })}
                          className="w-full h-9 rounded-xl bg-slate-950 border border-slate-700 cursor-pointer"
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          value={editingRole.description || ''}
                          onChange={e => setEditingRole({ ...editingRole, description: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                          placeholder="الوصف والمهام داخل ديسكورد"
                        />
                      </div>

                      <div>
                        <textarea
                          rows={2}
                          value={editingRole.criteria || ''}
                          onChange={e => setEditingRole({ ...editingRole, criteria: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                          placeholder="لمن تُمنح هذه الرتبة؟ وشروط المنح (يظهر عند النقر على الرول)"
                        />
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-xs text-slate-300">إظهار في قائمة الرولات العامة:</span>
                        <input
                          type="checkbox"
                          checked={editingRole.showInList !== false}
                          onChange={e => setEditingRole({ ...editingRole, showInList: e.target.checked })}
                          className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleUpdateRole(editingRole)}
                          className="px-4 py-1.5 rounded-lg bg-cyan-500 text-black font-bold text-xs cursor-pointer"
                        >
                          حفظ التعديل
                        </button>
                        <button
                          onClick={() => setEditingRole(null)}
                          className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border flex-shrink-0"
                          style={{
                            backgroundColor: `${role.color}15`,
                            borderColor: `${role.color}50`,
                            color: role.color,
                            boxShadow: `0 0 12px ${role.color}20`,
                          }}
                        >
                          {role.emoji && <span className="text-sm">{role.emoji}</span>}
                          <span>@{role.name}</span>
                        </span>

                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-200 font-semibold">{role.description || role.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                              role.showInList !== false
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {role.showInList !== false ? 'ظاهر بالقائمة العامة' : 'مخفي (بالمنشن فقط)'}
                            </span>
                          </div>
                          {role.criteria && (
                            <span className="text-[11px] text-cyan-400/80 line-clamp-1">
                              شروط المنح: {role.criteria}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setEditingRole(role)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors"
                          title="تعديل الرول"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id, role.name)}
                          className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 transition-colors"
                          title="حذف الرول"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: About Page Content */}
      {activeTab === 'about' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/25 space-y-6 text-right">
          <div>
            <h2 className="font-heading font-bold text-xl text-white">محتوى صفحة &quot;عن السيرفر&quot;</h2>
            <p className="text-xs text-slate-400">
              اكتب وعدل كامل النص والتعليمات التي ستظهر للمستخدمين في صفحة &quot;عن السيرفر&quot;.
            </p>
          </div>

          <div>
            <textarea
              rows={12}
              value={settings.aboutContent}
              onChange={e => setSettings({ ...settings, aboutContent: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm leading-relaxed focus:border-cyan-400 focus:outline-none font-sans"
              placeholder="اكتب هنا كل ما تريده عن سيرفر الديسكورد ومجتمع 𝑾𝒉𝒊𝒕𝒆 𝑲𝒊𝒏𝒈𝒅𝒐𝒎..."
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => handleSaveSettings()}
              disabled={saving}
              className="px-6 py-3 rounded-xl font-heading font-bold text-sm bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ محتوى صفحة عن السيرفر'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab: Tier Test Content */}
      {activeTab === 'tierTest' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/25 space-y-6 text-right">
          <div>
            <h2 className="font-heading font-bold text-xl text-white">محتوى صفحة &quot;اختبار المستويات&quot;</h2>
            <p className="text-xs text-slate-400">
              اكتب وعدل النصوص التي توضح أن هذا الاختبار شخصي وغير رسمي ويقام في أي سيرفر وأي جيمود تختاره.
            </p>
          </div>

          <div>
            <textarea
              rows={12}
              value={settings.tierTestContent}
              onChange={e => setSettings({ ...settings, tierTestContent: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm leading-relaxed focus:border-cyan-400 focus:outline-none font-sans"
              placeholder="وضح للمجتمع تفاصيل الاختبار والقواعد الخاصة بك..."
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => handleSaveSettings()}
              disabled={saving}
              className="px-6 py-3 rounded-xl font-heading font-bold text-sm bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ محتوى صفحة اختبار المستويات'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab: Custom Tiers Management (Add, change color, custom rank, delete) */}
      {activeTab === 'tiers' && (
        <div className="space-y-8 text-right">
          {/* Header & Reset Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel rounded-3xl p-6 border border-cyan-500/25">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-lg">
                <Award className="w-5 h-5 text-cyan-400" />
                <h2>إدارة وتخصيص مستويات وتصنيفات السيرفر (Tiers Management)</h2>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                أضف مستويات جديدة (مثل <span className="font-mono text-cyan-300">LT6</span> أو <span className="font-mono text-cyan-300">HT6</span> أو أسماء مخصصة)، غيّر لون أي مستوى (مثل جعل HT1 أحمر)، واحذف ما لا تحتاجه.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetTiers}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-2 cursor-pointer transition-all flex-shrink-0"
              title="استعادة التصنيفات الافتراضية الأصلية (HT1 إلى LT5)"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>استعادة المستويات الافتراضية</span>
            </button>
          </div>

          {/* Form: Add New Tier */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/25 space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>إضافة مستوى وتصنيف جديد (Add New Tier)</span>
              </h3>
              <p className="text-xs text-slate-400">
                أدخل رمز المستوى (مثل LT6)، واختر لونه وتصنيفه ليظهر في قوائم الاختبار ولوحة الصدارة فوراً.
              </p>
            </div>

            <form onSubmit={handleAddTier} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">
                    رمز المستوى (Tier Code / Name) *
                  </label>
                  <input
                    type="text"
                    value={newTierName}
                    onChange={e => setNewTierName(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm uppercase focus:border-cyan-400 focus:outline-none"
                    placeholder="مثال: LT6 أو HT6 أو PRO"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">يُكتب بحروف إنجليزية كبيرة</span>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">
                    الاسم المعروض / التوضيحي (Label)
                  </label>
                  <input
                    type="text"
                    value={newTierLabel}
                    onChange={e => setNewTierLabel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none"
                    placeholder="مثال: Low Tier 6 أو الرتبة 6"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">يظهر بجانب الرمز في نافذة التفاصيل</span>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">
                    الترتيب الرقمي (Rank Number)
                  </label>
                  <input
                    type="number"
                    value={newTierRank}
                    onChange={e => setNewTierRank(e.target.value ? parseInt(e.target.value, 10) : '')}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:border-cyan-400 focus:outline-none"
                    placeholder="تلقائي (الأعلى رقماً يتصدر)"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">اختياري: اتركه فارغاً ليُحسب تلقائياً</span>
                </div>
              </div>

              {/* Color Chooser */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <label className="block text-xs font-mono font-bold text-cyan-300 uppercase">
                  لون المستوى وشارة التصنيف (Tier Color):
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newTierColor}
                      onChange={e => setNewTierColor(e.target.value)}
                      className="w-11 h-11 rounded-xl border border-slate-700 cursor-pointer bg-slate-900"
                    />
                    <input
                      type="text"
                      value={newTierColor}
                      onChange={e => setNewTierColor(e.target.value)}
                      className="w-28 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs uppercase"
                      dir="ltr"
                    />
                  </div>

                  {/* Preset chips */}
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {COLOR_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewTierColor(p.color)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer hover:scale-105"
                        style={{
                          backgroundColor: `${p.color}20`,
                          borderColor: `${p.color}60`,
                          color: p.color,
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Preview Badge */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                  <span className="text-xs text-slate-400 font-mono">معاينة شكل الشارة في الموقع:</span>
                  <span
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all"
                    style={{
                      backgroundColor: `${newTierColor}25`,
                      borderColor: `${newTierColor}70`,
                      color: '#ffffff',
                      boxShadow: `0 0 15px ${newTierColor}30`,
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: newTierColor,
                        boxShadow: `0 0 8px ${newTierColor}`,
                      }}
                    />
                    <span>{newTierName || 'TIER'}</span>
                    {newTierLabel && <span className="text-[11px] text-slate-300">({newTierLabel})</span>}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>{saving ? 'جاري الإضافة...' : 'إضافة المستوى إلى السيرفر'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Current Tiers with Inline Color Changing & Deletion */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/25 space-y-5">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-lg text-white">
                  المستويات والتصنيفات الحالية في السيرفر ({tiersList.length})
                </h3>
                <p className="text-xs text-slate-400">
                  يمكنك تغيير لون أي تصنيف مباشرة وحفظه، أو تعديل ترتيبه وحذفه.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tiersList.map(tier => {
                const isEditing = editingTier?.name === tier.name;

                return (
                  <div
                    key={tier.name}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-4"
                  >
                    {isEditing ? (
                      /* Inline Full Edit Form */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-xs font-bold text-cyan-300 font-mono">
                            تعديل المستوى: {editingTier.name}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-400 font-mono">الاسم التوضيحي</label>
                            <input
                              type="text"
                              value={editingTier.label || ''}
                              onChange={e => setEditingTier({ ...editingTier, label: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 font-mono">الرتبة الرقمية (Rank)</label>
                            <input
                              type="number"
                              value={editingTier.rank}
                              onChange={e => setEditingTier({ ...editingTier, rank: parseInt(e.target.value, 10) || 0 })}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                            />
                          </div>
                        </div>

                        {/* Color Picker inside Edit */}
                        <div>
                          <label className="text-[10px] text-slate-400 font-mono block mb-1">اللون المخصص</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={editingTier.color}
                              onChange={e => setEditingTier({ ...editingTier, color: e.target.value })}
                              className="w-9 h-9 rounded-lg border border-slate-700 cursor-pointer bg-slate-900"
                            />
                            <input
                              type="text"
                              value={editingTier.color}
                              onChange={e => setEditingTier({ ...editingTier, color: e.target.value })}
                              className="w-24 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                              dir="ltr"
                            />
                            <div className="flex flex-wrap gap-1 flex-1">
                              {COLOR_PRESETS.slice(0, 6).map((p, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setEditingTier({ ...editingTier, color: p.color })}
                                  className="w-5 h-5 rounded-md border"
                                  style={{ backgroundColor: p.color, borderColor: `${p.color}80` }}
                                  title={p.label}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateTier(editingTier)}
                            disabled={saving}
                            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all cursor-pointer"
                          >
                            حفظ التعديل
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTier(null)}
                            className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Card with Fast Color Tweaker */
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span
                              className="px-3.5 py-1.5 rounded-xl font-mono text-sm font-extrabold border transition-all"
                              style={{
                                backgroundColor: `${tier.color}25`,
                                borderColor: `${tier.color}70`,
                                color: '#ffffff',
                                boxShadow: `0 0 15px ${tier.color}30`,
                              }}
                            >
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-full ml-1.5"
                                style={{ backgroundColor: tier.color }}
                              />
                              {tier.name}
                            </span>
                            <div>
                              <div className="font-bold text-white text-sm">{tier.label || tier.name}</div>
                              <div className="text-[11px] font-mono text-slate-400">الترتيب: #{tier.rank}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingTier(tier)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                              title="تعديل بيانات المستوى"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTier(tier.name)}
                              className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 transition-colors cursor-pointer"
                              title="حذف هذا المستوى"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Quick Color Change Bar */}
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400 font-mono">اللون:</span>
                            <input
                              type="color"
                              value={tier.color}
                              onChange={e => {
                                const newColor = e.target.value;
                                setTiersList(prev => prev.map(t => t.name === tier.name ? { ...t, color: newColor } : t));
                              }}
                              className="w-7 h-7 rounded-lg border border-slate-700 cursor-pointer bg-slate-900"
                              title="اضغط لاختيار لون جديد"
                            />
                            <span className="text-xs font-mono text-slate-300 uppercase">{tier.color}</span>
                          </div>

                          {/* Quick Color Presets Chips */}
                          <div className="flex items-center gap-1">
                            {['#ef4444', '#f97316', '#f59e0b', '#10b981', '#00e5ff', '#38bdf8', '#3b82f6', '#a855f7'].map(c => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => {
                                  handleUpdateTier({ ...tier, color: c });
                                }}
                                className="w-4 h-4 rounded-full border transition-transform hover:scale-125 cursor-pointer"
                                style={{ backgroundColor: c, borderColor: `${c}80` }}
                                title={`تغيير اللون إلى ${c}`}
                              />
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleUpdateTier(tier)}
                            disabled={saving}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-black text-cyan-300 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" />
                            <span>حفظ اللون</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Supported Test Servers (with Images & Text support) */}
      {activeTab === 'servers' && (
        <div className="space-y-8 text-right">
          {/* Add New Server Form */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/25 space-y-4">
            <div>
              <h2 className="font-heading font-bold text-xl text-white">إضافة سيرفر أو قائمة اختبار جديدة</h2>
              <p className="text-xs text-slate-400">
                يمكنك إضافة اسم السيرفر، المعلومات، ورابط صورة توضيحية تظهر معه في الصفحة.
              </p>
            </div>

            <form onSubmit={handleAddServer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">
                    اسم السيرفر / القائمة
                  </label>
                  <input
                    type="text"
                    value={newServerName}
                    onChange={e => setNewServerName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none"
                    placeholder="مثال: Minemen Club"
                    required
                  />
                </div>
                <div>
                  <ImageUploadInput
                    label="صورة السيرفر أو طور اللعب (اختياري)"
                    sublabel="ارفع صورة توضيحية من جهازك أو الصق رابطاً"
                    value={newServerImageUrl}
                    onChange={setNewServerImageUrl}
                    aspectRatio="video"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">
                  معلومات وملاحظات عن السيرفر
                </label>
                <textarea
                  rows={3}
                  value={newServerInfo}
                  onChange={e => setNewServerInfo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none"
                  placeholder="مثال: ريجن EU / NA، مخصص لمبارزات النيذرلايت والتدريب الفردي..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-cyan-500 hover:bg-cyan-400 text-black flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة السيرفر للقائمة</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Servers */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/25 space-y-4">
            <h3 className="font-heading font-bold text-lg text-white">السيرفرات المضافة حالياً ({servers.length})</h3>

            <div className="divide-y divide-slate-800">
              {servers.map(server => (
                <div key={server.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {editingServer?.id === server.id ? (
                    <div className="w-full space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-400 font-mono">اسم السيرفر</label>
                          <input
                            type="text"
                            value={editingServer.name}
                            onChange={e => setEditingServer({ ...editingServer, name: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
                          />
                        </div>
                        <div>
                          <ImageUploadInput
                            label="صورة السيرفر"
                            value={editingServer.imageUrl || ''}
                            onChange={url => setEditingServer({ ...editingServer, imageUrl: url })}
                            aspectRatio="video"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono">المعلومات</label>
                        <textarea
                          rows={2}
                          value={editingServer.info}
                          onChange={e => setEditingServer({ ...editingServer, info: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateServer(editingServer)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500 text-black text-xs font-bold"
                        >
                          حفظ التعديل
                        </button>
                        <button
                          onClick={() => setEditingServer(null)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        {server.imageUrl ? (
                          <div className="w-16 h-12 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex-shrink-0">
                            <img src={server.imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 flex-shrink-0">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-white text-base">{server.name}</div>
                          {server.info && <div className="text-xs text-slate-400 mt-0.5 max-w-lg">{server.info}</div>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setEditingServer(server)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors"
                          title="تعديل السيرفر"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteServer(server.id)}
                          className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 transition-colors"
                          title="حذف السيرفر"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Leaderboard Players & Test Breakdowns */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-8 text-right">
          {/* Add New Player to Leaderboard Form */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/25 space-y-5">
            <div>
              <h2 className="font-heading font-bold text-xl text-white">إضافة لاعب جديد ونتائج الاختبار</h2>
              <p className="text-xs text-slate-400">
                أدخل اسم اللاعب في ماين كرافت، معرّف ديسكورد، التقييم، والألعاب التي تم اختباره فيها مع ملاحظاتك.
              </p>
            </div>

            {/* Note clarifying that players DO NOT need to log in to the site */}
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs md:text-sm text-cyan-200 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-cyan-300 font-bold block mb-0.5">معلومة هامة لإدارة الاختبارات:</strong>
                اللاعب <span className="text-white font-bold underline">لا يحتاج إطلاقاً لتسجيل الدخول في الموقع</span>! يكفي إدخال معرّف حسابه في ديسكورد (Discord User ID)، وسيتم تلقائياً جلب اسمه وصورته الرمزية وعرضهما في لوحة الصدارة فوراً. يمكنك أيضاً تخصيص الاسم والصورة مباشرة أدناه.
              </div>
            </div>

            <form onSubmit={handleAddPlayer} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* 1. Minecraft Username */}
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">
                    1. اسم اللاعب في ماين كرافت (IGN)
                  </label>
                  <input
                    type="text"
                    value={playerMinecraftName}
                    onChange={e => setPlayerMinecraftName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none"
                    placeholder="مثال: WhiteKnightMC"
                    required
                  />
                </div>

                {/* 2. Discord User ID */}
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">
                    2. معرّف ديسكورد (Discord User ID)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={playerDiscordId}
                      onChange={e => handleDiscordIdChange(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none font-mono text-left"
                      placeholder="184719284719284719"
                      dir="ltr"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handleLookupDiscord()}
                      disabled={lookingUpDiscord}
                      className="px-3.5 py-2.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 text-xs font-mono flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer border border-cyan-500/40"
                      title="التحقق من حساب الديسكورد وجلب الصورة والاسم"
                    >
                      <Search className="w-4 h-4" />
                      <span className="hidden sm:inline">جلب</span>
                    </button>
                  </div>
                </div>

                {/* 3. Tier Evaluation */}
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">
                    3. التقييم العام (Tier)
                  </label>
                  <select
                    value={playerTier}
                    onChange={e => setPlayerTier(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none font-mono"
                  >
                    {tiersList.map(t => (
                      <option key={t.name} value={t.name}>
                        {t.name} {t.label ? `- ${t.label}` : ''} (Rank {t.rank})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Editable Discord 3 Fields: Display Name, Username (@handle), and Avatar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">
                    الاسم المعروض (Display Name)
                  </label>
                  <input
                    type="text"
                    value={playerDiscordName}
                    onChange={e => setPlayerDiscordName(e.target.value)}
                    placeholder="مثال: White Sama"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">يظهر كاسم رئيسي في لوحة الصدارة</span>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">
                    اسم المستخدم الفريد (Username)
                  </label>
                  <input
                    type="text"
                    value={playerDiscordUsername}
                    onChange={e => setPlayerDiscordUsername(e.target.value)}
                    placeholder="مثال: itz_white_kh"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none font-mono"
                    dir="ltr"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">يظهر كـ @username في لوحة الصدارة</span>
                </div>

                <div>
                  <ImageUploadInput
                    label="صورة حساب ديسكورد (Discord Avatar)"
                    sublabel="تُجلب تلقائياً من الـ ID أو يمكنك رفع صورة من جهازك"
                    value={playerDiscordAvatar}
                    onChange={setPlayerDiscordAvatar}
                    aspectRatio="square"
                  />
                </div>
              </div>

              {/* Resolved Discord Live Preview */}
              {(playerDiscordName || playerDiscordUsername || playerDiscordAvatar) && (
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex items-center gap-3">
                  <img
                    src={playerDiscordAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                    alt="Discord Avatar"
                    className="w-10 h-10 rounded-full border border-cyan-500/50 object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-400">معاينة الحساب كما سيظهر للجميع في لوحة الصدارة:</div>
                    <div className="text-sm font-bold text-white truncate flex items-center gap-2">
                      <span>{playerDiscordName || 'Gladiator'}</span>
                      {playerDiscordUsername && (
                        <span className="text-xs font-mono text-cyan-400" dir="ltr">@{playerDiscordUsername}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 font-semibold">
                    جاهز للعرض
                  </span>
                </div>
              )}

              {/* Games Played Breakdown */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold text-cyan-300 uppercase">
                    الألعاب والمودات التي تم اختبارها في هذا التقييم:
                  </label>
                  <button
                    type="button"
                    onClick={handleAddGameRow}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة لعبة / مود آخر</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {playerGames.map((game, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 items-center">
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={game.gameName}
                          onChange={e => handleUpdateGameRow(idx, 'gameName', e.target.value)}
                          placeholder="اسم اللعبة (مثال: Netherite Pot)"
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={game.score || ''}
                          onChange={e => handleUpdateGameRow(idx, 'score', e.target.value)}
                          placeholder="النتيجة (مثال: 3 - 1)"
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono text-center"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          value={game.details || ''}
                          onChange={e => handleUpdateGameRow(idx, 'details', e.target.value)}
                          placeholder="تفاصيل الجولات أو الملاحظات"
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                        />
                      </div>
                      <div className="sm:col-span-1 flex justify-center">
                        {playerGames.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveGameRow(idx)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="حذف هذا الصف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes & Observations */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">
                  ملاحظات المدرب وتوجيهات الاختبار:
                </label>
                <textarea
                  rows={3}
                  value={playerNotes}
                  onChange={e => setPlayerNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none"
                  placeholder="اكتب نصائح وتوجيهات الاختبار (مثال: مستوى رائع في الصد، يحتاج إلى تحسين توقيت الـ W-Tap)..."
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-cyan-500 hover:bg-cyan-400 text-black flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة اللاعب إلى قائمة المتصدرين</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Players with Red Delete Button */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/25 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading font-bold text-lg text-white">إدارة وحذف الاختبارات واللاعبين ({leaderboard.length})</h3>
                <p className="text-xs text-slate-400">يمكنك تعديل أي لاعب أو حذفه وإلغاء اختباره بشكل نهائي وفوري من قاعدة البيانات.</p>
              </div>

              <div className="w-full sm:w-64 relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  value={playerSearchFilter}
                  onChange={e => setPlayerSearchFilter(e.target.value)}
                  placeholder="ابحث بالاسم أو الـ ID..."
                  className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-800">
              {leaderboard
                .filter(p => {
                  if (!playerSearchFilter.trim()) return true;
                  const q = playerSearchFilter.toLowerCase();
                  return (
                    p.minecraftName.toLowerCase().includes(q) ||
                    p.discordId.includes(q) ||
                    p.discordDisplayName.toLowerCase().includes(q)
                  );
                })
                .map((player, idx) => (
                <div key={player.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {editingPlayer?.id === player.id ? (
                    <div className="w-full space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-400 font-mono">اسم اللاعب في ماين كرافت</label>
                          <input
                            type="text"
                            value={editingPlayer.minecraftName}
                            onChange={e => setEditingPlayer({ ...editingPlayer, minecraftName: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-mono">معرّف ديسكورد</label>
                          <input
                            type="text"
                            value={editingPlayer.discordId}
                            onChange={e => setEditingPlayer({ ...editingPlayer, discordId: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm font-mono text-left"
                            dir="ltr"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-mono">التقييم (Tier)</label>
                          <select
                            value={editingPlayer.tierName}
                            onChange={e => setEditingPlayer({ ...editingPlayer, tierName: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm font-mono"
                          >
                            {tiersList.map(t => (
                              <option key={t.name} value={t.name}>{t.name} {t.label ? `(${t.label})` : ''} - Rank {t.rank}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-400 font-mono">الاسم المعروض</label>
                          <input
                            type="text"
                            value={editingPlayer.discordDisplayName || ''}
                            onChange={e => setEditingPlayer({ ...editingPlayer, discordDisplayName: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-mono">اسم المستخدم الفريد (@username)</label>
                          <input
                            type="text"
                            value={editingPlayer.discordUsername || ''}
                            onChange={e => setEditingPlayer({ ...editingPlayer, discordUsername: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm font-mono"
                            dir="ltr"
                          />
                        </div>
                        <div>
                          <ImageUploadInput
                            label="صورة حساب ديسكورد"
                            sublabel="ارفع صورة جديدة من جهازك أو الصق رابطاً"
                            value={editingPlayer.discordAvatar || ''}
                            onChange={url => setEditingPlayer({ ...editingPlayer, discordAvatar: url })}
                            aspectRatio="square"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-mono">ملاحظات المدرب والتوجيهات</label>
                        <textarea
                          rows={2}
                          value={editingPlayer.notes || ''}
                          onChange={e => setEditingPlayer({ ...editingPlayer, notes: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdatePlayer(editingPlayer)}
                          className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all cursor-pointer"
                        >
                          حفظ التعديلات
                        </button>
                        <button
                          onClick={() => setEditingPlayer(null)}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs transition-all cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center font-mono text-xs font-bold text-slate-500">
                          #{idx + 1}
                        </span>
                        <img
                          src={player.discordAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                          alt={player.discordDisplayName}
                          className="w-10 h-10 rounded-full object-cover border border-cyan-500/40"
                        />
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            <span>{player.minecraftName}</span>
                            {(() => {
                              const tDef = tiersList.find(t => t.name.toLowerCase() === player.tierName.toLowerCase());
                              const tColor = tDef?.color || '#00e5ff';
                              return (
                                <span
                                  className="text-[11px] px-2.5 py-0.5 rounded-lg border font-mono font-bold"
                                  style={{
                                    backgroundColor: `${tColor}20`,
                                    borderColor: `${tColor}60`,
                                    color: tColor,
                                  }}
                                >
                                  {player.tierName}
                                </span>
                              );
                            })()}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                            <span>ديسكورد:</span>
                            <span className="text-slate-300 font-semibold">{player.discordDisplayName}</span>
                            {player.discordUsername && (
                              <span className="text-cyan-400 font-mono text-[11px]" dir="ltr">@{player.discordUsername}</span>
                            )}
                            <span className="font-mono text-[10px] text-slate-500" dir="ltr">({player.discordId})</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setEditingPlayer(player)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                          title="تعديل بيانات اللاعب"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Prominent Delete / Cancel Test Button */}
                        <button
                          onClick={() => handleDeletePlayer(player.id, player.minecraftName)}
                          className="px-3.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                          title="حذف هذا اللاعب وإلغاء اختباره"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف / إلغاء الاختبار</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {leaderboard.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  لا يوجد لاعبين مسجلين حالياً.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 8: Discord Profiles, Roles, and Ratings Management */}
      {activeTab === 'profiles' && (
        <div className="space-y-8 text-right" dir="rtl">
          {/* Header Card */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/25 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-white">
                      إدارة حسابات ديسكورد والرولات والتقييمات
                    </h2>
                    <p className="text-xs text-slate-300 mt-0.5">
                      إنشاء وتعيين الرولات ومستويات Tiers لحسابات ديسكورد عبر معرّف ID دون اشتراط تسجيل دخول مسبق
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono text-cyan-300">
                <span>إجمالي الحسابات:</span>
                <span className="font-bold text-white text-sm">{profilesList.length}</span>
              </div>
            </div>

            {/* Profile Creation / Editing Form */}
            <div className="mt-6 pt-2 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>{editingProfile ? `تعديل الحساب (${editingProfile.globalName || editingProfile.username})` : 'إضافة أو تعيين حساب لاعب جديد عبر Discord ID'}</span>
                </h3>
                {editingProfile && (
                  <button
                    onClick={handleCancelEditProfile}
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </div>

              {/* Step 1: Discord ID Input & Automatic Lookup */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-end">
                <div className="lg:col-span-8 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-200">
                    معرّف حساب ديسكورد (Discord User ID) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      dir="ltr"
                      value={profileDiscordId}
                      onChange={(e) => setProfileDiscordId(e.target.value)}
                      placeholder="مثال: 184719284719284719 أو 1324725244073873539"
                      className="w-full h-11 px-4 rounded-xl bg-slate-900/90 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-600"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    المعرّف الثابت لحساب الديسكورد (17 إلى 20 رقماً). لا يعتمد على اسم المستخدم القابل للتغيير.
                  </p>
                </div>

                <div className="lg:col-span-4">
                  <button
                    type="button"
                    disabled={lookingUpProfileDiscord || !profileDiscordId.trim()}
                    onClick={() => handleLookupProfileDiscord()}
                    className="w-full h-11 px-4 rounded-xl font-heading font-bold text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-cyan-300 border border-cyan-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    {lookingUpProfileDiscord ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                        <span>جاري جلب بيانات الحساب...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 text-cyan-400" />
                        <span>فحص وجلب صورة واسم الحساب</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Step 2: Fallback Display Name & Avatar URL (if user hasn't logged in yet) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    الاسم الظاهر للاعب (Display Name) <span className="text-[11px] text-slate-500 font-normal">(اختياري / يُجلب تلقائياً)</span>
                  </label>
                  <input
                    type="text"
                    value={profileGlobalName}
                    onChange={(e) => setProfileGlobalName(e.target.value)}
                    placeholder="مثال: White Knight أو Gladiator"
                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    رابط صورة الحساب (Avatar URL) <span className="text-[11px] text-slate-500 font-normal">(اختياري / يُجلب تلقائياً)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {profileAvatar ? (
                      <img
                        src={profileAvatar}
                        alt="Avatar Preview"
                        className="w-10 h-10 rounded-xl border border-cyan-400 object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl border border-slate-700 bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0 text-xs">
                        ?
                      </div>
                    )}
                    <input
                      type="url"
                      dir="ltr"
                      value={profileAvatar}
                      onChange={(e) => setProfileAvatar(e.target.value)}
                      placeholder="https://cdn.discordapp.com/avatars/..."
                      className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Assign Website Roles (Multi-select) */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <label className="block text-xs font-bold text-slate-200">
                  الرولات الممنوحة لهذا الحساب (Website Roles)
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  اختر رولاً واحداً أو عدة رولات لمنحها لحساب ديسكورد هذا:
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {roles.map((role) => {
                    const isSelected = profileAssignedRoles.includes(role.id);
                    return (
                      <button
                        type="button"
                        key={role.id}
                        onClick={() => handleToggleProfileRole(role.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'shadow-[0_0_12px_rgba(0,229,255,0.3)] ring-2'
                            : 'opacity-60 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: `${role.color || '#00e5ff'}20`,
                          color: role.color || '#00e5ff',
                          border: `1px solid ${role.color || '#00e5ff'}60`,
                        }}
                      >
                        <span>{role.emoji || '🛡️'}</span>
                        <span>{role.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 mr-1" />}
                      </button>
                    );
                  })}
                  {roles.length === 0 && (
                    <p className="text-xs text-slate-500">لا توجد رولات مسجلة في السيرفر حالياً.</p>
                  )}
                </div>
              </div>

              {/* Step 4: Tier / Rating Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-200">
                    تقييم المستوى (Tier / Rating)
                  </label>
                  <select
                    value={profileTier}
                    onChange={(e) => setProfileTier(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:outline-none focus:border-cyan-400 transition-colors cursor-pointer"
                  >
                    <option value="">بدون تقييم حالياً (غير مقيّم)</option>
                    {tiersList.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name} - {t.label || t.name} (#{t.rank})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-center p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  {profileTier ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">معاينة التقييم:</span>
                      <span
                        className="px-3 py-1 rounded-lg text-xs font-heading font-black shadow-md"
                        style={{
                          backgroundColor: `${tiersList.find(t => t.name === profileTier)?.color || '#00e5ff'}20`,
                          color: tiersList.find(t => t.name === profileTier)?.color || '#00e5ff',
                          border: `1px solid ${tiersList.find(t => t.name === profileTier)?.color || '#00e5ff'}60`,
                        }}
                      >
                        {profileTier}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">الحساب بدون تقييم Tier حالياً</span>
                  )}
                </div>
              </div>

              {/* Step 5: Evaluation Notes */}
              <div className="space-y-1.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <label className="block text-xs font-bold text-slate-200">
                  ملاحظات وتفاصيل التقييم (Evaluation Notes & Description)
                </label>
                <textarea
                  rows={3}
                  value={profileEvaluationNotes}
                  onChange={(e) => setProfileEvaluationNotes(e.target.value)}
                  placeholder="اكتب هنا ملاحظات وتفاصيل التقييم، أداء اللاعب في النيذرلايت أو الكريستال أو الشيلد، نقاط القوة والملاحظات الفنية الخاصة بالاختبار..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs leading-relaxed focus:outline-none focus:border-cyan-400 transition-colors"
                />
                <p className="text-[11px] text-slate-400">
                  هذه الملاحظات تظهر للاعب نفسه داخل ملفه الشخصي كمرجع لتقييمه الفني.
                </p>
              </div>

              {/* Save & Reset Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  disabled={saving || !profileDiscordId.trim()}
                  onClick={handleSaveProfile}
                  className="px-6 py-3 rounded-xl font-heading font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 text-white shadow-[0_0_20px_rgba(0,229,255,0.35)] transition-all cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'جاري الحفظ في PostgreSQL...' : editingProfile ? 'حفظ تعديلات الحساب' : 'حفظ وتثبيت الملف في قاعدة البيانات'}</span>
                </button>

                {editingProfile && (
                  <button
                    type="button"
                    onClick={handleCancelEditProfile}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Existing Profiles Table & Search */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/25 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <h3 className="font-heading font-extrabold text-lg text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <span>قائمة الحسابات والملفات المسجلة</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  جميع الحسابات التي تم تعيين رولات أو تقييمات لها في الموقع
                </p>
              </div>

              {/* Search Filter by Discord ID or Name */}
              <div className="w-full sm:w-72 relative">
                <input
                  type="text"
                  value={profileSearchFilter}
                  onChange={(e) => setProfileSearchFilter(e.target.value)}
                  placeholder="ابحث بالـ Discord ID أو الاسم..."
                  className="w-full h-10 px-3 pl-9 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 transition-colors placeholder:text-slate-600"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Profiles Cards / Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profilesList
                .filter((p) => {
                  if (!profileSearchFilter.trim()) return true;
                  const query = profileSearchFilter.trim().toLowerCase();
                  return (
                    p.discordId.includes(query) ||
                    (p.globalName && p.globalName.toLowerCase().includes(query)) ||
                    (p.username && p.username.toLowerCase().includes(query)) ||
                    (p.tier && p.tier.toLowerCase().includes(query))
                  );
                })
                .map((p) => {
                  const resolvedRoles = resolveUserRoles(p.assignedRoles || [], roles);
                  const tierDef = getTierDefinition(p.tier, tiersList);
                  return (
                    <div
                      key={p.discordId}
                      className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3.5 shadow-sm"
                    >
                      {/* Top Row: Avatar + Name + ID */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={p.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                            alt={p.username}
                            className="w-12 h-12 rounded-xl border border-cyan-400/60 object-cover flex-shrink-0"
                          />
                          <div className="min-w-0 text-right">
                            <div className="font-heading font-bold text-sm text-white truncate flex items-center gap-1.5">
                              <span>{p.globalName || p.username}</span>
                              {p.isAdmin && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">ADMIN</span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 truncate" dir="ltr">
                              @{p.username}
                            </div>
                            <div className="text-[10px] font-mono text-cyan-400 mt-0.5 truncate" dir="ltr">
                              ID: {p.discordId}
                            </div>
                          </div>
                        </div>

                        {/* Tier Badge */}
                        <div className="flex-shrink-0">
                          {tierDef ? (
                            <span
                              className="px-2.5 py-1 rounded-lg text-xs font-heading font-black shadow-sm"
                              style={{
                                backgroundColor: `${tierDef.color || '#00e5ff'}20`,
                                color: tierDef.color || '#00e5ff',
                                border: `1px solid ${tierDef.color || '#00e5ff'}60`,
                              }}
                            >
                              {tierDef.name}
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                              غير مقيّم
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Roles Badges */}
                      <div className="flex flex-wrap gap-1.5">
                        {resolvedRoles.map((role: ServerRole) => (
                          <span
                            key={role.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
                            style={{
                              backgroundColor: `${role.color || '#00e5ff'}15`,
                              color: role.color || '#00e5ff',
                              border: `1px solid ${role.color || '#00e5ff'}30`,
                            }}
                          >
                            <span>{role.emoji || '🛡️'}</span>
                            <span>{role.name}</span>
                          </span>
                        ))}
                        {resolvedRoles.length === 0 && (
                          <span className="text-[10px] text-slate-500">لا توجد رولات ممنوحة</span>
                        )}
                      </div>

                      {/* Evaluation Notes Snippet */}
                      {p.evaluationNotes && (
                        <p className="text-[11px] text-slate-300 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 line-clamp-2">
                          <span className="text-cyan-400 font-semibold ml-1">التقييم:</span>
                          {p.evaluationNotes}
                        </p>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => handleEditProfile(p)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProfile(p)}
                          className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {profilesList.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-xs">
                لا توجد حسابات مسجلة حالياً. استخدم النموذج أعلاه لإضافة أي حساب عبر معرّف ديسكورد.
              </div>
            )}
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal (Reliably works in iframes and all browsers without window.confirm) */}
      {deleteConfirm?.isOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md glass-panel rounded-3xl border border-red-500/40 p-6 sm:p-7 shadow-[0_0_50px_rgba(239,68,68,0.25)] text-right space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-11 h-11 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 flex-shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-white">تأكيد عملية الحذف</h3>
                <p className="text-xs text-red-300/80 font-mono">إجراء نهائي لا يمكن التراجع عنه</p>
              </div>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {deleteConfirm.message}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setDeleteConfirm(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={executeConfirmedDelete}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{saving ? 'جاري الحذف...' : 'نعم، تأكيد الحذف نهائياً'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
