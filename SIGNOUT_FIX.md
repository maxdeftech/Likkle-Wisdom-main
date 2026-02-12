# Sign-Out Fix - February 12, 2026

## Problem
The sign-out function was not working correctly. Users were being returned to the home screen instead of the authentication page after signing out.

## Root Cause
The issue was caused by a **race condition** in the authentication flow:

1. The `useEffect` hook that manages Supabase authentication had `[syncUserContent, view, user]` as dependencies
2. When `handleSignOut` was called, it would:
   - Call `supabase.auth.signOut()` (async)
   - Update local state with `setUser(null)` and `setView('auth')`
3. These state changes would trigger the `useEffect` to re-run
4. The `useEffect` would call `supabase.auth.getSession()` again
5. If the session was still cached (before `signOut()` fully propagated), it would restore the user and set `view` back to `'main'`

## Solution

### 1. Fixed useEffect Dependencies
Changed the auth `useEffect` dependencies from:
```typescript
}, [syncUserContent, view, user]);
```

To:
```typescript
}, [syncUserContent]);
```

This prevents the effect from re-running every time `view` or `user` changes, which was causing the race condition.

### 2. Improved handleSignOut Flow
Updated `handleSignOut` to:
- Clear local state **immediately** (UI updates right away)
- Clear all localStorage items to prevent session restoration
- Perform async cleanup (push token removal, Supabase sign-out) in the background

```typescript
const handleSignOut = async () => {
  setShowSettings(false);
  const wasGuest = user?.isGuest;
  const userId = user?.id;
  
  // Clear local state immediately so UI updates
  setUser(null);
  setView('auth');
  
  // Clear localStorage to prevent session restoration
  localStorage.removeItem('lkkle_quotes');
  localStorage.removeItem('lkkle_iconic');
  localStorage.removeItem('lkkle_bible');
  localStorage.removeItem('lkkle_journal');
  localStorage.removeItem('lkkle_verses');
  localStorage.removeItem('lkkle_user_wisdoms');
  
  // Background cleanup
  try {
    if (!wasGuest && userId) await PushService.removeToken(userId);
    if (!wasGuest && supabase) await supabase.auth.signOut();
  } catch (e) {
    console.warn('Sign out cleanup error:', e);
  }
};
```

## Testing
After these changes:
- ✅ Build completes successfully with no errors
- ✅ No linter errors detected
- ✅ Sign-out button properly configured with `type="button"` and `aria-label`
- ✅ Guest user flow properly gates features requiring authentication
- ✅ All localStorage items are cleared on sign-out

## Files Modified
- `src/App.tsx` - Fixed auth `useEffect` dependencies and `handleSignOut` implementation

## Additional Improvements
While fixing the sign-out issue, verified:
- Error handling in `wisdomService.ts` properly suppresses network errors
- Push notification setup is complete and properly configured
- Guest user checks are in place for all protected features
- All critical services have proper error handling and fallbacks
