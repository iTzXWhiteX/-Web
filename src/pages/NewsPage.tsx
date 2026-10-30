import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Newspaper, Pin, Calendar, Tag, ShieldCheck, Sparkles, HelpCircle } from 'lucide-react';
import { NewsArticle, ServerRole } from '../types/pvp.js';
import { DiscordFormattedText } from '../utils/discordMentionParser.js';
import { RoleDetailsModal } from '../components/RoleDetailsModal.js';

interface NewsPageProps {
  newsArticles: NewsArticle[];
  roles: ServerRole[];
  content?: string;
  onNavigate: (page: string) => void;
}

export const NewsPage: React.FC<NewsPageProps> = ({
  newsArticles,
  roles,
  content,
  onNavigate,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [activeRoleModal, setActiveRoleModal] = useState<ServerRole | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 40);
    return () => clearTimeout(timer);
  }, []);

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
      ref={containerRef}
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

      {/* Header Section */}
      <div className="text-center mb-10 space-y-3">
        <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.25)] mb-2">
          <Newspaper className="w-7 h-7" />
        </div>
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-white tracking-wide">
          الأخبار والإعلانات الرسمية
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          {content || 'تابع آخر أخبار وتحديثات مجتمع 𝑾𝒉𝒊𝒕𝒆 𝑲𝒊𝒏𝒈𝒅𝒐𝒎، مواعيد بطولات المبارزات، وقوائم التحديثات الرسمية أولاً بأول.'}
        </p>
      </div>

      {/* Server Roles Showcase Strip (Only roles with showInList !== false) */}
      {publicRoles && publicRoles.length > 0 && (
        <div className="mb-10 p-5 rounded-2xl cyber-card border border-cyan-500/20 text-right space-y-3">
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all hover:scale-105 active:scale-95 cursor-pointer select-none group"
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
      )}

      {/* Categories Filter Tabs */}
      {categories.length > 2 && (
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,229,255,0.35)]'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Articles Feed */}
      <div className="space-y-6">
        {filteredArticles && filteredArticles.length > 0 ? (
          filteredArticles.map((article) => {
            const dateStr = new Date(article.createdAt).toLocaleDateString('ar-EG', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });

            return (
              <article
                key={article.id}
                className={`cyber-card rounded-3xl overflow-hidden border transition-all duration-300 group text-right ${
                  article.pinned
                    ? 'border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)] bg-gradient-to-b from-amber-500/5 to-transparent'
                    : 'border-cyan-500/20'
                }`}
              >
                {/* Optional Banner Image */}
                {article.imageUrl && (
                  <div className="w-full h-48 sm:h-64 bg-slate-950 overflow-hidden relative border-b border-slate-800">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090e1c] via-transparent to-transparent opacity-80" />
                  </div>
                )}

                <div className="p-6 sm:p-8 space-y-4">
                  {/* Article Metadata (Category + Date + Pinned) */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      {article.pinned && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <Pin className="w-3.5 h-3.5" />
                          <span>إعلان مثبت</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                        <Tag className="w-3.5 h-3.5" />
                        <span>{article.category}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{dateStr}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-white group-hover:text-cyan-300 transition-colors">
                    {article.title}
                  </h2>

                  {/* Content with Discord role & channel mentions */}
                  <div className="text-slate-200 text-sm sm:text-base leading-relaxed">
                    <DiscordFormattedText
                      text={article.content}
                      roles={roles}
                      onRoleClick={r => setActiveRoleModal(r)}
                    />
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="p-16 text-center text-slate-400 text-sm cyber-card rounded-3xl">
            لا توجد أخبار منشورة في هذا القسم حالياً.
          </div>
        )}
      </div>

      {/* Role Details Modal (Clicking any role opens this) */}
      <RoleDetailsModal
        role={activeRoleModal}
        onClose={() => setActiveRoleModal(null)}
      />
    </div>
  );
};
