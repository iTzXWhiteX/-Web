import React, { useEffect, useState } from 'react';
import { ArrowRight, MessageSquare } from 'lucide-react';
import { WhiteKingdomLogo } from '../components/WhiteKingdomLogo.js';

interface AboutPageProps {
  serverName: string;
  logoUrl: string;
  content: string;
  onNavigate: (page: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  serverName,
  logoUrl,
  content,
  onNavigate,
}) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 40);
    return () => clearTimeout(timer);
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

      {/* Main Content Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-cyan-500/25 shadow-2xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 border-b border-slate-800 pb-8 text-center sm:text-right">
          <WhiteKingdomLogo size="lg" logoUrl={logoUrl} serverName={serverName} glow={false} />
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider">
              <MessageSquare className="w-4 h-4" />
              <span>نبذة عن المجتمع</span>
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white">
              عن سيرفر {serverName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              المعلومات والتعليمات المحددة مباشرة من قِبل إدارة السيرفر.
            </p>
          </div>
        </div>

        {/* Admin's Content */}
        <div className="prose prose-invert max-w-none text-right">
          <div className="text-sm sm:text-base text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
            {content || 'لم تتم إضافة تفاصيل عن السيرفر حتى الآن من قِبل الإدارة.'}
          </div>
        </div>
      </div>
    </div>
  );
};
