import { motion } from 'framer-motion';

interface AnalogyCardProps {
  analogy?: any;
  options?: string[];
  correctAnswer?: string;
  onSelect: (option: string) => void;
  selectedOption: string | null;
  isChecked: boolean;
  isCorrect: boolean;
}

export default function AnalogyCard({
  analogy,
  options: propOptions,
  correctAnswer = '',
  onSelect,
  selectedOption,
  isChecked,
  isCorrect
}: AnalogyCardProps) {
  const rawText = typeof analogy === 'string' ? analogy : (analogy?.text || '');
  const optionsList = Array.isArray(analogy?.options) 
    ? analogy.options 
    : (Array.isArray(propOptions) ? propOptions : []);

  // Split text to insert the selected option or blank
  const parts = rawText.includes('[BLANK]') 
    ? rawText.split('[BLANK]') 
    : [rawText, ''];

  return (
    <div className="space-y-8 relative">
      <div className="bg-chikoo-blue-50 border-2 border-chikoo-blue-200 rounded-3xl p-8 text-center shadow-inner">
        <p className="font-display font-bold text-2xl leading-relaxed text-gray-700">
          {parts[0]}
          <span className={`inline-block px-4 py-1 mx-2 border-b-4 min-w-[120px] transition-all duration-300 ${
            isChecked 
              ? isCorrect 
                ? 'text-duo-green border-duo-green' 
                : 'text-chikoo-red-500 border-chikoo-red-500'
              : selectedOption 
                ? 'text-chikoo-blue-500 border-chikoo-blue-500' 
                : 'text-gray-300 border-gray-200'
          }`}>
            {typeof selectedOption === 'string' ? selectedOption : '_______'}
          </span>
          {parts[1]}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {optionsList.map((option: any, index: number) => {
          const optStr = typeof option === 'string' ? option : (option?.text || String(option || ''));
          const isThisSelected = optStr === selectedOption;
          const isThisCorrect = correctAnswer 
            ? String(optStr).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim() 
            : false;

          let stateClasses = 'bg-white hover:bg-slate-50 border-slate-200 shadow-[0_4px_0_#e2e8f0]';
          if (isThisSelected) stateClasses = 'card-3d-selected';
          if (isChecked) {
            if (isThisCorrect) {
              stateClasses = 'bg-duo-green text-white border-duo-green shadow-[0_4px_0_#46a302]';
            } else if (isThisSelected && !isCorrect) {
              stateClasses = 'bg-chikoo-red-500 text-white border-chikoo-red-500 shadow-[0_4px_0_#d32f2f] opacity-80';
            } else {
              stateClasses = 'opacity-30 border-slate-100 shadow-none';
            }
          }

          return (
            <motion.button
              key={`analogy-opt-${index}-${optStr}`}
              disabled={isChecked}
              onClick={() => onSelect(optStr)}
              whileTap={!isChecked ? { scale: 0.98 } : {}}
              animate={
                isChecked 
                  ? isThisCorrect 
                    ? { scale: [1, 1.02, 1] } 
                    : isThisSelected && !isCorrect 
                      ? { x: [-4, 4, -4, 4, 0] } 
                      : {}
                  : {}
              }
              transition={{ duration: 0.4, x: { type: "tween", duration: 0.4 } }}
              className={`card-3d text-center font-display font-bold text-lg p-6 transition-opacity duration-300 ${stateClasses}`}
            >
              {optStr}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
