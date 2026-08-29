import { describe, expect, it } from 'vitest';
import { masteryFromEvidence, nextSRS } from '../services/adaptive';

describe('adaptive learning', () => {
  it('schedules failed words quickly', () => {
    const s = nextSRS(undefined, 'again', 0);
    expect(s.intervalDays).toBeLessThan(1);
  });

  it('requires evidence before verified mastery', () => {
    const level = masteryFromEvidence({
      wordId: 'x', term: 'test', attempts: 2, correct: 2, wrong: 0,
      streak: 2, lastResult: 'correct', lastSeenAt: 0, masteryLevel: 2
    }, { lastReviewed: '', nextReviewAt: '', intervalDays: 3 });
    expect(level).not.toBe(3);
  });

  it('allows mastery after repeated spaced success', () => {
    const level = masteryFromEvidence({
      wordId: 'x', term: 'test', attempts: 7, correct: 7, wrong: 0,
      streak: 4, lastResult: 'correct', lastSeenAt: 0, masteryLevel: 2
    }, { lastReviewed: '', nextReviewAt: '', intervalDays: 21 });
    expect(level).toBe(3);
  });
});
