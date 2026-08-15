
export default function GlassCard({
  children,
  delay = 0,
  className = "",
  style = {},
  hover = true,
  onClick,
}) {
  return (
    <div
      className={`glass-card ${className}`}
      onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        padding: "20px",
        transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
        animation: `fadeUp 0.5s ease ${delay}ms both`,
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        zIndex: 1,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!hover) return;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 0 20px rgba(124,58,237,0.15)";
        e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)";
      }}
      onMouseLeave={(e) => {
        if (!hover) return;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
      }}
    >
      {children}
      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
