"use client";
import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/motion/PageTransition";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import WelcomeSection from "@/features/dashboard/components/WelcomeSection";
import KpiGrid from "@/features/dashboard/components/KpiGrid";
import TodaysSchedule from "@/features/dashboard/components/TodaysSchedule";
import RecentClients from "@/features/dashboard/components/RecentClients";
import LatestMessages from "@/features/dashboard/components/LatestMessages";
import RecentDocuments from "@/features/dashboard/components/RecentDocuments";
import TodaysPriorities from "@/features/dashboard/components/TodaysPriorities";
import QuickActions from "@/features/dashboard/components/QuickActions";
import RecentPlans from "@/features/dashboard/components/RecentPlans";
import GoalAchievementSummary from "@/features/dashboard/components/GoalAchievementSummary";
import RiskAlerts from "@/features/dashboard/components/RiskAlerts";
import ClientHealthScores from "@/features/dashboard/components/ClientHealthScores";

export default function DashboardPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { data } = useDashboardData();

  const completion = profile?.verification?.completion ?? 0;
  const advisorFullName = profile?.profile?.full_name || user?.full_name || "Rahul Deshmukh";
  const name = advisorFullName.trim().split(" ")[0] || "Rahul";

  return (
    <AppShell title="Dashboard" subtitle="Your advisory command center" notificationCount={data?.unread ?? 0}>
      <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto space-y-5">
        <PageTransition>
          <div className="space-y-5">
            <WelcomeSection name={name} completion={completion} />
            <KpiGrid data={data} completion={completion} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-5">
                <TodaysSchedule items={data?.todaysSchedule ?? []} />
                <RecentClients clients={data?.recentClients ?? []} />
                <QuickActions />
              </div>
              <div className="space-y-5">
                <TodaysPriorities />
                <LatestMessages conversations={data?.conversations ?? []} />
                <RecentDocuments documents={data?.recentDocuments ?? []} />
              </div>
            </div>

            {/* Phase 3 Advisory Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-5">
                <GoalAchievementSummary summary={data?.goalSummary} />
                <RecentPlans plans={data?.plansDue ?? []} />
              </div>
              <div className="space-y-5">
                <RiskAlerts alerts={data?.riskAlerts ?? []} />
                <ClientHealthScores clients={data?.healthScores ?? []} />
              </div>
            </div>
          </div>
        </PageTransition>
      </div>
    </AppShell>
  );
}
