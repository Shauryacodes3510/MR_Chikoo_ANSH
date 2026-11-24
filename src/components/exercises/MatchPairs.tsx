import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { soundManager } from '../../lib/sounds';

interface Pair {
  left?: string;
  right?: string;
  concept?: string;
  definition?: string;
  term?: string;
  item1?: string;
  item2?: string;
  tool?: string;
  useCase?: string;
  question?: string;
  answer?: string;
  [key: string]: any;
}

interface MatchPairsProps {
  pairs: Pair[];
  isChecked: boolean;
  onSelect: (isComplete: boolean) => void;
}

export default function MatchPairs({ pairs, isChecked, onSelect }: MatchPairsProps) {
  const [leftSelected, setLeftSelected] = useState<string | null>(null);
  const [rightSelected, setRightSelected] = useState<string | null>(null);
  const [matchedLeft, setMatchedLeft] = useState<string[]>([]);
  const [failedLeft, setFailedLeft] = useState<string[]>([]);
  const [failedRight, setFailedRight] = useState<string[]>([]);
  const [shuffledRight, setShuffledRight] = useState<string[]>([]);

  // 1. Normalize pairs safely regardless of property naming or leading/trailing whitespace
  const normalizedPairs = useMemo(() => {
    if (!pairs || !Array.isArray(pairs)) return [];
    return pairs
      .map(p => {
        if (!p) return null;
        if (typeof p === 'string') return { left: String(p).trim(), right: String(p).trim() };
        const leftVal = p.left ?? p.concept ?? p.term ?? p.item1 ?? p.tool ?? p.question ?? p.name ?? '';
        const rightVal = p.right ?? p.definition ?? p.description ?? p.item2 ?? p.useCase ?? p.answer ?? p.text ?? '';
        return {
          left: String(leftVal).trim(),
          right: String(rightVal).trim()
        };
      })
      .filter((p): p is { left: string; right: string } => Boolean(p && p.left && p.right));
  }, [pairs]);

  // 2. Shuffle right items when normalizedPairs change
  useEffect(() => {
    if (normalizedPairs.length > 0) {
      const rights = normalizedPairs.map(p => p.right);
      // Fisher-Yates shuffle
      const arr = [...rights];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      setShuffledRight(arr);
    } else {
      setShuffledRight([]);
    }
    setMatchedLeft([]);
    setLeftSelected(null);
    setRightSelected(null);
    setFailedLeft([]);
    setFailedRight([]);
  }, [normalizedPairs]);

  const handleLeftClick = (val: string) => {
    if (isChecked) return;
    if (matchedLeft.includes(val)) return;

    soundManager.play('click');

    // Toggle unselect if clicking the same option
    if (leftSelected === val) {
      setLeftSelected(null);
      return;
    }

    setLeftSelected(val);

    if (rightSelected) {
      checkMatch(val, rightSelected);
    }
  };

  const handleRightClick = (val: string) => {
    if (isChecked) return;

    // Check if this right item belongs to an already matched left item
    const isMatched = matchedLeft.some(l => {
      const pair = normalizedPairs.find(p => p.left === l);
      return pair && pair.right === val;
    });
    if (isMatched) return;

    soundManager.play('click');

    // Toggle unselect if clicking the same option
    if (rightSelected === val) {
      setRightSelected(null);
      return;
    }

    setRightSelected(val);

    if (leftSelected) {
      checkMatch(leftSelected, val);
    }
  };

  const checkMatch = (leftVal: string, rightVal: string) => {
    // Case-insensitive trimmed pair lookup
    const pair = normalizedPairs.find(p => p.left.toLowerCase() === leftVal.toLowerCase());
    const isMatch = pair && pair.right.toLowerCase() === rightVal.toLowerCase();

    if (isMatch) {
      soundManager.play('correct');
      const newMatched = [...matchedLeft, leftVal];
      setMatchedLeft(newMatched);
      setLeftSelected(null);
      setRightSelected(null);

      const isComplete = newMatched.length === normalizedPairs.length;
      onSelect(isComplete);
    } else {
      soundManager.play('incorrect');
      setFailedLeft([leftVal]);
      setFailedRight([rightVal]);
      setLeftSelected(null);
      setRightSelected(null);

      // Temporary wrong flash for 800ms, then let the user retry matching!
      setTimeout(() => {
        setFailedLeft([]);
        setFailedRight([]);
      }, 800);
    }
  };

  if (normalizedPairs.length === 0) {
    return (
      <div className="w-full text-center py-6 text-sm text-slate-400 font-bold">
        No matching pairs available for this concept.
      </div>
    );
  }

  return (
    <div className="w-full select-none">
      <div className="space-y-6 w-full max-w-xl mx-auto">
        <div className="text-center text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
          Match Left Items with Right Definitions
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-5.5">
          {/* Left Column (Concepts / Terms) */}
          <div className="space-y-3.5">
            {normalizedPairs.map((pair, idx) => {
              const isMatched = matchedLeft.includes(pair.left);
              const isFailed = failedLeft.includes(pair.left);
              const isSelected = leftSelected === pair.left;

              let visualStyle = 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-orange-400 hover:text-slate-950 shadow-[0_6px_0_#f1f5f9]';
              if (isMatched) {
                visualStyle = 'bg-emerald-50 border-2.5 border-emerald-400 text-emerald-900 shadow-[0_6px_0_#a7f3d0] ring-4 ring-emerald-100 opacity-90';
              } else if (isFailed) {
                visualStyle = 'bg-rose-50 border-2.5 border-rose-400 text-rose-900 shadow-[0_6px_0_#fecdd3] ring-4 ring-rose-100 animate-shake';
              } else if (isSelected) {
                visualStyle = 'bg-orange-50 border-2.5 border-orange-500 text-orange-900 shadow-[0_6px_0_#fed7aa] ring-4 ring-orange-100 -translate-y-1';
              }

              return (
                <motion.button
                  key={`pair-left-${idx}-${pair.left}`}
                  whileHover={!isChecked && !isMatched ? { scale: 1.02, y: -2 } : {}}
                  whileTap={!isChecked && !isMatched ? { scale: 0.98, y: 1 } : {}}
                  onClick={() => handleLeftClick(pair.left)}
                  disabled={isChecked || isMatched}
                  className={`w-full p-4 sm:p-5 rounded-[2rem] font-display font-black text-xs sm:text-sm transition-all relative flex items-center justify-center gap-2 cursor-pointer min-h-[84px] text-center ${visualStyle}`}
                >
                  <span className="leading-snug font-bold tracking-wide text-slate-800">{pair.left}</span>
                  {isMatched && <Check size={18} className="text-emerald-600 absolute right-3 sm:right-4 shrink-0" strokeWidth={3.5} />}
                  {isFailed && <X size={18} className="text-rose-600 absolute right-3 sm:right-4 shrink-0" strokeWidth={3.5} />}
                </motion.button>
              );
            })}
          </div>

          {/* Right Column (Definitions / Values) */}
          <div className="space-y-3.5">
            {shuffledRight.map((val, idx) => {
              const isMatched = matchedLeft.some(l => {
                const pair = normalizedPairs.find(p => p.left === l);
                return pair && pair.right === val;
              });
              const isFailed = failedRight.includes(val);
              const isSelected = rightSelected === val;

              let visualStyle = 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-orange-400 hover:text-slate-950 shadow-[0_6px_0_#f1f5f9]';
              if (isMatched) {
                visualStyle = 'bg-emerald-50 border-2.5 border-emerald-400 text-emerald-900 shadow-[0_6px_0_#a7f3d0] ring-4 ring-emerald-100 opacity-90';
              } else if (isFailed) {
                visualStyle = 'bg-rose-50 border-2.5 border-rose-400 text-rose-900 shadow-[0_6px_0_#fecdd3] ring-4 ring-rose-100 animate-shake';
              } else if (isSelected) {
                visualStyle = 'bg-orange-50 border-2.5 border-orange-500 text-orange-900 shadow-[0_6px_0_#fed7aa] ring-4 ring-orange-100 -translate-y-1';
              }

              return (
                <motion.button
                  key={`pair-right-${idx}-${val}`}
                  whileHover={!isChecked && !isMatched ? { scale: 1.02, y: -2 } : {}}
                  whileTap={!isChecked && !isMatched ? { scale: 0.98, y: 1 } : {}}
                  onClick={() => handleRightClick(val)}
                  disabled={isChecked || isMatched}
                  className={`w-full p-4 sm:p-5 rounded-[2rem] font-display font-black text-xs sm:text-sm transition-all relative flex items-center justify-center gap-2 cursor-pointer min-h-[84px] text-center ${visualStyle}`}
                >
                  <span className="leading-snug font-bold tracking-wide text-slate-800">{val}</span>
                  {isMatched && <Check size={18} className="text-emerald-600 absolute right-3 sm:right-4 shrink-0" strokeWidth={3.5} />}
                  {isFailed && <X size={18} className="text-rose-600 absolute right-3 sm:right-4 shrink-0" strokeWidth={3.5} />}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
