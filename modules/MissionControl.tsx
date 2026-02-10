
import React, { useState, useMemo } from 'react';
import { UserProfile, JobRecord, Mission, TelemetryLog, SentRecord, IndustryType } from '../types';

interface MissionControlProps {
  profile: UserProfile;
  jobs: JobRecord[];
  setJobs: React.Dispatch<React.SetStateAction<JobRecord[]>>;
  onLog: (msg: string, level: TelemetryLog['level']) => void;
  onSent: (r: any) => void;
  isAutopilot: boolean;
  onToggleAutopilot: () => void;
  missions: Mission[];
}

const MissionControl: React.FC<MissionControlProps> = ({ 
  profile, jobs, setJobs, onLog, onSent, isAutopilot, onToggleAutopilot, missions 
}) => {
  const [viewingJob, setViewingJob] = useState<JobRecord | null>(null);

  const stats = useMemo(() => {
    return {
      totalDiscovered: jobs.length,
      readyForDispatch: jobs.filter(j => j.status === 'tailoring' || (j.status === 'discovered' && j.matchScore > 90)).length,
      completedToday: jobs.filter(j => j.status === 'completed').length
    };
  }, [jobs]);

  const handleDispatch = (job: JobRecord) => {
    if (!job.tailoredPackage) return;
    
    const subject = job.tailoredPackage.subject;
    const body = job.tailoredPackage.emailBody;
    const recipient = job.contactEmail || 'hr@corporate.com';

    // The "Relay" opens the user's email client
    window.open(`mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    
    onSent({
      type: 'JOB_APPLICATION',
      recipient: job.company,
      subject,
      industry: job.industry
    });

    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'completed' } : j));
    onLog(`RELAY TRIGGERED: System prepared dispatch for ${job.company}. Please press 'Send' in your email client.`, 'success');
    setViewingJob(null);
  };

  return (
    <div className="min-h-screen bg-[#02040a] p-6 md:p-12 space-y-12 pb-32">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">Mission Control</h1>
          <p className="text-indigo-500 text-[10px] font-black uppercase mt-3 tracking-[0.4em] flex items-center gap-3">
             <span className={`w-1.5 h-1.5 rounded-full ${isAutopilot ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-slate-700'}`}></span>
             Role Factory: {isAutopilot ? 'AI DISCOVERY ACTIVE' : 'SYSTEM_IDLE'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6">
           <div className="flex gap-4">
              <div className="bg-slate-900/50 border border-white/5 px-6 py-3 rounded-2xl text-center">
                 <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-1">Awaiting Launch</p>
                 <p className="text-lg font-black text-white">{stats.readyForDispatch}</p>
              </div>
              <div className="bg-slate-900/50 border border-white/5 px-6 py-3 rounded-2xl text-center">
                 <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-1">Total Mapped</p>
                 <p className="text-lg font-black text-white">{stats.totalDiscovered}</p>
              </div>
           </div>
           
           <button 
             onClick={onToggleAutopilot}
             className={`px-12 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] transition-all border shadow-2xl ${
               isAutopilot ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20'
             }`}
           >
             {isAutopilot ? 'Stop AI Discovery' : 'Engage Autonomous Scanning'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-8">
           <div className="bg-slate-950/80 border border-white/5 rounded-[3rem] p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-4">
                  <span className="w-10 h-[1px] bg-indigo-500"></span>
                  Lead Launch Deck
                </h3>
                <div className="text-[8px] font-black text-slate-700 uppercase tracking-widest border border-white/5 px-4 py-1 rounded-full">
                  Protocol: Human-Approved-Relay
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {jobs.filter(j => j.status !== 'completed').map(job => (
                    <div key={job.id} className={`p-8 rounded-[3.5rem] border transition-all flex flex-col justify-between min-h-[340px] relative group ${
                      job.status === 'tailoring' || job.matchScore > 90 ? 'bg-indigo-600/5 border-indigo-500/30 shadow-2xl' : 'bg-black/40 border-white/5'
                    }`}>
                       <div>
                          <div className="flex justify-between items-start mb-6">
                             <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-4 py-1 rounded-full">
                                {job.industry?.replace('_', ' ')}
                             </span>
                             {job.matchScore > 95 && (
                               <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">PREMIUM_MATCH</span>
                             )}
                          </div>
                          <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter truncate group-hover:text-indigo-400 transition-colors">{job.role}</h4>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1.5">{job.company}</p>
                          
                          <div className="mt-6 flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${job.status === 'tailoring' ? 'bg-indigo-500' : 'bg-slate-800'}`}></div>
                             <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">
                               {job.status === 'tailoring' ? 'AI TAILORING COMPLETE' : 'AWAITING NEURAL SYNC'}
                             </span>
                          </div>
                       </div>
                       
                       <div className="mt-10 flex gap-3">
                          <button 
                            onClick={() => setViewingJob(job)}
                            className="flex-1 py-4 bg-slate-900 border border-slate-800 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                          >
                             Audit Logic
                          </button>
                          <button 
                            onClick={() => handleDispatch(job)}
                            className="flex-[1.8] py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95"
                          >
                             LAUNCH RELAY
                          </button>
                       </div>
                    </div>
                 ))}
                 
                 {jobs.length === 0 && (
                   <div className="col-span-full py-40 text-center opacity-10">
                      <p className="text-5xl font-black uppercase tracking-[0.5em]">BUFFER_IDLE</p>
                      <p className="text-[12px] mt-8 uppercase font-black tracking-[0.2em]">Activate AI Discovery to populate the Launch Deck</p>
                   </div>
                 )}
              </div>
           </div>
        </div>

        <div className="space-y-8">
           <div className="bg-slate-950 border border-white/5 p-10 rounded-[3rem] shadow-xl">
              <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-8">AI Mission Status</h3>
              <div className="space-y-4">
                 {missions.map(m => (
                   <div key={m.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                      <div>
                         <p className="text-[9px] font-black text-white uppercase tracking-widest">{m.id.replace('_', ' ')}</p>
                         <p className="text-[7px] font-mono text-slate-600 mt-1 uppercase italic">{m.status}</p>
                      </div>
                      <div className={`w-2.5 h-2.5 rounded-full ${m.status === 'IDLE' ? 'bg-slate-900' : 'bg-indigo-500 animate-pulse shadow-[0_0_8px_#6366f1]'}`}></div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-indigo-600/5 border border-indigo-500/20 p-10 rounded-[3rem] shadow-2xl">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">Total Impact</h3>
              <div className="space-y-8">
                 <div className="flex justify-between items-end">
                    <div>
                      <p className="text-4xl font-black text-white italic tracking-tighter leading-none">
                        {profile.stats.coldEmailsSent + jobs.filter(j => j.status === 'completed').length}
                      </p>
                      <p className="text-[8px] font-black text-slate-700 uppercase mt-2 tracking-widest">Successful Relays</p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                 </div>
                 <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[72%] shadow-[0_0_10px_#6366f1]"></div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {viewingJob && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-12 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="w-full max-w-7xl h-full max-h-[92vh] bg-white rounded-[5rem] flex flex-col overflow-hidden shadow-2xl relative">
            <div className="px-16 py-12 border-b border-slate-100 flex justify-between items-center shrink-0 bg-white">
               <div className="flex items-center gap-8">
                  <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-xl">A</div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">AI Dispatch Review: {viewingJob.company}</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-2">Neural Link: {viewingJob.industry} | Persona: {profile.fullName}</p>
                  </div>
               </div>
               <button onClick={() => setViewingJob(null)} className="p-4 text-slate-300 hover:text-slate-900 transition-all">
                 <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 lg:p-24 bg-slate-50 custom-scrollbar">
               <div className="max-w-5xl mx-auto space-y-16">
                  {/* ASSET VERIFICATION PAYLOAD SECTION */}
                  <div className="bg-indigo-600 p-10 rounded-[3rem] shadow-2xl shadow-indigo-500/20 space-y-6">
                    <div className="flex items-center justify-between">
                       <h4 className="text-[10px] font-black text-white/60 uppercase tracking-[0.4em]">Integrated Asset Payload</h4>
                       <span className="px-4 py-1 bg-white/10 rounded-full text-[8px] font-black text-white uppercase tracking-widest">Linked for Dispatch</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="bg-white/10 border border-white/20 p-6 rounded-2xl flex items-center gap-6">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600">
                             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                          </div>
                          <div>
                             <p className="text-[8px] font-black text-white/60 uppercase tracking-widest mb-1">Dossier (CV) Link</p>
                             <p className="text-[11px] font-mono text-white truncate max-w-[300px]">{profile.dossierLink || 'NO_DOSSIER_LINK_WARNING'}</p>
                          </div>
                       </div>
                       <div className="bg-white/10 border border-white/20 p-6 rounded-2xl flex items-center gap-6">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600">
                             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
                          </div>
                          <div>
                             <p className="text-[8px] font-black text-white/60 uppercase tracking-widest mb-1">Portfolio Link</p>
                             <p className="text-[11px] font-mono text-white truncate max-w-[300px]">{profile.portfolioUrl}</p>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-[4rem] p-16 shadow-2xl space-y-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 px-10 py-4 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-[3rem]">Tailored Package Ready</div>
                    
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Target Recipient Node</label>
                       <div className="font-mono text-sm text-indigo-600 bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 truncate">{viewingJob.contactEmail || 'Auto-Generating Decision Node Email...'}</div>
                    </div>

                    <div className="space-y-6">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">The Strategic Pitch (Human-Ready)</label>
                       <div className="text-xl font-serif italic text-slate-800 leading-relaxed whitespace-pre-wrap bg-slate-50 p-10 rounded-[3rem] border border-slate-100">
                          {viewingJob.tailoredPackage?.emailBody || 'AI is currently synthesizing the optimal pitch based on your Vault assets...'}
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-slate-100">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">CV Asset Link</label>
                          <a href={profile.dossierLink} target="_blank" rel="noreferrer" className="block p-6 bg-slate-900 rounded-3xl text-indigo-400 font-bold hover:text-white transition-all truncate">
                             {profile.dossierLink}
                          </a>
                       </div>
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Portfolio Asset Node</label>
                          <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="block p-6 bg-slate-900 rounded-3xl text-indigo-400 font-bold hover:text-white transition-all truncate">
                             {profile.portfolioUrl}
                          </a>
                       </div>
                    </div>
                  </div>
               </div>
            </div>

            <div className="p-12 border-t border-slate-100 flex gap-8 justify-center bg-white shrink-0">
               <button 
                onClick={() => handleDispatch(viewingJob)}
                disabled={!viewingJob.tailoredPackage}
                className="bg-slate-900 text-white px-24 py-8 rounded-[3rem] font-black uppercase text-sm tracking-[0.4em] hover:bg-indigo-600 transition-all shadow-2xl disabled:opacity-20 active:scale-95"
               >
                 LAUNCH RELAY DISPATCH
               </button>
               <button onClick={() => setViewingJob(null)} className="px-12 py-8 border border-slate-200 text-slate-400 rounded-[3rem] font-black uppercase text-sm tracking-widest hover:text-slate-900 hover:border-slate-900 transition-all">Abort</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MissionControl;
