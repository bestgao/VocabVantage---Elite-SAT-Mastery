import fs from 'node:fs';
import path from 'node:path';
import { TITAN_MASTER_DATA } from '../data/titan_master.ts';
import { normalizeVocabularyRow, parseCSVDocument } from '../services/vocabParser.ts';

type SourceRow = Record<string, string>;

const [sourcePath, generatedPath, auditPath] = process.argv.slice(2);
if (!sourcePath || !generatedPath || !auditPath) {
  throw new Error('Usage: clean-vocabulary.ts <source.csv> <generated.ts> <audit.json>');
}

const records = parseCSVDocument(fs.readFileSync(sourcePath, 'utf8').replace(/^\uFEFF/, ''));
const headers = records[0];
const sourceRows: SourceRow[] = records.slice(1)
  .filter(fields => fields.some(Boolean))
  .map(fields => Object.fromEntries(headers.map((header, index) => [header, fields[index] || ''])));

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
const titleCase = (value: string) => value.replace(/^./, char => char.toUpperCase());

const legacySynonyms = new Map<string, string[]>();
for (const raw of TITAN_MASTER_DATA) {
  const fields = normalizeVocabularyRow(raw);
  const synonyms = (fields[4] || '').split(';').map(value => value.trim()).filter(Boolean);
  const key = normalize(fields[0] || '');
  if (synonyms.length > (legacySynonyms.get(key)?.length || 0)) legacySynonyms.set(key, synonyms);
}

const termFixes: Record<string, string> = {
  trophic: 'trophic cascade',
  clich: 'cliche',
  dredge: 'dredge up',
  carve: 'carve up',
  unconscionabl: 'unconscionable',
  na: 'naivete',
  disproportionat: 'disproportionate',
  welfare: 'welfare roll',
  tamper: 'tamper with',
  incontrovertibl: 'incontrovertible',
  ward: 'ward off',
  close: 'close out',
  come: 'come clean',
  take: 'take issue with',
  by: 'by and large',
  shore: 'shore up',
  dabble: 'dabble in',
  overcompensat: 'overcompensate',
  notwithstandin: 'notwithstanding',
  maneuverabilit: 'maneuverability',
  incomprehensi: 'incomprehensible',
  in: 'in the grip of',
  underappreciat: 'underappreciated',
  pump: 'pump out',
  bona: 'bona fide',
  awash: 'awash with',
  issue: 'issue from',
  status: 'status quo',
  weed: 'weed out',
  uncharacteristi: 'uncharacteristic',
  stay: 'stay on top of',
  for: 'for good',
  gouge: 'gouge out',
  trade: 'trade off',
  tap: 'tap into',
  out: 'out of place',
  rule: 'rule out'
};

