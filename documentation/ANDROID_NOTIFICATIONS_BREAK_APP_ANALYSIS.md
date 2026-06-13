# Android: Notifications “Breaking” the App — Analysis & Recommendations

This document analyzes why **turning on notifications on Android** may break the Likkle Wisdom app. It is based on inspection of the Android build configuration, Capacitor push-notifications plugin, and app flow. **No code changes are prescribed here**—only problem analysis and recommended solution directions.

---

## 1. Summary of Findings

The app uses **@capacitor/push-notifications**, which on Android depends on **Firebase Cloud Messaging (FCM)**. When the user effectively “turns on” notifications (e.g. by logging in as a non-guest, which triggers push registration, or by granting the system notification permission), the plugin calls **FirebaseMessaging.getInstance().getToken()**. If **Firebase has not been initialized** in the process, this can throw a fatal error and crash or otherwise break the app.

The most likely root cause is **Firebase not being initialized** because the **Google Services plugin is not applied** when `google-services.json` is missing or not in the right place.

---

## 2. How Notifications Are Triggered in the App

- **Automatic registration on login**  
  In `App.tsx`, a `useEffect` runs when a non-guest user is set and calls `PushService.registerAndSyncToken(user.id)`. So “turning on” notifications often happens when:
  1. The user logs in (or is already logged in and the app starts), and  
  2. The app requests notification permission and then calls `PushNotifications.register()`.

- **Settings**  
  The Settings screen only lets users set **daily notification times** (quote/verse/wisdom). It does not directly trigger `register()`; registration is driven by the effect above. So the “break” typically occurs when registration runs (on login or after permission grant), not when changing a time in Settings.

---

## 3. Root Cause Analysis

### 3.1 Missing or Ineffective Firebase Configuration (Primary Suspect)

**Relevant configuration**

- **`android/app/build.gradle`**  
  The Google Services plugin is applied **only if** `android/app/google-services.json` exists and has content:

  ```gradle
  try {
      def servicesJSON = file('google-services.json')
      if (servicesJSON.text) {
          apply plugin: 'com.google.gms.google-services'
      }
  } catch(Exception e) {
      logger.info("google-services.json not found, google-services plugin not applied. Push Notifications won't work")
  }
  ```

- **Current state**  
  In the project tree, **no `google-services.json`** was found under `android/app/` (and the repo may omit it for security). So for many builds the Google Services plugin is **not** applied.

**What this implies**

- The **push-notifications plugin is always included** (via `capacitor.build.gradle`: `implementation project(':capacitor-push-notifications')`).
- The plugin **depends on** `com.google.firebase:firebase-messaging` and calls `FirebaseMessaging.getInstance().getToken()` in `register()`.
- **Without** the Google Services plugin, the Firebase SDK is **not** initialized (no generated `FirebaseApp` initialization from `google-services.json`). So when the user triggers registration:
  - `FirebaseMessaging.getInstance()` can throw (e.g. “Default FirebaseApp is not initialized in this process”).
  - That exception happens on the **native (Java) side** and can crash the app or leave the WebView bridge in a bad state—“breaking” the app.

So: **turning on notifications can break the app because registration runs against an uninitialized Firebase.**

---

### 3.2 Invalid or Misconfigured `google-services.json`

If `google-services.json` **is** present but:

- Has the **wrong Android package name** (e.g. not `com.likklewisdom.app` as in `capacitor.config.ts` and `applicationId`), or  
- Is **corrupted**, from a different Firebase project, or **missing the correct `client` / `mobilesdk_app_id`** for this app,

then the merged config may be wrong. At runtime, FCM initialization or token retrieval can fail or throw, again when the user “turns on” notifications and `register()` runs.

---

### 3.3 Plugin and Manifest Dependencies

- **Capacitor push-notifications plugin**
  - Declares a **Firebase Messaging** dependency and a **service** in its manifest for `com.google.firebase.MESSAGING_EVENT`.
  - Uses `@Permission(POST_NOTIFICATIONS)` so the merged app manifest should get the Android 13+ notification permission; that part is unlikely to be the direct cause of a “break.”
- **App manifest**  
  The main app manifest does not declare FCM or Firebase; the plugin’s manifest is merged in. The critical requirement is that **Firebase is initialized**, which depends on the Google Services plugin and `google-services.json`.

---

### 3.4 Java / Gradle Version Mismatch (Secondary)

- **`android/app/build.gradle`** uses `JavaVersion.VERSION_17`.
- **`android/app/capacitor.build.gradle`** (generated) uses `JavaVersion.VERSION_21`.

Such a mismatch can sometimes cause odd build or runtime behavior. It is less likely to be the main cause of “notifications break the app” than missing Firebase init, but it is worth aligning to avoid subtle issues.

---

### 3.5 Listener Order and Error Handling (Behavior, Not Likely “Break”)

