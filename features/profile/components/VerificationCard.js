"use client";
import { ShieldCheck, BadgeCheck, ShieldAlert, Mail, Fingerprint, FileCheck2 } from "lucide-react";
import { Card, CardHeader, Badge, ProgressBar } from "@/components/ui";

function StatusRow({ icon: Icon, label, status }) {
  const map = {
    verified: { tone: "success", text: "Verified" },
    in_review: { tone: "info", text: "In Review" },
    pending: { tone: "warning", text: "Pending" },
    rejected: { tone: "danger", text: "Rejected" },
    true: { tone: "success", text: "Verified" },
    false: { tone: "warning", text: "Pending" },
  };
  const cfg = map[String(status)] || map.pending;
  return (
    <div className="flex items-center justify-between rounded-xl p-3" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
      <span className="flex items-center gap-2.5 text-sm" style={{ color: "var(--muted-strong)" }}>
        <span className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: "var(--surface-hover)", color: "var(--muted-strong)" }}>
          <Icon size={14} />
        </span>
        {label}
      </span>
      <Badge tone={cfg.tone}>{cfg.text}</Badge>
    </div>
  );
}

export default function VerificationCard({ verification = {} }) {
  const verified = verification.badge === "verified";
  return (
    <Card>
      <CardHeader title="Verification" subtitle="Your trust and compliance status" icon={ShieldCheck} />

      <div
        className="flex items-center justify-between rounded-xl p-4 mb-4"
        style={{
          background: verified ? "var(--accent-dim)" : "rgba(245,158,11,0.1)",
          border: `1px solid ${verified ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex items-center justify-center w-11 h-11 rounded-xl"
            style={{ background: verified ? "var(--success)" : "var(--warning)", color: "#fff" }}
          >
            {verified ? <BadgeCheck size={22} /> : <ShieldAlert size={22} />}
          </span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              {verified ? "Verified Advisor" : "Verification Incomplete"}
            </p>
            <p className="text-xs" style={{ color: "var(--muted-strong)" }}>
              {verified ? "Your profile is fully verified" : "Complete your profile to earn the verified badge"}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium" style={{ color: "var(--muted-strong)" }}>
            Profile completion
          </span>
          <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
            {verification.completion ?? 0}%
          </span>
        </div>
        <ProgressBar value={verification.completion ?? 0} />
      </div>

      <div className="space-y-2">
        <StatusRow icon={Mail} label="Email Verified" status={verification.email_verified} />
        <StatusRow icon={Fingerprint} label="Identity Verification" status={verification.identity_verified} />
        <StatusRow icon={FileCheck2} label="License Verification" status={verification.license_verified} />
        <StatusRow icon={ShieldCheck} label="KYC Status" status={verification.kyc_status} />
      </div>
    </Card>
  );
}
