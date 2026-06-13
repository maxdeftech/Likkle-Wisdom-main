import React, { useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AviationRoute, aviationRoutes } from '../../data/aviationRoutes';

type OriginCode = 'KIN' | 'MBJ';

const airportIcon = L.divIcon({
  className: 'travel-airport-marker',
  html: '<span class="material-symbols-outlined">flight_takeoff</span>',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const planeIcon = L.divIcon({
  className: 'travel-plane-marker',
  html: '<span class="material-symbols-outlined">flight</span>',
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

const getArcPoints = (route: AviationRoute): [number, number][] => {
  const start: [number, number] = [route.origin.lat, route.origin.lng];
  const end: [number, number] = [route.destination.lat, route.destination.lng];
  const midLat = (start[0] + end[0]) / 2 + Math.min(18, Math.abs(end[1] - start[1]) * 0.1);
  const midLng = (start[1] + end[1]) / 2;
  return [start, [midLat, midLng], end];
};

const routeSearchText = (route: AviationRoute) => [
  route.destination.city,
  route.destination.country,
  route.destination.code,
  route.airlines.join(' ')
].join(' ').toLowerCase();

const AviationModule: React.FC = () => {
  const [origin, setOrigin] = useState<OriginCode>('KIN');
  const [query, setQuery] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('kin-mia');

  const filteredRoutes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return aviationRoutes.filter(route => (
      route.origin.code === origin &&
      (!normalized || routeSearchText(route).includes(normalized))
    ));
  }, [origin, query]);

  const selectedRoute = aviationRoutes.find(route => route.id === selectedRouteId) || filteredRoutes[0] || aviationRoutes[0];
  const visibleRoutes = filteredRoutes.length ? filteredRoutes : aviationRoutes.filter(route => route.origin.code === origin);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="glass rounded-2xl p-4 shadow-2xl">
        <div className="grid gap-3 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="flex rounded-2xl bg-slate-950/5 p-1 dark:bg-white/5">
            {(['KIN', 'MBJ'] as OriginCode[]).map(code => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setOrigin(code);
                  const firstRoute = aviationRoutes.find(route => route.origin.code === code);
                  if (firstRoute) setSelectedRouteId(firstRoute.id);
                }}
                className={`flex-1 rounded-xl px-5 py-3 text-[11px] font-black uppercase tracking-widest transition-all ${
                  origin === code ? 'bg-primary text-background-dark' : 'text-slate-600 dark:text-white/50'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
          <label className="relative">
            <span className="sr-only">Search destinations</span>
            <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white/40" aria-hidden="true">search</span>
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search route, airport, country, or airline"
              className="h-12 w-full rounded-2xl border border-slate-950/10 bg-white/70 pl-12 pr-4 text-sm font-bold text-slate-950 outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
        <MapContainer center={[27, -55]} zoom={3} minZoom={2} scrollWheelZoom className="h-[56vh] min-h-[420px] w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {visibleRoutes.map(route => {
            const selected = selectedRoute.id === route.id;
            const arc = getArcPoints(route);
            return (
              <React.Fragment key={route.id}>
                <Polyline
                  positions={arc}
                  pathOptions={{
                    color: selected ? '#13ec5b' : '#f4d125',
                    weight: selected ? 4 : 2,
                    opacity: selected ? 0.95 : 0.45,
                    dashArray: '6 10'
                  }}
                  eventHandlers={{ click: () => setSelectedRouteId(route.id) }}
                />
                <Marker position={[route.origin.lat, route.origin.lng]} icon={airportIcon} />
                <Marker position={[route.destination.lat, route.destination.lng]} icon={airportIcon} eventHandlers={{ click: () => setSelectedRouteId(route.id) }} />
                {selected && <Marker position={arc[1]} icon={planeIcon} />}
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>

      <div className="glass rounded-2xl p-4 shadow-2xl">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Route List</p>
            <h2 className="text-xl font-black text-slate-950 dark:text-white">{origin} departures</h2>
          </div>
          <p className="max-w-xl text-xs font-bold leading-relaxed text-slate-500 dark:text-white/40">Estimated costs are approximate and may vary. Check airline websites for live pricing.</p>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {visibleRoutes.map(route => {
            const selected = selectedRoute.id === route.id;
            return (
              <button
                key={route.id}
                type="button"
                onClick={() => setSelectedRouteId(route.id)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  selected
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                    : 'border-slate-950/10 bg-white/50 hover:border-primary/60 dark:border-white/10 dark:bg-white/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">{route.origin.code} to {route.destination.code}</p>
                    <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">
                      {route.destination.city}, {route.destination.country}
                    </h3>
                  </div>
                  <span className="rounded-full bg-slate-950/5 px-3 py-1 text-[10px] font-black text-slate-700 dark:bg-white/10 dark:text-white">{route.destination.flag}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {route.airlines.map(airline => (
                    <span key={airline} className="rounded-full bg-slate-950/5 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600 dark:bg-white/10 dark:text-white/60">{airline}</span>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-slate-950/5 p-2 dark:bg-white/5">
                    <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">payments</span>
                    <p className="mt-1 text-[10px] font-black text-slate-700 dark:text-white">{route.estimatedCost}</p>
                  </div>
                  <div className="rounded-xl bg-slate-950/5 p-2 dark:bg-white/5">
                    <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">schedule</span>
                    <p className="mt-1 text-[10px] font-black text-slate-700 dark:text-white">{route.durationHours} hrs</p>
                  </div>
                  <div className="rounded-xl bg-slate-950/5 p-2 dark:bg-white/5">
                    <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">event_repeat</span>
                    <p className="mt-1 text-[10px] font-black text-slate-700 dark:text-white">{route.frequency}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AviationModule;
