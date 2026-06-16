# Likkle Wisdom — Info (Tourist Safety) Module Implementation Prompt

## Project Context

This is a React/TypeScript PWA (Jamaican cultural wisdom app) using Tailwind CSS, Material Symbols icons, and a dark/light theme system. The app has a Travel module (`src/views/TravelView.tsx`) with sub-modules: Maps, Aviation Routes, Financial Planner, My Trip — each rendered inside a tab layout and kept mounted for state preservation.

**Key existing patterns to follow:**
- Theme: `dark:bg-background-dark` (dark), `bg-slate-50` (light). Accent: `text-primary` (#13ec5b green), gold: `text-jamaican-gold` (#f4d125)
- Glass cards: `glass rounded-2xl` with `border-white/5 shadow-xl`
- All UI must handle both `dark:` and light mode
- Responsive sizing via Tailwind prefixes (`sm:`, `lg:`) for 320px phones through wide desktop
- Travel sub-tabs stay mounted with `display: none/block` to preserve state when switching
- AI streaming uses `streamTravelText()` / `streamChatWithGuide()` from `src/services/geminiService.ts` via OpenRouter free models
- Maps use `react-leaflet` with `MapContainer`, `Marker`, `TileLayer`, `Tooltip`
- Mobile nav: `TravelBottomNav.tsx` (rounded pill bar, fixed bottom). Desktop nav: inline tab bar in `TravelView.tsx` header

**Existing file structure:**
```
src/
  components/
    TravelBottomNav.tsx        ← TravelTab type + mobile nav (Home | Maps | Routes | Finance | My Trip)
    BottomNav.tsx              ← Main app nav
    NavigationChatbot.tsx      ← Existing AI chat pattern (reuse as reference)
    travel/
      AILoadingSkeleton.tsx
      TravelMarkdown.tsx       ← Renders AI markdown output
      PlaceReviews.tsx
      PullUpHandle.tsx
      InvalidateMapSize.tsx
  views/
    TravelView.tsx             ← Travel module shell, mounts sub-modules, desktop tab bar
    travel/
      MapsModule.tsx           ← Leaflet map + places + AI guide generation
      AviationModule.tsx
      FinancialPlannerModule.tsx ← Budget planning + AI trip plan generation
      TripPlannerModule.tsx    ← Itinerary builder + AI improvement
  services/
    geminiService.ts           ← streamTravelText(), streamChatWithGuide(), streamSafetyChat() (to add)
  data/
    travelPlaces.ts            ← Place data with coordinates
    aviationRoutes.ts
  hooks/
    useIsDesktop.ts
    useAIProgress.ts
```

**Current TravelBottomNav layout (mobile):**
Position 1: Home button (calls `onBack` to exit travel) — **this becomes the Info tab**
Position 2: Maps
Position 3: Routes
Position 4: Finance
Position 5: My Trip

**Current TravelTab type:** `'maps' | 'aviation' | 'planner' | 'tripplanner'`

---

## 1. NAV RESTRUCTURE — Replace Home with Info Tab

### 1.1 — Update TravelTab type

**File:** `src/components/TravelBottomNav.tsx` (line 3)

```ts
// BEFORE:
export type TravelTab = 'maps' | 'aviation' | 'planner' | 'tripplanner';

// AFTER:
export type TravelTab = 'info' | 'maps' | 'aviation' | 'planner' | 'tripplanner';
```

### 1.2 — Update TravelBottomNav tabs array and remove standalone Home button

**File:** `src/components/TravelBottomNav.tsx`

Current tabs array (line 11):
```ts
const tabs: { id: TravelTab; label: string; icon: string }[] = [
  { id: 'maps', label: 'Maps', icon: 'map' },
  { id: 'aviation', label: 'Routes', icon: 'connecting_airports' },
  { id: 'planner', label: 'Finance', icon: 'savings' },
  { id: 'tripplanner', label: 'My Trip', icon: 'route' }
];
```

Replace with:
```ts
const tabs: { id: TravelTab; label: string; icon: string }[] = [
  { id: 'info', label: 'Info', icon: 'shield' },
  { id: 'maps', label: 'Maps', icon: 'map' },
  { id: 'aviation', label: 'Routes', icon: 'connecting_airports' },
  { id: 'planner', label: 'Finance', icon: 'savings' },
  { id: 'tripplanner', label: 'My Trip', icon: 'route' }
];
```

Remove the standalone Home/back button (lines 29–37 in the nav render). All five nav slots are now tabs. The back-to-home arrow already exists in the `TravelView.tsx` header (line 28–35).

### 1.3 — Update TravelView.tsx desktop tab bar + mount InfoModule

**File:** `src/views/TravelView.tsx`

Add Info to the `travelTabs` array (line 16) as the first entry:
```ts
import InfoModule from './travel/InfoModule';

const travelTabs: { id: TravelTab; label: string; icon: string }[] = [
  { id: 'info', label: 'Safety Info', icon: 'shield' },
  { id: 'maps', label: 'Maps', icon: 'map' },
  { id: 'aviation', label: 'Aviation Routes', icon: 'connecting_airports' },
  { id: 'planner', label: 'Financial Planner', icon: 'savings' },
  { id: 'tripplanner', label: 'My Trip', icon: 'route' }
];
```

Add the mount block inside the render (before the MapsModule block at line 72):
```tsx
<div style={{ display: travelTab === 'info' ? 'block' : 'none' }}>
  <InfoModule user={user} />
</div>
```

### 1.4 — Update App.tsx defaults and resets

**File:** `src/App.tsx`

Change default travel tab (line ~94):
```ts
const [travelTab, setTravelTab] = useState<TravelTab>('info');
```

Update all reset points (lines ~760, ~919) from `setTravelTab('maps')` to `setTravelTab('info')`.

---

## 2. INFO MODULE — Main Structure with Sub-Navigation

### 2.1 — Create InfoModule.tsx

**New file:** `src/views/travel/InfoModule.tsx`

The Info module has its own internal tab navigation with three sections: **Contacts**, **AI Safety Chat**, and **Danger Map**.

```tsx
import React, { useState } from 'react';
import { User } from '../../types';

type InfoTab = 'contacts' | 'chat' | 'dangermap';

interface InfoModuleProps {
  user: User;
}

const INFO_TABS: { id: InfoTab; label: string; icon: string }[] = [
  { id: 'contacts', label: 'Contacts', icon: 'contact_phone' },
  { id: 'chat', label: 'Safety AI', icon: 'security' },
  { id: 'dangermap', label: 'Danger Map', icon: 'warning' },
];

const InfoModule: React.FC<InfoModuleProps> = ({ user }) => {
  const [activeInfoTab, setActiveInfoTab] = useState<InfoTab>('contacts');

  return (
    <div className="space-y-6">
      {/* Sub-navigation pill bar */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar rounded-2xl bg-slate-950/5 p-1 dark:bg-white/5" role="tablist" aria-label="Safety information sections">
        {INFO_TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeInfoTab === tab.id}
            onClick={() => setActiveInfoTab(tab.id)}
            className={`flex min-w-fit flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeInfoTab === tab.id
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                : 'text-slate-600 hover:text-slate-950 dark:text-white/50 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* All sections stay mounted for state preservation */}
      <div style={{ display: activeInfoTab === 'contacts' ? 'block' : 'none' }}>
        {/* ContactsSection — see section 3 */}
      </div>
      <div style={{ display: activeInfoTab === 'chat' ? 'block' : 'none' }}>
        {/* SafetyChatSection — see section 4 */}
      </div>
      <div style={{ display: activeInfoTab === 'dangermap' ? 'block' : 'none' }}>
        {/* DangerMapSection — see section 5 */}
      </div>
    </div>
  );
};

