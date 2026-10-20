import type { ProfileTerm } from '@/lib/profiles';

export function SpecimenCard({ name, terms }: { name: string; terms: ProfileTerm[] }) {
  const field = terms.find(term => term.kind === 'field');
  const key = `${field?.name ?? ''} ${field?.slug ?? ''}`.toLowerCase();
  const family = /bio|pharma/.test(key) ? 'bio' : /med|device/.test(key) ? 'med' : /digital/.test(key) ? 'digital' : /women|fem/.test(key) ? 'women' : 'care';
  const initials = name.trim().split(/\s+/).slice(0, 2).map(word => word.charAt(0)).join('').toUpperCase();
  return <figure className={`nb-specimen nb-specimen-${family}`} aria-label={`${name}${field ? `, ${field.name}` : ''}`}>
    <span className="nb-specimen-initials" aria-hidden="true">{initials}</span>
    <svg viewBox="0 0 240 180" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      {family === 'bio' ? <><path d="M92 22h56m-46 0v51l-39 66q-10 19 12 19h90q22 0 12-19l-39-66V22"/><path d="M82 119h76m-66 17h54"/><circle cx="106" cy="104" r="3"/><circle cx="139" cy="143" r="4"/></> : family === 'med' ? <><path d="M58 135l100-100m-66 110l77-77-37-37-77 77zm48-121l45 45M63 128l-20 20m102-113l11-11m15 35l11-11"/><path d="M87 90l10 10m4-24l10 10m4-24l10 10"/></> : <><ellipse cx="120" cy="91" rx="87" ry="41"/><path d="M33 91v18c0 23 39 41 87 41s87-18 87-41V91"/><ellipse cx="120" cy="86" rx="68" ry="27"/><circle cx="95" cy="86" r="7"/><circle cx="142" cy="78" r="4"/><path d="M123 100l9-6m-54-12l8-4"/></>}
    </svg>
    {field && <figcaption className="nb-small">{field.name}</figcaption>}
  </figure>;
}