import { motion } from 'framer-motion';
import { Sparkles, Compass } from 'lucide-react';

interface FunFactProps {
  funFact: {
    imageUrl?: string;
    emoji?: string;
    headline: string;
    text: string;
    triviaSource?: string;
  };
  onSelect: (option: boolean) => void;
  selectedOption: any;
  isChecked: boolean;
}

export default function FunFact({
  funFact,
  onSelect,
  selectedOption,
  isChecked
}: FunFactProps) {
  const { imageUrl, emoji, headline, text, triviaSource } = funFact;
  const isInteracted = selectedOption === true;

  return (
    <div className="flex flex-col space-y-6 w-full py-2">
      <div className="text-center">
        <p className="text-xs font-black uppercase text-amber-500 tracking-widest flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>MIND-BLOWING FACT DISCOVERY</span>
        </p>
      </div>

      {/* Main Feature Layout */}
      <div className="bg-gradient-to-tr from-amber-50/30 via-orange-50/20 to-white rounded-3xl border-4 border-amber-100 shadow-md p-6 flex flex-col items-center text-center space-y-4">
        {/* Visual Header */}
        {imageUrl ? (
          <div className="w-full max-w-sm h-40 bg-slate-50 border border-slate-100/50 rounded-2xl overflow-hidden shadow-sm">
            <img
              src={imageUrl}
              alt="Did You Know Visual"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-amber-200/50 p-4 w-20 h-20 flex items-center justify-center shadow-sm animate-bounce">
            <span className="text-5xl select-none">{emoji || '⭐'}</span>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-2xl sm:text-3xl font-display font-black text-amber-800 tracking-tight leading-snug">
            {headline}
          </h3>
          {triviaSource && (
            <span className="inline-block text-[10px] font-black uppercase tracking-wider text-[#b17d05] bg-[#fffbeb] px-3.5 py-1 rounded-full border border-amber-200/40">
              Source: {triviaSource}
            </span>
          )}
        </div>

        <div className="bg-white border border-amber-100 p-6 rounded-2xl w-full">
          <p className="text-base sm:text-lg md:text-xl font-bold text-slate-700 leading-relaxed">
            "{text}"
          </p>
        </div>
      </div>

      {/* Interact CTA */}
      <div className="flex justify-center">
        <motion.button
          disabled={isChecked}
          onClick={() => onSelect(true)}
          whileHover={!isChecked ? { scale: 1.05 } : {}}
          whileTap={!isChecked ? { scale: 0.95 } : {}}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-display font-black text-sm uppercase tracking-wider transition-all cursor-pointer ${
            isInteracted
              ? 'bg-amber-100 border-2 border-amber-400 text-amber-700 shadow-sm'
              : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300 shadow-[0_4px_0_#e2e8f0]'
          }`}
        >
          <Compass className={`w-5 h-5 ${isInteracted ? 'animate-spin-slow' : 'text-slate-400'}`} />
          <span>{isInteracted ? 'Mind Blown! 🤯' : 'Got it! 🚀'}</span>
        </motion.button>
      </div>
    </div>
  );
}
