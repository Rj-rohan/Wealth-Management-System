"use client";

// WebRTC ICE Servers Configuration (Google STUN + Optional TURN)
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
];

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_TURN_SERVER_URL) {
  ICE_SERVERS.push({
    urls: process.env.NEXT_PUBLIC_TURN_SERVER_URL,
    username: process.env.NEXT_PUBLIC_TURN_USERNAME || "",
    credential: process.env.NEXT_PUBLIC_TURN_PASSWORD || "",
  });
}

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.remoteAudioElement = null;
    this.eventSource = null;
    this.currentCallId = null;
    this.activeUserId = null;
    this.listeners = new Map();
  }

  /**
   * Subscribe to real-time events from the signaling SSE endpoint
   */
  connectSignaling(userId) {
    if (typeof window === "undefined" || !userId) return;
    if (this.eventSource && this.activeUserId === userId) return;

    this.disconnectSignaling();
    this.activeUserId = userId;

    const url = `/api/calls/events?userId=${encodeURIComponent(userId)}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit("signal", data);

        if (data.type === "call-invite") this.emit("incoming-call", data);
        if (data.type === "call-accept") this.emit("call-accepted", data);
        if (data.type === "call-reject") this.emit("call-rejected", data);
        if (data.type === "call-hangup") this.emit("call-hangup", data);
        if (data.type === "ice-candidate") this.handleRemoteIceCandidate(data.candidate);
        if (data.type === "offer") this.handleRemoteOffer(data);
        if (data.type === "answer") this.handleRemoteAnswer(data);
      } catch (err) {
        console.warn("[Signaling Message Parse Error]:", err);
      }
    };

    this.eventSource.onerror = () => {
      console.warn("[Signaling SSE reconnecting for user]:", userId);
    };
  }

  disconnectSignaling() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.activeUserId = null;
  }

  /**
   * Post signal packet to the target peer
   */
  async sendSignal(payload) {
    try {
      const res = await fetch("/api/calls/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err) {
      console.error("[sendSignal error]:", err);
    }
  }

  /**
   * Initialize Local Media Stream (Microphone / Camera)
   */
  async getLocalMedia({ video = false, audio = true } = {}) {
    if (this.localStream) return this.localStream;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audio
          ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : false,
        video: video ? { width: { ideal: 640 }, height: { ideal: 480 } } : false,
      });

      this.localStream = stream;
      return stream;
    } catch (err) {
      console.error("[getUserMedia error]:", err);
      throw new Error(`Microphone access error: ${err.message}`);
    }
  }

  /**
   * Ensure Remote Audio Output Element
   */
  getOrCreateRemoteAudioElement() {
    if (typeof window === "undefined") return null;
    if (!this.remoteAudioElement) {
      const audio = document.createElement("audio");
      audio.id = "webrtc-remote-audio";
      audio.autoplay = true;
      audio.playsInline = true;
      audio.style.display = "none";
      document.body.appendChild(audio);
      this.remoteAudioElement = audio;
    }
    return this.remoteAudioElement;
  }

  /**
   * Create and configure RTCPeerConnection
   */
  createPeerConnection(targetUserId, callId) {
    this.closePeerConnection();

    this.currentCallId = callId;
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.peerConnection = pc;

    // Attach local media tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream);
      });
    }

    // Remote track arrived
    pc.ontrack = (event) => {
      console.log("[WebRTC ontrack received]:", event.streams[0]);
      this.remoteStream = event.streams[0];
      const audioEl = this.getOrCreateRemoteAudioElement();
      if (audioEl) {
        audioEl.srcObject = event.streams[0];
        audioEl.play().catch((e) => console.log("Audio play error:", e));
      }
      this.emit("remote-stream", event.streams[0]);
    };

    // ICE Candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: "ice-candidate",
          callId: this.currentCallId,
          from: this.activeUserId,
          to: targetUserId,
          candidate: event.candidate,
        });
      }
    };

    // Connection state change listener
    pc.onconnectionstatechange = () => {
      console.log("[WebRTC Connection State]:", pc.connectionState);
      this.emit("connection-state", pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[WebRTC ICE State]:", pc.iceConnectionState);
      this.emit("ice-state", pc.iceConnectionState);
    };

    return pc;
  }

  /**
   * Start a Call as Caller (Advisor)
   */
  async startCall({ callId, advisorId, advisorName, clientId, callType = "voice" }) {
    this.currentCallId = callId;

    // 1. Get local microphone stream
    const isVideo = callType === "video";
    await this.getLocalMedia({ video: isVideo, audio: true });

    // 2. Create peer connection
    const pc = this.createPeerConnection(clientId, callId);

    // 3. Create SDP Offer
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: isVideo,
    });
    await pc.setLocalDescription(offer);

    // 4. Send call invite signal with SDP offer
    await this.sendSignal({
      type: "call-invite",
      callId,
      from: advisorId,
      advisorId,
      advisorName,
      to: clientId,
      sdp: offer,
      callType,
    });

    return { callId, localStream: this.localStream };
  }

  /**
   * Accept an incoming call as Callee (Client)
   */
  async acceptCall({ callId, clientId, advisorId, offerSdp, callType = "voice" }) {
    this.currentCallId = callId;

    // 1. Get local microphone stream
    const isVideo = callType === "video";
    await this.getLocalMedia({ video: isVideo, audio: true });

    // 2. Create peer connection
    const pc = this.createPeerConnection(advisorId, callId);

    // 3. Set remote offer description
    await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));

    // 4. Create and set SDP answer
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // 5. Send accept signal with SDP answer
    await this.sendSignal({
      type: "call-accept",
      callId,
      from: clientId,
      clientId,
      to: advisorId,
      sdp: answer,
    });

    return { callId, localStream: this.localStream };
  }

  /**
   * Handle Remote Answer (Caller received Answer from Callee)
   */
  async handleRemoteAnswer(data) {
    if (!this.peerConnection || !data.sdp) return;
    try {
      if (this.peerConnection.signalingState !== "stable") {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
      }
    } catch (err) {
      console.warn("[setRemoteDescription error]:", err);
    }
  }

  /**
   * Handle Remote Offer
   */
  async handleRemoteOffer(data) {
    if (!this.peerConnection || !data.sdp) return;
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
    } catch (err) {
      console.warn("[handleRemoteOffer error]:", err);
    }
  }

  /**
   * Handle Remote ICE Candidate
   */
  async handleRemoteIceCandidate(candidate) {
    if (!this.peerConnection || !candidate) return;
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn("[addIceCandidate error]:", err);
    }
  }

  /**
   * Toggle Microphone Mute
   */
  toggleMute() {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return !audioTrack.enabled; // returns isMuted
    }
    return false;
  }

  /**
   * Toggle Video Stream
   */
  toggleVideo() {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return !videoTrack.enabled; // returns isVideoOff
    }
    return false;
  }

  /**
   * End / Hangup Active Call
   */
  async endCall(targetUserId, duration = 0) {
    if (this.currentCallId && targetUserId) {
      await this.sendSignal({
        type: "call-hangup",
        callId: this.currentCallId,
        from: this.activeUserId,
        to: targetUserId,
        duration,
      });

      // Update call record status in database
      fetch(`/api/calls/${this.currentCallId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ended", duration }),
      }).catch(() => {});
    }

    this.closePeerConnection();
    this.currentCallId = null;
  }

  /**
   * Reject Incoming Call
   */
  async rejectCall(callId, targetUserId, reason = "rejected") {
    await this.sendSignal({
      type: "call-reject",
      callId,
      from: this.activeUserId,
      to: targetUserId,
      reason,
    });

    if (callId) {
      fetch(`/api/calls/${callId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", duration: 0 }),
      }).catch(() => {});
    }

    this.closePeerConnection();
  }

  /**
   * Clean up tracks and close peer connection
   */
  closePeerConnection() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    this.remoteStream = null;
    if (this.remoteAudioElement) {
      this.remoteAudioElement.srcObject = null;
    }
  }

  // Event emitter helpers
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`[WebRTC Listener Error on ${event}]:`, e);
        }
      });
    }
  }
}

// Global singleton instance
export const webrtcService = typeof window !== "undefined" ? new WebRTCService() : null;
