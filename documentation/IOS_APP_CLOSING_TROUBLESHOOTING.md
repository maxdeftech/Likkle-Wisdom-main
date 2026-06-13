# iOS App Automatically Closing — Troubleshooting

If the Likkle Wisdom app **closes by itself** (crashes) on iOS 16 (or other versions), use this guide to find the cause and fix it.

---

## 1. Get the actual crash reason

Until you see a crash log, “automatically closing” could be:

- **Native crash** (process killed) → need device/simulator crash log or Xcode report.
- **WebView/JS crash** → sometimes shows up in Xcode console as “JS Eval error” or “unhandledrejection”.
- **App returning to login** → not a crash; session expired or `refresh_token_not_found` (see below).

**Steps:**

1. **Connect the iPhone to your Mac** and open **Xcode**.
2. **Window → Devices and Simulators** → select the device → **View Device Logs**.
3. Find the most recent **crash** for “Likkle Wisdom” or “App” and open it. Note the **Exception Type** (e.g. `EXC_BAD_ACCESS`, `SIGABRT`) and **crash thread** / **stack trace**.
4. Or run the app from Xcode (**Product → Run**) with the device selected and reproduce the close; when it crashes, the **Debug navigator** and **Console** will show the exception and stack.

**Simulator:** Run from Xcode and reproduce; check the console for red errors and the stack trace when it exits.

---

## 2. Common causes and fixes

### A. Unhandled JavaScript / Promise rejections

- **Symptom:** Console shows `[unhandledrejection]` or “JS Eval error” right before the app closes (especially on older WebViews).
- **Cause:** Supabase or other async code rejects a promise and no `.catch()` handles it. On some iOS builds, severe JS errors can still take down the WebView.
- **Fix:** The app now adds `.catch()` to `getSession()`. Add `.catch()` to **every** other Supabase and async chain that only uses `.then()` (see `documentation/IOS_DEBUG_ERROR_ANALYSIS.md` for locations). Prefer `async/await` with `try/catch` in new code.

### B. Supabase session / refresh token

- **Symptom:** App doesn’t “crash” but **goes straight back to the login screen** after opening (or after a while). User may think the app “closed”.
- **Cause:** `refresh_token_not_found` or session invalid; code then calls `signOut()` and `setView('auth')`.
- **Fix:**  
  - Ensure Supabase project is correct and anon key is valid.  
  - If you want to support “offline” or long-lived sessions, review Supabase auth settings (e.g. refresh token expiry, storage).  
  - The app already handles this in code; if the problem is “kicked to login” and not a crash, no code change may be needed beyond making sure keys and project are correct.

### C. RevenueCat native crash on launch

- **Symptom:** App closes very soon after launch (splash or first screen). Crash log points to RevenueCat / Purchases framework.
- **Cause:** RevenueCat SDK can crash on init if the API key is wrong, or on certain iOS versions if the SDK is incompatible.
- **Fix:**  
  - Set a **valid** `VITE_REVENUECAT_API_KEY` in `.env` and rebuild (`npm run build` then `npx cap sync`).  
  - Update `@revenuecat/purchases-capacitor` (and UI) to the latest versions that support your iOS deployment target.  
  - **Temporary test:** Comment out or guard `initializePurchases()` so it doesn’t run on launch (e.g. only call it when user opens Settings or Premium). If the app stops closing, the issue is likely RevenueCat init; then fix the key or SDK version and re-enable.

### D. Push notifications (iOS)

- **Symptom:** Crash when the app first requests notification permission or registers for push.
- **Cause:** Misconfigured push or native exception in the push plugin.
- **Fix:** Ensure push is set up per `documentation/PUSH_NOTIFICATIONS_SETUP.md` (APNs, capabilities). If you don’t need push yet, you can delay or disable registration and see if the crash stops.

### E. Memory / WebView killed by iOS

- **Symptom:** App closes when switching back from another app or after using a heavy screen (e.g. many images).
- **Cause:** iOS killing the app due to memory pressure.
- **Fix:** Reduce memory use: smaller or lazy-loaded images, limit cached data, avoid holding large objects in JS. Use Xcode’s Memory debugger and Instruments to check usage.

### F. ErrorBoundary only catches React errors

- **Note:** The in-app `ErrorBoundary` catches **React render errors** and shows “Something went wrong” instead of a white screen. It does **not** catch native crashes or all JS errors. If the app **fully closes** (process gone), the crash is either native or a fatal WebView/JS crash; use crash logs and console as above.

---

## 3. Quick checklist

| Check | Action |
|-------|--------|
| Crash log | Get it from Xcode (Device Logs or run from Xcode) and read Exception Type + stack. |
| Session / login | If app just goes to login, it’s likely Supabase session/refresh; check keys and project. |
| getSession | App now has `.catch()` on `getSession()` to avoid unhandled rejection. |
| Other promises | Add `.catch()` to all Supabase/async chains (see IOS_DEBUG_ERROR_ANALYSIS.md). |
| RevenueCat | Valid production key in `.env`; try disabling init on launch to confirm if it’s the cause. |
| Push | Confirm APNs setup; optionally disable push registration to test. |
| Memory | Use Xcode/Instruments if crash happens after heavy use or when returning to app. |

---

## 4. Code change made in this repo

- **`src/App.tsx`:** `supabase.auth.getSession().then(...).catch(...)` was added so a failed `getSession()` (e.g. network or internal error) does not become an unhandled rejection, which can contribute to instability on iOS.

After pulling this change, rebuild and sync:

```bash
npm run build
npx cap sync ios
```

Then run from Xcode on your iOS 16 device and reproduce. If it still closes, the crash log and console output are the next step to identify the exact cause.
