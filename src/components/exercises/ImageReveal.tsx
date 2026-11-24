import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Eye } from 'lucide-react';
import { soundManager } from '../../lib/sounds';

interface ImageRevealProps {
  imageUrl: string;
  options: string[];
  correctAnswer: string;
  onSelect: (option: string) => void;
  selectedOption: string | null;
  isChecked: boolean;
  isCorrect: boolean;
}

export default function ImageReveal({
  imageUrl,
  options,
  correctAnswer,
  onSelect,
  selectedOption,
  isChecked,
  isCorrect
}: ImageRevealProps) {
  const [blurLevel, setBlurLevel] = useState<number>(3); // 3: blur-2xl, 2: blur-xl, 1: blur-md, 0: blur-none

  const getBlurClass = () => {
    if (isChecked) return 'blur-none';
    if (blurLevel === 3) return 'blur-2xl';
    if (blurLevel === 2) return 'blur-xl';
    if (blurLevel === 1) return 'blur-md';
    return 'blur-none';
  };

  const handleRevealMore = () => {
    if (isChecked || blurLevel === 0) return;
    soundManager.play('click');
    setBlurLevel(prev => prev - 1);
  };

  return (
    <div className="flex flex-col items-center space-y-6 w-full">
      <div className="relative w-full max-w-sm h-52 bg-slate-100 rounded-3xl border-4 border-slate-200 overflow-hidden shadow-inner flex items-center justify-center">
        {/* Hidden / Blurring Image */}
        <motion.img
          src={imageUrl}
          alt="Mystery AI Concept"
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover transition-all duration-300 ${getBlurClass()}`}
        />

        {/* Overlay Blur Level Badge */}
        {!isChecked && blurLevel > 0 && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-white font-extrabold text-xs">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
            <span>Mystery Blurred: {blurLevel * 25}%</span>
          </div>
        )}

        {/* Reveal button */}
        {!isChecked && blurLevel > 0 && (
          <button
            onClick={handleRevealMore}
            className="absolute bottom-4 bg-white hover:bg-slate-50 text-slate-800 font-black text-sm px-4 py-2.5 rounded-2xl flex items-center gap-2 border border-slate-200 shadow-md active:scale-95 transition-all cursor-pointer select-none"
          >
            <Eye className="w-4 h-4 text-aibo-blue-500" />
            <span>Reveal More (Reduce Blur)</span>
          </button>
        )}
      </div>

      <div className="text-center">
        <p className="text-xs font-black uppercase text-slate-400 tracking-widest">
          Select what the revealed image represents:
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {options.map((option, idx) => {
          const isSelected = selectedOption === option;
          const isActuallyCorrect = option === correctAnswer;

          let btnClass = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50';
          if (isSelected) {
            btnClass = isChecked 
              ? isCorrect 
                ? 'bg-green-50 border-green-500 text-green-700 shadow-[0_4px_0_#22c55e]'
                : 'bg-red-50 border-red-500 text-red-700 shadow-[0_4px_0_#ef4444]'
              : 'bg-aibo-blue-5 border-aibo-blue-400 text-aibo-blue-700 shadow-[0_4px_0_#3b82f6]';
          } else if (isChecked && isActuallyCorrect) {
            btnClass = 'bg-green-50 border-green-500 text-green-700 opacity-90 shadow-[0_4px_0_#22c55e]';
          } else if (isChecked) {
            btnClass = 'opacity-40 bg-slate-100 border-slate-200 text-slate-400';
          }

          return (
            <motion.button
              key={`reveal-opt-${idx}-${option}`}
              disabled={isChecked}
              onClick={() => onSelect(option)}
              whileTap={!isChecked ? { scale: 0.96 } : {}}
              className={`p-4 rounded-2xl border-2 font-display font-black text-base transition-all text-center flex flex-col items-center justify-center min-h-[70px] ${btnClass}`}
            >
              <span>{option}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
