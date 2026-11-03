'use client';

import { Sun, Moon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

interface Particle {
  id: number;
  delay: number;
  duration: number;
}

export default function CinematicThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  // State Management
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Ref to track toggle button DOM element
  const toggleRef = useRef<HTMLButtonElement>(null);
  
  // Track whether toggle is in checked (dark) or unchecked (light) position
  const isDark = mounted && (theme === 'dark' || resolvedTheme === 'dark');

  // Handle hydration - prevent mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate particles with different timing
  const generateParticles = () => {
    const newParticles: Particle[] = [];
    const particleCount = 3; // Multiple layers

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        delay: i * 0.1, // Stagger timing
        duration: 0.6 + i * 0.1, // Different durations for depth
      });
    }

    setParticles(newParticles);
    setIsAnimating(true);

    // Clear particles after animation
    setTimeout(() => {
      setIsAnimating(false);
      setParticles([]);
    }, 1000);
  };

  // Toggle handler - switches theme and triggers particles
  const handleToggle = () => {
    generateParticles();
    setTheme(isDark ? 'light' : 'dark');
  };

  // Prevent hydration mismatch - clean subtle placeholder during SSR
  if (!mounted) {
    return (
      <div className={`relative inline-block ${className || ''}`}>
        <div className="relative flex h-[36px] w-[62px] sm:h-[40px] sm:w-[70px] items-center rounded-full bg-slate-900/40 border border-white/10 p-1 opacity-0" />
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className || ''}`}>
      {/* SVG Filter for Film Grain Texture */}
      <svg className="absolute w-0 h-0">
        <defs>
          {/* Light mode grain - subtle */}
          <filter id="grain-light">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="4"
              result="noise"
            />
            <feColorMatrix
              in="noise"
              type="saturate"
              values="0"
              result="desaturatedNoise"
            />
            <feComponentTransfer in="desaturatedNoise" result="lightGrain">
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" in2="lightGrain" mode="overlay" />
          </filter>
          
          {/* Dark mode grain - more visible */}
          <filter id="grain-dark">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="4"
              result="noise"
            />
            <feColorMatrix
              in="noise"
              type="saturate"
              values="0"
              result="desaturatedNoise"
            />
            <feComponentTransfer in="desaturatedNoise" result="darkGrain">
              <feFuncA type="linear" slope="0.5" />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" in2="darkGrain" mode="overlay" />
          </filter>
        </defs>
      </svg>

      {/* Pill-shaped track container with scalable sizing */}
      <motion.button
        ref={toggleRef}
        onClick={handleToggle}
        className="relative flex h-[34px] w-[58px] sm:h-[36px] sm:w-[62px] items-center rounded-full p-[3px] transition-all duration-300 focus:outline-none cursor-pointer"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse at top left, #1e293b 0%, #0f172a 40%, #020617 100%)'
            : 'radial-gradient(ellipse at top left, #ffffff 0%, #f1f5f9 40%, #cbd5e1 100%)',
          boxShadow: isDark
            ? `
              inset 3px 3px 8px rgba(0, 0, 0, 0.9),
              inset -3px -3px 8px rgba(71, 85, 105, 0.4),
              0 1px 2px rgba(255, 255, 255, 0.05),
              0 2px 6px rgba(0, 0, 0, 0.4)
            `
            : `
              inset 3px 3px 8px rgba(148, 163, 184, 0.5),
              inset -3px -3px 8px rgba(255, 255, 255, 1),
              0 1px 2px rgba(255, 255, 255, 1),
              0 2px 6px rgba(0, 0, 0, 0.1)
            `,
          border: isDark 
            ? '1.5px solid rgba(51, 65, 85, 0.6)' 
            : '1.5px solid rgba(203, 213, 225, 0.6)',
          position: 'relative',
        }}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        role="switch"
        aria-checked={isDark}
        whileTap={{ scale: 0.96 }}
      >
        {/* Deep inner groove/rim effect */}
        <div 
          className="absolute inset-[2px] rounded-full pointer-events-none"
          style={{
            boxShadow: isDark
              ? 'inset 0 1px 4px rgba(0, 0, 0, 0.9), inset 0 -1px 2px rgba(71, 85, 105, 0.3)'
              : 'inset 0 1px 4px rgba(100, 116, 139, 0.4), inset 0 -1px 2px rgba(255, 255, 255, 0.8)',
          }}
        />
        
        {/* Multi-layer glossy overlay */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: isDark
              ? `
                radial-gradient(ellipse at top, rgba(71, 85, 105, 0.15) 0%, transparent 50%),
                linear-gradient(to bottom, rgba(71, 85, 105, 0.2) 0%, transparent 30%, transparent 70%, rgba(0, 0, 0, 0.3) 100%)
              `
              : `
                radial-gradient(ellipse at top, rgba(255, 255, 255, 0.8) 0%, transparent 50%),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.7) 0%, transparent 30%, transparent 70%, rgba(148, 163, 184, 0.15) 100%)
              `,
            mixBlendMode: 'overlay',
          }}
        />
        
        {/* Ambient occlusion effect */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow: isDark
              ? 'inset 0 0 10px rgba(0, 0, 0, 0.5)'
              : 'inset 0 0 10px rgba(148, 163, 184, 0.2)',
          }}
        />
        {/* Background Icons */}
        <div className="absolute inset-0 flex items-center justify-between px-2">
          <Sun size={12} className={isDark ? 'text-yellow-100/60' : 'text-amber-600'} />
          <Moon size={12} className={isDark ? 'text-yellow-100' : 'text-slate-700/60'} />
        </div>

        {/* Circular Thumb with Bouncy Spring Physics */}
        <motion.div
          className="relative z-10 flex h-[26px] w-[26px] sm:h-[28px] sm:w-[28px] items-center justify-center rounded-full overflow-hidden"
          style={{
            background: isDark
              ? 'linear-gradient(145deg, #64748b 0%, #475569 50%, #334155 100%)'
              : 'linear-gradient(145deg, #ffffff 0%, #fefefe 50%, #f8fafc 100%)',
            boxShadow: isDark
              ? `
                inset 1px 1px 3px rgba(100, 116, 139, 0.4),
                inset -1px -1px 3px rgba(0, 0, 0, 0.8),
                0 2px 8px rgba(0, 0, 0, 0.5)
              `
              : `
                inset 1px 1px 3px rgba(203, 213, 225, 0.3),
                inset -1px -1px 3px rgba(255, 255, 255, 1),
                0 2px 8px rgba(0, 0, 0, 0.15)
              `,
            border: isDark
              ? '1.5px solid rgba(148, 163, 184, 0.3)'
              : '1.5px solid rgba(255, 255, 255, 0.9)',
          }}
          animate={{
            x: isDark ? 24 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 320,
            damping: 22,
          }}
        >
          {/* Glossy shine overlay on thumb */}
          <div 
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 0%, transparent 40%, rgba(0, 0, 0, 0.1) 100%)',
              mixBlendMode: 'overlay',
            }}
          />
          {/* Particle Layer - expanding circles from center with grainy texture */}
          {isAnimating && particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: '6px',
                  height: '6px',
                  background: isDark
                    ? 'radial-gradient(circle, rgba(147, 197, 253, 0.5) 0%, rgba(147, 197, 253, 0) 70%)'
                    : 'radial-gradient(circle, rgba(251, 191, 36, 0.7) 0%, rgba(251, 191, 36, 0) 70%)',
                  mixBlendMode: 'normal',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: isDark ? 5 : 6, opacity: [0, 1, 0] }}
                transition={{
                  duration: isDark ? 0.5 : particle.duration,
                  delay: particle.delay,
                  ease: 'easeOut',
                }}
              />
            </motion.div>
          ))}

          {/* Icon */}
          <div className="relative z-10 flex items-center justify-center">
            {isDark ? (
              <Moon size={13} className="text-yellow-200" />
            ) : (
              <Sun size={13} className="text-amber-500" />
            )}
          </div>
        </motion.div>
      </motion.button>
    </div>
  );
}

export { CinematicThemeSwitcher };
