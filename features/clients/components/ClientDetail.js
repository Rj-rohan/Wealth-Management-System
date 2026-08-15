"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, CalendarPlus, MessageSquare } from "lucide-react";
import { Avatar, StatusBadge, Tabs, Button, Select, Skeleton, EmptyState } from "@/components/ui";
import { useNotifications } from "@/context/NotificationContext";
import { useClient } from "../hooks/useClient";
import { clientsService } from "@/services/clients.service";
import ClientOverview from "./profile/ClientOverview";
import FinancialSnapshot from "./profile/FinancialSnapshot";
import GoalsList from "./profile/GoalsList";
import ActivityTimeline from "./profile/ActivityTimeline";
import MeetingHistory from "./profile/MeetingHistory";
import ClientDocuments from "./profile/ClientDocuments";
import ClientNotes from "./profile/ClientNotes";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "financials", label: "Financials" },
  { id: "goals", label: "Goals" },
  { id: "activity", label: "Activity" },
  { id: "meetings", label: "Meetings" },
  { id: "documents", label: "Documents" },
  { id: "notes", label: "Notes" },
];

const STATUS_OPTIONS = [
  { value: "prospect", label: "Prospect" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

export default function ClientDetail({ id }) {
  const { client, setClient, loading, notFound, reload } = useClient(id);
  const { success } = useNotifications();
  const router = useRouter();
  const [tab, setTab] = useState("overview");

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton height={140} rounded={16} />
        <Skeleton height={44} rounded={12} />
        <Skeleton height={300} rounded={16} />
      </div>
    );
  }

  if (notFound || !client) {
    return (
      <EmptyState
        title="Client not found"
        description="This client may have been removed."
        action={<Button onClick={() => router.push("/clients")}>Back to clients</Button>}
      />
    );
  }

  async function changeStatus(status) {
    const updated = await clientsService.updateStatus(client.id, status);
    setClient((c) => ({ ...c, status: updated.status }));
    success(`Status updated to ${status}`);
  }

  return (
    <div className="space-y-5">
      <Link href="/clients" className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--muted)" }}>
        <ArrowLeft size={15} /> Back to clients
      </Link>

      {/* Header */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "radial-gradient(600px circle at 100% 0%, rgba(22,217,106,0.1), transparent 50%), var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={client.name} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{client.name}</h2>
              <StatusBadge status={client.status} kind="client" />
              <StatusBadge status={client.riskProfile} kind="risk" />
            </div>
            <p className="text-sm mt-1" style={{ color: "var(--muted-strong)" }}>{client.occupation}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}><Mail size={12} /> {client.email}</span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}><Phone size={12} /> {client.phone}</span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}><MapPin size={12} /> {client.location}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" icon={MessageSquare} onClick={() => router.push("/messages")}>Message</Button>
              <Button size="sm" icon={CalendarPlus} onClick={() => router.push("/appointments")}>Schedule</Button>
            </div>
            <Select options={STATUS_OPTIONS} value={client.status} onChange={(e) => changeStatus(e.target.value)} />
          </div>
        </div>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "overview" && <ClientOverview client={client} />}
      {tab === "financials" && <FinancialSnapshot client={client} />}
      {tab === "goals" && <GoalsList goals={client.goals} />}
      {tab === "activity" && <ActivityTimeline client={client} />}
      {tab === "meetings" && <MeetingHistory appointments={client.appointments} />}
      {tab === "documents" && <ClientDocuments documents={client.documents} />}
      {tab === "notes" && <ClientNotes client={client} onChanged={reload} />}
    </div>
  );
}
