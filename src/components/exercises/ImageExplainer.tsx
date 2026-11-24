import { motion } from 'framer-motion';
import { Eye, Sparkles } from 'lucide-react';

interface ImageExplainerProps {
  imageExplainer: {
    imageUrl: string;
    title?: string;
    text?: string;
    caption?: string;
  };
  onSelect: (option: boolean) => void;
  selectedOption: any;
  isChecked: boolean;
}

export default function ImageExplainer({
  imageExplainer,
  onSelect,
  selectedOption,
  isChecked
}: ImageExplainerProps) {
  const { imageUrl, title, text, caption } = imageExplainer;
  const isInteracted = selectedOption === true;

  return (
    <div className="flex flex-col space-y-6 w-full py-2">
      <div className="text-center">
        <p className="text-xs font-black uppercase text-pink-500 tracking-widest flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
          <span>VISUAL GALLERY STUDY</span>
        </p>
      </div>

      {title && (
        <h3 className="text-xl font-display font-black text-center text-slate-800 leading-tight">
          {title}
        </h3>
      )}

      {/* Hero Image Container */}
      <div className="bg-white rounded-3xl border-4 border-slate-100 shadow-md overflow-hidden flex flex-col items-center">
        {imageUrl ? (
          <div className="w-full relative bg-slate-50 border-b min-h-[240px] flex items-center justify-center">
            <motion.img
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={imageUrl}
              alt={title || "Image Explainer Core View"}
              referrerPolicy="no-referrer"
              className="w-full object-cover max-h-[340px]"
            />
            {caption && (
              <div className="absolute bottom-3 right-3 bg-black/60 text-white rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-wider backdrop-blur-sm">
                {caption}
              </div>
            )}
          </div>
        ) : (
          <div className="p-16 text-5xl">🖼️</div>
        )}

        {text && (
          <div className="p-6 w-full text-center">
            <p className="text-sm font-bold leading-relaxed text-slate-600">
              {text}
            </p>
          </div>
        )}
      </div>

      {/* Action interaction */}
      <div className="flex justify-center">
        <motion.button
          disabled={isChecked}
          onClick={() => onSelect(true)}
          whileHover={!isChecked ? { scale: 1.05 } : {}}
          whileTap={!isChecked ? { scale: 0.95 } : {}}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-display font-black text-sm uppercase tracking-wider transition-all cursor-pointer ${
            isInteracted
              ? 'bg-pink-100 border-2 border-pink-400 text-pink-700 shadow-sm'
              : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300 shadow-[0_4px_0_#e2e8f0]'
          }`}
        >
          <Eye className={`w-5 h-5 ${isInteracted ? 'text-pink-500' : 'text-slate-400'}`} />
          <span>{isInteracted ? 'Visual Inspected! 🔎' : 'Tap to register study! 🔎'}</span>
        </motion.button>
      </div>
    </div>
  );
}
