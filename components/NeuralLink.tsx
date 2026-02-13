
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';

interface NeuralLinkProps {
  isActive: boolean;
  onClose: () => void;
}

const NeuralLink: React.FC<NeuralLinkProps> = ({ isActive, onClose }) => {
  const [transcription, setTranscription] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (isActive) {
      startLiveLink();
    } else {
      // Fix: Resolve session promise before calling close() to avoid TS error on Promise object
      geminiService.liveSession?.then(session => session.close());
    }
  }, [isActive]);

  const startLiveLink = async () => {
    setIsConnecting(true);
    try {
      await geminiService.connectLive(
        (text) => setTranscription(text),
        () => setTranscription('')
      );
    } catch (e) {
      console.error("Neural Link Failure:", e);
      onClose();
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="fixed bottom-20 md:bottom-10 right-4 md:right-10 z-[1000] flex flex-col items-end gap-3 md:gap-6 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/90 backdrop-blur-2xl border border-indigo-500/30 p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-[0_0_50px_rgba(99,102,241,0.2)] flex flex-row md:flex-col items-center gap-4 md:gap-6 max-w-[90vw] md:max-w-md">
        <div className="relative shrink-0">
           <div className={`w-10 h-10 md:w-24 md:h-24 bg-indigo-600 rounded-full ring-animate shadow-[0_0_30px_rgba(99,102,241,0.5)] flex items-center justify-center`}>
              <svg className="w-4 h-4 md:w-10 md:h-10 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
           </div>
           {isConnecting && (
              <div className="absolute inset-0 border-2 md:border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
           )}
        </div>
        
        <div className="flex-1 md:text-center space-y-1 md:space-y-2 overflow-hidden">
           <h3 className="text-[7px] md:text-[10px] font-black text-indigo-400 uppercase tracking-widest md:tracking-[0.5em]">{isConnecting ? 'CONNECTING' : 'LINK_LIVE'}</h3>
           <div className="h-8 md:h-16 flex items-center md:justify-center overflow-hidden">
             <p className="text-[10px] md:text-sm italic text-slate-400 leading-tight font-serif truncate md:whitespace-normal">
               {transcription || (isConnecting ? 'Establishing proxy...' : 'Speak command...')}
             </p>
           </div>
        </div>

        <button onClick={onClose} className="p-2 md:px-8 md:py-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[8px] md:text-[9px] font-black uppercase rounded-full hover:bg-red-500 hover:text-white transition-all">
          <span className="hidden md:inline">Terminate</span>
          <svg className="md:hidden w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
  );
};

export default NeuralLink;
