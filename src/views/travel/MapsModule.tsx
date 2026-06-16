import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import TravelMarkdown from '../../components/travel/TravelMarkdown';
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet';
import InvalidateMapSize from '../../components/travel/InvalidateMapSize';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { User } from '../../types';
import { streamTravelText, MANDATORY_SECURITY_SUFFIX } from '../../services/geminiService';
import { MAP_TILES } from '../../constants/mapTiles';
import { notifyAIComplete } from '../../services/localNotificationsService';
import { TravelCategory, TravelPlace, travelCategoryMeta, travelPlaces } from '../../data/travelPlaces';
import AILoadingSkeleton from '../../components/travel/AILoadingSkeleton';
import PlaceReviews from '../../components/travel/PlaceReviews';
import PullUpHandle from '../../components/PullUpHandle';
import { generateGuidePDF } from '../../utils/travel/generateGuidePDF';
import { useAIProgress } from '../../hooks/useAIProgress';
import { addFavourite, fetchFavourites, removeFavourite } from '../../services/travelFavouritesService';

type FilterId = TravelCategory | 'prices' | 'all';
type TripList = { listName: string; placeIds: string[] };

const JAMAICA_CENTER: [number, number] = [18.1096, -77.2975];
const LISTS_KEY = 'lkkle_travel_trip_lists';
const LOCATION_PREF_KEY = 'likkle_location_enabled';

const filterOrder: FilterId[] = ['all', 'hotels', 'villas', 'airbnb', 'nature', 'culture', 'adventure', 'airports', 'prices'];

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};

