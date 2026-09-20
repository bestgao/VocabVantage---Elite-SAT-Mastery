const VOCAB_COLUMN_COUNT = 18;
const METADATA_COLUMN_COUNT = 13;

export const parseCSVLine = (line: string): string[] => {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
};

export const parseCSVDocument = (text: string): string[][] => {
  const records: string[][] = [];
  let record: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      record.push(current.trim());
      current = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index++;
      record.push(current.trim());
      if (record.some(Boolean)) records.push(record);
      record = [];
      current = '';
    } else {
      current += char;
    }
  }

  if (current || record.length) {
    record.push(current.trim());
    if (record.some(Boolean)) records.push(record);
  }

  return records;
};

/**
 * The source vocabulary rows predate strict CSV quoting. Definitions can contain
 * commas, while the final 13 metadata columns and the example/synonym columns
 * have stable positions. Rebuild the logical 18-column record from those anchors.
 */
export const normalizeVocabularyRow = (line: string): string[] => {
  const fields = parseCSVLine(line);
  if (fields.length <= VOCAB_COLUMN_COUNT) return fields;

  const metadataStart = fields.length - METADATA_COLUMN_COUNT;
  const exampleIndex = metadataStart - 2;
  const synonymsIndex = metadataStart - 1;

  return [
    fields[0],
    fields[1],
    fields.slice(2, exampleIndex).join(', '),
    fields[exampleIndex],
    fields[synonymsIndex],
    ...fields.slice(metadataStart)
  ];
};
