import React, { useState } from 'react';
import {
  ArrowRight,
  Trophy,
  X,
  Swords,
  FileText,
  CheckCircle2,
  Search,
  Crown,
  Medal,
} from 'lucide-react';
import { PublicLeaderboardItem, TierDefinition, WHITE_KINGDOM_TIERS } from '../types/pvp.js';
import { ScrollReveal } from '../components/ScrollReveal.js';
import BorderGlow from '../components/BorderGlow.js';
import { handleAvatarImgError } from '../utils/discordAvatar.js';

interface LeaderboardPageProps {
  leaderboard: PublicLeaderboardItem[];
  tiers?: TierDefinition[];
  onNavigate: (page: string) => void;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({
  leaderboard,
  tiers,
  onNavigate,
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<PublicLeaderboardItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const activeTiers = tiers && tiers.length > 0 ? tiers : WHITE_KINGDOM_TIERS;
  const getTierInfo = (tierName: string) => {
    const clean = (tierName || '').trim().toLowerCase();
    const found = activeTiers.find(t => t.name.toLowerCase() === clean);
    if (found) {
      return {
        name: found.name,
        label: found.label || found.name,
        rank: found.rank,
        color: found.color || '#00e5ff',
      };
    }
    return {
      name: tierName || 'HT1',
      label: tierName || 'HT1',
      rank: 5,
      color: '#00e5ff',
    };
  };

  const filteredLeaderboard = leaderboard.filter(player => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      player.minecraftName.toLowerCase().includes(q) ||
      player.discordDisplayName.toLowerCase().includes(q) ||
      (player.discordUsername && player.discordUsername.toLowerCase().includes(q)) ||
      player.tierName.toLowerCase().includes(q)
    );
  });

  const top1 = leaderboard.find(p => p.rank === 1);
  const top2 = leaderboard.find(p => p.rank === 2);
  const top3 = leaderboard.find(p => p.rank === 3);

