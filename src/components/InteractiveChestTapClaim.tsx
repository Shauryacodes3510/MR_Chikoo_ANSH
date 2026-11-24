import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import cookiesIcon from '@/cookies.webp';
import chestImage from '@/chest1.webp';
import { soundManager } from '../lib/sounds';

const CHEST_3RD_TAP_IMAGE = "https://i.postimg.cc/c4JqTLvT/eee11a5b-9f65-41e4-bbea-701fb184cfc5-(1).webp";

interface InteractiveChestTapClaimProps {
  cookieCount?: number;
  title?: string;
  subtitle?: string;
  onClaimComplete?: () => void;
}

interface FlyingCookie {
  id: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export const InteractiveChestTapClaim: React.FC<InteractiveChestTapClaimProps> = ({
  cookieCount = 100,
  title = "TREASURE UNLOCKED!",
  subtitle = "You earned a sweet bonus!",
  onClaimComplete
}) => {
  const [tapCount, setTapCount] = useState<number>(0);
  const [isExpanding, setIsExpanding] = useState<boolean>(false);
  const [isBlasted, setIsBlasted] = useState<boolean>(false);
  const [flyingCookies, setFlyingCookies] = useState<FlyingCookie[]>([]);

  // Generate 12 lightweight flying cookies for smooth 60fps blast
  useEffect(() => {
    const cookiesArray: FlyingCookie[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * 360;
      const distance = 140 + Math.random() * 80;
      const rad = (angle * Math.PI) / 180;
      cookiesArray.push({
        id: i,
        x: Math.cos(rad) * distance,
        y: Math.sin(rad) * distance,
        scale: 0.7 + Math.random() * 0.4,
        rotation: Math.random() * 360
      });
    }
    setFlyingCookies(cookiesArray);
  }, []);

  const handleChestTap = () => {
    if (isBlasted || isExpanding) return;

    const newTapCount = tapCount + 1;
    setTapCount(newTapCount);

    if (newTapCount < 3) {
      soundManager.play('click');
    } else {
      soundManager.play('complete');
      setIsExpanding(true);

      setTimeout(() => {
        setIsBlasted(true);
        setIsExpanding(false);
      }, 350);
    }
  };

  return (
    <motion.div
      animate={{
        backgroundColor: isBlasted || tapCount >= 3 || isExpanding ? '#facc15' : 'rgba(15, 23, 42, 0.75)'
      }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center p-4 text-center select-none overflow-hidden backdrop-blur-sm"
    >
      {/* Ambient Dismiss Button */}
      <button
        type="button"
        onClick={() => {
          if (onClaimComplete) onClaimComplete();
        }}
        className="absolute top-5 right-5 z-50 w-10 h-10 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-all border border-slate-700 shadow-md"
        aria-label="Close chest"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Lightweight Ambient Radial Glow */}
      <div 
        className="absolute w-80 h-80 rounded-full pointer-events-none -z-0 bg-yellow-300/30 blur-2xl transition-opacity duration-500"
        style={{ opacity: isBlasted ? 0.9 : tapCount > 0 ? 0.6 : 0.3 }}
      />

      {/* Header Prompt & Title (Uncluttered & Clean) */}
      <AnimatePresence mode="wait">
        {!isBlasted ? (
          <motion.div
            key="tap-prompt"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 z-10"
          >
            <p className="text-sm font-black uppercase tracking-wider text-amber-300 drop-shadow-sm">
              {tapCount === 0 && "Tap chest 3 times to open!"}
              {tapCount === 1 && "Tap again!"}
              {tapCount === 2 && "One last tap!"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="blast-title"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-1 mb-4 z-20"
          >
            <h2 className="text-3xl sm:text-4xl font-display font-black text-slate-950 uppercase tracking-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm font-bold text-amber-950/90 max-w-xs">
              {subtitle}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Chest Container */}
      <div className="relative w-60 h-60 sm:w-64 sm:h-64 flex items-center justify-center my-2 z-10">
        <motion.div
          onClick={handleChestTap}
          animate={
            isExpanding
              ? { scale: [1, 1.25, 1.15], rotate: [0, -8, 8, 0] }
              : isBlasted
              ? { scale: [1.2, 1], rotate: 0 }
              : tapCount === 2
              ? { scale: [1, 1.12, 1.05], rotate: [0, -6, 6, 0] }
              : tapCount === 1
              ? { scale: [1, 1.06, 1.02], rotate: [0, -4, 4, 0] }
              : { scale: [1, 1.02, 1] }
          }
          transition={{
            duration: 0.3,
            ease: "easeOut",
            repeat: tapCount === 0 ? Infinity : 0,
            repeatType: "reverse",
            repeatDelay: 2
          }}
          className="relative flex items-center justify-center w-full h-full cursor-pointer select-none"
        >
          {/* Chest Image */}
          <img
            src={
              tapCount >= 3 || isExpanding || isBlasted
                ? CHEST_3RD_TAP_IMAGE
                : chestImage
            }
            alt="Treasure Chest"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = chestImage; }}
            className="w-48 h-48 sm:w-52 sm:h-52 object-contain drop-shadow-xl transition-all duration-200"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Flying Cookies Explosion */}
        <AnimatePresence>
          {isBlasted && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              {flyingCookies.map((c) => (
                <motion.div
                  key={`cookie-blast-${c.id}`}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                  animate={{
                    x: c.x,
                    y: c.y,
                    scale: c.scale,
                    opacity: [0, 1, 1, 0],
                    rotate: c.rotation
                  }}
                  transition={{
                    duration: 0.8,
                    ease: "easeOut"
                  }}
                  className="absolute w-9 h-9"
                >
                  <img
                    src={cookiesIcon}
                    alt="Cookie"
                    className="w-full h-full object-contain"
                  />
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Claim Reward Action */}
      <AnimatePresence>
        {isBlasted && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex flex-col items-center gap-3 mt-4 z-30 w-full"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-950 text-amber-300 font-display font-black text-xl sm:text-2xl shadow-md">
              <img src={cookiesIcon} alt="Cookies" className="w-7 h-7 object-contain" />
              <span>+{cookieCount.toLocaleString()} COOKIES!</span>
            </div>

            <button
              type="button"
              onClick={() => {
                soundManager.play('complete');
                if (onClaimComplete) onClaimComplete();
              }}
              className="w-full max-w-xs py-3 px-6 rounded-2xl bg-slate-950 text-amber-300 font-display font-black text-base uppercase tracking-wider shadow-md hover:bg-slate-900 active:scale-95 transition-all cursor-pointer"
            >
              COLLECT ALL COOKIES 🍪
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default InteractiveChestTapClaim;

