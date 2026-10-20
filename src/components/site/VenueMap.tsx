import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

export function VenueMap({ latitude, longitude, name }: { latitude: number; longitude: number; name: string }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false; let dispose: (() => void) | undefined;
    void import('leaflet').then(L => {
      if (cancelled || !host.current) return;
      const map = L.map(host.current, { scrollWheelZoom: false }).setView([latitude, longitude], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19 }).addTo(map);
      const marker = L.divIcon({ className: 'nb-venue-marker', html: '<span></span>', iconSize: [16, 16], iconAnchor: [8, 8] });
      L.marker([latitude, longitude], { icon: marker, title: name }).addTo(map).bindPopup(document.createTextNode(name));
      const resize = new ResizeObserver(() => map.invalidateSize()); resize.observe(host.current);
      dispose = () => { resize.disconnect(); map.remove(); };
    });
    return () => { cancelled = true; dispose?.(); };
  }, [latitude, longitude, name]);
  return <div ref={host} className="nb-venue-map" role="region" aria-label={`Map of ${name}`} />;
}