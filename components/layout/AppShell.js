"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Spinner from "@/components/ui/Spinner";

export default function AppShell({ children, title, subtitle, notificationCount = 0 }) {
  const { user, loading, logout } = useAuth();
  const { success } = useNotifications();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Protected route guard.
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  async function handleLogout() {
    await logout();
    success("You have been signed out");
    router.replace("/login");
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: "var(--background)" }}>
        <Spinner size={26} label="Loading your workspace…" />
      </div>
    );
  }

  return (
    <div className="flex h-full" style={{ background: "transparent" }}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        onLogout={handleLogout}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Navbar
          title={title}
          subtitle={subtitle}
          user={user}
          notificationCount={notificationCount}
          onOpenMobile={() => setMobileOpen(true)}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
