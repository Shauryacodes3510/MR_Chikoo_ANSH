import { AI_CURRICULUM } from './content';
import { Module, Lesson } from './curriculumTypes';

export interface SeoUnit {
  id: string;
  slug: string;
  title: string;
  cleanTitle: string;
  description: string;
  difficulty: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  canonicalPath: string;
  lessonsCount: number;
  lessons: SeoLesson[];
  relatedFeatures: string[];
  relatedTopics: string[];
}

export interface SeoLesson {
  id: string;
  slug: string;
  title: string;
  cleanTitle: string;
  description: string;
  difficulty: string;
  xpReward: number;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  canonicalPath: string;
  unitId: string;
  unitSlug: string;
  unitTitle: string;
  challengesCount: number;
  sampleQuestions: {
    question: string;
    type: string;
    explanation?: string;
  }[];
  keyTakeaways: string[];
}

export interface SeoFeature {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  canonicalPath: string;
  iconName: string;
  iconPath: string;
  appView: string;
  badge: string;
  highlights: string[];
  benefits: string[];
  howItWorks: string[];
  educationalBenefit: string;
  relatedUnits: string[];
  relatedTopics: string[];
}

export interface SeoTopicArticle {
  id: string;
  slug: string;
  title: string;
  category: string;
  readingTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  summary: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  canonicalPath: string;
  sections: {
    heading: string;
    content: string;
    takeaways?: string[];
  }[];
  keyTakeaways: string[];
  faqs: { question: string; answer: string }[];
  relatedUnits: string[];
  relatedFeatures: string[];
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function cleanEmoji(text: string): string {
  return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
}

export const CHIKOO_PLATFORM_SEO = {
  name: "Chikoo",
  tagline: "Gamified AI Learning Platform for Students & Curious Minds",
  domain: "https://chikoo.ai",
  description: "Master Artificial Intelligence, Generative AI, Machine Learning, and Prompt Engineering through bite-sized interactive challenges, real-world analogies, and an unhinged otter tutor.",
  metaTitle: "Chikoo | Learn Artificial Intelligence (AI) - Gamified Lessons & Practice for Students",
  metaDescription: "Learn AI fundamentals, generative AI, prompt engineering, and machine learning with Chikoo. Bite-sized interactive modules, practice arena, daily quests, and instant feedback.",
  keywords: [
    "learn AI",
    "learn artificial intelligence",
    "AI learning platform",
    "AI education for students",
    "AI fundamentals",
    "generative AI for kids",
    "prompt engineering for beginners",
    "machine learning basics",
    "AI tools for school",
    "responsible AI",
    "gamified AI learning",
    "AI quizzes and practice"
  ],
  author: "Chikoo Learning Systems",
  targetAudience: "School Students (Ages 10-18), Educators, and Lifelong Beginners",
  heroSubtitle: "Zero boring lectures. 100% interactive AI challenges, hilarious Hinglish & Marathi micro-explanations, speed battles, and cosmic cookie rewards."
};

export const SEO_FEATURES: SeoFeature[] = [
  {
    id: "practice-arena",
    slug: "practice-arena",
    name: "AI Practice Arena",
    tagline: "High-voltage rapid quiz drills and AI pattern recognition",
    description: "Train your AI intuition with interactive drills including Spot the AI, Tool Picker, AI vs Human output comparisons, and Concept Matchers.",
    longDescription: "The Chikoo Practice Arena is designed for rapid reinforcement. Students tackle timed interactive drills that test their ability to identify generative AI outputs, select the correct AI tools for real-world scenarios, and debug faulty algorithmic prompts.",
    metaTitle: "AI Practice Arena & Rapid Drills | Chikoo AI Learning",
    metaDescription: "Sharpen your AI skills in the Chikoo Practice Arena. Interactive exercises: Spot the AI, AI vs Human text comparisons, Tool Matcher, and MCQ drills.",
    keywords: ["AI practice arena", "AI drills", "spot the AI", "AI vs human quiz", "learn AI tools", "AI question bank", "AI interactive exercises"],
    canonicalPath: "/features/practice-arena",
    iconName: "Zap",
    iconPath: "/Practice.webp",
    appView: "practice",
    badge: "Interactive Drills",
    highlights: [
      "Spot the AI: Identify automated systems in daily devices and applications",
      "AI vs Human: Analyze subtle differences in synthetic vs human-crafted content",
      "Tool Picker: Select optimal AI agents for homework, research, and coding",
      "Dynamic Question Generation: AI-powered curriculum generation for endless practice"
    ],
    benefits: [
      "Rapid recall without boring textbook reading",
      "Instant feedback on every wrong answer",
      "XP multipliers for speed and accuracy streaks"
    ],
    howItWorks: [
      "Select a practice module based on your current unit progress",
      "Complete quick 5-question blitz drills with instantaneous feedback",
      "Earn XP, unlock achievement badges, and climb the arena rankings"
    ],
    educationalBenefit: "Transforms passive AI theory into active problem-solving skills and critical evaluation.",
    relatedUnits: ["unit_1", "unit_2"],
    relatedTopics: ["what-is-artificial-intelligence", "ai-in-daily-life", "how-generative-ai-works"]
  },
  {
    id: "challenges",
    slug: "challenges",
    name: "Speed AI Challenges",
    tagline: "Test accuracy and speed against the clock",
    description: "Multi-tiered AI challenges designed to push your conceptual understanding with 80% passing accuracy benchmarks.",
    longDescription: "Speed Challenges test student mastery under mild pressure. Each challenge pack features a focused AI topic—from Neural Network weights to Prompt Traps—demanding precision and fast recall.",
    metaTitle: "Speed AI Challenges & Accuracy Gauntlets | Chikoo",
    metaDescription: "Take timed AI challenge packs on Chikoo. Test your knowledge of prompt engineering, computer vision, and machine learning ethics.",
    keywords: ["AI challenge packs", "speed AI quiz", "prompt engineering challenge", "AI accuracy test", "gamified AI challenges"],
    canonicalPath: "/features/challenges",
    iconName: "Target",
    iconPath: "/Practice.webp",
    appView: "home",
    badge: "Accuracy Benchmark",
    highlights: [
      "Curated challenge packs covering high-impact AI topics",
      "80% accuracy requirement for mastery certification",
      "Dynamic bonus cookies for continuous answer streaks"
    ],
    benefits: [
      "High retention through active retrieval practice",
      "Timed accuracy gauntlets that build sharp reflexes",
      "Unlockable secret treasure chest nodes"
    ],
    howItWorks: [
      "Select a challenge pack from your active adventure map",
      "Answer questions within the time window with zero hints",
      "Score 80%+ to unlock treasure nodes and level rewards"
    ],
    educationalBenefit: "Builds deep conceptual retention and rapid analytical reasoning.",
    relatedUnits: ["unit_1", "unit_2"],
    relatedTopics: ["prompt-engineering-for-beginners", "machine-learning-vs-deep-learning"]
  },
  {
    id: "rewards",
    slug: "rewards",
    name: "Lucky Cookie Wheel & Rewards",
    tagline: "Gamified reward economy celebrating student consistency",
    description: "Earn space cookies, unlock cosmic avatars, spin the daily lucky cookie wheel, and redeem customized UI themes.",
    longDescription: "The Chikoo Rewards system motivates persistent daily learning. Students earn cookies and gems by finishing lessons, maintaining login streaks, and acing practice questions, which can be used to customize player identity and purchase extra energy.",
    metaTitle: "Rewards Store & Daily Lucky Cookie Wheel | Chikoo AI",
    metaDescription: "Earn cosmic cookies, spin the daily lucky wheel, and unlock customizable avatars and themes in Chikoo's gamified learning economy.",
    keywords: ["AI learning rewards", "gamified education", "lucky spin wheel", "student XP system", "cosmic cookies", "learning streaks"],
    canonicalPath: "/features/rewards",
    iconName: "Gift",
    iconPath: "/cookies.webp",
    appView: "rewards_store",
    badge: "Daily Motivation",
    highlights: [
      "Daily Lucky Cookie Spin Wheel with server-authoritative fair drops",
      "Unlockable space avatars, badges, and retro/neon color themes",
      "Energy refills and power-ups for uninterrupted study sessions"
    ],
    benefits: [
      "Continuous daily dopamine hits for study milestones",
      "Safe gamified economy with zero real-money purchases",
      "Cosmic avatars and custom title badges"
    ],
    howItWorks: [
      "Earn cookies through daily study sessions and streak milestones",
      "Spin the wheel up to 3 times daily for random bonus gems",
      "Equip custom badges to display on the global leaderboard"
    ],
    educationalBenefit: "Leverages positive reinforcement to foster disciplined, long-term daily learning habits.",
    relatedUnits: ["unit_1"],
    relatedTopics: ["what-is-artificial-intelligence"]
  },
  {
    id: "quests",
    slug: "quests",
    name: "Cosmic Quests & Daily Missions",
    tagline: "Daily structured objectives to build unbroken study streaks",
    description: "Complete targeted daily missions: score 5 correct answers in a row, finish a unit lesson, or conquer the Weekly Cosmic Super Charge.",
    longDescription: "Quests provide clear daily roadmaps for students. Rather than wondering what to study, students receive 3 focused daily missions that guide them through lessons, review drills, and high-difficulty speed quests.",
    metaTitle: "Cosmic Quests & Daily AI Missions | Chikoo AI",
    metaDescription: "Level up with Chikoo Daily Quests. Structured micro-missions, weekly cosmic recharge challenges, and streak bonuses.",
    keywords: ["daily AI quests", "learning missions", "study streaks", "educational daily goals", "gamified study habits"],
    canonicalPath: "/features/quests",
    iconName: "Compass",
    iconPath: "/Quest.webp",
    appView: "quests",
    badge: "Daily Progression",
    highlights: [
      "3 dynamic daily quests tailored to student skill level",
      "Weekly Cosmic Super Charge modules for advanced problem solvers",
      "Streak bonus multipliers for consecutive study days"
    ],
    benefits: [
      "Clarity on what to study in 3 minutes a day",
      "Streak protection shields and bonus multipliers",
      "Progressive difficulty that scales with student skill"
    ],
    howItWorks: [
      "Log in daily to inspect your 3 cosmic mission objectives",
      "Complete the tasks during normal learning sessions",
      "Claim bonus XP and trophy points to protect your streak"
    ],
    educationalBenefit: "Prevents cramming by promoting distributed, manageable daily micro-learning.",
    relatedUnits: ["unit_1", "unit_2"],
    relatedTopics: ["responsible-ai-and-ethics", "ai-in-daily-life"]
  },
  {
    id: "leaderboard",
    slug: "leaderboard",
    name: "Galactic Leaderboards & Ranks",
    tagline: "Compete with peers in weekly promotion leagues",
    description: "Rise from Bronze to Legend League based on weekly XP, accuracy percentages, and arena duel victories.",
    longDescription: "Chikoo Leaderboards introduce healthy, friendly competition. Students compete in tiered weekly leagues—Bronze, Silver, Gold, Platinum, Diamond, Master, and Legend—advancing as they demonstrate consistent mastery.",
    metaTitle: "Galactic Leaderboard & Ranks | Chikoo AI Learning",
    metaDescription: "Climb the weekly AI learning leaderboard. Compete in Bronze, Gold, and Legend leagues based on XP, accuracy, and practice trophies.",
    keywords: ["AI leaderboard", "student competition", "gamified leagues", "weekly XP rank", "academic ranking"],
    canonicalPath: "/features/leaderboard",
    iconName: "Trophy",
    iconPath: "/Ranks.webp",
    appView: "leaderboard",
    badge: "Friendly Competition",
    highlights: [
      "7 competitive league tiers with automatic weekly promotions",
      "Real-time trophy calculations based on arena performance",
      "Fair matchmaking that rewards consistency over sheer volume"
    ],
    benefits: [
      "Healthy peer motivation without toxic ranking pressure",
      "Weekly promotion celebrations with special tier badges",
      "Anonymous student display option for privacy"
    ],
    howItWorks: [
      "Complete lessons and practice arena duels to accumulate weekly XP",
      "Finish in the top promotion zone by Sunday midnight",
      "Unlock exclusive league badges and higher-tier bragging rights"
    ],
    educationalBenefit: "Inspires healthy peer benchmarking and sustained engagement.",
    relatedUnits: ["unit_1", "unit_2"],
    relatedTopics: ["what-is-artificial-intelligence"]
  },
  {
    id: "ai-guide",
    slug: "ai-guide",
    name: "Chikoo AI Otter Mascot",
    tagline: "The witty, unhinged, sarcastic best-friend tutor in Hinglish & Marathi",
    description: "Meet Chikoo: a blue otter tutor who roasts incorrect answers, delivers hilarious everyday analogies, and ensures no misconception goes uncorrected.",
    longDescription: "Unlike dry, robotic textbooks, Chikoo interacts like a witty, fun older sibling or senior. When students make mistakes, Chikoo offers hilarious, culturally resonant micro-explanations in natural conversational Hinglish and Marathi, turning errors into memorable learning moments.",
    metaTitle: "Chikoo AI Otter Tutor | Hinglish & Marathi AI Micro-Explanations",
    metaDescription: "Learn AI with Chikoo, the witty otter mascot! Get hilarious, relatable micro-explanations in conversational Hinglish and Marathi.",
    keywords: ["AI otter mascot", "Chikoo AI tutor", "Hinglish AI learning", "Marathi AI explanations", "fun AI teacher", "conversational learning companion"],
    canonicalPath: "/features/ai-guide",
    iconName: "Sparkles",
    iconPath: "/avatar.webp",
    appView: "home",
    badge: "Personal Companion",
    highlights: [
      "Culturally resonant Hinglish and Marathi conversational voice",
      "Playful, wholesome roasts for misconceptions with relatable analogies",
      "Instant step-by-step guidance tailored to school students"
    ],
    benefits: [
      "Turns fear of failure into laughter and rapid understanding",
      "Bilingual Hinglish & Marathi support for regional learners",
      "Real-time hints and explanations on every quiz question"
    ],
    howItWorks: [
      "Attempt any question or lesson node in Chikoo",
      "If you miss a question, Chikoo pops up with a witty micro-explanation",
      "Understand the underlying concept and retry with full clarity"
    ],
    educationalBenefit: "Reduces learning anxiety and transforms mistakes into engaging, laugh-out-loud breakthroughs.",
    relatedUnits: ["unit_1", "unit_2"],
    relatedTopics: ["how-generative-ai-works", "responsible-ai-and-ethics"]
  },
  {
    id: "puzzles",
    slug: "puzzles",
    name: "AI Detective Mystery Puzzles",
    tagline: "Visual logic anomalies, prompt traps, and glitch investigation",
    description: "Solve visual mystery puzzles: detect AI rendering anomalies, uncover synthetic deepfakes, and untangle faulty logic chains.",
    longDescription: "The Logic & Mystery Lab challenges students to think like AI forensic investigators. Students analyze visual artifacts (such as synthetic finger counts, lighting mismatches, and hallucinated data) to uncover prompt tricks.",
    metaTitle: "AI Detective Mystery Puzzles & Logic Lab | Chikoo",
    metaDescription: "Solve AI mystery puzzles and logic lab challenges. Detect synthetic images, spot deepfake anomalies, and untangle algorithmic logic.",
    keywords: ["AI detective puzzles", "visual AI puzzles", "deepfake detection for kids", "logic anomalies", "AI glitch detective"],
    canonicalPath: "/features/puzzles",
    iconName: "Search",
    iconPath: "/Chest.webp",
    appView: "home",
    badge: "Critical Thinking",
    highlights: [
      "Visual investigation of AI image generation artifacts",
      "Logic clues that guide deduction without spoiling answers",
      "Treasure chest gem rewards for solving complex scenarios"
    ],
    benefits: [
      "Hands-on deepfake and synthetic image detection skills",
      "Critical skepticism towards online misinformation",
      "Fun detective puzzles that reward attention to detail"
    ],
    howItWorks: [
      "Unlock treasure chest nodes on your adventure path",
      "Examine the visual evidence and clue statements carefully",
      "Submit your verdict to earn cosmic gems and master badges"
    ],
    educationalBenefit: "Nurtures essential digital media literacy and critical skepticism toward synthetic media.",
    relatedUnits: ["unit_1", "unit_2"],
    relatedTopics: ["computer-vision-in-action", "responsible-ai-and-ethics"]
  },
  {
    id: "battles",
    slug: "battles",
    name: "1v1 Speed Battles",
    tagline: "Real-time AI quiz duels with 15-second timers",
    description: "Go head-to-head against classmates in lightning-fast AI trivia showdowns with real-time score tracking.",
    longDescription: "Speed Battles pit two learners against each other in a 5-question lightning duel. With only 15 seconds per question, players must combine speed, confidence, and accuracy to win trophies.",
    metaTitle: "1v1 Real-Time Speed Battles | Chikoo AI Arena",
    metaDescription: "Challenge friends in 1v1 real-time AI speed battles. 15-second timer questions, rapid score tracking, and trophy rewards.",
    keywords: ["1v1 AI battle", "speed quiz battle", "multiplayer AI trivia", "real time educational game", "competitive learning"],
    canonicalPath: "/features/battles",
    iconName: "Swords",
    iconPath: "/Practice.webp",
    appView: "practice",
    badge: "Real-Time Duel",
    highlights: [
      "15-second high-intensity question countdown",
      "Live score comparison and instant victory trophy multipliers",
      "Dynamic question pools covering general science, AI, and logic"
    ],
    benefits: [
      "Adrenaline-fueled real-time multiplayer duels",
      "Tests reaction speed and deep conceptual confidence",
      "Win trophies to unlock Legend rank in the arena"
    ],
    howItWorks: [
      "Enter the matchmaking lobby in the Practice Arena",
      "Answer 5 consecutive lightning questions against your opponent",
      "Claim trophies and push your rating to Master or Legend rank"
    ],
    educationalBenefit: "Builds lightning-fast decision making and reinforces core AI definitions.",
    relatedUnits: ["unit_1"],
    relatedTopics: ["what-is-artificial-intelligence", "how-generative-ai-works"]
  }
];

export const SEO_TOPICS: SeoTopicArticle[] = [
  {
    id: "what-is-artificial-intelligence",
    slug: "what-is-artificial-intelligence",
    title: "What is Artificial Intelligence? A Beginner's Guide for Students",
    category: "AI Fundamentals",
    readingTime: "6 min read",
    difficulty: "Beginner",
    summary: "Understand how computers learn from examples, recognize patterns, and make decisions without being explicitly programmed for every single step.",
    metaTitle: "What is Artificial Intelligence? Guide for Students | Chikoo AI",
    metaDescription: "Learn what Artificial Intelligence (AI) really is. Discover how machines learn, how algorithms think, and where AI is used in everyday life.",
    keywords: ["what is artificial intelligence", "learn AI basics", "AI for students", "how AI works", "artificial intelligence introduction", "AI fundamentals guide"],
    canonicalPath: "/learn/what-is-artificial-intelligence",
    keyTakeaways: [
      "AI refers to computer systems capable of performing tasks that traditionally require human intelligence.",
      "Traditional coding gives computers strict step-by-step recipes; AI teaches computers by feeding them thousands of examples.",
      "Everyday AI includes photo filters, voice assistants, movie recommendations, and autonomous navigation.",
      "AI does not 'feel' or 'think' like a human—it calculates mathematical probabilities based on training data."
    ],
    sections: [
      {
        heading: "1. The Recipe vs. The Chef: How AI Differs from Normal Code",
        content: "Think of traditional computer software like following a rigid baking recipe: 'If oven temperature = 180°C, bake for 20 minutes.' If an unexpected ingredient appears, traditional code breaks. AI, on the other hand, acts like an experienced chef who has tasted thousands of dishes. Instead of memorizing one strict recipe, it learns the underlying patterns of flavors and adapts automatically when ingredients change."
      },
      {
        heading: "2. The Three Pillars of Modern AI",
        content: "Most AI systems you interact with today rely on three core components: Data (the textbook), Algorithms (the learning method), and Compute Power (the brain's processing energy). By feeding millions of cat and dog photos into a neural network, the algorithm adjusts billions of tiny mathematical weights until it can reliably distinguish whiskers from tails."
      },
      {
        heading: "3. Narrow AI vs. General AI",
        content: "Every AI tool in existence today is 'Narrow AI'—meaning it is extremely good at one specific task (like playing chess, translating languages, or recommending videos) but cannot do anything outside its domain. 'General AI' (machines with human-like general reasoning across any field) remains a theoretical concept in science fiction."
      }
    ],
    faqs: [
      {
        question: "Is AI actually smart like a human?",
        answer: "No. AI is extremely fast at finding mathematical patterns in data, but it lacks consciousness, common sense, emotions, and genuine understanding."
      },
      {
        question: "Can school students learn AI easily?",
        answer: "Yes! With visual analogies, interactive drills, and bite-sized lessons in Chikoo, students can master core AI concepts without needing advanced mathematics or code."
      }
    ],
    relatedUnits: ["unit_1", "unit_2"],
    relatedFeatures: ["practice-arena", "ai-guide"]
  },
  {
    id: "how-generative-ai-works",
    slug: "how-generative-ai-works",
    title: "How Generative AI Works: LLMs, Neural Networks, & Creative Models",
    category: "Generative AI",
    readingTime: "7 min read",
    difficulty: "Beginner",
    summary: "Discover the magic behind ChatGPT, Gemini, and AI image generators. Learn about Large Language Models, tokens, and prediction probability.",
    metaTitle: "How Generative AI Works: LLMs Explained for Kids & Students | Chikoo",
    metaDescription: "Learn how Generative AI and Large Language Models (LLMs) work. Understand tokens, transformers, text prediction, and image diffusion simply.",
    keywords: ["how generative AI works", "large language models explained", "LLMs for students", "how ChatGPT works", "generative AI basics", "tokens and transformers"],
    canonicalPath: "/learn/how-generative-ai-works",
    keyTakeaways: [
      "Generative AI creates brand new content (text, images, music, code) rather than just analyzing existing data.",
      "Large Language Models (LLMs) break text into 'tokens' and predict the most probable next token in a sequence.",
      "AI image generators (Diffusion Models) start with random digital static noise and gradually sculpt it into a clear picture based on your prompt.",
      "Generative AI does not know facts directly; it constructs plausible completions based on patterns observed during training."
    ],
    sections: [
      {
        heading: "1. From Classifiers to Creators",
        content: "Early AI was mostly about classification: looking at an image and deciding 'Is this a cat or a dog?'. Generative AI flips this completely: you type 'A fluffy cat wearing an astronaut helmet on Mars', and the model paints a brand new high-resolution scene that never existed before."
      },
      {
        heading: "2. The Super-Smart Autocomplete: How LLMs Think",
        content: "When you use an AI chatbot, the model breaks your sentence into tiny word pieces called tokens. It calculates the statistical probability of what word should come next. If you write 'The sky is...', the model calculates high probabilities for 'blue', 'cloudy', or 'clear'. By repeating this millions of times per second, it generates coherent paragraphs, poems, or Python scripts."
      },
      {
        heading: "3. What are Hallucinations?",
        content: "Because LLMs predict what sounds plausible rather than consulting a hard database of verified truth, they can sometimes speak with total confidence about facts that are completely made up. This is called an AI hallucination, which is why critical fact-checking is an essential student skill."
      }
    ],
    faqs: [
      {
        question: "Does Generative AI copy and paste from the internet?",
        answer: "No. Generative AI learns patterns during training and generates original output word-by-word or pixel-by-pixel, similar to how a person paints a picture from memory."
      },
      {
        question: "Why does AI sometimes get simple math wrong?",
        answer: "LLMs are designed for language probability, not rigid calculation. Without external calculators or tools, they are predicting words rather than computing arithmetic."
      }
    ],
    relatedUnits: ["unit_1"],
    relatedFeatures: ["challenges", "practice-arena"]
  },
  {
    id: "prompt-engineering-for-beginners",
    slug: "prompt-engineering-for-beginners",
    title: "Prompt Engineering 101: How to Talk to AI Like a Pro",
    category: "Practical Skills",
    readingTime: "5 min read",
    difficulty: "Beginner",
    summary: "Master the art of crafting precise, contextual prompts. Learn the C-R-E-A-T-E framework to get high-quality homework help and project ideas.",
    metaTitle: "Prompt Engineering Guide for Students | Chikoo AI",
    metaDescription: "Learn prompt engineering basics. Master role prompting, constraints, few-shot examples, and the C-R-E-A-T-E framework for school and projects.",
    keywords: ["prompt engineering for beginners", "how to write AI prompts", "prompting techniques", "AI prompts for students", "prompt engineering guide"],
    canonicalPath: "/learn/prompt-engineering-for-beginners",
    keyTakeaways: [
      "A prompt is the instruction or question you give to an AI model.",
      "Clear context, specific roles, output formats, and constraints dramatically improve AI response quality.",
      "The C-R-E-A-T-E method: Context, Role, Explicit instructions, Audience, Tone, and Examples.",
      "Avoid vague one-line prompts like 'explain science'; use targeted parameters like 'Act as a 7th-grade science tutor explaining photosynthesis with a pizza analogy'."
    ],
    sections: [
      {
        heading: "1. Why Prompts Matter",
        content: "Large Language Models are generalists. When given a vague question like 'Write about space', they produce generic, bland summaries. But when given precise constraints and clear audience guidelines, they unlock tailored, deeply useful explanations."
      },
      {
        heading: "2. The Golden Rules of Prompt Engineering",
        content: "1. Assign a Role: 'You are a friendly biology teacher.' 2. State the Goal: 'Explain cell respiration.' 3. Define the Audience: 'For a 12-year-old student.' 4. Set Format & Length: 'Use 3 bullet points and 1 real-world analogy.' 5. Provide Negative Constraints: 'Do not use complex technical terms without defining them.'"
      },
      {
        heading: "3. Iterative Refinement",
        content: "Never settle for the first AI response. Treat the AI like a conversational partner: ask it to simplify, add examples, format as a table, or challenge your assumptions."
      }
    ],
    faqs: [
      {
        question: "What is few-shot prompting?",
        answer: "Few-shot prompting means providing 2 or 3 examples of inputs and desired outputs inside your prompt before asking the AI to complete a new task."
      }
    ],
    relatedUnits: ["unit_1", "unit_2"],
    relatedFeatures: ["challenges", "practice-arena"]
  },
  {
    id: "machine-learning-vs-deep-learning",
    slug: "machine-learning-vs-deep-learning",
    title: "Machine Learning vs Deep Learning: The Essential Guide for Young Coders",
    category: "AI Architecture",
    readingTime: "6 min read",
    difficulty: "Intermediate",
    summary: "Understand the structural differences between traditional machine learning algorithms and multi-layered deep neural networks.",
    metaTitle: "Machine Learning vs Deep Learning Explained | Chikoo AI",
    metaDescription: "Understand the differences between Machine Learning and Deep Learning. Learn about decision trees, feature engineering, and neural network layers.",
    keywords: ["machine learning vs deep learning", "neural networks explained", "AI architecture", "deep learning for students", "types of machine learning"],
    canonicalPath: "/learn/machine-learning-vs-deep-learning",
    keyTakeaways: [
      "Machine Learning (ML) is a subset of AI where computers learn from data using mathematical algorithms.",
      "Deep Learning (DL) is a specialized subset of ML inspired by the human brain's interconnected neural networks.",
      "Traditional ML requires human engineers to hand-pick 'features', whereas Deep Learning extracts features automatically from raw data.",
      "Deep learning powers speech recognition, self-driving cars, and real-time language translation."
    ],
    sections: [
      {
        heading: "1. The Russian Nesting Dolls of AI",
        content: "Visualize three concentric circles: The outer circle is Artificial Intelligence (any technique that makes machines mimic human behavior). Inside that is Machine Learning (statistical methods that enable machines to improve at tasks with experience). Inside that is Deep Learning (multi-layer neural networks that handle massive unstructured data like video, audio, and raw text)."
      },
      {
        heading: "2. How Feature Engineering Works",
        content: "In traditional Machine Learning (like predicting house prices or filtering spam emails), engineers must manually tell the model: 'Look at bedroom count, square footage, and neighborhood.' In Deep Learning, you feed in thousands of raw photos and the network discovers edges, textures, shapes, and complex objects on its own across hidden layers."
      }
    ],
    faqs: [
      {
        question: "Do I need powerful computers for Deep Learning?",
        answer: "Yes, training deep neural networks typically requires specialized GPUs (Graphics Processing Units) that can perform trillions of matrix multiplications per second."
      }
    ],
    relatedUnits: ["unit_1", "unit_2"],
    relatedFeatures: ["puzzles", "challenges"]
  },
  {
    id: "responsible-ai-and-ethics",
    slug: "responsible-ai-and-ethics",
    title: "Responsible AI & Ethics: Bias, Privacy, and Safety for Students",
    category: "AI Ethics",
    readingTime: "6 min read",
    difficulty: "Beginner",
    summary: "Explore the crucial ethical responsibilities of building and using AI: algorithmic bias, data privacy, deepfakes, and environmental impact.",
    metaTitle: "Responsible AI & Ethics for Students | Chikoo AI Education",
    metaDescription: "Learn why AI ethics matters. Discover algorithmic bias, data privacy protection, deepfakes, copyright, and the FAIR framework.",
    keywords: ["responsible AI", "AI ethics for students", "algorithmic bias", "AI safety", "AI privacy", "ethical AI education"],
    canonicalPath: "/learn/responsible-ai-and-ethics",
    keyTakeaways: [
      "AI models inherit the biases and blind spots present in their training data.",
      "Data privacy is critical: never share passwords, personal addresses, or private photos with public AI tools.",
      "Deepfakes and synthetic audio can be used for deception; digital forensics and skepticism are vital skills.",
      "Responsible AI requires fairness, accountability, transparency, and safety (the FAIR framework)."
    ],
    sections: [
      {
        heading: "1. Garbage In, Garbage Out: Algorithmic Bias",
        content: "If you train an AI hiring tool exclusively on resumes from 1980, the model will learn historical prejudices and favor candidates matching that demographic. Because AI learns purely from historical patterns, it can amplify societal biases unless developers actively audit and balance training data."
      },
      {
        heading: "2. Protecting Your Digital Footprint",
        content: "Everything you type into free commercial AI tools may be stored and used to train future iterations. Students should practice good digital hygiene by never submitting personally identifiable information (PII)."
      }
    ],
    faqs: [
      {
        question: "How can I spot an AI deepfake?",
        answer: "Look for unnatural eye reflections, mismatched ear jewelry, blurry finger joints, robotic speech cadences, and inconsistencies in background lighting."
      }
    ],
    relatedUnits: ["unit_1", "unit_2"],
    relatedFeatures: ["puzzles", "quests"]
  },
  {
    id: "computer-vision-in-action",
    slug: "computer-vision-in-action",
    title: "Computer Vision Explained: How AI Sees and Understands the World",
    category: "Computer Vision",
    readingTime: "5 min read",
    difficulty: "Intermediate",
    summary: "Discover how computers transform grids of numbers (pixels) into object detection, face unlocking, self-driving vision, and medical imaging.",
    metaTitle: "Computer Vision Explained for Kids & Students | Chikoo AI",
    metaDescription: "Learn how Computer Vision works. Discover pixel matrices, edge detection filters, convolutional neural networks (CNNs), and object tracking.",
    keywords: ["computer vision explained", "how AI sees images", "CNNs for students", "object detection basics", "facial recognition AI"],
    canonicalPath: "/learn/computer-vision-in-action",
    keyTakeaways: [
      "To a computer, every image is just a 2D matrix of numbers representing Red, Green, and Blue (RGB) brightness values (0-255).",
      "Convolutional Neural Networks (CNNs) slide mathematical filters over pixel grids to detect edges, curves, patterns, and complex objects.",
      "Computer vision powers self-driving cars, smartphone face unlock, medical scans, and automated sports tracking.",
      "Image augmentation (flipping, rotating, color jittering) helps vision models generalize to unexpected angles."
    ],
    sections: [
      {
        heading: "1. The Digital Canvas: Pixels as Numbers",
        content: "While human eyes perceive colors, textures, and depth, a computer processor only reads numbers. An HD photo is a grid of 1920x1080 numbers for red, green, and blue. Computer Vision is the science of turning those raw numbers into semantic meaning like 'This is a golden retriever catching a frisbee'."
      },
      {
        heading: "2. Convolutional Filters: The Digital Magnifying Glass",
        content: "A Convolutional Neural Network uses tiny mathematical matrices called kernels. As these kernels slide across the image, they highlight vertical edges, horizontal lines, and color shifts. In deeper layers, these simple lines combine into shapes, eye outlines, wheel spokes, and recognizable objects."
      }
    ],
    faqs: [
      {
        question: "Can AI see in the dark?",
        answer: "Yes, when paired with infrared sensors, LiDAR, or thermal cameras, computer vision algorithms can analyze wavelengths of light that are completely invisible to human eyes."
      }
    ],
    relatedUnits: ["unit_1", "unit_2"],
    relatedFeatures: ["puzzles", "practice-arena"]
  },
  {
    id: "ai-in-daily-life",
    slug: "ai-in-daily-life",
    title: "Hidden AI in Daily Life: Smart Assistants, Recommendations, & Navigation",
    category: "Applied AI",
    readingTime: "5 min read",
    difficulty: "Beginner",
    summary: "Uncover the hidden algorithms powering your smartphone: autocomplete, GPS route optimization, music recommendations, and email spam filters.",
    metaTitle: "AI in Everyday Life: Hidden Algorithms Around You | Chikoo",
    metaDescription: "Discover everyday AI applications: Netflix recommendations, Spotify playlists, Google Maps routing, spam filtering, and smartphone cameras.",
    keywords: ["AI in daily life", "everyday AI examples", "recommendation algorithms", "smart assistants", "AI around us"],
    canonicalPath: "/learn/ai-in-daily-life",
    keyTakeaways: [
      "You interact with dozens of AI systems daily without even realizing it.",
      "Streaming services use collaborative filtering to recommend songs and movies based on users with similar tastes.",
      "Navigation apps use graph algorithms and real-time traffic telemetry to recalculate fastest driving routes.",
      "Modern smartphone cameras take multiple exposures and use AI neural processing to eliminate blur and optimize lighting in milliseconds."
    ],
    sections: [
      {
        heading: "1. The Invisible Co-Pilot",
        content: "Artificial Intelligence isn't just humanoid robots in laboratories; it is quietly running in your pocket. When your phone categorizes photos by pet or location, when your email automatically moves suspicious lottery messages to spam, or when predictive text finishes your sentence—that's machine learning in action."
      },
      {
        heading: "2. The Recommendation Matrix",
        content: "How does Spotify know you will love a song you've never heard? It analyzes the acoustic properties of your favorite tracks (tempo, key, danceability) and compares your listening history against millions of other users with matching taste profiles."
      }
    ],
    faqs: [
      {
        question: "Does social media use AI to keep me scrolling?",
        answer: "Yes. Engagement algorithms analyze how long you pause on videos and images, continuously feeding content that maximizes watch time."
      }
    ],
    relatedUnits: ["unit_1"],
    relatedFeatures: ["practice-arena", "quests"]
  },
  {
    id: "neural-networks-made-simple",
    slug: "neural-networks-made-simple",
    title: "Neural Networks Made Simple: Neurons, Layers, and Backpropagation",
    category: "AI Architecture",
    readingTime: "6 min read",
    difficulty: "Intermediate",
    summary: "A friendly, visual breakdown of artificial neural networks. Learn how inputs pass through hidden layers and how machines learn from mistakes.",
    metaTitle: "Neural Networks Explained Simply for Students | Chikoo AI",
    metaDescription: "Learn how Artificial Neural Networks work. Simple explanations of inputs, weights, biases, activation functions, and backpropagation.",
    keywords: ["neural networks made simple", "how neural networks work", "neurons and layers", "backpropagation explained", "AI neural network guide"],
    canonicalPath: "/learn/neural-networks-made-simple",
    keyTakeaways: [
      "Artificial Neural Networks are computational networks inspired by the human brain's interconnected neurons.",
      "Information moves from an Input Layer through multiple Hidden Layers to an Output Layer.",
      "Each connection has a 'weight' that determines its importance; learning means tuning these weights.",
      "Backpropagation is the process of calculating errors at the output and propagating corrections backward through the network."
    ],
    sections: [
      {
        heading: "1. Nodes and Connections",
        content: "Imagine a stadium crowd playing a giant game of telephone. Each person (neuron) listens to messages from people behind them, applies a personal math formula, and shouts a refined number to people in front of them. The final people in the front row give the final answer: 'It is a 95% chance of rain'."
      },
      {
        heading: "2. Learning from Mistakes (Backpropagation)",
        content: "When a newly created neural network makes an incorrect prediction, a mathematical process called backpropagation runs backwards through every layer. It nudges each weight slightly in the right direction, ensuring the network makes fewer mistakes on subsequent attempts."
      }
    ],
    faqs: [
      {
        question: "Are artificial neurons alive?",
        answer: "No. Artificial neurons are simple mathematical functions (like multiplying numbers and adding an offset) executing inside computer memory."
      }
    ],
    relatedUnits: ["unit_1", "unit_2"],
    relatedFeatures: ["challenges", "puzzles"]
  }
];

export function getAllSeoUnits(dynamicModules?: Module[]): SeoUnit[] {
  const sourceModules = (dynamicModules && dynamicModules.length > 0) ? dynamicModules : AI_CURRICULUM;
  
  return sourceModules.map((m, mIdx) => {
    const rawTitle = m.title || `Unit ${mIdx + 1}: AI Learning Journey`;
    const cleanTitle = cleanEmoji(rawTitle);
    const unitSlug = slugify(cleanTitle) || `unit-${m.id}`;
    const desc = (m.description && !m.description.includes('|')) ? m.description : `Master core AI concepts, everyday analogies, and interactive challenges in ${cleanTitle}.`;
    
    const lessons: SeoLesson[] = (m.lessons || []).map((l, lIdx) => {
      const rawLessonTitle = l.title || `Lesson ${lIdx + 1}`;
      const cleanLessonTitle = cleanEmoji(rawLessonTitle);
      const lessonSlug = slugify(cleanLessonTitle) || `lesson-${l.id}`;
      const lessonDesc = l.description || `Explore ${cleanLessonTitle} through interactive puzzles, relatable analogies, and step-by-step AI challenges.`;
      
      const sampleQuestions = (l.challenges || []).slice(0, 3).map(c => ({
        question: c.question,
        type: c.type,
        explanation: typeof c.explanation === 'string' ? c.explanation : c.explanation?.text || undefined
      }));

      const keyTakeaways = [
        `Understand core principles of ${cleanLessonTitle}.`,
        `Practice with real-world scenarios and interactive challenges.`,
        `Test understanding with instant feedback and Chikoo micro-explanations.`
      ];

      return {
        id: l.id,
        slug: lessonSlug,
        title: rawLessonTitle,
        cleanTitle: cleanLessonTitle,
        description: lessonDesc,
        difficulty: l.difficulty || 'Easy',
        xpReward: l.xpReward || 100,
        metaTitle: `${cleanLessonTitle} | ${cleanTitle} - Chikoo AI`,
        metaDescription: `${lessonDesc.slice(0, 150)}. Interactive AI lesson on Chikoo with quizzes, micro-explanations, and practice.`,
        keywords: [
          cleanLessonTitle.toLowerCase(),
          `${cleanLessonTitle.toLowerCase()} ai`,
          "learn ai",
          "ai lesson for kids",
          "interactive ai challenge",
          "ai education"
        ],
        canonicalPath: `/units/${unitSlug}/lessons/${lessonSlug}`,
        unitId: m.id,
        unitSlug: unitSlug,
        unitTitle: cleanTitle,
        challengesCount: (l.challenges || []).length,
        sampleQuestions,
        keyTakeaways
      };
    });

    return {
      id: m.id,
      slug: unitSlug,
      title: rawTitle,
      cleanTitle: cleanTitle,
      description: desc,
      difficulty: m.difficulty || 'Beginner',
      metaTitle: `${cleanTitle} - Interactive AI Unit | Chikoo`,
      metaDescription: `${desc.slice(0, 150)}. Explore ${lessons.length} interactive lessons on Chikoo AI with gamified challenges.`,
      keywords: [
        cleanTitle.toLowerCase(),
        "learn artificial intelligence",
        "ai curriculum",
        "ai fundamentals",
        "interactive ai unit",
        "student ai learning"
      ],
      canonicalPath: `/units/${unitSlug}`,
      lessonsCount: lessons.length,
      lessons,
      relatedFeatures: ["practice-arena", "challenges", "ai-guide"],
      relatedTopics: ["what-is-artificial-intelligence", "how-generative-ai-works", "responsible-ai-and-ethics"]
    };
  });
}

export function getSeoUnitBySlug(slug: string, dynamicModules?: Module[]): SeoUnit | undefined {
  const units = getAllSeoUnits(dynamicModules);
  const clean = slug.toLowerCase().trim();
  return units.find(u => u.slug === clean || u.id.toLowerCase() === clean);
}

export function getSeoLesson(unitSlug: string, lessonSlug: string, dynamicModules?: Module[]): SeoLesson | undefined {
  const unit = getSeoUnitBySlug(unitSlug, dynamicModules);
  if (!unit) return undefined;
  const clean = lessonSlug.toLowerCase().trim();
  return unit.lessons.find(l => l.slug === clean || l.id.toLowerCase() === clean);
}

export function getSeoFeatureBySlug(slug: string): SeoFeature | undefined {
  const clean = slug.toLowerCase().trim();
  return SEO_FEATURES.find(f => f.slug === clean || f.id.toLowerCase() === clean);
}

export function getSeoTopicBySlug(slug: string): SeoTopicArticle | undefined {
  const clean = slug.toLowerCase().trim();
  return SEO_TOPICS.find(t => t.slug === clean || t.id.toLowerCase() === clean);
}

// JSON-LD Structured Data Generators
export function generatePlatformSchema(baseUrl: string = CHIKOO_PLATFORM_SEO.domain) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        "url": baseUrl,
        "name": "Chikoo",
        "description": CHIKOO_PLATFORM_SEO.description,
        "publisher": {
          "@id": `${baseUrl}/#organization`
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${baseUrl}/units?q={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "EducationalOrganization",
        "@id": `${baseUrl}/#organization`,
        "name": "Chikoo Learning Systems",
        "url": baseUrl,
        "logo": `${baseUrl}/avatar.webp`,
        "description": "Interactive, gamified AI learning platform for students and curious minds.",
        "sameAs": []
      },
      {
        "@type": "SoftwareApplication",
        "name": "Chikoo - Learn AI",
        "operatingSystem": "All modern browsers, Android, iOS, Windows, macOS",
        "applicationCategory": "EducationalApplication",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "ratingCount": "1420"
        }
      }
    ]
  };
}

