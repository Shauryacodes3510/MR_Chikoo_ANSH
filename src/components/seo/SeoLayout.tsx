import React from 'react';
import { Sparkles, ArrowRight, BookOpen, Zap, Layers, Compass, ChevronRight, Home, Flame, Star, Trophy } from 'lucide-react';
import { CHIKOO_PLATFORM_SEO } from '../../lib/seoRegistry';

interface SeoLayoutProps {
  title: string;
  description: string;
  breadcrumbs?: { name: string; url: string }[];
  children: React.ReactNode;
  activeSection?: 'what-is-chikoo' | 'units' | 'features' | 'learn';
  onLaunchApp?: (target?: { view?: string; unitId?: string; lessonId?: string }) => void;
}

export default function SeoLayout({
  title,
  description,
  breadcrumbs = [],
  children,
  activeSection,
  onLaunchApp
}: SeoLayoutProps) {
  const handleLaunch = (target?: { view?: string; unitId?: string; lessonId?: string }) => {
    if (onLaunchApp) {
      onLaunchApp(target);
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-full w-full bg-[#FAF9F5] text-slate-800 font-sans selection:bg-amber-400 selection:text-slate-900 flex flex-col antialiased">
      {/* Clean, Decluttered Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-2.5 group text-decoration-none">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-400 p-0.5 border-2 border-amber-500 shadow-[0_3px_0_#d97706] group-hover:scale-105 group-active:scale-95 transition-all flex items-center justify-center overflow-hidden shrink-0">
                <img src="/avatar.webp" alt="Chikoo Mascot" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xl sm:text-2xl tracking-tight text-slate-900">
                    Chikoo
                  </span>
                  <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold border border-emerald-300">
                    Learn AI
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 -mt-1 hidden md:inline">
                  3-Min Gamified Quests for Students
                </span>
              </div>
            </a>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden lg:flex items-center gap-1 text-sm font-black">
              <a
                href="/what-is-chikoo"
                className={`px-3.5 py-2 rounded-xl transition-all ${
                  activeSection === 'what-is-chikoo'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                About Chikoo
              </a>
              <a
                href="/units"
                className={`px-3.5 py-2 rounded-xl transition-all ${
                  activeSection === 'units'
                    ? 'bg-sky-100 text-sky-900 border border-sky-300 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Curriculum Units
              </a>
              <a
                href="/features"
                className={`px-3.5 py-2 rounded-xl transition-all ${
                  activeSection === 'features'
                    ? 'bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Game Features
              </a>
              <a
                href="/learn"
                className={`px-3.5 py-2 rounded-xl transition-all ${
                  activeSection === 'learn'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                AI Guides
              </a>
            </nav>
          </div>

          {/* Header Action: Start Learning AI CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleLaunch()}
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] text-white font-black text-xs sm:text-sm border-b-4 border-[#3D8C02] active:border-b-0 active:translate-y-1 shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Learning AI →</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        <div className="lg:hidden px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-around gap-2 text-xs font-black">
          <a
            href="/what-is-chikoo"
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              activeSection === 'what-is-chikoo' ? 'bg-amber-200 text-amber-900' : 'text-slate-600'
            }`}
          >
            About
          </a>
          <a
            href="/units"
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              activeSection === 'units' ? 'bg-sky-200 text-sky-900' : 'text-slate-600'
            }`}
          >
            Units
          </a>
          <a
            href="/features"
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              activeSection === 'features' ? 'bg-purple-200 text-purple-900' : 'text-slate-600'
            }`}
          >
            Features
          </a>
          <a
            href="/learn"
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              activeSection === 'learn' ? 'bg-emerald-200 text-emerald-900' : 'text-slate-600'
            }`}
          >
            Guides
          </a>
        </div>
      </header>

      {/* Breadcrumb Navigation */}
      {breadcrumbs.length > 0 && (
        <div className="bg-amber-50/60 border-b border-amber-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <nav className="flex items-center gap-1.5 text-xs font-bold text-slate-500 flex-wrap" aria-label="Breadcrumb">
              <a href="/" className="hover:text-amber-700 flex items-center gap-1 transition-colors">
                <Home className="w-3.5 h-3.5 text-slate-400" />
                <span>Home</span>
              </a>
              {breadcrumbs.map((b, idx) => (
                <React.Fragment key={b.url + idx}>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  {idx === breadcrumbs.length - 1 ? (
                    <span className="text-amber-800 font-extrabold truncate max-w-[260px] sm:max-w-none">{b.name}</span>
                  ) : (
                    <a href={b.url} className="hover:text-amber-700 transition-colors">
                      {b.name}
                    </a>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-20 lg:pb-10">
        {children}
      </main>

      {/* SEO Internal Linking Footer */}
      <footer className="bg-slate-900 text-slate-300 pt-10 pb-16 lg:pb-8 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Upper Footer Card */}
          <div className="bg-slate-800/90 border-2 border-slate-700 rounded-3xl p-6 sm:p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-400 p-1 border-2 border-amber-300 shadow-md flex items-center justify-center shrink-0">
                <img src="/heading_aibo.webp" alt="Chikoo Mascot" className="w-12 h-12 sm:w-14 sm:h-14 object-contain" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white">Start Your 3-Minute AI Quest Today</h3>
                <p className="text-slate-300 text-xs sm:text-sm mt-0.5">
                  Join school students mastering Prompting, LLMs, and Computer Vision on Chikoo.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleLaunch()}
              className="px-6 py-3 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] text-white font-black text-sm sm:text-base border-b-4 border-[#3D8C02] active:border-b-0 active:translate-y-1 shadow-lg cursor-pointer shrink-0 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Chikoo App Free →</span>
            </button>
          </div>

          {/* Sitemaps & Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 text-xs sm:text-sm">
            <div>
              <h4 className="font-black text-white text-xs sm:text-sm mb-3 uppercase tracking-wider text-amber-400">
                Chikoo
              </h4>
              <ul className="space-y-2 font-semibold">
                <li><a href="/what-is-chikoo" className="hover:text-amber-300 transition-colors">What is Chikoo?</a></li>
                <li><a href="/units" className="hover:text-amber-300 transition-colors">Curriculum Roadmap</a></li>
                <li><a href="/features" className="hover:text-amber-300 transition-colors">Game Features</a></li>
                <li><a href="/learn" className="hover:text-amber-300 transition-colors">AI Knowledge Guides</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-white text-xs sm:text-sm mb-3 uppercase tracking-wider text-sky-400">
                Core Units
              </h4>
              <ul className="space-y-2 font-semibold">
                <li><a href="/units/ai-foundations" className="hover:text-sky-300 transition-colors">AI Fundamentals</a></li>
                <li><a href="/units/generative-ai" className="hover:text-sky-300 transition-colors">Generative AI & LLMs</a></li>
                <li><a href="/units/prompt-engineering" className="hover:text-sky-300 transition-colors">Prompt Engineering</a></li>
                <li><a href="/units/computer-vision" className="hover:text-sky-300 transition-colors">Computer Vision & Pixels</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-white text-xs sm:text-sm mb-3 uppercase tracking-wider text-purple-400">
                Game Modes
              </h4>
              <ul className="space-y-2 font-semibold">
                <li><a href="/features/practice-arena" className="hover:text-purple-300 transition-colors">Practice Arena</a></li>
                <li><a href="/features/rewards" className="hover:text-purple-300 transition-colors">Lucky Cookie Wheel</a></li>
                <li><a href="/features/quests" className="hover:text-purple-300 transition-colors">Daily Cosmic Quests</a></li>
                <li><a href="/features/leaderboard" className="hover:text-purple-300 transition-colors">Leaderboard Leagues</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-white text-xs sm:text-sm mb-3 uppercase tracking-wider text-emerald-400">
                AI Cheat-Sheets
              </h4>
              <ul className="space-y-2 font-semibold">
                <li><a href="/learn/how-large-language-models-work" className="hover:text-emerald-300 transition-colors">How LLMs Work</a></li>
                <li><a href="/learn/mastering-prompt-engineering" className="hover:text-emerald-300 transition-colors">Prompting Masterclass</a></li>
                <li><a href="/learn/machine-learning-basics" className="hover:text-emerald-300 transition-colors">Machine Learning 101</a></li>
                <li><a href="/learn/ai-ethics-and-safety" className="hover:text-emerald-300 transition-colors">AI Ethics & Safety</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
            <p>© {new Date().getFullYear()} Chikoo. Gamified AI Education for Students.</p>
            <p>100% Supervised, Private & Safe</p>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile Quick-Launch Floating CTA */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-slate-200 p-3 shadow-lg">
        <button
          onClick={() => handleLaunch()}
          className="w-full py-3 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] text-white font-black text-sm border-b-4 border-[#3D8C02] active:border-b-0 active:translate-y-1 shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Start Learning AI Free →</span>
        </button>
      </div>
    </div>
  );
}