const fieldFixes: Record<string, Partial<SourceRow>> = {
  'affiliate': {
    PartOfSpeech: 'verb',
    Definition: 'associate with, align with, join up with, or become connected to'
  },
  'allude': {
    PartOfSpeech: 'verb',
    Definition: 'refer to something indirectly'
  },
  'awash with': {
    PartOfSpeech: 'adjective',
    Definition: 'containing something in large quantities'
  },
  'bona fide': {
    PartOfSpeech: 'adjective',
    Definition: 'genuine, authentic, or legally valid'
  },
  'by and large': {
    PartOfSpeech: 'adverb',
    Definition: 'on the whole; generally'
  },
  'cliche': {
    PartOfSpeech: 'noun'
  },
  'come clean': {
    PartOfSpeech: 'verb',
    Definition: 'admit and explain something that has been kept secret'
  },
  'conspicuous': {
    Definition: 'easy to see or notice; likely to attract attention'
  },
  'curate': {
    Definition: 'select, organize, and care for the items in a collection or exhibition'
  },
  'detect': {
    Definition: 'discover or notice something that is difficult to see, hear, or identify'
  },
  'exile': {
    Definition: 'a person forced to live away from their native country; also, the state of being barred from one\'s home'
  },
  'for good': {
    PartOfSpeech: 'adverb',
    Definition: 'permanently; forever'
  },
  'in the grip of': {
    PartOfSpeech: 'preposition',
    Definition: 'experiencing or controlled by something unpleasant that cannot easily be stopped'
  },
  'heuristic': {
    PartOfSpeech: 'adjective, noun',
    Definition: 'using a practical method of discovery or problem-solving rather than a guaranteed formula'
  },
  'ingenious': {
    Definition: 'clever, original, and effective'
  },
  'issue from': {
    PartOfSpeech: 'verb',
    Definition: 'come out of or originate from'
  },
  'notwithstanding': {
    PartOfSpeech: 'preposition',
    Definition: 'despite; without being prevented or affected by something'
  },
  'opaque': {
    Definition: 'not transparent, or difficult to understand'
  },
  'out of place': {
    PartOfSpeech: 'adjective',
    Definition: 'not in the correct place or not suitable for a particular situation'
  },
  'overlook': {
    Definition: 'fail to see or notice something; also, have a view from above'
  },
  'pare': {
    PartOfSpeech: 'verb'
  },
  'pertain': {
    PartOfSpeech: 'verb'
  },
  'proportional': {
    Definition: 'increasing or decreasing in size, amount, or degree according to changes in something else'
  },
  'stitch': {
    PartOfSpeech: 'verb',
    Definition: 'use a needle and thread to repair, join, or decorate pieces of cloth'
  },
  'refrain': {
    PartOfSpeech: 'verb',
    Definition: 'stop oneself from doing something'
  },
  'stay on top of': {
    PartOfSpeech: 'verb',
    Definition: 'remain informed about and give continuing attention to'
  },
  'sue': {
    PartOfSpeech: 'verb',
    Definition: 'bring a legal action against a person or organization'
  },
  'sway': {
    Definition: 'move slowly from side to side, or influence a person or decision'
  },
  'tap into': {
    PartOfSpeech: 'verb',
    Definition: 'make use of a resource, source, or supply'
  },
  'take issue with': {
    PartOfSpeech: 'verb',
    Definition: 'disagree or begin arguing with someone about something'
  },
  'trade off': {
    PartOfSpeech: 'verb',
    Definition: 'balance one advantage or quality against another'
  },
  'weed out': {
    PartOfSpeech: 'verb',
    Definition: 'remove unwanted or unsuitable people or things'
  }
};

