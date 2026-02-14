
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  MISSION_CONTROL = 'MISSION_CONTROL',
  JOB_SCANNER = 'JOB_SCANNER',
  OUTREACH = 'OUTREACH',
  MARKET_NEXUS = 'MARKET_NEXUS',
  INCOME_B2B = 'INCOME_B2B',
  INCOME_GIGS = 'INCOME_GIGS',
  CLIENT_NEXUS = 'CLIENT_NEXUS',
  PROFILE = 'PROFILE',
  VAULT_SYNC = 'VAULT_SYNC'
}

export type PipelineStatus = 'DISPATCHED' | 'REPLY_RECEIVED' | 'INTERVIEW_SET' | 'OFFER_EXTENDED' | 'REJECTED' | 'ARCHIVED' | 'QUEUED';

export interface QueueStatus {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

export type IndustryType = 'DATA_ANALYST' | 'ACTUARIAL' | 'FINANCE' | 'SALES' | 'AI_TRAINING' | 'FREELANCE' | 'GENERAL' | 'INSURANCE' | 'PROJECT_MGMT' | 'OPERATIONS' | 'UNIVERSAL';

export interface AppAnalytics {
  agentDetections: number;
  customCVsGenerated: number;
  totalIncome: number;
  lastPulse: number;
  activeLeads: number;
}

export interface UserProfile {
  fullName: string;
  email: string;
  domain: string;
  themeColor: string;
  portfolioUrl: string;
  linkedinUrl: string;
  dossierLink?: string;
  masterCV: string;
  expertiseBlocks: { [key in IndustryType]?: string };
  preferences: {
    minSalary: string;
    targetRoles: string[];
    remoteOnly: boolean;
  };
  stats: {
    coldEmailsSent: number;
    leadsGenerated: number;
    salesClosed: number;
    totalRevenue: number;
  };
}

export interface Mission {
  id: IndustryType;
  status: 'IDLE' | 'SCANNING' | 'SCRAPING_EMAILS' | 'DISPATCHING' | 'COMPLETED';
  lastRun: number;
  totalFound: number;
  currentTask?: string;
}

export interface JobRecord {
  id: string;
  company: string;
  role: string;
  location: string;
  salary?: string;
  contactEmail?: string;
  description?: string;
  status: 'discovered' | 'tailoring' | 'applying' | 'completed' | 'skipped' | 'queued';
  matchScore: number;
  timestamp: number;
  isQualified?: boolean;
  sourceUrl?: string;
  industry?: IndustryType;
  tailoredPackage?: {
    cv: string;
    coverLetter: string;
    emailBody: string;
    subject: string;
  };
  // Fix: Added metadata field to support grounding source storage
  metadata?: {
    sources?: { title: string; uri: string }[];
    [key: string]: any;
  };
}

export interface TargetedCompany {
  id: string;
  name: string;
  website: string;
  location: string;
  email: string;
  hiringManager?: string;
  hiringContext?: string;
  status: string;
  isQualified?: boolean;
  opportunityScore?: number;
  metrics?: {
    size?: string;
    funding?: string;
    relevance?: number;
  };
  customCv?: string;
  customPortfolio?: string;
  tailoredPackage?: {
    cv: string;
    coverLetter: string;
    emailBody: string;
    subject: string;
  };
}

export interface ClientLead {
  id: string;
  companyName: string;
  website: string;
  description: string;
  type: 'PUBLICATION' | 'AGENCY' | 'OTHER';
  opportunityScore: number;
  email?: string;
  status: string;
}

export interface SentRecord {
  id: string;
  type: 'JOB_APPLICATION' | 'B2B_PITCH' | 'GIG_BID' | 'COL_OUTREACH' | 'SERVICE_OFFER' | 'FLASH_BID' | 'CLIENT_PITCH' | 'MISSION_RELAY';
  recipient: string;
  subject: string;
  timestamp: number;
  status: PipelineStatus;
  industry?: IndustryType;
  payload?: string; // New field for viewing content in ledger
}

export interface TelemetryLog {
  id: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}