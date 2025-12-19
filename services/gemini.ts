
import { GoogleGenAI, Type } from "@google/genai";
import { Word } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMnemonic = async (word: string, definition: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Create a memorable, funny, or clever mnemonic for the SAT word "${word}" (${definition}).`
  });
  return response.text || "No mnemonic found.";
};

export const discoverWords = async (existingWords: string[]): Promise<Word[]> => {
  const ai = getAI();
  const prompt = `Generate a list of 50 unique, high-frequency SAT vocabulary words that ARE NOT in this list: ${existingWords.join(', ')}.
  For each word, provide: term, definition, partOfSpeech (noun, verb, adjective, or adverb), a high-quality example sentence, and 2 synonyms.
  
  Format the output as a JSON array of objects. Ensure all words are distinct and relevant for elite SAT prep.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            term: { type: Type.STRING },
            definition: { type: Type.STRING },
            partOfSpeech: { type: Type.STRING },
            example: { type: Type.STRING },
            synonyms: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["term", "definition", "partOfSpeech", "example", "synonyms"]
        }
      }
    }
  });

  try {
    const raw = JSON.parse(response.text || "[]");
    return raw.map((w: any, i: number) => ({
      ...w,
      id: `discovered-${Date.now()}-${i}`
    }));
  } catch (e) {
    console.error("Discovery failed", e);
    return [];
  }
};

export const sanitizeImportedWords = async (words: Partial<Word>[]): Promise<Word[]> => {
  const ai = getAI();
  const prompt = `I have a list of SAT words that are messy, incomplete, or missing usage examples. 
  Please fix capitalization, verify PartOfSpeech (noun, verb, adjective, or adverb), and generate missing example sentences or synonyms.
  
  Return a valid JSON array of objects.
  Words to process: ${JSON.stringify(words)}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            term: { type: Type.STRING },
            definition: { type: Type.STRING },
            partOfSpeech: { type: Type.STRING },
            example: { type: Type.STRING },
            synonyms: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["id", "term", "definition", "partOfSpeech", "example", "synonyms"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("AI Sanitation failed to parse", e);
    return [];
  }
};

export const generateSATQuestion = async (word: string, definition: string): Promise<{ question: string, options: string[], correctIndex: number }> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Create a one-sentence SAT-style completion question for the word "${word}" (Meaning: ${definition}). Provide 4 options. Format as JSON: { "question": "...", "options": ["...", "...", "...", "..."], "correctIndex": 0 }`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctIndex: { type: Type.INTEGER }
        },
        required: ["question", "options", "correctIndex"]
      }
    }
  });
  return JSON.parse(response.text?.trim() || '{}');
};

export const generateWordImage = async (word: string, definition: string): Promise<string | null> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `Educational illustration for SAT word "${word}": ${definition}` }] }
  });
  const candidate = response.candidates?.[0];
  if (candidate && candidate.content && candidate.content.parts) {
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }
  return null;
};

export const getTutorResponse = async (history: any[], message: string): Promise<string> => {
  const ai = getAI();
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    history: history.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    })),
    config: { systemInstruction: 'You are an SAT tutor expert in vocabulary.' }
  });
  const response = await chat.sendMessage({ message });
  return response.text || "Error.";
};
