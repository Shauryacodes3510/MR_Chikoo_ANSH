import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { soundManager } from '../lib/sounds';
import { supabase, isSupabaseConfigured, getProfile, isValidUuid } from '../lib/supabase';
import { progressService } from '../lib/progressService';
import { useAuth } from './AuthProvider';

// Helper to format rewards JSON into user-friendly text
const formatRewardsText = (rewards: any): string => {
  if (!rewards || typeof rewards !== 'object' || Object.keys(rewards).length === 0) {
    return '';
  }
  return Object.entries(rewards)
    .map(([key, val]) => {
      const label = key.toUpperCase();
      if (key === 'cookies' || key === 'cookie') return `+${val} 🍪`;
      if (key === 'xp') return `+${val} XP`;
      if (key === 'gems' || key === 'gem') return `+${val} 💎`;
      if (key === 'trophies' || key === 'trophy') return `+${val} 🏆`;
      return `+${val} ${label}`;
    })
    .join(' • ');
};

// Helper to parse simple reward strings into SQL JSONB structure
const parseRewardsFromText = (text: string): any => {
  const rewards: any = {};
  if (!text) return rewards;
  const parts = text.split(/[•·,]/);
  for (const part of parts) {
    const trimmed = part.trim();
    const match = trimmed.match(/[+–]?(\d+)\s*([\w\s]+|🍪|💎|🏆|🎖️|✨)/);
    if (match) {
      const amount = parseInt(match[1], 10);
      let type = match[2].trim().toLowerCase();
      if (type.includes('cookie') || type.includes('🍪')) {
        rewards.cookies = amount;
      } else if (type.includes('xp') || type.includes('⚡')) {
        rewards.xp = amount;
      } else if (type.includes('gem') || type.includes('💎')) {
        rewards.gems = amount;
      } else if (type.includes('trophies') || type.includes('trophy') || type.includes('🏆')) {
        rewards.trophies = amount;
      } else {
        rewards[type] = amount;
      }
    }
  }
  return rewards;
};

// Helper to map DB template to CelebrationEvent schema
const mapTemplateToEvent = (tpl: any): CelebrationEvent => {
  let animationType: CelebrationEvent['animationType'] = 'confetti';
  const tType = (tpl.celebration_type || '').toLowerCase();
  
  if (tType === 'victory') animationType = 'victory_screen';
  else if (tType === 'rank_up') animationType = 'badge_reveal';
  else if (tType === 'level_up') animationType = 'level_up';
  else if (tType === 'treasure_opened') animationType = 'chest_opening';
  else if (tType === 'badge_earned') animationType = 'star_shower';
  else if (tType === 'xp_earned') animationType = 'reward_explosion';
  
  if (tpl.animation_url) {
    const animUrlLower = tpl.animation_url.toLowerCase();
    if (['confetti', 'fireworks', 'glow_burst', 'star_shower', 'badge_reveal', 'reward_explosion', 'chest_opening', 'level_up', 'victory_screen'].includes(animUrlLower)) {
      animationType = animUrlLower as any;
    }
  }

  let triggerType: CelebrationEvent['triggerType'] = 'challenge_complete';
  if (tType === 'victory') triggerType = 'battle_won';
  else if (tType === 'rank_up') triggerType = 'new_rank';
  else if (tType === 'level_up') triggerType = 'level_up';
  else if (tType === 'treasure_opened') triggerType = 'reward_box_opened';
  else if (tType === 'badge_earned') triggerType = 'achievement_earned';
  else if (tType === 'xp_earned') triggerType = 'challenge_complete';

  let category: CelebrationEvent['category'] = 'medium';
  if (tpl.priority >= 90) category = 'full';
  else if (tpl.priority < 40) category = 'small';

  const rewardText = formatRewardsText(tpl.rewards) || tpl.subtitle || '';

  return {
    id: tpl.id,
    name: tpl.title,
    title: tpl.title,
    description: tpl.description || tpl.subtitle || '',
    rewardText: rewardText,
    animationType,
    duration: tpl.duration_ms || 4000,
    triggerType,
    category,
    enabled: tpl.enabled ?? true,
    assetUrl: tpl.icon || '🎉',
    soundUrl: tpl.sound_url,
    colorTheme: tpl.color_theme,
    gradient: tpl.gradient,
    rarity: tpl.rarity,
    priority: tpl.priority,
    autoDismiss: tpl.auto_dismiss,
    confettiEnabled: tpl.confetti_enabled,
    rewards: tpl.rewards,
    triggerCondition: tpl.trigger_condition
  };
};

