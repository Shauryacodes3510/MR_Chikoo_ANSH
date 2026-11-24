import { motion } from 'framer-motion';
import { Sparkles, User, Brain, AlertCircle, Check } from 'lucide-react';

interface AIOutput {
  id: string;
  title: string;
  text: string;
  authorLabel: string;
  isAI: boolean;
  imageUrl?: string;
  emojis?: string;
}

interface AIVsHumanProps {
  outputs: [AIOutput, AIOutput];
  onSelect: (optionId: string) => void;
  selectedOption: string | null;
  isChecked: boolean;
  isCorrect: boolean;
}

export default function AIVsHuman({
  outputs,
  onSelect,
  selectedOption,
  isChecked,
  isCorrect
}: AIVsHumanProps) {
  return (
    <div className="flex flex-col space-y-6 w-full">
      <div className="text-center">
        <p className="text-xs font-black uppercase text-slate-400 tracking-widest">
          Compare the options below. One is human-crafted, one is AI-generated:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {outputs.map((item) => {
          const isSelected = selectedOption === item.id;
          const isActuallyAI = item.isAI;

          let cardClass = 'bg-white border-slate-200 text-slate-700 hover:border-aibo-blue-200';
          if (isSelected) {
            cardClass = isChecked
              ? isCorrect
                ? 'bg-green-50 border-green-500 text-green-700 shadow-[0_6px_0_#22c55e]'
                : 'bg-red-50 border-red-500 text-red-700 shadow-[0_6px_0_#ef4444]'
              : 'bg-aibo-blue-5 border-aibo-blue-400 text-aibo-blue-700 shadow-[0_6px_0_#3b82f6]';
          } else if (isChecked) {
            if (isActuallyAI) {
              cardClass = 'bg-green-10 border-green-400 text-green-700 opacity-90';
            } else {
              cardClass = 'opacity-45 bg-slate-50 border-slate-200 text-slate-400';
            }
          }

          return (
            <motion.button
              key={item.id}
              disabled={isChecked}
              onClick={() => onSelect(item.id)}
              whileHover={!isChecked ? { y: -3 } : {}}
              whileTap={!isChecked ? { scale: 0.98 } : {}}
              className={`p-6 rounded-3xl border-2 text-left flex flex-col space-y-4 transition-all duration-300 relative overflow-hidden min-h-[160px] ${cardClass}`}
            >
              {/* Header inside card */}
              <div className="flex items-center justify-between w-full">
                <span className="font-display font-black text-sm uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-full text-slate-500">
                  {item.title}
                </span>

                {isChecked && isActuallyAI && (
                  <span className="flex items-center gap-1.5 font-display font-black text-xs text-green-600 bg-green-100 px-2.5 py-1 rounded-full">
                    <Brain className="w-3.5 h-3.5" />
                    <span>AI Generated</span>
                  </span>
                )}
                {isChecked && !isActuallyAI && (
                  <span className="flex items-center gap-1.5 font-display font-black text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    <User className="w-3.5 h-3.5" />
                    <span>Human Made</span>
                  </span>
                )}
              </div>

              {/* Text Output preview */}
              <div className="flex-1">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-32 object-cover rounded-2xl mb-3 border-2 border-slate-100"
                  />
                )}
                <p className="text-sm font-semibold leading-relaxed text-slate-700 h-24 overflow-y-auto">
                  {item.text}
                </p>
              </div>

              {/* Emoji illustration footprint */}
              {item.emojis && (
                <div className="text-xl flex gap-1 pt-1 opacity-80">{item.emojis}</div>
              )}

              {/* Selected overlay */}
              {isSelected && !isChecked && (
                <div className="absolute top-2 right-2 flex items-center justify-center bg-aibo-blue-500 text-white rounded-full p-1 shadow-md">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
