
export default function ShimmerLoader({ rows = 3, type = "card" }) {
  if (type === "grid") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={shimmerCardStyle}>
            <div style={{ ...shimmerLine, width: "60%", height: "14px", marginBottom: "12px" }} />
            <div style={{ ...shimmerLine, width: "40%", height: "24px", marginBottom: "8px" }} />
            <div style={{ ...shimmerLine, width: "80%", height: "12px" }} />
            <style>{shimmerCSS}</style>
          </div>
        ))}
      </div>
    );
  }

  if (type === "list") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={shimmerCardStyle}>
            <div style={{ ...shimmerLine, width: "70%", height: "14px", marginBottom: "8px" }} />
            <div style={{ ...shimmerLine, width: "90%", height: "12px", marginBottom: "6px" }} />
            <div style={{ ...shimmerLine, width: "50%", height: "12px" }} />
            <style>{shimmerCSS}</style>
          </div>
        ))}
      </div>
    );
  }

  // Default card type
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={shimmerCardStyle}>
          <div style={{ ...shimmerLine, width: "45%", height: "14px", marginBottom: "12px" }} />
          <div style={{ ...shimmerLine, width: "30%", height: "28px", marginBottom: "8px" }} />
          <div style={{ ...shimmerLine, width: "65%", height: "12px" }} />
          <style>{shimmerCSS}</style>
        </div>
      ))}
    </div>
  );
}

const shimmerCardStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "16px",
  padding: "20px",
};

const shimmerLine = {
  borderRadius: "6px",
  background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s ease infinite",
};

const shimmerCSS = `
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;
