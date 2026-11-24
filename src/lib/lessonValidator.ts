import { Lesson, Challenge, ChallengeType } from './curriculumTypes';

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  stats: {
    screenCount: number;
    storyScreens: number;
    interactiveScreens: number;
    typesPresent: string[];
    totalXp: number;
  };
  normalizedLesson?: Lesson;
}

const SUPPORTED_TYPES: ChallengeType[] = [
  'content_screen',
  'visual_lesson_screen',
  'tap_right_answer',
  'image_reveal',
  'fill_in_blank',
  'ai_vs_human',
  'spot_the_ai',
  'drag_and_drop',
  'sort_sequence',
  'match_pairs',
  'build_concept',
  'c1_multiple_choice',
  'c2_fill_in_blank',
  'c3_sentence_builder',
  'c4_concept_matcher',
  'c5_bucket_sort',
  'c6_timeline_sort',
  'c7_sequence_builder',
  'c8_tap_correct_object',
  'c9_true_false',
  'c10_swipe_left_right',
  'c11_image_classification',
  'c12_label_diagram',
  'c13_hotspot_question',
  'c14_memory_flip_cards',
  'c15_drag_complete_diagram',
  'c16_eliminate_wrong',
  'c17_arrange_images',
  'c18_audio_quiz'
];

/**
 * Thoroughly validates any raw or parsed Chikoo lesson JSON
 */
