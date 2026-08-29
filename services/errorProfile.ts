import { UserProgress, Word } from '../types';

export interface ErrorProfileItem {
  label: string;
  attempts: number;
  accuracy: number;
  priority: number;
}

export function buildErrorProfile(words: Word[], progress: UserProgress): ErrorProfileItem[] {
  const buckets: Record<string, { correct: number; attempts: number }> = {};
  const add = (label: string, correct: number, attempts: number) => {
    const b = buckets[label] || { correct: 0, attempts: 0 };
    b.correct += correct; b.attempts += attempts; buckets[label] = b;
  };

  for (const word of words) {
    const stat = progress.wordStats[word.id];
    if (!stat || stat.attempts === 0) continue;
    const labels = [
      word.multipleMeaningsFlag ? 'Multiple-meaning words' : 'Single-meaning words',
      `Level: ${word.satLevel}`,
      `Frequency: ${word.frequencyTier}`,
      `Domain: ${word.academicDomain || 'General'}`,
      `Trap: ${word.distractorType || 'General'}`
    ];
    labels.forEach(l => add(l, stat.correct, stat.attempts));
  }

  return Object.entries(buckets).map(([label, b]) => {
    const accuracy = b.correct / Math.max(1, b.attempts);
    return { label, attempts: b.attempts, accuracy, priority: b.attempts * (1 - accuracy) };
  }).filter(x => x.attempts >= 3).sort((a, b) => b.priority - a.priority);
}

export function recommendedFocus(words: Word[], progress: UserProgress): string {
  const profile = buildErrorProfile(words, progress);
  if (!profile.length) return 'Build more practice history to unlock personalized recommendations.';
  const weak = profile.filter(x => x.accuracy < 0.75).slice(0, 2);
  return weak.length ? `Focus next on ${weak.map(x => x.label).join(' and ')}.` : 'Your accuracy is strong; prioritize due spaced-repetition reviews.';
}
