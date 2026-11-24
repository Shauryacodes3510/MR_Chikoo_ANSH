import { Module, Lesson, Challenge, ChallengeType } from './curriculumTypes';
import { getChallengePacks, getPuzzlePacks, ChallengePack, PuzzlePack, ensureUuid } from './practiceStoreNew';
import { 
  supabase, 
  isSupabaseConfigured, 
  getCustomModules, 
  getCustomLessons, 
  getCustomCurriculum,
  saveCustomModule, 
  batchUpdateModules,
  saveCustomLesson, 
  deleteCustomModule, 
  deleteCustomLesson 
} from './supabase';

export type { Module, Lesson, Challenge, ChallengeType };
export { 
  isInteractiveChallenge, 
  isStoryChallenge, 
  isInteractiveScreen, 
  isStoryScreen, 
  shouldUseCloudTransition, 
  PURE_READING_CHALLENGE_TYPES, 
  STORY_CHALLENGE_TYPES,
  INTERACTIVE_CHALLENGE_TYPES 
} from './curriculumTypes';
export function buildCurriculumFromRaw(rawModules: any[], rawLessons: any[]): { aiModules: Module[]; pracModules: Module[] } {
  const structuredAiModules: Module[] = [];
  const structuredPracModules: Module[] = [];
  const sortedModules = [...rawModules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  for (let index = 0; index < sortedModules.length; index++) {
    const dbMod = sortedModules[index];
    let difficulty = dbMod.description || 'Beginner';
    let orderedLessonIds: string[] = [];
    let metadata = (dbMod as any).metadata || null;

    let descText = dbMod.description || '';
    if (descText.includes('|metadata:')) {
      const parts = descText.split('|metadata:');
      descText = parts[0] || '';
      if (!metadata && parts[1]) {
        try {
          metadata = JSON.parse(parts[1]);
        } catch (e) {
          console.warn("Error parsing metadata from description split:", e);
        }
      }
    }

    if (descText.includes('|lessons:')) {
      const parts = descText.split('|lessons:');
      difficulty = parts[0] || 'Beginner';
      if (parts[1]) {
        orderedLessonIds = parts[1].split(',').filter(Boolean);
      }
    } else {
      difficulty = descText || 'Beginner';
    }

    let matchedLessons = rawLessons
      .filter((l: any) => l.module_id === dbMod.id)
      .map((l: any) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        difficulty: l.difficulty || 'Easy',
        xpReward: Number(l.xp_reward ?? 100),
        challenges: Array.isArray(l.challenges) ? l.challenges : [],
        order_index: l.order_index ?? 0
      }));

    if (matchedLessons.length === 0) {
      // Do NOT load fallback or seed lessons. Lessons must ONLY load from the real database-backed curriculum.
      matchedLessons = [];
    }

    matchedLessons.sort((a, b) => {
      if (orderedLessonIds.length > 0) {
        const idxA = orderedLessonIds.indexOf(a.id);
        const idxB = orderedLessonIds.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) {
          return idxA - idxB;
        }
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
      }
      if ((a.order_index ?? 0) !== (b.order_index ?? 0)) {
        return (a.order_index ?? 0) - (b.order_index ?? 0);
      }
      return (a.id || '').localeCompare(b.id || '', undefined, { numeric: true });
    });

    const matchedModModule: Module = {
      id: dbMod.id,
      sort_order: dbMod.sort_order ?? dbMod.order ?? 0,
      title: dbMod.title,
      difficulty: difficulty,
      world_id: dbMod.world_id || null,
      lessons: matchedLessons,
      metadata: metadata
    };

    if (dbMod.is_practice) {
      structuredPracModules.push(matchedModModule);
    } else {
      structuredAiModules.push(matchedModModule);
    }
  }

  return { aiModules: structuredAiModules, pracModules: structuredPracModules };
}

// Absolutely no hard-coded fallback or seed modules for production.
const SEED_AI_MODULES: Module[] = [];
const SEED_PRAC_MODULES: Module[] = [];

const DEFAULT_PRACTICE_CURRICULUM: Module[] = [];
const DEFAULT_AI_CURRICULUM: Module[] = [];

export const PRACTICE_CURRICULUM: Module[] = [];
export const AI_CURRICULUM: Module[] = [];

