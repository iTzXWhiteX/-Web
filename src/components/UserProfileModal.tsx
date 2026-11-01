import React, { useState } from 'react';
import {
  X,
  Shield,
  Award,
  Calendar,
  User,
  Copy,
  Check,
  LogOut,
  Sparkles,
  ExternalLink,
  Info,
} from 'lucide-react';
import { UserProfile, ServerRole, TierDefinition } from '../types/pvp.js';
import { resolveUserRoles, getTierDefinition } from '../utils/pvpLogic.js';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  allRoles: ServerRole[];
  allTiers: TierDefinition[];
  onLogout: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToTierTest?: () => void;
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
}) => {
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen || !user) return null;

  const resolvedRoles = resolveUserRoles(user.assignedRoles || [], allRoles);
  const tierDef = getTierDefinition(user.tier, allTiers);

  const handleCopyDiscordId = () => {
    navigator.clipboard.writeText(user.discordId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl glass-panel rounded-3xl border border-cyan-500/30 shadow-[0_0_50px_rgba(0,229,255,0.25)] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="relative h-28 sm:h-32 bg-gradient-to-r from-blue-950 via-slate-900 to-cyan-950 border-b border-cyan-500/20 flex items-end px-6 pb-3">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/15 via-transparent to-transparent pointer-events-none" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Quick Admin Badge */}
          {user.isAdmin && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 text-xs font-mono font-bold shadow-[0_0_10px_rgba(0,229,255,0.3)]">
              <Shield className="w-3.5 h-3.5" />
              <span>إدارة السيرفر</span>
            </div>
          )}
        </div>

        {/* Profile Card Body */}
        <div className="px-5 sm:px-7 pb-7 pt-2">
          {/* Avatar and Main Info row */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-14 sm:-mt-16 mb-5 text-center sm:text-right">
            <div className="relative group">
              <img
                src={user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                alt={user.username}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-cyan-400 object-cover shadow-[0_0_25px_rgba(0,229,255,0.5)] bg-slate-950"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-950 shadow-[0_0_8px_#10b981]" title="متصل" />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-white truncate flex items-center justify-center sm:justify-start gap-2">
                <span>{user.globalName || user.username}</span>
                {tierDef && (
                  <span
                    className="px-2.5 py-0.5 rounded-lg text-xs font-heading font-bold shadow-sm"
                    style={{
                      backgroundColor: `${tierDef.color || '#00e5ff'}20`,
                      color: tierDef.color || '#00e5ff',
                      border: `1px solid ${tierDef.color || '#00e5ff'}60`,
                    }}
                  >
                    {tierDef.name}
                  </span>
                )}
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm font-mono mt-0.5" dir="ltr">
                @{user.username}
              </p>

              {/* Discord Snowflake ID badge with copy */}
              <div className="mt-2 flex items-center justify-center sm:justify-start gap-2">
                <button
                  onClick={handleCopyDiscordId}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700/80 text-[11px] font-mono text-cyan-300 hover:border-cyan-400/60 transition-colors cursor-pointer"
                  title="نسخ معرّف الديسكورد"
                  dir="ltr"
                >
                  <span>ID: {user.discordId}</span>
                  {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Section 1: Assigned Roles */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>الرولات الممنوحة في السيرفر</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {resolvedRoles.length} رول
                </span>
              </div>

              {resolvedRoles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {resolvedRoles.map((role) => (
                    <div
                      key={role.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm"
                      style={{
                        backgroundColor: `${role.color || '#00e5ff'}15`,
                        color: role.color || '#00e5ff',
                        border: `1px solid ${role.color || '#00e5ff'}40`,
                      }}
                      title={role.description || role.criteria}
                    >
                      <span className="text-sm">{role.emoji || '🛡️'}</span>
                      <span>{role.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 text-center">
                  لا توجد رولات ممنوحة لهذا الحساب حالياً من قبل الإدارة.
                </p>
              )}
            </div>

            {/* Section 2: Rating & Tier */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>المستوى والتقييم التنافسي (Tier)</span>
                </div>
              </div>

              {tierDef ? (
                <div
                  className="flex items-center justify-between p-3 rounded-xl border"
                  style={{
                    backgroundColor: `${tierDef.color || '#00e5ff'}10`,
                    borderColor: `${tierDef.color || '#00e5ff'}40`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-heading font-black text-lg shadow-lg"
                      style={{
                        backgroundColor: tierDef.color || '#00e5ff',
                        color: '#000',
                        boxShadow: `0 0 20px ${tierDef.color || '#00e5ff'}50`,
                      }}
                    >
                      {tierDef.name}
                    </div>
                    <div>
                      <div className="font-heading font-bold text-sm text-white">
                        {tierDef.label || tierDef.name}
                      </div>
                      <div className="text-[11px] text-slate-300">
                        الرتبة في السيرفر: #{tierDef.rank}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    تقييم معتمد
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
                  <div className="flex items-center gap-2.5">
                    <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-xs text-slate-300">
                      لم يتم تحديد المستوى التنافسي (Tier) لهذا الحساب بعد.
                    </span>
                  </div>
                  {onNavigateToTierTest && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToTierTest();
                      }}
                      className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <span>تفاصيل اختبار المستويات</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Section 3: Evaluation Details (Notes) */}
            {user.evaluationNotes && (
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>ملاحظات وتفاصيل التقييم الإداري</span>
                  </div>
                  {user.evaluatedAt && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(user.evaluatedAt).toLocaleDateString('ar-EG')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  {user.evaluationNotes}
                </p>
                {user.evaluatorName && (
                  <p className="text-[11px] text-slate-400 mt-2 text-left" dir="rtl">
                    المُقيِّم: <span className="text-cyan-300 font-semibold">{user.evaluatorName}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            {user.isAdmin && onNavigateToAdmin && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToAdmin();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>لوحة تحكم الإدارة</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-500/30 flex items-center gap-2 cursor-pointer transition-colors mr-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
