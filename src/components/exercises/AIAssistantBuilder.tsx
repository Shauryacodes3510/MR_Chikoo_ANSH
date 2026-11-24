import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Cpu, Speech, Activity, Hammer } from 'lucide-react';

interface BuilderItem {
  id: string;
  text: string;
  emoji: string;
}

interface BuilderCategory {
  category: "tone" | "purpose" | "subject";
  label: string;
  emoji: string;
  items: BuilderItem[];
}

interface AIAssistantBuilderProps {
  aiAssistantBuilder: {
    categories: BuilderCategory[];
    outcomeExplanation: string;
  };
  onSelect: (selections: any) => void;
  selectedOption: any; // e.g. { tone: string, purpose: string, subject: string }
  isChecked: boolean;
}

export default function AIAssistantBuilder({
  aiAssistantBuilder,
  onSelect,
  selectedOption,
  isChecked
}: AIAssistantBuilderProps) {
  const { categories, outcomeExplanation } = aiAssistantBuilder;

  // Local state for temporary selections before checking / submitting
  const [selections, setSelections] = useState<Record<string, string>>({
    tone: selectedOption?.tone || '',
    purpose: selectedOption?.purpose || '',
    subject: selectedOption?.subject || ''
  });

  const handleItemSelect = (category: string, itemId: string) => {
    if (isChecked) return;
    const newSelections = { ...selections, [category]: itemId };
    setSelections(newSelections);

    // Call onSelect once all three categories have been populated
    if (newSelections.tone && newSelections.purpose && newSelections.subject) {
      onSelect(newSelections);
    }
  };

  const currentTone = categories.find(c => c.category === 'tone')?.items.find(i => i.id === selections.tone);
  const currentPurpose = categories.find(c => c.category === 'purpose')?.items.find(i => i.id === selections.purpose);
  const currentSubject = categories.find(c => c.category === 'subject')?.items.find(i => i.id === selections.subject);

  // Checks if the configuration has any content
  const isComplete = selections.tone && selections.purpose && selections.subject;

  return (
    <div className="flex flex-col space-y-6 w-full">
      <div className="text-center">
        <p className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center justify-center gap-1.5">
          <Hammer className="w-4 h-4 text-pink-500" />
          <span>ASSISTANT BUILDER: Configure a specialized AI!</span>
        </p>
      </div>

      {!isChecked ? (
        <div className="space-y-5">
          {categories.map((cat) => (
            <div key={cat.category} className="space-y-2">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 flex items-center gap-1">
                <span>{cat.emoji}</span>
                <span>Select {cat.label}:</span>
              </span>
              
              <div className="grid grid-cols-3 gap-2">
                {cat.items.map((item) => {
                  const isSelected = selections[cat.category] === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemSelect(cat.category, item.id)}
                      className={`p-3.5 rounded-xl border-2 font-display font-black text-xs text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-md'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-lg">{item.emoji}</span>
                      <span className="leading-tight text-[11px] font-bold">{item.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Visual Constructed Avatar Card */
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-900 border-4 border-indigo-500/20 text-white rounded-3xl p-6 space-y-4 text-center shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl" />

          {/* Combined Avatar */}
          <div className="relative mx-auto w-24 h-24 bg-gradient-to-tr from-pink-500 via-indigo-500 to-blue-500 rounded-[2.2rem] flex items-center justify-center text-4xl border-4 border-white shadow-xl">
            <span className="absolute bottom-0 right-0 text-xl bg-slate-900 px-1.5 py-0.5 rounded-lg border border-indigo-200">
              {currentSubject?.emoji || '🔬'}
            </span>
            {currentPurpose?.emoji || '🤖'}
          </div>

          <div className="space-y-1 z-10 relative">
            <span className="text-[9px] font-black tracking-widest text-[#a5f3fc] uppercase">
              Assigned Persona Status: ACTIVE
            </span>
            <h2 className="text-lg font-display font-black leading-tight text-white">
              The {currentTone?.text || 'Friendly'} {currentSubject?.text || 'Space'} Tutor
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full border border-white/10 font-bold whitespace-nowrap">
                🗣️ {currentTone?.text || 'Friendly'}
              </span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full border border-white/10 font-bold whitespace-nowrap">
                🎯 {currentPurpose?.text || 'Tutor'}
              </span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-4.5 rounded-2xl text-left space-y-2 z-10 relative">
            <span className="text-[8px] font-black uppercase text-[#a5f3fc] tracking-widest block">
              💡 CORE FUNCTION STATEMENT:
            </span>
            <p className="text-xs text-slate-200 leading-relaxed font-semibold">
              Greetings! I am configured to teach <strong className="text-indigo-300">"{currentSubject?.text}"</strong> with a <strong className="text-pink-300">"{currentTone?.text}"</strong> vibe. Let's do some interactive modules!
            </p>
          </div>

          <div className="text-[11px] font-semibold text-[#8bb795] leading-relaxed pt-1">
            {outcomeExplanation}
          </div>
        </motion.div>
      )}
    </div>
  );
}
