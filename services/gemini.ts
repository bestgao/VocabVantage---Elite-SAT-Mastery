
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Word } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Content Generation ---

/**
 * Generates fresh SAT Syntax questions.
 * Added strict prohibition for placeholders.
 */
export const generateDynamicSyntaxChallenges = async (count: number = 5): Promise<any[]> => {
  const ai = getAI();
  const seed = Date.now();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Seed: ${seed}. Generate ${count} elite SAT Writing questions. 
    Focus: High-difficulty structural anomalies.
    CRITICAL: For the 'options' field, use ONLY actual words or phrases from the sentence. 
    DO NOT EVER use placeholder strings like "Related Concept", "Another word", or "Placeholder". 
    Instructions:
    1. 'text': Sentence with one error marked in [brackets]. 
    2. 'options': 4 parts of the sentence, one of which must be the bracketed error.
    3. 'errorIndex': The index in 'options' of the error.
    4. 'correction': The corrected word/phrase only.
    5. 'corrected_text': The FULL sentence with the error fixed and brackets removed.
    6. 'rule': A clear explanation of the grammar rule.
    JSON ONLY.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            errorIndex: { type: Type.NUMBER },
            correction: { type: Type.STRING },
            corrected_text: { type: Type.STRING },
            rule: { type: Type.STRING }
          },
          required: ["text", "options", "errorIndex", "correction", "corrected_text", "rule"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};

/**
 * Deep Analysis for Odd One Out.
 */
export const generateOddOneOutExplanation = async (options: string[], oddOne: string): Promise<{explanation: string, relationship: string}> => {
  const ai = getAI();
  const prompt = `Semantic Audit for outlier: "${oddOne}". Context: [${options.join(', ')}].
  1. 'relationship': Define the precise categorical link between the other 3 words.
  2. 'explanation': Provide a logical proof.
  JSON format.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          relationship: { type: Type.STRING },
          explanation: { type: Type.STRING }
        },
        required: ["relationship", "explanation"]
      }
    }
  });
  return JSON.parse(response.text || '{"relationship": "Category mismatch", "explanation": "Logic sync failed."}');
};

// --- Audio Utility ---
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const generateSpeech = async (text: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const connectLiveTutor = async (callbacks: any) => {
  const ai = getAI();
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
      systemInstruction: 'You are an elite SAT vocab tutor.',
    },
  });
};

export const generateSATQuestion = async (word: string, definition: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `SAT quiz for "${word}" (${definition}). JSON: { question, options: [4], correctIndex }`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctIndex: { type: Type.NUMBER }
        }
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const refineWordProperties = async (word: Word) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Refine SAT word "${word.term}". JSON: { definition, example, mnemonic, synonyms: [] }`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};

export const getTutorResponse = async (history: any[], message: string) => {
  const ai = getAI();
  const chat = ai.chats.create({ model: 'gemini-3-flash-preview', history: history.map(m => ({ role: m.role, parts: [{ text: m.text }] })) });
  const response = await chat.sendMessage({ message });
  return response.text || "Error.";
};

export const generateWordImage = async (word: string, definition: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `Metaphor for SAT word "${word}" (${definition}). No text.` }] },
  });
  return `data:image/png;base64,${response.candidates[0].content.parts.find(p => p.inlineData)?.inlineData?.data}`;
};
