import React, { useState, useEffect, useCallback } from 'react';
import { AppView, UserProfile, JobRecord, TelemetryLog, SentRecord, AppAnalytics, TargetedCompany, Mission, IndustryType, QueueStatus } from './types';
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
import Console from './components/Console';
import NeuralLink from './components/NeuralLink';
import MobileNav from './components/MobileNav';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [activeIndex, setActiveIndex] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({ waiting: 0, active: 0, completed: 0, failed: 0 });
  const [targetDailyCap, setTargetDailyCap] = useState(1000);
  const [evasionStatus, setEvasionStatus] = useState<'STABLE' | 'ROTATING' | 'STEALTH'>('STABLE');
  const [hubOnline, setHubOnline] = useState<boolean | null>(null);

  const [isAutopilotActive, setIsAutopilotActive] = useState(false);
  const [missions, setMissions] = useState<Mission[]>([
    { id: 'USA_REMOTE' as any, status: 'IDLE', lastRun: 0, totalFound: 0 },
    { id: 'GLOBAL_REMOTE' as any, status: 'IDLE', lastRun: 0, totalFound: 0 },
    { id: 'UNIVERSAL', status: 'IDLE', lastRun: 0, totalFound: 0 },
    { id: 'DATA_ANALYST', status: 'IDLE', lastRun: 0, totalFound: 0 },
  ]);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [sentRecords, setSentRecords] = useState<SentRecord[]>([]);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [flashGigs, setFlashGigs] = useState<any[]>([]);
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
      email: 'eunicemueni1009@gmail.com',
      domain: 'Global Risk',
      themeColor: 'indigo',
      portfolioUrl: 'https://8000-ixf0j88oieq1a5at5s206-dbf9d88d.us2.manus.computer',
      linkedinUrl: 'https://www.linkedin.com/in/eunice-muema-a3614a378',
      dossierLink: 'https://8000-ixf0j88oieq1a5at5s206-dbf9d88d.us2.manus.computer/cv_eunice_muema.pdf',
      masterCV: `EUNICE MUEMA...`,
      expertiseBlocks: { 'UNIVERSAL': 'Worldwide Remote Strategic Node...' },
      preferences: { minSalary: '$115,000', targetRoles: ['Senior Actuarial Analyst'], remoteOnly: true },
      stats: { coldEmailsSent: 156, leadsGenerated: 54, salesClosed: 15, totalRevenue: 32000 }
    }
  ]);

  const activeProfile = profiles[activeIndex] || profiles[0];

  const addLog = useCallback((message: string, level: TelemetryLog['level'] = 'info') => {
    const newLog: TelemetryLog = { id: `log-${Date.now()}-${Math.random()}`, message, level, timestamp: Date.now() };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  }, []);

  // HEARTBEAT CHECK: Detect if backend is online
  useEffect(() => {
    const checkHub = async () => {
      try {
        const res = await fetch('/api/health');
        setHubOnline(res.ok);
      } catch (e) {
        setHubOnline(false);
      }
    };
    checkHub();
    const interval = setInterval(checkHub, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSentRecord = (record: any) => {
    const newRecord: SentRecord = { 
      ...record, 
      id: `sent-${Date.now()}`, 
      timestamp: Date.now(), 
      status: 'DISPATCHED',
      payload: record.body || record.pitch || record.emailBody || "" 
    };
    setSentRecords(prev => [newRecord, ...prev]);
    addLog(`TRANSFERRED: ${record.type} relay to ${record.recipient}`, 'success');
  };

  const renderView = () => {
    const commonProps = { 
      profile: activeProfile, 
      onLog: addLog, 
      onSent: handleSentRecord, 
      onBack: () => setCurrentView(AppView.DASHBOARD),
      targetDailyCap,
      evasionStatus
    };
    
    switch (currentView) {
      case AppView.DASHBOARD: 
        return <Dashboard {...commonProps} profiles={profiles} activeIndex={activeIndex} onSwitchProfile={setActiveIndex} jobs={jobs} sentRecords={sentRecords} analytics={analytics} logs={logs} isAutopilot={isAutopilotActive} onToggleAutopilot={() => setIsAutopilotActive(!isAutopilotActive)} missions={missions} queueStatus={queueStatus} setTargetDailyCap={setTargetDailyCap} onNavigate={setCurrentView} hubOnline={hubOnline} />;
      case AppView.VAULT_SYNC: 
        return <SystemDeploy onLog={addLog} bridgeStatus={hubOnline ? "ONLINE" : "OFFLINE"} onReconnect={() => {}} />;
      case AppView.MISSION_CONTROL:
        return <MissionControl {...commonProps} jobs={jobs} sentRecords={sentRecords} setJobs={setJobs} isAutopilot={isAutopilotActive} onToggleAutopilot={() => setIsAutopilotActive(!isAutopilotActive)} missions={missions} queueStatus={queueStatus} />;
      // ... other views truncated for brevity, same as before
      default: 
        return <Dashboard {...commonProps} profiles={profiles} activeIndex={activeIndex} onSwitchProfile={setActiveIndex} jobs={jobs} sentRecords={sentRecords} analytics={analytics} logs={logs} isAutopilot={isAutopilotActive} onToggleAutopilot={() => setIsAutopilotActive(!isAutopilotActive)} missions={missions} queueStatus={queueStatus} setTargetDailyCap={setTargetDailyCap} onNavigate={setCurrentView} hubOnline={hubOnline} />;
    }
  };

  return (
    <div className="h-screen w-screen bg-[#02040a] text-slate-300 font-sans overflow-hidden flex flex-col md:flex-row selection:bg-indigo-500/30">
      <Sidebar activeView={currentView} onNavigate={setCurrentView} bridgeStatus={hubOnline ? "ONLINE" : "OFFLINE"} />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header activeView={currentView} activePersona={activeProfile.fullName} personaTheme={activeProfile.themeColor} voiceEnabled={voiceEnabled} onToggleVoice={() => setVoiceEnabled(!voiceEnabled)} onSearch={() => {}} onOpenConsole={() => setConsoleOpen(true)} />
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-titan-bg pb-24 md:pb-8">
          <div className="w-full min-h-full">{renderView()}</div>
        </main>
        
        {hubOnline === false && currentView !== AppView.VAULT_SYNC && (
          <div className="fixed inset-x-0 top-16 z-[100] p-4 animate-in slide-in-from-top-full duration-500">
             <div className="max-w-xl mx-auto bg-red-600/90 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-600 font-black">!</div>
                   <div>
                      <h4 className="text-white text-[10px] font-black uppercase tracking-widest">Server Hub Offline</h4>
                      <p className="text-white/60 text-[8px] font-bold uppercase mt-1">Autonomous protocols disabled. Check System Health.</p>
                   </div>
                </div>
                <button onClick={() => setCurrentView(AppView.VAULT_SYNC)} className="px-6 py-2 bg-white text-black text-[9px] font-black uppercase rounded-full shadow-lg">Fix Now</button>
             </div>
          </div>
        )}

        <Console isOpen={consoleOpen} onClose={() => setConsoleOpen(false)} profile={activeProfile} onLog={addLog} autopilot={isAutopilotActive} setAutopilot={setIsAutopilotActive} dailyCap={targetDailyCap} setDailyCap={setTargetDailyCap} setView={setCurrentView} evasionStatus={evasionStatus} />
        <NeuralLink isActive={voiceEnabled} onClose={() => setVoiceEnabled(false)} />
        <MobileNav activeView={currentView} onNavigate={setCurrentView} />
      </div>
    </div>
  );
};

export default App;