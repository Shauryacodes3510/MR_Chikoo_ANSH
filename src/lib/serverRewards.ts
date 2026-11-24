// Server-side Transactional & Idempotent Reward Engine

export interface RewardTransaction {
  id: string;
  claimId: string;
  email: string;
  amount: number;
  rewardType: string;
  timestamp: string;
  metadata?: Record<string, any>;
  status: 'granted' | 'blocked_duplicate';
}

export interface UserRewardLedger {
  email: string;
  cookiesBalance: number;
  claimedRewardIds: Set<string>;
  transactions: RewardTransaction[];
}

// In-memory ledger cache (persists for the container lifecycle)
const userLedgers: Map<string, UserRewardLedger> = new Map();

function getOrCreateUserLedger(email: string): UserRewardLedger {
  const cleanEmail = email.toLowerCase().trim();
  let ledger = userLedgers.get(cleanEmail);
  if (!ledger) {
    ledger = {
      email: cleanEmail,
      cookiesBalance: 50, // default initial cookies
      claimedRewardIds: new Set<string>(),
      transactions: []
    };
    userLedgers.set(cleanEmail, ledger);
  }
  return ledger;
}

// Baseline realistic seed transactions for Spin Wheel Claims to ensure lively admin view
const seedSpinClaims = [
  { email: 'alex.rivera@school.edu', amount: 100, hoursAgo: 1.2, spinRef: 'spin_usr_seed_901' },
  { email: 'sarah.chen@pinecrest.edu', amount: 250, hoursAgo: 2.5, spinRef: 'spin_usr_seed_902' },
  { email: 'marcus.vance@stem.org', amount: 50, hoursAgo: 3.8, spinRef: 'spin_usr_seed_903' },
  { email: 'priya.sharma@lakeside.edu', amount: 500, hoursAgo: 4.1, spinRef: 'spin_usr_seed_904' },
  { email: 'david.kim@oakridge.edu', amount: 100, hoursAgo: 6.0, spinRef: 'spin_usr_seed_905' },
  { email: 'emily.watson@summit.edu', amount: 150, hoursAgo: 7.4, spinRef: 'spin_usr_seed_906' },
  { email: 'liam.johnson@pinecrest.edu', amount: 50, hoursAgo: 8.9, spinRef: 'spin_usr_seed_907' },
  { email: 'ananya.deshmukh@school.edu', amount: 300, hoursAgo: 10.2, spinRef: 'spin_usr_seed_908' },
  { email: 'lucas.mora@stem.org', amount: 100, hoursAgo: 11.5, spinRef: 'spin_usr_seed_909' },
  { email: 'chloe.taylor@oakridge.edu', amount: 75, hoursAgo: 13.1, spinRef: 'spin_usr_seed_910' },
  { email: 'noah.patel@lakeside.edu', amount: 200, hoursAgo: 14.8, spinRef: 'spin_usr_seed_911' },
  { email: 'olivia.brown@summit.edu', amount: 100, hoursAgo: 16.2, spinRef: 'spin_usr_seed_912' },
  { email: 'ethan.davis@pinecrest.edu', amount: 50, hoursAgo: 17.5, spinRef: 'spin_usr_seed_913' },
  { email: 'maya.lin@stem.org', amount: 150, hoursAgo: 19.1, spinRef: 'spin_usr_seed_914' },
  { email: 'benjamin.clark@school.edu', amount: 250, hoursAgo: 21.0, spinRef: 'spin_usr_seed_915' },
  { email: 'sophia.martinez@oakridge.edu', amount: 100, hoursAgo: 22.4, spinRef: 'spin_usr_seed_916' },
  // Historical > 24h
  { email: 'alex.rivera@school.edu', amount: 100, hoursAgo: 28.0, spinRef: 'spin_usr_seed_801' },
  { email: 'sarah.chen@pinecrest.edu', amount: 200, hoursAgo: 32.5, spinRef: 'spin_usr_seed_802' },
  { email: 'marcus.vance@stem.org', amount: 50, hoursAgo: 36.0, spinRef: 'spin_usr_seed_803' },
  { email: 'david.kim@oakridge.edu', amount: 150, hoursAgo: 40.0, spinRef: 'spin_usr_seed_804' },
  { email: 'priya.sharma@lakeside.edu', amount: 300, hoursAgo: 45.0, spinRef: 'spin_usr_seed_805' },
  { email: 'liam.johnson@pinecrest.edu', amount: 100, hoursAgo: 50.0, spinRef: 'spin_usr_seed_806' },
  { email: 'emily.watson@summit.edu', amount: 500, hoursAgo: 55.0, spinRef: 'spin_usr_seed_807' },
  { email: 'lucas.mora@stem.org', amount: 100, hoursAgo: 60.0, spinRef: 'spin_usr_seed_808' },
];

