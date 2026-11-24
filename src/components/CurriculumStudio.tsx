import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Brain, 
  Send, 
  Trophy, 
  ArrowRight, 
  Zap, 
  Layers, 
  Image as ImageIcon, 
  CheckCircle, 
  BookOpen, 
  AlertCircle, 
  GripVertical,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Save,
  RotateCcw,
  Plus,
  Info
} from 'lucide-react';
import { soundManager } from '../lib/sounds';
import { supabase } from '../lib/supabase';
import { saveCurriculumToStorage, AI_CURRICULUM, PRACTICE_CURRICULUM } from '../lib/content';
import { Module, Lesson, Challenge } from '../lib/curriculumTypes';
import { ScreenVoiceSection } from './admin/ScreenVoiceSection';

const PRESET_TOPICS = [
  "🚀 Self-Driving Delivery Carts in Mumbai",
  "🐾 Unsupervised Sorting of Street Puppies",
  "🎭 Sarcasm & Sentiment Analyzers in TikTok",
  "🎮 Reinforcement Learning in Retro Arcade Games",
  "🔐 Shielding Mobile UPI Apps from Midnight Hackers"
];

const LOADING_STEPS = [
  "🛸 Launching Chikoo Concept Detectors...",
  "🧠 Gemini analyzing key subject structures...",
  "🎭 Designing relatable real-world analogies...",
  "🎨 Creating consistent educational illustration styles...",
  "📊 Constructing infographic pipelines & visual flowcharts...",
  "⚡ Compiling interactive Quick Checks & dopamine rewards..."
];

interface CurriculumStudioProps {
  onStudyLesson: (lesson: { id: string; title: string; description: string }) => void;
}

