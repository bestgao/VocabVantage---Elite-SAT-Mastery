
export type MasteryLevel = 0 | 1 | 2 | 3; // 0: Red, 1: Orange, 2: Yellow, 3: Green

export interface Word {
  id: string;
  term: string;
  definition: string;
  partOfSpeech: string;
  example: string;
  synonyms: string[];
  mnemonic?: string;
  imageUrl?: string;
}

export interface UserInventory {
  streakFreezes: number;
  xpBoosters: number;
}

export interface Achievement {
  id: string;
  title: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  description: string;
  isUnlocked: boolean;
}

export interface UserProgress {
  wordMastery: Record<string, MasteryLevel>;
  streak: number;
  lastActive: string; // ISO String
  lastCheckIn: string; // ISO String for reward claim
  xp: number;
  credits: number; // Vantage Credits (VC)
  highScores: Record<string, number>;
  inventory: UserInventory;
  achievements: string[]; // IDs of unlocked achievements
}

export enum AppScreen {
  DASHBOARD = 'DASHBOARD',
  LEARN = 'LEARN',
  QUIZ = 'QUIZ',
  WORD_BANK = 'WORD_BANK',
  AI_TUTOR = 'AI_TUTOR',
  GAMES = 'GAMES',
  LEADERBOARD = 'LEADERBOARD',
  STORE = 'STORE',
  ACHIEVEMENTS = 'ACHIEVEMENTS'
}

export interface QuizQuestion {
  id: string;
  word: Word;
  questionText: string;
  options: string[];
  correctIndex: number;
  type: 'definition' | 'context';
}
