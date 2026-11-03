import React, { useState } from 'react';
import {
  User,
  Shield,
  Award,
  LogOut,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { UserProfile, ServerRole, TierDefinition } from '../types/pvp.js';
import { resolveUserRoles, getTierDefinition } from '../utils/pvpLogic.js';

interface UserAccountSidebarProps {
  user: UserProfile | null;
  allRoles: ServerRole[];
  allTiers: TierDefinition[];
  onOpenProfile: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToTierTest?: () => void;
}

export const UserAccountSidebar: React.FC<UserAccountSidebarProps> = ({
  user,
  allRoles,
  allTiers,
  onOpenProfile,
  onOpenLogin,
  onLogout,
  onNavigateToAdmin,
  onNavigateToTierTest,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const handleCopyDiscordId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    navigator.clipboard.writeText(user.discordId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const resolvedRoles = user ? resolveUserRoles(user.assignedRoles || [], allRoles) : [];
  const tierDef = user ? getTierDefinition(user.tier, allTiers) : undefined;

  return (
    <aside
      className="w-full lg:w-72 xl:w-80 flex-shrink-0 select-none"
      dir="rtl"
      aria-label="منطقة حساب المستخدم"
    >
      <div className="lg:sticky lg:top-24 glass-panel rounded-3xl border border-cyan-500/25 p-4 sm:p-5 shadow-[0_10px_35px_rgba(0,0,0,0.45)] backdrop-blur-2xl relative overflow-hidden transition-all">
        {/* Ambient Top Glow */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-44 h-24 bg-gradient-to-b from-cyan-500/15 to-transparent blur-2xl pointer-events-none" />

        {user ? (
          /* LOGGED IN USER VIEW */
          <div className="space-y-4">
            {/* User Header Card */}
            <div className="flex items-center gap-3.5 pb-3.5 border-b border-slate-800/80">
              <div className="relative group flex-shrink-0">
                <img
                  src={user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                  alt={user.username}
                  className="w-13 h-13 rounded-2xl border-2 border-cyan-400/70 object-cover shadow-[0_0_15px_rgba(0,229,255,0.3)] bg-slate-950"
                />
                <span
                  className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 shadow-[0_0_6px_#10b981]"
                  title="متصل"
                />
              </div>

              <div className="flex-1 min-w-0 text-right">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-heading font-bold text-sm sm:text-base text-white truncate">
                    {user.globalName || user.username}
                  </span>
                  {user.isAdmin && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold flex-shrink-0 border border-cyan-400/30">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5" dir="ltr">
                  @{user.username}
                </p>

                {/* Discord ID copy badge */}
                <button
                  onClick={handleCopyDiscordId}
                  className="inline-flex items-center gap-1 mt-1 text-[10px] font-mono text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer"
                  dir="ltr"
                  title="انقر لنسخ معرّف الديسكورد"
                >
                  <span className="truncate max-w-[120px]">{user.discordId}</span>
                  {copiedId ? (
                    <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Copy className="w-3 h-3 opacity-70 hover:opacity-100 flex-shrink-0" />
                  )}
                </button>
              </div>

              {/* Mobile collapse toggle */}
              <button
                onClick={() => setMobileExpanded(!mobileExpanded)}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
                aria-label="تبديل القائمة"
              >
                {mobileExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Content: Visible on desktop or when expanded on mobile */}
            <div className={`space-y-4 ${mobileExpanded ? 'block' : 'hidden lg:block'}`}>
              {/* Competitive Tier Card */}
              <div className="p-3.5 rounded-2xl glass-card text-right">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Award className="w-3.5 h-3.5 text-cyan-400" />
                    <span>المستوى التنافسي (Tier)</span>
                  </div>
                  {tierDef ? (
                    <span
                      className="px-2.5 py-0.5 rounded-lg font-mono font-extrabold text-xs text-black shadow-sm"
                      style={{ backgroundColor: tierDef.color }}
                    >
                      {tierDef.name}
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-500">غير مقيم</span>
                  )}
                </div>

                {tierDef && (
                  <p className="text-[11px] text-slate-300 mt-1 font-medium truncate">
                    {tierDef.label || tierDef.name}
                  </p>
                )}
              </div>

              {/* Assigned Roles Strip */}
              {resolvedRoles.length > 0 && (
                <div className="space-y-2 text-right">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>رولات السيرفر المعتمدة</span>
                    <span className="text-[10px] font-mono text-cyan-400">({resolvedRoles.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {resolvedRoles.map((role) => (
                      <span
                        key={role.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold border"
                        style={{
                          backgroundColor: `${role.color}15`,
                          borderColor: `${role.color}40`,
                          color: role.color,
                        }}
                      >
                        {role.emoji && <span>{role.emoji}</span>}
                        <span>{role.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={onOpenProfile}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 hover:border-cyan-400/50 flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>عرض ملفي الشخصي والتقييم</span>
                </button>

                {user.isAdmin && onNavigateToAdmin && (
                  <button
                    onClick={onNavigateToAdmin}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    <span>لوحة تحكم الإدارة</span>
                  </button>
                )}

                <button
                  onClick={onLogout}
                  className="w-full py-2 px-3 rounded-xl text-[11px] font-medium text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* GUEST VISITOR VIEW */
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.15)]">
              <Sparkles className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-heading font-bold text-base text-white">
                حسابك في White Kingdom
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                سجّل الدخول عبر ديسكورد لمعاينة مستواك ورولاتك المعتمدة ونتائج اختباراتك في السيرفر.
              </p>
            </div>

            <button
              onClick={onOpenLogin}
              className="glow-btn w-full py-3 px-4 rounded-2xl font-heading font-bold text-xs bg-gradient-to-r from-blue-600 via-cyan-500 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-white flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.25)] transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span>تسجيل الدخول عبر ديسكورد</span>
            </button>

            <p className="text-[11px] text-slate-500">
              تصفح الموقع وقائمة المتصدرين مجاني ومتاح للجميع
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
