# Likkle Wisdom — Feature Overview

A detailed description of all features in the Likkle Wisdom application.

---

## 1. Overview

**Likkle Wisdom** is a React 19 + TypeScript PWA and mobile app that delivers Jamaican Patois quotes, Bible affirmations, and AI-generated wisdom. It targets web (PWA), iOS, and Android (via Capacitor). The app emphasizes Jamaican culture, language (Patois), faith (Bible/KJV), and community (friends, messaging, feed). All main content is currently free; there is no premium tier. A “Support” flow links users to the Maxwell Definitive Technologies (MDT) website.

---

## 2. Authentication & Onboarding

### 2.1 Splash & Onboarding
- **Splash screen**: Shown on first load with a progress indicator and optional message (e.g. “we deh cook up di vibes” during refresh).
- **Onboarding**: First-time users see an onboarding flow that introduces the app; completion leads to the Auth view.

### 2.2 Auth
- **Sign up / Sign in**: Email + password authentication via Supabase Auth.
- **Guest mode**: Users can continue as “Guest Seeker” to browse content without an account.
- **Profile on sign-up**: New users get a Supabase profile (username, avatar, `is_premium`, `is_admin`, `is_public`). Username and avatar can be updated later in Settings and Profile.

### 2.3 Guest vs Authenticated
- **Guests** can browse quotes, verses, Discover, and read content.
- **Restricted for guests**: Saving favorites (bookmarks), journal entries, AI Wisdom generation, messaging, friend requests, and profile edits. Tapping these shows an **Auth gate** modal prompting sign-up/sign-in.

---

## 3. Main Tabs

The bottom navigation has five tabs: **Home**, **Feed**, **Bible**, **Likkle Book**, **Me** (Profile). Users can also **swipe left/right** between tabs (disabled when overlays or modals are open).

### 3.1 Home
- **Daily content (rotating)**  
  - One **Quote of the day**, one **Wisdom of the day**, one **Verse of the day** (from Patois quotes and Bible affirmations).  
  - Content is chosen at random and persisted for 24 hours (localStorage).  
  - User can refresh a single card (quote, wisdom, or verse) or refresh all.
- **Text-to-speech (TTS)**  
  - Play/stop for the visible daily quote, wisdom, and verse (browser TTS).
- **Favorite (bookmark)**  
  - Heart icon on each daily card to save to the user’s **Saved Wisdom Cabinet** (synced to Supabase bookmarks when signed in and online).
- **Craft Yuh Own Wisdom**  
  - Card that opens the **AI Wisdom** overlay (mood-based AI Patois generation). Shows a “verified” style icon.
- **Island Vibes**  
  - Section of Jamaica/caribbean images that rotate on a timer. Tapping opens a **lightbox**; users can download the current image (or open in new tab as fallback).
- **Categories**  
  - Links to **Discover** with category filters (e.g. Big Up Yuhself, Deep Tings, Guh Hard, Cool Runnings, Iconic Wisdom, Bible Verses).
- **Visit Likkle Wisdom (web only)**  
  - When running on web, a support-style card links to **https://maxdeftech.wixsite.com/mdt-ja** with copy like “Visit Likkle Wisdom” and “Check out di Likkle Wisdom link.”
- **Header**  
  - Dark/Light theme toggle, online indicator, **Alerts** (bell with unread count), **Messages** (inbox with unread count), avatar. Tapping avatar goes to Profile.

### 3.2 Discover (“Pick Yuh Vibe”)
- **Unified search**  
  - Single search box that queries:  
    - **Categories** (name/description),  
    - **Patois quotes** (patois/english),  
    - **Bible affirmations** (reference, patois, KJV),  
    - **Iconic quotes** (text, author),  
    - **Users** (public profiles by username, via Supabase; only users with `is_public` are searchable).
- **Search results**  
  - Grouped by type (Categories, Quotes, Bible, Iconic, Users). Tapping a category opens **CategoryResultsView** (filtered quotes/iconic/bible). Tapping a user opens that user’s **public profile**.
- **Offline**  
  - When offline, an indicator shows “Viewing Stashed Library” (content from local/cache where applicable).