const customExamples: Record<string, string> = {
  'affiliate': 'The research center chose to affiliate with a university to expand its resources.',
  'allude': 'The essay alludes to an earlier study without describing it in detail.',
  'awash with': 'The archive was awash with conflicting accounts of the event.',
  'bona fide': 'The committee required bona fide evidence before accepting the claim.',
  'by and large': 'By and large, the data support the author\'s central conclusion.',
  'carve up': 'The treaty allowed the victors to carve up the disputed territory.',
  'cliche': 'The critic argued that the once-original metaphor had become a cliche.',
  'close out': 'The retailer discounted older models to close out its remaining inventory.',
  'come clean': 'Faced with contradictory evidence, the witness decided to come clean.',
  'dabble in': 'Although she dabbled in astronomy, her primary field was chemistry.',
  'disproportionate': 'The policy placed a disproportionate burden on rural communities.',
  'dredge up': 'The historian dredged up letters that challenged the accepted account.',
  'for good': 'After repeated flooding, the family left the coastal town for good.',
  'gouge out': 'Over centuries, the river helped gouge out a deep canyon.',
  'in the grip of': 'The region remained in the grip of a severe drought.',
  'incomprehensible': 'Without the missing diagram, the technical explanation was nearly incomprehensible.',
  'incontrovertible': 'The newly discovered records provided incontrovertible evidence of the agreement.',
  'ingenious': 'The engineer devised an ingenious mechanism that used gravity to conserve energy.',
  'issue from': 'A faint glow appeared to issue from the mineral sample.',
  'maneuverability': 'The smaller vessel\'s maneuverability allowed it to navigate the narrow channel.',
  'naivete': 'Her early confidence reflected naivete rather than careful analysis.',
  'notwithstanding': 'Notwithstanding several limitations, the study offers useful evidence.',
  'out of place': 'The informal remark seemed out of place in the otherwise scholarly essay.',
  'overcompensate': 'The editor did not want to overcompensate for one vague sentence by adding unnecessary detail.',
  'pump out': 'The factory continued to pump out inexpensive goods at a rapid pace.',
  'qualify': 'The new evidence qualifies the author\'s broad claim by identifying an important exception.',
  'rule out': 'The experiment could not rule out temperature as a contributing factor.',
  'shore up': 'The author cites new evidence to shore up a previously weak claim.',
  'status quo': 'The reformers challenged a status quo that benefited only a small group.',
  'stay on top of': 'Researchers must stay on top of new findings in a rapidly changing field.',
  'sue': 'The residents threatened to sue the company for contaminating the water supply.',
  'sway': 'The vivid anecdote may sway readers even though the statistical evidence is weak.',
  'take issue with': 'The second author takes issue with the study\'s narrow definition of literacy.',
  'tamper with': 'Investigators warned that anyone who tampered with the evidence could face charges.',
  'tap into': 'The program aims to tap into students\' curiosity about how language changes.',
  'trade off': 'The design must trade off speed against accuracy.',
  'trophic cascade': 'Removing a top predator can trigger a trophic cascade throughout the food web.',
  'underappreciated': 'The article highlights an underappreciated source of social change.',
  'uncharacteristic': 'Her uncharacteristic silence suggested that the question had unsettled her.',
  'unconscionable': 'The judge described the company\'s exploitation of workers as unconscionable.',
  'ward off': 'The plants release chemicals that help ward off insects.',
  'weed out': 'The review process is designed to weed out unsupported claims.',
  'welfare roll': 'As employment rose, fewer households remained on the welfare roll.'
};

const customSynonyms: Record<string, string[]> = {
  'awash with': ['flooded with', 'full of', 'overflowing with'],
  'bona fide': ['genuine', 'authentic', 'legitimate'],
  'by and large': ['generally', 'mostly', 'on the whole'],
  'carve up': ['divide', 'partition', 'split up'],
  'cliche': ['platitude', 'truism', 'commonplace'],
  'close out': ['conclude', 'liquidate', 'sell off'],
  'come clean': ['confess', 'admit the truth', 'disclose'],
  'dabble in': ['experiment with', 'toy with', 'try casually'],
  'disproportionate': ['excessive', 'unequal', 'out of proportion'],
  'dredge up': ['recall', 'revive', 'unearth'],
  'for good': ['permanently', 'forever'],
  'gouge out': ['excavate', 'hollow out', 'scoop out'],
  'in the grip of': ['under the control of', 'overwhelmed by'],
  'incomprehensible': ['unintelligible', 'baffling', 'inscrutable'],
  'incontrovertible': ['indisputable', 'undeniable', 'irrefutable'],
  'issue from': ['emerge from', 'emanate from', 'originate from'],
  'maneuverability': ['agility', 'mobility', 'ease of movement'],
  'naivete': ['inexperience', 'innocence', 'credulity'],
  'notwithstanding': ['despite', 'regardless of', 'in spite of'],
  'out of place': ['inappropriate', 'unsuitable', 'incongruous'],
  'overcompensate': ['overcorrect', 'do too much'],
  'pump out': ['mass-produce', 'emit', 'produce rapidly'],
  'rule out': ['exclude', 'eliminate', 'preclude'],
  'shore up': ['support', 'reinforce', 'bolster'],
  'status quo': ['existing state', 'current situation'],
  'stay on top of': ['monitor', 'keep up with', 'remain informed about'],
  'take issue with': ['disagree with', 'challenge', 'dispute'],
  'tamper with': ['interfere with', 'alter', 'meddle with'],
  'tap into': ['access', 'draw on', 'make use of'],
  'trade off': ['balance', 'exchange', 'compromise'],
  'trophic cascade': ['cascading ecological effect'],
  'underappreciated': ['undervalued', 'overlooked'],
  'uncharacteristic': ['atypical', 'unusual', 'anomalous'],
  'unconscionable': ['unethical', 'outrageous', 'indefensible'],
  'ward off': ['avert', 'repel', 'prevent'],
  'weed out': ['eliminate', 'remove', 'screen out'],
  'welfare roll': ['public-assistance registry']
};

