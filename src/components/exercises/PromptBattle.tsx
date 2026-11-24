import { motion } from 'framer-motion';
import { Sparkles, Check, Flame, MessageSquare, Play } from 'lucide-react';

interface PromptBattleProps {
  promptBattle: {
    promptA: string;
    promptB: string;
    whyA: string;
    whyB: string;
    outcomeA: string;
    outcomeB: string;
    correctAnswer: 'A' | 'B';
  };
  onSelect: (id: string) => void;
  selectedOption: string | null;
  isChecked: boolean;
  isCorrect: boolean;
}

export default function PromptBattle({
  promptBattle,
  onSelect,
  selectedOption,
  isChecked,
  isCorrect
}: PromptBattleProps) {
  const { promptA, promptB, whyA, whyB, outcomeA, outcomeB, correctAnswer } = promptBattle;

  return (
    <div className="flex flex-col space-y-6 w-full">
      <div className="text-center">
        <p className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center justify-center gap-1.5">
          <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
          <span>PROMPT BATTLE: Predict which prompt wins!</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {/* Prompt A */}
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
              : isChecked && correctAnswer === 'A'
                ? 'bg-green-10 border-green-400 text-green-700 shadow-[0_4px_0_#10b981] opacity-95'
                : isChecked
                  ? 'opacity-40 bg-slate-50 border-slate-200 text-slate-400 shadow-none'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-chikoo-blue-300 shadow-[0_4px_0_#e2e8f0]'
          }`}
        >
          <div className="space-y-3 w-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-wider bg-orange-100 text-orange-700 px-2.5 py-1 rounded-md">
                Prompt A ✍️
              </span>
              {selectedOption === 'A' && !isChecked && (
                <div className="bg-chikoo-blue-500 text-white rounded-full p-0.5 shadow-sm">
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </div>
              )}
            </div>
            <p className="font-mono text-xs font-semibold p-4 rounded-xl bg-slate-50 border border-slate-150 text-slate-800 leading-relaxed break-words whitespace-pre-wrap">
              "{promptA}"
            </p>
          </div>

          {isChecked && (
            <div className="mt-4 space-y-2 w-full">
              <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                <span className="text-[8px] font-black uppercase text-slate-400 block tracking-widest mb-1">
                  🤖 PROMPT RESULT OUTCOME:
                </span>
                <p className="text-xs font-bold text-slate-700 italic break-words whitespace-pre-wrap leading-relaxed">
                  "{outcomeA}"
                </p>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 bg-white/70 p-2 rounded-lg border border-slate-100 leading-normal">
                {whyA}
              </p>
            </div>
          )}
        </motion.button>

        {/* Prompt B */}
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
              : isChecked && correctAnswer === 'B'
                ? 'bg-green-10 border-green-400 text-green-700 shadow-[0_4px_0_#10b981] opacity-95'
                : isChecked
                  ? 'opacity-40 bg-slate-50 border-slate-200 text-slate-400 shadow-none'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-chikoo-blue-300 shadow-[0_4px_0_#e2e8f0]'
          }`}
        >
          <div className="space-y-3 w-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-wider bg-purple-100 text-purple-700 px-2.5 py-1 rounded-md">
                Prompt B ✍️
              </span>
              {selectedOption === 'B' && !isChecked && (
                <div className="bg-chikoo-blue-500 text-white rounded-full p-0.5 shadow-sm">
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </div>
              )}
            </div>
            <p className="font-mono text-xs font-semibold p-4 rounded-xl bg-slate-50 border border-slate-150 text-slate-800 leading-relaxed break-words whitespace-pre-wrap">
              "{promptB}"
            </p>
          </div>

          {isChecked && (
            <div className="mt-4 space-y-2 w-full">
              <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                <span className="text-[8px] font-black uppercase text-slate-400 block tracking-widest mb-1">
                  🤖 PROMPT RESULT OUTCOME:
                </span>
                <p className="text-xs font-bold text-slate-700 italic break-words whitespace-pre-wrap leading-relaxed">
                  "{outcomeB}"
                </p>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 bg-white/70 p-2 rounded-lg border border-slate-100 leading-normal">
                {whyB}
              </p>
            </div>
          )}
        </motion.button>
      </div>
    </div>
  );
}
