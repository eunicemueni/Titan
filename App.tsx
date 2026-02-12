import React, { useState, useEffect, useCallback } from 'react';
import { AppView, UserProfile, JobRecord, TelemetryLog, SentRecord, AppAnalytics, QueueStatus } from './types';
import Dashboard from './modules/Dashboard';
import MissionControl from './modules/MissionControl';
import ScraperNode from './modules/JobAutopilot';
import HiddenHunter from './modules/HiddenHunter';
import RevenueHubs from './modules/RevenueHubs';
import IdentityVault from './modules/IdentityVault';
import SystemDeploy from './modules/SystemDeploy';
import GigFlash from './modules/GigFlash';
import MarketNexus from './modules/MarketNexus';
import ClientNexus from './modules/ClientNexus';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Console from './components/Console';
import NeuralLink from './components/NeuralLink';
import MobileNav from './components/MobileNav';
import GlobalSearchModal from './components/GlobalSearchModal';
import { INITIAL_TELEMETRY } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hubOnline, setHubOnline] = useState<boolean | null>(null);
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [sentRecords, setSentRecords] = useState<SentRecord[]>([]);
  const [logs, setLogs] = useState<TelemetryLog[]>(INITIAL_TELEMETRY);
  const [isAutopilotActive, setIsAutopilotActive] = useState(false);
  const [targetDailyCap, setTargetDailyCap] = useState(150);
  const [autoGigs, setAutoGigs] = useState<any[]>([]);

  const profiles: UserProfile[] = [
    {
      fullName: "Eunice Muema",
      email: "eunice.muema@titannodes.ai",
      domain: "Actuarial & Risk Proxy",
      themeColor: "indigo",
      portfolioUrl: "https://eunicemuema.pro",
      linkedinUrl: "linkedin.com/in/eunice-muema",
      masterCV: "Strategic Actuarial Lead with 10+ years in risk modeling and stochastic analysis.",
      expertiseBlocks: { "ACTUARIAL": "Deep stochastic modeling, risk mitigation, and liability auditing." },
      preferences: { minSalary: "180k", targetRoles: ["Actuarial Director"], remoteOnly: true },
      stats: { coldEmailsSent: 142, leadsGenerated: 24, salesClosed: 4, totalRevenue: 15600 }
    }
  ];

  const currentProfile = profiles[activeIndex];

  const addLog = useCallback((message: string, level: TelemetryLog['level'] = 'info') => {
    const newLog: TelemetryLog = { id: Date.now().toString(), message, level, timestamp: Date.now() };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    const checkHub = async () => {
      try {
        const res = await fetch('/api/health');
        setHubOnline(res.ok);
      } catch {
        setHubOnline(false);
      }
    };
    checkHub();
  }, []);

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const handleSentRecord = (record: Omit<SentRecord, 'id' | 'timestamp' | 'status'>) => {
    const newRecord: SentRecord = {
      ...record,
      id: `sent-${Date.now()}`,
      timestamp: Date.now(),
      status: 'DISPATCHED'
    };
    setSentRecords(prev => [newRecord, ...prev]);
  };

  const renderView = () => {
    const commonProps = {
      profile: currentProfile,
      onLog: addLog,
      onSent: handleSentRecord,
      onBack: () => setCurrentView(AppView.DASHBOARD),
      targetDailyCap
    };

    switch (currentView) {
      case AppView.MISSION_CONTROL:
        return <MissionControl {...commonProps} jobs={jobs} setJobs={setJobs} isAutopilot={isAutopilotActive} onToggleAutopilot={() => setIsAutopilotActive(!isAutopilotActive)} sentRecords={sentRecords} queueStatus={{waiting: 0, active: 0, completed: 0, failed: 0}} evasionStatus="STEALTH" missions={[]} />;
      case AppView.JOB_SCANNER:
        return <ScraperNode {...commonProps} setJobs={setJobs} jobs={jobs} updateStats={() => {}} bridgeStatus={hubOnline ? 'ONLINE' : 'OFFLINE'} onReconnect={() => {}} />;
      case AppView.OUTREACH:
        return <HiddenHunter {...commonProps} updateStats={() => {}} companies={[]} setCompanies={() => {}} evasionStatus="STEALTH" />;
      case AppView.INCOME_GIGS:
        return <GigFlash {...commonProps} autoGigs={autoGigs} setAutoGigs={setAutoGigs} isAutopilot={isAutopilotActive} />;
      case AppView.INCOME_B2B:
        return <RevenueHubs {...commonProps} updateStats={() => {}} />;
      case AppView.MARKET_NEXUS:
        return <MarketNexus {...commonProps} updateStats={() => {}} />;
      case AppView.PROFILE:
        return <IdentityVault profiles={profiles} setProfiles={() => {}} activeIndex={activeIndex} setActiveIndex={setActiveIndex} onLog={addLog} onTrack={() => {}} sentRecords={sentRecords} setSentRecords={() => {}} analytics={{agentDetections: 0, customCVsGenerated: 0, totalIncome: 0, lastPulse: 0, activeLeads: 0}} setAnalytics={() => {}} />;
      case AppView.VAULT_SYNC:
        return <SystemDeploy onLog={addLog} bridgeStatus={hubOnline ? 'ONLINE' : 'OFFLINE'} onReconnect={() => {}} />;
      default:
        return <Dashboard profile={currentProfile} profiles={profiles} activeIndex={activeIndex} onSwitchProfile={setActiveIndex} jobs={jobs} sentRecords={sentRecords} onNavigate={handleNavigate} analytics={{agentDetections: 0, customCVsGenerated: 0, totalIncome: 0, lastPulse: 0, activeLeads: 0}} logs={logs} isAutopilot={isAutopilotActive} onToggleAutopilot={() => setIsAutopilotActive(!isAutopilotActive)} missions={[]} queueStatus={{waiting: 0, active: 0, completed: 0, failed: 0}} targetDailyCap={targetDailyCap} setTargetDailyCap={setTargetDailyCap} evasionStatus="STEALTH" hubOnline={hubOnline} />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-titan-bg font-sans text-slate-200 overflow-hidden relative">
      <Sidebar activeView={currentView} onNavigate={handleNavigate} bridgeStatus={hubOnline ? 'ONLINE' : 'OFFLINE'} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header 
          activeView={currentView} 
          activePersona={currentProfile.fullName}
          personaDomain={currentProfile.domain}
          personaTheme={currentProfile.themeColor}
          voiceEnabled={voiceEnabled}
          onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
          onSearch={(q) => { setSearchQuery(q); setSearchOpen(true); }}
          onOpenConsole={() => setConsoleOpen(true)}
        />
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          {renderView()}
        </main>
        <MobileNav activeView={currentView} onNavigate={handleNavigate} />
      </div>
      <Console isOpen={consoleOpen} onClose={() => setConsoleOpen(false)} profile={currentProfile} onLog={addLog} autopilot={isAutopilotActive} setAutopilot={setIsAutopilotActive} dailyCap={targetDailyCap} setDailyCap={setTargetDailyCap} setView={setCurrentView} evasionStatus="STEALTH" />
      <NeuralLink isActive={voiceEnabled} onClose={() => setVoiceEnabled(false)} />
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} query={searchQuery} jobs={jobs} sentRecords={sentRecords} profiles={profiles} onNavigate={handleNavigate} />
    </div>
  );
};

export default App;