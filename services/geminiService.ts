
import { GoogleGenAI, Type, Modality, GenerateContentResponse, LiveServerMessage } from "@google/genai";
import { UserProfile } from "../types";

const SYSTEM_INSTRUCTION = `SYSTEM: TITAN OS COMMAND AI.
IDENTITY: High-level autonomous career operating system.
PERSONA CONTEXT: 
1. Ayana Inniss (Strategic Growth/B2B): Focused on market expansion, enterprise partnerships, and revenue logic.
2. Eunice Muema (Actuarial/Risk): Focused on stochastic modeling, liability audits, and financial risk architecture.

GOAL: Maximize user revenue via 100% remote strategic nodes.
CORE DNA: Professional, authoritative, efficient.
RULES: Use Google Search/Maps grounding for market data. You must return information clearly. Always tailor outputs to the specific expertise of the active persona.`;

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
      contents: `Search Google for active 100% remote job openings AND unposted corporate needs in ${industry} (${location}). Return a list of 8 opportunities in valid JSON format with keys: company, role, description, sourceUrl, location. For unposted roles, leave sourceUrl empty. Wrap JSON in a markdown block.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }]
      }
    });
    
    const results = extractJson(response.text) || [];
    const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sourceUrls = groundingSources
      .filter(chunk => chunk.web?.uri)
      .map(chunk => ({ 
        title: chunk.web?.title || "Search Source", 
        uri: chunk.web?.uri 
      }));

    return results.map((job: any) => ({ 
      ...job, 
      metadata: { sources: sourceUrls } 
    }));
  },

  async tailorJobPackage(jobTitle: string, companyName: string, profile: UserProfile, type: string, hiringManager: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate a high-authority tailored package for ${jobTitle} at ${companyName}. 
      Persona: ${profile.fullName} (${profile.domain}). 
      Master CV DNA: ${profile.masterCV}.
      Type: ${type}. Manager: ${hiringManager}. 
      Return JSON: cv (text), coverLetter (text), emailBody (text), subject (text).`,
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

  async scoutCorporateNodesWithMaps(industry: string, location: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Identify the physical corporate headquarters and strategic nodes for top companies in ${industry} near ${location}. Return list with company name, physical address, and hiring status.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }, { googleMaps: {} }]
      }
    });
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return groundingChunks.map(chunk => ({
      name: chunk.web?.title || chunk.maps?.uri?.split('/').pop()?.replace(/_/g, ' ') || "Target Node",
      address: chunk.web?.title || "Address Hidden",
      uri: chunk.web?.uri || chunk.maps?.uri || "#"
    }));
  },

  async generateStrategicBriefing(profile: UserProfile, jobCount: number, revenue: number) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const prompt = `TTS the following strategic conversation between TITAN (System Voice) and ${profile.fullName} (Specialist Persona):
      TITAN: Systems at 99.4% stability. We have ${jobCount} active discovery nodes and $${revenue} in pending yield. Strategy?
      ${profile.fullName.split(' ')[0]}: Focus on high-friction B2B nodes. Deploy tailored DNA relays immediately.
      TITAN: Understood. Scaling mission load to optimized capacity.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: 'TITAN',
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
              },
              {
                speaker: profile.fullName.split(' ')[0],
                voiceConfig: { prebuiltVoiceConfig: { voiceName: profile.fullName.includes("Ayana") ? 'Kore' : 'Puck' } }
              }
            ]
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const decodedBytes = decode(base64Audio);
    return await decodeAudioData(decodedBytes, ctx, 24000, 1);
  },

  async triggerRealDispatch(recipient: string, subject: string, body: string, type: string) {
    try {
      const response = await fetch('/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient, subject, body, type })
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  },

  async enrichCompanyEmail(companyName: string, domain: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify the best corporate contact email for ${companyName} (${domain}). Focus on strategic or recruitment nodes. Return JSON: { "email": "string" }.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }]
      }
    });
    const res = extractJson(response.text);
    return res?.email || "Not Found";
  },

  // Fix: Added missing performDeepEmailScrape method to satisfy component dependencies
  async performDeepEmailScrape(companyName: string, domain: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify the best corporate contact email and the name of the most relevant decision maker (Recruitment Lead, HR Director, or CEO) for ${companyName} (${domain}). Return JSON: { "email": "string", "personName": "string" }.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }]
      }
    });
    const res = extractJson(response.text);
    return {
      email: res?.email || "Not Found",
      personName: res?.personName || "Decision Maker"
    };
  },

  async analyzeOperationalGaps(industry: string, location: string, profileName: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for companies in ${industry} within ${location} with recent news of operational friction or scaling issues. 
      Tailor the audit for ${profileName}'s expertise.
      Return list of JSON: company, website, gaps (array), solution, projectedValue (number).`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }]
      }
    });
    return extractJson(response.text) || [];
  },

  async generateB2BPitch(companyName: string, gaps: string[], solution: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate a board-level proposal for ${companyName}. 
      Logic Gaps: ${gaps.join(', ')}. 
      Proposed solution: ${solution}. 
      Persona: ${profile.fullName} (${profile.domain}). 
      Style: Authoritative, board-ready, focus on ROI.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });
    return response.text;
  },

  async scoutNexusLeads(industry: string, location: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify 6 corporations in ${industry} (${location}). Return JSON array with name, website, email, hiringContext.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }]
      }
    });
    return extractJson(response.text) || [];
  },

  async generateMarketNexusPitch(lead: any, service: any, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate a formal board proposal for ${lead.name} selling ${service.name} ($${service.price}). 
      Persona: ${profile.fullName} (${profile.domain}). 
      Return JSON with keys: executiveSummary, implementationPhases, valueProjection, emailBody, subject.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: { type: Type.STRING },
            implementationPhases: { type: Type.STRING },
            valueProjection: { type: Type.STRING },
            emailBody: { type: Type.STRING },
            subject: { type: Type.STRING }
          },
          required: ["executiveSummary", "implementationPhases", "valueProjection", "emailBody", "subject"]
        }
      }
    });
    return extractJson(response.text);
  },

  async generateVision(prompt: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "16:9" }
      }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  },

  async processConsoleCommand(command: string, profile: UserProfile): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Execute command: "${command}". Context: ${profile.fullName} (${profile.domain}).`,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text || "Command processed.";
  },

  async scoutFlashGigs(profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for high-paying freelance gigs for a ${profile.domain}. Search LinkedIn, Upwork, and niche hubs. Return JSON array.`,
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
      contents: `Identify 10 potential clients (agencies/pubs) for ${profile.fullName} in the niche: ${niche}. 
      Return JSON array: companyName, website, description, type (PUBLICATION|AGENCY|OTHER), opportunityScore.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }]
      }
    });
    return extractJson(response.text) || [];
  },

  async tailorClientPitch(companyName: string, description: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Tailor a high-stakes pitch for ${companyName} (${description}). 
      Persona: ${profile.fullName}. CV Context: ${profile.masterCV}.
      Return JSON with keys: subject, body, contactPersonStrategy.`,
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
    return extractJson(response.text);
  },

  async connectLive(onTranscription: (text: string) => void, onTurnComplete: () => void) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    let currentInputTranscription = '';
    let currentOutputTranscription = '';

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => {
          console.debug('Neural Link Session Opened');
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
               });
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

          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
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
            activeSources.forEach(s => s.stop());
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
  }
};
