import { useEffect, useRef, type ReactNode } from 'react';
import { networkGroup } from '@/lib/ecosystem';
import type { EntityKey } from '@/lib/admin/entities';
import type { PublicProfile, RelatedEntry } from '@/lib/profiles';
import { text, relationshipNodes, showRelationshipMap } from '@/lib/profiles';
import { OrganisationLogo } from './OrganisationLogo';
export function RelationshipMap({ profile, link }: { profile: PublicProfile; link: (kind: EntityKey, entry: RelatedEntry) => ReactNode }) {
  const host = useRef<HTMLElement>(null);
  const nodes = relationshipNodes(profile).map(node => ({ ...node, colour: node.kind === 'people' ? 8 : networkGroup(node.kind === 'organisations' ? 'organisation' : node.kind === 'events' ? 'event' : 'opportunity', node.entry.type ?? '') }));
  useEffect(() => {
    const el = host.current; if (!el) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry?.isIntersecting) { el.dataset['drawn'] = 'true'; observer.disconnect(); } }, { threshold: .25 });
    observer.observe(el); return () => observer.disconnect();
  }, []);
  if (!showRelationshipMap(profile)) return null;
  const rows = Math.ceil(nodes.length / 2), height = Math.max(260, rows * 96);
  return <section ref={host} className="nb-relationship-map" aria-label={`${profile.title} connections`}>
    <svg viewBox={`0 0 700 ${height}`} preserveAspectRatio="none" aria-hidden="true" className="nb-relationship-lines">
      {nodes.map((node, i) => <path key={`${node.kind}:${node.entry.id}`} d={`M350,${height / 2} L${i % 2 ? 570 : 130},${48 + Math.floor(i / 2) * (height / rows)}`} pathLength="1" />)}
    </svg>
    <div className="nb-relationship-centre"><OrganisationLogo name={profile.title} uploaded={profile.image} website={text(profile.row, 'website')} /><span><span className={`nb-group-dot nb-network-group-${networkGroup('organisation', String(profile.row['type'] ?? ''))}`} />{profile.title}</span></div>
    <ul className="nb-relationship-nodes">{nodes.map(node => <li key={`${node.kind}:${node.entry.id}`}>{node.kind === 'organisations' && <OrganisationLogo name={node.entry.title} slug={node.entry.slug} />}<span><span className={`nb-group-dot nb-network-group-${node.colour}`} aria-hidden />{link(node.kind, node.entry)}</span></li>)}</ul>
  </section>;
}