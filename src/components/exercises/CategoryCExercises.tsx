import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '../../lib/sounds';
import { 
  Play, Pause, Check, X, 
  HelpCircle, Volume2, Image as ImageIcon, 
  Trash2, MapPin
} from 'lucide-react';

// ==========================================
// C7 — Sequence Builder
// ==========================================
interface C7SequenceBuilderProps {
  steps: { id: string; text: string }[];
  correctOrder: string[];
  isChecked: boolean;
  onSelect: (selectedIds: string[]) => void;
}

export function C7SequenceBuilder({ steps, correctOrder, isChecked, onSelect }: C7SequenceBuilderProps) {
  const [items, setItems] = useState<typeof steps>([]);

  useEffect(() => {
    // Shuffle on mount but keep ordered if isChecked
    if (!isChecked && items.length === 0) {
      setItems([...steps].sort(() => Math.random() - 0.5));
    }
  }, [steps, isChecked, items.length]);

  useEffect(() => {
    if (items.length > 0) {
      onSelect(items.map(i => i.id));
    }
  }, [items, onSelect]);

  const moveUp = (idx: number) => {
    if (isChecked || idx === 0) return;
    const next = [...items];
    const temp = next[idx];
    next[idx] = next[idx - 1];
    next[idx - 1] = temp;
    setItems(next);
    soundManager.play('click');
  };

  const moveDown = (idx: number) => {
    if (isChecked || idx === items.length - 1) return;
    const next = [...items];
    const temp = next[idx];
    next[idx] = next[idx + 1];
    next[idx + 1] = temp;
    setItems(next);
    soundManager.play('click');
  };

  const isCorrect = items.length === correctOrder.length &&
                    items.every((item, idx) => item.id === correctOrder[idx]);

  return (
    <div className="w-full">
      <div className="space-y-4 w-full max-w-md mx-auto">
        <div className="text-center text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
          Arrange steps from top to bottom
        </div>

        <div className="flex flex-col space-y-3.5">
          {items.map((item, idx) => {
            const isCorrectPos = isChecked && item.id === correctOrder[idx];
            
            let cardStyle = 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-indigo-400 hover:text-slate-950 shadow-[0_5px_0_#f1f5f9]';
            if (isChecked) {
              if (isCorrectPos) {
                cardStyle = 'bg-emerald-50 border-2 border-emerald-400 text-emerald-900 shadow-[0_5px_0_#a7f3d0] ring-4 ring-emerald-100';
              } else {
                cardStyle = 'bg-rose-50 border-2 border-rose-400 text-rose-900 shadow-[0_5px_0_#fecdd3] ring-4 ring-rose-100';
              }
            }

            return (
              <div key={item.id} className="flex flex-col items-center w-full">
                {idx > 0 && (
                  <div className="w-1.5 h-4 bg-slate-200 rounded-full my-1 animate-pulse" />
                )}
                <motion.div 
                   layoutId={`seq-${item.id}`}
                   className={`w-full flex items-center justify-between p-4.5 rounded-[1.8rem] border transition-all relative select-none ${cardStyle}`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-xl text-xs font-black shrink-0 border ${
                      isChecked 
                        ? isCorrectPos 
                          ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm' 
                          : 'bg-rose-500 border-rose-400 text-white shadow-sm' 
                        : 'bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold'
                    }`}>
                      {idx + 1}
                    </div>
                    <span className="font-bold text-xs sm:text-sm leading-snug truncate tracking-wide text-slate-800">{item.text}</span>
                  </div>

                  {!isChecked && (
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="w-8 h-8 flex items-center justify-center bg-white hover:bg-indigo-50 border border-slate-200 text-slate-500 hover:text-indigo-600 rounded-xl disabled:opacity-20 cursor-pointer text-xs font-black transition-all shadow-sm"
                      >
                        ▲
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => moveDown(idx)}
                        disabled={idx === items.length - 1}
                        className="w-8 h-8 flex items-center justify-center bg-white hover:bg-indigo-50 border border-slate-200 text-slate-500 hover:text-indigo-600 rounded-xl disabled:opacity-20 cursor-pointer text-xs font-black transition-all shadow-sm"
                      >
                        ▼
                      </motion.button>
                    </div>
                  )}

                  {isChecked && (
                    <div className="shrink-0 ml-2">
                      {isCorrectPos ? (
                        <Check className="w-5 h-5 text-emerald-600 drop-shadow-sm font-black" strokeWidth={3.5} />
                      ) : (
                        <X className="w-5 h-5 text-rose-600 drop-shadow-sm font-black" strokeWidth={3.5} />
                      )}
                    </div>
                  )}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// C8 — Tap Correct Object
// ==========================================
interface C8TapCorrectObjectProps {
  question: string;
  options: string[];
  correctAnswer: string;
  isChecked: boolean;
  isCorrect: boolean;
  onSelect: (selected: string) => void;
  selectedOption: string | null;
  items?: any;
}

export function C8TapCorrectObject({ 
  options, 
  correctAnswer, 
  isChecked, 
  isCorrect,
  onSelect, 
  selectedOption,
  items 
}: C8TapCorrectObjectProps) {

  // Helper to extract image URL for option at index idx
  const getOptionImage = (option: string, idx: number): string | null => {
    if (typeof option === 'string' && (option.startsWith('http://') || option.startsWith('https://') || option.startsWith('data:') || option.startsWith('/'))) {
      return option;
    }
    if (items) {
      if (Array.isArray(items)) {
        const item = items[idx];
        if (typeof item === 'string' && item.trim().length > 0) return item.trim();
        if (item && typeof item === 'object') {
          const url = item.image || item.imageUrl || item.src || item.url || item.img;
          if (typeof url === 'string' && url.trim().length > 0) return url.trim();
        }
      } else if (typeof items === 'object') {
        const item = items[option] || items[idx];
        if (typeof item === 'string' && item.trim().length > 0) return item.trim();
        if (item && typeof item === 'object') {
          const url = item.image || item.imageUrl || item.src || item.url || item.img;
          if (typeof url === 'string' && url.trim().length > 0) return url.trim();
        }
      }
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="space-y-4 w-full max-w-md mx-auto">
        <div className="text-center text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
          Tap the correct object to select it
        </div>

        <div className="grid grid-cols-2 gap-4">
          {options.map((option, idx) => {
            const isSelected = selectedOption === option;
            const isAnswerCorrect = option === correctAnswer;
            const imgUrl = getOptionImage(option, idx);

            let cardClass = "bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-amber-400 hover:text-slate-950 shadow-[0_5px_0_#f1f5f9]";
            let iconBoxClass = "bg-amber-50 border border-amber-100 text-amber-500";

            if (isSelected) {
              cardClass = "bg-amber-50 border-2.5 border-amber-400 text-amber-950 shadow-[0_5px_0_#fde68a] ring-4 ring-amber-100 translate-y-[-2px]";
              iconBoxClass = "bg-amber-500 border-amber-400 text-white";
            }
            if (isChecked) {
              if (isAnswerCorrect) {
                cardClass = "bg-emerald-50 border-2 border-emerald-400 text-emerald-900 shadow-[0_5px_0_#a7f3d0] ring-4 ring-emerald-100";
                iconBoxClass = "bg-emerald-500 border-emerald-400 text-white";
              } else if (isSelected) {
                cardClass = "bg-rose-50 border-2 border-rose-400 text-rose-900 shadow-[0_5px_0_#fecdd3] ring-4 ring-rose-100 opacity-80 animate-shake";
                iconBoxClass = "bg-rose-500 border-rose-400 text-white";
              } else {
                cardClass = "bg-slate-50 border-2 border-slate-100 text-slate-450 shadow-none opacity-30 pointer-events-none scale-95";
                iconBoxClass = "bg-slate-100 border-slate-200 text-slate-400";
              }
            }

            const isOptionUrl = typeof option === 'string' && (option.startsWith('http://') || option.startsWith('https://') || option.startsWith('data:') || option.startsWith('/'));
            const displayText = isOptionUrl ? `Option ${idx + 1}` : option;
            const optKey = typeof option === 'string' ? option.replace(/\s+/g, '_').slice(0, 20) : idx;

            return (
              <motion.button
                key={`c8-obj-${idx}-${optKey}`}
                disabled={isChecked}
                onClick={() => {
                  onSelect(option);
                  soundManager.play('click');
                }}
                whileHover={!isChecked ? { scale: 1.025, y: -2 } : {}}
                whileTap={!isChecked ? { scale: 0.975, y: 1 } : {}}
                className={`flex flex-col items-center justify-between p-3.5 min-h-[150px] sm:min-h-[170px] rounded-[1.8rem] border transition-all cursor-pointer relative overflow-hidden ${cardClass}`}
              >
                {imgUrl ? (
                  <div className="w-full h-24 sm:h-28 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center p-1.5 border border-slate-100 shadow-inner group-hover:scale-105 transition-transform mb-2">
                    <img 
                      src={imgUrl} 
                      alt={displayText} 
                      className="w-full h-full object-contain drop-shadow-sm rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className={`p-3 rounded-2xl my-auto transition-colors ${iconBoxClass} shadow-sm`}>
                    <HelpCircle className="w-6 h-6 stroke-[2.5px]" />
                  </div>
                )}
                <span className="font-extrabold text-xs sm:text-sm tracking-wide leading-snug text-slate-800 text-center w-full px-1 py-1">
                  {displayText}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// C9 — True / False
// ==========================================
interface C9TrueFalseProps {
  correctAnswer: 'true' | 'false' | string;
  isChecked: boolean;
  isCorrect: boolean;
  onSelect: (selected: string) => void;
  selectedOption: string | null;
}

export function C9TrueFalse({ 
  correctAnswer, 
  isChecked, 
  isCorrect,
  onSelect, 
  selectedOption 
}: C9TrueFalseProps) {
  
  const choices = [
    { value: 'true', label: 'True', color: 'emerald', bg: 'bg-emerald-500', hover: 'hover:bg-emerald-600', icon: Check },
    { value: 'false', label: 'False', color: 'rose', bg: 'bg-rose-500', hover: 'hover:bg-rose-600', icon: X }
  ];

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-4.5 max-w-md mx-auto w-full">
        {choices.map((choice) => {
          const isSelected = selectedOption === choice.value;
          const isCorrectChoice = choice.value === correctAnswer;
          const Icon = choice.icon;

          let style = "bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-indigo-400 hover:text-slate-950 shadow-[0_6px_0_#f1f5f9]";
          if (isSelected) {
            style = choice.value === 'true' 
              ? "bg-emerald-50 border-2.5 border-emerald-500 text-emerald-950 shadow-[0_6px_0_#a7f3d0] ring-4 ring-emerald-100 translate-y-[-4px]" 
              : "bg-rose-50 border-2.5 border-rose-500 text-rose-950 shadow-[0_6px_0_#fecdd3] ring-4 ring-rose-100 translate-y-[-4px]";
          }

          if (isChecked) {
            if (isCorrectChoice) {
              style = choice.value === 'true'
                ? "bg-emerald-50 border-2.5 border-emerald-500 text-emerald-950 shadow-[0_6px_0_#a7f3d0] ring-4 ring-emerald-100"
                : "bg-rose-50 border-2.5 border-rose-500 text-rose-950 shadow-[0_6px_0_#fecdd3] ring-4 ring-rose-100";
            } else if (isSelected) {
              style = choice.value === 'true'
                ? "bg-emerald-50 border-2.5 border-emerald-500 text-emerald-950 shadow-[0_6px_0_#a7f3d0] ring-4 ring-emerald-100 opacity-80"
                : "bg-rose-50 border-2.5 border-rose-500 text-rose-950 shadow-[0_6px_0_#fecdd3] ring-4 ring-rose-100 opacity-80";
            } else {
              style = "bg-slate-50 border-2 border-slate-100 text-slate-400 shadow-none opacity-25 pointer-events-none scale-95";
            }
          }

          return (
            <motion.button
              key={choice.value}
              disabled={isChecked}
              onClick={() => {
                onSelect(choice.value);
                soundManager.play('click');
              }}
              whileHover={!isChecked ? { scale: 1.025, y: -2 } : {}}
              whileTap={!isChecked ? { scale: 0.975, y: 1 } : {}}
              className={`flex-1 flex flex-col items-center justify-center p-8 rounded-[2rem] border transition-all cursor-pointer h-44 ${style}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 text-white ${
                choice.value === 'true' ? 'bg-emerald-500 shadow-emerald-200' : 'bg-rose-500 shadow-rose-200'
              } ${isChecked && !isCorrectChoice && !isSelected ? 'opacity-35' : ''} shadow-md`}>
                <Icon className="w-5 h-5 stroke-[3.5px]" />
              </div>
              <span className="text-base sm:text-lg font-black tracking-wide uppercase">{choice.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// C10 — Swipe Left / Right
// ==========================================
interface C10SwipeLeftRightProps {
  question: string;
  correctAnswer: 'true' | 'false' | string;
  isChecked: boolean;
  isCorrect: boolean;
  onSelect: (selected: string) => void;
  selectedOption: string | null;
}

export function C10SwipeLeftRight({ 
  question, 
  correctAnswer, 
  isChecked, 
  isCorrect,
  onSelect, 
  selectedOption 
}: C10SwipeLeftRightProps) {
  const [dragOffset, setDragOffset] = useState(0);

  const handleDrag = (event: any, info: any) => {
    if (isChecked) return;
    setDragOffset(info.offset.x);
  };

  const handleDragEnd = (event: any, info: any) => {
    if (isChecked) return;
    const threshold = 100;
    if (info.offset.x > threshold) {
      onSelect('true');
      soundManager.play('click');
    } else if (info.offset.x < -threshold) {
      onSelect('false');
      soundManager.play('click');
    }
    setDragOffset(0);
  };

  const selectManual = (val: 'true' | 'false') => {
    if (isChecked) return;
    onSelect(val);
    soundManager.play('click');
  };

  return (
    <div className="w-full">
      <div className="flex flex-col items-center max-w-md mx-auto w-full space-y-6">
        <div className="relative w-full h-64 flex items-center justify-center select-none">
          <AnimatePresence>
            <motion.div
              drag={!isChecked ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              style={{
                rotate: dragOffset * 0.05,
                x: dragOffset,
              }}
              animate={
                selectedOption 
                  ? selectedOption === 'true' 
                    ? { x: 120, rotate: 10, scale: 0.98 } 
                    : { x: -120, rotate: -10, scale: 0.98 }
                  : { x: 0, rotate: 0, scale: 1 }
              }
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className={`absolute w-full max-w-sm h-full p-6 bg-white border-2 rounded-[2rem] flex flex-col justify-between items-center text-center shadow-[0_15px_40px_rgba(0,0,0,0.05)] cursor-grab active:cursor-grabbing ${
                selectedOption === 'true' 
                  ? 'border-emerald-400' 
                  : selectedOption === 'false' 
                    ? 'border-rose-400' 
                    : 'border-slate-100'
              }`}
            >
              {/* Top Indicator */}
              <div className="flex justify-between w-full">
                <span className={`text-[10px] font-black uppercase tracking-widest text-rose-500 transition-opacity ${
                  dragOffset < -10 || selectedOption === 'false' ? 'opacity-100' : 'opacity-25'
                }`}>
                  ◀ Swipe False
                </span>
                <span className={`text-[10px] font-black uppercase tracking-widest text-emerald-550 transition-opacity ${
                  dragOffset > 10 || selectedOption === 'true' ? 'opacity-100' : 'opacity-25'
                }`}>
                  Swipe True ▶
                </span>
              </div>

              {/* Content Question */}
              <div className="py-2 flex flex-col items-center">
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-full mb-3">
                  <HelpCircle className="w-8 h-8 text-amber-500 stroke-[2.5px]" />
                </div>
                <p className="text-sm sm:text-base font-black text-slate-800 leading-snug px-3 tracking-wide">{question}</p>
              </div>

              {/* Card Status */}
              <div className="h-6 flex items-center">
                {selectedOption === 'true' && (
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200">
                    Selected True
                  </span>
                )}
                {selectedOption === 'false' && (
                  <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full uppercase tracking-wider border border-rose-200">
                    Selected False
                  </span>
                )}
                {!selectedOption && (
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
                    Swipe left or right!
                  </span>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Manual Fallback Buttons */}
        {!isChecked && (
          <div className="flex gap-4.5 w-full justify-center">
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96, y: 1 }}
              onClick={() => selectManual('false')}
              className={`px-6 py-3.5 rounded-full border-2 font-black uppercase tracking-wider text-xs transition-all cursor-pointer ${
                selectedOption === 'false' 
                  ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-[0_5px_0_#fecdd3] ring-4 ring-rose-100' 
                  : 'bg-white border-slate-100 text-rose-500 hover:text-rose-600 shadow-[0_5px_0_#fbcfe8]'
              }`}
            >
              ◀ False
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96, y: 1 }}
              onClick={() => selectManual('true')}
              className={`px-6 py-3.5 rounded-full border-2 font-black uppercase tracking-wider text-xs transition-all cursor-pointer ${
                selectedOption === 'true' 
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-[0_5px_0_#a7f3d0] ring-4 ring-emerald-100' 
                  : 'bg-white border-slate-100 text-emerald-550 hover:text-emerald-600 shadow-[0_5px_0_#a7f3d0]'
              }`}
            >
              True ▶
            </motion.button>
          </div>
        )}

        {/* Correct answer display when checked */}
        {isChecked && (
          <div className={`p-4 rounded-2xl w-full text-center text-xs font-black border uppercase tracking-wider ${
            selectedOption === correctAnswer 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            Correct Answer: <span className="underline font-black">{correctAnswer}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// C11 — Image Classification
// ==========================================
interface C11ImageClassificationProps {
  items: { id: string; text: string; imageUrl?: string; correct_bucket: string }[];
  buckets: { id: string; label: string }[];
  isChecked: boolean;
  onSelect: (assignments: { [itemId: string]: string }) => void;
}

export function C11ImageClassification({ items, buckets, isChecked, onSelect }: C11ImageClassificationProps) {
  const [assignments, setAssignments] = useState<{ [itemId: string]: string }>({});
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  useEffect(() => {
    if (items.length > 0 && Object.keys(assignments).length === 0) {
      const unassigned = items.find(item => !assignments[item.id]);
      if (unassigned) setActiveItemId(unassigned.id);
    }
  }, [items, assignments]);

  const selectBucket = (bucketId: string) => {
    if (isChecked || !activeItemId) return;
    const next = { ...assignments, [activeItemId]: bucketId };
    setAssignments(next);
    onSelect(next);
    soundManager.play('click');

    const nextUnassigned = items.find(item => item.id !== activeItemId && !next[item.id]);
    if (nextUnassigned) {
      setActiveItemId(nextUnassigned.id);
    } else {
      setActiveItemId(null);
    }
  };

  const resetAssignment = (itemId: string) => {
    if (isChecked) return;
    const next = { ...assignments };
    delete next[itemId];
    setAssignments(next);
    onSelect(next);
    setActiveItemId(itemId);
    soundManager.play('click');
  };

  const currentItem = items.find(item => item.id === activeItemId);

  // Compute correctness internally for the wrapper
  const isCorrect = Object.keys(assignments).length === items.length && 
                    items.every(item => assignments[item.id] === item.correct_bucket);

  return (
    <div className="w-full">
      <div className="space-y-6 max-w-md mx-auto w-full">
        {/* Target Items Panel */}
        <div className="flex flex-col items-center justify-center p-6 bg-white border border-slate-100 rounded-[2.2rem] shadow-[0_15px_40px_rgba(0,0,0,0.03)] min-h-48 relative">
          <AnimatePresence mode="wait">
            {currentItem ? (
              <motion.div
                key={currentItem.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center text-center space-y-3.5 w-full"
              >
                {currentItem.imageUrl ? (
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-50 border border-slate-150 p-1 shadow-sm">
                    <img src={currentItem.imageUrl} alt={currentItem.text} className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-400 shadow-inner">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                <h4 className="font-bold text-sm sm:text-base text-slate-800 uppercase tracking-wide">{currentItem.text}</h4>
                <span className="text-[10px] font-black text-pink-600 uppercase tracking-widest bg-pink-50 border border-pink-100 px-3 py-1 rounded-full animate-pulse">
                  Assign Category below
                </span>
              </motion.div>
            ) : (
              <div className="text-center py-6">
                <Check className="w-10 h-10 text-emerald-500 mx-auto mb-2.5 animate-bounce" />
                <p className="text-xs font-black text-emerald-600 uppercase tracking-wide">All items assigned!</p>
                <p className="text-[10px] font-black text-slate-400 mt-1 uppercase">Click Check Answer to continue.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Categories / Buckets */}
        <div className="grid grid-cols-2 gap-4">
          {buckets.map(bucket => {
            const assigned = items.filter(item => assignments[item.id] === bucket.id);

            return (
              <motion.button
                key={bucket.id}
                disabled={isChecked || !activeItemId}
                onClick={() => selectBucket(bucket.id)}
                whileHover={activeItemId && !isChecked ? { scale: 1.025, y: -2 } : {}}
                className={`p-4.5 rounded-[2.2rem] border transition-all min-h-[120px] cursor-pointer text-left flex flex-col justify-between ${
                  activeItemId && !isChecked
                    ? 'border-pink-200 bg-white hover:border-pink-400 hover:bg-pink-50/10 shadow-[0_5px_0_#fbcfe8]' 
                    : 'border-slate-100 bg-slate-50/50 opacity-90'
                }`}
              >
                <div className="font-black text-xs text-slate-700 border-b border-slate-150 pb-1.5 w-full uppercase tracking-wider flex items-center gap-1.5">
                  📁 {bucket.label}
                </div>
                
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {assigned.map(item => {
                    const isCorrectItem = isChecked && item.correct_bucket === bucket.id;
                    return (
                      <span
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          resetAssignment(item.id);
                        }}
                        className={`text-[10px] font-bold px-2 py-1 rounded-xl border flex items-center gap-1 cursor-pointer transition-all ${
                          isChecked 
                            ? isCorrectItem 
                              ? 'bg-emerald-550 border-emerald-200 text-emerald-700' 
                              : 'bg-rose-50 border-rose-200 text-rose-700'
                            : 'bg-pink-50 border-pink-100 text-pink-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                        }`}
                      >
                        {item.text}
                        {!isChecked && <X className="w-2.5 h-2.5 text-pink-400" />}
                      </span>
                    );
                  })}
                  {assigned.length === 0 && (
                    <span className="text-[9px] font-black text-slate-400/40 uppercase tracking-widest italic pt-2">Empty bucket</span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// C12 — Label Diagram
// ==========================================
interface C12LabelDiagramProps {
  imageUrl: string;
  hotspots: { id: string; label: string; x: number; y: number; correct_bucket: string }[];
  items: { id: string; text: string }[]; // Words / Chips
  isChecked: boolean;
  onSelect: (assignments: { [hotspotId: string]: string }) => void;
}

export function C12LabelDiagram({ imageUrl, hotspots, items, isChecked, onSelect }: C12LabelDiagramProps) {
  const [assignments, setAssignments] = useState<{ [hotspotId: string]: string }>({});
  const [selectedChipId, setSelectedChipId] = useState<string | null>(null);

  const handleSlotClick = (hotspotId: string) => {
    if (isChecked) return;
    if (!selectedChipId) {
      if (assignments[hotspotId]) {
        const next = { ...assignments };
        delete next[hotspotId];
        setAssignments(next);
        onSelect(next);
        soundManager.play('click');
      }
      return;
    }

    const next = { ...assignments, [hotspotId]: selectedChipId };
    setAssignments(next);
    onSelect(next);
    setSelectedChipId(null);
    soundManager.play('click');
  };

  const handleChipClick = (chipId: string) => {
    if (isChecked) return;
    const currentSlot = Object.keys(assignments).find(k => assignments[k] === chipId);
    if (currentSlot) {
      const next = { ...assignments };
      delete next[currentSlot];
      setAssignments(next);
      onSelect(next);
    }

    setSelectedChipId(selectedChipId === chipId ? null : chipId);
    soundManager.play('click');
  };

  // Compute correctness internally for the wrapper
  const isCorrect = hotspots.every(h => assignments[h.id] === h.correct_bucket);

  return (
    <div className="w-full">
      <div className="space-y-6 max-w-md mx-auto w-full">
        {/* Image with Drop Zones */}
        <div className="relative w-full aspect-video rounded-[2.2rem] overflow-hidden bg-slate-50 border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.04)]">
          <img src={imageUrl} alt="Diagram" className="w-full h-full object-cover select-none opacity-90" referrerPolicy="no-referrer" />
          
          {hotspots.map(h => {
            const assignedChipId = assignments[h.id];
            const assignedChip = items.find(i => i.id === assignedChipId);
            const isCorrectSpot = isChecked && h.correct_bucket === assignedChipId;

            return (
              <button
                key={h.id}
                onClick={() => handleSlotClick(h.id)}
                style={{ top: `${h.y}%`, left: `${h.x}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 min-w-[75px] rounded-2xl border text-center text-[10px] font-bold shadow-md transition-all cursor-pointer ${
                  assignedChip 
                    ? isChecked 
                      ? isCorrectSpot 
                        ? 'bg-emerald-50 border-2 border-emerald-400 text-emerald-900 ring-4 ring-emerald-100 font-black' 
                        : 'bg-rose-50 border-2 border-rose-400 text-rose-900 ring-4 ring-rose-100 font-black animate-shake'
                      : 'bg-purple-500 border border-purple-400 text-white font-black'
                    : 'bg-white/95 backdrop-blur-sm border-2 border-dashed border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700 scale-100 hover:scale-105'
                }`}
              >
                {assignedChip ? assignedChip.text : '?'}
              </button>
            );
          })}
        </div>

        {/* Label Chips Underneath */}
        <div className="flex flex-wrap gap-2.5 justify-center p-5 bg-white rounded-[2.2rem] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
          {items.map(chip => {
            const isAssigned = Object.values(assignments).includes(chip.id);
            const isSelected = selectedChipId === chip.id;

            return (
              <motion.button
                key={chip.id}
                disabled={isChecked}
                onClick={() => handleChipClick(chip.id)}
                whileHover={!isChecked && !isAssigned ? { scale: 1.025, y: -1 } : {}}
                whileTap={!isChecked && !isAssigned ? { scale: 0.975, y: 1 } : {}}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                  isAssigned 
                    ? 'bg-slate-50 border-slate-150 text-slate-350 line-through opacity-30 pointer-events-none' 
                    : isSelected 
                      ? 'bg-purple-50 border-2.5 border-purple-400 text-purple-950 shadow-[0_4px_0_#e9d5ff] ring-4 ring-purple-100/50 scale-105' 
                      : 'bg-white border-2 border-slate-200 text-slate-750 hover:border-purple-300 hover:text-slate-950 shadow-[0_4px_0_#f1f5f9]'
                }`}
              >
                {chip.text}
              </motion.button>
            );
          })}
        </div>
        {!isChecked && (
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <div className="w-8 h-0.5 bg-slate-200" />
            <p className="text-[10px] font-black uppercase tracking-widest">
              Tap a chip, then click corresponding ? on image
            </p>
            <div className="w-8 h-0.5 bg-slate-200" />
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// C13 — Hotspot Question
// ==========================================
interface C13HotspotQuestionProps {
  imageUrl: string;
  hotspots: { id: string; isCorrectSpot: boolean; x: number; y: number; radius?: number; description?: string }[];
  isChecked: boolean;
  isCorrect: boolean;
  onSelect: (selectedId: string) => void;
  selectedOption: string | null;
}

export function C13HotspotQuestion({ 
  imageUrl, 
  hotspots, 
  isChecked, 
  isCorrect,
  onSelect, 
  selectedOption 
}: C13HotspotQuestionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [clickCoords, setClickCoords] = useState<{ x: number; y: number } | null>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isChecked || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    setClickCoords({ x: clickX, y: clickY });

    // Check if clicked near any hotspot
    let closestHotspot: typeof hotspots[0] | null = null;
    let minDistance = 15; 

    hotspots.forEach(h => {
      const distance = Math.sqrt(Math.pow(h.x - clickX, 2) + Math.pow(h.y - clickY, 2));
      if (distance < minDistance) {
        minDistance = distance;
        closestHotspot = h;
      }
    });

    if (closestHotspot) {
      onSelect((closestHotspot as typeof hotspots[0]).id);
      soundManager.play('click');
    } else {
      onSelect('missed');
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-4 max-w-md mx-auto w-full">
        <div 
          ref={containerRef}
          onClick={handleImageClick}
          className="relative w-full aspect-video rounded-[2.2rem] overflow-hidden bg-slate-50 border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.04)] cursor-crosshair select-none"
        >
          <img src={imageUrl} alt="Hotspot Target" className="w-full h-full object-cover opacity-90" referrerPolicy="no-referrer" />

          {/* Dynamic click ripple */}
          {clickCoords && (
            <motion.div
              key={`${clickCoords.x}-${clickCoords.y}`}
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 0.6 }}
              style={{ top: `${clickCoords.y}%`, left: `${clickCoords.x}%` }}
              className="absolute w-6 h-6 rounded-full border border-amber-400 bg-amber-500/20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            />
          )}

          {/* Selected / Correct Spot Highlights */}
          {hotspots.map(h => {
            const isSelected = selectedOption === h.id;
            if (!isSelected && !(isChecked && h.isCorrectSpot)) return null;

            return (
              <motion.div
                key={h.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ top: `${h.y}%`, left: `${h.x}%` }}
                className={`absolute w-12 h-12 rounded-full border-3 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center ${
                  isChecked 
                    ? h.isCorrectSpot 
                      ? 'border-emerald-500 bg-emerald-500/15 ring-4 ring-emerald-500/25' 
                      : 'border-rose-500 bg-rose-500/15 ring-4 ring-rose-500/25'
                    : 'border-amber-400 bg-amber-500/15 animate-pulse ring-4 ring-amber-400/20'
                }`}
              >
                {isChecked ? (
                  h.isCorrectSpot ? (
                    <Check className="w-5 h-5 text-emerald-600 drop-shadow-sm font-black" />
                  ) : (
                    <X className="w-5 h-5 text-rose-600 drop-shadow-sm font-black" />
                  )
                ) : (
                  <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
                )}
              </motion.div>
            );
          })}
        </div>
        {!isChecked && (
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <div className="w-8 h-0.5 bg-slate-200" />
            <p className="text-[10px] font-black uppercase tracking-widest">
              Tap directly on the correct image area
            </p>
            <div className="w-8 h-0.5 bg-slate-200" />
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// C15 — Drag to Complete Diagram
// ==========================================
interface C15DragToCompleteDiagramProps {
  steps: { id: string; text: string; isMissing?: boolean }[];
  options: string[];
  correctAnswer: string;
  isChecked: boolean;
  isCorrect: boolean;
  onSelect: (selected: string) => void;
  selectedOption: string | null;
}

export function C15DragToCompleteDiagram({ 
  steps, 
  options, 
  correctAnswer, 
  isChecked, 
  isCorrect,
  onSelect, 
  selectedOption 
}: C15DragToCompleteDiagramProps) {
  
  return (
    <div className="w-full">
      <div className="space-y-6 max-w-md mx-auto w-full">
        {/* Diagram flow */}
        <div className="flex flex-col items-center p-6 bg-white border border-slate-100 rounded-[2.2rem] space-y-4 shadow-[0_15px_40px_rgba(0,0,0,0.03)]">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex flex-col items-center w-full">
              {idx > 0 && (
                <div className="text-purple-400 font-black text-xl my-0.5 animate-bounce">
                  ↓
                </div>
              )}
              
              {step.isMissing ? (
                <motion.div 
                  animate={selectedOption ? { scale: [1, 1.03, 1] } : {}}
                  className={`w-full max-w-xs p-4 rounded-2xl border text-center transition-all ${
                    selectedOption 
                      ? isChecked 
                        ? selectedOption === correctAnswer
                          ? 'bg-emerald-50 border-2 border-emerald-400 text-emerald-900 ring-4 ring-emerald-100 font-black shadow-sm' 
                          : 'bg-rose-50 border-2 border-rose-400 text-rose-900 ring-4 ring-rose-100 font-black animate-shake shadow-sm'
                        : 'bg-purple-50 border-2.5 border-purple-400 text-purple-950 font-black shadow-[0_4px_0_#e9d5ff] ring-4 ring-purple-100'
                      : 'border-2 border-dashed border-purple-200 text-purple-400 bg-purple-50/20'
                  }`}
                >
                  {selectedOption ? (
                    <span className="text-sm uppercase tracking-wider font-black">{selectedOption}</span>
                  ) : (
                    <span className="text-xs font-black uppercase tracking-widest italic animate-pulse">Tap options below</span>
                  )}
                </motion.div>
              ) : (
                <div className="w-full max-w-xs p-4 bg-white border border-slate-150 rounded-2xl text-center shadow-sm">
                  <span className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">{step.text}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Options Panel */}
        <div className="flex flex-wrap gap-2.5 justify-center">
          {options.map((opt, idx) => {
            const isSelected = selectedOption === opt;
            const optKey = typeof opt === 'string' ? opt.replace(/\s+/g, '_').slice(0, 20) : idx;
            return (
              <motion.button
                key={`c15-opt-${idx}-${optKey}`}
                disabled={isChecked}
                onClick={() => {
                  onSelect(opt);
                  soundManager.play('click');
                }}
                whileHover={!isChecked ? { scale: 1.025, y: -1 } : {}}
                whileTap={!isChecked ? { scale: 0.975, y: 1 } : {}}
                className={`px-5 py-2.5 rounded-2xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-purple-50 border-2.5 border-purple-400 text-purple-950 shadow-[0_4px_0_#e9d5ff] ring-4 ring-purple-100/50 scale-105' 
                    : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-purple-300 hover:text-slate-950 shadow-[0_4px_0_#f1f5f9]'
                }`}
              >
                {opt}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// C16 — Eliminate Wrong Answers
// ==========================================
interface C16EliminateWrongAnswersProps {
  question: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  isChecked: boolean;
  onSelect: (isAllWrongEliminated: boolean) => void;
}

export function C16EliminateWrongAnswers({ options, isChecked, onSelect }: C16EliminateWrongAnswersProps) {
  const [eliminatedIds, setEliminatedIds] = useState<string[]>([]);

  const handleToggle = (id: string) => {
    if (isChecked) return;
    const next = eliminatedIds.includes(id) 
      ? eliminatedIds.filter(i => i !== id) 
      : [...eliminatedIds, id];
    setEliminatedIds(next);
    soundManager.play('pop');
  };

  useEffect(() => {
    const wrongAnswers = options.filter(o => !o.isCorrect).map(o => o.id);
    const correctAnswers = options.filter(o => o.isCorrect).map(o => o.id);
    
    const allWrongEliminated = wrongAnswers.every(id => eliminatedIds.includes(id));
    const noCorrectEliminated = correctAnswers.every(id => !eliminatedIds.includes(id));
    
    onSelect(allWrongEliminated && noCorrectEliminated);
  }, [eliminatedIds, options, onSelect]);

  const wrongAnswers = options.filter(o => !o.isCorrect).map(o => o.id);
  const correctAnswers = options.filter(o => o.isCorrect).map(o => o.id);
  const isCorrect = wrongAnswers.every(id => eliminatedIds.includes(id)) && 
                    correctAnswers.every(id => !eliminatedIds.includes(id));

  return (
    <div className="w-full">
      <div className="space-y-4 max-w-md mx-auto w-full">
        <div className="text-center text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
          Discard/eliminate the incorrect options
        </div>

        <div className="grid grid-cols-1 gap-3">
          {options.map((opt) => {
            const isEliminated = eliminatedIds.includes(opt.id);
            
            let cardStyle = "bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-rose-350 hover:text-slate-950 shadow-[0_5px_0_#f1f5f9]";
            if (isEliminated) {
              cardStyle = "bg-rose-50/50 border border-rose-200 text-rose-500/45 line-through shadow-none translate-y-1 scale-95 opacity-50";
            }

            if (isChecked) {
              if (opt.isCorrect) {
                cardStyle = "bg-emerald-50 border-2 border-emerald-400 text-emerald-900 shadow-[0_5px_0_#a7f3d0] ring-4 ring-emerald-100 font-bold";
              } else if (isEliminated) {
                cardStyle = "bg-slate-50 border border-slate-150 text-slate-400 opacity-20 line-through shadow-none";
              } else {
                cardStyle = "bg-rose-50 border-2 border-rose-400 text-rose-900 shadow-[0_5px_0_#fecdd3] ring-4 ring-rose-100 font-bold";
              }
            }

            return (
              <motion.button
                key={opt.id}
                disabled={isChecked}
                onClick={() => handleToggle(opt.id)}
                whileHover={!isChecked && !isEliminated ? { scale: 1.015, y: -1 } : {}}
                whileTap={!isChecked ? { scale: 0.985, y: 1 } : {}}
                className={`w-full text-left p-4.5 rounded-[1.8rem] border flex items-center justify-between transition-all cursor-pointer ${cardStyle}`}
              >
                <span className="font-bold text-xs sm:text-sm uppercase tracking-wide leading-relaxed text-slate-800">{opt.text}</span>
                
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center border shrink-0 ${
                  isEliminated 
                    ? 'bg-rose-500 border-rose-400 text-white shadow-sm' 
                    : 'border-slate-250 text-transparent'
                } ${isChecked && opt.isCorrect ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm' : ''}`}>
                  {isEliminated ? (
                    <Trash2 className="w-3.5 h-3.5" />
                  ) : isChecked && opt.isCorrect ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <span className="text-[10px] font-black text-rose-350">✕</span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// C17 — Arrange Images
// ==========================================
interface C17ArrangeImagesProps {
  items: { id: string; imageUrl: string; caption?: string }[];
  correctOrder: string[];
  isChecked: boolean;
  onSelect: (orderedIds: string[]) => void;
}

export function C17ArrangeImages({ items, correctOrder, isChecked, onSelect }: C17ArrangeImagesProps) {
  const [list, setList] = useState<typeof items>([]);

  useEffect(() => {
    if (items.length > 0 && list.length === 0) {
      setList([...items].sort(() => Math.random() - 0.5));
    }
  }, [items, list.length]);

  useEffect(() => {
    if (list.length > 0) {
      onSelect(list.map(i => i.id));
    }
  }, [list, onSelect]);

  const moveLeft = (idx: number) => {
    if (isChecked || idx === 0) return;
    const next = [...list];
    const temp = next[idx];
    next[idx] = next[idx - 1];
    next[idx - 1] = temp;
    setList(next);
    soundManager.play('click');
  };

  const moveRight = (idx: number) => {
    if (isChecked || idx === list.length - 1) return;
    const next = [...list];
    const temp = next[idx];
    next[idx] = next[idx + 1];
    next[idx + 1] = temp;
    setList(next);
    soundManager.play('click');
  };

  const isCorrect = list.length === correctOrder.length &&
                    list.every((item, idx) => item.id === correctOrder[idx]);

  return (
    <div className="w-full">
      <div className="space-y-6 max-w-md mx-auto w-full">
        <div className="text-center text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
          Put the frames in the correct order
        </div>

        <div className="grid grid-cols-2 gap-4.5">
          {list.map((item, idx) => {
            const isCorrectPos = isChecked && item.id === correctOrder[idx];
            
            let frameStyle = "bg-white border-2 border-slate-200 p-3.5 rounded-[2.2rem] shadow-[0_12px_30px_rgba(0,0,0,0.03)]";
            if (isChecked) {
              frameStyle = isCorrectPos 
                ? "bg-emerald-50 border-2 border-emerald-400 p-3.5 rounded-[2.2rem] shadow-sm ring-4 ring-emerald-100/50" 
                : "bg-rose-50 border-2 border-rose-400 p-3.5 rounded-[2.2rem] shadow-sm ring-4 ring-rose-100/50";
            }

            return (
              <div key={item.id} className={`flex flex-col items-center space-y-2.5 transition-all ${frameStyle}`}>
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-150 p-0.5 shadow-inner">
                  <img src={item.imageUrl} alt="Ordering Frame" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                  
                  {/* Index badge */}
                  <div className={`absolute top-2 left-2 flex items-center justify-center w-6 h-6 rounded-lg text-[9px] font-black border ${
                    isChecked 
                      ? isCorrectPos 
                        ? 'bg-emerald-500 border-emerald-400 text-white' 
                        : 'bg-rose-500 border-rose-400 text-white'
                      : 'bg-amber-50 border border-amber-200 text-amber-700 shadow-sm'
                  }`}>
                    {idx + 1}
                  </div>
                </div>
                
                {item.caption && (
                  <p className="text-[10px] text-center font-bold text-slate-600 truncate w-full uppercase tracking-wider">
                    {item.caption}
                  </p>
                )}

                {!isChecked && (
                  <div className="flex gap-2 w-full justify-center pt-0.5">
                    <motion.button
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => moveLeft(idx)}
                      disabled={idx === 0}
                      className="w-8 h-8 flex items-center justify-center border border-slate-200 bg-white hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 text-slate-550 rounded-xl text-xs font-black disabled:opacity-20 cursor-pointer shadow-sm"
                    >
                      ◀
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => moveRight(idx)}
                      disabled={idx === list.length - 1}
                      className="w-8 h-8 flex items-center justify-center border border-slate-200 bg-white hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 text-slate-550 rounded-xl text-xs font-black disabled:opacity-20 cursor-pointer shadow-sm"
                    >
                      ▶
                    </motion.button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// C18 — Audio Quiz
// ==========================================
interface C18AudioQuizProps {
  audioUrl?: string;
  options: string[];
  correctAnswer: string;
  isChecked: boolean;
  isCorrect: boolean;
  onSelect: (selected: string) => void;
  selectedOption: string | null;
}

export function C18AudioQuiz({ 
  audioUrl,
  options, 
  correctAnswer, 
  isChecked, 
  isCorrect,
  onSelect, 
  selectedOption 
}: C18AudioQuizProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioTimerRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
      }
      return;
    }
    
    setIsPlaying(true);

    if (audioUrl) {
      try {
        if (!audioElementRef.current || audioElementRef.current.src !== audioUrl) {
          audioElementRef.current = new Audio(audioUrl);
          audioElementRef.current.addEventListener('ended', () => {
            setIsPlaying(false);
          });
          audioElementRef.current.addEventListener('error', () => {
            setIsPlaying(false);
            soundManager.play('pop');
          });
        }
        audioElementRef.current.currentTime = 0;
        audioElementRef.current.play().catch(() => {
          soundManager.play('pop');
          audioTimerRef.current = setTimeout(() => {
            setIsPlaying(false);
          }, 3500);
        });
        return;
      } catch {
        // fallback to synth
      }
    }

    soundManager.play('pop');
    audioTimerRef.current = setTimeout(() => {
      setIsPlaying(false);
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
    };
  }, [audioUrl]);

  return (
    <div className="w-full">
      <div className="space-y-6 max-w-md mx-auto w-full">
        {/* Audio Dashboard widget */}
        <div className="flex flex-col items-center p-6 bg-white border border-slate-100 rounded-[2.2rem] text-center space-y-4 shadow-[0_15px_40px_rgba(0,0,0,0.03)]">
          {/* Play trigger button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlay}
            className={`w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all ${
              isPlaying ? 'bg-sky-500 shadow-md ring-4 ring-sky-100 text-white' : 'bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700 shadow-sm'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white fill-white stroke-[2.5px]" />
            ) : (
              <Play className="w-6 h-6 text-sky-600 fill-sky-600 ml-0.5 stroke-[2.5px]" />
            )}
          </motion.button>

          <div className="space-y-1 select-none">
            <h4 className="text-slate-800 font-bold text-sm uppercase tracking-wider flex items-center gap-1.5 justify-center">
              <Volume2 className="w-4 h-4 text-sky-500" />
              Listening Quiz
            </h4>
            <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wide">Tap play to hear the clue!</p>
          </div>

          {/* Animated Sound Waveforms */}
          <div className="flex items-center gap-1 h-8 py-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <motion.div
                key={`wave-bar-${i}`}
                animate={
                  isPlaying 
                    ? { height: [8, 24, 8] } 
                    : { height: 8 }
                }
                transition={{
                  duration: 0.5 + (i * 0.04),
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                style={{ width: '4px' }}
                className="bg-sky-400 rounded-full"
              />
            ))}
          </div>
        </div>

        {/* Answer options */}
        <div className="grid grid-cols-1 gap-3">
          {options.map((opt, idx) => {
            const isSelected = selectedOption === opt;
            const isCorrectOption = opt === correctAnswer;

            let optionStyle = "bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-sky-350 hover:text-slate-950 shadow-[0_5px_0_#f1f5f9]";
            if (isSelected) {
              optionStyle = "bg-sky-50 border-2.5 border-sky-400 text-sky-950 shadow-[0_5px_0_#bae6fd] ring-4 ring-sky-100/50 scale-105";
            }

            if (isChecked) {
              if (isCorrectOption) {
                optionStyle = "bg-emerald-50 border-2 border-emerald-400 text-emerald-900 shadow-[0_5px_0_#a7f3d0] ring-4 ring-emerald-100 font-bold";
              } else if (isSelected) {
                optionStyle = "bg-rose-50 border-2 border-rose-400 text-rose-900 shadow-[0_5px_0_#fecdd3] ring-4 ring-rose-100 font-bold animate-shake";
              } else {
                optionStyle = "bg-slate-50 border border-slate-150 text-slate-400 shadow-none opacity-20 pointer-events-none scale-95";
              }
            }

            const optKey = typeof opt === 'string' ? opt.replace(/\s+/g, '_').slice(0, 20) : idx;
            return (
              <motion.button
                key={`audio-opt-${idx}-${optKey}`}
                disabled={isChecked}
                onClick={() => {
                  onSelect(opt);
                  soundManager.play('click');
                }}
                whileHover={!isChecked ? { scale: 1.015, y: -1 } : {}}
                whileTap={!isChecked ? { scale: 0.985, y: 1 } : {}}
                className={`w-full text-left p-4.5 rounded-[1.8rem] border transition-all cursor-pointer font-bold text-xs sm:text-sm uppercase tracking-wide flex items-center justify-between ${optionStyle}`}
              >
                <span>{opt}</span>
                {isChecked && isCorrectOption && <Check className="w-4 h-4 text-emerald-600 stroke-[3.5px]" />}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
