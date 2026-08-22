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
  AlertCircle,
} from "lucide-react";
import { Avatar } from "@/components/ui";
import { webrtcService } from "@/services/webrtc.service";

export default function WhatsAppCallModal({
  isOpen,
  mode = "voice",
  clientId,
  clientName = "Client",
  advisorId = "7bdc421d-4a2f-43cb-8961-61a5a1451260",
  advisorName = "Rahul Deshmukh",
  onClose,
  onCallEnded,
}) {
  // Call States: 'calling' | 'ringing' | 'connecting' | 'connected' | 'rejected' | 'ended' | 'failed'
  const [callStatus, setCallStatus] = useState("calling");
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const callIdRef = useRef(null);

  // Initialize and start WebRTC Call on Open
  useEffect(() => {
    if (!isOpen || !clientId) {
      setDuration(0);
      setCallStatus("calling");
      setErrorMessage("");
      return;
    }

    const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    callIdRef.current = callId;
    setCallStatus("calling");
    setDuration(0);

    // 1. Connect advisor to signaling stream
    webrtcService.connectSignaling(advisorId);

    // 2. Create call record in PostgreSQL
    fetch("/api/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: callId, clientId, callType: mode, advisorId }),
    }).catch((e) => console.log("DB call record error:", e));

    // 3. Initiate WebRTC peer connection and SDP offer
    webrtcService
      .startCall({
        callId,
        advisorId,
        advisorName,
        clientId,
        callType: mode,
      })
      .then(({ localStream }) => {
        // Set local video if video mode
        if (mode === "video" && localVideoRef.current && localStream) {
          localVideoRef.current.srcObject = localStream;
        }

        // Setup audio visualizer for speaking feedback
        setupAudioAnalyser(localStream);

        // Advance from calling to ringing
        setTimeout(() => {
          setCallStatus((curr) => (curr === "calling" ? "ringing" : curr));
        }, 1200);
      })
      .catch((err) => {
        console.error("[WebRTC startCall failed]:", err);
        setCallStatus("failed");
        setErrorMessage(err.message || "Could not access microphone.");
      });

    // 4. Signaling Event Listeners
    const unsubAccept = webrtcService.on("call-accepted", (data) => {
      console.log("[WebRTC] Callee accepted call:", data);
      setCallStatus("connecting");
    });

    const unsubReject = webrtcService.on("call-rejected", (data) => {
      console.log("[WebRTC] Callee rejected call:", data);
      setCallStatus("rejected");
      setTimeout(() => {
        handleEndCall();
      }, 2000);
    });

    const unsubHangup = webrtcService.on("call-hangup", (data) => {
      console.log("[WebRTC] Peer hung up call:", data);
      setCallStatus("ended");
      setTimeout(() => {
        onCallEnded?.(mode, duration);
        onClose();
      }, 1000);
    });

    const unsubConn = webrtcService.on("connection-state", (state) => {
      console.log("[WebRTC connection-state]:", state);
      if (state === "connected") {
        setCallStatus("connected");
      } else if (state === "failed" || state === "disconnected") {
        setCallStatus("failed");
        setErrorMessage("Connection lost.");
      }
    });

    const unsubRemoteStream = webrtcService.on("remote-stream", (stream) => {
      console.log("[WebRTC remote-stream attached]:", stream);
      if (mode === "video" && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      setupAudioAnalyser(stream);
    });

    return () => {
      unsubAccept();
      unsubReject();
      unsubHangup();
      unsubConn();
      unsubRemoteStream();
      cleanupAudioAnalyser();
    };
  }, [isOpen, clientId, mode]);

  // Duration Timer when Connected
  useEffect(() => {
    if (callStatus !== "connected") return;
    const interval = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  // Audio frequency analyser for real-time sound amplitude visualizer
  function setupAudioAnalyser(stream) {
    if (!stream) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      function checkLevel() {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(1, avg / 80));
        animFrameRef.current = requestAnimationFrame(checkLevel);
      }
      checkLevel();
    } catch (e) {
      console.log("Audio visualizer notice:", e.message);
    }
  }

  function cleanupAudioAnalyser() {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
    }
  }

  function formatDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function handleToggleMute() {
    const muted = webrtcService.toggleMute();
    setIsMuted(muted);
  }

  function handleToggleVideo() {
    const videoOff = webrtcService.toggleVideo();
    setIsVideoOff(videoOff);
  }

  function handleToggleSpeaker() {
    setIsSpeakerOn((prev) => {
      const next = !prev;
      const audioEl = webrtcService.remoteAudioElement;
      if (audioEl) audioEl.muted = !next;
      return next;
    });
  }

  async function handleEndCall() {
    const finalSec = duration;
    setCallStatus("ended");
    cleanupAudioAnalyser();

    await webrtcService.endCall(clientId, finalSec);

    setTimeout(() => {
      onCallEnded?.(mode, finalSec);
      onClose();
    }, 600);
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
            isFullscreen ? "w-full h-full" : "w-full max-w-2xl h-[530px]"
          }`}
          style={{ background: "#0c131d", border: "1px solid var(--border-strong)" }}
        >
          {/* Top Info Bar */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-md" style={{ background: "var(--primary)", color: "#061009" }}>
                <ShieldCheck size={14} />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-white">
                WebRTC Real-Time Audio • {mode === "video" ? "Video Call" : "Voice Call"}
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
                {/* Remote Participant Video Stream */}
                <div className="absolute inset-0 overflow-hidden flex items-center justify-center" style={{ background: "linear-gradient(135deg, #111a28 0%, #080f18 100%)" }}>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {callStatus !== "connected" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-black/60 backdrop-blur-sm">
                      <div className="relative">
                        <Avatar name={clientName} size="xl" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{clientName}</h3>
                        <p className="text-sm font-medium mt-1" style={{ color: callStatus === "rejected" ? "var(--danger)" : "var(--primary)" }}>
                          {callStatus === "calling" && "Calling..."}
                          {callStatus === "ringing" && "Ringing client's browser..."}
                          {callStatus === "connecting" && "Establishing WebRTC stream..."}
                          {callStatus === "rejected" && "Call Declined by client"}
                          {callStatus === "ended" && "Call Ended"}
                          {callStatus === "failed" && (errorMessage || "Connection failed")}
                        </p>
                      </div>
                    </div>
                  )}
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
                  animate={
                    callStatus === "connected"
                      ? { scale: [1, 1 + audioLevel * 0.15, 1] }
                      : { scale: [1, 1.08, 1] }
                  }
                  transition={{ repeat: Infinity, duration: callStatus === "connected" ? 0.4 : 1.6 }}
                  className="relative p-1 rounded-full"
                  style={{ background: "linear-gradient(135deg, var(--primary) 0%, rgba(22,217,106,0.3) 100%)" }}
                >
                  <Avatar name={clientName} size="xl" />
                </motion.div>

                <div>
                  <h3 className="text-2xl font-bold text-white">{clientName}</h3>
                  <p
                    className="text-sm font-semibold mt-1.5"
                    style={{
                      color:
                        callStatus === "connected"
                          ? "var(--primary)"
                          : callStatus === "rejected" || callStatus === "failed"
                          ? "var(--danger)"
                          : "var(--warning)",
                    }}
                  >
                    {callStatus === "calling" && "Calling..."}
                    {callStatus === "ringing" && "Ringing client's browser..."}
                    {callStatus === "connecting" && "Connecting WebRTC audio stream..."}
                    {callStatus === "connected" && `Connected • ${formatDuration(duration)}`}
                    {callStatus === "rejected" && "Call Declined by Client"}
                    {callStatus === "ended" && `Call Ended • ${formatDuration(duration)}`}
                    {callStatus === "failed" && (errorMessage || "Connection failed")}
                  </p>
                </div>

                {/* Real-time Dynamic Waveform visualizer */}
                {callStatus === "connected" && (
                  <div className="flex items-center gap-1.5 h-8">
                    {[14, 28, 20, 36, 18, 30, 16, 32, 22, 26, 18, 34].map((h, i) => (
                      <motion.span
                        key={i}
                        animate={{ height: [8, Math.max(8, h * (0.3 + audioLevel * 0.9)), 8] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.05 }}
                        className="w-1.5 rounded-full"
                        style={{ background: "var(--primary)" }}
                      />
                    ))}
                  </div>
                )}

                {callStatus === "failed" && errorMessage && (
                  <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg">
                    <AlertCircle size={14} />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Action Controls Bar */}
          <div className="p-4 flex items-center justify-center gap-4 bg-gradient-to-t from-black/90 to-transparent z-20">
            {/* Mic Toggle */}
            <button
              onClick={handleToggleMute}
              className="p-3.5 rounded-full transition-transform active:scale-95 text-white"
              style={{ background: isMuted ? "var(--danger)" : "rgba(255,255,255,0.15)" }}
              aria-label={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {/* Video Camera Toggle */}
            {mode === "video" && (
              <button
                onClick={handleToggleVideo}
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
              onClick={handleToggleSpeaker}
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
