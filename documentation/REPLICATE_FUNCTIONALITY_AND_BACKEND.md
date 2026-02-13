# Replicating Likkle Wisdom: Functionality, Database, RevenueCat & Integrations

This document describes how to replicate **all functionalities**, **databases**, **RevenueCat**, **push notifications**, **AI**, and **auth** when rebuilding the app (e.g. in Flutter or another stack). Use it together with `FLUTTER_REBUILD_GUIDE.md` for UI/theme.

---

## 1. Overview

| Area | What to replicate |
|------|-------------------|
| **Auth** | Supabase Auth (email/password, OTP), guest mode, session restore |
| **Database** | Supabase (Postgres) + RLS; tables: profiles, bookmarks, journal_entries, subscriptions, my_wisdom, alerts, alert_reads, push_tokens |
| **RevenueCat** | IAP on iOS/Android; entitlement `"Maxwell Definitive Technologies Pro"`; paywall UI |
| **AI** | Google Gemini (gemini-2.0-flash) for Jamaican Patois wisdom generation |
| **Push** | FCM (Android), APNs (iOS); Edge Function for daily verse/quote/wisdom |
| **Encryption** | Client-side AES-GCM for journal title/text (key derived from user id) |
| **Content** | Static quotes/verses in app; user wisdoms and bookmarks in DB |

---

## 2. Environment Variables & Secrets

### 2.1 App (build-time / runtime)

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` or `SUPABASE_URL` | Yes (or hardcode fallback) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` or `SUPABASE_ANON_KEY` | Yes (or hardcode fallback) | Supabase anon (public) key |
| `VITE_GEMINI_API_KEY` or `GEMINI_API_KEY` | Yes for AI wisdom | Google AI Studio API key for Gemini |
| `VITE_REVENUECAT_API_KEY` | Yes for iOS/Android IAP | RevenueCat **production** API key (one per platform in dashboard) |

- **Never** ship with a RevenueCat **test** key for App Store / Play Store (rejection risk).
- In Flutter, use same values in `.env` or platform-specific config; for native, keys are baked at build.

### 2.2 Supabase Edge Function (send-daily-push)

Set in Supabase Dashboard → Edge Functions → Secrets (or Project Settings):

| Secret | Required | Purpose |
|--------|----------|---------|
| `SUPABASE_URL` | Auto-injected | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected | Service role key (bypasses RLS) |
| `FCM_PROJECT_ID` | Android push | Firebase project ID |
| `FCM_CLIENT_EMAIL` | Android push | Firebase service account client email |
| `FCM_PRIVATE_KEY` | Android push | Firebase service account private key (full string) |
| `APNS_KEY_ID` | iOS push | Apple .p8 key ID |
| `APNS_TEAM_ID` | iOS push | Apple Team ID |
| `APNS_BUNDLE_ID` | iOS push | e.g. `com.likklewisdom.app` |
| `APNS_PRIVATE_KEY` | iOS push | Full contents of .p8 file |

---

## 3. Database (Supabase / Postgres)

### 3.1 Migrations to run (in order)

1. **001_simple_schema_and_rls.sql** – Core schema and RLS.
2. **002_push_tokens.sql** – Push token storage for FCM/APNs.

Run in Supabase SQL Editor. No other SQL files are required for the current feature set.

### 3.2 Tables and RLS (summary)

- **profiles**  
  - `id` (uuid, PK, FK → auth.users), `username`, `avatar_url`, `is_premium`, `is_admin`, `is_public`, `status_note`, `status_note_at`, `updated_at`, `created_at`, `notify_quote_time`, `notify_verse_time`, `notify_wisdom_time` (time of day).  
  - RLS: SELECT if owner or `is_public`; UPDATE only owner.  
  - Trigger: `handle_new_user()` creates a profile row on `auth.users` insert.

- **bookmarks**  
  - `id`, `user_id`, `item_id`, `item_type`, `metadata` (jsonb), `created_at`.  
  - UNIQUE(`user_id`, `item_id`).  
  - `item_type`: e.g. `'quote'`, `'iconic'`, `'bible'`, `'kjv'`.  
  - RLS: SELECT own or public user’s bookmarks; INSERT/DELETE own only.

