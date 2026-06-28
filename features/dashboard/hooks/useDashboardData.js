"use client";
import { useState, useEffect } from "react";
import { clientsService } from "@/services/clients.service";
import { appointmentsService } from "@/services/appointments.service";
import { messagesService } from "@/services/messages.service";
import { documentsService } from "@/services/documents.service";
import { isSameDay } from "@/features/calendar/utils";

// Aggregates the advisor's workspace snapshot from the mock services.
// Swapping the services for Supabase later requires no changes here.
export function useDashboardData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const [stats, upcoming, clientPage, conversations, unread, recentDocs] = await Promise.all([
        clientsService.stats(),
        appointmentsService.list({ scope: "upcoming" }),
        clientsService.list({ sortBy: "lastContact", sortDir: "desc", pageSize: 5 }),
        messagesService.conversations(),
        messagesService.unreadTotal(),
        documentsService.recent(5),
      ]);
      if (!active) return;

      const today = new Date();
      const todaysSchedule = upcoming.filter((a) => isSameDay(new Date(a.start), today));

      setData({
        stats,
        unread,
        upcoming: upcoming.slice(0, 5),
        todaysSchedule,
        recentClients: clientPage.items,
        conversations: conversations.filter((c) => c.unread > 0).slice(0, 4),
        recentDocuments: recentDocs,
        pendingRequests: stats.prospects,
      });
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { data, loading };
}
