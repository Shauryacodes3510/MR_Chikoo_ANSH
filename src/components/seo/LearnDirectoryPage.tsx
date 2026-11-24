import React from 'react';
import SeoLayout from './SeoLayout';
import { 
  BookOpen, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  Brain, 
  CheckCircle2,
  Tag,
  Star,
  Play
} from 'lucide-react';
import { SEO_TOPICS, SeoTopicArticle } from '../../lib/seoRegistry';

interface LearnDirectoryPageProps {
  onLaunchApp?: () => void;
}

export default function LearnDirectoryPage({ onLaunchApp }: LearnDirectoryPageProps) {
  const handleLaunch = () => {
    if (onLaunchApp) {
      onLaunchApp();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <SeoLayout
      title="AI Knowledge Hub & Cheat-Sheets | Chikoo"
      description="Read comprehensive, student-friendly guides on Artificial Intelligence. Learn how Generative AI, Large Language Models, Prompt Engineering, Machine Learning, and Computer Vision work."
      breadcrumbs={[{ name: "AI Knowledge Hub", url: "/learn" }]}
      activeSection="learn"
      onLaunchApp={onLaunchApp}
    >
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black border border-emerald-300 mb-3 shadow-2xs">
          <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
          <span>AI Superpower Cheat-Sheets</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-3">
          AI Knowledge Hub & Guides
        </h1>
        <p className="text-slate-600 text-sm sm:text-base font-bold leading-relaxed">
          Clear, jargon-free, bite-sized articles breaking down core Artificial Intelligence concepts, prompt frameworks, neural networks, and digital safety.
        </p>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {SEO_TOPICS.map((topic) => (
          <article
            key={topic.id}
            className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between group shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between gap-4 mb-3 text-xs">
                <span className="font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  {topic.category}
                </span>
                <span className="text-slate-500 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {topic.readingTime}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">
                <a href={topic.canonicalPath}>{topic.title}</a>
              </h2>

              <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed mb-6">
                {topic.summary}
              </p>

              {/* Key Takeaways snippet */}
              <div className="space-y-2 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                {topic.keyTakeaways.slice(0, 2).map((takeaway, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs font-medium text-slate-700">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">✓</span>
                    <span>{takeaway}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <a
                href={topic.canonicalPath}
                className="text-xs font-black text-emerald-600 hover:text-emerald-800 flex items-center gap-1 transition-colors"
              >
                <span>Read Full Guide</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </a>

              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                {topic.difficulty}
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-emerald-100/80 via-sky-50 to-white border-2 border-emerald-200 rounded-3xl p-6 sm:p-8 text-center max-w-3xl mx-auto shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-amber-400 p-1 border-2 border-amber-500 shadow-2xs mx-auto mb-3 flex items-center justify-center">
          <img src="/avatar.webp" alt="Aibo" className="w-11 h-11 object-contain" />
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">Ready to test what you read?</h3>
        <p className="text-slate-600 text-xs sm:text-sm font-medium mb-6">
          Put these AI concepts into practice with interactive 3-minute challenges and earn cosmic cookies in Chikoo!
        </p>
        <button
          onClick={handleLaunch}
          className="px-6 py-3 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] text-white font-black text-sm border-b-4 border-[#3D8C02] active:border-b-0 active:translate-y-1 shadow-md shadow-emerald-600/20 cursor-pointer inline-flex items-center gap-2"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Launch Interactive Practice in Chikoo →</span>
        </button>
      </div>
    </SeoLayout>
  );
}