const mapEventToTemplateRow = (event: CelebrationEvent): any => {
  let celebration_type = 'xp_earned';
  if (event.triggerType === 'battle_won') celebration_type = 'victory';
  else if (event.triggerType === 'new_rank') celebration_type = 'rank_up';
  else if (event.triggerType === 'level_up') celebration_type = 'level_up';
  else if (event.triggerType === 'reward_box_opened') celebration_type = 'treasure_opened';
  else if (event.triggerType === 'achievement_earned') celebration_type = 'badge_earned';
  else if (event.triggerType === 'challenge_complete') celebration_type = 'xp_earned';
  
  let priority = event.priority ?? 50;
  if (!event.priority) {
    if (event.category === 'full') priority = 95;
    else if (event.category === 'small') priority = 20;
  }

  const rewards = event.rewards || parseRewardsFromText(event.rewardText);

  // Map to gradient based on celebration_type
  let gradient = event.gradient || '';
  let color_theme = event.colorTheme || 'blue';
  let rarity = event.rarity || 'Common';

  if (!event.gradient || !event.colorTheme) {
    if (celebration_type === 'victory') {
      gradient = 'from-amber-400 via-orange-500 to-amber-700';
      color_theme = 'amber';
      rarity = 'Legendary';
    } else if (celebration_type === 'rank_up') {
      gradient = 'from-purple-600 via-fuchsia-700 to-indigo-900';
      color_theme = 'purple';
      rarity = 'Epic';
    } else if (celebration_type === 'level_up') {
      gradient = 'from-indigo-500 via-cyan-600 to-blue-800';
      color_theme = 'indigo';
      rarity = 'Epic';
    } else if (celebration_type === 'treasure_opened') {
      gradient = 'from-amber-500 via-yellow-600 to-orange-700';
      color_theme = 'amber';
      rarity = 'Epic';
    } else if (celebration_type === 'badge_earned') {
      gradient = 'from-fuchsia-500 to-pink-600';
      color_theme = 'fuchsia';
      rarity = 'Legendary';
    } else {
      gradient = 'from-blue-500 to-cyan-600';
      color_theme = 'indigo';
      rarity = 'Common';
    }
  }

  return {
    id: event.id,
    celebration_type,
    title: event.title,
    subtitle: event.rewardText,
    description: event.description,
    icon: event.assetUrl || '🎉',
    animation_url: event.animationType,
    sound_url: event.soundUrl || (celebration_type === 'victory' || celebration_type === 'rank_up' || celebration_type === 'level_up' ? 'cheer' : celebration_type === 'treasure_opened' ? 'pop' : 'complete'),
    color_theme,
    gradient,
    rarity,
    priority,
    duration_ms: event.duration,
    auto_dismiss: event.autoDismiss ?? !(celebration_type === 'victory' || celebration_type === 'treasure_opened' || celebration_type === 'badge_earned'),
    confetti_enabled: event.confettiEnabled ?? true,
    enabled: event.enabled ?? true,
    rewards,
    trigger_condition: event.triggerCondition || '',
    updated_at: new Date().toISOString()
  };
};

// Type declarations
export interface CelebrationEvent {
  id: string;
  name: string;
  title: string;
  heading?: string;
  taskTitle?: string;
  description: string;
  rewardText: string;
  cookiesEarned?: number;
  xpEarned?: number;
  badgeUnlocked?: string;
  featureUnlocked?: string;
  animationType: 'confetti' | 'fireworks' | 'glow_burst' | 'star_shower' | 'badge_reveal' | 'reward_explosion' | 'chest_opening' | 'level_up' | 'victory_screen';
  duration: number; // in milliseconds
  triggerType: 'challenge_complete' | 'lesson_complete' | 'level_up' | 'new_rank' | 'reward_box_opened' | 'puzzle_unlocked' | 'battle_won' | 'achievement_earned';
  category: 'small' | 'medium' | 'full';
  enabled: boolean;
  assetUrl?: string; // Image asset URL (or Lucide name)
  soundUrl?: string;
  colorTheme?: string;
  gradient?: string;
  rarity?: string;
  priority?: number;
  autoDismiss?: boolean;
  confettiEnabled?: boolean;
  rewards?: any;
  triggerCondition?: string;
  claimId?: string;
}

export interface CelebrationAsset {
  id: string;
  name: string;
  type: 'trophy' | 'badge' | 'star' | 'chest' | 'character' | 'victory' | 'custom';
  url: string; // PNG/GIF/SVG URL or visual design type
}

export interface CelebrationSettings {
  enableCelebrations: boolean;
  enableConfetti: boolean;
  enableFullScreenEvents: boolean;
  enableBattleAnimations: boolean;
  enableRewardAnimations: boolean;
  enableAchievementPopups: boolean;
  celebrationIntensity: 'low' | 'medium' | 'high';
}

export interface SocialActivity {
  id: string;
  text: string;
  type: 'challenge' | 'rank' | 'battle' | 'box' | 'achievement';
  timestamp: number;
  userName: string;
  avatarSeed: number;
}

