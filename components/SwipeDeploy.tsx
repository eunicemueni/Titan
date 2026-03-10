import React, { useState } from 'react';

interface SwipeDeployProps {
  onConfirm: () => void;
  onCancel: () => void;
  label: string;
  themeColor?: string;
}

const SwipeDeploy: React.FC<SwipeDeployProps> = ({ onConfirm, onCancel, label, themeColor = 'amber' }) => {
  const [isConfirmed, setIsConfirmed] = useState(false);

  return (
    <div 
      className="fixed inset-0 z-[1100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300"
    >
        <div className="w-full max-w-sm space-y-8 text-center bg-slate-900 border border-white/10 p-12 rounded-[3rem] shadow-2xl">
          <div className="space-y-4">
             <div className={`w-16 h-16 mx-auto rounded-full border-2 flex items-center justify-center ${themeColor === 'amber' ? 'border-amber-500/50 text-amber-500' : 'border-indigo-500/50 text-indigo-500'}`}>
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Authorize Dispatch</h2>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
               Confirm deployment of {label} to the <br/> Autonomous Bridge
             </p>
          </div>

          <button 
            onClick={() => {
              setIsConfirmed(true);
              setTimeout(onConfirm, 300);
            }}
            disabled={isConfirmed}
            className={`w-full py-6 rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] transition-all shadow-xl ${isConfirmed ? 'bg-slate-800 text-slate-500' : 'bg-amber-500 text-black hover:bg-amber-400'}`}
          >
            {isConfirmed ? 'DEPLOYING...' : 'CONFIRM DEPLOYMENT'}
          </button>

          <button 
            onClick={onCancel}
            className="text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-white transition-colors"
          >
            Abort Protocol
          </button>
        </div>
    </div>
  );
};

export default SwipeDeploy;