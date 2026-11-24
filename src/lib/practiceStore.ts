import { Challenge } from './content';

export interface PracticeItem {
  id: string;
  type: 'MCQ' | 'MatchPairs' | 'SpotAI' | 'ToolPicker' | 'AIVsHuman';
  question: string;
  options?: string[]; // For MCQ / SpotAI / ToolPicker
  correctAnswer?: any; // For MCQ / SpotAI / AIVsHuman
  explanation: string;
  pairs?: { left: string; right: string }[]; // For MatchPairs
  toolPicker?: {
    situation: string;
    tools: {
      id: string;
      name: string;
      emoji: string;
      description: string;
      whyCorrect: string;
      isCorrect: boolean;
    }[];
  }; // For ToolPicker
  outputs?: {
    id: string;
    title: string;
    text: string;
    authorLabel: string;
    isAI: boolean;
    emojis?: string;
  }[]; // For AIVsHuman
  items?: {
    id: string;
    text: string;
    has_ai: boolean;
    explanation?: string;
  }[]; // For SpotAI
}

export interface PracticeLesson {
  id: string;
  title: string;
  description: string;
  items: PracticeItem[];
}

export interface PracticeUnit {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  lessons: PracticeLesson[];
}

export interface AdaptiveConfig {
  spacedRepetitiveEnabled: boolean;
  incorrectBoostScalar: number; // e.g. 2.0x weight
  streakBonusEnabled: boolean;
  energySaverPractice: boolean; // free energy if accuracy >= 90%
  sessionLength: number; // default 5 or 10
}

const DEFAULT_ADAPTIVE_CONFIG: AdaptiveConfig = {
  spacedRepetitiveEnabled: true,
  incorrectBoostScalar: 2.0,
  streakBonusEnabled: true,
  energySaverPractice: true,
  sessionLength: 5,
};

