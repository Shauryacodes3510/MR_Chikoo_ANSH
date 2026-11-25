import { LucideIcon } from 'lucide-react';

export interface LeaderboardEntry {
  id: string;
  name: string;
  /**
   * Weekly leaderboard XP score (resets weekly on Sunday midnight UTC;
   * tracks competitive weekly learning progress, distinct from spendable cookies/gems).
   */
  xp: number;
  rank: number;
  weekly_xp?: number;
  resetsAt?: string;
  isCurrentUser?: boolean;
  avatarBadge?: LucideIcon;
  joinedDate?: number;
  avatar?: string;
  streak?: number;
}

/**
 * User profile interface representing student accounts, stats, and gamification progress.
 */
export interface UserProfile {
  id?: string;
  email: string;
  username: string;
  xp: number;
  /** Weekly XP tally for competitive leaderboard ranking */
  weekly_xp: number;
  /** ISO week key (e.g. '2026-W48') for tracking lazy reset cycles */
  weekly_xp_week?: string | null;
  gems: number;
  streak: number;
  energy: number;
  accuracy: number;
  avatar_id: string;
  theme_id: string;
  best_streak: number;
  completed_lessons: string[];
  bookmarked_lessons: string[];
  completed_daily_challenges: string[];
  is_admin: boolean;
  total_chests_claimed: number;
  total_steps_claimed: number;
  trophies: number;
  created_at: string;
  last_chest_claimed_at?: string | null;
  last_streak_date?: string | null;
  claimed_rewards?: string[];
  welcome_video_seen?: boolean;
  onboarding_completed?: boolean;
}

export interface League {
  id: string;
  name: string;
  color: string;
  fill: string;
  promoteTop: number;
  demoteBottom: number;
  icon?: LucideIcon;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  xpReward: number;
  type: 'concept' | 'puzzle' | 'logic';
  module_id?: string;
  world_id?: string;
}
