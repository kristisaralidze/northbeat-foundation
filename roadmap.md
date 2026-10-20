# Organisation cover images
- [ ] Add editable cover image upload and automatic website-image discovery on new website saves.
- [ ] Fetch missing covers for existing organisations; show credited profile banners and Explore strips with failure hiding.
- [ ] Test discovery and replacement/removal rules and verify admin/public views.

# Admin CSV import
- [ ] Import batch-four opportunity drafts, existing tags/provider links and Next call TBA notes; update Eir deadline and Terkko website, report duplicates.
- [ ] Import batch-three events as drafts checked today; match existing tags/organisers, skip duplicate titles and report results without application changes.
- [ ] Reconcile batch-two sub-area links against the source CSV.
- [x] Insert all 42 batch-two rows as organisation drafts checked 2026-10-20, with 138 existing-tag links; no duplicates or unknown tags.
- [x] Insert attached batch as drafts checked today, skip existing names/websites and unknown tags; add HealthCap and Sandwater investment links to CurifyLabs and report results.
- [x] Add mapped CSV previews, unknown-tag create/skip choices and organisation matching to the three admin lists.
- [x] Import only drafts checked today, skip duplicates, preserve eligibility and return added/skipped/errors.
- [x] Test rules and verify authenticated upload, preview, import and readback; remove temporary verification data.

# Living fabric
- [x] Make Learn/footer silk fill the centre with stronger layered folds sweeping every 3 to 5 seconds; add frosted signup glass and soft footer edge.
- [x] Verify device-resolution rendering up to 2x, 60 fps scheduling, visibility pauses and unchanged still-image fallbacks.
- [x] Remove the animated WebGL silk from Learn and the footer and restore the static fabric image, without the frosted glass panel; keep the footer edge fade.

# Footer and Happening now
- [x] Redesign footer as a full-width fabric signup band and plain copyright/link bar, without a wordmark; keep signup hidden on Newsletter.
- [x] Show full Happening now cards, remove excess bottom space and verify a clean fast-scroll transition into Learn on desktop and phone.

# Public detail and copy fixes
- [x] Correct detail sticky titles, decorative wordmark alt text, solid covering mobile menu and mobile T fallback.
- [x] Hide journey tags outside Learn; use compact facts and one main detail column without timezone; website domain link text.
- [x] Relationship map requires 3 connections with visible lines below facts; fewer connections use lists.
- [x] Group undated opportunities at the end as Rolling and open now, with timing labels from existing application notes.
- [x] Separate guide metadata; cap hub recommendations at 5, journey step first then field.
- [x] Update Podcast intro/empty state/guest link and About title; review broad-use startup wording.
- [x] Verify detail views, mobile menu, opportunity groups, recommendations and copy with tests and Chrome/Safari.

# Organisation logos
- [x] Add shared uploaded-first domain logos and error fallbacks across public organisation listings; test and verify.
- [x] Configure the supplied Brandfetch public client ID and verify light monogram fallbacks on Explore and profiles, including image failures before hydration.
- [x] Update Brandfetch client ID including its trailing hyphen and check Explore and organisation profiles.
- [ ] Load automatic logos (blocked: Brandfetch redirects image requests to its documentation instead of returning images; monogram tiles verified).

# Atmospheric image
- [x] Transfer Concept B fabric waves as desktop/phone WebP assets under 300 KB (24 KB and 7 KB).
- [x] Add only to home arrival, home signup and Learn intro circle; check contrast and reduced motion.

# Home transition safeguards
- [x] Replace globe buttons and wheel zoom with reversible scroll zoom, touch pinch and eased rotation recovery; verify interactions (touch pinch simulated).
- [x] Keep globe rendering dimensions stable and remeasure/recentre on entry and resize.
- [x] Synchronise scrolling and snap globe, ecosystem and wordmark endpoints after fast scrolls.
- [x] Verify repeated fast scrolling, scrollbar jumps, resize and reduced motion.

