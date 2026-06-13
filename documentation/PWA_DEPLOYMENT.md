# PWA Deployment & Testing Guide

This guide covers deploying and testing your Likkle Wisdom Progressive Web App on iOS and Android devices.

## 🚀 Deployment Options

Your PWA **must be served over HTTPS** to work properly. Here are three recommended hosting options:

### Option 1: Vercel (Recommended - Already Configured)

You already have a `vercel.json` in your project, so deployment is straightforward:

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Deploy to production
vercel --prod
```

**Automatic Deployment:**
- Connect your GitHub repository to Vercel
- Every push to `main` branch will auto-deploy
- Get instant HTTPS URL

### Option 2: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build your project
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

**Or use Netlify Drop:**
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag and drop your `dist` folder
3. Get instant HTTPS URL

### Option 3: GitHub Pages

```bash
# Install gh-pages
npm install -D gh-pages

# Add to package.json scripts:
# "deploy": "npm run build && gh-pages -d dist"

# Deploy
npm run deploy
```

**Configure base path in `vite.config.ts`:**
```typescript
export default defineConfig({
  base: '/your-repo-name/',
  // ... rest of config
});
```

---

## 📱 Testing on iOS (iPhone/iPad)

### Prerequisites
- iOS device with Safari
- Deployed PWA on HTTPS URL

### Installation Steps

1. **Open Safari** on your iOS device
2. **Navigate** to your deployed PWA URL (e.g., `https://your-app.vercel.app`)
3. **Tap the Share button** (square with arrow pointing up) at the bottom of the screen
4. **Scroll down** and tap **"Add to Home Screen"**
5. **Edit the name** if desired (default: "Likkle Wisdom")
6. **Tap "Add"** in the top right

### Verification Checklist

✅ **App Icon Appears:** Check your home screen for the Likkle Wisdom icon  
✅ **Standalone Mode:** Launch the app - it should open WITHOUT Safari's address bar  
✅ **Status Bar:** Should show black-translucent status bar (time/battery)  
✅ **Splash Screen:** Brief splash screen on launch with app icon  

### Testing Offline Mode

1. **Open the installed app** from your home screen
2. **Use the app** for a few seconds (let it cache content)
3. **Enable Airplane Mode** (swipe down from top-right, tap airplane icon)
4. **Close and reopen** the app
5. **Verify:** App should still load and show cached content

---

## 🤖 Testing on Android

### Prerequisites
- Android device with Chrome
- Deployed PWA on HTTPS URL

### Installation Steps

1. **Open Chrome** on your Android device
2. **Navigate** to your deployed PWA URL
3. **Look for install prompt:**
   - Chrome may show an automatic "Install app" banner at the bottom
   - OR tap the **three-dot menu** (⋮) → **"Install app"** or **"Add to Home screen"**
4. **Tap "Install"** in the prompt
5. **App installs** and icon appears on home screen/app drawer

### Verification Checklist

✅ **App Icon Appears:** Check home screen or app drawer  
✅ **Standalone Mode:** Launch the app - it should open as a standalone app  
✅ **No Browser UI:** No Chrome address bar or navigation buttons  
✅ **Theme Color:** Status bar should match theme color (#f7df1e)  

### Testing Offline Mode

1. **Open the installed app**
2. **Use the app** for a few seconds
3. **Enable Airplane Mode** (swipe down, tap airplane icon)
4. **Close and reopen** the app
5. **Verify:** App should still load with cached content

---

## 🧪 Testing in Desktop Browser

### Chrome DevTools Testing

1. **Build and preview:**
   ```bash
   npm run build
   npm run preview
   ```

2. **Open Chrome DevTools** (F12 or Cmd+Option+I)

3. **Check Application Tab:**
   - **Manifest:** Should show "Likkle Wisdom" with icons
   - **Service Workers:** Should show "activated and running"
   - **Cache Storage:** Should show cached assets

4. **Test Offline:**
   - Open **Network tab** in DevTools
   - Check **"Offline"** checkbox
   - Refresh the page
   - App should still load

5. **Lighthouse Audit:**
   - Open **Lighthouse tab** in DevTools
   - Select **"Progressive Web App"**
   - Click **"Analyze page load"**
   - Should score 90+ for PWA

---

## 🔍 Troubleshooting

### PWA Not Installing on iOS

**Issue:** "Add to Home Screen" doesn't show the app  
**Solutions:**
- Ensure you're using **Safari** (not Chrome or other browsers)
- Check that site is served over **HTTPS**
- Clear Safari cache: Settings → Safari → Clear History and Website Data

### PWA Not Installing on Android

**Issue:** No install prompt appears  
**Solutions:**
- Ensure you're using **Chrome** (or Chromium-based browser)
- Check that site is served over **HTTPS**
- Verify manifest is valid: Open DevTools → Application → Manifest
- Try manually: Menu (⋮) → "Install app"

### Service Worker Not Registering

**Issue:** Service worker shows as "waiting" or not activated  
**Solutions:**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear cache and hard reload
- Check browser console for errors
- Ensure `registerSW.js` is loaded in your HTML

### Offline Mode Not Working

**Issue:** App doesn't load when offline  
**Solutions:**
- Visit the app while online first (to cache assets)
- Check Service Worker is "activated" in DevTools
- Verify cache storage has entries
- Check browser console for cache errors

### Icons Not Showing

**Issue:** Default browser icon instead of app icon  
**Solutions:**
- Verify icons exist at `/public/icons/icon-192x192.png` and `icon-512x512.png`
- Check icons are copied to `dist/icons/` after build
- Clear browser cache and reinstall app
- Verify manifest.webmanifest has correct icon paths

---

## 📊 PWA Features Summary

Your Likkle Wisdom PWA now includes:

✅ **Installable** - Add to home screen on iOS and Android  
✅ **Offline Support** - Works without internet connection  
✅ **Service Worker** - Caches assets and API responses  
✅ **App Manifest** - Proper metadata for installation  
✅ **iOS Optimized** - Apple-specific meta tags  
✅ **Auto-Update** - Service worker updates automatically  
✅ **Smart Caching** - Network-first for APIs, cache-first for static assets  

### Caching Strategy

- **Static Assets** (JS, CSS, HTML, images): Pre-cached on install
- **Google Fonts**: Cache-first (1 year expiration)
- **Tailwind CDN**: Cache-first (30 days)
- **ESM Modules**: Cache-first (30 days)
- **Supabase API**: Network-first with 24-hour cache fallback
- **Google GenAI API**: Network-first with 24-hour cache fallback

---

## 🎯 Next Steps

1. **Deploy to production** using one of the methods above
2. **Test on real devices** (iOS and Android)
3. **Share the URL** with users for installation
4. **Monitor performance** using Lighthouse and analytics
5. **Update regularly** - service worker will auto-update users

---

## 📝 Quick Reference Commands

```bash
# Development with PWA
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Deploy to Vercel
vercel --prod

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

---

## 🔗 Useful Resources

- [PWA Builder](https://www.pwabuilder.com/) - Test your PWA
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Audit PWA quality
- [Can I Use PWA](https://caniuse.com/web-app-manifest) - Browser compatibility
- [Workbox Documentation](https://developers.google.com/web/tools/workbox) - Service worker library
