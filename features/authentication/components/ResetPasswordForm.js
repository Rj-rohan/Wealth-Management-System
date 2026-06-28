"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { Input, Button } from "@/components/ui";
import { authService } from "../services/authService";
import { useNotifications } from "@/context/NotificationContext";
import { isStrongPassword } from "@/utils/validation";
import PasswordStrengthMeter from "./PasswordStrengthMeter";

export default function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const { success, error: notifyError } = useNotifications();

  const [values, setValues] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    const next = {};
    if (!isStrongPassword(values.password)) next.password = "At least 8 characters, mixing letters and numbers";
    if (values.password !== values.confirm) next.confirm = "Passwords do not match";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await authService.resetPassword(token, values.password);
      success("Password updated. Please sign in.");
      router.replace("/login");
    } catch (err) {
      notifyError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="rounded-xl p-4" style={{ background: "var(--danger-dim)", border: "1px solid rgba(239,68,68,0.25)" }}>
        <p className="text-sm" style={{ color: "var(--muted-strong)" }}>
          This reset link is missing or invalid.{" "}
          <Link href="/forgot-password" className="font-medium" style={{ color: "var(--primary)" }}>
            Request a new one
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Input
          label="New password"
          name="password"
          type="password"
          icon={Lock}
          placeholder="Create a strong password"
          value={values.password}
          onChange={(e) => update("password", e.target.value)}
          error={errors.password}
          autoComplete="new-password"
          required
        />
        <PasswordStrengthMeter password={values.password} />
      </div>
      <Input
        label="Confirm new password"
        name="confirm"
        type="password"
        icon={Lock}
        placeholder="Re-enter your password"
        value={values.confirm}
        onChange={(e) => update("confirm", e.target.value)}
        error={errors.confirm}
        autoComplete="new-password"
        required
      />
      <Button type="submit" fullWidth loading={loading} size="lg">
        Reset password
      </Button>
    </form>
  );
}
