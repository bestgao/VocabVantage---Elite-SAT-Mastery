
import { Word } from './types';

// The "Titan Basis" - First 100+ words from the user's provided CSV
export const INITIAL_WORDS: Word[] = [
  { id: 'sat-trigger', term: 'trigger', partOfSpeech: 'verb', definition: 'set off', example: 'The author uses this detail to trigger a shift in tone.', synonyms: [], satLevel: 'Medium', frequencyTier: 'Mid' },
  { id: 'sat-underwrite', term: 'underwrite', partOfSpeech: 'verb', definition: 'to accept financial responsibility for an activity', example: 'The author uses this detail to underwrite a shift in tone.', synonyms: [], satLevel: 'Advanced', frequencyTier: 'Low' },
  { id: 'sat-sanction', term: 'sanction', partOfSpeech: 'noun', definition: 'explicit or official approval, permission, or ratification', example: 'The passage uses the concept of sanction to support the author s argument.', synonyms: [], satLevel: 'Medium', frequencyTier: 'Mid' },
  { id: 'sat-retrospective', term: 'retrospective', partOfSpeech: 'noun', definition: 'a public exhibition of work from the past; connected with the past', example: 'The passage uses the concept of retrospective to support the author s argument.', synonyms: [], satLevel: 'Advanced', frequencyTier: 'Low' },
  { id: 'sat-endorse', term: 'endorse', partOfSpeech: 'verb', definition: 'to say publicly that you support a person, statement or course of action', example: 'The author uses this detail to endorse a shift in tone.', synonyms: [], satLevel: 'Medium', frequencyTier: 'Mid' },
  { id: 'sat-revisionist', term: 'revisionist', partOfSpeech: 'adjective', definition: 'advocating a policy of revision or modification', example: 'The writer adopts a revisionist tone throughout the passage.', synonyms: [], satLevel: 'Advanced', frequencyTier: 'Low' },
  { id: 'sat-straddle', term: 'straddle', partOfSpeech: 'verb', definition: 'to sit or stand with one of your legs on either side of somebody/something', example: 'The author uses this detail to straddle a shift in tone.', synonyms: [], satLevel: 'Medium', frequencyTier: 'Mid' },
  { id: 'sat-qualify', term: 'qualify', partOfSpeech: 'verb', definition: 'to reach the standard of ability or knowledge needed to do a particular job', example: 'The author uses this detail to qualify a shift in tone.', synonyms: [], satLevel: 'Medium', frequencyTier: 'Mid' },
  { id: 'sat-premise', term: 'premise', partOfSpeech: 'noun', definition: 'a statement or an idea that forms the basis for a reasonable line of argument', example: 'The passage uses the concept of premise to support the author s argument.', synonyms: [], satLevel: 'Medium', frequencyTier: 'Mid' },
  { id: 'sat-array', term: 'array', partOfSpeech: 'noun', definition: 'a group or collection of things or people', example: 'The passage uses the concept of array to support the author s argument.', synonyms: [], satLevel: 'Core', frequencyTier: 'High' },
  { id: 'sat-gut', term: 'gut', partOfSpeech: 'adjective', definition: 'based on feelings and emotions rather than thought and reason', example: 'The writer adopts a gut tone throughout the passage.', synonyms: [], satLevel: 'Core', frequencyTier: 'High' },
  { id: 'sat-eruption', term: 'eruption', partOfSpeech: 'noun', definition: 'occasion when a volcano throws out burning rocks, smoke, etc', example: 'The passage uses the concept of eruption to support the author s argument.', synonyms: [], satLevel: 'Medium', frequencyTier: 'Mid' },
  { id: 'sat-monitor', term: 'monitor', partOfSpeech: 'verb', definition: 'to watch and check something over a period of time', example: 'The author uses this detail to monitor a shift in tone.', synonyms: [], satLevel: 'Medium', frequencyTier: 'Mid' },
  { id: 'sat-abstraction', term: 'abstraction', partOfSpeech: 'noun', definition: 'the quality of being abstract', example: 'The passage uses the concept of abstraction to support the author s argument.', synonyms: [], satLevel: 'Advanced', frequencyTier: 'Low' },
  { id: 'sat-wax', term: 'wax', partOfSpeech: 'noun', definition: 'a solid substance that is made', example: 'The passage uses the concept of wax to support the author s argument.', synonyms: [], satLevel: 'Core', frequencyTier: 'High' },
  { id: 'sat-comb', term: 'comb', partOfSpeech: 'noun', definition: 'a flat piece of plastic with thin teeth for hair', example: 'The passage uses the concept of comb to support the author s argument.', synonyms: [], satLevel: 'Core', frequencyTier: 'High' },
  { id: 'sat-symbiosis', term: 'symbiosis', partOfSpeech: 'noun', definition: 'relationship between two different living creatures where each gets benefits', example: 'The passage uses the concept of symbiosis to support the author s argument.', synonyms: [], satLevel: 'Advanced', frequencyTier: 'Low' },
  { id: 'sat-tender', term: 'tender', partOfSpeech: 'adjective', definition: 'expressing soft emotions', example: 'The writer adopts a tender tone throughout the passage.', synonyms: [], satLevel: 'Medium', frequencyTier: 'Mid' },
  { id: 'sat-coup', term: 'coup', partOfSpeech: 'noun', definition: 'sudden decisive exercise of force in politics', example: 'The passage uses the concept of coup to support the author s argument.', synonyms: [], satLevel: 'Core', frequencyTier: 'High' },
  { id: 'sat-sway', term: 'sway', partOfSpeech: 'verb', definition: 'move slowly or rhythmically backwards and forwards', example: 'The author uses this detail to sway a shift in tone.', synonyms: [], satLevel: 'Core', frequencyTier: 'High' },
  { id: 'sat-delegate', term: 'delegate', partOfSpeech: 'verb', definition: 'to give part of your work, power or authority to somebody in a lower position', example: 'The author uses this detail to delegate a shift in tone.', synonyms: [], satLevel: 'Medium', frequencyTier: 'Mid' },
  { id: 'sat-heuristic', term: 'heuristic', partOfSpeech: 'adjective', definition: 'learning by discovering things for yourself', example: 'The writer adopts a heuristic tone throughout the passage.', synonyms: [], satLevel: 'Advanced', frequencyTier: 'Low' },
  { id: 'sat-rally', term: 'rally', partOfSpeech: 'noun', definition: 'a large public meeting', example: 'The passage uses the concept of rally to support the author s argument.', synonyms: [], satLevel: 'Core', frequencyTier: 'High' },
  { id: 'sat-mock', term: 'mock', partOfSpeech: 'verb', definition: 'make fun of, laugh at somebody/something in an unkind way', example: 'The author uses this detail to mock a shift in tone.', synonyms: [], satLevel: 'Core', frequencyTier: 'High' },
  { id: 'sat-taint', term: 'taint', partOfSpeech: 'noun', definition: 'effect of something bad or unpleasant that damages quality', example: 'The passage uses the concept of taint to support the author s argument.', synonyms: [], satLevel: 'Core', frequencyTier: 'High' },
  { id: 'sat-ascetic', term: 'ascetic', partOfSpeech: 'adjective', definition: 'not allowing yourself physical pleasures, especially for religious reasons', example: 'The writer adopts a ascetic tone throughout the passage.', synonyms: [], satLevel: 'Medium', frequencyTier: 'Mid' },
  { id: 'sat-initiative', term: 'initiative', partOfSpeech: 'noun', definition: 'ability to assess and initiate things independently', example: 'The passage uses the concept of initiative to support the author s argument.', synonyms: [], satLevel: 'Advanced', frequencyTier: 'Low' },
  { id: 'sat-erosion', term: 'erosion', partOfSpeech: 'noun', definition: 'process by which surface is gradually destroyed by wind/rain', example: 'The passage uses the concept of erosion to support the author s argument.', synonyms: [], satLevel: 'Medium', frequencyTier: 'Mid' },
  { id: 'sat-compromise', term: 'compromise', partOfSpeech: 'noun', definition: 'agreement where each side gives up some things they want', example: 'The passage uses the concept of compromise to support the author s argument.', synonyms: [], satLevel: 'Advanced', frequencyTier: 'Low' },
  { id: 'sat-sneer', term: 'sneer', partOfSpeech: 'verb', definition: 'to show you have no respect by expression or speech', example: 'The author uses this detail to sneer a shift in tone.', synonyms: [], satLevel: 'Core', frequencyTier: 'High' },
  { id: 'sat-abate', term: 'abate', partOfSpeech: 'verb', definition: 'to become less active or intense', example: 'The storm began to abate after midnight.', synonyms: [], satLevel: 'Core', frequencyTier: 'High' },
  { id: 'sat-repudiate', term: 'repudiate', partOfSpeech: 'verb', definition: 'to refuse to accept something; reject', example: 'The author uses this detail to repudiate a shift in tone.', synonyms: [], satLevel: 'Advanced', frequencyTier: 'Low' },
  { id: 'sat-arbitrary', term: 'arbitrary', partOfSpeech: 'adjective', definition: 'based on random choice or personal whim', example: 'The writer adopts a arbitrary tone throughout the passage.', synonyms: [], satLevel: 'Advanced', frequencyTier: 'Low' },
  { id: 'sat-pique', term: 'pique', partOfSpeech: 'verb', definition: 'to make somebody annoyed or upset', example: 'The author uses this detail to pique a shift in tone.', synonyms: [], satLevel: 'Core', frequencyTier: 'High' },
  { id: 'sat-scour', term: 'scour', partOfSpeech: 'verb', definition: 'to search a place or thing carefully and completely', example: 'The author uses this detail to scour a shift in tone.', synonyms: [], satLevel: 'Core', frequencyTier: 'High' },
  { id: 'sat-astute', term: 'astute', partOfSpeech: 'adjective', definition: 'shrewd; clever', example: 'The writer adopts a astute tone throughout the passage.', synonyms: [], satLevel: 'Medium', frequencyTier: 'Mid' },
  { id: 'sat-banal', term: 'banal', partOfSpeech: 'adjective', definition: 'very ordinary and containing nothing interesting', example: 'The writer adopts a banal tone throughout the passage.', synonyms: [], satLevel: 'Core', frequencyTier: 'High' },
  { id: 'sat-cogent', term: 'cogent', partOfSpeech: 'adjective', definition: 'strongly and clearly expressed to influence belief', example: 'The writer adopts a cogent tone throughout the passage.', synonyms: [], satLevel: 'Medium', frequencyTier: 'Mid' }
];

