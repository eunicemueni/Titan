import React, { useState, useRef, useEffect } from 'react';

interface SwipeDeployProps {
  onConfirm: () => void;
  onCancel: () => void;
  label: string;
  themeColor?: string;
}

const SwipeDeploy: React.FC<SwipeDeployProps> = ({ onConfirm, onCancel, label, themeColor = 'amber' }) => {
  const [swipeX, setSwipeX] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const themeClasses = {
    amber: 'bg-amber-500 shadow-amber-500/50',
    indigo: 'bg-indigo-600 shadow-indigo-600/50',
    cyan: 'bg-cyan-500 shadow-cyan-500/50'
  }[themeColor as 'amber' | 'indigo' | 'cyan'] || 'bg-amber-500';

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isConfirmed) return;
    const touch = e.touches[0];
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(touch.clientX - rect.left - 24, rect.width - 72));
    setSwipeX(x);

    if (x >= rect.width - 80) {
      setIsConfirmed(true);
      setSwipeX(rect.width - 72);
      setTimeout(onConfirm, 300);
    }
  };

  const handleTouchEnd = () => {
    if (!isConfirmed) {
      setSwipeX(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-sm space-y-12 text-center">
        <div className="space-y-4">
           <div className={`w-16 h-16 mx-auto rounded-full border-2 flex items-center justify-center animate-pulse ${themeColor === 'amber' ? 'border-amber-500/50 text-amber-500' : 'border-indigo-500/50 text-indigo-500'}`}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
           </div>
           <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Authorize Dispatch</h2>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
             Slide to commit {label} to the <br/> Autonomous Bridge
           </p>
        </div>

        <div 
          ref={containerRef}
          className="relative h-20 bg-white/5 border border-white/10 rounded-full p-2 flex items-center overflow-hidden"
        >
          <div 
            className="absolute inset-y-2 left-2 right-2 rounded-full bg-gradient-to-r from-transparent to-white/5 pointer-events-none"
          ></div>
          
          <div 
            className={`absolute left-2 w-16 h-16 rounded-full flex items-center justify-center z-10 touch-none transition-transform duration-75 ${themeClasses}`}
            style={{ transform: `translateX(${swipeX}px)` }}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </div>

          <div className="w-full text-center">
             <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] ml-16">
               {isConfirmed ? 'DEPLOYING...' : 'Slide to Arm'}
             </span>
          </div>
        </div>

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