import { useSyncExternalStore } from 'react';

const KEY = 'northbeat:saved';
const EVENT = 'northbeat:saved-change';
export type SavedKind = 'organisation' | 'event' | 'opportunity';
export type SavedItem = { kind: SavedKind; slug: string; title: string; savedAt: string };
const EMPTY: SavedItem[] = [];
let cacheRaw: string | null = null; let cache: SavedItem[] = EMPTY;

export function readSaved(): SavedItem[] {
  try {
    const raw = window.localStorage.getItem(KEY) ?? '[]';
    if (raw === cacheRaw) return cache;
    const value = JSON.parse(raw); cacheRaw = raw; cache = Array.isArray(value) ? value.filter(v => v && typeof v.slug === 'string' && typeof v.kind === 'string') : EMPTY;
    return cache;
  } catch { return EMPTY; }
}
export function toggleSaved(kind: SavedKind, slug: string, title: string) {
  const items = readSaved(); const exists = items.some(i => i.kind === kind && i.slug === slug);
  const next = exists ? items.filter(i => !(i.kind === kind && i.slug === slug)) : [...items, { kind, slug, title, savedAt: new Date().toISOString() }];
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); window.dispatchEvent(new Event(EVENT)); } catch { /* storage unavailable */ }
}
function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback); window.addEventListener('storage', callback);
  return () => { window.removeEventListener(EVENT, callback); window.removeEventListener('storage', callback); };
}
/** Saved items in this browser. Empty during SSR and hydration. */
export function useSavedItems() { return useSyncExternalStore(subscribe, readSaved, () => EMPTY); }
export function useSaved(kind: SavedKind, slug: string, title: string) {
  const saved = useSavedItems().some(i => i.kind === kind && i.slug === slug);
  return { saved, toggle: () => toggleSaved(kind, slug, title) };
}
