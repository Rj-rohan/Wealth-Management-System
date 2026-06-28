"use client";
import { initials as toInitials } from "@/utils/format";

const SIZES = { xs: 28, sm: 36, md: 44, lg: 64, xl: 96 };

export default function Avatar({ src, name = "", size = "md", className = "" }) {
  const px = SIZES[size] || SIZES.md;
  const fontSize = px <= 36 ? 12 : px <= 44 ? 14 : px <= 64 ? 20 : 28;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full overflow-hidden flex-shrink-0 ${className}`}
      style={{
        width: px,
        height: px,
        background: src ? "transparent" : "var(--primary-dim)",
        border: "1px solid var(--border)",
        color: "var(--primary)",
        fontWeight: 600,
        fontSize,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        toInitials(name) || "?"
      )}
    </span>
  );
}
