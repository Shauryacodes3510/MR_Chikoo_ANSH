export interface Reward {
  id: string;
  title: string;
  description: string;
  image: string;
  category: 'AI Tools' | 'Spotlight Rewards' | 'Digital Rewards' | 'Cosmetic Rewards';
  requirementType: 'gems' | 'xp' | 'conditional';
  xpRequirement: number;
  gemRequirement: number;
  plusRequirement: boolean;
  isPlusExclusive?: boolean; // field alias for admin compatibility
  eligibilityRules: string;
  featuredStatus: boolean;
  isActive: boolean;
  stock?: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  visual?: string;
  subtitle?: string;
}

export interface RedemptionRequest {
  id: string;
  rewardId: string;
  userEmail: string;
  username: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  rewardTitle?: string;
  rewardCategory?: string;
  gemsPaid?: number;
  xpPaid?: number;
}

// Prepopulated list of high-motivation rewards
const DEFAULT_REWARDS: Reward[] = [];

const OLD_DEFAULT_REWARD_IDS = new Set([
  'spot-macbook',
  'spot-watch',
  'spot-headphones',
  'ai-chatgpt',
  'ai-perplexity',
  'ai-canva',
  'ai-notebooklm',
  'digit-pass',
  'digit-cert',
  'cosm-halo'
]);

const STORAGE_PREFIX = 'CHIKOO_SUPABASE_DB_';
import { supabase, isSupabaseConfigured } from './supabase';
import { fetchWithCache, invalidateCache } from './dataCache';

export function getRewards(): Reward[] {
  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'rewards');
    if (saved === null) return DEFAULT_REWARDS;
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return DEFAULT_REWARDS;
    
    // Purge any old default/mock rewards from the array
    const filtered = parsed.filter((r: any) => r && r.id && !OLD_DEFAULT_REWARD_IDS.has(r.id));
    if (filtered.length !== parsed.length) {
      localStorage.setItem(STORAGE_PREFIX + 'rewards', JSON.stringify(filtered));
    }
    return filtered;
  } catch {
    return DEFAULT_REWARDS;
  }
}

export function saveRewards(rewards: Reward[]) {
  try {
    localStorage.setItem(STORAGE_PREFIX + 'rewards', JSON.stringify(rewards));
  } catch (err) {
    console.error('Failed saving rewards list:', err);
  }
}

export function getRedemptionRequests(): RedemptionRequest[] {
  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'redemptions');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveRedemptionRequests(requests: RedemptionRequest[]) {
  try {
    localStorage.setItem(STORAGE_PREFIX + 'redemptions', JSON.stringify(requests));
  } catch (err) {
    console.error('Failed saving redemptions checklist:', err);
  }
}

/**
 * ASYNCHRONOUS DATABASE INTEGRATIONS WITH ON-DEMAND FALLBACKS
 */
export async function getRewardsAsync(): Promise<Reward[]> {
  return fetchWithCache<Reward[]>('CHIKOO_REWARDS_LIST_V2', async () => {
    try {
      const apiRes = await fetch('/api/database/rewards');
      if (apiRes.ok) {
        const json = await apiRes.json();
        if (json && json.success && Array.isArray(json.rewards) && json.rewards.length > 0) {
          saveRewards(json.rewards);
          return json.rewards;
        }
      }
    } catch (apiErr) {
      console.warn("Server rewards fetch error, falling back to direct Supabase:", apiErr);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        console.log("[Supabase Intent] FETCH on table: 'rewards'", { order: 'id' });
        const { data, error } = await supabase
          .from('rewards')
          .select('*')
          .order('id', { ascending: true });
        if (error) {
          console.error("[Supabase Error] Failed operation on 'rewards':", error);
          throw error;
        }
        console.log("[Supabase Success] 'rewards' operation completed.", data);
        if (data && data.length > 0) {
          const mapped = data.map((item: any) => {
            const visualData = typeof item.visual === 'string'
              ? JSON.parse(item.visual)
              : (item.visual || {});

            return {
              id: item.id,
              title: item.title,
              description: item.description || visualData.description || '',
              image: visualData.image || '',
              category: visualData.category || 'Spotlight Rewards',
              requirementType: visualData.requirementType || 'gems',
              xpRequirement: item.cost_xp ?? visualData.xpRequirement ?? 0,
              gemRequirement: item.cost_gems ?? visualData.gemRequirement ?? 0,
              plusRequirement: !!visualData.plusRequirement,
              isPlusExclusive: !!visualData.plusRequirement,
              eligibilityRules: visualData.eligibilityRules || '',
              featuredStatus: !!visualData.featuredStatus,
              isActive: visualData.isActive !== false,
              stock: visualData.stock ?? 99,
              rarity: visualData.rarity || 'common',
              visual: visualData.visual || visualData.image || ''
            };
          });
          saveRewards(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('getRewardsAsync db table select failed:', err);
      }
    }
    return getRewards();
  }, {
    ttlMs: 15 * 60 * 1000,
    storageKey: STORAGE_PREFIX + 'rewards',
    timeoutMs: 3500,
    fallback: getRewards()
  });
}

export async function saveRewardAsync(reward: Reward): Promise<void> {
  const current = getRewards();
  const next = current.some(r => r.id === reward.id) 
    ? current.map(r => r.id === reward.id ? reward : r) 
    : [reward, ...current];
  saveRewards(next);
  invalidateCache('CHIKOO_REWARDS_LIST_V2');

  const visualPayload = {
    image: reward.image,
    category: reward.category,
    requirementType: reward.requirementType,
    xpRequirement: reward.xpRequirement,
    gemRequirement: reward.gemRequirement,
    plusRequirement: reward.plusRequirement,
    eligibilityRules: reward.eligibilityRules,
    featuredStatus: reward.featuredStatus,
    isActive: reward.isActive,
    stock: reward.stock || 99,
    rarity: reward.rarity || 'common',
    visual: reward.visual || reward.image
  };

  const dbItem = {
    id: reward.id,
    title: reward.title,
    description: reward.description,
    cost_gems: reward.gemRequirement ?? 0,
    cost_xp: reward.xpRequirement ?? 0,
    unlocked: !!reward.plusRequirement,
    completed: false,
    visual: visualPayload
  };

  // 1. Try server backend endpoint first (with service credentials)
  try {
    let headers: any = { 'Content-Type': 'application/json' };
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    }
    const apiRes = await fetch('/api/database/rewards/save', {
      method: 'POST',
      headers,
      body: JSON.stringify(dbItem)
    });
    if (apiRes.ok) {
      const json = await apiRes.json();
      if (json && json.success) {
        console.log("[Database API Success] Reward saved via backend API:", reward.id);
        invalidateCache('CHIKOO_REWARDS_LIST_V2');
        return;
      }
    }
  } catch (apiErr) {
    console.warn("Backend reward save API warning, trying direct Supabase client:", apiErr);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      console.log("[Supabase Intent] UPDATE on table: 'rewards'", dbItem);
      const { error } = await supabase
        .from('rewards')
        .upsert(dbItem);
      if (error) {
        console.error("[Supabase Error] Failed operation on 'rewards':", error);
        throw error;
      }
      console.log("[Supabase Success] 'rewards' operation completed.", dbItem);
      invalidateCache('CHIKOO_REWARDS_LIST_V2');
    } catch (err) {
      console.error('saveRewardAsync database write failed:', err);
    }
  }
}

