import { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, Sparkles, ChevronRight, CheckCircle2, 
  ChevronLeft, Clock, Ticket, Shield, Trophy, Check,
  X, HelpCircle, Gift, ChevronDown
} from 'lucide-react';
import cookiesIcon from '@/cookies.webp';
import chestIcon from '@/Chest.webp';
import avatarDefaultIcon from '@/avatar.webp';
import RewardsFullscreenTransition from './RewardsFullscreenTransition';
import { 
  getRewards, 
  getRedemptionRequests, 
  saveRedemptionRequests, 
  getRewardsAsync, 
  getRedemptionRequestsAsync, 
  saveRedemptionRequestAsync, 
  Reward, 
  RedemptionRequest 
} from '../lib/rewardsStore';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { rewardService } from '../lib/rewardService';
import { useCelebration } from './CelebrationProvider';
import { useTranslation } from '../lib/translation/TranslationContext';

interface RewardsStoreProps {
  xp: number;
  gems: number;
  isPlus: boolean;
  togglePlus: () => void;
  userEmail: string;
  username: string;
  selectedAvatarId?: string;
  onProfileClick?: () => void;
  onGemsChange: (val: number) => void;
  onXpChange: (val: number) => void;
  onBackToHome: () => void;
}

const DEFAULT_FALLBACK_REWARDS: Reward[] = [
  {
    id: 'spot-ather',
    title: 'Ather Halo Ultra',
    subtitle: 'Smart Helmet',
    description: 'Smart helmet with integrated Harman Kardon sound, auto-detect crash telemetry, and wireless charging.',
    category: 'Spotlight Rewards',
    requirementType: 'gems',
    xpRequirement: 5000,
    gemRequirement: 2500,
    plusRequirement: false,
    isPlusExclusive: false,
    eligibilityRules: 'Reach 2,500 Cookies',
    featuredStatus: true,
    isActive: true,
    rarity: 'mythic',
    visual: '/ather_halo_ultra.jpg',
    image: '/ather_halo_ultra.jpg'
  },
  {
    id: 'spot-macbook',
    title: 'Apple MacBook Pro M3',
    description: 'Liquid Retina XDR display, supercharged performance for AI and coding mastery.',
    category: 'Spotlight Rewards',
    requirementType: 'gems',
    xpRequirement: 10000,
    gemRequirement: 5000,
    plusRequirement: true,
    isPlusExclusive: true,
    eligibilityRules: 'Active Plus Explorer + 5,000 Cookies',
    featuredStatus: true,
    isActive: true,
    rarity: 'mythic',
    visual: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=85',
    image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'spot-watch',
    title: 'Apple Watch Ultra 2',
    description: 'Rugged titanium aerospace casing, precision dual-frequency GPS, active streak tracker.',
    category: 'Spotlight Rewards',
    requirementType: 'gems',
    xpRequirement: 7000,
    gemRequirement: 3500,
    plusRequirement: false,
    isPlusExclusive: false,
    eligibilityRules: 'Reach 3,500 Cookies',
    featuredStatus: true,
    isActive: true,
    rarity: 'legendary',
    visual: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=800&q=85',
    image: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'spot-headphones',
    title: 'Sony WH-1000XM5 Studio',
    description: 'Industry-leading noise cancellation with 8 mics, crystal clear audio study focus.',
    category: 'Spotlight Rewards',
    requirementType: 'gems',
    xpRequirement: 5000,
    gemRequirement: 2500,
    plusRequirement: false,
    isPlusExclusive: false,
    eligibilityRules: 'Reach 2,500 Cookies',
    featuredStatus: true,
    isActive: true,
    rarity: 'legendary',
    visual: 'https://images.unsplash.com/photo-1588449668338-d13417f16fd0?auto=format&fit=crop&w=800&q=85',
    image: 'https://images.unsplash.com/photo-1588449668338-d13417f16fd0?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'ai-chatgpt',
    title: 'ChatGPT Plus Annual Pass',
    description: 'Unlock GPT-4o, coding interpreter, reasoning agents, and custom knowledge assistants.',
    category: 'AI Tools',
    requirementType: 'gems',
    xpRequirement: 2400,
    gemRequirement: 1200,
    plusRequirement: false,
    isPlusExclusive: false,
    eligibilityRules: 'Reach 1,200 Cookies',
    featuredStatus: true,
    isActive: true,
    rarity: 'epic',
    visual: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=400&q=80',
    image: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'ai-perplexity',
    title: 'Perplexity Pro Researcher',
    description: 'Real-time scholarly web citations, multimodal search models, and ad-free insights.',
    category: 'AI Tools',
    requirementType: 'gems',
    xpRequirement: 2000,
    gemRequirement: 1000,
    plusRequirement: false,
    isPlusExclusive: false,
    eligibilityRules: 'Reach 1,000 Cookies',
    featuredStatus: false,
    isActive: true,
    rarity: 'epic',
    visual: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'ai-canva',
    title: 'Canva Pro Design Suite',
    description: '100M+ design templates, AI Magic Studio, presentation deck builders, and premium fonts.',
    category: 'AI Tools',
    requirementType: 'gems',
    xpRequirement: 1600,
    gemRequirement: 800,
    plusRequirement: false,
    isPlusExclusive: false,
    eligibilityRules: 'Reach 800 Cookies',
    featuredStatus: false,
    isActive: true,
    rarity: 'rare',
    visual: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=400&q=80',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'digit-pass',
    title: 'Chikoo Master Pass 6-Mo',
    description: 'Infinite practice energy, double cookies multiplier, legendary avatar halos and auras.',
    category: 'Digital Rewards',
    requirementType: 'gems',
    xpRequirement: 1200,
    gemRequirement: 600,
    plusRequirement: false,
    isPlusExclusive: false,
    eligibilityRules: 'Reach 600 Cookies',
    featuredStatus: false,
    isActive: true,
    rarity: 'epic',
    visual: 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&w=400&q=80',
    image: 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&w=400&q=80'
  }
];

