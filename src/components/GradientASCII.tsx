import React, { useEffect, useRef } from 'react';
import './GradientASCII.css';

type GradientASCIIProps = {
  colors?: string[];
  shape?: 'horizon' | 'sphere' | 'plane';
  characters?: string;
  cellSize?: number;
  density?: number;
};

const DEFAULT_COLORS = ['#1e3fd8', '#f6f8ff', '#a5d8ff', '#38bdf8'];

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  const normalized = value.length === 3
    ? value.split('').map((part) => part + part).join('')
    : value;
  const parsed = Number.parseInt(normalized, 16);
  return [(parsed >> 16) & 255, (parsed >> 8) & 255, parsed & 255];
}

function mixColor(colors: [number, number, number][], amount: number) {
  const scaled = Math.max(0, Math.min(0.9999, amount)) * (colors.length - 1);
  const index = Math.floor(scaled);
  const blend = scaled - index;
  const a = colors[index];
  const b = colors[Math.min(index + 1, colors.length - 1)];
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * blend)}, ${Math.round(a[1] + (b[1] - a[1]) * blend)}, ${Math.round(a[2] + (b[2] - a[2]) * blend)})`;
}

const GradientASCII: React.FC<GradientASCIIProps> = ({
  colors = DEFAULT_COLORS,
  shape = 'horizon',
  characters = ' =+xX0S8#@',
  cellSize = 18,
  density = 0.8,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: true });
    if (!container || !canvas || !context) return;

    const palette = (colors.length ? colors : DEFAULT_COLORS).map(hexToRgb);
    const glyphs = Array.from(characters || ' =+xX0S8#@');
    const safeCell = Math.max(10, Math.min(36, cellSize));
    const safeDensity = Math.max(0.2, Math.min(1, density));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let columns = 0;
    let rows = 0;
    let frame = 0;
    let animationId = 0;
    let pointerX = -10000;
    let pointerY = -10000;
    let lastDraw = 0;

    const resize = () => {
      const bounds = container.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      columns = Math.ceil(width / safeCell);
      rows = Math.ceil(height / safeCell);
    };

    const onPointerMove = (event: PointerEvent) => {
      const bounds = container.getBoundingClientRect();
      const inside = event.clientX >= bounds.left && event.clientX <= bounds.right
        && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
      pointerX = inside ? event.clientX - bounds.left : -10000;
      pointerY = inside ? event.clientY - bounds.top : -10000;
    };

    const draw = (time: number) => {
      if (time - lastDraw < 40 && !reducedMotion) {
        animationId = requestAnimationFrame(draw);
        return;
      }
      lastDraw = time;
      context.clearRect(0, 0, width, height);
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = `${Math.max(9, safeCell * 0.72)}px ui-monospace, SFMono-Regular, Menlo, monospace`;

      const t = reducedMotion ? 0 : time * 0.00022;
      const centerY = height * (shape === 'horizon' ? 0.56 : 0.52);
      const centerX = width * 0.5;
      const radiusX = Math.max(width * 0.72, 1);
      const radiusY = Math.max(height * 0.9, 1);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          if (((row * 17 + col * 13) % 100) / 100 > safeDensity) continue;
          const x = col * safeCell + safeCell / 2;
          const y = row * safeCell + safeCell / 2;
          const nx = (x - centerX) / radiusX;
          const ny = (y - centerY) / radiusY;
          const distance = shape === 'sphere'
            ? Math.sqrt(nx * nx * 1.8 + ny * ny * 2.4)
            : shape === 'plane'
              ? Math.abs(ny) * 0.9 + Math.abs(nx) * 0.18
              : Math.abs(ny + Math.sin(nx * 3.2 + t) * 0.12) * 1.45 + Math.abs(nx) * 0.18;
          const wave = Math.sin(nx * 4.2 + t * 2.1) * 0.09 + Math.cos(ny * 5 - t) * 0.07;
          let glow = Math.max(0, 1 - distance + wave);
          if (shape === 'sphere') glow *= Math.max(0, 1 - Math.max(0, distance - 0.72) * 2.2);
          if (glow < 0.08) continue;

          const dx = x - pointerX;
          const dy = y - pointerY;
          const pointerDistance = Math.sqrt(dx * dx + dy * dy);
          const scramble = pointerDistance < 105 ? (1 - pointerDistance / 105) : 0;
          const charIndex = Math.min(glyphs.length - 1, Math.floor(
            Math.min(0.999, Math.max(0, glow + (scramble * (0.35 + Math.sin(time * 0.012 + col) * 0.3)))) * glyphs.length
          ));
          const colorPosition = Math.max(0, Math.min(1, glow * 0.92 + (col / Math.max(1, columns)) * 0.08));
          context.globalAlpha = Math.min(0.9, glow * 0.8 + scramble * 0.15);
          context.fillStyle = mixColor(palette, colorPosition);
          context.fillText(glyphs[charIndex] || '@', x, y);
        }
      }
      context.globalAlpha = 1;
      if (!reducedMotion) animationId = requestAnimationFrame(draw);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    resize();
    if (reducedMotion) draw(0);
    else animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, [colors, shape, characters, cellSize, density]);

  return (
    <div ref={containerRef} className="gradient-ascii-container" aria-hidden="true">
      <canvas ref={canvasRef} className="gradient-ascii-canvas" />
    </div>
  );
};

export default GradientASCII;
