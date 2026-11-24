import { isSupabaseConfigured, supabase } from './supabase';
import { Lesson } from './curriculumTypes';
import { fetchWithCache, invalidateCache } from './dataCache';

export interface ChallengeQuestion {
  id: string;
  type?: 'MCQ' | 'AIVsHuman' | 'FactVsMyth' | 'ToolPicker' | 'HiddenAI' | 'SpotPrompt' | 'ImageRecognition';
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  extraData?: {
    textA?: string;
    textB?: string;
    situation?: string;
    tools?: { name: string; icon: string; reason?: string; isCorrect: boolean }[];
    factLabel?: string;
    isFact?: boolean;
    hiddenAiSource?: string;
    isSystemAI?: boolean;
    bestPrompt?: string;
    promptDetails?: string;
    logoUrl?: string; // for image recognition / zoomed puzzle
  };
}

export interface ChallengePack {
  id: string;
  topic: string; //  "AI Around You", "AI Tools", "AI Images", "Prompting", "AI Basics"
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionsCount: number;
  questions: ChallengeQuestion[];
  xpReward: number; // 20 - 100 XP
  completed?: boolean;
  description?: string;
  linked_unit_id?: string;
  linkedUnitId?: string;
}

export interface PuzzleQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  type: 'Visual' | 'Logic' | 'Scenario';
  logicClue?: string;
  imageUrl?: string;
}

export interface PuzzlePack {
  id: string;
  title: string;
  category: 'AI Detective' | 'AI Art Mystery' | 'Hidden AI' | 'AI vs Human' | 'Prompt Master' | 'Logic Lab' | 'AI Challenge';
  costXP: number; // e.g. 100 XP
  xpReward: number; // e.g. 300 XP
  questionsCount: number; // 5 hard questions
  questions: PuzzleQuestion[];
  unlocked?: boolean;
  completed?: boolean;
  badgeReward?: string;
  chest_image_url?: string;
  chestImageUrl?: string;
  chest_icon_url?: string;
  chestIconUrl?: string;
  linked_unit_id?: string;
  linkedUnitId?: string;
}

export interface BattleQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  correct_answer?: string;
  explanation: string;
}

export interface BattlePool {
  id: string;
  topic: string;
  difficulty?: string;
  questions: BattleQuestion[];
}

export interface BattleStats {
  trophies: number;
  coins: number;
  xpEarned: number;
  wins: number;
  losses: number;
  streak: number;
}

// Rank Boundaries
export const BATTLE_RANKS = [
  { name: 'Bronze', minTrophies: 0, color: 'text-amber-800 bg-amber-500/10' },
  { name: 'Silver', minTrophies: 100, color: 'text-slate-300 bg-slate-400/10' },
  { name: 'Gold', minTrophies: 250, color: 'text-yellow-400 bg-yellow-500/10 animate-pulse' },
  { name: 'Diamond', minTrophies: 500, color: 'text-cyan-400 bg-cyan-400/10' },
  { name: 'Master', minTrophies: 800, color: 'text-indigo-400 bg-indigo-500/10' },
  { name: 'Legend', minTrophies: 1200, color: 'text-rose-500 bg-rose-500/15 font-black border border-rose-500/30' }
];

export function getRankFromTrophies(trophies: number) {
  for (let i = BATTLE_RANKS.length - 1; i >= 0; i--) {
    if (trophies >= BATTLE_RANKS[i].minTrophies) {
      return BATTLE_RANKS[i];
    }
  }
  return BATTLE_RANKS[0];
}

/**
 * Ensures that the ID is a valid UUID. If it's a seed or arbitrary string,
 * it generates a deterministic, valid UUID from it.
 */
export function ensureUuid(str: string): string {
  if (!str) {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(str)) {
    return str;
  }

  // Generate a deterministic UUID based on string hash
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }

  const hex = Math.abs(hash).toString(16).padEnd(32, 'f');
  const parts = [
    hex.substring(0, 8),
    hex.substring(8, 12),
    '4' + hex.substring(13, 16),
    'a' + hex.substring(17, 20),
    hex.substring(20, 32)
  ];
  return parts.join('-');
}

// DEFAULT CHALLENGE PACKS FOR IMMEDIATE PLAY
export const DEFAULT_CHALLENGE_PACKS: ChallengePack[] = [];

