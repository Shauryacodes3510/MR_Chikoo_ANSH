export type ArenaPhase = 
  | 'lobby'
  | 'matchmaking'
  | 'match_found'
  | 'countdown'
  | 'battle'
  | 'finished'
  | 'error';

export interface ArenaPlayer {
  id: string;
  displayName: string;
  avatar: string;
  score: number;
  progress: number;
  connected: boolean;
  vehicleName?: string;
  vehicleColor?: string;
}

export interface ArenaQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  category?: string;
  explanation?: string;
}

export interface RivalProfile {
  id: string;
  name: string;
  title: string;
  avatar: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'boss';
  vehicleName: string;
  colorTheme: string;
  topSpeed: number;
  botBaseSpeed: number;
  quotes: {
    intro: string;
    overtake: string[];
    overtaken: string[];
    victory: string;
    defeat: string;
  };
}

export interface VehicleBooster {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  nitroBonus: number;
  unlocked: boolean;
}

export type VehicleMotionState = 'cruising' | 'boost' | 'hyper' | 'stall' | 'overtake';

export interface RaceTelemetry {
  playerDistance: number;
  opponentDistance: number;
  targetDistance: number;
  currentSpeed: number;
  topSpeed: number;
  playerStreak: number;
  isOverdrive: boolean;
  position: 1 | 2;
  gapMeters: number;
  playerState: VehicleMotionState;
  opponentState: VehicleMotionState;
  activeRivalQuote: string | null;
  lastAnswerResult: {
    isCorrect: boolean;
    answerTime: number;
    speedDelta: number;
    xpEarned: number;
    boostLabel: string;
  } | null;
}

export interface ArenaMatch {
  id: string;
  player: ArenaPlayer;
  opponent: ArenaPlayer;
  status: ArenaPhase;
  currentQuestion?: ArenaQuestion;
  questionIndex: number;
  startedAt: number;
  playerScore: number;
  opponentScore: number;
}

export interface ArenaResult {
  winnerId: string | null;
  playerScore: number;
  opponentScore: number;
  playerDistance: number;
  opponentDistance: number;
  topSpeed: number;
  accuracy: number;
  fastAnswersCount: number;
  xpEarned: number;
  cookiesEarned: number;
  trophiesEarned: number;
  completedAt: number;
}