- **journal_entries**  
  - `id`, `user_id`, `title`, `text`, `mood`, `date`, `timestamp` (bigint), `created_at`.  
  - Title and text are stored **encrypted** (client-side AES-GCM).  
  - RLS: full CRUD for own rows only.

- **subscriptions**  
  - `id`, `user_id` (unique), `status`, `payment_method`, `amount`, `created_at`.  
  - RLS: full access for own row. (RevenueCat is source of truth for premium; this table can be used for server-side checks or legacy.)

- **my_wisdom**  
  - `id`, `user_id`, `content` (jsonb: `{ patois, english }`), `created_at`.  
  - RLS: SELECT own or public user’s; INSERT/UPDATE/DELETE own only.

- **alerts**  
  - `id`, `admin_id`, `title`, `message`, `type` ('info'|'warning'|'update'|'event'), `created_at`, `updated_at`, `expires_at`.  
  - RLS: SELECT for authenticated (non-expired); INSERT/UPDATE/DELETE only if `profiles.is_admin` for current user.

- **alert_reads**  
  - `id`, `alert_id`, `user_id`, `read_at`. UNIQUE(`alert_id`, `user_id`).  
  - RLS: SELECT own; INSERT own (mark as read).

- **push_tokens**  
  - `id`, `user_id`, `token`, `platform` ('ios'|'android'), `updated_at`. UNIQUE(`user_id`, `platform`).  
  - RLS: full access for own row. Edge Function uses **service role** to read tokens and profiles.

### 3.3 Functions

- **handle_new_user()** – Trigger on `auth.users` INSERT; inserts into `profiles` with `username`/`avatar_url` from `raw_user_meta_data`.
- **get_unread_alert_count(p_user_id)** – Returns count of alerts that are not expired and not in `alert_reads` for that user.

### 3.4 Sync flow (after login)

On successful auth (non-guest), the app:

1. Fetches **profile** by `user_id` and updates local user (username, avatar, is_premium, is_admin, is_public).
2. Fetches **bookmarks** and applies to local quotes/iconic/bible lists (isFavorite) and builds bookmarked verses list (item_type `kjv` with metadata).
3. Fetches **journal_entries** for user, decrypts title/text per row, sets local journal list (ordered by timestamp desc).
4. Fetches **my_wisdom** (via WisdomService), sets local user wisdoms.

All of the above should be replicated in your client (e.g. Flutter) when you implement “sync on login”.

---

## 4. Authentication

### 4.1 Supabase Auth

- **Sign up:** `signUp({ email, password, options: { data: { username } } })`. If no session (email confirmation), show OTP verification screen.
- **Verify OTP:** `verifyOtp({ email, token, type: 'signup' })`.
- **Sign in:** `signInWithPassword({ email, password })`.
- **Sign out:** `signOut()`; then clear local state and (for native) remove push token from `push_tokens`.
- **Session restore:** On app load, call `getSession()`. If session exists, run sync (see §3.4) and go to main app; else show auth screen.
- **Auth state listener:** `onAuthStateChange` to update user state and run sync on sign-in, clear user and go to auth on SIGNED_OUT.

### 4.2 Guest mode

- User can choose “Continue as guest”. No Supabase session; local `user` object with e.g. `id: 'guest'`, `isGuest: true`, `username: 'Guest'`.
- **Gating:** Any action that requires storage (favorites, journal, “My Wisdom”, AI wisdom, settings) must check `user?.isGuest` and show an “Auth gate” modal prompting sign up / sign in.
- No sync for guest; no push token registration.

### 4.3 Profile creation

- `handle_new_user` trigger normally creates the profile. If missing (e.g. race), client can create a row in `profiles` for `auth.uid()` with username (from signup metadata or email prefix) and default flags.

---

## 5. RevenueCat (In-App Purchases)

### 5.1 Configuration

- **Platform:** iOS and Android only (no paywall on web).
- **API key:** Use **production** key from RevenueCat dashboard for each platform; set as `VITE_REVENUECAT_API_KEY` (or equivalent) at build.
- **Entitlement identifier:** `"Maxwell Definitive Technologies Pro"`.  
  Premium status is determined by: `customerInfo.entitlements.active["Maxwell Definitive Technologies Pro"]` is defined.

