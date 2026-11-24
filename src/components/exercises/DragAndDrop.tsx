import { useState, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '../../lib/sounds';

interface Bucket {
  id: string;
  label: string;
}

interface Item {
  id: string;
  text: string;
  correct_bucket: string;
}

interface DragAndDropProps {
  buckets: Bucket[];
  items: Item[];
  isChecked: boolean;
  onSelect: (assignments: { [itemId: string]: string }) => void;
}

const DraggableItem = memo(({ item, isChecked, isAssigned, bucketId, onDragEnd, onClick, containerRef }: {
  item: Item;
  isChecked: boolean;
  isAssigned: boolean;
  bucketId?: string;
  onDragEnd: (itemId: string, info: any) => void;
  onClick?: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) => {
  let visualClasses = "";
  if (isChecked) {
    if (item.correct_bucket === bucketId) {
      visualClasses = "bg-emerald-50 border-2 border-emerald-400 text-emerald-900 shadow-[0_5px_0_#a7f3d0] ring-4 ring-emerald-100 scale-105";
    } else {
      visualClasses = "bg-rose-50 border-2 border-rose-400 text-rose-900 shadow-[0_5px_0_#fecdd3] ring-4 ring-rose-100 opacity-80";
    }
  } else if (isAssigned) {
    visualClasses = "bg-pink-50 border-2 border-pink-400 text-pink-900 shadow-[0_5px_0_#fbcfe8] ring-4 ring-pink-100/50 cursor-pointer";
  } else {
    visualClasses = "bg-white border-2 border-slate-200 text-slate-700 hover:text-slate-950 hover:border-pink-300 shadow-[0_5px_0_#f1f5f9] cursor-pointer";
  }

  return (
    <motion.div
      layoutId={item.id}
      drag={!isChecked}
      dragConstraints={containerRef}
      dragElastic={0.1}
      dragSnapToOrigin={true}
      onDragEnd={(_, info) => onDragEnd(item.id, info)}
      whileDrag={{ scale: 1.1, zIndex: 50, cursor: 'grabbing' }}
      whileHover={!isChecked ? { scale: 1.05, y: -2 } : {}}
      onClick={onClick}
      className={`px-4.5 py-3 rounded-2xl font-display font-black text-sm sm:text-base transition-all touch-none select-none ${visualClasses} ${!isAssigned ? 'px-6 py-4 text-base' : ''}`}
    >
      {item.text}
    </motion.div>
  );
});

export default function DragAndDrop({ buckets, items, isChecked, onSelect }: DragAndDropProps) {
  const [assignments, setAssignments] = useState<{ [itemId: string]: string }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const bucketRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleDragEnd = useCallback((itemId: string, info: any) => {
    if (isChecked) return;

    const { x, y } = info.point;
    let droppedInBucketId = '';

    // Check if dropped inside any bucket with a strict inset
    for (const bucketId in bucketRefs.current) {
      const bucketEl = bucketRefs.current[bucketId];
      if (bucketEl) {
        const rect = bucketEl.getBoundingClientRect();
        const INSET = 5; 
        if (
          x >= rect.left + INSET &&
          x <= rect.right - INSET &&
          y >= rect.top + INSET &&
          y <= rect.bottom - INSET
        ) {
          droppedInBucketId = bucketId;
          break;
        }
      }
    }

    if (droppedInBucketId) {
      if (assignments[itemId] !== droppedInBucketId) {
        const newAssignments = { ...assignments, [itemId]: droppedInBucketId };
        setAssignments(newAssignments);
        onSelect(newAssignments);
        soundManager.play('click');
      }
    } else {
      // Dropped outside any bucket - if it was assigned, return to pool
      if (assignments[itemId]) {
        const newAssignments = { ...assignments };
        delete newAssignments[itemId];
        setAssignments(newAssignments);
        onSelect(newAssignments);
        soundManager.play('click');
      }
    }
  }, [assignments, isChecked, onSelect]);

  const toggleAssign = useCallback((itemId: string) => {
    if (isChecked) return;
    
    if (assignments[itemId]) {
      // Unassign
      const newAssignments = { ...assignments };
      delete newAssignments[itemId];
      setAssignments(newAssignments);
      onSelect(newAssignments);
      soundManager.play('click');
    } else {
      // Assign to the first available bucket
      const firstBucketId = buckets[0].id;
      const newAssignments = { ...assignments, [itemId]: firstBucketId };
      setAssignments(newAssignments);
      onSelect(newAssignments);
      soundManager.play('click');
    }
  }, [assignments, isChecked, onSelect, buckets]);

  return (
    <div className="w-full animate-fadeIn" ref={containerRef}>
      <div className="space-y-8 w-full max-w-xl mx-auto">
        <div className="text-center text-xs font-black uppercase tracking-widest text-slate-400">
          Drag or Tap items into the correct categories below
        </div>

        {/* 3D buckets grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {buckets.map((bucket, bIdx) => {
            const hasItems = items.filter(item => assignments[item.id] === bucket.id).length > 0;
            // Vibrant colors for buckets
            const borderColors = [
              'border-pink-250 hover:border-pink-400 bg-pink-50/15',
              'border-purple-250 hover:border-purple-400 bg-purple-50/15',
              'border-rose-250 hover:border-rose-400 bg-rose-50/15'
            ];
            const textColors = [
              'text-pink-600',
              'text-purple-600',
              'text-rose-600'
            ];
            const colorClass = borderColors[bIdx % borderColors.length];
            const textClass = textColors[bIdx % textColors.length];

            return (
              <div 
                key={bucket.id} 
                ref={el => { bucketRefs.current[bucket.id] = el; }}
                className={`relative rounded-[2.2rem] p-6 pt-9 min-h-[160px] flex flex-col gap-4 border-2 transition-all duration-300 ${
                  isChecked 
                    ? 'bg-slate-50 border-slate-200' 
                    : `${colorClass} shadow-[0_6px_0_#f8fafc]`
                }`}
              >
                {/* Bucket floating badge */}
                <div className="absolute -top-3.5 left-6 px-4 py-1.5 bg-white border-2 border-slate-100 rounded-full shadow-sm">
                  <h4 className={`font-display font-black uppercase text-[10px] sm:text-xs tracking-wider leading-none ${textClass}`}>
                    📁 {bucket.label}
                  </h4>
                </div>
                
                <div className="flex flex-wrap gap-2.5 justify-start items-start flex-1">
                  <AnimatePresence mode="popLayout">
                    {items.filter(item => assignments[item.id] === bucket.id).map(item => (
                      <DraggableItem
                        key={item.id}
                        item={item}
                        isChecked={isChecked}
                        isAssigned={true}
                        bucketId={bucket.id}
                        onDragEnd={handleDragEnd}
                        onClick={() => toggleAssign(item.id)}
                        containerRef={containerRef}
                      />
                    ))}
                  </AnimatePresence>
                  
                  {/* Empty placeholder if no items */}
                  {!hasItems && !isChecked && (
                    <div className="w-full h-full min-h-[80px] flex items-center justify-center border-2 border-dashed border-slate-150 rounded-2xl">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic select-none">Place items here</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Playful Item Pool */}
        <div className="relative p-6 sm:p-8 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] min-h-[140px] flex flex-wrap gap-4 justify-center items-center">
          {items.map(item => {
            const isAssigned = !!assignments[item.id];
            return (
              <div key={`pool-slot-${item.id}`} className="relative">
                {/* Fixed Position Placeholder */}
                <div className="px-6 py-4 rounded-2xl bg-slate-50/55 text-transparent select-none font-display font-black text-base border border-dashed border-slate-150">
                  {item.text}
                </div>

                <AnimatePresence>
                  {!isAssigned && (
                    <div className="absolute inset-0">
                      <DraggableItem
                        item={item}
                        isChecked={isChecked}
                        isAssigned={false}
                        onDragEnd={handleDragEnd}
                        onClick={() => toggleAssign(item.id)}
                        containerRef={containerRef}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
        
        <div className="flex items-center justify-center gap-3 text-slate-400">
          <div className="w-8 h-0.5 bg-slate-200" />
          <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Drag or Tap blocks to categorize
          </p>
          <div className="w-8 h-0.5 bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
