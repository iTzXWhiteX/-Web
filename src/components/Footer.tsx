import React from 'react';
import { Shield } from 'lucide-react';
import { WhiteKingdomLogo } from './WhiteKingdomLogo.js';

interface FooterProps {
  serverName: string;
  logoUrl: string;
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ serverName, logoUrl, onNavigate }) => {
  return (
    <footer className="relative z-10 border-t border-cyan-500/15 bg-[#050813] py-8 text-slate-400 select-none" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo and Server Name */}
          <div className="flex items-center gap-3">
            <WhiteKingdomLogo size="sm" logoUrl={logoUrl} serverName={serverName} glow={false} />
            <span className="font-heading font-bold text-white text-sm sm:text-base">
              {serverName}
            </span>
          </div>

          {/* Navigation Links in Arabic */}
          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-7 text-xs font-semibold text-slate-300">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-cyan-300 transition-colors cursor-pointer"
            >
              الرئيسية
            </button>
            <button
              onClick={() => onNavigate('server')}
              className="hover:text-cyan-300 transition-colors cursor-pointer"
            >
              السيرفر
            </button>
            <button
              onClick={() => onNavigate('tier-test')}
              className="hover:text-cyan-300 transition-colors cursor-pointer"
            >
              اختبار المستويات
            </button>
            <button
              onClick={() => onNavigate('leaderboard')}
              className="hover:text-cyan-300 transition-colors cursor-pointer"
            >
              قائمة المتصدرين
            </button>
          </div>

          {/* Copyright & Discreet Admin Link */}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>&copy; {new Date().getFullYear()} {serverName}. جميع الحقوق محفوظة.</span>
            <button
              onClick={() => onNavigate('admin')}
              className="text-slate-600 hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer p-1"
              title="لوحة الإدارة"
            >
              <Shield className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
