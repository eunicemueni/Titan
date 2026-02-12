
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { UserProfile } from "../types";

const SYSTEM_INSTRUCTION = `SYSTEM: TITAN OS COMMAND AI.
IDENTITY: High-level autonomous career operating system.
GOAL: Maximize user revenue via 100% remote strategic nodes.
CORE PERSO_DNA: Professional, authoritative, efficient.
RULES: Use Google Search grounding for recent market data. Return valid JSON where requested.`;

// Manual implementation of encode/decode for base64 as per guidelines
function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

// Manual decoding of PCM audio as per guidelines
async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
  return buffer;
}

export const geminiService = {
  sessionPromise: null as Promise<any> | null,
  liveSession: null as any,
  nextStartTime: 0,

  /**
   * Scrapes job boards using Google Search grounding.
   */
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
      const text = response.text;
      return JSON.parse(text || "[]");
    } catch (e) {
      console.error("JSON_PARSE_ERR", e);
      return [];
    }
  },

  /**
   * Generates a tailored application package.
   */
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
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return {};
    }
  },

  /**
   * Deep trace to find contact emails and decision makers.
   */
  async performDeepEmailScrape(companyName: string, domain: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform a deep search for the contact email of a decision maker or hiring manager at ${companyName} (${domain}). Also identify the person's name if possible.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            email: { type: Type.STRING, description: "Professional email address or 'Not Found'" },
            personName: { type: Type.STRING, description: "Name of the decision maker" },
          },
          required: ["email", "personName"]
        }
      }
    });
    try {
      return JSON.parse(response.text || '{"email": "Not Found", "personName": "Decision Maker"}');
    } catch (e) {
      return { email: "Not Found", personName: "Decision Maker" };
    }
  },

  /**
   * Analyzes B2B operational deficits in a specific sector.
   */
  async analyzeOperationalGaps(industry: string, location: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze current operational gaps and logic failures for companies in the ${industry} sector within ${location}. Focus on areas where strategic automation or risk modeling can save costs.`,
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
      return JSON.parse(response.text || "[]");
    } catch (e) {
      return [];
    }
  },

  /**
   * Enriches company data with a specific focus on finding contact emails.
   */
  async enrichCompanyEmail(companyName: string, website: string) {
    const data = await this.performDeepEmailScrape(companyName, website);
    return data.email;
  },

  /**
   * Generates a deep operational audit report.
   */
  async getOperationalAudit(prompt: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${prompt}. User Persona Context: ${JSON.stringify(profile)}.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text;
  },

  /**
   * Generates a B2B sales pitch for identified gaps.
   */
  async generateB2BPitch(companyName: string, gaps: string[], solution: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a high-velocity B2B pitch for ${companyName}. Gaps: ${gaps.join(', ')}. Proposed Solution: ${solution}. Pitch from persona: ${profile.fullName}.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text;
  },

  /**
   * Scouts for leads in the Market Nexus corporate acquisition module.
   */
  async scoutNexusLeads(industry: string, location: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify 5-8 mid-to-large companies in ${industry} (${location}) that likely have operational logic gaps or high leadership bandwidth strain.`,
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
      return JSON.parse(response.text || "[]");
    } catch (e) {
      return [];
    }
  },

  /**
   * Generates a comprehensive Market Nexus proposal.
   */
  async generateMarketNexusPitch(lead: any, service: any, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Synthesize a formal Board-Ready proposal for ${lead.name}. Service: ${service.name}. Context: ${lead.hiringContext}. Persona: ${profile.fullName}.`,
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
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return {};
    }
  },

  /**
   * Renders a strategic vision asset (Image Generation).
   */
  async generateVision(prompt: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "16:9" }
      }
    });
    
    // Iterate through parts to find the image part
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  },

  /**
   * Scouts global freelance hubs for matching gigs.
   */
  async scoutFlashGigs(profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search Google and freelance platforms for 100% remote high-paying gigs matching this expertise: ${JSON.stringify(profile.expertiseBlocks)}.`,
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
              applyUrl: { type: Type.STRING },
            },
            required: ["title", "platform", "budget", "description", "applyUrl"]
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

  /**
   * Scouts for agency and publication leads.
   */
  async scoutClientLeads(niche: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify marketing agencies, publications, or research firms specializing in ${niche}. Persona: ${profile.fullName}.`,
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
      return JSON.parse(response.text || "[]");
    } catch (e) {
      return [];
    }
  },

  /**
   * Tailors a pitch for a specific client lead.
   */
  async tailorClientPitch(companyName: string, description: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Tailor a high-impact outreach pitch for ${companyName}. Client Context: ${description}. From: ${profile.fullName} (${profile.domain}).`,
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
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return {};
    }
  },

  /**
   * Connects to the Gemini Live API for real-time voice interaction.
   */
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
            for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
            this.sessionPromise?.then((session) => {
               session.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } });
            });
          };
          source.connect(processor);
          processor.connect(inputCtx.destination);
        },
        onmessage: async (msg) => {
          const audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
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
          if (msg.serverContent?.outputTranscription) onMessage(msg.serverContent.outputTranscription.text);
        },
        onerror: (e) => console.error("Live API Error:", e),
        onclose: () => console.log("Live API Closed")
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
        systemInstruction: SYSTEM_INSTRUCTION + "\nYou are in a neural audio link. Be professional and brief.",
        outputAudioTranscription: {}
      }
    });
    this.liveSession = await this.sessionPromise;
  },

  /**
   * Processes a console command using the Gemini model.
   */
  async processConsoleCommand(command: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Execute command: "${command}" in context of ${profile.fullName} (${profile.domain}).`,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text || "Command processed with no output.";
  }
};
