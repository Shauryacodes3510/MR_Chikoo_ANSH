import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, RotateCw, CheckCircle2, Zap, Star, Clock, AlertCircle } from 'lucide-react';
import cookiesIcon from '@/cookies.webp';
import { soundManager } from '../lib/sounds';
import { useCelebration } from './CelebrationProvider';
import { rewardService, SpinWheelDailyStatus } from '../lib/rewardService';

export interface CookieWheelSlice {
  id: string | number;
  amount: number;
  label?: string;
  isJackpot?: boolean;
  colorGradient: [string, string]; // [startColor, endColor]
  missionIndex?: number;
}

export const DEFAULT_COOKIE_SLICES: CookieWheelSlice[] = [
  { id: 1, amount: 50, label: '50 🍪', colorGradient: ['#3b82f6', '#1d4ed8'] },
  { id: 2, amount: 100, label: '100 🍪', colorGradient: ['#8b5cf6', '#6d28d9'] },
  { id: 3, amount: 150, label: '150 🍪', colorGradient: ['#06b6d4', '#0e7490'] },
  { id: 4, amount: 200, label: '200 🍪', colorGradient: ['#10b981', '#047857'] },
  { id: 5, amount: 250, label: '250 🍪', colorGradient: ['#f97316', '#c2410c'] },
  { id: 6, amount: 300, label: '300 🍪', colorGradient: ['#ec4899', '#be185d'] },
  { id: 7, amount: 500, label: '500 🍪', isJackpot: true, colorGradient: ['#f59e0b', '#b45309'] },
  { id: 8, amount: 1000, label: '1000 🍪', isJackpot: true, colorGradient: ['#ef4444', '#b91c1c'] },
];

interface CookieWheelProps {
  slices?: CookieWheelSlice[];
  onSpinStart?: () => void;
  onSpinEnd?: (wonSlice: CookieWheelSlice) => void;
  onClaimReward?: (amount: number, wonSlice: CookieWheelSlice) => void;
  showInternalModal?: boolean;
  isSpinningExternal?: boolean;
  title?: string;
  subtitle?: string;
  compact?: boolean;
  className?: string;
}

