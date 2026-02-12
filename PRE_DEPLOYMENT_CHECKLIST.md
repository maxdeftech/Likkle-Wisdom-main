# ✅ Pre-Deployment Checklist

## Code Level ✓

- [x] Messages query simplified (no complex `.or()`)
- [x] Message sync service created
- [x] Message sync integrated in App.tsx
- [x] Feed logging added
- [x] Error handling for feed failures
- [x] TypeScript compiles cleanly
- [x] Build successful: `npm run build`

## Supabase Level (TODO - You Do This)

Run in Supabase Dashboard > SQL Editor:

- [ ] **Step 1:** Copy-paste `supabase_posts_rls_fix.sql` and run
- [ ] **Step 2:** Copy-paste `supabase_messages_rls_fix.sql` and run  
- [ ] **Step 3:** Copy-paste `supabase_rls_initplan_fix.sql` and run
- [ ] **Step 4:** Copy-paste `supabase_rls_consolidate_permissive.sql` and run
- [ ] **Step 5:** Copy-paste `supabase_function_search_path_fix.sql` and run
- [ ] Verify: Run Database Linter again (should have fewer warnings)

## Deployment (TODO - You Do This)

### Web/PWA
- [ ] `npm run build` (clean build, no errors)
- [ ] Upload `dist/` to:
  - [ ] Vercel, OR
  - [ ] Netlify, OR
  - [ ] Firebase Hosting, OR
  - [ ] Your web host

### iOS
- [ ] `npx cap sync ios`
- [ ] Open Xcode: `npx cap open ios`
- [ ] Product > Clean Build Folder (Cmd+Shift+K)
- [ ] Product > Run (Cmd+R)
- [ ] Simulator loads and app works

### Android
- [ ] `npx cap sync android`
- [ ] Open Android Studio: `npx cap open android`
- [ ] Build > Clean Project
- [ ] Run > Run 'app'
- [ ] Emulator/Device loads and app works

## Testing (TODO - You Do This)

### All Platforms

- [ ] **App loads** without errors
- [ ] **Messages tab:**
  - [ ] Can see conversation list
  - [ ] Can open a conversation
  - [ ] Messages load (no infinite spinner)
  - [ ] Can send a message
- [ ] **Feed tab:**
  - [ ] Can see posts (if any exist in last 24h)
  - [ ] Can create a new post
  - [ ] New post appears immediately
- [ ] **Settings tab:**
  - [ ] Can edit username
  - [ ] Edit saves (no double-flickering of name)

### Cross-Device Test

- [ ] **Device A (Web):** Sign in, send a message
- [ ] **Device B (iOS):** Sign in with same account
- [ ] **Verify:** See same message history immediately
- [ ] **Device B:** Send reply
- [ ] **Device A:** Refresh page, see reply

### Console Logs (Verify Clean Logs)

**Browser Console (F12):**
- [ ] No red errors
- [ ] Should see: `[Feed] Loading posts...`
- [ ] Should see: `[FeedService] Fetched X posts`
- [ ] Should see: `[MessageSyncService] Syncing messages...`

**iOS Console (Xcode):**
- [ ] No red errors
- [ ] Same logs as browser

**Android Logcat:**
- [ ] No red errors
- [ ] Same logs as browser

## Performance Check

- [ ] **Web load time:** < 5 seconds
- [ ] **Message load:** < 2 seconds  
- [ ] **Posts load:** < 2 seconds
- [ ] **Cross-device sync:** < 3 seconds on login

## Rollback Plan (if needed)

If something breaks during testing:

1. Check console logs (see what error)
2. Read DEPLOYMENT_GUIDE.md troubleshooting section
3. If needed: revert to previous version
   ```bash
   git checkout HEAD~1  # or specific commit
   npm run build
   npx cap sync
   ```

## Final Approval

- [ ] All code changes look good
- [ ] All SQL migrations run successfully  
- [ ] All tests pass on all platforms
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Ready to deploy to production

---

## Deployment Checklist (After Testing)

### Before Going Live

- [ ] Backup current Supabase database
- [ ] Notify users of maintenance window (if needed)
- [ ] Have rollback plan ready

### Deploy

- [ ] Deploy Web version to production
- [ ] Deploy iOS build to TestFlight / App Store
- [ ] Deploy Android build to Play Store
- [ ] Update app version numbers if needed

### After Deploy

- [ ] Verify production web loads
- [ ] Monitor error logs for 24 hours
- [ ] Test all features one more time
- [ ] Document any issues for future reference

---

## Questions Before Deploying?

Check these files:
- `README_FIXES.md` - High-level overview
- `FIXES_SUMMARY.md` - Detailed technical analysis
- `DEPLOYMENT_GUIDE.md` - Step-by-step deployment + troubleshooting

---

**You're ready to deploy! 🚀**

Once you complete this checklist, you'll have:
✅ Clean code that compiles
✅ Fixed database RLS policies  
✅ Fully tested on all platforms
✅ Production-ready app

**Estimated time:** 30-45 minutes for full deployment
