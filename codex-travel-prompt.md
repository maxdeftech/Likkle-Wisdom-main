# Codex Task: Travel Module — Likkle Wisdom

## Skills to Use
- `build-web-apps:frontend-app-builder` — primary skill for building the Travel UI
- `build-web-apps:react-best-practices` — React/component architecture
- `vercel:nextjs` — routing and layout patterns
- `vercel:ai-sdk` — AI integration for the Financial Planner module
- `build-web-apps:frontend-testing-debugging` — browser verification after implementation
- `vercel:shadcn` — UI component usage
- `browser:control-in-app-browser` — visual verification of the finished UI

---

## Project Context

**Repo:** `Likkle-Wisdom-main`  
**Stack:** React + TypeScript + Vite + Tailwind CSS + Supabase + Capacitor (PWA/iOS/Android)  
**Current nav system:** `src/types.ts` defines `Tab = 'home' | 'discover' | 'bible' | 'book' | 'me'` and `View` for top-level routing. The `BottomNav` component (`src/components/BottomNav.tsx`) renders tabs for mobile (bottom bar) and desktop (left sidebar). App state lives in `src/App.tsx`.

The app runs as a **PWA, web app, iOS app (Capacitor), and Android app (Capacitor)**. All UI must be responsive across these targets — mobile-first, desktop-adapted via the existing `lg:` Tailwind breakpoints.

---

## What to Build

### 1. Replace the "Create" Button with "Travel"

**In `src/components/BottomNav.tsx`:**

- Remove the standalone "Create" button (`onOpenWisdomCreator`) entirely from the nav bar.
- Add a new nav tab entry `{ id: 'travel', label: 'Travel', icon: 'flight' }` to the `tabs` array (use Material Symbols icon `flight` for the plane icon).
- The Travel tab should appear in the same visual slot as the old Create button — between `book` (Journal) and `me` (Profile) — so the tab order becomes: `home → discover → bible → book → travel → me`.

**In `src/types.ts`:**

- Extend `Tab` to include `'travel'`: `export type Tab = 'home' | 'discover' | 'bible' | 'book' | 'travel' | 'me';`

**In `src/App.tsx`:**

- Update `TAB_ORDER` array to include `'travel'` between `'book'` and `'me'`.
- Add a case in `renderContent()` for `case 'travel': return <TravelView ... />;`
- Remove all references to `onOpenWisdomCreator` / `handleGoToWisdomCreator` from the BottomNav props (the Create wisdom flow still exists inside the Profile tab — just remove it from the nav).
- Update the `BottomNav` props interface to remove `onOpenWisdomCreator`.

---

### 2. Travel View Shell — `src/views/TravelView.tsx`

Create a new full-screen view that acts as a self-contained mini-app with its own internal navigation.

**Layout rules:**
- When `activeTab === 'travel'`, the main content area renders `<TravelView />` which **fills the available space** (already offset by BottomNav/sidebar via the existing `lg:pl-72` padding in App.tsx).
- At the top of TravelView, render a **Travel Header** containing:
  - A **Back button** (← arrow, `arrow_back` Material Symbol) aligned top-left that sets `activeTab` back to `'home'` via a passed-in `onBack: () => void` prop.
  - A centered title: "**Travel**" with a small plane icon.
  - A **secondary tab bar** directly below the header with 3 tabs: `Maps`, `Aviation Routes`, `Financial Planner`.
- The secondary tabs switch between 3 module sub-views rendered below the header.
- This entire view should work on mobile (stacked layout, scrollable) and desktop (same layout, constrained to the content area).

**Internal state:** `travelTab: 'maps' | 'aviation' | 'planner'` managed with `useState` inside `TravelView`.

---

### 3. Module 1 — Maps (`src/views/travel/MapsModule.tsx`)

Build an **interactive destination map** component. Use **Leaflet.js** (`react-leaflet`) for the map — it is open-source, works in PWAs, and requires no API key for base tiles (use OpenStreetMap tiles).

#### Map Behaviour
- Default map center: **Jamaica** (lat: 18.1096, lng: -77.2975), default zoom: 10.
- Users can:
  - Use **"Use My Location"** button to center map on their GPS coordinates (via `navigator.geolocation`).
  - Type a location into a **search/filter bar** at the top of the module.