export default InfoModule;
```

**Design note:** Use `bg-red-500` as the active accent for Info's sub-tabs (safety = red) to visually distinguish from the green primary accent used elsewhere. Apply consistently across Info module headers, active states, and key icons.

---

## 3. CONTACTS SECTION — Emergency Directory + Nearest Contacts

### 3.1 — Emergency contacts data file

**New file:** `src/data/emergencyContacts.ts`

```ts
export interface EmergencyContact {
  id: string;
  name: string;
  type: 'police' | 'hospital' | 'fire' | 'clinic' | 'doctor' | 'embassy' | 'coastguard' | 'other';
  parish: string;                    // e.g. "Kingston", "St. James", "St. Ann"
  address: string;
  phone: string;                     // primary phone number
  altPhone?: string;                 // secondary number
  email?: string;
  coordinates: [number, number];     // [lat, lng] for map + distance calc
  is24hr?: boolean;
  notes?: string;                    // e.g. "Trauma centre", "Tourist police unit"
}

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  // ===== NATIONAL NUMBERS =====
  { id: 'nat-1', name: 'Jamaica Emergency (Police/Fire/Ambulance)', type: 'police', parish: 'National', address: 'All Jamaica', phone: '119', coordinates: [18.1096, -77.2975], is24hr: true, notes: 'Universal emergency number' },
  { id: 'nat-2', name: 'Jamaica Ambulance Service', type: 'hospital', parish: 'National', address: 'All Jamaica', phone: '110', coordinates: [18.1096, -77.2975], is24hr: true },
  { id: 'nat-3', name: 'Fire Department', type: 'fire', parish: 'National', address: 'All Jamaica', phone: '110', coordinates: [18.1096, -77.2975], is24hr: true },
  { id: 'nat-4', name: 'Jamaica Tourist Board', type: 'other', parish: 'National', address: '64 Knutsford Boulevard, Kingston', phone: '1-876-929-9200', email: 'info@visitjamaica.com', coordinates: [18.0073, -76.7873], notes: 'Tourism assistance' },
  { id: 'nat-5', name: 'Jamaica Coastguard', type: 'coastguard', parish: 'National', address: 'All Jamaica', phone: '1-876-967-8031', coordinates: [18.1096, -77.2975], is24hr: true },

  // ===== KINGSTON & ST. ANDREW =====
  { id: 'kgn-1', name: 'Kingston Public Hospital', type: 'hospital', parish: 'Kingston', address: 'North St, Kingston', phone: '1-876-922-0210', coordinates: [18.0012, -76.7920], is24hr: true, notes: 'Major trauma centre' },
  { id: 'kgn-2', name: 'University Hospital of the West Indies', type: 'hospital', parish: 'St. Andrew', address: 'Mona, Kingston 7', phone: '1-876-927-1620', coordinates: [18.0180, -76.7484], is24hr: true },
  { id: 'kgn-3', name: 'Half Way Tree Police Station', type: 'police', parish: 'St. Andrew', address: 'Half Way Tree Rd', phone: '1-876-926-8184', coordinates: [18.0113, -76.7867], is24hr: true },
  { id: 'kgn-4', name: 'Matilda\'s Corner Police Station', type: 'police', parish: 'Kingston', address: 'East Queen St', phone: '1-876-922-2680', coordinates: [17.9976, -76.7894], is24hr: true },
  { id: 'kgn-5', name: 'Andrews Memorial Hospital', type: 'hospital', parish: 'St. Andrew', address: '27 Hope Road, Kingston 10', phone: '1-876-926-7401', coordinates: [18.0144, -76.7755], is24hr: true },
  { id: 'kgn-6', name: 'Medical Associates Hospital', type: 'hospital', parish: 'St. Andrew', address: '18 Tangerine Place, Kingston 10', phone: '1-876-926-1400', coordinates: [18.0096, -76.7852], is24hr: true },
  { id: 'kgn-7', name: 'York Park Fire Station', type: 'fire', parish: 'Kingston', address: 'Kingston', phone: '110', coordinates: [17.9980, -76.7940], is24hr: true },

  // ===== ST. JAMES (MONTEGO BAY) =====
  { id: 'stj-1', name: 'Cornwall Regional Hospital', type: 'hospital', parish: 'St. James', address: 'Mount Salem, Montego Bay', phone: '1-876-952-5100', coordinates: [18.4707, -77.9260], is24hr: true, notes: 'Western Jamaica major hospital' },
  { id: 'stj-2', name: 'Freeport Police Station', type: 'police', parish: 'St. James', address: 'Freeport, Montego Bay', phone: '1-876-952-1557', coordinates: [18.4553, -77.9231], is24hr: true },
  { id: 'stj-3', name: 'Montego Bay Fire Station', type: 'fire', parish: 'St. James', address: 'Barnett St, Montego Bay', phone: '110', coordinates: [18.4712, -77.9210], is24hr: true },
  { id: 'stj-4', name: 'Doctors Hospital (MoBay)', type: 'hospital', parish: 'St. James', address: 'Fairfield, Montego Bay', phone: '1-876-952-1610', coordinates: [18.4680, -77.9180], is24hr: true },

  // ===== ST. ANN (OCHO RIOS) =====
  { id: 'sta-1', name: 'St. Ann\'s Bay Hospital', type: 'hospital', parish: 'St. Ann', address: 'St. Ann\'s Bay', phone: '1-876-972-2272', coordinates: [18.4372, -77.0454], is24hr: true },
  { id: 'sta-2', name: 'Ocho Rios Police Station', type: 'police', parish: 'St. Ann', address: 'DaCosta Drive, Ocho Rios', phone: '1-876-974-2533', coordinates: [18.4042, -77.1004], is24hr: true },

  // ===== WESTMORELAND (NEGRIL) =====
  { id: 'wml-1', name: 'Savanna-la-Mar Hospital', type: 'hospital', parish: 'Westmoreland', address: 'Savanna-la-Mar', phone: '1-876-955-2533', coordinates: [18.2145, -78.1316], is24hr: true },
  { id: 'wml-2', name: 'Negril Police Station', type: 'police', parish: 'Westmoreland', address: 'Norman Manley Blvd, Negril', phone: '1-876-957-4268', coordinates: [18.2692, -78.3484], is24hr: true },
  { id: 'wml-3', name: 'Negril Health Centre', type: 'clinic', parish: 'Westmoreland', address: 'West End Road, Negril', phone: '1-876-957-4926', coordinates: [18.2650, -78.3550] },

  // ===== PORTLAND (PORT ANTONIO) =====
  { id: 'ptl-1', name: 'Port Antonio Hospital', type: 'hospital', parish: 'Portland', address: 'Naylor\'s Hill, Port Antonio', phone: '1-876-993-2646', coordinates: [18.1772, -76.4502], is24hr: true },
  { id: 'ptl-2', name: 'Port Antonio Police Station', type: 'police', parish: 'Portland', address: 'Harbour St, Port Antonio', phone: '1-876-993-2546', coordinates: [18.1767, -76.4517], is24hr: true },

  // ===== TRELAWNY (FALMOUTH) =====
  { id: 'trl-1', name: 'Falmouth Hospital', type: 'hospital', parish: 'Trelawny', address: 'Falmouth', phone: '1-876-954-3230', coordinates: [18.4944, -77.6567], is24hr: true },
  { id: 'trl-2', name: 'Falmouth Police Station', type: 'police', parish: 'Trelawny', address: 'Market St, Falmouth', phone: '1-876-954-3222', coordinates: [18.4940, -77.6560], is24hr: true },

  // ===== ST. ELIZABETH (BLACK RIVER) =====
  { id: 'ste-1', name: 'Black River Hospital', type: 'hospital', parish: 'St. Elizabeth', address: 'Black River', phone: '1-876-965-2212', coordinates: [18.0272, -77.8489], is24hr: true },
  { id: 'ste-2', name: 'Black River Police Station', type: 'police', parish: 'St. Elizabeth', address: 'High St, Black River', phone: '1-876-965-2232', coordinates: [18.0268, -77.8485], is24hr: true },

  // ===== MANCHESTER (MANDEVILLE) =====
  { id: 'man-1', name: 'Mandeville Regional Hospital', type: 'hospital', parish: 'Manchester', address: 'Hargreaves Ave, Mandeville', phone: '1-876-962-2040', coordinates: [18.0420, -77.5049], is24hr: true },
  { id: 'man-2', name: 'Mandeville Police Station', type: 'police', parish: 'Manchester', address: 'Park Crescent, Mandeville', phone: '1-876-962-2250', coordinates: [18.0415, -77.5044], is24hr: true },

  // ===== CLARENDON (MAY PEN) =====
  { id: 'cla-1', name: 'May Pen Hospital', type: 'hospital', parish: 'Clarendon', address: 'May Pen', phone: '1-876-986-2369', coordinates: [17.9714, -77.2476], is24hr: true },
  { id: 'cla-2', name: 'May Pen Police Station', type: 'police', parish: 'Clarendon', address: 'Main St, May Pen', phone: '1-876-986-2208', coordinates: [17.9710, -77.2472], is24hr: true },

  // ===== ST. CATHERINE (SPANISH TOWN) =====
  { id: 'stc-1', name: 'Spanish Town Hospital', type: 'hospital', parish: 'St. Catherine', address: 'Burke Road, Spanish Town', phone: '1-876-984-3031', coordinates: [18.0099, -76.9554], is24hr: true },
  { id: 'stc-2', name: 'Spanish Town Police Station', type: 'police', parish: 'St. Catherine', address: 'Adelaide St, Spanish Town', phone: '1-876-984-2305', coordinates: [18.0095, -76.9550], is24hr: true },

  // ===== ST. THOMAS (MORANT BAY) =====
  { id: 'stt-1', name: 'Princess Margaret Hospital', type: 'hospital', parish: 'St. Thomas', address: 'Morant Bay', phone: '1-876-982-2304', coordinates: [17.8816, -76.4100], is24hr: true },
  { id: 'stt-2', name: 'Morant Bay Police Station', type: 'police', parish: 'St. Thomas', address: 'Queen St, Morant Bay', phone: '1-876-982-2233', coordinates: [17.8812, -76.4096], is24hr: true },

  // ===== ST. MARY (PORT MARIA) =====
  { id: 'stm-1', name: 'Port Maria Hospital', type: 'hospital', parish: 'St. Mary', address: 'Port Maria', phone: '1-876-994-2228', coordinates: [18.3708, -76.8911], is24hr: true },
  { id: 'stm-2', name: 'Port Maria Police Station', type: 'police', parish: 'St. Mary', address: 'Warner St, Port Maria', phone: '1-876-994-2224', coordinates: [18.3705, -76.8907], is24hr: true },

  // ===== HANOVER (LUCEA) =====
  { id: 'han-1', name: 'Noel Holmes Hospital', type: 'hospital', parish: 'Hanover', address: 'Lucea', phone: '1-876-956-2228', coordinates: [18.4510, -78.1728], is24hr: true },
  { id: 'han-2', name: 'Lucea Police Station', type: 'police', parish: 'Hanover', address: 'Main St, Lucea', phone: '1-876-956-2222', coordinates: [18.4506, -78.1724], is24hr: true },

  // ===== EMBASSIES & CONSULATES =====
  { id: 'emb-1', name: 'US Embassy Kingston', type: 'embassy', parish: 'Kingston', address: '142 Old Hope Road, Kingston 6', phone: '1-876-702-6000', email: 'KingstonACS@state.gov', coordinates: [18.0168, -76.7628], notes: 'American citizen services' },
  { id: 'emb-2', name: 'British High Commission', type: 'embassy', parish: 'Kingston', address: '28 Trafalgar Road, Kingston 10', phone: '1-876-510-0700', coordinates: [18.0103, -76.7826], notes: 'UK citizen services' },
  { id: 'emb-3', name: 'Canadian High Commission', type: 'embassy', parish: 'Kingston', address: '3 West Kings House Road, Kingston 10', phone: '1-876-926-1500', coordinates: [18.0158, -76.7897], notes: 'Canadian citizen services' },
  { id: 'emb-4', name: 'German Embassy', type: 'embassy', parish: 'Kingston', address: '10 Waterloo Road, Kingston 10', phone: '1-876-926-6728', coordinates: [18.0115, -76.7860] },
  { id: 'emb-5', name: 'Japanese Embassy', type: 'embassy', parish: 'Kingston', address: 'NCB Towers, 2 Oxford Road, Kingston 5', phone: '1-876-929-3338', coordinates: [18.0067, -76.7870] },
];

