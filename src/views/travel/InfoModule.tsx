import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, Marker, Polygon, TileLayer, Tooltip, useMap } from 'react-leaflet';
import InvalidateMapSize from '../../components/travel/InvalidateMapSize';
import TravelMarkdown from '../../components/travel/TravelMarkdown';
import AILoadingSkeleton from '../../components/travel/AILoadingSkeleton';
import MapLayerControl from '../../components/travel/MapLayerControl';
import PullUpHandle from '../../components/PullUpHandle';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { User } from '../../types';
import { EMERGENCY_CONTACTS, CONTACT_TYPE_META, PARISHES, EmergencyContact } from '../../data/emergencyContacts';
import { DANGER_ZONES, SEVERITY_META, GENERAL_TIME_WARNINGS, GENERAL_SAFETY_TIPS, DangerZone } from '../../data/dangerZones';
import { streamSafetyChat } from '../../services/geminiService';
import { fetchJamaicaNews, JamaicaNewsArticle } from '../../services/newsService';
import { useAIProgress } from '../../hooks/useAIProgress';
import { MAP_TILES } from '../../constants/mapTiles';

type InfoTab = 'contacts' | 'chat' | 'dangermap' | 'news';

interface InfoModuleProps {
  user: User;
}

const INFO_TABS: { id: InfoTab; label: string; icon: string }[] = [
  { id: 'contacts', label: 'Contacts', icon: 'contact_phone' },
  { id: 'chat', label: 'Safety AI', icon: 'security' },
  { id: 'dangermap', label: 'Danger Map', icon: 'warning' },
  { id: 'news', label: 'News', icon: 'newspaper' },
];

const JAMAICA_CENTER: [number, number] = [18.1096, -77.2975];
const LOCATION_PREF_KEY = 'likkle_location_enabled';

// ————— Haversine distance —————
const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ————— Map helpers —————
const MapRecenter: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom, { animate: true }); }, [center, map, zoom]);
  return null;
};

