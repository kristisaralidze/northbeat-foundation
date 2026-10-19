import { useEffect, useRef, useState, type ReactNode } from 'react';
import { networkGroup } from '@/lib/ecosystem';
import type { EntityKey } from '@/lib/admin/entities';
import type { PublicProfile, RelatedEntry } from '@/lib/profiles';
import { text, relationshipNodes, showRelationshipMap } from '@/lib/profiles';
import { OrganisationLogo } from './OrganisationLogo';
export function RelationshipMap({ profile, link }: { profile: PublicProfile; link: (kind: EntityKey, entry: RelatedEntry) => ReactNode }) {
  const host = useRef<HTMLElement>(null);
  const [geometry, setGeometry] = useState({ width: 700, height: 260, paths: [] as string[] });
  const nodes = relationshipNodes(profile).map(node => ({ ...node, colour: node.kind === 'people' ? 8 : networkGroup(node.kind === 'organisations' ? 'organisation' : node.kind === 'events' ? 'event' : 'opportunity', node.entry.type ?? '') }));
  useEffect(() => {
    const el = host.current; if (!el) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry?.isIntersecting) { el.dataset['drawn'] = 'true'; observer.disconnect(); } }, { threshold: .25 });
    const measure = () => {
      const centre = el.querySelector('.nb-relationship-centre')?.getBoundingClientRect();
      const bounds = el.getBoundingClientRect();
      if (!centre || !bounds.width) return;
      const x = centre.left + centre.width / 2 - bounds.left;
      const y = centre.top + centre.height / 2 - bounds.top;
      const paths = [...el.querySelectorAll('.nb-relationship-nodes li')].map(node => {
        const box = node.getBoundingClientRect();
        return `M${x},${y} L${box.left + box.width / 2 - bounds.left},${box.top + box.height / 2 - bounds.top}`;
      });
      setGeometry({ width: bounds.width, height: bounds.height, paths });
    };
    const resize = new ResizeObserver(measure);
    resize.observe(el);
    el.querySelectorAll('.nb-relationship-nodes li').forEach(node => resize.observe(node));
    observer.observe(el); measure();
    return () => { observer.disconnect(); resize.disconnect(); };
  }, [profile]);
  if (!showRelationshipMap(profile)) return null;
  return <section ref={host} className="nb-relationship-map" aria-label={`${profile.title} connections`}>
    <svg viewBox={`0 0 ${geometry.width} ${geometry.height}`} preserveAspectRatio="none" aria-hidden="true" className="nb-relationship-lines">
      {nodes.map((node, i) => <path key={`${node.kind}:${node.entry.id}`} d={geometry.paths[i] ?? ''} pathLength="1" />)}
    </svg>
    <div className="nb-relationship-centre"><OrganisationLogo name={profile.title} uploaded={profile.image} website={text(profile.row, 'website')} /><span><span className={`nb-group-dot nb-network-group-${networkGroup('organisation', String(profile.row['type'] ?? ''))}`} />{profile.title}</span></div>
    <ul className="nb-relationship-nodes">{nodes.map(node => <li key={`${node.kind}:${node.entry.id}`}>{node.kind === 'organisations' && <OrganisationLogo name={node.entry.title} slug={node.entry.slug} />}<span><span className={`nb-group-dot nb-network-group-${node.colour}`} aria-hidden />{link(node.kind, node.entry)}</span></li>)}</ul>
  </section>;
}