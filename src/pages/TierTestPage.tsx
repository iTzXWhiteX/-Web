import React from 'react';
import { ArrowRight, Trophy, Server, ShieldAlert, Award, UserCheck, Shield } from 'lucide-react';
import { TestServer, TierDefinition, TierTester, WHITE_KINGDOM_TIERS } from '../types/pvp.js';
import { ScrollReveal } from '../components/ScrollReveal.js';

interface TierTestPageProps {
  content: string;
  testServers: TestServer[];
  testers?: TierTester[];
  tiers?: TierDefinition[];
  onNavigate: (page: string) => void;
}

export const TierTestPage: React.FC<TierTestPageProps> = ({
  content,
  testServers,
  testers = [],
  tiers,
  onNavigate,
}) => {
  const activeTiers = tiers && tiers.length > 0 ? tiers : WHITE_KINGDOM_TIERS;
  const sortedTesters = [...testers].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div
      dir="rtl"
      className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10 select-none space-y-8"
    >
      {/* Top Navigation Back */}
      <ScrollReveal delayMs={0}>
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-300 transition-colors mb-2 cursor-pointer group focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg p-1"
        >
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          <span>العودة إلى الصفحة الرئيسية</span>
        </button>
      </ScrollReveal>

      {/* Main Tier Test Information Card */}
      <ScrollReveal delayMs={60}>
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-cyan-500/25 shadow-[0_0_40px_rgba(0,229,255,0.08)] space-y-8 relative overflow-hidden">
          {/* Subtle top ambient glow line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

          {/* Header */}
          <div className="border-b border-slate-800/80 pb-6 space-y-2 text-right">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>نظام تقييم واختبارات مجتمعي شخصي</span>
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white">
              نظام اختبار وتحديد المستويات (Tier Testing)
            </h1>
          </div>

          {/* Admin's Content */}
          <div className="prose prose-invert max-w-none text-right">
            <div className="text-sm sm:text-base text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
              {content || 'سيتم وضع تعليمات وشروط الاختبار من قِبل إدارة السيرفر هنا.'}
            </div>
          </div>

          {/* Server Official Tiers Showcase */}
          {activeTiers && activeTiers.length > 0 && (
            <div className="pt-6 border-t border-slate-800/80 space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                <Award className="w-4 h-4 text-cyan-400" />
                <span>مستويات وتصنيفات السيرفر التنافسية (Tiers)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {activeTiers.map((tier) => (
                  <div
                    key={tier.name}
                    className="p-3.5 rounded-2xl glass-card flex flex-col items-center justify-center text-center gap-1.5 shadow-md hover:scale-[1.03] transition-transform"
                    style={{
                      borderColor: `${tier.color}35`,
                    }}
                  >
                    <span
                      className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-extrabold text-white shadow-sm"
                      style={{ backgroundColor: tier.color }}
                    >
                      {tier.name}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-200 truncate w-full">
                      {tier.label || tier.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      الرتبة: #{tier.rank}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supported Test Servers Section */}
          {testServers && testServers.length > 0 && (
            <div className="pt-6 border-t border-slate-800/80 space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                <Server className="w-4 h-4 text-cyan-400" />
                <span>السيرفرات وقوائم الاختبار المعتمدة</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {testServers.map((server) => (
                  <div
                    key={server.id}
                    className="rounded-2xl glass-card overflow-hidden flex flex-col group shadow-lg border border-slate-800/80 hover:border-cyan-500/40 transition-all"
                  >
                    {/* Server Image if provided */}
                    {server.imageUrl && (
                      <div className="w-full h-36 bg-slate-950 overflow-hidden border-b border-slate-800 relative">
                        <img
                          src={server.imageUrl}
                          alt={server.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-2 text-right">
                      <div className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors">
                        {server.name}
                      </div>
                      {server.info && (
                        <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {server.info}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Official Tier Testers Section */}
      <ScrollReveal delayMs={100}>
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-cyan-500/25 shadow-[0_0_40px_rgba(0,229,255,0.08)] space-y-6 relative overflow-hidden">
          {/* Subtle Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

          {/* Section Header */}
          <div className="border-b border-slate-800/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider mb-1">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>طاقم التحكيم والتقييم الرسمي</span>
              </div>
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-white">
                مختبرو المستويات المعتمدون (Tier Testers)
              </h2>
            </div>
            <span className="text-xs font-mono text-cyan-300/80 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1 rounded-xl self-start sm:self-auto">
              {sortedTesters.length} مختبر معتمد
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            المختبرون المعتمدون في مجتمع 𝑾𝒉𝒊𝒕𝒆 𝑲𝒊𝒏𝒈𝒅𝒐𝒎 هم المخولون رسمياً من قِبل الإدارة لإجراء نزالات واختبارات تحديد المستويات وتوثيق تقييمات اللاعبين.
          </p>

          {sortedTesters.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-slate-400 text-xs sm:text-sm">
              لم تتم إضافة مختبرين معتمدين بعد من قِبل إدارة السيرفر.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {sortedTesters.map((tester, idx) => (
                <div
                  key={tester.id}
                  className="rounded-2xl glass-card p-4 sm:p-5 border border-slate-800/80 hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(0,229,255,0.15)] transition-all flex items-center gap-4 group relative overflow-hidden"
                >
                  {/* Subtle Order Badge */}
                  <div className="absolute top-2.5 left-2.5 w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-mono font-bold flex items-center justify-center">
                    #{idx + 1}
                  </div>

                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={tester.discordAvatar || '/logo.png'}
                      alt={tester.discordDisplayName || tester.minecraftName}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-cyan-500/30 group-hover:border-cyan-400 transition-colors shadow-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo.png';
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-[#060913] border border-cyan-500/40 text-cyan-400 shadow-sm">
                      <UserCheck className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-right space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-heading font-bold text-white text-sm sm:text-base group-hover:text-cyan-300 transition-colors truncate">
                        {tester.discordDisplayName || tester.discordUsername || tester.minecraftName}
                      </span>
                    </div>

                    {/* Minecraft IGN Badge */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[11px] text-slate-400">ماين كرافت:</span>
                      <span className="font-mono font-bold text-cyan-300 text-[11px] px-2 py-0.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 truncate" dir="ltr">
                        {tester.minecraftName}
                      </span>
                    </div>

                    {/* Discord Username Handle if different */}
                    {tester.discordUsername && tester.discordUsername !== tester.discordDisplayName && (
                      <div className="text-[10px] font-mono text-slate-500 truncate" dir="ltr">
                        @{tester.discordUsername}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* CTA: View Leaderboard */}
      <ScrollReveal delayMs={140}>
        <div className="pt-2 flex justify-center">
          <button
            onClick={() => onNavigate('leaderboard')}
            className="w-full sm:w-auto min-w-[280px] py-4 px-8 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 active:scale-[0.99] text-white font-heading font-bold text-sm sm:text-base flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(0,229,255,0.35)] hover:shadow-[0_0_40px_rgba(0,229,255,0.5)] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <Trophy className="w-5 h-5" />
            <span>عرض قائمة المتصدرين (Leaderboard)</span>
          </button>
        </div>
      </ScrollReveal>
    </div>
  );
};
