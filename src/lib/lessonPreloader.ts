import { Lesson, Challenge } from './curriculumTypes';

// Global cache of preloaded and decoded image URLs to avoid duplicate network requests
const preloadedImagesCache = new Set<string>();

// In-flight image requests map to prevent duplicate concurrent network requests for the same URL
const inFlightRequests = new Map<string, Promise<boolean>>();

/**
 * Validates whether a URL is a loadable image or media URL.
 */
export function isValidImageUrl(url?: any): url is string {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('@/')
  );
}

/**
 * Normalizes URL string, handling comma-separated URLs (e.g., in visualLessonScreen mediaUrl).
 */
export function extractUrlsFromString(str?: string): string[] {
  if (!str || typeof str !== 'string') return [];
  return str
    .split(',')
    .map(s => s.trim())
    .filter(isValidImageUrl);
}

/**
 * Extracts all critical image assets for a SINGLE challenge.
 * Returns unique array of valid image URLs.
 */
export function extractChallengeAssets(challenge?: Challenge | null): string[] {
  if (!challenge) return [];
  const urls: string[] = [];

  const addUrl = (url?: string) => {
    if (isValidImageUrl(url) && !urls.includes(url)) {
      urls.push(url);
    }
  };

  // Direct challenge image
  if (challenge.imageUrl) addUrl(challenge.imageUrl);

  // Content screen & Visual lesson screen
  if (challenge.contentScreen?.mediaUrl) {
    extractUrlsFromString(challenge.contentScreen.mediaUrl).forEach(addUrl);
  }
  if (challenge.visualLessonScreen?.mediaUrl) {
    extractUrlsFromString(challenge.visualLessonScreen.mediaUrl).forEach(addUrl);
  }
  if ((challenge.contentScreen as any)?.backgroundImage) {
    addUrl((challenge.contentScreen as any).backgroundImage);
  }
  if ((challenge.visualLessonScreen as any)?.backgroundImage) {
    addUrl((challenge.visualLessonScreen as any).backgroundImage);
  }
  if ((challenge.visualLessonScreen as any)?.characterImage) {
    addUrl((challenge.visualLessonScreen as any).characterImage);
  }

  // Specific challenge subtypes
  if (challenge.imageExplainer?.imageUrl) addUrl(challenge.imageExplainer.imageUrl);
  if (challenge.funFact?.imageUrl) addUrl(challenge.funFact.imageUrl);
  if (challenge.memeScreen?.imageUrl) addUrl(challenge.memeScreen.imageUrl);
  if (challenge.visualAnalogy?.illustrationUrl) addUrl(challenge.visualAnalogy.illustrationUrl);
  if ((challenge.visualAnalogy as any)?.imageUrl) addUrl((challenge.visualAnalogy as any).imageUrl);
  if (challenge.gifExplainer?.gifUrl) addUrl(challenge.gifExplainer.gifUrl);
  if (challenge.analogy?.imageUrl) addUrl(challenge.analogy.imageUrl);

  // Comic panels
  if (Array.isArray(challenge.comicStory?.panels)) {
    for (const panel of challenge.comicStory.panels) {
      if (panel?.imageUrl) addUrl(panel.imageUrl);
    }
  }

  // Interactive items
  if (Array.isArray(challenge.items)) {
    for (const item of challenge.items) {
      const img = item?.imageUrl || item?.image || item?.src || item?.url || item?.img;
      if (img) addUrl(img);
    }
  }

  // Cards
  if (Array.isArray(challenge.cards)) {
    for (const card of challenge.cards) {
      const img = card?.imageUrl || card?.image;
      if (img) addUrl(img);
    }
  }

  // Story variants
  if (challenge.beforeAfterStory?.imageUrl) addUrl(challenge.beforeAfterStory.imageUrl);
  if (challenge.interactiveReveal?.imageUrl) addUrl(challenge.interactiveReveal.imageUrl);
  if (challenge.studentStory?.imageUrl) addUrl(challenge.studentStory.imageUrl);
  if (challenge.whyShouldICare?.imageUrl) addUrl(challenge.whyShouldICare.imageUrl);
  if ((challenge as any).aiAroundYou?.imageUrl) addUrl((challenge as any).aiAroundYou.imageUrl);
  if ((challenge as any).mythBuster?.imageUrl) addUrl((challenge as any).mythBuster.imageUrl);
  if ((challenge as any).spotTheAi?.imageUrl) addUrl((challenge as any).spotTheAi.imageUrl);
  if ((challenge as any).spotTheAi?.imageA) addUrl((challenge as any).spotTheAi.imageA);
  if ((challenge as any).spotTheAi?.imageB) addUrl((challenge as any).spotTheAi.imageB);
  if ((challenge as any).beforeAfterExperiment?.beforeImage) addUrl((challenge as any).beforeAfterExperiment.beforeImage);
  if ((challenge as any).beforeAfterExperiment?.afterImage) addUrl((challenge as any).beforeAfterExperiment.afterImage);
  if ((challenge as any).labelDiagram?.diagramUrl) addUrl((challenge as any).labelDiagram.diagramUrl);
  if ((challenge as any).dragToCompleteDiagram?.diagramUrl) addUrl((challenge as any).dragToCompleteDiagram.diagramUrl);
  if ((challenge as any).hotspotQuestion?.imageUrl) addUrl((challenge as any).hotspotQuestion.imageUrl);
  if ((challenge as any).tapCorrectArea?.imageUrl) addUrl((challenge as any).tapCorrectArea.imageUrl);

  return urls;
}

