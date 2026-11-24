import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, 
  Play, 
  Pause, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  FileText, 
  Sparkles,
  Wand2,
  CheckSquare,
  Square,
  Search,
  Filter,
  Layers,
  BookOpen,
  ChevronRight,
  HelpCircle,
  ShieldAlert,
  Info,
  Clock,
  X,
  RotateCcw,
  Globe,
  Check,
  StopCircle,
  Save,
  Languages,
  Zap,
  Mic,
  Edit3,
  Headphones
} from 'lucide-react';
import { soundManager } from '../../lib/sounds';
import { supabase, isSupabaseConfigured, getWorlds, getCustomModules, getCustomLessons, World, getAdminAuthHeaders } from '../../lib/supabase';
import { AI_CURRICULUM, Module, Lesson, Challenge } from '../../lib/content';

export type ContentStatus = 'Ready' | 'Missing' | 'Failed' | 'Generating';

export interface WrongAnswerExplanationItem {
  id: string; // screen / challenge id
  lessonId: string;
  lessonTitle: string;
  unitId: string;
  unitTitle: string;
  worldId?: string;
  worldTitle?: string;
  questionText: string;
  correctAnswer: string;
  options: string[];
  
  // Multi-language text (English, Hinglish, Marathi)
  textEn: string;
  textHi: string;
  textMr?: string;
  statusTextEn: ContentStatus;
  statusTextHi: ContentStatus;
  statusTextMr?: ContentStatus;
  
  // Multi-language audio (English, Hinglish, Marathi)
  audioUrlEn?: string;
  audioUrlHi?: string;
  audioUrlMr?: string;
  statusAudioEn: ContentStatus;
  statusAudioHi: ContentStatus;
  statusAudioMr?: ContentStatus;
  
  // Diagnostic metadata
  ttsModel?: string;
  updatedAt?: string;
  errorMessage?: string;
  challengeRef?: Challenge;
}

export interface GenerationJobRecord {
  id: string;
  timestamp: string;
  scopeDescription: string;
  actionType: 'text_only' | 'audio_only' | 'both';
  total: number;
  completed: number;
  failed: number;
  skipped: number;
  failures: Array<{ id: string; title: string; reason: string }>;
}

export interface ExplanationAudioManagerProps {
  className?: string;
}

