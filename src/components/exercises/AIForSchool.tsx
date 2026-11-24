import { motion } from 'framer-motion';
import { Sparkles, Check, School, GraduationCap } from 'lucide-react';

interface Approach {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  isBest: boolean;
  feedback: string;
}

interface AIForSchoolProps {
  aiForSchool: {
    scenario: string;
    approaches: Approach[];
  };
  onSelect: (id: string | Approach) => void;
  selectedOption: any;
  isChecked: boolean;
  isCorrect: boolean;
}

export default function AIForSchool({
  aiForSchool,
  onSelect,
  selectedOption,
  isChecked,
  isCorrect
}: AIForSchoolProps) {
  const { scenario, approaches } = aiForSchool;

  return (
    <div className="flex flex-col space-y-6 w-full">
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-150 rounded-2xl p-4.5 flex gap-3.5 items-start">
        <div className="bg-white p-3 rounded-xl border border-indigo-200 shrink-0 text-2xl font-black text-indigo-600 shadow-sm">
          🎒
        </div>
        <div>
          <span className="text-[9px] font-black uppercase text-indigo-700 tracking-wider block">
            SCHOOL MISSION DILEMMA:
          </span>
          <p className="text-xs font-bold text-slate-700 leading-relaxed mt-0.5">
            {scenario}
          </p>
        </div>
      </div>

      <div className="space-y-3.5 w-full">
        {approaches.map((app, idx) => {
          // match ID or object
          const isSelected = selectedOption === app.id || (selectedOption && typeof selectedOption === 'object' && selectedOption.id === app.id);
          const shouldHighlightCorrect = isChecked && app.isBest;

          let cardClass = 'bg-white border-slate-200 text-slate-700 hover:border-chikoo-blue-300 shadow-[0_4px_0_#e2e8f0]';
          if (isSelected) {
            cardClass = isChecked
              ? isCorrect
                ? 'bg-green-50 border-green-500 text-green-800 shadow-[0_4px_0_#10b981]'
                : 'bg-rose-50 border-rose-500 text-rose-800 shadow-[0_4px_0_#f43f5e]'
              : 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-[0_4px_0_#6366f1]';
          } else if (shouldHighlightCorrect) {
            cardClass = 'bg-[#e8fbf0] border-emerald-500 text-emerald-800 shadow-[0_4px_0_#10b981] opacity-95';
          } else if (isChecked) {
            cardClass = 'opacity-40 bg-slate-50 border-slate-200 text-slate-400 shadow-none';
          }

          return (
            <motion.button
              key={app.id ? `school-app-${app.id}` : `school-app-${idx}-${app.title?.slice(0, 10)}`}
              disabled={isChecked}
              onClick={() => onSelect(app)}
              whileHover={!isChecked ? { y: -1, scale: 1.005 } : {}}
              whileTap={!isChecked ? { y: 1, scale: 0.995 } : {}}
              className={`p-4 rounded-xl border-2 text-left flex flex-col space-y-2.5 transition-all relative overflow-hidden w-full cursor-pointer ${cardClass}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-xl shrink-0 border border-slate-200">
                  {app.emoji}
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-black text-slate-800 leading-tight">
                    {app.title}
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-500 leading-normal mt-0.5">
                    {app.desc}
                  </p>
                </div>
              </div>

              {isChecked && (app.isBest || isSelected) && (
                <div className={`text-[11px] font-semibold p-3 rounded-xl leading-normal ${
                  app.isBest ? 'bg-green-100/50 text-green-800' : 'bg-rose-100/50 text-rose-800'
                }`}>
                  <strong className="block text-[8px] uppercase font-black tracking-wider mb-0.5">
                    {app.isBest ? '🧠 TEACHER STUDY ADVICE:' : '⚠️ CAREFUL HINT:'}
                  </strong>
                  {app.feedback}
                </div>
              )}

              {isSelected && !isChecked && (
                <div className="absolute top-2 right-2 flex items-center justify-center bg-chikoo-blue-500 text-white rounded-full p-0.5 shadow-sm">
                  <Check className="w-3 h-3" strokeWidth={3} />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
