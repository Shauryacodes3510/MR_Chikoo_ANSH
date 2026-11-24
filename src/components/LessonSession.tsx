import { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Star, Trophy, Zap, Flame, Music, Volume2, Loader2 } from 'lucide-react';
import { 
  Lesson, 
  Challenge, 
  isInteractiveScreen, 
  isStoryScreen, 
  shouldUseCloudTransition 
} from '../lib/content';
import { LanguageSelector } from './LanguageSelector';
import { useTranslation } from '../lib/translation/TranslationContext';
import { domTranslator } from '../lib/translation/domTranslator';
import { preloadNextChallengeAssets, preloadChallengeAssets } from '../lib/lessonPreloader';
import { CloudTransition } from './CloudTransition';
import chikooSneak from '@/Aibo_sneak.webp';
import EnergyIndicator from './ui/EnergyIndicator';
import ChestIcon from './ui/ChestIcon';
import SpotTheAI from './exercises/SpotTheAI';
import AnalogyCard from './exercises/AnalogyCard';
import DragAndDrop from './exercises/DragAndDrop';
import FillInBlank from './exercises/FillInBlank';
import MatchPairs from './exercises/MatchPairs';
import SortSequence from './exercises/SortSequence';
import BuildAConcept from './exercises/BuildAConcept';
import ScenarioQuest from './exercises/ScenarioQuest';
import RapidFire from './exercises/RapidFire';
import BeforeAfterExperiment from './exercises/BeforeAfterExperiment';
import MysteryConcept from './exercises/MysteryConcept';
import StepDebugger from './exercises/StepDebugger';
import ArgumentBuilder from './exercises/ArgumentBuilder';
import LinkBuilder from './exercises/LinkBuilder';
import TapRightAnswer from './exercises/TapRightAnswer';
import OpenResponse from './exercises/OpenResponse';
import ImageReveal from './exercises/ImageReveal';
import AIVsHuman from './exercises/AIVsHuman';
import TapCorrectArea from './exercises/TapCorrectArea';
import MemoryFlipCards from './exercises/MemoryFlipCards';
import EmojiConcepts from './exercises/EmojiConcepts';
import AchievementDiscovery from './exercises/AchievementDiscovery';
import AIToolPicker from './exercises/AIToolPicker';
import PromptBattle from './exercises/PromptBattle';
import { 
  MainLessonCompletionScreen, 
  isInteractiveCScreen, 
  CHIKOO_INTERACTIVE_COMPLETION_MASCOT_URL, 
  CHIKOO_COMPLETION_MASCOT_URL 
} from './MainLessonCompletionScreen';
import BeforeAfterAI from './exercises/BeforeAfterAI';
import AIForSchool from './exercises/AIForSchool';
import ToolMatch from './exercises/ToolMatch';
import ResultRanker from './exercises/ResultRanker';
import PromptFixer from './exercises/PromptFixer';
import AIMythFact from './exercises/AIMythFact';
import StudentMission from './exercises/StudentMission';
import DailyLifeAI from './exercises/DailyLifeAI';
import AIPrediction from './exercises/AIPrediction';
import WhichOutputBetter from './exercises/WhichOutputBetter';
import AIAssistantBuilder from './exercises/AIAssistantBuilder';
import HiddenAI from './exercises/HiddenAI';
import MemeScreen from './exercises/MemeScreen';
import GIFExplainer from './exercises/GIFExplainer';
import ComicStory from './exercises/ComicStory';
import FunFact from './exercises/FunFact';
import VisualAnalogy from './exercises/VisualAnalogy';
import ImageExplainer from './exercises/ImageExplainer';
import AIAroundYou from './exercises/AIAroundYou';
import MythBuster from './exercises/MythBuster';
import BeforeAfterStory from './exercises/BeforeAfterStory';
import StudentStory from './exercises/StudentStory';
import InteractiveReveal from './exercises/InteractiveReveal';
import WhyShouldICare from './exercises/WhyShouldICare';
import VisualLessonScreen from './exercises/VisualLessonScreen';
import {
  C7SequenceBuilder,
  C8TapCorrectObject,
  C9TrueFalse,
  C10SwipeLeftRight,
  C11ImageClassification,
  C12LabelDiagram,
  C13HotspotQuestion,
  C15DragToCompleteDiagram,
  C16EliminateWrongAnswers,
  C17ArrangeImages,
  C18AudioQuiz
} from './exercises/CategoryCExercises';
import { generateAdaptiveSession, UserPerformance } from '../lib/sessionGenerator';
import { soundManager, enterFullscreen, exitFullscreen, isStorylineLesson } from '../lib/sounds';
import ChikooExplanationOverlay from './ChikooExplanationOverlay';
import { useScreenAudio } from '../hooks/useScreenAudio';

// Memoize exercise components to prevent re-renders when parent state (progress, etc) changes
const MemoizedDragAndDrop = memo(DragAndDrop);
const MemoizedBuildAConcept = memo(BuildAConcept);
const MemoizedSortSequence = memo(SortSequence);
const MemoizedMatchPairs = memo(MatchPairs);

interface LessonSessionProps {
  lesson: Lesson;
  performance: UserPerformance;
  onClose: () => void;
  onComplete: (xpEarned: number, accuracy: number, finalStreak: number) => void;
  onStreakRestore?: (amount: number, streak: number) => void;
  onQuestionAnswered?: (isCorrect: boolean) => void;
  energy?: number;
  nextEnergyIn?: number | null;
}

const POSITIVE_PHRASES = ['Bravo!', 'Correct!', 'Kudos!', 'Brilliant!', 'Amazing!', 'Spot On!', 'Keep it up!'];

const PURE_READING_TYPES = [
  'content_screen',
  'contentScreen',
  'visual_lesson_screen',
  'story_scene',
  'hero_scene',
  'dialogue_strip_scene',
  'cinematic_scene',
  'story_intro',
  'story_outro',
  'celebration_scene',
  'new_concept',
  'concept_screen',
  'concept_intro',
  'concept_explainer',
  'meme_screen',
  'gif_explainer',
  'comic_story',
  'fun_fact',
  'visual_analogy',
  'image_explainer',
  'ai_around_you',
  'before_after_story',
  'student_story',
  'interactive_reveal',
  'why_should_i_care',
  'surprise'
];

export const isReadingChallenge = (challenge?: any): boolean => {
  if (!challenge) return false;
  const rawType = challenge.type || '';
  const t = String(rawType).toLowerCase();

  // Interactive challenge types MUST NEVER be treated as reading screens
  const interactiveTypes = [
    'mcq', 'fill_blank', 'true_false', 'matching', 'drag_drop', 'image_quiz',
    'challenge', 'practice', 'sentence_builder',
    'c1_multiple_choice', 'c2_fill_in_blank', 'c3_sentence_builder', 'c4_concept_matcher',
    'c5_bucket_sort', 'c6_timeline_sort', 'c7_sequence_builder', 'c8_tap_correct_object',
    'c9_true_false', 'c10_swipe_left_right', 'c11_image_classification', 'c12_label_diagram',
    'c13_hotspot_question', 'c14_memory_flip_cards', 'c15_drag_complete_diagram',
    'c16_eliminate_wrong', 'c17_arrange_images', 'c18_audio_quiz', 'multiple_choice',
    'match_pairs', 'fill_in_blank', 'build_concept', 'mystery_concept', 'emoji_concepts',
    'sort_sequence', 'rapid_fire', 'tool_match', 'link_builder', 'drag_and_drop',
    'tap_right_answer', 'tap_correct_area', 'step_debugger', 'open_response',
    'ai_myth_fact', 'myth_buster', 'ai_vs_human', 'ai_tool_picker', 'spot_the_ai',
    'truth_or_hype', 'model_playground', 'prompt_fixer', 'concept_matcher'
  ];

  if (interactiveTypes.includes(rawType) || interactiveTypes.includes(t)) {
    return false;
  }

  // If challenge has interactive pairs, options, chips, items, or buckets, it's NOT a reading screen
  if (
    (Array.isArray(challenge.pairs) && challenge.pairs.length > 0) ||
    (Array.isArray(challenge.matchingPairs) && challenge.matchingPairs.length > 0) ||
    (Array.isArray(challenge.conceptPairs) && challenge.conceptPairs.length > 0) ||
    (Array.isArray(challenge.chipsCorrect) && challenge.chipsCorrect.length > 0) ||
    challenge.mystery ||
    challenge.linkBuilder
  ) {
    return false;
  }

  return (
    PURE_READING_TYPES.includes(rawType) ||
    PURE_READING_TYPES.includes(t) ||
    t === 'concept_screen' ||
    t === 'concept_intro' ||
    t === 'concept_explainer' ||
    t.includes('content') ||
    t.includes('reading') ||
    t.includes('story') ||
    t.includes('visual') ||
    !!challenge.contentScreen
  );
};

