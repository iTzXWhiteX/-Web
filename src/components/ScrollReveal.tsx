import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  direction?: 'up' | 'down' | 'none';
  as?: 'div' | 'section' | 'article' | 'header' | 'span';
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  delayMs = 0,
  direction = 'up',
  as: Component = 'div',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // Check if IntersectionObserver is available
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    // Check reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Re-triggers on scrolling down and up
          if (entry.isIntersecting) {
            setIsVisible(true);
          } else {
            // Un-reveal when out of viewport so it re-animates smoothly
            setIsVisible(false);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '20px 0px -40px 0px',
      }
    );

    observer.observe(el);

    // Initial check for elements in the initial viewport
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setIsVisible(true);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const directionTranslate = {
    up: isVisible ? 'translate-y-0' : 'translate-y-4',
    down: isVisible ? 'translate-y-0' : '-translate-y-4',
    none: '',
  }[direction];

  const transitionDelayStyle = delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined;

  return (
    <Component
      ref={elementRef as any}
      style={transitionDelayStyle}
      className={`transition-all duration-500 ease-out will-change-[opacity,transform] ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${directionTranslate} ${className}`}
    >
      {children}
    </Component>
  );
};
