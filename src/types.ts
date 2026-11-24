import { LucideIcon } from 'lucide-react';

export interface LeaderboardEntry {
  id: string;
  name: string;
  xp: number;
  rank: number;
  isCurrentUser?: boolean;
  avatarBadge?: LucideIcon;
  joinedDate: number;
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
