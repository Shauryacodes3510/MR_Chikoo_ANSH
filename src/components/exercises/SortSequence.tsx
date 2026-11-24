import { useState, useEffect, useMemo } from 'react';
import { motion, Reorder } from 'framer-motion';
import { GripVertical } from 'lucide-react';

interface Step {
  id: string;
  text: string;
}

interface SortSequenceProps {
  steps?: (Step | string)[];
  correctOrder?: string[];
  isChecked: boolean;
  onSelect: (ids: string[]) => void;
}

export default function SortSequence({ steps = [], correctOrder = [], isChecked, onSelect }: SortSequenceProps) {
  const initialItems = useMemo(() => {
    if (!steps || !Array.isArray(steps)) return [];
    return steps.map((s, idx) => {
      if (typeof s === 'string') return { id: `step_${idx}`, text: s };
      return { id: s?.id || `step_${idx}`, text: s?.text || (s as any)?.title || String(s || '') };
    });
  }, [steps]);

  const [items, setItems] = useState<Step[]>(initialItems);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    onSelect(items.map(i => i.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const handleReorder = (newItems: Step[]) => {
    setItems(newItems);
  };

  const safeOrder = Array.isArray(correctOrder) ? correctOrder : [];

  return (
    <div className="w-full">
      <div className="space-y-6 w-full max-w-md mx-auto">
        <div className="text-center text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
          Arrange steps in correct chronological sequence
        </div>

        <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-4">
          {items.map((item, index) => {
            const isCorrectPos = isChecked && safeOrder[index] !== undefined && item.id === safeOrder[index];

            let itemClass = 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-amber-400 hover:text-slate-950 shadow-[0_6px_0_#f1f5f9] cursor-grab active:cursor-grabbing';
            if (isChecked) {
              if (isCorrectPos) {
                itemClass = 'bg-emerald-50 border-2 border-emerald-400 text-emerald-900 shadow-[0_6px_0_#a7f3d0] ring-4 ring-emerald-100';
              } else {
                itemClass = 'bg-rose-50 border-2 border-rose-400 text-rose-900 shadow-[0_6px_0_#fecdd3] ring-4 ring-rose-100';
              }
            }

            return (
              <Reorder.Item 
                key={item.id} 
                value={item}
                dragListener={!isChecked}
                className={`flex items-center gap-4.5 p-5 rounded-[2rem] border transition-all select-none ${itemClass}`}
              >
                {/* Steps Order Indicator */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-2xl font-display font-black text-sm shrink-0 border ${
                  isChecked 
                    ? isCorrectPos 
                      ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm' 
                      : 'bg-rose-500 border-rose-400 text-white shadow-sm' 
                    : 'bg-amber-50 border border-amber-100 text-amber-600'
                }`}>
                  {index + 1}
                </div>
                
                <p className="flex-1 font-display font-black text-base sm:text-lg leading-snug tracking-wide text-slate-800">
                  {item.text}
                </p>
                
                {!isChecked && (
                  <div className="text-slate-300">
                    <GripVertical size={20} />
                  </div>
                )}
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </div>
    </div>
  );
}
