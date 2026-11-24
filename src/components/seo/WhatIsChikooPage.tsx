import React, { useState } from 'react';
import SeoLayout from './SeoLayout';
import { 
  Sparkles, 
  Brain, 
  Target, 
  Zap, 
  ShieldCheck, 
  Trophy, 
  Compass, 
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Lock,
  Flame,
  Award,
  Star,
  Swords,
  Gift,
  Search,
  Wand2,
  ChevronRight,
  Play
} from 'lucide-react';
import { CHIKOO_PLATFORM_SEO, SEO_FEATURES, getAllSeoUnits } from '../../lib/seoRegistry';

interface WhatIsChikooPageProps {
  onLaunchApp?: (target?: { view?: string; unitId?: string; lessonId?: string }) => void;
}

export default function WhatIsChikooPage({ onLaunchApp }: WhatIsChikooPageProps) {
  const units = getAllSeoUnits();
  
  // Interactive Live Arcade State
  const [activeTab, setActiveTab] = useState<'spot' | 'prompt'>('spot');
  const [selectedSpotIndex, setSelectedSpotIndex] = useState<number | null>(null);
  const [promptRole, setPromptRole] = useState<'astronaut' | 'chef' | 'detective'>('astronaut');
  const [promptTask, setPromptTask] = useState<'explain' | 'recipe' | 'riddle'>('explain');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleLaunch = (target?: { view?: string; unitId?: string; lessonId?: string }) => {
    if (onLaunchApp) {
      onLaunchApp(target);
    } else {
      window.location.href = '/';
    }
  };

  const spotOptions = [
    {
      title: "Self-Driving Car Lane Detection",
      subtitle: "Reads camera pixels in real time to steer safely",
      isAi: true,
      comment: "Correct! That's Computer Vision & Neural Networks in action! 🎉 +50 XP"
    },
    {
      title: "Digital Alarm Clock",
      subtitle: "Beeps when internal timer hits 07:00 AM",
      isAi: false,
      comment: "Spot on! An alarm is just a simple hardcoded IF-statement, not AI! ⏰"
    },
    {
      title: "Smart Camera Auto-Focus Face Box",
      subtitle: "Scans for facial geometry and lighting balance",
      isAi: true,
      comment: "Bingo! Machine learning object detection model running on the camera chip! 📸 +50 XP"
    }
  ];

  const faqs = [
    {
      q: "Is Chikoo really built like a game?",
      a: "Yes! There are zero boring 45-minute video lectures. You learn AI by solving 3-minute bite-sized quests, popping quiz nodes on adventure maps, winning cosmic cookies, and battling in 1v1 arenas with Aibo the otter tutor."
    },
    {
      q: "Do students need any coding or math experience?",
      a: "Zero! Chikoo is designed for school students aged 10–18 and curious beginners. If you know how to type on a phone or computer, you will master prompt engineering, LLMs, and AI ethics effortlessly."
    },
    {
      q: "What practical AI skills will I learn?",
      a: "You'll master the C-R-E-A-T-E prompt framework for homework & creative projects, understand how ChatGPT generates tokens, see how Computer Vision detects pixels, and learn to spot deepfakes and AI hallucinations."
    },
    {
      q: "Is Chikoo safe and ad-free for school students?",
      a: "100% kid-safe and supervised. We enforce strict privacy rules, zero third-party ads, zero unmoderated chats, and safe sandboxed prompts."
    }
  ];

  // Calculated Prompt Output in Interactive Lab
  const getPromptPreview = () => {
    const roles = {
      astronaut: "Act as an experienced NASA Astronaut",
      chef: "Act as a Michelin-star Italian Chef",
      detective: "Act as a Sherlock-style Cyber Detective"
    };
    const tasks = {
      explain: "Explain how black holes warp space-time using pizza dough analogies for a 7th grader.",
      recipe: "Invent a 5-minute galactic microwave snack using only cereal, honey, and cinnamon.",
      riddle: "Create a 3-clue logic mystery about a stolen space telescope battery."
    };
    return `${roles[promptRole]}. ${tasks[promptTask]} Provide step-by-step bullet points with zero technical jargon.`;
  };

  return (
    <SeoLayout
      title={CHIKOO_PLATFORM_SEO.metaTitle}
      description={CHIKOO_PLATFORM_SEO.metaDescription}
      breadcrumbs={[{ name: "About Chikoo", url: "/what-is-chikoo" }]}
      activeSection="what-is-chikoo"
      onLaunchApp={onLaunchApp}
    >
      {/* 1. HERO SECTION: High-Energy Gamified Learning Arena */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-amber-100/90 via-orange-50/50 to-white border-3 border-amber-300 p-6 sm:p-10 md:p-12 mb-10 shadow-md">
        {/* Floating Game Badges */}
        <div className="absolute top-4 right-5 opacity-40 pointer-events-none hidden md:block">
          <img src="/cookies.webp" alt="Cookie" className="w-16 h-16 animate-bounce" />
        </div>
        <div className="absolute bottom-6 left-6 opacity-30 pointer-events-none hidden md:block">
          <img src="/streak.webp" alt="Streak Flame" className="w-14 h-14" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          {/* Game Level Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-slate-900 text-xs font-black border-2 border-amber-400 shadow-2xs mb-5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            <img src="/avatar.webp" alt="Aibo" className="w-4 h-4 rounded-full" />
            <span>AI Cadet Academy • Level 1 Online</span>
          </div>

          {/* Winning Punchy Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-4">
            Master Artificial Intelligence in <span className="text-amber-500 underline decoration-wavy decoration-amber-300">3 Minutes</span> a Day
          </h1>

          {/* Mascot Speech Bubble */}
          <div className="inline-flex items-center gap-3 bg-white/90 border-2 border-amber-300 rounded-2xl px-4 py-2.5 mb-6 text-left shadow-xs max-w-xl mx-auto">
            <img src="/heading_aibo.webp" alt="Aibo Mascot" className="w-10 h-10 object-contain shrink-0" />
            <p className="text-xs sm:text-sm font-black text-slate-700">
              <span className="text-amber-600 font-extrabold">Aibo: </span>
              "No boring textbook snoozefests! Pop quest nodes, win cookies, and master real AI tools!"
            </p>
          </div>

          {/* Gamified HUD Status Card Preview */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto bg-white/95 border-2 border-slate-200 rounded-2xl p-3 sm:p-4 mb-7 shadow-xs">
            <div className="flex flex-col items-center">
              <span className="text-xs sm:text-sm font-black text-amber-600 flex items-center gap-1">
                ⚡ 3 Mins
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-500">Daily Quest</span>
            </div>
            <div className="flex flex-col items-center border-x-2 border-slate-100 px-2">
              <span className="text-xs sm:text-sm font-black text-emerald-600 flex items-center gap-1">
                +1,200 XP
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-500">To Unlock</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs sm:text-sm font-black text-purple-600 flex items-center gap-1">
                6 Islands
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-500">Curriculum</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => handleLaunch()}
              className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] text-white font-black text-base sm:text-lg border-b-4 border-[#3D8C02] active:border-b-0 active:translate-y-1 shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2.5 cursor-pointer transform hover:scale-[1.02]"
            >
              <Sparkles className="w-5 h-5 text-yellow-200" />
              <span>Start Learning AI Free →</span>
            </button>

            <a
              href="/units"
              className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-black text-base sm:text-lg border-2 border-slate-300 border-b-4 active:border-b-2 active:translate-y-0.5 shadow-2xs transition-all flex items-center gap-2"
            >
              <Compass className="w-5 h-5 text-sky-500" />
              <span>View World Map</span>
            </a>
          </div>
        </div>
      </section>

      {/* 2. PLAYABLE LIVE ARCADE: Interactive AI Quests (Spot AI & Prompt Lab) */}
      <section className="mb-12">
        <div className="bg-white border-3 border-amber-300 rounded-3xl p-5 sm:p-8 shadow-sm">
          {/* Header with Game Tabs */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 p-1 border-2 border-amber-500 shadow-2xs flex items-center justify-center shrink-0">
                <img src="/Practice.webp" alt="Practice Arena" className="w-10 h-10 object-contain" />
              </div>
              <div>
                <span className="text-[11px] font-black text-amber-600 uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  Live Playable Mini-Quest
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Try a 30-Second Chikoo AI Challenge
                </h2>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border-2 border-slate-200 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('spot')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'spot'
                    ? 'bg-amber-400 text-slate-900 shadow-2xs border border-amber-500'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Spot the AI</span>
              </button>
              <button
                onClick={() => setActiveTab('prompt')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'prompt'
                    ? 'bg-purple-500 text-white shadow-2xs border border-purple-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Prompt Power Lab</span>
              </button>
            </div>
          </div>

          {/* TAB 1: SPOT THE AI MINI-DRILL */}
          {activeTab === 'spot' && (
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-600 mb-4">
                🎯 <strong className="text-slate-900">Mission:</strong> Tap an everyday gadget below to test whether it uses Machine Learning or simple code:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {spotOptions.map((opt, idx) => (
                  <button
                    key={`spot-${opt.title}-${idx}`}
                    onClick={() => setSelectedSpotIndex(idx)}
                    className={`p-4 rounded-2xl border-2 text-left font-bold transition-all cursor-pointer flex flex-col justify-between ${
                      selectedSpotIndex === idx
                        ? 'bg-amber-50 border-amber-500 text-slate-900 ring-2 ring-amber-300'
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-800 hover:border-amber-300'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-black text-amber-600 block mb-1">
                        Item #{idx + 1}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 mb-1">{opt.title}</h4>
                      <p className="text-xs text-slate-500 font-medium">{opt.subtitle}</p>
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-slate-500">
                        {opt.isAi ? '⚡ AI Powered' : '⚙️ Basic Logic'}
                      </span>
                      <span className="text-xs font-black text-amber-600">Tap to inspect</span>
                    </div>
                  </button>
                ))}
              </div>

              {selectedSpotIndex !== null && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-100 to-emerald-50 border-2 border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src="/avatar.webp" alt="Aibo" className="w-10 h-10 rounded-full border border-amber-400 shrink-0" />
                    <p className="text-xs sm:text-sm font-bold text-slate-800">
                      {spotOptions[selectedSpotIndex].comment}
                    </p>
                  </div>
                  <button
                    onClick={() => handleLaunch()}
                    className="px-5 py-2.5 rounded-xl bg-[#58CC02] hover:bg-[#46A302] text-white font-black text-xs sm:text-sm border-b-2 border-[#3D8C02] shrink-0 cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Play Full Lesson in App</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROMPT POWER-UP LAB */}
          {activeTab === 'prompt' && (
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-600 mb-4">
                🪄 <strong className="text-slate-900">C-R-E-A-T-E Framework:</strong> Tap role and task chips to see how a simple sentence turns into an unstoppable AI prompt!
              </p>

              {/* Tag Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-3.5">
                  <span className="text-[11px] font-black text-purple-700 uppercase tracking-wider block mb-2">
                    Step 1: Choose Persona (Role)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setPromptRole('astronaut')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        promptRole === 'astronaut' ? 'bg-purple-600 text-white border-purple-700 shadow-2xs' : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      🚀 NASA Astronaut
                    </button>
                    <button
                      onClick={() => setPromptRole('chef')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        promptRole === 'chef' ? 'bg-purple-600 text-white border-purple-700 shadow-2xs' : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      🍕 Master Chef
                    </button>
                    <button
                      onClick={() => setPromptRole('detective')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        promptRole === 'detective' ? 'bg-purple-600 text-white border-purple-700 shadow-2xs' : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      🕵️ Cyber Detective
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-3.5">
                  <span className="text-[11px] font-black text-sky-700 uppercase tracking-wider block mb-2">
                    Step 2: Choose Quest Task
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setPromptTask('explain')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        promptTask === 'explain' ? 'bg-sky-600 text-white border-sky-700 shadow-2xs' : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      🌌 Explain Black Holes
                    </button>
                    <button
                      onClick={() => setPromptTask('recipe')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        promptTask === 'recipe' ? 'bg-sky-600 text-white border-sky-700 shadow-2xs' : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      🧁 Galactic Snack
                    </button>
                    <button
                      onClick={() => setPromptTask('riddle')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        promptTask === 'riddle' ? 'bg-sky-600 text-white border-sky-700 shadow-2xs' : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      🔍 Space Logic Riddle
                    </button>
                  </div>
                </div>
              </div>

              {/* Output Preview Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border-2 border-purple-500/50 shadow-inner">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                    <Wand2 className="w-4 h-4 text-purple-400" />
                    <span>Generated Pro AI Prompt</span>
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/30">
                    ⚡ 98% Prompt Power Score
                  </span>
                </div>
                <p className="font-mono text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  "{getPromptPreview()}"
                </p>

                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <span className="text-xs text-slate-400 font-medium">
                    Master this in Unit 3: Prompt Engineering Wizardry
                  </span>
                  <button
                    onClick={() => handleLaunch({ unitId: 'unit-3-prompt-engineering' })}
                    className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-black text-xs border-b-2 border-purple-700 shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Launch Prompt Unit →</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. VISUAL WORLD MAP: The 6 Adventure Islands */}
      <section className="mb-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-black text-sky-700 uppercase tracking-wider bg-sky-100 px-3 py-1 rounded-full border border-sky-300">
              Adventure World Map
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              6 Gamified Learning Islands
            </h2>
          </div>

          <a
            href="/units"
            className="px-4 py-2 rounded-xl bg-white hover:bg-sky-50 text-sky-800 font-black text-xs sm:text-sm border-2 border-sky-300 shadow-2xs flex items-center gap-1.5 transition-all"
          >
            <span>Explore All Island Nodes</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* 6 Island Visual Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {units.slice(0, 6).map((unit, idx) => {
            const islandThemes = [
              { color: 'border-emerald-300 bg-emerald-50/40', badge: 'bg-emerald-100 text-emerald-800', chest: '/Chest.webp', emoji: '🌱' },
              { color: 'border-amber-300 bg-amber-50/40', badge: 'bg-amber-100 text-amber-800', chest: '/unit2_chest.webp', emoji: '🤖' },
              { color: 'border-purple-300 bg-purple-50/40', badge: 'bg-purple-100 text-purple-800', chest: '/unit3_chest.webp', emoji: '🪄' },
              { color: 'border-sky-300 bg-sky-50/40', badge: 'bg-sky-100 text-sky-800', chest: '/Chest.webp', emoji: '👁️' },
              { color: 'border-orange-300 bg-orange-50/40', badge: 'bg-orange-100 text-orange-800', chest: '/unit2_chest.webp', emoji: '🧠' },
              { color: 'border-rose-300 bg-rose-50/40', badge: 'bg-rose-100 text-rose-800', chest: '/unit3_chest.webp', emoji: '🛡️' }
            ];
            const theme = islandThemes[idx % islandThemes.length];

            return (
              <div
                key={unit.slug}
                className={`bg-white border-3 ${theme.color} rounded-3xl p-5 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between`}
              >
                <div>
                  {/* Top Bar with Chest & Unit Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-black border border-current/20 ${theme.badge}`}>
                      Island #{idx + 1}
                    </span>
                    <img src={theme.chest} alt="Treasure Chest" className="w-10 h-10 object-contain drop-shadow-xs" />
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1 flex items-center gap-1.5">
                    <span>{theme.emoji}</span>
                    <span>{unit.title}</span>
                  </h3>
                  
                  <p className="text-slate-600 text-xs font-medium line-clamp-2 leading-relaxed mb-4">
                    {unit.description}
                  </p>

                  {/* Level Nodes Visual Bar */}
                  <div className="flex items-center gap-1.5 mb-4 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
                    <span className="text-[11px] font-black text-slate-500 mr-1">Nodes:</span>
                    {unit.lessons.slice(0, 4).map((_, lIdx) => (
                      <div
                        key={`unit-${unit.id || unit.slug}-node-${lIdx}`}
                        className="w-6 h-6 rounded-lg bg-white border-2 border-slate-300 flex items-center justify-center text-[10px] font-black text-slate-700 shadow-2xs"
                      >
                        {lIdx + 1}
                      </div>
                    ))}
                    {unit.lessons.length > 4 && (
                      <span className="text-[10px] font-extrabold text-slate-400 ml-1">
                        +{unit.lessons.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <a
                    href={`/units/${unit.slug}`}
                    className="text-xs font-black text-slate-500 hover:text-slate-800"
                  >
                    View Syllabus
                  </a>
                  <button
                    onClick={() => handleLaunch({ unitId: unit.id })}
                    className="px-3.5 py-1.5 rounded-xl bg-[#58CC02] hover:bg-[#46A302] text-white font-black text-xs border-b-2 border-[#3D8C02] flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Play Island</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. GAMIFIED ARSENAL: Rewards, Quests, 1v1 Battles & Mascot */}
      <section className="mb-12">
        <div className="text-center mb-6">
          <span className="text-xs font-black text-purple-700 uppercase tracking-wider bg-purple-100 px-3 py-1 rounded-full border border-purple-300">
            Gamified Feature Sandbox
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            The Chikoo Game Arsenal
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Lucky Cookie Spin Wheel */}
          <div className="bg-white border-3 border-amber-300 rounded-3xl p-5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-amber-300 p-2 flex items-center justify-center mb-3">
                <img src="/cookies.webp" alt="Lucky Cookies" className="w-10 h-10 object-contain" />
              </div>
              <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Daily Motivation
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-2 mb-1">
                Lucky Cookie Spin Wheel
              </h3>
              <p className="text-slate-600 text-xs font-medium leading-relaxed">
                Spin 3 times daily to earn energy refills, cosmetic avatar hats, and streak protection shields.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-3">
              <span className="text-xs font-bold text-slate-400">Zero Real-Money Ads</span>
              <button
                onClick={() => handleLaunch({ view: 'rewards_store' })}
                className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Spin in App →</span>
              </button>
            </div>
          </div>

          {/* Card 2: 1v1 Lightning Arena */}
          <div className="bg-white border-3 border-purple-300 rounded-3xl p-5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-purple-100 border-2 border-purple-300 p-2 flex items-center justify-center mb-3">
                <img src="/Practice.webp" alt="Practice Arena" className="w-10 h-10 object-contain" />
              </div>
              <span className="text-[10px] font-black uppercase text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                Multiplayer Drills
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-2 mb-1">
                15-Second Lightning Duels
              </h3>
              <p className="text-slate-600 text-xs font-medium leading-relaxed">
                Challenge friends and classmates in lightning AI trivia battles. Test reflex speed and prompt mastery!
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-3">
              <span className="text-xs font-bold text-slate-400">Real-Time Matchmaking</span>
              <button
                onClick={() => handleLaunch({ view: 'practice' })}
                className="text-xs font-black text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Enter Arena →</span>
              </button>
            </div>
          </div>

          {/* Card 3: Galactic League Ranks */}
          <div className="bg-white border-3 border-sky-300 rounded-3xl p-5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-sky-100 border-2 border-sky-300 p-2 flex items-center justify-center mb-3">
                <img src="/Ranks.webp" alt="Ranks & Leagues" className="w-10 h-10 object-contain" />
              </div>
              <span className="text-[10px] font-black uppercase text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                Weekly Tiers
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-2 mb-1">
                Galactic League Leaderboard
              </h3>
              <p className="text-slate-600 text-xs font-medium leading-relaxed">
                Climb 7 competitive league tiers every Sunday. Earn promotion trophies and show off your rank badge!
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-3">
              <span className="text-xs font-bold text-slate-400">Bronze to Cosmic Tier</span>
              <button
                onClick={() => handleLaunch({ view: 'leaderboard' })}
                className="text-xs font-black text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View Standings →</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. GAMIFIED FAQS ACCORDION */}
      <section className="mb-12 bg-white border-3 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xs">
        <div className="text-center mb-6">
          <span className="text-xs font-black text-amber-700 uppercase tracking-wider bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
            Student & Parent Guide
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={`faq-${idx}-${faq.q.slice(0, 15)}`}
              className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 sm:p-5 transition-colors hover:border-amber-300"
            >
              <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-start gap-2.5 mb-1.5">
                <span className="text-amber-500 font-extrabold text-base leading-none">Q.</span>
                <span>{faq.q}</span>
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm font-medium pl-6 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. GRAND VICTORY CHEST CTA: The Final Strong Conversion Push */}
      <section className="rounded-3xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 border-4 border-amber-500 p-6 sm:p-10 text-center relative overflow-hidden shadow-lg">
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="w-18 h-18 rounded-3xl bg-white p-2 border-3 border-amber-500 shadow-md mx-auto mb-4 flex items-center justify-center">
            <img src="/unit2_chest.webp" alt="Treasure Chest" className="w-14 h-14 object-contain animate-pulse" />
          </div>
          
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mb-2">
            Unlock Your First AI Badge Today!
          </h2>
          
          <p className="text-slate-800 text-xs sm:text-sm font-bold mb-6 max-w-lg mx-auto leading-relaxed">
            Join thousands of curious students mastering Prompt Engineering, Generative AI, and Machine Learning on Chikoo!
          </p>

          <button
            onClick={() => handleLaunch()}
            className="px-8 sm:px-12 py-4 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] text-white font-black text-base sm:text-lg border-b-4 border-[#3D8C02] active:border-b-0 active:translate-y-1 shadow-xl shadow-emerald-700/30 transition-all inline-flex items-center gap-2 cursor-pointer transform hover:scale-105"
          >
            <Sparkles className="w-5 h-5 text-yellow-200" />
            <span>Play Chikoo for Free Now →</span>
          </button>
        </div>
      </section>
    </SeoLayout>
  );
}
