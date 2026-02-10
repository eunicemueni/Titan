
import React, { useState, useMemo } from 'react';
import { UserProfile, TelemetryLog, TargetedCompany } from '../types';
import { geminiService } from '../services/geminiService';
import { SERVICE_CATALOG, ServiceBlueprint } from '../constants';

interface EnrichedLead extends TargetedCompany {
  diagnosis?: string;
  deliverable?: string;
  closingScript?: string;
  dnaData?: any;
  transactionId?: string;
  isSold?: boolean;
  opportunityValue: number;
}

const MarketNexus: React.FC<{ 
  profile: UserProfile; 
  onLog: (msg: string, level: TelemetryLog['level']) => void; 
  onSent: (r: any) => void;
  updateStats: (updates: Partial<UserProfile['stats']>) => void;
  onBack: () => void;
}> = ({ profile, onLog, onSent, updateStats, onBack }) => {
  const [activeTab, setActiveTab] = useState<'SCOUT' | 'PIPELINE' | 'CATALOG'>('SCOUT');
  const [scouting, setScouting] = useState(false);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [leads, setLeads] = useState<EnrichedLead[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceBlueprint | null>(SERVICE_CATALOG[0]);
  const [dispatchingLead, setDispatchingLead] = useState<EnrichedLead | null>(null);
  const [previewingPitch, setPreviewingPitch] = useState<{lead: EnrichedLead, pitch: any, visionUrl?: string} | null>(null);
  const [visualizing, setVisualizing] = useState(false);
  
  const [searchIndustry, setSearchIndustry] = useState('');
  const [searchLocation, setSearchLocation] = useState('Global');
  
  const pipelineStats = useMemo(() => {
    const totalValue = leads.reduce((sum, l) => sum + (l.isSold ? 0 : (selectedService?.price || 0)), 0);
    const realizedValue = leads.reduce((sum, l) => sum + (l.isSold ? (selectedService?.price || 0) : 0), 0);
    return { totalValue, realizedValue };
  }, [leads, selectedService]);

  const scoutTargets = async () => {
    if (!searchIndustry || scouting) return;
    setScouting(true);
    onLog(`SCOUTING TARGET NODES: Mapping high-deficit corporations in ${searchIndustry}...`, 'info');
    try {
      const found = await geminiService.scoutNexusLeads(searchIndustry, searchLocation);
      const newLeads: EnrichedLead[] = found.map((f: any, i: number) => ({
        id: `scout-${Date.now()}-${i}`,
        name: f.name,
        website: f.website,
        email: f.email || 'Not Found',
        location: searchLocation,
        hiringContext: f.hiringContext || "Targeted via Lead Scout Node",
        status: 'IDLE',
        opportunityValue: selectedService?.price || 399
      }));
      setLeads([...newLeads, ...leads]);
      setActiveTab('PIPELINE');
      onLog(`Located ${found.length} corporate nodes for strategic positioning.`, 'success');
    } catch (err: any) {
      onLog(err.message, 'error');
    } finally {
      setScouting(false);
    }
  };

  const handleEnrichLead = async (lead: EnrichedLead) => {
    setEnrichingId(lead.id);
    onLog(`DEEP ENRICHMENT: Locating Decision Nodes at ${lead.name}...`, 'info');
    try {
      const domain = lead.website.replace('https://', '').replace('http://', '').split('/')[0];
      const result = await geminiService.performDeepEmailScrape(lead.name, domain);
      
      setLeads(prev => prev.map(l => l.id === lead.id ? { 
        ...l, 
        email: result.email !== 'Not Found' ? result.email : l.email,
        status: 'READY' 
      } : l));
      onLog(`Enrichment complete. Node linked: ${result.email}`, 'success');
    } catch (err: any) {
      onLog(err.message, 'error');
    } finally {
      setEnrichingId(null);
    }
  };

  const startDispatch = async (lead: EnrichedLead) => {
    if (!lead.email || lead.email === 'Not Found') {
      onLog("ABORT: No decision node identified.", "error");
      return;
    }
    
    setDispatchingLead(lead);
    onLog(`NEURAL SYNTHESIS: Architecting multi-phase proposal for ${lead.name}...`, 'info');
    
    try {
      const pitch = await geminiService.generateMarketNexusPitch(lead, selectedService, profile);
      setPreviewingPitch({ lead, pitch });
    } catch (err: any) {
      onLog("Pitch synthesis failed.", "error");
    } finally {
      setDispatchingLead(null);
    }
  };

  const generateVisionForPitch = async () => {
    if (!previewingPitch || !selectedService || visualizing) return;
    setVisualizing(true);
    onLog("NEURAL VISION: Rendering board-level asset mockup...", "info");
    const url = await geminiService.generateVision(`${selectedService.name} solution architecture for ${previewingPitch.lead.name}`);
    if (url) {
      setPreviewingPitch(prev => prev ? { ...prev, visionUrl: url } : null);
      onLog("Vision component rendered and attached.", "success");
    }
    setVisualizing(false);
  };

  const confirmAndRelay = () => {
    if (!previewingPitch || !selectedService) return;
    const { lead, pitch } = previewingPitch;
    const subject = pitch.subject || `[BOARD PROPOSAL] ${selectedService.name} for ${lead.name}`;
    const body = pitch.emailBody || `Strategic proposal for ${lead.website}. Assets attached.`;

    window.open(`mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');

    updateStats({
      salesClosed: profile.stats.salesClosed + 1,
      totalRevenue: profile.stats.totalRevenue + selectedService.price
    });

    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'SENT', isSold: true, tailoredPackage: pitch } : l));
    onSent({ type: 'SERVICE_OFFER', recipient: lead.email, subject });
    onLog(`MISSION SUCCESS: Strategic proposal transmitted to ${lead.name}.`, "success");
    setPreviewingPitch(null);
  };

  return (
    <div className="space-y-12 pb-40 px-10 md:px-20 bg-[#02040a]">
      <div className="flex justify-between items-center mb-10 pt-10">
         <button onClick={onBack} className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
            BACK TO COMMAND
         </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter">Market Nexus</h1>
          <div className="flex gap-4 mt-6">
             <button onClick={() => setActiveTab('SCOUT')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'SCOUT' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-500 hover:text-white'}`}>Scout Node</button>
             <button onClick={() => setActiveTab('PIPELINE')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'PIPELINE' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-500 hover:text-white'}`}>Pipeline Hub ({leads.length})</button>
             <button onClick={() => setActiveTab('CATALOG')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'CATALOG' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-500 hover:text-white'}`}>Asset Catalog</button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 bg-slate-950 p-6 rounded-[2.5rem] border border-slate-900 min-w-[320px] shadow-2xl">
           <div className="text-center border-r border-slate-900">
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Pipeline Potential</p>
              <h4 className="text-2xl font-black text-indigo-400">${pipelineStats.totalValue.toLocaleString()}</h4>
           </div>
           <div className="text-center">
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Realized Yield</p>
              <h4 className="text-2xl font-black text-emerald-500">${pipelineStats.realizedValue.toLocaleString()}</h4>
           </div>
        </div>
      </div>

      {activeTab === 'SCOUT' && (
        <div className="animate-in fade-in slide-in-from-bottom-6">
          <div className="bg-slate-950 border border-slate-900 rounded-[4rem] p-12 shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,_rgba(99,102,241,0.05),_transparent_60%)] pointer-events-none group-hover:opacity-100 transition-opacity"></div>
             <div className="max-w-2xl relative z-10">
               <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">Neural Discovery</h3>
               <p className="text-sm text-slate-400 font-medium leading-relaxed mb-10">Identify corporations with operational deficits. TITAN will link to decision-maker nodes and synthesize high-fidelity proposals starting at $399.</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Industry Sector</label>
                    <input type="text" placeholder="e.g. Fintech, Healthcare..." className="w-full bg-black border border-slate-900 rounded-[2rem] px-8 py-5 text-white text-lg font-bold outline-none focus:border-indigo-500 transition-all" value={searchIndustry} onChange={(e) => setSearchIndustry(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Target Region</label>
                    <input type="text" placeholder="Global..." className="w-full bg-black border border-slate-900 rounded-[2rem] px-8 py-5 text-white text-lg font-bold outline-none focus:border-indigo-500 transition-all" value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)} />
                  </div>
               </div>

               <button onClick={scoutTargets} disabled={scouting || !searchIndustry} className="w-full py-8 bg-white text-black rounded-[2.5rem] font-black uppercase text-sm tracking-[0.4em] hover:bg-indigo-600 hover:text-white transition-all shadow-2xl active:scale-[0.98]">
                 {scouting ? 'Synchronizing Cluster Nodes...' : 'Deploy Global Industry Scout'}
               </button>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'PIPELINE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-6">
          {leads.map(lead => (
            <div key={lead.id} className={`p-10 rounded-[4rem] border transition-all duration-700 flex flex-col justify-between min-h-[520px] relative ${
              lead.isSold ? 'border-emerald-500 bg-emerald-950/5 shadow-2xl' : lead.status === 'READY' ? 'border-indigo-500 bg-indigo-950/5' : 'border-slate-800 bg-slate-950 hover:border-slate-600'
            }`}>
              {dispatchingLead?.id === lead.id && (
                <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-md z-30 rounded-[4rem] flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
                  <p className="text-sm font-black text-white uppercase tracking-widest animate-pulse">Architecting Business Case...</p>
                </div>
              )}
              
              <div>
                 <div className="flex justify-between items-start mb-6">
                    <h4 className="font-black text-white text-2xl uppercase tracking-tighter leading-none">{lead.name}</h4>
                    <span className="text-[9px] font-mono text-indigo-400 font-black">MIN VALUATION: $399</span>
                 </div>
                 <div className="bg-black/40 border border-slate-900 p-8 rounded-[2.5rem] min-h-[180px] mb-6 flex items-center">
                    <p className="text-[13px] text-slate-400 italic leading-relaxed font-medium">"{lead.hiringContext}"</p>
                 </div>
                 <div className={`px-4 py-3 rounded-xl border font-mono text-[10px] truncate ${lead.email !== 'Not Found' ? 'border-indigo-500/30 text-indigo-400 bg-indigo-500/5' : 'border-slate-800 text-slate-700 bg-black/40'}`}>
                   {lead.email}
                 </div>
              </div>
              <div className="mt-8 space-y-3">
                 {lead.isSold ? (
                   <button onClick={() => setPreviewingPitch({lead, pitch: lead.tailoredPackage})} className="w-full py-6 border border-emerald-500/20 rounded-3xl text-center text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:bg-emerald-500/10 transition-all">Audit Transmitted Case</button>
                 ) : lead.email === 'Not Found' ? (
                   <button onClick={() => handleEnrichLead(lead)} className="w-full py-6 bg-slate-900 text-slate-400 rounded-3xl font-black uppercase text-[10px] tracking-widest hover:text-white border border-slate-800 transition-all">Trace Decision Node</button>
                 ) : (
                   <button onClick={() => startDispatch(lead)} className="w-full bg-white text-black py-6 rounded-3xl font-black uppercase text-[11px] tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-xl">Architect Board Proposal</button>
                 )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'CATALOG' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 animate-in fade-in slide-in-from-bottom-6">
          {SERVICE_CATALOG.map(service => (
            <div 
              key={service.id}
              onClick={() => setSelectedService(service)}
              className={`p-10 border rounded-[3.5rem] transition-all cursor-pointer flex flex-col justify-between h-[520px] group relative overflow-hidden ${
                selectedService?.id === service.id ? 'border-indigo-500 bg-indigo-950/20 shadow-2xl scale-[1.02]' : 'border-slate-900 bg-slate-950 opacity-60 hover:opacity-100'
              }`}
            >
              <div>
                <div className="text-7xl mb-10 group-hover:scale-110 transition-transform duration-500">{service.icon}</div>
                <h4 className="text-2xl font-black text-white uppercase mb-4 leading-none">{service.name}</h4>
                <p className="text-[12px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed mb-4">{service.description}</p>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pricing Floor</p>
                   <p className="text-xl font-black text-white">${service.price.toLocaleString()}</p>
                </div>
              </div>
              <div className="pt-8 flex justify-end">
                 <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${selectedService?.id === service.id ? 'bg-indigo-500 border-indigo-400 text-white' : 'border-slate-800 text-slate-800'}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7"/></svg>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewingPitch && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="w-full max-w-7xl h-full max-h-[92vh] bg-white rounded-[3rem] flex flex-col overflow-hidden shadow-2xl relative">
            <div className="px-16 py-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
               <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-2xl font-black shadow-lg">B</div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Formal Board-Ready Proposal</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-2">TARGET: {previewingPitch.lead.name} | ASSET: {selectedService?.name}</p>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <button 
                    onClick={generateVisionForPitch}
                    disabled={visualizing}
                    className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                  >
                    {visualizing ? 'Visualizing Architecture...' : 'Neural Vision Scan'}
                  </button>
                  <button onClick={() => setPreviewingPitch(null)} className="p-4 text-slate-300 hover:text-slate-900 transition-all shrink-0">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 custom-scrollbar p-12 lg:p-16">
               <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-7 space-y-12">
                    <div className="bg-white border border-slate-200 shadow-xl p-16 space-y-12 rounded-[2rem]">
                       <div className="space-y-6">
                          <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Executive Case Summary</label>
                          <div className="text-lg font-serif italic text-slate-800 leading-relaxed whitespace-pre-wrap">
                             {previewingPitch.pitch.executiveSummary}
                          </div>
                       </div>
                       
                       <div className="space-y-6 pt-10 border-t border-slate-100">
                          <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Multi-Phase Implementation Roadmap</label>
                          <div className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                             {previewingPitch.pitch.implementationPhases}
                          </div>
                       </div>

                       <div className="space-y-6 pt-10 border-t border-slate-100">
                          <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Value Projection & ROI</label>
                          <div className="text-sm font-bold text-slate-900 leading-relaxed bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                             {previewingPitch.pitch.valueProjection}
                          </div>
                       </div>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-5 space-y-8">
                     <div className="bg-slate-900 border border-white/5 rounded-[2rem] overflow-hidden aspect-video shadow-2xl relative">
                        {previewingPitch.visionUrl ? (
                          <img src={previewingPitch.visionUrl} alt="Vision" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-center p-10 space-y-4">
                             <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-slate-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                             </div>
                             <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">Awaiting Vision Logic</p>
                          </div>
                        )}
                        {visualizing && <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-md flex items-center justify-center animate-pulse text-white font-black uppercase text-[10px] tracking-widest">Rendering_Strategic_Vision</div>}
                     </div>
                     <div className="bg-white border border-slate-200 p-10 rounded-[2rem] space-y-6">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Autonomous Outreach Protocol</h4>
                        <div className="text-[11px] font-mono text-slate-500 leading-relaxed bg-slate-50 p-6 rounded-xl overflow-y-auto max-h-[300px] custom-scrollbar">
                          {previewingPitch.pitch.emailBody}
                        </div>
                        <div className="pt-4 flex flex-col gap-2">
                           <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Attached Assets</p>
                           <div className="text-[9px] font-mono text-indigo-600 flex items-center gap-2">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                              Official Strategic Dossier (CV)
                           </div>
                           <div className="text-[9px] font-mono text-indigo-600 flex items-center gap-2">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                              Integrated Portfolio Node
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="p-10 border-t border-slate-100 flex gap-6 justify-center bg-white shrink-0">
               {previewingPitch.lead.status !== 'SENT' ? (
                 <button onClick={confirmAndRelay} className="bg-slate-900 text-white px-24 py-7 rounded-full font-black uppercase text-[11px] tracking-[0.4em] hover:bg-indigo-600 transition-all shadow-2xl">Execute Board Proposal Relay</button>
               ) : (
                 <div className="text-emerald-600 font-black uppercase tracking-widest text-sm flex items-center gap-4">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                    Proposal Transmitted to Decision Node
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketNexus;
