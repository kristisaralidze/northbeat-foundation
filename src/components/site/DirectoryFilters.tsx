import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { facetCounts, type DirectoryData, type ExploreSearch, type Facet } from "@/lib/explore";
import { ORG_TYPES, humanize } from "@/lib/admin/entities";

const LABELS: Record<Facet, string> = { type: "Type", field: "Field", sub_area: "Sub-area", country: "Country", stage: "Stage" };
const PRIMARY: Facet[] = ["field", "country", "stage"];
const MORE: Facet[] = ["type", "sub_area"];
const LIMIT = 6;

export function DirectoryFilters({ data, search, onToggle }: { data: DirectoryData; search: ExploreSearch; onToggle: (facet: Facet, value: string) => void }) {
  const [moreOpen, setMoreOpen] = useState(() => MORE.some((f) => search[f].length > 0));
  return <div className="space-y-8">
    {PRIMARY.map((facet) => <FacetGroup key={facet} facet={facet} data={data} search={search} onToggle={onToggle} />)}
    <Button variant="ghost" size="sm" className="text-primary px-0" aria-expanded={moreOpen} aria-controls="explore-more-filters" onClick={() => setMoreOpen((o) => !o)}>
      {moreOpen ? "Fewer filters" : "More filters"}<ChevronDown className={moreOpen ? "rotate-180" : ""} aria-hidden />
    </Button>
    {moreOpen && <div id="explore-more-filters" className="space-y-8">{MORE.map((facet) => <FacetGroup key={facet} facet={facet} data={data} search={search} onToggle={onToggle} />)}</div>}
  </div>;
}

function FacetGroup({ facet, data, search, onToggle }: { facet: Facet; data: DirectoryData; search: ExploreSearch; onToggle: (facet: Facet, value: string) => void }) {
  const [showAll, setShowAll] = useState(false);
  const counts = facetCounts(data, search, facet);
  const base = facet === "type" ? ORG_TYPES.map((value) => ({ value, label: humanize(value) })) : data.terms.filter((term) => term.kind === facet).map((term) => ({ value: term.slug, label: term.name }));
  const unknown = search[facet].filter((value) => !base.some((option) => option.value === value)).map((value) => ({ value, label: humanize(value) }));
  // Hide zero-result options unless currently selected (so they can be unticked).
  const options = [...base, ...unknown].filter((o) => (counts[o.value] ?? 0) > 0 || search[facet].includes(o.value));
  if (!options.length) return null;
  const visible = showAll ? options : options.slice(0, LIMIT);
  return <fieldset className="border-t border-hairline pt-4">
    <legend className="nb-eyebrow pr-3">{LABELS[facet]}</legend>
    <div className="space-y-1">{visible.map((option) => {
      const id = `explore-${facet}-${option.value}`;
      return <label key={option.value} htmlFor={id} className="nb-filter-option">
        <Checkbox id={id} checked={search[facet].includes(option.value)} onCheckedChange={() => onToggle(facet, option.value)} className="shadow-none border-hairline data-[state=checked]:border-primary" />
        <span className="min-w-0 flex-1 break-words">{option.label}</span>
        <span className="text-muted-foreground tabular-nums" aria-label={`${counts[option.value] ?? 0} organisations`}>{counts[option.value] ?? 0}</span>
      </label>;
    })}</div>
    {options.length > LIMIT && <Button variant="ghost" size="sm" className="text-primary px-0 mt-2" onClick={() => setShowAll((s) => !s)}>{showAll ? "Show fewer" : `Show all (${options.length})`}</Button>}
  </fieldset>;
}
