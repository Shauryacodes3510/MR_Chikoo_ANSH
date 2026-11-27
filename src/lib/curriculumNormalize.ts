/**
 * curriculumNormalize.ts
 *
 * Pure helpers that normalise screen JSON into the shape the app expects.
 * Extracted verbatim from AdminPanel.tsx (Copilot v1, Wave 0) so the AI Copilot
 * and the JSON import flow share ONE normalizer instead of two copies.
 *
 * No React, no side effects. Behaviour is identical to the original inline code.
 */

/** Maps user-friendly screen type names (used in imports) to internal type ids. */
export const mapUserFriendlyScreenType = (type: string): string => {
  const mapping: Record<string, string> = {
    'concept': 'content_screen',
    'story': 'visual_lesson_screen',
    'mcq': 'tap_right_answer',
    'fill_blank': 'fill_in_blank',
    'sentence_builder': 'build_concept',
    'sorting': 'sort_sequence',
    'discard': 'c16_eliminate_wrong',
    'match_pair': 'match_pairs',
    'drag_drop': 'drag_and_drop',
    'image_choice': 'image_reveal',
    'reward': 'content_screen'
  };
  return mapping[type] || type;
};

/**
 * Normalises one screen for import: maps its type and, for content/visual
 * screens without a nested contentScreen/visualLessonScreen, builds the nested object.
 */
export const mapScreenDataForImport = (screen: any): any => {
  if (!screen || !screen.type) return screen;
  const mappedType = mapUserFriendlyScreenType(screen.type);

  const mapped: any = {
    ...screen,
    type: mappedType
  };

  if (mappedType === 'visual_lesson_screen' || mappedType === 'content_screen') {
    const hasNested = screen.visualLessonScreen || screen.contentScreen;
    if (!hasNested) {
      const nestedData = {
        badge: screen.badge || (mappedType === 'visual_lesson_screen' ? '🎬 Visual Story' : '🖼️ Concept'),
        heading: screen.heading || screen.question || '',
        subheading: screen.subheading || '',
        contentBody: screen.contentBody || screen.description || '',
        mediaUrl: screen.mediaUrl || screen.image || screen.imageUrl || '',
        highlightBox: screen.highlightBox || '',
        quote: screen.quote || '',
        quoteAuthor: screen.quoteAuthor || '',
        bottomMessage: screen.bottomMessage || ''
      };
      if (mappedType === 'visual_lesson_screen') {
        mapped.visualLessonScreen = nestedData;
      } else {
        mapped.contentScreen = nestedData;
      }
    }
  }
  return mapped;
};
