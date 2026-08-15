# WEALTH HEALTH SCORE (WHS) FRAMEWORK
## System Scoring Algorithm & Framework Design
**Version:** 1.0  
**Status:** Approved  
**Author:** Principal Wealth Architect  
**Date:** June 2026  

---

## 1. Overview
The **Wealth Health Score (WHS)** is a proprietary, quantitative score (ranging from 0 to 100) that measures a client's overall financial wellness and alignment with the Ric Edelman planning methodology. 

Unlike generic credit scores that measure *debt repayment capacity*, the WHS measures *wealth stability, goal alignment, and protection margins*. It is computed daily using the client’s aggregated assets, liabilities, goals, insurance policies, and estate documents.

---

## 2. Category Scoring Models & Weights

The WHS is the weighted sum of 7 distinct sub-scores:

| Category | Weight | Description | Core Reference Principle |
|----------|--------|-------------|--------------------------|
| **1. Emergency Fund Adequacy** | 15% | Cash reserves vs. monthly expenses | Chapter 3: Protecting Your Foundation |
| **2. Debt Management** | 15% | High-interest consumer debt burden | Chapter 12: Debt Management |
| **3. Savings Rate & Goal Funding** | 15% | Actual vs. required goal monthly savings | Chapter 3: Use Income to Eliminate Shortfalls |
| **4. Portfolio Allocation Drift** | 15% | Drift from model asset allocation | Part II: Asset Allocation & Diversification |
| **5. Retirement Readiness** | 15% | Projected retirement funding ratio | Chapter 3 & Part V: Retirement Modeling |
| **6. Insurance Gap Protection** | 15% | Life, disability, and LTC coverage | Chapter 3: The Omission That Could Ruin You |
| **7. Estate Planning Foundation** | 10% | Core estate documents and beneficiary alignment | Chapter 6: Estate & Inheritance Planning |
| **Total** | **100%** | | |

---

## 3. Mathematical Specifications & Calculations

### 3.1 Emergency Fund Adequacy ($S_{\text{em}}$) - Max 100 points
Calculates the number of months of living expenses covered by liquid assets (cash, money market funds, short-term treasury bills).
- Let $A_{\text{liquid}}$ be the total value of liquid assets.
- Let $E_{\text{monthly}}$ be the total monthly cash expenses.
- Let $M_{\text{target}}$ be the target months of coverage (3 months for secure dual-income, 6 months for single-income or high volatility careers).

$$\text{Coverage Ratio } (CR) = \frac{A_{\text{liquid}}}{E_{\text{monthly}} \times M_{\text{target}}}$$

$$S_{\text{em}} = \min(100, CR \times 100)$$

---

### 3.2 Debt Management ($S_{\text{debt}}$) - Max 100 points
Measures the burden of high-interest consumer debt (credit cards, personal loans, high-interest auto loans > 8% APR). Mortgage debt and low-interest student loans are excluded.
- Let $D_{\text{consumer}}$ be the total monthly debt service payments on high-interest debt.
- Let $I_{\text{net}}$ be the client's monthly net income.

$$\text{Debt-to-Income Ratio } (DTI) = \frac{D_{\text{consumer}}}{I_{\text{net}}}$$

$$S_{\text{debt}} = \begin{cases} 
100 & \text{if } DTI = 0 \\
\max(0, 100 - (DTI \times 400)) & \text{if } DTI > 0 
\end{cases}$$
*(A DTI of 25% or greater yields a score of 0).*

---

### 3.3 Savings Rate & Goal Funding ($S_{\text{save}}$) - Max 100 points
Measures how close the client is to meeting their required savings goals.
- Let $SR_{\text{actual}}$ be the total monthly savings rate (monthly savings / net income).
- Let $SR_{\text{required}}$ be the sum of required monthly savings to fund all goals on their current timelines.

$$S_{\text{save}} = \begin{cases} 
100 & \text{if } SR_{\text{required}} = 0 \text{ or } SR_{\text{actual}} \ge SR_{\text{required}} \\
\max(0, \frac{SR_{\text{actual}}}{SR_{\text{required}}} \times 100) & \text{if } SR_{\text{actual}} < SR_{\text{required}}
\end{cases}$$

