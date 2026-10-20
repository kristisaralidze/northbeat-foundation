export const FACETS = ["type", "field", "sub_area", "country", "stage"] as const;
export type Facet = (typeof FACETS)[number];
export type ExploreSearch = { q: string } & Record<Facet, string[]>;
export type DirectoryTerm = { id: string; kind: string; name: string; slug: string; parent_id: string | null; sort_order: number };
export type DirectoryOrganisation = {
  id: string; slug: string; name: string; type: string; short_description: string | null;
  logo_url: string | null; cover_image_url?: string | null; website: string | null; city: string | null; termIds: string[];
  logo_image_source?: string | null; logo_image_source_url?: string | null; image_source_url?: string | null;
};
export type DirectoryData = { organisations: DirectoryOrganisation[]; terms: DirectoryTerm[] };
export const EMPTY_SEARCH: ExploreSearch = { q: "", type: [], field: [], sub_area: [], country: [], stage: [] };

export function parseExploreSearch(raw: Record<string, unknown>): ExploreSearch {
  const result = { ...EMPTY_SEARCH, q: typeof raw["q"] === "string" ? raw["q"] : "" };
  for (const facet of FACETS) {
    const value = raw[facet];
    result[facet] = Array.isArray(value) ? [...new Set(value.filter((v): v is string => typeof v === "string"))] : typeof value === "string" ? [value] : [];
  }
  return result;
}

export function filterOrganisations(data: DirectoryData, search: ExploreSearch, omit?: Facet) {
  const q = search.q.trim().toLocaleLowerCase();
  const terms = new Map(data.terms.map((term) => [term.id, term]));
  return data.organisations.filter((org) => {
    const tags = org.termIds.flatMap((id) => { const term = terms.get(id); return term ? [term] : []; });
    const haystack = [org.name, org.short_description, org.city, ...tags.map((t) => t.name)].join(" ").toLocaleLowerCase();
    if (q && !haystack.includes(q)) return false;
    return FACETS.every((facet) => facet === omit || search[facet].length === 0 || (facet === "type"
      ? search.type.includes(org.type)
      : tags.some((tag) => tag.kind === facet && search[facet].includes(tag.slug))));
  });
}

// Counts honour the search and other facets, but not the current facet's selection.
export function facetCounts(data: DirectoryData, search: ExploreSearch, facet: Facet) {
  const counts: Record<string, number> = {};
  const terms = new Map(data.terms.filter((t) => t.kind === facet).map((t) => [t.id, t.slug]));
  for (const org of filterOrganisations(data, search, facet)) {
    const values = facet === "type" ? [org.type] : org.termIds.flatMap((id) => { const slug = terms.get(id); return slug ? [slug] : []; });
    for (const value of new Set(values)) counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}
const TAG_PRIORITY: Record<string, number> = { sub_area: 0, field: 1, stage: 2 };
/** One specific field/sub-area and one stage; other tags stay off cards. */
export function cardTags(org: DirectoryOrganisation, terms: DirectoryTerm[]) {
  const tags = terms.filter((t) => org.termIds.includes(t.id))
    .sort((a, b) => (TAG_PRIORITY[a.kind] ?? 3) - (TAG_PRIORITY[b.kind] ?? 3) || a.sort_order - b.sort_order);
  const field = tags.find(t => t.kind === 'sub_area' || t.kind === 'field');
  const stage = tags.find(t => t.kind === 'stage');
  return { shown: [field, stage].filter((t): t is DirectoryTerm => Boolean(t)), extra: 0 };
}

/** Drop empty params so shared URLs stay clean. */
export function cleanExploreSearch(search: ExploreSearch): Partial<ExploreSearch> {
  const out: Partial<ExploreSearch> = {};
  if (search.q) out.q = search.q;
  for (const facet of FACETS) if (search[facet]?.length) out[facet] = search[facet];
  return out;
}
