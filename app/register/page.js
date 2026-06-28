import PublicOnly from "@/features/authentication/components/PublicOnly";
import AuthShell from "@/features/authentication/components/AuthShell";
import RegisterForm from "@/features/authentication/components/RegisterForm";

export const metadata = { title: "Create account — Meridian Advisor Portal" };

export default function RegisterPage() {
  return (
    <PublicOnly>
      <AuthShell title="Create your account" subtitle="Join Meridian and start growing your advisory practice.">
        <RegisterForm />
      </AuthShell>
    </PublicOnly>
  );
}
