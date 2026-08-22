/**
 * In-memory Real-time Signaling Relay Hub
 * Manages active subscribers (clients & advisors) and routes WebRTC signals.
 */

// Global subscribers map: userId -> Set of SSE controller callbacks
const subscribers = new Map();

// Pending signal queue if receiver connects slightly after
const pendingSignals = new Map();

export const signalingHub = {
  /**
   * Register a subscriber SSE stream
   */
  subscribe(userId, controller) {
    if (!userId || !controller) return () => {};

    if (!subscribers.has(userId)) {
      subscribers.set(userId, new Set());
    }
    const userSet = subscribers.get(userId);
    userSet.add(controller);

    // Flush any pending signals for this user
    if (pendingSignals.has(userId)) {
      const queue = pendingSignals.get(userId);
      queue.forEach((sig) => {
        try {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(sig)}\n\n`));
        } catch (e) {
          console.warn("[Signaling Flush Error]:", e.message);
        }
      });
      pendingSignals.delete(userId);
    }

    return () => {
      userSet.delete(controller);
      if (userSet.size === 0) {
        subscribers.delete(userId);
      }
    };
  },

  /**
   * Broadcast a signal packet to a specific target user (or all their open tabs)
   */
  dispatch(targetUserId, signal) {
    if (!targetUserId) return false;

    const userSet = subscribers.get(targetUserId);
    if (!userSet || userSet.size === 0) {
      // Queue for short delivery window (15s)
      if (!pendingSignals.has(targetUserId)) {
        pendingSignals.set(targetUserId, []);
      }
      const queue = pendingSignals.get(targetUserId);
      queue.push(signal);
      setTimeout(() => {
        const q = pendingSignals.get(targetUserId);
        if (q) {
          const idx = q.indexOf(signal);
          if (idx !== -1) q.splice(idx, 1);
        }
      }, 15000);
      return false;
    }

    const payload = `data: ${JSON.stringify(signal)}\n\n`;
    const encoded = new TextEncoder().encode(payload);

    let delivered = false;
    for (const controller of userSet) {
      try {
        controller.enqueue(encoded);
        delivered = true;
      } catch (err) {
        console.warn(`[Signaling Delivery Failed to user ${targetUserId}]:`, err.message);
      }
    }

    return delivered;
  },

  /**
   * Broadcast to multiple users or everyone
   */
  broadcast(signal) {
    const payload = `data: ${JSON.stringify(signal)}\n\n`;
    const encoded = new TextEncoder().encode(payload);

    for (const userSet of subscribers.values()) {
      for (const controller of userSet) {
        try {
          controller.enqueue(encoded);
        } catch {}
      }
    }
  },

  getActiveUsers() {
    return Array.from(subscribers.keys());
  },
};
