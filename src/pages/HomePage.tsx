import React from 'react';
import {
  Server,
  Swords,
  Youtube,
  Trophy,
  ExternalLink,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';
import { WhiteKingdomLogo } from '../components/WhiteKingdomLogo.js';
import { ScrollReveal } from '../components/ScrollReveal.js';
import { BorderGlow } from '../components/BorderGlow.js';

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
  const handleOpenYouTube = () => {
    const targetUrl = youtubeUrl || 'https://www.youtube.com';
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      dir="rtl"
      className="min-h-[82vh] flex flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-16 relative z-10 select-none"
    >
      <div className="max-w-2xl w-full text-center flex flex-col items-center space-y-7">
        
        {/* Community Verification Badge */}
        <ScrollReveal delayMs={50}>
          <div className="glow-card inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 text-cyan-300 text-xs font-semibold shadow-[0_0_20px_rgba(0,229,255,0.12)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
            <span>{welcomeBadgeText || 'المجتمع التنافسي الرسمي 2026'}</span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          </div>
        </ScrollReveal>

        {/* Server Logo Hero */}
        <ScrollReveal delayMs={100}>
          <div className="relative group transition-transform duration-500 hover:scale-[1.03]">
            <WhiteKingdomLogo
              size="hero"
              logoUrl={logoUrl}
              serverName={serverName}
              glow={true}
            />
          </div>
        </ScrollReveal>

        {/* Discord Community Server Name & Arabic Subtitle */}
        <ScrollReveal delayMs={150}>
          <div className="space-y-3">
            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl text-white tracking-wide drop-shadow-[0_4px_25px_rgba(0,229,255,0.3)]">
              <span className="bg-gradient-to-r from-white via-cyan-100 to-sky-300 bg-clip-text text-transparent">
                {serverName}
              </span>
            </h1>
            <p className="text-sm sm:text-base font-medium text-slate-300 leading-relaxed">
              أهلاً بك في الموقع الرسمي لسيرفر <span className="text-cyan-300 font-semibold">{serverName}</span>
            </p>

            {/* Owner Discord Profile Badge with React Bits BorderGlow */}
            {ownerName && (
              <div className="pt-2 flex justify-center">
                <BorderGlow
                  borderRadius={18}
                  edgeSensitivity={30}
                  glowRadius={32}
                  glowIntensity={1.0}
                  colors={['#2563eb', '#00e5ff', '#ffffff']}
                  backgroundColor="#0a101f"
                >
                  <div className="inline-flex items-center gap-3 px-4 py-2 transition-colors rounded-[inherit] border-0">
                    {ownerAvatar ? (
                      <img
                        src={ownerAvatar}
                        alt={ownerName}
                        className="w-8 h-8 rounded-full border border-cyan-400/70 object-cover shadow-[0_0_10px_rgba(0,229,255,0.35)]"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-amber-400 text-sm">
                        👑
                      </div>
                    )}
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <span className="text-cyan-300">@{ownerName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                          👑 {ownerTag || 'صاحب السيرفر ومؤسس الموقع'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">حساب ديسكورد الرسمي لمؤسس السيرفر والموقع</p>
                    </div>
                  </div>
                </BorderGlow>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Primary Action Buttons Grid */}
        <ScrollReveal delayMs={200} className="w-full">
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 text-right">
            
            {/* Discord Official Invite with React Bits BorderGlow */}
            {(() => {
              const finalDiscordUrl = discordInviteUrl || 'https://discord.gg/whitekingdom';
              return (
                <div className="col-span-1 sm:col-span-2 w-full">
                  <BorderGlow
                    borderRadius={18}
                    edgeSensitivity={35}
                    glowRadius={40}
                    glowIntensity={1.2}
                    colors={['#5865F2', '#00e5ff', '#ffffff']}
                    backgroundColor="#5865F2"
                    className="w-full shadow-[0_4px_25px_rgba(88,101,242,0.4)]"
                  >
                    <a
                      href={finalDiscordUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        try {
                          const win = window.open(finalDiscordUrl, '_blank', 'noopener,noreferrer');
                          if (!win) window.location.assign(finalDiscordUrl);
                        } catch {
                          window.location.assign(finalDiscordUrl);
                        }
                      }}
                      className="w-full py-3.5 px-6 rounded-[inherit] font-heading font-bold text-sm sm:text-base flex items-center justify-between group cursor-pointer whitespace-nowrap select-none text-white bg-gradient-to-r from-[#5865F2] via-[#4752C4] to-[#353ca8] border-0 shadow-none transition-all"
                      title="انضم إلى سيرفر ديسكورد الرسمي"
                    >
                      <div className="flex items-center gap-3 relative z-10 pointer-events-none">
                        <div className="p-2 rounded-xl bg-white/15 shadow-inner">
                          <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                          </svg>
                        </div>
                        <span className="font-heading font-extrabold tracking-wide text-white">انضم إلى سيرفر ديسكورد الرسمي</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-white opacity-85 group-hover:opacity-100 transition-opacity relative z-10 pointer-events-none" />
                    </a>
                  </BorderGlow>
                </div>
              );
            })()}

            {/* Server Page (Unified About + News) */}
            <BorderGlow
              borderRadius={18}
              edgeSensitivity={25}
              glowRadius={30}
              colors={['#2563eb', '#00e5ff', '#ffffff']}
              backgroundColor="#0c1426"
              className="w-full"
            >
              <button
                onClick={() => onNavigate('server')}
                className="w-full py-3.5 px-5 rounded-[inherit] text-white font-heading font-bold text-sm flex items-center justify-between group cursor-pointer text-right transition-colors border-0 shadow-none bg-transparent"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 group-hover:bg-cyan-500/25 transition-colors">
                    <Server className="w-4 h-4" />
                  </div>
                  <span>السيرفر (معلومات وأخبار)</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-cyan-300 group-hover:-translate-x-1 transition-all" />
              </button>
            </BorderGlow>

            {/* Tier Test Page */}
            <BorderGlow
              borderRadius={18}
              edgeSensitivity={25}
              glowRadius={30}
              colors={['#2563eb', '#00e5ff', '#ffffff']}
              backgroundColor="#0c1426"
              className="w-full"
            >
              <button
                onClick={() => onNavigate('tier-test')}
                className="w-full py-3.5 px-5 rounded-[inherit] text-white font-heading font-bold text-sm flex items-center justify-between group cursor-pointer text-right transition-colors border-0 shadow-none bg-transparent"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 group-hover:bg-sky-500/25 transition-colors">
                    <Swords className="w-4 h-4" />
                  </div>
                  <span>اختبار المستويات (Tier Test)</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-cyan-300 group-hover:-translate-x-1 transition-all" />
              </button>
            </BorderGlow>

            {/* Leaderboard Page */}
            <BorderGlow
              borderRadius={18}
              edgeSensitivity={25}
              glowRadius={30}
              colors={['#2563eb', '#00e5ff', '#ffffff']}
              backgroundColor="#0c1426"
              className="w-full"
            >
              <button
                onClick={() => onNavigate('leaderboard')}
                className="w-full py-3.5 px-5 rounded-[inherit] text-white font-heading font-bold text-sm flex items-center justify-between group cursor-pointer text-right transition-colors border-0 shadow-none bg-transparent"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 group-hover:bg-amber-500/25 transition-colors">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <span>قائمة المتصدرين</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-cyan-300 group-hover:-translate-x-1 transition-all" />
              </button>
            </BorderGlow>

            {/* YouTube Channel Button */}
            <BorderGlow
              borderRadius={18}
              edgeSensitivity={25}
              glowRadius={30}
              colors={['#2563eb', '#00e5ff', '#ffffff']}
              backgroundColor="#0c1426"
              className="w-full"
            >
              <button
                onClick={handleOpenYouTube}
                className="w-full py-3.5 px-5 rounded-[inherit] text-white font-heading font-bold text-sm flex items-center justify-between group cursor-pointer text-right transition-colors border-0 shadow-none bg-transparent"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-red-500/15 text-red-400 group-hover:bg-red-500/25 transition-colors">
                    <Youtube className="w-4 h-4" />
                  </div>
                  <span>قناتي على يوتيوب</span>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition-colors" />
              </button>
            </BorderGlow>

          </div>
        </ScrollReveal>

      </div>
    </div>
  );
};
