/**
 * Branch Intelligence — per-branch cash and health rollup.
 *
 * Ported from the Next.js route handler `app/api/branches/financial-summary`.
 * This module intentionally serves a fixed branch register: the upstream
 * aggregation (Company Profile + Treasury + Cash Flow) is not part of either
 * team's scope yet, and the original implementation documented it as such.
 */

export interface BranchSummary {
  branchId: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  cashPosition: number;
  monthlyExpenses: number;
  monthlyRevenue: number;
  alertCount: number;
  status: 'healthy' | 'warning' | 'critical';
}

const BRANCHES: BranchSummary[] = [
  {
    branchId: 'br-mum-001', name: 'Mumbai HQ', city: 'Mumbai', lat: 19.076, lng: 72.8777,
    cashPosition: 12500000, monthlyExpenses: 3200000, monthlyRevenue: 5800000,
    alertCount: 0, status: 'healthy',
  },
  {
    branchId: 'br-del-002', name: 'Delhi NCR Branch', city: 'Delhi', lat: 28.6139, lng: 77.209,
    cashPosition: 8200000, monthlyExpenses: 2800000, monthlyRevenue: 4100000,
    alertCount: 1, status: 'warning',
  },
  {
    branchId: 'br-blr-003', name: 'Bangalore Tech Hub', city: 'Bangalore', lat: 12.9716, lng: 77.5946,
    cashPosition: 15800000, monthlyExpenses: 4100000, monthlyRevenue: 7200000,
    alertCount: 0, status: 'healthy',
  },
  {
    branchId: 'br-chn-004', name: 'Chennai South Branch', city: 'Chennai', lat: 13.0827, lng: 80.2707,
    cashPosition: 2100000, monthlyExpenses: 2600000, monthlyRevenue: 2200000,
    alertCount: 3, status: 'critical',
  },
  {
    branchId: 'br-hyd-005', name: 'Hyderabad HITEC', city: 'Hyderabad', lat: 17.385, lng: 78.4867,
    cashPosition: 9400000, monthlyExpenses: 2400000, monthlyRevenue: 4800000,
    alertCount: 0, status: 'healthy',
  },
  {
    branchId: 'br-pun-006', name: 'Pune IT Park', city: 'Pune', lat: 18.5204, lng: 73.8567,
    cashPosition: 5600000, monthlyExpenses: 2900000, monthlyRevenue: 3100000,
    alertCount: 2, status: 'warning',
  },
];

export function getBranchFinancialSummary(): BranchSummary[] {
  return BRANCHES;
}
