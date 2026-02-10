
import React, { useMemo } from 'react';
import { UserProfile, JobRecord, AppView, SentRecord, AppAnalytics, TelemetryLog, Mission } from '../types';

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
}

const Dashboard: React.FC<DashboardProps> = ({ 
  profile, profiles, activeIndex, onSwitchProfile, jobs, sentRecords, 
  onNavigate, logs, isAutopilot, onToggleAutopilot, missions 
}) => {
  const activeJobs = useMemo(() => jobs.filter(j => j.status !== 'skipped' && j.status !== 'completed'), [jobs]);
  
  const projectedValue = useMemo(() => {
    return activeJobs.reduce((acc, curr) => acc + (curr.matchScore * 1250), 0);
  }, [activeJobs]);

  const activeMission = useMemo(() => missions.find(m => m.status === 'SCANNING' || m.status === 'SCRAPING_EMAILS' || m.status === 'DISPATCHING'), [missions]);

  const coreModules = [
    { 
      id: AppView.JOB_SCANNER, 
      name: 'Neural Discovery', 
      desc: 'Autonomous Lead Sourcing', 
      icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', 
      color: 'border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5' 
    },
    { 
      id: AppView.OUTREACH, 
      name: 'Hidden Hunter', 
      desc: 'Strategic Relay Outreach', 
      icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', 
      color: 'border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-500/5' 
    },
    { 
      id: AppView.INCOME_B2B, 
      name: 'Revenue Machine', 
      desc: 'B2B Deficit Analysis', 
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2', 
      color: 'border-slate-800 hover:border-purple-500/50 hover:bg-purple-500/5' 
    },
    { 
      id: AppView.MARKET_NEXUS, 
      name: 'Market Nexus', 
      desc: 'Board-Ready Proposals', 
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', 
      color: 'border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5' 
    },
    { 
      id: AppView.PROFILE, 
      name: 'Identity Vault', 
      desc: 'Master DNA Assets', 
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', 
      color: 'border-slate-800 hover:border-slate-500/50 hover:bg-slate-500/5' 
    },
    { 
      id: AppView.VAULT_SYNC, 
      name: 'Vault Status', 
      desc: 'System Core Metrics', 
      icon: 'M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4', 
      color: 'border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5' 
    },
  ];

  const personaTheme = profile.themeColor === 'cyan' ? 'cyan' : 'indigo';
  const themeHex = profile.themeColor === 'cyan' ? '#22d3ee' : '#6366f1';
  const themeBg = profile.themeColor === 'cyan' ? 'bg-cyan-600' : 'bg-indigo-600';
  const themeBorder = profile.themeColor === 'cyan' ? 'border-cyan-400' : 'border-indigo-400';
  const themeText = profile.themeColor === 'cyan' ? 'text-cyan-400' : 'text-indigo-400';

  return (
    <div className="p-10 lg:p-20 max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-700">
      
      {/* PERSONNEL SWITCHER - High Visibility for Ayana Inniss discovery */}
      <div className="bg-slate-900/40 border border-white/5 p-4 rounded-[3rem] flex items-center gap-6 overflow-x-auto no-scrollbar shadow-xl">
        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-6 hidden md:block shrink-0">Switch Personnel Mode:</span>
        <div className="flex gap-4">
          {profiles.map((p, idx) => (
            <button
              key={idx}
              onClick={() => onSwitchProfile(idx)}
              className={`flex items-center gap-4 px-8 py-4 rounded-[2rem] transition-all border shrink-0 ${
                activeIndex === idx 
                ? `${p.themeColor === 'cyan' ? 'bg-cyan-600 border-cyan-400 shadow-[0_0_20px_#22d3ee50]' : 'bg-indigo-600 border-indigo-400 shadow-[0_0_20px_#6366f150]'} text-white` 
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

      {/* Active Personnel DNA Summary */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className={`xl:col-span-8 bg-slate-950 border ${profile.themeColor === 'cyan' ? 'border-cyan-500/20 shadow-[0_0_50px_#22d3ee10]' : 'border-indigo-500/20 shadow-[0_0_50px_#6366f110]'} rounded-[4rem] p-12 shadow-2xl relative overflow-hidden group`}>
          <div className={`absolute top-0 right-0 w-64 h-64 blur-[100px] pointer-events-none ${profile.themeColor === 'cyan' ? 'bg-cyan-600/5' : 'bg-indigo-600/5'}`}></div>
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className={`w-32 h-32 rounded-[3rem] p-2 shadow-2xl ${profile.themeColor === 'cyan' ? 'bg-cyan-600/10 border border-cyan-500/30 shadow-cyan-500/20' : 'bg-indigo-600/10 border border-indigo-500/30 shadow-indigo-500/20'}`}>
              <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${profile.fullName}`} alt="Avatar" className="w-full h-full rounded-[2.5rem]" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${themeText}`}>Active_Personnel_DNA</span>
                <span className={`h-1 flex-1 rounded-full ${profile.themeColor === 'cyan' ? 'bg-cyan-500/10' : 'bg-indigo-500/10'}`}></span>
              </div>
              <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">{profile.fullName}</h1>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">{profile.domain} specialist</p>
              <div className="flex flex-wrap gap-4 pt-2">
                <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-6 py-2.5 bg-black border border-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">
                  LinkedIn
                </a>
                <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-6 py-2.5 bg-black border border-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">
                  Portfolio
                </a>
                <a href={profile.dossierLink} target="_blank" rel="noreferrer" className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white transition-all shadow-xl ${themeBg} ${themeBorder} ${profile.themeColor === 'cyan' ? 'shadow-cyan-500/20 hover:bg-cyan-400' : 'shadow-indigo-500/20 hover:bg-indigo-500'}`}>
                  View Dossier (CV)
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Neural Cycle Monitor */}
        <div className="xl:col-span-4 bg-slate-950 border border-white/5 rounded-[4rem] p-12 shadow-2xl flex flex-col justify-center space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Neural_Cycle_Pulse</h3>
            <div className={`w-2 h-2 rounded-full ${isAutopilot ? (profile.themeColor === 'cyan' ? 'bg-cyan-500 shadow-[0_0_8px_#22d3ee]' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]') : 'bg-slate-800'} animate-pulse`}></div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-[11px] font-black text-white uppercase italic">{isAutopilot ? (activeMission?.currentTask || 'Establishing Multi-Node Link...') : 'System Idle'}</span>
              <span className="text-[8px] font-mono text-slate-700">{isAutopilot ? '94%' : '0%'}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-1000 ${isAutopilot ? 'animate-pulse' : 'w-0'} ${profile.themeColor === 'cyan' ? 'bg-cyan-500' : 'bg-indigo-500'}`} style={{ width: isAutopilot ? '94%' : '0%' }}></div>
            </div>
            <p className="text-[8px] text-slate-700 font-black uppercase tracking-widest">
              {isAutopilot ? `TITAN is autonomously scanning for ${profile.themeColor === 'cyan' ? 'Data' : 'Actuarial'} roles.` : 'Engage autopilot to initiate autonomous discovery.'}
            </p>
          </div>

          <button 
            onClick={onToggleAutopilot}
            className={`w-full py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
              isAutopilot 
              ? 'bg-red-500/10 text-red-500 border-red-500/20' 
              : `${themeBg} text-white ${themeBorder} shadow-xl ${profile.themeColor === 'cyan' ? 'shadow-cyan-500/20' : 'shadow-indigo-500/20'}`
            }`}
          >
            {isAutopilot ? 'Terminate Missions' : 'Engage Autopilot'}
          </button>
        </div>
      </div>

      {/* KPI Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Pipeline Yield', value: `$${projectedValue.toLocaleString()}`, sub: 'High Fidelity Potential', color: profile.themeColor === 'cyan' ? 'text-cyan-400' : 'text-indigo-400' },
          { label: 'Core Revenue', value: `$${profile.stats.totalRevenue.toLocaleString()}`, sub: 'Realized Closed Gains', color: 'text-emerald-400' },
          { label: 'Active Leads', value: activeJobs.length.toString(), sub: 'In Discovery Buffer', color: profile.themeColor === 'cyan' ? 'text-cyan-400' : 'text-cyan-400' },
          { label: 'Mission Relays', value: sentRecords.length.toString(), sub: 'Total Outreach Transmissions', color: 'text-purple-400' },
        ].map((kpi, i) => (
          <div key={i} className="bg-slate-950 border border-white/5 p-10 rounded-[3.5rem] shadow-2xl hover:border-white/10 transition-all group overflow-hidden relative">
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl group-hover:bg-white/10 transition-colors ${profile.themeColor === 'cyan' ? 'bg-cyan-500/5' : 'bg-indigo-500/5'}`}></div>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">{kpi.label}</p>
            <h3 className={`text-4xl font-black ${kpi.color} italic tracking-tighter mb-2`}>{kpi.value}</h3>
            <p className="text-[8px] text-slate-700 font-black uppercase tracking-widest">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Grid of Navigation Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {coreModules.map((mod) => (
          <button 
            key={mod.id}
            onClick={() => onNavigate(mod.id)}
            className={`p-10 rounded-[4rem] border bg-slate-950/40 backdrop-blur-md transition-all text-left flex flex-col justify-between h-56 group shadow-2xl ${mod.color}`}
          >
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors">
              <svg className="w-6 h-6 text-slate-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mod.icon} />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1 leading-none">{mod.name}</h4>
              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tight leading-tight">{mod.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Main Ledger Section */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {/* Activity Ledger */}
        <div className="xl:col-span-8 space-y-8">
          <div className="bg-slate-950 border border-white/5 rounded-[4rem] p-12 shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em]">Transmission Ledger</h3>
              <button onClick={() => onNavigate(AppView.MISSION_CONTROL)} className={`text-[10px] font-black transition-all uppercase tracking-widest px-6 py-2 border rounded-full ${profile.themeColor === 'cyan' ? 'text-cyan-400 border-cyan-500/20 hover:border-cyan-400' : 'text-indigo-400 border-indigo-500/20 hover:border-indigo-400'}`}>Enter Mission Control</button>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-6">
              {sentRecords.slice(0, 10).map(record => (
                <div key={record.id} className="p-6 bg-black border border-white/5 rounded-[2.5rem] flex items-center justify-between hover:border-white/10 transition-all group">
                  <div className="flex items-center gap-6">
                    <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${profile.themeColor === 'cyan' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-tight">{record.recipient}</p>
                      <p className="text-[9px] text-slate-600 mt-1 uppercase font-bold tracking-widest">{record.type.replace('_', ' ')} • {record.subject.substring(0, 45)}...</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter italic">Relay Successful</span>
                    <p className="text-[9px] font-mono text-slate-800 mt-1 uppercase">{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
              {sentRecords.length === 0 && (
                <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-20">
                  <p className="text-xl font-black uppercase tracking-[0.5em]">Ledger Empty</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Telemetry */}
        <div className="xl:col-span-4 space-y-8">
          <div className="bg-slate-950 border border-white/5 rounded-[4rem] p-12 h-full flex flex-col shadow-2xl relative overflow-hidden">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] mb-10 flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full ${profile.themeColor === 'cyan' ? 'bg-cyan-500' : 'bg-indigo-500'}`}></div>
              Neural Telemetry
            </h3>
            
            <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-6 font-mono text-[10px] leading-relaxed selection:bg-indigo-500/20">
              {logs.map(log => (
                <div key={log.id} className={`flex gap-4 ${
                  log.level === 'error' ? 'text-red-400' : 
                  log.level === 'success' ? 'text-emerald-400' : 
                  log.level === 'warning' ? 'text-amber-400' : 'text-slate-700 font-bold'
                }`}>
                  <span className="text-slate-900 shrink-0">[{new Date(log.timestamp).toLocaleTimeString([], {hour12: false})}]</span>
                  <span className="uppercase tracking-tight">{log.message}</span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center py-32 text-slate-900 uppercase font-black tracking-widest opacity-30">Awaiting Neural Pulse...</div>
              )}
            </div>
            
            <div className="mt-12 pt-8 border-t border-white/5">
              <div className="flex items-center gap-3 text-[10px] font-black text-slate-800 italic uppercase">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Secure Node_v6.4 Verified
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
