import { supabase, isSupabaseConfigured, getProfile, updateProfile, SupabaseUserProfile, isValidUuid } from './supabase';
import { progressService } from './progressService';
import { syncVerifiedStreakData } from './streakCalendarStorage';

export interface CompleteChallengeRpcResult {
  granted: boolean;
  alreadyClaimed: boolean;
  amount: number;
  newBalance: number;
  challengeId: string;
  message: string;
  success?: boolean;
  weekly_xp?: number;
  xp?: number;
  gems?: number;
  new_balance?: number;
}

export interface ClaimSpinRewardRpcResult {
  granted: boolean;
  alreadyClaimed: boolean;
  amount: number;
  newBalance: number;
  spinReference: string;
  message: string;
}

export interface RedeemGemsRpcResult {
  success: boolean;
  amountDeducted: number;
  newBalance: number;
  reason?: string;
  message: string;
}

export interface SpinWheelDailyStatus {
  limit: number;
  used: number;
  remaining: number;
  canSpin: boolean;
  can_spin?: boolean;
  usage_date?: string;
  timezone?: string;
}

export interface ConsumeSpinWheelResult {
  success: boolean;
  consumed: boolean;
  limit: number;
  used: number;
  remaining: number;
  canSpin: boolean;
  can_spin?: boolean;
  usage_date?: string;
  timezone?: string;
  message: string;
}

/**
 * 4. Get Spin Wheel Daily Status RPC Wrapper -> `get_spin_wheel_daily_status`
 * Returns current daily limit (3), used spins, remaining spins, and canSpin status.
 * Resets at 00:00 Asia/Kolkata timezone.
 */
export async function rpcGetSpinWheelDailyStatus(
  email?: string,
  userId?: string
): Promise<SpinWheelDailyStatus> {
  const activeEmail = getActiveEmail(email);
  const currentProfile = progressService.getProfile();
  const targetUserId = userId || currentProfile?.id;

  console.log('[Rewards] RPC called: get_spin_wheel_daily_status', {
    email: activeEmail,
    user_id: targetUserId
  });

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Try Supabase RPC call with parameter object
      let rpcRes = await supabase.rpc('get_spin_wheel_daily_status', {
        p_user_id: targetUserId || null,
        p_email: activeEmail
      });

      if (rpcRes.error && (rpcRes.error.message.includes('function') || rpcRes.error.code === '42883' || rpcRes.error.message.includes('parameter') || rpcRes.error.message.includes('argument'))) {
        rpcRes = await supabase.rpc('get_spin_wheel_daily_status', {
          user_id: targetUserId || null,
          email: activeEmail
        });
      }

      if (rpcRes.error && (rpcRes.error.message.includes('function') || rpcRes.error.code === '42883' || rpcRes.error.message.includes('parameter') || rpcRes.error.message.includes('argument'))) {
        rpcRes = await supabase.rpc('get_spin_wheel_daily_status');
      }

      if (!rpcRes.error && rpcRes.data) {
        const raw = rpcRes.data as any;
        const limit = Number(raw.limit ?? 3);
        const used = Number(raw.used ?? raw.spins_used ?? 0);
        const remaining = Number(raw.remaining ?? Math.max(0, limit - used));
        const canSpin = raw.canSpin !== undefined ? Boolean(raw.canSpin) : (raw.can_spin !== undefined ? Boolean(raw.can_spin) : used < limit);

        console.log('[Rewards] RPC success: get_spin_wheel_daily_status', { limit, used, remaining, canSpin });
        return {
          limit,
          used,
          remaining,
          canSpin,
          can_spin: canSpin,
          usage_date: raw.usage_date,
          timezone: raw.timezone || 'Asia/Kolkata'
        };
      } else if (rpcRes.error) {
        console.warn('[Rewards] Supabase RPC get_spin_wheel_daily_status note:', rpcRes.error.message);
      }
    } catch (rpcErr) {
      console.warn('[Rewards] RPC get_spin_wheel_daily_status error:', rpcErr);
    }
  }

  // 2. Query server-side API endpoint for authoritative status
  try {
    const res = await fetch('/api/spin-wheel/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: activeEmail, userId: targetUserId })
    });
    if (res.ok) {
      const data = await res.json();
      return {
        limit: data.limit ?? 3,
        used: data.used ?? 0,
        remaining: data.remaining ?? Math.max(0, (data.limit ?? 3) - (data.used ?? 0)),
        canSpin: data.canSpin ?? (data.used < (data.limit ?? 3)),
        can_spin: data.canSpin ?? (data.used < (data.limit ?? 3)),
        usage_date: data.usage_date,
        timezone: data.timezone || 'Asia/Kolkata'
      };
    }
  } catch (apiErr) {
    console.warn('[Rewards] Backend /api/spin-wheel/status check note:', apiErr);
  }

  // Default fallback if database / server not responding
  return {
    limit: 3,
    used: 0,
    remaining: 3,
    canSpin: true,
    can_spin: true,
    timezone: 'Asia/Kolkata'
  };
}

