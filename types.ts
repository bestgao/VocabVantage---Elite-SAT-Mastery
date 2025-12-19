
export type MasteryLevel = 0 | 1 | 2 | 3; // 0: Not Started, 1: Learning, 2: Near Mastery, 3: Mastered

export interface UserInventory {
  streakFreezes: number;
  xpBoosters: number;
}

export interface UserProgress {
  wordMastery: Record<string, MasteryLevel>;
  streak: number;
  lastActive: string; // ISO String
  lastCheckIn: string; // ISO String
  xp: number;
  credits: number; 
  highScores: Record<string, number>;
  inventory: UserInventory;
  achievements: string[];
  academicIntegrity: number; // 0-100 score to prevent botting
  isPremium: boolean; // Tracks if the user has a paid subscription
}

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