export function generateCourseSchema(unit: SeoUnit, baseUrl: string = CHIKOO_PLATFORM_SEO.domain) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": unit.cleanTitle,
    "description": unit.description,
    "provider": {
      "@type": "EducationalOrganization",
      "name": "Chikoo",
      "sameAs": baseUrl
    },
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "Online",
      "courseWorkload": "PT20M"
    },
    "educationalLevel": unit.difficulty,
    "url": `${baseUrl}${unit.canonicalPath}`,
    "hasPart": unit.lessons.map(l => ({
      "@type": "LearningResource",
      "name": l.cleanTitle,
      "description": l.description,
      "url": `${baseUrl}${l.canonicalPath}`
    }))
  };
}

export function generateLessonSchema(lesson: SeoLesson, baseUrl: string = CHIKOO_PLATFORM_SEO.domain) {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    "name": lesson.cleanTitle,
    "description": lesson.description,
    "learningResourceType": "Interactive Lesson",
    "educationalLevel": lesson.difficulty,
    "url": `${baseUrl}${lesson.canonicalPath}`,
    "isPartOf": {
      "@type": "Course",
      "name": lesson.unitTitle,
      "url": `${baseUrl}/units/${lesson.unitSlug}`
    },
    "audience": {
      "@type": "EducationalAudience",
      "educationalRole": "student"
    }
  };
}

