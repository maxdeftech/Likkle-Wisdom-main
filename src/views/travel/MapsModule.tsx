import React, { useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { User } from '../../types';
import { generateTravelText } from '../../services/geminiService';
import { TravelCategory, TravelPlace, travelCategoryMeta, travelPlaces } from '../../data/travelPlaces';

type FilterId = TravelCategory | 'prices' | 'all';
type TripList = { listName: string; placeIds: string[] };

const JAMAICA_CENTER: [number, number] = [18.1096, -77.2975];
const SAVED_KEY = 'lkkle_travel_saved_places';
const LISTS_KEY = 'lkkle_travel_trip_lists';

const filterOrder: FilterId[] = ['hotels', 'villas', 'airbnb', 'nature', 'culture', 'adventure', 'prices', 'all'];

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
  const [legendOpen, setLegendOpen] = useState(false);
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>(() => readJson<string[]>(SAVED_KEY, []));
  const [tripLists, setTripLists] = useState<TripList[]>(() => readJson<TripList[]>(LISTS_KEY, []));
  const [newListName, setNewListName] = useState('');
  const [showTripPicker, setShowTripPicker] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guidePrompt, setGuidePrompt] = useState('');
  const [guideResponse, setGuideResponse] = useState('');
  const [isGuideLoading, setIsGuideLoading] = useState(false);

  const visiblePlaces = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const categoryFilters = [...activeFilters].filter((filter): filter is TravelCategory => !['all', 'prices'].includes(filter));
    return travelPlaces.filter(place => {
      const matchesQuery = !normalizedQuery ||
        place.name.toLowerCase().includes(normalizedQuery) ||
        place.description.toLowerCase().includes(normalizedQuery) ||
        travelCategoryMeta[place.category].label.toLowerCase().includes(normalizedQuery);
      const matchesCategory = activeFilters.has('all') || categoryFilters.length === 0 || categoryFilters.includes(place.category);
      const matchesPrice = !activeFilters.has('prices') || !!place.averageCost;
      return matchesQuery && matchesCategory && matchesPrice;
    });
  }, [activeFilters, query]);

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

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(position => {
      setMapCenter([position.coords.latitude, position.coords.longitude]);
      setMapZoom(13);
    });
  };

  const toggleSaved = (place: TravelPlace) => {
    if (user.isGuest) {
      onGuestRestricted();
      return;
    }
    setSavedPlaceIds(prev => {
      const next = prev.includes(place.id) ? prev.filter(id => id !== place.id) : [...prev, place.id];
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      return next;
    });
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
    const nearest = visiblePlaces.slice(0, 6).map(place => `${place.name} (${travelCategoryMeta[place.category].label})`).join(', ');
    const fallback = `Destination suggestion\n\nTry building the trip around ${visiblePlaces[0]?.name || 'Kingston and Ocho Rios'}. Keep transport flexible, reserve part of the budget for entry fees, and compare nearby places such as ${nearest || 'Dunns River Falls, Devon House, and Seven Mile Beach'}.`;
    const response = await generateTravelText(
      `Create a Jamaica travel destination guide for this request: "${prompt}". Include destination name, why it fits, estimated cost, and nearest places from this app data to highlight: ${nearest}.`,
      fallback
    );
    setGuideResponse(response);
    setIsGuideLoading(false);
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
          <button type="button" onClick={useMyLocation} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-[11px] font-black uppercase tracking-widest text-background-dark">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">my_location</span>
            Use My Location
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
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
        <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom className="h-[62vh] min-h-[460px] w-full">
          <MapRecenter center={mapCenter} zoom={mapZoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {visiblePlaces.map(place => (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={makePlaceIcon(place.category)}
              eventHandlers={{
                click: () => {
                  setSelectedPlace(place);
                  setMapCenter([place.lat, place.lng]);
                  setMapZoom(13);
                }
              }}
            />
          ))}
        </MapContainer>

        <div className="absolute bottom-4 right-4 z-[500]">
          <button type="button" onClick={() => setLegendOpen(prev => !prev)} className="glass flex items-center gap-2 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-950 shadow-2xl dark:text-white">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">legend_toggle</span>
            Legend
          </button>
          {legendOpen && (
            <div className="glass mt-2 w-64 rounded-2xl p-4 shadow-2xl">
              {(['hotels', 'villas', 'airbnb', 'nature', 'culture', 'adventure'] as TravelCategory[]).map(category => (
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
              <input
                value={guidePrompt}
                onChange={event => setGuidePrompt(event.target.value)}
                placeholder="Where do you want to go? What's your budget?"
                className="h-12 flex-1 rounded-2xl border border-slate-950/10 bg-white/70 px-4 text-sm font-bold text-slate-950 outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
              <div className="flex gap-2">
                <button type="button" onClick={startVoiceInput} className="glass flex size-12 items-center justify-center rounded-2xl text-slate-950 dark:text-white" aria-label="Use voice input">
                  <span className="material-symbols-outlined" aria-hidden="true">mic</span>
                </button>
                <button type="submit" disabled={isGuideLoading} className="rounded-2xl bg-primary px-5 text-[11px] font-black uppercase tracking-widest text-background-dark disabled:opacity-60">
                  {isGuideLoading ? 'Thinking' : 'Guide Me'}
                </button>
              </div>
            </div>
            {guideResponse && (
              <div className="rounded-2xl bg-slate-950/5 p-4 text-sm font-semibold leading-relaxed text-slate-700 dark:bg-white/5 dark:text-white/70 whitespace-pre-wrap">
                {guideResponse}
              </div>
            )}
          </form>
        )}
      </div>

      {selectedPlace && (
        <div className="fixed inset-0 z-overlay flex items-end bg-black/50 p-0 backdrop-blur-sm lg:items-center lg:justify-center lg:p-6" onClick={() => setSelectedPlace(null)}>
          <article className="max-h-[88vh] w-full overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl dark:bg-background-dark lg:max-w-2xl lg:rounded-[2rem]" onClick={event => event.stopPropagation()}>
            <div className="relative h-56 overflow-hidden rounded-t-[2rem]">
              <img src={selectedPlace.imageUrl} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <button type="button" onClick={() => setSelectedPlace(null)} className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur" aria-label="Close place details">
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
              <div className="absolute bottom-4 left-5 right-5">
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest text-background-dark" style={{ background: travelCategoryMeta[selectedPlace.category].color }}>
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">{travelCategoryMeta[selectedPlace.category].icon}</span>
                  {travelCategoryMeta[selectedPlace.category].label}
                </span>
                <h2 className="mt-3 text-3xl font-black text-white">{selectedPlace.name}</h2>
              </div>
            </div>
            <div className="space-y-5 p-5 pb-safe">
              <div className="flex items-start gap-2 text-sm font-bold text-slate-600 dark:text-white/60">
                <span className="material-symbols-outlined text-primary" aria-hidden="true">location_on</span>
                <span>{selectedPlace.lat.toFixed(4)}, {selectedPlace.lng.toFixed(4)}</span>
              </div>
              {selectedPlace.averageCost && (
                <div className="inline-flex items-center gap-2 rounded-2xl bg-primary/10 px-4 py-2 text-sm font-black text-primary">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">payments</span>
                  {selectedPlace.averageCost}
                </div>
              )}
              <p className="text-sm font-semibold leading-relaxed text-slate-700 dark:text-white/70">{selectedPlace.description}</p>
              <div className="flex flex-wrap gap-2">
                {selectedPlace.website && (
                  <a href={selectedPlace.website} target="_blank" rel="noreferrer" className="glass flex size-11 items-center justify-center rounded-2xl text-slate-950 dark:text-white" aria-label="Official website">
                    <span className="material-symbols-outlined" aria-hidden="true">language</span>
                  </a>
                )}
                {Object.entries(selectedPlace.social || {}).map(([network, href]) => href ? (
                  <a key={network} href={href} target="_blank" rel="noreferrer" className="glass flex size-11 items-center justify-center rounded-2xl text-slate-950 dark:text-white" aria-label={network}>
                    <span className="text-[10px] font-black uppercase">{network.slice(0, 2)}</span>
                  </a>
                ) : null)}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => toggleSaved(selectedPlace)} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-[11px] font-black uppercase tracking-widest text-background-dark">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{savedPlaceIds.includes(selectedPlace.id) ? 'favorite' : 'favorite_border'}</span>
                  {savedPlaceIds.includes(selectedPlace.id) ? 'Saved' : 'Like / Save'}
                </button>
                <div className="relative">
                  <button type="button" onClick={() => setShowTripPicker(prev => !prev)} className="glass flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-950 dark:text-white">
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">playlist_add</span>
                    Add to Trip List
                  </button>
                  {showTripPicker && (
                    <div className="absolute bottom-14 left-0 right-0 z-tooltip rounded-2xl border border-white/10 bg-white p-3 shadow-2xl dark:bg-slate-950">
                      <div className="max-h-36 overflow-y-auto">
                        {tripLists.map(list => (
                          <button key={list.listName} type="button" onClick={() => addPlaceToList(list.listName, selectedPlace.id)} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-black text-slate-800 hover:bg-slate-950/5 dark:text-white dark:hover:bg-white/5">
                            {list.listName}
                            <span className="text-slate-400">{list.placeIds.length}</span>
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <input value={newListName} onChange={event => setNewListName(event.target.value)} placeholder="New list" className="h-10 min-w-0 flex-1 rounded-xl border border-slate-950/10 bg-transparent px-3 text-xs font-bold outline-none focus:border-primary dark:border-white/10 dark:text-white" />
                        <button type="button" onClick={() => addPlaceToList(newListName, selectedPlace.id)} className="rounded-xl bg-primary px-3 text-[10px] font-black uppercase text-background-dark">Add</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </article>
        </div>
      )}
    </div>
  );
};

export default MapsModule;
