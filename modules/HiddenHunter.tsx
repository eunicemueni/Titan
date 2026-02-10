
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { UserProfile, TelemetryLog, SentRecord, TargetedCompany } from '../types';
import { geminiService } from '../services/geminiService';

interface HiddenHunterProps {
  profile: UserProfile;
  onLog: (msg: string, level: TelemetryLog['level']) => void;
  updateStats: (updates: Partial<UserProfile['stats']>) => void;
  onSent: (record: Omit<SentRecord, 'id' | 'timestamp' | 'status'>) => void;
  companies: TargetedCompany[];
  setCompanies: React.Dispatch<React.SetStateAction<TargetedCompany[]>>;
  onBack: () => void;
}

const HiddenHunter: React.FC<HiddenHunterProps> = ({ profile, onLog, updateStats, onSent, companies, setCompanies, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [isAutopilot, setIsAutopilot] = useState(false);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [industry, setIndustry] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [region, setRegion] = useState('Worldwide');
  const [geoFilter, setGeoFilter] = useState('');
  const [viewingPackage, setViewingPackage] = useState<TargetedCompany | null>(null);

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => 
      c.location?.toLowerCase().includes(geoFilter.toLowerCase()) || 
      c.name.toLowerCase().includes(geoFilter.toLowerCase())
    );
  }, [companies, geoFilter]);

  useEffect(() => {
    let interval: any;
    if (isAutopilot && industry && jobTitle) {
      onLog(`AUTOPILOT ENGAGED: Deep-Web Corporate Scrape active.`, 'success');
      const runCycle = async () => {
        onLog(`AUTOPILOT: Discovery Pulse for ${industry}...`, 'info');
        try {
          const results = await geminiService.targetCompaniesForOutreach(industry, region, jobTitle);
          const formatted = results.map((c: any, i: number) => ({ 
            id: `auto-${Date.now()}-${i}`, 
            name: c.name, 
            website: c.website, 
            location: c.location || region, 
            email: c.email || 'Tracing...', 
            hiringManager: c.hiringManager, 
            hiringContext: c.hiringContext, 
            opportunityScore: c.opportunityScore || 50,
            metrics: c.metrics || { size: 'Unknown', funding: 'N/A', relevance: 50 },
            status: 'IDLE',
            // ALWAYS DEFAULT TO VAULT ASSETS
            customCv: profile.masterCV, 
            customPortfolio: profile.portfolioUrl
          }));
          setCompanies(prev => {
             const combined = [...formatted, ...prev];
             return Array.from(new Map(combined.map(item => [item.name, item])).values()).slice(0, 100);
          });
          onLog(`AUTOPILOT: Indexed ${formatted.length} new corporate nodes.`, 'success');
        } catch (e) {
          onLog(`AUTOPILOT ERROR: Core recalibrating...`, 'warning');
        }
      };
      runCycle();
      interval = setInterval(runCycle, 60000); 
    }
    return () => clearInterval(interval);
  }, [isAutopilot, industry, jobTitle, region, profile.masterCV, profile.portfolioUrl, setCompanies, onLog]);

  const handleCompanyScrape = async () => {
    if (!industry || !jobTitle) return;
    setLoading(true);
    onLog(`HUNTER DEPLOYED: Researching targets for "${jobTitle}"...`, 'info');
    try {
      const results = await geminiService.targetCompaniesForOutreach(industry, region, jobTitle);
      setCompanies(results.map((c: any, i: number) => ({ 
        id: `node-${Date.now()}-${i}`, 
        name: c.name, 
        website: c.website, 
        location: c.location || region, 
        email: c.email || 'Tracing...', 
        hiringManager: c.hiringManager, 
        hiringContext: c.hiringContext, 
        opportunityScore: c.opportunityScore || 50,
        metrics: c.metrics || { size: 'Unknown', funding: 'N/A', relevance: 50 },
        status: 'IDLE',
        // ALWAYS DEFAULT TO VAULT ASSETS
        customCv: profile.masterCV, 
        customPortfolio: profile.portfolioUrl
      })));
      onLog(`Located ${results.length} companies. Asset sync confirmed.`, 'success');
    } catch (err) { onLog("Discovery error.", 'error'); } finally { setLoading(false); }
  };

  const handleDeepScrapeContact = async (company: TargetedCompany) => {
    setEnrichingId(company.id);
    onLog(`DEEP TRACE: Scraping decision node for ${company.name}...`, 'info');
    try {
      const domain = new URL(company.website.startsWith('http') ? company.website : `https://${company.website}`).hostname.replace('www.', '');
      const result = await geminiService.performDeepEmailScrape(company.name, domain);
      
      setCompanies(prev => prev.map(c => c.id === company.id ? { 
        ...c, 
        email: result.email !== 'Not Found' ? result.email : c.email,
        hiringManager: result.personName || c.hiringManager,
        status: 'READY'
      } : c));
      
      onLog(`NODE CAPTURED: Identified ${result.email}`, 'success');
    } catch (err: any) {
      onLog(err.message, 'error');
    } finally {
      setEnrichingId(null);
    }
  };

  const handleRelay = async (company: TargetedCompany) => {
    setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, status: 'TAILORING' } : c));
    onLog(`RELAY INITIATED: Tailoring Identity for ${company.name}...`, 'info');
    try {
      // Automatic use of profile.dossierLink and portfolioUrl
      const pkg = await geminiService.tailorJobPackage(
        jobTitle, 
        company.name, 
        profile, 
        'cold', 
        company.hiringManager || 'Hiring Lead',
        { 
          cv: profile.masterCV, 
          portfolio: profile.portfolioUrl 
        }
      );
      
      const subject = pkg.subject || `Strategic Proposition: ${jobTitle} - ${profile.fullName}`;
      const fullBody = pkg?.emailBody || '';
      
      window.open(`mailto:${company.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}`, '_blank');

      const updatedCompany = { ...company, tailoredPackage: pkg || undefined, status: 'SENT' };
      setCompanies(prev => prev.map(c => c.id === company.id ? updatedCompany : c));
      setViewingPackage(updatedCompany);

      onSent({ type: 'COL_OUTREACH', recipient: company.email || company.name, subject: subject });
      onLog(`Relay dispatched. Portfolio + Cloud CV attached.`, 'success');
    } catch (err: any) {
      onLog(err.message, 'error');
      setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, status: 'READY' } : c));
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onLog(`${label} copied to clipboard.`, 'success');
  };

  if (viewingPackage) {
    return (
      <div className="min-h-screen bg-[#02040a] p-10 md:p-20 animate-in fade-in slide-in-from-right-10 duration-500">
         <div className="max-w-7xl mx-auto space-y-12">
            <div className="flex justify-between items-center">
               <button onClick={() => setViewingPackage(null)} className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
                  BACK TO HUNTER HUB
               </button>
               <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">DISPATCH AUDIT: {viewingPackage.name}</h2>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
               <div className="space-y-8">
                  <div className="bg-titan-surface border border-cyan-500/20 p-10 rounded-[3rem] shadow-2xl">
                     <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-6">Neural Email Pitch</h3>
                     <div className="text-sm font-serif italic text-slate-300 leading-relaxed whitespace-pre-wrap h-[300px] overflow-y-auto custom-scrollbar pr-4">
                        {viewingPackage.tailoredPackage?.emailBody}
                     </div>
                     <div className="mt-8 pt-6 border-t border-white/5">
                        <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Attached Assets (Vault)</p>
                        <p className="text-cyan-400 font-mono text-[9px] truncate">CV: {profile.dossierLink?.substring(0, 40)}...</p>
                        <p className="text-cyan-400 font-mono text-[9px] truncate">URL: {profile.portfolioUrl}</p>
                     </div>
                  </div>
               </div>

               <div className="space-y-8">
                  <div className="bg-titan-surface border border-white/5 p-10 rounded-[3rem] shadow-2xl">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Tailored Cover Letter</h3>
                     <div className="text-[11px] font-serif text-slate-400 leading-relaxed whitespace-pre-wrap h-[400px] overflow-y-auto custom-scrollbar pr-4">
                        {viewingPackage.tailoredPackage?.coverLetter}
                     </div>
                  </div>
               </div>

               <div className="space-y-8">
                  <div className="bg-white border border-slate-200 p-10 rounded-[3rem] shadow-2xl">
                     <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6">Tailored CV Overlay</h3>
                     <div className="text-[10px] font-mono text-slate-800 leading-relaxed whitespace-pre-wrap h-[400px] overflow-y-auto custom-scrollbar pr-4">
                        {viewingPackage.tailoredPackage?.cv}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#02040a] p-10 md:p-20 space-y-20 pb-40">
      <div className="flex justify-between items-center">
         <button onClick={onBack} className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
            BACK TO COMMAND
         </button>
         <div className="text-right flex items-center gap-6">
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Autopilot</span>
               <button onClick={() => setIsAutopilot(!isAutopilot)} className={`w-14 h-7 rounded-full p-1 transition-all ${isAutopilot ? 'bg-emerald-500' : 'bg-slate-800'}`}>
                 <div className={`w-5 h-5 rounded-full bg-white shadow-lg transition-all transform ${isAutopilot ? 'translate-x-7' : 'translate-x-0'}`}></div>
               </button>
            </div>
            <div>
               <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">Hidden Hunter</h1>
               <p className="text-cyan-500 text-[9px] font-black uppercase mt-3 tracking-widest">Global Corporate Pulse Node</p>
            </div>
         </div>
      </div>

      <div className="bg-titan-surface border border-slate-800 rounded-[4rem] p-12 shadow-2xl space-y-8 relative overflow-hidden group">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-4">
             <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Industry Sector</label>
             <input type="text" placeholder="e.g. Fintech..." className="w-full bg-black border border-slate-800 rounded-[2.5rem] px-8 py-6 text-white text-lg font-bold outline-none focus:border-cyan-500 transition-all shadow-inner" value={industry} onChange={(e) => setIndustry(e.target.value)} />
          </div>
          <div className="space-y-4">
             <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Geography</label>
             <input type="text" placeholder="Global..." className="w-full bg-black border border-slate-800 rounded-[2.5rem] px-8 py-6 text-white text-lg font-bold outline-none focus:border-cyan-500 transition-all shadow-inner" value={region} onChange={(e) => setRegion(e.target.value)} />
          </div>
          <div className="space-y-4">
             <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Designation</label>
             <input type="text" placeholder="e.g. Lead Analyst..." className="w-full bg-black border border-slate-800 rounded-[2.5rem] px-8 py-6 text-white text-lg font-bold outline-none focus:border-cyan-500 transition-all shadow-inner" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
          </div>
        </div>
        
        <button onClick={handleCompanyScrape} disabled={loading} className="w-full bg-white text-black py-8 rounded-[2.5rem] font-black uppercase text-sm tracking-[0.4em] hover:bg-cyan-600 hover:text-white transition-all shadow-2xl active:scale-[0.98]">
          {loading ? 'Performing Grounded Trace...' : 'Deploy Industry Scan'}
        </button>
      </div>

      {companies.length > 0 && (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-[0.6em] px-2">Grounded Lead Nodes</h3>
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-2 rounded-full flex items-center gap-3">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">VAULT ASSETS SYNCED: Portfolio + Cloud CV</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredCompanies.map((company) => (
              <div key={company.id} className={`p-10 rounded-[4rem] border transition-all flex flex-col justify-between relative group ${company.status === 'SENT' ? 'border-emerald-500 bg-emerald-950/5 shadow-2xl' : 'border-slate-800 bg-titan-surface hover:border-slate-600'}`}>
                {enrichingId === company.id && (
                  <div className="absolute inset-0 bg-cyan-600/20 backdrop-blur-md z-20 rounded-[4rem] flex flex-col items-center justify-center p-10 text-center">
                    <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <p className="text-[11px] font-black text-white uppercase tracking-widest animate-pulse">Establishing Node Link...</p>
                  </div>
                )}
                
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-white text-xl uppercase tracking-tighter truncate max-w-[180px]">{company.name}</h4>
                      <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-1">{company.location}</p>
                    </div>
                    <div className="text-[18px] font-black text-cyan-400 italic">#{company.opportunityScore}</div>
                  </div>

                  <div className="bg-black/60 rounded-[2rem] p-6 border border-slate-900 space-y-4">
                    <div className="space-y-1">
                      <label className="text-[7px] font-black text-slate-700 uppercase tracking-widest ml-2">Decision Maker Node</label>
                      <div className="text-[10px] font-mono text-white bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">{company.hiringManager || 'Tracing...'}</div>
                    </div>
                    <div className={`px-5 py-3 rounded-xl border font-mono text-[9px] truncate ${company.email && !company.email.includes('...') ? 'border-cyan-500/30 text-cyan-400 bg-cyan-500/5' : 'border-slate-800 text-slate-600 bg-black/40'}`}>
                      {company.email}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 px-2">
                     <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Vault Attachments Primed</span>
                  </div>
                </div>

                <div className="mt-8">
                  {!company.email || company.email.includes('...') ? (
                    <button onClick={() => handleDeepScrapeContact(company)} className="w-full py-5 bg-slate-900 text-slate-400 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-slate-800 hover:text-white transition-all">Identify Node Email</button>
                  ) : company.status === 'SENT' ? (
                    <button onClick={() => setViewingPackage(company)} className="w-full py-5 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 rounded-2xl text-[9px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all">Audit Relayed Assets</button>
                  ) : (
                    <button onClick={() => handleRelay(company)} className="w-full py-5 bg-cyan-600 text-white rounded-2xl text-[9px] font-black uppercase hover:bg-white hover:text-black shadow-2xl transition-all active:scale-95">
                      {company.status === 'TAILORING' ? 'Synthesizing Detailed Identity...' : 'Dispatch Specialized Relay'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HiddenHunter;
