/**
 * Application routes.
 *
 * One router for the whole platform, organised by area: Overview, Planning,
 * Research, Markets and Advisory. The paths the two original products used are
 * kept as redirects so existing links keep working.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { InvestorProfileProvider } from './context/InvestorProfileContext';
import { AIChatWidget } from './components/AIChatWidget';

import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import InvestingStyle from './pages/InvestingStyle';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Goals from './pages/Goals';

import BuffettScreener from './pages/BuffettScreener';
import EquityResearch from './pages/EquityResearch';
import ShareholderLetters from './pages/ShareholderLetters';
import BuffettMethodology from './pages/BuffettMethodology';
import Watchlist from './pages/Watchlist';

import MarketPulse from './pages/MarketPulse';
import RiskRadar from './pages/RiskRadar';
import TreasuryAutopilot from './pages/TreasuryAutopilot';
import BranchIntelligence from './pages/BranchIntelligence';
import SmartReports from './pages/SmartReports';
import AICFO from './pages/AICFO';

export default function App() {
  const { user } = useAppStore();

  const requireAuth = (element: JSX.Element) => {
    if (!user) return <Navigate to="/login" replace />;
    if (!user.onboarding_complete) return <Navigate to="/onboarding" replace />;
    return element;
  };

  const requireOnboarding = (element: JSX.Element) => {
    if (!user) return <Navigate to="/login" replace />;
    if (user.onboarding_complete) return <Navigate to="/dashboard" replace />;
    return element;
  };

  const homeRedirect = user ? (user.onboarding_complete ? '/dashboard' : '/onboarding') : '/login';

  return (
    <BrowserRouter>
      <InvestorProfileProvider>
        <Routes>
          {/* ─── Public ────────────────────────────────────────────────── */}
          <Route
            path="/login"
            element={!user ? <Login /> : <Navigate to={homeRedirect} replace />}
          />
          <Route path="/register" element={!user ? <Register /> : <Navigate to={homeRedirect} replace />} />

          {/* ─── Onboarding ────────────────────────────────────────────── */}
          <Route path="/onboarding" element={requireOnboarding(<Onboarding />)} />
          <Route path="/settings/investing-style" element={requireAuth(<InvestingStyle />)} />

          {/* ─── Overview ──────────────────────────────────────────────── */}
          <Route path="/dashboard" element={requireAuth(<Dashboard />)} />
          <Route path="/portfolio" element={requireAuth(<Portfolio />)} />

          {/* ─── Planning ──────────────────────────────────────────────── */}
          <Route path="/planning/goals" element={requireAuth(<Goals />)} />

          {/* ─── Research ──────────────────────────────────────────────── */}
          <Route path="/research/screener" element={requireAuth(<BuffettScreener />)} />
          <Route path="/research/equity" element={requireAuth(<EquityResearch />)} />
          <Route path="/research/letters" element={requireAuth(<ShareholderLetters />)} />
          <Route path="/research/methodology" element={requireAuth(<BuffettMethodology />)} />
          <Route path="/research/watchlist" element={requireAuth(<Watchlist />)} />

          {/* ─── Markets ───────────────────────────────────────────────── */}
          <Route path="/markets/pulse" element={requireAuth(<MarketPulse />)} />
          <Route path="/markets/risk" element={requireAuth(<RiskRadar />)} />
          <Route path="/markets/treasury" element={requireAuth(<TreasuryAutopilot />)} />
          <Route path="/markets/branches" element={requireAuth(<BranchIntelligence />)} />
          <Route path="/markets/reports" element={requireAuth(<SmartReports />)} />

          {/* ─── Advisory ──────────────────────────────────────────────── */}
          <Route path="/ai-cfo" element={requireAuth(<AICFO />)} />

          {/* ─── Legacy paths from the two original products ───────────── */}
          <Route path="/goals" element={<Navigate to="/planning/goals" replace />} />
          <Route path="/buffett-screener" element={<Navigate to="/research/screener" replace />} />
          <Route path="/equity-research" element={<Navigate to="/research/equity" replace />} />
          <Route path="/shareholder-letters" element={<Navigate to="/research/letters" replace />} />
          <Route path="/warren-buffett-methodology" element={<Navigate to="/research/methodology" replace />} />
          <Route path="/watchlist" element={<Navigate to="/research/watchlist" replace />} />
          <Route path="/market-pulse" element={<Navigate to="/markets/pulse" replace />} />
          <Route path="/risk-radar" element={<Navigate to="/markets/risk" replace />} />
          <Route path="/treasury-autopilot" element={<Navigate to="/markets/treasury" replace />} />
          <Route path="/branch-intelligence" element={<Navigate to="/markets/branches" replace />} />
          <Route path="/smart-reports" element={<Navigate to="/markets/reports" replace />} />

          <Route path="/" element={<Navigate to={homeRedirect} replace />} />
          <Route path="*" element={<Navigate to={homeRedirect} replace />} />
        </Routes>

        {user && user.onboarding_complete && <AIChatWidget />}
      </InvestorProfileProvider>
    </BrowserRouter>
  );
}