export default function CurriculumStudio({ onStudyLesson }: CurriculumStudioProps) {
  // Main Studio Tabs: 'create' (existing generative draft) or 'organize' (new hierarchical builder)
  const [activeStudioTab, setActiveStudioTab] = useState<'create' | 'organize'>('create');

  // ==========================================
  // TAB 1: AI GENERATOR STATE
  // ==========================================
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [generatedLesson, setGeneratedLesson] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Rotate loading steps
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStepIdx(prev => (prev + 1) * 123 % LOADING_STEPS.length);
      }, 2500);
    } else {
      setLoadingStepIdx(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleForgeLesson = async (selectedTopic: string) => {
    const query = selectedTopic.trim();
    if (!query) return;

    soundManager.play('click');
    setIsLoading(true);
    setGeneratedLesson(null);
    setErrorMsg(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (supabase) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.access_token) {
            headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
          }
        } catch (_) {}
      }

      const response = await fetch('/api/curriculum/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ topic: query })
      });

      const data = await response.json();
      if (response.ok && data.id) {
        soundManager.play('complete');
        setGeneratedLesson(data);
        
        // Push to local global cache so it is instantly retrievable on App start
        if (!(window as any).customLessonsArray) {
          (window as any).customLessonsArray = [];
        }
        (window as any).customLessonsArray.push(data);
      } else {
        setErrorMsg(data.error || "The AI is refilling its energy. Please make sure the GEMINI_API_KEY is configured in Settings > Secrets!");
        soundManager.play('incorrect');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to reach building servers. Let's try again in a few seconds.");
      soundManager.play('incorrect');
    } finally {
      setIsLoading(false);
    }
  };


  // ==========================================
  // TAB 2: ORGANIZER STATE (DRAG & DROP TREE)
  // ==========================================
  const [curriculumTrack, setCurriculumTrack] = useState<'ai' | 'practice'>('ai');
  const [modules, setModules] = useState<Module[]>([]);
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});
  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({});
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Drag and drop pointers
  const [draggedItem, setDraggedItem] = useState<{
    type: 'unit' | 'lesson' | 'screen';
    unitId: string;
    lessonId?: string;
    screenId?: string;
    index: number;
  } | null>(null);

  const [dragOverItem, setDragOverItem] = useState<{
    type: 'unit' | 'lesson' | 'screen';
    unitId: string;
    lessonId?: string;
    screenId?: string;
    index: number;
  } | null>(null);

  // Screen voice narration generation state
  const [generatingVoiceScreenId, setGeneratingVoiceScreenId] = useState<string | null>(null);
  const [selectedVoiceScreenId, setSelectedVoiceScreenId] = useState<string | null>(null);
  const [screenVoiceTabs, setScreenVoiceTabs] = useState<Record<string, 'english' | 'hinglish' | 'marathi'>>({});

  const getStatusForLang = (screen: any, lang: 'english' | 'hinglish' | 'marathi') => {
    if (generatingVoiceScreenId === screen.id) return 'Generating';
    const narrations = screen.audioNarrations || {};
    const langObj = narrations[lang];
    if (!langObj || !langObj.url) return 'Not Generated';
    return 'Ready';
  };

  const handleGenerateVoice = async (unitId: string, lessonId: string, screen: any, lessonTitle: string) => {
    soundManager.play('click');
    setGeneratingVoiceScreenId(screen.id);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (supabase) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.access_token) {
            headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
          }
        } catch (_) {}
      }

      const response = await fetch('/api/admin/generate-screen-narration', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          lessonId,
          screenId: screen.id,
          screenData: screen,
          lessonTitle
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        soundManager.play('complete');
        setModules(prevModules => {
          return prevModules.map(m => {
            if (m.id === unitId) {
              return {
                ...m,
                lessons: m.lessons.map(l => {
                  if (l.id === lessonId) {
                    return {
                      ...l,
                      challenges: l.challenges.map(c => {
                        if (c.id === screen.id) {
                          return { ...c, audioNarrations: data.audioNarrations };
                        }
                        return c;
                      })
                    };
                  }
                  return l;
                })
              };
            }
            return m;
          });
        });
        setTimeout(() => saveCurriculumToStorage(AI_CURRICULUM, PRACTICE_CURRICULUM), 100);
      } else {
        alert(data.error || "Failed to generate voice narration.");
        soundManager.play('incorrect');
      }
    } catch (err: any) {
      console.error(err);
      alert("Network error generating voice narration.");
      soundManager.play('incorrect');
    } finally {
      setGeneratingVoiceScreenId(null);
    }
  };

  const handlePreviewAudio = (url: string) => {
    if (!url) return;
    soundManager.play('click');
    const audio = new Audio(url);
    audio.play().catch(err => console.warn("Audio preview playback error:", err));
  };

  // Load modules on mount or track selection
  const loadTrackerModules = () => {
    if (curriculumTrack === 'ai') {
      setModules(JSON.parse(JSON.stringify(AI_CURRICULUM)));
    } else {
      setModules(JSON.parse(JSON.stringify(PRACTICE_CURRICULUM)));
    }
  };

  useEffect(() => {
    loadTrackerModules();
  }, [curriculumTrack, activeStudioTab]);

  useEffect(() => {
    const handleCurriculumChange = () => {
      loadTrackerModules();
    };
    window.addEventListener('curriculumChanged', handleCurriculumChange);
    return () => {
      window.removeEventListener('curriculumChanged', handleCurriculumChange);
    };
  }, [curriculumTrack]);

  // Set initial expansion states when modules load
  useEffect(() => {
    if (modules.length > 0) {
      const initialUnits: Record<string, boolean> = {};
      const initialLessons: Record<string, boolean> = {};
      modules.forEach((mod, idx) => {
        // Expand the first unit by default
        initialUnits[mod.id] = idx === 0 || (expandedUnits[mod.id] ?? true);
        mod.lessons.forEach(l => {
          initialLessons[l.id] = expandedLessons[l.id] ?? false;
        });
      });
      setExpandedUnits(prev => ({ ...initialUnits, ...prev }));
      setExpandedLessons(prev => ({ ...initialLessons, ...prev }));
    }
  }, [modules]);

  // Expand/Collapse toggles
  const handleToggleExpandUnit = (id: string) => {
    setExpandedUnits(prev => ({ ...prev, [id]: !prev[id] }));
    soundManager.play('click');
  };

  const handleToggleExpandLesson = (id: string) => {
    setExpandedLessons(prev => ({ ...prev, [id]: !prev[id] }));
    soundManager.play('click');
  };

  const handleToggleAll = (expand: boolean) => {
    const updatedUnits: Record<string, boolean> = {};
    const updatedLessons: Record<string, boolean> = {};
    modules.forEach(mod => {
      updatedUnits[mod.id] = expand;
      mod.lessons.forEach(l => {
        updatedLessons[l.id] = expand;
      });
    });
    setExpandedUnits(updatedUnits);
    setExpandedLessons(updatedLessons);
    soundManager.play('click');
  };

  // ----------------- REORDER FUNCTIONS -----------------
  const moveUnit = (fromIdx: number, toIdx: number) => {
    if (fromIdx < 0 || toIdx < 0 || fromIdx >= modules.length || toIdx >= modules.length) return;
    const updated = JSON.parse(JSON.stringify(modules));
    const [removed] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, removed);
    setModules(updated);
    soundManager.play('click');
  };

  const moveLesson = (srcUnitId: string, fromIdx: number, targetUnitId: string, toIdx: number) => {
    const updated = JSON.parse(JSON.stringify(modules));
    const srcUnit = updated.find((u: Module) => u.id === srcUnitId);
    const dstUnit = updated.find((u: Module) => u.id === targetUnitId);
    if (!srcUnit || !dstUnit) return;

    if (fromIdx < 0 || fromIdx >= srcUnit.lessons.length) return;
    const [removed] = srcUnit.lessons.splice(fromIdx, 1);
    
    // Safety check for index boundaries in target module
    const targetLessonsLength = dstUnit.lessons.length;
    const insertIdx = Math.max(0, Math.min(toIdx, targetLessonsLength));
    dstUnit.lessons.splice(insertIdx, 0, removed);
    
    setModules(updated);
    soundManager.play('click');
  };

  const moveScreen = (
    srcUnitId: string, 
    srcLessonId: string, 
    fromIdx: number, 
    targetUnitId: string, 
    targetLessonId: string, 
    toIdx: number
  ) => {
    const updated = JSON.parse(JSON.stringify(modules));
    const srcUnit = updated.find((u: Module) => u.id === srcUnitId);
    const dstUnit = updated.find((u: Module) => u.id === targetUnitId);
    if (!srcUnit || !dstUnit) return;

    const srcLesson = srcUnit.lessons.find((l: Lesson) => l.id === srcLessonId);
    const dstLesson = dstUnit.lessons.find((l: Lesson) => l.id === targetLessonId);
    if (!srcLesson || !dstLesson) return;

    if (fromIdx < 0 || fromIdx >= srcLesson.challenges.length) return;
    const [removed] = srcLesson.challenges.splice(fromIdx, 1);

    const targetChallengesLength = dstLesson.challenges.length;
    const insertIdx = Math.max(0, Math.min(toIdx, targetChallengesLength));
    dstLesson.challenges.splice(insertIdx, 0, removed);

    setModules(updated);
    soundManager.play('click');
  };

  // ----------------- ACCESS ARROWS (Touch Friendly / Accessibility) -----------------
  const handleMoveUnitDir = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    moveUnit(index, targetIdx);
  };

  const handleMoveLessonDir = (unitId: string, index: number, direction: 'up' | 'down') => {
    const unit = modules.find(u => u.id === unitId);
    if (!unit) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    moveLesson(unitId, index, unitId, targetIdx);
  };

  const handleMoveScreenDir = (unitId: string, lessonId: string, index: number, direction: 'up' | 'down') => {
    const unit = modules.find(u => u.id === unitId);
    const lesson = unit?.lessons.find(l => l.id === lessonId);
    if (!lesson) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    moveScreen(unitId, lessonId, index, unitId, lessonId, targetIdx);
  };

  // ----------------- drag & drop event listeners -----------------
  const handleDragStart = (e: React.DragEvent, item: typeof draggedItem) => {
    setDraggedItem(item);
    // Transmit transparent drag image / effect
    e.dataTransfer.effectAllowed = 'move';
    // Style dragging item
    const target = e.target as HTMLElement;
    target.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = '';
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnter = (e: React.DragEvent, item: typeof dragOverItem) => {
    e.preventDefault();
    if (draggedItem && draggedItem.type === item?.type) {
      setDragOverItem(item);
    }
  };

  const handleDrop = (
    e: React.DragEvent, 
    targetType: 'unit' | 'lesson' | 'screen', 
    targetUnitId: string, 
    targetLessonId?: string, 
    targetScreenId?: string, 
    targetIndex?: number
  ) => {
    e.preventDefault();
    if (!draggedItem) return;

    const { type: draggedType, unitId: srcUnitId, lessonId: srcLessonId, index: srcIdx } = draggedItem;

    if (draggedType === 'unit' && targetType === 'unit') {
      if (srcIdx !== undefined && targetIndex !== undefined) {
        moveUnit(srcIdx, targetIndex);
      }
    } 
    else if (draggedType === 'lesson') {
      const toIndex = targetIndex !== undefined ? targetIndex : 0;
      moveLesson(srcUnitId, srcIdx, targetUnitId, toIndex);
    } 
    else if (draggedType === 'screen' && srcLessonId) {
      if (targetType === 'screen' && targetLessonId && targetIndex !== undefined) {
        moveScreen(srcUnitId, srcLessonId, srcIdx, targetUnitId, targetLessonId, targetIndex);
      } else if (targetType === 'lesson' && targetLessonId) {
        // Drop on a lesson header to push to end of its challenge sequence
        const targetUnit = modules.find(u => u.id === targetUnitId);
        const targetLesson = targetUnit?.lessons.find(l => l.id === targetLessonId);
        const toIdx = targetLesson ? targetLesson.challenges.length : 0;
        moveScreen(srcUnitId, srcLessonId, srcIdx, targetUnitId, targetLessonId, toIdx);
      }
    }

    setDraggedItem(null);
    setDragOverItem(null);
  };

  // Commit changes live to storage state
  const handleSaveOrganizerChanges = () => {
    soundManager.play('complete');
    console.log("Saving organizer changes. Current modules state:", JSON.stringify(modules.map(m => ({
        id: m.id, 
        lessons: m.lessons.map(l => l.id)
    })), null, 2));
    
    let originalAi: Module[] = AI_CURRICULUM.length > 0 ? AI_CURRICULUM : [];
    let originalPrac: Module[] = PRACTICE_CURRICULUM.length > 0 ? PRACTICE_CURRICULUM : [];
    
    if (originalAi.length === 0 || originalPrac.length === 0) {
      try {
        if (originalAi.length === 0) originalAi = JSON.parse(localStorage.getItem('CHIKOO_AI_CURRICULUM') || '[]');
        if (originalPrac.length === 0) originalPrac = JSON.parse(localStorage.getItem('CHIKOO_PRACTICE_CURRICULUM') || '[]');
      } catch(e) {
        console.error(e);
      }
    }

    if (curriculumTrack === 'ai') {
      saveCurriculumToStorage(modules, originalPrac);
    } else {
      saveCurriculumToStorage(originalAi, modules);
    }

    setSaveStatus("Changes successfully deployed to curriculum map!");
    setTimeout(() => {
      setSaveStatus(null);
    }, 3500);

    // Fire app layout synchronizer event
    window.dispatchEvent(new Event('curriculumChanged'));
  };

  return (
    <div className="w-full space-y-4 pt-1 pb-16">
      
      {/* Tab Switcher */}
      <div className="flex bg-slate-150 p-1.5 rounded-2xl border border-slate-200/70 gap-1 mt-1">
        <button
          onClick={() => { setActiveStudioTab('create'); soundManager.play('click'); }}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeStudioTab === 'create'
              ? 'bg-white text-indigo-950 shadow-sm border border-slate-150'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Sparkles size={13} className={activeStudioTab === 'create' ? "text-indigo-600 fill-indigo-200" : "text-slate-500"} />
          <span>AI Co-Creator</span>
        </button>
        <button
          onClick={() => { setActiveStudioTab('organize'); soundManager.play('click'); }}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeStudioTab === 'organize'
              ? 'bg-white text-indigo-950 shadow-sm border border-slate-150'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Layers size={13} className={activeStudioTab === 'organize' ? "text-indigo-650" : "text-slate-500"} />
          <span>Organize Board</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeStudioTab === 'create' ? (
          <motion.div
            key="tab-create"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            {/* Banner */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4.5 rounded-3xl border border-indigo-100 flex gap-3.5 items-center shadow-3xs">
              <div className="w-11 h-11 bg-indigo-500 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-xs">
                <Sparkles className="animate-spin text-yellow-300 fill-yellow-300" size={20} style={{ animationDuration: '4s' }} />
              </div>
              <div>
                <h3 className="text-xs font-black text-indigo-900 uppercase tracking-tight">AI Chapter Studio</h3>
                <p className="text-[10px] font-bold text-indigo-800 leading-snug">
                  Create fun, interactive lessons instantly! AI designs custom learning roads and lesson outlines.
                </p>
              </div>
            </div>

            {isLoading ? (
              /* Animated loading screen */
              <motion.div
                key="generator-loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-6 rounded-[2rem] border-2 border-indigo-100 shadow-sm flex flex-col items-center justify-center text-center py-12 space-y-5"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                  <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 animate-pulse" size={24} />
                </div>

                <div className="space-y-1.5 max-w-[270px]">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Creating Chapter Lessons</h4>
                  <p className="text-xs font-semibold text-indigo-700 animate-pulse duration-1000">
                    {LOADING_STEPS[loadingStepIdx]}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold max-w-[220px] mx-auto">
                    No on-demand delay when learning! Custom components & prompt layers are pre-cached.
                  </p>
                </div>
              </motion.div>
            ) : generatedLesson ? (
              /* Success Output Screen */
              <motion.div
                key="generator-success"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-5 rounded-[2rem] border-2 border-emerald-200 shadow-sm space-y-4"
              >
                <div className="flex gap-1.5 items-center bg-emerald-50 text-[#006b1b] text-[10px] font-black uppercase px-3 py-1.5 rounded-full w-fit">
                  <CheckCircle size={12} className="fill-current text-white" />
                  <span>Chapter Created Successfully</span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-slate-800 leading-tight">
                    {generatedLesson.title}
                  </h3>
                  <p className="text-xs text-gray-500 font-semibold leading-snug">
                    {generatedLesson.description}
                  </p>
                </div>

                {/* Illustration Card */}
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-gray-100 shadow-xs bg-slate-150 flex items-center justify-center">
                  <img 
                    src={generatedLesson.imageMetadata?.illustrationUrl} 
                    alt={generatedLesson.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-[#0a2312]/80 backdrop-blur-md text-emerald-300 text-[9px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-500/20 shadow-md">
                    <ImageIcon size={10} />
                    Style: {generatedLesson.imageMetadata?.imageStyle || "Illustration"}
                  </div>
                </div>

                {/* Micro details of pre-gen prompts */}
                <div className="bg-slate-50 p-3 rounded-2xl space-y-1.5 text-[10px] border border-slate-100">
                  <span className="font-extrabold uppercase text-slate-500 block">📦 Preloaded Prompt Registry</span>
                  <div className="space-y-1 font-bold text-slate-600">
                    <div>🎨 <span className="text-indigo-600 font-extrabold">Illustration:</span> {generatedLesson.imageMetadata?.prompts?.illustration?.slice(0, 75)}...</div>
                    <div>🔍 <span className="text-indigo-600 font-extrabold">Schematic Diagram:</span> {generatedLesson.imageMetadata?.prompts?.educational?.slice(0, 75)}...</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      soundManager.play('click');
                      setGeneratedLesson(null);
                      setTopic('');
                    }}
                    className="btn-3d btn-3d-secondary py-2.5 px-4 text-xs font-bold shrink-0 flex items-center justify-center"
                  >
                    Create Another
                  </button>

                  <button
                    onClick={() => {
                      soundManager.play('click');
                      onStudyLesson({
                        id: generatedLesson.id,
                        title: generatedLesson.title,
                        description: generatedLesson.description
                      });
                    }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-750 active:scale-95 text-white font-black text-xs py-3 px-5 rounded-2xl flex items-center justify-center gap-1.5 transition-all scroll-smooth border-b-4 border-indigo-800"
                  >
                    <BookOpen size={13} />
                    Study Concept
                    <ArrowRight size={13} />
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Draft Input Form */
              <motion.div
                key="generator-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white p-5 rounded-[2rem] border-2 border-indigo-100 shadow-sm space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Concept Subject or Topic</label>
                  <div className="flex gap-2 relative">
                    <input
                      type="text"
                      placeholder="e.g. Sarcasm detection in chatbot algorithms..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 hover:border-slate-300 focus:border-indigo-500 outline-none rounded-2xl p-3 px-3.5 pr-10 text-xs font-bold text-slate-800 transition-colors"
                    />
                    <button
                      onClick={() => handleForgeLesson(topic)}
                      disabled={!topic.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 flex items-center justify-center text-white transition-opacity cursor-pointer"
                    >
                      <Send size={11} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-[10px] font-bold rounded-xl flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0 text-red-600" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Preset Suggestions */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block font-sans">Relatable Study Ideas</span>
                  <div className="flex flex-col gap-1.5">
                    {PRESET_TOPICS.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => {
                          setTopic(preset.substring(preset.indexOf(' ') + 1));
                          soundManager.play('click');
                        }}
                        className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-indigo-150 hover:bg-indigo-50/25 text-[10.5px] font-extrabold text-indigo-950 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <span className="text-xs shrink-0">{preset.split(' ')[0]}</span>
                        <span className="truncate">{preset.substring(preset.indexOf(' ') + 1)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* ==========================================
             TAB 2: HIERARCHICAL DRAG & DROP ORGANIZER
             ========================================== */
          <motion.div
            key="tab-organize"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Guide strip */}
            <div className="bg-amber-50/75 border border-amber-200/50 p-3 rounded-2xl flex items-start gap-2.5 shadow-3xs text-[10px] font-semibold text-amber-900 leading-normal">
              <Info size={14} className="text-amber-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-extrabold">Active Mapping Tree:</span> Click the tracks below to toggle lists. Grab the <span className="font-mono text-indigo-650 bg-white/80 border px-0.5 rounded text-[9px]">Grip Lines</span> or use arrows up/down next to items to quickly reposition.
              </div>
            </div>

            {/* Track Toggle Selector */}
            <div className="flex bg-slate-50 border border-slate-150 p-1 rounded-xl items-center shadow-3xs">
              <button
                onClick={() => { setCurriculumTrack('ai'); soundManager.play('click'); }}
                className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  curriculumTrack === 'ai'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <span>🤖 Space Academy Course</span>
              </button>
              <button
                onClick={() => { setCurriculumTrack('practice'); soundManager.play('click'); }}
                className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  curriculumTrack === 'practice'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <span>⚡ Practical Daily Quests</span>
              </button>
            </div>

            {/* Control Strip & Active Save Button */}
            <div className="flex items-center justify-between gap-2 shrink-0 flex-wrap">
              <div className="flex gap-1">
                <button
                  onClick={() => handleToggleAll(true)}
                  className="px-2.5 py-1 text-[9px] font-extrabold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg shadow-3xs cursor-pointer active:scale-95 transition-all hover:text-slate-900"
                >
                  Expand All
                </button>
                <button
                  onClick={() => handleToggleAll(false)}
                  className="px-2.5 py-1 text-[9px] font-extrabold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg shadow-3xs cursor-pointer active:scale-95 transition-all hover:text-slate-900"
                >
                  Collapse All
                </button>
                <button
                  onClick={() => { loadTrackerModules(); soundManager.play('click'); }}
                  className="px-2.5 py-1 text-[9px] font-extrabold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg shadow-3xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                  title="Reload default state"
                >
                  <RotateCcw size={10} />
                  Reset Layout
                </button>
              </div>

              <button
                onClick={handleSaveOrganizerChanges}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-750 active:scale-95 text-white text-[9.5px] font-black rounded-xl shadow-2xs cursor-pointer flex items-center gap-1 transition-all border-b-2 border-indigo-800"
              >
                <Save size={11} />
                Deploy Board
              </button>
            </div>

            {/* Success toast indicator */}
            {saveStatus && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold rounded-xl flex items-center gap-2 shadow-xs"
              >
                <CheckCircle size={14} className="text-emerald-600" />
                <span>{saveStatus}</span>
              </motion.div>
            )}

            {/* Hierarchical Map Tree Wrapper */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {modules.length === 0 ? (
                <div className="text-center bg-slate-50 border border-slate-150 p-8 rounded-2xl text-[11px] font-bold text-slate-400">
                  No modules detected on this track. Try Co-Creator to build!
                </div>
              ) : (
                modules.map((unit, unitIdx) => {
                  const isUnitOpen = expandedUnits[unit.id] ?? true;
                  const isDraggedUnitMatches = draggedItem?.unitId === unit.id && draggedItem?.type === 'unit';
                  const isOverUnitMatches = dragOverItem?.unitId === unit.id && dragOverItem?.type === 'unit';
                  const isUnitTargetedForLesson = dragOverItem?.unitId === unit.id && dragOverItem?.type === 'unit' && draggedItem?.type === 'lesson';

                  return (
                    <div 
                      key={unit.id}
                      className={`rounded-2xl transition-all border ${
                        isDraggedUnitMatches 
                          ? 'opacity-40 border-dashed border-slate-350 scale-95' 
                          : isOverUnitMatches 
                          ? 'border-2 border-dashed border-indigo-400 bg-indigo-50/20 shadow-xs scale-[1.01]'
                          : isUnitTargetedForLesson
                          ? 'border-2 border-dashed border-emerald-400 bg-emerald-50/10'
                          : 'border-slate-200/80 bg-white shadow-3xs hover:shadow-2xs'
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, { type: 'unit', unitId: unit.id, index: unitIdx })}
                      onDragEnd={handleDragEnd}
                      onDragEnter={(e) => handleDragEnter(e, { type: 'unit', unitId: unit.id, index: unitIdx })}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, 'unit', unit.id, undefined, undefined, unitIdx)}
                    >
                      {/* UNIT HEADER ROW */}
                      <div className="p-3.5 flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="p-1 text-slate-400 hover:text-slate-650 cursor-grab active:cursor-grabbing">
                            <GripVertical size={13} strokeWidth={2.5} />
                          </div>
                          
                          <button 
                            onClick={() => handleToggleExpandUnit(unit.id)}
                            className="bg-indigo-120/50 p-1 rounded-md text-indigo-650 hover:bg-indigo-100/80 cursor-pointer"
                          >
                            {isUnitOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[8px] font-mono font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-150 px-1 py-0.5 rounded-sm shrink-0">
                                Unit
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono font-bold truncate">
                                {unit.id}
                              </span>
                            </div>
                            <h4 className="text-xs font-black text-slate-900 leading-tight truncate mt-0.5">
                              {unit.title}
                            </h4>
                          </div>
                        </div>

                        {/* Arrows & Stats */}
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[9px] text-slate-450 bg-slate-150 px-2 py-0.5 rounded-lg font-extrabold max-sm:hidden">
                            {unit.lessons.length} Lessons
                          </span>
                          <div className="flex border border-slate-200/60 rounded-md bg-white overflow-hidden shadow-3xs shrink-0">
                            <button
                              disabled={unitIdx === 0}
                              onClick={() => handleMoveUnitDir(unitIdx, 'up')}
                              className="p-1 hover:bg-slate-50 disabled:opacity-30 text-slate-500 cursor-pointer"
                              title="Move Unit Up"
                            >
                              <ArrowUp size={11} strokeWidth={3} />
                            </button>
                            <div className="w-[1px] bg-slate-200/60" />
                            <button
                              disabled={unitIdx === modules.length - 1}
                              onClick={() => handleMoveUnitDir(unitIdx, 'down')}
                              className="p-1 hover:bg-slate-50 disabled:opacity-30 text-slate-500 cursor-pointer"
                              title="Move Unit Down"
                            >
                              <ArrowDown size={11} strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* LESSONS CONTAINER WITHIN UNIT */}
                      {isUnitOpen && (
                        <div className="p-2 space-y-2 bg-slate-50/15 rounded-b-2xl min-h-[40px] border-t border-slate-50"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            // If user drops generic lesson into an empty space of Unit card, drop to index 0
                            if (draggedItem?.type === 'lesson') {
                              handleDrop(e, 'lesson', unit.id, undefined, undefined, 0);
                            }
                          }}
                        >
                          {unit.lessons.length === 0 ? (
                            <div className="text-center py-4 text-[9.5px] font-bold text-slate-400">
                              No lessons in this unit. Drag a lesson here!
                            </div>
                          ) : (
                            unit.lessons.map((lesson, lessonIdx) => {
                              const isLessonOpen = expandedLessons[lesson.id] ?? false;
                              const isDraggedLessonMatches = draggedItem?.lessonId === lesson.id && draggedItem?.type === 'lesson';
                              const isOverLessonMatches = dragOverItem?.lessonId === lesson.id && dragOverItem?.type === 'lesson';
                              const isLessonTargetedForScreen = dragOverItem?.lessonId === lesson.id && dragOverItem?.type === 'lesson' && draggedItem?.type === 'screen';

                              return (
                                <div
                                  key={lesson.id}
                                  className={`rounded-xl transition-all border ml-3.5 ${
                                    isDraggedLessonMatches 
                                      ? 'opacity-40 border-dashed border-slate-300 scale-95' 
                                      : isOverLessonMatches 
                                      ? 'border-2 border-dashed border-emerald-450 bg-emerald-50/10 shadow-3xs scale-[1.01]'
                                      : isLessonTargetedForScreen
                                      ? 'border-2 border-dashed border-purple-400 bg-purple-50/10 rgb-purple-50'
                                      : 'border-slate-150 bg-white'
                                  }`}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, { type: 'lesson', unitId: unit.id, lessonId: lesson.id, index: lessonIdx })}
                                  onDragEnd={handleDragEnd}
                                  onDragEnter={(e) => handleDragEnter(e, { type: 'lesson', unitId: unit.id, lessonId: lesson.id, index: lessonIdx })}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => handleDrop(e, 'lesson', unit.id, lesson.id, undefined, lessonIdx)}
                                >
                                  {/* LESSON HEADER ROW */}
                                  <div className="p-2.5 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                      {/* Lesson Drag handle */}
                                      <div className="p-0.5 text-slate-350 hover:text-slate-550 cursor-grab active:cursor-grabbing">
                                        <GripVertical size={11} strokeWidth={2.5} />
                                      </div>

                                      <button 
                                        onClick={() => handleToggleExpandLesson(lesson.id)}
                                        className="p-0.5 rounded hover:bg-slate-100 text-slate-500 cursor-pointer shrink-0"
                                      >
                                        {isLessonOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                                      </button>

                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1 truncate font-sans">
                                          <span className="text-[7.5px] font-black text-rose-500 bg-rose-50 border border-rose-100 px-0.5 rounded">
                                            Lesson
                                          </span>
                                          <span className="text-[8px] text-slate-400 font-mono font-bold truncate">
                                            ID: {lesson.id}
                                          </span>
                                        </div>
                                        <h5 className="text-[11px] font-black text-slate-800 truncate leading-snug mt-0.5">
                                          {lesson.title}
                                        </h5>
                                      </div>
                                    </div>

                                    {/* Action row */}
                                    <div className="flex items-center gap-1 shrink-0">
                                      <span className="text-[8px] text-amber-600 bg-amber-50 border border-amber-100 px-1 py-0.5 rounded font-extrabold max-sm:hidden">
                                        ⭐ {lesson.challenges?.length || 0} screens
                                      </span>
                                      
                                      <div className="flex border border-slate-150 rounded-md bg-white overflow-hidden shrink-0">
                                        <button
                                          disabled={lessonIdx === 0}
                                          onClick={() => handleMoveLessonDir(unit.id, lessonIdx, 'up')}
                                          className="p-1 hover:bg-slate-50 disabled:opacity-30 text-slate-550 cursor-pointer"
                                        >
                                          <ArrowUp size={9} strokeWidth={3} />
                                        </button>
                                        <div className="w-[1px] bg-slate-150" />
                                        <button
                                          disabled={lessonIdx === unit.lessons.length - 1}
                                          onClick={() => handleMoveLessonDir(unit.id, lessonIdx, 'down')}
                                          className="p-1 hover:bg-slate-50 disabled:opacity-30 text-slate-550 cursor-pointer"
                                        >
                                          <ArrowDown size={9} strokeWidth={3} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* SCREENS LIST (CHALLENGES) */}
                                  {isLessonOpen && (
                                    <div className="p-1.5 pb-2.5 space-y-1.5 border-t border-slate-100 bg-slate-50/50 rounded-b-xl min-h-[30px]"
                                      onDragOver={(e) => e.preventDefault()}
                                      onDrop={(e) => {
                                        if (draggedItem?.type === 'screen') {
                                          handleDrop(e, 'screen', unit.id, lesson.id, undefined, 0);
                                        }
                                      }}
                                    >
                                      {(!lesson.challenges || lesson.challenges.length === 0) ? (
                                        <div className="text-center py-2.5 text-[8.5px] font-bold text-slate-400">
                                          No screens found. Drag a challenge screen here.
                                        </div>
                                      ) : (
                                        lesson.challenges.map((screen, screenIdx) => {
                                          const isDraggedScreenMatches = draggedItem?.screenId === screen.id && draggedItem?.type === 'screen';
                                          const isOverScreenMatches = dragOverItem?.screenId === screen.id && dragOverItem?.type === 'screen';
                                          const narrations = screen.audioNarrations || {};
                                          const enReady = !!narrations.english?.url;
                                          const hiReady = !!narrations.hinglish?.url;
                                          const mrReady = !!narrations.marathi?.url;
                                          const isGenerating = generatingVoiceScreenId === screen.id;

                                          return (
                                            <div
                                              key={screen.id}
                                              className={`p-2.5 rounded-lg border ml-5 flex flex-col gap-2 transition-all text-[10px] ${
                                                isDraggedScreenMatches
                                                  ? 'opacity-40 border-dashed border-indigo-200 scale-95'
                                                  : isOverScreenMatches
                                                  ? 'border-2 border-dashed border-indigo-400 bg-indigo-50/30'
                                                  : 'border-slate-100 bg-white/95 text-slate-700 shadow-3xs'
                                              }`}
                                              draggable
                                              onDragStart={(e) => handleDragStart(e, { type: 'screen', unitId: unit.id, lessonId: lesson.id, screenId: screen.id, index: screenIdx })}
                                              onDragEnd={handleDragEnd}
                                              onDragEnter={(e) => handleDragEnter(e, { type: 'screen', unitId: unit.id, lessonId: lesson.id, screenId: screen.id, index: screenIdx })}
                                              onDragOver={(e) => e.preventDefault()}
                                              onDrop={(e) => handleDrop(e, 'screen', unit.id, lesson.id, screen.id, screenIdx)}
                                            >
                                              <div className="flex items-center justify-between gap-1.5">
                                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                  {/* Screen Grab handle */}
                                                  <div className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing">
                                                    <GripVertical size={9} strokeWidth={2.5} />
                                                  </div>

                                                  <span className="text-[7px] font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100 px-0.5 rounded leading-none">
                                                    {screen.type ? screen.type.replace(/_/g, " ") : "content"}
                                                  </span>

                                                  <div className="truncate text-[9.5px] font-semibold text-slate-750 font-sans">
                                                    {screen.question ? screen.question : `ID: ${screen.id || "Untitled Screen"}`}
                                                  </div>
                                                </div>

                                                {/* Navigation button and index label */}
                                                <div className="flex items-center gap-1 shrink-0">
                                                  <span className="text-[8px] font-mono text-slate-400 mr-1 shrink-0 font-bold">
                                                    sc {screenIdx + 1}
                                                  </span>
                                                  <div className="flex bg-slate-50 border border-slate-150/80 rounded-sm shrink-0">
                                                    <button
                                                      disabled={screenIdx === 0}
                                                      onClick={() => handleMoveScreenDir(unit.id, lesson.id, screenIdx, 'up')}
                                                      className="p-0.5 hover:bg-slate-100 disabled:opacity-20 text-slate-500 cursor-pointer"
                                                    >
                                                      <ArrowUp size={8} strokeWidth={3} />
                                                    </button>
                                                    <div className="w-[1px] bg-slate-150" />
                                                    <button
                                                      disabled={screenIdx === lesson.challenges.length - 1}
                                                      onClick={() => handleMoveScreenDir(unit.id, lesson.id, screenIdx, 'down')}
                                                      className="p-0.5 hover:bg-slate-100 disabled:opacity-20 text-slate-500 cursor-pointer"
                                                    >
                                                      <ArrowDown size={8} strokeWidth={3} />
                                                    </button>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* AI Voice Narration Admin Controls */}
                                              <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100 flex-wrap">
                                                <button
                                                  type="button"
                                                  onClick={() => setSelectedVoiceScreenId(prev => prev === screen.id ? null : screen.id)}
                                                  className="text-[7.5px] font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-1 py-0.5 rounded uppercase flex items-center gap-0.5 cursor-pointer"
                                                  title="Open Screen Voice Inspector"
                                                >
                                                  🔊 {selectedVoiceScreenId === screen.id ? 'Close Voice' : 'Voice'}
                                                </button>
                                                <span className={`text-[7.5px] font-black px-1 rounded ${enReady ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                  English: {enReady ? 'Ready' : 'Missing'}
                                                </span>
                                                <span className={`text-[7.5px] font-black px-1 rounded ${hiReady ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                  Hinglish: {hiReady ? 'Ready' : 'Missing'}
                                                </span>
                                                <span className={`text-[7.5px] font-black px-1 rounded ${mrReady ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                  Marathi: {mrReady ? 'Ready' : 'Missing'}
                                                </span>

                                                <div className="ml-auto flex items-center gap-1">
                                                  {enReady && (
                                                    <button 
                                                      onClick={() => handlePreviewAudio(narrations.english.url)}
                                                      className="px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[8px] font-black rounded cursor-pointer"
                                                      title="Preview English Audio"
                                                    >
                                                      ▶ En
                                                    </button>
                                                  )}
                                                  {hiReady && (
                                                    <button 
                                                      onClick={() => handlePreviewAudio(narrations.hinglish.url)}
                                                      className="px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[8px] font-black rounded cursor-pointer"
                                                      title="Preview Hinglish Audio"
                                                    >
                                                      ▶ Hi
                                                    </button>
                                                  )}
                                                  {mrReady && (
                                                    <button 
                                                      onClick={() => handlePreviewAudio(narrations.marathi.url)}
                                                      className="px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[8px] font-black rounded cursor-pointer"
                                                      title="Preview Marathi Audio"
                                                    >
                                                      ▶ Mr
                                                    </button>
                                                  )}

                                                  <button
                                                    disabled={isGenerating}
                                                    onClick={() => handleGenerateVoice(unit.id, lesson.id, screen, lesson.title)}
                                                    className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-[8px] font-black rounded shadow-2xs cursor-pointer flex items-center gap-0.5"
                                                  >
                                                    {isGenerating ? 'Generating...' : (enReady || hiReady || mrReady ? 'Regenerate' : 'Generate Voice')}
                                                  </button>
                                                </div>
                                              </div>

                                              {selectedVoiceScreenId === screen.id && (
                                                <div className="pt-2">
                                                  <ScreenVoiceSection
                                                    selectedScreen={screen}
                                                    lessonId={lesson.id}
                                                    lessonTitle={lesson.title}
                                                    onNarrationsUpdated={(newNarrations) => {
                                                      screen.audioNarrations = newNarrations;
                                                      handleSaveOrganizerChanges();
                                                    }}
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
