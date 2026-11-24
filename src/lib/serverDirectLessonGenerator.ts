import { GoogleGenAI } from "@google/genai";
import { Lesson, UnitStoryBible, LessonMemory } from "./curriculumTypes.ts";
import { validateLessonObject, ValidationResult } from "./lessonValidator.ts";

export interface DirectGenerationParams {
  unitId?: string;
  unitTitle: string;
  unitContext?: UnitStoryBible;
  previousLessonMemory?: LessonMemory;
  lessonTitle?: string;
  concept: string;
  objective?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Explorer' | 'Specialist' | 'Commander';
  storyGoal?: string;
  screenCount?: number;
}

export interface DirectGenerationResponse {
  success: boolean;
  lesson: Lesson | null;
  rawJsonText: string;
  validation: ValidationResult;
  repaired: boolean;
  modelUsed: string;
  error?: string;
}

function buildPrompt(params: DirectGenerationParams): string {
  const { 
    unitTitle, 
    unitId = 'unit_1', 
    unitContext, 
    previousLessonMemory, 
    lessonTitle, 
    concept, 
    objective, 
    difficulty = "Medium", 
    storyGoal,
    screenCount = 6 
  } = params;

  const characters = unitContext?.characters && Array.isArray(unitContext.characters) && unitContext.characters.length > 0
    ? unitContext.characters.map((c: any) => `- ${c.name} (${c.role || 'Crew'}): ${c.personality || 'Curious & energetic'}`).join("\n")
    : "- Chikoo (Curious Lead Explorer): Energetic, loves analogies with snacks & everyday objects.\n- Byte (Robotic Navigator): Literal-minded, loves structured data, easily puzzled by messy inputs.\n- Spark (AI Mentor): Calm and encouraging guide.";

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
- Initial lesson of the unit arc. Start directly with the unit premise and characters!
`;

  return `You are the lead curriculum architect & narrative writer for "Chikoo", a gamified STEM & AI learning platform for school students (aged 8-15).

Your task is to generate ONE complete, fully-formed, highly engaging Chikoo lesson JSON for the target concept below.

========================================
UNIT & STORY CONTEXT:
========================================
- Unit: "${unitTitle}" (${unitId})
- Overall Unit Learning Goal: ${learningGoal}
- Story Premise: ${storyPremise}
- Characters in this Unit:
${characters}
${prevContext}

========================================
TARGET LESSON PARAMETERS:
========================================
- Target Concept: "${concept}"
- Pedagogical Objective: "${objective || `Understand and apply ${concept}`}"
- Difficulty Tier: "${difficulty}"
- Custom Story Focus: "${storyGoal || 'Resolve the previous cliffhanger and apply the new concept.'}"
- Target Total Screens: ${screenCount}
${lessonTitle ? `- Requested Lesson Title: "${lessonTitle}"` : ''}

========================================
PEDAGOGICAL & STRUCTURAL RATIO MANDATE:
========================================
You must structure the ${screenCount} screens in this exact progressive learning ratio:

1. SCREEN 1 (Story Hook Scene):
   - type: "content_screen"
   - sceneType: "dialogue"
   - heading: Catchy title with emoji (e.g. "🚀 The Mystery of Noisy Sensors")
   - subheading: 1-line situation setting the stage
   - contentBody: 2-3 lively dialogue blocks separated by double newlines between Chikoo, Byte, or other characters (e.g. "Chikoo: Look at the sensors!\n\nByte: Alert! Sensor variance detected.").
   - highlightBox: A punchy clue or curious observation by Chikoo/Byte.
   - bottomMessage: "Tap Continue to investigate!"

2. SCREEN 2 (Core Concept & Everyday Twin Analogy):
   - type: "content_screen"
   - sceneType: "hero"
   - heading: "${concept}"
   - subheading: "The Everyday Twin"
   - contentBody: Under 60 words. Compare the concept directly to a vivid everyday analogy (e.g., sorting laundry, recipe ingredients, flashlight beam, training a puppy, grocery checkout). Zero heavy jargon!
   - highlightBox: "⭐ Golden Rule: [One memorable 1-line rule to remember]"
   - bottomMessage: "Let's put this into action!"

3. SCREENS 3 TO ${screenCount} (Active Interactive Mastery Challenges):
   - Must use standard Chikoo challenge types:
     * "c1_multiple_choice" or "tap_right_answer": 4 distinct options, exactly 1 matching correctAnswer.
     * "c9_true_false": question with correctAnswer as "True" or "False".
     * "c4_concept_matcher" or "match_pairs": 2-4 pairs of { "left": "...", "right": "..." }.
     * "c5_bucket_sort": 2 buckets and 3-4 items with "correct_bucket".
     * "c2_fill_in_blank": question containing "[BLANK]" with 4 options and 1 correctAnswer.
     * "c16_eliminate_wrong": question with 4 options ({ "text": "...", "isCorrect": true/false }).
   - Every challenge must include an encouraging "explanation" starting with "Chikoo says: ...".
   - Unique challenge IDs like "l_screen_1", "l_screen_2", etc.

========================================
REQUIRED OUTPUT JSON FORMAT:
========================================
Return ONLY valid JSON matching this exact schema:
{
  "id": "l_${concept.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 16)}",
  "title": "🚀 Catchy Lesson Title with Emoji",
  "description": "2-sentence engaging lesson summary and learning objective.",
  "category": "${concept}",
  "difficulty": "${difficulty}",
  "xpReward": 120,
  "challenges": [
    {
      "id": "l_s1",
      "type": "content_screen",
      "question": "Mission Briefing",
      "xpValue": 15,
      "contentScreen": {
        "sceneType": "dialogue",
        "badge": "🚀 Mission Log",
        "heading": "Heading with Emoji",
        "subheading": "1-line situation",
        "contentBody": "Chikoo: ...\\n\\nByte: ...",
        "highlightBox": "💡 Chikoo's Clue: ...",
        "bottomMessage": "Tap Continue to investigate!"
      },
      "explanation": "Chikoo says: Mission started!"
    },
    {
      "id": "l_s2",
      "type": "content_screen",
      "question": "${concept}",
      "xpValue": 20,
      "contentScreen": {
        "sceneType": "hero",
        "badge": "💡 Core Concept",
        "heading": "${concept}",
        "subheading": "The Everyday Analogy",
        "contentBody": "Crisp everyday twin comparison under 60 words.",
        "highlightBox": "⭐ Golden Rule: One memorable rule.",
        "bottomMessage": "Let's test our understanding!"
      },
      "explanation": "Chikoo says: Core concept unlocked!"
    },
    {
      "id": "l_s3",
      "type": "c9_true_false",
      "question": "Basic concept grasp statement?",
      "options": ["True", "False"],
      "correctAnswer": "True",
      "xpValue": 20,
      "explanation": "Chikoo says: Exactly right!"
    },
    {
      "id": "l_s4",
      "type": "c4_concept_matcher",
      "question": "Match each term to its everyday example:",
      "pairs": [
        { "left": "Term A", "right": "Analogy A" },
        { "left": "Term B", "right": "Analogy B" },
        { "left": "Term C", "right": "Analogy C" }
      ],
      "xpValue": 25,
      "explanation": "Chikoo says: Perfect pairs!"
    },
    {
      "id": "l_s5",
      "type": "c1_multiple_choice",
      "question": "Real-world transfer scenario question?",
      "options": ["Correct practical answer", "Plausible distractor 1", "Plausible distractor 2", "Plausible distractor 3"],
      "correctAnswer": "Correct practical answer",
      "xpValue": 20,
      "explanation": "Chikoo says: Spot-on application!"
    },
    {
      "id": "l_s6",
      "type": "c1_multiple_choice",
      "question": "Mastery puzzle check question?",
      "options": ["Correct solution", "Mistake option A", "Mistake option B", "Mistake option C"],
      "correctAnswer": "Correct solution",
      "xpValue": 25,
      "explanation": "Chikoo says: Mission accomplished! You mastered ${concept}!"
    }
  ]
}`;
}

/**
 * Executes a single AI generation with Gemini and performs automatic 1-step repair if invalid.
 */
export async function generateDirectChikooLesson(params: DirectGenerationParams): Promise<DirectGenerationResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  const modelUsed = "gemini-3.7-flash";
  const initialPrompt = buildPrompt(params);

  let rawJsonText = "{}";
  let parsedObject: any = null;

  // Step 1: Initial Single Generation Call
  try {
    const response = await ai.models.generateContent({
      model: modelUsed,
      contents: initialPrompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    rawJsonText = (response.text || "").trim();
    // Strip markdown formatting if any
    const cleaned = rawJsonText.replace(/```json/gi, '').replace(/```/g, '').trim();
    parsedObject = JSON.parse(cleaned);
  } catch (err: any) {
    console.error("[DirectLessonGenerator] Initial Gemini call failed:", err);
    return {
      success: false,
      lesson: null,
      rawJsonText,
      validation: {
        isValid: false,
        issues: [err.message || "Failed to generate lesson from AI model."],
        warnings: [],
        stats: { screenCount: 0, storyScreens: 0, interactiveScreens: 0, typesPresent: [], totalXp: 0 }
      },
      repaired: false,
      modelUsed,
      error: err.message || "AI generation failed."
    };
  }

  // Step 2: Validation
  let validationResult = validateLessonObject(parsedObject);

  // If valid on first attempt, return immediately
  if (validationResult.isValid && validationResult.normalizedLesson) {
    return {
      success: true,
      lesson: validationResult.normalizedLesson,
      rawJsonText: JSON.stringify(validationResult.normalizedLesson, null, 2),
      validation: validationResult,
      repaired: false,
      modelUsed
    };
  }

  // Step 3: Auto-Repair Attempt (EXACTLY ONE Repair Request)
  console.warn("[DirectLessonGenerator] Initial lesson had validation issues, attempting auto-repair:", validationResult.issues);

  const repairPrompt = `You are the Chikoo Curriculum QA repair engine.
The following generated lesson JSON has schema and validation issues that must be fixed immediately.

VALIDATION ISSUES FOUND:
${validationResult.issues.map(iss => `- ${iss}`).join("\n")}

ORIGINAL ATTEMPT:
${JSON.stringify(parsedObject, null, 2)}

INSTRUCTIONS:
1. Fix all validation issues listed above.
2. Ensure "challenges" is an array of valid screen objects.
3. Ensure every question screen has options and matching correctAnswer.
4. Ensure every "content_screen" has "contentScreen" with heading and contentBody.
5. Return ONLY the corrected, pristine, valid JSON.`;

  try {
    const repairResponse = await ai.models.generateContent({
      model: modelUsed,
      contents: repairPrompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const repairedRaw = (repairResponse.text || "").trim();
    const cleanedRepair = repairedRaw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const repairedParsed = JSON.parse(cleanedRepair);
    const secondValidation = validateLessonObject(repairedParsed);

    if (secondValidation.isValid && secondValidation.normalizedLesson) {
      console.log("[DirectLessonGenerator] Auto-repair succeeded!");
      return {
        success: true,
        lesson: secondValidation.normalizedLesson,
        rawJsonText: JSON.stringify(secondValidation.normalizedLesson, null, 2),
        validation: secondValidation,
        repaired: true,
        modelUsed
      };
    } else {
      console.warn("[DirectLessonGenerator] Auto-repair still had validation issues:", secondValidation.issues);
      return {
        success: false,
        lesson: secondValidation.normalizedLesson || null,
        rawJsonText: JSON.stringify(repairedParsed, null, 2),
        validation: secondValidation,
        repaired: true,
        modelUsed,
        error: `Validation failed after repair: ${secondValidation.issues.join(", ")}`
      };
    }
  } catch (repairErr: any) {
    console.error("[DirectLessonGenerator] Auto-repair failed:", repairErr);
    return {
      success: false,
      lesson: validationResult.normalizedLesson || null,
      rawJsonText: JSON.stringify(parsedObject, null, 2),
      validation: validationResult,
      repaired: false,
      modelUsed,
      error: `Initial generation was invalid and auto-repair encountered an error: ${repairErr.message}`
    };
  }
}
