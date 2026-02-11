import React, { useState, useEffect } from 'react';
import { AppView } from '../types';
import { geminiService } from '../services/geminiService';

interface HeaderProps {
  activeView: AppView;
  systemProgress?: { current: number; total: number; label: string } | null;
  activePersona?: string;
  personaDomain?: string;
  personaTheme?: string;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onSearch: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  activeView, activePersona, personaDomain, personaTheme, voiceEnabled, onToggleVoice, onSearch 
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Automatic voice greetings have been removed to keep the interface silent and professional.
  // Voice interaction is now strictly manual via the toggle.

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(searchValue);
    }
  };

  const themeClass = personaTheme === 'cyan' ? 'text-cyan-400 border-cyan-500/50 shadow-cyan-500/20' : 'text-indigo-500 border-indigo-500/50 shadow-indigo-500/20';

  return (
    <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0d1117] sticky top-0 z-[60] shrink-0">
      <div className="flex items-center gap-8 flex-1">
        <h2 className={`text-[10px] font-bold uppercase tracking-widest hidden xl:block transition-colors ${personaTheme === 'cyan' ? 'text-cyan-500' : 'text-slate-500'}`}>
          {activeView.replace('_', ' ')}
        </h2>

        <div className="relative w-full max-w-lg">
           <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
           </div>
           <input 
             type="text" 
             placeholder={`Search ${personaDomain || 'operations'}...`} 
             className="w-full bg-[#02040a] border border-white/5 rounded-xl py-2 pl-12 pr-16 text-xs text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700"
             value={searchValue}
             onChange={(e) => setSearchValue(e.target.value)}
             onKeyDown={handleKeyDown}
           />
           {isSpeaking && (
              <div className="absolute inset-y-0 right-14 flex items-center gap-1 px-2">
                 {[...Array(5)].map((_, i) => (
                   <div key={i} className={`w-0.5 rounded-full animate-pulse ${personaTheme === 'cyan' ? 'bg-cyan-400' : 'bg-indigo-500'}`} style={{ height: '40%', animationDelay: `${i * 0.1}s` }}></div>
                 ))}
              </div>
           )}
           <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <span className="text-[8px] font-bold text-slate-800 uppercase tracking-tighter bg-white/5 px-2 py-0.5 rounded border border-white/5">/ {personaTheme === 'cyan' ? 'Data' : 'Search'}</span>
           </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
           <button 
             onClick={onToggleVoice}
             title="Toggle Neural Interface"
             className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${
               voiceEnabled ? `bg-opacity-10 shadow-lg ${themeClass}` : 'bg-[#02040a] border-white/5 text-slate-500 hover:text-slate-300'
             }`}
           >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
           </button>
        </div>

        <div className="flex items-center gap-4 border-l border-white/5 pl-8">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-white tracking-tight leading-none">{activePersona || 'Operator'}</div>
            <div className={`text-[9px] font-black uppercase mt-1 tracking-widest opacity-80 ${personaTheme === 'cyan' ? 'text-cyan-500' : 'text-slate-600'}`}>{personaDomain} Node</div>
          </div>
          <div className={`w-9 h-9 rounded-lg bg-[#02040a] border overflow-hidden relative shadow-sm ${personaTheme === 'cyan' ? 'border-cyan-500/30' : 'border-white/10'}`}>
            <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${activePersona || 'Titan'}`} alt="avatar" className="w-full h-full p-1" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;