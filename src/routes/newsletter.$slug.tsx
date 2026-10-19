import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { issueQuery } from "@/lib/newsletter.query";
import { entryPath, issueLabel } from "@/lib/newsletter";

export const Route = createFileRoute("/newsletter/$slug")({
  loader: async ({ context, params }) => {
    const issue = await context.queryClient.ensureQueryData(issueQuery(params.slug));
    if (!issue) throw notFound();
    return issue;
  },
  head: ({ loaderData, params }) => ({
    meta: [
      { title: loaderData ? `${loaderData.title} — Northbeat newsletter` : "Newsletter issue — Northbeat" },
      { name: "description", content: loaderData?.summary ?? "A past issue of the Northbeat newsletter on Nordic health innovation." },
      { property: "og:title", content: loaderData?.title ?? "Newsletter issue — Northbeat" },
      { property: "og:description", content: loaderData?.summary ?? "A past issue of the Northbeat newsletter on Nordic health innovation." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      ...(loaderData ? [] : [{ name: "robots", content: "noindex" }]),
    ],
  }),
  errorComponent: ({ error }) => (
    <div role="alert" className="nb-page">
      <h1 className="nb-h1">This page didn't load</h1>
      <p className="nb-lead">{error instanceof Error ? error.message : String(error)}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="nb-page">
      <h1 className="nb-h1">Issue not found</h1>
      <p className="nb-lead">This issue isn't published (yet).</p>
      <Link to="/newsletter" className="nb-btn nb-btn-secondary">Back to the newsletter</Link>
    </div>
  ),
  component: IssuePage,
});

function IssuePage() {
  const { slug } = Route.useParams();
  const { data: issue } = useSuspenseQuery(issueQuery(slug));
  if (!issue) return null;
  const links = issue.links.filter((link) => entryPath(link.kind) !== null);
  return (
    <article className="nb-page">
      <header className="nb-page-header">
        <p className="nb-eyebrow">{issueLabel(issue)}{issue.sent_on ? ` · Sent ${issue.sent_on}` : ""}</p>
        <h1 className="nb-h1">{issue.title}</h1>
        {issue.summary ? <p className="nb-lead">{issue.summary}</p> : null}
      </header>
      {issue.body ? (
        <div className="nb-body max-w-2xl space-y-4">
          {issue.body.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
      ) : null}
      {issue.web_url ? (
        <p className="mt-6"><a href={issue.web_url} target="_blank" rel="noreferrer" className="nb-link">Read this issue in your email app</a></p>
      ) : null}
      {links.length ? (
        <section aria-label="Mentioned in this issue" className="mt-10">
          <h2 className="nb-h2">Mentioned in this issue</h2>
          <ul className="nb-card-grid">
            {links.map((link) => {
              const base = entryPath(link.kind);
              if (!base) return null;
              return (
                <li key={link.id}>
                  <Link to={`${base}/$slug` as never} params={{ slug: link.slug } as never} className="nb-card nb-card-link block h-full">
                    <p className="nb-eyebrow">{link.kind.replace("_", " ")}</p>
                    <h3 className="nb-h3">{link.title}</h3>
                    {link.summary ? <p className="nb-small text-muted-foreground">{link.summary}</p> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      <p className="mt-10"><Link to="/newsletter" className="nb-link">← All issues</Link></p>
    </article>
  );
}
