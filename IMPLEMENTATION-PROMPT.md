# Likkle Wisdom — Implementation Prompt

## Project Context

This is a React/TypeScript PWA (Jamaican cultural wisdom app) using Tailwind CSS, Material Symbols icons, and a dark/light theme system. The app supports both mobile and desktop (web) layouts. Key theme classes: `dark:bg-background-dark` for dark mode, `bg-slate-50` for light mode. The primary accent is `text-primary` (green `#13ec5b`), gold is `text-jamaican-gold` (`#f4d125`).

**Critical cross-cutting rules for every change below:**
- All UI must respect dark mode (`dark:`) and light mode variants. Never hardcode a colour that only works in one theme.
- All sizing must be responsive — use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) and dynamic units (`dvh`, `%`, `clamp()`, `min()`, `max()`) so layouts adapt from 320px phones to wide desktop monitors.
- Preserve existing accessibility attributes (`aria-label`, `role`, `sr-only`, etc.) and add them where missing.

---

## 1. UNIVERSAL CHANGES (both mobile & web)

### 1.1 — Onboarding "NEXT" button: black text in dark mode

**File:** `src/views/Onboarding.tsx` (line ~120–126)

The first onboarding page's "NEXT" button currently uses `text-primary` (green/gold). On dark mode the gold-on-green is hard to read.

**Change:** On the **first step only** (`step === 1`), change the NEXT button text colour to black in dark mode. Keep the existing colour for steps 2 and 3.

Current button class (line ~122):
```
className="w-full h-[52px] rounded-2xl glass border-primary/20 text-primary font-black ..."
```

Update to conditionally apply `dark:text-black` when `step === 1`:
```tsx
className={`w-full h-[52px] rounded-2xl glass border-primary/20 font-black text-base hover:bg-primary hover:text-jamaican-gold transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl ${step === 1 ? 'text-primary dark:text-black' : 'text-primary'}`}
```

Alternatively, if the gold is the issue against the green background, you may instead use `dark:text-slate-900` or `dark:text-[#1a1a1a]` for better contrast. Test both themes.

---

### 1.2 — Discover module: search results text colour fix for light mode

**File:** `src/views/Discover.tsx` (lines ~82–166)

Currently, search result text and "no results" text uses hardcoded `text-white` classes which are invisible on light mode backgrounds.

**Changes needed in the search results section:**

1. **No results message** (line ~85–86): Change `text-white/10` and `text-white/20` to use theme-aware colours:
   ```
   text-slate-300 dark:text-white/10   (for the icon)
   text-slate-500 dark:text-white/20   (for the "No results" text)
   ```

2. **Category results** (line ~99–100): Change `text-white` → `text-slate-900 dark:text-white` and `text-white/30` → `text-slate-500 dark:text-white/30`.

3. **Quote results** (line ~115–116): Change `text-white` → `text-slate-900 dark:text-white` and `text-white/40` → `text-slate-500 dark:text-white/40`.

4. **Bible verse results** (line ~131–132): Change `text-white` → `text-slate-900 dark:text-white` and `text-white/40` → `text-slate-500 dark:text-white/40`.

5. **Iconic quote results** (line ~146): Change `text-white` → `text-slate-900 dark:text-white`.

6. **User wisdom results** (line ~159–160): Change `text-white` → `text-slate-900 dark:text-white` and `text-white/40` → `text-slate-500 dark:text-white/40`.

**Pattern:** Every instance of `text-white` inside the `{isSearching && (...)}` block should become `text-slate-900 dark:text-white`. Every `text-white/XX` opacity variant should become `text-slate-500 dark:text-white/XX` (or equivalent light-mode-readable colour).

---

### 1.3 — Discover module: Bible scripture search should work and link to Bible view

**File:** `src/views/Discover.tsx`

Currently, when a user searches for a Bible scripture (e.g. "Psalm 23" or "Philippians"), results appear from the `bible` prop (which comes from `BIBLE_AFFIRMATIONS` in `constants.ts` — only 20 entries). Two issues:

**A) Expand searchable Bible content:**
The `bible` prop only has 20 affirmations. The app has a full Bible in `BibleView.tsx`. The Discover search should also search through the full Bible data. Either:
- Pass the full Bible verses data into Discover as a prop, OR
- Create a lightweight search index that searches book names + chapter:verse references

