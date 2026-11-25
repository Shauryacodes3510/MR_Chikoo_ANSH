import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, CheckCircle2, Clock, ArrowRight, X, 
  Copy, Trophy, ChevronDown, Check, ExternalLink, ArrowLeft,
  AlertCircle
} from 'lucide-react';
import cookiesIcon from '@/cookies.webp';
import { soundManager } from '../lib/sounds';
import { useCelebration } from './CelebrationProvider';
import { logChallengeCompletion, supabase, isSupabaseConfigured } from '../lib/supabase';
import CookieWheel from './CookieWheel';
import { rewardService, generateSpinReference } from '../lib/rewardService';
import { progressService } from '../lib/progressService';

export interface AIMission {
  id: string;
  title: string;
  shortTitle: string;
  icon: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cookiesReward: number;
  estimatedTime: string;
  description: string;
  objective: string;
  steps: string[];
  suggestedPrompt?: string;
  color: {
    bg: string;
    gradient: [string, string];
    border: string;
    badgeBg: string;
    text: string;
  };
}

export const AI_MISSIONS: AIMission[] = [
  {
    id: 'ai_art_director',
    title: 'AI Art Director',
    shortTitle: 'ART',
    icon: '🎨',
    difficulty: 'Easy',
    cookiesReward: 100,
    estimatedTime: '5 min',
    color: {
      bg: 'bg-rose-500',
      gradient: ['#f43f5e', '#e11d48'],
      border: 'border-rose-400',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
      text: 'text-rose-600',
    },
    description: 'Design a futuristic mascot or club logo using an AI image generator!',
    objective: 'Use an AI image tool (like Gemini, Bing Image Creator, or Canva AI) to generate a friendly mascot for your dream science club.',
    steps: [
      'Open any AI image tool (Gemini, ChatGPT, Bing Image Creator, or Canva AI).',
      'Enter a prompt like: "A friendly 3D cartoon owl wearing science goggles and holding a glowing beaker, vibrant colors".',
      'Generate 2 versions and select your favorite logo or mascot image!'
    ],
    suggestedPrompt: 'A friendly 3D cartoon robot wearing a lab coat and holding a glowing science beaker, Pixar style',
  },
  {
    id: 'science_fact_checker',
    title: 'Science Fact-Checker',
    shortTitle: 'FACTS',
    icon: '🔬',
    difficulty: 'Easy',
    cookiesReward: 120,
    estimatedTime: '5 min',
    color: {
      bg: 'bg-sky-500',
      gradient: ['#06b6d4', '#0284c7'],
      border: 'border-sky-400',
      badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
      text: 'text-sky-600',
    },
    description: 'Test AI’s knowledge with a tricky science riddle and verify its answer!',
    objective: 'Ask an AI assistant a curious science mystery and double-check its explanation against a real science textbook or quick search.',
    steps: [
      'Ask AI: "Why is the sky blue on Earth, but reddish-orange during sunset on Mars?"',
      'Read the explanation provided by the AI carefully.',
      'Fact-check one key term (e.g., Rayleigh scattering or dust particle refraction) to verify if AI got it right!'
    ],
    suggestedPrompt: 'Why is the sky blue on Earth, but reddish-orange on Mars? Explain in simple terms with 3 key facts.',
  },
  {
    id: 'personal_quiz_master',
    title: 'Personal Quiz Master',
    shortTitle: 'QUIZ',
    icon: '🧠',
    difficulty: 'Medium',
    cookiesReward: 150,
    estimatedTime: '7 min',
    color: {
      bg: 'bg-purple-600',
      gradient: ['#8b5cf6', '#6d28d9'],
      border: 'border-purple-400',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
      text: 'text-purple-600',
    },
    description: 'Train an AI chat tool to act as your personal quiz master on Space or Robotics!',
    objective: 'Prompt AI to quiz you one question at a time and give you helpful hints when you make a mistake.',
    steps: [
      'Prompt AI: "Act as a friendly science quiz master! Ask me 3 fun questions about Space, 1 question at a time."',
      'Answer the AI\'s questions in the chat and see how it scores your answers.',
      'If you get one wrong, ask AI: "Can you explain why that answer is correct in 1 sentence?"'
    ],
    suggestedPrompt: 'Act as a friendly quiz master! Ask me 3 fun multiple-choice questions about Space, 1 question at a time.',
  },
  {
    id: 'prompt_supercharger',
    title: 'Prompt Supercharger',
    shortTitle: 'PROMPT',
    icon: '⚡',
    difficulty: 'Medium',
    cookiesReward: 180,
    estimatedTime: '6 min',
    color: {
      bg: 'bg-amber-500',
      gradient: ['#f97316', '#ea580c'],
      border: 'border-amber-400',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
      text: 'text-amber-600',
    },
    description: 'Upgrade a basic 2-word prompt into a detailed, high-power AI prompt!',
    objective: 'Transform a weak prompt like "Explain energy" into a detailed master prompt with Role, Context, and Formatting.',
    steps: [
      'Start with a simple prompt: "Tell me about solar energy". Observe AI\'s generic answer.',
      'Now upgrade your prompt: "Act as a NASA engineer. Explain how solar panels power space satellites to a 10-year-old using 3 emojis and bullet points."',
      'Compare how much richer and more interesting the upgraded response is!'
    ],
    suggestedPrompt: 'Act as a NASA engineer. Explain how solar energy powers space satellites to a 10-year-old using 3 emojis and bullet points.',
  },
  {
    id: 'green_tech_brainstormer',
    title: 'Green Tech Brainstormer',
    shortTitle: 'GREEN',
    icon: '🌱',
    difficulty: 'Hard',
    cookiesReward: 200,
    estimatedTime: '8 min',
    color: {
      bg: 'bg-emerald-500',
      gradient: ['#10b981', '#0d9488'],
      border: 'border-emerald-400',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      text: 'text-emerald-600',
    },
    description: 'Co-invent an eco-friendly invention with AI to solve a plastic waste problem!',
    objective: 'Brainstorm creative green technology ideas with AI to reduce plastic pollution at school or home.',
    steps: [
      'Tell AI: "Help me brainstorm 3 creative eco-friendly inventions to reduce plastic bottle waste in school cafeteria."',
      'Pick your favorite invention idea and ask AI: "What materials and sensors would I need to build a prototype of this?"',
      'Give your eco-invention a cool name and catchphrase!'
    ],
    suggestedPrompt: 'Help me brainstorm 3 creative eco-friendly inventions to reduce plastic bottle waste in a school cafeteria.',
  },
  {
    id: 'ai_storyteller',
    title: 'AI Storyteller',
    shortTitle: 'STORY',
    icon: '📖',
    difficulty: 'Hard',
    cookiesReward: 220,
    estimatedTime: '10 min',
    color: {
      bg: 'bg-violet-600',
      gradient: ['#7c3aed', '#5b21b6'],
      border: 'border-violet-400',
      badgeBg: 'bg-violet-100 text-violet-800 border-violet-300',
      text: 'text-violet-600',
    },
    description: 'Co-write a short rhyming science story or song about gravity with AI!',
    objective: 'Collaborate with AI to co-write an adventurous 4-line rhyming poem or story about traveling to Jupiter.',
    steps: [
      'Ask AI: "Write a catchy 4-line rhyming poem about zero gravity while traveling on a rocket towards Jupiter\'s moon Europa."',
      'Ask AI to make line 3 extra funny or dramatic.',
      'Read your co-created science poem out loud!'
    ],
    suggestedPrompt: 'Write a catchy 4-line rhyming poem about zero gravity while traveling on a rocket towards Jupiter\'s moon Europa.',
  },
  {
    id: 'recipe_creator',
    title: 'Space Chef & Recipe Creator',
    shortTitle: 'CHEF',
    icon: '🍳',
    difficulty: 'Medium',
    cookiesReward: 250,
    estimatedTime: '6 min',
    color: {
      bg: 'bg-amber-500',
      gradient: ['#eab308', '#ca8a04'],
      border: 'border-amber-400',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
      text: 'text-amber-600',
    },
    description: 'Ask AI to invent a healthy space snack recipe using 3 pantry ingredients!',
    objective: 'Prompt AI to create a fun, astronaut-approved snack recipe with a futuristic name and prep steps.',
    steps: [
      'Pick 3 random ingredients from your kitchen (e.g. oats, bananas, peanut butter or honey).',
      'Ask AI: "Invent a 5-minute astronaut power snack recipe using oats, banana, and peanut butter. Give it a funny space name!"',
      'Review the recipe and ask AI for one bonus topping suggestion!'
    ],
    suggestedPrompt: 'Invent a 5-minute astronaut power snack recipe using oats, banana, and peanut butter. Give it a funny space name and 3 bullet steps!',
  },
  {
    id: 'mystery_challenge',
    title: 'Mystery AI Codebreaker',
    shortTitle: 'MYSTERY',
    icon: '🎁',
    difficulty: 'Hard',
    cookiesReward: 500,
    estimatedTime: '8 min',
    color: {
      bg: 'bg-fuchsia-600',
      gradient: ['#d946ef', '#c026d3'],
      border: 'border-fuchsia-400',
      badgeBg: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300',
      text: 'text-fuchsia-600',
    },
    description: 'Ask AI to generate a secret encrypted code or riddle and decode it!',
    objective: 'Prompt AI to encrypt a secret message using a Caesar Cipher or emoji code, then solve it.',
    steps: [
      'Prompt AI: "Create an encrypted secret code for the phrase \'SCIENCE IS MAGIC\'. Use numbers or emojis for letters."',
      'Try to decode the secret message in your notebook.',
      'Ask AI for 1 hint if you get stuck, then confirm if your solution is correct!'
    ],
    suggestedPrompt: 'Create a fun emoji secret cipher code for the message "SCIENCE IS MAGIC". Give me 1 hint.',
  }
];