export function initCurriculumFromStorage() {
  if (typeof window === 'undefined') return;
  try {
    const cachedAi = localStorage.getItem('CHIKOO_AI_CURRICULUM');
    const cachedPrac = localStorage.getItem('CHIKOO_PRACTICE_CURRICULUM');
    if (cachedAi) {
      const parsedAi = JSON.parse(cachedAi);
      if (Array.isArray(parsedAi) && parsedAi.length > 0) {
        parsedAi.forEach((m: any) => {
          if (Array.isArray(m.lessons)) {
            m.lessons.sort((a: any, b: any) => {
              if (a.order_index !== undefined && b.order_index !== undefined && a.order_index !== b.order_index) {
                return a.order_index - b.order_index;
              }
              return (a.id || '').localeCompare(b.id || '', undefined, { numeric: true });
            });
            m.lessons.forEach((l: any) => {
              if (Array.isArray(l.challenges) && l.challenges.some((c: any) => c.id?.startsWith('pc_'))) {
                l.challenges = [];
              }
            });
          }
        });
        parsedAi.sort((a: any, b: any) => (a.sort_order ?? a.order ?? 0) - (b.sort_order ?? b.order ?? 0));
        AI_CURRICULUM.splice(0, AI_CURRICULUM.length, ...parsedAi);
      }
    }
    if (cachedPrac) {
      const parsedPrac = JSON.parse(cachedPrac);
      if (Array.isArray(parsedPrac) && parsedPrac.length > 0) {
        parsedPrac.forEach((m: any) => {
          if (Array.isArray(m.lessons)) {
            m.lessons.forEach((l: any) => {
              if (Array.isArray(l.challenges) && l.challenges.some((c: any) => c.id?.startsWith('pc_'))) {
                l.challenges = [];
              }
            });
          }
        });
        PRACTICE_CURRICULUM.splice(0, PRACTICE_CURRICULUM.length, ...parsedPrac);
      }
    }
  } catch (e) {
    console.warn("Failed to load initial curriculum from cache:", e);
  }
}

export async function saveSingleLesson(moduleId: string, lesson: Lesson): Promise<Lesson> {
  // Convert to Supabase format
  const supabasePayload = {
    id: lesson.id,
    module_id: moduleId,
    title: lesson.title || 'Untitled Lesson',
    description: lesson.description || '',
    difficulty: (lesson.difficulty as any) || 'Easy',
    xp_reward: Number(lesson.xpReward ?? 100),
    challenges: Array.isArray(lesson.challenges) ? lesson.challenges : [],
    order_index: (lesson as any).order_index ?? 0
  };

  // 1. Save to Supabase (Source of truth) and get authoritative returned row
  const savedRow = await saveCustomLesson(supabasePayload);

  // 2. Map back to Lesson domain structure
  const updatedLesson: Lesson = {
    ...lesson,
    id: savedRow.id,
    title: savedRow.title,
    description: savedRow.description,
    difficulty: savedRow.difficulty as any,
    xpReward: Number(savedRow.xp_reward ?? 100),
    challenges: Array.isArray(savedRow.challenges) ? savedRow.challenges : []
  };

  // 3. Update in-memory curriculum arrays reactively
  let found = false;
  for (const m of AI_CURRICULUM) {
    if (m.id === moduleId) {
      const idx = m.lessons.findIndex(l => l.id === updatedLesson.id);
      if (idx !== -1) {
        m.lessons[idx] = updatedLesson;
      } else {
        m.lessons.push(updatedLesson);
      }
      found = true;
      break;
    }
  }
  if (!found) {
    for (const m of PRACTICE_CURRICULUM) {
      if (m.id === moduleId) {
        const idx = m.lessons.findIndex(l => l.id === updatedLesson.id);
        if (idx !== -1) {
          m.lessons[idx] = updatedLesson;
        } else {
          m.lessons.push(updatedLesson);
        }
        break;
      }
    }
  }

  // 4. Update localStorage caches and broadcast event
  if (typeof window !== 'undefined') {
    localStorage.setItem('CHIKOO_AI_CURRICULUM', JSON.stringify(AI_CURRICULUM));
    localStorage.setItem('CHIKOO_PRACTICE_CURRICULUM', JSON.stringify(PRACTICE_CURRICULUM));
    window.dispatchEvent(new Event('curriculumChanged'));
  }

  return updatedLesson;
}

