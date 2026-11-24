import { motion } from 'framer-motion';
import { Eye, Check, BrainCircuit } from 'lucide-react';

interface PredictionChoice {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

interface AIPredictionProps {
  aiPrediction: {
    promptUsed: string;
    targetScenario: string;
    choices: PredictionChoice[];
    correctAnswer: string;
  };
  onSelect: (option: string | PredictionChoice) => void;
  selectedOption: any;
  isChecked: boolean;
  isCorrect: boolean;
}

export default function AIPrediction({
  aiPrediction,
  onSelect,
  selectedOption,
  isChecked,
  isCorrect
}: AIPredictionProps) {
  const { promptUsed, targetScenario, choices, correctAnswer } = aiPrediction;

  return (
    <div className="flex flex-col space-y-6 w-full">
      <div className="text-center">
        <p className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center justify-center gap-1.5">
          <Eye className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>PREDICTIVE ACCURACY: How will the AI behave?</span>
        </p>
      </div>

      <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg border border-indigo-950 space-y-4">
        <div>
          <span className="text-[9px] font-black tracking-widest text-indigo-300 uppercase block mb-1">
            THE INPUT & ENVIRONMENT:
          </span>
          <p className="text-xs font-bold leading-relaxed">
            {targetScenario}
          </p>
        </div>

        <div className="bg-black/25 p-3 rounded-xl border border-indigo-900">
          <span className="text-[8px] font-black tracking-widest text-[#a5f3fc] uppercase block mb-1">
            🤖 INPUT PROMPT SENT:
          </span>
          <p className="font-mono text-xs font-semibold italic text-indigo-100">
            "{promptUsed}"
          </p>
        </div>
      </div>

      <div className="space-y-3.5 w-full">
        <h4 className="text-xs font-display font-black text-slate-800 text-center uppercase tracking-wider mb-1">
          Predict what the AI will output:
        </h4>

        {choices.map((choice, idx) => {
          const isSelected = selectedOption === choice.id || (selectedOption && typeof selectedOption === 'object' && selectedOption.id === choice.id);
          const shouldHighlightCorrect = isChecked && choice.isCorrect;

          let cardClass = 'bg-white border-slate-200 text-slate-700 hover:border-aibo-blue-300 shadow-[0_4px_0_#e2e8f0]';
          if (isSelected) {
            cardClass = isChecked
              ? isCorrect
                ? 'bg-green-50 border-green-500 text-green-805 shadow-[0_4px_0_#10b981]'
                : 'bg-rose-50 border-rose-500 text-rose-800 shadow-[0_4px_0_#f43f5e]'
              : 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-[0_4px_0_#6366f1]';
          } else if (shouldHighlightCorrect) {
            cardClass = 'bg-[#e8fbf0] border-emerald-500 text-emerald-800 shadow-[0_4px_0_#10b981] opacity-95';
          } else if (isChecked) {
            cardClass = 'opacity-40 bg-slate-50 border-slate-200 text-slate-400 shadow-none';
          }

          return (
            <motion.button
              key={`pred-choice-${choice.id || 'no-id'}-${idx}`}
              disabled={isChecked}
              onClick={() => onSelect(choice)}
              whileHover={!isChecked ? { y: -1, scale: 1.005 } : {}}
              whileTap={!isChecked ? { y: 1, scale: 0.995 } : {}}
              className={`p-4 rounded-xl border-2 text-left flex flex-col space-y-2.5 transition-all relative overflow-hidden w-full cursor-pointer ${cardClass}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border text-xs font-black ${
                  isSelected ? 'bg-indigo-200 border-indigo-300 text-indigo-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  🔮
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold leading-normal">{choice.text}</span>
                </div>
              </div>

              {isChecked && (choice.isCorrect || isSelected) && (
                <div className={`text-[11px] font-semibold leading-normal p-3 rounded-lg ${
                  choice.isCorrect ? 'bg-green-100/50 text-green-800' : 'bg-rose-100/50 text-rose-800'
                }`}>
                  <strong className="block text-[8px] uppercase font-black tracking-widest mb-0.5">
                    {choice.isCorrect ? '✨ SYSTEM PREDICTION ACCURATE:' : '⚠️ DEVIATING prediction:'}
                  </strong>
                  {choice.explanation}
                </div>
              )}

              {isSelected && !isChecked && (
                <div className="absolute top-2 right-2 flex items-center justify-center bg-aibo-blue-500 text-white rounded-full p-0.5 shadow-sm">
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
