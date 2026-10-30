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
      {/* Subtle atmospheric ambient glows */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-cyan-600/10 blur-[140px]" />
      <div className="absolute bottom-[-10%] right-[15%] w-[600px] h-[600px] rounded-full bg-blue-800/10 blur-[150px]" />

      {/* Uploaded Server Logo as soft blurred background atmosphere */}
      <div className="relative w-[450px] h-[450px] md:w-[700px] md:h-[700px] opacity-[0.05] filter blur-[3px]">
        <img
          src={logoUrl || '/logo.png'}
          alt=""
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
};
