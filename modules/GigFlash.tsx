
import React, { useState, useEffect } from 'react';
import { UserProfile, TelemetryLog, SentRecord } from '../types';
import { geminiService } from '../services/geminiService';

interface FlashGig {
  title: string;
  platform: string;
  budget: string;
  posted: string;
  description: string;
  applyUrl: string;
}

interface GigFlashProps {
  profile: UserProfile;
  onLog: (msg: string, level: TelemetryLog['level']) => void;
  onSent: (r: any) => void;
  onBack: () => void;
  autoGigs?: FlashGig[];
  setAutoGigs?: React.Dispatch<React.SetStateAction<FlashGig[]>>;
  isAutopilot?: boolean;
}

const GigFlash: React.FC<GigFlashProps> = ({ profile, onLog, onSent, onBack, autoGigs = [], setAutoGigs, isAutopilot }) => {
  const [loading, setLoading] = useState(false);
  const [activeBid, setActiveBid] = useState<{gig: FlashGig, pitch: string} | null>(null);

  const handleScoutGigs = async () => {
    if (loading) return;
    setLoading(true);
    onLog(`DEPLOYING UNIVERSAL PULSE: Scraping global freelance hubs...`, 'info');
    try {
      const results = await geminiService.scoutFlashGigs(profile);
      if (setAutoGigs) {
        setAutoGigs(results);
      }
      onLog(`Located ${results.length} matching freelance nodes.`, 'success');
    } catch (err: any) {
      onLog("Pulse interrupted.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const prepareFlashBid = async (gig: FlashGig) => {
    onLog(`NEURAL TAILORING: Mutating proposal hook for ${gig.platform}...`, 'info');
    try {
      const pitch = await geminiService.processConsoleCommand(
        `Generate a professional 4-sentence proposal hook for: "${gig.title}". 
         Highlight link: ${profile.portfolioUrl}. Persona: ${profile.fullName}.`, 
        profile
      );
      setActiveBid({ gig, pitch });
    } catch (err: any) {
      onLog("Tailoring failed.", "error");
    }
  };

  const dispatchBid = () => {
    if (!activeBid) return;
    window.open(activeBid.gig.applyUrl, '_blank');
    onSent({
      type: 'FLASH_BID',
      recipient: activeBid.gig.platform,
      subject: `Bid: ${activeBid.gig.title}`,
      body: activeBid.pitch // Capturing content for the Ledger
    });
    onLog(`Dispatched. Portfolio link committed to relay.`, 'success');
    setActiveBid(null);
  };

  const isJustPosted = (postedStr: string) => {
    const s = (postedStr || '').toLowerCase();
    return s.includes('now') || s.includes('min') || s.includes('just') || s.includes('h');
  };

  if (activeBid) {
    return (
      <div className="min-h-screen bg-[#02040a] p-10 md:p-20 animate-in fade-in slide-in-from-right-10 duration-500">
        <div className="max-w-5xl mx-auto space-y-12">
           <div className="flex justify-between items-center">
              <button onClick={() => setActiveBid(null)} className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
                 BACK TO FEED
              </button>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">DISPATCH AUDIT</h2>
           </div>

           <div className="bg-titan-surface border border-amber-500/20 rounded-[4rem] p-12 lg:p-20 shadow-2xl flex flex-col relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-center gap-10 mb-16">
                <div className="w-24 h-24 bg-amber-500 rounded-[2.5rem] flex items-center justify-center text-black text-4xl font-black shadow-2xl">⚡</div>
                <div className="text-center md:text-left">
                   <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">{activeBid.gig.title}</h3>
                   <p className="text-amber-500 text-[11px] font-black uppercase mt-3 tracking-widest">BUDGET: {activeBid.gig.budget}</p>
                </div>
              </div>

              <div className="bg-black/60 border border-slate-900 rounded-[3.5rem] p-10 flex flex-col mb-16">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-10">Neural Bid Draft</h4>
                 <p className="text-2xl font-bold text-slate-100 leading-relaxed italic border-l-4 border-amber-500 pl-10">
                    "{activeBid.pitch}"
                 </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <button onClick={dispatchBid} className="w-full py-8 bg-white text-black rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] hover:bg-amber-500 hover:text-white transition-all shadow-2xl">
                  Execute Direct Relay
                </button>
                <button onClick={() => setActiveBid(null)} className="w-full py-8 border border-slate-800 text-slate-600 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] hover:text-white transition-all">Abort</button>
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
         <div className="text-right">
            <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">Flash Jobs</h1>
            <p className="text-amber-500 text-[9px] font-black uppercase mt-3 tracking-widest animate-pulse">
              {isAutopilot ? 'AUTOPILOT_RELAY: ACTIVE' : 'UNIVERSAL FEED: STANDBY'}
            </p>
         </div>
      </div>

      <div className="bg-titan-surface border border-slate-900 rounded-[4rem] p-16 shadow-2xl relative overflow-hidden group text-center">
         <div className="max-w-4xl mx-auto relative z-10 space-y-8">
           <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Gig Pulse Discovery</h3>
           <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
             {isAutopilot 
               ? "TITAN is currently pulsing global freelance hubs in the background. Fresh gigs will appear below automatically." 
               : "Scrape global freelance hubs for all projects matching your expertise."}
           </p>
           
           {!isAutopilot && (
             <button 
               onClick={handleScoutGigs} 
               disabled={loading}
               className="w-full py-8 bg-amber-500 text-black rounded-[2.5rem] font-black uppercase text-sm tracking-[0.4em] hover:bg-white transition-all shadow-2xl"
             >
               {loading ? 'SYNCHRONIZING...' : 'Trigger Manual Pulse'}
             </button>
           )}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {(autoGigs || []).map((gig, i) => (
          <div key={i} className={`p-10 rounded-[4rem] border transition-all duration-500 flex flex-col justify-between min-h-[540px] group relative overflow-hidden ${isJustPosted(gig.posted) ? 'border-amber-500/40 bg-amber-950/5 shadow-2xl' : 'border-slate-800 bg-titan-surface hover:border-amber-500/20'}`}>
             <div>
                <div className="flex justify-between items-start mb-8">
                   <div className="px-5 py-2 bg-black/60 border border-slate-800 text-[9px] font-black text-slate-400 rounded-full uppercase tracking-widest">{gig.posted || 'Recent'}</div>
                   <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{gig.platform}</span>
                </div>
                <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-4 leading-none group-hover:text-amber-400 transition-colors">{gig.title}</h4>
                <div className="flex items-baseline gap-2 mb-8">
                   <span className="text-4xl font-black text-white">{gig.budget}</span>
                </div>
                <div className="bg-black/40 border border-slate-900 rounded-[3rem] p-8 min-h-[160px] flex items-center">
                   <p className="text-[13px] text-slate-500 italic leading-relaxed font-medium line-clamp-4">"{gig.description}"</p>
                </div>
             </div>
             <div className="mt-10">
                <button onClick={() => prepareFlashBid(gig)} className="w-full py-6 bg-white text-black rounded-3xl font-black uppercase text-[11px] tracking-widest hover:bg-amber-500 hover:text-white transition-all shadow-xl">
                  Generate Immediate Bid
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GigFlash;