export const CONTACT_TYPE_META: Record<EmergencyContact['type'], { label: string; icon: string; color: string }> = {
  police:     { label: 'Police',      icon: 'local_police',          color: '#3b82f6' },
  hospital:   { label: 'Hospital',    icon: 'local_hospital',        color: '#ef4444' },
  fire:       { label: 'Fire',        icon: 'local_fire_department', color: '#f97316' },
  clinic:     { label: 'Clinic',      icon: 'medical_services',      color: '#10b981' },
  doctor:     { label: 'Doctor',      icon: 'stethoscope',           color: '#8b5cf6' },
  embassy:    { label: 'Embassy',     icon: 'account_balance',       color: '#6366f1' },
  coastguard: { label: 'Coast Guard', icon: 'sailing',               color: '#0ea5e9' },
  other:      { label: 'Other',       icon: 'info',                  color: '#64748b' },
};

// All 14 parishes for dropdown filter
export const PARISHES = [
  'National', 'Kingston', 'St. Andrew', 'St. Catherine', 'Clarendon', 'Manchester',
  'St. Elizabeth', 'Westmoreland', 'Hanover', 'St. James', 'Trelawny',
  'St. Ann', 'St. Mary', 'Portland', 'St. Thomas'
];
```

**Important:** The data above is a starter set. Populate this comprehensively with **real, verified** phone numbers, addresses, and coordinates. Research each parish and include every major police station, hospital, fire station, clinic, and private doctor's office. Verify coordinates are accurate using Google Maps.

### 3.2 — Contacts section UI

Build as a component inside `InfoModule.tsx` or as a separate `src/components/travel/ContactsSection.tsx`.

**Layout — top to bottom:**

**A) Quick-dial hero bar** — Large, tappable emergency buttons at the top:
```tsx
<div className="grid grid-cols-2 gap-3">
  <a href="tel:119" className="glass rounded-2xl p-5 flex items-center gap-4 border-blue-500/20 active:scale-95 transition-transform">
    <div className="size-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
      <span className="material-symbols-outlined text-blue-500 text-2xl">local_police</span>
    </div>
    <div>
      <p className="text-slate-900 dark:text-white font-black text-lg">119</p>
      <p className="text-slate-500 dark:text-white/40 text-[9px] font-black uppercase tracking-widest">Police</p>
    </div>
  </a>
  <a href="tel:110" className="glass rounded-2xl p-5 flex items-center gap-4 border-red-500/20 active:scale-95 transition-transform">
    <div className="size-12 rounded-xl bg-red-500/20 flex items-center justify-center">
      <span className="material-symbols-outlined text-red-500 text-2xl">local_hospital</span>
    </div>
    <div>
      <p className="text-slate-900 dark:text-white font-black text-lg">110</p>
      <p className="text-slate-500 dark:text-white/40 text-[9px] font-black uppercase tracking-widest">Fire / Ambulance</p>
    </div>
  </a>
