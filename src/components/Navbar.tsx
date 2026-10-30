import React, { useState } from 'react';
import { Shield, LogOut, Menu, X, ChevronDown, Crown } from 'lucide-react';
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
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'الرئيسية' },
    { id: 'about', label: 'عن السيرفر' },
    { id: 'tier-test', label: 'اختبار المستويات' },
    { id: 'leaderboard', label: 'قائمة المتصدرين' },
    { id: 'news', label: 'الأخبار والإعلانات' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#060913]/90 border-b border-cyan-500/20" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Logo and Server Name & Owner Info underneath */}
        <div className="flex flex-col items-start justify-center">
          <button
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 text-right focus:outline-none cursor-pointer group"
          >
            <WhiteKingdomLogo size="sm" logoUrl={logoUrl} serverName={serverName} glow={false} />
            <div className="flex flex-col text-right">
              <span className="font-heading font-extrabold text-lg sm:text-xl text-white group-hover:text-cyan-300 transition-colors">
                {serverName}
              </span>
              {ownerName && (
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-cyan-400 font-medium">
                  {ownerAvatar ? (
                    <img
                      src={ownerAvatar}
                      alt={ownerName}
                      className="w-4 h-4 rounded-full border border-cyan-400/60 object-cover shadow-[0_0_8px_rgba(0,229,255,0.4)]"
                    />
                  ) : (
                    <Crown className="w-3 h-3 text-amber-400" />
                  )}
                  <span className="text-slate-400 text-[10px]">المالك:</span>
                  <span className="text-cyan-300 font-bold hover:underline">@{ownerName}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono hidden sm:inline-block">👑 مؤسس</span>
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map(link => {
            const isActive = activePage === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                  isActive
                    ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {link.label}
              </button>
            );
          })}

          {/* Admin Panel button - Strictly visible ONLY for verified administrator */}
          {user?.isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wider transition-all mr-2 cursor-pointer ${
                activePage === 'admin'
                  ? 'bg-cyan-500 text-black border border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                  : 'bg-cyan-950/70 text-cyan-300 hover:bg-cyan-900 border border-cyan-500/40'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>لوحة الإدارة</span>
            </button>
          )}
        </nav>

        {/* Discord User Auth Section (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {discordInviteUrl && (
            <a
              href={discordInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#5865F2] hover:bg-[#4752C4] text-white flex items-center gap-1.5 shadow-[0_0_15px_rgba(88,101,242,0.35)] transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="انضمام لسيرفر ديسكورد"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>انضمام للسيرفر</span>
            </a>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pl-3 rounded-full bg-slate-900/80 border border-slate-700/60 hover:border-cyan-400 transition-all cursor-pointer group"
              >
                <img
                  src={user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                  alt={user.username}
                  className="w-8 h-8 rounded-full border border-cyan-500/50 object-cover"
                />
                <div className="text-right leading-tight">
                  <div className="text-xs font-bold text-white group-hover:text-cyan-300 flex items-center gap-1.5">
                    {user.globalName || user.username}
                    {user.isAdmin && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">أدمن</span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400" dir="ltr">
                    ID: {user.discordId}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300 transition-transform" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute left-0 mt-2 w-64 glass-panel rounded-2xl border border-cyan-500/30 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-right"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2.5 border-b border-slate-800">
                    <p className="text-[11px] text-slate-400">حساب ديسكورد المسجل</p>
                    <p className="text-sm font-bold text-white truncate">{user.username}</p>
                    <p className="text-[11px] font-mono text-cyan-400 mt-0.5 break-all" dir="ltr">ID: {user.discordId}</p>
                  </div>

                  {user.isAdmin && (
                    <button
                      onClick={() => onNavigate('admin')}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-cyan-300 hover:bg-cyan-500/20 transition-colors text-right font-semibold"
                    >
                      <Shield className="w-4 h-4 text-cyan-400" />
                      <span>فتح لوحة الإدارة</span>
                    </button>
                  )}

                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-400 hover:bg-red-950/30 transition-colors text-right font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-4 py-2 rounded-xl text-xs font-bold tracking-wider bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white flex items-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>تسجيل الدخول عبر ديسكورد</span>
            </button>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-300 hover:text-white"
            aria-label="القائمة"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-t border-cyan-500/20 px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-150 text-right">
          {user && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <img
                src={user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                alt={user.username}
                className="w-10 h-10 rounded-full border border-cyan-500/50"
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-sm truncate">{user.globalName || user.username}</div>
                <div className="text-[11px] font-mono text-cyan-400 truncate" dir="ltr">ID: {user.discordId}</div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            {navLinks.map(link => {
              const isActive = activePage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    onNavigate(link.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-900/50 text-slate-300'
                  }`}
                >
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
                className="flex items-center gap-2 p-3 rounded-xl text-sm font-bold bg-cyan-500 text-black mt-1"
              >
                <Shield className="w-4 h-4" />
                <span>لوحة الإدارة</span>
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-2">
            {discordInviteUrl && (
              <a
                href={discordInviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-bold shadow-[0_0_15px_rgba(88,101,242,0.35)]"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                <span>انضم إلى سيرفر ديسكورد</span>
              </a>
            )}

            {user ? (
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onOpenLogin();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-3 rounded-xl font-heading font-bold text-sm bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center gap-2"
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
