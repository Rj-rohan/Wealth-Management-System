
export default function ErrorCard({ message = "Something went wrong", onRetry }) {
  return (
    <div
      style={{
        background: "rgba(239,68,68,0.06)",
        border: "1px solid rgba(239,68,68,0.2)",
        borderRadius: "16px",
        padding: "32px",
        textAlign: "center",
        animation: "fadeUp 0.4s ease both",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          background: "rgba(239,68,68,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
          fontSize: "20px",
        }}
      >
        ⚠️
      </div>
      <p style={{ color: "#f1f5f9", fontWeight: 600, marginBottom: "6px", fontSize: "15px" }}>
        Error
      </p>
      <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "20px", maxWidth: "400px", margin: "0 auto 20px" }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: "#7c3aed",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "10px 24px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.2s ease, transform 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#6d28d9";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#7c3aed";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Try again
        </button>
      )}
    </div>
  );
}
