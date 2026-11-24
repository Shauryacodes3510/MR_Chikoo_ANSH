import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ArrowRight, 
  Check, 
  Sparkles,
  Brain,
  Code2,
  GraduationCap,
  Compass,
  Zap,
  Sprout,
  BookOpen,
  Layers,
  Cpu,
  Clock,
  Flame,
  Timer,
  Gauge,
  BrainCircuit,
  Wand2,
  MessageSquareText,
  Blocks,
  Palette,
  TrendingUp,
  Globe,
  Gamepad2,
  Puzzle,
  BookOpenCheck,
  Hammer,
  Boxes,
  Lightbulb,
  CheckCircle2,
  Rocket,
  Target
} from 'lucide-react';
import { soundManager } from '../lib/sounds';

export interface OnboardingAnswers {
  name: string;
  reason: string;
  knowledge: string;
  dailyTime: string;
  interests: string[];
  learningStyle: string;
  goal: string;
}

interface ChikooOnboardingProps {
  email: string;
  initialName?: string;
  onComplete: (answers: OnboardingAnswers) => void;
  onBackToAuth?: () => void;
}

export default function ChikooOnboarding({ email, initialName = '', onComplete, onBackToAuth }: ChikooOnboardingProps) {
  const savedKey = `CHIKOO_ONBOARDING_DRAFT_${email.toLowerCase().trim()}`;
  
  const [step, setStep] = useState<number>(() => {
    const draft = localStorage.getItem(savedKey);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.step) return parsed.step;
      } catch (e) {
        // ignore
      }
    }
    return 1;
  });

  const [name, setName] = useState<string>(() => {
    if (initialName) return initialName;
    const defaultFromEmail = email ? email.split('@')[0] : '';
    return defaultFromEmail.charAt(0).toUpperCase() + defaultFromEmail.slice(1);
  });

  const [reason, setReason] = useState<string>('');
  const [knowledge, setKnowledge] = useState<string>('');
  const [dailyTime, setDailyTime] = useState<string>('10 minutes');
  const [interests, setInterests] = useState<string[]>(['AI Foundations', 'Generative AI']);
  const [learningStyle, setLearningStyle] = useState<string>('');
  const [goal, setGoal] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [activeSelection, setActiveSelection] = useState<string | null>(null);

  // Persist draft on state change
  useEffect(() => {
    if (email) {
      const draftData = { step, name, reason, knowledge, dailyTime, interests, learningStyle, goal };
      localStorage.setItem(savedKey, JSON.stringify(draftData));
    }
  }, [step, name, reason, knowledge, dailyTime, interests, learningStyle, goal, email, savedKey]);

  // Options configuration
  const reasonOptions = [
    { id: 'Understand AI', label: 'Understand how AI works', icon: Brain },
    { id: 'Build with AI', label: 'Build apps and AI projects', icon: Code2 },
    { id: 'AI for my future', label: 'Prepare for school and my future', icon: GraduationCap },
    { id: 'Explore AI', label: 'Explore creative and fun AI tools', icon: Compass },
    { id: 'Become really good at AI', label: 'Master AI skills and prompting', icon: Zap }
  ];

  const knowledgeOptions = [
    { id: 'Completely new', label: 'Completely new — starting from scratch', icon: Sprout },
    { id: 'Heard about it', label: 'Heard about it, ready to learn', icon: BookOpen },
    { id: 'Know the basics', label: 'Know the basic concepts', icon: Layers },
    { id: 'Have experimented with AI', label: 'Have used ChatGPT or image generators', icon: Sparkles },
    { id: 'Know quite a lot', label: 'Experienced with AI tools and logic', icon: Cpu }
  ];

  const timeOptions = [
    { id: '5 minutes', label: '5 minutes a day', hint: 'Quick daily bite', icon: Clock },
    { id: '10 minutes', label: '10 minutes a day', hint: 'Steady recommended pace', icon: Flame },
    { id: '15 minutes', label: '15 minutes a day', hint: 'Faster progress', icon: Timer },
    { id: '20+ minutes', label: '20+ minutes a day', hint: 'Maximum AI power', icon: Gauge }
  ];

  const interestOptions = [
    { id: 'AI Foundations', label: 'AI Foundations', icon: BrainCircuit },
    { id: 'Generative AI', label: 'Generative AI', icon: Wand2 },
    { id: 'Prompting', label: 'Prompt Engineering', icon: MessageSquareText },
    { id: 'Machine Learning', label: 'Machine Learning', icon: Cpu },
    { id: 'Building AI', label: 'Building AI Apps', icon: Blocks },
    { id: 'AI + Creativity', label: 'AI + Creative Arts', icon: Palette },
    { id: 'AI + Business', label: 'AI in Business', icon: TrendingUp },
    { id: 'AI in the real world', label: 'Real World Applications', icon: Globe }
  ];

  const styleOptions = [
    { id: 'Learn by playing', label: 'Interactive games & quests', icon: Gamepad2 },
    { id: 'Solve challenges', label: 'Puzzles & problem solving', icon: Puzzle },
    { id: 'Understand concepts', label: 'Clear visual guides & explanations', icon: BookOpenCheck },
    { id: 'Build things', label: 'Hands-on projects & creations', icon: Hammer },
    { id: 'A mix of everything', label: 'A balanced mix of all learning styles', icon: Boxes }
  ];

  const goalOptions = [
    { id: 'Understand how AI works', label: 'Understand how AI works behind the scenes', icon: Lightbulb },
    { id: 'Use AI confidently', label: 'Use AI tools confidently in daily life', icon: CheckCircle2 },
    { id: 'Build AI projects', label: 'Build my own AI apps and projects', icon: Rocket },
    { id: 'Prepare for my future', label: 'Get ready for future academic & career opportunities', icon: Target },
    { id: 'Explore AI across different fields', label: 'Explore creative possibilities across fields', icon: Compass }
  ];

  const journeyPlan = [
    { step: '01', title: 'AI Foundations', desc: 'Core logic & digital thinking', icon: BrainCircuit },
    { step: '02', title: 'How AI Learns', desc: 'Models, data patterns & vision', icon: Layers },
    { step: '03', title: 'Generative AI', desc: 'Text, image & voice creation', icon: Wand2 },
    { step: '04', title: 'Prompting', desc: 'Mastering AI communication', icon: MessageSquareText },
    { step: '05', title: 'Build with AI', desc: 'Hands-on apps & creative projects', icon: Blocks }
  ];

  // Chikoo mascot image for all options and questions
  const getChikooMascot = () => {
    return '/heading_aibo.webp';
  };

  const getDialogueText = () => {
    const formattedName = name.trim() ? name.trim() : 'friend';
    switch (step) {
      case 1:
        if (reason === 'Understand AI') return 'Awesome! Understanding AI will give you superpowers!';
        if (reason === 'Build with AI') return `Sweet ${formattedName}! We'll build real AI projects together!`;
        if (reason === 'AI for my future') return 'Smart choice! AI skills will set you up for big success!';
        if (reason === 'Explore AI') return 'Fun! There are so many creative AI tools for us to try!';
        if (reason === 'Become really good at AI') return 'Love the ambition! You will be an AI master in no time!';
        return `Hey ${formattedName}! Why do you want to learn AI with me?`;

      case 2:
        if (knowledge === 'Completely new') return 'No worries at all! We will start right from the fun basics!';
        if (knowledge === 'Heard about it') return 'Great! Curiosity is the best way to start learning AI!';
        if (knowledge === 'Know the basics') return 'Awesome! We can jump right into expanding your skills!';
        if (knowledge === 'Have experimented with AI') return "Nice! You've got hands-on experience already!";
        if (knowledge === 'Know quite a lot') return "Whoa, an AI wizard! Let's take your skills to the max!";
        return 'How much do you already know about AI?';

      case 3:
        if (dailyTime === '5 minutes') return 'Perfect! Quick 5-minute daily bites keep learning super fun!';
        if (dailyTime === '10 minutes') return '10 minutes a day is the golden pace for steady progress!';
        if (dailyTime === '15 minutes') return "15 minutes a day! You're going to level up really fast!";
        if (dailyTime === '20+ minutes') return '20+ minutes! Full cosmic speed ahead!';
        return 'How much time do you want to spend learning AI with me?';

      case 4:
        if (interests.length > 0) {
          return `Great picks! I've tailored ${interests.length} exciting topic${interests.length > 1 ? 's' : ''} for you!`;
        }
        return 'What topics sound exciting to you?';

      case 5:
        if (learningStyle === 'Learn by playing') return 'Gaming mode activated! We will learn through quests & games!';
        if (learningStyle === 'Solve challenges') return "Puzzle solver! I'll craft challenging quests for you!";
        if (learningStyle === 'Understand concepts') return "Visual learner! I'll break down concepts with cool guides!";
        if (learningStyle === 'Build things') return "Creator mode! We'll focus on hands-on building!";
        if (learningStyle === 'A mix of everything') return 'The ultimate mix! Variety keeps every day exciting!';
        return 'How do you like learning best?';

      case 6:
        if (goal === 'Understand how AI works') return 'Awesome goal! Demystifying AI is super empowering!';
        if (goal === 'Use AI confidently') return "Fantastic! You'll use AI like a natural pro!";
        if (goal === 'Build AI projects') return 'Exciting! Your portfolio is going to look incredible!';
        if (goal === 'Prepare for my future') return "Incredible foresight! You're ahead of the curve!";
        if (goal === 'Explore AI across different fields') return 'Endless possibilities! Let\'s explore them all!';
        return 'What do you want to do with AI?';

      case 7:
        return `Awesome, ${formattedName}! Here is your personalized AI journey.`;

      default:
        return "Let's personalize your AI adventure!";
    }
  };

  // Typewriter effect state
  const fullDialogueText = getDialogueText();
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    let index = 0;
    
    const timer = setInterval(() => {
      index++;
      setDisplayedText(fullDialogueText.slice(0, index));
      if (index >= fullDialogueText.length) {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, 20);

    return () => clearInterval(timer);
  }, [fullDialogueText]);

  const handleSelectOption = (setter: (val: string) => void, val: string) => {
    setErrorMsg('');
    setter(val);
    soundManager.play('pop');
  };

  const handleNextStep = () => {
    soundManager.play('click');
    if (step < 7) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setErrorMsg('');
    setActiveSelection(null);
    soundManager.play('click');
    if (step > 1) {
      setStep(prev => prev - 1);
    } else if (onBackToAuth) {
      onBackToAuth();
    }
  };

  const toggleInterest = (id: string) => {
    soundManager.play('click');
    setErrorMsg('');
    setInterests(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  const handleCompleteJourney = () => {
    soundManager.play('complete');
    localStorage.removeItem(savedKey);
    onComplete({
      name: name.trim() || 'Explorer',
      reason,
      knowledge,
      dailyTime,
      interests,
      learningStyle,
      goal
    });
  };

  const isNextDisabled = () => {
    switch (step) {
      case 1: return !reason;
      case 2: return !knowledge;
      case 3: return !dailyTime;
      case 4: return interests.length === 0;
      case 5: return !learningStyle;
      case 6: return !goal;
      case 7: return false;
      default: return true;
    }
  };

  const handleFooterClick = () => {
    if (step === 7) {
      handleCompleteJourney();
    } else {
      handleNextStep();
    }
  };

  return (
    <div 
      id="chikoo-onboarding-shell"
      className="fixed inset-0 w-full h-full bg-white text-slate-900 z-[999] select-none font-sans flex flex-col justify-between overflow-hidden relative"
    >
      {/* 1. TOP NAV - UNOBTRUSIVE BACK BUTTON */}
      <header className="w-full max-w-[460px] mx-auto px-5 pt-4 sm:pt-5 pb-2 shrink-0 flex items-center justify-between relative z-10">
        <button
          type="button"
          onClick={handleBack}
          className="w-10 h-10 rounded-full border-2 border-slate-200/90 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 transition-all cursor-pointer flex items-center justify-center shadow-xs"
          aria-label="Go Back"
        >
          <ChevronLeft size={22} className="stroke-[2.5]" />
        </button>
        <div className="w-10 h-10" />
      </header>

      {/* 2. MAIN SCROLLABLE CENTERED NARROW COMPOSITION */}
      <main className="w-full max-w-[460px] mx-auto px-5 py-2 sm:py-3 flex-1 overflow-y-auto flex flex-col items-center justify-start relative z-10">
        
        {/* CHIKOO MASCOT ON LEFT & QUESTION SPEECH BUBBLE ON RIGHT */}
        <div className="w-full flex flex-row items-center justify-start gap-3 sm:gap-4 mb-4 sm:mb-5">
          {/* Left Side Extra Large & Playful Chikoo Mascot */}
          <motion.div 
            key={`mascot-${step}`}
            initial={{ scale: 0.8, x: -12, opacity: 0 }}
            animate={{ scale: 1, x: 0, opacity: 1, y: [0, -6, 0] }}
            transition={{ 
              scale: { type: "spring", stiffness: 360, damping: 18 },
              y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-32 h-32 sm:w-40 sm:h-40 shrink-0 relative flex items-center justify-center filter drop-shadow-md"
          >
            <img 
              src={getChikooMascot()} 
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/avatar.webp";
              }}
              alt="Chikoo Mascot" 
              className="w-full h-full object-contain pointer-events-none select-none"
              referrerPolicy="no-referrer"
            />
          </motion.div>

          {/* Right Side Question Speech Bubble */}
          <motion.div 
            key={`speech-${step}`}
            initial={{ opacity: 0, x: 12, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex-1 bg-amber-50/80 border-2 border-amber-300/90 rounded-[1.75rem] p-4.5 sm:p-5 shadow-[0_6px_20px_rgba(251,191,36,0.14)] relative text-left min-h-[6rem] flex flex-col justify-center"
          >
            {/* Speech bubble tail pointing LEFT to Chikoo */}
            <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 bg-amber-50 border-b-2 border-l-2 border-amber-300/90 transform rotate-45" />

            <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-800/80 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
              <span>Chikoo</span>
            </div>

            <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-800 leading-snug tracking-tight relative z-10 flex items-center flex-wrap gap-0.5">
              <span>{displayedText}</span>
              {isTyping && (
                <span className="inline-block w-2 h-5 bg-amber-500 rounded-full animate-pulse shrink-0 ml-1" />
              )}
            </h2>
          </motion.div>
        </div>

        {/* STEP CONTENT / VERTICALLY STACKED LARGER ANSWER OPTIONS */}
        <div className="w-full pb-4">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: REASON */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-3"
              >
                <div className="space-y-3">
                  {reasonOptions.map((opt) => {
                    const isSelected = reason === opt.id;
                    const IconComp = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(setReason, opt.id)}
                        className={`w-full px-4.5 py-3.5 sm:py-4 rounded-[1.35rem] border-2 text-left transition-all cursor-pointer flex items-center justify-between min-h-[58px] sm:min-h-[62px] ${
                          isSelected 
                            ? 'bg-sky-50/95 border-sky-400 text-sky-950 font-extrabold shadow-sm ring-4 ring-sky-200/50 scale-[1.01]' 
                            : 'bg-white/90 hover:bg-white border-slate-200/90 hover:border-amber-300 text-slate-800 shadow-xs hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 pr-2">
                          <div className={`w-9.5 h-9.5 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? 'bg-emerald-500 text-white shadow-xs' : 'bg-gradient-to-br from-amber-100 to-sky-100 text-amber-800 border border-amber-200/70'
                          }`}>
                            <IconComp size={19} className="stroke-[2.2]" />
                          </div>
                          <span className="font-extrabold text-base sm:text-[17px] leading-tight text-slate-800">{opt.label}</span>
                        </div>

                        {isSelected ? (
                          <div className="w-6.5 h-6.5 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 ml-3 shadow-xs">
                            <Check size={16} className="stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-6.5 h-6.5 rounded-full border-2 border-slate-300 bg-slate-50/80 shrink-0 ml-3" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 2: KNOWLEDGE */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-3"
              >
                <div className="space-y-3">
                  {knowledgeOptions.map((opt) => {
                    const isSelected = knowledge === opt.id;
                    const IconComp = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(setKnowledge, opt.id)}
                        className={`w-full px-4.5 py-3.5 sm:py-4 rounded-[1.35rem] border-2 text-left transition-all cursor-pointer flex items-center justify-between min-h-[58px] sm:min-h-[62px] ${
                          isSelected 
                            ? 'bg-sky-50/95 border-sky-400 text-sky-950 font-extrabold shadow-sm ring-4 ring-sky-200/50 scale-[1.01]' 
                            : 'bg-white/90 hover:bg-white border-slate-200/90 hover:border-amber-300 text-slate-800 shadow-xs hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 pr-2">
                          <div className={`w-9.5 h-9.5 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? 'bg-emerald-500 text-white shadow-xs' : 'bg-gradient-to-br from-amber-100 to-sky-100 text-amber-800 border border-amber-200/70'
                          }`}>
                            <IconComp size={19} className="stroke-[2.2]" />
                          </div>
                          <span className="font-extrabold text-base sm:text-[17px] leading-tight text-slate-800">{opt.label}</span>
                        </div>

                        {isSelected ? (
                          <div className="w-6.5 h-6.5 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 ml-3 shadow-xs">
                            <Check size={16} className="stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-6.5 h-6.5 rounded-full border-2 border-slate-300 bg-slate-50/80 shrink-0 ml-3" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 3: DAILY TIME */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-3"
              >
                <div className="space-y-3">
                  {timeOptions.map((opt) => {
                    const isSelected = dailyTime === opt.id;
                    const IconComp = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(setDailyTime, opt.id)}
                        className={`w-full px-4.5 py-3.5 sm:py-4 rounded-[1.35rem] border-2 text-left transition-all cursor-pointer flex items-center justify-between min-h-[60px] sm:min-h-[64px] ${
                          isSelected 
                            ? 'bg-sky-50/95 border-sky-400 text-sky-950 font-extrabold shadow-sm ring-4 ring-sky-200/50 scale-[1.01]' 
                            : 'bg-white/90 hover:bg-white border-slate-200/90 hover:border-amber-300 text-slate-800 shadow-xs hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 pr-2">
                          <div className={`w-9.5 h-9.5 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? 'bg-emerald-500 text-white shadow-xs' : 'bg-gradient-to-br from-amber-100 to-sky-100 text-amber-800 border border-amber-200/70'
                          }`}>
                            <IconComp size={19} className="stroke-[2.2]" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-extrabold text-base sm:text-lg text-slate-800">{opt.label}</span>
                            <span className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">{opt.hint}</span>
                          </div>
                        </div>

                        {isSelected ? (
                          <div className="w-6.5 h-6.5 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 ml-3 shadow-xs">
                            <Check size={16} className="stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-6.5 h-6.5 rounded-full border-2 border-slate-300 bg-slate-50/80 shrink-0 ml-3" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 4: INTERESTS (Multi-select) */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-3"
              >
                <div className="space-y-2.5">
                  {interestOptions.map((opt) => {
                    const isSelected = interests.includes(opt.id);
                    const IconComp = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleInterest(opt.id)}
                        className={`w-full px-4.5 py-3 sm:py-3.5 rounded-[1.35rem] border-2 text-left transition-all cursor-pointer flex items-center justify-between min-h-[54px] ${
                          isSelected 
                            ? 'bg-sky-50/95 border-sky-400 text-sky-950 font-extrabold shadow-sm ring-4 ring-sky-200/50 scale-[1.01]' 
                            : 'bg-white/90 hover:bg-white border-slate-200/90 hover:border-amber-300 text-slate-800 shadow-xs hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 pr-2">
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? 'bg-emerald-500 text-white shadow-xs' : 'bg-gradient-to-br from-amber-100 to-sky-100 text-amber-800 border border-amber-200/70'
                          }`}>
                            <IconComp size={18} className="stroke-[2.2]" />
                          </div>
                          <span className="font-extrabold text-base sm:text-[17px] leading-tight text-slate-800">{opt.label}</span>
                        </div>

                        {isSelected ? (
                          <div className="w-6.5 h-6.5 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 ml-3 shadow-xs">
                            <Check size={16} className="stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-6.5 h-6.5 rounded-full border-2 border-slate-300 bg-slate-50/80 shrink-0 ml-3" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 5: LEARNING STYLE */}
            {step === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-3"
              >
                <div className="space-y-3">
                  {styleOptions.map((opt) => {
                    const isSelected = learningStyle === opt.id;
                    const IconComp = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(setLearningStyle, opt.id)}
                        className={`w-full px-4.5 py-3.5 sm:py-4 rounded-[1.35rem] border-2 text-left transition-all cursor-pointer flex items-center justify-between min-h-[58px] sm:min-h-[62px] ${
                          isSelected 
                            ? 'bg-sky-50/95 border-sky-400 text-sky-950 font-extrabold shadow-sm ring-4 ring-sky-200/50 scale-[1.01]' 
                            : 'bg-white/90 hover:bg-white border-slate-200/90 hover:border-amber-300 text-slate-800 shadow-xs hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 pr-2">
                          <div className={`w-9.5 h-9.5 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? 'bg-emerald-500 text-white shadow-xs' : 'bg-gradient-to-br from-amber-100 to-sky-100 text-amber-800 border border-amber-200/70'
                          }`}>
                            <IconComp size={19} className="stroke-[2.2]" />
                          </div>
                          <span className="font-extrabold text-base sm:text-[17px] leading-tight text-slate-800">{opt.label}</span>
                        </div>

                        {isSelected ? (
                          <div className="w-6.5 h-6.5 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 ml-3 shadow-xs">
                            <Check size={16} className="stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-6.5 h-6.5 rounded-full border-2 border-slate-300 bg-slate-50/80 shrink-0 ml-3" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 6: GOAL */}
            {step === 6 && (
              <motion.div
                key="step-6"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-3"
              >
                <div className="space-y-3">
                  {goalOptions.map((opt) => {
                    const isSelected = goal === opt.id;
                    const IconComp = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(setGoal, opt.id)}
                        className={`w-full px-4.5 py-3.5 sm:py-4 rounded-[1.35rem] border-2 text-left transition-all cursor-pointer flex items-center justify-between min-h-[58px] sm:min-h-[62px] ${
                          isSelected 
                            ? 'bg-sky-50/95 border-sky-400 text-sky-950 font-extrabold shadow-sm ring-4 ring-sky-200/50 scale-[1.01]' 
                            : 'bg-white/90 hover:bg-white border-slate-200/90 hover:border-amber-300 text-slate-800 shadow-xs hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 pr-2">
                          <div className={`w-9.5 h-9.5 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? 'bg-emerald-500 text-white shadow-xs' : 'bg-gradient-to-br from-amber-100 to-sky-100 text-amber-800 border border-amber-200/70'
                          }`}>
                            <IconComp size={19} className="stroke-[2.2]" />
                          </div>
                          <span className="font-extrabold text-base sm:text-[17px] leading-tight text-slate-800">{opt.label}</span>
                        </div>

                        {isSelected ? (
                          <div className="w-6.5 h-6.5 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 ml-3 shadow-xs">
                            <Check size={16} className="stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-6.5 h-6.5 rounded-full border-2 border-slate-300 bg-slate-50/80 shrink-0 ml-3" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 7: PERSONALIZED JOURNEY PLAN */}
            {step === 7 && (
              <motion.div
                key="step-7"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="space-y-3 my-2">
                  {journeyPlan.map((jp, idx) => {
                    const IconComp = jp.icon;
                    return (
                      <div 
                        key={jp.step}
                        className={`px-4.5 py-3.5 sm:py-4 rounded-[1.35rem] border-2 text-left flex items-center justify-between shadow-xs ${
                          idx === 0 
                            ? 'bg-sky-50/95 border-sky-400 text-sky-950 font-extrabold shadow-sm ring-4 ring-sky-200/50' 
                            : 'bg-white/90 border-slate-200/90 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 pr-2">
                          <div className={`w-9.5 h-9.5 rounded-2xl flex items-center justify-center shrink-0 ${
                            idx === 0 ? 'bg-emerald-500 text-white shadow-xs' : 'bg-gradient-to-br from-amber-100 to-sky-100 text-amber-800 border border-amber-200/70'
                          }`}>
                            <IconComp size={19} className="stroke-[2.2]" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-extrabold text-base sm:text-lg text-slate-800">{jp.title}</span>
                            <span className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">{jp.desc}</span>
                          </div>
                        </div>
                        <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center shrink-0 ml-3 ${
                          idx === 0 ? 'bg-sky-500 text-white shadow-xs' : 'border-2 border-slate-300 bg-slate-50/80 text-slate-400'
                        }`}>
                          <Check size={15} className="stroke-[3]" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {errorMsg && (
            <div className="mt-3 text-center text-xs font-semibold text-rose-500">
              {errorMsg}
            </div>
          )}
        </div>

      </main>

      {/* 3. BOTTOM FOOTER FOR NEXT BUTTON (INDEPENDENT BUTTON, NO PARENT CARD) */}
      <footer className="w-full bg-transparent py-3.5 sm:py-4 px-5 shrink-0 z-20">
        <div className="w-full max-w-[460px] mx-auto">
          <button
            type="button"
            disabled={isNextDisabled()}
            onClick={handleFooterClick}
            className={`w-full py-4 sm:py-4.5 rounded-[1.35rem] font-extrabold text-lg transition-all cursor-pointer flex items-center justify-center gap-2.5 ${
              !isNextDisabled()
                ? 'bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 active:scale-[0.98] text-white shadow-lg shadow-sky-500/25 border-2 border-sky-400/60'
                : 'bg-slate-200/90 text-slate-400 border-2 border-slate-300/80 cursor-not-allowed opacity-60'
            }`}
          >
            <span>{step === 7 ? 'Start Learning with Chikoo' : 'Next'}</span>
            {step === 7 ? (
              <Sparkles size={20} className="fill-white" />
            ) : (
              <ArrowRight size={20} className="stroke-[2.5]" />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}

