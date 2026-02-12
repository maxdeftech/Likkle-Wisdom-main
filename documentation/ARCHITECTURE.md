# Likkle Wisdom — Architecture & How the App Works

This document describes how the Likkle Wisdom app works from both **front-end** and **back-end** perspectives.

---

## Table of Contents

1. [High-Level Overview](#high-level-overview)
2. [Front-End](#front-end)
3. [Back-End & Services](#back-end--services)
4. [Data Flow & State](#data-flow--state)
5. [Commented Code](#commented-code)

---

## High-Level Overview

**Likkle Wisdom** is a React 19 + TypeScript PWA that delivers:

- **Jamaican Patois quotes** and **Bible affirmations** (from in-app constants)
- **AI-generated wisdom** (Google Gemini)
- **Journal (Likkle Book)**, **cabinet (favorites)**, **feed**, **messaging**, **friends**, **alerts**

The app runs as:

- **Web/PWA** (Vite dev server, static build, optional install prompt)
- **Native iOS/Android** via Capacitor (same codebase; RevenueCat for IAP)

There is **no client-side router**. All navigation is driven by React state in `App.tsx` (`view`, `activeTab`, and overlay flags).

---

## Front-End

### Entry & Mount

| Step | What happens |
|------|----------------|
| 1 | Browser loads `index.html` (Vite entry). |
| 2 | Script loads `src/index.tsx`. |
| 3 | Global handlers: `unhandledrejection` and `error` log to console and prevent crashes (important on Android WebView). |
| 4 | Fonts (Material Symbols, Plus Jakarta Sans, Space Grotesk) are imported so icons and text render offline. |
| 5 | `ReactDOM.createRoot(document.getElementById('root')).render(...)` mounts the app inside `ErrorBoundary` and `App`. |

### Root Component: `App.tsx`

`App` holds **all global UI state** and **view routing**:

- **View:** `view` (`'splash' | 'onboarding' | 'auth' | 'main' | 'privacy' | 'terms'`) — which full-screen “page” is shown.
- **Main app:** When `view === 'main'`, the bottom tab bar is shown and `activeTab` (`'home' | 'feed' | 'discover' | 'bible' | 'book' | 'me'`) picks the main content.
- **Overlays:** Booleans control modals/overlays: `showSettings`, `showAI`, `showPremium`, `showAuthGate`, `showMessages`, `showFriendRequests`, `showAlerts`, `showFriendsList`, `isFeedModalOpen`, plus `activeCategory` (category filter view) and `publicProfileId` (public profile view).

**Flow:**

1. **Splash** → progress bar; then if no user → **Onboarding**, else → **main**.
2. **Onboarding** → **Auth** (sign up / sign in / continue as guest).
3. **Auth** → Supabase session; if session exists → **main**; otherwise user stays on Auth until sign-in or guest.
4. **main** → Renders `Home` / `Feed` / `Discover` / `BibleView` / `LikkleBook` / `Profile` based on `activeTab`. Overlays (Settings, AI Wisdom, Premium, Messages, etc.) render on top when their flags are true.
5. **privacy** / **terms** → Full-screen legal views; opened from Settings, closed via `onClose`.

**Other front-end behavior:**

- **Theme:** `isDarkMode` in state; synced to `document.documentElement.classList` and `localStorage` so dark/light persists.
- **Offline:** `isOnline` from `window` online/offline events; Supabase calls check `navigator.onLine`; content can be cached in `localStorage`.
- **Notifications:** In-app toast via `notification` state and `NotificationBanner`; optional browser/push notifications (e.g. new message, daily quote/verse).
- **Pull-to-refresh / swipe:** Handled in `App` (pull state, swipe threshold) to refresh content or switch tabs.

### Views (`src/views/`)

| View | Role |
|------|------|
| `SplashScreen` | Loading screen with progress. |
| `Onboarding` | First-time intro; leads to Auth. |
| `Auth` | Sign up, sign in, continue as guest. |
| `Home` | Main tab: featured quote, categories, links to Discover/Feed/Messages. |
| `Discover` | Browse/search quotes, iconic, Bible; category filter. |
| `Feed` | Social feed (posts from Supabase `posts` table). |
| `BibleView` | Bible verses (KJV); bookmark to cabinet. |
| `LikkleBook` | Journal entries (encrypted at rest in Supabase). |
| `Profile` | User cabinet, wisdoms, stats, settings, friends, Wisdom Creator. |
| `AIWisdom` | AI-generated Patois wisdom (Gemini). |
| `Settings` | Theme, upgrade, legal, sign out. |
| `PremiumUpgrade` | Paywall (RevenueCat). |
| `Messages` | Inbox and DMs (Supabase + local IndexedDB cache). |
| `AlertsView` | In-app alerts. |
| `CategoryResultsView` | Filtered list when a category is selected. |
| `LegalView` | Privacy policy / Terms (full-screen). |

### Components (`src/components/`)

- **BottomNav** — Tab bar (Home, Feed, Discover, Bible, Book, Me); badges for messages/friend requests; optional Friends / Wisdom Creator shortcuts.
- **ErrorBoundary** — Catches React errors so the app doesn’t white-screen.
- **FriendRequestList** — Incoming friend requests; accept/decline.
- **NavigationChatbot** — In-app chatbot (e.g. discovery help).
- **OnlineCount** — Shows online users if used.
- **PWAInstallPrompt** — Prompts to install the PWA.
- **UserBadge** — User avatar/name display.

### Styling

- **Tailwind CSS** (`tailwind.config.js`, `src/index.css`).
- Custom colors: `primary`, `jamaican-gold`, `background-dark`, etc.
- Custom z-index: `z-dropdown`, `z-sticky`, `z-overlay`, `z-modal`, `z-notification`, `z-tooltip`.
- Dark mode: `class` strategy on `<html>`.

### Build & PWA

- **Vite** (`vite.config.ts`): React plugin, PWA plugin (Workbox).
- **PWA:** `vite-plugin-pwa` — manifest, service worker, cache for Supabase, Google GenAI, fonts, etc.
- **Capacitor** (`capacitor.config.ts`): Web app is wrapped for iOS/Android; `npx cap sync` copies `dist` into native projects.

---

## Back-End & Services

The app does **not** run a custom server. “Back-end” here means **external APIs and Supabase**.

### Supabase (`src/services/supabase.ts`)

- **Role:** Auth (email/password, guest is local-only), Postgres tables, Realtime.
- **Config:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (or fallback defaults). If invalid, `supabase` is `null` and features that need it are disabled.
- **Tables used (conceptually):**  
  `profiles`, `bookmarks`, `journal_entries`, `my_wisdom`, `messages`, `friends` / friend requests, `posts`, `alerts`, push-related tables, etc.  
  RLS (Row Level Security) controls who can read/write what.

### Auth Flow

1. On load, `supabase.auth.getSession()` restores session.
2. `onAuthStateChange` listens for sign-in/sign-out.
3. If session exists: `syncUserContent(userId)` loads profile, bookmarks, journal, wisdoms, badge counts.
4. Guest: no Supabase auth; `user.isGuest === true`; writes (favorites, journal, AI, etc.) trigger auth gate.

### Google Gemini (`src/services/geminiService.ts`)

- **Role:** Generate Jamaican Patois wisdom (proverb/affirmation) from a mood.
- **Config:** `VITE_GEMINI_API_KEY` (or `GEMINI_API_KEY`) in env; baked in at build for web and native.
- **Flow:** `generatePatoisWisdom(mood)` calls Gemini (e.g. `gemini-2.0-flash`) with a JSON schema; returns `{ patois, english }`. Used by AI Wisdom view.

### RevenueCat (`src/services/revenueCat.ts`)

- **Role:** In-app purchases for premium (iOS/Android via Capacitor).
- **When:** Initialized on app load; only active on native; requires `VITE_REVENUECAT_API_KEY` for store builds.
- **Entitlement:** e.g. “Maxwell Definitive Technologies Pro”; `user.isPremium` is updated when entitlement is granted.

### Messaging (`src/services/messaging.ts`, `messageSyncService.ts`)

- **messaging.ts:** Send/receive DMs, unread count, Realtime subscription for new messages; uses Supabase `messages` table and local **IndexedDB** (idb-keyval) for cache.
- **messageSyncService.ts:** Syncs messages from Supabase to local store for cross-device consistency; mark-as-read updates in DB.

### Social (`src/services/social.ts`)

- Friend requests (send, accept, reject), list friends, friendship status.
- Used by Profile, Messages (add friend), FriendRequestList.

### Feed (`src/services/feedService.ts`)

- **Posts:** CRUD for `posts` table (e.g. text, image, video, scripture, wisdom).
- **getPosts:** Fetches recent posts (e.g. last 24h), joins with `profiles` for usernames/avatars.
- **createPost** / **deletePost** / **subscribeToFeed** for real-time updates.

### Other Services

- **wisdomService.ts** — User-created wisdoms: `my_wisdom` table (get, create, delete).
- **alertsService.ts** — In-app alerts (Supabase).
- **pushService.ts** — Push notification registration (optional; can be no-op on native to avoid issues).
- **encryption.ts** — Encrypt/decrypt journal entry title and text before sending to Supabase.

### Data Types (`src/types.ts`)

All shared TypeScript interfaces live here: `User`, `Quote`, `IconicQuote`, `BibleAffirmation`, `JournalEntry`, `ChatMessage`, `Post`, `View`, `Tab`, etc. Used across views and services.

### Constants (`src/constants.ts`)

- **CATEGORIES** — Category definitions (id, name, icon, color).
- **INITIAL_QUOTES**, **ICONIC_QUOTES**, **BIBLE_AFFIRMATIONS** — In-app content; favorites are toggled and synced to Supabase `bookmarks`.

---

## Data Flow & State

- **Single source of truth:** `App.tsx` state (and React state in child components).
- **Server state:** Fetched via services (Supabase, Gemini); results are stored in `App` state (e.g. `quotes`, `journalEntries`, `user`) or local state/cache (e.g. IndexedDB for messages).
- **Persistence:**  
  - Auth: Supabase session.  
  - Theme: `localStorage`.  
  - Cached content: `localStorage` (quotes, bookmarks, journal, wisdoms).  
  - Messages: Supabase + IndexedDB.
- **Guest:** No Supabase auth; favorites/journal/wisdoms are local until user signs in (then sync can be implemented as needed).

---

## Commented Code

The following files have **file-level JSDoc and/or line/section comments** explaining what each part does:

| File | What is commented |
|------|--------------------|
| **`src/index.tsx`** | Entry point, global error handlers, font imports, root mount. |
| **`src/types.ts`** | Every interface and type (User, Quote, ChatMessage, View, Tab, etc.). |
| **`src/services/supabase.ts`** | Env helper, client creation, null handling. |
| **`src/services/geminiService.ts`** | API key check, Gemini request, JSON response, fallbacks. |
| **`src/services/wisdomService.ts`** | getUserWisdoms, createUserWisdom, deleteWisdom. |
| **`src/services/feedService.ts`** | File purpose; fetchProfiles helper; getPosts/createPost/delete/subscribe. |
| **`src/services/messageSyncService.ts`** | Cross-device sync, throttle, IndexedDB storage. |
| **`src/constants.ts`** | CATEGORIES, ICONIC_QUOTES, BIBLE_AFFIRMATIONS, INITIAL_QUOTES sections. |

Other files (`App.tsx`, views, `BottomNav`, `messaging.ts`, `social.ts`, etc.) follow the same architecture: **App** holds state and handlers, **views** render UI, **services** talk to Supabase/Gemini/RevenueCat. To have line-by-line comments added to any other file, request that file by path.

---

## Summary

| Layer | Technology / Location |
|-------|------------------------|
| **Entry** | `index.html` → `index.tsx` → `ErrorBoundary` → `App` |
| **Routing** | No router; `view` + `activeTab` + overlay flags in `App.tsx` |
| **UI** | React 19, TypeScript, Tailwind; views in `src/views/`, shared components in `src/components/` |
| **State** | React state in `App` and children; localStorage and IndexedDB for cache |
| **Back-end** | Supabase (Auth, Postgres, Realtime), Google Gemini, RevenueCat (native IAP) |
| **Build** | Vite; PWA via Workbox; native via Capacitor |

For development commands, env vars, and native app IDs, see **AGENTS.md** and **README.md**.
