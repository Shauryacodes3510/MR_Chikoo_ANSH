import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lesson } from '../lib/curriculumTypes';
import { preloadLessonAssets } from '../lib/lessonPreloader';
import { fetchLessonContentById } from '../lib/curriculumLoader';
import { getFifteenPremiumChallenges } from '../lib/premiumChallengesGenerator';
import { soundManager } from '../lib/sounds';
import { CHIKOO_CLOUD_MASCOT_URL } from './CloudTransition';

export const CHIKOO_LESSON_MASCOT_URL = CHIKOO_CLOUD_MASCOT_URL;

interface LessonTransitionProps {
  lessonId: string;
  lesson?: Lesson | null;
  onReady?: (fullLesson: Lesson) => void;
  onFinished?: () => void;
  onCancel?: () => void;
  maxTimeoutMs?: number;
}

type CloudPhase = 'idle' | 'entering' | 'covered' | 'exiting';

export const LessonTransition: React.FC<LessonTransitionProps> = ({
  lessonId,
  lesson: initialLesson,
  onReady,
  onFinished,
  onCancel,
  maxTimeoutMs = 3000
}) => {
  const [phase, setPhase] = useState<CloudPhase>('entering');
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const hasTriggeredReady = useRef(false);
  const hasTriggeredFinish = useRef(false);

  const onReadyRef = useRef(onReady);
  const onFinishedRef = useRef(onFinished);
  const onCancelRef = useRef(onCancel);
  const initialLessonRef = useRef(initialLesson);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    initialLessonRef.current = initialLesson;
  }, [initialLesson]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    let isRunning = true;
    const animate = () => {
      if (!isRunning) return;
      setDisplayProgress((prev) => {
        if (prev >= progress) return prev;
        const diff = progress - prev;
        const step = Math.max(1, Math.ceil(diff * 0.25));
        const next = Math.min(progress, prev + step);
        if (next < progress && isRunning) {
          animationFrameId = requestAnimationFrame(animate);
        }
        return next;
      });
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [progress]);

  const getStatusText = (pct: number) => {
    if (pct < 30) return 'Preparing your adventure...';
    if (pct < 80) return 'Loading exciting challenges...';
    if (pct < 100) return 'Almost ready! 🚀';
    return 'Ready to explore! ✨';
  };

  const clearAllTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  };

  const addTimer = (cb: () => void, ms: number) => {
    const timer = setTimeout(cb, ms);
    timersRef.current.push(timer);
    return timer;
  };

  useEffect(() => {
    let isMounted = true;
    hasTriggeredReady.current = false;
    hasTriggeredFinish.current = false;
    clearAllTimers();
    setError(null);
    setProgress(15);

    const runLoader = async () => {
      const requestUuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const startTimeMs = performance.now();
      const startTimeIso = new Date().toISOString();

      console.log(`[LessonTransition][${requestUuid}] 🚀 REQUEST CYCLE STARTED at ${startTimeIso}`);
      console.log(`[LessonTransition][${requestUuid}] Target Lesson ID: "${lessonId}"`);

      let fullLesson: Lesson | null = null;
      const initialLessonVal = initialLessonRef.current;

      // 1. Check if initialLesson was directly provided and valid
      if (initialLessonVal && initialLessonVal.id) {
        const endTimeMs = performance.now();
        const endTimeIso = new Date().toISOString();
        const durationMs = Math.round(endTimeMs - startTimeMs);

        console.log(`[LessonTransition][${requestUuid}] ℹ️ initialLesson provided directly via props at ${endTimeIso}`);
        fullLesson = { ...initialLessonVal };
        if (!fullLesson.challenges || fullLesson.challenges.length === 0) {
          console.warn(`[LessonTransition][${requestUuid}] ⚠️ initialLesson had 0 challenges. Generating 15 premium challenges for "${fullLesson.title}"`);
          fullLesson.challenges = getFifteenPremiumChallenges(fullLesson.id, fullLesson.title || 'AI Lesson');
        }

        const idMatch = fullLesson.id.toLowerCase() === lessonId.toLowerCase() || fullLesson.id === lessonId;
        const screenContentValid = Array.isArray(fullLesson.challenges) && fullLesson.challenges.length > 0;

        console.log(`[LessonTransition][${requestUuid}] 📊 PROPS LESSON VALIDATION RESULTS:`, {
          requestUuid,
          startTimeIso,
          responseTimeIso: endTimeIso,
          durationMs,
          targetLessonId: lessonId,
          returnedLessonId: fullLesson.id,
          idMatch,
          title: fullLesson.title,
          titleValid: !!fullLesson.title && fullLesson.title.trim().length > 0,
          screenCount: fullLesson.challenges.length,
          screenContentValid,
          screenTypes: fullLesson.challenges.map(c => c.type || 'unknown'),
          source: 'Props'
        });

        setProgress(40);
      } else {
        // 2. Fetch content via fetchLessonContentById
        try {
          console.log(`[LessonTransition][${requestUuid}] 📡 Requesting fetchLessonContentById for ID="${lessonId}"...`);
          const fetched = await fetchLessonContentById(lessonId, { requestUuid, startTimeMs });
          const endTimeMs = performance.now();
          const endTimeIso = new Date().toISOString();
          const durationMs = Math.round(endTimeMs - startTimeMs);

          fullLesson = fetched;

          if (!fullLesson.challenges || fullLesson.challenges.length === 0) {
            console.warn(`[LessonTransition][${requestUuid}] ⚠️ Fetched lesson had 0 challenges. Generating 15 premium challenges for "${fullLesson.title}"`);
            fullLesson.challenges = getFifteenPremiumChallenges(fullLesson.id, fullLesson.title || 'AI Lesson');
          }

          const idMatch = fullLesson.id.toLowerCase() === lessonId.toLowerCase() || fullLesson.id === lessonId;
          const screenContentValid = Array.isArray(fullLesson.challenges) && fullLesson.challenges.length > 0;

          console.log(`[LessonTransition][${requestUuid}] 📊 FETCHED LESSON VALIDATION RESULTS:`, {
            requestUuid,
            startTimeIso,
            responseTimeIso: endTimeIso,
            durationMs,
            targetLessonId: lessonId,
            returnedLessonId: fullLesson.id,
            idMatch,
            title: fullLesson.title,
            titleValid: !!fullLesson.title && fullLesson.title.trim().length > 0,
            screenCount: fullLesson.challenges.length,
            screenContentValid,
            screenTypes: fullLesson.challenges.map(c => c.type || 'unknown'),
            source: 'fetchLessonContentById'
          });

          setProgress(40);
        } catch (err: any) {
          const endTimeMs = performance.now();
          const endTimeIso = new Date().toISOString();
          const durationMs = Math.round(endTimeMs - startTimeMs);

          console.error(`[LessonTransition][${requestUuid}] ❌ Content fetch exception at ${endTimeIso} after ${durationMs}ms:`, err);
          fullLesson = {
            id: lessonId,
            title: lessonId.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: 'Explore and master this interactive lesson.',
            difficulty: 'Easy',
            xpReward: 50,
            challenges: getFifteenPremiumChallenges(lessonId, lessonId)
          };

          console.log(`[LessonTransition][${requestUuid}] 📊 EXCEPTION FALLBACK LESSON VALIDATION RESULTS:`, {
            requestUuid,
            startTimeIso,
            responseTimeIso: endTimeIso,
            durationMs,
            targetLessonId: lessonId,
            returnedLessonId: fullLesson.id,
            idMatch: true,
            title: fullLesson.title,
            titleValid: true,
            screenCount: fullLesson.challenges.length,
            screenContentValid: true,
            screenTypes: fullLesson.challenges.map(c => c.type || 'unknown'),
            source: 'Exception Fallback'
          });

          setProgress(40);
        }
      }

      if (!fullLesson) {
        fullLesson = {
          id: lessonId,
          title: 'AI Adventure',
          description: 'Master AI concepts through hands-on challenges.',
          difficulty: 'Easy',
          xpReward: 50,
          challenges: getFifteenPremiumChallenges(lessonId, 'AI Adventure')
        };
      }

      console.log(`[LessonTransition][${requestUuid}] 🏁 Final Resolved Lesson: ID="${fullLesson.id}", Title="${fullLesson.title}", TotalScreens=${fullLesson.challenges.length}`);

      // 2. Preload assets
      try {
        console.log(`[LessonTransition][${requestUuid}] 🖼️ Preloading assets for "${fullLesson.title}"...`);
        await preloadLessonAssets(
          fullLesson,
          (pct) => {
            if (isMounted) {
              const totalPct = 40 + (pct * 0.6);
              setProgress(Math.min(100, Math.round(totalPct)));
            }
          },
          Math.min(maxTimeoutMs, 2000)
        );
      } catch (err) {
        console.warn(`[LessonTransition][${requestUuid}] ⚠️ Non-fatal asset preload issue:`, err);
      }

      if (!isMounted) return;
      setProgress(100);

      // 3. Finalize
      console.log(`[LessonTransition][${requestUuid}] ✅ Lesson "${fullLesson.title}" (ID="${fullLesson.id}") fully ready! Invoking onReady callback.`);
      if (!hasTriggeredReady.current) {
        hasTriggeredReady.current = true;
        onReadyRef.current?.(fullLesson);
      }

      addTimer(() => {
        if (!isMounted) return;
        if (!hasTriggeredFinish.current) {
          hasTriggeredFinish.current = true;
          onFinishedRef.current?.();
          setPhase('idle');
        }
      }, 400);
    };

    runLoader();

    // Absolute failsafe timer to prevent any freeze
    const failsafeTimer = setTimeout(() => {
      if (isMounted && !hasTriggeredReady.current) {
        console.warn(`[LessonLoader] Failsafe triggered for ${lessonId}`);
        const fallbackLesson: Lesson = initialLessonRef.current || {
          id: lessonId,
          title: lessonId.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: 'Explore and master this interactive lesson.',
          difficulty: 'Easy',
          xpReward: 50,
          challenges: getFifteenPremiumChallenges(lessonId, lessonId)
        };
        hasTriggeredReady.current = true;
        onReadyRef.current?.(fallbackLesson);
        onFinishedRef.current?.();
        setPhase('idle');
      }
    }, maxTimeoutMs + 1000);

    return () => {
      isMounted = false;
      clearTimeout(failsafeTimer);
      clearAllTimers();
    };
  }, [lessonId, maxTimeoutMs]);

  if (!mounted || phase === 'idle') {
    return null;
  }

  const isCoveredOrEntering = phase === 'entering' || phase === 'covered';
  const isFullyCovered = phase === 'covered';

  const overlayContent = (
    <div 
      id="lesson-entrance-cloud-portal"
      className="fixed inset-0 z-[99999] overflow-hidden select-none pointer-events-auto flex items-center justify-center m-0 p-0"
      style={{
        width: '100vw',
        height: '100dvh',
        touchAction: 'none'
      }}
      aria-hidden="true"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: isFullyCovered ? 1 : phase === 'entering' ? 0.95 : 0
        }}
        transition={{ duration: 0.20, ease: "easeInOut" }}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, #ffffff 0%, #f0f9ff 60%, #e0f2fe 100%)' }}
      />

      <AnimatePresence>
        {isCoveredOrEntering && (
          <motion.div
            key="cloud-mascot-center"
            initial={{ opacity: 0, scale: 0.5, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.35 }}
            className="absolute z-40 flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="relative flex items-center justify-center">
              <img
                src={CHIKOO_CLOUD_MASCOT_URL}
                alt="Chikoo Space Explorer"
                referrerPolicy="no-referrer"
                draggable={false}
                className="w-28 h-28 sm:w-36 sm:h-36 object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.15)] select-none pointer-events-none"
              />
            </div>

            <div className="mt-3 flex flex-col items-center justify-center w-48 sm:w-56">
              <div className="flex items-center justify-between w-full px-1 mb-1.5 text-[11px] sm:text-xs font-black text-slate-700 select-none">
                <span className="truncate">{getStatusText(displayProgress)}</span>
                <span className="font-mono font-extrabold text-amber-600 bg-amber-100/90 px-1.5 py-0.5 rounded-md border border-amber-300/80 shadow-2xs ml-1.5 shrink-0">
                  {Math.round(displayProgress)}%
                </span>
              </div>
              <div className="w-full h-3 bg-white/95 rounded-full p-0.5 border-2 border-amber-300 shadow-inner overflow-hidden relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-500 relative overflow-hidden"
                  style={{ 
                    width: '100%',
                    transform: `scaleX(${displayProgress / 100})`,
                    transformOrigin: 'left',
                    willChange: 'transform'
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(overlayContent, document.body);
  }

  return overlayContent;
};

export default LessonTransition;
