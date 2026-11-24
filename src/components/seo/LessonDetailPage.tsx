import React from 'react';
import SeoLayout from './SeoLayout';
import { 
  BookOpen, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  Flame, 
  HelpCircle,
  Brain,
  Award,
  Layers,
  Smile,
  Star,
  Play
} from 'lucide-react';
import { SeoLesson, SeoUnit, getSeoFeatureBySlug, getSeoTopicBySlug } from '../../lib/seoRegistry';

interface LessonDetailPageProps {
  unit: SeoUnit;
  lesson: SeoLesson;
  onLaunchApp?: (target?: { view?: string; unitId?: string; lessonId?: string }) => void;
}

export default function LessonDetailPage({ unit, lesson, onLaunchApp }: LessonDetailPageProps) {
  const relatedFeatures = unit.relatedFeatures.map(f => getSeoFeatureBySlug(f)).filter(Boolean);
  const relatedTopics = unit.relatedTopics.map(t => getSeoTopicBySlug(t)).filter(Boolean);

  const handleLaunch = (target?: { view?: string; unitId?: string; lessonId?: string }) => {
    if (onLaunchApp) {
      onLaunchApp(target);
    } else {
      window.location.href = '/';
    }
  };

  return (
    <SeoLayout
      title={lesson.metaTitle}
      description={lesson.metaDescription}
      breadcrumbs={[
        { name: "Units", url: "/units" },
        { name: unit.cleanTitle, url: unit.canonicalPath },
        { name: lesson.cleanTitle, url: lesson.canonicalPath }
      ]}
      activeSection="units"
      onLaunchApp={onLaunchApp}
    >
      {/* Lesson Header Card */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-10 mb-10 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-black">
              <a 
                href={unit.canonicalPath} 
                className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors"
              >
                Part of: {unit.cleanTitle}
              </a>
              <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-900 border border-sky-300">
                {lesson.difficulty} Level
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 font-black">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                +{lesson.xpReward} XP Reward
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              {lesson.cleanTitle}
            </h1>

            <p className="text-slate-600 text-sm sm:text-base font-medium max-w-3xl leading-relaxed">
              {lesson.description}
            </p>

            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              {lesson.keywords.map((kw, i) => (
                <span key={i} className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                  #{kw}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Play Card */}
          <div className="bg-emerald-50/80 border-2 border-emerald-200 rounded-3xl p-6 flex flex-col items-center justify-center text-center shrink-0 min-w-[260px] shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-emerald-200 border-2 border-emerald-400 p-2 flex items-center justify-center mb-3 shadow-2xs">
              <img src="/avatar.webp" alt="Aibo" className="w-10 h-10 object-contain" />
            </div>
            <span className="text-xs text-emerald-800 uppercase tracking-wider font-black mb-1">
              Interactive Lesson
            </span>
            <p className="text-xs text-slate-500 font-bold mb-3">
              {lesson.challengesCount} Gamified Challenges
            </p>
            <button
              onClick={() => handleLaunch({ unitId: unit.id, lessonId: lesson.id })}
              className="w-full px-6 py-3.5 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] text-white font-black text-sm border-b-4 border-[#3D8C02] active:border-b-0 active:translate-y-1 shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play Lesson in Chikoo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lesson Content Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Left 2 Cols: Key Takeaways & Concept Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-amber-500" />
              <span>What You Will Master</span>
            </h2>
            <ul className="space-y-3.5">
              <li className="flex items-start gap-3 text-slate-700 font-medium text-sm">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">✓</span>
                <span><strong>Core Mental Model:</strong> Understand how this AI concept works through everyday analogies, not dry academic jargon.</span>
              </li>
              <li className="flex items-start gap-3 text-slate-700 font-medium text-sm">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">✓</span>
                <span><strong>Hands-on Challenge:</strong> Solve {lesson.challengesCount} interactive drills with instant tutor tips from Aibo.</span>
              </li>
              <li className="flex items-start gap-3 text-slate-700 font-medium text-sm">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">✓</span>
                <span><strong>Practical Application:</strong> Learn how to safely apply these skills for homework, creative projects, or coding.</span>
              </li>
            </ul>
          </div>

          {/* Interactive Lesson Play Callout */}
          <div className="bg-gradient-to-r from-sky-100/80 via-amber-50 to-white border-2 border-sky-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-400 border-2 border-amber-500 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                <img src="/heading_aibo.webp" alt="Aibo Mascot" className="w-12 h-12 object-contain" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg text-slate-900">
                  Ready to test your intuition?
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                  Launch this 3-minute interactive lesson and earn +{lesson.xpReward} XP!
                </p>
              </div>
            </div>

            <button
              onClick={() => handleLaunch({ unitId: unit.id, lessonId: lesson.id })}
              className="px-6 py-3 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] text-white font-black text-sm border-b-4 border-[#3D8C02] active:border-b-0 active:translate-y-1 shadow-md cursor-pointer shrink-0"
            >
              Start Lesson →
            </button>
          </div>
        </div>

        {/* Right Col: Unit Context & Related Links */}
        <div className="space-y-6">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xs">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4">
              Part of this Learning Unit
            </h3>
            <h4 className="text-lg font-black text-slate-900 mb-2">
              {unit.cleanTitle}
            </h4>
            <p className="text-slate-600 text-xs font-medium leading-relaxed mb-4">
              {unit.description}
            </p>
            <a
              href={unit.canonicalPath}
              className="text-xs font-black text-sky-600 hover:text-sky-800 flex items-center gap-1"
            >
              <span>View All {unit.lessonsCount} Lessons in Unit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {relatedTopics.length > 0 && (
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xs">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
                Related AI Cheat-Sheet
              </h3>
              <div className="space-y-2.5">
                {relatedTopics.map((t: any) => (
                  <a
                    key={t.slug}
                    href={`/learn/${t.slug}`}
                    className="block p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-all group text-decoration-none"
                  >
                    <h5 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700">
                      {t.title}
                    </h5>
                    <p className="text-slate-500 text-[11px] font-medium line-clamp-1 mt-0.5">
                      {t.summary}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </SeoLayout>
  );
}
