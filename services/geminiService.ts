import { GoogleGenAI, Type, Modality } from "@google/genai";
import { UserProfile } from "../types";

const cleanJson = (text: string | undefined) => {
  if (!text) return "[]";
  try {
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start !== -1 && end !== -1 && end > start) return text.substring(start, end + 1);
    
    const objStart = text.indexOf('{');
    const objEnd = text.lastIndexOf('}');
    if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) return text.substring(objStart, objEnd + 1);
  } catch (e) {
    console.error("TITAN_JSON_CLEAN_ERROR:", e);
  }
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

const SYSTEM_GUIDELINE = `SYSTEM: TITAN OS COMMAND AI.
IDENTITY: You are a high-level autonomous career operating system.
GOAL: Maximize user revenue and job acquisition via 100% remote strategic nodes.
RULES:
1. ZERO-PLACEHOLDER POLICY: Never produce text with brackets like [Name]. Use logical inferences from the profile.
2. HIGH AUTHORITY: Speak as a strategic system, not a personal assistant.
3. READY-TO-SEND: Every output must be in its final, deployable state.
4. REMOTE-ONLY: Exclusively target 100% remote/distributed opportunities.`;

export const geminiService = {
  audioContext: null as AudioContext | null,

  async speak(text: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `TITAN OS NOTIFICATION: ${text}` }] }],
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
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
        const dataInt16 = new Int16Array(bytes.buffer);
        const buffer = this.audioContext.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start();
        return true;
      }
    } catch (e) { console.error("TITAN_TTS_FAIL:", e); }
    return false;
  },

  async performUniversalScrape(industry: string, location: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `MISSION: Find 8 active 100% remote high-tier job openings in ${industry} (Region: ${location}). Return as JSON array.`,
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
        },
      },
    });
    return JSON.parse(cleanJson(response.text));
  },

  async tailorJobPackage(role: string, company: string, profile: UserProfile, type: string = 'standard', contact: string = 'Hiring Lead') {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `OBJECTIVE: Synthesize high-stakes application for ${role} at ${company}. User Identity: ${profile.fullName}. Profile DNA: ${profile.masterCV}. Generate READY-TO-SEND email body, subject, cover letter, and a tailored resume summary.`,
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
    return JSON.parse(cleanJson(response.text));
  },

  async scoutFlashGigs(profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `MISSION: Identify 6-10 high-velocity freelance gigs for ${profile.fullName} matching: ${Object.values(profile.expertiseBlocks).join(', ')}. Target platforms: Upwork, Toptal, Contra.`,
      config: {
        systemInstruction: SYSTEM_GUIDELINE,
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
    return JSON.parse(cleanJson(response.text));
  },

  async analyzeOperationalGaps(industry: string, location: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `TASK: Perform B2B gap analysis for top companies in ${industry} at ${location}. Identify operational logic deficits for automation services.`,
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
              website: { type: Type.STRING },
              gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
              solution: { type: Type.STRING },
              projectedValue: { type: Type.NUMBER },
              complexity: { type: Type.STRING, enum: ["Low", "Medium", "High"] }
            },
            required: ["company", "website", "gaps", "solution", "projectedValue", "complexity"]
          }
        }
      }
    });
    return JSON.parse(cleanJson(response.text));
  },

  async performDeepEmailScrape(company: string, domain: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `MISSION: Locate the specific hiring/executive contact email for ${company} (${domain}). Return JSON.`,
      config: {
        systemInstruction: SYSTEM_GUIDELINE,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            email: { type: Type.STRING },
            personName: { type: Type.STRING }
          },
          required: ["email"]
        }
      }
    });
    return JSON.parse(cleanJson(response.text));
  },

  async generateMarketNexusPitch(lead: any, service: any, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `TASK: Generate a $${service.price} high-stakes corporate proposal for ${lead.name} for "${service.name}". Lead context: ${lead.hiringContext}.`,
      config: {
        systemInstruction: SYSTEM_GUIDELINE,
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
    return JSON.parse(cleanJson(response.text));
  },

  async enrichCompanyEmail(company: string, website: string) {
    const domain = new URL(website.startsWith('http') ? website : `https://${website}`).hostname.replace('www.', '');
    const result = await this.performDeepEmailScrape(company, domain);
    return result.email === 'Not Found' ? null : result.email;
  },

  async getOperationalAudit(prompt: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${prompt}\n\nUser Context: ${profile.fullName}, ${profile.domain}.`,
      config: { systemInstruction: SYSTEM_GUIDELINE }
    });
    return response.text || "Audit generation failed.";
  },

  async generateB2BPitch(company: string, gaps: string[], solution: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Draft a high-velocity B2B pitch for ${company}. Gaps: ${gaps.join(', ')}. Solution: ${solution}. Lead: ${profile.fullName}.`,
      config: { systemInstruction: SYSTEM_GUIDELINE }
    });
    return response.text || "Pitch synthesis failed.";
  },

  async scoutNexusLeads(industry: string, location: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find 8 corporate leads in ${industry} (${location}) needing automation audits. Return JSON.`,
      config: {
        systemInstruction: SYSTEM_GUIDELINE,
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
            required: ["name", "website"]
          }
        }
      }
    });
    return JSON.parse(cleanJson(response.text));
  },

  async generateVision(prompt: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "16:9" }
      }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  },

  async processConsoleCommand(command: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${command}\n\nContext: ${profile.fullName}`,
      config: { systemInstruction: SYSTEM_GUIDELINE }
    });
    return response.text || "Command execution failure.";
  },

  async scoutClientLeads(niche: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify 6 client leads for niche "${niche}" based on profile ${profile.domain}. Return JSON.`,
      config: {
        systemInstruction: SYSTEM_GUIDELINE,
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
              type: { type: Type.STRING, enum: ["PUBLICATION", "AGENCY", "OTHER"] },
              opportunityScore: { type: Type.NUMBER },
              email: { type: Type.STRING }
            },
            required: ["companyName", "website", "description", "type", "opportunityScore"]
          }
        }
      }
    });
    return JSON.parse(cleanJson(response.text));
  },

  async tailorClientPitch(company: string, description: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Synthesize a client pitch for ${company}. Description: ${description}. Lead: ${profile.fullName}. Return JSON.`,
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
          required: ["subject", "body"]
        }
      }
    });
    return JSON.parse(cleanJson(response.text));
  }
};