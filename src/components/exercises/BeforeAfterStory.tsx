import { motion } from 'framer-motion';
import { ArrowDown, Check, Sparkles, Zap } from 'lucide-react';

interface BeforeAfterStoryProps {
  beforeAfterStory: {
    situation: string;
    beforeTitle?: string;
    beforeText: string;
    beforeEmoji?: string;
    afterTitle?: string;
    afterText: string;
    afterEmoji?: string;
    takeaway: string;
  };
  onSelect: (option: boolean) => void;
  selectedOption: any;
  isChecked: boolean;
}

export default function BeforeAfterStory({
  beforeAfterStory,
  onSelect,
  selectedOption,
  isChecked
}: BeforeAfterStoryProps) {
  const {
    situation,
    beforeTitle,
    beforeText,
    beforeEmoji,
    afterTitle,
    afterText,
    afterEmoji,
    takeaway
  } = beforeAfterStory;

  const isInteracted = selectedOption === true;

  return (
    <div className="flex flex-col space-y-6 w-full py-2">
      <div className="text-center">
        <p className="text-xs font-black uppercase text-amber-500 tracking-widest flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>EFFICIENCY VS CO-PILOT ANALYSIS</span>
        </p>
      </div>

      {/* Hero Situation context */}
      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 text-left">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#00656f] block">
          THE CHALLENGE SITUATION:
        </span>
        <p className="text-sm font-bold text-slate-755 leading-relaxed mt-1">
          {situation}
        </p>
      </div>

      {/* Before and After comparative layout */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch relative">
        {/* Before Card */}
        <div className="flex-1 bg-rose-50/40 rounded-2xl border-2 border-rose-200/40 p-5 flex flex-col justify-between space-y-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">{beforeEmoji || '⏳'}</span>
              <h4 className="font-display font-black text-rose-800 text-xs uppercase tracking-wider">
                {beforeTitle || 'Traditional Way'}
              </h4>
            </div>
            <p className="text-xs font-bold text-slate-600 leading-relaxed">
              {beforeText}
            </p>
          </div>
          <span className="text-[10px] font-black uppercase text-rose-500 tracking-wider">
            ❌ Very High Effort
          </span>
        </div>

        {/* VS Arrow Divider */}
        <div className="flex md:flex-col items-center justify-center shrink-0">
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center text-xs font-black text-slate-400">
            VS
          </div>
        </div>

        {/* After Card */}
        <div className="flex-1 bg-emerald-50/40 rounded-2xl border-2 border-emerald-250/40 p-5 flex flex-col justify-between space-y-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">{afterEmoji || '⚡'}</span>
              <h4 className="font-display font-black text-emerald-800 text-xs uppercase tracking-wider">
                {afterTitle || 'With AI Assistant'}
              </h4>
            </div>
            <p className="text-xs font-bold text-slate-600 leading-relaxed">
              {afterText}
            </p>
          </div>
          <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Fast co-pilot multiplier
          </span>
        </div>
      </div>

      {/* Takeaway statement */}
      <div className="bg-white p-5 rounded-3xl border border-slate-150 flex gap-3.5 items-start">
        <div className="shrink-0 text-xl">🚀</div>
        <div className="space-y-0.5 text-left">
          <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">
            HOW WORKLOAD OPTIMIZES:
          </span>
          <p className="text-xs font-bold text-slate-600 leading-relaxed">
            {takeaway}
          </p>
        </div>
      </div>

      {/* Reaction btn */}
      <div className="flex justify-center">
        <motion.button
          disabled={isChecked}
          onClick={() => onSelect(true)}
          whileHover={!isChecked ? { scale: 1.05 } : {}}
          whileTap={!isChecked ? { scale: 0.95 } : {}}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-display font-black text-sm uppercase tracking-wider transition-all cursor-pointer ${
            isInteracted
              ? 'bg-amber-100 border-2 border-amber-400 text-amber-700 shadow-sm'
              : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300 shadow-[0_4px_0_#e2e8f0]'
          }`}
        >
          <Zap className={`w-5 h-5 ${isInteracted ? 'text-amber-500 animate-bounce' : 'text-slate-400'}`} />
          <span>{isInteracted ? 'Efficiency Noted! ⚡' : 'Analyze Efficiency! 📊'}</span>
        </motion.button>
      </div>
    </div>
  );
}
