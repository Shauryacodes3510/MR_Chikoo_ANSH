import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { soundManager } from '../lib/sounds';
import { isStoryScreen } from '../lib/curriculumTypes';

export interface ScreenAudioState {
  audioUrl: string | null;
  narrationText: string | null;
  status: string | null;
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  progress: number; // 0 to 100
  currentTime: number; // in seconds
  duration: number; // in seconds
  volume: number; // 0 to 1
  isMuted: boolean;
  hasAudio: boolean;
  error: string | null;
}

export interface UseScreenAudioOptions {
  lessonId?: string | null;
  screenId?: string | null;
  challenge?: any;
  screenText?: string | null;
  language?: string | null; // 'en' | 'english' | 'hi' | 'hinglish' | 'mr' | 'marathi'
  autoPlay?: boolean;
  fallbackNarrations?: Record<string, any>;
  clearCacheOnLanguageChange?: boolean;
  onEnded?: () => void;
}

// In-memory module cache for student session to prevent redundant network fetches
const studentAudioCache = new Map<string, {
  url: string | null;
  text: string | null;
  status: string | null;
  language?: string;
}>();

// Helper to normalize language string to DB and UI formats
export function normalizeLanguageCode(rawLang?: string | null): { dbLang: 'en' | 'hinglish' | 'mr'; uiLang: 'english' | 'hinglish' | 'marathi' } {
  const l = (rawLang || '').toLowerCase().trim();
  if (l === 'mr' || l === 'marathi') {
    return { dbLang: 'mr', uiLang: 'marathi' };
  }
  if (l === 'hi' || l === 'hindi' || l === 'hinglish') {
    return { dbLang: 'hinglish', uiLang: 'hinglish' };
  }
  return { dbLang: 'en', uiLang: 'english' };
}

/**
 * Extracts the exact text displayed on the current lesson screen.
 * Strictly adheres to: What the student sees is exactly what is used for narration.
 * Does not rewrite, summarize, or creatively generate new text.
 */
export function extractScreenText(challenge: any, directText?: string | null, targetLang?: 'en' | 'hinglish' | 'mr' | string): string {
  if (directText && typeof directText === 'string' && directText.trim()) {
    return directText.trim();
  }

  if (!challenge) return '';

  const ch = challenge as any;

  if (!isStoryScreen(challenge)) {
    // Strictly extract ONLY the raw question/instruction from the interaction screen
    if (ch.question && typeof ch.question === 'string' && ch.question.trim()) {
      return ch.question.trim();
    }
    return '';
  }

  const rawContent = ch.contentScreen || ch.visualLessonScreen || ch.storyData || {};
  const sceneType = (rawContent.sceneType || ch.sceneType || ch.type || '').toLowerCase();

  // 1. If language-specific stored content is available in challenge
  const langKey = targetLang ? normalizeLanguageCode(targetLang).dbLang : 'en';
  if (langKey === 'mr') {
    if (ch.explanation_marathi) return ch.explanation_marathi;
    if (ch.explanation?.marathi?.text) return ch.explanation.marathi.text;
    if (ch.audioNarrations?.marathi?.text) return ch.audioNarrations.marathi.text;
    if (ch.audioNarrations?.mr?.text) return ch.audioNarrations.mr.text;
  }
  if (langKey === 'hinglish') {
    if (ch.explanation?.hinglish?.text) return ch.explanation.hinglish.text;
    if (ch.audioNarrations?.hinglish?.text) return ch.audioNarrations.hinglish.text;
    if (ch.audioNarrations?.hi?.text) return ch.audioNarrations.hi.text;
  }

  // 2. Dialogue strip scene / Dialogue screens
  const dialogueList = rawContent.dialogue || ch.dialogue || ch.dialogueMessages || ch.messages;
  if (Array.isArray(dialogueList) && dialogueList.length > 0) {
    const lines = dialogueList.map((d: any) => {
      if (typeof d === 'string') return d.trim();
      const speaker = d.speaker || d.character || d.name || '';
      const text = d.text || d.message || d.speech || d.line || '';
      return speaker ? `${speaker}: ${text}` : text;
    }).filter(Boolean);

    if (lines.length > 0) {
      return lines.join('. ');
    }
  }

  // 3. Story scene / Hero scene / Cinematic / Reading / Content screens
  const heading = rawContent.heading || ch.contentHeading || ch.heading || ch.title || '';
  const subheading = rawContent.subheading || ch.contentSubheading || ch.subheading || '';
  const contentBody = rawContent.contentBody || 
                      ch.contentBody || 
                      (typeof ch.explanation === 'string' ? ch.explanation : ch.explanation?.text) || 
                      ch.content || 
                      '';
  const highlightBox = rawContent.highlightBox || ch.highlightBox || '';
  const quote = rawContent.quote || ch.quote || '';
  const quoteAuthor = rawContent.quoteAuthor || ch.quoteAuthor || '';
  const quoteText = quote ? (quoteAuthor ? `"${quote}" - ${quoteAuthor}` : `"${quote}"`) : '';

  const parts = [
    heading,
    subheading,
    contentBody,
    highlightBox ? `Key clue: ${highlightBox}` : '',
    quoteText
  ].map(s => String(s || '').trim()).filter(Boolean);

  if (parts.length > 0) {
    return parts.join('. ').replace(/\s*\.\s*\./g, '.').trim();
  }

  // 4. Fallback to question text if provided
  if (ch.question && typeof ch.question === 'string' && ch.question.trim()) {
    return ch.question.trim();
  }

  return '';
}