const makePlaceIcon = (category: TravelCategory) => L.divIcon({
  className: 'travel-marker',
  html: `<span style="background:${travelCategoryMeta[category].color}"><i class="material-symbols-outlined">${travelCategoryMeta[category].icon}</i></span>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const userLocationIcon = L.divIcon({
  className: 'travel-user-location-marker',
  html: '<span class="travel-user-location-dot"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const extractUsdAmount = (value?: string) => {
  if (!value) return null;
  const normalized = value.replace(/[–—]/g, '-');
  const rangeMatch = normalized.match(/\$?\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) return Number(rangeMatch[2]);
  const amountMatch = normalized.match(/\$?\s*(\d+(?:\.\d+)?)/);
  return amountMatch ? Number(amountMatch[1]) : null;
};

const MapRecenter: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, map, zoom]);
  return null;
};

interface MapsModuleProps {
  user: User;
  onGuestRestricted: () => void;
}

const MapsModule: React.FC<MapsModuleProps> = ({ user, onGuestRestricted }) => {
  const [activeFilters, setActiveFilters] = useState<Set<FilterId>>(new Set(['all']));
  const [query, setQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<TravelPlace | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(JAMAICA_CENTER);
  const [mapZoom, setMapZoom] = useState(10);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [satelliteView, setSatelliteView] = useState(false);
  const locationWatchId = useRef<number | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const maxPlaceCost = useMemo(() => Math.max(100, ...travelPlaces.map(place => extractUsdAmount(place.averageCost) ?? 0)), []);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, maxPlaceCost]);
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>([]);
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [tripLists, setTripLists] = useState<TripList[]>(() => readJson<TripList[]>(LISTS_KEY, []));
  const [newListName, setNewListName] = useState('');
  const [showTripPicker, setShowTripPicker] = useState(false);
  const [selectedReviewStats, setSelectedReviewStats] = useState({ averageRating: 0, reviewCount: 0 });
  const [guideOpen, setGuideOpen] = useState(false);
  const [guidePrompt, setGuidePrompt] = useState(() => sessionStorage.getItem('lw_maps_guidePrompt') || '');
  const [guideResponse, setGuideResponse] = useState(() => sessionStorage.getItem('lw_maps_guideResponse') || '');
  const [isGuideLoading, setIsGuideLoading] = useState(false);
  const guideTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const guideProgress = useAIProgress(isGuideLoading, !!guideResponse && !isGuideLoading);

  React.useEffect(() => {
    setSelectedReviewStats({ averageRating: 0, reviewCount: 0 });
    setShowTripPicker(false);
  }, [selectedPlace?.id]);

  React.useEffect(() => {
    if (user.isGuest) {
      setSavedPlaceIds([]);
      return;
    }
    fetchFavourites(user.id).then(setSavedPlaceIds).catch(error => {
      console.error('Could not load travel favourites', error);
      setSavedPlaceIds([]);
    });
  }, [user.id, user.isGuest]);

  React.useEffect(() => {
    const el = guideTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [guidePrompt]);

  useEffect(() => {
    return () => {
      if (locationWatchId.current !== null) {
        navigator.geolocation.clearWatch(locationWatchId.current);
      }
    };
  }, []);

  const resizeGuideTextarea = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  };

  const visiblePlaces = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const categoryFilters = [...activeFilters].filter((filter): filter is TravelCategory => !['all', 'prices'].includes(filter));
    return travelPlaces.filter(place => {
      const matchesQuery = !normalizedQuery ||
        place.name.toLowerCase().includes(normalizedQuery) ||
        place.description.toLowerCase().includes(normalizedQuery) ||
        travelCategoryMeta[place.category].label.toLowerCase().includes(normalizedQuery);
      const matchesCategory = activeFilters.has('all') || categoryFilters.length === 0 || categoryFilters.includes(place.category);
      const placeCost = extractUsdAmount(place.averageCost);
      const matchesPrice = !activeFilters.has('prices') || (placeCost !== null && placeCost >= priceRange[0] && placeCost <= priceRange[1]);
      return matchesQuery && matchesCategory && matchesPrice;
    });
  }, [activeFilters, priceRange, query]);

  const selectedRelatedPlaces = useMemo(() => {
    if (!selectedPlace) return [];
    const sameCategory = travelPlaces.filter(place => place.id !== selectedPlace.id && place.category === selectedPlace.category);
    const otherPlaces = travelPlaces.filter(place => place.id !== selectedPlace.id && place.category !== selectedPlace.category);
    return [...sameCategory, ...otherPlaces].slice(0, 4);
  }, [selectedPlace]);

  const savedPlaces = useMemo(
    () => travelPlaces.filter(place => savedPlaceIds.includes(place.id)),
    [savedPlaceIds]
  );

  const toggleFilter = (filter: FilterId) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (filter === 'all') return new Set(['all']);
      next.delete('all');
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      if (next.size === 0) next.add('all');
      return next;
    });
  };

  const enableLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Location is not available on this device.');
      return;
    }
    if (locationWatchId.current !== null) {
      navigator.geolocation.clearWatch(locationWatchId.current);
      locationWatchId.current = null;
    }

    const handleLocation = (position: GeolocationPosition) => {
      const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
      setUserLocation(coords);
      setMapCenter(coords);
      setMapZoom(13);
      setLocationError(null);
    };
    const handleLocationError = () => {
      setLocationError('Enable location in your device settings to see your position on the map.');
      setLocationEnabled(false);
    };

    setLocationEnabled(true);
    navigator.geolocation.getCurrentPosition(handleLocation, handleLocationError, { enableHighAccuracy: true, timeout: 10000 });
    locationWatchId.current = navigator.geolocation.watchPosition(handleLocation, handleLocationError, { enableHighAccuracy: true, maximumAge: 15000 });
  };

  const disableLocation = () => {
    if (locationWatchId.current !== null) {
      navigator.geolocation.clearWatch(locationWatchId.current);
      locationWatchId.current = null;
    }
    setLocationEnabled(false);
    setUserLocation(null);
  };

  const toggleLocation = () => {
    if (locationEnabled) {
      localStorage.setItem(LOCATION_PREF_KEY, 'false');
      window.dispatchEvent(new CustomEvent('likkle-location-preference-change', { detail: { enabled: false } }));
      disableLocation();
      return;
    }

    localStorage.setItem(LOCATION_PREF_KEY, 'true');
    window.dispatchEvent(new CustomEvent('likkle-location-preference-change', { detail: { enabled: true } }));
    enableLocation();
  };

  React.useEffect(() => {
    if (localStorage.getItem(LOCATION_PREF_KEY) === 'true') enableLocation();

    const handlePreferenceChange = (event: Event) => {
      const enabled = (event as CustomEvent<{ enabled: boolean }>).detail?.enabled;
      if (enabled) enableLocation();
      else disableLocation();
    };

    window.addEventListener('likkle-location-preference-change', handlePreferenceChange);
    return () => window.removeEventListener('likkle-location-preference-change', handlePreferenceChange);
  }, []);

  const centerOnMe = () => {
    if (!userLocation) return;
    setMapCenter(userLocation);
    setMapZoom(14);
  };

  const toggleSaved = async (place: TravelPlace) => {
    if (user.isGuest) {
      onGuestRestricted();
      return;
    }
    const isSaved = savedPlaceIds.includes(place.id);
    setSavedPlaceIds(prev => isSaved ? prev.filter(id => id !== place.id) : [...prev, place.id]);
    try {
      if (isSaved) await removeFavourite(user.id, place.id);
      else await addFavourite(user.id, place.id);
    } catch (error) {
      console.error('Could not update travel favourite', error);
      setSavedPlaceIds(prev => isSaved ? [...prev, place.id] : prev.filter(id => id !== place.id));
    }
  };

  const addPlaceToList = (listName: string, placeId: string) => {
    const trimmed = listName.trim();
    if (!trimmed) return;
    setTripLists(prev => {
      const existing = prev.find(list => list.listName.toLowerCase() === trimmed.toLowerCase());
      const next = existing
        ? prev.map(list => list === existing ? { ...list, placeIds: Array.from(new Set([...list.placeIds, placeId])) } : list)
        : [...prev, { listName: trimmed, placeIds: [placeId] }];
      localStorage.setItem(LISTS_KEY, JSON.stringify(next));
      return next;
    });
    setNewListName('');
    setShowTripPicker(false);
  };

  const generateGuide = async (event: React.FormEvent) => {
    event.preventDefault();
    const prompt = guidePrompt.trim();
    if (!prompt) return;
    setIsGuideLoading(true);
    setGuideResponse('');
    const nearest = visiblePlaces.slice(0, 6).map(place => `${place.name} (${travelCategoryMeta[place.category].label})`).join(', ');
    const fallback = `Destination suggestion\n\nTry building the trip around ${visiblePlaces[0]?.name || 'Kingston and Ocho Rios'}. Keep transport flexible, reserve part of the budget for entry fees, and compare nearby places such as ${nearest || 'Dunns River Falls, Devon House, and Seven Mile Beach'}.`;
    const response = await streamTravelText(
      `Create a Jamaica travel destination guide for this request: "${prompt}". Include destination name, why it fits, estimated cost, and nearest places from this app data to highlight: ${nearest}.

Include safety information for this specific location:
- How safe is this area for tourists
- Best times to visit
- What to watch out for (crowds, pickpockets, etc.)
- Nearest emergency services (police station, hospital)
${MANDATORY_SECURITY_SUFFIX}`,
      fallback,
      (partial) => setGuideResponse(partial)
    );
    setGuideResponse(response);
    sessionStorage.setItem('lw_maps_guidePrompt', prompt);
    sessionStorage.setItem('lw_maps_guideResponse', response);
    setIsGuideLoading(false);
    notifyAIComplete('maps');
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) setGuidePrompt(transcript);
    };
    recognition.start();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="glass rounded-2xl p-4 shadow-2xl">
        <div className="flex flex-col gap-3 lg:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search destinations</span>
            <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white/40" aria-hidden="true">search</span>
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search beaches, hotels, history, or attractions"
              className="h-12 w-full rounded-2xl border border-slate-950/10 bg-white/70 pl-12 pr-4 text-sm font-bold text-slate-950 outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </label>
          <button type="button" onClick={toggleLocation} className={`flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-[11px] font-black uppercase tracking-widest ${locationEnabled ? 'bg-blue-600 text-white' : 'bg-primary text-background-dark'}`} aria-pressed={locationEnabled}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{locationEnabled ? 'my_location' : 'location_disabled'}</span>
            My Location
          </button>
          {userLocation && (
            <button type="button" onClick={centerOnMe} className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-5 text-[11px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-300">
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">center_focus_strong</span>
              Center
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (user.isGuest) {
                onGuestRestricted();
                return;
              }
              setShowSavedPanel(prev => !prev);
            }}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-5 text-[11px] font-black uppercase tracking-widest text-primary"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">favorite</span>
            Saved
          </button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
          {filterOrder.map(filter => {
            const meta = travelCategoryMeta[filter];
            const active = activeFilters.has(filter);
            return (
              <button
                key={filter}
                type="button"
                onClick={() => toggleFilter(filter)}
                className={`flex min-w-fit items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  active ? 'border-primary bg-primary text-background-dark' : 'border-slate-950/10 bg-white/50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-white/60'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">{meta.icon}</span>
                {meta.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/25 lg:hidden" aria-hidden="true">
          ← swipe to see more options →
        </p>
        {locationError && (
          <p className="mt-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-xs font-bold text-blue-700 dark:text-blue-200" role="status">
            {locationError}
          </p>
        )}

        {activeFilters.has('prices') && (
          <div className="mt-4 glass rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Price Range</p>
                <p className="text-sm font-black text-slate-950 dark:text-white">USD ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}</p>
              </div>
              <span className="material-symbols-outlined text-jamaican-gold" aria-hidden="true">payments</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Minimum</span>
                <input
                  type="range"
                  min={0}
                  max={maxPlaceCost}
                  value={priceRange[0]}
                  onChange={event => setPriceRange(([, max]) => [Math.min(Number(event.target.value), max), max])}
                  className="w-full accent-primary"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Maximum</span>
                <input
                  type="range"
                  min={0}
                  max={maxPlaceCost}
                  value={priceRange[1]}
                  onChange={event => setPriceRange(([min]) => [min, Math.max(Number(event.target.value), min)])}
                  className="w-full accent-primary"
                />
              </label>
            </div>
          </div>
        )}

        {showSavedPanel && (
          <div className="mt-4 rounded-2xl border border-primary/15 bg-white/70 p-4 dark:bg-white/5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Saved Places</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-white/50">{savedPlaces.length} saved</p>
              </div>
              <button type="button" onClick={() => setShowSavedPanel(false)} className="flex size-9 items-center justify-center rounded-full bg-slate-950/5 text-slate-700 dark:bg-white/10 dark:text-white" aria-label="Close saved places">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
              </button>
            </div>
            {savedPlaces.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-primary/25 p-6 text-center">
                <span className="material-symbols-outlined text-4xl text-primary" aria-hidden="true">favorite_border</span>
                <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">No saved places yet.</p>
                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-white/50">Tap ♡ on any place to save it here.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {savedPlaces.map(place => (
                  <article key={place.id} className="flex gap-3 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-950/5 dark:bg-slate-950/40 dark:ring-white/10">
                    <button type="button" onClick={() => setSelectedPlace(place)} className="flex min-w-0 flex-1 gap-3 text-left">
                      <img src={place.imageUrl} alt="" className="size-16 rounded-xl object-cover" />
                      <span className="min-w-0 py-1">
                        <span className="block truncate text-sm font-black text-slate-950 dark:text-white">{place.name}</span>
                        <span className="mt-1 flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-white/50">
                          <span className="material-symbols-outlined text-[13px]" aria-hidden="true">{travelCategoryMeta[place.category].icon}</span>
                          {travelCategoryMeta[place.category].label}
                        </span>
                        {place.averageCost && <span className="mt-1 block truncate text-[10px] font-bold text-primary">{place.averageCost}</span>}
                      </span>
                    </button>
                    <button type="button" onClick={() => toggleSaved(place)} className="flex size-9 shrink-0 items-center justify-center rounded-full text-red-500" aria-label={`Remove ${place.name} from saved places`}>
                      <span className="material-symbols-outlined fill-1 text-[20px]" aria-hidden="true">favorite</span>
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
        <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom className="h-[44vh] min-h-[320px] w-full lg:h-[56vh] lg:min-h-[420px]">
          <InvalidateMapSize />
          <MapRecenter center={mapCenter} zoom={mapZoom} />
          <TileLayer
            key={satelliteView ? 'sat' : 'street'}
            attribution={satelliteView ? MAP_TILES.satellite.attribution : MAP_TILES.street.attribution}
            url={satelliteView ? MAP_TILES.satellite.url : MAP_TILES.street.url}
          />
          {visiblePlaces.map(place => (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={makePlaceIcon(place.category)}
              eventHandlers={{
                click: () => setSelectedPlace(place)
              }}
            >
              <Tooltip direction="auto" offset={[0, -10]} opacity={1} className="travel-marker-tooltip">
                <span style={{ fontWeight: 800, fontSize: '11px', whiteSpace: 'nowrap', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {place.name}
                </span>
              </Tooltip>
            </Marker>
          ))}
          {userLocation && <Marker position={userLocation} icon={userLocationIcon} zIndexOffset={1000} />}
        </MapContainer>

        <div className="absolute bottom-4 right-4 z-[500] flex flex-col items-end gap-2">
          <button type="button" onClick={() => setSatelliteView(prev => !prev)} className={`glass flex items-center gap-2 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest shadow-2xl ${satelliteView ? 'bg-blue-600 text-white' : 'text-slate-950 dark:text-white'}`} aria-pressed={satelliteView}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{satelliteView ? 'map' : 'satellite_alt'}</span>
            {satelliteView ? 'Street' : 'Satellite'}
          </button>
          <button type="button" onClick={() => setLegendOpen(prev => !prev)} className="glass flex items-center gap-2 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-950 shadow-2xl dark:text-white">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">legend_toggle</span>
            Legend
          </button>
          {legendOpen && (
            <div className="glass mt-2 w-64 rounded-2xl p-4 shadow-2xl">
              {(['hotels', 'villas', 'airbnb', 'nature', 'culture', 'adventure', 'airports'] as TravelCategory[]).map(category => (
                <div key={category} className="flex items-center gap-3 py-1.5">
                  <span className="flex size-8 items-center justify-center rounded-full text-background-dark" style={{ background: travelCategoryMeta[category].color }}>
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">{travelCategoryMeta[category].icon}</span>
                  </span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">{travelCategoryMeta[category].label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-4 shadow-2xl">
        <button type="button" onClick={() => setGuideOpen(prev => !prev)} className="flex w-full items-center justify-between gap-4 text-left">
          <span>
            <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-primary">AI Destination Guide</span>
            <span className="mt-1 block text-lg font-black text-slate-950 dark:text-white">Ask for a route, budget, or vibe</span>
          </span>
          <span className="material-symbols-outlined text-primary" aria-hidden="true">{guideOpen ? 'expand_less' : 'expand_more'}</span>
        </button>
        {guideOpen && (
          <form onSubmit={generateGuide} className="mt-4 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <textarea
                ref={guideTextareaRef}
                value={guidePrompt}
                onChange={event => {
                  setGuidePrompt(event.target.value);
                  resizeGuideTextarea(event.currentTarget);
                }}
                onKeyDown={event => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    generateGuide(event);
                  }
                }}
                placeholder="Where do you want to go? What's your budget?"
                rows={1}
                className="min-h-[48px] w-full resize-none overflow-hidden rounded-2xl border border-slate-950/10 bg-white/70 px-4 py-3 text-sm font-bold leading-relaxed text-slate-950 outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white sm:flex-1"
              />
              <div className="flex gap-2">
                <button type="button" onClick={startVoiceInput} className="glass flex size-12 items-center justify-center rounded-2xl text-slate-950 dark:text-white" aria-label="Use voice input">
                  <span className="material-symbols-outlined" aria-hidden="true">mic</span>
                </button>
                <button type="submit" disabled={isGuideLoading} className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 text-[11px] font-black uppercase tracking-widest text-background-dark disabled:opacity-60">
                  <span className={`material-symbols-outlined mr-1 text-[14px] ${isGuideLoading ? 'animate-spin' : ''}`} aria-hidden="true">
                    {isGuideLoading ? 'progress_activity' : 'auto_awesome'}
                  </span>
                  {isGuideLoading ? 'Thinking…' : 'Guide Me'}
                </button>
              </div>
            </div>
            {(isGuideLoading || guideResponse) && (
              <div className="rounded-2xl bg-slate-950/5 p-4 dark:bg-white/5">
                {isGuideLoading && !guideResponse ? (
                  <AILoadingSkeleton progress={guideProgress} />
                ) : (
                  <>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">auto_awesome</span>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">AI Destination Guide</p>
                      <div className="h-px flex-1 bg-primary/20" />
                    </div>
                    <div className="travel-md rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-transparent p-5 shadow-inner dark:from-primary/8">
                      <TravelMarkdown>{guideResponse}</TravelMarkdown>
                      {isGuideLoading && <span className="inline-block size-2 bg-primary rounded-full animate-pulse ml-1 align-middle" />}
                    </div>
                    {!isGuideLoading && (
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => generateGuidePDF(guidePrompt, guideResponse)}
                          className="flex items-center gap-2 rounded-2xl border border-primary px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-primary transition-colors hover:bg-primary/10"
                        >
                          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">download</span>
                          Download PDF
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </form>
        )}
      </div>

      {selectedPlace && createPortal((
        <div
          className="fixed inset-0 z-[2147483647] flex flex-col justify-end overflow-hidden bg-black/45 backdrop-blur-sm lg:items-center lg:justify-center lg:p-6"
          onClick={() => setSelectedPlace(null)}
        >
          <article
            style={{ animation: 'slideUp 0.38s cubic-bezier(0.32, 0.72, 0, 1)' }}
            className="relative flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.35)] dark:bg-[#0d1f13] lg:h-auto lg:max-h-[88vh] lg:rounded-[2rem]"
            onClick={event => event.stopPropagation()}
          >
            <div className="sticky top-0 z-30 flex min-h-[64px] items-center justify-between bg-white px-5 pb-2 pt-[max(1rem,env(safe-area-inset-top))] dark:bg-[#0d1f13] lg:hidden">
              <button
                type="button"
                onClick={() => setSelectedPlace(null)}
                className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 shadow-lg dark:bg-white/10 dark:text-white"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
              </button>
              <PullUpHandle
                onClose={() => setSelectedPlace(null)}
                className="absolute left-1/2 top-[calc(max(1rem,env(safe-area-inset-top))+0.625rem)] flex h-6 w-16 -translate-x-1/2 items-center justify-center"
                barClassName="h-1 w-10 rounded-full bg-slate-300 dark:bg-white/20"
              />
              <button
                type="button"
                onClick={() => toggleSaved(selectedPlace)}
                className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 shadow-lg dark:bg-white/10 dark:text-white"
                aria-label={savedPlaceIds.includes(selectedPlace.id) ? 'Remove saved place' : 'Save place'}
              >
                <span className={`material-symbols-outlined text-[22px] ${savedPlaceIds.includes(selectedPlace.id) ? 'fill-1 text-red-500' : ''}`} aria-hidden="true">
                  {savedPlaceIds.includes(selectedPlace.id) ? 'favorite' : 'favorite_border'}
                </span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPlace(null)}
              className="absolute right-5 top-5 z-30 hidden size-10 items-center justify-center rounded-full bg-white text-slate-950 shadow-lg lg:flex"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
            </button>
            <div className="relative h-[260px] shrink-0 overflow-hidden bg-slate-200 lg:rounded-t-[2rem]">
              <img src={selectedPlace.imageUrl} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/25 to-transparent" />
              <button type="button" onClick={() => toggleSaved(selectedPlace)} className="absolute right-16 top-5 hidden size-10 items-center justify-center rounded-full bg-white text-slate-950 shadow-lg lg:flex" aria-label={savedPlaceIds.includes(selectedPlace.id) ? 'Remove saved place' : 'Save place'}>
                <span className={`material-symbols-outlined text-[22px] ${savedPlaceIds.includes(selectedPlace.id) ? 'fill-1 text-red-500' : ''}`} aria-hidden="true">
                  {savedPlaceIds.includes(selectedPlace.id) ? 'favorite' : 'favorite_border'}
                </span>
              </button>
            </div>

            <div
              style={{ marginTop: -70 }}
              className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto rounded-t-[2.15rem] bg-white px-5 pb-5 pt-3 text-slate-950 no-scrollbar dark:bg-[#07120a] dark:text-white"
            >
              <PullUpHandle onClose={() => setSelectedPlace(null)} />
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-[1.45rem] font-black leading-tight tracking-tight">{selectedPlace.name}</h2>
                  <div className="mt-2 flex items-center gap-1.5 text-[12px] font-bold text-slate-700 dark:text-white/70">
                    <span className="flex size-4 items-center justify-center rounded-full text-[10px] text-[#07120a]" style={{ background: travelCategoryMeta[selectedPlace.category].color }}>
                      <span className="material-symbols-outlined text-[11px]" aria-hidden="true">{travelCategoryMeta[selectedPlace.category].icon}</span>
                    </span>
                    Jamaica
                  </div>
                </div>
                {selectedReviewStats.reviewCount > 0 && (
                  <div className="shrink-0 text-right">
                    <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-[10px] font-black dark:border-white/15">
                      <span className="material-symbols-outlined text-[13px]" aria-hidden="true">star</span>
                      {selectedReviewStats.averageRating.toFixed(1)}
                    </div>
                    <p className="mt-1 text-[10px] font-bold text-slate-700 underline underline-offset-2 dark:text-white/70">
                      {selectedReviewStats.reviewCount} review{selectedReviewStats.reviewCount === 1 ? '' : 's'}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-2xl bg-primary/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-primary">
                  <span className="material-symbols-outlined text-[15px]" aria-hidden="true">{travelCategoryMeta[selectedPlace.category].icon}</span>
                  {travelCategoryMeta[selectedPlace.category].label}
                </span>
                {selectedPlace.averageCost && (
                  <span className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-950/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:bg-white/10 dark:text-white/80">
                    <span className="material-symbols-outlined text-[15px]" aria-hidden="true">payments</span>
                    {selectedPlace.averageCost}
                  </span>
                )}
              </div>

              <section className="mt-5">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">About & History</p>
                <p className="text-sm font-semibold leading-relaxed text-slate-700 dark:text-white/75">
                  {selectedPlace.description}
                </p>
              </section>

              {(selectedPlace.website || Object.values(selectedPlace.social ?? {}).some(Boolean)) && (
                <section className="mt-5">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Links</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlace.website && (
                      <a href={selectedPlace.website} target="_blank" rel="noreferrer" className="glass flex items-center gap-1.5 rounded-2xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-950 dark:text-white">
                        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">language</span>
                        Official Website
                      </a>
                    )}
                    {selectedPlace.social?.instagram && (
                      <a href={selectedPlace.social.instagram} target="_blank" rel="noreferrer" className="glass flex items-center gap-1.5 rounded-2xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#E1306C]">
                        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">photo_camera</span>
                        Instagram
                      </a>
                    )}
                    {selectedPlace.social?.facebook && (
                      <a href={selectedPlace.social.facebook} target="_blank" rel="noreferrer" className="glass flex items-center gap-1.5 rounded-2xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#1877F2]">
                        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">groups</span>
                        Facebook
                      </a>
                    )}
                    {selectedPlace.social?.youtube && (
                      <a href={selectedPlace.social.youtube} target="_blank" rel="noreferrer" className="glass flex items-center gap-1.5 rounded-2xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#FF0000]">
                        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">play_circle</span>
                        YouTube
                      </a>
                    )}
                  </div>
                </section>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => toggleSaved(selectedPlace)} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-[11px] font-black uppercase tracking-widest text-background-dark">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{savedPlaceIds.includes(selectedPlace.id) ? 'favorite' : 'favorite_border'}</span>
                  {savedPlaceIds.includes(selectedPlace.id) ? 'Saved' : 'Save'}
                </button>
                <button type="button" onClick={() => setShowTripPicker(prev => !prev)} className="glass flex h-12 items-center justify-center gap-2 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-950 dark:text-white">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">playlist_add</span>
                  Add to Trip
                </button>
              </div>

              {showTripPicker && (
                <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-white/10 dark:bg-slate-950">
                  <div className="max-h-36 overflow-y-auto">
                    {tripLists.map(list => (
                      <button key={list.listName} type="button" onClick={() => addPlaceToList(list.listName, selectedPlace.id)} className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-xs font-black text-slate-800 hover:bg-slate-950/5 dark:text-white dark:hover:bg-white/5">
                        {list.listName}
                        <span className="text-slate-400">{list.placeIds.length}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input value={newListName} onChange={event => setNewListName(event.target.value)} placeholder="New list" className="h-10 min-w-0 flex-1 rounded-2xl border border-slate-950/10 bg-transparent px-3 text-xs font-bold text-slate-950 outline-none focus:border-primary dark:border-white/10 dark:text-white" />
                    <button type="button" onClick={() => addPlaceToList(newListName, selectedPlace.id)} className="rounded-2xl bg-primary px-3 text-[10px] font-black uppercase text-background-dark">Add</button>
                  </div>
                </div>
              )}

              <div className="mt-5 border-t border-slate-100 pt-4 dark:border-white/10">
                <PlaceReviews
                  placeId={selectedPlace.id}
                  user={user}
                  onGuestRestricted={onGuestRestricted}
                  onStatsChange={setSelectedReviewStats}
                />
              </div>

              {selectedRelatedPlaces.length > 0 && (
                <section className="mt-5 border-t border-slate-100 pt-4 dark:border-white/10">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Nearby Places</p>
                  <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar">
                    {selectedRelatedPlaces.map(place => (
                      <button
                        key={place.id}
                        type="button"
                        onClick={() => {
                          setSelectedPlace(place);
                          setShowTripPicker(false);
                        }}
                        className="flex min-w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-left text-[11px] font-black text-slate-800 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                      >
                        <span className="flex size-6 items-center justify-center rounded-full text-[#07120a]" style={{ background: travelCategoryMeta[place.category].color }}>
                          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">{travelCategoryMeta[place.category].icon}</span>
                        </span>
                        {place.name}
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </article>
        </div>
      ), document.body)}
    </div>
  );
};

export default MapsModule;
