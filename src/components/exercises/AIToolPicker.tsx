import { motion } from 'framer-motion';
import { Sparkles, Check, CheckCircle } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  emoji: string;
  description: string;
  whyCorrect: string;
  isCorrect: boolean;
}

interface AIToolPickerProps {
  toolPicker: {
    situation: string;
    tools: Tool[];
  };
  onSelect: (id: string | Tool) => void;
  selectedOption: any;
  isChecked: boolean;
  isCorrect: boolean;
}

export default function AIToolPicker({
  toolPicker,
  onSelect,
  selectedOption,
  isChecked,
  isCorrect
}: AIToolPickerProps) {
  const { situation, tools } = toolPicker;

  return (
    <div className="flex flex-col space-y-6 w-full">
      <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
        <span className="text-[10px] font-black uppercase text-chikoo-blue-500 tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          The Situation:
        </span>
        <p className="text-sm font-bold text-slate-700 leading-relaxed">
          {situation}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {tools.map((tool, idx) => {
          // selectedOption can be either the selected tool object or tool ID, match both for flexibility
          const isSelected = selectedOption === tool.id || (selectedOption && typeof selectedOption === 'object' && selectedOption.id === tool.id);
          const shouldHighlightCorrect = isChecked && tool.isCorrect;

          let cardClass = 'bg-white border-slate-200 text-slate-700 hover:border-chikoo-blue-300 shadow-[0_4px_0_#e2e8f0]';
          if (isSelected) {
            cardClass = isChecked
              ? isCorrect
                ? 'bg-green-50 border-green-500 text-green-800 shadow-[0_4px_0_#10b981]'
                : 'bg-rose-50 border-rose-500 text-rose-800 shadow-[0_4px_0_#f43f5e]'
              : 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-[0_4px_0_#6366f1]';
          } else if (shouldHighlightCorrect) {
            cardClass = 'bg-green-10 border-green-400 text-green-700 shadow-[0_4px_0_#10b981] opacity-95';
          } else if (isChecked) {
            cardClass = 'opacity-40 bg-slate-50 border-slate-200 text-slate-400 shadow-none';
          }

          return (
            <motion.button
              key={tool.id ? `tool-picker-${tool.id}` : `tool-picker-${idx}-${tool.name?.slice(0, 10)}`}
              disabled={isChecked}
              onClick={() => onSelect(tool)}
              whileHover={!isChecked ? { y: -2, scale: 1.01 } : {}}
              whileTap={!isChecked ? { y: 1, scale: 0.99 } : {}}
              className={`p-5 rounded-2xl border-2 text-left flex flex-col space-y-3 transition-all relative overflow-hidden h-full cursor-pointer ${cardClass}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl border border-slate-200 group-hover:scale-110 transition-transform">
                  {tool.emoji}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 leading-tight">
                    {tool.name}
                  </h4>
                  <p className="text-[11px] font-bold text-slate-400 leading-tight">
                    {tool.description}
                  </p>
                </div>
              </div>

              {isChecked && (tool.isCorrect || isSelected) && (
                <div className={`text-xs font-bold p-3 rounded-xl ${
                  tool.isCorrect ? 'bg-green-100/50 text-green-800' : 'bg-rose-100/50 text-rose-850'
                }`}>
                  <strong className="block text-[10px] uppercase font-black tracking-wider mb-1">
                    {tool.isCorrect ? '✨ WHY THIS WORKS:' : '⚠️ WHY NOT THIS:'}
                  </strong>
                  <p className="leading-snug">{tool.whyCorrect}</p>
                </div>
              )}

              {isSelected && !isChecked && (
                <div className="absolute top-2 right-2 flex items-center justify-center bg-chikoo-blue-500 text-white rounded-full p-0.5 shadow-sm">
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
