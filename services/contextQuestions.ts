import { QuizQuestion, Word } from '../types';

export interface ContextQuestion extends QuizQuestion {
  passage: string;
  rationale: string;
  optionReasons: string[];
}

const shuffle = <T,>(items: T[]) => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function buildLocalContextQuestion(word: Word, pool: Word[]): ContextQuestion {
  const distractorWords = shuffle(
    pool.filter(w =>
      w.id !== word.id &&
      w.partOfSpeech === word.partOfSpeech &&
      w.definition !== word.definition
    )
  ).slice(0, 3);

  const candidateTerms = shuffle([word.term, ...distractorWords.map(w => w.term)]);
  const correctIndex = candidateTerms.indexOf(word.term);
  const blanked = word.example && word.example.toLowerCase().includes(word.term.toLowerCase())
    ? word.example.replace(new RegExp(`\\b${word.term}\\b`, 'i'), '_____')
    : `Which choice most logically completes the text? The author uses the word _____ to express this idea: ${word.definition}`;

  const optionReasons = candidateTerms.map(term => {
    if (term === word.term) return `Correct: "${word.term}" matches both the meaning and context.`;
    const distractor = distractorWords.find(w => w.term === term);
    if (!distractor) return 'Incorrect.';
    if (distractor.academicDomain === word.academicDomain) return `Related domain, but "${term}" does not match the required meaning.`;
    if (distractor.frequencyTier === word.frequencyTier) return `Plausible SAT-level distractor, but its definition does not fit the sentence logic.`;
    return `Wrong semantic fit for this context.`;
  });

  return {
    id: `context-${word.id}-${Date.now()}`,
    word,
    questionText: 'Which choice most logically and precisely completes the text?',
    passage: blanked,
    options: candidateTerms,
    correctIndex,
    type: 'words-in-context',
    rationale: `The sentence requires a word meaning "${word.definition}".`,
    optionReasons
  };
}

export function buildContextSet(words: Word[], count = 10): ContextQuestion[] {
  return shuffle(words).slice(0, count).map(w => buildLocalContextQuestion(w, words));
}
