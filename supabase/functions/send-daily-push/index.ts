// Supabase Edge Function: send daily verse, quote, wisdom, and alerts to iOS/Android
// Schedule with pg_cron (e.g. every hour) to invoke this function.
// Requires: SUPABASE_SERVICE_ROLE_KEY, and for sending:
//   Android: FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY (from Firebase service account)
//   iOS: APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID, APNS_PRIVATE_KEY (p8 content)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Minimal seed for daily content (pick by day-of-year so same day = same content)
const QUOTES = [
  { patois: "Every mickle mek a muckle", english: "Every small amount adds up." },
  { patois: "Nuh badda fret", english: "Don't worry — things will work out." },
  { patois: "Wi likkle but wi tallawah", english: "We are small but mighty." },
  { patois: "One one coco full basket", english: "Success comes step by step." },
  { patois: "Walk wid yuh head high", english: "Maintain your dignity and pride." },
];
const VERSES = [
  { reference: "Psalm 23:1", patois: "De Lawd a mi shepherd; mi nah go want fi nuttn." },
  { reference: "Philippians 4:13", patois: "Mi can do every single ting tru Christ weh gi mi di strength." },
  { reference: "Proverbs 3:5", patois: "Truss di Lawd wid all a yuh heart." },
  { reference: "Isaiah 41:10", patois: "Nuh fraid; mi deh wid yuh. Nuh worry; mi a yuh God." },
  { reference: "Psalm 27:1", patois: "Di Lawd a mi light an mi salvation; who mi fi fraid?" },
];
const WISDOMS = [
  { patois: "Cool yuhself, man", english: "Stay calm and composed." },
  { patois: "Mek haste slowly", english: "Move with purpose but don't rush." },
  { patois: "Soon come", english: "Be patient; everything in its time." },
  { patois: "Gratitude a di best attitude", english: "Being thankful is the best mindset." },
  { patois: "Yuh nuh need permission fi shine", english: "You don't need anyone's approval to be great." },
];

function getDailyQuote() {
  const day = new Date().getTime() / (24 * 60 * 60 * 1000) | 0;
  return QUOTES[day % QUOTES.length];
}
function getDailyVerse() {
  const day = new Date().getTime() / (24 * 60 * 60 * 1000) | 0;
  return VERSES[day % VERSES.length];
}
function getDailyWisdom() {
  const day = new Date().getTime() / (24 * 60 * 60 * 1000) | 0;
  return WISDOMS[day % WISDOMS.length];
}

