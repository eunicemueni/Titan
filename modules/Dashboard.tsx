
import React, { useMemo } from 'react';
import { UserProfile, JobRecord, AppView, SentRecord, AppAnalytics, TelemetryLog, Mission, QueueStatus } from '../types';

interface DashboardProps {
  profile: UserProfile;
  profiles: UserProfile[];
  activeIndex: number;
  onSwitchProfile: (index: number) => void;
  jobs: JobRecord[];
  sentRecords: SentRecord[];
  onNavigate: (view: AppView) => void;
  analytics: AppAnalytics;
  logs: TelemetryLog[];
  isAutopilot: boolean;
  onToggleAutopilot: () => void;
  missions: Mission[];
  queueStatus: QueueStatus;
  targetDailyCap: number;
  setTargetDailyCap: (val: number) => void;
  evasionStatus: string;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  profile, profiles, activeIndex, onSwitchProfile, jobs, sentRecords,
  onNavigate, isAutopilot, onToggleAutopilot, queueStatus, targetDailyCap, setTargetDailyCap, evasionStatus
}) => {
  const activeJobs = useMemo(() => jobs.filter(j => j.status !== 'skipped' && j.status !== 'completed'), [jobs]);
  
  const coreModules = [
    { id: AppView.JOB_SCANNER, name: 'Neural Discovery', desc: targetDailyCap >= 1000 ? 'UHF Lead Sourcing' : 'Precision Sourcing', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', color: 'border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5', active: isAutopilot },
    { id: AppView.OUTREACH, name: 'Hidden Hunter', desc: 'Bypassing Firewalls', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: 'border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-500/5', active: true },
    { id: AppView.INCOME_GIGS, name: 'Gig Pulse', desc: 'Flash High-Velocity', icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5', active: true },
    { id: AppView.INCOME_B2B, name: 'Revenue Machine', desc: 'Audit Logic Bypass', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2', color: 'border-slate-800 hover:border-purple-500/50 hover:bg-purple-500/5', active: true },
    { id: AppView.MARKET_NEXUS, name: 'Market Nexus', desc: 'Direct Board Relays', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5', active: true },
    { id: AppView.PROFILE, name: 'Identity Vault', desc: 'Neural DNA Assets', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', color: 'border-slate-800 hover:border-slate-500/50 hover:bg-slate-500/5', active: false },
  ];

  const themeText = profile.themeColor === 'cyan' ? 'text-cyan-400' : 'text-indigo-400';
  const themeBg = profile.themeColor === 'cyan' ? 'bg-cyan-600' : 'bg-indigo-600';
  const themeBorder = profile.themeColor === 'cyan' ? 'border-cyan-400' : 'border-indigo-400';
  const themeAccent = profile.themeColor === 'cyan' ? '#22d3ee' : '#6366f1';

  const capPresets = [50, 200, 500, 1000, 2000];

  return (
    <div className="p-10 lg:p-20 max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-700">
      
      {/* PERSONNEL SWITCHER */}
      <div className="bg-slate-900/40 border border-white/5 p-4 rounded-[3rem] flex items-center gap-6 overflow-x-auto no-scrollbar shadow-xl">
        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-6 hidden md:block shrink-0">Switch Personnel Mode:</span>
        <div className="flex gap-4">
          {profiles.map((p, idx) => (
            <button
              key={idx}
              onClick={() => onSwitchProfile(idx)}
              className={`flex items-center gap-4 px-8 py-4 rounded-[2rem] transition-all border shrink-0 ${
                activeIndex === idx 
                ? `${p.themeColor === 'cyan' ? 'bg-cyan-600 border-cyan-400 shadow-[0_0_20px_#22d3ee50]' : 'bg-indigo-600 border-indigo-400 shadow-[0_0_20_px_#6366f150]'} text-white` 
                : 'bg-black border-slate-800 text-slate-500 hover:border-slate-600'
              }`}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-slate-900">
                <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${p.fullName}`} alt="ava" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">{p.fullName}</p>
                <p className={`text-[7px] font-bold mt-1 uppercase tracking-widest ${activeIndex === idx ? 'text-white' : (p.themeColor === 'cyan' ? 'text-cyan-400' : 'text-indigo-400')}`}>
                  {p.domain}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className={`xl:col-span-8 bg-slate-950 border ${profile.themeColor === 'cyan' ? 'border-cyan-500/20 shadow-[0_0_50px_#22d3ee10]' : 'border-indigo-500/20 shadow-[0_0_50px_#6366f110]'} rounded-[4rem] p-12 shadow-2xl relative overflow-hidden group`}>
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className={`w-32 h-32 rounded-[3rem] p-2 shadow-2xl ${profile.themeColor === 'cyan' ? 'bg-cyan-600/10 border border-cyan-500/30 shadow-cyan-500/20' : 'bg-indigo-600/10 border border-indigo-500/30 shadow-indigo-500/20'}`}>
              <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${profile.fullName}`} alt="Avatar" className="w-full h-full rounded-[2.5rem]" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${themeText}`}>
                  {targetDailyCap >= 1000 ? 'UHF_Acquisition_Mode: ACTIVE' : 'Precision_Acquisition_Mode: ACTIVE'}
                </span>
                <span className={`h-1 flex-1 rounded-full ${profile.themeColor === 'cyan' ? 'bg-cyan-500/10' : 'bg-indigo-500/10'}`}></span>
              </div>
              <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">{profile.fullName}</h1>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">{profile.domain} specialist | Velocity: {targetDailyCap.toLocaleString()} dispatches/day</p>
              
              <div className="bg-black/40 border border-white/5 p-8 rounded-[3rem] space-y-6 mt-6">
                <div className="flex justify-between items-center">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Adjust Daily Target</p>
                  <span className={`text-xl font-black font-mono italic ${themeText}`}>{targetDailyCap.toLocaleString()} Applications</span>
                </div>
                <input 
                  type="range" min="1" max="2500" step="50"
                  value={targetDailyCap}
                  onChange={(e) => setTargetDailyCap(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: themeAccent }}
                />
                <div className="flex flex-wrap gap-2">
                  {capPresets.map(cap => (
                    <button key={cap} onClick={() => setTargetDailyCap(cap)} className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${targetDailyCap === cap ? (profile.themeColor === 'cyan' ? 'bg-cyan-600 border-cyan-400' : 'bg-indigo-600 border-indigo-400') + ' text-white shadow-lg' : 'bg-black border-slate-800 text-slate-600'}`}>{cap >= 1000 ? (cap/1000)+'K+' : cap}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 bg-slate-950 border border-white/5 rounded-[4rem] p-12 shadow-2xl flex flex-col justify-center space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Neural_Concurrency</h3>
            <div className={`w-2 h-2 rounded-full ${isAutopilot ? 'bg-emerald-500 animate-pulse' : 'bg-slate-800'}`}></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Discovery', color: 'bg-indigo-500', active: isAutopilot },
              { label: 'Flash Gigs', color: 'bg-amber-500', active: true },
              { label: 'Hunter', color: 'bg-cyan-500', active: true },
              { label: 'Nexus', color: 'bg-emerald-500', active: true },
            ].map((node, i) => (
              <div key={i} className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-all">
                <span className="text-[8px] font-black text-slate-600 uppercase">{node.label}</span>
                <div className={`w-2 h-2 rounded-full ${node.active ? node.color + ' animate-pulse shadow-[0_0_8px_currentColor]' : 'bg-slate-900'}`}></div>
              </div>
            ))}
          </div>

          <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${targetDailyCap >= 1000 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-slate-900 border-white/5'}`}>
             <span className={`text-[8px] font-black uppercase tracking-widest ${targetDailyCap >= 1000 ? 'text-amber-500' : 'text-slate-600'}`}>Evasion_Protocol</span>
             <span className={`text-[8px] font-black uppercase ${evasionStatus === 'ROTATING' ? 'text-amber-400' : 'text-emerald-500'}`}>{evasionStatus}</span>
          </div>

          <button onClick={onToggleAutopilot} className={`w-full py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${isAutopilot ? 'bg-red-500/10 text-red-500 border-red-500/20' : themeBg + ' text-white ' + themeBorder}`}>{isAutopilot ? 'Stop High-Freq Scrapers' : 'Engage Parallel Scrapers'}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Target Daily Cap', value: targetDailyCap.toLocaleString(), sub: 'UHF Acquisition Target', color: themeText, view: AppView.MISSION_CONTROL },
          { label: 'Applied Records', value: sentRecords.length.toString(), sub: 'View Dispatch Ledger', color: 'text-emerald-400', view: AppView.MISSION_CONTROL },
          { label: 'Concurrency Node', value: targetDailyCap >= 1000 ? 'UHF-5' : 'STABLE-1', sub: 'Parallel Threads', color: 'text-amber-400', view: AppView.MISSION_CONTROL },
          { label: 'Total Throughput', value: queueStatus.completed.toString(), sub: 'Successful Relays', color: 'text-purple-400', view: AppView.MISSION_CONTROL },
        ].map((kpi, i) => (
          <button key={i} onClick={() => onNavigate(kpi.view)} className="bg-slate-950 border border-white/5 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group text-left hover:border-white/20 transition-all">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">{kpi.label}</p>
            <h3 className={`text-4xl font-black ${kpi.color} italic tracking-tighter mb-2`}>{kpi.value}</h3>
            <p className="text-[8px] text-slate-700 font-black uppercase tracking-widest">{kpi.sub}</p>
            <div className="absolute bottom-6 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
               <svg className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {coreModules.map((mod) => (
          <button key={mod.id} onClick={() => onNavigate(mod.id)} className={`p-10 rounded-[4rem] border bg-slate-950/40 backdrop-blur-md transition-all text-left flex flex-col justify-between h-56 group shadow-2xl ${mod.color} relative overflow-hidden`}>
            {mod.active && <div className="absolute top-6 right-6 flex gap-1"><div className="w-1 h-1 bg-white rounded-full animate-bounce"></div><div className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></div></div>}
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors"><svg className="w-6 h-6 text-slate-500 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mod.icon} /></svg></div>
            <div><h4 className="text-sm font-black text-white uppercase tracking-widest mb-1 leading-none">{mod.name}</h4><p className="text-[9px] text-slate-600 font-bold uppercase tracking-tight leading-tight">{mod.desc}</p></div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
