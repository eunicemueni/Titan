
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
  auditReport?: string;
  status: 'IDLE' | 'ENRICHING' | 'TAILORING' | 'DISPATCHING' | 'SENT' | 'SHORTED';
}

// Fix: Added onBack to RevenueHubsProps to match usage in App.tsx
interface RevenueHubsProps {
  profile: UserProfile;
  onLog: (msg: string, level: TelemetryLog['level']) => void;
  updateStats: (updates: Partial<UserProfile['stats']>) => void;
  onSent: (record: Omit<SentRecord, 'id' | 'timestamp' | 'status'>) => void;
  onProgress?: (current: number, total: number, label: string) => void;
  onBack: () => void;
}

const YieldPulse: React.FC<{ value: number }> = ({ value }) => {
  const data = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      time: i,
      val: (value / 1000) + Math.random() * 8 - 4 + (Math.cos(i / 1.5) * 5)
    }));
  }, [value]);

  return (
    <div className="h-28 w-full mt-4 bg-black/60 rounded-3xl p-3 border border-purple-500/10 group-hover:border-purple-500/30 transition-all shadow-inner">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area type="stepAfter" dataKey="val" stroke="#9333ea" strokeWidth={2} fillOpacity={1} fill="url(#colorYield)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const RevenueHubs: React.FC<RevenueHubsProps> = ({ profile, onLog, updateStats, onSent, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [companyType, setCompanyType] = useState('');
  const [location, setLocation] = useState('Global');
  const [results, setResults] = useState<YieldNode[]>([]);
  const [viewingPitch, setViewingPitch] = useState<YieldNode | null>(null);

  const handleGapAnalysis = async () => {
    if (!companyType) return;
    setLoading(true);
    setResults([]);
    onLog(`DEPLOYING REVENUE HUNTERS: Scanning B2B deficits for "${companyType}"...`, 'info');
    
    try {
      const analyses = await geminiService.analyzeOperationalGaps(companyType, location);
      setResults(analyses.map((a: any) => ({ ...a, status: 'IDLE' })));
      onLog(`Located ${analyses.length} deficit nodes.`, 'success');
    } catch (err) {
      onLog("Analysis failed.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAutonomousDispatch = async (companyName: string) => {
    const node = results.find(r => r.company === companyName);
    if (!node || node.status === 'SENT') return;

    setResults(prev => prev.map(r => r.company === companyName ? { ...r, status: 'ENRICHING' } : r));
    const email = await geminiService.enrichCompanyEmail(companyName, node.website);
    
    setResults(prev => prev.map(r => r.company === companyName ? { ...r, status: 'TAILORING' } : r));
    
    const auditReport = await geminiService.getOperationalAudit(
      `Deep operational audit: ${node.company}. Find 3 high-impact efficiency gaps and map out a $5,000 solution.`, 
      profile
    );

    const pitch = await geminiService.generateB2BPitch(companyName, node.gaps, node.solution, profile);
    
    const subject = `Strategic Efficiency Proposal - ${node.company}`;
    const mailtoUrl = `mailto:${email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(pitch || '')}`;
    window.open(mailtoUrl, '_blank');

    setResults(prev => prev.map(r => r.company === companyName ? { 
      ...r, 
      email: email !== 'Not Found' ? email : undefined,
      pitch: pitch || undefined,
      auditReport: auditReport || undefined,
      status: 'SENT' 
    } : r));
    
    onSent({ 
      type: 'B2B_PITCH', 
      recipient: email || node.company, 
      subject: subject
    });

    onLog(`RELAY TRIGGERED: B2B Proposal draft dispatched for ${companyName}.`, 'success');
  };

  const activeNodes = useMemo(() => results.filter(r => r.status !== 'SHORTED'), [results]);

  return (
    <div className="space-y-8 pb-24 px-10 md:px-20">
      {/* Fix: Added back button to match JobAutopilot pattern and use onBack prop */}
      <div className="flex justify-between items-center mb-10 pt-10">
         <button onClick={onBack} className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
            BACK TO COMMAND
         </button>
      </div>

      <div className="bg-gradient-to-br from-purple-900/20 to-slate-950 border border-purple-500/20 p-12 rounded-[4rem] shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 blur-[150px] pointer-events-none"></div>
         <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="w-24 h-24 bg-purple-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="flex-1 space-y-3">
               <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">B2B Pitch Machine</h2>
               <p className="text-sm text-slate-400 font-black uppercase tracking-widest">Autonomous Revenue Identification & Outreach Engine.</p>
            </div>
         </div>
      </div>

      <div className="bg-slate-950 border border-slate-900 rounded-[3.5rem] p-12 shadow-2xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input type="text" placeholder="Sector (e.g. Fintech)..." className="bg-black border border-slate-800 rounded-3xl px-8 py-6 text-white text-lg font-bold outline-none focus:border-purple-500 transition-all" value={companyType} onChange={(e) => setCompanyType(e.target.value)} />
          <input type="text" placeholder="Targeting Area..." className="bg-black border border-slate-800 rounded-3xl px-8 py-6 text-white text-lg font-bold outline-none focus:border-purple-500 transition-all" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <button onClick={handleGapAnalysis} disabled={loading || !companyType} className="w-full bg-white text-black hover:bg-purple-600 hover:text-white font-black py-7 rounded-[2rem] uppercase text-sm tracking-[0.4em] transition-all shadow-xl">
          {loading ? 'Performing Audit...' : 'Identify High-Value Deficit Nodes'}
        </button>
      </div>

      {activeNodes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeNodes.map((node, i) => (
            <div key={i} className={`p-12 border rounded-[4rem] transition-all flex flex-col justify-between min-h-[580px] group ${node.status === 'SENT' ? 'border-purple-500 bg-purple-950/10 shadow-2xl' : 'border-slate-800 bg-slate-950'}`}>
               <div>
                  <div className="flex justify-between items-start mb-10">
                     <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none pr-6">{node.company}</h3>
                     <div className="bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-full">
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">${node.projectedValue.toLocaleString()} VALUE</span>
                     </div>
                  </div>
                  <YieldPulse value={node.projectedValue} />
                  
                  <div className="mt-12 space-y-6">
                     <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest">Located Deficits:</p>
                     {node.gaps.map((gap, idx) => (
                       <div key={idx} className="flex gap-5 p-5 bg-black/40 rounded-2xl border border-slate-900">
                          <span className="text-purple-500 font-black">»</span>
                          <span className="text-[12px] text-slate-400 font-bold uppercase tracking-tight leading-tight">{gap}</span>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="mt-12 pt-8 border-t border-slate-900">
                  {node.status === 'SENT' ? (
                    <button onClick={() => setViewingPitch(node)} className="w-full bg-white text-black py-6 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-xl">Audit Dispatched Proposal</button>
                  ) : (
                    <button 
                      disabled={node.status !== 'IDLE'}
                      onClick={() => handleAutonomousDispatch(node.company)}
                      className="w-full bg-purple-600 text-white py-6 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-purple-500 transition-all active:scale-95 disabled:opacity-30"
                    >
                      {node.status === 'IDLE' ? 'Prepare & Auto-Relay' : 'Triggering System Draft...'}
                    </button>
                  )}
               </div>
            </div>
          ))}
        </div>
      )}

      {viewingPitch && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-10 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-500">
           <div className="w-full max-w-6xl h-full max-h-[92vh] bg-white rounded-[5rem] flex flex-col overflow-hidden shadow-2xl relative">
              <div className="px-16 py-10 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-8">
                  <div className="w-16 h-16 bg-purple-600 rounded-[2rem] flex items-center justify-center text-white font-black text-3xl shadow-lg">✓</div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">B2B Audit: {viewingPitch.company}</h3>
                    <p className="text-xs text-slate-500 uppercase font-black tracking-widest mt-2">STATUS: DRAFT TRIGGERED AUTOMATICALLY</p>
                  </div>
                </div>
                <button onClick={() => setViewingPitch(null)} className="p-4 text-slate-300 hover:text-slate-900 transition-all"><svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>

              <div className="flex-1 overflow-y-auto p-16 lg:p-24 bg-slate-50 custom-scrollbar">
                  <div className="max-w-5xl mx-auto space-y-12">
                     <div className="bg-purple-50 border border-purple-100 p-12 rounded-[3rem] space-y-6">
                        <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em]">Neural Audit Dispatch</h4>
                        <div className="text-lg font-serif italic text-slate-800 leading-relaxed whitespace-pre-wrap">
                           {viewingPitch.auditReport}
                        </div>
                     </div>
                     <div className="bg-white border border-slate-200 rounded-[4rem] p-20 font-serif text-xl leading-relaxed text-slate-800 shadow-2xl whitespace-pre-wrap">
                        {viewingPitch.pitch}
                     </div>
                  </div>
              </div>

              <div className="p-12 bg-white border-t border-slate-100 flex justify-center">
                 <button onClick={() => setViewingPitch(null)} className="bg-slate-900 text-white px-24 py-7 rounded-[2.5rem] font-black uppercase text-sm tracking-[0.4em] hover:bg-purple-600 transition-all shadow-xl">Return to Hub</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default RevenueHubs;
