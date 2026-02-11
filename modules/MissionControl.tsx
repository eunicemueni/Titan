
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
  profile, jobs, sentRecords, setJobs, onLog, isAutopilot, onToggleAutopilot, queueStatus, targetDailyCap, evasionStatus 
}) => {
  const [activeTab, setActiveTab] = useState<'COMMAND' | 'LEDGER'>('COMMAND');
  const [viewingRecord, setViewingRecord] = useState<SentRecord | null>(null);

  const handleQueueRelay = async (job: JobRecord) => {
    onLog(`REDIS: Committed ${job.company} to Autonomous Bridge.`, 'info');
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'queued' } : j));
  };

  const queuedJobs = jobs.filter(j => j.status === 'queued');
  const discoveredJobs = jobs.filter(j => j.status === 'discovered');

  return (
    <div className="min-h-screen bg-[#02040a] p-6 md:p-12 space-y-12 pb-32 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
            {activeTab === 'COMMAND' ? 'Mission Control' : 'Dispatch Ledger'}
          </h1>
          <div className="flex items-center gap-4 mt-3">
             <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-indigo-500">Autonomous_Active</div>
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Target: {targetDailyCap.toLocaleString()} / day</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setActiveTab(activeTab === 'COMMAND' ? 'LEDGER' : 'COMMAND')} className="px-8 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all border bg-slate-900 text-slate-400 border-white/5">
            {activeTab === 'COMMAND' ? `View Sent Ledger (${sentRecords.length})` : 'Return to Command'}
          </button>
          {activeTab === 'COMMAND' && (
            <button onClick={onToggleAutopilot} className={`px-12 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all border ${isAutopilot ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'}`}>{isAutopilot ? 'Kill Autopilot' : 'Engage Autopilot'}</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-950 border border-white/5 p-8 rounded-[3rem] shadow-xl">
         <div className="p-6 border-r border-white/5"><p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Queue Waiting</p><h4 className="text-3xl font-black text-white">{queueStatus.waiting}</h4></div>
         <div className="p-6 border-r border-white/5"><p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">Active Workers</p><h4 className="text-3xl font-black text-indigo-400 animate-pulse">{queueStatus.active}</h4></div>
         <div className="p-6 border-r border-white/5"><p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Completed</p><h4 className="text-3xl font-black text-emerald-400">{queueStatus.completed}</h4></div>
         <div className="p-6"><p className="text-[9px] font-black text-cyan-500 uppercase tracking-widest mb-1">Evasion</p><h4 className="text-3xl font-black text-cyan-400">{evasionStatus}</h4></div>
      </div>

      {activeTab === 'COMMAND' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em] flex items-center gap-6"><span className="w-10 h-px bg-white/10"></span>Autopilot Buffer ({queuedJobs.length})</h3>
             <div className="space-y-4">
                {queuedJobs.map(job => (
                  <div key={job.id} className="p-6 bg-black/40 border border-amber-500/20 rounded-[2rem] flex items-center justify-between">
                     <div><h4 className="text-[11px] font-black text-white uppercase">{job.role}</h4><p className="text-[8px] font-black text-slate-600 uppercase mt-1">{job.company}</p></div>
                     <span className="text-[7px] font-mono text-amber-500 uppercase animate-pulse">AUTONOMOUS_RELAY</span>
                  </div>
                ))}
             </div>
          </div>
          <div className="space-y-8">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em] flex items-center gap-6"><span className="w-10 h-px bg-white/10"></span>Discovery Stream ({discoveredJobs.length})</h3>
             <div className="grid grid-cols-1 gap-4">
                {discoveredJobs.map(job => (
                  <div key={job.id} className="p-6 bg-slate-950 border border-white/5 rounded-[2rem] flex items-center justify-between">
                     <div><h4 className="text-[11px] font-black text-white uppercase">{job.role}</h4><p className="text-[8px] font-black text-slate-600 uppercase mt-1">{job.company}</p></div>
                     <button onClick={() => handleQueueRelay(job)} className="px-6 py-2 bg-white text-black text-[8px] font-black uppercase rounded-full">Commit</button>
                  </div>
                ))}
             </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-950 border border-white/5 rounded-[4rem] p-12 shadow-2xl space-y-8 animate-in slide-in-from-bottom-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="py-6 text-[9px] font-black text-slate-600 uppercase tracking-widest">Time</th>
                  <th className="py-6 text-[9px] font-black text-slate-600 uppercase tracking-widest">Protocol</th>
                  <th className="py-6 text-[9px] font-black text-slate-600 uppercase tracking-widest">Target</th>
                  <th className="py-6 text-[9px] font-black text-slate-600 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sentRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-white/2">
                    <td className="py-6 text-[10px] font-mono text-slate-500">{new Date(record.timestamp).toLocaleTimeString()}</td>
                    <td className="py-6 text-[8px] font-black text-indigo-400 uppercase">{record.type}</td>
                    <td className="py-6 text-[11px] font-black text-white uppercase">{record.recipient}</td>
                    <td className="py-6 text-right">
                      <button onClick={() => setViewingRecord(record)} className="px-6 py-2 bg-slate-900 border border-white/5 rounded-full text-[8px] font-black uppercase text-slate-400 hover:text-white">View Payload</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewingRecord && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8 bg-black/98 backdrop-blur-3xl animate-in fade-in">
           <div className="max-w-4xl w-full bg-white rounded-[4rem] flex flex-col overflow-hidden shadow-2xl">
              <div className="px-12 py-8 bg-slate-950 border-b border-white/10 flex justify-between items-center text-white">
                 <div>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none">{viewingRecord.recipient}</h3>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Status: ARCHIVED_DISPATCH</p>
                 </div>
                 <button onClick={() => setViewingRecord(null)} className="p-3 text-slate-500 hover:text-white transition-all"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12"/></svg></button>
              </div>
              <div className="flex-1 overflow-y-auto p-12 lg:p-16 space-y-10 custom-scrollbar max-h-[70vh]">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject line</label>
                    <div className="text-xl font-bold text-slate-900 border-l-4 border-indigo-500 pl-6">{viewingRecord.subject}</div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural Content Payload</label>
                    <div className="text-sm font-serif italic text-slate-700 leading-relaxed bg-slate-50 p-8 rounded-3xl border border-slate-100 whitespace-pre-wrap">
                       {viewingRecord.payload || "Full operational dispatch recorded. The AI-generated pitch and tailored credentials were transmitted via identity proxy."}
                    </div>
                 </div>
              </div>
              <div className="p-10 border-t border-slate-100 flex justify-center bg-white">
                 <button onClick={() => setViewingRecord(null)} className="bg-slate-900 text-white px-20 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.4em]">Close Archive</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MissionControl;
