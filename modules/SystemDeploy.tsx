import React, { useState, useEffect } from 'react';
import { TelemetryLog } from '../types';
import { supabase } from '../services/supabaseService';

interface SystemDeployProps {
  onLog: (msg: string, level: TelemetryLog['level']) => void;
  bridgeStatus: 'OFFLINE' | 'ONLINE';
  onReconnect: () => void;
}

const SystemDeploy: React.FC<SystemDeployProps> = ({ onLog: _onLog, bridgeStatus }) => {
  const [dbStatus, setDbStatus] = useState<'IDLE' | 'CONNECTED' | 'ERROR'>('IDLE');
  const [engineHealth, setEngineHealth] = useState<any>(null);
  
  const checkHealth = async () => {
    try {
      const { error } = await supabase.from('titan_jobs').select('id').limit(1);
      setDbStatus(error ? 'ERROR' : 'CONNECTED');

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
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-12 pb-40 px-6 md:px-20 pt-10 animate-in fade-in duration-1000 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-4">
           <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">Neural Link</h2>
           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em]">Autonomous Architecture Roadmap</p>
        </div>
        <div className="flex items-center gap-4">
           <div className={`px-6 py-3 rounded-2xl border flex items-center gap-3 transition-all ${bridgeStatus === 'ONLINE' ? 'border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-white/5 bg-slate-950'}`}>
              <div className={`w-2 h-2 rounded-full ${bridgeStatus === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-[9px] font-black text-white uppercase tracking-widest">Bridge: {bridgeStatus}</span>
           </div>
        </div>
      </div>

      {/* Deployment Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={`p-10 rounded-[3rem] border bg-slate-950 transition-all ${engineHealth?.status === 'ACTIVE' ? 'border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.1)]' : 'border-white/5'}`}>
           <div className="flex justify-between items-start mb-10">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Node 01: The Engine</span>
              <span className={`px-4 py-1.5 rounded-full text-[8px] font-black ${engineHealth?.status === 'ACTIVE' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                {engineHealth?.status || 'NOT_DETECTED'}
              </span>
           </div>
           <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">Autonomous Backend</h3>
           <p className="text-xs text-slate-500 leading-relaxed mb-8">
             Located in <code>services/server.js</code>. This is the "Worker" that performs scraping and job applications. Deployed as a Docker container.
           </p>
           <div className="space-y-3">
             <div className="p-4 bg-black/60 rounded-xl border border-white/5 font-mono text-[9px] text-slate-400">
                PUPPETEER_STATUS: {engineHealth?.status === 'ACTIVE' ? 'READY' : 'OFFLINE'}
             </div>
             <div className="p-4 bg-black/60 rounded-xl border border-white/5 font-mono text-[9px] text-slate-400">
                REDIS_UPLINK: {engineHealth?.redis || 'NOT_CONNECTED'}
             </div>
           </div>
        </div>

        <div className={`p-10 rounded-[3rem] border bg-slate-950 transition-all ${dbStatus === 'CONNECTED' ? 'border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.1)]' : 'border-white/5'}`}>
           <div className="flex justify-between items-start mb-10">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Node 02: Interface</span>
              <span className={`px-4 py-1.5 rounded-full text-[8px] font-black ${dbStatus === 'CONNECTED' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                {dbStatus === 'CONNECTED' ? 'SYNCED' : 'AWAITING_CLOUD'}
              </span>
           </div>
           <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">Command Dashboard</h3>
           <p className="text-xs text-slate-500 leading-relaxed mb-8">
             The frontend interface. It requires an environment variable <code>VITE_API_URL</code> pointing to Node 01.
           </p>
           <div className="flex items-center gap-4 text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-500/5 p-4 rounded-xl border border-cyan-500/10">
              <span className={`w-2 h-2 rounded-full ${dbStatus === 'CONNECTED' ? 'bg-cyan-500 animate-pulse' : 'bg-slate-800'}`}></span>
              Persistence Node: {dbStatus}
           </div>
        </div>
      </div>

      {/* Manual steps */}
      <div className="bg-slate-950 border border-white/5 rounded-[4rem] p-12 space-y-12 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] pointer-events-none"></div>
         <div className="space-y-2 relative z-10">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em]">System Deployment Protocol</h4>
            <p className="text-2xl font-black text-white uppercase italic tracking-tighter">Follow these steps on Render.com</p>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            <div className="space-y-6 p-8 bg-black/40 rounded-[2.5rem] border border-white/5 hover:border-indigo-500/20 transition-all group">
               <span className="text-indigo-500 font-black text-2xl italic group-hover:scale-110 transition-transform block">01. ENGINE</span>
               <div className="space-y-4">
                  <p className="text-[11px] text-white font-black uppercase tracking-widest">Deploy Web Service</p>
                  <ul className="text-[9px] text-slate-500 uppercase space-y-2 list-disc pl-4 leading-relaxed">
                     <li>Click "New Web Service"</li>
                     <li>Select "Docker" as runtime</li>
                     <li>Add Env: <b>API_KEY</b></li>
                     <li>Add Env: <b>REDIS_URL</b></li>
                  </ul>
               </div>
            </div>
            <div className="space-y-6 p-8 bg-black/40 rounded-[2.5rem] border border-white/5 hover:border-indigo-500/20 transition-all group">
               <span className="text-indigo-500 font-black text-2xl italic group-hover:scale-110 transition-transform block">02. LINK</span>
               <div className="space-y-4">
                  <p className="text-[11px] text-white font-black uppercase tracking-widest">Capture Node URL</p>
                  <p className="text-[9px] text-slate-500 uppercase leading-relaxed">
                     Once the Engine is live, copy its URL. You will need it for the next phase to bridge the two nodes.
                  </p>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 font-mono text-[8px] text-slate-700">
                    AWAITING_LINK...
                  </div>
               </div>
            </div>
            <div className="space-y-6 p-8 bg-black/40 rounded-[2.5rem] border border-white/5 hover:border-indigo-500/20 transition-all group">
               <span className="text-indigo-500 font-black text-2xl italic group-hover:scale-110 transition-transform block">03. INTERFACE</span>
               <div className="space-y-4">
                  <p className="text-[11px] text-white font-black uppercase tracking-widest">Deploy Static Site</p>
                  <ul className="text-[9px] text-slate-500 uppercase space-y-2 list-disc pl-4 leading-relaxed">
                     <li>Click "New Static Site"</li>
                     <li>Build: <code>npm run build</code></li>
                     <li>Publish: <code>dist</code></li>
                     <li>Add Env: <b>VITE_API_URL</b></li>
                  </ul>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default SystemDeploy;
