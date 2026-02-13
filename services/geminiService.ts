
import { GoogleGenAI, Type, Modality, GenerateContentResponse, LiveServerMessage } from "@google/genai";
import { UserProfile } from "../types";

const SYSTEM_INSTRUCTION = `SYSTEM: TITAN OS COMMAND AI.
IDENTITY: High-level autonomous career operating system.
GOAL: Maximize user revenue via 100% remote strategic nodes.
CORE PERSO_DNA: Professional, authoritative, efficient.
RULES: Use Google Search grounding for recent market data. When using search, return information clearly and include factual URLs from the grounding chunks.`;

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Base64 decode failure", e);
    return new Uint8Array(0);
  }
}

async function decodeAudioData(
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

/**
 * Robustly extracts JSON from LLM output, handling markdown blocks and raw text.
 */
function extractJson(text: string): any {
  if (!text) return null;
  try {
    const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const contentToParse = jsonBlockMatch ? jsonBlockMatch[1] : text;
    
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search Google for active 100% remote job openings in ${industry} (${location}). Return a list of 8 jobs in valid JSON format with keys: company, role, description, sourceUrl, location. Provide the JSON inside a markdown block.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      }
    });
    
    const text = response.text || "";
    const results = extractJson(text) || [];
    const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sourceUrls = groundingSources
      .filter(chunk => chunk.web?.uri)
      .map(chunk => ({ title: chunk.web?.title, uri: chunk.web?.uri }));

    return results.map((job: any) => ({
      ...job,
      metadata: { sources: sourceUrls }
    }));
  },

  async tailorJobPackage(jobTitle: string, companyName: string, profile: UserProfile, type: string, hiringManager: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Tailor a job application for ${jobTitle} at ${companyName}. Type: ${type}. Manager: ${hiringManager}. Persona: ${JSON.stringify(profile)}.`,
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
          required: ["cv", "coverLetter", "emailBody", "subject"],
          propertyOrdering: ["subject", "emailBody", "coverLetter", "cv"]
        }
      }
    });
    return extractJson(response.text || "{}") || {};
  },

  async performDeepEmailScrape(companyName: string, domain: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform a deep search for the contact email of a decision maker at ${companyName} (${domain}). Return JSON: { "email": "string", "personName": "string" }. Provide JSON only.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      }
    });
    return extractJson(response.text || "") || { email: "Not Found", personName: "Decision Maker" };
  },

  async analyzeOperationalGaps(industry: string, location: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze operational gaps for companies in ${industry} within ${location}. Return a list of JSON objects: company, website, gaps (array), solution, projectedValue (number), complexity. Provide JSON in markdown.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      }
    });
    return extractJson(response.text || "") || [];
  },

  async enrichCompanyEmail(companyName: string, website: string) {
    const data = await this.performDeepEmailScrape(companyName, website);
    return data.email;
  },

  async getOperationalAudit(prompt: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${prompt}. Context: ${JSON.stringify(profile)}.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text || "";
  },

  async generateB2BPitch(companyName: string, gaps: string[], solution: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a B2B pitch for ${companyName}. Gaps: ${gaps.join(', ')}. Solution: ${solution}.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text || "";
  },

  async scoutNexusLeads(industry: string, location: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify 6 mid-large companies in ${industry} (${location}). Return JSON array with fields: name, website, email, hiringContext. Wrap JSON in markdown.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      }
    });
    return extractJson(response.text || "") || [];
  },

  async generateMarketNexusPitch(lead: any, service: any, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate proposal for ${lead.name}. Service: ${service.name}. Context: ${JSON.stringify(profile)}.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            executiveSummary: { type: Type.STRING },
            implementationPhases: { type: Type.STRING },
            valueProjection: { type: Type.STRING },
            emailBody: { type: Type.STRING },
          },
          required: ["subject", "executiveSummary", "implementationPhases", "valueProjection", "emailBody"],
          propertyOrdering: ["subject", "executiveSummary", "implementationPhases", "valueProjection", "emailBody"]
        }
      }
    });
    return extractJson(response.text || "{}") || {};
  },

  // Fix: Added missing processConsoleCommand method to handle console inputs
  async processConsoleCommand(command: string, profile: UserProfile): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Execute command: "${command}". User Persona: ${JSON.stringify(profile)}. Provide a concise technical response.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text || "Command executed.";
  },

  // Fix: Added missing scoutFlashGigs method for freelance gig discovery
  async scoutFlashGigs(profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for active high-velocity freelance gigs matching: ${JSON.stringify(profile.expertiseBlocks)}. Return JSON array: title, platform, budget, posted, description, applyUrl. Wrap in markdown.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      }
    });
    return extractJson(response.text || "") || [];
  },

  // Fix: Added missing scoutClientLeads method for B2B client discovery
  async scoutClientLeads(niche: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify agencies or publications in "${niche}" that might need specialized consulting. User Persona: ${JSON.stringify(profile)}. Return JSON array: companyName, website, description, type (PUBLICATION | AGENCY | OTHER), opportunityScore. Wrap in markdown.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      }
    });
    return extractJson(response.text || "") || [];
  },

  // Fix: Added missing tailorClientPitch method for specialized pitches
  async tailorClientPitch(companyName: string, description: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Tailor a high-impact consulting pitch for ${companyName}. Info: ${description}. Persona: ${JSON.stringify(profile)}.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING },
            contactPersonStrategy: { type: Type.STRING }
          },
          required: ["subject", "body", "contactPersonStrategy"]
        }
      }
    });
    return extractJson(response.text || "{}") || {};
  },

  // Fix: Added missing connectLive method for low-latency audio interaction
  async connectLive(onTranscription: (text: string) => void, onTurnComplete: () => void) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const outputNode = outputAudioContext.createGain();
    outputNode.connect(outputAudioContext.destination);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    activeSessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => {
          const source = inputAudioContext.createMediaStreamSource(stream);
          const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            const l = inputData.length;
            const int16 = new Int16Array(l);
            for (let i = 0; i < l; i++) {
              int16[i] = inputData[i] * 32768;
            }
            const pcmBlob = {
              data: encode(new Uint8Array(int16.buffer)),
              mimeType: 'audio/pcm;rate=16000',
            };
            activeSessionPromise?.then((session) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputAudioContext.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio) {
            nextAudioStartTime = Math.max(nextAudioStartTime, outputAudioContext.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputNode);
            source.start(nextAudioStartTime);
            nextAudioStartTime += audioBuffer.duration;
            activeSources.add(source);
            source.onended = () => activeSources.delete(source);
          }

          if (message.serverContent?.outputTranscription) {
            onTranscription(message.serverContent.outputTranscription.text);
          }
          if (message.serverContent?.turnComplete) {
            onTurnComplete();
          }
          if (message.serverContent?.interrupted) {
            for (const s of activeSources) { s.stop(); }
            activeSources.clear();
            nextAudioStartTime = 0;
          }
        },
        onerror: (e) => console.error("Neural Link Error:", e),
        onclose: () => console.log("Neural Link Offline")
      },
      config: {
        responseModalities: [Modality.AUDIO],
        outputAudioTranscription: {},
        systemInstruction: SYSTEM_INSTRUCTION
      }
    });

    return activeSessionPromise;
  },

  // Fix: Completed the truncated generateVision method using gemini-2.5-flash-image
  async generateVision(prompt: string): Promise<string | undefined> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { 
        imageConfig: { 
          aspectRatio: "16:9" 
        } 
      },
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return undefined;
  }
};
