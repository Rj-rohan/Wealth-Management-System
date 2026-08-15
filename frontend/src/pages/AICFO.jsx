import { useState, useRef, useEffect, useCallback } from "react";
import AppShell from "../components/AppShell";
import CosmicBackground from "../components/CosmicBackground";
import GlassCard from "../components/GlassCard";
import AnimatedNumber from "../components/AnimatedNumber";

const MOCK_CONTEXT = {
  portfolioValue: 2450000,
  cashPosition: 850000,
  riskScore: 42,
  topHoldings: ["TCS", "Infosys", "HDFC Bank", "NTPC"],
};

function KPICard({ label, value, prefix, suffix, color, delay }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "12px",
      padding: "14px",
      animation: `fadeUp 0.4s ease ${delay}ms both`,
    }}>
      <p style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px", fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: "20px", fontWeight: 700, color: color || "#f1f5f9" }}>
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} duration={1000} />
      </p>
    </div>
  );
}

function InsightCard({ text, index, onDismiss }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div style={{
      borderLeft: "3px solid #7c3aed",
      background: "rgba(124,58,237,0.06)",
      borderRadius: "0 10px 10px 0",
      padding: "12px 14px",
      animation: `fadeUp 0.4s ease ${(index + 5) * 80}ms both`,
      display: "flex",
      alignItems: "start",
      gap: "10px",
    }}>
      <p style={{ fontSize: "12px", color: "#c4b5fd", lineHeight: 1.5, flex: 1 }}>{text}</p>
      <button
        onClick={() => { setVisible(false); onDismiss?.(); }}
        style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "14px", padding: "0", flexShrink: 0 }}
      >×</button>
    </div>
  );
}

function MessageBubble({ message, isStreaming }) {
  const isUser = message.role === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: "12px",
      animation: "fadeUp 0.3s ease both",
    }}>
      <div style={{
        maxWidth: "80%",
        padding: "12px 16px",
        borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
        background: isUser
          ? "linear-gradient(135deg, #7c3aed, #6d28d9)"
          : "rgba(255,255,255,0.04)",
        backdropFilter: isUser ? "none" : "blur(12px)",
        border: isUser ? "none" : "1px solid rgba(255,255,255,0.08)",
        color: "#f1f5f9",
        fontSize: "13px",
        lineHeight: 1.6,
      }}>
        {message.content}
        {isStreaming && (
          <span style={{
            display: "inline-block",
            width: "2px",
            height: "14px",
            background: "#7c3aed",
            marginLeft: "2px",
            animation: "blink 0.8s step-end infinite",
            verticalAlign: "text-bottom",
          }} />
        )}
      </div>
    </div>
  );
}

function AnimatedWaveform() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "3px", height: "40px" }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{
          width: "3px",
          borderRadius: "2px",
          background: "linear-gradient(to top, #7c3aed, #06b6d4)",
          animation: `waveform 1.2s ease-in-out ${i * 0.06}s infinite`,
          height: "8px",
        }} />
      ))}
    </div>
  );
}

function VoiceSessionModal({ onClose, messages, onMessage }) {
  const [status, setStatus] = useState("initializing");
  const [lang, setLang] = useState("en-US"); // or "hi-IN"
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus("error");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => setStatus("listening");
    recognition.onerror = () => setStatus("error");
    
    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript(final || interim);
      
      if (final) {
        handleUserSpeech(final);
      }
    };

    recognition.onend = () => {
      // If we stopped listening without getting a final result, we might want to restart
      if (status === "listening") {
        try { recognition.start(); } catch {}
      }
    };

    setStatus("listening");
    try { recognition.start(); } catch {}

    return () => {
      try { recognition.stop(); } catch {}
      window.speechSynthesis.cancel();
    };
  }, [lang]);

  const handleUserSpeech = async (text) => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setStatus("thinking");
    onMessage({ role: "user", content: text });

    const newMessages = [...messages, { role: "user", content: text }];

    try {
      const res = await fetch("/api/ai-cfo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          context: MOCK_CONTEXT,
        }),
      });

      if (!res.ok) throw new Error("Failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      let answer = fullText;
      try {
        const parsed = JSON.parse(fullText);
        if (parsed.answer) answer = parsed.answer;
      } catch {}

      onMessage({ role: "assistant", content: answer });
      setStatus("speaking");

      const utterance = new SpeechSynthesisUtterance(answer);
      utterance.lang = lang;
      utterance.onend = () => {
        setStatus("listening");
        setTranscript("");
        if (recognitionRef.current) {
          recognitionRef.current.lang = lang;
          try { recognitionRef.current.start(); } catch {}
        }
      };
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      setStatus("error");
    }
  };

  const toggleLang = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setLang((prev) => (prev === "en-US" ? "hi-IN" : "en-US"));
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(8px)",
      animation: "fadeUp 0.3s ease both",
    }}>
      <div style={{
        background: "rgba(15,15,25,0.95)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "20px",
        padding: "40px",
        textAlign: "center",
        minWidth: "340px",
      }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
          <button
            onClick={toggleLang}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            {lang === "en-US" ? "Switch to Hindi (hi-IN)" : "Switch to English (en-US)"}
          </button>
        </div>

        <div style={{
          width: "64px", height: "64px", borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.2))",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
          border: "2px solid rgba(124,58,237,0.3)",
          animation: status === "listening" || status === "speaking" ? "pulseGlow 2s ease-in-out infinite" : "none",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </div>

        <p style={{ fontSize: "16px", fontWeight: 600, color: "#f1f5f9", marginBottom: "8px", textTransform: "capitalize" }}>
          {status === "error" ? "Web Speech API not supported or error" : `${status}...`}
        </p>
        <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "24px", minHeight: "40px" }}>
          {status === "error" ? "Please use Chrome/Edge for voice support." : (transcript || "Speak to your AI CFO advisor")}
        </p>

        <AnimatedWaveform />

        <button
          onClick={() => {
            if (recognitionRef.current) try { recognitionRef.current.stop(); } catch {}
            window.speechSynthesis.cancel();
            onClose();
          }}
          style={{
            marginTop: "24px",
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#ef4444",
            borderRadius: "10px",
            padding: "10px 28px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.25)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
        >
          End call
        </button>
      </div>
    </div>
  );
}

