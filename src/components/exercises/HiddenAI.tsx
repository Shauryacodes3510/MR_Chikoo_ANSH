import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, Search, Eye, AlertCircle } from 'lucide-react';

interface HiddenArea {
  id: string;
  label: string;
  locationText: string;
  techName: string;
  description: string;
  isCorrectSpot: boolean;
}

interface HiddenAIProps {
  hiddenAi: {
    scene: string;
    areas: HiddenArea[];
  };
  onSelect: (option: string | HiddenArea) => void;
  selectedOption: any;
  isChecked: boolean;
  isCorrect: boolean;
}

export default function HiddenAI({
  hiddenAi,
  onSelect,
  selectedOption,
  isChecked,
  isCorrect
}: HiddenAIProps) {
  const { scene, areas } = hiddenAi;

  // Track currently inspected area details
  const [inspectedArea, setInspectedArea] = useState<HiddenArea | null>(null);

  const handleAreaClick = (area: HiddenArea) => {
    if (isChecked) return;
    setInspectedArea(area);
    onSelect(area);
  };

  return (
    <div className="flex flex-col space-y-6 w-full">
      <div className="bg-slate-50 border-2 border-slate-150 rounded-2xl p-4.5 text-center">
        <span className="text-[10px] font-black uppercase text-pink-500 tracking-wider block mb-1">
          🕵️ SCAVENGER SCENE HUNT:
        </span>
        <p className="text-xs font-bold text-slate-700 leading-normal">
          {scene}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        {areas.map((area) => {
          const isSelected = selectedOption === area.id || (selectedOption && typeof selectedOption === 'object' && selectedOption.id === area.id);
          const shouldHighlightCorrect = isChecked && area.isCorrectSpot;

          let cardClass = 'bg-white border-slate-200 text-slate-700 hover:border-slate-350 shadow-[0_4px_0_#cbd5e1]';
          if (isSelected) {
            cardClass = isChecked
              ? isCorrect
                ? 'bg-green-50 border-green-500 text-green-800 shadow-[0_4px_0_#10b981]'
                : 'bg-rose-50 border-rose-500 text-rose-800 shadow-[0_4px_0_#f43f5e]'
              : 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-[0_4px_0_#6366f1]';
          } else if (shouldHighlightCorrect) {
            cardClass = 'bg-[#e8fbf0] border-emerald-500 text-emerald-800 shadow-[0_4px_0_#10b981] opacity-95';
          } else if (isChecked) {
            cardClass = 'opacity-40 bg-slate-50 border-slate-200 text-slate-400 shadow-none';
          }

          return (
            <motion.button
              key={area.id}
              disabled={isChecked}
              onClick={() => handleAreaClick(area)}
              whileHover={!isChecked ? { y: -1, scale: 1.01 } : {}}
              whileTap={!isChecked ? { y: 1, scale: 0.99 } : {}}
              className={`p-4 rounded-xl border-2 text-left flex flex-col space-y-2.5 transition-all relative overflow-hidden w-full cursor-pointer min-h-[96px] justify-between ${cardClass}`}
            >
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-md">
                  {area.label}
                </span>
                <p className="text-xs font-bold text-slate-700 leading-tight">
                  {area.locationText}
                </p>
              </div>

              {isSelected && !isChecked && (
                <span className="text-[9px] font-black text-indigo-600 block flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>Selected & Inspected</span>
                </span>
              )}

              {isSelected && !isChecked && (
                <div className="absolute top-2 right-2 flex items-center justify-center bg-aibo-blue-500 text-white rounded-full p-0.5 shadow-sm">
                  <Check className="w-3 h-3" strokeWidth={3} />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Details Box showing how AI operates on select or checked */}
      <AnimatePresence mode="wait">
        {(inspectedArea || isChecked) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4.5 rounded-2xl border-2 leading-relaxed text-xs ${
              isChecked
                ? isCorrect
                  ? 'bg-green-50 border-emerald-250 text-green-800 animate-pulse'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-slate-50 border-slate-250 text-slate-600'
            }`}
          >
            {isChecked ? (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-display font-black text-xs uppercase">
                  <span>💡 HIDDEN AI EXPOSURE ANALYSIS:</span>
                </div>
                {areas.map((area) => {
                  if (area.isCorrectSpot || (selectedOption && (selectedOption === area.id || selectedOption.id === area.id))) {
                    return (
                      <div key={area.id} className="p-2 border-b last:border-0 border-slate-100 space-y-0.5">
                        <strong className="text-[10px] text-indigo-700 block uppercase font-black">
                          {area.label} → {area.techName}:
                        </strong>
                        <p className="text-[11px] font-semibold text-slate-600">{area.description}</p>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ) : inspectedArea ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                    🔭 INSPECTING ELEMENT: {inspectedArea.label}
                  </span>
                  <span className="text-[10px] font-black uppercase text-indigo-650 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-md">
                    Tech: {inspectedArea.techName}
                  </span>
                </div>
                <p className="text-xs font-semibold leading-relaxed text-slate-600">
                  {inspectedArea.description}
                </p>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