export const ExplanationAudioManager: React.FC<ExplanationAudioManagerProps> = ({ className = '' }) => {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessonsMap, setLessonsMap] = useState<Record<string, Lesson[]>>({});
  const [loadingContent, setLoadingContent] = useState<boolean>(true);

  // Hierarchy selections: World -> Unit -> Lesson
  const [selectedWorldId, setSelectedWorldId] = useState<string>('all');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('all');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('all');

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<'all' | 'missing_text' | 'missing_audio' | 'ready' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Audio records from Supabase: key = `${lessonId}_${challengeId}_${lang}`
  const [audioRecords, setAudioRecords] = useState<Record<string, any>>({});
  
  // Selection: Set of `${lessonId}_${challengeId}`
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Bulk Generation Job State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeJobPhase, setActiveJobPhase] = useState<'idle' | 'generating_text' | 'synthesizing_audio'>('idle');
  const isCancelledRef = useRef<boolean>(false);
  
  const [jobProgress, setJobProgress] = useState<{
    total: number;
    completed: number;
    failed: number;
    skipped: number;
    currentItemTitle: string;
    actionName: string;
  }>({ total: 0, completed: 0, failed: 0, skipped: 0, currentItemTitle: '', actionName: '' });

  const [jobReport, setJobReport] = useState<{
    actionName: string;
    total: number;
    completed: number;
    failed: number;
    skipped: number;
    failures: Array<{ id: string; title: string; reason: string }>;
  } | null>(null);

  // Job History
  const [jobHistory, setJobHistory] = useState<GenerationJobRecord[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // Audio preview playback
  const [audioPlayingKey, setAudioPlayingKey] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Inspect & Edit Modal
  const [inspectItem, setInspectItem] = useState<WrongAnswerExplanationItem | null>(null);
  const [editEnglishText, setEditEnglishText] = useState<string>('');
  const [editHinglishText, setEditHinglishText] = useState<string>('');
  const [editMarathiText, setEditMarathiText] = useState<string>('');
  const [isSavingText, setIsSavingText] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Mascot Voice Configuration & Live Audition State
  // Puck: Canonical Gemini masculine, youthful, playful cartoon narrator character
  const [selectedVoice, setSelectedVoice] = useState<string>('Puck');
  const [auditionLang, setAuditionLang] = useState<'english' | 'hinglish' | 'marathi'>('english');
  const [auditionCustomText, setAuditionCustomText] = useState<string>('');
  const [isAuditioningVoice, setIsAuditioningVoice] = useState<boolean>(false);
  const [isAuditionPlaying, setIsAuditionPlaying] = useState<boolean>(false);
  const auditionAudioRef = useRef<HTMLAudioElement | null>(null);

  const AUDITION_SAMPLES: Record<'english' | 'hinglish' | 'marathi', string> = useMemo(() => ({
    english: "Oops! Venus is super hot, but Mars is called the Red Planet because iron in its rocks turns rusty red!",
    hinglish: "Arre re! Venus bohot garam hai, par Mars ko Red Planet kehte hain kyunki uski surface par iron rust hokar laal dikhta hai!",
    marathi: "अरेरे! शुक्र खूप उष्ण आहे, पण मंगळाला लाल ग्रह म्हणतात कारण त्याच्या खडकातील लोह गंजून लाल दिसते!"
  }), []);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (auditionAudioRef.current) {
        auditionAudioRef.current.pause();
        auditionAudioRef.current = null;
      }
    };
  }, []);

  const handleAuditionVoice = async () => {
    soundManager.play('click');
    if (isAuditionPlaying && auditionAudioRef.current) {
      auditionAudioRef.current.pause();
      setIsAuditionPlaying(false);
      return;
    }

    const textToSpeak = auditionCustomText.trim() || AUDITION_SAMPLES[auditionLang];
    setIsAuditioningVoice(true);
    try {
      const res = await fetch('/api/gemini/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak,
          language: auditionLang === 'english' ? 'en' : auditionLang === 'marathi' ? 'mr' : 'hi',
          voice: selectedVoice,
          screenId: 'voice_audition'
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Audition request failed (HTTP ${res.status})`);
      }

      const data = await res.json();
      if (!data.audio) throw new Error(data.error || 'No audio returned from speech synthesis');

      if (auditionAudioRef.current) {
        auditionAudioRef.current.pause();
      }

      const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audio}`);
      auditionAudioRef.current = audio;
      setIsAuditionPlaying(true);

      audio.onended = () => setIsAuditionPlaying(false);
      audio.onerror = () => {
        setIsAuditionPlaying(false);
        soundManager.play('incorrect');
      };
      await audio.play();
    } catch (err: any) {
      console.error('Audition error:', err);
      alert(`Voice audition failed: ${err.message}`);
      soundManager.play('incorrect');
    } finally {
      setIsAuditioningVoice(false);
    }
  };

  // Load History from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('chikoo_wrong_answer_explanation_jobs');
      if (stored) {
        setJobHistory(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveJobToHistory = (job: GenerationJobRecord) => {
    try {
      const updated = [job, ...jobHistory].slice(0, 15);
      setJobHistory(updated);
      localStorage.setItem('chikoo_wrong_answer_explanation_jobs', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // 1. Load Data from Supabase / Local Storage
  const loadData = useCallback(async () => {
    setLoadingContent(true);
    try {
      const [fetchedWorlds, fetchedModules, fetchedLessonsList] = await Promise.all([
        getWorlds().catch(() => []),
        getCustomModules().catch(() => []),
        getCustomLessons().catch(() => [])
      ]);

      setWorlds(fetchedWorlds || []);
      
      const activeModules = fetchedModules && fetchedModules.length > 0 ? fetchedModules : AI_CURRICULUM;
      setModules(activeModules);

      const map: Record<string, Lesson[]> = {};
      for (const mod of activeModules) {
        const modLessons = fetchedLessonsList.filter((l: any) => l.module_id === mod.id);
        map[mod.id] = modLessons.length > 0 ? modLessons : (mod.lessons || []);
      }
      setLessonsMap(map);

      // Load audio records from server endpoint (with full database credentials)
      const recs: Record<string, any> = {};

      const populateRecords = (rows: any[]) => {
        for (const row of rows) {
          const item = {
            url: row.audio_url,
            status: row.status,
            ttsModel: row.tts_model,
            narrationText: row.narration_text,
            updatedAt: row.updated_at,
            errorMessage: row.error_message
          };
          const rawLang = (row.language || '').toLowerCase().trim();
          recs[`${row.lesson_id}_${row.screen_id}_${rawLang}`] = item;
          recs[`${row.screen_id}_${rawLang}`] = item;
          if (rawLang === 'en' || rawLang === 'english') {
            recs[`${row.lesson_id}_${row.screen_id}_en`] = item;
            recs[`${row.lesson_id}_${row.screen_id}_english`] = item;
            recs[`${row.screen_id}_en`] = item;
            recs[`${row.screen_id}_english`] = item;
          } else if (rawLang === 'hinglish' || rawLang === 'hi') {
            recs[`${row.lesson_id}_${row.screen_id}_hinglish`] = item;
            recs[`${row.lesson_id}_${row.screen_id}_hi`] = item;
            recs[`${row.screen_id}_hinglish`] = item;
            recs[`${row.screen_id}_hi`] = item;
          } else if (rawLang === 'mr' || rawLang === 'marathi') {
            recs[`${row.lesson_id}_${row.screen_id}_mr`] = item;
            recs[`${row.lesson_id}_${row.screen_id}_marathi`] = item;
            recs[`${row.screen_id}_mr`] = item;
            recs[`${row.screen_id}_marathi`] = item;
          }
        }
      };

      try {
        const headers = await getAdminAuthHeaders();
        const audioRes = await fetch('/api/admin/all-screen-audio', { headers });
        if (audioRes.ok) {
          const audioJson = await audioRes.json();
          if (audioJson.success && Array.isArray(audioJson.records)) {
            populateRecords(audioJson.records);
          }
        }
      } catch (apiErr) {
        console.warn('Could not fetch from /api/admin/all-screen-audio, checking Supabase fallback:', apiErr);
      }

      // Also query direct Supabase if configured as fallback
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: audioRows, error } = await supabase
            .from('lesson_screen_audio')
            .select('*');

          if (!error && Array.isArray(audioRows)) {
            populateRecords(audioRows);
          }
        } catch {}
      }

      setAudioRecords(recs);
    } catch (err) {
      console.warn('Error loading explanation audio data:', err);
    } finally {
      setLoadingContent(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // World title map
  const worldTitleMap = useMemo(() => {
    const map: Record<string, string> = {
      'world_1': 'World 1: AI Foundations',
      'world_2': 'World 2: Machine Learning',
      'world_3': 'World 3: Generative AI'
    };
    for (const w of worlds) {
      map[w.id] = w.title || `World ${w.world_number}`;
    }
    return map;
  }, [worlds]);

  // 2. Flatten eligible questions into structured explanation items
  // Strict rule: ONLY interaction questions that have wrong-answer feedback are included.
  const allExplanationItems = useMemo(() => {
    const list: WrongAnswerExplanationItem[] = [];

    for (const mod of modules) {
      const worldId = mod.world_id || 'world_1';
      if (selectedWorldId !== 'all' && worldId !== selectedWorldId) continue;
      if (selectedUnitId !== 'all' && mod.id !== selectedUnitId) continue;

      const lessons = lessonsMap[mod.id] || mod.lessons || [];
      for (const lesson of lessons) {
        if (selectedLessonId !== 'all' && lesson.id !== selectedLessonId) continue;

        const challenges = lesson.challenges || [];
        for (const ch of challenges) {
          // EXCLUSION: Skip pure reading, story screens, hero banners, and reward celebrations
          const ineligibleTypes = [
            'story', 'concept', 'reward', 'content_screen', 'visual_lesson_screen', 
            'image_explainer', 'gif_explainer', 'comic_story', 'meme_screen', 'fun_fact',
            'story_scene', 'hero_scene', 'dialogue_strip_scene', 'celebration_scene'
          ];
          if (ineligibleTypes.includes(ch.type) && !ch.question && !ch.explanation) {
            continue;
          }

          // Must be an interaction question with a question and answer evaluation
          const questionText = ch.question || (ch as any).prompt || '';
          if (!questionText.trim()) continue;

          // Format answer options for context
          const rawOptions = ch.options || [];
          const optionsList: string[] = Array.isArray(rawOptions)
            ? rawOptions.map(o => typeof o === 'string' ? o : (o.text || o.label || ''))
            : [];
          const correctAnswer = String(ch.correctAnswer || '').trim();

          // Resolve English Explanation Text
          const rawExp = ch.explanation;
          let textEn = '';
          if (typeof rawExp === 'string' && rawExp.trim()) {
            textEn = rawExp.trim();
          } else if (rawExp && typeof rawExp === 'object') {
            textEn = rawExp.english?.text || rawExp.text || '';
          }
          if (!textEn) {
            textEn = audioRecords[`${lesson.id}_${ch.id}_en`]?.narrationText || 
                     audioRecords[`${lesson.id}_${ch.id}_english`]?.narrationText || 
                     audioRecords[`${ch.id}_en`]?.narrationText || 
                     audioRecords[`${ch.id}_english`]?.narrationText || '';
          }

          // Resolve Hinglish Explanation Text
          let textHi = '';
          if (rawExp && typeof rawExp === 'object') {
            textHi = rawExp.hinglish?.text || '';
          }
          if (!textHi) {
            textHi = (ch as any).explanation_speech_script || 
                     (ch as any).explanation_concept || 
                     audioRecords[`${lesson.id}_${ch.id}_hinglish`]?.narrationText || 
                     audioRecords[`${lesson.id}_${ch.id}_hi`]?.narrationText || 
                     audioRecords[`${ch.id}_hinglish`]?.narrationText || 
                     audioRecords[`${ch.id}_hi`]?.narrationText || '';
          }

          // Resolve Marathi Explanation Text
          let textMr = '';
          if (rawExp && typeof rawExp === 'object') {
            textMr = rawExp.marathi?.text || '';
          }
          if (!textMr) {
            textMr = (ch as any).explanation_marathi || 
                     (ch as any).explanation_marathi_speech_script || 
                     audioRecords[`${lesson.id}_${ch.id}_marathi`]?.narrationText || 
                     audioRecords[`${lesson.id}_${ch.id}_mr`]?.narrationText || 
                     audioRecords[`${ch.id}_marathi`]?.narrationText || 
                     audioRecords[`${ch.id}_mr`]?.narrationText || '';
          }

          // Resolve Audio URLs
          const audioRecEn = audioRecords[`${lesson.id}_${ch.id}_en`] || 
                             audioRecords[`${lesson.id}_${ch.id}_english`] || 
                             audioRecords[`${ch.id}_en`] || 
                             audioRecords[`${ch.id}_english`];

          const audioRecHi = audioRecords[`${lesson.id}_${ch.id}_hinglish`] || 
                             audioRecords[`${lesson.id}_${ch.id}_hi`] || 
                             audioRecords[`${ch.id}_hinglish`] || 
                             audioRecords[`${ch.id}_hi`];

          const audioRecMr = audioRecords[`${lesson.id}_${ch.id}_marathi`] || 
                             audioRecords[`${lesson.id}_${ch.id}_mr`] || 
                             audioRecords[`${ch.id}_marathi`] || 
                             audioRecords[`${ch.id}_mr`];

          const audioUrlEn = audioRecEn?.url || 
            (typeof rawExp === 'object' && rawExp?.english?.audioUrl) || 
            (typeof rawExp === 'object' && rawExp?.audioUrl) || 
            (ch as any).audioNarrations?.english?.url || 
            (ch as any).audioNarrations?.en?.url || 
            '';

          const audioUrlHi = audioRecHi?.url || 
            (typeof rawExp === 'object' && rawExp?.hinglish?.audioUrl) || 
            (ch as any).explanation_audio_url || 
            (ch as any).audioNarrations?.hinglish?.url || 
            (ch as any).audioNarrations?.hi?.url || 
            '';

          const audioUrlMr = audioRecMr?.url || 
            (typeof rawExp === 'object' && rawExp?.marathi?.audioUrl) || 
            (ch as any).explanation_marathi_audio_url || 
            (ch as any).audioNarrations?.marathi?.url || 
            (ch as any).audioNarrations?.mr?.url || 
            '';

          // Determine precise Statuses
          const isTextEnReady = textEn.trim().length >= 15;
          const isTextHiReady = textHi.trim().length >= 15;
          const isTextMrReady = textMr.trim().length >= 15;
          const isAudioEnReady = !!audioUrlEn && audioRecEn?.status !== 'failed';
          const isAudioHiReady = !!audioUrlHi && audioRecHi?.status !== 'failed';
          const isAudioMrReady = !!audioUrlMr && audioRecMr?.status !== 'failed';

          const statusTextEn: ContentStatus = isTextEnReady ? 'Ready' : 'Missing';
          const statusTextHi: ContentStatus = isTextHiReady ? 'Ready' : 'Missing';
          const statusTextMr: ContentStatus = isTextMrReady ? 'Ready' : 'Missing';
          const statusAudioEn: ContentStatus = isAudioEnReady ? 'Ready' : (audioRecEn?.status === 'failed' ? 'Failed' : 'Missing');
          const statusAudioHi: ContentStatus = isAudioHiReady ? 'Ready' : (audioRecHi?.status === 'failed' ? 'Failed' : 'Missing');
          const statusAudioMr: ContentStatus = isAudioMrReady ? 'Ready' : (audioRecMr?.status === 'failed' ? 'Failed' : 'Missing');

          list.push({
            id: ch.id,
            lessonId: lesson.id,
            lessonTitle: lesson.title || 'Untitled Lesson',
            unitId: mod.id,
            unitTitle: mod.title || 'Untitled Unit',
            worldId,
            worldTitle: worldTitleMap[worldId] || 'World',
            questionText,
            correctAnswer,
            options: optionsList,
            textEn,
            textHi,
            textMr,
            statusTextEn,
            statusTextHi,
            statusTextMr,
            audioUrlEn: audioUrlEn || undefined,
            audioUrlHi: audioUrlHi || undefined,
            audioUrlMr: audioUrlMr || undefined,
            statusAudioEn,
            statusAudioHi,
            statusAudioMr,
            ttsModel: audioRecEn?.ttsModel || audioRecHi?.ttsModel || audioRecMr?.ttsModel,
            updatedAt: audioRecEn?.updatedAt || audioRecHi?.updatedAt || audioRecMr?.updatedAt,
            errorMessage: audioRecEn?.errorMessage || audioRecHi?.errorMessage || audioRecMr?.errorMessage,
            challengeRef: ch
          });
        }
      }
    }

    return list;
  }, [modules, lessonsMap, selectedWorldId, selectedUnitId, selectedLessonId, audioRecords, worldTitleMap]);

  // 3. Filtered items
  const filteredItems = useMemo(() => {
    return allExplanationItems.filter(item => {
      // Status filtering
      if (statusFilter === 'missing_text') {
        if (item.statusTextEn === 'Ready' && item.statusTextHi === 'Ready') return false;
      } else if (statusFilter === 'missing_audio') {
        if (item.statusAudioEn === 'Ready' && item.statusAudioHi === 'Ready') return false;
      } else if (statusFilter === 'ready') {
        if (item.statusTextEn !== 'Ready' || item.statusTextHi !== 'Ready' || 
            item.statusAudioEn !== 'Ready' || item.statusAudioHi !== 'Ready') {
          return false;
        }
      } else if (statusFilter === 'failed') {
        if (item.statusAudioEn !== 'Failed' && item.statusAudioHi !== 'Failed') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQ = item.questionText.toLowerCase().includes(q);
        const matchesAns = item.correctAnswer.toLowerCase().includes(q);
        const matchesEn = item.textEn.toLowerCase().includes(q);
        const matchesHi = item.textHi.toLowerCase().includes(q);
        const matchesMr = (item.textMr || '').toLowerCase().includes(q);
        const matchesLes = item.lessonTitle.toLowerCase().includes(q);
        const matchesUnit = item.unitTitle.toLowerCase().includes(q);
        if (!matchesQ && !matchesAns && !matchesEn && !matchesHi && !matchesMr && !matchesLes && !matchesUnit) return false;
      }

      return true;
    });
  }, [allExplanationItems, statusFilter, searchQuery]);

  // Status statistics counts
  const stats = useMemo(() => {
    let totalQuestions = allExplanationItems.length;
    let readyTextEn = 0;
    let readyTextHi = 0;
    let readyAudioEn = 0;
    let readyAudioHi = 0;
    let fullyComplete = 0;
    let anyFailed = 0;

    for (const item of allExplanationItems) {
      if (item.statusTextEn === 'Ready') readyTextEn++;
      if (item.statusTextHi === 'Ready') readyTextHi++;
      if (item.statusAudioEn === 'Ready') readyAudioEn++;
      if (item.statusAudioHi === 'Ready') readyAudioHi++;
      
      if (item.statusTextEn === 'Ready' && item.statusTextHi === 'Ready' && 
          item.statusAudioEn === 'Ready' && item.statusAudioHi === 'Ready') {
        fullyComplete++;
      }
      if (item.statusAudioEn === 'Failed' || item.statusAudioHi === 'Failed') {
        anyFailed++;
      }
    }

    return {
      totalQuestions,
      readyTextEn,
      readyTextHi,
      missingTextEn: totalQuestions - readyTextEn,
      missingTextHi: totalQuestions - readyTextHi,
      readyAudioEn,
      readyAudioHi,
      missingAudioEn: totalQuestions - readyAudioEn,
      missingAudioHi: totalQuestions - readyAudioHi,
      fullyComplete,
      anyFailed
    };
  }, [allExplanationItems]);

  // Selected counts
  const selectedItems = useMemo(() => {
    return allExplanationItems.filter(i => selectedIds.has(`${i.lessonId}_${i.id}`));
  }, [allExplanationItems, selectedIds]);

  // Selection toggles
  const handleToggleSelectAll = () => {
    soundManager.play('click');
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => `${i.lessonId}_${i.id}`)));
    }
  };

  const handleSelectMissingText = () => {
    soundManager.play('click');
    const items = filteredItems.filter(i => i.statusTextEn !== 'Ready' || i.statusTextHi !== 'Ready');
    setSelectedIds(new Set(items.map(i => `${i.lessonId}_${i.id}`)));
  };

  const handleSelectMissingAudio = () => {
    soundManager.play('click');
    const items = filteredItems.filter(i => i.statusAudioEn !== 'Ready' || i.statusAudioHi !== 'Ready');
    setSelectedIds(new Set(items.map(i => `${i.lessonId}_${i.id}`)));
  };

  const handleSelectFailed = () => {
    soundManager.play('click');
    const items = filteredItems.filter(i => i.statusAudioEn === 'Failed' || i.statusAudioHi === 'Failed');
    setSelectedIds(new Set(items.map(i => `${i.lessonId}_${i.id}`)));
  };

  const handleClearSelection = () => {
    soundManager.play('click');
    setSelectedIds(new Set());
  };

  const handleToggleItem = (lessonId: string, id: string) => {
    soundManager.play('click');
    const key = `${lessonId}_${id}`;
    const next = new Set(selectedIds);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedIds(next);
  };

  // Preview Audio
  const handleToggleAudioPreview = (url?: string, trackKey?: string) => {
    soundManager.play('click');
    if (!url) return;

    if (audioPlayingKey === trackKey) {
      if (audioRef.current) audioRef.current.pause();
      setAudioPlayingKey(null);
      return;
    }

    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    setAudioPlayingKey(trackKey || url);

    audio.onended = () => setAudioPlayingKey(null);
    audio.onerror = () => {
      setAudioPlayingKey(null);
      soundManager.play('incorrect');
    };
    audio.play().catch(() => setAudioPlayingKey(null));
  };

  // Open Inspect Modal
  const handleOpenInspect = (item: WrongAnswerExplanationItem) => {
    soundManager.play('click');
    setInspectItem(item);
    setEditEnglishText(item.textEn);
    setEditHinglishText(item.textHi);
    setEditMarathiText(item.textMr || '');
    setSaveSuccessMsg(null);
  };

  // Save Edited Text from Modal
  const handleSaveEditedText = async () => {
    if (!inspectItem) return;
    setIsSavingText(true);
    setSaveSuccessMsg(null);
    soundManager.play('click');

    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch('/api/admin/save-explanation-text', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          lessonId: inspectItem.lessonId,
          screenId: inspectItem.id,
          englishText: editEnglishText.trim(),
          hinglishText: editHinglishText.trim(),
          marathiText: editMarathiText.trim()
        })
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      // Update local state directly
      const enKey = `${inspectItem.lessonId}_${inspectItem.id}_en`;
      const hiKey = `${inspectItem.lessonId}_${inspectItem.id}_hinglish`;
      const mrKey = `${inspectItem.lessonId}_${inspectItem.id}_marathi`;

      setAudioRecords(prev => ({
        ...prev,
        [enKey]: { ...(prev[enKey] || {}), narrationText: editEnglishText.trim() },
        [hiKey]: { ...(prev[hiKey] || {}), narrationText: editHinglishText.trim() },
        [mrKey]: { ...(prev[mrKey] || {}), narrationText: editMarathiText.trim() },
        [`${inspectItem.lessonId}_${inspectItem.id}_mr`]: { ...(prev[`${inspectItem.lessonId}_${inspectItem.id}_mr`] || {}), narrationText: editMarathiText.trim() },
        [`${inspectItem.id}_marathi`]: { ...(prev[`${inspectItem.id}_marathi`] || {}), narrationText: editMarathiText.trim() },
        [`${inspectItem.id}_mr`]: { ...(prev[`${inspectItem.id}_mr`] || {}), narrationText: editMarathiText.trim() }
      }));

      setInspectItem(prev => prev ? ({
        ...prev,
        textEn: editEnglishText.trim(),
        textHi: editHinglishText.trim(),
        textMr: editMarathiText.trim(),
        statusTextEn: editEnglishText.trim().length >= 15 ? 'Ready' : 'Missing',
        statusTextHi: editHinglishText.trim().length >= 15 ? 'Ready' : 'Missing',
        statusTextMr: editMarathiText.trim().length >= 15 ? 'Ready' : 'Missing'
      }) : null);

      setSaveSuccessMsg('Explanation text saved successfully!');
      soundManager.play('complete');
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
      soundManager.play('incorrect');
    } finally {
      setIsSavingText(false);
    }
  };

  // -------------------------------------------------------------
  // CORE WORKFLOW 1: GENERATE EXPLANATION TEXT (NO TTS)
  // Generates English & Hinglish wrong-answer explanation concepts
  // -------------------------------------------------------------
  const handleGenerateTextOnly = async (singleItem?: WrongAnswerExplanationItem) => {
    const targets = singleItem ? [singleItem] : selectedItems;
    if (targets.length === 0 || isProcessing) return;
    soundManager.play('click');

    setIsProcessing(true);
    setActiveJobPhase('generating_text');
    isCancelledRef.current = false;
    setJobReport(null);

    setJobProgress({
      total: targets.length,
      completed: 0,
      failed: 0,
      skipped: 0,
      currentItemTitle: 'Starting text generation...',
      actionName: 'Generate Explanation Text (English + Hinglish)'
    });

    let completed = 0;
    let failed = 0;
    let skipped = 0;
    const failures: Array<{ id: string; title: string; reason: string }> = [];

    // Bounded concurrency (2 parallel AI requests)
    const concurrency = 2;
    let queueIdx = 0;

    const processItem = async (): Promise<void> => {
      if (isCancelledRef.current || queueIdx >= targets.length) return;
      const item = targets[queueIdx++];

      // Skip if both texts are already valid unless single explicit request
      if (!singleItem && item.statusTextEn === 'Ready' && item.statusTextHi === 'Ready') {
        skipped++;
        setJobProgress(prev => ({ ...prev, skipped }));
        if (queueIdx < targets.length && !isCancelledRef.current) return processItem();
        return;
      }

      setJobProgress(prev => ({
        ...prev,
        currentItemTitle: `[${item.unitTitle.slice(0, 15)}] ${item.questionText.slice(0, 35)}...`
      }));

      try {
        const headers = await getAdminAuthHeaders();
        const res = await fetch('/api/admin/generate-wrong-answer-explanation', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            lessonId: item.lessonId,
            screenId: item.id,
            question: item.questionText,
            correctAnswer: item.correctAnswer,
            options: item.options,
            lessonTitle: item.lessonTitle,
            unitTitle: item.unitTitle
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server HTTP ${res.status}`);
        }

        const data = await res.json();
        if (!data.success || (!data.english && !data.hinglish)) {
          throw new Error(data.error || 'Empty explanation returned');
        }

        // Update local state records
        const enKey = `${item.lessonId}_${item.id}_en`;
        const hiKey = `${item.lessonId}_${item.id}_hinglish`;
        setAudioRecords(prev => ({
          ...prev,
          [enKey]: { ...(prev[enKey] || {}), narrationText: data.english },
          [hiKey]: { ...(prev[hiKey] || {}), narrationText: data.hinglish }
        }));

        completed++;
      } catch (err: any) {
        console.error(`[Text Gen Error] ${item.id}:`, err);
        failed++;
        failures.push({
          id: item.id,
          title: item.questionText,
          reason: err.message || 'Generation failed'
        });
      }

      setJobProgress(prev => ({ ...prev, completed, failed, skipped }));

      if (queueIdx < targets.length && !isCancelledRef.current) {
        return processItem();
      }
    };

    const workers = Array.from(
      { length: Math.min(concurrency, targets.length) }, 
      () => processItem()
    );
    await Promise.all(workers);

    setIsProcessing(false);
    setActiveJobPhase('idle');
    if (!isCancelledRef.current) soundManager.play('complete');

    const report = {
      actionName: 'Generate Explanation Text',
      total: targets.length,
      completed,
      failed,
      skipped,
      failures
    };
    setJobReport(report);

    saveJobToHistory({
      id: 'job_' + Date.now(),
      timestamp: new Date().toLocaleString(),
      scopeDescription: selectedUnitId !== 'all' 
        ? `Unit: ${modules.find(m => m.id === selectedUnitId)?.title || selectedUnitId}` 
        : 'Curriculum Selection',
      actionType: 'text_only',
      total: targets.length,
      completed,
      failed,
      skipped,
      failures
    });
  };

  // -------------------------------------------------------------
  // CORE WORKFLOW 2: GENERATE EXPLANATION AUDIO (AUDIO-ONLY)
  // Takes saved English and Hinglish explanation texts and runs TTS
  // NEVER sends question text to TTS
  // -------------------------------------------------------------
  const handleGenerateAudioOnly = async (singleItem?: WrongAnswerExplanationItem) => {
    const targets = singleItem ? [singleItem] : selectedItems;
    if (targets.length === 0 || isProcessing) return;
    soundManager.play('click');

    setIsProcessing(true);
    setActiveJobPhase('synthesizing_audio');
    isCancelledRef.current = false;
    setJobReport(null);

    setJobProgress({
      total: targets.length * 2, // 2 audio tracks per question (EN + HI)
      completed: 0,
      failed: 0,
      skipped: 0,
      currentItemTitle: 'Preparing TTS audio synthesis...',
      actionName: 'Generate Explanation Audio (English + Hinglish TTS)'
    });

    let completed = 0;
    let failed = 0;
    let skipped = 0;
    const failures: Array<{ id: string; title: string; reason: string }> = [];

    // Process tasks sequentially per item to avoid rate limit spikes
    const concurrency = 2;
    let queueIdx = 0;

    const processAudioItem = async (): Promise<void> => {
      if (isCancelledRef.current || queueIdx >= targets.length) return;
      const item = targets[queueIdx++];

      // Must have explanation text!
      const currentEnText = audioRecords[`${item.lessonId}_${item.id}_en`]?.narrationText || item.textEn;
      const currentHiText = audioRecords[`${item.lessonId}_${item.id}_hinglish`]?.narrationText || item.textHi;
      const currentMrText = audioRecords[`${item.lessonId}_${item.id}_marathi`]?.narrationText || 
                            audioRecords[`${item.lessonId}_${item.id}_mr`]?.narrationText || 
                            item.textMr;

      // 1. Process English Audio
      if (item.statusAudioEn === 'Ready' && !singleItem) {
        skipped++;
        setJobProgress(prev => ({ ...prev, skipped }));
      } else if (!currentEnText || currentEnText.trim().length < 15) {
        failed++;
        failures.push({
          id: item.id,
          title: `${item.questionText} (English)`,
          reason: 'Missing English explanation text. Please generate text first!'
        });
      } else {
        setJobProgress(prev => ({
          ...prev,
          currentItemTitle: `[English TTS] ${item.questionText.slice(0, 30)}...`
        }));

        try {
          // Strictly send ONLY the explanation text to TTS (never question text!)
          const headers = await getAdminAuthHeaders();
          const res = await fetch('/api/admin/generate-screen-narration', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              lessonId: item.lessonId,
              screenId: item.id,
              targetLanguage: 'english',
              approvedText: currentEnText.trim(),
              approvedTexts: { english: currentEnText.trim() },
              voiceName: selectedVoice,
              screenData: {
                id: item.id,
                type: 'challenge_explanation',
                question: item.questionText,
                explanation: currentEnText.trim()
              }
            })
          });

          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          if (!data.success) throw new Error(data.error || 'TTS error');

          const audioRec = data.audioNarrations?.english || data.audioNarrations?.en;
          if (audioRec?.url) {
            completed++;
            const enKey = `${item.lessonId}_${item.id}_en`;
            setAudioRecords(prev => ({
              ...prev,
              [enKey]: { ...(prev[enKey] || {}), ...audioRec },
              [`${item.lessonId}_${item.id}_english`]: { ...(prev[`${item.lessonId}_${item.id}_english`] || {}), ...audioRec },
              [`${item.id}_en`]: { ...(prev[`${item.id}_en`] || {}), ...audioRec },
              [`${item.id}_english`]: { ...(prev[`${item.id}_english`] || {}), ...audioRec }
            }));
          } else {
            throw new Error('No audio URL returned');
          }
        } catch (err: any) {
          failed++;
          failures.push({ id: item.id, title: `${item.questionText} (English Audio)`, reason: err.message });
        }
      }

      setJobProgress(prev => ({ ...prev, completed, failed, skipped }));

      // 2. Process Hinglish Audio
      if (item.statusAudioHi === 'Ready' && !singleItem) {
        skipped++;
        setJobProgress(prev => ({ ...prev, skipped }));
      } else if (!currentHiText || currentHiText.trim().length < 15) {
        failed++;
        failures.push({
          id: item.id,
          title: `${item.questionText} (Hinglish)`,
          reason: 'Missing Hinglish explanation text. Please generate text first!'
        });
      } else {
        setJobProgress(prev => ({
          ...prev,
          currentItemTitle: `[Hinglish TTS] ${item.questionText.slice(0, 30)}...`
        }));

        try {
          // Strictly send ONLY the Hinglish explanation text to TTS
          const headers = await getAdminAuthHeaders();
          const res = await fetch('/api/admin/generate-screen-narration', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              lessonId: item.lessonId,
              screenId: item.id,
              targetLanguage: 'hinglish',
              approvedText: currentHiText.trim(),
              approvedTexts: { hinglish: currentHiText.trim() },
              voiceName: selectedVoice,
              screenData: {
                id: item.id,
                type: 'challenge_explanation',
                question: item.questionText,
                explanation: currentHiText.trim()
              }
            })
          });

          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          if (!data.success) throw new Error(data.error || 'TTS error');

          const audioRec = data.audioNarrations?.hinglish;
          if (audioRec?.url) {
            completed++;
            const hiKey = `${item.lessonId}_${item.id}_hinglish`;
            setAudioRecords(prev => ({
              ...prev,
              [hiKey]: { ...(prev[hiKey] || {}), ...audioRec },
              [`${item.lessonId}_${item.id}_hi`]: { ...(prev[`${item.lessonId}_${item.id}_hi`] || {}), ...audioRec },
              [`${item.id}_hinglish`]: { ...(prev[`${item.id}_hinglish`] || {}), ...audioRec },
              [`${item.id}_hi`]: { ...(prev[`${item.id}_hi`] || {}), ...audioRec }
            }));
          } else {
            throw new Error('No audio URL returned');
          }
        } catch (err: any) {
          failed++;
          failures.push({ id: item.id, title: `${item.questionText} (Hinglish Audio)`, reason: err.message });
        }
      }

      // 3. Process Marathi Audio (if text is available or singleItem requested)
      if (item.statusAudioMr === 'Ready' && !singleItem) {
        skipped++;
        setJobProgress(prev => ({ ...prev, skipped }));
      } else if (!currentMrText || currentMrText.trim().length < 15) {
        if (singleItem) {
          // Only flag as failed in single inspect mode if Marathi text was explicitly missing
          failed++;
          failures.push({
            id: item.id,
            title: `${item.questionText} (Marathi)`,
            reason: 'Missing Marathi explanation text. Please enter or generate Marathi text first!'
          });
        }
      } else {
        setJobProgress(prev => ({
          ...prev,
          currentItemTitle: `[Marathi TTS] ${item.questionText.slice(0, 30)}...`
        }));

        try {
          const headers = await getAdminAuthHeaders();
          const res = await fetch('/api/admin/generate-screen-narration', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              lessonId: item.lessonId,
              screenId: item.id,
              targetLanguage: 'marathi',
              approvedText: currentMrText.trim(),
              approvedTexts: { marathi: currentMrText.trim() },
              voiceName: selectedVoice,
              screenData: {
                id: item.id,
                type: 'challenge_explanation',
                question: item.questionText,
                explanation: currentMrText.trim()
              }
            })
          });

          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          if (!data.success) throw new Error(data.error || 'TTS error');

          const audioRec = data.audioNarrations?.marathi || data.audioNarrations?.mr;
          if (audioRec?.url) {
            completed++;
            const mrKey = `${item.lessonId}_${item.id}_marathi`;
            setAudioRecords(prev => ({
              ...prev,
              [mrKey]: { ...(prev[mrKey] || {}), ...audioRec },
              [`${item.lessonId}_${item.id}_mr`]: { ...(prev[`${item.lessonId}_${item.id}_mr`] || {}), ...audioRec },
              [`${item.id}_marathi`]: { ...(prev[`${item.id}_marathi`] || {}), ...audioRec },
              [`${item.id}_mr`]: { ...(prev[`${item.id}_mr`] || {}), ...audioRec }
            }));
          } else {
            throw new Error('No audio URL returned');
          }
        } catch (err: any) {
          failed++;
          failures.push({ id: item.id, title: `${item.questionText} (Marathi Audio)`, reason: err.message });
        }
      }

      setJobProgress(prev => ({ ...prev, completed, failed, skipped }));

      if (queueIdx < targets.length && !isCancelledRef.current) {
        return processAudioItem();
      }
    };

    const workers = Array.from(
      { length: Math.min(concurrency, targets.length) }, 
      () => processAudioItem()
    );
    await Promise.all(workers);

    setIsProcessing(false);
    setActiveJobPhase('idle');
    if (!isCancelledRef.current) soundManager.play('complete');

    const report = {
      actionName: 'Generate Explanation Audio',
      total: targets.length * 2,
      completed,
      failed,
      skipped,
      failures
    };
    setJobReport(report);

    saveJobToHistory({
      id: 'job_' + Date.now(),
      timestamp: new Date().toLocaleString(),
      scopeDescription: selectedUnitId !== 'all' 
        ? `Unit: ${modules.find(m => m.id === selectedUnitId)?.title || selectedUnitId}` 
        : 'Curriculum Selection',
      actionType: 'audio_only',
      total: targets.length * 2,
      completed,
      failed,
      skipped,
      failures
    });
  };

  // -------------------------------------------------------------
  // CORE WORKFLOW 3: GENERATE BOTH (TEXT FIRST, THEN AUDIO)
  // Generates missing English & Hinglish text, then generates audio
  // -------------------------------------------------------------
  const handleGenerateBoth = async () => {
    if (selectedItems.length === 0 || isProcessing) return;
    
    // Step 1: Text Generation
    await handleGenerateTextOnly();
    if (isCancelledRef.current) return;
    
    // Step 2: Audio Synthesis from the generated text
    await handleGenerateAudioOnly();
  };

  const handleCancelJob = () => {
    isCancelledRef.current = true;
    setIsProcessing(false);
    setActiveJobPhase('idle');
    soundManager.play('click');
  };

  return (
    <div className={`space-y-6 ${className}`}>

      {/* 1. TOP HEADER & WORKSPACE BANNER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-indigo-200/60">
              Chikoo AI Content Engine
            </span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-500 font-bold text-xs">Wrong-Answer Explanations</span>
          </div>

          <h2 className="text-xl md:text-2xl font-display font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Volume2 className="text-indigo-600 dark:text-indigo-400 w-6 h-6 shrink-0" />
            <span>Wrong-Answer Explanation Studio</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Automate and manage explanations for incorrect answers across questions. Generates dual-language explanation concepts (English & Hinglish), converts them to speech using Chikoo’s TTS pipeline, and uploads to Supabase for student playback.
          </p>
        </div>

        {/* Global Batch Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-2xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="View Bulk Job Audit History"
          >
            <Clock size={16} />
            <span className="hidden sm:inline">Job History</span>
          </button>

          <button
            onClick={() => handleGenerateTextOnly()}
            disabled={selectedIds.size === 0 || isProcessing}
            className="btn-3d btn-3d-slate px-4 py-3 text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Generates English and Hinglish explanation text without running TTS"
          >
            <FileText size={15} />
            <span>1. Generate Text ({selectedIds.size})</span>
          </button>

          <button
            onClick={() => handleGenerateAudioOnly()}
            disabled={selectedIds.size === 0 || isProcessing}
            className="btn-3d btn-3d-slate px-4 py-3 text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Converts saved explanation text to English & Hinglish audio via TTS"
          >
            <Mic size={15} />
            <span>2. Generate Audio ({selectedIds.size})</span>
          </button>

          <button
            onClick={handleGenerateBoth}
            disabled={selectedIds.size === 0 || isProcessing}
            className="btn-3d btn-3d-blue px-5 py-3 text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            title="Full Pipeline: Generates text first, then synthesizes audio"
          >
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            <span className="font-black uppercase tracking-wider">
              Generate Both ({selectedIds.size})
            </span>
          </button>
        </div>
      </div>

      {/* 2. CHIKOO AI MASCOT VOICE PERSONALITY & LIVE AUDITION SETUP */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border-2 border-indigo-500/40 rounded-3xl p-6 shadow-lg text-white space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center shrink-0 shadow-inner">
              <Headphones className="w-7 h-7 text-indigo-400" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-emerald-500/30">
                  Active Voice Config
                </span>
                <span className="bg-sky-500/20 text-sky-300 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-sky-500/30">
                  Masculine Cartoon Mentor
                </span>
              </div>
              <h3 className="text-lg font-display font-black text-white flex items-center gap-2">
                <span>Chikoo Narrator Voice Personality</span>
                <span className="text-xs font-mono font-bold bg-white/10 px-2.5 py-0.5 rounded-md text-indigo-200">
                  {selectedVoice}
                </span>
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Energetic, playful, and cartoon-like male narrator voice designed for Chikoo's gamified learning experience. Explains wrong answers like an encouraging cartoon character or friendly game teacher.
              </p>
            </div>
          </div>

          {/* Voice Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Narrator Voice Profile
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="bg-slate-800 border border-indigo-400/30 rounded-xl px-3 py-2 text-xs font-black text-white focus:outline-none cursor-pointer"
              >
                <option value="Puck">🌟 Puck (Recommended: Playful Cartoon Mentor)</option>
                <option value="Orus">👦 Orus (Masculine: Clear & Friendly)</option>
                <option value="Fenrir">⚡ Fenrir (Masculine: Strong & Lively)</option>
                <option value="Charon">🎙️ Charon (Masculine: Deep Announcer)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Personality Highlights Pill Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-center">
            <span className="text-sm">👦</span>
            <div className="text-xs font-bold text-slate-200 mt-0.5">Warm & Youthful</div>
            <div className="text-[10px] text-slate-400">Naturally masculine tone</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-center">
            <span className="text-sm">🎭</span>
            <div className="text-xs font-bold text-slate-200 mt-0.5">Cartoon & Playful</div>
            <div className="text-[10px] text-slate-400">Animated intonation & character</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-center">
            <span className="text-sm">🤝</span>
            <div className="text-xs font-bold text-slate-200 mt-0.5">Friendly & Encouraging</div>
            <div className="text-[10px] text-slate-400">Non-intimidating explanations</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-center">
            <span className="text-sm">🌐</span>
            <div className="text-xs font-bold text-slate-200 mt-0.5">Dual-Language Ready</div>
            <div className="text-[10px] text-slate-400">English, Hinglish & Marathi</div>
          </div>
        </div>

        {/* Live Audition & Test Player */}
        <div className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Audition Live Voice:
              </span>
              <div className="flex items-center bg-white/10 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setAuditionLang('english');
                    setAuditionCustomText('');
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    auditionLang === 'english' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  🇬🇧 English
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuditionLang('hinglish');
                    setAuditionCustomText('');
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    auditionLang === 'hinglish' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  🇮🇳 Hinglish
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuditionLang('marathi');
                    setAuditionCustomText('');
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    auditionLang === 'marathi' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  🚩 Marathi
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAuditionVoice}
              disabled={isAuditioningVoice}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                isAuditionPlaying
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95'
              }`}
            >
              {isAuditioningVoice ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Synthesizing Voice...</span>
                </>
              ) : isAuditionPlaying ? (
                <>
                  <Pause size={15} />
                  <span>Stop Audition</span>
                </>
              ) : (
                <>
                  <Play size={15} className="fill-current" />
                  <span>Audition "{selectedVoice}" Voice</span>
                </>
              )}
            </button>
          </div>

          {/* Sample Spoken Script */}
          <div className="relative">
            <input
              type="text"
              value={auditionCustomText || AUDITION_SAMPLES[auditionLang]}
              onChange={(e) => setAuditionCustomText(e.target.value)}
              placeholder="Type any test explanation text to audition..."
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 font-medium"
            />
            {isAuditionPlaying && (
              <div className="absolute right-3 top-2.5 flex items-center gap-1">
                <span className="w-1 h-3 bg-emerald-400 animate-pulse rounded-full" />
                <span className="w-1 h-5 bg-emerald-400 animate-pulse delay-75 rounded-full" />
                <span className="w-1 h-2 bg-emerald-400 animate-pulse delay-150 rounded-full" />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>💡 All bulk-generated wrong-answer audio will automatically use this masculine narrator voice.</span>
            {auditionCustomText && (
              <button
                type="button"
                onClick={() => setAuditionCustomText('')}
                className="text-indigo-400 hover:underline text-[10px]"
              >
                Reset to sample text
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. DASHBOARD: 4-STAGE GENERATION STATUS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Questions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-semibold">
            <span>Eligible Questions</span>
            <Layers size={16} className="text-indigo-500" />
          </div>
          <div className="text-2xl font-display font-black text-slate-900 dark:text-white">
            {stats.totalQuestions}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Interaction screens in selected scope</div>
        </div>

        {/* English Explanation Text */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-semibold">
            <span>English Explanations</span>
            <span className="text-[10px] font-bold text-slate-400 font-mono">🇬🇧 EN</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-display font-black text-emerald-600 dark:text-emerald-400">
              {stats.readyTextEn}
            </span>
            <span className="text-xs text-slate-400">/ {stats.totalQuestions} Text</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
            <span>Audio: <b className="text-emerald-600 font-bold">{stats.readyAudioEn}</b></span>
            <span>Missing: <b className="text-amber-600 font-bold">{stats.missingAudioEn}</b></span>
          </div>
        </div>

        {/* Hinglish Explanation Text */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-semibold">
            <span>Hinglish Explanations</span>
            <span className="text-[10px] font-bold text-slate-400 font-mono">🇮🇳 HI</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-display font-black text-emerald-600 dark:text-emerald-400">
              {stats.readyTextHi}
            </span>
            <span className="text-xs text-slate-400">/ {stats.totalQuestions} Text</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
            <span>Audio: <b className="text-emerald-600 font-bold">{stats.readyAudioHi}</b></span>
            <span>Missing: <b className="text-amber-600 font-bold">{stats.missingAudioHi}</b></span>
          </div>
        </div>

        {/* Fully Complete */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-semibold">
            <span>Fully Complete</span>
            <CheckCircle2 size={16} className="text-teal-500" />
          </div>
          <div className="text-2xl font-display font-black text-teal-600 dark:text-teal-400">
            {stats.fullyComplete}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Dual-text & dual-audio ready</div>
        </div>
      </div>

      {/* 3. LIVE GENERATION PROGRESS BANNER */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-800 text-white rounded-3xl p-5 shadow-xl space-y-3.5 border border-indigo-500/30"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3 font-bold text-sm">
                <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-indigo-200" />
                </div>
                <div>
                  <h4 className="font-display font-black text-white text-base">
                    {jobProgress.actionName}
                  </h4>
                  <span className="text-xs text-indigo-200 font-normal">
                    {activeJobPhase === 'generating_text' && 'Generating student-friendly explanation concepts (English & Hinglish)...'}
                    {activeJobPhase === 'synthesizing_audio' && `Converting explanation text into voice using masculine narrator "${selectedVoice}" (TTS -> Supabase)...`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold bg-white/10 px-3 py-1.5 rounded-xl">
                  {jobProgress.completed + jobProgress.failed + jobProgress.skipped} / {jobProgress.total} items
                </span>
                <button
                  onClick={handleCancelJob}
                  className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <StopCircle size={14} />
                  <span>Cancel Job</span>
                </button>
              </div>
            </div>
            
            {/* Visual Progress Bar */}
            <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden p-0.5">
              <div 
                className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.round(((jobProgress.completed + jobProgress.failed + jobProgress.skipped) / (jobProgress.total || 1)) * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-indigo-200 flex-wrap gap-2">
              <span className="truncate max-w-lg font-medium">
                {jobProgress.currentItemTitle}
              </span>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="text-emerald-300">✓ Completed: {jobProgress.completed}</span>
                {jobProgress.skipped > 0 && <span className="text-slate-300">⏭ Skipped: {jobProgress.skipped}</span>}
                {jobProgress.failed > 0 && <span className="text-rose-300">⚠ Failed: {jobProgress.failed}</span>}
              </div>
            </div>
          </motion.div>
        )}

        {jobReport && !isProcessing && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white dark:bg-slate-900 border-2 border-emerald-500/30 rounded-3xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={26} />
              </div>
              <div>
                <h4 className="font-display font-black text-slate-900 dark:text-white text-base">
                  {jobReport.actionName} Complete!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Completed: <b className="text-emerald-600">{jobReport.completed}</b> | 
                  Skipped (already ready): <b className="text-slate-600">{jobReport.skipped}</b> | 
                  Failed: <b className="text-rose-600">{jobReport.failed}</b> | 
                  Total Processed: {jobReport.total}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {jobReport.failed > 0 && (
                <button
                  onClick={handleSelectFailed}
                  className="bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 font-bold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Select Failed Items ({jobReport.failed})
                </button>
              )}
              <button
                onClick={() => setJobReport(null)}
                className="btn-3d btn-3d-slate px-4 py-2 text-xs"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. CONTENT HIERARCHY SELECTORS & WORKSPACE FILTERS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
        
        {/* Breadcrumb Hierarchy Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-500 overflow-x-auto pb-1">
          <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Hierarchy:</span>
          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-700 dark:text-slate-300">
            {selectedWorldId === 'all' ? 'All Worlds' : (worldTitleMap[selectedWorldId] || selectedWorldId)}
          </span>
          <ChevronRight size={12} className="text-slate-400" />
          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-700 dark:text-slate-300">
            {selectedUnitId === 'all' ? 'All Units' : (modules.find(m => m.id === selectedUnitId)?.title || selectedUnitId)}
          </span>
          <ChevronRight size={12} className="text-slate-400" />
          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-700 dark:text-slate-300">
            {selectedLessonId === 'all' ? 'All Lessons' : (Object.values(lessonsMap).flat().find(l => l.id === selectedLessonId)?.title || selectedLessonId)}
          </span>
        </div>

        {/* Dropdowns Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* World Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              1. World
            </label>
            <select
              value={selectedWorldId}
              onChange={(e) => {
                setSelectedWorldId(e.target.value);
                setSelectedUnitId('all');
                setSelectedLessonId('all');
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Worlds</option>
              {worlds.map(w => (
                <option key={w.id} value={w.id}>{w.title || `World ${w.world_number}`}</option>
              ))}
            </select>
          </div>

          {/* Unit Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              2. Unit
            </label>
            <select
              value={selectedUnitId}
              onChange={(e) => {
                setSelectedUnitId(e.target.value);
                setSelectedLessonId('all');
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Units ({modules.length})</option>
              {modules
                .filter(m => selectedWorldId === 'all' || (m.world_id || 'world_1') === selectedWorldId)
                .map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
            </select>
          </div>

          {/* Lesson Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              3. Lesson
            </label>
            <select
              value={selectedLessonId}
              onChange={(e) => setSelectedLessonId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Lessons</option>
              {selectedUnitId !== 'all' 
                ? (lessonsMap[selectedUnitId] || []).map(l => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))
                : Object.values(lessonsMap).flat().slice(0, 50).map(l => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))
              }
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Questions ({stats.totalQuestions})</option>
              <option value="missing_text">Missing Explanation Text ({stats.missingTextEn + stats.missingTextHi > 0 ? 'Action Needed' : '0'})</option>
              <option value="missing_audio">Missing Explanation Audio ({stats.missingAudioEn + stats.missingAudioHi})</option>
              <option value="ready">Fully Complete ({stats.fullyComplete})</option>
              <option value="failed">Failed Generation ({stats.anyFailed})</option>
            </select>
          </div>
        </div>

        {/* Search Bar & Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleToggleSelectAll}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckSquare size={14} />
              <span>{selectedIds.size === filteredItems.length && filteredItems.length > 0 ? 'Deselect All' : 'Select All Filtered'}</span>
            </button>

            <button
              onClick={handleSelectMissingText}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Select Missing Text</span>
            </button>

            <button
              onClick={handleSelectMissingAudio}
              className="bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Select Missing Audio</span>
            </button>

            {stats.anyFailed > 0 && (
              <button
                onClick={handleSelectFailed}
                className="bg-rose-50 hover:bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Select Failed ({stats.anyFailed})</span>
              </button>
            )}

            {selectedIds.size > 0 && (
              <button
                onClick={handleClearSelection}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1 cursor-pointer"
              >
                Clear Selection
              </button>
            )}
          </div>

          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search question or explanation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>
        </div>

        {/* 5. CONTENT TABLE: 4-STATUS COLUMNS PER QUESTION */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
          {loadingContent ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
              <Loader2 size={28} className="animate-spin text-indigo-500" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Loading curriculum questions and wrong-answer explanations...
              </span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <HelpCircle size={36} className="mx-auto text-slate-300" />
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No questions found
              </div>
              <p className="text-xs text-slate-500">
                Try selecting a different unit or clearing search filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3 w-10 text-center">
                      <span className="sr-only">Select</span>
                    </th>
                    <th className="p-3 w-40">Unit & Lesson</th>
                    <th className="p-3 min-w-[180px]">Question & Correct Answer</th>
                    <th className="p-3 w-28 text-center">English Text</th>
                    <th className="p-3 w-28 text-center">Hinglish Text</th>
                    <th className="p-3 w-28 text-center">Marathi Text</th>
                    <th className="p-3 w-32 text-center">English Audio</th>
                    <th className="p-3 w-32 text-center">Hinglish Audio</th>
                    <th className="p-3 w-32 text-center">Marathi Audio</th>
                    <th className="p-3 w-24 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredItems.map(item => {
                    const key = `${item.lessonId}_${item.id}`;
                    const isSelected = selectedIds.has(key);
                    const isPlayingEn = audioPlayingKey === `${key}_en`;
                    const isPlayingHi = audioPlayingKey === `${key}_hi`;
                    const isPlayingMr = audioPlayingKey === `${key}_mr`;

                    return (
                      <tr 
                        key={key}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleToggleItem(item.lessonId, item.id)}
                            className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            {isSelected ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} />}
                          </button>
                        </td>

                        {/* Unit / Lesson Context */}
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white truncate max-w-[160px]" title={item.unitTitle}>
                            {item.unitTitle}
                          </div>
                          <div className="text-slate-500 text-[10px] truncate max-w-[160px] mt-0.5" title={item.lessonTitle}>
                            {item.lessonTitle}
                          </div>
                        </td>

                        {/* Question Text & Correct Answer */}
                        <td className="p-3">
                          <div className="font-bold text-slate-800 dark:text-slate-200 leading-snug line-clamp-2" title={item.questionText}>
                            {item.questionText}
                          </div>
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                            <span>Ans:</span>
                            <span className="truncate max-w-[180px]">{item.correctAnswer}</span>
                          </div>
                        </td>

                        {/* 1. English Text Status */}
                        <td className="p-3 text-center">
                          {item.statusTextEn === 'Ready' ? (
                            <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-[9px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <CheckCircle2 size={10} /> Ready
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-[9px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <AlertCircle size={10} /> Missing
                            </span>
                          )}
                        </td>

                        {/* 2. Hinglish Text Status */}
                        <td className="p-3 text-center">
                          {item.statusTextHi === 'Ready' ? (
                            <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-[9px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <CheckCircle2 size={10} /> Ready
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-[9px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <AlertCircle size={10} /> Missing
                            </span>
                          )}
                        </td>

                        {/* 3. Marathi Text Status */}
                        <td className="p-3 text-center">
                          {item.statusTextMr === 'Ready' ? (
                            <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-[9px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <CheckCircle2 size={10} /> Ready
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-[9px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <AlertCircle size={10} /> Missing
                            </span>
                          )}
                        </td>

                        {/* 4. English Audio Status & Play */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {item.statusAudioEn === 'Ready' ? (
                              <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-[9px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <CheckCircle2 size={10} /> Ready
                              </span>
                            ) : item.statusAudioEn === 'Failed' ? (
                              <span className="bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-[9px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <ShieldAlert size={10} /> Failed
                              </span>
                            ) : (
                              <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-[9px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <AlertCircle size={10} /> Missing
                              </span>
                            )}

                            {item.audioUrlEn && (
                              <button
                                onClick={() => handleToggleAudioPreview(item.audioUrlEn, `${key}_en`)}
                                className={`p-1 rounded-md border transition-colors cursor-pointer ${
                                  isPlayingEn
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                                }`}
                                title={isPlayingEn ? "Pause English Audio" : "Play English Audio"}
                              >
                                {isPlayingEn ? <Pause size={11} /> : <Play size={11} />}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 5. Hinglish Audio Status & Play */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {item.statusAudioHi === 'Ready' ? (
                              <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-[9px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <CheckCircle2 size={10} /> Ready
                              </span>
                            ) : item.statusAudioHi === 'Failed' ? (
                              <span className="bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-[9px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <ShieldAlert size={10} /> Failed
                              </span>
                            ) : (
                              <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-[9px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <AlertCircle size={10} /> Missing
                              </span>
                            )}

                            {item.audioUrlHi && (
                              <button
                                onClick={() => handleToggleAudioPreview(item.audioUrlHi, `${key}_hi`)}
                                className={`p-1 rounded-md border transition-colors cursor-pointer ${
                                  isPlayingHi
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                                }`}
                                title={isPlayingHi ? "Pause Hinglish Audio" : "Play Hinglish Audio"}
                              >
                                {isPlayingHi ? <Pause size={11} /> : <Play size={11} />}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 6. Marathi Audio Status & Play */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {item.statusAudioMr === 'Ready' ? (
                              <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-[9px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <CheckCircle2 size={10} /> Ready
                              </span>
                            ) : item.statusAudioMr === 'Failed' ? (
                              <span className="bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-[9px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <ShieldAlert size={10} /> Failed
                              </span>
                            ) : (
                              <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-[9px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <AlertCircle size={10} /> Missing
                              </span>
                            )}

                            {item.audioUrlMr && (
                              <button
                                onClick={() => handleToggleAudioPreview(item.audioUrlMr, `${key}_mr`)}
                                className={`p-1 rounded-md border transition-colors cursor-pointer ${
                                  isPlayingMr
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                                }`}
                                title={isPlayingMr ? "Pause Marathi Audio" : "Play Marathi Audio"}
                              >
                                {isPlayingMr ? <Pause size={11} /> : <Play size={11} />}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenInspect(item)}
                              className="p-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer font-bold text-[10px] flex items-center gap-1"
                              title="Inspect & Edit Explanations"
                            >
                              <Edit3 size={12} />
                              <span>Inspect</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 6. INSPECT & EDIT EXPLANATION MODAL */}
      <AnimatePresence>
        {inspectItem && (
          <div className="fixed inset-0 z-[600] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    {inspectItem.worldTitle} &gt; {inspectItem.unitTitle} &gt; {inspectItem.lessonTitle}
                  </span>
                  <h3 className="text-base font-display font-black text-slate-900 dark:text-white mt-0.5">
                    Wrong-Answer Explanation Review
                  </h3>
                </div>
                <button
                  onClick={() => setInspectItem(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Question Context Box */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Question</span>
                <p className="text-sm font-black text-slate-900 dark:text-white">{inspectItem.questionText}</p>
                <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5 pt-1">
                  <span>✓ Correct Answer:</span>
                  <span className="bg-emerald-100/70 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md font-mono">{inspectItem.correctAnswer}</span>
                </div>
              </div>

              {/* English Explanation Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <span>🇬🇧 English Wrong-Answer Explanation</span>
                    {inspectItem.statusTextEn === 'Ready' && <CheckCircle2 size={12} className="text-emerald-500" />}
                  </label>
                  {inspectItem.audioUrlEn && (
                    <button
                      onClick={() => handleToggleAudioPreview(inspectItem.audioUrlEn, 'modal_en')}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {audioPlayingKey === 'modal_en' ? <Pause size={10} /> : <Play size={10} />}
                      <span>{audioPlayingKey === 'modal_en' ? 'Pause Audio' : 'Preview English Audio'}</span>
                    </button>
                  )}
                </div>
                <textarea
                  value={editEnglishText}
                  onChange={(e) => setEditEnglishText(e.target.value)}
                  placeholder="Explain why the correct answer is right and clarify the core concept..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed outline-none focus:border-indigo-500 focus:bg-white resize-none"
                />
              </div>

              {/* Hinglish Explanation Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <span>🇮🇳 Hinglish Wrong-Answer Explanation</span>
                    {inspectItem.statusTextHi === 'Ready' && <CheckCircle2 size={12} className="text-emerald-500" />}
                  </label>
                  {inspectItem.audioUrlHi && (
                    <button
                      onClick={() => handleToggleAudioPreview(inspectItem.audioUrlHi, 'modal_hi')}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {audioPlayingKey === 'modal_hi' ? <Pause size={10} /> : <Play size={10} />}
                      <span>{audioPlayingKey === 'modal_hi' ? 'Pause Audio' : 'Preview Hinglish Audio'}</span>
                    </button>
                  )}
                </div>
                <textarea
                  value={editHinglishText}
                  onChange={(e) => setEditHinglishText(e.target.value)}
                  placeholder="Explain in natural conversational Hinglish using relatable analogies..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed outline-none focus:border-indigo-500 focus:bg-white resize-none"
                />
              </div>

              {/* Marathi Explanation Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <span>🚩 Marathi Wrong-Answer Explanation</span>
                    {inspectItem.statusTextMr === 'Ready' && <CheckCircle2 size={12} className="text-emerald-500" />}
                  </label>
                  {inspectItem.audioUrlMr && (
                    <button
                      onClick={() => handleToggleAudioPreview(inspectItem.audioUrlMr, 'modal_mr')}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {audioPlayingKey === 'modal_mr' ? <Pause size={10} /> : <Play size={10} />}
                      <span>{audioPlayingKey === 'modal_mr' ? 'Pause Audio' : 'Preview Marathi Audio'}</span>
                    </button>
                  )}
                </div>
                <textarea
                  value={editMarathiText}
                  onChange={(e) => setEditMarathiText(e.target.value)}
                  placeholder="Explain in conversational Marathi..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed outline-none focus:border-indigo-500 focus:bg-white resize-none"
                />
              </div>

              {/* Status Message */}
              {saveSuccessMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleGenerateTextOnly(inspectItem)}
                    disabled={isProcessing}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles size={13} />
                    <span>AI Re-generate Texts</span>
                  </button>

                  <button
                    onClick={() => handleGenerateAudioOnly(inspectItem)}
                    disabled={isProcessing}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Mic size={13} />
                    <span>Generate Audio ({selectedVoice})</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setInspectItem(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Close
                  </button>

                  <button
                    onClick={handleSaveEditedText}
                    disabled={isSavingText}
                    className="btn-3d btn-3d-blue px-4 py-2 text-xs flex items-center gap-1.5"
                  >
                    {isSavingText ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    <span>Save Text Changes</span>
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. AUDIT HISTORY MODAL */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-[600] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 relative"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="text-indigo-600" size={18} />
                  <h3 className="text-base font-display font-black text-slate-900 dark:text-white">
                    Bulk Generation Audit Log
                  </h3>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
                {jobHistory.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No recent bulk generation jobs logged.
                  </div>
                ) : (
                  jobHistory.map(job => (
                    <div 
                      key={job.id} 
                      className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                        <span>{job.scopeDescription}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{job.timestamp}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="capitalize font-semibold text-indigo-600 dark:text-indigo-400">
                          {job.actionType === 'text_only' ? 'Text Only (EN + HI)' : job.actionType === 'audio_only' ? 'Audio Only (TTS)' : 'Full Pipeline (Both)'}
                        </span>
                        <div className="flex items-center gap-2.5">
                          <span className="text-emerald-600 font-bold">✓ {job.completed}</span>
                          {job.skipped > 0 && <span className="text-slate-400">⏭ {job.skipped}</span>}
                          {job.failed > 0 && <span className="text-rose-600 font-bold">⚠ {job.failed}</span>}
                          <span>/ {job.total}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="btn-3d btn-3d-slate px-4 py-2 text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ExplanationAudioManager;