- In `pushService.ts`, the **`registration`** and **`registrationError`** listeners are attached **after** `PushNotifications.register()` is called. The plugin resolves the `register()` call immediately and delivers the token asynchronously. So the listener may still receive the token; this is more about “notifications not working” than “app breaks.”
- Errors are largely swallowed (`catch (_) {}`). So if the **native** side crashes, the JS side would not “see” it in a way that prevents the crash. Improving error handling is good for diagnostics and UX but does not fix the root cause of a native crash from uninitialized Firebase.

---

## 4. Recommended Solutions (Direction Only)

### 4.1 Ensure Firebase Is Correctly Configured (Critical)

1. **Add a valid `google-services.json`**
   - From the [Firebase Console](https://console.firebase.google.com), use (or create) a project and add an **Android app** with package name **`com.likklewisdom.app`** (matching `applicationId` and `capacitor.config.ts`).
   - Download **`google-services.json`** and place it in **`android/app/`** (same directory as the app’s `build.gradle`).
   - Ensure the file is **not** empty and is committed or provided in a way your build actually uses (e.g. not only in a variant that you don’t run).

2. **Confirm the Google Services plugin is applied**
   - After adding `google-services.json`, run a clean build and check build output or Gradle that the `com.google.gms.google-services` plugin is applied for the app module.
   - If you use a build flavor or path where the file is not present, the plugin will not run there and Firebase will not be initialized for that build—avoid using that build for testing notifications.

3. **Verify package and project**
   - Double-check that `google-services.json`’s `client.client_info.android_client_info.package_name` is `com.likklewisdom.app` and that the file belongs to the same Firebase project you use for FCM (e.g. in your Edge Function secrets).

This directly addresses the most likely cause: **Firebase not initialized when the user turns on notifications.**

---

### 4.2 If You Intentionally Ship Without Notifications

If some builds (e.g. certain flavors or internal builds) are meant to run **without** push:

- Do **not** call `PushNotifications.register()` when Firebase is not configured. That might mean:
  - Detecting at build time or runtime that FCM is not available (e.g. no `google-services.json` or a feature flag), and
  - Skipping `PushService.registerAndSyncToken()` in that case, or
  - Providing a stub or safe path so the plugin’s native `register()` is never invoked when Firebase is not initialized.

Otherwise, as long as the plugin is included and `register()` is called, the app can crash when Firebase is missing.

---

### 4.3 Align Java Version

- Prefer a single Java version for the app and Capacitor (e.g. 17 everywhere, or 21 everywhere) in:
  - `android/app/build.gradle` (`compileOptions`),
  - Generated `capacitor.build.gradle` (if you control the template or post-sync step),
  - And `gradle.properties` / JDK path if relevant.
- This reduces the chance of obscure build/runtime issues when the notification path runs.

---

### 4.4 Improve Diagnostics and Error Handling (Optional but Useful)

- In **native** code (or via plugin options if the plugin supports it), ensure that **registration failures** (e.g. task not successful in `getToken()`) are reported to JS via the existing `registrationError` listener rather than throwing.
- On the **JS** side, avoid swallowing errors: log or report registration failures so you can see “FCM not configured” or “token failed” instead of a silent failure or crash.
- Consider attaching the **`registration`** and **`registrationError`** listeners **before** calling `register()` so no token or error is missed.

These steps do not fix “Firebase not initialized” but make it easier to confirm the cause and to handle failures gracefully once FCM is correctly set up.

---

### 4.5 Test Matrix

After adding `google-services.json` and confirming the plugin is applied:

- **With notifications “on”**: Log in as non-guest, grant notification permission, and confirm the app does not crash and that a token is stored (e.g. in Supabase `push_tokens`).
- **Without `google-services.json`**: If you have a build path without the file, ensure that path never calls `register()` (or document that notifications are disabled for that build).

---

## 5. Summary Table

| Area | Likely issue | Recommendation |
|------|----------------|----------------|
| Firebase init | `google-services.json` missing → plugin not applied → Firebase not initialized | Add valid `google-services.json` to `android/app/` with package `com.likklewisdom.app` |
| Config validity | Wrong package or project in `google-services.json` | Verify package name and Firebase project in the file |
| When registration runs | `register()` called on login for non-guest users | Ensure that path only runs when FCM is configured, or add a guard |
| Java version | Mismatch between app (17) and Capacitor (21) | Align Java version across app and Capacitor |
| Errors | Native crash or swallowed JS errors | Improve error handling and listener order for easier debugging |

---

## 6. References in This Repo

- **Push setup**: `documentation/PUSH_NOTIFICATIONS_SETUP.md` — FCM setup, `google-services.json`, Edge Function secrets.
- **Android app ID**: `capacitor.config.ts` (`appId: 'com.likklewisdom.app'`); same in `android/app/build.gradle` (`applicationId`).
- **Registration flow**: `src/services/pushService.ts` (`registerAndSyncToken`); called from `src/App.tsx` when user is set and not guest.
- **Plugin**: `node_modules/@capacitor/push-notifications` (Android: Firebase Messaging, `FirebaseMessaging.getInstance().getToken()` in `register()`).

Using the recommendations above (especially ensuring a valid `google-services.json` and that the Google Services plugin is applied for the builds where users can turn on notifications) should prevent the app from breaking when notifications are enabled on Android.
