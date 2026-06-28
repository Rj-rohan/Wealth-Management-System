"use client";
import { motion } from "framer-motion";
import Badge from "./Badge";

const CLIENT_STATUS = {
  prospect: { tone: "info", label: "Prospect" },
  pending: { tone: "warning", label: "Pending" },
  active: { tone: "success", label: "Active" },
  inactive: { tone: "neutral", label: "Inactive" },
  archived: { tone: "neutral", label: "Archived" },
};

const APPOINTMENT_STATUS = {
  upcoming: { tone: "primary", label: "Upcoming" },
  completed: { tone: "success", label: "Completed" },
  cancelled: { tone: "danger", label: "Cancelled" },
};

const RISK = {
  conservative: { tone: "info", label: "Conservative" },
  moderate: { tone: "warning", label: "Moderate" },
  aggressive: { tone: "danger", label: "Aggressive" },
};

const MAPS = { client: CLIENT_STATUS, appointment: APPOINTMENT_STATUS, risk: RISK };

export default function StatusBadge({ status, kind = "client" }) {
  const cfg = (MAPS[kind] || CLIENT_STATUS)[status] || { tone: "neutral", label: status };
  return (
    <motion.span
      key={status}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="inline-flex"
    >
      <Badge tone={cfg.tone}>{cfg.label}</Badge>
    </motion.span>
  );
}
