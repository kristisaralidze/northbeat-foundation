import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { siteInfoQuery } from "@/lib/site.query";
import { EMPTY_SEARCH } from "@/lib/explore";

export const Route = createFileRoute("/about")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteInfoQuery),
  head: () => ({
    meta: [
      { title: "About Northbeat: Hear it here first." },
      { name: "description", content: "Northbeat is where Nordic health innovation is heard first: the map, the letter, the podcast and the hackathons." },
      { property: "og:title", content: "About Northbeat: Hear it here first." },
      { property: "og:description", content: "Northbeat is where Nordic health innovation is heard first: the map, the letter, the podcast and the hackathons." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nordic-heartbeat.lovable.app/about" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://nordic-heartbeat.lovable.app/about" }],
  }),
  errorComponent: () => <div role="alert" className="nb-page"><h1 className="nb-h1">This page didn't load</h1><p className="nb-lead">Please try again in a moment.</p></div>,
  notFoundComponent: () => <div className="nb-page"><h1 className="nb-h1">Not found</h1></div>,
  component: AboutPage,
});

const openSystole = () => window.dispatchEvent(new Event('northbeat:open-systole'));

function AboutPage() {
  const { data } = useSuspenseQuery(siteInfoQuery);
  return (
    <div className="nb-page">
      <header className="nb-page-header">
        <h1 className="nb-h1">Hear it here first.</h1>
        <p className="nb-lead max-w-2xl">Northbeat is where Nordic health innovation is heard first. We find what's new before it's everywhere: the startups, the research, the open calls and the people behind them. Then we share it, and bring people together to build more of it.</p>
      </header>

      <section aria-labelledby="do-heading" className="nb-about-section">
        <h2 id="do-heading" className="nb-h2">What we do</h2>
        <ul className="nb-about-grid">
          <li><Link to="/explore" search={EMPTY_SEARCH} className="nb-about-block"><h3 className="nb-h3">The map</h3><p className="nb-body">Every organisation, event and open call in Nordic health, connected, so you can see who works with whom.</p></Link></li>
          <li><Link to="/newsletter" className="nb-about-block"><h3 className="nb-h3">The letter</h3><p className="nb-body">The innovations themselves, explained in plain words: what's new, why it matters, who is behind it. Plus the deadlines and events you shouldn't miss.</p></Link></li>
          <li><Link to="/podcast" className="nb-about-block"><h3 className="nb-h3">The podcast</h3><p className="nb-body">Conversations with the people building health in the Nordics. Starts December 2026.</p></Link></li>
          <li><button type="button" onClick={openSystole} className="nb-about-block"><h3 className="nb-h3">The hackathons</h3><p className="nb-body">AI in medicine, medtech, health. Something big is coming in spring 2027.</p></button></li>
        </ul>
      </section>

      <section aria-labelledby="why-heading" className="nb-about-section max-w-2xl">
        <h2 id="why-heading" className="nb-h2">Why we started</h2>
        <p className="nb-body mt-4">We're founders ourselves. We're building a women's health company in Helsinki, and we kept hearing about things too late: a grant that closed last week, a lab that could have tested our idea, an investor who backs exactly what we do. So we started tracking everything. Then we saw that everyone around us needed the same thing.</p>
      </section>

      <section aria-labelledby="build-heading" className="nb-about-section max-w-2xl">
        <h2 id="build-heading" className="nb-h2">Build it with us</h2>
        <p className="nb-body mt-4">Northbeat grows with its community. Tell us what we missed. Share what you're building. Guide others. Come on the podcast. Mentor or partner at the hackathon.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/submit" className="nb-btn nb-btn-primary">Add to the hub</Link>
          <Link to="/submit" search={{ tab: 'guest' }} className="nb-btn nb-btn-secondary">Suggest a guest</Link>
          {data.contactEmail && <a href={`mailto:${data.contactEmail}?subject=${encodeURIComponent('Partner with Northbeat')}`} className="nb-btn nb-btn-secondary">Partner with us</a>}
          <Link to="/newsletter" className="nb-btn nb-btn-secondary">Get the letter</Link>
        </div>
      </section>

      <section aria-labelledby="promise-heading" className="nb-about-section max-w-2xl">
        <h2 id="promise-heading" className="nb-h2">Our promise</h2>
        <p className="nb-about-promise mt-4">No one pays to be listed or featured.</p>
        <p className="nb-body mt-3">Every entry comes from official sources and is checked by hand.</p>
      </section>

      {data.founders.length > 0 && <section aria-labelledby="team-heading" className="nb-about-section">
        <h2 id="team-heading" className="nb-h2">The team</h2>
        <ul className="nb-founders">
          {data.founders.map(f => <li key={f.id} className="nb-founder">
            {f.photo_url && <img src={f.photo_url} alt={f.name} className="nb-founder-photo" loading="lazy" />}
            <h3 className="nb-h3">{f.name}</h3>
            {f.one_line && <p className="nb-small text-muted-foreground">{f.one_line}</p>}
            {f.linkedin_url && <a href={f.linkedin_url} target="_blank" rel="noopener noreferrer" className="nb-link">LinkedIn<span className="sr-only">: {f.name}</span></a>}
          </li>)}
        </ul>
      </section>}
    </div>
  );
}
