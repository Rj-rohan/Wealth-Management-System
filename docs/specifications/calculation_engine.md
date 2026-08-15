# CALCULATION ENGINE SPECIFICATIONS
## Personal Wealth Management Mathematical Models & Implementations
**Version:** 1.0  
**Status:** Approved  
**Author:** Lead Quantitative Architect & Financial Engineer  
**Date:** June 2026  

---

## 1. Core Financial Calculations

This document defines the mathematical models used by the Weallth calculation engine. 

Let the following variables be defined globally for all equations:
- $PV$: Present Value (current assets or cost)
- $FV$: Future Value (projected cost or assets)
- $r$: Annual nominal rate of return (expressed as a decimal)
- $i$: Annual inflation rate (expressed as a decimal)
- $t$: Time horizon in years
- $n$: Number of compounding periods per year (for monthly calculations, $n=12$)
- $PMT$: Monthly savings contribution amount

---

### 1.1 Net Worth Calculation
Computes the client's current net worth.
- Let $A_j$ be the current value of asset $j$ ($j = 1 \dots J$).
- Let $L_k$ be the outstanding balance of liability $k$ ($k = 1 \dots K$).

$$\text{Net Worth} = \sum_{j=1}^{J} A_j - \sum_{k=1}^{K} L_k$$

---

### 1.2 Inflation-Adjusted Future Cost of Goal ($FV_{\text{cost}}$)
Computes the future cost of a goal based on inflation.
- Let $PV_{\text{cost}}$ be the current cost of the goal if paid today.
- Let $i_{\text{goal}}$ be the category-specific inflation rate.

$$FV_{\text{cost}} = PV_{\text{cost}} \times (1 + i_{\text{goal}})^t$$

---

### 1.3 Future Value of Earmarked Current Assets ($FV_{\text{assets}}$)
Computes the future value of current assets set aside for a goal.
- Let $PV_{\text{earmark}}$ be the current value of assets set aside.
- Let $r_{\text{annual}}$ be the annual return rate.
- Let $t$ be the years to goal.
- Let $T_{\text{tax}}$ be the effective tax rate.
- Let $r_{\text{net}}$ be the net after-tax return rate: $r_{\text{net}} = r_{\text{annual}} \times (1 - T_{\text{tax}})$ (if assets are taxable, else $r_{\text{net}} = r_{\text{annual}}$).

$$FV_{\text{assets}} = PV_{\text{earmark}} \times (1 + r_{\text{net}})^t$$

---

### 1.4 Future Value of Monthly Savings ($FV_{\text{savings}}$)
Computes the future value of monthly savings contributions.
- Let $PMT$ be the monthly savings amount.
- Let $r_{\text{monthly}}$ be the monthly net return rate: $r_{\text{monthly}} = \frac{r_{\text{net}}}{12}$.
- Let $N$ be the total months: $N = t \times 12$.

$$FV_{\text{savings}} = PMT \times \frac{(1 + r_{\text{monthly}})^N - 1}{r_{\text{monthly}}}$$

---

### 1.5 Net Surplus or (Shortfall)
Calculates the final gap at the goal deadline.
- Let $OS$ be the outside sources of funding (e.g., pensions, grants, or social security) in future value.

$$\text{Shortfall} = (FV_{\text{assets}} + FV_{\text{savings}} + OS) - FV_{\text{cost}}$$
- A negative result indicates a funding gap (shortfall).
- A positive result indicates a surplus.

---

## 2. Client-Controlled Shortfall Solutions

When a shortfall exists ($\text{Shortfall} < 0$), the engine computes the three client-controlled solutions to eliminate the gap. The assumed inflation rate ($i$), tax rate ($T_{\text{tax}}$), and rate of return ($r$) remain locked.

### 2.1 Solution A: Required Monthly Savings ($PMT_{\text{required}}$)
Computes the new monthly savings rate required to achieve the goal on time.
- Let $FV_{\text{target}}$ be the net future cost to fund: $FV_{\text{target}} = FV_{\text{cost}} - FV_{\text{assets}} - OS$.

$$PMT_{\text{required}} = FV_{\text{target}} \times \frac{r_{\text{monthly}}}{(1 + r_{\text{monthly}})^N - 1}$$

---

### 2.2 Solution B: Supported Goal Cost ($PV_{\text{supported\_cost}}$)
Computes the maximum goal cost the client can support today at their current savings rate.
- Let $FV_{\text{supported\_assets}}$ be the total future value of assets: $FV_{\text{supported\_assets}} = FV_{\text{assets}} + FV_{\text{savings}} + OS$.

$$PV_{\text{supported\_cost}} = \frac{FV_{\text{supported\_assets}}}{(1 + i_{\text{goal}})^t}$$

---

### 2.3 Solution C: Extended Time Horizon ($t_{\text{extended}}$)
Calculates the total years needed to fund the goal at the current savings rate.
This is computed by finding the total months $N_{\text{extended}}$ that satisfies the equation:

$$PV_{\text{earmark}} (1 + r_{\text{monthly}})^N + PMT \frac{(1 + r_{\text{monthly}})^N - 1}{r_{\text{monthly}}} + OS = PV_{\text{cost}} (1 + i_{\text{monthly}})^N$$

Since this equation has $N$ on both sides, the engine solves it numerically using a standard Newton-Raphson approximation solver.

---

## 3. Python Implementations

The following Python code implements the calculation logic and serves as the baseline for unit tests:

