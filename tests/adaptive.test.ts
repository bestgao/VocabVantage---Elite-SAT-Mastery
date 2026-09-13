import { describe, expect, it } from 'vitest';
import { masteryFromEvidence, nextMasteryFromReview, nextSRS } from '../services/adaptive';

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

  it('does not promote a word to mastered without evidence', () => {
    const stat = {
      wordId: 'x', term: 'test', attempts: 1, correct: 1, wrong: 0,
      streak: 1, lastResult: 'correct' as const, lastSeenAt: 0, masteryLevel: 0 as const
    };
    const srs = { lastReviewed: '', nextReviewAt: '', intervalDays: 3 };
    const level = nextMasteryFromReview(0, stat, srs, true, 'self-rating', 3);
    expect(level).toBe(1);
  });

  it('keeps recognition-only quiz evidence below mastery', () => {
    const stat = {
      wordId: 'x', term: 'test', attempts: 8, correct: 8, wrong: 0,
      streak: 8, lastResult: 'correct' as const, lastSeenAt: 0, masteryLevel: 2 as const
    };
    const srs = { lastReviewed: '', nextReviewAt: '', intervalDays: 21 };
    const level = nextMasteryFromReview(2, stat, srs, true, 'recognition', 3);
    expect(level).toBe(2);
  });
});
