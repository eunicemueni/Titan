export const scrapingService = {
  /**
   * Dispatches a search query through the TITAN server proxy.
   */
  async precisionGoogleSearch(query: string, location: string) {
    const geoQuery = location.includes('USA') ? 'USA 100% Remote-Only' : 'Worldwide Remote Distributed';
    const remoteQuery = `"${query}" "${geoQuery}" -hybrid -onsite -office -commute -relocation`;
    
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'JOB_SEARCH',
          query: `${remoteQuery} jobs site:lever.co OR site:greenhouse.io OR site:workday.com`
        }),
      });

      if (!response.ok) throw new Error('Proxy Relay Unavailable');

      const data = await response.json();
      const rawResults = data.results?.[0]?.content?.results?.organic || [];
      
      return rawResults.map((res: any, i: number) => ({
        id: `oxy-job-${Date.now()}-${i}`,
        company: res.title?.split(' - ')[1] || "Target Node",
        role: res.title?.split(' - ')[0] || query,
        location: location.includes('USA') ? "USA Remote-Only" : "Worldwide Remote",
        description: res.snippet || "Operational data encrypted.",
        sourceUrl: res.url,
        status: 'discovered',
        matchScore: 95,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error("TITAN_SCRAPE_FAIL:", error);
      return [];
    }
  },

  /**
   * Identifies corporate hiring targets via server-side trace.
   */
  async scoutCorporateTargets(industry: string, region: string) {
    const geoQuery = region.includes('USA') ? 'USA 100% Remote-Only hiring' : 'Worldwide Remote Distributed hiring';
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CORP_SCOUT',
          query: `top ${industry} companies ${geoQuery} -hybrid -onsite -office`
        }),
      });

      if (!response.ok) throw new Error('Proxy Relay Unavailable');

      const data = await response.json();
      const rawResults = data.results?.[0]?.content?.results?.organic || [];
      
      return rawResults.map((res: any, i: number) => ({
        id: `oxy-corp-${Date.now()}-${i}`,
        name: res.title?.split(' - ')[0] || "Target Corporation",
        website: res.url,
        location: region,
        opportunityScore: 85 + Math.floor(Math.random() * 10),
        status: 'IDLE',
        email: 'Node Locked'
      }));
    } catch (error) {
      console.error("TITAN_SCOUT_FAIL:", error);
      return [];
    }
  }
};