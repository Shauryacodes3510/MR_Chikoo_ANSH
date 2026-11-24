import { AI_CURRICULUM, PRACTICE_CURRICULUM } from './content';
import { Module, Lesson } from './curriculumTypes';
import { supabase } from './supabase';
import { getChallengePacks, mapChallengePackToLesson, getPuzzlePacks, ensureUuid } from './practiceStoreNew';
import { getFifteenPremiumChallenges } from './premiumChallengesGenerator';

/**
 * Fetches lesson content by ID from memory cache or Supabase database.
 */
export async function fetchLessonContentById(
  lessonId: string,
  options?: { requestUuid?: string; startTimeMs?: number }
): Promise<Lesson> {
  const reqUuid = options?.requestUuid || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const startMs = options?.startTimeMs || performance.now();
  const startIso = new Date().toISOString();
  const cleanId = lessonId.toLowerCase().trim();

  console.log(`[SupabaseLoader][${reqUuid}] 🔍 START fetchLessonContentById for ID="${lessonId}" (clean="${cleanId}") at ${startIso}`);

  // 1. Search in AI_CURRICULUM and PRACTICE_CURRICULUM
  for (const mod of [...AI_CURRICULUM, ...PRACTICE_CURRICULUM]) {
    const found = mod.lessons?.find((l: any) => l && l.id && (l.id.toLowerCase() === cleanId || ensureUuid(l.id) === ensureUuid(cleanId)));
    if (found) {
      const endMs = performance.now();
      const endIso = new Date().toISOString();
      const durationMs = Math.round(endMs - startMs);
      console.log(`[SupabaseLoader][${reqUuid}] ✅ Memory Curriculum Cache Match (Module="${mod.title}") at ${endIso} (${durationMs}ms)`, {
        requestUuid: reqUuid,
        targetLessonId: lessonId,
        returnedLessonId: found.id,
        idMatch: found.id.toLowerCase() === cleanId || ensureUuid(found.id) === ensureUuid(cleanId),
        title: found.title,
        screenCount: found.challenges?.length || 0,
        screenContentValid: (found.challenges?.length || 0) > 0,
        screenTypes: found.challenges?.map((c: any) => c.type || 'unknown') || []
      });
      return found;
    }
  }

  // 2. Search in Challenge Packs (Adventure Journey Map)
  try {
    const chalPacks = getChallengePacks();
    const foundPack = chalPacks.find(p => p && (
      p.id === lessonId || 
      ensureUuid(p.id) === ensureUuid(cleanId) || 
      cleanId.includes(p.id.toLowerCase()) || 
      p.id.toLowerCase().includes(cleanId)
    ));
    if (foundPack) {
      const endMs = performance.now();
      const endIso = new Date().toISOString();
      const durationMs = Math.round(endMs - startMs);
      const mapped = mapChallengePackToLesson(
        foundPack, 
        lessonId, 
        foundPack.topic || 'AI Adventure Challenge',
        foundPack.description
      );
      console.log(`[SupabaseLoader][${reqUuid}] ✅ Challenge Pack Match (Topic="${foundPack.topic}") at ${endIso} (${durationMs}ms)`, {
        requestUuid: reqUuid,
        targetLessonId: lessonId,
        returnedLessonId: mapped.id,
        title: mapped.title,
        screenCount: mapped.challenges?.length || 0,
        screenContentValid: (mapped.challenges?.length || 0) > 0
      });
      return mapped;
    }
  } catch (e) {
    console.warn(`[SupabaseLoader][${reqUuid}] ⚠️ Challenge packs lookup error:`, e);
  }

  // 3. Search in dynamic customLessonsArray on window
  if (typeof window !== 'undefined' && (window as any).customLessonsArray) {
    const found = (window as any).customLessonsArray.find((l: any) => l && l.id && (l.id.toLowerCase() === cleanId || ensureUuid(l.id) === ensureUuid(cleanId)));
    if (found) {
      const endMs = performance.now();
      const endIso = new Date().toISOString();
      console.log(`[SupabaseLoader][${reqUuid}] ✅ Window customLessonsArray Match at ${endIso} (${Math.round(endMs - startMs)}ms)`, {
        requestUuid: reqUuid,
        returnedLessonId: found.id,
        title: found.title
      });
      return found;
    }
  }

  // 4. Try fetching from backend /api/database/lessons/:id or Supabase database
  const apiStartMs = performance.now();
  const apiStartIso = new Date().toISOString();
  try {
    console.log(`[SupabaseLoader][${reqUuid}] 📡 Requesting API endpoint: /api/database/lessons/${encodeURIComponent(cleanId)} at ${apiStartIso}`);
    const apiRes = await fetch(`/api/database/lessons/${encodeURIComponent(cleanId)}`);
    const apiEndMs = performance.now();
    const apiEndIso = new Date().toISOString();
    const apiDurationMs = Math.round(apiEndMs - apiStartMs);

    console.log(`[SupabaseLoader][${reqUuid}] 📥 API Response Received at ${apiEndIso} (HTTP Status: ${apiRes.status}, Latency: ${apiDurationMs}ms)`);

    if (apiRes.ok) {
      const json = await apiRes.json();
      if (json && json.success && json.lesson) {
        const data = json.lesson;
        const resultLesson: Lesson = {
          id: data.id,
          moduleId: data.module_id,
          title: data.title,
          description: data.description || '',
          difficulty: data.difficulty || 'Easy',
          xpReward: data.xp_reward ?? 100,
          challenges: data.challenges || [],
          orderIndex: data.order_index ?? 0,
          isChallenge: data.is_challenge || false,
          isBonus: data.is_bonus || false
        };

        const idMatch = resultLesson.id.toLowerCase() === cleanId || ensureUuid(resultLesson.id) === ensureUuid(cleanId);
        const screenCount = resultLesson.challenges.length;

        console.log(`[SupabaseLoader][${reqUuid}] 📊 API RESPONSE VALIDATION RESULTS:`, {
          requestUuid: reqUuid,
          targetLessonId: lessonId,
          returnedLessonId: resultLesson.id,
          idMatch,
          title: resultLesson.title,
          titleValid: !!resultLesson.title && resultLesson.title.trim().length > 0,
          screenCount,
          screenContentValid: screenCount > 0,
          screenTypes: resultLesson.challenges.map(c => c.type || 'unknown'),
          source: 'API /api/database/lessons',
          apiDurationMs
        });

        return resultLesson;
      } else {
        console.warn(`[SupabaseLoader][${reqUuid}] ⚠️ API returned success=false or missing lesson object:`, json);
      }
    } else {
      console.warn(`[SupabaseLoader][${reqUuid}] ⚠️ API endpoint returned non-200 status code: ${apiRes.status}`);
    }
  } catch (apiErr) {
    console.warn(`[SupabaseLoader][${reqUuid}] ⚠️ API request exception:`, apiErr);
  }

  // 5. Direct Supabase Query Cycle
  const sbStartMs = performance.now();
  const sbStartIso = new Date().toISOString();
  console.log(`[SupabaseLoader][${reqUuid}] ⚡ Executing Supabase query on table "lessons": .eq("id", "${lessonId}") at ${sbStartIso}`);

  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .maybeSingle();

    const sbEndMs = performance.now();
    const sbEndIso = new Date().toISOString();
    const sbDurationMs = Math.round(sbEndMs - sbStartMs);

    console.log(`[SupabaseLoader][${reqUuid}] 📥 Supabase Query Completed at ${sbEndIso} (Latency: ${sbDurationMs}ms, Error: ${error ? error.message : 'none'})`);

    if (error) {
      console.error(`[SupabaseLoader][${reqUuid}] ❌ Supabase Query Error:`, error);
    } else if (data) {
      const resultLesson: Lesson = {
        id: data.id,
        moduleId: data.module_id,
        title: data.title,
        description: data.description || '',
        difficulty: data.difficulty || 'Easy',
        xpReward: data.xp_reward ?? 100,
        challenges: data.challenges || [],
        orderIndex: data.order_index ?? 0,
        isChallenge: data.is_challenge || false,
        isBonus: data.is_bonus || false
      };

      const idMatch = resultLesson.id.toLowerCase() === cleanId || ensureUuid(resultLesson.id) === ensureUuid(cleanId);
      const screenCount = resultLesson.challenges.length;

      console.log(`[SupabaseLoader][${reqUuid}] 📊 SUPABASE RESPONSE VALIDATION RESULTS:`, {
        requestUuid: reqUuid,
        targetLessonId: lessonId,
        returnedLessonId: resultLesson.id,
        idMatch,
        title: resultLesson.title,
        titleValid: !!resultLesson.title && resultLesson.title.trim().length > 0,
        screenCount,
        screenContentValid: screenCount > 0,
        screenTypes: resultLesson.challenges.map(c => c.type || 'unknown'),
        source: 'Supabase Table "lessons"',
        sbDurationMs
      });

      return resultLesson;
    } else {
      console.warn(`[SupabaseLoader][${reqUuid}] ⚠️ Supabase returned no data record (null) for eq("id", "${lessonId}")`);
    }
  } catch (err) {
    console.error(`[SupabaseLoader][${reqUuid}] ❌ Supabase Exception during query:`, err);
  }

  // 6. Guaranteed Fallback Generation
  const totalDurationMs = Math.round(performance.now() - startMs);
  const cleanTitle = lessonId.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  console.warn(`[SupabaseLoader][${reqUuid}] ⚠️ No database record found. Generating dynamic fallback challenges after ${totalDurationMs}ms for title="${cleanTitle}".`);

  const fallbackLesson: Lesson = {
    id: lessonId,
    title: cleanTitle || 'AI Journey Stage',
    description: 'Explore, observe, and master key concepts with Chikoo.',
    difficulty: 'Easy',
    xpReward: 50,
    challenges: getFifteenPremiumChallenges(lessonId, cleanTitle)
  };

  console.log(`[SupabaseLoader][${reqUuid}] 📊 FALLBACK LESSON VALIDATION RESULTS:`, {
    requestUuid: reqUuid,
    targetLessonId: lessonId,
    returnedLessonId: fallbackLesson.id,
    idMatch: true,
    title: fallbackLesson.title,
    titleValid: true,
    screenCount: fallbackLesson.challenges.length,
    screenContentValid: fallbackLesson.challenges.length > 0,
    screenTypes: fallbackLesson.challenges.map(c => c.type || 'unknown'),
    source: 'Dynamic Generator'
  });

  return fallbackLesson;
}

