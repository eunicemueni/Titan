import { GoogleGenAI, Type, Modality } from "@google/genai";
import { UserProfile } from "../types";

const SYSTEM_INSTRUCTION = `SYSTEM: TITAN OS COMMAND AI.
IDENTITY: High-level autonomous career operating system.
GOAL: Maximize user revenue via 100% remote strategic nodes.
CORE PERSO_DNA: Professional, authoritative, efficient.
RULES: Use Google Search grounding for recent market data. Return valid JSON where requested.`;

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

export const geminiService = {
  sessionPromise: null as Promise<any> | null,
  liveSession: null as any,
  nextStartTime: 0,

  async performUniversalScrape(industry: string, location: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search Google for active 100% remote job openings in ${industry} (${location}). Return a list of 8 jobs as valid JSON.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              company: { type: Type.STRING },
              role: { type: Type.STRING },
              description: { type: Type.STRING },
              sourceUrl: { type: Type.STRING },
              location: { type: Type.STRING },
            },
            required: ["company", "role", "description", "sourceUrl", "location"]
          }
        }
      }
    });
    
    try {
      const text = response.text || "[]";
      return JSON.parse(text);
    } catch (e) {
      return [];
    }
  },

  async tailorJobPackage(jobTitle: string, companyName: string, profile: UserProfile, type: string, hiringManager: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
          required: ["cv", "coverLetter", "emailBody", "subject"]
        }
      }
    });
    try {
      const text = response.text || "{}";
      return JSON.parse(text);
    } catch (e) {
      return {};
    }
  },

  async performDeepEmailScrape(companyName: string, domain: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform a deep search for the contact email of a decision maker at ${companyName} (${domain}).`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            email: { type: Type.STRING },
            personName: { type: Type.STRING },
          },
          required: ["email", "personName"]
        }
      }
    });
    try {
      const text = response.text || '{"email": "Not Found", "personName": "Decision Maker"}';
      return JSON.parse(text);
    } catch (e) {
      return { email: "Not Found", personName: "Decision Maker" };
    }
  },

  async analyzeOperationalGaps(industry: string, location: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze operational gaps for companies in ${industry} within ${location}.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              company: { type: Type.STRING },
              website: { type: Type.STRING },
              gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
              solution: { type: Type.STRING },
              projectedValue: { type: Type.NUMBER },
              complexity: { type: Type.STRING },
            },
            required: ["company", "website", "gaps", "solution", "projectedValue", "complexity"]
          }
        }
      }
    });
    try {
      const text = response.text || "[]";
      return JSON.parse(text);
    } catch (e) {
      return [];
    }
  },

  async enrichCompanyEmail(companyName: string, website: string) {
    const data = await this.performDeepEmailScrape(companyName, website);
    return data.email;
  },

  async getOperationalAudit(prompt: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${prompt}. Context: ${JSON.stringify(profile)}.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text || "";
  },

  async generateB2BPitch(companyName: string, gaps: string[], solution: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a B2B pitch for ${companyName}. Gaps: ${gaps.join(', ')}. Solution: ${solution}.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text || "";
  },

  async scoutNexusLeads(industry: string, location: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify 6 mid-large companies in ${industry} (${location}).`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              website: { type: Type.STRING },
              email: { type: Type.STRING },
              hiringContext: { type: Type.STRING },
            },
            required: ["name", "website", "hiringContext"]
          }
        }
      }
    });
    try {
      const text = response.text || "[]";
      return JSON.parse(text);
    } catch (e) {
      return [];
    }
  },

  async generateMarketNexusPitch(lead: any, service: any, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate proposal for ${lead.name}. Service: ${service.name}.`,
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
          required: ["subject", "executiveSummary", "implementationPhases", "valueProjection", "emailBody"]
        }
      }
    });
    try {
      const text = response.text || "{}";
      return JSON.parse(text);
    } catch (e) {
      return {};
    }
  },

  async generateVision(prompt: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    const candidates = response.candidates || [];
    if (candidates.length > 0) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  },

  async scoutFlashGigs(profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search freelance gigs for: ${JSON.stringify(profile.expertiseBlocks)}.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              platform: { type: Type.STRING },
              budget: { type: Type.STRING },
              description: { type: Type.STRING },
              applyUrl: { type: Type.STRING },
            },
            required: ["title", "platform", "budget", "description", "applyUrl"]
          }
        }
      }
    });
    try {
      const text = response.text || "[]";
      return JSON.parse(text);
    } catch (e) {
      return [];
    }
  },

  async scoutClientLeads(niche: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify agencies for ${niche}.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              companyName: { type: Type.STRING },
              website: { type: Type.STRING },
              description: { type: Type.STRING },
              type: { type: Type.STRING },
              opportunityScore: { type: Type.NUMBER },
            },
            required: ["companyName", "website", "description", "type", "opportunityScore"]
          }
        }
      }
    });
    try {
      const text = response.text || "[]";
      return JSON.parse(text);
    } catch (e) {
      return [];
    }
  },

  async tailorClientPitch(companyName: string, description: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Tailor pitch for ${companyName}. Context: ${description}.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING },
            contactPersonStrategy: { type: Type.STRING },
          },
          required: ["subject", "body", "contactPersonStrategy"]
        }
      }
    });
    try {
      const text = response.text || "{}";
      return JSON.parse(text);
    } catch (e) {
      return {};
    }
  },

  async connectLive(onMessage: (text: string) => void, onInterrupted: () => void) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    this.sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => {
          const source = inputCtx.createMediaStreamSource(stream);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              int16[i] = inputData[i] * 32768;
            }
            this.sessionPromise?.then((session) => {
               session.sendRealtimeInput({ 
                 media: { 
                   data: encode(new Uint8Array(int16.buffer)), 
                   mimeType: 'audio/pcm;rate=16000' 
                 } 
               });
            });
          };
          source.connect(processor);
          processor.connect(inputCtx.destination);
        },
        onmessage: async (msg) => {
          const parts = msg.serverContent?.modelTurn?.parts || [];
          const audio = parts[0]?.inlineData?.data;
          if (audio) {
            this.nextStartTime = Math.max(this.nextStartTime, outputCtx.currentTime);
            const buffer = await decodeAudioData(decode(audio), outputCtx, 24000);
            const source = outputCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(outputCtx.destination);
            source.start(this.nextStartTime);
            this.nextStartTime += buffer.duration;
          }
          if (msg.serverContent?.interrupted) onInterrupted();
          if (msg.serverContent?.outputTranscription) {
            onMessage(msg.serverContent.outputTranscription.text);
          }
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { 
          voiceConfig: { 
            prebuiltVoiceConfig: { voiceName: 'Zephyr' } 
          } 
        },
        systemInstruction: SYSTEM_INSTRUCTION + "\nLive audio mode engaged. Keep responses concise and focused.",
        outputAudioTranscription: {},
        inputAudioTranscription: {}
      }
    });
    this.liveSession = await this.sessionPromise;
  },

  async processConsoleCommand(command: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Execute: "${command}" for user: ${profile.fullName}.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text || "Command execution yielded no textual results.";
  }
};