// PRESET / SEED PRACTICE ITEMS
const SEED_PRACTICE_UNITS: PracticeUnit[] = [
  {
    id: 'prac_unit_1',
    title: 'Unit 1: Wait... That\'s AI?!',
    difficulty: 'Easy',
    lessons: [
      {
        id: 'prac_les_1',
        title: 'Lesson 1: You\'re Already Using AI?!',
        description: 'Discover how recommendation filters, automated facial taggers, and smart keyboards operate quietly behind your daily screen taps.',
        items: [
          // MCQ 1
          {
            id: 'qi_les1_mcq1',
            type: 'MCQ',
            question: 'When YouTube suggests a gaming video you actually want to watch, what is working in the background?',
            options: [
              'A friendly human moderator watching you 24/7',
              'A recommendation AI algorithm matching your viewing habits to millions of other similar watchers',
              'Your TV screen using satellite lasers',
              'Pure luck and coincidence'
            ],
            correctAnswer: 'A recommendation AI algorithm matching your viewing habits to millions of other similar watchers',
            explanation: 'Yes! High-impact filters analyze what you clicked, how long you stayed, and what similar gamers watched to recommend the next video!'
          },
          // MCQ 2
          {
            id: 'qi_les1_mcq2',
            type: 'MCQ',
            question: 'How does your phone\'s keyboard predict the next word you want to type?',
            options: [
              'It has a dictionary of all words ever written and picks one randomly',
              'It uses a predictive language AI model trained on patterns of how words usually follow each other',
              'An invisible micro-chip reads your nervous system fingers',
              'It reads your mind using magnetic waves'
            ],
            correctAnswer: 'It uses a predictive language AI model trained on patterns of how words usually follow each other',
            explanation: 'Exactly! Suffix and sequence prediction algorithms find the highest-probability next words based on typical language patterns.'
          },
          // Match Pairs 1
          {
            id: 'qi_les1_match1',
            type: 'MatchPairs',
            question: 'Match the everyday digital function to its underlying smart action:',
            pairs: [
              { left: 'TikTok Feed', right: 'Personalized recommendation filters' },
              { left: 'FaceID Photo Unlock', right: 'Biometric face recognition network' },
              { left: 'Auto-Correct Text', right: 'Statistical word prediction model' }
            ],
            explanation: 'Perfect match! Each everyday service relies on a specialized AI capability running quietly.'
          },
          // Spot AI 1
          {
            id: 'qi_les1_spot1',
            type: 'SpotAI',
            question: 'Spot which items below are actively powered by some form of smart AI:',
            items: [
              { id: 'spot1_i1', text: 'Spam folder filter in your Gmail inbox separating junk mail', has_ai: true, explanation: 'Uses classification AI to detect spam patterns!' },
              { id: 'spot1_i2', text: 'Standard classic wooden wall clock keeping simple hands movement', has_ai: false, explanation: 'Operates on standard physical gears, no smart processing.' },
              { id: 'spot1_i3', text: 'Snapchat cat ears filter anchoring cartoon ears directly over your moving eyes', has_ai: true, explanation: 'Uses a computer vision face-mesh model to track face coordinates.' },
              { id: 'spot1_i4', text: 'A basic metal door key unlocking a front porch door latch', has_ai: false, explanation: 'This is purely mechanical.' }
            ],
            explanation: 'Insightful scouting! Modern apps combine computer vision, natural language classification, and filter trees to fit your life.'
          },
          // Tool Picker 1
          {
            id: 'qi_les1_tool1',
            type: 'ToolPicker',
            question: 'Your classroom wants to build an app that automatically groups student questions by subject (Math, History, Science) so teachers can answer them faster. Which AI tool should they select?',
            toolPicker: {
              situation: 'Classroom Question Router targeting different subject groups.',
              tools: [
                {
                  id: 'tp_tool1',
                  name: 'Text Classification AI Classifier',
                  emoji: '📂',
                  description: 'Analyzes text tags to categorize sentences into pre-defined folders.',
                  whyCorrect: 'Perfect! Routing is a classification task where word patterns define sorting folders.',
                  isCorrect: true
                },
                {
                  id: 'tp_tool2',
                  name: 'Autonomous Robot Arm',
                  emoji: '🦾',
                  description: 'Physically picks up papers and heaps them in cardboard boxes.',
                  whyCorrect: 'Incorrect. Physically hauling papers is slow, energy-expensive, and unnecessary for digital chats!',
                  isCorrect: false
                }
              ]
            },
            explanation: 'Tool selection master! Classification models excel at reading words to identify categories like Math or Science.'
          },
          // AI vs Human 1
          {
            id: 'qi_les1_avh1',
            type: 'AIVsHuman',
            question: 'Compare these responses to "Write a quick caption about why comets have glowing tails." Spot the AI draft:',
            correctAnswer: 'opt_ai',
            explanation: 'Success! Output B is AI-generated, featuring its classic generic template terms like "Cosmic snowball," "celestial masterpiece," and flawless emojis.',
            outputs: [
              {
                id: 'opt_human',
                title: 'Draft A (Human-crafted)',
                text: 'Honestly comets are just icy dust-balls in space. When they get close to the sun they start evaporating and solar winds push that gassy dust backwards creating a tail. Kind of cool but mostly just space wind.',
                authorLabel: 'Space Highschooler',
                isAI: false,
                emojis: '☄️'
              },
              {
                id: 'opt_ai',
                title: 'Draft B (AI-generated)',
                text: 'Behold the cosmic snowballs of our majestic night sky! ☄️ As this frozen relic approaches the solar core, intense heat triggers sublimation, painting an elegant glowing tail of vaporized ions that streams across the dark void.',
                authorLabel: 'Gemini Assistant',
                isAI: true,
                emojis: '🪐'
              }
            ]
          }
        ]
      },
      {
        id: 'prac_les_2',
        title: 'Lesson 2: Spotting Smart Decisions',
        description: 'Explore how systems make decisions using logical choice trees, patterns, and historical statistics.',
        items: [
          // MCQ 1
          {
            id: 'qi_les2_mcq1',
            type: 'MCQ',
            question: 'What is a simple Decision Tree in AI?',
            options: [
              'A digital visual plant that grows green leaves based on solar charging',
              'A sequence of simple Yes/No questions that splits paths to reach a logical conclusion',
              'An electrical circuit board buried under orchard soil',
              'A math calculation that divides numbers by zero'
            ],
            correctAnswer: 'A sequence of simple Yes/No questions that splits paths to reach a logical conclusion',
            explanation: 'Chikoo says: Yes! It\'s like playing "20 Questions." Is it a mammal? Yes. Does it bark? Yes. Then it is a dog!'
          },
          // Match Pairs 1
          {
            id: 'qi_les2_match1',
            type: 'MatchPairs',
            question: 'Match the decision node with its split outputs:',
            pairs: [
              { left: 'Is temperature above 30°C?', right: 'Target: Turn on AC cooling' },
              { left: 'Is student XP above 500?', right: 'Target: Award Bronze trophy badge' },
              { left: 'Is email containing "WIN FREE MONEY"?', right: 'Target: Route directly to Spam Bin' }
            ],
            explanation: 'Excellent split logic! Clean questions lead straight to reliable decisions.'
          }
        ]
      }
    ]
  }
];

