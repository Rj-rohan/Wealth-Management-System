"use client";
import { useState, useEffect } from "react";
import AppShell from "../../components/AppShell";
import CosmicBackground from "../../components/CosmicBackground";
import GlassCard from "../../components/GlassCard";
import ShimmerLoader from "../../components/ShimmerLoader";

export default function ComplianceDashboard() {
  const [logs, setLogs] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingDeadlines, setLoadingDeadlines] = useState(true);
  const [addingDeadline, setAddingDeadline] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    dueDate: "",
    type: "tax",
    status: "pending",
  });

  async function loadLogs() {
    try {
      const res = await fetch("/api/compliance/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.reverse()); // Show newest audit logs first
      }
    } catch (e) {
      console.error("Failed to load compliance audit logs", e);
    } finally {
      setLoadingLogs(false);
    }
  }

  async function loadDeadlines() {
    try {
      const res = await fetch("/api/compliance/deadlines");
      if (res.ok) {
        const data = await res.json();
        setDeadlines(data);
      }
    } catch (e) {
      console.error("Failed to load compliance deadlines", e);
    } finally {
      setLoadingDeadlines(false);
    }
  }

  useEffect(() => {
    loadLogs();
    loadDeadlines();
  }, []);

  const handleAddDeadline = async (e) => {
    e.preventDefault();
    setAddingDeadline(true);
    setError("");

    if (!form.title.trim()) {
      setError("Filing / task title cannot be empty.");
      setAddingDeadline(false);
      return;
    }
    if (!form.dueDate) {
      setError("Due date is required.");
      setAddingDeadline(false);
      return;
    }

    try {
      const res = await fetch("/api/compliance/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setForm({
          title: "",
          dueDate: "",
          type: "tax",
          status: "pending",
        });
        await loadDeadlines();
      } else {
        const err = await res.json();
        setError(err.error || "Failed to create deadline task.");
      }
    } catch (e) {
      setError("Network error creating task.");
    } finally {
      setAddingDeadline(false);
    }
  };

  return (
    <AppShell pageTitle="Audit & Compliance" pageSubtitle="Cryptographic immutable audit trails and tax filing schedules" maxWidth="max-w-6xl">
      <CosmicBackground />
      <div className="px-6 py-6 max-w-6xl mx-auto space-y-6 relative z-10" id="corporate-compliance-root">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Statutory Filing Calendar */}
          <div className="lg:col-span-1 space-y-6">
            <GlassCard hover={false}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
                Add Compliance Filing Task
              </h3>
              {error && (
                <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                  {error}
                </div>
              )}
              <form onSubmit={handleAddDeadline} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Filing / Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TDS Quarterly Return (Q3)"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Filing Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="w-full bg-[#161B22] border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                    >
                      <option value="tax">Tax / GST</option>
                      <option value="audit">Statutory Audit</option>
                      <option value="board">Board Resolution</option>
                      <option value="other">Other Filing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full bg-[#161B22] border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={addingDeadline}
                  className="w-full mt-2 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-black text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {addingDeadline ? "Adding..." : "Log Statutory Task"}
                </button>
              </form>
            </GlassCard>

            {/* Statutory calendar list */}
            <GlassCard hover={false}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
                Statutory Filing Calendar
              </h3>
              {loadingDeadlines ? (
                <ShimmerLoader type="list" rows={3} />
              ) : deadlines.length === 0 ? (
                <p className="text-xs text-gray-500">No filing deadlines logged.</p>
              ) : (
                <div className="space-y-3">
                  {deadlines.map((dl) => (
                    <div 
                      key={dl.id}
                      className="p-3 rounded-lg bg-white/5 border border-white/10 flex justify-between items-center"
                    >
                      <div>
                        <h4 className="text-sm font-semibold text-white">{dl.title}</h4>
                        <p className="text-[10px] text-gray-500 mt-0.5">Due: {dl.dueDate} • Type: {dl.type}</p>
                      </div>
                      <span 
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          dl.status === "completed" 
                            ? "bg-green-500/10 text-green-400"
                            : dl.status === "pending"
                            ? "bg-red-500/10 text-red-400 animate-pulse"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {dl.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Immutable Audit Log Ledger */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Immutability Audit Trail Logs
              </h3>
              <span className="text-[10px] text-green-400 flex items-center gap-1 font-bold">
                <span>🛡️</span> Cryptographic SHA-256 signatures active
              </span>
            </div>
            {loadingLogs ? (
              <ShimmerLoader type="list" rows={5} />
            ) : logs.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
                <p className="text-sm text-gray-400">No system events logged in the audit trail.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {logs.map((log) => (
                  <GlassCard key={log.id} hover={false} style={{ padding: "14px", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="flex justify-between items-start text-xs">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            log.action === "create" 
                              ? "bg-green-400/10 text-green-400"
                              : log.action === "update"
                              ? "bg-amber-400/10 text-amber-400"
                              : "bg-red-400/10 text-red-400"
                          }`}>
                            {log.action.toUpperCase()}
                          </span>
                          <span className="text-gray-400 font-semibold">{log.entityType}</span>
                          <span className="text-gray-500 font-mono text-[10px]">({log.entityId || "batch"})</span>
                        </div>
                        {log.newValue && (
                          <div className="mt-2 text-[10px] font-mono text-gray-400 bg-black/30 p-2 rounded max-w-full overflow-x-auto whitespace-pre-wrap">
                            Details: {log.newValue}
                          </div>
                        )}
                        <p className="text-[10px] text-gray-500 mt-2">Actor ID: <strong>{log.actorId}</strong></p>
                      </div>
                      <span className="text-[10px] text-gray-500 flex-shrink-0 ml-4">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </AppShell>
  );
}
