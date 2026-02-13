# Rebuilding Likkle Wisdom in Flutter — Theme, Colors & UI Guide

This guide shows how to recreate the **exact** Likkle Wisdom app UI, theme, and colors in Flutter.

---

## 1. Design Tokens (Copy These Exactly)

### Colors

| Token | Hex | Usage |
|-------|-----|--------|
| **Primary** | `#13ec5b` | CTAs, active states, accents, toggles on |
| **Jamaican Gold** | `#f4d125` | Premium/feature highlights, gradients, "gold" UI |
| **Accent Gold** | `#FFD700` | Optional accent |
| **Background Dark** | `#0a1a0f` | Main dark background (default theme) |
| **Card Dark** | `#1a1a1a` | Cards/surfaces in dark |
| **White/10** | `rgba(255,255,255,0.1)` | Glass borders, dividers |
| **Primary/10** | `#13ec5b` at 10% opacity | Primary tint backgrounds |
| **Primary/20** | `#13ec5b` at 20% opacity | Borders, hover |

### Flutter Color Constants

```dart
import 'package:flutter/material.dart';

class AppColors {
  static const Color primary = Color(0xFF13ec5b);
  static const Color jamaicanGold = Color(0xFFf4d125);
  static const Color accentGold = Color(0xFFFFD700);
  static const Color backgroundDark = Color(0xFF0a1a0f);
  static const Color cardDark = Color(0xFF1a1a1a);

  static Color primaryWithOpacity(double opacity) =>
      primary.withValues(alpha: opacity);

  static Color whiteWithOpacity(double opacity) =>
      Colors.white.withValues(alpha: opacity);
}
```

---

## 2. Typography

- **Heading / Body / Display:** Plus Jakarta Sans (weights 400, 500, 600, 700, 800)
- **Grotesk (optional):** Space Grotesk (400, 500, 600, 700)
- **Icons:** Material Symbols Outlined → use Flutter’s `Icon(Icons.xxx)` or **Material Icons** / **google_fonts** + a symbol font, or the package `material_symbols_icons`.

### pubspec.yaml fonts

```yaml
flutter:
  fonts:
    - family: Plus Jakarta Sans
      fonts:
        - asset: assets/fonts/PlusJakartaSans-Regular.ttf
        - asset: assets/fonts/PlusJakartaSans-Medium.ttf
          weight: 500
        - asset: assets/fonts/PlusJakartaSans-SemiBold.ttf
          weight: 600
        - asset: assets/fonts/PlusJakartaSans-Bold.ttf
          weight: 700
        - asset: assets/fonts/PlusJakartaSans-ExtraBold.ttf
          weight: 800
    - family: Space Grotesk
      fonts:
        - asset: assets/fonts/SpaceGrotesk-Regular.ttf
        # add 500, 600, 700 as needed
```

### TextTheme (match the app’s style)

- Small labels: **9–12px**, **uppercase**, **letter-spacing ~0.2em**, **font-weight 800 (black)**
- Body: **14–16px**, **font-weight 500–700**
- Headings: **18–24px**, **font-weight 700–800**, tight tracking
- “Wisdom Market” / section titles: **10–12px**, **uppercase**, **primary color**, **wide tracking**

Example in Flutter:

```dart
ThemeData(
  fontFamily: 'Plus Jakarta Sans',
  textTheme: TextTheme(
    bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
    bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
    labelSmall: TextStyle(
      fontSize: 9,
      fontWeight: FontWeight.w800,
      letterSpacing: 0.2,
    ),
    titleMedium: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
    titleLarge: TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
  ),
)
```

---

## 3. Theme Data (Dark as Default)

The current app uses **dark mode by default** (`class="dark"` on `html`). Recreate that in Flutter with a dark `ThemeData` and the tokens above.

