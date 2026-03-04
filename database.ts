
import { Word } from './types';

/**
 * TITAN INTELLIGENCE CORE - v4.1.0
 * Locked IDs for Eternal Protocol V17
 */
import { ALL_WORDS_RAW } from './data';

/**
 * TITAN INTELLIGENCE CORE - v5.0.0
 * Using User-Provided Vocabulary Base
 */

export const parseCSVLine = (line: string): string[] => {
  const fields = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === ',' && !inQuotes) { fields.push(cur.trim()); cur = ""; }
    else { cur += char; }
  }
  fields.push(cur.trim());
  return fields;
};

export const GET_MASTER_CORE = (): Word[] => {
  const base: Word[] = ALL_WORDS_RAW.map((raw, i) => {
    const parts = parseCSVLine(raw);
    const term = parts[0] || "";
    
    // Mapping from CSV columns:
    // 0: Term
    // 1: PartOfSpeech
    // 2: Definition
    // 3: Example
    // 4: Synonyms
    // 9: SAT_Level (Core/Medium/Advanced)
    // 10: Frequency_Tier (Est. High/Mid/Low)
    
    const rawLevel = parts[9] || 'Medium';
    const satLevel = (rawLevel.includes('Advanced') ? 'Advanced' : rawLevel.includes('Core') ? 'Core' : 'Medium') as 'Core' | 'Medium' | 'Advanced';
    
    const rawTier = parts[10] || 'Mid';
    const frequencyTier = (rawTier.includes('High') ? 'High' : rawTier.includes('Low') ? 'Low' : 'Mid') as 'High' | 'Mid' | 'Low';

    return {
      id: `sat-id-locked-${term.toLowerCase().replace(/\s/g, '-')}-${i}`,
      term: term,
      partOfSpeech: parts[1] || "noun",
      definition: parts[2] || "",
      example: parts[3] || "Application required for deep mastery.",
      synonyms: parts[4] ? parts[4].split(';').map(s => s.trim()) : [],
      satLevel: satLevel,
      frequencyTier: frequencyTier,
      difficultyScore: parts[11] ? parseFloat(parts[11]) : undefined,
      difficultyBand: parts[12],
      usageFrequencyScore: parts[13] ? parseFloat(parts[13]) : undefined,
      morphology: parts[14],
      academicDomain: parts[15],
      multipleMeaningsFlag: parts[16] === 'TRUE',
      distractorType: parts[17]
    };
  });

  return base;
};

export const titanSanitize = (text: string | undefined): string => {
  if (!text) return "";
  return text.trim();
};
