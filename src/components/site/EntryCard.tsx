import type { ReactNode } from 'react';
import { SaveButton } from './SaveButton';
import type { SavedKind } from '@/lib/saved';

/** One card style for organisations, events and opportunities: logo square, title, one line, 2 to 3 facts, save icon. */
export function EntryCard({ id, kind, slug, title, line, media, facts, link, footer }: { id: string; kind: SavedKind; slug: string; title: string; line?: string | null; media?: ReactNode; facts: (ReactNode | null | undefined | false)[]; link: ReactNode; footer?: ReactNode }) {
  const shown = facts.filter(Boolean).slice(0, 3);
  return <article data-result-id={id} className="nb-entry-card">
    <div className="nb-entry-card-top">{media ?? <span aria-hidden />}<SaveButton kind={kind} slug={slug} title={title} /></div>
    <h2 className="nb-entry-card-title">{link}</h2>
    {line && <p className="nb-entry-card-line">{line}</p>}
    {shown.length > 0 && <ul className="nb-entry-card-facts">{shown.map((fact, i) => <li key={i}>{fact}</li>)}</ul>}
    {footer && <div className="nb-entry-card-footer">{footer}</div>}
  </article>;
}
export function CardGrid({ children }: { children: ReactNode }) { return <div className="nb-card-grid">{children}</div>; }