# Public scroll foundation and browsing
- [x] Site-wide object wordmark, no pulse logos or decorative eyebrows, sentence-case field labels, shared container padding and no section dividers.
- [x] Newsletter single signup and published-only issue section; phone Events filter sheet; Explore field/stage-only tags; modest organisation monogram.
- [x] Extend smooth scrolling and reversible compact intro bars to public pages without changing content or data.
- [x] Remove public section dividers and use spacing and soft surfaces; respect reduced motion.
- [x] Explore: sticky title/search/count, reachable filters, desktop sticky panel, group dots and sub-300ms rearrangement.
- [x] Organisation profiles: compact identity bar and real linked relationship map, hidden when empty.
- [x] Learn journey: eight scroll-lit steps and sticky current-step indicator; guides: reading progress and sticky one-sentence summary; glossary: sticky active-letter index.
- [x] Keep Podcast, Newsletter, Submit and About limited to the shared intro pattern.
- [x] Events and opportunities: scroll-fill timelines, sticky month, Today marker, 14-day closing labels and quieter Earlier items.
- [x] Test date rules and verify populated public browsing, navigation and reduced motion across screen sizes.

# Home and site-shell refinements
- [x] Redesign header actions and mobile menu placement; remove footer pulse and newsletter eyebrow.
- [x] Reveal the large intro immediately at docking and reduce home gaps.
- [x] Improve network label readability, globe caption and city glow dots.
- [x] Verify desktop, tablet, phone, reversible scrolling and reduced motion.

# Home scroll story
- [x] Pin the network for two screen-heights with reversible 0-40% dots, 40-80% connections and 80-100% labels.
- [x] Shrink the network into the rising globe, scrub scale and Nordic orientation, briefly pin the settled globe and preserve controls.
- [x] Add real nearest-first Happening now horizontal scroll, a short Learn teaser and the existing newsletter signup.
- [x] Add a full-screen opening, reversible wordmark docking and sequential introduction/action reveal.
- [x] Verify the opening, dock, reversal, reduced motion and navigation on desktop and phones.
- [x] Add home-only smooth scrolling and one coordinated scroll-linked sequence with soft background shifts and no section dividers.
- [x] Verify reduced motion, globe scrolling and cleanup when leaving home.

# Home globe and grouped ecosystem
- [x] Add the Design Lab Nordic globe with page colours, touch rotation, bounded zoom, click-gated wheel and a still fallback.
- [x] Replace entry nodes with eleven labelled ecosystem groups, published-entry dot clouds and the requested group connections.
- [x] Verify group links, label bounds, globe interaction and reduced motion on desktop and phones; Chromium and WebKit render the scene.

# Home ecosystem network
- [x] Adapt the Design Lab network using all published organisations, events and opportunities with real relationships.
- [x] Add bounded labels, full legend, scroll animation, touch selection and reduced-motion support.
- [x] Test publication and connection rules and verify populated desktop and phone interactions.

# Home wordmark
- [x] Transfer the Design Lab wordmark and show it full width at the top of the home page, with serif fallbacks for missing images.
- [x] Verify the wordmark and missing-image fallback on desktop and phone screens.

# Design directions
- [x] Build /directions with three isolated visual treatments and the same supplied content.
- [x] Verify all three treatments, real entry links, and phone layouts without changing existing pages or data.

# Explore directory
- [x] Update guide hub lists to match journey steps alone, include published events, and verify with real entries.
- [x] Review public copy against the voice rules, remove dash punctuation, and verify page titles and text without changing layout or data.
- [x] Load all published organisations and shared tags from the database.
- [x] Build searchable cards and counted, URL-backed filters.
- [x] Test filtering and verify URL restoration, clearing, and mobile filters in the preview. Populated cards await published entries; all 15 current organisations are drafts.

# Public profiles
- [x] Build organisation and person profiles with privacy-safe published data and related links.
- [x] Add detail pages for linked events, opportunities, and episodes; connect Explore cards.
- [x] Test visibility and contact privacy, and verify populated profiles end-to-end on desktop and mobile using temporary entries; remove verification data afterward.

# Events
- [x] Build published event data, date classification and 14-day deadline strip.
- [x] Add URL-backed type/city/month filters, list/calendar views and a past-event archive.
- [x] Test date boundaries in multiple timezones and verify populated browsing on desktop and mobile; remove test entries.

# Opportunities
- [x] Build /opportunities: type/field/stage filters, nearest-deadline sort, open/closed toggle, amount and job chips.
- [x] Test sorting, filters, archive and deadline labels; verify in preview with temporary entries and remove them.

# Podcast
- [x] Build /podcast episode grid with covers, guests, topics and duration; add video embed, key takeaways and show notes to episode pages.
- [x] Test labels and ordering; verify grid, embed, guest links and reciprocal person link in preview with temporary entries and remove them.