import { motion } from 'framer-motion';
import { Sparkles, Check, Play, Map } from 'lucide-react';

interface MissionStep {
  id: string;
  action: string;
  feedback: string;
  isCorrect: boolean;
}

interface StudentMissionProps {
  studentMission: {
    mission: string;
    steps: MissionStep[];
  };
  onSelect: (id: string | MissionStep) => void;
  selectedOption: any;
  isChecked: boolean;
  isCorrect: boolean;
}

export default function StudentMission({
  studentMission,
  onSelect,
  selectedOption,
  isChecked,
  isCorrect
}: StudentMissionProps) {
  const { mission, steps } = studentMission;

  return (
    <div className="flex flex-col space-y-5 w-full">
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden flex items-start gap-4">
        {/* Animated background highlights to make it feel like a mission map */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl" />

        <div className="bg-white/10 p-3 rounded-xl border border-white/20 text-2xl shrink-0">
          🗺️
        </div>
        <div className="space-y-1 z-10">
          <span className="text-[9px] font-black tracking-widest text-[#a5f3fc] uppercase block">
            TODAY'S EXPLORER MISSION:
          </span>
          <p className="text-sm font-bold leading-relaxed">
            {mission}
          </p>
        </div>
      </div>

      <div className="space-y-3.5 w-full">
        {steps.map((step, idx) => {
          const isSelected = selectedOption === step.id || (selectedOption && typeof selectedOption === 'object' && selectedOption.id === step.id);
          const shouldHighlightCorrect = isChecked && step.isCorrect;

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
              key={step.id ? `mission-step-${step.id}` : `mission-step-${idx}-${step.action?.slice(0, 10)}`}
              disabled={isChecked}
              onClick={() => onSelect(step)}
              whileHover={!isChecked ? { y: -1, scale: 1.005 } : {}}
              whileTap={!isChecked ? { y: 1, scale: 0.995 } : {}}
              className={`p-4.5 rounded-xl border-2 text-left flex flex-col space-y-2.5 transition-all relative overflow-hidden w-full cursor-pointer ${cardClass}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border text-xs font-black ${
                  isSelected ? 'bg-[#eef2ff] border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  🚀
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold leading-normal">{step.action}</span>
                </div>
              </div>

              {isChecked && (step.isCorrect || isSelected) && (
                <div className={`text-[11px] font-semibold leading-normal p-3 rounded-lg ${
                  step.isCorrect ? 'bg-green-100/50 text-green-800' : 'bg-rose-100/50 text-rose-800'
                }`}>
                  <strong className="block text-[8px] uppercase font-black tracking-widest mb-0.5">
                    {step.isCorrect ? '✨ COGNITIVE BENEFIT ANALYSIS:' : '⚠️ RISK / BENEFIT ASSESSMENT:'}
                  </strong>
                  {step.feedback}
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
