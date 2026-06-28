import { Suspense } from "react";
import PublicOnly from "@/features/authentication/components/PublicOnly";
import AuthShell from "@/features/authentication/components/AuthShell";
import ResetPasswordForm from "@/features/authentication/components/ResetPasswordForm";
import Spinner from "@/components/ui/Spinner";

export const metadata = { title: "Set new password — Meridian Advisor Portal" };

export default function ResetPasswordPage() {
  return (
    <PublicOnly>
      <AuthShell title="Set a new password" subtitle="Choose a strong password for your account.">
        <Suspense fallback={<Spinner size={22} />}>
          <ResetPasswordForm />
        </Suspense>
      </AuthShell>
    </PublicOnly>
  );
}
