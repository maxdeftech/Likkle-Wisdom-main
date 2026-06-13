# Push Notifications Setup (iOS & Android)

This app sends **verse of the day**, **quote of the day**, **wisdom of the day**, and can surface **alerts** via native push on iOS and Android. Users set their preferred times in **Settings → Daily notifications**.

## What’s in place

- **App (Capacitor)**  
  - On login (non-guest), the app registers for push and syncs the device token to Supabase `push_tokens`.  
  - Tapping a notification opens the app to the right place (e.g. verse → Bible tab, quote/wisdom → Home, alert → Alerts).

- **Supabase**  
  - Table `push_tokens` (see `supabase/migrations/002_push_tokens.sql`).  
  - Profiles store `notify_quote_time`, `notify_verse_time`, `notify_wisdom_time` (used by the Edge Function).

- **Edge Function**  
  - `supabase/functions/send-daily-push` runs on a schedule (e.g. hourly).  
  - For the current UTC hour it finds users whose quote/verse/wisdom time matches and sends one FCM (Android) or APNs (iOS) push per type.

## 1. Run migrations

Apply the push_tokens migration if you haven’t:

- In Supabase Dashboard → SQL Editor, run the contents of `supabase/migrations/002_push_tokens.sql`.

## 2. Android (FCM)

1. **Firebase project**  
   - Go to [Firebase Console](https://console.firebase.google.com), create or use a project, add an Android app with package name `com.likklewisdom.app` (or your `appId` from `capacitor.config.ts`).

2. **Service account**  
   - Project settings → Service accounts → Generate new private key.  
   - You get a JSON file. You’ll need:
     - `project_id` → `FCM_PROJECT_ID`
     - `client_email` → `FCM_CLIENT_EMAIL`
     - `private_key` (full string, including `\n`) → `FCM_PRIVATE_KEY`

3. **google-services.json**  
   - Download `google-services.json` from Firebase and put it in `android/app/` (Capacitor Android project).  
   - Rebuild the Android app so FCM is configured.

4. **Secrets for Edge Function**  
   In Supabase Dashboard → Edge Functions → send-daily-push → Secrets (or Project Settings → Edge Function secrets), set:

   - `FCM_PROJECT_ID` = your Firebase project ID  
   - `FCM_CLIENT_EMAIL` = service account client email  
   - `FCM_PRIVATE_KEY` = full private key string (paste as-is; Supabase stores it securely)

## 3. iOS (APNs)

1. **Apple Developer**  
   - Create an **APNs key** (.p8): Certificates, Identifiers & Profiles → Keys → create key, enable **Apple Push Notifications (APNs)**.  
   - Download the .p8 once; note the **Key ID**.

2. **App ID**  
   - Use the same bundle ID as your app (e.g. `com.likklewisdom.app`).  
   - Ensure the App ID has **Push Notifications** capability.

3. **Xcode**  
   - Open the iOS project (`ios/App/App.xcworkspace` or similar).  
   - Signing & Capabilities → add **Push Notifications** (and Background Modes → Remote notifications if you want background delivery).

4. **Secrets for Edge Function**  
   Set in Supabase Edge Function secrets:

   - `APNS_KEY_ID` = Key ID of the .p8 key  
   - `APNS_TEAM_ID` = your Apple Team ID  
   - `APNS_BUNDLE_ID` = e.g. `com.likklewisdom.app`  
   - `APNS_PRIVATE_KEY` = **contents of the .p8 file** (paste the whole text, including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`; you can replace real newlines with `\n` if your env only allows one line)

## 4. Schedule the Edge Function (pg_cron)

You need to invoke `send-daily-push` regularly (e.g. every hour) so that at each user’s chosen time (in UTC) they get the right notification.

1. **Enable extensions** (if not already):  
   In Supabase Dashboard → Database → Extensions, enable `pg_cron` and `pg_net`.

2. **Store URL and key in Vault** (recommended):  
   In SQL Editor:

   ```sql
   select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'project_url');
   select vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'service_role_key');
   ```

   Use your project URL and **service role** key (not anon) so the scheduled request can call the function with proper auth if you protect it.

3. **Schedule the function**  
   Example: run every hour at minute 0 (so the function runs at the top of the hour):

   ```sql
   select cron.schedule(
     'send-daily-push-hourly',
     '0 * * * *',
     $$
     select net.http_post(
       url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/send-daily-push',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
       ),
       body := '{}'::jsonb
     ) as request_id;
     $$
     );
   ```

   Adjust the cron expression if you want a different schedule (e.g. every 30 minutes). The function itself only sends when the current UTC minute is 0–1 to avoid duplicates.

## 5. User times (UTC)

Notification times in **profiles** are stored as time-of-day. The Edge Function compares the **current UTC hour** to the hour of `notify_quote_time`, `notify_verse_time`, and `notify_wisdom_time`. So “8:00” in the app is treated as 08:00 UTC unless you later add timezone support.

For a first version this is fine; you can later add a `timezone` (or offset) column and compute the user’s local hour before comparing.

## 6. Alerts (optional)

The in-app **Alerts** view already shows admin alerts. To also send a **push** when there are new alerts:

- Extend `send-daily-push` (or add a separate function) to:
  - Query `alerts` and `alert_reads` to find users who have unread alerts.
  - For each such user, look up their token(s) in `push_tokens` and send one push (e.g. “You have new updates from Likkle Wisdom” with `type: 'alert'`).

The app already handles `type: 'alert'` by opening the Alerts view when the user taps the notification.

## 7. Testing

- **App**: Log in as a non-guest user on a real iOS or Android device, grant notification permission, and confirm in Supabase (Table Editor → `push_tokens`) that a row appears for that user.  
- **Edge Function**: In Supabase Dashboard → Edge Functions → send-daily-push → Invoke, or call it manually with:

  ```bash
  curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-daily-push' \
    -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
    -H 'Content-Type: application/json'
  ```

  Check the function logs to see how many notifications were sent. Ensure at least one user has a token and a profile with `notify_quote_time` / `notify_verse_time` / `notify_wisdom_time` set to the current UTC hour when you test.

## Summary

| Component        | Purpose |
|-----------------|---------|
| `push_tokens`   | Store FCM/APNs tokens per user and platform |
| `profiles`      | Store preferred times for quote, verse, wisdom |
| App             | Register for push, sync token, handle notification tap |
| send-daily-push | Hourly job: send verse/quote/wisdom at user’s time (UTC) |
| FCM / APNs      | Deliver pushes to Android and iOS devices |

After migrations, FCM/APNs secrets, and cron are set up, users will receive verse of the day, quote of the day, and wisdom of the day at their chosen times, and can open the app to the right tab from the notification.
