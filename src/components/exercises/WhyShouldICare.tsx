import { motion } from 'framer-motion';
import { HelpCircle, Sparkles, CheckSquare, Target } from 'lucide-react';

interface WhyShouldICareProps {
  whyShouldICare: {
    challenge: string; // E.g. "Drafting research essays "
    schoolCategory: string; // E.g. "School Homework / Creative Writing"
    benefitText: string;
    practicalEmoji?: string;
    actionTip?: string;
  };
  onSelect: (option: boolean) => void;
  selectedOption: any;
  isChecked: boolean;
}

export default function WhyShouldICare({
  whyShouldICare,
  onSelect,
  selectedOption,
  isChecked
}: WhyShouldICareProps) {
  const { challenge, schoolCategory, benefitText, practicalEmoji, actionTip } = whyShouldICare;
  const isInteracted = selectedOption === true;

  return (
    <div className="flex flex-col space-y-6 w-full py-2">
      <div className="text-center">
        <p className="text-xs font-black uppercase text-amber-500 tracking-widest flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>REAL-LIFE PRACTICAL GAIN</span>
        </p>
      </div>

      {/* Main card */}
      <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-3xl border-4 border-white shadow-md p-6 space-y-5 text-left">
        {/* Header indicator */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-indigo-200">
            {practicalEmoji || '🎯'}
          </div>
          <div>
            <span className="text-[9px] font-black uppercase text-indigo-600 tracking-widest block">
              PRACTICAL RELEVANCE DOMAIN:
            </span>
            <div className="text-base font-black font-display text-slate-800 tracking-tight leading-snug">
              {schoolCategory}
            </div>
          </div>
        </div>

        {/* Challenge Section */}
        <div className="bg-white/40 p-5 border border-indigo-100 rounded-2xl space-y-1.5">
          <span className="text-xs font-black text-indigo-700 tracking-wider">
            COMMON STUDENT OBSTACLE:
          </span>
          <p className="text-sm sm:text-base font-bold text-slate-700 leading-relaxed">
            "{challenge}"
          </p>
        </div>

        {/* Benefits Section */}
        <div className="space-y-1.5">
          <span className="text-xs font-black text-indigo-700 tracking-wider flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-indigo-500" />
            <span>DIRECT UNLOCKED BENEFITS:</span>
          </span>
          <p className="text-base sm:text-lg font-black text-slate-805 leading-relaxed">
            🚀 {benefitText}
          </p>
        </div>

        {/* Action Tips */}
        {actionTip && (
          <div className="bg-emerald-500 text-white rounded-2xl p-5.5 shadow-inner leading-relaxed">
            <span className="text-[11px] font-black tracking-widest uppercase block opacity-85 mb-1.5">
              🚀 STUDENT ACTION PRO-TIP:
            </span>
            <p className="text-sm sm:text-base font-black font-display leading-tight">
              {actionTip}
            </p>
          </div>
        )}
      </div>

      {/* Action Verify */}
      <div className="flex justify-center">
        <motion.button
          disabled={isChecked}
          onClick={() => onSelect(true)}
          whileHover={!isChecked ? { scale: 1.05 } : {}}
          whileTap={!isChecked ? { scale: 0.95 } : {}}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-display font-black text-sm uppercase tracking-wider transition-all cursor-pointer ${
            isInteracted
              ? 'bg-[#e0f2fe] border-2 border-[#3b82f6] text-[#1d4ed8] shadow-sm'
              : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300 shadow-[0_4px_0_#e2e8f0]'
          }`}
        >
          <CheckSquare className={`w-5 h-5 ${isInteracted ? 'text-indigo-500' : 'text-slate-400'}`} />
          <span>{isInteracted ? 'Tip locked in! 📚' : 'Tap to absorb! ✨'}</span>
        </motion.button>
      </div>
    </div>
  );
}
