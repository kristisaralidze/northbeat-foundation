import { memo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ALL = '__northbeat_all__';
/** Controlled URL filter with an explicit empty option and selected-value fallback. */
export const ListFilterSelect = memo(function ListFilterSelect({ label, ariaLabel, allLabel, value, options, onValueChange }: {
  label: string; ariaLabel?: string; allLabel: string; value: string;
  options: { value: string; label: string }[]; onValueChange: (value: string) => void;
}) {
  return <div className="min-w-0 flex-1 basis-40 nb-list-filter">
    <span className="nb-small mb-2 block text-muted-foreground">{label}</span>
    <Select value={value || ALL} onValueChange={v => onValueChange(v === ALL ? '' : v)}>
      <SelectTrigger aria-label={ariaLabel ?? label} className="nb-explore-filter-trigger" data-active={Boolean(value)}><SelectValue /></SelectTrigger>
      <SelectContent className="theme-site nb-explore-menu">
        <SelectItem value={ALL} className="nb-explore-select-option">{allLabel}</SelectItem>
        {options.map(o => <SelectItem key={o.value} value={o.value} className="nb-explore-select-option">{o.label}</SelectItem>)}
        {value && !options.some(o => o.value === value) && <SelectItem value={value} className="nb-explore-select-option">{value.replace(/_/g, ' ')}</SelectItem>}
      </SelectContent>
    </Select>
  </div>;
});