
import { geminiService } from './geminiService';

export const scrapingService = {
  /**
   * Dispatches a search query via the TITAN Bridge (Puppeteer) with a silent fallback.
   * Enhanced with Deep Discovery (Query Expansion) to maximize relevance.
   */
  async precisionGoogleSearch(query: string, location: string) {
    console.log(`TITAN_OS: Deploying Precision Trace for "${query}"...`);
    
    // 1. PRIMARY TRACE: Attempt Bridge Relay (Puppeteer)
    try {
      console.log(`TITAN_BRIDGE: Attempting Puppeteer Relay for "${query}"...`);
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `${query} remote jobs in ${location}` }),
        signal: AbortSignal.timeout(15000) 
      });

      if (response.ok) {
        const data = await response.json();
        const rawResults = data.results?.[0]?.content?.results?.organic || [];
        if (rawResults.length > 0) {
          console.log(`TITAN_BRIDGE: Puppeteer success. Found ${rawResults.length} results.`);
          return rawResults.map((res: any, i: number) => ({
            id: `pup-${Date.now()}-${i}`,
            company: res.title?.split('at')?.[1]?.trim() || "Target Node",
            role: res.title || query,
            location: location,
            description: res.snippet || "Automated data capture via Puppeteer Node.",
            sourceUrl: res.url || "",
            status: 'discovered',
            matchScore: 92,
            timestamp: Date.now()
          }));
        } else {
          console.log("TITAN_BRIDGE: Puppeteer returned 0 organic results.");
        }
      } else {
        console.warn(`TITAN_BRIDGE: Puppeteer relay returned status ${response.status}`);
      }
    } catch (e: any) {
      console.warn("TITAN_BRIDGE: Puppeteer Relay failed, falling back to Neural Grounding.", e.message);
    }

    // 2. NEURAL TRACE: High-Velocity Neural Grounding
    try {
      let results = await geminiService.performUniversalScrape(query, location);
      
      // 3. DEEP DISCOVERY: If zero results, expand search pattern
      if (results.length === 0) {
        console.log(`TITAN_DISCOVERY: Null pulse for "${query}". Initiating Deep Discovery Expansion...`);
        const variations = await geminiService.expandSearchQuery(query);
        
        // Try the first variation (most relevant)
        if (variations.length > 0 && variations[0] !== query) {
          console.log(`TITAN_DISCOVERY: Retrying with expanded node: "${variations[0]}"`);
          results = await geminiService.performUniversalScrape(variations[0], location);
        }
      }

      if (results.length === 0) {
        console.warn("TITAN_DISCOVERY: Deep Discovery returned 0 results. This may be due to safety filters or grounding limits.");
      }

      return results.map((j: any, i: number) => ({
        id: `gem-job-${Date.now()}-${i}`,
        company: j.company || "Target Node",
        role: j.role || query,
        location: j.location || location,
        description: j.description || "Operational data synthesized via AI Grounding.",
        sourceUrl: j.sourceUrl || "", 
        status: 'discovered',
        matchScore: 95,
        timestamp: Date.now(),
        metadata: j.metadata
      }));
    } catch (error) {
      console.error("TITAN_DISCOVERY_FAIL:", error);
      return [];
    }
  },

  /**
   * Identifies corporate hiring targets via Gemini Grounding.
   */
  async scoutCorporateTargets(industry: string, region: string) {
    try {
      const results = await geminiService.scoutNexusLeads(industry, region);
      return results.map((res: any, i: number) => ({
        id: `gem-corp-${Date.now()}-${i}`,
        name: res.name || "Target Corporation",
        website: res.website || "",
        location: region,
        opportunityScore: 85 + Math.floor(Math.random() * 10),
        status: 'IDLE',
        email: 'Node Locked',
        hiringContext: res.hiringContext || "Active hiring pulse detected."
      }));
    } catch (error) {
      console.error("TITAN_SCOUT_FAIL:", error);
      return [];
    }
  }
};
