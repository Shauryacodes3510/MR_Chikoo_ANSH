import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EnvironmentLessonNode from './EnvironmentLessonNode';
import { soundManager } from '../lib/sounds';

interface AdventureJourneyNodeProps {
  packId: string;
  packTopic: string;
  idx: number;
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  themeIcon: string;
  themeName: string;
  onClick: () => void;
}

export default function AdventureJourneyNode({
  packId,
  packTopic,
  idx,
  isCompleted,
  isCurrent,
  isLocked,
  themeIcon,
  themeName,
  onClick,
}: AdventureJourneyNodeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handlePress = () => {
    if (isLocked) {
      soundManager.play('incorrect');
      setShowTooltip(true);
      const timer = setTimeout(() => setShowTooltip(false), 2500);
      return () => clearTimeout(timer);
    } else {
      onClick();
    }
  };

  const state = isLocked ? 'locked' : isCompleted ? 'completed' : 'active';

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Speech bubble message above the node for locked attempts */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 20 }}
            className="absolute -top-16 bg-slate-900 text-white text-[10px] font-black px-3 py-2 rounded-2xl shadow-xl z-50 whitespace-nowrap border border-slate-700/50 flex items-center gap-1.5"
          >
            <span>🐶</span>
            <span>Chikoo says: Solve earlier lessons first!</span>
            <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45 border-r border-b border-slate-700/50" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Platform Learning Path Lesson Node */}
      <EnvironmentLessonNode
        biomeIdx={idx}
        state={state}
        size="md"
        isChallenge={true}
        onClick={handlePress}
      />
    </div>
  );
}
