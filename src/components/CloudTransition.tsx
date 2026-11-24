import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const CHIKOO_CLOUD_MASCOT_URL = "https://i.postimg.cc/25yH51Xb/f6360331-4e16-48e0-bb04-72a556ee6596.webp";

export interface CloudTransitionProps {
  isActive: boolean;
  onCovered?: () => void;
  onFinished?: () => void;
  minCoverMs?: number;
  entranceMs?: number;
  exitMs?: number;
}

type CloudPhase = 'idle' | 'entering' | 'covered' | 'exiting';

/**
 * Full-Screen Edge-to-Edge Cloud Transition.
 * - Rendered via React Portal directly into document.body to break free from any parent container / max-width bounds.
 * - 100vw × 100vh full viewport coverage across all aspect ratios (mobile, tablet, desktop, ultrawide).
 * - Multi-layer organic cloud billows and center volumetric mist ensuring 100% coverage with zero gaps or background bleed.
 * - GPU-friendly transform/opacity animations with clean lifecycle and resource teardown.
 */
export const CloudTransition: React.FC<CloudTransitionProps> = ({
  isActive,
  onCovered,
  onFinished,
  minCoverMs = 180,
  entranceMs = 380,
  exitMs = 380
}) => {
  const [phase, setPhase] = useState<CloudPhase>('idle');
  const [mounted, setMounted] = useState(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const hasTriggeredCoverRef = useRef(false);
  const hasTriggeredFinishRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    // Pre-cache mascot image
    const img = new Image();
    img.src = CHIKOO_CLOUD_MASCOT_URL;
  }, []);

  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  const clearAllTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  };

  const addTimer = (cb: () => void, ms: number) => {
    const timer = setTimeout(cb, ms);
    timersRef.current.push(timer);
    return timer;
  };

  useEffect(() => {
    if (!isActive) {
      clearAllTimers();
      setPhase('idle');
      hasTriggeredCoverRef.current = false;
      hasTriggeredFinishRef.current = false;
      return;
    }

    clearAllTimers();
    hasTriggeredCoverRef.current = false;
    hasTriggeredFinishRef.current = false;

    // Reduced motion fast path
    if (prefersReducedMotion) {
      setPhase('covered');
      onCovered?.();
      addTimer(() => {
        onFinished?.();
        setPhase('idle');
      }, 200);
      return;
    }

    // Step 1: Clouds sweep in from left and right
    setPhase('entering');

    addTimer(() => {
      // Step 2: Clouds meet in center and fully cover viewport
      setPhase('covered');
      if (!hasTriggeredCoverRef.current) {
        hasTriggeredCoverRef.current = true;
        onCovered?.();
      }

      // Step 3: Brief hold with mascot at center while destination screen mounts underneath
      addTimer(() => {
        // Step 4: Clouds open outward to reveal the new story screen
        setPhase('exiting');

        addTimer(() => {
          // Step 5: Transition complete, unmount overlay
          setPhase('idle');
          if (!hasTriggeredFinishRef.current) {
            hasTriggeredFinishRef.current = true;
            onFinished?.();
          }
        }, exitMs);

      }, minCoverMs);
    }, entranceMs);

    return () => {
      clearAllTimers();
    };
  }, [isActive, entranceMs, minCoverMs, exitMs, prefersReducedMotion]);

  if (!mounted || (!isActive && phase === 'idle')) {
    return null;
  }

  const isCoveredOrEntering = phase === 'entering' || phase === 'covered';
  const isFullyCovered = phase === 'covered';

  const overlayContent = (
    <div 
      id="cloud-story-transition-portal"
      className="fixed inset-0 z-[99999] overflow-hidden select-none pointer-events-auto flex items-center justify-center m-0 p-0"
      style={{
        width: '100vw',
        height: '100dvh',
        maxWidth: '100vw',
        maxHeight: '100dvh',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        touchAction: 'none'
      }}
      aria-hidden="true"
    >
      {/* 1. Full-Screen Fog / Mist Underlay to prevent any background bleed during covered phase */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: isFullyCovered ? 1 : phase === 'entering' ? 0.95 : 0
        }}
        transition={{
          duration: phase === 'entering' ? entranceMs / 1000 : exitMs / 1000,
          ease: "easeInOut"
        }}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, #ffffff 0%, #f0f9ff 60%, #e0f2fe 100%)'
        }}
      />

      {/* 2. Top Edge Mist Drift */}
      <motion.div
        initial={{ y: '-100%', opacity: 0 }}
        animate={{
          y: isCoveredOrEntering ? '0%' : '-100%',
          opacity: isCoveredOrEntering ? 1 : 0
        }}
        transition={{
          duration: phase === 'entering' ? (entranceMs / 1000) * 0.9 : (exitMs / 1000) * 0.85,
          ease: phase === 'entering' ? [0.16, 1, 0.3, 1] : [0.32, 0, 0.67, 0]
        }}
        className="absolute top-0 inset-x-0 h-[30vh] pointer-events-none z-10"
        style={{
          background: 'linear-gradient(to bottom, #ffffff 0%, rgba(255,255,255,0.95) 45%, rgba(240,249,255,0) 100%)',
          willChange: 'transform, opacity',
          transform: 'translateZ(0)'
        }}
      />

      {/* 3. Bottom Edge Mist Drift */}
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{
          y: isCoveredOrEntering ? '0%' : '100%',
          opacity: isCoveredOrEntering ? 1 : 0
        }}
        transition={{
          duration: phase === 'entering' ? (entranceMs / 1000) * 0.9 : (exitMs / 1000) * 0.85,
          ease: phase === 'entering' ? [0.16, 1, 0.3, 1] : [0.32, 0, 0.67, 0]
        }}
        className="absolute bottom-0 inset-x-0 h-[30vh] pointer-events-none z-10"
        style={{
          background: 'linear-gradient(to top, #ffffff 0%, rgba(255,255,255,0.95) 45%, rgba(240,249,255,0) 100%)',
          willChange: 'transform, opacity',
          transform: 'translateZ(0)'
        }}
      />

      {/* 4. LEFT VOLUMETRIC CLOUD BANK (Oversized to guarantee edge-to-edge overlap) */}
      <motion.div
        initial={{ x: '-110%' }}
        animate={{
          x: isCoveredOrEntering ? '0%' : '-115%'
        }}
        transition={{
          duration: phase === 'entering' ? entranceMs / 1000 : exitMs / 1000,
          ease: phase === 'entering' ? [0.22, 1, 0.36, 1] : [0.32, 0, 0.67, 0]
        }}
        className="absolute top-0 bottom-0 left-0 w-[80vw] sm:w-[75vw] md:w-[70vw] min-w-[340px] z-20 pointer-events-none will-change-transform flex items-center justify-end"
      >
        <svg
          viewBox="0 0 700 900"
          className="w-full h-full object-fill"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="cloud-l-deep" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="50%" stopColor="#e0f2fe" />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>
            <linearGradient id="cloud-l-main" x1="0%" y1="20%" x2="100%" y2="80%">
              <stop offset="0%" stopColor="#f0f9ff" />
              <stop offset="60%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>
            <linearGradient id="cloud-l-front" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>

          {/* Deep atmospheric back wave */}
          <path
            d="M 0 0 L 500 0 C 600 80 660 180 580 280 C 680 370 720 500 620 620 C 700 720 640 840 520 900 L 0 900 Z"
            fill="url(#cloud-l-deep)"
            opacity="0.9"
          />

          {/* Main billowing cloud body */}
          <path
            d="M 0 0 L 440 0 C 510 50 560 130 520 210 C 610 270 650 390 570 480 C 660 560 630 700 530 780 C 470 830 380 870 280 900 L 0 900 Z"
            fill="url(#cloud-l-main)"
          />

          {/* Front billowed puffs */}
          <path
            d="M 0 0 L 380 0 C 440 40 470 110 440 170 C 510 220 560 320 500 400 C 570 470 550 590 480 660 C 420 720 340 760 250 820 L 0 900 Z"
            fill="url(#cloud-l-front)"
          />

          {/* Natural Cloud Highlights */}
          <circle cx="340" cy="180" r="95" fill="#ffffff" opacity="0.9" />
          <circle cx="440" cy="380" r="115" fill="#ffffff" opacity="0.95" />
          <circle cx="360" cy="620" r="105" fill="#ffffff" opacity="0.9" />
          <circle cx="200" cy="780" r="120" fill="#ffffff" opacity="0.95" />
        </svg>
      </motion.div>

      {/* 5. RIGHT VOLUMETRIC CLOUD BANK (Oversized to guarantee edge-to-edge overlap) */}
      <motion.div
        initial={{ x: '110%' }}
        animate={{
          x: isCoveredOrEntering ? '0%' : '115%'
        }}
        transition={{
          duration: phase === 'entering' ? entranceMs / 1000 : exitMs / 1000,
          ease: phase === 'entering' ? [0.22, 1, 0.36, 1] : [0.32, 0, 0.67, 0]
        }}
        className="absolute top-0 bottom-0 right-0 w-[80vw] sm:w-[75vw] md:w-[70vw] min-w-[340px] z-20 pointer-events-none will-change-transform flex items-center justify-start"
      >
        <svg
          viewBox="0 0 700 900"
          className="w-full h-full object-fill"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="cloud-r-deep" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="50%" stopColor="#e0f2fe" />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>
            <linearGradient id="cloud-r-main" x1="100%" y1="20%" x2="0%" y2="80%">
              <stop offset="0%" stopColor="#f0f9ff" />
              <stop offset="60%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>
            <linearGradient id="cloud-r-front" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>

          {/* Deep atmospheric back wave */}
          <path
            d="M 700 0 L 200 0 C 100 80 40 180 120 280 C 20 370 -20 500 80 620 C 0 720 60 840 180 900 L 700 900 Z"
            fill="url(#cloud-r-deep)"
            opacity="0.9"
          />

          {/* Main billowing cloud body */}
          <path
            d="M 700 0 L 260 0 C 190 50 140 130 180 210 C 90 270 50 390 130 480 C 40 560 70 700 170 780 C 230 830 320 870 420 900 L 700 900 Z"
            fill="url(#cloud-r-main)"
          />

          {/* Front billowed puffs */}
          <path
            d="M 700 0 L 320 0 C 260 40 230 110 260 170 C 190 220 140 320 200 400 C 130 470 150 590 220 660 C 280 720 360 760 450 820 L 700 900 Z"
            fill="url(#cloud-r-front)"
          />

          {/* Natural Cloud Highlights */}
          <circle cx="360" cy="180" r="95" fill="#ffffff" opacity="0.9" />
          <circle cx="260" cy="380" r="115" fill="#ffffff" opacity="0.95" />
          <circle cx="340" cy="620" r="105" fill="#ffffff" opacity="0.9" />
          <circle cx="500" cy="780" r="120" fill="#ffffff" opacity="0.95" />
        </svg>
      </motion.div>

      {/* 6. Soft Center Flare / Bloom */}
      <AnimatePresence>
        {isCoveredOrEntering && (
          <motion.div
            key="cloud-flare-bloom"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{
              opacity: phase === 'covered' ? [0.4, 0.9, 0.5] : 0.3,
              scale: phase === 'covered' ? [0.8, 1.4, 1.6] : 0.8
            }}
            exit={{ opacity: 0, scale: 2 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute z-30 w-72 h-72 sm:w-96 sm:h-96 rounded-full pointer-events-none will-change-transform"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(254,240,138,0.55) 35%, rgba(56,189,248,0.3) 65%, rgba(255,255,255,0) 100%)'
            }}
          />
        )}
      </AnimatePresence>

      {/* 7. Chikoo Mascot Centerpiece */}
      <AnimatePresence>
        {isCoveredOrEntering && (
          <motion.div
            key="cloud-mascot-center"
            id="cloud-transition-mascot-container"
            initial={{ opacity: 0, scale: 0.5, y: 30, rotate: -4 }}
            animate={{
              opacity: 1,
              scale: phase === 'covered' ? [1, 1.08, 1.02] : 1,
              y: phase === 'covered' ? [0, -8, 0] : 0,
              rotate: phase === 'covered' ? [-2, 2, 0] : 0
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
              y: -20,
              transition: { duration: 0.22, ease: "easeIn" }
            }}
            transition={{
              duration: 0.38,
              ease: [0.175, 0.885, 0.32, 1.275]
            }}
            className="absolute z-40 flex flex-col items-center justify-center pointer-events-none will-change-transform"
          >
            {/* Soft Ambient Radiance */}
            <div className="absolute -inset-6 bg-amber-300/30 rounded-full blur-xl pointer-events-none" />

            {/* Mascot Image */}
            <img
              id="cloud-transition-mascot-img"
              src={CHIKOO_CLOUD_MASCOT_URL}
              alt="Chikoo Space Explorer"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/heading_aibo.webp'; }}
              referrerPolicy="no-referrer"
              draggable={false}
              className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.15)] select-none pointer-events-none"
            />

            {/* Soft Floating Star Accents */}
            <div className="absolute inset-0 pointer-events-none">
              <span className="absolute -top-1 -right-2 text-amber-400 text-lg sm:text-xl drop-shadow-sm select-none">✨</span>
              <span className="absolute -bottom-1 -left-2 text-sky-400 text-base sm:text-lg drop-shadow-sm select-none">⭐</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Mount directly to document.body via portal to achieve true 100vw x 100vh full screen
  if (typeof document !== 'undefined' && document.body) {
    return createPortal(overlayContent, document.body);
  }

  return overlayContent;
};

export default CloudTransition;
