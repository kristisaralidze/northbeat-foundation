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
});