export async function deleteRewardAsync(id: string): Promise<void> {
  const current = getRewards().filter(r => r.id !== id);
  saveRewards(current);
  invalidateCache('CHIKOO_REWARDS_LIST_V2');

  if (isSupabaseConfigured && supabase) {
    try {
      console.log("[Supabase Intent] DELETE on table: 'rewards'", { id });
      const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', id);
      if (error) {
        console.error("[Supabase Error] Failed operation on 'rewards':", error);
        throw error;
      }
      console.log("[Supabase Success] 'rewards' operation completed. Deleted ID:", id);
      invalidateCache('CHIKOO_REWARDS_LIST_V2');
    } catch (err) {
      console.error('deleteRewardAsync database write failed:', err);
      throw err;
    }
  }
}

export async function getRedemptionRequestsAsync(): Promise<RedemptionRequest[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      console.log("[Supabase Intent] FETCH on table: 'redemption_requests'", { order: 'created_at desc' });
      const { data, error } = await supabase
        .from('redemption_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error("[Supabase Error] Failed operation on 'redemption_requests':", error);
        throw error;
      }
      console.log("[Supabase Success] 'redemption_requests' operation completed.", data);
      if (data) {
        return data.map((item: any) => ({
          id: item.id,
          rewardId: item.reward_id,
          userEmail: item.user_email,
          username: item.username,
          createdAt: item.created_at,
          status: item.status,
          notes: item.notes,
          rewardTitle: item.reward_title,
          rewardCategory: item.reward_category,
          gemsPaid: item.gems_paid,
          xpPaid: item.xp_paid
        }));
      }
    } catch (err) {
      console.warn('getRedemptionRequestsAsync database read failed:', err);
    }
  }
  return getRedemptionRequests();
}

export async function saveRedemptionRequestAsync(req: RedemptionRequest): Promise<void> {
  const current = getRedemptionRequests();
  const next = current.some(r => r.id === req.id)
    ? current.map(r => r.id === req.id ? req : r)
    : [req, ...current];
  saveRedemptionRequests(next);

  if (isSupabaseConfigured && supabase) {
    try {
      const dbItem = {
        id: req.id,
        reward_id: req.rewardId,
        user_email: req.userEmail,
        username: req.username,
        created_at: req.createdAt,
        status: req.status,
        notes: req.notes,
        reward_title: req.rewardTitle,
        reward_category: req.rewardCategory,
        gems_paid: req.gemsPaid,
        xp_paid: req.xpPaid
      };

      console.log("[Supabase Intent] UPDATE on table: 'redemption_requests'", dbItem);
      const { error } = await supabase
        .from('redemption_requests')
        .upsert(dbItem);
      if (error) {
        console.error("[Supabase Error] Failed operation on 'redemption_requests':", error);
        throw error;
      }
      console.log("[Supabase Success] 'redemption_requests' operation completed.", dbItem);
    } catch (err) {
      console.error('saveRedemptionRequestAsync database write failed:', err);
      throw err;
    }
  }
}