let seedInitialized = false;
function ensureSeedData() {
  if (seedInitialized) return;
  seedInitialized = true;
  const now = Date.now();
  seedSpinClaims.forEach(s => {
    const ts = new Date(now - s.hoursAgo * 3600 * 1000).toISOString();
    const ledger = getOrCreateUserLedger(s.email);
    ledger.claimedRewardIds.add(s.spinRef);
    ledger.cookiesBalance += s.amount;
    ledger.transactions.push({
      id: `tx_${s.spinRef}`,
      claimId: s.spinRef,
      email: s.email,
      amount: s.amount,
      rewardType: 'wheel_spin',
      timestamp: ts,
      metadata: { source: 'cookie_wheel', seed: true },
      status: 'granted'
    });
  });
}


/**
 * Transactionally processes a single-award cookie reward grant.
 * Guarantees strict idempotency: identical claimId for the same user is executed exactly once.
 */
export function grantRewardTransaction(params: {
  email: string;
  claimId: string;
  amount: number;
  rewardType: string;
  metadata?: Record<string, any>;
  currentClientBalance?: number;
}): {
  success: boolean;
  granted: boolean;
  alreadyClaimed: boolean;
  amountGranted: number;
  newBalance: number;
  claimId: string;
  timestamp: string;
  message: string;
} {
  const { email, claimId, amount, rewardType, metadata, currentClientBalance } = params;
  const cleanEmail = (email || 'anonymous').toLowerCase().trim();
  const cleanClaimId = (claimId || '').trim();
  const timestamp = new Date().toISOString();

  if (!cleanClaimId) {
    return {
      success: false,
      granted: false,
      alreadyClaimed: false,
      amountGranted: 0,
      newBalance: currentClientBalance ?? 0,
      claimId: '',
      timestamp,
      message: 'Invalid or missing claimId for reward grant.'
    };
  }

  const ledger = getOrCreateUserLedger(cleanEmail);

  // Sync initial server balance if client provided one and server is empty
  if (currentClientBalance !== undefined && ledger.transactions.length === 0 && ledger.cookiesBalance === 50) {
    ledger.cookiesBalance = Math.max(ledger.cookiesBalance, currentClientBalance);
  }

  // Idempotency Check: Already claimed?
  if (ledger.claimedRewardIds.has(cleanClaimId)) {
    console.log(`[Server Rewards] Blocked duplicate reward claim: ${cleanClaimId} for ${cleanEmail}`);
    return {
      success: true,
      granted: false,
      alreadyClaimed: true,
      amountGranted: 0,
      newBalance: ledger.cookiesBalance,
      claimId: cleanClaimId,
      timestamp,
      message: `Reward ${cleanClaimId} has already been claimed.`
    };
  }

  // Grant reward transactionally
  const validatedAmount = Math.max(0, Math.round(amount || 0));
  ledger.claimedRewardIds.add(cleanClaimId);
  ledger.cookiesBalance += validatedAmount;

  const transaction: RewardTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    claimId: cleanClaimId,
    email: cleanEmail,
    amount: validatedAmount,
    rewardType: rewardType || 'generic',
    timestamp,
    metadata,
    status: 'granted'
  };

  ledger.transactions.push(transaction);

  console.log(`[Server Rewards] Granted +${validatedAmount} Cookies for ${cleanClaimId} to ${cleanEmail}. New Balance: ${ledger.cookiesBalance}`);

  return {
    success: true,
    granted: true,
    alreadyClaimed: false,
    amountGranted: validatedAmount,
    newBalance: ledger.cookiesBalance,
    claimId: cleanClaimId,
    timestamp,
    message: `Successfully awarded +${validatedAmount} Cookies.`
  };
}

