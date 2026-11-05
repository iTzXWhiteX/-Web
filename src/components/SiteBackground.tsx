import React from 'react';
import CursorGrid from './CursorGrid.js';

export const SiteBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Base deep space background */}
      <div className="absolute inset-0 bg-[#060913]" />

      {/* Interactive WebGL CursorGrid from React Bits */}
      <div className="absolute inset-0">
        <CursorGrid
          cellSize={54}
          color="#00e5ff"
          gridColor="#38bdf8"
          highlight="area"
          gridStyle="lines"
          radius={150}
          holdTime={450}
          fadeDuration={850}
          fillOpacity={0.07}
          gridOpacity={0.08}
          spotlight={0.65}
          clickPulse={true}
          pulseSpeed={650}
          ambient={0.18}
          edgeFade={0.25}
          intro={true}
          className="w-full h-full"
        />
      </div>

      {/* Atmospheric radial lights behind content */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background: `
            radial-gradient(circle 700px at 15% 10%, rgba(0, 229, 255, 0.08) 0%, transparent 65%),
            radial-gradient(circle 650px at 85% 20%, rgba(37, 99, 235, 0.09) 0%, transparent 70%),
            radial-gradient(circle 800px at 50% 85%, rgba(0, 229, 255, 0.05) 0%, transparent 75%)
          `,
        }}
      />
    </div>
  );
};

export default SiteBackground;
