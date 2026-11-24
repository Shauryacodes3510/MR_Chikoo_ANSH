import { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import ChikooReachingLoader from './ChikooReachingLoader';

export interface SplashScreenProps {
  progress?: number;
  statusText?: string;
  isReady?: boolean;
  onFinish: () => void;
}

export const SplashScreen = memo(function SplashScreen({
  progress = 0,
  isReady = false,
  onFinish
}: SplashScreenProps) {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const finishTriggered = useRef(false);

  // Enforce 3.5s minimum duration (3-4 seconds) for Chikoo reaching entry animation
  useEffect(() => {
    const minTimer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 3500);

    return () => clearTimeout(minTimer);
  }, []);

  // Transition out ONLY after minimum 3.5s duration AND when app readiness is achieved
  useEffect(() => {
    const isAppLoaded = isReady || progress >= 95;
    
    if (minTimeElapsed && isAppLoaded && !finishTriggered.current) {
      setIsExiting(true);
      const finishTimer = setTimeout(() => {
        if (!finishTriggered.current) {
          finishTriggered.current = true;
          onFinish();
        }
      }, 350);
      return () => clearTimeout(finishTimer);
    }
  }, [minTimeElapsed, isReady, progress, onFinish]);

  // Safety fallback after 10s maximum to guarantee app never hangs
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (!finishTriggered.current) {
        setIsExiting(true);
        setTimeout(() => {
          if (!finishTriggered.current) {
            finishTriggered.current = true;
            onFinish();
          }
        }, 300);
      }
    }, 10000);
    return () => clearTimeout(safetyTimer);
  }, [onFinish]);

  return (
    <motion.div
      id="splash-screen-container"
      className="fixed inset-0 w-full h-[100dvh] select-none z-[999999] overflow-hidden m-0 p-0 bg-white dark:bg-[#0b0f19]"
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
    >
      <ChikooReachingLoader fullScreen={true} text="Chikoo is reaching..." />
    </motion.div>
  );
});

export default SplashScreen;
