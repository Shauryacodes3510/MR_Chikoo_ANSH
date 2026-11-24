import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Wand2, 
  Copy, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Shield, 
  Trash2,
  FileCode,
  Layers,
  ChevronDown,
  ChevronUp,
  Sliders,
  Eye,
  ArrowRight,
  Info,
  Check
} from 'lucide-react';
import { 
  Module, 
  Lesson, 
  UnitStoryBible, 
  LessonMemory 
} from '../../lib/curriculumTypes';
import { soundManager } from '../../lib/sounds';
import { UnitStoryBibleEditor, DEFAULT_STORY_BIBLE } from './UnitStoryBibleEditor';
import { validateLessonJsonString, validateLessonObject, ValidationResult } from '../../lib/lessonValidator';
import { ChallengePreview } from './ChallengePreviewWrapper';

interface AILessonGeneratorProps {
  modulesList: Module[];
  practiceModulesList: Module[];
  onSaveLessonToModule: (moduleId: string, lesson: Lesson, updatedStoryBible?: UnitStoryBible) => void;
  triggerNotification: (msg: string, type?: 'success' | 'error') => void;
  selectedModuleId?: string;
  onSelectModuleId?: (id: string) => void;
}

type GeneratorState = 'idle' | 'generating' | 'ready' | 'error';

