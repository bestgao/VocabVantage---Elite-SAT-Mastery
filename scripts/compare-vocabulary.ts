import fs from 'node:fs';
import { GET_MASTER_CORE } from '../database.ts';
import { parseCSVDocument } from '../services/vocabParser.ts';

const inputPath = process.argv[2];
if (!inputPath) throw new Error('Usage: compare-vocabulary.ts <source.csv>');

const text = fs.readFileSync(inputPath, 'utf8').replace(/^\uFEFF/, '');
const records = parseCSVDocument(text);
const headers = records[0];
const sourceRows = records.slice(1).filter(fields => fields.some(Boolean)).map((fields, index) => {
  if (fields.length !== headers.length) {
    throw new Error(`CSV row ${index + 2} has ${fields.length} fields; expected ${headers.length}`);
  }
  return Object.fromEntries(headers.map((header, column) => [header, fields[column]]));
});

const keyFor = (value: string) => value.trim().toLowerCase();
const sourceByTerm = new Map<string, typeof sourceRows[number]>();
const duplicateTerms: string[] = [];
for (const row of sourceRows) {
  const key = keyFor(row.Term);
  if (sourceByTerm.has(key)) duplicateTerms.push(row.Term);
  else sourceByTerm.set(key, row);
}

const appWords = GET_MASTER_CORE();
const appByTerm = new Map(appWords.map(word => [keyFor(word.term), word]));
const sourceOnly = [...sourceByTerm.keys()].filter(key => !appByTerm.has(key));
const appOnly = [...appByTerm.keys()].filter(key => !sourceByTerm.has(key));
const shared = [...sourceByTerm.keys()].filter(key => appByTerm.has(key));

const normalizeText = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();
const differences = {
  partOfSpeech: 0,
  definition: 0,
  example: 0,
  synonyms: 0,
  satLevel: 0,
  frequencyTier: 0,
  morphology: 0,
  academicDomain: 0,
  multipleMeanings: 0,
  distractorType: 0
};

for (const key of shared) {
  const source = sourceByTerm.get(key)!;
  const app = appByTerm.get(key)!;
  if (normalizeText(source.PartOfSpeech) !== normalizeText(app.partOfSpeech)) differences.partOfSpeech++;
  if (normalizeText(source.Definition) !== normalizeText(app.definition)) differences.definition++;
  if (normalizeText(source.Example) !== normalizeText(app.example)) differences.example++;
  if (normalizeText(source.Synonyms) !== normalizeText(app.synonyms.join('; '))) differences.synonyms++;
  if (normalizeText(source.SAT_Level.replace(/^Est\.\s*/i, '')) !== normalizeText(app.satLevel)) differences.satLevel++;
  if (normalizeText(source.Frequency_Tier.replace(/^Est\.\s*/i, '')) !== normalizeText(app.frequencyTier)) differences.frequencyTier++;
  if (normalizeText(source.Morphology) !== normalizeText(app.morphology || '')) differences.morphology++;
  if (normalizeText(source.Academic_Domain) !== normalizeText(app.academicDomain || '')) differences.academicDomain++;
  if ((source.Multiple_Meanings_Flag === 'TRUE') !== Boolean(app.multipleMeaningsFlag)) differences.multipleMeanings++;
  if (normalizeText(source.Distractor_Type) !== normalizeText(app.distractorType || '')) differences.distractorType++;
}

const repeatedTemplates = new Map<string, number>();
for (const row of sourceRows) {
  const template = row.Example.toLowerCase().split(row.Term.toLowerCase()).join('{word}');
  repeatedTemplates.set(template, (repeatedTemplates.get(template) || 0) + 1);
}

const qaColumns = headers.filter(header => header.startsWith('QA_'));
const qaCounts = Object.fromEntries(
  qaColumns.map(header => [header, sourceRows.filter(row => row[header].trim()).length])
);

const emptyCounts = Object.fromEntries(
  ['Term', 'PartOfSpeech', 'Definition', 'Example', 'Synonyms', 'SAT_Level', 'Frequency_Tier', 'Difficulty_Score', 'Difficulty_Band']
    .map(header => [header, sourceRows.filter(row => !row[header].trim()).length])
);

const normalizedTemplateRows = [...repeatedTemplates.values()]
  .filter(count => count >= 5)
  .reduce((sum, count) => sum + count, 0);

console.log(JSON.stringify({
  source: {
    headers,
    rows: sourceRows.length,
    uniqueTerms: sourceByTerm.size,
    duplicateTerms,
    emptyCounts,
    qaCounts,
    rowsInRepeatedExampleTemplates: normalizedTemplateRows
  },
  app: { rows: appWords.length, uniqueTerms: appByTerm.size },
  comparison: {
    sharedTerms: shared.length,
    sourceOnly: sourceOnly.map(key => sourceByTerm.get(key)!.Term),
    appOnly: appOnly.map(key => appByTerm.get(key)!.term),
    differences
  }
}, null, 2));
