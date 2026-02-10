
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { UserProfile } from "../types";

const cleanJson = (text: string) => {
  try {
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) return jsonMatch[0];
    const singleMatch = text.match(/\{[\s\S]*\}/);
    if (singleMatch) return singleMatch[0];
  } catch (e) {
    console.error("JSON Clean Error:", e);
  }
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

const SYSTEM_GUIDELINE = `You are TITAN OS Core, an autonomous career and business agent. 
IDENTITY RULES:
1. You are NOT a person. You are an operating system.
2. Technical Context: FIS Prophet and WTW MoSes are Actuarial Modeling Software, not religious or historical figures.
3. Writing Style: First-person as the user, extreme professional authority, data-driven.
MANDATORY: 
1. NEVER use placeholders like [Name], [Company], [Date], or any bracketed text. 
2. If info is missing, INFER it professionally based on the identity vault. 
3. Content must be 100% ready to send.`;

// Manual Base64 decoding for Audio
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

export const geminiService = {
  isCoolingDown: false,
  audioContext: null as AudioContext | null,

  async speak(text: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say with extreme professional authority: ${text}` }] }],
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
        const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), this.audioContext);
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);
        source.start();
        return true;
      }
    } catch (e) {
      console.error("TTS_CORE_FAIL:", e);
    }
    return false;
  },

  async generateVision(prompt: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `A futuristic, high-tech, cinematic concept art of: ${prompt}. Dark indigo and neon purple theme, professional brand mockup.` }] },
        config: { imageConfig: { aspectRatio: "16:9" } },
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    } catch (e) {
      console.error("VISION_CORE_FAIL:", e);
    }
    return null;
  },

  async handleApiError(e: any) {
    console.error("TITAN API ERROR:", e);
    return "CORE_CRITICAL: Neural interrupt detected.";
  },

  async performUniversalScrape(industry: string, location: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Discover live REAL remote jobs for ${industry} in ${location}. Return valid JSON array with: company, roleOrOpportunity, description, sourceUrl.`,
        config: { 
          systemInstruction: SYSTEM_GUIDELINE,
          tools: [{ googleSearch: {} }], 
          responseMimeType: "application/json" 
        },
      });
      return JSON.parse(cleanJson(response.text || '[]'));
    } catch (e: any) { throw new Error(await this.handleApiError(e)); }
  },

  async discoverJobPostings(query: string, location: string, salaryFilter: string) {
    return this.performUniversalScrape(`${query} ${salaryFilter}`, location);
  },

  async tailorJobPackage(
    role: string, 
    company: string, 
    profile: UserProfile, 
    mode: string = 'standard', 
    contactPerson: string = 'Hiring Manager', 
    assets: { cv?: string, portfolio?: string } = {}
  ) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const cvLink = profile.dossierLink || "CV_LINK_REDACTED";
      const portfolioLink = profile.portfolioUrl || "PORTFOLIO_LINK_REDACTED";

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `MISSION: STRATEGIC IDENTITY REWRITE FOR ${company}. 
        ROLE: ${role}. 
        MODE: ${mode}. 
        CONTACT: ${contactPerson}. 
        ASSETS_FOR_TAILORING: { CV_CONTENT: "${profile.masterCV.substring(0, 3000)}", CV_FILE_LINK: "${cvLink}", PORTFOLIO_URL: "${portfolioLink}" }. 
        Persona: ${profile.fullName}. 
        
        STRATEGY INSTRUCTION:
        1. REWRITE the CV to emphasize high-value solution architecture.
        2. DRAFT an outreach email body.
        3. MANDATORY ASSET PLACEMENT:
           - You MUST include a link to the "Senior Strategic Dossier (CV)" early in the email (e.g., "I am sharing my Strategic Dossier [${cvLink}] for your review...").
           - You MUST include the CV link AGAIN in the Strategic Value Hypothesis section.
        4. MANDATORY IDENTITY DISCLOSURE: The email body MUST state: "I am contacting you through my autonomous agent, TITAN OS, to propose a strategic alignment..."
        5. MANDATORY FOOTER: The email body MUST have a footer titled "OFFICIAL STRATEGIC ASSETS" with:
           - [DIRECT DOWNLOAD] Senior Strategy Dossier (CV): ${cvLink}
           - [LIVE NODE] Knowledge Nexus Portfolio: ${portfolioLink}
           - [SOCIAL GRAPH] Professional Network: ${profile.linkedinUrl}
        6. Position this not as an application, but as a "Strategic Proposition for ${role}."
        Return JSON with: subject, emailBody, coverLetter, cv.`,
        config: { 
          systemInstruction: SYSTEM_GUIDELINE,
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json" 
        }
      });
      return JSON.parse(cleanJson(response.text || '{}'));
    } catch (e: any) { throw new Error(await this.handleApiError(e)); }
  },

  async targetCompaniesForOutreach(industry: string, region: string, jobTitle: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Identify 15 REAL targets for ${jobTitle} in ${region} in the ${industry} sector. Return JSON with metrics, website, name.`,
        config: { 
          systemInstruction: SYSTEM_GUIDELINE,
          tools: [{ googleSearch: {} }], 
          responseMimeType: "application/json" 
        },
      });
      return JSON.parse(cleanJson(response.text || '[]'));
    } catch (e: any) { throw new Error(await this.handleApiError(e)); }
  },

  async performDeepEmailScrape(companyName: string, domain: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Locate actual decision maker contact patterns for ${companyName} (${domain}).`,
        config: { 
          systemInstruction: SYSTEM_GUIDELINE,
          tools: [{ googleSearch: {} }], 
          responseMimeType: "application/json" 
        },
      });
      return JSON.parse(cleanJson(response.text || '{}'));
    } catch (e: any) { return { email: 'hr@' + domain, personName: 'Hiring Lead' }; }
  },

  async analyzeOperationalGaps(companyType: string, location: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze B2B operational gaps for ${companyType} in ${location}. Return JSON array of objects with: company, website, gaps (string array), solution, projectedValue (number), complexity ('Low'|'Medium'|'High').`,
        config: { 
          systemInstruction: SYSTEM_GUIDELINE,
          tools: [{ googleSearch: {} }], 
          responseMimeType: "application/json" 
        },
      });
      return JSON.parse(cleanJson(response.text || '[]'));
    } catch (e: any) { throw new Error(await this.handleApiError(e)); }
  },

  async enrichCompanyEmail(companyName: string, website: string) {
    const domain = website.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
    const res = await this.performDeepEmailScrape(companyName, domain);
    return res.email;
  },

  async getOperationalAudit(prompt: string, profile: UserProfile) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `${prompt}. User Context: ${profile.masterCV}`,
        config: { systemInstruction: SYSTEM_GUIDELINE },
      });
      return response.text || '';
    } catch (e: any) { return "Audit sequence failed."; }
  },

  async generateB2BPitch(companyName: string, gaps: string[], solution: string, profile: UserProfile) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Generate a high-converting B2B pitch for ${companyName}. Gaps identified: ${gaps.join(', ')}. Proposed Solution: ${solution}. Persona: ${profile.fullName}`,
        config: { systemInstruction: SYSTEM_GUIDELINE },
      });
      return response.text || '';
    } catch (e: any) { return "Pitch generation failed."; }
  },

  async processConsoleCommand(prompt: string, profile: UserProfile) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { systemInstruction: SYSTEM_GUIDELINE },
      });
      return response.text || '';
    } catch (e: any) { return "Command execution failed."; }
  },

  async scoutFlashGigs(profile: UserProfile) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Identify high-velocity freelance gigs for: ${profile.masterCV.substring(0, 300)}`,
        config: { 
          systemInstruction: SYSTEM_GUIDELINE,
          tools: [{ googleSearch: {} }], 
          responseMimeType: "application/json" 
        },
      });
      return JSON.parse(cleanJson(response.text || '[]'));
    } catch (e: any) { return []; }
  },

  async scoutNexusLeads(industry: string, location: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify real B2B leads in ${industry} @ ${location}.`,
      config: { 
        systemInstruction: SYSTEM_GUIDELINE,
        tools: [{ googleSearch: {} }], 
        responseMimeType: "application/json" 
      }
    });
    return JSON.parse(cleanJson(response.text || '[]'));
  },

  async scoutClientLeads(niche: string, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Scout agencies/pubs in ${niche}.`,
      config: { 
        systemInstruction: SYSTEM_GUIDELINE,
        tools: [{ googleSearch: {} }], 
        responseMimeType: "application/json" 
      }
    });
    return JSON.parse(cleanJson(response.text || '[]'));
  },

  async tailorClientPitch(companyName: string, description: string, profile: UserProfile) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Tailor a high-impact client pitch for ${companyName}. Context: ${description}. Identity Vault: ${profile.masterCV}. Return JSON with: subject, body, contactPersonStrategy.`,
        config: { 
          systemInstruction: SYSTEM_GUIDELINE,
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(cleanJson(response.text || '{}'));
    } catch (e: any) { throw new Error(await this.handleApiError(e)); }
  },

  async generateMarketNexusPitch(lead: any, service: any, profile: UserProfile) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `MISSION: Generate a professional board-ready business proposal for ${lead.name}. 
      SERVICE: "${service.name}" (Valuation: $${service.price}). 
      ASSETS: Dossier (${profile.dossierLink}), Portfolio (${profile.portfolioUrl}).

      REQUIRED SECTIONS:
      1. EXECUTIVE SUMMARY: authoritatively state the value proposition.
      2. IMPLEMENTATION PHASES: provide a 3-step roadmap.
      3. VALUE PROJECTION: justify the $${service.price} investment.
      4. OUTREACH EMAIL: a direct, persuasive email referencing the Dossier and Portfolio.
      
      Return JSON with: subject, executiveSummary, implementationPhases, valueProjection, emailBody.`,
      config: { 
        systemInstruction: SYSTEM_GUIDELINE,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(cleanJson(response.text || '{}'));
  }
};
