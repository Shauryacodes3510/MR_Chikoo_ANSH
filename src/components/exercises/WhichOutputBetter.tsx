import { motion } from 'framer-motion';
import { Sparkles, Check, Heart, HelpCircle, MessagesSquare } from 'lucide-react';

interface BetterOption {
  title: string;
  text: string;
  explanation: string;
}

interface WhichOutputBetterProps {
  whichOutputBetter: {
    prompt: string;
    optionA: BetterOption;
    optionB: BetterOption;
    betterOption: 'A' | 'B';
    insight: string;
  };
  onSelect: (option: 'A' | 'B') => void;
  selectedOption: 'A' | 'B' | null;
  isChecked: boolean;
  isCorrect: boolean;
}

export default function WhichOutputBetter({
  whichOutputBetter,
  onSelect,
  selectedOption,
  isChecked,
  isCorrect
}: WhichOutputBetterProps) {
  const { prompt, optionA, optionB, betterOption, insight } = whichOutputBetter;

  return (
    <div className="flex flex-col space-y-6 w-full">
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mb-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
          General Prompt Command:
        </span>
        <p className="font-mono text-xs font-semibold text-slate-700 bg-white p-3 rounded-lg border border-slate-150 leading-relaxed">
          "{prompt}"
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {/* Option A */}
        <motion.button
          disabled={isChecked}
          onClick={() => onSelect('A')}
          whileHover={!isChecked ? { y: -2, scale: 1.01 } : {}}
          whileTap={!isChecked ? { y: 1, scale: 0.99 } : {}}
          className={`p-5 rounded-2xl border-2 text-left flex flex-col justify-between transition-all relative overflow-hidden h-full cursor-pointer ${
            selectedOption === 'A'
              ? isChecked
                ? isCorrect
                  ? 'bg-green-50 border-green-500 text-green-800 shadow-[0_4px_0_#10b981]'
                  : 'bg-rose-50 border-rose-500 text-rose-800 shadow-[0_4px_0_#f43f5e]'
                : 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-[0_4px_0_#6366f1]'
              : isChecked && betterOption === 'A'
                ? 'bg-green-10 border-green-400 text-green-700 shadow-[0_4px_0_#10b981] opacity-95'
                : isChecked
                  ? 'opacity-40 bg-slate-50 border-slate-200 text-slate-400 shadow-none'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-aibo-blue-300 shadow-[0_4px_0_#e2e8f0]'
          }`}
        >
          <div className="space-y-3.5 w-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-wider bg-indigo-150 text-indigo-800 px-2.5 py-1 rounded-md">
                {optionA.title}
              </span>
              {selectedOption === 'A' && !isChecked && (
                <div className="bg-aibo-blue-500 text-white rounded-full p-0.5 shadow-sm">
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </div>
              )}
            </div>
            <p className="text-xs font-bold leading-relaxed text-slate-700 h-28 overflow-y-auto whitespace-pre-wrap bg-slate-50 border border-slate-150 p-3 rounded-lg">
              {optionA.text}
            </p>
          </div>

          {isChecked && (
            <div className="mt-4 text-[11px] font-semibold text-slate-500 leading-normal border-t border-slate-100 pt-3">
              <strong className="block text-[8px] uppercase font-black tracking-wider mb-0.5 text-slate-400">
                Chikoo Analysis:
              </strong>
              {optionA.explanation}
            </div>
          )}
        </motion.button>

        {/* Option B */}
        <motion.button
          disabled={isChecked}
          onClick={() => onSelect('B')}
          whileHover={!isChecked ? { y: -2, scale: 1.01 } : {}}
          whileTap={!isChecked ? { y: 1, scale: 0.99 } : {}}
          className={`p-5 rounded-2xl border-2 text-left flex flex-col justify-between transition-all relative overflow-hidden h-full cursor-pointer ${
            selectedOption === 'B'
              ? isChecked
                ? isCorrect
                  ? 'bg-green-50 border-green-500 text-green-800 shadow-[0_4px_0_#10b981]'
                  : 'bg-rose-50 border-rose-500 text-rose-800 shadow-[0_4px_0_#f43f5e]'
                : 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-[0_4px_0_#6366f1]'
              : isChecked && betterOption === 'B'
                ? 'bg-green-10 border-green-400 text-green-700 shadow-[0_4px_0_#10b981] opacity-95'
                : isChecked
                  ? 'opacity-40 bg-slate-50 border-slate-200 text-slate-400 shadow-none'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-aibo-blue-300 shadow-[0_4px_0_#e2e8f0]'
          }`}
        >
          <div className="space-y-3.5 w-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-wider bg-purple-150 text-purple-800 px-2.5 py-1 rounded-md">
                {optionB.title}
              </span>
              {selectedOption === 'B' && !isChecked && (
                <div className="bg-aibo-blue-500 text-white rounded-full p-0.5 shadow-sm">
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </div>
              )}
            </div>
            <p className="text-xs font-bold leading-relaxed text-slate-700 h-28 overflow-y-auto whitespace-pre-wrap bg-slate-50 border border-slate-150 p-3 rounded-lg">
              {optionB.text}
            </p>
          </div>

          {isChecked && (
            <div className="mt-4 text-[11px] font-semibold text-slate-500 leading-normal border-t border-slate-100 pt-3">
              <strong className="block text-[8px] uppercase font-black tracking-wider mb-0.5 text-slate-400">
                Chikoo Analysis:
              </strong>
              {optionB.explanation}
            </div>
          )}
        </motion.button>
      </div>

      {isChecked && (
        <div className="bg-gradient-to-r from-emerald-50 to-[#e8fbf0] border border-emerald-150 p-4 rounded-xl text-center text-xs font-semibold text-slate-600">
          <span className="block text-[9px] font-black uppercase text-green-700 mb-1 tracking-widest">
            PROMPTING BEST PRACTICE INSIGHT:
          </span>
          {insight}
        </div>
      )}
    </div>
  );
}
