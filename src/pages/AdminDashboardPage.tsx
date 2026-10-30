import React, { useState, useEffect, useCallback, useRef } from 'react';
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
} from 'lucide-react';
import {
  UserProfile,
  WebsiteSettings,
  TestServer,
  LeaderboardPlayer,
  WHITE_KINGDOM_TIERS,
  GameDiscipline,
  NewsArticle,
  ServerRole,
} from '../types/pvp.js';
import { DiscordFormattedText } from '../utils/discordMentionParser.js';
import { ImageUploadInput } from '../components/ImageUploadInput.js';

interface AdminDashboardPageProps {
  user: UserProfile;
  onRefreshPublicData: () => void;
  onNavigate: (page: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  user,
  onRefreshPublicData,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'about' | 'tierTest' | 'news' | 'roles' | 'servers' | 'leaderboard'>('settings');
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

  // Color Presets for Discord Roles
  const COLOR_PRESETS = [
    { label: 'Cyan', color: '#00e5ff' },
    { label: 'Sky', color: '#38bdf8' },
    { label: 'Blue', color: '#3b82f6' },
    { label: 'Purple', color: '#a855f7' },
    { label: 'Pink', color: '#ec4899' },
    { label: 'Red', color: '#ef4444' },
    { label: 'Orange', color: '#f97316' },
    { label: 'Amber/Gold', color: '#f59e0b' },
    { label: 'Emerald', color: '#10b981' },
    { label: 'White', color: '#f8fafc' },
  ];

  const EMOJI_PRESETS = ['👑', '⚔️', '🛡️', '💎', '🔥', '⚡', '🏆', '🎯', '🌟', '🎮'];

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
    type: 'role' | 'player' | 'server' | 'news';
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
        if (data.leaderboard) setLeaderboard(data.leaderboard);
        if (data.newsArticles) setNewsArticles(data.newsArticles);
        if (data.roles) setRoles(data.roles);
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
      if (!playerDiscordAvatar) {
        try {
          const idx = (BigInt(clean) >> 22n) % 6n;
          setPlayerDiscordAvatar(`https://cdn.discordapp.com/embed/avatars/${idx}.png`);
        } catch (_) {}
      }
      if (!playerDiscordName) {
        setPlayerDiscordName(`Player_${clean.slice(-4)}`);
      }
    }
  };

  const handleLookupDiscord = async () => {
    if (!playerDiscordId.trim()) {
      showNotification('يرجى إدخال معرّف ديسكورد (Discord User ID).', 'error');
      return;
    }

    try {
      setLookingUpDiscord(true);
      const res = await fetch(`/api/admin/discord-lookup/${playerDiscordId.trim()}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.username) setPlayerDiscordName(d.username);
        if (d.avatar) setPlayerDiscordAvatar(d.avatar);
        showNotification(`تم جلب حساب الديسكورد بنجاح (${d.source})`);
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

  // 6. Leaderboard Player Management
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
        setPlayerDiscordAvatar('');
        setPlayerTier('HT1');
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
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>إعدادات السيرفر</span>
        </button>

        <button
          onClick={() => setActiveTab('news')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'news'
              ? 'bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>الأخبار والإعلانات ({newsArticles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'roles'
              ? 'bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>رولات ديسكورد والمنشن ({roles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('about')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'about'
              ? 'bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>صفحة عن السيرفر</span>
        </button>

        <button
          onClick={() => setActiveTab('tierTest')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'tierTest'
              ? 'bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>صفحة اختبار المستويات</span>
        </button>

        <button
          onClick={() => setActiveTab('servers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'servers'
              ? 'bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>سيرفرات الاختبار ({servers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'leaderboard'
              ? 'bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>إدارة وتعديل اللاعبين ({leaderboard.length})</span>
        </button>
      </div>

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
                      onClick={handleLookupDiscord}
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
                    {WHITE_KINGDOM_TIERS.map(t => (
                      <option key={t.name} value={t.name}>
                        {t.name} - {t.label} (Rank {t.rank})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Editable Discord Display Name & Avatar Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1">
                    اسم اللاعب في ديسكورد (Discord Display Name)
                  </label>
                  <input
                    type="text"
                    value={playerDiscordName}
                    onChange={e => setPlayerDiscordName(e.target.value)}
                    placeholder="مثال: itz_player أو يُجلب تلقائياً من الـ ID"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">يظهر بجانب اسم ماين كرافت في لوحة الصدارة</span>
                </div>

                <div>
                  <ImageUploadInput
                    label="صورة حساب ديسكورد (Discord Avatar)"
                    sublabel="تُجلب تلقائياً من الـ ID أو يمكنك رفع صورة مخصصة من جهازك"
                    value={playerDiscordAvatar}
                    onChange={setPlayerDiscordAvatar}
                    aspectRatio="square"
                  />
                </div>
              </div>

              {/* Resolved Discord Live Preview */}
              {(playerDiscordName || playerDiscordAvatar) && (
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex items-center gap-3">
                  <img
                    src={playerDiscordAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                    alt="Discord Avatar"
                    className="w-10 h-10 rounded-full border border-cyan-500/50 object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-400">معاينة الحساب كما سيظهر للجميع في لوحة الصدارة:</div>
                    <div className="text-sm font-bold text-white truncate">{playerDiscordName || 'Gladiator'}</div>
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
                            {WHITE_KINGDOM_TIERS.map(t => (
                              <option key={t.name} value={t.name}>{t.name} (Rank {t.rank})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-400 font-mono">اسم حساب ديسكورد</label>
                          <input
                            type="text"
                            value={editingPlayer.discordDisplayName || ''}
                            onChange={e => setEditingPlayer({ ...editingPlayer, discordDisplayName: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
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
                            <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-mono font-bold">
                              {player.tierName}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">
                            ديسكورد: <span className="text-slate-300">{player.discordDisplayName}</span> <span className="font-mono text-[10px] text-slate-500" dir="ltr">({player.discordId})</span>
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
