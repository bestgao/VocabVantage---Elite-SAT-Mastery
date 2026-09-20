import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { masteryFromEvidence, nextMasteryFromReview, nextSRS } from '../services/adaptive.ts';
import { GET_MASTER_CORE } from '../database.ts';
import { normalizeVocabularyRow } from '../services/vocabParser.ts';
import { VOLUME_9 } from '../data/volume_9.ts';

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