export const SAT_TRANSITIONS = [
  { s1: "The study showed significant results.", s2: "the sample size was quite small.", options: ["However", "Therefore", "Moreover", "Likewise"], correct: 0, type: "Contrast" },
  { s1: "Exercise improves cardiovascular health.", s2: "it has been linked to better mental clarity.", options: ["In fact", "Nevertheless", "Instead", "Meanwhile"], correct: 0, type: "Addition" },
  { s1: "The temperature dropped below freezing.", s2: "the water in the pipes expanded and burst.", options: ["Consequently", "Conversely", "Similarly", "Regardless"], correct: 0, type: "Cause-Effect" }
];

export const SYNTAX_CHALLENGES = [
  { text: "The team of scientists [was] researching the [effects] of gravity; [however] they [hadnt] found the answer.", errorIndex: 2, correction: "however, (missing punctuation)", options: ["was", "effects", "however", "hadnt"] },
  { text: "Neither the [students] nor the [teacher] [were] aware that the [bell] had already rung.", errorIndex: 2, correction: "was (subject-verb agreement)", options: ["students", "teacher", "were", "bell"] }
];

export const XP_PER_QUIZ = 50;
export const XP_PER_WORD_UPGRADE = 15;

export const MASTERY_COLORS = {
  0: { label: 'Level 1: Hard', bg: 'bg-rose-950/10', text: 'text-rose-900', border: 'border-rose-950', hex: '#4c0519' },
  1: { label: 'Level 2: Learning', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-500', hex: '#ea580c' },
  2: { label: 'Level 3: Review', bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-400', hex: '#ca8a04' },
  3: { label: 'Level 4: Mastered', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-500', hex: '#10b981' }
};
