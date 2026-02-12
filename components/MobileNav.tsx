import React from 'react';
import { AppView } from '../types';

interface MobileNavProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeView, onNavigate }) => {
  const items = [
    { id: AppView.DASHBOARD, label: 'CMD', icon: 'M4 6h16M4 12h16M4 18h16' },
    { id: AppView.MISSION_CONTROL, label: 'MISSION', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: AppView.JOB_SCANNER, label: 'SCAN', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { id: AppView.INCOME_GIGS, label: 'GIGS', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: AppView.PROFILE, label: 'VAULT', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-2 z-[200]">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${
            activeView === item.id ? 'text-indigo-500' : 'text-slate-600'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} />
          </svg>
          <span className="text-[7px] font-black uppercase tracking-widest">{item.label}</span>
          {activeView === item.id && (
            <div className="absolute bottom-0 w-8 h-0.5 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]"></div>
          )}
        </button>
      ))}
    </nav>
  );
};

export default MobileNav;