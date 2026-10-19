export const NORDIC_CODES = ['FIN', 'SWE', 'NOR', 'DNK', 'ISL'] as const;
export const GLOBE_VIEW = { lat: 60, lng: 14, altitude: 1.85 };
export const GLOBE_MIN_DISTANCE = 1.7;
export const GLOBE_MAX_DISTANCE = 4.2;
export const GLOBE_ROTATION_SPEED = .12;
export function isNordic(code: string) { return NORDIC_CODES.some(value => value === code); }
export function clampGlobeDistance(distance: number) { return Math.max(GLOBE_MIN_DISTANCE, Math.min(GLOBE_MAX_DISTANCE, distance)); }
export function globeScrollDistance(progress: number) { return 3.3 - Math.max(0, Math.min(1, progress)) * .95; }
export function recoverGlobeRotation(speed: number, seconds: number, dragging: boolean) {
  return dragging ? 0 : speed + (GLOBE_ROTATION_SPEED - speed) * (1 - Math.exp(-Math.max(0, seconds) * 1.5));
}
export const NORDIC_CITIES = [
  { name: 'Helsinki', lat: 60.1699, lng: 24.9384 },
  { name: 'Espoo', lat: 60.2055, lng: 24.6559 },
  { name: 'Turku', lat: 60.4518, lng: 22.2666 },
  { name: 'Tampere', lat: 61.4978, lng: 23.761 },
  { name: 'Oulu', lat: 65.0121, lng: 25.4651 },
  { name: 'Stockholm', lat: 59.3293, lng: 18.0686 },
  { name: 'Gothenburg', lat: 57.7089, lng: 11.9746 },
  { name: 'Copenhagen', lat: 55.6761, lng: 12.5683 },
  { name: 'Oslo', lat: 59.9139, lng: 10.7522 },
  { name: 'Reykjavik', lat: 64.1466, lng: -21.9426 },
];
export function globePosition(lat: number, lng: number, radius = 1): [number, number, number] {
  const a = lat * Math.PI / 180, b = lng * Math.PI / 180;
  return [radius * Math.cos(a) * Math.sin(b), radius * Math.sin(a), radius * Math.cos(a) * Math.cos(b)];
}