import { motion } from 'framer-motion';
import { User, Sparkles, AlertCircle } from 'lucide-react';

interface StudentStoryProps {
  studentStory: {
    avatar: string; // Emoji representing the student avatar
    studentName: string;
    scenario: string;
    outcome: string;
    quote?: string;
  };
  onSelect: (option: boolean) => void;
  selectedOption: any;
  isChecked: boolean;
}

export default function StudentStory({
  studentStory,
  onSelect,
  selectedOption,
  isChecked
}: StudentStoryProps) {
  const { avatar, studentName, scenario, outcome, quote } = studentStory;
  const isInteracted = selectedOption === true;

  return (
    <div className="flex flex-col space-y-6 w-full py-2">
      <div className="text-center">
        <p className="text-xs font-black uppercase text-pink-500 tracking-widest flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
          <span>CLASSROOM ADVENTURE DIARY</span>
        </p>
      </div>

      {/* Main Narrative Card wrapper */}
      <div className="bg-white rounded-3xl border-4 border-slate-100 shadow-md p-6 space-y-5 text-left">
        {/* Student Profile Header */}
        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
          <div className="w-14 h-14 rounded-full bg-pink-100 border-2 border-pink-300 flex items-center justify-center text-4xl shadow-inner select-none">
            {avatar || '🧑‍🎓'}
          </div>
          <div className="space-y-0.5">
            <h4 className="font-display font-black text-slate-800 text-lg">
              {studentName}
            </h4>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Active Biology Co-Pilot Student
            </span>
          </div>
        </div>

        {/* Scenario description block */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-pink-600 block">
            THE EVENT PROBLEM:
          </span>
          <p className="text-sm sm:text-base font-bold text-slate-700 leading-relaxed">
            {scenario}
          </p>
        </div>

        {/* Narrative Outcome block */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
            HOW AI HELPED & OUTCOME:
          </span>
          <p className="text-sm sm:text-base font-bold text-slate-700 leading-relaxed bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100 italic">
            " {outcome} "
          </p>
        </div>

        {/* Speech dialogue quote */}
        {quote && (
          <div className="relative bg-indigo-50/50 p-5 border border-indigo-100 rounded-2xl">
            <span className="text-[10px] font-black text-indigo-800 uppercase tracking-wider block">
              STUDENT ADVICE TIP:
            </span>
            <p className="text-sm sm:text-base font-bold text-indigo-900 italic leading-relaxed mt-1">
              "{quote}"
            </p>
          </div>
        )}
      </div>

      {/* interaction action Button */}
      <div className="flex justify-center flex-col items-center">
        <motion.button
          disabled={isChecked}
          onClick={() => onSelect(true)}
          whileHover={!isChecked ? { scale: 1.05 } : {}}
          whileTap={!isChecked ? { scale: 0.95 } : {}}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-display font-black text-sm uppercase tracking-wider transition-all cursor-pointer ${
            isInteracted
              ? 'bg-pink-100 border-2 border-pink-400 text-pink-700 shadow-sm'
              : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300 shadow-[0_4px_0_#e2e8f0]'
          }`}
        >
          <User className={`w-5 h-5 ${isInteracted ? 'text-pink-500 animate-pulse' : 'text-slate-400'}`} />
          <span>{isInteracted ? 'Story read & stored! 📖' : 'Read Student Story! 🧑‍🎓'}</span>
        </motion.button>
      </div>
    </div>
  );
}
