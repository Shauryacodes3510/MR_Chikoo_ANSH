import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Trash2, Plus, ArrowUp, ArrowDown, HelpCircle, Award, Sparkles, MessageCircle, Volume2, Upload, Play, Pause, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface CategoryCFormsProps {
  chalType: string;
  // MCQ Options / General Answer Inputs
  chalMcqOptions: string[];
  setChalMcqOptions: (v: string[]) => void;
  chalMcqCorrect: string;
  setChalMcqCorrect: (v: string) => void;
  // Image URL
  chalImageUrl: string;
  setChalImageUrl: (v: string) => void;
  // C8 Images
  chalC8Images?: string[];
  setChalC8Images?: (v: string[]) => void;
  // Fill Blank
  chalFillBlankOptions: string[];
  setChalFillBlankOptions: (v: string[]) => void;
  chalFillBlankCorrect: string;
  setChalFillBlankCorrect: (v: string) => void;
  // Sentence Builder
  chalSentenceTarget: string;
  setChalSentenceTarget: (v: string) => void;
  chalChipsValue: string;
  setChalChipsValue: (v: string) => void;
  chalChipsDistractors: string;
  setChalChipsDistractors: (v: string) => void;
  // Concept Matcher (C4)
  chalConceptPairs: { left: string; right: string }[];
  setChalConceptPairs: (v: { left: string; right: string }[]) => void;
  // Bucket Sort (C5)
  chalDragBucket1: string;
  setChalDragBucket1: (v: string) => void;
  chalDragBucket2: string;
  setChalDragBucket2: (v: string) => void;
  chalBucketSortItems: { id: string; text: string; correct_bucket: 'b1' | 'b2' }[];
  setChalBucketSortItems: (v: { id: string; text: string; correct_bucket: 'b1' | 'b2' }[]) => void;
  // Timeline Sort / Sequence Builder (C6/C7)
  chalTimelineSteps: { id: string; text: string }[];
  setChalTimelineSteps: (v: { id: string; text: string }[]) => void;
  // Swipe
  chalSwipeLeftLabel: string;
  setChalSwipeLeftLabel: (v: string) => void;
  chalSwipeRightLabel: string;
  setChalSwipeRightLabel: (v: string) => void;
  // Image classification (C11)
  chalImgClassifyItems: { id: string; text: string; imageUrl?: string; correct_bucket: 'b1' | 'b2' }[];
  setChalImgClassifyItems: (v: { id: string; text: string; imageUrl?: string; correct_bucket: 'b1' | 'b2' }[]) => void;
  // Label Diagram (C12)
  chalC12Hotspots: { id: string; label: string; x: number; y: number; correct_bucket: string }[];
  setChalC12Hotspots: (v: { id: string; label: string; x: number; y: number; correct_bucket: string }[]) => void;
  chalC12Chips: { id: string; text: string }[];
  setChalC12Chips: (v: { id: string; text: string }[]) => void;
  // Hotspot Question (C13)
  chalC13Hotspots: { id: string; isCorrectSpot: boolean; x: number; y: number; description?: string }[];
  setChalC13Hotspots: (v: { id: string; isCorrectSpot: boolean; x: number; y: number; description?: string }[]) => void;
  // Memory Flip Cards (C14)
  chalC14Cards: { id: string; front: string; back: string }[];
  setChalC14Cards: (v: { id: string; front: string; back: string }[]) => void;
  // Drag complete diagram (C15)
  chalC15Steps: { id: string; text: string; isMissing?: boolean }[];
  setChalC15Steps: (v: { id: string; text: string; isMissing?: boolean }[]) => void;
  // Eliminate wrong (C16)
  chalC16Options: { id: string; text: string; isCorrect: boolean }[];
  setChalC16Options: (v: { id: string; text: string; isCorrect: boolean }[]) => void;
  // Arrange images (C17)
  chalC17Items: { id: string; imageUrl: string; caption?: string }[];
  setChalC17Items: (v: { id: string; imageUrl: string; caption?: string }[]) => void;
  // Audio quiz (C18)
  chalAudioUrl: string;
  setChalAudioUrl: (v: string) => void;

  // Shared Parameters
  chalHint: string;
  setChalHint: (v: string) => void;
  chalDifficulty: 'easy' | 'medium' | 'hard';
  setChalDifficulty: (v: 'easy' | 'medium' | 'hard') => void;
  chalContinueText: string;
  setChalContinueText: (v: string) => void;
  chalMascotMessage: string;
  setChalMascotMessage: (v: string) => void;
  chalExplanation: string;
  setChalExplanation: (v: string) => void;
  chalExplanationConfused: string;
  setChalExplanationConfused: (v: string) => void;
  chalExplanationConcept: string;
  setChalExplanationConcept: (v: string) => void;
  chalExplanationExample: string;
  setChalExplanationExample: (v: string) => void;
  chalExplanationTakeaway: string;
  setChalExplanationTakeaway: (v: string) => void;
  chalExplanationSpeechScript: string;
  setChalExplanationSpeechScript: (v: string) => void;
  chalQuestion: string;
  chalXpValue: number;
  setChalXpValue: (v: number) => void;
  // Explanation Audio
  explanationAudioUrl?: string;
  setExplanationAudioUrl?: (v: string) => void;
  explanationAudioDuration?: number;
  setExplanationAudioDuration?: (v: number) => void;

  // Marathi parallel props
  chalExplanationMarathi: string;
  setChalExplanationMarathi: (v: string) => void;
  chalExplanationMarathiConfused: string;
  setChalExplanationMarathiConfused: (v: string) => void;
  chalExplanationMarathiConcept: string;
  setChalExplanationMarathiConcept: (v: string) => void;
  chalExplanationMarathiExample: string;
  setChalExplanationMarathiExample: (v: string) => void;
  chalExplanationMarathiTakeaway: string;
  setChalExplanationMarathiTakeaway: (v: string) => void;
  chalExplanationMarathiSpeechScript: string;
  setChalExplanationMarathiSpeechScript: (v: string) => void;
  explanationAudioUrlMarathi?: string;
  setExplanationAudioUrlMarathi?: (v: string) => void;
  explanationAudioDurationMarathi?: number;
  setExplanationAudioDurationMarathi?: (v: number) => void;
}

