import { describe, expect, it } from "vitest";
import { EMPTY_SEARCH, facetCounts, filterOrganisations, parseExploreSearch, type DirectoryData } from "./explore";

const data: DirectoryData = {
  terms: [
    { id: "medtech", kind: "field", slug: "medtech", name: "Medtech", parent_id: null, sort_order: 0 },
    { id: "finland", kind: "country", slug: "finland", name: "Finland", parent_id: null, sort_order: 0 },
    { id: "sweden", kind: "country", slug: "sweden", name: "Sweden", parent_id: null, sort_order: 1 },
    { id: "wearables", kind: "sub_area", slug: "wearables", name: "Wearables", parent_id: "medtech", sort_order: 0 },
    { id: "seed", kind: "stage", slug: "seed", name: "Seed", parent_id: null, sort_order: 0 },
  ],
  organisations: [
    { id: "1", slug: "alpha", name: "Alpha", type: "startup", short_description: "Clinical devices", logo_url: null, website: null, city: "Helsinki", termIds: ["medtech", "finland", "wearables", "seed"] },
    { id: "2", slug: "beta", name: "Beta", type: "investor", short_description: null, logo_url: null, website: null, city: "Stockholm", termIds: ["medtech", "sweden"] },
  ],
};
describe("Explore directory", () => {
  it("includes all published directory entries when filters are empty", () => expect(filterOrganisations(data, EMPTY_SEARCH).map((o) => o.id)).toEqual(["1", "2"]));
  it("matches organisation names and descriptions case-insensitively", () => expect(filterOrganisations(data, { ...EMPTY_SEARCH, q: "CLINICAL" }).map((o) => o.id)).toEqual(["1"]));
  it("combines types within a facet with OR", () => expect(filterOrganisations(data, { ...EMPTY_SEARCH, type: ["startup", "investor"] })).toHaveLength(2));
  it("combines field, sub-area, country, stage and type with AND", () => {
    const search = { ...EMPTY_SEARCH, type: ["startup"], field: ["medtech"], sub_area: ["wearables"], country: ["finland"], stage: ["seed"] };
    expect(filterOrganisations(data, search).map((o) => o.id)).toEqual(["1"]);
    expect(filterOrganisations(data, { ...search, country: ["sweden"] })).toHaveLength(0);
  });
  it("counts against other filters without hiding alternatives in the selected facet", () => {
    expect(facetCounts(data, { ...EMPTY_SEARCH, country: ["finland"], field: ["medtech"] }, "country")).toEqual({ finland: 1, sweden: 1 });
    expect(facetCounts(data, { ...EMPTY_SEARCH, country: ["finland"] }, "type")).toEqual({ startup: 1 });
  });
  it("round-trips shareable URL filters and tolerates malformed parameters", () => {
    const search = { ...EMPTY_SEARCH, q: "health", country: ["finland"], stage: ["seed"] };
    expect(parseExploreSearch(JSON.parse(JSON.stringify(search)))).toEqual(search);
    expect(parseExploreSearch({ field: ["medtech", 1, "medtech"], q: 1 }).field).toEqual(["medtech"]);
  });
});import { cardTags, cleanExploreSearch } from "./explore";
describe("Explore cards and URLs", () => {
  it("shows one sub-area or field and one stage, never journey steps", () => {
    const org = data.organisations[0]; if (!org) throw new Error('Missing fixture');
    const journey = { id: 'idea', kind: 'journey_step', slug: 'idea', name: 'Idea', parent_id: null, sort_order: 0 };
    const r = cardTags({ ...org, termIds: [...org.termIds, 'idea'] }, [...data.terms, journey]);
    expect(r.shown.map((t) => t.id)).toEqual(["wearables", "seed"]);
    expect(r.extra).toBe(0);
  });
  it("drops empty URL params", () => expect(cleanExploreSearch({ ...EMPTY_SEARCH, country: ["finland"] })).toEqual({ country: ["finland"] }));
});
import { describe as d2, it as i2, expect as e2 } from 'vitest';
import { parseExploreSearch as pe, filterOrganisations as fo, sortOrganisations, groupSlug } from './explore';
d2('explore groups and sort', () => {
  const org = (id: string, type: string, published_at: string) => ({ id, slug: id, name: id, type, short_description: null, logo_url: null, website: null, city: null, termIds: [], published_at });
  const data = { organisations: [org('B', 'investor', '2026-01-01'), org('A', 'startup', '2026-05-01'), org('C', 'accelerator', '2026-03-01')], terms: [] };
  i2('filters by ecosystem group from the URL', () => {
    e2(groupSlug(3)).toBe('incubators-and-accelerators');
    e2(fo(data, pe({ group: 'incubators-and-accelerators' })).map(o => o.id)).toEqual(['C']);
  });
  i2('sorts A to Z or recently added', () => {
    e2(sortOrganisations(data.organisations, 'az').map(o => o.id)).toEqual(['A', 'B', 'C']);
    e2(sortOrganisations(data.organisations, 'recent').map(o => o.id)).toEqual(['A', 'C', 'B']);
  });
});
