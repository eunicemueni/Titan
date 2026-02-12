import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppView, UserProfile, JobRecord, TelemetryLog, SentRecord, AppAnalytics, Mission, QueueStatus, IndustryType } from './types';
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
import { geminiService } from './services/geminiService';
import { INITIAL_TELEMETRY } from './constants';

const App: React.FC = () => {
  // Navigation & UI State
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hubOnline, setHubOnline] = useState<boolean | null>(null);
  
  // Data State
  const [activeIndex, setActiveIndex] = useState(0);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [sentRecords, setSentRecords] = useState<SentRecord[]>([]);
  const [logs, setLogs] = useState<TelemetryLog[]>(INITIAL_TELEMETRY);
  const [isAutopilotActive, setIsAutopilotActive] = useState(false);
  const [targetDailyCap, setTargetDailyCap] = useState(150);
  const [autoGigs, setAutoGigs] = useState<any[]>([]);

  // Analytics & Queue
  const [analytics, setAnalytics] = useState<AppAnalytics>({ 
    agentDetections: 0, customCVsGenerated: 0, totalIncome: 12400, lastPulse: Date.now(), activeLeads: 0 
  });
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({ waiting: 0, active: 0, completed: 0, failed: 0 });

  const profiles: UserProfile[] = [
    {
      fullName: "Eunice Muema",
      email: "eunice.muema@titannodes.ai",
      domain: "Actuarial & Risk Proxy",
      themeColor: "indigo",
      portfolioUrl: "https://eunicemuema.pro",
      linkedinUrl: "linkedin.com/in/eunice-muema",
      masterCV: "Strategic Actuarial Lead with 10+ years in risk modeling and stochastic analysis. Expert in bridging operational logic with high-velocity revenue growth.",
      expertiseBlocks: { "ACTUARIAL": "Deep stochastic modeling, risk mitigation, and liability auditing." },
      preferences: { minSalary: "180k", targetRoles: ["Actuarial Director", "Risk Manager"], remoteOnly: true },
      stats: { coldEmailsSent: 142, leadsGenerated: 24, salesClosed: 4, totalRevenue: 15600 }
    },
    {
      fullName: "Atlas Prime",
      email: "atlas@titannodes.ai",
      domain: "AI Engineering & Ops",
      themeColor: "cyan",
      portfolioUrl: "https://atlas-ops.io",
      linkedinUrl: "linkedin.com/in/atlas-ai",
      masterCV: "Full-stack AI Engineer specializing in autonomous systems and LLM orchestration. Built TITAN OS Core.",
      expertiseBlocks: { "AI_TRAINING": "Neural architecture, vector database optimization, and high-concurrency scraping." },
      preferences: { minSalary: "200k", targetRoles: ["AI Engineer", "CTO"], remoteOnly: true },
      stats: { coldEmailsSent: 89, leadsGenerated: 12, salesClosed: 2, totalRevenue: 45000 }
    }
  ];

  const currentProfile = profiles[activeIndex];

  // System Handlers
  const addLog = useCallback((message: string, level: TelemetryLog['level'] = 'info') => {
    const newLog: TelemetryLog = { id: Date.now().toString(), message, level, timestamp: Date.now() };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  }, []);

  const handleToggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (!voiceEnabled) addLog("NEURAL_LINK: Voice synchronization initiated.", "info");
  };

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSearchOpen(true);
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

  // Connection Polling
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
    const interval = setInterval(checkHub, 10000);
    return () => clearInterval(interval);
  }, []);

  // View Router
  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return (
          <Dashboard 
            profile={currentProfile}
            profiles={profiles}
            activeIndex={activeIndex}
            onSwitchProfile={setActiveIndex}
            jobs={jobs}
            sentRecords={sentRecords}
            onNavigate={handleNavigate}
            analytics={analytics}
            logs={logs}
            isAutopilot={isAutopilotActive}
            onToggleAutopilot={() => setIsAutopilotActive(!isAutopilotActive)}
            missions={[]}
            queueStatus={queueStatus}
            targetDailyCap={targetDailyCap}
            setTargetDailyCap={setTargetDailyCap}
            evasionStatus="STEALTH"
            hubOnline={hubOnline}
          />
        );
      case AppView.MISSION_CONTROL:
        return (
          <MissionControl 
            profile={currentProfile}
            jobs={jobs}
            sentRecords={sentRecords}
            setJobs={setJobs}
            onLog={addLog}
            onSent={handleSentRecord}
            isAutopilot={isAutopilotActive}
            onToggleAutopilot={() => setIsAutopilotActive(!isAutopilotActive)}
            missions={[]}
            queueStatus={queueStatus}
            targetDailyCap={targetDailyCap}
            evasionStatus="STEALTH"
          />
        );
      case AppView.JOB_SCANNER:
        return (
          <ScraperNode 
            profile={currentProfile}
            onLog={addLog}
            setJobs={setJobs}
            jobs={jobs}
            updateStats={() => {}}
            onSent={handleSentRecord}
            onBack={() => setCurrentView(AppView.DASHBOARD)}
            bridgeStatus={hubOnline ? 'ONLINE' : 'OFFLINE'}
            onReconnect={() => {}}
            targetDailyCap={targetDailyCap}
          />
        );
      case AppView.OUTREACH:
        return (
          <HiddenHunter 
            profile={currentProfile}
            onLog={addLog}
            updateStats={() => {}}
            onSent={handleSentRecord}
            companies={[]}
            setCompanies={() => {}}
            onBack={() => setCurrentView(AppView.DASHBOARD)}
            targetDailyCap={targetDailyCap}
            evasionStatus="STEALTH"
          />
        );
      case AppView.INCOME_B2B:
        return (
          <RevenueHubs 
            profile={currentProfile}
            onLog={addLog}
            updateStats={() => {}}
            onSent={handleSentRecord}
            onBack={() => setCurrentView(AppView.DASHBOARD)}
          />
        );
      case AppView.INCOME_GIGS:
        return (
          <GigFlash 
            profile={currentProfile}
            onLog={addLog}
            onSent={handleSentRecord}
            onBack={() => setCurrentView(AppView.DASHBOARD)}
            autoGigs={autoGigs}
            setAutoGigs={setAutoGigs}
            isAutopilot={isAutopilotActive}
          />
        );
      case AppView.MARKET_NEXUS:
        return (
          <MarketNexus 
            profile={currentProfile}
            onLog={addLog}
            onSent={handleSentRecord}
            updateStats={() => {}}
            onBack={() => setCurrentView(AppView.DASHBOARD)}
          />
        );
      case AppView.PROFILE:
        return (
          <IdentityVault 
            profiles={profiles}
            setProfiles={() => {}}
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
            onLog={addLog}
            onTrack={() => {}}
            sentRecords={sentRecords}
            setSentRecords={() => {}}
            analytics={analytics}
            setAnalytics={() => {}}
          />
        );
      case AppView.VAULT_SYNC:
        return (
          <SystemDeploy 
            onLog={addLog}
            bridgeStatus={hubOnline ? 'ONLINE' : 'OFFLINE'}
            onReconnect={() => {}}
          />
        );
      default:
        return <Dashboard profile={currentProfile} profiles={profiles} activeIndex={activeIndex} onSwitchProfile={setActiveIndex} jobs={jobs} sentRecords={sentRecords} onNavigate={handleNavigate} analytics={analytics} logs={logs} isAutopilot={isAutopilotActive} onToggleAutopilot={() => setIsAutopilotActive(!isAutopilotActive)} missions={[]} queueStatus={queueStatus} targetDailyCap={targetDailyCap} setTargetDailyCap={setTargetDailyCap} evasionStatus="STEALTH" hubOnline={hubOnline} />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-titan-bg font-sans text-slate-200 overflow-hidden relative">
      <Sidebar 
        activeView={currentView} 
        onNavigate={handleNavigate} 
        bridgeStatus={hubOnline ? 'ONLINE' : 'OFFLINE'} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header 
          activeView={currentView} 
          activePersona={currentProfile.fullName}
          personaDomain={currentProfile.domain}
          personaTheme={currentProfile.themeColor}
          voiceEnabled={voiceEnabled}
          onToggleVoice={handleToggleVoice}
          onSearch={handleSearch}
          onOpenConsole={() => setConsoleOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          {renderView()}
        </main>
        
        <MobileNav activeView={currentView} onNavigate={handleNavigate} />
      </div>

      <Console 
        isOpen={consoleOpen} 
        onClose={() => setConsoleOpen(false)} 
        profile={currentProfile} 
        onLog={addLog}
        autopilot={isAutopilotActive}
        setAutopilot={setIsAutopilotActive}
        dailyCap={targetDailyCap}
        setDailyCap={setTargetDailyCap}
        setView={setCurrentView}
        evasionStatus="STEALTH"
      />

      <NeuralLink isActive={voiceEnabled} onClose={() => setVoiceEnabled(false)} />
      
      <GlobalSearchModal 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)} 
        query={searchQuery}
        jobs={jobs}
        sentRecords={sentRecords}
        profiles={profiles}
        onNavigate={handleNavigate}
      />
    </div>
  );
};

export default App;