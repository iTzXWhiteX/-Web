import React from 'react';

interface TierBadgeProps {
  tier: string;
  rank?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showCrown?: boolean;
}

export const TierBadge: React.FC<TierBadgeProps> = ({
  tier,
  rank,
  size = 'md',
  className = '',
  showCrown = false,
}) => {
  const normalized = tier.toUpperCase().trim();
  const isHT1 = normalized === 'HT1' || normalized.includes('TIER 1') || normalized.includes('HIGH TIER 1');
  const isTier1 = isHT1 || normalized === 'LT1';
  const isTier2 = normalized.includes('2');
  const isTier3 = normalized.includes('3');

  // Palette selection
  let bgGradient = 'from-slate-800 to-slate-900';
  let borderColor = 'border-slate-700/60';
  let textColor = 'text-slate-300';
  let glowStyle = '';

  if (isHT1) {
    bgGradient = 'from-cyan-950/80 via-blue-900/60 to-slate-950/90';
    borderColor = 'border-cyan-400/80';
    textColor = 'text-cyan-300 font-extrabold';
    glowStyle = 'shadow-[0_0_15px_rgba(0,229,255,0.4)]';
  } else if (isTier1) {
    bgGradient = 'from-sky-950/70 to-slate-950/80';
    borderColor = 'border-sky-400/70';
    textColor = 'text-sky-300 font-bold';
    glowStyle = 'shadow-[0_0_12px_rgba(56,189,248,0.3)]';
  } else if (isTier2) {
    bgGradient = 'from-blue-950/60 to-slate-950/80';
    borderColor = 'border-blue-500/60';
    textColor = 'text-blue-300 font-bold';
    glowStyle = 'shadow-[0_0_10px_rgba(59,130,246,0.25)]';
  } else if (isTier3) {
    bgGradient = 'from-indigo-950/60 to-slate-950/80';
    borderColor = 'border-indigo-500/50';
    textColor = 'text-indigo-300 font-medium';
    glowStyle = 'shadow-[0_0_8px_rgba(99,102,241,0.2)]';
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 tracking-wider',
    md: 'text-xs px-2.5 py-1 tracking-wider',
    lg: 'text-sm px-3.5 py-1.5 tracking-widest font-bold',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-mono border uppercase backdrop-blur-md bg-gradient-to-r ${bgGradient} ${borderColor} ${textColor} ${glowStyle} ${sizeClasses} ${className}`}
    >
      {(showCrown || isHT1) && (
        <span className="text-cyan-300 text-[10px]" title="High Tier Apex">
          👑
        </span>
      )}
      <span>{tier}</span>
      {typeof rank === 'number' && rank >= 9 && size !== 'sm' && (
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
      )}
    </span>
  );
};