const AI_TOOLS_LIST = [
  { name: 'ChatGPT', url: 'https://chatgpt.com', icon: '💬', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { name: 'Gemini', url: 'https://gemini.google.com', icon: '✨', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  { name: 'Claude', url: 'https://claude.ai', icon: '🔮', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
  { name: 'Copilot', url: 'https://copilot.microsoft.com', icon: '🧭', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { name: 'Canva AI', url: 'https://www.canva.com', icon: '🪄', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
];

interface AIMissionsProps {
  onClaimCookies?: (amount: number) => void;
  onQuestDetailsToggle?: (isOpen: boolean) => void;
}

export default function AIMissions({ onClaimCookies, onQuestDetailsToggle }: AIMissionsProps) {
  const celebration = useCelebration();

  // Challenge Flow States
  // Step 1: Unlocked celebration modal
  const [unlockedMission, setUnlockedMission] = useState<AIMission | null>(null);
  
  // Step 2: Dedicated Challenge Details page
  const [activeMission, setActiveMission] = useState<AIMission | null>(null);

  // Notify parent component when Quest Details page opens or closes to hide global navigation
  useEffect(() => {
    if (onQuestDetailsToggle) {
      onQuestDetailsToggle(!!activeMission);
    }
    return () => {
      if (onQuestDetailsToggle) {
        onQuestDetailsToggle(false);
      }
    };
  }, [activeMission, onQuestDetailsToggle]);
  
  // Persistent tracking & state helpers
  const [completedMissionIds, setCompletedMissionIds] = useState<string[]>([]);
  const [unlockedMissionIds, setUnlockedMissionIds] = useState<string[]>([]);
  const [recentlyUnlockedId, setRecentlyUnlockedId] = useState<string | null>(null);
  const [showCompletedSection, setShowCompletedSection] = useState<boolean>(false);
  const [wonCookieAmount, setWonCookieAmount] = useState<number>(0);
  const [activeSpinReference, setActiveSpinReference] = useState<string>('');
  const [showCatalog, setShowCatalog] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-dismiss spin reward error toast after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Load completed and unlocked missions from Supabase profile and database state
  useEffect(() => {
    const syncFromProfileAndDb = async () => {
      const profile = progressService.getProfile();
      const profileCompleted = profile?.completed_daily_challenges || [];
      
      let allCompleted = [...profileCompleted];

      if (isSupabaseConfigured && supabase && profile?.id) {
        try {
          const { data: userProgress } = await supabase
            .from('user_challenge_progress')
            .select('challenge_id, status')
            .eq('user_id', profile.id)
            .eq('status', 'completed');

          if (userProgress && userProgress.length > 0) {
            const dbCompletedIds = userProgress.map(p => p.challenge_id);
            allCompleted = Array.from(new Set([...allCompleted, ...dbCompletedIds]));
          }
        } catch (dbErr) {
          console.warn('[AIMissions] Could not fetch challenge progress from db:', dbErr);
        }
      }

      setCompletedMissionIds(prev => Array.from(new Set([...prev, ...allCompleted])));
    };

    syncFromProfileAndDb();
    const unsub = progressService.subscribe(() => {
      syncFromProfileAndDb();
    });

    // Default starter unlocked missions: first 2 missions
    setUnlockedMissionIds(prev => {
      if (prev.length === 0) {
        return [AI_MISSIONS[0].id, AI_MISSIONS[1].id];
      }
      return prev;
    });

    return () => unsub();
  }, []);

  const validMissionIds = useMemo(() => new Set(AI_MISSIONS.map(m => m.id)), []);

  // Filter completed missions to only those that belong to the 8 AI missions to prevent impossible counts like 29/8
  const completedCount = useMemo(() => {
    return completedMissionIds.filter(id => validMissionIds.has(id)).length;
  }, [completedMissionIds, validMissionIds]);

  // Active / Unlocked challenges that are NOT completed yet
  const activeMissionsList = useMemo(() => {
    return AI_MISSIONS.filter(
      m => unlockedMissionIds.includes(m.id) && !completedMissionIds.includes(m.id)
    );
  }, [unlockedMissionIds, completedMissionIds]);

  // Completed challenges
  const completedMissionsList = useMemo(() => {
    return AI_MISSIONS.filter(
      m => completedMissionIds.includes(m.id)
    );
  }, [completedMissionIds]);

  // 1. Wheel spin finish handler -> Immediately awards spin cookies and unlocks the challenge
  const handleWheelSpinEnd = async (wonSlice: any) => {
    const mIdx = wonSlice.missionIndex ?? 0;
    const mission = AI_MISSIONS[mIdx] || AI_MISSIONS[0];
    const spinRef = generateSpinReference();
    const wonAmount = Number(wonSlice.amount || 100);
    
    setWonCookieAmount(wonAmount);
    setActiveSpinReference(spinRef);
    
    // Add to unlockedMissionIds persistently so it appears in 'My Challenges'
    setUnlockedMissionIds(prev => {
      if (!prev.includes(mission.id)) {
        return [...prev, mission.id];
      }
      return prev;
    });

    setRecentlyUnlockedId(mission.id);

    // Atomically claim the wheel spin reward directly
    try {
      const claimRes = await rewardService.claimWheelSpin(spinRef, wonAmount, { missionId: mission.id });
      if (claimRes.granted) {
        if (onClaimCookies) {
          onClaimCookies(wonAmount);
        }
      } else {
        setErrorMessage("Could not claim spin reward. Please check your connection and try again.");
      }
    } catch (err) {
      console.warn('[AIMissions] Spin reward claim error:', err);
      setErrorMessage("Could not claim spin reward. Please check your connection and try again.");
    }

    // Step 1: Show Challenge Unlocked celebration
    setUnlockedMission(mission);
    soundManager.play('complete');
  };

  // 2. Click "View Challenge" from Step 1 -> Opens Mission Details Screen
  const handleViewChallenge = (mission: AIMission) => {
    soundManager.play('pop');
    setUnlockedMission(null);
    setActiveMission(mission);
  };

  // Open any mission directly
  const handleOpenMission = (mission: AIMission) => {
    soundManager.play('click');
    setActiveMission(mission);
  };

  // Mark mission complete with idempotent, single reward logic
  const handleConfirmCompletion = async () => {
    if (!activeMission) return;

    const missionId = activeMission.id;
    const completedMission = activeMission;
    // Challenge completion awards the mission's defined cookie reward (e.g. 50 cookies)
    const missionRewardCookies = activeMission.cookiesReward || 50;

    soundManager.play('complete');

    // 1. Update completed state
    const updatedCompleted = Array.from(new Set([...completedMissionIds, missionId]));
    setCompletedMissionIds(updatedCompleted);

    if (recentlyUnlockedId === missionId) {
      setRecentlyUnlockedId(null);
    }

    setActiveMission(null);

    // 2. Claim challenge reward transactionally (Idempotent)
    try {
      const claimRes = await rewardService.claimChallenge(missionId, missionRewardCookies);
      if (claimRes.granted) {
        if (onClaimCookies) {
          onClaimCookies(missionRewardCookies);
        }

        // Trigger single celebration for challenge mastery
        if (celebration && celebration.triggerCelebration) {
          celebration.triggerCelebration('challenge_complete', {
            title: '🎉 Quest Mastered!',
            description: `You completed '${completedMission.title}'! Great job applying AI skills.`,
            rewardText: `+${missionRewardCookies} Cookies 🍪`
          });
        }
      }

      // Persist in background
      const profile = progressService.getProfile();
      const userEmail = profile?.email || 'anonymous';
      await logChallengeCompletion(userEmail, missionId, 100, missionRewardCookies);
      await progressService.updateProfileData({
        completed_daily_challenges: updatedCompleted
      });
    } catch (err) {
      console.warn('[AIMissions] Challenge completion persistence error:', err);
    }
  };

  const handleCloseModal = () => {
    soundManager.play('click');
    setActiveMission(null);
    setUnlockedMission(null);
  };

  return (
    <div className="w-full space-y-6 text-left max-w-2xl mx-auto pb-10 font-sans relative">
      {/* Toast Error Alert */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999999] max-w-md w-[92%] sm:w-auto bg-rose-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border border-rose-400 font-sans"
          >
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
              <AlertCircle size={18} className="shrink-0 text-rose-200" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shrink-0 text-white/80 hover:text-white"
              aria-label="Close error"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 1. COOKIE WHEEL BANNER & INTERACTIVE SPIN ASSEMBLY */}
      <div className="w-full flex items-center justify-center pt-[20px] pb-2">
        <CookieWheel
          slices={[
            { id: 'm0', amount: 100, label: '100 🍪', colorGradient: ['#f43f5e', '#e11d48'], missionIndex: 0 },
            { id: 'm1', amount: 120, label: '120 🍪', colorGradient: ['#06b6d4', '#0284c7'], missionIndex: 1 },
            { id: 'm2', amount: 150, label: '150 🍪', colorGradient: ['#8b5cf6', '#6d28d9'], missionIndex: 2 },
            { id: 'm3', amount: 180, label: '180 🍪', colorGradient: ['#f97316', '#ea580c'], missionIndex: 3 },
            { id: 'm4', amount: 200, label: '200 🍪', colorGradient: ['#3b82f6', '#1d4ed8'], missionIndex: 4 },
            { id: 'm5', amount: 220, label: '220 🍪', colorGradient: ['#10b981', '#047857'], missionIndex: 5 },
            { id: 'm6', amount: 250, label: '250 🍪', colorGradient: ['#6366f1', '#4338ca'], missionIndex: 6 },
            { id: 'm7', amount: 500, label: '500 🍪', isJackpot: true, colorGradient: ['#ec4899', '#be185d'], missionIndex: 7 },
          ]}
          onSpinEnd={handleWheelSpinEnd}
          showInternalModal={false}
        />
      </div>

      {/* ========================================================= */}
      {/* 2. MY CHALLENGES (PERSISTENT QUEST LOG HUB)               */}
      {/* ========================================================= */}
      <div className="space-y-4 pt-2">
        {/* Section Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 text-base">
              ⚔️
            </div>
            <div>
              <h2 className="text-lg font-black font-display text-slate-900 tracking-tight leading-none">
                My Challenges
              </h2>
              <p className="text-[11px] font-semibold text-slate-500 mt-1">
                Active quests & unlocked missions log
              </p>
            </div>
          </div>

          {/* Progress Counter Badge */}
          <div className="flex items-center gap-1.5 bg-amber-100/80 border border-amber-300/80 px-3 py-1 rounded-full text-xs font-black font-mono text-amber-900">
            <span>{completedCount}</span>
            <span className="text-amber-600">/</span>
            <span>{AI_MISSIONS.length}</span>
            <Trophy size={13} className="text-amber-600 ml-0.5" />
          </div>
        </div>

        {/* Active / Unlocked Challenges List */}
        <div className="space-y-2.5">
          {activeMissionsList.length > 0 ? (
            activeMissionsList.map((m) => {
              const isRecentlyUnlocked = m.id === recentlyUnlockedId;

              return (
                <motion.div
                  key={m.id}
                  whileHover={{ scale: 1.01, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOpenMission(m)}
                  className="group relative bg-white rounded-2xl p-3.5 border-2 border-slate-200/90 shadow-[0_4px_0_#e2e8f0] hover:border-amber-400 hover:shadow-[0_4px_0_#f59e0b] transition-all flex items-center justify-between gap-3 cursor-pointer overflow-hidden"
                >
                  {/* Left Colorful Icon */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-md ${m.color.bg} text-white border-2 border-white`}>
                    {m.icon}
                  </div>

                  {/* Middle Details */}
                  <div className="min-w-0 flex-1 space-y-1 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight leading-none group-hover:text-amber-600 transition-colors">
                        {m.title}
                      </h3>

                      {/* Status Badge */}
                      {isRecentlyUnlocked ? (
                        <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider font-mono animate-pulse">
                          <Sparkles size={10} className="text-purple-600" /> NEW
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider font-mono">
                          <Clock size={10} className="text-amber-700" /> IN PROGRESS
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-slate-500 line-clamp-1 leading-snug">
                      {m.description}
                    </p>

                    {/* Reward preview tag */}
                    <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg text-[11px] font-extrabold text-amber-900 font-mono">
                      <img src={cookiesIcon} alt="Cookies" className="w-3.5 h-3.5 object-contain" />
                      <span>+{m.cookiesReward} 🍪</span>
                    </div>
                  </div>

                  {/* Right Action CTA */}
                  <div className="shrink-0 flex items-center">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-[0_2px_0_#b45309] group-hover:bg-amber-600 transition-colors">
                      <ArrowRight size={18} className="stroke-[3]" />
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="p-6 bg-amber-50/60 border-2 border-dashed border-amber-200 rounded-2xl text-center space-y-2">
              <div className="text-3xl">🎡</div>
              <h3 className="font-extrabold text-sm text-slate-800">All Unlocked Quests Completed!</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Spin the wheel above to unlock new exciting AI challenges!
              </p>
            </div>
          )}
        </div>

        {/* Completed Challenges Section (Collapsible) */}
        {completedMissionsList.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => {
                soundManager.play('click');
                setShowCompletedSection(prev => !prev);
              }}
              className="w-full py-2.5 px-4 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/90 rounded-xl flex items-center justify-between text-emerald-900 font-extrabold text-xs transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>COMPLETED CHALLENGES ({completedMissionsList.length})</span>
              </span>
              <ChevronDown size={16} className={`text-emerald-700 transition-transform duration-200 ${showCompletedSection ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showCompletedSection && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden pt-2.5 space-y-2"
                >
                  {completedMissionsList.map((m) => (
                    <motion.div
                      key={m.id}
                      whileHover={{ scale: 1.005 }}
                      onClick={() => handleOpenMission(m)}
                      className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-200/80 flex items-center justify-between gap-3 cursor-pointer hover:bg-emerald-50 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${m.color.bg} text-white opacity-80`}>
                        {m.icon}
                      </div>

                      <div className="min-w-0 flex-1 text-left space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-xs text-slate-800 truncate">
                            {m.title}
                          </h4>
                          <span className="inline-flex items-center gap-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase font-mono shrink-0">
                            <Check size={10} className="stroke-[3]" /> DONE
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 truncate">
                          {m.description}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="text-[11px] font-black text-emerald-700 font-mono">
                          +{m.cookiesReward} 🍪
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* STEP 1: PREMIUM AAA GAME CHALLENGE UNLOCKED OVERLAY       */}
      {/* ========================================================= */}
      <AnimatePresence>
        {unlockedMission && !activeMission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setUnlockedMission(null)}
            className="fixed inset-0 z-[999999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto select-none"
          >
            {/* Ambient Background Radial Lights & Floating Particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
              <div className="w-[500px] h-[500px] rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-600/10 blur-[100px] animate-pulse" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(2,6,23,0.8)_100%)]" />
              
              {/* Floating Sparkle Rings */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute w-[420px] h-[420px] border border-amber-400/10 rounded-full pointer-events-none"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                className="absolute w-[320px] h-[320px] border border-dashed border-amber-400/20 rounded-full pointer-events-none"
              />
            </div>

            {/* Floating Celebration Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_50px_rgba(245,158,11,0.25)] border-2 border-amber-400/80 overflow-hidden text-center p-7 sm:p-8 space-y-6 my-auto"
            >
              {/* Top Card Subtle Light Sweep */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />

              {/* Header Badge */}
              <div className="relative inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest font-mono shadow-[0_4px_12px_rgba(245,158,11,0.4)] border border-amber-300/60">
                <Sparkles size={15} className="text-slate-950 animate-spin" />
                <span>🎉 CHALLENGE UNLOCKED</span>
              </div>

              {/* Visual Hero: Large Circular Glowing Container with Bouncing Icon */}
              <div className="relative py-2 flex items-center justify-center">
                {/* Glow rings behind icon */}
                <div className="absolute w-32 h-32 rounded-full bg-amber-500/30 blur-xl animate-pulse" />
                
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
                  className="relative z-10"
                >
                  <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center text-6xl sm:text-7xl shadow-[0_0_40px_rgba(245,158,11,0.5),0_10px_20px_rgba(0,0,0,0.4)] border-4 border-amber-300 ${unlockedMission.color.bg} text-white`}>
                    {unlockedMission.icon}
                  </div>
                </motion.div>
              </div>

              {/* Challenge Details */}
              <div className="space-y-2 relative z-10">
                <h3 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight leading-tight">
                  {unlockedMission.title}
                </h3>
                
                <p className="text-xs sm:text-sm font-semibold text-slate-300 max-w-xs mx-auto leading-relaxed">
                  {unlockedMission.description}
                </p>
              </div>

              {/* Reward Preview Chip */}
              <div className="relative z-10 inline-flex items-center justify-center gap-2 bg-amber-950/60 text-amber-300 px-4 py-2 rounded-2xl border border-amber-500/40 shadow-inner">
                <img src={cookiesIcon} alt="Cookies" className="w-5 h-5 object-contain" />
                <span className="text-xs sm:text-sm font-black font-mono tracking-wide">
                  +{unlockedMission.cookiesReward || 50} COOKIES REWARD
                </span>
              </div>

              {/* Single Large CTA: View Challenge */}
              <div className="relative z-10 pt-1">
                <button
                  onClick={() => handleViewChallenge(unlockedMission)}
                  className="w-full bg-gradient-to-r from-emerald-500 via-emerald-500 to-emerald-600 hover:brightness-110 active:bg-emerald-700 text-white font-black py-4 px-6 rounded-2xl text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-[0_5px_0_#047857,0_10px_20px_rgba(16,185,129,0.3)] active:translate-y-1 active:shadow-none transition-all cursor-pointer font-sans"
                >
                  <span>VIEW CHALLENGE</span>
                  <ArrowRight size={18} className="stroke-[3]" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* ULTRA-MINIMAL DUOLINGO-STYLE MISSION PAGE                */}
      {/* ========================================================= */}
      <AnimatePresence>
        {activeMission && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed inset-0 z-[999999] bg-slate-50 text-slate-900 flex flex-col justify-between items-center font-sans select-none overflow-y-auto pt-4 pb-5 px-4 sm:px-6"
          >
            {/* ---------------- TOP NAVIGATION BAR ---------------- */}
            <div className="w-full max-w-md flex items-center justify-between shrink-0 py-2.5 z-10">
              <button
                onClick={handleCloseModal}
                className="w-11 h-11 rounded-full bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-all active:scale-95 cursor-pointer"
                title="Back to Quests"
              >
                <ArrowLeft size={22} />
              </button>

              <span className="text-xs font-black uppercase tracking-widest text-slate-400 font-mono">
                MISSION
              </span>

              <div className="w-11 h-11" />
            </div>

            {/* ---------------- CENTERED DUOLINGO-STYLE CARD ---------------- */}
            <div className="flex-1 w-full max-w-md flex flex-col items-center justify-center text-center my-auto py-6 px-1">
              <div className="w-full bg-white border border-slate-200/80 rounded-[2.5rem] p-6 sm:p-10 shadow-2xl shadow-slate-200/60 flex flex-col items-center text-center space-y-6 my-auto">
                
                {/* Large Mission Illustration */}
                <motion.div
                  initial={{ scale: 0.85, rotate: -4 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative"
                >
                  <div className={`w-32 h-32 sm:w-40 sm:h-40 rounded-[2.25rem] flex items-center justify-center text-7xl sm:text-8xl shadow-2xl ${activeMission.color.bg} text-white border-4 border-white`}>
                    {activeMission.icon}
                  </div>
                </motion.div>

                {/* Title & Short Description */}
                <div className="space-y-2 pt-2">
                  <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-slate-900 leading-tight">
                    {activeMission.title}
                  </h1>

                  <p className="text-sm sm:text-base font-semibold text-slate-500 max-w-xs mx-auto leading-relaxed">
                    {activeMission.description}
                  </p>
                </div>

              </div>
            </div>

            {/* ---------------- STICKY / BOTTOM PRIMARY BUTTON ---------------- */}
            <div className="w-full max-w-md shrink-0 pt-4 pb-3 px-1 z-10 mt-auto">
              {completedMissionIds.includes(activeMission.id) ? (
                <button
                  disabled
                  className="w-full bg-emerald-100 text-emerald-800 border-2 border-emerald-300 font-black py-4 px-6 rounded-2xl text-base uppercase tracking-wider flex items-center justify-center gap-2 font-sans cursor-default shadow-xs"
                >
                  <Check size={22} className="stroke-[3.5]" />
                  <span>Completed ✓</span>
                </button>
              ) : (
                <button
                  onClick={handleConfirmCompletion}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black py-4 px-6 rounded-2xl text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_5px_0_#047857] active:translate-y-1 active:shadow-none transition-all cursor-pointer font-sans"
                >
                  <Check size={22} className="stroke-[3.5]" />
                  <span>Mark as Completed</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* BOTTOM QUEST CATALOG DRAWER                                */}
      {/* View all quests & open any quest details page              */}
      {/* ========================================================= */}
      <div className="pt-4 border-t border-slate-200">
        <button
          onClick={() => {
            soundManager.play('click');
            setShowCatalog(prev => !prev);
          }}
          className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200/80 rounded-2xl flex items-center justify-between text-slate-800 font-extrabold text-xs transition-all cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" />
            <span>VIEW ALL QUESTS ({completedCount}/{AI_MISSIONS.length} MASTERED)</span>
          </span>
          <ChevronDown size={16} className={`transition-transform ${showCatalog ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showCatalog && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden pt-3 space-y-2"
            >
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {AI_MISSIONS.map((m) => {
                  const isDone = completedMissionIds.includes(m.id);

                  return (
                    <div
                      key={m.id}
                      onClick={() => handleOpenMission(m)}
                      className={`p-3 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                        isDone
                          ? 'bg-emerald-50/80 border-emerald-200'
                          : 'bg-white border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                        isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100'
                      }`}>
                        {m.icon}
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5 text-left">
                        <div className="flex items-center gap-1">
                          <h4 className="font-extrabold text-xs text-slate-900 truncate">
                            {m.title}
                          </h4>
                          {isDone && <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />}
                        </div>
                        <span className="text-[10px] font-bold text-amber-700 font-mono">
                          +{m.cookiesReward} 🍪
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
