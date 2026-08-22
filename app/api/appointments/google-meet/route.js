import { db } from "@/lib/db/database";
import { getCurrentUser } from "@/lib/auth/session";
import { ok, fail, created } from "@/lib/api/response";
import { googleCalendar } from "@/lib/google/googleCalendar";
import { randomUUID } from "node:crypto";

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    let body;
    try {
      body = await request.json();
    } catch {
      return fail("Invalid JSON body", 400);
    }

    const { clientId, title = "Financial Planning Consultation", description = "", startTime, endTime, duration } = body || {};

    if (!clientId) return fail("Missing clientId", 400);
    if (!startTime) return fail("Missing startTime", 400);

    const client = await db.findOne("clients", { id: clientId });
    if (!client) return fail("Client not found", 404);

    const advisorId = user?.id || "7bdc421d-4a2f-43cb-8961-61a5a1451260";
    const advisorName = user?.full_name || user?.name || "Rahul Deshmukh";

    // Retrieve advisor's Google token record for email and verification
    const tokenRecord = await db.findOne("google_oauth_tokens", { user_id: advisorId });
    const advisorEmail = user?.email || tokenRecord?.google_email || "";

    // Compute end time if not provided
    const start = new Date(startTime);
    let end = endTime ? new Date(endTime) : new Date(start.getTime() + (duration || 45) * 60 * 1000);

    if (end <= start) {
      end = new Date(start.getTime() + 45 * 60 * 1000);
    }

    const durationMinutes = Math.round((end.getTime() - start.getTime()) / (60 * 1000));

    // 1. Create Google Calendar Event with REAL Google Meet conference
    const gResult = await googleCalendar.createGoogleMeetEvent({
      advisorId,
      advisorName,
      advisorEmail,
      client,
      title,
      description,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });

    if (!gResult?.googleMeetUrl || !gResult.googleMeetUrl.startsWith("https://meet.google.com/")) {
      return fail("Google Meet conference URL was not generated. Please reconnect your Google Calendar and try again.", 400);
    }

    const appointmentId = `apt_${randomUUID().slice(0, 10)}`;

    // 2. Save appointment in PostgreSQL appointments table with authentic Google Meet URL
    const appointment = await db.insert("appointments", {
      id: appointmentId,
      advisor_id: advisorId,
      client_id: client.id,
      client_name: client.name,
      title,
      description,
      type: "video",
      start: start.toISOString(),
      end_time: end.toISOString(),
      duration: durationMinutes,
      status: "upcoming",
      notes: description,
      google_event_id: gResult.googleEventId,
      google_meet_url: gResult.googleMeetUrl,
    });

    // 3. Post a meeting invite message to the client's conversation channel
    try {
      const conv = await db.findOne("conversations", { client_id: client.id });
      if (conv) {
        const messages = typeof conv.messages === "string" ? JSON.parse(conv.messages) : conv.messages || [];
        const dateStr = start.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
        const timeStr = start.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

        const inviteMsg = {
          id: `msg_meet_${randomUUID().slice(0, 8)}`,
          from: "advisor",
          text: `📅 Scheduled Google Meet: "${title}" on ${dateStr} at ${timeStr}.\nJoin Google Meet: ${gResult.googleMeetUrl}`,
          meetingUrl: gResult.googleMeetUrl,
          at: new Date().toISOString(),
          read: true,
        };
        messages.push(inviteMsg);
        await db.update("conversations", { id: conv.id }, {
          messages,
          last_message: `Google Meet: ${title} (${dateStr} ${timeStr})`,
          last_at: inviteMsg.at,
        });
      }
    } catch (err) {
      console.warn("[Append Meeting Message Error]:", err.message);
    }

    return created({
      appointment,
      googleMeetUrl: gResult.googleMeetUrl,
      googleEventId: gResult.googleEventId,
    });
  } catch (err) {
    console.error("[Schedule Google Meet Error]:", err.message);
    return fail(err.message || "Failed to schedule Google Meet", 400);
  }
}
