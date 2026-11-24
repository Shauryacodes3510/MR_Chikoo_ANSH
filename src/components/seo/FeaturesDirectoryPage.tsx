import React from 'react';
import SeoLayout from './SeoLayout';
import { 
  Zap, 
  ArrowRight, 
  Target, 
  Gift, 
  Compass, 
  Trophy, 
  Sparkles, 
  Search, 
  Swords, 
  CheckCircle2,
  Play
} from 'lucide-react';
import { SEO_FEATURES, SeoFeature } from '../../lib/seoRegistry';

interface FeaturesDirectoryPageProps {
  onLaunchApp?: (target?: { view?: string }) => void;
}

export default function FeaturesDirectoryPage({ onLaunchApp }: FeaturesDirectoryPageProps) {
  const handleLaunch = (target?: { view?: string }) => {
    if (onLaunchApp) {
      onLaunchApp(target);
    } else {
      window.location.href = '/';
    }
  };

  return (
    <SeoLayout
      title="Interactive Platform Features | Chikoo AI Learning"
      description="Explore all gamified features of Chikoo: AI Practice Arena, Speed Challenges, Lucky Cookie Rewards, Daily Quests, Galactic Leaderboard, AI Otter Mascot, Detective Puzzles, and 1v1 Battles."
      breadcrumbs={[{ name: "Platform Features", url: "/features" }]}
      activeSection="features"
      onLaunchApp={onLaunchApp}
    >
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-black border border-purple-300 mb-3 shadow-2xs">
          <Zap className="w-3.5 h-3.5 text-purple-600" />
          <span>The Chikoo Gamified Engine</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-3">
          Chikoo Superpowers & Game Modes
        </h1>
        <p className="text-slate-600 text-sm sm:text-base font-bold leading-relaxed">
          Learning Artificial Intelligence doesn't have to feel like reading a boring textbook. Check out the arenas, reward wheels, and cosmic leaderboards that keep students engaged!
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {SEO_FEATURES.map((feature) => (
          <div
            key={feature.id}
            className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 hover:border-purple-400 hover:shadow-md transition-all flex flex-col justify-between group shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-50 border-2 border-purple-200 p-2 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                  <img src={feature.iconPath} alt={feature.name} className="w-12 h-12 object-contain" />
                </div>
                <span className="text-xs font-black px-3 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-300">
                  {feature.badge}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1 group-hover:text-purple-700 transition-colors">
                <a href={feature.canonicalPath}>{feature.name}</a>
              </h2>
              
              <p className="text-purple-600 text-xs font-extrabold mb-3">
                {feature.tagline}
              </p>

              <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed mb-6">
                {feature.description}
              </p>

              {/* Highlights */}
              <ul className="space-y-2 mb-6">
                {feature.highlights.slice(0, 2).map((hl, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs font-medium text-slate-700">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">✓</span>
                    <span>{hl}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <a
                href={feature.canonicalPath}
                className="text-xs font-black text-slate-600 hover:text-purple-700 flex items-center gap-1"
              >
                <span>Read Deep Dive</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => handleLaunch({ view: feature.appView })}
                className="px-4 py-2 rounded-xl bg-[#58CC02] hover:bg-[#46A302] text-white font-black text-xs border-b-2 border-[#3D8C02] active:border-b-0 active:translate-y-0.5 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Try in Chikoo</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </SeoLayout>
  );
}
