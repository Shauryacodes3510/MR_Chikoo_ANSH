import { useState } from 'react';

interface OpenResponseProps {
  question: string;
  onSelect: (answer: string | null) => void;
  isChecked: boolean;
  value: string;
}

export default function OpenResponse({
  question,
  onSelect,
  isChecked,
  value
}: OpenResponseProps) {
  const [text, setText] = useState(value || '');

  const handleChange = (newText: string) => {
    setText(newText);
    onSelect(newText.trim() ? newText : null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-aibo-blue-50/50 p-6 rounded-[2rem] border-2 border-aibo-blue-100 italic text-lg text-gray-700">
        "{question}"
      </div>

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isChecked}
          placeholder="Type your reflection here..."
          className={`w-full min-h-[150px] p-6 rounded-3xl border-2 transition-all text-lg font-medium resize-none focus:outline-none focus:ring-4 focus:ring-aibo-blue-100 ${
            isChecked 
              ? 'bg-slate-50 border-slate-200 text-slate-500' 
              : 'bg-white border-slate-200 hover:border-aibo-blue-300'
          }`}
        />
      </div>

      {isChecked && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl border-2 border-emerald-100 font-bold text-center">
          Insight captured! Moving on...
        </div>
      )}
    </div>
  );
}
