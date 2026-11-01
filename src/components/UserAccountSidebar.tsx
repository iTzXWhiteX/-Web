import React, { useState } from 'react';
import {
  User,
  Shield,
  Award,
  LogOut,
  Sparkles,
  Copy,
  Check,
  ChevronLeft,
  Crown,
  HelpCircle,
  ExternalLink,
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
      className="w-full lg:w-72 xl:w-80 flex-shrink-0"
      dir="rtl"
      aria-label="منطقة حساب المستخدم"
    >
      <div className="sticky top-24 glass-panel rounded-3xl border border-cyan-500/25 p-4 sm:p-5 shadow-[0_4px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-44 h-24 bg-gradient-to-b from-cyan-500/20 to-transparent blur-2xl pointer-events-none" />

        {user ? (
          /* LOGGED IN USER VIEW */
          <div className="space-y-4">
            {/* User Header Card */}
            <div className="flex items-center gap-3.5 pb-3.5 border-b border-slate-800/80">
              <div className="relative group flex-shrink-0">
                <img
                  src={user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                  alt={user.username}
                  className="w-14 h-14 rounded-2xl border-2 border-cyan-400/80 object-cover shadow-[0_0_15px_rgba(0,229,255,0.4)] bg-slate-950"
                />
                <span
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 shadow-[0_0_6px_#10b981]"
                  title="متصل"
                />
              </div>

              <div className="flex-1 min-w-0 text-right">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-heading font-bold text-sm sm:text-base text-white truncate">
                    {user.globalName || user.username}
                  </span>
                  {user.isAdmin && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold flex-shrink-0 border border-cyan-400/30">
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
                  <span>ID: {user.discordId}</span>
                  {copiedId ? (
                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-2.5 h-2.5 text-slate-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Current Tier / Rating Status Card */}
            <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>المستوى التنافسي (Tier)</span>
                </span>
                {tierDef && (
                  <span className="font-mono text-cyan-300 font-bold">
                    #{tierDef.rank}
                  </span>
                )}
              </div>

              {tierDef ? (
                <div
                  className="flex items-center justify-between p-2.5 rounded-xl border"
                  style={{
                    backgroundColor: `${tierDef.color || '#00e5ff'}15`,
                    borderColor: `${tierDef.color || '#00e5ff'}40`,
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center font-heading font-black text-sm shadow-md"
                      style={{
                        backgroundColor: tierDef.color || '#00e5ff',
                        color: '#000',
                      }}
                    >
                      {tierDef.name}
                    </div>
                    <div>
                      <div className="font-heading font-bold text-xs text-white">
                        {tierDef.label || tierDef.name}
                      </div>
                      <div className="text-[10px] text-slate-300">
                        تقييم معتمد في السيرفر
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center space-y-1">
                  <p className="text-xs text-slate-300 font-medium">لم يتم التقييم بعد</p>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    قم بإجراء اختبار المستويات مع مختبري السيرفر ليتم اعتماد تصنيفك هنا.
                  </p>
                  {onNavigateToTierTest && (
                    <button
                      onClick={onNavigateToTierTest}
                      className="text-[10px] font-bold text-cyan-400 hover:underline pt-0.5 inline-block cursor-pointer"
                    >
                      عرض تفاصيل الاختبار ←
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Assigned Roles Preview */}
            <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span>الرولات الممنوحة</span>
                </span>
                <span className="font-mono text-slate-400 text-[10px]">
                  {resolvedRoles.length}
                </span>
              </div>

              {resolvedRoles.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-0.5 custom-scrollbar">
                  {resolvedRoles.map((role) => (
                    <span
                      key={role.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-xs truncate max-w-full"
                      style={{
                        backgroundColor: `${role.color || '#00e5ff'}15`,
                        color: role.color || '#00e5ff',
                        border: `1px solid ${role.color || '#00e5ff'}40`,
                      }}
                      title={role.description || role.criteria}
                    >
                      <span className="text-xs">{role.emoji || '🛡️'}</span>
                      <span className="truncate">{role.name}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 text-center py-1">
                  لا توجد رولات ممنوحة حالياً.
                </p>
              )}
            </div>

            {/* Profile Action Buttons */}
            <div className="pt-1 space-y-2">
              <button
                onClick={onOpenProfile}
                className="w-full h-11 px-4 rounded-xl text-xs font-heading font-bold text-cyan-300 bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:from-cyan-900 hover:to-blue-900 border border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.2)] transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span>عرض ملفي الشخصي بالكامل</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-1 transition-transform" />
              </button>

              {user.isAdmin && onNavigateToAdmin && (
                <button
                  onClick={onNavigateToAdmin}
                  className="w-full h-10 px-3 rounded-xl text-xs font-bold text-amber-300 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/30 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>لوحة الإدارة الشاملة</span>
                </button>
              )}

              <button
                onClick={onLogout}
                className="w-full h-9 px-3 rounded-xl text-[11px] font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-500/30 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        ) : (
          /* GUEST VISITOR VIEW */
          <div className="space-y-4 text-center py-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.2)]">
              <User className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-heading font-bold text-base text-white">
                حسابك في White Kingdom
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed px-1">
                سجّل الدخول عبر ديسكورد لمعاينة مستواك ورولاتك المعتمدة ونتائج اختباراتك في السيرفر.
              </p>
            </div>

            <button
              onClick={onOpenLogin}
              className="w-full h-11 rounded-xl font-heading font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.35)] transition-all cursor-pointer hover:scale-[1.02] active:scale-98"
            >
              <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.078.078 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>تسجيل الدخول عبر ديسكورد</span>
            </button>

            <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <span>تصفح الموقع وقائمة المتصدرين مجاني ومتاح للجميع</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
