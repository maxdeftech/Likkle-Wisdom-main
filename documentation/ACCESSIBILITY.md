# Screen Reader & Accessibility

Likkle Wisdom is built so people using **screen readers** and **keyboard navigation** can use the app effectively.

## What’s in place

### Skip link
- **Skip to main content** link at the top of the app.
- Hidden visually until focused (keyboard or “skip” gesture).
- Sends focus to the main content area so users can bypass the header/nav.

### Landmarks and structure
- **`<main id="main-content">`** – main content; skip link targets this.
- **`<nav aria-label="Main navigation">`** – bottom tab bar (Home, Bible, Journal, Profile, Create).
- **`role="region"` / `aria-label`** on major sections (Home, Discover, Bible, Journal, Profile) so screen readers can jump by region.
- **`role="banner"`** on page headers where it makes sense.
- **One `<h1>` per screen** (e.g. “KJV Bible”, “Likkle Book”, “Wise One”) for a clear outline.

### Buttons and controls
- **Icon-only buttons** have **`aria-label`** (e.g. “Open settings”, “Play chapter aloud”, “Close alerts”).
- **Alerts button** uses a label like “Alerts, 3 unread” when there are unread items.
- **Active tab** uses **`aria-current="page"`** so the current section is announced.
- **Decorative icons** use **`aria-hidden="true"`** so they’re not read.

### Live regions
- **Notifications** – `aria-live="polite"` so new toasts are announced.
- **Offline banner** – `role="status"` and `aria-live="polite"` so “offline” is announced.
- **Pull-to-refresh** – status text (e.g. “Release to refresh”) is in a live region.
- **Search results** (Discover) – results area has `aria-live="polite"` so updates are announced.

### Dialogs and overlays
- **Modals** use **`role="dialog"`**, **`aria-modal="true"`**, and **`aria-labelledby`** (or **`aria-label`**) so they’re announced as dialogs.
- **Guest auth**, **Settings**, **Bible book/chapter selector**, and **Likkle Guide chat** follow this pattern.
- **Likkle Guide** trigger has **`aria-expanded`** and **`aria-haspopup="dialog"`**.

### Forms and search
- **Search inputs** have a **`<label>`** (visible or **`.sr-only`**) and **`aria-label`** where needed (Discover, Journal, Likkle Guide).
- **Toggle controls** (e.g. dark mode) have clear labels like “Switch to dark mode”.

### Tabbed content (Home)
- **Quote / Wisdom / Verse** selector uses **`role="tablist"`**, **`role="tab"`**, **`aria-selected`**, and **`role="tabpanel"`** with **`aria-labelledby`** so the selected card is clear to assistive tech.

### CSS
- **`.sr-only`** – content read by screen readers but hidden visually (used for labels).
- **`.skip-link`** – same as above, but becomes visible on **`:focus`** so keyboard users see it.

## How to test

1. **Keyboard**
   - Tab through the app; focus order should follow layout.
   - Use Enter/Space on buttons and links.
   - Use the skip link (Tab once from load) to jump to main content.

2. **Screen reader**
   - **iOS**: VoiceOver (Settings → Accessibility → VoiceOver).
   - **Android**: TalkBack (Settings → Accessibility → TalkBack).
   - **Desktop**: NVDA (Windows), VoiceOver (macOS), or JAWS.
   - Check that regions, headings, and buttons are announced and that live updates (notifications, search) are spoken.

3. **Automated**
   - Run **axe DevTools** or **Lighthouse** (Accessibility) on the web build to catch many WCAG issues.

## Tips for new UI

- Give every **icon-only button** an **`aria-label`** (or use a visible label).
- Use **`<label>`** or **`aria-label`** for every **input**.
- Mark **decorative** images/icons with **`aria-hidden="true"`** or **`alt=""`**.
- For **new modals**, add **`role="dialog"`**, **`aria-modal="true"`**, and a title reference (**`aria-labelledby`** or **`aria-label`**).
- For **new pages**, use one **`<h1>`** and **`role="region"`** + **`aria-label`** for the main section.
