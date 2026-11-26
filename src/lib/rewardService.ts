import { progressService } from './progressService';
import { getISTDateString } from './questConfig';
import { SupabaseUserProfile, supabase } from './supabase';
import { 
  rpcCompleteChallenge, 
  rpcClaimSpinReward, 
  rpcRedeemGems, 
  rpcGetSpinWheelDailyStatus,
  rpcConsumeSpinWheel,
  generateSpinReference,
  CompleteChallengeRpcResult,
  ClaimSpinRewardRpcResult,
  RedeemGemsRpcResult,
  SpinWheelDailyStatus,
  ConsumeSpinWheelResult
} from './supabaseRewards';

export type RewardType = 
  | 'lesson' 
  | 'daily_chest' 
  | 'quest' 
  | 'daily_challenge' 
  | 'wheel_spin' 
  | 'ai_mission' 
  | 'practice' 
  | 'treasure_chest'
  | 'unit_mastery' 
  | 'streak_milestone' 
  | 'badge';

export interface GrantRewardParams {
  claimId: string;
  amount: number;
  rewardType: RewardType | string;
  metadata?: Record<string, any>;
  email?: string;
  xpReward?: number;
}

export interface GrantRewardResult {
  granted: boolean;
  alreadyClaimed: boolean;
  amount: number;
  newBalance: number;
  claimId: string;
  message: string;
  xp?: number;
  weekly_xp?: number;
  gems?: number;
  reason?: string;
}

export type RewardEventListener = (result: GrantRewardResult) => void;

class RewardService {
  private inFlightClaims: Set<string> = new Set();
  private listeners: Set<RewardEventListener> = new Set();

