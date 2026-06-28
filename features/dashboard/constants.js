// Phase 1 has no client, scheduling, or activity data yet — those modules
// arrive in later phases. Until then the dashboard reflects an empty practice
// so nothing is fabricated. Live values (profile completion) are computed
// separately from the advisor's actual profile.

export const UPCOMING_APPOINTMENTS = [];

export const RECENT_ACTIVITY = [];

export const NOTIFICATIONS = [];

export const KPI_BASELINE = {
  activeClients: 0,
  pendingRequests: 0,
  upcomingMeetings: 0,
  monthlyRevenue: 0,
};
