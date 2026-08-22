"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Video,
  User,
  FileText,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Button, Input, Textarea, Badge } from "@/components/ui";
import { useNotifications } from "@/context/NotificationContext";

export default function ScheduleMeetingModal({ isOpen, onClose, onCreated, initialClientId = "" }) {
  const { success, error } = useNotifications();
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState(initialClientId);
  const [title, setTitle] = useState("Financial Planning Consultation");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("16:00");
  const [endTime, setEndTime] = useState("16:45");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdMeet, setCreatedMeet] = useState(null);
  const [copied, setCopied] = useState(false);
  const [googleStatus, setGoogleStatus] = useState({ isConnected: true, isConfigured: true });

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split("T")[0]);
  }, []);

  // Fetch clients and Google connection status
  useEffect(() => {
    if (!isOpen) return;
    setCreatedMeet(null);
    if (initialClientId) setClientId(initialClientId);

    async function loadInitialData() {
      try {
        const [clientsRes, statusRes] = await Promise.all([
          fetch("/api/clients?pageSize=50").then((r) => r.json()),
          fetch("/api/google/status").then((r) => r.json()).catch(() => ({ data: { isConnected: false } })),
        ]);

        if (clientsRes?.data?.items) {
          setClients(clientsRes.data.items);
          if (!clientId && clientsRes.data.items.length > 0) {
            setClientId(clientsRes.data.items[0].id);
          }
        }

        if (statusRes?.data) {
          setGoogleStatus(statusRes.data);
        }
      } catch (err) {
        console.error("Failed to load initial meeting data:", err);
      }
    }
    loadInitialData();
  }, [isOpen, initialClientId]);

  async function handleConnectGoogle() {
    try {
      const res = await fetch("/api/google/oauth");
      const data = await res.json();
      if (data?.data?.url) {
        window.location.href = data.data.url;
      }
    } catch (err) {
      error("Failed to start Google OAuth flow: " + err.message);
    }
  }

  async function handleCreate() {
    if (!clientId) {
      error("Please select a client");
      return;
    }
    if (!date || !startTime) {
      error("Please select a date and start time");
      return;
    }

    setLoading(true);
    try {
      const startDateTime = new Date(`${date}T${startTime}:00`).toISOString();
      const endDateTime = new Date(`${date}T${endTime}:00`).toISOString();

      const res = await fetch("/api/appointments/google-meet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          title,
          description,
          startTime: startDateTime,
          endTime: endDateTime,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to schedule Google Meet");
      }

      success("Google Meet created and saved in calendar!");
      setCreatedMeet(result.data);
      onCreated?.(result.data);
    } catch (err) {
      error(err.message || "Failed to schedule Google Meet. Please reconnect Google Calendar.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopyUrl() {
    if (createdMeet?.googleMeetUrl) {
      navigator.clipboard.writeText(createdMeet.googleMeetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      success("Google Meet link copied!");
    }
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(5, 8, 15, 0.85)", backdropFilter: "blur(12px)" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden"
          style={{ background: "#0c131d", border: "1px solid var(--border-strong)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl" style={{ background: "rgba(22, 217, 106, 0.15)", color: "var(--primary)" }}>
                <Video size={18} />
              </span>
              <div>
                <h3 className="text-base font-bold text-white">Schedule Google Meet Consultation</h3>
                <p className="text-xs text-white/60">Creates authentic calendar event with Google Meet conference</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Google Calendar Connection Status Banner */}
          {googleStatus.isConnected && !createdMeet && (
            <div className="mb-4 p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 size={15} className="flex-shrink-0" />
                <span className="font-medium">✓ Google Calendar Connected</span>
              </div>
              <span className="text-[11px] text-white/50">Auto-creates Google Meet</span>
            </div>
          )}

          {!googleStatus.isConnected && !createdMeet && (
            <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle size={16} className="flex-shrink-0" />
                <span>Google Calendar is not connected.</span>
              </div>
              <Button size="xs" variant="secondary" onClick={handleConnectGoogle} className="flex-shrink-0">
                Connect Calendar
              </Button>
            </div>
          )}

          {/* Success State View */}
          {createdMeet ? (
            <div className="space-y-5 text-center py-4">
              <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck size={32} />
              </div>

              <div>
                <Badge tone="success">Meeting Created Successfully</Badge>
                <h4 className="text-lg font-bold text-white mt-2">{title}</h4>
                <p className="text-xs text-white/70 mt-1">
                  Scheduled for {date} at {startTime} - {endTime}
                </p>
              </div>

              {/* Google Meet Link Box */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/40 text-left space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Official Google Meet URL</p>
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/50 border border-slate-800">
                  <span className="text-xs font-mono text-white truncate">{createdMeet.googleMeetUrl}</span>
                  <button
                    onClick={handleCopyUrl}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors flex-shrink-0"
                    title="Copy URL"
                  >
                    {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button variant="secondary" onClick={onClose}>
                  Done
                </Button>
                <a
                  href={createdMeet.googleMeetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all shadow-lg"
                >
                  <Video size={16} />
                  <span>Join Google Meet</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ) : (
            /* Creation Form */
            <div className="space-y-4">
              {/* Client Selector */}
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">Client</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-900 border border-slate-800 text-white outline-none focus:border-emerald-500"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email || "No email"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Meeting Title */}
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">Meeting Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Financial Planning Consultation"
                />
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/80 mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/80 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/80 mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">Agenda / Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Review retirement roadmap, emergency buffer allocation, and asset rebalancing."
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  icon={Video}
                  loading={loading}
                  onClick={handleCreate}
                >
                  Create Google Meet
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