const playWebAudioSound = (type: 'shimmer' | 'explosion' | 'coin' | 'powerup' | 'click' | 'lock') => {
  try {
    // @ts-ignore
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'coin') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.frequency.setValueAtTime(987.77, ctx.currentTime); 
      osc2.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08); 
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc2.start(ctx.currentTime + 0.08);
      osc1.stop(ctx.currentTime + 0.3);
      osc2.stop(ctx.currentTime + 0.3);
    } else if (type === 'powerup') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(250, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'explosion') {
      const bufferSize = ctx.sampleRate * 0.45;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.45);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
      noise.stop(ctx.currentTime + 0.45);
    } else if (type === 'shimmer') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1800, ctx.currentTime + 0.15);
      osc.frequency.linearRampToValueAtTime(1500, ctx.currentTime + 0.3);
      osc.frequency.linearRampToValueAtTime(2200, ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } else if (type === 'lock') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.setValueAtTime(90, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    console.warn("Web Audio API omitted:", e);
  }
};

const getRarityConfigs = (rarity?: string) => {
  switch (rarity) {
    case 'mythic':
      return {
        badgeText: 'Mythic',
        gradient: 'from-rose-500 via-pink-500 to-amber-500',
        starColor: 'text-amber-200',
        border: 'border-rose-400/50',
        glow: 'shadow-[0_4px_16px_rgba(244,63,94,0.5)]'
      };
    case 'legendary':
      return {
        badgeText: 'Legendary',
        gradient: 'from-amber-500 via-orange-500 to-yellow-400',
        starColor: 'text-yellow-100',
        border: 'border-amber-300/50',
        glow: 'shadow-[0_4px_16px_rgba(245,158,11,0.5)]'
      };
    case 'epic':
      return {
        badgeText: 'Epic',
        gradient: 'from-purple-600 via-fuchsia-500 to-indigo-600',
        starColor: 'text-fuchsia-200',
        border: 'border-purple-300/50',
        glow: 'shadow-[0_4px_16px_rgba(168,85,247,0.5)]'
      };
    case 'rare':
      return {
        badgeText: 'Rare',
        gradient: 'from-cyan-500 via-sky-500 to-blue-600',
        starColor: 'text-cyan-100',
        border: 'border-cyan-300/50',
        glow: 'shadow-[0_4px_16px_rgba(14,165,233,0.5)]'
      };
    default:
      return {
        badgeText: 'Rare',
        gradient: 'from-slate-600 via-slate-500 to-slate-700',
        starColor: 'text-slate-200',
        border: 'border-slate-400/40',
        glow: 'shadow-[0_4px_16px_rgba(100,116,139,0.3)]'
      };
  }
};

const getRewardProgress = (reward: any, gems: number, isPlus: boolean) => {
  const requiredNum = reward.gemRequirement || Math.round((reward.xpRequirement || 1000) / 2) || 500;
  const currentNum = gems;
  const ratio = Math.min(100, Math.max(0, (currentNum / requiredNum) * 100));
  const isEligibleScore = currentNum >= requiredNum;
  const isEligiblePlus = !reward.plusRequirement || isPlus;

  return {
    ratio,
    currentNum,
    requiredNum,
    isFullyEligible: isEligibleScore && isEligiblePlus,
    plusLocked: reward.plusRequirement && !isPlus
  };
};

const HolographicStarburstBadge = memo(() => {
  return (
    <div className="absolute -top-4 -left-4 sm:-top-5 sm:-left-5 z-20 w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center select-none pointer-events-none filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="holographicStarburstGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbcfe8" />
            <stop offset="25%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#bbf7d0" />
            <stop offset="75%" stopColor="#a5f3fc" />
            <stop offset="100%" stopColor="#fbcfe8" />
          </linearGradient>
        </defs>
        <polygon
          points="50,2 57,9 66,5 71,13 81,12 83,21 93,23 92,33 100,37 96,46 100,55 94,63 96,72 87,77 86,87 76,89 72,97 62,96 56,100 48,97 41,100 35,95 25,97 22,88 12,85 12,75 3,71 5,61 0,53 5,44 1,35 9,30 8,20 18,18 20,8 30,10 35,2 43,7"
          fill="url(#holographicStarburstGradient)"
          stroke="#ffffff"
          strokeWidth="0.8"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center font-black text-slate-900 leading-none -rotate-[6deg] pt-0.5">
        <span className="text-[7px] tracking-wider uppercase font-black text-slate-800">BEBETTA</span>
        <span className="text-[10px] font-black uppercase tracking-tight text-slate-950 my-0.5 leading-tight">MEGA</span>
        <span className="text-[9.5px] font-black uppercase tracking-tight text-slate-950 leading-tight">JACKPOT</span>
        <span className="text-[7px] font-black uppercase tracking-widest text-slate-800 mt-0.5">DAILY</span>
      </div>
    </div>
  );
});

