import { motion } from 'framer-motion';
import { Sparkles, Laugh } from 'lucide-react';

interface MemeScreenProps {
  memeScreen: {
    imageUrl: string;
    title: string;
    explanation: string;
  };
  onSelect: (option: boolean) => void;
  selectedOption: any;
  isChecked: boolean;
}

export default function MemeScreen({
  memeScreen,
  onSelect,
  selectedOption,
  isChecked
}: MemeScreenProps) {
  const { imageUrl, title, explanation } = memeScreen;
  const isInteracted = selectedOption === true;

  return (
    <div className="flex flex-col space-y-6 w-full py-2">
      <div className="text-center">
        <p className="text-xs font-black uppercase text-amber-500 tracking-widest flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>FUN AI MEME OF THE DAY</span>
        </p>
      </div>

      {/* Meme Content Card */}
      <div className="bg-white rounded-3xl border-4 border-slate-100 shadow-md overflow-hidden flex flex-col">
        {/* Meme Image Wrap */}
        <div className="p-4 bg-slate-50 flex justify-center items-center border-b border-slate-100 min-h-[220px]">
          {imageUrl ? (
            <motion.img
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={imageUrl}
              alt="AI Meme"
              referrerPolicy="no-referrer"
              className="max-h-72 object-contain rounded-2xl shadow-sm border-2 border-white"
            />
          ) : (
            <div className="text-5xl">🤪</div>
          )}
        </div>

        {/* Text Section */}
        <div className="p-6 space-y-3.5">
          <h3 className="text-2xl font-display font-black text-slate-800 leading-tight">
            {title}
          </h3>
          <p className="text-base sm:text-lg font-bold text-slate-500 leading-relaxed">
            {explanation}
          </p>
        </div>
      </div>

      {/* Interactive reaction buttons */}
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
          <Laugh className={`w-5 h-5 ${isInteracted ? 'animate-bounce text-amber-500' : 'text-slate-400'}`} />
          <span>{isInteracted ? 'Haha, totally! 😂' : 'Tap to react! 😂'}</span>
        </motion.button>
      </div>
    </div>
  );
}
