
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
import { geminiService } from './services/geminiService';
import { supabaseService } from './services/supabaseService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [activeIndex, setActiveIndex] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({ waiting: 0, active: 0, completed: 0, failed: 0 });
  const [targetDailyCap, setTargetDailyCap] = useState(1000);
  const [evasionStatus, setEvasionStatus] = useState<'STABLE' | 'ROTATING' | 'STEALTH'>('STABLE');

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
    },
    {
      fullName: 'Ayana Inniss',
      email: 'ayanainniss100@gmail.com',
      domain: 'USA Data Ops',
      themeColor: 'cyan',
      portfolioUrl: 'https://ayanaportf-6fvwehha.manus.space/',
      linkedinUrl: 'https://www.linkedin.com/in/ayana-inniss-5b01332b0',
      dossierLink: 'https://ayanaportf-6fvwehha.manus.space/resume_ayana_inniss.pdf',
      masterCV: `Ayana Inniss...`,
      expertiseBlocks: { 'DATA_ANALYST': 'USA Remote-Only Architect...' },
      preferences: { minSalary: '$140,000', targetRoles: ['Senior Data Analyst'], remoteOnly: true },
      stats: { coldEmailsSent: 284, leadsGenerated: 92, salesClosed: 24, totalRevenue: 85000 }
    }
  ]);

  const activeProfile = profiles[activeIndex] || profiles[0];

  const addLog = useCallback((message: string, level: TelemetryLog['level'] = 'info') => {
    const newLog: TelemetryLog = { id: `log-${Date.now()}-${Math.random()}`, message, level, timestamp: Date.now() };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  }, []);

  const handleSentRecord = (record: any) => {
    const newRecord: SentRecord = { 
      ...record, 
      id: `sent-${Date.now()}`, 
      timestamp: Date.now(), 
      status: 'DISPATCHED',
      // Ensure the text content is captured for the ledger view
      payload: record.body || record.pitch || record.emailBody || "" 
    };
    setSentRecords(prev => [newRecord, ...prev]);
    addLog(`TRANSFERRED: ${record.type} relay to ${record.recipient}`, 'success');
  };

  const handleUpdateStats = (updates: Partial<UserProfile['stats']>) => {
    setProfiles(prev => {
      const next = [...prev];
      next[activeIndex] = { ...next[activeIndex], ...updates };
      return next;
    });
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const cloudJobs = await supabaseService.loadJobs();
        const cloudSent = await supabaseService.loadSentRecords();
        if (cloudJobs) setJobs(cloudJobs);
        if (cloudSent) setSentRecords(cloudSent);
      } catch (e) { addLog("LOCAL_SYNC: Active.", "info"); }
    };
    loadData();
  }, [addLog]);

  // AUTOPILOT ENGINE: Handles both Job Discovery and Gig Pulsing
  useEffect(() => {
    if (!isAutopilotActive) return;
    
    // Mission 1: Main Job Scanning
    const executeJobScan = async () => {
      const isUSA = activeProfile.fullName.includes('Ayana');
      const loc = isUSA ? 'USA 100% Remote-Only' : 'Worldwide Remote Distributed';
      addLog(`AUTOPILOT: Universal Scan engaged for ${loc}...`, 'info');
      try {
        const discovered = await geminiService.performUniversalScrape("Senior Roles", loc);
        const mapped: JobRecord[] = (discovered || []).map((d: any, i: number) => ({
          ...d,
          id: `rem-${Date.now()}-${i}`,
          status: 'discovered',
          timestamp: Date.now(),
          matchScore: 92 + Math.floor(Math.random() * 8)
        }));
        setJobs(prev => [...mapped, ...prev].slice(0, 200));
      } catch (e) { addLog("Scan Node bypassed.", "warning"); }
    };

    // Mission 2: Flash Gig Pulsing (The "Auto" part of Flash Jobs)
    const executeGigPulse = async () => {
      addLog("AUTOPILOT: Background Gig Pulse initiating...", 'info');
      try {
        const discoveredGigs = await geminiService.scoutFlashGigs(activeProfile);
        if (Array.isArray(discoveredGigs)) {
          setFlashGigs(prev => {
            const combined = [...discoveredGigs, ...prev];
            // Unique by title/platform
            return Array.from(new Map(combined.map(item => [item.title + item.platform, item])).values()).slice(0, 50);
          });
          addLog(`AUTOPILOT: Captured ${discoveredGigs.length} new Flash Gigs.`, 'success');
        }
      } catch (e) { console.error("Gig Autopulse Fail", e); }
    };

    executeJobScan();
    executeGigPulse();

    const jobInterval = setInterval(executeJobScan, 45000);
    const gigInterval = setInterval(executeGigPulse, 60000);
    
    return () => {
      clearInterval(jobInterval);
      clearInterval(gigInterval);
    };
  }, [isAutopilotActive, activeProfile, addLog]);

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
        return <Dashboard {...commonProps} profiles={profiles} activeIndex={activeIndex} onSwitchProfile={setActiveIndex} jobs={jobs} sentRecords={sentRecords} analytics={analytics} logs={logs} isAutopilot={isAutopilotActive} onToggleAutopilot={() => setIsAutopilotActive(!isAutopilotActive)} missions={missions} queueStatus={queueStatus} setTargetDailyCap={setTargetDailyCap} onNavigate={setCurrentView} />;
      case AppView.MISSION_CONTROL:
        return <MissionControl {...commonProps} jobs={jobs} sentRecords={sentRecords} setJobs={setJobs} isAutopilot={isAutopilotActive} onToggleAutopilot={() => setIsAutopilotActive(!isAutopilotActive)} missions={missions} queueStatus={queueStatus} />;
      case AppView.JOB_SCANNER: 
        return <ScraperNode {...commonProps} setJobs={setJobs} jobs={jobs} updateStats={handleUpdateStats} bridgeStatus="ONLINE" onReconnect={() => {}} />;
      case AppView.OUTREACH: 
        return <HiddenHunter {...commonProps} updateStats={handleUpdateStats} companies={companies} setCompanies={setCompanies} />;
      case AppView.MARKET_NEXUS:
        return <MarketNexus {...commonProps} updateStats={handleUpdateStats} />;
      case AppView.INCOME_B2B:
        return <RevenueHubs {...commonProps} updateStats={handleUpdateStats} />;
      case AppView.INCOME_GIGS:
        return <GigFlash {...commonProps} autoGigs={flashGigs} setAutoGigs={setFlashGigs} isAutopilot={isAutopilotActive} />;
      case AppView.PROFILE: 
        return <Profile profiles={profiles} setProfiles={setProfiles} activeIndex={activeIndex} setActiveIndex={setActiveIndex} onLog={addLog} onTrack={() => {}} sentRecords={sentRecords} setSentRecords={setSentRecords} analytics={analytics} setAnalytics={setAnalytics} />;
      case AppView.VAULT_SYNC: 
        return <SystemDeploy onLog={addLog} bridgeStatus="ONLINE" onReconnect={() => {}} />;
      default: 
        return <Dashboard {...commonProps} profiles={profiles} activeIndex={activeIndex} onSwitchProfile={setActiveIndex} jobs={jobs} sentRecords={sentRecords} analytics={analytics} logs={logs} isAutopilot={isAutopilotActive} onToggleAutopilot={() => setIsAutopilotActive(!isAutopilotActive)} missions={missions} queueStatus={queueStatus} setTargetDailyCap={setTargetDailyCap} onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="h-screen w-screen bg-[#02040a] text-slate-300 font-sans overflow-hidden flex selection:bg-indigo-500/30">
      <Sidebar activeView={currentView} onNavigate={setCurrentView} bridgeStatus="ONLINE" />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header activeView={currentView} activePersona={activeProfile.fullName} personaDomain={activeProfile.domain} personaTheme={activeProfile.themeColor} voiceEnabled={voiceEnabled} onToggleVoice={() => setVoiceEnabled(!voiceEnabled)} onSearch={() => {}} />
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-titan-bg">
          <div className="w-full min-h-full">{renderView()}</div>
        </main>
        <div className="h-8 bg-black/80 backdrop-blur-md border-t border-white/5 flex items-center px-6 justify-between text-[8px] font-black uppercase tracking-widest z-[100]">
          <div className="flex items-center gap-4">
            <span className="text-indigo-500">TITAN_OS_v7.0</span>
            <span className="text-slate-600">PERSONA: {activeProfile.fullName.toUpperCase()}</span>
          </div>
          <div className="text-slate-600 flex gap-4 font-mono text-[7px]">
             <span className="text-amber-500 font-black">CAPACITY: {targetDailyCap}/DAY</span>
             <span className="text-cyan-500 font-black">EVASION: {evasionStatus}</span>
             <span>SYNC: TITAN_CLOUD_RELAY</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
