"use client";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";

const CONFIG = {
  success: { icon: CheckCircle2, color: "var(--success)" },
  error: { icon: AlertCircle, color: "var(--danger)" },
  warning: { icon: AlertTriangle, color: "var(--warning)" },
  info: { icon: Info, color: "var(--info)" },
};

export default function ToastContainer() {
  const { toasts, dismiss } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 w-[320px] max-w-[calc(100vw-2rem)]">
      <AnimatePresence>
        {toasts.map((toast) => {
          const cfg = CONFIG[toast.type] || CONFIG.info;
          const Icon = cfg.icon;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.18 }}
              className="flex items-start gap-2.5 rounded-xl px-3.5 py-3"
              style={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border-strong)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
              }}
            >
              <Icon size={17} style={{ color: cfg.color, marginTop: 1, flexShrink: 0 }} />
              <p className="text-sm flex-1" style={{ color: "var(--foreground)" }}>
                {toast.message}
              </p>
              <button onClick={() => dismiss(toast.id)} style={{ color: "var(--muted)" }} aria-label="Dismiss">
                <X size={15} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