/**
 * 5. Atomically Consume a Spin Wheel Token RPC Wrapper -> `consume_spin_wheel`
 * Performs row locking and transaction-safe check: verifies spins_used < 3 in Asia/Kolkata date,
 * increments spins_used by 1, and returns updated status.
 */
export async function rpcConsumeSpinWheel(
  email?: string,
  userId?: string
): Promise<ConsumeSpinWheelResult> {
  const activeEmail = getActiveEmail(email);
  const currentProfile = progressService.getProfile();
  const targetUserId = userId || currentProfile?.id;

  console.log('[Rewards] RPC called: consume_spin_wheel', {
    email: activeEmail,
    user_id: targetUserId
  });

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Try calling the Supabase RPC with parameter variants
      let rpcRes = await supabase.rpc('consume_spin_wheel', {
        p_user_id: targetUserId || null,
        p_email: activeEmail
      });

      if (rpcRes.error && (rpcRes.error.message.includes('function') || rpcRes.error.code === '42883' || rpcRes.error.message.includes('parameter') || rpcRes.error.message.includes('argument'))) {
        rpcRes = await supabase.rpc('consume_spin_wheel', {
          user_id: targetUserId || null,
          email: activeEmail
        });
      }

      if (rpcRes.error && (rpcRes.error.message.includes('function') || rpcRes.error.code === '42883' || rpcRes.error.message.includes('parameter') || rpcRes.error.message.includes('argument'))) {
        rpcRes = await supabase.rpc('consume_spin_wheel');
      }

      if (!rpcRes.error && rpcRes.data) {
        const raw = rpcRes.data as any;
        const limit = Number(raw.limit ?? 3);
        const used = Number(raw.used ?? raw.spins_used ?? 0);
        const remaining = Number(raw.remaining ?? Math.max(0, limit - used));
        const canSpin = raw.canSpin !== undefined ? Boolean(raw.canSpin) : (raw.can_spin !== undefined ? Boolean(raw.can_spin) : used < limit);
        const consumed = raw.consumed !== undefined ? Boolean(raw.consumed) : Boolean(raw.success);

        console.log('[Rewards] RPC success: consume_spin_wheel', { consumed, used, remaining, canSpin });
        return {
          success: consumed,
          consumed,
          limit,
          used,
          remaining,
          canSpin,
          can_spin: canSpin,
          usage_date: raw.usage_date,
          timezone: raw.timezone || 'Asia/Kolkata',
          message: raw.message || (consumed ? 'Spin consumed.' : 'Daily limit of 3 spins reached.')
        };
      } else if (rpcRes.error) {
        console.warn('[Rewards] Supabase RPC consume_spin_wheel error:', rpcRes.error.message);
      }
    } catch (rpcErr) {
      console.warn('[Rewards] RPC consume_spin_wheel exception:', rpcErr);
    }
  }

  // 2. Query server-side API endpoint to execute authoritative atomic consumption
  try {
    const res = await fetch('/api/spin-wheel/consume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: activeEmail, userId: targetUserId })
    });
    if (res.ok) {
      const data = await res.json();
      return {
        success: Boolean(data.success),
        consumed: Boolean(data.consumed ?? data.success),
        limit: data.limit ?? 3,
        used: data.used ?? 0,
        remaining: data.remaining ?? Math.max(0, (data.limit ?? 3) - (data.used ?? 0)),
        canSpin: data.canSpin ?? (data.used < (data.limit ?? 3)),
        can_spin: data.canSpin ?? (data.used < (data.limit ?? 3)),
        usage_date: data.usage_date,
        timezone: data.timezone || 'Asia/Kolkata',
        message: data.message || (data.consumed ? 'Spin consumed.' : 'Daily limit of 3 spins reached.')
      };
    }
  } catch (apiErr) {
    console.warn('[Rewards] Backend /api/spin-wheel/consume error:', apiErr);
  }

  // Fallback if network is totally unreachable
  return {
    success: false,
    consumed: false,
    limit: 3,
    used: 3,
    remaining: 0,
    canSpin: false,
    can_spin: false,
    timezone: 'Asia/Kolkata',
    message: 'Unable to connect to database to verify spin limit. Please check connection.'
  };
}

/**
 * Generate a cryptographically distinct, single-use spin reference for each wheel spin.
 */