// Exportable cache clearing helper for screen audio
export function clearScreenAudioCache(screenId?: string, language?: string) {
  if (!screenId && !language) {
    studentAudioCache.clear();
    return;
  }
  const dbLang = language ? normalizeLanguageCode(language).dbLang : null;
  for (const key of Array.from(studentAudioCache.keys())) {
    const matchScreen = !screenId || key.includes(screenId);
    const matchLang = !dbLang || key.endsWith(`_${dbLang}`);
    if (matchScreen && matchLang) {
      studentAudioCache.delete(key);
    }
  }
}

/**
 * High-Quality Cached Audio Hook.
 * 
 * Flow:
 * - Reads pre-generated high-quality audio URL from Supabase / lesson_screen_audio.
 * - Plays via HTMLAudioElement.
 * - Zero robotic browser speech synthesis.
 * - If audio is missing, gracefully continues without audio.
 */
export function useScreenAudio({
  lessonId,
  screenId,
  challenge,
  screenText,
  language,
  autoPlay = true,
  fallbackNarrations,
  onEnded
}: UseScreenAudioOptions) {
  const [audioState, setAudioState] = useState<ScreenAudioState>({
    audioUrl: null,
    narrationText: null,
    status: null,
    isPlaying: false,
    isPaused: false,
    isLoading: false,
    progress: 0,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    hasAudio: false,
    error: null
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeRecordKeyRef = useRef<string>('');
  const isMountedRef = useRef(true);

  // Normalize target language
  const { dbLang, uiLang } = normalizeLanguageCode(language);
  const effectiveScreenId = screenId || challenge?.id;
  const recordKey = `${lessonId || ''}_${effectiveScreenId || ''}_${dbLang}`;

  // Cleanup helper to stop & unload current audio
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
        audioRef.current.load();
      } catch {}
      audioRef.current = null;
    }
  }, []);

  // Fetch / Resolve Audio Record for current lesson + screen + language
  useEffect(() => {
    isMountedRef.current = true;
    activeRecordKeyRef.current = recordKey;

    // Immediately stop previous screen audio on screen/language change
    stopAudio();

    if (!effectiveScreenId) {
      setAudioState(prev => ({
        ...prev,
        audioUrl: null,
        narrationText: null,
        status: null,
        isPlaying: false,
        isPaused: false,
        isLoading: false,
        hasAudio: false,
        error: null
      }));
      return;
    }

    let isCancelled = false;

    const resolveAudio = async () => {
      setAudioState(prev => ({
        ...prev,
        isLoading: true,
        isPlaying: false,
        isPaused: false,
        error: null
      }));

      // 1. Check in-memory module cache first (fastest)
      if (studentAudioCache.has(recordKey)) {
        const cached = studentAudioCache.get(recordKey)!;
        if (!isCancelled && activeRecordKeyRef.current === recordKey) {
          const hasAudio = !!(cached.url && (cached.status === 'ready' || !cached.status));
          setAudioState(prev => ({
            ...prev,
            audioUrl: cached.url,
            narrationText: cached.text,
            status: cached.status,
            isLoading: false,
            hasAudio
          }));
          return;
        }
      }

      // 2. Check challenge.audioNarrations or fallbackNarrations from props
      const passedNarrations = fallbackNarrations || challenge?.audioNarrations;
      if (passedNarrations && typeof passedNarrations === 'object') {
        const candidate = passedNarrations[uiLang] || passedNarrations[dbLang];
        if (candidate?.url) {
          const item = {
            url: candidate.url,
            text: candidate.text || null,
            status: candidate.status || 'ready'
          };
          studentAudioCache.set(recordKey, item);
          if (!isCancelled && activeRecordKeyRef.current === recordKey) {
            setAudioState(prev => ({
              ...prev,
              audioUrl: item.url,
              narrationText: item.text,
              status: item.status,
              isLoading: false,
              hasAudio: true
            }));
            return;
          }
        }
      }

      // 3. Query lesson_screen_audio via API endpoint
      try {
        const params = new URLSearchParams({
          screenId: effectiveScreenId,
          ...(lessonId ? { lessonId } : {})
        });

        const res = await fetch(`/api/screen-audio?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.audioNarrations) {
            const matched = json.audioNarrations[uiLang] || json.audioNarrations[dbLang];
            if (matched?.url) {
              const item = {
                url: matched.url,
                text: matched.text || null,
                status: matched.status || 'ready'
              };
              studentAudioCache.set(recordKey, item);
              if (!isCancelled && activeRecordKeyRef.current === recordKey) {
                const hasAudio = matched.status === 'ready' || !matched.status;
                setAudioState(prev => ({
                  ...prev,
                  audioUrl: item.url,
                  narrationText: item.text,
                  status: item.status,
                  isLoading: false,
                  hasAudio
                }));
                return;
              }
            }
          }
        }
      } catch {
        // Non-blocking
      }

      // 4. Direct Supabase query to public.lesson_screen_audio if configured
      if (isSupabaseConfigured && supabase) {
        try {
          let query = supabase
            .from('lesson_screen_audio')
            .select('*')
            .eq('screen_id', effectiveScreenId)
            .eq('language', dbLang);

          if (lessonId) {
            query = query.eq('lesson_id', lessonId);
          }

          const { data, error } = await query;

          if (!error && Array.isArray(data) && data.length > 0) {
            const matched = data[0];
            if (matched && matched.audio_url) {
              const item = {
                url: matched.audio_url,
                text: matched.narration_text || null,
                status: matched.status || 'ready'
              };
              studentAudioCache.set(recordKey, item);
              if (!isCancelled && activeRecordKeyRef.current === recordKey) {
                const hasAudio = matched.status === 'ready' || !matched.status;
                setAudioState(prev => ({
                  ...prev,
                  audioUrl: item.url,
                  narrationText: item.text,
                  status: item.status,
                  isLoading: false,
                  hasAudio
                }));
                return;
              }
            }
          }
        } catch {}
      }

      // If no pre-generated audio record is found, gracefully finish without robotic speech
      if (!isCancelled && activeRecordKeyRef.current === recordKey) {
        setAudioState(prev => ({
          ...prev,
          audioUrl: null,
          narrationText: null,
          status: null,
          isLoading: false,
          hasAudio: false
        }));
      }
    };

    resolveAudio();

    return () => {
      isCancelled = true;
      stopAudio();
    };
  }, [lessonId, effectiveScreenId, dbLang, uiLang, recordKey, fallbackNarrations, challenge?.audioNarrations, stopAudio]);

  // Audio Playback effect when audioUrl becomes available or changes
  useEffect(() => {
    if (!audioState.audioUrl || !audioState.hasAudio) {
      stopAudio();
      return;
    }

    const audio = new Audio(audioState.audioUrl);
    audioRef.current = audio;
    audio.volume = audioState.volume;
    audio.muted = audioState.isMuted;

    audio.onloadedmetadata = () => {
      if (isMountedRef.current) {
        setAudioState(prev => ({
          ...prev,
          duration: audio.duration || 0,
          isLoading: false
        }));
      }
    };

    audio.ontimeupdate = () => {
      if (isMountedRef.current && audio.duration) {
        const cur = audio.currentTime || 0;
        const dur = audio.duration || 1;
        setAudioState(prev => ({
          ...prev,
          currentTime: cur,
          progress: Math.min(100, (cur / dur) * 100)
        }));
      }
    };

    audio.onplay = () => {
      if (isMountedRef.current) {
        setAudioState(prev => ({
          ...prev,
          isPlaying: true,
          isPaused: false
        }));
      }
    };

    audio.onpause = () => {
      if (isMountedRef.current) {
        setAudioState(prev => ({
          ...prev,
          isPlaying: false,
          isPaused: true
        }));
      }
    };

    audio.onended = () => {
      if (isMountedRef.current) {
        setAudioState(prev => ({
          ...prev,
          isPlaying: false,
          isPaused: false,
          progress: 100
        }));
        if (onEnded) onEnded();
      }
    };

    audio.onerror = () => {
      if (isMountedRef.current) {
        setAudioState(prev => ({
          ...prev,
          isPlaying: false,
          isPaused: false,
          isLoading: false,
          hasAudio: false,
          error: 'Audio playback failed'
        }));
      }
    };

    // Auto-play if enabled and sound/music is enabled in student settings
    if (autoPlay && soundManager.isMusicEnabled() && soundManager.isEnabled()) {
      audio.play().catch(() => {
        if (isMountedRef.current) {
          setAudioState(prev => ({ ...prev, isPlaying: false, isPaused: true }));
        }
      });
    }

    return () => {
      stopAudio();
    };
  }, [audioState.audioUrl, audioState.hasAudio, autoPlay, onEnded, stopAudio]);

  // Controller Actions
  const play = useCallback(() => {
    soundManager.play('click');
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    } else if (audioState.audioUrl) {
      const audio = new Audio(audioState.audioUrl);
      audioRef.current = audio;
      audio.volume = audioState.volume;
      audio.muted = audioState.isMuted;
      audio.play().catch(() => {});
    }
  }, [audioState.audioUrl, audioState.volume, audioState.isMuted]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      soundManager.play('click');
      audioRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current) {
      soundManager.play('click');
      audioRef.current.play().catch(() => {});
    } else {
      play();
    }
  }, [play]);

  const togglePlay = useCallback(() => {
    if (audioState.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [audioState.isPlaying, pause, play]);

  const replay = useCallback(() => {
    soundManager.play('click');
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      } catch {
        play();
      }
    } else if (audioState.audioUrl) {
      const audio = new Audio(audioState.audioUrl);
      audioRef.current = audio;
      audio.volume = audioState.volume;
      audio.muted = audioState.isMuted;
      audio.play().catch(() => {});
    }
  }, [audioState.audioUrl, audioState.volume, audioState.isMuted, play]);

  const setVolume = useCallback((newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    setAudioState(prev => ({
      ...prev,
      volume: clamped,
      isMuted: clamped === 0
    }));
  }, []);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      const nextMuted = !audioRef.current.muted;
      audioRef.current.muted = nextMuted;
      setAudioState(prev => ({
        ...prev,
        isMuted: nextMuted
      }));
    }
  }, []);

  const seek = useCallback((seconds: number) => {
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.duration, seconds));
    }
  }, []);

  return {
    ...audioState,
    dbLang,
    uiLang,
    play,
    pause,
    resume,
    replay,
    togglePlay,
    setVolume,
    toggleMute,
    seek,
    stop: stopAudio
  };
}
