
import React, { useState, useMemo } from 'react';
import { JobRecord, UserProfile, TelemetryLog, SentRecord } from '../types';
import { scrapingService } from '../services/scrapingService';
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
  initialQuery?: string;
  onClearInitialQuery?: () => void;
}

const ScraperNode: React.FC<ScraperNodeProps> = ({ 
  profile: _profile, 
  onLog, 
  setJobs, 
  jobs, 
  updateStats: _updateStats, 
  onSent: _onSent, 
  onBack, 
  bridgeStatus: _bridgeStatus, 
  onReconnect: _onReconnect, 
  targetDailyCap: _targetDailyCap,
  initialQuery,
  onClearInitialQuery
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isDeepScanning, setIsDeepScanning] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [expandedQueries, setExpandedQueries] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSwipe, setShowSwipe] = useState(false);
  
  const [query, setQuery] = useState(initialQuery || '');
  const [location, setLocation] = useState('Remote Worldwide'); 

  const visibleJobs = useMemo(() => jobs.filter(j => j.status === 'discovered'), [jobs]);
  const allSelected = visibleJobs.length > 0 && Array.from(selectedIds).length >= visibleJobs.length;

  const handleBack = () => {
    if (isScanning || isDeepScanning) {
      if (window.confirm("Scan in progress. Terminate uplink?")) {
        onBack();
      }
    } else {
      onBack();
    }
  };

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

  const handleApplyAll = () => {
    if (visibleJobs.length === 0) return;
    onLog(`DEPLOYING: Committing ALL ${visibleJobs.length} nodes to bridge...`, "info");
    setJobs(prev => prev.map(j => j.status === 'discovered' ? { ...j, status: 'queued' } : j));
    onLog(`SUCCESS: Global UHF Dispatch triggered.`, "success");
    setSelectedIds(new Set());
  };

  const handleGlobalScrape = async (overrideQuery?: string, isDeep = false) => {
    const activeQuery = (overrideQuery || query).trim();
    if (!activeQuery) return 0;
    
    if (!isDeep) setIsScanning(true);
    
    setError(null);
    onLog(`SCAN: Targeting ${activeQuery} nodes (Global Uplink)...`, 'info');
    
    try {
      const results = await scrapingService.precisionGoogleSearch(activeQuery, location);
      const mapped: JobRecord[] = results.map((j: any) => ({
        ...j,
        status: 'discovered' as const,
        timestamp: Date.now(),
      }));

      setJobs(prev => {
        const existingUrls = new Set(prev.map(p => p.sourceUrl));
        const uniqueNew = mapped.filter(m => !existingUrls.has(m.sourceUrl));
        return [...uniqueNew, ...prev].slice(0, 5000);
      });

      if (mapped.length > 0) {
        onLog(`Captured ${mapped.length} nodes via Global Relay.`, 'success');
      } else {
        onLog(`No nodes identified for "${activeQuery}".`, 'warning');
      }
      return mapped.length;
    } catch (err: any) { 
      const msg = "Discovery scan interrupted. Neural link unstable.";
      onLog(msg, "error"); 
      setError(msg);
      return 0;
    } finally { 
      if (!isDeep) setIsScanning(false); 
    }
  };

  const handleDeepDiscovery = async () => {
    if (!query.trim()) return;
    setIsDeepScanning(true);
    onLog(`DEEP_DISCOVERY: Initiating multi-node neural expansion for "${query}"...`, "info");
    
    try {
      // 1. Get expansion queries
      const expansions = await geminiService.expandSearchQuery(query, _profile);
      setExpandedQueries(expansions);
      onLog(`EXPANSION: Identified ${expansions.length} neural variations.`, "info");
      
      // 2. Run initial search
      await handleGlobalScrape(query, true);
      
      // 3. Run expanded searches sequentially to ensure stability
      const filteredExpansions = expansions.filter(q => q.toLowerCase() !== query.toLowerCase());
      
      for (let i = 0; i < filteredExpansions.length; i++) {
        const q = filteredExpansions[i];
        onLog(`DEEP_DISCOVERY: Scanning expansion ${i + 1}/${filteredExpansions.length}: "${q}"...`, "info");
        await handleGlobalScrape(q, true);
        
        // Small delay to prevent rate limits and CPU spikes
        await new Promise(r => setTimeout(r, 1500));
      }
      
      onLog(`DEEP_DISCOVERY: Expansion complete. Neural trace saturated.`, "success");
    } catch (err) {
      onLog("DEEP_DISCOVERY: Expansion failed.", "error");
    } finally {
      setIsDeepScanning(false);
    }
  };

  const handleQueryExpansion = async () => {
    if (!query.trim()) return;
    setIsExpanding(true);
    onLog(`EXPANSION: Generating neural variations for "${query}"...`, "info");
    try {
      const expansions = await geminiService.expandSearchQuery(query, _profile);
      setExpandedQueries(expansions);
      onLog(`SUCCESS: Generated ${expansions.length} variations.`, "success");
    } catch (err) {
      onLog("EXPANSION: Failed to generate variations.", "error");
    } finally {
      setIsExpanding(false);
    }
  };

  React.useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleGlobalScrape(initialQuery);
      onClearInitialQuery?.();
    }
  }, [initialQuery]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="p-4 md:p-10 lg:p-20 max-w-[1600px] mx-auto space-y-8 md:space-y-20 pb-40">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <button onClick={handleBack} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all border border-white/5">
            <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
            BACK
         </button>
         <div className="text-left md:text-right">
            <h1 className="text-3xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-none">Universal Job Search</h1>
            <p className="text-amber-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] mt-1 md:mt-2">GROUNDING_ENABLED: BORDERLESS_UHF</p>
         </div>
      </div>

         <div className="bg-slate-950 border border-amber-500/10 rounded-3xl md:rounded-[4rem] p-6 md:p-16 shadow-2xl space-y-6 md:space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10">
              <div className="relative">
                <input type="text" placeholder="Role (e.g. Actuarial Analyst)..." className="w-full bg-black border border-white/5 rounded-2xl md:rounded-[2.5rem] px-6 py-4 md:px-10 md:py-6 text-white text-sm md:text-xl font-black outline-none focus:border-amber-500 transition-all shadow-inner" value={query} onChange={(e) => setQuery(e.target.value)} />
                <button 
                  onClick={handleQueryExpansion}
                  disabled={isExpanding || !query.trim()}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-indigo-600/20 hover:bg-indigo-600/40 rounded-full text-indigo-400 transition-all disabled:opacity-20"
                  title="Expand Query with AI"
                >
                  {isExpanding ? (
                    <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <input type="text" placeholder="Remote Worldwide" className="w-full bg-black border border-white/5 rounded-2xl md:rounded-[2.5rem] px-6 py-4 md:px-10 md:py-6 text-white text-sm md:text-xl font-black outline-none focus:border-amber-500 transition-all shadow-inner" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            
            {(expandedQueries.length > 0 || ['Data Entry', 'Customer Support', 'Virtual Assistant', 'Project Manager', 'Software Engineer'].length > 0) && (
              <div className="space-y-4">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center">
                  {expandedQueries.length > 0 ? 'NEURAL VARIATIONS (CLICK TO SCAN)' : 'QUICK TARGETS'}
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  {(expandedQueries.length > 0 ? expandedQueries : ['Data Entry', 'Customer Support', 'Virtual Assistant', 'Project Manager', 'Software Engineer']).map(role => (
                    <button 
                      key={role}
                      onClick={() => {
                        setQuery(role);
                        handleGlobalScrape(role);
                      }}
                      className={`px-4 py-2 border rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${expandedQueries.includes(role) ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-600 hover:text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-amber-500/50'}`}
                    >
                      {role}
                    </button>
                  ))}
                  {expandedQueries.length > 0 && (
                    <button 
                      onClick={() => setExpandedQueries([])}
                      className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500 hover:text-white transition-all"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              <button onClick={() => handleGlobalScrape()} disabled={isScanning || isDeepScanning} className="w-full py-6 md:py-10 bg-white text-black rounded-2xl md:rounded-[2.5rem] font-black uppercase text-[10px] md:text-lg tracking-[0.4em] hover:bg-amber-500 hover:text-white transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50">
                {isScanning ? 'SYNCING GLOBAL NODES...' : 'Initiate Universal Scan'}
              </button>
              <button onClick={handleDeepDiscovery} disabled={isScanning || isDeepScanning} className="w-full py-6 md:py-10 bg-indigo-600 text-white rounded-2xl md:rounded-[2.5rem] font-black uppercase text-[10px] md:text-lg tracking-[0.4em] hover:bg-indigo-500 transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 border border-indigo-400/30">
                {isDeepScanning ? 'EXPANDING NEURAL TRACE...' : 'Deep Discovery (2000+ Target)'}
              </button>
            </div>

            <div className="pt-4 border-t border-white/5">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-4 text-center">Search Optimization Tips:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                  <p className="text-[7px] font-black text-amber-500 uppercase mb-1">Be Specific</p>
                  <p className="text-[9px] text-slate-400 leading-tight italic">Instead of "Customer Support", try "Remote Customer Success Manager".</p>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                  <p className="text-[7px] font-black text-indigo-500 uppercase mb-1">Location Logic</p>
                  <p className="text-[9px] text-slate-400 leading-tight italic">Use "Worldwide", "EMEA", or "US Remote" for better node targeting.</p>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                  <p className="text-[7px] font-black text-emerald-500 uppercase mb-1">Deep Discovery</p>
                  <p className="text-[9px] text-slate-400 leading-tight italic">If a scan fails, the system automatically expands its neural trace.</p>
                </div>
              </div>
            </div>
         </div>

      <div className="space-y-6 md:space-y-10">
        <div className="flex justify-between items-center border-b border-white/5 pb-6 md:pb-10">
          <div className="flex items-center gap-3 md:gap-6">
            <h3 className="text-[8px] md:text-xs font-black text-slate-500 uppercase tracking-[0.4em]">Discovered Nodes ({visibleJobs.length})</h3>
            {visibleJobs.length > 0 && (
              <div className="flex gap-2">
                <button onClick={handleSelectAll} className="px-4 py-2 rounded-full text-[7px] font-black uppercase tracking-widest border border-white/10 text-slate-500 hover:text-white transition-all">
                  {allSelected ? 'Clear All' : 'Select All'}
                </button>
                <button onClick={handleApplyAll} className="px-4 py-2 rounded-full text-[7px] font-black uppercase tracking-widest border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-black transition-all">
                  Apply All
                </button>
              </div>
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
            <div className="col-span-full py-40 text-center border-2 border-dashed border-white/5 rounded-[5rem]">
               {isScanning || isDeepScanning ? (
                 <div className="space-y-8">
                    <div className="flex justify-center">
                       <div className="relative w-24 h-24">
                          <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full"></div>
                          <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                          <div className="absolute inset-4 border-4 border-indigo-500/20 rounded-full"></div>
                          <div className="absolute inset-4 border-4 border-indigo-500 border-b-transparent rounded-full animate-spin-slow"></div>
                       </div>
                    </div>
                    <div className="animate-pulse">
                       <p className="text-3xl font-black uppercase tracking-[0.5em] text-white">
                         {isDeepScanning ? 'Deep Discovery Active' : 'Neural Scan Active'}
                       </p>
                       <p className="text-[10px] font-black text-amber-500 uppercase mt-4 tracking-widest">
                         {isDeepScanning ? 'Expanding neural trace to reach 2000+ target nodes...' : 'Synchronizing with global job relays...'}
                       </p>
                    </div>
                 </div>
               ) : error ? (
                 <div className="space-y-8 px-6">
                    <div className="flex justify-center">
                       <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
                          <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                       </div>
                    </div>
                    <div>
                       <p className="text-2xl font-black uppercase tracking-[0.3em] text-white">No Nodes Detected</p>
                       <p className="text-sm font-bold text-slate-400 mt-4 max-w-md mx-auto leading-relaxed">{error}</p>
                       <div className="flex flex-col md:flex-row gap-4 justify-center mt-8">
                          <button 
                            onClick={() => handleGlobalScrape()}
                            className="px-8 py-3 bg-white text-black rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-amber-500 hover:text-white transition-all"
                          >
                            Retry Scan
                          </button>
                          <button 
                            onClick={handleDeepDiscovery}
                            className="px-8 py-3 bg-indigo-600 text-white rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-indigo-500 transition-all"
                          >
                            Deep Discovery
                          </button>
                          <button 
                            onClick={() => {
                              setLocation('Remote Worldwide');
                              handleGlobalScrape();
                            }}
                            className="px-8 py-3 bg-emerald-600 text-white rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 transition-all"
                          >
                            Broaden Search
                          </button>
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="opacity-20">
                    <p className="text-3xl font-black uppercase tracking-[0.5em]">SCANNER_IDLE</p>
                    <p className="text-[10px] font-black text-amber-500 uppercase mt-4 tracking-widest">Perform a Universal Scan to populate nodes</p>
                    <div className="flex flex-col md:flex-row gap-4 justify-center mt-8">
                       <button 
                         onClick={handleDeepDiscovery}
                         className="px-8 py-3 bg-indigo-600 text-white rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-indigo-500 transition-all"
                       >
                         Deep Discovery
                       </button>
                       <button 
                         onClick={() => {
                           setLocation('Remote Worldwide');
                           handleGlobalScrape();
                         }}
                         className="px-8 py-3 bg-emerald-600 text-white rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 transition-all"
                       >
                         Broaden Search
                       </button>
                    </div>
                 </div>
               )}
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
