import { motion } from 'framer-motion';
import { Sparkles, Check, Heart, Smartphone } from 'lucide-react';

interface DailyLifeOption {
  id: string;
  optionText: string;
  isCorrect: boolean;
  explanation: string;
}

interface DailyLifeAIProps {
  dailyLifeAi: {
    scenario: string;
    appName: string;
    appEmoji: string;
    options: DailyLifeOption[];
    correctAnswer: string;
  };
  onSelect: (option: string | DailyLifeOption) => void;
  selectedOption: any;
  isChecked: boolean;
  isCorrect: boolean;
}

export default function DailyLifeAI({
  dailyLifeAi,
  onSelect,
  selectedOption,
  isChecked,
  isCorrect
}: DailyLifeAIProps) {
  const { scenario, appName, appEmoji, options, correctAnswer } = dailyLifeAi;

  return (
    <div className="flex flex-col space-y-6 w-full">
      {/* Visual Header representing a smartphone interface */}
      <div className="bg-slate-900 text-slate-100 rounded-3xl p-5 shadow-lg border-4 border-slate-700/50 flex items-center justify-between min-h-[96px] relative overflow-hidden">
        <div className="absolute top-0 right-1.5 p-1 opacity-5">
          <Smartphone className="w-24 h-24 rotate-12" />
        </div>
        <div className="flex items-center gap-4 z-10">
          <div className="w-14 h-14 bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center text-3xl shadow-md border-2 border-white shrink-0">
            {appEmoji}
          </div>
          <div>
            <span className="text-[9px] font-black tracking-widest text-indigo-300 uppercase block">
              DAILY LIFE APP:
            </span>
            <h3 className="text-sm font-display font-black text-white leading-tight">
              {appName} Integrations
            </h3>
            <p className="text-[11px] font-semibold text-slate-350 leading-relaxed max-w-xs mt-0.5">
              {scenario}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3.5 w-full">
        <h4 className="text-xs font-display font-black text-slate-800 text-center uppercase tracking-wider mb-1">
          Where is AI working behind the scenes here?
        </h4>

        {options.map((opt, idx) => {
          const isSelected = selectedOption === opt.id || (selectedOption && typeof selectedOption === 'object' && selectedOption.id === opt.id);
          const shouldHighlightCorrect = isChecked && opt.isCorrect;

          let cardClass = 'bg-white border-slate-200 text-slate-700 hover:border-chikoo-blue-300 shadow-[0_4px_0_#e2e8f0]';
          if (isSelected) {
            cardClass = isChecked
              ? isCorrect
                ? 'bg-green-50 border-green-500 text-green-800 shadow-[0_4px_0_#10b981]'
                : 'bg-rose-50 border-rose-500 text-rose-800 shadow-[0_4px_0_#f43f5e]'
              : 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-[0_4px_0_#6366f1]';
          } else if (shouldHighlightCorrect) {
            cardClass = 'bg-[#e8fbf0] border-emerald-500 text-emerald-800 shadow-[0_4px_0_#10b981] opacity-95';
          } else if (isChecked) {
            cardClass = 'opacity-40 bg-slate-50 border-slate-200 text-slate-400 shadow-none';
          }

          return (
            <motion.button
              key={opt.id ? `daily-opt-${opt.id}` : `daily-opt-${idx}-${opt.optionText?.slice(0, 10)}`}
              disabled={isChecked}
              onClick={() => onSelect(opt)}
              whileHover={!isChecked ? { y: -1, scale: 1.005 } : {}}
              whileTap={!isChecked ? { y: 1, scale: 0.995 } : {}}
              className={`p-4 rounded-xl border-2 text-left flex flex-col space-y-2 transition-all relative overflow-hidden w-full cursor-pointer ${cardClass}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border text-xs ${
                  isSelected ? 'bg-indigo-200 border-indigo-300 text-indigo-700 font-bold' : 'bg-slate-50 border-slate-200'
                }`}>
                  🔍
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold leading-normal">{opt.optionText}</span>
                </div>
              </div>

              {isChecked && (opt.isCorrect || isSelected) && (
                <div className={`text-[11px] font-semibold leading-normal p-3 rounded-lg ${
                  opt.isCorrect ? 'bg-green-100/50 text-green-800' : 'bg-rose-100/50 text-rose-800'
                }`}>
                  <strong className="block text-[8px] uppercase font-black tracking-widest mb-0.5">
                    {opt.isCorrect ? '✨ COGNITIVE EXCLUSION SUMMARY:' : '⚠️ CAREFUL BOUNDS Check:'}
                  </strong>
                  {opt.explanation}
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
