
import React, { useMemo, useEffect, useState, useRef } from 'react';
import { UserProfile, JobRecord, AppView, SentRecord, AppAnalytics, TelemetryLog, QueueStatus } from '../types';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { geminiService, decodeAudioData } from '../services/geminiService';

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
  queueStatus: QueueStatus;
  targetDailyCap: number;
  setTargetDailyCap: (val: number) => void;
  evasionStatus: string;
  hubOnline: boolean | null;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  profile, profiles, activeIndex, onSwitchProfile, jobs, sentRecords,
  onNavigate, isAutopilot, onToggleAutopilot, queueStatus, targetDailyCap, setTargetDailyCap, evasionStatus,
  hubOnline, analytics
}) => {
  const [pulseScale, setPulseScale] = useState(1);
  const [isBriefing, setIsBriefing] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!isAutopilot) return;
    const interval = setInterval(() => {
      setPulseScale(1.1);
      setTimeout(() => setPulseScale(1), 200);
    }, 1500);
    return () => clearInterval(interval);
  }, [isAutopilot]);

  const decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  const handleStartBriefing = async () => {
    if (isBriefing) return;
    setIsBriefing(true);
    try {
      // 1. Initialize Context ON CLICK to satisfy browser safety
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = ctx;
      if (ctx.state === 'suspended') await ctx.resume();

      // 2. Fetch Strategic DNA
      const base64Audio = await geminiService.generateStrategicBriefing(profile, jobs.length, profile.stats.totalRevenue);
      if (base64Audio) {
        const decodedBytes = decode(base64Audio);
        const audioBuffer = await decodeAudioData(decodedBytes, ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start();
        source.onended = () => {
          setIsBriefing(false);
          ctx.close();
        };
      } else {
        setIsBriefing(false);
      }
    } catch (e) {
      console.error("Strategic Briefing Node Failure:", e);
      setIsBriefing(false);
    }
  };

  const chartData = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      name: `T-${12-i}h`,
      probability: 40 + Math.random() * 55,
      shadowNodes: Math.floor(Math.random() * 15) + 2
    }));
  }, [targetDailyCap]);

  const coreModules = [
    { id: AppView.JOB_SCANNER, name: 'Neural Scanner', desc: 'Public Discovery Uplinks', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', color: 'border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5' },
    { id: AppView.OUTREACH, name: 'Hidden Hunter', desc: 'Shadow Market Targets', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: 'border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-500/5' },
    { id: AppView.MISSION_CONTROL, name: 'Mission Deck', desc: 'Active Queue Hub', icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5' },
    { id: AppView.INCOME_B2B, name: 'Revenue Hub', desc: 'B2B Deficit Audit', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2', color: 'border-slate-800 hover:border-purple-500/50 hover:bg-purple-500/5' },
    { id: AppView.PROFILE, name: 'Identity Vault', desc: 'Manage Neural DNA', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', color: 'border-slate-800 hover:border-slate-500/50 hover:bg-slate-500/5' },
  ];

  const shadowYield = sentRecords.filter(r => r.type === 'COL_OUTREACH' || r.type === 'B2B_PITCH').length;
  const publicYield = sentRecords.filter(r => r.type === 'JOB_APPLICATION').length;

  return (
    <div className="p-4 md:p-8 lg:p-12 xl:p-16 max-w-[1800px] mx-auto space-y-8 md:space-y-12 relative overflow-hidden">
      
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
        <path d="M 10% 20% Q 30% 10% 50% 30% T 90% 20%" fill="none" stroke="url(#lineGradient)" strokeWidth="0.5" className="animate-pulse" />
        <path d="M 5% 80% Q 25% 70% 45% 90% T 85% 80%" fill="none" stroke="url(#lineGradient)" strokeWidth="0.5" />
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>

      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center bg-slate-900/10 backdrop-blur-md p-4 rounded-3xl border border-white/5 relative z-10">
        <div className="flex gap-2 items-center overflow-x-auto no-scrollbar pb-2 lg:pb-0">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mr-4">Node Identity:</span>
          {profiles.map((p, idx) => (
            <button
              key={idx}
              onClick={() => onSwitchProfile(idx)}
              className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-all border shrink-0 ${
                activeIndex === idx 
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]' 
                : 'bg-black border-slate-800 text-slate-600 hover:border-slate-600'
              }`}
            >
              <div className="w-5 h-5 rounded-full overflow-hidden border border-white/10">
                <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${p.fullName}`} alt="ava" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{p.fullName.split(' ')[0]}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-6 pr-4">
           <button 
             onClick={handleStartBriefing} 
             disabled={isBriefing}
             className={`flex items-center gap-3 px-6 py-2.5 rounded-full border transition-all ${isBriefing ? 'bg-amber-500 border-amber-400 text-black animate-pulse' : 'bg-black border-white/10 text-slate-400 hover:text-white hover:border-white/30'}`}
           >
              <svg className={`w-4 h-4 ${isBriefing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
              <span className="text-[9px] font-black uppercase tracking-widest">{isBriefing ? 'Neural Briefing Live' : 'Initiate Strategic Briefing'}</span>
           </button>
           <div className="h-10 w-px bg-white/5"></div>
           <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-slate-700 uppercase">Neural Uplink</span>
              <div className="flex items-center gap-2">
                 <span className={`w-1.5 h-1.5 rounded-full ${hubOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                 <span className={`text-[10px] font-black uppercase tracking-tighter ${hubOnline ? 'text-emerald-500' : 'text-red-500'}`}>
                   {hubOnline ? 'Synced' : 'Offline'}
                 </span>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-12 relative z-10">
        <div className="xl:col-span-8 space-y-8 md:space-y-12">
          <div className="bg-slate-950 border border-white/5 rounded-[3rem] md:rounded-[4rem] p-8 md:p-12 relative overflow-hidden group shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(99,102,241,0.03),_transparent_70%)] pointer-events-none"></div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter leading-none uppercase">Neural Pulse</h1>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.4em]">Shadow Network Trace Activity</p>
              </div>
              <div className="flex gap-4">
                 <div className="flex items-center gap-4 bg-black/40 p-4 rounded-3xl border border-white/5">
                   <div className="pr-2">
                      <p className="text-[8px] font-black text-indigo-400 uppercase mb-1">Public Yield</p>
                      <p className="text-2xl font-black text-white italic leading-none">{publicYield}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-4 bg-black/40 p-4 rounded-3xl border border-cyan-500/30">
                   <div className="pr-2">
                      <p className="text-[8px] font-black text-cyan-400 uppercase mb-1">Shadow Yield</p>
                      <p className="text-2xl font-black text-white italic leading-none">{shadowYield}</p>
                   </div>
                 </div>
              </div>
            </div>

            <div className="h-[300px] md:h-[400px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip contentStyle={{ backgroundColor: '#0d1117', border: '1px solid #30363d', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="probability" stroke="#6366f1" fillOpacity={1} fill="url(#colorProb)" strokeWidth={3} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreModules.map(mod => (
              <button 
                key={mod.id}
                onClick={() => onNavigate(mod.id)}
                className={`flex flex-col justify-between p-8 rounded-[3rem] border bg-slate-950 transition-all group ${mod.color}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={mod.icon} /></svg>
                </div>
                <div>
                   <h3 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">{mod.name}</h3>
                   <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2">{mod.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="xl:col-span-4 space-y-8 md:space-y-12">
          <div className="bg-slate-950 border border-white/5 rounded-[3rem] p-10 flex flex-col justify-between min-h-[400px] shadow-2xl relative group">
             <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[3rem]"></div>
             <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Command Autopilot</h3>
                   <div className={`w-3 h-3 rounded-full ${isAutopilot ? 'bg-indigo-500 animate-pulse' : 'bg-slate-800'}`}></div>
                </div>
                <div className="space-y-1">
                   <p className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">{isAutopilot ? 'ACTIVE' : 'STANDBY'}</p>
                   <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">Global Relay Protocol: v7.0.1</p>
                </div>
             </div>
             
             <div className="relative z-10 py-10">
                <div className="flex justify-between items-center mb-3">
                   <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Daily Node Cap</span>
                   <span className="text-sm font-black text-white">{targetDailyCap}</span>
                </div>
                <input 
                  type="range" min="10" max="500" value={targetDailyCap} 
                  onChange={(e) => setTargetDailyCap(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 h-1 bg-slate-900 rounded-full appearance-none cursor-pointer"
                />
             </div>

             <button 
               onClick={onToggleAutopilot}
               className={`relative z-10 w-full py-6 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.4em] transition-all shadow-xl ${isAutopilot ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-black hover:bg-indigo-500 hover:text-white'}`}
             >
               {isAutopilot ? 'TERMINATE_MISSION' : 'INITIATE_DEPLOYMENT'}
             </button>
          </div>

          <div className="bg-black border border-white/5 rounded-[3rem] p-10 space-y-10 shadow-inner">
             <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em]">Telemetry Stream</h3>
             <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
                {analytics.activeLeads === 0 && (
                   <div className="flex gap-4 font-mono text-[9px] text-slate-600 italic">
                      <span>[SYNC]</span>
                      <span>Awaiting active node identification...</span>
                   </div>
                )}
                {/* Fallback logs for visual density */}
                <div className="flex gap-4 font-mono text-[9px] text-indigo-800">
                   <span>[NODE]</span>
                   <span>Proxy bridge established via Cloud node 0x7F4</span>
                </div>
                <div className="flex gap-4 font-mono text-[9px] text-emerald-800">
                   <span>[AUTH]</span>
                   <span>Identity Vault: DNA Integrity 100%</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
