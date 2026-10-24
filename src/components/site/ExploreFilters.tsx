import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GROUP_OPTIONS, VISIBLE_FACETS, facetCounts, type DirectoryData, type ExploreSearch, type Facet } from "@/lib/explore";

export const FACET_LABELS: Record<Facet, string> = { group: "Group", country: "Country", field: "Field", stage: "Stage", type: "Type", sub_area: "Sub-area" };

export function facetOptions(data: DirectoryData, search: ExploreSearch, facet: Facet) {
  const counts = facetCounts(data, search, facet);
  const base = facet === "group" ? GROUP_OPTIONS : data.terms.filter((t) => t.kind === facet).map((t) => ({ value: t.slug, label: t.name }));
  return base.map((o) => ({ ...o, count: counts[o.value] ?? 0 })).filter((o) => o.count > 0 || search[facet].includes(o.value));
}

function OptionList({ facet, data, search, onToggle }: { facet: Facet; data: DirectoryData; search: ExploreSearch; onToggle: (facet: Facet, value: string) => void }) {
  return <div className="space-y-1">{facetOptions(data, search, facet).map((o) => {
    const id = `explore-${facet}-${o.value}`;
    return <label key={o.value} htmlFor={id} className="nb-filter-option">
      <Checkbox id={id} checked={search[facet].includes(o.value)} onCheckedChange={() => onToggle(facet, o.value)} className="shadow-none border-hairline data-[state=checked]:border-primary" />
      <span className="min-w-0 flex-1 break-words">{o.label}</span>
      <span className="text-muted-foreground tabular-nums">{o.count}</span>
    </label>;
  })}</div>;
}

/** Desktop: a row of chips that open small option lists. */
export function FilterChipRow(props: { data: DirectoryData; search: ExploreSearch; onToggle: (facet: Facet, value: string) => void }) {
  return <div className="nb-filter-chips" role="group" aria-label="Filters">{VISIBLE_FACETS.map((facet) => {
    const n = props.search[facet].length;
    if (!facetOptions(props.data, props.search, facet).length) return null;
    return <Popover key={facet}><PopoverTrigger asChild><button type="button" className="nb-filter-chip" data-active={n > 0}>{FACET_LABELS[facet]}{n > 0 ? ` (${n})` : ""}<ChevronDown className="h-4 w-4" aria-hidden /></button></PopoverTrigger>
      <PopoverContent align="start" className="theme-site nb-filter-pop w-72"><OptionList facet={facet} {...props} /></PopoverContent></Popover>;
  })}</div>;
}

/** Phone bottom sheet body: the same facets stacked. */
export function FilterStack(props: { data: DirectoryData; search: ExploreSearch; onToggle: (facet: Facet, value: string) => void }) {
  return <div className="space-y-8">{VISIBLE_FACETS.map((facet) => facetOptions(props.data, props.search, facet).length ? <fieldset key={facet} className="border-t border-hairline pt-4"><legend className="nb-h3 pr-3">{FACET_LABELS[facet]}</legend><OptionList facet={facet} {...props} /></fieldset> : null)}</div>;
}
