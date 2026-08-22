"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, Bell, ChevronDown, UserRound, Settings, LogOut } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";

export default function Navbar({ title, subtitle, user, onOpenMobile, onLogout, notificationCount = 0 }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const name = user?.full_name || "Rahul Deshmukh";

  return (
    <header
      className="flex-shrink-0 flex items-center gap-3 px-4 md:px-6"
      style={{
        height: 58,
        background: "rgba(10, 15, 23, 0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <button className="md:hidden" onClick={onOpenMobile} style={{ color: "var(--muted)" }} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <div className="flex-1 min-w-0">
        {title && (
          <h1 className="text-base font-semibold truncate" style={{ color: "var(--foreground)" }}>
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Notifications */}
      <button
        className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors"
        style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", color: "var(--muted-strong)" }}
        aria-label="Notifications"
      >
        <Bell size={17} />
        {notificationCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center text-[10px] font-bold rounded-full"
            style={{ minWidth: 16, height: 16, padding: "0 4px", background: "var(--danger)", color: "#fff" }}
          >
            {notificationCount}
          </span>
        )}
      </button>

      {/* Profile menu */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-xl transition-colors"
          style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
        >
          <Avatar src={user?.profile_photo} name={name} size="sm" />
          <span className="hidden sm:block text-sm font-medium truncate max-w-[120px]" style={{ color: "var(--foreground)" }}>
            {name}
          </span>
          <ChevronDown size={15} style={{ color: "var(--muted)" }} />
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 mt-2 w-56 rounded-xl overflow-hidden z-50"
            style={{ background: "var(--surface-raised)", border: "1px solid var(--border-strong)", boxShadow: "0 16px 40px rgba(0,0,0,0.45)" }}
          >
            <div className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                {name}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
                {user?.email}
              </p>
              <div className="mt-1.5">
                {user?.email_verified ? (
                  <Badge tone="success">Email verified</Badge>
                ) : (
                  <Badge tone="warning">Email unverified</Badge>
                )}
              </div>
            </div>
            <div className="py-1.5">
              {[
                { label: "My Profile", icon: UserRound, href: "/profile" },
                { label: "Settings", icon: Settings, href: "/settings" },
              ].map(({ label, icon: Icon, href }) => (
                <button
                  key={href}
                  onClick={() => {
                    setMenuOpen(false);
                    router.push(href);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors"
                  style={{ color: "var(--muted-strong)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onLogout?.();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors"
                style={{ color: "var(--danger)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--danger-dim)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
