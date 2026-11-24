import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Sparkles, Check } from 'lucide-react';

interface RevealStep {
  title: string;
  content: string;
  emoji?: string;
}

interface InteractiveRevealProps {
  interactiveReveal: {
    heading: string;
    steps: RevealStep[];
  };
  onSelect: (option: boolean) => void;
  selectedOption: any;
  isChecked: boolean;
}

export default function InteractiveReveal({
  interactiveReveal,
  onSelect,
  selectedOption,
  isChecked
}: InteractiveRevealProps) {
  const { heading, steps } = interactiveReveal;
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);

  const handleReveal = (idx: number) => {
    if (isChecked) return;
    if (revealedIndices.includes(idx)) return;

    const updated = [...revealedIndices, idx];
    setRevealedIndices(updated);

    // If all steps revealed, mark correct
    if (updated.length >= steps.length) {
      onSelect(true);
    }
  };

  return (
    <div className="flex flex-col space-y-6 w-full py-2">
      <div className="text-center">
        <p className="text-xs font-black uppercase text-indigo-500 tracking-widest flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span>PROGRESSIVE DEEP STUDY DISCLOSURE</span>
        </p>
        <span className="text-[11px] font-extrabold text-[#3b6447] tracking-wide mt-1 block">
          💡 Tap each panel to expand the secrets!
        </span>
      </div>

      {heading && (
        <h3 className="text-lg font-display font-black text-center text-slate-800 leading-snug">
          {heading}
        </h3>
      )}

      {/* Steps progressive stack */}
      <div className="space-y-3.5">
        {steps?.map((step, idx) => {
          const isRevealed = revealedIndices.includes(idx);
          return (
            <motion.div
              key={`reveal-step-${idx}-${step.title.slice(0, 10)}`}
              layout
              onClick={() => handleReveal(idx)}
              className={`rounded-2xl border-2 p-4.5 cursor-pointer text-left transition-all ${
                isRevealed
                  ? 'bg-emerald-50/55 border-emerald-300 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-350 shadow-[0_4px_0_#cbd5e1]'
              }`}
            >
              <div className="flex items-center justify-between gap-3 select-none">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{step.emoji || '📦'}</span>
                  <h4 className={`font-display font-black text-sm tracking-tight ${isRevealed ? 'text-emerald-900' : 'text-slate-800'}`}>
                    {step.title}
                  </h4>
                </div>
                <div>
                  {isRevealed ? (
                    <div className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center border border-white">
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </div>
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-350 animate-pulse" />
                  )}
                </div>
              </div>

              {/* Revealed detail */}
              <AnimatePresence>
                {isRevealed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden mt-3"
                  >
                    <p className="text-xs font-semibold leading-relaxed text-slate-650 pt-2 border-t border-emerald-100">
                      {step.content}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Progress meter */}
      <div className="text-center">
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
          DISCOVERY PROGRESS: {revealedIndices.length} / {steps?.length || 0} SECTIONS OPENED
        </span>
      </div>
    </div>
  );
}
