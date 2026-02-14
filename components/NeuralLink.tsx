
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';

interface NeuralLinkProps {
  isActive: boolean;
  onClose: () => void;
}

const NeuralLink: React.FC<NeuralLinkProps> = ({ isActive, onClose }) => {
  const [transcription, setTranscription] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);

  useEffect(() => {
    if (isActive) {
      startLiveLink();
    } else {
      setIsSessionActive(false);
      geminiService.liveSession?.then(session => {
        if (session && typeof session.close === 'function') {
          session.close();
        }
      }).catch(() => {});
    }
  }, [isActive]);

  const startLiveLink = async () => {
    setIsConnecting(true);
    try {
      const session = await geminiService.connectLive(
        (text) => setTranscription(text),
        () => setTranscription('')
      );
      if (session) {
        setIsSessionActive(true);
      }
    } catch (e) {
      console.error("Neural Link Hardware Failure:", e);
      onClose();
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="fixed bottom-20 md:bottom-10 right-4 md:right-10 z-[1000] flex flex-col items-end gap-3 md:gap-6 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-2xl border border-indigo-500/30 p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-[0_0_80px_rgba(99,102,241,0.25)] flex flex-row md:flex-col items-center gap-4 md:gap-6 max-w-[90vw] md:max-w-md relative overflow-hidden">
        
        {/* Connection Animation Ring */}
        <div className="relative shrink-0">
           <div className={`w-12 h-12 md:w-28 md:h-28 rounded-full flex items-center justify-center transition-all duration-700 ${
             isSessionActive ? 'bg-indigo-600 shadow-[0_0_40px_rgba(99,102,241,0.6)]' : 'bg-slate-800'
           }`}>
              <svg className={`w-5 h-5 md:w-12 md:h-12 text-white ${isSessionActive ? 'animate-pulse' : 'opacity-20'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
           </div>
           {isConnecting && (
              <div className="absolute inset-0 border-2 md:border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
           )}
        </div>
        
        <div className="flex-1 md:text-center space-y-1 md:space-y-2 overflow-hidden">
           <h3 className={`text-[7px] md:text-[10px] font-black uppercase tracking-widest md:tracking-[0.5em] ${isSessionActive ? 'text-indigo-400' : 'text-slate-600'}`}>
             {isConnecting ? 'ESTABLISHING_UPLINK' : isSessionActive ? 'NEURAL_LINK_ACTIVE' : 'LINK_OFFLINE'}
           </h3>
           <div className="h-10 md:h-20 flex items-center md:justify-center overflow-hidden">
             <p className="text-[10px] md:text-sm italic text-slate-400 leading-tight font-serif truncate md:whitespace-normal">
               {transcription || (isConnecting ? 'Bypassing corporate firewalls...' : 'Neural bridge established. Speak command.')}
             </p>
           </div>
        </div>

        <button 
          onClick={onClose} 
          className="p-2.5 md:px-10 md:py-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[8px] md:text-[10px] font-black uppercase rounded-full hover:bg-red-500 hover:text-white transition-all shadow-xl active:scale-95"
        >
          <span className="hidden md:inline tracking-[0.2em]">Terminate Link</span>
          <svg className="md:hidden w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
  );
};

export default NeuralLink;
