// TITAN_OS_NEURAL_PULSE: 2026-03-07T14:52:00Z
import { GoogleGenAI, Type, Modality, GenerateContentResponse, LiveServerMessage } from "@google/genai";
import { UserProfile } from "../types";

// Detect and sanitize API Base URL for Neural Bridge communication
const rawBase = process.env.VITE_API_URL || '';
const API_BASE = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

const SYSTEM_INSTRUCTION = `SYSTEM: TITAN OS COMMAND AI.
IDENTITY: High-level autonomous career operating system.
PERSONA CONTEXT: 
1. Ayana Inniss (Strategic Growth/B2B): Focused on market expansion and revenue logic.
2. Eunice Muema (Actuarial/Risk): Focused on risk architecture and financial audits.

GOAL: Maximize user revenue via 100% remote strategic nodes.
CORE DNA: Professional, authoritative, efficient.
RULES: Use Google Search/Maps grounding for market data. Return results in clear JSON format where specified.`;

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED');
      if (isRateLimit && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 2000 + Math.random() * 1000;
        console.warn(`TITAN_OS: Rate limit hit. Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    throw new Error("TITAN_OS: GEMINI_API_KEY is missing or invalid.");
  }
  return new GoogleGenAI({ apiKey });
}

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
    let contentToParse = (jsonBlockMatch ? jsonBlockMatch[1] : text).trim();
    
    const firstBracket = contentToParse.search(/[\[\{]/);
    if (firstBracket === -1) return null;
    
    const startChar = contentToParse[firstBracket];
    const endChar = startChar === '{' ? '}' : ']';
    const lastBracket = contentToParse.lastIndexOf(endChar);
    
    if (lastBracket !== -1) {
      contentToParse = contentToParse.substring(firstBracket, lastBracket + 1);
    }
    
    return JSON.parse(contentToParse);
  } catch (e) {
    console.error("TITAN_OS: JSON Parse Error", e);
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
    return withRetry(async () => {
      const ai = getAI();
      console.log(`TITAN_OS: Initiating Neural Scrape for ${industry} in ${location}...`);
      
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `I need to find active remote job openings for "${industry}". 
        Location: "${location}". 
        
        Please search the web extensively and provide a list of 25-50 current job opportunities. 
        Target major job boards (LinkedIn, Indeed, Glassdoor, ZipRecruiter) and direct company career pages (Greenhouse, Lever, Workday).
        
        CRITICAL: If you cannot find exact matches for "${industry}", broaden your search to highly related roles or industries that would fit the user's expertise. DO NOT return an empty list if there are related opportunities.
        
        Include the company name, job title, a brief description, and the direct application or source URL.
        
        Return the results as a JSON array of objects.`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION + "\nCRITICAL: You MUST use the googleSearch tool to find REAL, CURRENT data. Do not hallucinate. Search multiple sources. If you find links, include them.",
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
                location: { type: Type.STRING }
              },
              required: ["company", "role", "description", "sourceUrl", "location"]
            }
          }
        }
      });
      
      const text = response.text?.trim() || "[]";
      let results = extractJson(text) || [];
      
      const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sourceUrls = groundingSources
        .filter(chunk => chunk.web?.uri)
        .map(chunk => ({ title: chunk.web?.title || "Search Source", uri: chunk.web?.uri || "" }));

      console.log(`TITAN_OS: Neural Scrape complete. JSON: ${results.length}, Grounding: ${sourceUrls.length}`);

      // FALLBACK: If JSON is empty or low count, synthesize results from ALL grounding sources
      if (results.length < 5 && sourceUrls.length > 0) {
        console.log("TITAN_OS: JSON low count, synthesizing from grounding sources...");
        const synthesized = sourceUrls.map((src) => {
          // Try to extract company/role from title if possible
          const titleParts = src.title.split(' - ');
          const company = titleParts[0] || "Target Node";
          const role = titleParts[1] || industry;
          
          return {
            company: company,
            role: role,
            description: `Active opportunity identified via ${src.title}. Grounding confirmed via neural relay.`,
            sourceUrl: src.uri,
            location: location
          };
        });
        
        // Merge and deduplicate by sourceUrl
        const existingUrls = new Set(results.map((r: any) => r.sourceUrl));
        synthesized.forEach(s => {
          if (!existingUrls.has(s.sourceUrl)) {
            results.push(s);
            existingUrls.add(s.sourceUrl);
          }
        });
      }

      return results.map((job: any) => ({ 
        ...job, 
        metadata: { sources: sourceUrls } 
      }));
    }).catch(error => {
      console.error("TITAN_OS: Neural Scrape failed:", error);
      return [];
    });
  },

  async expandSearchQuery(query: string, profile?: UserProfile): Promise<string[]> {
    return withRetry(async () => {
      const ai = getAI();
      let profileContext = '';
      if (profile) {
        const expertise = Object.entries(profile.expertiseBlocks || {})
          .filter(([_, v]) => v)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        const roles = profile.preferences?.targetRoles?.join(', ');
        const cv = profile.masterCV?.substring(0, 500);

        if (expertise || roles || cv) {
          profileContext = `
          User Profile Context:
          ${expertise ? `- Expertise: ${expertise}` : ''}
          ${roles ? `- Target Roles: ${roles}` : ''}
          ${cv ? `- Master CV Summary: ${cv}...` : ''}
          `;
        }
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Given the job search query "${query}", generate 10 highly relevant alternative search strings that would find similar remote roles. 
        ${profileContext}
        
        CRITICAL: Be BROAD. If the user searches for "Sales", include variations like "Account Executive", "Business Development", "Sales Representative", etc. 
        Do not restrict to just one sub-niche unless specifically asked. 
        Ensure all variations are for REMOTE roles.
        
        Return as a simple JSON array of strings.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      return extractJson(response.text) || [query];
    }).catch(() => [query]);
  },

  async scoutCorporateNodesWithMaps(industry: string, region: string) {
    return withRetry(async () => {
      const ai = getAI();
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Find headquarters and physical office locations for ${industry} companies in ${region}.`,
        config: {
          tools: [{ googleMaps: {} } as any],
        },
      });
      
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      return groundingChunks
        .filter((chunk: any) => chunk.maps)
        .map((chunk: any) => ({
          name: chunk.maps?.title || "Corporate Node",
          address: chunk.maps?.title || "Location identified",
          uri: chunk.maps?.uri || ""
        }));
    });
  },

  async analyzeOperationalGaps(industry: string, location: string, persona: string) {
    return withRetry(async () => {
      const ai = getAI();
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze operational logic gaps for companies in ${industry} at ${location}. Persona: ${persona}. Return JSON array of YieldNode objects: {company, website, gaps, solution, projectedValue, complexity}.`,
        config: {
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
          },
          systemInstruction: SYSTEM_INSTRUCTION
        }
      });
      return extractJson(response.text) || [];
    });
  },

  async generateB2BPitch(company: string, gaps: string[], solution: string, profile: UserProfile) {
    return withRetry(async () => {
      const ai = getAI();
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a high-authority B2B pitch for ${company}. Gaps: ${gaps.join(', ')}. Solution: ${solution}. Profile: ${profile.fullName}.`,
        config: { systemInstruction: SYSTEM_INSTRUCTION }
      });
      return response.text;
    });
  },

  async tailorJobPackage(jobTitle: string, companyName: string, profile: UserProfile, _type: string, hiringManager: string) {
    return withRetry(async () => {
      const ai = getAI();
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Generate a high-authority tailored job application package for the role of ${jobTitle} at ${companyName}. 
        
        USER_DNA: ${profile.masterCV}
        PORTFOLIO: ${profile.portfolioUrl}
        LINKEDIN: ${profile.linkedinUrl}
        MANAGER: ${hiringManager}

        REQUIREMENTS:
        1. The 'emailBody' MUST include a professional pitch and explicitly link to the Portfolio (${profile.portfolioUrl}) and LinkedIn (${profile.linkedinUrl}).
        2. The 'cv' should be a tailored version of the Master CV.
        3. The 'coverLetter' should be a formal letter addressed to ${hiringManager}. It MUST explicitly include the User's Portfolio URL (${profile.portfolioUrl}) in the contact information or closing.
        4. Mention that the CV and Cover Letter are attached to the communication.

        Return JSON: {cv, coverLetter, emailBody, subject}.`,
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
    });
  },

  async generateStrategicBriefing(profile: UserProfile, jobCount: number, revenue: number) {
    const ai = getAI();
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
    const ai = getAI();
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
          const content = message.serverContent as any;
          if (content?.outputTranscription) {
            currentOutputTranscription += content.outputTranscription.text;
            onTranscription(currentOutputTranscription);
          } else if (content?.inputTranscription) {
            currentInputTranscription += content.inputTranscription.text;
          }

          if (content?.turnComplete) {
            onTurnComplete();
            currentInputTranscription = '';
            currentOutputTranscription = '';
          }

          const base64Audio = content?.modelTurn?.parts?.[0]?.inlineData?.data;
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
        onerror: (e) => console.error('Neural Link Error:', e),
        onclose: () => console.debug('Neural Link Terminated'),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        outputAudioTranscription: {},
        inputAudioTranscription: {},
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
        }
      } as any
    });
    activeSessionPromise = sessionPromise;
    return sessionPromise;
  },

  async performDeepEmailScrape(companyName: string, domain: string) {
    const ai = getAI();
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for corporate contact email and manager name for ${companyName} (${domain}). Return JSON: {email, personName}.`,
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
    return extractJson(response.text) || { email: "Not Found", personName: "Decision Maker" };
  },

  async scoutNexusLeads(industry: string, location: string) {
    return withRetry(async () => {
      const ai = getAI();
      console.log(`TITAN_OS: Scouting corporate leads for ${industry} in ${location}...`);
      
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Identify 25-50 real, active corporations in the "${industry}" sector that are known for hiring remote talent globally or in "${location}". 
        
        The system has a daily capacity of 2000 outreach nodes. Find high-quality targets.
        
        For each corporation, provide:
        1. Official Company Name
        2. Main Website URL
        3. A general contact or careers email (if not found, use a placeholder like "hr@company.com")
        4. Brief context on their current hiring pulse or strategic focus.
        
        Return the results as a JSON array of objects.`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION + "\nCRITICAL: Use the googleSearch tool to find REAL companies. Do not hallucinate. Ensure websites are valid.",
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
      
      const text = response.text?.trim() || "[]";
      let results = extractJson(text) || [];
      
      if (results.length === 0) {
        console.warn("TITAN_OS: No corporate leads found in JSON, checking grounding...");
        const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        results = groundingSources
          .filter(chunk => chunk.web?.uri)
          .map(chunk => ({
            name: chunk.web?.title?.split(' - ')[0] || "Target Corporation",
            website: chunk.web?.uri || "",
            email: "hr@target.com",
            hiringContext: `Identified via neural grounding: ${chunk.web?.title}`
          })).slice(0, 50);
      }
      
      return results;
    }).catch(error => {
      console.error("TITAN_OS: Scout Nexus failed:", error);
      return [];
    });
  },

  async scoutFlashGigs(_profile: UserProfile) {
    return withRetry(async () => {
      const ai = getAI();
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Search for active, 100% REMOTE freelance gigs and tasks posted within the LAST 5 HOURS ONLY. 
        
        Target a wide range of categories including:
        - Data Entry & Virtual Assistant tasks
        - Content Writing, Copywriting & Editing
        - Tech, Programming & Web Development
        - Digital Marketing & Social Media
        
        Search global platforms (Upwork, Freelancer, Guru, PeoplePerHour, specialized remote boards). 
        
        CRITICAL: Only return gigs posted 0-5 hours ago. Ensure they are fully remote.
        
        For each gig, provide:
        1. Project Title
        2. Platform Name
        3. Estimated Budget or Rate
        4. Time Posted (MUST be 5h or less)
        5. Brief Project Description
        6. Direct Apply or Source URL
        
        Return the results as a JSON array of objects.`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION + "\nCRITICAL: Use the googleSearch tool to find REAL, CURRENT data. Focus on the 'last 5 hours' constraint. Do not hallucinate. Ensure URLs are valid.",
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
      
      const text = response.text?.trim() || "[]";
      let results = extractJson(text) || [];
      
      if (results.length === 0) {
        console.warn("TITAN_OS: No flash gigs found in JSON, checking grounding...");
        const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        results = groundingSources
          .filter(chunk => chunk.web?.uri)
          .map(chunk => ({
            title: chunk.web?.title || "Remote Freelance Gig",
            platform: "Global Relay",
            budget: "Competitive",
            posted: "Just Now",
            description: `Identified via neural grounding: ${chunk.web?.title}`,
            applyUrl: chunk.web?.uri || ""
          })).slice(0, 50);
      }
      
      return results;
    });
  },

  async processConsoleCommand(command: string, profile: UserProfile): Promise<string> {
    const ai = getAI();
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Command: "${command}". Profile: ${profile.fullName}.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text || "Command processed.";
  },

  async triggerRealDispatch(email: string, subject: string, body: string, type: string) {
    try {
      const response = await fetch(`${API_BASE}/api/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: email, subject, body, type })
      });
      return response.ok;
    } catch (e) {
      console.error("Uplink dispatch failed:", e);
      return false;
    }
  },

  async generateMarketNexusPitch(lead: any, service: any, profile: UserProfile) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `Architect a formal board-ready proposal for ${lead.name} regarding the implementation of ${service.name}. 
      Price: $${service.price}. Lead Context: ${lead.hiringContext}. User: ${profile.fullName}.
      Return JSON: { executiveSummary, implementationPhases, valueProjection, emailBody, subject }.`,
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
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { 
        imageConfig: { aspectRatio: "16:9" } 
      } as any
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  },

  async scoutClientLeads(niche: string, _profile: UserProfile) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify 6 high-intent client nodes (agencies/publications) in the "${niche}" niche. Return JSON array: { companyName, website, description, type, opportunityScore }.`,
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
              type: { type: Type.STRING, description: "One of: PUBLICATION, AGENCY, OTHER" },
              opportunityScore: { type: Type.NUMBER }
            },
            required: ["companyName", "website", "description", "type", "opportunityScore"]
          }
        }
      }
    });
    return extractJson(response.text) || [];
  },

  async tailorClientPitch(companyName: string, description: string, profile: UserProfile) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `Generate a tailored high-authority pitch for ${companyName}. Context: ${description}. Persona: ${profile.fullName}. Profile DNA: ${profile.masterCV}. Return JSON: { subject, body, contactPersonStrategy }.`,
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
  }
};
