import PublicOnly from "@/features/authentication/components/PublicOnly";
import AuthShell from "@/features/authentication/components/AuthShell";
import ForgotPasswordForm from "@/features/authentication/components/ForgotPasswordForm";

export const metadata = { title: "Reset password — Meridian Advisor Portal" };

export default function ForgotPasswordPage() {
  return (
    <PublicOnly>
      <AuthShell title="Forgot password?" subtitle="We'll send you a link to reset your password.">
        <ForgotPasswordForm />
      </AuthShell>
    </PublicOnly>
  );
}
