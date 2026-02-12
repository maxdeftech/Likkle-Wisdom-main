# 🚀 Deployment & Troubleshooting Guide

## Step 1: Apply Supabase SQL Migrations

### Run in Supabase Dashboard > SQL Editor

**In order, run each migration:**

```sql
-- 1. supabase_rls_initplan_fix.sql
[Copy-paste entire file]

-- 2. supabase_rls_consolidate_permissive.sql  
[Copy-paste entire file]

-- 3. supabase_posts_rls_fix.sql
[Copy-paste entire file]

-- 4. supabase_messages_rls_fix.sql
[Copy-paste entire file]

-- 5. supabase_function_search_path_fix.sql
[Copy-paste entire file]
```

### Verify in Supabase Dashboard

After each SQL runs, check:
- ✅ No error in red text
- ✅ Query executed message appears
- ✅ Run Database Linter again (Dashboard > Security Advisor > Re-run)

---

## Step 2: Build for Web/PWA

```bash
cd "/Users/maxwelldefinitivetecnologies/Documents/development/Live Projects/Testing/Likkle-Wisdom-main"

# Clean build
npm run build

# Should see:
# ✓ 144 modules transformed.
# ✓ built in X.XXs
# PWA v1.2.0 - files generated
```

### Deploy Web Version

Copy `dist/` folder to:
- Vercel
- Netlify  
- Firebase Hosting
- Your web server

---

## Step 3: Build for iOS

```bash
# Sync Capacitor after code changes
npx cap sync ios

# Open Xcode project
npx cap open ios
```

### In Xcode:

1. **Product** > **Clean Build Folder** (Cmd+Shift+K)
2. **Product** > **Run** (Cmd+R)
3. App opens in Simulator

### Check Console Logs:

Open **Xcode** > **Debug** > **Activate Console** (Cmd+Shift+Y)

Look for:
- `[Feed] Loading posts...`
- `[FeedService] Fetched X posts`
- `[MessageSyncService] Syncing messages for user:`
- Any `Error` logs

---

## Step 4: Build for Android

```bash
# Sync Capacitor
npx cap sync android

# Open Android Studio
npx cap open android
```

### In Android Studio:

1. **Build** > **Clean Project**
2. **Run** > **Run 'app'** (or Shift+F10)
3. App opens in Emulator/Device

### Check Logcat:

1. **View** > **Tool Windows** > **Logcat**
2. Filter by `likkle` or `Feed` or `MessageSync`

---

## Testing Checklist

### Test 1: Posts Feed

**On Web:**
1. Open app in browser
2. Go to **Feed** tab
3. Check console (F12) for:
   - `[Feed] Loading posts...`
   - `[FeedService] Fetched X posts`
4. If no posts:
   - Create a test post
   - Refresh page
   - Should see post now

**On iOS/Android:**
1. Run on Emulator/Simulator
2. Tap **Feed** tab
3. Check Xcode/Logcat logs (see above)
4. Same create/refresh test

### Test 2: Messages Cross-Device Sync

**Device A (Web):**
1. Sign in
2. Go to **Messages**
3. Open a conversation
4. Check console: `[MessageSyncService] Syncing messages for user: UUID`
5. Send a test message

**Device B (iOS/Android):**
1. Sign in with **same account**
2. Go to **Messages**
3. Should see conversation from Device A
4. Messages should be visible immediately
5. Check Xcode/Logcat: `[MessageSyncService] Syncing messages...`

**Device C (PWA on tablet):**
1. Same as Device B
2. All devices should see all messages

### Test 3: Name Glitching Fix

**Any Device:**
1. Go to **Settings**
2. Edit your username
3. Save
4. Disconnect internet (airplane mode)
5. Refresh app
6. Reconnect internet
7. Check if name still shows new name (should not flicker back to old)

### Test 4: AI Wisdom

**Web:**
1. Go to **AI Wisdom**
2. Pick a mood
3. Tap the crystal to generate
4. Should see wisdom quote
5. If key missing: see message "AI key not set" with instructions

---

## Troubleshooting

### Issue: Posts Still Not Showing

**Check:**
1. RLS policies applied? (Supabase Dashboard > Database > posts > RLS)
   - Should show 3 policies:
     - "Anyone can read posts" (SELECT)
     - "Users can insert own posts" (INSERT, with (select auth.uid()))
     - "Users can delete own posts" (DELETE, with (select auth.uid()))

2. Any posts exist?
   - Supabase > Database > posts table
   - Click "Browse" to see rows
   - If empty: create via UI or insert test data

3. Console logs?
   - `[FeedService] Query error: {error}` → RLS or auth issue
   - `[FeedService] Fetched 0 posts` → No data in last 24 hours
   - No logs at all → Feed component not rendering

4. Network?
   - DevTools > Network tab > look for `posts` API call
   - Should be GET request to Supabase
   - Status should be 200

### Issue: Messages Not Loading on iOS

**Check:**
1. RLS policies applied for messages table?
   - Dashboard > Database > messages > RLS
   - Policies should use `(select auth.uid())`

2. Simple queries working?
   - Check Xcode logs for query details
   - Try simpler SELECT in Supabase SQL Editor:
     ```sql
     SELECT * FROM messages 
     WHERE sender_id = '{your-user-id}' 
     LIMIT 5;
     ```

3. IndexedDB available?
   - On iOS: might be limited in WebView
   - Check logs: `[MessagingService] IndexedDB unavailable`
   - Fallback works but might be slow first time

### Issue: Messages Not Syncing Across Devices

**Check:**
1. Message sync ran?
   - Sign in on Device B
   - Check console: `[MessageSyncService] Syncing messages for user: {id}`
   - If not: check network connection

2. Same user account?
   - Verify all devices signed in with same email/account
   - Check Supabase > Auth > Users

3. 15-min sync cooldown?
   - First sync on new device: immediate
   - Subsequent syncs: only after 15 minutes
   - Can adjust in `messageSyncService.ts` line 6

### Issue: Build Fails

**Check:**
1. Dependencies installed?
   ```bash
   rm -rf node_modules
   npm install
   npm run build
   ```

2. TypeScript errors?
   ```bash
   npx tsc --noEmit
   ```

3. Env vars set?
   ```bash
   cat .env
   # Should show: VITE_GEMINI_API_KEY, VITE_SUPABASE_URL, etc.
   ```

---

## Performance Notes

- **First load:** ~5 seconds (downloads assets)
- **Message sync:** 0-2 seconds (background, doesn't block UI)
- **Posts load:** 1-2 seconds (cache on reload)
- **Message queries:** 2 separate queries now (better for iOS)

---

## Rollback Plan (if needed)

If something breaks:

1. **Revert Supabase SQL:**
   - Don't need to; RLS changes are additive (fixes)
   - Only revert if you want old .or() filter back

2. **Revert Code Changes:**
   ```bash
   git checkout src/services/messaging.ts
   git checkout src/App.tsx
   # Or revert specific lines
   ```

3. **Rebuild:**
   ```bash
   npm run build
   npx cap sync
   ```

---

## Questions?

Check these files for help:
- **Messaging logic:** `src/services/messaging.ts`
- **Message sync:** `src/services/messageSyncService.ts`
- **Posts logic:** `src/services/feedService.ts`
- **App init:** `src/App.tsx` (search for `MessageSyncService`)

Log any issues with:
- Screenshots of console logs
- Platform (iOS/Android/Web/PWA)
- Steps to reproduce
- Expected vs actual behavior

---

✅ You're ready to go live with a clean build!