</div>
```

**B) "Nearest to You" section** — Geolocation-powered:
1. Request location via `navigator.geolocation.getCurrentPosition()` (with error handling)
2. Calculate distance from user to each contact using Haversine formula:
   ```ts
   const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
     const R = 6371; // km
     const dLat = (lat2 - lat1) * Math.PI / 180;
     const dLon = (lon2 - lon1) * Math.PI / 180;
     const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
     return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
   };
   ```
3. Sort contacts by distance, show top 5 nearest
4. Display: name, type badge, distance ("2.3 km"), tappable phone link
5. Small Leaflet map showing user position (blue dot) + nearest 5 contacts as coloured markers
6. If location denied, show: "Enable location to see nearest emergency contacts" with a "Turn On Location" button

**C) Full directory** — Filterable list below:
- **Filter bar**: Type filter chips (Police, Hospital, Fire, Clinic, etc.) + Parish dropdown + search input
- **Contact cards**: Each shows name, type icon with colour, parish, phone (`<a href="tel:...">` tappable), email (`<a href="mailto:...">` tappable), 24hr badge if applicable, "Show on Map" button
- **Map view toggle**: Button to switch the full directory into a map view showing all contacts as coloured markers. Use `CONTACT_TYPE_META` colours for marker styling.

---

## 4. AI SAFETY CHAT SECTION

### 4.1 — Add streaming safety chat to geminiService.ts

**File:** `src/services/geminiService.ts`

Add a new function:

```ts
const SAFETY_SYSTEM_PROMPT = `You are a Jamaica Tourist Safety Advisor within the Likkle Wisdom app.
Your role is to keep tourists safe in Jamaica. You provide:

1. DO'S AND DON'TS — cultural etiquette, behaviour tips, scam awareness
2. AREA-SPECIFIC SAFETY — when the user mentions a location, give specific safety info for that area
3. TIME-BASED ADVICE — when to be indoors, when to avoid certain areas, safe hours
4. BELONGING PROTECTION — safeguarding valuables, what not to wear/carry
5. VIGILANCE TIPS — situational awareness, transportation safety, nightlife safety
6. EMERGENCY PROCEDURES — what to do if robbed, injured, or in danger

Rules:
- Be factual and balanced. Jamaica is a beautiful country. Don't fearmonger, but be honest about risks.
- When the user tells you where they're staying, give specific neighbourhood tips.
- Format responses with clear sections using markdown headers and bullet points.
- Include relevant emergency numbers when appropriate (119 Police, 110 Fire/Ambulance).
- Speak in a warm, friendly tone — mix in light Patois where natural.
- If the user asks about a specific area, include: safety level, best times to visit, what to watch out for, nearest emergency services.`;

