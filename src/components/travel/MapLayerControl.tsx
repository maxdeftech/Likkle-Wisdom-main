import React from 'react';

interface MapLayerControlProps {
  satelliteView: boolean;
  onToggle: () => void;
  className?: string;
}

const MapLayerControl: React.FC<MapLayerControlProps> = ({ satelliteView, onToggle, className = '' }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`glass flex items-center gap-2 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest shadow-2xl ${satelliteView ? 'bg-blue-600 text-white' : 'text-slate-950 dark:text-white'} ${className}`}
    aria-pressed={satelliteView}
    aria-label={satelliteView ? 'Switch to street map view' : 'Switch to satellite map view'}
  >
    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{satelliteView ? 'map' : 'satellite_alt'}</span>
    {satelliteView ? 'Street' : 'Satellite'}
  </button>
);

export default MapLayerControl;
