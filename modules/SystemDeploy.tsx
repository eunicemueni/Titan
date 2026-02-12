import React, { useState, useEffect } from 'react';
import { TelemetryLog } from '../types';
import { supabase } from '../services/supabaseService';

interface SystemDeployProps {
  onLog: (msg: string, level: TelemetryLog['level']) => void;
  bridgeStatus: 'OFFLINE' | 'CONNECTING' | 'ONLINE';
  onReconnect: () => void;
}

const SystemDeploy: React.FC<SystemDeployProps> = ({ onLog }) => {
  const [dbStatus, setDbStatus] = useState<'IDLE' | 'CONNECTED' | 'ERROR'>('IDLE');
  const [hubStatus, setHubStatus] = useState<'IDLE' | 'CONNECTED' | 'ERROR'>('IDLE');
  const [redisStatus, setRedisStatus] = useState<'IDLE' | 'CONNECTED' | 'ERROR'>('IDLE');
  const [geminiStatus, setGeminiStatus] = useState<'IDLE' | 'CONNECTED' | 'ERROR'>('IDLE');
  
  const [activeSpec, setActiveSpec] = useState<'DOCKER' | 'RENDER' | 'VARS'>('VARS');

  useEffect(() => {
    const checkConnections = async () => {
      try {
        const { error } = await supabase.from('titan_jobs').select('id').limit(1);
        setDbStatus(error ? 'ERROR' : 'CONNECTED');
      } catch (e) { setDbStatus('ERROR'); }

      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setHubStatus('CONNECTED');
        setRedisStatus(data.redis === 'ready' || data.redis === 'connect' ? 'CONNECTED' : 'ERROR');
      } catch (e) { 
        setHubStatus('ERROR');
        setRedisStatus('ERROR'); 
      }

      setGeminiStatus(process.env.API_KEY ? 'CONNECTED' : 'ERROR');
    };
    checkConnections();
    const interval = setInterval(checkConnections, 5000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onLog(`COPIED: ${label} cached to clipboard.`, "success");
  };

  const dockerContent = `FROM node:20-slim
RUN apt-get update && apt-get install -y chromium libxss1 --no-install-recommends
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
RUN npm run build
EXPOSE 3001
CMD ["node", "server.js"]`;

  return (
    <div className="space-y-12 pb-40 px-4 md:px-20 pt-10 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-4">
           <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">Deployment War Room</h2>
           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Core Infrastructure Diagnostics & Recovery</p>
        </div>
        <div className="flex gap-4">
           <button onClick={() => setActiveSpec('VARS')} className={`px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeSpec === 'VARS' ? 'bg-white text-black' : 'bg-slate-900 text-slate-500'}`}>Variables</button>
           <button onClick={() => setActiveSpec('DOCKER')} className={`px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeSpec === 'DOCKER' ? 'bg-white text-black' : 'bg-slate-900 text-slate-500'}`}>Dockerfile</button>
           <button onClick={() => setActiveSpec('RENDER')} className={`px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeSpec === 'RENDER' ? 'bg-white text-black' : 'bg-slate-900 text-slate-500'}`}>Render Blueprints</button>
        </div>
      </div>

      {hubStatus === 'ERROR' && (
        <div className="p-10 bg-red-500/10 border border-red-500/20 rounded-[3rem] space-y-6">
           <div className="flex items-center gap-4">
              <span className="w-10 h-10 bg-red-500 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-red-500/20">!</span>
              <h3 className="text-xl font-black text-red-500 uppercase tracking-widest italic">Node Link Broken (100% Diagnostic Found)</h3>
           </div>
           <p className="text-sm text-slate-400 font-bold uppercase leading-relaxed max-w-4xl">
              Static site hosts (Vercel/Netlify) **cannot run the TITAN Server**. 
              You must use a platform that supports **Docker** or **Web Services** to enable background job relays and neural link audio.
           </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        {[
          { label: 'Server Hub', status: hubStatus, color: 'indigo', desc: 'Active Node Process' },
          { label: 'Cloud Buffer', status: redisStatus, color: 'cyan', desc: 'Redis Mission Queue' },
          { label: 'Neural Core', status: geminiStatus, color: 'purple', desc: 'Gemini v3 API' },
          { label: 'Persistence', status: dbStatus, color: 'emerald', desc: 'Supabase Data Link' }
        ].map(node => (
          <div key={node.label} className={`p-8 md:p-10 rounded-[3rem] border transition-all duration-700 ${node.status === 'CONNECTED' ? `bg-${node.color}-500/5 border-${node.color}-500/20 shadow-2xl shadow-${node.color}-500/5` : 'bg-red-500/10 border-red-500/30'}`}>
            <h3 className="text-lg font-black text-white uppercase italic mb-1">{node.label}</h3>
            <p className="text-[8px] font-bold text-slate-700 uppercase tracking-widest mb-6">{node.desc}</p>
            <div className="flex items-center justify-between">
              <span className={`text-[8px] font-black px-4 py-1.5 rounded-full ${node.status === 'CONNECTED' ? `bg-${node.color}-500 text-white shadow-lg` : 'bg-red-500 text-white'}`}>
                {node.status}
              </span>
              <div className={`w-1 h-1 rounded-full ${node.status === 'CONNECTED' ? 'bg-white animate-ping' : 'bg-slate-800'}`}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-950 border border-white/5 rounded-[4rem] p-12 space-y-12 shadow-2xl">
         {activeSpec === 'VARS' && (
           <div className="animate-in fade-in zoom-in-95 duration-500 space-y-12">
              <div className="flex justify-between items-center">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Environment Variables</h4>
                 <button onClick={() => copyToClipboard('API_KEY, REDIS_URL, PORT', 'Var Keys')} className="text-[7px] font-black text-indigo-400 hover:text-white transition-colors">Copy Keys Only</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="p-8 bg-black/40 rounded-3xl border border-white/5 space-y-4">
                    <span className="text-[9px] font-black text-white uppercase">API_KEY</span>
                    <p className="text-[8px] text-slate-600 uppercase tracking-widest leading-relaxed">Required for Gemini Neural Processing. Obtained from ai.google.dev.</p>
                 </div>
                 <div className="p-8 bg-black/40 rounded-3xl border border-white/5 space-y-4">
                    <span className="text-[9px] font-black text-white uppercase">REDIS_URL</span>
                    <p className="text-[8px] text-slate-600 uppercase tracking-widest leading-relaxed">Required for Mission Buffer. TITAN provides an embedded URL in the core, but you can override it.</p>
                 </div>
              </div>
           </div>
         )}

         {activeSpec === 'DOCKER' && (
            <div className="animate-in fade-in zoom-in-95 duration-500 space-y-8">
               <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em]">The Iron Link (Dockerfile)</h4>
                  <button onClick={() => copyToClipboard(dockerContent, 'Dockerfile')} className="px-6 py-2 bg-indigo-600 text-white text-[8px] font-black uppercase rounded-full shadow-lg">Copy Dockerfile</button>
               </div>
               <div className="bg-black rounded-3xl p-8 border border-white/5">
                  <pre className="text-[10px] font-mono text-slate-400 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    {dockerContent}
                  </pre>
               </div>
               <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed text-center">
                 This file ensures Chromium is installed in the cloud OS. Without it, autonomous navigation will fail.
               </p>
            </div>
         )}

         {activeSpec === 'RENDER' && (
            <div className="animate-in fade-in zoom-in-95 duration-500 space-y-8">
               <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.5em]">One-Click Blueprint (render.yaml)</h4>
               </div>
               <div className="p-10 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl space-y-6">
                  <h5 className="text-white text-[11px] font-black uppercase italic tracking-tighter">Instructions for Render.com</h5>
                  <ol className="list-decimal list-inside text-[10px] text-slate-400 font-bold uppercase space-y-4 tracking-widest leading-loose">
                     <li>Create a file named <span className="text-white">render.yaml</span> in your repo root.</li>
                     <li>Paste the Render Blueprint code from the core file.</li>
                     <li>Go to Render Dashboard &gt; <span className="text-white">Blueprints</span> &gt; <span className="text-white">New Blueprint Instance</span>.</li>
                     <li>Render will automatically setup the Server, Redis, and Port 3001.</li>
                  </ol>
               </div>
            </div>
         )}
      </div>
    </div>
  );
};

export default SystemDeploy;