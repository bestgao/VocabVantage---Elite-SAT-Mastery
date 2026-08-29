import { Word } from '../types';

export interface QualityIssue { wordId: string; term: string; severity: 'high' | 'medium' | 'low'; issue: string; }
export function auditVocabulary(words: Word[]): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const seen = new Map<string, string>();
  for (const w of words) {
    const key = w.term.trim().toLowerCase();
    if (!w.term.trim()) issues.push({ wordId: w.id, term: w.term, severity: 'high', issue: 'Missing term' });
    if (!w.definition || w.definition.trim().length < 8) issues.push({ wordId: w.id, term: w.term, severity: 'high', issue: 'Definition missing or too short' });
    if (!w.example || w.example.trim().length < 12) issues.push({ wordId: w.id, term: w.term, severity: 'medium', issue: 'Example missing or too short' });
    if (seen.has(key)) issues.push({ wordId: w.id, term: w.term, severity: 'high', issue: `Duplicate term; first id ${seen.get(key)}` }); else seen.set(key, w.id);
    if (w.synonyms?.some(s => s.trim().toLowerCase() === key)) issues.push({ wordId: w.id, term: w.term, severity: 'medium', issue: 'Term appears in its own synonym list' });
    if (w.morphology && /root=([a-z])\1/i.test(w.morphology)) issues.push({ wordId: w.id, term: w.term, severity: 'medium', issue: 'Suspicious morphology segmentation' });
    if (w.multipleMeaningsFlag && !/[;:]|also|\bn\.\b|\bv\./i.test(w.definition)) issues.push({ wordId: w.id, term: w.term, severity: 'low', issue: 'Multiple-meaning flag may not be reflected in definition' });
  }
  return issues;
}
