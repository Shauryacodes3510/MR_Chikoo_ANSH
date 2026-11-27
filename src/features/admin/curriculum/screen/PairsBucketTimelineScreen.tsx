import React from 'react';
import { ScreenFormStateAndHandlers } from '../types';

interface PairsBucketTimelineScreenProps {
  screenForm: ScreenFormStateAndHandlers;
}

export const PairsBucketTimelineScreen: React.FC<PairsBucketTimelineScreenProps> = ({ screenForm }) => {
  const {
    chalType,
    chalDragBucket1,
    setChalDragBucket1,
    chalDragBucket2,
    setChalDragBucket2,
    chalDragItem1Text,
    setChalDragItem1Text,
    chalDragItem1Bucket,
    setChalDragItem1Bucket,
    chalDragItem2Text,
    setChalDragItem2Text,
    chalDragItem2Bucket,
    setChalDragItem2Bucket,
    chalPairLeft1,
    setChalPairLeft1,
    chalPairRight1,
    setChalPairRight1,
    chalPairLeft2,
    setChalPairLeft2,
    chalPairRight2,
    setChalPairRight2,
    chalSortStep1,
    setChalSortStep1,
    chalSortStep2,
    setChalSortStep2,
    chalSortStep3,
    setChalSortStep3,
    chalSortStep4,
    setChalSortStep4,
    chalSentenceTarget,
    setChalSentenceTarget,
    chalChipsValue,
    setChalChipsValue,
    chalChipsDistractors,
    setChalChipsDistractors,
  } = screenForm;

  return (
    <>
      {/* E: BUCKETS DRAG DROP */}
      {chalType === 'drag_and_drop' && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-black uppercase text-indigo-700">Drag & Drop Bucket Config</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-500">Bucket #1 Title</label>
              <input 
                type="text" 
                value={chalDragBucket1} 
                onChange={(e) => setChalDragBucket1(e.target.value)}
                className="w-full bg-white p-2 border text-xs rounded"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500">Bucket #2 Title</label>
              <input 
                type="text" 
                value={chalDragBucket2} 
                onChange={(e) => setChalDragBucket2(e.target.value)}
                className="w-full bg-white p-2 border text-xs rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-2.5 bg-white border rounded">
              <label className="block text-[9px] font-bold">Item Card 1</label>
              <input 
                type="text" 
                value={chalDragItem1Text} 
                onChange={(e) => setChalDragItem1Text(e.target.value)}
                className="w-full p-1 border text-xs my-1"
              />
              <select 
                value={chalDragItem1Bucket} 
                onChange={(e) => setChalDragItem1Bucket(e.target.value)}
                className="text-xs p-1 bg-slate-50 border w-full"
              >
                <option value="bucket1">Assign to Bucket 1</option>
                <option value="bucket2">Assign to Bucket 2</option>
              </select>
            </div>

            <div className="p-2.5 bg-white border rounded">
              <label className="block text-[9px] font-bold">Item Card 2</label>
              <input 
                type="text" 
                value={chalDragItem2Text} 
                onChange={(e) => setChalDragItem2Text(e.target.value)}
                className="w-full p-1 border text-xs my-1"
              />
              <select 
                value={chalDragItem2Bucket} 
                onChange={(e) => setChalDragItem2Bucket(e.target.value)}
                className="text-xs p-1 bg-slate-50 border w-full"
              >
                <option value="bucket1">Assign to Bucket 1</option>
                <option value="bucket2">Assign to Bucket 2</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* F: MATCH PAIRS */}
      {chalType === 'match_pairs' && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-black uppercase text-indigo-700">Connecting Pairs Matcher</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 bg-white border rounded space-y-2">
              <span className="text-[10px] font-bold block text-slate-500">Pair Couple #1</span>
              <input 
                type="text" 
                placeholder="Left Concept: e.g. Earth" 
                value={chalPairLeft1} 
                onChange={(e) => setChalPairLeft1(e.target.value)}
                className="w-full p-1 border text-xs"
              />
              <input 
                type="text" 
                placeholder="Right Partner: e.g. Atmosphere" 
                value={chalPairRight1} 
                onChange={(e) => setChalPairRight1(e.target.value)}
                className="w-full p-1 border text-xs"
              />
            </div>

            <div className="p-2 bg-white border rounded space-y-2">
              <span className="text-[10px] font-bold block text-slate-500">Pair Couple #2</span>
              <input 
                type="text" 
                placeholder="Left Concept: e.g. Moon" 
                value={chalPairLeft2} 
                onChange={(e) => setChalPairLeft2(e.target.value)}
                className="w-full p-1 border text-xs"
              />
              <input 
                type="text" 
                placeholder="Right Partner: e.g. Tides influence" 
                value={chalPairRight2} 
                onChange={(e) => setChalPairRight2(e.target.value)}
                className="w-full p-1 border text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* G: SORTER */}
      {chalType === 'sort_sequence' && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-black uppercase text-indigo-700">Chronological Sequencing</h4>
          <p className="text-[10px] text-slate-400">Write steps in their actual correct order. They will be shuffled dynamically in real gameplay.</p>
          
          <div className="space-y-2">
            <input 
              type="text" 
              placeholder="Step Correct Position 1" 
              value={chalSortStep1} 
              onChange={(e) => setChalSortStep1(e.target.value)}
              className="w-full p-2 bg-white border rounded text-xs"
            />
            <input 
              type="text" 
              placeholder="Step Correct Position 2" 
              value={chalSortStep2} 
              onChange={(e) => setChalSortStep2(e.target.value)}
              className="w-full p-2 bg-white border rounded text-xs"
            />
            <input 
              type="text" 
              placeholder="Step Correct Position 3" 
              value={chalSortStep3} 
              onChange={(e) => setChalSortStep3(e.target.value)}
              className="w-full p-2 bg-white border rounded text-xs"
            />
            <input 
              type="text" 
              placeholder="Step Correct Position 4" 
              value={chalSortStep4} 
              onChange={(e) => setChalSortStep4(e.target.value)}
              className="w-full p-2 bg-white border rounded text-xs"
            />
          </div>
        </div>
      )}

      {/* H: BUILD CONCEPT */}
      {chalType === 'build_concept' && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-black uppercase text-indigo-700">Interactive Concept Sentence Builder</h4>
          
          <div>
            <label className="block text-[10px] text-slate-500">Target Statement Answer Sentence</label>
            <input 
              type="text" 
              value={chalSentenceTarget} 
              onChange={(e) => setChalSentenceTarget(e.target.value)}
              className="w-full p-2 bg-white border rounded text-xs"
              placeholder="e.g. Gravity bends stellar light trajectories."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-400">Correct Order Chips (Comma Separated)</label>
              <input 
                type="text" 
                value={chalChipsValue} 
                onChange={(e) => setChalChipsValue(e.target.value)}
                className="w-full p-2 bg-white border rounded text-xs"
                placeholder="Gravity,bends,stellar,light"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400">Extra Distractor Chips (Comma Separated)</label>
              <input 
                type="text" 
                value={chalChipsDistractors} 
                onChange={(e) => setChalChipsDistractors(e.target.value)}
                className="w-full p-2 bg-white border rounded text-xs"
                placeholder="engine,boiler,steam"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