// IN-MEMORY SESSION STORAGE FOR CHALLENGE PACKS, PUZZLE PACKS, AND BATTLE POOLS
// This replaces localStorage / DB caching completely to keep these features strictly in-memory per session.
let memoryChallengePacks: ChallengePack[] = (() => {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('CHIKOO_CHALLENGE_PACKS');
      if (cached !== null) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: any) => ({ ...p, id: ensureUuid(p.id) }));
        }
      }
    } catch (e) {
      console.warn("Failed to load cached challenge packs:", e);
    }
  }
  return DEFAULT_CHALLENGE_PACKS;
})();

let memoryPuzzlePacks: PuzzlePack[] = (() => {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('CHIKOO_PUZZLE_PACKS');
      if (cached !== null) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed.map((p: any) => ({ ...p, id: ensureUuid(p.id) }));
        }
      }
    } catch (e) {
      console.warn("Failed to load cached puzzle packs:", e);
    }
  }
  return [];
})();

let memoryBattlePools: BattlePool[] = (() => {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('CHIKOO_BATTLE_POOLS');
      if (cached !== null) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: any) => ({ ...p, id: ensureUuid(p.id) }));
        }
      }
    } catch (e) {
      console.warn("Failed to load cached battle pools:", e);
    }
  }
  return [];
})();

// STATE STORAGE CORE API HELPERS

export async function getChallengePacksAsync(): Promise<ChallengePack[]> {
  try {
    const apiRes = await fetch('/api/database/challenge-packs');
    if (apiRes.ok) {
      const json = await apiRes.json();
      if (json && json.success && Array.isArray(json.packs) && json.packs.length > 0) {
        const mapped: ChallengePack[] = json.packs.map((row: any) => {
          const questions = Array.isArray(row.questions) ? row.questions : (typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions || []);
          return {
            id: row.id,
            topic: row.topic || row.title || 'Untitled',
            difficulty: row.difficulty || 'Easy',
            questionsCount: row.questions_count ?? row.total_challenges ?? questions.length,
            questions: questions,
            xpReward: 50,
            completed: row.completed ?? false,
            description: row.description || '',
            linked_unit_id: row.linked_unit_id || row.linkedUnitId || undefined,
            linkedUnitId: row.linked_unit_id || row.linkedUnitId || undefined
          };
        });
        memoryChallengePacks = mapped;
        if (typeof window !== 'undefined') {
          localStorage.setItem('CHIKOO_CHALLENGE_PACKS', JSON.stringify(mapped));
        }
        return mapped;
      }
    }
  } catch (apiErr) {
    // Proceed to direct Supabase fallback
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('challenge_packs').select('*');
      if (error) {
        return memoryChallengePacks;
      }
      if (data && data.length > 0) {
        const mapped: ChallengePack[] = data.map(row => {
          const questions = Array.isArray(row.questions) ? row.questions : (typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions || []);
          return {
            id: row.id,
            topic: row.topic || row.title || 'Untitled',
            difficulty: row.difficulty || 'Easy',
            questionsCount: row.questions_count ?? row.total_challenges ?? questions.length,
            questions: questions,
            xpReward: 50,
            completed: row.completed ?? false,
            description: row.description || '',
            linked_unit_id: row.linked_unit_id || row.linkedUnitId || undefined,
            linkedUnitId: row.linked_unit_id || row.linkedUnitId || undefined
          };
        });
        memoryChallengePacks = mapped;
        if (typeof window !== 'undefined') {
          localStorage.setItem('CHIKOO_CHALLENGE_PACKS', JSON.stringify(mapped));
        }
        return mapped;
      }
    } catch (e: any) {
      console.warn("Exception fetching challenge packs from Supabase:", e.message || e);
    }
  }
  return memoryChallengePacks;
}

export function getChallengePacks(): ChallengePack[] {
  return memoryChallengePacks;
}

