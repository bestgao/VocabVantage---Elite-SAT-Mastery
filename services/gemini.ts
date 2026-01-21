
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Word } from "../types";

const isAIEnabled = !!process.env.API_KEY; 

export const isSystemAIEnabled = () => isAIEnabled;

export const validateSystemConnection = async (): Promise<{ status: 'online' | 'offline', message: string }> => {
  if (!isAIEnabled) return { status: 'offline', message: 'Local Mode Active' };
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'ping',
    });
    return response.text ? { status: 'online', message: 'Neural Link Established' } : { status: 'offline', message: 'No Response' };
  } catch (e: any) {
    return { status: 'offline', message: 'Auth Failed' };
  }
};

export const fetchSynonymsAndMnemonics = async (word: string, currentDefinition: string) => {
  if (!isAIEnabled) throw new Error("AI disabled. Please check your configuration.");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Expand definition for "${word}". Current definition: "${currentDefinition}". Return JSON with synonyms and mnemonic.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};

export const generateSATQuestion = async (word: string, definition: string) => {
  if (!isAIEnabled) return null;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate an SAT-style multiple-choice question for the word "${word}" which means "${definition}". Return JSON format.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};

export const generateWordImage = async (word: string, definition: string) => {
  if (!isAIEnabled) return null;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `High-quality educational illustration for the vocabulary word "${word}" (${definition}). Clean, professional style suitable for a study app.`,
          },
        ],
      },
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e) {
    console.error("Image generation failed:", e);
    return null;
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  if (!isAIEnabled) return ""; 
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const generateDynamicSyntaxChallenges = async (count: number = 5) => {
  if (!isAIEnabled) return [];
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate ${count} SAT-style syntax challenges. Each challenge should have a sentence where one part in brackets is grammatically incorrect. Return JSON. The 'explanation' field must be a specific, detailed pedagogical reason why that specific part is wrong in the context of the sentence.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: 'Sentence with bracketed options, e.g., "The researcher [conducts] the study; [however] they [hadnt] find [any] results."'
            },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'The phrases inside brackets'
            },
            errorIndex: {
              type: Type.NUMBER,
              description: 'Index of the incorrect option (0-indexed)'
            },
            correction: {
              type: Type.STRING,
              description: 'Corrected version of the error'
            },
            corrected_text: {
              type: Type.STRING,
              description: 'The full sentence with the error fixed'
            },
            rule: {
              type: Type.STRING,
              description: 'Grammar rule violated (e.g., "Subject-Verb Agreement")'
            },
            explanation: {
              type: Type.STRING,
              description: 'Detailed, specific explanation of why this error is wrong in this specific sentence.'
            }
          },
          propertyOrdering: ["text", "options", "errorIndex", "correction", "corrected_text", "rule", "explanation"]
        }
      }
    }
  });
  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Syntax challenge generation failed:", e);
    return [];
  }
};

export const getTutorResponse = async (history: any[], input: string) => {
  if (!isAIEnabled) return "AI Tutor is currently in development for Version 2.0. Please use the Local Bank for now.";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `You are a helpful SAT tutor. History: ${JSON.stringify(history)}. User input: ${input}`,
    config: {
      systemInstruction: "You are a specialized SAT Verbal tutor. Be concise, encouraging, and highly accurate with grammar rules."
    }
  });
  return response.text || "I'm having trouble connecting to my neural link. Please try again.";
};

export const connectLiveTutor = (callbacks: any) => {
  return null;
};

export function encode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function decode(base64: string): Uint8Array {
  const bin = atob(base64);
  const res = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) res[i] = bin.charCodeAt(i);
  return res;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}
