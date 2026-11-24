import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, BookOpen, Flame, ArrowRight, CheckCircle2, Trophy, 
  Star, Zap, AlertCircle, Sparkles, Send, RefreshCw, 
  Heart, Gift, Compass, Check
} from 'lucide-react';
import { getChapter } from '../lib/curriculumLoader';
import { Chapter, MCQ } from '../lib/curriculumTypes';
import { soundManager } from '../lib/sounds';
import { domTranslator } from '../lib/translation/domTranslator';
import { getAdminAuthHeaders } from '../lib/supabase';

interface LessonStudyHubProps {
  lessonId: string;
  lessonTitle: string;
  lessonDescription: string;
  onClose: () => void;
  onStartQuiz: () => void;
  onEarnXp?: (xp: number) => void;
}

export default function LessonStudyHub({
  lessonId,
  lessonTitle,
  lessonDescription,
  onClose,
  onStartQuiz,
  onEarnXp
}: LessonStudyHubProps) {
  const chapter = getChapter(lessonId);
  
  // Linear Quest Steps:
  // 0: 🎬 Intro (Chikoo welcome)
  // 1: 🖼 Visual (Kid analogy & Unsplash photo)
  // 2: 🎮 Activity (Interactive perspectives / custom styles)
  // 3: 🎯 Challenge (Instant single MCQ concept checkpoint)
  // 4: 🎁 Reward (Chest unlock celebration & +30 XP claimed)
  // 5: 🏆 Victory (Reflection Summary, Chikoo chat, & Arena Entry)
  const [activeStep, setActiveStep] = useState<number>(0);
  
  // UI states
  const [activePromptMode, setActivePromptMode] = useState<'illustration' | 'educational' | 'infographic' | 'scenario'>('illustration');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [challengeAttempts, setChallengeAttempts] = useState(0);
  const [isCorrectSelection, setIsCorrectSelection] = useState<boolean | null>(null);
  
  // Game state
  const [isChestOpened, setIsChestOpened] = useState(false);
  const [xpClaimed, setXpClaimed] = useState(false);
  const [activityXpRewarded, setActivityXpRewarded] = useState(false);
  const [showTutorChat, setShowTutorChat] = useState(false);

  // Tutor chat states
  // Tutor chat states
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: `Hi friend! I'm Chikoo 🐶. Got any questions about today's topic? Explain it to me like I'm 10, ask for a video game analogy, or ask anything you like!` }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTutorLoading, setIsTutorLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTutorLoading, showTutorChat]);

  // Start background Chikoo music during study guide session
  useEffect(() => {
    soundManager.startLessonMusic();
    return () => {
      soundManager.stopLessonMusic(true);
    };
  }, []);

  // Automatically trigger dynamic on-screen translation for study hub content
  useEffect(() => {
    if (typeof window !== 'undefined') {
      domTranslator.debouncedTranslateScreen(15);
    }
  }, [activeStep, messages, challengeCompleted]);

  // Handle Tutor messages
  const handleSendTutorQuery = async () => {
    if (!userInput.trim() || isTutorLoading) return;

    soundManager.play('click');
    const userMessage = userInput.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setUserInput('');
    setIsTutorLoading(true);

    try {
      const headers = await getAdminAuthHeaders();
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          problemId: lessonId,
          title: chapter?.title || lessonTitle,
          message: userMessage,
          history: messages
        })
      });

      const data = await response.json();
      if (response.ok && data.response) {
        setMessages(prev => [...prev, { role: 'model', text: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: data.error || "Chikoo had a minor static glitch! Verify your internet setup or API configuration." }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: "Hmm, Chikoo lost network for a second. Let's try again!" }]);
    } finally {
      setIsTutorLoading(false);
    }
  };

  // Helper to make dry topics feel extremely fun, visual-first, and narrative based
  const getKidsFriendlyExplanation = () => {
    const titleLower = (chapter?.title || lessonTitle).toLowerCase();
    
    if (titleLower.includes("phone") || titleLower.includes("recommend") || titleLower.includes("knows")) {
      return {
        story: "🤖 Every morning you open YouTube and see videos you secretly love. How?",
        explanation: "Your phone plays the role of a detective, noticing every clip you watch, skip, or share. It finds your unique visual habits. That is how the AI recommendation pattern works!",
        analogy: "Like a friend who notices you order mango ice cream every Saturday, and gets it ready for you."
      };
    }
    if (titleLower.includes("face") || titleLower.includes("recogni") || titleLower.includes("spot")) {
      return {
        story: "📸 How does your phone camera instantly draw yellow rings on faces?",
        explanation: "AI studied millions of regular human pictures. It learned that humans have two ears, two eyes, and one mouth positioned carefully. It automatically spots that pattern anywhere!",
        analogy: "Like tracing a cookie cutter over dough to find cookies."
      };
    }
    if (titleLower.includes("listen") || titleLower.includes("voice") || titleLower.includes("siri") || titleLower.includes("alexa")) {
      return {
        story: "🗣️ How does Siri or Google make sense of your messy whispers?",
        explanation: "The assistant chops your voice waves into thousands of puzzle pieces and matches them with words in its virtual dictionaries. Over time, it learns your unique speech vibe!",
        analogy: "Like translating sound keys into dictionary text."
      };
    }
    if (titleLower.includes("traffic") || titleLower.includes("map") || titleLower.includes("navigation")) {
      return {
        story: "🗺️ How does Google Maps know there's a slow traffic jam ahead?",
        explanation: "Google Maps listens to anonymous speed beacons from thousands of students' phones moving on that same road. If all phones move like snails, it colors the road bright red!",
        analogy: "Seeing a line of ants walking slowly around a puddle."
      };
    }
    if (titleLower.includes("wallet") || titleLower.includes("money") || titleLower.includes("saf")) {
      return {
        story: "🔒 How does online payment security catch midnight hackers?",
        explanation: "The shield builds a portrait of your habitual spending (for example, ₹30 snack payments). If ₹40,000 is suddenly sent to a foreign country, Chikoo rings the alarm!",
        analogy: "A watchdog barking instantly when someone climbs over the back fence."
      };
    }

    // Default fallback simple children analogies
    return {
      story: `💎 Let's discover the secret tricks of ${chapter?.title || lessonTitle}!`,
      explanation: chapter?.lessonContent && chapter.lessonContent.length < 130 
        ? chapter.lessonContent 
        : "AI acts like a smart digital puppy. It learns how to sit, fetch, or spot items purely by looking at examples and receiving scores!",
      analogy: "Just like students master coding levels through continuous practice and dynamic quizzes!"
    };
  };

  const friendlyText = getKidsFriendlyExplanation();

  const handleNextStep = () => {
    soundManager.play('click');
    setActiveStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    soundManager.play('click');
    setActiveStep(prev => Math.max(0, prev - 1));
  };

  // Stepper icon map
  const STEPPER_ICONS = [
    { label: 'Start', emoji: '🎬' },
    { label: 'Show', emoji: '🖼' },
    { label: 'Play', emoji: '🎮' },
    { label: 'Check', emoji: '🎯' },
    { label: 'Chest', emoji: '🎁' },
    { label: 'Map', emoji: '🏆' }
  ];

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 26, stiffness: 190 }}
      className="absolute inset-x-0 bottom-0 top-0 bg-[#ddffe2] dark:bg-[#0b0f19] flex flex-col z-[350] max-w-[430px] mx-auto overflow-hidden text-slate-800 dark:text-slate-100 transition-colors"
    >
      {/* Scrollable Container */}
      <div className="flex-1 flex flex-col h-full bg-[#f4fff6] dark:bg-[#0e1424] relative transition-colors">
        
        {/* Navigation Header */}
        <header className="px-5 py-3.5 bg-white dark:bg-[#172033] border-b border-[#bef5ca] dark:border-slate-800 shadow-xs flex items-center justify-between shrink-0 transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐶</span>
            <div className="min-w-0">
              <h2 className="text-xs font-black text-emerald-800 dark:text-emerald-400 leading-tight truncate">
                {chapter?.title || lessonTitle}
              </h2>
              <p className="text-[10px] text-gray-500 dark:text-slate-400 font-extrabold uppercase tracking-wide flex items-center gap-1">
                <span>QUEST MISSION {activeStep + 1}/6</span>
                <span className="bg-[#ddffe2] dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-1 py-0.2 rounded-sm text-[8px] font-black border border-emerald-300/40 dark:border-emerald-700/50">Beginner AI</span>
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              soundManager.play('click');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#243149] hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-gray-500 dark:text-slate-300 transition-colors cursor-pointer border border-transparent dark:border-slate-700"
          >
            <X size={15} />
          </button>
        </header>

        {/* GAMIFIED STEPPER TIMELINE */}
        <div className="bg-white dark:bg-[#172033] px-4 py-2 border-b border-emerald-50 dark:border-slate-800 shadow-xs flex items-center justify-between shrink-0 gap-1 select-none transition-colors">
          {STEPPER_ICONS.map((step, idx) => {
            const isCompleted = idx < activeStep;
            const isActive = idx === activeStep;
            
            return (
              <div key={`stepper-icon-${step.label || idx}-${idx}`} className="flex-1 flex items-center gap-1">
                <button
                  onClick={() => {
                    // Allow navigating back and forth freely through completed or current steps
                    if (idx <= activeStep || challengeCompleted) {
                      soundManager.play('click');
                      setActiveStep(idx);
                    }
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all relative cursor-pointer ${
                    isActive 
                      ? 'bg-yellow-400 border-2 border-yellow-500 scale-110 shadow-md animate-pulse'
                      : isCompleted
                        ? 'bg-emerald-500 text-white border-2 border-emerald-600 scale-95'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
                  }`}
                  title={step.label}
                >
                  <span className="relative z-10">{isCompleted ? '✓' : step.emoji}</span>
                  {isActive && (
                    <motion.span 
                      layoutId="active-step-glow"
                      className="absolute inset-0 rounded-full bg-yellow-400/50 -z-0 scale-125"
                    />
                  )}
                </button>
                {idx < STEPPER_ICONS.length - 1 && (
                  <div className={`flex-1 h-1 rounded-full transition-all ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* CORE SCREEN QUEST SHELF */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-hide flex flex-col justify-between">
          <AnimatePresence mode="wait">
            
            {/* STEP 0: 🎬 STORY GREETING */}
            {activeStep === 0 && (
              <motion.div
                key="step-intro"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-5 my-auto flex flex-col items-center text-center"
              >
                {/* Large animated Chikoo bubble */}
                <div className="relative">
                  <motion.div 
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    className="w-24 h-24 bg-gradient-to-tr from-emerald-100 to-yellow-100 rounded-[2rem] flex items-center justify-center shadow-md border-4 border-white"
                  >
                    <span className="text-5xl">🐶</span>
                  </motion.div>
                  <span className="absolute -bottom-1 -right-1 bg-yellow-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-white shadow-sm flex items-center gap-0.5">
                    <Sparkles size={8} className="fill-current text-white animate-spin" />
                    Coach Chikoo
                  </span>
                </div>

                <div className="bg-white dark:bg-[#172033] p-5 rounded-3xl border-2 border-emerald-100 dark:border-slate-700 shadow-xs relative max-w-[320px] transition-colors">
                  {/* Speech bubble arrow */}
                  <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-[#172033] rotate-45 border-l-2 border-t-2 border-emerald-100/50 dark:border-slate-700" />
                  
                  <p className="text-sm sm:text-base font-black text-emerald-800 dark:text-emerald-300 leading-snug">
                    "Woof! Let's conquer our smart gadget quest together, human learner! Want to discover the hidden magic behind your screens?"
                  </p>
                </div>

                {/* Catchy intro badge */}
                <div className="bg-white dark:bg-[#172033] px-5 py-4 rounded-[2rem] border border-gray-150 dark:border-slate-700 shadow-sm w-full space-y-1.5 transition-colors">
                  <span className="text-[9px] font-black tracking-wider text-rose-500 uppercase flex items-center justify-center gap-1">
                    <img src="/streak.webp" alt="Streak" className="w-3.5 h-3.5 object-contain animate-pulse" />
                    Quest Mission Unlocked!
                  </span>
                  <h3 className="text-base font-black text-slate-800 dark:text-white leading-tight">
                    {chapter?.title?.replace(/Module \d\.\d:?/i, '') || lessonTitle}
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-slate-300 font-extrabold max-w-[240px] mx-auto leading-relaxed">
                    {chapter?.description || lessonDescription}
                  </p>
                </div>

                <button
                  onClick={handleNextStep}
                  className="w-full bg-[#58cc02] hover:bg-[#46a302] active:scale-95 text-white font-black text-sm py-4 px-6 rounded-2xl shadow-[0_4px_0_#3c8d01] transition-transform flex items-center justify-center gap-1 cursor-pointer"
                >
                  Start Discovery 🎬
                  <ArrowRight size={14} />
                </button>
              </motion.div>
            )}

            {/* STEP 1: 🖼 VISUAL REALITY EXPLANATION */}
            {activeStep === 1 && (
              <motion.div
                key="step-visual"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-4 my-auto flex flex-col justify-center"
              >
                {/* High Contrast Visual Card (Image First) */}
                <div className="bg-white dark:bg-[#172033] p-3 rounded-[2rem] border border-gray-150 dark:border-slate-700 shadow-sm space-y-3 relative overflow-hidden group transition-colors">
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-orange-50/50 dark:bg-slate-900 border border-orange-100 dark:border-slate-700 flex items-center justify-center">
                    {chapter?.imageMetadata?.illustrationUrl ? (
                      <img 
                        src={chapter.imageMetadata.illustrationUrl} 
                        alt="Visual Explanation" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="p-6 text-center space-y-2">
                        <Trophy size={40} className="mx-auto text-yellow-400" />
                        <span className="text-[10px] font-black text-rose-500">Retrieving quest visuals...</span>
                      </div>
                    )}
                    
                    <div className="absolute top-2 left-2 bg-[#ff9000] text-white text-[8px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                      <Zap size={9} className="fill-current text-white" />
                      Visual Mode
                    </div>
                  </div>

                  {/* 1-2 sentence real-life comparison explanation */}
                  <div className="space-y-1.5 px-1 py-1">
                    <span className="text-[9px] font-black uppercase text-orange-600 dark:text-orange-400 block tracking-wider">🔬 Kid Analogy</span>
                    <p className="text-xs font-black text-slate-800 dark:text-white leading-snug">
                      {friendlyText.story}
                    </p>
                    <p className="text-[11px] font-bold text-gray-500 dark:text-slate-300 leading-relaxed">
                      {friendlyText.explanation}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handlePrevStep}
                    className="w-16 bg-white dark:bg-[#243149] border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 text-xs font-black rounded-xl transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="flex-1 bg-[#58cc02] hover:bg-[#46a302] active:scale-95 text-white font-black text-sm py-4 px-6 rounded-2xl shadow-[0_4px_0_#3c8d01] transition-transform flex items-center justify-center gap-1"
                  >
                    Go Play! 🎮
                    <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: 🎮 INTERACTIVE VIEWMODE DISCOVERY */}
            {activeStep === 2 && (
              <motion.div
                key="step-activity"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="space-y-4 my-auto flex flex-col justify-center"
              >
                <div className="bg-[#effef1] dark:bg-[#172033] p-4 rounded-3xl border-2 border-[#bef5ca] dark:border-slate-700 shadow-xs space-y-3 transition-colors">
                  <div className="flex items-center justify-between text-[10px] font-extrabold text-[#006b1b] dark:text-emerald-400">
                    <span className="uppercase tracking-wider">🎮 Mission: Explore Perspectives</span>
                    <span className="bg-emerald-200 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded text-[8px] font-black border border-emerald-300/40 dark:border-emerald-700/50">PLAYGROUND</span>
                  </div>

                  <p className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 leading-snug">
                    Tap the lens styles below to see how our AI system models this concept inside Chikoo's system!
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { mode: 'illustration', label: '🎨 Art Scene', icon: '🎨' },
                      { mode: 'educational', label: '🔍 Schematic', icon: '🔍' },
                      { mode: 'infographic', label: '📊 Infographic', icon: '📊' },
                      { mode: 'scenario', label: '📖 Story Visual', icon: '📖' }
                    ].map((item) => {
                      const isActive = activePromptMode === item.mode;
                      return (
                        <button
                          key={item.mode}
                          onClick={() => {
                            soundManager.play('click');
                            setActivePromptMode(item.mode as any);
                          }}
                          className={`text-left p-2.5 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isActive
                              ? 'bg-[#86faac] dark:bg-emerald-800/80 text-[#004d19] dark:text-emerald-100 border-[#006b1b] dark:border-emerald-500 shadow-sm transform scale-[0.98]'
                              : 'bg-white dark:bg-[#243149] text-gray-500 dark:text-slate-300 hover:text-gray-800 dark:hover:text-white border-gray-150 dark:border-slate-700'
                          }`}
                        >
                          <span className="text-sm shrink-0">{item.icon}</span>
                          <span className="font-black">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Prompt dynamic description */}
                  <div className="bg-white/70 dark:bg-[#0e1424] p-3 rounded-2xl border border-emerald-100 dark:border-slate-700 text-[10px] font-extrabold text-[#004e12] dark:text-emerald-300 leading-relaxed italic transition-colors">
                    {chapter?.imageMetadata?.prompts ? (
                      activePromptMode === 'illustration' ? chapter.imageMetadata.prompts.illustration :
                      activePromptMode === 'educational' ? chapter.imageMetadata.prompts.educational :
                      activePromptMode === 'infographic' ? chapter.imageMetadata.prompts.infographic :
                      chapter.imageMetadata.prompts.scenario
                    ) : (
                      "A futuristic smart machine detecting objects in simple blocks."
                    )}
                  </div>
                </div>

                {/* Validation point */}
                <div className="bg-white dark:bg-[#172033] p-3 rounded-2xl border border-gray-100 dark:border-slate-700 flex items-center justify-between gap-2 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⭐</span>
                    <div>
                      <div className="text-[10px] font-black uppercase text-slate-400">Bonus Reward</div>
                      <div className="text-xs font-black text-indigo-950 dark:text-white">Claim Exploration +10 Cookies</div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!activityXpRewarded) {
                        soundManager.play('complete');
                        if (onEarnXp) onEarnXp(10);
                        setActivityXpRewarded(true);
                      }
                    }}
                    disabled={activityXpRewarded}
                    className={`font-black text-[10px] uppercase px-3 py-2 rounded-xl border-b-2 shadow-sm transition-all cursor-pointer ${
                      activityXpRewarded 
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700 shadow-none cursor-default' 
                        : 'bg-yellow-400 border-yellow-600 text-yellow-950 hover:bg-yellow-500'
                    }`}
                  >
                    {activityXpRewarded ? 'Claimed ✓' : 'Claim +10 Cookies'}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handlePrevStep}
                    className="w-16 bg-white dark:bg-[#243149] border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 text-xs font-black rounded-xl transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="flex-1 bg-[#58cc02] hover:bg-[#46a302] active:scale-95 text-white font-black text-sm py-4 px-6 rounded-2xl shadow-[0_4px_0_#3c8d01] transition-transform flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Do Challenge! 🎯
                    <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: 🎯 INTERACTIVE CHALLENGE MCQS */}
            {activeStep === 3 && (
              <motion.div
                key="step-challenge"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4 my-auto flex flex-col justify-center"
              >
                {chapter?.mcqs && chapter.mcqs.length > 0 ? (
                  <div className="bg-[#f0fbff] dark:bg-[#172033] p-4.5 rounded-[2rem] border-2 border-[#bcecf2] dark:border-slate-700 shadow-xs space-y-4 transition-colors">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black uppercase text-[#016470] dark:text-sky-300 tracking-wider flex items-center gap-1.5">
                        🎯 Challenge Checkpoint
                      </h4>
                      <span className="bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 text-[8px] font-black px-2 py-0.5 rounded-full uppercase border border-sky-300/40 dark:border-sky-700/50">Tap Correct</span>
                    </div>

                    <p className="text-xs font-black text-indigo-950 dark:text-white leading-snug">
                      {chapter.mcqs[0].question}
                    </p>

                    <div className="space-y-2">
                      {chapter.mcqs[0].options.map((opt, idx) => {
                        const isSelected = selectedOption === opt;
                        const isCorrectAnswer = opt === chapter.mcqs[0].correctAnswer;
                        
                        let cardStyle = "bg-white dark:bg-[#243149] text-slate-700 dark:text-slate-200 border-gray-150 dark:border-slate-700 hover:bg-sky-50/50 dark:hover:bg-[#2e3e5c]";
                        if (isSelected) {
                          if (isCorrectSelection) {
                            cardStyle = "bg-[#d5ffdc] dark:bg-emerald-950/70 text-[#004e12] dark:text-emerald-200 border-[#006b1b] dark:border-emerald-500 shadow-[0_2px_0_#004e12]";
                          } else {
                            cardStyle = "bg-[#ffd5d5] dark:bg-rose-950/70 text-[#4e0000] dark:text-rose-200 border-[#920000] dark:border-rose-500 shadow-[0_2px_0_#920000]";
                          }
                        }

                        return (
                          <button
                            key={`study-opt-${idx}-${opt}`}
                            disabled={challengeCompleted}
                            onClick={() => {
                              setSelectedOption(opt);
                              setChallengeAttempts(prev => prev + 1);
                              const correct = isCorrectAnswer;
                              setIsCorrectSelection(correct);
                              if (correct) {
                                soundManager.play('complete');
                                setChallengeCompleted(true);
                              } else {
                                soundManager.play('incorrect');
                              }
                            }}
                            className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all text-xs font-extrabold leading-snug flex gap-2 cursor-pointer ${cardStyle}`}
                          >
                            <span className="shrink-0 text-slate-400">
                              {idx === 0 ? "🔵" : idx === 1 ? "🟢" : idx === 2 ? "🟡" : "🔴"}
                            </span>
                            <span className="flex-1">{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Feedback Explanation popup */}
                    <AnimatePresence>
                      {selectedOption && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className={`p-3.5 rounded-xl border text-[11px] font-black leading-relaxed space-y-1.5 ${
                            isCorrectSelection 
                              ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-[#005716] dark:text-emerald-300" 
                              : "bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-extrabold uppercase text-[10px]">
                            {isCorrectSelection ? (
                              <>
                                <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                                <span>Boom! Spot On</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle size={13} className="text-rose-600 dark:text-rose-400" />
                                <span>Try Another Concept Lens</span>
                              </>
                            )}
                          </div>
                          
                          {(() => {
                            const expObj = chapter.mcqs[0].explanation;
                            const expText = (typeof expObj === 'object' && expObj !== null ? expObj.text : expObj) as string;
                            return (
                              <p className="font-semibold">{isCorrectSelection ? expText : "Look closely at the story details above. Tap another choice to predict the logic!"}</p>
                            );
                          })()}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="text-center p-6 bg-white dark:bg-[#172033] rounded-3xl border border-gray-150 dark:border-slate-700">
                    <p className="text-xs font-black text-slate-500 dark:text-slate-400">Retrieving Quest parameters...</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handlePrevStep}
                    className="w-16 bg-white dark:bg-[#243149] border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 text-xs font-black rounded-xl transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNextStep}
                    disabled={!challengeCompleted}
                    className={`flex-1 font-black text-sm py-4 px-6 rounded-2xl border-b-4 transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      challengeCompleted 
                        ? 'bg-[#58cc02] hover:bg-[#46a302] text-white border-[#3c8d01] active:translate-y-0.5 active:shadow-sm' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-300 dark:border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    Lock Challenge! 🎁
                    <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: 🎁 BONUS REWARD CHEST */}
            {activeStep === 4 && (
              <motion.div
                key="step-chest"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-5 my-auto flex flex-col items-center text-center"
              >
                <div className="space-y-1.5">
                  <span className="text-amber-500 text-xs font-black uppercase tracking-wider block">MISSION CHEST ACHIEVED!</span>
                  <h3 className="text-xl font-black text-indigo-950 dark:text-white">Tap to Claim Dopamine!</h3>
                  <p className="text-[11px] text-gray-500 dark:text-slate-300 max-w-[260px] mx-auto leading-relaxed">
                    You validated the concept and interactive visuals. Open the mysterious chest to claim your progress tokens!
                  </p>
                </div>

                {/* Sparkling 3D Chest illustration with keyframe bouncy animation */}
                <div className="relative py-4 select-none">
                  {/* Bouncy glowing background */}
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                    className="absolute -inset-6 bg-[#fffdeb] dark:bg-amber-500/10 rounded-full blur-xl -z-10"
                  />
                  
                  <button
                    onClick={() => {
                      if (!isChestOpened) {
                        soundManager.play('complete');
                        setIsChestOpened(true);
                        if (onEarnXp && !xpClaimed) {
                          onEarnXp(30);
                          setXpClaimed(true);
                        }
                      }
                    }}
                    className="cursor-pointer active:scale-95 transition-transform text-7xl select-none"
                  >
                    {isChestOpened ? '🔓✨🎒' : '📦🔒'}
                  </button>

                  <AnimatePresence>
                    {isChestOpened && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      >
                        <span className="text-2xl block animate-ping">⭐🌟⭐</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Animated XP progress circle or bar display */}
                <div className="bg-white dark:bg-[#172033] p-4.5 rounded-3xl border border-gray-150 dark:border-slate-700 w-full space-y-2 transition-colors">
                  <div className="flex items-center justify-between font-black text-xs">
                    <span className="text-slate-400 uppercase tracking-tight">Today's Token Reward</span>
                    <span className="text-[#ff007c] flex items-center gap-1">{isChestOpened ? <><span className="shrink-0 font-black">+30 Cookies Claimed!</span><img src="/cookies.webp" alt="Cookies" className="w-3.5 h-3.5 object-contain inline shrink-0" /></> : 'Chest Unopened'}</span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: isChestOpened ? '100%' : '15%' }}
                      transition={{ duration: 1 }}
                      className="h-full bg-gradient-to-r from-yellow-400 via-[#ff007c] to-indigo-500 rounded-full"
                    />
                  </div>
                </div>

                <div className="flex gap-2 w-full">
                  <button
                    onClick={handlePrevStep}
                    className="w-16 bg-white dark:bg-[#243149] border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 text-xs font-black rounded-xl transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNextStep}
                    disabled={!isChestOpened}
                    className={`flex-1 font-black text-sm py-4 px-6 rounded-2xl border-b-4 transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      isChestOpened 
                        ? 'bg-[#58cc02] hover:bg-[#46a302] text-white border-[#3c8d01]' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-300 dark:border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    Finish Mission! 🏆
                    <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: 🏆 VICTORY SUMMARY / ADVICE / ARENA ENTRY */}
            {activeStep === 5 && (
              <motion.div
                key="step-victory"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 my-auto flex flex-col justify-center"
              >
                {/* Visual Victory Splash */}
                <div className="bg-gradient-to-br from-yellow-500 to-amber-600 p-5 rounded-[2rem] text-white text-center space-y-2 relative shadow-md">
                  {/* Absolute Badge */}
                  <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 bg-rose-500 text-[8px] font-black uppercase tracking-wider px-3 py-1 rounded-full border-2 border-white shadow-sm flex items-center gap-1">
                    <Trophy size={9} className="fill-current text-white animate-bounce" />
                    Quest Completed
                  </div>
                  
                  <span className="text-4xl block pt-2 animate-pulse">🏆🎓💥</span>
                  <div className="space-y-0.5">
                    <h3 className="text-lg font-black tracking-tight leading-none uppercase">You are an AI Explorer!</h3>
                    <p className="text-[10px] text-yellow-105 font-bold leading-normal">
                      Completed the visual lesson under Chikoo's guidance. Outstanding job!
                    </p>
                  </div>
                </div>

                {/* Simplified Key Takeaway Analogies */}
                <div className="bg-white dark:bg-[#172033] p-4 rounded-3xl border border-gray-150 dark:border-slate-700 space-y-2 transition-colors">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-[#006b1b] dark:text-emerald-400 flex items-center gap-1">
                    <span>💡 Relatable Cheat Sheet Takeaway</span>
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex gap-2 items-start text-xs font-extrabold text-slate-700 dark:text-slate-200">
                      <span className="text-base leading-none">✅</span>
                      <span>AI figures out secrets by analyzing real-world patterns, not guessing.</span>
                    </li>
                    <li className="flex gap-2 items-start text-xs font-extrabold text-slate-700 dark:text-slate-200">
                      <span className="text-base leading-none">✅</span>
                      <span>The more example photos or voices we feed our puppy, the smarter it acts.</span>
                    </li>
                  </ul>
                </div>

                {/* AI Tutor Chat Trigger Widget */}
                <div className="border border-indigo-150 dark:border-slate-700 p-1 rounded-2xl bg-indigo-50/20 dark:bg-slate-900/40">
                  <button 
                    onClick={() => {
                      soundManager.play('click');
                      setShowTutorChat(prev => !prev);
                    }}
                    className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-[#172033] rounded-xl border border-indigo-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#243149] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💬</span>
                      <div className="text-left">
                        <div className="text-xs font-black text-indigo-950 dark:text-white flex items-center gap-1">
                          <span>Chat with Chikoo Tutor</span>
                          <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[7px] font-black px-1 rounded uppercase">Real AI</span>
                        </div>
                        <div className="text-[9px] font-bold text-gray-500 dark:text-slate-400">Have a follow-up query? Speak directly!</div>
                      </div>
                    </div>
                    <span className="text-indigo-600 dark:text-indigo-400 font-extrabold text-xs">
                      {showTutorChat ? 'Hide' : 'Ask Chikoo'}
                    </span>
                  </button>

                  {/* Inline collapse chat tray */}
                  <AnimatePresence>
                    {showTutorChat && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: '240px' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col bg-white dark:bg-[#172033] rounded-b-xl border-t border-indigo-100 dark:border-slate-700 overflow-hidden"
                      >
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 text-[10px] scrollbar-hide">
                          {messages.map((m, i) => (
                            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                              <span className={`p-2 rounded-xl text-xs font-bold leading-normal max-w-[80%] ${
                                m.role === 'user' ? 'bg-[#006b1b] text-white' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-100 dark:border-emerald-800'
                              }`}>
                                {m.text}
                              </span>
                            </div>
                          ))}
                          {isTutorLoading && (
                            <div className="text-[9px] animate-pulse text-gray-400 font-bold flex items-center gap-1">
                              <RefreshCw size={10} className="animate-spin" /> Chikoo thinking...
                            </div>
                          )}
                          <div ref={chatEndRef} />
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-[#0e1424] border-t border-slate-200 dark:border-slate-700 flex gap-1 shrink-0">
                          <input
                            type="text"
                            placeholder="Explain the machine prediction style..."
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSendTutorQuery(); }}
                            className="flex-1 bg-white dark:bg-[#243149] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 text-xs font-semibold outline-none focus:border-indigo-500"
                          />
                          <button
                            onClick={handleSendTutorQuery}
                            disabled={!userInput.trim() || isTutorLoading}
                            className="bg-[#006b1b] text-white p-2.5 rounded-lg active:scale-95 disabled:opacity-40 transition-transform flex items-center justify-center shrink-0 cursor-pointer"
                          >
                            <Send size={12} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    onClick={() => {
                      soundManager.play('click');
                      onClose();
                    }}
                    className="bg-white dark:bg-[#243149] border-b-4 border-slate-300 dark:border-slate-800 hover:scale-[0.98] border-2 border-slate-200 dark:border-slate-700 p-4 text-xs font-black text-slate-500 dark:text-slate-300 rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    🏠 Home Map
                  </button>

                  <button
                    onClick={() => {
                      soundManager.play('click');
                      onStartQuiz();
                    }}
                    className="bg-emerald-800 hover:bg-emerald-900 border-b-4 border-emerald-950 p-4 text-xs font-black text-[#d5ffdc] rounded-2xl flex items-center justify-center gap-1.5 active:translate-y-0.5 transition-all cursor-pointer"
                  >
                    🚀 Enter Quiz Arena
                    <ArrowRight size={13} />
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
