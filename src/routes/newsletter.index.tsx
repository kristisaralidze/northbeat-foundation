import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { issuesQuery } from "@/lib/newsletter.query";
import { issueLabel, sortIssues } from "@/lib/newsletter";
import { NewsletterSignup } from "@/components/site/NewsletterSignup";

export const Route = createFileRoute("/newsletter/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(issuesQuery),
  head: () => ({
    meta: [
      { title: "Newsletter: Northbeat" },
      { name: "description", content: "The Northbeat newsletter: funding calls, intakes and events in Nordic health innovation." },
      { property: "og:title", content: "Newsletter: Northbeat" },
      { property: "og:description", content: "The Northbeat newsletter: funding calls, intakes and events in Nordic health innovation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div role="alert" className="nb-page">
      <h1 className="nb-h1">This page didn't load</h1>
      <p className="nb-lead">{error instanceof Error ? error.message : String(error)}</p>
    </div>
  ),
  component: NewsletterPage,
});

function NewsletterPage() {
  const { data } = useSuspenseQuery(issuesQuery);
  const issues = sortIssues(data.issues);
  return (
    <div className="nb-page">
      <header className="nb-page-header">
        <h1 className="nb-h1">The Northbeat letter</h1>
        <p className="nb-lead">Funding calls, programme intakes and events in Nordic health innovation. We track it so you don't miss it.</p>
      </header>
      <section aria-label="Sign up" className="nb-card max-w-xl">
        <h2 className="nb-h3">Get the next issue</h2>
        <p className="nb-small text-muted-foreground">One email when a new issue is out.</p>
        <NewsletterSignup source="newsletter" />
      </section>
      {issues.length > 0 && <section aria-label="Past issues" className="mt-10">
        <h2 className="nb-h2">Past issues</h2>
        {issues.length === 0 ? (
          <p className="nb-body text-muted-foreground">No past issues yet.</p>
        ) : (
          <ul className="nb-card-grid">
            {issues.map((issue) => (
              <li key={issue.id}>
                <Link to="/newsletter/$slug" params={{ slug: issue.slug }} className="nb-card nb-card-link block h-full">
                  <p className="nb-eyebrow">{issueLabel(issue)}{issue.sent_on ? ` · ${issue.sent_on}` : ""}</p>
                  <h3 className="nb-h3">{issue.title}</h3>
                  {issue.summary ? <p className="nb-small text-muted-foreground">{issue.summary}</p> : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>}
    </div>
  );
}
