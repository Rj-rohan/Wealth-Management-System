# RECOMMENDATION ENGINE DESIGN
## Rule-Based Financial Advisor Service
**Version:** 1.0  
**Status:** Approved  
**Author:** Lead Systems Architect & Rule Engineer  
**Date:** June 2026  

---

## 1. Execution Architecture

The Recommendation Engine operates as a decoupled, event-driven rules evaluator. Rather than running computations synchronously inside REST request threads, the engine evaluates rule matrices:
1. **On Schedule:** Once daily during low-traffic hours (e.g., 2:00 AM UTC).
2. **On Event:** Instantly when specific events fire (e.g., `GOAL_CREATED`, `CUSTODIAN_ACCOUNT_LINKED`, or manual inputs).

```
┌─────────────────┐      ┌────────────────────────┐      ┌─────────────────────────┐
│ Event Trigger / │─────►│   Rules Evaluator      │─────►│ Recommendation Database │
│ Daily Scheduler │      │ (JSON Schema Matches)  │      │ (Alerts & Action Hub)   │
└─────────────────┘      └───────────┬────────────┘      └─────────────────────────┘
                                     │
                                     ▼
                        ┌────────────────────────┐
                        │ Context Data Providers │
                        │ (Assets, WHS, Gaps)    │
                        └────────────────────────┘
```

---

## 2. Rule Schema Definition (JSON DSL)

To maintain scalability without code changes, rules are defined in standard JSON structures parsed by a lightweight engine:

```json
{
  "rule_id": "REC-001-EMERGENCY-SHORTFALL",
  "category": "Emergency Fund",
  "priority": "High",
  "conditions": [
    {
      "fact": "liquid_cash_balance",
      "operator": "lessThan",
      "value": "required_emergency_fund_target"
    }
  ],
  "action": {
    "type": "CREATE_ALERT",
    "alert_message": "Your emergency fund of ${facts.liquid_cash_balance} covers less than your target of ${facts.required_emergency_fund_target} (${facts.emergency_fund_target_months} months of expenses). Redirect monthly savings to establish a safety net first.",
    "code_ref": "FORMULA_EM_FUND_SHORTFALL"
  }
}
```

---

## 3. Concrete Rules Catalog (Ric Edelman Methodology)

### Rule 3.1: Emergency Fund Adequacy (REC-EM)
- **Condition:** $\text{Liquid Cash Balance} < \text{Target Months} \times \text{Monthly Expenses}$
- **Logic:**
  - Let $M_{\text{target}}$ be 3 months for secure dual-income, 6 months for single-income or volatile commission-based careers.
  - Let $CR$ be the coverage gap in primary currency.
- **Generated Recommendation:** 
  - *Priority:* High.
  - *Message:* "Your safety net is underfunded by $CR. We recommend prioritizing your liquid cash reserves before funding other investment targets. Delay non-urgent goals or redirect your savings to achieve financial resilience."

---

### Rule 3.2: High-Interest Debt Drag (REC-DEBT)
- **Condition:** Outstanding liability where $\text{Interest Rate} > 8\% \text{ APR}$ and $\text{Category} \ne \text{Mortgage}$.
- **Logic:**
  - Locate all non-mortgage liabilities. Sort by Interest Rate descending.
- **Generated Recommendation:**
  - *Priority:* High.
  - *Message:* "You are holding debt on '${liability.name}' with an interest rate of ${liability.interest_rate} (${liability.interest_rate * 100}% APR). This exceeds our 8% advisory threshold. We recommend applying the **Debt Avalanche** strategy: pay off this balance immediately before contributing to discretionary goals."

---

### Rule 3.3: Goal Funding Shortfall Option Generator (REC-GOAL)
- **Condition:** Goal where $\text{Shortfall} > 0$.
- **Logic:**
  - When a shortfall is detected, calculate the 3 controlled paths to resolve the gap (formulas detailed in `calculations/engine.md`):
    1. **Option A: Increase Monthly Savings.** Calculate the exact new monthly savings rate required to hit target on time.
    2. **Option B: Reduce Goal Cost.** Calculate the maximum future goal cost that can be supported by current savings rates.
    3. **Option C: Delay Target Date.** Calculate the number of additional months needed to fund the current goal cost at the current savings rate.
- **Generated Recommendation:**
  - *Priority:* Medium.
  - *Message:* "Your goal '${goal.name}' has a projected shortfall of $${goal.shortfall}. To eliminate this gap without changing return rates, select one of these actions:
    - **Option A:** Increase your monthly savings from $${goal.monthly_savings} to $${options.required_savings}.
    - **Option B:** Lower the goal cost from $${goal.current_cost} to $${options.supported_cost}.
    - **Option C:** Delay your target date by ${options.delay_months} months."

---

### Rule 3.4: Asset Allocation Drift (REC-DRIFT)
- **Condition:** Individual asset class drift $|w_{i, \text{actual}} - w_{i, \text{target}}| > 3\%$, OR aggregate portfolio drift $D_{\text{total}} > 5\%$.
- **Logic:**
  - Evaluate drifts from model portfolio settings.
- **Generated Recommendation:**
  - *Priority:* Medium.
  - *Message:* "Your portfolio asset allocation has drifted by ${D_total}% from your target model, driven by an overweight position of ${overweight_pct}% in ${asset_class}. To restore your diversification margins, review the rebalancing checklist with your advisor to execute buys/sells externally."

---

### Rule 3.5: Insurance & Protection Gaps (REC-INS)
- **Condition 1 (Disability):** $\text{Actual Disability Coverage} < 0.60 \times \text{Net Monthly Income}$.
- **Condition 2 (Life):** $\text{Actual Life Coverage} < 10 \times \text{Annual Net Income} + \text{Total Outstanding Liabilities}$.
- **Condition 3 (LTC):** $\text{Client Age} \ge 50$ and $\text{Has LTC Policy} = \text{False}$.
- **Generated Recommendation:**
  - *Priority:* Critical.
  - *Message (LTC Example):* "You are ${client.age} years old and do not have Long-Term Care (LTC) insurance. According to the Edelman methodology, waiting to buy LTC insurance leaves your wealth vulnerable to high medical expense drawdowns. We recommend purchasing a policy now while you are in good health."

---

### Rule 3.6: Estate Document Gaps (REC-ESTATE)
- **Condition:** Any primary document (`has_will`, `has_poa`, `has_hc_proxy`) is set to `False`.
- **Generated Recommendation:**
  - *Priority:* Critical.
  - *Message:* "Your estate plan is missing a Durable Power of Attorney. Without this document, your family cannot manage your financial affairs if you become incapacitated, potentially forcing costly probate court actions. We recommend consulting an estate attorney to draft this document."

---

## 4. Execution Pipeline & DB Storage

The engine processes records in 3 phases:
1. **Fetch Context:** Retrieve current values for the client’s cash, assets, debts, goals, and profile metrics.
2. **Execute Evaluation:** Map variables into the JSON-based condition structures.
3. **Persist Recommendations:**
   - Active recommendations that are still violated are kept as `Active`.
   - Violations that are solved are automatically marked as `Addressed` (which increases the WHS score).
   - If a user manually updates a status, write it to `Dismissed` or `Snoozed`.