interface CelebrationContextType {
  events: CelebrationEvent[];
  assets: CelebrationAsset[];
  settings: CelebrationSettings;
  activeCelebration: CelebrationEvent | null;
  socialActivities: SocialActivity[];
  triggerCelebration: (triggerTypeOrId: string, customProps?: Partial<CelebrationEvent>) => void;
  closeActiveCelebration: () => void;
  addEvent: (event: CelebrationEvent) => void;
  updateEvent: (event: CelebrationEvent) => void;
  deleteEvent: (id: string) => void;
  addAsset: (asset: CelebrationAsset) => void;
  deleteAsset: (id: string) => void;
  updateSettings: (settings: Partial<CelebrationSettings>) => void;
  addSocialActivity: (text: string, type: SocialActivity['type'], username?: string) => void;
}

const CelebrationContext = createContext<CelebrationContextType | undefined>(undefined);

// Default assets preloaded
const DEFAULT_ASSETS: CelebrationAsset[] = [
  { id: 'a1', name: 'Master Trophy', type: 'trophy', url: '🏆' },
  { id: 'a2', name: 'Honor Medal', type: 'badge', url: '🏅' },
  { id: 'a3', name: 'Golden Star', type: 'star', url: '⭐' },
  { id: 'a4', name: 'Cosmic Chest', type: 'chest', url: '🎁' },
  { id: 'a5', name: 'Cyber Lock', type: 'custom', url: '🔓' },
  { id: 'a6', name: 'Super Cadet Chikoo', type: 'character', url: '🤖' },
  { id: 'a7', name: 'Milestone Shield', type: 'victory', url: '🛡️' },
];

const DEFAULT_EVENTS: CelebrationEvent[] = [
  {
    id: 'e1',
    name: 'Challenge Complete',
    title: '🎉 Challenge Complete!',
    description: 'Outstanding technical agility shown!',
    rewardText: '+50 Cookies',
    animationType: 'confetti',
    duration: 3000,
    triggerType: 'challenge_complete',
    category: 'medium',
    enabled: true,
    assetUrl: '⭐'
  },
  {
    id: 'e2',
    name: 'Lesson Complete',
    title: '🏆 Lesson Complete!',
    description: 'You unlocked key celestial formulas!',
    rewardText: '+100 Cookies',
    animationType: 'reward_explosion',
    duration: 4000,
    triggerType: 'lesson_complete',
    category: 'medium',
    enabled: true,
    assetUrl: '🏅'
  },
  {
    id: 'e3',
    name: 'Level Up',
    title: '🚀 Level Up!',
    description: 'You are moving through the ranks!',
    rewardText: 'Unlocked Level Sector!',
    animationType: 'level_up',
    duration: 4500,
    triggerType: 'level_up',
    category: 'full',
    enabled: true,
    assetUrl: '🤖'
  },
  {
    id: 'e4',
    name: 'New Rank achieved',
    title: '🥇 New Rank!',
    description: 'Your leaderboard standing has surged!',
    rewardText: 'Moved up 3 Places!',
    animationType: 'badge_reveal',
    duration: 3500,
    triggerType: 'new_rank',
    category: 'medium',
    enabled: true,
    assetUrl: '🛡️'
  },
  {
    id: 'e5',
    name: 'Reward Box Opened',
    title: '🎁 Reward Box Opened!',
    description: 'Shattered standard solar lockbox!',
    rewardText: '+150 Cookies',
    animationType: 'chest_opening',
    duration: 4000,
    triggerType: 'reward_box_opened',
    category: 'medium',
    enabled: true,
    assetUrl: '🎁'
  },
  {
    id: 'e6',
    name: 'Puzzle Unlocked',
    title: '🧩 Puzzle Unlocked!',
    description: 'An advanced speedrun sector is active.',
    rewardText: 'Access Granted to Nebula!',
    animationType: 'glow_burst',
    duration: 3550,
    triggerType: 'puzzle_unlocked',
    category: 'medium',
    enabled: true,
    assetUrl: '🔓'
  },
  {
    id: 'e7',
    name: 'Battle Won',
    title: '⚔️ Gladiator Victory!',
    description: 'Opponent core successfully depleted!',
    rewardText: '+200 Cookies',
    animationType: 'victory_screen',
    duration: 5500,
    triggerType: 'battle_won',
    category: 'full',
    enabled: true,
    assetUrl: '🏆'
  },
  {
    id: 'e8',
    name: 'Achievement Earned',
    title: '🏅 New Badge Earned!',
    description: 'You earned the Solar Eclipse master crest.',
    rewardText: '+100 Cookies Bonus',
    animationType: 'star_shower',
    duration: 4000,
    triggerType: 'achievement_earned',
    category: 'medium',
    enabled: true,
    assetUrl: '🏅'
  },
];

const DEFAULT_SETTINGS: CelebrationSettings = {
  enableCelebrations: true,
  enableConfetti: true,
  enableFullScreenEvents: true,
  enableBattleAnimations: true,
  enableRewardAnimations: true,
  enableAchievementPopups: true,
  celebrationIntensity: 'high',
};

