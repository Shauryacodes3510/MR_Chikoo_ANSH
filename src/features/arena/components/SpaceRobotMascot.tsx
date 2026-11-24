import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';
import { Sparkles } from 'lucide-react';

const CHIKOO_IMAGE_URL = 'https://i.postimg.cc/26s9wx65/fd6286db-33fd-4145-9a55-4ca196446b6d-removebg-preview.png';

const CHIKOO_QUOTES = [
  "Let's do a challenge!",
  "Ready to test your AI brainpower? 🚀",
  "Think you can get 5/5 correct? 🧠",
  "Let's win some cookies! 🍪",
  "You've got this, Space Cadet! ⭐"
];

export const SpaceRobotMascot: React.FC<{
  onInteract?: () => void;
  className?: string;
}> = ({ onInteract, className = '' }) => {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isBouncing, setIsBouncing] = useState(false);

  const handleClick = () => {
    soundManager.play('pop');
    setQuoteIndex((prev) => (prev + 1) % CHIKOO_QUOTES.length);
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 500);
    if (onInteract) onInteract();
  };

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* Friendly Speech Bubble */}
      <motion.div
        key={quoteIndex}
        initial={{ opacity: 0, y: 8, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={handleClick}
        className="relative mb-2 cursor-pointer group"
      >
        <div className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl bg-slate-900/70 border border-white/20 backdrop-blur-md shadow-md text-center flex items-center justify-center gap-1.5">
          <p className="text-sm sm:text-base font-black text-white tracking-wide font-display">
            {CHIKOO_QUOTES[quoteIndex]}
          </p>
          <Sparkles size={14} className="text-amber-300 animate-spin" />
        </div>
        {/* Cute Bubble Pointer Arrow */}
        <div className="w-2.5 h-2.5 bg-slate-900/70 border-r border-b border-white/20 transform rotate-45 mx-auto -mt-1" />
      </motion.div>

      {/* Floating Chikoo Mascot */}
      <motion.div
        animate={{
          y: isBouncing ? [-22, 0] : [-8, 8, -8],
          rotate: isBouncing ? [-6, 6, 0] : [-1.5, 1.5, -1.5],
        }}
        transition={{
          y: isBouncing ? { duration: 0.35, ease: 'easeOut' } : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
          rotate: isBouncing ? { duration: 0.35 } : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleClick}
        className="relative cursor-pointer group flex flex-col items-center"
      >
        {/* Soft Starlight Celestial Aura - No purple, no neon */}
        <div className="absolute inset-0 bg-sky-200/15 blur-2xl rounded-full scale-110 -z-10" />

        {/* Chikoo Image */}
        <div className="w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)]">
          <img
            src={CHIKOO_IMAGE_URL}
            alt="Chikoo"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Chikoo Tag */}
        <div className="mt-1 text-center">
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-slate-900/50 border border-white/20 text-[11px] font-bold text-sky-100 tracking-wider shadow-sm">
            <span>CHIKOO</span>
            <span>✨</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
};
