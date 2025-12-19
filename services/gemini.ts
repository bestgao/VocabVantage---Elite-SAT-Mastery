
import { GoogleGenAI, Type } from "@google/genai";

// Fixed: Initializing GoogleGenAI correctly using the named parameter and environment variable directly.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMnemonic = async (word: string, definition: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Create a memorable, funny, or clever mnemonic for the SAT word "${word}" (${definition}).`
  });
  // Fixed: Accessing text via the .text property as per guidelines.
  return response.text || "No mnemonic found.";
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
  // Fixed: Properly extracting and parsing the JSON response string.
  return JSON.parse(response.text?.trim() || '{}');
};

export const generateWordImage = async (word: string, definition: string): Promise<string | null> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `Educational illustration for SAT word "${word}": ${definition}` }] }
  });
  // Fixed: Iterating through response parts to locate the image data correctly.
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
  // Fixed: Correctly passing chat history to ai.chats.create to ensure persistent conversational context.
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
