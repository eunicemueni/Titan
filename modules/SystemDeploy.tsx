
import React from 'react';
import { TelemetryLog } from '../types';

interface SystemDeployProps {
  onLog: (msg: string, level: TelemetryLog['level']) => void;
  bridgeStatus: 'OFFLINE' | 'CONNECTING' | 'ONLINE';
  onReconnect: () => void;
}

const SystemDeploy: React.FC<SystemDeployProps> = ({ onLog, bridgeStatus }) => {
  return (
    <div className="space-y-12 pb-40 px-6 md:px-20 pt-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4">
        <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Cloud Node Status</h2>
        <div className="flex items-center gap-3">
           <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
           <p className="text-slate-500 text-[10px] uppercase tracking-[0.4em] font-black">Mode: 
            <span className="text-indigo-400"> PURE_CLOUD_AUTONOMOUS</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="p-10 rounded-[3rem] bg-indigo-600/5 border border-indigo-500/20 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.45L19.15 19H4.85L12 5.45zM11 16h2v2h-2v-2zm0-7h2v5h-2V9z"/></svg>
          </div>
          <h3 className="text-xl font-black text-white uppercase italic mb-4">Mobile Optimization Active</h3>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            TITAN OS has detected you are on a mobile device. The requirement for a local Node.js bridge has been bypassed. All neural processing is now routed through the <span className="text-indigo-400">TITAN Cloud Core</span>.
          </p>
          <div className="mt-8 flex gap-6">
             <div className="text-center">
                <p className="text-white font-black text-xl">100%</p>
                <p className="text-[7px] text-slate-600 uppercase font-black tracking-widest">Cloud Relay</p>
             </div>
             <div className="text-center">
                <p className="text-white font-black text-xl">0ms</p>
                <p className="text-[7px] text-slate-600 uppercase font-black tracking-widest">Local Latency</p>
             </div>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-900 rounded-[3rem] p-10 space-y-6">
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mobile Capability Matrix</h4>
           <div className="space-y-4">
              {[
                { label: 'Neural Discovery', status: 'ACTIVE', desc: 'Global job & lead scraping via Gemini Search.' },
                { label: 'Identity Tailoring', status: 'ACTIVE', desc: 'Instant CV/Letter rewrites for mobile dispatch.' },
                { label: 'One-Tap Relay', status: 'ACTIVE', desc: 'Direct mailto: integration for zero-bridge applies.' },
                { label: 'Simulated Browsing', status: 'ACTIVE', desc: 'AI-driven telemetry without physical browser nodes.' }
              ].map((cap, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                   <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-tight">{cap.label}</p>
                      <p className="text-[8px] text-slate-600 uppercase mt-1">{cap.desc}</p>
                   </div>
                   <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">ONLINE</span>
                </div>
              ))}
           </div>
        </div>
      </div>
      
      <div className="p-10 bg-indigo-600 rounded-[3rem] text-white">
         <h4 className="text-2xl font-black uppercase italic tracking-tighter mb-4">You are ready.</h4>
         <p className="text-xs font-bold uppercase tracking-widest leading-relaxed opacity-80">
            No laptop needed. Use the "Auto Pilot Applier" or "Pitch Machine" to start generating income or securing roles. When you click "Relay," your phone will automatically open your email with everything ready to send.
         </p>
      </div>
    </div>
  );
};

export default SystemDeploy;
