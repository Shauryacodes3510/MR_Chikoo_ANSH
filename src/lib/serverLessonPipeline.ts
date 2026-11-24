import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { Challenge, Lesson, UnitStoryBible, LessonMemory } from "./curriculumTypes.ts";

export type GenerationStage = 
  | 'plan' 
  | 'story' 
  | 'concept' 
  | 'questions' 
  | 'compilation' 
  | 'validation' 
  | 'review';

export interface GenerationJob {
  jobId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  stage: GenerationStage;
  progress: number; // 0 to 100
  createdAt: string;
  updatedAt: string;
  error: string | null;
  failedStage: GenerationStage | null;
  requestParams: {
    unitId: string;
    unitTitle: string;
    unitContext?: UnitStoryBible;
    previousLessonMemory?: LessonMemory;
    lessonTitle?: string;
    concept: string;
    objective?: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    storyGoal?: string;
    screenCount?: number;
  };
  stageResults: {
    plan?: any;
    story?: any;
    concept?: any;
    questions?: any[];
    compilation?: any;
    validation?: any;
    review?: any;
  };
  lesson?: Lesson;
  lessonMemory?: LessonMemory;
}

// In-Memory Job Cache
const jobsMap = new Map<string, GenerationJob>();

// Persistence File Path
const DATA_DIR = path.join(process.cwd(), 'data');
const JOBS_FILE = path.join(DATA_DIR, 'generation_jobs.json');

// Initialize Storage
function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(JOBS_FILE)) {
      const raw = fs.readFileSync(JOBS_FILE, 'utf-8');
      const loaded: GenerationJob[] = JSON.parse(raw);
      for (const job of loaded) {
        // If a job was left 'running' during a server restart, mark it failed with a clear restart reason
        if (job.status === 'running') {
          job.status = 'failed';
          job.error = 'Server restarted while generating. Click Retry Stage to resume.';
          job.failedStage = job.stage;
        }
        jobsMap.set(job.jobId, job);
      }
    }
  } catch (err) {
    console.error('[LessonPipeline] Error initializing jobs store:', err);
  }
}

// Save jobs to disk
function persistJobs() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const list = Array.from(jobsMap.values()).slice(-50); // Keep last 50
    fs.writeFileSync(JOBS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('[LessonPipeline] Failed to persist jobs:', err);
  }
}

ensureDataDir();

// Helper to resolve nice illustrations based on keywords
export function getMatchingIllustrationUrl(topic: string, details: string): string {
  const query = `${topic} ${details}`.toLowerCase();
  
  if (query.includes("car") || query.includes("autonomous") || query.includes("drive")) {
    return "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&auto=format&fit=crop";
  }
  if (query.includes("space") || query.includes("star") || query.includes("planet") || query.includes("galaxy")) {
    return "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop";
  }
  if (query.includes("security") || query.includes("fraud") || query.includes("shield") || query.includes("hack")) {
    return "https://images.unsplash.com/photo-1563013544-824ae1d704d3?w=600&auto=format&fit=crop";
  }
  if (query.includes("game") || query.includes("play") || query.includes("quiz") || query.includes("puppy")) {
    return "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop";
  }
  if (query.includes("bot") || query.includes("robot") || query.includes("chat") || query.includes("assistant")) {
    return "https://images.unsplash.com/photo-1531747118685-ca8fa6e08806?w=600&auto=format&fit=crop";
  }
  if (query.includes("vision") || query.includes("face") || query.includes("camera") || query.includes("eye")) {
    return "https://images.unsplash.com/photo-1527474305487-b87b222841cc?w=600&auto=format&fit=crop";
  }
  if (query.includes("brain") || query.includes("neural") || query.includes("mind") || query.includes("think")) {
    return "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=600&auto=format&fit=crop";
  }
  if (query.includes("money") || query.includes("bank") || query.includes("loan") || query.includes("finance")) {
    return "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop";
  }
  if (query.includes("factory") || query.includes("pipeline") || query.includes("rocket") || query.includes("build")) {
    return "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop";
  }
  if (query.includes("ethics") || query.includes("fair") || query.includes("privacy") || query.includes("law")) {
    return "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=600&auto=format&fit=crop";
  }
  if (query.includes("music") || query.includes("song") || query.includes("melody") || query.includes("sound")) {
    return "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop";
  }
  if (query.includes("nature") || query.includes("plant") || query.includes("crop") || query.includes("tree")) {
    return "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop";
  }
  
  return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop";
}

