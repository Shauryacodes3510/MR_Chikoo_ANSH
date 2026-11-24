// Critical Homepage Assets & Font Preloader for Chikoo
// Preloads and decodes only the high-priority visual assets and typography
// needed for the first meaningful view of the homepage / learning path.

import homeIcon from '@/home_icon.webp';
import practiceIcon from '@/practice_icon.webp';
import questIcon from '@/Quest.webp';
import ranksIcon from '@/leaderboard_icon.webp';
import rewardsIcon from '@/chest1.webp';
import avatarIcon from '@/avatar.webp';
import cookiesIcon from '@/cookies.webp';
import worldIcon from '@/world.webp';
import streakIcon from '@/streak.webp';
import introBg from '@/intro_bg.webp';
import chikooSneak from '@/Aibo_sneak.webp';
import chestImg from '@/Chest.webp';

export const CRITICAL_HOMEPAGE_IMAGE_URLS: string[] = [
  homeIcon,
  practiceIcon,
  questIcon,
  ranksIcon,
  rewardsIcon,
  avatarIcon,
  cookiesIcon,
  worldIcon,
  streakIcon,
  introBg,
  chikooSneak,
  chestImg,
  'https://i.postimg.cc/8C36gk1q/e4eafdae-c092-4272-8f8a-6b03d9b903dc.webp',
  'https://i.postimg.cc/L8Pd3Nqp/Chat-GPT-Image-Oct-29-2026-07-42-16-PM.webp',
  'https://i.postimg.cc/PJq70M2d/d587b002-b4a4-4c52-93e3-60833f99df16.webp',
  '/bg_image.webp',
  '/unit2_bg_image.webp',
  '/unit3_bg_image.webp',
  '/unit4_bg_image.webp',
  '/unit5_bg_image.webp',
  '/unit6_bg_image.webp',
  '/splash_screen.webp'
];

// In-memory cache of already decoded image URLs to avoid duplicate fetches
const preloadedUrls = new Set<string>();

/**
 * Preloads and decodes an image via HTMLImageElement.
 * Returns true if successful, false if timed out or failed (non-blocking).
 */
export function preloadImage(url: string, timeoutMs: number = 1800): Promise<boolean> {
  if (!url || typeof url !== 'string') return Promise.resolve(true);
  if (preloadedUrls.has(url)) return Promise.resolve(true);

  return new Promise((resolve) => {
    let resolved = false;
    const finish = (success: boolean) => {
      if (resolved) return;
      resolved = true;
      if (success) preloadedUrls.add(url);
      resolve(success);
    };

    const timer = setTimeout(() => {
      finish(false); // Gracefully fallback so user is never blocked
    }, timeoutMs);

    try {
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.onload = async () => {
        try {
          if ('decode' in img && typeof img.decode === 'function') {
            await img.decode();
          }
        } catch {
          // Decode failure fallback
        }
        clearTimeout(timer);
        finish(true);
      };
      img.onerror = () => {
        clearTimeout(timer);
        finish(false);
      };
      img.src = url;

      if (img.complete && img.naturalWidth > 0) {
        clearTimeout(timer);
        finish(true);
      }
    } catch {
      clearTimeout(timer);
      finish(false);
    }
  });
}

/**
 * Preload document fonts with a safe timeout.
 */
export async function preloadFonts(timeoutMs: number = 800): Promise<boolean> {
  if (typeof document === 'undefined' || !('fonts' in document)) {
    return true;
  }
  try {
    const fontsPromise = (document as any).fonts.ready;
    const timeoutPromise = new Promise<boolean>((res) => setTimeout(() => res(true), timeoutMs));
    await Promise.race([fontsPromise, timeoutPromise]);
    return true;
  } catch {
    return true;
  }
}

/**
 * Preloads all critical homepage visual assets in parallel.
 * Emits progress between 0 and 100.
 */
export async function preloadCriticalHomepageAssets(
  onProgress?: (progress: number) => void,
  maxTimeoutMs: number = 2200
): Promise<void> {
  const urls = CRITICAL_HOMEPAGE_IMAGE_URLS;
  const totalItems = urls.length + 1; // +1 for fonts
  let completedItems = 0;

  const updateProgress = () => {
    completedItems++;
    const pct = Math.min(100, Math.round((completedItems / totalItems) * 100));
    onProgress?.(pct);
  };

  // 1. Kick off font readiness check
  const fontPromise = preloadFonts(800).then(updateProgress);

  // 2. Preload images concurrently with per-item safety timeout
  const imagePromises = urls.map(async (url) => {
    await preloadImage(url, 1500);
    updateProgress();
  });

  // 3. Race against absolute maximum timeout to guarantee fast startup
  const safetyTimeout = new Promise<void>((resolve) => {
    setTimeout(resolve, maxTimeoutMs);
  });

  await Promise.race([
    Promise.allSettled([fontPromise, ...imagePromises]),
    safetyTimeout
  ]);

  onProgress?.(100);
}
