import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { siteInfoQuery } from "@/lib/site.query";

export const Route = createFileRoute("/terms")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteInfoQuery),
  head: () => ({
    meta: [
      { title: "Terms of service: Northbeat" },
      { name: "description", content: "Short, plain terms for using Northbeat: what the hub is, how to rely on it and what we do with submissions." },
      { property: "og:title", content: "Terms of service: Northbeat" },
      { property: "og:description", content: "Short, plain terms for using Northbeat: what the hub is, how to rely on it and what we do with submissions." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nordic-heartbeat.lovable.app/terms" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://nordic-heartbeat.lovable.app/terms" }],
  }),
  errorComponent: () => <div role="alert" className="nb-page"><h1 className="nb-h1">This page didn't load</h1><p className="nb-lead max-w-2xl">Please try again in a moment.</p></div>,
  component: TermsPage,
});

function TermsPage() {
  const { data } = useSuspenseQuery(siteInfoQuery);
  const contact = data.contactEmail;
  return (
    <div className="nb-page">
      <header className="nb-page-header">
        <h1 className="nb-h1">Terms of service</h1>
        <p className="nb-lead max-w-2xl">The terms that apply when you use Northbeat.</p>
        <p className="nb-small mt-4">Last updated: 25 October 2026</p>
      </header>

      <section aria-labelledby="what-heading" className="nb-section max-w-2xl">
        <h2 id="what-heading" className="nb-h2">What Northbeat is</h2>
        <p className="nb-body">Northbeat is a free information hub for Nordic health innovation. These terms apply to browsing the site and submitting information. If you do not agree, please do not use the site. No one pays to be listed or featured.</p>
      </section>

      <section aria-labelledby="info-heading" className="nb-section max-w-2xl">
        <h2 id="info-heading" className="nb-h2">Information, not advice</h2>
        <p className="nb-body">Content is for general information, not medical, legal, financial or investment advice. Details can change. Always confirm deadlines, eligibility and event details with the official provider before acting. We cannot guarantee that every entry is complete or current.</p>
      </section>

      <section aria-labelledby="links-heading" className="nb-section max-w-2xl">
        <h2 id="links-heading" className="nb-h2">Links to other sites</h2>
        <p className="nb-body">We link to organisers, funders, calendar services and maps. We don't run those sites and are not responsible for what they do with your visit.</p>
      </section>

      <section aria-labelledby="submissions-heading" className="nb-section max-w-2xl">
        <h2 id="submissions-heading" className="nb-h2">Your submissions</h2>
        <p className="nb-body">Sending a suggestion is voluntary. When you do, you confirm the information is correct to the best of your knowledge. We may check it, shorten it and add it to the hub. Please don't send anything confidential.</p>
      </section>

      <section aria-labelledby="ownership-heading" className="nb-section max-w-2xl">
        <h2 id="ownership-heading" className="nb-h2">Content and intellectual property</h2>
        <p className="nb-body">Northbeat's original content and design are protected by applicable intellectual property law. Organisation names, logos and third-party material belong to their respective owners. Listings do not imply endorsement or a commercial relationship. Sharing links is welcome. For reuse beyond what the law permits, seek permission from the relevant rights holder.</p>
      </section>

      <section aria-labelledby="use-heading" className="nb-section max-w-2xl">
        <h2 id="use-heading" className="nb-h2">Fair use</h2>
        <p className="nb-body">Don't send false information. Don't try to break the site. Don't use it to spam people.</p>
      </section>

      <section aria-labelledby="liability-heading" className="nb-section max-w-2xl">
        <h2 id="liability-heading" className="nb-h2">Availability and liability</h2>
        <p className="nb-body">The site is provided as available. We may update, remove or temporarily interrupt content or features. To the extent permitted by law, Northbeat is not liable for loss arising from reliance on listings or use of external services. Nothing in these terms excludes liability that cannot lawfully be excluded or limits mandatory consumer rights.</p>
      </section>

      <section aria-labelledby="privacy-heading" className="nb-section max-w-2xl">
        <h2 id="privacy-heading" className="nb-h2">Privacy</h2>
        <p className="nb-body">Our <Link to="/privacy" className="nb-link">privacy policy</Link> explains how personal information is handled and how to exercise your data protection rights.</p>
      </section>

      <section aria-labelledby="changes-heading" className="nb-section max-w-2xl">
        <h2 id="changes-heading" className="nb-h2">Changes</h2>
        <p className="nb-body">We can update these terms. The current version always lives on this page.</p>
      </section>

      <section aria-labelledby="contact-heading" className="nb-section max-w-2xl">
        <h2 id="contact-heading" className="nb-h2">Contact</h2>
        {contact && <p className="nb-body">Write to <a href={`mailto:${contact}`} className="nb-link">{contact}</a> with any question about these terms.</p>}
      </section>

      <section className="nb-section max-w-2xl">
        <h2 className="nb-h2">Read also</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/privacy" className="nb-btn nb-btn-secondary">Privacy policy</Link>
        </div>
      </section>
    </div>
  );
}