### 3.3 Bible (KJV)
- **Book / Chapter selection**  
  - Full KJV book list and chapter counts. User picks book and chapter; verses are fetched from bible-api.com (or from **local cache** if previously downloaded).
- **Offline reading**  
  - **Download for offline**: Per-book download caches verses (up to 10 chapters per book) in localStorage so the book can be read without network. No premium gate; available to all users.
- **Verse display**  
  - Verses listed with optional **highlight colors** (Gold, Green, Blue, Pink, None) and **notes**.
- **Bible notes**  
  - Per-verse notes and highlight color, stored in localStorage per user. A “My Bible Notes” button opens a list/search of all notes.
- **Bookmark verse**  
  - Save a verse to the **Saved Wisdom Cabinet** (bookmarks) with reference and text.
- **Text-to-speech**  
  - Play/stop for the current chapter (TTS).
- **Audio**  
  - Play chapter (audio) and stop; state is tracked so playback can be toggled.

### 3.4 Likkle Book (Journal)
- **Journal entries**  
  - List of user entries with title, date, mood emoji, and text. Entries are **encrypted** (title and body) per user before sync to Supabase; decrypted when loaded.
- **Add entry**  
  - Full-screen composer: title, mood picker (😊 😎 🔥 😌 🌱), and text. Save persists locally and syncs to Supabase when online.
- **Delete entry**  
  - Remove from list and from backend.
- **Search**  
  - Filter entries by search query (title/text).
- **Expand/collapse**  
  - Entries can be expanded to read full content.

### 3.5 Profile (“Me”)
- **Own profile**  
  - Avatar (tappable to change photo), username, **24-hour status note** (editable, expires after 24h), “member since” and **active days this month** (tracked in localStorage).  
  - Stats: **Saved** (cabinet count), **Journals**, **Friends**, **Active** (days).  
  - **Find More Wise Ones** opens Messages in “find friends” mode.  
  - **Starred messages** section: list of starred DMs with quick link to open that chat.  
  - Tabs: **Cabinet** (saved wisdom) and **My Wisdom** (user-penned wisdoms).  
  - **Pen yuh own wisdom**: add custom Patois + English wisdom (stored in `my_wisdom` and shown in Feed and on profile).  
  - Buttons: Refresh (reload app), Friend requests (with pending count), Settings.
- **Saved Wisdom Cabinet**  
  - Combined list of: saved Patois quotes, iconic quotes, Bible affirmations, and KJV verse bookmarks. Each item can be removed (own profile only). Shown for **own** profile or **public** profile (if that user’s profile is public and RLS allows).
- **My Wisdom**  
  - User-created wisdoms (Patois + English). On own profile: add, delete. On **public profile**: read-only list of that user’s public wisdoms.
- **Public profile (viewing another user)**  
  - Opened from Discover (search) or Messages/Friends (tap user). Shows their avatar, username, **admin green checkmark** if they are admin, 24h note (if any), stats (saved, journals, friends, active), **their cabinet** (if public), and **their wisdoms**. Back button closes to previous view. **Scrollable** overlay so all content can be reached.
- **Profile visibility**  
  - In Settings, users can set **“Show profile in search”** (is_public). When public, others can find them in Discover and see their cabinet and wisdoms (RLS permits read for public profiles).

---

## 4. Overlays & Modals

### 4.1 AI Wisdom
- **Mood-based generation**  
  - User picks a mood (e.g. Peace, Hustle, Joy, Healing); tapping the central “brew” area calls **Google Gemini** (gemini-2.0-flash) to generate a unique Patois proverb + English translation.
- **Requires**  
  - Signed-in user (no guest) and network. No premium check; all signed-in users can generate.
- **Result**  
  - Displayed as a quote card (Patois + English). User can create multiple wisdoms in a session.
- **Offline / guest**  
  - Offline: message that brewing needs connection. Guest: prompt to sign up.

### 4.2 Settings
- **Account**  
  - Username (inline edit), account type label (Guest User / Standard Account), **Change password** (Supabase auth), **Sign out**.