**B) Make Bible results clickable — navigate to BibleView:**
Add an `onClick` handler to each Bible result card that navigates the user to the Bible view with that scripture opened. This requires:
- Adding an `onOpenBible?: (reference: string) => void` prop to the `Discover` component
- Wrapping each Bible result `<div>` in a `<button>` with `onClick={() => onOpenBible?.(item.reference)}`
- In `App.tsx`, pass a handler that sets the tab to `'bible'` and passes the reference to `BibleView` so it auto-navigates to that book/chapter/verse

---

### 1.4 — Add 100 more Jamaican quotes and 100 more wisdoms

**File:** `src/constants.ts`

Currently there are 80 quotes in `INITIAL_QUOTES` (ids 1–80) across categories: Wisdom, Motivation, Affirmations, Peace.

**Add 100 new quotes** (ids 81–180) to `INITIAL_QUOTES`. These must be authentic Jamaican Patois proverbs and sayings with accurate English translations. Distribute evenly across the four categories (Wisdom, Motivation, Affirmations, Peace). Each entry follows the existing format:
```ts
{ id: '81', patois: "...", english: "...", category: "Wisdom", isFavorite: false },
```

Currently there are 15 iconic quotes in `ICONIC_QUOTES` (ids ic1–ic15) from Bob Marley, Marcus Garvey, Miss Lou, Usain Bolt, Shelly-Ann Fraser-Pryce.

**Add 100 new iconic wisdom entries** (ids ic16–ic115) to `ICONIC_QUOTES`. Include quotes from a wider range of Jamaican icons: Jimmy Cliff, Peter Tosh, Dennis Brown, Buju Banton, Sean Paul, Grace Jones, Louise Bennett-Coverley (more), Portia Simpson-Miller, P.J. Patterson, Norman Manley, Alexander Bustamante, Merlene Ottey, Elaine Thompson-Herah, Shaggy, Damian Marley, Ziggy Marley, Chronixx, Koffee, Protoje, and other notable Jamaicans. Each follows:
```ts
{ id: 'ic16', author: 'Jimmy Cliff', text: "...", category: 'Legends', isFavorite: false },
```

**Important:** All quotes must be real, verified quotes attributed to the correct person. Do not fabricate quotes.

---

### 1.5 — "Signal Low" notification: light mode text fix + redesign as collapsible icon

**File:** `src/App.tsx` (lines ~758–768)

**A) Light mode text fix:** The "Signal Low" text is currently `text-white` which is invisible on light mode. Change to:
```
text-slate-900 dark:text-white
```
Also change the sub-text from `text-white/40` to `text-slate-500 dark:text-white/40`.

**B) Redesign as collapsible wifi icon:**
Replace the current always-visible banner with an interactive collapsible pattern:

1. **Default state:** Show only a red wifi-off icon positioned at the extreme right of the screen (e.g. `fixed top-6 right-4`), small and unobtrusive.
2. **On tap:** Animate a dropdown/slide-in showing the "Signal Low" + "Stashed wisdom active" text. Use a smooth CSS transition or Tailwind `animate-` class.
3. **On tap again or tap outside:** Collapse back to just the icon.

This requires adding local state (e.g. `const [showOfflineBanner, setShowOfflineBanner] = useState(false)`) and wrapping in a click handler. Add a click-outside listener to auto-collapse.

Example structure:
```tsx
{!isOnline && (
  <div className="fixed top-6 right-4 z-notification">
    <button onClick={() => setShowOfflineBanner(!showOfflineBanner)} className="...">
      <span className="material-symbols-outlined text-red-500 text-xl animate-pulse">wifi_off</span>
    </button>
    {showOfflineBanner && (
      <div className="absolute right-0 top-full mt-2 animate-fade-in glass rounded-2xl px-4 py-3 ...">
        <span className="text-[9px] font-black uppercase text-slate-900 dark:text-white tracking-[0.2em]">Signal Low</span>
        <span className="text-[7px] font-bold uppercase text-slate-500 dark:text-white/40 tracking-[0.1em]">Stashed wisdom active</span>
      </div>
    )}
  </div>
)}
```

---

### 1.6 — Remove circular bubble from all icons (icons being cut off)

**Files:** Multiple — search for icon containers with circular backgrounds across all view files.

Look for patterns like:
- `rounded-full bg-...` wrapping `material-symbols-outlined` icons
- `size-X rounded-full` containers around icons
- Any `overflow-hidden` on circular icon wrappers that clip the icon

For each instance, either:
- Remove the circular container and let the icon stand alone, OR
- Increase the container size so the icon isn't clipped, OR
- Remove `overflow-hidden` if that's what's causing the clip

**Note:** Be selective — some circular icon containers are intentional design elements (like avatar placeholders or interactive buttons). Focus on icons that are visually cut off. The main offenders are likely in navigation bars, filter chips, and category cards.

