# Likkle Wisdom — Full App Specification for AI (Flutter)

This document is a **detailed prompt for an AI** (or developer) to implement or modify the Likkle Wisdom app **in Flutter**. It describes every page, every button, layout rules, user flow, glass theme, chatbot behavior, and code patterns. Use it when building the Flutter app, adding screens, or ensuring consistency with the reference design.

---

## 1. Tech Stack & Code Patterns (Flutter)

- **Framework:** Flutter (Dart). Use a single **app-level state** for routing and global data (e.g. `ChangeNotifier`, `Riverpod`, or `Bloc`). Do **not** use a separate router package for top-level flow if you keep one source of truth for `View` and `Tab`.
- **Navigation:** Represent flow with an enum `View` (splash, onboarding, auth, main, privacy, terms) and `Tab` (home, discover, bible, book, me). When `View.main`, show content by `Tab` (e.g. `IndexedStack` or `PageView` for tab body). Overlays (Settings, AI, Premium, Alerts, Public Profile) are full-screen routes or stacked on top of the main scaffold (e.g. `Navigator.push` or overlay stack). Use **GoRouter** with state-based redirects, or a single `MaterialApp` with a state-driven `home`/`builder` that returns the current screen.
- **State management:** One central store (e.g. `AppState` extending `ChangeNotifier`) holding: `View view`, `Tab activeTab`, `User? user`, `List<Quote> quotes`, `List<JournalEntry> journalEntries`, `bookmarkedVerses`, `userWisdoms`, `bool showSettings`, `showAI`, `showPremium`, `showAlerts`, `showAuthGate`, `String? activeCategory`, `String? publicProfileId`, `bool isDarkMode`, `bool isOnline`, `String searchQuery`, `NotificationPayload? notification`, `int unreadAlertsCount`. Notify listeners on change; widgets consume via `Provider`/`Consumer` or `context.watch<AppState>()`. Pass callbacks (e.g. `onTabChange`, `onOpenAI`) that update this state.
- **Env / config:** Use `--dart-define=GEMINI_API_KEY=...` or `flutter_dotenv` (`.env` with `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `REVENUECAT_API_KEY`). Read in main or a config service; no `VITE_` prefix.
- **Backend:** `supabase_flutter`. Auth, profiles, bookmarks, journal_entries, push_tokens, alerts. Before writes, check connectivity (e.g. `connectivity_plus` or Supabase retry); support offline reads from local cache (`shared_preferences`, `hive`, or `isar`).
- **Local cache:** Replace “localStorage” with `shared_preferences` (or Hive/Isar) for: cached quotes/bookmarks/journal/userWisdoms, theme, last daily update. Key names can mirror web (e.g. `lkkle_quotes`, `lkkle_journal`, `theme`).
- **Platform:** Use `Theme.of(context).platform` or `Platform.isIOS`/`Platform.isAndroid` for platform-specific behavior (e.g. RevenueCat only on iOS/Android; safe area handling).
- **Types / models:** Define in `lib/models/` or `lib/types.dart`: `User`, `Quote`, `IconicQuote`, `BibleAffirmation`, `JournalEntry`, `View`, `Tab`, `NotificationPayload`, etc. Use `fromJson`/`toJson` for Supabase and cache.
- **Icons:** Use `Icons.*` (Material) or a custom font package for “Material Symbols Outlined” if you want pixel-perfect match; otherwise map to closest Material icons (e.g. `Icons.home`, `Icons.menu_book`, `Icons.edit_note`, `Icons.person`, `Icons.auto_awesome`, `Icons.notifications`).
- **Safe areas:** Wrap root or per-screen content in `SafeArea`; for bottom nav use `Padding(padding: EdgeInsets.only(bottom: MediaQuery.paddingOf(context).bottom))`.
- **Responsive / desktop:** Use `LayoutBuilder` or `MediaQuery.sizeOf(context).width`. When `width >= 1024`, use `ConstrainedBox(maxWidth: 1024, minWidth: 640)` for main content; otherwise full width (e.g. `maxWidth: 672` for mobile). Center with `Center` or `Align`.

---

## 2. Glass Theme & Styling Rules (Flutter)

**Glass effect (required for cards, nav, modals):**
- Implement with `ClipRRect` + `BackdropFilter` + `ImageFilter.blur(sigmaX: 16, sigmaY: 16)` and a `Container`/`DecoratedBox` with:
  - **Dark theme:** `color: Colors.white.withOpacity(0.05)`, `border: Border.all(Colors.white.withOpacity(0.1))`.
  - **Light theme:** `color: Colors.black.withOpacity(0.03)`, `border: Border.all(Colors.black.withOpacity(0.1))`.
- Create a reusable widget e.g. `GlassCard` or `GlassContainer` that takes `child`, `borderRadius`, and optionally `padding`. Use for: bottom nav bar, notification banners, quote/category cards, settings sections, auth form container, onboarding cards, chatbot panel.
- **Glass-gold:** Same pattern with `color: Color(0xFFf4d125).withOpacity(0.1)`, `border: Border.all(Color(0xFFf4d125).withOpacity(0.3))`, blur sigma 8. Use for offline “stashed library” badge.
- **Colors (define in `AppColors` or `ThemeData`):**
  - `primary` = `Color(0xFF13ec5b)`
  - `jamaicanGold` = `Color(0xFFf4d125)`
  - `backgroundDark` = `Color(0xFF0a1a0f)`
  - Slate equivalents: `Color(0xFF0f172a)` (slate-900), `Color(0xFF64748b)` (slate-500), etc.
- **Backgrounds:** `jamaicaGradient` = `LinearGradient` (dark: green → black → gold → primary; light: mint → cream → lime). Use as full-screen `Container` or `DecoratedBox` with low opacity. `cosmicBg` = `RadialGradient` (dark green) for AI/Premium screens.
- **Buttons:** Primary CTA: `ElevatedButton` or custom `Container` with `primary` background, `backgroundDark` text, `fontWeight: FontWeight.w900`, `letterSpacing`, `borderRadius: 16` or `24`, `padding` vertical 16–20; add `scaleDown` on tap (e.g. `AnimationController` or `InkWell` scale). Secondary: same shape with `GlassContainer` as background.
- **Text hierarchy:** Section labels: `fontSize: 9–10`, `fontWeight: FontWeight.w900`, `letterSpacing`, color `Colors.white.withOpacity(0.4)` (dark) or slate-400. Headings: `fontWeight: FontWeight.w900`, color `Colors.white` / `Colors.black87`. Body: `fontSize: 14`, color with opacity 0.6–0.7.
- **Border radius:** Cards `BorderRadius.circular(24)` or `32`; buttons `16` or `24`; pills `20` or `999`.
- **Animations:** Use `AnimationController` + `Tween` or `AnimatedOpacity`/`AnimatedContainer` for fade-in, float (translateY), slow spin, pop (scale). For “active” states (e.g. tab), scale 1.1 and primary color.
- **Scrollbars:** Use `ScrollConfiguration` with `ScrollbarThemeData` to hide or minimal scrollbar on `ListView`/`SingleChildScrollView` if desired.
- **Theme:** Define `ThemeData.dark()` with `scaffoldBackgroundColor: backgroundDark`, `colorScheme: ColorScheme.dark(primary: primary, ...)`, and `textTheme` with Plus Jakarta Sans (add font to `pubspec.yaml` and reference in `fontFamily`). Toggle dark/light with `MaterialApp(theme: isDark ? darkTheme : lightTheme)`.

---

## 3. User Flow (High Level)

1. **Splash** (`view == View.splash`) → Progress 0–100%; when done, if no user → **Onboarding**, else → **Main**.
2. **Onboarding** (`view == View.onboarding`) → 3 steps; **Close** or **Next** / **GET STARTED** → **Auth**.
3. **Auth** (`view == View.auth`) → Sign In / Sign Up / Forgot / Verify OTP / Continue as Guest. On success → set user, `syncUserContent(user.id)`, `setView(View.main)`.
4. **Main** (`view == View.main`) → Content by `activeTab`: home | discover | bible | book | me. Bottom nav visible; overlays (Settings, AI, Premium, Alerts, Public Profile) shown on top via navigation or overlay stack.
5. **Overlays:** Full-screen routes or overlays; closing does not change tab unless overlay triggers navigation (e.g. chatbot “Take me deh”).
6. **Legal:** `view == View.privacy` or `View.terms` → LegalScreen; **Back** → `setView(View.main)`.
7. **Category:** When `activeCategory != null`, show CategoryResultsScreen instead of tab content; **Back** clears `activeCategory`.
8. **Guest vs authenticated:** Guests browse Home, Discover, Bible. Saving favorites, journal, AI wisdom, or “Create Wisdom” opens **Auth Gate** (Sign Up / Keep Browsing) unless signed in.

---

## 4. Screens and Widgets — Layout and Buttons

### 4.1 SplashScreen

- **When:** `view == View.splash`.
- **Layout:** Full-screen `Scaffold(backgroundColor: Colors.grey[900])`. Center: logo (two icons, primary color, floating animation), “Likkle Wisdom” title, “Daily Patois Affirmations” subtitle. Bottom: message text (“A load up di wisdom...” / “Wisdom ready now!”), `LinearProgressIndicator` (primary color, value: progress/100), “Initializing...” / “Ready” and percentage.
- **No buttons.** Progress driven by timer in app state; at 100%, state switches view after 500 ms.
- **Params:** `progress`, optional `message` (e.g. manual refresh text).

---

### 4.2 OnboardingScreen

- **When:** `view == View.onboarding`, no user.
- **Layout:** `Scaffold(backgroundColor: backgroundDark)`, `SafeArea`. AppBar or custom header: **Back** (IconButton Icons.chevron_left, only step 2–3), “Step X of 3”, **Close** (Icons.close). Body: step content (illustration + text). Footer: dot indicators (1–3), one **NEXT** or **GET STARTED** button (glass style, primary border, full width).
- **Buttons:** **Back** → decrement step if step > 1. **Close** → `onFinish()` → set view to Auth. **NEXT / GET STARTED** → if step < 3 increment step else `onFinish()`.
- **Steps:** 1 = “Wa Gwan!”; 2 = “Learn & Grow”; 3 = “Write Your Journey”. Use `GlassContainer` and primary/gold accents.

---

### 4.3 AuthScreen

- **When:** `view == View.auth`.
- **Layout:** `SingleChildScrollView`, padding 24, bottom padding 48. Header text: “Join di / Back to **Likkle Wisdom**”. One `GlassContainer` (borderRadius 24, padding 32) with: sign in/up form, forgot-password form, verify-OTP form, or “reset email sent”.
- **Buttons:** **Sign In** → submit email+password; success → fetchProfileAndComplete → onAuthComplete(user). **Sign Up** → same; if confirmation required switch to verify mode. **Forgot Password?** → switch to forgot; submit email → resetPasswordForEmail → reset_sent. **Verify** → OTP + VERIFY CODE; success → onAuthComplete. **Resend** (when timer 0) → resend; set 120s timer. **BACK TO SIGN IN** → setMode signin. Toggle link signin/signup. **CONTINUE AS GUEST** → onAuthComplete(guestUser). Errors in red-tinted glass box at top.

---

### 4.4 HomeScreen

- **When:** `activeTab == Tab.home`, `view == View.main`.
- **Layout:** Padding 24 (40 on larger), bottom 96. Header row: CircleAvatar (tap → onTabChange(me)), theme switch, “Wha Gwan, {firstName}”, OnlineCount; then Explore and Alerts IconButtons. Daily section: segmented control or chips [Quote | Wisdom | Verse]; one large `GlassContainer` with quote/verse text, **Reveal Meaning**; after reveal: English in glass box, **Listen** (TTS), **Save** (favorite). Refresh icon top-right. **Visit Likkle Wisdom** CTA (gradient gold→primary). Island Vibes: grid of first 3 categories. Island image section with **Craft Yuh Own Wisdom** → onOpenAI(). Image viewer: fullscreen with Close, Save, Prev/Next.
- **Buttons:** Avatar → onTabChange(me). Theme → onToggleTheme. Explore → onTabChange(discover). Alerts → onOpenAlerts(); badge if unreadAlertsCount > 0. Quote/Wisdom/Verse chips → set activeDaily, reset reveal. Reveal Meaning → set reveal true. Listen → TTS for current text. Save → onFavorite(id, quote|bible). Refresh → refresh single daily item. Visit Likkle Wisdom → `launchUrl('https://likklewisdom.com/')`. Category tiles → onTabChange(discover) + onCategoryClick(cat.id). Craft Yuh Own Wisdom → onOpenAI(). Image viewer: open/close, download, prev/next.
- **Offline:** Show “Signal Low” banner (app-level); island section overlay when !isOnline.

---

### 4.5 DiscoverScreen

- **When:** `activeTab == Tab.discover`.
- **Layout:** Header “Wisdom Market”, “Pick Yuh Vibe”. `TextField` (search). When query length >= 2: search results (Categories, Quotes, Bible, Iconic) or “No results”. Else: grid of CATEGORIES (glass cards), horizontal “Iconic Wisdom” list, “Daily Featured” glass card.
- **Buttons:** Search → update searchQuery. Category card → onCategoryClick(cat.id). Offline: glass-gold “Viewing Stashed Library” badge.

---

### 4.6 BibleScreen

- **When:** `activeTab == Tab.bible`.
- **Layout:** Book/chapter dropdown or picker; verse list; per verse: text, **Bookmark**, **Listen**, **Note/Highlight** (open note sheet/dialog). Optional download for offline.
- **Buttons:** Book/chapter → load verses. Bookmark → onBookmark(verse). Listen → TTS. Note → open editor; save/delete; store in shared_preferences/Hive keyed by user. Upgrade → onUpgrade().

---

### 4.7 LikkleBookScreen (Journal)

- **When:** `activeTab == Tab.book`.
- **Layout:** Header “Your Journey”, “Likkle Book”; FAB **+**. List of entries (glass cards): title, mood, date, snippet; expand for full text; **Delete** on own. Add form (full-screen or bottom sheet): title, mood picker (😊😎🔥😌🌱), text field; **Cancel**, **Save Move**.
- **Buttons:** FAB → show add form (guests → Auth Gate). Cancel → close form. Save Move → onAdd(title, text, mood); close (guests → Auth Gate). Expand/collapse → toggle expandedId. Delete → onDelete(id). Encryption before Supabase insert; decrypt on load.

---

### 4.8 ProfileScreen (Me)

- **When:** `activeTab == Tab.me` or overlay when viewing another user (`publicProfileId`).
- **Layout:** Header: back (if other user), avatar, username, member-since, **Settings**. Tabs: Cabinet | My Wisdom. Cabinet: saved quotes/iconic/bible/KJV; each **Remove**. My Wisdom: list + **Add** form (patois, english); **Delete** per item. Stats (journal count, cabinet count, active days); tap stat → onStatClick(tab). Optional status note.
- **Buttons:** Back → onClose(). Settings → onOpenSettings(). Cabinet/My Wisdom tabs. Remove bookmark → onRemoveBookmark(id, type). Add Wisdom → onAddWisdom(patois, english) (guests → Auth Gate). Delete Wisdom → onDeleteWisdom(id). Refresh → onRefresh() if provided.

---

### 4.9 AIWisdomScreen (overlay)

- **When:** showAI == true.
- **Layout:** Full-screen, cosmicBg. AppBar: Back, “AI Wisdom”, icon. If offline: “No Signal, No Magic”. If guest: “Wisdom is for di Family” + **Sign Up Fi Access** (→ Auth Gate). Else: mood chips, central “brew” circle (tap to generate), **Generate AI Wisdom**; result in glass card (Patois + English).
- **Buttons:** Back → onClose(). Sign Up Fi Access → onGuestRestricted(). Mood chip → setMood. Brew / Generate → call Gemini (generatePatoisWisdom(mood)); show “AI key not set” if missing. Use `--dart-define` or env for API key.

---

### 4.10 SettingsScreen (overlay)

- **When:** showSettings && user != null.
- **Layout:** Full-screen; AppBar Back, “Settings”, avatar. Sections: Visit Likkle Wisdom, Support (native only); Account (username edit, change password, feedback); Daily notifications (time pickers); Legal (Privacy, Terms); Sign Out.
- **Buttons:** Back → onClose(). Visit Likkle Wisdom → launchUrl. Support → RevenueCat presentPaywall (native). Username Save → onUpdateUser({ username }). Change password → Supabase updateUser. Feedback → launchUrl (Google Form). Notification times → save to Supabase profiles. Privacy/Terms → onOpenPrivacy/onOpenTerms. Sign Out → clear user, push token, prefs; setView(auth).

---

### 4.11 PremiumUpgradeScreen (overlay)

- **When:** showPremium == true.
- **Layout:** Full-screen, cosmicBg. AppBar Close, “Support”. Glass card “Full Wisdom Free”, **Visit our website** (maxdeftech Wix).
- **Buttons:** Close → onClose(). Visit website → launchUrl.

---

### 4.12 AlertsScreen (overlay)

- **When:** showAlerts && user != null.
- **Layout:** AppBar Back, “Alerts”. List of alerts; **Mark as read**; admin **Create**/Edit/Delete.
- **Buttons:** Back → onClose(). Mark as read → AlertsService.markAlertAsRead; onUnreadUpdate(). Create/Edit modal; Delete with confirm. Realtime subscription for new alerts.

---

### 4.13 CategoryResultsScreen

- **When:** activeCategory != null.
- **Layout:** AppBar Back, category name/description. List of items; each **Favorite**.
- **Buttons:** Back → onClose() (clear activeCategory). Favorite → onFavorite(id, type).

---

### 4.14 LegalScreen (Privacy / Terms)

- **When:** view == View.privacy or View.terms.
- **Layout:** AppBar Back; scrollable body with static text.
- **Buttons:** Back → setView(View.main).

---

### 4.15 BottomNav

- **When:** user != null && view != View.auth.
- **Layout:** Fixed bottom, `GlassContainer` bar, rounded top corners. Icons: Home, Bible, Journal, Profile; divider; **Create** (edit_square). Active tab: primary color, scale 1.1.
- **Buttons:** Home/Bible/Journal/Profile → onTabChange(tab). Create → onOpenWisdomCreator() (open Profile with My Wisdom tab and Add form).

---

### 4.16 GuestAuthGate (dialog / overlay)

- **When:** showAuthGate == true.
- **Layout:** Modal barrier + centered glass card: icon person_add, “Join di Family!”, **Sign Up / Sign In**, **Keep Browsin'**.
- **Buttons:** Sign Up / Sign In → close gate, setView(auth). Keep Browsin' → setShowAuthGate(false).

---

### 4.17 NotificationBanner

- **When:** notification != null.
- **Layout:** Fixed top, SafeArea; glass pill, icon (verse → menu_book else notifications), message. Auto-dismiss ~3s; swipe up or tap to dismiss; tap runs onTap then dismiss. Single tappable area.

---

### 4.18 PWA / Install prompt

- **Flutter web:** Use a package or custom logic to show “Install app” banner; Install / Dismiss. For mobile Flutter, this is not used (app is native).

---

## 5. Navigation Chatbot — Likkle Guide

- **When:** User set and not on auth screen. Floating **FAB** or **InkWell** bottom-right (e.g. 24 from bottom nav), above bottom bar.
- **Button:** Primary when closed; when open show close icon (e.g. rotate or swap). Toggle open/close.
- **Panel:** When open, `GlassContainer` (~320×450), rounded 24. Header “Likkle Guide”, “Online fi help”. `ListView` of messages: user (right, primary bubble), AI (left, glass bubble). Each AI message: **Listen** (TTS), **Take me deh** (if action present). Input row: Mic button (voice), `TextField`, Send.
- **Behavior:** Quick actions (when only 1 message): grid “About App”, “Bible”, “AI Wisdom”, “Journal”, “Profile”, “Settings”; tap injects query and runs same keyword match. Send: append user message; match against `CHATBOT_KNOWLEDGE` (keywords); append AI response + optional action. **Take me deh** → onNavigate(type, value): tab → set activeTab, clear category, view main; setting → open overlay; then close chatbot. Voice: use `speech_to_text` for STT; `flutter_tts` for TTS (guard on Android).
- **Knowledge:** Same structure as web: `lib/data/chatbot_knowledge.dart` with list of `{ keywords, response, action? }`. Fallback: “I neva quite catch dat. Try asking…”

---

## 6. Gestures and Global Behavior

- **Swipe:** On main content, `GestureDetector` horizontal drag: if no overlay open, switch tab (home→bible→book→me). Threshold ~50 px; ignore when category or overlay open.
- **Pull-to-refresh:** Use `RefreshIndicator` on main scroll; on refresh trigger full app reload (e.g. set view splash then re-init).
- **Keyboard:** Use `Scaffold(resizeToAvoidBottomInset: true)`. For chatbot, adjust panel position when keyboard opens (e.g. `MediaQuery.of(context).viewInsets.bottom`).

---

## 7. Data and Sync (Flutter)

- **Quotes / Iconic / Bible:** From constants (e.g. `lib/constants/categories.dart`, quotes lists). Favorites in Supabase `bookmarks`; cache in shared_preferences/Hive (keyed e.g. `lkkle_quotes`).
- **Journal:** Supabase `journal_entries`; encrypt title/text before insert (use `encrypt`/`decrypt` package or pointycastle); cache decrypted list locally.
- **Bookmarks KJV:** Same `bookmarks` table, item_type `kjv`; metadata text, reference.
- **User wisdoms:** Supabase via WisdomService; cache list locally.
- **Profile:** Supabase `profiles`; sync after auth and on update.
- **Alerts:** AlertsService; realtime channel; mark read; unread count in app state.
- **Push:** Firebase Messaging; register token when user logged in; store in `push_tokens`; do not register for guest or if Firebase not configured (see ANDROID_NOTIFICATIONS_BREAK_APP_ANALYSIS.md).
- **Connectivity:** Use `connectivity_plus` to set `isOnline`; before Supabase writes check and optionally queue or show “no signal” message.

---

## 8. Accessibility and UX

- Use `Semantics` and `SemanticsLabel` for icon-only buttons (e.g. “View Profile”, “Toggle theme”).
- Focus: ensure tappable areas have minimum size (e.g. 48×48). Notification banner actionable with tap.
- Loading: `CircularProgressIndicator` or skeleton where data is loading (Bible, alerts).
- Errors: show SnackBar or inline error (Auth error box, “Couldn’t sync to cloud”).
- Offline: “Signal Low” / “Viewing Stashed Library”; disable or explain AI/sync actions when offline.

---

## 9. Summary Checklist for Flutter

1. **State:** One app state (e.g. `AppState` ChangeNotifier) for view, tab, user, lists, overlays; notify and consume in widgets.
2. **Navigation:** View + Tab drive which screen is shown; overlays via push or overlay stack; category screen replaces tab body when activeCategory set.
3. **Glass:** Reusable `GlassContainer` (BackdropFilter + blur + semi-transparent fill + border) for cards, nav, modals; glass-gold for accent badge.
4. **Colors/fonts:** primary #13ec5b, jamaicanGold #f4d125, backgroundDark #0a1a0f; Plus Jakarta Sans in theme.
5. **Every button:** Map to same handlers as spec (onTabChange, onOpenAI, onFavorite, etc.); guests → Auth Gate where specified.
6. **Chatbot:** Keyword match from CHATBOT_KNOWLEDGE; onNavigate(type, value); TTS/STT with flutter_tts and speech_to_text; guard unsupported platforms.
7. **User flow:** Splash → Onboarding (if no user) → Auth → Main; overlays on top; category replaces tab content when set.
8. **Safe areas:** SafeArea; MediaQuery padding for bottom nav and FAB.
9. **Backend:** supabase_flutter; cache with shared_preferences/Hive; encryption for journal; push with Firebase Messaging.

Use this spec to keep every screen and button consistent when implementing Likkle Wisdom in Flutter.

