import { db } from "../db/database.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/google/callback";

export const googleAuth = {
  /**
   * Check if Google OAuth credentials are configured in environment
   */
  isConfigured() {
    return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
  },

  /**
   * Generate Google OAuth 2.0 authorization URL
   */
  getAuthUrl(advisorId) {
    if (!GOOGLE_CLIENT_ID) {
      throw new Error(
        "Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local"
      );
    }

    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
      redirect_uri: GOOGLE_REDIRECT_URI,
      client_id: GOOGLE_CLIENT_ID,
      access_type: "offline",
      response_type: "code",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" "),
      state: advisorId,
    };

    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
  },

  /**
   * Exchange authorization code for access and refresh tokens
   */
  async exchangeCodeForTokens(code) {
    const url = "https://oauth2.googleapis.com/token";
    const values = {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(values),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Google OAuth Token Exchange Failed (${res.status}): ${errBody}`);
    }

    const tokenData = await res.json();

    // Optionally fetch authenticated user email from Google UserInfo
    let googleEmail = "";
    if (tokenData.access_token) {
      try {
        const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          googleEmail = userData.email || "";
        }
      } catch (err) {
        console.warn("[Google UserInfo Warning]:", err.message);
      }
    }

    return { ...tokenData, googleEmail };
  },

  /**
   * Save or update Google OAuth tokens for an advisor
   */
  async saveTokens(advisorId, tokens) {
    const existing = await db.findOne("google_oauth_tokens", { user_id: advisorId });
    const expiryDate = tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : tokens.expiry_date;

    if (existing) {
      return await db.update(
        "google_oauth_tokens",
        { id: existing.id },
        {
          google_email: tokens.googleEmail || existing.google_email || "",
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || existing.refresh_token,
          expiry_date: expiryDate,
          scope: tokens.scope || existing.scope,
          updated_at: new Date().toISOString(),
        }
      );
    }

    return await db.insert("google_oauth_tokens", {
      id: `tok_${advisorId.slice(0, 8)}_${Date.now()}`,
      user_id: advisorId,
      google_email: tokens.googleEmail || "",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || "",
      expiry_date: expiryDate,
      scope: tokens.scope || "",
      token_type: tokens.token_type || "Bearer",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  },

  /**
   * Disconnect Google account for an advisor
   */
  async disconnect(advisorId) {
    const existing = await db.findOne("google_oauth_tokens", { user_id: advisorId });
    if (existing) {
      await db.delete("google_oauth_tokens", { id: existing.id });
      return true;
    }
    return false;
  },

  /**
   * Get valid access token for advisor (refreshing if expired)
   */
  async getValidAccessToken(advisorId) {
    const tokenRecord = await db.findOne("google_oauth_tokens", { user_id: advisorId });
    if (!tokenRecord || !tokenRecord.access_token) {
      console.log(`[Google Auth] Advisor ID: ${advisorId} | Connection exists: false`);
      return null;
    }

    console.log(`[Google Auth] Advisor ID: ${advisorId} | Connection exists: true`);

    // Check if token is still valid (with 5 min buffer)
    if (tokenRecord.expiry_date && tokenRecord.expiry_date > Date.now() + 5 * 60 * 1000) {
      console.log(`[Google Auth] Token valid: true (expires at ${new Date(Number(tokenRecord.expiry_date)).toISOString()})`);
      return tokenRecord.access_token;
    }

    // Refresh token if refresh_token exists
    if (tokenRecord.refresh_token && GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
      console.log(`[Google Auth] Token expired or near expiry. Attempting automatic refresh...`);
      try {
        const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: tokenRecord.refresh_token,
            grant_type: "refresh_token",
          }),
        });

        if (res.ok) {
          const newTokens = await res.json();
          await this.saveTokens(advisorId, {
            access_token: newTokens.access_token,
            expires_in: newTokens.expires_in,
          });
          console.log(`[Google Auth] Token successfully refreshed.`);
          return newTokens.access_token;
        } else {
          const errBody = await res.text();
          console.error(`[Google Auth] Token refresh failed (${res.status}): ${errBody}`);
        }
      } catch (err) {
        console.error("[Google Token Refresh Error]:", err.message);
      }
    } else {
      console.warn(`[Google Auth] No refresh token available to refresh expired access token.`);
    }

    return tokenRecord.access_token;
  },

  /**
   * Test connection to Google Calendar API
   */
  async testConnection(advisorId) {
    const tokenRecord = await db.findOne("google_oauth_tokens", { user_id: advisorId });
    if (!tokenRecord || !tokenRecord.access_token) {
      return {
        connected: false,
        message: "Google Calendar is not connected. Please connect your Google account.",
      };
    }

    const accessToken = await this.getValidAccessToken(advisorId);
    if (!accessToken) {
      return {
        connected: false,
        message: "Your Google Calendar connection has expired. Please reconnect your Google account.",
      };
    }

    try {
      const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const isScopeIssue = errJson?.error?.details?.some((d) => d.reason === "ACCESS_TOKEN_SCOPE_INSUFFICIENT") ||
          errJson?.error?.message?.includes("insufficient");

        if (isScopeIssue) {
          return {
            connected: false,
            status: 403,
            message: "Calendar permissions were not granted. Please click Disconnect, reconnect, and make sure to check the box granting Calendar access on Google's consent screen.",
          };
        }

        return {
          connected: false,
          status: res.status,
          message: errJson?.error?.message || `Google Calendar API returned error (${res.status}). Please reconnect.`,
        };
      }

      const calData = await res.json();
      return {
        connected: true,
        calendarId: calData.id,
        calendarSummary: calData.summary,
        timeZone: calData.timeZone,
        googleEmail: tokenRecord.google_email || calData.id,
        message: `Successfully connected to Google Calendar (${calData.summary || calData.id})`,
      };
    } catch (err) {
      return {
        connected: false,
        message: `Network error verifying Google Calendar: ${err.message}`,
      };
    }
  },
};