const makeContactIcon = (type: EmergencyContact['type']) => L.divIcon({
  className: 'info-contact-marker',
  html: `<span style="background:${CONTACT_TYPE_META[type].color};display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><i class="material-symbols-outlined" style="font-size:18px;color:#fff">${CONTACT_TYPE_META[type].icon}</i></span>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const userLocationIcon = L.divIcon({
  className: 'travel-user-location-marker',
  html: '<span class="travel-user-location-dot"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const InfoPullUpShell: React.FC<{
  onClose: () => void;
  children: React.ReactNode;
}> = ({ onClose, children }) => createPortal((
  <div
    className="fixed inset-0 z-[2147483647] flex flex-col justify-end overflow-hidden bg-black/45 backdrop-blur-sm lg:items-center lg:justify-center lg:p-6"
    onClick={onClose}
  >
    <article
      style={{ animation: 'slideUp 0.32s cubic-bezier(0.32, 0.72, 0, 1)' }}
      className="relative flex max-h-[88dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.35)] dark:bg-[#0d1f13] lg:rounded-[2rem]"
      onClick={event => event.stopPropagation()}
    >
      <div className="sticky top-0 z-20 flex min-h-[58px] items-center justify-between bg-white px-5 pt-4 dark:bg-[#0d1f13]">
        <span className="size-10" aria-hidden="true" />
        <PullUpHandle
          onClose={onClose}
          className="absolute left-1/2 top-4 flex h-7 w-20 -translate-x-1/2 items-center justify-center"
          barClassName="h-1 w-12 rounded-full bg-slate-300 dark:bg-white/20"
        />
        <button type="button" onClick={onClose} className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 shadow-lg dark:bg-white/10 dark:text-white" aria-label="Close">
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
        </button>
      </div>
      <div className="min-h-0 overflow-y-auto px-5 pb-6 pt-2 no-scrollbar">
        {children}
      </div>
    </article>
  </div>
), document.body);

// ————— Quick topics for chat —————
const QUICK_TOPICS = [
  { label: "Do's & Don'ts", prompt: "What are the most important do's and don'ts for tourists visiting Jamaica?" },
  { label: 'Beach Safety', prompt: 'What safety tips should I know for Jamaican beaches?' },
  { label: 'Nightlife Tips', prompt: 'How can I stay safe enjoying nightlife in Jamaica?' },
  { label: 'Transportation', prompt: "What's the safest way to get around Jamaica as a tourist?" },
  { label: "Where I'm Staying", prompt: "I'd like safety tips for the area I'm staying in." },
  { label: 'Scam Awareness', prompt: 'What common scams should tourists watch out for in Jamaica?' },
  { label: 'Money Safety', prompt: 'How should I handle cash, ATMs, and valuables safely in Jamaica?' },
  { label: 'Hiking & Nature', prompt: 'What safety precautions for hiking and nature excursions in Jamaica?' },
];

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// =======================================
// CONTACTS SECTION
// =======================================
const ContactsSection: React.FC = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationPreferenceEnabled, setLocationPreferenceEnabled] = useState(() => localStorage.getItem(LOCATION_PREF_KEY) === 'true');
  const [selectedContact, setSelectedContact] = useState<EmergencyContact | null>(null);
  const [showLocationDetails, setShowLocationDetails] = useState(false);
  const [typeFilter, setTypeFilter] = useState<EmergencyContact['type'] | 'all'>('all');
  const [parishFilter, setParishFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showMapView, setShowMapView] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(JAMAICA_CENTER);
  const [mapZoom, setMapZoom] = useState(9);
  const [satelliteView, setSatelliteView] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Location is not available on this device.');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setMapCenter(coords);
        setMapZoom(13);
        setLocationError(null);
        setLocationLoading(false);
      },
      () => {
        setLocationError('Enable location in your device settings to see nearest contacts.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    const syncLocationPreference = (enabled: boolean) => {
      setLocationPreferenceEnabled(enabled);
      if (enabled) {
        requestLocation();
        return;
      }
      setUserLocation(null);
      setLocationError(null);
      setLocationLoading(false);
    };

    syncLocationPreference(localStorage.getItem(LOCATION_PREF_KEY) === 'true');

    const handlePreferenceChange = (event: Event) => {
      const enabled = (event as CustomEvent<{ enabled: boolean }>).detail?.enabled ?? localStorage.getItem(LOCATION_PREF_KEY) === 'true';
      syncLocationPreference(enabled);
    };

    window.addEventListener('likkle-location-preference-change', handlePreferenceChange);
    window.addEventListener('storage', handlePreferenceChange);
    return () => {
      window.removeEventListener('likkle-location-preference-change', handlePreferenceChange);
      window.removeEventListener('storage', handlePreferenceChange);
    };
  }, [requestLocation]);

  const contactsWithDistance = useMemo(() => {
    if (!userLocation) return null;
    return EMERGENCY_CONTACTS
      .filter(c => c.parish !== 'National')
      .map(c => ({ ...c, distance: haversine(userLocation[0], userLocation[1], c.coordinates[0], c.coordinates[1]) }))
      .sort((a, b) => a.distance - b.distance);
  }, [userLocation]);

  const nearest5 = contactsWithDistance?.slice(0, 5) ?? [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return EMERGENCY_CONTACTS.filter(c => {
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (parishFilter && c.parish !== parishFilter) return false;
      if (q && !c.name.toLowerCase().includes(q) && !c.parish.toLowerCase().includes(q) && !c.address.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [typeFilter, parishFilter, search]);

  return (
    <div className="space-y-5">
      {/* Quick-dial hero */}
      <div className="grid grid-cols-2 gap-3">
        <a href="tel:119" className="glass flex items-center gap-4 rounded-2xl border-blue-500/20 p-5 active:scale-95 transition-transform">
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-500/20">
            <span className="material-symbols-outlined text-2xl text-blue-500">local_police</span>
          </div>
          <div>
            <p className="text-lg font-black text-slate-900 dark:text-white">119</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Police</p>
          </div>
        </a>
        <a href="tel:110" className="glass flex items-center gap-4 rounded-2xl border-red-500/20 p-5 active:scale-95 transition-transform">
          <div className="flex size-12 items-center justify-center rounded-xl bg-red-500/20">
            <span className="material-symbols-outlined text-2xl text-red-500">local_hospital</span>
          </div>
          <div>
            <p className="text-lg font-black text-slate-900 dark:text-white">110</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Fire / Ambulance</p>
          </div>
        </a>
      </div>

      {/* Nearest to you */}
      <section className="glass rounded-2xl p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-500">Nearest to You</p>
            <p className="mt-1 text-lg font-black text-slate-950 dark:text-white">Emergency contacts nearby</p>
          </div>
          {!userLocation && !locationPreferenceEnabled && (
            <button type="button" onClick={requestLocation} disabled={locationLoading} className="flex h-10 items-center gap-2 rounded-2xl bg-red-500 px-4 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-60">
              <span className="material-symbols-outlined text-[16px]">{locationLoading ? 'progress_activity' : 'my_location'}</span>
              {locationLoading ? 'Finding…' : 'Turn On Location'}
            </button>
          )}
        </div>
        {locationError && <p className="mb-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-600 dark:text-red-300">{locationError}</p>}
        {nearest5.length > 0 && (
          <>
            <div className="relative mb-4 overflow-hidden rounded-2xl border border-white/10">
              <MapContainer center={userLocation || JAMAICA_CENTER} zoom={13} scrollWheelZoom={false} className="h-[200px] w-full">
                <InvalidateMapSize />
                <MapRecenter center={userLocation || JAMAICA_CENTER} zoom={13} />
                <TileLayer
                  key={satelliteView ? 'sat' : 'street'}
                  attribution={satelliteView ? MAP_TILES.satellite.attribution : MAP_TILES.street.attribution}
                  url={satelliteView ? MAP_TILES.satellite.url : MAP_TILES.street.url}
                />
                {userLocation && <Marker position={userLocation} icon={userLocationIcon} zIndexOffset={1000} eventHandlers={{ click: () => setShowLocationDetails(true) }} />}
                {nearest5.map(c => (
                  <Marker key={c.id} position={c.coordinates} icon={makeContactIcon(c.type)} eventHandlers={{ click: () => setSelectedContact(c) }}>
                    <Tooltip direction="top" offset={[0, -18]}><span className="text-xs font-black">{c.name}</span></Tooltip>
                  </Marker>
                ))}
              </MapContainer>
              <div className="absolute bottom-3 right-3 z-[500]">
                <MapLayerControl satelliteView={satelliteView} onToggle={() => setSatelliteView(prev => !prev)} />
              </div>
            </div>
            <div className="space-y-2">
              {nearest5.map(c => (
                <div key={c.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950/5 p-3 dark:bg-white/5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full" style={{ background: CONTACT_TYPE_META[c.type].color + '22' }}>
                      <span className="material-symbols-outlined text-[18px]" style={{ color: CONTACT_TYPE_META[c.type].color }}>{CONTACT_TYPE_META[c.type].icon}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950 dark:text-white">{c.name}</p>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-white/40">{c.distance.toFixed(1)} km away</p>
                    </div>
                  </div>
                  <a href={`tel:${c.phone}`} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
                    <span className="material-symbols-outlined text-[20px]">call</span>
                  </a>
                </div>
              ))}
            </div>
          </>
        )}
        {!userLocation && !locationError && locationPreferenceEnabled && (
          <div className="rounded-2xl border border-dashed border-blue-500/25 p-6 text-center">
            <span className="material-symbols-outlined text-4xl text-blue-500/50">{locationLoading ? 'progress_activity' : 'my_location'}</span>
            <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">{locationLoading ? 'Finding your location...' : 'Location is on from Settings'}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-white/45">Nearest contacts will appear once your device shares a position.</p>
          </div>
        )}
        {!userLocation && !locationError && !locationPreferenceEnabled && (
          <div className="rounded-2xl border border-dashed border-red-500/25 p-6 text-center">
            <span className="material-symbols-outlined text-4xl text-red-500/40">location_off</span>
            <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">Enable location to see nearest emergency contacts</p>
          </div>
        )}
      </section>

      {/* Full directory */}
      <section className="glass rounded-2xl p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-500">Full Directory</p>
            <p className="mt-1 text-lg font-black text-slate-950 dark:text-white">{filtered.length} contacts</p>
          </div>
          <button type="button" onClick={() => setShowMapView(!showMapView)} className="flex h-10 items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 text-[10px] font-black uppercase tracking-widest text-red-500">
            <span className="material-symbols-outlined text-[16px]">{showMapView ? 'list' : 'map'}</span>
            {showMapView ? 'List' : 'Map'}
          </button>
        </div>

        {/* Filters */}
        <div className="mb-4 space-y-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts…" className="h-11 w-full rounded-2xl border border-slate-950/10 bg-white/70 px-4 text-sm font-bold text-slate-950 outline-none focus:border-red-500 dark:border-white/10 dark:bg-white/5 dark:text-white" />
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {(['all', 'police', 'hospital', 'fire', 'clinic', 'embassy', 'coastguard'] as const).map(type => (
              <button key={type} type="button" onClick={() => setTypeFilter(type)} className={`flex min-w-fit items-center gap-1.5 rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${typeFilter === type ? 'border-red-500 bg-red-500 text-white' : 'border-slate-950/10 text-slate-600 dark:border-white/10 dark:text-white/60'}`}>
                {type === 'all' ? 'All' : CONTACT_TYPE_META[type].label}
              </button>
            ))}
          </div>
          <select value={parishFilter} onChange={e => setParishFilter(e.target.value)} className="h-11 w-full rounded-2xl border border-slate-950/10 bg-white/70 px-4 text-sm font-bold text-slate-950 outline-none focus:border-red-500 dark:border-white/10 dark:bg-white/5 dark:text-white">
            <option value="">All Parishes</option>
            {PARISHES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {showMapView ? (
          <div className="relative overflow-hidden rounded-2xl border border-white/10">
            <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom className="h-[350px] w-full lg:h-[450px]">
              <InvalidateMapSize />
              <MapRecenter center={mapCenter} zoom={mapZoom} />
              <TileLayer
                key={satelliteView ? 'sat' : 'street'}
                attribution={satelliteView ? MAP_TILES.satellite.attribution : MAP_TILES.street.attribution}
                url={satelliteView ? MAP_TILES.satellite.url : MAP_TILES.street.url}
              />
              {filtered.filter(c => c.parish !== 'National').map(c => (
                <Marker key={c.id} position={c.coordinates} icon={makeContactIcon(c.type)} eventHandlers={{ click: () => setSelectedContact(c) }}>
                  <Tooltip direction="top" offset={[0, -18]}>
                    <span className="text-xs font-black">{c.name}</span><br />
                    <span className="text-[10px]">{c.phone}</span>
                  </Tooltip>
                </Marker>
              ))}
              {userLocation && <Marker position={userLocation} icon={userLocationIcon} zIndexOffset={1000} eventHandlers={{ click: () => setShowLocationDetails(true) }} />}
            </MapContainer>
            <div className="absolute bottom-4 right-4 z-[500]">
              <MapLayerControl satelliteView={satelliteView} onToggle={() => setSatelliteView(prev => !prev)} />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(c => (
              <article key={c.id} className="rounded-2xl bg-slate-950/5 p-3 dark:bg-white/5">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ background: CONTACT_TYPE_META[c.type].color + '22' }}>
                    <span className="material-symbols-outlined text-[20px]" style={{ color: CONTACT_TYPE_META[c.type].color }}>{CONTACT_TYPE_META[c.type].icon}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-slate-950 dark:text-white">{c.name}</p>
                    <p className="mt-0.5 text-[10px] font-bold text-slate-500 dark:text-white/40">{c.parish} — {c.address}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-[10px] font-black text-red-500">
                        <span className="material-symbols-outlined text-[14px]">call</span>
                        {c.phone}
                      </a>
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1.5 text-[10px] font-black text-blue-500">
                          <span className="material-symbols-outlined text-[14px]">mail</span>
                          Email
                        </a>
                      )}
                      {c.is24hr && (
                        <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1.5 text-[10px] font-black text-green-600 dark:text-green-400">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          24hr
                        </span>
                      )}
                    </div>
                    {c.notes && <p className="mt-1.5 text-[10px] font-bold text-slate-400 dark:text-white/30">{c.notes}</p>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedContact && (
        <InfoPullUpShell onClose={() => setSelectedContact(null)}>
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl shadow-lg" style={{ background: CONTACT_TYPE_META[selectedContact.type].color + '22' }}>
                <span className="material-symbols-outlined text-[28px]" style={{ color: CONTACT_TYPE_META[selectedContact.type].color }}>{CONTACT_TYPE_META[selectedContact.type].icon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-500">{CONTACT_TYPE_META[selectedContact.type].label}</p>
                <h3 className="mt-1 text-xl font-black leading-tight text-slate-950 dark:text-white">{selectedContact.name}</h3>
                <p className="mt-1 text-xs font-bold text-slate-500 dark:text-white/45">{selectedContact.parish}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <a href={`tel:${selectedContact.phone}`} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-red-500 text-[11px] font-black uppercase tracking-widest text-white">
                <span className="material-symbols-outlined text-[18px]">call</span>
                Call
              </a>
              {selectedContact.email ? (
                <a href={`mailto:${selectedContact.email}`} className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-blue-500/30 bg-blue-500/10 text-[11px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-300">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                  Email
                </a>
              ) : (
                <a href={`https://www.google.com/maps/search/?api=1&query=${selectedContact.coordinates[0]},${selectedContact.coordinates[1]}`} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 text-[11px] font-black uppercase tracking-widest text-primary">
                  <span className="material-symbols-outlined text-[18px]">map</span>
                  Maps
                </a>
              )}
            </div>

            <section className="rounded-2xl bg-slate-950/5 p-4 dark:bg-white/5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Details</p>
              <div className="mt-3 space-y-3 text-sm font-semibold text-slate-700 dark:text-white/70">
                <p className="flex items-start gap-2">
                  <span className="material-symbols-outlined mt-0.5 text-[17px] text-slate-400">location_on</span>
                  <span>{selectedContact.address}</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="material-symbols-outlined mt-0.5 text-[17px] text-slate-400">call</span>
                  <span>{selectedContact.phone}</span>
                </p>
                {selectedContact.is24hr && (
                  <p className="flex items-start gap-2">
                    <span className="material-symbols-outlined mt-0.5 text-[17px] text-green-500">schedule</span>
                    <span>Open 24 hours</span>
                  </p>
                )}
                {userLocation && (
                  <p className="flex items-start gap-2">
                    <span className="material-symbols-outlined mt-0.5 text-[17px] text-blue-500">near_me</span>
                    <span>{haversine(userLocation[0], userLocation[1], selectedContact.coordinates[0], selectedContact.coordinates[1]).toFixed(1)} km from your current location</span>
                  </p>
                )}
                {selectedContact.notes && <p>{selectedContact.notes}</p>}
              </div>
            </section>
          </div>
        </InfoPullUpShell>
      )}
      {showLocationDetails && userLocation && (
        <InfoPullUpShell onClose={() => setShowLocationDetails(false)}>
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-500 shadow-lg">
                <span className="material-symbols-outlined text-[28px]">my_location</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-500">Current Position</p>
                <h3 className="mt-1 text-xl font-black leading-tight text-slate-950 dark:text-white">Your location</h3>
                <p className="mt-1 text-xs font-bold text-slate-500 dark:text-white/45">Used to find nearby emergency contacts.</p>
              </div>
            </div>
            <section className="rounded-2xl bg-slate-950/5 p-4 dark:bg-white/5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Coordinates</p>
              <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-white/70">{userLocation[0].toFixed(5)}, {userLocation[1].toFixed(5)}</p>
            </section>
            <a href={`https://www.google.com/maps/search/?api=1&query=${userLocation[0]},${userLocation[1]}`} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-[11px] font-black uppercase tracking-widest text-white">
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              Open in Maps
            </a>
          </div>
        </InfoPullUpShell>
      )}
    </div>
  );
};

