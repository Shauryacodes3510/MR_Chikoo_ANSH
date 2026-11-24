import { motion } from 'framer-motion';
import { Sparkles, Trophy, Check, MessageSquare } from 'lucide-react';

interface RankerOutput {
  id: string;
  title: string;
  content: string;
  emoji: string;
  criteria: string; // e.g. "Best", "Useful but incomplete", "Silly detour"
  isCorrect: boolean;
  reason: string;
}

interface ResultRankerProps {
  resultRanker: {
    prompt: string;
    outputs: RankerOutput[];
    rankType: string; // e.g. "Pick the Best Answer", "Pick the Most Accurate Answer", "Pick the Most Useful Answer"
  };
  onSelect: (id: string | RankerOutput) => void;
  selectedOption: any;
  isChecked: boolean;
  isCorrect: boolean;
}

export default function ResultRanker({
  resultRanker,
  onSelect,
  selectedOption,
  isChecked,
  isCorrect
}: ResultRankerProps) {
  const { prompt, outputs, rankType } = resultRanker;

  return (
    <div className="flex flex-col space-y-5 w-full">
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mb-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
          The Prompt Used:
        </span>
        <p className="font-mono text-xs font-semibold text-slate-700 bg-white p-3 rounded-lg border border-slate-150 leading-relaxed">
          "{prompt}"
        </p>
      </div>

      <div className="text-center py-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-650 bg-indigo-50 border border-indigo-150 px-3 py-1 rounded-full">
          🎯 MISSION: {rankType}
        </span>
      </div>

      <div className="space-y-4 w-full">
        {outputs.map((out, idx) => {
          const isSelected = selectedOption === out.id || (selectedOption && typeof selectedOption === 'object' && selectedOption.id === out.id);
          const shouldHighlightCorrect = isChecked && out.isCorrect;

          let cardClass = 'bg-white border-slate-200 text-slate-700 hover:border-chikoo-blue-300 shadow-[0_4px_0_#e2e8f0]';
          if (isSelected) {
            cardClass = isChecked
              ? isCorrect
                ? 'bg-green-50 border-green-500 text-green-800 shadow-[0_4px_0_#10b981]'
                : 'bg-rose-50 border-rose-500 text-rose-800 shadow-[0_4px_0_#f43f5e]'
              : 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-[0_4px_0_#6366f1]';
          } else if (shouldHighlightCorrect) {
            cardClass = 'bg-green-50/50 border-green-450 text-green-700 shadow-[0_4px_0_#10b981] opacity-95';
          } else if (isChecked) {
            cardClass = 'opacity-40 bg-slate-50 border-slate-200 text-slate-400 shadow-none';
          }

          return (
            <motion.button
              key={out.id ? `ranker-out-${out.id}` : `ranker-out-${idx}-${out.title?.slice(0, 10)}`}
              disabled={isChecked}
              onClick={() => onSelect(out)}
              whileHover={!isChecked ? { y: -1, scale: 1.005 } : {}}
              whileTap={!isChecked ? { y: 1, scale: 0.995 } : {}}
              className={`p-4.5 rounded-2xl border-2 text-left flex flex-col space-y-3.5 transition-all relative overflow-hidden w-full cursor-pointer ${cardClass}`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="text-lg bg-slate-100 p-1 rounded border border-slate-150 shrink-0">
                    {out.emoji}
                  </span>
                  <h4 className="text-xs font-black text-slate-800 leading-tight">
                    {out.title}
                  </h4>
                </div>
                {isChecked && (
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    out.isCorrect ? 'bg-green-150 text-green-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {out.criteria}
                  </span>
                )}
              </div>

              <p className="text-xs font-bold leading-relaxed text-slate-600 bg-slate-50/60 p-3 rounded-xl border border-slate-150">
                {out.content}
              </p>

              {isChecked && (out.isCorrect || isSelected) && (
                <div className={`p-3 rounded-xl text-[11px] font-semibold leading-normal ${
                  out.isCorrect ? 'bg-green-100/50 text-green-800' : 'bg-rose-100/50 text-rose-800'
                }`}>
                  <strong className="block text-[8px] uppercase font-black tracking-wider mb-0.5">
                    {out.isCorrect ? '🌟 QUALITY WINNER DETAILED EVALUATION:' : '⚠️ DETAILED FEEDBACK:'}
                  </strong>
                  {out.reason}
                </div>
              )}

              {isSelected && !isChecked && (
                <div className="absolute top-2 right-2 flex items-center justify-center bg-chikoo-blue-500 text-white rounded-full p-0.5 shadow-sm">
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
