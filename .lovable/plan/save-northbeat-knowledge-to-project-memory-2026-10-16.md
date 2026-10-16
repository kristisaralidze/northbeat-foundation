# Save Northbeat knowledge to project memory

Store the uploaded brief so every future message follows it. Nothing gets built.

## What gets saved
- **Core rules (applied every time):** Nordic healthtech hub (Finland first); scope rule; visitors + two founder admins, no public accounts in v1; berry accent on cream/snow with ink text, editorial serif + clean sans; 8px corners, hairlines, heartbeat pulse motif; never generic hero/emoji/stock/lorem; English only; mobile-first and accessible.
- **Detailed memory files:**
  - Product and scope: promise, audience, what belongs and what does not.
  - Users and roles: visitor vs admin abilities.
  - Data model: entry types, organisation types, shared tags, status/source/last_checked/slug, linking.
  - Design system: feeling, colours, type, layout, motif, motion, the "never" list.
  - Tech rules: Lovable Cloud, public reads only published rows, admin-only writes.

## Not changing
- No pages, design, database or code changes.

## Technical details
- Write `mem://project/product`, `mem://features/roles`, `mem://features/data-model`, `mem://design/system`, `mem://constraint/tech` and update `mem://index.md` Core + Memories (keep existing Northbeat lines; the "no UI until database planned" rule stays).
