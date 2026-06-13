# iOS Emulator Debug — Error Analysis & Possible Solutions

This document outlines the issues observed when debugging the Likkle Wisdom app in the iOS emulator, their likely causes, and recommended fixes. **No code has been changed**; this is analysis and solution guidance only.

---

## 1. JavaScript exception / Unhandled promise rejections (`[unhandledrejection] {}`)

### What you see
- Console: `⚡️ JS Eval error A JavaScript exception occurred`
- Multiple: `⚡️ [error] - [unhandledrejection] {}`

### Likely causes

1. **Supabase `.single()` used without `.catch()`**  
   When a query returns zero rows, `.single()` resolves with `{ data: null, error: { code: 'PGRST116', ... } }`. In some environments or with certain Supabase versions, this can surface as a rejection. Even when it does not, other Supabase errors (network, RLS) reject the promise. If the rejection reason is a non-Error object (e.g. PostgREST error), it can stringify to `{}`.

   **Location:** `src/App.tsx` ~line 203  
   ```ts
   supabase!.from('profiles').select('username').eq('id', m.sender_id).single().then(({ data: profile }) => { ... });
   ```  
   No `.catch()`. If the sender has no profile row (or RLS denies it), this promise can reject and show up as `[unhandledrejection] {}`.

2. **Profile view effect — multiple promises without `.catch()`**  
   **Location:** `src/views/Profile.tsx` ~lines 61–104  
   The effect calls:
   - `SocialService.getFriendRequests(targetUserId).then(...)`
   - `SocialService.getUserStats(targetUserId).then(stats => { setJoinedAt(stats.createdAt); setLoadingStats(false); ... })`
   - `MessagingService.getStarredMessagesWithDetails(user.id).then(...)`
   - `SocialService.getPublicProfile(...)`, `WisdomService.getUserWisdoms(...)`, `SocialService.getPublicCabinet(...)`  
   None of these chains have `.catch()`. Any rejection (network, RLS, missing data) becomes an unhandled rejection and can log as `{}`.

3. **Other `.then()`-only chains**  
   - `App.tsx`: `MessagingService.getUnreadCount(...).then(...)`, `SocialService.getFriendRequests(...).then(...)` (e.g. ~350–351, ~409–412).  
   - `App.tsx`: `SocialService.getFriends(currentUser.id).then(...)` (~1036).  
   - `Settings.tsx`: `supabase.from('profiles').select(...).maybeSingle().then(({ data }) => ...)` (~35).  
   Same pattern: rejections are unhandled and can produce `[unhandledrejection] {}`.

### Recommended solutions
- Add `.catch(...)` to every Supabase (and other async) chain that currently only uses `.then()`, especially where `.single()` is used. Log or handle the error so the promise is never “unhandled”.
- In `index.tsx`, consider logging `event.reason` in a way that preserves structure (e.g. `JSON.stringify(event.reason)` or `console.error(..., event.reason)`) so future rejections are easier to debug.
- Prefer `async/await` with `try/catch` in new code so errors are always handled in one place.

---

## 2. RevenueCat warning

### What you see
`[warn] - RevenueCat: Set VITE_REVENUECAT_API_KEY to your production key for release builds.`

### Cause
The app (or RevenueCat SDK) checks for the production API key; in debug or when the env var is missing, it warns.

### Recommended solutions
- For **release builds** (App Store): set `VITE_REVENUECAT_API_KEY` in your build environment to the production key (see AGENTS.md / deployment docs).
- For **debug/emulator**: either set the same key in `.env` for local testing, or accept the warning and ensure release builds use the production key so App Review does not reject.

---

## 3. Gradle / Android diagnostic (IDE)

### What you see
In the IDE’s diagnostic panel, for `android/build.gradle`:  
`The specified initialization script '.../db3b08fc...gradle' does not exist.`

### Cause
This refers to a **temporary Gradle init script** (path under `/var/folders/...`). The script is created by the IDE or a plugin and then deleted; the daemon or a later run still references it. This is an **IDE/Gradle environment issue**, not an application bug.

