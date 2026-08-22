import { googleAuth } from "./googleAuth.js";
import { randomUUID } from "node:crypto";

export const googleCalendar = {
  /**
   * Create an authentic Google Calendar Event with Google Meet conference.
   * Uses ONLY the real Google Meet URL returned by Google's Calendar Conference API.
   */
  async createGoogleMeetEvent({
    advisorId,
    advisorName = "Rahul Deshmukh",
    advisorEmail = "",
    client,
    title = "Financial Planning Consultation",
    description = "",
    startTime,
    endTime,
  }) {
    // 1. Log advisor ID
    console.log(`[Google Meet] Step 1: Advisor ID: ${advisorId}`);

    // 2 & 3. Retrieve and validate Google OAuth token
    const accessToken = await googleAuth.getValidAccessToken(advisorId);

    if (!accessToken) {
      console.warn(`[Google Meet] Step 2: Google connection exists: false`);
      const err = new Error("Google Calendar is not connected. Please connect your Google Calendar in Settings.");
      err.code = "GOOGLE_CALENDAR_NOT_CONNECTED";
      throw err;
    }

    console.log(`[Google Meet] Step 2: Google connection exists: true`);
    console.log(`[Google Meet] Step 3: Token valid/refreshed: true`);

    // Build attendees array (advisor + client)
    const attendees = [];
    if (advisorEmail && advisorEmail.includes("@")) {
      attendees.push({ email: advisorEmail, displayName: advisorName });
    }
    if (client.email && client.email.includes("@")) {
      attendees.push({ email: client.email, displayName: client.name });
    }

    // 4. Start Google Calendar API request
    const url = "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1";
    const body = {
      summary: `${title} — ${client.name} & ${advisorName}`,
      description: description
        ? `Client: ${client.name}\nAdvisor: ${advisorName}\n\nAgenda:\n${description}`
        : `Personal Wealth Consultation between ${client.name} and Advisor ${advisorName}.`,
      start: {
        dateTime: new Date(startTime).toISOString(),
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: new Date(endTime).toISOString(),
        timeZone: "Asia/Kolkata",
      },
      attendees,
      conferenceData: {
        createRequest: {
          requestId: randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 },
          { method: "popup", minutes: 10 },
        ],
      },
    };

    console.log(`[Google Meet] Step 4: Calendar API request started for "${body.summary}" (Timezone: Asia/Kolkata)`);

    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch (fetchErr) {
      console.error("[Google Meet] Network error contacting Google API:", fetchErr.message);
      throw new Error("Network error connecting to Google Calendar API. Please check your connection.");
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Google Meet] Calendar API error (${res.status}):`, errText);
      if (res.status === 401 || res.status === 403) {
        throw new Error("Your Google Calendar connection has expired. Please reconnect your Google account in Settings.");
      }
      throw new Error(`Google Calendar API error (${res.status}). Please try again.`);
    }

    const data = await res.json();

    // 5. Log Calendar event creation
    console.log(`[Google Meet] Step 5: Calendar event created with ID: ${data.id}`);

    // 6. Extract conference info
    const googleMeetUrl =
      data.hangoutLink ||
      data.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === "video")?.uri;

    console.log(`[Google Meet] Step 6: Conference creation response received:`, {
      hasHangoutLink: Boolean(data.hangoutLink),
      entryPointsCount: data.conferenceData?.entryPoints?.length || 0,
    });

    if (!googleMeetUrl || !googleMeetUrl.startsWith("https://meet.google.com/")) {
      console.error("[Google Meet] Missing Meet URL in response:", JSON.stringify(data, null, 2));
      throw new Error("Google Calendar event was created, but Google Meet conference URL was not returned by Google. Please reconnect Google Calendar and try again.");
    }

    // 7. Log successful Meet URL acquisition
    console.log(`[Google Meet] Step 7: Meet URL successfully obtained: ${googleMeetUrl}`);

    return {
      googleEventId: data.id,
      googleMeetUrl,
      htmlLink: data.htmlLink || googleMeetUrl,
      status: "confirmed",
    };
  },
};
