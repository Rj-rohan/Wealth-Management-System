"use client";
import { useState, useEffect } from "react";
import { clientsService } from "@/services/clients.service";
import { appointmentsService } from "@/services/appointments.service";
import { messagesService } from "@/services/messages.service";
import { documentsService } from "@/services/documents.service";
import { financialPlansService } from "@/services/financial-plans.service";
import { goalsService } from "@/services/goals.service";
import { riskService } from "@/services/risk.service";
import { isSameDay } from "@/features/calendar/utils";

// Aggregates the advisor's workspace snapshot from the PostgreSQL-backed services.
export function useDashboardData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [stats, upcoming, clientPage, conversations, unread, recentDocs, plansDue, goalSummary, riskAlerts] =
          await Promise.all([
            clientsService.stats(),
            appointmentsService.list({ scope: "upcoming" }),
            clientsService.list({ sortBy: "lastContact", sortDir: "desc", pageSize: 6 }),
            messagesService.conversations(),
            messagesService.unreadTotal(),
            documentsService.recent(5),
            financialPlansService.getDueSoon(),
            goalsService.getSummary(),
            riskService.getAlerts(),
          ]);
        if (!active) return;

        const today = new Date();
        const upcomingList = upcoming || [];
        const todaysSchedule = upcomingList.filter((a) => isSameDay(new Date(a.start), today));

        const clientItems = clientPage?.items || [];
        const healthScores = clientItems.map((c) => ({
          id: c.id,
          name: c.name,
          score: Math.min(100, Math.max(40, Math.round(((c.assets || 100000) / Math.max(1, (c.assets || 100000) + (c.liabilities || 0))) * 100))),
        })).sort((a, b) => b.score - a.score);

        setData({
          stats: stats || { total: 0, active: 0, prospects: 0, totalAUM: 0 },
          unread: unread || 0,
          upcoming: upcomingList.slice(0, 5),
          todaysSchedule,
          recentClients: clientItems,
          conversations: (conversations || []).filter((c) => c.unread > 0).slice(0, 4),
          recentDocuments: recentDocs || [],
          pendingRequests: stats?.prospects || 0,
          plansDue: plansDue || [],
          goalSummary: goalSummary || { total: 0, completed: 0, onTrack: 0, atRisk: 0, behind: 0 },
          riskAlerts: riskAlerts || [],
          healthScores: healthScores.slice(0, 6),
        });
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { data, loading };
}
