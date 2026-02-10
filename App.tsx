
import React, { useState, useEffect, useCallback } from 'react';
import { AppView, UserProfile, JobRecord, TelemetryLog, SentRecord, AppAnalytics, TargetedCompany, Mission, IndustryType } from './types';
import Dashboard from './modules/Dashboard';
import MissionControl from './modules/MissionControl';
import ScraperNode from './modules/JobAutopilot';
import HiddenHunter from './modules/HiddenHunter';
import RevenueHubs from './modules/RevenueHubs';
import Profile from './modules/IdentityVault';
import SystemDeploy from './modules/SystemDeploy';
import GigFlash from './modules/GigFlash';
import MarketNexus from './modules/MarketNexus';
import ClientNexus from './modules/ClientNexus';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import GlobalSearchModal from './components/GlobalSearchModal';
import Console from './components/Console';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const [isAutopilotActive, setIsAutopilotActive] = useState(false);
  const [missions, setMissions] = useState<Mission[]>([
    { id: 'DATA_ANALYST', status: 'IDLE', lastRun: 0, totalFound: 0 },
    { id: 'ACTUARIAL', status: 'IDLE', lastRun: 0, totalFound: 0 },
    { id: 'FINANCE', status: 'IDLE', lastRun: 0, totalFound: 0 },
    { id: 'SALES', status: 'IDLE', lastRun: 0, totalFound: 0 },
    { id: 'AI_TRAINING', status: 'IDLE', lastRun: 0, totalFound: 0 },
    { id: 'FREELANCE', status: 'IDLE', lastRun: 0, totalFound: 0 },
  ]);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);

  const [sentRecords, setSentRecords] = useState<SentRecord[]>(() => {
    const saved = localStorage.getItem('titan_sent_records_v19');
    return saved ? JSON.parse(saved) : [];
  });

  const [jobs, setJobs] = useState<JobRecord[]>(() => {
    const saved = localStorage.getItem('titan_jobs_pool_v19');
    return saved ? JSON.parse(saved) : [];
  });

  const [companies, setCompanies] = useState<TargetedCompany[]>([]);
  const [analytics, setAnalytics] = useState<AppAnalytics>({ 
    agentDetections: 0, 
    customCVsGenerated: 0, 
    totalIncome: 12400, 
    lastPulse: Date.now(), 
    activeLeads: 0 
  });

  const [profiles, setProfiles] = useState<UserProfile[]>([
    {
      fullName: 'Eunice Muema',
      email: 'eunicemueni1044@gmail.com',
      domain: 'Actuarial Strategy',
      themeColor: 'indigo',
      portfolioUrl: 'https://8000-ixf0j88oieq1a5at5s206-dbf9d88d.us2.manus.computer',
      linkedinUrl: 'https://www.linkedin.com/in/eunice-muema-a3614a378',
      dossierLink: 'https://8000-ixf0j88oieq1a5at5s206-dbf9d88d.us2.manus.computer/cv_eunice_muema.pdf',
      masterCV: `EUNICE MUEMA - Actuarial Analyst | Risk Management Professional...`,
      expertiseBlocks: {
        'ACTUARIAL': 'Lead Actuarial Strategist. Expert in Prophet/MoSes. 5,000+ member pension valuation. KES 50M liability reduction specialist.',
        'DATA_ANALYST': 'Quantitative Data Manager. 100k+ records, SQL/ETL specialist, Tableau/Power BI dashboard architect.',
        'FINANCE': 'Enterprise Risk Leader. Master\'s in Actuarial Science, LDI strategy, and regulatory compliance (ASK Member).',
        'GENERAL': 'Senior Actuarial & Risk Professional with 7+ years institutional experience in financial modeling and governance.'
      },
      preferences: { minSalary: '$115,000', targetRoles: ['Senior Actuarial Analyst', 'Risk Manager', 'Quantitative Analyst'], remoteOnly: true },
      stats: { coldEmailsSent: 156, leadsGenerated: 54, salesClosed: 15, totalRevenue: 32000 }
    },
    {
      fullName: 'Ayana Inniss',
      email: 'ayanainniss100@gmail.com',
      domain: 'Data Analytics & AI',
      themeColor: 'cyan',
      portfolioUrl: 'https://ayanaportf-6fvwehha.manus.space/',
      linkedinUrl: 'https://www.linkedin.com/in/ayana-inniss-5b01332b0',
      dossierLink: 'https://ayanaportf-6fvwehha.manus.space/resume_ayana_inniss.pdf',
      masterCV: `AYANA INNISS - Data Analyst | AI/ML Expert | STEM Educator...`,
      expertiseBlocks: {
        'DATA_ANALYST': 'Senior Analytics Hub. Specialist in 8M+ revenue impact analysis, executive BI, and SQL/Python automation.',
        'AI_TRAINING': 'Neural Model Specialist. 92% accuracy forecast platforms, NLP/LLM training pipelines, and statistical modeling.',
        'FREELANCE': 'Efficiency Transformation Professional. 70% manual work reduction via Airflow/Python. High-velocity ETL specialist.',
        'GENERAL': 'Data Science Leader with a strong mathematical foundation and proven 2.5M+ individual project ROI.'
      },
      preferences: { minSalary: '$140,000', targetRoles: ['Senior Data Analyst', 'Data Science Lead', 'BI Architect'], remoteOnly: true },
      stats: { coldEmailsSent: 284, leadsGenerated: 92, salesClosed: 24, totalRevenue: 85000 }
    }
  ]);

  const activeProfile = profiles[activeIndex] || profiles[0];

  const addLog = useCallback((message: string, level: TelemetryLog['level'] = 'info') => {
    const newLog: TelemetryLog = { id: `log-${Date.now()}-${Math.random()}`, message, level, timestamp: Date.now() };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  }, []);

  const updateMission = (id: IndustryType, updates: Partial<Mission>) => {
    setMissions(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  useEffect(() => {
    if (!isAutopilotActive) return;
    let currentMissionIdx = 0;
    const missionIds: IndustryType[] = ['DATA_ANALYST', 'ACTUARIAL', 'FINANCE', 'SALES', 'AI_TRAINING', 'FREELANCE'];
    const executeCycle = async () => {
      const industry = missionIds[currentMissionIdx];
      updateMission(industry, { status: 'SCANNING', currentTask: 'Pulsing Global Market Nodes...' });
      try {
        const discovered = await geminiService.performUniversalScrape(industry, "Remote/Worldwide");
        updateMission(industry, { totalFound: discovered.length, currentTask: 'Mapping Decision Makers...' });
        const newJobs: JobRecord[] = discovered.map((d: any, i: number) => ({
          ...d,
          id: `remote-${Date.now()}-${i}`,
          company: d.company,
          role: d.roleOrOpportunity,
          location: 'Remote',
          matchScore: 90 + Math.floor(Math.random() * 10),
          status: 'discovered',
          timestamp: Date.now(),
          industry
        }));
        setJobs(prev => {
          const combined = [...newJobs, ...prev];
          return Array.from(new Map(combined.map(item => [item.company + item.role, item])).values()).slice(0, 50);
        });
        updateMission(industry, { status: 'COMPLETED', lastRun: Date.now(), currentTask: 'Monitoring...' });
      } catch (err) { updateMission(industry, { status: 'IDLE' }); }
      currentMissionIdx = (currentMissionIdx + 1) % missionIds.length;
    };
    executeCycle();
    const interval = setInterval(executeCycle, 60000); 
    return () => clearInterval(interval);
  }, [isAutopilotActive, activeProfile]);

  useEffect(() => {
    localStorage.setItem('titan_sent_records_v19', JSON.stringify(sentRecords));
    localStorage.setItem('titan_jobs_pool_v19', JSON.stringify(jobs));
  }, [sentRecords, jobs]);

  const trackSent = (record: Omit<SentRecord, 'id' | 'timestamp' | 'status'>) => {
    const newRecord: SentRecord = { ...record, id: `txn-${Date.now()}`, timestamp: Date.now(), status: 'DISPATCHED' };
    setSentRecords(prev => [newRecord, ...prev].slice(0, 100));
  };

  const updateProfileStats = (updates: Partial<UserProfile['stats']>) => {
    setProfiles(prev => {
      const next = [...prev];
      next[activeIndex] = { ...next[activeIndex], stats: { ...next[activeIndex].stats, ...updates } };
      return next;
    });
  };

  const handleSwitchProfile = (idx: number) => {
    setActiveIndex(idx);
    addLog(`PERSONNEL_SYNC: Identity Vault locked to ${profiles[idx].fullName} (${profiles[idx].domain})`, 'success');
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD: return <Dashboard profile={activeProfile} jobs={jobs} sentRecords={sentRecords} onNavigate={setCurrentView} analytics={analytics} profiles={profiles} activeIndex={activeIndex} onSwitchProfile={handleSwitchProfile} logs={logs} isAutopilot={isAutopilotActive} onToggleAutopilot={() => setIsAutopilotActive(!isAutopilotActive)} missions={missions} />;
      case AppView.MISSION_CONTROL: return <MissionControl profile={activeProfile} jobs={jobs} setJobs={setJobs} onLog={addLog} onSent={trackSent} isAutopilot={isAutopilotActive} onToggleAutopilot={() => setIsAutopilotActive(!isAutopilotActive)} missions={missions} />;
      case AppView.JOB_SCANNER: return <ScraperNode profile={activeProfile} onLog={addLog} setJobs={setJobs} jobs={jobs} onSent={trackSent} updateStats={updateProfileStats} onBack={() => setCurrentView(AppView.DASHBOARD)} bridgeStatus="ONLINE" onReconnect={() => {}} />;
      case AppView.OUTREACH: return <HiddenHunter profile={activeProfile} onLog={addLog} updateStats={updateProfileStats} onSent={trackSent} companies={companies} setCompanies={setCompanies} onBack={() => setCurrentView(AppView.DASHBOARD)} />;
      case AppView.CLIENT_NEXUS: return <ClientNexus profile={activeProfile} onLog={addLog} onSent={trackSent} updateStats={updateProfileStats} onBack={() => setCurrentView(AppView.DASHBOARD)} />;
      case AppView.MARKET_NEXUS: return <MarketNexus profile={activeProfile} onLog={addLog} onSent={trackSent} updateStats={updateProfileStats} onBack={() => setCurrentView(AppView.DASHBOARD)} />;
      case AppView.INCOME_B2B: return <RevenueHubs profile={activeProfile} onLog={addLog} updateStats={updateProfileStats} onSent={trackSent} onBack={() => setCurrentView(AppView.DASHBOARD)} />;
      case AppView.INCOME_GIGS: return <GigFlash profile={activeProfile} onLog={addLog} onSent={trackSent} onBack={() => setCurrentView(AppView.DASHBOARD)} />;
      case AppView.PROFILE: return <Profile profiles={profiles} setProfiles={setProfiles} activeIndex={activeIndex} setActiveIndex={handleSwitchProfile} onLog={addLog} onTrack={() => {}} sentRecords={sentRecords} setSentRecords={setSentRecords} analytics={analytics} setAnalytics={setAnalytics} />;
      case AppView.VAULT_SYNC: return <SystemDeploy onLog={addLog} bridgeStatus="ONLINE" onReconnect={() => {}} />;
      default: return <Dashboard profile={activeProfile} jobs={jobs} sentRecords={sentRecords} onNavigate={setCurrentView} analytics={analytics} profiles={profiles} activeIndex={activeIndex} onSwitchProfile={handleSwitchProfile} logs={logs} isAutopilot={isAutopilotActive} onToggleAutopilot={() => setIsAutopilotActive(!isAutopilotActive)} missions={missions} />;
    }
  };

  return (
    <div className="h-screen w-screen bg-[#02040a] text-slate-300 font-sans overflow-hidden flex selection:bg-indigo-500/30">
      <Sidebar activeView={currentView} onNavigate={setCurrentView} bridgeStatus="ONLINE" />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header 
          activeView={currentView} 
          activePersona={activeProfile.fullName} 
          personaDomain={activeProfile.domain}
          personaTheme={activeProfile.themeColor}
          voiceEnabled={voiceEnabled} 
          onToggleVoice={() => setVoiceEnabled(!voiceEnabled)} 
          onSearch={(q) => { setSearchQuery(q); setIsSearchOpen(true); }} 
        />
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-titan-bg">
          <div className="w-full min-h-full">{renderView()}</div>
        </main>
        <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} query={searchQuery} jobs={jobs} sentRecords={sentRecords} profiles={profiles} onNavigate={setCurrentView} />
        <Console isOpen={isConsoleOpen} onClose={() => setIsConsoleOpen(false)} logs={logs} bridgeStatus="ONLINE" />
        
        {/* TITAN OS Status Bar */}
        <div className="h-8 bg-black/80 backdrop-blur-md border-t border-white/5 flex items-center px-6 justify-between text-[8px] font-black uppercase tracking-widest z-[100]">
          <button onClick={() => setIsConsoleOpen(!isConsoleOpen)} className="flex items-center gap-4 hover:bg-white/5 px-4 h-full transition-all group">
            <span className={`transition-colors uppercase tracking-widest ${activeProfile.themeColor === 'cyan' ? 'text-cyan-400 group-hover:text-white' : 'text-indigo-500 group-hover:text-white'}`}>TITAN_OS_v6.4</span>
            <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] ${activeProfile.themeColor === 'cyan' ? 'bg-cyan-500' : 'bg-emerald-500'}`}></span>
            <span className="text-slate-600 tracking-[0.2em] group-hover:text-slate-300 transition-colors uppercase">IDENTITY: {activeProfile.fullName.toUpperCase()}</span>
          </button>
          <div className="text-slate-600 flex gap-4 font-mono text-[7px]">
             <span>MEM_POOL: {jobs.length}/50</span>
             <span>TXN_NODES: {sentRecords.length}</span>
             <span>SYNC: TITAN_CLOUD_RELAY</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