// Helper to initialize Practice Bank in storage
export function initPracticeBank() {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('CHIKOO_PRACTICE_BANK');
    if (!cached) {
      localStorage.setItem('CHIKOO_PRACTICE_BANK', JSON.stringify(SEED_PRACTICE_UNITS));
    }

    const rulesCached = localStorage.getItem('CHIKOO_PRACTICE_ADAPTIVE_RULES');
    if (!rulesCached) {
      localStorage.setItem('CHIKOO_PRACTICE_ADAPTIVE_RULES', JSON.stringify(DEFAULT_ADAPTIVE_CONFIG));
    }
  }
}

// Retrieve Practice Units
export function getPracticeUnits(): PracticeUnit[] {
  initPracticeBank();
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem('CHIKOO_PRACTICE_BANK');
      return data ? JSON.parse(data) : SEED_PRACTICE_UNITS;
    } catch {
      return SEED_PRACTICE_UNITS;
    }
  }
  return SEED_PRACTICE_UNITS;
}

// Save Practice Units and Content Bank
export function savePracticeUnits(units: PracticeUnit[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('CHIKOO_PRACTICE_BANK', JSON.stringify(units));
  }
}

// Retrieve config for Adaptive rules
export function getAdaptiveConfig(): AdaptiveConfig {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem('CHIKOO_PRACTICE_ADAPTIVE_RULES');
      return data ? JSON.parse(data) : DEFAULT_ADAPTIVE_CONFIG;
    } catch {
      return DEFAULT_ADAPTIVE_CONFIG;
    }
  }
  return DEFAULT_ADAPTIVE_CONFIG;
}

// Save config for Adaptive rules
export function saveAdaptiveConfig(config: AdaptiveConfig) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('CHIKOO_PRACTICE_ADAPTIVE_RULES', JSON.stringify(config));
  }
}

