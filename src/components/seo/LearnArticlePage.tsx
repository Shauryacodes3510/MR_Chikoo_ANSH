import React from 'react';
import SeoLayout from './SeoLayout';
import { 
  BookOpen, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  Brain, 
  CheckCircle2, 
  HelpCircle, 
  Zap, 
  Layers, 
  ChevronRight,
  Play,
  Star
} from 'lucide-react';
import { SeoTopicArticle, getSeoUnitBySlug, getSeoFeatureBySlug } from '../../lib/seoRegistry';

interface LearnArticlePageProps {
  article: SeoTopicArticle;
  onLaunchApp?: (target?: { view?: string; unitId?: string; lessonId?: string }) => void;
}

export default function LearnArticlePage({ article, onLaunchApp }: LearnArticlePageProps) {
  const relatedUnits = article.relatedUnits.map(u => getSeoUnitBySlug(u)).filter(Boolean);
  const relatedFeatures = article.relatedFeatures.map(f => getSeoFeatureBySlug(f)).filter(Boolean);

  const handleLaunch = (target?: { view?: string; unitId?: string; lessonId?: string }) => {
    if (onLaunchApp) {
      onLaunchApp(target);
    } else {
      window.location.href = '/';
    }
  };

  return (
    <SeoLayout
      title={article.metaTitle}
      description={article.metaDescription}
      breadcrumbs={[
        { name: "Knowledge Hub", url: "/learn" },
        { name: article.title, url: article.canonicalPath }
      ]}
      activeSection="learn"
      onLaunchApp={onLaunchApp}
    >
      <article className="max-w-4xl mx-auto">
        {/* Article Header */}
        <header className="mb-10 text-center md:text-left bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-black mb-3">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
              {article.category}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {article.readingTime}
            </span>
            <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-900 border border-sky-300">
              {article.difficulty} Level
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
            {article.title}
          </h1>

          <p className="text-slate-600 text-sm sm:text-lg font-medium leading-relaxed max-w-3xl">
            {article.summary}
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-4">
            {article.keywords.map((kw, i) => (
              <span key={`kw-${kw}-${i}`} className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                #{kw}
              </span>
            ))}
          </div>
        </header>

        {/* Mascot Pro-Tip Speech Bubble */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 mb-10 shadow-2xs flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-400 border-2 border-amber-500 p-1 flex items-center justify-center shrink-0 shadow-xs">
            <img src="/heading_aibo.webp" alt="Aibo" className="w-12 h-12 object-contain" />
          </div>
          <div>
            <span className="text-xs font-black text-amber-700 uppercase tracking-wider">
              Aibo's Student Pro-Tip
            </span>
            <p className="text-slate-800 text-xs sm:text-sm font-bold mt-0.5 leading-snug">
              "When learning this topic, try relating it to everyday things! Think of AI like a really fast assistant chef who needs exact recipe instructions to bake the perfect cake."
            </p>
          </div>
        </div>

        {/* Key Takeaways Box */}
        <div className="bg-white border-2 border-emerald-300 rounded-3xl p-6 sm:p-8 mb-10 shadow-xs">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span>Key Takeaways & Cheat-Sheet Summary</span>
          </h2>
          <ul className="space-y-3">
            {article.keyTakeaways.map((takeaway, idx) => (
              <li key={`takeaway-${idx}-${takeaway.slice(0, 10)}`} className="flex items-start gap-3 text-slate-700 text-sm sm:text-base font-medium leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">✓</span>
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Article Body Sections */}
        <div className="space-y-8 mb-12">
          {article.sections.map((sec, idx) => (
            <section key={`sec-${sec.heading || idx}-${idx}`} className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {sec.heading}
              </h2>
              <p className="text-slate-700 text-sm sm:text-base font-medium leading-relaxed">
                {sec.content}
              </p>
              {sec.takeaways && sec.takeaways.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                  {sec.takeaways.map((t, tIdx) => (
                    <div key={`sec-takeaway-${tIdx}-${t.slice(0, 10)}`} className="flex items-start gap-2 text-xs sm:text-sm font-semibold text-slate-700">
                      <span className="text-emerald-600 font-black">★</span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Interactive Practice Callout */}
        <div className="bg-gradient-to-r from-amber-100/80 via-yellow-100/50 to-white border-2 border-amber-300 rounded-3xl p-6 sm:p-8 shadow-sm mb-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-400 border-2 border-amber-500 p-1.5 flex items-center justify-center shrink-0 shadow-xs">
              <img src="/avatar.webp" alt="Chikoo" className="w-12 h-12 object-contain" />
            </div>
            <div>
              <h3 className="font-black text-lg sm:text-xl text-slate-900">
                Ready to try this in Chikoo?
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm font-medium">
                Complete 3-minute interactive AI challenges and win cookie chests!
              </p>
            </div>
          </div>

          <button
            onClick={() => handleLaunch()}
            className="px-6 py-3.5 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] text-white font-black text-sm border-b-4 border-[#3D8C02] active:border-b-0 active:translate-y-1 shadow-md shadow-emerald-600/20 cursor-pointer shrink-0 inline-flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Play in Chikoo Now →</span>
          </button>
        </div>

        {/* Related Units & Features */}
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

          {relatedFeatures.length > 0 && (
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xs">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-600" />
                <span>Related Chikoo Features</span>
              </h3>
              <div className="space-y-3">
                {relatedFeatures.map((feat: any) => (
                  <a
                    key={feat.slug}
                    href={`/features/${feat.slug}`}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 transition-all flex items-center justify-between group text-decoration-none"
                  >
                    <div className="flex items-center gap-3">
                      <img src={feat.iconPath} alt={feat.title} className="w-8 h-8 object-contain" />
                      <div>
                        <h4 className="font-black text-sm text-slate-900 group-hover:text-purple-700">
                          {feat.title}
                        </h4>
                        <p className="text-slate-500 text-xs font-medium line-clamp-1">
                          {feat.shortDescription}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </SeoLayout>
  );
}
