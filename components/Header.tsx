import React from 'react';
import { AppView } from '../types';

interface HeaderProps {
  activeView: AppView;
  activePersona?: string;
  personaDomain?: string;
  personaTheme?: string;
  onSearch: (query: string) => void;
  onSearchChange: (query: string) => void;
  searchValue: string;
  onOpenConsole: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  activeView, activePersona, personaDomain, personaTheme, onSearch, onSearchChange, searchValue, onOpenConsole 
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch(searchValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onSearchChange(val);
  };

  return (
    <header className="h-14 md:h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-[#0d1117] sticky top-0 z-[60] shrink-0">
      <div className="flex items-center gap-4 md:gap-8 flex-1">
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
          <h2 className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-colors ${personaTheme === 'cyan' ? 'text-cyan-500' : 'text-slate-500'}`}>
            {activeView.replace('_', ' ')}
          </h2>
          {/* Bridge Health Indicator for Mobile */}
          <div className="md:hidden flex items-center gap-1.5">
             <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_4px_#10b981]"></span>
             <span className="text-[6px] font-black text-slate-700 uppercase tracking-widest">BRIDGE_UP</span>
          </div>
        </div>

        <div className="relative w-full max-w-xs md:max-w-lg hidden sm:block">
           <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
           </div>
           <input 
             type="text" 
             placeholder={`Search ${personaDomain || 'ops'}...`} 
             className="w-full bg-[#02040a] border border-white/5 rounded-xl py-2 pl-12 pr-16 text-[10px] md:text-xs text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700"
             value={searchValue}
             onChange={handleChange}
             onKeyDown={handleKeyDown}
           />
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <button 
          onClick={() => onSearch('')}
          className="sm:hidden w-8 h-8 rounded-lg border border-white/5 bg-black flex items-center justify-center text-slate-400"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        <button 
          onClick={onOpenConsole}
          className="md:hidden w-8 h-8 rounded-lg border border-white/5 bg-black flex items-center justify-center text-indigo-400"
        >
          <span className="text-[10px] font-black italic">T:~$</span>
        </button>

        <div className="flex items-center gap-2 md:gap-4 border-l border-white/5 pl-3 md:pl-8">
          <div className="text-right hidden xs:block">
            <div className="text-[10px] font-bold text-white tracking-tight leading-none truncate max-w-[60px] md:max-w-none">{activePersona?.split(' ')[0]}</div>
          </div>
          <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg bg-[#02040a] border overflow-hidden relative ${personaTheme === 'cyan' ? 'border-cyan-500/30' : 'border-white/10'}`}>
            <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${activePersona || 'Titan'}`} alt="avatar" className="w-full h-full p-1" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;