```dart
ThemeData get darkTheme => ThemeData(
  useMaterial3: true,
  brightness: Brightness.dark,
  scaffoldBackgroundColor: AppColors.backgroundDark,
  primaryColor: AppColors.primary,
  colorScheme: ColorScheme.dark(
    primary: AppColors.primary,
    surface: AppColors.backgroundDark,
    onSurface: Colors.white,
    onPrimary: AppColors.backgroundDark,
  ),
  fontFamily: 'Plus Jakarta Sans',
  appBarTheme: AppBarTheme(
    backgroundColor: AppColors.backgroundDark,
    foregroundColor: Colors.white,
    elevation: 0,
  ),
  bottomNavigationBarTheme: BottomNavigationBarThemeData(
    backgroundColor: AppColors.whiteWithOpacity(0.05),
    selectedItemColor: AppColors.primary,
    unselectedItemColor: AppColors.whiteWithOpacity(0.4),
  ),
  cardTheme: CardTheme(
    color: AppColors.whiteWithOpacity(0.05),
    elevation: 0,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: AppColors.primary,
      foregroundColor: AppColors.backgroundDark,
      padding: EdgeInsets.symmetric(vertical: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
  ),
);
```

---

## 4. Glass Effect

The app uses **glass**: `bg-white/5`, `backdrop-blur-[16px]`, `border border-white/10`.

In Flutter:

```dart
Container(
  decoration: BoxDecoration(
    color: AppColors.whiteWithOpacity(0.05),
    borderRadius: BorderRadius.circular(24),
    border: Border.all(color: AppColors.whiteWithOpacity(0.1), width: 1),
  ),
  child: ClipRRect(
    borderRadius: BorderRadius.circular(24),
    child: BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
      child: child,
    ),
  ),
)
```

Import: `import 'dart:ui';` for `ImageFilter`.

**Glass-gold** (jamaican gold tint):

```dart
color: AppColors.jamaicanGold.withValues(alpha: 0.1),
border: Border.all(color: AppColors.jamaicanGold.withValues(alpha: 0.3)),
// optional: BackdropFilter blur 8
```

---

## 5. Gradients

From `index.css`:

**Jamaica gradient (dark):**

```dart
LinearGradient(
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
  colors: [
    Color(0xFF102216),
    Color(0xFF000000),
    Color(0xFFc4a000),
    AppColors.primary,
  ],
  stops: [0.0, 0.4, 0.85, 1.0],
)
```

**Cosmic background (dark):**

```dart
RadialGradient(
  center: Alignment.topRight,
  radius: 0.6,
  colors: [Color(0xFF1a2e10), Color(0xFF0a1205)],
)
```

**Card gradient (primary tint):**

```dart
LinearGradient(
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
  colors: [
    AppColors.primaryWithOpacity(0.05),
    Colors.transparent,
  ],
)
```

**Gold → Primary (buttons/cards):**

```dart
LinearGradient(
  begin: Alignment.centerLeft,
  end: Alignment.centerRight,
  colors: [AppColors.jamaicanGold, AppColors.primary],
)
```

---

## 6. Border Radius & Spacing

- **Cards / panels:** `16`–`24` (e.g. `BorderRadius.circular(24)`)
- **Buttons:** `12`–`16` (`rounded-xl` / `rounded-2xl`)
- **Pills / chips:** `9999` or `BorderRadius.circular(20)`
- **Bottom nav:** top corners rounded ~16–24
- **Safe area:** use `SafeArea` and/or `MediaQuery.padding` for notch/home indicator

---

## 7. Z-Index Scale (for Stack / Overlays)

Map to Flutter’s stack order (higher = on top):

| Name         | Value | Use case        |
|-------------|-------|------------------|
| dropdown    | 50    | Dropdowns        |
| sticky      | 100   | Sticky headers   |
| overlay     | 200   | Full-screen overlays (e.g. Settings) |
| modal       | 300   | Dialogs, auth gate |
| notification| 400   | Toasts/banners   |
| tooltip     | 500   | Tooltips         |

---

## 8. App Structure (Screens to Implement)

Match the current app’s flow:

1. **Splash** → **Onboarding** (first run) → **Auth** (sign up / sign in / guest)
2. **Main** (bottom nav):
   - **Home** – daily quote, verse, wisdom, quick actions
   - **Bible** – Bible verses / affirmations
   - **Journal (Likkle Book)** – journal entries
   - **Profile** – avatar, stats, My Wisdom, journal count, settings
   - **Create** – FAB/button to “Create Wisdom” (opens a creator flow)
