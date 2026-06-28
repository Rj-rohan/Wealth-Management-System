"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Smile, CheckCheck, Phone, Video } from "lucide-react";
import { Avatar, EmptyState } from "@/components/ui";
import { messagesService } from "@/services/messages.service";
import { formatTime } from "@/utils/format";
import TypingIndicator from "./TypingIndicator";

const EMOJIS = ["👍", "🙏", "✅", "📈", "💡", "🎯", "😊", "🚀"];

export default function ChatWindow({ conversation, onUpdated }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    setMessages(conversation?.messages || []);
  }, [conversation]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState title="Select a conversation" description="Choose a client from the list to view your messages." />
      </div>
    );
  }

  async function send() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    setShowEmoji(false);
    const optimistic = { id: `tmp_${Date.now()}`, from: "advisor", text, at: new Date().toISOString(), read: true };
    setMessages((m) => [...m, optimistic]);

    await messagesService.send(conversation.id, text);
    setTyping(true);
    const reply = await messagesService.simulateReply(conversation.id);
    setTyping(false);
    if (reply) setMessages((m) => [...m, reply]);
    onUpdated?.();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <Avatar name={conversation.clientName} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{conversation.clientName}</p>
          <p className="text-xs" style={{ color: "var(--success)" }}>Online</p>
        </div>
        <button className="p-2 rounded-lg" style={{ color: "var(--muted)" }} aria-label="Call"><Phone size={16} /></button>
        <button className="p-2 rounded-lg" style={{ color: "var(--muted)" }} aria-label="Video"><Video size={16} /></button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const mine = m.from === "advisor";
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
                    className="px-3 py-2 rounded-2xl text-sm"
                    style={{
                      background: mine ? "var(--primary)" : "var(--surface-hover)",
                      color: mine ? "#fff" : "var(--foreground)",
                      borderBottomRightRadius: mine ? 4 : 16,
                      borderBottomLeftRadius: mine ? 16 : 4,
                    }}
                  >
                    {m.text}
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
        <div className="flex items-center gap-2 rounded-xl px-2 py-1.5" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
          <button className="p-1.5 rounded-lg" style={{ color: "var(--muted)" }} aria-label="Attach"><Paperclip size={17} /></button>
          <button onClick={() => setShowEmoji((s) => !s)} className="p-1.5 rounded-lg" style={{ color: "var(--muted)" }} aria-label="Emoji"><Smile size={17} /></button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
            placeholder="Type a message…"
            className="flex-1 bg-transparent outline-none text-sm py-1.5"
            style={{ color: "var(--foreground)" }}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={send}
            disabled={!draft.trim()}
            className="flex items-center justify-center w-9 h-9 rounded-lg disabled:opacity-40"
            style={{ background: "var(--primary)", color: "#fff" }}
            aria-label="Send"
          >
            <Send size={16} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
