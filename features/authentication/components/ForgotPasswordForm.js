"use client";
import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Input, Button } from "@/components/ui";
import { authService } from "../services/authService";
import { useNotifications } from "@/context/NotificationContext";
import { isEmail } from "@/utils/validation";

export default function ForgotPasswordForm() {
  const { error: notifyError } = useNotifications();
  const [email, setEmail] = useState("");
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    if (!isEmail(email)) {
      setError("Enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const data = await authService.forgotPassword(email);
      setSent(true);
      // Local mode convenience: surface the generated reset link.
      if (data?.resetUrl) setResetUrl(data.resetUrl);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <div
          className="flex items-start gap-3 rounded-xl p-4"
          style={{ background: "var(--accent-dim)", border: "1px solid rgba(16,185,129,0.25)" }}
        >
          <CheckCircle2 size={18} style={{ color: "var(--success)", marginTop: 1 }} />
          <p className="text-sm" style={{ color: "var(--muted-strong)" }}>
            If an account exists for <strong style={{ color: "var(--foreground)" }}>{email}</strong>, a reset link
            has been generated.
          </p>
        </div>

        {resetUrl && (
          <div className="rounded-xl p-3" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
            <p className="text-xs mb-1.5" style={{ color: "var(--muted)" }}>
              Local development reset link:
            </p>
            <Link href={resetUrl} className="text-xs font-medium break-all" style={{ color: "var(--primary)" }}>
              {resetUrl}
            </Link>
          </div>
        )}

        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--primary)" }}>
          <ArrowLeft size={15} /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Email address"
        name="email"
        type="email"
        icon={Mail}
        placeholder="you@firm.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError(undefined);
        }}
        error={error}
        autoComplete="email"
        required
      />
      <Button type="submit" fullWidth loading={loading} size="lg">
        Send reset link
      </Button>
      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--primary)" }}>
        <ArrowLeft size={15} /> Back to sign in
      </Link>
    </form>
  );
}
