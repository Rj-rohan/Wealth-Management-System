# PRODUCT REQUIREMENT DOCUMENT (PRD)
## Personal Wealth Management Module
**Version:** 1.0  
**Status:** Approved  
**Author:** Senior Systems Architect & Lead PM  
**Date:** June 2026  

---

## 1. Executive Summary & Problem Statement

### 1.1 Overview
The **Personal Wealth Management Module** serves as the central hub of the **Weallth** platform. It aggregates the user's financial footprint (assets, liabilities, goals, and risk profiles) to provide a single, unified, goals-based financial advisory dashboard. 

Traditional wealth management tools act either as transaction-heavy trading brokerages or as static, spreadsheet-like calculators. Weallth bridges this gap by digitizing the proactive financial planning methodology described in Ric Edelman's *"Discover the Wealth Within You"*. It guides clients through structuring goals, analyzing their net worth, mapping out cash flows, calculating financial gaps, and receiving actionable recommendation alerts, without the platform holding capital or executing trades.

### 1.2 The Core Problem
Many investors suffer from fragmented financial accounts, poor debt management, inadequate emergency funds, and a lack of goal coordination. When using typical financial calculators, users frequently fall into the trap of adjusting market return assumptions, tax brackets, or inflation expectations upward to artificially make their retirement or savings plans "succeed"—an error Edelman calls "creating a plan with zero chance of success."

### 1.3 Key Architectural Constraints
1. **Advisory-Only:** The platform must never hold customer funds, act as a custodian, place security orders, buy/sell securities, or perform direct execution. Users execute recommendations externally.
2. **Methodology Fidelity:** If a shortfall is detected, users are permitted to adjust *only* variables within their control:
   - **Cost of the goal** (reducing scope/cost)
   - **Amount saved monthly** (increasing savings rate)
   - **Target achievement date** (giving savings more time to compound)

---

## 2. Target Personas

### Persona 1: Evelyn Vandermark (Mass Affluent Client)
* **Age:** 34, Marketing Manager
* **Financial Profile:** Single income, $85k/year, some student loans, $15k in 401(k), $5k savings.
* **Goals:** Pay off student debt, build an emergency fund, purchase a home in 6 years.
* **Pain Points:** Confused by conflicting debt payoff advice (avalanche vs. snowball), struggles to maintain a consistent savings rate.
* **Tech Savviness:** High (mobile-first user).

### Persona 2: Rajesh Nair (High-Net-Worth Client)
* **Age:** 48, Software Consultant & Entrepreneur
* **Financial Profile:** Combined household income of $320k/year, $450k in investments across 3 brokerages, $1.2M home equity.
* **Goals:** Fund children's college, retire in 12 years, establish a family charitable remainder trust (CRT).
* **Pain Points:** Portfolio fragmentation across multiple custodians makes tax-loss harvesting and tracking rebalancing drift highly manual.
* **Tech Savviness:** Medium-High.

### Persona 3: Sarah Jenkins (Personal Wealth Advisor)
* **Age:** 42, Certified Financial Planner (CFP) at a Registered Investment Advisor (RIA)
* **Manages:** 110 household clients, total AUM of $180M.
* **Goals:** Onboard clients digitally, automate compliance suitabilities, quickly identify which client portfolios have drifted from targets, and generate advisor-ready reports.
* **Pain Points:** Spends too much time aggregating client accounts manually; needs a single dashboard showing each household's Wealth Health Score.

---

## 3. Product Scope & Functional Features (MoSCoW)

### 3.1 MUST HAVE (Phase 1 MVP)

* **PWM-REQ-001: Consolidated Net Worth Dashboard**
  - Aggregates linked accounts (from the Investment Management module) and manual entry assets/liabilities.
  - Automatically calculates net worth: $\text{Net Worth} = \text{Total Assets} - \text{Total Liabilities}$.
  - Renders historical trends over 1Y, 3Y, 5Y, and Since Inception.

