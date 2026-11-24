import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Check, X, ShieldAlert, ArrowRight, Zap, Target } from 'lucide-react';
import { soundManager } from '../lib/sounds';

interface QuestItem {
  id: 'comet' | 'daily_science_1' | 'daily_science_2';
  tabIcon: string;
  category: string;
  title: string;
  description: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  xpReward: number;
  rewardType: string;
  colorTheme: {
    bg: string;
    text: string;
    border: string;
    accent: string;
    badge: string;
  };
}

const QUESTS_DATA: QuestItem[] = [
  {
    id: 'comet',
    tabIcon: '🚀',
    category: 'DEEP SPACE',
    title: "Cosmic Comets",
    description: "Learn how solar heat evaporates cold icy comets in deep space.",
    question: "Why do massive comets develop a glowing vapor tail when they orbit close to our Sun?",
    options: [
      'Gravity squeezes the comet core until ice cubes fracture.',
      'Intense star heat vaporizes solid water ice blocks directly into streaming gas.',
      'The comet crashes into dense solar atmosphere dust rings.',
      'Star magnetic fields pull radioactive iron pebbles backwards.'
    ],
    correctAnswer: 'Intense star heat vaporizes solid water ice blocks directly into streaming gas.',
    explanation: "Frozen water ice directly transforms into vapor (sublimes) from intense solar heat, which solar winds push away into a majestic glowing tail!",
    xpReward: 100,
    rewardType: 'Medal',
    colorTheme: {
      bg: 'from-amber-50/70 to-orange-50/40',
      text: 'text-amber-900',
      border: 'border-amber-200/60',
      accent: 'bg-amber-100/70 text-amber-800',
      badge: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
    }
  },
  {
    id: 'daily_science_1',
    category: 'LIGHT PHYSICS',
    tabIcon: '🌍',
    title: 'Atmospheric Sky Riddle',
    description: 'Crack the riddle behind how light scatters around our sky.',
    question: "Why does the air look bright blue during a clear sunny afternoon?",
    options: [
      'The giant deep blue oceans reflect their liquid dye into the atmosphere.',
      'Small gas molecules scatter blue wavelength sunlight much more in all directions.',
      'Earth has an invisible blue glass lens filter floating in space.',
      'Vapor droplets freeze into thousands of blue paint flakes.'
    ],
    correctAnswer: 'Small gas molecules scatter blue wavelength sunlight much more in all directions.',
    explanation: "Rayleigh Scattering! Blue light waves are smaller and shorter, colliding and scattering with air particles much more than other colors!",
    xpReward: 50,
    rewardType: '+50 Cookies',
    colorTheme: {
      bg: 'from-sky-50/70 to-blue-50/40',
      text: 'text-blue-900',
      border: 'border-blue-200/60',
      accent: 'bg-blue-100 text-blue-800',
      badge: 'bg-gradient-to-r from-sky-500 to-blue-500 text-white'
    }
  },
  {
    id: 'daily_science_2',
    category: 'TECTONICS',
    tabIcon: '⛰️',
    title: 'Earth Crust Puzzle',
    description: 'Discover subterranean forces crawling miles beneath you.',
    question: "What giant rocky sheets carry moving continents across Earth's hot liquid mantle?",
    options: [
      'Tectonic Plates.',
      'Solid Granite Bedrock Blocks.',
      'Sunken forest root layers.',
      'Tornado friction currents.'
    ],
    correctAnswer: 'Tectonic Plates.',
    explanation: "Earth's outer rigid shell is fractured into huge tectonic puzzle slabs that slide and crawl atop the deeper molten mantle!",
    xpReward: 50,
    rewardType: '+50 Cookies',
    colorTheme: {
      bg: 'from-[#f5fbf7] to-emerald-50/20',
      text: 'text-emerald-900',
      border: 'border-emerald-200/50',
      accent: 'bg-emerald-100 text-emerald-800',
      badge: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
    }
  }
];