// =======================================
// SAFETY CHAT SECTION
// =======================================
const SafetyChatSection: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const aiProgress = useAIProgress(isStreaming, messages.length > 0 && !isStreaming);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, streamingText, scrollToBottom]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setIsStreaming(true);
    setStreamingText('');

    const history = nextMessages.map(m => ({ role: m.role, content: m.content }));
    const fullResponse = await streamSafetyChat(history, (partial) => setStreamingText(partial));

    setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: fullResponse }]);
    setStreamingText('');
    setIsStreaming(false);
  };

  const speakText = (text: string, msgId: string) => {
    const synth = typeof window !== 'undefined' ? (window as any).speechSynthesis : null;
    if (!synth || typeof synth.cancel !== 'function') return;
    synth.cancel();
    if (speakingId === msgId) { setSpeakingId(null); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(msgId);
    synth.speak(utterance);
  };

  const startVoiceInput = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) setInput(transcript);
    };
    recognition.start();
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col" style={{ height: hasMessages ? 'calc(100vh - 320px)' : 'auto', minHeight: hasMessages ? '400px' : 'auto' }}>
      {!hasMessages && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-red-500/10">
              <span className="material-symbols-outlined text-3xl text-red-500">security</span>
            </div>
            <h3 className="text-xl font-black text-slate-950 dark:text-white">Jamaica Safety Advisor</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-white/50">Ask me anything about staying safe in Jamaica</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {QUICK_TOPICS.map(topic => (
              <button key={topic.label} type="button" onClick={() => sendMessage(topic.prompt)} className="glass rounded-2xl p-3 text-left transition-all hover:border-red-500/30 active:scale-95">
                <p className="text-xs font-black text-slate-900 dark:text-white">{topic.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {hasMessages && (
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pb-4 no-scrollbar">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-red-500/20 text-slate-900 dark:text-white' : 'glass border-l-4 border-red-500/40'}`}>
                {msg.role === 'assistant' ? (
                  <div className="travel-md">
                    <TravelMarkdown>{msg.content}</TravelMarkdown>
                  </div>
                ) : (
                  <p className="text-sm font-bold">{msg.content}</p>
                )}
                {msg.role === 'assistant' && (
                  <button type="button" onClick={() => speakText(msg.content, msg.id)} className="mt-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-500">
                    <span className="material-symbols-outlined text-[14px]">{speakingId === msg.id ? 'stop' : 'volume_up'}</span>
                    {speakingId === msg.id ? 'Stop' : 'Listen'}
                  </button>
                )}
              </div>
            </div>
          ))}
          {isStreaming && streamingText && (
            <div className="flex justify-start">
              <div className="glass max-w-[85%] rounded-2xl border-l-4 border-red-500/40 p-4">
                <div className="travel-md"><TravelMarkdown>{streamingText}</TravelMarkdown></div>
                <span className="ml-1 inline-block size-2 animate-pulse rounded-full bg-red-500 align-middle" />
              </div>
            </div>
          )}
          {isStreaming && !streamingText && (
            <div className="flex justify-start">
              <div className="glass max-w-[85%] rounded-2xl p-4">
                <AILoadingSkeleton progress={aiProgress} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input bar */}
      <div className="mt-3 flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          placeholder="Ask about safety in Jamaica…"
          disabled={isStreaming}
          className="h-12 min-w-0 flex-1 rounded-2xl border border-slate-950/10 bg-white/70 px-4 text-sm font-bold text-slate-950 outline-none focus:border-red-500 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
        <button type="button" onClick={startVoiceInput} disabled={isStreaming} className="glass flex size-12 items-center justify-center rounded-2xl text-slate-950 dark:text-white disabled:opacity-60" aria-label="Voice input">
          <span className="material-symbols-outlined">mic</span>
        </button>
        <button type="button" onClick={() => sendMessage(input)} disabled={isStreaming || !input.trim()} className="flex size-12 items-center justify-center rounded-2xl bg-red-500 text-white disabled:opacity-60" aria-label="Send">
          <span className="material-symbols-outlined">{isStreaming ? 'progress_activity' : 'send'}</span>
        </button>
      </div>
    </div>
  );
};

