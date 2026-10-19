# Learn: data model (proposal)

A proposal only. No database or screen changes until you approve it.

## Areas and journey steps: reuse the tag lists
Areas and journey steps become two new kinds in the existing tag lists, next to field, sub-area, country and stage. That gives them for free:
- Add, rename, reorder and delete in /admin/tags (two new sections).
- Journey step order is the existing sort order.
- Organisations, events and opportunities can carry several journey steps through their existing tag links (point 4 needs no new tables). Their admin edit pages get a "Journey steps" picker.

Seeded in your order:
- Areas: Understand the world; Find a real problem; Build something; Start a company; Fund it; Sell it; From research to company; Get involved without founding; Women's health.
- Journey steps: Curious; Idea; Problem; Validation; Building; Funding; First customers; Growth.

## Guides (existing table, new fields)
Already there: title, slug, status, summary, body, cover, reading_minutes, last_checked, source_url.
New:
- level: beginner or intermediate (default beginner).
- area: one area from the list.
- journey_step: one journey step from the list.
- one_sentence: the summary shown at the top.
- next_step: short text shown at the end.
- sources: a list of title and link pairs.
- reviewed_by: free text (for example "Dr. Anna Virtanen, GP").

## Glossary
New glossary table: term, slug, short definition (one or two sentences, required), explanation (optional, longer), status (draft, published, archived), last_checked, source_url, plus the usual dates.
- Related terms: a link between two glossary terms, shown both ways.
- Related guides: a link between a term and a guide.

## Access rules (same as everything else)
- Visitors read only published guides and terms.
- A related term or guide shows only when both sides are published.
- Only admins create, edit or delete.

## Decisions to confirm
1. A guide has one area and one journey step. Say if a guide should be allowed several.
2. Glossary terms can also take field and area tags. Say if you want none.
3. "Reviewed by" is free text, not a link to a person profile.

## Technical details
- Add `area` and `journey_step` to the `term_kind` enum; seed rows into `terms`.
- `guides`: add `level guide_level not null default 'beginner'` (new enum), `area_id` and `journey_step_id` (uuid, FK to terms, on delete set null), `one_sentence`, `next_step`, `reviewed_by` text, `sources jsonb not null default '[]'` (array of {title,url}). A validation trigger checks area_id/journey_step_id point to the right term kind and sources are well formed.
- New tables: `glossary_terms` (shared entry columns), `glossary_term_terms` (tags), `glossary_term_relations` (term_a, term_b, pair unique, shown in both directions), `glossary_term_guides`. Grants, RLS with `status='published'` / `has_role(...,'admin')`, `set_updated_at` and delete-cleanup triggers, slug and status indexes.
- Add `glossary_term` to `entry_kind`.
- Admin: add Guides and Glossary to the config-driven admin; add journey steps to the org/event/opportunity tag picker. Public Learn pages come in a later step.
