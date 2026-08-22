"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Paperclip,
  Smile,
  CheckCheck,
  Phone,
  Video,
  User,
  MessageCircle,
  Mic,
  Square,
  FileText,
  PieChart,
  Target,
  Sparkles,
} from "lucide-react";
import { Avatar, EmptyState, Button } from "@/components/ui";
import { messagesService } from "@/services/messages.service";
import { formatTime } from "@/utils/format";
import TypingIndicator from "./TypingIndicator";
import WhatsAppCallModal from "./WhatsAppCallModal";

const EMOJIS = ["👍", "🙏", "✅", "📈", "💡", "🎯", "😊", "🚀", "💰", "🤝"];

export default function ChatWindow({ conversation, onUpdated }) {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Call modal states
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callMode, setCallMode] = useState("video");

  const scrollRef = useRef(null);

  useEffect(() => {
    setMessages(conversation?.messages || []);
  }, [conversation]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  // Voice note timer
  useEffect(() => {
    if (!recordingVoice) {
      setRecordingSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [recordingVoice]);

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState
          icon={MessageCircle}
          title="Select a client conversation"
          description="Choose a client from the left list or search by name to chat directly."
        />
      </div>
    );
  }

  async function send(customText = null) {
    const text = (customText !== null ? customText : draft).trim();
    if (!text) return;
    if (customText === null) setDraft("");
    setShowEmoji(false);
    setShowAttach(false);

    const optimistic = { id: `tmp_${Date.now()}`, from: "advisor", text, at: new Date().toISOString(), read: true };
    setMessages((m) => [...m, optimistic]);

    await messagesService.send(conversation.id, text);
    setTyping(true);
    const reply = await messagesService.simulateReply(conversation.id);
    setTyping(false);
    if (reply) setMessages((m) => [...m, reply]);
    onUpdated?.();
  }

  function handleVoiceNoteSend() {
    setRecordingVoice(false);
    const sec = recordingSeconds || 4;
    const voiceMsg = `🎤 Voice Note (0:${String(sec).padStart(2, "0")})`;
    send(voiceMsg);
  }

  function handleStartCall(mode) {
    setCallMode(mode);
    setCallModalOpen(true);
  }

  function handleCallEnded(mode, durationSec) {
    const min = Math.floor(durationSec / 60);
    const sec = durationSec % 60;
    const timeStr = min > 0 ? `${min}m ${sec}s` : `${sec}s`;
    const callIcon = mode === "video" ? "📹" : "📞";
    const logText = `${callIcon} WhatsApp ${mode === "video" ? "Video Call" : "Voice Call"} ended • ${timeStr}`;
    send(logText);
  }

  return (
    <div className="flex flex-col h-full">
      {/* WhatsApp Header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: "rgba(10, 15, 23, 0.6)", borderBottom: "1px solid var(--border)" }}>
        <Avatar name={conversation.clientName} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{conversation.clientName}</p>
            <span className="w-2 h-2 rounded-full" style={{ background: "var(--primary)" }} />
          </div>
          <p className="text-xs" style={{ color: "var(--primary)" }}>Online • WhatsApp Connected</p>
        </div>

        {conversation.clientId && (
          <Button
            size="xs"
            variant="secondary"
            icon={User}
            onClick={() => router.push(`/clients/${conversation.clientId}`)}
          >
            Client Profile
          </Button>
        )}

        {/* WhatsApp Voice Call */}
        <button
          onClick={() => handleStartCall("voice")}
          className="p-2 rounded-xl transition-colors text-white/80 hover:text-white"
          style={{ background: "rgba(22, 217, 106, 0.15)", border: "1px solid rgba(22, 217, 106, 0.3)" }}
          aria-label="WhatsApp Voice Call"
          title="Start WhatsApp Voice Call"
        >
          <Phone size={17} style={{ color: "var(--primary)" }} />
        </button>

        {/* WhatsApp Video Call */}
        <button
          onClick={() => handleStartCall("video")}
          className="p-2 rounded-xl transition-colors text-white/80 hover:text-white"
          style={{ background: "rgba(22, 217, 106, 0.15)", border: "1px solid rgba(22, 217, 106, 0.3)" }}
          aria-label="WhatsApp Video Call"
          title="Start WhatsApp Video Call"
        >
          <Video size={17} style={{ color: "var(--primary)" }} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const mine = m.from === "advisor";
            const isVoice = m.text?.startsWith("🎤");
            const isCall = m.text?.startsWith("📞") || m.text?.startsWith("📹");

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[78%]">
                  <div
                    className="px-3.5 py-2.5 rounded-2xl text-sm"
                    style={{
                      background: isCall
                        ? "rgba(22, 217, 106, 0.12)"
                        : mine
                        ? "var(--primary)"
                        : "var(--surface-hover)",
                      color: isCall ? "var(--foreground)" : mine ? "#fff" : "var(--foreground)",
                      border: isCall ? "1px solid rgba(22, 217, 106, 0.3)" : "none",
                      borderBottomRightRadius: mine ? 4 : 16,
                      borderBottomLeftRadius: mine ? 16 : 4,
                    }}
                  >
                    {isVoice ? (
                      <div className="flex items-center gap-2.5 py-0.5">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20">
                          <Mic size={14} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 h-3.5">
                            {[12, 16, 8, 20, 14, 18, 10, 16, 12].map((h, i) => (
                              <span key={i} className="w-1 rounded-full bg-white/70" style={{ height: `${h}px` }} />
                            ))}
                          </div>
                          <span className="text-[11px] opacity-80">{m.text}</span>
                        </div>
                      </div>
                    ) : (
                      m.text
                    )}
                  </div>
                  <div className={`flex items-center gap-1 mt-0.5 ${mine ? "justify-end" : "justify-start"}`}>
                    <span className="text-[10px]" style={{ color: "var(--muted)" }}>{formatTime(m.at)}</span>
                    {mine && <CheckCheck size={12} style={{ color: m.read ? "var(--info)" : "var(--muted)" }} />}
                  </div>
                </div>
              </motion.div>
            );
          })}
          {typing && (
            <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-start">
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Composer */}
      <div className="px-3 py-3 relative" style={{ borderTop: "1px solid var(--border)" }}>
        {/* Emoji popover */}
        <AnimatePresence>
          {showEmoji && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-16 left-3 flex gap-1 p-2 rounded-xl"
              style={{ background: "var(--surface-raised)", border: "1px solid var(--border-strong)" }}
            >
              {EMOJIS.map((e) => (
                <button key={e} onClick={() => setDraft((d) => d + e)} className="text-lg hover:scale-125 transition-transform">
                  {e}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attachment menu popover */}
        <AnimatePresence>
          {showAttach && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-16 left-3 flex flex-col gap-1 p-2 rounded-xl shadow-xl z-20"
              style={{ background: "var(--surface-raised)", border: "1px solid var(--border-strong)", width: 220 }}
            >
              <button
                onClick={() => send("📄 Shared Financial Plan Document (PDF)")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left hover:bg-white/5 transition-colors"
                style={{ color: "var(--foreground)" }}
              >
                <FileText size={15} style={{ color: "var(--info)" }} />
                <span>Share Financial Plan</span>
              </button>
              <button
                onClick={() => send("📊 Shared Portfolio Breakdown Snapshot")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left hover:bg-white/5 transition-colors"
                style={{ color: "var(--foreground)" }}
              >
                <PieChart size={15} style={{ color: "var(--primary)" }} />
                <span>Share Portfolio Report</span>
              </button>
              <button
                onClick={() => send("🎯 Shared Goal Roadmap Review")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left hover:bg-white/5 transition-colors"
                style={{ color: "var(--foreground)" }}
              >
                <Target size={15} style={{ color: "var(--warning)" }} />
                <span>Share Goal Summary</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Bar or Voice Recording Bar */}
        {recordingVoice ? (
          <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-2.5" style={{ background: "rgba(22, 217, 106, 0.1)", border: "1px solid var(--primary)" }}>
            <div className="flex items-center gap-3">
              <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs font-semibold text-white">Recording Voice Note: 0:{String(recordingSeconds).padStart(2, "0")}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRecordingVoice(false)}
                className="text-xs px-2.5 py-1 rounded-lg text-white/70 hover:text-white"
              >
                Cancel
              </button>
              <Button size="xs" variant="primary" icon={Send} onClick={handleVoiceNoteSend}>
                Send Note
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl px-2 py-1.5" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
            <button
              onClick={() => { setShowAttach((a) => !a); setShowEmoji(false); }}
              className="p-1.5 rounded-lg"
              style={{ color: showAttach ? "var(--primary)" : "var(--muted)" }}
              aria-label="Attach Document or Plan"
              title="Attach Document or Plan"
            >
              <Paperclip size={17} />
            </button>
            <button
              onClick={() => { setShowEmoji((s) => !s); setShowAttach(false); }}
              className="p-1.5 rounded-lg"
              style={{ color: showEmoji ? "var(--primary)" : "var(--muted)" }}
              aria-label="Emoji"
            >
              <Smile size={17} />
            </button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
              placeholder="Type a message or share advice…"
              className="flex-1 bg-transparent outline-none text-sm py-1.5"
              style={{ color: "var(--foreground)" }}
            />
            {/* Mic button for voice note */}
            {!draft.trim() && (
              <button
                onClick={() => setRecordingVoice(true)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white transition-colors"
                style={{ color: "var(--primary)" }}
                aria-label="Record Voice Note"
                title="Record WhatsApp Voice Note"
              >
                <Mic size={18} />
              </button>
            )}
            {draft.trim() && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => send()}
                className="flex items-center justify-center w-9 h-9 rounded-lg"
                style={{ background: "var(--primary)", color: "#061009" }}
                aria-label="Send"
              >
                <Send size={16} />
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* WhatsApp Call Screen Modal */}
      <WhatsAppCallModal
        isOpen={callModalOpen}
        mode={callMode}
        clientName={conversation.clientName}
        onClose={() => setCallModalOpen(false)}
        onCallEnded={handleCallEnded}
      />
    </div>
  );
}
