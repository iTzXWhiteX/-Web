import React, { useEffect, useRef, useState } from 'react';
import { Info, Swords, Youtube, ArrowLeft, Newspaper, Sparkles } from 'lucide-react';
import { WhiteKingdomLogo } from '../components/WhiteKingdomLogo.js';

interface HomePageProps {
  serverName: string;
  logoUrl: string;
  youtubeUrl: string;
  discordInviteUrl?: string;
  ownerName?: string;
  ownerAvatar?: string;
  ownerTag?: string;
  welcomeBadgeText?: string;
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  serverName,
  logoUrl,
  youtubeUrl,
  discordInviteUrl,
  ownerName,
  ownerAvatar,
  ownerTag,
  welcomeBadgeText,
  onNavigate,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initialTimer = setTimeout(() => setIsVisible(true), 40);

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      clearTimeout(initialTimer);
      observer.disconnect();
    };
  }, []);

  const handleOpenYouTube = () => {
    const targetUrl = youtubeUrl || 'https://www.youtube.com';
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      ref={containerRef}
      dir="rtl"
      className={`min-h-[85vh] flex flex-col items-center justify-center px-4 sm:px-6 py-14 relative z-10 select-none transition-all duration-700 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-6 scale-[0.98] motion-reduce:opacity-100 motion-reduce:translate-y-0 motion-reduce:scale-100'
      }`}
    >
      <div className="max-w-xl w-full text-center flex flex-col items-center space-y-7">
        
        {/* Dynamic Community Badge with Pulsing Live Status */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-semibold shadow-[0_0_20px_rgba(0,229,255,0.2)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
          <span>{welcomeBadgeText || 'مجتمع ديسكورد التنافسي الرسمي'}</span>
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        </div>

        {/* Profile Picture / Server Logo */}
        <div className="relative group transition-transform duration-500 hover:scale-105">
          <WhiteKingdomLogo
            size="hero"
            logoUrl={logoUrl}
            serverName={serverName}
            glow={true}
          />
        </div>

        {/* Discord Community Server Name & Arabic Subtitle */}
        <div className="space-y-3">
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl text-white tracking-wide drop-shadow-[0_4px_25px_rgba(0,229,255,0.35)]">
            {serverName}
          </h1>
          <p className="text-sm sm:text-base font-semibold text-cyan-300 drop-shadow-[0_2px_10px_rgba(0,229,255,0.4)]">
            أهلاً بك في الموقع الرسمي لسيرفر {serverName}
          </p>

          {/* Owner Discord Profile Badge */}
          {ownerName && (
            <div className="pt-2 flex justify-center">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#090e1d]/90 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,229,255,0.18)] hover:border-cyan-400 transition-all">
                {ownerAvatar ? (
                  <img
                    src={ownerAvatar}
                    alt={ownerName}
                    className="w-10 h-10 rounded-full border-2 border-cyan-400 object-cover shadow-[0_0_12px_rgba(0,229,255,0.4)]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 font-bold text-sm">
                    👑
                  </div>
                )}
                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <span>@{ownerName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">👑 {ownerTag || 'صاحب ومؤسس السيرفر'}</span>
                  </div>
                  <p className="text-[10px] text-cyan-300/80 font-mono">حساب ديسكورد الرسمي لمؤسس السيرفر والموقع</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Action Buttons (All with hover scale & glowing highlight + rainbow spin on click) */}
        <div className="w-full max-w-md pt-2 space-y-3.5">
          {/* Discord Invite Button (Configured by admin) */}
          {discordInviteUrl && (
            <a
              href={discordInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-heading font-bold text-base flex items-center justify-between group shadow-xl shadow-[#5865F2]/25 cursor-pointer hover:scale-[1.035] active:scale-95 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </div>
                <span className="tracking-wide">انضم إلى سيرفر ديسكورد</span>
              </div>
              <ArrowLeft className="w-5 h-5 text-white/80 group-hover:text-white group-hover:-translate-x-1 transition-all" />
            </a>
          )}
          
          {/* Button 1: About the Server */}
          <button
            onClick={() => onNavigate('about')}
            className="w-full py-3.5 px-6 rounded-2xl glass-panel hover:bg-slate-800/80 border border-cyan-500/30 text-white font-heading font-bold text-base flex items-center justify-between group shadow-lg shadow-cyan-950/30 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-all">
                <Info className="w-5 h-5" />
              </div>
              <span className="tracking-wide">عن السيرفر</span>
            </div>
            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-cyan-300 group-hover:-translate-x-1 transition-all" />
          </button>

          {/* Button 2: Tier Test */}
          <button
            onClick={() => onNavigate('tier-test')}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-700 via-cyan-600 to-cyan-500 hover:from-blue-600 hover:to-cyan-400 text-white font-heading font-bold text-base flex items-center justify-between group shadow-xl shadow-cyan-500/20 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <Swords className="w-5 h-5 text-cyan-200" />
              </div>
              <span className="tracking-wide">اختبار المستويات (Tier Test)</span>
            </div>
            <ArrowLeft className="w-5 h-5 text-white/80 group-hover:text-white group-hover:-translate-x-1 transition-all" />
          </button>

          {/* Button 3: News (الزر الجديد) */}
          <button
            onClick={() => onNavigate('news')}
            className="w-full py-3.5 px-6 rounded-2xl glass-panel hover:bg-amber-950/20 border border-amber-500/30 hover:border-amber-400 text-white font-heading font-bold text-base flex items-center justify-between group shadow-lg shadow-amber-950/20 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-all">
                <Newspaper className="w-5 h-5" />
              </div>
              <span className="tracking-wide">الأخبار والإعلانات (News)</span>
            </div>
            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-amber-400 group-hover:-translate-x-1 transition-all" />
          </button>

          {/* Button 4: My YouTube */}
          <button
            onClick={handleOpenYouTube}
            className="w-full py-3.5 px-6 rounded-2xl glass-panel hover:bg-red-950/30 border border-red-500/30 hover:border-red-400 text-white font-heading font-bold text-base flex items-center justify-between group shadow-lg shadow-red-950/20 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:bg-red-600 group-hover:text-white transition-all">
                <Youtube className="w-5 h-5" />
              </div>
              <span className="tracking-wide">قناتي على يوتيوب</span>
            </div>
            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-red-400 group-hover:-translate-x-1 transition-all" />
          </button>
        </div>

      </div>
    </div>
  );
};