export default function CookieWheel({
  slices = DEFAULT_COOKIE_SLICES,
  onSpinStart,
  onSpinEnd,
  onClaimReward,
  showInternalModal,
  title,
  subtitle,
  compact = false,
  className = ''
}: CookieWheelProps) {
  const celebration = useCelebration();

  // Physics & animation states
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isConsuming, setIsConsuming] = useState(false);
  const [winningSliceIndex, setWinningSliceIndex] = useState<number | null>(null);
  const [pointerWiggle, setPointerWiggle] = useState(false);
  const [pointerBounce, setPointerBounce] = useState(false);
  const [wonSliceModal, setWonSliceModal] = useState<CookieWheelSlice | null>(null);
  const [ledStep, setLedStep] = useState(0);

  // Daily Spin Limit State (3 spins/day, Asia/Kolkata)
  const [dailyStatus, setDailyStatus] = useState<SpinWheelDailyStatus | null>(null);
  const [limitWarning, setLimitWarning] = useState<string | null>(null);

  // Particles state for spinning & winning
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number; size: number; color: string }[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // Fetch backend/database daily spin status
  const fetchDailyStatus = useCallback(async () => {
    try {
      const status = await rewardService.getSpinWheelDailyStatus();
      setDailyStatus(status);
    } catch (err) {
      console.warn('[CookieWheel] Failed to fetch daily status:', err);
    }
  }, []);

  useEffect(() => {
    fetchDailyStatus();
  }, [fetchDailyStatus]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent dismissing via Escape key while spinning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSpinning) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isSpinning]);

  // Refs for animation calculation
  const animFrameRef = useRef<number | null>(null);
  const spinStartAngleRef = useRef(0);
  const lastSliceIdxRef = useRef(-1);

  const numSlices = slices.length;
  const sliceAngle = 360 / numSlices;

  // LED light rim chasing animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setLedStep(prev => (prev + 1) % 12);
    }, isSpinning ? 80 : 350);
    return () => clearInterval(interval);
  }, [isSpinning]);

  // Handle spin button click with backend atomic consumption and realistic ease-out cubic deceleration
  const handleSpin = useCallback(async () => {
    if (isSpinning || isConsuming) return;

    // Check if daily status is already exhausted
    if (dailyStatus && (!dailyStatus.canSpin || dailyStatus.remaining <= 0 || dailyStatus.used >= 3)) {
      soundManager.play('incorrect');
      setLimitWarning('Daily spin limit of 3 reached for today. Resets at midnight (Asia/Kolkata).');
      return;
    }

    setIsConsuming(true);
    setLimitWarning(null);

    // 1. Atomically consume 1 spin in database/backend via RPC
    const consumeRes = await rewardService.consumeSpinWheel();

    if (!consumeRes.consumed) {
      setIsConsuming(false);
      soundManager.play('incorrect');
      setLimitWarning(consumeRes.message || 'Daily spin limit of 3 reached for today. Resets at midnight (Asia/Kolkata).');
      setDailyStatus({
        limit: consumeRes.limit ?? 3,
        used: consumeRes.used ?? 3,
        remaining: 0,
        canSpin: false,
        can_spin: false,
        timezone: 'Asia/Kolkata'
      });
      return;
    }

    // Update local status with confirmed backend response
    setDailyStatus({
      limit: consumeRes.limit,
      used: consumeRes.used,
      remaining: consumeRes.remaining,
      canSpin: consumeRes.canSpin,
      can_spin: consumeRes.can_spin,
      usage_date: consumeRes.usage_date,
      timezone: consumeRes.timezone || 'Asia/Kolkata'
    });

    setIsConsuming(false);
    soundManager.play('click');
    setIsSpinning(true);
    setWinningSliceIndex(null);
    setWonSliceModal(null);

    if (onSpinStart) {
      onSpinStart();
    }

        // Server-Authoritative Winning Slice (Tamper-proof)
    const serverIndex = (consumeRes as any)?.winningIndex;
    const randomIndex = typeof serverIndex === 'number' && serverIndex >= 0 && serverIndex < numSlices
      ? serverIndex
      : Math.floor(Math.random() * numSlices);
    const targetSlice = slices[randomIndex];

    // Compute exact rotation offset so the pointer at 12 o'clock (top center) lands cleanly on slice
    const currentRotMod = rotation % 360;
    // Pointer is at 270 deg / -90 deg (Top = 12 o'clock).
    // Slice index `i` center angle from top = (i * sliceAngle) + (sliceAngle / 2)
    const desiredMod = (360 - (randomIndex * sliceAngle + sliceAngle / 2)) % 360;
    let diff = desiredMod - currentRotMod;
    if (diff <= 0) {
      diff += 360;
    }
    const fullSpins = 360 * 7; // 7 full 360-degree spins for high drama
    const finalRotation = rotation + fullSpins + diff;

    spinStartAngleRef.current = rotation;
    const startTime = performance.now();
    const spinDuration = 4800; // 4.8 seconds

    // Realistic ease-out cubic physics deceleration
    const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / spinDuration);
      const easedProgress = easeOutQuint(progress);

      const currentDeg = spinStartAngleRef.current + (finalRotation - spinStartAngleRef.current) * easedProgress;
      setRotation(currentDeg);

      // Slice crossing detection for sound & pointer tick
      const normalizedDeg = ((360 - (currentDeg % 360)) % 360);
      const currentSliceIdx = Math.floor(normalizedDeg / sliceAngle) % numSlices;

      if (currentSliceIdx !== lastSliceIdxRef.current) {
        lastSliceIdxRef.current = currentSliceIdx;
        soundManager.play('cms_tick');
        setPointerWiggle(true);
        setTimeout(() => setPointerWiggle(false), 60);

        // Emit small trail sparkles while spinning
        if (progress < 0.85) {
          const angleRad = (Math.random() * 360 * Math.PI) / 180;
          const dist = 140 + Math.random() * 40;
          setSparkles(prev => [
            ...prev.slice(-15),
            {
              id: Date.now() + Math.random(),
              x: Math.cos(angleRad) * dist,
              y: Math.sin(angleRad) * dist,
              size: Math.random() * 8 + 4,
              color: ['#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#ffffff'][Math.floor(Math.random() * 5)]
            }
          ]);
        }
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Spin Completed!
        setIsSpinning(false);
        setWinningSliceIndex(randomIndex);
        setPointerBounce(true);
        setTimeout(() => setPointerBounce(false), 500);

        soundManager.play('complete');
        if (!onSpinEnd && celebration && celebration.triggerCelebration) {
          celebration.triggerCelebration('reward_box_opened');
        }

        // Delay callback / popup slightly for impact as winning slice glows
        setTimeout(() => {
          const shouldShowModal = showInternalModal !== undefined ? showInternalModal : !onSpinEnd;
          if (shouldShowModal) {
            setWonSliceModal(targetSlice);
          }
          if (onSpinEnd) {
            onSpinEnd(targetSlice);
          }
        }, 600);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, [isSpinning, isConsuming, dailyStatus, rotation, slices, numSlices, sliceAngle, onSpinStart, onSpinEnd, celebration]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const handleClaim = () => {
    if (!wonSliceModal) return;
    soundManager.play('pop');
    if (onClaimReward) {
      onClaimReward(wonSliceModal.amount, wonSliceModal);
    }
    setWonSliceModal(null);
    fetchDailyStatus();
  };

  // SVG Geometry Dimensions
  const CX = 200;
  const CY = 200;
  const RADIUS = 180;
  const INNER_HUB_R = 48;

  const spinsUsed = dailyStatus ? dailyStatus.used : 0;
  const spinsRemaining = dailyStatus ? dailyStatus.remaining : 3;
  const isLimitReached = dailyStatus ? !dailyStatus.canSpin || spinsRemaining <= 0 : false;

  return (
    <div className={`w-full flex flex-col items-center justify-center relative select-none font-sans ${className}`}>
      
      {/* Background Atmosphere Lighting Glow */}
      <div className="absolute w-[240px] h-[240px] sm:w-[290px] sm:h-[290px] rounded-full bg-gradient-to-tr from-amber-500/20 via-purple-500/15 to-blue-500/20 blur-2xl pointer-events-none -z-10 animate-pulse" />

      {/* Header Info */}
      {title && (
        <div className="text-center space-y-1 mb-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-black uppercase tracking-widest">
            <Sparkles size={11} className="animate-spin text-amber-500" />
            <span>AAA Lucky Spin</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-white tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold max-w-xs mx-auto">
            {subtitle}
          </p>
        </div>
      )}

      {/* MAIN WHEEL ASSEMBLY */}
      <div className="relative flex flex-col items-center justify-center py-1">

        {/* 1. TOP POINTER (Mounted at 12 o'clock) */}
        <div className="relative z-30 mb-[-20px] pointer-events-none">
          <motion.div
            animate={{
              rotate: pointerWiggle ? [-16, 0] : pointerBounce ? [0, -12, 6, -3, 0] : 0,
              scale: pointerWiggle ? 1.15 : pointerBounce ? 1.25 : 1,
            }}
            transition={{
              rotate: pointerBounce || pointerWiggle 
                ? { duration: pointerBounce ? 0.45 : 0.08, ease: "easeInOut" } 
                : { type: "spring", stiffness: 450, damping: 15 },
              scale: { type: "spring", stiffness: 450, damping: 15 },
            }}
            className="w-10 h-12 flex items-center justify-center filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)]"
          >
            <svg viewBox="0 0 48 56" className="w-9 h-11 transform-gpu">
              <defs>
                <linearGradient id="pointerGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#78350f" />
                </linearGradient>
                <filter id="pointerGlow">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.8" />
                </filter>
              </defs>

              {/* Metallic Teardrop Blade Pointer */}
              <path
                d="M 24 2 C 38 2, 46 18, 24 54 C 2 18, 10 2, 24 2 Z"
                fill="url(#pointerGold)"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinejoin="round"
                filter="url(#pointerGlow)"
              />
              {/* Internal Glowing Ruby / Emerald Gem */}
              <circle cx="24" cy="16" r="7" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
              <circle cx="22" cy="14" r="2.5" fill="#ffffff" opacity="0.8" />
            </svg>
          </motion.div>
        </div>

        {/* 2. ILLUMINATED OUTER RING FRAME */}
        <div className="relative p-3.5 sm:p-4 rounded-full bg-gradient-to-b from-[#1e1b4b] via-[#0f172a] to-[#020617] shadow-[0_15px_40px_rgba(0,0,0,0.5),0_0_24px_rgba(245,158,11,0.25),inset_0_2px_4px_rgba(255,255,255,0.2)] border-3 border-[#334155] flex items-center justify-center">

          {/* LED Bulbs Rim Ring around the wheel */}
          <div className="absolute inset-1.5 rounded-full pointer-events-none border-2 border-amber-500/20 z-20">
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * (360 / 24) * Math.PI) / 180;
              const r = compact ? 95 : isMobile ? 116 : 138;
              const x = Math.cos(angle) * r;
              const y = Math.sin(angle) * r;
              const isLit = (i + ledStep) % 3 === 0 || isSpinning;

              return (
                <div
                  key={i}
                  className={`absolute w-2.5 h-2.5 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-colors duration-150 ${
                    isLit
                      ? 'bg-amber-300 shadow-[0_0_6px_#f59e0b,0_0_10px_#fef08a] border border-white'
                      : 'bg-slate-700/60 border border-slate-600'
                  }`}
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                  }}
                />
              );
            })}
          </div>

          {/* 3. ROTATING SVG WHEEL DISK */}
          <div className="w-[210px] h-[210px] sm:w-[250px] sm:h-[250px] rounded-full overflow-hidden relative bg-slate-950 shadow-inner">
            <motion.div
              animate={{ rotate: rotation }}
              transition={{ ease: "linear", duration: 0 }}
              style={{ willChange: 'transform' }}
              className="w-full h-full relative transform-gpu"
            >
              <svg viewBox="0 0 400 400" className="w-full h-full">
                <defs>
                  {/* Generate gradients for each slice */}
                  {slices.map((slice, idx) => (
                    <linearGradient
                      key={`grad-${idx}`}
                      id={`sliceGrad-${idx}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor={slice.colorGradient[0]} />
                      <stop offset="100%" stopColor={slice.colorGradient[1]} />
                    </linearGradient>
                  ))}

                  <filter id="textGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.8" />
                  </filter>

                  <filter id="winningGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#f59e0b" floodOpacity="1" />
                  </filter>
                </defs>

                {/* DRAW SLICE SECTORS */}
                {slices.map((slice, index) => {
                  const startDeg = index * sliceAngle;
                  const endDeg = (index + 1) * sliceAngle;

                  // Radian offset for SVG (-90 deg offset so 0 starts at top)
                  const a1 = ((startDeg - 90) * Math.PI) / 180;
                  const a2 = ((endDeg - 90) * Math.PI) / 180;

                  // Outer points
                  const x1 = CX + RADIUS * Math.cos(a1);
                  const y1 = CY + RADIUS * Math.sin(a1);
                  const x2 = CX + RADIUS * Math.cos(a2);
                  const y2 = CY + RADIUS * Math.sin(a2);

                  // Inner hub points
                  const ix1 = CX + INNER_HUB_R * Math.cos(a1);
                  const iy1 = CY + INNER_HUB_R * Math.sin(a1);
                  const ix2 = CX + INNER_HUB_R * Math.cos(a2);
                  const iy2 = CY + INNER_HUB_R * Math.sin(a2);

                  const pathD = `M ${ix1} ${iy1} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 0 1 ${x2} ${y2} L ${ix2} ${iy2} A ${INNER_HUB_R} ${INNER_HUB_R} 0 0 0 ${ix1} ${iy1} Z`;

                  // Slice mid angle calculation
                  const midDeg = startDeg + sliceAngle / 2;
                  const midRad = ((midDeg - 90) * Math.PI) / 180;

                  // Radius positioning for Cookie Badge & Amount Text
                  const textR = 115;
                  const textX = CX + textR * Math.cos(midRad);
                  const textY = CY + textR * Math.sin(midRad);

                  const isWinner = winningSliceIndex === index;

                  return (
                    <g key={`wheel-slice-${slice.id || index}-${index}`}>
                      {/* Sector Fill Path */}
                      <path
                        d={pathD}
                        fill={`url(#sliceGrad-${index})`}
                        stroke="#ffffff"
                        strokeWidth={isWinner ? "6" : "3.5"}
                        strokeLinejoin="round"
                        filter={isWinner ? "url(#winningGlow)" : undefined}
                        className="transition-all duration-300"
                      />

                      {/* Inner Sector Highlight Glow overlay for winner */}
                      {isWinner && (
                        <path
                          d={pathD}
                          fill="#ffffff"
                          opacity="0.25"
                          className="animate-pulse"
                        />
                      )}

                      {/* REWARD TEXT & COOKIE ICON GROUP */}
                      <g
                        transform={`translate(${textX}, ${textY}) rotate(${midDeg + 90})`}
                        className="select-none"
                      >
                        {/* Cookie Emoji Icon */}
                        <text
                          x="0"
                          y="-14"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="20"
                          className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                        >
                          🍪
                        </text>

                        {/* Reward Amount Text */}
                        <text
                          x="0"
                          y="10"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#ffffff"
                          fontSize="15"
                          fontWeight="900"
                          fontFamily="sans-serif"
                          filter="url(#textGlow)"
                          className="font-display tracking-wider uppercase"
                        >
                          +{slice.amount}
                        </text>

                        {/* Jackpot Badge */}
                        {slice.isJackpot && (
                          <rect
                            x="-22"
                            y="22"
                            width="44"
                            height="12"
                            rx="6"
                            fill="#f59e0b"
                            stroke="#ffffff"
                            strokeWidth="1"
                          />
                        )}
                        {slice.isJackpot && (
                          <text
                            x="0"
                            y="28"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#ffffff"
                            fontSize="7.5"
                            fontWeight="900"
                          >
                            JACKPOT
                          </text>
                        )}
                      </g>
                    </g>
                  );
                })}

                {/* INNER DECORATIVE RIMS */}
                <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="#fef08a" strokeWidth="4" opacity="0.6" />
                <circle cx={CX} cy={CY} r={INNER_HUB_R} fill="none" stroke="#ffffff" strokeWidth="4" />
              </svg>
            </motion.div>

            {/* Sparkles Particle Trailing Effect Layer */}
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
              {sparkles.map((sp) => (
                <motion.div
                  key={sp.id}
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{ opacity: 0, scale: 0, y: sp.y * 1.2, x: sp.x * 1.2 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute rounded-full"
                  style={{
                    width: sp.size + 'px',
                    height: sp.size + 'px',
                    backgroundColor: sp.color,
                    boxShadow: `0 0 10px ${sp.color}`,
                  }}
                />
              ))}
            </div>

            {/* 4. TACTILE CENTER 3D SPIN BUTTON */}
            <motion.button
              whileHover={{ scale: (isSpinning || isConsuming || isLimitReached) ? 1 : 1.08 }}
              whileTap={{ scale: (isSpinning || isConsuming || isLimitReached) ? 1 : 0.92 }}
              onClick={handleSpin}
              disabled={isSpinning || isConsuming || isLimitReached}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-18 h-18 sm:w-20 sm:h-20 rounded-full text-white flex flex-col items-center justify-center z-30 transition-all ${
                isLimitReached
                  ? 'bg-gradient-to-b from-slate-700 to-slate-900 border-3 border-slate-500 shadow-md cursor-not-allowed opacity-90'
                  : 'bg-gradient-to-b from-purple-500 via-purple-600 to-indigo-800 hover:from-purple-400 hover:to-indigo-700 shadow-[0_6px_0_#3b0764,0_12px_24px_rgba(124,58,237,0.5),inset_0_2px_4px_rgba(255,255,255,0.4)] border-3 border-amber-300 cursor-pointer active:translate-y-1 active:shadow-[0_2px_0_#3b0764]'
              }`}
            >
              <div className="relative flex flex-col items-center justify-center">
                <motion.div
                  animate={{ rotate: isSpinning || isConsuming ? 360 : 0 }}
                  transition={{ repeat: isSpinning || isConsuming ? Infinity : 0, duration: 0.8, ease: "linear" }}
                >
                  {isSpinning || isConsuming ? (
                    <RotateCw size={16} className="text-amber-300 animate-spin" />
                  ) : isLimitReached ? (
                    <Clock size={16} className="text-slate-400" />
                  ) : (
                    <Sparkles size={16} className="text-amber-300 drop-shadow-md" />
                  )}
                </motion.div>

                <span className={`text-[9px] sm:text-[11px] font-black tracking-wider uppercase font-display mt-0.5 text-shadow-md ${
                  isLimitReached ? 'text-slate-300 text-[8px]' : 'text-amber-100'
                }`}>
                  {isSpinning ? 'SPINNING' : isConsuming ? 'WAIT...' : isLimitReached ? 'LIMIT' : 'SPIN'}
                </span>
              </div>
            </motion.button>

          </div>
        </div>

      </div>

      {/* DAILY SPIN USAGE STATUS & ASIA/KOLKATA TIMEZONE RESET BADGE */}
      <div className="mt-3 flex flex-col items-center space-y-1.5 max-w-xs w-full">
        {/* Visual 3-Spin Token Tracker */}
        <div className="flex items-center justify-between w-full px-3.5 py-2 rounded-2xl bg-white border-2 border-slate-200/90 shadow-[0_3px_0_#e2e8f0]">
          <div className="flex items-center gap-1.5 text-xs text-slate-800 font-extrabold">
            <Sparkles size={13} className="text-amber-500" />
            <span>Daily Spins:</span>
          </div>

          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((idx) => {
              const isUsed = idx < spinsUsed;
              return (
                <div
                  key={`spin-token-${idx}`}
                  title={isUsed ? `Spin ${idx + 1} consumed` : `Spin ${idx + 1} available`}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                    isUsed
                      ? 'bg-slate-100 border border-slate-200 text-slate-400'
                      : 'bg-gradient-to-tr from-amber-400 to-amber-300 text-slate-900 font-extrabold shadow-sm border border-amber-300 animate-pulse'
                  }`}
                >
                  {isUsed ? '✓' : '🍪'}
                </div>
              );
            })}
            <span className="text-xs font-mono font-black ml-1 text-amber-600">
              {spinsRemaining}/3
            </span>
          </div>
        </div>

        {/* Timezone Reset Note */}
        <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 font-medium">
          <Clock size={11} className="text-slate-400" />
          <span>Resets daily at 12:00 AM IST (Asia/Kolkata)</span>
        </div>

        {/* Limit Warning Alert Message if Reached */}
        <AnimatePresence>
          {limitWarning && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="w-full mt-1 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-1.5 font-bold text-center justify-center shadow-3xs"
            >
              <AlertCircle size={14} className="shrink-0 text-amber-600" />
              <span>{limitWarning}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CELEBRATORY WINNING MODAL OVERLAY */}
      <AnimatePresence>
        {wonSliceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(245,158,11,0.3)] border-2 border-amber-400 overflow-hidden text-center p-6 space-y-5 my-auto"
            >
              {/* Top Glow Ray */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

              <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest font-mono">
                <Sparkles size={14} className="text-amber-400 animate-spin" />
                <span>VICTORY! COOKIE BOUNTY</span>
              </div>

              {/* Big 3D Cookie Badge */}
              <div className="relative mx-auto my-2 flex flex-col items-center">
                <motion.div
                  animate={{ scale: [0.9, 1.1, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 0.6 }}
                  className="w-28 h-28 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 p-1.5 shadow-[0_10px_30px_rgba(245,158,11,0.5)] border-4 border-white flex items-center justify-center"
                >
                  <img src={cookiesIcon} alt="Cookie Reward" className="w-20 h-20 object-contain drop-shadow-lg" />
                </motion.div>

                <h3 className="text-4xl font-black font-display text-white mt-3 tracking-tight">
                  +{wonSliceModal.amount} <span className="text-amber-400 font-sans">🍪</span>
                </h3>
                <p className="text-xs text-amber-200/90 font-bold uppercase tracking-widest mt-1">
                  {wonSliceModal.isJackpot ? "🔥 MEGA JACKPOT WIN!" : "Added to your Cookie Balance"}
                </p>
              </div>

              {/* Claim Action Button */}
              <button
                type="button"
                onClick={handleClaim}
                className="w-full py-4 rounded-2xl bg-gradient-to-b from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-slate-950 font-black font-display uppercase tracking-widest text-sm border-b-4 border-emerald-800 shadow-[0_6px_20px_rgba(16,185,129,0.4)] active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} className="text-slate-950" />
                <span>CLAIM {wonSliceModal.amount} COOKIES</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
