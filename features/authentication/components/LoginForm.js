"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import { Input, Button, Checkbox } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { isEmail, isRequired } from "@/utils/validation";

export default function LoginForm() {
  const { login } = useAuth();
  const { success, error: notifyError } = useNotifications();
  const router = useRouter();

  const [values, setValues] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validateForm() {
    const next = {};
    if (!isEmail(values.email)) next.email = "Enter a valid email address";
    if (!isRequired(values.password)) next.password = "Password is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const user = await login(values);
      success(`Welcome back, ${user.full_name || "advisor"}`);
      router.replace("/dashboard");
    } catch (err) {
      notifyError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Email address"
        name="email"
        type="email"
        icon={Mail}
        placeholder="you@firm.com"
        value={values.email}
        onChange={(e) => update("email", e.target.value)}
        error={errors.email}
        autoComplete="email"
        required
      />
      <Input
        label="Password"
        name="password"
        type="password"
        icon={Lock}
        placeholder="••••••••"
        value={values.password}
        onChange={(e) => update("password", e.target.value)}
        error={errors.password}
        autoComplete="current-password"
        required
      />

      <div className="flex items-center justify-between">
        <Checkbox label="Remember me" checked={remember} onChange={setRemember} />
        <Link href="/forgot-password" className="text-xs font-medium" style={{ color: "var(--primary)" }}>
          Forgot password?
        </Link>
      </div>

      <Button type="submit" fullWidth loading={loading} size="lg">
        Sign in
      </Button>

      <p className="text-sm text-center" style={{ color: "var(--muted)" }}>
        New to Meridian?{" "}
        <Link href="/register" className="font-medium" style={{ color: "var(--primary)" }}>
          Create an account
        </Link>
      </p>
    </form>
  );
}
