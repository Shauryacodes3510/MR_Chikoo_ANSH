import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { soundManager } from '../../lib/sounds';

interface RapidFireProps {
  questions: any[];
  onComplete: (score: number) => void;
  isChecked: boolean;
}

export default function RapidFire({ questions, onComplete, isChecked }: RapidFireProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  
  const [results, setResults] = useState<{ question: string; correct: boolean; userAnswer: string }[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (showSummary) return;

    if (timeLeft > 0 && !isFinished && !isChecked && !feedback) {
      timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    } else if (timeLeft === 0 && !isFinished) {
      setIsFinished(true);
    }
  }, [timeLeft, isFinished, isChecked, showSummary, feedback]);

  const handleAnswer = (userChoice: string) => {
    if (feedback) return;

    const currentQ = questions?.[currentIndex] || {};
    const isCorrect = String(userChoice || '').trim().toLowerCase() === String(currentQ.correctAnswer || '').trim().toLowerCase();
    
    setResults(prev => [...prev, { 
      question: currentQ.question || 'Rapid Question', 
      correct: isCorrect,
      userAnswer: userChoice
    }]);

    setFeedback(isCorrect ? 'correct' : 'incorrect');
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      setCombo(prev => {
        const next = prev + 1;
        setMaxCombo(m => Math.max(m, next));
        return next;
      });
      soundManager.play('correct');
    } else {
      setCombo(0);
      soundManager.play('incorrect');
    }

    // Auto-advance after a flash-popup (pauses timer while showing)
    setTimeout(() => {
      nextQuestion();
    }, 3000);
  };

  const nextQuestion = () => {
    setFeedback(null);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
    soundManager.play('click');
  };

  if (showSummary) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col h-full bg-white rounded-[2.5rem] overflow-hidden"
      >
        <div className="bg-aibo-blue-500 p-8 text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <Zap size={40} className="text-white fill-white" />
          </div>
          <h2 className="text-3xl font-display font-black uppercase tracking-tight">Performance Summary</h2>
          <p className="text-aibo-blue-100 font-bold mt-1 opacity-90">Rapid Fire Session Results</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-4 scrollbar-hide">
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 p-4 rounded-3xl border-2 border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accuracy</p>
              <p className="text-2xl font-display font-black text-slate-700">
                {Math.round((score / Math.max(1, results.length)) * 100)}%
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-3xl border-2 border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Combo</p>
              <p className="text-2xl font-display font-black text-slate-700">{maxCombo}x</p>
            </div>
          </div>

          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Question Breakdown</h3>
          {results.map((res, i) => (
            <motion.div 
              key={`rf-result-${i}-${res.question.slice(0, 20)}`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`p-5 rounded-[2rem] border-2 flex items-center gap-4 ${
                res.correct ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                res.correct ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
              }`}>
                {res.correct ? <CheckCircle2 size={18} strokeWidth={4} /> : <AlertCircle size={18} strokeWidth={4} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-700 leading-tight">{res.question}</p>
                <p className={`text-[10px] font-black uppercase mt-1 ${res.correct ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {res.correct ? 'Mastered' : 'Needs Review'}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <button 
            onClick={() => {
              const speedBonus = timeLeft > 15 ? 5 : timeLeft > 5 ? 2 : 0;
              const comboBonus = Math.floor(maxCombo / 2);
              onComplete(score + speedBonus + comboBonus);
            }}
            className="w-full py-5 bg-emerald-500 text-white rounded-[2rem] font-display font-black text-xl shadow-[0_6px_0_#059669] hover:brightness-105 active:translate-y-1 active:shadow-none transition-all uppercase tracking-wide"
          >
            Finish & Continue
          </button>
        </div>
      </motion.div>
    );
  }

  if (isFinished || isChecked) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-8 py-8"
      >
        <div className="relative inline-block">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="w-40 h-40 bg-gradient-to-br from-aibo-blue-400 to-aibo-blue-600 rounded-full flex flex-col items-center justify-center mx-auto shadow-2xl border-4 border-white"
          >
            <span className="text-6xl font-display font-black text-white leading-none">{score}</span>
            <span className="text-xs font-black text-aibo-blue-100 uppercase tracking-widest mt-1">Points</span>
          </motion.div>
          {maxCombo > 2 && (
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="absolute -right-4 -top-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-black text-sm shadow-lg border-2 border-white flex items-center gap-1"
            >
              <Zap size={14} fill="currentColor" />
              {maxCombo}x COMBO
            </motion.div>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-3xl font-display font-black text-gray-800">Blitz Complete!</h3>
          <p className="text-gray-500 font-bold text-lg">
            Final Score: {score} Correct
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time Left</p>
            <p className="text-xl font-black text-gray-700">{timeLeft}s</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Max Combo</p>
            <p className="text-xl font-black text-gray-700">{maxCombo}</p>
          </div>
        </div>

        {!isChecked && (
          <button
            onClick={() => setShowSummary(true)}
            className="btn-3d btn-3d-blue w-full py-4 text-xl uppercase tracking-wider max-w-sm mx-auto flex items-center justify-center gap-3"
          >
            View Summary
          </button>
        )}
      </motion.div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="flex flex-col h-full relative">
      <div className={`space-y-6 flex flex-col h-full transition-transform duration-100 ${feedback === 'incorrect' ? 'animate-shake' : ''}`}>
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className={`flex items-center gap-2 transition-colors duration-300 ${timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-aibo-blue-500'}`}>
              <Timer className="w-6 h-6" />
              <span className="font-display font-black text-2xl tabular-nums">{timeLeft}s</span>
            </div>
            
            <div className="flex items-center gap-3">
              <AnimatePresence>
                {combo > 1 && (
                  <motion.div 
                    initial={{ scale: 0, x: 20 }}
                    animate={{ scale: 1, x: 0 }}
                    exit={{ scale: 0, x: 20 }}
                    className="flex items-center gap-1 bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-full font-black text-sm shadow-md border-2 border-white"
                  >
                    <Zap size={16} fill="currentColor" className="animate-pulse" />
                    <span className="font-display">{combo}x COMBO</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="bg-slate-100 px-3 py-1.5 rounded-xl text-slate-500 font-display font-black text-xs uppercase tracking-widest border border-slate-200">
                {currentIndex + 1} / {questions.length}
              </div>
            </div>
          </div>

          {/* Timer Progress Bar */}
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: `${(timeLeft / 30) * 100}%` }}
              className={`h-full transition-colors duration-500 ${timeLeft < 10 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-aibo-blue-500 shadow-[0_0_10px_rgba(33,150,243,0.3)]'}`}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ x: 100, opacity: 0 }}
            animate={{ 
              x: 0, 
              opacity: 1,
              transition: { type: 'spring', damping: 20, stiffness: 100 }
            }}
            exit={{ x: -100, opacity: 0 }}
            className={`flex-1 flex flex-col gap-6 ${feedback === 'incorrect' ? 'animate-shake' : ''}`}
          >
            <div className="bg-white border-[3px] border-slate-100 rounded-[2.5rem] p-8 shadow-xl text-center relative overflow-hidden group min-h-[140px] flex items-center justify-center">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-aibo-blue-400 to-aibo-blue-600 opacity-30" />
              <h4 className="text-2xl font-display font-black text-slate-800 leading-tight">
                {currentQ.question}
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-auto">
              {(currentQ?.options || []).map((opt: string, optIdx: number) => {
                const optStr = String(opt || '');
                const correctStr = String(currentQ?.correctAnswer || '');
                const isMatchCorrect = optStr.trim().toLowerCase() === correctStr.trim().toLowerCase();
                const isLastUserAnswer = opt === results[results.length - 1]?.userAnswer;

                return (
                  <motion.button
                    key={`rf-opt-${currentQ?.id || currentIndex}-${optIdx}-${optStr.slice(0, 15)}`}
                    whileHover={!feedback ? { scale: 1.02, x: 5 } : {}}
                    whileTap={!feedback ? { scale: 0.98 } : {}}
                    disabled={!!feedback}
                    onClick={() => handleAnswer(opt)}
                    className={`group relative p-6 text-left font-display font-black text-xl rounded-3xl border-b-[6px] transition-all duration-200 flex items-center justify-between ${
                      feedback && isMatchCorrect
                        ? 'bg-emerald-500 text-white border-emerald-700 shadow-none translate-y-1'
                        : feedback && !isMatchCorrect && feedback === 'incorrect' && isLastUserAnswer
                          ? 'bg-rose-100 text-rose-500 border-rose-300 shadow-none translate-y-1'
                          : feedback
                            ? 'bg-slate-50 text-slate-300 border-slate-200 shadow-none'
                            : 'bg-white border-slate-200 hover:border-chikoo-blue-300 text-slate-700 shadow-[0_4px_0_#e2e8f0] hover:shadow-[0_4px_0_#93C5FD]'
                    }`}
                  >
                    <span>{optStr}</span>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                      feedback && isMatchCorrect
                        ? 'bg-white text-emerald-500 border-white'
                        : feedback && feedback === 'incorrect' && isLastUserAnswer
                          ? 'bg-white text-rose-500 border-white'
                          : 'border-slate-200 group-hover:border-chikoo-blue-300'
                    }`}>
                      {feedback && isMatchCorrect ? <CheckCircle2 size={18} strokeWidth={4} /> : 
                       feedback && feedback === 'incorrect' && isLastUserAnswer ? <AlertCircle size={18} strokeWidth={4} /> : null}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
