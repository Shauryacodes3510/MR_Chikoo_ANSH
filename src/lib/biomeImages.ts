export const ALL_BIOME_IMAGES = [
  'https://i.postimg.cc/brjPWjG3/bg1.webp',
  'https://i.postimg.cc/CxgF1MXd/unit2-bg-image.webp',
  'https://i.postimg.cc/y8hZbVkY/Chikoo-s-Sunny-Forest-Trail.webp',
  'https://i.postimg.cc/RVWrdFpQ/ab144f31-0f23-4367-b5cc-7e6dfb957c3c-(1).webp',
  'https://i.postimg.cc/DwctyXSW/e3b04314-8549-4e91-8afa-8b1fdb56402e.webp',
  '/unit6_bg_image.webp',
] as const;

// Permanent cache mapping for fast, synchronous access
const biomeImagesCache: Record<number, string> = {
  0: 'https://i.postimg.cc/brjPWjG3/bg1.webp',
  1: 'https://i.postimg.cc/CxgF1MXd/unit2-bg-image.webp',
  2: 'https://i.postimg.cc/y8hZbVkY/Chikoo-s-Sunny-Forest-Trail.webp',
  3: 'https://i.postimg.cc/RVWrdFpQ/ab144f31-0f23-4367-b5cc-7e6dfb957c3c-(1).webp',
  4: 'https://i.postimg.cc/DwctyXSW/e3b04314-8549-4e91-8afa-8b1fdb56402e.webp',
  5: '/unit6_bg_image.webp',
};

// Retain decoded HTMLImageElement instances in memory so GPU raster textures stay hot in VRAM
const preloadedImageInstances: HTMLImageElement[] = [];
let isPreloadingInitiated = false;

/**
 * Proactively preloads and pre-decodes all biome background images into GPU memory.
 * Ensures that when the user scrolls between units, every background is already decoded
 * and renders at a smooth 60fps/120fps with zero flicker or blank loading flashes.
 */
export function preloadAllBiomes(): Promise<void[]> {
  if (typeof window === 'undefined' || isPreloadingInitiated) {
    return Promise.resolve([]);
  }
  isPreloadingInitiated = true;

  const loadPromises = ALL_BIOME_IMAGES.map((url, index) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.src = url;
      img.decoding = 'async';
      preloadedImageInstances[index] = img;

      const finish = () => {
        if ('decode' in img && typeof img.decode === 'function') {
          img.decode().then(() => resolve()).catch(() => resolve());
        } else {
          resolve();
        }
      };

      if (img.complete) {
        finish();
      } else {
        img.onload = finish;
        img.onerror = () => resolve();
      }
    });
  });

  return Promise.all(loadPromises.map((p, i) => p.then(() => console.log(`Biome image ${i} loaded`)).catch(() => console.error(`Biome image ${i} failed`))));
}

// Immediate eager execution as soon as this module is imported in client
if (typeof window !== 'undefined') {
  preloadAllBiomes();
}

export const PUBLIC_BIOME_FALLBACKS: Record<number, string> = {
  0: 'https://i.postimg.cc/brjPWjG3/bg1.webp',
  1: 'https://i.postimg.cc/CxgF1MXd/unit2-bg-image.webp',
  2: 'https://i.postimg.cc/y8hZbVkY/Chikoo-s-Sunny-Forest-Trail.webp',
  3: 'https://i.postimg.cc/RVWrdFpQ/ab144f31-0f23-4367-b5cc-7e6dfb957c3c-(1).webp',
  4: 'https://i.postimg.cc/DwctyXSW/e3b04314-8549-4e91-8afa-8b1fdb56402e.webp',
  5: '/unit6_bg_image.webp',
};

/**
 * Returns the cached biome background image URL for the given module index.
 */
export function getBiomeImage(mIdx: number): string {
  const count = ALL_BIOME_IMAGES.length || 6;
  const idx = Math.abs(mIdx) % count;
  return biomeImagesCache[idx] || PUBLIC_BIOME_FALLBACKS[idx] || `/unit${idx + 1}_bg_image.webp` || '/bg_image.webp';
}

/**
 * Resolves the background image for a module, checking metadata or falling back to index.
 */
export function getModuleBiomeImage(module?: any, mIdx: number = 0): string {
  if (module) {
    if (module.metadata && typeof module.metadata === 'object') {
      const metaBg = module.metadata.background_image || module.metadata.backgroundImage || module.metadata.bg_image;
      if (metaBg && typeof metaBg === 'string' && metaBg.trim()) {
        return metaBg;
      }
    }
    if (typeof module.background_image === 'string' && module.background_image.trim()) {
      return module.background_image;
    }
    if (typeof module.bg_image === 'string' && module.bg_image.trim()) {
      return module.bg_image;
    }
    const title = (module.title || '').toLowerCase();
    if (title.includes('noticer') || module.id === 'm1') {
      return '/intro_bg.webp';
    }
  }
  return getBiomeImage(mIdx);
}

/**
 * Returns an array of all biome image URLs.
 */
export function getBiomeImagesArray(): string[] {
  return [...ALL_BIOME_IMAGES];
}

/**
 * Backward compatibility alias for preload functions
 */
export function preloadNextBiomes(): void {
  preloadAllBiomes();
}

export function predecodeBiomeImages(): void {
  preloadAllBiomes();
}

/**
 * Chikoo mascot image mappings for unit cards and header banners per unit/module index
 */
export const UNIT_CHIKOO_IMAGES: Record<number, string> = {
  0: 'https://i.postimg.cc/8C36gk1q/e4eafdae-c092-4272-8f8a-6b03d9b903dc.webp',
  1: 'https://i.postimg.cc/L8Pd3Nqp/Chat-GPT-Image-Oct-29-2026-07-42-16-PM.webp',
  2: 'https://i.postimg.cc/PJq70M2d/d587b002-b4a4-4c52-93e3-60833f99df16.webp',
  3: 'https://i.postimg.cc/XvKZDNdC/08eb28e2-903c-460a-bfa4-0dc6e29c7cb7.webp',
  4: '/exaplaination_screens/talk2.webp',
  5: '/auth_mascot.webp',
};

/**
 * Resolves the appropriate Chikoo character image for a unit card or unit header banner.
 */
export function getUnitChikooImage(unitIdx: number = 0, module?: any): string {
  if (module && typeof module === 'object') {
    const metaImg = module.metadata?.chikoo_image || module.metadata?.mascot_image || module.chikoo_image || module.mascot_image;
    if (metaImg && typeof metaImg === 'string' && metaImg.trim()) {
      return metaImg;
    }
    const title = (module.title || '').toLowerCase();
    if (title.includes('unit 4') || title.includes('module 4') || module.id === 'm4') {
      return 'https://i.postimg.cc/XvKZDNdC/08eb28e2-903c-460a-bfa4-0dc6e29c7cb7.webp';
    }
  }
  const idx = Math.abs(unitIdx) % 6;
  return UNIT_CHIKOO_IMAGES[idx] || 'https://i.postimg.cc/XvKZDNdC/08eb28e2-903c-460a-bfa4-0dc6e29c7cb7.webp';
}

