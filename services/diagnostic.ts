import type { MasteryLevel, UserProgress, WordStat } from '../types';
import { nextSRS } from './adaptive.ts';

export interface DiagnosticAnswerEvidence {
  wordId: string;
  term: string;
  correct: boolean;
}

export interface DiagnosticResult {
  readinessScore: number;
  estimatedKnownWords: number;
  correct: number;
  total: number;
  weakestDomain: string;
  completedAt: number;
  recommendedDailyWords: number;
  answers: DiagnosticAnswerEvidence[];
}

const getLocalKey = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export function applyDiagnosticResult(progress: UserProgress, result: DiagnosticResult): UserProgress {
  const wordMastery = { ...progress.wordMastery };
  const wordStats = { ...progress.wordStats };
  const wordSRS = { ...progress.wordSRS };

  result.answers.forEach(answer => {
    const previousLevel = wordMastery[answer.wordId] || 0;
    const previousStat = wordStats[answer.wordId];
    const nextLevel = (answer.correct ? Math.max(previousLevel, 1) : previousLevel) as MasteryLevel;

    const nextStat: WordStat = {
      wordId: answer.wordId,
      term: answer.term,
      attempts: (previousStat?.attempts || 0) + 1,
      correct: (previousStat?.correct || 0) + (answer.correct ? 1 : 0),
      wrong: (previousStat?.wrong || 0) + (answer.correct ? 0 : 1),
      streak: answer.correct ? (previousStat?.streak || 0) + 1 : 0,
      lastResult: answer.correct ? 'correct' : 'wrong',
      lastSeenAt: result.completedAt,
      masteryLevel: nextLevel
    };

    wordMastery[answer.wordId] = nextLevel;
    wordStats[answer.wordId] = nextStat;
    const diagnosticSRS = nextSRS(
      wordSRS[answer.wordId],
      answer.correct ? 'good' : 'again',
      result.completedAt
    );
    wordSRS[answer.wordId] = answer.correct
      ? diagnosticSRS
      : { ...diagnosticSRS, nextReviewAt: new Date(result.completedAt).toISOString() };
  });

  const today = getLocalKey(result.completedAt);
  const currentActivity = progress.activityLedger[today] || {
    date: today,
    mastered: 0,
    reviewed: 0,
    xpGained: 0
  };

  return {
    ...progress,
    wordMastery,
    wordStats,
    wordSRS,
    activityLedger: {
      ...progress.activityLedger,
      [today]: {
        ...currentActivity,
        reviewed: currentActivity.reviewed + result.total
      }
    },
    onboardingCompletedAt: progress.onboardingCompletedAt || result.completedAt,
    diagnosticScore: result.readinessScore,
    diagnosticEstimatedKnownWords: result.estimatedKnownWords,
    diagnosticCorrect: result.correct,
    diagnosticTotal: result.total,
    diagnosticWeakestDomain: result.weakestDomain,
    diagnosticCompletedAt: result.completedAt,
    diagnosticHistory: [
      ...(progress.diagnosticHistory || []),
      {
        score: result.readinessScore,
        correct: result.correct,
        total: result.total,
        weakestDomain: result.weakestDomain,
        completedAt: result.completedAt
      }
    ].slice(-10),
    recommendedDailyWords: result.recommendedDailyWords,
    dailyMasteryGoal: result.recommendedDailyWords
  };
}
