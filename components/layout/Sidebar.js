"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, ChevronLeft, ShieldCheck } from "lucide-react";
import { NAV_GROUPS } from "@/constants/navigation";
import { messagesService } from "@/services/messages.service";

function NavLink({ href, label, icon: Icon, collapsed, badge, onClick }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      onClick={onClick}
      className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
      style={{
        background: active ? "var(--primary-dim)" : "transparent",
        color: active ? "var(--primary)" : "var(--muted)",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "var(--surface-hover)";
          e.currentTarget.style.color = "var(--foreground)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--muted)";
        }
      }}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
          style={{ background: "var(--primary)" }}
          transition={{ type: "spring", stiffness: 500, damping: 34 }}
        />
      )}
      <Icon size={18} className="flex-shrink-0" />
      {!collapsed && <span className="text-sm font-medium truncate">{label}</span>}
      {!collapsed && badge > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="ml-auto flex items-center justify-center text-[10px] font-bold rounded-full"
          style={{ minWidth: 18, height: 18, padding: "0 5px", background: "var(--primary)", color: "#fff" }}
        >
          {badge}
        </motion.span>
      )}
    </Link>
  );
}

export default function Sidebar({ collapsed, onToggle, onLogout, mobileOpen, onCloseMobile }) {
  const [unread, setUnread] = useState(0);
  const width = collapsed ? 72 : 244;

  useEffect(() => {
    let active = true;
    messagesService.unreadTotal().then((n) => active && setUnread(n));
    return () => {
      active = false;
    };
  }, []);

  const nav = (
    <aside
      className="flex flex-col h-full transition-all duration-200"
      style={{ width, background: "var(--surface)", borderRight: "1px solid var(--border)" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4" style={{ height: 64, borderBottom: "1px solid var(--border)" }}>
        <span className="flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0" style={{ background: "var(--primary)", color: "#fff" }}>
          <ShieldCheck size={18} />
        </span>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-semibold leading-tight truncate" style={{ color: "var(--foreground)" }}>
              Meridian
            </p>
            <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
              Advisor Portal
            </p>
          </div>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 py-3 px-2.5 space-y-4 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                {group.label}
              </p>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                collapsed={collapsed}
                badge={item.badgeKey === "messages" ? unread : 0}
                onClick={onCloseMobile}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2.5" style={{ borderTop: "1px solid var(--border)" }}>
        <button
          onClick={onLogout}
          title={collapsed ? "Logout" : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
          style={{ color: "var(--muted)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--danger-dim)";
            e.currentTarget.style.color = "var(--danger)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--muted)";
          }}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>

        <button
          onClick={onToggle}
          className="hidden md:flex w-full items-center justify-center py-2.5 mt-1 rounded-xl transition-colors"
          style={{ color: "var(--muted)" }}
          aria-label="Toggle sidebar"
        >
          <span className="transition-transform duration-200" style={{ transform: collapsed ? "rotate(180deg)" : "none" }}>
            <ChevronLeft size={16} />
          </span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden md:block flex-shrink-0 h-full">{nav}</div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0" style={{ background: "rgba(5,8,15,0.6)" }} onClick={onCloseMobile} />
          <motion.div className="absolute left-0 top-0 h-full" initial={{ x: -260 }} animate={{ x: 0 }} transition={{ duration: 0.2 }}>
            {nav}
          </motion.div>
        </div>
      )}
    </>
  );
}
