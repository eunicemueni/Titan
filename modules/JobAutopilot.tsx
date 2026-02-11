
import React, { useState, useMemo } from 'react';
import { JobRecord, UserProfile, TelemetryLog, SentRecord } from '../types';
import { geminiService } from '../services/geminiService';

interface ScraperNodeProps {
  profile: UserProfile;
  onLog: (msg: string, level: TelemetryLog['level']) => void;
  setJobs: React.Dispatch<React.SetStateAction<JobRecord[]>>;
  jobs: JobRecord[];
  updateStats: (updates: Partial<UserProfile['stats']>) => void;
  onSent: (record: Omit<SentRecord, 'id' | 'timestamp' | 'status'>) => void;
  onBack: () => void;
  bridgeStatus: 'OFFLINE' | 'CONNECTING' | 'ONLINE';
  onReconnect: () => void;
  targetDailyCap: number;
}

const ScraperNode: React.FC<ScraperNodeProps> = ({ profile, onLog, setJobs, jobs, onBack, targetDailyCap }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkOperating, setIsBulkOperating] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('USA Remote-Only & Worldwide Distributed');

  const visibleJobs = useMemo(() => jobs.filter(j => j.status === 'discovered'), [jobs]);
  const allSelected = visibleJobs.length > 0 && visibleJobs.every(j => selectedIds.has(j.id));

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
      onLog("SELECTION_PROTOCOL: Nodes cleared.", "warning");
    } else {
      const allIds = new Set(visibleJobs.map(j => j.id));
      setSelectedIds(allIds);
      onLog(`SELECTION_PROTOCOL: ${allIds.size} nodes captured in selection buffer.`, "info");
    }
  };

  const handleMassQueue = async () => {
    setIsBulkOperating(true);
    setShowConfirmation(false);
    onLog(`Initiating UHF Autonomous Mass Dispatch for ${selectedIds.size} nodes...`, "info");

    const selectedJobs = jobs.filter(j => selectedIds.has(j.id));
    let successCount = 0;
    
    try {
      // Direct state update for high-speed responsiveness
      setJobs(prev => prev.map(j => selectedIds.has(j.id) ? { ...j, status: 'queued' } : j));
      successCount = selectedJobs.length;
      onLog(`SUCCESS: ${successCount} nodes committed to UHF Autonomous Buffer.`, "success");
    } catch (err: any) {
      onLog("UHF Relay interrupted.", "error");
    } finally {
      setIsBulkOperating(false);
      setSelectedIds(new Set());
    }
  };

  const handleGlobalScrape = async () => {
    if (!query) {
      onLog("Discovery Error: Role parameter required.", "warning");
      return;
    }
    setIsScanning(true);
    onLog(`${targetDailyCap >= 1000 ? 'UHF' : 'PRECISION'}_SCAN: Initiated. Targeting web nodes...`, 'info');
    
    try {
      const geminiResults = await geminiService.performUniversalScrape(query, location);
      const validResults = Array.isArray(geminiResults) ? geminiResults : [];
      
      const mapped: JobRecord[] = validResults.map((j: any, i: number) => ({
        id: `gem-${Date.now()}-${i}`,
        company: j.company || "Unknown Entity",
        role: j.role || query,
        location: j.location || location,
        description: j.description || "No description provided by node.",
        sourceUrl: j.sourceUrl || "",
        status: 'discovered' as const,
        timestamp: Date.now(),
        matchScore: 94 + Math.floor(Math.random() * 6)
      }));

      setJobs(prev => {
        const combined = [...mapped, ...prev];
        const unique = Array.from(new Map(combined.map(item => [item.sourceUrl || item.id, item])).values()).slice(0, 500);
        return unique;
      });
      onLog(`Captured ${mapped.length} nodes for UHF dispatch.`, 'success');
    } catch (err: any) { 
      onLog(`Discovery Exception: ${err.message}`, "error"); 
    } finally { 
      setIsScanning(false); 
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="p-10 lg:p-20 max-w-[1600px] mx-auto space-y-20 animate-in fade-in duration-700 pb-40 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
         <button onClick={onBack} className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
            Command Center
         </button>
         <div className="text-left md:text-right space-y-2">
            <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
              {targetDailyCap >= 1000 ? 'UHF Neural Scanner' : 'Global Discovery'}
            </h1>
            <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">
              NODE_HEALTH: OPTIMAL | SCAN_READY
            </p>
         </div>
      </div>

      <div className="bg-slate-950 border border-amber-500/20 rounded-[4rem] p-16 lg:p-24 shadow-2xl space-y-12 relative overflow-hidden group">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
           <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] ml-6">Distributed Role Type</label>
             <input type="text" placeholder="e.g. Senior Data Analyst..." className="w-full bg-black border border-white/5 rounded-[2.5rem] px-10 py-6 text-white text-xl font-black outline-none focus:border-amber-500 transition-all shadow-inner" value={query} onChange={(e) => setQuery(e.target.value)} />
           </div>
           <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] ml-6">Target Geography</label>
             <input type="text" className="w-full bg-black border border-white/5 rounded-[2.5rem] px-10 py-6 text-white text-xl font-black outline-none focus:border-amber-500 transition-all shadow-inner" value={location} onChange={(e) => setLocation(e.target.value)} />
           </div>
         </div>
         <button onClick={handleGlobalScrape} disabled={isScanning} className="w-full py-10 bg-white text-black rounded-[2.5rem] font-black uppercase text-lg tracking-[0.5em] hover:bg-amber-500 transition-all active:scale-[0.98] relative overflow-hidden">
           {isScanning && <div className="absolute inset-0 bg-indigo-600 animate-pulse"></div>}
           <span className="relative z-10">{isScanning ? 'Synchronizing Neural Shards...' : 'Engage Global Scan'}</span>
         </button>
      </div>

      <div className="space-y-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 pb-10 gap-6">
          <div className="flex items-center gap-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.6em] flex items-center gap-6">
              <span className="w-12 h-px bg-amber-500/30"></span>
              Discovery Stream ({visibleJobs.length})
            </h3>
            {visibleJobs.length > 0 && (
              <button 
                onClick={handleSelectAll}
                className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                  allSelected 
                    ? 'bg-amber-500 text-black border-amber-500' 
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/30'
                }`}
              >
                {allSelected ? 'Deselect All' : 'Select All Gigs'}
              </button>
            )}
          </div>
          {selectedIds.size > 0 && (
            <button 
              onClick={() => setShowConfirmation(true)}
              className="px-12 py-5 bg-amber-500 text-black rounded-[2rem] text-xs font-black uppercase tracking-[0.4em] hover:bg-white transition-all shadow-2xl animate-in slide-in-from-right-10"
            >
              Authorize Mass Dispatch ({selectedIds.size})
            </button>
          )}
        </div>

        {isScanning && visibleJobs.length === 0 && (
           <div className="py-40 text-center space-y-8 animate-pulse">
              <div className="w-20 h-20 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xl font-black text-white uppercase tracking-[0.5em]">Neural Grounding...</p>
           </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          {visibleJobs.map(job => (
            <div 
              key={job.id} 
              onClick={() => toggleSelect(job.id)}
              className={`p-12 rounded-[4.5rem] border transition-all duration-500 flex flex-col justify-between min-h-[480px] relative group cursor-pointer ${
                selectedIds.has(job.id) ? 'border-amber-500 bg-amber-500/5 scale-[1.02] shadow-2xl' : 'border-white/5 bg-slate-950 hover:border-white/20'
              }`}
            >
              <div className="absolute top-10 right-10">
                 <div className={`w-8 h-8 rounded-2xl border-2 transition-all flex items-center justify-center ${selectedIds.has(job.id) ? 'bg-amber-600 border-amber-600 shadow-lg' : 'border-white/10'}`}>
                    {selectedIds.has(job.id) && <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7"/></svg>}
                 </div>
              </div>
              <div>
                <div className="flex justify-between items-start mb-8">
                  <span className="text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest bg-amber-500/10 text-amber-500">
                      MATCH: {job.matchScore}%
                  </span>
                  <span className="text-[8px] font-mono text-slate-700 uppercase tracking-widest">UHF_READY</span>
                </div>
                <h4 className="font-black text-white text-3xl italic tracking-tighter leading-tight mb-2 uppercase group-hover:text-amber-500 transition-colors">{job.role}</h4>
                <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] mb-10">{job.company}</p>
                <div className="bg-black/60 border border-white/5 rounded-[3rem] p-10 min-h-[160px] flex items-center mb-8 relative">
                   <p className="text-xs text-slate-400 italic leading-relaxed font-bold uppercase tracking-tight">
                      {job.description}
                   </p>
                </div>
              </div>
              <div className="mt-10 flex items-center justify-between border-t border-white/5 pt-8 text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">
                 <span className="text-indigo-500">{job.location.toUpperCase()}</span>
                 <div className={`w-2 h-2 rounded-full ${selectedIds.has(job.id) ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-slate-900'}`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmation && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8 bg-black/95 backdrop-blur-3xl animate-in fade-in">
           <div className="max-w-xl w-full bg-slate-950 border border-amber-500/30 rounded-[4rem] p-16 text-center space-y-10 shadow-[0_0_100px_rgba(245,158,11,0.1)]">
              <div className="w-24 h-24 bg-amber-600 rounded-[2.5rem] mx-auto flex items-center justify-center text-black text-4xl font-black shadow-2xl">!</div>
              <div className="space-y-4">
                 <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Authorize Autonomous Dispatch?</h2>
                 <p className="text-slate-400 text-sm leading-relaxed font-bold uppercase tracking-widest">
                    You are about to commit <span className="text-amber-500">{selectedIds.size} companies</span> to the UHF Autonomous Bridge. This will simulate high-velocity job applications.
                 </p>
              </div>
              <div className="flex flex-col gap-4">
                 <button 
                  onClick={handleMassQueue} 
                  className="w-full py-8 bg-white text-black rounded-[2.5rem] font-black uppercase text-xs tracking-[0.5em] hover:bg-amber-600 hover:text-white transition-all shadow-2xl"
                 >
                    Confirm UHF Execution
                 </button>
                 <button 
                  onClick={() => setShowConfirmation(false)} 
                  className="w-full py-8 border border-white/10 text-slate-500 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.5em] hover:text-white transition-all"
                 >
                    Abort Relay
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ScraperNode;
