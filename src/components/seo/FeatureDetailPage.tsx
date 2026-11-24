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
  BookOpen,
  HelpCircle,
  ShieldCheck,
  Play
} from 'lucide-react';
import { SeoFeature, getSeoUnitBySlug, getSeoTopicBySlug } from '../../lib/seoRegistry';

interface FeatureDetailPageProps {
  feature: SeoFeature;
  onLaunchApp?: (target?: { view?: string }) => void;
}

export default function FeatureDetailPage({ feature, onLaunchApp }: FeatureDetailPageProps) {
  const relatedUnits = feature.relatedUnits.map(u => getSeoUnitBySlug(u)).filter(Boolean);
  const relatedTopics = feature.relatedTopics.map(t => getSeoTopicBySlug(t)).filter(Boolean);

  const getTargetView = () => {
    switch (feature.id) {
      case 'practice-arena':
      case 'battles':
        return 'practice';
      case 'rewards':
        return 'rewards_store';
      case 'quests':
        return 'quests';
      case 'leaderboard':
        return 'leaderboard';
      case 'challenges':
      case 'puzzles':
      default:
        return 'home';
    }
  };

  const handleLaunch = () => {
    if (onLaunchApp) {
      onLaunchApp({ view: getTargetView() });
    } else {
      window.location.href = '/';
    }
  };

  return (
    <SeoLayout
      title={feature.metaTitle}
      description={feature.metaDescription}
      breadcrumbs={[
        { name: "Features", url: "/features" },
        { name: feature.name, url: feature.canonicalPath }
      ]}
      activeSection="features"
      onLaunchApp={onLaunchApp}
    >
      {/* Header Banner */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-10 mb-10 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-black">
              <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-300">
                {feature.badge}
              </span>
              <span className="text-slate-500 font-bold">
                Chikoo Gamified Feature
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 border-2 border-purple-200 p-2 flex items-center justify-center shadow-2xs shrink-0">
                <img src={feature.iconPath} alt={feature.name} className="w-12 h-12 object-contain" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {feature.name}
                </h1>
                <p className="text-purple-600 font-extrabold text-sm sm:text-base mt-0.5">
                  {feature.tagline}
                </p>
              </div>
            </div>

            <p className="text-slate-600 text-sm sm:text-base font-medium max-w-3xl leading-relaxed">
              {feature.longDescription}
            </p>

            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              {feature.keywords.map((kw, i) => (
                <span key={i} className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                  #{kw}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-purple-50/80 border-2 border-purple-200 rounded-3xl p-6 flex flex-col items-center justify-center text-center shrink-0 min-w-[260px] shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-purple-200 border-2 border-purple-400 p-2 flex items-center justify-center mb-3 shadow-2xs">
              <Sparkles className="w-7 h-7 text-purple-800" />
            </div>
            <span className="text-xs text-purple-900 uppercase tracking-wider font-black mb-1">
              Experience this Feature
            </span>
            <button
              onClick={handleLaunch}
              className="w-full mt-2 px-6 py-3.5 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] text-white font-black text-sm border-b-4 border-[#3D8C02] active:border-b-0 active:translate-y-1 shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Feature in Chikoo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature Mechanics & Student Benefits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        {/* Highlights */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span>Key Game Highlights</span>
          </h2>
          <ul className="space-y-3">
            {feature.highlights.map((hl, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-700 text-sm font-medium">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">✓</span>
                <span>{hl}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Student Benefits */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Student & Teacher Benefits</span>
          </h2>
          <ul className="space-y-3">
            {feature.benefits.map((bn, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-700 text-sm font-medium">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">★</span>
                <span>{bn}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Related Units & Knowledge Guides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {relatedUnits.length > 0 && (
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-600" />
              <span>Related Curriculum Units</span>
            </h3>
            <div className="space-y-3">
              {relatedUnits.map((unit: any) => (
                <a
                  key={unit.id}
                  href={unit.canonicalPath}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 transition-all flex items-center justify-between group text-decoration-none"
                >
                  <div>
                    <h4 className="font-black text-sm text-slate-900 group-hover:text-sky-700">
                      {unit.cleanTitle}
                    </h4>
                    <p className="text-slate-500 text-xs font-medium line-clamp-1">
                      {unit.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition-all" />
                </a>
              ))}
            </div>
          </div>
        )}

        {relatedTopics.length > 0 && (
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Related AI Knowledge Guides</span>
            </h3>
            <div className="space-y-3">
              {relatedTopics.map((topic: any) => (
                <a
                  key={topic.slug}
                  href={`/learn/${topic.slug}`}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-all flex items-center justify-between group text-decoration-none"
                >
                  <div>
                    <h4 className="font-black text-sm text-slate-900 group-hover:text-emerald-700">
                      {topic.title}
                    </h4>
                    <p className="text-slate-500 text-xs font-medium line-clamp-1">
                      {topic.summary}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </SeoLayout>
  );
}
