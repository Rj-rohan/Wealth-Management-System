"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sparkles,
  ShieldCheck,
  User,
} from "lucide-react";
import { Avatar } from "@/components/ui";

export default function WhatsAppCallModal({ isOpen, mode = "video", clientName = "Client", onClose, onCallEnded }) {
  const [callStatus, setCallStatus] = useState("calling"); // 'calling' | 'connected' | 'ended'
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const localVideoRef = useRef(null);
  const streamRef = useRef(null);

  // Call connection simulation
  useEffect(() => {
    if (!isOpen) {
      setDuration(0);
      setCallStatus("calling");
      return;
    }

    setCallStatus("calling");
    const connectTimer = setTimeout(() => {
      setCallStatus("connected");
    }, 2200);

    return () => clearTimeout(connectTimer);
  }, [isOpen]);

  // Duration timer when connected
  useEffect(() => {
    if (callStatus !== "connected") return;
    const interval = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  // Local camera stream initialization for video calls
  useEffect(() => {
    if (!isOpen || mode !== "video") return;

    let active = true;
    async function startCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          if (active && localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            streamRef.current = stream;
          }
        }
      } catch (err) {
        console.log("Local camera preview using animated fallback:", err.message);
      }
    }

    startCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, mode]);

  function formatDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function handleEndCall() {
    setCallStatus("ended");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    const finalSec = duration;
    setTimeout(() => {
      onCallEnded?.(mode, finalSec);
      onClose();
    }, 500);
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(5, 8, 15, 0.88)", backdropFilter: "blur(16px)" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className={`relative rounded-3xl overflow-hidden flex flex-col shadow-2xl transition-all duration-300 ${
            isFullscreen ? "w-full h-full" : "w-full max-w-2xl h-[520px]"
          }`}
          style={{ background: "#0c131d", border: "1px solid var(--border-strong)" }}
        >
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-md" style={{ background: "var(--primary)", color: "#061009" }}>
                <ShieldCheck size={14} />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#fff" }}>
                WhatsApp End-to-End Encrypted • {mode === "video" ? "Video Call" : "Voice Call"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullscreen((f) => !f)}
                className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>

          {/* Call Body Area */}
          <div className="relative flex-1 flex flex-col items-center justify-center p-6 text-center">
            {mode === "video" ? (
              <>
                {/* Remote Participant (Client) Video Mock Stream */}
                <div className="absolute inset-0 overflow-hidden flex items-center justify-center" style={{ background: "linear-gradient(135deg, #111a28 0%, #080f18 100%)" }}>
                  <div className="relative flex flex-col items-center justify-center space-y-4">
                    <div className="relative">
                      <Avatar name={clientName} size="xl" />
                      {callStatus === "connected" && (
                        <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-[#0c131d]" style={{ background: "var(--primary)" }} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{clientName}</h3>
                      <p className="text-sm font-medium mt-1" style={{ color: callStatus === "connected" ? "var(--primary)" : "var(--warning)" }}>
                        {callStatus === "calling" ? "Ringing..." : formatDuration(duration)}
                      </p>
                    </div>
                    {callStatus === "connected" && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs" style={{ background: "rgba(22, 217, 106, 0.15)", color: "var(--primary)", border: "1px solid rgba(22, 217, 106, 0.3)" }}>
                        <Sparkles size={12} />
                        <span>HD Video Connected</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Local Advisor Camera (Picture-in-Picture) */}
                <div
                  className="absolute bottom-24 right-4 z-20 w-32 h-44 rounded-2xl overflow-hidden shadow-2xl border-2"
                  style={{ borderColor: "rgba(255,255,255,0.2)", background: "#1a2433" }}
                >
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isVideoOff ? "hidden" : "block"}`}
                  />
                  {isVideoOff && (
                    <div className="flex flex-col items-center justify-center h-full text-white/60 text-xs gap-1">
                      <VideoOff size={20} />
                      <span>Camera Off</span>
                    </div>
                  )}
                  <span className="absolute bottom-1.5 left-2 text-[10px] font-semibold text-white/90 bg-black/60 px-1.5 py-0.5 rounded">
                    You
                  </span>
                </div>
              </>
            ) : (
              /* Voice Call Screen */
              <div className="flex flex-col items-center space-y-5">
                <motion.div
                  animate={callStatus === "calling" ? { scale: [1, 1.08, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1.6 }}
                  className="relative p-1 rounded-full"
                  style={{ background: "linear-gradient(135deg, var(--primary) 0%, rgba(22,217,106,0.3) 100%)" }}
                >
                  <Avatar name={clientName} size="xl" />
                </motion.div>

                <div>
                  <h3 className="text-2xl font-bold text-white">{clientName}</h3>
                  <p className="text-sm font-medium mt-1" style={{ color: callStatus === "connected" ? "var(--primary)" : "var(--warning)" }}>
                    {callStatus === "calling" ? "Ringing..." : `Connected • ${formatDuration(duration)}`}
                  </p>
                </div>

                {callStatus === "connected" && (
                  <div className="flex items-center gap-1 h-6">
                    {[12, 24, 16, 28, 14, 22, 10, 26, 18, 20].map((h, i) => (
                      <motion.span
                        key={i}
                        animate={{ height: [8, h, 8] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.08 }}
                        className="w-1 rounded-full"
                        style={{ background: "var(--primary)" }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Action Controls Bar */}
          <div className="p-4 flex items-center justify-center gap-4 bg-gradient-to-t from-black/90 to-transparent z-20">
            {/* Mic Toggle */}
            <button
              onClick={() => setIsMuted((m) => !m)}
              className="p-3.5 rounded-full transition-transform active:scale-95 text-white"
              style={{ background: isMuted ? "var(--danger)" : "rgba(255,255,255,0.15)" }}
              aria-label={isMuted ? "Unmute" : "Mute"}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {/* Video Camera Toggle (for video calls) */}
            {mode === "video" && (
              <button
                onClick={() => setIsVideoOff((v) => !v)}
                className="p-3.5 rounded-full transition-transform active:scale-95 text-white"
                style={{ background: isVideoOff ? "var(--danger)" : "rgba(255,255,255,0.15)" }}
                aria-label={isVideoOff ? "Turn Video On" : "Turn Video Off"}
                title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
              >
                {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
              </button>
            )}

            {/* Speaker Toggle */}
            <button
              onClick={() => setIsSpeakerOn((s) => !s)}
              className="p-3.5 rounded-full transition-transform active:scale-95 text-white"
              style={{ background: isSpeakerOn ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)" }}
              aria-label={isSpeakerOn ? "Speaker Off" : "Speaker On"}
              title={isSpeakerOn ? "Speaker Off" : "Speaker On"}
            >
              {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              className="px-6 py-3.5 rounded-full font-semibold flex items-center gap-2 text-white transition-transform active:scale-95 shadow-lg"
              style={{ background: "var(--danger)" }}
              aria-label="End Call"
            >
              <PhoneOff size={20} />
              <span>End Call</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
