import React, { memo, useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ArrowRight, 
  Compass, 
  Brain, 
  Terminal, 
  Layers, 
  Award, 
  Flame, 
  ShieldCheck, 
  Play, 
  Rocket, 
  Star, 
  Code2, 
  ChevronRight,
  ChevronUp,
  BookOpen,
  Trophy,
  Zap,
  Globe,
  Cpu,
  HelpCircle,
  LogIn,
  UserCheck,
  Smartphone
} from 'lucide-react';
import { soundManager } from '../../lib/sounds';

const HERO_BG_IMAGE = '/chikoo-bg.webp';

interface DesktopLandingPageProps {
  onStartAdventure: () => void;
  onSignIn: () => void;
  onContinueToApp?: () => void;
  isAuthenticated?: boolean;
  username?: string;
  onNavigateSeo?: (path: string) => void;
}

export const DesktopLandingPage = memo(function DesktopLandingPage({
  onStartAdventure,
  onSignIn,
  onContinueToApp,
  isAuthenticated = false,
  username = 'Explorer',
  onNavigateSeo
}: DesktopLandingPageProps) {
  const [activeTab, setActiveTab] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Allow smooth scrolling and restore overflow state when unmounted
  useEffect(() => {
    const prevBodyOverflowY = document.body.style.overflowY;
    const prevHtmlOverflowY = document.documentElement.style.overflowY;
    document.body.style.overflowY = 'auto';
    document.documentElement.style.overflowY = 'auto';
    return () => {
      document.body.style.overflowY = prevBodyOverflowY;
      document.documentElement.style.overflowY = prevHtmlOverflowY;
    };
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      setShowBackToTop(scrollContainerRef.current.scrollTop > 350);
    }
  }, []);

  const scrollToTop = () => {
    soundManager.play('click');
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (sectionId: string) => {
    soundManager.play('click');
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrimaryCta = () => {
    soundManager.play('click');
    if (isAuthenticated && onContinueToApp) {
      onContinueToApp();
    } else {
      onStartAdventure();
    }
  };

  const handleSecondaryCta = () => {
    soundManager.play('click');
    scrollToSection('why-chikoo');
  };

  // Learning philosophy steps
  const philosophySteps = [
    {
      step: '01',
      tag: 'DISCOVER',
      title: 'Uncover Everyday AI',
      desc: 'Spot the hidden algorithms behind your favorite games, videos, and gadgets.',
      icon: Compass,
      color: 'from-sky-500 to-blue-600',
      textColor: 'text-sky-600',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-200'
    },
    {
      step: '02',
      tag: 'UNDERSTAND',
      title: 'Demystify the Tech',
      desc: 'Break down neural networks, training data, and token logic into simple visual stories.',
      icon: Brain,
      color: 'from-indigo-500 to-purple-600',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    {
      step: '03',
      tag: 'PRACTICE',
      title: 'Interactive Battles',
      desc: 'Solve bite-sized interactive challenges, spot AI hallucinations, and test your intuition.',
      icon: Zap,
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    {
      step: '04',
      tag: 'BUILD',
      title: 'Craft Smart Projects',
      desc: 'Master prompt engineering, orchestrate AI tools, and generate real interactive prototypes.',
      icon: Terminal,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    {
      step: '05',
      tag: 'APPLY',
      title: 'Lead with Ethics',
      desc: 'Apply AI safely to schoolwork, creative arts, and real problems with ethical confidence.',
      icon: ShieldCheck,
      color: 'from-rose-500 to-pink-600',
      textColor: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200'
    }
  ];

  // What students learn curriculum journey
  const curriculumTopics = [
    {
      title: 'AI Fundamentals',
      summary: 'Sensors, rules, and machine intuition',
      icon: '🤖',
      unit: 'Unit 1',
      badge: 'Core'
    },
    {
      title: 'Data & Patterns',
      summary: 'How machines observe, categorize, and predict',
      icon: '📊',
      unit: 'Unit 2',
      badge: 'Logic'
    },
    {
      title: 'Machine Learning',
      summary: 'Training sets, feedback loops, and weights',
      icon: '🧠',
      unit: 'Unit 3',
      badge: 'Core'
    },
    {
      title: 'Generative AI',
      summary: 'Diffusion models, transformers, and neural creativity',
      icon: '✨',
      unit: 'Unit 4',
      badge: 'Advanced'
    },
    {
      title: 'Prompting Mastery',
      summary: 'Few-shot prompts, personas, and chaining tasks',
      icon: '💬',
      unit: 'Unit 5',
      badge: 'Skill'
    },
    {
      title: 'AI Tools in Action',
      summary: 'Computer vision, speech recognition, and coding assistants',
      icon: '🛠️',
      unit: 'Unit 6',
      badge: 'Practical'
    },
    {
      title: 'Building with AI',
      summary: 'Pipelines, custom agents, and smart micro-apps',
      icon: '🚀',
      unit: 'Unit 7',
      badge: 'Creator'
    },
    {
      title: 'Responsible AI & Safety',
      summary: 'Bias, hallucination mitigation, privacy, and truthfulness',
      icon: '🛡️',
      unit: 'Unit 8',
      badge: 'Ethics'
    },
    {
      title: 'AI in the Real World',
      summary: 'Medicine, climate science, space exploration, and careers',
      icon: '🌍',
      unit: 'Capstone',
      badge: 'Future'
    }
  ];

  // Learn by doing interactive features
  const features = [
    {
      id: 'lessons',
      title: 'Gamified Story Lessons',
      desc: 'Interactive comics, visual analogies, and story-driven missions designed for active learning.',
      tag: 'Interactive Lessons',
      badge: '30+ Modules',
      color: 'border-sky-300 bg-sky-50/70',
      icon: BookOpen,
      iconColor: 'text-sky-500',
      graphic: '/heading_aibo.webp'
    },
    {
      id: 'arena',
      title: 'The Practice Arena',
      desc: 'Fast-paced prompt battles, myth vs fact challenges, and step-by-step AI debugger quizzes.',
      tag: 'Practice Arena',
      badge: 'Daily Quests',
      color: 'border-emerald-300 bg-emerald-50/70',
      icon: Zap,
      iconColor: 'text-emerald-500',
      graphic: '/Practice.webp'
    },
    {
      id: 'rewards',
      title: 'XP, Cookies & Badges',
      desc: 'Earn golden cookies, unlock cosmic rank leagues, spin the lucky wheel, and open mystery chests.',
      tag: 'Gamification',
      badge: 'Unlockable',
      color: 'border-amber-300 bg-amber-50/70',
      icon: Trophy,
      iconColor: 'text-amber-500',
      graphic: '/Chest.webp'
    }
  ];

  // The 5-stage student transformation journey
  const journeyMilestones = [
    {
      question: '"What is AI?"',
      label: 'Stage 1: Curiosity & Discovery',
      detail: 'Demystifying the buzzwords. Seeing how AI categorizes photos and recommends music.',
      marker: '🌱'
    },
    {
      question: '"How does AI work?"',
      label: 'Stage 2: Core Engineering',
      detail: 'Peeling back the math. Understanding training data, loss functions, and neural pathways.',
      marker: '⚡'
    },
    {
      question: '"How can I use AI?"',
      label: 'Stage 3: Applied Power',
      detail: 'Harnessing modern LLMs, refining prompt accuracy, and accelerating school research.',
      marker: '🎯'
    },
    {
      question: '"How can I build with AI?"',
      label: 'Stage 4: Creative Builder',
      detail: 'Connecting models, writing simple AI loops, and designing conversational companions.',
      marker: '🛠️'
    },
    {
      question: '"How can I apply AI to my future?"',
      label: 'Stage 5: Visionary Leader',
      detail: 'Using artificial intelligence responsibly to tackle major human challenges.',
      marker: '🚀'
    }
  ];

  return (
    <div 
      id="landing-scroll-container"
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="fixed inset-0 w-full h-full min-h-screen bg-[#FCFDFE] text-slate-800 font-sans selection:bg-sky-500 selection:text-white antialiased overflow-y-auto overflow-x-hidden overscroll-y-contain scroll-smooth z-10"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* HERO SECTION */}
      <section id="hero" className="relative pt-20 pb-24 lg:pt-28 lg:pb-32 overflow-hidden bg-slate-950 text-white min-h-[600px] flex items-center justify-center scroll-mt-20 border-b border-slate-800/80">
        {/* Hero Background Image with Balanced Dark Atmospheric Overlay */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
        >
          <img 
            src={HERO_BG_IMAGE}
            alt="Chikoo Background"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Fallback to local copy if remote image blocked
              (e.currentTarget as HTMLImageElement).src = '/chikoo-bg.webp';
            }}
            className="w-full h-full object-cover object-center"
          />
          {/* Atmospheric overlay with 30% reduced darkness so artwork is clearly visible */}
          <div className="absolute inset-0 bg-slate-950/40 bg-gradient-to-b from-slate-950/30 via-slate-950/45 to-slate-950/70" />
        </div>

        {/* Subtle Ambient Glow Orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[460px] bg-gradient-to-tr from-sky-600/15 via-indigo-600/20 to-blue-600/15 rounded-full blur-3xl z-0 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 w-full flex flex-col items-center text-center">
          
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-sky-400/30 text-sky-300 text-xs font-extrabold uppercase tracking-wider mb-6 shadow-sm">
            <Sparkles size={14} className="text-amber-400 fill-amber-400" />
            <span>AI-Native Learning for the Next Generation</span>
          </div>

          {/* Core Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] mb-6 max-w-3xl drop-shadow-md">
            Learn AI.{" "}
            <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
              Build with AI.
            </span>{" "}
            <br />
            Shape Your Future.
          </h1>

          {/* Supporting Copy */}
          <p className="text-base sm:text-lg text-slate-200 font-medium leading-relaxed max-w-2xl mb-9 drop-shadow-sm">
            Chikoo makes AI learning interactive, practical, and fun — helping students understand AI, practice it, and build with it.
          </p>

          {/* CTA Row */}
          <div className="flex flex-wrap items-center justify-center gap-4 w-full sm:w-auto">
            <button
              id="landing-hero-primary-cta"
              onClick={handlePrimaryCta}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-[0_8px_28px_rgba(14,165,233,0.35)] hover:shadow-[0_12px_32px_rgba(14,165,233,0.45)] hover:-translate-y-0.5 active:translate-y-1 transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <Smartphone size={20} className="stroke-[2.5]" />
              <span>WE ARE THERE ON ANDROID</span>
            </button>

            <button
              id="landing-hero-secondary-cta"
              onClick={handleSecondaryCta}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white font-extrabold text-sm uppercase tracking-wider shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-sm"
            >
              <span>EXPLORE CHIKOO</span>
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Key Highlights Micro Row */}
          <div className="mt-12 pt-8 border-t border-slate-700/60 grid grid-cols-3 gap-6 sm:gap-12 w-full max-w-xl mx-auto">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white">30+</div>
              <div className="text-xs text-slate-300 font-semibold mt-1">Interactive Missions</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-sky-400">100%</div>
              <div className="text-xs text-slate-300 font-semibold mt-1">Hands-On Practice</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400">K-12</div>
              <div className="text-xs text-slate-300 font-semibold mt-1">Student Centered</div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. WHY CHIKOO (Learning Philosophy) */}
      <section id="why-chikoo" className="py-20 bg-slate-50/70 border-y border-slate-200/60 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-black text-sky-600 uppercase tracking-wider">
              Learning Philosophy
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2 mb-4">
              How Students Master AI with Chikoo
            </h2>
            <p className="text-slate-600 text-sm sm:text-base font-medium">
              We reject passive video watching. Students build true intuition through a proven 5-stage learning progression.
            </p>
          </div>

          {/* 5-Stage Progression Route */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {philosophySteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div 
                  key={step.tag} 
                  className={`bg-white rounded-3xl p-6 border ${step.borderColor} shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group`}
                >
                  <div>
                    {/* Top Tag & Number */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${step.bgColor} ${step.textColor}`}>
                        {step.tag}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {step.step}
                      </span>
                    </div>

                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${step.color} text-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform`}>
                      <Icon size={24} className="stroke-[2.2]" />
                    </div>

                    {/* Title & Desc */}
                    <h3 className="text-base font-black text-slate-900 mb-2 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                  {/* Flow Arrow (visible on md screens between items) */}
                  {idx < philosophySteps.length - 1 && (
                    <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-slate-100 border border-slate-200 items-center justify-center text-slate-400 pointer-events-none">
                      <ChevronRight size={14} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 5. WHAT STUDENTS LEARN (Curriculum Journey) */}
      <section id="what-you-learn" className="py-20 bg-white border-b border-slate-200/60 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-14 gap-6">
            <div>
              <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">
                Comprehensive Curriculum
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
                What Students Learn
              </h2>
              <p className="text-slate-600 text-sm sm:text-base font-medium mt-2 max-w-xl">
                A carefully structured path from the fundamentals of computer logic to generative AI models and real-world tools.
              </p>
            </div>

            <button
              onClick={handlePrimaryCta}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span>Explore Curriculum Map</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Visual Progression Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {curriculumTopics.map((topic, i) => (
              <div 
                key={topic.title}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-sky-300 hover:shadow-md transition-all flex items-start gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                  {topic.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">
                      {topic.unit}
                    </span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase">
                      {topic.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 group-hover:text-sky-600 transition-colors">
                    {topic.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                    {topic.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 6. LEARN BY DOING (The Real Chikoo Experience) */}
      <section id="learn-by-doing" className="py-20 bg-slate-50/80 border-y border-slate-200/60 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">
              Learn By Doing
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2 mb-4">
              Real Practice, Not Boring Lectures
            </h2>
            <p className="text-slate-600 text-sm sm:text-base font-medium">
              Every lesson is structured around gamified interaction, instant feedback, and student empowerment.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div 
                  key={feat.id}
                  className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-lg transition-all"
                >
                  <div>
                    {/* Visual Asset Showcase */}
                    <div className="w-full h-44 rounded-2xl bg-slate-50 border border-slate-100 mb-6 flex items-center justify-center p-4 overflow-hidden relative">
                      <img 
                        src={feat.graphic} 
                        alt={feat.title} 
                        className="max-h-36 max-w-full object-contain select-none hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/90 border border-slate-200 text-slate-700 shadow-xs">
                        {feat.badge}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={18} className={feat.iconColor} />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {feat.tag}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 mb-2">
                      {feat.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={handlePrimaryCta}
                      className="text-xs font-extrabold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Try this in-app</span>
                      <ArrowRight size={13} />
                    </button>
                    <span className="text-[11px] font-bold text-slate-400">Interactive</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 7. THE CHIKOO JOURNEY (Progression from Curiosity to Future Builder) */}
      <section id="the-journey" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-black text-purple-600 uppercase tracking-wider">
              Student Growth
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2 mb-4">
              The Chikoo Journey
            </h2>
            <p className="text-slate-600 text-sm sm:text-base font-medium">
              Students don't simply finish a course. They transform into thoughtful, capable creators who understand how artificial intelligence shapes our world.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {journeyMilestones.map((milestone, idx) => (
              <div 
                key={milestone.question}
                className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all flex items-start gap-5"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl shrink-0">
                  {milestone.marker}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
                    {milestone.label}
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-1">
                    {milestone.question}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                    {milestone.detail}
                  </p>
                </div>
                <div className="hidden sm:flex text-slate-300 font-mono text-sm font-bold self-center">
                  0{idx + 1}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 8. CHIKOO AS YOUR AI LEARNING COMPANION */}
      <section id="chikoo-companion" className="py-20 bg-gradient-to-b from-sky-50/60 to-white border-y border-slate-200/60 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Visual Column */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-72 sm:w-80 h-72 sm:h-80 rounded-3xl bg-white border border-sky-100 shadow-xl flex items-center justify-center p-6">
                <div className="absolute inset-0 bg-sky-100/40 rounded-3xl blur-xl -z-10" />
                <img 
                  src="/exaplaination_screens/wink.webp" 
                  alt="Chikoo Companion" 
                  className="w-56 h-auto object-contain select-none"
                />
                <div className="absolute -bottom-4 bg-slate-900 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow">
                  Always in your corner 🐾
                </div>
              </div>
            </div>

            {/* Content Column */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <span className="text-xs font-black text-sky-600 uppercase tracking-wider">
                Your AI Companion
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2 mb-5">
                Meet Chikoo: An AI Companion Who Never Judges
              </h2>
              <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed mb-6">
                Learning high-tech concepts shouldn't feel intimidating. Chikoo is by your side at every step — explaining tricky ideas in everyday analogies, celebrating your "aha!" moments, cheering on your streaks, and turning mistakes into fun learning opportunities.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-8">
                <div className="p-4 rounded-2xl bg-white border border-slate-200">
                  <h4 className="text-xs font-black text-slate-900 mb-1">Kid-Safe & Friendly</h4>
                  <p className="text-xs text-slate-500">Zero confusing jargon. Encouraging hints whenever you get stuck.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200">
                  <h4 className="text-xs font-black text-slate-900 mb-1">Adaptive Pace</h4>
                  <p className="text-xs text-slate-500">Learn 10 minutes a day, on your schedule, at your own speed.</p>
                </div>
              </div>

              <button
                onClick={handlePrimaryCta}
                className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs uppercase tracking-wider shadow hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Say Hello to Chikoo</span>
                <ArrowRight size={15} />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* 9. BUILT FOR THE AI GENERATION */}
      <section id="built-for-future" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <span className="text-xs font-black text-rose-600 uppercase tracking-wider">
            Future Ready
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2 mb-6">
            Built for the AI Generation
          </h2>
          <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed max-w-2xl mx-auto mb-10">
            Artificial intelligence is rapidly becoming woven into education, careers, scientific discovery, and everyday tools. The students who understand how AI works today will be the creators, problem-solvers, and leaders of tomorrow.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div className="text-2xl mb-2">🎨</div>
              <h4 className="text-xs font-black text-slate-800">Creativity</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Art, design & music</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div className="text-2xl mb-2">🔬</div>
              <h4 className="text-xs font-black text-slate-800">Science</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Biology, climate & math</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div className="text-2xl mb-2">💻</div>
              <h4 className="text-xs font-black text-slate-800">Technology</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Code & smart tools</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div className="text-2xl mb-2">🌍</div>
              <h4 className="text-xs font-black text-slate-800">Society</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Ethics & human benefit</p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA SECTION (Large immersive scene) */}
      <section className="py-24 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden">
        {/* Subtle Constellation Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          
          <div className="w-20 h-20 mx-auto rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-2 shadow-2xl flex items-center justify-center mb-6">
            <img 
              src="/Aibo_sneak.webp" 
              alt="Chikoo" 
              className="w-16 h-16 object-contain"
            />
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Your AI adventure starts here.
          </h2>
          <p className="text-slate-300 text-base sm:text-lg font-medium max-w-xl mx-auto mb-10">
            Join young explorers who are understanding how AI works, building real projects, and shaping their future with confidence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="landing-footer-primary-cta"
              onClick={handlePrimaryCta}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <Rocket size={18} className="stroke-[2.5]" />
              <span>START LEARNING WITH CHIKOO</span>
            </button>

            {!isAuthenticated && (
              <button
                onClick={onSignIn}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn size={16} />
                <span>Log In to Existing Account</span>
              </button>
            )}
          </div>

        </div>
      </section>

      {/* 11. DESKTOP FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-12 text-slate-500 text-xs font-medium">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3">
            <img src="/avatar.webp" alt="Chikoo Avatar" className="w-8 h-8 rounded-full" />
            <div>
              <span className="font-extrabold text-slate-800 text-sm">Chikoo Platform</span>
              <p className="text-[11px] text-slate-400">Interactive AI Learning for Students</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-slate-600 font-semibold flex-wrap">
            {onNavigateSeo && (
              <>
                <button onClick={() => onNavigateSeo('/what-is-chikoo')} className="hover:text-sky-600 cursor-pointer">
                  About
                </button>
                <button onClick={() => onNavigateSeo('/units')} className="hover:text-sky-600 cursor-pointer">
                  Units
                </button>
                <button onClick={() => onNavigateSeo('/features')} className="hover:text-sky-600 cursor-pointer">
                  Features
                </button>
                <button onClick={() => onNavigateSeo('/learn')} className="hover:text-sky-600 cursor-pointer">
                  Knowledge Hub
                </button>
              </>
            )}
            <a href="/privacy-policy" className="hover:text-sky-600 cursor-pointer">
              Privacy Policy
            </a>
            <a href="/delete-account" className="hover:text-sky-600 cursor-pointer text-red-500 hover:text-red-600">
              Account Deletion
            </a>
          </div>

          <div className="text-center sm:text-right text-[11px] text-slate-400">
            © {new Date().getFullYear()} Chikoo. All rights reserved.
          </div>

        </div>
      </footer>

      {/* Floating Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-white/95 text-slate-700 hover:text-sky-600 hover:bg-white shadow-[0_8px_30px_rgba(0,0,0,0.14)] border border-slate-200/80 cursor-pointer transition-all hover:scale-110 active:scale-95 flex items-center justify-center group"
          >
            <ChevronUp size={20} className="stroke-[2.5] group-hover:-translate-y-0.5 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

    </div>
  );
});

export default DesktopLandingPage;
