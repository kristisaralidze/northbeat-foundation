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
  errorComponent: () => <div role="alert" className="nb-page"><h1 className="nb-h1">This page didn't load</h1><p className="nb-lead">Please try again in a moment.</p></div>,
  component: PrivacyPage,
});

function PrivacyPage() {
  const { data } = useSuspenseQuery(siteInfoQuery);
  const contact = data.contactEmail;
  return (
    <div className="nb-page max-w-2xl">
      <header className="nb-page-header">
        <h1 className="nb-h1">Privacy policy</h1>
        <p className="nb-lead">This page explains what we collect, why we use it, how long we keep it and what you can ask us to do about it.</p>
      </header>

      <section aria-labelledby="who-heading" className="nb-section">
        <h2 id="who-heading" className="nb-h2">Who we are</h2>
        <p className="nb-body">Northbeat is a free hub for Nordic health innovation. It is run by its founders from Helsinki, Finland. You can browse everything without an account.</p>
        {contact && <p className="nb-body">Questions about this policy? Write to <a href={`mailto:${contact}`} className="nb-link">{contact}</a>.</p>}
      </section>

      <section aria-labelledby="collect-heading" className="nb-section">
        <h2 id="collect-heading" className="nb-h2">What we collect</h2>
        <ul className="nb-body list-disc pl-5 space-y-2">
          <li><strong>Email addresses you give us.</strong> When you sign up for the newsletter or the Systole first-to-know list, we store your email. That is all we ask for.</li>
          <li><strong>Submissions.</strong> When you use Add to the hub or Suggest a guest, we store your name, your email and the details of what you suggest.</li>
          <li><strong>Things your browser stores.</strong> Saved items and your last five searches stay in your own browser. They never reach our servers.</li>
        </ul>
        <p className="nb-body">We have no visitor accounts and we do not run user profiles.</p>
      </section>

      <section aria-labelledby="why-heading" className="nb-section">
        <h2 id="why-heading" className="nb-h2">Why we use it</h2>
        <ul className="nb-body list-disc pl-5 space-y-2">
          <li>To send the newsletter you signed up for, about once a week.</li>
          <li>To tell you when Systole opens, if you joined that list.</li>
          <li>To review your submission and, if it checks out, add it to the hub.</li>
          <li>To reply when you write to us.</li>
        </ul>
      </section>

      <section aria-labelledby="not-heading" className="nb-section">
        <h2 id="not-heading" className="nb-h2">What we don't do</h2>
        <p className="nb-body">We do not run ads. We do not sell email addresses. We do not track you across other websites. No one pays to be listed or featured.</p>
      </section>

      <section aria-labelledby="others-heading" className="nb-section">
        <h2 id="others-heading" className="nb-h2">Services we use</h2>
        <ul className="nb-body list-disc pl-5 space-y-2">
          <li>The site runs on Lovable's cloud hosting.</li>
          <li>Organisation logos load from Brandfetch, a brand asset service.</li>
          <li>The company search on the submission form sends what you type to Brandfetch, so it can suggest names and logos. This happens as you type.</li>
          <li>Calendar and map buttons open Google, Apple or Outlook in a new tab when you click them. Nothing is sent until you click.</li>
        </ul>
      </section>

      <section aria-labelledby="keep-heading" className="nb-section">
        <h2 id="keep-heading" className="nb-h2">How long we keep it</h2>
        <ul className="nb-body list-disc pl-5 space-y-2">
          <li>Newsletter: until you unsubscribe.</li>
          <li>Systole list: until Systole opens, or until you ask us to remove you.</li>
          <li>Submissions: while we check them, and as a record afterwards. Ask us to delete yours at any time.</li>
        </ul>
      </section>

      <section aria-labelledby="choices-heading" className="nb-section">
        <h2 id="choices-heading" className="nb-h2">Your choices</h2>
        <p className="nb-body">Every newsletter has an unsubscribe link. You can also email us to unsubscribe, leave the Systole list, or have your submission deleted. To remove saved items and recent searches, clear your browser storage for this site.</p>
      </section>

      <section aria-labelledby="changes-heading" className="nb-section">
        <h2 id="changes-heading" className="nb-h2">Changes</h2>
        <p className="nb-body">If we change this policy, we update this page.</p>
      </section>

      <section className="nb-section">
        <h2 className="nb-h2">Read also</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/terms" className="nb-btn nb-btn-secondary">Terms of use</Link>
          <Link to="/data-protection" className="nb-btn nb-btn-secondary">Data protection</Link>
        </div>
      </section>
    </div>
  );
}
