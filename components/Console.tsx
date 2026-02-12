import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, TelemetryLog, AppView } from '../types';
import { geminiService } from '../services/geminiService';

interface ConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onLog: (msg: string, level: TelemetryLog['level']) => void;
  autopilot: boolean;
  setAutopilot: (val: boolean) => void;
  dailyCap: number;
  setDailyCap: (val: number) => void;
  setView: (view: AppView) => void;
  evasionStatus: string;
}

const Console: React.FC<ConsoleProps> = ({ 
  isOpen, onClose, profile, onLog, autopilot, setAutopilot, dailyCap, setDailyCap, setView, evasionStatus 
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{ text: string; type: 'cmd' | 'resp' | 'sys' }[]>([
    { text: 'TITAN OS KERNEL v7.0.0 INITIALIZED...', type: 'sys' },
    { text: 'UPLINK ESTABLISHED. WAITING FOR COMMAND.', type: 'sys' }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  if (!isOpen) return null;

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const cmd = input.trim().toLowerCase();
    setInput('');
    setHistory(prev => [...prev, { text: `> ${input.trim()}`, type: 'cmd' }]);

    if (cmd === 'clear') {
      setHistory([{ text: 'CONSOLE BUFFER CLEARED.', type: 'sys' }]);
      return;
    }

    if (cmd === 'help') {
      setHistory(prev => [...prev, { 
        text: `COMMAND REGISTRY:
- status: Diagnostic brief
- autopilot [on/off]: Toggle node
- cap [num]: Set daily target
- view [id]: Switch view
- clear: Purge buffer
- help: Show this list`, 
        type: 'resp' 
      }]);
      return;
    }

    if (cmd === 'status') {
      setHistory(prev => [...prev, { 
        text: `DIAGNOSTIC:
CMD: ${profile.fullName.toUpperCase()}
AUTOPILOT: ${autopilot ? 'ON' : 'OFF'}
CAP: ${dailyCap}/DAY
UPTIME: ${Math.floor(performance.now() / 1000)}s`, 
        type: 'resp' 
      }]);
      return;
    }

    if (cmd.startsWith('autopilot ')) {
      const mode = cmd.split(' ')[1];
      if (mode === 'on') {
        setAutopilot(true);
        setHistory(prev => [...prev, { text: 'AUTOPILOT_ON', type: 'sys' }]);
      } else if (mode === 'off') {
        setAutopilot(false);
        setHistory(prev => [...prev, { text: 'AUTOPILOT_OFF', type: 'sys' }]);
      }
      return;
    }

    if (cmd.startsWith('cap ')) {
      const val = parseInt(cmd.split(' ')[1]);
      if (!isNaN(val)) {
        setDailyCap(val);
        setHistory(prev => [...prev, { text: `CAP_SET: ${val}`, type: 'sys' }]);
      }
      return;
    }

    if (cmd.startsWith('view ')) {
      const v = cmd.split(' ')[1];
      const viewMap: Record<string, AppView> = {
        'dashboard': AppView.DASHBOARD,
        'mission': AppView.MISSION_CONTROL,
        'scanner': AppView.JOB_SCANNER,
        'hunter': AppView.OUTREACH,
        'nexus': AppView.MARKET_NEXUS,
        'hub': AppView.INCOME_B2B,
        'gigs': AppView.INCOME_GIGS,
        'vault': AppView.PROFILE
      };
      if (viewMap[v]) {
        setView(viewMap[v]);
        setHistory(prev => [...prev, { text: `SHIFT: ${v.toUpperCase()}`, type: 'sys' }]);
        onClose();
      } else {
        setHistory(prev => [...prev, { text: `ERR: NO_VIEW_${v}`, type: 'sys' }]);
      }
      return;
    }

    setLoading(true);
    try {
      const response = await geminiService.processConsoleCommand(cmd, profile);
      setHistory(prev => [...prev, { text: response, type: 'resp' }]);
      onLog(`CMD_EXEC: ${cmd}`, 'info');
    } catch (err) {
      setHistory(prev => [...prev, { text: 'ERR: TRACE_TIMED_OUT', type: 'sys' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 md:p-12 bg-black/80 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-4xl h-[90vh] md:h-[600px] bg-[#02040a] border border-indigo-500/30 rounded-2xl md:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-white/5 flex justify-between items-center bg-indigo-950/20 shrink-0">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-[8px] md:text-[10px] font-black text-indigo-400 uppercase tracking-widest">TITAN_SYSTEM_CONSOLE</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-600 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 p-4 md:p-8 font-mono text-[10px] md:text-xs overflow-y-auto custom-scrollbar space-y-3 md:space-y-4 bg-black/40">
          {history.map((item, i) => (
            <div key={i} className={`whitespace-pre-wrap leading-relaxed ${
              item.type === 'cmd' ? 'text-indigo-400 font-bold' : 
              item.type === 'sys' ? 'text-slate-500 italic text-[8px]' : 
              'text-slate-300'
            }`}>
              {item.text}
            </div>
          ))}
          {loading && <div className="text-indigo-500 animate-pulse text-[8px] md:text-[10px]">Processing trace...</div>}
        </div>

        <form onSubmit={handleCommand} className="p-3 md:p-4 bg-indigo-950/10 border-t border-white/5 flex items-center gap-2 md:gap-4 shrink-0">
          <span className="text-indigo-500 font-black text-[10px] md:text-sm">~$</span>
          <input 
            autoFocus
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Awaiting directive..."
            className="flex-1 bg-transparent border-none outline-none text-white font-mono placeholder:text-slate-800 text-[10px] md:text-sm"
          />
        </form>
      </div>
    </div>
  );
};

export default Console;