const SOCIAL_NAMES = [
  'SpaceRanger', 'NovaScout', 'CyberOrion', 'AstroNova', 'CosmoCody', 'DriftSolar', 'EcoNebula', 'GlitchVoid',
  'QuantSpark', 'ProStar', 'PulsarPat', 'ChikooDefender', 'HeliosHero', 'TechTriton', 'GravityGazer'
];

const SOCIAL_PHRASES = {
  challenge: [
    'just completed an Ethics challenge!',
    'finished celestial navigation with 100% accuracy!',
    'mastered the Split-Tree Decision challenge!',
    'completed the AI vs Human Spot challenge!',
    'restored system energy with a flawless run!'
  ],
  rank: [
    'just climbed to Rank 1 on leaderboard!',
    'moved up to the Celestial Gold League!',
    'advanced 4 spots in the Elite Division!',
    'secured a top 3 podium spot!'
  ],
  battle: [
    'won a intense 1v1 Battle Arena run!',
    'hit a 4-win Streak in the Duel Arena!',
    'is taking on a boss defender right now! ⚡',
    'just scored 1000 DPS points in speed battle!'
  ],
  box: [
    'opened an Epic Nebula Chest!',
    'unwrapped a premium Diamond Booster box! 🎁',
    'claimed daily space cargo rewards!'
  ],
  achievement: [
    'unlocked the "Solar Overlord" legendary badge!',
    'earned "Quantum Mechanic" speedrun crest!',
    'crossed 5,000 Total Cookies milestones! ⭐'
  ]
};

const recentCelebrationHistoryLogs = new Map<string, number>();