export default function AICFOPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I'm your AI CFO advisor. I have access to your portfolio data, cash positions, and risk metrics. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [insights, setInsights] = useState([
    "Portfolio up 12.3% YTD, outperforming Nifty 50",
    "IT sector allocation at 35% — watch for rebalancing",
    "Cash reserves provide 3-month liquidity buffer",
    "Next dividend payout expected: ₹48,000 in Q3",
    "Risk score stable at 42/100 — moderate zone",
  ]);
  const chatEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function sendMessage() {
    if (!input.trim() || isStreaming) return;

    const userMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    // Add empty assistant message for streaming
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/ai-cfo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          context: MOCK_CONTEXT,
        }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: fullText };
          return updated;
        });
      }

      // Try to parse JSON response for insights
      try {
        const parsed = JSON.parse(fullText);
        if (parsed.answer) {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: parsed.answer };
            return updated;
          });
        }
        if (parsed.insights) {
          setInsights((prev) => [...parsed.insights, ...prev].slice(0, 5));
        }
      } catch {
        // Not JSON, keep as plain text
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "I apologize, but I encountered an error. Please try again or check if the API keys are configured.",
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <AppShell pageTitle="AI CFO console" pageSubtitle="Your intelligent financial advisor">
      <CosmicBackground />
      <div style={{ position: "relative", zIndex: 1, height: "calc(100vh - 60px)", display: "flex", padding: "24px", gap: "20px" }}>

        {/* Left: Chat Interface (60%) */}
        <div style={{
          flex: "0 0 60%",
          display: "flex",
          flexDirection: "column",
          background: "rgba(255,255,255,0.02)",
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
          animation: "fadeUp 0.4s ease both",
        }}>
          {/* Chat Header */}
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "10px",
                background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "14px",
              }}>🧠</div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#f1f5f9" }}>AI CFO</p>
                <p style={{ fontSize: "11px", color: "#10b981" }}>● Online</p>
              </div>
            </div>
            <button
              onClick={() => setShowVoice(true)}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "8px 14px", borderRadius: "10px",
                background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.2))",
                border: "1px solid rgba(124,58,237,0.3)",
                color: "#a78bfa",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.3))";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.2))";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              </svg>
              Start voice session
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                message={msg}
                isStreaming={isStreaming && i === messages.length - 1 && msg.role === "assistant"}
              />
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <div style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            gap: "10px",
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask your AI CFO anything..."
              disabled={isStreaming}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px",
                padding: "12px 16px",
                color: "#f1f5f9",
                fontSize: "13px",
                outline: "none",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => { e.target.style.borderColor = "rgba(124,58,237,0.5)"; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
            />
            <button
              onClick={sendMessage}
              disabled={isStreaming || !input.trim()}
              style={{
                padding: "12px 20px",
                borderRadius: "10px",
                background: isStreaming || !input.trim() ? "rgba(124,58,237,0.3)" : "#7c3aed",
                border: "none",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 600,
                cursor: isStreaming || !input.trim() ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Send
            </button>
          </div>
        </div>

        {/* Right: Context Panel (40%) */}
        <div style={{ flex: "0 0 calc(40% - 20px)", display: "flex", flexDirection: "column", gap: "12px", overflow: "hidden" }}>
          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <KPICard label="Net worth" value={33} prefix="₹" suffix="L" color="#f1f5f9" delay={0} />
            <KPICard label="Cash position" value={8.5} prefix="₹" suffix="L" color="#06b6d4" delay={80} />
            <KPICard label="Risk score" value={42} suffix="/100" color="#f59e0b" delay={160} />
            <KPICard label="Portfolio value" value={24.5} prefix="₹" suffix="L" color="#10b981" delay={240} />
          </div>

          {/* Insights */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
              Recent insights
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {insights.map((insight, i) => (
                <InsightCard key={`${insight}-${i}`} text={insight} index={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Voice Session Modal */}
        {showVoice && (
          <VoiceSessionModal
            onClose={() => setShowVoice(false)}
            messages={messages}
            onMessage={(msg) => setMessages((prev) => [...prev, msg])}
          />
        )}

        <style>{`
          @keyframes blink {
            50% { opacity: 0; }
          }
          @keyframes waveform {
            0%, 100% { height: 8px; }
            50% { height: ${24 + Math.random() * 16}px; }
          }
          @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 0 20px rgba(124,58,237,0.2); }
            50% { box-shadow: 0 0 40px rgba(124,58,237,0.4); }
          }
        `}</style>
      </div>
    </AppShell>
  );
}
