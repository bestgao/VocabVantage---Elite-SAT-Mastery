import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { masteryFromEvidence, nextMasteryFromReview, nextSRS } from '../services/adaptive.ts';
import { GET_MASTER_CORE } from '../database.ts';
import { normalizeVocabularyRow } from '../services/vocabParser.ts';
import { VOLUME_9 } from '../data/volume_9.ts';
import { applyDiagnosticResult } from '../services/diagnostic.ts';
import type { UserProgress } from '../types.ts';

const freshProgress = (): UserProgress => ({
  version: 21,
  revision: 0,
  updatedAt: 0,
  wordMastery: {},
  wordSRS: {},
  wordStats: {},
  activityLedger: {},
  streak: 0,
  lastActive: '',
  xp: 0,
  credits: 500,
  inventory: { streakFreezes: 1, xpBoosters: 0 },
  dailyMasteryGoal: 10,
  weeklyMasteryGoal: 50,
  monthlyMasteryGoal: 200,
  quarterlyMasteryGoal: 500,
  annualMasteryGoal: 1500,
  milestonesClaimed: [],
  lastConfig: { levels: ['Core'], freqs: ['High'], masteries: [0] },
  customWords: []
});

describe('adaptive learning', () => {
  it('schedules failed words quickly', () => {
    const s = nextSRS(undefined, 'again', 0);
    assert.ok(s.intervalDays < 1);
  });

  it('requires evidence before verified mastery', () => {
    const level = masteryFromEvidence({
      wordId: 'x', term: 'test', attempts: 2, correct: 2, wrong: 0,
      streak: 2, lastResult: 'correct', lastSeenAt: 0, masteryLevel: 2
    }, { lastReviewed: '', nextReviewAt: '', intervalDays: 3 });
    assert.notEqual(level, 3);
  });

  it('allows mastery after repeated spaced success', () => {
    const level = masteryFromEvidence({
      wordId: 'x', term: 'test', attempts: 7, correct: 7, wrong: 0,
      streak: 4, lastResult: 'correct', lastSeenAt: 0, masteryLevel: 2
    }, { lastReviewed: '', nextReviewAt: '', intervalDays: 21 });
    assert.equal(level, 3);
  });

  it('does not promote a word to mastered without evidence', () => {
    const stat = {
      wordId: 'x', term: 'test', attempts: 1, correct: 1, wrong: 0,
      streak: 1, lastResult: 'correct' as const, lastSeenAt: 0, masteryLevel: 0 as const
    };
    const srs = { lastReviewed: '', nextReviewAt: '', intervalDays: 3 };
    const level = nextMasteryFromReview(0, stat, srs, true, 'self-rating', 3);
    assert.equal(level, 1);
  });

  it('keeps recognition-only quiz evidence below mastery', () => {
    const stat = {
      wordId: 'x', term: 'test', attempts: 8, correct: 8, wrong: 0,
      streak: 8, lastResult: 'correct' as const, lastSeenAt: 0, masteryLevel: 2 as const
    };
    const srs = { lastReviewed: '', nextReviewAt: '', intervalDays: 21 };
    const level = nextMasteryFromReview(2, stat, srs, true, 'recognition', 3);
    assert.equal(level, 2);
  });
});

