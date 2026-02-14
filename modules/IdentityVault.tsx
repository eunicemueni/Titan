
import React, { useState } from 'react';
import { UserProfile, TelemetryLog, SentRecord, AppAnalytics } from '../types';
import { supabaseService } from '../services/supabaseService';

interface IdentityVaultProps {
  profiles: UserProfile[];
  setProfiles: React.Dispatch<React.SetStateAction<UserProfile[]>>;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  onLog: (msg: string, level: TelemetryLog['level']) => void;
  onTrack: () => void;
  sentRecords: SentRecord[];
  setSentRecords: (records: SentRecord[]) => void;
  analytics: AppAnalytics;
  setAnalytics: (analytics: AppAnalytics) => void;
}

const IdentityVault: React.FC<IdentityVaultProps> = ({ 
  profiles, 
  setProfiles, 
  activeIndex, 
  setActiveIndex, 
  onLog,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<'EDIT' | 'DOSSIER' | 'DNA_STREAM'>('DNA_STREAM');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const activeProfile = profiles[activeIndex] || profiles[0];

  const handleSyncToCloud = async () => {
    setIsSyncing(true);
    onLog("VAULT_SYNC: Committing DNA updates to Cloud Node...", "info");
    try {
      const success = await supabaseService.saveProfiles(profiles);
      if (success) {
        onLog("VAULT_SYNC: Cloud Node synchronized.", "success");
        setEditMode(false);
      } else {
        onLog("VAULT_SYNC: Cloud Link Error.", "error");
      }
    } catch (e) {
      onLog("VAULT_SYNC: Transmission Crash.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateActiveProfile = (updates: Partial<UserProfile>) => {
    setProfiles(prev => {
      const next = [...prev];
      next[activeIndex] = { ...next[activeIndex], ...updates };
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#02040a] p-4 md:p-10 lg:p-20 space-y-8 animate-in fade-in duration-700 pb-40">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-950/80 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar max-w-full pb-2 md:pb-0">
          {profiles.map((p, idx) => (
            <button key={idx} onClick={() => { setActiveIndex(idx); setEditMode(false); }} className={`flex items-center gap-4 px-6 py-3 rounded-[1.8rem] transition-all border shrink-0 ${activeIndex === idx ? 'bg-indigo-600 border-indigo-400 text-white shadow-2xl scale-105' : 'bg-black border-slate-800 text-slate-500 hover:border-slate-600'}`}>
              <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10">
                <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${p.fullName}`} alt="ava" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{p.fullName}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button 
            onClick={() => setViewMode(viewMode === 'DNA_STREAM' ? 'DOSSIER' : 'DNA_STREAM')} 
            className={`flex-1 md:flex-none px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] transition-all border ${viewMode === 'DNA_STREAM' ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-white text-black'}`}
          >
            {viewMode === 'DNA_STREAM' ? 'Dossier View' : 'Neural DNA Stream'}
          </button>
          {editMode ? (
            <button onClick={handleSyncToCloud} disabled={isSyncing} className="flex-1 md:flex-none px-8 py-4 bg-emerald-600 text-white border border-emerald-400 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all">
              {isSyncing ? 'SYNCING...' : 'Save DNA'}
            </button>
          ) : (
            <button onClick={() => { setEditMode(true); setViewMode('EDIT'); }} className="flex-1 md:flex-none px-8 py-4 bg-slate-900 text-slate-400 border border-white/5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:text-white transition-all">
              Edit Source
            </button>
          )}
        </div>
      </div>

      {viewMode === 'DNA_STREAM' ? (
        <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-10 duration-700">
           <div className="bg-slate-950 border border-indigo-500/20 rounded-[4rem] overflow-hidden shadow-2xl">
              <div className="bg-indigo-600/10 p-10 border-b border-white/5 flex justify-between items-center">
                 <div>
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Identity DNA Core</h3>
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-2">Uplink Persona: {activeProfile.fullName}</p>
                 </div>
                 <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_#6366f1]"></div>
              </div>
              <div className="p-10 md:p-20 bg-black/40 backdrop-blur-3xl min-h-[600px] shadow-inner">
                 <div className="max-w-4xl mx-auto">
                    <pre className="text-lg md:text-xl font-mono text-indigo-100/90 leading-relaxed whitespace-pre-wrap selection:bg-white selection:text-black">
                       {activeProfile.masterCV}
                    </pre>
                 </div>
              </div>
              <div className="p-10 border-t border-white/5 bg-slate-950 text-center">
                 <button onClick={() => { setEditMode(true); setViewMode('EDIT'); }} className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] hover:text-white transition-all">EDIT_MODE_::[OPEN]</button>
              </div>
           </div>
        </div>
      ) : viewMode === 'DOSSIER' ? (
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Uplink Email', value: activeProfile.email, icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                { label: 'Portfolio Node', value: activeProfile.portfolioUrl, icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9' },
                { label: 'Social Graph', value: activeProfile.linkedinUrl, icon: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z' }
              ].map((node, i) => (
                <div key={i} className="bg-slate-950 border border-white/5 p-8 rounded-[3rem] shadow-2xl hover:border-indigo-500/30 transition-all">
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">{node.label}</p>
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-400">
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d={node.icon} /></svg>
                      </div>
                      <span className="text-xs font-black text-white truncate">{node.value}</span>
                   </div>
                </div>
              ))}
           </div>

           <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-500">
              <div className="bg-slate-950 p-12 md:p-20 text-center space-y-4">
                 <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.6em]">Professional Identity Dossier</h2>
                 <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-none">{activeProfile.fullName}</h1>
                 <p className="text-sm text-slate-400 font-black uppercase tracking-[0.4em]">{activeProfile.domain}</p>
              </div>
              
              <div className="p-12 md:p-20 space-y-16">
                 <section className="space-y-8">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] border-b border-slate-100 pb-4">Professional DNA Matrix</h3>
                    <div className="text-lg md:text-xl font-serif italic text-slate-800 leading-relaxed whitespace-pre-wrap">
                       {activeProfile.masterCV}
                    </div>
                 </section>
              </div>
           </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in duration-300">
           <div className="lg:col-span-4 space-y-8">
              <div className="bg-slate-950 border border-white/5 p-12 rounded-[3rem] text-center space-y-6 shadow-2xl">
                 <div className="w-32 h-32 mx-auto rounded-[3rem] bg-indigo-600/10 border-2 border-indigo-500/20 p-2">
                    <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${activeProfile.fullName}`} alt="ava" className="w-full h-full rounded-[2.5rem]" />
                 </div>
                 <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">{activeProfile.fullName}</h2>
              </div>
              <div className="bg-slate-950 border border-white/5 p-8 rounded-[3rem] space-y-6 shadow-2xl">
                 {['email', 'portfolioUrl', 'linkedinUrl'].map((field) => (
                    <div key={field} className="space-y-2">
                       <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-4">{field.replace('Url', '')}</label>
                       <input type="text" className="w-full bg-black border border-slate-800 rounded-2xl px-6 py-4 text-[11px] font-mono text-white outline-none focus:border-indigo-500 transition-all" value={(activeProfile as any)[field] || ''} onChange={e => handleUpdateActiveProfile({ [field]: e.target.value })} />
                    </div>
                 ))}
              </div>
           </div>
           <div className="lg:col-span-8 space-y-8">
              <div className="bg-slate-950 border border-white/5 p-12 rounded-[4rem] space-y-8 shadow-2xl">
                 <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Master CV DNA Configuration</h3>
                 <textarea className="w-full h-[600px] bg-black border border-slate-800 rounded-[2.5rem] p-10 text-[13px] font-mono leading-relaxed text-indigo-100 resize-none outline-none focus:border-indigo-500 transition-all custom-scrollbar" value={activeProfile.masterCV} onChange={e => handleUpdateActiveProfile({ masterCV: e.target.value })} />
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default IdentityVault;