function RewardsStore({ 
  xp, 
  gems, 
  isPlus, 
  togglePlus, 
  userEmail, 
  username,
  selectedAvatarId,
  onProfileClick,
  onGemsChange,
  onBackToHome 
}: RewardsStoreProps) {
  const { t } = useTranslation();
  const { triggerCelebration } = useCelebration();
  
  // Real database and local state
  const [rewardsList, setRewardsList] = useState<Reward[]>(() => {
    const stored = getRewards();
    return stored.length > 0 ? stored : DEFAULT_FALLBACK_REWARDS;
  });
  const [redemptions, setRedemptions] = useState<RedemptionRequest[]>(() => getRedemptionRequests());
  const [activeHeroRewardId, setActiveHeroRewardId] = useState<string>('spot-ather');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Interactive feedback and mystery chest state
  const [customModal, setCustomModal] = useState<{
    title: string;
    body: string;
    icon: string;
    buttonText: string;
    isPlusRef?: boolean;
  } | null>(null);

  const [isOpeningChest, setIsOpeningChest] = useState(false);
  const [showChestModal, setShowChestModal] = useState(false);
  const [chestReward, setChestReward] = useState<{ title: string; subtitle: string; icon: string; valueText: string; } | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showOpeningTransition, setShowOpeningTransition] = useState(true);
  const isActionLockedRef = useRef(false);

  // Real countdown timer ticking down to midnight UTC
  const [countdown, setCountdown] = useState<{ hours: string; minutes: string; seconds: string }>({
    hours: '08',
    minutes: '42',
    seconds: '19'
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setUTCHours(23, 59, 59, 999);
      let diff = endOfDay.getTime() - now.getTime();
      if (diff <= 0) {
        diff = 24 * 60 * 60 * 1000 + diff;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0')
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync real-time data from database
  useEffect(() => {
    let isMounted = true;
    async function syncRealtimeData() {
      try {
        const liveProducts = await getRewardsAsync();
        if (isMounted && liveProducts && liveProducts.length > 0) {
          setRewardsList(liveProducts);
        }
      } catch (err) {
        console.warn('Realtime dynamic rewards load error:', err);
      }
      try {
        const liveRequests = await getRedemptionRequestsAsync();
        if (isMounted && liveRequests) {
          setRedemptions(liveRequests);
        }
      } catch (err) {
        console.warn('Realtime redemptions load error:', err);
      }
    }
    syncRealtimeData();
    return () => { isMounted = false; };
  }, []);

  // Supabase real-time subscription
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('rewards-realtime-jackpot-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards' }, async () => {
        try {
          const liveProducts = await getRewardsAsync();
          if (liveProducts && liveProducts.length > 0) setRewardsList(liveProducts);
        } catch (e) {
          console.warn("Real-time rewards update failed:", e);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Consolidate processed rewards with fallbacks
  const processedRewards = useMemo(() => {
    const list = rewardsList.length > 0 ? rewardsList : DEFAULT_FALLBACK_REWARDS;
    return list.map(r => {
      let rarity = r.rarity;
      if (!rarity) {
        if (r.id === 'spot-macbook' || r.title?.toLowerCase().includes('macbook')) rarity = 'mythic';
        else if (r.category === 'Spotlight Rewards' || r.id.startsWith('spot-')) rarity = 'legendary';
        else if (r.category === 'AI Tools') rarity = 'epic';
        else rarity = 'rare';
      }
      return {
        ...r,
        rarity,
        image: r.image || r.visual || '',
        visual: r.visual || r.image || ''
      };
    });
  }, [rewardsList]);

  // In hero section and horizontal selector, ONLY display spotlight rewards as requested
  const spotlightRewards = useMemo(() => {
    const spotlights = processedRewards.filter(r => 
      r.category === 'Spotlight Rewards' || 
      (typeof r.category === 'string' && r.category.toLowerCase().includes('spotlight')) ||
      r.featuredStatus
    );
    return spotlights.length > 0 ? spotlights : processedRewards;
  }, [processedRewards]);

  const filteredCatalogRewards = useMemo(() => {
    if (selectedCategory === 'All') return processedRewards;
    if (selectedCategory === 'Spotlight') {
      return processedRewards.filter(r => 
        r.category === 'Spotlight Rewards' || 
        (typeof r.category === 'string' && r.category.toLowerCase().includes('spotlight')) || 
        r.featuredStatus
      );
    }
    if (selectedCategory === 'AI Tools') {
      return processedRewards.filter(r => r.category === 'AI Tools');
    }
    if (selectedCategory === 'Digital') {
      return processedRewards.filter(r => r.category === 'Digital Rewards' || r.category === 'Cosmetic Rewards');
    }
    return processedRewards;
  }, [processedRewards, selectedCategory]);

  // Active hero reward: strictly from spotlight rewards
  const activeHeroReward = useMemo(() => {
    if (spotlightRewards.length === 0) return null;
    const found = spotlightRewards.find(r => r.id === activeHeroRewardId);
    return found || spotlightRewards[0];
  }, [spotlightRewards, activeHeroRewardId]);

  // Keep active reward in sync with available spotlight rewards from database
  useEffect(() => {
    if (spotlightRewards.length > 0) {
      const exists = spotlightRewards.some(r => r.id === activeHeroRewardId);
      if (!exists) {
        setActiveHeroRewardId(spotlightRewards[0].id);
      }
    }
  }, [spotlightRewards, activeHeroRewardId]);

  // Carousel navigation between spotlight rewards only
  const handleNextReward = useCallback(() => {
    playWebAudioSound('click');
    if (spotlightRewards.length === 0) return;
    const currentId = activeHeroReward ? activeHeroReward.id : spotlightRewards[0].id;
    const idx = spotlightRewards.findIndex(r => r.id === currentId);
    const nextIdx = (idx + 1) % spotlightRewards.length;
    setActiveHeroRewardId(spotlightRewards[nextIdx].id);
  }, [spotlightRewards, activeHeroReward]);

  const handlePrevReward = useCallback(() => {
    playWebAudioSound('click');
    if (spotlightRewards.length === 0) return;
    const currentId = activeHeroReward ? activeHeroReward.id : spotlightRewards[0].id;
    const idx = spotlightRewards.findIndex(r => r.id === currentId);
    const prevIdx = (idx - 1 + spotlightRewards.length) % spotlightRewards.length;
    setActiveHeroRewardId(spotlightRewards[prevIdx].id);
  }, [spotlightRewards, activeHeroReward]);

  // Real Claim / Bid Action handler
  const handleRedeemRequest = useCallback(async (reward: any) => {
    if (isActionLockedRef.current) return;
    playWebAudioSound('click');

    const progress = getRewardProgress(reward, gems, isPlus);
    if (!progress.isFullyEligible) {
      playWebAudioSound('lock');
      if (progress.plusLocked) {
        setCustomModal({
          title: "Plus Membership Required",
          body: "This jackpot prize requires active Chikoo Plus to bid and claim. Upgrade your membership to unlock access!",
          icon: "👑",
          buttonText: "Upgrade to Plus",
          isPlusRef: true
        });
      } else {
        const cookiesNeeded = progress.requiredNum - progress.currentNum;
        setCustomModal({
          title: "Keep Learning to Bid!",
          body: `You currently have ${progress.currentNum.toLocaleString()} Cookies, but this jackpot requires ${progress.requiredNum.toLocaleString()} Cookies. Earn ${cookiesNeeded.toLocaleString()} more by completing daily study nodes!`,
          icon: "🍪",
          buttonText: "Return to Study"
        });
      }
      return;
    }

    try {
      isActionLockedRef.current = true;
      const redeemRes = await rewardService.spendCookies(progress.requiredNum, `Jackpot Claim: ${reward.title}`, reward.id);
      if (!redeemRes.success) {
        return;
      }

      onGemsChange(redeemRes.newBalance);

      const newRequest: RedemptionRequest = {
        id: 'req_' + Date.now(),
        rewardId: reward.id,
        userEmail: userEmail,
        username: username,
        createdAt: new Date().toISOString(),
        status: 'pending',
        notes: reward.plusRequirement ? 'Jackpot Plus Claim.' : 'Jackpot Claim.',
        rewardTitle: reward.title,
        rewardCategory: reward.category,
        gemsPaid: progress.requiredNum,
        xpPaid: undefined
      };

      const nextRedemptions = [newRequest, ...redemptions];
      setRedemptions(nextRedemptions);
      saveRedemptionRequests(nextRedemptions);
      saveRedemptionRequestAsync(newRequest);

      playWebAudioSound('shimmer');
      triggerCelebration('e1', {
        title: "JACKPOT CLAIMED! 🏆",
        description: reward.title,
        rewardText: reward.title,
        badgeUnlocked: reward.title
      });
    } finally {
      isActionLockedRef.current = false;
    }
  }, [gems, isPlus, userEmail, username, redemptions, onGemsChange, triggerCelebration]);

  // Mystery Chest functionality
  const openMysteryChest = useCallback(async () => {
    if (isOpeningChest || isActionLockedRef.current) return;

    if (gems < 500) {
      playWebAudioSound('lock');
      setCustomModal({
        title: "Insufficient Cookies",
        body: `Unlocking the Mystery Chest costs 500 Cookies. You have ${gems} 🍪. Earn more by completing lessons!`,
        icon: "🎁",
        buttonText: "Study to Recharge"
      });
      return;
    }

    try {
      isActionLockedRef.current = true;
      const spendRes = await rewardService.spendCookies(500, 'Jackpot: Mystery Chest', 'mystery_chest');
      if (!spendRes.success) {
        playWebAudioSound('lock');
        return;
      }
      
      onGemsChange(spendRes.newBalance);
      setIsOpeningChest(true);
      
      let soundTicks = 0;
      const interval = setInterval(() => {
        playWebAudioSound('click');
        soundTicks++;
        if (soundTicks >= 5) clearInterval(interval);
      }, 150);

      setTimeout(async () => {
        playWebAudioSound('explosion');
        
        const potentialPrizes = [
          { title: "Super Cookie Jackpot", subtitle: "Mega Jackpot multiplier awarded!", valueText: "+1,000 Cookies", icon: "Cookie" },
          { title: "Ancient Study Elixir", subtitle: "Double learning power boost!", valueText: "+600 Cookies", icon: "Cookie" },
          { title: "Golden Champion Halo", subtitle: "Legendary status item for your profile!", valueText: "Avatar Halo Unlocked", icon: "Crown" },
          { title: "Cookie Cache Pouch", subtitle: "Instant refund back to balance!", valueText: "+300 Cookies", icon: "Cookie" },
        ];
        
        const won = potentialPrizes[Math.floor(Math.random() * potentialPrizes.length)];
        setChestReward(won);
        setShowChestModal(true);
        
        if (won.title.includes("Cookie")) {
          const value = won.title.includes("Super") ? 1000 : won.title.includes("Ancient") ? 600 : 300;
          const grantRes = await rewardService.grantReward({
            claimId: `chest_reward_${Date.now()}`,
            amount: value,
            rewardType: 'treasure_chest'
          });
          onGemsChange(grantRes.newBalance);
          setTimeout(() => playWebAudioSound('coin'), 250);
        } else {
          setTimeout(() => playWebAudioSound('shimmer'), 250);
        }
        
        setIsOpeningChest(false);
        isActionLockedRef.current = false;
      }, 1000);
    } catch {
      setIsOpeningChest(false);
      isActionLockedRef.current = false;
    }
  }, [gems, isOpeningChest, onGemsChange]);

  const activeRewardProgress = useMemo(() => {
    return getRewardProgress(activeHeroReward, gems, isPlus);
  }, [activeHeroReward, gems, isPlus]);

  const rarityConfig = useMemo(() => {
    return getRarityConfigs(activeHeroReward?.rarity);
  }, [activeHeroReward?.rarity]);

  return (
    <div 
      id="rewards-jackpot-showcase"
      className="w-full h-full text-white font-sans flex flex-col justify-start overflow-y-auto overflow-x-hidden relative select-none scrollbar-hide bg-gradient-to-b from-[#1b202e] via-[#0f121a] via-[#080911] to-[#000000]"
    >
      {/* Fullscreen Opening Transition Animation */}
      <AnimatePresence>
        {showOpeningTransition && (
          <RewardsFullscreenTransition 
            onComplete={() => setShowOpeningTransition(false)} 
          />
        )}
      </AnimatePresence>
      {/* 1. Dynamic Silver Metallic Ambient Gradient Sheen across background (Zero-lag, 60fps GPU rendered) */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(ellipse 110% 60% at 50% -5%, rgba(226, 232, 240, 0.20) 0%, rgba(148, 163, 184, 0.10) 35%, rgba(51, 65, 85, 0.03) 65%, transparent 100%),
            linear-gradient(135deg, rgba(255, 255, 255, 0.07) 0%, rgba(148, 163, 184, 0.03) 30%, transparent 60%, rgba(203, 213, 225, 0.04) 100%)
          `
        }}
      />

      {/* 2. Thin, crisp silver square grid mesh across the screen (zero-lag lightweight CSS) */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(203, 213, 225, 0.045) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(203, 213, 225, 0.045) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Custom Stylesheet for dual tilted ribbons & stroke text (lightweight & 60fps smooth) */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee-scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-scroll-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee-ribbon-left {
          animation: marquee-scroll-left 22s linear infinite;
          will-change: transform;
        }
        .animate-marquee-ribbon-right {
          animation: marquee-scroll-right 24s linear infinite;
          will-change: transform;
        }
        .stroke-marquee-text {
          -webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.95);
          color: transparent;
          font-weight: 900;
        }
        .stroke-marquee-text-dark {
          -webkit-text-stroke: 1.2px rgba(216, 180, 254, 0.65);
          color: transparent;
          font-weight: 900;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      {/* 3. Spotlight Hero Screen (Full Viewport: Not visible until scrolled past) */}
      <div className="w-full min-h-[100dvh] flex flex-col justify-between shrink-0 relative z-10 pb-4">
        
        {/* Top status bar matching attached reference image */}
        <div className="w-full max-w-md mx-auto px-4 pt-3 shrink-0">
          <header className="w-full flex items-center justify-between gap-3 py-1">
            {/* Left: Compact squircle profile avatar with cyan border glow */}
            <button
              type="button"
              onClick={() => {
                playWebAudioSound('click');
                if (onProfileClick) onProfileClick();
                else onBackToHome();
              }}
              className="flex items-center gap-2 p-0.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-cyan-400/40 backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.25)] group"
              title="View Profile"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                <img 
                  src={avatarDefaultIcon} 
                  alt="Profile Avatar" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="hidden sm:inline text-xs font-bold text-white/90 pr-2 truncate max-w-[90px]">
                {username || 'Explorer'}
              </span>
            </button>

            {/* Right: Small dark translucent pills for wins & cookies */}
            <div className="flex items-center gap-2">
              {/* Replay Entrance Animation Button */}
              <button
                type="button"
                onClick={() => {
                  playWebAudioSound('shimmer');
                  setShowOpeningTransition(true);
                }}
                className="bg-amber-500/20 hover:bg-amber-500/30 backdrop-blur-md border border-amber-400/50 px-2.5 py-1.5 rounded-full flex items-center gap-1 text-[11px] font-bold text-amber-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.25)] active:scale-95"
                title="Replay Vault Entrance Animation"
              >
                <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                <span className="hidden xs:inline">Vault Entrance</span>
              </button>

              {/* Ticket / Win count pill */}
              <button
                type="button"
                onClick={() => {
                  playWebAudioSound('click');
                  setShowHistoryModal(true);
                }}
                className="bg-[#1c1d2e]/85 hover:bg-[#1c1d2e] backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold text-white transition-all cursor-pointer shadow-sm active:scale-95"
                title="View Won Prizes"
              >
                <span className="text-pink-400 text-xs">🎟️</span>
                <span className="tabular-nums font-mono font-black">{String(redemptions.length).padStart(2, '0')} won</span>
              </button>

              {/* Cookie balance pill */}
              <div className="bg-[#1c1d2e]/85 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-black text-white shadow-sm">
                <span className="text-amber-400 text-xs">🍪</span>
                <span className="tabular-nums font-mono font-black">{gems.toLocaleString()}</span>
              </div>
            </div>
          </header>
        </div>

        {/* 4. Dual Tilted Marquee Ribbons (Mega Jackpot) */}
        <div className="w-full relative overflow-hidden py-1 z-0 select-none pointer-events-none shrink-0 my-0.5">
          {/* Ribbon 1: Upper Tilted Left-Scrolling Ribbon */}
          <div className="w-[160%] -ml-[30%] py-1.5 bg-gradient-to-r from-[#6b25ea] via-[#7c3aed] to-[#6b25ea] border-y border-purple-300/40 shadow-[0_4px_20px_rgba(107,37,234,0.45)] transform -rotate-3 overflow-hidden flex whitespace-nowrap">
            <div className="flex shrink-0 animate-marquee-ribbon-left items-center gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={`mq-l-${i}`} className="text-xl sm:text-2xl font-black tracking-wider stroke-marquee-text inline-flex items-center gap-4">
                  <span>MEGA JACKPOT</span>
                  <span className="text-white text-base not-italic">✦</span>
                </span>
              ))}
            </div>
            <div className="flex shrink-0 animate-marquee-ribbon-left items-center gap-4" aria-hidden="true">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={`mq-l-dup-${i}`} className="text-xl sm:text-2xl font-black tracking-wider stroke-marquee-text inline-flex items-center gap-4">
                  <span>MEGA JACKPOT</span>
                  <span className="text-white text-base not-italic">✦</span>
                </span>
              ))}
            </div>
          </div>

          {/* Ribbon 2: Lower Tilted Right-Scrolling Ribbon */}
          <div className="w-[160%] -ml-[30%] py-1 bg-gradient-to-r from-[#4c1d95] via-[#581c87] to-[#4c1d95] border-y border-purple-400/30 shadow-[0_4px_15px_rgba(88,28,135,0.4)] transform rotate-2 -mt-1 overflow-hidden flex whitespace-nowrap">
            <div className="flex shrink-0 animate-marquee-ribbon-right items-center gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={`mq-r-${i}`} className="text-sm sm:text-base font-black tracking-wider stroke-marquee-text-dark inline-flex items-center gap-4">
                  <span>MEGA JACKPOT</span>
                  <span className="text-purple-300/70 text-xs not-italic">✦</span>
                </span>
              ))}
            </div>
            <div className="flex shrink-0 animate-marquee-ribbon-right items-center gap-4" aria-hidden="true">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={`mq-r-dup-${i}`} className="text-sm sm:text-base font-black tracking-wider stroke-marquee-text-dark inline-flex items-center gap-4">
                  <span>MEGA JACKPOT</span>
                  <span className="text-purple-300/70 text-xs not-italic">✦</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Spotlight Reward Screen: Centered in main viewport */}
        <div className="w-full max-w-md mx-auto px-4 flex-1 flex flex-col items-center justify-center space-y-4 my-auto relative z-10">
          
          {/* Featured reward: Radiant Silver Rimmed Product Panel */}
          {activeHeroReward && (
            <div className="relative flex items-center justify-center w-full max-w-[280px] sm:max-w-[300px]">
              {/* Holographic Starburst Badge */}
              <HolographicStarburstBadge />

              <div 
                id="featured-jackpot-product-panel"
                className="w-full p-[2px] rounded-[30px] bg-gradient-to-b from-[#ffffff] via-[#cbd5e1] to-[#64748b] shadow-2xl relative flex flex-col shrink-0 overflow-hidden z-10"
              >
                {/* Inner Card Container */}
                <div className="w-full h-full bg-[#020307] rounded-[28px] overflow-hidden relative flex flex-col z-10">
                  
                  {/* Upper Section: Product Image */}
                  <div className="relative w-full aspect-square sm:h-[260px] p-0 m-0 overflow-hidden rounded-t-[28px] bg-[#05070d] flex items-center justify-center">
                    
                    {/* Carousel Next & Prev controls on the showcase */}
                    <button
                      type="button"
                      onClick={handlePrevReward}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/85 border border-white/20 text-white/90 hover:text-white backdrop-blur-md transition-all z-30 cursor-pointer shadow-md active:scale-95"
                      aria-label="Previous reward"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={handleNextReward}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/85 border border-white/20 text-white/90 hover:text-white backdrop-blur-md transition-all z-30 cursor-pointer shadow-md active:scale-95"
                      aria-label="Next reward"
                    >
                      <ChevronRight size={16} />
                    </button>

                    {/* Reward Image Presentation */}
                    <img 
                      src={activeHeroReward.image || activeHeroReward.visual} 
                      alt={activeHeroReward.title} 
                      className="w-full h-full object-cover p-0 m-0 select-none pointer-events-none"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = cookiesIcon;
                      }}
                    />

                  </div>

                  {/* Product Information Section: Center aligned, silver text effect */}
                  <div className="px-4 pt-3 pb-3.5 bg-[#020307] border-t border-white/[0.1] flex flex-col items-center text-center rounded-b-[28px] relative overflow-hidden">
                    
                    {/* Subtle specular reflection accent */}
                    <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent mb-1" />

                    {/* Product Title: Bolder text, increased size with silver effect */}
                    <h3 className="text-2xl sm:text-[28px] font-black uppercase tracking-tight leading-tight text-center bg-gradient-to-b from-[#ffffff] via-[#f1f5f9] via-[#cbd5e1] via-[#ffffff] to-[#64748b] bg-clip-text text-transparent drop-shadow-[0_2px_18px_rgba(255,255,255,0.7)] px-1 font-display select-none">
                      {activeHeroReward.title}
                    </h3>

                    {/* Prominent countdown line matching reference image */}
                    <div className="mt-2 flex items-center justify-center gap-1.5 text-xs font-bold tracking-wide">
                      <span className="text-white/90">ends in</span>
                      <span className="text-[#ff7800] font-black font-mono tracking-wider text-sm">
                        {countdown.hours}: {countdown.minutes}: {countdown.seconds}
                      </span>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. Primary Action: Centered, rounded purple-gradient button labeled BID NOW */}
          <div className="w-full flex items-center justify-center mt-2 shrink-0">
            <motion.button
              id="jackpot-avail-now-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleRedeemRequest(activeHeroReward)}
              className="w-40 sm:w-44 py-2.5 rounded-2xl bg-gradient-to-r from-[#6b25ea] via-[#7c3aed] to-[#8b5cf6] hover:from-[#7c3aed] hover:to-[#9333ea] text-white font-black uppercase tracking-wider text-xs shadow-[0_8px_25px_rgba(107,37,234,0.45)] border border-purple-400/40 active:scale-95 transition-all cursor-pointer select-none text-center flex items-center justify-center"
            >
              BID NOW
            </motion.button>
          </div>

        </div>

        {/* Scroll Cue Prompt (Subtle indicator that more rewards exist below) */}
        <div className="w-full flex flex-col items-center justify-center pt-1 pb-1 text-slate-400 select-none">
          <button 
            type="button"
            onClick={() => {
              const el = document.getElementById('reward-catalogue-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-[10px] font-bold uppercase tracking-widest text-slate-400/80 hover:text-white flex items-center gap-1.5 animate-bounce cursor-pointer transition-colors"
          >
            <span>Scroll for catalogue</span>
            <ChevronDown size={13} className="text-purple-400" />
          </button>
        </div>

      </div>

      {/* 7. Structured Reward Catalogue (Revealed when scrolled) */}
      <div 
        id="reward-catalogue-section"
        className="w-full max-w-md mx-auto px-4 pb-32 pt-8 space-y-6 shrink-0 relative z-10 border-t border-white/[0.08]"
      >
        
        {/* Catalogue Section Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-widest text-purple-400 bg-purple-950/60 border border-purple-500/30 px-3 py-1 rounded-full">
              Reward Catalogue
            </span>
            <span className="text-xs font-mono text-slate-400">
              {filteredCatalogRewards.length} items
            </span>
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight font-display pt-1">
            Redeem & Claim
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Spend your study Cookies on exclusive tech, subscriptions, and mystery loot.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
          {['All', 'Spotlight', 'AI Tools', 'Digital'].map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={`cat-${cat}`}
                type="button"
                onClick={() => {
                  playWebAudioSound('click');
                  setSelectedCategory(cat);
                }}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                    : 'bg-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.12] border border-white/[0.06]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Structured Reward Cards */}
        <div className="space-y-3">
          {filteredCatalogRewards.map((reward) => {
            const progress = getRewardProgress(reward, gems, isPlus);
            const rConfig = getRarityConfigs(reward.rarity);
            const isSelected = activeHeroReward && reward.id === activeHeroReward.id;

            return (
              <div
                key={`catalog-${reward.id}`}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isSelected 
                    ? 'bg-[#121424] border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.2)]' 
                    : 'bg-[#0b0d19]/90 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex gap-3 items-center">
                  {/* Product Thumbnail */}
                  <div className="relative w-20 h-20 rounded-xl bg-black/60 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                    <img 
                      src={reward.image || reward.visual} 
                      alt={reward.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => { e.currentTarget.src = cookiesIcon; }}
                    />
                    <span className={`absolute top-1 left-1 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-black/80 border ${rConfig.border} ${rConfig.starColor}`}>
                      {rConfig.badgeText}
                    </span>
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-black text-white truncate font-display">
                        {reward.title}
                      </h4>
                    </div>
                    
                    <p className="text-[10px] text-slate-400 line-clamp-1">
                      {reward.description}
                    </p>

                    {/* Cost & Eligibility */}
                    <div className="flex items-center justify-between pt-0.5">
                      <div className="flex items-center gap-1">
                        <img src={cookiesIcon} alt="Cookies" className="w-3.5 h-3.5 object-contain" />
                        <span className="text-xs font-black text-amber-400 font-mono">
                          {progress.requiredNum.toLocaleString()}
                        </span>
                      </div>

                      {progress.isFullyEligible ? (
                        <span className="text-[9px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                          Eligible
                        </span>
                      ) : progress.plusLocked ? (
                        <span className="text-[9px] font-black text-amber-400 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-full">
                          Plus Required
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-400 bg-white/[0.05] px-2 py-0.5 rounded-full">
                          Need {(progress.requiredNum - progress.currentNum).toLocaleString()} 🍪
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${progress.isFullyEligible ? 'bg-emerald-400' : 'bg-purple-500'}`}
                        style={{ width: `${progress.ratio}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      playWebAudioSound('click');
                      setActiveHeroRewardId(reward.id);
                      const el = document.getElementById('rewards-jackpot-showcase');
                      if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white text-[10px] font-bold transition-colors cursor-pointer text-center"
                  >
                    View in Spotlight
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRedeemRequest(reward)}
                    className={`py-1.5 px-3.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                      progress.isFullyEligible
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-[0_2px_10px_rgba(16,185,129,0.3)] hover:brightness-110 active:scale-95'
                        : 'bg-gradient-to-r from-[#6b25ea] to-[#8b5cf6] text-white hover:brightness-110 active:scale-95'
                    }`}
                  >
                    {progress.isFullyEligible ? 'Claim Prize' : 'Avail Prize'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 8. Mystery Chest Quick Access Deck */}
        <section className="w-full bg-[#0a0c16] border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
              <img 
                src={isOpeningChest ? "https://i.postimg.cc/c4JqTLvT/eee11a5b-9f65-41e4-bbea-701fb184cfc5-(1).webp" : chestIcon} 
                alt="Mystery Chest" 
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = chestIcon; }}
                className="w-8 h-8 object-contain filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-left space-y-0.5">
              <h4 className="text-xs font-black uppercase text-white tracking-wide">Mystery Chest</h4>
              <p className="text-[10px] text-slate-400 font-medium">Randomized cookies & badges (500 🍪)</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openMysteryChest}
            disabled={isOpeningChest}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isOpeningChest ? 'Opening...' : 'Unlock'}
          </motion.button>
        </section>

      </div>

      {/* FEEDBACK WARNING / UPGRADE MODAL */}
      <AnimatePresence>
        {customModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="bg-[#0b0d19] border-2 border-purple-500/40 p-6 rounded-3xl max-w-[320px] w-full text-center space-y-4 shadow-[0_16px_50px_rgba(168,85,247,0.25)] relative overflow-hidden"
            >
              <div className="text-4xl filter drop-shadow-sm mb-1">
                {customModal.icon}
              </div>

              <div className="space-y-1.5 text-left">
                <h3 className="text-base font-black text-white uppercase tracking-tight font-display text-center">
                  {customModal.title}
                </h3>
                <p className="text-xs text-slate-300 font-medium leading-relaxed text-center">
                  {customModal.body}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    playWebAudioSound('click');
                    if (customModal.isPlusRef) {
                      togglePlus();
                    }
                    setCustomModal(null);
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-widest shadow-md cursor-pointer hover:brightness-110 active:scale-95 transition-all"
                >
                  {customModal.buttonText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MYSTERY CHEST WIN REVEAL MODAL */}
      <AnimatePresence>
        {showChestModal && chestReward && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              className="bg-[#0b0d19] border-2 border-amber-400/50 p-6 rounded-3xl max-w-[300px] w-full text-center space-y-4 shadow-[0_16px_50px_rgba(245,158,11,0.3)] relative overflow-hidden"
            >
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">CHEST UNLOCKED</span>
                <h3 className="text-sm font-black text-white uppercase tracking-tight font-display">
                  {chestReward.title}
                </h3>
              </div>

              <div className="h-28 rounded-2xl bg-black/60 border border-white/10 flex flex-col items-center justify-center p-3 relative overflow-hidden">
                <img 
                  src="https://i.postimg.cc/c4JqTLvT/eee11a5b-9f65-41e4-bbea-701fb184cfc5-(1).webp" 
                  alt="Opened Chest" 
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = chestIcon; }}
                  className="w-16 h-16 object-contain filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.6)] mb-1"
                  referrerPolicy="no-referrer"
                />
                <div className="text-xs font-black text-amber-300 font-mono">
                  {chestReward.valueText}
                </div>
              </div>

              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                {chestReward.subtitle}
              </p>

              <button
                type="button"
                onClick={() => {
                  playWebAudioSound('coin');
                  setShowChestModal(false);
                }}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black py-3 rounded-2xl text-xs uppercase tracking-widest shadow-md cursor-pointer hover:brightness-110 active:scale-95 transition-all"
              >
                Equip Reward
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WON PRIZES & REDEMPTIONS DRAWER MODAL */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#0b0d19] border border-white/15 p-6 rounded-3xl max-w-[340px] w-full space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Ticket size={16} className="text-purple-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider font-display">
                    Won Jackpots ({redemptions.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                {redemptions.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No active jackpot claims yet. Place your first bid!
                  </div>
                ) : (
                  redemptions.map((req) => (
                    <div 
                      key={req.id} 
                      className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between text-left"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-white truncate">
                          {req.rewardTitle || 'Jackpot Reward'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span className="shrink-0 text-[9px] font-black uppercase text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        {req.status}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default memo(RewardsStore);