- The map is zoomable/pannable like Google Maps.
- Show destination **markers** (pins) on the map for Jamaican places of interest seeded from a static data file (see below).

#### Filter System
Render a **horizontal scrollable filter chip bar** above the map. Filter categories:

| Filter ID | Label | Icon (Material Symbol) |
|---|---|---|
| `hotels` | Hotels & Resorts | `hotel` |
| `villas` | Villas | `villa` |
| `airbnb` | Air BnBs | `home` |
| `nature` | Natural Attractions | `park` |
| `culture` | Culture & History | `museum` |
| `adventure` | Adventure & Eco-Tourism | `hiking` |
| `prices` | By Price Range | `payments` |
| `all` | All | `map` |

Multiple filters can be active simultaneously. Active filter chips are highlighted with the app's primary colour. Markers on the map filter reactively as chips are toggled.

#### Map Legend
A collapsible **legend panel** (bottom-right corner of the map, small toggle button) shows a colour/icon key matching the filter categories so users understand what each marker type means.

#### Place Detail Slide-Up Sheet
When a user **taps/clicks a map marker**, a **bottom sheet** slides up (on mobile: slides from bottom edge; on desktop: appears as a right-side panel or centered modal). The sheet shows:

- **Hero image** (placeholder gradient or unsplash photo URL if available in data)
- **Name** of the place (large heading)
- **Location / address** (sub-text, with a `location_on` icon)
- **Category badge** (e.g. "Natural Attraction")
- **Average cost** — e.g. "$20 USD entry" (show "Free" if applicable; hide if unknown)
- **Brief history / description** paragraph (2–4 sentences)
- **Official website** — rendered as a globe icon link button
- **Social media links** — Instagram, Facebook, TikTok, YouTube icons as icon-only link buttons (only show icons for links that exist in data)
- **Like / Save button** — heart icon that toggles a saved state. Saved places are stored in `localStorage` under `lkkle_travel_saved_places`. If the user is a guest, show the `GuestAuthModal`.
- **"Add to Trip List" button** — lets users add this place to a named list (e.g. "Weekend Trip", "Next Vacation"). Store trip lists in `localStorage` under `lkkle_travel_trip_lists` as `{ listName: string; placeIds: string[] }[]`. Show a small popover with existing lists + "New list" option.

The sheet should be **dismissible** by swiping down (mobile) or clicking outside (desktop).

#### Seed Data
Create `src/data/travelPlaces.ts` with a static array of at least **15 real Jamaican destinations** covering all filter categories. Each place object shape:

```ts
interface TravelPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: 'hotels' | 'villas' | 'airbnb' | 'nature' | 'culture' | 'adventure';
  averageCost?: string;        // e.g. "$20 USD entry" | "Free" | undefined
  description: string;        // 2–4 sentence history/description
  website?: string;
  social?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
  };
  imageUrl?: string;          // unsplash or placeholder
}
```

Include places like: Dunn's River Falls, Blue Lagoon, Rick's Café, Bob Marley Museum, Devon House, Blue Mountains, Negril Seven Mile Beach, Rose Hall Great House, YS Falls, Pelican Bar, Luminous Lagoon, Mystic Mountain, Cockpit Country, Port Royal, and Reach Falls.

#### AI Destination Suggestions
At the bottom of the Maps module (below the map), add a collapsible **"AI Destination Guide"** panel. When expanded:
- A text input: "Where do you want to go? What's your budget?"
- On submit, call the **Gemini service** already in the project (`src/services/geminiService.ts`) with a travel-focused prompt.
- Display the AI response as a formatted suggestion card (destination name, why it fits, estimated cost, nearest places on the map highlighted).
- Also accept voice input if `useTTS` hook or Web Speech API is available.

---

### 4. Module 2 — Aviation Routes (`src/views/travel/AviationModule.tsx`)

Build an **interactive aviation routes explorer** focused on Jamaica.

