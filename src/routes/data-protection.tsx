import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { siteInfoQuery } from "@/lib/site.query";

export const Route = createFileRoute("/data-protection")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteInfoQuery),
  head: () => ({
    meta: [
      { title: "Data protection: Northbeat" },
      { name: "description", content: "How Northbeat handles personal data under the GDPR: what we hold, the basis for it, your rights and how to use them." },
      { property: "og:title", content: "Data protection: Northbeat" },
      { property: "og:description", content: "How Northbeat handles personal data under the GDPR: what we hold, the basis for it, your rights and how to use them." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nordic-heartbeat.lovable.app/data-protection" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://nordic-heartbeat.lovable.app/data-protection" }],
  }),
  errorComponent: () => <div role="alert" className="nb-page"><h1 className="nb-h1">This page didn't load</h1><p className="nb-lead">Please try again in a moment.</p></div>,
  component: DataProtectionPage,
});

function DataProtectionPage() {
  const { data } = useSuspenseQuery(siteInfoQuery);
  const contact = data.contactEmail;
  return (
    <div className="nb-page max-w-2xl">
      <header className="nb-page-header">
        <h1 className="nb-h1">Data protection</h1>
        <p className="nb-lead">How Northbeat handles personal data under the GDPR, in plain words.</p>
      </header>

      <section aria-labelledby="controller-heading" className="nb-section">
        <h2 id="controller-heading" className="nb-h2">Who controls your data</h2>
        <p className="nb-body">Northbeat, run by its founders from Helsinki, Finland, decides how the personal data on this site is used. We are a small team, so you write to one of us and one of us answers.</p>
        {contact && <p className="nb-body">Reach us at <a href={`mailto:${contact}`} className="nb-link">{contact}</a>.</p>}
      </section>

      <section aria-labelledby="data-heading" className="nb-section">
        <h2 id="data-heading" className="nb-h2">What we hold, why, and on what basis</h2>
        <ul className="nb-body list-disc pl-5 space-y-3">
          <li><strong>Newsletter emails.</strong> We store your email to send the weekly letter. Basis: your consent. You can withdraw it by unsubscribing at any time.</li>
          <li><strong>Systole first-to-know list.</strong> We store your email to tell you when Systole opens. Basis: your consent. Ask us to remove you at any time.</li>
          <li><strong>Submissions.</strong> When you suggest a company, event, open call or podcast guest, we store your name, your email and the details of the suggestion, so we can check it and reply. Basis: your consent.</li>
          <li><strong>Saved items and recent searches.</strong> These stay in your own browser and never reach our servers, so no consent or basis applies to them.</li>
        </ul>
        <p className="nb-body">We collect nothing else from visitors. We have no visitor accounts, no ads and no cross-site tracking.</p>
      </section>

      <section aria-labelledby="rights-heading" className="nb-section">
        <h2 id="rights-heading" className="nb-h2">Your rights</h2>
        <p className="nb-body">If you are in the EU or EEA, the GDPR gives you rights over your personal data. You can ask us for a copy of it, to correct it, to delete it, to limit how we use it, or to move it somewhere else. You can object to how we use it and withdraw consent you gave earlier. You can use any of these by emailing us. We answer every request, usually within a month.</p>
      </section>

      <section aria-labelledby="complaints-heading" className="nb-section">
        <h2 id="complaints-heading" className="nb-h2">Complaints</h2>
        <p className="nb-body">If you are unhappy with how we handle your data, tell us first and we will try to fix it. You also have the right to complain to your national data protection authority. In Finland, that is the Office of the Data Protection Ombudsman.</p>
      </section>

      <section aria-labelledby="more-heading" className="nb-section">
        <h2 id="more-heading" className="nb-h2">More detail</h2>
        <p className="nb-body">The <Link to="/privacy" className="nb-link">privacy policy</Link> lists every service we use and how long we keep each kind of data.</p>
      </section>

      <section className="nb-section">
        <h2 className="nb-h2">Read also</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/privacy" className="nb-btn nb-btn-secondary">Privacy policy</Link>
          <Link to="/terms" className="nb-btn nb-btn-secondary">Terms of use</Link>
        </div>
      </section>
    </div>
  );
}
