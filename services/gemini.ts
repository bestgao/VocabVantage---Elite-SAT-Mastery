import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Word } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Diagnostic: Validates if the current API_KEY is functional.
 */
export const validateSystemConnection = async (): Promise<{ status: 'online' | 'offline', message: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'ping',
    });
    if (response.text) {
      return { status: 'online', message: 'Neural Link Established' };
    }
    return { status: 'offline', message: 'No Response from Core' };
  } catch (e: any) {
    console.error("Diagnostic Fail:", e);
    return { status: 'offline', message: e.message || 'Authentication Failed' };
  }
};

/**
 * Generates an ELITE level SAT Reading & Writing question using Gemini 3 Pro's thinking capabilities.
 */
export const generateSATQuestion = async (word: string, definition: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Create an ELITE level SAT Reading & Writing question for the word "${word}" (${definition}). 
    The question should be a "Words in Context" style paragraph where the student chooses the best word to fit.
    Distractors must be high-level SAT words that are contextually plausible but technically incorrect.
    Provide a detailed linguistic explanation of why the correct choice is superior to the distractors.
    JSON ONLY.`,
    config: {
      thinkingConfig: { thinkingBudget: 2000 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctIndex: { type: Type.NUMBER },
          explanation: { type: Type.STRING }
        },
        required: ["question", "options", "correctIndex", "explanation"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

/**
 * Generates an artistic visual metaphor for the word using Gemini 2.5 Flash Image.
 */
export const generateWordImage = async (word: string, definition: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { 
      parts: [{ 
        text: `A high-concept, minimalist 3D render representing the SAT vocabulary word "${word}" (${definition}). 
        Use a cinematic indigo and gold lighting scheme. Avoid any text. Focus on an abstract but clear visual metaphor.` 
      }] 
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });
  
  const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  return imagePart ? `data:image/png;base64,${imagePart.inlineData.data}` : null;
};

/**
 * Text-to-Speech using Gemini 2.5 Flash TTS.
 */
export const generateSpeech = async (text: string): Promise<string> => {
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

/**
 * AI Tutor chat response.
 */
export const getTutorResponse = async (history: { role: 'user' | 'model', text: string }[], input: string) => {
  const contents = history.map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));
  contents.push({ role: 'user', parts: [{ text: input }] });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents,
    config: {
      systemInstruction: 'You are an expert SAT tutor. Provide precise, actionable advice on vocabulary and grammar.'
    }
  });
  return response.text || "Connection error. Please try again.";
};

/**
 * Connect to Gemini Live API for voice-based practice.
 */
export const connectLiveTutor = (callbacks: {
  onopen: () => void;
  onmessage: (message: any) => void;
  onerror: (e: any) => void;
  onclose: (e: any) => void;
}) => {
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: 'You are a supportive SAT verbal coach. Engage in voice conversation to help the student learn new words.',
    }
  });
};

export const generateOddOneOutExplanation = async (options: string[], oddWord: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze: ${options.join(', ')}. The outlier is "${oddWord}". Explain the shared theme of the others. JSON ONLY.`,
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
  return JSON.parse(response.text || "{}");
};

export const generateDynamicSyntaxChallenges = async (count: number) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate ${count} high-level SAT Writing syntax challenges. JSON ONLY.`,
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

export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
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