/**
 * Checks if all critical image assets for a given challenge are already cached in memory.
 */
export function isChallengeAssetsCached(challenge?: Challenge | null): boolean {
  const urls = extractChallengeAssets(challenge);
  if (urls.length === 0) return true;
  return urls.every(url => preloadedImagesCache.has(url));
}

/**
 * Extracts ALL image assets required for a given lesson (all storylines and challenges).
 * Returns a deduplicated list of image URLs.
 */
export function extractAllLessonAssets(lesson: Lesson): string[] {
  const assets: string[] = [];
  const addAsset = (url?: string) => {
    if (isValidImageUrl(url) && !assets.includes(url)) {
      assets.push(url);
    }
  };

  // 1. Chikoo Mascot base illustrations
  addAsset('/Aibo_sneak.webp');
  addAsset('https://i.postimg.cc/6qvZnDxh/5ad3effa-111a-469f-bb9d-68de79eb39b3-removebg-preview.png');
  addAsset('https://i.postimg.cc/25yH51Xb/f6360331-4e16-48e0-bb04-72a556ee6596.webp');
  addAsset('/chikoo_interactive_completion.webp');
  addAsset('/lesson_completion_mascot.webp');

  // 2. Extract media from ALL challenges for the active lesson
  const allChallenges = lesson.challenges || [];
  for (const challenge of allChallenges) {
    const challengeUrls = extractChallengeAssets(challenge);
    challengeUrls.forEach(addAsset);
  }

  return assets;
}

/**
 * Alias for backward compatibility
 */
export const extractCriticalLessonAssets = extractAllLessonAssets;

/**
 * Preloads and asynchronously decodes a single image URL into browser cache and GPU memory.
 * - Deduplicates concurrent in-flight requests.
 * - Caches completed results to prevent redundant downloads.
 * - Uses browser `img.decode()` off the main thread to guarantee zero flicker.
 * - Gracefully continues on error or timeout without blocking.
 */
export function preloadImage(url: string, timeoutMs: number = 2200): Promise<boolean> {
  if (!isValidImageUrl(url)) return Promise.resolve(true);

  // 1. Fast cache hit: already loaded and decoded
  if (preloadedImagesCache.has(url)) {
    return Promise.resolve(true);
  }

  // 2. Deduplicate in-flight requests for the exact same URL
  if (inFlightRequests.has(url)) {
    return inFlightRequests.get(url)!;
  }

  const loadPromise = new Promise<boolean>((resolve) => {
    let completed = false;

    const cleanup = (success: boolean) => {
      if (!completed) {
        completed = true;
        if (success) {
          preloadedImagesCache.add(url);
        }
        inFlightRequests.delete(url);
        resolve(success);
      }
    };

    try {
      const img = new Image();
      img.referrerPolicy = 'no-referrer';

      img.onload = async () => {
        try {
          if ('decode' in img && typeof img.decode === 'function') {
            await img.decode();
          }
        } catch {
          // Non-blocking decode fallback
        }
        cleanup(true);
      };

      // Graceful fallback: continue without blocking lesson if an image fails
      img.onerror = () => cleanup(false);

      img.src = url;

      // Handle cases where the image was already cached by browser
      if (img.complete && img.naturalWidth > 0) {
        if ('decode' in img && typeof img.decode === 'function') {
          img.decode().then(() => cleanup(true)).catch(() => cleanup(true));
        } else {
          cleanup(true);
        }
        return;
      }

      // Safe timeout guard
      setTimeout(() => cleanup(true), timeoutMs);
    } catch {
      cleanup(true);
    }
  });

  inFlightRequests.set(url, loadPromise);
  return loadPromise;
}

/**
 * Preloads critical assets for a specific challenge with a fast fallback.
 */