---

### 3.4 Portfolio Allocation Drift ($S_{\text{drift}}$) - Max 100 points
Evaluates how closely the actual portfolio allocation matches the target model portfolio allocation.
- Let $w_{i, \text{actual}}$ be the actual allocation % of asset class $i$.
- Let $w_{i, \text{target}}$ be the target allocation % of asset class $i$.
- Let $D_{\text{total}}$ be the sum of absolute drifts across all 12 asset classes:

$$D_{\text{total}} = \sum_{i=1}^{12} |w_{i, \text{actual}} - w_{i, \text{target}}|$$

$$S_{\text{drift}} = \max(0, 100 - (D_{\text{total}} \times 2))$$
*(An aggregate drift of 50% across classes yields a score of 0).*

---

### 3.5 Retirement Readiness ($S_{\text{ret}}$) - Max 100 points
Calculates the retirement funding ratio.
- Let $FV_{\text{ret\_assets}}$ be the future value of assets designated for retirement.
- Let $FV_{\text{ret\_cost}}$ be the future value cost of the retirement goal.

$$\text{Readiness Ratio } (RR) = \frac{FV_{\text{ret\_assets}}}{FV_{\text{ret\_cost}}}$$

$$S_{\text{ret}} = \min(100, RR \times 100)$$

---

### 3.6 Insurance Gap Protection ($S_{\text{ins}}$) - Max 100 points
Scores life, disability, and long-term care insurance coverage gaps.
- Let $G_{\text{life}}$ be the gap between required life insurance coverage (10x income plus liabilities) and actual coverage.
- Let $G_{\text{dis}}$ be the gap in disability insurance (target is 60% of net income).
- Let $C_{\text{ltc}}$ be a boolean indicating Long-Term Care insurance (required if client age $\ge 50$ years).

$$\text{Life Score } (S_{\text{life}}) = \max\left(0, 100 - \left(\frac{G_{\text{life}}}{\text{Required Life}} \times 100\right)\right)$$

$$\text{Disability Score } (S_{\text{dis}}) = \max\left(0, 100 - \left(\frac{G_{\text{dis}}}{\text{Required Disability}} \times 100\right)\right)$$

$$\text{LTC Score } (S_{\text{ltc}}) = \begin{cases} 
100 & \text{if Age } < 50 \text{ or } (C_{\text{ltc}} = \text{true}) \\
0 & \text{if Age } \ge 50 \text{ and } (C_{\text{ltc}} = \text{false})
\end{cases}$$

$$S_{\text{ins}} = (0.4 \times S_{\text{life}}) + (0.4 \times S_{\text{dis}}) + (0.2 \times S_{\text{ltc}})$$

---

### 3.7 Estate Planning Foundation ($S_{\text{estate}}$) - Max 100 points
Calculates completeness of the legal protection foundation.
- Will Drafted & Executed ($W$): 30 pts
- Durable Power of Attorney ($POA$): 20 pts
- Healthcare Proxy / Living Will ($HC$): 20 pts
- Designated Beneficiaries Mapped without alerts ($B$): 30 pts

$$S_{\text{estate}} = W + POA + HC + B$$

---

## 4. Overall Scoring Algorithm
The aggregate **Wealth Health Score (WHS)** is calculated as:

$$\text{WHS} = 0.15 S_{\text{em}} + 0.15 S_{\text{debt}} + 0.15 S_{\text{save}} + 0.15 S_{\text{drift}} + 0.15 S_{\text{ret}} + 0.15 S_{\text{ins}} + 0.10 S_{\text{estate}}$$

### 4.1 Score Thresholds & Status Categorization
The final WHS maps to four distinct ranges:

```
Score:  0 ------------------ 50 ------------------ 70 ------------------ 90 ------------------ 100
Grade:       VULNERABLE             CAUTION             HEALTHY               EXCELLENT
Color:          Red                 Yellow               Blue                   Green
```

