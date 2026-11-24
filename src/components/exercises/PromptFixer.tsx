import { motion } from 'framer-motion';
import { Sparkles, Check, AlertTriangle, ArrowRight, CornerDownRight } from 'lucide-react';

interface FixOption {
  text: string;
  isCorrect: boolean;
  feedback: string;
}

interface PromptFixerProps {
  promptFixer: {
    badPrompt: string;
    badFeedback: string;
    options: FixOption[];
    correctAnswer: string;
    improvedExplanation: string;
  };
  onSelect: (option: string | FixOption) => void;
  selectedOption: any;
  isChecked: boolean;
  isCorrect: boolean;
}

export default function PromptFixer({
  promptFixer,
  onSelect,
  selectedOption,
  isChecked,
  isCorrect
}: PromptFixerProps) {
  const { badPrompt, badFeedback, options, correctAnswer, improvedExplanation } = promptFixer;

  return (
    <div className="flex flex-col space-y-6 w-full">
      <div className="text-center">
        <p className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center justify-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          <span>PROMPT RECONSTRUCTION: Fix the vague draft!</span>
        </p>
      </div>

      {/* Bad Prompt Box */}
      <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-4.5 space-y-2">
        <div className="flex items-center gap-1.5 text-red-700 font-display font-black text-xs uppercase">
          <span>❌ Low-Power Vague Draft</span>
        </div>
        <p className="font-mono text-xs font-bold text-slate-800 bg-white border border-slate-200 p-3.5 rounded-lg leading-relaxed dark:text-slate-800">
          "{badPrompt}"
        </p>
        <div className="flex items-start gap-1 text-[11px] font-bold text-red-700/80 italic leading-snug">
          <CornerDownRight className="w-4 h-4 shrink-0" />
          <span>Why this is weak: {badFeedback}</span>
        </div>
      </div>

      {/* Interactive Options list */}
      <div className="border-t-2 border-slate-100 pt-5 space-y-3">
        <h4 className="text-xs font-display font-black text-slate-800 text-center uppercase tracking-wider mb-2">
          How would you improve this prompt?
        </h4>

        <div className="space-y-3">
          {options.map((opt, idx) => {
            const isSelected = selectedOption === opt.text || (selectedOption && typeof selectedOption === 'object' && selectedOption.text === opt.text);
            const shouldHighlightCorrect = isChecked && opt.isCorrect;

            let cardClass = 'bg-white border-slate-200 text-slate-700 hover:border-aibo-blue-300 shadow-[0_4px_0_#e2e8f0]';
            if (isSelected) {
              cardClass = isChecked
                ? isCorrect
                  ? 'bg-green-50 border-green-500 text-green-800 shadow-[0_4px_0_#10b981]'
                  : 'bg-rose-50 border-rose-500 text-rose-800 shadow-[0_4px_0_#f43f5e]'
                : 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-[0_4px_0_#6366f1]';
            } else if (shouldHighlightCorrect) {
              cardClass = 'bg-green-10 border-green-400 text-green-700 shadow-[0_4px_0_#10b981] opacity-95';
            } else if (isChecked) {
              cardClass = 'opacity-40 bg-slate-50 border-slate-200 text-slate-400 shadow-none';
            }

            return (
              <motion.button
                key={`pf-opt-${idx}-${opt.text.slice(0, 15)}`}
                disabled={isChecked}
                onClick={() => onSelect(opt)}
                whileHover={!isChecked ? { y: -1, scale: 1.005 } : {}}
                whileTap={!isChecked ? { y: 1, scale: 0.995 } : {}}
                className={`p-4 rounded-xl border-2 text-left flex flex-col space-y-2.5 transition-all relative overflow-hidden w-full cursor-pointer ${cardClass}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 font-black text-[10px] border ${
                    isSelected ? 'bg-indigo-200 border-indigo-300 text-indigo-800' : 'bg-slate-100 border-slate-200'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="text-xs font-bold leading-normal pr-5">{opt.text}</span>
                </div>

                {isChecked && (opt.isCorrect || isSelected) && (
                  <div className={`text-[11px] font-semibold p-2.5 rounded-lg leading-normal ${
                    opt.isCorrect ? 'bg-green-100/50 text-green-800' : 'bg-rose-100/50 text-rose-850'
                  }`}>
                    <strong className="block text-[8px] uppercase font-black tracking-wider mb-0.5">
                      {opt.isCorrect ? '✅ PERFECT UPGRADE DETAILED EXPLANATION:' : '⚠️ WHY WE CAN DO BETTER:'}
                    </strong>
                    {opt.feedback}
                  </div>
                )}

                {isSelected && !isChecked && (
                  <div className="absolute top-2 right-2 flex items-center justify-center bg-aibo-blue-500 text-white rounded-full p-0.5 shadow-sm">
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {isChecked && isCorrect && (
        <div className="bg-gradient-to-r from-green-50 to-[#e8fbf0] border border-emerald-150 p-4 rounded-2xl flex gap-3.5 items-start">
          <div className="bg-white p-2.5 rounded-xl border border-emerald-200 text-xl shrink-0">
            🥇
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] font-black uppercase text-green-700 tracking-wider">
              NEW EXPERT PROMPT FORMULATION:
            </span>
            <p className="text-xs font-bold text-slate-700 leading-normal">
              {improvedExplanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