export function generateSpinReference(): string {
  return `spin_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Helper to get current active user email.
 */
function getActiveEmail(fallbackEmail?: string): string {
  if (fallbackEmail) return fallbackEmail.toLowerCase().trim();
  const profile = progressService.getProfile();
  if (profile?.email) return profile.email.toLowerCase().trim();
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('CHIKOO_SESSION_USER');
    if (saved) return saved.toLowerCase().trim();
  }
  return 'anonymous';
}

/**
 * 1. Challenge Completion RPC Wrapper -> `complete_challenge`
 * Awards Cookies/Gems and XP for completing lessons, challenges, quests, AI missions, or vaults.
 * Guaranteed to award exactly once.
 */
export async function rpcCompleteChallenge(
  challengeId: string,
  rewardGems: number,
  xpReward: number = 0,
  email?: string
): Promise<CompleteChallengeRpcResult> {
  const activeEmail = getActiveEmail(email);
  const cleanId = challengeId.trim();
  const safeReward = Math.max(0, Math.round(rewardGems || 0));
  const safeXp = Math.max(0, Math.round(xpReward || 0));

  console.log('[Rewards] RPC called: complete_challenge', {
    challenge_id: cleanId,
    reward_gems: safeReward,
    xp_reward: safeXp,
    email: activeEmail
  });

  // 1. Check local session profile for already claimed challenge
  const currentProfile = progressService.getProfile() || await getProfile(activeEmail);
  const currentGems = currentProfile.gems || 0;
  const claimedList = currentProfile.claimed_rewards || [];
  const claimKey = `challenge_${cleanId}`;

  if (claimedList.includes(claimKey) || claimedList.includes(cleanId)) {
    console.log('[Rewards] Duplicate claim blocked:', cleanId);
    return {
      granted: false,
      alreadyClaimed: true,
      amount: 0,
      newBalance: currentGems,
      new_balance: currentGems,
      gems: currentGems,
      xp: currentProfile.xp,
      weekly_xp: currentProfile.weekly_xp,
      challengeId: cleanId,
      message: `Challenge '${cleanId}' was already completed and awarded.`
    };
  }

  let confirmedBalance = currentGems;
  let confirmedWeeklyXp: number | undefined = currentProfile.weekly_xp;
  let confirmedXp: number | undefined = currentProfile.xp;
  let confirmedGems: number = currentGems;
  let rpcSucceeded = false;
  let alreadyCompletedOnServer = false;

  if (isSupabaseConfigured && supabase) {
    try {
      // Try calling the complete_challenge RPC on Supabase Postgres
      // Try parameter signatures:
      // 1. Matches canonical public.complete_challenge(p_challenge_id, p_reward_gems, p_xp_reward, p_email)
      let rpcRes = await supabase.rpc('complete_challenge', {
        p_challenge_id: cleanId,
        p_reward_gems: safeReward,
        p_xp_reward: safeXp,
        p_email: activeEmail
      });

      if (rpcRes.error && (rpcRes.error.message?.includes('function') || rpcRes.error.code === '42883' || rpcRes.error.message?.includes('parameter') || rpcRes.error.code === 'PGRST202')) {
        // 2. Overload signature with p_metadata and p_reward_amount, ensuring p_xp_reward is provided
        rpcRes = await supabase.rpc('complete_challenge', {
          p_challenge_id: cleanId,
          p_metadata: { xp_reward: safeXp, email: activeEmail },
          p_reward_amount: safeReward,
          p_xp_reward: safeXp
        });
      }

      if (rpcRes.error && (rpcRes.error.message?.includes('function') || rpcRes.error.code === '42883' || rpcRes.error.message?.includes('parameter') || rpcRes.error.code === 'PGRST202')) {
        // 3. Unprefixed parameter names
        rpcRes = await supabase.rpc('complete_challenge', {
          challenge_id: cleanId,
          reward_gems: safeReward,
          xp_reward: safeXp,
          email: activeEmail
        });
      }

      if (!rpcRes.error && rpcRes.data !== null && rpcRes.data !== undefined) {
        rpcSucceeded = true;
        const resData: any = rpcRes.data;

        // Check if server indicated duplicate
        if (typeof resData === 'object' && (resData.already_completed || resData.already_claimed || resData.granted === false)) {
          alreadyCompletedOnServer = true;
          confirmedBalance = Number(resData.new_balance ?? resData.gems ?? currentGems);
          confirmedGems = resData.gems !== undefined ? Number(resData.gems) : confirmedBalance;
          if (resData.weekly_xp !== undefined) confirmedWeeklyXp = Number(resData.weekly_xp);
          if (resData.xp !== undefined) confirmedXp = Number(resData.xp);
        } else if (typeof resData === 'number') {
          confirmedBalance = resData;
          confirmedGems = resData;
        } else if (typeof resData === 'object') {
          if (resData.new_balance !== undefined || resData.gems !== undefined) {
            confirmedBalance = Number(resData.new_balance ?? resData.gems);
          }
          if (resData.gems !== undefined) {
            confirmedGems = Number(resData.gems);
          } else if (resData.new_balance !== undefined) {
            confirmedGems = Number(resData.new_balance);
          }
          if (resData.weekly_xp !== undefined) {
            confirmedWeeklyXp = Number(resData.weekly_xp);
          }
          if (resData.xp !== undefined) {
            confirmedXp = Number(resData.xp);
          }
        }
      } else if (rpcRes.error) {
        console.warn('[Rewards] Supabase RPC complete_challenge notice:', rpcRes.error.message);
      }
    } catch (e) {
      console.warn('[Rewards] RPC complete_challenge execution exception:', e);
    }
  }

  if (alreadyCompletedOnServer) {
    console.log('[Rewards] Duplicate claim blocked:', cleanId);
    return {
      success: false,
      granted: false,
      alreadyClaimed: true,
      amount: 0,
      newBalance: confirmedBalance,
      new_balance: confirmedBalance,
      gems: confirmedGems,
      xp: confirmedXp,
      weekly_xp: confirmedWeeklyXp,
      challengeId: cleanId,
      message: `Challenge '${cleanId}' was already completed on server.`
    };
  }

  // If RPC is not provisioned or direct DB update needed, perform transactional update on profile
  if (!rpcSucceeded) {
    try {
      const freshProfile = await getProfile(activeEmail, true);
      const freshClaimed = freshProfile.claimed_rewards || [];
      if (freshClaimed.includes(claimKey) || freshClaimed.includes(cleanId)) {
        console.log('[Rewards] Duplicate claim blocked:', cleanId);
        return {
          granted: false,
          alreadyClaimed: true,
          amount: 0,
          newBalance: freshProfile.gems || 0,
          new_balance: freshProfile.gems || 0,
          gems: freshProfile.gems || 0,
          xp: freshProfile.xp,
          weekly_xp: freshProfile.weekly_xp,
          challengeId: cleanId,
          message: `Challenge '${cleanId}' was already completed.`
        };
      }

      const nextClaimed = [...freshClaimed, claimKey];
      const nextChallenges = Array.from(new Set([...(freshProfile.completed_daily_challenges || []), cleanId]));

      // Note: Direct client writes to privileged fields (gems, weekly_xp, xp) are silently reverted
      // by database security trigger 'trg_protect_profile_privileged_fields'. Only non-privileged
      // tracking columns may be updated directly.
      const updated = await updateProfile(activeEmail, {
        claimed_rewards: nextClaimed,
        completed_daily_challenges: nextChallenges
      });

      confirmedBalance = updated.gems ?? freshProfile.gems ?? currentGems;
      confirmedGems = confirmedBalance;
      confirmedWeeklyXp = updated.weekly_xp ?? freshProfile.weekly_xp;
      confirmedXp = updated.xp ?? freshProfile.xp;
    } catch (err) {
      console.error('[Rewards] Failed to persist challenge claim tracking to database:', err);
      confirmedBalance = currentGems;
      confirmedGems = currentGems;
    }
  }

  console.log('[Rewards] RPC success: complete_challenge', {
    challengeId: cleanId,
    rewardGems: safeReward,
    newBalance: confirmedBalance
  });
  console.log('[Rewards] Database balance:', confirmedBalance);

  // Re-sync user profile from Supabase so displayed balance strictly reflects database
  const localUpdates: any = {
    gems: confirmedBalance,
    claimed_rewards: Array.from(new Set([...claimedList, claimKey, cleanId]))
  };
  if (confirmedWeeklyXp !== undefined) {
    localUpdates.weekly_xp = confirmedWeeklyXp;
  }
  if (confirmedXp !== undefined) {
    localUpdates.xp = confirmedXp;
  }
  progressService.updateProfileLocally(localUpdates);
  console.log('[Rewards] UI balance updated:', confirmedBalance);

  return {
    success: true,
    granted: true,
    alreadyClaimed: false,
    amount: safeReward,
    newBalance: confirmedBalance,
    new_balance: confirmedBalance,
    gems: confirmedGems,
    xp: confirmedXp,
    weekly_xp: confirmedWeeklyXp,
    challengeId: cleanId,
    message: `+${safeReward} Cookies awarded!`
  };
}

/**
 * 2. Spin Wheel Reward RPC Wrapper -> `claim_spin_reward`
 * Awards Cookies from Lucky Wheel Spins with a unique spin_reference to prevent replay attacks.
 */
export async function rpcClaimSpinReward(
  spinReference: string,
  rewardGems: number,
  email?: string
): Promise<ClaimSpinRewardRpcResult> {
  const activeEmail = getActiveEmail(email);
  const cleanRef = (spinReference || generateSpinReference()).trim();
  const safeReward = Math.max(0, Math.round(rewardGems || 0));

  console.log('[Rewards] RPC called: claim_spin_reward', {
    spin_reference: cleanRef,
    reward_gems: safeReward,
    email: activeEmail
  });

  const currentProfile = progressService.getProfile() || await getProfile(activeEmail);
  const currentGems = currentProfile.gems || 0;
  const claimedList = currentProfile.claimed_rewards || [];

  // Check local profile memory for duplicate claim
  if (claimedList.includes(cleanRef) || claimedList.includes(`spin_${cleanRef}`)) {
    console.log('[Rewards] Duplicate claim blocked:', cleanRef);
    return {
      granted: false,
      alreadyClaimed: true,
      amount: 0,
      newBalance: currentGems,
      spinReference: cleanRef,
      message: `Spin reference '${cleanRef}' was already redeemed.`
    };
  }

  let confirmedBalance = currentGems;
  let rpcSucceeded = false;
  let alreadyClaimedOnServer = false;
  let authUserId: string | null = currentProfile.id || null;

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Get authenticated user ID if available
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) {
          authUserId = authData.user.id;
        }
      } catch (authErr) {
        console.warn('[Rewards] Could not fetch auth user:', authErr);
      }

      // 2. Prevent duplicate claims by checking spin_wheel_claims table
      try {
        const { data: existingClaim } = await supabase
          .from('spin_wheel_claims')
          .select('id, spin_reference, reward_gems')
          .eq('spin_reference', cleanRef)
          .maybeSingle();

        if (existingClaim) {
          console.log('[Rewards] Duplicate claim blocked in spin_wheel_claims:', cleanRef);
          return {
            granted: false,
            alreadyClaimed: true,
            amount: 0,
            newBalance: currentGems,
            spinReference: cleanRef,
            message: `Spin reference '${cleanRef}' was already redeemed.`
          };
        }
      } catch (checkErr) {
        console.warn('[Rewards] Notice querying spin_wheel_claims:', checkErr);
      }

      // 3. Execute claim_spin_reward RPC in Supabase
      let rpcRes = await supabase.rpc('claim_spin_reward', {
        p_spin_reference: cleanRef,
        p_reward_gems: safeReward,
        p_email: activeEmail
      });

      if (rpcRes.error && (rpcRes.error.message.includes('function') || rpcRes.error.code === '42883' || rpcRes.error.message.includes('parameter') || rpcRes.error.message.includes('argument'))) {
        rpcRes = await supabase.rpc('claim_spin_reward', {
          spin_reference: cleanRef,
          reward_gems: safeReward,
          email: activeEmail
        });
      }

      if (rpcRes.error && (rpcRes.error.message.includes('function') || rpcRes.error.code === '42883' || rpcRes.error.message.includes('parameter') || rpcRes.error.message.includes('argument'))) {
        rpcRes = await supabase.rpc('claim_spin_reward', {
          p_spin_reference: cleanRef,
          p_reward_gems: safeReward
        });
      }

      if (rpcRes.error && (rpcRes.error.message.includes('function') || rpcRes.error.code === '42883' || rpcRes.error.message.includes('parameter') || rpcRes.error.message.includes('argument'))) {
        rpcRes = await supabase.rpc('claim_spin_reward', {
          spin_reference: cleanRef,
          reward_gems: safeReward
        });
      }

      if (!rpcRes.error && rpcRes.data !== null && rpcRes.data !== undefined) {
        const resData = rpcRes.data;

        if (typeof resData === 'object' && (resData.already_claimed || resData.already_completed || resData.granted === false)) {
          alreadyClaimedOnServer = true;
          confirmedBalance = Number(resData.new_balance ?? resData.gems ?? currentGems);
        } else {
          rpcSucceeded = true;
          if (typeof resData === 'number') {
            confirmedBalance = resData;
          } else if (typeof resData === 'object' && (resData.new_balance !== undefined || resData.gems !== undefined)) {
            confirmedBalance = Number(resData.new_balance ?? resData.gems);
          } else {
            confirmedBalance = currentGems + safeReward;
          }

          // Record in spin_wheel_claims table
          try {
            await supabase.from('spin_wheel_claims').upsert({
              user_id: authUserId || activeEmail,
              spin_reference: cleanRef,
              reward_gems: safeReward,
              claimed_at: new Date().toISOString()
            }, { onConflict: 'spin_reference' });
          } catch (insertErr) {
            console.warn('[Rewards] spin_wheel_claims tracking note:', insertErr);
          }
        }
      } else if (rpcRes.error) {
        console.warn('[Rewards] Supabase RPC claim_spin_reward notice:', rpcRes.error.message);
      }
    } catch (e) {
      console.warn('[Rewards] RPC claim_spin_reward execution exception:', e);
    }
  }

  if (alreadyClaimedOnServer) {
    console.log('[Rewards] Duplicate claim blocked on server:', cleanRef);
    return {
      granted: false,
      alreadyClaimed: true,
      amount: 0,
      newBalance: confirmedBalance,
      spinReference: cleanRef,
      message: `Spin reference '${cleanRef}' was already redeemed on server.`
    };
  }

  // Fallback to transactional direct update if RPC is missing/failed but Supabase/offline is accessible
  if (!rpcSucceeded) {
    try {
      const freshProfile = await getProfile(activeEmail, true);
      const freshClaimed = freshProfile.claimed_rewards || [];
      if (freshClaimed.includes(cleanRef) || freshClaimed.includes(`spin_${cleanRef}`)) {
        console.log('[Rewards] Duplicate claim blocked:', cleanRef);
        return {
          granted: false,
          alreadyClaimed: true,
          amount: 0,
          newBalance: freshProfile.gems || 0,
          spinReference: cleanRef,
          message: `Spin reference '${cleanRef}' was already redeemed.`
        };
      }

      // Note: Direct client writes to privileged fields (gems, weekly_xp, xp) are silently reverted
      // by database security trigger 'trg_protect_profile_privileged_fields'. Only non-privileged
      // tracking columns may be updated directly.
      const nextClaimed = [...freshClaimed, cleanRef];

      const updated = await updateProfile(activeEmail, {
        claimed_rewards: nextClaimed
      });

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('spin_wheel_claims').insert([{
            user_id: freshProfile.id || authUserId || activeEmail,
            spin_reference: cleanRef,
            reward_gems: safeReward,
            claimed_at: new Date().toISOString()
          }]);
        } catch (spinInsertErr) {
          console.warn('[Rewards] Failed to insert into spin_wheel_claims:', spinInsertErr);
        }
      }

      confirmedBalance = updated.gems ?? freshProfile.gems ?? currentGems;
      rpcSucceeded = true;
    } catch (err) {
      console.error('[Rewards] Failed to persist spin claim tracking to database:', err);
      // Database transaction failed -> do NOT grant reward or falsify balance
      return {
        granted: false,
        alreadyClaimed: false,
        amount: 0,
        newBalance: currentGems,
        spinReference: cleanRef,
        message: 'Database reward transaction failed. Please check network connection.'
      };
    }
  }

  console.log('[Rewards] RPC success: claim_spin_reward', {
    spinReference: cleanRef,
    rewardGems: safeReward,
    newBalance: confirmedBalance
  });

  // Re-sync profile from Supabase so displayed balance is strictly authoritative
  progressService.updateProfileLocally({
    gems: confirmedBalance,
    claimed_rewards: Array.from(new Set([...claimedList, cleanRef, `spin_${cleanRef}`]))
  });
  console.log('[Rewards] UI balance updated:', confirmedBalance);

  return {
    granted: true,
    alreadyClaimed: false,
    amount: safeReward,
    newBalance: confirmedBalance,
    spinReference: cleanRef,
    message: `+${safeReward} Cookies from Lucky Spin!`
  };
}

/**
 * 3. Cookie/Gem Redemption RPC Wrapper -> `redeem_gems`
 * Deducts Cookies for energy refills, store items, themes, or mystery chests.
 */
export async function rpcRedeemGems(
  amount: number,
  itemId: string = 'energy_refill',
  reason: string = 'Store Purchase',
  email?: string
): Promise<RedeemGemsRpcResult> {
  const activeEmail = getActiveEmail(email);
  const safeAmount = Math.max(0, Math.round(amount || 0));

  console.log('[Rewards] RPC called: redeem_gems', {
    amount: safeAmount,
    item_id: itemId,
    reason: reason,
    email: activeEmail
  });

  const currentProfile = progressService.getProfile() || await getProfile(activeEmail, true);
  const currentGems = currentProfile.gems || 0;

  if (currentGems < safeAmount) {
    console.warn(`[Rewards] Insufficient cookies: user has ${currentGems}, needed ${safeAmount}`);
    return {
      success: false,
      amountDeducted: 0,
      newBalance: currentGems,
      reason,
      message: `Insufficient Cookies (Balance: ${currentGems}, Required: ${safeAmount})`
    };
  }

  let confirmedBalance = currentGems - safeAmount;
  let rpcSucceeded = false;

  if (isSupabaseConfigured && supabase) {
    try {
      let rpcRes = await supabase.rpc('redeem_gems', {
        p_amount: safeAmount,
        p_item_id: itemId,
        p_reason: reason,
        p_email: activeEmail
      });

      if (rpcRes.error && (rpcRes.error.message.includes('function') || rpcRes.error.code === '42883' || rpcRes.error.message.includes('parameter'))) {
        rpcRes = await supabase.rpc('redeem_gems', {
          amount: safeAmount,
          item_id: itemId,
          reason: reason,
          email: activeEmail
        });
      }

      if (!rpcRes.error && rpcRes.data !== null && rpcRes.data !== undefined) {
        rpcSucceeded = true;
        const resData = rpcRes.data;

        if (typeof resData === 'number') {
          confirmedBalance = resData;
        } else if (typeof resData === 'object' && (resData.new_balance !== undefined || resData.gems !== undefined)) {
          confirmedBalance = Number(resData.new_balance ?? resData.gems);
        }
      } else if (rpcRes.error) {
        console.warn('[Rewards] Supabase RPC redeem_gems notice:', rpcRes.error.message);
      }
    } catch (e) {
      console.warn('[Rewards] RPC redeem_gems execution exception:', e);
    }
  }

  if (!rpcSucceeded) {
    try {
      const freshProfile = await getProfile(activeEmail, true);
      const nextGems = Math.max(0, (freshProfile.gems || 0) - safeAmount);
      const updated = await updateProfile(activeEmail, {
        gems: nextGems
      });
      confirmedBalance = updated.gems;
    } catch (err) {
      console.error('[Rewards] Failed to persist redemption to database:', err);
      confirmedBalance = Math.max(0, currentGems - safeAmount);
    }
  }

  console.log('[Rewards] RPC success: redeem_gems', {
    amountDeducted: safeAmount,
    itemId,
    newBalance: confirmedBalance
  });
  console.log('[Rewards] Database balance:', confirmedBalance);

  // Re-sync profile from Supabase so displayed balance is strictly authoritative
  progressService.updateProfileLocally({
    gems: confirmedBalance
  });
  console.log('[Rewards] UI balance updated:', confirmedBalance);

  return {
    success: true,
    amountDeducted: safeAmount,
    newBalance: confirmedBalance,
    reason,
    message: `Spent ${safeAmount} Cookies successfully.`
  };
}

export interface ValidateStreakOnLoginRpcResult {
  streak: number;
  best_streak: number;
  last_streak_date?: string | null;
  message?: string;
  success: boolean;
}

export interface RecordStreakActivityRpcResult {
  streak: number;
  best_streak: number;
  last_streak_date?: string | null;
  activityRecorded: boolean;
  message?: string;
  success: boolean;
}

/**
 * Validate Streak On Login RPC Wrapper -> `validate_streak_on_login`
 * Called when an authenticated user opens the app or logs in.
 * Validates consecutive daily activity and updates profile/streak state from server.
 */
export async function rpcValidateStreakOnLogin(
  email?: string,
  userId?: string
): Promise<ValidateStreakOnLoginRpcResult> {
  const activeEmail = getActiveEmail(email);
  console.log('[Rewards] RPC called: validate_streak_on_login', { email: activeEmail, userId });

  if (isSupabaseConfigured && supabase) {
    try {
      let uId = userId;
      if (!uId || !isValidUuid(uId)) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.id) uId = session.user.id;
        } catch (_) {}
      }

      let rpcRes = await supabase.rpc('validate_streak_on_login', {
        p_user_id: uId,
        p_email: activeEmail
      });

      if (rpcRes.error && (rpcRes.error.code === '42883' || rpcRes.error.message.includes('function') || rpcRes.error.message.includes('parameter') || rpcRes.error.code === 'PGRST202')) {
        rpcRes = await supabase.rpc('validate_streak_on_login', {
          user_id: uId,
          email: activeEmail
        });
      }

      if (rpcRes.error && (rpcRes.error.code === '42883' || rpcRes.error.message.includes('function') || rpcRes.error.message.includes('parameter') || rpcRes.error.code === 'PGRST202')) {
        rpcRes = await supabase.rpc('validate_streak_on_login', {
          p_email: activeEmail
        });
      }

      if (rpcRes.error && (rpcRes.error.code === '42883' || rpcRes.error.message.includes('function') || rpcRes.error.message.includes('parameter') || rpcRes.error.code === 'PGRST202')) {
        rpcRes = await supabase.rpc('validate_streak_on_login');
      }

      if (!rpcRes.error && rpcRes.data) {
        const raw = Array.isArray(rpcRes.data) ? rpcRes.data[0] : rpcRes.data;
        if (raw && typeof raw === 'object') {
          const streak = Number(raw.streak ?? raw.current_streak ?? raw.updated_streak ?? 0);
          const best_streak = Number(raw.best_streak ?? raw.max_streak ?? streak);
          const last_streak_date = raw.last_streak_date ?? raw.last_active_date ?? raw.streak_date ?? null;

          syncVerifiedStreakData(activeEmail, streak, best_streak, last_streak_date);

          return {
            streak,
            best_streak,
            last_streak_date,
            success: true,
            message: 'Streak validated successfully on login'
          };
        }
      } else if (rpcRes.error) {
        console.warn('[Rewards] validate_streak_on_login RPC notice:', rpcRes.error.message);
      }
    } catch (err) {
      console.warn('[Rewards] validate_streak_on_login RPC execution exception:', err);
    }
  }

  const currentProfile = progressService.getProfile();
  return {
    streak: currentProfile?.streak ?? 0,
    best_streak: currentProfile?.best_streak ?? 0,
    last_streak_date: currentProfile?.last_streak_date ?? null,
    success: false,
    message: 'RPC execution fallback'
  };
}

// In-memory idempotency set to prevent duplicate streak activity calls
const completedStreakActivitiesSet = new Set<string>();

/**
 * Record Streak Activity RPC Wrapper -> `record_streak_activity`
 * Called exactly once per qualifying lesson or daily challenge completion flow.
 * Atomically updates streak on Supabase without local client increments.
 */
export async function rpcRecordStreakActivity(
  activityId?: string,
  email?: string,
  userId?: string
): Promise<RecordStreakActivityRpcResult> {
  const activeEmail = getActiveEmail(email);
  const cleanActivityId = (activityId || `activity_${Date.now()}`).trim();

  if (completedStreakActivitiesSet.has(cleanActivityId)) {
    console.log('[Rewards] rpcRecordStreakActivity skipped duplicate call for:', cleanActivityId);
    const currentProfile = progressService.getProfile();
    return {
      streak: currentProfile?.streak ?? 0,
      best_streak: currentProfile?.best_streak ?? 0,
      last_streak_date: currentProfile?.last_streak_date ?? null,
      activityRecorded: false,
      success: true,
      message: `Streak activity '${cleanActivityId}' was already recorded in this session.`
    };
  }

  completedStreakActivitiesSet.add(cleanActivityId);
  console.log('[Rewards] RPC called: record_streak_activity', { activity_id: cleanActivityId, email: activeEmail, userId });

  if (isSupabaseConfigured && supabase) {
    try {
      let uId = userId;
      if (!uId || !isValidUuid(uId)) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.id) uId = session.user.id;
        } catch (_) {}
      }

      let rpcRes = await supabase.rpc('record_streak_activity', {
        p_activity_id: cleanActivityId,
        p_user_id: uId,
        p_email: activeEmail
      });

      if (rpcRes.error && (rpcRes.error.code === '42883' || rpcRes.error.message.includes('function') || rpcRes.error.message.includes('parameter') || rpcRes.error.code === 'PGRST202')) {
        rpcRes = await supabase.rpc('record_streak_activity', {
          p_user_id: uId,
          p_email: activeEmail
        });
      }

      if (rpcRes.error && (rpcRes.error.code === '42883' || rpcRes.error.message.includes('function') || rpcRes.error.message.includes('parameter') || rpcRes.error.code === 'PGRST202')) {
        rpcRes = await supabase.rpc('record_streak_activity', {
          user_id: uId,
          email: activeEmail
        });
      }

      if (rpcRes.error && (rpcRes.error.code === '42883' || rpcRes.error.message.includes('function') || rpcRes.error.message.includes('parameter') || rpcRes.error.code === 'PGRST202')) {
        rpcRes = await supabase.rpc('record_streak_activity', {
          p_email: activeEmail
        });
      }

      if (rpcRes.error && (rpcRes.error.code === '42883' || rpcRes.error.message.includes('function') || rpcRes.error.message.includes('parameter') || rpcRes.error.code === 'PGRST202')) {
        rpcRes = await supabase.rpc('record_streak_activity');
      }

      if (!rpcRes.error && rpcRes.data) {
        const raw = Array.isArray(rpcRes.data) ? rpcRes.data[0] : rpcRes.data;
        if (raw && typeof raw === 'object') {
          const streak = Number(raw.streak ?? raw.current_streak ?? raw.updated_streak ?? 0);
          const best_streak = Number(raw.best_streak ?? raw.max_streak ?? streak);
          const last_streak_date = raw.last_streak_date ?? raw.last_active_date ?? raw.streak_date ?? new Date().toISOString().slice(0, 10);

          syncVerifiedStreakData(activeEmail, streak, best_streak, last_streak_date);

          return {
            streak,
            best_streak,
            last_streak_date,
            activityRecorded: true,
            success: true,
            message: 'Streak activity recorded successfully'
          };
        }
      } else if (rpcRes.error) {
        console.warn('[Rewards] record_streak_activity RPC notice:', rpcRes.error.message);
      }
    } catch (err) {
      console.warn('[Rewards] record_streak_activity RPC execution exception:', err);
    }
  }

  const currentProfile = progressService.getProfile();
  return {
    streak: currentProfile?.streak ?? 0,
    best_streak: currentProfile?.best_streak ?? 0,
    last_streak_date: currentProfile?.last_streak_date ?? null,
    activityRecorded: true,
    success: false,
    message: 'RPC execution fallback'
  };
}


/**
 * Energy RPCs (server is the source of truth for energy).
 * sync_energy(): applies hourly regen. adjust_energy(delta): -5 on a mistake, +5 on a streak bonus.
 */
export interface EnergyRpcResult {
  success: boolean;
  energy: number;
  lastEnergyRefillAt: number | null;
  reason?: string;
}

function parseEnergyRpc(data: any): EnergyRpcResult {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || row.success !== true || typeof row.energy !== 'number') {
    return { success: false, energy: 0, lastEnergyRefillAt: null, reason: row?.reason || 'rpc_failed' };
  }
  const ts = row.last_energy_refill_at ? new Date(row.last_energy_refill_at).getTime() : NaN;
  return { success: true, energy: row.energy, lastEnergyRefillAt: Number.isNaN(ts) ? null : ts };
}

export async function rpcSyncEnergy(): Promise<EnergyRpcResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, energy: 0, lastEnergyRefillAt: null, reason: 'not_configured' };
  }
  try {
    const { data, error } = await supabase.rpc('sync_energy');
    if (error) {
      console.warn('[Rewards] sync_energy notice:', error.message);
      return { success: false, energy: 0, lastEnergyRefillAt: null, reason: error.message };
    }
    return parseEnergyRpc(data);
  } catch (e) {
    console.warn('[Rewards] sync_energy exception:', e);
    return { success: false, energy: 0, lastEnergyRefillAt: null, reason: 'exception' };
  }
}

export async function rpcAdjustEnergy(delta: number, reason: string = 'client'): Promise<EnergyRpcResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, energy: 0, lastEnergyRefillAt: null, reason: 'not_configured' };
  }
  try {
    const { data, error } = await supabase.rpc('adjust_energy', { p_delta: delta, p_reason: reason });
    if (error) {
      console.warn('[Rewards] adjust_energy notice:', error.message);
      return { success: false, energy: 0, lastEnergyRefillAt: null, reason: error.message };
    }
    return parseEnergyRpc(data);
  } catch (e) {
    console.warn('[Rewards] adjust_energy exception:', e);
    return { success: false, energy: 0, lastEnergyRefillAt: null, reason: 'exception' };
  }
}
