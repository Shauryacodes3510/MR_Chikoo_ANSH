import { useState, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { soundManager } from '../../lib/sounds';
import { RotateCcw } from 'lucide-react';

interface Chip {
  id: string;
  text: string;
}

interface BuildAConceptProps {
  targetSentence?: string;
  chipsCorrect?: string[];
  chipsDistractor?: string[];
  isChecked: boolean;
  onSelect: (selected: string[]) => void;
}

export default function BuildAConcept({ chipsCorrect = [], chipsDistractor = [], isChecked, onSelect }: BuildAConceptProps) {
  const [selectedChips, setSelectedChips] = useState<Chip[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // Create unique IDs for all chips to handle duplicates and stable keys
  const poolChips = useRef<Chip[]>([
    ...(Array.isArray(chipsCorrect) ? chipsCorrect : []), 
    ...(Array.isArray(chipsDistractor) ? chipsDistractor : [])
  ].map((text, idx) => ({
    id: `chip-${idx}-${text}`,
    text: String(text || '')
  })));

  const handleDragEnd = (chip: Chip, event: any, info: any) => {
    if (isChecked) return;

    const { x, y } = info.point;
    const dropZone = dropZoneRef.current;

    if (dropZone) {
      const rect = dropZone.getBoundingClientRect();
      if (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      ) {
        if (!selectedChips.find(c => c.id === chip.id)) {
          const newSelected = [...selectedChips, chip];
          setSelectedChips(newSelected);
          onSelect(newSelected.map(c => c.text));
          soundManager.play('click');
        }
      }
    }
  };

  const addChip = (chip: Chip) => {
    if (isChecked) return;
    if (!selectedChips.find(c => c.id === chip.id)) {
      const newSelected = [...selectedChips, chip];
      setSelectedChips(newSelected);
      onSelect(newSelected.map(c => c.text));
      soundManager.play('click');
    }
  };

  const removeChip = (chipId: string) => {
    if (isChecked) return;
    const newSelected = selectedChips.filter(c => c.id !== chipId);
    setSelectedChips(newSelected);
    onSelect(newSelected.map(c => c.text));
    soundManager.play('click');
  };

  const handleReorder = (newOrder: Chip[]) => {
    if (isChecked) return;
    setSelectedChips(newOrder);
    onSelect(newOrder.map(c => c.text));
  };

  const reset = () => {
    if (isChecked) return;
    setSelectedChips([]);
    onSelect([]);
    soundManager.play('click');
  };

  return (
    <div className="w-full" ref={containerRef}>
      <div className="space-y-6 w-full max-w-lg mx-auto">
        <div className="flex justify-between items-center px-1">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            Concept Sequence definer
          </p>
          {!isChecked && selectedChips.length > 0 && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={reset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </motion.button>
          )}
        </div>

        {/* Playful 3D Drop Zone - Light style */}
        <div 
          ref={dropZoneRef}
          className={`min-h-[160px] p-6 rounded-[2.2rem] border-2.5 border-dashed transition-all duration-300 relative ${
            isChecked 
              ? 'bg-slate-50 border-slate-200' 
              : 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-slate-50/50'
          }`}
        >
          <Reorder.Group 
            axis="x" 
            values={selectedChips} 
            onReorder={handleReorder}
            className="flex flex-wrap gap-2.5 items-center justify-center min-h-[112px]"
          >
            <AnimatePresence mode="popLayout">
              {selectedChips.length === 0 && !isChecked && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-slate-400 font-display font-black text-sm text-center w-full absolute inset-0 flex items-center justify-center pointer-events-none px-6"
                >
                  Tap or drag blocks here to build sentence...
                </motion.p>
              )}
              {selectedChips.map((chip, index) => {
                const isCorrectPosition = chip.text === chipsCorrect[index];
                return (
                  <Reorder.Item
                    key={chip.id}
                    value={chip}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    dragListener={!isChecked}
                    className={`px-5 py-3.5 rounded-2xl font-display font-black text-sm sm:text-base border-2 transition-all cursor-grab active:cursor-grabbing select-none ${
                      isChecked 
                        ? isCorrectPosition 
                          ? 'bg-emerald-50 border-2 border-emerald-400 text-emerald-900 shadow-[0_5px_0_#a7f3d0] ring-4 ring-emerald-100' 
                          : 'bg-rose-50 border-2 border-rose-400 text-rose-900 shadow-[0_5px_0_#fecdd3] ring-4 ring-rose-100'
                        : 'bg-emerald-50 border-2 border-emerald-550 text-emerald-950 shadow-[0_5px_0_#a7f3d0] ring-4 ring-emerald-100/50 hover:border-emerald-600'
                    }`}
                    onClick={() => removeChip(chip.id)}
                  >
                    {chip.text}
                  </Reorder.Item>
                );
              })}
            </AnimatePresence>
          </Reorder.Group>
        </div>

        {/* Word block selection pool */}
        <div className="flex flex-wrap gap-4.5 justify-center p-6 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 shadow-inner">
          {poolChips.current.map((chip) => {
            const isSelected = selectedChips.some(c => c.id === chip.id);
            return (
              <div key={`pool-wrapper-${chip.id}`} className="relative">
                {/* Visual placeholder for selected chips */}
                <div className="px-5 py-3.5 rounded-2xl bg-slate-100/60 border border-dashed border-slate-200 text-transparent select-none font-black text-sm sm:text-base">
                  {chip.text}
                </div>
                
                {!isSelected && (
                  <motion.div
                    layoutId={chip.id}
                    drag={!isChecked}
                    dragConstraints={containerRef}
                    dragElastic={0.1}
                    onDragEnd={(e, info) => handleDragEnd(chip, e, info)}
                    onClick={() => addChip(chip)}
                    whileDrag={{ scale: 1.1, zIndex: 50, cursor: 'grabbing' }}
                    whileHover={{ scale: 1.05, cursor: 'grab', y: -2 }}
                    className="absolute inset-0 px-5 py-3.5 bg-white border-2 border-slate-250 rounded-2xl font-display font-black text-sm sm:text-base text-slate-700 hover:text-slate-900 shadow-[0_5px_0_#f1f5f9] transition-all touch-none flex items-center justify-center cursor-pointer"
                  >
                    {chip.text}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-3 text-slate-400">
          <div className="w-10 h-0.5 bg-slate-200" />
          <p className="text-[10px] font-black uppercase tracking-widest">
            Tap or arrange blocks to build
          </p>
          <div className="w-10 h-0.5 bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
