import React, { useState } from 'react';
import { AlertCircle, Edit, Eye, Layout, Save, Trash2 } from 'lucide-react';
import { ScreenEditorProps, ChallengeType } from '../types';
import { CategoryCForms } from '../../../components/admin/CategoryCForms';
import { ScreenVoiceSection } from '../../../components/admin/ScreenVoiceSection';
import { MultipleChoiceScreen } from './MultipleChoiceScreen';
import { PairsBucketTimelineScreen } from './PairsBucketTimelineScreen';
import { DialogueStoryScreen } from './DialogueStoryScreen';

export const ScreenEditor: React.FC<ScreenEditorProps> = ({
  module,
  lesson,
  challenge,
  editorLayoutMode,
  setEditorLayoutMode,
  isStudentViewMode,
  setIsStudentViewMode,
  screenForm,
  renderChallengePreview,
  selectedScreenForVoice,
  onSaveChallenges,
  screenListViewMode: externalListViewMode,
  setScreenListViewMode: setExternalListViewMode,
  soundManager,
}) => {
  const [internalListViewMode, setInternalListViewMode] = useState<'cards' | 'table'>('table');
  const screenListViewMode = externalListViewMode || internalListViewMode;
  const setScreenListViewMode = setExternalListViewMode || setInternalListViewMode;
  const [resetKey, setResetKey] = useState(0);

  const {
    chalId,
    chalType,
    setChalType,
    chalQuestion,
    setChalQuestion,
    chalXpValue,
    setChalXpValue,
    chalDifficulty,
    setChalDifficulty,
    chalHint,
    setChalHint,
    chalExplanation,
    setChalExplanation,
    chalContinueText,
    setChalContinueText,
    chalMascotMessage,
    setChalMascotMessage,
    chalExplanationConfused,
    setChalExplanationConfused,
    chalExplanationConcept,
    setChalExplanationConcept,
    chalExplanationExample,
    setChalExplanationExample,
    chalExplanationTakeaway,
    setChalExplanationTakeaway,
    chalExplanationSpeechScript,
    setChalExplanationSpeechScript,
    explanationAudioUrl,
    setExplanationAudioUrl,
    explanationAudioDuration,
    setExplanationAudioDuration,
    chalExplanationMarathi,
    setChalExplanationMarathi,
    chalExplanationMarathiConfused,
    setChalExplanationMarathiConfused,
    chalExplanationMarathiConcept,
    setChalExplanationMarathiConcept,
    chalExplanationMarathiExample,
    setChalExplanationMarathiExample,
    chalExplanationMarathiTakeaway,
    setChalExplanationMarathiTakeaway,
    chalExplanationMarathiSpeechScript,
    setChalExplanationMarathiSpeechScript,
    explanationAudioUrlMarathi,
    setExplanationAudioUrlMarathi,
    explanationAudioDurationMarathi,
    setExplanationAudioDurationMarathi,
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
    chalC8Images,
    setChalC8Images,
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
    selectChallengeForEditing,
    handleSaveChallengeEdits,
    handleDeleteChallenge,
    buildChallengePayload,
  } = screenForm;

  const currentChallenges = lesson?.challenges || [];

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-150 pb-4 gap-4">
        <div>
          <h3 className="text-base font-black text-slate-900 mb-0.5">Interactive Screen Builder</h3>
          <p className="text-xs text-slate-500 font-medium">
            Design elegant gamified questions and slides for lesson: <span className="text-indigo-650 font-bold">&ldquo;{lesson?.title}&rdquo;</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-500">
            Configuration:
          </label>
          <select
            value={chalType}
            onChange={(e) => {
              const newType = e.target.value as ChallengeType;
              soundManager?.play?.('click');
              setChalType(newType);
            }}
            className="text-xs font-black border border-slate-200 bg-white text-slate-800 rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all uppercase tracking-wide shrink-0"
          >
            <option value="content_screen">🖼️ Concept Screen</option>
            <option value="visual_lesson_screen">🎬 Visual Story Screen</option>
            <option value="tap_right_answer">🎯 Multiple Choice Quiz</option>
            <option value="image_reveal">📸 Image Tap Quiz</option>
            <option value="fill_in_blank">📝 Fill standard Blank</option>
            <option value="ai_vs_human">🪐 AI Showdown Card</option>
            <option value="spot_the_ai">🔍 AI Error Audit</option>
            <option value="drag_and_drop">🧩 Bucket Sorter</option>
            <option value="sort_sequence">🔢 Timeline Sorter</option>
            <option value="match_pairs">🤝 Concepts Matcher</option>
            <option value="build_concept">💡 Sentence Builder</option>
            <option value="c1_multiple_choice">🌟 C1: Multiple Choice</option>
            <option value="c2_fill_in_blank">🌟 C2: Fill in the Blank</option>
            <option value="c3_sentence_builder">🌟 C3: Sentence Builder</option>
            <option value="c4_concept_matcher">🌟 C4: Concept Matcher</option>
            <option value="c5_bucket_sort">🌟 C5: Bucket Sort</option>
            <option value="c6_timeline_sort">🌟 C6: Timeline Sorter</option>
            <option value="c7_sequence_builder">🌟 C7: Sequence Builder</option>
            <option value="c8_tap_correct_object">🌟 C8: Tap Correct Object</option>
            <option value="c9_true_false">🌟 C9: True/False Switch</option>
            <option value="c10_swipe_left_right">🌟 C10: Swipe Left/Right</option>
            <option value="c11_image_classification">🌟 C11: Image Classification</option>
            <option value="c12_label_diagram">🌟 C12: Label the Diagram</option>
            <option value="c13_hotspot_question">🌟 C13: Hotspot Finder</option>
            <option value="c14_memory_flip_cards">🌟 C14: Memory Flip Cards</option>
            <option value="c15_drag_complete_diagram">🌟 C15: Drag to Complete Diagram</option>
            <option value="c16_eliminate_wrong">🌟 C16: Eliminate Wrong Answers</option>
            <option value="c17_arrange_images">🌟 C17: Arrange Images Sequence</option>
            <option value="c18_audio_quiz">🌟 C18: Sound/Audio Quiz</option>
          </select>
        </div>
      </div>

      {!module?.id || !lesson?.id ? (
        <div className="p-8 text-center border-2 border-dashed border-slate-200/60 rounded-3xl bg-slate-50/50 space-y-2">
          <AlertCircle className="w-8 h-8 text-indigo-500 mx-auto animate-bounce" />
          <h4 className="font-extrabold text-sm text-slate-800">No Target Lesson Active</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Please click on or add a Lesson or Screen inside the Curriculum Map Sidebar on the left first.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Universal Workspace Layout Switcher (Full Width Editor | Split View | Simulator Only) */}
          {!isStudentViewMode && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/70 shadow-2xs">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-2 font-mono">
                  Workspace View:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    soundManager?.play?.('click');
                    setEditorLayoutMode('editor');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    editorLayoutMode === 'editor'
                      ? 'bg-white text-indigo-700 font-black shadow-xs border border-indigo-200'
                      : 'text-slate-650 hover:text-slate-900 hover:bg-white/50'
                  }`}
                  title="Full-Width Editor with maximum horizontal space"
                >
                  <Edit size={13} />
                  <span>Full-Width Editor</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundManager?.play?.('click');
                    setEditorLayoutMode('split');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    editorLayoutMode === 'split'
                      ? 'bg-white text-indigo-700 font-black shadow-xs border border-indigo-200'
                      : 'text-slate-650 hover:text-slate-900 hover:bg-white/50'
                  }`}
                  title="Side-by-side simulator and editor layout"
                >
                  <Layout size={13} />
                  <span>Split View</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundManager?.play?.('click');
                    setEditorLayoutMode('preview');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    editorLayoutMode === 'preview'
                      ? 'bg-white text-indigo-700 font-black shadow-xs border border-indigo-200'
                      : 'text-slate-650 hover:text-slate-900 hover:bg-white/50'
                  }`}
                  title="Focus on phone simulator"
                >
                  <Eye size={13} />
                  <span>Simulator Only</span>
                </button>
              </div>

              <div className="flex items-center gap-2 pr-1 text-[10px] text-slate-400 font-semibold hidden sm:flex">
                {editorLayoutMode === 'editor' && (
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                    ✨ Full width active • Generous space
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* LEFT SIMULATOR COLUMN */}
            {(editorLayoutMode === 'split' || editorLayoutMode === 'preview' || isStudentViewMode) && (
              <div className={`${isStudentViewMode || editorLayoutMode === 'preview' ? 'xl:col-span-12' : 'xl:col-span-5 2xl:col-span-4'} flex flex-col items-center justify-center space-y-4`}>
                <div className="w-full flex items-center justify-between border-b border-slate-100 pb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Eye size={15} className="text-indigo-600" />
                    <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-500">
                      {isStudentViewMode ? "Student Interactive Simulation" : "Student Viewport Simulator"}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundManager?.play?.('click');
                        setResetKey(prev => prev + 1);
                      }}
                      className="text-[9.5px] font-black border border-slate-250 hover:bg-slate-50 rounded-lg px-2.5 py-1 text-slate-600 transition-all uppercase tracking-wide cursor-pointer flex items-center gap-1"
                    >
                      🔄 Reset State
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundManager?.play?.('click');
                        setIsStudentViewMode(!isStudentViewMode);
                      }}
                      className={`text-[9.5px] font-black px-3 py-1 rounded-lg transition-all uppercase tracking-wide cursor-pointer border ${
                        isStudentViewMode 
                          ? 'bg-emerald-600 text-white border-emerald-700' 
                          : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50/50'
                      }`}
                    >
                      {isStudentViewMode ? "🛠️ Exit Student View" : "👨‍🎓 Full Student View"}
                    </button>
                  </div>
                </div>

                {/* Smartphone Mock Frame */}
                <div className="w-full max-w-[390px] mx-auto sm:bg-slate-900 bg-slate-100 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 sm:border-[10px] border-slate-800 sm:border-slate-950 shadow-md sm:shadow-2xl p-1.5 overflow-hidden relative min-h-[520px] sm:min-h-[580px] flex flex-col justify-between">
                  <div className="absolute top-0 inset-x-0 h-4 bg-slate-800 sm:bg-slate-950 flex items-center justify-center text-[7.5px] text-slate-400 sm:text-slate-500 font-bold tracking-widest rounded-t pointer-events-none z-10 font-sans uppercase">
                    Student Mobile Simulator
                  </div>
                  <div className="pt-4 flex-1 overflow-y-auto max-h-[620px] pb-3 px-1 custom-scrollbar bg-slate-50 rounded-[1.2rem] sm:rounded-[2rem]">
                    {renderChallengePreview ? (
                      <React.Fragment key={resetKey}>
                        {renderChallengePreview(buildChallengePayload())}
                      </React.Fragment>
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400">Preview Simulator Ready</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* RIGHT COLUMN BLOCK BUILDER & INSPECTOR FIELDS */}
            {!isStudentViewMode && (editorLayoutMode === 'editor' || editorLayoutMode === 'split') && (
              <div className={`${editorLayoutMode === 'editor' ? 'xl:col-span-12' : 'xl:col-span-7 2xl:col-span-8'} bg-slate-50/50 rounded-2xl border border-slate-200/80 p-4 sm:p-5 space-y-4 block`}>
                <div className="border-b border-slate-200/80 pb-3">
                  <h4 className="text-xs font-black uppercase text-slate-705 tracking-wider">Screen Layout Blocks</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Define layout prompts and save task configurations below.</p>
                </div>

                {/* 🔊 SCREEN VOICE / TTS SECTION */}
                {selectedScreenForVoice && (
                  <ScreenVoiceSection
                    selectedScreen={selectedScreenForVoice}
                    lessonId={lesson?.id}
                    lessonTitle={lesson?.title || ''}
                    onNarrationsUpdated={(updatedNarrations) => {
                      if (lesson && module && onSaveChallenges) {
                        const updatedChallenges = currentChallenges.map(c => {
                          if (c.id === (chalId || selectedScreenForVoice.id)) {
                            return { ...c, audioNarrations: updatedNarrations };
                          }
                          return c;
                        });
                        onSaveChallenges(updatedChallenges);
                      }
                    }}
                  />
                )}

                <form onSubmit={(e) => { e.preventDefault(); handleSaveChallengeEdits(module.id, lesson.id, e); }} className="space-y-4">
                  <div className="space-y-3.5">
                    
                    {/* Common Header Field */}
                    <div className="space-y-1">
                      <label className="block text-[10.5px] uppercase font-black text-slate-550 font-bold">Interactive Screen Title / Prompt Question</label>
                      <input
                        type="text"
                        value={chalQuestion}
                        onChange={(e) => setChalQuestion(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-extrabold outline-none focus:border-indigo-500"
                        placeholder="e.g. Find the AI error below!"
                        required={chalType !== 'content_screen' && chalType !== 'visual_lesson_screen'}
                      />
                    </div>

                    {/* Sub-components for specific challenge types */}
                    <MultipleChoiceScreen screenForm={screenForm} />
                    <PairsBucketTimelineScreen screenForm={screenForm} />
                    <DialogueStoryScreen screenForm={screenForm} />

                    {/* Category C Dynamic Forms */}
                    {chalType.startsWith('c') && chalType !== 'content_screen' && (
                      <CategoryCForms
                        chalType={chalType}
                        chalMcqOptions={chalMcqOptions}
                        setChalMcqOptions={setChalMcqOptions}
                        chalMcqCorrect={chalMcqCorrect}
                        setChalMcqCorrect={setChalMcqCorrect}
                        chalImageUrl={chalImageUrl}
                        setChalImageUrl={setChalImageUrl}
                        chalC8Images={chalC8Images}
                        setChalC8Images={setChalC8Images}
                        chalFillBlankOptions={chalFillBlankOptions}
                        setChalFillBlankOptions={setChalFillBlankOptions}
                        chalFillBlankCorrect={chalFillBlankCorrect}
                        setChalFillBlankCorrect={setChalFillBlankCorrect}
                        chalSentenceTarget={chalSentenceTarget}
                        setChalSentenceTarget={setChalSentenceTarget}
                        chalChipsValue={chalChipsValue}
                        setChalChipsValue={setChalChipsValue}
                        chalChipsDistractors={chalChipsDistractors}
                        setChalChipsDistractors={setChalChipsDistractors}
                        chalConceptPairs={chalConceptPairs}
                        setChalConceptPairs={setChalConceptPairs}
                        chalDragBucket1={chalDragBucket1}
                        setChalDragBucket1={setChalDragBucket1}
                        chalDragBucket2={chalDragBucket2}
                        setChalDragBucket2={setChalDragBucket2}
                        chalBucketSortItems={chalBucketSortItems}
                        setChalBucketSortItems={setChalBucketSortItems}
                        chalTimelineSteps={chalTimelineSteps}
                        setChalTimelineSteps={setChalTimelineSteps}
                        chalSwipeLeftLabel={chalSwipeLeftLabel}
                        setChalSwipeLeftLabel={setChalSwipeLeftLabel}
                        chalSwipeRightLabel={chalSwipeRightLabel}
                        setChalSwipeRightLabel={setChalSwipeRightLabel}
                        chalImgClassifyItems={chalImgClassifyItems}
                        setChalImgClassifyItems={setChalImgClassifyItems}
                        chalC12Hotspots={chalC12Hotspots}
                        setChalC12Hotspots={setChalC12Hotspots}
                        chalC12Chips={chalC12Chips}
                        setChalC12Chips={setChalC12Chips}
                        chalC13Hotspots={chalC13Hotspots}
                        setChalC13Hotspots={setChalC13Hotspots}
                        chalC14Cards={chalC14Cards}
                        setChalC14Cards={setChalC14Cards}
                        chalC15Steps={chalC15Steps}
                        setChalC15Steps={setChalC15Steps}
                        chalC16Options={chalC16Options}
                        setChalC16Options={setChalC16Options}
                        chalC17Items={chalC17Items}
                        setChalC17Items={setChalC17Items}
                        chalAudioUrl={chalAudioUrl}
                        setChalAudioUrl={setChalAudioUrl}
                        chalHint={chalHint}
                        setChalHint={setChalHint}
                        chalDifficulty={chalDifficulty}
                        setChalDifficulty={setChalDifficulty}
                        chalContinueText={chalContinueText}
                        setChalContinueText={setChalContinueText}
                        chalMascotMessage={chalMascotMessage}
                        setChalMascotMessage={setChalMascotMessage}
                        chalExplanation={chalExplanation}
                        setChalExplanation={setChalExplanation}
                        chalExplanationConfused={chalExplanationConfused}
                        setChalExplanationConfused={setChalExplanationConfused}
                        chalExplanationConcept={chalExplanationConcept}
                        setChalExplanationConcept={setChalExplanationConcept}
                        chalExplanationExample={chalExplanationExample}
                        setChalExplanationExample={setChalExplanationExample}
                        chalExplanationTakeaway={chalExplanationTakeaway}
                        setChalExplanationTakeaway={setChalExplanationTakeaway}
                        chalExplanationSpeechScript={chalExplanationSpeechScript}
                        setChalExplanationSpeechScript={setChalExplanationSpeechScript}
                        chalQuestion={chalQuestion}
                        chalXpValue={chalXpValue}
                        setChalXpValue={setChalXpValue}
                        explanationAudioUrl={explanationAudioUrl}
                        setExplanationAudioUrl={setExplanationAudioUrl}
                        explanationAudioDuration={explanationAudioDuration}
                        setExplanationAudioDuration={setExplanationAudioDuration}
                        chalExplanationMarathi={chalExplanationMarathi}
                        setChalExplanationMarathi={setChalExplanationMarathi}
                        chalExplanationMarathiConfused={chalExplanationMarathiConfused}
                        setChalExplanationMarathiConfused={setChalExplanationMarathiConfused}
                        chalExplanationMarathiConcept={chalExplanationMarathiConcept}
                        setChalExplanationMarathiConcept={setChalExplanationMarathiConcept}
                        chalExplanationMarathiExample={chalExplanationMarathiExample}
                        setChalExplanationMarathiExample={setChalExplanationMarathiExample}
                        chalExplanationMarathiTakeaway={chalExplanationMarathiTakeaway}
                        setChalExplanationMarathiTakeaway={setChalExplanationMarathiTakeaway}
                        chalExplanationMarathiSpeechScript={chalExplanationMarathiSpeechScript}
                        setChalExplanationMarathiSpeechScript={setChalExplanationMarathiSpeechScript}
                        explanationAudioUrlMarathi={explanationAudioUrlMarathi}
                        setExplanationAudioUrlMarathi={setExplanationAudioUrlMarathi}
                        explanationAudioDurationMarathi={explanationAudioDurationMarathi}
                        setExplanationAudioDurationMarathi={setExplanationAudioDurationMarathi}
                      />
                    )}

                  </div>

                  {/* Save Trigger Button */}
                  <div className="pt-3 border-t border-slate-150">
                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 text-white font-sans font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Save size={14} />
                      Save Screen Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

      {/* LIST OF REGISTERED SCREENS IN ACTIVE LESSON */}
      {lesson && (
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Current Screens inside &ldquo;{lesson.title}&rdquo; ({currentChallenges.length})
            </h4>
            
            {/* View Switcher: Table vs Cards */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/70 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => { soundManager?.play?.('click'); setScreenListViewMode('table'); }}
                  className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                    screenListViewMode === 'table' ? 'bg-white text-indigo-700 font-black shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  📊 Table View
                </button>
                <button
                  type="button"
                  onClick={() => { soundManager?.play?.('click'); setScreenListViewMode('cards'); }}
                  className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                    screenListViewMode === 'cards' ? 'bg-white text-indigo-700 font-black shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🗂️ Cards View
                </button>
              </div>
            </div>
          </div>
          
          {currentChallenges.length === 0 ? (
            <div className="p-6 bg-slate-50 rounded-xl border text-center text-xs text-slate-400 italic">
              This lesson contains no question steps yet. Use the tool form above to append your first screen!
            </div>
          ) : screenListViewMode === 'table' ? (
            /* MINIMIZED COMPACT DATA TABLE */
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[10px] uppercase font-black tracking-wider text-slate-500">
                      <th className="py-2.5 px-3 w-12 text-center">#</th>
                      <th className="py-2.5 px-3 min-w-[150px]">Screen & Type</th>
                      <th className="py-2.5 px-3 min-w-[280px]">Interactive Content / Prompt</th>
                      <th className="py-2.5 px-3 min-w-[120px]">Voice Audio</th>
                      <th className="py-2.5 px-3 min-w-[80px]">XP</th>
                      <th className="py-2.5 px-3 min-w-[130px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentChallenges.map((chal, index, arr) => {
                      const isSelected = chalId === chal.id;
                      const narrations = chal.audioNarrations || {};
                      const en = !!narrations.english?.url;
                      const hi = !!narrations.hinglish?.url;
                      const mr = !!narrations.marathi?.url;

                      return (
                        <tr
                          key={chal.id}
                          onClick={() => selectChallengeForEditing(module.id, lesson.id, chal)}
                          className={`transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50/80 border-l-4 border-l-indigo-600'
                              : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-150 text-slate-650'
                            }`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] font-mono text-slate-400 font-semibold">
                                ID: {chal.id}
                              </span>
                              <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-150 px-1.5 py-0.5 rounded uppercase">
                                {chal.type === 'content_screen' || chal.type === 'visual_lesson_screen' ? 'Reading' : chal.type}
                              </span>
                              {isSelected && (
                                <span className="text-[8px] font-black text-white bg-indigo-600 px-1 py-0.5 rounded uppercase tracking-wider">
                                  Active
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <p className="text-xs font-bold text-slate-800 line-clamp-1 max-w-lg">
                              {chal.question || 'Untitled Screen Content'}
                            </p>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1 text-[9px] font-mono font-bold">
                              <span className={`px-1 py-0.5 rounded ${en ? 'bg-emerald-100 text-emerald-800 font-extrabold' : 'bg-slate-100 text-slate-400'}`} title="English Voice">
                                EN
                              </span>
                              <span className={`px-1 py-0.5 rounded ${hi ? 'bg-emerald-100 text-emerald-800 font-extrabold' : 'bg-slate-100 text-slate-400'}`} title="Hinglish Voice">
                                HI
                              </span>
                              <span className={`px-1 py-0.5 rounded ${mr ? 'bg-emerald-100 text-emerald-800 font-extrabold' : 'bg-slate-100 text-slate-400'}`} title="Marathi Voice">
                                MR
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-mono text-emerald-600 font-bold whitespace-nowrap">
                              ★ {chal.xpValue || 10} XP
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => selectChallengeForEditing(module.id, lesson.id, chal)}
                                className="px-2 py-1 text-[10px] font-bold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => {
                                  if (index > 0 && onSaveChallenges) {
                                    const next = [...currentChallenges];
                                    const temp = next[index];
                                    next[index] = next[index - 1];
                                    next[index - 1] = temp;
                                    onSaveChallenges(next);
                                    soundManager?.play?.('click');
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition cursor-pointer"
                                title="Move Up"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                disabled={index === arr.length - 1}
                                onClick={() => {
                                  if (index < arr.length - 1 && onSaveChallenges) {
                                    const next = [...currentChallenges];
                                    const temp = next[index];
                                    next[index] = next[index + 1];
                                    next[index + 1] = temp;
                                    onSaveChallenges(next);
                                    soundManager?.play?.('click');
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition cursor-pointer"
                                title="Move Down"
                              >
                                ▼
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteChallenge(module.id, lesson.id, chal.id, e)}
                                className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                title="Delete Screen"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ADJUSTED COMPACT CARD GRID (NO OVERLAPPING) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentChallenges.map((chal, index) => {
                const isSelected = chalId === chal.id;
                const hasVoice = !!(chal.audioNarrations?.english?.url || chal.audioNarrations?.hinglish?.url || chal.audioNarrations?.marathi?.url);

                return (
                  <div 
                    key={chal.id} 
                    onClick={() => selectChallengeForEditing(module.id, lesson.id, chal)}
                    className={`p-3 rounded-xl border flex flex-col justify-between gap-2 shadow-2xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-150 text-slate-650'
                        }`}>
                          Screen {index + 1}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 truncate">
                          ID: {chal.id}
                        </span>
                        <span className="text-[9px] font-bold text-indigo-600 uppercase bg-indigo-50 px-1 py-0.5 rounded">
                          {chal.type === 'content_screen' || chal.type === 'visual_lesson_screen' ? 'Reading' : chal.type}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
                        {chal.question || 'Untitled Screen Content'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[9px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-emerald-600 font-semibold">★ {chal.xpValue || 10} XP</span>
                        {hasVoice && (
                          <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.5 rounded flex items-center gap-0.5">
                            🔊 Voice
                          </span>
                        )}
                        {isSelected && (
                          <span className="font-extrabold text-indigo-700 bg-indigo-100/70 px-1 rounded">
                            Active
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChallenge(module.id, lesson.id, chal.id, e);
                        }}
                        className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-650 transition cursor-pointer"
                        title="Delete Screen"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
