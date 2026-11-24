import { motion } from 'framer-motion';
import { Sparkles, Brain } from 'lucide-react';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

interface EmojiConceptsProps {
  emojiClue: string;
  options: string[];
  onSelect: (option: string) => void;
  selectedOption: string | null;
  isChecked: boolean;
  isCorrect: boolean;
  correctAnswer: string;
}

export default function EmojiConcepts({
  emojiClue,
  options,
  onSelect,
  selectedOption,
  isChecked,
  isCorrect,
  correctAnswer
}: EmojiConceptsProps) {
  return (
    <div className="flex flex-col space-y-6 w-full">
      <div className="text-center">
        <p className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Decode the Emoji Equation into an AI concept!</span>
        </p>
      </div>

      {/* Hero Emoji Grid Card */}
      <div className="bg-gradient-to-r from-pink-100 via-purple-100 to-indigo-100 p-6 rounded-3xl border-4 border-white shadow-md flex flex-col items-center justify-center space-y-2 text-center select-none">
        <span className="text-5xl font-black tracking-widest block py-2 animate-bounce">
          {emojiClue}
        </span>
        <div className="bg-black/10 text-slate-800 px-3 py-1 rounded-full text-xs font-bold leading-tight flex items-center gap-1">
          <Brain className="w-3.5 h-3.5" />
          <span>What formula is this?</span>
        </div>
      </div>

      {/* Answer options */}
      <div className={options.every(opt => opt.length <= 25) ? 'grid grid-cols-2 gap-3.5 w-full' : 'grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full'}>
        {options.map((option, idx) => {
          const isSelected = selectedOption === option;
          const isActuallyCorrect = option === correctAnswer;

          let blockClass = 'border-[#e2e8f0] hover:border-slate-300 text-slate-700 bg-white hover:bg-slate-50/50 shadow-[0_5px_0_#cbd5e1]';
          if (isSelected) {
            blockClass = isChecked 
              ? isCorrect 
                ? 'bg-[#e8fbf0] border-emerald-500 text-emerald-800 shadow-[0_5px_0_#10b981]'
                : 'bg-rose-50 border-rose-500 text-rose-850 shadow-[0_5px_0_#f43f5e]'
              : 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-[0_5px_0_#6366f1]';
          } else if (isChecked && isActuallyCorrect) {
            blockClass = 'bg-[#e8fbf0] border-emerald-500 text-emerald-800 shadow-[0_5px_0_#10b981] opacity-90';
          } else if (isChecked) {
            blockClass = 'opacity-40 bg-slate-50 border-slate-200 text-slate-350 shadow-none';
          }

          const optionLabel = LETTERS[idx % LETTERS.length];

          return (
            <motion.button
              key={`emoji-opt-${idx}-${option}`}
              disabled={isChecked}
              onClick={() => onSelect(option)}
              whileHover={!isChecked ? { y: -2, scale: 1.01 } : {}}
              whileTap={!isChecked ? { y: 2, scale: 0.98 } : {}}
              className={`p-4.5 rounded-2xl border-3 font-display font-black text-sm text-left transition-all cursor-pointer flex items-center gap-3 relative ${blockClass}`}
            >
              {/* Playful Circle Letter Badge */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-black border-2 bg-slate-50 border-slate-100 ${
                isSelected ? 'bg-[#eef2ff] border-indigo-200 text-indigo-700' : 'text-slate-500'
              }`}>
                {optionLabel}
              </div>
              <span className="leading-snug">{option}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
