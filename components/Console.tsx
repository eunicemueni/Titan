
import React, { useEffect, useRef } from 'react';
import { TelemetryLog } from '../types';

interface ConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  logs: TelemetryLog[];
  bridgeStatus: 'OFFLINE' | 'CONNECTING' | 'ONLINE';
}

const Console: React.FC<ConsoleProps> = ({ isOpen, onClose, logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-8 right-8 w-full max-w-2xl h-[400px] z-[200] animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="h-full bg-black/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-3 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">TITAN_SYSTEM_CON</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[8px] font-mono text-slate-600 uppercase">Cloud_Core: Active</span>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Log Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 font-mono text-[10px] space-y-2 custom-scrollbar selection:bg-indigo-500/30">
          <div className="text-indigo-500/50 mb-4 border-b border-indigo-500/10 pb-2">
            TITAN OS KERNEL [Version 6.4.2-CLOUD]<br/>
            (c) 2025 TITAN Autonomous Systems. Pure Cloud Mode Active.
          </div>
          
          {logs.map((log) => (
            <div key={log.id} className="flex gap-4 animate-in fade-in slide-in-from-left-1">
              <span className="text-slate-700 shrink-0">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]</span>
              <span className={`
                ${log.level === 'error' ? 'text-red-400' : 
                  log.level === 'success' ? 'text-emerald-400 font-bold' : 
                  log.level === 'warning' ? 'text-amber-400' : 
                  'text-indigo-300/80'}
              `}>
                {log.message.toUpperCase()}
              </span>
            </div>
          ))}
          
          {logs.length === 0 && (
            <div className="text-slate-800 italic uppercase tracking-widest py-10 text-center">Awaiting Neural Pulse...</div>
          )}
        </div>

        {/* Command Input Simulation */}
        <div className="px-6 py-4 bg-black border-t border-white/5 flex items-center gap-3">
           <span className="text-indigo-500 font-black">❯</span>
           <input 
             type="text" 
             placeholder="Cloud Interface Ready..." 
             readOnly
             className="bg-transparent border-none outline-none text-slate-600 w-full text-[10px] uppercase font-black tracking-widest placeholder:text-slate-800"
           />
        </div>
      </div>
    </div>
  );
};

export default Console;
