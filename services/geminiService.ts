
import { GoogleGenAI, Type, Modality, GenerateContentResponse, LiveServerMessage } from "@google/genai";
import { UserProfile } from "../types";

const SYSTEM_INSTRUCTION = `SYSTEM: TITAN OS COMMAND AI.
IDENTITY: High-level autonomous career operating system.
PERSONA CONTEXT: 
1. Ayana Inniss (Strategic Growth/B2B): Focused on market expansion and revenue logic.
2. Eunice Muema (Actuarial/Risk): Focused on risk architecture and financial audits.

GOAL: Maximize user revenue via 100% remote strategic nodes.
CORE DNA: Professional, authoritative, efficient.
RULES: Use Google Search/Maps grounding for market data. Return results in clear JSON format where specified.`;

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
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
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
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

function extractJson(text: string | undefined): any {
  if (!text) return null;
  try {
    const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const contentToParse = (jsonBlockMatch ? jsonBlockMatch[1] : text).trim();
    const firstBracket = contentToParse.search(/[\[\{]/);
    const lastBracket = contentToParse.lastIndexOf(contentToParse.match(/[\]\}]/)?.[0] || '');
    if (firstBracket !== -1 && lastBracket !== -1) {
      return JSON.parse(contentToParse.substring(firstBracket, lastBracket + 1));
    }
    return JSON.parse(contentToParse);
  } catch (e) {
    return null;
  }
}

let activeSessionPromise: Promise<any> | null = null;
let nextAudioStartTime = 0;
const activeSources = new Set<AudioBufferSourceNode>();

export const geminiService = {
  get liveSession() {
    return activeSessionPromise;
  },

  async performUniversalScrape(industry: string, location: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search Google for active 100% remote job openings in ${industry} (${location}). Return JSON array with: company, role, description, sourceUrl, location.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }]
      }
    });
    
    const results = extractJson(response.text) || [];
    const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sourceUrls = groundingSources
      .filter(chunk => chunk.web?.uri)
      .map(chunk => ({ title: chunk.web?.title || "Search Source", uri: chunk.web?.uri || "" }));

    return results.map((job: any) => ({ 
      ...job, 
      metadata: { sources: sourceUrls } 
    }));
  },

  async tailorJobPackage(jobTitle: string, companyName: string, profile: UserProfile, type: string, hiringManager: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate high-authority tailored package for ${jobTitle} at ${companyName}. Master DNA: ${profile.masterCV}. Manager: ${hiringManager}. Return JSON: {cv, coverLetter, emailBody, subject}.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cv: { type: Type.STRING },
            coverLetter: { type: Type.STRING },
            emailBody: { type: Type.STRING },
            subject: { type: Type.STRING },
          },
          required: ["cv", "coverLetter", "emailBody", "subject"]
        }
      }
    });
    return extractJson(response.text) || {};
  },

  async generateStrategicBriefing(profile: UserProfile, jobCount: number, revenue: number) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const prompt = `Strategic briefing for ${profile.fullName}: Systems stable. Discovery nodes: ${jobCount}. Pending yield: $${revenue}. Advise on B2B expansion.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;
    return base64Audio;
  },

  async connectLive(onTranscription: (text: string) => void, onTurnComplete: () => void) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    let currentInputTranscription = '';
    let currentOutputTranscription = '';

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => {
          navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
             const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
             const source = audioContext.createMediaStreamSource(stream);
             const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
             scriptProcessor.onaudioprocess = (e) => {
               const inputData = e.inputBuffer.getChannelData(0);
               const l = inputData.length;
               const int16 = new Int16Array(l);
               for (let i = 0; i < l; i++) {
                 int16[i] = inputData[i] * 32768;
               }
               const pcmBase64 = encode(new Uint8Array(int16.buffer));
               sessionPromise.then(session => {
                 session.sendRealtimeInput({ media: { data: pcmBase64, mimeType: 'audio/pcm;rate=16000' } });
               }).catch(() => {});
             };
             source.connect(scriptProcessor);
             scriptProcessor.connect(audioContext.destination);
          });
        },
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.outputTranscription) {
            currentOutputTranscription += message.serverContent.outputTranscription.text;
            onTranscription(currentOutputTranscription);
          } else if (message.serverContent?.inputTranscription) {
            currentInputTranscription += message.serverContent.inputTranscription.text;
          }

          if (message.serverContent?.turnComplete) {
            onTurnComplete();
            currentInputTranscription = '';
            currentOutputTranscription = '';
          }

          const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const decodedBytes = decode(base64Audio);
            const audioBuffer = await decodeAudioData(decodedBytes, ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            
            source.start(nextAudioStartTime);
            nextAudioStartTime = Math.max(ctx.currentTime, nextAudioStartTime) + audioBuffer.duration;
            activeSources.add(source);
            source.onended = () => activeSources.delete(source);
          }

          if (message.serverContent?.interrupted) {
            activeSources.forEach(s => { try { s.stop(); } catch(e) {} });
            activeSources.clear();
            nextAudioStartTime = 0;
          }
        },
        onerror: (e) => console.error('Neural Link Runtime Error:', e),
        onclose: () => console.debug('Neural Link Session Terminated'),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        outputAudioTranscription: {},
        inputAudioTranscription: {},
        systemInstruction: SYSTEM_INSTRUCTION,
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
        }
      }
    });
    activeSessionPromise = sessionPromise;
    return sessionPromise;
  },

  async performDeepEmailScrape(companyName: string, domain: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for best corporate contact email and manager name for ${companyName} (${domain}). Return JSON: {email, personName}.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }]
      }
    });
    return extractJson(response.text) || { email: "Not Found", personName: "Decision Maker" };
  },

  async scoutNexusLeads(industry: string, location: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify 6 corporations in ${industry} (${location}). Return JSON array: {name, website, email, hiringContext}.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }]
      }
    });
    return extractJson(response.text) || [];
  },

  async scoutFlashGigs(profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search high-paying freelance gigs for ${profile.domain}. Return JSON array.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }]
      }
    });
    return extractJson(response.text) || [];
  },

  async scoutClientLeads(niche: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find 10 clients for niche: ${niche}. Profile: ${profile.fullName}. Return JSON array: {companyName, website, description, type, opportunityScore}.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }]
      }
    });
    return extractJson(response.text) || [];
  },

  async processConsoleCommand(command: string, profile: UserProfile): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Command: "${command}". Profile: ${profile.fullName}.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text || "Command processed.";
  }
};
