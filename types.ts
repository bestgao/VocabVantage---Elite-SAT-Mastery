
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

export interface UserProgress {
  wordMastery: Record<string, MasteryLevel>; // id -> level
  streak: number;
  lastActive: string;
  xp: number;
}

export enum AppScreen {
  DASHBOARD = 'DASHBOARD',
  LEARN = 'LEARN',
  QUIZ = 'QUIZ',
  WORD_BANK = 'WORD_BANK',
  AI_TUTOR = 'AI_TUTOR'
}

export interface QuizQuestion {
  id: string;
  word: Word;
  questionText: string;
  options: string[];
  correctIndex: number;
  type: 'definition' | 'context';
}
