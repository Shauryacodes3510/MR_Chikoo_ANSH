import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface FillInBlankProps {
  sentence?: string;
  options?: (string | Record<string, any>)[];
  correctAnswer?: string;
  onSelect: (option: string) => void;
  selectedOption: string | null;
  isChecked: boolean;
  isCorrect: boolean;
}

export default function FillInBlank({
  sentence = '',
  options = [],
  correctAnswer = '',
  onSelect,
  selectedOption,
  isChecked,
  isCorrect
}: FillInBlankProps) {
  const safeSentence = typeof sentence === 'string' ? sentence : '';

  // Split by [BLANK] or any sequence of underscores (e.g. "_______" or "___")
  const parts = useMemo(() => {
    if (!safeSentence) return ['', ''];
    if (safeSentence.includes('[BLANK]')) {
      return safeSentence.split('[BLANK]');
    }
    const regex = /_{3,}/;
    if (regex.test(safeSentence)) {
      return safeSentence.split(regex);
    }
    return [safeSentence, ''];
  }, [safeSentence]);

  const safeOptions = Array.isArray(options) ? options : [];

  return (
    <div className="w-full">
      <div className="space-y-10 w-full max-w-2xl mx-auto">
        {/* Playful blank sentence presentation - light card style */}
        <div className="text-xl sm:text-2xl font-display font-black leading-relaxed text-slate-800 text-center px-6 py-8 sm:px-8 sm:py-10 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <span className="text-slate-800">{parts[0]}</span>
          <span className={`inline-block px-6 py-2 mx-2 rounded-full min-w-[150px] text-center transition-all duration-300 font-black tracking-wide border-2 ${
            isChecked 
              ? isCorrect 
                ? 'text-emerald-750 border-emerald-450 bg-emerald-50 ring-4 ring-emerald-100' 
                : 'text-rose-750 border-rose-450 bg-rose-50 ring-4 ring-rose-100'
              : selectedOption 
                ? 'text-purple-750 border-purple-450 bg-purple-50 ring-4 ring-purple-100' 
                : 'text-slate-400 border-dashed border-slate-350 bg-slate-50'
          }`}>
            {typeof selectedOption === 'string' ? selectedOption : '______'}
          </span>
          <span className="text-slate-800">{parts[1]}</span>
        </div>

        {/* Dynamic game-like select option buttons */}
        <div className="flex flex-wrap gap-4.5 justify-center">
          {safeOptions.map((optItem, index) => {
            const itemObj = optItem as any;
            const option = typeof optItem === 'string'
              ? optItem
              : (itemObj && typeof itemObj === 'object' ? (itemObj.text || itemObj.label || itemObj.value || itemObj.option || String(optItem)) : String(optItem || ''));

            const isThisSelected = option === selectedOption;
            const isThisCorrect = correctAnswer
              ? String(option || '').toLowerCase().trim() === String(correctAnswer || '').toLowerCase().trim()
              : false;

            let stateClasses = isThisSelected 
              ? 'bg-purple-50 border-2.5 border-purple-500 text-purple-900 shadow-[0_6px_0_#d8b4fe] ring-4 ring-purple-150' 
              : 'bg-white border-2 border-slate-200 text-slate-700 hover:text-slate-950 hover:border-purple-300 hover:bg-slate-50 shadow-[0_6px_0_#f1f5f9] active:translate-y-1 active:shadow-[0_2px_0_#f1f5f9]';

            if (isChecked) {
              if (isThisCorrect) {
                stateClasses = 'bg-emerald-50 border-2.5 border-emerald-400 text-emerald-900 shadow-[0_6px_0_#a7f3d0] ring-4 ring-emerald-100';
              } else if (isThisSelected && !isCorrect) {
                stateClasses = 'bg-rose-50 border-2.5 border-rose-400 text-rose-900 shadow-[0_6px_0_#fecdd3] ring-4 ring-rose-100 opacity-85';
              } else {
                stateClasses = 'opacity-25 bg-slate-50 border-2 border-slate-100 text-slate-400 shadow-none scale-95 pointer-events-none';
              }
            }

            return (
              <motion.button
                key={`fib-opt-${index}-${option}`}
                disabled={isChecked}
                onClick={() => onSelect(option)}
                whileHover={!isChecked ? { y: -2, scale: 1.04 } : {}}
                whileTap={!isChecked ? { y: 2, scale: 0.96 } : {}}
                animate={
                  isChecked 
                    ? isThisCorrect 
                      ? { scale: [1, 1.05, 1], y: [0, -3, 0] } 
                      : isThisSelected && !isCorrect 
                        ? { x: [-5, 5, -5, 5, 0] } 
                        : {}
                    : {}
                }
                transition={{ duration: 0.4, x: { type: "tween", duration: 0.4 } }}
                className={`px-8 py-4 sm:px-10 sm:py-5 rounded-full font-display font-black text-base sm:text-lg transition-all cursor-pointer border-2 ${stateClasses}`}
              >
                {option}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
