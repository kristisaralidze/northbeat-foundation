import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { siteInfoQuery } from "@/lib/site.query";

export const Route = createFileRoute("/terms")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteInfoQuery),
  head: () => ({
    meta: [
      { title: "Terms of use: Northbeat" },
      { name: "description", content: "Short, plain terms for using Northbeat: what the hub is, how to rely on it and what we do with submissions." },
      { property: "og:title", content: "Terms of use: Northbeat" },
      { property: "og:description", content: "Short, plain terms for using Northbeat: what the hub is, how to rely on it and what we do with submissions." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nordic-heartbeat.lovable.app/terms" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://nordic-heartbeat.lovable.app/terms" }],
  }),
  errorComponent: () => <div role="alert" className="nb-page"><h1 className="nb-h1">This page didn't load</h1><p className="nb-lead">Please try again in a moment.</p></div>,
  component: TermsPage,
});

function TermsPage() {
  const { data } = useSuspenseQuery(siteInfoQuery);
  const contact = data.contactEmail;
  return (
    <div className="nb-page max-w-2xl">
      <header className="nb-page-header">
        <h1 className="nb-h1">Terms of use</h1>
        <p className="nb-lead">Short terms for using Northbeat, in plain language on purpose.</p>
      </header>

      <section aria-labelledby="what-heading" className="nb-section">
        <h2 id="what-heading" className="nb-h2">What Northbeat is</h2>
        <p className="nb-body">A free hub for Nordic health innovation: organisations, events, open calls, guides, a glossary and a podcast. Anyone can browse it. Only the founders log in, to run the hub.</p>
      </section>

      <section aria-labelledby="info-heading" className="nb-section">
        <h2 id="info-heading" className="nb-h2">Information, not advice</h2>
        <p className="nb-body">We check every entry against official sources and show the date we last checked it. But details change often: deadlines move, programmes close, contacts change jobs. Always check the organiser's own page before you apply, register or travel. We cannot promise that every entry is complete or current.</p>
      </section>

      <section aria-labelledby="links-heading" className="nb-section">
        <h2 id="links-heading" className="nb-h2">Links to other sites</h2>
        <p className="nb-body">We link to organisers, funders, calendar services and maps. We don't run those sites and are not responsible for what they do with your visit.</p>
      </section>

      <section aria-labelledby="submissions-heading" className="nb-section">
        <h2 id="submissions-heading" className="nb-h2">Your submissions</h2>
        <p className="nb-body">Sending a suggestion is voluntary. When you do, you confirm the information is correct to the best of your knowledge. We may check it, shorten it and add it to the hub. Please don't send anything confidential.</p>
      </section>

      <section aria-labelledby="use-heading" className="nb-section">
        <h2 id="use-heading" className="nb-h2">Fair use</h2>
        <p className="nb-body">Don't send false information. Don't try to break the site. Don't use it to spam people.</p>
      </section>

      <section aria-labelledby="changes-heading" className="nb-section">
        <h2 id="changes-heading" className="nb-h2">Changes</h2>
        <p className="nb-body">We can update these terms. The current version always lives on this page.</p>
      </section>

      <section aria-labelledby="contact-heading" className="nb-section">
        <h2 id="contact-heading" className="nb-h2">Contact</h2>
        {contact && <p className="nb-body">Write to <a href={`mailto:${contact}`} className="nb-link">{contact}</a> with any question about these terms.</p>}
      </section>

      <section className="nb-section">
        <h2 className="nb-h2">Read also</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/privacy" className="nb-btn nb-btn-secondary">Privacy policy</Link>
          <Link to="/data-protection" className="nb-btn nb-btn-secondary">Data protection</Link>
        </div>
      </section>
    </div>
  );
}