### Recommended solutions
- Invalidate caches / restart IDE.
- From project root: `cd android && ./gradlew --stop` then reopen the project.
- If it persists, try removing the referenced temp file path from Gradle/IDE settings or updating the Gradle/Android plugin.

---

## 4. Feeds not loading

### What you see
Feed (Discover/24h posts) does not show posts or appears empty.

### Likely causes

1. **Supabase**  
   - RLS on `posts`: “Anyone can read posts” (SELECT with `true`) should allow read. If a different or stricter policy was applied, reads could fail.  
   - Table name/schema: ensure the app queries `public.posts` and that the table exists and has rows.

2. **Storage**  
   - Feed media uses bucket `post-media`. If the bucket does not exist or is private without a policy allowing read, media URLs may fail (posts could still load; only images/videos would break).

3. **Network / environment**  
   - Simulator network or Supabase URL/keys in debug build could cause requests to fail. `FeedService.getPosts()` returns `[]` on error and logs to console; check for `[FeedService] Query error:` or `[FeedService] Exception during getPosts:`.

### Recommended solutions
- In Supabase Dashboard, confirm RLS on `posts`: one SELECT policy that allows read (e.g. `USING (true)`).
- Create storage bucket `post-media` (public) if missing, and ensure upload uses the same bucket name.
- Add a minimal user-visible error state in the Feed UI when `getPosts()` returns empty and the app is online (e.g. “Couldn’t load feed” or “No posts in the last 24h”) so “not loading” is distinguishable from “empty by design”.
- Check simulator console for FeedService errors and verify `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in the build used by the emulator.

---

## 5. Friends not loading

### What you see
Friends list or friend-related UI is empty or does not update.

### Likely causes

1. **RLS or query shape**  
   `SocialService.getFriends()` runs two queries with FK joins (`profiles!receiver_id`, `profiles!requester_id`). If RLS on `friendships` or `profiles` denies the join, or the join syntax is wrong for your Supabase version, the result can be empty.

2. **Data**  
   - No rows in `friendships` with `status = 'accepted'` for the current user.  
   - Profile rows for friends are missing or RLS hides them.

### Recommended solutions
- In Supabase, check that the current user can SELECT from `friendships` (e.g. “user is requester or receiver”) and that they can SELECT the related `profiles` rows (e.g. “profiles viewable by owner or if public”).
- Temporarily log `data` and `error` from both `getFriends()` queries to see if the problem is empty data vs error.
- Ensure test users have accepted friendships and that profile rows exist for those users.

---

## 6. “Add friend” list does not show all users in the database

### What you see
When adding a friend (e.g. Messages → person+ → search/list), only a subset of users appears or the list is empty.

### Root cause (very likely)

**Location:** `src/services/social.ts`  
- `getAllUsers()` (~41–47): `.eq('is_public', true)`  
- `searchUsers()` (~14–18): `.eq('is_public', true)`  

In SQL, `NULL = true` is false. So any profile with `is_public = NULL` is **excluded** from both the “discovery” list and search. Profiles created before `is_public` existed, or rows where the column was never set, often have `NULL`.

### Recommended solutions
- **Backfill:** Run in Supabase SQL Editor:  
  `UPDATE public.profiles SET is_public = true WHERE is_public IS NULL;`
- **App logic:** Change the filter so “visible for add friend” means “public or not set”. For example, use an `or()` filter such as `is_public.eq.true` or `is_public.is.null` (syntax depends on your Supabase client). Then all existing and new users with default/null visibility will appear in the add-friend flow.

---

## 7. Alerts take a while to load

### What you see
Alerts view is slow to show content.

### Likely causes

1. **Two round-trips on open**  
   `AlertsView` calls `AlertsService.getAlerts()` and (from App) `AlertsService.getUnreadCount(user.id)`. The unread count uses RPC `get_unread_alert_count`. Sequential or slow network can make the screen feel slow.

2. **No progressive loading**  
   The UI shows a loading state until `getAlerts()` completes. If the query or RLS is slow, the whole screen waits.

3. **RPC or RLS**  
   If `get_unread_alert_count` or the alerts SELECT policy is heavy (e.g. complex subqueries), latency will increase.

### Recommended solutions
- Show a skeleton or “Loading alerts…” as soon as the view opens, and optionally show unread count or list as soon as the first response arrives (e.g. show count from cache or a fast endpoint first).
- Ensure RLS on `alerts` and `alert_reads` is simple and indexed (e.g. on `expires_at`, `user_id`, `alert_id`). Optimize `get_unread_alert_count` if needed.
- Consider loading alerts in the background when the app starts (e.g. in App.tsx) and caching them so the Alerts view opens instantly from cache and then refreshes.

---

## 8. Profile “days as member” stuck on “Joining...”

### What you see
Profile shows “Joining...” instead of “X days in wisdom” or “Xy Xm in wisdom”.

### Logic (reference)

**Location:** `src/views/Profile.tsx`  
- `memberSinceText` (~113–128): if `loadingStats` is true → “Joining...”; if `!joinedAt` → “Lifelong Seeker”; else computes days/months/years from `joinedAt`.  
- `joinedAt` and `loadingStats` are set in the same effect:  
  `SocialService.getUserStats(targetUserId).then(stats => { setFriendsCount(...); setJoinedAt(stats.createdAt); setLoadingStats(false); ... })`.

So “Joining...” persists only while `loadingStats === true`. That means either:

1. **`setLoadingStats(false)` never runs**  
   - `getUserStats` promise never resolves (e.g. request hangs), or  
   - The promise rejects before the `.then()` callback runs, and there is no `.catch()` to call `setLoadingStats(false)`.

2. **`profiles.created_at` is null**  
   - `getUserStats` returns `createdAt: profile?.created_at || null`.  
   - If the profile row has `created_at = NULL` (e.g. backfilled without that column, or column added later and not updated), then `joinedAt` becomes `null` and the UI shows “Lifelong Seeker”, not “Joining...”. So “Joining...” specifically suggests that loading never finishes (rejection or hang), not just null `created_at`.

### Recommended solutions
- Add `.catch()` to the `getUserStats().then(...)` chain and in the catch call `setLoadingStats(false)` (and optionally set `joinedAt` to `null` or a fallback). That way, even if the request fails or rejects, the UI leaves the “Joining...” state.
- Ensure every profile row has `created_at` set (e.g. backfill `UPDATE public.profiles SET created_at = COALESCE(created_at, updated_at, now()) WHERE created_at IS NULL`). This avoids “Lifelong Seeker” for old accounts and keeps semantics correct.
- If on iOS/simulator the request often hangs, add a timeout (e.g. wrap `getUserStats` in a short timeout and treat timeout as “unknown join date” and set loading false).

---

## 9. Stale avatar / old image after refresh

### What you see
After refresh or re-open, the app sometimes shows an old avatar instead of the one the user set in the app.

### Likely causes

1. **Stale session metadata**  
   **Location:** `src/App.tsx` ~443–455  
   `onAuthStateChange` sets `user` from `session.user` and `session.user.user_metadata` (e.g. `avatarUrl: prev?.avatarUrl ?? session.user.user_metadata?.avatar_url`). Auth metadata is often updated only on re-login or token refresh, so it can be stale after a profile update in the app.

2. **Order of operations**  
   `syncUserContent(session.user.id)` then runs and fetches the latest profile from `profiles` and updates `user`. If this is slow or fails, the UI can show the stale avatar from session until (or instead of) the fresh one.

3. **Caching**  
   The avatar URL might be the same after an update (e.g. same path, new file). Browsers and WebViews cache by URL; without a cache-busting query param (e.g. `?t=<updated_at>`), the old image can be shown.

### Recommended solutions
- Prefer profile-from-DB over session metadata for avatar (and username) in the UI. For example, after `syncUserContent` completes, always set `user` from the fetched profile so that any stale session data is overwritten. Avoid using `session.user.user_metadata` for avatar when a fresh profile is available.
- When building the avatar URL (or when saving it to `profiles`), add a cache-busting query parameter (e.g. `avatar_url` stored or appended as `...?t=<updated_at>` or `...?v=<version>`) so that after an update, the client requests a new image.
- Ensure `syncUserContent` always runs after auth state change and that failures are handled (e.g. retry or show a “Refresh profile” option) so the user is not stuck on stale data.

---

## 10. Messages slow to load from the database

### What you see
After tapping the messages icon, it takes a noticeable time before messages appear.

### Likely causes

1. **Waterfall requests**  
   **Location:** `src/views/Messages.tsx`  
   When opening a chat, the flow is: load from cache → then `MessagingService.getMessages(activeChatUser.id, currentUser.id)` → then for the returned messages, `getReactionsForMessages`, `getPinnedMessage`, `getStarredMessageIds`. These can run sequentially or in a way that blocks the first paint.

2. **RLS / query cost**  
   Messages and related tables (e.g. `message_reactions`, `chat_pinned_messages`, `starred_messages`) are behind RLS. Complex policies or missing indexes can make the first message query slow.

3. **No perceived progress**  
   If the UI shows nothing until the full Supabase load completes, the delay feels longer even if the backend is only moderately slow.

### Recommended solutions
- Show cached messages (or a “Loading…” state) immediately when opening a chat, and then merge in or replace with server data when `getMessages()` returns. The code already tries to show cached messages first; ensure that path is always used and that loading state is clear (e.g. “Loading more…” vs “No messages”).
- Run `getMessages`, `getReactionsForMessages`, `getPinnedMessage`, and `getStarredMessageIds` in parallel (e.g. `Promise.all`) so total wait time is dominated by the slowest call, not the sum of all.
- In Supabase, add indexes on `messages (sender_id, receiver_id, created_at)` (or the filters you use) and on foreign keys for reactions/pinned/starred if needed. Review RLS for unnecessary subqueries.

---

## Summary table

| Issue | Primary area | Main fix direction |
|-------|--------------|--------------------|
| Unhandled rejections `{}` | App.tsx, Profile.tsx, other `.then()` chains | Add `.catch()` everywhere; prefer async/await + try/catch |
| RevenueCat warning | Env / build | Set `VITE_REVENUECAT_API_KEY` for release; optional for debug |
| Gradle init script error | IDE / Gradle | Restart daemon, invalidate caches, IDE/plugin update |
| Feeds not loading | Supabase RLS, storage, network | Verify RLS and bucket; add error/empty state in UI |
| Friends not loading | RLS, data | Verify RLS and joins; log `data`/`error` from getFriends |
| Add friend list empty | `is_public` filter | Backfill `is_public`; use `is_public.eq.true` or `is_public.is.null` |
| Alerts slow | AlertsService, RPC/RLS | Skeleton loading; parallel/cached load; optimize RPC/RLS |
| “Joining...” stuck | Profile effect, getUserStats | `.catch()` and setLoadingStats(false); backfill created_at |
| Stale avatar on refresh | Session vs DB, caching | Prefer profile-from-DB; cache-bust avatar URL |
| Messages slow | Messages.tsx, Supabase | Parallel requests; indexes; show cache immediately |

---

## Next steps

1. Fix unhandled rejections first (add `.catch()` / try/catch) so that any remaining issues surface as clear errors in logs.
2. Backfill `profiles`: `is_public = true` where null, and `created_at` where null.
3. Adjust “add friend” query to include profiles with `is_public` null or true.
4. Then tackle performance (alerts, messages) and UX (loading states, cache-busting avatar).

After applying the above, re-run the app in the iOS emulator and check the console for any remaining `[unhandledrejection]` or `[FeedService]` / `[MessageSyncService]` errors to narrow down remaining issues.
