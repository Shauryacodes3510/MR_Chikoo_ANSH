import { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense, startTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Award, Home, BarChart2, User, CheckCircle2, Target, Settings2, Palette, Image as ImageIcon, ChevronRight, Zap, Diamond, Sparkles, Brain, Lock, LogOut, Gift, Building2, Heart } from 'lucide-react';
import { SchoolProvider, useSchool } from './features/student/context/SchoolContext';
import { NavigationProvider } from './features/student/context/NavigationContext';
import { LessonProvider } from './features/student/context/LessonContext';
import Header from './components/Header';
import SplashScreen from './components/SplashScreen';
import ChikooReachingLoader from './components/ChikooReachingLoader';
import LearningPath from './components/LearningPath';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorView from './components/ui/ErrorView';
import ChestIcon from './components/ui/ChestIcon';
import ChikooHomescreen from './components/ChikooHomescreen';
import ConfettiEffect from './components/ConfettiEffect';
import LessonTransition from './components/LessonTransition';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { biomeChannel } from './lib/biomeChannel';
import { useViewport } from './features/student/hooks/useViewport';
import { useNavigation } from './features/student/hooks/useNavigation';
import { useNavigationContext } from './features/student/context/NavigationContext';
import { useLessonContext } from './features/student/context/LessonContext';

