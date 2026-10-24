import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { siteInfoQuery } from "@/lib/site.query";

export const Route = createFileRoute("/about")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteInfoQuery),
  head: () => ({
    meta: [
      { title: "About Northbeat" },
      { name: "description", content: "Who runs Northbeat, how we check entries, and why no one pays to be listed." },
      { property: "og:title", content: "About Northbeat" },
      { property: "og:description", content: "Who runs Northbeat, how we check entries, and why no one pays to be listed." },
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

function AboutPage() {
  const { data } = useSuspenseQuery(siteInfoQuery);
  return (
    <div className="nb-page">
      <header className="nb-page-header">
        <h1 className="nb-h1">About Northbeat</h1>
        <p className="nb-lead">Northbeat is the reference hub for anyone starting, joining, funding or researching a health venture in the Nordics.</p>
      </header>
      <div className="nb-body max-w-2xl space-y-6">
        <p>
          Building a health venture means tracking funding calls, programme intakes and events. It also means finding investors and researchers who can help test an idea. That information is scattered across websites, newsletters and LinkedIn posts.
        </p>
        <p>
          We started Northbeat in Finland because we kept missing deadlines and hearing about opportunities too late. We began keeping a shared list of companies, investors, programmes, funding calls and events. That list became Northbeat.
        </p>
        <p>
          We curate every entry by hand. It belongs here only if it helps someone build, fund, validate, join or research a new health venture in the Nordics. We don't list general tech events or global health news. Related entries link to each other, so you can find a company's investors and upcoming events.
        </p>
        <p>
          Our podcast starts in December 2026. Our newsletter covers funding calls, programme intakes and events.
        </p>
        <p className="nb-about-promise">No one pays to be listed or featured.</p>
      </div>

      {data.founders.length > 0 && <section aria-labelledby="founders-heading" className="nb-about-section">
        <h2 id="founders-heading" className="nb-h2">Founders</h2>
        <ul className="nb-founders">
          {data.founders.map(f => <li key={f.id} className="nb-founder">
            {f.photo_url && <img src={f.photo_url} alt={f.name} className="nb-founder-photo" loading="lazy" />}
            <h3 className="nb-h3">{f.name}</h3>
            {f.one_line && <p className="nb-small text-muted-foreground">{f.one_line}</p>}
            {f.linkedin_url && <a href={f.linkedin_url} target="_blank" rel="noopener noreferrer" className="nb-link">LinkedIn<span className="sr-only">: {f.name}</span></a>}
          </li>)}
        </ul>
      </section>}

      <section aria-labelledby="check-heading" className="nb-about-section max-w-2xl">
        <h2 id="check-heading" className="nb-h2">How we check entries</h2>
        <ul className="nb-check-list nb-body">
          <li>We use official sources only: the organisation's own website, public registers and official channels.</li>
          <li>Every entry is checked by hand before it goes live.</li>
          <li>We review every entry regularly and fix anything that changes.</li>
        </ul>
      </section>

      <section aria-labelledby="contact-heading" className="nb-about-section max-w-2xl">
        <h2 id="contact-heading" className="nb-h2">Contact</h2>
        {data.contactEmail && <p className="nb-body">Email us at <a href={`mailto:${data.contactEmail}`} className="nb-link">{data.contactEmail}</a>.</p>}
        {(data.linkedinUrl || data.instagramUrl) && <p className="nb-body mt-4 flex flex-wrap gap-6">
          {data.linkedinUrl && <a href={data.linkedinUrl} target="_blank" rel="noopener noreferrer" className="nb-link">LinkedIn</a>}
          {data.instagramUrl && <a href={data.instagramUrl} target="_blank" rel="noopener noreferrer" className="nb-link">Instagram</a>}
        </p>}
        <p className="nb-body mt-4"><Link to="/submit" className="nb-link">Suggest an entry</Link> if we've missed a company, event or opportunity.</p>
      </section>
    </div>
  );
}