  return (
    <div
      dir="rtl"
      className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10 select-none"
    >
      {/* Top Navigation Back */}
      <button
        onClick={() => onNavigate('home')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-300 transition-colors mb-6 sm:mb-8 cursor-pointer group focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg p-1"
      >
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        <span>العودة إلى الصفحة الرئيسية</span>
      </button>

      {/* Header */}
      <ScrollReveal delayMs={50}>
        <div className="text-center mb-8 sm:mb-10 space-y-2.5">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
            <Trophy className="w-7 h-7" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-white tracking-wide">
            قائمة المتصدرين والمستويات
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            مرتبة تلقائياً بناءً على تقييمات واختبارات السيرفر (اضغط على أي لاعب لعرض تفاصيل الاختبار)
          </p>
        </div>
      </ScrollReveal>

      {/* Podium Feature Cards (Top 3) */}
      {!searchQuery && top1 && (
        <ScrollReveal delayMs={100} className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
            
            {/* Rank 2 (Silver) */}
            {top2 && (
              <div onClick={() => setSelectedPlayer(top2)} className="order-2 sm:order-1 cursor-pointer">
                <BorderGlow
                  borderRadius={24}
                  edgeSensitivity={30}
                  glowRadius={30}
                  glowIntensity={0.9}
                  colors={['#94a3b8', '#cbd5e1', '#ffffff']}
                  backgroundColor="#0b1120"
                  className="w-full transition-transform hover:scale-[1.02]"
                >
                  <div className="p-5 text-center space-y-3">
                    <div className="relative inline-block mx-auto">
                      <Crown className="w-6 h-6 text-slate-300 mx-auto mb-1 drop-shadow-[0_0_8px_rgba(203,213,225,0.45)]" />
                      <img
                        src={top2.discordAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                        alt={top2.discordDisplayName}
                        onError={(e) => handleAvatarImgError(e)}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-300 shadow-md mx-auto bg-slate-950"
                      />
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-300 text-black font-bold text-xs flex items-center justify-center font-mono">
                        2
                      </span>
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-white text-base truncate">{top2.minecraftName}</h4>
                      <p className="text-xs text-slate-400 truncate">{top2.discordDisplayName}</p>
                    </div>
                    {(() => {
                      const top2Tier = getTierInfo(top2.tierName);
                      return (
                        <div
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-all"
                          style={{
                            backgroundColor: `${top2Tier.color}25`,
                            borderColor: `${top2Tier.color}80`,
                            color: '#ffffff',
                            boxShadow: `0 0 10px ${top2Tier.color}25`,
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: top2Tier.color,
                              boxShadow: `0 0 6px ${top2Tier.color}`,
                            }}
                          />
                          <span>{top2.tierName}</span>
                        </div>
                      );
                    })()}
                  </div>
                </BorderGlow>
              </div>
            )}

            {/* Rank 1 (Gold) */}
            <div onClick={() => setSelectedPlayer(top1)} className="order-1 sm:order-2 cursor-pointer">
              <BorderGlow
                borderRadius={24}
                edgeSensitivity={30}
                glowRadius={35}
                glowIntensity={1.3}
                colors={['#f59e0b', '#fbbf24', '#ffffff']}
                backgroundColor="#15130b"
                className="w-full transition-transform hover:scale-[1.03] shadow-[0_0_30px_rgba(245,158,11,0.15)]"
              >
                <div className="p-6 text-center space-y-3.5 bg-gradient-to-b from-amber-500/10 to-transparent">
                  <div className="relative inline-block mx-auto">
                    <Crown className="w-6 h-6 text-amber-400 mx-auto mb-1 animate-bounce" />
                    <img
                      src={top1.discordAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                      alt={top1.discordDisplayName}
                      onError={(e) => handleAvatarImgError(e)}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-lg mx-auto bg-slate-950"
                    />
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-400 text-black font-black text-xs shadow-md">
                      #1 الأول
                    </span>
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-white text-lg truncate">{top1.minecraftName}</h3>
                    <p className="text-xs text-amber-300/90 font-medium truncate">{top1.discordDisplayName}</p>
                  </div>
                  <div className="inline-flex px-3.5 py-1 rounded-xl text-xs font-mono font-black text-black bg-gradient-to-r from-amber-400 to-yellow-300 shadow-md">
                    {top1.tierName}
                  </div>
                </div>
              </BorderGlow>
            </div>

            {/* Rank 3 (Bronze) */}
            {top3 && (
              <div onClick={() => setSelectedPlayer(top3)} className="order-3 cursor-pointer">
                <BorderGlow
                  borderRadius={24}
                  edgeSensitivity={30}
                  glowRadius={30}
                  glowIntensity={0.9}
                  colors={['#b45309', '#d97706', '#ffffff']}
                  backgroundColor="#140f09"
                  className="w-full transition-transform hover:scale-[1.02]"
                >
                  <div className="p-5 text-center space-y-3">
                    <div className="relative inline-block mx-auto">
                      <Crown className="w-6 h-6 text-[#cd7f32] mx-auto mb-1 drop-shadow-[0_0_8px_rgba(205,127,50,0.5)]" />
                      <img
                        src={top3.discordAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                        alt={top3.discordDisplayName}
                        onError={(e) => handleAvatarImgError(e)}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-700 shadow-md mx-auto bg-slate-950"
                      />
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-700 text-white font-bold text-xs flex items-center justify-center font-mono">
                        3
                      </span>
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-white text-base truncate">{top3.minecraftName}</h4>
                      <p className="text-xs text-slate-400 truncate">{top3.discordDisplayName}</p>
                    </div>
                    {(() => {
                      const top3Tier = getTierInfo(top3.tierName);
                      return (
                        <div
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-all"
                          style={{
                            backgroundColor: `${top3Tier.color}25`,
                            borderColor: `${top3Tier.color}80`,
                            color: '#ffffff',
                            boxShadow: `0 0 10px ${top3Tier.color}25`,
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: top3Tier.color,
                              boxShadow: `0 0 6px ${top3Tier.color}`,
                            }}
                          />
                          <span>{top3.tierName}</span>
                        </div>
                      );
                    })()}
                  </div>
                </BorderGlow>
              </div>
            )}

          </div>
        </ScrollReveal>
      )}

      {/* Search Input Filter */}
      <ScrollReveal delayMs={120}>
        <div className="mb-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم في ماين كرافت، اسم ديسكورد، أو التير..."
            className="w-full pr-11 pl-4 py-3 rounded-2xl glass-panel-subtle text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              مسح
            </button>
          )}
        </div>
      </ScrollReveal>

      {/* Leaderboard Table / Cards */}
      <ScrollReveal delayMs={150}>
        <div className="glass-panel rounded-3xl border border-cyan-500/25 shadow-2xl overflow-hidden">
          {filteredLeaderboard && filteredLeaderboard.length > 0 ? (
            <div className="divide-y divide-slate-800/80">
              {/* Table Header */}
              <div className="grid grid-cols-12 px-5 sm:px-6 py-3.5 bg-slate-900/90 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 text-right">
                <div className="col-span-2 sm:col-span-1 text-center">الترتيب</div>
                <div className="col-span-10 sm:col-span-11 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div>اللاعب (ماين كرافت)</div>
                  <div className="hidden sm:block">حساب ديسكورد</div>
                  <div className="text-left sm:text-left">التقييم (Tier)</div>
                </div>
              </div>

              {/* Player Entries */}
              {filteredLeaderboard.map((player) => {
                const isTop1 = player.rank === 1;
                const isTop2 = player.rank === 2;
                const isTop3 = player.rank === 3;
                const tierInfo = getTierInfo(player.tierName);

                return (
                  <div
                    key={`${player.rank}-${player.minecraftName}`}
                    onClick={() => setSelectedPlayer(player)}
                    className={`grid grid-cols-12 px-5 sm:px-6 py-3.5 items-center transition-all cursor-pointer text-right group ${
                      isTop1
                        ? 'bg-amber-500/5 hover:bg-amber-500/15'
                        : isTop2
                        ? 'bg-slate-300/5 hover:bg-slate-300/15'
                        : isTop3
                        ? 'bg-amber-700/5 hover:bg-amber-700/15'
                        : 'hover:bg-cyan-950/20'
                    }`}
                    title="اضغط لعرض تفاصيل الاختبار والألعاب والملاحظات"
                  >
                    {/* Rank Badge */}
                    <div className="col-span-2 sm:col-span-1 flex items-center justify-center">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-mono text-xs font-bold transition-transform group-hover:scale-105 ${
                          isTop1
                            ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-black shadow-md'
                            : isTop2
                            ? 'bg-gradient-to-tr from-slate-300 to-slate-100 text-black shadow-md'
                            : isTop3
                            ? 'bg-gradient-to-tr from-amber-700 to-amber-500 text-white shadow-md'
                            : 'bg-slate-800/80 text-slate-300 border border-slate-700/50'
                        }`}
                      >
                        #{player.rank}
                      </span>
                    </div>

                    {/* Player Info */}
                    <div className="col-span-10 sm:col-span-11 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center pr-2 sm:pr-0">
                      
                      {/* 1. Minecraft Username */}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm sm:text-base tracking-wide group-hover:text-cyan-300 transition-colors">
                          {player.minecraftName}
                        </span>
                      </div>

                      {/* 2. Discord Profile Picture & Name */}
                      <div className="flex items-center gap-2.5">
                        <img
                          src={player.discordAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                          alt={player.discordDisplayName}
                          onError={(e) => handleAvatarImgError(e)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-cyan-500/40 shadow-sm flex-shrink-0 bg-slate-950"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-slate-200 truncate">
                            {player.discordDisplayName}
                          </span>
                          {player.discordUsername && (
                            <span className="text-[10px] font-mono text-cyan-400/80 truncate hidden sm:inline" dir="ltr">
                              @{player.discordUsername}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 3. Tier Rating Badge */}
                      <div className="flex items-center justify-start sm:justify-end gap-2">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-all"
                          style={{
                            backgroundColor: `${tierInfo.color}20`,
                            borderColor: `${tierInfo.color}60`,
                            color: '#ffffff',
                            boxShadow: `0 0 10px ${tierInfo.color}20`,
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: tierInfo.color,
                              boxShadow: `0 0 6px ${tierInfo.color}`,
                            }}
                          />
                          <span>{player.tierName}</span>
                        </span>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-sm">
              {searchQuery ? 'لا توجد نتائج تطابق بحثك.' : 'لا يوجد لاعبين مسجلين في قائمة المتصدرين حالياً.'}
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Player Test Breakdown Details Modal */}
      {selectedPlayer && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedPlayer(null)}
        >
          <div
            className="relative w-full max-w-lg glow-window rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,229,255,0.25)] text-right space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedPlayer(null)}
              className="glow-btn absolute top-5 left-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Player Header */}
            <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
              <img
                src={selectedPlayer.discordAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                alt={selectedPlayer.discordDisplayName}
                onError={(e) => handleAvatarImgError(e)}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-500/60 shadow-lg bg-slate-950"
              />
              <div className="space-y-1">
                <div className="text-xs text-cyan-400 font-mono font-semibold">
                  الترتيب العام: #{selectedPlayer.rank}
                </div>
                <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-white">
                  {selectedPlayer.minecraftName}
                </h3>
                <div className="text-xs text-slate-300">
                  حساب ديسكورد: <span className="font-semibold text-white">{selectedPlayer.discordDisplayName}</span>
                  {selectedPlayer.discordUsername && (
                    <span className="text-cyan-400 font-mono mr-1.5" dir="ltr">(@{selectedPlayer.discordUsername})</span>
                  )}
                </div>
              </div>
            </div>

            {/* Tier Achievement Badge */}
            {(() => {
              const tierInfo = getTierInfo(selectedPlayer.tierName);
              return (
                <div
                  className="p-4 rounded-2xl border flex items-center justify-between"
                  style={{
                    backgroundColor: `${tierInfo.color}15`,
                    borderColor: `${tierInfo.color}50`,
                  }}
                >
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-mono" style={{ color: tierInfo.color }}>
                      المستوى المعتمد (Achieved Tier)
                    </div>
                    <div className="text-lg font-bold text-white">
                      {tierInfo.label || selectedPlayer.tierName}
                    </div>
                  </div>
                  <span
                    className="px-4 py-2 rounded-xl font-mono text-sm font-extrabold shadow-lg flex items-center gap-2"
                    style={{
                      backgroundColor: tierInfo.color,
                      color: '#000000',
                      boxShadow: `0 0 20px ${tierInfo.color}60`,
                    }}
                  >
                    <span>{selectedPlayer.tierName}</span>
                  </span>
                </div>
              );
            })()}

            {/* Games Played / Tested Disciplines */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                <Swords className="w-4 h-4" />
                <span>الألعاب والمودات التي تم اختبارها:</span>
              </div>

              {selectedPlayer.gamesPlayed && selectedPlayer.gamesPlayed.length > 0 ? (
                <div className="space-y-2">
                  {selectedPlayer.gamesPlayed.map((game, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                          <span>{game.gameName}</span>
                        </div>
                        {game.details && (
                          <div className="text-slate-400 text-[11px] pr-5">
                            {game.details}
                          </div>
                        )}
                      </div>
                      {game.score && (
                        <div className="font-mono font-bold text-cyan-300 px-2.5 py-1 rounded-lg bg-black/40 border border-cyan-500/30 text-xs">
                          {game.score}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                  تم إجراء الاختبار التقييمي الشامل عبر مودات القتال المعتمدة.
                </div>
              )}
            </div>

            {/* Evaluator Notes & Observations */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                <FileText className="w-4 h-4" />
                <span>ملاحظات المدرب وتوجيهات الاختبار:</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                {selectedPlayer.notes || 'لم يتم تسجيل ملاحظات إضافية لهذا الاختبار.'}
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-2">
              <button
                onClick={() => setSelectedPlayer(null)}
                className="glow-btn w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
