import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Award,
  Calendar,
  User,
  Copy,
  Check,
  LogOut,
  FileText,
  UserCheck,
  Gamepad2,
  Edit2,
  Clock,
  Sparkles,
  Swords,
} from 'lucide-react';
import { UserProfile, ServerRole, TierDefinition } from '../types/pvp.js';
import { resolveUserRoles, getTierDefinition } from '../utils/pvpLogic.js';
import { handleAvatarImgError, resolveAvatarUrl } from '../utils/discordAvatar.js';
import BorderGlow from './BorderGlow.js';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  allRoles: ServerRole[];
  allTiers: TierDefinition[];
  onLogout: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToTierTest?: () => void;
  onUserUpdate?: (updatedUser: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  allRoles,
  allTiers,
  onLogout,
  onNavigateToAdmin,
  onNavigateToTierTest,
  onUserUpdate,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [editingMc, setEditingMc] = useState(false);
  const [mcInput, setMcInput] = useState(user?.minecraftName || '');
  const [savingMc, setSavingMc] = useState(false);
  const [mcMessage, setMcMessage] = useState<{ text: string; error?: boolean } | null>(null);

  // Sync Minecraft name input whenever user changes
  useEffect(() => {
    if (user?.minecraftName) {
      setMcInput(user.minecraftName);
    } else {
      setMcInput('');
    }
  }, [user]);

  // Lock body scroll and listen for Escape key when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const resolvedRoles = resolveUserRoles(user.assignedRoles || [], allRoles);
  const tierDef = getTierDefinition(user.tier, allTiers);

  const handleCopyDiscordId = () => {
    try {
      navigator.clipboard.writeText(user.discordId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const handleSaveMinecraftName = async () => {
    const cleanName = mcInput.trim();
    setSavingMc(true);
    setMcMessage(null);

    try {
      const storedToken = localStorage.getItem('wk_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const res = await fetch('/api/user/minecraft-name', {
        method: 'POST',
        headers,
        body: JSON.stringify({ minecraftName: cleanName }),
      });

      const data = await res.json();
      if (res.ok) {
        setMcMessage({ text: data.message || 'تم حفظ اسم ماين كرافت بنجاح.' });
        setEditingMc(false);
        if (onUserUpdate && data.user) {
          onUserUpdate(data.user);
        }
      } else {
        setMcMessage({ text: data.error || 'فشل في حفظ الحساب.', error: true });
      }
    } catch (err: any) {
      setMcMessage({ text: err.message || 'حدث خطأ في الاتصال.', error: true });
    } finally {
      setSavingMc(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto"
      dir="rtl"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="تفاصيل حساب المستخدم"
    >
      <div
        className="w-full max-w-[calc(100vw-1.25rem)] sm:max-w-xl max-h-[90vh] flex flex-col my-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <BorderGlow
          borderRadius={28}
          edgeSensitivity={30}
          glowRadius={40}
          glowIntensity={1.2}
          backgroundColor="#080e1e"
          colors={['#2563eb', '#00e5ff', '#ffffff']}
          className="w-full max-h-[90vh] shadow-[0_0_50px_rgba(0,229,255,0.25)] animate-in zoom-in-95 duration-200 overflow-hidden"
        >
          {/* Clean Top Bar - Fixed at top with title, badges, and close button */}
          <div className="flex-shrink-0 relative px-5 sm:px-6 py-4 bg-gradient-to-r from-blue-950/90 via-slate-900 to-cyan-950/90 border-b border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-heading font-bold text-white flex items-center gap-2">
                  <span>الملف الشخصي والتقييم</span>
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Admin Badge */}
              {user.isAdmin && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 text-xs font-mono font-bold shadow-[0_0_10px_rgba(0,229,255,0.3)]">
                  <Shield className="w-3.5 h-3.5" />
                  <span>إدارة السيرفر</span>
                </div>
              )}

              {/* Close button */}
              <button
                onClick={onClose}
                className="glow-btn p-2 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Profile Card Body - Flex-1 with min-h-0 allows smooth scroll without overflow */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar px-4 sm:px-6 py-5">
            {/* Unified Avatar and Main Info Card (No dividing line cutting through avatar) */}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 mb-5 p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 text-center sm:text-right">
              <div className="relative group flex-shrink-0">
                <img
                  src={resolveAvatarUrl(user.avatar, user.discordId)}
                  alt={user.username}
                  onError={(e) => handleAvatarImgError(e, user.discordId)}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-cyan-400 object-cover shadow-[0_0_25px_rgba(0,229,255,0.4)] bg-slate-950"
                />
                <span
                  className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-emerald-500 border-2 border-slate-950 shadow-[0_0_8px_#10b981]"
                  title="متصل وموثق"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-white truncate flex items-center justify-center sm:justify-start gap-2">
                  <span className="truncate">{user.globalName || user.username}</span>
                  {tierDef && (
                    <span
                      className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-extrabold text-black flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: tierDef.color }}
                    >
                      {tierDef.name}
                    </span>
                  )}
                </h2>
                <p className="text-xs font-mono text-slate-400 mt-0.5" dir="ltr">
                  @{user.username}
                </p>

                {/* Discord ID Copy Pill */}
                <button
                  onClick={handleCopyDiscordId}
                  className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-cyan-300 hover:border-cyan-500/50 transition-all cursor-pointer"
                  title="اضغط لنسخ Discord ID"
                >
                  <span className="text-[10px] text-slate-400">Discord ID:</span>
                  <span dir="ltr">{user.discordId}</span>
                  {copiedId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Details Section */}
            <div className="space-y-4">
              {/* Linked Minecraft Account Card */}
              <div className="p-4 rounded-2xl glass-card text-right">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                    <Gamepad2 className="w-4 h-4 text-cyan-400" />
                    <span>حساب ماين كرافت (Minecraft IGN)</span>
                  </div>
                  {!editingMc && (
                    <button
                      onClick={() => setEditingMc(true)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-200 flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>{user.minecraftName ? 'تعديل' : 'ربط الحساب'}</span>
                    </button>
                  )}
                </div>

                {editingMc ? (
                  <div className="space-y-2 mt-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={mcInput}
                        onChange={(e) => setMcInput(e.target.value)}
                        placeholder="أدخل اسمك في ماين كرافت (IGN)"
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                        dir="ltr"
                      />
                      <button
                        onClick={handleSaveMinecraftName}
                        disabled={savingMc}
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer transition-colors disabled:opacity-50"
                      >
                        {savingMc ? 'حفظ...' : 'حفظ'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingMc(false);
                          setMcInput(user.minecraftName || '');
                          setMcMessage(null);
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                    {mcMessage && (
                      <p className={`text-[11px] ${mcMessage.error ? 'text-red-400' : 'text-emerald-400'}`}>
                        {mcMessage.text}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1">
                    {user.minecraftName ? (
                      <div className="flex items-center gap-2.5">
                        <img
                          src={`https://mc-heads.net/avatar/${encodeURIComponent(user.minecraftName)}/64`}
                          alt={user.minecraftName}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/logo.png';
                          }}
                          className="w-8 h-8 rounded-lg border border-cyan-400/50 bg-slate-900 object-cover"
                        />
                        <div>
                          <p className="text-xs font-mono font-bold text-white" dir="ltr">
                            {user.minecraftName}
                          </p>
                          <p className="text-[10px] text-emerald-400">حساب موثق في السيرفر</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">لم يتم ربط حساب ماين كرافت بعد</span>
                    )}
                  </div>
                )}
              </div>

              {/* Current Tier Status Card */}
              <div className="p-4 rounded-2xl glass-card text-right">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                    <Award className="w-4 h-4 text-cyan-400" />
                    <span>المستوى التنافسي المعتمد في السيرفر</span>
                  </div>
                  {tierDef ? (
                    <span
                      className="px-3 py-1 rounded-xl font-mono text-xs font-extrabold text-black shadow-md"
                      style={{ backgroundColor: tierDef.color }}
                    >
                      {tierDef.name}
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-slate-400">لم يتم تحديد المستوى بعد</span>
                  )}
                </div>
                {tierDef ? (
                  <p className="text-xs text-slate-300 mt-2">
                    {tierDef.label || tierDef.name} — الرتبة #{tierDef.rank} في مجتمع White Kingdom
                  </p>
                ) : (
                  <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between">
                    <p className="text-[11px] text-slate-400">
                      يمكنك حجز موعد لاختبار مستواك التنافسي مع مختبري السيرفر.
                    </p>
                    {onNavigateToTierTest && (
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateToTierTest();
                        }}
                        className="text-xs font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 cursor-pointer flex-shrink-0"
                      >
                        <Swords className="w-3.5 h-3.5" />
                        <span>طلب اختبار</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Assigned Roles List */}
              <div className="p-4 rounded-2xl glass-panel-subtle text-right space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span>رولات السيرفر الممنوحة</span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400">
                    {resolvedRoles.length > 0 ? `${resolvedRoles.length} رول` : 'لا توجد رولات'}
                  </span>
                </div>

                {resolvedRoles.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {resolvedRoles.map((role) => (
                      <span
                        key={role.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-sm"
                        style={{
                          backgroundColor: `${role.color}18`,
                          borderColor: `${role.color}50`,
                          color: role.color,
                        }}
                      >
                        {role.emoji && <span>{role.emoji}</span>}
                        <span>@{role.name}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    يتم منح الرولات التنافسية والإدارية من قِبل إدارة السيرفر.
                  </p>
                )}
              </div>

              {/* Evaluation Details & Evaluator Notes */}
              {user.evaluationNotes ? (
                <div className="p-4 rounded-2xl glass-card text-right space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <span>ملاحظات التقييم وسجل الاختبار</span>
                    </div>
                    {user.evaluatorName && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-normal">
                        <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                        <span>
                          المقيّم: <strong className="text-white">{user.evaluatorName}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                    {user.evaluationNotes}
                  </div>

                  {user.evaluatedAt && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono pt-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>
                        تاريخ التقييم:{' '}
                        {new Date(user.evaluatedAt).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Account Activity Stats */}
              <div className="grid grid-cols-2 gap-2 text-right">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>تاريخ الانضمام</span>
                  </div>
                  <p className="text-xs font-mono text-white mt-1">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'سابق'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>مرات تسجيل الدخول</span>
                  </div>
                  <p className="text-xs font-mono text-cyan-300 mt-1">
                    {user.loginCount || 1} مرة
                  </p>
                </div>
              </div>

              {/* User Notice */}
              <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                * يتم تحديث وتعديل الرولات والتقييمات حصرياً من قِبل إدارة سيرفر ديسكورد الرسمية.
              </p>

              {/* Actions: Admin Panel + Tier Test + Logout */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                {user.isAdmin && onNavigateToAdmin && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToAdmin();
                    }}
                    className="glow-btn flex-1 py-3 px-4 rounded-xl text-xs font-mono font-bold text-cyan-300 bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span>فتح لوحة الإدارة</span>
                  </button>
                )}

                {onNavigateToTierTest && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToTierTest();
                    }}
                    className="glow-btn flex-1 py-3 px-4 rounded-xl text-xs font-mono font-bold text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Swords className="w-4 h-4 text-cyan-400" />
                    <span>اختبار المستويات</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="glow-btn py-3 px-5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-900/40 border border-red-500/30 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </div>
          </div>
        </BorderGlow>
      </div>
    </div>
  );
};
