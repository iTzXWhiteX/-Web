/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { DiscordAuthModal } from './components/DiscordAuthModal.js';
import { AmbientBackgroundLogo } from './components/WhiteKingdomLogo.js';
import { HomePage } from './pages/HomePage.js';
import { AboutPage } from './pages/AboutPage.js';
import { TierTestPage } from './pages/TierTestPage.js';
import { LeaderboardPage } from './pages/LeaderboardPage.js';
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';
import { NewsPage } from './pages/NewsPage.js';
import {
  UserProfile,
  WebsiteSettings,
  TestServer,
  PublicLeaderboardItem,
  NewsArticle,
  ServerRole,
} from './types/pvp.js';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activePage, setActivePage] = useState<string>('home');
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Dynamic Content & Settings
  const [settings, setSettings] = useState<WebsiteSettings>({
    serverName: '𝑾𝒉𝒊𝒕𝒆 𝑲𝒊𝒏𝒈𝒅𝒐𝒎',
    logoUrl: '/logo.png',
    youtubeUrl: 'https://www.youtube.com/@WhiteKingdom',
    aboutContent: '',
    tierTestContent: '',
    newsContent: '',
    welcomeBadgeText: 'المجتمع التنافسي الرسمي 2026',
  });
  const [testServers, setTestServers] = useState<TestServer[]>([]);
  const [leaderboard, setLeaderboard] = useState<PublicLeaderboardItem[]>([]);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [roles, setRoles] = useState<ServerRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Public Data
  const fetchPublicData = useCallback(async () => {
    try {
      const res = await fetch('/api/public-data');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        if (data.testServers) setTestServers(data.testServers);
        if (data.leaderboard) setLeaderboard(data.leaderboard);
        if (data.newsArticles) setNewsArticles(data.newsArticles);
        if (data.roles) setRoles(data.roles);
      }
    } catch (err) {
      console.error('Error fetching public data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Auth Session
  const fetchSession = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('wk_token');
      const headers: HeadersInit = {};
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }
      const res = await fetch('/api/auth/session', { headers });
      const data = await res.json();
      if (data.authenticated && data.user) {
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Session fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchSession();
    fetchPublicData();
  }, [fetchSession, fetchPublicData]);

  // Handle Hash routing for clean, persistent navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim().toLowerCase();
      if (!hash || hash === 'home') {
        setActivePage('home');
      } else if (hash === 'about') {
        setActivePage('about');
      } else if (hash === 'tier-test' || hash === 'tiertest' || hash === 'tiers') {
        setActivePage('tier-test');
      } else if (hash === 'leaderboard') {
        setActivePage('leaderboard');
      } else if (hash === 'news') {
        setActivePage('news');
      } else if (hash === 'admin') {
        setActivePage('admin');
      } else {
        setActivePage('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (page: string) => {
    setActivePage(page);
    if (page === 'home') {
      window.location.hash = '';
    } else {
      window.location.hash = `#${page}`;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('wk_token');
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      if (activePage === 'admin') {
        navigateTo('home');
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    fetchPublicData();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-slate-100 relative selection:bg-cyan-500 selection:text-black">
      {/* Uploaded Server Logo Ambient Background Atmosphere */}
      <AmbientBackgroundLogo logoUrl={settings.logoUrl} />

      {/* Main Navbar */}
      <Navbar
        user={currentUser}
        serverName={settings.serverName}
        logoUrl={settings.logoUrl}
        ownerName={settings.ownerName}
        ownerAvatar={settings.ownerAvatar}
        ownerTag={settings.ownerTag}
        discordInviteUrl={settings.discordInviteUrl}
        activePage={activePage}
        onNavigate={navigateTo}
        onOpenLogin={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        {loading ? (
          <div className="min-h-[60vh] flex items-center justify-center text-slate-400 text-sm" dir="rtl">
            جاري التحميل...
          </div>
        ) : (
          <>
            {activePage === 'home' && (
              <HomePage
                serverName={settings.serverName}
                logoUrl={settings.logoUrl}
                youtubeUrl={settings.youtubeUrl}
                discordInviteUrl={settings.discordInviteUrl}
                ownerName={settings.ownerName}
                ownerAvatar={settings.ownerAvatar}
                ownerTag={settings.ownerTag}
                welcomeBadgeText={settings.welcomeBadgeText}
                onNavigate={navigateTo}
              />
            )}

            {activePage === 'about' && (
              <AboutPage
                serverName={settings.serverName}
                logoUrl={settings.logoUrl}
                content={settings.aboutContent}
                onNavigate={navigateTo}
              />
            )}

            {activePage === 'tier-test' && (
              <TierTestPage
                content={settings.tierTestContent}
                testServers={testServers}
                onNavigate={navigateTo}
              />
            )}

            {activePage === 'leaderboard' && (
              <LeaderboardPage
                leaderboard={leaderboard}
                onNavigate={navigateTo}
              />
            )}

            {activePage === 'news' && (
              <NewsPage
                newsArticles={newsArticles}
                roles={roles}
                content={settings.newsContent}
                onNavigate={navigateTo}
              />
            )}

            {activePage === 'admin' && (
              currentUser?.isAdmin ? (
                <AdminDashboardPage
                  user={currentUser}
                  onRefreshPublicData={fetchPublicData}
                  onNavigate={navigateTo}
                />
              ) : (
                <div className="max-w-md mx-auto my-24 p-8 glass-panel rounded-3xl text-center border border-red-500/30 space-y-5 animate-in fade-in duration-300" dir="rtl">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-xl text-white">مطلوب صلاحيات الإدارة</h2>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                      هذه الصفحة ولوحة التحكم مخصصة فقط لمدير السيرفر المصرح له. يرجى تسجيل الدخول بحساب ديسكورد معتمد.
                    </p>
                  </div>
                  <button
                    onClick={() => setLoginModalOpen(true)}
                    className="w-full py-3 rounded-xl font-heading font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg cursor-pointer"
                  >
                    تسجيل الدخول بحساب ديسكورد معتمد
                  </button>
                </div>
              )
            )}
          </>
        )}
      </main>

      {/* Global Discord Auth Modal */}
      <DiscordAuthModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Minimal Footer */}
      <Footer
        serverName={settings.serverName}
        logoUrl={settings.logoUrl}
        onNavigate={navigateTo}
      />
    </div>
  );
}