export function saveCurriculumToStorage(newAi: Module[], newPrac: Module[]) {
  // Guarantee consistent sort_order and order integers on all modules matching their sequence index
  newAi.forEach((m, idx) => {
    m.sort_order = idx;
    (m as any).order = idx;
  });
  newPrac.forEach((m, idx) => {
    m.sort_order = idx;
    (m as any).order = idx;
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem('CHIKOO_AI_CURRICULUM', JSON.stringify(newAi));
    localStorage.setItem('CHIKOO_PRACTICE_CURRICULUM', JSON.stringify(newPrac));
  }
  AI_CURRICULUM.splice(0, AI_CURRICULUM.length, ...newAi);
  PRACTICE_CURRICULUM.splice(0, PRACTICE_CURRICULUM.length, ...newPrac);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('curriculumChanged'));
  }

  // Always sync updated module ordering to backend & database in background
  const allModulesPayload = [
    ...newAi.map((m, idx) => ({
      id: m.id,
      title: m.title,
      description: `${m.difficulty || ''}|lessons:${m.lessons.map(l => l.id).join(',')}`,
      icon: 'Layers',
      order: idx,
      sort_order: idx,
      is_practice: false,
      world_id: m.world_id || null,
      metadata: m.metadata || null
    })),
    ...newPrac.map((m, idx) => ({
      id: m.id,
      title: m.title,
      description: `${m.difficulty || ''}|lessons:${m.lessons.map(l => l.id).join(',')}`,
      icon: 'Layers',
      order: newAi.length + idx,
      sort_order: newAi.length + idx,
      is_practice: true,
      world_id: m.world_id || null,
      metadata: m.metadata || null
    }))
  ];
  batchUpdateModules(allModulesPayload as any).catch(err => {
    console.warn("[Curriculum Storage] Background batch update modules warning:", err);
  });

  // Sync individual lessons if live connection exists
  if (isSupabaseConfigured && supabase) {
    (async () => {
      try {
        const currentModIds = new Set<string>();
        const currentLesIds = new Set<string>();

        let order = 0;
        // 1. Process regular curriculum
        for (const m of newAi) {
          currentModIds.add(m.id);
          const lessonIdsOrder = m.lessons.map(l => l.id).join(',');
          await saveCustomModule({
            id: m.id,
            title: m.title,
            description: `${m.difficulty || ''}|lessons:${lessonIdsOrder}`,
            icon: 'Layers',
            order: order++,
            is_practice: false,
            world_id: m.world_id || null,
            metadata: m.metadata || null
          });

          let lessonOrder = 0;
          for (const l of m.lessons) {
            currentLesIds.add(l.id);
            await saveCustomLesson({
              id: l.id,
              module_id: m.id,
              title: l.title,
              description: l.description,
              difficulty: l.difficulty,
              xp_reward: l.xpReward,
              challenges: l.challenges,
              order_index: lessonOrder++
            });
          }
        }

        // 2. Process practice curriculum
        for (const m of newPrac) {
          currentModIds.add(m.id);
          const lessonIdsOrder = m.lessons.map(l => l.id).join(',');
          await saveCustomModule({
            id: m.id,
            title: m.title,
            description: `${m.difficulty || ''}|lessons:${lessonIdsOrder}`,
            icon: 'Layers',
            order: order++,
            is_practice: true,
            metadata: m.metadata || null
          });

          let pracLessonOrder = 0;
          for (const l of m.lessons) {
            currentLesIds.add(l.id);
            await saveCustomLesson({
              id: l.id,
              module_id: m.id,
              title: l.title,
              description: l.description,
              difficulty: l.difficulty,
              xp_reward: l.xpReward,
              challenges: l.challenges,
              order_index: pracLessonOrder++
            });
          }
        }

        // 3. Clean up deleted units (lessons first, then modules due to foreign key constraints)
        const dbLes = await getCustomLessons();
        for (const l of dbLes) {
          if (!currentLesIds.has(l.id)) {
            await deleteCustomLesson(l.id);
          }
        }

        const dbMods = await getCustomModules();
        for (const m of dbMods) {
          if (!currentModIds.has(m.id)) {
            await deleteCustomModule(m.id);
          }
        }
      } catch (err) {
        console.error("Database curriculum save exception:", err);
      }
    })();
  }
}

export let curriculumLoadError: any = null;

