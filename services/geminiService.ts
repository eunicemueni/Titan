
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { UserProfile } from "../types";

const SYSTEM_INSTRUCTION = `SYSTEM: TITAN OS COMMAND AI.
IDENTITY: High-level autonomous career operating system.
GOAL: Maximize user revenue via 100% remote strategic nodes.
CORE PERSO_DNA: Professional, authoritative, efficient.
RULES: Use Google Search grounding for recent market data. Return valid JSON where requested.`;

// Decoding Helpers (Raw PCM) following the guidelines
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

// Guideline-compliant audio decoding for raw PCM
async function decodeAudioData(
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

// Helper to create pcm blob for streaming
function createBlob(data: Float32Array): { data: string, mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export const geminiService = {
  sessionPromise: null as Promise<any> | null,
  nextStartTime: 0,

  // Scrapes job openings using Google Search grounding
  async performUniversalScrape(industry: string, location: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for active 100% remote job openings in ${industry} (${location}). Include only verified links. Return a list of 8 jobs.`,
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
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("JSON_PARSE_ERR", e);
      return [];
    }
  },

  // Connects to Gemini Live API with synchronized audio streams
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
            const pcmBlob = createBlob(inputData);
            // Rely on promise to prevent race conditions during input streaming
            this.sessionPromise?.then((session) => {
               session.sendRealtimeInput({ media: pcmBlob });
            });
          };
          source.connect(processor);
          processor.connect(inputCtx.destination);
        },
        onmessage: async (msg) => {
          const audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audio) {
            this.nextStartTime = Math.max(this.nextStartTime, outputCtx.currentTime);
            const buffer = await decodeAudioData(decode(audio), outputCtx, 24000, 1);
            const source = outputCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(outputCtx.destination);
            source.start(this.nextStartTime);
            this.nextStartTime += buffer.duration;
          }
          if (msg.serverContent?.interrupted) onInterrupted();
          if (msg.serverContent?.outputTranscription) onMessage(msg.serverContent.outputTranscription.text);
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
        systemInstruction: SYSTEM_INSTRUCTION + "\nYou are in a neural audio link. Be professional and brief.",
        outputAudioTranscription: {}
      }
    });
  },

  // Processes raw console text commands via GenAI
  async processConsoleCommand(command: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Execute command: "${command}" in context of ${profile.fullName} (${profile.domain}).`,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text || "Command processed with no output.";
  },

  // Generates tailored job application assets
  async tailorJobPackage(role: string, company: string, profile: UserProfile, type: string, contact: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a ${type} job application package for the role of ${role} at ${company}. Hiring Manager: ${contact}. User profile: ${profile.masterCV}.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            emailBody: { type: Type.STRING },
            cv: { type: Type.STRING }
          },
          required: ["subject", "emailBody", "cv"]
        }
      }
    });
    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return { subject: `Application for ${role}`, emailBody: `Dear ${contact}...`, cv: profile.masterCV };
    }
  },

  // Performs a deep search for decision-maker contact details
  async performDeepEmailScrape(companyName: string, domain: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for contact information (email and name) of hiring managers or decision makers at ${companyName} (${domain}).`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            email: { type: Type.STRING },
            personName: { type: Type.STRING }
          },
          required: ["email", "personName"]
        }
      }
    });
    try {
      return JSON.parse(response.text || '{"email":"Not Found","personName":"Decision Maker"}');
    } catch (e) {
      return { email: 'Not Found', personName: 'Decision Maker' };
    }
  },

  // Analyzes operational deficiencies in specific industries
  async analyzeOperationalGaps(industry: string, location: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze B2B companies in the ${industry} sector in ${location}. Identify specific operational gaps and suggest solutions.`,
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
              complexity: { type: Type.STRING }
            },
            required: ["company", "website", "gaps", "solution", "projectedValue", "complexity"]
          }
        }
      }
    });
    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      return [];
    }
  },

  // Finds a specific contact email for a company
  async enrichCompanyEmail(companyName: string, website: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find a contact email for ${companyName} (${website}).`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            email: { type: Type.STRING }
          },
          required: ["email"]
        }
      }
    });
    try {
      const data = JSON.parse(response.text || "{}");
      return data.email || 'Not Found';
    } catch (e) {
      return 'Not Found';
    }
  },

  // Conducts a detailed operational logic audit
  async getOperationalAudit(prompt: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `${prompt}\nContext: ${profile.masterCV}`,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text || "Audit failed.";
  },

  // Generates a high-conversion B2B sales pitch
  async generateB2BPitch(companyName: string, gaps: string[], solution: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate a B2B sales pitch for ${companyName}. Gaps: ${gaps.join(', ')}. Solution: ${solution}. Profile: ${profile.masterCV}`,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text || "Pitch generation failed.";
  },

  // Finds corporate leads for the Market Nexus module
  async scoutNexusLeads(industry: string, location: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find corporate leads in ${industry} (${location}) needing operational efficiency improvements.`,
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
              hiringContext: { type: Type.STRING }
            },
            required: ["name", "website", "email", "hiringContext"]
          }
        }
      }
    });
    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      return [];
    }
  },

  // Generates structured proposal content for high-value services
  async generateMarketNexusPitch(lead: any, service: any, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate a high-stakes proposal for ${lead.name} regarding the ${service.name} ($${service.price}). User Profile: ${profile.masterCV}`,
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
            emailBody: { type: Type.STRING }
          },
          required: ["subject", "executiveSummary", "implementationPhases", "valueProjection", "emailBody"]
        }
      }
    });
    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return {};
    }
  },

  // Renders a strategic vision image using Gemini Flash Image
  async generateVision(prompt: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  },

  // Scrapes global freelance hubs for matching gigs
  async scoutFlashGigs(profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find recent freelance gigs matching this profile: ${profile.masterCV}. Focus on Upwork, Toptal, and similar hubs.`,
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
              posted: { type: Type.STRING },
              description: { type: Type.STRING },
              applyUrl: { type: Type.STRING }
            },
            required: ["title", "platform", "budget", "posted", "description", "applyUrl"]
          }
        }
      }
    });
    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      return [];
    }
  },

  // Identifies high-intent client leads in specified niches
  async scoutClientLeads(niche: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify potential clients (agencies, publications, companies) in the ${niche} niche. User Profile: ${profile.masterCV}`,
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
              opportunityScore: { type: Type.NUMBER }
            },
            required: ["companyName", "website", "description", "type", "opportunityScore"]
          }
        }
      }
    });
    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      return [];
    }
  },

  // Tailors a structured outreach pitch for potential clients
  async tailorClientPitch(companyName: string, description: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Create a tailored pitch for ${companyName} based on their description: "${description}". Use this user profile: ${profile.masterCV}.`,
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
    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return {};
    }
  }
};
