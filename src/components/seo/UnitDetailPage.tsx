import React from 'react';
import SeoLayout from './SeoLayout';
import { 
  BookOpen, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Layers, 
  CheckCircle2, 
  Flame, 
  Award, 
  HelpCircle, 
  Compass,
  Star,
  Play
} from 'lucide-react';
import { SeoUnit, getSeoFeatureBySlug, getSeoTopicBySlug } from '../../lib/seoRegistry';

interface UnitDetailPageProps {
  unit: SeoUnit;
  onLaunchApp?: (target?: { view?: string; unitId?: string; lessonId?: string }) => void;
}

export default function UnitDetailPage({ unit, onLaunchApp }: UnitDetailPageProps) {
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
      title={unit.metaTitle}
      description={unit.metaDescription}
      breadcrumbs={[
        { name: "Units", url: "/units" },
        { name: unit.cleanTitle, url: unit.canonicalPath }
      ]}
      activeSection="units"
      onLaunchApp={onLaunchApp}
    >
      {/* Unit Header Card */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-10 mb-10 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-black">
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                Interactive Learning Unit
              </span>
              <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-900 border border-sky-300">
                {unit.difficulty} Level
              </span>
              <span className="text-slate-500 font-bold">
                {unit.lessonsCount} Micro-Lessons
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              {unit.cleanTitle}
            </h1>

            <p className="text-slate-600 text-sm sm:text-base font-medium max-w-3xl leading-relaxed">
              {unit.description}
            </p>

            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              {unit.keywords.map((kw, i) => (
                <span key={i} className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                  #{kw}
                </span>
              ))}
            </div>
          </div>

          {/* Unit Quick Launch Box */}
          <div className="bg-amber-50/80 border-2 border-amber-200 rounded-3xl p-6 flex flex-col items-center justify-center text-center shrink-0 min-w-[260px] shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-amber-300 border-2 border-amber-400 p-2 flex items-center justify-center mb-3 shadow-2xs">
              <img src="/Chest.webp" alt="Unit Mystery Chest" className="w-12 h-12 object-contain" />
            </div>
            <span className="text-xs text-amber-800 uppercase tracking-wider font-black mb-1">
              Play Full Interactive Unit
            </span>
            <button
              onClick={() => handleLaunch({ unitId: unit.id })}
              className="w-full mt-2 px-6 py-3.5 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] text-white font-black text-sm border-b-4 border-[#3D8C02] active:border-b-0 active:translate-y-1 shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Unit in Chikoo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lesson Roadmap Section */}
      <div className="mb-12">
        <div className="mb-6">
          <span className="text-xs font-black text-sky-700 uppercase tracking-widest bg-sky-100 px-3 py-1 rounded-full border border-sky-300">
            Step-by-Step Level Path
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            Micro-Lessons in {unit.cleanTitle}
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm font-medium mt-1">
            Each lesson is 3 minutes of bite-sized interactive challenges with instant feedback.
          </p>
        </div>

        <div className="space-y-4">
          {unit.lessons.map((lesson, idx) => (
            <div
              key={lesson.id}
              className="bg-white border-2 border-slate-200 rounded-2xl p-5 sm:p-6 hover:border-sky-300 hover:shadow-md transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 border-2 border-sky-300 text-sky-900 font-black text-base flex items-center justify-center shrink-0 shadow-2xs">
                  {idx + 1}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      +{lesson.xpReward} XP
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {lesson.difficulty} Level
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900">
                    <a href={lesson.canonicalPath} className="hover:text-sky-600 transition-colors">
                      {lesson.cleanTitle}
                    </a>
                  </h3>

                  <p className="text-slate-600 text-xs sm:text-sm font-medium max-w-2xl leading-relaxed">
                    {lesson.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                <a
                  href={lesson.canonicalPath}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs border border-slate-300 transition-colors flex items-center gap-1"
                >
                  <span>Preview</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => handleLaunch({ unitId: unit.id, lessonId: lesson.id })}
                  className="px-4 py-2 rounded-xl bg-[#58CC02] hover:bg-[#46A302] text-white font-black text-xs border-b-2 border-[#3D8C02] active:border-b-0 active:translate-y-0.5 shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play Lesson</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Related Features & Knowledge Guides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {relatedFeatures.length > 0 && (
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Related Chikoo Features</span>
            </h3>
            <div className="space-y-3">
              {relatedFeatures.map((feat: any) => (
                <a
                  key={feat.slug}
                  href={`/features/${feat.slug}`}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 transition-all flex items-center justify-between group text-decoration-none"
                >
                  <div className="flex items-center gap-3">
                    <img src={feat.iconPath} alt={feat.title} className="w-8 h-8 object-contain" />
                    <div>
                      <h4 className="font-black text-sm text-slate-900 group-hover:text-amber-700">
                        {feat.title}
                      </h4>
                      <p className="text-slate-500 text-xs font-medium line-clamp-1">
                        {feat.shortDescription}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                </a>
              ))}
            </div>
          </div>
        )}

        {relatedTopics.length > 0 && (
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <span>AI Cheat-Sheets & Guides</span>
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
