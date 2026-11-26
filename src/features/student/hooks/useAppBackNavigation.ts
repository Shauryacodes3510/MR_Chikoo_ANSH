import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAppBackNavigationOptions {
  view: string;
  setView: (view: any) => void;
  activeLesson: any | null;
  onCloseLesson: () => void;
  activeModals: {
    isAdminActive: boolean;
    setIsAdminActive: (v: boolean) => void;
    showEnergyRefillModal: boolean;
    setShowEnergyRefillModal: (v: boolean) => void;
    showCookieWheelModal: boolean;
    setShowCookieWheelModal: (v: boolean) => void;
    adventureLauncher: any | null;
    setAdventureLauncher: (v: any) => void;
    showDailyStreakAnimation: boolean;
    setShowDailyStreakAnimation: (v: boolean) => void;
    isQuestDetailsOpen: boolean;
    setIsQuestDetailsOpen: (v: boolean) => void;
    showSignOutConfirm: boolean;
    setShowSignOutConfirm: (v: boolean) => void;
  };
}

export function useAppBackNavigation({
  view,
  setView,
  activeLesson,
  onCloseLesson,
  activeModals
}: UseAppBackNavigationOptions) {
  const [showExitModal, setShowExitModal] = useState(false);
  const isPopstateProcessingRef = useRef(false);
  const lastBackPressTimeRef = useRef<number>(0);
  const activeLessonRef = useRef(activeLesson);
  activeLessonRef.current = activeLesson;
  const viewRef = useRef(view);
  viewRef.current = view;

  // Initialize history anchor guard on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const currentState = window.history.state;
      if (!currentState || !currentState.chikoo) {
        window.history.replaceState(
          { chikoo: true, view: 'home', depth: 0 },
          '',
          window.location.pathname + window.location.search
        );
        window.history.pushState(
          { chikoo: true, view: 'home', depth: 1 },
          '',
          window.location.pathname + window.location.search
        );
      }
    } catch (_) {}
  }, []);

  // Synchronize view changes with browser history (PushState for sub-views)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isPopstateProcessingRef.current) {
      isPopstateProcessingRef.current = false;
      return;
    }

    // Only push if not on home guard or if user moved to a sub-tab
    if (view !== 'home') {
      try {
        const hash = '#' + view;
        if (window.location.hash !== hash) {
          window.history.pushState(
            { chikoo: true, view, depth: 2 },
            '',
            window.location.pathname + window.location.search + hash
          );
        }
      } catch (_) {}
    }
  }, [view]);

  // Synchronize active lesson with browser history
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (activeLesson) {
      if (isPopstateProcessingRef.current) {
        isPopstateProcessingRef.current = false;
        return;
      }
      try {
        window.history.pushState(
          { chikoo: true, view: viewRef.current, isLesson: true, lessonId: activeLesson.id },
          '',
          window.location.pathname + window.location.search + '#lesson'
        );
      } catch (_) {}
    }
  }, [activeLesson]);

  // Handle Android Back button & Browser Previous / Next Arrows
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (event: PopStateEvent) => {
      isPopstateProcessingRef.current = true;

      // 1. Check if any top-level overlay modal is open
      if (activeModals.showSignOutConfirm) {
        activeModals.setShowSignOutConfirm(false);
        return;
      }
      if (activeModals.showDailyStreakAnimation) {
        activeModals.setShowDailyStreakAnimation(false);
        return;
      }
      if (activeModals.showCookieWheelModal) {
        activeModals.setShowCookieWheelModal(false);
        return;
      }
      if (activeModals.showEnergyRefillModal) {
        activeModals.setShowEnergyRefillModal(false);
        return;
      }
      if (activeModals.adventureLauncher) {
        activeModals.setAdventureLauncher(null);
        return;
      }
      if (activeModals.isQuestDetailsOpen) {
        activeModals.setIsQuestDetailsOpen(false);
        return;
      }
      if (activeModals.isAdminActive) {
        activeModals.setIsAdminActive(false);
        return;
      }

      // 2. Check if a lesson is currently open -> prompt in-lesson confirmation modal
      if (activeLessonRef.current) {
        const now = Date.now();
        // Double-tap back within 2 seconds force-exits lesson
        if (now - lastBackPressTimeRef.current < 2000) {
          onCloseLesson();
          return;
        }
        lastBackPressTimeRef.current = now;
        window.dispatchEvent(new CustomEvent('CHIKOO_PROMPT_QUIT_LESSON'));

        // Push guard back so the browser doesn't close the entire window
        try {
          window.history.pushState(
            { chikoo: true, view: viewRef.current, isLesson: true },
            '',
            window.location.pathname + window.location.search + '#lesson'
          );
        } catch (_) {}
        return;
      }

      // 3. Sub-view navigation (Profile, Quests, Leaderboard, Arena, etc.)
      const targetView = event.state?.view || (window.location.hash ? window.location.hash.replace('#', '') : 'home');

      if (viewRef.current !== 'home') {
        if (targetView && targetView !== viewRef.current) {
          setView(targetView);
        } else {
          setView('home');
        }
        return;
      }

      // 4. If targetView is another view (e.g. Browser Forward clicked)
      if (targetView && targetView !== 'home') {
        setView(targetView);
        return;
      }

      // 5. User is on 'home' and pressed Back -> Trigger Exit Confirmation
      const now = Date.now();
      // Double-tap back within 2 seconds exits immediately
      if (now - lastBackPressTimeRef.current < 2200) {
        performAppExit();
        return;
      }

      lastBackPressTimeRef.current = now;
      setShowExitModal(true);

      // Re-anchor history so subsequent back presses are safely intercepted
      try {
        window.history.pushState(
          { chikoo: true, view: 'home', depth: 1 },
          '',
          window.location.pathname + window.location.search
        );
      } catch (_) {}
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeModals, onCloseLesson, setView]);

  const handleStay = useCallback(() => {
    setShowExitModal(false);
    try {
      window.history.pushState(
        { chikoo: true, view: 'home', depth: 1 },
        '',
        window.location.pathname + window.location.search
      );
    } catch (_) {}
  }, []);

  const performAppExit = useCallback(() => {
    try {
      if ((navigator as any).app?.exitApp) {
        (navigator as any).app.exitApp();
      } else if ((window as any).Capacitor?.App?.exitApp) {
        (window as any).Capacitor.App.exitApp();
      } else {
        window.history.go(-2);
      }
    } catch (_) {
      window.close();
    }
  }, []);

  return {
    showExitModal,
    handleStay,
    handleConfirmExit: performAppExit
  };
}
