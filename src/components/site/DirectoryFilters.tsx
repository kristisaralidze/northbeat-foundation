import { Checkbox } from "@/components/ui/checkbox";
import { FACETS, facetCounts, type DirectoryData, type ExploreSearch, type Facet } from "@/lib/explore";
import { ORG_TYPES, humanize } from "@/lib/admin/entities";

const LABELS: Record<Facet, string> = { type: "Type", field: "Field", sub_area: "Sub-area", country: "Country", stage: "Stage" };
export function DirectoryFilters({ data, search, onToggle }: { data: DirectoryData; search: ExploreSearch; onToggle: (facet: Facet, value: string) => void }) {
  return <div className="space-y-8">{FACETS.map((facet) => {
    const counts = facetCounts(data, search, facet);
    const options = facet === "type" ? ORG_TYPES.map((value) => ({ value, label: humanize(value) })) : data.terms.filter((term) => term.kind === facet).map((term) => ({ value: term.slug, label: term.name }));
    const unknown = search[facet].filter((value) => !options.some((option) => option.value === value));
    return <fieldset key={facet} className="border-t border-hairline pt-4">
      <legend className="nb-eyebrow pr-3">{LABELS[facet]}</legend>
      <div className="space-y-1">{[...options, ...unknown.map((value) => ({ value, label: humanize(value) }))].map((option) => {
        const id = `explore-${facet}-${option.value}`;
        return <label key={option.value} htmlFor={id} className="nb-filter-option">
          <Checkbox id={id} checked={search[facet].includes(option.value)} onCheckedChange={() => onToggle(facet, option.value)} className="shadow-none border-hairline data-[state=checked]:border-primary" />
          <span className="min-w-0 flex-1 break-words">{option.label}</span>
          <span className="text-muted-foreground tabular-nums" aria-label={`${counts[option.value] ?? 0} organisations`}>{counts[option.value] ?? 0}</span>
        </label>;
      })}</div>
    </fieldset>;
  })}</div>;
}