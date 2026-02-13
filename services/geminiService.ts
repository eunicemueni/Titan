import { GoogleGenAI, Type, Modality } from "@google/genai";
import { UserProfile } from "../types";

const SYSTEM_INSTRUCTION = `SYSTEM: TITAN OS COMMAND AI.
IDENTITY: High-level autonomous career operating system.
GOAL: Maximize user revenue via 100% remote strategic nodes.
CORE PERSO_DNA: Professional, authoritative, efficient.
RULES: Use Google Search grounding for recent market data. When using search, return information clearly and include factual URLs where available.`;

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

// Global reference for the live session to ensure callbacks can always access the active session
let activeSessionPromise: Promise<any> | null = null;
let nextAudioStartTime = 0;
const activeSources = new Set<AudioBufferSourceNode>();

/**
 * Robustly extracts JSON from LLM output, handling markdown blocks and raw text.
 */
function extractJson(text: string): any {
  if (!text) return null;
  try {
    // Try finding JSON block in markdown
    const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const contentToParse = jsonBlockMatch ? jsonBlockMatch[1] : text;
    
    // Find first [ or { and last ] or } to isolate potential JSON
    const firstBracket = contentToParse.search(/[\[\{]/);
    const lastBracket = contentToParse.lastIndexOf(contentToParse.match(/[\]\}]/)?.[0] || '');
    
    if (firstBracket !== -1 && lastBracket !== -1) {
      return JSON.parse(contentToParse.substring(firstBracket, lastBracket + 1));
    }
    return JSON.parse(contentToParse);
  } catch (e) {
    console.warn("Gemini JSON Extraction Failed:", e, "Raw Text:", text);
    return null;
  }
}

export const geminiService = {
  get liveSession() {
    return activeSessionPromise;
  },

  async performUniversalScrape(industry: string, location: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search Google for active 100% remote job openings in ${industry} (${location}). Return a list of 8 jobs in valid JSON format with keys: company, role, description, sourceUrl, location. Provide the JSON inside a markdown block.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      }
    });
    
    const text = response.text || "";
    const results = extractJson(text) || [];
    
    // Extract grounding URLs and append them if they exist
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
    const response = await ai.models.generateContent({
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
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform a deep search for the contact email of a decision maker at ${companyName} (${domain}). Return JSON: { "email": "string", "personName": "string" }. Provide JSON only.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      }
    });
    
    const text = response.text || "";
    return extractJson(text) || { email: "Not Found", personName: "Decision Maker" };
  },

  async analyzeOperationalGaps(industry: string, location: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze operational gaps for companies in ${industry} within ${location}. Return a list of JSON objects: company, website, gaps (array), solution, projectedValue (number), complexity. Provide JSON in markdown.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "";
    return extractJson(text) || [];
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
      contents: `Identify 6 mid-large companies in ${industry} (${location}). Return JSON array with fields: name, website, email, hiringContext. Wrap JSON in markdown.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "";
    return extractJson(text) || [];
  },

  async generateMarketNexusPitch(lead: any, service: any, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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
          required: ["subject", "executiveSummary", "implementationPhases", "valueProjection", "emailBody"],
          propertyOrdering: ["subject", "executiveSummary", "implementationPhases", "valueProjection", "emailBody"]
        }
      }
    });
    return extractJson(response.text || "{}") || {};
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
      contents: `Search freelance gigs for: ${JSON.stringify(profile.expertiseBlocks)}. Return JSON array: title, platform, budget, description, applyUrl. Use markdown code blocks.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "";
    return extractJson(text) || [];
  },

  async scoutClientLeads(niche: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify agencies for ${niche}. Return JSON array: companyName, website, description, type, opportunityScore. Use markdown code blocks.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "";
    return extractJson(text) || [];
  },

  async tailorClientPitch(companyName: string, description: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Tailor pitch for ${companyName}. Context: ${description}. Profile: ${JSON.stringify(profile)}.`,
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
          required: ["subject", "body", "contactPersonStrategy"],
          propertyOrdering: ["subject", "body", "contactPersonStrategy"]
        }
      }
    });
    return extractJson(response.text || "{}") || {};
  },

  async connectLive(onMessage: (text: string) => void, onInterrupted: () => void) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    nextAudioStartTime = 0;
    activeSources.clear();

    activeSessionPromise = ai.live.connect({
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
            // CRITICAL: Solely rely on sessionPromise resolves
            activeSessionPromise?.then((session) => {
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
          const audioBase64 = parts[0]?.inlineData?.data;
          
          if (audioBase64) {
            nextAudioStartTime = Math.max(nextAudioStartTime, outputCtx.currentTime);
            const audioData = decode(audioBase64);
            const buffer = await decodeAudioData(audioData, outputCtx, 24000, 1);
            const source = outputCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(outputCtx.destination);
            source.addEventListener('ended', () => activeSources.delete(source));
            source.start(nextAudioStartTime);
            nextAudioStartTime += buffer.duration;
            activeSources.add(source);
          }
          
          if (msg.serverContent?.interrupted) {
            for (const src of activeSources) {
              try { src.stop(); } catch(e) {}
              activeSources.delete(src);
            }
            nextAudioStartTime = 0;
            onInterrupted();
          }
          
          if (msg.serverContent?.outputTranscription) {
            onMessage(msg.serverContent.outputTranscription.text);
          }
        },
        onclose: () => { 
          activeSessionPromise = null; 
        },
        onerror: (e) => { 
          console.error("Neural Link Failure:", e); 
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { 
          voiceConfig: { 
            prebuiltVoiceConfig: { voiceName: 'Zephyr' } 
          } 
        },
        systemInstruction: SYSTEM_INSTRUCTION + "\nUplink Established. Maintain brevity and strategic focus in all audio responses.",
        outputAudioTranscription: {},
        inputAudioTranscription: {}
      }
    });
    
    return activeSessionPromise;
  },

  async processConsoleCommand(command: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Execute command: "${command}" for persona: ${profile.fullName}. Provide a concise confirmation or strategic output.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text || "Command execution yielded no textual result.";
  }
};
