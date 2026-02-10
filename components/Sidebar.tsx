
import React from 'react';
import { AppView } from '../types';

interface SidebarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  bridgeStatus: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate }) => {
  const sections = [
    {
      label: 'Main Control',
      items: [
        { id: AppView.DASHBOARD, label: 'Control Center', icon: 'M4 6h16M4 12h16M4 18h16' },
        { id: AppView.MISSION_CONTROL, label: 'Mission Deck', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
      ]
    },
    {
      label: 'Discovery Hub',
      items: [
        { id: AppView.JOB_SCANNER, label: 'Neural Scanner', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
        { id: AppView.OUTREACH, label: 'Hidden Hunter', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
      ]
    },
    {
      label: 'Revenue Sync',
      items: [
        { id: AppView.INCOME_B2B, label: 'Revenue Hub', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2' },
        { id: AppView.INCOME_GIGS, label: 'Gig Pulse', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
        { id: AppView.MARKET_NEXUS, label: 'Market Nexus', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
      ]
    },
    {
      label: 'Core Identity',
      items: [
        { id: AppView.PROFILE, label: 'Identity Vault', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
        { id: AppView.VAULT_SYNC, label: 'System Health', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      ]
    }
  ];

  return (
    <aside className="hidden md:flex w-72 bg-black flex-col py-12 border-r border-white/5 z-50">
      <div className="px-10 mb-16">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <span className="text-white font-black text-xl italic">T</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-white uppercase tracking-[0.2em] leading-none">TITAN COMMAND</span>
            <span className="text-[8px] text-slate-700 font-black tracking-[0.4em] mt-1.5 uppercase">Core OS_v6.4</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-6 space-y-12 overflow-y-auto custom-scrollbar">
        {sections.map(section => (
          <div key={section.label}>
            <h3 className="px-6 text-[9px] font-black text-slate-800 uppercase tracking-[0.5em] mb-4">{section.label}</h3>
            <div className="space-y-1.5">
              {section.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-4 px-6 py-3.5 rounded-3xl transition-all border ${
                    activeView === item.id 
                    ? 'bg-indigo-600 border-indigo-500/50 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                    : 'text-slate-600 hover:text-white hover:bg-white/5 border-transparent'
                  }`}
                >
                  <svg className={`w-5 h-5 shrink-0 transition-colors ${activeView === item.id ? 'text-white' : 'text-slate-800 group-hover:text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} />
                  </svg>
                  <span className="font-black text-[10px] uppercase tracking-widest">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-10 mt-10 pt-10 border-t border-white/5">
        <div className="p-6 bg-slate-950 rounded-[2.5rem] border border-white/5 shadow-inner">
           <div className="flex items-center gap-3 mb-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_#10b981]"></span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Global Relay</span>
           </div>
           <p className="text-[8px] font-mono text-slate-800 uppercase tracking-widest">Status: SYNCED_ONLINE</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
