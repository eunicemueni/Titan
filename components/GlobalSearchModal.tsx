
import React, { useMemo } from 'react';
import { AppView, JobRecord, SentRecord, UserProfile } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  jobs: JobRecord[];
  sentRecords: SentRecord[];
  profiles: UserProfile[];
  onNavigate: (view: AppView) => void;
}

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, query, jobs, sentRecords, profiles, onNavigate }) => {
  if (!isOpen) return null;

  const results = useMemo(() => {
    const q = (query || '').toLowerCase().trim();
    if (!q) return { jobs: [], history: [], total: 0 };

    // SEARCH JOBS (Deep Trace)
    const jobNodes = (jobs || []).filter(j => 
      j.role.toLowerCase().includes(q) || 
      j.company.toLowerCase().includes(q) ||
      (j.description || '').toLowerCase().includes(q) ||
      (j.location || '').toLowerCase().includes(q)
    );

    // SEARCH SENT HISTORY (Audit Trace)
    const historyNodes = (sentRecords || []).filter(r => 
      r.recipient.toLowerCase().includes(q) || 
      r.subject.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q)
    );

    // SEARCH IDENTITY VAULT (Profile Trace)
    const profileNodes = (profiles || []).filter(p => 
      p.fullName.toLowerCase().includes(q) ||
      p.masterCV.toLowerCase().includes(q)
    );

    return {
      jobs: jobNodes,
      history: historyNodes,
      profiles: profileNodes,
      total: jobNodes.length + historyNodes.length + profileNodes.length
    };
  }, [query, jobs, sentRecords, profiles]);

  const navigateTo = (view: AppView) => {
    onNavigate(view);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-12 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-200" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-5xl bg-[#0d1117] border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/2">
          <div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Deep Trace: "{query}"</h3>
            <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-1">Pulse scan identified {results.total} matching nodes.</p>
          </div>
          <button onClick={onClose} className="p-3 text-slate-500 hover:text-white transition-all">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-12 bg-black/20">
          {results.total === 0 && (
            <div className="py-20 text-center opacity-30">
               <p className="text-xl font-black uppercase tracking-[0.5em]">Null Pulse</p>
               <p className="text-[10px] uppercase font-bold mt-4">No internal matches for this search pattern.</p>
            </div>
          )}

          {results.jobs.length > 0 && (
            <section className="space-y-4">
              <h4 className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] flex items-center gap-4">
                <span className="w-10 h-[1px] bg-indigo-500/20"></span>
                Job Intercepts
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.jobs.map(j => (
                  <button key={j.id} onClick={() => navigateTo(AppView.JOB_SCANNER)} className="text-left bg-white/2 border border-white/5 p-6 rounded-3xl hover:border-indigo-500/40 transition-all flex items-center gap-4 group">
                    <div className="w-10 h-10 bg-slate-900 border border-white/5 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-indigo-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>
                    <div>
                      <div className="text-[11px] font-black text-white uppercase tracking-tight truncate max-w-[200px]">{j.role}</div>
                      <div className="text-[9px] font-bold text-slate-600 uppercase mt-1">{j.company}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {results.history.length > 0 && (
            <section className="space-y-4">
              <h4 className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.4em] flex items-center gap-4">
                <span className="w-10 h-[1px] bg-emerald-500/20"></span>
                Audit History
              </h4>
              <div className="space-y-2">
                {results.history.map(r => (
                  <button key={r.id} onClick={() => navigateTo(AppView.DASHBOARD)} className="w-full text-left bg-white/2 border border-white/5 px-6 py-4 rounded-2xl hover:bg-white/5 transition-all flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black text-white uppercase">{r.recipient}</div>
                      <div className="text-[8px] font-bold text-slate-600 uppercase mt-1">{r.type} • {r.subject}</div>
                    </div>
                    <span className="text-[8px] font-mono text-slate-700">{new Date(r.timestamp).toLocaleDateString()}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="px-10 py-6 border-t border-white/5 bg-black/40 flex justify-center shrink-0">
           <button onClick={onClose} className="px-12 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl">Abort Pulse</button>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
