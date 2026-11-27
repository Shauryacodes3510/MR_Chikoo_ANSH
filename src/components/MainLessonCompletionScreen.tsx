import React, { useEffect, useRef, memo, useState, useMemo } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ChevronRight, Sparkles, CheckCircle2, Flame, Trophy, Star, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../lib/sounds';
import { useScreenAudio } from '../hooks/useScreenAudio';
import { Challenge } from '../lib/curriculumTypes';
import { useTranslation } from '../lib/translation/TranslationContext';
import { LanguageSelector } from './LanguageSelector';
// @ts-ignore
import cookiesIcon from '@/cookies.webp';

export const CHIKOO_COMPLETION_MASCOT_URL = "/heading_aibo.webp";
export const CHIKOO_INTERACTIVE_COMPLETION_MASCOT_URL = "/heading_aibo.webp";

export const INTERACTIVE_C_SCREEN_TYPES = new Set([
  'c1_multiple_choice',
  'c2_fill_in_blank',
  'c3_sentence_builder',
  'c4_concept_matcher',
  'c5_bucket_sort',
  'c6_timeline_sort',
  'c6_tap_correct_object',
  'c7_sequence_builder',
  'c7_sentence_builder',
  'c8_tap_correct_object',
  'c9_true_false',
  'c10_swipe_left_right',
  'c10_hotspot',
  'c11_image_classification',
  'c11_image_classifier',
  'c12_label_diagram',
  'c13_hotspot_question',
  'c14_memory_flip_cards',
  'c15_drag_complete_diagram',
  'c15_diagram_completer',
  'c16_eliminate_wrong',
  'c16_wrong_eliminator',
  'c17_arrange_images',
  'c18_audio_quiz'
]);

export const isInteractiveCScreen = (challengeOrType?: any): boolean => {
  if (!challengeOrType) return false;
  const rawType = typeof challengeOrType === 'string'
    ? challengeOrType
    : (challengeOrType.type || challengeOrType.screenType || challengeOrType.id || '');
  const type = String(rawType).trim().toLowerCase();

  if (INTERACTIVE_C_SCREEN_TYPES.has(type)) return true;
  if (/^c(1[0-8]|[1-9])(_|$)/i.test(type)) return true;

  const aliases = [
    'multiple_choice',
    'tap_right_answer',
    'fill_in_blank',
    'sentence_builder',
    'build_concept',
    'concept_matcher',
    'match_pairs',
    'drag_and_drop',
    'drag_drop',
    'bucket_sort',
    'sort_sequence',
    'tap_correct_area',
    'true_false',
    'swipe_left_right',
    'image_classification',
    'label_diagram',
    'hotspot_question',
    'memory_flip_cards',
    'diagram_completer',
    'eliminate_wrong',
    'arrange_images',
    'audio_quiz'
  ];
  return aliases.includes(type);
};

export interface MainLessonCompletionScreenProps {
  title?: string;
  subtitle?: string;
  correctCount: number;
  totalQuestions: number;
  earnedCookies: number;
  earnedXp?: number;
  streak?: number;
  requiredAccuracy?: number; // defaults to 0.6 (60%)
  userRating?: number | null;
  onRatingChange?: (rating: number) => void;
  onProceed: () => void;
  onRetry?: () => void;
  lessonId?: string | null;
  screenId?: string | null;
  language?: string | null;
  fallbackNarrations?: Record<string, any>;
  challenges?: Challenge[];
  mascotUrl?: string;
}

