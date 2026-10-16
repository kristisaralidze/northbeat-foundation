# Northbeat database schema (proposal)

A proposal only. No code or database changes until you approve it.

## Your choices built into it
- Tags (field, sub-area, country, stage) come from lists the admins manage. Each sub-area sits under one field.
- An entry can have several values for each tag.
- Visitors can submit four kinds of form: suggest a new entry, correct an entry, send a general message, or pitch a podcast guest.
- Newsletter sign-ups are stored in Northbeat, with the date of consent and whether the person has unsubscribed.

## Enums
```text
entry_status        draft | published | archived
organisation_type   startup | investor | incubator | accelerator | funder |
                    research_group | lab | hospital_innovation_unit | service_provider
opportunity_type    programme_intake | grant_call | competition | job
term_kind           field | sub_area | country | stage
event_format        in_person | online | hybrid
submission_type     new_entry | correction | contact | podcast_guest
submission_status   new | in_review | accepted | rejected | done
entry_kind          organisation | person | event | opportunity | episode | newsletter_issue | guide
app_role            admin
```

## Shared columns on every entry table
`id uuid`, `slug text unique`, `status entry_status default 'draft'`, `source_url text`, `last_checked date`, `published_at`, `created_at`, `updated_at`, `created_by` (an admin).

## Entry tables
- **organisations**: name, type (organisation_type), short_description, description, website, logo_url, city, founded_year, linkedin_url. Investor details (optional): ticket_min_eur, ticket_max_eur.
- **people**: full_name, headline, bio, photo_url, linkedin_url, is_clinical_advisor, is_validation_partner, expertise_note.
- **events**: title, summary, description, starts_at, ends_at, timezone, format, venue, city, registration_url, price_note.
- **opportunities**: title, type (opportunity_type), summary, description, opens_at, deadline_at, amount_min_eur, amount_max_eur, apply_url. Job details (optional): location, employment_type, remote_ok.
- **episodes**: title, episode_number, season, summary, show_notes, audio_url, embed_url, duration_seconds, published_on, cover_url.
- **newsletter_issues**: title, issue_number, summary, body, sent_on, web_url.
- **guides**: title, summary, body (rich text / markdown), cover_url, reading_minutes.

## Tags
- **terms**: id, kind (term_kind), name, slug, parent_id (a sub-area points to its field), sort_order. The name must be unique within each kind.
- A tag table for each entry type, so every link is checked by the database:
  `organisation_terms`, `person_terms`, `event_terms`, `opportunity_terms`, `episode_terms`, `newsletter_issue_terms`, `guide_terms`. Each row is (entry_id, term_id), and that pair is its primary key.

## Many-to-many links
```text
organisation_people         org_id, person_id, role text (founder, CEO, partner, advisor...),
                            is_current bool, started_on, ended_on
organisation_events         org_id, event_id, role (host | organiser | sponsor | partner)
organisation_opportunities  org_id, opportunity_id, role (provider | funder | employer | partner)
organisation_episodes       org_id, episode_id, role text (featured | sponsor)
person_events               person_id, event_id, role (speaker | moderator | organiser)
person_opportunities        person_id, opportunity_id, role text (contact | mentor)
person_episodes             person_id, episode_id, role (host | guest)
event_opportunities         event_id, opportunity_id  (e.g. pitch competition at an event)
guide_links                 guide_id, entry_kind, entry_id, sort_order  (entries a guide mentions)
newsletter_issue_links      issue_id, entry_kind, entry_id, sort_order  (entries an issue features)
```
Every link row is removed automatically when either side is deleted. Each pair can appear only once per role.

## Visitor forms and the newsletter
- **submissions**: type, status (default new), name, email, organisation_name, entry_kind (optional), entry_id (the entry being corrected, optional), proposed_url, message, payload jsonb (extra fields per form), consent_at, created_at, reviewed_by, reviewed_at, admin_note.
- **newsletter_subscribers**: email (stored as typed, but no two can match ignoring capitals), consent_at, source, confirmed_at, unsubscribed_at, unsubscribe_token.

## Admins
- **user_roles**: (user_id, role). Roles live only here, never on the user record.
- The `has_role(uid, 'admin')` check is used in every policy. The two founders are added by hand after they sign up.

## Row-level security
| Table group | Public (anon) | Admin |
|---|---|---|
| Entry tables | read rows where status = 'published' | full read and write |
| terms | read all | full |
| Tag and link tables | read only when every linked entry is published | full |
| submissions | insert only, status forced to 'new', no read | read, update, delete |
| newsletter_subscribers | no direct access; sign-up and unsubscribe go through server code with checks | read, update |
| user_roles | none | read own role |

Each table gets explicit grants so the app can reach it.

## Storage
- One public `media` bucket for logos, photos and covers. Anyone can read it; only admins can upload or delete.

## Extras
- `updated_at` is kept current automatically.
- Indexes on slug, status, starts_at, deadline_at, and the term_id and entry ids in every link table.
- Name and summary columns can be searched for later full-text search.

## Open points (your call when you approve)
1. Should organisation people roles be a fixed list or free text? Proposed: free text.
2. Is double opt-in for the newsletter (a confirmation email) wanted now or later? Proposed: later, but the field is already there.
