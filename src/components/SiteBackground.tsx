import React from 'react';
import Scanner from './Scanner.js';

export const SiteBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Base deep space background */}
      <div className="absolute inset-0 bg-[#060913]" />

      {/* Interactive WebGL Scanner from React Bits */}
      <div className="absolute inset-0">
        <Scanner
          color1="#08183a"
          color2="#00e5ff"
          color3="#ffffff"
          speed={0.35}
          sweepSpeed={0.22}
          sweepWidth={1.8}
          trail={0.7}
          ripple={0.16}
          bandDensity={12}
          lineWidth={1.1}
          glow={0.55}
          scanDirection="vertical"
          colorSpread={0.3}
          vignette={0.35}
          scanline={true}
          scanlineIntensity={0.28}
          grain={true}
          grainIntensity={0.025}
          mouseInteraction={true}
          mouseRadius={0.55}
          mouseStrength={0.75}
          clickEffect="ping"
          opacity={0.88}
          intro={true}
          className="w-full h-full"
        />
      </div>

      {/* Atmospheric radial accents */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background: `
            radial-gradient(circle 800px at 20% 15%, rgba(0, 229, 255, 0.07) 0%, transparent 65%),
            radial-gradient(circle 750px at 80% 25%, rgba(37, 99, 235, 0.08) 0%, transparent 70%),
            radial-gradient(circle 900px at 50% 85%, rgba(0, 229, 255, 0.04) 0%, transparent 75%)
          `,
        }}
      />
    </div>
  );
};

export default SiteBackground;