let inFlightCurriculumSync: Promise<boolean> | null = null;

/**
 * Downloads and populates custom modules & lessons from the database or server API with in-flight deduplication.
 */
export async function syncCurriculumFromDatabase(forceFresh = false): Promise<boolean> {
  if (inFlightCurriculumSync) {
    return inFlightCurriculumSync;
  }
  inFlightCurriculumSync = (async () => {
    try {
      const { modules: dbModules, lessons: dbLessons } = await getCustomCurriculum(forceFresh);

      if (!dbModules || dbModules.length === 0) {
        throw new Error("No curriculum modules returned from the database. Lessons must ONLY load from the real database-backed curriculum.");
      }

      const { aiModules: structuredAiModules, pracModules: structuredPracModules } = buildCurriculumFromRaw(dbModules, dbLessons);

      const totalLessonsCount = structuredAiModules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
      
      if (totalLessonsCount === 0) {
        throw new Error("No database-backed curriculum lessons found.");
      }

      // Succeeded! Reset error.
      curriculumLoadError = null;

      // Write locally as cache, splicing arrays reactively
      if (typeof window !== 'undefined') {
        localStorage.setItem('CHIKOO_AI_CURRICULUM', JSON.stringify(structuredAiModules));
        localStorage.setItem('CHIKOO_PRACTICE_CURRICULUM', JSON.stringify(structuredPracModules));
      }
      AI_CURRICULUM.splice(0, AI_CURRICULUM.length, ...structuredAiModules);
      PRACTICE_CURRICULUM.splice(0, PRACTICE_CURRICULUM.length, ...structuredPracModules);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('curriculumChanged'));
      }
      return true;
    } catch (err: any) {
      console.error("❌ Real curriculum load error occurred:", err);
      curriculumLoadError = err;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('curriculumChanged'));
        window.dispatchEvent(new Event('curriculumError'));
      }
      throw err;
    } finally {
      inFlightCurriculumSync = null;
    }
  })();
  return inFlightCurriculumSync;
}

// Auto init on import!
initCurriculumFromStorage();

/**
 * Transforms a list of lessons into a unified Chikoo Adventure path
 * by embedding AI Challenges, Secret Treasure Chests, and Arena Guardians.
 */
