import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About: Northbeat" },
      { name: "description", content: "Northbeat is the reference hub for Nordic health, medtech and biotech startups." },
      { property: "og:title", content: "About: Northbeat" },
      { property: "og:description", content: "Northbeat is the reference hub for Nordic health, medtech and biotech startups." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="nb-page">
      <header className="nb-page-header">
        <p className="nb-eyebrow">About</p>
        <h1 className="nb-h1">We track it so you don't miss it.</h1>
        <p className="nb-lead">Northbeat is the reference hub for anyone starting, joining, funding or researching a health, medtech or biotech startup in the Nordics.</p>
      </header>
      <div className="nb-body max-w-2xl space-y-6">
        <p>
          Building a health venture means tracking funding calls, programme intakes and events. It also means finding investors, researchers and clinicians who can help test an idea. That information is scattered across websites, newsletters and LinkedIn posts.
        </p>
        <p>
          We started Northbeat in Finland because we kept missing deadlines and hearing about opportunities too late. We began keeping a shared list of companies, investors, programmes, funding calls, events, researchers, clinical advisors and jobs. That list became Northbeat.
        </p>
        <p>
          We curate every entry by hand. It belongs here only if it helps someone build, fund, validate, join or research a new health venture in the Nordics. We don't list general tech events or global health news. Related entries link to each other, so you can find a company's investors, people and upcoming events.
        </p>
        <p>
          Our podcast features people building and funding Nordic health innovation. Our newsletter covers funding calls, programme intakes and events.
        </p>
        <p>
          <Link to="/submit" className="nb-link">Suggest an entry</Link> if we've missed a company, event or opportunity.
        </p>
      </div>
    </div>
  );
}
