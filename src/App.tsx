/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Shield } from 'lucide-react';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { DiscordAuthModal } from './components/DiscordAuthModal.js';
import { SiteBackground } from './components/SiteBackground.js';
import { HomePage } from './pages/HomePage.js';
import { ServerPage } from './pages/ServerPage.js';
import { AboutPage } from './pages/AboutPage.js';
import { TierTestPage } from './pages/TierTestPage.js';
import { LeaderboardPage } from './pages/LeaderboardPage.js';
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';
import { NewsPage } from './pages/NewsPage.js';
import { UserAccountSidebar } from './components/UserAccountSidebar.js';
import { UserProfileModal } from './components/UserProfileModal.js';
import {
  UserProfile,
  WebsiteSettings,
  TestServer,
  PublicLeaderboardItem,
  NewsArticle,
  ServerRole,
  TierDefinition,
  WHITE_KINGDOM_TIERS,
  TierTester,
} from './types/pvp.js';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activePage, setActivePage] = useState<string>('home');
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

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
  const [testers, setTesters] = useState<TierTester[]>([]);
  const [leaderboard, setLeaderboard] = useState<PublicLeaderboardItem[]>([]);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [roles, setRoles] = useState<ServerRole[]>([]);
  const [tiers, setTiers] = useState<TierDefinition[]>(WHITE_KINGDOM_TIERS);
  const [loading, setLoading] = useState(true);

  // Fetch Public Data
  const fetchPublicData = useCallback(async () => {
    try {
      const res = await fetch('/api/public-data');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        if (data.testServers) setTestServers(data.testServers);
        if (data.testers) setTesters(data.testers);
        if (data.leaderboard) setLeaderboard(data.leaderboard);
        if (data.newsArticles) setNewsArticles(data.newsArticles);
        if (data.roles) setRoles(data.roles);
        if (data.tiers) setTiers(data.tiers);
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

  // Handle both URL pathname and hash routing for clean navigation and SEO crawlers
  useEffect(() => {
    const syncRouteFromLocation = () => {
      const hash = window.location.hash.replace('#', '').trim().toLowerCase();
      const pathSegment = window.location.pathname.replace(/^\/+/, '').split('/')[0]?.toLowerCase();
      const route = hash || pathSegment;

      if (!route || route === 'home') {
        setActivePage('home');
      } else if (route === 'server' || route === 'about' || route === 'news') {
        setActivePage('server');
      } else if (route === 'tier-test' || route === 'tiertest' || route === 'tiers') {
        setActivePage('tier-test');
      } else if (route === 'leaderboard') {
        setActivePage('leaderboard');
      } else if (route === 'admin') {
        setActivePage('admin');
      } else {
        setActivePage('home');
      }
    };

    window.addEventListener('hashchange', syncRouteFromLocation);
    window.addEventListener('popstate', syncRouteFromLocation);
    syncRouteFromLocation();
    return () => {
      window.removeEventListener('hashchange', syncRouteFromLocation);
      window.removeEventListener('popstate', syncRouteFromLocation);
    };
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

  const handleQuickAdminLogin = async () => {
    try {
      const res = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discordId: settings.ownerDiscordId || '184719284719284719',
          username: settings.ownerName || 'WhiteKnight',
          asAdmin: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('wk_token', data.token);
        }
        if (data.user) {
          setCurrentUser(data.user);
        }
        await fetchSession();
      }
    } catch (err) {
      console.error('Quick admin login error:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-slate-100 relative selection:bg-cyan-500 selection:text-black">
      {/* High-Performance Modern Site Background */}
      <SiteBackground />

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
        onOpenProfile={() => setProfileModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        {loading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400 text-sm" dir="rtl">
            <div className="w-10 h-10 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin shadow-[0_0_15px_rgba(0,229,255,0.3)]" />
            <span className="text-xs font-semibold text-cyan-300/80 font-mono tracking-wider">جاري تحميل بيانات مجتمع White Kingdom...</span>
          </div>
        ) : activePage === 'admin' ? (
          currentUser?.isAdmin ? (
            <AdminDashboardPage
              user={currentUser}
              tiers={tiers}
              testers={testers}
              initialSettings={settings}
              onRefreshPublicData={fetchPublicData}
              onNavigate={navigateTo}
            />
          ) : (
            <div className="max-w-lg mx-auto my-20 p-8 glow-window rounded-3xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300" dir="rtl">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(0,229,255,0.3)]">
                <Shield className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h2 className="font-heading font-extrabold text-2xl text-white">لوحة تحكم إدارة السيرفر</h2>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  هذه اللوحة مخصصة لإدارة إعدادات السيرفر، رولات ديسكورد، مختبري المستويات، تقييمات اللاعبين، وسجل تسجيل الدخول.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="glow-btn w-full py-3.5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-blue-600 via-cyan-500 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-white shadow-lg cursor-pointer"
                >
                  تسجيل الدخول بحساب ديسكورد الرسمي
                </button>

                <button
                  onClick={handleQuickAdminLogin}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 transition-all cursor-pointer"
                  title="دخول مباشر بصلاحيات مدير السيرفر للتجربة والإدارة"
                >
                  دخول مباشر كمسؤول السيرفر (WhiteKnight)
                </button>
              </div>
            </div>
          )
        ) : (
          /* Gaming Community Dashboard Layout: Page Content (Center/Right) + User Account Panel on Home Page only (LEFT in RTL) */
          <div className={`max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-5 sm:py-7 ${activePage === 'home' ? 'flex flex-col lg:flex-row gap-6 lg:gap-8 items-start' : 'w-full'}`} dir="rtl">
            {/* Center / Main Content View */}
            <div className={`w-full ${activePage === 'home' ? 'flex-1 min-w-0 order-1' : ''}`}>
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

              {(activePage === 'server' || activePage === 'about' || activePage === 'news') && (
                <ServerPage
                  serverName={settings.serverName}
                  logoUrl={settings.logoUrl}
                  aboutContent={settings.aboutContent}
                  newsContent={settings.newsContent}
                  newsArticles={newsArticles}
                  roles={roles}
                  onNavigate={navigateTo}
                />
              )}

              {activePage === 'tier-test' && (
                <TierTestPage
                  content={settings.tierTestContent}
                  testServers={testServers}
                  testers={testers}
                  tiers={tiers}
                  onNavigate={navigateTo}
                />
              )}

              {activePage === 'leaderboard' && (
                <LeaderboardPage
                  leaderboard={leaderboard}
                  tiers={tiers}
                  onNavigate={navigateTo}
                />
              )}
            </div>

            {/* User Account Sidebar Area on the LEFT (in RTL layout) - Displayed ONLY on the Home Page */}
            {activePage === 'home' && (
              <div className="order-2 lg:order-2 w-full lg:w-auto">
                <UserAccountSidebar
                  user={currentUser}
                  allRoles={roles}
                  allTiers={tiers}
                  onOpenProfile={() => setProfileModalOpen(true)}
                  onOpenLogin={() => setLoginModalOpen(true)}
                  onLogout={handleLogout}
                  onNavigateToAdmin={() => navigateTo('admin')}
                  onNavigateToTierTest={() => navigateTo('tier-test')}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Global Discord Auth Modal */}
      <DiscordAuthModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* User Profile View Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={currentUser}
        allRoles={roles}
        allTiers={tiers}
        onLogout={handleLogout}
        onNavigateToAdmin={() => navigateTo('admin')}
        onNavigateToTierTest={() => navigateTo('tier-test')}
        onUserUpdate={(updated) => setCurrentUser(updated)}
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