// Robust Gemini Call with Per-Stage Timeout & Exponential Backoff
async function callGeminiStageWithTimeout(prompt: string, timeoutMs = 15000, maxRetries = 2): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const callPromise = ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const timeoutPromise = new Promise((_, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`AI generation timed out after ${timeoutMs / 1000}s (Attempt ${attempt}/${maxRetries})`));
        }, timeoutMs);
        callPromise.finally(() => clearTimeout(timer));
      });

      const response: any = await Promise.race([callPromise, timeoutPromise]);
      const rawText = response.text || "{}";

      // Parse JSON
      try {
        return JSON.parse(rawText);
      } catch (parseErr) {
        // Strip markdown fences if present
        const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[LessonPipeline] Gemini call attempt ${attempt} failed:`, err.message || err);
      if (attempt < maxRetries) {
        // Exponential backoff wait (500ms, 1200ms)
        await new Promise(r => setTimeout(r, attempt * 600));
      }
    }
  }

  throw lastError || new Error("Failed to generate content from AI model.");
}

// Stage 1: Curriculum Plan
async function executeStagePlan(job: GenerationJob): Promise<any> {
  const { unitTitle, unitId, unitContext, previousLessonMemory, concept, objective, difficulty = "Medium", screenCount = 6, storyGoal } = job.requestParams;

  const characters = unitContext?.characters && Array.isArray(unitContext.characters) && unitContext.characters.length > 0
    ? unitContext.characters.map((c: any) => `- ${c.name} (${c.role}): ${c.personality}`).join("\n")
    : "- Chikoo (Curious Lead Explorer): Energetic, loves analogies with snacks & everyday items.\n- Byte (Robotic Navigator): Literal-minded, loves structured data, easily puzzled by messy inputs.\n- Spark (AI Mentor): Calm and encouraging guide.";

  const storyPremise = unitContext?.storyPremise || "Chikoo and Byte are exploring the cosmos, learning AI & STEM concepts to solve real-world problems.";
  const learningGoal = unitContext?.learningGoal || `Master concepts related to ${unitTitle}.`;
  
  const prevContext = previousLessonMemory ? `
PREVIOUS LESSON CONTINUITY:
- Previous Lesson Title: "${previousLessonMemory.lessonTitle || 'Previous Lesson'}"
- Concept Taught in Previous Lesson: "${previousLessonMemory.conceptTaught || 'Introductory concepts'}"
- Story Event: "${previousLessonMemory.storyEvent || 'The crew completed their previous task.'}"
- Character Status: "${previousLessonMemory.characterStatus || 'Energized and ready.'}"
- Cliffhanger / Hook to Continue From: "${previousLessonMemory.cliffhangerOrHook || 'A new signal or mystery has appeared ahead!'}"
` : `
PREVIOUS LESSON CONTINUITY:
- Initial lesson of the unit arc. Start with the unit premise!
`;

  const prompt = `You are an expert curriculum architect for "Chikoo", a gamified STEM & AI learning platform for school students (aged 8-15).

Generate a concise, high-level CURRICULUM & LESSON PLAN for the target concept below.

UNIT & STORY CONTEXT:
- Unit: "${unitTitle}" (${unitId || 'unit_1'})
- Learning Goal: ${learningGoal}
- Story Premise: ${storyPremise}
- Characters:
${characters}
${prevContext}

TARGET LESSON PARAMETERS:
- Target Concept: "${concept}"
- Pedagogical Objective: "${objective || `Understand and apply ${concept}`}"
- Difficulty Tier: "${difficulty}"
- Custom Story Focus: "${storyGoal || 'Resolve the previous cliffhanger with the new concept.'}"
- Target Total Screens: ${screenCount}

Plan the lesson arc with:
1. Catchy Title with emoji (e.g. "🚀 The Mystery of Noisy Sensors")
2. Story Hook resolving the cliffhanger/scene
3. Core Concept Everyday Analogy
4. Screen Plan Array of ${screenCount} planned screens:
   - Screen 1: Story Scene ("content_screen")
   - Screen 2: Concept Introduction ("content_screen")
   - Screen 3: Basic Concept Recognition ("c9_true_false" or "c1_multiple_choice")
   - Screen 4: Concept Categorization / Matching / Fill ("c4_concept_matcher" or "c5_bucket_sort" or "c2_fill_in_blank")
   - Screen 5: Real-World Transfer Scenario ("c1_multiple_choice" or "ai_vs_human")
   - Screen 6: Mastery Victory Check ("c1_multiple_choice" or "c16_eliminate_wrong")
5. One-line key takeaway

Return ONLY valid JSON matching this schema:
{
  "lessonTitle": "🚀 Fun Title with Emoji",
  "storyHook": "1-2 sentences setting the scene and resolving the hook",
  "conceptAnalogyBrief": "Brief memorable everyday analogy (e.g. sorting laundry, recipe ingredients)",
  "pedagogicalOutline": "Brief 2-sentence summary of the learning progression",
  "screenPlan": [
    { "screenNumber": 1, "type": "content_screen", "purpose": "Story Hook Scene", "brief": "Description" },
    { "screenNumber": 2, "type": "content_screen", "purpose": "Core Concept Analogy", "brief": "Description" },
    { "screenNumber": 3, "type": "c9_true_false", "purpose": "Basic Recognition", "brief": "Description" },
    { "screenNumber": 4, "type": "c4_concept_matcher", "purpose": "Application/Sorting", "brief": "Description" },
    { "screenNumber": 5, "type": "c1_multiple_choice", "purpose": "Real-World Scenario", "brief": "Description" },
    { "screenNumber": 6, "type": "c1_multiple_choice", "purpose": "Mastery Check", "brief": "Description" }
  ],
  "keyTakeaway": "One-line core rule to remember",
  "xpReward": ${difficulty === 'Hard' ? 150 : difficulty === 'Medium' ? 120 : 100}
}`;

  return await callGeminiStageWithTimeout(prompt, 14000);
}

// Stage 2: Story Screen
async function executeStageStory(job: GenerationJob): Promise<any> {
  const plan = job.stageResults.plan || {};
  const { unitTitle, unitContext, previousLessonMemory, concept } = job.requestParams;

  const characters = unitContext?.characters && Array.isArray(unitContext.characters) && unitContext.characters.length > 0
    ? unitContext.characters.map((c: any) => c.name).join(", ")
    : "Chikoo and Byte";

  const prompt = `You are a narrative writer for "Chikoo".
Write the opening STORY SCREEN (Screen 1) for lesson "${plan.lessonTitle || concept}" in Unit "${unitTitle}".

STORY CONTEXT:
- Characters: ${characters}
- Story Hook: ${plan.storyHook || 'The crew encounters an unexpected mystery.'}
- Previous Cliffhanger: ${previousLessonMemory?.cliffhangerOrHook || 'A strange radar signal blinks on screen!'}

REQUIREMENTS:
1. Must use "contentScreen" structure.
2. sceneType: "dialogue" or "hero"
3. heading: Catchy story title with emoji
4. subheading: 1-line situation
5. contentBody: 2-3 short, lively dialogue blocks separated by double newlines (e.g. "Chikoo: Look at that readout!\n\nByte: Alert! Sensor variance detected.").
6. highlightBox: A punchy clue or funny observation by Chikoo/Byte.
7. bottomMessage: "Tap Continue to investigate!"

Return ONLY valid JSON matching this schema:
{
  "type": "content_screen",
  "contentScreen": {
    "sceneType": "dialogue",
    "badge": "🚀 Mission Log",
    "heading": "Heading with Emoji",
    "subheading": "1-line situation",
    "contentBody": "Chikoo: Dialogue line 1\\n\\nByte: Dialogue line 2",
    "highlightBox": "💡 Chikoo's Note: Observation or clue",
    "bottomMessage": "Tap Continue to investigate!",
    "charactersInScene": ["Chikoo", "Byte"]
  }
}`;

  return await callGeminiStageWithTimeout(prompt, 12000);
}

// Stage 3: Concept / Textbook Page
async function executeStageConcept(job: GenerationJob): Promise<any> {
  const plan = job.stageResults.plan || {};
  const { concept, objective } = job.requestParams;

  const prompt = `You are an educational explainer for kids (aged 8-15) on "Chikoo".
Write the CORE CONCEPT INTRODUCTION SCREEN (Screen 2) for: "${concept}".

PARAMETERS:
- Target Concept: "${concept}"
- Objective: "${objective || `Understand ${concept}`}"
- Analogy Idea: "${plan.conceptAnalogyBrief || 'Everyday relatable comparison'}"

REQUIREMENTS:
1. Must be under 60 words total in body.
2. Zero heavy jargon.
3. Compare the concept directly to a vivid everyday twin (e.g., sorting laundry, recipe ingredients, flashlight beam, training a puppy).
4. Highlight Box must contain "⭐ Golden Rule: [One memorable 1-line rule]".

Return ONLY valid JSON matching this schema:
{
  "type": "content_screen",
  "contentScreen": {
    "sceneType": "hero",
    "badge": "💡 Core Concept",
    "heading": "${concept}",
    "subheading": "The Everyday Twin",
    "contentBody": "Clear 2-sentence explanation comparing ${concept} to an everyday analogy.",
    "highlightBox": "⭐ Golden Rule: Memorable 1-line takeaway",
    "bottomMessage": "Let's put this into action!"
  }
}`;

  return await callGeminiStageWithTimeout(prompt, 12000);
}

// Stage 4: Questions / Interactive Screens
async function executeStageQuestions(job: GenerationJob): Promise<any[]> {
  const plan = job.stageResults.plan || {};
  const { concept, difficulty = "Medium" } = job.requestParams;

  const prompt = `You are an interactive learning designer for "Chikoo".
Create the 4 INTERACTIVE QUESTION SCREENS for concept "${concept}" (Screens 3 to 6).

PROGRESSION REQUIRED:
1. SCREEN 3: Basic Concept Recognition (type: "c9_true_false" or "c1_multiple_choice")
   - Test basic grasp of the definition.
2. SCREEN 4: Active Application (type: "c4_concept_matcher" or "c5_bucket_sort" or "c2_fill_in_blank")
   - Categorization, matching pairs, or blank filling.
3. SCREEN 5: Real-World Transfer Scenario (type: "c1_multiple_choice" or "ai_vs_human")
   - Relatable real-world scenario applying ${concept}.
4. SCREEN 6: Mastery Victory Check (type: "c1_multiple_choice" or "c16_eliminate_wrong")
   - Final decision solving the mission puzzle.

TYPE SCHEMAS:
- If "c1_multiple_choice": { "type": "c1_multiple_choice", "question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "Exact matching string", "explanation": "Chikoo says: ..." }
- If "c9_true_false": { "type": "c9_true_false", "question": "...", "correctAnswer": "True" or "False", "explanation": "Chikoo says: ..." }
- If "c4_concept_matcher": { "type": "c4_concept_matcher", "question": "Match each item:", "pairs": [{"left": "...", "right": "..."}, {"left": "...", "right": "..."}, {"left": "...", "right": "..."}], "explanation": "Chikoo says: ..." }
- If "c5_bucket_sort": { "type": "c5_bucket_sort", "question": "Sort into buckets:", "buckets": [{"id": "b1", "label": "..."}, {"id": "b2", "label": "..."}], "items": [{"id": "i1", "text": "...", "correct_bucket": "b1"}, {"id": "i2", "text": "...", "correct_bucket": "b2"}, {"id": "i3", "text": "...", "correct_bucket": "b1"}], "explanation": "Chikoo says: ..." }
- If "c2_fill_in_blank": { "type": "c2_fill_in_blank", "question": "Sentence with [BLANK]", "options": ["Opt1", "Opt2", "Opt3", "Opt4"], "correctAnswer": "Opt1", "explanation": "Chikoo says: ..." }

Return ONLY valid JSON matching this schema:
{
  "questions": [
    { ...Screen 3 object... },
    { ...Screen 4 object... },
    { ...Screen 5 object... },
    { ...Screen 6 object... }
  ]
}`;

  const res = await callGeminiStageWithTimeout(prompt, 16000);
  return Array.isArray(res.questions) ? res.questions : (Array.isArray(res) ? res : []);
}

// Stage 5: JSON Compilation (Deterministic)
function executeStageCompilation(job: GenerationJob): { lesson: Lesson; lessonMemory: LessonMemory } {
  const plan = job.stageResults.plan || {};
  const story = job.stageResults.story;
  const conceptScreen = job.stageResults.concept;
  const questions = job.stageResults.questions || [];
  const { concept, difficulty = "Medium", lessonTitle } = job.requestParams;

  const genId = `l_${Date.now().toString().slice(-6)}`;
  const finalTitle = lessonTitle?.trim() || plan.lessonTitle || `🚀 ${concept}`;

  const challenges: Challenge[] = [];

  // 1. Story Screen
  if (story) {
    challenges.push({
      id: `${genId}_q1`,
      type: "content_screen",
      xpValue: 15,
      question: story.contentScreen?.heading || "Mission Briefing",
      contentScreen: story.contentScreen,
      explanation: "Chikoo says: Scene initiated!"
    });
  }

  // 2. Concept Screen
  if (conceptScreen) {
    challenges.push({
      id: `${genId}_q2`,
      type: "content_screen",
      xpValue: 20,
      question: conceptScreen.contentScreen?.heading || concept,
      contentScreen: conceptScreen.contentScreen,
      explanation: "Chikoo says: Core concept unlocked!"
    });
  }

  // 3. Question screens
  questions.forEach((q: any, i: number) => {
    const qId = `${genId}_q${challenges.length + 1}`;
    let explanation = q.explanation;
    if (typeof explanation === "string" && !explanation.toLowerCase().includes("chikoo")) {
      explanation = `Chikoo says: ${explanation}`;
    }

    challenges.push({
      id: qId,
      type: q.type || "c1_multiple_choice",
      question: q.question || `Mastery test for ${concept}`,
      options: q.options || [],
      correctAnswer: q.correctAnswer || (q.options ? q.options[0] : ''),
      pairs: q.pairs,
      buckets: q.buckets,
      items: q.items,
      xpValue: q.xpValue || 20,
      explanation: explanation || "Chikoo says: Excellent work applying this concept!"
    });
  });

  const lesson: Lesson = {
    id: genId,
    title: finalTitle,
    description: plan.pedagogicalOutline || `Learn and apply ${concept} with Chikoo & Byte.`,
    category: concept,
    difficulty: difficulty as any,
    xpReward: plan.xpReward || (difficulty === 'Hard' ? 150 : difficulty === 'Medium' ? 120 : 100),
    challenges
  };

  const lessonMemory: LessonMemory = {
    lessonId: genId,
    lessonTitle: finalTitle,
    conceptTaught: concept,
    storyEvent: plan.storyHook || `Chikoo and Byte explored ${concept} and calibrated their sensors.`,
    characterStatus: "Energized, sensors calibrated, ready for the next challenge.",
    cliffhangerOrHook: "A new anomaly is flashing on the navigation console!",
    keyTakeaway: plan.keyTakeaway || `${concept} empowers smart, structured problem solving.`,
    dateGenerated: new Date().toISOString()
  };

  return { lesson, lessonMemory };
}

// Stage 6: JSON Validation (Deterministic)
function executeStageValidation(lesson: Lesson, concept: string): { isValid: boolean; normalizedLesson: Lesson; issues: string[] } {
  const issues: string[] = [];
  const normalizedChallenges = lesson.challenges.map((ch, idx) => {
    const safeCh: any = { ...ch };

    // Attach illustration if missing on story screens
    if (safeCh.type === 'content_screen' && safeCh.contentScreen) {
      if (!safeCh.contentScreen.mediaUrl) {
        safeCh.contentScreen.mediaUrl = getMatchingIllustrationUrl(concept, safeCh.contentScreen.heading || '');
      }
    }

    // Check multiple choice options
    if (safeCh.type === 'c1_multiple_choice' || safeCh.type === 'tap_right_answer') {
      if (!Array.isArray(safeCh.options) || safeCh.options.length === 0) {
        safeCh.options = ["Correct option", "Distractor A", "Distractor B", "Distractor C"];
        safeCh.correctAnswer = "Correct option";
        issues.push(`Screen ${idx + 1}: Missing options array, filled with defaults.`);
      } else if (!safeCh.options.includes(safeCh.correctAnswer)) {
        safeCh.correctAnswer = safeCh.options[0];
        issues.push(`Screen ${idx + 1}: Correct answer was not in options, set to first option.`);
      }
    }

    // Check true/false
    if (safeCh.type === 'c9_true_false') {
      const ans = String(safeCh.correctAnswer).toLowerCase();
      safeCh.correctAnswer = ans.includes('t') ? 'True' : 'False';
    }

    return safeCh;
  });

  const normalizedLesson: Lesson = {
    ...lesson,
    challenges: normalizedChallenges
  };

  return {
    isValid: issues.length === 0,
    normalizedLesson,
    issues
  };
}

// Stage 7: Quality Review (Deterministic)
function executeStageReview(lesson: Lesson, lessonMemory: LessonMemory): any {
  const challengeCount = lesson.challenges.length;
  const hasStory = lesson.challenges.some(c => c.type === 'content_screen');
  const hasInteractive = lesson.challenges.some(c => c.type !== 'content_screen');

  const qualityScore = Math.min(100, (hasStory ? 40 : 10) + (hasInteractive ? 40 : 10) + (challengeCount >= 4 ? 20 : 10));

  return {
    qualityScore,
    readabilityGrade: "Age 8-15 (Easy & Engaging)",
    voiceCheck: "Chikoo friendly & encouraging",
    screenCount: challengeCount,
    hasStoryContinuity: !!lessonMemory.cliffhangerOrHook
  };
}

// Master Stage Runner for a Job
export async function runJobPipeline(jobId: string, startStage?: GenerationStage): Promise<GenerationJob> {
  const job = jobsMap.get(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  if (job.status === 'cancelled') {
    return job;
  }

  job.status = 'running';
  job.error = null;
  job.failedStage = null;
  job.updatedAt = new Date().toISOString();
  persistJobs();

  const stages: GenerationStage[] = ['plan', 'story', 'concept', 'questions', 'compilation', 'validation', 'review'];
  const startIndex = startStage ? stages.indexOf(startStage) : 0;

  for (let i = startIndex; i < stages.length; i++) {
    const liveJob = jobsMap.get(job.jobId);
    if (!liveJob || (liveJob.status as string) === 'cancelled') {
      break;
    }

    const currentStage = stages[i];
    job.stage = currentStage;
    job.updatedAt = new Date().toISOString();

    // Progress mapping
    const progressMap: Record<GenerationStage, number> = {
      plan: 15,
      story: 30,
      concept: 45,
      questions: 65,
      compilation: 80,
      validation: 90,
      review: 100
    };
    job.progress = progressMap[currentStage];
    persistJobs();

    console.log(`[LessonPipeline] [Job: ${jobId}] Running stage: ${currentStage} (${job.progress}%)...`);

    try {
      switch (currentStage) {
        case 'plan':
          job.stageResults.plan = await executeStagePlan(job);
          break;

        case 'story':
          job.stageResults.story = await executeStageStory(job);
          break;

        case 'concept':
          job.stageResults.concept = await executeStageConcept(job);
          break;

        case 'questions':
          job.stageResults.questions = await executeStageQuestions(job);
          break;

        case 'compilation': {
          const compiled = executeStageCompilation(job);
          job.stageResults.compilation = compiled;
          job.lesson = compiled.lesson;
          job.lessonMemory = compiled.lessonMemory;
          break;
        }

        case 'validation': {
          if (!job.lesson) {
            throw new Error("Cannot validate: Lesson was not compiled.");
          }
          const valRes = executeStageValidation(job.lesson, job.requestParams.concept);
          job.stageResults.validation = valRes;
          job.lesson = valRes.normalizedLesson;
          break;
        }

        case 'review': {
          if (!job.lesson || !job.lessonMemory) {
            throw new Error("Cannot review: Lesson data missing.");
          }
          job.stageResults.review = executeStageReview(job.lesson, job.lessonMemory);
          job.status = 'completed';
          job.progress = 100;
          job.updatedAt = new Date().toISOString();
          persistJobs();
          console.log(`[LessonPipeline] [Job: ${jobId}] Finished successfully!`);
          return job;
        }
      }
    } catch (err: any) {
      console.error(`[LessonPipeline] [Job: ${jobId}] Stage "${currentStage}" failed:`, err);
      let errorMsg = err.message || `Failed during ${currentStage} stage.`;
      
      // If error message is serialized JSON from SDK/network, extract friendly text
      if (typeof errorMsg === 'string' && errorMsg.startsWith('{') && errorMsg.includes('"message"')) {
        try {
          const parsed = JSON.parse(errorMsg);
          if (parsed.error?.message) {
            errorMsg = parsed.error.message;
          } else if (parsed.message) {
            errorMsg = parsed.message;
          }
        } catch {
          // keep original
        }
      }

      job.status = 'failed';
      job.failedStage = currentStage;
      job.error = errorMsg;
      job.updatedAt = new Date().toISOString();
      persistJobs();
      return job;
    }
  }

  return job;
}

// Helper APIs for route controllers
export function createGenerationJob(params: any): GenerationJob {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const job: GenerationJob = {
    jobId,
    status: 'running',
    stage: 'plan',
    progress: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    error: null,
    failedStage: null,
    requestParams: params,
    stageResults: {}
  };

  jobsMap.set(jobId, job);
  persistJobs();

  // Run in background
  setTimeout(() => {
    runJobPipeline(jobId).catch(err => {
      console.error(`[LessonPipeline] Unhandled background error in job ${jobId}:`, err);
    });
  }, 50);

  return job;
}

export function getGenerationJob(jobId: string): GenerationJob | null {
  return jobsMap.get(jobId) || null;
}

export function listGenerationJobs(): GenerationJob[] {
  return Array.from(jobsMap.values()).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 20);
}

export function retryJobStage(jobId: string, stageToRetry?: GenerationStage): GenerationJob {
  const job = jobsMap.get(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  const targetStage = stageToRetry || job.failedStage || job.stage;
  job.status = 'running';
  job.error = null;
  job.failedStage = null;
  job.updatedAt = new Date().toISOString();
  persistJobs();

  setTimeout(() => {
    runJobPipeline(jobId, targetStage).catch(err => {
      console.error(`[LessonPipeline] Retry error in job ${jobId}:`, err);
    });
  }, 50);

  return job;
}

export function skipJobStage(jobId: string): GenerationJob {
  const job = jobsMap.get(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  const stages: GenerationStage[] = ['plan', 'story', 'concept', 'questions', 'compilation', 'validation', 'review'];
  const currentIndex = stages.indexOf(job.failedStage || job.stage);
  const nextStage = stages[currentIndex + 1] || 'compilation';

  // Provide dummy fallback for skipped stage if needed
  if (job.stage === 'story' && !job.stageResults.story) {
    job.stageResults.story = {
      type: "content_screen",
      contentScreen: {
        sceneType: "dialogue",
        badge: "🚀 Mission Hook",
        heading: `Exploring ${job.requestParams.concept}`,
        subheading: "A new mission begins!",
        contentBody: "Chikoo: Look at the sensors!\n\nByte: Mission objective updated.",
        highlightBox: "⭐ Stay curious and observe the patterns!",
        bottomMessage: "Tap Continue to begin!"
      }
    };
  } else if (job.stage === 'concept' && !job.stageResults.concept) {
    job.stageResults.concept = {
      type: "content_screen",
      contentScreen: {
        sceneType: "hero",
        badge: "💡 Core Concept",
        heading: job.requestParams.concept,
        subheading: "Key Idea",
        contentBody: `${job.requestParams.concept} helps AI systems process information accurately.`,
        highlightBox: `⭐ Golden Rule: Master ${job.requestParams.concept} to solve real-world problems!`,
        bottomMessage: "Let's test our understanding!"
      }
    };
  }

  job.status = 'running';
  job.error = null;
  job.failedStage = null;
  job.updatedAt = new Date().toISOString();
  persistJobs();

  setTimeout(() => {
    runJobPipeline(jobId, nextStage).catch(err => {
      console.error(`[LessonPipeline] Skip stage error in job ${jobId}:`, err);
    });
  }, 50);

  return job;
}

export function cancelGenerationJob(jobId: string): GenerationJob {
  const job = jobsMap.get(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  job.status = 'cancelled';
  job.error = 'Job was cancelled by administrator.';
  job.updatedAt = new Date().toISOString();
  persistJobs();

  return job;
}
