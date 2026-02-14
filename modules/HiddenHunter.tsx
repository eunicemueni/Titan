
import React, { useState } from 'react';
import { UserProfile, TelemetryLog, SentRecord, TargetedCompany } from '../types';
import { geminiService } from '../services/geminiService';
import { scrapingService } from '../services/scrapingService';

interface HiddenHunterProps {
  profile: UserProfile;
  onLog: (msg: string, level: TelemetryLog['level']) => void;
  updateStats: (updates: Partial<UserProfile['stats']>) => void;
  onSent: (record: Omit<SentRecord, 'id' | 'timestamp' | 'status'>) => void;
  companies: TargetedCompany[];
  setCompanies: React.Dispatch<React.SetStateAction<TargetedCompany[]>>;
  onBack: () => void;
  targetDailyCap: number;
  evasionStatus: string;
}

const HiddenHunter: React.FC<HiddenHunterProps> = ({ profile, onLog, updateStats, onSent, companies, setCompanies, onBack, targetDailyCap, evasionStatus }) => {
  const [loading, setLoading] = useState(false);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [industry, setIndustry] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [region, setRegion] = useState('Remote Worldwide'); // Shifted to global default
  const [viewingPackage, setViewingPackage] = useState<TargetedCompany | null>(null);
  const [physicalNodes, setPhysicalNodes] = useState<any[]>([]);

  const handleScoutDeployment = async () => {
    if (!industry || loading) return;
    setLoading(true);
    onLog(`UHF_HUNTER: Deploying borderless corporate traces for ${industry}...`, 'info');
    
    try {
      const results = await scrapingService.scoutCorporateTargets(industry, region);
      const formatted = results.map((c: any, i: number) => ({
        ...c,
        id: c.id || `node-${Date.now()}-${i}`,
        status: 'IDLE',
        email: c.email || 'Node Locked',
        customCv: profile.masterCV,
        customPortfolio: profile.portfolioUrl
      }));
      setCompanies(formatted);
      
      onLog(`SPATIAL_SCAN: Mapping global headquarters...`, 'info');
      const mapsNodes = await geminiService.scoutCorporateNodesWithMaps(industry, region);
      setPhysicalNodes(mapsNodes);
      
      onLog(`Mission Success: Captured ${formatted.length} global corporate nodes.`, 'success');
    } catch (err) {
      onLog("Discovery scan interrupted.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async (company: TargetedCompany) => {
    setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, status: 'TAILORING' } : c));
    onLog(`IDENTITY_DNA: Tailoring global pitch for ${company.name}...`, 'info');
    try {
      const pkg = await geminiService.tailorJobPackage(
        jobTitle || industry, 
        company.name, 
        profile, 
        'cold', 
        company.hiringManager || 'Strategic Lead'
      );
      
      const subject = pkg.subject || `Strategic Alignment: ${industry} - ${profile.fullName}`;
      
      const realSent = await geminiService.triggerRealDispatch(company.email, subject, pkg.emailBody, 'COL_OUTREACH');
      
      if (realSent) {
        onLog(`SERVER_RELAY: Global dispatch transmitted.`, "success");
      } else {
        window.open(`mailto:${company.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(pkg.emailBody || '')}`, '_blank');
      }

      const updated = { ...company, tailoredPackage: pkg, status: 'SENT' };
      setCompanies(prev => prev.map(c => c.id === company.id ? updated : c));
      setViewingPackage(updated);
      onSent({ type: 'COL_OUTREACH', recipient: company.name, subject });
      onLog(`RELAY_COMPLETE: Transmitted via identity proxy.`, 'success');
    } catch (err) {
      onLog("Identity synthesis failed.", 'error');
      setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, status: 'READY' } : c));
    }
  };

  const handleDeepEnrich = async (company: TargetedCompany) => {
    setEnrichingId(company.id);
    onLog(`DEEP_TRACE: Identifying decision maker node for ${company.name}...`, 'info');
    try {
      const domain = new URL(company.website.startsWith('http') ? company.website : `https://${company.website}`).hostname.replace('www.', '');
      const result = await geminiService.performDeepEmailScrape(company.name, domain);
      setCompanies(prev => prev.map(c => c.id === company.id ? { 
        ...c, 
        email: result.email !== 'Not Found' ? result.email : c.email,
        hiringManager: result.personName || 'Decision Maker',
        status: 'READY'
      } : c));
      onLog(`NODE_SYNC: Identified contact relay: ${result.email}`, 'success');
    } catch (err) { onLog("Enrichment node timeout.", 'warning'); }
    finally { setEnrichingId(null); }
  };

  if (viewingPackage) {
    return (
      <div className="min-h-screen bg-[#02040a] p-10 md:p-20 animate-in fade-in duration-500">
         <div className="max-w-7xl mx-auto space-y-12">
            <button onClick={() => setViewingPackage(null)} className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
               BACK TO HUNTER HUB
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               <div className="bg-titan-surface border border-cyan-500/20 p-12 rounded-[4rem] shadow-2xl">
                  <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-6">Autonomous Pitch</h3>
                  <div className="text-sm font-serif italic text-slate-300 leading-relaxed whitespace-pre-wrap h-[500px] overflow-y-auto custom-scrollbar">
                     {viewingPackage.tailoredPackage?.emailBody}
                  </div>
               </div>
               <div className="bg-white border border-slate-200 p-12 rounded-[4rem] shadow-2xl">
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6">Tailored CV Overlay</h3>
                  <div className="text-[10px] font-mono text-slate-800 leading-relaxed whitespace-pre-wrap h-[500px] overflow-y-auto custom-scrollbar">
                     {viewingPackage.tailoredPackage?.cv}
                  </div>
               </div>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#02040a] p-10 md:p-20 space-y-20 pb-40 animate-in fade-in">
      <div className="flex justify-between items-center">
         <button onClick={onBack} className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
            BACK TO COMMAND
         </button>
         <div className="text-right">
            <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
              Hidden Hunter
            </h1>
            <p className="text-cyan-500 text-[9px] font-black uppercase mt-3 tracking-widest">
              EVASION: {evasionStatus} | GEOGRAPHY: BORDERLESS
            </p>
         </div>
      </div>

      <div className="bg-titan-surface border border-slate-800 rounded-[4rem] p-12 shadow-2xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <input type="text" placeholder="Industry Sector..." className="bg-black border border-slate-800 rounded-[2.5rem] px-8 py-6 text-white text-lg font-bold outline-none focus:border-cyan-500 transition-all shadow-inner" value={industry} onChange={(e) => setIndustry(e.target.value)} />
          <input type="text" placeholder="Remote Worldwide" className="bg-black border border-slate-800 rounded-[2.5rem] px-8 py-6 text-white text-lg font-bold outline-none focus:border-cyan-500 transition-all shadow-inner" value={region} onChange={(e) => setRegion(e.target.value)} />
          <input type="text" placeholder="Target Role..." className="bg-black border border-slate-800 rounded-[2.5rem] px-8 py-6 text-white text-lg font-bold outline-none focus:border-cyan-500 transition-all shadow-inner" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
        </div>
        <button onClick={handleScoutDeployment} disabled={loading || !industry} className="w-full bg-white text-black py-8 rounded-[2.5rem] font-black uppercase text-sm tracking-[0.4em] hover:bg-cyan-600 hover:text-white transition-all shadow-2xl active:scale-95">
          {loading ? 'Performing Global UHF Trace...' : `Deploy High-Velocity Corporate Scan`}
        </button>
      </div>

      {physicalNodes.length > 0 && (
        <section className="space-y-6">
           <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] flex items-center gap-4">
              <span className="w-10 h-1px bg-slate-800"></span>
              Physical Node Discovery (Global Maps)
           </h3>
           <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6">
              {physicalNodes.map((node, i) => (
                <a key={i} href={node.uri} target="_blank" className="flex-none w-64 bg-slate-900 border border-white/5 p-6 rounded-3xl hover:border-indigo-500/50 transition-all group">
                   <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      </div>
                      <span className="text-[10px] font-black text-white uppercase truncate tracking-tight">{node.name}</span>
                   </div>
                   <p className="text-[8px] text-slate-600 uppercase font-black truncate">{node.address}</p>
                </a>
              ))}
           </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {companies.map((company) => (
          <div key={company.id} className={`p-10 rounded-[4rem] border transition-all flex flex-col justify-between relative group ${company.status === 'SENT' ? 'border-emerald-500 bg-emerald-950/5' : 'border-slate-800 bg-titan-surface hover:border-slate-600'}`}>
            {enrichingId === company.id && (
               <div className="absolute inset-0 bg-cyan-600/20 backdrop-blur-md z-20 rounded-[4rem] flex flex-col items-center justify-center p-10 text-center">
                  <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest animate-pulse">Synchronizing Node Link...</p>
               </div>
            )}
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-black text-white text-xl uppercase tracking-tighter truncate max-w-[200px]">{company.name}</h4>
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-1">UHF_TARGET_IDENTIFIED</p>
                </div>
                <div className="text-[18px] font-black text-cyan-400 italic">#{company.opportunityScore}</div>
              </div>
              <div className="bg-black/60 rounded-[2rem] p-6 border border-slate-900 space-y-4">
                <p className="text-[10px] font-mono text-slate-400 truncate">{company.website}</p>
                <div className={`px-5 py-3 rounded-xl border font-mono text-[9px] truncate ${company.email !== 'Node Locked' ? 'border-cyan-500/30 text-cyan-400 bg-cyan-500/5' : 'border-slate-800 text-slate-700 bg-black/40'}`}>
                  {company.email}
                </div>
              </div>
            </div>
            <div className="mt-8">
              {company.email === 'Node Locked' ? (
                <button onClick={() => handleDeepEnrich(company)} className="w-full py-5 bg-slate-900 text-slate-400 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-slate-800 hover:text-white transition-all">Enrich Lead Node</button>
              ) : company.status === 'SENT' ? (
                <button onClick={() => setViewingPackage(company)} className="w-full py-5 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 rounded-2xl text-[9px] font-black uppercase">Audit Relay Assets</button>
              ) : (
                <button onClick={() => handleDispatch(company)} className="w-full py-5 bg-cyan-600 text-white rounded-2xl text-[9px] font-black uppercase hover:bg-white hover:text-black shadow-2xl transition-all">
                  {company.status === 'TAILORING' ? 'MUTATING DNA...' : 'Dispatch UHF Relay'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HiddenHunter;
