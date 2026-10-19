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
- Home owns one Lenis/GSAP story; other public pages use keyed PublicScrollFrame. Both clean up on navigation and reduced motion. Why: avoid duplicate tickers.
- AtmosphericImage uses responsive pointers and the docking timeline. Why: no extra scroll controller.
- OrganisationLogo reuses the published directory query. Why: consistent logos without editorial mutations.
- Relationship maps use published links, network tokens and measured node lines; timelines use tested date helpers and URL filters. Why: preserve real connections across screen sizes.
- The home ecosystem groups the paginated published reader into fixed group anchors and one cloud dot per entry; group links use Explore's canonical type search and separate conceptual edges. Why: group browsing stays distinct from individual database relationships.
- The home globe uses local R3F geometry, a still, fixed canvas measurement and wrapper transforms; scroll events drive framing/zoom with endpoint snaps, touch pointers pinch, and OrbitControls recovers rotation after dragging. Why: scroll stays uncaptured and fast jumps settle correctly.
- LaboratoryWordmark uses local assets, measured serif fallbacks and compact mode for every public header/footer. Why: one readable logo, even if images fail.
- Mobile filters reuse FilterSheet with existing URL state. Why: accessible controls without divergent browsing logic.
- Use publicTitle for title punctuation and publicCopy for broad health-startup prose; preserve stored values, type names and URLs. Why: copy reviews never mutate editorial data.
- Events use a paginated public read and URL-backed browsing state; past is a date-based view of published entries, not an entry status mutation. Why: past events remain publicly readable and linked while upcoming lists stay current.
- Database: every entry table shares slug/status/source_url/last_checked; public reads only `status = 'published'`, writes need `has_role(auth.uid(),'admin')`. Why: one consistent publish workflow and RLS model.
- Tags use one `terms` table plus a `<entry>_terms` link table per entry type. Why: real foreign keys instead of polymorphic tags.
- Visitors read contact emails only via `public_organisations()` / `public_people()` RPCs; anon has no column grant on `contact_email`. Why: email shown only when `contact_email_public` is true.
- Newsletter sign-up/unsubscribe must go through server functions using the admin client; visitors have no direct table access. Why: protect subscriber emails.
- Media bucket `media` is private (workspace blocks public buckets) but readable by anyone through storage policies; use signed or authenticated download URLs. Why: workspace policy.
- Admin auth: sign-up is restricted by `admin_allowlist` via triggers on auth.users, which also grant the admin role. `/admin` layout gates itself client-side (ssr:false) and redirects to `/admin/login` (`admin_.login.tsx`). Why: only founders get accounts; no public sign-up.
- Admin CRUD is config-driven: `src/lib/admin/entities.ts` defines fields, tag table and link tables per entity; `EntityList`/`EntityEdit` render any entity. Saves replace all tag/link rows for the entry. Why: one pattern for every entry type.
- Public site theme is scoped to `.theme-site` (tokens + `nb-*` utilities in src/styles.css); `__root.tsx` wraps public paths in `SiteLayout` except the standalone /directions comparison. Why: admin stays plain and design experiments do not alter the existing public shell.
- Design comparisons share one presentation-only content set with published profile slugs and scope their palette, type and material styles to each direction in global CSS. Why: identical content makes the visual comparison fair without changing editorial data.
- Explore loads a paginated, safe-column published-only directory through a public server function and Query; filters live in validated URL search and counts exclude their own facet. Why: shareable views, consistent counts, and no draft exposure or row-limit truncation.
- Public entry detail routes share a profile renderer and Query-backed public loader; organisation/person contact reads use masking RPCs, and related entries are independently checked for publication. Why: reciprocal links remain navigable without leaking drafts or private contact data.
- Areas and journey steps are `terms` kinds; guides point to one of each via FK (trigger checks kind), other entries tag them through `<entry>_terms`; `EntityConfig.tagKinds` picks which lists each admin form shows. Why: one tag system for the journey map.
- Public Learn pages read through one public server-function module (learn.functions.ts) with pure, tested helpers in learn.ts; journey step selection lives in the URL. Why: shareable step views and published-only reads in one place.
- Guide hub lists use a cross-type shortlist ranked by journey step and then shared guide fields; guide event reads include past published events while the journey map keeps its upcoming view. Why: bounded relevant recommendations without editorial mutations.
