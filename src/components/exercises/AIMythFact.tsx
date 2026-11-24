import { motion } from 'framer-motion';
import { HelpCircle, Sparkles, Check, CheckCircle2, ShieldAlert } from 'lucide-react';

interface AIMythFactProps {
  aiMythFact: {
    statement: string;
    isFact: boolean;
    context: string;
  };
  onSelect: (option: string) => void;
  selectedOption: string | null;
  isChecked: boolean;
  isCorrect: boolean;
}

export default function AIMythFact({
  aiMythFact,
  onSelect,
  selectedOption,
  isChecked,
  isCorrect
}: AIMythFactProps) {
  const { statement, isFact, context } = aiMythFact;

  return (
    <div className="flex flex-col space-y-6 w-full py-2">
      <div className="text-center">
        <p className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center justify-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-purple-500 animate-pulse" />
          <span>MYTH VS FACT AUDIT: Is this true or false?</span>
        </p>
      </div>

      {/* Hero statement box */}
      <div className="bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-pink-50/50 p-6 rounded-3xl border-4 border-white shadow-md flex flex-col items-center justify-center space-y-3 text-center min-h-[140px]">
        <span className="text-5xl text-center block animate-bounce">🤔</span>
        <p className="text-base font-black font-display text-slate-800 leading-snug">
          "{statement}"
        </p>
      </div>

      {/* Two interactive Choice Cards: Myth or Fact */}
      <div className="grid grid-cols-2 gap-4 w-full">
        {/* Fact Card */}
        <motion.button
          disabled={isChecked}
          onClick={() => onSelect('fact')}
          whileHover={!isChecked ? { y: -2, scale: 1.01 } : {}}
          whileTap={!isChecked ? { y: 1, scale: 0.99 } : {}}
          className={`p-5 rounded-2xl border-3 text-center flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer h-28 relative ${
            selectedOption === 'fact'
              ? isChecked
                ? isCorrect
                  ? 'bg-green-50 border-emerald-500 text-emerald-805 shadow-[0_5px_0_#10b981]'
                  : 'bg-rose-50 border-rose-500 text-rose-800 shadow-[0_5px_0_#f43f5e]'
                : 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-[0_5px_0_#6366f1]'
              : isChecked && isFact
                ? 'bg-green-10 border-emerald-500 text-emerald-800 shadow-[0_5px_0_#10b981] opacity-90'
                : isChecked
                  ? 'opacity-40 bg-slate-50 border-slate-200 text-slate-350 shadow-none'
                  : 'bg-white border-slate-250 text-slate-700 hover:border-slate-350 shadow-[0_5px_0_#cbd5e1]'
          }`}
        >
          <span className="text-2xl">🟢</span>
          <span className="font-display font-black text-sm uppercase tracking-wider">Fact</span>
          
          {selectedOption === 'fact' && !isChecked && (
            <div className="absolute top-2 right-2 flex items-center justify-center bg-chikoo-blue-500 text-white rounded-full p-0.5 shadow-sm">
              <Check className="w-3 h-3" strokeWidth={3} />
            </div>
          )}
        </motion.button>

        {/* Myth Card */}
        <motion.button
          disabled={isChecked}
          onClick={() => onSelect('myth')}
          whileHover={!isChecked ? { y: -2, scale: 1.01 } : {}}
          whileTap={!isChecked ? { y: 1, scale: 0.99 } : {}}
          className={`p-5 rounded-2xl border-3 text-center flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer h-28 relative ${
            selectedOption === 'myth'
              ? isChecked
                ? isCorrect
                  ? 'bg-green-50 border-emerald-500 text-emerald-805 shadow-[0_5px_0_#10b981]'
                  : 'bg-rose-50 border-rose-500 text-rose-800 shadow-[0_5px_0_#f43f5e]'
                : 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-[0_5px_0_#6366f1]'
              : isChecked && !isFact
                ? 'bg-green-10 border-emerald-500 text-emerald-800 shadow-[0_5px_0_#10b981] opacity-90'
                : isChecked
                  ? 'opacity-40 bg-slate-50 border-slate-200 text-slate-350 shadow-none'
                  : 'bg-white border-slate-250 text-slate-700 hover:border-slate-350 shadow-[0_5px_0_#cbd5e1]'
          }`}
        >
          <span className="text-2xl">🔴</span>
          <span className="font-display font-black text-sm uppercase tracking-wider">Myth</span>
          
          {selectedOption === 'myth' && !isChecked && (
            <div className="absolute top-2 right-2 flex items-center justify-center bg-chikoo-blue-500 text-white rounded-full p-0.5 shadow-sm">
              <Check className="w-3 h-3" strokeWidth={3} />
            </div>
          )}
        </motion.button>
      </div>

      {isChecked && (
        <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex gap-3 items-start">
          <div className="text-xl shrink-0">
            {isFact ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <ShieldAlert className="w-5 h-5 text-indigo-500" />}
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] font-black uppercase text-indigo-700 tracking-wider">
              REALITY AUDIT SUMMARY:
            </span>
            <p className="text-xs font-bold leading-relaxed text-slate-600">
              {context}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
