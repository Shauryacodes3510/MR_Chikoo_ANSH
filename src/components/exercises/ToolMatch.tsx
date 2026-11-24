import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface ToolMatchItem {
  tool: string;
  toolEmoji: string;
  useCase: string;
}

interface ToolMatchProps {
  toolMatch: {
    pairs: ToolMatchItem[];
  };
  isChecked: boolean;
  onSelect: (isComplete: any) => void;
}

export default function ToolMatch({ toolMatch, isChecked, onSelect }: ToolMatchProps) {
  const { pairs } = toolMatch;
  const [leftSelected, setLeftSelected] = useState<string | null>(null);
  const [rightSelected, setRightSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]); // stores tool names
  const [failedLeft, setFailedLeft] = useState<string[]>([]);
  const [failedRight, setFailedRight] = useState<string[]>([]);
  const [shuffledUseCases, setShuffledUseCases] = useState<string[]>([]);

  useEffect(() => {
    // Shuffling the useCases
    setShuffledUseCases([...pairs.map(p => p.useCase)].sort(() => Math.random() - 0.5));
  }, [pairs]);

  const handleLeftClick = (toolName: string) => {
    if (isChecked || matched.includes(toolName) || failedLeft.includes(toolName)) return;
    setLeftSelected(toolName);
    if (rightSelected) {
      checkMatch(toolName, rightSelected);
    }
  };

  const handleRightClick = (useCaseText: string) => {
    const isMatched = matched.some(tool => pairs.find(p => p.tool === tool)?.useCase === useCaseText);
    if (isChecked || isMatched || failedRight.includes(useCaseText)) return;
    setRightSelected(useCaseText);
    if (leftSelected) {
      checkMatch(leftSelected, useCaseText);
    }
  };

  const checkMatch = (toolName: string, useCaseText: string) => {
    const pair = pairs.find(p => p.tool === toolName);
    if (pair && pair.useCase === useCaseText) {
      const newMatched = [...matched, toolName];
      setMatched(newMatched);
      setLeftSelected(null);
      setRightSelected(null);
      if (newMatched.length === pairs.length) {
        onSelect(true);
      }
    } else {
      // Mark as failed - reset selection but add a small vibration/vibe-shake or failed flags
      setFailedLeft(prev => [...prev, toolName]);
      setFailedRight(prev => [...prev, useCaseText]);
      setLeftSelected(null);
      setRightSelected(null);

      // Reset failure after 1 second so students can try again
      setTimeout(() => {
        setFailedLeft(prev => prev.filter(t => t !== toolName));
        setFailedRight(prev => prev.filter(u => u !== useCaseText));
      }, 1200);
    }
  };

  return (
    <div className="flex flex-col space-y-5 w-full">
      <div className="text-center">
        <p className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>Match the AI tools with their primary capabilities!</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        {/* Left Side: Tools */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 text-center mb-1">
            AI Platform
          </h4>
          {pairs.map((pair, idx) => {
            const isMatched = matched.includes(pair.tool);
            const isFailed = failedLeft.includes(pair.tool);
            const isSelected = leftSelected === pair.tool;

            let cardClass = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-[0_4px_0_#cbd5e1]';
            if (isMatched) {
              cardClass = 'bg-green-50 border-emerald-500 text-emerald-800 shadow-[0_4px_0_#10b981] opacity-75';
            } else if (isFailed) {
              cardClass = 'bg-rose-50 border-rose-500 text-rose-800 animate-shake';
            } else if (isSelected) {
              cardClass = 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-[0_4px_0_#6366f1]';
            }

            return (
              <motion.button
                key={`tool-${idx}-${pair.tool}`}
                onClick={() => handleLeftClick(pair.tool)}
                whileHover={!isMatched && !isFailed ? { scale: 1.02 } : {}}
                whileTap={!isMatched && !isFailed ? { scale: 0.98 } : {}}
                className={`w-full p-4 rounded-xl font-display font-black text-xs text-left border-2 flex items-center gap-3 transition-all cursor-pointer ${cardClass}`}
              >
                <span className="text-xl bg-slate-50 p-1 rounded-md border border-slate-100 shrink-0">
                  {pair.toolEmoji}
                </span>
                <span className="truncate">{pair.tool}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Right Side: Use Cases */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 text-center mb-1">
            Primary Use Case
          </h4>
          {shuffledUseCases.map((useCase, idx) => {
            const isMatched = matched.some(t => pairs.find(p => p.tool === t)?.useCase === useCase);
            const isFailed = failedRight.includes(useCase);
            const isSelected = rightSelected === useCase;

            let cardClass = 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-[0_4px_0_#cbd5e1]';
            if (isMatched) {
              cardClass = 'bg-green-50 border-emerald-500 text-emerald-800 shadow-[0_4px_0_#10b981] opacity-75';
            } else if (isFailed) {
              cardClass = 'bg-rose-50 border-rose-500 text-rose-850 animate-shake';
            } else if (isSelected) {
              cardClass = 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-[0_4px_0_#6366f1]';
            }

            return (
              <motion.button
                key={`uc-${idx}-${useCase}`}
                onClick={() => handleRightClick(useCase)}
                whileHover={!isMatched && !isFailed ? { scale: 1.02 } : {}}
                whileTap={!isMatched && !isFailed ? { scale: 0.98 } : {}}
                className={`w-full p-4 rounded-xl font-display font-black text-xs text-left border-2 min-h-[58px] transition-all cursor-pointer flex items-center leading-tight ${cardClass}`}
              >
                {useCase}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
