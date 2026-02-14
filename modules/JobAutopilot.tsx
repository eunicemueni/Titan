
import React, { useState, useMemo } from 'react';
import { JobRecord, UserProfile, TelemetryLog, SentRecord } from '../types';
import { geminiService } from '../services/geminiService';
import SwipeDeploy from '../components/SwipeDeploy';

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

const ScraperNode: React.FC<ScraperNodeProps> = ({ 
  profile, 
  onLog, 
  setJobs, 
  jobs, 
  updateStats, 
  onSent, 
  onBack, 
  bridgeStatus, 
  onReconnect, 
  targetDailyCap 
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSwipe, setShowSwipe] = useState(false);
  
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('Remote Worldwide'); 

  const visibleJobs = useMemo(() => jobs.filter(j => j.status === 'discovered'), [jobs]);
  const allSelected = visibleJobs.length > 0 && Array.from(selectedIds).length >= visibleJobs.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(visibleJobs.map(j => j.id));
      setSelectedIds(allIds);
    }
  };

  const handleMassQueue = async () => {
    onLog(`DEPLOYING: Committing ${selectedIds.size} nodes to bridge...`, "info");
    setJobs(prev => prev.map(j => selectedIds.has(j.id) ? { ...j, status: 'queued' } : j));
    onLog(`SUCCESS: UHF Dispatch triggered.`, "success");
    setSelectedIds(new Set());
    setShowSwipe(false);
  };

  const handleGlobalScrape = async () => {
    if (!query) return;
    setIsScanning(true);
    onLog(`SCAN: Targeting ${query} nodes (Global Uplink)...`, 'info');
    
    try {
      const results = await geminiService.performUniversalScrape(query, location);
      const mapped: JobRecord[] = results.map((j: any, i: number) => ({
        id: `gem-${Date.now()}-${i}`,
        company: j.company || "Target Node",
        role: j.role || query,
        location: j.location || location,
        description: j.description || "Operational data source synchronized via Gemini Grounding.",
        sourceUrl: j.sourceUrl || "",
        status: 'discovered' as const,
        timestamp: Date.now(),
        matchScore: 90 + Math.floor(Math.random() * 10),
        metadata: j.metadata
      }));

      setJobs(prev => [...mapped, ...prev].slice(0, 200));
      onLog(`Captured ${mapped.length} nodes via Global Relay.`, 'success');
    } catch (err: any) { 
      onLog("Discovery scan interrupted.", "warning"); 
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
    <div className="p-4 md:p-10 lg:p-20 max-w-[1600px] mx-auto space-y-8 md:space-y-20 pb-40">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <button onClick={onBack} className="flex items-center gap-2 text-[8px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-white transition-all">
            <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
            BACK
         </button>
         <div className="text-left md:text-right">
            <h1 className="text-3xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-none">Neural Scanner</h1>
            <p className="text-amber-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] mt-1 md:mt-2">GROUNDING_ENABLED: BORDERLESS_UHF</p>
         </div>
      </div>

      <div className="bg-slate-950 border border-amber-500/10 rounded-3xl md:rounded-[4rem] p-6 md:p-16 shadow-2xl space-y-6 md:space-y-12">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10">
           <input type="text" placeholder="Role (e.g. Actuarial Analyst)..." className="w-full bg-black border border-white/5 rounded-2xl md:rounded-[2.5rem] px-6 py-4 md:px-10 md:py-6 text-white text-sm md:text-xl font-black outline-none focus:border-amber-500 transition-all shadow-inner" value={query} onChange={(e) => setQuery(e.target.value)} />
           <input type="text" placeholder="Remote Worldwide" className="w-full bg-black border border-white/5 rounded-2xl md:rounded-[2.5rem] px-6 py-4 md:px-10 md:py-6 text-white text-sm md:text-xl font-black outline-none focus:border-amber-500 transition-all shadow-inner" value={location} onChange={(e) => setLocation(e.target.value)} />
         </div>
         <button onClick={handleGlobalScrape} disabled={isScanning} className="w-full py-6 md:py-10 bg-white text-black rounded-2xl md:rounded-[2.5rem] font-black uppercase text-[10px] md:text-lg tracking-[0.4em] hover:bg-amber-500 hover:text-white transition-all shadow-2xl active:scale-[0.98]">
           {isScanning ? 'SYNCING GLOBAL NODES...' : 'Initiate Universal Scan'}
         </button>
      </div>

      <div className="space-y-6 md:space-y-10">
        <div className="flex justify-between items-center border-b border-white/5 pb-6 md:pb-10">
          <div className="flex items-center gap-3 md:gap-6">
            <h3 className="text-[8px] md:text-xs font-black text-slate-500 uppercase tracking-[0.4em]">Discovered Nodes ({visibleJobs.length})</h3>
            {visibleJobs.length > 0 && (
              <button onClick={handleSelectAll} className="px-4 py-2 rounded-full text-[7px] font-black uppercase tracking-widest border border-white/10 text-slate-500 hover:text-white transition-all">
                {allSelected ? 'Clear All' : 'Select All'}
              </button>
            )}
          </div>
          {selectedIds.size > 0 && (
            <button onClick={() => setShowSwipe(true)} className="px-6 py-3 md:px-12 md:py-5 bg-amber-500 text-black rounded-xl md:rounded-[2rem] text-[8px] md:text-xs font-black uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              Mass Dispatch ({selectedIds.size})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          {visibleJobs.map((job: JobRecord) => (
            <div key={job.id} onClick={() => toggleSelect(job.id)} className={`p-6 md:p-12 rounded-3xl md:rounded-[4.5rem] border transition-all duration-300 flex flex-col justify-between min-h-[350px] md:min-h-[520px] relative group cursor-pointer ${selectedIds.has(job.id) ? 'border-amber-500 bg-amber-500/5' : 'border-white/5 bg-slate-950 hover:border-white/20'}`}>
              <div className="absolute top-6 right-6 md:top-10 md:right-10">
                 <div className={`w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-2xl border-2 transition-all flex items-center justify-center ${selectedIds.has(job.id) ? 'bg-amber-600 border-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'border-white/10'}`}>
                    {selectedIds.has(job.id) && <svg className="w-4 h-4 md:w-5 md:h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7"/></svg>}
                 </div>
              </div>
              <div>
                <h4 className="font-black text-white text-xl md:text-3xl italic tracking-tighter leading-tight mb-1 md:mb-2 uppercase group-hover:text-amber-500 transition-colors">{job.role}</h4>
                <p className="text-[8px] md:text-[11px] text-slate-600 font-black uppercase tracking-widest mb-4 md:mb-10">{job.company}</p>
                <div className="bg-black/60 border border-white/5 rounded-2xl md:rounded-[3rem] p-4 md:p-8 min-h-[80px] md:min-h-[140px] flex flex-col mb-4 md:mb-8 shadow-inner overflow-hidden">
                   <p className="text-[9px] md:text-xs text-slate-500 italic leading-relaxed font-bold uppercase tracking-tight line-clamp-3 mb-4">{job.description}</p>
                   
                   {job.metadata?.sources && job.metadata.sources.length > 0 && (
                     <div className="mt-auto space-y-2 border-t border-white/5 pt-4">
                        <p className="text-[7px] font-black text-indigo-400 uppercase tracking-widest">Global Relays:</p>
                        <div className="flex flex-wrap gap-2">
                          {job.metadata.sources.slice(0, 2).map((src, idx) => (
                            <a 
                              key={idx} 
                              href={src.uri} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              onClick={(e) => e.stopPropagation()}
                              className="text-[7px] font-mono text-slate-600 hover:text-white transition-colors underline truncate max-w-[120px]"
                            >
                              {src.title}
                            </a>
                          ))}
                        </div>
                     </div>
                   )}
                </div>
              </div>
              <div className="mt-4 md:mt-10 flex items-center justify-between border-t border-white/5 pt-4 md:pt-8">
                 <span className="text-indigo-500 text-[8px] md:text-[10px] font-black uppercase tracking-widest truncate max-w-[150px]">{job.location}</span>
                 <div className={`w-1.5 h-1.5 rounded-full ${selectedIds.has(job.id) ? 'bg-amber-500 shadow-[0_0_5px_#f59e0b]' : 'bg-slate-900'}`}></div>
              </div>
            </div>
          ))}
          {visibleJobs.length === 0 && (
            <div className="col-span-full py-40 text-center border-2 border-dashed border-white/5 rounded-[5rem] opacity-20">
               <p className="text-3xl font-black uppercase tracking-[0.5em]">SCANNER_IDLE</p>
               <p className="text-[10px] font-black text-amber-500 uppercase mt-4 tracking-widest">Perform a Universal Scan to populate nodes</p>
            </div>
          )}
        </div>
      </div>

      {showSwipe && (
        <SwipeDeploy 
          label={`${selectedIds.size} Node Dispatches`}
          onConfirm={handleMassQueue}
          onCancel={() => setShowSwipe(false)}
          themeColor="amber"
        />
      )}
    </div>
  );
};

export default ScraperNode;