describe('diagnostic handoff', () => {
  it('turns placement answers into honest first-study evidence', () => {
    const completedAt = new Date(2026, 8, 20, 12).getTime();
    const next = applyDiagnosticResult(freshProgress(), {
      readinessScore: 50,
      estimatedKnownWords: 1140,
      correct: 1,
      total: 2,
      weakestDomain: 'Science',
      completedAt,
      recommendedDailyWords: 12,
      answers: [
        { wordId: 'known', term: 'lucid', correct: true },
        { wordId: 'missed', term: 'abstruse', correct: false }
      ]
    });

    assert.equal(next.wordMastery.known, 1);
    assert.equal(next.wordMastery.missed, 0);
    assert.equal(next.wordStats.known.correct, 1);
    assert.equal(next.wordStats.missed.wrong, 1);
    assert.equal(next.wordSRS.known.intervalDays, 3);
    assert.ok(next.wordSRS.missed.intervalDays < 1);
    assert.equal(next.wordSRS.missed.nextReviewAt, new Date(completedAt).toISOString());
    assert.equal(Object.values(next.activityLedger)[0].reviewed, 2);
    assert.equal(next.diagnosticScore, 50);
  });

  it('does not erase verified mastery after one missed retest answer', () => {
    const progress = freshProgress();
    progress.wordMastery.known = 3;
    progress.wordStats.known = {
      wordId: 'known', term: 'lucid', attempts: 8, correct: 8, wrong: 0,
      streak: 4, lastResult: 'correct', lastSeenAt: 0, masteryLevel: 3
    };

    const next = applyDiagnosticResult(progress, {
      readinessScore: 0,
      estimatedKnownWords: 0,
      correct: 0,
      total: 1,
      weakestDomain: 'General',
      completedAt: Date.now(),
      recommendedDailyWords: 15,
      answers: [{ wordId: 'known', term: 'lucid', correct: false }]
    });

    assert.equal(next.wordMastery.known, 3);
    assert.equal(next.wordStats.known.wrong, 1);
  });
});

describe('vocabulary data integrity', () => {
  it('normalizes legacy definitions that contain unquoted commas', () => {
    const raw = VOLUME_9.find(row => row.startsWith('hyperbole,'));
    assert.ok(raw);
    assert.equal(normalizeVocabularyRow(raw).length, 18);
  });

  it('contains the complete canonical vocabulary without duplicates', () => {
    const words = GET_MASTER_CORE();
    assert.equal(words.length, 2280);
    assert.equal(new Set(words.map(word => word.term.toLowerCase())).size, 2280);
  });

  it('keeps every required learning field populated', () => {
    const words = GET_MASTER_CORE();
    for (const word of words) {
      assert.ok(word.term.trim(), 'term');
      assert.ok(word.partOfSpeech.trim(), `${word.term}: part of speech`);
      assert.ok(word.definition.trim(), `${word.term}: definition`);
      assert.ok(word.example.trim(), `${word.term}: example`);
    }
  });

  it('restores truncated words and multiword SAT expressions', () => {
    const byTerm = new Map(GET_MASTER_CORE().map(word => [word.term, word]));
    for (const term of [
      'naivete', 'disproportionate', 'notwithstanding', 'maneuverability',
      'incomprehensible', 'uncharacteristic', 'by and large', 'take issue with',
      'in the grip of', 'bona fide', 'status quo', 'stay on top of'
    ]) {
      assert.ok(byTerm.has(term), term);
    }
    assert.equal(byTerm.get('pertain')?.partOfSpeech, 'verb');
    assert.equal(byTerm.get('notwithstanding')?.partOfSpeech, 'preposition');
    assert.deepEqual(byTerm.get('naivete')?.synonyms, ['inexperience', 'innocence', 'credulity']);
    assert.deepEqual(byTerm.get('by and large')?.synonyms, ['generally', 'mostly', 'on the whole']);
  });

  it('does not reuse generic example templates across the corpus', () => {
    const counts = new Map<string, number>();
    for (const word of GET_MASTER_CORE()) {
      const template = word.example.toLowerCase().split(word.term.toLowerCase()).join('{word}');
      counts.set(template, (counts.get(template) || 0) + 1);
    }
    assert.ok(Math.max(...counts.values()) < 5);
  });

  it('retains aligned metadata and verified synonyms', () => {
    const hyperbole = GET_MASTER_CORE().find(word => word.term === 'hyperbole');
    assert.ok(hyperbole);
    assert.deepEqual(hyperbole.synonyms.slice(0, 2), ['exaggeration', 'overstatement']);
    assert.equal(hyperbole.difficultyScore, 58);
    assert.equal(hyperbole.academicDomain, 'General');
  });
});
