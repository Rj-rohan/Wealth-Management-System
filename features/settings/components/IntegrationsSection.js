"use client";
import { useState, useEffect } from "react";
import {
  Calendar,
  Video,
  CheckCircle2,
  AlertTriangle,
  Link2,
  Unlink,
  ExternalLink,
  Zap,
  KeyRound,
  Info,
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useNotifications } from "@/context/NotificationContext";

export default function IntegrationsSection() {
  const { success, error: notifyError } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [googleStatus, setGoogleStatus] = useState({ isConnected: false, isConfigured: false, googleEmail: null });
  const [disconnecting, setDisconnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function loadStatus() {
    try {
      setLoading(true);
      const res = await fetch("/api/google/status");
      const data = await res.json();
      if (data?.data) {
        setGoogleStatus(data.data);
      }
    } catch (err) {
      console.error("Failed to check Google status:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function handleConnect() {
    try {
      const res = await fetch("/api/google/oauth");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Google Calendar OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local");
      }
      if (data?.data?.url) {
        window.location.href = data.data.url;
      }
    } catch (err) {
      notifyError(err?.message || "Failed to initiate Google connection");
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/google/test", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Connection test failed. Please reconnect Google Calendar.";
        setTestResult({
          success: false,
          message: msg,
        });
        notifyError(msg);
      } else {
        setTestResult({
          success: true,
          message: data.data?.message || "Google Calendar connection is active and valid!",
          calendarSummary: data.data?.calendarSummary,
          timeZone: data.data?.timeZone,
          googleEmail: data.data?.googleEmail,
        });
        success("Google Calendar connection verified successfully!");
      }
    } catch (err) {
      const msg = err?.message || "Failed to contact Google Calendar API";
      setTestResult({
        success: false,
        message: msg,
      });
      notifyError(msg);
    } finally {
      setTesting(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/google/disconnect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to disconnect");

      success("Google Calendar disconnected successfully");
      setGoogleStatus((prev) => ({ ...prev, isConnected: false, googleEmail: null }));
      setTestResult(null);
      setConfirmOpen(false);
    } catch (err) {
      notifyError(err?.message || "Failed to disconnect account");
    } finally {
      setDisconnecting(false);
    }
  }

  if (loading) {
    return <Skeleton height={200} rounded={16} />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Integrations & Calendar"
          subtitle="Manage external calendar, meeting, and video consultation services"
          icon={Calendar}
        />

        <div className="space-y-4 mt-2">
          {/* Configuration Banner if OAuth keys missing in .env.local */}
          {!googleStatus.isConfigured && (
            <div
              className="p-4 rounded-2xl space-y-3"
              style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)" }}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 flex-shrink-0">
                  <KeyRound size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground">
                    Google OAuth Credentials Required
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    To enable Google Calendar syncing and real Google Meet link creation, add your OAuth 2.0 Client ID and Secret to <code className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono text-[11px]">.env.local</code>.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20 font-mono text-xs space-y-1 text-slate-300">
                <p><span className="text-amber-400">GOOGLE_CLIENT_ID</span>=&quot;your-client-id.apps.googleusercontent.com&quot;</p>
                <p><span className="text-amber-400">GOOGLE_CLIENT_SECRET</span>=&quot;your-client-secret&quot;</p>
                <p><span className="text-amber-400">GOOGLE_REDIRECT_URI</span>=&quot;http://localhost:3000/api/google/callback&quot;</p>
              </div>

              <div className="flex items-center gap-2 pt-1 text-xs text-amber-400/90">
                <Info size={14} />
                <span>Get credentials from <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-white">Google Cloud Console → Credentials</a></span>
              </div>
            </div>
          )}

          {/* Google Calendar Integration Box */}
          <div
            className="p-5 rounded-2xl transition-all space-y-4"
            style={{
              background: googleStatus.isConnected ? "rgba(22, 217, 106, 0.05)" : "var(--surface-raised)",
              border: googleStatus.isConnected ? "1px solid rgba(22, 217, 106, 0.25)" : "1px solid var(--border)",
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <span
                  className="flex items-center justify-center w-11 h-11 rounded-2xl flex-shrink-0"
                  style={{
                    background: googleStatus.isConnected ? "var(--primary-dim)" : "var(--surface)",
                    color: googleStatus.isConnected ? "var(--primary)" : "var(--muted-strong)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <Video size={20} />
                </span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold" style={{ color: "var(--foreground)" }}>
                      Google Calendar & Google Meet
                    </h4>
                    {googleStatus.isConnected ? (
                      <Badge tone="success">✓ Connected</Badge>
                    ) : (
                      <Badge tone="neutral">Not Connected</Badge>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                    {googleStatus.isConnected
                      ? `Your Google account ${googleStatus.googleEmail ? `(${googleStatus.googleEmail})` : ""} is active. New client appointments will automatically generate authentic Google Meet conference links and sync to your Google Calendar.`
                      : "Connect your Google account to automatically schedule meetings and create authentic Google Meet video conference links."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                {googleStatus.isConnected ? (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={Zap}
                      loading={testing}
                      onClick={handleTestConnection}
                    >
                      Test Connection
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      icon={Unlink}
                      onClick={() => setConfirmOpen(true)}
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    icon={Link2}
                    onClick={handleConnect}
                  >
                    Connect Google Calendar
                  </Button>
                )}
              </div>
            </div>

            {/* Test Connection Results View */}
            {testResult && (
              <div
                className="p-3.5 rounded-xl text-xs space-y-1"
                style={{
                  background: testResult.success ? "rgba(22, 217, 106, 0.1)" : "rgba(239, 68, 68, 0.1)",
                  border: testResult.success ? "1px solid rgba(22, 217, 106, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {testResult.success ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <AlertTriangle size={16} className="text-red-500" />
                  )}
                  <span style={{ color: testResult.success ? "var(--success)" : "var(--danger)" }}>
                    {testResult.message}
                  </span>
                </div>
                {testResult.success && testResult.timeZone && (
                  <p className="text-[11px] text-muted-foreground ml-6">
                    Primary Calendar: <strong>{testResult.calendarSummary || "Primary"}</strong> • TimeZone: <strong>{testResult.timeZone}</strong>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <ConfirmDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleDisconnect}
          loading={disconnecting}
          title="Disconnect Google Calendar?"
          message="Disconnecting will prevent automatic Google Meet conference creation for new appointments until you reconnect."
          confirmLabel="Disconnect"
        />
      </Card>
    </div>
  );
}
