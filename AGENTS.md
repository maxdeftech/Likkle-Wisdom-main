# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Likkle Wisdom is a React 19 + TypeScript PWA/mobile app that delivers Jamaican Patois quotes, Bible affirmations, and AI-generated wisdom. It uses Capacitor for iOS/Android builds.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # TypeScript compile + Vite production build
npm run preview      # Preview production build locally
```

### Capacitor (Mobile)

```bash
npx cap sync         # Sync web assets to native projects
npx cap open ios     # Open Xcode project
npx cap open android # Open Android Studio project
```

Build web first (`npm run build`) before syncing to native platforms.

## Architecture

### Entry Points
- `index.html` → `src/index.tsx` → `src/App.tsx`
- App.tsx manages all top-level state and view routing via `useState<View>` (no router library)

### Views (`src/views/`)
Each view is a full-screen React component. Navigation is controlled by `activeTab` state in App.tsx:
- `Home`, `Discover`, `BibleView`, `LikkleBook` (journal), `Profile` - main tabs
- `Auth`, `Onboarding`, `SplashScreen` - auth flow
- `AIWisdom`, `Settings`, `PremiumUpgrade`, `Messages` - overlays/modals

### Services (`src/services/`)
- `supabase.ts` - Auth, profiles, bookmarks, journal entries sync. Falls back gracefully if credentials missing.
- `geminiService.ts` - AI wisdom generation via `@google/genai`. Uses `process.env.API_KEY`.
- `revenueCat.ts` - In-app purchases for iOS/Android via Capacitor plugin. Only initializes on native platforms.
- `messaging.ts`, `social.ts` - Friend requests and messaging features.

### State Management
All state lives in App.tsx using React hooks. Key state:
- `user: User | null` - Auth state, includes `isGuest`, `isPremium`
- `quotes`, `iconicQuotes`, `bibleAffirmations` - Content arrays from `constants.ts`
- `journalEntries`, `bookmarkedVerses` - User data synced with Supabase

### Data Types
All TypeScript interfaces are in `src/types.ts`: `User`, `Quote`, `IconicQuote`, `BibleAffirmation`, `JournalEntry`, `ChatMessage`, etc.

### Styling
- Tailwind CSS with custom config in `tailwind.config.js`
- Custom colors: `primary` (#13ec5b green), `jamaican-gold` (#f4d125), `background-dark` (#0a1a0f)
- Custom z-index scale: `z-dropdown`, `z-sticky`, `z-overlay`, `z-modal`, `z-notification`, `z-tooltip`
- Dark mode enabled via `class` strategy

### PWA Configuration
PWA is configured in `vite.config.ts` using `vite-plugin-pwa`. Workbox handles caching for:
- Supabase API responses
- Google Generative Language API
- Google Fonts
- ESM modules from esm.sh

## Key Patterns

### Guest vs Authenticated Users
Guest users can browse content but actions like saving favorites, journaling, or using AI trigger `showAuthGate` modal. Check `user?.isGuest` before allowing writes.

### Offline Support
App tracks `isOnline` state via window events. Supabase operations check `navigator.onLine` before attempting. Local state updates immediately; sync happens when online.

### Content Categories
Defined in `src/constants.ts` as `CATEGORIES`. Each content type (`Quote`, `IconicQuote`, `BibleAffirmation`) maps to a category for filtering.

## Environment Variables

- `API_KEY` or `GEMINI_API_KEY` - Google Generative AI key for the AI wisdom feature
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` - Optional, has fallback defaults in code

## Native App IDs
- iOS/Android: `com.likklewisdom.app` (see `capacitor.config.ts`)
- RevenueCat entitlement: `"Maxwell Definitive Technologies Pro"`
