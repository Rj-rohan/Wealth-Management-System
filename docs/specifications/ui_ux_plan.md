# FRONTEND UI/UX PLAN
## Personal Wealth Management Client & Advisor Portals
**Version:** 1.0  
**Status:** Approved  
**Author:** Lead UI/UX & Frontend Architect  
**Date:** June 2026  

---

## 1. Screen Inventory

The module consists of 4 primary views deployed within the responsive React shell:

1. **Client Wealth Dashboard (W-DASH-001):** The core client page displaying the visual Wealth Health Score gauge, Net Worth trend lines (aggregated from linked/manual balances), a summary list of assets and liabilities, and the active Recommendation Action Hub.
2. **Goals Worksheet Screen (W-GOAL-002):** A sandbox interface where clients create, view, and adjust goals. If a goal has a shortfall, interactive sliders allow users to manipulate three variables: savings rate, goal cost, and target timeline.
3. **Advisor Household Workbench (W-ADV-003):** A workbench view for advisors to list clients, monitor client Wealth Health Scores, examine assets, and log compliance suitcase justifications for rebalancing recommendations.
4. **Account Linking Portal (W-LINK-004):** A user preferences page allowing users to configure custodian credentials via OAuth or manually add private assets (e.g., real estate, jewelry).

---

## 2. Navigation Flow & Component Hierarchy

### 2.1 Navigation Flow
```
                     ┌──────────────────┐
                     │   Login / MFA    │
                     └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │  Role Switcher   │
                     └────────┬─────────┘
              ┌───────┴─────────────────┴───────┐
              ▼ (Client Role)                   ▼ (Advisor Role)
   ┌────────────────────┐            ┌────────────────────┐
   │ Client Dashboard   │            │ Advisor Workbench  │
   └──────┬─────────────┘            └──────────┬─────────┘
          ├─► Goal Worksheet View               └─► Household Selector
          ├─► Account Linking Portal                  └─► Client Detail View
          └─► Recommendation Hub
```

### 2.2 React Component Hierarchy
```
App/
├── Shell/
│   ├── Navigation/
│   ├── Header/ (displays role selector & global ADV disclaimer)
│   └── Footer/
├── pages/
│   ├── Dashboard/
│   │   ├── ScoreGauge/
│   │   ├── NetWorthChart/
│   │   └── RecommendationHub/ (AlertCards)
│   ├── Goals/
│   │   ├── GoalSummaryTable/
│   │   └── GoalWorksheetModal/
│   │       ├── OptionsContainer/
│   │       └── SlidersGroup/ (Cost, Savings, Date inputs)
│   └── Advisor/
│       ├── HouseholdTable/
│       └── ComplianceModal/ (Suitability form)
```

---

## 3. UI Wireframe Mockups

