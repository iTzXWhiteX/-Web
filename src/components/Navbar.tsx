import React, { useState } from 'react';
import {
  Shield,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Crown,
  Home,
  Server,
  Swords,
  Trophy,
  User,
} from 'lucide-react';
import { UserProfile } from '../types/pvp.js';
import { WhiteKingdomLogo } from './WhiteKingdomLogo.js';

interface NavbarProps {
  user: UserProfile | null;
  serverName: string;
  logoUrl: string;
  ownerName?: string;
  ownerAvatar?: string;
  ownerTag?: string;
  discordInviteUrl?: string;
  activePage: string;
  onNavigate: (page: string) => void;
  onOpenLogin: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  serverName,
  logoUrl,
  ownerName,
  ownerAvatar,
  ownerTag,
  discordInviteUrl,
  activePage,
  onNavigate,
  onOpenLogin,
  onOpenProfile,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Exact navigation items in Arabic RTL order:
  // 1. الرئيسية
  // 2. السيرفر (unified server info + latest news)
  // 3. اختبار المستويات
  // 4. قائمة المتصدرين
  const navLinks = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'server', label: 'السيرفر', icon: Server, aliases: ['server', 'about', 'news'] },
    { id: 'tier-test', label: 'اختبار المستويات', icon: Swords },
    { id: 'leaderboard', label: 'قائمة المتصدرين', icon: Trophy },
  ];

  const isLinkActive = (link: typeof navLinks[number]) => {
    if (link.aliases) {
      return link.aliases.includes(activePage);
    }
    return activePage === link.id;
  };

  const targetDiscordUrl = discordInviteUrl || 'https://discord.gg/whitekingdom';

  const handleOpenDiscord = (e: React.MouseEvent) => {
    try {
      const win = window.open(targetDiscordUrl, '_blank', 'noopener,noreferrer');
      if (!win) window.location.assign(targetDiscordUrl);
    } catch {
      window.location.assign(targetDiscordUrl);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-[#060913]/92 border-b border-cyan-500/15 shadow-[0_4px_25px_rgba(0,0,0,0.6)] transition-all select-none" dir="rtl">
      {/* Primary Top Bar */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* RIGHT SECTION: Brand, Logo & Owner Badge */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink">
          <button
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 sm:gap-3 text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-xl p-1 cursor-pointer group min-w-0"
            title={`الانتقال للرئيسية - ${serverName}`}
          >
            <WhiteKingdomLogo size="sm" logoUrl={logoUrl} serverName={serverName} glow={false} />
            <div className="flex flex-col text-right min-w-0">
              <span className="font-heading font-extrabold text-sm sm:text-base lg:text-lg text-white group-hover:text-cyan-300 transition-colors leading-tight truncate">
                {serverName}
              </span>
              {ownerName && (
                <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 text-[10px] sm:text-[11px] text-cyan-400 font-medium truncate">
                  {ownerAvatar ? (
                    <img
                      src={ownerAvatar}
                      alt={ownerName}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-cyan-400/60 object-cover shadow-[0_0_8px_rgba(0,229,255,0.4)] flex-shrink-0"
                    />
                  ) : (
                    <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  )}
                  <span className="text-slate-400 text-[10px] hidden sm:inline">المالك:</span>
                  <span className="text-cyan-300 font-bold hover:underline truncate">@{ownerName}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono hidden xl:inline-block flex-shrink-0">👑 مؤسس</span>
                </div>
              )}
            </div>
          </button>
        </div>

        {/* CENTER SECTION: Desktop Navigation Links (Visible on lg, xl screens) */}
        <nav aria-label="التنقل الرئيسي" className="hidden lg:flex items-center gap-1 xl:gap-2 flex-shrink-0">
          {navLinks.map((link) => {
            const active = isLinkActive(link);
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`relative h-10 lg:h-11 px-2.5 xl:px-4 rounded-xl text-xs xl:text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer flex items-center gap-1.5 xl:gap-2 justify-center text-center whitespace-nowrap select-none backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  active
                    ? 'glow-btn text-cyan-200 bg-gradient-to-b from-cyan-500/20 to-slate-900/80 font-bold'
                    : 'border-t-2 border-cyan-500/20 border-x-0 border-b-0 text-slate-300 bg-slate-900/50 hover:text-white hover:border-cyan-400/50 hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-cyan-300' : 'text-slate-400'}`} />
                <span>{link.label}</span>
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#00e5ff]" />
                )}
              </button>
            );
          })}

          {/* Admin Panel button - Visible ONLY for verified administrator */}
          {user?.isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className={`glow-btn h-10 lg:h-11 px-3 xl:px-4 rounded-xl text-xs font-mono font-bold tracking-wider transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap select-none backdrop-blur-md focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                activePage === 'admin'
                  ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-cyan-400 text-white font-bold shadow-[0_0_20px_rgba(0,229,255,0.45)]'
                  : 'bg-cyan-950/70 text-cyan-300 hover:bg-cyan-900/80 hover:text-white'
              }`}
              title="لوحة تحكم وإدارة السيرفر"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>لوحة الإدارة</span>
            </button>
          )}
        </nav>

        {/* LEFT SECTION: User Authentication & Discord Link (Visible on all screens) */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Discord Server Link (Desktop & Tablet) with dedicated animated perimeter & responsive click feedback */}
          <a
            href={targetDiscordUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOpenDiscord}
            className="btn-join-server hidden sm:inline-flex h-9 lg:h-10 px-3 lg:px-4 rounded-xl text-xs font-bold items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap select-none"
            title="انضم إلى سيرفر ديسكورد الرسمي"
          >
            <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span>انضمام</span>
          </a>

          {/* User Profile Trigger or Login Button (Always Visible) */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="glow-btn h-9 sm:h-10 flex items-center gap-2 p-1 pl-2.5 sm:pl-3 rounded-full bg-slate-900/90 border border-slate-700/70 hover:border-cyan-400 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-cyan-400"
                aria-label="قائمة حساب المستخدم"
              >
                <img
                  src={user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                  alt={user.username}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-cyan-400/60 object-cover"
                />
                <div className="text-right leading-tight max-w-[85px] sm:max-w-[120px] hidden xs:block">
                  <div className="text-xs font-bold text-white group-hover:text-cyan-300 flex items-center gap-1 truncate">
                    <span className="truncate">{user.globalName || user.username}</span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300 transition-transform" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute left-0 sm:left-0 right-auto mt-2 w-72 max-w-[calc(100vw-1.5rem)] max-h-[85vh] overflow-y-auto glow-window rounded-2xl shadow-2xl py-2 z-50 text-right animate-in fade-in zoom-in-95 duration-150"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2.5 border-b border-slate-800">
                    <p className="text-[11px] text-slate-400">حساب ديسكورد المسجل</p>
                    <p className="text-sm font-bold text-white truncate">{user.username}</p>
                    <p className="text-[11px] font-mono text-cyan-400 mt-0.5 break-all" dir="ltr">ID: {user.discordId}</p>
                  </div>

                  <button
                    onClick={onOpenProfile}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-white hover:bg-cyan-500/15 hover:text-cyan-300 transition-colors text-right font-semibold cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>عرض ملفي الشخصي والتقييم</span>
                  </button>

                  {user.isAdmin && (
                    <button
                      onClick={() => onNavigate('admin')}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-cyan-300 hover:bg-cyan-500/20 transition-colors text-right font-semibold cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5 text-cyan-400" />
                      <span>فتح لوحة الإدارة</span>
                    </button>
                  )}

                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-400 hover:bg-red-950/30 transition-colors text-right font-medium cursor-pointer border-t border-slate-800/80 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="glow-btn h-9 sm:h-10 px-3 sm:px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,229,255,0.25)] transition-all cursor-pointer whitespace-nowrap focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <svg className="w-3.5 h-3.5 fill-current flex-shrink-0" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>تسجيل الدخول</span>
            </button>
          )}

          {/* Hamburger toggle for mobile & tablet devices */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/40 transition-colors cursor-pointer"
            aria-label="القائمة الرئيسية"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-cyan-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* SECONDARY MOBILE BAR (Guarantees navigation buttons are always visible on mobile & tablet screens) */}
      <div className="lg:hidden border-t border-cyan-500/10 bg-[#060913]/95 px-2 py-1.5 overflow-x-auto no-scrollbar flex items-center justify-around gap-1">
        {navLinks.map((link) => {
          const active = isLinkActive(link);
          const Icon = link.icon;
          return (
            <button
              key={link.id}
              onClick={() => {
                onNavigate(link.id);
                setMobileMenuOpen(false);
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold flex flex-col items-center justify-center gap-0.5 transition-colors whitespace-nowrap cursor-pointer ${
                active
                  ? 'text-cyan-300 bg-cyan-500/15 border-t-2 border-cyan-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{link.label}</span>
            </button>
          );
        })}
        {user?.isAdmin && (
          <button
            onClick={() => {
              onNavigate('admin');
              setMobileMenuOpen(false);
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold flex flex-col items-center justify-center gap-0.5 transition-colors whitespace-nowrap cursor-pointer ${
              activePage === 'admin'
                ? 'text-white bg-gradient-to-r from-blue-600 via-cyan-500 to-cyan-400 font-bold border-t-2 border-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>الإدارة</span>
          </button>
        )}
      </div>

      {/* MOBILE DRAWER (For full expanded options on phones and tablets) */}
      {mobileMenuOpen && (
        <div className="lg:hidden glass-panel border-t border-cyan-500/20 px-5 pt-4 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200 text-right">
          {/* User Status Card */}
          {user && (
            <button
              onClick={() => {
                onOpenProfile();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md text-right hover:border-cyan-400/50 transition-colors cursor-pointer"
            >
              <img
                src={user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                alt={user.username}
                className="w-10 h-10 rounded-full border border-cyan-500/50 object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-sm truncate flex items-center gap-1.5">
                  <span>{user.globalName || user.username}</span>
                  {user.isAdmin && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">أدمن</span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-cyan-400 truncate" dir="ltr">ID: {user.discordId}</div>
              </div>
              <span className="text-xs text-cyan-400 font-semibold">عرض الملف ←</span>
            </button>
          )}

          {/* Navigation Items */}
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const active = isLinkActive(link);
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    onNavigate(link.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between h-12 px-4 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    active
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,229,255,0.2)] font-bold'
                      : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800/80 hover:text-white border border-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{link.label}</span>
                  </div>
                  {active && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00e5ff]" />
                  )}
                </button>
              );
            })}

            {user?.isAdmin && (
              <button
                onClick={() => {
                  onNavigate('admin');
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between h-12 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer mt-1 ${
                  activePage === 'admin'
                    ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-cyan-400 text-white font-bold border border-cyan-300 shadow-[0_0_20px_rgba(0,229,255,0.45)]'
                    : 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4" />
                  <span>لوحة الإدارة</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-200 font-mono">ADMIN</span>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
            <a
              href={targetDiscordUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                setMobileMenuOpen(false);
                handleOpenDiscord(e);
              }}
              className="btn-join-server w-full h-11 flex items-center justify-center gap-2 px-4 rounded-xl text-xs font-bold cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span>انضم إلى سيرفر ديسكورد الرسمي</span>
            </a>

            {user ? (
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full h-11 flex items-center justify-center gap-2 px-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-semibold hover:bg-red-900/50 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>تسجيل الخروج</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onOpenLogin();
                  setMobileMenuOpen(false);
                }}
                className="w-full h-11 rounded-xl font-heading font-bold text-xs bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all cursor-pointer"
              >
                <span>تسجيل الدخول عبر ديسكورد</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