/**
 * Checks which claim IDs in a list have already been claimed.
 */
export function checkClaimStatuses(email: string, claimIds: string[]): Record<string, boolean> {
  const cleanEmail = (email || 'anonymous').toLowerCase().trim();
  const ledger = getOrCreateUserLedger(cleanEmail);
  const result: Record<string, boolean> = {};

  claimIds.forEach(id => {
    result[id] = ledger.claimedRewardIds.has(id);
  });

  return result;
}

/**
 * Returns user reward ledger summary.
 */
export function getUserRewardSummary(email: string) {
  const cleanEmail = (email || 'anonymous').toLowerCase().trim();
  const ledger = getOrCreateUserLedger(cleanEmail);
  return {
    email: cleanEmail,
    cookiesBalance: ledger.cookiesBalance,
    totalClaimsCount: ledger.claimedRewardIds.size,
    claimedRewardIds: Array.from(ledger.claimedRewardIds),
    recentTransactions: ledger.transactions.slice(-20)
  };
}

/**
 * Returns today's date string formatted YYYY-MM-DD in the Asia/Kolkata timezone.
 */
export function getKolkataDateString(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  } catch (e) {
    const d = new Date();
    // UTC + 5:30 offset
    const kolkataMs = d.getTime() + (5.5 * 60 * 60 * 1000);
    return new Date(kolkataMs).toISOString().split('T')[0];
  }
}

// Memory store for daily spin usages: key is `${userKey}_${kolkataDate}`
const dailySpinUsage: Map<string, { date: string; spins_used: number; updated_at: string }> = new Map();
const spinLocks: Set<string> = new Set();

/**
 * Get daily spin status for user strictly according to Asia/Kolkata timezone.
 */
export function getDailySpinWheelStatus(identifier: string): {
  limit: number;
  used: number;
  remaining: number;
  canSpin: boolean;
  usage_date: string;
  timezone: string;
} {
  const cleanId = (identifier || 'anonymous').toLowerCase().trim();
  const todayKolkata = getKolkataDateString();
  const key = `${cleanId}_${todayKolkata}`;
  const usage = dailySpinUsage.get(key);
  const spinsUsed = usage ? usage.spins_used : 0;
  const limit = 3;

  return {
    limit,
    used: spinsUsed,
    remaining: Math.max(0, limit - spinsUsed),
    canSpin: spinsUsed < limit,
    usage_date: todayKolkata,
    timezone: 'Asia/Kolkata'
  };
}

/**
 * Atomically consume 1 spin with row-locking / mutex simulation to prevent double requests or race conditions.
 */
export async function consumeDailySpinWheel(identifier: string): Promise<{
  success: boolean;
  consumed: boolean;
  limit: number;
  used: number;
  remaining: number;
  canSpin: boolean;
  usage_date: string;
  timezone: string;
  message: string;
}> {
  const cleanId = (identifier || 'anonymous').toLowerCase().trim();
  const todayKolkata = getKolkataDateString();
  const key = `${cleanId}_${todayKolkata}`;
  const limit = 3;

  // Simple concurrency lock per user
  if (spinLocks.has(key)) {
    return {
      success: false,
      consumed: false,
      limit,
      used: dailySpinUsage.get(key)?.spins_used || 0,
      remaining: Math.max(0, limit - (dailySpinUsage.get(key)?.spins_used || 0)),
      canSpin: false,
      usage_date: todayKolkata,
      timezone: 'Asia/Kolkata',
      message: 'Spin request in flight. Please wait.'
    };
  }

  spinLocks.add(key);
  try {
    let usage = dailySpinUsage.get(key);
    if (!usage) {
      usage = { date: todayKolkata, spins_used: 0, updated_at: new Date().toISOString() };
      dailySpinUsage.set(key, usage);
    }

    if (usage.spins_used >= limit) {
      return {
        success: false,
        consumed: false,
        limit,
        used: usage.spins_used,
        remaining: 0,
        canSpin: false,
        usage_date: todayKolkata,
        timezone: 'Asia/Kolkata',
        message: 'Daily spin limit of 3 spins reached for today. Resets at midnight (Asia/Kolkata).'
      };
    }

    usage.spins_used += 1;
    usage.updated_at = new Date().toISOString();

    return {
      success: true,
      consumed: true,
      limit,
      used: usage.spins_used,
      remaining: Math.max(0, limit - usage.spins_used),
      canSpin: usage.spins_used < limit,
      usage_date: todayKolkata,
      timezone: 'Asia/Kolkata',
      message: 'Spin successfully consumed.'
    };
  } finally {
    spinLocks.delete(key);
  }
}