Object.assign(customExamples, {
  atrophy: 'Without regular exercise, the injured muscle began to atrophy.',
  disposal: 'The city introduced stricter rules for the disposal of chemical waste.',
  disposable: 'The report criticized the environmental cost of disposable packaging.',
  exile: 'The political exile wrote memoirs about the homeland he had been forced to leave.',
  heuristic: 'The researcher used a heuristic to narrow the many possible explanations.',
  sewer: 'The city replaced the damaged sewer before it contaminated nearby wells.',
  stitch: 'The conservator used silk thread to stitch the torn manuscript binding.',
  whittle: 'The committee tried to whittle the list of proposals down to three.'
});

const templateCounts = new Map<string, number>();
for (const row of sourceRows) {
  const template = normalize(row.Example).split(normalize(row.Term)).join('{word}');
  templateCounts.set(template, (templateCounts.get(template) || 0) + 1);
}

const contextualExample = (term: string, partOfSpeech: string, definition: string) => {
  const cleanDefinition = definition.replace(/[.!?]+$/, '');
  const pos = normalize(partOfSpeech);
  if (pos.includes('verb')) {
    const meaning = cleanDefinition.replace(/^to\s+/i, '');
    return `In the passage, "${term}" means to ${meaning}.`;
  }
  if (pos.includes('adjective')) {
    return `The author describes the subject as "${term}," meaning ${cleanDefinition}.`;
  }
  if (pos.includes('adverb')) {
    return `The author uses "${term}" to mean ${cleanDefinition}.`;
  }
  return `In the passage, "${term}" refers to ${cleanDefinition}.`;
};

let repairedTerms = 0;
let repairedFields = 0;
let replacedExamples = 0;
let restoredSynonyms = 0;

