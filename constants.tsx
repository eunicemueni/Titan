
import React from 'react';

export const SYSTEM_NAME = "TITAN COMMAND AI";
export const VERSION = "7.0.0-PRO";

export const COLORS = {
  primary: '#6366f1',
  secondary: '#10b981',
  danger: '#ef4444',
  bg: '#02040a',
  surface: '#0d1117',
  border: '#30363d'
};

export const INITIAL_TELEMETRY = [
  { id: '1', message: "Titan Command AI synchronized.", level: 'info', timestamp: Date.now() },
  { id: '2', message: "Multi-Persona Identity Vault loaded.", level: 'info', timestamp: Date.now() + 100 },
  { id: '3', message: "Cloud Node Status: Ready", level: 'success', timestamp: Date.now() + 200 }
];

export interface ServiceBlueprint {
  id: string;
  name: string;
  price: number;
  description: string;
  icon: string;
  isFutureAsset?: boolean;
  salesHook: string;
}

export const SERVICE_CATALOG: ServiceBlueprint[] = [
  {
    id: 'neural_twin',
    name: 'Enterprise Neural Twin',
    price: 1999,
    description: 'A 1:1 Digital Clone of company operational logic. Replicates leadership decision-making 24/7. This is our flagship elite proxy for total operational autonomy.',
    icon: '🧬',
    salesHook: "Strategic audit suggests an 'Executive Bandwidth' gap. I have modeled a conceptual Neural Twin of your operational logic to handle high-level logic. Implementation: $1,999 (Procurement Exempt)."
  },
  {
    id: 'risk_nexus',
    name: 'Stochastic Risk Nexus',
    price: 1450,
    description: 'Advanced actuarial and risk modeling framework. We clone your risk history into a 10-year mitigation map to eliminate liability friction.',
    icon: '📈',
    salesHook: "Identified significant liability exposure. My Risk Nexus framework provides a custom-cloned stochastic mitigation map. Engagement: $1,450."
  },
  {
    id: 'knowledge_brain',
    name: 'Neural Knowledge Brain',
    price: 850,
    description: 'High-tier data ingestion asset. We synthesize a centralized Neural Nexus that clones the collective intelligence of your staff into a queryable AI brain.',
    icon: '🧠',
    salesHook: "Internal data fragmentation is leaking staff productivity. The Neural Brain clones and consolidates all intelligence. Setup: $850."
  },
  {
    id: 'strategic_audit',
    name: 'Operations Deficit Audit',
    price: 99,
    description: 'The frictionless entry point. A deep-dive analytical trace identifying exact logic failures and mapping the path to $100k+ in annual savings.',
    icon: '📊',
    salesHook: "I have identified three critical friction nodes in your current workflow. Detailed Logic Audit: $99 (Instant Approval Tier)."
  }
];
