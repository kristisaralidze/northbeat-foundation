import { useSuspenseQuery } from '@tanstack/react-query';
import { ecosystemGroupsQuery } from '@/lib/ecosystem.query';
import { OrganisationLogo } from './OrganisationLogo';

export function EcosystemGrid() {
  const { data } = useSuspenseQuery(ecosystemGroupsQuery);
  return <section className="nb-eco nb-container" aria-labelledby="ecosystem-heading">
    <h2 id="ecosystem-heading" className="nb-network-heading">The ecosystem</h2>
    <p className="nb-eco-line">Every organisation on Northbeat, grouped by what they do.</p>
    <ul className="nb-eco-grid">
      {data.map(g => <li key={g.group}>
        <a className="nb-eco-card" href={g.href}>
          <h3>{g.name}</h3>
          <p className="nb-eco-count">{g.count} {g.count === 1 ? 'organisation' : 'organisations'}</p>
          {g.orgs.length > 0 && <div className="nb-eco-logos">
            {g.orgs.map(o => <OrganisationLogo key={o.slug} name={o.name} uploaded={o.logo_url} website={o.website} choice={o.logo_choice ?? 'icon'} />)}
          </div>}
          <span className="nb-eco-more">See all</span>
        </a>
      </li>)}
    </ul>
  </section>;
}
