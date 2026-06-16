import React, { useMemo, useState } from 'react';
import TravelMarkdown from '../../components/travel/TravelMarkdown';
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import InvalidateMapSize from '../../components/travel/InvalidateMapSize';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { User } from '../../types';
import { TravelCategory, travelCategoryMeta, travelPlaces } from '../../data/travelPlaces';
import { streamTravelText, MANDATORY_SECURITY_SUFFIX } from '../../services/geminiService';
import { MAP_TILES } from '../../constants/mapTiles';
import { notifyAIComplete } from '../../services/localNotificationsService';
import { generateGuidePDF } from '../../utils/travel/generateGuidePDF';
import { addStopToPlan, fetchOrCreateActivePlan, fetchStopsForPlan, removeStopFromPlan, TripPlan, TripStop, updatePlanName } from '../../services/tripPlannerService';
import AILoadingSkeleton from '../../components/travel/AILoadingSkeleton';
import { useAIProgress } from '../../hooks/useAIProgress';
import { useIsDesktop } from '../../hooks/useIsDesktop';

type FilterId = TravelCategory | 'all';

const JAMAICA_CENTER: [number, number] = [18.1096, -77.2975];
const LOCATION_PREF_KEY = 'likkle_location_enabled';
const DAY_COLORS = ['#13ec5b', '#38bdf8', '#a78bfa', '#fb7185', '#f59e0b', '#14b8a6', '#f4d125'];
const dayOptions = Array.from({ length: 30 }, (_, index) => index + 1);
const filterOrder: FilterId[] = ['all', 'hotels', 'villas', 'airbnb', 'nature', 'culture', 'adventure', 'airports'];

const makeDayMarker = (dayNumber: number) => L.divIcon({
  className: 'travel-day-marker',
  html: `<span class="travel-day-badge" style="background:${DAY_COLORS[dayNumber % DAY_COLORS.length]}">${dayNumber}</span>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const userLocationIcon = L.divIcon({
  className: 'travel-user-location-marker',
  html: '<span class="travel-user-location-dot"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const MapRecenter: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, map, zoom]);
  return null;
};

interface TripPlannerModuleProps {
  user: User;
  onGuestRestricted: () => void;
}

const TripPlannerModule: React.FC<TripPlannerModuleProps> = ({ user, onGuestRestricted }) => {
  const isDesktop = useIsDesktop();
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [stops, setStops] = useState<TripStop[]>([]);
  const [dayByPlace, setDayByPlace] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planNameDraft, setPlanNameDraft] = useState('My Jamaica Trip');
  const [aiResponse, setAiResponse] = useState(() => sessionStorage.getItem('lw_trip_aiResponse') || '');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [placesExpanded, setPlacesExpanded] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(JAMAICA_CENTER);
  const [mapZoom, setMapZoom] = useState(8);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const locationWatchId = React.useRef<number | null>(null);
  const aiProgress = useAIProgress(isAiLoading, !!aiResponse && !isAiLoading);

  const placeById = useMemo(() => new Map(travelPlaces.map(place => [place.id, place])), []);

  const pickerPlaces = useMemo(
    () => activeFilter === 'all' ? travelPlaces : travelPlaces.filter(place => place.category === activeFilter),
    [activeFilter]
  );

  const stopsWithPlaces = useMemo(
    () => stops
      .map(stop => ({ stop, place: placeById.get(stop.place_id) }))
      .filter((item): item is { stop: TripStop; place: NonNullable<typeof item.place> } => !!item.place),
    [placeById, stops]
  );

  const stopsByDay = useMemo(() => {
    const grouped = new Map<number, { stop: TripStop; place: NonNullable<ReturnType<typeof placeById.get>> }[]>();
    stopsWithPlaces.forEach(item => {
      const existing = grouped.get(item.stop.day_number) ?? [];
      existing.push(item);
      grouped.set(item.stop.day_number, existing);
    });
    return [...grouped.entries()]
      .sort(([a], [b]) => a - b)
      .map(([day, items]) => ({
        day,
        items: items.sort((a, b) => a.stop.stop_order - b.stop.stop_order),
      }));
  }, [stopsWithPlaces]);

  const loadPlan = React.useCallback(async () => {
    if (user.isGuest) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const activePlan = await fetchOrCreateActivePlan(user.id);
      const planStops = await fetchStopsForPlan(activePlan.id);
      setPlan(activePlan);
      setPlanNameDraft(activePlan.name);
      setStops(planStops);
    } catch {
      setError('Could not load trip planner. Check Supabase migrations and environment settings.');
    } finally {
      setLoading(false);
    }
  }, [user.id, user.isGuest]);

  React.useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  React.useEffect(() => {
    return () => {
      if (locationWatchId.current !== null) {
        navigator.geolocation.clearWatch(locationWatchId.current);
      }
    };
  }, []);

  const addPlace = async (placeId: string) => {
    if (user.isGuest) {
      onGuestRestricted();
      return;
    }
    if (!plan) return;
    const dayNumber = dayByPlace[placeId] ?? 1;
    const stopOrder = stops.filter(stop => stop.day_number === dayNumber).length;
    setError(null);
    try {
      await addStopToPlan(plan.id, placeId, dayNumber, stopOrder);
      setStops(await fetchStopsForPlan(plan.id));
    } catch {
      setError('Could not add this stop to your trip.');
    }
  };

  const removeStop = async (stopId: string) => {
    if (!plan) return;
    setError(null);
    try {
      await removeStopFromPlan(stopId);
      setStops(await fetchStopsForPlan(plan.id));
    } catch {
      setError('Could not remove this stop.');
    }
  };

  const savePlanName = async () => {
    if (!plan) return;
    const name = planNameDraft.trim() || 'My Jamaica Trip';
    try {
      await updatePlanName(plan.id, name);
      setPlan({ ...plan, name });
    } catch {
      setError('Could not rename this trip.');
    }
  };

  const improveTrip = async () => {
    if (stopsWithPlaces.length === 0) {
      setError('Add at least one stop before asking AI.');
      return;
    }
    setIsAiLoading(true);
    setAiResponse('');
    setError(null);
    const prompt = `I am planning a trip to Jamaica with the following stops:\n${
      stopsWithPlaces
        .sort((a, b) => a.stop.day_number - b.stop.day_number || a.stop.stop_order - b.stop.stop_order)
        .map(({ stop, place }) => `Day ${stop.day_number}: ${place.name}`)
        .join('\n')
    }\n\nPlease give me: 1) Tips for sequencing these stops efficiently. 2) Estimated transport time between stops. 3) Any must-do activities at each location. 4) Suggestions for what to add or remove. Format with markdown headings.

