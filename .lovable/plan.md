# Organisation and event pages: action-first redesign

Rework both detail pages top to bottom so each section helps the visitor act. Site rules apply: two fonts, theme tokens, official logos only, hide empty sections, 44px tap targets, no horizontal scroll.

## Organisation page
1. Header: official logo in a 72px white rounded square (full colour, no coloured top border), name, one-line summary, facts row (type, city and country, founded, stage) and fields as chips. Buttons: Visit website (accent), Save, Share. On phones they move to a sticky bottom bar.
2. Open now: their open calls (future deadline or rolling) and upcoming events they run or join. Each row: date, countdown ("In 12 days"), Add to calendar. Signal badge under 14 days.
3. Connections: logo cards from real relations, grouped Invested in, Backed by, Spun out of, Partners. "Part of" has no relation type in the database yet, so it is left out rather than invented (it can be added later as a new relation type).
4. Close to them (replaces "Similar in the Nordics"): up to 6 organisations, ranked direct relation, then same field, then same city. Each card shows why: "Partner", "Same field: Medtech", "Also in Oulu".
5. Learn: 2 guides matching their journey steps.
6. Map removed. City in the facts with a small "Open in Google Maps" link.
7. Last line: "Last checked [date]. Something wrong? Suggest an edit."
Existing Watch, Research, Clinical trials, registry facts and Latest from them stay, placed after Connections.

## Event page
1. Header: date block (big day, month, weekday), title, countdown chip ("In 25 days", "Today", "This weekend"), organiser logo and name linking to their page, venue or "Online", type.
2. Buttons: Register (accent, new tab; "Event website" if no registration link; disabled "Registration closed" once the apply deadline or event start has passed), one Add to calendar button with Google, Apple and Outlook (.ics for the last two), Save, Share. Sticky bottom bar on phones.
3. Who it is for: journey-step sentences become short chips.
4. Map removed. Venue with "Open in Google Maps" (online events show "Online", no link).
5. Same week: compact list (date, title, type), within 3 days before or after, excluding this event.
6. Prepare: Learn guides, kept.
7. Last line as above.

## Save
Stores the item in the browser (works without an account, failures handled quietly). Button toggles Save / Saved. No saved-items page is added, since none was asked for.

## Checks
- Tests with concrete values: countdown labels incl. "This weekend", ±3 day window, registration-closed rule, "Close to them" ranking and reason chips, limit of 6.
- Browser check at 390px and 1440px on populated pages: sticky bar, calendar menu, Save persisting after reload, no overlap or sideways scroll.

## Technical details
- Rewrite VentureDetail.tsx sections; delete VenueMap.tsx and the leaflet dependency if unused elsewhere.
- Extend detail.server.ts: open calls (opportunity deadline >= now or null as rolling) and organiser/participant events; similar orgs with reason; same-week window change from 7 days to ±3 days.
- Pure helpers in detail.ts (countdownLabel, sameWeek, closeToThem, registrationClosed, outlook/ics links) with tests in detail.test.ts.
- Save helper in a small module using localStorage inside event handlers/useEffect only (no hydration mismatch).
- Google Maps link: https://www.google.com/maps/search/?api=1&query=<venue, city>.
- Update AGENTS.md (map removal rule) and mem://design/venture-details.md.
