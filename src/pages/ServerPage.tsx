import React, { useState } from 'react';
import {
  ArrowRight,
  Newspaper,
  Pin,
  Calendar,
  Tag,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Info,
} from 'lucide-react';
import { NewsArticle, ServerRole } from '../types/pvp.js';
import { WhiteKingdomLogo } from '../components/WhiteKingdomLogo.js';
import { DiscordFormattedText } from '../utils/discordMentionParser.js';
import { RoleDetailsModal } from '../components/RoleDetailsModal.js';
import { ScrollReveal } from '../components/ScrollReveal.js';

interface ServerPageProps {
  serverName: string;
  logoUrl: string;
  aboutContent: string;
  newsContent?: string;
  newsArticles: NewsArticle[];
  roles: ServerRole[];
  onNavigate: (page: string) => void;
}

export const ServerPage: React.FC<ServerPageProps> = ({
  serverName,
  logoUrl,
  aboutContent,
  newsContent,
  newsArticles,
  roles,
  onNavigate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [activeRoleModal, setActiveRoleModal] = useState<ServerRole | null>(null);

  // Filter roles configured to show in public list
  const publicRoles = roles.filter(r => r.showInList !== false);

  // Extract unique categories
  const categories = ['الكل', ...Array.from(new Set(newsArticles.map(a => a.category).filter(Boolean)))];

  const filteredArticles = newsArticles.filter(article => {
    if (selectedCategory === 'الكل') return true;
    return article.category === selectedCategory;
  });

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

      {/* ========================================================= */}
      {/* SECTION ONE: SERVER INFORMATION (عن السيرفر)             */}
      {/* ========================================================= */}
      <ScrollReveal delayMs={50}>
        <section aria-label="معلومات السيرفر" className="space-y-6">
          {/* Main Server Information Card */}
          <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-cyan-500/25 shadow-2xl space-y-8 relative overflow-hidden">
            {/* Subtle top ambient glow */}
            <div className="absolute top-0 right-1/4 w-72 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Card Header */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 border-b border-slate-800/80 pb-7 text-center sm:text-right relative z-10">
              <WhiteKingdomLogo size="lg" logoUrl={logoUrl} serverName={serverName} glow={false} />
              <div className="space-y-1.5">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider">
                  <Info className="w-4 h-4" />
                  <span>نبذة عن المجتمع والتفاصيل الرسمية</span>
                </div>
                <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-wide">
                  سيرفر {serverName}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  المعلومات الرسمية والتعليمات المحددة مباشرة من قِبل إدارة السيرفر.
                </p>
              </div>
            </div>

            {/* Admin Managed Content */}
            <div className="prose prose-invert max-w-none text-right relative z-10">
              <div className="text-sm sm:text-base text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                {aboutContent || 'لم تتم إضافة تفاصيل عن السيرفر حتى الآن من قِبل الإدارة.'}
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ========================================================= */}
      {/* HORIZONTAL DIVIDER: Elegant Cyan Glow                      */}
      {/* ========================================================= */}
      <ScrollReveal delayMs={100}>
        <div className="relative my-10 sm:my-14 flex items-center justify-center" role="separator" aria-label="فاصل الأقسام">
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent shadow-[0_0_10px_rgba(0,229,255,0.3)]" />
          
          <div className="absolute px-4 py-1.5 rounded-full bg-[#060913] border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold shadow-[0_0_15px_rgba(0,229,255,0.2)] flex items-center gap-2 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>الأخبار والتحديثات الرسمية</span>
          </div>
        </div>
      </ScrollReveal>

      {/* ========================================================= */}
      {/* SECTION TWO: LATEST NEWS AND ANNOUNCEMENTS (آخر الأخبار)   */}
      {/* ========================================================= */}
      <section aria-label="آخر الأخبار" className="space-y-7">
        
        {/* Section Heading */}
        <ScrollReveal delayMs={120}>
          <div className="text-center space-y-2.5">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/25 text-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.15)]">
              <Newspaper className="w-6 h-6" />
            </div>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-wide">
              آخر الأخبار
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              {newsContent || `تابع آخر أخبار وتحديثات مجتمع ${serverName}، مواعيد بطولات المبارزات، وقوائم التحديثات أولاً بأول.`}
            </p>
          </div>
        </ScrollReveal>

        {/* Server Roles Showcase Strip */}
        {publicRoles && publicRoles.length > 0 && (
          <ScrollReveal delayMs={150}>
            <div className="p-5 rounded-2xl glass-panel border border-cyan-500/20 text-right space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>رولات مجتمع السيرفر الرسمية (اضغط على أي رول لمعرفة شروطه)</span>
                </div>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>منشن مفعل</span>
                </span>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                {publicRoles.map(role => (
                  <button
                    key={role.id}
                    onClick={() => setActiveRoleModal(role)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all hover:scale-105 active:scale-95 cursor-pointer select-none group focus-visible:ring-2 focus-visible:ring-cyan-400"
                    style={{
                      backgroundColor: `${role.color}15`,
                      borderColor: `${role.color}50`,
                      color: role.color,
                      boxShadow: `0 0 15px ${role.color}25`,
                    }}
                    title={`اضغط لمعرفة تفاصيل وشروط رول ${role.name}`}
                  >
                    {role.emoji && <span className="text-sm leading-none">{role.emoji}</span>}
                    <span>@{role.name}</span>
                    <HelpCircle className="w-3 h-3 opacity-60 group-hover:opacity-100 mr-0.5" />
                  </button>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Categories Filter Tabs (Clean Segmented Controls) */}
        {categories.length > 2 && (
          <ScrollReveal delayMs={180}>
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-900/80 rounded-2xl border border-slate-800 justify-center max-w-fit mx-auto">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-cyan-500 text-black shadow-md font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </ScrollReveal>
        )}

        {/* Articles Feed */}
        <div className="space-y-6">
          {filteredArticles && filteredArticles.length > 0 ? (
            filteredArticles.map((article, idx) => {
              const dateStr = new Date(article.createdAt).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              return (
                <ScrollReveal key={article.id} delayMs={100 + (idx % 4) * 60}>
                  <article
                    className={`glass-panel rounded-3xl overflow-hidden border transition-all duration-300 group text-right ${
                      article.pinned
                        ? 'border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.12)] bg-gradient-to-b from-amber-500/5 to-slate-900/60'
                        : 'border-cyan-500/20 hover:border-cyan-400/40'
                    }`}
                  >
                    {/* Banner Image */}
                    {article.imageUrl && (
                      <div className="w-full h-48 sm:h-64 bg-slate-950 overflow-hidden relative border-b border-slate-800">
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#090e1c] via-transparent to-transparent opacity-80" />
                      </div>
                    )}

                    <div className="p-6 sm:p-8 space-y-4">
                      {/* Metadata row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          {article.pinned && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <Pin className="w-3.5 h-3.5" />
                              <span>إعلان مثبت</span>
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                            <Tag className="w-3 h-3" />
                            <span>{article.category}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{dateStr}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-white group-hover:text-cyan-300 transition-colors">
                        {article.title}
                      </h3>

                      {/* Content with Discord mentions */}
                      <div className="text-slate-200 text-sm sm:text-base leading-relaxed">
                        <DiscordFormattedText
                          text={article.content}
                          roles={roles}
                          onRoleClick={r => setActiveRoleModal(r)}
                        />
                      </div>
                    </div>
                  </article>
                </ScrollReveal>
              );
            })
          ) : (
            <div className="p-14 text-center text-slate-400 text-sm glass-panel rounded-3xl">
              لا توجد أخبار منشورة في هذا القسم حالياً.
            </div>
          )}
        </div>
      </section>

      {/* Role Details Modal */}
      <RoleDetailsModal
        role={activeRoleModal}
        onClose={() => setActiveRoleModal(null)}
      />
    </div>
  );
};
