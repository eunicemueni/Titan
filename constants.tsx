
import React from 'react';

export const SYSTEM_NAME = "TITAN COMMAND AI";
export const VERSION = "6.4.2-STABLE";

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
    price: 4500,
    description: 'Autonomous AI Executive Proxy. Custom-trained on leadership logic to represent the brand in 24/7 stakeholder management and decision-making.',
    icon: '🧬',
    isFutureAsset: true,
    salesHook: "Strategic audit suggests an 'Executive Bandwidth' gap. I have modeled a conceptual Neural Twin to handle high-level logic. Implementation: $4,500."
  },
  {
    id: 'risk_nexus',
    name: 'Stochastic Risk Nexus',
    price: 1850,
    description: 'Bespoke actuarial and financial modeling framework using FIS Prophet logic to identify and mitigate long-term liability friction.',
    icon: '📈',
    salesHook: "Identified KES 50M+ in potential liability exposure. My Risk Nexus framework provides a 10-year stochastic mitigation map. Engagement: $1,850."
  },
  {
    id: 'knowledge_brain',
    name: 'Neural Knowledge Brain',
    price: 1250,
    description: 'Conversion of fragmented internal corporate data into a centralized, queryable Neural Nexus for 15% efficiency gains across staff nodes.',
    icon: '🧠',
    salesHook: "Internal data fragmentation is leaking 12% of staff productivity. The Neural Brain consolidates all intelligence. Setup: $1,250."
  },
  {
    id: 'strategic_audit',
    name: 'Operations Deficit Audit',
    price: 399,
    description: 'Deep-dive analytical audit of corporate operational friction. Mapping the path to $50k+ in annual operational savings.',
    icon: '📊',
    salesHook: "I have identified three critical friction nodes in your current workflow. Detailed Ops Audit: $399."
  }
];
