import { memo } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface TapRightAnswerProps {
  options: (string | Record<string, any>)[];
  onSelect: (option: string) => void;
  selectedOption: string | null;
  isChecked: boolean;
  isCorrect: boolean;
  correctAnswer?: string;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const BADGE_COLORS = [
  'bg-slate-50 dark:bg-[#243149] text-slate-500 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80',
];

function TapRightAnswer({
  options,
  onSelect,
  selectedOption,
  isChecked,
  isCorrect,
  correctAnswer
}: TapRightAnswerProps) {
  const isShortAll = options.every(opt => typeof opt === 'string' && opt.length <= 25);
  const gridClasses = isShortAll 
    ? 'grid grid-cols-2 gap-4 sm:gap-5 w-full max-w-lg mx-auto' 
    : 'grid grid-cols-1 gap-4 w-full max-w-xl mx-auto';

  return (
    <div className="w-full select-none">
      <div className={gridClasses}>
        {options.map((optItem, index) => {
          const itemObj = optItem as any;
          const option = typeof optItem === 'string' 
            ? optItem 
            : (itemObj && typeof itemObj === 'object' ? (itemObj.text || itemObj.label || itemObj.value || itemObj.option || String(optItem)) : String(optItem || ''));
          const isSelected = selectedOption === option || selectedOption === optItem;
          const isActuallyCorrect = correctAnswer 
            ? String(option).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim() 
            : false;
          
          let cardStyle = "bg-white dark:bg-[#172033] border-2 border-slate-200/90 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 shadow-[0_5px_0_#e2e8f0] dark:shadow-[0_5px_0_#0f1422] hover:border-amber-400 dark:hover:border-amber-400 hover:shadow-[0_6px_0_#fde68a] dark:hover:shadow-[0_6px_0_#b45309]";
          let badgeStyle = BADGE_COLORS[index % BADGE_COLORS.length];

          if (isSelected) {
            if (isChecked) {
              if (isCorrect) {
                cardStyle = 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/80 dark:to-teal-950/80 border-2.5 border-emerald-400 dark:border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-[0_6px_0_#a7f3d0] dark:shadow-[0_6px_0_#064e3b] ring-4 ring-emerald-100 dark:ring-emerald-900/40 scale-[1.01]';
                badgeStyle = 'bg-emerald-500 border-emerald-400 text-white';
              } else {
                cardStyle = 'bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/80 dark:to-orange-950/80 border-2.5 border-rose-400 dark:border-rose-500 text-rose-950 dark:text-rose-100 shadow-[0_6px_0_#fecdd3] dark:shadow-[0_6px_0_#881337] ring-4 ring-rose-100 dark:ring-rose-900/40 animate-shake';
                badgeStyle = 'bg-rose-500 border-rose-400 text-white';
              }
            } else {
              cardStyle = 'bg-gradient-to-br from-amber-50 to-orange-50/40 dark:from-amber-950/60 dark:to-orange-950/40 border-2.5 border-amber-500 dark:border-amber-400 text-amber-950 dark:text-amber-100 shadow-[0_6px_0_#fde68a] dark:shadow-[0_6px_0_#78350f] ring-4 ring-amber-100/70 dark:ring-amber-900/40 -translate-y-1 scale-[1.01]';
              badgeStyle = 'bg-amber-500 border-amber-400 text-white shadow-sm';
            }
          } else if (isChecked) {
            if (isActuallyCorrect) {
              cardStyle = 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/80 dark:to-teal-950/80 border-2.5 border-emerald-400 dark:border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-[0_6px_0_#a7f3d0] dark:shadow-[0_6px_0_#064e3b] ring-4 ring-emerald-100 dark:ring-emerald-900/40';
              badgeStyle = 'bg-emerald-500 border-emerald-400 text-white';
            } else {
              cardStyle = 'bg-slate-50 dark:bg-[#172033]/50 border-2 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 shadow-none opacity-40 cursor-not-allowed scale-95';
              badgeStyle = 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500';
            }
          }

          const optionLabel = LETTERS[index % LETTERS.length];
          const cleanOptKey = typeof option === 'string' ? option.replace(/\s+/g, '_').slice(0, 30) : index;

          return (
            <motion.button
              key={`mcq-opt-${index}-${cleanOptKey}`}
              whileHover={!isChecked ? { scale: 1.025, y: -3 } : {}}
              whileTap={!isChecked ? { scale: 0.975, y: 1 } : {}}
              onClick={() => onSelect(option)}
              disabled={isChecked}
              className={`w-full p-5 sm:p-6 md:p-7 min-h-[82px] sm:min-h-[96px] rounded-[24px] sm:rounded-[28px] border-2 text-left font-display font-black text-lg sm:text-xl transition-all duration-150 relative overflow-hidden flex items-center justify-between gap-4 sm:gap-6 cursor-pointer will-change-transform ${cardStyle}`}
            >
              <div className="flex items-center gap-4 sm:gap-5">
                {/* Colorful Letter Badge */}
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 text-lg sm:text-xl font-extrabold border-2 transition-all shadow-xs ${badgeStyle}`}>
                  {optionLabel}
                </div>
                <span className="leading-snug font-extrabold tracking-wide text-slate-800 dark:text-white text-base sm:text-lg md:text-xl">{option}</span>
              </div>

              {isChecked && (isSelected || isActuallyCorrect) && (
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md ${
                    isActuallyCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                  }`}
                >
                  {isActuallyCorrect ? (
                    <Check className="w-6 h-6" strokeWidth={3.5} />
                  ) : (
                    <X className="w-6 h-6" strokeWidth={3.5} />
                  )}
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(TapRightAnswer);
