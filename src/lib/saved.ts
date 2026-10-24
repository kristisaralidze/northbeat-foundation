import { useEffect, useState } from 'react';

const KEY = 'northbeat:saved';
export type SavedItem = { kind: 'organisation' | 'event'; slug: string; title: string; savedAt: string };

function read(): SavedItem[] {
  try { const value = JSON.parse(window.localStorage.getItem(KEY) ?? '[]'); return Array.isArray(value) ? value : []; } catch { return []; }
}
function write(items: SavedItem[]) {
  try { window.localStorage.setItem(KEY, JSON.stringify(items)); return true; } catch { return false; }
}

/** Save toggle stored in this browser only. Reads after mount to avoid hydration mismatch. */
export function useSaved(kind: SavedItem['kind'], slug: string, title: string) {
  const [saved, setSaved] = useState(false);
  useEffect(() => { setSaved(read().some(item => item.kind === kind && item.slug === slug)); }, [kind, slug]);
  function toggle() {
    const items = read().filter(item => !(item.kind === kind && item.slug === slug));
    const next = !saved;
    if (write(next ? [...items, { kind, slug, title, savedAt: new Date().toISOString() }] : items)) setSaved(next);
  }
  return { saved, toggle };
}
