
import React, { useState, useMemo } from 'react';
import { UserProfile, TelemetryLog, SentRecord, ClientLead } from '../types';
import { geminiService } from '../services/geminiService';

interface ClientNexusProps {
  profile: UserProfile;
  onLog: (msg: string, level: TelemetryLog['level']) => void;
  onSent: (record: Omit<SentRecord, 'id' | 'timestamp' | 'status'>) => void;
  updateStats: (updates: Partial<UserProfile['stats']>) => void;
  onBack: () => void;
}

const ClientNexus: React.FC<ClientNexusProps> = ({ profile, onLog, onSent, updateStats, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<ClientLead[]>([]);
  const [niche, setNiche] = useState('Content Strategy & Academic Writing');
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [tailoringId, setTailoringId] = useState<string | null>(null);
  const [viewingPitch, setViewingPitch] = useState<{lead: ClientLead, pitch: any} | null>(null);

  const handleGlobalPulse = async () => {
    if (loading) return;
    setLoading(true);
    setLeads([]);
    onLog(`DEPLOYING GLOBAL CLIENT PULSE: Scanning for Agencies & Publications in "${niche}"...`, 'info');
    try {
      const results = await geminiService.scoutClientLeads(niche, profile);
      setLeads(results.map((r: any, i: number) => ({
        ...r,
        id: `client-${Date.now()}-${i}`,
        status: 'IDLE'
      })));
      onLog(`Pulse captured ${results.length} high-intent client nodes.`, 'success');
    } catch (err: any) {
      onLog(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrichLead = async (lead: ClientLead) => {
    setEnrichingId(lead.id);
    onLog(`SCRAPING CONTACT NODE: Searching for Editors/Managers at ${lead.companyName}...`, 'info');
    try {
      const domain = lead.website.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
      const result = await geminiService.performDeepEmailScrape(lead.companyName, domain);
      
      setLeads(prev => prev.map(l => l.id === lead.id ? { 
        ...l, 
        email: result.email !== 'Not Found' ? result.email : undefined,
        status: result.email !== 'Not Found' ? 'ENRICHING' : l.status
      } : l));
      onLog(`Node link established: ${result.email}`, 'success');
    } catch (err: any) {
      onLog(err.message, 'error');
    } finally {
      setEnrichingId(null);
    }
  };

  const handleTailorPitch = async (lead: ClientLead) => {
    setTailoringId(lead.id);
    onLog(`NEURAL TAILORING: Mutating pitch for ${lead.companyName} based on PhD persona...`, 'info');
    try {
      const pkg = await geminiService.tailorClientPitch(lead.companyName, lead.description, profile);
      setViewingPitch({ lead, pitch: pkg });
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'TAILORED' } : l));
    } catch (err: any) {
      onLog(err.message, 'error');
    } finally {
      setTailoringId(null);
    }
  };

  const dispatchPitch = () => {
    if (!viewingPitch) return;
    const { lead, pitch } = viewingPitch;
    const recipient = lead.email || "editor@corporate.com";
    window.open(`mailto:${recipient}?subject=${encodeURIComponent(pitch.subject)}&body=${encodeURIComponent(pitch.body)}`, '_blank');
    
    onSent({
      type: 'CLIENT_PITCH',
      recipient: lead.companyName,
      subject: pitch.subject
    });
    
    updateStats({ coldEmailsSent: profile.stats.coldEmailsSent + 1 });
    onLog(`Pitch dispatched to ${lead.companyName}. Asset transfer recorded.`, 'success');
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'SENT' } : l));
    setViewingPitch(null);
  };

  return (
    <div className="min-h-screen bg-[#02040a] p-10 md:p-20 space-y-20 pb-40">
      <div className="flex justify-between items-center">
         <button onClick={onBack} className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
            BACK TO COMMAND
         </button>
         <div className="text-right">
            <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">Client Nexus</h1>
            <p className="text-indigo-400 text-[9px] font-black uppercase mt-3 tracking-widest animate-pulse">Autopilot Acquisition: READY</p>
         </div>
      </div>

      <div className="bg-titan-surface border border-indigo-500/10 rounded-[4rem] p-16 shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,_rgba(99,102,241,0.03),_transparent_60%)] pointer-events-none"></div>
         <div className="max-w-4xl mx-auto space-y-10 relative z-10 text-center">
            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Strategic Client Discovery</h3>
            <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">TITAN will autonomously hunt for Publications, Marketing Agencies, and Think-Tanks matching your PhD expertise. One-click enrichment and tailoring.</p>
            
            <div className="flex flex-col md:flex-row gap-6">
               <input 
                 type="text" 
                 placeholder="Search Niche (e.g. Fintech Writing, Biotech Research)..." 
                 className="flex-1 bg-black border border-slate-900 rounded-[2.5rem] px-10 py-6 text-white text-lg font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                 value={niche}
                 onChange={(e) => setNiche(e.target.value)}
               />
               <button 
                 onClick={handleGlobalPulse} 
                 disabled={loading || !niche}
                 className="px-12 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.4em] hover:bg-white hover:text-black transition-all shadow-2xl disabled:opacity-20 active:scale-95"
               >
                 {loading ? 'PULSING...' : 'Trigger Global Pulse'}
               </button>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {leads.map(lead => (
          <div key={lead.id} className={`p-10 rounded-[4rem] border transition-all duration-700 flex flex-col justify-between min-h-[520px] group relative ${lead.status === 'SENT' ? 'border-emerald-500 bg-emerald-950/5' : 'border-slate-800 bg-titan-surface hover:border-indigo-500/20 shadow-2xl'}`}>
            {enrichingId === lead.id && (
               <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-md z-20 rounded-[4rem] flex flex-col items-center justify-center p-10 text-center">
                  <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest animate-pulse">Establishing Node Link...</p>
               </div>
            )}
            
            <div>
               <div className="flex justify-between items-start mb-8">
                  <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${lead.type === 'PUBLICATION' ? 'border-purple-500 text-purple-400' : lead.type === 'AGENCY' ? 'border-amber-500 text-amber-400' : 'border-cyan-500 text-cyan-400'}`}>
                    {lead.type}
                  </div>
                  <div className="flex items-baseline gap-1">
                     <span className="text-2xl font-black text-white">{lead.opportunityScore}</span>
                     <span className="text-[8px] font-black text-slate-600 uppercase">SCORE</span>
                  </div>
               </div>
               
               <h4 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-3 group-hover:text-indigo-400 transition-colors">{lead.companyName}</h4>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-8">{lead.website}</p>
               
               <div className="bg-black/40 border border-slate-900 rounded-[2.5rem] p-8 min-h-[160px] flex items-center mb-6">
                  <p className="text-[12px] text-slate-400 italic leading-relaxed font-medium line-clamp-4 group-hover:text-slate-200 transition-colors">"{lead.description}"</p>
               </div>
               
               <div className={`px-5 py-3 rounded-xl border font-mono text-[9px] truncate ${lead.email ? 'border-indigo-500/30 text-indigo-400 bg-indigo-500/5' : 'border-slate-800 text-slate-700 bg-black/40'}`}>
                 {lead.email || 'NODE_OFFLINE'}
               </div>
            </div>

            <div className="mt-8 space-y-3">
               {!lead.email ? (
                 <button onClick={() => handleEnrichLead(lead)} className="w-full py-6 bg-slate-900 text-slate-500 rounded-3xl font-black uppercase text-[10px] tracking-widest border border-slate-800 hover:text-white hover:border-indigo-500 transition-all">Enrich Lead Node</button>
               ) : lead.status === 'SENT' ? (
                 <div className="w-full py-6 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-3xl text-center text-[10px] font-black uppercase tracking-widest">Pitch Dispatched</div>
               ) : (
                 <button 
                  onClick={() => handleTailorPitch(lead)} 
                  disabled={tailoringId === lead.id}
                  className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-black transition-all shadow-xl active:scale-95"
                 >
                   {tailoringId === lead.id ? 'MUTATING PITCH...' : 'Tailor & Review Pitch'}
                 </button>
               )}
            </div>
          </div>
        ))}

        {leads.length === 0 && !loading && (
          <div className="col-span-full py-40 text-center border-2 border-dashed border-slate-900 rounded-[5rem] opacity-20">
             <p className="text-2xl font-black uppercase tracking-[0.5em]">SCANNER_IDLE</p>
             <p className="text-[10px] font-black text-indigo-500 uppercase mt-4 tracking-widest">Deploy a Global Pulse to identify targets</p>
          </div>
        )}
      </div>

      {viewingPitch && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-12 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-300">
           <div className="w-full max-w-5xl bg-white rounded-[5rem] flex flex-col overflow-hidden shadow-2xl relative">
              <div className="px-16 py-12 border-b border-slate-100 flex justify-between items-center bg-white">
                <div>
                   <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Draft: {viewingPitch.lead.companyName}</h3>
                   <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-2">Strategy: {viewingPitch.pitch.contactPersonStrategy}</p>
                </div>
                <button onClick={() => setViewingPitch(null)} className="p-4 text-slate-300 hover:text-slate-900 transition-all">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-16 lg:p-24 bg-slate-50 custom-scrollbar">
                 <div className="max-w-4xl mx-auto space-y-12">
                    <div className="bg-white border border-slate-200 rounded-[3.5rem] p-16 shadow-xl space-y-10">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Protocol</label>
                          <div className="text-xl font-bold text-slate-900 border-l-4 border-indigo-500 pl-6">{viewingPitch.pitch.subject}</div>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pitch Body</label>
                          <div className="text-lg font-serif italic text-slate-700 leading-relaxed whitespace-pre-wrap">
                             {viewingPitch.pitch.body}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-12 bg-white border-t border-slate-100 flex gap-6 justify-center">
                 <button onClick={dispatchPitch} className="bg-slate-900 text-white px-20 py-7 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.4em] hover:bg-indigo-600 transition-all shadow-xl">Confirm & Relay Pitch</button>
                 <button onClick={() => setViewingPitch(null)} className="px-12 py-7 border border-slate-200 text-slate-400 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.4em] hover:text-slate-900 hover:border-slate-900 transition-all">Abort</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ClientNexus;
