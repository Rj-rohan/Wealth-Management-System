"use client";
import { useState, useEffect, useRef, use } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  PhoneOff,
  Video,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Target,
  FileText,
  UserCheck,
  Radio,
} from "lucide-react";
import { Avatar, Badge, Button, Card, CardHeader } from "@/components/ui";
import { webrtcService } from "@/services/webrtc.service";
import IncomingCallModal from "@/components/calls/IncomingCallModal";

const CLIENTS = [
  { id: "c_amit_shah", name: "Amit Shah", riskScore: 82, profile: "Aggressive", netWorth: "₹1,24,50,000" },
  { id: "c_rahul_kulkarni", name: "Rahul Kulkarni", riskScore: 65, profile: "Moderate", netWorth: "₹78,20,000" },
  { id: "c_priya_patil", name: "Priya Patil", riskScore: 50, profile: "Moderate", netWorth: "₹92,40,000" },
];

export default function ClientPortalPage() {
  const searchParams = useSearchParams();
  const initialClientId = searchParams?.get("clientId") || "c_amit_shah";

  const [selectedClientId, setSelectedClientId] = useState(initialClientId);
  const [incomingCall, setIncomingCall] = useState(null);

  // In-call states
  const [inCall, setInCall] = useState(false);
  const [callMode, setCallMode] = useState("voice");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  const currentClient = CLIENTS.find((c) => c.id === selectedClientId) || CLIENTS[0];

  // Connect client to real-time WebRTC signaling stream
  useEffect(() => {
    if (!selectedClientId) return;

    webrtcService.connectSignaling(selectedClientId);

    // Listen for incoming call invites from advisor
    const unsubInvite = webrtcService.on("incoming-call", (data) => {
      console.log("[Client Portal] Incoming call invite:", data);
      setIncomingCall(data);
    });

    // Listen for advisor hangup
    const unsubHangup = webrtcService.on("call-hangup", () => {
      console.log("[Client Portal] Call hung up by advisor");
      setInCall(false);
      setIncomingCall(null);
      cleanupAudioAnalyser();
    });

    const unsubRemoteStream = webrtcService.on("remote-stream", (stream) => {
      console.log("[Client Portal] Remote stream received from advisor:", stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      setupAudioAnalyser(stream);
    });

    return () => {
      unsubInvite();
      unsubHangup();
      unsubRemoteStream();
      cleanupAudioAnalyser();
    };
  }, [selectedClientId]);

  // Duration Timer when in Call
  useEffect(() => {
    if (!inCall) {
      setCallDuration(0);
      return;
    }
    const interval = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [inCall]);

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

  async function handleAcceptCall(callData) {
    setIncomingCall(null);
    setCallMode(callData.callType || "voice");
    setInCall(true);

    try {
      const { localStream } = await webrtcService.acceptCall({
        callId: callData.callId,
        clientId: selectedClientId,
        advisorId: callData.from,
        offerSdp: callData.sdp,
        callType: callData.callType || "voice",
      });

      if (callData.callType === "video" && localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
      }

      setupAudioAnalyser(localStream);
    } catch (err) {
      console.error("[Client Accept Call Error]:", err);
      setInCall(false);
      alert(`Microphone error: ${err.message}`);
    }
  }

  async function handleRejectCall(callData) {
    setIncomingCall(null);
    await webrtcService.rejectCall(callData.callId, callData.from, "declined_by_client");
  }

  async function handleEndCall() {
    const finalSec = callDuration;
    setInCall(false);
    cleanupAudioAnalyser();

    // Call advisor ID (Rahul Deshmukh)
    await webrtcService.endCall("7bdc421d-4a2f-43cb-8961-61a5a1451260", finalSec);
  }

  function handleToggleMute() {
    const muted = webrtcService.toggleMute();
    setIsMuted(muted);
  }

  function handleToggleSpeaker() {
    setIsSpeakerOn((prev) => {
      const next = !prev;
      const audioEl = webrtcService.remoteAudioElement;
      if (audioEl) audioEl.muted = !next;
      return next;
    });
  }

  function formatDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0e1624] border border-slate-800">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white">Client Portal • Live Voice Receiver</h1>
                <Badge tone="success">WebRTC Ready</Badge>
              </div>
              <p className="text-xs text-slate-400">
                Log in as any client to test real-time WebRTC calls with Advisor Rahul Deshmukh
              </p>
            </div>
          </div>

          {/* Client Persona Selector */}
          <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {CLIENTS.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedClientId(c.id);
                  setInCall(false);
                  setIncomingCall(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedClientId === c.id
                    ? "bg-emerald-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Live Listening Status Banner */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <p className="text-xs font-semibold text-emerald-400">
                Connected as {currentClient.name} ({currentClient.id})
              </p>
              <p className="text-[11px] text-slate-400">
                Signaling stream active. Waiting for advisor to click Voice/Video Call in Browser 1.
              </p>
            </div>
          </div>
          <div className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            Advisor: Rahul Deshmukh
          </div>
        </div>

        {/* Active In-Call Screen Overlay (when connected) */}
        {inCall && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-3xl p-8 bg-[#0b121c] border-2 border-emerald-500 shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-6">
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500 text-slate-950 font-bold">
                <Radio size={14} />
              </span>
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                Active WebRTC Audio Call with Rahul Deshmukh
              </span>
            </div>

            {/* Pulsing Avatar Visualizer */}
            <div className="relative mb-6">
              <motion.div
                animate={{ scale: [1, 1 + audioLevel * 0.25, 1] }}
                transition={{ repeat: Infinity, duration: 0.3 }}
                className="p-2 rounded-full bg-emerald-500/20"
              >
                <Avatar name="Rahul Deshmukh" size="xl" />
              </motion.div>
            </div>

            <h2 className="text-2xl font-bold text-white">Rahul Deshmukh (Advisor)</h2>
            <p className="text-emerald-400 font-mono font-semibold text-sm mt-1">
              Connected • {formatDuration(callDuration)}
            </p>

            {/* Dynamic Waveform Visualizer */}
            <div className="flex items-center gap-1.5 h-8 my-6">
              {[16, 32, 22, 40, 18, 34, 16, 28, 36, 20, 30, 24].map((h, i) => (
                <motion.span
                  key={i}
                  animate={{ height: [8, Math.max(8, h * (0.3 + audioLevel * 0.9)), 8] }}
                  transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.04 }}
                  className="w-1.5 rounded-full bg-emerald-500"
                />
              ))}
            </div>

            {/* Call Controls */}
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={handleToggleMute}
                className={`p-3.5 rounded-full text-white transition-transform active:scale-95 ${
                  isMuted ? "bg-red-500" : "bg-slate-800 hover:bg-slate-700"
                }`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <button
                onClick={handleToggleSpeaker}
                className={`p-3.5 rounded-full text-white transition-transform active:scale-95 ${
                  isSpeakerOn ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-900"
                }`}
                title={isSpeakerOn ? "Speaker Off" : "Speaker On"}
              >
                {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>

              <button
                onClick={handleEndCall}
                className="px-6 py-3.5 rounded-full bg-red-600 text-white font-semibold flex items-center gap-2 shadow-lg hover:bg-red-700 transition-transform active:scale-95"
              >
                <PhoneOff size={20} />
                <span>End Call</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Client Profile Snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <Avatar name={currentClient.name} size="lg" />
              <div>
                <p className="text-sm font-semibold text-white">{currentClient.name}</p>
                <Badge tone="info">{currentClient.profile} Risk ({currentClient.riskScore}/100)</Badge>
              </div>
            </div>
          </Card>

          <Card>
            <p className="text-xs text-slate-400">Total Net Worth</p>
            <p className="text-xl font-bold text-white mt-1">{currentClient.netWorth}</p>
            <p className="text-[11px] text-emerald-400 mt-0.5">Tracked by Wealth Management System</p>
          </Card>

          <Card>
            <p className="text-xs text-slate-400">Dedicated Wealth Advisor</p>
            <p className="text-sm font-bold text-white mt-1">Rahul Deshmukh, CFP</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Available for Voice & Video consultations</p>
          </Card>
        </div>

        {/* Upcoming Google Meet Consultations Section */}
        <div className="p-6 rounded-3xl bg-[#0c131d] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400">
                <Video size={17} />
              </span>
              <div>
                <h3 className="text-base font-bold text-white">Upcoming Google Meet Consultations</h3>
                <p className="text-xs text-slate-400">Scheduled video meetings with Advisor Rahul Deshmukh</p>
              </div>
            </div>
          </div>

          <UpcomingClientMeetings clientId={selectedClientId} />
        </div>

        {/* Incoming Call Ringing Modal */}
        <IncomingCallModal
          call={incomingCall}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      </div>
    </div>
  );
}

function UpcomingClientMeetings({ clientId }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/appointments?scope=upcoming`)
      .then((r) => r.json())
      .then((d) => {
        const clientMeetings = (d?.data || []).filter((m) => m.client_id === clientId || m.clientId === clientId);
        setMeetings(clientMeetings);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [clientId]);

  if (loading) {
    return <div className="h-20 rounded-2xl bg-slate-900/50 animate-pulse" />;
  }

  if (meetings.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center">
        <p className="text-sm font-medium text-slate-300">No upcoming meetings scheduled yet</p>
        <p className="text-xs text-slate-500 mt-1">Advisor Rahul Deshmukh will schedule your next consultation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {meetings.map((m) => {
        const startDate = new Date(m.start);
        const dateStr = startDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
        const rawMeetUrl = m.google_meet_url || m.googleMeetUrl;
        const isValidMeetUrl = Boolean(
          rawMeetUrl &&
          typeof rawMeetUrl === "string" &&
          rawMeetUrl.startsWith("https://meet.google.com/") &&
          rawMeetUrl.replace("https://meet.google.com/", "").trim().length >= 3
        );

        return (
          <div
            key={m.id}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">{m.title}</h4>
                <Badge tone="success">Upcoming</Badge>
              </div>
              <p className="text-xs text-slate-400">Advisor: <span className="text-white font-medium">Rahul Deshmukh</span></p>
              <p className="text-xs text-emerald-400 font-medium">📅 {dateStr} at {timeStr} ({m.duration || 45} mins)</p>
              {m.notes && <p className="text-xs text-slate-400 italic mt-0.5">"{m.notes}"</p>}
            </div>

            {isValidMeetUrl ? (
              <a
                href={rawMeetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all shadow-md flex-shrink-0"
              >
                <Video size={15} />
                <span>Join Google Meet</span>
              </a>
            ) : (
              <span className="text-xs text-amber-400/90 font-medium">
                Google Meet link is not available. Please recreate the meeting.
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
