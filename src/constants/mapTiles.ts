/**
 * Shared map tile configuration for all Leaflet maps across the app.
 * Esri World Street Map and Esri World Imagery — free, no API key required.
 * Satellite attribution includes Esri, Maxar, and Earthstar Geographics.
 */

export const MAP_TILES = {
  /** Default street map — Esri World Street Map */
  street: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
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
