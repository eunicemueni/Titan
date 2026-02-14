import React, { useState, useEffect } from 'react';
import { TelemetryLog } from '../types';
import { supabase } from '../services/supabaseService';

interface SystemDeployProps {
  onLog: (msg: string, level: TelemetryLog['level']) => void;
  bridgeStatus: 'OFFLINE' | 'ONLINE';
  onReconnect: () => void;
}

const SystemDeploy: React.FC<SystemDeployProps> = ({ onLog, bridgeStatus }) => {
  const [dbStatus, setDbStatus] = useState<'IDLE' | 'CONNECTED' | 'ERROR'>('IDLE');
  const [engineHealth, setEngineHealth] = useState<any>(null);
  
  const checkHealth = async () => {
    try {
      // Check Supabase
      const { error } = await supabase.from('titan_jobs').select('id').limit(1);
      setDbStatus(error ? 'ERROR' : 'CONNECTED');

      // Check Engine (Backend)
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setEngineHealth(data);
      } else {
        setEngineHealth({ status: 'OFFLINE' });
      }
    } catch (e) {
      setDbStatus('ERROR');
      setEngineHealth({ status: 'OFFLINE' });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-12 pb-40 px-6 md:px-20 pt-10 animate-in fade-in duration-1000 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-4">
           <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">Bridge Console</h2>
           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em]">Autonomous System Architecture</p>
        </div>
        <div className="flex items-center gap-4">
           <div className={`px-6 py-3 rounded-2xl border flex items-center gap-3 transition-all ${bridgeStatus === 'ONLINE' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 bg-slate-950'}`}>
              <div className={`w-2 h-2 rounded-full ${bridgeStatus === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-[9px] font-black text-white uppercase tracking-widest">Neural Link: {bridgeStatus}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* The Engine Card */}
        <div className={`p-10 rounded-[3rem] border bg-slate-950 transition-all ${engineHealth?.status === 'ACTIVE' ? 'border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.1)]' : 'border-white/5'}`}>
           <div className="flex justify-between items-start mb-10">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Phase 01: The Engine</span>
              <span className={`px-4 py-1.5 rounded-full text-[8px] font-black ${engineHealth?.status === 'ACTIVE' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                {engineHealth?.status || 'OFFLINE'}
              </span>
           </div>
           <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">Autonomous Backend</h3>
           <p className="text-xs text-slate-500 leading-relaxed mb-8">
             Located in <code>services/server.js</code>. This is the "Brain" that runs the Puppeteer workers. It requires a Redis instance to manage missions.
           </p>
           <div className="space-y-3">
             <div className="p-4 bg-black/60 rounded-xl border border-white/5 font-mono text-[9px] text-slate-400">
                WORKER_SYNC: {engineHealth?.worker || 'AWAITING_RELAY'}
             </div>
             <div className="p-4 bg-black/60 rounded-xl border border-white/5 font-mono text-[9px] text-slate-400">
                REDIS_NODE: {engineHealth?.redis || 'AWAITING_LINK'}
             </div>
           </div>
        </div>

        {/* The Interface Card */}
        <div className={`p-10 rounded-[3rem] border bg-slate-950 transition-all ${dbStatus === 'CONNECTED' ? 'border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.1)]' : 'border-white/5'}`}>
           <div className="flex justify-between items-start mb-10">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Phase 02: The Interface</span>
              <span className={`px-4 py-1.5 rounded-full text-[8px] font-black ${dbStatus === 'CONNECTED' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                {dbStatus === 'CONNECTED' ? 'LOCKED' : 'SYNC_ERROR'}
              </span>
           </div>
           <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">Command Dashboard</h3>
           <p className="text-xs text-slate-500 leading-relaxed mb-8">
             This is the static frontend you are using right now. It connects to Phase 01 via the Neural Bridge Link.
           </p>
           <div className="flex items-center gap-4 text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-500/5 p-4 rounded-xl border border-cyan-500/10">
              <span className={`w-2 h-2 rounded-full ${dbStatus === 'CONNECTED' ? 'bg-cyan-500 animate-pulse' : 'bg-slate-800'}`}></span>
              Persistence Node: {dbStatus}
           </div>
        </div>
      </div>

      <div className="bg-slate-950 border border-white/5 rounded-[4rem] p-12 space-y-10 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] pointer-events-none"></div>
         <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em]">Two-Phase Deployment Blueprint</h4>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            <div className="space-y-4 p-8 bg-black/40 rounded-[2.5rem] border border-white/5 hover:border-indigo-500/20 transition-all group">
               <span className="text-indigo-500 font-black text-2xl italic group-hover:scale-110 transition-transform block">01.</span>
               <p className="text-[11px] text-white font-black uppercase tracking-widest">Deploy Engine (Web)</p>
               <p className="text-[9px] text-slate-600 uppercase leading-relaxed">
                 Deploy <code>services/server.js</code> on Render as a <b>Web Service (Docker)</b>. Add your Gemini Key to the env vars.
               </p>
            </div>
            <div className="space-y-4 p-8 bg-black/40 rounded-[2.5rem] border border-white/5 hover:border-indigo-500/20 transition-all group">
               <span className="text-indigo-500 font-black text-2xl italic group-hover:scale-110 transition-transform block">02.</span>
               <p className="text-[11px] text-white font-black uppercase tracking-widest">Link Neural Bridge</p>
               <p className="text-[9px] text-slate-600 uppercase leading-relaxed">
                 Once Phase 01 is live, copy its URL. This is the API endpoint for your dashboard.
               </p>
            </div>
            <div className="space-y-4 p-8 bg-black/40 rounded-[2.5rem] border border-white/5 hover:border-indigo-500/20 transition-all group">
               <span className="text-indigo-500 font-black text-2xl italic group-hover:scale-110 transition-transform block">03.</span>
               <p className="text-[11px] text-white font-black uppercase tracking-widest">Deploy Interface (Static)</p>
               <p className="text-[9px] text-slate-600 uppercase leading-relaxed">
                 Deploy the root as a <b>Static Site</b>. Add <code>VITE_API_URL</code> pointing to your Phase 01 URL.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default SystemDeploy;