// Lazy-loaded components for smart preloading and code splitting
const LessonSession = lazy(() => import('./components/LessonSession'));
const AchievementsGrid = lazy(() => import('./components/AchievementsGrid'));
const ProfileConsistencyChart = lazy(() => import('./components/ProfileConsistencyChart'));
const LessonStudyHub = lazy(() => import('./components/LessonStudyHub'));
const AssessmentHub = lazy(() => import('./components/AssessmentHub'));
const CurriculumStudio = lazy(() => import('./components/CurriculumStudio'));
const Snowfall = lazy(() => import('./components/Snowfall'));
const CelebrationOverlay = lazy(() => import('./components/CelebrationOverlay'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const QuestsView = lazy(() => import('./components/QuestsView'));
const PlayerProfile = lazy(() => import('./components/PlayerProfile'));
const PracticeArenaDashboard = lazy(() => import('./components/PracticeArenaDashboard'));
const ArenaPage = lazy(() => import('./features/arena/pages/ArenaPage'));
const RewardsStore = lazy(() => import('./components/RewardsStore'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const SchoolAdminDashboard = lazy(() => import('./components/SchoolAdminDashboard'));
const AuthScreen = lazy(() => import('./components/AuthScreen'));
const ChikooCinematicModal = lazy(() => import('./components/ChikooCinematicModal'));
const CookieWheel = lazy(() => import('./components/CookieWheel'));
const DesktopLandingPage = lazy(() => import('./components/desktop/DesktopLandingPage'));
import { DesktopLeftSidebar } from './components/desktop/DesktopLeftSidebar';
import { DesktopRightPanel } from './components/desktop/DesktopRightPanel';
import { generateSpinReference, rpcSyncEnergy, rpcAdjustEnergy } from './lib/supabaseRewards';
import SeoPageRouter from './components/seo/SeoPageRouter';
import { schoolService, School } from './lib/schoolService';
import { useLearningPathsAndPacksQuery } from './hooks/useLearningPathsAndPacksQuery';
import { getBattlePoolsAsync, getChallengePacksAsync, getPuzzlePacksAsync, getRankFromTrophies, getChallengePacks, getPuzzlePacks, ChallengePack, PuzzlePack, DEFAULT_CHALLENGE_PACKS, ensureUuid, mapChallengePackToLesson } from './lib/practiceStoreNew';
import { getChapter, fetchProductionCurriculum } from './lib/curriculumLoader';
import { getFifteenPremiumChallenges } from './lib/premiumChallengesGenerator';
import { AI_CURRICULUM, Lesson, PRACTICE_CURRICULUM, Challenge, getAdventureNodesForModule } from './lib/content';
import { DAILY_CHALLENGES, syncDailyChallengesWithSupabase, getRequiredWorld1DailyChallenges } from './lib/dailyChallenges';
import { trackQuizResult } from './lib/questionService';
import { trackEvent, startSession, endSession, sendHeartbeat, syncUserProfileToServer } from './lib/intelligence';
import { assertUniqueKeys } from './lib/errorUtils';
import { CelebrationProvider, useCelebration } from './components/CelebrationProvider';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { SessionProvider, useSession } from './components/SessionProvider';
import { TranslationProvider } from './lib/translation/TranslationContext';
import { UserPerformance } from './lib/sessionGenerator';
import { soundManager } from './lib/sounds';
import { AVATARS, THEMES, ALL_BADGES, LEAGUES, MAX_ENERGY } from './constants';
import { LeaderboardEntry, DailyChallenge } from './types';
import { isSupabaseConfigured, getProfile, updateProfile, SupabaseUserProfile, supabase, getAllUserProfiles, logChallengeCompletion, getModuleLearningPath, ModuleLearningPathNode, getWorlds, getUserWorldProgress, World, UserWorldProgress, saveUserWorldProgress, WORLD_1_UUID, WORLD_2_UUID, WORLD_3_UUID } from './lib/supabase';
import { progressService } from './lib/progressService';
import { DailyStreakAnimation } from './components/DailyStreakAnimation';
import { rewardService } from './lib/rewardService';
import { getRewardsAsync } from './lib/rewardsStore';
import { preloadNextLesson } from './lib/lessonPreloader';
import { preloadCriticalHomepageAssets } from './lib/homepagePreloader';
import { 
  getStoredCompletedLessonIds, 
  saveStoredCompletedLessonsBatch, 
  saveStoredLessonCompletion,
  onLessonProgressUpdated 
} from './lib/lessonProgressStorage';

// Bottom Navbar WebP Icons for Universal Compatibility
import homeIcon from '@/home_icon.webp';
import practiceIcon from '@/practice_icon.webp';
import questIcon from '@/Quest.webp';
import ranksIcon from '@/leaderboard_icon.webp';
import rewardsIcon from '@/chest1.webp';
import avatarIcon from '@/avatar.webp';

const REGEN_TIME_PER_UNIT = 60 * 60 * 1000; // 1 hour per energy unit
const ENERGY_GAIN_REWARD = 5;
const COST_PER_QUESTION = 1;
const REFILL_GEM_COST = 500;
const STREAK_BONUS = 2;
const MIN_STREAK_FOR_BONUS = 3;

interface Badge {
  id: string;
  name: string;
  requirement: string;
  icon: any;
  color: string;
}

const BADGES: Badge[] = [
  { id: 'b1', name: 'AI Explorer', requirement: 'Complete all Grade 6 lessons', icon: Star, color: 'text-chikoo-blue-500' },
  { id: 'b2', name: 'Algorithm Ace', requirement: 'Sort 10 sequences correctly', icon: Award, color: 'text-chikoo-red-500' },
  { id: 'b3', name: 'Data Detective', requirement: 'Complete all 4 data unit lessons', icon: BarChart2, color: 'text-chikoo-blue-400' },
  { id: 'b4', name: 'Ethics Champion', requirement: 'Complete all Scenario Quests', icon: CheckCircle2, color: 'text-duo-green' },
  { id: 'b5', name: 'AI Master', requirement: 'Complete the Final Quiz', icon: Trophy, color: 'text-yellow-500' }
];

const isUserAdmin = (email: string | null) => {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  return lower === 'shaurya@leapstartup.com' || 
         lower === 'shauryagaikwad514@gmail.com';
};

export default function App() {
  return (
    <AuthProvider>
      <CelebrationProvider>
        <SchoolProvider>
          <NavigationProvider>
            <LessonProvider>
              <SessionProvider>
                <TranslationProvider>
                  <div className="w-full min-h-[100dvh] h-full">
                    <AppContentWrapper />
                  </div>
                </TranslationProvider>
              </SessionProvider>
            </LessonProvider>
          </NavigationProvider>
        </SchoolProvider>
      </CelebrationProvider>
    </AuthProvider>
  );
}

function AppContentWrapper() {
  return <AppContent />;
}

function AppContent() {
  const { activeCelebration, triggerCelebration, addSocialActivity } = useCelebration();
  const { sessionUser, authUserId, setSessionUser, isRestoringSession, logout } = useAuth();
  const { showOnboarding, setShowOnboarding, showWelcomeCinematic, setShowWelcomeCinematic } = useSession();
  const { isSchoolAdminActive, setIsSchoolAdminActive, schoolInfo, setSchoolInfo, isSchoolAccount, setIsSchoolAccount } = useSchool();
  const [isDbAdmin, setIsDbAdmin] = useState<boolean>(false);
  const [onboardingVersion, setOnboardingVersion] = useState(0);

  const isDesktop = useViewport();
  const { currentPath, navigateTo } = useNavigation();

  const isSeoPath = (pathname: string) => {
    const p = pathname.toLowerCase().split('?')[0].replace(/\/+$/, '') || '/';
    return p === '/what-is-chikoo' || p === '/about' || p === '/privacy-policy' || p === '/delete-account' || p.startsWith('/units') || p.startsWith('/features') || p.startsWith('/learn');
  };

  // Sync school context for teacher / school admin
  // STRICT RULE: Only authenticated Supabase user with a matching record in public.schools where:
  // schools.auth_user_id = auth.uid() AND schools.status = 'active'.
  // Do NOT use profiles.is_admin, profiles.role, username, email format, or LocalStorage.
  useEffect(() => {
    let isMounted = true;
    async function checkSchoolContext() {
      if (!sessionUser || !authUserId) {
        if (isMounted) {
          setSchoolInfo(null);
          setIsSchoolAccount(false);
          setIsSchoolAdminActive(false);
        }
        return;
      }
      try {
        const matched = await schoolService.getSchoolByAuthUserId(authUserId);
        if (!isMounted) return;

        if (matched && matched.auth_user_id === authUserId && matched.status === 'active') {
          setSchoolInfo(matched);
          setIsSchoolAccount(true);
        } else {
          setSchoolInfo(null);
          setIsSchoolAccount(false);
          setIsSchoolAdminActive(false);
        }
      } catch (err) {
        console.warn('Could not sync school context:', err);
        if (isMounted) {
          setSchoolInfo(null);
          setIsSchoolAccount(false);
          setIsSchoolAdminActive(false);
        }
      }
    }
    checkSchoolContext();
    return () => { isMounted = false; };
  }, [sessionUser, authUserId]);

  // Route & URL Guard: prevent manual portal URL / hash bypass if not an authorized active school account
  useEffect(() => {
    const handleUrlCheck = () => {
      const hash = window.location.hash.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const isPortalRouteRequested = hash.includes('school-portal') || hash.includes('school-admin') || params.get('portal') === 'school' || params.get('view') === 'school';
      
      if (isPortalRouteRequested) {
        if (isSchoolAccount && schoolInfo && schoolInfo.status === 'active') {
          setIsSchoolAdminActive(true);
        } else {
          setIsSchoolAdminActive(false);
          if (hash.includes('school')) {
            window.location.hash = '';
          }
          if (params.has('portal') || params.get('view') === 'school') {
            params.delete('portal');
            if (params.get('view') === 'school') params.delete('view');
            const newSearch = params.toString();
            const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
            window.history.replaceState(null, '', newUrl);
          }
        }
      }
    };

    handleUrlCheck();
    window.addEventListener('hashchange', handleUrlCheck);
    window.addEventListener('popstate', handleUrlCheck);
    return () => {
      window.removeEventListener('hashchange', handleUrlCheck);
      window.removeEventListener('popstate', handleUrlCheck);
    };
  }, [isSchoolAccount, schoolInfo]);

  // Pre-warm critical interaction chunks in idle time so "Start Lesson" encounters zero JS compilation delay
  useEffect(() => {
    const prewarmChunks = () => {
      import('./components/LessonSession');
    };
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(prewarmChunks, { timeout: 2500 });
      } else {
        setTimeout(prewarmChunks, 1200);
      }
    }
  }, []);

  const handleLoginSuccess = useCallback((email: string, isNewSignup?: boolean) => {
    const cleanEmail = email.toLowerCase().trim();
    localStorage.setItem(`chikoo_onboarding_completed_${cleanEmail}`, 'true');
    if (isNewSignup) {
      localStorage.setItem(`chikoo_new_signup_${cleanEmail}`, 'true');
      setShowWelcomeCinematic(true);
    }
    localStorage.setItem('CHIKOO_SESSION_USER', cleanEmail);
    setSessionUser(cleanEmail);
    setOnboardingVersion(prev => prev + 1);
    setView('home');
    if (window.innerWidth >= 1024) {
      window.history.pushState(null, '', '/app');
      navigateTo('/app');
    }
  }, [setSessionUser]);

  const handleWelcomeVideoComplete = useCallback(async () => {
    setShowWelcomeCinematic(false);
    const cleanEmail = (sessionUser || '').toLowerCase().trim();
    if (cleanEmail) {
      localStorage.setItem(`chikoo_welcome_video_seen_${cleanEmail}`, 'true');
      localStorage.removeItem(`chikoo_new_signup_${cleanEmail}`);
      try {
        await progressService.recordFirstInteraction(cleanEmail);
        await progressService.recordUserInteraction('welcome_video_complete');
        await updateProfile(cleanEmail, { welcome_video_seen: true });
      } catch (e) {
        console.warn("Could not persist welcome_video_seen in database:", e);
      }
    }
  }, [sessionUser]);

  // Proactively record the very first user interaction in Supabase for new signups
  useEffect(() => {
    const handleFirstInteraction = () => {
      const email = sessionUser || (typeof localStorage !== 'undefined' ? localStorage.getItem('CHIKOO_SESSION_USER') : null);
      if (email) {
        const cleanEmail = email.toLowerCase().trim();
        const isNewSignup = typeof localStorage !== 'undefined' && (
          localStorage.getItem(`chikoo_new_signup_${cleanEmail}`) === 'true' ||
          !localStorage.getItem(`chikoo_first_interaction_recorded_${cleanEmail}`)
        );
        if (isNewSignup) {
          progressService.recordFirstInteraction(cleanEmail);
        }
      }
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { capture: true, once: true, passive: true });
    window.addEventListener('keydown', handleFirstInteraction, { capture: true, once: true, passive: true });
    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction, true);
      window.removeEventListener('keydown', handleFirstInteraction, true);
    };
  }, [sessionUser]);

  // Allow replaying or testing the welcome video anytime
  useEffect(() => {
    const handleReplay = () => setShowWelcomeCinematic(true);
    window.addEventListener('chikoo:play_welcome_video', handleReplay);
    return () => window.removeEventListener('chikoo:play_welcome_video', handleReplay);
  }, []);

  // Synchronize and validate with live Supabase session on mount (deferred)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        syncDailyChallengesWithSupabase();
      } catch (e) {
        console.warn("Could not sync daily challenges during app mount:", e);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const [curriculumVersion, setCurriculumVersion] = useState(0);
  const [isAdminActive, setIsAdminActive] = useState(false);

  // Realtime dynamic curriculum state updates (deferred channel setup)
  useEffect(() => {
    const handleCurriculumChange = () => {
      setCurriculumVersion(prev => prev + 1);
      const len = AI_CURRICULUM.length || 5;
      const ops = new Array(len).fill(0);
      if (ops.length > 0) ops[0] = 1;
      biomeChannel.emit(ops);
    };
    window.addEventListener('curriculumChanged', handleCurriculumChange);

    let modulesChannel: any = null;
    let lessonsChannel: any = null;

    const timer = setTimeout(() => {
      if (isSupabaseConfigured && supabase) {
        modulesChannel = supabase
          .channel('modules-realtime-sync')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'modules' }, async () => {
            try {
              await fetchProductionCurriculum();
            } catch (e) {
              console.error("Realtime modules update failed", e);
            }
          })
          .subscribe();

        lessonsChannel = supabase
          .channel('lessons-realtime-sync')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, async () => {
            try {
              await fetchProductionCurriculum();
            } catch (e) {
              console.error("Realtime lessons update failed", e);
            }
          })
          .subscribe();
      }
    }, 1200);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('curriculumChanged', handleCurriculumChange);
      if (modulesChannel && supabase) {
        supabase.removeChannel(modulesChannel);
      }
      if (lessonsChannel && supabase) {
        supabase.removeChannel(lessonsChannel);
      }
    };
  }, []);

  const { view, setView } = useNavigationContext();

  // React Query-style caching and memoized data layer for learning paths and challenge/puzzle packs
  const {
    dbLearningPaths,
    challengePacks,
    puzzlePacks
  } = useLearningPathsAndPacksQuery(AI_CURRICULUM, curriculumVersion, {
    staleTime: 5 * 60 * 1000,
    deferRemainingMs: 300
  });

  // Merge standard curriculum lessons, challenges, treasures, and boss battles into a continuous adventure list
  const adventureModules = useMemo(() => {
    return AI_CURRICULUM.map(m => {
      const lessons = getAdventureNodesForModule(m, dbLearningPaths[m.id], challengePacks, puzzlePacks);
      assertUniqueKeys(lessons, l => l.id, `AdventureModule(${m.id})`);
      return {
        ...m,
        lessons
      };
    });
  }, [curriculumVersion, dbLearningPaths, challengePacks, puzzlePacks]);
  const [isInBattleRecap, setIsInBattleRecap] = useState(false);
  const [isPracticeActivityActive, setIsPracticeActivityActive] = useState(false);
  const handleBattleStageChange = useCallback((stage: 'lobby' | 'matchmaking' | 'combat' | 'recap') => {
    setIsInBattleRecap(stage !== 'lobby');
  }, []);
  const [profileSubView, setProfileSubView] = useState<'main' | 'customize'>('main');
  const [showDossier, setShowDossier] = useState(false);
  const [xp, setXp] = useState(0);
  const [weeklyXp, setWeeklyXp] = useState(0);
  const [gems, setGems] = useState(0);
  const [streak, setStreak] = useState(0);
  const [trophies, setTrophies] = useState(0);
  const [energy, setEnergy] = useState(MAX_ENERGY);
  const [lastEnergyRefill, setLastEnergyRefill] = useState<number>(Date.now());
  const energyRef = useRef<number>(MAX_ENERGY);
  energyRef.current = energy;
  const energySyncingRef = useRef(false);
  const [accuracy, setAccuracy] = useState(1.0); // Default to 100%
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    return getStoredCompletedLessonIds(null);
  });
  const [bookmarkedLessons, setBookmarkedLessons] = useState<string[]>([]);
  const [completedDailyChallenges, setCompletedDailyChallenges] = useState<string[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const { activeLesson, setActiveLesson, activeStudyLesson, setActiveStudyLesson } = useLessonContext();
  const [loadingLesson, setLoadingLesson] = useState<Lesson | null>(null);
  const isUnlockingWorld2Ref = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__IS_LESSON_ACTIVE = !!activeLesson;
    }
  }, [activeLesson]);

  const openLessonWithPreload = useCallback((lesson: Lesson | null) => {
    if (!lesson) {
      console.log("[openLessonWithPreload] Resetting active/loading lesson to null");
      setActiveLesson(null);
      setLoadingLesson(null);
      return;
    }
    console.log(`[openLessonWithPreload] Initiating lesson load: ID="${lesson.id}", Title="${lesson.title}", ChallengesCount=${lesson.challenges?.length || 0}`);
    setLoadingLesson(lesson);
  }, []);
  const [adventureLauncher, setAdventureLauncher] = useState<{
    type: 'challenge' | 'treasure' | 'guardian';
    moduleId: string;
    nodeId: string;
  } | null>(null);
  const [lastXpEarned, setLastXpEarned] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [bestAnswerStreak, setBestAnswerStreak] = useState(0);
  const [lastChestClaimedAt, setLastChestClaimedAt] = useState<string | null>(null);
  const dailyChestClaimed = useMemo(() => {
    if (!lastChestClaimedAt) return false;
    const lastClaim = new Date(lastChestClaimedAt).getTime();
    return (Date.now() - lastClaim) < 24 * 60 * 60 * 1000;
  }, [lastChestClaimedAt]);
  const [totalChestsClaimed, setTotalChestsClaimed] = useState(0);
  const [chargingAnimation, setChargingAnimation] = useState<{ text: string; id: number } | null>(null);
  const [isRegeneratingEnergy, setIsRegeneratingEnergy] = useState(false);
  const [showGlobalConfetti, setShowGlobalConfetti] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showCookieWheelModal, setShowCookieWheelModal] = useState(false);
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);
  const [showEnergyRefillModal, setShowEnergyRefillModal] = useState(false);
  const [showDailyStreakAnimation, setShowDailyStreakAnimation] = useState(false);

  useEffect(() => {
    const handleTestStreakEvent = () => {
      setShowDailyStreakAnimation(true);
    };
    window.addEventListener('chikooTestStreakAnimation', handleTestStreakEvent);
    return () => window.removeEventListener('chikooTestStreakAnimation', handleTestStreakEvent);
  }, []);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isProfileReady, setIsProfileReady] = useState(false);
  const [curriculumLoaded, setCurriculumLoaded] = useState(false);
  const [localCurriculumError, setLocalCurriculumError] = useState<any>(null);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [showAppSplash, setShowAppSplash] = useState(true);
  const [isQuestDetailsOpen, setIsQuestDetailsOpen] = useState(false);
  const isCompletingLessonRef = useRef<string | null>(null);

  useEffect(() => {
    const handleCurriculumError = () => {
      import('./lib/content').then(({ curriculumLoadError }) => {
        if (curriculumLoadError) {
          setLocalCurriculumError(curriculumLoadError);
        }
      });
    };
    window.addEventListener('curriculumError', handleCurriculumError);
    return () => {
      window.removeEventListener('curriculumError', handleCurriculumError);
    };
  }, []);

  // Worlds State
  const [worlds, setWorlds] = useState<World[]>([]);
  const [selectedWorldId, setSelectedWorldId] = useState<string>(WORLD_1_UUID);
  const [userWorldProgress, setUserWorldProgress] = useState<UserWorldProgress[]>([]);
  const [isLoadingWorlds, setIsLoadingWorlds] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadWorldData() {
      setIsLoadingWorlds(true);
      try {
        const [fetchedWorlds, fetchedProgress] = await Promise.all([
          getWorlds(),
          getUserWorldProgress(authUserId || undefined)
        ]);
        if (isMounted) {
          setWorlds(fetchedWorlds);
          setUserWorldProgress(fetchedProgress);
          if (fetchedWorlds && fetchedWorlds.length > 0) {
            const w1 = fetchedWorlds.find(w => w.world_number === 1 || w.id === WORLD_1_UUID) || fetchedWorlds[0];
            setSelectedWorldId(prev => (prev && fetchedWorlds.some(w => w.id === prev)) ? prev : w1.id);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch world data:', err);
      } finally {
        if (isMounted) setIsLoadingWorlds(false);
      }
    }
    loadWorldData();
    return () => { isMounted = false; };
  }, [sessionUser, authUserId]);

  // Real readiness metrics tracking the 4 pillars of the Learning Path
  const [assetProgress, setAssetProgress] = useState(0); // 0 to 1 (Weight: 35%)
  const [profileProgress, setProfileProgress] = useState(0); // 0 to 1 (Weight: 35%)
  const [curriculumProgress, setCurriculumProgress] = useState(0.5); // 0 to 1 (Weight: 20%)
  const [shellMounted, setShellMounted] = useState(false); // 0 or 1 (Weight: 10%)

  // Mount detection for the initial learning path shell
  useEffect(() => {
    setShellMounted(true);
  }, []);

  // Preload critical homepage assets (Unit 1 backdrop, dock icons, status icons, fonts)
  useEffect(() => {
    let active = true;
    preloadCriticalHomepageAssets((assetPct) => {
      if (active) {
        setAssetProgress(assetPct / 100);
      }
    }).then(() => {
      if (active) {
        setAssetProgress(1);
        setAssetsLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Synchronize profile readiness progress with auth & session state
  useEffect(() => {
    if (isRestoringSession) {
      setProfileProgress(0.1);
      return;
    }
    if (!sessionUser) {
      // Guest or unauthenticated user - profile is immediately complete
      setProfileProgress(1.0);
      setDataLoaded(true);
      setIsProfileReady(true);
      return;
    }
    if (isProfileReady) {
      setProfileProgress(1.0);
    } else {
      setProfileProgress(0.4);
    }
  }, [isRestoringSession, sessionUser, isProfileReady]);

  // Synchronize curriculum readiness with active unit metadata
  useEffect(() => {
    if (curriculumLoaded) {
      setCurriculumProgress(1.0);
    } else if (dbLearningPaths[AI_CURRICULUM[0]?.id]) {
      setCurriculumProgress(0.85);
    } else {
      setCurriculumProgress(0.5);
    }
  }, [curriculumLoaded, dbLearningPaths]);

  // Pure mathematical aggregation of the 4 real readiness pillars
  const realProgress = useMemo(() => {
    const assetScore = assetProgress * 35;
    const profileScore = profileProgress * 35;
    const curriculumScore = curriculumProgress * 20;
    const shellScore = (shellMounted ? 1 : 0) * 10;
    const total = Math.round(assetScore + profileScore + curriculumScore + shellScore);
    return Math.min(100, Math.max(0, total));
  }, [assetProgress, profileProgress, curriculumProgress, shellMounted]);

  // Monotonically non-decreasing display progress for smooth presentation
  const [splashProgress, setSplashProgress] = useState(0);
  useEffect(() => {
    setSplashProgress(prev => Math.max(prev, realProgress));
  }, [realProgress]);

  // Real readiness gate: 100% real readiness or all core elements verified
  const isSplashReady = useMemo(() => {
    if (isRestoringSession) return false;
    if (sessionUser) {
      return isProfileReady && ((realProgress >= 100) || (assetsLoaded && dataLoaded && curriculumLoaded));
    }
    return (realProgress >= 100) || assetsLoaded;
  }, [isRestoringSession, sessionUser, isProfileReady, realProgress, assetsLoaded, dataLoaded, curriculumLoaded]);

  // Context-aware real status text shown on splash bar
  const splashStatusText = useMemo(() => {
    if (isSplashReady || realProgress >= 98) return "Ready to explore!";
    if (assetProgress < 0.85) return "Loading visual world…";
    if (profileProgress < 0.85) return "Connecting your profile…";
    if (curriculumProgress < 0.85) return "Preparing your learning adventure…";
    return "Finalizing your adventure…";
  }, [isSplashReady, realProgress, assetProgress, profileProgress, curriculumProgress]);

  // Background loading of next lesson: strictly runs AFTER splash is dismissed
  useEffect(() => {
    if (!showAppSplash && curriculumLoaded && dataLoaded && adventureModules.length > 0) {
      const activeUncompleted = adventureModules
        .flatMap(m => m.lessons || [])
        .find(l => l && !completedLessons.includes(l.id));
      if (activeUncompleted) {
        const timeout = setTimeout(() => {
          preloadNextLesson(activeUncompleted);
        }, 1200);
        return () => clearTimeout(timeout);
      }
    }
  }, [showAppSplash, curriculumLoaded, dataLoaded, completedLessons.length, adventureModules.length]);

  // Synchronize Unit 2 (morning.mp3) background ambient loops
  useEffect(() => {
    if (activeLesson) {
      const isUnit2Lesson = activeLesson.id.includes('unit_2') || 
                            activeLesson.id.includes('unit2') || 
                            activeLesson.id.includes('lesson-2') ||
                            adventureModules[1]?.lessons?.some(l => l.id === activeLesson.id);
      soundManager.updateUnit2Ambient(!!isUnit2Lesson, isUnit2Lesson ? 1 : 0);
      return;
    }

    if (activeStudyLesson) {
      const isUnit2Study = activeStudyLesson.id.includes('unit_2') || 
                           activeStudyLesson.id.includes('unit2') || 
                           adventureModules[1]?.lessons?.some(l => l.id === activeStudyLesson.id);
      soundManager.updateUnit2Ambient(!!isUnit2Study, isUnit2Study ? 1 : 0);
      return;
    }

    if (view === 'home' && !isAdminActive && !showSignOutConfirm && !isInBattleRecap && !isPracticeActivityActive && !showWelcomeCinematic) {
      const ops = biomeChannel.getOpacities();
      const unit2Opacity = ops[1] !== undefined ? ops[1] : 0;
      soundManager.updateUnit2Ambient(true, unit2Opacity);
    } else {
      soundManager.updateUnit2Ambient(false, 0);
    }
  }, [view, activeLesson, activeStudyLesson, isAdminActive, showSignOutConfirm, isInBattleRecap, isPracticeActivityActive, adventureModules, showWelcomeCinematic]);
  const [isPlus, setIsPlus] = useState(() => {
    try {
      const saved = localStorage.getItem('CHIKOO_IS_PLUS');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const handleTogglePlus = () => {
    const nextVal = !isPlus;
    setIsPlus(nextVal);
    try {
      localStorage.setItem('CHIKOO_IS_PLUS', String(nextVal));
    } catch {}
  };

  // Leaderboard & Leagues State
  const [currentLeagueId, setCurrentLeagueId] = useState('bronze');
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardEntry[]>(() => {
    try {
      const cached = localStorage.getItem('CHIKOO_CACHED_LEADERBOARD');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [allProfiles, setAllProfiles] = useState<SupabaseUserProfile[]>([]);
  
  const userRank = useMemo(() => {
    const sorted = [...weeklyLeaderboard].sort((a, b) => b.xp - a.xp);
    const idx = sorted.findIndex(e => e.isCurrentUser);
    return idx !== -1 ? idx + 1 : 12;
  }, [weeklyLeaderboard]);
  
  // Customization State
  const [selectedAvatarId, setSelectedAvatarId] = useState('user');
  const [selectedThemeId, setSelectedThemeId] = useState('blue');
  const [totalStepsClaimed, setTotalStepsClaimed] = useState(0);

  // Dynamic User Personalizations States
  const [username, setUsername] = useState<string>('Shaurya Talks');
  const [spaceMotto, setSpaceMotto] = useState<string>('Ready to learn AI concepts across the galaxies! 🪐');
  const [spaceTitle, setSpaceTitle] = useState<string>('Solar Cadet');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingMotto, setIsEditingMotto] = useState(false);
  // Dark Mode State & Synchronization
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('CHIKOO_THEME_MODE') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleThemeChange = (e: any) => {
      const mode = e.detail?.mode || (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      setIsDarkMode(mode === 'dark');
    };
    window.addEventListener('chikoo:theme_change', handleThemeChange);
    return () => window.removeEventListener('chikoo:theme_change', handleThemeChange);
  }, []);

  // Apply theme classes/variables
  useEffect(() => {
    const theme = THEMES.find(t => t.id === selectedThemeId) || THEMES[0];
    document.documentElement.style.setProperty('--theme-primary', theme.primary);
    document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
    document.documentElement.style.setProperty('--theme-shadow', theme.shadow);
  }, [selectedThemeId]);

  // If navigating away from practice, reset battle recap so dock stays active
  useEffect(() => {
    if (view !== 'practice') {
      setIsInBattleRecap(false);
    }
  }, [view]);

  const currentAvatar = useMemo(() => 
    AVATARS.find(a => a.id === selectedAvatarId) || AVATARS[0]
  , [selectedAvatarId]);

  // Subscribe to real-time progress updates from progressService
  useEffect(() => {
    if (!sessionUser) return;
       const unsubscribe = progressService.subscribe((profile) => {
      setXp(profile.xp || 0);
      setWeeklyXp(profile.weekly_xp);
      setGems(profile.gems);
      setStreak(profile.streak);
      setAccuracy(profile.accuracy);

      // Energy: server calculates hourly regen (sync_energy). Show profile value first, then confirm from server.
      setEnergy(profile.energy ?? MAX_ENERGY);
      rpcSyncEnergy().then(res => {
        if (res.success) {
          setEnergy(res.energy);
          setLastEnergyRefill(res.lastEnergyRefillAt ?? Date.now());
        } else {
          setLastEnergyRefill(Date.now());
        }
      });
      const localStored = getStoredCompletedLessonIds(sessionUser);
      const combinedCompleted = [...new Set([
        ...localStored,
        ...(profile.completed_lessons || []),
        ...(profile.completed_lessons || []).map(id => id.startsWith('practice_') ? id : `practice_${id}`),
        ...(profile.completed_daily_challenges || []).map(id => id.startsWith('practice_') ? id : `practice_${id}`),
        ...(profile.completed_daily_challenges || []).map(id => id.replace(/^practice_/, ''))
      ])];
      saveStoredCompletedLessonsBatch(combinedCompleted, sessionUser);
      setCompletedLessons(combinedCompleted);
      setBookmarkedLessons(profile.bookmarked_lessons);
      setCompletedDailyChallenges(profile.completed_daily_challenges);
      setProfileId(profile.id ?? null);
      setSelectedAvatarId(profile.avatar_id);
      setSelectedThemeId(profile.theme_id);
      setBestAnswerStreak(profile.best_streak);
      setTotalChestsClaimed(profile.total_chests_claimed);
      setLastChestClaimedAt(profile.last_chest_claimed_at ?? null);
      setTotalStepsClaimed(profile.total_steps_claimed);
      setTrophies(profile.trophies ?? 0);
      setIsDbAdmin(!!profile.is_admin);
      setUsername(profile.username || 'Shaurya Talks');

      // Keep leaderboard entry in sync with confirmed profile.gems
      setWeeklyLeaderboard(prev => {
        const next = prev.map(entry => 
          entry.isCurrentUser 
            ? { ...entry, xp: profile.gems, name: profile.username || entry.name }
            : entry
        );
        next.sort((a, b) => b.xp - a.xp);
        return next.map((e, idx) => ({ ...e, rank: idx + 1 }));
      });
    });
    return unsubscribe;
  }, [sessionUser]);

  // Synchronize completed lessons from local storage immediately on mount/session switch
  useEffect(() => {
    if (sessionUser) {
      const stored = getStoredCompletedLessonIds(sessionUser);
      if (stored && stored.length > 0) {
        setCompletedLessons(prev => Array.from(new Set([...prev, ...stored])));
      }
    }
  }, [sessionUser]);

  // Listen to window event for lesson progress updates across components/tabs
  useEffect(() => {
    return onLessonProgressUpdated(({ email, completedLessons: updatedLessons }) => {
      if (!sessionUser || email === sessionUser.toLowerCase().trim() || email === 'guest') {
        setCompletedLessons(prev => Array.from(new Set([...prev, ...updatedLessons])));
      }
    });
  }, [sessionUser]);

  // Load profile from Supabase dynamically on login / load via ProgressService
  useEffect(() => {
    if (isRestoringSession) {
      // Hold bootstrap sequence until Supabase auth restoration has determined sessionUser state
      return;
    }

    if (!sessionUser) {
      console.log("[DATA_INIT] bootstrap: Guest mode (no session user). UI initialized.");
      setDataLoaded(true);
      setCurriculumLoaded(true);
      return;
    }

    let isMounted = true;
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
    const screenDim = typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown';
    console.log(`[DATA_INIT] bootstrap sequence started for ${sessionUser} | platform: ${isMobile ? 'mobile' : 'desktop'} (${screenDim})`);
    
    // Optimistically keep dataLoaded and isProfileReady true if we already have a loaded profile in progressService
    const existingProfile = progressService.getProfile();
    const hasCachedData = existingProfile && existingProfile.email === sessionUser;
    if (!hasCachedData) {
      setDataLoaded(false);
      setIsProfileReady(false);
    } else {
      setIsProfileReady(true);
    }

    // Failsafe timer: ensure user is NEVER stuck on loading screen for more than 8.0s
    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setCurriculumLoaded(true);
        setDataLoaded(true);
      }
    }, 8000);

    async function loadData() {
      try {
        if (!authUserId) {
          console.log(`[DATA_INIT] bootstrap blocked: reason=AUTH_USER_ID_MISSING`);
          if (isMounted) {
            setIsProfileReady(false);
            setDataLoaded(true);
            setCurriculumLoaded(true);
          }
          return;
        }

        // Step 1: Initialize profile from Supabase with verified session.user.id (authUserId)
        let profile: SupabaseUserProfile;
        try {
          profile = await progressService.initProfile(sessionUser!, !hasCachedData, authUserId);
        } catch (pErr) {
          console.warn("[App] initProfile error or missing auth user id:", pErr);
          if (isMounted) {
            setIsProfileReady(false);
            setDataLoaded(true);
            setCurriculumLoaded(true);
            console.log(`[DATA_INIT] bootstrap blocked: reason=AUTH_USER_ID_MISSING`);
          }
          return;
        }

        if (!profile || !profile.id || profile.id !== authUserId) {
          console.log(`[DATA_INIT] bootstrap blocked: reason=AUTH_USER_ID_MISSING (profile id mismatch: profiles.id=${profile?.id}, authUserId=${authUserId})`);
          if (isMounted) {
            setIsProfileReady(false);
            setDataLoaded(true);
            setCurriculumLoaded(true);
          }
          return;
        }

        if (isMounted) {
          setIsProfileReady(true);
          console.log(`[DATA_INIT] profileReady reached: true | session.user.id (${authUserId}) -> profiles.id (${profile.id}) | match: true | gems: ${profile.gems} | completed: ${profile.completed_lessons?.length || 0}`);
        }

        // Step 2: Downstream user-data initialization starts strictly AFTER profile is ready:
        // Sync custom modules and lessons from database
        try {
          await fetchProductionCurriculum();
          setCurriculumVersion(prev => prev + 1);
        } catch (syncErr: any) {
          console.error("Critical: Curriculum database fetch failed:", syncErr);
          setLocalCurriculumError(syncErr);
        }

        // Concrete preload of rewards
        try {
          await getRewardsAsync();
        } catch (rErr) {
          console.warn("Rewards preload inside loadData failed:", rErr);
        }

        // Concrete preload of challenge and puzzle packs
        try {
          await Promise.allSettled([
            getChallengePacksAsync(),
            getPuzzlePacksAsync()
          ]);
        } catch (packErr) {
          console.warn("Challenge/Puzzle packs preload inside loadData failed:", packErr);
        }

        if (isMounted) {
          // Check onboarding status for returning vs new users
          const cleanEmail = profile.email.toLowerCase().trim();
          const hasNickname = !!localStorage.getItem(`CHIKOO_USER_NICKNAME_${cleanEmail}`);
          const hasGrade = !!localStorage.getItem(`CHIKOO_USER_GRADE_${cleanEmail}`);
          const hasReason = !!localStorage.getItem(`CHIKOO_USER_REASON_${cleanEmail}`);
          const hasOnboardingData = !!localStorage.getItem(`CHIKOO_ONBOARDING_DATA_${cleanEmail}`);
          const isCompleted = localStorage.getItem(`chikoo_onboarding_completed_${cleanEmail}`) === 'true' || profile.onboarding_completed === true;
          const hasCompletedLessons = Array.isArray(profile.completed_lessons) && profile.completed_lessons.length > 0;
          const hasXp = typeof profile.xp === 'number' && profile.xp > 0;
          const hasStreak = typeof profile.streak === 'number' && profile.streak > 0;
          
          // For returning database users who already completed onboarding or have actual learning activity
          if (isCompleted || (hasNickname && hasGrade && hasReason) || hasOnboardingData || hasCompletedLessons || hasXp || hasStreak) {
            localStorage.setItem(`chikoo_onboarding_completed_${cleanEmail}`, 'true');
            if (!hasNickname && profile.username) {
              localStorage.setItem(`CHIKOO_USER_NICKNAME_${cleanEmail}`, profile.username);
            }
          }

          const storedMotto = localStorage.getItem(`CHIKOO_USER_MOTTO_${profile.email.toLowerCase()}`);
          if (storedMotto) setSpaceMotto(storedMotto);
          const storedTitle = localStorage.getItem(`CHIKOO_USER_TITLE_${profile.email.toLowerCase()}`);
          if (storedTitle) setSpaceTitle(storedTitle);

          // Check and trigger Daily Streak Animation once per newly earned daily streak / return on a new day
          if (profile.streak && profile.streak > 0) {
            const todayStr = new Date().toLocaleDateString('en-CA');
            const storageKey = `CHIKOO_STREAK_ANIMATION_RECORD_${cleanEmail}`;
            try {
              const raw = localStorage.getItem(storageKey);
              const record = raw ? JSON.parse(raw) : null;
              if (!record || record.date !== todayStr || record.streak < profile.streak) {
                setTimeout(() => {
                  setShowDailyStreakAnimation(true);
                }, 1600);
              }
            } catch (e) {
              setTimeout(() => {
                setShowDailyStreakAnimation(true);
              }, 1600);
            }
          }

          // One-time post-signup welcome video check
          const isNewSignup = localStorage.getItem(`chikoo_new_signup_${cleanEmail}`) === 'true';
          const hasSeenVideoInStorage = localStorage.getItem(`chikoo_welcome_video_seen_${cleanEmail}`) === 'true';
          const hasSeenVideoInProfile = profile.welcome_video_seen === true;

          if (!hasSeenVideoInProfile && !hasSeenVideoInStorage && isNewSignup) {
            setShowWelcomeCinematic(true);
          } else if (hasSeenVideoInProfile) {
            localStorage.setItem(`chikoo_welcome_video_seen_${cleanEmail}`, 'true');
            localStorage.removeItem(`chikoo_new_signup_${cleanEmail}`);
          }

          // Hydrate full database leaderboard for the user
          try {
            const dbProfiles = await getAllUserProfiles();
            if (dbProfiles && dbProfiles.length > 0) {
              setAllProfiles(dbProfiles);
              let mapped: LeaderboardEntry[] = dbProfiles.map((p, idx) => {
                const isMe = Boolean(
                  (p.username && profile.username && p.username.toLowerCase() === profile.username.toLowerCase()) ||
                  (p.email && cleanEmail && p.email.toLowerCase().trim() === cleanEmail)
                );
                const userGems = isMe ? profile.gems : Number(p.gems ?? p.xp ?? 0);
                return {
                  id: p.id || `player_${idx + 1}`,
                  name: isMe ? (usernameRef.current || profile.username || 'Space Explorer') : (p.username || `Explorer ${idx + 1}`),
                  xp: userGems,
                  rank: idx + 1,
                  isCurrentUser: isMe,
                  joinedDate: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
                };
              });

              if (!mapped.some(e => e.isCurrentUser)) {
                mapped.push({
                  id: profile.id || cleanEmail,
                  name: profile.username || usernameRef.current || cleanEmail.split('@')[0],
                  xp: profile.gems,
                  rank: mapped.length + 1,
                  isCurrentUser: true,
                  joinedDate: Date.now()
                });
              }

              mapped.sort((a, b) => b.xp - a.xp);
              mapped = mapped.map((e, idx) => ({ ...e, rank: idx + 1 }));
              setWeeklyLeaderboard(mapped);
              localStorage.setItem('CHIKOO_CACHED_LEADERBOARD', JSON.stringify(mapped));
            }
          } catch (leadErr) {
            console.warn("Leaderboard preload in loadData error:", leadErr);
          }

          console.log(`[DATA_INIT] bootstrap sequence completed successfully for ${sessionUser}. UI hydrated.`);
        }
      } catch (err: any) {
        console.error("[DATA_INIT] error: Supabase profile load failed:", err);
        if (err?.message === 'USER_DELETED_OR_NOT_AUTHENTICATED' || err?.message?.includes('unauthenticated')) {
          console.warn("[App] Active user was deleted or not authenticated in Supabase Auth. Logging out.");
          logout();
          return;
        }
        try {
          await fetchProductionCurriculum();
        } catch (syncErr: any) {
          console.error("Critical: Curriculum database fetch failed in fallback:", syncErr);
          setLocalCurriculumError(syncErr);
        }
      } finally {
        clearTimeout(fallbackTimer);
        if (isMounted) {
          setCurriculumLoaded(true);
          setDataLoaded(true);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
  }, [sessionUser, isRestoringSession, authUserId]);

  // Real-time Student Intelligence & Analytics tracking effects
  useEffect(() => {
    if (sessionUser) {
      startSession(sessionUser);
      return () => {
        endSession(sessionUser);
      };
    }
  }, [sessionUser]);

  // User Profile metadata synchronization to backend analytics (debounced after initial mount)
  useEffect(() => {
    if (!sessionUser) return;
    const timer = setTimeout(() => {
      syncUserProfileToServer({
        email: sessionUser,
        username: username,
        isPlus: true, // Mark active dashboard testers as Premium
        learningStyle: localStorage.getItem(`CHIKOO_PREFERENCE_LEARNING_STYLE_${sessionUser.toLowerCase()}`) || 'Visual',
        country: 'United States',
        school: 'Pinecrest Academy',
        className: 'Grade 8'
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [sessionUser, username]);

  // Periodic active user heartbeat interval to server (starts smoothly after initial render)
  useEffect(() => {
    if (!sessionUser) return;

    const initialTimer = setTimeout(() => {
      sendHeartbeat(sessionUser, window.location.pathname, `Viewing ${view || 'Dashboard'}`, 'Web / Desktop', 'Chrome');
    }, 4000);

    const interval = setInterval(() => {
      sendHeartbeat(sessionUser, window.location.pathname, `Viewing ${view || 'Dashboard'}`, 'Web / Desktop', 'Chrome');
    }, 35000); // 35 seconds heartbeat interval

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [sessionUser, view]);

  useEffect(() => {
    if (view && sessionUser) {
      const screenLabel = view.charAt(0).toUpperCase() + view.slice(1) + ' Opened';
      trackEvent(screenLabel, {
        screen_visit_count: 1,
        most_visited_screen: view,
      }, sessionUser);
    }
  }, [view, sessionUser]);

  useEffect(() => {
    if (activeLesson && sessionUser) {
      trackEvent('Lesson Started', {
        lesson_name: activeLesson.title,
        lesson_id: activeLesson.id,
      }, sessionUser);
    }
  }, [activeLesson, sessionUser]);

  const gemsRef = useRef(gems);
  const usernameRef = useRef(username);
  useEffect(() => {
    gemsRef.current = gems;
  }, [gems]);
  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  // Realtime subscription and initial load for leaderboard data from profiles database table
  useEffect(() => {
    let isMounted = true;

    async function loadRealtimeLeaderboard() {
      try {
        const profiles = await getAllUserProfiles();
        const currentProfile = progressService.getProfile();
        const confirmedGems = currentProfile?.gems;
        const currentEmail = sessionUser ? sessionUser.toLowerCase().trim() : '';

        if (isMounted) {
          setAllProfiles(profiles);
          let mapped: LeaderboardEntry[] = profiles.map((p, idx) => {
            const isMe = currentEmail ? p.email.toLowerCase().trim() === currentEmail : false;
            const userGems = isMe && confirmedGems !== undefined ? confirmedGems : Number(p.gems ?? 0);
            return {
              id: p.id || p.email,
              name: (isMe && (usernameRef.current || currentProfile?.username)) ? (usernameRef.current || currentProfile?.username || '') : (p.username || p.email.split('@')[0]),
              xp: userGems,
              rank: idx + 1,
              isCurrentUser: isMe,
              joinedDate: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
            };
          });

          // Ensure authenticated user is included in the leaderboard with their confirmed gems
          if (sessionUser && !mapped.some(e => e.isCurrentUser)) {
            mapped.push({
              id: currentProfile?.id || sessionUser,
              name: currentProfile?.username || usernameRef.current || sessionUser.split('@')[0],
              xp: confirmedGems !== undefined ? confirmedGems : gemsRef.current,
              rank: mapped.length + 1,
              isCurrentUser: true,
              joinedDate: Date.now()
            });
          }

          // Sort by xp (profiles.gems) descending and re-assign clean ranks
          mapped.sort((a, b) => b.xp - a.xp);
          mapped = mapped.map((m, idx) => ({ ...m, rank: idx + 1 }));

          setWeeklyLeaderboard(mapped);
          try {
            localStorage.setItem('CHIKOO_CACHED_LEADERBOARD', JSON.stringify(mapped));
          } catch {}
        }
      } catch (err) {
        console.error("Error loading realtime database leaderboard:", err);
      }
    }

    loadRealtimeLeaderboard();

    // Re-fetch confirmed leaderboard immediately on reward grant or profile update events
    const handleRewardOrUpdate = () => {
      loadRealtimeLeaderboard();
    };
    window.addEventListener('chikooRewardGranted', handleRewardOrUpdate);
    window.addEventListener('chikooProfileUpdated', handleRewardOrUpdate);

    // Setup real-time postgres changes subscription on the public.profiles table
    let channel: any = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel('profiles-realtime-leaderboard')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          loadRealtimeLeaderboard();
        })
        .subscribe();
    }

    // fallback interval to guarantee updates
    const fallbackInterval = setInterval(() => {
      loadRealtimeLeaderboard();
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(fallbackInterval);
      window.removeEventListener('chikooRewardGranted', handleRewardOrUpdate);
      window.removeEventListener('chikooProfileUpdated', handleRewardOrUpdate);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [sessionUser]);

  // Setup real-time postgres changes subscription on user_challenge_progress table
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !sessionUser) return;

    console.log("📡 Subscribing to user_challenge_progress real-time updates");
    const challengeChannel = supabase
      .channel('public:user_challenge_progress_feed')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for inserts or updates (like a user changing status from started to completed)
          schema: 'public',
          table: 'user_challenge_progress'
        },
        (payload) => {
          const record = payload.new as any;
          
          if (record && record.status === 'completed') {
            console.log("🎉 Challenge Completed Event Intercepted!", record);
            
            const isMyProgress = profileId && record.user_id === profileId;
            const challengeId = record.challenge_id || '';
            const xpEarned = record.xp_earned || 50;

            if (isMyProgress) {
              // 1. Dispatch global state change to refresh current UI components
              setCompletedDailyChallenges(prev => {
                if (prev.includes(challengeId)) return prev;
                return [...prev, challengeId];
              });
              
              // 2. Trigger micro-interactions / celebratory confetti
              triggerCelebration('challenge_complete', {
                title: '🎉 Challenge Complete!',
                description: `You successfully finished: ${challengeId.replace('challenge_', '').replace(/_/g, ' ').toUpperCase()}`,
                rewardText: `+${xpEarned} Cookies 🍪`
              });
            } else {
              // Social notification for other users completing challenges
              const cleanChalName = challengeId.replace('challenge_', '').replace(/_/g, ' ').toUpperCase();
              addSocialActivity(
                `A fellow Cadet completed: ${cleanChalName}! 🚀`,
                'challenge',
                'SpaceCadet'
              );
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Realtime challenge channel status: ${status}`);
      });

    return () => {
      supabase.removeChannel(challengeChannel);
    };
  }, [sessionUser, profileId, triggerCelebration, addSocialActivity]);

  // Synchronize completed daily challenges / dynamic nodes into completedLessons state
  useEffect(() => {
    if (completedDailyChallenges && completedDailyChallenges.length > 0) {
      const challengeIds = completedDailyChallenges.filter(id => 
        id.startsWith('challenge_') || 
        id.startsWith('treasure_') || 
        id.startsWith('guardian_') ||
        id.startsWith('practice_')
      );
      if (challengeIds.length > 0) {
        setCompletedLessons(prev => {
          const missing = challengeIds.filter(id => !prev.includes(id));
          if (missing.length > 0) {
            return [...prev, ...missing];
          }
          return prev;
        });
      }
    }
  }, [completedDailyChallenges]);

  // World 2 Auto-unlock listener based on World 1 Daily Challenges completion
  useEffect(() => {
    if (!adventureModules || adventureModules.length === 0) return;
    
    // Identify World 1 module IDs
    const world1Modules = adventureModules.filter(m => !m.world_id || m.world_id === 'world_1' || m.world_id === WORLD_1_UUID);
    const world1ModuleIds = world1Modules.map(m => m.id);
    
    // Get required challenges
    const requiredChallenges = getRequiredWorld1DailyChallenges(DAILY_CHALLENGES, world1ModuleIds);
    if (requiredChallenges.length === 0) return;
    
    const allCompleted = requiredChallenges.every(dc => completedDailyChallenges.includes(dc.id));
    if (allCompleted) {
      const world2Record = userWorldProgress.find(p => p.world_id === WORLD_2_UUID || p.world_id === 'world_2');
      if (!world2Record || !world2Record.unlocked) {
        if (isUnlockingWorld2Ref.current) return;
        isUnlockingWorld2Ref.current = true;
        console.log("🔓 All World 1 Daily Challenges are completed! Automatically unlocking World 2...");
        saveUserWorldProgress(authUserId || profileId || 'default_user', WORLD_2_UUID, true).then(newRecord => {
          setUserWorldProgress(prev => {
            const filtered = prev.filter(p => p.world_id !== WORLD_2_UUID && p.world_id !== 'world_2');
            return [...filtered, newRecord];
          });
          
          triggerCelebration('challenge_complete', {
            title: '🪐 World 2 Unlocked!',
            description: 'Incredible job! You have successfully completed all World 1 Daily Challenges and unlocked World 2 (Intermediate Level)!',
            rewardText: 'New Units, Intermediate Decision Trees & Advanced ML are now available!'
          });
          try {
            soundManager.play('cheer');
          } catch (_) {}
        }).catch(err => {
          console.error("Failed to auto unlock world 2:", err);
        }).finally(() => {
          isUnlockingWorld2Ref.current = false;
        });
      }
    }
  }, [completedDailyChallenges, adventureModules, userWorldProgress, sessionUser, triggerCelebration]);

  // Profile save sync helper via ProgressService
  const saveProfileUpdates = useCallback(async (updates: Partial<SupabaseUserProfile>) => {
    if (!sessionUser) return;
    // Optimistically apply local state updates immediately so UI never waits for backend
    if (updates.gems !== undefined) setGems(updates.gems);
    if (updates.streak !== undefined) setStreak(updates.streak);
    if (updates.weekly_xp !== undefined) setWeeklyXp(updates.weekly_xp);
    if (updates.energy !== undefined) setEnergy(updates.energy);
    if (updates.accuracy !== undefined) setAccuracy(updates.accuracy);
    if (updates.trophies !== undefined) setTrophies(updates.trophies);
    if (updates.completed_lessons !== undefined && Array.isArray(updates.completed_lessons)) {
      setCompletedLessons(updates.completed_lessons);
      saveStoredCompletedLessonsBatch(updates.completed_lessons, sessionUser);
    }

    try {
      const confirmed = await progressService.updateProfileData(updates);
      if (confirmed) {
        if (updates.gems !== undefined) setGems(confirmed.gems);
        if (updates.streak !== undefined) setStreak(confirmed.streak);
        if (updates.weekly_xp !== undefined) setWeeklyXp(confirmed.weekly_xp);
        if (updates.energy !== undefined) setEnergy(confirmed.energy);
        if (updates.accuracy !== undefined) setAccuracy(confirmed.accuracy);
        if (updates.trophies !== undefined) setTrophies(confirmed.trophies);
        if (confirmed.completed_lessons && Array.isArray(confirmed.completed_lessons)) {
          setCompletedLessons(confirmed.completed_lessons);
          saveStoredCompletedLessonsBatch(confirmed.completed_lessons, sessionUser);
        }
      }
    } catch (e) {
      console.warn("Failed syncing profile via ProgressService:", e);
    }
  }, [sessionUser]);

  const handleProfileUpdatedOutside = (email: string, updates: Partial<SupabaseUserProfile>) => {
    if (!sessionUser || email.toLowerCase() !== sessionUser.toLowerCase()) return;
    
    if (updates.gems !== undefined) setGems(updates.gems);
    if (updates.xp !== undefined) setXp(updates.xp);
    if (updates.streak !== undefined) setStreak(updates.streak);
    if (updates.trophies !== undefined) setTrophies(updates.trophies);
    if (updates.energy !== undefined) setEnergy(updates.energy);
    if (updates.accuracy !== undefined) setAccuracy(updates.accuracy);
    if (updates.is_admin !== undefined) setIsDbAdmin(!!updates.is_admin);
    if (updates.completed_lessons !== undefined && Array.isArray(updates.completed_lessons)) {
      setCompletedLessons(prev => Array.from(new Set([...prev, ...updates.completed_lessons!])));
      saveStoredCompletedLessonsBatch(updates.completed_lessons, email);
    }
    
    if (updates.gems !== undefined || updates.username !== undefined) {
      setWeeklyLeaderboard(prev => {
        const next = prev.map(entry => 
          entry.isCurrentUser 
            ? { 
                ...entry, 
                xp: updates.gems !== undefined ? updates.gems : entry.xp, 
                name: updates.username !== undefined ? updates.username : entry.name 
              }
            : entry
        );
        next.sort((a, b) => b.xp - a.xp);
        return next.map((e, idx) => ({ ...e, rank: idx + 1 }));
      });
    }
  };


  // Observer: Level up tracker
  const lastLevel = useRef<number | null>(null);
  useEffect(() => {
    if (!dataLoaded) return;
    const currentLvl = Math.max(1, Math.floor((xp) / 1000));
    if (lastLevel.current !== null && currentLvl > lastLevel.current) {
      triggerCelebration('level_up', {
        title: `🚀 Level Up!`,
        description: `Stellar work Cadet! You've successfully achieved Level ${currentLvl}!`,
        rewardText: `Unlocked New Sector Challenges (Level ${currentLvl})`
      });
    }
    lastLevel.current = currentLvl;
  }, [xp, dataLoaded, triggerCelebration]);

  // Observer: Leaderboard Rank tracker
  const lastRank = useRef<number | null>(null);
  useEffect(() => {
    if (!dataLoaded) return;
    if (lastRank.current !== null && userRank < lastRank.current) {
      const placesGained = lastRank.current - userRank;
      triggerCelebration('new_rank', {
        title: `🥇 Rank Promotion!`,
        description: `You've jumped ${placesGained} place${placesGained > 1 ? 's' : ''} on the leaderboard!`,
        rewardText: `Current Rank: #${userRank} in Elite Division`
      });
    }
    lastRank.current = userRank;
  }, [userRank, dataLoaded, triggerCelebration]);

  // Energy Regeneration Logic
  useEffect(() => {
    if (energy >= MAX_ENERGY) {
      return;
    }
    const checkEnergy = () => {
      const timePassed = Date.now() - lastEnergyRefill;
      if (timePassed < REGEN_TIME_PER_UNIT || energySyncingRef.current) return;
      energySyncingRef.current = true;
      rpcSyncEnergy().then(res => {
        if (res.success) {
          if (res.energy > energyRef.current) {
            setIsRegeneratingEnergy(true);
            setTimeout(() => setIsRegeneratingEnergy(false), 2000);
          }
          setEnergy(res.energy);
          setLastEnergyRefill(res.lastEnergyRefillAt ?? Date.now());
        } else {
          // Server unreachable: retry after a full interval instead of every 2.5s
          setLastEnergyRefill(Date.now());
        }
      }).finally(() => { energySyncingRef.current = false; });
    };

    const timer = setInterval(checkEnergy, 2500);
    return () => clearInterval(timer);
  }, [energy, lastEnergyRefill]);

  const userPerformance: UserPerformance = useMemo(() => ({
    accuracy,
    averageTimePerChallenge: 15,
    streak,
    completedLessonIds: completedLessons
  }), [accuracy, streak, completedLessons]);

  const bookmarkedLessonsData = useMemo(() => {
    const list: Lesson[] = [];
    const allModules = [...AI_CURRICULUM, ...PRACTICE_CURRICULUM];
    for (const m of allModules) {
      if (!m.lessons) continue;
      for (const l of m.lessons) {
        if (bookmarkedLessons.includes(l.id)) {
          list.push(l);
        }
      }
    }
    return list;
  }, [bookmarkedLessons]);

  const nextEnergyIn = energy < MAX_ENERGY 
    ? Math.max(0, REGEN_TIME_PER_UNIT - (Date.now() - lastEnergyRefill))
    : null;

  const handleToggleBookmark = useCallback((lessonId: string) => {
    const nextBookmarks = bookmarkedLessons.includes(lessonId)
      ? bookmarkedLessons.filter(id => id !== lessonId)
      : [...bookmarkedLessons, lessonId];
    setBookmarkedLessons(nextBookmarks);
    saveProfileUpdates({ bookmarked_lessons: nextBookmarks });
    soundManager.play('click');
  }, [bookmarkedLessons, saveProfileUpdates]);

  const handleAdminClick = useCallback(() => {
    setIsAdminActive(true);
  }, []);

  const handleGemsChange = useCallback((v: number) => {
    setGems(v);
    saveProfileUpdates({ gems: v });
  }, [saveProfileUpdates]);

  const handleXpChange = useCallback((v: number) => {
    setXp(v);
    saveProfileUpdates({ xp: v });
  }, [saveProfileUpdates]);

  const handleBackToHome = useCallback(() => {
    setView('home');
  }, []);

  const handleClaimGems = useCallback((amount: number, newBalance?: number) => {
    if (typeof newBalance === 'number') {
      setGems(newBalance);
    } else {
      setGems(prev => prev + amount);
    }
    progressService.updateProfileData({
      gems: typeof newBalance === 'number' ? newBalance : gems + amount
    });
  }, [gems]);

  const handleClaimDailyChest = useCallback(async () => {
    try {
      const todayDate = new Date().toISOString().slice(0, 10);
      const res = await rewardService.claimDailyChest(50);
      if (res.granted) {
        setGems(res.newBalance);
        setLastChestClaimedAt(new Date().toISOString());
        soundManager.play('complete');
        triggerCelebration('reward_box_opened', {
          title: 'Daily Mystery Chest!',
          description: "You unlocked today's sweet cookie stash!",
          rewardText: `+50 Cookies 🍪 • +5 Energy`,
          claimId: `daily_chest_${todayDate}`
        });
      }
      return res;
    } catch (err) {
      console.error("Error claiming treasure chest:", err);
    }
  }, [triggerCelebration]);

  const handleStartAssessment = useCallback((lesson: any) => {
    openLessonWithPreload(lesson);
  }, [openLessonWithPreload]);

  const handleStudyLesson = useCallback((lesson: any) => {
    let lessonObject: Lesson | null = null;
    for (const module of [...AI_CURRICULUM, ...PRACTICE_CURRICULUM]) {
      const found = module.lessons.find(l => l.id === lesson.id);
      if (found) {
        lessonObject = { ...found };
        break;
      }
    }
    if (!lessonObject && (window as any).customLessonsArray) {
      const found = (window as any).customLessonsArray.find((l: any) => l.id === lesson.id);
      if (found) {
        lessonObject = { ...found };
      }
    }
    if (!lessonObject) {
      lessonObject = {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description || '',
        difficulty: lesson.difficulty || "Easy",
        xpReward: lesson.xpReward || 30,
        isChallenge: lesson.isChallenge,
        challenges: lesson.challenges || []
      };
    } else if (lesson.isChallenge) {
      lessonObject.isChallenge = true;
    }
    if (!lessonObject.challenges || lessonObject.challenges.length === 0) {
      const premiumChallenges = getFifteenPremiumChallenges(lesson.id, lessonObject.title);
      lessonObject.challenges = premiumChallenges;
    }
    openLessonWithPreload(lessonObject);
  }, [openLessonWithPreload]);

  const handleChallengeComplete = useCallback((packId: string, xpEarned: number) => {
    if (!packId) return;
    const practiceId = `practice_${packId}`;
    setCompletedLessons(prev => {
      if (prev.includes(practiceId) && prev.includes(packId)) return prev;
      const updated = [...new Set([...prev, practiceId, packId])];
      saveStoredCompletedLessonsBatch(updated, sessionUser);
      saveProfileUpdates({ completed_lessons: updated });
      return updated;
    });
    if (xpEarned > 0) {
      setXp(prev => prev + xpEarned);
      setWeeklyXp(prev => prev + xpEarned);
    }
  }, [saveProfileUpdates, sessionUser]);

  const handleAdventureComplete = useCallback((type: 'challenge' | 'treasure' | 'guardian', passed: boolean, xpEarned: number, gemsEarned: number, packId?: string) => {
    if (adventureLauncher) {
      const nodeId = adventureLauncher.nodeId;
      const alreadyCompleted = completedLessons.includes(nodeId);
      const actualGemsEarned = alreadyCompleted ? 0 : gemsEarned;
      const actualXpEarned = alreadyCompleted ? 0 : xpEarned;
      
      let uniqueCompleted = completedLessons;
      
      if (passed && !alreadyCompleted) {
        // Generate list of lessons to mark complete
        const newCompleted = [...new Set([...completedLessons, nodeId])];
        
        // Mark associated Practice lesson complete if a Challenge was finished!
        if (type === 'challenge') {
          const modNumStr = adventureLauncher.moduleId.replace(/^\D+/g, '');
          const packIdx = modNumStr ? parseInt(modNumStr, 10) - 1 : 0;
          const practiceId = `practice_chal_pack_${(packIdx % 3) + 1}`;
          newCompleted.push(practiceId);
          if (packId) {
            newCompleted.push(`practice_${packId}`);
            newCompleted.push(packId);
          }
        } else if (type === 'treasure') {
          const modNumStr = adventureLauncher.moduleId.replace(/^\D+/g, '');
          const packIdx = modNumStr ? parseInt(modNumStr, 10) - 1 : 0;
          const practiceId = `practice_puz_pack_${(packIdx % 3) + 1}`;
          newCompleted.push(practiceId);
        } else if (type === 'guardian') {
          const modNumStr = adventureLauncher.moduleId.replace(/^\D+/g, '');
          const packIdx = modNumStr ? parseInt(modNumStr, 10) - 1 : 0;
          const practiceId = `practice_battle_pool_${(packIdx % 3) + 1}`;
          newCompleted.push(practiceId);
        }
        uniqueCompleted = [...new Set(newCompleted)];
        saveStoredLessonCompletion(nodeId, {
          score: 100,
          xpEarned: actualXpEarned,
          cookiesEarned: actualGemsEarned,
          completedAt: new Date().toISOString()
        }, sessionUser);
        saveStoredCompletedLessonsBatch(uniqueCompleted, sessionUser);
        setCompletedLessons(uniqueCompleted);
        saveProfileUpdates({ completed_lessons: uniqueCompleted });
      }

      // Grant XP & Gems and persist to Supabase immediately (ONE-TIME ONLY)
      if (passed && !alreadyCompleted && actualGemsEarned > 0) {
        rewardService.grantReward({
          claimId: `adventure_${nodeId}`,
          amount: actualGemsEarned,
          rewardType: 'adventure',
          metadata: { nodeId, type }
        }).then(res => {
          if (res.newBalance !== undefined) {
            setGems(res.newBalance);
          }
        }).catch(err => {
          console.warn('[AdventureComplete] Reward sync notice:', err);
        });
        setGems(prev => prev + actualGemsEarned);
        setWeeklyXp(prev => prev + actualGemsEarned);
      }

      if (actualXpEarned > 0) {
        setXp(prev => prev + actualXpEarned);
      }

      // Trigger celebration if passed for the first time
      if (passed && !alreadyCompleted && actualGemsEarned > 0) {
        triggerCelebration('challenge_complete', {
          title: type === 'treasure' ? '🎁 Secret Treasure Claimed!' : type === 'guardian' ? '🤖 Boss Guardian Defeated!' : '🎉 AI Challenge Mastered!',
          description: type === 'treasure' ? 'You unlocked the secret rewards container and found golden cookies!' : type === 'guardian' ? 'You conquered the arena defender and claimed your cookie bounty!' : 'You mastered the module assessment and earned delicious cookies!',
          rewardText: `+${actualGemsEarned} Cookies 🍪`
        });
        setShowGlobalConfetti(true);
      }
    }
    
    // Reset states and return home
    setAdventureLauncher(null);
    setView('home');
  }, [adventureLauncher, completedLessons, saveProfileUpdates, triggerCelebration, gems, weeklyXp, sessionUser]);

  const handleAdventureCancel = useCallback(() => {
    setAdventureLauncher(null);
    setView('home');
  }, []);

  const handleLessonSelect = useCallback((lessonId: string) => {
    const rawTargetId = (lessonId || '').trim();
    const cleanTargetId = rawTargetId.toLowerCase();

    console.log(`[handleLessonSelect] --------------------------------------------------`);
    console.log(`[handleLessonSelect] Node clicked with ID: "${rawTargetId}"`);
    console.log(`[handleLessonSelect] User session: "${sessionUser || 'guest'}" | Current Energy: ${energy} | Completed Lessons Count: ${completedLessons.length}`);

    soundManager.play('click');

    const cleanEmail = (sessionUser || '').toLowerCase().trim();
    if (cleanEmail) {
      progressService.recordFirstInteraction(cleanEmail);
      progressService.recordLessonStart(rawTargetId);
    }

    const isCompletedLesson = completedLessons.includes(rawTargetId) || completedLessons.some(id => id.toLowerCase() === cleanTargetId);

    if (energy <= 0 && !isCompletedLesson) {
      console.warn(`[handleLessonSelect] Energy exhausted (0). Opening energy refill dialog.`);
      setShowEnergyRefillModal(true);
      return;
    }

    // Flexible ID matcher
    const matchesId = (idCandidate?: string) => {
      if (!idCandidate) return false;
      const c = idCandidate.trim().toLowerCase();
      if (c === cleanTargetId) return true;
      if (ensureUuid(c) === ensureUuid(cleanTargetId)) return true;
      return false;
    };

    // Find the lesson and its parent module from all curriculum collections
    let matchedNode: Lesson | undefined;
    let parentModule: any | undefined;
    
    for (const mod of [...adventureModules, ...AI_CURRICULUM, ...PRACTICE_CURRICULUM]) {
      const found = mod.lessons?.find((l: any) => l && (matchesId(l.id) || l.id === rawTargetId));
      if (found) {
        matchedNode = found;
        parentModule = mod;
        break;
      }
    }

    if (matchedNode) {
      console.log(`[handleLessonSelect] Matched node in module "${parentModule?.title || parentModule?.id}": Title="${matchedNode.title}", ID="${matchedNode.id}", isChallenge=${!!matchedNode.isChallenge}, isChest=${!!matchedNode.isChest}`);

      if (matchedNode.isChallenge || cleanTargetId.startsWith('challenge_')) {
        console.log(`[handleLessonSelect] Processing Challenge Pack flow for node "${rawTargetId}"`);
        const chalPacks = challengePacks.length > 0 ? challengePacks : getChallengePacks();
        let pack = chalPacks.find(p => p && (matchesId(p.id) || cleanTargetId.includes(p.id.toLowerCase()) || p.id.toLowerCase().includes(cleanTargetId)));
        if (!pack && parentModule?.id) {
          pack = chalPacks.find(p => p && (p.linked_unit_id === parentModule.id || p.linkedUnitId === parentModule.id));
        }
        if (!pack) {
          const modNumStr = parentModule?.id ? parentModule.id.replace(/^\D+/g, '') : '1';
          const packIdx = modNumStr ? Math.max(0, parseInt(modNumStr, 10) - 1) : 0;
          pack = chalPacks[packIdx % chalPacks.length] || DEFAULT_CHALLENGE_PACKS[0];
        }

        const mappedLesson = mapChallengePackToLesson(
          pack,
          rawTargetId,
          pack?.topic || matchedNode.title || 'AI Challenge',
          pack?.description || matchedNode.description
        );

        console.log(`[handleLessonSelect] Mapped challenge pack to lesson: Title="${mappedLesson.title}", ChallengesCount=${mappedLesson.challenges?.length || 0}`);
        openLessonWithPreload(mappedLesson);
        return;
      }

      if (matchedNode.isChest || cleanTargetId.startsWith('treasure_')) {
        console.log(`[handleLessonSelect] Claiming Treasure Chest reward for node "${rawTargetId}"`);
        if (completedLessons.includes(rawTargetId)) {
          soundManager.play('pop');
          triggerCelebration('reward_box_opened', {
            title: 'Chest Already Claimed',
            description: 'You have already collected the golden cookies from this secret chest!'
          });
          return;
        }
        const xpEarned = 150;
        const gemsEarned = 50;
        const newCompleted = [...new Set([...completedLessons, rawTargetId])];
        saveStoredCompletedLessonsBatch(newCompleted, sessionUser);
        setCompletedLessons(newCompleted);
        setXp(prev => prev + xpEarned);
        setGems(prev => prev + gemsEarned);
        soundManager.play('complete');
        triggerCelebration('reward_box_opened', {
          title: '🎁 Secret Treasure Unlocked!',
          description: `You discovered golden cookies! +${xpEarned} XP & +${gemsEarned} Cookies claimed!`,
          rewardText: `+${gemsEarned} Cookies 🍪`
        });

        rewardService.grantReward({
          claimId: `chest_${rawTargetId}`,
          amount: gemsEarned,
          rewardType: 'treasure_chest',
          metadata: { nodeId: rawTargetId }
        }).then(res => {
          if (res.newBalance !== undefined) {
            setGems(res.newBalance);
          }
          saveProfileUpdates({
            completed_lessons: newCompleted,
            gems: res.newBalance,
            total_chests_claimed: (totalChestsClaimed || 0) + 1
          });
        }).catch(err => {
          console.warn('[TreasureChest] Error persisting reward:', err);
          saveProfileUpdates({ completed_lessons: newCompleted });
        });
        return;
      }
    } else {
      console.log(`[handleLessonSelect] Node "${rawTargetId}" not pre-matched in memory arrays.`);
    }

    if (cleanTargetId.startsWith('guardian_')) {
      console.log(`[handleLessonSelect] Processing Arena Guardian node for "${rawTargetId}"`);
      const parts = rawTargetId.split('_');
      const module = AI_CURRICULUM.find(m => m.lessons?.some(l => matchesId(l.id)))
        || AI_CURRICULUM.find(m => m.id === parts[1])
        || AI_CURRICULUM.find(m => m.id === parts.slice(1).join('_'));

      const lessonObject: Lesson = {
        id: rawTargetId,
        title: `Arena Guardian`,
        description: `Defeat the ultimate boss guardian of ${module?.title || 'this Unit'}! Requires 80% accuracy to pass.`,
        difficulty: 'Hard',
        xpReward: 300,
        isBonus: true,
        challenges: getFifteenPremiumChallenges(rawTargetId, `Arena Guardian: ${module?.title || 'Unit'}`).slice(0, 8)
      };
      console.log(`[handleLessonSelect] Launching Arena Guardian: Title="${lessonObject.title}", ChallengesCount=${lessonObject.challenges.length}`);
      openLessonWithPreload(lessonObject);
      return;
    }

    if (matchedNode) {
      const lessonObject = { ...matchedNode };
      if (!lessonObject.challenges || lessonObject.challenges.length === 0) {
        console.log(`[handleLessonSelect] Generating premium challenges for standard lesson "${lessonObject.title}"`);
        const premiumChallenges = getFifteenPremiumChallenges(lessonObject.id, lessonObject.title);
        lessonObject.challenges = premiumChallenges;
      }
      console.log(`[handleLessonSelect] Launching matched lesson: Title="${lessonObject.title}", ID="${lessonObject.id}", ChallengesCount=${lessonObject.challenges.length}`);
      openLessonWithPreload(lessonObject);
      return;
    }

    // Fallback: If node wasn't matched in memory, delegate to LessonTransition loader for async lookup & generation
    const fallbackTitle = rawTargetId.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    console.log(`[handleLessonSelect] Delegating node "${rawTargetId}" to LessonTransition for async loading. Fallback Title="${fallbackTitle}"`);
    openLessonWithPreload({
      id: rawTargetId,
      title: fallbackTitle || 'AI Journey Stage',
      description: 'Explore and master this interactive lesson.',
      difficulty: 'Easy',
      xpReward: 50,
      challenges: []
    });
  }, [energy, adventureModules, completedLessons, openLessonWithPreload, challengePacks, sessionUser, saveProfileUpdates, triggerCelebration]);

  const handleRestoreEnergy = useCallback((amount: number, streakCount: number) => {
    // 5 in a row gives 1 full heart (5 energy units out of 25)
    const bonus = Math.min(5, Math.max(5, amount));
    const nextEnergy = Math.min(MAX_ENERGY, energyRef.current + bonus);
    energyRef.current = nextEnergy;
    setEnergy(nextEnergy);
    if (sessionUser) {
      rpcAdjustEnergy(bonus, 'streak_bonus').then(res => {
        if (res.success) { setEnergy(res.energy); if (res.lastEnergyRefillAt) setLastEnergyRefill(res.lastEnergyRefillAt); }
        else rpcSyncEnergy().then(r => { if (r.success) setEnergy(r.energy); });
      });
    }
    startTransition(() => {
      // Streak Bonus: +5 Cookies & +1 Heart for every 5 correct answers in a row
      if (streakCount % 5 === 0) {
        setXp(prev => prev + 5);
        setGems(prev => prev + 5);
        setChargingAnimation({ 
          text: `${streakCount} Streak! +5 Cookies & +1 Heart ❤️`, 
          id: Date.now() 
        });
      } else {
        setChargingAnimation({ 
          text: `Streak Bonus! +1 Heart ❤️`, 
          id: Date.now() 
        });
      }
    });
    
    setTimeout(() => setChargingAnimation(null), 3000);
  }, [sessionUser, saveProfileUpdates]);

  const handleQuestionAnswered = useCallback((isCorrect: boolean) => {
    if (sessionUser) {
      progressService.recordUserInteraction('question_answered', {
        is_correct: isCorrect,
        lesson_title: activeLesson?.title || 'Unknown'
      });

      setTimeout(() => {
        trackEvent('Question Attempted', {
          is_correct: isCorrect,
          lesson_name: activeLesson?.title || 'Unknown'
        }, sessionUser);

        trackEvent(isCorrect ? 'Question Correct' : 'Question Wrong', {
          lesson_name: activeLesson?.title || 'Unknown',
          thinking_time: 8,
          hint_used: false,
          retry_count: isCorrect ? 0 : 1
        }, sessionUser);
      }, 0);
    }

    if (!isCorrect) {
      // 1 mistake = 1 heart lost (5 units out of 25 max energy)
      const nextEnergy = Math.max(0, energyRef.current - 5);
      energyRef.current = nextEnergy;
      setEnergy(nextEnergy);
      if (nextEnergy <= 0) {
        setShowEnergyRefillModal(true);
      }
      if (sessionUser) {
        rpcAdjustEnergy(-5, 'wrong_answer').then(res => {
          if (res.success) { setEnergy(res.energy); if (res.lastEnergyRefillAt) setLastEnergyRefill(res.lastEnergyRefillAt); }
          else rpcSyncEnergy().then(r => { if (r.success) setEnergy(r.energy); });
        });
      }
    }
  }, [sessionUser, activeLesson?.title, saveProfileUpdates]);

  const refillEnergy = async () => {
    try {
      if (gems < REFILL_GEM_COST) {
        soundManager.play('incorrect');
        alert(`You need at least ${REFILL_GEM_COST} Cookies to refill your hearts! Complete lessons, quests, or spin the wheel to earn more cookies.`);
        return;
      }
      const updated = await progressService.spendCookies(REFILL_GEM_COST, 'Hearts Refill', 'energy_refill');
      if (updated && typeof updated.gems === 'number') {
        setGems(updated.gems);
      }
      setEnergy(MAX_ENERGY);
      if (sessionUser) {
        try {
          localStorage.setItem(`CHIKOO_ENERGY_${sessionUser.toLowerCase().trim()}`, String(MAX_ENERGY));
        } catch (_) {}
      }
      soundManager.play('complete');
      setIsRegeneratingEnergy(true);
      setTimeout(() => setIsRegeneratingEnergy(false), 2000);
      setShowEnergyRefillModal(false);
    } catch (err) {
      console.error("Error refilling energy:", err);
      setShowEnergyRefillModal(false);
    }
  };

  const handleLessonComplete = useCallback((earnedXp: number, sessionAccuracy: number, finalStreak: number) => {
    if (!activeLesson) return;
    const currentLesson = activeLesson;
    const lessonId = currentLesson.id;

    // Idempotency: Prevent concurrent/rapid in-flight executions for the same lesson
    if (isCompletingLessonRef.current === lessonId) return;
    isCompletingLessonRef.current = lessonId;

    try {
      // Regular lesson
      const isChallengeNode = currentLesson.isChallenge;
      const isGuardianNode = currentLesson.isBonus;
      const requiresPassRule = isChallengeNode || isGuardianNode;
      const didPass = sessionAccuracy >= 0.8;

      if (requiresPassRule && !didPass) {
        // Failed to meet the 80% passing rule, close session cleanly and do not mark completed
        setActiveLesson(null);
        return;
      }

      // Check if this lesson was already completed previously
      const wasAlreadyCompleted = completedLessons.includes(lessonId);

      if (wasAlreadyCompleted) {
        // Replay of previously completed lesson:
        // Detect that lesson is already completed -> award 0 additional XP/Cookies, do not duplicate events
        setActiveLesson(null);
        soundManager.play('complete');
        return;
      }

      const rawPackId = lessonId.startsWith('practice_') 
        ? lessonId.replace('practice_', '') 
        : lessonId.startsWith('challenge_') 
        ? lessonId 
        : null;

      // Find any matched challenge pack from CMS
      const chalPacks = challengePacks.length > 0 ? challengePacks : getChallengePacks();
      const matchedPack = chalPacks.find(p => p && (p.id === lessonId || ensureUuid(p.id) === ensureUuid(lessonId) || lessonId.includes(p.id) || p.id.includes(lessonId)));

      const newCompleted = [
        ...new Set([
          ...completedLessons, 
          lessonId, 
          ...(rawPackId ? [rawPackId] : []),
          ...(matchedPack ? [matchedPack.id, `practice_${matchedPack.id}`] : [])
        ])
      ];
      setCompletedLessons(newCompleted); // Update local state immediately for fast response

      if (rawPackId || matchedPack) {
        handleChallengeComplete(matchedPack?.id || rawPackId!, earnedXp || 50);
      }
      if (adventureLauncher) {
        setAdventureLauncher(null);
      }

      // Intelligently preload the next uncompleted lesson so tapping it opens immediately
      const nextUpcomingLesson = adventureModules
        .flatMap(m => m.lessons || [])
        .find(l => l && !newCompleted.includes(l.id));
      if (nextUpcomingLesson) {
        preloadNextLesson(nextUpcomingLesson);
      }

      let bonusXp = 0;

      const currentModule = adventureModules.find(m => m.lessons.some(l => l.id === lessonId));
      if (currentModule) {
        const allLessonsInCurriculum = adventureModules.flatMap(m => m.lessons.map(l => l.id));
        const wasCurriculumFinishedBefore = allLessonsInCurriculum.length > 0 && allLessonsInCurriculum.every(id => completedLessons.includes(id));
        const isCurriculumFinishedNow = allLessonsInCurriculum.length > 0 && allLessonsInCurriculum.every(id => newCompleted.includes(id));

        const allModuleLessons = currentModule.lessons.map(l => l.id);
        const wasCompletedBefore = allModuleLessons.every(id => completedLessons.includes(id));
        const isCompletedNow = allModuleLessons.every(id => newCompleted.includes(id));

        if (isCurriculumFinishedNow && !wasCurriculumFinishedBefore) {
          // Entire Course / Level Completion: +200 XP & Cookies bonus
          bonusXp = 200;
        } else if (isCompletedNow && !wasCompletedBefore) {
          // Unit / Module Completion: +50 XP & Cookies bonus
          bonusXp = 50;
        }
      }

      const configuredBaseReward = Number(currentLesson.xpReward || (currentLesson as any).xp_reward || 100);
      const totalEarnedXp = configuredBaseReward + bonusXp;

      // Save lesson completion into platform local storage & cache
      saveStoredLessonCompletion(lessonId, {
        score: Math.round(sessionAccuracy * 100),
        xpEarned: totalEarnedXp,
        cookiesEarned: totalEarnedXp,
        completedAt: new Date().toISOString()
      }, sessionUser);
      saveStoredCompletedLessonsBatch(newCompleted, sessionUser);

      if (sessionUser) {
        trackEvent('Lesson Completed', {
          lesson_id: lessonId,
          lesson_name: currentLesson.title,
          xp_earned: totalEarnedXp,
          coins_earned: Math.floor(totalEarnedXp / 5),
          score: Math.round(sessionAccuracy * 100),
        }, sessionUser);

        if (bonusXp > 0) {
          trackEvent('Quest Completed', {
            quest_name: 'Bonus Quest',
            xp_reward: bonusXp
          }, sessionUser);
        }
      }

      setLastXpEarned(totalEarnedXp);
      // Optimistically update XP and Gems locally so the top status bar counter updates instantly
      setXp(prev => prev + totalEarnedXp);
      setGems(prev => prev + totalEarnedXp);
      setWeeklyXp(prev => prev + totalEarnedXp);

      // Save progression synchronously through ProgressService (RPC idempotent)
      progressService.recordLessonCompletion(lessonId, totalEarnedXp).then((updatedProfile) => {
        if (updatedProfile && typeof updatedProfile.gems === 'number') {
          setGems(updatedProfile.gems);
        }
        progressService.updateProfileData({
          accuracy: (accuracy + sessionAccuracy) / 2
        });
      }).catch(err => {
        console.error("Error recording lesson completion:", err);
      });

      // Persist results from randomized quizzes, revisions, or exams locally via Question Service
      if (lessonId.startsWith('assess_') || lessonId.startsWith('practice_blitz_')) {
        const totalQ = currentLesson.challenges?.length || 5;
        const correctQ = Math.round(totalQ * sessionAccuracy);
        const passed = sessionAccuracy >= 0.6;
        trackQuizResult({
          assessmentId: lessonId,
          score: correctQ,
          totalQuestions: totalQ,
          passed,
          timestamp: Date.now(),
          answers: {}
        });
      }

      // Unmount the lesson component immediately to release memory
      setActiveLesson(null);
      setShowGlobalConfetti(true);
      soundManager.play('complete');

      // Dispatch global event for streak flame growth animation in header
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('CHIKOO_LESSON_COMPLETED', {
          detail: { lessonId, xpEarned: totalEarnedXp, streak: finalStreak }
        }));
      }

      if (bonusXp > 0) {
        setChargingAnimation({ 
          text: `Mastery Bonus! +${bonusXp} Cookies 🍪`, 
          id: Date.now() 
        });
        setTimeout(() => setChargingAnimation(null), 3000);
      }

      // Check for badges
      const newBadges = [...earnedBadges];
      const newlyEarned: string[] = [];

      const checkBadge = (id: string, condition: boolean) => {
        if (condition && !earnedBadges.includes(id)) {
          newBadges.push(id);
          newlyEarned.push(id);
        }
      };

      const nextStreak = streak + 1;

      checkBadge('b1', newCompleted.length >= 3);
      checkBadge('b2', nextStreak >= 5);
      checkBadge('b3', newCompleted.length >= 10);
      checkBadge('b4', newCompleted.some(id => id.includes('ethics')));
      checkBadge('b5', xp >= 1000);
      checkBadge('b6', totalChestsClaimed >= 3);
      checkBadge('b7', sessionAccuracy === 1);
      checkBadge('b8', bookmarkedLessons.length >= 5);

      if (newlyEarned.length > 0) {
        setEarnedBadges(newBadges);
        newlyEarned.forEach(async (badgeId) => {
          const badgeDetails = ALL_BADGES.find(b => b.id === badgeId);
          if (badgeDetails) {
            const claimRes = await rewardService.grantReward({
              claimId: `badge_${badgeId}`,
              amount: 100,
              rewardType: 'badge'
            });
            if (claimRes.granted) {
              setGems(claimRes.newBalance);
              setXp(prev => prev + 100);
              triggerCelebration('achievement_earned', {
                title: '🏆 Achievement Earned!',
                description: `You've unlocked the "${badgeDetails.name}" Badge: ${badgeDetails.requirement}!`,
                rewardText: `+100 Cookies 🍪 • Badge Unlocked`
              });
            }
          }
        });
      }

      // Check for streak milestones (daily learning streak)
      if (nextStreak % 5 === 0 || nextStreak === 33) {
        rewardService.grantReward({
          claimId: `streak_milestone_${nextStreak}`,
          amount: 50,
          rewardType: 'streak_milestone'
        }).then(res => {
          if (res.granted) {
            setGems(res.newBalance);
            triggerCelebration('challenge_complete', {
              title: `🔥 ${nextStreak}-Day Streak Milestone!`,
              description: `Outstanding dedication Cadet! You've successfully completed lessons ${nextStreak} days in a row!`,
              rewardText: `+50 Cookies 🍪 Streak Multiplier Active`
            });
          }
        });
      }
    } finally {
      // Release in-flight lock on next tick
      setTimeout(() => {
        isCompletingLessonRef.current = null;
      }, 500);
    }
  }, [activeLesson, completedLessons, adventureModules, adventureLauncher, sessionUser, accuracy, streak, earnedBadges, totalChestsClaimed, bookmarkedLessons, xp, triggerCelebration, preloadNextLesson, handleChallengeComplete, saveProfileUpdates]);

  const handleDailyChallengeComplete = useCallback(async (challenge: DailyChallenge) => {
    const claimId = `daily_challenge_${challenge.id}`;
    if (completedDailyChallenges.includes(challenge.id) || rewardService.isClaimed(claimId)) return;
    
    const nextDailyCompletions = [...completedDailyChallenges, challenge.id];
    setCompletedDailyChallenges(nextDailyCompletions);

    const res = await rewardService.grantReward({
      claimId,
      amount: challenge.xpReward,
      rewardType: 'daily_challenge',
      metadata: { challengeId: challenge.id, title: challenge.title }
    });

    setXp(prev => prev + challenge.xpReward);
    setWeeklyXp(prev => prev + challenge.xpReward);
    setLastXpEarned(challenge.xpReward);

    if (res.granted) {
      setGems(res.newBalance);
      triggerCelebration('challenge_complete', {
        title: '🎉 Challenge Complete!',
        description: `You solved the Daily Challenge: ${challenge.title}!`,
        rewardText: `+${challenge.xpReward} Cookies 🍪`
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('CHIKOO_LESSON_COMPLETED', {
          detail: { challengeId: challenge.id }
        }));
      }
    }

    logChallengeCompletion(sessionUser, challenge.id, 100, challenge.xpReward);

    saveProfileUpdates({
      xp: xp + challenge.xpReward,
      gems: res.newBalance,
      weekly_xp: weeklyXp + challenge.xpReward,
      completed_daily_challenges: nextDailyCompletions
    });
  }, [completedDailyChallenges, xp, weeklyXp, sessionUser, saveProfileUpdates, triggerCelebration]);

  const renderView = () => {
    switch (view) {
      case 'home':
        return (
          <motion.div 
            key="home-view"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{ willChange: 'transform, opacity', transform: 'translateZ(0)' }}
            className="flex flex-col h-full bg-transparent"
          >
            <ChikooHomescreen 
              xp={xp}
              gems={gems}
              streak={streak}
              rank={userRank}
              energy={energy}
              completedLessons={completedLessons}
              bookmarkedLessons={bookmarkedLessons}
              onToggleBookmark={handleToggleBookmark}
              onLessonSelect={handleLessonSelect}
              currentLessonId={adventureModules.flatMap(m => m.lessons || []).find(l => !completedLessons.includes(l.id))?.id || adventureModules[0]?.lessons?.[0]?.id || ''}
              setView={setView}
              modules={adventureModules}
              isAdmin={isDbAdmin}
              onAdminClick={handleAdminClick}
              completedDailyChallenges={completedDailyChallenges}
              onCompleteDailyChallenge={handleDailyChallengeComplete}
              profiles={allProfiles}
              selectedAvatarId={selectedAvatarId}
              username={username}
              worlds={worlds}
              selectedWorldId={selectedWorldId}
              userWorldProgress={userWorldProgress}
              onSelectWorld={setSelectedWorldId}
              isLoadingWorlds={isLoadingWorlds}
            />
          </motion.div>
        );
      case 'arena':
      case 'knowledge-arena':
      case 'practice':
        return (
          <motion.div
            key="arena-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{ willChange: 'transform, opacity', transform: 'translateZ(0)' }}
            className="flex-1 flex flex-col h-full bg-transparent overflow-hidden"
          >
            <Suspense fallback={<ChikooReachingLoader />}>
              <ArenaPage onBack={() => setView('home')} />
            </Suspense>
          </motion.div>
        );
      case 'leaderboard':
        return (
          <motion.div 
            key="leaderboard-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{ willChange: 'transform, opacity', transform: 'translateZ(0)' }}
            className="h-full"
          >
            <Leaderboard 
              leaderboardData={weeklyLeaderboard.map(entry => 
                entry.isCurrentUser ? { ...entry, xp: gems, name: username || entry.name } : entry
              )} 
            />
          </motion.div>
        );
      case 'quests':
        return (
          <motion.div 
            key="quests-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{ willChange: 'transform, opacity', transform: 'translateZ(0)' }}
            className="h-full"
          >
            <QuestsView 
              gems={gems}
              streak={streak}
              completedCount={completedLessons.length}
              accuracy={accuracy}
              bestAnswerStreak={bestAnswerStreak}
              lastChestClaimedAt={lastChestClaimedAt}
              onClaimGems={handleClaimGems}
              onClaimChest={handleClaimDailyChest}
              onQuestDetailsToggle={setIsQuestDetailsOpen}
              onNavigateTab={(tab) => setView(tab as any)}
            />
          </motion.div>
        );

      case 'profile':
        return (
          <motion.div 
            key="profile-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{ willChange: 'transform, opacity', transform: 'translateZ(0)' }}
            className={`h-full flex flex-col ${isDarkMode ? 'bg-[#0b0f19]' : 'bg-slate-50/20'}`}
          >
            <div className="flex-1 overflow-y-auto scrollbar-hide pt-28 px-6 pb-28">
              <PlayerProfile
                username={username}
                setUsername={setUsername}
                spaceTitle={spaceTitle}
                setSpaceTitle={setSpaceTitle}
                spaceMotto={spaceMotto}
                setSpaceMotto={setSpaceMotto}
                completedLessons={completedLessons}
                accuracy={accuracy}
                earnedBadges={earnedBadges}
                setEarnedBadges={setEarnedBadges}
                gems={gems}
                setGems={setGems}
                xp={xp}
                setXp={setXp}
                streak={streak}
                bestAnswerStreak={bestAnswerStreak}
                currentLeagueId={currentLeagueId}
                selectedAvatarId={selectedAvatarId}
                setSelectedAvatarId={setSelectedAvatarId}
                selectedThemeId={selectedThemeId}
                setSelectedThemeId={setSelectedThemeId}
                isPlus={isPlus}
                sessionUser={sessionUser}
                saveProfileUpdates={saveProfileUpdates}
                setView={setView}
                isDbAdmin={isDbAdmin}
                setIsAdminActive={setIsAdminActive}
                setShowSignOutConfirm={setShowSignOutConfirm}
                bookmarkedLessonsData={bookmarkedLessonsData}
                handleLessonSelect={handleLessonSelect}
                isSchoolAccount={isSchoolAccount}
                schoolInfo={isSchoolAccount ? schoolInfo : null}
                onOpenSchoolAdmin={isSchoolAccount && schoolInfo ? () => setIsSchoolAdminActive(true) : undefined}
              />
            </div>
          </motion.div>
        );
      case 'rewards_store':
        return (
          <motion.div 
            key="rewards-store-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{ willChange: 'transform, opacity', transform: 'translateZ(0)' }}
            className="flex flex-col h-full bg-transparent overflow-hidden"
          >
            <RewardsStore 
              xp={xp}
              gems={gems}
              isPlus={isPlus}
              togglePlus={handleTogglePlus}
              userEmail={sessionUser}
              username={username}
              selectedAvatarId={selectedAvatarId}
              onProfileClick={() => {
                setView('profile');
                soundManager.play('click');
              }}
              onGemsChange={handleGemsChange}
              onXpChange={handleXpChange}
              onBackToHome={handleBackToHome}
            />
          </motion.div>
        );
      default:
        return <div className="pt-24 text-center text-gray-400 font-display font-bold">Coming Soon!</div>;
    }
  };

  // Check if onboarding is completely finished for this email
  const isOnboardingComplete = useMemo(() => {
    if (!sessionUser) return false;
    const cleanEmail = sessionUser.toLowerCase().trim();
    
    // 1. Direct local storage completion marker
    if (localStorage.getItem(`chikoo_onboarding_completed_${cleanEmail}`) === 'true') {
      return true;
    }

    // 2. Profile record from Supabase / progressService
    const profile = progressService.getProfile();
    if (profile && profile.email === cleanEmail) {
      if (profile.onboarding_completed === true) return true;
      
      // Returning legacy user with actual learning activity
      const hasCompletedLessons = Array.isArray(profile.completed_lessons) && profile.completed_lessons.length > 0;
      const hasXp = typeof profile.xp === 'number' && profile.xp > 0;
      const hasStreak = typeof profile.streak === 'number' && profile.streak > 0;
      if (hasCompletedLessons || hasXp || hasStreak) return true;
    }

    // 3. Onboarding reason or structured onboarding data
    const hasReason = !!localStorage.getItem(`CHIKOO_USER_REASON_${cleanEmail}`);
    const hasOnboardingData = !!localStorage.getItem(`CHIKOO_ONBOARDING_DATA_${cleanEmail}`);
    if (hasReason || hasOnboardingData) return true;

    return false;
  }, [sessionUser, dataLoaded, isProfileReady, onboardingVersion]);

  // If visitor is browsing public SEO curriculum, features, or knowledge hub routes
  if (isSeoPath(currentPath)) {
    return (
      <div 
        className="fixed inset-0 w-full h-full bg-[#FAF9F5] text-slate-800 selection:bg-amber-400 selection:text-slate-900 overflow-y-auto overflow-x-hidden overscroll-y-contain z-10"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <SeoPageRouter
          dynamicModules={adventureModules.length > 0 ? adventureModules : AI_CURRICULUM}
          onLaunchApp={(target) => {
            window.history.pushState(null, '', '/');
            navigateTo('/');
            if (target?.view) {
              setView(target.view as any);
            }
            if (target?.unitId || target?.lessonId) {
              const allLessons = (adventureModules.length > 0 ? adventureModules : AI_CURRICULUM).flatMap(m => m.lessons || []);
              const targetLesson = allLessons.find(l => l.id === target.lessonId || (target.unitId && l.id.startsWith(target.unitId)));
              if (targetLesson) {
                openLessonWithPreload(targetLesson);
              }
            }
          }}
        />
      </div>
    );
  }

  // Unified single-root application render:
  // 1. SplashScreen overlays everything at z-[999999] while loading
  // 2. Either AuthScreen or the complete Learning Path shell is rendered underneath from the very start
  // 3. When splash reaches 100% and isReady, it fades out instantly with zero layout re-mounting or spinner
  const showAuthView = !isRestoringSession && (!sessionUser || !isOnboardingComplete);

  // =========================================================================
  // DESKTOP-FIRST ENTRY & PLATFORM ROUTING
  // -------------------------------------------------------------------------
  // Mobile users are untouched: they enter the existing mobile app directly.
  // Desktop users experience:
  //   / or /landing -> Desktop Landing Page
  //   /login        -> Desktop Auth (login mode) with "Back to Chikoo"
  //   /signup       -> Desktop Auth (signup mode) with "Back to Chikoo"
  //   /app          -> Full Desktop Learning Universe (or Auth if logged out)
  // =========================================================================
  const cleanPath = currentPath.toLowerCase().split('?')[0].replace(/\/+$/, '') || '/';

  const isLandingRoute = cleanPath === '/landing' || cleanPath === '/home';
  if ((isDesktop || isLandingRoute) && (cleanPath === '/' || isLandingRoute)) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<div className="fixed inset-0 w-full h-full bg-[#FCFDFE]" />}>
          <DesktopLandingPage
            onStartAdventure={() => {
              if (!showAuthView) {
                navigateTo('/app');
              } else {
                navigateTo('/signup');
              }
            }}
            onSignIn={() => {
              if (!showAuthView) {
                navigateTo('/app');
              } else {
                navigateTo('/login');
              }
            }}
            onContinueToApp={() => navigateTo('/app')}
            isAuthenticated={!showAuthView}
            username={username || sessionUser || 'Explorer'}
            onNavigateSeo={(path) => navigateTo(path)}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isDesktop && (cleanPath === '/login' || cleanPath === '/signup')) {
    if (!showAuthView) {
      navigateTo('/app');
    } else {
      return (
        <ErrorBoundary>
          <div className="fixed inset-0 w-full h-full bg-slate-900 overflow-y-auto">
            <Suspense fallback={<div className="fixed inset-0 bg-slate-950" />}>
              <AuthScreen 
                initialMode={cleanPath === '/login' ? 'login' : 'signup'}
                onLoginSuccess={(email, isNew) => {
                  handleLoginSuccess(email, isNew);
                  navigateTo('/app');
                }} 
                onboardingEmail={sessionUser || undefined}
                onBackToLanding={() => navigateTo('/')}
              />
            </Suspense>
          </div>
        </ErrorBoundary>
      );
    }
  }

  if (isDesktop && (cleanPath === '/app' || cleanPath.startsWith('/app'))) {
    if (showAuthView) {
      return (
        <ErrorBoundary>
          <div className="fixed inset-0 w-full h-full bg-slate-900 overflow-y-auto">
            <Suspense fallback={<div className="fixed inset-0 bg-slate-950" />}>
              <AuthScreen 
                initialMode="signup"
                onLoginSuccess={(email, isNew) => {
                  handleLoginSuccess(email, isNew);
                  navigateTo('/app');
                }} 
                onboardingEmail={sessionUser || undefined}
                onBackToLanding={() => navigateTo('/')}
              />
            </Suspense>
          </div>
        </ErrorBoundary>
      );
    }
  }

  if (localCurriculumError) {
    return (
      <ErrorView 
        title="Chikoo failed to Load!"
        error={localCurriculumError}
        onRetry={() => window.location.reload()}
        isFullScreen={true}
      />
    );
  }

  return (
    <ErrorBoundary>
      {/* 1. Chikoo unified splash screen overlay driven by real readiness metrics */}
      <AnimatePresence>
        {showAppSplash && (
          <SplashScreen
            key="chikoo-splash"
            progress={splashProgress}
            statusText={splashStatusText}
            isReady={isSplashReady}
            onFinish={() => setShowAppSplash(false)}
          />
        )}
      </AnimatePresence>

      {/* 2. Sub-surface content pre-rendered and painted beneath the splash */}
      {showAuthView ? (
        <Suspense fallback={<ChikooReachingLoader fullScreen={true} />}>
          <AuthScreen 
            onLoginSuccess={handleLoginSuccess} 
            onboardingEmail={sessionUser || undefined}
          />
        </Suspense>
      ) : (
        <>
          <AnimatePresence>
            {isAdminActive && (
              <Suspense fallback={null}>
                <AdminPanel 
                  onClose={() => setIsAdminActive(false)} 
                  currentUserEmail={sessionUser} 
                  isDbAdmin={isDbAdmin} 
                  onProfileUpdated={handleProfileUpdatedOutside} 
                />
              </Suspense>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {isSchoolAdminActive && isSchoolAccount && schoolInfo && schoolInfo.status === 'active' && (
              <Suspense fallback={null}>
                <SchoolAdminDashboard 
                  school={schoolInfo} 
                  onClose={() => {
                    setIsSchoolAdminActive(false);
                    if (window.location.hash.includes('school')) {
                      window.location.hash = '';
                    }
                  }} 
                  onNotification={(msg, type) => {
                    if (triggerCelebration) {
                      triggerCelebration('quest_complete', { title: msg, description: type === 'error' ? 'School Alert' : 'School Update' });
                    }
                  }} 
                />
              </Suspense>
            )}
          </AnimatePresence>
          <div className={`relative w-full max-w-[430px] h-[100dvh] sm:h-[844px] lg:max-w-none lg:w-screen lg:h-screen lg:my-0 lg:rounded-none lg:border-0 overflow-hidden flex flex-col lg:flex-row mx-auto sm:shadow-sm sm:rounded-3xl sm:my-4 border-0 sm:border transition-colors duration-300 ${
            (view as string) === 'rewards_store' || (view as string) === 'rewards'
              ? 'bg-black border-slate-900 sm:border-slate-800'
              : view === 'home'
                ? 'bg-transparent border-slate-200/50 dark:border-slate-800'
                : isDarkMode
                  ? 'bg-[#0b0f19] border-slate-800 sm:border-slate-800 text-slate-100'
                  : 'bg-white ambient-ai-gradient sm:border-slate-200/50'
          }`}>
            {/* 1. DESKTOP LEFT SIDEBAR (ALWAYS OPEN ON DESKTOP) */}
            <DesktopLeftSidebar
              view={view}
              setView={setView}
              username={sessionUser || 'Space Cadet'}
              selectedAvatarId={selectedAvatarId}
              spaceTitle={`Rank #${userRank}`}
              isDbAdmin={isDbAdmin}
              onAdminClick={() => setIsAdminActive(true)}
              isSchoolAccount={isSchoolAccount}
              schoolInfo={schoolInfo}
              onOpenSchoolAdmin={() => setIsSchoolAdminActive(true)}
              onSignOutClick={() => setShowSignOutConfirm(true)}
              hasUnclaimedDailyChallenge={DAILY_CHALLENGES.some(dc => !completedLessons.includes(dc.id))}
              hasUnclaimedDailyChest={!lastChestClaimedAt || (new Date().getTime() - new Date(lastChestClaimedAt).getTime() >= 24 * 60 * 60 * 1000)}
              onVisitLanding={() => navigateTo('/')}
              className="hidden lg:flex lg:w-64 xl:w-72 shrink-0"
            />

            {/* 2. CENTER STAGE (HERO LEARNING PATH / ACTIVE VIEW) */}
            <div className="flex-1 min-w-0 h-full flex flex-col relative overflow-hidden">
              {!activeLesson && <CelebrationOverlay />}
              <ConfettiEffect active={showGlobalConfetti} onComplete={() => setShowGlobalConfetti(false)} />
              {view === 'home' && <Snowfall />}
              
              <motion.div 
                className="flex-1 flex flex-col overflow-hidden relative w-full h-full"
                animate={{
                  scale: (activeCelebration && !activeLesson) ? 0.985 : 1,
                  filter: (activeCelebration && !activeLesson) ? 'blur(3.5px) saturate(0.8)' : 'none'
                }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
        
        {/* Custom state-based Sign Out Confirmation Dialog (handles iframe constraints perfectly) */}
        <AnimatePresence>
          {showSignOutConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[500] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-full max-w-[320px] bg-white rounded-3xl border border-slate-200 p-6 text-center shadow-2xl relative overflow-hidden"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-500 to-pink-500" />
                
                <div className="w-14 h-14 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 mt-1">
                  <LogOut size={28} className="translate-x-0.5" />
                </div>

                <h3 className="text-lg font-display font-black text-slate-800 mb-1.5 leading-tight">
                  Sign Out of Space Hub?
                </h3>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  You are currently logged in as <span className="font-semibold text-slate-700 font-mono text-[10px] break-all">{sessionUser}</span>. Are you sure you want to end your space session?
                </p>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={async () => {
                      soundManager.play('click');
                      await logout();
                      setIsProfileReady(false);
                      progressService.clear();
                      setIsDbAdmin(false);
                      setShowSignOutConfirm(false);
                      if (window.innerWidth >= 1024) {
                        window.history.pushState(null, '', '/');
                        navigateTo('/');
                      }
                    }}
                    className="w-full bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white font-black uppercase text-[10px] tracking-wider py-3 px-4 rounded-xl transition-all shadow-[0_4px_12px_rgba(239,68,68,0.2)] hover:shadow-none"
                  >
                    Yes, Sign Out
                  </button>
                  <button
                    onClick={() => {
                      soundManager.play('click');
                      setShowSignOutConfirm(false);
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-wider py-3 px-4 rounded-xl transition-all"
                  >
                    Stay in Hub
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {isDbAdmin && view !== 'home' && (
          <button
            onClick={() => {
              soundManager.play('complete');
              setIsAdminActive(true);
            }}
            className="absolute top-4 right-4 z-[350] bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-[9px] px-3 py-1 rounded-full shadow-[0_4px_12px_rgba(124,58,237,0.35)] border border-violet-400/20 uppercase tracking-wider flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-2.5 h-2.5 text-amber-300 fill-current animate-pulse" />
            Creator Mode
          </button>
        )}
        {!isInBattleRecap && !activeLesson && !isPracticeActivityActive && !activeCelebration && !isQuestDetailsOpen && view !== 'arena' && view !== 'knowledge-arena' && (view as string) !== 'rewards_store' && (() => {
          const activeRank = getRankFromTrophies(trophies);
          return (
            <Header 
              xp={xp} 
              gems={gems}
              rank={userRank}
              charging={energy} 
              nextChargingIn={nextEnergyIn} 
              onRefillRequest={refillEnergy}
              isRegenerating={isRegeneratingEnergy}
              avatarId={selectedAvatarId}
              onProfileClick={() => {
                setView('profile');
                soundManager.play('click');
              }}
              streak={streak}
              isPracticeView={(view as string) === 'practice'}
              activeRankName={activeRank.name}
              hideRank={view === 'profile'}
              worlds={worlds}
              selectedWorldId={selectedWorldId}
              userWorldProgress={userWorldProgress}
              onSelectWorld={setSelectedWorldId}
            />
          );
        })()}

        <main className="flex-1 overflow-hidden relative z-10">
          <AnimatePresence mode="wait">
            <Suspense fallback={<ChikooReachingLoader fullScreen={false} />}>
              {renderView()}
            </Suspense>
          </AnimatePresence>
        </main>

        {/* Lesson Session Overlay */}
        <AnimatePresence>
          {activeStudyLesson && (
            <LessonStudyHub
              lessonId={activeStudyLesson.id}
              lessonTitle={activeStudyLesson.title}
              lessonDescription={activeStudyLesson.description}
              onClose={() => setActiveStudyLesson(null)}
              onEarnXp={(amt) => {
                setXp(prev => prev + amt);
                setWeeklyXp(prev => prev + amt);
              }}
              onStartQuiz={() => {
                const lessonId = activeStudyLesson.id;
                let lessonObject: Lesson | null = null;
                
                // Search in pre-defined curriculum first
                for (const module of AI_CURRICULUM) {
                  const found = module.lessons.find(l => l.id === lessonId);
                  if (found) {
                    lessonObject = { ...found };
                    break;
                  }
                }
                
                // If not found, look inside dynamically generated customLessons state
                if (!lessonObject && (window as any).customLessonsArray) {
                  const found = (window as any).customLessonsArray.find((l: any) => l.id === lessonId);
                  if (found) {
                    lessonObject = { ...found };
                  }
                }
                
                if (lessonObject) {
                  if (!lessonObject.challenges || lessonObject.challenges.length === 0) {
                    const premiumChallenges = getFifteenPremiumChallenges(lessonId, lessonObject.title);
                    lessonObject.challenges = premiumChallenges;
                  }
                  openLessonWithPreload(lessonObject);
                }
                setActiveStudyLesson(null);
              }}
            />
          )}

          {/* Cinematic Game-Style Cloud Transition */}
          <AnimatePresence>
            {loadingLesson && (
              <LessonTransition
                key={`loading_${loadingLesson.id}`}
                lessonId={loadingLesson.id}
                lesson={loadingLesson}
                onReady={(fullLesson) => {
                  setActiveLesson(fullLesson);
                }}
                onFinished={() => {
                  setLoadingLesson(null);
                }}
                onCancel={() => {
                  setLoadingLesson(null);
                }}
              />
            )}
          </AnimatePresence>

          {/* Active Lesson Session */}
          <AnimatePresence mode="wait">
            {activeLesson && (
              <motion.div
                key={`lesson_${activeLesson.id}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 z-[400]"
              >
                <LessonSession 
                  lesson={activeLesson}
                  performance={userPerformance}
                  onClose={() => {
                    setActiveLesson(null);
                    setLoadingLesson(null);
                  }}
                  onComplete={handleLessonComplete}
                  onStreakRestore={handleRestoreEnergy}
                  onQuestionAnswered={(correct) => {
                    if (activeLesson?.id !== 'recharge_quest' && !activeLesson?.id.startsWith('practice')) {
                      handleQuestionAnswered(correct);
                    }
                  }}
                  onRefillEnergy={() => setShowEnergyRefillModal(true)}
                  energy={energy}
                  nextEnergyIn={nextEnergyIn}
                />
              </motion.div>
            )}
          </AnimatePresence>


        </AnimatePresence>

        {/* Charging Restoration Animation */}
        <AnimatePresence>
          {chargingAnimation && (
            <motion.div
              key={chargingAnimation.id}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: -150, scale: 1.1 }}
              exit={{ opacity: 0, scale: 1.2, transition: { duration: 0.2 } }}
              className="absolute left-1/2 -translate-x-1/2 bottom-0 z-[600] pointer-events-none"
            >
              <div className="bg-emerald-500 text-white px-8 py-4 rounded-full font-display font-black shadow-[0_8px_20px_rgba(16,185,129,0.3)] border-4 border-white flex items-center justify-center gap-3 whitespace-nowrap">
                <Zap className="w-6 h-6 fill-current text-white" />
                <span className="text-xl uppercase tracking-tight">{chargingAnimation.text}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Standard Bottom Navigation Bar (Mobile / Tablet Only) */}
        <div className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-auto sm:w-[360px] sm:mx-auto z-[399] transition-all duration-300 ${
          isInBattleRecap || activeLesson || isPracticeActivityActive || activeCelebration || isQuestDetailsOpen || view === 'arena' || view === 'knowledge-arena' ? 'translate-y-20 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        } pointer-events-none lg:hidden`}>
          {(() => {
            const isRewardsView = (view as string) === 'rewards_store' || (view as string) === 'rewards';
            return (
              <nav 
                className={`w-full rounded-full border transition-colors duration-300 pointer-events-auto backdrop-blur-2xl shadow-2xl overflow-hidden ${
                  isRewardsView
                    ? 'bg-black/90 border-white/[0.15] shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
                    : isDarkMode
                      ? 'bg-[#172033]/95 border-[rgba(226,232,240,0.14)] shadow-[0_8px_32px_rgba(0,0,0,0.45)]'
                      : 'bg-white/70 border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.1)]'
                }`}
                style={{
                  paddingBottom: 'env(safe-area-inset-bottom, 0px)'
                }}
              >
                <div className="w-full max-w-md mx-auto h-[62px] grid grid-cols-6 items-stretch justify-items-center relative px-1">
              {/* 1. Home Button */}
              <button 
                id="tour-home"
                onClick={() => {
                  setView('home');
                  soundManager.play('click');
                }}
                className="group relative w-full h-full flex flex-col items-center justify-center focus:outline-none select-none cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-150 pointer-events-auto"
              >
                <div className="relative flex flex-col items-center justify-center rounded-full w-[86%] h-[44px] transition-all duration-200">
                  {view === 'home' && (
                    <motion.div
                      layoutId="navActiveBg"
                      className={`absolute inset-0 rounded-full -z-10 ${
                        isDarkMode
                          ? 'bg-sky-400/20 border border-sky-400/40 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                          : 'bg-sky-500/10 border border-sky-400/20 shadow-[0_2px_8px_rgba(14,165,233,0.06)]'
                      }`}
                      transition={{ type: 'spring', stiffness: 380, damping: 25 }}
                    />
                  )}
                  
                  <motion.img 
                    src={homeIcon} 
                    alt="Home" 
                    className="w-[28px] h-[28px] object-contain"
                    animate={view === 'home' ? { scale: 1.08, y: -0.5 } : { scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  />
                </div>
              </button>

              {/* 2. Battle Arena / Practice Button */}
              <button 
                id="tour-practice"
                onClick={() => {
                  setView('arena');
                  soundManager.play('click');
                }}
                className="group relative w-full h-full flex flex-col items-center justify-center focus:outline-none select-none cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-150 pointer-events-auto"
              >
                <div className="relative flex flex-col items-center justify-center rounded-full w-[86%] h-[44px] transition-all duration-200">
                  {(view === 'practice' || view === 'arena' || view === 'knowledge-arena') && (
                    <motion.div
                      layoutId="navActiveBg"
                      className={`absolute inset-0 rounded-full -z-10 ${
                        isDarkMode
                          ? 'bg-sky-400/20 border border-sky-400/40 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                          : 'bg-sky-500/10 border border-sky-400/20 shadow-[0_2px_8px_rgba(14,165,233,0.06)]'
                      }`}
                      transition={{ type: 'spring', stiffness: 380, damping: 25 }}
                    />
                  )}
                  
                  <div className="relative">
                    <motion.img 
                      src={practiceIcon} 
                      alt="Battle Arena" 
                      className="w-[28px] h-[28px] object-contain"
                      animate={(view === 'practice' || view === 'arena' || view === 'knowledge-arena') ? { scale: 1.08, y: -0.5 } : { scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    />
                  </div>
                </div>
              </button>

              {/* 3. Leagues/Leaderboard Button */}
              <button 
                id="tour-leaderboard"
                onClick={() => {
                  setView('leaderboard');
                  soundManager.play('click');
                }}
                className="group relative w-full h-full flex flex-col items-center justify-center focus:outline-none select-none cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-150 pointer-events-auto"
              >
                <div className="relative flex flex-col items-center justify-center rounded-full w-[86%] h-[44px] transition-all duration-200">
                  {view === 'leaderboard' && (
                    <motion.div
                      layoutId="navActiveBg"
                      className={`absolute inset-0 rounded-full -z-10 ${
                        isDarkMode
                          ? 'bg-sky-400/20 border border-sky-400/40 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                          : 'bg-sky-500/10 border border-sky-400/20 shadow-[0_2px_8px_rgba(14,165,233,0.06)]'
                      }`}
                      transition={{ type: 'spring', stiffness: 380, damping: 25 }}
                    />
                  )}
                  
                  <motion.img 
                    src={ranksIcon} 
                    alt="Ranks" 
                    className="w-[28px] h-[28px] object-contain"
                    animate={view === 'leaderboard' ? { scale: 1.08, y: -0.5 } : { scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  />
                </div>
              </button>

              {/* 4. Rewards Button */}
              <button 
                id="tour-rewards"
                onClick={() => {
                  setView('rewards_store');
                  soundManager.play('click');
                }}
                className="group relative w-full h-full flex flex-col items-center justify-center focus:outline-none select-none cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-150 pointer-events-auto"
              >
                <div className="relative flex flex-col items-center justify-center rounded-full w-[86%] h-[44px] transition-all duration-200">
                  {(view as string) === 'rewards_store' && (
                    <motion.div
                      layoutId="navActiveBg"
                      className={`absolute inset-0 rounded-full -z-10 ${
                        isRewardsView 
                          ? 'bg-purple-600/30 border border-purple-400/50 shadow-[0_0_12px_rgba(168,85,247,0.35)]' 
                          : isDarkMode
                            ? 'bg-purple-500/20 border border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                            : 'bg-sky-500/10 border border-sky-400/20 shadow-[0_2px_8px_rgba(14,165,233,0.06)]'
                      }`}
                      transition={{ type: 'spring', stiffness: 380, damping: 25 }}
                    />
                  )}
                  
                  <motion.img 
                    src={rewardsIcon} 
                    alt="Rewards" 
                    className="w-[28px] h-[28px] object-contain"
                    animate={(view as string) === 'rewards_store' ? { scale: 1.08, y: -0.5 } : { scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  />
                </div>
              </button>

              {/* 5. Quests Button */}
              <button 
                id="tour-quests"
                onClick={() => {
                  setView('quests');
                  soundManager.play('click');
                }}
                className="group relative w-full h-full flex flex-col items-center justify-center focus:outline-none select-none cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-150 pointer-events-auto"
              >
                <div className="relative flex flex-col items-center justify-center rounded-full w-[86%] h-[44px] transition-all duration-200">
                  {view === 'quests' && (
                    <motion.div
                      layoutId="navActiveBg"
                      className={`absolute inset-0 rounded-full -z-10 ${
                        isDarkMode
                          ? 'bg-sky-400/20 border border-sky-400/40 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                          : 'bg-sky-500/10 border border-sky-400/20 shadow-[0_2px_8px_rgba(14,165,233,0.06)]'
                      }`}
                      transition={{ type: 'spring', stiffness: 380, damping: 25 }}
                    />
                  )}
                  
                  <div className="relative">
                    <motion.img 
                      src={questIcon} 
                      alt="Quests" 
                      className="w-[28px] h-[28px] object-contain"
                      animate={view === 'quests' ? { scale: 1.08, y: -0.5 } : { scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    />
                    {!dailyChestClaimed && view !== 'quests' && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-pink-500 rounded-full ring-2 ring-white animate-pulse z-10" />
                    )}
                  </div>
                </div>
              </button>

              {/* 6. Profile Button */}
              <button 
                id="tour-profile"
                onClick={() => {
                  setView('profile');
                  soundManager.play('click');
                }}
                className="group relative w-full h-full flex flex-col items-center justify-center focus:outline-none select-none cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-150 pointer-events-auto"
              >
                <div className="relative flex flex-col items-center justify-center rounded-full w-[86%] h-[44px] transition-all duration-200">
                  {view === 'profile' && (
                    <motion.div
                      layoutId="navActiveBg"
                      className={`absolute inset-0 rounded-full -z-10 ${
                        isDarkMode
                          ? 'bg-purple-400/20 border border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                          : 'bg-sky-500/10 border border-sky-400/20 shadow-[0_2px_8px_rgba(14,165,233,0.06)]'
                      }`}
                      transition={{ type: 'spring', stiffness: 380, damping: 25 }}
                    />
                  )}
                  
                  <motion.img 
                    src={avatarIcon} 
                    alt="Profile" 
                    className="w-[28px] h-[28px] object-contain rounded-full"
                    animate={view === 'profile' ? { scale: 1.08, y: -0.5 } : { scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  />
                </div>
              </button>
            </div>
          </nav>
            );
          })()}
        </div>

        {/* PWA 1-Tap Install Banner for Android / Desktop / Safari */}
        <PWAInstallPrompt />

        {/* Post-Signup Fullscreen Chikoo Cinematic Moment */}
        <AnimatePresence>
          {showWelcomeCinematic && (
            <Suspense fallback={null}>
              <ChikooCinematicModal
                videoId="piyTaGRJp7s"
                onComplete={handleWelcomeVideoComplete}
                onSkip={handleWelcomeVideoComplete}
                allowSkip={true}
              />
            </Suspense>
          )}
        </AnimatePresence>

        </motion.div>
      </div>

      {/* 3. DESKTOP RIGHT SIDEBAR (REWARDS + QUESTS ON HOME SCREEN) */}
      {(view === 'home' || view === 'leaderboard') && (
        <DesktopRightPanel
          gems={gems}
          streak={streak}
          energy={energy}
          accuracy={accuracy}
          completedCount={completedLessons.length}
          bestAnswerStreak={bestAnswerStreak}
          lastChestClaimedAt={lastChestClaimedAt}
          onClaimGems={handleClaimGems}
          onClaimChest={handleClaimDailyChest}
          setView={setView}
          onOpenCookieWheel={() => setShowCookieWheelModal(true)}
          onRefillEnergy={() => setShowEnergyRefillModal(true)}
          className="hidden lg:flex lg:w-[320px] xl:w-[360px] shrink-0"
        />
      )}

      {/* Lucky Cookie Wheel Modal */}
      <AnimatePresence>
        {showCookieWheelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[650] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
            onClick={() => { if (!isWheelSpinning) setShowCookieWheelModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Suspense fallback={<div className="text-white text-center py-8 font-black">Loading Wheel...</div>}>
                <CookieWheel
                  title="Lucky Cookie Wheel"
                  subtitle="Spin to win bonus rewards!"
                  showInternalModal={true}
                  onSpinStart={() => setIsWheelSpinning(true)}
                  onClaimReward={async (amount) => {
                    const spinRef = generateSpinReference();
                    const claimRes = await rewardService.claimWheelSpin(spinRef, amount);
                    if (claimRes.granted) {
                      setGems(claimRes.newBalance);
                      soundManager.play('complete');
                      triggerCelebration('reward_box_opened', {
                        title: 'Lucky Wheel Spin!',
                        description: 'Fortune smiles upon your cosmic journey!',
                        rewardText: `+${amount} Cookies 🍪 Won!`,
                        claimId: `wheel_spin_${spinRef}`
                      });
                    }
                    setIsWheelSpinning(false);
                    setShowCookieWheelModal(false);
                  }}
                />
              </Suspense>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Energy / Hearts Refill Modal */}
      <AnimatePresence>
        {showEnergyRefillModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[650] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            onClick={() => {
              setShowEnergyRefillModal(false);
              if (activeLesson && energy <= 0) {
                setActiveLesson(null);
                setLoadingLesson(null);
                setView('home');
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative max-w-md w-full bg-slate-900 border-2 border-rose-500/40 rounded-3xl p-6 text-center text-white shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-3xl shadow-inner">
                ❤️
              </div>

              <h3 className="text-2xl font-black text-rose-300 tracking-wide mb-2">
                Out of Hearts!
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-6 font-medium">
                You ran out of hearts (<span className="text-rose-400 font-bold">{Math.min(5, Math.ceil(energy / 5))} / 5 ❤️</span>)!
                Refill your hearts with cookies to continue learning, or review completed lessons for free!
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    refillEnergy();
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-black text-base shadow-lg shadow-rose-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Heart className="w-5 h-5 fill-white" />
                  <span>Refill Hearts (500 Cookies)</span>
                </button>

                <button
                  onClick={() => {
                    setShowEnergyRefillModal(false);
                    if (activeLesson) {
                      setActiveLesson(null);
                      setLoadingLesson(null);
                    }
                    setView('home');
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 font-bold text-sm border border-slate-700 active:scale-98 transition-all cursor-pointer"
                >
                  📚 Review Completed Lessons (Free)
                </button>
              </div>

              <button
                onClick={() => {
                  setShowEnergyRefillModal(false);
                  if (activeLesson && energy <= 0) {
                    setActiveLesson(null);
                    setLoadingLesson(null);
                    setView('home');
                  }
                }}
                className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                {activeLesson && energy <= 0 ? 'Quit Lesson' : 'Close Window'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Streak Celebration Animation Modal */}
      {showDailyStreakAnimation && (
          <DailyStreakAnimation
          streakCount={Math.max(1, streak)}
          onClose={() => {
            const cleanEmail = (sessionUser || '').toLowerCase().trim();
            const todayStr = new Date().toLocaleDateString('en-CA');
            const storageKey = `CHIKOO_STREAK_ANIMATION_RECORD_${cleanEmail}`;
            try {
              localStorage.setItem(storageKey, JSON.stringify({
                date: todayStr,
                streak: streak
              }));
            } catch (e) {}
            setShowDailyStreakAnimation(false);
          }}
        />
      )}

    </div>
        </>
      )}
    </ErrorBoundary>
  );
}
