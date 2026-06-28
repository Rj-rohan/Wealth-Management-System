"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, MailCheck } from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import { authService } from "../services/authService";

export default function VerifyEmail() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const email = params.get("email") || "";
  const [status, setStatus] = useState(token ? "verifying" : "manual");
  const done = useRef(false);

  useEffect(() => {
    if (!token || done.current) return;
    done.current = true;
    authService
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center text-center gap-3 py-4">
        <Spinner size={24} />
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Verifying your email…
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center text-center gap-3">
        <span className="flex items-center justify-center w-12 h-12 rounded-2xl" style={{ background: "var(--accent-dim)", color: "var(--success)" }}>
          <CheckCircle2 size={24} />
        </span>
        <p className="text-sm" style={{ color: "var(--muted-strong)" }}>
          Your email has been verified. You can now sign in.
        </p>
        <Link href="/login" className="w-full">
          <Button fullWidth size="lg">
            Continue to sign in
          </Button>
        </Link>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center text-center gap-3">
        <span className="flex items-center justify-center w-12 h-12 rounded-2xl" style={{ background: "var(--danger-dim)", color: "var(--danger)" }}>
          <AlertCircle size={24} />
        </span>
        <p className="text-sm" style={{ color: "var(--muted-strong)" }}>
          This verification link is invalid or has already been used.
        </p>
        <Link href="/login" className="w-full">
          <Button fullWidth variant="outline" size="lg">
            Back to sign in
          </Button>
        </Link>
      </div>
    );
  }

  // No token in URL — instruct the advisor to check their inbox.
  return (
    <div className="flex flex-col items-center text-center gap-3">
      <span className="flex items-center justify-center w-12 h-12 rounded-2xl" style={{ background: "var(--primary-dim)", color: "var(--primary)" }}>
        <MailCheck size={24} />
      </span>
      <p className="text-sm" style={{ color: "var(--muted-strong)" }}>
        We've sent a verification link{email ? ` to ${email}` : ""}. Open it to activate your account.
      </p>
      <Link href="/login" className="w-full">
        <Button fullWidth variant="outline" size="lg">
          Back to sign in
        </Button>
      </Link>
    </div>
  );
}
