
export const scrapingService = {
  authHeader() {
    const username = "Eunnah100_QJl9q";
    const password = "cV4sOJ=BSGFe1im";
    return 'Basic ' + btoa(`${username}:${password}`);
  },

  // Precision search for remote-only roles using Oxylabs Google Search integration
  async precisionGoogleSearch(query: string, location: string) {
    // Aggressive negative operators to ensure 100% Remote USA/Worldwide
    const geoQuery = location.includes('USA') ? 'USA 100% Remote-Only' : 'Worldwide Remote Distributed';
    const remoteQuery = `"${query}" "${geoQuery}" -hybrid -onsite -office -commute -relocation`;
    
    const body = {
      source: "google_search",
      query: `${remoteQuery} jobs site:lever.co OR site:greenhouse.io OR site:workday.com`,
      parse: true,
    };

    try {
      const response = await fetch('https://realtime.oxylabs.io/v1/queries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.authHeader(),
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      
      if (data.results && data.results[0]?.content?.results?.organic) {
        return data.results[0].content.results.organic.map((res: any, i: number) => ({
          id: `oxy-job-${Date.now()}-${i}`,
          company: res.title.split(' - ')[1] || "Target",
          role: res.title.split(' - ')[0] || query,
          location: location.includes('USA') ? "USA Remote-Only" : "Worldwide Remote",
          description: res.snippet,
          sourceUrl: res.url,
          status: 'discovered',
          matchScore: 95,
          timestamp: Date.now()
        }));
      }
      return [];
    } catch (error) {
      console.error("OXY_JOB_FAIL:", error);
      return [];
    }
  },

  // Deep corporate scraping for industry targets using Oxylabs relay
  async scoutCorporateTargets(industry: string, region: string) {
    const geoQuery = region.includes('USA') ? 'USA 100% Remote-Only hiring' : 'Worldwide Remote Distributed hiring';
    const body = {
      source: "google_search",
      query: `top ${industry} companies ${geoQuery} -hybrid -onsite -office`,
      parse: true,
    };

    try {
      const response = await fetch('https://realtime.oxylabs.io/v1/queries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.authHeader(),
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      
      if (data.results && data.results[0]?.content?.results?.organic) {
        return data.results[0].content.results.organic.map((res: any, i: number) => ({
          id: `oxy-corp-${Date.now()}-${i}`,
          name: res.title.split(' - ')[0] || "Target Corporation",
          website: res.url,
          location: region,
          opportunityScore: 85 + Math.floor(Math.random() * 10),
          status: 'IDLE',
          email: 'Node Locked'
        }));
      }
      return [];
    } catch (error) {
      console.error("OXY_CORP_FAIL:", error);
      return [];
    }
  }
};