export async function streamSafetyChat(
  messages: { role: 'user' | 'assistant'; content: string }[],
  onChunk: (partialText: string) => void,
  userLocation?: { lat: number; lng: number; placeName?: string }
): Promise<string> {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) return "Mi cyaan chat right now — di API key nuh set up yet.";

  let systemContent = SAFETY_SYSTEM_PROMPT;
  if (userLocation) {
    systemContent += `\n\nThe user's current location is approximately: ${userLocation.placeName || `${userLocation.lat}, ${userLocation.lng}`}. Factor this into your safety advice.`;
  }

  const chatMessages: ChatMessage[] = [
    { role: 'system', content: systemContent },
    ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
  ];

  // Use the same streaming OpenRouter logic as streamChatWithGuide
  // (copy the streaming fetch pattern, targeting PRIMARY_MODEL then FALLBACK_MODEL)
}
```

### 4.2 — Safety chat UI

Build as a component inside `InfoModule.tsx` or as `src/components/travel/SafetyChatSection.tsx`.

**A) Welcome state** — Before the user sends their first message, show quick-topic buttons:
```tsx
const QUICK_TOPICS = [
  { label: "Do's & Don'ts", prompt: "What are the most important do's and don'ts for tourists visiting Jamaica?" },
  { label: "Beach Safety", prompt: "What safety tips should I know for Jamaican beaches?" },
  { label: "Nightlife Tips", prompt: "How can I stay safe enjoying nightlife in Jamaica?" },
  { label: "Transportation", prompt: "What's the safest way to get around Jamaica as a tourist?" },
  { label: "Where I'm Staying", prompt: "I'd like safety tips for the area I'm staying in." },
  { label: "Scam Awareness", prompt: "What common scams should tourists watch out for in Jamaica?" },
  { label: "Money Safety", prompt: "How should I handle cash, ATMs, and valuables safely in Jamaica?" },
  { label: "Hiking & Nature", prompt: "What safety precautions for hiking and nature excursions in Jamaica?" },
];
```

Each button sends the prompt text as the user's first message and starts the AI response stream.

**B) Chat interface** — Follow the same pattern as `NavigationChatbot.tsx`:
- Scrollable message area with auto-scroll to bottom
- AI messages: left-aligned, `glass rounded-2xl` card with red-tinted left border for the safety theme
- User messages: right-aligned, `bg-red-500/20 rounded-2xl` card
- Input bar at bottom: text input + send button + STT microphone button
- TTS button on each AI message
- Loading state: `AILoadingSkeleton` or pulsing dots while streaming
- Message history maintained in `useState<Message[]>`

**C) "Where are you staying?" flow:**
When the user says they want area-specific tips (or picks the "Where I'm Staying" topic):
1. AI asks: "Where in Jamaica are you staying? Share the hotel name, area, or parish."
2. User responds with a location
3. AI provides:
   - Area safety assessment
   - Specific neighbourhood tips
   - Nearest emergency contacts (cross-reference `EMERGENCY_CONTACTS` data)
   - Nearby areas to avoid
   - Safe transportation options
   - Best times to go out in that area

---

## 5. DANGER MAP SECTION

### 5.1 — Danger zones data file

**New file:** `src/data/dangerZones.ts`

```ts
export interface DangerZone {
  id: string;
  name: string;
  parish: string;
  description: string;
  severity: 'high' | 'moderate' | 'caution';
  polygon: [number, number][];      // lat/lng vertices forming the zone boundary
  timeWarning?: string;             // e.g. "Avoid after 8pm", "Daytime only recommended"
  tips: string[];
}

