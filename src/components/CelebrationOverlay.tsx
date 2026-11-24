import React, { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCelebration, CelebrationEvent } from './CelebrationProvider';
import { Trophy, Star, Zap, Flame, Award, Sparkles } from 'lucide-react';
import cookiesIcon from '@/cookies.webp';
import { soundManager } from '../lib/sounds';
import ChestIcon from './ui/ChestIcon';
import InteractiveChestTapClaim from './InteractiveChestTapClaim';

// ----------------------------------------------------
// Smooth Counter Component (counts up during ring fill)
// ----------------------------------------------------
const SmoothCounter = memo(({ target, durationMs = 1000, prefix = "", suffix = "" }: { target: number; durationMs?: number; prefix?: string; suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let frameId: number;
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // easeOutCubic curve for smooth decelerating fill
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));

      if (progress < 1) {
        frameId = requestAnimationFrame(update);
      } else {
        setCount(target);
      }
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [target, durationMs]);

  return (
    <span>
      {prefix}
      {count}
      {suffix}
    </span>
  );
});
SmoothCounter.displayName = 'SmoothCounter';

// ----------------------------------------------------
// Reward Item Schema and Extractor
// ----------------------------------------------------
interface MicroReward {
  type: 'cookies' | 'xp' | 'streak' | 'trophy' | 'badge' | 'chest' | 'level' | 'generic';
  label: string;
  count?: number;
  prefix?: string;
  suffix?: string;
  title: string;
}

const parseMicroRewards = (event: CelebrationEvent): MicroReward[] => {
  const rewards: MicroReward[] = [];
  const text = `${event.rewardText || ''} ${event.title || ''} ${event.description || ''}`;
  const lowerTitle = (event.title || '').toLowerCase();

  // 1. Cookies
  let cookies = event.cookiesEarned ?? event.rewards?.cookies ?? null;
  if (cookies === null) {
    const match = text.match(/\+?(\d+)\s*(cookies|cookie|🍪)/i);
    if (match) cookies = parseInt(match[1], 10);
  }

  // 2. XP
  let xp = event.xpEarned ?? event.rewards?.xp ?? null;
  if (xp === null) {
    const match = text.match(/\+?(\d+)\s*(xp|⚡|experience)/i);
    if (match) xp = parseInt(match[1], 10);
  }

  // 3. Streak
  const streakMatch = text.match(/(\d+)\s*day\s*streak/i) || text.match(/streak\s*:?\s*(\d+)/i);
  const streakNum = streakMatch ? parseInt(streakMatch[1], 10) : null;

  // 4. Badge / Achievement
  const badge = event.badgeUnlocked ?? event.rewards?.badge ?? null;

  if (cookies !== null && cookies > 0) {
    rewards.push({
      type: 'cookies',
      count: cookies,
      prefix: '+',
      suffix: ' Cookies',
      label: `+${cookies} Cookies`,
      title: 'Cookies Earned'
    });
  }

  if (xp !== null && xp > 0) {
    rewards.push({
      type: 'xp',
      count: xp,
      prefix: '+',
      suffix: ' XP',
      label: `+${xp} XP`,
      title: 'XP Gained'
    });
  }

  if (streakNum !== null) {
    rewards.push({
      type: 'streak',
      count: streakNum,
      suffix: ' Day Streak!',
      label: `${streakNum} Day Streak!`,
      title: 'Streak Active 🔥'
    });
  } else if (lowerTitle.includes('streak') && rewards.length === 0) {
    rewards.push({
      type: 'streak',
      label: event.title || 'Streak Active!',
      title: 'Streak Milestone 🔥'
    });
  }

  if (badge) {
    rewards.push({
      type: 'badge',
      label: typeof badge === 'string' ? badge : 'Badge Unlocked!',
      title: 'Badge Unlocked 🏅'
    });
  }

  if (event.triggerType === 'new_rank' || lowerTitle.includes('rank') || lowerTitle.includes('trophy')) {
    if (!rewards.some(r => r.type === 'trophy')) {
      rewards.push({
        type: 'trophy',
        label: event.rewardText || 'New Rank Promoted!',
        title: event.title || 'Rank Up! 🏆'
      });
    }
  }

  if (event.triggerType === 'reward_box_opened' || lowerTitle.includes('chest') || lowerTitle.includes('box')) {
    if (rewards.length === 0) {
      rewards.push({
        type: 'chest',
        label: event.rewardText || 'Chest Unlocked!',
        title: 'Treasure Opened 🎁'
      });
    }
  }

  if (event.triggerType === 'level_up' || lowerTitle.includes('level')) {
    if (rewards.length === 0) {
      rewards.push({
        type: 'level',
        label: event.rewardText || 'Level Up!',
        title: event.title || 'Level Conquered ⭐'
      });
    }
  }

  // Fallback
  if (rewards.length === 0) {
    rewards.push({
      type: 'generic',
      label: event.rewardText || event.title || 'Reward Earned!',
      title: event.title || 'Milestone Complete ✨'
    });
  }

  return rewards;
};

