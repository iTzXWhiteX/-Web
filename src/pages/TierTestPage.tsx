import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Trophy, Server, ShieldAlert, Award } from 'lucide-react';
import { TestServer, TierDefinition, WHITE_KINGDOM_TIERS } from '../types/pvp.js';

interface TierTestPageProps {
  content: string;
  testServers: TestServer[];
  tiers?: TierDefinition[];
  onNavigate: (page: string) => void;
}

export const TierTestPage: React.FC<TierTestPageProps> = ({
  content,
  testServers,
  tiers,
  onNavigate,
}) => {
  const [loaded, setLoaded] = useState(false);
  const serversRef = useRef<HTMLDivElement>(null);
  const [serversVisible, setServersVisible] = useState(false);
  const activeTiers = tiers && tiers.length > 0 ? tiers : WHITE_KINGDOM_TIERS;

  useEffect(() => {
    // Immediate fade in on page open
    const timer = setTimeout(() => {
      setLoaded(true);
      setServersVisible(true);
    }, 40);

    // Scroll fade in / out observer
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setServersVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (serversRef.current) {
      observer.observe(serversRef.current);
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      dir="rtl"
      className={`max-w-4xl mx-auto px-4 sm:px-6 py-12 relative z-10 transition-all duration-700 ease-out ${
        loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 motion-reduce:opacity-100 motion-reduce:translate-y-0'
      }`}
    >
      {/* Top Navigation Back */}
      <button
        onClick={() => onNavigate('home')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-300 transition-colors mb-8 cursor-pointer group"
      >
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        <span>العودة إلى الصفحة الرئيسية</span>
      </button>

      {/* Main Tier Test Information Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-cyan-500/25 shadow-2xl space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-6 space-y-2 text-right">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span>نظام تقييم مجتمعي شخصي وغير رسمي</span>
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
          <div className="pt-6 border-t border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>مستويات وتصنيفات السيرفر التنافسية (Tiers)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {activeTiers.map(tier => (
                <div
                  key={tier.name}
                  className="p-3.5 rounded-2xl border transition-all flex flex-col items-center justify-center text-center gap-1.5 shadow-md hover:scale-105"
                  style={{
                    backgroundColor: `${tier.color}15`,
                    borderColor: `${tier.color}40`,
                    boxShadow: `0 0 15px ${tier.color}15`,
                  }}
                >
                  <span
                    className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-extrabold text-white"
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

        {/* Supported Test Servers Section with Images & Text */}
        {testServers && testServers.length > 0 && (
          <div
            ref={serversRef}
            className={`pt-6 border-t border-slate-800 space-y-5 transition-all duration-700 ${
              serversVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8 motion-reduce:opacity-100 motion-reduce:translate-y-0'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
              <Server className="w-4 h-4" />
              <span>السيرفرات وقوائم الاختبار المعتمدة</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {testServers.map(server => (
                <div
                  key={server.id}
                  className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 overflow-hidden flex flex-col group shadow-lg"
                >
                  {/* Server Image if provided by admin */}
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

        {/* Single Button Below Content Labeled "قائمة المتصدرين (Leaderboard)" */}
        <div className="pt-8 border-t border-slate-800 flex justify-center">
          <button
            onClick={() => onNavigate('leaderboard')}
            className="w-full sm:w-auto min-w-[260px] py-4 px-8 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-white font-heading font-bold text-base flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(0,229,255,0.35)] transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Trophy className="w-5 h-5" />
            <span>عرض قائمة المتصدرين (Leaderboard)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
