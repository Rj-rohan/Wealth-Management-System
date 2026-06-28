import PublicOnly from "@/features/authentication/components/PublicOnly";
import AuthShell from "@/features/authentication/components/AuthShell";
import LoginForm from "@/features/authentication/components/LoginForm";

export const metadata = { title: "Sign in — Meridian Advisor Portal" };

export default function LoginPage() {
  return (
    <PublicOnly>
      <AuthShell title="Welcome back" subtitle="Sign in to your advisor workspace.">
        <LoginForm />
      </AuthShell>
    </PublicOnly>
  );
}
