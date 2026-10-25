import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { siteInfoQuery } from "@/lib/site.query";

export const Route = createFileRoute("/privacy")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteInfoQuery),
  head: () => ({
    meta: [
      { title: "Privacy policy: Northbeat" },
      { name: "description", content: "What Northbeat collects, why we use it, how long we keep it and how to unsubscribe or be removed." },
      { property: "og:title", content: "Privacy policy: Northbeat" },
      { property: "og:description", content: "What Northbeat collects, why we use it, how long we keep it and how to unsubscribe or be removed." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nordic-heartbeat.lovable.app/privacy" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://nordic-heartbeat.lovable.app/privacy" }],
  }),
  errorComponent: () => <div role="alert" className="nb-page"><h1 className="nb-h1">This page didn't load</h1><p className="nb-lead max-w-2xl">Please try again in a moment.</p></div>,
  component: PrivacyPage,
});

function PrivacyPage() {
  const { data } = useSuspenseQuery(siteInfoQuery);
  const contact = data.contactEmail;
  return (
    <div className="nb-page">
      <header className="nb-page-header">
        <h1 className="nb-h1">Privacy policy</h1>
        <p className="nb-lead max-w-2xl">How Northbeat collects, uses and protects personal information, and your rights under the GDPR.</p>
        <p className="nb-small mt-4">Last updated: 25 October 2026</p>
      </header>

      <section aria-labelledby="who-heading" className="nb-section max-w-2xl">
        <h2 id="who-heading" className="nb-h2">Who we are</h2>
        <p className="nb-body">Northbeat is a free hub for Nordic health innovation. The Northbeat team is responsible for the personal information collected through this website. You can browse without an account.</p>
        {contact && <p className="nb-body">Questions about this policy? Write to <a href={`mailto:${contact}`} className="nb-link">{contact}</a>.</p>}
      </section>

      <section aria-labelledby="collect-heading" className="nb-section max-w-2xl">
        <h2 id="collect-heading" className="nb-h2">What we collect</h2>
        <ul className="nb-body list-disc pl-5 space-y-2">
          <li><strong>Email addresses you give us.</strong> When you sign up for the newsletter or the Systole first-to-know list, we store your email. That is all we ask for.</li>
          <li><strong>Submissions.</strong> When you use Add to the hub or Suggest a guest, we store your name, your email and the details of what you suggest.</li>
          <li><strong>Browser storage.</strong> Saved items and recent searches are stored in your browser to provide those features.</li>
          <li><strong>Technical information.</strong> Hosting and external services may process your IP address, browser details and request information when delivering the website or its images.</li>
        </ul>
        <p className="nb-body">We have no visitor accounts and we do not run user profiles.</p>
      </section>

      <section aria-labelledby="why-heading" className="nb-section max-w-2xl">
        <h2 id="why-heading" className="nb-h2">Why we use it</h2>
        <ul className="nb-body list-disc pl-5 space-y-2">
          <li>To send the newsletter you signed up for, about once a week.</li>
          <li>To tell you when Systole opens, if you joined that list.</li>
          <li>To review your submission and, if it checks out, add it to the hub.</li>
          <li>To reply when you write to us.</li>
        </ul>
      </section>

      <section aria-labelledby="basis-heading" className="nb-section max-w-2xl">
        <h2 id="basis-heading" className="nb-h2">Legal bases for processing</h2>
        <p className="nb-body">We rely on your consent for email subscriptions. You can withdraw it at any time. We process suggestions and correspondence to review entries and respond to you, based on our legitimate interest in running the hub. Where required, we also process information to meet legal obligations.</p>
      </section>

      <section aria-labelledby="not-heading" className="nb-section max-w-2xl">
        <h2 id="not-heading" className="nb-h2">What we don't do</h2>
        <p className="nb-body">We do not run ads. We do not sell email addresses. We do not track you across other websites. No one pays to be listed or featured.</p>
      </section>

      <section aria-labelledby="others-heading" className="nb-section max-w-2xl">
        <h2 id="others-heading" className="nb-h2">Services we use</h2>
        <ul className="nb-body list-disc pl-5 space-y-2">
          <li>The site runs on Lovable's cloud hosting.</li>
          <li>Organisation logos load from Brandfetch, a brand asset service.</li>
          <li>The company search on the submission form sends what you type to Brandfetch, so it can suggest names and logos. This happens as you type.</li>
          <li>Calendar, map and other external links take you to services with their own privacy policies.</li>
          <li>YouTube or Vimeo can receive information when you choose to load a video.</li>
        </ul>
        <p className="nb-body">External services may process information outside the European Economic Area. Applicable data protection law requires appropriate safeguards for such transfers.</p>
      </section>

      <section aria-labelledby="storage-heading" className="nb-section max-w-2xl">
        <h2 id="storage-heading" className="nb-h2">Cookies and local storage</h2>
        <p className="nb-body">The site uses browser storage for saved items and recent searches. Administrator sign-in uses authentication storage. You can remove stored information through your browser settings. Removing it may reset saved items or sign you out.</p>
      </section>

      <section aria-labelledby="keep-heading" className="nb-section max-w-2xl">
        <h2 id="keep-heading" className="nb-h2">How long we keep it</h2>
        <ul className="nb-body list-disc pl-5 space-y-2">
          <li>Newsletter: until you unsubscribe.</li>
          <li>Systole list: for updates you requested, until you withdraw consent or the list is no longer needed.</li>
          <li>Submissions and correspondence: for as long as needed to review, respond and maintain relevant records.</li>
        </ul>
        <p className="nb-body">Information may need to be kept longer where required by law or to resolve a dispute.</p>
      </section>

      <section aria-labelledby="security-heading" className="nb-section max-w-2xl">
        <h2 id="security-heading" className="nb-h2">How we protect information</h2>
        <p className="nb-body">Access to subscription and submission records is restricted to authorised administrators. We use access controls to protect personal information. No website or transmission method can guarantee complete security.</p>
      </section>

      <section aria-labelledby="choices-heading" className="nb-section max-w-2xl">
        <h2 id="choices-heading" className="nb-h2">Your rights under the GDPR</h2>
        <p className="nb-body">Subject to applicable conditions, you can request access to your personal information, correction, deletion, restriction of processing or a portable copy. You can object to processing based on legitimate interests and withdraw consent without affecting earlier lawful processing.</p>
        <p className="nb-body">Contact us to make a request. We may need to confirm your identity. GDPR requests are normally answered within one month. If an extension is permitted and needed, we will explain why.</p>
        {contact && <p className="nb-body">Send privacy requests to <a href={`mailto:${contact}`} className="nb-link">{contact}</a>.</p>}
        <p className="nb-body">You may complain to your local data protection authority. In Finland, contact the <a href="https://tietosuoja.fi/en/home" target="_blank" rel="noopener noreferrer" className="nb-link">Office of the Data Protection Ombudsman</a>.</p>
        <p className="nb-body">You can unsubscribe from email updates or ask us to remove you from a list. To remove saved items and recent searches, clear this site's browser storage.</p>
      </section>

      <section aria-labelledby="changes-heading" className="nb-section max-w-2xl">
        <h2 id="changes-heading" className="nb-h2">Changes</h2>
        <p className="nb-body">If we change this policy, we update this page.</p>
      </section>

      <section className="nb-section max-w-2xl">
        <h2 className="nb-h2">Read also</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/terms" className="nb-btn nb-btn-secondary">Terms of service</Link>
        </div>
      </section>
    </div>
  );
}