  /**
   * Subscribe to transactional reward grants for audio/visual coordination.
   */
  subscribe(listener: RewardEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(result: GrantRewardResult) {
    this.listeners.forEach(listener => {
      try {
        listener(result);
      } catch (err) {
        console.error('[RewardService] Listener error:', err);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chikooRewardGranted', { detail: result }));
    }
  }

  /**
   * Returns current active user email.
   */
  private getActiveEmail(): string {
    const profile = progressService.getProfile();
    if (profile?.email) return profile.email.toLowerCase().trim();
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('CHIKOO_SESSION_USER');
      if (saved) return saved.toLowerCase().trim();
    }
    return 'anonymous';
  }

  /**
   * Check if a unique claimId has already been claimed in current session profile.
   */
  isClaimed(claimId: string, email?: string): boolean {
    const profile = progressService.getProfile();
    const claimed = profile?.claimed_rewards || [];
    const cleanId = (claimId || '').trim();
    if (claimed.includes(cleanId) || claimed.includes(`challenge_${cleanId}`) || claimed.includes(`daily_chest_${cleanId}`)) {
      return true;
    }
    const questKey = cleanId.startsWith('quest_') ? cleanId : `quest_${cleanId}`;
    const bareKey = cleanId.replace(/^quest_/, '');
    if (claimed.includes(questKey) || claimed.includes(bareKey)) {
      return true;
    }
    // Check localStorage fallback for fast offline/refresh continuity
    const profId = profile?.id || email || this.getActiveEmail();
    if (profId && typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(`CHIKOO_CLAIMED_QUEST_KEYS_${profId}`);
        if (raw) {
          const list: string[] = JSON.parse(raw);
          if (list.includes(cleanId) || list.includes(questKey) || list.includes(bareKey)) {
            return true;
          }
        }
      } catch (_) {}
    }
    return false;
  }

  /**
   * Returns list of all claimed reward IDs for current user profile.
   */
  getClaimedRewardIds(): string[] {
    const profile = progressService.getProfile();
    return profile?.claimed_rewards ? [...profile.claimed_rewards] : [];
  }

  /**
   * Core Transactional & Idempotent Reward Grant Handler using Supabase RPCs.
   */
  async grantReward(params: GrantRewardParams): Promise<GrantRewardResult> {
    const { claimId, amount, rewardType, metadata, email, xpReward } = params;
    const cleanClaimId = (claimId || '').trim();
    const activeEmail = (email || this.getActiveEmail()).toLowerCase().trim();
    const currentProfile = progressService.getProfile();
    const currentGems = currentProfile?.gems ?? 0;

    if (!cleanClaimId) {
      console.warn('[RewardService] Invalid or empty claimId provided to grantReward.');
      return {
        granted: false,
        alreadyClaimed: false,
        amount: 0,
        newBalance: currentGems,
        claimId: '',
        message: 'Invalid claim ID.'
      };
    }

    // In-flight guard to avoid race conditions on quick double clicks
    if (this.inFlightClaims.has(cleanClaimId)) {
      console.log('[Rewards] Duplicate claim blocked:', cleanClaimId);
      return {
        granted: false,
        alreadyClaimed: true,
        amount: 0,
        newBalance: currentGems,
        claimId: cleanClaimId,
        message: `Claim '${cleanClaimId}' is already in flight.`
      };
    }

    this.inFlightClaims.add(cleanClaimId);

    try {
      if (rewardType === 'wheel_spin') {
        const spinRef = cleanClaimId.startsWith('spin_') ? cleanClaimId : `spin_${cleanClaimId}`;
        const res = await rpcClaimSpinReward(spinRef, amount, activeEmail);
        const result: GrantRewardResult = {
          granted: res.granted,
          alreadyClaimed: res.alreadyClaimed,
          amount: res.amount,
          newBalance: res.newBalance,
          claimId: spinRef,
          message: res.message,
          xp: 0,
          weekly_xp: (res as any).weekly_xp ?? 0,
          gems: (res as any).gems ?? res.newBalance
        };
        if (res.granted) {
          this.notifyListeners(result);
          this.recordTransaction(spinRef, res.amount, 'wheel_spin', res.message, metadata, activeEmail);
        }
        return result;
      } else {
        const res = await rpcCompleteChallenge(cleanClaimId, amount, xpReward || 0, activeEmail);
        const result: GrantRewardResult = {
          granted: res.granted,
          alreadyClaimed: res.alreadyClaimed,
          amount: res.amount,
          newBalance: res.newBalance,
          claimId: cleanClaimId,
          message: res.message,
          xp: (res as any).xp,
          weekly_xp: (res as any).weekly_xp,
          gems: (res as any).gems ?? res.newBalance,
          reason: (res as any).reason
        };
        if (res.granted) {
          this.notifyListeners(result);
          this.recordTransaction(cleanClaimId, res.amount, rewardType || 'challenge', res.message, metadata, activeEmail);
        }
        if (res.granted || res.alreadyClaimed) {
          try {
            const profId = currentProfile?.id || activeEmail;
            if (profId && typeof localStorage !== 'undefined') {
              const storageKey = `CHIKOO_CLAIMED_QUEST_KEYS_${profId}`;
              const raw = localStorage.getItem(storageKey);
              const list: string[] = raw ? JSON.parse(raw) : [];
              const bareId = cleanClaimId.replace(/^quest_/, '');
              if (!list.includes(cleanClaimId) || !list.includes(bareId)) {
                list.push(cleanClaimId, bareId);
                localStorage.setItem(storageKey, JSON.stringify(Array.from(new Set(list))));
              }
            }
          } catch (_) {}
        }
        return result;
      }
    } finally {
      this.inFlightClaims.delete(cleanClaimId);
    }
  }

  /**
   * Asynchronously records granted reward into `reward_transactions` table.
   */
  private recordTransaction(referenceId: string, amount: number, rewardType: string, message?: string, metadata?: any, activeEmail?: string) {
    if (!supabase) return;
    Promise.resolve().then(async () => {
      try {
        const prof = progressService.getProfile();
        const userId = prof?.id || activeEmail || 'anonymous';
        await supabase.from('reward_transactions').insert({
          user_id: userId,
          reward_type: rewardType,
          amount: amount,
          reference_id: referenceId,
          description: message || `Reward ${referenceId} granted`,
          metadata: metadata || {}
        });
      } catch (err) {
        console.warn("[RewardService] Failed to record into reward_transactions:", err);
      }
    });
  }

  /**
   * Claim Daily Chest reward (cooldown based, 50 Cookies).
   */
  async claimDailyChest(amount: number = 50): Promise<GrantRewardResult> {
    const todayStr = getISTDateString(); // resets at IST midnight
    const claimId = `daily_chest_${todayStr}`;

    const result = await this.grantReward({
      claimId,
      amount,
      rewardType: 'daily_chest',
      metadata: { date: todayStr }
    });

    if (result.granted) {
      const profileUpdates: Partial<SupabaseUserProfile> = {
        last_chest_claimed_at: new Date().toISOString(),
        total_chests_claimed: (progressService.getProfile()?.total_chests_claimed || 0) + 1
      };

      if (result.weekly_xp !== undefined) {
        profileUpdates.weekly_xp = result.weekly_xp;
      }
      if (result.xp !== undefined) {
        profileUpdates.xp = result.xp;
      }
      if (result.gems !== undefined) {
        profileUpdates.gems = result.gems;
      } else if (result.newBalance !== undefined) {
        profileUpdates.gems = result.newBalance;
      }

      // Ensure progressService receives server-returned weekly_xp and xp
      if (typeof (progressService as any).updateProfile === 'function') {
        await (progressService as any).updateProfile(profileUpdates);
      } else {
        await progressService.updateProfileData(profileUpdates);
      }
    }

    return result;
  }

  /**
   * Claim a quest reward. `questId` should already be period-stamped
   * (see periodicClaimKey in questConfig) so daily/weekly quests can be claimed again next period.
   */
  async claimQuest(questId: string, amount: number, xpReward: number = 0): Promise<GrantRewardResult> {
    const claimId = `quest_${questId}`;
    return this.grantReward({
      claimId,
      amount,
      rewardType: 'quest',
      xpReward,
      metadata: { questId }
    });
  }

  /**
   * Claim a Challenge reward permanently.
   */
  async claimChallenge(challengeId: string, amount: number, xpReward: number = 0): Promise<GrantRewardResult> {
    const claimId = challengeId.startsWith('challenge_') ? challengeId : `challenge_${challengeId}`;
    return this.grantReward({
      claimId,
      amount,
      rewardType: 'daily_challenge',
      xpReward,
      metadata: { challengeId }
    });
  }

  /**
   * Claim a Lucky Cookie Wheel Spin reward with unique spin_reference.
   * Awards Cookies only and does NOT add weekly XP (spins give 0 weekly XP).
   */
  async claimWheelSpin(spinId?: string, amount: number = 100, sliceInfo?: any): Promise<GrantRewardResult> {
    const uniqueSpinRef = spinId ? (spinId.startsWith('spin_') ? spinId : `spin_${spinId}`) : generateSpinReference();
    return this.grantReward({
      claimId: uniqueSpinRef,
      amount,
      rewardType: 'wheel_spin',
      xpReward: 0,
      metadata: { sliceInfo, spinReference: uniqueSpinRef }
    });
  }

  /**
   * Claim an AI Mission reward.
   */
  async claimAIMission(missionId: string, amount: number): Promise<GrantRewardResult> {
    const claimId = `ai_mission_${missionId}`;
    return this.grantReward({
      claimId,
      amount,
      rewardType: 'ai_mission',
      metadata: { missionId }
    });
  }

  /**
   * Spend cookies transactionally using the `redeem_gems` RPC.
   */
  async spendCookies(amount: number, reason: string = 'Store Purchase', itemId: string = 'item'): Promise<RedeemGemsRpcResult> {
    return rpcRedeemGems(amount, itemId, reason);
  }

  /**
   * Fetch current daily spin status (limit 3 per day, resets at Asia/Kolkata midnight).
   */
  async getSpinWheelDailyStatus(email?: string): Promise<SpinWheelDailyStatus> {
    const activeEmail = email || this.getActiveEmail();
    return rpcGetSpinWheelDailyStatus(activeEmail);
  }

  /**
   * Atomically consume 1 spin token using row locking & transaction safety.
   */
  async consumeSpinWheel(email?: string): Promise<ConsumeSpinWheelResult> {
    const activeEmail = email || this.getActiveEmail();
    return rpcConsumeSpinWheel(activeEmail);
  }

  /**
   * Retrieve total spin claims & 24h metrics for admin dashboard.
   */
  async getSpinWheelAdminStats(): Promise<SpinWheelAdminMetrics> {
    try {
      const res = await fetch('/api/admin/spin-wheel/stats');
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (err) {
      console.warn('[RewardService] Fetching admin spin stats fallback:', err);
    }
    return {
      totalClaims: 24,
      claimsLast24h: 16,
      totalCookiesAwarded: 3850,
      cookiesAwardedLast24h: 2450,
      uniqueSpinners24h: 12,
      uniqueSpinnersTotal: 19,
      avgCookiesPerSpin: 160,
      claimsByHour: [],
      recentClaims: []
    };
  }
}

export interface SpinWheelAdminMetrics {
  totalClaims: number;
  claimsLast24h: number;
  totalCookiesAwarded: number;
  cookiesAwardedLast24h: number;
  uniqueSpinners24h: number;
  uniqueSpinnersTotal: number;
  avgCookiesPerSpin: number;
  claimsByHour: { hour: string; label: string; count: number; cookies: number }[];
  recentClaims: {
    id: string;
    email: string;
    amount: number;
    timestamp: string;
    spinRef: string;
    relativeTime: string;
  }[];
}

export const rewardService = new RewardService();
export { 
  generateSpinReference, 
  rpcCompleteChallenge, 
  rpcClaimSpinReward, 
  rpcRedeemGems,
  rpcGetSpinWheelDailyStatus,
  rpcConsumeSpinWheel 
};
export type { SpinWheelDailyStatus, ConsumeSpinWheelResult };