export function saveChallengePacks(packs: ChallengePack[]): ChallengePack[] {
  // Ensure every pack has a valid UUID
  const processedPacks = packs.map(p => ({
    ...p,
    id: ensureUuid(p.id)
  }));
  memoryChallengePacks = processedPacks;
  if (typeof window !== 'undefined') {
    localStorage.setItem('CHIKOO_CHALLENGE_PACKS', JSON.stringify(processedPacks));
    window.dispatchEvent(new CustomEvent('chikooChallengePacksChanged', { detail: processedPacks }));
    window.dispatchEvent(new Event('curriculumChanged'));
  }
  if (isSupabaseConfigured && supabase) {
    (async () => {
      try {
        // 1. Delete any packs that are no longer in the list FIRST to prevent race conditions on real-time select
        console.log("[Supabase Intent] FETCH on table: 'challenge_packs' for sync-delete", { select: 'id' });
        const { data: dbData, error: fetchError } = await supabase.from('challenge_packs').select('id');
        if (fetchError) {
          console.error("[Supabase Error] Failed operation on 'challenge_packs' during deletion sync:", fetchError);
        } else if (dbData) {
          const activeIds = new Set(processedPacks.map(p => p.id));
          const idsToDelete = dbData.map(row => row.id).filter(id => !activeIds.has(id));
          
          if (idsToDelete.length > 0) {
            console.log("[Supabase Intent] BATCH DELETE on table: 'challenge_packs'", idsToDelete);
            const { error: deleteError } = await supabase.from('challenge_packs').delete().in('id', idsToDelete);
            if (deleteError) {
              console.error("[Supabase Error] Failed batch delete on 'challenge_packs':", deleteError);
            } else {
              console.log("[Supabase Success] Batch deleted on 'challenge_packs':", idsToDelete);
            }
          }
        }

        // 2. Upsert all the active packs
        for (const pack of processedPacks) {
          const dbItem: any = {
            id: pack.id,
            title: pack.topic || 'Untitled',
            topic: pack.topic || 'Untitled',
            difficulty: pack.difficulty || 'Easy',
            description: pack.description || '',
            questions_count: pack.questions?.length || 0,
            total_challenges: pack.questions?.length || 0,
            completed: !!pack.completed,
            questions: pack.questions || [],
            is_active: true,
            linked_unit_id: pack.linked_unit_id || pack.linkedUnitId || null
          };
          console.log("[Supabase Intent] INSERT/UPDATE on table: 'challenge_packs'", dbItem);
          let { error: upsertError } = await supabase.from('challenge_packs').upsert([dbItem]);
          
          if (upsertError) {
            const isColumnError = upsertError.code === '42703' || 
                                  (upsertError.message && (
                                    upsertError.message.toLowerCase().includes('linked_unit_id') || 
                                    upsertError.message.toLowerCase().includes('column') ||
                                    upsertError.message.toLowerCase().includes('does not exist')
                                  ));
            if (isColumnError) {
              console.warn("linked_unit_id column does not exist on challenge_packs. Retrying upsert without it.");
              delete dbItem.linked_unit_id;
              const retryRes = await supabase.from('challenge_packs').upsert([dbItem]);
              upsertError = retryRes.error;
            }
          }

          if (upsertError) {
            console.error("[Supabase Error] Failed operation on 'challenge_packs':", upsertError);
          } else {
            console.log("[Supabase Success] 'challenge_packs' operation completed.", dbItem);
          }
        }
      } catch (e: any) {
        console.warn("Exception saving challenge packs to Supabase:", e.message || e);
      }
    })();
  }
  return processedPacks;
}