---

### 1.7 — Bible offline availability (PWA caching)

**Files:** `src/views/BibleView.tsx`, service worker config, `src/App.tsx`

The Bible, even when "Stashed" (bookmarked/saved), isn't available offline. The entire app should remain functional offline, with only wifi-dependent features disabled.

**Changes:**
1. **Cache Bible data in the service worker:** Ensure the Bible JSON/data files are included in the precache manifest so they're available offline.
2. **Store Bible data in localStorage or IndexedDB** as a fallback when the service worker cache misses.
3. **Disable wifi-dependent features gracefully:** When `!isOnline`, disable or hide:
   - AI features (Gemini API calls)
   - Social features (sharing, public profiles)
   - Cloud sync operations
   - Real-time online count
   But keep fully functional:
   - Bible reading and navigation
   - Saved/stashed quotes and wisdoms
   - Journal reading/writing (queue sync for when back online)
   - Travel maps (if tiles are cached)
4. Show clear visual indicators on disabled features (greyed out with a small wifi-off icon).

---

### 1.8 — Maps module: price range filter with min/max sliders

**File:** `src/views/travel/MapsModule.tsx`

Currently, the `prices` filter is a simple toggle (show places with `averageCost`). Replace this with a min/max price range selector.

**Changes:**
1. Add state: `const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);` (adjust max based on actual data in `travelPlaces.ts`)
2. When the user activates the `prices` filter, show a UI with two range inputs or a dual-thumb slider:
   - Min price input (number or slider)
   - Max price input (number or slider)
   - Display current range: "JMD $X – $Y" or "USD $X – $Y"
3. Update the `visiblePlaces` filter logic (line ~121) to check: `place.averageCost >= priceRange[0] && place.averageCost <= priceRange[1]`
4. Style the slider/inputs to match the existing glass morphism design with `glass rounded-2xl` containers.

---

### 1.9 — Aviation module: "To Jamaica" plane icon pull-up not working

**File:** `src/views/travel/AviationModule.tsx`

When clicking a plane icon in the "To Jamaica" section, the pull-up detail panel doesn't appear, but it works for "From Jamaica". This is likely a bug where the click handler or state setter for the "To Jamaica" route selection isn't wired up the same way as "From Jamaica".

**Debug & fix:**
1. Find the click handler for plane icons in both "From Jamaica" and "To Jamaica" sections.
2. Compare the two — the "To Jamaica" handler is likely missing `setSelectedRoute(route)` or equivalent state update that triggers the pull-up panel.
3. Ensure the pull-up component renders for both directions.
4. Test that clicking a plane icon in "To Jamaica" opens the same style pull-up with route details.

---

### 1.10 — Financial Planner: saved plans should be re-loadable with full data

**File:** `src/views/travel/FinancialPlannerModule.tsx`, `src/services/tripPlannerService.ts`

When a user saves a financial plan, clicking that saved plan should repopulate all the form fields and display any AI-generated trip plan that was part of that session.

**Changes:**
1. **Enhance the saved plan data structure** to include all form field values + the AI-generated content (if any). Store as JSON in localStorage or Supabase.
2. **Add a "load plan" handler:** When a saved plan is clicked, read its data and:
   - Set all form state values (budget, duration, travelers, etc.) to the saved values
   - If an AI-generated trip plan was saved, display it in the results area
3. **Update the save function** to capture the complete state snapshot including AI output.
4. **UI:** Show saved plans as clickable cards. When loaded, show a subtle indicator that you're viewing a saved plan (e.g. a banner: "Viewing saved plan: [name]" with an option to clear/start fresh).

---

### 1.11 — Real images for Maps and Trip modules

**File:** `src/data/travelPlaces.ts`

Currently places may use placeholder images (e.g. `picsum.photos` or generic URLs). Replace with real images of actual Jamaican locations.

**Approach:**
- For each place in `travelPlaces.ts`, find a high-quality, royalty-free image of that specific location (from Unsplash, Pexels, or Wikimedia Commons).
- Update the `image` or `imageUrl` field with the real URL.
- Ensure images are optimized (use Unsplash/Pexels resize parameters like `?w=600&h=400&fit=crop`).
- Add `alt` text describing the actual place for accessibility.
- Consider hosting critical images locally in `public/images/places/` for offline availability.

---

### 1.12 — Live user location on all maps

**Files:** `src/views/travel/MapsModule.tsx`, `src/views/travel/TripPlannerModule.tsx`, any other map views

Add a "My Location" toggle button on all map views that:

