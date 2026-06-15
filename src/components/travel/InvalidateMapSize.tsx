import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/**
 * Drop this inside a <MapContainer> to fix the grey-tiles issue
 * that occurs when the map mounts inside a display:none container.
 *
 * It uses a ResizeObserver on the map's own container element.
 * When the container gains a non-zero size (i.e. the parent becomes
 * visible), it calls invalidateSize() so Leaflet re-lays-out tiles.
 */
const InvalidateMapSize: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    // Immediate check in case we're already visible
    requestAnimationFrame(() => map.invalidateSize());

    const container = map.getContainer();
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      // Only fire when the container actually has dimensions
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        map.invalidateSize();
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
};

export default InvalidateMapSize;
