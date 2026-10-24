import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { issuesQuery } from "@/lib/newsletter.query";
import { issueLabel, issuePreview, sortIssues } from "@/lib/newsletter";
import { directoryQuery } from "@/lib/directory.query";
import { opportunitiesQuery } from "@/lib/opportunities.query";
import { eventsQuery } from "@/lib/events.query";
import { friendlyDate } from "@/lib/opportunities";
import { dateLabel } from "@/lib/events";
import { OrganisationLogo } from "@/components/site/OrganisationLogo";
import { publicCopy } from "@/lib/profiles";
import { NewsletterSignup } from "@/components/site/NewsletterSignup";

export const Route = createFileRoute("/newsletter/")({
  loader: ({ context }) => Promise.all([issuesQuery, directoryQuery, opportunitiesQuery, eventsQuery].map((q) => context.queryClient.ensureQueryData(q as never))),
  head: () => ({
    meta: [
      { title: "Newsletter: Northbeat" },
      { name: "description", content: "The Northbeat newsletter: funding calls, intakes and events in Nordic health innovation." },
      { property: "og:title", content: "Newsletter: Northbeat" },
      { property: "og:description", content: "The Northbeat newsletter: funding calls, intakes and events in Nordic health innovation." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nordic-heartbeat.lovable.app/newsletter" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div role="alert" className="nb-page">
      <h1 className="nb-h1">This page didn't load</h1>
      <p className="nb-lead">{error instanceof Error ? error.message : String(error)}</p>
    </div>
  ),
  notFoundComponent: () => <div className="nb-page"><h1 className="nb-h1">Not found</h1></div>,
  component: NewsletterPage,
});

function NewsletterPage() {
  const { data } = useSuspenseQuery(issuesQuery);
  const issues = sortIssues(data.issues);
  const { data: dir } = useSuspenseQuery(directoryQuery);
  const { data: opps } = useSuspenseQuery(opportunitiesQuery);
  const { data: evs } = useSuspenseQuery(eventsQuery);
  const preview = issuePreview(dir.organisations, opps.opportunities, evs.events, evs.now);
  const hasPreview = preview.startups.length + preview.calls.length + preview.events.length > 0;
  return (
    <div className="nb-page">
      <header className="nb-page-header">
        <h1 className="nb-h1">The Northbeat letter</h1>
        <p className="nb-lead">We track Nordic health innovation so you don't miss it.</p>
      </header>
      <section aria-labelledby="nl-promise" className="max-w-xl">
        <h2 id="nl-promise" className="nb-h3">In every issue</h2>
        <dl className="mt-4 space-y-5 nb-body">
          <div><dt className="font-medium">New in Nordic health</dt><dd className="mt-1 text-muted-foreground">The most interesting new startups, products and research, each explained in plain words: what it does, why it matters, who is behind it.</dd></div>
          <div><dt className="font-medium">Open calls and deadlines</dt><dd className="mt-1 text-muted-foreground">What you can apply for now, and what closes soon.</dd></div>
          <div><dt className="font-medium">Events worth going to</dt><dd className="mt-1 text-muted-foreground">The ones we would go to ourselves, and why.</dd></div>
        </dl>
        <p className="nb-body mt-6">Once a week, free, unsubscribe any time.</p>
      </section>
      {hasPreview && <section aria-labelledby="nl-preview" className="nb-card mt-8 max-w-xl">
        <h2 id="nl-preview" className="nb-h3">What an issue looks like</h2>
        {preview.startups.length > 0 && <div className="mt-6"><h3 className="nb-eyebrow mb-3">New in Nordic health</h3><ul className="space-y-4">
          {preview.startups.map((o) => <li key={o.slug} className="flex items-start gap-3"><OrganisationLogo name={o.name} slug={o.slug} uploaded={o.logo_url} website={o.website} choice={o.logo_choice ?? null} />
            <div className="min-w-0"><Link to="/org/$slug" params={{ slug: o.slug }} className="nb-org-link nb-body font-medium">{o.name}</Link>{o.short_description && <p className="nb-small mt-1 line-clamp-2 text-muted-foreground">{publicCopy(o.short_description)}</p>}</div></li>)}
        </ul></div>}
        {preview.calls.length > 0 && <div className="mt-6"><h3 className="nb-eyebrow mb-3">Open calls and deadlines</h3><ul className="space-y-3">
          {preview.calls.map((c) => <li key={c.slug}><Link to="/opportunity/$slug" params={{ slug: c.slug }} className="nb-org-link nb-body font-medium">{c.title}</Link><p className="nb-small text-muted-foreground">Closes {friendlyDate(c.deadline_at!, opps.now)}</p></li>)}
        </ul></div>}
        {preview.events.length > 0 && <div className="mt-6"><h3 className="nb-eyebrow mb-3">Events worth going to</h3><ul className="space-y-3">
          {preview.events.map((e) => <li key={e.slug}><Link to="/event/$slug" params={{ slug: e.slug }} className="nb-org-link nb-body font-medium">{e.title}</Link><p className="nb-small text-muted-foreground">{dateLabel(e.starts_at!, e.timezone)}{e.city ? `, ${e.city}` : e.format === 'online' ? ', Online' : ''}</p></li>)}
        </ul></div>}
      </section>}
      <section aria-label="Sign up" className="nb-card mt-8 max-w-xl">
        <h2 className="nb-h3">Sign up</h2>
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