// =======================================
// DANGER MAP SECTION
// =======================================
type TimeFilter = 'all' | 'now' | 'afterdark' | 'latenight';

const DangerMapSection: React.FC = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedZone, setSelectedZone] = useState<DangerZone | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [mapCenter, setMapCenter] = useState<[number, number]>(JAMAICA_CENTER);
  const [mapZoom, setMapZoom] = useState(9);
  const [satelliteView, setSatelliteView] = useState(false);
  const [showLocationDetails, setShowLocationDetails] = useState(false);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const currentHour = new Date().getHours();

  const filteredZones = useMemo(() => {
    if (timeFilter === 'all') return DANGER_ZONES;
    return DANGER_ZONES.filter(zone => {
      if (!zone.timeWarning) return false;
      const tw = zone.timeWarning.toLowerCase();
      if (timeFilter === 'now') {
        if (currentHour >= 18 && tw.includes('dark')) return true;
        if (currentHour >= 22 && tw.includes('night')) return true;
        if (currentHour < 6 && tw.includes('morning')) return true;
        if (tw.includes('daytime') && currentHour >= 6 && currentHour < 18) return true;
        return false;
      }
      if (timeFilter === 'afterdark') return tw.includes('dark') || tw.includes('night') || tw.includes('daytime');
      if (timeFilter === 'latenight') return tw.includes('night') || tw.includes('late');
      return true;
    });
  }, [timeFilter, currentHour]);

  const proximityAlert = useMemo(() => {
    if (!userLocation) return null;
    return DANGER_ZONES.filter(z => z.severity === 'high').find(z => {
      const centroid = z.polygon.reduce(([lat, lng], [pLat, pLng]) => [lat + pLat / z.polygon.length, lng + pLng / z.polygon.length], [0, 0]) as [number, number];
      return haversine(userLocation[0], userLocation[1], centroid[0], centroid[1]) < 2;
    });
  }, [userLocation]);

  const nearestContacts = useMemo(() => {
    if (!selectedZone) return [];
    const centroid = selectedZone.polygon.reduce(([lat, lng], [pLat, pLng]) => [lat + pLat / selectedZone.polygon.length, lng + pLng / selectedZone.polygon.length], [0, 0]) as [number, number];
    return EMERGENCY_CONTACTS
      .filter(c => c.parish !== 'National')
      .map(c => ({ ...c, distance: haversine(centroid[0], centroid[1], c.coordinates[0], c.coordinates[1]) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  }, [selectedZone]);

  return (
    <div className="space-y-5">
      {/* Time filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {([
          { id: 'all' as TimeFilter, label: 'All Zones' },
          { id: 'now' as TimeFilter, label: 'Now' },
          { id: 'afterdark' as TimeFilter, label: 'After Dark' },
          { id: 'latenight' as TimeFilter, label: 'Late Night' },
        ]).map(f => (
          <button key={f.id} type="button" onClick={() => setTimeFilter(f.id)} className={`flex min-w-fit items-center rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${timeFilter === f.id ? 'border-red-500 bg-red-500 text-white' : 'border-slate-950/10 text-slate-600 dark:border-white/10 dark:text-white/60'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Proximity alert */}
      {proximityAlert && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <span className="material-symbols-outlined text-red-500">warning</span>
          <p className="text-sm font-black text-red-600 dark:text-red-400">You are near {proximityAlert.name} — exercise extreme caution</p>
        </div>
      )}

      {/* Map */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
        <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom className="h-[44vh] min-h-[320px] w-full lg:h-[56vh] lg:min-h-[420px]">
          <InvalidateMapSize />
          <MapRecenter center={mapCenter} zoom={mapZoom} />
          <TileLayer
            key={satelliteView ? 'sat' : 'street'}
            attribution={satelliteView ? MAP_TILES.satellite.attribution : MAP_TILES.street.attribution}
            url={satelliteView ? MAP_TILES.satellite.url : MAP_TILES.street.url}
          />
          {filteredZones.map(zone => (
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
          {userLocation && <Marker position={userLocation} icon={userLocationIcon} zIndexOffset={1000} eventHandlers={{ click: () => setShowLocationDetails(true) }} />}
        </MapContainer>
        <div className="absolute bottom-4 right-4 z-[500]">
          <MapLayerControl satelliteView={satelliteView} onToggle={() => setSatelliteView(prev => !prev)} />
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 items-center">
        {Object.entries(SEVERITY_META).map(([key, meta]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="size-3 rounded-full" style={{ backgroundColor: meta.color }} />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-white/50">{meta.label}</span>
          </div>
        ))}
      </div>

      {/* Zone detail panel */}
      {selectedZone && (
        <InfoPullUpShell onClose={() => setSelectedZone(null)}>
        <section className="space-y-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]" style={{ color: SEVERITY_META[selectedZone.severity].color }}>{SEVERITY_META[selectedZone.severity].icon}</span>
                <h3 className="text-lg font-black text-slate-950 dark:text-white">{selectedZone.name}</h3>
              </div>
              <p className="mt-0.5 text-[10px] font-bold text-slate-500 dark:text-white/40">{selectedZone.parish}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white" style={{ background: SEVERITY_META[selectedZone.severity].color }}>
                {SEVERITY_META[selectedZone.severity].label}
              </span>
              <button type="button" onClick={() => setSelectedZone(null)} className="flex size-9 items-center justify-center rounded-full bg-slate-950/5 dark:bg-white/10" aria-label="Close">
                <span className="material-symbols-outlined text-[18px] text-slate-700 dark:text-white">close</span>
              </button>
            </div>
          </div>
          <p className="text-sm font-semibold leading-relaxed text-slate-700 dark:text-white/70">{selectedZone.description}</p>
          {selectedZone.timeWarning && (
            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-amber-500/10 px-4 py-2">
              <span className="material-symbols-outlined text-[16px] text-amber-600">schedule</span>
              <p className="text-xs font-black text-amber-700 dark:text-amber-300">{selectedZone.timeWarning}</p>
            </div>
          )}
          <div className="mt-3 space-y-1.5">
            {selectedZone.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-1 block size-2 shrink-0 rounded-full bg-red-500" />
                <p className="text-sm font-semibold text-slate-700 dark:text-white/70">{tip}</p>
              </div>
            ))}
          </div>
          {nearestContacts.length > 0 && (
            <div className="mt-4 border-t border-slate-950/10 pt-3 dark:border-white/10">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-red-500">Nearby Emergency Contacts</p>
              {nearestContacts.map(c => (
                <div key={c.id} className="flex items-center justify-between gap-2 py-1.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950 dark:text-white">{c.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-white/40">{c.distance.toFixed(1)} km</p>
                  </div>
                  <a href={`tel:${c.phone}`} className="text-xs font-black text-red-500">{c.phone}</a>
                </div>
              ))}
            </div>
          )}
        </section>
        </InfoPullUpShell>
      )}
      {showLocationDetails && userLocation && (
        <InfoPullUpShell onClose={() => setShowLocationDetails(false)}>
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-500 shadow-lg">
                <span className="material-symbols-outlined text-[28px]">my_location</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-500">Current Position</p>
                <h3 className="mt-1 text-xl font-black leading-tight text-slate-950 dark:text-white">Your location</h3>
                <p className="mt-1 text-xs font-bold text-slate-500 dark:text-white/45">Used for nearby danger-zone awareness.</p>
              </div>
            </div>
            <section className="rounded-2xl bg-slate-950/5 p-4 dark:bg-white/5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Coordinates</p>
              <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-white/70">{userLocation[0].toFixed(5)}, {userLocation[1].toFixed(5)}</p>
            </section>
            <a href={`https://www.google.com/maps/search/?api=1&query=${userLocation[0]},${userLocation[1]}`} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-[11px] font-black uppercase tracking-widest text-white">
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              Open in Maps
            </a>
          </div>
        </InfoPullUpShell>
      )}

      {/* General safety tips */}
      <section className="glass rounded-2xl p-4 shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-500">Time-of-Day Warnings</p>
        <div className="mt-3 space-y-2">
          {GENERAL_TIME_WARNINGS.map(w => (
            <div key={w.time} className="flex items-start gap-3 rounded-2xl bg-slate-950/5 p-3 dark:bg-white/5">
              <span className="material-symbols-outlined mt-0.5 text-[20px] text-amber-500">{w.icon}</span>
              <div>
                <p className="text-sm font-black text-slate-950 dark:text-white">{w.time}</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-600 dark:text-white/50">{w.advice}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass rounded-2xl p-4 shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-500">General Safety Tips</p>
        <div className="mt-3 space-y-2">
          {GENERAL_SAFETY_TIPS.map((tip, i) => (
            <div key={i} className="flex items-start gap-2 py-1">
              <span className="material-symbols-outlined mt-0.5 text-[16px] text-red-500">shield</span>
              <p className="text-sm font-semibold text-slate-700 dark:text-white/70">{tip}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

// =======================================
// NEWS SECTION
// =======================================
const newsFilters = [
  { id: 'all', label: 'All' },
  { id: 'crime', label: 'Crime' },
  { id: 'politics', label: 'Politics' },
  { id: 'health', label: 'Health' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'hotels', label: 'Hotels' },
  { id: 'tourism', label: 'Tourism' },
] as const;

type NewsFilter = typeof newsFilters[number]['id'];

const formatNewsDate = (value?: string) => {
  if (!value) return 'Latest';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Latest';
  return new Intl.DateTimeFormat('en-JM', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const articleMatchesFilter = (article: JamaicaNewsArticle, filter: NewsFilter) => {
  if (filter === 'all') return true;
  const haystack = `${article.category || ''} ${article.title} ${article.description}`.toLowerCase();
  return haystack.includes(filter);
};

const NewsSection: React.FC = () => {
  const [articles, setArticles] = useState<JamaicaNewsArticle[]>([]);
  const [filter, setFilter] = useState<NewsFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nextArticles = await fetchJamaicaNews();
      setArticles(nextArticles);
      if (nextArticles.length === 0) setError('No Jamaica news found right now. Try again shortly.');
    } catch (loadError) {
      console.error('Could not load Jamaica news', loadError);
      setError('Could not load Jamaica news right now. Try again shortly.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  const filteredArticles = useMemo(
    () => articles.filter(article => articleMatchesFilter(article, filter)),
    [articles, filter]
  );

  return (
    <div className="space-y-5">
      <section className="glass rounded-2xl p-4 shadow-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-500">Jamaica News</p>
            <h3 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Latest updates from Jamaica</h3>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500 dark:text-white/45">Breaking, crime, entertainment, health, politics, hotels, and tourism from multiple Jamaica-focused sources.</p>
          </div>
          <button type="button" onClick={loadNews} disabled={loading} className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-500 px-5 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-60">
            <span className={`material-symbols-outlined text-[17px] ${loading ? 'animate-spin' : ''}`}>{loading ? 'progress_activity' : 'refresh'}</span>
            Refresh
          </button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
          {newsFilters.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`flex min-w-fit rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === item.id ? 'border-red-500 bg-red-500 text-white' : 'border-slate-950/10 text-slate-600 dark:border-white/10 dark:text-white/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-600 dark:text-red-300">{error}</p>
      )}

      {loading && articles.length === 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map(item => (
            <div key={item} className="glass h-48 animate-pulse rounded-2xl p-4 shadow-2xl">
              <div className="h-5 w-24 rounded-full bg-slate-950/10 dark:bg-white/10" />
              <div className="mt-6 h-5 w-4/5 rounded-full bg-slate-950/10 dark:bg-white/10" />
              <div className="mt-3 h-4 w-full rounded-full bg-slate-950/10 dark:bg-white/10" />
              <div className="mt-2 h-4 w-2/3 rounded-full bg-slate-950/10 dark:bg-white/10" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredArticles.map(article => (
            <article key={article.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-950/5 dark:bg-slate-950/40 dark:ring-white/10">
              {article.imageUrl && (
                <img src={article.imageUrl} alt="" className="h-40 w-full object-cover" loading="lazy" />
              )}
              <div className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-red-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-red-500">{article.provider}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/35">{formatNewsDate(article.publishedAt)}</span>
                </div>
                <h4 className="line-clamp-2 text-base font-black leading-snug text-slate-950 dark:text-white">{article.title}</h4>
                <p className="line-clamp-3 text-sm font-semibold leading-relaxed text-slate-600 dark:text-white/55">{article.description}</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/35">{article.source}</span>
                  <a href={article.url} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white">
                    Read
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && filteredArticles.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-red-500/25 p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-red-500/40">newspaper</span>
          <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">No stories match this filter right now.</p>
        </div>
      )}
    </div>
  );
};

// =======================================
// INFO MODULE (MAIN)
// =======================================
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
        <ContactsSection />
      </div>
      <div style={{ display: activeInfoTab === 'chat' ? 'block' : 'none' }}>
        <SafetyChatSection />
      </div>
      <div style={{ display: activeInfoTab === 'dangermap' ? 'block' : 'none' }}>
        <DangerMapSection />
      </div>
      <div style={{ display: activeInfoTab === 'news' ? 'block' : 'none' }}>
        <NewsSection />
      </div>
    </div>
  );
};

export default InfoModule;
