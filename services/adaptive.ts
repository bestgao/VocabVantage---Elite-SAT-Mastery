import { MasteryLevel, UserProgress, Word, WordSRS, WordStat } from '../types';

const DAY = 24 * 60 * 60 * 1000;
export type ReviewQuality = 'again' | 'hard' | 'good' | 'easy';

export interface AdaptiveCandidate {
  word: Word;
  score: number;
  due: boolean;
  reason: string;
}

const parseDate = (value?: string) => {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : 0;
};

export function nextSRS(previous: WordSRS | undefined, quality: ReviewQuality, now = Date.now()): WordSRS {
  const currentInterval = Math.max(0, previous?.intervalDays || 0);
  let intervalDays = 1;
  if (quality === 'again') intervalDays = 0.2;
  if (quality === 'hard') intervalDays = Math.max(1, Math.round(currentInterval * 1.4) || 1);
  if (quality === 'good') intervalDays = currentInterval <= 1 ? 3 : Math.round(currentInterval * 2.2);
  if (quality === 'easy') intervalDays = currentInterval <= 1 ? 7 : Math.round(currentInterval * 3.2);
  return {
    lastReviewed: new Date(now).toISOString(),
    nextReviewAt: new Date(now + intervalDays * DAY).toISOString(),
    intervalDays
  };
}

export function masteryFromEvidence(stat: WordStat | undefined, srs: WordSRS | undefined): MasteryLevel {
  if (!stat || stat.attempts === 0) return 0;
  const accuracy = stat.correct / Math.max(1, stat.attempts);
  const spacing = srs?.intervalDays || 0;
  if (stat.attempts >= 6 && accuracy >= 0.85 && stat.streak >= 3 && spacing >= 14) return 3;
  if (stat.attempts >= 3 && accuracy >= 0.70 && stat.streak >= 2) return 2;
  if (stat.correct >= 1) return 1;
  return 0;
}

export function priorityForWord(word: Word, progress: UserProgress, now = Date.now()): AdaptiveCandidate {
  const mastery = progress.wordMastery[word.id] || 0;
  const stat = progress.wordStats[word.id];
  const srs = progress.wordSRS[word.id];
  const nextReview = parseDate(srs?.nextReviewAt);
  const due = !nextReview || nextReview <= now;
  const daysOverdue = nextReview ? Math.max(0, (now - nextReview) / DAY) : 1;
  const attempts = stat?.attempts || 0;
  const wrong = stat?.wrong || 0;
  const accuracy = attempts ? (stat?.correct || 0) / attempts : 0;
  const lastSeenAge = stat?.lastSeenAt ? Math.max(0, (now - stat.lastSeenAt) / DAY) : 30;

  const weakness = attempts === 0 ? 18 : (1 - accuracy) * 42 + wrong * 4;
  const dueWeight = due ? 35 + Math.min(25, daysOverdue * 3) : -18;
  const forgettingRisk = Math.min(18, lastSeenAge * 0.8);
  const masteryWeight = [22, 16, 8, -8][mastery];
  const satYield = (word.frequencyTier === 'High' ? 16 : word.frequencyTier === 'Mid' ? 8 : 2)
    + (word.usageFrequencyScore || 0) * 1.5
    + (word.multipleMeaningsFlag ? 8 : 0);

  const score = weakness + dueWeight + forgettingRisk + masteryWeight + satYield;
  let reason = 'Adaptive review';
  if (attempts === 0) reason = 'New high-value word';
  else if (due && wrong > 0) reason = 'Due + previous errors';
  else if (due) reason = 'Due for spaced review';
  else if (word.multipleMeaningsFlag) reason = 'High-risk multiple meaning';
  return { word, score, due, reason };
}

export function buildSmartReview(words: Word[], progress: UserProgress, count = 20): Word[] {
  const ranked = words.map(word => priorityForWord(word, progress)).sort((a, b) => b.score - a.score);
  const due = ranked.filter(x => x.due);
  const later = ranked.filter(x => !x.due);
  const dueTarget = Math.min(count, Math.max(Math.ceil(count * 0.7), Math.min(due.length, count)));
  return [...due.slice(0, dueTarget), ...later.slice(0, count - dueTarget)].map(x => x.word);
}

export function reviewQualityFromResult(isCorrect: boolean, confidence: 'low' | 'medium' | 'high' = 'medium'): ReviewQuality {
  if (!isCorrect) return 'again';
  if (confidence === 'low') return 'hard';
  if (confidence === 'high') return 'easy';
  return 'good';
}
