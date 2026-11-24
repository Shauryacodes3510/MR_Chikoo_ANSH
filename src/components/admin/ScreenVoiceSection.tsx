import React, { useState, useEffect, useRef } from 'react';
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
  Wand2
} from 'lucide-react';
import { soundManager } from '../../lib/sounds';
import { supabase, isSupabaseConfigured, getAdminAuthHeaders } from '../../lib/supabase';
import { extractScreenText } from '../../hooks/useScreenAudio';

export type VoiceStatus = 'Not Generated' | 'Script Loaded' | 'Formatting' | 'Generating' | 'Ready' | 'Failed';

export interface ScreenVoiceRecord {
  text: string;
  url: string;
  hash?: string;
  duration?: number;
  ttsModel?: string;
  status?: string;
  updatedAt?: string;
}

export interface ScreenVoiceSectionProps {
  selectedScreen: any | null;
  lessonId?: string;
  lessonTitle?: string;
  onNarrationsUpdated?: (updatedNarrations: Record<string, any>) => void;
  className?: string;
}

const LANGUAGES = [
  { 
    key: 'english', 
    dbLang: 'en' as const,
    label: '🇬🇧 English', 
    desc: 'Spoken English narration from screen content'
  },
  { 
    key: 'hinglish', 
    dbLang: 'hinglish' as const,
    label: '🇮🇳 Hinglish', 
    desc: 'Spoken Hinglish narration from screen content'
  },
  { 
    key: 'marathi', 
    dbLang: 'mr' as const,
    label: '🚩 Marathi', 
    desc: 'Spoken Marathi narration from screen content'
  },
] as const;

