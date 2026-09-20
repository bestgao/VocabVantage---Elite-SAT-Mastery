import fs from 'node:fs';
import { parseCSVDocument } from '../services/vocabParser.ts';

const [sourcePath, referencePath] = process.argv.slice(2);
if (!sourcePath || !referencePath) {
  throw new Error('Usage: audit-vocabulary-source.ts <source.csv> <reference.csv>');
}

const rowsFrom = (path: string) => {
  const records = parseCSVDocument(fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
  const headers = records[0];
  return records.slice(1).map(fields =>
    Object.fromEntries(headers.map((header, index) => [header || `column_${index}`, fields[index] || '']))
  );
};

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
const cleanReferenceTerm = (value: string) => value
  .replace(/\s*\[[^\]]+\]\s*$/, '')
  .replace(/\s*\/[^/]+\/\s*$/, '')
  .trim();

const source = rowsFrom(sourcePath);
const reference = rowsFrom(referencePath);
const referenceByDefinition = new Map<string, typeof reference>();

for (const row of reference) {
  const key = normalize(row.Explanation);
  if (!key) continue;
  referenceByDefinition.set(key, [...(referenceByDefinition.get(key) || []), row]);
}

const recoveries = source.flatMap(row => {
  const matches = referenceByDefinition.get(normalize(row.Definition)) || [];
  if (matches.length !== 1) return [];
  const recovered = cleanReferenceTerm(matches[0].Word);
  return normalize(recovered) === normalize(row.Term) ? [] : [{
    term: row.Term,
    recovered,
    definition: row.Definition,
    referenceNumber: matches[0].Number
  }];
});

const definitionTokens = (value: string) => new Set(normalize(value)
  .replace(/\b(?:adj|adv|n|v|vt|vi)\.?\b/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ')
  .split(/\s+/)
  .filter(token => token && !['a', 'an', 'the', 'to'].includes(token)));

const similarity = (left: string, right: string) => {
  const a = definitionTokens(left);
  const b = definitionTokens(right);
  const overlap = [...a].filter(token => b.has(token)).length;
  return overlap / Math.max(a.size, b.size, 1);
};

const prefixCandidates = source.flatMap(row => reference
  .map(ref => ({
    term: row.Term,
    recovered: cleanReferenceTerm(ref.Word),
    definition: row.Definition,
    referenceDefinition: ref.Explanation,
    referenceNumber: ref.Number,
    score: similarity(row.Definition, ref.Explanation)
  }))
  .filter(candidate => {
    const term = normalize(candidate.term);
    const recovered = normalize(candidate.recovered);
    return recovered !== term && recovered.startsWith(term) && candidate.score >= 0.55;
  }));

console.log(JSON.stringify({
  exactDefinitionRecoveries: recoveries.length,
  exactRows: recoveries,
  prefixCandidates: prefixCandidates.length,
  candidateRows: prefixCandidates
}, null, 2));
