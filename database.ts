
import type { Word } from './types';
import { ALL_WORDS } from './data/index.ts';

export const GET_MASTER_CORE = (): Word[] => {
  return ALL_WORDS.map(word => ({
    ...word,
    synonyms: [...word.synonyms]
  })) as Word[];
};

export const titanSanitize = (text: string | undefined): string => {
  if (!text) return "";
  return text.trim();
};