export function generateFeatureSchema(feature: SeoFeature, baseUrl: string = CHIKOO_PLATFORM_SEO.domain) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": `Chikoo ${feature.name}`,
    "applicationCategory": "EducationalApplication",
    "description": feature.longDescription,
    "url": `${baseUrl}${feature.canonicalPath}`,
    "featureList": feature.highlights
  };
}

export function generateArticleSchema(article: SeoTopicArticle, baseUrl: string = CHIKOO_PLATFORM_SEO.domain) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": article.title,
    "description": article.summary,
    "author": {
      "@type": "Organization",
      "name": "Chikoo Editorial Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Chikoo",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/avatar.webp`
      }
    },
    "mainEntityOfPage": `${baseUrl}${article.canonicalPath}`,
    "keywords": article.keywords.join(", ")
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[], baseUrl: string = CHIKOO_PLATFORM_SEO.domain) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`
    }))
  };
}

export function generateFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer
      }
    }))
  };
}

export function generateSitemapXml(baseUrl: string = CHIKOO_PLATFORM_SEO.domain, dynamicModules?: Module[]): string {
  const units = getAllSeoUnits(dynamicModules);
  const now = new Date().toISOString().split('T')[0];

  const urls: Array<{ loc: string; lastmod: string; changefreq: string; priority: string }> = [
    { loc: `${baseUrl}/`, lastmod: now, changefreq: 'daily', priority: '1.0' },
    { loc: `${baseUrl}/what-is-chikoo`, lastmod: now, changefreq: 'weekly', priority: '0.9' },
    { loc: `${baseUrl}/units`, lastmod: now, changefreq: 'daily', priority: '0.9' },
    { loc: `${baseUrl}/features`, lastmod: now, changefreq: 'weekly', priority: '0.8' },
    { loc: `${baseUrl}/learn`, lastmod: now, changefreq: 'daily', priority: '0.9' },
  ];

  // Features
  SEO_FEATURES.forEach(f => {
    urls.push({
      loc: `${baseUrl}${f.canonicalPath}`,
      lastmod: now,
      changefreq: 'weekly',
      priority: '0.8'
    });
  });

  // Educational articles
  SEO_TOPICS.forEach(t => {
    urls.push({
      loc: `${baseUrl}${t.canonicalPath}`,
      lastmod: now,
      changefreq: 'weekly',
      priority: '0.85'
    });
  });

  // Units and Lessons
  units.forEach(u => {
    urls.push({
      loc: `${baseUrl}${u.canonicalPath}`,
      lastmod: now,
      changefreq: 'weekly',
      priority: '0.85'
    });

    u.lessons.forEach(l => {
      urls.push({
        loc: `${baseUrl}${l.canonicalPath}`,
        lastmod: now,
        changefreq: 'weekly',
        priority: '0.8'
      });
    });
  });

  const xmlEntries = urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
}

export function generateRobotsTxt(baseUrl: string = CHIKOO_PLATFORM_SEO.domain): string {
  return `# robots.txt for Chikoo AI
User-agent: *
Allow: /
Allow: /what-is-chikoo
Allow: /units
Allow: /units/*
Allow: /features
Allow: /features/*
Allow: /learn
Allow: /learn/*
Allow: /sitemap.xml

# Disallow private user data, dashboards, and API endpoints
Disallow: /api/
Disallow: /admin
Disallow: /school-admin
Disallow: /student-analytics
Disallow: /user-management
Disallow: /*?*portal=
Disallow: /*?*view=

Sitemap: ${baseUrl}/sitemap.xml
`;
}