// ----------------------------------------------------
// Single Full-Screen Item View (No Circular Ring Animation)
// ----------------------------------------------------
const SingleAchievementView = memo(({ reward }: { reward: MicroReward }) => {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCompleted(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const getTheme = (type: MicroReward['type']) => {
    switch (type) {
      case 'cookies':
        return {
          glowBg: 'bg-amber-400/30',
          icon: <img src={cookiesIcon} className="w-24 h-24 sm:w-28 sm:h-28 object-contain filter drop-shadow-lg" alt="Cookies" />,
          cheerText: "Sweet Cookie Bounty Unlocked! 🍪"
        };
      case 'xp':
        return {
          glowBg: 'bg-sky-400/30',
          icon: <Zap className="w-24 h-24 sm:w-28 sm:h-28 text-amber-400 fill-amber-400 drop-shadow-lg" />,
          cheerText: "High Voltage Brain Boost! ⚡"
        };
      case 'streak':
        return {
          glowBg: 'bg-orange-400/30',
          icon: <Flame className="w-24 h-24 sm:w-28 sm:h-28 text-orange-500 fill-orange-500 drop-shadow-lg" />,
          cheerText: "You're on Fire! Keep it up! 🔥"
        };
      case 'trophy':
        return {
          glowBg: 'bg-yellow-400/30',
          icon: <Trophy className="w-24 h-24 sm:w-28 sm:h-28 text-yellow-500 fill-yellow-400 drop-shadow-lg" />,
          cheerText: "New League Rank Conquered! 🏆"
        };
      case 'badge':
        return {
          glowBg: 'bg-fuchsia-400/30',
          icon: <Award className="w-24 h-24 sm:w-28 sm:h-28 text-fuchsia-500 fill-fuchsia-400 drop-shadow-lg" />,
          cheerText: "Milestone Badge Unlocked! 🏅"
        };
      case 'chest':
        return {
          glowBg: 'bg-emerald-400/30',
          icon: <ChestIcon className="w-24 h-24 sm:w-28 sm:h-28 text-emerald-500 drop-shadow-lg" />,
          cheerText: "Treasure Vault Opened! 🎁"
        };
      case 'level':
        return {
          glowBg: 'bg-purple-400/30',
          icon: <Star className="w-24 h-24 sm:w-28 sm:h-28 text-purple-500 fill-purple-400 drop-shadow-lg" />,
          cheerText: "Stage Mastered Flawlessly! ⭐"
        };
      default:
        return {
          glowBg: 'bg-indigo-400/30',
          icon: <Sparkles className="w-24 h-24 sm:w-28 sm:h-28 text-indigo-500 fill-indigo-400 drop-shadow-lg" />,
          cheerText: "Awesome Achievement! ✨"
        };
    }
  };

  const theme = getTheme(reward.type);

  return (
    <div className="flex flex-col items-center justify-center my-auto w-full relative z-10 px-4">
      
      {/* 1. PLAYFUL CHIKOO MASCOT & CHEERING SPEECH BUBBLE */}
      <motion.div
        initial={{ y: -20, opacity: 0, scale: 0.9 }}
        animate={{ y: [0, -6, 0], opacity: 1, scale: 1 }}
        transition={{ y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 0.3 } }}
        className="flex items-center justify-center gap-3 mb-6"
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 relative">
          <img
            src="https://i.postimg.cc/25yH51Xb/f6360331-4e16-48e0-bb04-72a556ee6596.webp"
            alt="Chikoo Celebrating"
            onError={(e) => { 
              const target = e.currentTarget as HTMLImageElement;
              if (!target.src.endsWith('/chikoo_interactive_completion.webp')) {
                target.src = '/chikoo_interactive_completion.webp';
              } else {
                target.src = '/lesson_completion_mascot.webp';
              }
            }}
            className="w-full h-full object-contain filter drop-shadow-md"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="bg-amber-100 border-2 border-amber-300 rounded-2xl py-2 px-3.5 shadow-sm relative">
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-amber-100 border-b-2 border-l-2 border-amber-300 transform rotate-45" />
          <p className="text-xs sm:text-sm font-extrabold text-amber-900 leading-tight">
            {theme.cheerText}
          </p>
        </div>
      </motion.div>

      {/* 2. ROTATING SUNBURST & BADGE (Circular SVG progress ring removed) */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center shrink-0">
        
        {/* Rotating Sunburst Rays */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 w-full h-full rounded-full opacity-25 pointer-events-none flex items-center justify-center"
        >
          <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-300 via-amber-200/50 to-transparent blur-xl" />
        </motion.div>

        {/* Soft background radial aura */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: completed ? [1, 1.25, 1.1] : [0.7, 1.1, 1], opacity: [0, 0.8, 0.45] }}
          transition={{ duration: 1.0, ease: "easeOut" }}
          className={`absolute w-full h-full rounded-full blur-3xl ${theme.glowBg} pointer-events-none`}
        />

        {/* Central Achievement Icon with Bouncy Pop */}
        <motion.div
          initial={{ scale: 0.1, opacity: 0, rotate: -20 }}
          animate={{ 
            scale: completed ? [1, 1.18, 1] : [0.1, 1.15, 1], 
            rotate: completed ? [0, -5, 5, 0] : [-20, 5, 0],
            opacity: 1 
          }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="relative z-10 flex items-center justify-center"
        >
          {theme.icon}
        </motion.div>
      </div>

      {/* 3. CONCISE PUNCHY TITLE AND VALUE */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="mt-6 flex flex-col items-center text-center px-4"
      >
        <span className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {reward.title}
        </span>
        <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
          {reward.count !== undefined ? (
            <SmoothCounter
              target={reward.count}
              prefix={reward.prefix}
              suffix={reward.suffix}
              durationMs={1000}
            />
          ) : (
            <span>{reward.label}</span>
          )}
        </div>
      </motion.div>
    </div>
  );
});
SingleAchievementView.displayName = 'SingleAchievementView';

// ----------------------------------------------------
// Main Celebration Overlay Component
// ----------------------------------------------------
function CelebrationOverlay() {
  const { activeCelebration, closeActiveCelebration, settings } = useCelebration();
  const [localEvent, setLocalEvent] = useState<CelebrationEvent | null>(null);

  useEffect(() => {
    if (activeCelebration) {
      setLocalEvent(activeCelebration);

      // Play audio cue based on reward type
      if (activeCelebration.triggerType === 'level_up' || activeCelebration.triggerType === 'new_rank') {
        soundManager.play('cheer');
      } else if (activeCelebration.triggerType === 'reward_box_opened') {
        soundManager.play('pop');
      } else {
        soundManager.play('complete');
      }
    } else {
      const timer = setTimeout(() => {
        setLocalEvent(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeCelebration]);

  if (!settings.enableCelebrations) return null;

  const rewards = localEvent ? parseMicroRewards(localEvent) : [];
  // Ensure ONLY ONE primary reward/achievement is shown
  const primaryReward = rewards.length > 0 ? rewards[0] : null;

  return (
    <AnimatePresence>
      {activeCelebration && localEvent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 select-none overflow-hidden"
        >
          {/* Always use InteractiveChestTapClaim for reward/cookie celebrations */}
          <InteractiveChestTapClaim
            cookieCount={primaryReward?.count || localEvent.cookiesEarned || 100}
            title={primaryReward?.title || localEvent.title || "TREASURE UNLOCKED!"}
            subtitle={localEvent.description || "Tap 3 times to crack open the treasure chest!"}
            onClaimComplete={() => {
              closeActiveCelebration();
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default memo(CelebrationOverlay);
