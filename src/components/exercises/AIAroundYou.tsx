import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Sparkles, AlertCircle, Info } from 'lucide-react';

interface AIExampleItem {
  itemName: string;
  emoji: string;
  imageUrl?: string;
  description: string;
  hiddenML: string;
}

interface AIAroundYouProps {
  aiAroundYou: {
    title?: string;
    examples: AIExampleItem[];
  };
  onSelect: (option: boolean) => void;
  selectedOption: any;
  isChecked: boolean;
}

export default function AIAroundYou({
  aiAroundYou,
  onSelect,
  selectedOption,
  isChecked
}: AIAroundYouProps) {
  const { title, examples } = aiAroundYou;
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  const handleInspect = (idx: number) => {
    setActiveItemIndex(idx);
    onSelect(true); // Completed once the student starts discovering
  };

  return (
    <div className="flex flex-col space-y-6 w-full py-2">
      <div className="text-center">
        <p className="text-xs font-black uppercase text-purple-500 tracking-widest flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          <span>REAL WORLD DETECTOR</span>
        </p>
        <h3 className="text-lg font-display font-black text-slate-805 mt-1 leading-snug">
          {title || "Spot AI technology deployed around your daily habits!"}
        </h3>
      </div>

      {/* Examples Grid */}
      <div className="grid grid-cols-2 gap-4">
        {examples?.map((ex, idx) => {
          const isActive = activeItemIndex === idx;
          return (
            <motion.button
              key={`ai-around-${idx}-${ex.itemName.slice(0, 10)}`}
              disabled={isChecked}
              onClick={() => handleInspect(idx)}
              whileHover={!isChecked ? { y: -2, scale: 1.01 } : {}}
              whileTap={!isChecked ? { y: 1, scale: 0.99 } : {}}
              className={`p-5 rounded-2xl border-3 text-center flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer h-32 relative ${
                isActive
                  ? 'bg-purple-50 border-purple-500 text-purple-800 shadow-[0_5px_0_#9333ea]'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-350 shadow-[0_5px_0_#cbd5e1]'
              }`}
            >
              <span className="text-4xl block">{ex.emoji || '📱'}</span>
              <span className="font-display font-black text-xs uppercase tracking-wide">
                {ex.itemName}
              </span>
              
              <div className="absolute top-2 right-2 text-slate-300">
                <Info className="w-4 h-4" />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Detail card */}
      <AnimatePresence mode="wait">
        {activeItemIndex !== null && (
          <motion.div
            key={activeItemIndex}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3 shadow-inner text-left"
          >
            <div>
              <span className="text-xs font-black uppercase text-purple-700 tracking-wider">
                DAILY SCENARIO USE:
              </span>
              <p className="text-sm sm:text-base font-bold text-slate-750 leading-relaxed mt-1">
                {examples[activeItemIndex].description}
              </p>
            </div>

            <div className="bg-purple-100/40 p-4.5 rounded-xl border border-purple-200/40 space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-800 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-purple-500" />
                <span>Underlying AI / ML Tech:</span>
              </span>
              <p className="text-sm sm:text-base font-black text-purple-800 leading-snug">
                🧠 {examples[activeItemIndex].hiddenML}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