export const DANGER_ZONES: DangerZone[] = [
  // ===== KINGSTON =====
  {
    id: 'dz-1',
    name: 'Tivoli Gardens',
    parish: 'Kingston',
    description: 'Historically volatile area with gang activity. Not a tourist area.',
    severity: 'high',
    polygon: [[17.9740, -76.8010], [17.9740, -76.7940], [17.9700, -76.7940], [17.9700, -76.8010]],
    tips: ['Do not enter this area', 'Use alternate routes through Kingston', 'Taxi drivers know to avoid this zone']
  },
  {
    id: 'dz-2',
    name: 'Trench Town',
    parish: 'Kingston',
    description: 'Cultural significance (Bob Marley heritage) but safety concerns persist. Visit only with organized tours during daytime.',
    severity: 'moderate',
    polygon: [[17.9780, -76.8050], [17.9780, -76.7970], [17.9740, -76.7970], [17.9740, -76.8050]],
    timeWarning: 'Daytime organized tours only',
    tips: ['Only visit with a registered tour guide', 'Do not go after dark', 'Keep valuables hidden', 'Stay with your group']
  },
  {
    id: 'dz-3',
    name: 'Mountain View / August Town',
    parish: 'St. Andrew',
    description: 'Residential areas with periodic security concerns.',
    severity: 'caution',
    polygon: [[18.0100, -76.7500], [18.0100, -76.7400], [18.0020, -76.7400], [18.0020, -76.7500]],
    timeWarning: 'Avoid after dark',
    tips: ['Stick to main roads', 'Use registered taxis', 'Avoid walking alone at night']
  },

  // ===== MONTEGO BAY =====
  {
    id: 'dz-4',
    name: 'Canterbury / Norwood',
    parish: 'St. James',
    description: 'Areas outside the tourist corridor with elevated crime rates.',
    severity: 'high',
    polygon: [[18.4800, -77.9350], [18.4800, -77.9250], [18.4730, -77.9250], [18.4730, -77.9350]],
    tips: ['Stay within the Hip Strip and tourist corridor', 'Do not venture into interior communities', 'Use hotel-arranged transportation']
  },
  {
    id: 'dz-5',
    name: 'Flankers',
    parish: 'St. James',
    description: 'Community area outside the tourist zone with periodic violence.',
    severity: 'high',
    polygon: [[18.4850, -77.9400], [18.4850, -77.9320], [18.4790, -77.9320], [18.4790, -77.9400]],
    tips: ['Not a tourist destination', 'Stay on main highways if passing through', 'Keep windows up and doors locked']
  },

  // ===== SPANISH TOWN =====
  {
    id: 'dz-6',
    name: 'Spanish Town Central',
    parish: 'St. Catherine',
    description: 'Historic town with safety concerns in certain neighbourhoods.',
    severity: 'moderate',
    polygon: [[18.0150, -76.9620], [18.0150, -76.9480], [18.0050, -76.9480], [18.0050, -76.9620]],
    timeWarning: 'Daytime visits only for historical sites',
    tips: ['Visit historical sites during daytime hours', 'Use registered taxis', 'Stay in commercial/tourist areas', 'Leave before dark']
  },

  // Add more zones — research current travel advisories from:
  // - US State Department Jamaica travel advisory
  // - UK FCDO Jamaica travel advice
  // - Canadian government Jamaica travel advisory
  // Include zones in other parishes where specific areas have elevated risk
];

export const SEVERITY_META = {
  high:     { label: 'Avoid',       color: '#ef4444', fillOpacity: 0.25, borderColor: '#dc2626', icon: 'dangerous' },
  moderate: { label: 'High Caution', color: '#f97316', fillOpacity: 0.18, borderColor: '#ea580c', icon: 'warning' },
  caution:  { label: 'Stay Alert',   color: '#eab308', fillOpacity: 0.12, borderColor: '#ca8a04', icon: 'info' },
};