export function getAdventureNodesForModule(
  module: Module,
  dbNodes?: any[],
  passedChallengePacks?: ChallengePack[],
  passedPuzzlePacks?: PuzzlePack[]
): Lesson[] {
  const originalLessons = [...(module.lessons || [])].sort((a, b) => {
    if (a.order_index !== undefined && b.order_index !== undefined && a.order_index !== b.order_index) {
      return a.order_index - b.order_index;
    }
    return (a.id || '').localeCompare(b.id || '', undefined, { numeric: true });
  });
  const challengePacks = passedChallengePacks || getChallengePacks();
  const puzzlePacks = passedPuzzlePacks || getPuzzlePacks();

  // 1. Prioritize existing metadata.learningPath if present as the single source of truth
  if (module.metadata?.learningPath && Array.isArray(module.metadata.learningPath) && module.metadata.learningPath.length > 0) {
    const nodes: Lesson[] = [];
    const includedLessonIds = new Set<string>();

    const sortedBlocks = [...module.metadata.learningPath].sort((a: any, b: any) => {
      return (a.sort_order ?? a.order ?? a.order_index ?? 0) - (b.sort_order ?? b.order ?? b.order_index ?? 0);
    });

    sortedBlocks.forEach((block: any, idx: number) => {
      const blockType = block.type;
      const blockNodeId = block.id || block.lessonId;

      if (blockType === 'lesson') {
        const found = originalLessons.find(l => l.id === blockNodeId);
        if (found) {
          nodes.push({
            ...found,
            lane: block.lane || 'left'
          });
          includedLessonIds.add(found.id);
        }
      } else if (blockType === 'treasure') {
        const pack = puzzlePacks.find(p => p && p.id && blockNodeId && (p.id === blockNodeId || ensureUuid(p.id) === ensureUuid(blockNodeId)));
        nodes.push({
          id: blockNodeId || `treasure_${module.id}_${idx}`,
          title: pack?.title || block.title || `Secret Treasure`,
          description: pack?.category || block.description || `Claim your cosmic treasure chest filled with shiny gems!`,
          difficulty: 'Easy',
          xpReward: pack?.xpReward || 200,
          isChest: true,
          challenges: [],
          lane: block.lane || 'center'
        });
      } else if (blockType === 'challenge') {
        const pack = challengePacks.find(p => p && p.id && blockNodeId && (p.id === blockNodeId || ensureUuid(p.id) === ensureUuid(blockNodeId)));
        nodes.push({
          id: blockNodeId || `challenge_${module.id}_${idx}`,
          title: pack?.topic || block.title || `AI Challenge`,
          description: pack?.description || block.description || `Put your thinking cap on and complete the speedy AI Challenge! Requires 80% accuracy to pass.`,
          difficulty: pack?.difficulty || 'Medium',
          xpReward: pack?.xpReward || 150,
          isChallenge: true,
          challenges: [],
          lane: block.lane || 'right'
        });
      }
    });

    // Append any lessons that are present in module.lessons but were not in the custom learningPath array
    originalLessons.forEach((l) => {
      if (!includedLessonIds.has(l.id)) {
        const nextIdx = nodes.length;
        nodes.push({
          ...l,
          lane: nextIdx % 3 === 0 ? 'left' : nextIdx % 3 === 1 ? 'center' : 'right'
        });
        includedLessonIds.add(l.id);
      }
    });

    return nodes;
  }

  // 2. Fallback to database-driven nodes if provided via dbNodes for backward compatibility
  if (dbNodes && dbNodes.length > 0) {
    const nodes: Lesson[] = [];
    const includedLessonIds = new Set<string>();

    const sortedDbNodes = [...dbNodes].sort((a: any, b: any) => {
      return (a.sort_order ?? a.order ?? a.order_index ?? 0) - (b.sort_order ?? b.order ?? b.order_index ?? 0);
    });

    sortedDbNodes.forEach((node, idx) => {
      const blockType = node.node_type || node.type;
      const blockNodeId = node.node_id || node.id || node.lessonId;

      if (blockType === 'lesson') {
        const found = originalLessons.find(l => l.id === blockNodeId);
        if (found) {
          nodes.push({
            ...found,
            lane: node.lane || 'center'
          });
          includedLessonIds.add(found.id);
        }
      } else if (blockType === 'challenge') {
        const pack = challengePacks.find(p => p && p.id && blockNodeId && (p.id === blockNodeId || ensureUuid(p.id) === ensureUuid(blockNodeId)));
        nodes.push({
          id: blockNodeId || `challenge_${module.id}_${idx}`,
          title: pack?.topic || 'AI Challenge',
          description: pack?.description || `Put your thinking cap on and complete the speedy AI Challenge! Requires 80% accuracy to pass.`,
          difficulty: pack?.difficulty || 'Medium',
          xpReward: pack?.xpReward || 150,
          isChallenge: true,
          challenges: [],
          lane: node.lane || 'right'
        });
      } else if (blockType === 'treasure') {
        const pack = puzzlePacks.find(p => p && p.id && blockNodeId && (p.id === blockNodeId || ensureUuid(p.id) === ensureUuid(blockNodeId)));
        nodes.push({
          id: blockNodeId || `treasure_${module.id}_${idx}`,
          title: pack?.title || 'Secret Treasure',
          description: pack?.category || `Claim your cosmic treasure chest filled with shiny gems!`,
          difficulty: 'Easy',
          xpReward: pack?.xpReward || 200,
          isChest: true,
          challenges: [],
          lane: node.lane || 'center'
        });
      }
    });

    // Append any lessons that are present in module.lessons but were not in the dbNodes array
    originalLessons.forEach((l) => {
      if (!includedLessonIds.has(l.id)) {
        const nextIdx = nodes.length;
        nodes.push({
          ...l,
          lane: nextIdx % 3 === 0 ? 'left' : nextIdx % 3 === 1 ? 'center' : 'right'
        });
        includedLessonIds.add(l.id);
      }
    });

    return nodes;
  }

  if (originalLessons.length === 0) return [];

  // 3. Absolute baseline fallback alternating lanes (no hardcoded Arena Guardian or boss nodes)
  const nodes: Lesson[] = [];
  originalLessons.forEach((l, idx) => {
    nodes.push({
      ...l,
      lane: idx % 3 === 0 ? 'left' : idx % 3 === 1 ? 'center' : 'right'
    });
  });

  return nodes;
}

