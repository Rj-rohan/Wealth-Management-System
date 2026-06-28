import { Suspense } from "react";
import AuthShell from "@/features/authentication/components/AuthShell";
import VerifyEmail from "@/features/authentication/components/VerifyEmail";
import Spinner from "@/components/ui/Spinner";

export const metadata = { title: "Verify email — Meridian Advisor Portal" };

export default function VerifyEmailPage() {
  return (
    <AuthShell title="Verify your email" subtitle="One quick step to secure your account.">
      <Suspense fallback={<Spinner size={22} />}>
        <VerifyEmail />
      </Suspense>
    </AuthShell>
  );
}
