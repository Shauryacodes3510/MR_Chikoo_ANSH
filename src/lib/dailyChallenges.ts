import { DailyChallenge } from '../types';
import { isSupabaseConfigured, supabase } from './supabase';

export const DAILY_CHALLENGES: DailyChallenge[] = [];

function mapToUuid(id: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;
  return 'da000000-0000-4000-b000-' + id.padEnd(12, '0').substring(0, 12);
}

function mapFromUuid(uuid: string): string {
  if (uuid.startsWith('da000000-0000-4000-b000-')) {
    return uuid.replace('da000000-0000-4000-b000-', '').trim();
  }
  return uuid;
}

export async function syncDailyChallengesWithSupabase(): Promise<DailyChallenge[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      console.log("[Supabase Intent] FETCH on table: 'daily_challenges'", {});
      const { data, error } = await supabase.from('daily_challenges').select('*');
      if (error) {
        console.error("[Supabase Error] Failed operation on 'daily_challenges':", error);
        console.warn("Failed to fetch daily challenges from Supabase:", error.message);
        return DAILY_CHALLENGES;
      }
      console.log("[Supabase Success] 'daily_challenges' operation completed.", data);
      if (data && data.length > 0) {
        const mapped: DailyChallenge[] = data.map(row => ({
          id: mapFromUuid(row.id),
          title: row.title,
          description: row.description,
          question: row.question,
          options: Array.isArray(row.options) ? row.options : (typeof row.options === 'string' ? JSON.parse(row.options) : row.options || []),
          correctAnswer: row.correct_answer ?? row.correctAnswer,
          explanation: row.explanation,
          xpReward: row.xp_reward ?? row.xpReward ?? 50,
          type: row.type || 'logic',
          module_id: row.module_id || row.moduleId,
          world_id: row.world_id || row.worldId
        }));
        DAILY_CHALLENGES.splice(0, DAILY_CHALLENGES.length, ...mapped);
        return DAILY_CHALLENGES;
      } else {
        console.log("Supabase daily_challenges table is empty. Returning empty list.");
        DAILY_CHALLENGES.splice(0, DAILY_CHALLENGES.length);
        return [];
      }
    } catch (err: any) {
      console.warn("Error synchronizing daily challenges with Supabase:", err.message || err);
    }
  }
  return DAILY_CHALLENGES;
}

/**
 * Returns the list of Daily Challenges required to unlock World 2.
 * If the database contains challenges, it uses them. Otherwise, returns high-quality default daily challenges.
 */
export function getRequiredWorld1DailyChallenges(allChallenges: DailyChallenge[], world1ModuleIds: string[] = ['mod_543644', 'mod_003945', 'mod_182745']): DailyChallenge[] {
  if (!allChallenges || allChallenges.length === 0) {
    return [];
  }

  // If we have database challenges, filter them
  const filtered = allChallenges.filter(dc => {
    if (dc.world_id) return dc.world_id === 'world_1';
    if (dc.module_id) return world1ModuleIds.includes(dc.module_id);
    return dc.id.startsWith('dc_world1_') || dc.id.includes('world1');
  });

  if (filtered.length > 0) return filtered;

  // Fallback: If no explicit World 1 markers are in DB, take first 3 challenges
  return allChallenges.slice(0, 3);
}