- **Preferences**  
  - **Appearance**: Dark/Light theme toggle (syncs with Home header).
- **Profile visibility**  
  - Toggle “Show profile in search” (is_public).
- **Daily notifications** (signed-in only)  
  - **Message notifications** on/off.  
  - **Quote of the day** time picker.  
  - **Verse of the day** time picker.  
  - **Wisdom of the day** time picker.  
  - Times are stored on `profiles` (e.g. `notify_quote_time`, `notify_verse_time`, `notify_wisdom_time`, `notify_messages`) for use by backend/push logic.
- **Legal**  
  - Links to **Privacy Policy** and **Terms & Conditions** (in-app Legal view).
- **Feedback**  
  - “Send Feedback” opens a Google Form in a new tab.

### 4.3 Support / “Visit our website”
- **PremiumUpgrade view** (used as Support)  
  - Message: “Full Wisdom Free” and that AI, Offline Bible, and Unlimited Journaling are unlocked for everyone.  
  - **Visit our website** button: opens **https://maxdeftech.wixsite.com/mdt-ja** in a new tab.  
  - No PayPal or payment; purely a link to MDT.

### 4.4 Messages
- **Inbox**  
  - List of friends with last message preview and unread badge. **Cache-first load**: messages are read from IndexedDB first for fast render; then synced from Supabase. Loading copy shown while cache is empty.
- **Chat**  
  - Thread with a specific friend. Messages sorted by time; **scroll to latest** on open.  
  - **Send text** and **reply to message** (replyToId stored and shown as reply preview).  
  - **Long-press** on a message: **Pin** (per-user pinned message), **Delete** (own message), **Like** (reaction), **Star** (saved to starred list).  
  - **Typing indicator**: Supabase Realtime broadcast so each user sees when the other is typing.  
  - **Mark as read** when viewing the thread.
- **Starred messages**  
  - Accessible from Profile (Favourites section); opens chat with that user.
- **Find friends**  
  - Search users (public profiles only); send **friend request** or open profile. Shows pending/accepted state.
- **Real-time**  
  - New messages and unread counts update via Supabase subscriptions so the app and badge stay in sync.

### 4.5 Friend requests
- **List**  
  - Incoming requests with requester avatar and name. Accept or ignore.  
  - Accessible from Profile (Friends button) or when opening Messages in “add friend” mode.  
  - Badge count on Profile and nav for pending requests.

### 4.6 Friends list
- **Overlay**  
  - List of accepted friends. Tap to open **chat** or **profile** (public profile view).

### 4.7 Alerts (Admin / In-app announcements)
- **AlertsView**  
  - List of **alerts** (title, message, type: info/warning/update/event, optional expiry).  
  - **Mark as read** per alert (per user); unread count in header.  
  - **Admins** can create and edit alerts (form: title, message, type, optional expiry).  
  - Real-time: new alerts appear via subscription.

### 4.8 Legal
- **Privacy** and **Terms**  
  - Full-screen legal text views with close button; opened from Settings.

### 4.9 Auth gate
- **GuestAuthModal**  
  - Shown when a guest tries a protected action (e.g. bookmark, journal, AI, messages). Offers sign-up/sign-in.

---

## 5. Feed

- **Feed tab**  
  - Timeline of **posts** from the Feed service (Supabase-backed).  
  - Post types: **text**, **image**, **video**, **scripture** (book/chapter/verse + text), **wisdom** (user’s own wisdom ref).  
  - **Create post**  
  - Modal to choose type (text, image, video, scripture, wisdom). For scripture, user picks book/chapter/verse (fetched from bible-api.com). For wisdom, user picks one of their own wisdoms. Media can be attached for image/video.  
  - New posts appear in the list via real-time subscription.

---

## 6. Content & Data

### 6.1 Content types
- **Quote**  
  - Patois + English + category; from `constants` (INITIAL_QUOTES). Can be favorited (bookmarked).
- **IconicQuote**  
  - Author + text + category “Legends”; from ICONIC_QUOTES. Can be favorited.
