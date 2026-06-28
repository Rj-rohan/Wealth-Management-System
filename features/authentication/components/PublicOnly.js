"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Spinner from "@/components/ui/Spinner";

// Wraps auth pages: if the advisor is already signed in, send them to the app.
export default function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  if (loading || user) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Spinner size={24} />
      </div>
    );
  }
  return children;
}