export async function getPuzzlePacksAsync(): Promise<PuzzlePack[]> {
  try {
    const apiRes = await fetch('/api/database/puzzle-packs');
    if (apiRes.ok) {
      const json = await apiRes.json();
      if (json && json.success && Array.isArray(json.packs) && json.packs.length > 0) {
        const mapped: PuzzlePack[] = json.packs.map((row: any) => ({
          id: row.id,
          title: row.title,
          category: row.category || 'Logic Lab',
          questions: Array.isArray(row.questions) ? row.questions : (typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions || []),
          costXP: row.cost_xp ?? row.costXP ?? 100,
          xpReward: row.xp_reward ?? row.xpReward ?? 250,
          questionsCount: row.questions_count ?? row.questionsCount ?? (Array.isArray(row.questions) ? row.questions.length : 0),
          unlocked: row.unlocked ?? false,
          completed: row.completed ?? false,
          badgeReward: row.badge_reward ?? row.badgeReward,
          chest_image_url: row.chest_image_url || row.chestImageUrl || row.chest_icon_url || row.chestIconUrl || undefined,
          chestImageUrl: row.chest_image_url || row.chestImageUrl || row.chest_icon_url || row.chestIconUrl || undefined,
          chest_icon_url: row.chest_icon_url || row.chestIconUrl || row.chest_image_url || row.chestImageUrl || undefined,
          chestIconUrl: row.chest_icon_url || row.chestIconUrl || row.chest_image_url || row.chestImageUrl || undefined,
          linked_unit_id: row.linked_unit_id || row.linkedUnitId || undefined,
          linkedUnitId: row.linked_unit_id || row.linkedUnitId || undefined
        }));
        memoryPuzzlePacks = mapped;
        if (typeof window !== 'undefined') {
          localStorage.setItem('CHIKOO_PUZZLE_PACKS', JSON.stringify(mapped));
        }
        return mapped;
      }
    }
  } catch (apiErr) {
    // Proceed to direct Supabase fallback
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('puzzle_packs').select('*');
      if (error) {
        return memoryPuzzlePacks;
      }
      if (data && data.length > 0) {
        const mapped: PuzzlePack[] = data.map(row => ({
          id: row.id,
          title: row.title,
          category: row.category || 'Logic Lab',
          questions: Array.isArray(row.questions) ? row.questions : (typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions || []),
          costXP: row.cost_xp ?? row.costXP ?? 100,
          xpReward: row.xp_reward ?? row.xpReward ?? 250,
          questionsCount: row.questions_count ?? row.questionsCount ?? (Array.isArray(row.questions) ? row.questions.length : 0),
          unlocked: row.unlocked ?? false,
          completed: row.completed ?? false,
          badgeReward: row.badge_reward ?? row.badgeReward,
          chest_image_url: row.chest_image_url || row.chestImageUrl || row.chest_icon_url || row.chestIconUrl || undefined,
          chestImageUrl: row.chest_image_url || row.chestImageUrl || row.chest_icon_url || row.chestIconUrl || undefined,
          chest_icon_url: row.chest_icon_url || row.chestIconUrl || row.chest_image_url || row.chestImageUrl || undefined,
          chestIconUrl: row.chest_icon_url || row.chestIconUrl || row.chest_image_url || row.chestImageUrl || undefined,
          linked_unit_id: row.linked_unit_id || row.linkedUnitId || undefined,
          linkedUnitId: row.linked_unit_id || row.linkedUnitId || undefined
        }));
        memoryPuzzlePacks = mapped;
        if (typeof window !== 'undefined') {
          localStorage.setItem('CHIKOO_PUZZLE_PACKS', JSON.stringify(mapped));
        }
        return mapped;
      }
    } catch (e: any) {
      console.warn("Exception fetching puzzle packs from Supabase:", e.message || e);
    }
  }
  return memoryPuzzlePacks;
}

export function getPuzzlePacks(): PuzzlePack[] {
  return memoryPuzzlePacks;
}