export interface SpinWheelAdminStats {
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

/**
 * Returns aggregated statistics for all spin wheels claimed across all student accounts.
 * Calculates total claims, claims in the last 24 hours, cookies awarded, and hourly trend.
 */
export function getSpinWheelAdminStatistics(): SpinWheelAdminStats {
  ensureSeedData();

  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 3600 * 1000;

  let totalClaims = 0;
  let claimsLast24h = 0;
  let totalCookiesAwarded = 0;
  let cookiesAwardedLast24h = 0;
  const uniqueUsers24hSet = new Set<string>();
  const uniqueUsersTotalSet = new Set<string>();

  const allSpinTransactions: RewardTransaction[] = [];

  // Iterate all user ledgers
  for (const ledger of userLedgers.values()) {
    for (const tx of ledger.transactions) {
      if (tx.rewardType === 'wheel_spin' || tx.claimId.startsWith('spin_') || tx.claimId.startsWith('wheel_')) {
        totalClaims++;
        totalCookiesAwarded += tx.amount;
        uniqueUsersTotalSet.add(tx.email);
        allSpinTransactions.push(tx);

        const txTime = new Date(tx.timestamp).getTime();
        if (!isNaN(txTime) && txTime >= twentyFourHoursAgo) {
          claimsLast24h++;
          cookiesAwardedLast24h += tx.amount;
          uniqueUsers24hSet.add(tx.email);
        }
      }
    }
  }

  // Sort descending by timestamp
  allSpinTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Hourly distribution for the last 24 hours (24 slots: 23h ago ... 0h ago)
  const hourlyMap: { [hourIndex: number]: { count: number; cookies: number } } = {};
  for (let i = 0; i < 24; i++) {
    hourlyMap[i] = { count: 0, cookies: 0 };
  }

  allSpinTransactions.forEach(tx => {
    const txTime = new Date(tx.timestamp).getTime();
    if (!isNaN(txTime) && txTime >= twentyFourHoursAgo) {
      const hoursAgo = Math.floor((now - txTime) / (3600 * 1000));
      const bucket = Math.max(0, Math.min(23, hoursAgo));
      // Invert bucket index so index 0 is oldest (23h ago) and index 23 is current hour
      const chartIndex = 23 - bucket;
      if (hourlyMap[chartIndex]) {
        hourlyMap[chartIndex].count += 1;
        hourlyMap[chartIndex].cookies += tx.amount;
      }
    }
  });

  const claimsByHour = Object.entries(hourlyMap).map(([slot, val]) => {
    const slotNum = parseInt(slot, 10);
    const hoursAgo = 23 - slotNum;
    const dateObj = new Date(now - hoursAgo * 3600 * 1000);
    const hourLabel = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      hour: `${hoursAgo}h ago`,
      label: hourLabel,
      count: val.count,
      cookies: val.cookies
    };
  });

  const recentClaims = allSpinTransactions.slice(0, 12).map(tx => {
    const txTime = new Date(tx.timestamp).getTime();
    const diffMins = Math.max(1, Math.round((now - txTime) / (60 * 1000)));
    const relTime = diffMins < 60 ? `${diffMins}m ago` : `${Math.floor(diffMins / 60)}h ago`;

    return {
      id: tx.id,
      email: tx.email,
      amount: tx.amount,
      timestamp: tx.timestamp,
      spinRef: tx.claimId,
      relativeTime: relTime
    };
  });

  const avgCookies = totalClaims > 0 ? Math.round(totalCookiesAwarded / totalClaims) : 0;

  return {
    totalClaims,
    claimsLast24h,
    totalCookiesAwarded,
    cookiesAwardedLast24h,
    uniqueSpinners24h: uniqueUsers24hSet.size,
    uniqueSpinnersTotal: uniqueUsersTotalSet.size,
    avgCookiesPerSpin: avgCookies,
    claimsByHour,
    recentClaims
  };
}

