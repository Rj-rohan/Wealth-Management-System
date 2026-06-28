"use client";
import { ShieldCheck, TrendingUp, Users, Lock } from "lucide-react";

const HIGHLIGHTS = [
  { icon: Users, text: "Manage your client relationships in one place" },
  { icon: TrendingUp, text: "Track engagements, meetings, and revenue" },
  { icon: Lock, text: "Bank-grade security for sensitive financial data" },
];

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-full flex" style={{ background: "var(--background)" }}>
      {/* Brand panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{
          background:
            "radial-gradient(900px circle at 20% 0%, rgba(99,102,241,0.18), transparent 45%), var(--surface)",
          borderRight: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: "var(--primary)", color: "#fff" }}>
            <ShieldCheck size={20} />
          </span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Meridian
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Advisor Portal
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>
            The professional home for modern wealth advisors.
          </h2>
          <p className="text-sm mt-3 max-w-md" style={{ color: "var(--muted-strong)" }}>
            Build your practice on a platform designed for clarity, trust, and growth.
          </p>

          <div className="mt-8 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span
                  className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
                  style={{ background: "var(--primary-dim)", color: "var(--primary)" }}
                >
                  <Icon size={17} />
                </span>
                <span className="text-sm" style={{ color: "var(--muted-strong)" }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: "var(--muted)" }}>
          © {new Date().getFullYear()} Meridian Advisory. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm mt-1.5" style={{ color: "var(--muted)" }}>
                {subtitle}
              </p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
