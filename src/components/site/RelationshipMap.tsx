import { useEffect, useRef, type ReactNode } from 'react';
import { networkGroup } from '@/lib/ecosystem';
import type { EntityKey } from '@/lib/admin/entities';
import type { PublicProfile, RelatedEntry } from '@/lib/profiles';
export function RelationshipMap({ profile, link }: { profile: PublicProfile; link: (kind: EntityKey, entry: RelatedEntry) => ReactNode }) {
  const host = useRef<HTMLElement>(null);
  const seen = new Set<string>();
  const nodes = profile.related.flatMap(group => group.entries.flatMap(entry => {
    const key = `${group.kind}:${entry.id}`;
    if (seen.has(key) || !['organisations', 'people', 'events', 'opportunities'].includes(group.kind)) return [];
    seen.add(key);
    const colour = group.kind === 'people' ? 8 : networkGroup(group.kind === 'organisations' ? 'organisation' : group.kind === 'events' ? 'event' : 'opportunity', entry.type ?? '');
    return [{ entry, kind: group.kind, colour }];
  }));
  useEffect(() => {
    const el = host.current; if (!el) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry?.isIntersecting) { el.dataset['drawn'] = 'true'; observer.disconnect(); } }, { threshold: .25 });
    observer.observe(el); return () => observer.disconnect();
  }, []);
  if (!nodes.length) return null;
  const rows = Math.ceil(nodes.length / 2), height = Math.max(260, rows * 96);
  return <section ref={host} className="nb-relationship-map" aria-label={`${profile.title} connections`}>
    <svg viewBox={`0 0 700 ${height}`} preserveAspectRatio="none" aria-hidden="true" className="nb-relationship-lines">
      {nodes.map((node, i) => <path key={`${node.kind}:${node.entry.id}`} d={`M350,${height / 2} L${i % 2 ? 570 : 130},${48 + Math.floor(i / 2) * (height / rows)}`} pathLength="1" />)}
    </svg>
    <div className="nb-relationship-centre"><span className={`nb-group-dot nb-network-group-${networkGroup('organisation', String(profile.row['type'] ?? ''))}`} />{profile.title}</div>
    <ul className="nb-relationship-nodes">{nodes.map(node => <li key={`${node.kind}:${node.entry.id}`}><span className={`nb-group-dot nb-network-group-${node.colour}`} aria-hidden />{link(node.kind, node.entry)}</li>)}</ul>
  </section>;
}