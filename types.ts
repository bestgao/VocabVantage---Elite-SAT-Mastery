
export type MasteryLevel = 0 | 1 | 2 | 3; 

export interface SessionConfig {
  levels: string[];
  freqs: string[];
  masteries: number[];
}

export interface UserInventory {
  streakFreezes: number;
  xpBoosters: number;
}

export interface UserProgress {
  wordMastery: Record<string, MasteryLevel>;
  masteryHistory: Record<string, number>; 
  dailyGainHistory: Record<string, number>; 
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
  // Plan & Motivation
  dailyMasteryGoal: number;
  dailyMasteryProgress: Record<string, number>; // Date string YYYY-MM-DD -> count of words reaching Lvl 3
  dailyReviewedProgress: Record<string, number>; // Date string YYYY-MM-DD -> count of total words reviewed
  milestonesClaimed: string[]; 
  lastConfig: SessionConfig;
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
  satLevel: 'Core' | 'Medium' | 'Advanced';
  frequencyTier: 'High' | 'Mid' | 'Low';
}

export enum AppScreen {
  DASHBOARD = 'DASHBOARD',
  LEARN = 'LEARN',
  STUDY_SETUP = 'STUDY_SETUP',
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