1. **Requests geolocation permission** via `navigator.geolocation.getCurrentPosition()` (with error handling for denied permissions).
2. **Shows the user's live location** as a distinct marker (blue pulsing dot, like Google Maps) on the Leaflet map.
3. **Updates in real-time** using `navigator.geolocation.watchPosition()`.
4. **Includes a "center on me" button** that pans the map to the user's current location.
5. **Handles errors gracefully:** If location is denied, show a toast: "Enable location in your device settings to see your position on the map."

Add a location toggle icon button in the map controls area:
```tsx
<button onClick={toggleLocation} className="glass rounded-full p-3 shadow-xl">
  <span className="material-symbols-outlined text-primary">
    {locationEnabled ? 'my_location' : 'location_disabled'}
  </span>
</button>
```

---

## 2. MOBILE-ONLY CHANGES

### 2.1 — My Trip module: collapsible places list

**File:** `src/views/travel/TripPlannerModule.tsx`

On mobile, the list of places in the trip can be very long, forcing users to scroll past everything to reach the "Improve trip" AI section.

**Add a collapsible dropdown:**
1. Add state: `const [placesExpanded, setPlacesExpanded] = useState(false);`
2. Show a summary header with place count and a toggle button:
   ```tsx
   <button onClick={() => setPlacesExpanded(!placesExpanded)} className="w-full flex items-center justify-between glass rounded-2xl p-4">
     <span className="font-bold text-slate-900 dark:text-white">Places ({places.length})</span>
     <span className="material-symbols-outlined transition-transform" style={{ transform: placesExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
       expand_more
     </span>
   </button>
   ```
3. Wrap the places list in a conditional: `{placesExpanded && (<div className="animate-fade-in">...places list...</div>)}`
4. **Only apply on mobile** — use the existing `useIsDesktop` hook: `const isDesktop = useIsDesktop();` and only collapse on `!isDesktop`.
5. Show a preview of the first 2–3 places even when collapsed, with a "Show all X places" button.

---

### 2.2 — Profile page header gap too large on mobile

**File:** `src/views/Profile.tsx`

The header of the profile page has too much vertical space between the top of the phone screen and the header content.

**Fix:** Reduce top padding/margin on the profile header. Look for classes like `pt-safe`, `mt-X`, `py-X` on the header section and reduce them for mobile. Use responsive classes:
```
pt-2 sm:pt-8
```
or
```
mt-2 sm:mt-6
```

Check if there's a redundant `pt-safe` being applied both on the profile container AND on the header — remove the double application.

---

## 3. WEB APP-ONLY CHANGES

### 3.1 — Journal "Write Move" page: full width within nav constraint

**File:** `src/views/LikkleBook.tsx`

On the web app, the journal write/compose page UI needs to:
1. Start at the edge of the web app's side navigation bar (left edge of the content area).
2. Use the full width of the content area.

**Fix:** The write view likely has `max-w-` constraints or centered containers. For the write/compose mode, override to:
```tsx
className="w-full max-w-none px-0 lg:px-0"
```

Or if the content area has a wrapper with `max-w-3xl mx-auto` or similar, conditionally remove it when in write mode:
```tsx
className={isWriting ? 'w-full' : 'max-w-3xl mx-auto'}
```

Ensure the text editor/textarea stretches full width within the content area bounded by the sidebar. The sidebar width is controlled in `App.tsx` (line ~780): `isNavCollapsed ? 'lg:pl-24' : 'lg:pl-72'` — the journal content should fill everything to the right of that padding.

---

## Implementation Order (Suggested)

1. **Quick wins first:** 1.1, 1.2, 1.5A, 2.2, 3.1 (text colour fixes and spacing)
2. **Redesigns:** 1.5B (collapsible wifi), 1.6 (icon bubbles), 1.8 (price range), 2.1 (collapsible places)
3. **Bug fixes:** 1.9 (aviation pull-up), 1.10 (financial planner reload)
4. **Content additions:** 1.4 (quotes and wisdoms — large but mechanical)
5. **Feature additions:** 1.3 (Bible search), 1.7 (offline Bible), 1.12 (live location)
6. **Asset work:** 1.11 (real images — requires research/sourcing)

---

## Testing Checklist

For every change, verify:
- [ ] Light mode appearance
- [ ] Dark mode appearance
- [ ] Mobile viewport (375px width)
- [ ] Tablet viewport (768px width)
- [ ] Desktop viewport (1440px width)
- [ ] Offline behaviour (disconnect wifi and test)
- [ ] Screen reader announces changes correctly
- [ ] No TypeScript errors
- [ ] No console warnings
