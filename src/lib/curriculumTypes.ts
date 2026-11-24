export interface PracticalActivity {
  title: string;
  protocol: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface MCQ {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string | {
    text: string;
    audioUrl?: string;
    audioDuration?: number;
  };
}

export interface ChapterImageMetadata {
  illustrationUrl: string;
  imageStyle: 'Illustration' | 'Side-by-side visual' | 'Infographic' | 'Story scene' | 'Product demonstration' | 'Timeline graphic';
  prompts: {
    educational: string;
    illustration: string;
    infographic: string;
    scenario: string;
  };
}

export interface Chapter {
  id: string; // e.g., "l1.1", "l1.2", etc.
  title: string;
  description: string;
  lessonContent: string;
  keyPoints: string[];
  summary: string;
  examples: string[];
  practicalActivities: PracticalActivity[];
  flashcards: Flashcard[];
  mcqs: MCQ[];
  estimatedTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  imageMetadata?: ChapterImageMetadata;
}

export interface QuestionOption {
  id: string; // e.g. "A", "B", "C", "D"
  text: string;
}

export interface Question {
  id: string;
  chapterId: string; // e.g. "l1.1", "l1.2", etc.
  category: string; // e.g. "Behavior Tracking", "Computer Vision", "NLP", "Safety", "Ethical AI"
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  questionType: 'MCQ' | 'FillInBlank' | 'Scenario' | 'MatchPairs';
  question: string;
  options: QuestionOption[];
  correctAnswer: string; // Matches the exactly correct text or id
  explanation: string;
  pairs?: { left: string; right: string }[];
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  type: 'Chapter' | 'Final' | 'Mock' | 'Revision';
}

export interface QuizResult {
  assessmentId: string;
  score: number;
  totalQuestions: number;
  passed: boolean;
  timestamp: number;
  answers: Record<string, string>; // questionId -> selectedOptionText
}

export interface QuestionBank {
  questions: Question[];
  version: string;
  lastUpdated: number;
}

export type ChallengeType =
  | 'tap_right_answer'
  | 'fill_in_blank'
  | 'spot_the_ai'
  | 'analogy_card'
  | 'drag_and_drop'
  | 'match_pairs'
  | 'sort_sequence'
  | 'build_concept'
  | 'before_after_exp'
  | 'mystery_concept'
  | 'step_debugger'
  | 'link_builder'
  | 'scenario_quest'
  | 'rapid_fire'
  | 'argument_builder'
  | 'open_response'
  | 'image_reveal'
  | 'ai_vs_human'
  | 'tap_correct_area'
  | 'memory_flip_cards'
  | 'emoji_concepts'
  | 'achievement_discovery'
  | 'ai_tool_picker'
  | 'prompt_battle'
  | 'before_after_ai'
  | 'ai_for_school'
  | 'tool_match'
  | 'result_ranker'
  | 'prompt_fixer'
  | 'ai_myth_fact'
  | 'student_mission'
  | 'daily_life_ai'
  | 'ai_prediction'
  | 'which_output_better'
  | 'ai_assistant_builder'
  | 'hidden_ai'
  | 'meme_screen'
  | 'gif_explainer'
  | 'comic_story'
  | 'fun_fact'
  | 'visual_analogy'
  | 'image_explainer'
  | 'ai_around_you'
  | 'myth_buster'
  | 'before_after_story'
  | 'student_story'
  | 'interactive_reveal'
  | 'why_should_i_care'
  | 'content_screen'
  | 'visual_lesson_screen'
  | 'story_scene'
  | 'hero_scene'
  | 'dialogue_strip_scene'
  | 'cinematic_scene'
  | 'story_intro'
  | 'story_outro'
  | 'celebration_scene'
  | 'mcq'
  | 'fill_blank'
  | 'true_false'
  | 'matching'
  | 'drag_drop'
  | 'image_quiz'
  | 'challenge'
  | 'practice'
  | 'sentence_builder'
  | 'c1_multiple_choice'
  | 'c2_fill_in_blank'
  | 'c3_sentence_builder'
  | 'c4_concept_matcher'
  | 'c5_bucket_sort'
  | 'c6_timeline_sort'
  | 'c7_sequence_builder'
  | 'c8_tap_correct_object'
  | 'c9_true_false'
  | 'c10_swipe_left_right'
  | 'c11_image_classification'
  | 'c12_label_diagram'
  | 'c13_hotspot_question'
  | 'c14_memory_flip_cards'
  | 'c15_drag_complete_diagram'
  | 'c16_eliminate_wrong'
  | 'c17_arrange_images'
  | 'c18_audio_quiz';

export interface Challenge {
  id: string;
  type: ChallengeType;
  question: string;
  options?: any;
  audioUrl?: string;
  audioNarrations?: Record<string, { text: string; url: string; hash: string; updatedAt: string }>;
  correctAnswer?: any;
  explanation?: string | { 
    text: string; 
    audioUrl?: string; 
    audioDuration?: number;
    hinglish?: {
      text: string;
      audioUrl?: string;
      audioDuration?: number;
    };
    marathi?: {
      text: string;
      audioUrl?: string;
      audioDuration?: number;
    };
    [key: string]: any;
  };
  xpValue?: number;
  items?: any[];
  questions?: any[];
  pairs?: any[];
  hotspots?: any;
  correctOrder?: any;
  chipsCorrect?: any;
  chipsDistractor?: any;
  experiment?: any;
  mystery?: any;
  argument?: any;
  linkBuilder?: any;
  analogy?: any;
  buckets?: any;
  steps?: any;
  targetSentence?: any;
  scenario?: any;
  studentRole?: any;
  decisionPrompt?: any;
  scenarioOptions?: any;
  imageUrl?: any;
  outputs?: any;
  cards?: any;
  emojiClue?: any;
  rewards?: any;
  toolPicker?: any;
  promptBattle?: any;
  beforeAfterAi?: any;
  aiForSchool?: any;
  toolMatch?: any;
  resultRanker?: any;
  promptFixer?: any;
  aiMythFact?: any;
  studentMission?: any;
  dailyLifeAi?: any;
  aiPrediction?: any;
  whichOutputBetter?: any;
  aiAssistantBuilder?: any;
  hiddenAi?: any;
  memeScreen?: any;
  gifExplainer?: any;
  comicStory?: any;
  funFact?: any;
  visualAnalogy?: any;
  imageExplainer?: any;
  aiAroundYou?: any;
  mythBuster?: any;
  beforeAfterStory?: any;
  studentStory?: any;
  interactiveReveal?: any;
  whyShouldICare?: any;
  contentScreen?: any;
  visualLessonScreen?: any;
  hint?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  continueText?: string;
  mascotMessage?: string;
  explanation_confused?: string;
  explanation_concept?: string;
  explanation_example?: string;
  explanation_takeaway?: string;
  explanation_speech_script?: string;
  explanation_marathi?: string;
  explanation_marathi_confused?: string;
  explanation_marathi_concept?: string;
  explanation_marathi_example?: string;
  explanation_marathi_takeaway?: string;
  explanation_marathi_speech_script?: string;
  explanation_marathi_audio_url?: string;
  explanation_marathi_audio_duration?: number;
  sceneType?: string;
  heading?: string;
  subheading?: string;
  badge?: string;
  mediaUrl?: string;
  mediaType?: string;
  contentBody?: string;
  contentHeading?: string;
  contentSubheading?: string;
  contentMediaUrl?: string;
  highlightBox?: string;
  quote?: string;
  quoteAuthor?: string;
  bottomMessage?: string;
  dialogue?: any;
  dialogueMessages?: any;
  panels?: any;
  storyData?: any;
  [key: string]: any;
}

export interface StoryBibleCharacter {
  name: string;
  role: string;
  personality: string;
  avatarUrl?: string;
}

export interface LessonMemory {
  lessonId: string;
  lessonTitle: string;
  conceptTaught: string;
  storyEvent: string;
  characterStatus: string;
  cliffhangerOrHook: string;
  keyTakeaway?: string;
  dateGenerated?: string;
}

export interface UnitStoryBible {
  learningGoal?: string;
  conceptProgression: string[];
  storyPremise?: string;
  characters: StoryBibleCharacter[];
  characterRelationships?: string;
  currentStorySituation?: string;
  toneRules?: string;
  worldRules?: string;
  lessonMemories?: LessonMemory[];
}

export interface Lesson {
  id: string;
  moduleId?: string;
  module_id?: string;
  orderIndex?: number;
  order_index?: number;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  xpReward: number;
  isChallenge?: boolean;
  isChest?: boolean;
  isBonus?: boolean;
  isPuzzle?: boolean;
  isCheckpoint?: boolean;
  isStory?: boolean;
  lane?: 'left' | 'right' | 'center' | string;
  challenges: Challenge[];
  category?: string;
  chest_icon_url?: string;
  chestIconUrl?: string;
  linked_unit_id?: string;
  linkedUnitId?: string;
}

export interface Module {
  id: string;
  order?: number; // Legacy
  sort_order: number;
  title: string;
  difficulty: string;
  description?: string;
  world_id?: string | null;
  lessons: Lesson[];
  metadata?: {
    learningPath?: any[];
    storyBible?: UnitStoryBible;
    [key: string]: any;
  } | any;
}

export const STORY_CHALLENGE_TYPES = new Set<string>([
  'content_screen',
  'visual_lesson_screen',
  'story_scene',
  'hero_scene',
  'dialogue_strip_scene',
  'cinematic_scene',
  'story_intro',
  'story_outro',
  'celebration_scene',
  'meme_screen',
  'gif_explainer',
  'comic_story',
  'fun_fact',
  'visual_analogy',
  'image_explainer',
  'ai_around_you',
  'before_after_story',
  'student_story',
  'interactive_reveal',
  'why_should_i_care',
  'concept_screen'
]);

export const PURE_READING_CHALLENGE_TYPES = STORY_CHALLENGE_TYPES;

export const INTERACTIVE_CHALLENGE_TYPES = new Set<string>([
  'mcq',
  'fill_blank',
  'true_false',
  'matching',
  'drag_drop',
  'image_quiz',
  'challenge',
  'practice',
  'sentence_builder',
  'c1_multiple_choice',
  'c2_fill_in_blank',
  'c3_sentence_builder',
  'c4_concept_matcher',
  'c5_bucket_sort',
  'c6_timeline_sort',
  'c6_tap_correct_object',
  'c7_sequence_builder',
  'c7_sentence_builder',
  'c8_tap_correct_object',
  'c9_true_false',
  'c10_swipe_left_right',
  'c10_hotspot',
  'c11_image_classification',
  'c11_image_classifier',
  'c12_label_diagram',
  'c13_hotspot_question',
  'c14_memory_flip_cards',
  'c15_drag_complete_diagram',
  'c15_diagram_completer',
  'c16_eliminate_wrong',
  'c16_wrong_eliminator',
  'c17_arrange_images',
  'c18_audio_quiz',
  'tap_right_answer',
  'fill_in_blank',
  'spot_the_ai',
  'drag_and_drop',
  'match_pairs',
  'sort_sequence',
  'build_concept',
  'step_debugger',
  'link_builder',
  'scenario_quest',
  'rapid_fire',
  'argument_builder',
  'open_response',
  'image_reveal',
  'ai_vs_human',
  'tap_correct_area',
  'memory_flip_cards',
  'emoji_concepts',
  'achievement_discovery',
  'ai_tool_picker',
  'prompt_battle',
  'before_after_ai',
  'ai_for_school',
  'tool_match',
  'result_ranker',
  'prompt_fixer',
  'ai_myth_fact',
  'student_mission',
  'daily_life_ai',
  'ai_prediction',
  'which_output_better',
  'ai_assistant_builder',
  'hidden_ai',
  'before_after_exp',
  'mystery_concept',
  'analogy_card',
  'myth_buster'
]);

/**
 * Checks whether a screen is a story, narrative, reading, or conceptual content screen.
 */
export function isStoryScreen(challenge?: Challenge | string | null): boolean {
  if (!challenge) return false;
  if (typeof challenge === 'string') {
    return STORY_CHALLENGE_TYPES.has(challenge.toLowerCase().trim());
  }
  // If explicitly has contentScreen or visualLessonScreen, it's rendered as a story screen
  if (challenge.contentScreen || challenge.visualLessonScreen || (challenge as any).storyData) return true;
  if (challenge.type && STORY_CHALLENGE_TYPES.has(challenge.type.toLowerCase().trim())) return true;
  if ((challenge as any).sceneType && STORY_CHALLENGE_TYPES.has((challenge as any).sceneType.toLowerCase().trim())) return true;
  return false;
}

export const isStoryChallenge = isStoryScreen;

/**
 * Checks whether a screen is an interactive or question-based challenge requiring user answers/interaction.
 */
export function isInteractiveScreen(challenge?: Challenge | string | null): boolean {
  if (!challenge) return false;
  if (isStoryScreen(challenge)) return false;
  const rawType = typeof challenge === 'string' ? challenge : challenge.type;
  if (rawType && INTERACTIVE_CHALLENGE_TYPES.has(rawType.toLowerCase().trim())) return true;
  // Fallback: any screen that isn't a story/reading screen is interactive
  return true;
}

export const isInteractiveChallenge = isInteractiveScreen;

/**
 * Transition Rule:
 * ONLY show the cloud transition when:
 * CURRENT SCREEN = INTERACTIVE
 * AND
 * NEXT SCREEN = STORY / CONTENT
 * ("Challenge completed → back to the adventure/story.")
 */
export function shouldUseCloudTransition(
  currentChallenge?: Challenge | null,
  nextChallenge?: Challenge | null
): boolean {
  if (!currentChallenge || !nextChallenge) return false;
  return isInteractiveScreen(currentChallenge) && isStoryScreen(nextChallenge);
}
