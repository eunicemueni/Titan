
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
  const allSelected = visibleJobs.length > 0 && Array.from(selectedIds).length >= visibleJobs.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
      onLog("SELECTION: Discovery buffer cleared.", "warning");
    } else {
      const allIds = new Set(visibleJobs.map(j => j.id));
      setSelectedIds(allIds);
      onLog(`SELECTION: Captured all ${allIds.size} visible nodes.`, "info");
    }
  };

  const handleMassQueue = async () => {
    setIsBulkOperating(true);
    setShowConfirmation(false);
    onLog(`Initiating UHF Autonomous Dispatch for ${selectedIds.size} nodes...`, "info");
    
    setJobs(prev => prev.map(j => selectedIds.has(j.id) ? { ...j, status: 'queued' } : j));
    onLog(`SUCCESS: ${selectedIds.size} nodes committed to Autonomous Buffer.`, "success");
    
    setIsBulkOperating(false);
    setSelectedIds(new Set());
  };

  const handleGlobalScrape = async () => {
    if (!query) {
      onLog("Discovery Error: Parameter required.", "warning");
      return;
    }
    setIsScanning(true);
    onLog(`SCAN_INIT: Targeting ${query} nodes...`, 'info');
    
    try {
      const results = await geminiService.performUniversalScrape(query, location);
      const mapped: JobRecord[] = results.map((j: any, i: number) => ({
        id: `gem-${Date.now()}-${i}`,
        company: j.company || "Unknown Entity",
        role: j.role || query,
        location: j.location || location,
        description: j.description || "Source data encrypted.",
        sourceUrl: j.sourceUrl || "",
        status: 'discovered' as const,
        timestamp: Date.now(),
        matchScore: 92 + Math.floor(Math.random() * 8)
      }));

      setJobs(prev => {
        const combined = [...mapped, ...prev];
        return Array.from(new Map(combined.map(item => [item.sourceUrl || item.id, item])).values()).slice(0, 500);
      });
      onLog(`Captured ${mapped.length} potential dispatches.`, 'success');
    } catch (err: any) { 
      onLog(`Scan Node Fail: ${err.message}`, "error"); 
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
    <div className="p-10 lg:p-20 max-w-[1600px] mx-auto space-y-20 pb-40 relative">
      <div className="flex justify-between items-center">
         <button onClick={onBack} className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
            BACK TO COMMAND
         </button>
         <div className="text-right">
            <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none">Neural Scanner</h1>
            <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.5em] mt-2">UHF_STATUS: READY</p>
         </div>
      </div>

      <div className="bg-slate-950 border border-amber-500/20 rounded-[4rem] p-16 shadow-2xl space-y-12">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           <input type="text" placeholder="Role Type (e.g. Senior Actuary)..." className="w-full bg-black border border-white/5 rounded-[2.5rem] px-10 py-6 text-white text-xl font-black outline-none focus:border-amber-500 transition-all" value={query} onChange={(e) => setQuery(e.target.value)} />
           <input type="text" className="w-full bg-black border border-white/5 rounded-[2.5rem] px-10 py-6 text-white text-xl font-black outline-none focus:border-amber-500 transition-all" value={location} onChange={(e) => setLocation(e.target.value)} />
         </div>
         <button onClick={handleGlobalScrape} disabled={isScanning} className="w-full py-10 bg-white text-black rounded-[2.5rem] font-black uppercase text-lg tracking-[0.5em] hover:bg-amber-500 transition-all">
           {isScanning ? 'SYNCHRONIZING...' : 'Execute Universal Scan'}
         </button>
      </div>

      <div className="space-y-10">
        <div className="flex justify-between items-center border-b border-white/5 pb-10">
          <div className="flex items-center gap-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.6em]">Discovery Stream ({visibleJobs.length})</h3>
            {visibleJobs.length > 0 && (
              <button 
                onClick={handleSelectAll}
                className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                  allSelected ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {allSelected ? 'Deselect All' : 'Select All Nodes'}
              </button>
            )}
          </div>
          {selectedIds.size > 0 && (
            <button onClick={() => setShowConfirmation(true)} className="px-12 py-5 bg-amber-500 text-black rounded-[2rem] text-xs font-black uppercase tracking-[0.4em] hover:bg-white transition-all shadow-2xl">
              Authorize Dispatch ({selectedIds.size})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {visibleJobs.map(job => (
            <div key={job.id} onClick={() => toggleSelect(job.id)} className={`p-12 rounded-[4.5rem] border transition-all duration-500 flex flex-col justify-between min-h-[480px] relative group cursor-pointer ${selectedIds.has(job.id) ? 'border-amber-500 bg-amber-500/5' : 'border-white/5 bg-slate-950 hover:border-white/20'}`}>
              <div className="absolute top-10 right-10">
                 <div className={`w-8 h-8 rounded-2xl border-2 transition-all flex items-center justify-center ${selectedIds.has(job.id) ? 'bg-amber-600 border-amber-600' : 'border-white/10'}`}>
                    {selectedIds.has(job.id) && <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7"/></svg>}
                 </div>
              </div>
              <div>
                <h4 className="font-black text-white text-3xl italic tracking-tighter leading-tight mb-2 uppercase group-hover:text-amber-500 transition-colors">{job.role}</h4>
                <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] mb-10">{job.company}</p>
                <div className="bg-black/60 border border-white/5 rounded-[3rem] p-10 min-h-[160px] flex items-center mb-8 relative">
                   <p className="text-xs text-slate-400 italic leading-relaxed font-bold uppercase tracking-tight">{job.description}</p>
                </div>
              </div>
              <div className="mt-10 flex items-center justify-between border-t border-white/5 pt-8">
                 <span className="text-indigo-500 text-[10px] font-black uppercase tracking-widest">{job.location.toUpperCase()}</span>
                 <div className={`w-2 h-2 rounded-full ${selectedIds.has(job.id) ? 'bg-amber-500' : 'bg-slate-900'}`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8 bg-black/95 backdrop-blur-3xl animate-in fade-in">
           <div className="max-w-xl w-full bg-slate-950 border border-amber-500/30 rounded-[4rem] p-16 text-center space-y-10 shadow-2xl">
              <div className="space-y-4">
                 <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Authorize Mass Dispatch?</h2>
                 <p className="text-slate-400 text-sm leading-relaxed font-bold uppercase tracking-widest">You are committing <span className="text-amber-500">{selectedIds.size} nodes</span> to the UHF Autonomous Bridge.</p>
              </div>
              <div className="flex flex-col gap-4">
                 <button onClick={handleMassQueue} className="w-full py-8 bg-white text-black rounded-[2.5rem] font-black uppercase text-xs tracking-[0.5em] hover:bg-amber-600 hover:text-white transition-all shadow-2xl">Confirm UHF Execution</button>
                 <button onClick={() => setShowConfirmation(false)} className="w-full py-8 border border-white/10 text-slate-500 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.5em] hover:text-white transition-all">Abort</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ScraperNode;
