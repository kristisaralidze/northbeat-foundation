export type SearchKind = 'organisation' | 'event' | 'opportunity' | 'guide' | 'glossary';
export type SearchItem = { kind: SearchKind; slug: string; title: string; line: string | null; type: string | null; city: string | null; date: string | null; end: string | null; logo: string | null; website: string | null; logoChoice: string | null; amountMin: number | null; amountMax: number | null; online: boolean };
export const SEARCH_GROUPS: { kind: SearchKind; label: string }[] = [
  { kind: 'organisation', label: 'Organisations' }, { kind: 'event', label: 'Events' }, { kind: 'opportunity', label: 'Opportunities' }, { kind: 'guide', label: 'Learn guides' }, { kind: 'glossary', label: 'Glossary' },
];
const norm = (v: string) => v.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
/** Rank: title starts with query, a title word starts with it, title contains it, then the one line. */
export function scoreItem(item: SearchItem, query: string): number {
  const q = norm(query.trim()); if (!q) return 0;
  const title = norm(item.title);
  if (title.startsWith(q)) return 4;
  if (title.split(/[\s\-(]+/).some(w => w.startsWith(q))) return 3;
  if (title.includes(q)) return 2;
  if (norm(`${item.line ?? ''} ${item.city ?? ''}`).includes(q)) return 1;
  return 0;
}
export function searchAll(items: SearchItem[], query: string, perGroup = 5) {
  return SEARCH_GROUPS.map(group => ({ ...group, items: items.filter(i => i.kind === group.kind).map(i => ({ i, s: scoreItem(i, query) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s || a.i.title.localeCompare(b.i.title)).slice(0, perGroup).map(x => x.i) })).filter(g => g.items.length);
}
export function itemHref(item: Pick<SearchItem, 'kind' | 'slug'>) {
  const slug = encodeURIComponent(item.slug);
  return item.kind === 'organisation' ? `/org/${slug}` : item.kind === 'event' ? `/event/${slug}` : item.kind === 'opportunity' ? `/opportunity/${slug}` : item.kind === 'guide' ? `/learn/${slug}` : `/learn/glossary#${slug}`;
}
/** Most recent first, unique, at most 5. */
export function pushRecent(list: string[], query: string, limit = 5) {
  const q = query.trim(); if (!q) return list;
  return [q, ...list.filter(v => v.toLocaleLowerCase() !== q.toLocaleLowerCase())].slice(0, limit);
}
const RECENT = 'northbeat:recent-searches';
export function readRecent(): string[] { try { const v = JSON.parse(window.localStorage.getItem(RECENT) ?? '[]'); return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 5) : []; } catch { return []; } }
export function saveRecent(query: string) { try { const next = pushRecent(readRecent(), query); window.localStorage.setItem(RECENT, JSON.stringify(next)); return next; } catch { return []; } }
