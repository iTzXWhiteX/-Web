import React from 'react';

interface WhiteKingdomLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero' | 'bg';
  logoUrl?: string;
  serverName?: string;
  showText?: boolean;
  glow?: boolean;
}

export const WhiteKingdomLogo: React.FC<WhiteKingdomLogoProps> = ({
  className = '',
  size = 'md',
  logoUrl = '/logo.png',
  serverName = '𝑾𝒉𝒊𝒕𝒆 𝑲𝒊𝒏𝒈𝒅𝒐𝒎',
  showText = false,
  glow = true,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
    hero: 'w-40 h-40 md:w-52 md:h-52',
    bg: 'w-[400px] h-[400px] md:w-[600px] md:h-[600px]',
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div className={`relative ${sizeClasses} flex-shrink-0 transition-transform duration-300`}>
        {glow && (
          <div
            className="absolute inset-0 rounded-3xl bg-cyan-500/25 blur-xl pointer-events-none"
            aria-hidden="true"
          />
        )}
        <img
          src={logoUrl || '/logo.png'}
          alt={`${serverName} Discord Server Logo`}
          className="relative w-full h-full object-contain rounded-2xl drop-shadow-[0_4px_20px_rgba(0,180,255,0.35)]"
          loading="eager"
        />
      </div>

      {showText && (
        <span className="font-heading font-extrabold text-xl md:text-2xl tracking-wide text-white drop-shadow-[0_2px_10px_rgba(0,229,255,0.3)]">
          {serverName}
        </span>
      )}
    </div>
  );
};

export const AmbientBackgroundLogo: React.FC<{ logoUrl?: string }> = ({ logoUrl = '/logo.png' }) => {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center select-none"
      aria-hidden="true"
    >
      {/* High-Performance Ambient Aurora Gradients (Single GPU pass, eliminating Gaussian blur raster churn & device lag) */}
      <div
        className="absolute inset-0 opacity-75 transition-opacity duration-1000"
        style={{
          background: `
            radial-gradient(circle 550px at 15% 15%, rgba(0, 229, 255, 0.12) 0%, transparent 70%),
            radial-gradient(circle 600px at 85% 85%, rgba(37, 99, 235, 0.14) 0%, transparent 70%),
            radial-gradient(circle 420px at 50% 45%, rgba(255, 255, 255, 0.035) 0%, transparent 65%)
          `,
          transform: 'translateZ(0)',
        }}
      />

      {/* Uploaded Server Logo as soft atmospheric community background */}
      <div className="relative w-[450px] h-[450px] md:w-[700px] md:h-[700px] opacity-[0.04] transition-opacity duration-1000">
        <img
          src={logoUrl || '/logo.png'}
          alt=""
          className="w-full h-full object-contain"
          loading="eager"
        />
      </div>
    </div>
  );
};