// Mapping individual PracticeItem to dynamic Challenge
export function mapPracticeItemToChallenge(item: PracticeItem): Challenge {
  const xp = item.type === 'MatchPairs' || item.type === 'ToolPicker' || item.type === 'AIVsHuman' ? 15 : 10;
  
  switch (item.type) {
    case 'MCQ':
      return {
        id: item.id,
        type: 'tap_right_answer',
        question: item.question,
        options: item.options || [],
        correctAnswer: item.correctAnswer,
        explanation: item.explanation,
        xpValue: xp
      };
    case 'MatchPairs':
      return {
        id: item.id,
        type: 'match_pairs',
        question: item.question,
        pairs: item.pairs || [],
        explanation: item.explanation,
        xpValue: xp
      };
    case 'SpotAI':
      return {
        id: item.id,
        type: 'spot_the_ai',
        question: item.question,
        items: item.items || [],
        explanation: item.explanation,
        xpValue: xp
      };
    case 'ToolPicker':
      return {
        id: item.id,
        type: 'ai_tool_picker',
        question: item.question,
        toolPicker: {
          situation: item.toolPicker?.situation || item.question,
          tools: item.toolPicker?.tools.map(t => ({
            id: t.id,
            name: t.name,
            emoji: t.emoji,
            description: t.description,
            whyCorrect: t.whyCorrect,
            isCorrect: t.isCorrect
          })) || []
        },
        explanation: item.explanation,
        xpValue: xp
      };
    case 'AIVsHuman':
      return {
        id: item.id,
        type: 'ai_vs_human',
        question: item.question,
        outputs: item.outputs?.map(o => ({
          id: o.id,
          title: o.title,
          text: o.text,
          authorLabel: o.authorLabel,
          isAI: o.isAI,
          emojis: o.emojis
        })) as any || [],
        correctAnswer: item.correctAnswer || 'opt_ai',
        explanation: item.explanation,
        xpValue: xp
      };
    default:
      return {
        id: item.id,
        type: 'tap_right_answer',
        question: item.question,
        options: item.options || [],
        correctAnswer: item.correctAnswer,
        explanation: item.explanation,
        xpValue: xp
      };
  }
}

/**
 * Assembles an adaptive practice session based on Content Bank,
 * log history, and adaptive rules settings!
 */
export function getAdaptivePracticeSession(
  unitId: string,
  lessonId: string,
  config?: AdaptiveConfig,
  resultsHistory?: any[]
): Challenge[] {
  const actualConfig = config || getAdaptiveConfig();
  const units = getPracticeUnits();
  
  // Find Lesson
  const unit = units.find(u => u.id === unitId);
  const lesson = unit?.lessons.find(l => l.id === lessonId);
  
  // Fallback to first lesson if not found
  const activeLessonObj = lesson || units[0]?.lessons[0];
  if (!activeLessonObj || !activeLessonObj.items || activeLessonObj.items.length === 0) {
    return [];
  }

  let itemsPool = [...activeLessonObj.items];

  // ADAPTIVE RULES IMPLEMENTATION
  if (actualConfig.spacedRepetitiveEnabled && resultsHistory && resultsHistory.length > 0) {
    // Collect recently failed question IDs or categories to prioritize
    const failedIds = new Set<string>();
    resultsHistory.forEach(r => {
      if (!r.passed) {
        // Mocking failure mappings or tracking details
        const idParts = r.assessmentId.split('_');
        const lastPart = idParts[idParts.length - 1];
        if (lastPart) failedIds.add(lastPart);
      }
    });

    // Score/Weight each practice item
    const itemsWithWeights = itemsPool.map(item => {
      let weight = 1.0;
      
      // If student previously failed this exact question or something related, boost its chance (spaced repetition / weak area booster)
      if (failedIds.has(item.id) || failedIds.has(item.type)) {
        weight *= actualConfig.incorrectBoostScalar;
      }
      
      return { item, weight };
    });

    // Weighted shuffle
    itemsPool = itemsWithWeights
      .sort((a, b) => (Math.random() * b.weight) - (Math.random() * a.weight))
      .map(entry => entry.item);
  } else {
    // Normal random shuffle
    itemsPool = itemsPool.sort(() => Math.random() - 0.5);
  }

  // Draw target length
  const targetCount = actualConfig.sessionLength || 5;
  const selectedItems = itemsPool.slice(0, targetCount);

  // Map to core challenges
  return selectedItems.map(mapPracticeItemToChallenge);
}
