
export type MasteryLevel = 0 | 1 | 2 | 3; // 0: Level 1 (Hard), 1: Level 2 (Learning), 2: Level 3 (Review), 3: Level 4 (Mastered)

export interface UserInventory {
  streakFreezes: number;
  xpBoosters: number;
}

export interface UserProgress {
  wordMastery: Record<string, MasteryLevel>;
  masteryHistory: Record<string, number>; // date (YYYY-MM-DD) -> count of level 3 words
  customWords: Word[];
  streak: number;
  lastActive: string; 
  lastCheckIn: string; 
  xp: number;
  credits: number; 
  highScores: Record<string, number>;
  inventory: UserInventory;
  achievements: string[];
  academicIntegrity: number;
  isPremium: boolean;
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
