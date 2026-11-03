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
  FileText,
  UserCheck,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl glow-window rounded-3xl shadow-[0_0_50px_rgba(0,229,255,0.25)] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="relative h-28 sm:h-32 bg-gradient-to-r from-blue-950 via-slate-900 to-cyan-950 border-b border-cyan-500/20 flex items-end px-6 pb-3">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/15 via-transparent to-transparent pointer-events-none" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="glow-btn absolute top-4 left-4 p-2 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
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
                className="w-22 h-22 sm:w-26 sm:h-26 rounded-2xl border-2 border-cyan-400 object-cover shadow-[0_0_25px_rgba(0,229,255,0.4)] bg-slate-950"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500 border-2 border-slate-950 shadow-[0_0_8px_#10b981]" title="متصل" />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-white truncate flex items-center justify-center sm:justify-start gap-2">
                <span>{user.globalName || user.username}</span>
                {tierDef && (
                  <span
                    className="px-2 py-0.5 rounded-lg text-xs font-mono font-extrabold text-black"
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
                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-cyan-300 hover:border-cyan-500/50 transition-all cursor-pointer"
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
              {tierDef && (
                <p className="text-xs text-slate-300 mt-2">
                  {tierDef.label || tierDef.name} — الرتبة #{tierDef.rank} في مجتمع White Kingdom
                </p>
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
                      <span>المقيّم: <strong className="text-white">{user.evaluatorName}</strong></span>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {user.evaluationNotes}
                </div>

                {user.evaluatedAt && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono pt-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>تاريخ التقييم: {new Date(user.evaluatedAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                )}
              </div>
            ) : null}

            {/* User Notice */}
            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              * يتم تحديث وتعديل الرولات والتقييمات حصرياً من قِبل إدارة سيرفر ديسكورد الرسمية.
            </p>

            {/* Actions: Admin Panel + Logout */}
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
      </div>
    </div>
  );
};