### 5.2 App flows

1. **Initialize** (on app launch, native only):  
   `Purchases.configure({ apiKey })`. Set log level to DEBUG in dev, WARN in prod.

2. **Check premium:**  
   `Purchases.getCustomerInfo()` then check entitlement above. Cache result in app user state (e.g. `user.isPremium`). Optionally refresh after paywall close.

3. **Show paywall:**  
   Use RevenueCat UI: `RevenueCatUI.presentPaywall({ displayCloseButton: true })`.  
   On result PURCHASED or RESTORED, set `isPremium = true` and refresh customer info.

4. **Sync with backend (optional):**  
   When you detect premium, update `profiles.is_premium` in Supabase so server/Edge Functions can rely on it if needed.

### 5.3 Flutter / other stacks

- Use **purchases_flutter** (RevenueCat Flutter SDK). Same project and entitlement ID; configure with the same API keys and product/offering setup in RevenueCat dashboard.

---

## 6. AI Wisdom (Google Gemini)

### 6.1 API

- **Model:** `gemini-2.0-flash`.
- **Input:** User mood string (e.g. Peace, Hustle, Joy, Healing).
- **Prompt:** Ask for a unique Jamaican Patois proverb/affirmation for that mood; request JSON `{ "patois": "string", "english": "string" }`.
- **Config:** temperature ~0.9, topP ~0.95, `responseMimeType: "application/json"`, schema with `patois` and `english` strings.
- **System instruction:** Model is a wise Jamaican elder; respond in authentic Patois and English translation.

### 6.2 Key and errors

- API key from Google AI Studio; passed as env (e.g. `VITE_GEMINI_API_KEY`).  
- On missing key or API error, return a fixed fallback `{ patois, english }` so the UI always has something to show.

### 6.3 Saving to My Wisdom

- After generation, if user is logged in (not guest), call WisdomService (or equivalent): insert into `my_wisdom` with `user_id` and `content: { patois, english }`. Then refresh local list and show success.

---

## 7. Push Notifications

### 7.1 Client (iOS/Android)

- **Register:** After login (non-guest), request notification permission and register for push. On receipt of device token, upsert into `push_tokens` with `user_id`, `token`, `platform` ('ios'|'android'), `updated_at`. Use UNIQUE on (`user_id`, `platform`) and upsert.
- **On sign out:** Delete row(s) in `push_tokens` for that `user_id` (and current platform).
- **Tap handling:** When user opens app from notification, read payload `data.type` (e.g. `verse`, `quote`, `wisdom`, `alert`, `home`) and navigate to the corresponding tab/screen.

### 7.2 Backend (Edge Function: send-daily-push)

- **Invocation:** Scheduled (e.g. hourly via pg_cron) with service role Bearer token.
- **Logic:**
  - Query `push_tokens` (all) and `profiles` (for same user ids) for `notify_quote_time`, `notify_verse_time`, `notify_wisdom_time`.
  - For current UTC hour, determine which users should receive quote, verse, or wisdom (compare hour from time column; times stored as time-of-day, e.g. 08:00 = 8 UTC).
  - For each token, send one FCM (Android) or APNs (iOS) message with appropriate title/body and `data.type` (quote/verse/wisdom). Optionally add alerts (unread) with `type: 'alert'`.
- **Secrets:** See §2.2 (FCM and APNs credentials).
- **Scheduling:** Example pg_cron: every hour at minute 0; HTTP POST to `.../functions/v1/send-daily-push` with Authorization Bearer = service role key. Store URL and key in Vault and reference in cron.

Details and cron example: see `documentation/PUSH_NOTIFICATIONS_SETUP.md`.

---

## 8. Encryption (Journal)