// -------------------------------------------------------------
// 1. DIMENSIONAL GOLDEN ACHIEVEMENT BADGE
// Scalable SVG with champagne, honey gold, and ivory gradients,
// faceted 3D star, specular highlights, and dimensional depth.
// -------------------------------------------------------------
const DimensionalGoldBadge = memo(({ didPass }: { didPass: boolean }) => {
  return (
    <div className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 flex items-center justify-center select-none">
      {/* Soft Champagne & Warm Honey Glow Behind Badge */}
      <div 
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#F59E0B]/30 via-[#FDE68A]/40 to-[#F5B82E]/35 blur-2xl pointer-events-none transform scale-110" 
      />

      {/* Gentle Rotating Ray Effect Behind Badge */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-14px] rounded-full pointer-events-none opacity-40"
        style={{
          background: 'conic-gradient(from 0deg, rgba(251,191,36,0.3) 0deg, transparent 40deg, rgba(251,191,36,0.25) 80deg, transparent 120deg, rgba(251,191,36,0.3) 180deg, transparent 220deg, rgba(251,191,36,0.25) 280deg, transparent 320deg, rgba(251,191,36,0.3) 360deg)'
        }}
      />

      {/* Dimensional SVG Badge */}
      <svg 
        viewBox="0 0 200 200" 
        className="w-full h-full drop-shadow-[0_16px_28px_rgba(180,105,10,0.32)] overflow-visible relative z-10"
        aria-hidden="true"
      >
        <defs>
          {/* Outer Bevel Rim Gradient: Pale Cream to Warm Gold to Rich Amber */}
          <linearGradient id="badgeRimGrad" x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#FFFDF7" />
            <stop offset="25%" stopColor="#FDE68A" />
            <stop offset="55%" stopColor="#F5B82E" />
            <stop offset="85%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>

          {/* Inner Golden Medallion Face Plate */}
          <radialGradient id="badgeFaceGrad" cx="38%" cy="32%" r="72%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="20%" stopColor="#FFFBEB" />
            <stop offset="55%" stopColor="#FCD34D" />
            <stop offset="85%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </radialGradient>

          {/* 3D Embossed Star Facets (Light / Illuminated side) */}
          <linearGradient id="starFacetLight" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#FEF3C7" />
            <stop offset="100%" stopColor="#FDE68A" />
          </linearGradient>

          {/* 3D Embossed Star Facets (Shadow / Shaded side) */}
          <linearGradient id="starFacetShadow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="65%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>

          {/* Specular Highlight Sheen */}
          <linearGradient id="badgeSpecularSheen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Soft Drop Shadow Filter for Star */}
          <filter id="starShadowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#78350F" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Outer Champagne-Gold Ring */}
        <circle 
          cx="100" 
          cy="100" 
          r="93" 
          fill="url(#badgeRimGrad)" 
          stroke="#FFFDF7" 
          strokeWidth="2" 
        />

        {/* Outer Shadow Rim */}
        <circle 
          cx="100" 
          cy="101" 
          r="86" 
          fill="#92400E" 
          opacity="0.28" 
        />

        {/* Primary Radiant Warm Gold Face Plate */}
        <circle 
          cx="100" 
          cy="98" 
          r="84" 
          fill="url(#badgeFaceGrad)" 
          stroke="#FFFBEB" 
          strokeWidth="1.5" 
        />

        {/* Inner Engraved Stitched Rim */}
        <circle 
          cx="100" 
          cy="98" 
          r="73" 
          fill="none" 
          stroke="#FFFBEB" 
          strokeWidth="1.4" 
          strokeDasharray="4 3" 
          opacity="0.85" 
        />

        {/* Center Dimensional Star Element */}
        {didPass ? (
          <g transform="translate(100, 98)" filter="url(#starShadowFilter)">
            {/* Ambient Star Glow Underneath */}
            <circle cx="0" cy="0" r="42" fill="#FEF3C7" opacity="0.45" filter="blur(3px)" />

            {/* 3D Multi-faceted Star: Precision 5-Point Shaded Segments */}
            {/* Top Point */}
            <polygon points="0,-48 0,0 14,-14" fill="url(#starFacetLight)" />
            <polygon points="0,-48 0,0 -14,-14" fill="url(#starFacetShadow)" />

            {/* Top Right Point */}
            <polygon points="46,-15 0,0 14,-14" fill="url(#starFacetLight)" />
            <polygon points="46,-15 0,0 18,12" fill="url(#starFacetShadow)" />

            {/* Bottom Right Point */}
            <polygon points="28,39 0,0 18,12" fill="url(#starFacetLight)" />
            <polygon points="28,39 0,0 0,22" fill="url(#starFacetShadow)" />

            {/* Bottom Left Point */}
            <polygon points="-28,39 0,0 0,22" fill="url(#starFacetLight)" />
            <polygon points="-28,39 0,0 -18,12" fill="url(#starFacetShadow)" />

            {/* Top Left Point */}
            <polygon points="-46,-15 0,0 -18,12" fill="url(#starFacetLight)" />
            <polygon points="-46,-15 0,0 -14,-14" fill="url(#starFacetShadow)" />

            {/* Center Polished Diamond Core Highlight */}
            <circle cx="0" cy="0" r="6" fill="#FFFFFF" />
            <circle cx="-1" cy="-1" r="2" fill="#FFFDF7" opacity="0.9" />
          </g>
        ) : (
          /* Exploratory Compass Icon for retry/encourage mode */
          <g transform="translate(100, 98) scale(1.3)" filter="url(#starShadowFilter)">
            <circle cx="0" cy="0" r="28" fill="#92400E" opacity="0.2" />
            <polygon points="0,-24 7,0 0,24 -7,0" fill="url(#starFacetLight)" />
            <polygon points="-24,0 0,7 24,0 0,-7" fill="url(#starFacetShadow)" />
            <circle cx="0" cy="0" r="5" fill="#FFFFFF" />
          </g>
        )}

        {/* Specular Highlight Crescent Sheen across Top Half */}
        <path 
          d="M 32,68 A 82,82 0 0,1 168,68 A 78,72 0 0,0 32,68 Z" 
          fill="url(#badgeSpecularSheen)" 
          opacity="0.6" 
        />
      </svg>
    </div>
  );
});
DimensionalGoldBadge.displayName = 'DimensionalGoldBadge';

