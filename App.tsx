
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppView, UserProfile, JobRecord, TelemetryLog, SentRecord, AppAnalytics } from './types';
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
import Sidebar from './modules/Sidebar';
import Header from './components/Header';
import Console from './components/Console';
import NeuralLink from './components/NeuralLink';
import MobileNav from './MobileNav';
import GlobalSearchModal from './components/GlobalSearchModal';
import { INITIAL_TELEMETRY } from './constants';
import { supabaseService } from './services/supabaseService';

const HARDCODED_PROFILES: UserProfile[] = [
  {
    fullName: "Eunice Muema",
    email: "eunicemueni1009@gmail.com",
    domain: "Senior Actuarial Analyst | Risk Management Professional",
    themeColor: "indigo",
    portfolioUrl: "https://8000-ixf0j88oieq1a5at5s206-dbf9d88d.us2.manus.computer",
    linkedinUrl: "linkedin.com/in/eunice-muema-a3614a378",
    masterCV: `EUNICE MUEMA
Actuarial Analyst | Risk Management Professional
eunicemueni1009@gmail.com | LinkedIn: linkedin.com/in/eunice-muema-a3614a378 | GitHub: github.com/eunicemueni

PROFESSIONAL SUMMARY
Dedicated Actuarial Analyst with Master's degree in Actuarial Science (University of Nairobi, 2020-2024) and Bachelor's degree (Kenyatta University, 2011-2015). Currently serving as Actuarial and Risk Analyst at Postal Corporation of Kenya with 7+ years of experience in actuarial valuations, pension scheme management, risk assessment, and data analytics.`,
    expertiseBlocks: { 
      "ACTUARIAL": "Expertise in actuarial valuations (Prophet, MoSes) and pension scheme management for 5000+ members. KES 50M identified in savings.",
      "INSURANCE": "Senior architecture for insurance modeling and liability assessment. Advanced Excel VBA and stochastic logic.",
      "DATA_ANALYST": "Data Management specialist (SQL, Python) managing 100k+ record datasets and automated ETL pipelines.",
      "FINANCE": "Financial reporting and regulatory compliance professional for large-scale corporate infrastructure."
    },
    preferences: { minSalary: "185k", targetRoles: ["Actuarial Director", "Chief Risk Officer", "Head of Quantitative Risk"], remoteOnly: true },
    stats: { coldEmailsSent: 156, leadsGenerated: 32, salesClosed: 8, totalRevenue: 98400 }
  },
  {
    fullName: "Ayana Inniss",
    email: "ayanainniss100@gmail.com",
    domain: "Data Analyst | AI/ML Expert | STEM Educator",
    themeColor: "cyan",
    portfolioUrl: "https://ayanaportf-6fvwehha.manus.space/",
    linkedinUrl: "linkedin.com/in/ayana-inniss-5b01332b0",
    masterCV: `AYANA INNISS
Strategic Data Analyst | AI/ML Integration Specialist | STEM Educator
ayanainniss100@gmail.com | LinkedIn: linkedin.com/in/ayana-inniss-5b01332b0`,
    expertiseBlocks: { 
      "DATA_ANALYST": "Strategic modeling for B2B expansion. Expert in identifying revenue logic deficits via SQL and Python clusters.", 
      "AI_TRAINING": "Leading integration of LLMs for corporate process automation and neural twin modeling.", 
      "OPERATIONS": "Architecture for remote-first organizational scaling and frictionless workflow audits.", 
      "GENERAL": "STEM Educator DNA focusing on bridging the gap between complex data and executive decision-making." 
    },
    preferences: { minSalary: "180k", targetRoles: ["Senior Data Analyst", "Director of Business Intelligence"], remoteOnly: true },
    stats: { coldEmailsSent: 482, leadsGenerated: 94, salesClosed: 22, totalRevenue: 145000 }
  }
];

