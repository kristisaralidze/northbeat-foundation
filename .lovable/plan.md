# Organisation and event detail redesign

The cover safety work is in place. All 82 candidates remain pending and none are public. There are 52 rejected entries, including the quarantined 4MindHealth listing. Website health checked 120 organisations and flagged 61 for review.

## Organisation pages
- Keep the approval-only cover and illustrated specimen fallback.
- Arrange type, location, founding year, stages and fields in an open facts strip.
- Add “Useful if you are…” using the existing journey steps, without inventing claims about services.
- Keep clickable published relationships and group upcoming organiser events and provider opportunities with date-based countdowns.
- Add up to four same-field companies, nearest country/city first.
- End with Visit website, Get the newsletter and Suggest an edit.

## Event pages
- Add a large day/month tile, title and date-based countdown alongside the approved cover or specimen fallback.
- Place Register, calendar download, Google Calendar and Share directly beneath it.
- Add journey-step context, compact facts, linked organiser cards, same-week events/deadlines and up to two matching Learn guides.
- Show a light map only for physical venues that have a reliable location; hide maps for online events or unknown venues.

## Presentation and verification
- Preserve the current fonts, colours and object wordmark.
- Hide empty sections and keep phone layouts in one column.
- Verify populated organisation and event pages, calendar exports, share controls and phone-sized layouts.
- Test countdown dates, seven-day matching and recommendation limits with concrete values.

## Technical details
- Extend the published-only profile reader with bounded recommendation queries and plain return values.
- Keep pending URLs and review flags out of public responses.
- Lazy-load the map after hydration; do not import browser-only map code into the server rendering graph.
- Use the existing relationship, date and design-system helpers wherever possible.