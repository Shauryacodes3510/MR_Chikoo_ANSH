import React, { useState, useEffect, useCallback } from 'react';
import { Check, X } from 'lucide-react';
import { ArenaQuestion } from '../types/arena.types';

interface RaceQuestionTerminalProps {
  question: ArenaQuestion;
  timeLeft: number;
  totalTime: number;
  onSelectOption: (option: string, answerTime: number) => void;
  isAnswering: boolean;
  isOverdrive: boolean;
}

export function RaceQuestionTerminal({
  question,
  timeLeft,
  totalTime,
  onSelectOption,
  isAnswering,
}: RaceQuestionTerminalProps) {
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    setSelectedOpt(null);
    setHasSubmitted(false);
  }, [question.id]);

  const handleClick = useCallback(
    (opt: string) => {
      if (isAnswering || hasSubmitted) return;
      setSelectedOpt(opt);
      setHasSubmitted(true);
      const timeSpent = totalTime - timeLeft;
      onSelectOption(opt, timeSpent);
    },
    [isAnswering, hasSubmitted, totalTime, timeLeft, onSelectOption]
  );

  // Keyboard shortcuts (1-4 or A-D) for fast, responsive play
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isAnswering || hasSubmitted) return;
      const key = e.key.toLowerCase();
      const map: Record<string, number> = {
        '1': 0,
        '2': 1,
        '3': 2,
        '4': 3,
        a: 0,
        b: 1,
        c: 2,
        d: 3,
      };
      const idx = map[key];
      if (idx !== undefined && question.options[idx]) {
        e.preventDefault();
        handleClick(question.options[idx]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAnswering, hasSubmitted, question.options, handleClick]);

  const isTimeCritical = timeLeft <= 4;
  const timeRatio = Math.max(0, Math.min(1, timeLeft / Math.max(1, totalTime)));

  return (
    <div className="relative w-full flex flex-col bg-slate-900/80 border border-white/10 rounded-2xl overflow-hidden text-white select-none font-sans">
      {/* Slim Top Countdown Line */}
      <div className="w-full h-1 bg-white/10" aria-hidden="true">
        <div
          className={`h-full w-full origin-left transition-transform duration-1000 linear ${
            isTimeCritical
              ? 'bg-rose-400'
              : timeLeft <= 8
              ? 'bg-amber-400'
              : 'bg-sky-400'
          }`}
          style={{ transform: `scaleX(${timeRatio})` }}
        />
      </div>

      <div className="p-4 sm:p-5 flex flex-col gap-4">
        {/* Quiet Unboxed Meta Row: Topic & Remaining Seconds */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="font-medium text-slate-400 truncate">
            {question.category || 'AI Challenge'}
          </span>
          <span
            className={`font-semibold tabular-nums shrink-0 ${
              isTimeCritical ? 'text-rose-400' : 'text-slate-300'
            }`}
          >
            {timeLeft}s left
          </span>
        </div>

        {/* Clear Question Text */}
        <h2 className="text-base sm:text-lg font-semibold text-white leading-snug text-balance">
          {question.question}
        </h2>

        {/* Clean 4-Option Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {question.options.map((opt, idx) => {
            const isSelected = selectedOpt === opt;
            const isCorrect = opt === question.correctAnswer;
            const letter = String.fromCharCode(65 + idx);

            let optionClasses =
              'bg-slate-950/70 hover:bg-slate-800/80 border-white/10 hover:border-sky-400/50 text-slate-100';
            let letterClasses = 'text-slate-400';

            if (hasSubmitted) {
              if (isSelected && isCorrect) {
                optionClasses = 'bg-emerald-500/20 border-emerald-400 text-white';
                letterClasses = 'text-emerald-300';
              } else if (isSelected && !isCorrect) {
                optionClasses = 'bg-rose-500/20 border-rose-400 text-white';
                letterClasses = 'text-rose-300';
              } else if (isCorrect) {
                optionClasses = 'bg-emerald-500/10 border-emerald-400/50 text-emerald-100';
                letterClasses = 'text-emerald-300';
              } else {
                optionClasses = 'bg-slate-950/40 border-white/5 text-slate-400 opacity-45';
                letterClasses = 'text-slate-500';
              }
            }

            return (
              <button
                key={opt}
                type="button"
                onClick={() => handleClick(opt)}
                disabled={hasSubmitted || isAnswering}
                className={`w-full min-h-[48px] px-4 py-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all duration-150 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 cursor-pointer disabled:cursor-default ${optionClasses}`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span className={`text-xs font-semibold tabular-nums pt-0.5 shrink-0 ${letterClasses}`}>
                    {letter}
                  </span>
                  <span className="text-sm sm:text-[15px] font-medium leading-snug break-words">
                    {opt}
                  </span>
                </div>

                {hasSubmitted && isSelected && (
                  <span className="shrink-0" aria-label={isCorrect ? 'Correct' : 'Incorrect'}>
                    {isCorrect ? (
                      <Check size={17} className="text-emerald-300" aria-hidden="true" />
                    ) : (
                      <X size={17} className="text-rose-300" aria-hidden="true" />
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default RaceQuestionTerminal;