const App: React.FC = () => {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [sentRecords, setSentRecords] = useState<SentRecord[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>(HARDCODED_PROFILES);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutopilotActive, setIsAutopilotActive] = useState(false);
  const [targetDailyCap, setTargetDailyCap] = useState(250);
  const [logs, setLogs] = useState<TelemetryLog[]>(INITIAL_TELEMETRY);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bridgeStatus, setBridgeStatus] = useState<'OFFLINE' | 'ONLINE'>('OFFLINE');

  const addLog = useCallback((message: string, level: TelemetryLog['level'] = 'info') => {
    const newLog: TelemetryLog = { id: `log-${Date.now()}`, message, level, timestamp: Date.now() };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  }, []);

  // Bridge Health Check Logic
  useEffect(() => {
    const checkBridge = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) setBridgeStatus('ONLINE');
        else setBridgeStatus('OFFLINE');
      } catch {
        setBridgeStatus('OFFLINE');
      }
    };
    checkBridge();
    const interval = setInterval(checkBridge, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const hydrate = async () => {
      addLog("UPLINK: Synchronizing Identity DNA...", "info");
      try {
        const [cloudJobs, cloudSent, cloudProfiles] = await Promise.all([
          supabaseService.loadJobs(),
          supabaseService.loadSentRecords(),
          supabaseService.loadProfiles()
        ]);

        if (cloudJobs) setJobs(cloudJobs);
        if (cloudSent) setSentRecords(cloudSent);
        if (cloudProfiles && cloudProfiles.length > 0) {
          setProfiles(cloudProfiles);
          addLog("IDENTITY: Global DNA synchronized.", "success");
        }
      } catch (err) {
        addLog("UPLINK: Sync Error. Using local cache.", "error");
      }
    };
    hydrate();
  }, [addLog]);

  const currentProfile = useMemo(() => profiles[activeIndex] || profiles[0], [profiles, activeIndex]);

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const handleSentRecord = useCallback((record: Omit<SentRecord, 'id' | 'timestamp' | 'status'>) => {
    const newRecord: SentRecord = { ...record, id: `sent-${Date.now()}`, timestamp: Date.now(), status: 'DISPATCHED' };
    setSentRecords(prev => {
      const next = [newRecord, ...prev];
      supabaseService.saveSentRecords(next);
      return next;
    });
  }, []);

  const updateStats = useCallback((updates: Partial<UserProfile['stats']>) => {
    setProfiles(prev => {
      const next = [...prev];
      if (next[activeIndex]) {
        next[activeIndex] = { ...next[activeIndex], stats: { ...next[activeIndex].stats, ...updates } };
      }
      supabaseService.saveProfiles(next);
      return next;
    });
  }, [activeIndex]);

  const renderView = () => {
    const basicProps = { 
      profile: currentProfile, 
      onLog: addLog, 
      onSent: handleSentRecord, 
      onBack: () => setCurrentView(AppView.DASHBOARD),
      bridgeStatus: bridgeStatus
    };
    switch (currentView) {
      case AppView.MISSION_CONTROL:
        return <MissionControl {...basicProps} jobs={jobs} setJobs={setJobs} isAutopilot={isAutopilotActive} onToggleAutopilot={() => setIsAutopilotActive(!isAutopilotActive)} sentRecords={sentRecords} queueStatus={{waiting: jobs.filter(j => j.status === 'queued').length, active: isAutopilotActive ? 1 : 0, completed: sentRecords.length, failed: 0}} targetDailyCap={targetDailyCap} evasionStatus="STEALTH_v7" missions={[]} />;
      case AppView.JOB_SCANNER:
        return <ScraperNode {...basicProps} setJobs={setJobs} jobs={jobs} updateStats={updateStats} onReconnect={() => {}} targetDailyCap={targetDailyCap} />;
      case AppView.OUTREACH:
        return <HiddenHunter {...basicProps} updateStats={updateStats} companies={[]} setCompanies={() => {}} evasionStatus="STEALTH" targetDailyCap={targetDailyCap} />;
      case AppView.INCOME_GIGS:
        return <GigFlash {...basicProps} autoGigs={[]} setAutoGigs={() => {}} isAutopilot={isAutopilotActive} />;
      case AppView.INCOME_B2B:
        return <RevenueHubs {...basicProps} updateStats={updateStats} />;
      case AppView.MARKET_NEXUS:
        return <MarketNexus {...basicProps} updateStats={updateStats} />;
      case AppView.CLIENT_NEXUS:
        return <ClientNexus {...basicProps} updateStats={updateStats} />;
      case AppView.PROFILE:
        return <IdentityVault profiles={profiles} setProfiles={setProfiles} activeIndex={activeIndex} setActiveIndex={setActiveIndex} onLog={addLog} onTrack={() => {}} sentRecords={sentRecords} setSentRecords={setSentRecords} analytics={{agentDetections: 0, customCVsGenerated: 0, totalIncome: 0, lastPulse: Date.now(), activeLeads: 0, conversionRate: 0, concurrencyNodeCount: 0}} setAnalytics={() => {}} />;
      case AppView.VAULT_SYNC:
        return <SystemDeploy onLog={addLog} bridgeStatus={bridgeStatus === 'ONLINE' ? 'ONLINE' : 'OFFLINE'} onReconnect={() => {}} />;
      default:
        return <Dashboard profile={currentProfile} profiles={profiles} activeIndex={activeIndex} onSwitchProfile={setActiveIndex} jobs={jobs} sentRecords={sentRecords} onNavigate={handleNavigate} analytics={{agentDetections: 0, customCVsGenerated: 0, totalIncome: 0, lastPulse: Date.now(), activeLeads: 0, conversionRate: 0, concurrencyNodeCount: 0}} logs={logs} isAutopilot={isAutopilotActive} onToggleAutopilot={() => setIsAutopilotActive(!isAutopilotActive)} queueStatus={{waiting: jobs.filter(j => j.status === 'queued').length, active: isAutopilotActive ? 1 : 0, completed: sentRecords.length, failed: 0}} targetDailyCap={targetDailyCap} setTargetDailyCap={setTargetDailyCap} evasionStatus="STEALTH" hubOnline={bridgeStatus === 'ONLINE'} />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-titan-bg font-sans text-slate-200 overflow-hidden relative">
      <Sidebar activeView={currentView} onNavigate={handleNavigate} bridgeStatus={bridgeStatus} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header activeView={currentView} activePersona={currentProfile.fullName} personaDomain={currentProfile.domain} personaTheme={currentProfile.themeColor} voiceEnabled={voiceEnabled} onToggleVoice={() => setVoiceEnabled(!voiceEnabled)} onSearch={(q) => { setSearchQuery(q); setSearchOpen(true); }} onOpenConsole={() => setConsoleOpen(true)} />
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">{renderView()}</main>
        <MobileNav activeView={currentView} onNavigate={handleNavigate} />
      </div>
      <Console isOpen={consoleOpen} onClose={() => setConsoleOpen(false)} profile={currentProfile} onLog={addLog} autopilot={isAutopilotActive} setAutopilot={setIsAutopilotActive} dailyCap={targetDailyCap} setDailyCap={setTargetDailyCap} setView={setCurrentView} evasionStatus="STEALTH" />
      <NeuralLink isActive={voiceEnabled} onClose={() => setVoiceEnabled(false)} />
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} query={searchQuery} jobs={jobs} sentRecords={sentRecords} profiles={profiles} onNavigate={handleNavigate} />
    </div>
  );
};

export default App;