#### Route Visualisation
- Render a **globe or flat world map** (use `react-leaflet` for consistency, or optionally a lightweight SVG world map).
- Animate **dotted flight paths** from Kingston (Norman Manley International, KIN) and Montego Bay (Sangster International, MBJ) to major international destinations.
- The animation should show a **plane icon moving along the dotted arc** between origin and destination (CSS keyframe animation or react-spring). Use an SVG plane or the `flight` Material Symbol icon.
- Routes should arc gracefully (curved `<polyline>` or SVG `<path>` with bezier curve) rather than straight lines.

#### Route Data
Use **static route data** sourced from publicly known routes (no live API key required for MVP). Create `src/data/aviationRoutes.ts`:

```ts
interface AviationRoute {
  id: string;
  origin: { code: string; name: string; lat: number; lng: number; city: string };
  destination: { code: string; name: string; lat: number; lng: number; city: string; country: string };
  airlines: string[];           // e.g. ["American Airlines", "JetBlue"]
  estimatedCost?: string;       // e.g. "From $350 USD"
  durationHours?: number;       // e.g. 3.5
  frequency?: string;           // e.g. "Daily"
}
```

Include at least 20 routes from KIN/MBJ to destinations such as: Miami, New York (JFK/EWR), Toronto, London (Heathrow/Gatwick), Atlanta, Orlando, Philadelphia, Charlotte, Fort Lauderdale, Washington DC, Houston, Dallas, Cancun, Panama City, Havana, Nassau, Barbados, Trinidad, Amsterdam, and Frankfurt.

#### Route List UI
Below the map, render a **searchable list of routes** with:
- Origin airport selector (KIN / MBJ toggle)
- Destination search input
- Each route card shows: destination city + country flag emoji, airlines, estimated cost badge, flight duration, frequency.
- Tapping a route card highlights that arc on the map and scrolls to it.

#### Estimated Costs Note
Display a disclaimer: *"Estimated costs are approximate and may vary. Check airline websites for live pricing."*

---

### 5. Module 3 — Financial Planner (`src/views/travel/FinancialPlannerModule.tsx`)

Build an **AI-powered travel budget and trip planner**.

#### Trip Input Form
A clean card-based form with these fields:
- **Destination** — text input (e.g. "Miami, USA")
- **Departure city** — text input (defaults to "Kingston, Jamaica")
- **Travel dates** — date range picker (start + end date, use native `<input type="date">`)
- **Number of travellers** — stepper (1–10)
- **Total budget** — currency input (USD by default, allow JMD toggle)
- **Travel interests / priorities** — multi-select chip picker: Beach, Food & Dining, Culture, Adventure, Shopping, Nightlife, Family-Friendly, Luxury, Budget Travel
- **Accommodation preference** — select: Hotel, Villa, Airbnb, Hostel, Any

#### AI Trip Plan Generation
On submit, construct a detailed prompt and call `geminiService` (already in `src/services/geminiService.ts`). The AI should return a **structured trip plan** including:
- Day-by-day itinerary overview
- Estimated flight cost (based on routes in aviation data if destination matches)
- Accommodation cost estimate per night × nights
- Daily meal budget estimate
- Activity/attraction cost estimates (cross-referenced with `travelPlaces.ts` data where possible)
- Shopping / cosmetics estimate (mention swimwear, sunscreen, beach gear relevant to Jamaica context)
- **Total estimated cost** breakdown table
- Whether budget is sufficient or how much more is needed
- Tips for saving money

Display the response in a **beautifully formatted result card** with:
- Collapsible day sections
- Cost breakdown table with icons
- A "total vs. budget" progress bar (green = under budget, amber = close, red = over)
- "Save Plan" button — stores the plan in `localStorage` under `likkle_travel_plans`.

#### Saving Goals
Below the plan, show a **"Set a Savings Goal"** section:
- Input: target amount + target date
- Display a progress tracker card: how much saved so far (user manually inputs current savings), how much per week/month needed to hit the goal.
- Stored in `localStorage` under `likkle_travel_savings_goals`.

#### Cosmetics & Travel Essentials Estimator
A small collapsible section: "What will I need to buy?" with AI-suggested items (swimwear, sunscreen, snorkelling gear, travel adapters, etc.) and rough cost estimates. This is informational, not e-commerce.