export const CategoryCForms: React.FC<CategoryCFormsProps> = ({
  chalType,
  chalMcqOptions,
  setChalMcqOptions,
  chalMcqCorrect,
  setChalMcqCorrect,
  chalImageUrl,
  setChalImageUrl,
  chalC8Images,
  setChalC8Images,
  chalFillBlankOptions,
  setChalFillBlankOptions,
  chalFillBlankCorrect,
  setChalFillBlankCorrect,
  chalSentenceTarget,
  setChalSentenceTarget,
  chalChipsValue,
  setChalChipsValue,
  chalChipsDistractors,
  setChalChipsDistractors,
  chalConceptPairs,
  setChalConceptPairs,
  chalDragBucket1,
  setChalDragBucket1,
  chalDragBucket2,
  setChalDragBucket2,
  chalBucketSortItems,
  setChalBucketSortItems,
  chalTimelineSteps,
  setChalTimelineSteps,
  chalSwipeLeftLabel,
  setChalSwipeLeftLabel,
  chalSwipeRightLabel,
  setChalSwipeRightLabel,
  chalImgClassifyItems,
  setChalImgClassifyItems,
  chalC12Hotspots,
  setChalC12Hotspots,
  chalC12Chips,
  setChalC12Chips,
  chalC13Hotspots,
  setChalC13Hotspots,
  chalC14Cards,
  setChalC14Cards,
  chalC15Steps,
  setChalC15Steps,
  chalC16Options,
  setChalC16Options,
  chalC17Items,
  setChalC17Items,
  chalAudioUrl,
  setChalAudioUrl,
  chalHint,
  setChalHint,
  chalDifficulty,
  setChalDifficulty,
  chalContinueText,
  setChalContinueText,
  chalMascotMessage,
  setChalMascotMessage,
  chalExplanation,
  setChalExplanation,
  chalExplanationConfused = '',
  setChalExplanationConfused,
  chalExplanationConcept = '',
  setChalExplanationConcept,
  chalExplanationExample = '',
  setChalExplanationExample,
  chalExplanationTakeaway = '',
  setChalExplanationTakeaway,
  chalExplanationSpeechScript = '',
  setChalExplanationSpeechScript,
  chalQuestion,
  chalXpValue,
  setChalXpValue,
  explanationAudioUrl = '',
  setExplanationAudioUrl = () => {},
  explanationAudioDuration = 0,
  setExplanationAudioDuration = () => {},

  chalExplanationMarathi = '',
  setChalExplanationMarathi,
  chalExplanationMarathiConfused = '',
  setChalExplanationMarathiConfused,
  chalExplanationMarathiConcept = '',
  setChalExplanationMarathiConcept,
  chalExplanationMarathiExample = '',
  setChalExplanationMarathiExample,
  chalExplanationMarathiTakeaway = '',
  setChalExplanationMarathiTakeaway,
  chalExplanationMarathiSpeechScript = '',
  setChalExplanationMarathiSpeechScript,
  explanationAudioUrlMarathi = '',
  setExplanationAudioUrlMarathi = () => {},
  explanationAudioDurationMarathi = 0,
  setExplanationAudioDurationMarathi = () => {},
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [activeLangTab, setActiveLangTab] = useState<'hinglish' | 'marathi'>('hinglish');
  const [isGeneratingMarathi, setIsGeneratingMarathi] = useState(false);
  const [generationErrorMarathi, setGenerationErrorMarathi] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isVoiceGenerating, setIsVoiceGenerating] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const fileInputRefMarathi = useRef<HTMLInputElement | null>(null);
  const previewAudioRefMarathi = useRef<HTMLAudioElement | null>(null);
  const [isVoiceGeneratingMarathi, setIsVoiceGeneratingMarathi] = useState(false);
  const [isPreviewPlayingMarathi, setIsPreviewPlayingMarathi] = useState(false);
  const [voiceErrorMarathi, setVoiceErrorMarathi] = useState<string | null>(null);

  const getAudioDurationHelper = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const audio = new Audio(url);
      audio.addEventListener('canplaythrough', () => {
        resolve(audio.duration || 0);
        URL.revokeObjectURL(url);
      });
      audio.addEventListener('error', () => {
        resolve(0);
        URL.revokeObjectURL(url);
      });
    });
  };

  const detectJargon = (text: string) => {
    const safeText = text || '';
    const jargonWords = [
      'matrix', 'matrices', 'algorithm', 'computational', 'heuristic', 'neural network', 
      'backpropagation', 'hyperparameter', 'gradient descent', 'deterministic', 'stochastic',
      'vectorization', 'paradigm', 'asymptotic', 'polynomial', 'combinatorics', 'encapsulation',
      'polymorphism', 'asynchronous', 'synchronous', 'architecture', 'infrastructure', 'backend'
    ];
    const found = jargonWords.filter(w => safeText.toLowerCase().includes(w));
    return found;
  };

  const detectVoiceReadiness = (text: string) => {
    const safeText = text || '';
    const friendlyWords = ["oh", "no worries", "think of it", "look!", "aha", "wow", "let's", "simple", "fun", "easy", "buddy", "super", "hey"];
    const found = friendlyWords.some(w => safeText.toLowerCase().includes(w));
    return found;
  };

  // Reorder helper for lists
  const moveItem = <T,>(list: T[], index: number, direction: 'up' | 'down', setList: (v: T[]) => void) => {
    const newList = [...list];
    if (direction === 'up' && index > 0) {
      [newList[index], newList[index - 1]] = [newList[index - 1], newList[index]];
    } else if (direction === 'down' && index < newList.length - 1) {
      [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    }
    setList(newList);
  };

  return (
    <div className="space-y-6">
      {/* 1. DYNAMIC CATEGORY C SUB-FORMS */}
      <div className="border-b border-slate-200 pb-2">
        <span className="text-[10px] font-black uppercase text-indigo-750 tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
          {chalType.replace('_', ' ').toUpperCase()} CONFIGURATOR
        </span>
      </div>

      {/* C1 — Multiple Choice */}
      {chalType === 'c1_multiple_choice' && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
          <h4 className="text-xs font-black uppercase text-indigo-700">C1: Multiple Choice Options</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {chalMcqOptions.map((opt, idx) => (
              <div key={idx} className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500">Option Card #{idx + 1} *</label>
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
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-500">Correct Option String *</label>
            <select
              value={chalMcqCorrect}
              onChange={(e) => setChalMcqCorrect(e.target.value)}
              className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs outline-none"
              required
            >
              <option value="">-- Select Correct Option --</option>
              {chalMcqOptions.filter(Boolean).map((opt, idx) => (
                <option key={idx} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* C2 — Fill in the Blank */}
      {chalType === 'c2_fill_in_blank' && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
          <h4 className="text-xs font-black uppercase text-indigo-700">C2: Fill-In-The-Blank Config</h4>
          <p className="text-[10px] text-slate-400">Put a <code className="bg-slate-100 px-1 font-mono text-indigo-600">[BLANK]</code> tag in your Question Prompt above where the option drops!</p>
          <div className="grid grid-cols-2 gap-3">
            {chalFillBlankOptions.map((opt, idx) => (
              <div key={idx} className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500">Word Chip #{idx + 1} *</label>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...chalFillBlankOptions];
                    newOpts[idx] = e.target.value;
                    setChalFillBlankOptions(newOpts);
                  }}
                  placeholder={`Word Chip ${idx + 1}`}
                  className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs"
                  required={idx < 2}
                />
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-500">Correct Drop Word *</label>
            <select
              value={chalFillBlankCorrect}
              onChange={(e) => setChalFillBlankCorrect(e.target.value)}
              className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs outline-none"
              required
            >
              <option value="">-- Select Correct Word --</option>
              {chalFillBlankOptions.filter(Boolean).map((opt, idx) => (
                <option key={idx} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* C3 — Sentence Builder */}
      {chalType === 'c3_sentence_builder' && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
          <h4 className="text-xs font-black uppercase text-indigo-700">C3: Sentence Builder Config</h4>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-500">Complete Correct Sentence *</label>
            <input
              type="text"
              value={chalSentenceTarget}
              onChange={(e) => setChalSentenceTarget(e.target.value)}
              placeholder="e.g. AI learns from structured clean data."
              className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs"
              required
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold text-slate-500">Correct Order Word Chips (Comma Separated)</label>
              <button
                type="button"
                onClick={() => {
                  if (chalSentenceTarget) {
                    const words = String(chalSentenceTarget || '').split(' ').map(w => String(w || '').trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")).filter(Boolean);
                    setChalChipsValue(words.join(','));
                  }
                }}
                className="text-[10px] text-indigo-600 hover:underline font-bold"
              >
                Auto Split Sentence
              </button>
            </div>
            <input
              type="text"
              value={chalChipsValue}
              onChange={(e) => setChalChipsValue(e.target.value)}
              placeholder="AI,learns,from,data"
              className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-500">Distractor Chips (Comma Separated)</label>
            <input
              type="text"
              value={chalChipsDistractors}
              onChange={(e) => setChalChipsDistractors(e.target.value)}
              placeholder="boiler,engine,carbon,fakes"
              className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs"
            />
          </div>
        </div>
      )}

      {/* C4 — Concept Matcher */}
      {chalType === 'c4_concept_matcher' && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-indigo-700">C4: Concept Matcher Pairs</h4>
            <button
              type="button"
              onClick={() => setChalConceptPairs([...chalConceptPairs, { left: '', right: '' }])}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded"
            >
              <Plus size={12} /> Add Pair
            </button>
          </div>
          <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
            {chalConceptPairs.map((pair, idx) => (
              <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-slate-200">
                <input
                  type="text"
                  placeholder="Term (Left)"
                  value={pair.left}
                  onChange={(e) => {
                    const newPairs = [...chalConceptPairs];
                    newPairs[idx].left = e.target.value;
                    setChalConceptPairs(newPairs);
                  }}
                  className="flex-1 bg-slate-50 border border-slate-200 p-1.5 rounded text-xs"
                  required
                />
                <input
                  type="text"
                  placeholder="Meaning (Right)"
                  value={pair.right}
                  onChange={(e) => {
                    const newPairs = [...chalConceptPairs];
                    newPairs[idx].right = e.target.value;
                    setChalConceptPairs(newPairs);
                  }}
                  className="flex-1 bg-slate-50 border border-slate-200 p-1.5 rounded text-xs"
                  required
                />
                {chalConceptPairs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setChalConceptPairs(chalConceptPairs.filter((_, i) => i !== idx))}
                    className="p-1.5 hover:bg-rose-50 text-rose-500 rounded"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* C5 — Bucket Sort */}
      {chalType === 'c5_bucket_sort' && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
          <h4 className="text-xs font-black uppercase text-indigo-700">C5: Bucket Sorting Config</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500">Bucket #1 Name *</label>
              <input
                type="text"
                value={chalDragBucket1}
                onChange={(e) => setChalDragBucket1(e.target.value)}
                placeholder="e.g. AI Outputs"
                className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs font-bold"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500">Bucket #2 Name *</label>
              <input
                type="text"
                value={chalDragBucket2}
                onChange={(e) => setChalDragBucket2(e.target.value)}
                placeholder="e.g. Human Outputs"
                className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs font-bold"
                required
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold text-slate-500">Classification Items</label>
              <button
                type="button"
                onClick={() => setChalBucketSortItems([...chalBucketSortItems, { id: 'item_' + Date.now(), text: '', correct_bucket: 'b1' }])}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded"
              >
                <Plus size={12} /> Add Item
              </button>
            </div>
            <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar">
              {chalBucketSortItems.map((item, idx) => (
                <div key={item.id} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-slate-200">
                  <input
                    type="text"
                    placeholder="Sorting element text"
                    value={item.text}
                    onChange={(e) => {
                      const newItems = [...chalBucketSortItems];
                      newItems[idx].text = e.target.value;
                      setChalBucketSortItems(newItems);
                    }}
                    className="flex-1 bg-slate-50 border border-slate-200 p-1.5 rounded text-xs"
                    required
                  />
                  <select
                    value={item.correct_bucket}
                    onChange={(e) => {
                      const newItems = [...chalBucketSortItems];
                      newItems[idx].correct_bucket = e.target.value as 'b1' | 'b2';
                      setChalBucketSortItems(newItems);
                    }}
                    className="bg-slate-50 border border-slate-200 p-1.5 rounded text-xs text-slate-700 outline-none"
                  >
                    <option value="b1">{chalDragBucket1 || 'Bucket 1'}</option>
                    <option value="b2">{chalDragBucket2 || 'Bucket 2'}</option>
                  </select>
                  {chalBucketSortItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setChalBucketSortItems(chalBucketSortItems.filter(itm => itm.id !== item.id))}
                      className="p-1.5 hover:bg-rose-50 text-rose-500 rounded"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* C6 Timeline Sort & C7 Sequence Builder */}
      {(chalType === 'c6_timeline_sort' || chalType === 'c7_sequence_builder') && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-indigo-700">
              {chalType === 'c6_timeline_sort' ? 'C6: Timeline Sequence Steps' : 'C7: Assembly Sequence Steps'}
            </h4>
            <button
              type="button"
              onClick={() => setChalTimelineSteps([...chalTimelineSteps, { id: 'step_' + Date.now(), text: '' }])}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded"
            >
              <Plus size={12} /> Add Step
            </button>
          </div>
          <p className="text-[10px] text-slate-400">Specify steps in their absolute CORRECT chronological or functional sequence (top to bottom). They will shuffle automatically for students!</p>
          
          <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
            {chalTimelineSteps.map((step, idx) => (
              <div key={step.id} className="flex gap-1.5 items-center bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 w-5 text-center">#{idx + 1}</span>
                <input
                  type="text"
                  placeholder={`Step action description`}
                  value={step.text}
                  onChange={(e) => {
                    const newSteps = [...chalTimelineSteps];
                    newSteps[idx].text = e.target.value;
                    setChalTimelineSteps(newSteps);
                  }}
                  className="flex-1 bg-slate-50 border border-slate-200 p-1.5 rounded text-xs"
                  required
                />
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveItem(chalTimelineSteps, idx, 'up', setChalTimelineSteps)}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === chalTimelineSteps.length - 1}
                    onClick={() => moveItem(chalTimelineSteps, idx, 'down', setChalTimelineSteps)}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>
                {chalTimelineSteps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setChalTimelineSteps(chalTimelineSteps.filter(s => s.id !== step.id))}
                    className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* C8 — Tap Correct Object */}
      {chalType === 'c8_tap_correct_object' && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
          <h4 className="text-xs font-black uppercase text-indigo-700">C8: Tap Correct Object Configuration</h4>
          <p className="text-[10px] text-slate-400">Define a set of interactive items below. The student must select the correct target element!</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {chalMcqOptions.map((opt, idx) => (
              <div key={idx} className="space-y-1.5 p-2 bg-white rounded-lg border border-slate-200">
                <label className="block text-[10px] font-bold text-slate-500">Object Card #{idx + 1} *</label>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...chalMcqOptions];
                    newOpts[idx] = e.target.value;
                    setChalMcqOptions(newOpts);
                  }}
                  placeholder={`Object Label ${idx + 1}`}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs"
                  required={idx < 2}
                />
                <label className="block text-[9px] font-bold text-slate-400">Card Image URL (Optional)</label>
                <input
                  type="text"
                  value={chalC8Images?.[idx] || ''}
                  onChange={(e) => {
                    const newImgs = chalC8Images ? [...chalC8Images] : ['', '', '', ''];
                    newImgs[idx] = e.target.value;
                    setChalC8Images?.(newImgs);
                  }}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-slate-50 border border-slate-200 p-1.5 rounded text-[10px] font-mono"
                />
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-500">Target Correct Object *</label>
            <select
              value={chalMcqCorrect}
              onChange={(e) => setChalMcqCorrect(e.target.value)}
              className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs outline-none"
              required
            >
              <option value="">-- Select Correct Object --</option>
              {chalMcqOptions.filter(Boolean).map((opt, idx) => (
                <option key={idx} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* C9 — True / False */}
      {chalType === 'c9_true_false' && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
          <h4 className="text-xs font-black uppercase text-indigo-700">C9: True / False Evaluator</h4>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500">Asserted Claim Correct Answer *</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setChalMcqCorrect('true')}
                className={`flex-1 py-2 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
                  String(chalMcqCorrect || '').trim().toLowerCase() === 'true'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-250 hover:bg-slate-50'
                }`}
              >
                True
              </button>
              <button
                type="button"
                onClick={() => setChalMcqCorrect('false')}
                className={`flex-1 py-2 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
                  String(chalMcqCorrect || '').trim().toLowerCase() === 'false'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-250 hover:bg-slate-50'
                }`}
              >
                False
              </button>
            </div>
          </div>
        </div>
      )}

      {/* C10 — Swipe Left / Right */}
      {chalType === 'c10_swipe_left_right' && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
          <h4 className="text-xs font-black uppercase text-indigo-700">C10: Swipe Decision Config</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500">Left Action Label *</label>
              <input
                type="text"
                value={chalSwipeLeftLabel}
                onChange={(e) => setChalSwipeLeftLabel(e.target.value)}
                placeholder="e.g. Disagree"
                className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs font-bold"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500">Right Action Label *</label>
              <input
                type="text"
                value={chalSwipeRightLabel}
                onChange={(e) => setChalSwipeRightLabel(e.target.value)}
                placeholder="e.g. Agree"
                className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs font-bold"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-200">
            <label className="block text-[10px] font-bold text-slate-500">Correct Swipe Action *</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setChalMcqCorrect('left')}
                className={`flex-1 py-2 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
                  String(chalMcqCorrect || '').trim().toLowerCase() === 'left'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-250 hover:bg-slate-50'
                }`}
              >
                Swipe Left ({chalSwipeLeftLabel || 'Left'})
              </button>
              <button
                type="button"
                onClick={() => setChalMcqCorrect('right')}
                className={`flex-1 py-2 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
                  String(chalMcqCorrect || '').trim().toLowerCase() === 'right'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-250 hover:bg-slate-50'
                }`}
              >
                Swipe Right ({chalSwipeRightLabel || 'Right'})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* C11 — Image Classification */}
      {chalType === 'c11_image_classification' && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
          <h4 className="text-xs font-black uppercase text-indigo-700">C11: Image Sorting Buckets</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500">Bucket #1 Category Name *</label>
              <input
                type="text"
                value={chalDragBucket1}
                onChange={(e) => setChalDragBucket1(e.target.value)}
                placeholder="Category A"
                className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs font-bold"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500">Bucket #2 Category Name *</label>
              <input
                type="text"
                value={chalDragBucket2}
                onChange={(e) => setChalDragBucket2(e.target.value)}
                placeholder="Category B"
                className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs font-bold"
                required
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold text-slate-500">Visual Image Cards</label>
              <button
                type="button"
                onClick={() => setChalImgClassifyItems([...chalImgClassifyItems, { id: 'img_' + Date.now(), text: '', imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150', correct_bucket: 'b1' }])}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded"
              >
                <Plus size={12} /> Add Image
              </button>
            </div>
            
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto custom-scrollbar">
              {chalImgClassifyItems.map((item, idx) => (
                <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex gap-2 items-center">
                    <span className="text-[10px] font-bold text-slate-400">Card #{idx + 1}</span>
                    <input
                      type="text"
                      placeholder="Image Caption / Description"
                      value={item.text}
                      onChange={(e) => {
                        const newItems = [...chalImgClassifyItems];
                        newItems[idx].text = e.target.value;
                        setChalImgClassifyItems(newItems);
                      }}
                      className="flex-1 bg-slate-50 border border-slate-200 p-1.5 rounded text-xs"
                      required
                    />
                    <select
                      value={item.correct_bucket}
                      onChange={(e) => {
                        const newItems = [...chalImgClassifyItems];
                        newItems[idx].correct_bucket = e.target.value as 'b1' | 'b2';
                        setChalImgClassifyItems(newItems);
                      }}
                      className="bg-slate-50 border border-slate-200 p-1.5 rounded text-xs text-slate-700 outline-none"
                    >
                      <option value="b1">{chalDragBucket1 || 'Category 1'}</option>
                      <option value="b2">{chalDragBucket2 || 'Category 2'}</option>
                    </select>
                    {chalImgClassifyItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setChalImgClassifyItems(chalImgClassifyItems.filter(itm => itm.id !== item.id))}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] text-slate-400 font-semibold">Asset URL *</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={item.imageUrl || ''}
                      onChange={(e) => {
                        const newItems = [...chalImgClassifyItems];
                        newItems[idx].imageUrl = e.target.value;
                        setChalImgClassifyItems(newItems);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 p-1 rounded text-[11px] font-mono"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* C12 — Label Diagram */}
      {chalType === 'c12_label_diagram' && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
          <h4 className="text-xs font-black uppercase text-indigo-700">C12: Diagram Labeling Studio</h4>
          
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-500">Diagram Backdrop Image URL *</label>
            <input
              type="text"
              value={chalImageUrl}
              onChange={(e) => setChalImageUrl(e.target.value)}
              placeholder="e.g. https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600"
              className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs"
              required
            />
          </div>

          <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 space-y-2">
            <label className="block text-[10.5px] font-black text-indigo-800 uppercase tracking-wider flex items-center gap-1">
              🏷️ Step 1: Manage Labels (Chips)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. CPU Core"
                className="flex-1 bg-white border border-slate-250 p-2 rounded-lg text-xs outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = e.currentTarget.value.trim();
                    if (val) {
                      setChalC12Chips([...chalC12Chips, { id: 'chip_' + Date.now(), text: val }]);
                      e.currentTarget.value = '';
                    }
                  }
                }}
                id="c12_chip_input"
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('c12_chip_input') as HTMLInputElement;
                  if (input && input.value.trim()) {
                    setChalC12Chips([...chalC12Chips, { id: 'chip_' + Date.now(), text: input.value.trim() }]);
                    input.value = '';
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 rounded-lg cursor-pointer"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1 mt-1 max-h-[85px] overflow-y-auto custom-scrollbar">
              {chalC12Chips.map(c => (
                <span key={c.id} className="inline-flex items-center gap-1 bg-white text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md text-[11px] font-extrabold shadow-3xs">
                  {c.text}
                  <button
                    type="button"
                    onClick={() => {
                      setChalC12Chips(chalC12Chips.filter(itm => itm.id !== c.id));
                      setChalC12Hotspots(chalC12Hotspots.map(h => h.correct_bucket === c.id ? { ...h, correct_bucket: '' } : h));
                    }}
                    className="text-indigo-400 hover:text-indigo-600 font-black ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {chalImageUrl && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center space-y-2">
              <label className="block text-[10.5px] font-black text-slate-300 uppercase tracking-wider text-left">
                📍 Step 2: Interactive Hotspot Mapper (Click backdrop to place points)
              </label>
              <div
                className="relative border border-dashed border-slate-700 rounded-lg overflow-hidden cursor-crosshair bg-slate-950 mx-auto"
                style={{ maxHeight: '280px' }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                  const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                  
                  const newSpot = {
                    id: 'hs_' + Date.now(),
                    label: 'Target Label Point ' + (chalC12Hotspots.length + 1),
                    x,
                    y,
                    correct_bucket: chalC12Chips[0]?.id || ''
                  };
                  setChalC12Hotspots([...chalC12Hotspots, newSpot]);
                }}
              >
                <img
                  src={chalImageUrl}
                  alt="Backdrop Setup"
                  className="w-full h-auto object-contain max-h-[280px] mx-auto select-none pointer-events-none"
                  referrerPolicy="no-referrer"
                />
                {chalC12Hotspots.map((spot, idx) => {
                  const chip = chalC12Chips.find(c => c.id === spot.correct_bucket);
                  return (
                    <div
                      key={spot.id}
                      className="absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full bg-indigo-600 border-2 border-white shadow-lg flex items-center justify-center text-xs font-black text-white hover:scale-115 transition-transform"
                      style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                      title={`📍 #${idx+1}: Maps to ${chip?.text || 'Not Assigned'}`}
                      onClick={(evt) => evt.stopPropagation()}
                    >
                      {idx + 1}
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1.5 text-left max-h-[140px] overflow-y-auto custom-scrollbar">
                {chalC12Hotspots.map((spot, idx) => (
                  <div key={spot.id} className="flex items-center gap-1.5 bg-slate-800 p-2 rounded-lg border border-slate-750">
                    <span className="text-[10px] font-bold text-slate-400 w-16 shrink-0">📍 Pin #{idx + 1} ({spot.x}%, {spot.y}%)</span>
                    <select
                      value={spot.correct_bucket}
                      onChange={(e) => {
                        const updated = chalC12Hotspots.map(s => s.id === spot.id ? { ...s, correct_bucket: e.target.value } : s);
                        setChalC12Hotspots(updated);
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 text-slate-300 p-1.5 rounded text-xs outline-none"
                    >
                      <option value="">-- Connect Match Tag --</option>
                      {chalC12Chips.map(c => (
                        <option key={c.id} value={c.id}>{c.text}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setChalC12Hotspots(chalC12Hotspots.filter(s => s.id !== spot.id))}
                      className="p-1 text-rose-400 hover:text-rose-500 rounded"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* C13 — Hotspot Question */}
      {chalType === 'c13_hotspot_question' && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
          <h4 className="text-xs font-black uppercase text-indigo-700">C13: Hotspot Mapper Editor</h4>
          
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-500">Active Map Background Image URL *</label>
            <input
              type="text"
              value={chalImageUrl}
              onChange={(e) => setChalImageUrl(e.target.value)}
              placeholder="e.g. https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600"
              className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs"
              required
            />
          </div>

          {chalImageUrl && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center space-y-2">
              <label className="block text-[10.5px] font-black text-slate-300 uppercase tracking-wider text-left">
                🗺️ Active Click Board (Click anywhere to anchor a hotspot area)
              </label>
              <div
                className="relative border border-dashed border-slate-700 rounded-lg overflow-hidden cursor-crosshair bg-slate-950 mx-auto"
                style={{ maxHeight: '280px' }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                  const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                  
                  const newSpot = {
                    id: 'hs_' + Date.now(),
                    isCorrectSpot: chalC13Hotspots.length === 0, // default first to correct
                    x,
                    y,
                    description: 'Interactive Area ' + (chalC13Hotspots.length + 1)
                  };
                  setChalC13Hotspots([...chalC13Hotspots, newSpot]);
                }}
              >
                <img
                  src={chalImageUrl}
                  alt="Backdrop Setup"
                  className="w-full h-auto object-contain max-h-[280px] mx-auto select-none pointer-events-none"
                  referrerPolicy="no-referrer"
                />
                {chalC13Hotspots.map((spot, idx) => (
                  <div
                    key={spot.id}
                    className={`absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-black text-white hover:scale-115 transition-all ${
                      spot.isCorrectSpot ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                    style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                    title={`📍 Area #${idx+1}: ${spot.description} (${spot.isCorrectSpot ? 'CORRECT' : 'WRONG'})`}
                    onClick={(evt) => evt.stopPropagation()}
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 text-left max-h-[140px] overflow-y-auto custom-scrollbar">
                {chalC13Hotspots.map((spot, idx) => (
                  <div key={spot.id} className="flex items-center gap-1.5 bg-slate-800 p-2 rounded-lg border border-slate-750">
                    <span className="text-[10px] font-bold text-slate-400 w-16 shrink-0">📍 Area #{idx + 1} ({spot.x}%, {spot.y}%)</span>
                    <input
                      type="text"
                      value={spot.description || ''}
                      onChange={(e) => {
                        const updated = chalC13Hotspots.map(s => s.id === spot.id ? { ...s, description: e.target.value } : s);
                        setChalC13Hotspots(updated);
                      }}
                      placeholder="e.g. Navigation cockpit"
                      className="flex-1 bg-slate-900 border border-slate-700 text-slate-300 p-1 rounded text-xs outline-none"
                      required
                    />
                    <label className="flex items-center gap-1 text-[10px] font-black text-slate-400 shrink-0 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={spot.isCorrectSpot}
                        onChange={(e) => {
                          const updated = chalC13Hotspots.map(s => s.id === spot.id ? { ...s, isCorrectSpot: e.target.checked } : s);
                          setChalC13Hotspots(updated);
                        }}
                        className="rounded accent-emerald-500"
                      />
                      Correct
                    </label>
                    <button
                      type="button"
                      onClick={() => setChalC13Hotspots(chalC13Hotspots.filter(s => s.id !== spot.id))}
                      className="p-1 text-rose-400 hover:text-rose-500 rounded"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[10.5px] text-slate-400 font-semibold italic text-left">💡 Emerald elements designate valid correct click areas, rose designates distractors.</p>
            </div>
          )}
        </div>
      )}

      {/* C14 — Memory Flip Cards */}
      {chalType === 'c14_memory_flip_cards' && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-indigo-700">C14: Memory Grid Pairs</h4>
            <button
              type="button"
              onClick={() => setChalC14Cards([...chalC14Cards, { id: 'card_' + Date.now(), front: '', back: '' }])}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded"
            >
              <Plus size={12} /> Add Pair
            </button>
          </div>
          <p className="text-[10px] text-slate-400">Add interactive flip concept-pairs. Support plain text or image URLs!</p>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto custom-scrollbar">
            {chalC14Cards.map((card, idx) => (
              <div key={card.id} className="flex gap-2 items-center bg-white p-2.5 rounded-lg border border-slate-200">
                <input
                  type="text"
                  placeholder="Card A: Text or Image Link"
                  value={card.front}
                  onChange={(e) => {
                    const updated = [...chalC14Cards];
                    updated[idx].front = e.target.value;
                    setChalC14Cards(updated);
                  }}
                  className="flex-1 bg-slate-50 border border-slate-200 p-1.5 rounded text-xs"
                  required
                />
                <input
                  type="text"
                  placeholder="Match Card B: Text or Image Link"
                  value={card.back}
                  onChange={(e) => {
                    const updated = [...chalC14Cards];
                    updated[idx].back = e.target.value;
                    setChalC14Cards(updated);
                  }}
                  className="flex-1 bg-slate-50 border border-slate-200 p-1.5 rounded text-xs"
                  required
                />
                {chalC14Cards.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setChalC14Cards(chalC14Cards.filter(c => c.id !== card.id))}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* C15 — Drag Complete Diagram */}
      {chalType === 'c15_drag_complete_diagram' && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
          <h4 className="text-xs font-black uppercase text-indigo-700">C15: Flow Diagram Blank Completer</h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold text-slate-500">Flowchart Steps *</label>
              <button
                type="button"
                onClick={() => setChalC15Steps([...chalC15Steps, { id: 'step_' + Date.now(), text: '', isMissing: false }])}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded"
              >
                <Plus size={12} /> Add Step
              </button>
            </div>
            
            <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar">
              {chalC15Steps.map((step, idx) => (
                <div key={step.id} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 w-5 text-center">#{idx + 1}</span>
                  <input
                    type="text"
                    placeholder="Step process definition"
                    value={step.text}
                    onChange={(e) => {
                      const updated = [...chalC15Steps];
                      updated[idx].text = e.target.value;
                      setChalC15Steps(updated);
                    }}
                    className="flex-1 bg-slate-50 border border-slate-200 p-1.5 rounded text-xs"
                    required
                  />
                  <label className="flex items-center gap-1 text-[10px] font-black text-slate-550 shrink-0 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={step.isMissing || false}
                      onChange={(e) => {
                        const updated = chalC15Steps.map((s, i) => i === idx ? { ...s, isMissing: e.target.checked } : { ...s, isMissing: false });
                        setChalC15Steps(updated);
                        if (e.target.checked && step.text) {
                          setChalMcqCorrect(step.text);
                        }
                      }}
                      className="rounded accent-indigo-600"
                    />
                    Is Blank Space
                  </label>
                  {chalC15Steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setChalC15Steps(chalC15Steps.filter(s => s.id !== step.id))}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3.5 pt-2 border-t border-slate-200">
            <label className="block text-[10.5px] font-bold text-indigo-700">Missing Gap Options (Select Choices)</label>
            <div className="grid grid-cols-2 gap-3">
              {chalMcqOptions.map((opt, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">Choice #{idx + 1} *</label>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...chalMcqOptions];
                      newOpts[idx] = e.target.value;
                      setChalMcqOptions(newOpts);
                    }}
                    placeholder={`Choice Option ${idx + 1}`}
                    className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs"
                    required={idx < 2}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500">Correct Choice (Matching Correct Missing Value) *</label>
              <select
                value={chalMcqCorrect}
                onChange={(e) => setChalMcqCorrect(e.target.value)}
                className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs outline-none"
                required
              >
                <option value="">-- Choose Correct Drop Option --</option>
                {chalMcqOptions.filter(Boolean).map((opt, idx) => (
                  <option key={idx} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* C16 — Eliminate Wrong */}
      {chalType === 'c16_eliminate_wrong' && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-indigo-700">C16: Cross-Out options</h4>
            <button
              type="button"
              onClick={() => setChalC16Options([...chalC16Options, { id: 'opt_' + Date.now(), text: '', isCorrect: true }])}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded"
            >
              <Plus size={12} /> Add Option
            </button>
          </div>
          <p className="text-[10px] text-slate-400">Students tap incorrect entries to strike them through. True statements must remain un-eliminated.</p>

          <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
            {chalC16Options.map((opt, idx) => (
              <div key={opt.id} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-slate-200">
                <input
                  type="text"
                  placeholder="Statement / Option sentence"
                  value={opt.text}
                  onChange={(e) => {
                    const updated = [...chalC16Options];
                    updated[idx].text = e.target.value;
                    setChalC16Options(updated);
                  }}
                  className="flex-1 bg-slate-50 border border-slate-200 p-1.5 rounded text-xs"
                  required
                />
                <select
                  value={opt.isCorrect ? 'correct' : 'wrong'}
                  onChange={(e) => {
                    const updated = [...chalC16Options];
                    updated[idx].isCorrect = e.target.value === 'correct';
                    setChalC16Options(updated);
                  }}
                  className="bg-slate-50 border border-slate-200 p-1.5 rounded text-xs outline-none"
                >
                  <option value="correct">Valid (Keep)</option>
                  <option value="wrong">Hallucinated (Eliminate)</option>
                </select>
                {chalC16Options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setChalC16Options(chalC16Options.filter(o => o.id !== opt.id))}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* C17 — Arrange Images */}
      {chalType === 'c17_arrange_images' && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-indigo-700">C17: Arrange Pictures</h4>
            <button
              type="button"
              onClick={() => setChalC17Items([...chalC17Items, { id: 'item_' + Date.now(), imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150', caption: '' }])}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded"
            >
              <Plus size={12} /> Add Picture
            </button>
          </div>
          <p className="text-[10px] text-slate-400">Position images in their CORRECT logical order. Controls allow drag-or-up/down sorting.</p>

          <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar">
            {chalC17Items.map((item, idx) => (
              <div key={item.id} className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex gap-2 items-center">
                  <span className="text-[10px] font-black text-slate-450 w-5">#{idx + 1}</span>
                  <input
                    type="text"
                    placeholder="Brief description / Caption"
                    value={item.caption || ''}
                    onChange={(e) => {
                      const updated = [...chalC17Items];
                      updated[idx].caption = e.target.value;
                      setChalC17Items(updated);
                    }}
                    className="flex-1 bg-slate-50 border border-slate-200 p-1 rounded text-xs"
                  />
                  <div className="flex gap-0.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveItem(chalC17Items, idx, 'up', setChalC17Items)}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === chalC17Items.length - 1}
                      onClick={() => moveItem(chalC17Items, idx, 'down', setChalC17Items)}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    >
                      <ArrowDown size={12} />
                    </button>
                  </div>
                  {chalC17Items.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setChalC17Items(chalC17Items.filter(i => i.id !== item.id))}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Image URL *"
                    value={item.imageUrl}
                    onChange={(e) => {
                      const updated = [...chalC17Items];
                      updated[idx].imageUrl = e.target.value;
                      setChalC17Items(updated);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 p-1 rounded text-[10.5px] font-mono"
                    required
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* C18 — Audio Quiz */}
      {chalType === 'c18_audio_quiz' && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
          <h4 className="text-xs font-black uppercase text-indigo-700">C18: Auditory Listening Quiz</h4>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-500">Audio Clue MP3 URL *</label>
            <input
              type="text"
              value={chalAudioUrl}
              onChange={(e) => setChalAudioUrl(e.target.value)}
              placeholder="e.g. https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
              className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs font-mono"
              required
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-200">
            <label className="block text-[10px] font-bold text-slate-500">Multiple Choice Answers</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {chalMcqOptions.map((opt, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">Option #{idx + 1} *</label>
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
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500">Correct Answer Match *</label>
              <select
                value={chalMcqCorrect}
                onChange={(e) => setChalMcqCorrect(e.target.value)}
                className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs outline-none"
                required
              >
                <option value="">-- Choose Correct Answer --</option>
                {chalMcqOptions.filter(Boolean).map((opt, idx) => (
                  <option key={idx} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}


      {/* 2. SHARED SCREEN SETTINGS (Hint, Explanation, Mascot, Difficulty, XP, Continue Button) */}
      <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-4">
        <div className="border-b border-slate-150 pb-2">
          <h4 className="text-xs font-black uppercase text-slate-650 flex items-center gap-1">
            <Sparkles size={13} className="text-indigo-500" />
            Universal Interaction Settings
          </h4>
          <p className="text-[10px] text-slate-400">Configure parameters shared across all screen activities.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Difficulty Selection */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-500 flex items-center gap-0.5">
              <HelpCircle size={11} className="text-indigo-500" /> Difficulty Level
            </label>
            <select
              value={chalDifficulty}
              onChange={(e) => setChalDifficulty(e.target.value as any)}
              className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs outline-none font-bold"
            >
              <option value="easy">🟢 Easy Mode</option>
              <option value="medium">🟡 Medium Mode</option>
              <option value="hard">🔴 Hard Mode</option>
            </select>
          </div>

          {/* XP Reward */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-500 flex items-center gap-0.5">
              <Award size={11} className="text-amber-500" /> XP Reward Points
            </label>
            <input
              type="number"
              min={5}
              max={100}
              step={5}
              value={chalXpValue}
              onChange={(e) => setChalXpValue(parseInt(e.target.value) || 10)}
              className="w-full bg-white border border-slate-250 p-1.5 rounded-lg text-xs font-bold"
              required
            />
          </div>
        </div>

        {/* Continue Button Text */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-500">Navigation Button Text (e.g. Continue, Proceed)</label>
          <input
            type="text"
            value={chalContinueText}
            onChange={(e) => setChalContinueText(e.target.value)}
            placeholder="Continue"
            className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs"
          />
        </div>

        {/* Optional Hint */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-500">Optional Hint Clue (Displayed when stuck)</label>
          <input
            type="text"
            value={chalHint}
            onChange={(e) => setChalHint(e.target.value)}
            placeholder="Hint clue detail..."
            className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs"
          />
        </div>

        {/* 🦦 Chikoo AI Explanation Setup */}
        <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
              <span className="text-lg">🦦</span>
              <span>Chikoo AI Explanation Setup</span>
            </div>
            
            {/* Language tabs selector */}
            <div className="flex bg-slate-200/60 p-0.5 rounded-xl border border-slate-300">
              <button
                type="button"
                onClick={() => setActiveLangTab('hinglish')}
                className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                  activeLangTab === 'hinglish' ? 'bg-white shadow-3xs text-indigo-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🇮🇳 Hinglish
              </button>
              <button
                type="button"
                onClick={() => setActiveLangTab('marathi')}
                className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                  activeLangTab === 'marathi' ? 'bg-white shadow-3xs text-indigo-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🚩 Marathi
              </button>
            </div>
          </div>

          {activeLangTab === 'hinglish' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500">Configure Hinglish experience for wrong choices.</span>
                <button
                  type="button"
                  onClick={async () => {
                    setIsGenerating(true);
                    setGenerationError(null);
                    try {
                      const correctAnswer = chalMcqCorrect || chalFillBlankCorrect || "the correct answer";
                      const options = chalMcqOptions.filter(Boolean);

                      const response = await fetch('/api/gemini/generate-explanation', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          question: chalQuestion || "This lesson check question",
                          correctAnswer,
                          options
                        })
                      });

                      if (!response.ok) {
                        const errData = await response.json();
                        throw new Error(errData.error || "Failed to generate Chikoo micro-explanation.");
                      }

                      const data = await response.json();
                      
                      setChalExplanationConfused(data.explanation_confused || "");
                      setChalExplanationConcept(data.explanation_concept || "");
                      setChalExplanationExample(data.explanation_example || "");
                      setChalExplanationTakeaway(data.explanation_takeaway || "");
                      setChalExplanationSpeechScript(data.explanation_speech_script || "");

                      const compiled = data.explanation_speech_script || `${data.explanation_confused || ""} ${data.explanation_concept || ""} ${data.explanation_example || ""} ${data.explanation_takeaway || ""}`.trim().replace(/\s+/g, ' ');
                      setChalExplanation(compiled);
                    } catch (err: any) {
                      console.error(err);
                      setGenerationError(err.message || "Failed to generate explanation. Please configure your API key.");
                    } finally {
                      setIsGenerating(false);
                    }
                  }}
                  disabled={isGenerating}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
                    isGenerating 
                      ? 'bg-indigo-100 text-indigo-400 border border-indigo-200 animate-pulse' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                  }`}
                >
                  <Sparkles size={12} />
                  {isGenerating ? "Generating..." : "✨ Generate with AI"}
                </button>
              </div>

              {generationError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] font-bold text-rose-700 leading-relaxed">
                  ⚠️ {generationError}
                </div>
              )}

              {/* 1. Why Confused */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                  <span className="text-slate-600">💡 Why Students Get Confused (2 sentences max)</span>
                  <span className={`text-[9px] ${(chalExplanationConfused || '').length > 150 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {(chalExplanationConfused || '').length} chars
                  </span>
                </div>
                <textarea
                  value={chalExplanationConfused || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setChalExplanationConfused(val);
                    const compiled = `${val} ${chalExplanationConcept || ''} ${chalExplanationExample || ''} ${chalExplanationTakeaway || ''}`.trim().replace(/\s+/g, ' ');
                    setChalExplanation(compiled);
                  }}
                  placeholder="e.g., Sometimes it's easy to mix this up because they sound so similar! No worries, let's untangle it."
                  rows={2}
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-400 resize-none font-bold"
                />
                {detectJargon(chalExplanationConfused || '').length > 0 && (
                  <span className="block text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-lg">
                    ⚠️ Chikoo says: Let's avoid complex jargon words like "{detectJargon(chalExplanationConfused || '').join(', ')}" for young learners.
                  </span>
                )}
              </div>

              {/* 2. Correct Concept */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                  <span className="text-slate-600">✅ The Correct Concept (2 sentences max)</span>
                  <span className={`text-[9px] ${(chalExplanationConcept || '').length > 150 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {(chalExplanationConcept || '').length} chars
                  </span>
                </div>
                <textarea
                  value={chalExplanationConcept || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setChalExplanationConcept(val);
                    const compiled = `${chalExplanationConfused || ''} ${val} ${chalExplanationExample || ''} ${chalExplanationTakeaway || ''}`.trim().replace(/\s+/g, ' ');
                    setChalExplanation(compiled);
                  }}
                  placeholder="e.g., This process is actually how engines take in raw energy, clean it, and power up the rocket!"
                  rows={2}
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-400 resize-none font-bold"
                />
                {detectJargon(chalExplanationConcept || '').length > 0 && (
                  <span className="block text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-lg">
                    ⚠️ Chikoo says: Avoid academic jargon words like "{detectJargon(chalExplanationConcept || '').join(', ')}".
                  </span>
                )}
              </div>

              {/* 3. Real-Life Example */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                  <span className="text-slate-600">🌎 Quick Real-Life Example (1-2 sentences)</span>
                  <span className="text-[9px] text-slate-400">{(chalExplanationExample || '').length} chars</span>
                </div>
                <textarea
                  value={chalExplanationExample || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setChalExplanationExample(val);
                    const compiled = `${chalExplanationConfused || ''} ${chalExplanationConcept || ''} ${val} ${chalExplanationTakeaway || ''}`.trim().replace(/\s+/g, ' ');
                    setChalExplanation(compiled);
                  }}
                  placeholder="e.g., Think of it like sorting wet socks from dry laundry before stuffing them in the drawer."
                  rows={2}
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-400 resize-none font-bold"
                />
              </div>

              {/* 4. Memorable Takeaway */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                  <span className="text-slate-600">⭐ Memorable Key Takeaway (1 sentence max)</span>
                  <span className="text-[9px] text-slate-400">{(chalExplanationTakeaway || '').length} chars</span>
                </div>
                <input
                  type="text"
                  value={chalExplanationTakeaway || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setChalExplanationTakeaway(val);
                    const compiled = `${chalExplanationConfused || ''} ${chalExplanationConcept || ''} ${chalExplanationExample || ''} ${val}`.trim().replace(/\s+/g, ' ');
                    setChalExplanation(compiled);
                  }}
                  placeholder="e.g., Every choice counts, and practice makes our rockets fly higher!"
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-400 font-bold"
                />
              </div>

              {/* 5. Speech Script */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                  <span className="text-slate-600">🔊 Mascot Speech Script (Voice-ready, 40-50 words max)</span>
                  <span className={`text-[9px] ${(chalExplanationSpeechScript || '').split(/\s+/).filter(Boolean).length > 55 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                    {(chalExplanationSpeechScript || '').split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <textarea
                  value={chalExplanationSpeechScript || ''}
                  onChange={(e) => setChalExplanationSpeechScript(e.target.value)}
                  placeholder="e.g., Oh! No worries, buddy! Think of it this way: laundry sorting is just grouping items by type. Correct laundry rules keep clothes perfect! Let's try again!"
                  rows={2.5}
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-400 resize-none font-bold"
                />
                {!detectVoiceReadiness(chalExplanationSpeechScript || '') && (chalExplanationSpeechScript || '').length > 5 && (
                  <span className="block text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-1 rounded-lg">
                    💡 Tip: Try adding friendly conversational sounds like "Oh!", "Aha!", or "No worries!" to sound more playful!
                  </span>
                )}
                {(chalExplanationSpeechScript || '').split(/\s+/).filter(Boolean).length > 55 && (
                  <span className="block text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded-lg">
                    ⚠️ Warning: Script exceeds recommended length. Keep it under 50 words so Chikoo's audio is super snappy!
                  </span>
                )}
              </div>

              {/* 6. Pre-Recorded Explanation Audio Cache */}
              <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-150 shadow-sm mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-700">
                    <Volume2 size={14} className="text-sky-500" />
                    <span>Pre-Recorded Lesson Explanation Audio</span>
                  </div>
                  {explanationAudioUrl && (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                      🎧 Saved ({explanationAudioDuration.toFixed(0)}s)
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Generate or upload a high-quality pre-recorded MP3 to skip dynamic API calls during live gameplay. Perfect for polished masterclasses!
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {/* Generate Voice Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      setIsVoiceGenerating(true);
                      setVoiceError(null);
                      try {
                        const speechScript = String(chalExplanationSpeechScript || '').trim();
                        const fallbackText = String(chalExplanation || '').trim() || "Let's learn this together! Practice makes our rocket ship fly high!";
                        const finalSpeechText = speechScript || fallbackText;

                        const res = await fetch('/api/gemini/speech', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ text: finalSpeechText })
                        });
                        if (!res.ok) {
                          throw new Error("Failed to generate voice via API.");
                        }
                        const payload = await res.json();
                        if (!payload.audio) {
                          throw new Error("API did not return any audio data.");
                        }

                        const byteCharacters = atob(payload.audio);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                          byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        const blob = new Blob([byteArray], { type: payload.mimeType || 'audio/wav' });
                        const file = new File([blob], `explanation_${Date.now()}.wav`, { type: payload.mimeType || 'audio/wav' });

                        const duration = await getAudioDurationHelper(file);

                        let finalUrl = '';
                        try {
                          const uploadRes = await fetch('/api/admin/upload-audio', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              audioBase64: payload.audio,
                              fileName: `pre_recorded_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.wav`,
                              mimeType: payload.mimeType || 'audio/wav',
                              language: 'hinglish'
                            })
                          });
                          if (uploadRes.ok) {
                            const uploadData = await uploadRes.json();
                            if (uploadData.success && uploadData.publicUrl) {
                              finalUrl = uploadData.publicUrl;
                            }
                          }
                        } catch (uErr) {
                          console.warn("Server audio upload failed, falling back to direct/local:", uErr);
                        }

                        if (finalUrl) {
                          setExplanationAudioUrl(finalUrl);
                          setExplanationAudioDuration(duration);
                        } else if (isSupabaseConfigured && supabase) {
                          const fileName = `pre_recorded_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.wav`;
                          const { data, error } = await supabase.storage.from('audio').upload(fileName, file);
                          if (error) throw error;
                          const { data: { publicUrl } } = supabase.storage.from('audio').getPublicUrl(fileName);
                          setExplanationAudioUrl(publicUrl);
                          setExplanationAudioDuration(duration);
                        } else {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setExplanationAudioUrl(reader.result as string);
                            setExplanationAudioDuration(duration);
                          };
                          reader.readAsDataURL(file);
                        }
                      } catch (err: any) {
                        console.error("Generate Voice Error:", err);
                        setVoiceError(err.message || "Failed to generate pre-recorded voice.");
                      } finally {
                        setIsVoiceGenerating(false);
                      }
                    }}
                    disabled={isVoiceGenerating || isGenerating}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
                      isVoiceGenerating
                        ? 'bg-sky-100 text-sky-400 border border-sky-200 animate-pulse'
                        : 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs font-bold'
                    }`}
                  >
                    {isVoiceGenerating ? (
                      <Loader2 size={13} className="animate-spin text-sky-400" />
                    ) : (
                      <Volume2 size={13} />
                    )}
                    {isVoiceGenerating ? "Recording Voice..." : "🎙️ Generate Voice"}
                  </button>

                  {/* Upload Audio Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isVoiceGenerating}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Upload size={13} />
                    <span>Upload Audio</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsVoiceGenerating(true);
                      setVoiceError(null);
                      try {
                        const duration = await getAudioDurationHelper(file);

                        if (isSupabaseConfigured && supabase) {
                          const fileExt = file.name.split('.').pop() || 'mp3';
                          const fileName = `pre_recorded_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
                          const { data, error } = await supabase.storage.from('audio').upload(fileName, file);
                          if (error) throw error;
                          const { data: { publicUrl } } = supabase.storage.from('audio').getPublicUrl(fileName);
                          setExplanationAudioUrl(publicUrl);
                          setExplanationAudioDuration(duration);
                        } else {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setExplanationAudioUrl(reader.result as string);
                            setExplanationAudioDuration(duration);
                          };
                          reader.readAsDataURL(file);
                        }
                      } catch (err: any) {
                        console.error("Audio Upload Error:", err);
                        setVoiceError(err.message || "Failed to upload or parse audio file.");
                      } finally {
                        setIsVoiceGenerating(false);
                      }
                    }}
                    className="hidden"
                  />

                  {/* Remove/Replace Audio Button */}
                  {explanationAudioUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setExplanationAudioUrl('');
                        setExplanationAudioDuration(0);
                        if (previewAudioRef.current) {
                          previewAudioRef.current.pause();
                        }
                        setIsPreviewPlaying(false);
                      }}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Trash2 size={13} />
                      <span>Remove Audio</span>
                    </button>
                  )}
                </div>

                {/* Error Display */}
                {voiceError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[10px] font-black text-rose-700">
                    ⚠️ {voiceError}
                  </div>
                )}

                {/* Audio Preview Player */}
                {explanationAudioUrl && (
                  <div className="mt-3 flex items-center justify-between gap-3 bg-slate-50 border border-slate-200/60 p-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!explanationAudioUrl) return;
                          const currentAudio = previewAudioRef.current;
                          if (!currentAudio || (currentAudio.src !== explanationAudioUrl && !currentAudio.src.endsWith(explanationAudioUrl))) {
                            if (currentAudio) currentAudio.pause();
                            const newAudio = new Audio(explanationAudioUrl);
                            newAudio.addEventListener('ended', () => {
                              setIsPreviewPlaying(false);
                            });
                            newAudio.addEventListener('error', (err) => {
                              console.error("Audio failed to load:", err);
                              setIsPreviewPlaying(false);
                            });
                            previewAudioRef.current = newAudio;
                          }

                          if (isPreviewPlaying) {
                            previewAudioRef.current?.pause();
                            setIsPreviewPlaying(false);
                          } else {
                            previewAudioRef.current?.play().then(() => {
                              setIsPreviewPlaying(true);
                            }).catch(e => {
                              console.error("Preview failed:", e);
                              setIsPreviewPlaying(false);
                            });
                          }
                        }}
                        className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer"
                      >
                        {isPreviewPlaying ? <Pause size={14} className="fill-white" /> : <Play size={14} className="fill-white ml-0.5" />}
                      </button>
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Audio Playback Preview</span>
                        <span className="text-[9px] font-bold text-slate-400">Duration: {explanationAudioDuration.toFixed(1)} seconds</span>
                      </div>
                    </div>
                    
                    {/* Visual Audio Waveform representation */}
                    <div className="flex items-center gap-0.5 pr-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((bar) => (
                        <div
                          key={`wave-bar-en-${bar}`}
                          className={`w-0.75 bg-indigo-500 rounded-full transition-all duration-300 ${
                            isPreviewPlaying ? 'animate-pulse' : 'opacity-40'
                          }`}
                          style={{
                            height: isPreviewPlaying
                              ? `${6 + Math.sin(bar * 0.8) * 12}px`
                              : '6px'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeLangTab === 'marathi' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-slate-500">Configure conversational Marathi experience.</span>
                <div className="flex items-center gap-2">
                  {/* Translate Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      if (!chalExplanationConfused && !chalExplanationConcept && !chalExplanationExample && !chalExplanationTakeaway && !chalExplanationSpeechScript) {
                        setGenerationErrorMarathi("Please fill or generate the Hinglish explanation first to translate!");
                        return;
                      }
                      setIsGeneratingMarathi(true);
                      setGenerationErrorMarathi(null);
                      try {
                        const translateField = async (srcText: string): Promise<string> => {
                          if (!srcText.trim()) return "";
                          const response = await fetch('/api/gemini/translate-explanation', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text: srcText, targetLanguage: 'marathi' })
                          });
                          if (!response.ok) {
                            throw new Error("Failed to translate via API.");
                          }
                          const resData = await response.json();
                          return resData.translation || "";
                        };

                        const confusedTrans = await translateField(chalExplanationConfused);
                        const conceptTrans = await translateField(chalExplanationConcept);
                        const exampleTrans = await translateField(chalExplanationExample);
                        const takeawayTrans = await translateField(chalExplanationTakeaway);
                        const speechTrans = await translateField(chalExplanationSpeechScript);

                        setChalExplanationMarathiConfused(confusedTrans);
                        setChalExplanationMarathiConcept(conceptTrans);
                        setChalExplanationMarathiExample(exampleTrans);
                        setChalExplanationMarathiTakeaway(takeawayTrans);
                        setChalExplanationMarathiSpeechScript(speechTrans);

                        const compiled = `${confusedTrans} ${conceptTrans} ${exampleTrans} ${takeawayTrans}`.trim().replace(/\s+/g, ' ');
                        setChalExplanationMarathi(compiled);
                      } catch (err: any) {
                        console.error(err);
                        setGenerationErrorMarathi(err.message || "Failed to translate explanation.");
                      } finally {
                        setIsGeneratingMarathi(false);
                      }
                    }}
                    disabled={isGeneratingMarathi}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
                      isGeneratingMarathi 
                        ? 'bg-amber-100 text-amber-500 border border-amber-200 animate-pulse' 
                        : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                    }`}
                  >
                    <Sparkles size={12} />
                    {isGeneratingMarathi ? "Translating..." : "✨ Translate Hinglish"}
                  </button>

                  {/* Direct Generation Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      setIsGeneratingMarathi(true);
                      setGenerationErrorMarathi(null);
                      try {
                        const correctAnswer = chalMcqCorrect || chalFillBlankCorrect || "the correct answer";
                        const options = chalMcqOptions.filter(Boolean);

                        const response = await fetch('/api/gemini/generate-explanation-marathi', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            question: chalQuestion || "This lesson check question",
                            correctAnswer,
                            options
                          })
                        });

                        if (!response.ok) {
                          const errData = await response.json();
                          throw new Error(errData.error || "Failed to generate Marathi explanation.");
                        }

                        const data = await response.json();
                        
                        setChalExplanationMarathiConfused(data.explanation_confused || "");
                        setChalExplanationMarathiConcept(data.explanation_concept || "");
                        setChalExplanationMarathiExample(data.explanation_example || "");
                        setChalExplanationMarathiTakeaway(data.explanation_takeaway || "");
                        setChalExplanationMarathiSpeechScript(data.explanation_speech_script || "");

                        const compiled = data.explanation_speech_script || `${data.explanation_confused || ""} ${data.explanation_concept || ""} ${data.explanation_example || ""} ${data.explanation_takeaway || ""}`.trim().replace(/\s+/g, ' ');
                        setChalExplanationMarathi(compiled);
                      } catch (err: any) {
                        console.error(err);
                        setGenerationErrorMarathi(err.message || "Failed to generate directly.");
                      } finally {
                        setIsGeneratingMarathi(false);
                      }
                    }}
                    disabled={isGeneratingMarathi}
                    className="px-3 py-1.5 rounded-xl text-[10px] font-black bg-indigo-650 hover:bg-indigo-600 text-white uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                  >
                    <Sparkles size={12} />
                    Direct AI Generate
                  </button>
                </div>
              </div>

              {generationErrorMarathi && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] font-bold text-rose-700 leading-relaxed">
                  ⚠️ {generationErrorMarathi}
                </div>
              )}

              {/* 1. Marathi Why Confused */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                  <span className="text-slate-600">💡 Why Students Get Confused - Marathi (2 sentences max)</span>
                  <span className={`text-[9px] ${(chalExplanationMarathiConfused || '').length > 150 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {(chalExplanationMarathiConfused || '').length} chars
                  </span>
                </div>
                <textarea
                  value={chalExplanationMarathiConfused || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setChalExplanationMarathiConfused(val);
                    const compiled = `${val} ${chalExplanationMarathiConcept || ''} ${chalExplanationMarathiExample || ''} ${chalExplanationMarathiTakeaway || ''}`.trim().replace(/\s+/g, ' ');
                    setChalExplanationMarathi(compiled);
                  }}
                  placeholder="उदा. अनेकदा आपल्याला यामध्ये गोंधळ होतो कारण हे दोन्ही अगदी सारखे वाटतात! काही हरकत नाही, आपण समजून घेऊया."
                  rows={2}
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-400 resize-none font-bold"
                />
              </div>

              {/* 2. Marathi Correct Concept */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                  <span className="text-slate-600">✅ The Correct Concept - Marathi (2 sentences max)</span>
                  <span className={`text-[9px] ${(chalExplanationMarathiConcept || '').length > 150 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {(chalExplanationMarathiConcept || '').length} chars
                  </span>
                </div>
                <textarea
                  value={chalExplanationMarathiConcept || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setChalExplanationMarathiConcept(val);
                    const compiled = `${chalExplanationMarathiConfused || ''} ${val} ${chalExplanationMarathiExample || ''} ${chalExplanationMarathiTakeaway || ''}`.trim().replace(/\s+/g, ' ');
                    setChalExplanationMarathi(compiled);
                  }}
                  placeholder="उदा. ही प्रोसेस म्हणजे इंजिन कसं काम करतं आणि रॉकेटला कशी ऊर्जा देतं ते आहे!"
                  rows={2}
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-400 resize-none font-bold"
                />
              </div>

              {/* 3. Marathi Real-Life Example */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                  <span className="text-slate-600">🌎 Quick Real-Life Example - Marathi (1-2 sentences)</span>
                  <span className="text-[9px] text-slate-400">{(chalExplanationMarathiExample || '').length} chars</span>
                </div>
                <textarea
                  value={chalExplanationMarathiExample || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setChalExplanationMarathiExample(val);
                    const compiled = `${chalExplanationMarathiConfused || ''} ${chalExplanationMarathiConcept || ''} ${val} ${chalExplanationMarathiTakeaway || ''}`.trim().replace(/\s+/g, ' ');
                    setChalExplanationMarathi(compiled);
                  }}
                  placeholder="उदा. आपल्या कपाटात कपडे व्यवस्थित रचून ठेवण्यासारखं हे आहे."
                  rows={2}
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-400 resize-none font-bold"
                />
              </div>

              {/* 4. Marathi Memorable Takeaway */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                  <span className="text-slate-600">⭐ Memorable Key Takeaway - Marathi (1 sentence max)</span>
                  <span className="text-[9px] text-slate-400">{(chalExplanationMarathiTakeaway || '').length} chars</span>
                </div>
                <input
                  type="text"
                  value={chalExplanationMarathiTakeaway || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setChalExplanationMarathiTakeaway(val);
                    const compiled = `${chalExplanationMarathiConfused || ''} ${chalExplanationMarathiConcept || ''} ${chalExplanationMarathiExample || ''} ${val}`.trim().replace(/\s+/g, ' ');
                    setChalExplanationMarathi(compiled);
                  }}
                  placeholder="उदा. प्रत्येक प्रयत्न महत्त्वाचा असतो, प्रॅक्टिसने आपण अजून चांगले होऊ!"
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-400 font-bold"
                />
              </div>

              {/* 5. Marathi Speech Script */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                  <span className="text-slate-600">🔊 Marathi Mascot Speech Script (Voice-ready, 40-50 words max)</span>
                  <span className={`text-[9px] ${(chalExplanationMarathiSpeechScript || '').split(/\s+/).filter(Boolean).length > 55 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                    {(chalExplanationMarathiSpeechScript || '').split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <textarea
                  value={chalExplanationMarathiSpeechScript || ''}
                  onChange={(e) => setChalExplanationMarathiSpeechScript(e.target.value)}
                  placeholder="उदा. अरे मित्रा, काही हरकत नाही! असं विचार कर: कपडे सॉर्ट करणे म्हणजे फक्त प्रकारानुसार गट बनवणे. योग्य नियमांमुळे कपडे खराब होत नाहीत. चल पुन्हा प्रयत्न करू!"
                  rows={2.5}
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-400 resize-none font-bold"
                />
                {(chalExplanationMarathiSpeechScript || '').split(/\s+/).filter(Boolean).length > 55 && (
                  <span className="block text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded-lg">
                    ⚠️ Warning: Script exceeds recommended length. Keep it under 50 words so Chikoo's audio is super snappy!
                  </span>
                )}
              </div>

              {/* 6. Pre-Recorded Explanation Audio Cache - Marathi */}
              <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-150 shadow-sm mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-700">
                    <Volume2 size={14} className="text-sky-500" />
                    <span>Pre-Recorded Marathi Explanation Audio</span>
                  </div>
                  {explanationAudioUrlMarathi && (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                      🎧 Saved ({explanationAudioDurationMarathi.toFixed(0)}s)
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Generate or upload a high-quality pre-recorded Marathi MP3 to skip dynamic API calls during Marathi live gameplay.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {/* Generate Voice Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      setIsVoiceGeneratingMarathi(true);
                      setVoiceErrorMarathi(null);
                      try {
                        const speechScript = String(chalExplanationMarathiSpeechScript || '').trim();
                        const fallbackText = String(chalExplanationMarathi || '').trim() || "चला आपण मिळून शिकूया! प्रॅक्टिस आपल्याला अधिक यशस्वी बनवेल!";
                        const finalSpeechText = speechScript || fallbackText;

                        const res = await fetch('/api/gemini/speech', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ text: finalSpeechText })
                        });
                        if (!res.ok) {
                          throw new Error("Failed to generate Marathi voice via API.");
                        }
                        const payload = await res.json();
                        if (!payload.audio) {
                          throw new Error("API did not return any audio data.");
                        }

                        const byteCharacters = atob(payload.audio);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                          byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        const blob = new Blob([byteArray], { type: payload.mimeType || 'audio/wav' });
                        const file = new File([blob], `explanation_marathi_${Date.now()}.wav`, { type: payload.mimeType || 'audio/wav' });

                        const duration = await getAudioDurationHelper(file);

                        let finalUrl = '';
                        try {
                          const uploadRes = await fetch('/api/admin/upload-audio', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              audioBase64: payload.audio,
                              fileName: `pre_recorded_marathi_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.wav`,
                              mimeType: payload.mimeType || 'audio/wav',
                              language: 'mr'
                            })
                          });
                          if (uploadRes.ok) {
                            const uploadData = await uploadRes.json();
                            if (uploadData.success && uploadData.publicUrl) {
                              finalUrl = uploadData.publicUrl;
                            }
                          }
                        } catch (uErr) {
                          console.warn("Server audio upload failed, falling back to direct/local:", uErr);
                        }

                        if (finalUrl) {
                          setExplanationAudioUrlMarathi(finalUrl);
                          setExplanationAudioDurationMarathi(duration);
                        } else if (isSupabaseConfigured && supabase) {
                          const fileName = `pre_recorded_marathi_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.wav`;
                          const { data, error } = await supabase.storage.from('audio').upload(fileName, file);
                          if (error) throw error;
                          const { data: { publicUrl } } = supabase.storage.from('audio').getPublicUrl(fileName);
                          setExplanationAudioUrlMarathi(publicUrl);
                          setExplanationAudioDurationMarathi(duration);
                        } else {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setExplanationAudioUrlMarathi(reader.result as string);
                            setExplanationAudioDurationMarathi(duration);
                          };
                          reader.readAsDataURL(file);
                        }
                      } catch (err: any) {
                        console.error("Generate Voice Error:", err);
                        setVoiceErrorMarathi(err.message || "Failed to generate pre-recorded Marathi voice.");
                      } finally {
                        setIsVoiceGeneratingMarathi(false);
                      }
                    }}
                    disabled={isVoiceGeneratingMarathi || isGeneratingMarathi}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
                      isVoiceGeneratingMarathi
                        ? 'bg-sky-100 text-sky-400 border border-sky-200 animate-pulse'
                        : 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs font-bold'
                    }`}
                  >
                    {isVoiceGeneratingMarathi ? (
                      <Loader2 size={13} className="animate-spin text-sky-400" />
                    ) : (
                      <Volume2 size={13} />
                    )}
                    {isVoiceGeneratingMarathi ? "Recording Voice..." : "🎙️ Generate Marathi Voice"}
                  </button>

                  {/* Upload Audio Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRefMarathi.current?.click()}
                    disabled={isVoiceGeneratingMarathi}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Upload size={13} />
                    <span>Upload Marathi Audio</span>
                  </button>
                  <input
                    ref={fileInputRefMarathi}
                    type="file"
                    accept="audio/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsVoiceGeneratingMarathi(true);
                      setVoiceErrorMarathi(null);
                      try {
                        const duration = await getAudioDurationHelper(file);

                        const fileExt = file.name.split('.').pop() || 'mp3';
                        const fileName = `pre_recorded_marathi_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
                        
                        let finalUrl = '';
                        try {
                          const base64Str = await new Promise<string>((resolve, reject) => {
                            const r = new FileReader();
                            r.onloadend = () => {
                              const res = r.result as string;
                              const base64Data = res.split(',')[1] || res;
                              resolve(base64Data);
                            };
                            r.onerror = reject;
                            r.readAsDataURL(file);
                          });

                          const uploadRes = await fetch('/api/admin/upload-audio', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              audioBase64: base64Str,
                              fileName,
                              mimeType: file.type || 'audio/mpeg',
                              language: 'mr'
                            })
                          });
                          if (uploadRes.ok) {
                            const uploadData = await uploadRes.json();
                            if (uploadData.success && uploadData.publicUrl) {
                              finalUrl = uploadData.publicUrl;
                            }
                          }
                        } catch (uErr) {
                          console.warn("Server upload failed for manual file:", uErr);
                        }

                        if (finalUrl) {
                          setExplanationAudioUrlMarathi(finalUrl);
                          setExplanationAudioDurationMarathi(duration);
                        } else if (isSupabaseConfigured && supabase) {
                          const { data, error } = await supabase.storage.from('audio').upload(fileName, file);
                          if (error) throw error;
                          const { data: { publicUrl } } = supabase.storage.from('audio').getPublicUrl(fileName);
                          setExplanationAudioUrlMarathi(publicUrl);
                          setExplanationAudioDurationMarathi(duration);
                        } else {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setExplanationAudioUrlMarathi(reader.result as string);
                            setExplanationAudioDurationMarathi(duration);
                          };
                          reader.readAsDataURL(file);
                        }
                      } catch (err: any) {
                        console.error("Audio Upload Error:", err);
                        setVoiceErrorMarathi(err.message || "Failed to upload or parse Marathi audio file.");
                      } finally {
                        setIsVoiceGeneratingMarathi(false);
                      }
                    }}
                    className="hidden"
                  />

                  {/* Remove/Replace Audio Button */}
                  {explanationAudioUrlMarathi && (
                    <button
                      type="button"
                      onClick={() => {
                        setExplanationAudioUrlMarathi('');
                        setExplanationAudioDurationMarathi(0);
                        if (previewAudioRefMarathi.current) {
                          previewAudioRefMarathi.current.pause();
                        }
                        setIsPreviewPlayingMarathi(false);
                      }}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Trash2 size={13} />
                      <span>Remove Marathi Audio</span>
                    </button>
                  )}
                </div>

                {/* Error Display */}
                {voiceErrorMarathi && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[10px] font-black text-rose-700">
                    ⚠️ {voiceErrorMarathi}
                  </div>
                )}

                {/* Audio Preview Player */}
                {explanationAudioUrlMarathi && (
                  <div className="mt-3 flex items-center justify-between gap-3 bg-slate-50 border border-slate-200/60 p-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!explanationAudioUrlMarathi) return;
                          const currentAudio = previewAudioRefMarathi.current;
                          if (!currentAudio || (currentAudio.src !== explanationAudioUrlMarathi && !currentAudio.src.endsWith(explanationAudioUrlMarathi))) {
                            if (currentAudio) currentAudio.pause();
                            const newAudio = new Audio(explanationAudioUrlMarathi);
                            newAudio.addEventListener('ended', () => {
                              setIsPreviewPlayingMarathi(false);
                            });
                            newAudio.addEventListener('error', (err) => {
                              console.error("Marathi audio failed to load:", err);
                              setIsPreviewPlayingMarathi(false);
                            });
                            previewAudioRefMarathi.current = newAudio;
                          }

                          if (isPreviewPlayingMarathi) {
                            previewAudioRefMarathi.current?.pause();
                            setIsPreviewPlayingMarathi(false);
                          } else {
                            previewAudioRefMarathi.current?.play().then(() => {
                              setIsPreviewPlayingMarathi(true);
                            }).catch(e => {
                              console.error("Preview failed:", e);
                              setIsPreviewPlayingMarathi(false);
                            });
                          }
                        }}
                        className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer"
                      >
                        {isPreviewPlayingMarathi ? <Pause size={14} className="fill-white" /> : <Play size={14} className="fill-white ml-0.5" />}
                      </button>
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Marathi Audio Preview</span>
                        <span className="text-[9px] font-bold text-slate-400">Duration: {explanationAudioDurationMarathi.toFixed(1)} seconds</span>
                      </div>
                    </div>
                    
                    {/* Visual Audio Waveform representation */}
                    <div className="flex items-center gap-0.5 pr-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((bar) => (
                        <div
                          key={`wave-bar-mr-${bar}`}
                          className={`w-0.75 bg-indigo-500 rounded-full transition-all duration-300 ${
                            isPreviewPlayingMarathi ? 'animate-pulse' : 'opacity-40'
                          }`}
                          style={{
                            height: isPreviewPlayingMarathi
                              ? `${6 + Math.sin(bar * 0.8) * 12}px`
                              : '6px'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mascot Speech Bubble Message */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-500 flex items-center gap-0.5">
            <MessageCircle size={11} className="text-teal-500" /> Mascot Speech bubble message (Optional)
          </label>
          <textarea
            value={chalMascotMessage}
            onChange={(e) => setChalMascotMessage(e.target.value)}
            placeholder="What does Chikoo say on this screen?"
            rows={2}
            className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs resize-none"
          />
        </div>
      </div>
    </div>
  );
};
