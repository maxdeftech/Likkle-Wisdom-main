/**
 * Shared map tile configuration for all Leaflet maps across the app.
 * CartoDB Voyager — clean, detailed, modern look. Free, no API key required.
 * Satellite layer via Esri World Imagery — free, no API key required.
 */

export const MAP_TILES = {
  /** Default street map — CartoDB Voyager (clean, Google-Maps-like aesthetic) */
  street: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  /** Satellite imagery — Esri World Imagery */
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
  },
  /** Dark mode variant — CartoDB Dark Matter */
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
} as const;
