import { motion } from 'framer-motion';
import { Sparkles, Calendar, Clock, ArrowRight, Zap, AlertCircle } from 'lucide-react';

interface BeforeAfterAiProps {
  beforeAfterAi: {
    situation: string;
    beforeLabel: string;
    beforeContent: string;
    beforeMetric: string;
    afterLabel: string;
    afterContent: string;
    afterMetric: string;
    question: string;
    options: string[];
    correctAnswer: string;
    whyInsight: string;
  };
  onSelect: (option: string) => void;
  selectedOption: string | null;
  isChecked: boolean;
  isCorrect: boolean;
}

export default function BeforeAfterAI({
  beforeAfterAi,
  onSelect,
  selectedOption,
  isChecked,
  isCorrect
}: BeforeAfterAiProps) {
  const {
    situation,
    beforeLabel,
    beforeContent,
    beforeMetric,
    afterLabel,
    afterContent,
    afterMetric,
    question,
    options,
    correctAnswer,
    whyInsight
  } = beforeAfterAi;

  return (
    <div className="flex flex-col space-y-6 w-full">
      {/* Top Situation Statement */}
      <div className="bg-slate-50 border-2 border-slate-150 rounded-2xl p-4.5 text-center">
        <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">
          CASE STUDY OUTLINE:
        </h4>
        <p className="text-xs font-bold text-slate-700 leading-normal">
          {situation}
        </p>
      </div>

      {/* Side-by-Side Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {/* Before AI Card */}
        <div className="bg-rose-50/40 border-2 border-rose-100 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-100">
              <Clock className="w-3" />
              {beforeLabel}
            </span>
            <p className="text-xs font-bold leading-relaxed text-slate-600">
              {beforeContent}
            </p>
          </div>
          <div className="pt-2 border-t border-rose-100/60">
            <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider mb-0.5">Time / Effort Spent:</span>
            <span className="text-sm font-display font-black text-rose-700">
              {beforeMetric}
            </span>
          </div>
        </div>

        {/* After AI Card */}
        <div className="bg-emerald-50/40 border-2 border-emerald-100 p-5 rounded-2xl flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-1 opacity-10">
            <Zap className="w-16 h-16 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
              <Zap className="w-3" />
              {afterLabel}
            </span>
            <p className="text-xs font-bold leading-relaxed text-slate-700">
              {afterContent}
            </p>
          </div>
          <div className="pt-2 border-t border-emerald-100/60">
            <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider mb-0.5">Time / Effort Spent:</span>
            <span className="text-sm font-display font-black text-emerald-700">
              {afterMetric}
            </span>
          </div>
        </div>
      </div>

      {/* Quiz Area */}
      <div className="border-t-2 border-slate-100 pt-5 space-y-4">
        <div className="text-center">
          <span className="text-[10px] font-black tracking-wider uppercase text-slate-400">
            COMPARE & REFLECT:
          </span>
          <h3 className="text-sm font-display font-black text-slate-800 leading-snug mt-1 text-left">
            {question}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options.map((option, idx) => {
            const isSelected = selectedOption === option;
            const isActuallyCorrect = option === correctAnswer;

            let blockClass = 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white hover:bg-slate-50/50 shadow-[0_4px_0_#cbd5e1]';
            if (isSelected) {
              blockClass = isChecked
                ? isCorrect
                  ? 'bg-green-50 border-green-500 text-green-800 shadow-[0_4px_0_#10b981]'
                  : 'bg-rose-50 border-rose-500 text-rose-800 shadow-[0_4px_0_#f43f5e]'
                : 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-[0_4px_0_#6366f1]';
            } else if (isChecked && isActuallyCorrect) {
              blockClass = 'bg-[#e8fbf0] border-emerald-500 text-emerald-800 shadow-[0_4px_0_#10b981] opacity-90';
            } else if (isChecked) {
              blockClass = 'opacity-40 bg-slate-50 border-slate-200 text-slate-400 shadow-none';
            }

            return (
              <motion.button
                key={`ba-opt-${idx}-${option}`}
                disabled={isChecked}
                onClick={() => onSelect(option)}
                whileHover={!isChecked ? { y: -1, scale: 1.01 } : {}}
                whileTap={!isChecked ? { y: 1, scale: 0.99 } : {}}
                className={`p-4 rounded-xl border-2 font-display font-black text-xs text-left transition-all cursor-pointer flex items-center gap-2.5 relative ${blockClass}`}
              >
                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 font-black text-[10px] border ${
                  isSelected ? 'bg-indigo-200 border-indigo-300 text-indigo-800' : 'bg-slate-100 border-slate-200'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="leading-snug">{option}</span>
              </motion.button>
            );
          })}
        </div>

        {isChecked && (
          <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-xs font-semibold text-slate-600 leading-relaxed text-center">
            <span className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-widest">
              LEARNING NOTE
            </span>
            {whyInsight}
          </div>
        )}
      </div>
    </div>
  );
}
