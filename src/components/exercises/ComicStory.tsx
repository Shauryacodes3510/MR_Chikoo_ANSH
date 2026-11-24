import { motion } from 'framer-motion';
import { BookOpen, Sparkles } from 'lucide-react';

interface ComicPanel {
  imageUrl?: string;
  dialogue?: string;
  characterName?: string;
  caption?: string;
}

interface ComicStoryProps {
  comicStory: {
    title?: string;
    panels: ComicPanel[];
    takeaway: string;
  };
  onSelect: (option: boolean) => void;
  selectedOption: any;
  isChecked: boolean;
}

export default function ComicStory({
  comicStory,
  onSelect,
  selectedOption,
  isChecked
}: ComicStoryProps) {
  const { title, panels, takeaway } = comicStory;
  const isInteracted = selectedOption === true;

  return (
    <div className="flex flex-col space-y-6 w-full py-2">
      <div className="text-center">
        <p className="text-xs font-black uppercase text-pink-500 tracking-widest flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
          <span>COMIC STRIP HISTORY STUDY</span>
        </p>
      </div>

      {title && (
        <h3 className="text-lg font-display font-black text-center text-slate-850 tracking-tight leading-snug">
          {title}
        </h3>
      )}

      {/* Panels Layout grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {panels?.map((panel, idx) => {
          return (
            <motion.div
              key={`comic-panel-${idx}-${panel.characterName || ''}`}
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-3xl border-3 border-slate-100 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between space-y-3 min-h-[180px]"
            >
              {/* Image banner if present */}
              {panel.imageUrl ? (
                <div className="w-full h-24 bg-slate-50 flex items-center justify-center rounded-xl overflow-hidden border">
                  <img
                    src={panel.imageUrl}
                    alt={`comic panel ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">
                    Frame #{idx + 1}
                  </span>
                </div>
              )}

              {/* Chat Speech Bubble */}
              {panel.dialogue && (
                <div className="relative bg-amber-50 rounded-2xl p-3 border-2 border-amber-200">
                  {panel.characterName && (
                    <strong className="block text-[10px] uppercase text-amber-800 tracking-wider mb-0.5">
                      {panel.characterName}:
                    </strong>
                  )}
                  <p className="text-xs font-bold text-slate-700 leading-snug italic">
                    "{panel.dialogue}"
                  </p>
                  {/* Little speech arrow decoration */}
                  <div className="absolute -bottom-2 left-6 w-3.5 h-3.5 bg-amber-50 border-r-2 border-b-2 border-amber-200 rotate-45 transform" />
                </div>
              )}

              {panel.caption && (
                <div className="text-[11px] font-bold text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-dotted border-slate-150 leading-relaxed">
                  {panel.caption}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Takeaway Panel */}
      <div className="bg-gradient-to-br from-[#e0f2fe] to-pink-50 p-5 rounded-3xl border-3 border-sky-100 text-center space-y-1.5 shadow-sm">
        <span className="text-xs font-black uppercase text-indigo-700 tracking-widest block">
          🔑 STORY TAKEAWAY:
        </span>
        <p className="text-sm font-black text-slate-850 px-2 leading-relaxed">
          {takeaway}
        </p>
      </div>

      {/* Acknowledge Action */}
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
          <BookOpen className={`w-5 h-5 ${isInteracted ? 'text-pink-500 animate-pulse' : 'text-slate-400'}`} />
          <span>{isInteracted ? 'Story Complete! 📖' : 'Read Whole Comic! 📑'}</span>
        </motion.button>
      </div>
    </div>
  );
}