Deno.serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const utcHour = new Date().getUTCHours();
    const utcMinute = new Date().getUTCMinutes();
    // Only run at the top of the hour to avoid duplicate sends
    if (utcMinute >= 2) {
      return new Response(JSON.stringify({ ok: true, skipped: "not at top of hour" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { data: tokensData, error: tokensError } = await supabase
      .from("push_tokens")
      .select("user_id, token, platform");

    if (tokensError) {
      console.error("push_tokens query error:", tokensError);
      return new Response(JSON.stringify({ error: tokensError.message }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }

    const pushRows = (tokensData || []) as Array<{ user_id: string; token: string; platform: string }>;
    if (pushRows.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, total: 0 }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    const userIds = [...new Set(pushRows.map((r) => r.user_id))];
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, notify_quote_time, notify_verse_time, notify_wisdom_time")
      .in("id", userIds);

    if (profilesError) {
      console.error("profiles query error:", profilesError);
      return new Response(JSON.stringify({ error: profilesError.message }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }

    const profilesMap = new Map(
      ((profilesData || []) as Array<{ id: string; notify_quote_time?: string; notify_verse_time?: string; notify_wisdom_time?: string }>).map((p) => [p.id, p])
    );

    const tokens: Array<{
      token: string;
      platform: string;
      profiles: { notify_quote_time?: string; notify_verse_time?: string; notify_wisdom_time?: string } | null;
    }> = pushRows.map((r) => ({
      token: r.token,
      platform: r.platform,
      profiles: profilesMap.get(r.user_id) ?? null,
    }));

    const quote = getDailyQuote();
    const verse = getDailyVerse();
    const wisdom = getDailyWisdom();

    const toSend: Array<{ token: string; platform: string; type: string; title: string; body: string }> = [];

    for (const row of tokens) {
      const p = row.profiles;
      if (!p) continue;
      const quoteHour = p.notify_quote_time ? parseInt(String(p.notify_quote_time).substring(0, 2), 10) : -1;
      const verseHour = p.notify_verse_time ? parseInt(String(p.notify_verse_time).substring(0, 2), 10) : -1;
      const wisdomHour = p.notify_wisdom_time ? parseInt(String(p.notify_wisdom_time).substring(0, 2), 10) : -1;

      if (quoteHour === utcHour) {
        toSend.push({
          token: row.token,
          platform: row.platform,
          type: "quote",
          title: "Likkle Wisdom — Quote of di Day",
          body: `"${quote.patois}" — ${quote.english}`,
        });
      }
      if (verseHour === utcHour) {
        toSend.push({
          token: row.token,
          platform: row.platform,
          type: "verse",
          title: "Likkle Wisdom — Verse of di Day",
          body: `${verse.reference}: "${verse.patois}"`,
        });
      }
      if (wisdomHour === utcHour) {
        toSend.push({
          token: row.token,
          platform: row.platform,
          type: "wisdom",
          title: "Likkle Wisdom — Wisdom of di Day",
          body: `"${wisdom.patois}" — ${wisdom.english}`,
        });
      }
    }

    let sent = 0;
    for (const msg of toSend) {
      try {
        if (msg.platform === "android") {
          const ok = await sendFCM(msg.token, msg.title, msg.body, msg.type);
          if (ok) sent++;
        } else if (msg.platform === "ios") {
          const ok = await sendAPNs(msg.token, msg.title, msg.body, msg.type);
          if (ok) sent++;
        }
      } catch (e) {
        console.error("Send error:", e);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, sent, total: toSend.length }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});

async function getFCMAccessToken(): Promise<string> {
  const clientEmail = Deno.env.get("FCM_CLIENT_EMAIL");
  const privateKeyPem = Deno.env.get("FCM_PRIVATE_KEY")?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKeyPem) throw new Error("FCM credentials not set");

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  };
  const header = { alg: "RS256", typ: "JWT" };
  const encoder = new TextEncoder();
  const b64 = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const pemContents = privateKeyPem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const binaryKey = new Uint8Array(Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0)));
  const key = await crypto.subtle.importPKCS8(binaryKey.buffer as ArrayBuffer, "PKCS8", ["sign"]);
  const signingInput = `${b64(encoder.encode(JSON.stringify(header)))}.${b64(encoder.encode(JSON.stringify(payload)))}`;
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, encoder.encode(signingInput));
  const jwt = `${signingInput}.${b64(new Uint8Array(sig))}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const json = await res.json();
  if (json.access_token) return json.access_token;
  throw new Error(json.error_description || "FCM token failed");
}

async function sendFCM(token: string, title: string, body: string, type: string): Promise<boolean> {
  const projectId = Deno.env.get("FCM_PROJECT_ID");
  if (!projectId) return false;
  const accessToken = await getFCMAccessToken();
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        data: { type },
        android: { priority: "high", notification: { channel_id: "daily" } },
        apns: { payload: { aps: { sound: "default", badge: 1 } }, fcm_options: {} },
      },
    }),
  });
  return res.ok;
}

async function sendAPNs(token: string, title: string, body: string, type: string): Promise<boolean> {
  const keyId = Deno.env.get("APNS_KEY_ID");
  const teamId = Deno.env.get("APNS_TEAM_ID");
  const bundleId = Deno.env.get("APNS_BUNDLE_ID");
  const privateKeyPem = Deno.env.get("APNS_PRIVATE_KEY")?.replace(/\\n/g, "\n");
  if (!keyId || !teamId || !bundleId || !privateKeyPem) return false;

  const encoder = new TextEncoder();
  const b64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: teamId, iat: now, exp: now + 3600 };
  const header = { alg: "ES256", kid: keyId };
  const payloadB64 = b64url(encoder.encode(JSON.stringify(payload)));
  const headerB64 = b64url(encoder.encode(JSON.stringify(header)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const pemContents = privateKeyPem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const binaryKey = new Uint8Array(Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0)));
  const key = await crypto.subtle.importPKCS8(binaryKey.buffer as ArrayBuffer, "PKCS8", ["sign"]);
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    key,
    encoder.encode(signingInput)
  );
  const sigB64 = b64url(new Uint8Array(sig));
  const jwt = `${signingInput}.${sigB64}`;

  const apnsPayload = JSON.stringify({
    aps: { alert: { title, body }, sound: "default", badge: 1 },
    type,
  });

  const res = await fetch(`https://api.push.apple.com/3/device/${token}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `bearer ${jwt}`,
      "apns-topic": bundleId,
      "apns-push-type": "alert",
      "apns-priority": "10",
    },
    body: apnsPayload,
  });
  return res.ok;
}
