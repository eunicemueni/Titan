
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
  const [activeTab, setActiveTab] = useState<'SCOUT' | 'PIPELINE' | 'CATALOG'>('CATALOG');
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
    onLog(`SCOUTING CORPORATE NODES: Mapping high-valuation candidates in ${searchIndustry}...`, 'info');
    try {
      const found = await geminiService.scoutNexusLeads(searchIndustry, searchLocation);
      const newLeads: EnrichedLead[] = found.map((f: any, i: number) => ({
        id: `scout-${Date.now()}-${i}`,
        name: f.name,
        website: f.website,
        email: f.email || 'Not Found',
        location: searchLocation,
        hiringContext: f.hiringContext || "Identified via Operational Deficit Audit",
        status: 'IDLE',
        opportunityValue: selectedService?.price || 99
      }));
      setLeads([...newLeads, ...leads]);
      setActiveTab('PIPELINE');
      onLog(`Captured ${found.length} corporate entities for Neural Asset acquisition.`, 'success');
    } catch (err: any) {
      onLog(err.message, 'error');
    } finally {
      setScouting(false);
    }
  };

  const handleEnrichLead = async (lead: EnrichedLead) => {
    setEnrichingId(lead.id);
    onLog(`DEEP TRACE: Scraping decision-maker nodes at ${lead.name}...`, 'info');
    try {
      const domain = lead.website.replace('https://', '').replace('http://', '').split('/')[0];
      const result = await geminiService.performDeepEmailScrape(lead.name, domain);
      
      setLeads(prev => prev.map(l => l.id === lead.id ? { 
        ...l, 
        email: result.email !== 'Not Found' ? result.email : l.email,
        status: 'READY' 
      } : l));
      onLog(`Node Synchronized. Target Relay: ${result.email}`, 'success');
    } catch (err: any) {
      onLog(err.message, 'error');
    } finally {
      setEnrichingId(null);
    }
  };

  const startDispatch = async (lead: EnrichedLead) => {
    if (!lead.email || lead.email === 'Not Found') {
      onLog("ERROR: Decision relay node not found. Enrich required.", "error");
      return;
    }
    
    setDispatchingLead(lead);
    onLog(`NEURAL SYNTHESIS: Architecting ${selectedService?.name} proposal for ${lead.name}...`, 'info');
    
    try {
      const pitch = await geminiService.generateMarketNexusPitch(lead, selectedService, profile);
      setPreviewingPitch({ lead, pitch });
    } catch (err: any) {
      onLog("Proposal synthesis failed.", "error");
    } finally {
      setDispatchingLead(null);
    }
  };

  const generateVisionForPitch = async () => {
    if (!previewingPitch || !selectedService || visualizing) return;
    setVisualizing(true);
    onLog("RENDERING BLUEPRINT: Generating strategic vision asset...", "info");
    const url = await geminiService.generateVision(`Detailed technical blueprint for ${selectedService.name} implementation at ${previewingPitch.lead.name}. Corporate black aesthetic, futuristic architecture schematic.`);
    if (url) {
      setPreviewingPitch(prev => prev ? { ...prev, visionUrl: url } : null);
      onLog("Vision asset rendered and embedded into proposal.", "success");
    }
    setVisualizing(false);
  };

  const confirmAndRelay = () => {
    if (!previewingPitch || !selectedService) return;
    const { lead, pitch } = previewingPitch;
    const subject = pitch.subject || `[CONFIDENTIAL] Strategic Asset Implementation: ${selectedService.name}`;
    const body = pitch.emailBody || `Attention Leadership: Analysis of ${lead.name} has revealed a critical deficit. Proposed solution attached.`;

    window.open(`mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');

    updateStats({
      salesClosed: profile.stats.salesClosed + 1,
      totalRevenue: profile.stats.totalRevenue + selectedService.price
    });

    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'SENT', isSold: true, tailoredPackage: pitch } : l));
    onSent({ type: 'SERVICE_OFFER', recipient: lead.email, subject });
    onLog(`PROPOSAL TRANSMITTED: Digital Twin proposal sent to ${lead.name}.`, "success");
    setPreviewingPitch(null);
  };

  return (
    <div className="space-y-12 pb-40 px-10 md:px-20 bg-[#02040a] animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-10 pt-10">
         <button onClick={onBack} className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all group">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
            Command Center
         </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-6">
          <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none">Market Nexus</h1>
          <div className="flex gap-4">
             <button onClick={() => setActiveTab('CATALOG')} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'CATALOG' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-900 text-slate-500 hover:text-white'}`}>Asset Catalog</button>
             <button onClick={() => setActiveTab('SCOUT')} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'SCOUT' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900 text-slate-500 hover:text-white'}`}>Scout Node</button>
             <button onClick={() => setActiveTab('PIPELINE')} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'PIPELINE' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-slate-900 text-slate-500 hover:text-white'}`}>Pipeline ({leads.length})</button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 bg-slate-950 p-6 rounded-[2.5rem] border border-white/5 min-w-[320px] shadow-2xl">
           <div className="text-center border-r border-white/5 px-4">
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Potential Yield</p>
              <h4 className="text-3xl font-black text-indigo-400">${pipelineStats.totalValue.toLocaleString()}</h4>
           </div>
           <div className="text-center px-4">
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Closed Gain</p>
              <h4 className="text-3xl font-black text-emerald-500">${pipelineStats.realizedValue.toLocaleString()}</h4>
           </div>
        </div>
      </div>

      {activeTab === 'CATALOG' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 animate-in fade-in slide-in-from-bottom-10">
          {SERVICE_CATALOG.map(service => (
            <div 
              key={service.id}
              onClick={() => setSelectedService(service)}
              className={`p-10 border rounded-[4rem] transition-all cursor-pointer flex flex-col justify-between h-[580px] group relative overflow-hidden ${
                selectedService?.id === service.id ? 'border-indigo-500 bg-indigo-950/20 shadow-2xl scale-[1.02]' : 'border-white/5 bg-slate-950 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] pointer-events-none group-hover:bg-indigo-500/10 transition-all"></div>
              <div>
                <div className="text-8xl mb-12 group-hover:scale-110 transition-transform duration-700">{service.icon}</div>
                <h4 className="text-3xl font-black text-white uppercase mb-6 leading-none italic tracking-tighter">{service.name}</h4>
                <p className="text-[13px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed mb-8">{service.description}</p>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 shadow-inner">
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Price Point</p>
                   <p className="text-3xl font-black text-white">${service.price.toLocaleString()}</p>
                </div>
              </div>
              <div className="pt-8 flex justify-end">
                 <div className={`w-12 h-12 rounded-[1.5rem] border flex items-center justify-center transition-all ${selectedService?.id === service.id ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg' : 'border-slate-800 text-slate-800'}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7"/></svg>
                 </div>
              </div>
            </div>
          ))}
          <div className="col-span-full mt-10 p-12 bg-indigo-500/5 border border-indigo-500/10 rounded-[3rem] text-center">
             <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Neural Strategy: Optimized for high-velocity "Procurement Bypass" conversion.</p>
          </div>
        </div>
      )}

      {activeTab === 'SCOUT' && (
        <div className="animate-in fade-in slide-in-from-bottom-10 duration-500">
          <div className="bg-slate-950 border border-indigo-500/20 rounded-[4rem] p-16 lg:p-24 shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,_rgba(99,102,241,0.05),_transparent_60%)] pointer-events-none group-hover:opacity-100 transition-opacity"></div>
             <div className="max-w-3xl relative z-10 space-y-12">
               <div className="space-y-4">
                 <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">Autonomous Corporate Scouting</h3>
                 <p className="text-lg text-slate-400 font-medium leading-relaxed">TITAN will map corporations diagnosing operational logic gaps where a {selectedService?.name} would generate massive ROI.</p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-6">Target Industry</label>
                    <input type="text" placeholder="e.g. Insurance, Logistics..." className="w-full bg-black border border-white/5 rounded-[2.5rem] px-10 py-6 text-white text-xl font-black outline-none focus:border-indigo-500 transition-all shadow-inner" value={searchIndustry} onChange={(e) => setSearchIndustry(e.target.value)} />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-6">Target Geography</label>
                    <input type="text" placeholder="Global..." className="w-full bg-black border border-white/5 rounded-[2.5rem] px-10 py-6 text-white text-xl font-black outline-none focus:border-indigo-500 transition-all shadow-inner" value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)} />
                  </div>
               </div>

               <button onClick={scoutTargets} disabled={scouting || !searchIndustry} className="w-full py-10 bg-white text-black rounded-[2.5rem] font-black uppercase text-sm tracking-[0.5em] hover:bg-indigo-600 hover:text-white transition-all shadow-2xl active:scale-[0.98]">
                 {scouting ? 'Synchronizing Cluster Nodes...' : `Identify Leads for ${selectedService?.name}`}
               </button>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'PIPELINE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-10">
          {leads.map(lead => (
            <div key={lead.id} className={`p-12 rounded-[4.5rem] border transition-all duration-700 flex flex-col justify-between min-h-[580px] relative overflow-hidden group ${
              lead.isSold ? 'border-emerald-500 bg-emerald-950/5 shadow-2xl' : lead.status === 'READY' ? 'border-indigo-500 bg-indigo-950/5' : 'border-white/5 bg-slate-950 hover:border-white/20'
            }`}>
              {dispatchingLead?.id === lead.id && (
                <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-xl z-30 rounded-[4.5rem] flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-20 h-20 border-4 border-white/20 border-t-white rounded-full animate-spin mb-6"></div>
                  <p className="text-lg font-black text-white uppercase tracking-widest animate-pulse">Modeling Business Logic...</p>
                </div>
              )}
              
              <div>
                 <div className="flex justify-between items-start mb-8">
                    <h4 className="font-black text-white text-3xl uppercase tracking-tighter leading-none pr-8 group-hover:text-indigo-400 transition-colors">{lead.name}</h4>
                    <span className="text-[10px] font-mono text-indigo-500 font-black tracking-widest">MIN_ROI: $12.5K</span>
                 </div>
                 <div className="bg-black/60 border border-white/5 p-10 rounded-[3rem] min-h-[200px] mb-8 flex items-center shadow-inner">
                    <p className="text-[14px] text-slate-500 italic leading-relaxed font-bold uppercase tracking-tight">"{lead.hiringContext}"</p>
                 </div>
                 <div className={`px-6 py-4 rounded-2xl border font-mono text-[11px] truncate shadow-sm transition-all ${lead.email !== 'Not Found' ? 'border-indigo-500/30 text-indigo-400 bg-indigo-500/5' : 'border-white/5 text-slate-800 bg-black/40'}`}>
                   {lead.email}
                 </div>
              </div>
              <div className="mt-12 space-y-4">
                 {lead.isSold ? (
                   <button onClick={() => setPreviewingPitch({lead, pitch: lead.tailoredPackage})} className="w-full py-7 border border-emerald-500/20 rounded-[2rem] text-center text-[11px] font-black text-emerald-500 uppercase tracking-widest hover:bg-emerald-500/10 transition-all">Audit Transmitted Proposal</button>
                 ) : lead.email === 'Not Found' ? (
                   <button onClick={() => handleEnrichLead(lead)} className="w-full py-7 bg-slate-900 text-slate-500 rounded-[2rem] font-black uppercase text-[11px] tracking-widest hover:text-white border border-white/5 transition-all">Identify Decision Maker</button>
                 ) : (
                   <button onClick={() => startDispatch(lead)} className="w-full bg-white text-black py-7 rounded-[2rem] font-black uppercase text-[11px] tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-2xl active:scale-[0.98]">
                    Synthesize {selectedService?.name} Proposal
                   </button>
                 )}
              </div>
            </div>
          ))}
          {leads.length === 0 && (
             <div className="col-span-full py-40 text-center border-2 border-dashed border-white/5 rounded-[5rem] opacity-20">
                <p className="text-3xl font-black uppercase tracking-[0.5em]">PIPELINE_EMPTY</p>
                <p className="text-[12px] font-black text-indigo-500 uppercase mt-4 tracking-widest">Run the scout node to identify corporate deficits</p>
             </div>
          )}
        </div>
      )}

      {previewingPitch && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="w-full max-w-7xl h-full max-h-[92vh] bg-white rounded-[4rem] flex flex-col overflow-hidden shadow-2xl relative">
            <div className="px-16 py-10 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
               <div className="flex items-center gap-8">
                  <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-lg">✓</div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Formal Board-Ready Proposal</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-2">CLIENT: {previewingPitch.lead.name} | ASSET_DNA: {selectedService?.name}</p>
                  </div>
               </div>
               <div className="flex items-center gap-6">
                  <button 
                    onClick={generateVisionForPitch}
                    disabled={visualizing}
                    className="px-8 py-4 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                  >
                    {visualizing ? 'Processing Neural Vision...' : 'Render Vision Asset'}
                  </button>
                  <button onClick={() => setPreviewingPitch(null)} className="p-4 text-slate-300 hover:text-slate-900 transition-all shrink-0">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 custom-scrollbar p-12 lg:p-20">
               <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
                  <div className="lg:col-span-7 space-y-16">
                    <div className="bg-white border border-slate-200 shadow-2xl p-16 space-y-16 rounded-[3rem]">
                       <div className="space-y-6">
                          <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Executive Implementation Case</label>
                          <div className="text-xl font-serif italic text-slate-800 leading-relaxed whitespace-pre-wrap">
                             {previewingPitch.pitch.executiveSummary}
                          </div>
                       </div>
                       
                       <div className="space-y-6 pt-12 border-t border-slate-100">
                          <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Digital Implementation Phases</label>
                          <div className="text-sm font-bold text-slate-700 leading-relaxed whitespace-pre-wrap uppercase tracking-tight">
                             {previewingPitch.pitch.implementationPhases}
                          </div>
                       </div>

                       <div className="space-y-6 pt-12 border-t border-slate-100">
                          <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">ROI & Scalability Projection</label>
                          <div className="text-base font-bold text-emerald-900 leading-relaxed bg-emerald-50 p-10 rounded-[2rem] border border-emerald-100 shadow-inner">
                             {previewingPitch.pitch.valueProjection}
                          </div>
                       </div>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-5 space-y-10">
                     <div className="bg-slate-900 border border-white/5 rounded-[3rem] overflow-hidden aspect-video shadow-[0_30px_60px_rgba(0,0,0,0.3)] relative group">
                        {previewingPitch.visionUrl ? (
                          <img src={previewingPitch.visionUrl} alt="Vision" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
                             <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-slate-600 animate-pulse">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                             </div>
                             <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em]">Awaiting Vision Render</p>
                          </div>
                        )}
                        {visualizing && <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-xl flex items-center justify-center animate-pulse text-white font-black uppercase text-[12px] tracking-widest">Rendering_Strategic_Vision</div>}
                     </div>
                     <div className="bg-white border border-slate-200 p-12 rounded-[3rem] shadow-xl space-y-8">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transmission Protocol Draft</h4>
                        <div className="text-[12px] font-mono text-slate-600 leading-relaxed bg-slate-50 p-8 rounded-2xl overflow-y-auto max-h-[400px] custom-scrollbar border border-slate-100 italic">
                          {previewingPitch.pitch.emailBody}
                        </div>
                        <div className="pt-6 flex flex-col gap-3">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Attached Identity Blocks</p>
                           <div className="text-[10px] font-mono text-indigo-600 flex items-center gap-3">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 105.656 5.656l1.1-1.1" /></svg>
                              Personnel Master Dossier (Encrypted PDF)
                           </div>
                           <div className="text-[10px] font-mono text-indigo-600 flex items-center gap-3">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 105.656 5.656l1.1-1.1" /></svg>
                              Integrated Global Portfolio Node
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="p-12 border-t border-slate-100 flex gap-8 justify-center bg-white shrink-0">
               {previewingPitch.lead.status !== 'SENT' ? (
                 <button onClick={confirmAndRelay} className="bg-slate-900 text-white px-32 py-8 rounded-full font-black uppercase text-[12px] tracking-[0.5em] hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-500/10 active:scale-95">Deploy Board Proposal Relay</button>
               ) : (
                 <div className="text-emerald-600 font-black uppercase tracking-widest text-base flex items-center gap-6 py-4">
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7"/></svg>
                    </div>
                    Mission Success: Proposal Linked to Decision Node
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
