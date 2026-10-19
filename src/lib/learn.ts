import { safeWebUrl } from './profiles';

export type LearnTerm = { id: string; name: string; slug: string; sort_order: number };
export type GuideCard = { id: string; slug: string; title: string; one_sentence: string | null; level: string; reading_minutes: number | null; area_id: string | null; journey_step_id: string | null };
export type HubItem = { slug: string; title: string; summary: string | null };
export type JourneyStep = LearnTerm & { guides: GuideCard[]; organisations: HubItem[]; opportunities: HubItem[]; events: HubItem[] };
export type LearnHub = { steps: JourneyStep[]; areas: (LearnTerm & { guides: GuideCard[] })[]; glossaryCount: number };
export type GuideSource = { title: string; url: string };
export type GuideNeighbour = { slug: string; title: string } | null;
export type GuidePage = {
  guide: GuideCard & { summary: string | null; body: string | null; next_step: string | null; reviewed_by: string | null; last_checked: string | null };
  area: LearnTerm | null; step: LearnTerm | null; sources: GuideSource[];
  organisations: HubItem[]; opportunities: HubItem[]; events: HubItem[]; previous: GuideNeighbour; next: GuideNeighbour;
};
export type GlossaryEntry = { id: string; slug: string; term: string; short_definition: string; explanation: string | null; related: { slug: string; term: string }[]; guides: { slug: string; title: string }[] };

export const LEVEL_LABELS: Record<string, string> = { beginner: 'Beginner', intermediate: 'Intermediate' };
export const levelLabel = (level: string) => LEVEL_LABELS[level] ?? level;
export const readingLabel = (minutes: number | null) => (minutes && minutes > 0 ? `${minutes} min read` : null);

/** Guide recommendations match the journey step alone, regardless of field tags. */
export function sharesHub(itemTermIds: string[], stepId: string | null): boolean {
  return Boolean(stepId && itemTermIds.includes(stepId));
}
/** Keep one cross-type shortlist, prioritising the journey and then shared fields. */
export function rankHub<T extends { title: string; termIds: string[] }>(items: T[], stepId: string | null, fieldIds: string[]): T[] {
  const fieldMatch = (item: T) => fieldIds.some(id => item.termIds.includes(id));
  return items.filter(item => sharesHub(item.termIds, stepId) || fieldMatch(item))
    .sort((a, b) => Number(sharesHub(b.termIds, stepId)) - Number(sharesHub(a.termIds, stepId)) || Number(fieldMatch(b)) - Number(fieldMatch(a)) || a.title.localeCompare(b.title))
    .slice(0, 5);
}

/** Guides in one area, ordered along the journey, then by title. */
export function orderGuides<T extends GuideCard>(guides: T[], stepOrder: Map<string, number>): T[] {
  const rank = (g: GuideCard) => (g.journey_step_id ? stepOrder.get(g.journey_step_id) ?? 999 : 999);
  return [...guides].sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title));
}

export function areaNeighbours(guides: GuideCard[], currentId: string, stepOrder: Map<string, number>) {
  const current = guides.find((g) => g.id === currentId);
  if (!current?.area_id) return { previous: null, next: null };
  const list = orderGuides(guides.filter((g) => g.area_id === current.area_id), stepOrder);
  const i = list.findIndex((g) => g.id === currentId);
  const pick = (g?: GuideCard): GuideNeighbour => (g ? { slug: g.slug, title: g.title } : null);
  return { previous: pick(list[i - 1]), next: pick(list[i + 1]) };
}

export function parseSources(value: unknown): GuideSource[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((s) => {
    if (!s || typeof s !== 'object') return [];
    const { title, url } = s as Record<string, unknown>;
    const safe = typeof url === 'string' ? safeWebUrl(url) : null;
    return typeof title === 'string' && title.trim() && safe ? [{ title: title.trim(), url: safe }] : [];
  });
}

export const paragraphs = (body: string | null) => (body ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

export const glossaryLetter = (term: string) => {
  const letter = term.trim().charAt(0).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  return /^[A-Z]$/.test(letter) ? letter : '#';
};

export function groupGlossary<T extends { term: string; short_definition: string }>(terms: T[], query = '') {
  const q = query.trim().toLowerCase();
  const hits = terms.filter((t) => !q || t.term.toLowerCase().includes(q) || t.short_definition.toLowerCase().includes(q))
    .sort((a, b) => a.term.localeCompare(b.term));
  const groups: { letter: string; terms: T[] }[] = [];
  for (const t of hits) {
    const letter = glossaryLetter(t.term);
    const last = groups.at(-1);
    if (last?.letter === letter) last.terms.push(t); else groups.push({ letter, terms: [t] });
  }
  return groups;
}
