"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock } from "lucide-react";
import { Input, Button, Checkbox } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { isEmail, isRequired, isStrongPassword } from "@/utils/validation";
import PasswordStrengthMeter from "./PasswordStrengthMeter";

export default function RegisterForm() {
  const { register } = useAuth();
  const { success, error: notifyError } = useNotifications();
  const router = useRouter();

  const [values, setValues] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validateForm() {
    const next = {};
    if (!isRequired(values.fullName)) next.fullName = "Full name is required";
    if (!isEmail(values.email)) next.email = "Enter a valid email address";
    if (!isStrongPassword(values.password)) next.password = "At least 8 characters, mixing letters and numbers";
    if (values.password !== values.confirm) next.confirm = "Passwords do not match";
    if (!agree) next.agree = "Please accept the terms to continue";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const data = await register({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      });
      success("Account created. Please verify your email.");
      router.replace(`/verify-email?token=${encodeURIComponent(data.verifyUrl?.split("token=")[1] || "")}&email=${encodeURIComponent(values.email)}`);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Full name"
        name="fullName"
        icon={User}
        placeholder="Jordan Avery"
        value={values.fullName}
        onChange={(e) => update("fullName", e.target.value)}
        error={errors.fullName}
        autoComplete="name"
        required
      />
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
      <div>
        <Input
          label="Password"
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
        label="Confirm password"
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

      <div>
        <Checkbox
          label="I agree to the Terms of Service and Privacy Policy"
          checked={agree}
          onChange={(v) => {
            setAgree(v);
            setErrors((e) => ({ ...e, agree: undefined }));
          }}
        />
        {errors.agree && (
          <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
            {errors.agree}
          </p>
        )}
      </div>

      <Button type="submit" fullWidth loading={loading} size="lg">
        Create account
      </Button>

      <p className="text-sm text-center" style={{ color: "var(--muted)" }}>
        Already have an account?{" "}
        <Link href="/login" className="font-medium" style={{ color: "var(--primary)" }}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