export default function LessonSession({ 
  lesson, 
  performance, 
  onClose, 
  onComplete, 
  onStreakRestore, 
  onQuestionAnswered,
  energy = 25,
  nextEnergyIn = null
}: LessonSessionProps) {
  // Generate challenges once when the session starts to prevent re-shuffling on every render
  const [adaptiveChallenges] = useState(() => {
    console.log(`[LessonSession] Initializing session for Lesson ID="${lesson?.id}", Title="${lesson?.title}", BaseChallengesCount=${lesson?.challenges?.length || 0}`);
    const raw = generateAdaptiveSession(lesson, performance);
    const filtered = raw.filter(c => c && c.type !== 'achievement_discovery');
    const safeList = filtered.length > 0 
      ? filtered 
      : lesson.challenges.filter(c => c && c.type !== 'achievement_discovery');
    const idMap = new Map<string, number>();
    const sanitized = safeList.map((c, i) => {
      const baseId = c.id || `ch_${i}`;
      const count = idMap.get(baseId) || 0;
      idMap.set(baseId, count + 1);
      return {
        ...c,
        id: count === 0 ? baseId : `${baseId}_${count}_${i}`
      };
    });

    console.log(`[LessonSession] Final active challenges count=${sanitized.length} for Lesson "${lesson?.title}"`);
    console.log(`[LessonSession] Challenge types:`, sanitized.map(c => c.type || 'unknown'));

    if (process.env.NODE_ENV !== 'production') {
      const seenKeys = new Set<string>();
      sanitized.forEach((ch, idx) => {
        const key = ch.id || `${lesson.id}-${idx}`;
        if (seenKeys.has(key)) {
          console.warn(
            `Duplicate lesson screen key detected: ${key}\nLesson: ${lesson.id}\nScreen index: ${idx}`
          );
        }
        seenKeys.add(key);
      });
    }

    return sanitized;
  });

  useEffect(() => {
    console.log(`[CHALLENGE PACK] Pack ID: ${lesson.id} | Configured questions: ${lesson.challenges.length} | Fetched questions: ${lesson.challenges.length} | Session questions: ${adaptiveChallenges.length} | Rendered questions: ${adaptiveChallenges.length}`);
    if (lesson.challenges.length !== adaptiveChallenges.length) {
      console.warn(`[CHALLENGE PACK AUDIT MISMATCH] Pack ID: ${lesson.id} has mismatch! Configured: ${lesson.challenges.length} Fetched: ${lesson.challenges.length} Session: ${adaptiveChallenges.length} Rendered: ${adaptiveChallenges.length}. This should only happen for non-challenge adaptive sessions.`);
    }
  }, [lesson, adaptiveChallenges]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [positiveFeedback, setPositiveFeedback] = useState('Well Done!');
  const [progress, setProgress] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [attempts, setAttempts] = useState<{ [index: number]: number }>({});
  const [sessionStreak, setSessionStreak] = useState(0);
  const [maxSessionStreak, setMaxSessionStreak] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showRapidFireWarning, setShowRapidFireWarning] = useState(false);
  const [hasStartedRapidFire, setHasStartedRapidFire] = useState(false);
  const [isSessionFinished, setIsSessionFinished] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pendingIndexRef = useRef<number | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [userComment, setUserComment] = useState("");

  const [displayCookies, setDisplayCookies] = useState(0);
  const [displayAccuracy, setDisplayAccuracy] = useState(0);
  const [displayStreak, setDisplayStreak] = useState(0);

  const { language } = useTranslation();
  const [ttsLanguage, setTtsLanguage] = useState<string>(() => language || 'en');

  // Keep ttsLanguage synchronized if UI language changes, while allowing independent TTS language switching
  useEffect(() => {
    if (language) {
      setTtsLanguage(language);
    }
  }, [language]);

  const currentChallenge = adaptiveChallenges[currentIndex];

  // Direct Screen-Text Voice Narration hook (speaks exact displayed text directly without any LLM rewriting)
  const isCurrentScreenStory = isStoryScreen(currentChallenge);

  const screenAudio = useScreenAudio({
    lessonId: lesson.id,
    screenId: currentChallenge?.id,
    challenge: currentChallenge,
    language: ttsLanguage,
    autoPlay: isCurrentScreenStory
  });

  // Typewriter logic for questions
  const [displayedQuestion, setDisplayedQuestion] = useState("");
  const [isQuestionTypingComplete, setIsQuestionTypingComplete] = useState(false);

  useEffect(() => {
    const activeChallenge = adaptiveChallenges[currentIndex];
    if (!activeChallenge?.question || isReadingChallenge(activeChallenge)) {
      setDisplayedQuestion(activeChallenge?.question || "");
      setIsQuestionTypingComplete(true);
      return;
    }

    const fullText = activeChallenge.question;
    setDisplayedQuestion("");
    setIsQuestionTypingComplete(false);

    let i = 0;
    let timeoutId: any;

    const typeCharacter = () => {
      if (i >= fullText.length) {
        setIsQuestionTypingComplete(true);
        return;
      }

      const currentChar = fullText[i];
      setDisplayedQuestion((prev) => prev + currentChar);
      i++;

      // Natural speed variation: standard letters are printed with short random jitter,
      // but punctuation marks introduce a dramatic, professional cadence pause.
      let nextDelay = 15 + Math.random() * 20; // 15ms - 35ms standard jitter

      if (currentChar === ',' || currentChar === ';') {
        nextDelay = 180; // short pause for mid-sentence punctuation
      } else if (currentChar === '.' || currentChar === '?' || currentChar === '!') {
        nextDelay = 350; // slightly longer pause at the end of a sentence
      } else if (currentChar === ' ') {
        nextDelay = 25 + Math.random() * 10; // word boundaries feel slightly slower/organic
      }

      timeoutId = setTimeout(typeCharacter, nextDelay);
    };

    // Kickstart recursive timeouts
    timeoutId = setTimeout(typeCharacter, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [currentIndex, adaptiveChallenges]);

  // Automatically trigger dynamic on-screen translation for all lesson content (questions, options, explanations, prompts)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      domTranslator.debouncedTranslateScreen(15);
    }
  }, [currentIndex, isQuestionTypingComplete, showExplanation, feedback, displayedQuestion]);

  const [isMusicEnabled, setIsMusicEnabled] = useState(() => soundManager.isMusicEnabled());

  useEffect(() => {
    const unsubscribe = soundManager.subscribe(() => {
      setIsMusicEnabled(soundManager.isMusicEnabled());
    });
    return unsubscribe;
  }, []);

  // Manage Chikoo background lesson music lifecycle for storyline lessons
  useEffect(() => {
    const isStory = isStorylineLesson(lesson);
    if (isStory && !isSessionFinished) {
      soundManager.startLessonMusic(lesson?.id);
    } else {
      soundManager.stopLessonMusic(true);
    }

    return () => {
      soundManager.stopLessonMusic(true);
    };
  }, [lesson, isSessionFinished]);

  // Completion submission lock to prevent duplicate completion events
  const isCompletingRef = useRef(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Synchronized count-up animation for lesson completion metrics
  useEffect(() => {
    if (isSessionFinished) {
      // Clear any remaining in-lesson timers immediately
      if (autoContinueTimerRef.current) {
        clearTimeout(autoContinueTimerRef.current);
        autoContinueTimerRef.current = null;
      }
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = null;
      }

      const finalAccuracy = correctCount / adaptiveChallenges.length;
      const accuracyPct = isNaN(finalAccuracy) ? 100 : Math.round(finalAccuracy * 100);
      const isChallengeOrGuardian = lesson.isChallenge || lesson.isBonus;
      const didPass = !isChallengeOrGuardian || finalAccuracy >= 0.8;
      
      if (didPass) {
        soundManager.play('complete');
      } else {
        soundManager.play('incorrect');
      }

      const configuredReward = Number(lesson.xpReward || (lesson as any).xp_reward || 100);
      const targetCookies = configuredReward;
      const targetAccuracy = accuracyPct;
      const targetStreak = maxSessionStreak || 1;

      const prefersReducedMotion = typeof window !== 'undefined' && 
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

      if (prefersReducedMotion) {
        setDisplayCookies(targetCookies);
        setDisplayAccuracy(targetAccuracy);
        setDisplayStreak(targetStreak);
        return;
      }

      // Consolidated single count-up animation loop for lesson completion metrics
      const duration = 1200; // ms
      const startTime = window.performance.now();

      let animFrameId: number;
      const updateMetrics = (now: number) => {
        const elapsed = now - startTime;
        const progressPct = Math.min(elapsed / duration, 1);
        const easedPct = progressPct * (2 - progressPct); // easeOutQuad

        setDisplayCookies(Math.floor(easedPct * targetCookies));
        setDisplayAccuracy(Math.floor(progressPct * targetAccuracy));
        setDisplayStreak(Math.floor(progressPct * targetStreak));

        if (progressPct < 1) {
          animFrameId = requestAnimationFrame(updateMetrics);
        }
      };
      animFrameId = requestAnimationFrame(updateMetrics);

      return () => {
        if (animFrameId) {
          cancelAnimationFrame(animFrameId);
        }
      };
    }
  }, [isSessionFinished, xpEarned, lesson.xpReward, correctCount, adaptiveChallenges.length, maxSessionStreak]);

  const autoContinueTimerRef = useRef<any>(null);
  const feedbackTimerRef = useRef<any>(null);

  // Automatically translate dynamic lesson interactions and completion screens
  useEffect(() => {
    if (domTranslator.getActiveLanguage() !== 'en') {
      domTranslator.debouncedTranslateScreen(40);
    }
  }, [currentIndex, isChecked, isSessionFinished, showExplanation, showRapidFireWarning]);

  useEffect(() => {
    if (lesson.id.startsWith('practice_')) {
      const prevPrimary = document.documentElement.style.getPropertyValue('--theme-primary') || '#2196f3';
      const prevSecondary = document.documentElement.style.getPropertyValue('--theme-secondary') || '#e3f2fd';
      const prevShadow = document.documentElement.style.getPropertyValue('--theme-shadow') || '#1e88e5';

      // Set orange/amber practice theme variables dynamically
      document.documentElement.style.setProperty('--theme-primary', '#f59e0b');
      document.documentElement.style.setProperty('--theme-secondary', '#fffbeb');
      document.documentElement.style.setProperty('--theme-shadow', '#d97706');

      return () => {
        document.documentElement.style.setProperty('--theme-primary', prevPrimary);
        document.documentElement.style.setProperty('--theme-secondary', prevSecondary);
        document.documentElement.style.setProperty('--theme-shadow', prevShadow);
      };
    }
  }, [lesson.id]);

  useEffect(() => {
    return () => {
      if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const handleCloudCovered = useCallback(() => {
    if (pendingIndexRef.current !== null) {
      const nextIdx = pendingIndexRef.current;
      pendingIndexRef.current = null;
      setCurrentIndex(nextIdx);
    }
  }, []);

  const handleCloudFinished = useCallback(() => {
    setIsTransitioning(false);
  }, []);

  const handleContinue = useCallback((forceSkip: boolean = false) => {
    if (isTransitioning) return; // Prevent double-triggering while transition is active

    if (autoContinueTimerRef.current) {
      clearTimeout(autoContinueTimerRef.current);
      autoContinueTimerRef.current = null;
    }
    
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }

    const currentChallenge = adaptiveChallenges[currentIndex];
    const isReading = isReadingChallenge(currentChallenge);

    if (!isChecked && !isReading && !forceSkip) return;
    
    soundManager.play('click');
    setFeedback(null);

    if (currentIndex < adaptiveChallenges.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextChallenge = adaptiveChallenges[nextIndex];

      // CORE NAVIGATION RULE:
      // ONLY show the cloud transition when:
      // CURRENT SCREEN = INTERACTIVE and NEXT SCREEN = STORY / CONTENT
      // ("Challenge completed → back to the adventure/story.")
      if (shouldUseCloudTransition(currentChallenge, nextChallenge)) {
        // 1. Queue the next index to switch precisely when clouds cover the screen
        pendingIndexRef.current = nextIndex;
        
        // 2. Start preloading the critical story asset while cloud animation begins
        preloadChallengeAssets(nextChallenge, 1200);

        // 3. Start cloud transition
        setIsTransitioning(true);
      } else {
        // Normal fast, lightweight transition for all other cases:
        // Story → Story (no cloud)
        // Story → Interaction (no cloud)
        // Interaction → Interaction (no cloud)
        pendingIndexRef.current = null;
        setIsTransitioning(false);
        setCurrentIndex(nextIndex);
      }
    } else {
      setIsSessionFinished(true);
      soundManager.play('complete');
      enterFullscreen();
    }
  }, [isChecked, isTransitioning, currentIndex, adaptiveChallenges, correctCount, onComplete, xpEarned, maxSessionStreak]);

  useEffect(() => {
    setProgress((currentIndex / adaptiveChallenges.length) * 100);
    // Robustly reset state when challenge changes to prevent cross-exercise state leakage
    const isReadingScreen = isReadingChallenge(currentChallenge);
    setSelectedOption(isReadingScreen ? true : null);
    setIsChecked(isReadingScreen ? true : false);
    setIsCorrect(isReadingScreen ? true : false);
    setShowExplanation(false);
    setFeedback(null); // Clear any lingering feedback
    
    if (currentChallenge?.type === 'rapid_fire' && !hasStartedRapidFire) {
      setShowRapidFireWarning(true);
    }
  }, [currentIndex, adaptiveChallenges.length, hasStartedRapidFire, currentChallenge]);

  // Preload next challenge assets/images to eliminate visual latency and keep layout warm
  useEffect(() => {
    if (currentIndex < adaptiveChallenges.length - 1) {
      preloadNextChallengeAssets(adaptiveChallenges, currentIndex + 1);
    }
  }, [currentIndex, adaptiveChallenges]);

  const handleCheck = useCallback((manualOption?: any) => {
    if (isChecked || !currentChallenge) return;
    
    // Ensure selectedOption is updated if manually provided (e.g., from RapidFire or StepDebugger)
    // Safeguard against React MouseEvent or other DOM events being captured as manualOption
    const isEvent = manualOption && (manualOption.nativeEvent || manualOption.preventDefault || manualOption.target);
    const optionToUse = (manualOption !== undefined && !isEvent) ? manualOption : selectedOption;
    if (manualOption !== undefined && !isEvent) {
      setSelectedOption(manualOption);
    }

    let correct = false;

    switch (currentChallenge.type) {
      case 'image_reveal':
        correct = String(optionToUse).trim().toLowerCase() === String(currentChallenge.correctAnswer).trim().toLowerCase();
        break;
      case 'ai_tool_picker': {
        if (optionToUse && typeof optionToUse === 'object') {
          correct = optionToUse.isCorrect === true;
        } else {
          const tool = currentChallenge.toolPicker?.tools?.find((t: any) => t.id === optionToUse);
          correct = tool?.isCorrect === true;
        }
        break;
      }
      case 'prompt_battle': {
        const correctAns = currentChallenge.promptBattle?.correctAnswer || '';
        correct = String(optionToUse).trim().toUpperCase() === String(correctAns).trim().toUpperCase();
        break;
      }
      case 'before_after_ai': {
        const correctAns = currentChallenge.beforeAfterAi?.correctAnswer || '';
        correct = String(optionToUse).trim().toLowerCase() === String(correctAns).trim().toLowerCase();
        break;
      }
      case 'ai_for_school': {
        if (optionToUse && typeof optionToUse === 'object') {
          correct = optionToUse.isBest === true;
        } else {
          const approach = currentChallenge.aiForSchool?.approaches?.find((a: any) => a.id === optionToUse);
          correct = approach?.isBest === true;
        }
        break;
      }
      case 'tool_match':
        correct = optionToUse === true;
        break;
      case 'result_ranker': {
        if (optionToUse && typeof optionToUse === 'object') {
          correct = optionToUse.isCorrect === true;
        } else {
          const out = currentChallenge.resultRanker?.outputs?.find((o: any) => o.id === optionToUse);
          correct = out?.isCorrect === true;
        }
        break;
      }
      case 'prompt_fixer': {
        if (optionToUse && typeof optionToUse === 'object') {
          correct = optionToUse.isCorrect === true;
        } else {
          const opt = currentChallenge.promptFixer?.options?.find((o: any) => o.text === optionToUse);
          correct = opt?.isCorrect === true;
        }
        break;
      }
      case 'ai_myth_fact': {
        const selectedStr = String(optionToUse).trim().toLowerCase();
        const isFactChoice = selectedStr === 'fact';
        const isMythChoice = selectedStr === 'myth';
        const statementIsFact = currentChallenge.aiMythFact?.isFact === true;
        correct = (statementIsFact && isFactChoice) || (!statementIsFact && isMythChoice);
        break;
      }
      case 'student_mission': {
        if (optionToUse && typeof optionToUse === 'object') {
          correct = optionToUse.isCorrect === true;
        } else {
          const step = currentChallenge.studentMission?.steps?.find((s: any) => s.id === optionToUse);
          correct = step?.isCorrect === true;
        }
        break;
      }
      case 'daily_life_ai': {
        if (optionToUse && typeof optionToUse === 'object') {
          correct = optionToUse.isCorrect === true;
        } else {
          const opt = currentChallenge.dailyLifeAi?.options?.find((o: any) => o.id === optionToUse);
          correct = opt?.isCorrect === true;
        }
        break;
      }
      case 'ai_prediction': {
        if (optionToUse && typeof optionToUse === 'object') {
          correct = optionToUse.isCorrect === true;
        } else {
          const choice = currentChallenge.aiPrediction?.choices?.find((c: any) => c.id === optionToUse);
          correct = choice?.isCorrect === true;
        }
        break;
      }
      case 'which_output_better': {
        const correctAns = currentChallenge.whichOutputBetter?.betterOption || '';
        correct = String(optionToUse).trim().toUpperCase() === String(correctAns).trim().toUpperCase();
        break;
      }
      case 'ai_assistant_builder':
        correct = true; // Any creative config is valid!
        break;
      case 'hidden_ai': {
        if (optionToUse && typeof optionToUse === 'object') {
          correct = optionToUse.isCorrectSpot === true;
        } else {
          const area = currentChallenge.hiddenAi?.areas?.find((a: any) => a.id === optionToUse);
          correct = area?.isCorrectSpot === true;
        }
        break;
      }
      case 'ai_vs_human':
        correct = String(optionToUse).trim().toLowerCase() === String(currentChallenge.correctAnswer).trim().toLowerCase();
        break;
      case 'tap_correct_area':
        const correctSpotObj = currentChallenge.hotspots?.find((h: any) => h.isCorrectSpot);
        correct = (optionToUse as string) === correctSpotObj?.id;
        break;
      case 'memory_flip_cards':
        correct = optionToUse === true;
        break;
      case 'emoji_concepts':
        correct = String(optionToUse).trim().toLowerCase() === String(currentChallenge.correctAnswer).trim().toLowerCase();
        break;
      case 'achievement_discovery':
        correct = optionToUse === true;
        break;
      case 'drag_and_drop':
        const assignments = (optionToUse as { [itemId: string]: string }) || {};
        const items = currentChallenge.items || [];
        correct = items.every(item => assignments[item.id] === item.correct_bucket);
        break;
      case 'c1_multiple_choice':
      case 'c8_tap_correct_object':
      case 'c9_true_false':
      case 'c10_swipe_left_right':
      case 'c15_drag_complete_diagram':
      case 'c18_audio_quiz':
        correct = String(optionToUse || '').trim().toLowerCase() === String(currentChallenge.correctAnswer || '').trim().toLowerCase();
        break;
      case 'c2_fill_in_blank':
        correct = String(optionToUse || '').trim().toLowerCase() === String(currentChallenge.correctAnswer || '').trim().toLowerCase();
        break;
      case 'c3_sentence_builder': {
        const sc = (optionToUse as string[]) || [];
        correct = sc.length === currentChallenge.chipsCorrect?.length &&
                  sc.every((chip, idx) => chip === currentChallenge.chipsCorrect?.[idx]);
        break;
      }
      case 'c4_concept_matcher':
      case 'c14_memory_flip_cards':
      case 'c16_eliminate_wrong':
        correct = optionToUse === true;
        break;
      case 'c5_bucket_sort':
      case 'c11_image_classification':
      case 'c12_label_diagram': {
        const ass = (optionToUse as { [itemId: string]: string }) || {};
        const its = currentChallenge.items || [];
        correct = its.every(item => ass[item.id] === item.correct_bucket);
        break;
      }
      case 'c6_timeline_sort':
      case 'c7_sequence_builder':
      case 'c17_arrange_images': {
        const ord = (optionToUse as string[]) || [];
        correct = ord.length === currentChallenge.correctOrder?.length && 
                  ord.every((id, idx) => id === currentChallenge.correctOrder?.[idx]);
        break;
      }
      case 'c13_hotspot_question': {
        const hSpotObj = currentChallenge.hotspots?.find((h: any) => h.isCorrectSpot);
        correct = (optionToUse as string) === hSpotObj?.id;
        break;
      }
      case 'fill_in_blank':
        correct = String(optionToUse).trim().toLowerCase() === String(currentChallenge.correctAnswer).trim().toLowerCase();
        break;
      case 'spot_the_ai':
        const aiIds = currentChallenge.items?.filter(i => i.has_ai).map(i => i.id) || [];
        const selectedIds = (optionToUse as string[]) || [];
        correct = aiIds.length === selectedIds.length && aiIds.every(id => selectedIds.includes(id));
        break;
      case 'scenario_quest':
        correct = (optionToUse as any)?.is_best || false;
        break;
      case 'match_pairs':
        correct = optionToUse === true;
        break;
      case 'sort_sequence':
        const order = (optionToUse as string[]) || [];
        correct = order.length === currentChallenge.correctOrder?.length && 
                  order.every((id, idx) => id === currentChallenge.correctOrder?.[idx]);
        break;
      case 'build_concept':
        const selectedChips = (optionToUse as string[]) || [];
        correct = selectedChips.length === currentChallenge.chipsCorrect?.length &&
                  selectedChips.every((chip, idx) => chip === currentChallenge.chipsCorrect?.[idx]);
        break;
      case 'rapid_fire':
        // Update handling of rapid fire success
        correct = (optionToUse as number) > 0;
        break;
      case 'analogy_card':
        correct = String(optionToUse).trim().toLowerCase() === String(currentChallenge.correctAnswer).trim().toLowerCase();
        break;
      case 'before_after_exp':
        correct = String(optionToUse).trim().toLowerCase() === String(currentChallenge.experiment?.reflectionQuestions[0].correctAnswer).trim().toLowerCase();
        break;
      case 'mystery_concept':
        correct = (optionToUse as string)?.toLowerCase().trim() === currentChallenge.mystery?.concept.toLowerCase().trim();
        break;
      case 'step_debugger':
        // Always mark as correct/success when finished as per user request
        correct = true;
        break;
      case 'argument_builder':
        const argAssignments = (optionToUse as { [key: number]: 'for' | 'against' }) || {};
        const argCards = currentChallenge.argument?.cards || [];
        correct = Object.keys(argAssignments).length === argCards.length && 
                  Object.entries(argAssignments).every(([idx, side]) => argCards[parseInt(idx)].side === side);
        break;
      case 'link_builder':
        const linkIndices = (optionToUse as number[]) || [];
        const linkPool = currentChallenge.linkBuilder?.pool || [];
        correct = linkPool.every((item, idx) => item.belongs === linkIndices.includes(idx));
        break;
      case 'open_response':
        correct = true; // Open response questions are reflective and always marked correct upon submission
        break;
      case 'myth_buster': {
        const selectedStr = String(optionToUse).trim().toLowerCase();
        const isFactChoice = selectedStr === 'fact';
        const isMythChoice = selectedStr === 'myth';
        const statementIsFact = currentChallenge.mythBuster?.isFact === true;
        correct = (statementIsFact && isFactChoice) || (!statementIsFact && isMythChoice);
        break;
      }
      case 'meme_screen':
      case 'gif_explainer':
      case 'comic_story':
      case 'fun_fact':
      case 'visual_analogy':
      case 'image_explainer':
      case 'ai_around_you':
      case 'before_after_story':
      case 'student_story':
      case 'interactive_reveal':
      case 'why_should_i_care':
      case 'content_screen':
      case 'visual_lesson_screen':
        correct = true;
        break;
      default:
        // Use flexible comparison for generic types
        const expected = String(currentChallenge.correctAnswer || '').trim().toLowerCase();
        const actual = String(optionToUse || '').trim().toLowerCase();
        correct = actual === expected;
    }

    setIsCorrect(correct);
    setIsChecked(true);
    
    if (correct) {
      setFeedback('correct');
      setPositiveFeedback(POSITIVE_PHRASES[Math.floor(Math.random() * POSITIVE_PHRASES.length)]);
      onQuestionAnswered?.(true);

      const attemptCount = (attempts[currentIndex] || 0) + 1;
      const xpReward = attemptCount === 1 ? 5 : 2;
      
      setXpEarned(prev => prev + xpReward);
      setCorrectCount(prev => prev + 1);
      const nextStreak = sessionStreak + 1;
      setSessionStreak(nextStreak);
      setMaxSessionStreak(m => Math.max(m, nextStreak));
      
      // Restore energy every 5 correct answers in a row
      if (nextStreak > 0 && nextStreak % 5 === 0 && onStreakRestore) {
        onStreakRestore(1, nextStreak);
      }
      
      soundManager.play('correct');
      
      // Feedback overlay disappears after 3 seconds
      feedbackTimerRef.current = setTimeout(() => {
        setFeedback(null);
      }, 3000);
    } else {
      onQuestionAnswered?.(false);
      setAttempts(prev => ({ ...prev, [currentIndex]: (prev[currentIndex] || 0) + 1 }));
      setSessionStreak(0);
      setFeedback('incorrect');
      soundManager.play('incorrect');
    }
  }, [isChecked, currentChallenge, selectedOption, sessionStreak, onStreakRestore, onQuestionAnswered, attempts, currentIndex]);

  const handleSelect = useCallback((option: any) => {
    if (isChecked) return;
    setSelectedOption(option);
    soundManager.play('click');
    
    // Auto-trigger check for single-select/quiz style exercises and complex auto-checking exercises
    const immediateCheckTypes = [
      'tap_right_answer', 'c1_multiple_choice', 'c9_true_false', 'c10_swipe_left_right',
      'ai_myth_fact', 'myth_buster', 'ai_vs_human', 'emoji_concepts', 'ai_tool_picker',
      'prompt_battle', 'before_after_ai', 'ai_for_school', 'result_ranker', 'prompt_fixer',
      'student_mission', 'daily_life_ai', 'ai_prediction', 'which_output_better',
      'analogy_card', 'before_after_exp', 'c18_audio_quiz', 'rapid_fire', 'step_debugger',
      'memory_flip_cards', 'achievement_discovery'
    ];

    if (currentChallenge && immediateCheckTypes.includes(currentChallenge.type)) {
       handleCheck(option);
    }
  }, [isChecked, currentChallenge, handleCheck]);

  const renderExercise = () => {
    switch (currentChallenge.type) {
      case 'tap_right_answer':
        return (
          <TapRightAnswer 
            options={currentChallenge.options || []}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
            isCorrect={isCorrect}
            correctAnswer={currentChallenge.correctAnswer as string}
          />
        );
      case 'spot_the_ai':
        return (
          <SpotTheAI 
            items={currentChallenge.items || []}
            onSelect={handleSelect} 
            isChecked={isChecked}
          />
        );
      case 'analogy_card':
        return (
          <AnalogyCard 
            analogy={currentChallenge.analogy!}
            correctAnswer={currentChallenge.correctAnswer as string}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
            isCorrect={isCorrect}
          />
        );
      case 'drag_and_drop':
        return (
          <MemoizedDragAndDrop 
            buckets={currentChallenge.buckets || []}
            items={currentChallenge.items as any || []}
            isChecked={isChecked}
            onSelect={handleSelect}
          />
        );
      case 'fill_in_blank':
        return (
          <FillInBlank 
            sentence={currentChallenge.question}
            options={currentChallenge.options || []}
            correctAnswer={currentChallenge.correctAnswer as string}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
            isCorrect={isCorrect}
          />
        );
      case 'match_pairs':
        return (
          <MemoizedMatchPairs 
            pairs={currentChallenge.pairs || (currentChallenge as any).matchingPairs || (currentChallenge as any).conceptPairs || (currentChallenge as any).options || (currentChallenge as any).items || []}
            isChecked={isChecked}
            onSelect={handleSelect}
          />
        );
      case 'sort_sequence':
        return (
          <MemoizedSortSequence 
            steps={currentChallenge.steps || []}
            correctOrder={currentChallenge.correctOrder || []}
            isChecked={isChecked}
            onSelect={handleSelect}
          />
        );
      case 'build_concept':
        return (
          <MemoizedBuildAConcept 
            targetSentence={currentChallenge.targetSentence || ''}
            chipsCorrect={currentChallenge.chipsCorrect || []}
            chipsDistractor={currentChallenge.chipsDistractor || []}
            isChecked={isChecked}
            onSelect={handleSelect}
          />
        );
      case 'scenario_quest':
        return (
          <ScenarioQuest 
            scenario={currentChallenge.scenario || ''}
            studentRole={currentChallenge.studentRole || ''}
            decisionPrompt={currentChallenge.decisionPrompt || ''}
            options={currentChallenge.scenarioOptions || []}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
          />
        );
      case 'rapid_fire':
        return (
          <RapidFire 
            questions={currentChallenge.questions || []}
            onComplete={handleSelect}
            isChecked={isChecked}
          />
        );
      case 'before_after_exp':
        return (
          <BeforeAfterExperiment 
            conditionA={currentChallenge.experiment!.conditionA}
            conditionB={currentChallenge.experiment!.conditionB}
            reflectionQuestions={currentChallenge.experiment!.reflectionQuestions}
            onSelect={handleSelect}
            isChecked={isChecked}
          />
        );
      case 'mystery_concept':
        return (
          <MysteryConcept 
            concept={currentChallenge.mystery!.concept}
            clues={currentChallenge.mystery!.clues}
            hotKeywords={currentChallenge.mystery!.hotKeywords}
            warmKeywords={currentChallenge.mystery!.warmKeywords}
            onSelect={handleSelect}
            isChecked={isChecked}
          />
        );
      case 'step_debugger':
        return (
          <StepDebugger 
            processName={currentChallenge.question}
            steps={currentChallenge.steps as any || []}
            onSelect={handleSelect}
            isChecked={isChecked}
          />
        );
      case 'argument_builder':
        return (
          <ArgumentBuilder 
            statement={currentChallenge.argument!.statement}
            cards={currentChallenge.argument!.cards}
            onSelect={handleSelect}
            isChecked={isChecked}
          />
        );
      case 'link_builder':
        return (
          <LinkBuilder 
            centralConcept={currentChallenge.linkBuilder!.centralConcept}
            pool={currentChallenge.linkBuilder!.pool}
            onSelect={handleSelect}
            isChecked={isChecked}
          />
        );
      case 'open_response':
        return (
          <OpenResponse 
            question={currentChallenge.question}
            onSelect={handleSelect}
            isChecked={isChecked}
            value={selectedOption}
          />
        );
      case 'image_reveal':
        return (
          <ImageReveal 
            imageUrl={currentChallenge.imageUrl || ''}
            options={currentChallenge.options || []}
            correctAnswer={currentChallenge.correctAnswer as string}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
            isCorrect={isCorrect}
          />
        );
      case 'ai_vs_human':
        return (
          <AIVsHuman 
            outputs={currentChallenge.outputs as any || []}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
            isCorrect={isCorrect}
          />
        );
      case 'tap_correct_area':
        return (
          <TapCorrectArea 
            imageUrl={currentChallenge.imageUrl || ''}
            hotspots={currentChallenge.hotspots || []}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
            isCorrect={isCorrect}
          />
        );
      case 'memory_flip_cards':
        return (
          <MemoryFlipCards 
            cards={currentChallenge.cards || []}
            isChecked={isChecked}
            onSelect={handleSelect}
          />
        );
      case 'emoji_concepts':
        return (
          <EmojiConcepts 
            emojiClue={currentChallenge.emojiClue || ''}
            options={currentChallenge.options || []}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
            isCorrect={isCorrect}
            correctAnswer={currentChallenge.correctAnswer as string}
          />
        );
      case 'achievement_discovery':
        return (
          <AchievementDiscovery 
            rewards={currentChallenge.rewards || []}
            isChecked={isChecked}
            onSelect={handleSelect}
          />
        );
      case 'ai_tool_picker':
        return (
          <AIToolPicker 
            toolPicker={currentChallenge.toolPicker}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
            isCorrect={isCorrect}
          />
        );
      case 'prompt_battle':
        return (
          <PromptBattle 
            promptBattle={currentChallenge.promptBattle}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
            isCorrect={isCorrect}
          />
        );
      case 'before_after_ai':
        return (
          <BeforeAfterAI 
            beforeAfterAi={currentChallenge.beforeAfterAi}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
            isCorrect={isCorrect}
          />
        );
      case 'ai_for_school':
        return (
          <AIForSchool 
            aiForSchool={currentChallenge.aiForSchool}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
            isCorrect={isCorrect}
          />
        );
      case 'tool_match':
        return (
          <ToolMatch 
            toolMatch={currentChallenge.toolMatch}
            isChecked={isChecked}
            onSelect={handleSelect}
          />
        );
      case 'result_ranker':
        return (
          <ResultRanker 
            resultRanker={currentChallenge.resultRanker}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
            isCorrect={isCorrect}
          />
        );
      case 'prompt_fixer':
        return (
          <PromptFixer 
            promptFixer={currentChallenge.promptFixer}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
            isCorrect={isCorrect}
          />
        );
      case 'ai_myth_fact':
        return (
          <AIMythFact 
            aiMythFact={currentChallenge.aiMythFact}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
            isCorrect={isCorrect}
          />
        );
      case 'student_mission':
        return (
          <StudentMission 
            studentMission={currentChallenge.studentMission}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
            isCorrect={isCorrect}
          />
        );
      case 'daily_life_ai':
        return (
          <DailyLifeAI 
            dailyLifeAi={currentChallenge.dailyLifeAi}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
            isCorrect={isCorrect}
          />
        );
      case 'ai_prediction':
        return (
          <AIPrediction 
            aiPrediction={currentChallenge.aiPrediction}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
            isCorrect={isCorrect}
          />
        );
      case 'which_output_better':
        return (
          <WhichOutputBetter 
            whichOutputBetter={currentChallenge.whichOutputBetter}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
            isCorrect={isCorrect}
          />
        );
      case 'ai_assistant_builder':
        return (
          <AIAssistantBuilder 
            aiAssistantBuilder={currentChallenge.aiAssistantBuilder}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
          />
        );
      case 'hidden_ai':
        return (
          <HiddenAI 
            hiddenAi={currentChallenge.hiddenAi}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
            isCorrect={isCorrect}
          />
        );
      case 'meme_screen':
        return (
          <MemeScreen 
            memeScreen={currentChallenge.memeScreen}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
          />
        );
      case 'gif_explainer':
        return (
          <GIFExplainer 
            gifExplainer={currentChallenge.gifExplainer}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
          />
        );
      case 'comic_story':
        return (
          <ComicStory 
            comicStory={currentChallenge.comicStory}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
          />
        );
      case 'fun_fact':
        return (
          <FunFact 
            funFact={currentChallenge.funFact}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
          />
        );
      case 'visual_analogy':
        return (
          <VisualAnalogy 
            visualAnalogy={currentChallenge.visualAnalogy}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
          />
        );
      case 'image_explainer':
        return (
          <ImageExplainer 
            imageExplainer={currentChallenge.imageExplainer}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
          />
        );
      case 'ai_around_you':
        return (
          <AIAroundYou 
            aiAroundYou={currentChallenge.aiAroundYou}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
          />
        );
      case 'myth_buster':
        return (
          <MythBuster 
            mythBuster={currentChallenge.mythBuster}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
            isCorrect={isCorrect}
          />
        );
      case 'before_after_story':
        return (
          <BeforeAfterStory 
            beforeAfterStory={currentChallenge.beforeAfterStory}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
          />
        );
      case 'student_story':
        return (
          <StudentStory 
            studentStory={currentChallenge.studentStory}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
          />
        );
      case 'interactive_reveal':
        return (
          <InteractiveReveal 
            interactiveReveal={currentChallenge.interactiveReveal}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
          />
        );
      case 'why_should_i_care':
        return (
          <WhyShouldICare 
            whyShouldICare={currentChallenge.whyShouldICare}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
          />
        );
      case 'c1_multiple_choice':
        return (
          <TapRightAnswer 
            options={currentChallenge.options || []}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
            isCorrect={isCorrect}
            correctAnswer={currentChallenge.correctAnswer as string}
          />
        );
      case 'c2_fill_in_blank':
        return (
          <FillInBlank 
            sentence={currentChallenge.question}
            options={currentChallenge.options || []}
            correctAnswer={currentChallenge.correctAnswer as string}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            isChecked={isChecked}
            isCorrect={isCorrect}
          />
        );
      case 'c3_sentence_builder':
        return (
          <MemoizedBuildAConcept 
            targetSentence={currentChallenge.targetSentence || ''}
            chipsCorrect={currentChallenge.chipsCorrect || []}
            chipsDistractor={currentChallenge.chipsDistractor || []}
            isChecked={isChecked}
            onSelect={handleSelect}
          />
        );
      case 'c4_concept_matcher':
        return (
          <MemoizedMatchPairs 
            pairs={currentChallenge.pairs || (currentChallenge as any).matchingPairs || (currentChallenge as any).conceptPairs || (currentChallenge as any).options || (currentChallenge as any).items || []}
            isChecked={isChecked}
            onSelect={handleSelect}
          />
        );
      case 'c5_bucket_sort':
        return (
          <MemoizedDragAndDrop 
            buckets={currentChallenge.buckets || []}
            items={currentChallenge.items as any || []}
            isChecked={isChecked}
            onSelect={handleSelect}
          />
        );
      case 'c6_timeline_sort':
        return (
          <MemoizedSortSequence 
            steps={currentChallenge.steps || []}
            correctOrder={currentChallenge.correctOrder || []}
            isChecked={isChecked}
            onSelect={handleSelect}
          />
        );
      case 'c7_sequence_builder':
        return (
          <C7SequenceBuilder 
            steps={currentChallenge.steps || []}
            correctOrder={currentChallenge.correctOrder || []}
            isChecked={isChecked}
            onSelect={handleSelect}
          />
        );
      case 'c8_tap_correct_object':
        return (
          <C8TapCorrectObject 
            question={currentChallenge.question}
            options={currentChallenge.options || []}
            correctAnswer={currentChallenge.correctAnswer || ''}
            isChecked={isChecked}
            isCorrect={isCorrect}
            onSelect={handleSelect}
            selectedOption={selectedOption}
            items={currentChallenge.items || (currentChallenge as any).images}
          />
        );
      case 'c9_true_false':
        return (
          <C9TrueFalse 
            correctAnswer={currentChallenge.correctAnswer || ''}
            isChecked={isChecked}
            isCorrect={isCorrect}
            onSelect={handleSelect}
            selectedOption={selectedOption}
          />
        );
      case 'c10_swipe_left_right':
        return (
          <C10SwipeLeftRight 
            question={currentChallenge.question}
            correctAnswer={currentChallenge.correctAnswer || ''}
            isChecked={isChecked}
            isCorrect={isCorrect}
            onSelect={handleSelect}
            selectedOption={selectedOption}
          />
        );
      case 'c11_image_classification':
        return (
          <C11ImageClassification 
            items={currentChallenge.items as any || []}
            buckets={currentChallenge.buckets || []}
            isChecked={isChecked}
            onSelect={handleSelect}
          />
        );
      case 'c12_label_diagram':
        return (
          <C12LabelDiagram 
            imageUrl={currentChallenge.imageUrl || ''}
            hotspots={currentChallenge.hotspots || []}
            items={currentChallenge.items as any || []}
            isChecked={isChecked}
            onSelect={handleSelect}
          />
        );
      case 'c13_hotspot_question':
        return (
          <C13HotspotQuestion 
            imageUrl={currentChallenge.imageUrl || ''}
            hotspots={currentChallenge.hotspots || []}
            isChecked={isChecked}
            isCorrect={isCorrect}
            onSelect={handleSelect}
            selectedOption={selectedOption}
          />
        );
      case 'c14_memory_flip_cards':
        return (
          <MemoryFlipCards 
            cards={currentChallenge.cards || []}
            isChecked={isChecked}
            onSelect={handleSelect}
          />
        );
      case 'c15_drag_complete_diagram':
        return (
          <C15DragToCompleteDiagram 
            steps={currentChallenge.steps || []}
            options={currentChallenge.options || []}
            correctAnswer={currentChallenge.correctAnswer || ''}
            isChecked={isChecked}
            isCorrect={isCorrect}
            onSelect={handleSelect}
            selectedOption={selectedOption}
          />
        );
      case 'c16_eliminate_wrong':
        return (
          <C16EliminateWrongAnswers 
            question={currentChallenge.question}
            options={currentChallenge.options as any || []}
            isChecked={isChecked}
            onSelect={handleSelect}
          />
        );
      case 'c17_arrange_images':
        return (
          <C17ArrangeImages 
            items={currentChallenge.items as any || []}
            correctOrder={currentChallenge.correctOrder || []}
            isChecked={isChecked}
            onSelect={handleSelect}
          />
        );
      case 'c18_audio_quiz':
        return (
          <C18AudioQuiz 
            audioUrl={currentChallenge.audioUrl}
            options={currentChallenge.options || []}
            correctAnswer={currentChallenge.correctAnswer || ''}
            isChecked={isChecked}
            isCorrect={isCorrect}
            onSelect={handleSelect}
            selectedOption={selectedOption}
          />
        );
      case 'content_screen':
      case 'visual_lesson_screen': {
        return null;
      }
      default:
        return <div>Exercise type {currentChallenge.type} not implemented yet.</div>;
    }
  };

  if (isSessionFinished) {
    const finalAccuracy = adaptiveChallenges.length > 0 ? correctCount / adaptiveChallenges.length : 1;
    const isChallengeOrGuardian = lesson.isChallenge || lesson.isBonus;
    const requiredAccuracy = isChallengeOrGuardian ? 0.8 : 0;
    const didPass = !isChallengeOrGuardian || finalAccuracy >= 0.8;
    const hasInteractiveScreens = adaptiveChallenges.some((c) => isInteractiveCScreen(c));
    const sessionMascotUrl = hasInteractiveScreens
      ? CHIKOO_INTERACTIVE_COMPLETION_MASCOT_URL
      : CHIKOO_COMPLETION_MASCOT_URL;

    return (
      <MainLessonCompletionScreen
        title={
          !didPass
            ? (lesson.isBonus ? 'Guardian Defeated You!' : 'Challenge Not Cleared!')
            : 'Lesson Completed'
        }
        correctCount={correctCount}
        totalQuestions={adaptiveChallenges.length}
        earnedCookies={displayCookies || Number(lesson.xpReward || (lesson as any).xp_reward || 100)}
        streak={maxSessionStreak || 1}
        requiredAccuracy={requiredAccuracy}
        userRating={userRating}
        onRatingChange={(rating) => setUserRating(rating)}
        onRetry={() => {
          if (isCompletingRef.current) return;
          isCompletingRef.current = true;
          setIsCompleting(true);
          exitFullscreen();
          onComplete(0, finalAccuracy, maxSessionStreak || 1);
        }}
        onProceed={() => {
          if (isCompletingRef.current) return;
          isCompletingRef.current = true;
          setIsCompleting(true);
          exitFullscreen();
          onComplete(Number(lesson.xpReward || (lesson as any).xp_reward || 100), isNaN(finalAccuracy) ? 1.0 : finalAccuracy, maxSessionStreak || 1);
        }}
        lessonId={lesson.id}
        screenId={currentChallenge?.id || 'completion'}
        language={language}
        fallbackNarrations={currentChallenge?.audioNarrations}
        challenges={adaptiveChallenges}
        mascotUrl={sessionMascotUrl}
      />
    );
  }

  if (!isStarted) {
    return (
      <div className="absolute inset-0 z-[400] bg-white dark:bg-[#0b0f19] text-gray-800 dark:text-white flex flex-col p-6 items-center justify-center text-center select-none">
        <button 
          onClick={onClose}
          className="absolute top-6 left-6 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-6 h-6 text-gray-400 dark:text-slate-400" />
        </button>

        <div className="w-full max-w-sm space-y-8 flex flex-col items-center">
          <div className="w-32 h-32 bg-chikoo-blue-50 dark:bg-[#172033] rounded-[2.5rem] flex items-center justify-center shadow-xl border-4 border-white dark:border-slate-800 mb-4">
             {lesson.isChest ? (
               <ChestIcon isLocked={false} isCurrent={true} isOpen={false} className="w-20 h-20" />
             ) : (
               <Star size={64} className="text-chikoo-blue-500 fill-chikoo-blue-500" />
             )}
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-display font-black text-gray-800 dark:text-white leading-tight">
              {lesson.title}
            </h2>
            <p className="text-gray-500 dark:text-slate-300 font-bold text-lg px-4">
              {lesson.description}
            </p>
          </div>

          <div className="flex flex-row items-center justify-center gap-4 w-full px-4">
            <div className="bg-slate-50 dark:bg-[#172033] p-4 rounded-3xl border-2 border-slate-100 dark:border-slate-800 flex-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1 text-center">Difficulty</p>
              <p className="text-lg font-display font-black text-slate-700 dark:text-slate-200 text-center">{lesson.difficulty}</p>
            </div>
            <div className="bg-slate-50 dark:bg-[#172033] p-4 rounded-3xl border-2 border-slate-100 dark:border-slate-800 flex-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1 text-center">Reward</p>
              <p className="text-lg font-display font-black text-amber-500 text-center">+{lesson.xpReward} Cookies</p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsStarted(true);
              soundManager.play('click');
            }}
            className="btn-3d btn-3d-blue w-full py-5 text-2xl uppercase tracking-wider shadow-[0_8px_0_#1899d6] hover:translate-y-1 active:translate-y-2 active:shadow-none transition-all flex items-center justify-center"
          >
            Start
          </button>
        </div>
      </div>
    );
  }

  // Direct, optimized rendering of Story Scene layouts (Content Screen / Visual Lesson Screen)
  // This completely bypasses standard parent elements (Header, Question layout, empty Content areas, Check Footers)
  // to avoid white flashes, component rebuilds, flickering, and broken immersion.
  if (currentChallenge && isStoryScreen(currentChallenge)) {
    const ch = currentChallenge as any;
    const rawContentData = ch.contentScreen || ch.visualLessonScreen || {};
    const storyContentData = {
      id: currentChallenge.id,
      sceneType: rawContentData.sceneType || 
                 ch.sceneType || 
                 ch.type,
      mediaType: rawContentData.mediaType || 
                 ch.mediaType || 'image',
      mediaUrl: rawContentData.mediaUrl || 
                ch.mediaUrl || 
                ch.contentMediaUrl || 
                ch.imageUrl || 
                ch.image_url,
      badge: rawContentData.badge || 
             ch.badge || 
             (ch.type === 'hero_scene' ? 'HERO SCENE' : 
              ch.type === 'cinematic_scene' ? 'CINEMATIC' : 
              ch.type === 'dialogue_strip_scene' ? 'STORY DIALOGUE' : 
              ch.type === 'celebration_scene' ? 'CELEBRATION' : 'STORY SCENE'),
      heading: rawContentData.heading || 
               ch.heading || 
               ch.contentHeading || 
               ch.question || 
               ch.title,
      subheading: rawContentData.subheading || 
                  ch.subheading || 
                  ch.contentSubheading,
      contentBody: rawContentData.contentBody || 
                   ch.contentBody || 
                   (typeof ch.explanation === 'string' ? ch.explanation : ch.explanation?.text) || 
                   ch.content,
      highlightBox: rawContentData.highlightBox || 
                    ch.highlightBox,
      quote: rawContentData.quote || 
             ch.quote,
      quoteAuthor: rawContentData.quoteAuthor || 
                   ch.quoteAuthor,
      bottomMessage: rawContentData.bottomMessage || 
                     ch.bottomMessage,
      dialogue: rawContentData.dialogue || 
                ch.dialogue || 
                ch.dialogueMessages || 
                ch.messages,
      panels: rawContentData.panels || 
              ch.panels,
      ...rawContentData
    };

    return (
      <div 
        onPointerDownCapture={() => soundManager.resumeLessonMusic()}
        className="absolute inset-0 z-[400] bg-slate-950 flex flex-col overflow-hidden"
      >
        <CloudTransition
          isActive={isTransitioning}
          onCovered={handleCloudCovered}
          onFinished={handleCloudFinished}
        />

        <VisualLessonScreen
          key={`story-${lesson.id}-${currentIndex}-${currentChallenge.id}`}
          contentData={storyContentData}
          onSelect={handleSelect}
          selectedOption={selectedOption}
          isChecked={isChecked}
          onContinue={handleContinue}
          progress={progress}
          currentIndex={currentIndex}
          totalChallenges={adaptiveChallenges.length}
          onClose={onClose}
          energy={energy}
          nextEnergyIn={nextEnergyIn}
          audioIsPlaying={screenAudio.isPlaying}
          audioIsLoading={screenAudio.isLoading}
          audioHasAudio={screenAudio.hasAudio}
          onTogglePlay={screenAudio.togglePlay}
          onReplay={screenAudio.replay}
          language={ttsLanguage}
          onLanguageChange={(newLang) => setTtsLanguage(newLang)}
        />
      </div>
    );
  }

  return (
    <div 
      onPointerDownCapture={() => soundManager.resumeLessonMusic()}
      className="absolute inset-0 z-[400] bg-white dark:bg-[#0b0f19] flex flex-col text-slate-800 dark:text-slate-100"
    >
      <CloudTransition
        isActive={isTransitioning}
        onCovered={handleCloudCovered}
        onFinished={handleCloudFinished}
      />

      {/* Rapid Fire Warning Overlay */}
      <AnimatePresence>
        {showRapidFireWarning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1200] bg-chikoo-blue-500 flex items-center justify-center p-6 text-center"
          >
            <div className="max-w-xs w-full space-y-8">
              <motion.div 
                animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-2xl"
              >
                <Star size={48} className="text-chikoo-blue-500 fill-chikoo-blue-500" />
              </motion.div>
              <div className="space-y-4">
                <h3 className="text-4xl font-display font-black text-white uppercase tracking-tighter italic">Get Ready!</h3>
                <p className="text-chikoo-blue-50 font-bold text-lg">
                  A Rapid Fire Blitz is starting! You have 30 seconds to answer as many as you can.
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowRapidFireWarning(false);
                  setHasStartedRapidFire(true);
                  soundManager.play('click');
                }}
                className="btn-3d w-full py-5 bg-white text-chikoo-blue-500 rounded-[2.5rem] font-display font-black text-2xl shadow-[0_8px_0_#cbd5e1] hover:translate-y-1 active:translate-y-2 active:shadow-none transition-all uppercase tracking-wider cursor-pointer"
              >
                I'm Ready!
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explanation Overlay */}
      <ChikooExplanationOverlay
        isOpen={showExplanation}
        isCorrect={isCorrect}
        challenge={currentChallenge}
        selectedOption={selectedOption}
        lessonId={lesson?.id}
        onClose={() => setShowExplanation(false)}
        onTryAgain={() => {
          setIsChecked(false);
          setIsCorrect(false);
          setFeedback(null);
          setSelectedOption(null);
          setShowExplanation(false);
        }}
      />

      {/* Top Bar with Playful Candy Gradient Progress Bar */}
      <div className="px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between gap-3 sm:gap-6 border-b border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-[#172033]/95 backdrop-blur-md sticky top-0 z-50">
        <button 
          onClick={() => {
            exitFullscreen();
            onClose();
            soundManager.play('click');
          }} 
          className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 active:scale-95"
          title="Exit Lesson"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
        </button>

        {/* Playful Animated Progress Bar */}
        <div className="flex-1 relative py-1">
          <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner border border-slate-200/60 dark:border-slate-700 relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(progress, 4)}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              className="h-full bg-gradient-to-r from-sky-400 via-chikoo-blue-500 to-indigo-500 rounded-full relative"
            >
              {/* Gloss highlight */}
              <div className="absolute inset-0 bg-white/25 rounded-full h-1/2" />
            </motion.div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSelector variant="hud" />
          <button
            onClick={() => {
              const nextState = !soundManager.isMusicEnabled();
              soundManager.setMusicEnabled(nextState);
              soundManager.play('click');
            }}
            className={`p-2 rounded-2xl transition-all cursor-pointer ${
              isMusicEnabled 
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 shadow-sm border border-indigo-200/50 dark:border-indigo-800/50' 
                : 'bg-slate-100 dark:bg-[#243149] text-slate-400 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#2e3e5c]'
            }`}
            title={isMusicEnabled ? 'Storyline Music On' : 'Storyline Music Off'}
          >
            {isMusicEnabled ? (
              <Music className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <span className="relative flex items-center justify-center w-4 h-4">
                <Music className="w-4 h-4 stroke-[2.5] opacity-40" />
                <span className="absolute w-4 h-0.5 bg-slate-400 rotate-45 rounded-full" />
              </span>
            )}
          </button>
          
          <span className="text-xs font-display font-black text-slate-500 px-2.5 py-1 bg-slate-100 rounded-xl min-w-[3.5rem] text-center">
            {currentIndex + 1} / {adaptiveChallenges.length}
          </span>

          <EnergyIndicator 
            energyUnits={energy} 
            nextChargingIn={nextEnergyIn} 
            showZap={true} 
            className="scale-75 origin-right" 
          />
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-y-auto scrollbar-hide px-4 py-6 max-w-2xl mx-auto w-full transition-transform duration-100 ${feedback === 'incorrect' ? 'animate-shake' : ''}`}>
        <AnimatePresence mode="wait">
          {currentChallenge ? (
            <motion.div
              key={currentChallenge.id}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-6 sm:space-y-8 will-change-transform pb-8"
            >
              {/* Only show default question header if NOT on a reading / storytelling content screen */}
              {!isReadingChallenge(currentChallenge) && (
                <div className="w-full max-w-xl mx-auto flex flex-row items-center justify-start gap-3 sm:gap-4 mb-5 select-none text-left">
                  {/* Left Side Playful Chikoo Mascot (Onboarding Style - Increased Size) */}
                  <motion.div 
                    initial={{ scale: 0.8, x: -12, opacity: 0 }}
                    animate={{ scale: 1, x: 0, opacity: 1, y: [0, -6, 0] }}
                    transition={{ 
                      scale: { type: "spring", stiffness: 360, damping: 18 },
                      y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="w-32 h-32 sm:w-40 sm:h-40 shrink-0 relative flex items-center justify-center filter drop-shadow-md"
                  >
                    <img 
                      src="/heading_aibo.webp" 
                      alt="Chikoo Mascot" 
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/avatar.webp'; }}
                      className="w-full h-full object-contain pointer-events-none select-none"
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>

                  {/* Right Side Question Speech Bubble (Onboarding Style - High Contrast in Dark & Light) */}
                  <motion.div 
                    initial={{ opacity: 0, x: 12, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="flex-1 bg-white dark:bg-[#172033] border-2 border-slate-200 dark:border-slate-700/80 rounded-[1.75rem] p-5 sm:p-6 shadow-sm relative text-left min-h-[6rem] flex flex-col justify-center"
                  >
                    {/* Speech bubble tail pointing LEFT to Chikoo */}
                    <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-[#172033] border-b-2 border-l-2 border-slate-200 dark:border-slate-700/80 transform rotate-45" />

                    <div className="flex items-center justify-between gap-3 relative z-10">
                      <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-snug tracking-tight text-left flex-1">
                        {displayedQuestion}
                        {!isQuestionTypingComplete && (
                          <span className="inline-block w-1.5 h-5 bg-amber-500 rounded-full animate-pulse ml-0.5 shrink-0 align-middle" />
                        )}
                      </h2>

                      {/* Question Speech TTS Speaker Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          screenAudio.togglePlay();
                        }}
                        disabled={screenAudio.isLoading}
                        className={`shrink-0 p-2.5 rounded-2xl transition-all duration-150 flex items-center justify-center cursor-pointer shadow-xs active:scale-90 border ${
                          screenAudio.isPlaying
                            ? 'bg-amber-400 text-slate-950 border-amber-500 ring-2 ring-amber-300 animate-pulse'
                            : 'bg-slate-100 dark:bg-[#243149] hover:bg-slate-200 dark:hover:bg-[#2e3e5c] text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/60'
                        }`}
                        title={screenAudio.isPlaying ? "Pause Question Audio" : "Listen to Question"}
                      >
                        {screenAudio.isLoading ? (
                          <Loader2 className="w-4.5 h-4.5 animate-spin text-amber-500" />
                        ) : screenAudio.isPlaying ? (
                          <div className="flex items-center gap-1">
                            <Volume2 className="w-4.5 h-4.5 stroke-[2.5]" />
                            <div className="flex items-end gap-[1.5px] h-3">
                              {[1, 2, 3].map((bar) => (
                                <motion.div
                                  key={`q-audio-bar-${bar}`}
                                  animate={{ height: [2, 10, 2] }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 0.45 + bar * 0.1,
                                    ease: "easeInOut"
                                  }}
                                  className="w-[1.5px] bg-slate-950 rounded-full"
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <Volume2 className="w-4.5 h-4.5 stroke-[2.5]" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Reveal answer exercises only after question typing is complete */}
              <AnimatePresence mode="wait">
                {isQuestionTypingComplete && (
                  <motion.div
                    key={`exercise-content-${currentChallenge.id}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {renderExercise()}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-full">
               <p className="text-slate-400 font-display font-black">Loading Challenge...</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Feedback Bottom Sheet */}
      <div className={`p-4 sm:p-6 border-t-2 transition-all duration-300 shadow-lg ${
        isReadingChallenge(currentChallenge)
          ? 'bg-white dark:bg-[#172033] border-slate-100 dark:border-slate-800'
          : !isChecked 
            ? 'bg-white dark:bg-[#172033] border-slate-100 dark:border-slate-800' 
            : isCorrect 
              ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/70 dark:via-teal-950/60 dark:to-emerald-950/70 border-emerald-200 dark:border-emerald-800/80' 
              : 'bg-gradient-to-r from-amber-50 via-rose-50 to-orange-50 dark:from-rose-950/70 dark:via-orange-950/60 dark:to-rose-950/70 border-rose-200 dark:border-rose-800/80'
      }`}>
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          {isChecked && currentChallenge && !isReadingChallenge(currentChallenge) && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${
                  isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}>
                  {isCorrect ? (
                    <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                  ) : (
                    <AlertCircle className="w-7 h-7 stroke-[2.5]" />
                  )}
                </div>
                <div>
                  <h4 className={`font-display font-black text-xl leading-tight ${isCorrect ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}`}>
                    {isCorrect ? (
                      currentChallenge.type === 'step_debugger' ? "Let's Go! 🚀" : 
                      currentChallenge.type === 'open_response' ? "Brilliant Insight! 💡" : 
                      'Awesome Job! 🎉'
                    ) : 'Good Try! 🌱'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-bold mt-0.5">
                    {isCorrect ? "You're mastering this concept!" : "Mistakes are just learning in disguise!"}
                  </p>
                </div>
              </div>

              {/* Explain button if available */}
              <button 
                onClick={() => {
                  setShowExplanation(true);
                  soundManager.play('click');
                }}
                className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm ${
                  isCorrect 
                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 border border-emerald-300 dark:border-emerald-700' 
                    : 'bg-white dark:bg-[#243149] text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-[#2e3e5c] border-2 border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>💡 Explain</span>
              </button>
            </motion.div>
          )}

          {isChecked && !isCorrect && !isReadingChallenge(currentChallenge) ? (
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() => {
                  setShowExplanation(true);
                  soundManager.play('click');
                }}
                className="btn-3d flex-1 py-4 text-base sm:text-lg font-black uppercase tracking-wider bg-white dark:bg-[#243149] text-slate-800 dark:text-white border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#2e3e5c] shadow-[0_4px_0_#E2E8F0] dark:shadow-[0_4px_0_#0f1422] active:translate-y-1 active:shadow-none cursor-pointer rounded-2xl flex items-center justify-center gap-2"
              >
                <span>💡 ASK CHIKOO WHY</span>
              </button>
              <button
                disabled={isTransitioning}
                onClick={() => handleContinue()}
                className="btn-3d flex-1 py-4 text-base sm:text-lg font-black uppercase tracking-wider btn-3d-red cursor-pointer disabled:opacity-50 disabled:pointer-events-none rounded-2xl shadow-[0_6px_0_#c2410c] text-white"
              >
                <span>CONTINUE</span>
              </button>
            </div>
          ) : isReadingChallenge(currentChallenge) ? (
            <div className="flex items-center gap-3 w-full">
              <button
                disabled={isTransitioning}
                onClick={() => handleContinue(true)}
                className="py-4 px-6 rounded-2xl text-base font-extrabold uppercase tracking-wider text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
              >
                Skip
              </button>
              <button
                disabled={isTransitioning}
                onClick={() => handleContinue(true)}
                className="btn-3d flex-1 py-4 text-xl uppercase tracking-wider btn-3d-blue cursor-pointer disabled:opacity-50 disabled:pointer-events-none rounded-2xl shadow-[0_6px_0_#1899d6] text-white"
              >
                <span>CONTINUE</span>
              </button>
            </div>
          ) : (
            <button
              onClick={isChecked ? () => handleContinue() : () => handleCheck()}
              disabled={isTransitioning || !isQuestionTypingComplete || (selectedOption === null && !['spot_the_ai', 'rapid_fire'].includes(currentChallenge?.type))}
              className={`btn-3d w-full py-4.5 text-xl font-display font-black uppercase tracking-wider cursor-pointer rounded-2xl transition-all disabled:opacity-50 disabled:pointer-events-none ${
                (selectedOption === null && !['spot_the_ai', 'rapid_fire'].includes(currentChallenge?.type)) || !isQuestionTypingComplete
                  ? 'bg-slate-200 text-slate-400 shadow-[0_5px_0_#CBD5E1]' 
                  : isChecked 
                    ? isCorrect 
                      ? 'btn-3d-green shadow-[0_8px_0_#059669] text-white' 
                      : 'btn-3d-red shadow-[0_8px_0_#c2410c] text-white'
                    : 'btn-3d-blue shadow-[0_8px_0_#1899d6] text-white'
              }`}
            >
              {isChecked ? 'CONTINUE ➔' : 'CHECK ANSWER'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