---

## Styling & Design System

- Follow the existing Likkle Wisdom design language:
  - `glass` utility class for frosted card backgrounds
  - `text-primary` for accent colour
  - `material-symbols-outlined` for all icons
  - `dark:` variants for dark mode (the app defaults to dark mode)
  - `rounded-2xl` corners, `shadow-2xl` depth
  - Uppercase `tracking-widest` labels for nav items
- The Travel Header's secondary tab bar should use the same pill/underline style as other internal tab bars in the app.
- All slide-up sheets should use the same animation pattern as modals already in the app (`animate-fade-in`, `fixed inset-0 z-overlay`).
- Ensure `pb-safe` padding at the bottom of scrollable content so the BottomNav doesn't cover content on iOS.

---

## File Structure to Create

```
src/
  types.ts                          ← update Tab type
  components/
    BottomNav.tsx                   ← remove Create button, add Travel tab
  App.tsx                           ← add travel case, update TAB_ORDER
  views/
    TravelView.tsx                  ← shell with header + secondary nav
    travel/
      MapsModule.tsx                ← Leaflet map + filters + place sheet
      AviationModule.tsx            ← route map + animated flight paths + list
      FinancialPlannerModule.tsx    ← AI trip planner form + output
  data/
    travelPlaces.ts                 ← 15+ Jamaican destinations seed data
    aviationRoutes.ts               ← 20+ routes from KIN/MBJ
```

---

## Dependencies to Install

Run these before coding:

```bash
npm install react-leaflet leaflet @types/leaflet
```

Leaflet CSS must be imported in the relevant component:
```ts
import 'leaflet/dist/leaflet.css';
```

Fix Leaflet's default icon issue in React (known issue) by adding this near the Leaflet import:
```ts
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });
```

---

## Capacitor / PWA Compatibility Notes

- `navigator.geolocation` works in Capacitor natively — no plugin needed for basic geolocation.
- Leaflet maps work in Capacitor WebView — no special configuration needed.
- All `localStorage` usage follows existing patterns in the app.
- Do **not** use `window.open` for in-app navigation — use React state only.
- External links (social media, airline sites) should use `window.open(url, '_blank')`.

---

## Supabase (Backend) — Future Tables (Scaffold Only)

Do **not** implement Supabase integration now, but add `TODO` comments where Supabase sync would go for:
- Saved places (`likkle_travel_saved_places` → future `travel_saved_places` table)
- Trip lists (`likkle_travel_trip_lists` → future `travel_trip_lists` table)
- Saved trip plans (`likkle_travel_plans` → future `travel_plans` table)
- Savings goals (`likkle_travel_savings_goals` → future `travel_savings_goals` table)

---

## Acceptance Criteria

1. The bottom nav (mobile) and sidebar (desktop) now show **Travel** with a plane icon where Create used to be.
2. Tapping Travel opens the Travel view with a **back button** and **3 secondary tabs**: Maps, Aviation Routes, Financial Planner.
3. The **Maps module** renders a Leaflet map centred on Jamaica with at least 15 place markers, working filter chips, a legend, and a slide-up detail sheet when a marker is tapped.
4. The **Aviation module** shows animated dotted flight paths on a map and a searchable route list for KIN/MBJ routes.
5. The **Financial Planner** has a full trip input form, calls Gemini AI, and renders a formatted cost breakdown with a savings goal tracker.
6. All three modules are **fully responsive** — usable on 375px mobile, tablet, and 1280px desktop.
7. Dark mode works correctly throughout — all new components respect `dark:` classes.
8. No TypeScript errors. No console errors on load.
9. The existing "Create Wisdom" flow is **not broken** — it still works from the Profile tab (just removed from the nav bar).

---

## Verification Step

After implementation, use `build-web-apps:frontend-testing-debugging` and `browser:control-in-app-browser` to:
1. Screenshot the bottom nav and confirm the Travel tab with plane icon is visible.
2. Navigate to the Travel tab and screenshot all 3 module views.
3. Tap a map marker and confirm the slide-up sheet appears with place data.
4. Submit the financial planner form and confirm an AI response renders.
5. Confirm the back button returns to the Home tab.
