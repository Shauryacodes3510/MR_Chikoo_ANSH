import React from 'react';
import SeoLayout from './SeoLayout';
import { 
  BookOpen, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Layers, 
  CheckCircle2,
  Trophy,
  Flame,
  Star
} from 'lucide-react';
import { getAllSeoUnits, SeoUnit } from '../../lib/seoRegistry';
import { Module } from '../../lib/curriculumTypes';

interface UnitsDirectoryPageProps {
  dynamicModules?: Module[];
  onLaunchApp?: (target?: { view?: string; unitId?: string; lessonId?: string }) => void;
}

export default function UnitsDirectoryPage({ dynamicModules, onLaunchApp }: UnitsDirectoryPageProps) {
  const units = getAllSeoUnits(dynamicModules);

  return (
    <SeoLayout
      title="All AI Learning Units & Curriculum | Chikoo"
      description="Browse all interactive AI learning units on Chikoo. Step-by-step gamified lessons covering AI fundamentals, Generative AI, Machine Learning, Computer Vision, and Ethics."
      breadcrumbs={[{ name: "Units Curriculum", url: "/units" }]}
      activeSection="units"
      onLaunchApp={onLaunchApp}
    >
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-black border border-sky-300 mb-3 shadow-2xs">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Interactive AI Curriculum Map</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-3">
          AI Learning Units & Space Missions
        </h1>
        <p className="text-slate-600 text-sm sm:text-base font-bold leading-relaxed">
          Master Artificial Intelligence one 3-minute quest at a time. Each unit features interactive challenges, cosmic cookie rewards, and instant feedback from Aibo the otter!
        </p>
      </div>

      {/* Units List */}
      <div className="space-y-8">
        {units.map((unit, index) => {
          const chestImg = index % 3 === 0 ? '/Chest.webp' : index % 3 === 1 ? '/unit2_chest.webp' : '/unit3_chest.webp';
          return (
            <div
              key={unit.id}
              className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 hover:border-amber-400 hover:shadow-md transition-all shadow-xs"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 border-2 border-amber-200 p-1.5 shrink-0 flex items-center justify-center shadow-2xs">
                    <img src={chestImg} alt="Unit Chest" className="w-12 h-12 object-contain" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-black">
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
                        Unit {index + 1}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-sky-100 text-sky-900 border border-sky-300">
                        {unit.difficulty}
                      </span>
                      <span className="text-slate-500 font-bold">
                        {unit.lessonsCount} Micro-Lessons
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                      <a href={unit.canonicalPath} className="hover:text-amber-600 transition-colors">
                        {unit.cleanTitle}
                      </a>
                    </h2>

                    <p className="text-slate-600 text-xs sm:text-sm font-medium max-w-3xl leading-relaxed">
                      {unit.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <a
                    href={unit.canonicalPath}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs sm:text-sm border border-slate-300 transition-colors flex items-center gap-1.5"
                  >
                    <span>View Roadmap</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => onLaunchApp ? onLaunchApp({ unitId: unit.id }) : (window.location.href = `/`)}
                    className="px-5 py-2.5 rounded-xl bg-[#58CC02] hover:bg-[#46A302] text-white font-black text-xs sm:text-sm border-b-3 border-[#3D8C02] active:border-b-0 active:translate-y-0.5 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Play Unit in Chikoo →</span>
                  </button>
                </div>
              </div>

              {/* Lessons Preview Grid */}
              <div className="pt-6">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <span>Micro-Lessons in this Unit:</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {unit.lessons.map((lesson, lIdx) => (
                    <a
                      key={lesson.id}
                      href={lesson.canonicalPath}
                      className="p-4 rounded-2xl bg-slate-50 hover:bg-amber-50/70 border-2 border-slate-200/80 hover:border-amber-300 transition-all group flex flex-col justify-between text-decoration-none"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-black text-slate-500">Lesson {lIdx + 1}</span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-black text-[11px] flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            +{lesson.xpReward} XP
                          </span>
                        </div>

                        <h4 className="font-black text-slate-900 text-sm group-hover:text-amber-700 transition-colors mb-1">
                          {lesson.cleanTitle}
                        </h4>

                        <p className="text-slate-600 text-xs font-medium line-clamp-2 leading-relaxed">
                          {lesson.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-black text-amber-600 group-hover:text-amber-700">
                        <span>Preview Lesson</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SeoLayout>
  );
}