export function savePuzzlePacks(packs: PuzzlePack[]): PuzzlePack[] {
  const processedPacks = packs.map(p => ({
    ...p,
    id: ensureUuid(p.id)
  }));
  memoryPuzzlePacks = processedPacks;
  if (typeof window !== 'undefined') {
    localStorage.setItem('CHIKOO_PUZZLE_PACKS', JSON.stringify(processedPacks));
    window.dispatchEvent(new CustomEvent('chikooPuzzlePacksChanged', { detail: processedPacks }));
    window.dispatchEvent(new Event('curriculumChanged'));
  }
  if (isSupabaseConfigured && supabase) {
    (async () => {
      try {
        // 1. Delete any packs that are no longer in the list FIRST
        console.log("[Supabase Intent] FETCH on table: 'puzzle_packs' for sync-delete", { select: 'id' });
        const { data: dbData, error: fetchError } = await supabase.from('puzzle_packs').select('id');
        if (fetchError) {
          console.error("[Supabase Error] Failed operation on 'puzzle_packs' during deletion sync:", fetchError);
        } else if (dbData) {
          const activeIds = new Set(processedPacks.map(p => p.id));
          const idsToDelete = dbData.map(row => row.id).filter(id => !activeIds.has(id));
          
          if (idsToDelete.length > 0) {
            console.log("[Supabase Intent] BATCH DELETE on table: 'puzzle_packs'", idsToDelete);
            const { error: deleteError } = await supabase.from('puzzle_packs').delete().in('id', idsToDelete);
            if (deleteError) {
              console.error("[Supabase Error] Failed batch delete on 'puzzle_packs':", deleteError);
            } else {
              console.log("[Supabase Success] Batch deleted on 'puzzle_packs':", idsToDelete);
            }
          }
        }

        // 2. Upsert all the active packs
        for (const pack of processedPacks) {
          const dbItem: any = {
            id: pack.id,
            title: pack.title,
            category: pack.category || 'Logic Lab',
            cost_xp: pack.costXP ?? 100,
            xp_reward: pack.xpReward ?? 250,
            questions_count: pack.questions.length,
            unlocked: !!pack.unlocked,
            completed: !!pack.completed,
            badge_reward: pack.badgeReward || null,
            questions: pack.questions,
            chest_image_url: pack.chest_image_url || pack.chestImageUrl || pack.chest_icon_url || pack.chestIconUrl || null,
            linked_unit_id: pack.linked_unit_id || pack.linkedUnitId || null
          };
          console.log("[Supabase Intent] INSERT/UPDATE on table: 'puzzle_packs'", dbItem);
          const { error: upsertError } = await supabase.from('puzzle_packs').upsert([dbItem]);

          if (upsertError) {
            console.error("[Supabase Error] Failed operation on 'puzzle_packs':", upsertError);
          } else {
            console.log("[Supabase Success] 'puzzle_packs' operation completed.", dbItem);
          }
        }
      } catch (e: any) {
        console.warn("Exception writing puzzle packs to Supabase:", e.message || e);
      }
    })();
  }
  return processedPacks;
}

export async function getBattlePoolsAsync(): Promise<BattlePool[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      console.log("[Supabase Intent] FETCH on table: 'battle_pools'", {});
      const { data, error } = await supabase.from('battle_pools').select('*');
      if (error) {
        console.error("[Supabase Error] Failed operation on 'battle_pools':", error);
        console.warn("Error loading battle pools from Supabase:", error.message);
        return memoryBattlePools;
      }
      console.log("[Supabase Success] 'battle_pools' operation completed.", data);
      if (data) {
        const mapped: BattlePool[] = data.map(row => {
          const rawQuestions = Array.isArray(row.questions) 
            ? row.questions 
            : (typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions || []);
          
          const mappedQuestions: BattleQuestion[] = rawQuestions.map((q: any) => ({
            id: q.id || '',
            question: q.question || '',
            options: Array.isArray(q.options) ? q.options : [],
            correctAnswer: q.correct_answer || q.correctAnswer || '',
            correct_answer: q.correct_answer || q.correctAnswer || '',
            explanation: q.explanation || ''
          }));

          return {
            id: row.id,
            topic: row.topic,
            difficulty: row.difficulty || 'Easy',
            questions: mappedQuestions
          };
        });
        memoryBattlePools = mapped;
        if (typeof window !== 'undefined') {
          localStorage.setItem('CHIKOO_BATTLE_POOLS', JSON.stringify(mapped));
        }
        return mapped;
      }
    } catch (e: any) {
      console.warn("Exception fetching battle pools from Supabase:", e.message || e);
    }
  }
  return memoryBattlePools;
}

export function getBattlePools(): BattlePool[] {
  return memoryBattlePools;
}

