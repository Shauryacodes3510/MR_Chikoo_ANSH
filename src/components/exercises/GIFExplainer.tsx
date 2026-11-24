import { motion } from 'framer-motion';
import { PlayCircle, Sparkles } from 'lucide-react';

interface GIFExplainerProps {
  gifExplainer: {
    gifUrl: string;
    title: string;
    explanation: string;
    caption?: string;
  };
  onSelect: (option: boolean) => void;
  selectedOption: any;
  isChecked: boolean;
}

export default function GIFExplainer({
  gifExplainer,
  onSelect,
  selectedOption,
  isChecked
}: GIFExplainerProps) {
  const { gifUrl, title, explanation, caption } = gifExplainer;
  const isInteracted = selectedOption === true;

  return (
    <div className="flex flex-col space-y-6 w-full py-2">
      <div className="text-center">
        <p className="text-xs font-black uppercase text-indigo-500 tracking-widest flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span>VISUAL MOTION STUDY</span>
        </p>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-3xl border-4 border-slate-100 shadow-md overflow-hidden flex flex-col">
        {/* GIF container */}
        <div className="p-4 bg-[#f8fafc] flex flex-col justify-center items-center border-b border-slate-100 relative min-h-[220px]">
          {gifUrl ? (
            <motion.img
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={gifUrl}
              alt="Explainer GIF"
              referrerPolicy="no-referrer"
              className="max-h-64 object-contain rounded-2xl shadow-sm border-2 border-white"
            />
          ) : (
            <div className="text-5xl">🎬</div>
          )}

          {caption && (
            <div className="mt-3 px-3 py-1 bg-slate-200/50 backdrop-blur-sm rounded-lg text-[10px] font-black uppercase text-slate-500 tracking-wider">
              {caption}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-6 space-y-3.5">
          <h3 className="text-2xl font-display font-black text-slate-800 leading-tight">
            {title}
          </h3>
          <p className="text-base sm:text-lg font-bold text-slate-500 leading-relaxed">
            {explanation}
          </p>
        </div>
      </div>

      {/* Interaction button */}
      <div className="flex justify-center">
        <motion.button
          disabled={isChecked}
          onClick={() => onSelect(true)}
          whileHover={!isChecked ? { scale: 1.05 } : {}}
          whileTap={!isChecked ? { scale: 0.95 } : {}}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-display font-black text-sm uppercase tracking-wider transition-all cursor-pointer ${
            isInteracted
              ? 'bg-indigo-100 border-2 border-indigo-400 text-indigo-700 shadow-sm'
              : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300 shadow-[0_4px_0_#e2e8f0]'
          }`}
        >
          <PlayCircle className={`w-5 h-5 ${isInteracted ? 'text-indigo-500' : 'text-slate-400'}`} />
          <span>{isInteracted ? 'Watched & Noted! 🎓' : 'Understood! 💡'}</span>
        </motion.button>
      </div>
    </div>
  );
}
