
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, JobRecord, Mission, TelemetryLog, QueueStatus, SentRecord } from '../types';

interface MissionControlProps {
  profile: UserProfile;
  onLog: (msg: string, level: TelemetryLog['level']) => void;
  onSent: (record: Omit<SentRecord, 'id' | 'timestamp' | 'status'>) => void;
  onBack: () => void;
  jobs: JobRecord[];
  setJobs: React.Dispatch<React.SetStateAction<JobRecord[]>>;
  isAutopilot: boolean;
  onToggleAutopilot: () => void;
  sentRecords: SentRecord[];
  queueStatus: QueueStatus;
  targetDailyCap: number;
  evasionStatus: string;
  missions: Mission[];
}

const MissionControl: React.FC<MissionControlProps> = ({ 
  profile, 
  onLog, 
  onSent,
  onBack,
  jobs, 
  setJobs, 
  isAutopilot, 
  onToggleAutopilot, 
  sentRecords,
  queueStatus,
  targetDailyCap,
  evasionStatus,
  missions
}) => {
  const [activeTab, setActiveTab] = useState<'WAR_ROOM' | 'AUDIT_LOG'>('WAR_ROOM');
  const [liveMissions, setLiveMissions] = useState<Mission[]>(missions || []);
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tickerRef.current) tickerRef.current.scrollTop = tickerRef.current.scrollHeight;
  }, [liveMissions]);

  // MISSION SIMULATION LOGIC
  useEffect(() => {
    if (!isAutopilot) {
      setLiveMissions([]);
      return;
    }

    const interval = setInterval(() => {
      const pendingJobs = jobs.filter(j => j.status === 'discovered' || j.status === 'queued');
      if (pendingJobs.length === 0) return;

      const randomJob = pendingJobs[Math.floor(Math.random() * pendingJobs.length)];
      const opCode = Math.random().toString(16).substring(2, 8).toUpperCase();
      const isShadow = !randomJob.sourceUrl; 
      
      const newMission: Mission = {
        id: `miss-${Date.now()}`,
        target: randomJob.company,
        status: 'ACTIVE' as const,
        log: `[0x${opCode}] ${isShadow ? 'SHADOW_INFILTRATION' : 'PUBLIC_RELAY'} -> ${randomJob.company.toUpperCase()}...`,
        timestamp: Date.now()
      };

      setLiveMissions(prev => [...prev, newMission].slice(-50));
      
      if (Math.random() > 0.85) {
        const compMission: Mission = {
          id: `comp-${Date.now()}`,
          target: randomJob.company,
          status: 'SUCCESS' as const,
          log: `[0x${opCode}] MISSION_COMPLETE: Application Node Transmitted.`,
          timestamp: Date.now()
        };
        setLiveMissions(prev => [...prev, compMission].slice(-50));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isAutopilot, jobs]);

  const handleManualDispatch = (job: JobRecord) => {
    onLog(`DEPLOY: Manual override for ${job.company.toUpperCase()}`, 'info');
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'queued' } : j));
    setTimeout(() => onLog(`SUCCESS: Node ${job.id} transmitted.`, "success"), 1000);
  };

  const queuedJobs = jobs.filter(j => j.status === 'queued');
  const discoveredJobs = jobs.filter(j => j.status === 'discovered');

  return (
    <div className="min-h-screen bg-[#02040a] p-4 md:p-10 lg:p-16 space-y-12 pb-40 relative border-t border-white/5 animate-in fade-in duration-500">
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,_rgba(99,102,241,0.02),_transparent_50%)] pointer-events-none"></div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 relative z-10">
        <div className="space-y-4">
           <h1 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase leading-none">War Room</h1>
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
                 <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Relay Bridge Active</span>
              </div>
              <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">EVASION: {evasionStatus} | AGENTS: {targetDailyCap/10}</p>
           </div>
        </div>
        <div className="flex flex-row gap-4 w-full lg:w-auto">
           <button onClick={() => setActiveTab(activeTab === 'WAR_ROOM' ? 'AUDIT_LOG' : 'WAR_ROOM')} className="flex-1 lg:flex-none px-10 py-6 rounded-[2.5rem] bg-slate-950 border border-white/5 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-all">
             {activeTab === 'WAR_ROOM' ? 'Audit Ledger' : 'Back to War Room'}
           </button>
           <button onClick={onToggleAutopilot} className={`flex-1 lg:flex-none px-16 py-6 rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.4em] shadow-2xl transition-all border ${isAutopilot ? 'bg-red-500 text-white border-red-400' : 'bg-indigo-600 text-white border-indigo-400 hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]'}`}>
             {isAutopilot ? 'TERMINATE_AUTO' : 'ENGAGE_DEPLOY'}
           </button>
           <button onClick={onBack} className="hidden lg:flex px-10 py-6 rounded-[2.5rem] bg-slate-900 border border-white/5 text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all">Back</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
        <div className="lg:col-span-8 space-y-12">
           {activeTab === 'WAR_ROOM' ? (
             <div className="space-y-12">
                <div className="bg-slate-950 border border-white/5 rounded-[4rem] p-10 md:p-14 space-y-10 shadow-2xl relative overflow-hidden">
                   <div className="flex justify-between items-center relative z-10">
                      <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Target Discovery Feed</h3>
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-4 py-1.5 rounded-full">Identified: {discoveredJobs.length}</span>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                      {discoveredJobs.map(job => (
                        <div key={job.id} className={`p-8 bg-black/40 border rounded-[2.5rem] flex flex-col justify-between group hover:border-indigo-500/30 transition-all ${!job.sourceUrl ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-white/5'}`}>
                           <div>
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="text-lg font-black text-white uppercase italic tracking-tighter truncate max-w-[200px]">{job.role}</h4>
                                <span className={`text-[7px] font-black uppercase px-2 py-1 rounded ${!job.sourceUrl ? 'bg-cyan-500/20 text-cyan-400' : 'bg-indigo-500/10 text-indigo-500'}`}>
                                  {!job.sourceUrl ? 'Shadow Market' : 'Public Listing'}
                                </span>
                              </div>
                              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{job.company}</p>
                           </div>
                           <div className="mt-8 flex justify-between items-center">
                              <span className="text-[8px] font-mono text-slate-700 uppercase">{job.location}</span>
                              <button onClick={() => handleManualDispatch(job)} className="px-6 py-2.5 bg-white text-black text-[9px] font-black uppercase rounded-full hover:bg-indigo-600 hover:text-white transition-all active:scale-95">Dispatch</button>
                           </div>
                        </div>
                      ))}
                      {discoveredJobs.length === 0 && (
                        <div className="col-span-full py-20 text-center text-[10px] font-black text-slate-800 uppercase tracking-[0.4em] border border-dashed border-white/5 rounded-[3rem]">
                           Pulsing Global Networks...
                        </div>
                      )}
                   </div>
                </div>

                <div className="bg-black border border-indigo-500/20 rounded-[3rem] p-10 h-[320px] flex flex-col shadow-inner relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_100%,_rgba(99,102,241,0.05),_transparent_70%)]"></div>
                   <div className="flex items-center justify-between mb-6 shrink-0 relative z-10">
                      <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em]">Neural Relay Feed</h3>
                      <div className="flex gap-1.5">
                         {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-500/20 animate-pulse" style={{ animationDelay: `${i*0.3}s` }}></div>)}
                      </div>
                   </div>
                   <div ref={tickerRef} className="flex-1 overflow-y-auto space-y-2 custom-scrollbar relative z-10">
                      {liveMissions.map((miss) => (
                        <div key={miss.id} className={`flex gap-4 items-start font-mono text-[9px] ${miss.status === 'SUCCESS' ? 'text-emerald-400' : 'text-slate-500'}`}>
                           <span className="text-indigo-800 shrink-0">[{new Date(miss.timestamp).toLocaleTimeString()}]</span>
                           <span className={miss.status === 'SUCCESS' ? 'font-bold' : ''}>{miss.log}</span>
                        </div>
                      ))}
                      {!isAutopilot && (
                        <div className="h-full flex items-center justify-center opacity-20 italic font-mono text-[10px] tracking-widest text-slate-600">
                          AWAITING_RELAY_INSTRUCTIONS...
                        </div>
                      )}
                   </div>
                </div>
             </div>
           ) : (
             <div className="bg-slate-950 border border-white/5 rounded-[4rem] p-12 shadow-2xl animate-in fade-in duration-500">
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b border-white/5">
                         <th className="py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Time Node</th>
                         <th className="py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Target</th>
                         <th className="py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {sentRecords.map(record => (
                        <tr key={record.id} className="group hover:bg-white/2 transition-colors">
                           <td className="py-8 text-[10px] font-mono text-slate-600">{new Date(record.timestamp).toLocaleString()}</td>
                           <td className="py-8">
                              <div className="flex items-center gap-3 mb-1">
                                <h5 className="text-[12px] font-black text-white uppercase italic leading-none">{record.recipient}</h5>
                                <span className={`text-[6px] font-black px-1.5 py-0.5 rounded border ${record.type === 'COL_OUTREACH' ? 'border-cyan-500/40 text-cyan-400' : 'border-indigo-500/40 text-indigo-400'}`}>
                                  {record.type.split('_')[0]}
                                </span>
                              </div>
                              <p className="text-[8px] font-bold text-slate-700 uppercase mt-1.5 truncate max-w-[300px]">{record.subject}</p>
                           </td>
                           <td className="py-8 text-right">
                              <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[8px] font-black uppercase italic">Node_Captured</span>
                           </td>
                        </tr>
                      ))}
                      {sentRecords.length === 0 && (
                        <tr><td colSpan={3} className="py-20 text-center text-[10px] font-black text-slate-800 uppercase tracking-widest">Audit Ledger Empty</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
           )}
        </div>

        <div className="lg:col-span-4 space-y-12">
           <div className="bg-slate-950 border border-white/5 rounded-[4rem] p-12 h-[800px] flex flex-col shadow-2xl relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] pointer-events-none"></div>
              <div className="flex items-center justify-between mb-10 shrink-0">
                 <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.5em]">Relay Buffer</h3>
                 <span className="text-2xl font-black text-white italic">{queuedJobs.length}</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2">
                 {queuedJobs.map((job, idx) => (
                   <div key={job.id} className="p-6 bg-black border border-white/5 rounded-3xl space-y-4 group hover:border-amber-500/30 transition-all">
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black text-white uppercase italic truncate max-w-[120px]">{job.company}</span>
                         <span className={`text-[8px] font-black uppercase ${!job.sourceUrl ? 'text-cyan-400' : 'text-amber-500'}`}>
                           {!job.sourceUrl ? 'SHADOW' : 'PUBLIC'}
                         </span>
                      </div>
                      <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                         <div className="h-full bg-amber-500 animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }}></div>
                      </div>
                      <div className="flex justify-between items-center text-[7px] font-mono text-slate-700 uppercase">
                         <span>INJECTING_PERSONA</span>
                         <span>0x${Math.random().toString(16).substring(2,6).toUpperCase()}</span>
                      </div>
                   </div>
                 ))}
                 {queuedJobs.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center text-center opacity-10 space-y-4">
                      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      <p className="text-[9px] font-black uppercase tracking-widest">Stack Idle</p>
                   </div>
                 )}
              </div>

              <div className="mt-10 pt-10 border-t border-white/5 shrink-0 text-center">
                 <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-1">Queue Status</p>
                 <p className="text-xl font-black text-indigo-400 uppercase italic tracking-tighter">
                   {queueStatus.active > 0 ? 'Transmitting' : 'Awaiting Load'}
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MissionControl;