export function saveBattlePools(pools: BattlePool[]): BattlePool[] {
  const processedPools = pools.map(p => ({
    ...p,
    id: ensureUuid(p.id)
  }));
  memoryBattlePools = processedPools;
  if (typeof window !== 'undefined') {
    localStorage.setItem('CHIKOO_BATTLE_POOLS', JSON.stringify(processedPools));
    window.dispatchEvent(new CustomEvent('chikooBattlePoolsChanged', { detail: processedPools }));
  }
  if (isSupabaseConfigured && supabase) {
    (async () => {
      try {
        // 1. Delete any pools that are no longer in the list FIRST
        console.log("[Supabase Intent] FETCH on table: 'battle_pools' for sync-delete", { select: 'id' });
        const { data: dbData, error: fetchError } = await supabase.from('battle_pools').select('id');
        if (fetchError) {
          console.error("[Supabase Error] Failed operation on 'battle_pools' during deletion sync:", fetchError);
        } else if (dbData) {
          const activeIds = new Set(processedPools.map(p => p.id));
          const idsToDelete = dbData.map(row => row.id).filter(id => !activeIds.has(id));
          
          if (idsToDelete.length > 0) {
            console.log("[Supabase Intent] BATCH DELETE on table: 'battle_pools'", idsToDelete);
            const { error: deleteError } = await supabase.from('battle_pools').delete().in('id', idsToDelete);
            if (deleteError) {
              console.error("[Supabase Error] Failed batch delete on 'battle_pools':", deleteError);
            } else {
              console.log("[Supabase Success] Batch deleted on 'battle_pools':", idsToDelete);
            }
          }
        }

        // 2. Upsert all the active pools
        for (const pool of processedPools) {
          const mappedQuestions = pool.questions.map(q => ({
            id: q.id,
            question: q.question,
            options: q.options,
            correct_answer: q.correctAnswer || q.correct_answer || ''
          }));

          const dbItem = {
            id: pool.id,
            topic: pool.topic,
            difficulty: pool.difficulty || 'Easy',
            questions: mappedQuestions
          };
          console.log("[Supabase Intent] INSERT/UPDATE on table: 'battle_pools'", dbItem);
          const { error: upsertError } = await supabase.from('battle_pools').upsert([dbItem]);
          if (upsertError) {
            console.error("[Supabase Error] Failed operation on 'battle_pools':", upsertError);
          } else {
            console.log("[Supabase Success] 'battle_pools' operation completed.", dbItem);
          }
        }
      } catch (e: any) {
        console.warn("Exception writing battle pools to Supabase:", e.message || e);
      }
    })();
  }
  return processedPools;
}

// BATTLES HIGHSCORES & PLAY PLAYER STATS

const DEFAULT_BATTLE_STATS: BattleStats = {
  trophies: 45, // default starter trophies
  coins: 120, // default starter coins (for rewards)
  xpEarned: 150,
  wins: 0,
  losses: 0,
  streak: 0
};

export function getBattleStats(): BattleStats {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem('CHIKOO_BATTLE_STATS');
      if (!data) {
        localStorage.setItem('CHIKOO_BATTLE_STATS', JSON.stringify(DEFAULT_BATTLE_STATS));
        return DEFAULT_BATTLE_STATS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_BATTLE_STATS;
    }
  }
  return DEFAULT_BATTLE_STATS;
}

export function saveBattleStats(stats: BattleStats) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('CHIKOO_BATTLE_STATS', JSON.stringify(stats));
  }
}

// SIMULATE OPPONENTS MATCHMAKING POOL BASED ON LEVEL/XP/STRENGTH

export interface Opponent {
  name: string;
  avatar: string;
  title: string;
  trophies: number;
  xp: number;
}

export const MATCH_OPPONENTS: Opponent[] = [
  { name: 'CosmicAide', avatar: '🤖', title: 'Rover Cadet', trophies: 50, xp: 4100 },
  { name: 'StarJumper', avatar: '🐱', title: 'Astro Kitten', trophies: 120, xp: 4250 },
  { name: 'PixelDancer', avatar: '🦊', title: 'AI Detective', trophies: 280, xp: 4400 },
  { name: 'GravitySlam', avatar: '🦍', title: 'Lunar Slammer', trophies: 480, xp: 4500 },
  { name: 'GalaxyGopher', avatar: '🐹', title: 'Orbit Scout', trophies: 880, xp: 4700 },
  { name: 'NebulaSleuth', avatar: '🧠', title: 'Grand Sleuth', trophies: 1250, xp: 5200 },
  { name: 'SlickQuantum', avatar: '🚀', title: 'Deep Space Lord', trophies: 1450, xp: 5800 }
];

