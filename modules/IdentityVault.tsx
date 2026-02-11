
import React, { useState, useMemo } from 'react';
import { UserProfile, TelemetryLog, SentRecord, AppAnalytics, IndustryType } from '../types';

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
  profiles, setProfiles, activeIndex, setActiveIndex, onLog 
}) => {
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<'EDIT' | 'DOSSIER'>('DOSSIER');
  const [activeExpertise, setActiveExpertise] = useState<IndustryType>('ACTUARIAL');
  
  const activeProfile = profiles[activeIndex] || profiles[0];

  const dnaIntegrity = useMemo(() => {
    let score = 0;
    if (activeProfile.masterCV && activeProfile.masterCV.length > 200) score += 50;
    if (activeProfile.portfolioUrl && activeProfile.portfolioUrl.length > 5) score += 30;
    if (activeProfile.linkedinUrl && activeProfile.linkedinUrl.length > 5) score += 10;
    if (activeProfile.dossierLink && activeProfile.dossierLink.length > 5) score += 10;
    return score;
  }, [activeProfile]);

  const handleUpdateActiveProfile = (updates: Partial<UserProfile>) => {
    setProfiles(prev => {
      const next = [...prev];
      next[activeIndex] = { ...next[activeIndex], ...updates };
      return next;
    });
    onLog(`VAULT_SYNC: Profile nodes updated for ${activeProfile.fullName}`, 'info');
  };

  const handleUpdateExpertise = (block: IndustryType, text: string) => {
    handleUpdateActiveProfile({
      expertiseBlocks: { ...activeProfile.expertiseBlocks, [block]: text }
    });
  };

  const industries: IndustryType[] = ['ACTUARIAL', 'INSURANCE', 'PROJECT_MGMT', 'OPERATIONS', 'DATA_ANALYST', 'FINANCE', 'SALES', 'AI_TRAINING', 'GENERAL'];

  return (
    <div className="min-h-screen bg-[#02040a] p-10 md:p-20 space-y-16 pb-40 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="bg-slate-900/40 border border-white/5 p-3 rounded-[2.5rem] flex items-center gap-4 overflow-x-auto no-scrollbar max-w-full shadow-2xl">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4 hidden lg:block">Neural Personas:</span>
          {profiles.map((p, idx) => (
            <button key={idx} onClick={() => { setActiveIndex(idx); setEditMode(false); }} className={`flex items-center gap-4 px-8 py-3.5 rounded-[1.8rem] transition-all border ${activeIndex === idx ? 'bg-indigo-600 border-indigo-400 text-white shadow-2xl scale-105' : 'bg-black border-slate-800 text-slate-500 hover:border-slate-600'}`}>
              <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10">
                <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${p.fullName}`} alt="ava" />
              </div>
              <span className="text-[10px] font-black uppercase whitespace-nowrap tracking-widest">{p.fullName}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setViewMode(viewMode === 'EDIT' ? 'DOSSIER' : 'EDIT')} 
            className={`px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] transition-all border ${viewMode === 'DOSSIER' ? 'bg-purple-600 text-white border-purple-400' : 'bg-white text-black'}`}
          >
            {viewMode === 'DOSSIER' ? 'BACK TO SOURCE' : 'VIEW FORMATTED DOSSIER'}
          </button>
          <button onClick={() => { setEditMode(!editMode); setViewMode('EDIT'); }} className={`px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] transition-all border ${editMode ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-slate-900 text-slate-400 border-white/5'}`}>
            {editMode ? 'LOCK & SYNC DNA' : 'MODIFY AGENT DNA'}
          </button>
        </div>
      </div>

      {viewMode === 'DOSSIER' ? (
        <div className="max-w-5xl mx-auto bg-white rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in slide-in-from-bottom-10 duration-700">
           <div className="bg-slate-950 p-16 text-center space-y-6">
              <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.6em]">Executive Master Dossier</h2>
              <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase">{activeProfile.fullName}</h1>
              <p className="text-sm text-slate-400 font-black uppercase tracking-[0.4em]">{activeProfile.domain} Specialist Node</p>
           </div>
           
           <div className="p-20 lg:p-32 space-y-20">
              <section className="space-y-10">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] border-b border-slate-100 pb-4">Professional Identity DNA</h3>
                 <div className="text-2xl font-serif italic text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {activeProfile.masterCV}
                 </div>
              </section>

              <section className="space-y-10">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] border-b border-slate-100 pb-4">Specialized Expertise Clusters</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {Object.entries(activeProfile.expertiseBlocks).map(([key, val]) => (
                       <div key={key} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                          <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-4">{key.replace('_', ' ')}</h4>
                          <p className="text-sm font-medium text-slate-700 leading-relaxed">{val}</p>
                       </div>
                    ))}
                 </div>
              </section>

              <div className="pt-20 border-t border-slate-100 flex justify-between items-center opacity-40 grayscale">
                 <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-900 uppercase">System Verified ID</p>
                    <p className="text-[8px] font-mono text-slate-500 uppercase">{activeProfile.email}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-black text-slate-900 uppercase">Portfolio Node</p>
                    <p className="text-[8px] font-mono text-slate-500 uppercase">{activeProfile.portfolioUrl}</p>
                 </div>
              </div>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
          <div className="xl:col-span-4 space-y-8">
            <div className="bg-titan-surface border border-white/5 p-12 rounded-[4rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,_rgba(99,102,241,0.05),_transparent_60%)] pointer-events-none"></div>
              <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                <div className="w-32 h-32 rounded-[3rem] bg-indigo-600/10 border-2 border-indigo-500/20 p-2 relative">
                    <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${activeProfile.fullName}`} alt="Profile" className="w-full h-full rounded-[2.5rem]" />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-[#0d1117] flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                </div>
                <div>
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">{activeProfile.fullName}</h2>
                    <p className="text-indigo-500 text-[9px] font-black uppercase mt-3 tracking-[0.4em]">Class: Strategic_Resolution_Proxy</p>
                </div>
                <div className="w-full space-y-3 pt-6">
                  <div className="flex justify-between items-end px-2">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Neural DNA Integrity</span>
                    <span className={`text-[10px] font-black italic ${dnaIntegrity > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{dnaIntegrity}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                    <div className={`h-full transition-all duration-1000 shadow-[0_0_10px_currentColor] ${dnaIntegrity > 80 ? 'bg-emerald-500 text-emerald-500' : 'bg-indigo-500 text-indigo-500'}`} style={{ width: `${dnaIntegrity}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black border border-white/5 p-10 rounded-[3rem] space-y-8 shadow-2xl">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-4">
                <span className="w-8 h-[1px] bg-indigo-500"></span>
                Neural Asset Links
              </h3>
              <div className="space-y-6">
                {[
                  { label: 'Strategic Dossier (PDF Link)', key: 'dossierLink', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                  { label: 'Integrated Portfolio Node (URL)', key: 'portfolioUrl', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
                  { label: 'Social Graph Node (LinkedIn)', key: 'linkedinUrl', icon: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z' },
                  { label: 'Uplink Email Node', key: 'email', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' }
                ].map((field) => (
                  <div key={field.key} className="space-y-2 group">
                    <div className="flex items-center gap-3 ml-4">
                      <svg className="w-3 h-3 text-slate-600 group-focus-within:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={field.icon}/></svg>
                      <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{field.label}</label>
                    </div>
                    <input type="text" disabled={!editMode} className={`w-full bg-slate-900 border rounded-2xl px-6 py-4 text-[11px] font-mono transition-all outline-none ${editMode ? 'border-indigo-500/50 text-white focus:bg-black' : 'border-transparent text-slate-500 cursor-not-allowed'}`} value={(activeProfile as any)[field.key] || ''} onChange={e => handleUpdateActiveProfile({ [field.key]: e.target.value })} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="xl:col-span-8 space-y-10">
            <div className="bg-titan-surface border border-white/5 p-12 rounded-[4rem] shadow-2xl space-y-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Multi-Sector Knowledge Base</h3>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">Tailor Identity DNA for Any Global Remote Sector</p>
                </div>
              </div>

              <div className="space-y-10">
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {industries.map(ind => (
                      <button key={ind} onClick={() => setActiveExpertise(ind)} className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${activeExpertise === ind ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl' : 'bg-black border-slate-900 text-slate-600 hover:border-slate-700'}`}>
                        {ind.replace('_', ' ')}
                      </button>
                    ))}
                </div>

                <div className="bg-black border border-slate-900 rounded-[3rem] p-10 h-[500px] relative group shadow-inner">
                    <div className="absolute top-8 right-10 text-[8px] font-mono text-slate-800 uppercase tracking-[0.4em] pointer-events-none group-focus-within:text-indigo-500 transition-colors">Neural_Source_Code</div>
                    <textarea disabled={!editMode} className={`w-full h-full bg-transparent text-[13px] font-mono leading-relaxed resize-none outline-none custom-scrollbar selection:bg-indigo-500/30 transition-colors ${editMode ? 'text-indigo-100' : 'text-slate-500'}`} value={(activeProfile.expertiseBlocks as any)[activeExpertise] || ''} onChange={e => handleUpdateExpertise(activeExpertise, e.target.value)} placeholder={`Paste ${activeExpertise} specific technical context here...`} />
                </div>
              </div>

              <div className={`p-8 bg-black/40 border rounded-[3rem] space-y-4 transition-all shadow-inner ${!activeProfile.masterCV && !editMode ? 'border-amber-500/50 animate-pulse' : 'border-white/5'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${activeProfile.masterCV ? 'bg-indigo-500' : 'bg-amber-500'}`}></div>
                      <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Master Identity DNA (Main CV)</h4>
                    </div>
                </div>
                <textarea disabled={!editMode} className={`w-full h-40 bg-transparent border border-white/5 rounded-2xl p-6 text-[11px] font-mono leading-relaxed resize-none outline-none custom-scrollbar selection:bg-indigo-500/30 ${editMode ? 'text-white' : 'text-slate-600'}`} value={activeProfile.masterCV} onChange={e => handleUpdateActiveProfile({ masterCV: e.target.value })} placeholder="MASTER CV TEXT REQUIRED..." />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdentityVault;
