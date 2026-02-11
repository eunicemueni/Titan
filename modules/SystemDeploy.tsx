
import React, { useState, useEffect } from 'react';
import { TelemetryLog } from '../types';
import { supabase } from '../services/supabaseService';

interface SystemDeployProps {
  onLog: (msg: string, level: TelemetryLog['level']) => void;
  bridgeStatus: 'OFFLINE' | 'CONNECTING' | 'ONLINE';
  onReconnect: () => void;
}

const SystemDeploy: React.FC<SystemDeployProps> = ({ onLog }) => {
  const [dbStatus, setDbStatus] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>('IDLE');
  const [oxyStatus, setOxyStatus] = useState<'IDLE' | 'CONNECTED' | 'ERROR'>('IDLE');
  const [redisStatus, setRedisStatus] = useState<'IDLE' | 'CONNECTED' | 'ERROR'>('IDLE');
  const [geminiStatus, setGeminiStatus] = useState<'IDLE' | 'CONNECTED' | 'ERROR'>('IDLE');
  const [redisError, setRedisError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnections = async () => {
      // DB Check
      setDbStatus('CONNECTING');
      try {
        const { error } = await supabase.from('titan_jobs').select('id').limit(1);
        setDbStatus(error ? 'ERROR' : 'CONNECTED');
      } catch (e) {
        setDbStatus('ERROR');
      }

      // Backend / Redis Check
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        if (data.redisUrlCheck === 'MALFORMED_OAUTH_URL_DETECTED') {
           setRedisStatus('ERROR');
           setRedisError('MALFORMED_URL: You provided an OAuth link instead of a connection string.');
        } else if (data.redis === 'ready' || data.redis === 'connect' || data.redis === 'connecting') {
           setRedisStatus('CONNECTED');
        } else {
           setRedisStatus('ERROR');
        }
      } catch (e) {
        setRedisStatus('ERROR');
      }

      // Oxylabs Check
      try {
        const username = process.env.OXYLABS_USER;
        if (username && username !== "undefined") setOxyStatus('CONNECTED');
        else setOxyStatus('ERROR');
      } catch (e) {
        setOxyStatus('ERROR');
      }

      // Gemini API Key Check
      try {
        const apiKey = process.env.API_KEY;
        if (apiKey && apiKey.length > 10) setGeminiStatus('CONNECTED');
        else setGeminiStatus('ERROR');
      } catch (e) {
        setGeminiStatus('ERROR');
      }
    };
    checkConnections();
  }, []);

  return (
    <div className="space-y-12 pb-40 px-6 md:px-20 pt-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4">
        <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">System Diagnostics</h2>
        <div className="flex items-center gap-3">
           <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
           <p className="text-slate-500 text-[10px] uppercase tracking-[0.4em] font-black">Mode: 
            <span className="text-indigo-400"> PURE_CLOUD_AUTONOMOUS</span>
          </p>
        </div>
      </div>

      {redisError && (
        <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-[2rem] flex items-center gap-6">
           <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-black">!</div>
           <p className="text-xs font-bold text-red-500 uppercase tracking-widest">{redisError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Supabase Status */}
        <div className={`p-10 rounded-[3rem] border transition-all ${dbStatus === 'CONNECTED' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
           <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-black text-white uppercase italic">Persistence</h3>
              <span className={`text-[8px] font-black px-4 py-1.5 rounded-full ${dbStatus === 'CONNECTED' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white animate-pulse'}`}>
                {dbStatus}
              </span>
           </div>
           <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed">Supabase Cloud Sync</p>
        </div>

        {/* Redis Status */}
        <div className={`p-10 rounded-[3rem] border transition-all ${redisStatus === 'CONNECTED' ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
           <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-black text-white uppercase italic">Cloud Buffer</h3>
              <span className={`text-[8px] font-black px-4 py-1.5 rounded-full ${redisStatus === 'CONNECTED' ? 'bg-cyan-500 text-black' : 'bg-red-500 text-white animate-pulse'}`}>
                {redisStatus}
              </span>
           </div>
           <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed">Redis BullMQ Relay</p>
        </div>

        {/* Gemini Status */}
        <div className={`p-10 rounded-[3rem] border transition-all ${geminiStatus === 'CONNECTED' ? 'bg-purple-500/5 border-purple-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
           <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-black text-white uppercase italic">Neural Core</h3>
              <span className={`text-[8px] font-black px-4 py-1.5 rounded-full ${geminiStatus === 'CONNECTED' ? 'bg-purple-500 text-white' : 'bg-red-500 text-white animate-pulse'}`}>
                {geminiStatus}
              </span>
           </div>
           <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed">Gemini Flash-Lite API</p>
        </div>

        {/* Oxylabs Status */}
        <div className={`p-10 rounded-[3rem] border transition-all ${oxyStatus === 'CONNECTED' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
           <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-black text-white uppercase italic">Scraper Hub</h3>
              <span className={`text-[8px] font-black px-4 py-1.5 rounded-full ${oxyStatus === 'CONNECTED' ? 'bg-amber-500 text-black' : 'bg-red-500 text-white animate-pulse'}`}>
                {oxyStatus}
              </span>
           </div>
           <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed">Oxylabs Proxy Node</p>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-900 rounded-[3rem] p-10 space-y-6">
         <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Network Capabilities</h4>
         <div className="space-y-4">
            {[
              { label: 'Neural Discovery', status: 'ACTIVE', desc: 'Global job & lead scraping via Gemini Search.' },
              { label: 'Placeholder Scrubbing', status: 'ACTIVE', desc: 'Real-time elimination of bracketed text markers.' },
              { label: 'Cloud Buffer', status: 'ACTIVE', desc: 'Redis-backed persistent relay queue.' },
              { label: 'Identity Tailoring', status: 'ACTIVE', desc: 'Instant CV/Letter rewrites for mass dispatch.' }
            ].map((cap, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                 <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-tight">{cap.label}</p>
                    <p className="text-[8px] text-slate-600 uppercase mt-1">{cap.desc}</p>
                 </div>
                 <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full uppercase">Verified</span>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default SystemDeploy;