* **PWM-REQ-002: Goals Setup & Tracking (Edelman Step-by-Step)**
  - Prompts clients for: Goal Name, Current Cost (Today's Value), Start Date (Years out), Earmarked Assets, Monthly Savings, and Outside Sources.
  - Automatically calculates future inflation-adjusted cost using category-specific inflation rates (e.g., Higher Education at 6% vs. general inflation at 3%).
  - Compounds current assets and monthly savings to project the Future Value (FV) of assets.
  - Displays surplus or shortfall.
  - Restricts shortfall modifications strictly to: Goal Cost, Monthly Savings, and Target Date.

* **PWM-REQ-003: Emergency Fund Analyzer**
  - Recommends an emergency fund size based on monthly expenses and job volatility (3 months for secure dual-income, 6 months for single-income/volatile careers).
  - Flags shortfalls against liquid cash balances.

* **PWM-REQ-004: Wealth Health Score (WHS) Engine**
  - Evaluates the client's overall financial health across 7 categories: Emergency Fund, Debt Management, Savings Rate, Asset Allocation, Retirement, Insurance Coverage, and Estate Planning.
  - Stores history to show score improvement over time.

* **PWM-REQ-005: Multi-Role Client-Advisor Portals**
  - Segmented interfaces for Clients (personal dashboard, goal coaches) and Advisors (household overview, compliance suitability tracking, task management).

---

### 3.2 SHOULD HAVE (Phase 2)

* **PWM-REQ-006: Cash Flow and Liquidity Forecasting**
  - Aggregates income, scheduled payments, and discretionary spending.
  - Predicts cash flow bottlenecks over a 30, 90, and 180-day window.

* **PWM-REQ-007: Debt Payoff Planner**
  - Simulates Avalanche (highest interest rate first) and Snowball (smallest balance first) repayment strategies.
  - Calculates interest saved and accelerated payoff dates.

* **PWM-REQ-008: Rule-Based Recommendation Engine**
  - Evaluates client metrics against rules (e.g., if Emergency Fund is underfunded, generate a high-priority action card recommending savings redirection).
  - Features an "Action Hub" for clients to dismiss, snooze, or mark recommendations as "planned."

---

### 3.3 COULD HAVE (Phase 3)

* **PWM-REQ-009: AI Goal Coach & Behavioral Nudger**
  - Leverages natural language processing to explain retirement shortfalls and suggest behavioral shifts (e.g., "Skipping 2 restaurant dinners monthly covers your Turkey vacation gap").
  - Explains the reasoning behind rebalancing recommendations or insurance gaps using book-aligned terminology.

* **PWM-REQ-010: Estate Inventory and Mismatch Detector**
  - Stores a ledger of estate assets, ownership types (Individual, Joint Tenant, Trust), and designated beneficiaries.
  - Automatically flags beneficiary mismatches (e.g., primary beneficiary on a linked IRA does not match the designated heir in the client's uploaded estate planning checklist).

---

### 3.4 WON'T HAVE (Phase 4+)

* **PWM-REQ-011: Direct Trade Execution**
  - The system will *not* connect to broker order routes or execution systems. Suggestions are provided as exportable action plans.
* **PWM-REQ-012: Real-time Asset Valuation during Market Hours**
  - Portfolio balances are synchronized daily at market close. Real-time intraday trading ticks are out of scope.

---

## 4. Key Regulatory & Compliance Requirements

### 4.1 Fiduciary Duty & Advisory Rules
Since Weallth acts as an advisory-assisting platform:
- **Form ADV Disclosures:** Every recommendation screen must display a prominent disclaimer stating: *"This is an advisory simulation. Recommendations should be reviewed with a registered investment advisor. The platform does not place trade orders."*
- **Suitability Logs:** Every portfolio modification or rebalancing model proposed by an advisor to a client must be logged in a read-only audit table with timestamps, ip addresses, and suitability rationales to comply with SEC/FINRA and SEBI guidelines.

### 4.2 Data Protection & Privacy (GDPR/CCPA/DPDP)
- **PII Encryption:** Column-level encryption using AES-256 for tax IDs, bank account names, and phone numbers.
- **Client Consent Ledger:** Clients must explicitly toggle consent to share portfolio and goal details with their assigned advisor. Consent can be revoked instantly, which immediately soft-deletes the advisor access tokens.

---

## 5. Non-Functional Requirements (NFR)

* **NFR-001: Performance (API Latency)**
  - 95% of API requests (excluding external custodian fetches) must return in under **200ms**.
  - Dashboard load time with cached holdings must be under **1.5 seconds**.

* **NFR-002: Security (MFA & Audit)**
  - Multi-Factor Authentication (MFA) via TOTP is mandatory for all advisor accounts and optional for retail client accounts.
  - Read-only audit logging for all database modifications.

* **NFR-003: Reliability & Scalability**
  - System uptime SLA of **99.95%**.
  - PostgreSQL database normalization supporting up to 500,000 active clients and 10,000 advisors.