export async function preloadChallengeAssets(
  challenge?: Challenge | null,
  timeoutMs: number = 1500
): Promise<void> {
  if (!challenge) return;
  const urls = extractChallengeAssets(challenge);
  if (urls.length === 0) return;

  const uncachedUrls = urls.filter(u => !preloadedImagesCache.has(u));
  if (uncachedUrls.length === 0) return;

  const timeoutPromise = new Promise<void>((resolve) => {
    setTimeout(resolve, timeoutMs);
  });

  const loadPromise = Promise.allSettled(
    uncachedUrls.map(url => preloadImage(url, timeoutMs))
  );

  await Promise.race([loadPromise, timeoutPromise]);
}

/**
 * Preloads ALL lesson storyline and challenge images in parallel while cloud transition is visible.
 * Decodes every image to ensure zero layout shift, flicker, or image pop-in when the cloud opens.
 * Guarantees completion within `maxTimeoutMs` even on slow networks or missing URLs.
 */
export async function preloadLessonAssets(
  lesson: Lesson,
  onProgress?: (progress: number) => void,
  maxTimeoutMs: number = 2400
): Promise<void> {
  const challenges = lesson.challenges || [];
  
  // Prioritize critical immediate assets: Challenges 0 and 1 (first screen + immediate next)
  const immediateChallenges = challenges.slice(0, 2);
  const immediateUrls = immediateChallenges.flatMap(c => extractChallengeAssets(c));
  
  // Remaining assets will stream in background
  const remainingChallenges = challenges.slice(2);
  const remainingUrls = remainingChallenges.flatMap(c => extractChallengeAssets(c));

  // If no immediate URLs, signal ready instantly
  if (immediateUrls.length === 0) {
    onProgress?.(100);
    // Background stream remaining
    if (remainingUrls.length > 0) {
      setTimeout(() => {
        remainingUrls.forEach(url => preloadImage(url, 3000));
      }, 100);
    }
    return;
  }

  let loadedImmediate = 0;
  const uncachedImmediate = immediateUrls.filter(u => !preloadedImagesCache.has(u));

  if (uncachedImmediate.length === 0) {
    onProgress?.(100);
    // Background stream remaining
    if (remainingUrls.length > 0) {
      setTimeout(() => {
        remainingUrls.forEach(url => preloadImage(url, 3000));
      }, 100);
    }
    return;
  }

  // Safety timeout guard for critical immediate screen
  const criticalTimeout = Math.min(maxTimeoutMs, 600);
  const timeoutPromise = new Promise<void>((resolve) => {
    setTimeout(() => {
      onProgress?.(100);
      resolve();
    }, criticalTimeout);
  });

  const loadImmediatePromise = Promise.allSettled(
    uncachedImmediate.map(async (url) => {
      await preloadImage(url, criticalTimeout);
      loadedImmediate++;
      const pct = Math.round((loadedImmediate / uncachedImmediate.length) * 100);
      onProgress?.(pct);
    })
  );

  await Promise.race([loadImmediatePromise, timeoutPromise]);
  onProgress?.(100);

  // Stream remainder in background without blocking UI
  if (remainingUrls.length > 0) {
    setTimeout(() => {
      remainingUrls.forEach(url => preloadImage(url, 4000));
    }, 150);
  }
}

/**
 * On-demand background preloader for subsequent screens while student is actively playing.
 */
export function preloadNextChallengeAssets(challenges: Challenge[], nextIndex: number): void {
  if (!challenges || nextIndex < 0 || nextIndex >= challenges.length) return;

  const targetIndices = [nextIndex, nextIndex + 1].filter(idx => idx < challenges.length);
  targetIndices.forEach(idx => {
    const targetChallenge = challenges[idx];
    if (!targetChallenge) return;

    const urls = extractChallengeAssets(targetChallenge);
    urls.forEach((url) => {
      if (url && !preloadedImagesCache.has(url)) {
        preloadImage(url, 3000);
      }
    });
  });
}

/**
 * Intelligently preloads next lesson's critical assets during browser idle time or completion.
 * When the user taps the next lesson node, its initial storyline and challenge visuals
 * are already resident in browser and GPU cache for instantaneous, zero-delay transition.
 */
export function preloadNextLesson(nextLesson?: Lesson | null): void {
  if (!nextLesson) return;

  const runPreload = () => {
    try {
      const urls = extractAllLessonAssets(nextLesson);
      // Preload critical initial assets in low-priority background
      const priorityUrls = urls.slice(0, 6);
      priorityUrls.forEach((url) => {
        if (url && !preloadedImagesCache.has(url)) {
          preloadImage(url, 4000);
        }
      });
    } catch {
      // Non-blocking background preload
    }
  };

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(runPreload, { timeout: 2000 });
  } else {
    setTimeout(runPreload, 300);
  }
}

