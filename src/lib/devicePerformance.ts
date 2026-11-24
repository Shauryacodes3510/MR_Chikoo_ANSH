/**
 * Device Performance Manager
 * Detects low-end mobile/desktop hardware and optimizes render loops,
 * Framer Motion frame rates, CSS effects, and particle density.
 */

export const isLowEndDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const nav = window.navigator as any;
  const isReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (isReducedMotion) return true;

  // Check hardware concurrency (CPU cores)
  const cores = nav.hardwareConcurrency || 4;
  // Check device memory in GB (Chrome/Edge/Opera only)
  const memory = nav.deviceMemory || 4;
  // Check mobile user agent or small screen with touch
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(nav.userAgent);
  const isSmallScreen = window.innerWidth <= 768;

  return cores <= 4 || memory <= 4 || (isMobile && isSmallScreen && (cores <= 6));
};

export const getParticleLimit = (defaultCount: number): number => {
  if (isLowEndDevice()) {
    return Math.max(8, Math.floor(defaultCount * 0.35));
  }
  return defaultCount;
};

export const getTargetFPS = (): number => {
  return isLowEndDevice() ? 30 : 60;
};

export const shouldDisableHeavyBlur = (): boolean => {
  return isLowEndDevice();
};
