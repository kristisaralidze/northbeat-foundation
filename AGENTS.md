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
- ListFilterSelect shares controlled Radix filters across Events and Opportunities using existing menu tokens; derived lists and rows are memoized. Why: consistent keyboard/mobile menus and no repeated filtering on unrelated UI changes.
- Systole uses a portalled Radix dialog with local styles and browser-only query-link opening; its existing waitlist server function is unchanged. Why: accessible focus containment and a sheet unaffected by page-motion transforms.
- Home uses native scrolling with no Lenis/GSAP; public pages use keyed PublicScrollFrame (the only Lenis/GSAP owner). Why: one scroll owner and no pinning on home.
- Public-page motion (page transitions, word reveals, staggered section/card reveals, image parallax) lives in src/components/site/motion.tsx using framer-motion, driven by enhancePageMotion inside PublicScrollFrame; all of it self-gates on prefers-reduced-motion and never touches the home route. Why: one motion entry point, no per-page wiring.
- Fabric is the static still image in every placement (Learn circle, footer band; the home hero is plain paper); no shader or animation. Why: the WebGL silk was explicitly removed.
- Official covers require provenance and approval. Admin canvas checks store resolved logos and tone; shared tiles and heartbeat use fitted images or names. Imports stay admin-only and quota-bounded. Why: reliable identity without per-view analysis.
- Relationship maps use published links, network tokens and measured node lines; timelines use tested date helpers and URL filters. Why: preserve real connections across screen sizes.
- The home ecosystem uses one visibility-paused 2D canvas with pure tested living-cells geometry, Query-backed published organisation data and real organisation_relations; editorial group links are separate from individual relationships. Why: animate the founder's cell model without inventing connections or adding scroll owners/libraries.
- The home Heartbeat section follows the wordmark hero, draws one 2D canvas from pure, tested line maths in heartbeat.ts and reads scroll position itself inside a sticky section. Why: one shared line function for flight and flat views.
- LaboratoryWordmark uses local assets and measured serif fallbacks in public headers. Why: readable if images fail.
- Mobile filters reuse FilterSheet with existing URL state. Why: accessible controls without divergent browsing logic.
- Use publicTitle for title punctuation and publicCopy for broad health-startup prose; preserve stored values, type names and URLs. Why: copy reviews never mutate editorial data.
- Events use a paginated public read and URL-backed browsing state; past is a date-based view of published entries, not an entry status mutation. Why: past events remain publicly readable and linked while upcoming lists stay current.
- Database: every entry table shares slug/status/source_url/last_checked; public reads only `status = 'published'`, writes need `has_role(auth.uid(),'admin')`. Why: one consistent publish workflow and RLS model.
- Tags use one `terms` table plus a `<entry>_terms` link table per entry type. Why: real foreign keys instead of polymorphic tags.
- Visitors read contact emails only via `public_organisations()` / `public_people()` RPCs; anon has no column grant on `contact_email`. Why: email shown only when `contact_email_public` is true.
- Newsletter sign-up/unsubscribe must go through server functions using the admin client; visitors have no direct table access. Why: protect subscriber emails.
- Media bucket `media` (private) holds only public assets: anyone may download logo/photo/cover files, only admins write or list; private files go to admin-only `admin-files`. Why: workspace policy.
- Admin auth: sign-up is restricted by `admin_allowlist` via triggers on auth.users, which also grant the admin role. `/admin` layout gates itself client-side (ssr:false) and redirects to `/admin/login` (`admin_.login.tsx`). Why: only founders get accounts; no public sign-up.
- Admin CRUD is config-driven. CSV imports use shared validation and admin-authenticated per-row transactions. Why: consistent forms and no partial imports.
- Public site theme is scoped to `.theme-site` (tokens + `nb-*` utilities in src/styles.css); `__root.tsx` wraps public paths in `SiteLayout` except the standalone /directions comparison. Why: admin stays plain and design experiments do not alter the existing public shell.
- Design comparisons share one presentation-only content set with published profile slugs and scope their palette, type and material styles to each direction in global CSS. Why: identical content makes the visual comparison fair without changing editorial data.
- Explore loads a paginated, safe-column published-only directory through a public server function and Query; filters (incl. ecosystem group slugs shared with living-cells links) and sort live in validated URL search and counts exclude their own facet. Why: shareable views, consistent counts, and no draft exposure or row-limit truncation.
- Explore uses compact rows; other lists share EntryCard/CardGrid; site search and the Saved page read one published-only search index server function; saved items and recent searches live in browser storage via lib/saved.ts and lib/search.ts. Why: one card style, live dates on saved items and no accounts.
- Detail routes use Query-backed public readers, masking contact RPCs and published recommendations with tested date rules; venture pages have no embedded maps (Google Maps links only), action bars sticky on phones and browser-only Save. Why: useful actions without private data leaks or heavy map code.
- Areas and journey steps are `terms` kinds; guides point to one of each via FK (trigger checks kind), other entries tag them through `<entry>_terms`; `EntityConfig.tagKinds` picks which lists each admin form shows. Why: one tag system for the journey map.
- Public Learn pages read through one public server-function module (learn.functions.ts) with pure, tested helpers in learn.ts; journey step selection lives in the URL. Why: shareable step views and published-only reads in one place.
- Guide hub picks use organisation/opportunity FK links with a shared three-pick trigger; no automatic guide picks. Why: editorial control and published-only reads.
- Link preview images render at /api/public/og/$kind/$slug with pure-JS pureimage/pngjs (no wasm or native code) from published rows and official logos only. Why: the server runtime cannot compile wasm from bytes or load native image libraries.
- Public pages read site_settings, founders and terms only via public_site_settings()/public_founders()/public_terms(); signup tables are visitor insert-only, admin-managed. Why: no direct table access to emails.
- Editorial restyle (square plum-slide buttons, hairline inputs, text chips, rule-top cards, cursor previews) is scoped to .nb-public-page plus footer/dialog forms in src/styles.css. Why: public pages get the editorial system while home and admin stay untouched.
