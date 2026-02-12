import React, { useState } from 'react';
import { UserProfile, JobRecord, Mission, TelemetryLog, IndustryType, QueueStatus, SentRecord } from '../types';

interface MissionControlProps {
  profile: UserProfile;
  jobs: JobRecord[];
  sentRecords: SentRecord[];
  setJobs: React.Dispatch<React.SetStateAction<JobRecord[]>>;
  onLog: (msg: string, level: TelemetryLog['level']) => void;
  onSent: (r: any) => void;
  isAutopilot: boolean;
  onToggleAutopilot: () => void;
  missions: Mission[];
  queueStatus: QueueStatus;
  targetDailyCap: number;
  evasionStatus: string;
}

const MissionControl: React.FC<MissionControlProps> = ({ 
  profile, jobs, sentRecords, setJobs, onLog, onSent, isAutopilot, onToggleAutopilot, queueStatus, targetDailyCap, evasionStatus 
}) => {
  const [activeTab, setActiveTab] = useState<'COMMAND' | 'LEDGER'>('COMMAND');
  const [viewingRecord, setViewingRecord] = useState<SentRecord | null>(null);
  const [useBridgeRelay, setUseBridgeRelay] = useState(true);

  const handleQueueRelay = async (job: JobRecord) => {
    if (useBridgeRelay) {
      onLog(`BRIDGE: Committing ${job.company} to background dispatch...`, 'info');
      try {
        const res = await fetch('/api/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: job.company,
            subject: `Strategic Application: ${job.role} - ${profile.fullName}`,
            body: `Applied via TITAN OS Bridge Relay. Payload: ${profile.masterCV.slice(0, 100)}...`,
            type: 'JOB_APPLICATION'
          })
        });
        
        if (res.ok) {
           setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'queued' } : j));
           onSent({ 
             type: 'JOB_APPLICATION', 
             recipient: job.company, 
             subject: `Strategic Application: ${job.role}`,
             body: "Transmitted via Server-Side Bridge. Background processing initiated."
           });
        } else {
           throw new Error("Relay Reject");
        }
      } catch (e) {
        onLog("BRIDGE_FAIL: Reverting to Local Relay protocol.", "warning");
        setUseBridgeRelay(false);
      }
    } else {
      onLog(`MANUAL: Opening local relay for ${job.company}...`, 'info');
      window.open(`mailto:?subject=Application for ${job.role}&body=${encodeURIComponent(profile.masterCV.slice(0, 200))}`);
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'queued' } : j));
    }
  };

  const queuedJobs = jobs.filter(j => j.status === 'queued');
  const discoveredJobs = jobs.filter(j => j.status === 'discovered');

  return (
    <div className="min-h-screen bg-[#02040a] p-4 md:p-12 space-y-10 md:space-y-20 pb-40">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none">
            {activeTab === 'COMMAND' ? 'Mission Control' : 'Dispatch Ledger'}
          </h1>
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setUseBridgeRelay(!useBridgeRelay)}
               className={`group flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-500 ${useBridgeRelay ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-white/10 text-slate-600'}`}
             >
               <span className={`w-1.5 h-1.5 rounded-full ${useBridgeRelay ? 'bg-indigo-400 animate-pulse' : 'bg-slate-700'}`}></span>
               <span className="text-[10px] font-black uppercase tracking-widest">{useBridgeRelay ? 'Bridge_Relay: ACTIVE' : 'Local_Relay: ACTIVE'}</span>
             </button>
             <div className="h-4 w-px bg-white/5 mx-2"></div>
             <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Target: {targetDailyCap}/day</p>
          </div>
        </div>
        <div className="flex flex-row gap-3 md:gap-4 w-full lg:w-auto">
          <button 
            onClick={() => setActiveTab(activeTab === 'COMMAND' ? 'LEDGER' : 'COMMAND')} 
            className="flex-1 lg:flex-none px-6 md:px-10 py-4 md:py-6 rounded-2xl md:rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest transition-all border bg-slate-950 text-slate-500 border-white/10 hover:border-white/20 hover:text-white"
          >
            {activeTab === 'COMMAND' ? `View Ledger (${sentRecords.length})` : 'Return to Command'}
          </button>
          {activeTab === 'COMMAND' && (
            <button 
              onClick={onToggleAutopilot} 
              className={`flex-1 lg:flex-none px-6 md:px-16 py-4 md:py-6 rounded-2xl md:rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.4em] transition-all border ${isAutopilot ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.3)]'}`}
            >
              {isAutopilot ? 'ABORT ALL' : 'ENGAGE PILOT'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 bg-slate-950 border border-white/5 p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(99,102,241,0.02),_transparent_70%)] pointer-events-none"></div>
         <div className="p-4 md:p-8 border-r border-white/5"><p className="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-2">Queue</p><h4 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter">{queueStatus.waiting}</h4></div>
         <div className="p-4 md:p-8 md:border-r border-white/5"><p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-2">Active</p><h4 className="text-3xl md:text-5xl font-black text-indigo-400 animate-pulse italic tracking-tighter">{queueStatus.active}</h4></div>
         <div className="p-4 md:p-8 border-r border-white/5"><p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2">Done</p><h4 className="text-3xl md:text-5xl font-black text-emerald-400 italic tracking-tighter">{queueStatus.completed}</h4></div>
         <div className="p-4 md:p-8"><p className="text-[9px] font-black text-cyan-500 uppercase tracking-widest mb-2">Evasion</p><h4 className="text-3xl md:text-5xl font-black text-cyan-400 italic tracking-tighter">{evasionStatus}</h4></div>
      </div>

      {activeTab === 'COMMAND' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-20">
          <div className="space-y-6 md:space-y-12">
             <div className="flex items-center gap-4">
                <h3 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-[0.5em]">Autopilot Buffer ({queuedJobs.length})</h3>
                <div className="h-px flex-1 bg-white/5"></div>
             </div>
             <div className="grid grid-cols-1 gap-3 md:gap-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                {queuedJobs.length === 0 && <p className="text-[10px] font-black text-slate-800 uppercase text-center py-20 border-2 border-dashed border-white/5 rounded-[3rem]">No active relays</p>}
                {queuedJobs.map(job => (
                  <div key={job.id} className="p-6 md:p-8 bg-black/40 border border-amber-500/10 rounded-[2rem] flex items-center justify-between group hover:border-amber-500/30 transition-all">
                     <div>
                        <h4 className="text-[11px] md:text-sm font-black text-white uppercase truncate max-w-[180px] md:max-w-[250px] italic tracking-tighter">{job.role}</h4>
                        <p className="text-[8px] md:text-[10px] font-black text-slate-700 uppercase mt-1">{job.company}</p>
                     </div>
                     <div className="flex flex-col items-end gap-1">
                        <span className="text-[7px] font-mono text-amber-500 uppercase animate-pulse tracking-widest">BRIDGE_TRANSFER</span>
                        <div className="w-16 h-1 bg-slate-900 rounded-full overflow-hidden">
                           <div className="h-full bg-amber-500/50 w-1/3 animate-[shimmer_2s_infinite]"></div>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
          <div className="space-y-6 md:space-y-12">
             <div className="flex items-center gap-4">
                <h3 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-[0.5em]">Neural Discovery ({discoveredJobs.length})</h3>
                <div className="h-px flex-1 bg-white/5"></div>
             </div>
             <div className="grid grid-cols-1 gap-3 md:gap-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                {discoveredJobs.length === 0 && <p className="text-[10px] font-black text-slate-800 uppercase text-center py-20 border-2 border-dashed border-white/5 rounded-[3rem]">No pending nodes</p>}
                {discoveredJobs.map(job => (
                  <div key={job.id} className="p-6 md:p-8 bg-slate-950 border border-white/5 rounded-[2rem] flex items-center justify-between hover:border-white/20 transition-all">
                     <div>
                        <h4 className="text-[11px] md:text-sm font-black text-white uppercase truncate max-w-[180px] md:max-w-[250px] italic tracking-tighter">{job.role}</h4>
                        <p className="text-[8px] md:text-[10px] font-black text-slate-700 uppercase mt-1">{job.company}</p>
                     </div>
                     <button 
                        onClick={() => handleQueueRelay(job)} 
                        className="px-6 py-2 md:px-10 md:py-3 bg-white text-black text-[9px] font-black uppercase rounded-full hover:bg-indigo-600 hover:text-white transition-all shadow-lg active:scale-95"
                     >
                        {useBridgeRelay ? 'Dispatch' : 'Open'}
                     </button>
                  </div>
                ))}
             </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-950 border border-white/5 rounded-[3rem] md:rounded-[5rem] p-6 md:p-16 shadow-2xl space-y-12 animate-in fade-in duration-500">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="border-b border-white/5 opacity-50">
                  <th className="py-6 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Timestamp</th>
                  <th className="py-6 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Protocol</th>
                  <th className="py-6 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Target Node</th>
                  <th className="py-6 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] text-right">Payload Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sentRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-white/2 transition-colors">
                    <td className="py-8 text-[11px] font-mono text-slate-600">{new Date(record.timestamp).toLocaleString([], {month: 'short', day: '2-digit', hour: '2-digit', minute:'2-digit'})}</td>
                    <td className="py-8">
                       <span className="text-[9px] font-black text-indigo-400 uppercase border border-indigo-400/20 px-3 py-1 rounded-full">{record.type.split('_')[0]}</span>
                    </td>
                    <td className="py-8">
                       <h5 className="text-[12px] font-black text-white uppercase italic tracking-tighter">{record.recipient}</h5>
                       <p className="text-[8px] font-black text-slate-700 uppercase mt-0.5 truncate max-w-[200px]">{record.subject}</p>
                    </td>
                    <td className="py-8 text-right">
                      <button 
                        onClick={() => setViewingRecord(record)} 
                        className="px-8 py-2 bg-slate-900 border border-white/5 rounded-full text-[9px] font-black uppercase text-slate-500 hover:text-white transition-all"
                      >
                        Audit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewingRecord && (
        <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300" onClick={(e) => e.target === e.currentTarget && setViewingRecord(null)}>
           <div className="w-full max-w-5xl bg-white rounded-t-[3rem] md:rounded-[4rem] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-20 h-[90vh] md:h-auto">
              <div className="px-10 py-10 bg-slate-950 border-b border-white/10 flex justify-between items-center text-white shrink-0 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-3xl pointer-events-none"></div>
                 <div className="relative z-10">
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter truncate max-w-[60vw]">{viewingRecord.recipient}</h3>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] mt-2">Dossier Relay Audit_v7.2</p>
                 </div>
                 <button onClick={() => setViewingRecord(null)} className="p-4 text-slate-600 hover:text-white transition-all relative z-10">
                   <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 md:p-20 space-y-12 md:space-y-16 custom-scrollbar bg-slate-50">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Protocol Header</label>
                    <div className="text-xl md:text-3xl font-black text-slate-900 border-l-6 border-indigo-600 pl-8 italic tracking-tighter">{viewingRecord.subject}</div>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Transmitted Payload</label>
                    <div className="text-sm md:text-lg font-serif italic text-slate-700 leading-relaxed bg-white p-10 md:p-16 rounded-[3rem] border border-slate-200 shadow-xl whitespace-pre-wrap relative">
                       <div className="absolute top-6 right-8 text-[8px] font-black text-slate-200 uppercase tracking-widest pointer-events-none">CONFIDENTIAL_CORE</div>
                       {viewingRecord.payload || "Full operational dossier transmitted via autonomous Bridge protocol. No local copy required for stealth compliance."}
                    </div>
                 </div>
              </div>
              <div className="p-10 md:p-14 border-t border-slate-100 flex justify-center bg-white shrink-0">
                 <button onClick={() => setViewingRecord(null)} className="w-full md:w-auto bg-slate-900 text-white px-24 py-6 md:py-8 rounded-full font-black uppercase text-[11px] tracking-[0.5em] hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-500/10">Acknowledge Ledger</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MissionControl;
