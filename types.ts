
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

export interface WordSRS {
  lastReviewed: string;
  nextReviewAt: string;
  intervalDays: number;
}

export interface ActivityEntry {
  date: string; // YYYY-MM-DD
  mastered: number;
  reviewed: number;
  xpGained: number;
}

export interface UserProgress {
  version: number;
  revision: number; // Atomic counter for V17+
  updatedAt: number;
  wordMastery: Record<string, MasteryLevel>;
  wordSRS: Record<string, WordSRS>;
  activityLedger: Record<string, ActivityEntry>; 
  streak: number;
  lastActive: string;
  xp: number;
  credits: number;
  inventory: UserInventory;
  dailyMasteryGoal: number;
  weeklyMasteryGoal: number;
  monthlyMasteryGoal: number;
  quarterlyMasteryGoal: number;
  annualMasteryGoal: number;
  milestonesClaimed: string[];
  lastConfig: SessionConfig;
  customWords: Word[];
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

export interface QuizQuestion {
  id: string;
  word: Word;
  questionText: string;
  options: string[];
  correctIndex: number;
  type: string;
}

export enum AppScreen {
  DASHBOARD = 'DASHBOARD',
  LEARN = 'LEARN',
  STUDY_SETUP = 'STUDY_SETUP',
  QUIZ = 'QUIZ',
  WORD_BANK = 'WORD_BANK',
  GAME_HUB = 'GAME_HUB',
  AI_TUTOR = 'AI_TUTOR',
  LEADERBOARD = 'LEADERBOARD',
  STORE = 'STORE',
  ACHIEVEMENTS = 'ACHIEVEMENTS'
}