- **90 to 100: Excellent (Green)** - The client has fully funded cash reserves, zero high-interest debt, minimal asset class drift, adequate life/disability/LTC protection, and complete estate documentation.
- **70 to 89: Healthy (Blue)** - Good financial foundation. Minor rebalancing drift or savings gaps exist, but major protections are in place.
- **50 to 69: Caution (Yellow)** - Moderate financial vulnerabilities. Significant savings rate shortfall, un-allocated assets, or missing key estate/insurance protections.
- **0 to 49: Vulnerable (Red)** - Critical risk. Depleted emergency funds, high-interest consumer debt drag, major goal funding shortfalls, or complete lack of insurance/estate protections.

---

## 5. Database Schema Storage

```sql
-- Wealth Health Score Current Snapshot
CREATE TABLE wealth_health_score_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  score_emergency_fund INTEGER NOT NULL CHECK (score_emergency_fund BETWEEN 0 AND 100),
  score_debt_mgmt INTEGER NOT NULL CHECK (score_debt_mgmt BETWEEN 0 AND 100),
  score_savings_rate INTEGER NOT NULL CHECK (score_savings_rate BETWEEN 0 AND 100),
  score_portfolio_drift INTEGER NOT NULL CHECK (score_portfolio_drift BETWEEN 0 AND 100),
  score_retirement_readiness INTEGER NOT NULL CHECK (score_retirement_readiness BETWEEN 0 AND 100),
  score_insurance_protection INTEGER NOT NULL CHECK (score_insurance_protection BETWEEN 0 AND 100),
  score_estate_planning INTEGER NOT NULL CHECK (score_estate_planning BETWEEN 0 AND 100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Historical Log for Charting
CREATE TABLE wealth_health_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, snapshot_date)
);

CREATE INDEX idx_whs_history_user_date ON wealth_health_score_history(user_id, snapshot_date);
```

---

## 6. API Integration

### `GET /api/v1/users/{user_id}/wealth-health-score`
Retrieves the latest score snapshot.

#### Response Example
```json
{
  "userId": "6b4d326f-4c28-4ad0-85f2-1ab08e2f89e2",
  "score": 78,
  "category": "HEALTHY",
  "updatedAt": "2026-06-24T04:30:00Z",
  "breakdown": {
    "emergencyFund": { "score": 100, "details": "6.2 months of expenses covered" },
    "debtManagement": { "score": 85, "details": "Consumer debt DTI is 3.75%" },
    "savingsRate": { "score": 60, "details": "Saving $100/mo of required $142/mo" },
    "portfolioDrift": { "score": 92, "details": "Total drift is 4.0%" },
    "retirementReadiness": { "score": 75, "details": "Funding ratio is 75%" },
    "insuranceProtection": { "score": 80, "details": "Missing Long-Term Care insurance (Age 52)" },
    "estatePlanning": { "score": 50, "details": "Missing Durable Power of Attorney" }
  }
}
```

---

## 7. Dashboard Integration Design

```
┌──────────────────────────────────────────────────────────┐
│  WEALTH HEALTH SCORE                   [Grade: Healthy]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│                 ┌───────────────────────┐                │
│                 │          78           │                │
│                 │     / 100 Points      │                │
│                 └───────────────────────┘                │
│                                                          │
│  Category Breakdowns:                                    │
│  ███████████████████ 100%  Emergency Fund Adequate       │
│  ████████████████░░░  85%  Debt Management               │
│  ██████████░░░░░░░░░  60%  Savings & Goals (Shortfall!)  │
│  ██████████████████░  92%  Portfolio Drift (Minimal)     │
│  ██████████████░░░░░  75%  Retirement Readiness          │
│  ████████████████░░░  80%  Insurance Protection          │
│  ██████████░░░░░░░░░  50%  Estate Foundation (Weak)      │
│                                                          │
│  Nudges to Improve Score:                                │
│  - [WHS-012] Save $42 more monthly to fund Turkey Trip.   │
│  - [WHS-034] Create your Durable Power of Attorney.      │
└──────────────────────────────────────────────────────────┘
```