3. **Overlays:** Settings, AI Wisdom, Premium Upgrade, Alerts, Auth Gate (modal), Legal (Privacy/Terms)

Navigation: one “main” widget with index-based tab body + a fixed bottom nav bar (custom or `BottomNavigationBar` with 5 items: Home, Bible, Journal, Profile, Create).

---

## 9. Bottom Nav Bar (Exact Behavior)

- **Tabs:** Home, Bible, Journal, Profile, Create (last one is “Create Wisdom”).
- **Active:** `primary` color, icon slightly scaled (e.g. 1.1).
- **Inactive:** `white/40` or `Colors.white.withValues(alpha: 0.4)`.
- **Style:** glass bar at bottom, top border `white/10`, rounded top corners, safe area padding at bottom.
- **Labels:** 9px, uppercase, font weight 800.

---

## 10. Animations (Optional but Matches Current App)

- **fade-in:** opacity 0→1, translateY 10→0, ~600ms ease-out
- **float:** translateY 0 → -10 → 0, ~3s, infinite
- **slow-spin:** rotate 0→360deg, ~12s linear, infinite
- **pulse-glow:** primary glow opacity 1 ↔ 0.7, ~2s
- **pop:** scale 1 → 1.4 → 1, ~350ms cubic-bezier(0.175, 0.885, 0.32, 1.275)

In Flutter use `AnimationController` + `Tween` + `CurvedAnimation`, or `TweenAnimationBuilder`, or `AnimatedContainer` / `FadeTransition` as needed.

---

## 11. Minimal Flutter Project Setup

```bash
flutter create likkle_wisdom_flutter
cd likkle_wisdom_flutter
```

**pubspec.yaml** (add):

```yaml
dependencies:
  flutter:
    sdk: flutter
  google_fonts: ^6.1.0   # for Plus Jakarta Sans / Space Grotesk
  # material_symbols_icons if you want exact Material Symbols Outlined
```

**main.dart** – force dark theme and use your theme:

```dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

void main() => runApp(const LikkleWisdomApp());

class LikkleWisdomApp extends StatelessWidget {
  const LikkleWisdomApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Likkle Wisdom',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF0a1a0f),
        primaryColor: const Color(0xFF13ec5b),
        colorScheme: ColorScheme.dark(
          primary: const Color(0xFF13ec5b),
          surface: const Color(0xFF0a1a0f),
          onSurface: Colors.white,
          onPrimary: const Color(0xFF0a1a0f),
        ),
        textTheme: GoogleFonts.plusJakartaSansTextTheme(
          ThemeData.dark().textTheme,
        ),
      ),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'LIKKLE WISDOM',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.4,
                  color: const Color(0xFF13ec5b),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Daily Jamaican quotes & affirmations',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

Run: `flutter pub get` then `flutter run`.

---

## 12. Checklist for Pixel‑Close Match

- [ ] **Colors:** `#13ec5b`, `#f4d125`, `#0a1a0f` everywhere they’re used in the web app
- [ ] **Fonts:** Plus Jakarta Sans (and Space Grotesk where used)
- [ ] **Dark default:** scaffold and surfaces use `#0a1a0f`, text white/off-white
- [ ] **Glass:** blur 16, `white/5` fill, `white/10` border
- [ ] **Primary for:** buttons, active tab, toggles, links, success states
- [ ] **Jamaican gold for:** premium, “gold” cards, gradients with primary
- [ ] **Border radius:** 12–24 for cards and buttons
- [ ] **Labels:** small, uppercase, heavy weight, wide letter-spacing
- [ ] **Safe area:** bottom nav and main content respect notches
- [ ] **Screens:** Home, Bible, Journal, Profile, Create (+ Auth, Onboarding, Settings, overlays)

Using this doc you can rebuild the same app look and feel in Flutter; for behavior (auth, API, state) replicate your existing logic in Dart (e.g. Supabase Flutter SDK, same backend).
