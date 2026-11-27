import React from 'react';
import { ScreenFormStateAndHandlers } from '../types';

interface MultipleChoiceScreenProps {
  screenForm: ScreenFormStateAndHandlers;
}

export const MultipleChoiceScreen: React.FC<MultipleChoiceScreenProps> = ({ screenForm }) => {
  const {
    chalType,
    chalMcqOptions,
    setChalMcqOptions,
    chalMcqCorrect,
    setChalMcqCorrect,
    chalImageUrl,
    setChalImageUrl,
    chalFillBlankOptions,
    setChalFillBlankOptions,
    chalFillBlankCorrect,
    setChalFillBlankCorrect,
  } = screenForm;

  return (
    <>
      {/* A: MULTIPLE CHOICE CARD WORKBOOK */}
      {(chalType === 'tap_right_answer' || chalType === 'image_reveal') && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-black uppercase text-indigo-700">Multiple Choice Configurator</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {chalMcqOptions.map((opt, idx) => (
              <div key={idx}>
                <label className="block text-[9px] text-slate-500">Option Card #{idx + 1}</label>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...chalMcqOptions];
                    newOpts[idx] = e.target.value;
                    setChalMcqOptions(newOpts);
                  }}
                  placeholder={`Option ${idx + 1}`}
                  className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs"
                  required={idx < 2}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-[9px] text-slate-500">Exact Correct Answer String value</label>
            <input
              type="text"
              value={chalMcqCorrect}
              onChange={(e) => setChalMcqCorrect(e.target.value)}
              placeholder="e.g. Matches one of the Option Cards exactly"
              className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs"
              required
            />
          </div>

          {chalType === 'image_reveal' && (
            <div>
              <label className="block text-[9px] text-slate-500">Satellites Reveal Image URL</label>
              <input
                type="text"
                value={chalImageUrl}
                onChange={(e) => setChalImageUrl(e.target.value)}
                className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs"
              />
            </div>
          )}
        </div>
      )}

      {/* B: FILL IN THE BLANK WORKBOOK */}
      {chalType === 'fill_in_blank' && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-black uppercase text-indigo-700">Blank Fill Tag Configurator</h4>
          <p className="text-[10px] text-slate-400">Put a [BLANK] tag in your Question Prompt above where the option drops!</p>

          <div className="grid grid-cols-2 gap-3">
            {chalFillBlankOptions.map((opt, idx) => (
              <div key={idx}>
                <label className="block text-[9px] text-slate-400">Word Chip Option #{idx + 1}</label>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...chalFillBlankOptions];
                    newOpts[idx] = e.target.value;
                    setChalFillBlankOptions(newOpts);
                  }}
                  placeholder={`Chip ${idx + 1}`}
                  className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs"
                  required={idx < 2}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-[10px] text-slate-500">Correct chip word value</label>
            <input
              type="text"
              value={chalFillBlankCorrect}
              onChange={(e) => setChalFillBlankCorrect(e.target.value)}
              placeholder="Match correct option"
              className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs"
              required
            />
          </div>
        </div>
      )}
    </>
  );
};
