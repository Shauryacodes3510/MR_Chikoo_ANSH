import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number; // starting offset from center
  y: number; // starting offset from center
  tx: number; // target translation x
  ty: number; // target translation y
  rotationStart: number;
  rotationEnd: number;
  color: string;
  size: number;
  shape: 'square' | 'circle' | 'triangle' | 'strip';
  delay: number;
  duration: number;
}

const BRAND_COLORS = [
  '#10b981', // Emerald green
  '#34d399', // Mint/light green
  '#059669', // Deep emerald
  '#f59e0b', // Amber/gold
  '#fbbf24', // Yellow gold
  '#06b6d4', // Cyan
  '#38bdf8', // Sky blue
  '#ec4899', // Pink
];

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

export default function ConfettiEffect({ active, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    if (prefersReducedMotion) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 500);
      return () => clearTimeout(timer);
    }

    // High-performance lightweight 28 particle burst (smooth 60fps GPU animation)
    const newParticles: Particle[] = Array.from({ length: 28 }).map((_, idx) => {
      const angle = (idx / 28) * 2 * Math.PI + (Math.random() * 0.2 - 0.1);
      const force = 90 + Math.random() * 180;
      
      const tx = Math.cos(angle) * force;
      const ty = Math.sin(angle) * force - (40 + Math.random() * 70);

      const size = 6 + Math.random() * 6;
      const shapes: Particle['shape'][] = ['square', 'circle', 'triangle', 'strip'];
      const shape = shapes[idx % shapes.length];
      
      return {
        id: idx,
        x: 0,
        y: 0,
        tx,
        ty,
        rotationStart: Math.random() * 180,
        rotationEnd: Math.random() * 360 + 180,
        color: BRAND_COLORS[idx % BRAND_COLORS.length],
        size,
        shape,
        delay: (idx % 4) * 0.03,
        duration: 1.4 + Math.random() * 0.8,
      };
    });

    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, 2400);

    return () => clearTimeout(timer);
  }, [active, onComplete]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50 flex items-center justify-center">
      <AnimatePresence>
        {particles.map((p) => {
          const renderShape = () => {
            switch (p.shape) {
              case 'circle':
                return (
                  <div
                    className="rounded-full"
                    style={{
                      width: p.size,
                      height: p.size,
                      backgroundColor: p.color,
                    }}
                  />
                );
              case 'triangle':
                return (
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: `${p.size / 2}px solid transparent`,
                      borderRight: `${p.size / 2}px solid transparent`,
                      borderBottom: `${p.size}px solid ${p.color}`,
                    }}
                  />
                );
              case 'strip':
                return (
                  <div
                    style={{
                      width: p.size * 0.4,
                      height: p.size * 1.5,
                      backgroundColor: p.color,
                      borderRadius: '2px',
                    }}
                  />
                );
              case 'square':
              default:
                return (
                  <div
                    style={{
                      width: p.size,
                      height: p.size,
                      backgroundColor: p.color,
                    }}
                  />
                );
            }
          };

          return (
            <motion.div
              key={p.id}
              initial={{ 
                opacity: 0, 
                scale: 0.2, 
                x: 0, 
                y: 20,
                rotate: p.rotationStart 
              }}
              animate={{
                opacity: [0, 1, 1, 0.7, 0],
                scale: [0.2, 1.1, 1, 0.8, 0],
                x: p.tx,
                y: [0, p.ty * 0.7, p.ty, p.ty + 150, p.ty + 300],
                rotate: p.rotationEnd
              }}
              transition={{
                duration: p.duration,
                ease: "easeOut",
                delay: p.delay,
              }}
              className="absolute"
              style={{ willChange: 'transform, opacity', transform: 'translateZ(0)' }}
            >
              {renderShape()}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