export const GENERAL_TIME_WARNINGS = [
  { time: 'After Dark (6pm+)', advice: 'Avoid unfamiliar areas after sunset. Use reputable taxis or hotel transportation.', icon: 'dark_mode' },
  { time: 'Late Night (10pm+)', advice: 'Stay in well-lit, populated tourist areas. Travel in groups. Pre-book transportation.', icon: 'bedtime' },
  { time: 'Early Morning (before 6am)', advice: 'Avoid walking alone. Use pre-booked transportation for airport transfers.', icon: 'wb_twilight' },
];

export const GENERAL_SAFETY_TIPS = [
  'Use JUTA (Jamaica Union of Travellers Association) licensed taxis — look for the red licence plates',
  'Keep valuables in your hotel safe, not on your person',
  'Don\'t flash expensive jewellery, watches, or electronics in public',
  'Keep a photocopy of your passport separate from the original',
  'Avoid walking alone on beaches at night',
  'Stay on main roads and avoid shortcuts through unfamiliar communities',
  'Be cautious with unofficial tour guides — use hotel-recommended services',
  'Don\'t leave drinks unattended at bars or clubs',
  'Be wary of overly friendly strangers offering unsolicited help or "deals"',
  'Keep car doors locked and windows up when driving through unfamiliar areas',
  'Download offline maps before exploring — mobile signal can be weak in rural areas',
  'Register with your embassy or consulate before travelling',
  'Carry only the cash you need for the day, leave the rest secured',
  'Use ATMs inside banks or hotels, not standalone street ATMs',
];
```

**Important:** Research current, accurate danger zone boundaries. Use official travel advisories (US State Dept, UK FCDO, Canadian gov) as sources. Be balanced — mark severity honestly but don't defame entire communities. Many "caution" areas are perfectly fine during the day with normal street awareness.

### 5.2 — Danger map UI

Build as a component inside `InfoModule.tsx` or as `src/components/travel/DangerMapSection.tsx`.

**Layout:**

**A) Map** — Full-width Leaflet map (same tile layer as MapsModule) with:
- Danger zones rendered as `<Polygon>` components from `react-leaflet`:
  ```tsx
  import { Polygon, Tooltip } from 'react-leaflet';

  {DANGER_ZONES.map(zone => (
    <Polygon
      key={zone.id}
      positions={zone.polygon}
      pathOptions={{
        color: SEVERITY_META[zone.severity].borderColor,
        fillColor: SEVERITY_META[zone.severity].color,
        fillOpacity: SEVERITY_META[zone.severity].fillOpacity,
        weight: 2,
      }}
      eventHandlers={{ click: () => setSelectedZone(zone) }}
    >
      <Tooltip>{zone.name} — {SEVERITY_META[zone.severity].label}</Tooltip>
    </Polygon>
  ))}
  ```
- User location marker (blue pulsing dot) if enabled
- Proximity alert: if user is within 2km of a high-severity zone, show a red banner at the top of the map

**B) Legend** — Always visible below or overlaid on the map:
```tsx
<div className="flex gap-3 items-center">
  {Object.entries(SEVERITY_META).map(([key, meta]) => (
    <div key={key} className="flex items-center gap-1.5">
      <div className="size-3 rounded-full" style={{ backgroundColor: meta.color }} />
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-white/50">{meta.label}</span>
    </div>
  ))}
</div>
```

**C) Time-of-day filter** — Pill buttons above the map:
- "All Zones" (default)
- "Now" (filters based on current hour — show zones where `timeWarning` applies to current time)
- "After Dark" (show zones with evening/night warnings)
- "Late Night" (show zones with late-night warnings)

**D) Zone detail panel** — When a zone polygon is clicked, show a pull-up (use `PullUpHandle.tsx` pattern from MapsModule) or slide-in panel with:
- Zone name + parish
- Severity badge (coloured)
- Description
- Time warning (if any)
- Specific tips as a list
- "Nearby Emergency Contacts" — 3 nearest from `EMERGENCY_CONTACTS`

**E) General safety tips section** — Below the map, a scrollable section with cards showing `GENERAL_SAFETY_TIPS` and `GENERAL_TIME_WARNINGS`.

---

## 6. MANDATORY SECURITY TIPS IN ALL TRAVEL AI

**This is critical — all AI-generated travel content must include security tips.**

### 6.1 — Add security suffix constant to geminiService.ts

**File:** `src/services/geminiService.ts`

```ts
export const MANDATORY_SECURITY_SUFFIX = `

IMPORTANT — SECURITY SECTION (MANDATORY):
At the end of your response, you MUST include a section titled "## 🛡️ Security Tips" containing:
1. Location-specific safety advice for the areas mentioned in the response
2. General tips: safeguarding belongings, safe transportation, scam awareness
3. Time-based warnings: safe hours, when to be indoors, areas to avoid at night
4. Emergency numbers: 119 (Police), 110 (Fire/Ambulance)
5. Nearest hospitals or police stations relevant to the mentioned locations
This section is NOT optional — it must appear in every response.
`;
```

### 6.2 — Inject into Financial Planner AI

**File:** `src/views/travel/FinancialPlannerModule.tsx`

Find where the AI prompt is constructed for financial plan generation. Append `MANDATORY_SECURITY_SUFFIX` to the prompt. Additionally, prepend location-specific context:

```ts
import { MANDATORY_SECURITY_SUFFIX } from '../../services/geminiService';

