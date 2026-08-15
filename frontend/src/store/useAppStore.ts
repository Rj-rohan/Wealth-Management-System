import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser, WHSSnapshot, Goal, RecommendationAlert, NetWorthHistory, FinancialSnapshot, PortfolioSummary, PortfolioPerformance, AssetAllocation, RebalancingAlerts, AIRetirementCoachMessage, GoalChatContext } from '../types';
import { apiJson, sendAIChatMessage, updatePreferences, dismissRecommendation as dismissRecommendationApi } from '../services/api';

interface AppState {
  user: AuthUser | null;
  financialSnapshot: FinancialSnapshot | null;
  whs: WHSSnapshot | null;
  goals: Goal[];
  recommendations: RecommendationAlert[];
  netWorthHistory: NetWorthHistory[];
  isLoadingDashboard: boolean;

  // ─── Investment Management State ───────────────────────────────────────
  portfolioSummary: PortfolioSummary | null;
  portfolioPerformance: PortfolioPerformance | null;
  assetAllocation: AssetAllocation | null;
  rebalancingAlerts: RebalancingAlerts | null;
  isLoadingPortfolio: boolean;

  // ─── AI Mock State ───────────────────────────────────────────────────────
  aiRetirementCoachMessage: AIRetirementCoachMessage | null;
  fetchAIRetirementCoach: (userId: string) => Promise<void>;

  setUser: (user: AuthUser | null) => void;
  logout: () => void;
  setFinancialSnapshot: (snapshot: FinancialSnapshot) => void;
  fetchDashboardData: (userId: string) => Promise<void>;
  fetchPortfolioData: (userId: string) => Promise<void>;
  dismissRecommendation: (recId: string) => Promise<void>;

  // ─── Chat State ───────────────────────────────────────────────────────────
  chatHistory: { sender: 'user' | 'ai', text: string, suggestedFollowUps?: string[], diagnostics?: any }[];
  isChatOpen: boolean;
  isChatLoading: boolean;
  pendingGoalContext: GoalChatContext | null;
  setPendingGoalContext: (ctx: GoalChatContext | null) => void;
  openChatWithGoalContext: (ctx: GoalChatContext) => void;
  toggleChat: () => void;
  clearChatHistory: () => void;
  sendChatMessage: (message: string) => Promise<void>;

  // ─── Currency State ───────────────────────────────────────────────────────
  currency: string;
  setCurrency: (currency: string) => Promise<void>;

  // ─── Shell State ──────────────────────────────────────────────────────────
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
  financialSnapshot: null,
  whs: null,
  goals: [],
  recommendations: [],
  netWorthHistory: [],
  isLoadingDashboard: false,

  // ─── Investment Management Initial State ───────────────────────────────
  portfolioSummary: null,
  portfolioPerformance: null,
  assetAllocation: null,
  rebalancingAlerts: null,
  isLoadingPortfolio: false,

  aiRetirementCoachMessage: null,

  setUser: (user) => {
    set({ user });
    if (user?.display_currency) {
      set({ currency: user.display_currency });
    }
  },

  logout: () =>
    set({
      user: null,
      whs: null,
      goals: [],
      recommendations: [],
      netWorthHistory: [],
      financialSnapshot: null,
      portfolioSummary: null,
      portfolioPerformance: null,
      assetAllocation: null,
      rebalancingAlerts: null,
      aiRetirementCoachMessage: null,
      chatHistory: [],
      isChatOpen: false,
      pendingGoalContext: null,
    }),

  setFinancialSnapshot: (snapshot) => set({ financialSnapshot: snapshot }),

  fetchDashboardData: async (userId: string) => {
    set({ isLoadingDashboard: true });
    try {
      const [whs, goals, recommendations, netWorthHistory] = await Promise.all([
        apiJson(`/users/${userId}/wealth-health-score`),
        apiJson(`/users/${userId}/goals`),
        apiJson(`/users/${userId}/recommendations`),
        apiJson(`/users/${userId}/net-worth`),
      ]);
      set({ whs, goals, recommendations, netWorthHistory, isLoadingDashboard: false });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      set({ isLoadingDashboard: false });
    }
  },

  fetchPortfolioData: async (userId: string) => {
    set({ isLoadingPortfolio: true });
    try {
      const [portfolioSummary, portfolioPerformance, assetAllocation, rebalancingAlerts] = await Promise.all([
        apiJson(`/users/${userId}/portfolio/summary`),
        apiJson(`/users/${userId}/portfolio/performance`),
        apiJson(`/users/${userId}/portfolio/allocation`),
        apiJson(`/users/${userId}/portfolio/rebalancing`),
      ]);
      set({ portfolioSummary, portfolioPerformance, assetAllocation, rebalancingAlerts, isLoadingPortfolio: false });
    } catch (err) {
      console.error('Portfolio fetch error:', err);
      set({ isLoadingPortfolio: false });
    }
  },

  fetchAIRetirementCoach: async (userId: string) => {
    try {
      set({ aiRetirementCoachMessage: await apiJson(`/users/${userId}/retirement-coach`) });
    } catch (err) {
      console.error('AI Retirement Coach fetch error:', err);
    }
  },

  dismissRecommendation: async (recId: string) => {
    const { user } = get();
    if (!user) return;
    try {
      await dismissRecommendationApi(user.id, recId);
      set({ recommendations: get().recommendations.filter(r => r.id !== recId) });
    } catch (err) {
      console.error('Failed to dismiss recommendation:', err);
    }
  },

  // ─── Chat State ───────────────────────────────────────────────────────────
  chatHistory: [],
  isChatOpen: false,
  isChatLoading: false,
  pendingGoalContext: null,
  setPendingGoalContext: (ctx) => set({ pendingGoalContext: ctx }),
  openChatWithGoalContext: (ctx) => set({ pendingGoalContext: ctx, isChatOpen: true }),
  toggleChat: () => set(state => ({ isChatOpen: !state.isChatOpen })),
  clearChatHistory: () => set({ chatHistory: [], pendingGoalContext: null }),
  sendChatMessage: async (message: string) => {
    const { user, chatHistory } = get();
    if (!user) return;
    
    // Optimistic update for user message
    const newHistory = [...chatHistory, { sender: 'user' as const, text: message }];
    set({ chatHistory: newHistory, isChatLoading: true });
    
    try {
      const response = await sendAIChatMessage(user.id, message, chatHistory);
      set({ 
        chatHistory: [
          ...newHistory,
          {
            sender: 'ai' as const,
            text: response.reply,
            suggestedFollowUps: response.suggestedFollowUps,
            diagnostics: response.diagnostics,
          }
        ],
        isChatLoading: false
      });
    } catch (err) {
      console.error('Chat error:', err);
      set({ 
        chatHistory: [...newHistory, { sender: 'ai' as const, text: 'Sorry, I am having trouble connecting right now.' }],
        isChatLoading: false 
      });
    }
  },

  // ─── Currency State ───────────────────────────────────────────────────────
  currency: 'INR',
  setCurrency: async (currency: string) => {
    const { user } = get();
    set({ currency }); // Optimistic update
    if (user) {
      try {
        await updatePreferences(user.id, currency);
      } catch (err) {
        console.error('Failed to update currency preferences:', err);
      }
    }
  },
  // ─── Shell State ──────────────────────────────────────────────────────────
  sidebarCollapsed: false,
  toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'wms-session',
      partialize: (state) => ({
        user: state.user,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
