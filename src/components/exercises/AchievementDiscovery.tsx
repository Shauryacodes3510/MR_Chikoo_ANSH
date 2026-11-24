import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Gift, ArrowRight } from 'lucide-react';
import { soundManager } from '../../lib/sounds';

interface RevealedReward {
  conceptTitle: string;
  emoji: string;
  definition: string;
  funFact: string;
}

interface AchievementDiscoveryProps {
  rewards: RevealedReward[];
  onSelect: (completed: boolean) => void;
  isChecked: boolean;
}

export default function AchievementDiscovery({
  rewards,
  onSelect,
  isChecked
}: AchievementDiscoveryProps) {
  const [openedChestIndex, setOpenedChestIndex] = useState<number | null>(null);

  const handleOpenChest = (idx: number) => {
    if (openedChestIndex !== null || isChecked) return;
    
    soundManager.play('complete');
    setOpenedChestIndex(idx);
    
    // Auto complete parent challenge state
    onSelect(true);
  };

  const selectedReward = openedChestIndex !== null ? rewards[openedChestIndex % rewards.length] : null;

  return (
    <div className="flex flex-col items-center space-y-6 w-full py-2">
      <div className="text-center space-y-1">
        <p className="text-xs font-black uppercase text-pink-500 tracking-widest flex items-center justify-center gap-1">
          <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
          <span>Interactive Treasure Hunt</span>
        </p>
        <h3 className="text-xl font-display font-black text-slate-800 leading-tight">
          Tap on a Mystery Chest to claim your daily concept artifact!
        </h3>
      </div>

      {/* Chest Options Row */}
      <div className="flex justify-center gap-6 py-4 w-full">
        {[0, 1, 2].map((idx) => {
          const isOpen = openedChestIndex === idx;
          const isSomeChestOpen = openedChestIndex !== null;

          return (
            <motion.button
              key={`achievement-chest-${idx}`}
              disabled={isSomeChestOpen}
              onClick={() => handleOpenChest(idx)}
              whileHover={!isSomeChestOpen ? { scale: 1.05, rotate: [0, -5, 5, 0] } : {}}
              whileTap={!isSomeChestOpen ? { scale: 0.95 } : {}}
              className={`flex flex-col items-center space-y-2 transition-all p-4 rounded-3xl relative cursor-pointer ${
                isOpen 
                  ? 'bg-amber-50 border-2 border-amber-400 shadow-lg' 
                  : isSomeChestOpen 
                    ? 'opacity-40 scale-90 duration-300' 
                    : 'bg-white border hover:bg-slate-50'
              }`}
            >
              {/* Floating glow ring behind open chest */}
              {isOpen && (
                <div className="absolute inset-0 bg-yellow-300/20 blur-xl rounded-full scale-110 pointer-events-none animate-pulse" />
              )}

              {/* Bouncing graphics */}
              <span className="text-5xl block animate-bounce" style={{ animationDelay: `${idx * 0.25}s` }}>
                {isOpen ? '🔓' : '🎁'}
              </span>

              <span className="text-[10px] font-black uppercase tracking-widest text-[#3b6447]">
                {isOpen ? 'Unlocked!' : `Chest #${idx + 1}`}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* revealed bonus info card with full rewards, sparkles, emojis, and facts */}
      <AnimatePresence>
        {selectedReward && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full bg-gradient-to-tr from-amber-50 to-orange-50 border-4 border-amber-200 rounded-3xl p-6 shadow-inner relative overflow-hidden flex flex-col items-center text-center space-y-4"
          >
            {/* Crown reward indicator */}
            <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center text-white border-2 border-white shadow-md">
              <Trophy className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <span className="text-3xl block py-1">{selectedReward.emoji}</span>
              <h4 className="text-xl font-display font-black text-amber-800 tracking-tight">
                {selectedReward.conceptTitle}
              </h4>
              <p className="text-xs font-black uppercase text-amber-500 tracking-wider">
                Daily Discovery Card Unlocked! (+50 XP Reward)
              </p>
            </div>

            <div className="bg-white border border-amber-100 p-4 rounded-2xl w-full">
              <p className="text-sm font-bold text-slate-700 leading-relaxed">
                "{selectedReward.definition}"
              </p>
            </div>

            <div className="text-xs font-semibold italic text-slate-500 max-w-xs leading-relaxed">
              💡 Fun Fact: {selectedReward.funFact}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