export function findMatchingOpponent(playerTrophies: number): Opponent {
  // Find closest opponent by trophies
  let closest = MATCH_OPPONENTS[0];
  let minDiff = Math.abs(closest.trophies - playerTrophies);
  
  for (const opp of MATCH_OPPONENTS) {
    const diff = Math.abs(opp.trophies - playerTrophies);
    if (diff < minDiff) {
      minDiff = diff;
      closest = opp;
    }
  }
  return closest;
}

export function mapChallengePackToLesson(
  pack: ChallengePack,
  overrideId?: string,
  overrideTitle?: string,
  overrideDescription?: string
): Lesson {
  const questions = (pack.questions && pack.questions.length > 0) ? pack.questions : [];
  return {
    id: overrideId || `practice_${pack.id}`,
    title: overrideTitle || pack.topic,
    description: overrideDescription || pack.description || `Special Quick Practice path for ${pack.topic}`,
    difficulty: pack.difficulty,
    xpReward: pack.xpReward || 50,
    isChallenge: true,
    challenges: questions.map((q) => {
      let challengeType: any = 'tap_right_answer';
      let extraProps: any = {};

      if (q.type === 'FactVsMyth') {
        challengeType = 'ai_myth_fact';
        extraProps = {
          aiMythFact: {
            statement: q.question,
            isFact: q.extraData?.isFact ?? false,
            context: q.explanation
          }
        };
      } else if (q.type === 'AIVsHuman') {
        challengeType = 'ai_vs_human';
        const isTextA_AI = q.correctAnswer === q.options[0];
        extraProps = {
          outputs: [
            {
              id: q.options[0],
              title: 'Option Alpha',
              text: q.extraData?.textA || q.options[0],
              authorLabel: isTextA_AI ? 'AI Model' : 'Human Author',
              isAI: isTextA_AI
            },
            {
              id: q.options[1],
              title: 'Option Beta',
              text: q.extraData?.textB || q.options[1],
              authorLabel: !isTextA_AI ? 'AI Model' : 'Human Author',
              isAI: !isTextA_AI
            }
          ]
        };
      } else if (q.type === 'ToolPicker') {
        challengeType = 'ai_tool_picker';
        extraProps = {
          toolPicker: {
            situation: q.extraData?.situation || 'Analyze situation.',
            options: q.options.map((opt, i) => {
              const toolsData = q.extraData?.tools || [];
              const t = toolsData[i] || { name: opt, icon: '🔧', reason: 'Basic usage', isCorrect: opt === q.correctAnswer };
              return {
                text: opt,
                isCorrect: opt === q.correctAnswer,
                feedback: t.reason || 'Select this helper'
              };
            })
          }
        };
      } else if (q.type === 'HiddenAI') {
        challengeType = 'hidden_ai';
        extraProps = {
          hiddenAi: {
            scene: q.question,
            areas: q.options.map((opt, idx) => {
              const isCorrect = opt === q.correctAnswer;
              return {
                id: `area_${idx}`,
                label: opt.substring(0, 30) + '...',
                locationText: isCorrect ? 'The correct recommendation node' : 'Standard Distractor Area',
                techName: isCorrect ? (q.extraData?.hiddenAiSource || 'Advanced Machine Learning') : 'Non-AI Mechanic',
                description: isCorrect ? q.explanation : 'An offline basic component operating completely without algorithmic computation.',
                isCorrectSpot: isCorrect
              };
            })
          }
        };
      } else if (q.type === 'SpotPrompt') {
        challengeType = 'prompt_fixer';
        extraProps = {
          promptFixer: {
            badPrompt: q.options.find(opt => opt !== q.correctAnswer) || 'vague explain prompt',
            badFeedback: 'The model gives complex math derivatives and university-level answers which is hard for kids.',
            options: q.options.map(opt => ({
              text: opt,
              isCorrect: opt === q.correctAnswer,
              feedback: opt === q.correctAnswer ? (q.extraData?.bestPrompt || 'Terrific instruction!') : 'Too technical or vague.',
            })),
            correctAnswer: q.correctAnswer,
            improvedExplanation: q.explanation
          }
        };
      } else if (q.type === 'ImageRecognition') {
        challengeType = 'image_reveal';
        extraProps = {
          imageUrl: q.extraData?.logoUrl || ''
        };
      }

      return {
        id: q.id,
        type: challengeType,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        ...extraProps
      };
    })
  };
}