```python
import numpy as np

def calculate_net_worth(assets: list, liabilities: list) -> float:
    """Calculate Net Worth."""
    return sum(assets) - sum(liabilities)

def calculate_future_cost(present_cost: float, inflation_rate: float, years: float) -> float:
    """Calculate inflation-adjusted future cost of a goal."""
    return round(present_cost * ((1.0 + inflation_rate) ** years), 2)

def calculate_fv_assets(present_value: float, rate_of_return: float, tax_rate: float, years: float, is_taxable: bool = True) -> float:
    """Calculate Future Value of current assets, adjusting for effective tax rate."""
    net_return = rate_of_return * (1.0 - tax_rate) if is_taxable else rate_of_return
    return round(present_value * ((1.0 + net_return) ** years), 2)

def calculate_fv_savings(monthly_savings: float, rate_of_return: float, tax_rate: float, years: float, is_taxable: bool = True) -> float:
    """Calculate Future Value of monthly savings, compounded monthly."""
    net_return = rate_of_return * (1.0 - tax_rate) if is_taxable else rate_of_return
    r_monthly = net_return / 12.0
    n_months = int(years * 12)
    if r_monthly == 0:
        return round(monthly_savings * n_months, 2)
    fv = monthly_savings * (((1.0 + r_monthly) ** n_months - 1.0) / r_monthly)
    return round(fv, 2)

def calculate_goal_shortfall(future_cost: float, fv_assets: float, fv_savings: float, outside_sources: float) -> float:
    """Calculate net goal shortfall. Negative indicates a shortfall."""
    return round((fv_assets + fv_savings + outside_sources) - future_cost, 2)

def calculate_required_savings(target_future_cost: float, fv_assets: float, outside_sources: float, 
                              rate_of_return: float, tax_rate: float, years: float, is_taxable: bool = True) -> float:
    """Option A: Calculate required monthly savings to eliminate shortfall."""
    net_target = target_future_cost - fv_assets - outside_sources
    if net_target <= 0:
        return 0.0
    net_return = rate_of_return * (1.0 - tax_rate) if is_taxable else rate_of_return
    r_monthly = net_return / 12.0
    n_months = int(years * 12)
    if r_monthly == 0:
        return round(net_target / n_months, 2)
    pmt = net_target * (r_monthly / (((1.0 + r_monthly) ** n_months) - 1.0))
    return round(pmt, 2)

def calculate_supported_cost(fv_assets: float, fv_savings: float, outside_sources: float, 
                             inflation_rate: float, years: float) -> float:
    """Option B: Calculate current goal cost supported by current assets and savings."""
    total_fv_assets = fv_assets + fv_savings + outside_sources
    pv = total_fv_assets / ((1.0 + inflation_rate) ** years)
    return round(pv, 2)

def solve_extended_timeline(present_cost: float, earmarked_assets: float, monthly_savings: float, 
                            outside_sources: float, rate_of_return: float, tax_rate: float, 
                            inflation_rate: float, max_years: float = 40.0) -> float:
    """Option C: Solve numerically for the number of years needed to fund the goal."""
    net_return = rate_of_return * (1.0 - tax_rate)
    r_m = net_return / 12.0
    i_m = inflation_rate / 12.0
    
    # Simple binary search to find months N
    low_months = 0.0
    high_months = max_years * 12.0
    
    for _ in range(100): # 100 iterations of bisection converges fully
        mid_months = (low_months + high_months) / 2.0
        fv_a = earmarked_assets * ((1.0 + r_m) ** mid_months)
        if r_m > 0:
            fv_s = monthly_savings * (((1.0 + r_m) ** mid_months - 1.0) / r_m)
        else:
            fv_s = monthly_savings * mid_months
        
        total_assets = fv_a + fv_s + outside_sources
        future_cost = present_cost * ((1.0 + i_m) ** mid_months)
        
        diff = total_assets - future_cost
        if abs(diff) < 0.01:
            return round(mid_months / 12.0, 1)
        elif diff < 0:
            low_months = mid_months
        else:
            high_months = mid_months
            
    return round(high_months / 12.0, 1)
```

---

## 4. Specific Planning Calculations

### 4.1 Long-Term Care (LTC) Insurance Cost Drag
Calculates the impact of premium payments on current cash flow.
- Let $P_{\text{ltc}}$ be the monthly premium of the LTC policy.
- Let $I_{\text{net}}$ be the monthly net income.

$$\text{Premium Cost Drag} = \frac{P_{\text{ltc}}}{I_{\text{net}}} \times 100$$
*(Premium payments reduce monthly net savings contributions ($PMT$), which triggers recalculation of options in Section 2).*

---

### 4.2 Retirement Gap & Lifeline Calculation
Estimates the capital needed at retirement age ($Age_{\text{ret}}$) to fund monthly retirement income ($PMT_{\text{ret}}$) until projected life expectancy ($Age_{\text{death}}$).
- Let $T_{\text{retirement}} = Age_{\text{death}} - Age_{\text{ret}}$.
- Let $r_{\text{post}}$ be the post-retirement rate of return.
- Let $i_{\text{post}}$ be post-retirement inflation rate.
- Let $r_{\text{real\_monthly}}$ be the real monthly return rate: 

$$r_{\text{real\_monthly}} = \frac{1 + \frac{r_{\text{post}}}{12}}{1 + \frac{i_{\text{post}}}{12}} - 1$$

- Let $M_{\text{ret}} = T_{\text{retirement}} \times 12$.

The target capital required at the start of retirement ($FV_{\text{required\_at\_retirement}}$) to fund the lifetime cash flow is:

$$FV_{\text{required\_at\_retirement}} = PMT_{\text{ret}} \times \frac{1 - (1 + r_{\text{real\_monthly}})^{-M_{\text{ret}}}}{r_{\text{real\_monthly}}}$$

This capital requirement is set as the $FV_{\text{cost}}$ for the retirement goal. The engine then uses the goal funding calculations (Section 1) to determine current gaps and savings options.