export const ScreenVoiceSection: React.FC<ScreenVoiceSectionProps> = ({
  selectedScreen,
  lessonId = '',
  lessonTitle = '',
  onNarrationsUpdated,
  className = ''
}) => {
  // Stored voice records: { [language]: { text, url, hash, ... } }
  const [voiceRecords, setVoiceRecords] = useState<Record<string, ScreenVoiceRecord>>({});
  
  // Exact screen content / formatted spoken flow drafts (admin can review and edit before sending to TTS)
  const [scriptDrafts, setScriptDrafts] = useState<Record<string, string>>({
    english: '',
    hinglish: '',
    marathi: ''
  });

  const [loading, setLoading] = useState(false);
  const [generatingLang, setGeneratingLang] = useState<string | null>(null);
  const [formattingLang, setFormattingLang] = useState<string | null>(null);
  const [failedLangs, setFailedLangs] = useState<Record<string, string>>({});
  const [audioPlayingUrl, setAudioPlayingUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // When selectedScreen changes:
  // 1. Extract actual screen content directly from the screen data
  // 2. Load any existing generated MP3 records from Supabase / server
  useEffect(() => {
    if (!selectedScreen?.id) {
      setVoiceRecords({});
      setScriptDrafts({ english: '', hinglish: '', marathi: '' });
      setFailedLangs({});
      setGeneratingLang(null);
      setFormattingLang(null);
      if (audioRef.current) {
        audioRef.current.pause();
        setAudioPlayingUrl(null);
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      setAudioPlayingUrl(null);
    }
    setFailedLangs({});
    setGeneratingLang(null);
    setFormattingLang(null);

    // 1. Fetch exact screen content directly (source of truth: actual lesson screen)
    const enText = extractScreenText(selectedScreen, undefined, 'en');
    const hiText = extractScreenText(selectedScreen, undefined, 'hinglish');
    const mrText = extractScreenText(selectedScreen, undefined, 'mr');

    setScriptDrafts({
      english: enText || '',
      hinglish: hiText || '',
      marathi: mrText || ''
    });

    // Populate initial voice records if already present on the selectedScreen
    if (selectedScreen.audioNarrations && typeof selectedScreen.audioNarrations === 'object') {
      setVoiceRecords({ ...selectedScreen.audioNarrations });
      if (selectedScreen.audioNarrations.english?.text) {
        setScriptDrafts(prev => ({ ...prev, english: selectedScreen.audioNarrations.english.text }));
      }
      if (selectedScreen.audioNarrations.hinglish?.text) {
        setScriptDrafts(prev => ({ ...prev, hinglish: selectedScreen.audioNarrations.hinglish.text }));
      }
      if (selectedScreen.audioNarrations.marathi?.text) {
        setScriptDrafts(prev => ({ ...prev, marathi: selectedScreen.audioNarrations.marathi.text }));
      }
    }

    // 2. Fetch existing saved voice records from server / database
    let isCancelled = false;
    const fetchVoiceRecords = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          screenId: selectedScreen.id,
          ...(lessonId ? { lessonId } : {})
        });

        const res = await fetch(`/api/admin/screen-audio?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (!isCancelled && json.success && json.audioNarrations) {
            setVoiceRecords(prev => ({
              ...prev,
              ...json.audioNarrations
            }));
            setScriptDrafts(prev => ({
              english: json.audioNarrations.english?.text || prev.english,
              hinglish: json.audioNarrations.hinglish?.text || prev.hinglish,
              marathi: json.audioNarrations.marathi?.text || prev.marathi
            }));
            setLoading(false);
            return;
          }
        }

        // Direct Supabase fallback
        if (isSupabaseConfigured && supabase) {
          let query = supabase
            .from('lesson_screen_audio')
            .select('*')
            .eq('screen_id', selectedScreen.id);

          if (lessonId) {
            query = query.eq('lesson_id', lessonId);
          }

          const { data, error } = await query;
          if (!error && Array.isArray(data) && !isCancelled) {
            const mapped: Record<string, ScreenVoiceRecord> = {};
            for (const row of data) {
              const rawL = (row.language || '').toLowerCase().trim();
              const uiLang = (rawL === 'en' || rawL === 'english') ? 'english' 
                : (rawL === 'mr' || rawL === 'marathi') ? 'marathi' 
                : 'hinglish';
              mapped[uiLang] = {
                text: row.narration_text,
                url: row.audio_url,
                hash: row.text_hash,
                duration: row.duration_ms,
                ttsModel: row.tts_model,
                status: row.status,
                updatedAt: row.updated_at
              };
            }
            setVoiceRecords(prev => ({ ...prev, ...mapped }));
          }
        }
      } catch (err) {
        console.warn('[ScreenVoiceSection] Load records error:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchVoiceRecords();

    return () => {
      isCancelled = true;
    };
  }, [selectedScreen?.id, lessonId]);

  const getStatus = (langKey: string): VoiceStatus => {
    if (generatingLang === langKey || generatingLang === 'all') {
      return 'Generating';
    }
    if (formattingLang === langKey || formattingLang === 'all') {
      return 'Formatting';
    }
    if (failedLangs[langKey]) {
      return 'Failed';
    }
    const record = voiceRecords[langKey];
    if (record?.url) {
      return 'Ready';
    }
    if (scriptDrafts[langKey]?.trim()) {
      return 'Script Loaded';
    }
    return 'Not Generated';
  };

  // Playback preview for pre-generated MP3
  const handleTogglePreview = (url: string) => {
    soundManager.play('click');
    if (!url) return;

    if (audioPlayingUrl === url) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setAudioPlayingUrl(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    setAudioPlayingUrl(url);

    audio.onended = () => setAudioPlayingUrl(null);
    audio.onerror = () => setAudioPlayingUrl(null);

    audio.play().catch(() => setAudioPlayingUrl(null));
  };

  // Format screen content into natural, engaging spoken narration (preserves exact facts, characters, and concepts)
  const handleFormatSpokenNarration = async (targetLang: 'english' | 'hinglish' | 'marathi' | 'all') => {
    if (!selectedScreen || !selectedScreen.id) return;
    soundManager.play('click');

    setFormattingLang(targetLang);
    setFailedLangs(prev => {
      const next = { ...prev };
      if (targetLang === 'all') {
        delete next.english;
        delete next.hinglish;
        delete next.marathi;
      } else {
        delete next[targetLang];
      }
      return next;
    });

    try {
      const screenText = extractScreenText(selectedScreen);
      const payload = {
        screenText,
        screenData: {
          id: selectedScreen.id,
          type: selectedScreen.type,
          heading: selectedScreen.heading || selectedScreen.contentHeading || selectedScreen.question || '',
          subheading: selectedScreen.subheading || selectedScreen.contentSubheading || '',
          contentBody: selectedScreen.contentBody || selectedScreen.content || '',
          highlightBox: selectedScreen.highlightBox || '',
          quote: selectedScreen.quote || '',
          quoteAuthor: selectedScreen.quoteAuthor || ''
        },
        lessonTitle: lessonTitle || 'Lesson',
        targetLanguage: targetLang
      };

      const headers = await getAdminAuthHeaders();
      const res = await fetch('/api/admin/format-screen-narration', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Formatting failed with status ${res.status}`);
      }

      const data = await res.json();
      if (!data.success || !data.narrations) {
        throw new Error(data.error || 'Formatting failed');
      }

      setScriptDrafts(prev => {
        const next = { ...prev };
        if (targetLang === 'all') {
          if (data.narrations.english) next.english = data.narrations.english;
          if (data.narrations.hinglish) next.hinglish = data.narrations.hinglish;
          if (data.narrations.marathi) next.marathi = data.narrations.marathi;
        } else if (data.narrations[targetLang]) {
          next[targetLang] = data.narrations[targetLang];
        }
        return next;
      });

      soundManager.play('complete');
    } catch (err: any) {
      console.error('[Formatting Narration Error]:', err);
      soundManager.play('incorrect');
      const errMsg = err.message || 'Formatting failed';
      setFailedLangs(prev => {
        if (targetLang === 'all') {
          return { ...prev, english: errMsg, hinglish: errMsg, marathi: errMsg };
        }
        return { ...prev, [targetLang]: errMsg };
      });
    } finally {
      setFormattingLang(null);
    }
  };

  // Generate High-Quality TTS MP3 and upload to Supabase Storage: story_audio bucket
  const handleGenerateVoice = async (targetLang: 'english' | 'hinglish' | 'marathi' | 'all') => {
    if (!selectedScreen || !selectedScreen.id) return;
    soundManager.play('click');

    setGeneratingLang(targetLang);
    setFailedLangs(prev => {
      const next = { ...prev };
      if (targetLang === 'all') {
        delete next.english;
        delete next.hinglish;
        delete next.marathi;
      } else {
        delete next[targetLang];
      }
      return next;
    });

    try {
      const approvedTexts = {
        english: scriptDrafts.english?.trim() || '',
        hinglish: scriptDrafts.hinglish?.trim() || '',
        marathi: scriptDrafts.marathi?.trim() || ''
      };

      const payload = {
        lessonId: lessonId || 'lesson',
        screenId: selectedScreen.id,
        screenData: {
          id: selectedScreen.id,
          type: selectedScreen.type,
          audioNarrations: voiceRecords
        },
        targetLanguage: targetLang,
        approvedTexts,
        approvedText: targetLang !== 'all' ? approvedTexts[targetLang] : undefined
      };

      const headers = await getAdminAuthHeaders();
      const res = await fetch('/api/admin/generate-screen-narration', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Voice generation failed with status ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Voice generation failed');
      }

      if (data.audioNarrations) {
        setVoiceRecords(prev => ({
          ...prev,
          ...data.audioNarrations
        }));

        if (onNarrationsUpdated) {
          onNarrationsUpdated(data.audioNarrations);
        }
      }

      soundManager.play('complete');
    } catch (err: any) {
      console.error('[Voice Generation Failed]:', err);
      soundManager.play('incorrect');
      const errMsg = err.message || 'Generation failed';
      setFailedLangs(prev => {
        if (targetLang === 'all') {
          return { ...prev, english: errMsg, hinglish: errMsg, marathi: errMsg };
        }
        return { ...prev, [targetLang]: errMsg };
      });
    } finally {
      setGeneratingLang(null);
    }
  };

  if (!selectedScreen) return null;

  const isGenerating = generatingLang !== null;
  const isFormatting = formattingLang !== null;

  return (
    <div className={`bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 border-2 border-indigo-200/90 rounded-2xl p-4 shadow-xs space-y-3.5 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-indigo-100">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Volume2 size={14} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1 font-display">
                🔊 Screen Voice Narration
              </h4>
              <span className="text-[8.5px] font-mono font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded uppercase shrink-0">
                ID: {selectedScreen.id}
              </span>
              <span className="text-[8px] font-bold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded uppercase shrink-0">
                {selectedScreen.type || 'screen'}
              </span>
            </div>
            <p className="text-[9px] text-slate-500 font-medium truncate mt-0.5">
              Flow: <span className="font-semibold text-indigo-700">Screen Content → Spoken Flow → High-Quality Studio TTS</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          {/* 1. Format Spoken Narration (All) */}
          <button
            type="button"
            disabled={isGenerating || isFormatting}
            onClick={() => handleFormatSpokenNarration('all')}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-indigo-700 font-bold text-[9.5px] rounded-lg border border-indigo-200 transition-all shadow-3xs flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
            title="Convert raw screen content into natural, engaging spoken narration (preserves exact facts, characters, and concepts)"
          >
            {formattingLang === 'all' ? (
              <>
                <Loader2 size={10} className="animate-spin text-indigo-600" />
                <span>Formatting...</span>
              </>
            ) : (
              <>
                <Wand2 size={10} />
                <span>✨ Spoken Flow (All)</span>
              </>
            )}
          </button>

          {/* 2. Generate All Studio MP3 Audio */}
          <button
            type="button"
            disabled={isGenerating || isFormatting}
            onClick={() => handleGenerateVoice('all')}
            className="px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 disabled:opacity-50 text-white font-black text-[9.5px] rounded-lg shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
            title="Generate and cache high-quality MP3 audio in Supabase Storage for English, Hinglish, and Marathi"
          >
            {generatingLang === 'all' ? (
              <>
                <Loader2 size={10} className="animate-spin" />
                <span>Generating All...</span>
              </>
            ) : (
              <>
                <Sparkles size={10} />
                <span>Generate All Audio</span>
              </>
            )}
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-1.5 text-[9.5px] font-bold text-indigo-600 bg-indigo-50/50 rounded-lg">
          <Loader2 size={11} className="animate-spin" />
          <span>Loading screen voice records...</span>
        </div>
      )}

      {/* Screen Content Review & Voice Generator Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs table-auto">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[9px] uppercase font-black tracking-wider text-slate-500">
                <th className="py-2 px-2.5 w-28 shrink-0">Language</th>
                <th className="py-2 px-2.5 min-w-[220px]">Spoken Narration (Review & Edit)</th>
                <th className="py-2 px-2.5 w-36 sm:w-48 text-right">Voice Audio & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {LANGUAGES.map(({ key, label, desc }) => {
                const status = getStatus(key);
                const record = voiceRecords[key];
                const hasAudio = !!record?.url;
                const isPlaying = audioPlayingUrl === record?.url;
                const isGeneratingThis = generatingLang === key || generatingLang === 'all';
                const isFormattingThis = formattingLang === key || formattingLang === 'all';
                const draftText = scriptDrafts[key] ?? '';

                return (
                  <tr key={key} className="hover:bg-slate-50/60 transition-colors align-top">
                    {/* Language Column */}
                    <td className="py-2 px-2.5">
                      <div className="space-y-1">
                        <span className="font-extrabold text-slate-800 text-[10.5px] block truncate">
                          {label}
                        </span>
                        
                        {/* Status Badge */}
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`text-[8px] font-black px-1.5 py-0.5 rounded inline-flex items-center gap-0.5 uppercase tracking-wide ${
                              status === 'Ready'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : status === 'Generating'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse'
                                : status === 'Formatting'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                                : status === 'Script Loaded'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : status === 'Failed'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {status === 'Ready' && <CheckCircle2 size={8} />}
                            {status === 'Generating' && <Loader2 size={8} className="animate-spin" />}
                            {status === 'Formatting' && <Loader2 size={8} className="animate-spin" />}
                            {status === 'Script Loaded' && <FileText size={8} />}
                            {status === 'Failed' && <AlertCircle size={8} />}
                            {status}
                          </span>

                          {/* Fallback Model Unobtrusive Indicator */}
                          {status === 'Ready' && record?.ttsModel === 'gemini-3.8-flash-tts' && (
                            <span 
                              className="text-[7.5px] font-bold text-amber-700 bg-amber-50/90 border border-amber-250 rounded px-1.5 py-0.5 inline-block leading-tight"
                              title="Generated using gemini-3.8-flash-tts because Gemini 3.1 quota/rate-limit was reached"
                            >
                              3.1 quota reached — generated with 3.8
                            </span>
                          )}
                          {status === 'Ready' && record?.ttsModel === 'gemini-3.1-flash-tts-preview' && (
                            <span 
                              className="text-[7.5px] font-semibold text-slate-500 bg-slate-100 rounded px-1.5 py-0.5 inline-block leading-tight"
                              title="Generated using primary model: gemini-3.1-flash-tts-preview"
                            >
                              Primary (3.1)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Spoken Narration Review Column */}
                    <td className="py-2 px-2.5">
                      <div className="space-y-1">
                        <textarea
                          rows={2}
                          value={draftText}
                          onChange={(e) => {
                            const newText = e.target.value;
                            setScriptDrafts(prev => ({ ...prev, [key]: newText }));
                          }}
                          placeholder={`Enter ${label} screen text for TTS narration...`}
                          className="w-full text-[9.5px] bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-lg p-1.5 font-medium text-slate-800 leading-snug transition-all outline-none resize-none"
                        />

                        <div className="flex items-center justify-between text-[8px] text-slate-400 gap-1 flex-wrap">
                          <span>{draftText.length} characters</span>
                          
                          <div className="flex items-center gap-2">
                            {/* Format Spoken Flow for this language */}
                            <button
                              type="button"
                              disabled={isGenerating || isFormatting}
                              onClick={() => handleFormatSpokenNarration(key)}
                              className="text-indigo-600 hover:text-indigo-800 hover:underline font-bold cursor-pointer flex items-center gap-0.5 disabled:opacity-40"
                              title="Format into natural spoken narration flow"
                            >
                              {isFormattingThis ? (
                                <>
                                  <Loader2 size={8} className="animate-spin" />
                                  <span>Formatting...</span>
                                </>
                              ) : (
                                <>
                                  <Wand2 size={8} />
                                  <span>✨ Spoken Flow</span>
                                </>
                              )}
                            </button>

                            {/* Reset to Raw Screen Text */}
                            <button
                              type="button"
                              onClick={() => {
                                const fetched = extractScreenText(selectedScreen, undefined, key);
                                setScriptDrafts(prev => ({ ...prev, [key]: fetched }));
                              }}
                              className="text-slate-500 hover:text-slate-700 hover:underline cursor-pointer flex items-center gap-0.5"
                              title="Reset to raw text on screen"
                            >
                              <RefreshCw size={8} />
                              <span>Raw Text</span>
                            </button>
                          </div>
                        </div>

                        {failedLangs[key] && (
                          <p className="text-[8px] text-rose-600 font-bold bg-rose-50 p-1 rounded border border-rose-200">
                            {failedLangs[key]}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Audio & Actions Column */}
                    <td className="py-2 px-2.5 text-right">
                      <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1">
                        {/* Play Saved MP3 */}
                        {hasAudio && (
                          <button
                            type="button"
                            onClick={() => handleTogglePreview(record.url)}
                            className={`py-1 px-2 rounded-lg text-[9px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 ${
                              isPlaying
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                            }`}
                            title={`Preview ${label} Studio MP3`}
                          >
                            {isPlaying ? (
                              <>
                                <Pause size={9} />
                                <span>Playing</span>
                              </>
                            ) : (
                              <>
                                <Play size={9} className="fill-current" />
                                <span>▶ Play</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Generate Studio MP3 */}
                        <button
                          type="button"
                          disabled={isGenerating || isFormatting || !draftText.trim()}
                          onClick={() => handleGenerateVoice(key)}
                          className={`py-1 px-2 rounded-lg text-[9.5px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 shrink-0 ${
                            hasAudio
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-3xs'
                          }`}
                          title={hasAudio ? `Regenerate ${label} Studio MP3` : `Generate ${label} Studio MP3`}
                        >
                          {isGeneratingThis ? (
                            <>
                              <Loader2 size={9} className="animate-spin" />
                              <span>Generating...</span>
                            </>
                          ) : hasAudio ? (
                            <>
                              <RefreshCw size={9} />
                              <span>Regen MP3</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={9} />
                              <span>Generate MP3</span>
                            </>
                          )}
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
    </div>
  );
};

export default ScreenVoiceSection;
