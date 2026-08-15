import { AIRequestPurpose } from '../types';

export interface AIResponseProfile {
  purpose: AIRequestPurpose;
  name: string;
  tone: 'Conversational & Encouraging' | 'Structured & Analytical' | 'Direct & Diagnostic' | 'Executive & Concise';
  maxLengthChars: number;
  showSources: boolean;
  showDiagnostics: boolean;
  sections?: string[];
  defaultFollowUps: string[];
}

export const RESPONSE_PROFILES: Record<AIRequestPurpose, AIResponseProfile> = {
  chat: {
    purpose: 'chat',
    name: 'Conversational Wealth Advisor Profile',
    tone: 'Conversational & Encouraging',
    maxLengthChars: 1800,
    showSources: false,
    showDiagnostics: true,
    defaultFollowUps: [
      'How does this methodology apply to my net worth?',
      'How is my Wealth Health Score calculated?',
      'What should I prioritize next in my plan?'
    ]
  },
  'goal-analysis': {
    purpose: 'goal-analysis',
    name: 'Financial Goal Solver Profile',
    tone: 'Structured & Analytical',
    maxLengthChars: 1500,
    showSources: false,
    showDiagnostics: false,
    sections: ['Net Worth & Goal Position Summary', 'Edelman Solver Options', 'Recommended Action Step'],
    defaultFollowUps: [
      'How does improving this goal boost my Wealth Health Score?',
      'What is my recommended monthly contribution?'
    ]
  },
  'priority-analysis': {
    purpose: 'priority-analysis',
    name: 'Priority Action Diagnostic Profile',
    tone: 'Direct & Diagnostic',
    maxLengthChars: 1200,
    showSources: false,
    showDiagnostics: false,
    sections: ['Why This Action Was Triggered', 'Financial Impact', 'Recommended Action Steps', 'Expected Improvement'],
    defaultFollowUps: [
      'What is the interest savings with Debt Avalanche?',
      'How quickly will this clear my rule violation?'
    ]
  },
  'portfolio-analysis': {
    purpose: 'portfolio-analysis',
    name: 'Portfolio Strategy Profile',
    tone: 'Structured & Analytical',
    maxLengthChars: 1400,
    showSources: false,
    showDiagnostics: false,
    sections: ['Asset Allocation Status', 'Drift Analysis', 'Rebalancing Recommendations'],
    defaultFollowUps: [
      'How often should portfolio drift be checked?',
      'What is the difference between active and index funds?'
    ]
  },
  'retirement-analysis': {
    purpose: 'retirement-analysis',
    name: 'Retirement Longevity Profile',
    tone: 'Executive & Concise',
    maxLengthChars: 1600,
    showSources: false,
    showDiagnostics: false,
    sections: ['Retirement Readiness Position', 'Withdrawal Sequencing', 'Longevity Protection'],
    defaultFollowUps: [
      'What is tax-efficient withdrawal sequencing?',
      'How do I protect against longevity inflation risk?'
    ]
  },
  'dashboard-insight': {
    purpose: 'dashboard-insight',
    name: 'Executive Dashboard Diagnostic Profile',
    tone: 'Executive & Concise',
    maxLengthChars: 1200,
    showSources: false,
    showDiagnostics: false,
    sections: ['Overall WHS Diagnostic', 'Top Priority Steps'],
    defaultFollowUps: [
      'How can I improve my lowest scoring pillar?'
    ]
  }
};
