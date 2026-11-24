import { Challenge, Lesson, isStoryScreen } from './content';
import { getFifteenPremiumChallenges } from './premiumChallengesGenerator';

export interface UserPerformance {
  accuracy: number; // 0 to 1
  averageTimePerChallenge: number; // in seconds
  streak: number;
  completedLessonIds: string[];
}

export interface SessionConfig {
  maxChallenges: number;
  targetDifficulty: 'easy' | 'medium' | 'hard';
}

const TYPE_DIFFICULTY: Record<string, 'easy' | 'medium' | 'hard'> = {
  tap_right_answer: 'easy',
  fill_in_blank: 'easy',
  spot_the_ai: 'easy',
  analogy_card: 'medium',
  drag_and_drop: 'medium',
  match_pairs: 'medium',
  sort_sequence: 'medium',
  build_concept: 'medium',
  before_after_exp: 'medium',
  mystery_concept: 'medium',
  step_debugger: 'medium',
  link_builder: 'medium',
  scenario_quest: 'hard',
  rapid_fire: 'hard',
  argument_builder: 'hard',
  open_response: 'medium',
  image_reveal: 'easy',
  ai_vs_human: 'medium',
  tap_correct_area: 'medium',
  memory_flip_cards: 'easy',
  emoji_concepts: 'easy',
  achievement_discovery: 'easy',
  ai_tool_picker: 'easy',
  prompt_battle: 'easy',
  before_after_ai: 'medium',
  ai_for_school: 'easy',
  tool_match: 'medium',
  result_ranker: 'medium',
  prompt_fixer: 'medium',
  ai_myth_fact: 'easy',
  student_mission: 'medium',
  daily_life_ai: 'easy',
  ai_prediction: 'medium',
  which_output_better: 'medium',
  ai_assistant_builder: 'medium',
  hidden_ai: 'medium',
  meme_screen: 'easy',
  gif_explainer: 'easy',
  comic_story: 'easy',
  fun_fact: 'easy',
  visual_analogy: 'easy',
  image_explainer: 'easy',
  ai_around_you: 'easy',
  myth_buster: 'easy',
  before_after_story: 'easy',
  student_story: 'easy',
  interactive_reveal: 'easy',
  why_should_i_care: 'easy',
  content_screen: 'easy',
  visual_lesson_screen: 'easy',
  c1_multiple_choice: 'easy',
  c2_fill_in_blank: 'easy',
  c3_sentence_builder: 'medium',
  c4_concept_matcher: 'medium',
  c5_bucket_sort: 'medium',
  c6_timeline_sort: 'medium',
  c7_sequence_builder: 'medium',
  c8_tap_correct_object: 'easy',
  c9_true_false: 'easy',
  c10_swipe_left_right: 'easy',
  c11_image_classification: 'medium',
  c12_label_diagram: 'medium',
  c13_hotspot_question: 'medium',
  c14_memory_flip_cards: 'easy',
  c15_drag_complete_diagram: 'medium',
  c16_eliminate_wrong: 'medium',
  c17_arrange_images: 'medium',
  c18_audio_quiz: 'medium',
};

/**
 * Adaptive Session Generator
 * Adjusts the exercise mix based on user performance.
 */
export function generateAdaptiveSession(
  lesson: Lesson,
  performance: UserPerformance
): Challenge[] {
  if (!lesson) return [];

  const rawChallenges = Array.isArray(lesson.challenges) && lesson.challenges.length > 0
    ? lesson.challenges
    : getFifteenPremiumChallenges(lesson.id || 'lesson', lesson.title || 'AI Lesson');

  // If the lesson challenges are custom/manually added (like from Admin Panel)
  // or it contains content_screen/visual_lesson_screen types which are highly sequenced,
  // we do NOT shuffle or filter them! Just return lesson.challenges as-is!
  const hasSequentialScreen = rawChallenges.some(
    c => isStoryScreen(c)
  );
  const isCustomLesson = 
    lesson.id.startsWith('les_') || 
    (lesson as any).isCustom || 
    lesson.isChallenge || 
    lesson.id.startsWith('practice_') ||
    lesson.id.includes('chal_pack');

  console.log(`[CHALLENGE PACK FETCH AUDIT] Pack ID: ${lesson.id} | Configured questions count in memory: ${rawChallenges.length}`);

  if (isCustomLesson || hasSequentialScreen) {
    const idCounts = new Map<string, number>();
    const preparedChallenges = rawChallenges.map((c, index) => {
      const rawId = c.id || `challenge_${lesson.id}_${index}`;
      const count = idCounts.get(rawId) || 0;
      idCounts.set(rawId, count + 1);
      const uniqueId = count === 0 ? rawId : `${rawId}_dup_${count}_${index}`;
      return {
        ...c,
        id: uniqueId
      };
    });

    console.log(`[CHALLENGE PACK SESSION AUDIT] Pack ID: ${lesson.id} | Configured: ${rawChallenges.length} | Fetched: ${rawChallenges.length} | Session questions: ${preparedChallenges.length}`);
    return preparedChallenges;
  }

  // 1. Determine target difficulty based on accuracy
  let target: 'easy' | 'medium' | 'hard' = 'medium';
  
  if (performance.accuracy < 0.6) {
    target = 'easy';
  } else if (performance.accuracy > 0.85) {
    target = 'hard';
  }

  // 2. Filter and sort challenges
  // We want to prioritize challenges that match the target difficulty
  // but still keep some variety.
  
  const shuffled = [...lesson.challenges].sort(() => Math.random() - 0.5);
  
  const sortedChallenges = shuffled.sort((a, b) => {
    const diffA = TYPE_DIFFICULTY[a.type];
    const diffB = TYPE_DIFFICULTY[b.type];
    
    if (diffA === target && diffB !== target) return -1;
    if (diffA !== target && diffB === target) return 1;
    return 0;
  });

  // 3. Ensure variety: at least two different challenge types
  const sessionChallenges: Challenge[] = [];
  const sessionLength = performance.accuracy < 0.5 ? Math.min(4, sortedChallenges.length) : sortedChallenges.length;
  
  if (sortedChallenges.length > 0) {
    // Always take the first one (best match for target)
    sessionChallenges.push(sortedChallenges[0]);
    
    // Look for a second one with a different type
    let secondChallengeIndex = -1;
    for (let i = 1; i < sortedChallenges.length; i++) {
      if (sortedChallenges[i].type !== sessionChallenges[0].type) {
        secondChallengeIndex = i;
        break;
      }
    }
    
    if (secondChallengeIndex !== -1) {
      // Add the second unique type
      sessionChallenges.push(sortedChallenges[secondChallengeIndex]);
      
      // Fill the rest of the session, avoiding duplicates of the first two if possible
      const remaining = sortedChallenges.filter((_, idx) => idx !== 0 && idx !== secondChallengeIndex);
      sessionChallenges.push(...remaining);
    } else {
      // If all challenges are the same type, just return sorted
      sessionChallenges.push(...sortedChallenges.slice(1));
    }
  }

  // Ensure unique IDs in session challenges to guarantee distinct React keys
  const idCounts = new Map<string, number>();
  const sanitizedChallenges = sessionChallenges.slice(0, sessionLength).map((c, index) => {
    const rawId = c.id || `challenge_${index}`;
    const count = idCounts.get(rawId) || 0;
    idCounts.set(rawId, count + 1);
    const uniqueId = count === 0 ? rawId : `${rawId}_dup_${count}_${index}`;
    return {
      ...c,
      id: uniqueId
    };
  });

  return sanitizedChallenges;
}
