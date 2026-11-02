import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Check, Copy, AlertCircle, LogIn, ShieldCheck, Sparkles } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [config, setConfig] = useState<{
    configured: boolean;
    url?: string;
    redirectUri: string;
    guide?: any;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      fetch('/api/auth/discord/url')
        .then(res => res.json())
        .then(data => {
          setConfig(data);
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
      setErrorMessage('خدمة تسجيل الدخول عبر ديسكورد غير مهيأة بعد من قبل الإدارة.');
      return;
    }

    setLoading(true);
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
      setErrorMessage('تم حظر النافذة المنبثقة من قبل المتصفح. يرجى السماح بالنوافذ المنبثقة للموقع.');
      setLoading(false);
    } else {
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          setLoading(false);
        }
      }, 500);
    }
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg glass-panel rounded-3xl border border-cyan-500/40 p-6 md:p-8 shadow-[0_0_60px_rgba(0,229,255,0.25)] text-right overflow-hidden">
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="إغلاق النافذة"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5865F2]/30 to-cyan-500/20 border border-[#5865F2]/50 flex items-center justify-center text-[#5865F2] flex-shrink-0 shadow-[0_0_20px_rgba(88,101,242,0.3)]">
            <LogIn className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-heading font-black text-white tracking-wide flex items-center gap-2">
              <span>تسجيل الدخول عبر ديسكورد</span>
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            </h3>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              طريقة التوثيق الرسمية الوحيدة والآمنة لمجتمع 𝑾𝒉𝒊𝒕𝒆 𝑲𝒊𝒏𝒈𝒅𝒐𝒎
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs md:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main OAuth Content */}
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 text-xs md:text-sm text-slate-300 space-y-2.5">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>تسجيل دخول فوري ومباشر</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              يتم ربط حسابك في ديسكورد للتحقق من هويتك ورتبك في السيرفر وتصنيفك في الـ Tier Test بشكل آمن تماماً، دون الحاجة لأي كلمات مرور أو تسجيل يدوي.
            </p>
          </div>

          {config?.configured ? (
            <div className="space-y-3 pt-2">
              <button
                onClick={handleOfficialDiscordOAuth}
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl font-heading font-bold text-base bg-[#5865F2] hover:bg-[#4752C4] active:scale-[0.99] text-white flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(88,101,242,0.45)] hover:shadow-[0_0_40px_rgba(88,101,242,0.65)] transition-all cursor-pointer disabled:opacity-60"
              >
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span>{loading ? 'جاري فتح نافذة ديسكورد...' : 'متابعة وتسجيل الدخول بحساب Discord'}</span>
                <ExternalLink className="w-4 h-4 mr-1 opacity-80" />
              </button>
              <p className="text-[11px] text-center text-slate-500">
                بالضغط على الزر، سيتم توجيهك إلى نافذة التوثيق الرسمية في سيرفرات ديسكورد
              </p>
            </div>
          ) : (
            <div className="space-y-4 text-xs md:text-sm">
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200">
                <div className="font-bold mb-1 flex items-center gap-1.5 text-amber-300">
                  <AlertCircle className="w-4 h-4" />
                  <span>مفاتيح Discord OAuth لم تضبط بعد في متغيرات البيئة</span>
                </div>
                لتفعيل التسجيل المباشر من ديسكورد، يرجى وضع <code className="font-mono text-cyan-300" dir="ltr">DISCORD_CLIENT_ID</code> و <code className="font-mono text-cyan-300" dir="ltr">DISCORD_CLIENT_SECRET</code>.
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="font-bold text-slate-200">الـ Redirect URI المطلوب إضافته في Discord Developer Portal:</div>

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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