- **BibleAffirmation**  
  - Reference, KJV, Patois, category “Word & Powah”; from BIBLE_AFFIRMATIONS. Can be favorited.
- **Categories**  
  - e.g. Big Up Yuhself, Deep Tings, Guh Hard, Cool Runnings, Iconic Wisdom, Bible Verses; used in Discover and CategoryResultsView.
- **UserWisdom**  
  - User-created Patois + English; stored in `my_wisdom`, shown in Feed and on Profile (own + public).
- **JournalEntry**  
  - Title, date, text, mood; encrypted and stored in `journal_entries`.
- **Bookmarks**  
  - Saved quotes, iconic, bible, and KJV verses (item_id, item_type, metadata); table `bookmarks`. RLS allows read for own rows and for users whose profile is public (see supabase_public_cabinet_migration.sql).

### 6.2 Sync & offline
- **Online/offline**  
  - App listens to `online`/`offline`; Supabase calls are skipped when offline where appropriate.  
  - Local state updates immediately; sync to Supabase when back online.
- **Caching**  
  - PWA (Workbox) caches Supabase, Gemini, fonts, and ESM. Bible verses can be cached per book in localStorage after “download for offline.”  
  - Messages cached in IndexedDB for fast load and offline read.

---

## 7. Notifications & Push

- **In-app notifications**  
  - A **notification banner** (e.g. glass-style) can show a message; optional action (e.g. open Messages with a specific user). Dismiss by swipe or tap.
- **Daily notifications (backend)**  
  - Profile stores: `notify_messages`, `notify_quote_time`, `notify_verse_time`, `notify_wisdom_time`. Intended for server-side or scheduled push (quote/verse/wisdom of the day, and new messages) at the chosen times.
- **Native push (iOS/Android)**  
  - **PushService** registers the device with Capacitor Push Notifications and upserts the token into `push_tokens` (user_id, platform). Used so a backend can send native push. Web has no device token; in-app/browser only.

---

## 8. Navigation Chatbot

- **NavigationChatbot**  
  - In-app assistant that responds to keywords and can **navigate** the user (e.g. open Settings, AI Wisdom, Messages, Alerts, Support/website).  
  - Example intents: dark mode, premium/support/website, AI brew, messages, help, swipe navigation, etc.  
  - “Support” / “website” / “premium” etc. open the Support overlay (Visit our website).

---

## 9. PWA & Install

- **PWAInstallPrompt**  
  - Prompts the user to install the app when run in a browser and install is available (e.g. beforeinstallprompt). Install adds the app to home screen and runs as a standalone PWA.

---

## 10. Pull-to-refresh

- On the main scroll area (tab content), **pull down** at the top triggers a refresh flow (e.g. “Release to refresh”); on release the app can show a splash and reload (e.g. full app refresh).

---

## 11. Admin & Badges

- **Admin**  
  - Users with `profiles.is_admin = true` get a **green checkmark** badge (UserBadge) next to avatar/name in Profile and Messages. Visible to all users.  
  - Admins can create/edit **Alerts** in AlertsView.
- **No donor/premium badge**  
  - Donation and premium tiers have been removed; there is no donor or premium badge in the UI.

---

## 12. Technical Stack (Summary)

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS.  
- **State**: Centralized in App.tsx (useState); no router library — view/tab by state.  
- **Backend**: Supabase (auth, profiles, bookmarks, journal_entries, messages, friendships, feed, alerts, push_tokens, my_wisdom, etc.).  
- **AI**: Google Gemini (gemini-2.0-flash) for Patois wisdom generation.  
- **Storage**: localStorage (daily content, Bible cache, notes, active days); IndexedDB (messages cache via idb-keyval).  
- **Encryption**: Journal title and body encrypted per user before Supabase (encryption service).  
- **Native**: Capacitor for iOS/Android; app ID `com.likklewisdom.app`.  
- **PWA**: vite-plugin-pwa, Workbox for caching and offline support.

---

This document reflects the application as of the latest codebase state (no premium tier, no PayPal; Support = “Visit our website” to MDT; public cabinet/wisdoms; admin checkmark; full feature set as implemented).
