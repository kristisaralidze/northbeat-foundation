import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Northbeat" },
      { name: "description", content: "Northbeat is the reference hub for Nordic health, medtech and biotech startups." },
      { property: "og:title", content: "About — Northbeat" },
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
          Building a health startup in the Nordics means keeping up with a lot at once: grant calls that open and close quietly, programme intakes with short windows, pitch competitions, conferences, the investors who actually write cheques in health, and the researchers and clinicians who can validate an idea. The information exists — it's just scattered across dozens of websites, newsletters and LinkedIn posts.
        </p>
        <p>
          Northbeat started in Finland with a simple frustration: we kept missing things. A deadline here, a demo day there, a fund we only heard about after it had closed. So we started tracking it all in one place — companies, investors, programmes, funding, events, research groups, clinical advisors, jobs — and turned that list into Northbeat.
        </p>
        <p>
          Everything here is curated by hand. An entry belongs only if it helps someone build, fund, validate, join or research a health startup in the Nordics. No general tech events, no global health news, no noise. And everything links to everything else, so you can follow the thread from a startup to its investors, its people and its next deadline.
        </p>
        <p>
          Alongside the directory, we run a podcast with the people building and funding Nordic health innovation, and a newsletter that rounds up what matters. One calm email, when there's something worth knowing.
        </p>
        <p>
          Something missing? <Link to="/submit" className="nb-link">Tell us</Link> — the hub gets better every time someone does.
        </p>
      </div>
    </div>
  );
}