export function validateLessonObject(data: any): ValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  const typesPresent: Set<string> = new Set();
  let storyScreens = 0;
  let interactiveScreens = 0;
  let totalXp = 0;

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      isValid: false,
      issues: ['Root value must be a valid JSON object representing a Chikoo Lesson.'],
      warnings: [],
      stats: { screenCount: 0, storyScreens: 0, interactiveScreens: 0, typesPresent: [], totalXp: 0 }
    };
  }

  // Required root fields
  if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
    issues.push('Missing required root field: "title" (string).');
  }

  if (data.id && typeof data.id !== 'string') {
    issues.push('Field "id" must be a string if provided.');
  }

  if (data.difficulty && !['Easy', 'Medium', 'Hard', 'Explorer', 'Specialist', 'Commander'].includes(data.difficulty)) {
    warnings.push(`Difficulty "${data.difficulty}" will be normalized to "Medium".`);
  }

  // Check screens / challenges array
  const rawChallenges = data.challenges || data.screens;
  if (!rawChallenges || !Array.isArray(rawChallenges)) {
    issues.push('Missing required array: "challenges" (or "screens") must be an array of screen objects.');
    return {
      isValid: false,
      issues,
      warnings,
      stats: { screenCount: 0, storyScreens: 0, interactiveScreens: 0, typesPresent: [], totalXp: 0 }
    };
  }

  if (rawChallenges.length === 0) {
    issues.push('The "challenges" array is empty. A lesson must have at least 1 screen.');
  }

  const seenIds = new Set<string>();
  const normalizedChallenges: Challenge[] = [];

  rawChallenges.forEach((chal: any, index: number) => {
    const screenNum = index + 1;
    if (!chal || typeof chal !== 'object' || Array.isArray(chal)) {
      issues.push(`Screen #${screenNum}: Must be an object.`);
      return;
    }

    const type = chal.type as ChallengeType;
    if (!type || typeof type !== 'string') {
      issues.push(`Screen #${screenNum}: Missing "type" property.`);
      return;
    }

    typesPresent.add(type);

    if (!SUPPORTED_TYPES.includes(type)) {
      issues.push(`Screen #${screenNum}: Unsupported screen type "${type}". Supported types include: ${SUPPORTED_TYPES.slice(0, 8).join(', ')}...`);
    }

    // Check screen ID
    const chalId = chal.id ? String(chal.id).trim() : `screen_${screenNum}`;
    if (seenIds.has(chalId)) {
      issues.push(`Screen #${screenNum}: Duplicate screen id "${chalId}". Each screen must have a unique ID.`);
    }
    seenIds.add(chalId);

    // Screen question / prompt
    if (type !== 'content_screen' && type !== 'visual_lesson_screen') {
      if (!chal.question || typeof chal.question !== 'string' || !chal.question.trim()) {
        issues.push(`Screen #${screenNum} (${type}): Missing "question" text.`);
      }
      interactiveScreens++;
    } else {
      storyScreens++;
    }

    const safeChal: Challenge = {
      id: chalId,
      type,
      question: chal.question || (type === 'content_screen' ? 'Mission Scene' : 'Interactive Challenge'),
      explanation: chal.explanation || 'Chikoo says: Great job!',
      xpValue: Number(chal.xpValue) || 15
    };

    totalXp += safeChal.xpValue || 15;

    // Type-specific field validations
    if (type === 'content_screen' || type === 'visual_lesson_screen') {
      if (!chal.contentScreen || typeof chal.contentScreen !== 'object') {
        issues.push(`Screen #${screenNum} (${type}): Missing "contentScreen" object.`);
      } else {
        safeChal.contentScreen = {
          sceneType: chal.contentScreen.sceneType || 'hero',
          badge: chal.contentScreen.badge || '🚀 Mission Brief',
          heading: chal.contentScreen.heading || 'Concept Overview',
          subheading: chal.contentScreen.subheading || '',
          contentBody: chal.contentScreen.contentBody || '',
          highlightBox: chal.contentScreen.highlightBox || '',
          bottomMessage: chal.contentScreen.bottomMessage || 'Tap to continue',
          mediaUrl: chal.contentScreen.mediaUrl || chal.imageUrl || ''
        };
        if (!safeChal.contentScreen.contentBody && !safeChal.contentScreen.heading) {
          issues.push(`Screen #${screenNum} (${type}): "contentScreen" must include a heading or contentBody.`);
        }
      }
    }

    // Multiple Choice
    if (type === 'c1_multiple_choice' || type === 'tap_right_answer' || type === 'image_reveal') {
      if (!Array.isArray(chal.options) || chal.options.length < 2) {
        issues.push(`Screen #${screenNum} (${type}): "options" must be an array of at least 2 options.`);
      } else {
        safeChal.options = chal.options.map(String);
        if (!chal.correctAnswer || typeof chal.correctAnswer !== 'string') {
          issues.push(`Screen #${screenNum} (${type}): Missing "correctAnswer" string.`);
        } else if (!chal.options.includes(chal.correctAnswer)) {
          issues.push(`Screen #${screenNum} (${type}): "correctAnswer" ("${chal.correctAnswer}") is not found in the "options" list: [${chal.options.join(', ')}].`);
        }
        safeChal.correctAnswer = chal.correctAnswer;
      }
      if (type === 'image_reveal') {
        safeChal.imageUrl = chal.imageUrl || '';
      }
    }

    // True / False
    if (type === 'c9_true_false') {
      const ansStr = String(chal.correctAnswer || '').trim().toLowerCase();
      if (!ansStr || (!ansStr.includes('t') && !ansStr.includes('f'))) {
        issues.push(`Screen #${screenNum} (c9_true_false): "correctAnswer" must be "True" or "False".`);
      }
      safeChal.correctAnswer = ansStr.includes('t') ? 'True' : 'False';
    }

    // Fill in Blank
    if (type === 'c2_fill_in_blank' || type === 'fill_in_blank') {
      if (!Array.isArray(chal.options) || chal.options.length < 2) {
        issues.push(`Screen #${screenNum} (${type}): "options" must be an array of at least 2 options.`);
      } else {
        safeChal.options = chal.options.map(String);
        if (!chal.correctAnswer) {
          issues.push(`Screen #${screenNum} (${type}): Missing "correctAnswer".`);
        } else if (!chal.options.includes(chal.correctAnswer)) {
          issues.push(`Screen #${screenNum} (${type}): "correctAnswer" ("${chal.correctAnswer}") must match one of the options.`);
        }
        safeChal.correctAnswer = chal.correctAnswer;
      }
    }

    // Concept Matcher / Pairs
    if (type === 'c4_concept_matcher' || type === 'match_pairs') {
      const pairs = chal.pairs;
      if (!Array.isArray(pairs) || pairs.length < 2) {
        issues.push(`Screen #${screenNum} (${type}): "pairs" must be an array of at least 2 {left, right} objects.`);
      } else {
        safeChal.pairs = pairs.map((p: any) => ({
          left: String(p.left || ''),
          right: String(p.right || '')
        }));
        const invalidPair = safeChal.pairs.find(p => !p.left || !p.right);
        if (invalidPair) {
          issues.push(`Screen #${screenNum} (${type}): Every pair must have non-empty "left" and "right" strings.`);
        }
      }
    }

    // Bucket Sort
    if (type === 'c5_bucket_sort' || type === 'drag_and_drop') {
      if (!Array.isArray(chal.buckets) || chal.buckets.length < 2) {
        issues.push(`Screen #${screenNum} (${type}): "buckets" must be an array of at least 2 buckets.`);
      }
      if (!Array.isArray(chal.items) || chal.items.length < 2) {
        issues.push(`Screen #${screenNum} (${type}): "items" must be an array of at least 2 items.`);
      }
      safeChal.buckets = chal.buckets;
      safeChal.items = chal.items;
    }

    // Eliminate Wrong
    if (type === 'c16_eliminate_wrong') {
      if (!Array.isArray(chal.options) || chal.options.length < 2) {
        issues.push(`Screen #${screenNum} (c16_eliminate_wrong): "options" must be an array with {text, isCorrect} items.`);
      } else {
        safeChal.options = chal.options;
      }
    }

    normalizedChallenges.push(safeChal);
  });

  const genId = data.id || `l_${Date.now().toString().slice(-6)}`;
  const normalizedLesson: Lesson = {
    id: genId,
    title: String(data.title).trim(),
    description: String(data.description || `Learn ${data.title} with Chikoo & Byte.`).trim(),
    category: String(data.category || 'AI & STEM Fundamentals').trim(),
    difficulty: (data.difficulty as any) || 'Medium',
    xpReward: Number(data.xpReward) || Math.max(80, totalXp),
    challenges: normalizedChallenges
  };

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    stats: {
      screenCount: normalizedChallenges.length,
      storyScreens,
      interactiveScreens,
      typesPresent: Array.from(typesPresent),
      totalXp: normalizedLesson.xpReward
    },
    normalizedLesson
  };
}

/**
 * Validates raw JSON string
 */
export function validateLessonJsonString(rawJson: string): ValidationResult {
  if (!rawJson || !rawJson.trim()) {
    return {
      isValid: false,
      issues: ['JSON string is empty.'],
      warnings: [],
      stats: { screenCount: 0, storyScreens: 0, interactiveScreens: 0, typesPresent: [], totalXp: 0 }
    };
  }

  try {
    const cleaned = rawJson.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return validateLessonObject(parsed);
  } catch (err: any) {
    return {
      isValid: false,
      issues: [`JSON Syntax Error: ${err.message || 'Malformed JSON syntax'}`],
      warnings: [],
      stats: { screenCount: 0, storyScreens: 0, interactiveScreens: 0, typesPresent: [], totalXp: 0 }
    };
  }
}
