<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Database: every entry table shares slug/status/source_url/last_checked; public reads only `status = 'published'`, writes need `has_role(auth.uid(),'admin')`. Why: one consistent publish workflow and RLS model.
- Tags use one `terms` table plus a `<entry>_terms` link table per entry type. Why: real foreign keys instead of polymorphic tags.
- Visitors read contact emails only via `public_organisations()` / `public_people()` RPCs; anon has no column grant on `contact_email`. Why: email shown only when `contact_email_public` is true.
- Newsletter sign-up/unsubscribe must go through server functions using the admin client; visitors have no direct table access. Why: protect subscriber emails.
- Media bucket `media` is private (workspace blocks public buckets) but readable by anyone through storage policies; use signed or authenticated download URLs. Why: workspace policy.
- Admin auth: sign-up is restricted by `admin_allowlist` via triggers on auth.users, which also grant the admin role. `/admin` layout gates itself client-side (ssr:false) and redirects to `/admin/login` (`admin_.login.tsx`). Why: only founders get accounts; no public sign-up.
- Admin CRUD is config-driven: `src/lib/admin/entities.ts` defines fields, tag table and link tables per entity; `EntityList`/`EntityEdit` render any entity. Saves replace all tag/link rows for the entry. Why: one pattern for every entry type.
- Public site theme is scoped to `.theme-site` (tokens + `nb-*` utilities in src/styles.css); `__root.tsx` wraps every non-/admin, non-/reset-password path in `SiteLayout`. Why: admin keeps the plain default look without a separate route tree.
