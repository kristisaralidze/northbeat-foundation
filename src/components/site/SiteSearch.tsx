import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Search, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { searchIndexQuery } from '@/lib/search.query';
import { itemHref, readRecent, saveRecent, searchAll, type SearchItem } from '@/lib/search';
import { humanize } from '@/lib/admin/entities';
import { OrganisationLogo } from './OrganisationLogo';

/** Navbar search icon plus Cmd/Ctrl+K: one search across the hub. */
export function SiteSearch() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(o => !o); } };
    document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey);
  }, []);
  return <>
    <button type="button" className="nb-header-icon" aria-label="Search everything" title="Search (Ctrl K)" onClick={() => setOpen(true)}><Search className="h-5 w-5" aria-hidden /></button>
    {open && <SearchDialog onClose={() => setOpen(false)} />}
  </>;
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const { data, isPending, isError } = useQuery(searchIndexQuery);
  const [query, setQuery] = useState(''); const [active, setActive] = useState(0); const [recent, setRecent] = useState<string[]>([]);
  const navigate = useNavigate(); const list = useRef<HTMLDivElement>(null);
  useEffect(() => { setRecent(readRecent()); }, []);
  const groups = useMemo(() => (data && query.trim() ? searchAll(data.items, query) : []), [data, query]);
  const flat = groups.flatMap(g => g.items);
  useEffect(() => { setActive(0); }, [query]);
  useEffect(() => { list.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }); }, [active]);
  function go(item: SearchItem) {
    setRecent(saveRecent(query)); onClose();
    const href = itemHref(item);
    if (item.kind === 'glossary') window.location.assign(href); else void navigate({ href });
  }
  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, flat.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && flat[active]) { e.preventDefault(); go(flat[active]!); }
  }
  let index = -1;
  return <Dialog open onOpenChange={o => { if (!o) onClose(); }}>
    <DialogContent className="theme-site top-[10vh] translate-y-0 max-w-xl gap-0 p-0" aria-describedby={undefined}>
      <DialogTitle className="sr-only">Search everything</DialogTitle>
      <div className="flex items-center gap-3 border-b border-hairline px-4">
        <Search className="h-5 w-5 text-muted-foreground" aria-hidden />
        <input autoFocus type="text" role="combobox" aria-expanded={flat.length > 0} aria-controls="site-search-results" aria-activedescendant={flat[active] ? `sr-${active}` : undefined} aria-label="Search organisations, events, opportunities and Learn" placeholder="Search organisations, events, opportunities, Learn" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={onKey} className="h-14 min-w-0 flex-1 bg-transparent pr-10 text-base outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none" style={{ boxShadow: 'none', border: 0 }} />
      </div>
      <div ref={list} id="site-search-results" role="listbox" className="nb-search-results p-2">
        {!query.trim() && recent.length > 0 && <div className="p-2"><p className="nb-small mb-2 text-muted-foreground">Recent searches</p>{recent.map(r => <button key={r} type="button" className="nb-search-result w-full text-left" onClick={() => setQuery(r)}><Clock className="h-4 w-4 text-muted-foreground" aria-hidden />{r}</button>)}</div>}
        {query.trim() && isPending && <p className="nb-small p-4 text-muted-foreground">Loading</p>}
        {isError && <p className="nb-small p-4 text-muted-foreground">Search could not be loaded. Please try again.</p>}
        {query.trim() && data && flat.length === 0 && <p className="nb-small p-4 text-muted-foreground">Nothing found for "{query.trim()}".</p>}
        {groups.map(g => <div key={g.kind} className="py-1"><p className="nb-small px-3 py-2 text-muted-foreground">{g.label}</p>{g.items.map(item => { index += 1; const i = index;
          return <a key={`${item.kind}-${item.slug}`} id={`sr-${i}`} role="option" aria-selected={i === active} data-active={i === active} href={itemHref(item)} className="nb-search-result" onMouseMove={() => setActive(i)} onClick={e => { e.preventDefault(); go(item); }}>
            {item.kind === 'organisation' && <OrganisationLogo name={item.title} uploaded={item.logo} website={item.website} choice={item.logoChoice ?? 'icon'} />}
            <span className="min-w-0 flex-1"><span className="block truncate">{item.title}</span>{(item.type || item.city) && <span className="nb-small block truncate text-muted-foreground">{[item.type ? humanize(item.type) : null, item.online ? 'Online' : item.city].filter(Boolean).join(', ')}</span>}</span>
          </a>; })}</div>)}
      </div>
    </DialogContent>
  </Dialog>;
}