- **Algorithm:** AES-GCM (Web Crypto API).
- **Key derivation:** From a fixed prefix + `userId` (e.g. `'likkle-wisdom-v1-' + userId`), PBKDF2 with salt `'rum-and-wisdom-salt'`, 100k iterations, SHA-256, to get AES-GCM 256-bit key.
- **Per field:** Generate random 12-byte IV per encrypt; store as base64(IV || ciphertext).  
- **Usage:** Encrypt `title` and `text` before sending to `journal_entries`; decrypt after fetching. In Flutter you can use `pointycastle` or `encrypt` with AES-GCM and replicate the same key derivation and IV/ciphertext format so existing DB rows remain readable.

---

## 9. Bookmarks and Journal API Shape

### 9.1 Bookmarks insert

- **Quotes / iconic / bible:**  
  `user_id`, `item_id` (string id of quote/iconic/bible), `item_type` ('quote'|'iconic'|'bible'), `metadata` (jsonb, e.g. patois, english, category or text, author or reference).
- **KJV verse:**  
  `user_id`, `item_id` (e.g. `kjv-{book_id}-{chapter}-{verse}`), `item_type`: `'kjv'`, `metadata`: `{ text, reference }`.
- Delete: `delete().eq('user_id', userId).eq('item_id', item_id)`.

### 9.2 Journal insert

- `user_id`, `title` (encrypted), `text` (encrypted), `mood`, `date` (display string), `timestamp` (bigint, e.g. Date.now()).
- Delete: by `user_id` and `timestamp` (client uses timestamp as logical id for delete).

### 9.3 My Wisdom

- Insert: `user_id`, `content`: `{ patois, english }`.
- Select: by `user_id`, order `created_at` desc.
- Delete: by `id` (uuid).

---

## 10. Alerts

- **List:** Query `alerts` where `expires_at` is null or > now(); order by `created_at` desc. Map to Alert model (id, title, message, type, createdAt, etc.).
- **Unread count:** Call RPC `get_unread_alert_count(p_user_id)` or implement same logic (alerts not in `alert_reads` for user).
- **Mark read:** Upsert into `alert_reads` (`alert_id`, `user_id`, `read_at`) on conflict (`alert_id`, `user_id`).
- **Admin create/update/delete:** Only if `profiles.is_admin` for current user; use RLS.
- **Realtime (optional):** Subscribe to `alerts` INSERT to show in-app badge or banner when new alert is created.

---

## 11. App IDs and Entitlements

| Item | Value |
|------|--------|
| iOS/Android app ID | `com.likklewisdom.app` |
| RevenueCat entitlement | `Maxwell Definitive Technologies Pro` |
| FCM/APNs | Same bundle/package as app ID |

Use these when configuring App Store Connect, Google Play, Firebase, Apple Developer, and RevenueCat.

---

## 12. Feature Checklist for Replication

- [ ] Supabase project + URL + anon key; run migrations 001 and 002.
- [ ] Auth: sign up, sign in, OTP verify, sign out, session restore, `onAuthStateChange`.
- [ ] Guest mode: local user with isGuest; gate writes and show auth gate.
- [ ] Profile: create on signup (trigger or client), update username/avatar/settings; read for sync.
- [ ] Bookmarks: insert/delete for quote/iconic/bible/kjv; sync and apply to local lists.
- [ ] Journal: encrypt title/text; insert; fetch and decrypt; delete by timestamp.
- [ ] My Wisdom: list, create (from AI or manual), delete; sync after login.
- [ ] Alerts: list, unread count, mark read; admin CRUD if applicable.
- [ ] RevenueCat: configure (native), getCustomerInfo, entitlement check, presentPaywall; set isPremium.
- [ ] Gemini: call with mood; parse JSON; fallback on error; save to my_wisdom when logged in.
- [ ] Push: register token, upsert push_tokens; remove on sign out; handle tap (navigate by data.type).
- [ ] Edge Function: send-daily-push with FCM/APNs secrets; pg_cron hourly; user times in profiles (UTC hour).
- [ ] Encryption: same key derivation and AES-GCM format for journal.
- [ ] Offline: check `navigator.onLine` (or equivalent); queue or skip sync when offline; show friendly message for “write” actions when offline.

Using this document you can replicate functionality, database, RevenueCat, push, and AI in another codebase (e.g. Flutter) while reusing the same Supabase project and RevenueCat project.
