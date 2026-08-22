"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video, Sparkles, Shield } from "lucide-react";
import { Avatar } from "@/components/ui";

export default function IncomingCallModal({ call, onAccept, onReject }) {
  const audioContextRef = useRef(null);

  // Gentle ringing chime via Web Audio API
  useEffect(() => {
    if (!call) return;

    let isPlaying = true;
    let timeoutId = null;

    function playRingtone() {
      if (!isPlaying) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = "sine";
        osc2.type = "sine";
        osc1.frequency.setValueAtTime(440, ctx.currentTime);
        osc2.frequency.setValueAtTime(480, ctx.currentTime);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 1.2);
        osc2.stop(ctx.currentTime + 1.2);

        timeoutId = setTimeout(() => {
          if (isPlaying) playRingtone();
        }, 2500);
      } catch (err) {
        console.log("AudioContext autoplay notice:", err.message);
      }
    }

    playRingtone();

    return () => {
      isPlaying = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch {}
      }
    };
  }, [call]);

  if (!call) return null;

  const callerName = call.advisorName || "Rahul Deshmukh (Advisor)";
  const isVideo = call.callType === "video";

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(5, 8, 15, 0.85)", backdropFilter: "blur(14px)" }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center overflow-hidden"
          style={{ background: "#0c131d", border: "1px solid var(--primary)" }}
        >
          {/* Top Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-6" style={{ background: "rgba(22, 217, 106, 0.15)", color: "var(--primary)" }}>
            <Shield size={12} />
            <span>Incoming WhatsApp {isVideo ? "Video" : "Voice"} Call</span>
          </div>

          {/* Caller Avatar with Pulsing Ring */}
          <div className="relative mb-5">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="absolute inset-0 rounded-full"
              style={{ background: "var(--primary)" }}
            />
            <motion.div
              animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.8, delay: 0.2 }}
              className="absolute inset-0 rounded-full"
              style={{ background: "var(--primary)" }}
            />
            <div className="relative p-1 rounded-full bg-[#0c131d]">
              <Avatar name={callerName} size="xl" />
            </div>
          </div>

          {/* Caller Details */}
          <h3 className="text-xl font-bold text-white">{callerName}</h3>
          <p className="text-sm font-medium mt-1 text-white/70">
            {isVideo ? "WhatsApp Video Calling..." : "WhatsApp Voice Calling..."}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-8 mt-8 w-full">
            {/* Reject Button */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => onReject(call)}
                className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-transform active:scale-95 shadow-xl hover:opacity-90"
                style={{ background: "var(--danger)" }}
                aria-label="Decline"
                title="Decline Call"
              >
                <PhoneOff size={24} />
              </button>
              <span className="text-xs text-white/70">Decline</span>
            </div>

            {/* Accept Button */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => onAccept(call)}
                className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-transform active:scale-95 shadow-xl hover:opacity-90 animate-bounce"
                style={{ background: "var(--primary)", color: "#061009" }}
                aria-label="Accept"
                title="Accept Call"
              >
                {isVideo ? <Video size={24} /> : <Phone size={24} />}
              </button>
              <span className="text-xs text-white/90 font-semibold">Accept</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
