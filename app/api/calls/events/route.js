import { signalingHub } from "@/lib/webrtc/signalingHub";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return new Response("Missing userId", { status: 400 });
  }

  let cleanup = null;
  let heartbeatInterval = null;

  const stream = new ReadableStream({
    start(controller) {
      // Subscribe to signaling hub
      cleanup = signalingHub.subscribe(userId, controller);

      // Send initial connected event
      const initPayload = `data: ${JSON.stringify({ type: "ready", userId, timestamp: new Date().toISOString() })}\n\n`;
      controller.enqueue(new TextEncoder().encode(initPayload));

      // Periodic ping/heartbeat to keep connection alive through proxies
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`: ping\n\n`));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 15000);
    },
    cancel() {
      if (cleanup) cleanup();
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