export const AILessonGenerator: React.FC<AILessonGeneratorProps> = ({
  modulesList,
  practiceModulesList,
  onSaveLessonToModule,
  triggerNotification,
  selectedModuleId: propSelectedModuleId,
  onSelectModuleId
}) => {
  const allModules = [...modulesList, ...practiceModulesList];

  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    propSelectedModuleId || allModules[0]?.id || ''
  );

  useEffect(() => {
    if (propSelectedModuleId) {
      setSelectedModuleId(propSelectedModuleId);
    }
  }, [propSelectedModuleId]);

  const currentModule = allModules.find(m => m.id === selectedModuleId);
  const storyBible: UnitStoryBible = currentModule?.metadata?.storyBible || DEFAULT_STORY_BIBLE;

  // Story Bible Editor Modal
  const [isBibleEditorOpen, setIsBibleEditorOpen] = useState(false);

  // Lesson Generation Form State
  const [targetConcept, setTargetConcept] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [pedagogicalObjective, setPedagogicalObjective] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [screenCount, setScreenCount] = useState<number>(6);
  const [customStoryGoal, setCustomStoryGoal] = useState('');
  const [selectedPrevLessonId, setSelectedPrevLessonId] = useState<string>('auto');

  // Generator Lifecycle State
  const [generatorState, setGeneratorState] = useState<GeneratorState>('idle');
  const [rawJsonText, setRawJsonText] = useState<string>('');
  const [parsedLesson, setParsedLesson] = useState<Lesson | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [wasRepaired, setWasRepaired] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // UI helpers
  const [copiedJson, setCopiedJson] = useState(false);
  const [showValidationDetails, setShowValidationDetails] = useState(false);
  const [showVisualPreview, setShowVisualPreview] = useState(false);
  const [previewScreenIndex, setPreviewScreenIndex] = useState(0);

  // Extract previous lesson memory from selected unit
  const previousLessonContext: LessonMemory | undefined = (() => {
    if (!currentModule || !currentModule.lessons || currentModule.lessons.length === 0) {
      return undefined;
    }

    if (selectedPrevLessonId === 'none') {
      return undefined;
    }

    let prevLesson: Lesson | undefined;
    if (selectedPrevLessonId === 'auto') {
      prevLesson = currentModule.lessons[currentModule.lessons.length - 1];
    } else {
      prevLesson = currentModule.lessons.find(l => l.id === selectedPrevLessonId);
    }

    if (!prevLesson) return undefined;

    return {
      lessonId: prevLesson.id,
      lessonTitle: prevLesson.title,
      conceptTaught: prevLesson.category || prevLesson.title,
      storyEvent: `Chikoo and Byte completed the "${prevLesson.title}" expedition.`,
      characterStatus: 'Energized and ready for the next mission.',
      cliffhangerOrHook: `A new telemetry reading related to ${targetConcept || 'the next challenge'} was spotted.`,
      dateGenerated: new Date().toISOString()
    };
  })();

  // Trigger Direct Generation (One AI call with server auto-repair & validation)
  const handleGenerate = async () => {
    if (!targetConcept.trim()) {
      triggerNotification('Please provide a Target Concept to teach!', 'error');
      soundManager.play('incorrect');
      return;
    }

    if (!currentModule) {
      triggerNotification('Please select a valid Learning Unit!', 'error');
      soundManager.play('incorrect');
      return;
    }

    setGeneratorState('generating');
    setErrorMessage(null);
    setWasRepaired(false);
    setShowValidationDetails(false);
    soundManager.play('click');

    try {
      const payload = {
        unitId: currentModule.id,
        unitTitle: currentModule.title,
        unitContext: storyBible,
        previousLessonMemory: previousLessonContext,
        lessonTitle: lessonTitle.trim() || undefined,
        concept: targetConcept.trim(),
        objective: pedagogicalObjective.trim() || undefined,
        difficulty,
        storyGoal: customStoryGoal.trim() || undefined,
        screenCount
      };

      const res = await fetch('/api/admin/generate-lesson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const textBody = await res.text();
        throw new Error(`Server returned non-JSON response (${res.status}): ${textBody.slice(0, 150)}`);
      }

      const data = await res.json();

      if (!res.ok && !data.lesson) {
        throw new Error(data.error || `Generation failed with status ${res.status}`);
      }

      const formattedJson = data.rawJsonText || (data.lesson ? JSON.stringify(data.lesson, null, 2) : '');
      setRawJsonText(formattedJson);
      setParsedLesson(data.lesson || null);
      setWasRepaired(!!data.repaired);

      // Validate returned JSON
      const valResult = data.validation || validateLessonJsonString(formattedJson);
      setValidationResult(valResult);

      if (valResult.isValid && data.lesson) {
        setGeneratorState('ready');
        triggerNotification(
          data.repaired 
            ? `Lesson generated & auto-repaired successfully! ✅` 
            : `Lesson "${data.lesson.title}" generated successfully! ✅`, 
          'success'
        );
        soundManager.play('complete');
      } else {
        // If invalid even after repair, show the state with validation error highlights
        setGeneratorState('ready');
        setErrorMessage(`Validation identified issues: ${valResult.issues.join('; ')}`);
        setShowValidationDetails(true);
        triggerNotification('JSON generated with validation warnings. Inspect below.', 'error');
        soundManager.play('incorrect');
      }
    } catch (err: any) {
      console.error('[AILessonGenerator] Generation error:', err);
      setGeneratorState('error');
      const errText = err.message || 'An unexpected error occurred during AI lesson generation.';
      setErrorMessage(errText);
      triggerNotification(errText, 'error');
      soundManager.play('incorrect');
    }
  };

  // Copy JSON to clipboard
  const handleCopyJson = async () => {
    if (!rawJsonText) return;
    try {
      await navigator.clipboard.writeText(rawJsonText);
      setCopiedJson(true);
      triggerNotification('Lesson JSON copied to clipboard! 📋', 'success');
      soundManager.play('click');
      setTimeout(() => setCopiedJson(false), 2200);
    } catch {
      triggerNotification('Failed to copy to clipboard.', 'error');
    }
  };

  // Download JSON file
  const handleDownloadJson = () => {
    if (!rawJsonText) return;
    try {
      const fileName = `${parsedLesson?.id || 'chikoo_lesson'}_${Date.now()}.json`;
      const blob = new Blob([rawJsonText], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      triggerNotification(`Downloaded ${fileName} 💾`, 'success');
      soundManager.play('complete');
    } catch (err: any) {
      triggerNotification('Failed to download JSON file.', 'error');
    }
  };

  // Validate JSON manually
  const handleValidateJson = () => {
    const val = validateLessonJsonString(rawJsonText);
    setValidationResult(val);
    setShowValidationDetails(true);
    if (val.isValid) {
      if (val.normalizedLesson) {
        setParsedLesson(val.normalizedLesson);
      }
      triggerNotification('All validation checks passed! Schema is 100% compliant. ✅', 'success');
      soundManager.play('complete');
    } else {
      triggerNotification(`Validation failed with ${val.issues.length} issue(s).`, 'error');
      soundManager.play('incorrect');
    }
  };

  // Clear JSON
  const handleClear = () => {
    setRawJsonText('');
    setParsedLesson(null);
    setValidationResult(null);
    setErrorMessage(null);
    setGeneratorState('idle');
    setWasRepaired(false);
    triggerNotification('Editor cleared.');
    soundManager.play('click');
  };

  // Quick direct import into the selected module
  const handleImportIntoUnit = () => {
    if (!currentModule) {
      triggerNotification('No unit selected for import.', 'error');
      return;
    }

    const val = validateLessonJsonString(rawJsonText);
    if (!val.isValid || !val.normalizedLesson) {
      triggerNotification('Cannot import invalid JSON. Please validate and fix errors first.', 'error');
      soundManager.play('incorrect');
      return;
    }

    onSaveLessonToModule(currentModule.id, val.normalizedLesson, storyBible);
    triggerNotification(`Imported "${val.normalizedLesson.title}" into ${currentModule.title}! 🎉`, 'success');
    soundManager.play('complete');
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/70 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-750 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono">
                <Sparkles size={11} />
                AI Curriculum Architect
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-750 px-2 py-0.5 rounded-full font-mono">
                Direct Synchronous Engine
              </span>
              {wasRepaired && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <Shield size={10} />
                  Auto-Repaired
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Chikoo AI Lesson Generator
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Generate structured, story-anchored Chikoo lessons with one AI response.
            </p>
          </div>

          {/* Unit Selector & Story Bible */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="space-y-0.5 min-w-[220px]">
              <label className="text-[9.5px] font-black uppercase tracking-wider text-slate-400">Target Unit / Module</label>
              <select
                value={selectedModuleId}
                onChange={(e) => {
                  setSelectedModuleId(e.target.value);
                  if (onSelectModuleId) onSelectModuleId(e.target.value);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-violet-500 transition cursor-pointer"
              >
                {allModules.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.lessons?.length || 0} lessons)
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                setIsBibleEditorOpen(true);
              }}
              className="mt-4 px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-black rounded-xl border border-slate-200 flex items-center gap-1.5 transition cursor-pointer"
              title="Edit characters, story arc, and learning goals for this unit"
            >
              <BookOpen size={14} className="text-violet-600" />
              <span>Unit Story Bible</span>
            </button>
          </div>
        </div>
      </div>

      {/* GENERATION PARAMETERS & WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: PARAMETER SETUP (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/70 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-violet-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Lesson Parameters
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              {storyBible.characters?.length || 2} Characters Loaded
            </span>
          </div>

          {/* Unit Context Card */}
          <div className="p-3 bg-violet-50/60 rounded-2xl border border-violet-150/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-black uppercase text-violet-750 tracking-wider">Unit Story Context</span>
              <button
                type="button"
                onClick={() => setIsBibleEditorOpen(true)}
                className="text-[9.5px] font-bold text-violet-600 hover:underline"
              >
                Customize Arc
              </button>
            </div>
            <p className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">
              {storyBible.storyPremise}
            </p>
            <div className="flex items-center gap-1 flex-wrap pt-0.5">
              {(storyBible.characters || []).map((c, i) => (
                <span key={i} className="text-[9px] font-bold bg-white text-slate-700 border border-violet-200/80 px-2 py-0.5 rounded-md">
                  🎭 {c.name}
                </span>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-black tracking-wider text-violet-700">
                Target Concept / Skill *
              </label>
              <input
                type="text"
                value={targetConcept}
                onChange={(e) => setTargetConcept(e.target.value)}
                placeholder="e.g. Linear Regression, Sensor Noise, Sorting Queues"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-black outline-none focus:border-violet-500 focus:bg-white transition"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500">
                Lesson Title (Optional)
              </label>
              <input
                type="text"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="Leave blank to let AI craft a catchy title"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold outline-none focus:border-violet-500 focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500">
                  Difficulty Tier
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-violet-500 transition cursor-pointer"
                >
                  <option value="Easy">Easy (Explorer)</option>
                  <option value="Medium">Medium (Specialist)</option>
                  <option value="Hard">Hard (Commander)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500">
                  Total Screens
                </label>
                <select
                  value={screenCount}
                  onChange={(e) => setScreenCount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-violet-500 transition cursor-pointer"
                >
                  <option value={5}>5 Screens (1 Story, 1 Concept, 3 Quizzes)</option>
                  <option value={6}>6 Screens (Recommended Standard)</option>
                  <option value={7}>7 Screens (Deep Practice)</option>
                  <option value={8}>8 Screens (Extended Mastery)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500">
                Pedagogical Objective (Optional)
              </label>
              <textarea
                value={pedagogicalObjective}
                onChange={(e) => setPedagogicalObjective(e.target.value)}
                rows={2}
                placeholder="e.g. Students will distinguish signal from noise and apply threshold filters."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-medium outline-none focus:border-violet-500 focus:bg-white transition resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500">
                Story Cliffhanger / Mission Goal (Optional)
              </label>
              <input
                type="text"
                value={customStoryGoal}
                onChange={(e) => setCustomStoryGoal(e.target.value)}
                placeholder="e.g. The rover lost communication in a sandstorm!"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium outline-none focus:border-violet-500 focus:bg-white transition"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500">
                Previous Lesson Continuity
              </label>
              <select
                value={selectedPrevLessonId}
                onChange={(e) => setSelectedPrevLessonId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-violet-500 transition cursor-pointer"
              >
                <option value="auto">Auto (Latest lesson in this unit)</option>
                <option value="none">None (Fresh unit opening)</option>
                {(currentModule?.lessons || []).map(l => (
                  <option key={l.id} value={l.id}>
                    Link to: {l.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generatorState === 'generating'}
              className={`w-full py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                generatorState === 'generating'
                  ? 'bg-violet-400 text-white cursor-not-allowed opacity-80'
                  : 'bg-violet-600 hover:bg-violet-500 active:scale-98 text-white shadow-violet-200'
              }`}
            >
              {generatorState === 'generating' ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Generating Lesson...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} className="animate-pulse" />
                  <span>Generate Lesson</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: RAW JSON TEXT AREA & CONTROLS (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/70 shadow-2xs space-y-4">
          
          {/* Status Header & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileCode size={18} className="text-violet-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Generated Lesson JSON
              </h3>
              {generatorState === 'ready' && validationResult?.isValid && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  JSON Ready ✅
                </span>
              )}
              {generatorState === 'generating' && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <RefreshCw size={11} className="animate-spin" />
                  Generating...
                </span>
              )}
            </div>

            {/* Top Toolbar Actions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleCopyJson}
                disabled={!rawJsonText || generatorState === 'generating'}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border cursor-pointer ${
                  copiedJson 
                    ? 'bg-emerald-600 text-white border-emerald-700' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {copiedJson ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedJson ? 'Copied! ✅' : 'Copy JSON'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadJson}
                disabled={!rawJsonText || generatorState === 'generating'}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download size={13} />
                <span>Download</span>
              </button>

              <button
                type="button"
                onClick={handleValidateJson}
                disabled={!rawJsonText || generatorState === 'generating'}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Shield size={13} className="text-violet-600" />
                <span>Validate</span>
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={generatorState === 'generating' || !targetConcept.trim()}
                className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-750 text-xs font-bold rounded-xl border border-violet-200 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCw size={13} className={generatorState === 'generating' ? 'animate-spin' : ''} />
                <span>Regenerate</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                disabled={!rawJsonText && generatorState === 'idle'}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 text-xs font-bold rounded-xl border border-slate-200 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Clear JSON"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* GENERATION STATE ALERTS & NOTICES */}
          {generatorState === 'generating' && (
            <div className="p-4 bg-violet-50 border border-violet-200 rounded-2xl flex items-center gap-3 animate-pulse">
              <div className="p-2 bg-violet-600 text-white rounded-xl">
                <Sparkles size={18} className="animate-spin" />
              </div>
              <div className="space-y-0.5">
                <div className="font-extrabold text-xs text-violet-900">
                  Generating Chikoo Lesson for "{targetConcept}"...
                </div>
                <div className="text-[11px] text-violet-700 font-medium">
                  Sending prompt with Unit Story Bible + previous lesson continuity. Waiting for single AI response.
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
              <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <div className="font-extrabold text-xs text-rose-900">AI / API Error Notice</div>
                <div className="text-[11px] text-rose-700 font-mono break-all leading-relaxed">
                  {errorMessage}
                </div>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="mt-2 text-[10px] font-black uppercase text-rose-800 bg-rose-100 hover:bg-rose-200 px-2.5 py-1 rounded-lg transition"
                >
                  🔄 Retry Generation
                </button>
              </div>
            </div>
          )}

          {/* VALIDATION RESULTS DRAWER */}
          {validationResult && showValidationDetails && (
            <div className={`p-4 rounded-2xl border ${
              validationResult.isValid 
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
                : 'bg-amber-50/90 border-amber-200 text-amber-900'
            } space-y-2 text-xs`}>
              <div className="flex items-center justify-between font-black">
                <div className="flex items-center gap-2">
                  {validationResult.isValid ? (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  ) : (
                    <AlertCircle size={16} className="text-amber-600" />
                  )}
                  <span>
                    {validationResult.isValid 
                      ? 'Validation Checks: All Passed (100% Compliant)' 
                      : `Validation Notice: ${validationResult.issues.length} Issue(s) Detected`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowValidationDetails(false)}
                  className="text-[10px] font-bold text-slate-500 hover:underline"
                >
                  Hide
                </button>
              </div>

              {/* Stats pill list */}
              <div className="flex items-center gap-2 flex-wrap text-[10.5px] font-bold">
                <span className="bg-white/80 px-2 py-0.5 rounded-md border border-black/5">
                  Screens: {validationResult.stats.screenCount}
                </span>
                <span className="bg-white/80 px-2 py-0.5 rounded-md border border-black/5">
                  Story: {validationResult.stats.storyScreens}
                </span>
                <span className="bg-white/80 px-2 py-0.5 rounded-md border border-black/5">
                  Interactive: {validationResult.stats.interactiveScreens}
                </span>
                <span className="bg-white/80 px-2 py-0.5 rounded-md border border-black/5">
                  Total XP: {validationResult.stats.totalXp}
                </span>
              </div>

              {validationResult.issues.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="font-bold text-[11px] text-rose-800">Issues to resolve:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-700 font-mono">
                    {validationResult.issues.map((iss, i) => (
                      <li key={i}>{iss}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* LARGE EDITABLE CODE / TEXT AREA */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Chikoo Lesson JSON ({rawJsonText.length} characters)</span>
              <span>Directly editable</span>
            </div>
            <textarea
              value={rawJsonText}
              onChange={(e) => {
                setRawJsonText(e.target.value);
                try {
                  const parsed = JSON.parse(e.target.value);
                  setParsedLesson(parsed);
                } catch {
                  // user is typing
                }
              }}
              placeholder={`{\n  "title": "🚀 Lesson Title",\n  "challenges": [\n    ...\n  ]\n}`}
              rows={18}
              spellCheck="false"
              className="w-full bg-slate-950 text-emerald-400 font-mono text-xs leading-relaxed p-4 rounded-2xl border border-slate-800 outline-none shadow-inner focus:border-violet-500 selection:bg-violet-900 selection:text-white transition resize-y min-h-[380px]"
            />
          </div>

          {/* BOTTOM QUICK ACTIONS */}
          {rawJsonText && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowVisualPreview(!showVisualPreview)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Eye size={14} className="text-violet-600" />
                  <span>{showVisualPreview ? 'Hide Screen Cards' : 'Inspect Visual Screen Cards'}</span>
                </button>
              </div>

              {currentModule && (
                <button
                  type="button"
                  onClick={handleImportIntoUnit}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <CheckCircle2 size={15} />
                  <span>Import Directly into {currentModule.title.split(' ')[0]}</span>
                </button>
              )}
            </div>
          )}

          {/* OPTIONAL EXPANDABLE VISUAL SCREEN CARDS */}
          {showVisualPreview && parsedLesson && parsedLesson.challenges && parsedLesson.challenges.length > 0 && (
            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Screens Inspector ({parsedLesson.challenges.length} Screens)
                </h4>
                <div className="flex items-center gap-1 overflow-x-auto max-w-[300px]">
                  {parsedLesson.challenges.map((c, idx) => (
                    <button
                      key={`screen-btn-${c.id || idx}-${idx}`}
                      type="button"
                      onClick={() => setPreviewScreenIndex(idx)}
                      className={`px-2 py-1 text-[10px] font-mono font-bold rounded-lg transition ${
                        previewScreenIndex === idx
                          ? 'bg-violet-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      #{idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Screen Card */}
              {parsedLesson.challenges[previewScreenIndex] && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400">
                    <span>Screen #{previewScreenIndex + 1} &bull; Type: {parsedLesson.challenges[previewScreenIndex].type}</span>
                    <span>XP: {parsedLesson.challenges[previewScreenIndex].xpValue || 15}</span>
                  </div>
                  <div className="text-xs font-black text-slate-900">
                    {parsedLesson.challenges[previewScreenIndex].question}
                  </div>
                  {parsedLesson.challenges[previewScreenIndex].options && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {parsedLesson.challenges[previewScreenIndex].options?.map((opt, oIdx) => (
                        <div 
                          key={`opt-preview-${oIdx}-${opt}`}
                          className={`p-2 rounded-lg text-[11px] font-semibold border ${
                            opt === parsedLesson?.challenges[previewScreenIndex].correctAnswer
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          {opt} {opt === parsedLesson?.challenges[previewScreenIndex].correctAnswer && '✅'}
                        </div>
                      ))}
                    </div>
                  )}
                  {parsedLesson.challenges[previewScreenIndex].contentScreen && (
                    <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                      <div className="font-extrabold text-slate-900">
                        {parsedLesson.challenges[previewScreenIndex].contentScreen?.heading}
                      </div>
                      <div className="text-slate-600 whitespace-pre-line text-[11px]">
                        {parsedLesson.challenges[previewScreenIndex].contentScreen?.contentBody}
                      </div>
                      {parsedLesson.challenges[previewScreenIndex].contentScreen?.highlightBox && (
                        <div className="p-2 bg-amber-50 rounded text-amber-900 font-bold text-[10.5px]">
                          {parsedLesson.challenges[previewScreenIndex].contentScreen?.highlightBox}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* UNIT STORY BIBLE MODAL */}
      {isBibleEditorOpen && currentModule && (
        <UnitStoryBibleEditor
          module={currentModule}
          onClose={() => setIsBibleEditorOpen(false)}
          onSave={(updatedMod) => {
            const updatedBible = updatedMod.metadata?.storyBible;
            if (currentModule.lessons && currentModule.lessons.length > 0) {
              onSaveLessonToModule(currentModule.id, currentModule.lessons[0], updatedBible);
            }
            triggerNotification(`Saved Story Bible for ${currentModule.title}!`, 'success');
            soundManager.play('complete');
            setIsBibleEditorOpen(false);
          }}
        />
      )}

    </div>
  );
};