export const CelebrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sessionUser, authUserId } = useAuth();
  const [events, setEvents] = useState<CelebrationEvent[]>(() => {
    const saved = localStorage.getItem('celebration_events');
    return saved ? JSON.parse(saved) : DEFAULT_EVENTS;
  });

  const [assets, setAssets] = useState<CelebrationAsset[]>(() => {
    const saved = localStorage.getItem('celebration_assets');
    return saved ? JSON.parse(saved) : DEFAULT_ASSETS;
  });

  const [settings, setSettings] = useState<CelebrationSettings>(() => {
    const saved = localStorage.getItem('celebration_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [socialActivities, setSocialActivities] = useState<SocialActivity[]>([]);
  const [celebrationQueue, setCelebrationQueue] = useState<CelebrationEvent[]>([]);
  const [activeCelebration, setActiveCelebration] = useState<CelebrationEvent | null>(null);
  const isCooldownRef = useRef(false);
  const recentTriggersRef = useRef<Map<string, number>>(new Map());
  const processedQueueIdsRef = useRef<Set<string>>(new Set());

  // Centralized Celebration Manager to validate and record milestones
  const celebrationManager = useMemo(() => {
    // Generate a unique, stable storage key based on the current user
    const getStorageKey = () => `chikoo_celebrated_milestones_${sessionUser ? sessionUser.toLowerCase() : 'guest'}`;

    // Load celebrated milestones from localStorage
    const getCelebratedMilestones = (): Set<string> => {
      try {
        const saved = localStorage.getItem(getStorageKey());
        if (saved) {
          const arr = JSON.parse(saved);
          if (Array.isArray(arr)) {
            return new Set(arr);
          }
        }
      } catch (err) {
        console.error("Error loading celebrated milestones:", err);
      }
      return new Set();
    };

    // Save celebrated milestones to localStorage
    const saveCelebratedMilestones = (milestones: Set<string>) => {
      try {
        localStorage.setItem(getStorageKey(), JSON.stringify(Array.from(milestones)));
      } catch (err) {
        console.error("Error saving celebrated milestones:", err);
      }
    };

    // Generate a unique, stable slug for a celebration based on its content
    const generateCelebrationSlug = (title: string, description: string): string => {
      const combined = `${title}_${description}`.toLowerCase();
      return combined
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .trim();
    };

    // Determine if a celebration is a one-time milestone achievement
    const isMilestone = (triggerType: string, title: string): boolean => {
      const t = triggerType.toLowerCase();
      const h = title.toLowerCase();
      return (
        t === 'level_up' ||
        t === 'new_rank' ||
        t === 'achievement_earned' ||
        t === 'unit_completed' ||
        h.includes('milestone') ||
        h.includes('badge') ||
        h.includes('achievement') ||
        h.includes('completed') ||
        h.includes('unit completed') ||
        h.includes('level up') ||
        h.includes('promotion')
      );
    };

    return {
      // Main check to see if an event should be celebrated
      shouldCelebrate: (triggerType: string, title: string, description: string): boolean => {
        if (!isMilestone(triggerType, title)) {
          return true; // Non-milestone celebrations are always allowed (subject to rate limits)
        }

        const slug = generateCelebrationSlug(title, description);
        const celebrated = getCelebratedMilestones();
        const alreadyCelebrated = celebrated.has(slug);
        
        if (alreadyCelebrated) {
          console.log(`[Celebration Manager] Suppressing already celebrated milestone: ${slug}`);
          return false;
        }
        return true;
      },

      // Mark a milestone as celebrated so it never triggers again
      recordCelebration: (triggerType: string, title: string, description: string) => {
        if (!isMilestone(triggerType, title)) {
          return;
        }

        const slug = generateCelebrationSlug(title, description);
        const celebrated = getCelebratedMilestones();
        celebrated.add(slug);
        saveCelebratedMilestones(celebrated);
        console.log(`[Celebration Manager] Recorded milestone achievement: ${slug}`);
      },

      // Clear milestone history (useful for debugging/resetting)
      resetHistory: () => {
        try {
          localStorage.removeItem(getStorageKey());
          console.log("[Celebration Manager] Milestone history reset.");
        } catch (err) {
          console.error("Error resetting milestone history:", err);
        }
      }
    };
  }, [sessionUser]);

  // Process the celebration queue sequentially
  useEffect(() => {
    if (activeCelebration || celebrationQueue.length === 0 || isCooldownRef.current) {
      return;
    }

    const nextEvent = celebrationQueue[0];
    setCelebrationQueue(prev => prev.slice(1));
    setActiveCelebration(nextEvent);
  }, [activeCelebration, celebrationQueue]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('celebration_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('celebration_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('celebration_settings', JSON.stringify(settings));
  }, [settings]);

  // Load templates from Supabase celebration_templates
  useEffect(() => {
    const loadTemplates = async () => {
      if (supabase && isSupabaseConfigured) {
        try {
          console.log("[Supabase Intent] FETCH celebration_templates", {});
          const { data, error } = await supabase
            .from('celebration_templates')
            .select('*')
            .order('priority', { ascending: false });
            
          if (error) {
            console.error("[Supabase Error] Error fetching templates:", error);
            return;
          }
          
          if (data && data.length > 0) {
            console.log("[Supabase Success] celebration_templates loaded:", data.length);
            const mapped = data.map(mapTemplateToEvent);
            setEvents(mapped);
          }
        } catch (err) {
          console.error("Exception loading celebration templates:", err);
        }
      }
    };
    
    loadTemplates();
  }, [sessionUser]);

  // Helper to process a queue item from user_celebration_queue
  const processQueueItem = async (item: any) => {
    if (!supabase || !sessionUser) return;
    
    // Prevent double processing within the same session/load
    if (processedQueueIdsRef.current.has(item.id)) {
      console.log(`[Celebration Shield] Already processed DB queue item in this session: ${item.id}`);
      return;
    }
    processedQueueIdsRef.current.add(item.id);
    
    try {
      console.log("[Supabase Queue] Processing pending celebration item:", item.id);
      
      // 1. Mark as shown immediately in DB to avoid double processing
      const { error: updateError } = await supabase
        .from('user_celebration_queue')
        .update({
          status: 'shown',
          shown_at: new Date().toISOString()
        })
        .eq('id', item.id);
        
      if (updateError) {
        console.warn("Could not mark celebration as shown (might be already processed):", updateError);
        return;
      }
      
      // 2. Map template to event
      const template = item.celebration_templates;
      if (!template) {
        console.warn("No template found for queue item:", item.template_id);
        return;
      }
      
      const mappedEvent = mapTemplateToEvent(template);
      
      // Apply optional overrides from payload
      if (item.payload) {
        if (item.payload.title) mappedEvent.title = item.payload.title;
        if (item.payload.description) mappedEvent.description = item.payload.description;
        if (item.payload.rewards) {
          mappedEvent.rewardText = formatRewardsText(item.payload.rewards);
        }
      }
      
      // Validate with Centralized Celebration Manager
      if (!celebrationManager.shouldCelebrate(mappedEvent.triggerType, mappedEvent.title, mappedEvent.description)) {
        console.log(`[Celebration Manager] Suppressing already completed milestone from queue: ${mappedEvent.title}`);
        try {
          await supabase
            .from('user_celebration_queue')
            .delete()
            .eq('id', item.id);
        } catch (e) {
          console.warn("Could not cleanup suppressed queue item:", e);
        }
        return;
      }

      // Record milestone in manager
      celebrationManager.recordCelebration(mappedEvent.triggerType, mappedEvent.title, mappedEvent.description);

      // Prevent duplicate popups for the same event within a single action/session
      const triggerKey = `${mappedEvent.triggerType}_${mappedEvent.title || ''}`;
      const now = Date.now();
      const lastTriggerTime = recentTriggersRef.current.get(triggerKey);
      if (lastTriggerTime && (now - lastTriggerTime) < 8000) {
        console.log(`[Celebration Shield] Suppressed duplicate DB queue trigger for: ${triggerKey}`);
        try {
          await supabase
            .from('user_celebration_queue')
            .delete()
            .eq('id', item.id);
        } catch (e) {
          console.warn("Could not cleanup suppressed queue item:", e);
        }
        return;
      }
      recentTriggersRef.current.set(triggerKey, now);

      // Keep reference of queue item id so we can complete it when closed
      const finalEvent = {
        ...mappedEvent,
        id: `${mappedEvent.id}_${item.id}`, // incorporate queue item ID
        _db_queue_id: item.id, // custom metadata
        _db_template_id: template.id,
        _db_rewards: item.payload?.rewards || template.rewards || {}
      } as any;
      
      // 3. Add to client-side queue
      setCelebrationQueue(prev => [...prev, finalEvent]);
      
    } catch (err) {
      console.error("Error processing queue item:", err);
    }
  };

  // Fetch initial pending queue items & setup realtime subscription
  useEffect(() => {
    if (!supabase || !sessionUser || !isSupabaseConfigured) return;

    const fetchPendingAndSubscribe = async () => {
      try {
        const profile = await getProfile(sessionUser);
        const userId = (profile?.id && isValidUuid(profile.id)) ? profile.id : (authUserId && isValidUuid(authUserId) ? authUserId : null);

        if (!userId) {
          console.warn("[CelebrationProvider] Skipping pending celebration queue fetch: no valid UUID.");
          return;
        }

        // Fetch initial pending
        console.log("[Supabase Intent] FETCH user_celebration_queue initial for:", userId);
        const { data: queueItems, error } = await supabase
          .from('user_celebration_queue')
          .select('*, celebration_templates(*)')
          .eq('user_id', userId)
          .eq('status', 'pending')
          .order('queued_at', { ascending: true });

        if (!error && queueItems && queueItems.length > 0) {
          for (const item of queueItems) {
            await processQueueItem(item);
          }
        }
      } catch (err) {
        console.error("Error in initial celebration queue fetch:", err);
      }
    };

    fetchPendingAndSubscribe();

    // Subscribe to realtime queue events
    console.log("[Supabase Realtime] Subscribing to user_celebration_queue updates...");
    const channel = supabase
      .channel(`public:user_celebration_queue_user_${sessionUser.replace(/[^a-zA-Z0-9]/g, '_')}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_celebration_queue'
        },
        async (payload) => {
          const newItem = payload.new;
          try {
            const profile = await getProfile(sessionUser);
            const userId = (profile?.id && isValidUuid(profile.id)) ? profile.id : (authUserId && isValidUuid(authUserId) ? authUserId : null);

            if (
              userId &&
              newItem.user_id === userId &&
              newItem.status === 'pending'
            ) {
              console.log("[Supabase Realtime] Matching pending queue insert received:", newItem);
              
              // Load full item with templates joined
              const { data: templateData } = await supabase
                .from('celebration_templates')
                .select('*')
                .eq('id', newItem.template_id)
                .maybeSingle();

              const fullItem = {
                ...newItem,
                celebration_templates: templateData
              };

              await processQueueItem(fullItem);
            }
          } catch (e) {
            console.error("Error handling realtime celebration insert:", e);
          }
        }
      )
      .subscribe();

    return () => {
      console.log("[Supabase Realtime] Unsubscribing from user_celebration_queue...");
      supabase.removeChannel(channel);
    };
  }, [sessionUser]);

  // Social activity live updater
  useEffect(() => {
    // Spawn 1 initial social activity
    const delay = Math.random() * 4000 + 1000;
    const initialTimer = setTimeout(() => {
      spawnRandomSocialActivity();
    }, delay);

    // Create periodic random active user events mimicking an alive MMO environment
    const interval = setInterval(() => {
      if (!settings.enableCelebrations) return;
      
      // Control spawn frequency depending on celebration intensity
      const threshold = settings.celebrationIntensity === 'low' ? 0.1 : settings.celebrationIntensity === 'medium' ? 0.4 : 0.8;
      if (Math.random() <= threshold) {
        spawnRandomSocialActivity();
      }
    }, 28000 + Math.random() * 15000); // 28 - 43 seconds

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [settings.enableCelebrations, settings.celebrationIntensity]);

  const spawnRandomSocialActivity = () => {
    const types: SocialActivity['type'][] = ['challenge', 'rank', 'battle', 'box', 'achievement'];
    const selectedType = types[Math.floor(Math.random() * types.length)];
    const username = SOCIAL_NAMES[Math.floor(Math.random() * SOCIAL_NAMES.length)];
    const comments = SOCIAL_PHRASES[selectedType];
    const phrase = comments[Math.floor(Math.random() * comments.length)];
    const text = `@${username} ${phrase}`;
    
    addSocialActivity(text, selectedType, username);
  };

  const addSocialActivity = (text: string, type: SocialActivity['type'], username?: string) => {
    const newActivity: SocialActivity = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      type,
      timestamp: Date.now(),
      userName: username || 'SystemExplorer',
      avatarSeed: Math.floor(Math.random() * 100)
    };
    
    setSocialActivities(prev => {
      const updated = [newActivity, ...prev];
      return updated.slice(0, 15); // Maintain max 15 events
    });
  };

  const triggerCelebration = (triggerTypeOrId: string, customProps?: Partial<CelebrationEvent>) => {
    if (!settings.enableCelebrations) return;
    if (typeof window !== 'undefined' && (window as any).__IS_LESSON_ACTIVE) return;

    // Check if triggering by direct Event ID or by Trigger Type
    let event = events.find(e => e.id === triggerTypeOrId && e.enabled);
    if (!event) {
      event = events.find(e => e.triggerType === triggerTypeOrId && e.enabled);
    }

    if (!event) {
      // If we didn't find the event or it's disabled, return silently
      return;
    }

    // Filter based on global permissions
    if (event.animationType === 'confetti' && !settings.enableConfetti) return;
    if (event.category === 'full' && !settings.enableFullScreenEvents) return;
    if (event.triggerType === 'battle_won' && !settings.enableBattleAnimations) return;
    if (event.triggerType === 'reward_box_opened' && !settings.enableRewardAnimations) return;
    if (event.triggerType === 'achievement_earned' && !settings.enableAchievementPopups) return;

    // Apply intensity settings:
    // Low intensity only allows FULL / major milestones (e.g. battle_won, level_up)
    if (settings.celebrationIntensity === 'low' && event.category !== 'full') {
      return;
    }
    // Medium intensity allows full screen + rewards/mediums but filters out minor/frequent ones if categorised differently
    if (settings.celebrationIntensity === 'medium' && event.category === 'small') {
      return;
    }

    // Resolve final title and description
    const finalTitle = customProps?.title || event.title || '';
    const finalDescription = customProps?.description || event.description || '';

    // Validate with Centralized Celebration Manager
    if (!celebrationManager.shouldCelebrate(event.triggerType, finalTitle, finalDescription)) {
      return;
    }

    // Prevent duplicate popups for the same event within a single action/session
    const triggerKey = `${event.triggerType}_${finalTitle}`;
    const now = Date.now();
    const lastTriggerTime = recentTriggersRef.current.get(triggerKey);
    if (lastTriggerTime && (now - lastTriggerTime) < 8000) {
      console.log(`[Celebration Shield] Suppressed duplicate client trigger for: ${triggerKey}`);
      return;
    }
    recentTriggersRef.current.set(triggerKey, now);

    // Record milestone in manager
    celebrationManager.recordCelebration(event.triggerType, finalTitle, finalDescription);

    // Merge with custom props
    const finalEvent: CelebrationEvent = {
      ...event,
      ...customProps,
      title: finalTitle,
      description: finalDescription,
      heading: customProps?.heading || 'Challenge Complete!',
      taskTitle: customProps?.taskTitle || customProps?.title || event.title,
      id: event.id + '_' + Date.now() // Unique ID to force re-render
    };

    // Consolidate celebrations into a single overlay instead of chaining multiple popups
    if (activeCelebration) {
      setActiveCelebration(prev => {
        if (!prev) return finalEvent;
        return {
          ...prev,
          cookiesEarned: (prev.cookiesEarned || 0) + (customProps?.cookiesEarned || 0),
          xpEarned: (prev.xpEarned || 0) + (customProps?.xpEarned || 0),
          badgeUnlocked: customProps?.badgeUnlocked || prev.badgeUnlocked,
          featureUnlocked: customProps?.featureUnlocked || prev.featureUnlocked,
        };
      });
      return;
    }

    if (celebrationQueue.length > 0) {
      setCelebrationQueue(prev => {
        if (prev.length === 0) return [finalEvent];
        const first = { ...prev[0] };
        return [{
          ...first,
          cookiesEarned: (first.cookiesEarned || 0) + (customProps?.cookiesEarned || 0),
          xpEarned: (first.xpEarned || 0) + (customProps?.xpEarned || 0),
          badgeUnlocked: customProps?.badgeUnlocked || first.badgeUnlocked,
          featureUnlocked: customProps?.featureUnlocked || first.featureUnlocked,
        }];
      });
      return;
    }

    setCelebrationQueue([finalEvent]);

    // Write to history if Supabase is connected (and this is NOT a database-driven queue item, to avoid double history log)
    if (supabase && sessionUser && !customProps?.['_db_queue_id' as any]) {
      const cachedProfile = progressService.getProfile();
      const userId = (cachedProfile?.id && isValidUuid(cachedProfile.id)) ? cachedProfile.id : (authUserId && isValidUuid(authUserId) ? authUserId : null);

      if (userId) {
        const historyDedupeKey = `${userId}:${event?.id || finalEvent.title}:${event?.rewardText || ''}:${customProps?.claimId || ''}`;
        const now = Date.now();
        const lastLogged = recentCelebrationHistoryLogs.get(historyDedupeKey);

        if (!lastLogged || (now - lastLogged > 8000)) {
          recentCelebrationHistoryLogs.set(historyDedupeKey, now);
          supabase
            .from('user_celebration_history')
            .insert({
              user_id: userId,
              template_id: event?.id && event.id.startsWith('tmpl_') ? event.id : null,
              trigger_source: event?.triggerType || 'client',
              rewards: event?.rewardText ? { raw_text: event.rewardText } : {},
              metadata: {
                title: finalEvent.title,
                description: finalEvent.description,
                animationType: finalEvent.animationType,
                claim_id: customProps?.claimId || null,
                locally_triggered: true
              },
              viewed_at: new Date().toISOString()
            })
            .then(({ error }) => {
              if (error) console.warn("Could not write history for client-triggered celebration:", error);
            });
        }
      }
    }
  };

  const closeActiveCelebration = async () => {
    const closedEvent = activeCelebration as any;
    setActiveCelebration(null);
    setCelebrationQueue([]); // Single overlay flow: clear remaining queue so no additional popups appear
    isCooldownRef.current = false;

    // If it's a database-driven celebration, delete from queue and log history
    if (closedEvent && closedEvent._db_queue_id && supabase && sessionUser) {
      try {
        const profile = await getProfile(sessionUser);
        const userId = (profile?.id && isValidUuid(profile.id)) ? profile.id : (authUserId && isValidUuid(authUserId) ? authUserId : null);

        console.log("[Supabase Queue] Deleting completed celebration queue item to allow repeat events:", closedEvent._db_queue_id);
        
        // Delete from queue to allow reuse and avoid unique constraint conflicts
        await supabase
          .from('user_celebration_queue')
          .delete()
          .eq('id', closedEvent._db_queue_id);

        if (userId) {
          // Write history
          await supabase
            .from('user_celebration_history')
            .insert({
              user_id: userId,
              template_id: closedEvent._db_template_id,
              trigger_source: closedEvent.triggerType || 'system',
              rewards: closedEvent._db_rewards || {},
              metadata: {
                title: closedEvent.title,
                description: closedEvent.description,
                animationType: closedEvent.animationType
              },
              viewed_at: new Date().toISOString()
            });
        }

        console.log("[Supabase Success] Celebration completed, deleted from queue, and history logged.");
      } catch (err) {
        console.error("Error finalizing celebration queue item:", err);
      }
    }
  };

  const addEvent = async (event: CelebrationEvent) => {
    setEvents(prev => [...prev, event]);
    if (supabase && isSupabaseConfigured) {
      try {
        const row = mapEventToTemplateRow(event);
        console.log("[Supabase Intent] INSERT celebration_templates", row);
        const { error } = await supabase
          .from('celebration_templates')
          .insert(row);
        if (error) {
          console.error("[Supabase Error] Error inserting celebration template:", error);
        } else {
          console.log("[Supabase Success] Celebration template inserted.");
        }
      } catch (err) {
        console.error("Exception adding celebration template:", err);
      }
    }
  };

  const updateEvent = async (updated: CelebrationEvent) => {
    setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
    if (supabase && isSupabaseConfigured) {
      try {
        const row = mapEventToTemplateRow(updated);
        console.log("[Supabase Intent] UPDATE celebration_templates", row);
        const { error } = await supabase
          .from('celebration_templates')
          .update(row)
          .eq('id', updated.id);
        if (error) {
          console.error("[Supabase Error] Error updating celebration template:", error);
        } else {
          console.log("[Supabase Success] Celebration template updated.");
        }
      } catch (err) {
        console.error("Exception updating celebration template:", err);
      }
    }
  };

  const deleteEvent = async (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    if (supabase && isSupabaseConfigured) {
      try {
        console.log("[Supabase Intent] DELETE celebration_templates", id);
        const { error } = await supabase
          .from('celebration_templates')
          .delete()
          .eq('id', id);
        if (error) {
          console.error("[Supabase Error] Error deleting celebration template:", error);
        } else {
          console.log("[Supabase Success] Celebration template deleted.");
        }
      } catch (err) {
        console.error("Exception deleting celebration template:", err);
      }
    }
  };

  const addAsset = (asset: CelebrationAsset) => {
    setAssets(prev => [...prev, asset]);
  };

  const deleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  const updateSettings = (updated: Partial<CelebrationSettings>) => {
    setSettings(prev => ({ ...prev, ...updated }));
  };

  return (
    <CelebrationContext.Provider value={{
      events,
      assets,
      settings,
      activeCelebration,
      socialActivities,
      triggerCelebration,
      closeActiveCelebration,
      addEvent,
      updateEvent,
      deleteEvent,
      addAsset,
      deleteAsset,
      updateSettings,
      addSocialActivity
    }}>
      {children}
    </CelebrationContext.Provider>
  );
};

export const useCelebration = () => {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error('useCelebration must be used within a CelebrationProvider');
  }
  return context;
};
