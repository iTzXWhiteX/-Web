import React from 'react';
import { X, Shield, Award, Info, Sparkles, CheckCircle2 } from 'lucide-react';
import { ServerRole } from '../types/pvp.js';

interface RoleDetailsModalProps {
  role: ServerRole | null;
  onClose: () => void;
}

export const RoleDetailsModal: React.FC<RoleDetailsModalProps> = ({ role, onClose }) => {
  if (!role) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg glow-window rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-right"
        style={{
          boxShadow: `0 0 35px ${role.color}25, 0 10px 40px rgba(0,0,0,0.8)`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Subtle Top Glow Accent */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-40 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: role.color }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 transition-colors cursor-pointer border border-slate-700/50"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Role Header Badge */}
        <div className="flex flex-col items-center text-center mb-6 pt-2">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-3 shadow-lg border"
            style={{
              backgroundColor: `${role.color}20`,
              borderColor: `${role.color}60`,
              boxShadow: `0 0 25px ${role.color}35`,
            }}
          >
            {role.emoji || '🛡️'}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold mb-2"
            style={{
              backgroundColor: `${role.color}15`,
              color: role.color,
              borderColor: `${role.color}40`,
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>رول ديسكورد معتمد</span>
          </div>

          <h3
            className="text-2xl sm:text-3xl font-heading font-black tracking-wide"
            style={{ color: role.color }}
          >
            @{role.name}
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            كود اللون: <span className="text-slate-200" dir="ltr">{role.color}</span>
          </p>
        </div>

        {/* Role Details Sections */}
        <div className="space-y-4">
          {/* Section 1: لمن تُمنح وفي أي حالة؟ */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold text-sm">
              <Award className="w-4 h-4" />
              <span>لمن تُمنح هذه الرتبة؟ (شروط وحالات المنح)</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-sans pr-6">
              {role.criteria || role.description || 'تُمنح هذه الرتبة وفقاً لتقييم إدارة مجتمع سيرفر White Kingdom.'}
            </p>
          </div>

          {/* Section 2: الوصف والصلاحيات في السيرفر */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-2 mb-2 text-indigo-400 font-bold text-sm">
              <Info className="w-4 h-4" />
              <span>الوصف والمهام داخل مجتمع ديسكورد</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed font-sans pr-6">
              {role.description || 'رتبة تمييزية رسمية لأعضاء مجتمع White Kingdom.'}
            </p>
          </div>

          {/* Section 3: المظهر في الموقع والمنشن */}
          <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-800/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>ظهور المنشن في الأخبار والإعلانات:</span>
            </div>
            <span
              className="px-2.5 py-1 rounded-md font-semibold font-mono"
              style={{
                backgroundColor: `${role.color}25`,
                color: role.color,
                border: `1px solid ${role.color}55`,
              }}
            >
              {role.emoji} @{role.name}
            </span>
          </div>
        </div>

        {/* Footer Action */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex justify-center">
          <button
            onClick={onClose}
            className="glow-btn w-full sm:w-auto px-8 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-all cursor-pointer border border-slate-700 hover:border-cyan-500/50"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
