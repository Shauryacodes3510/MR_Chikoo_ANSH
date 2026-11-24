import { motion } from 'framer-motion';
import { HelpCircle, Sparkles, ArrowRightLeft } from 'lucide-react';

interface VisualAnalogyProps {
  visualAnalogy: {
    analogyTitle: string;
    illustrationUrl?: string;
    emojiLeft?: string;
    emojiRight?: string;
    conceptLeft: string;
    conceptRight: string;
    explanationLeft: string;
    explanationRight: string;
    mainExplanation: string;
  };
  onSelect: (option: boolean) => void;
  selectedOption: any;
  isChecked: boolean;
}

export default function VisualAnalogy({
  visualAnalogy,
  onSelect,
  selectedOption,
  isChecked
}: VisualAnalogyProps) {
  const {
    analogyTitle,
    illustrationUrl,
    emojiLeft,
    emojiRight,
    conceptLeft,
    conceptRight,
    explanationLeft,
    explanationRight,
    mainExplanation
  } = visualAnalogy;

  const isInteracted = selectedOption === true;

  return (
    <div className="flex flex-col space-y-6 w-full py-2">
      <div className="text-center">
        <p className="text-xs font-black uppercase text-indigo-500 tracking-widest flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span>ANALOGY MASTER STUDY</span>
        </p>
        <h3 className="text-lg font-display font-black text-slate-800 leading-tight mt-1">
          {analogyTitle}
        </h3>
      </div>

      {illustrationUrl && (
        <div className="w-full h-36 bg-slate-50 flex items-center justify-center rounded-3xl overflow-hidden shadow-sm border">
          <img
            src={illustrationUrl}
            alt="Visual illustration representation"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Grid comparing Left and Right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch relative">
        {/* Connection Arrow Overlay for Screens matching width */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex w-10 h-10 bg-white rounded-full items-center justify-center border-2 border-indigo-200 shadow-md">
          <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
        </div>

        {/* Left Side: Traditional Metaphor */}
        <div className="bg-amber-50/50 rounded-2xl border-2 border-amber-200/50 p-5 flex flex-col space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{emojiLeft || '🥖'}</span>
            <h4 className="font-display font-black text-amber-800 text-sm uppercase tracking-wide">
              {conceptLeft}
            </h4>
          </div>
          <p className="text-xs font-bold text-slate-650 leading-relaxed">
            {explanationLeft}
          </p>
        </div>

        {/* Right Side: Raw AI Equivalent */}
        <div className="bg-[#f0f9ff] rounded-2xl border-2 border-sky-200/50 p-5 flex flex-col space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{emojiRight || '⚡'}</span>
            <h4 className="font-display font-black text-sky-850 text-sm uppercase tracking-wide">
              {conceptRight}
            </h4>
          </div>
          <p className="text-xs font-bold text-slate-650 leading-relaxed">
            {explanationRight}
          </p>
        </div>
      </div>

      {/* Main explanation takeaway card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-150 flex gap-3.5 items-start">
        <div className="shrink-0 text-xl">💡</div>
        <div className="space-y-0.5 text-left">
          <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">
            THE CONNECTIVE INSIGHT:
          </span>
          <p className="text-xs font-bold text-slate-600 leading-relaxed">
            {mainExplanation}
          </p>
        </div>
      </div>

      {/* interactive verify */}
      <div className="flex justify-center">
        <motion.button
          disabled={isChecked}
          onClick={() => onSelect(true)}
          whileHover={!isChecked ? { scale: 1.05 } : {}}
          whileTap={!isChecked ? { scale: 0.95 } : {}}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-display font-black text-sm uppercase tracking-wider transition-all cursor-pointer ${
            isInteracted
              ? 'bg-[#e0f2fe] border-2 border-[#38bdf8] text-[#0369a1] shadow-sm'
              : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300 shadow-[0_4px_0_#e2e8f0]'
          }`}
        >
          <HelpCircle className={`w-5 h-5 ${isInteracted ? 'text-sky-500 animate-pulse' : 'text-slate-400'}`} />
          <span>{isInteracted ? 'Analogy Decoded! 🔗' : 'Connect Concepts! 💡'}</span>
        </motion.button>
      </div>
    </div>
  );
}