interface SpaceQuestsListProps {
  completedDailyChallenges: string[];
  cometQuestDone: boolean;
  onCompleteCometQuest: () => void;
  onCompleteDailyChallenge?: (challenge: any) => void;
  onTriggerConfetti: () => void;
  setView: (view: 'home' | 'leaderboard' | 'quests' | 'profile' | 'challenges' | 'practice' | 'rewards_store') => void;
}

export default function SpaceQuestsList({
  completedDailyChallenges,
  cometQuestDone,
  onCompleteCometQuest,
  onCompleteDailyChallenge,
  onTriggerConfetti,
  setView
}: SpaceQuestsListProps) {
  // Store expanded, current selections and local temporary feedbacks for each card
  const [expandedQuestId, setExpandedQuestId] = useState<'comet' | 'daily_science_1' | 'daily_science_2' | null>('comet');
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, { correct: boolean; msg: string }>>({});

  const handleSelectOption = (quest: QuestItem, option: string) => {
    const isDone = quest.id === 'comet' ? cometQuestDone : completedDailyChallenges.includes(quest.id);
    if (isDone) return;

    setSelections(prev => ({ ...prev, [quest.id]: option }));
    
    const isCorrect = option === quest.correctAnswer;
    if (isCorrect) {
      soundManager.play('complete');
      onTriggerConfetti();
      setFeedbacks(prev => ({
        ...prev,
        [quest.id]: { correct: true, msg: "Splendid choice! You mastered this cosmic myth! ⭐" }
      }));
      
      if (quest.id === 'comet') {
        onCompleteCometQuest();
      } else {
        onCompleteDailyChallenge?.({
          id: quest.id,
          title: quest.title,
          description: quest.description,
          question: quest.question,
          options: quest.options,
          correctAnswer: quest.correctAnswer,
          explanation: quest.explanation,
          xpReward: quest.xpReward,
          type: 'logic'
        });
      }
    } else {
      soundManager.play('incorrect');
      setFeedbacks(prev => ({
        ...prev,
        [quest.id]: { correct: false, msg: "Incorrect hypothesis! Try analyzing alternative physical clues. 🤔" }
      }));
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
          <h4 className="text-slate-800 text-xs font-black uppercase tracking-widest" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Daily Mission Cards
          </h4>
        </div>
        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-extrabold uppercase">
          Live Space Labs
        </span>
      </div>

      <div className="grid gap-3">
        {QUESTS_DATA.map((quest, qIdx) => {
          const isCompleted = quest.id === 'comet' ? cometQuestDone : completedDailyChallenges.includes(quest.id);
          const isExpanded = expandedQuestId === quest.id;
          const userSelection = selections[quest.id];
          const feedback = feedbacks[quest.id];
          const t = quest.colorTheme;

          return (
            <motion.div
              layout
              key={`space-quest-${quest.id || 'quest'}-${qIdx}`}
              className={`rounded-3xl border-2 overflow-hidden transition-all duration-300 bg-gradient-to-br ${t.bg} ${
                isExpanded ? 'border-amber-350 shadow-md scale-[1.01]' : `${t.border} shadow-3xs hover:scale-[1.005] hover:border-slate-300`
              }`}
            >
              {/* Header Header clickable bar wrapper */}
              <div
                onClick={() => {
                  soundManager.play('click');
                  setExpandedQuestId(isExpanded ? null : quest.id);
                }}
                className="p-4 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  {/* Circular Emoji Badge */}
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-2xs bg-white border border-slate-100`}>
                    {quest.tabIcon}
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-60 text-slate-500 block">
                      {quest.category}
                    </span>
                    <h5 className="font-extrabold text-[12.5px] text-slate-850 mt-0.5 leading-tight flex items-center gap-1.5">
                      {quest.title}
                      {isCompleted && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 rounded font-black">
                          ✓ DONE
                        </span>
                      )}
                    </h5>
                  </div>
                </div>

                {/* Reward & Chevron */}
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${t.accent}`}>
                    {quest.rewardType}
                  </span>
                  <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    className="text-slate-400"
                  >
                    <ArrowRight size={14} />
                  </motion.div>
                </div>
              </div>

              {/* Collapsible Options Block */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="border-t border-slate-100/80 bg-white/65 px-4 pb-4.5 pt-3"
                  >
                    <div className="space-y-3.5">
                      <div>
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">
                          Riddle Challenge
                        </p>
                        <p className="text-xs font-black text-slate-750 mt-1 leading-normal">
                          {quest.question}
                        </p>
                      </div>

                      {/* Interactive Option pills */}
                      <div className="grid gap-2">
                        {quest.options.map((opt, optIdx) => {
                          const isChosen = userSelection === opt;
                          const isCorrectChoice = opt === quest.correctAnswer;
                          const isSuccessChoice = isChosen && isCorrectChoice;
                          const isFailureChoice = isChosen && !isCorrectChoice;

                          let btnStyle = "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-350";
                          if (isCompleted && isCorrectChoice) {
                            btnStyle = "bg-emerald-50 border-emerald-300 text-emerald-800 font-black";
                          } else if (isSuccessChoice) {
                            btnStyle = "bg-emerald-50 border-emerald-300 text-emerald-800 font-black";
                          } else if (isFailureChoice) {
                            btnStyle = "bg-red-50 border-red-300 text-red-800 line-through decoration-red-200";
                          } else if (isChosen) {
                            btnStyle = "bg-amber-50 border-amber-300 text-amber-800";
                          }

                          return (
                            <button
                              key={`quest-${quest.id}-opt-${optIdx}-${opt.slice(0, 15)}`}
                              disabled={isCompleted}
                              onClick={() => handleSelectOption(quest, opt)}
                              className={`w-full py-2 px-3 rounded-xl border text-left text-[11px] font-bold transition-all active:scale-99 cursor-pointer flex items-center justify-between gap-3 leading-snug ${btnStyle}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] bg-slate-100 text-slate-500 w-4 h-4 rounded-md flex items-center justify-center shrink-0">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>
                              {isCompleted && isCorrectChoice && <Check size={12} className="text-emerald-600 shrink-0" />}
                              {!isCompleted && isSuccessChoice && <Check size={12} className="text-emerald-600 shrink-0" />}
                              {!isCompleted && isFailureChoice && <X size={12} className="text-red-500 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Show immediate active feedback with reasons */}
                      {feedback && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-3 rounded-xl text-xs font-bold leading-normal border flex gap-2 ${
                            feedback.correct 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                              : 'bg-amber-50/80 border-amber-200 text-amber-800'
                          }`}
                        >
                          <div className="mt-0.5">
                            {feedback.correct ? <Trophy size={14} className="text-amber-500" /> : <ShieldAlert size={14} className="text-amber-500" />}
                          </div>
                          <div>
                            <p>{feedback.msg}</p>
                            {feedback.correct && (
                              <p className="mt-1.5 text-[10.5px] text-emerald-700 font-medium leading-relaxed bg-white/50 p-2 rounded-lg border border-emerald-100">
                                <span className="font-extrabold text-[10px] tracking-wide text-emerald-900 uppercase block mb-0.5">Explanation:</span>
                                {quest.explanation}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* Default mastered screens */}
                      {isCompleted && !feedback && (
                        <div className="p-3 bg-emerald-50 border border-emerald-250/60 rounded-xl text-xs font-bold leading-normal text-emerald-800">
                          <span className="font-black text-[9.5px] uppercase tracking-wider block text-emerald-900 mb-1">
                            ✦ Mastered Science Code 
                          </span>
                          <p className="text-[10.5px] font-medium text-emerald-800/90 leading-relaxed">
                            {quest.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* practice launcher banner */}
      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 bg-[#f8fafc] p-3 rounded-2xl border border-slate-150">
        <span className="flex items-center gap-1.5 text-slate-600">
          <span>⚔️</span> Ready for real competition? Join the Battle Arena!
        </span>
        <button
          onClick={() => {
            soundManager.play('click');
            setView('practice');
          }}
          className="text-[#006b1b] font-black uppercase tracking-wider hover:underline cursor-pointer flex items-center gap-0.5"
        >
          Go Arena →
        </button>
      </div>
    </section>
  );
}
