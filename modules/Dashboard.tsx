
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
  // Added hubOnline property to resolve type mismatch in App.tsx
  hubOnline: boolean | null;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  profile, profiles, activeIndex, onSwitchProfile, jobs, sentRecords,
  onNavigate, isAutopilot, onToggleAutopilot, queueStatus, targetDailyCap, setTargetDailyCap, evasionStatus,
  // Added hubOnline to destructured props
  hubOnline
}) => {
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

  return (
    <div className="p-4 md:p-10 lg:p-20 max-w-[1600px] mx-auto space-y-8 md:space-y-12">
      
      {/* PERSONNEL SWITCHER */}
      <div className="bg-slate-900/20 border border-white/5 p-2 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar">
        <span className="text-[7px] md:text-[8px] font-black text-slate-600 uppercase tracking-widest ml-2 md:ml-4 shrink-0">Node:</span>
        <div className="flex gap-1 md:gap-2">
          {profiles.map((p, idx) => (
            <button
              key={idx}
              onClick={() => onSwitchProfile(idx)}
              className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl transition-all border shrink-0 ${
                activeIndex === idx 
                ? `${p.themeColor === 'cyan' ? 'bg-cyan-600/20 border-cyan-400 text-cyan-400' : 'bg-indigo-600/20 border-indigo-400 text-indigo-400'}` 
                : 'bg-black/40 border-slate-800 text-slate-600'
              }`}
            >
              <div className="w-4 h-4 md:w-5 md:h-5 rounded-full overflow-hidden border border-white/10 bg-slate-900">
                <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${p.fullName}`} alt="ava" />
              </div>
              <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest">{p.fullName.split(' ')[0]}</span>
            </button>
          ))}
        </div>
        {/* Hub Connection Indicator */}
        <div className="ml-auto pr-4 flex items-center gap-2">
           <div className={`w-1.5 h-1.5 rounded-full ${hubOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
           <span className="text-[7px] md:text-[8px] font-black text-slate-600 uppercase tracking-widest">
             {hubOnline ? 'Hub Online' : 'Hub Offline'}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-10">
        <div className={`xl:col-span-8 bg-slate-950 border ${profile.themeColor === 'cyan' ? 'border-cyan-500/20' : 'border-indigo-500/20'} rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 relative overflow-hidden group`}>
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 relative z-10">
            <div className={`w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl p-1 ${profile.themeColor === 'cyan' ? 'bg-cyan-600/10 border border-cyan-500/30' : 'bg-indigo-600/10 border border-indigo-500/30'}`}>
              <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${profile.fullName}`} alt="Avatar" className="w-full h-full rounded-xl md:rounded-2xl" />
            </div>
            <div className="flex-1 space-y-2 text-center md:text-left w-full">
              <h1 className="text-2xl md:text-4xl font-black text-white italic tracking-tighter uppercase leading-none">{profile.fullName}</h1>
              <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">{profile.domain}</p>
              
              <div className="bg-black/40 border border-white/5 p-4 md:p-6 rounded-2xl md:rounded-3xl space-y-4 mt-4 md:mt-6">
                <div className="flex justify-between items-center">
                  <p className="text-[7px] md:text-[8px] font-black text-slate-600 uppercase">Daily Cap</p>
                  <span className={`text-xs md:text-base font-black font-mono italic ${themeText}`}>{targetDailyCap} Apps</span>
                </div>
                <input 
                  type="range" min="1" max="2500" step="50"
                  value={targetDailyCap}
                  onChange={(e) => setTargetDailyCap(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: themeAccent }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 bg-slate-950 border border-white/5 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 flex flex-col justify-center space-y-4 md:space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Threads</h3>
            <div className={`w-1.5 h-1.5 rounded-full ${isAutopilot ? 'bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]' : 'bg-slate-800'}`}></div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'DISCOVERY', color: 'bg-indigo-500', active: isAutopilot },
              { label: 'GIGS', color: 'bg-amber-500', active: true },
              { label: 'HUNTER', color: 'bg-cyan-500', active: true },
              { label: 'NEXUS', color: 'bg-emerald-500', active: true },
            ].map((node, i) => (
              <div key={i} className="bg-black/40 border border-white/5 p-3 rounded-lg flex items-center justify-between">
                <span className="text-[7px] font-black text-slate-600 uppercase">{node.label}</span>
                <div className={`w-1 h-1 rounded-full ${node.active ? node.color : 'bg-slate-900'}`}></div>
              </div>
            ))}
          </div>

          <button onClick={onToggleAutopilot} className={`w-full py-3 md:py-4 rounded-xl md:rounded-2xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all border ${isAutopilot ? 'bg-red-500/10 text-red-500 border-red-500/20' : themeBg + ' text-white ' + themeBorder}`}>
            {isAutopilot ? 'Abort Scrapers' : 'Engage Autopilot'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        {[
          { label: 'Target Daily Cap', value: targetDailyCap.toLocaleString(), color: themeText, view: AppView.MISSION_CONTROL },
          { label: 'Applied Records', value: sentRecords.length.toString(), color: 'text-emerald-400', view: AppView.MISSION_CONTROL },
          { label: 'Concurrency', value: targetDailyCap >= 1000 ? 'UHF-5' : 'STABLE-1', color: 'text-amber-400', view: AppView.MISSION_CONTROL },
          { label: 'Completed', value: queueStatus.completed.toString(), color: 'text-purple-400', view: AppView.MISSION_CONTROL },
        ].map((kpi, i) => (
          <button key={i} onClick={() => onNavigate(kpi.view)} className="bg-slate-950 border border-white/5 p-4 md:p-8 rounded-2xl md:rounded-[2rem] text-left">
            <p className="text-[7px] md:text-[9px] font-black text-slate-600 uppercase mb-1">{kpi.label}</p>
            <h3 className={`text-xl md:text-3xl font-black ${kpi.color} italic tracking-tighter`}>{kpi.value}</h3>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6 pb-12">
        {coreModules.map((mod) => (
          <button key={mod.id} onClick={() => onNavigate(mod.id)} className={`p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border bg-slate-950/40 backdrop-blur-md transition-all text-left flex flex-col justify-between h-36 md:h-48 group ${mod.color}`}>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white/5 rounded-lg md:rounded-xl flex items-center justify-center mb-4"><svg className="w-4 h-4 md:w-5 md:h-5 text-slate-500 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mod.icon} /></svg></div>
            <div><h4 className="text-[9px] md:text-xs font-black text-white uppercase tracking-widest leading-none mb-1">{mod.name}</h4><p className="text-[7px] text-slate-600 font-bold uppercase tracking-tight line-clamp-1">{mod.desc}</p></div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
