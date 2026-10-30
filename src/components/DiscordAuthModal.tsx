import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Check, Copy, Shield, UserCheck, AlertCircle, LogIn } from 'lucide-react';
import { UserProfile } from '../types/pvp.js';

interface DiscordAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const DiscordAuthModal: React.FC<DiscordAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'oauth' | 'dev'>('oauth');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [config, setConfig] = useState<{
    configured: boolean;
    url?: string;
    redirectUri: string;
    guide?: any;
  } | null>(null);

  // Dev login inputs
  const [customDiscordId, setCustomDiscordId] = useState('');
  const [customUsername, setCustomUsername] = useState('');
  const [loginAsAdmin, setLoginAsAdmin] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      fetch('/api/auth/discord/url')
        .then(res => res.json())
        .then(data => {
          setConfig(data);
          if (!data.configured) {
            // Default to dev login view if credentials aren't set in environment
            setActiveTab('dev');
          }
        })
        .catch(err => {
          console.error('Failed to query OAuth status:', err);
        });
    }
  }, [isOpen]);

  // Listen for OAuth postMessage from popup as specified in oauth-integration skill
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        if (event.data.token) {
          localStorage.setItem('wk_token', event.data.token);
        }
        if (event.data.user) {
          onLoginSuccess(event.data.user);
          onClose();
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLoginSuccess, onClose]);

  if (!isOpen) return null;

  const handleCopyRedirectUri = () => {
    if (!config?.redirectUri) return;
    navigator.clipboard.writeText(config.redirectUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOfficialDiscordOAuth = () => {
    if (!config?.configured || !config.url) {
      setActiveTab('dev');
      return;
    }

    const width = 580;
    const height = 750;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      config.url,
      'discord_oauth_popup',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=yes,status=yes`
    );

    if (!popup) {
      setErrorMessage('Popup was blocked by your browser. Please allow popups for White Kingdom to authenticate.');
    }
  };

  const handleDevLogin = async (presetId?: string, presetName?: string, presetAdmin?: boolean) => {
    const idToUse = presetId || customDiscordId;
    const nameToUse = presetName || customUsername;
    const adminFlag = presetAdmin !== undefined ? presetAdmin : loginAsAdmin;

    if (!idToUse.trim()) {
      setErrorMessage('Please enter a Discord User ID.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discordId: idToUse.trim(),
          username: nameToUse.trim() || undefined,
          asAdmin: adminFlag,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      if (data.token) {
        localStorage.setItem('wk_token', data.token);
      }
      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Login error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl glass-panel rounded-3xl border border-cyan-500/30 p-6 md:p-8 shadow-[0_0_50px_rgba(0,229,255,0.2)] text-right">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="إغلاق النافذة"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex-shrink-0">
            <LogIn className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-heading font-extrabold text-white tracking-wide">
              تسجيل الدخول عبر ديسكورد
            </h3>
            <p className="text-xs md:text-sm text-slate-400">
              قم بربط حساب ديسكورد الخاص بك للتحقق من هويتك وصلاحياتك في مجتمع 𝑾𝒉𝒊𝒕𝒆 𝑲𝒊𝒏𝒈𝒅𝒐𝒎
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs md:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex rounded-xl bg-slate-900/80 p-1 mb-6 border border-slate-800">
          <button
            onClick={() => setActiveTab('oauth')}
            className={`flex-1 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'oauth'
                ? 'bg-cyan-500 text-black font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            تسجيل الدخول الرسمي (Discord OAuth2)
          </button>
          <button
            onClick={() => setActiveTab('dev')}
            className={`flex-1 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'dev'
                ? 'bg-cyan-500 text-black font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            الدخول التجريبي / السريع
          </button>
        </div>

        {activeTab === 'oauth' ? (
          <div className="space-y-4">
            {config?.configured ? (
              <div className="text-center py-4 space-y-4">
                <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs md:text-sm">
                  خدمة Discord OAuth2 مفعّلة وجاهزة! بالضغط أدناه ستفتح نافذة تسجيل الدخول الرسمية من ديسكورد.
                </div>

                <button
                  onClick={handleOfficialDiscordOAuth}
                  className="w-full py-3.5 px-6 rounded-2xl font-heading font-bold text-base bg-[#5865F2] hover:bg-[#4752C4] text-white flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(88,101,242,0.4)] transition-all cursor-pointer"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  <span>تسجيل الدخول عبر ديسكورد</span>
                  <ExternalLink className="w-4 h-4 mr-1 opacity-80" />
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs md:text-sm">
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200">
                  <div className="font-bold mb-1 flex items-center gap-1.5 text-amber-300">
                    <AlertCircle className="w-4 h-4" />
                    <span>مفاتيح Discord OAuth لم تضبط بعد في البيئة</span>
                  </div>
                  لتفعيل التسجيل المباشر من ديسكورد، يرجى ضبط المفاتيح في إعدادات البيئة. يمكنك استخدام تبويب <strong>الدخول التجريبي / السريع</strong> لتجربة الموقع وتصفح لوحة الإدارة فوراً!
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="font-bold text-slate-200">إعدادات Discord Developer Portal:</div>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                    <li>أنشئ تطبيقاً في <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">discord.com/developers</a></li>
                    <li>في قائمة <strong>OAuth2 &gt; General</strong>، أضف رابط الـ Redirect URI التالي:</li>
                  </ol>

                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/60 border border-slate-700 font-mono text-[11px] text-cyan-300 overflow-x-auto" dir="ltr">
                    <span className="truncate flex-1">{config?.redirectUri}</span>
                    <button
                      onClick={handleCopyRedirectUri}
                      className="px-3 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 font-sans text-xs flex items-center gap-1 transition-colors flex-shrink-0 cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                  </div>

                  <p className="text-slate-400 text-xs">
                    ضع <code className="text-cyan-300 font-mono" dir="ltr">DISCORD_CLIENT_ID</code> و <code className="text-cyan-300 font-mono" dir="ltr">DISCORD_CLIENT_SECRET</code> في المتغيرات السرية.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs md:text-sm text-slate-300">
              اختر أحد الحسابات السريعة أدناه أو أدخل معرّف ديسكورد (18 رقماً) للتسجيل فوراً:
            </p>

            {/* Quick Preset Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleDevLogin('1324725244073873539', 'itz_white_kh', true)}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-400 hover:border-cyan-300 hover:bg-cyan-950/40 text-right transition-all flex items-center gap-3 cursor-pointer group shadow-[0_0_15px_rgba(0,229,255,0.2)] md:col-span-2"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 flex-shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-white group-hover:text-cyan-300 flex items-center gap-1.5">
                    <span>ᎳᎻᏆᎿᎬ ᏚᎪᎷᎪ (itz_white_kh)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/30 text-cyan-300 font-mono font-bold">صاحب السيرفر (Owner & Admin)</span>
                  </div>
                  <div className="text-[11px] font-mono text-cyan-400/80" dir="ltr">1324725244073873539</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDevLogin('184719284719284719', 'WhiteKnight', true)}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-950/30 text-right transition-all flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 flex-shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-cyan-300 flex items-center gap-1.5">
                    <span>WhiteKnight</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">مدير (ADMIN)</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400" dir="ltr">184719284719284719</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDevLogin('482910482910482910', 'VortexPvP', false)}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-400 hover:bg-blue-950/30 text-right transition-all flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400 flex items-center justify-center text-blue-300 flex-shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-blue-300 flex items-center gap-1.5">
                    <span>VortexPvP</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono">HT1</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400" dir="ltr">482910482910482910</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDevLogin('819203810293819201', 'FrostByte', false)}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-400 hover:bg-sky-950/30 text-right transition-all flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-300 flex-shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-sky-300 flex items-center gap-1.5">
                    <span>FrostByte</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono">HT1</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400" dir="ltr">819203810293819201</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDevLogin('999888777666555444', 'NewPlayer', false)}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-950/30 text-right transition-all flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 flex-shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300 flex items-center gap-1.5">
                    <span>لاعب جديد (عضو عادي)</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400" dir="ltr">999888777666555444</div>
                </div>
              </button>
            </div>

            {/* Custom Input Form */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="text-xs font-semibold text-slate-300">أو سجل الدخول بمعرّف ديسكورد مخصص:</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">معرّف ديسكورد (17-20 رقماً):</label>
                  <input
                    type="text"
                    value={customDiscordId}
                    onChange={e => setCustomDiscordId(e.target.value)}
                    placeholder="مثال: 529183920194829103"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-slate-700 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">اسم المستخدم في ديسكورد (اختياري):</label>
                  <input
                    type="text"
                    value={customUsername}
                    onChange={e => setCustomUsername(e.target.value)}
                    placeholder="مثال: ShadowPvP"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="adminCheckbox"
                  checked={loginAsAdmin}
                  onChange={e => setLoginAsAdmin(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="adminCheckbox" className="text-xs text-slate-300 cursor-pointer">
                  منح صلاحيات الإدارة (Admin / Staff)
                </label>
              </div>

              <button
                type="button"
                onClick={() => handleDevLogin()}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 font-heading font-bold text-xs tracking-wider text-black shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'جاري التحقق...' : 'تسجيل الدخول بالحساب'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