const cleaned = sourceRows.map((source, index) => {
  const originalTerm = source.Term.trim();
  const term = termFixes[normalize(originalTerm)] || originalTerm;
  if (term !== originalTerm) repairedTerms++;

  const row: SourceRow = { ...source, Term: term, ...(fieldFixes[normalize(term)] || {}) };
  if (fieldFixes[normalize(term)]) repairedFields++;

  const sourceTemplate = normalize(source.Example).split(normalize(originalTerm)).join('{word}');
  const isRepeated = (templateCounts.get(sourceTemplate) || 0) >= 5;
  const exampleMentionsTerm = normalize(source.Example).includes(normalize(originalTerm));
  if (customExamples[normalize(term)]) {
    row.Example = customExamples[normalize(term)];
  } else if (isRepeated || !exampleMentionsTerm) {
    row.Example = contextualExample(term, row.PartOfSpeech, row.Definition);
  }
  if (row.Example !== source.Example) replacedExamples++;

  const sourceSynonyms = row.Synonyms.split(';').map((value: string) => value.trim()).filter(Boolean);
  const priorSynonyms = term === originalTerm
    ? legacySynonyms.get(normalize(originalTerm)) || []
    : legacySynonyms.get(normalize(term)) || [];
  const sourceLooksEditorial = sourceSynonyms.some(value =>
    /\balt:|[:()]|collocate|\b(?:adj|adv|vt|vi)\.?\b/i.test(value)
  );
  let synonyms = customSynonyms[normalize(term)] ||
    (sourceLooksEditorial && priorSynonyms.length ? priorSynonyms : sourceSynonyms);
  if (!sourceSynonyms.length && synonyms.length) restoredSynonyms++;
  if (!synonyms.length) {
    synonyms = priorSynonyms;
    synonyms = [...new Set(synonyms.filter((value: string) => normalize(value) !== normalize(term)))];
    if (synonyms.length) restoredSynonyms++;
  } else {
    synonyms = [...new Set(synonyms.filter((value: string) => normalize(value) !== normalize(term)))];
  }

  const notes: string[] = [];
  if (term !== originalTerm) notes.push(`Term repaired from "${originalTerm}"`);
  if (fieldFixes[normalize(term)]) notes.push('Definition or part of speech corrected');
  if (row.Example !== source.Example) notes.push('Example replaced for accuracy');
  if (!source.Synonyms.trim() && synonyms.length) notes.push('Synonyms restored from prior verified app data');

  return {
    id: `sat-v3-${String(index + 1).padStart(4, '0')}-${normalize(term).replace(/[^a-z0-9]+/g, '-')}`,
    term,
    partOfSpeech: row.PartOfSpeech,
    definition: row.Definition,
    example: row.Example,
    synonyms,
    satLevel: row.SAT_Level.replace(/^Est\.\s*/i, ''),
    frequencyTier: row.Frequency_Tier.replace(/^Est\.\s*/i, ''),
    difficultyScore: Number(row.Difficulty_Score),
    difficultyBand: row.Difficulty_Band,
    usageFrequencyScore: Number(row.Usage_Frequency_Score),
    morphology: row.Morphology,
    academicDomain: row.Academic_Domain,
    multipleMeaningsFlag: normalize(row.Multiple_Meanings_Flag) === 'true',
    distractorType: row.Distractor_Type,
    cleanupNotes: notes.join('; '),
    sourceQaFlags: [row.QA_POS_Flag, row.QA_Definition_Flag, row.QA_Synonyms_Flag, row.QA_Example_Flag]
      .filter(Boolean).join('; ')
  };
});

const duplicates = cleaned.filter((row, index) =>
  cleaned.findIndex(candidate => normalize(candidate.term) === normalize(row.term)) !== index
);
if (duplicates.length) throw new Error(`Cleanup produced duplicate terms: ${duplicates.map(row => row.term).join(', ')}`);

const generated = `// Generated by scripts/clean-vocabulary.ts from the approved vocabulary source.\n` +
  `// Do not edit this file by hand; update the source or cleanup rules and regenerate it.\n` +
  `export const VOCABULARY_DATA = ${JSON.stringify(cleaned.map(({ cleanupNotes: _notes, sourceQaFlags: _flags, ...row }) => row), null, 2)} as const;\n`;

fs.mkdirSync(path.dirname(generatedPath), { recursive: true });
fs.writeFileSync(generatedPath, generated, 'utf8');
fs.mkdirSync(path.dirname(auditPath), { recursive: true });
fs.writeFileSync(auditPath, JSON.stringify({
  summary: {
    sourceRows: sourceRows.length,
    cleanedRows: cleaned.length,
    uniqueTerms: new Set(cleaned.map(row => normalize(row.term))).size,
    repairedTerms,
    repairedFields,
    replacedExamples,
    restoredSynonyms,
    rowsWithSynonyms: cleaned.filter(row => row.synonyms.length).length,
    rowsWithoutSynonyms: cleaned.filter(row => !row.synonyms.length).length
  },
  rows: cleaned
}, null, 2), 'utf8');

console.log(titleCase(`cleaned ${cleaned.length} vocabulary rows`));
console.log(JSON.stringify({ repairedTerms, repairedFields, replacedExamples, restoredSynonyms }, null, 2));
