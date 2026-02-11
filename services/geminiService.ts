
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { UserProfile } from "../types";

const getApiKey = () => {
  try {
    return process.env.API_KEY || "";
  } catch (e) {
    return "";
  }
};

const cleanJson = (text: string) => {
  if (!text) return "[]";
  try {
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start !== -1 && end !== -1 && end > start) return text.substring(start, end + 1);
    
    const objStart = text.indexOf('{');
    const objEnd = text.lastIndexOf('}');
    if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) return text.substring(objStart, objEnd + 1);
  } catch (e) {
    console.error("JSON_CLEAN_FAIL:", e);
  }
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

const SYSTEM_GUIDELINE = `You are TITAN OS Core, a STRICTLY REMOTE-ONLY autonomous career agent.
IDENTITY RULES:
1. You are NOT a person. You are an operating system.
2. ZERO-PLACEHOLDER POLICY: NEVER use placeholders.
3. FINAL STATE ONLY: Every word you produce must be ready to be SENT.
4. NO MARKDOWN IN JSON: Ensure JSON fields are plain text strings.`;

export const geminiService = {
  isCoolingDown: false,
  audioContext: null as AudioContext | null,

  async decodeAudio(base64: string, ctx: AudioContext): Promise<AudioBuffer> {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const dataInt16 = new Int16Array(bytes.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  },

  async speak(text: string) {
    const apiKey = getApiKey();
    if (!apiKey) return false;
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say with authority: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        if (!this.audioContext) this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const buffer = await this.decodeAudio(base64Audio, this.audioContext);
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start();
        return true;
      }
    } catch (e) { console.error("TTS_FAIL:", e); }
    return false;
  },

  async performUniversalScrape(industry: string, location: string) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API_KEY_MISSING");
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `SEARCH_MISSION: Find 8 active 100% remote jobs in ${industry} for ${location}.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
          systemInstruction: SYSTEM_GUIDELINE,
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
        },
      });

      return JSON.parse(cleanJson(response.text || "[]"));
    } catch (e: any) { 
      return []; 
    }
  },

  async tailorJobPackage(role: string, company: string, profile: UserProfile, type: string = 'standard', recipient: string = 'Hiring Manager') {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API_KEY_MISSING");
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `PERSONA: ${profile.fullName}. ROLE: ${role} @ ${company}. Generate high-level READY-TO-SEND package.`,
        config: { 
          systemInstruction: SYSTEM_GUIDELINE,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              emailBody: { type: Type.STRING },
              coverLetter: { type: Type.STRING },
              cv: { type: Type.STRING }
            },
            required: ["subject", "emailBody", "coverLetter", "cv"]
          }
        }
      });
      return JSON.parse(cleanJson(response.text || '{}'));
    } catch (e: any) { return {}; }
  },

  async scoutFlashGigs(profile: UserProfile) {
    const apiKey = getApiKey();
    if (!apiKey) return [];
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Search for 3 active freelance gigs for ${profile.fullName}.`,
        config: { 
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
        },
      });
      return JSON.parse(cleanJson(response.text || "[]"));
    } catch (e) { return []; }
  },

  async scoutNexusLeads(industry: string, location: string) {
    const apiKey = getApiKey();
    if (!apiKey) return [];
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Scout 3 high-value corporate leads in ${industry}.`,
        config: { 
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                website: { type: Type.STRING },
                hiringContext: { type: Type.STRING }
              },
              required: ["name", "website", "hiringContext"]
            }
          }
        },
      });
      return JSON.parse(cleanJson(response.text || "[]"));
    } catch (e) { return []; }
  },

  async enrichCompanyEmail(companyName: string, website: string) {
    const apiKey = getApiKey();
    if (!apiKey) return 'Not Found';
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Find official email contact for ${companyName}.`,
        config: { tools: [{ googleSearch: {} }] },
      });
      const raw = response.text || "";
      return raw.includes('@') ? raw.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || 'Not Found' : 'Not Found';
    } catch (e) { return 'Not Found'; }
  },

  async getOperationalAudit(prompt: string, profile: UserProfile) {
    const apiKey = getApiKey();
    if (!apiKey) return "";
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Audit ${prompt} as ${profile.fullName}. Output raw markdown.`,
        config: { systemInstruction: SYSTEM_GUIDELINE }
      });
      return response.text || "";
    } catch (e) { return ""; }
  },

  async generateB2BPitch(companyName: string, gaps: string[], solution: string, profile: UserProfile) {
    const apiKey = getApiKey();
    if (!apiKey) return "";
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Pitch for ${companyName}. Gaps: ${gaps.join(', ')}. Solution: ${solution}. Sender: ${profile.fullName}.`,
        config: { systemInstruction: SYSTEM_GUIDELINE }
      });
      return response.text || "";
    } catch (e) { return ""; }
  },

  async analyzeOperationalGaps(industry: string, location: string) {
    const apiKey = getApiKey();
    if (!apiKey) return [];
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Identify 3 corporate operational deficits in ${industry}.`,
        config: { 
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
                projectedValue: { type: Type.NUMBER }
              },
              required: ["company", "website", "gaps", "solution", "projectedValue"]
            }
          }
        },
      });
      return JSON.parse(cleanJson(response.text || "[]"));
    } catch (e) { return []; }
  },

  async generateMarketNexusPitch(lead: any, service: any, profile: UserProfile) {
    const apiKey = getApiKey();
    if (!apiKey) return {};
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Service: ${service.name}. Client: ${lead.name}. Lead Name: ${profile.fullName}.`,
        config: { 
          systemInstruction: SYSTEM_GUIDELINE,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              emailBody: { type: Type.STRING },
              executiveSummary: { type: Type.STRING },
              implementationPhases: { type: Type.STRING },
              valueProjection: { type: Type.STRING }
            },
            required: ["subject", "emailBody", "executiveSummary", "implementationPhases", "valueProjection"]
          }
        }
      });
      return JSON.parse(cleanJson(response.text || '{}'));
    } catch (e) { return {}; }
  },

  async generateVision(prompt: string) {
    const apiKey = getApiKey();
    if (!apiKey) return "";
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
      return "";
    } catch (e) { return ""; }
  },

  async scoutClientLeads(niche: string, profile: UserProfile) {
    const apiKey = getApiKey();
    if (!apiKey) return [];
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Scout niche clients for ${profile.fullName} in "${niche}".`,
        config: { 
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
        },
      });
      return JSON.parse(cleanJson(response.text || "[]"));
    } catch (e) { return []; }
  },

  async tailorClientPitch(companyName: string, description: string, profile: UserProfile) {
    const apiKey = getApiKey();
    if (!apiKey) return {};
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Client: ${companyName}. Identity: ${profile.fullName}.`,
        config: { 
          systemInstruction: SYSTEM_GUIDELINE,
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
      return JSON.parse(cleanJson(response.text || '{}'));
    } catch (e) { return {}; }
  },

  async performDeepEmailScrape(companyName: string, domain: string) {
    const apiKey = getApiKey();
    if (!apiKey) return { email: 'Not Found' };
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Find email contact for ${companyName} (${domain}).`,
        config: { 
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
        },
      });
      return JSON.parse(cleanJson(response.text || '{"email": "Not Found"}'));
    } catch (e) { return { email: 'Not Found' }; }
  },

  async processConsoleCommand(prompt: string, profile: UserProfile) {
    const apiKey = getApiKey();
    if (!apiKey) return "";
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `COMMAND: ${prompt}. DNA: ${profile.fullName}.`,
        config: { systemInstruction: SYSTEM_GUIDELINE }
      });
      return response.text || "";
    } catch (e) { return ""; }
  }
};
