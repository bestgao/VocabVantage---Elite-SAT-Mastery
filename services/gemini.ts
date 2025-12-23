
import { GoogleGenAI, Type } from "@google/genai";
import { Word } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Enriches a batch of words by replacing generic placeholders with high-quality SAT examples.
 */
export const enrichContextualExamples = async (words: Word[]): Promise<Word[]> => {
  const ai = getAI();
  const prompt = `You are an SAT curriculum developer. For the following list of words, generate a high-quality, sophisticated SAT-style example sentence for each. 
  Ensure the sentence is unique and provides enough context to deduce the meaning. 
  
  Words: ${words.map(w => `${w.term} (${w.definition})`).join('; ')}
  
  Return a JSON array of strings, where each string is the new example sentence for the corresponding word in order.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const newExamples = JSON.parse(response.text || "[]");
    return words.map((w, i) => ({
      ...w,
      example: newExamples[i] || w.example
    }));
  } catch (e) {
    console.error("Enrichment failed for batch", e);
    return words;
  }
};

/**
 * Generates an SAT-style multiple choice question for a specific word to be used in AI Drill mode.
 * Fixes the missing export required by Flashcards.tsx.
 */
export const generateSATQuestion = async (word: string, definition: string): Promise<{ q: string, options: string[], correct: number }> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a sophisticated SAT-style multiple choice question for the word "${word}" (${definition}). 
    Include one correct option and three plausible distractors. 
    Return as JSON with fields: question, options (array of 4 strings), and correctIndex (0-3).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctIndex: { type: Type.NUMBER }
        },
        required: ["question", "options", "correctIndex"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || "{}");
    return {
      q: data.question || `What is the most accurate definition of the word "${word}"?`,
      options: data.options || [definition, "To simplify a complex idea", "To ignore minor details", "To repeat a previous action"],
      correct: data.correctIndex ?? 0
    };
  } catch (e) {
    return {
      q: `What is the most accurate definition of the word "${word}"?`,
      options: [definition, "To simplify a complex idea", "To ignore minor details", "To repeat a previous action"],
      correct: 0
    };
  }
};

export const generateMnemonic = async (word: string, definition: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Create a memorable, funny, or clever mnemonic for the SAT word "${word}" (${definition}).`
  });
  return response.text || "No mnemonic found.";
};

export const getRealWorldUsage = async (word: string): Promise<{ text: string, links: { title: string, uri: string }[] }> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Find a recent news article or high-quality web snippet that uses the SAT vocabulary word "${word}" in a sophisticated context.`,
    config: { tools: [{ googleSearch: {} }] },
  });

  const text = response.text || "Searching for live examples...";
  const links: { title: string, uri: string }[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    chunks.forEach((chunk: any) => {
      if (chunk.web && chunk.web.uri) {
        links.push({ title: chunk.web.title || "Source Article", uri: chunk.web.uri });
      }
    });
  }
  return { text, links };
};

export const discoverWords = async (existingWords: string[]): Promise<Word[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate 50 unique high-frequency SAT words NOT in: ${existingWords.slice(0, 100).join(', ')}. Format as JSON.`,
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
    return JSON.parse(response.text || "[]").map((w: any, i: number) => ({ ...w, id: `dis-${Date.now()}-${i}`, satLevel: 'Medium', frequencyTier: 'Mid' }));
  } catch (e) { return []; }
};

export const getTutorResponse = async (history: any[], message: string): Promise<string> => {
  const ai = getAI();
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    history: history.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
    config: { systemInstruction: 'You are an SAT tutor expert in vocabulary.' }
  });
  const response = await chat.sendMessage({ message });
  return response.text || "Error.";
};

export const generateWordImage = async (word: string, definition: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `Metaphorical illustration of "${word}" (${definition}). No text.` }] },
  });
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Image failed.");
};
