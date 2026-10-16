# Northbeat — empty project setup

Set up the project as "Northbeat" without building any pages or UI.

## What changes
- Name the project Northbeat in the browser tab title and share previews (replacing the default "Lovable App" text).
- Keep the start page as the blank placeholder, with no new pages, layouts or styling.
- Save a project note that UI work waits until the knowledge file and database plan are ready.

## What does not change
- No pages, components, design or backend yet.
- Lovable Cloud stays off until we plan the database together.

## Technical details
- `src/routes/__root.tsx`: set title, description, og:title and og:description to Northbeat; remove the Lovable author/twitter site tags.
- `src/routes/index.tsx`: leave it as is.
- Project memory: record "Project name: Northbeat; no UI until database is planned."