### Screen 3.1: Client Dashboard Layout
```
┌────────────────────────────────────────────────────────────────────────┐
│ [Logo] WEALLTH  |  Client: Evelyn Vandermark [Role: Client]  [Disclaimer]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌───────────────────────┐   ┌──────────────────────────────────────┐  │
│  │ WEALTH HEALTH SCORE   │   │ NET WORTH TREND                      │  │
│  │   ┌───────────────┐   │   │                                      │  │
│  │   │      65       │   │   │  $120k |                             │  │
│  │   │  /100 CAUTION │   │   │   $80k |    .---'--.                 │  │
│  │   └───────────────┘   │   │   $40k |  .'        `                │  │
│  │                       │   │     $0 |__________________           │  │
│  │ [Breakdown details >] │   │        Jan   Mar   May   Jun [1Y|ALL]│  │
│  └───────────────────────┘   └──────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ RECOMMENDATION ACTION HUB                                        │  │
│  │ [CRITICAL] Credit card balance $3,500 at 22.99% APR.   [Fix Now] │  │
│  │ [HIGH] Turkey Trip goal has shortfall of $4,409.      [Solve]   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌───────────────────────────────┐   ┌──────────────────────────────┐  │
│  │ ASSETS SUMMARY                │   │ LIABILITIES SUMMARY          │  │
│  │ - Cash Checking:     $5,000   │   │ - Navient Student:  $25,000  │  │
│  │ - Employer 401(k):  $15,000   │   │ - CC Debt Chase:     $3,500  │  │
│  │                      [+ Add]  │   │                      [+ Add] │  │
│  └───────────────────────────────┘   └──────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Screen 3.2: Goals Worksheet Modal
```
┌────────────────────────────────────────────────────────────────────────┐
│ Goal Worksheet: Trip to Turkey                                         │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│ Present Cost: $10,000      Future Inflation Cost: $12,167              │
│ Target Date: Jun 30, 2031  Status: SHORTFALL ($4,409)                  │
│                                                                        │
│ To solve the shortfall, adjust variables within your control:          │
│                                                                        │
│ 1. REDUCE GOAL COST:                                                   │
│ [======================o------] Present value target: $7,758           │
│                                                                        │
│ 2. INCREASE MONTHLY SAVINGS:                                           │
│ [==========o------------------] Save $142 / month (+$42 increase)      │
│                                                                        │
│ 3. DELAY TARGET DATE:                                                  │
│ [==================o----------] Delay by 18 months (Target: Dec 2032)  │
│                                                                        │
│ ---------------------------------------------------------------------- │
│ [Save Adjustment Plan]                               [Cancel]          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. State Management Plan (Zustand)

Global frontend states are managed via a centralized Zustand store. This prevents prop-drilling and maintains consistent values across components:

```typescript
import { create } from 'zustand';

interface PWMState {
  userId: string | null;
  role: 'Client' | 'Advisor';
  wealthHealthScore: number;
  netWorthHistory: Array<{ date: string; net_worth: number }>;
  goals: Array<any>;
  recommendations: Array<any>;
  isLoading: boolean;
  
  fetchDashboardData: (userId: string) => Promise<void>;
  updateGoalPlan: (goalId: string, updates: { current_cost?: number; monthly_savings?: number; target_date?: string }) => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
}

export const usePWMStore = create<PWMState>((set, get) => ({
  userId: null,
  role: 'Client',
  wealthHealthScore: 0,
  netWorthHistory: [],
  goals: [],
  recommendations: [],
  isLoading: false,

  fetchDashboardData: async (userId) => {
    set({ isLoading: true });
    // Aggregated Fetch endpoints: /wealth-health-score, /net-worth, /goals, /recommendations
    const [whsRes, goalsRes, recsRes] = await Promise.all([
      fetch(`/api/v1/users/${userId}/wealth-health-score`),
      fetch(`/api/v1/users/${userId}/goals`),
      fetch(`/api/v1/users/${userId}/recommendations`),
    ]);
    set({
      userId,
      wealthHealthScore: (await whsRes.json()).score,
      goals: await goalsRes.json(),
      recommendations: await recsRes.json(),
      isLoading: false,
    });
  },

  updateGoalPlan: async (goalId, updates) => {
    const userId = get().userId;
    const response = await fetch(`/api/v1/users/${userId}/goals/${goalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const updatedGoal = await response.json();
    set({
      goals: get().goals.map((g) => (g.id === goalId ? updatedGoal : g)),
    });
  },

  dismissAlert: async (alertId) => {
    const userId = get().userId;
    await fetch(`/api/v1/users/${userId}/recommendations/${alertId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Dismissed' }),
    });
    set({
      recommendations: get().recommendations.filter((r) => r.id !== alertId),
    });
  },
}));
```

---

## 5. Form Validation Rules

1. **Goal Creation / Modification:**
   - `name`: Required, max 100 characters.
   - `current_cost`: Required, must be a decimal $\ge 0$.
   - `target_date`: Required, must be a valid date in the future (`target_date > current_date`).
   - `earmarked_assets`: Must be a decimal $\ge 0$ and cannot exceed total user asset balance.
   - `monthly_savings`: Must be a decimal $\ge 0$ and cannot exceed the user's monthly net income.
2. **Compliance Logs:**
   - `suitability_rationale`: Required when an advisor proposes rebalancing modifications; must contain at least 10 characters.
