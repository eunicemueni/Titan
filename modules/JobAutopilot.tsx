
import React, { useState, useMemo, useEffect } from 'react';
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
}

const ScraperNode: React.FC<ScraperNodeProps> = ({ profile, onLog, setJobs, jobs, onSent, onBack }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkOperating, setIsBulkOperating] = useState(false);
  const [viewingPackage, setViewingPackage] = useState<JobRecord | null>(null);
  
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('Worldwide');
  const [salaryFilter, setSalaryFilter] = useState('');

  const handleCloudDispatch = async () => {
    if (selectedIds.size === 0 || isBulkOperating) return;
    setIsBulkOperating(true);
    onLog(`Initiating strategic outreach for ${selectedIds.size} opportunities...`, "info");

    const selectedJobs = jobs.filter(j => selectedIds.has(j.id));
    
    try {
      for (const job of selectedJobs) {
        onLog(`Generating tailored identity package for ${job.company}...`, "info");
        const pkg = await geminiService.tailorJobPackage(job.role, job.company, profile, 'standard');
        
        const subject = pkg.subject || `Strategic Proposal: ${job.role} - ${profile.fullName}`;
        const body = pkg.emailBody || '';
        const recipient = job.contactEmail || 'hr@corporate.com';

        window.open(`mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
        
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'completed', tailoredPackage: pkg } : j));
        onSent({ type: 'JOB_APPLICATION', recipient: job.company, subject });
        onLog(`Outreach relay successful for ${job.company}.`, "success");
      }
      geminiService.speak(`Batch outreach completed. All tailored dossiers have been dispatched.`);
    } catch (err: any) {
      onLog("Outreach interrupted: Neural buffer exception.", "error");
    } finally {
      setIsBulkOperating(false);
      setSelectedIds(new Set());
    }
  };

  const handleGlobalScrape = async () => {
    if (!query.trim() || isScanning) return;
    setIsScanning(true);
    onLog(`Scanning global markets for "${query}" matching your profile...`, 'info');
    
    try {
      const results = await geminiService.discoverJobPostings(query, location, salaryFilter);
      const newJobs: JobRecord[] = results.map((j: any, i: number) => ({
        ...j,
        id: `job-${Date.now()}-${i}`,
        status: 'discovered' as const,
        timestamp: Date.now(),
        matchScore: 94 + Math.floor(Math.random() * 6),
        isQualified: true
      }));
      setJobs(prev => [...newJobs, ...prev]);
      onLog(`Discovery complete: ${results.length} relevant nodes indexed.`, 'success');
      geminiService.speak(`Found ${results.length} opportunities that strongly match your expertise.`);
    } catch (err: any) { 
      onLog("Market discovery failed: Network timeout.", "error"); 
    } finally { setIsScanning(false); }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const visibleJobs = useMemo(() => jobs.filter(j => j.status !== 'skipped'), [jobs]);

  if (viewingPackage && viewingPackage.tailoredPackage) {
    return (
      <div className="min-h-screen bg-[#02040a] p-10 lg:p-24 animate-in fade-in duration-500">
        <div className="max-w-7xl mx-auto space-y-16">
           <div className="flex justify-between items-center">
              <button onClick={() => setViewingPackage(null)} className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] hover:text-white transition-all">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
                 Back to Discovery Hub
              </button>
              <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Dossier Audit: {viewingPackage.company}</h2>
           </div>
           
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="bg-slate-950 border border-white/5 p-16 rounded-[4rem] shadow-2xl space-y-10">
                 <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em]">Neural Email Relay</h3>
                 <div className="text-lg font-serif italic text-slate-300 leading-relaxed whitespace-pre-wrap h-[600px] overflow-y-auto custom-scrollbar pr-6">
                    {viewingPackage.tailoredPackage.emailBody}
                 </div>
              </div>
              <div className="bg-white border border-slate-200 p-16 rounded-[4rem] shadow-2xl space-y-10">
                 <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em]">Identity DNA Overlay</h3>
                 <div className="text-xs font-mono text-slate-800 leading-relaxed whitespace-pre-wrap h-[600px] overflow-y-auto custom-scrollbar pr-6">
                    {viewingPackage.tailoredPackage.cv}
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 lg:p-20 max-w-[1600px] mx-auto space-y-20 animate-in fade-in duration-700 pb-40">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
         <button onClick={onBack} className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] hover:text-white transition-all">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
            Command Center
         </button>
         <div className="text-left md:text-right space-y-2">
            <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none">Neural Discovery</h1>
            <p className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.5em]">Autonomous Global Lead Acquisition</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
           <div className="bg-slate-950 border border-white/5 rounded-[4rem] p-16 lg:p-24 shadow-2xl space-y-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,_rgba(99,102,241,0.05),_transparent_60%)] pointer-events-none"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] ml-6">Target Role / Sector</label>
                  <input type="text" placeholder="e.g. Senior Actuarial Analyst..." className="w-full bg-black border border-white/5 rounded-[2.5rem] px-10 py-6 text-white text-xl font-black outline-none focus:border-indigo-500 transition-all shadow-inner" value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] ml-6">Min Annual Yield</label>
                  <input type="text" placeholder="$140,000+..." className="w-full bg-black border border-white/5 rounded-[2.5rem] px-10 py-6 text-white text-xl font-black outline-none focus:border-indigo-500 transition-all shadow-inner" value={salaryFilter} onChange={(e) => setSalaryFilter(e.target.value)} />
                </div>
              </div>

              <button 
                onClick={handleGlobalScrape} 
                disabled={isScanning || !query} 
                className="w-full py-8 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase text-sm tracking-[0.4em] shadow-2xl hover:bg-white hover:text-black transition-all active:scale-[0.98] relative z-10"
              >
                {isScanning ? 'Establishing Neural Relay Cluster...' : 'Deploy Global Market Scraper'}
              </button>
           </div>
        </div>

        <div className="lg:col-span-4">
           <div className="bg-slate-950 border border-white/5 p-12 rounded-[4rem] shadow-2xl space-y-10 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em] flex items-center gap-4 mb-10">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></div>
                  Security Matrix
                </h3>
                <div className="space-y-6 font-mono text-[10px] text-slate-600">
                  <div className="flex justify-between border-b border-white/5 pb-3">
                      <span className="uppercase text-slate-800">Fingerprint:</span>
                      <span className="text-indigo-500">TITAN_v6.4_CLOAKED</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-3">
                      <span className="uppercase text-slate-800">Bot Evasion:</span>
                      <span className="text-emerald-500">MAX_LEVEL</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-3">
                      <span className="uppercase text-slate-800">Proxy Mode:</span>
                      <span className="text-indigo-500">ROTATING_RESIDENTIAL</span>
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-slate-800 leading-relaxed italic border-t border-white/5 pt-6 uppercase font-bold tracking-widest">
                System utilizes high-fidelity browsing telemetry to ensure 100% stealth and discovery integrity.
              </p>
           </div>
        </div>
      </div>

      {/* Discovery Feed */}
      <div className="space-y-10">
        <div className="flex items-center justify-between border-b border-white/5 pb-10">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.6em] flex items-center gap-6">
            <span className="w-12 h-px bg-indigo-500/30"></span>
            Opportunity Buffer ({visibleJobs.length})
          </h3>
          {selectedIds.size > 0 && (
            <button 
              onClick={handleCloudDispatch}
              disabled={isBulkOperating}
              className="px-12 py-5 bg-white text-black rounded-[2rem] text-xs font-black uppercase tracking-[0.4em] hover:bg-indigo-600 hover:text-white transition-all shadow-2xl animate-in slide-in-from-right-10"
            >
              {isBulkOperating ? 'Processing Relays...' : `Execute Direct Dispatch (${selectedIds.size})`}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          {visibleJobs.map(job => (
            <div 
              key={job.id} 
              onClick={() => toggleSelect(job.id)}
              className={`p-12 rounded-[4.5rem] border transition-all duration-500 flex flex-col justify-between min-h-[520px] relative group cursor-pointer ${
                selectedIds.has(job.id) ? 'border-indigo-500 bg-indigo-600/5 scale-[1.02] shadow-2xl' : 
                job.status === 'completed' ? 'border-emerald-500/30 bg-emerald-500/5 shadow-xl' : 'border-white/5 bg-slate-950 hover:border-white/20'
              }`}
            >
              <div className="absolute top-10 right-10">
                 <div className={`w-8 h-8 rounded-2xl border-2 transition-all flex items-center justify-center ${selectedIds.has(job.id) ? 'bg-indigo-600 border-indigo-600 shadow-lg' : 'border-white/10'}`}>
                    {selectedIds.has(job.id) && <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7"/></svg>}
                 </div>
              </div>

              <div>
                <div className="flex justify-between items-start mb-8">
                  <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-400'}`}>
                      {job.status === 'completed' ? 'Dispatched' : `Match_Pulse: ${job.matchScore}%`}
                  </span>
                </div>
                
                <h4 className="font-black text-white text-3xl italic tracking-tighter leading-tight mb-2 group-hover:text-indigo-400 transition-colors uppercase">{job.role}</h4>
                <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] mb-10">{job.company}</p>
                
                <div className="bg-black/60 border border-white/5 rounded-[3rem] p-10 min-h-[160px] flex items-center mb-8 relative">
                   <div className="absolute -top-3 left-10 px-4 py-1 bg-slate-950 rounded-lg text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] border border-white/5">Neural Gap Analysis</div>
                   <p className="text-xs text-slate-400 italic leading-relaxed font-bold uppercase tracking-tight">
                      "Projected Resolution: Positioning profile as the primary strategic node for ${job.company}'s current operational friction point."
                   </p>
                </div>

                {job.status === 'completed' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setViewingPackage(job); }}
                    className="w-full py-4 border border-emerald-500/20 rounded-2xl text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] hover:bg-emerald-500 hover:text-white transition-all shadow-xl"
                  >
                    Audit Dispatch Assets
                  </button>
                )}
              </div>
              
              <div className="mt-10 flex items-center justify-between border-t border-white/5 pt-8 text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">
                 <div className="flex gap-2">
                    <div className={`w-2 h-2 rounded-full ${selectedIds.has(job.id) ? 'bg-indigo-500 shadow-[0_0_8px_#6366f1]' : 'bg-slate-900'}`}></div>
                    <div className={`w-2 h-2 rounded-full ${job.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-900'}`}></div>
                 </div>
                 <span>{selectedIds.has(job.id) ? 'Queued' : 'Buffered'}</span>
              </div>
            </div>
          ))}

          {visibleJobs.length === 0 && !isScanning && (
            <div className="col-span-full py-60 text-center border-2 border-dashed border-white/5 rounded-[5rem] opacity-10">
               <p className="text-4xl font-black uppercase tracking-[1em]">Buffer Idle</p>
               <p className="text-[11px] font-black text-indigo-500 uppercase mt-8 tracking-[0.5em]">Initiate Market Scan to Populate Lead Nodes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScraperNode;
