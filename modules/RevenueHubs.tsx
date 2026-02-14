
import React, { useState, useMemo } from 'react';
import { UserProfile, TelemetryLog, SentRecord } from '../types';
import { geminiService } from '../services/geminiService';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface YieldNode {
  company: string;
  website: string;
  gaps: string[];
  solution: string;
  projectedValue: number;
  complexity: 'Low' | 'Medium' | 'High';
  email?: string;
  pitch?: string;
  status: 'IDLE' | 'ENRICHING' | 'TAILORING' | 'SENT';
}

const YieldPulse: React.FC<{ value: number; color: string }> = ({ value, color }) => {
  const data = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      time: i,
      val: (value / 500) + Math.random() * 8 - 4 + (Math.cos(i / 1.5) * 5)
    }));
  }, [value]);

  return (
    <div className={`h-24 w-full mt-4 bg-black/60 rounded-3xl p-3 border border-white/5`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <Area type="stepAfter" dataKey="val" stroke={color === 'cyan' ? '#06b6d4' : '#6366f1'} strokeWidth={2} fillOpacity={0.1} fill={color === 'cyan' ? '#06b6d4' : '#6366f1'} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const RevenueHubs: React.FC<{ 
  profile: UserProfile; 
  onLog: (msg: string, level: TelemetryLog['level']) => void; 
  onSent: (record: Omit<SentRecord, 'id' | 'timestamp' | 'status'>) => void; 
  updateStats: (updates: Partial<UserProfile['stats']>) => void; 
  onBack: () => void; 
}> = ({ profile, onLog, onSent, updateStats, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [sector, setSector] = useState('');
  const [results, setResults] = useState<YieldNode[]>([]);
  const [viewingPitch, setViewingPitch] = useState<YieldNode | null>(null);

  const isAyana = profile.fullName.includes("Ayana");
  const themeColor = isAyana ? 'cyan' : 'indigo';

  const handleAudit = async () => {
    if (!sector) return;
    setLoading(true);
    onLog(`DEPLOYING AUDITORS: Scanning ${sector}...`, 'info');
    try {
      const analyses = await geminiService.analyzeOperationalGaps(sector, 'Global', profile.fullName);
      setResults(analyses.map((a: any) => ({ ...a, status: 'IDLE', projectedValue: a.projectedValue || 1450 })));
      onLog(`Located ${analyses.length} nodes.`, 'success');
    } catch (err) {
      onLog("Trace failed.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async (node: YieldNode) => {
    setResults(prev => prev.map(r => r.company === node.company ? { ...r, status: 'ENRICHING' } : r));
    
    let email = "Not Found";
    try {
      const domain = new URL(node.website.startsWith('http') ? node.website : `https://${node.website}`).hostname.replace('www.', '');
      const enrichment = await geminiService.performDeepEmailScrape(node.company, domain);
      email = enrichment.email;
    } catch (e) {}

    setResults(prev => prev.map(r => r.company === node.company ? { ...r, status: 'TAILORING' } : r));
    const pitch = await geminiService.generateB2BPitch(node.company, node.gaps, node.solution, profile);
    
    const subject = `[STRATEGIC] Operational Deficit Resolution: ${node.company}`;
    
    // Applying the specific logic: Use empty string if email is "Not Found"
    const mailtoUrl = `mailto:${email !== 'Not Found' ? email : ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(pitch || '')}`;
    window.open(mailtoUrl, '_blank');

    setResults(prev => prev.map(r => r.company === node.company ? { ...r, status: 'SENT', pitch, email } : r));
    onSent({ type: 'B2B_PITCH', recipient: node.company, subject });
    onLog(`Proposal Linked to ${node.company}.`, 'success');
  };

  return (
    <div className="p-4 md:p-10 lg:p-20 space-y-12 pb-40">
      <div className="flex justify-between items-center pt-6">
         <button onClick={onBack} className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all">BACK</button>
         <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-none">Revenue Hub</h1>
      </div>

      <div className="bg-slate-950 border border-white/5 rounded-[4rem] p-12 shadow-2xl space-y-8">
        <div className="flex flex-col md:flex-row gap-6">
           <input type="text" placeholder="Target Sector (e.g. Fintech, Healthcare)..." className="flex-1 bg-black border border-slate-800 rounded-[2.5rem] px-10 py-6 text-white text-xl font-black outline-none focus:border-indigo-500 transition-all shadow-inner" value={sector} onChange={(e) => setSector(e.target.value)} />
           <button onClick={handleAudit} disabled={loading || !sector} className="px-16 bg-white text-black rounded-[2.5rem] font-black uppercase text-sm tracking-[0.4em] hover:bg-indigo-600 hover:text-white transition-all shadow-2xl active:scale-95">
             {loading ? 'AUDITING...' : 'Identify Gaps'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {results.map((node, i) => (
          <div key={i} className={`p-10 border rounded-[4rem] transition-all flex flex-col justify-between min-h-[580px] group ${node.status === 'SENT' ? 'border-emerald-500 bg-emerald-950/10' : 'border-slate-800 bg-slate-950'}`}>
             <div>
                <div className="flex justify-between items-start mb-10">
                   <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter pr-4">{node.company}</h3>
                   <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-4 py-1.5 rounded-full">${node.projectedValue} ASK</span>
                </div>
                <YieldPulse value={node.projectedValue} color={themeColor} />
                <div className="mt-10 space-y-4">
                   {node.gaps.slice(0, 3).map((gap, idx) => (
                     <div key={idx} className="flex gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                        <span className="text-indigo-500 font-black">»</span>
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">{gap}</span>
                     </div>
                   ))}
                </div>
             </div>
             <div className="mt-10">
                {node.status === 'SENT' ? (
                  <button onClick={() => setViewingPitch(node)} className="w-full bg-white text-black py-6 rounded-2xl text-[10px] font-black uppercase tracking-widest">View Proposal</button>
                ) : (
                  <button onClick={() => handleDispatch(node)} disabled={node.status !== 'IDLE'} className="w-full bg-indigo-600 text-white py-6 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform">
                    {node.status === 'IDLE' ? 'Dispatch Proposal' : 'Processing...'}
                  </button>
                )}
             </div>
          </div>
        ))}
      </div>

      {viewingPitch && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-12 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300">
           <div className="w-full max-w-5xl bg-white rounded-[4rem] h-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="px-16 py-10 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                 <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Proposal: {viewingPitch.company}</h3>
                 <button onClick={() => setViewingPitch(null)} className="text-slate-300 hover:text-slate-900 transition-all"><svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="flex-1 overflow-y-auto p-16 lg:p-24 bg-slate-50 custom-scrollbar">
                 <div className="max-w-3xl mx-auto bg-white border border-slate-200 p-16 rounded-[3rem] font-serif text-xl leading-relaxed text-slate-800 italic shadow-xl whitespace-pre-wrap">
                    {viewingPitch.pitch}
                 </div>
              </div>
              <div className="p-12 border-t border-slate-100 flex justify-center bg-white shrink-0">
                 <button onClick={() => setViewingPitch(null)} className="bg-slate-900 text-white px-20 py-7 rounded-full font-black uppercase text-xs tracking-[0.4em] shadow-xl hover:bg-indigo-600 transition-all">Close Board Review</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default RevenueHubs;
