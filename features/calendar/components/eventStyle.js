export const EVENT_STYLE = {
  meeting: { bg: "var(--primary-dim)", color: "var(--primary)", dot: "var(--primary)" },
  blocked: { bg: "var(--surface-hover)", color: "var(--muted-strong)", dot: "var(--muted)" },
  holiday: { bg: "rgba(245,158,11,0.14)", color: "var(--warning)", dot: "var(--warning)" },
};

export function styleFor(type) {
  return EVENT_STYLE[type] || EVENT_STYLE.meeting;
}
