/**
 * Utility to filter and validate user-facing text for dynamic frontend translation.
 * Excludes IDs, URLs, code, file paths, character identifiers, hashes, and purely technical strings.
 */

// Regex patterns to identify non-user-facing technical values
const URL_REGEX = /^(https?:\/\/|data:|blob:|mailto:|tel:|\/api\/|\/SoundEffects\/|\/exaplaination_screens\/)/i;
const FILE_EXTENSION_REGEX = /\.(png|webp|jpg|jpeg|svg|gif|mp3|wav|ogg|json|ts|tsx|js|jsx|css|html|md)$/i;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_COLOR_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const TIME_FORMAT_REGEX = /^\d{1,2}:\d{2}(:\d{2})?$/;
const PURE_NUMBER_OR_METRIC_REGEX = /^([+-]?\d+([.,]\d+)?(\s*(min|mins|sec|secs|s|m|h|px|%|xp|gem|cookie|cookies|hearts?|pts))?)$/i;
const SYMBOLS_ONLY_REGEX = /^[\s\d\p{P}\p{S}\p{Emoji}\u200B-\u200D\uFEFF]+$/u;

// Words that should not be translated (pure JS internal engine values)
const TECHNICAL_EXCLUSIONS = new Set([
  'undefined',
  'null',
  'nan',
  '[object object]',
  'function () { [native code] }'
]);

// System ID pattern (strict match to entire identifier, not text starting with a word)
const SYSTEM_ID_REGEX = /^(qi_|opt_|cat_|c\d+_|lesson_|unit_|module_|badge_|user_|sess_|tour-|profile_|hud-|task-)[a-z0-9_-]{3,}$/i;

/**
 * Checks if a string is a meaningful user-facing text suitable for translation.
 */
export function isUserFacingText(text: string | null | undefined): boolean {
  if (!text || typeof text !== 'string') return false;

  const trimmed = text.trim();
  if (trimmed.length < 2) return false;

  // Exclude purely numbers, math or punctuation
  if (SYMBOLS_ONLY_REGEX.test(trimmed) && !/[a-zA-Z\u0900-\u0D7F]/.test(trimmed)) {
    return false;
  }

  // Exclude pure numbers / metrics (e.g. "15 min", "100%", "25")
  if (PURE_NUMBER_OR_METRIC_REGEX.test(trimmed)) {
    return false;
  }

  // Exclude URLs and media paths
  if (URL_REGEX.test(trimmed) || trimmed.startsWith('/') || FILE_EXTENSION_REGEX.test(trimmed)) {
    return false;
  }

  // Exclude system identifiers, UUIDs, hex codes
  if (SYSTEM_ID_REGEX.test(trimmed) || UUID_REGEX.test(trimmed) || HEX_COLOR_REGEX.test(trimmed)) {
    return false;
  }

  // Exclude time formats (e.g. 12:00)
  if (TIME_FORMAT_REGEX.test(trimmed)) {
    return false;
  }

  // Exclude single technical keywords
  if (TECHNICAL_EXCLUSIONS.has(trimmed.toLowerCase())) {
    return false;
  }

  // Must contain at least one word character
  const hasWordChars = /[\p{L}]/u.test(trimmed);
  if (!hasWordChars) return false;

  // Exclude code snippets / HTML tags
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    return false;
  }

  return true;
}

/**
 * Checks if an HTML element or any of its ancestors is marked as excluded from translation.
 */
export function isElementExcluded(element: HTMLElement | null): boolean {
  if (!element) return true;

  // Tag exclusions
  const tagName = element.tagName.toLowerCase();
  if (['script', 'style', 'noscript', 'code', 'pre', 'svg', 'canvas', 'audio', 'video'].includes(tagName)) {
    return true;
  }

  // Check data attributes and classes
  if (
    element.getAttribute('data-no-translate') === 'true' ||
    element.getAttribute('translate') === 'no' ||
    element.classList.contains('notranslate') ||
    element.classList.contains('no-translate')
  ) {
    return true;
  }

  // Form input exclusions (passwords, numbers, files, hidden)
  if (tagName === 'input') {
    const inputType = (element as HTMLInputElement).type?.toLowerCase();
    if (['password', 'number', 'file', 'color', 'hidden', 'range'].includes(inputType)) {
      return true;
    }
  }

  // Parent element exclusion check (up to 4 levels)
  let parent = element.parentElement;
  let depth = 0;
  while (parent && depth < 4) {
    const parentTag = parent.tagName.toLowerCase();
    if (['script', 'style', 'code', 'pre', 'svg'].includes(parentTag)) {
      return true;
    }
    if (
      parent.getAttribute('data-no-translate') === 'true' ||
      parent.getAttribute('translate') === 'no' ||
      parent.classList.contains('notranslate')
    ) {
      return true;
    }
    parent = parent.parentElement;
    depth++;
  }

  return false;
}
