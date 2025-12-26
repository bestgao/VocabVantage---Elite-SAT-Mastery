
import { Word } from './types';
import { titanSanitize, GET_MASTER_CORE } from './database';

export { titanSanitize };

// Fix: Export INITIAL_WORDS which is required by Quiz, MatchMania, and VisualVibe components
export const INITIAL_WORDS: Word[] = GET_MASTER_CORE();

export const SAT_TRANSITIONS = [
  { s1: "The study showed significant results.", s2: "the sample size was quite small.", options: ["However", "Therefore", "Moreover", "Likewise"], correct: 0, type: "Contrast" },
  { s1: "Exercise improves cardiovascular health.", s2: "it has been linked to better mental clarity.", options: ["In fact", "Nevertheless", "Instead", "Meanwhile"], correct: 0, type: "Addition" }
];

export const SYNTAX_CHALLENGES = [
  { text: "The team [was] researching the [effects] of gravity; [however] they [hadnt] found the answer.", errorIndex: 2, correction: "however, (missing punctuation)", options: ["was", "effects", "however", "hadnt"] }
];

export const XP_PER_QUIZ = 50;
export const XP_PER_WORD_UPGRADE = 15;

export const MASTERY_COLORS = {
  0: { label: 'Level 1: Hard', bg: 'bg-rose-950/10', text: 'text-rose-900', border: 'border-rose-950', hex: '#4c0519' },
  1: { label: 'Level 2: Learning', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-500', hex: '#ea580c' },
  2: { label: 'Level 3: Review', bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-400', hex: '#ca8a04' },
  3: { label: 'Level 4: Mastered', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-500', hex: '#10b981' }
};
