# 🌱 MyMoneyPlant — Wealth Management System

A Next.js wealth management platform powered by **Warren Buffett's investment methodology**, designed for Indian investors.

## 🚀 Features

### 👤 Investor Onboarding & Profiling
- 4-step profile creation (personal info, finances, goals, risk)
- System classifies you into one of 4 investor types:
  - 🛡️ **Conservative** — capital preservation, low risk
  - ⚖️ **Balanced** — mix of growth and safety
  - 🏦 **Wealth Builder** — long-term retirement focus
  - 🚀 **Aggressive Growth** — high conviction, long horizon
- Personalized asset allocation & monthly budget split shown at signup

### 🧠 Warren Buffett Stock Screener
- Scores Indian stocks on 100-point **Secret Sauce Formula**:
  - ROE (25 pts) — sustained return on equity
  - Debt/Equity (20 pts) — financial strength
  - Earnings Growth CAGR (20 pts) — 5-year compounding
  - PEG Ratio / Valuation (15 pts) — P/E vs growth
  - Promoter Holding (10 pts) — skin in the game
  - Revenue Growth (10 pts) — business expansion
- Ratings: Strong Buy (80+) → Buy (65+) → Hold (50+) → Avoid (<50)
- Filter by sector, sort by score/ROE/P/E/growth
- Expandable score breakdown per stock

### 📊 Portfolio Tracker
- Add/remove stock holdings with buy price and current price
- Real-time P&L, total invested vs current value, returns %
- **Budget-aware smart suggestions** — recommends stocks affordable within your monthly budget, filtered by your max P/E and Buffett score

### 📰 Equity Research
- Sector-wise deep-dive: IT, FMCG, Power, Tyres, Banking, Microfinance
- Buffett's perspective on each sector
- Catalysts, risks, Motilal Oswal wealth creation study insights
- Watch metrics for each sector
- Filter by your investor type

### 📬 Shareholder Letters Insights
- Key lessons from Buffett's annual letters (1998–2017)
- Each letter tagged by topic (moat, valuation, compounding, crisis, etc.)
- Indian market context for every lesson
- Filter by your investor profile type

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **State**: React Context API + localStorage
- **Language**: JavaScript (ES6+)

## 📦 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to onboarding on first visit.

## 🗂️ Project Structure

```
app/
├── context/
│   └── UserContext.js          # Global user profile + investor classification
├── onboarding/
│   └── page.js                 # 4-step investor profile creation
├── buffett-screener/
│   ├── page.js                 # Main screener UI
│   ├── components/
│   │   └── StockCard.js        # Stock card with score breakdown
│   └── data/
│       ├── stocks.js           # Indian stock data with Buffett metrics
│       └── scoring.js          # 100-point Secret Sauce scoring engine
├── portfolio/
│   └── page.js                 # Portfolio tracker + smart suggestions
├── equity-research/
│   └── page.js                 # Sector research with Buffett analysis
├── shareholder-letters/
│   └── page.js                 # Buffett letter insights (1998–2017)
├── layout.js                   # Root layout with UserProvider
└── page.js                     # Dashboard (redirects to onboarding if no profile)
```

## 💡 Warren Buffett's Investment Philosophy

> *"It's far better to buy a wonderful company at a fair price than a fair company at a wonderful price."*

The platform is built around Buffett's core principles:
1. **Economic Moat** — sustainable competitive advantage
2. **Return on Equity** — management's ability to compound capital
3. **Low Debt** — financial strength and flexibility
4. **Earnings Growth** — consistent compounding over time
5. **Margin of Safety** — never overpay for even the best business
6. **Long-term Thinking** — time in market beats timing the market

## 📊 Data Sources (Conceptual)
- Stock metrics based on publicly available FY24 annual reports
- Motilal Oswal Wealth Creation Study insights (13th–16th editions)
- Warren Buffett Shareholder Letters (1998–2017)
- Sector analysis based on equity research methodology

## 🔮 Roadmap
- [ ] Live stock price integration (NSE/BSE API)
- [ ] SIP calculator with inflation-adjusted returns
- [ ] Watchlist with price alerts
- [ ] Export portfolio to PDF/Excel
- [ ] Mobile app (React Native)