// -------------------------------------------------------------
// 2. FLOATING DECORATIVE 3D SPHERES & ACCENTS
// Delicately positioned spheres with spherical gradients and varied drifts.
// -------------------------------------------------------------
const FloatingDecorationLayer = memo(() => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10" aria-hidden="true">
      {/* 1. Golden Honey Sphere - Top Right */}
      <motion.div
        animate={{
          y: [-8, 8, -8],
          x: [-4, 4, -4],
          rotate: [0, 8, 0]
        }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 right-4 sm:top-14 sm:right-12 w-9 h-9 sm:w-11 sm:h-11 rounded-full opacity-85 shadow-[0_10px_20px_rgba(245,158,11,0.22)]"
        style={{
          background: 'radial-gradient(circle at 35% 30%, #FFFFFF 0%, #FFFBEB 30%, #FDE68A 65%, #F59E0B 100%)'
        }}
      />

      {/* 2. Soft Emerald/Mint Sphere - Bottom Left */}
      <motion.div
        animate={{
          y: [7, -7, 7],
          x: [3, -3, 3]
        }}
        transition={{ duration: 6.2, delay: 0.4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 left-4 sm:bottom-24 sm:left-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full opacity-75 shadow-[0_8px_18px_rgba(52,211,153,0.25)]"
        style={{
          background: 'radial-gradient(circle at 35% 30%, #F0FDF4 0%, #DCFCE7 40%, #86EFAC 75%, #10B981 100%)'
        }}
      />

      {/* 3. Warm Pearl Ivory Sphere - Top Left */}
      <motion.div
        animate={{
          y: [-6, 6, -6],
          x: [-2, 2, -2]
        }}
        transition={{ duration: 4.8, delay: 0.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-5 sm:top-24 sm:left-14 w-6 h-6 sm:w-7 sm:h-7 rounded-full opacity-70 shadow-[0_6px_12px_rgba(251,191,36,0.18)]"
        style={{
          background: 'radial-gradient(circle at 35% 30%, #FFFFFF 0%, #FFFDF7 40%, #FEF3C7 80%, #F5B82E 100%)'
        }}
      />

      {/* 4. Pastel Coral Amber Accent Bead - Bottom Right */}
      <motion.div
        animate={{
          y: [5, -5, 5],
          x: [-3, 3, -3]
        }}
        transition={{ duration: 5.8, delay: 1.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-28 right-5 sm:bottom-32 sm:right-14 w-6 h-6 sm:w-7 sm:h-7 rounded-full opacity-65 shadow-[0_6px_12px_rgba(249,115,22,0.2)]"
        style={{
          background: 'radial-gradient(circle at 35% 30%, #FFF7ED 0%, #FED7AA 45%, #FB923C 85%, #EA580C 100%)'
        }}
      />

      {/* 5. Subtle Twinkling Sparkle Stars */}
      <motion.div
        animate={{ scale: [0.85, 1.2, 0.85], opacity: [0.35, 0.8, 0.35] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-10 text-[#F59E0B] select-none hidden sm:block"
      >
        <Sparkles size={16} className="fill-current" />
      </motion.div>

      <motion.div
        animate={{ scale: [1.15, 0.85, 1.15], opacity: [0.8, 0.35, 0.8] }}
        transition={{ duration: 3.4, delay: 0.7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/3 right-10 text-[#F5B82E] select-none hidden sm:block"
      >
        <Sparkles size={15} className="fill-current" />
      </motion.div>
    </div>
  );
});
FloatingDecorationLayer.displayName = 'FloatingDecorationLayer';

// -------------------------------------------------------------
// 3. CONTROLLED CELEBRATORY CONFETTI BURST
// Controlled, elegant burst during Phase 3, stopping naturally.
// -------------------------------------------------------------
const CONFETTI_COLORS = [
  '#F59E0B', // Warm gold
  '#FCD34D', // Soft yellow
  '#FB923C', // Warm coral
  '#34D399', // Mint emerald
  '#60A5FA', // Sky blue
  '#A78BFA', // Soft lilac
  '#F472B6', // Rose
];

const ConfettiLayer = memo(({ active }: { active: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    let myConfetti: ReturnType<typeof confetti.create> | null = null;
    let t1: any = null;
    let t2: any = null;

    try {
      myConfetti = confetti.create(canvasRef.current, {
        resize: true,
        useWorker: true
      });

      // 1. Initial burst from the achievement badge center
      myConfetti({
        particleCount: 85,
        spread: 90,
        origin: { x: 0.5, y: 0.38 },
        colors: CONFETTI_COLORS,
        shapes: ['circle', 'square'],
        scalar: 1.3,
        gravity: 0.75,
        ticks: 240,
        disableForReducedMotion: true
      });

      // 2. Secondary side sparkles for depth
      t1 = setTimeout(() => {
        if (!myConfetti) return;
        myConfetti({
          particleCount: 40,
          angle: 60,
          spread: 60,
          origin: { x: 0.25, y: 0.45 },
          colors: CONFETTI_COLORS,
          scalar: 1.1,
          gravity: 0.8,
          ticks: 200
        });
      }, 200);

      t2 = setTimeout(() => {
        if (!myConfetti) return;
        myConfetti({
          particleCount: 40,
          angle: 120,
          spread: 60,
          origin: { x: 0.75, y: 0.45 },
          colors: CONFETTI_COLORS,
          scalar: 1.1,
          gravity: 0.8,
          ticks: 200
        });
      }, 350);
    } catch {
      // safe fallback
    }

    return () => {
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
      try {
        myConfetti?.reset();
      } catch {
        // safe
      }
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-30 w-full h-full"
      style={{ width: '100vw', height: '100vh' }}
      aria-hidden="true"
    />
  );
});
ConfettiLayer.displayName = 'ConfettiLayer';

// -------------------------------------------------------------
// 4. MAIN LESSON COMPLETION EXPERIENCE COMPONENT
// -------------------------------------------------------------
export const MainLessonCompletionScreen: React.FC<MainLessonCompletionScreenProps> = memo(({
  title,
  subtitle,
  correctCount,
  totalQuestions,
  earnedCookies,
  earnedXp,
  streak = 1,
  requiredAccuracy = 0.6,
  userRating,
  onRatingChange,
  onProceed,
  onRetry,
  lessonId,
  screenId,
  language,
  challenges,
  mascotUrl,
}) => {
  const isCompletingRef = useRef(false);
  const prefersReducedMotion = useReducedMotion();
  const { language: contextLanguage } = useTranslation();
  const activeLanguage = language || contextLanguage;

  // Determine if session contains interactive screens (c1-c18)
  const isInteractiveScreenSession = useMemo(() => {
    // If screenId indicates an interactive C screen
    if (screenId && isInteractiveCScreen(screenId)) return true;

    // Check challenge items in challenges array
    if (challenges && challenges.length > 0) {
      return challenges.some((c) => isInteractiveCScreen(c));
    }

    // Default to true for interactive sessions if unspecified
    return true;
  }, [challenges, screenId]);

  const activeMascotUrl = useMemo(() => {
    if (isInteractiveScreenSession) {
      return CHIKOO_INTERACTIVE_COMPLETION_MASCOT_URL;
    }
    return mascotUrl || CHIKOO_COMPLETION_MASCOT_URL;
  }, [isInteractiveScreenSession, mascotUrl]);

  // Score & Performance derived values (60% threshold rule)
  const accuracyPercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 100;
  const isHighPerformance = accuracyPercent >= 60;
  const didPass = isHighPerformance;

  // Local interactive rating state (delightful client-side animation without writing to DB)
  const [internalRating, setInternalRating] = useState<number | null>(userRating || null);
  const [hasRated, setHasRated] = useState(false);
  const [ratingHover, setRatingHover] = useState<number | null>(null);

  const handleRateClick = (star: number) => {
    setInternalRating(star);
    setHasRated(true);
    try {
      soundManager.play('pop');
      confetti({
        particleCount: 30,
        spread: 55,
        origin: { y: 0.72 },
        colors: ['#fbbf24', '#f59e0b', '#f97316', '#a855f7']
      });
    } catch (_) {}
    if (onRatingChange) {
      try {
        onRatingChange(star);
      } catch (_) {}
    }
  };

  // Celebration confetti trigger in Phase 3
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion || !didPass) return;
    const t = setTimeout(() => {
      setShowConfetti(true);
    }, 800);
    return () => clearTimeout(t);
  }, [prefersReducedMotion, didPass]);

  const screenText = isHighPerformance
    ? `Chikoo is happy with your progress! You scored ${accuracyPercent}% and earned these rewards! Ready for the next adventure?`
    : `Chikoo believes in you! You scored ${accuracyPercent}%. Explorer, let's practice and try again together!`;

  // Audio Voice Narration
  const screenAudio = useScreenAudio({
    lessonId,
    screenId: screenId ? `${screenId}_completion` : 'lesson_completion',
    screenText,
    language: activeLanguage,
    autoPlay: false
  });

  const stopAllVoice = () => {
    try {
      screenAudio.stop();
    } catch {
      // safe audio stop
    }
  };

  useEffect(() => {
    return () => {
      stopAllVoice();
    };
  }, []);

  // Entry sound trigger
  useEffect(() => {
    try {
      if (didPass) {
        soundManager.play('complete');
      } else {
        soundManager.play('incorrect');
      }
    } catch {
      // safe sound ignore
    }
  }, [didPass]);

  // Action handlers
  const handleProceedClick = () => {
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;
    setTimeout(() => { isCompletingRef.current = false; }, 2000);
    stopAllVoice();
    try {
      soundManager.play('click');
    } catch {
      // safe
    }
    onProceed();
  };

  const handleRetryClick = () => {
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;
    setTimeout(() => { isCompletingRef.current = false; }, 2000);
    stopAllVoice();
    try {
      soundManager.play('click');
    } catch {
      // safe
    }
    if (onRetry) {
      onRetry();
    } else {
      onProceed();
    }
  };

  const displayTitle = isHighPerformance 
    ? (title || "CHIKOO IS PROUD OF YOU!") 
    : "KEEP PRACTICING!";

  const displayMessage = isHighPerformance
    ? (subtitle || `Chikoo is happy with your progress! You scored ${accuracyPercent}% and he gifted you these rewards! Keep shining, explorer!`)
    : `Chikoo believes in you! You scored ${accuracyPercent}%. Explorer, every try makes you stronger. Let's try again together!`;

  return (
    <div
      id={didPass ? "completion-screen-success" : "completion-screen-failed"}
      className="fixed inset-0 z-[2000] bg-[radial-gradient(ellipse_at_center,_#FFFDF7_0%,_#FDF8EE_45%,_#F6EDE0_100%)] dark:bg-[radial-gradient(ellipse_at_center,_#12182b_0%,_#0c101d_60%,_#070a13_100%)] flex flex-col items-center justify-center p-3 sm:p-6 select-none overflow-y-auto overflow-x-hidden font-sans"
    >
      {/* Soft Ambient Warm Glow in Background */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#FFE4A0]/20 via-[#FFF6D8]/35 to-[#FFD875]/15 dark:from-purple-900/20 dark:via-indigo-900/25 dark:to-amber-500/10 blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />

      {/* Confetti Celebration Layer (Phase 3) */}
      {!prefersReducedMotion && (
        <ConfettiLayer active={showConfetti && didPass} />
      )}

      {/* Floating 3D Spheres Layer */}
      {!prefersReducedMotion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
          className="absolute inset-0 pointer-events-none"
        >
          <FloatingDecorationLayer />
        </motion.div>
      )}

      {/* Top Bar: Language Selector */}
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        className="absolute top-3 right-3 sm:top-5 sm:right-6 z-40"
      >
        <LanguageSelector variant="embedded" />
      </motion.div>

      {/* ========================================================
          3D-INSPIRED FLOATING PHONE FRAME COMPOSITION
          Responsive: Tilted 3D floating perspective on desktop,
          fluid, centered, non-overflowing presentation on mobile.
          ======================================================== */}
      <div 
        className="relative z-20 w-full max-w-sm sm:max-w-md my-auto flex flex-col items-center justify-center"
        style={{ perspective: prefersReducedMotion ? undefined : 1200 }}
      >
        <motion.div
          id="completion-phone-frame"
          initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { 
            opacity: 0, 
            scale: 0.88, 
            rotateY: -10, 
            rotateX: 8, 
            y: 20 
          }}
          animate={prefersReducedMotion ? { opacity: 1, scale: 1 } : { 
            opacity: 1, 
            scale: 1, 
            rotateY: [-10, -5, -4], 
            rotateX: [8, 4, 3], 
            y: 0 
          }}
          transition={{
            duration: 0.75,
            ease: [0.22, 1, 0.36, 1]
          }}
          className="relative w-full rounded-[38px] sm:rounded-[46px] p-2.5 sm:p-3.5 bg-gradient-to-b from-[#F7F2E7] via-[#EDE4D0] to-[#E3D7C1] dark:from-[#1e263d] dark:via-[#161c2d] dark:to-[#0f1422] border-[5px] sm:border-[7px] border-[#FFFFFF]/90 dark:border-slate-700/80 shadow-[0_28px_60px_-15px_rgba(180,140,80,0.32)] dark:shadow-[0_28px_60px_-15px_rgba(0,0,0,0.6)]"
          style={{
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden'
          }}
        >
          {/* Inner Phone Screen */}
          <div className="relative w-full rounded-[28px] sm:rounded-[36px] bg-gradient-to-b from-[#FFFDF9] via-[#FAF5EC] to-[#F5ECE0] dark:from-[#13192b] dark:via-[#0e1322] dark:to-[#090d18] border border-[#EADBCA]/60 dark:border-slate-800 p-5 sm:p-7 flex flex-col items-center text-center overflow-hidden shadow-inner">
            
            {/* Phone Speaker Notch / Island */}
            <div className="w-20 sm:w-24 h-3.5 bg-[#E6DAC3]/70 dark:bg-slate-800 rounded-full mx-auto mb-3 flex items-center justify-center gap-1.5 shadow-inner" aria-hidden="true">
              <div className="w-2 h-2 rounded-full bg-[#D4C4A8] dark:bg-slate-600" />
              <div className="w-8 h-1 rounded-full bg-[#D4C4A8] dark:bg-slate-600" />
            </div>

            {/* Phase 2: Chikoo Mascot Centerpiece */}
            <div className="relative my-2 sm:my-3 flex items-center justify-center">
              <motion.div
                initial={prefersReducedMotion ? { scale: 1, opacity: 1 } : { scale: 0.4, opacity: 0, rotate: -6 }}
                animate={prefersReducedMotion ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 1, rotate: 0 }}
                transition={{
                  duration: 0.7,
                  delay: 0.35,
                  ease: [0.34, 1.56, 0.64, 1] // Gentle celebration overshoot
                }}
                className="relative z-10 flex flex-col items-center justify-center"
              >
                {/* Celebratory Float & Micro-Pulse */}
                <motion.div
                  animate={prefersReducedMotion ? {} : {
                    y: [0, -5, 0],
                    scale: [1, 1.03, 1]
                  }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center select-none"
                >
                  {/* Soft Radial Gold Sunburst Rays Behind Mascot */}
                  <div 
                    className="absolute inset-[-12px] rounded-full animate-spin-slow pointer-events-none opacity-80"
                    style={{
                      background: 'conic-gradient(from 0deg, rgba(251,191,36,0.3) 0deg, transparent 40deg, rgba(251,191,36,0.25) 80deg, transparent 120deg, rgba(251,191,36,0.3) 180deg, transparent 220deg, rgba(251,191,36,0.25) 280deg, transparent 320deg, rgba(251,191,36,0.3) 360deg)'
                    }}
                  />
                  {/* Subtle Glow Backdrop */}
                  <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-amber-400/25 via-amber-200/35 to-yellow-300/20 blur-xl pointer-events-none" />

                  <img
                    src={activeMascotUrl}
                    alt="Chikoo Mascot"
                    className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(245,158,11,0.35)] relative z-10 select-none pointer-events-none"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (isInteractiveScreenSession) {
                        if (!target.src.endsWith('/chikoo_interactive_completion.webp')) {
                          target.src = '/chikoo_interactive_completion.webp';
                          return;
                        }
                      }
                      target.src = '/lesson_completion_mascot.webp';
                    }}
                  />
                </motion.div>
              </motion.div>
            </div>

            {/* Phase 3 & 4: Headline & Friendly Message */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.65, ease: "easeOut" }}
              className="mt-1 px-1 space-y-1.5"
            >
              <h2 className="text-2xl sm:text-3xl font-black text-[#202536] dark:text-white tracking-tight leading-tight uppercase font-display">
                {displayTitle}
              </h2>
              <p className="text-xs sm:text-[13px] text-[#60697B] dark:text-slate-300 font-medium leading-relaxed max-w-xs mx-auto">
                {displayMessage}
              </p>
            </motion.div>

            {/* Phase 4: Dynamic Reward Summary Deck (Spacious 2x2 Grid so text never clips) */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.85, ease: "easeOut" }}
              className="w-full grid grid-cols-2 gap-2.5 sm:gap-3 mt-4 px-1"
            >
              {/* 1. Score & Accuracy Card */}
              <div className="bg-white/90 dark:bg-[#182035]/95 backdrop-blur-sm border border-[#EADBCA] dark:border-slate-700/60 rounded-2xl py-2.5 px-3 flex flex-col items-center justify-center text-center shadow-[0_4px_12px_rgba(200,160,100,0.08)] dark:shadow-none min-h-[66px]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={18} className={isHighPerformance ? "text-emerald-500" : "text-amber-500"} />
                  <span className="text-base sm:text-lg font-black text-[#202536] dark:text-white tabular-nums">
                    {correctCount}/{totalQuestions}
                  </span>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider mt-0.5 ${isHighPerformance ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {accuracyPercent}% Score
                </span>
              </div>

              {/* 2. Earned Cookies Card */}
              <div className="bg-white/90 dark:bg-[#182035]/95 backdrop-blur-sm border border-[#EADBCA] dark:border-slate-700/60 rounded-2xl py-2.5 px-3 flex flex-col items-center justify-center text-center shadow-[0_4px_12px_rgba(200,160,100,0.08)] dark:shadow-none min-h-[66px]">
                <div className="flex items-center gap-1.5">
                  <img 
                    src={cookiesIcon} 
                    alt="Cookies" 
                    className="w-5 h-5 object-contain select-none" 
                  />
                  <span className="text-base sm:text-lg font-black text-[#202536] dark:text-white tabular-nums">
                    +{earnedCookies}
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 mt-0.5">
                  Cookies
                </span>
              </div>

              {/* 3. Earned XP Card */}
              <div className="bg-white/90 dark:bg-[#182035]/95 backdrop-blur-sm border border-[#EADBCA] dark:border-slate-700/60 rounded-2xl py-2.5 px-3 flex flex-col items-center justify-center text-center shadow-[0_4px_12px_rgba(200,160,100,0.08)] dark:shadow-none min-h-[66px]">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={18} className="text-indigo-500 fill-indigo-500/20" />
                  <span className="text-base sm:text-lg font-black text-[#202536] dark:text-white tabular-nums">
                    +{earnedXp || earnedCookies}
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mt-0.5">
                  XP Points
                </span>
              </div>

              {/* 4. In a row / Answer Streak Card */}
              <div className="bg-white/90 dark:bg-[#182035]/95 backdrop-blur-sm border border-[#EADBCA] dark:border-slate-700/60 rounded-2xl py-2.5 px-3 flex flex-col items-center justify-center text-center shadow-[0_4px_12px_rgba(200,160,100,0.08)] dark:shadow-none min-h-[66px]">
                <div className="flex items-center gap-1.5">
                  <Flame size={18} className="text-[#FF6B00] fill-[#FF6B00]/20" />
                  <span className="text-base sm:text-lg font-black text-[#202536] dark:text-white tabular-nums">
                    {streak > 0 ? streak : 1}
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 mt-0.5">
                  In A Row
                </span>
              </div>
            </motion.div>

            {/* Interactive 5-Star Rating Widget with Instant Animation (No DB write) */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.95, ease: "easeOut" }}
              className="w-full mt-3.5 pt-2.5 border-t border-amber-200/50 dark:border-slate-800/80 flex flex-col items-center justify-center gap-1.5 select-none"
            >
              <div className="flex items-center justify-between w-full px-2 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Star size={13} className="text-amber-500 fill-amber-500" />
                  <span>Rate this Adventure</span>
                </span>
                <span className="text-amber-600 dark:text-amber-400 font-bold normal-case text-xs transition-opacity duration-150">
                  {ratingHover === 1 && "Needs work 😕"}
                  {ratingHover === 2 && "Okay 🙂"}
                  {ratingHover === 3 && "Good 😊"}
                  {ratingHover === 4 && "Great! 😃"}
                  {ratingHover === 5 && "Loved it! 🤩"}
                  {ratingHover === null && internalRating !== null && `${internalRating} / 5 Stars ⭐`}
                </span>
              </div>

              {/* Fixed hit box buttons with no size scaling on button to prevent cursor flickering */}
              <div 
                className="flex items-center justify-center gap-1 py-1"
                onMouseLeave={() => setRatingHover(null)}
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const activeHover = ratingHover !== null && ratingHover > 0;
                  const currentLevel = activeHover ? ratingHover : (internalRating || 0);
                  const isFilled = currentLevel >= star;
                  return (
                    <button
                      key={`star-${star}`}
                      type="button"
                      onMouseEnter={() => setRatingHover(star)}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRateClick(star);
                      }}
                      className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors group focus:outline-none select-none hover:bg-amber-100/40 dark:hover:bg-amber-950/30"
                      title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        size={24}
                        className={`pointer-events-none transition-transform duration-150 group-hover:scale-125 group-active:scale-90 ${
                          isFilled
                            ? 'fill-amber-400 text-amber-500 drop-shadow-[0_2px_8px_rgba(251,191,36,0.6)]'
                            : 'fill-transparent text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Animated feedback badge when user taps a star */}
              <AnimatePresence>
                {hasRated && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 350, damping: 20 }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100/90 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-200 text-xs font-bold shadow-xs mt-0.5"
                  >
                    <span>🎉</span>
                    <span>Chikoo noted your {internalRating}★ rating! Thank you!</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Phase 5: Primary Action Buttons */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.05, ease: "easeOut" }}
              className="w-full mt-4"
            >
              {didPass ? (
                <motion.button
                  id="completion-proceed-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleProceedClick}
                  className="relative overflow-hidden w-full py-3.5 px-5 rounded-2xl bg-[#FF6B00] hover:bg-[#F06100] active:bg-[#D95500] text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-[0_10px_22px_rgba(255,107,0,0.35)] border border-orange-400/40 flex items-center justify-center gap-2 cursor-pointer select-none touch-manipulation transition-all duration-150"
                >
                  {/* Subtle Shimmer across the primary action button */}
                  <motion.div
                    aria-hidden="true"
                    className="absolute -inset-y-2 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-25deg] pointer-events-none"
                    animate={prefersReducedMotion ? {} : {
                      x: ['0%', '480%'],
                    }}
                    transition={{
                      repeat: Infinity,
                      repeatDelay: 1.8,
                      duration: 1.2,
                      ease: "easeInOut",
                    }}
                  />
                  <span className="relative z-10 flex items-center justify-center gap-1.5 font-display pointer-events-none select-none">
                    <span>Continue Adventure</span>
                    <ChevronRight size={18} className="stroke-[3]" />
                  </span>
                </motion.button>
              ) : (
                <motion.button
                  id="completion-try-again-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleRetryClick}
                  className="relative overflow-hidden w-full py-3.5 px-5 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-[0_8px_20px_rgba(37,99,235,0.25)] border border-blue-400/30 flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 font-display"
                >
                  <RotateCcw size={16} className="stroke-[3]" />
                  <span>Try Again Together</span>
                </motion.button>
              )}
            </motion.div>

          </div>
        </motion.div>
      </div>
    </div>
  );
});

MainLessonCompletionScreen.displayName = 'MainLessonCompletionScreen';