import { buildCurriculumFromRaw } from './content';

/**
 * Fetches the production curriculum from the server API (with full service-role privileges)
 * or falls back to direct Supabase.
 */
export async function fetchProductionCurriculum(): Promise<{ aiModules: Module[], practiceModules: Module[] }> {
  try {
    let modulesData: any[] = [];
    let lessonsData: any[] = [];

    // 1. First attempt: Server-side curriculum endpoint with service-role permissions
    try {
      const apiRes = await fetch('/api/database/curriculum');
      if (apiRes.ok) {
        const json = await apiRes.json();
        if (json && json.success && Array.isArray(json.modules) && json.modules.length > 0) {
          modulesData = json.modules;
          lessonsData = Array.isArray(json.lessons) ? json.lessons : [];
        }
      }
    } catch (apiErr) {
      console.warn('[fetchProductionCurriculum] /api/database/curriculum fetch failed, trying direct Supabase:', apiErr);
    }

    // 2. Direct Supabase fallback if API wasn't available
    if (modulesData.length === 0) {
      const { data: worlds, error: worldError } = await supabase
        .from('worlds')
        .select('*, modules(*, lessons(*))')
        .order('world_number');

      if (worldError) throw worldError;
      if (!worlds) throw new Error('Curriculum fetch returned no data');

      modulesData = worlds.flatMap((w: any) => w.modules || []);
      lessonsData = modulesData.flatMap((m: any) => m.lessons || []);
    }

    // Transform and map to Module structure with their assigned lessons
    const { aiModules, pracModules } = buildCurriculumFromRaw(modulesData, lessonsData);

    // Update the runtime curriculum variables
    AI_CURRICULUM.splice(0, AI_CURRICULUM.length, ...aiModules);
    PRACTICE_CURRICULUM.splice(0, PRACTICE_CURRICULUM.length, ...pracModules);

    return { aiModules, practiceModules: pracModules };
  } catch (error) {
    console.error('CRITICAL: Failed to load production curriculum:', error);
    throw error;
  }
}

