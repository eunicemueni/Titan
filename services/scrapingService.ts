
import { geminiService } from './geminiService';

export const scrapingService = {
  /**
   * Dispatches a search query via the TITAN Bridge (Puppeteer) with a silent fallback.
   */
  async precisionGoogleSearch(query: string, location: string) {
    console.log(`TITAN_OS: Deploying Precision Trace...`);
    
    // Attempt Bridge Relay
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `${query} jobs in ${location}` }),
        // Set a low timeout to pivot quickly if the server doesn't exist
        signal: AbortSignal.timeout(3000) 
      });

      if (response.ok) {
        const data = await response.json();
        const rawResults = data.results?.[0]?.content?.results?.organic || [];
        if (rawResults.length > 0) {
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
        }
      }
    } catch (e) {
      // Silent failover to Gemini Grounding
    }

    // High-Velocity Neural Fallback (Deployment Safe)
    try {
      const results = await geminiService.performUniversalScrape(query, location);
      return results.map((j: any, i: number) => ({
        id: `gem-job-${Date.now()}-${i}`,
        company: j.company || "Target Node",
        role: j.role || query,
        location: j.location || location,
        description: j.description || "Operational data synthesized via AI Grounding.",
        sourceUrl: j.sourceUrl || "", // Empty URL signals "Shadow Market"
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