For each area/parish in the itinerary, include:
- Safety assessment for that specific area
- Best times to visit each location safely
- Areas to avoid near the planned stops
- Safe transportation between stops
- Emergency contacts near the itinerary locations
${MANDATORY_SECURITY_SUFFIX}`;
    const response = await streamTravelText(prompt, 'Add more stops to build a stronger Jamaica itinerary.', (partial) => setAiResponse(partial));
    setAiResponse(response);
    sessionStorage.setItem('lw_trip_aiResponse', response);
    setIsAiLoading(false);
    notifyAIComplete('trip');
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
      setLocationEnabled(true);
      setLocationError(null);
    };
    const handleLocationError = () => {
      setLocationError('Enable location in your device settings to see your position on the map.');
      setLocationEnabled(false);
    };

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

  const placesVisible = isDesktop || placesExpanded;
  const previewPlaces = pickerPlaces.slice(0, 3);

  if (user.isGuest) {
    return (
      <div className="glass rounded-2xl p-6 text-center shadow-2xl">
        <span className="material-symbols-outlined text-5xl text-primary" aria-hidden="true">route</span>
        <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">My Trip</h2>
        <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-white/50">Sign in to save trip plans across devices.</p>
        <button type="button" onClick={onGuestRestricted} className="mt-5 rounded-2xl bg-primary px-6 py-3 text-[11px] font-black uppercase tracking-widest text-background-dark">
          Sign in to plan
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-full space-y-4 overflow-hidden animate-fade-in sm:space-y-5">
      <div className="glass rounded-2xl p-3 shadow-2xl sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="flex-1">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-primary">Trip name</span>
            <input
              value={planNameDraft}
              onChange={event => setPlanNameDraft(event.target.value)}
              onBlur={savePlanName}
              className="h-12 w-full rounded-2xl border border-slate-950/10 bg-white/70 px-4 text-sm font-black text-slate-950 outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </label>
          <button type="button" onClick={improveTrip} disabled={isAiLoading} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-[11px] font-black uppercase tracking-widest text-background-dark disabled:opacity-60 sm:w-auto">
            <span className={`material-symbols-outlined text-[18px] ${isAiLoading ? 'animate-spin' : ''}`} aria-hidden="true">{isAiLoading ? 'progress_activity' : 'auto_awesome'}</span>
            Improve Trip
          </button>
        </div>
        {error && <p className="mt-3 rounded-2xl bg-red-500/10 px-4 py-3 text-xs font-bold text-red-500">{error}</p>}
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-5">
        <section className="glass min-w-0 rounded-2xl p-3 shadow-2xl sm:p-4">
          <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar">
            {filterOrder.map(filter => {
              const meta = travelCategoryMeta[filter];
              const active = activeFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
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

          {!isDesktop && (
            <div className="mb-4 space-y-3">
              <button onClick={() => setPlacesExpanded(prev => !prev)} className="glass flex w-full items-center justify-between rounded-2xl p-4 text-left">
                <span>
                  <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-primary">Places</span>
                  <span className="font-bold text-slate-900 dark:text-white">Places ({pickerPlaces.length})</span>
                </span>
                <span className="material-symbols-outlined text-primary transition-transform" style={{ transform: placesExpanded ? 'rotate(180deg)' : 'rotate(0)' }} aria-hidden="true">
                  expand_more
                </span>
              </button>
              {!placesExpanded && (
                <div className="grid gap-2">
                  {previewPlaces.map(place => (
                    <div key={place.id} className="flex items-center gap-3 rounded-2xl bg-white/70 p-2 text-sm font-black text-slate-950 dark:bg-white/5 dark:text-white">
                      <img src={place.imageUrl} alt="" className="size-12 rounded-xl object-cover" />
                      <span className="min-w-0 flex-1 truncate">{place.name}</span>
                    </div>
                  ))}
                  {pickerPlaces.length > previewPlaces.length && (
                    <button type="button" onClick={() => setPlacesExpanded(true)} className="rounded-2xl border border-primary/30 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-primary">
                      Show all {pickerPlaces.length} places
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {loading ? (
            <p className="py-10 text-center text-sm font-bold text-slate-400">Loading trip planner...</p>
          ) : placesVisible ? (
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {pickerPlaces.map(place => {
                const existing = stops.find(stop => stop.place_id === place.id);
                return (
                  <article key={place.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-950/5 dark:bg-slate-950/40 dark:ring-white/10">
                    <img src={place.imageUrl} alt="" className="h-28 w-full object-cover sm:h-32" />
                    <div className="space-y-3 p-3">
                      <div>
                        <h3 className="truncate text-sm font-black text-slate-950 dark:text-white">{place.name}</h3>
                        <p className="mt-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/45">
                          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">{travelCategoryMeta[place.category].icon}</span>
                          {travelCategoryMeta[place.category].label}
                        </p>
                      </div>
                      <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-2">
                        <select
                          value={dayByPlace[place.id] ?? existing?.day_number ?? 1}
                          onChange={event => setDayByPlace(prev => ({ ...prev, [place.id]: Number(event.target.value) }))}
                          className="h-10 min-w-0 rounded-xl border border-slate-950/10 bg-white px-2 text-xs font-black text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                        >
                          {dayOptions.map(day => <option key={day} value={day}>Day {day}</option>)}
                        </select>
                        {existing ? (
                          <button type="button" onClick={() => removeStop(existing.id)} className="flex h-10 min-w-0 items-center justify-center gap-1 rounded-xl border border-red-500/30 px-2 text-[10px] font-black uppercase tracking-widest text-red-500">
                            <span className="truncate">✓ Day {existing.day_number}</span>
                          </button>
                        ) : (
                          <button type="button" onClick={() => addPlace(place.id)} className="flex h-10 min-w-0 items-center justify-center gap-1 rounded-xl bg-primary px-2 text-[10px] font-black uppercase tracking-widest text-background-dark">
                            + Add
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>

        <aside className="min-w-0 space-y-4 lg:space-y-5">
          <section className="glass overflow-hidden rounded-2xl shadow-2xl">
            <div className="border-b border-white/10 p-3 sm:p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Visual Itinerary</p>
              <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">{stops.length} stops planned</h2>
            </div>
            <div className="border-t border-white/10 p-3">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={toggleLocation} className={`flex h-10 items-center gap-2 rounded-2xl px-4 text-[10px] font-black uppercase tracking-widest ${locationEnabled ? 'bg-blue-600 text-white' : 'bg-primary text-background-dark'}`} aria-pressed={locationEnabled}>
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">{locationEnabled ? 'my_location' : 'location_disabled'}</span>
                  My Location
                </button>
                {userLocation && (
                  <button type="button" onClick={centerOnMe} className="flex h-10 items-center gap-2 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-300">
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">center_focus_strong</span>
                    Center
                  </button>
                )}
              </div>
              {locationError && <p className="mt-2 text-xs font-bold text-blue-700 dark:text-blue-200">{locationError}</p>}
            </div>
            <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom className="h-[300px] w-full sm:h-[360px] lg:h-[420px]">
              <InvalidateMapSize />
              <MapRecenter center={mapCenter} zoom={mapZoom} />
              <TileLayer attribution={MAP_TILES.street.attribution} url={MAP_TILES.street.url} />
              {/* Full route line connecting all stops across all days */}
              {stopsWithPlaces.length > 1 && (
                <Polyline
                  positions={[...stopsWithPlaces]
                    .sort((a, b) => a.stop.day_number - b.stop.day_number || a.stop.stop_order - b.stop.stop_order)
                    .map(({ place }) => [place.lat, place.lng] as [number, number])}
                  pathOptions={{ color: '#13ec5b', weight: 2, dashArray: '6 8', opacity: 0.4 }}
                />
              )}
              {/* Per-day coloured lines */}
              {stopsByDay.map(({ day, items }, index) => {
                const positions = items.map(({ place }) => [place.lat, place.lng] as [number, number]);
                return positions.length > 1 ? (
                  <Polyline
                    key={`line-${day}`}
                    positions={positions}
                    pathOptions={{ color: DAY_COLORS[index % DAY_COLORS.length], weight: 3.5, dashArray: '8 6', opacity: 0.9 }}
                  />
                ) : null;
              })}
              {stopsWithPlaces.map(({ stop, place }) => (
                <Marker key={stop.id} position={[place.lat, place.lng]} icon={makeDayMarker(stop.day_number)}>
                  <Tooltip direction="top" offset={[0, -22]} className="travel-day-label-tooltip">
                    Day {stop.day_number}: {place.name}
                  </Tooltip>
                </Marker>
              ))}
              {userLocation && <Marker position={userLocation} icon={userLocationIcon} zIndexOffset={1000} />}
            </MapContainer>
          </section>

          <section className="glass rounded-2xl p-3 shadow-2xl sm:p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Itinerary</p>
            {stopsByDay.length === 0 ? (
              <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-white/50">Add places to see your day-by-day plan.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {stopsByDay.map(({ day, items }) => (
                  <div key={day} className="rounded-2xl bg-white/70 p-3 dark:bg-white/5">
                    <p className="text-xs font-black text-primary">Day {day}</p>
                    <div className="mt-2 space-y-2">
                      {items.map(({ stop, place }) => (
                        <div key={stop.id} className="flex items-center justify-between gap-2 text-sm font-bold text-slate-800 dark:text-white/70">
                          <span className="truncate">{place.name}</span>
                          <button type="button" onClick={() => removeStop(stop.id)} className="text-red-500" aria-label={`Remove ${place.name}`}>
                            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>

      {(isAiLoading || aiResponse) && (
        <section className="glass rounded-2xl p-3 shadow-2xl sm:p-4">
          {isAiLoading && !aiResponse ? (
            <AILoadingSkeleton progress={aiProgress} />
          ) : (
            <>
              <div className="travel-md rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-transparent p-5 shadow-inner dark:from-primary/8">
                <TravelMarkdown>{aiResponse}</TravelMarkdown>
                {isAiLoading && <span className="inline-block size-2 bg-primary rounded-full animate-pulse ml-1 align-middle" />}
              </div>
              {!isAiLoading && (
                <div className="mt-4 flex justify-end">
                  <button type="button" onClick={() => generateGuidePDF(plan?.name ?? 'My Jamaica Trip', aiResponse)} className="flex items-center gap-2 rounded-2xl border border-primary px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-primary transition-colors hover:bg-primary/10">
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">download</span>
                    Download PDF
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
};

export default TripPlannerModule;