import { Chapter, MCQ, Flashcard } from './curriculumTypes';

/**
 * Resolves a lesson dynamically from the Junior Explorer curriculum and transforms it into Chapter structure.
 */
export function getChapter(chapterId: string): Chapter | undefined {
  const cleanId = chapterId.toLowerCase().trim();
  
  let foundLesson = AI_CURRICULUM.flatMap(m => m.lessons).find(l => l.id.toLowerCase() === cleanId);

  if (foundLesson) {
    // Cast and map details securely
    const mcqs: MCQ[] = (foundLesson.challenges || []).map(c => ({
      id: c.id,
      question: c.question,
      options: c.options || [],
      correctAnswer: c.correctAnswer || '',
      explanation: typeof c.explanation === 'object' && c.explanation !== null ? (c.explanation as any).text || '' : String(c.explanation || '')
    }));

    return {
      id: foundLesson.id,
      title: foundLesson.title,
      description: foundLesson.description,
      lessonContent: foundLesson.description, // Use safe description or simple content
      keyPoints: [
        "Learn through natural curiosity wonders.",
        "Observe everyday analogies and metaphors.",
        "Solve interactive puzzle and speed challenges."
      ],
      summary: foundLesson.description,
      examples: [
        "Everyday nature and cosmic observations.",
        "Relatable physical structures and movements."
      ],
      practicalActivities: [
        {
          title: "🔍 Outdoor Nature Scout",
          protocol: "Look around your school yard or window. Record 2 natural patterns that adapt to their surroundings."
        }
      ],
      flashcards: [
        { front: "What drives natural curiosity?", back: "Asking simple humbler questions about the world around us." },
        { front: "How can we study science?", back: "By using everyday toys, recipes, or maps as relatable models." }
      ],
      mcqs,
      estimatedTime: "10 min",
      difficulty: foundLesson.difficulty as 'Easy' | 'Medium' | 'Hard',
      imageMetadata: {
        illustrationUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop",
        imageStyle: "Illustration",
        prompts: {
          educational: "Diagram representing space or nature",
          illustration: "Charming explorer vector art",
          infographic: "Process timeline diagram",
          scenario: "Everyday life explorer panel"
        }
      }
    };
  }

  // Fallback defaults
  throw new Error(`Lesson not found: ${chapterId}`);
}

export function getQuiz(chapterId: string): MCQ[] {
  const chapter = getChapter(chapterId);
  return chapter ? chapter.mcqs : [];
}

export function getFlashcards(chapterId: string): Flashcard[] {
  const chapter = getChapter(chapterId);
  return chapter ? chapter.flashcards : [];
}

export function getSummary(chapterId: string): { title: string; summary: string; keyPoints: string[] } | undefined {
  const chapter = getChapter(chapterId);
  if (!chapter) return undefined;
  return {
    title: chapter.title,
    summary: chapter.summary,
    keyPoints: chapter.keyPoints
  };
}