// In the prompt construction, after the existing financial planning instructions:
const prompt = `${existingPrompt}

Also include security-specific financial advice:
- Safe ATM and money exchange practices in ${form.destination}
- How to protect cash and cards while travelling
- Travel insurance recommendations
${MANDATORY_SECURITY_SUFFIX}`;
```

### 6.3 — Inject into Trip Planner AI

**File:** `src/views/travel/TripPlannerModule.tsx`

Find where the "Improve Trip" AI prompt is built. Append:

```ts
import { MANDATORY_SECURITY_SUFFIX } from '../../services/geminiService';

// In the prompt construction:
const prompt = `${existingPrompt}

For each area/parish in the itinerary, include:
- Safety assessment for that specific area
- Best times to visit each location safely
- Areas to avoid near the planned stops
- Safe transportation between stops
- Emergency contacts near the itinerary locations
${MANDATORY_SECURITY_SUFFIX}`;
```

### 6.4 — Inject into Maps Module place guide AI

**File:** `src/views/travel/MapsModule.tsx`

Find where the AI generates a guide for a selected place. Append:

```ts
import { MANDATORY_SECURITY_SUFFIX } from '../../services/geminiService';

// In the prompt construction:
const prompt = `${existingPrompt}

Include safety information for this specific location:
- How safe is this area for tourists
- Best times to visit
- What to watch out for (crowds, pickpockets, etc.)
- Nearest emergency services (police station, hospital)
${MANDATORY_SECURITY_SUFFIX}`;
```

### 6.5 — Style security sections distinctly in TravelMarkdown

**File:** `src/components/travel/TravelMarkdown.tsx`

When the rendered markdown contains a "Security Tips" or "🛡️ Security Tips" header, apply distinct styling:
- Red/amber left border (`border-l-4 border-red-500`)
- Subtle red background tint (`bg-red-500/5 dark:bg-red-500/10`)
- Shield icon prefix before the header
- Emergency phone numbers wrapped in tappable `<a href="tel:...">` links (detect patterns like `119`, `110`, `1-876-XXX-XXXX`)

```tsx
// When rendering, detect the security section and wrap it:
if (line.includes('Security Tips')) {
  return (
    <div className="mt-6 rounded-2xl border-l-4 border-red-500 bg-red-500/5 dark:bg-red-500/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-red-500">shield</span>
        <h3 className="text-red-500 font-black text-sm uppercase tracking-widest">Security Tips</h3>
      </div>
      {/* Render the security section content here */}
    </div>
  );
}
```

Also, auto-link phone numbers in the security section:
```ts
const linkifyPhoneNumbers = (text: string) =>
  text.replace(/(119|110|1-876-\d{3}-\d{4})/g, '<a href="tel:$1" class="text-red-500 font-bold underline">$1</a>');
```

---

## Implementation Order

1. **Phase 1 — Nav restructure:** Sections 1.1–1.4 (update TravelTab type, replace Home with Info in nav, mount module, update defaults)
2. **Phase 2 — Module skeleton:** Section 2.1 (InfoModule.tsx with sub-nav, three empty sections)
3. **Phase 3 — Emergency contacts:** Section 3.1 (data file) + 3.2 (contacts UI with quick-dial, nearest-to-you, full directory)
4. **Phase 4 — AI safety chat:** Section 4.1 (geminiService addition) + 4.2 (chat UI with quick topics)
5. **Phase 5 — Danger map:** Section 5.1 (data file) + 5.2 (map with polygons, time filter, zone detail panel)
6. **Phase 6 — Security tips integration:** Section 6.1–6.5 (mandatory security suffix in all travel AI + TravelMarkdown styling)

---

## Testing Checklist

- [ ] Info tab appears in position 1 of TravelBottomNav (replacing Home button)
- [ ] Back-to-home still works via the header back arrow in TravelView
- [ ] Info sub-navigation (Contacts / Safety AI / Danger Map) switches correctly
- [ ] Sub-tab state is preserved when switching between main travel tabs
- [ ] Light mode: all text readable, cards have proper contrast
- [ ] Dark mode: all text readable, red accents visible
- [ ] Mobile (375px): nav fits 5 icons, sub-nav scrollable, chat input accessible
- [ ] Desktop (1440px): Info appears in desktop tab bar, full-width content

**Contacts:**
- [ ] Tapping phone numbers initiates a call (`tel:` links)
- [ ] Tapping emails opens mail client (`mailto:` links)
- [ ] "Nearest to You" sorts by distance when location enabled
- [ ] Location permission prompt shown when location denied
- [ ] Filter by type, parish, and search all work
- [ ] Map view shows contacts with correct type-coloured markers
- [ ] 24hr badge appears on appropriate contacts

**AI Safety Chat:**
- [ ] Quick-topic buttons send correct prompts
- [ ] AI streams responses progressively
- [ ] "Where are you staying?" flow gives location-specific tips
- [ ] TTS works on AI messages
- [ ] STT works for voice input
- [ ] Chat history maintained when switching sub-tabs

**Danger Map:**
- [ ] Zones render as coloured polygons with correct severity colours
- [ ] Clicking a zone shows detail panel
- [ ] Time filter shows/hides relevant zones
- [ ] Legend displays correctly
- [ ] User location shown if enabled
- [ ] Proximity alert appears when near a high-severity zone

**Security Tips Integration:**
- [ ] Financial Planner AI output includes "🛡️ Security Tips" section
- [ ] Trip Planner AI output includes "🛡️ Security Tips" section
- [ ] Maps place guide AI output includes "🛡️ Security Tips" section
- [ ] Security sections have red border + tinted background styling
- [ ] Phone numbers in security sections are tappable
- [ ] Security tips are present in EVERY AI travel response (mandatory)
