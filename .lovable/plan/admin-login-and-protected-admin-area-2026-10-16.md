# Admin login and protected admin area

## What you get
- **/admin/login**: a simple page with email and password. It has two tabs, "Sign in" and "Create admin account". No other page links to it.
- **Allowed emails only**: only kristisaralidze@gmail.com can create an account for now. Anyone else sees: "Sorry, admin accounts are invite-only." The second founder's email can be added later in one step, without changing code.
- **Automatic admin role**: when an allowed email signs up, it gets the admin role straight away.
- **Email confirmation stays on**: after signing up you get a confirmation email. Click the link, then sign in.
- **/admin area**:
  - If you are not signed in, you go to /admin/login.
  - If you are signed in but not an admin, you see "No access" and a sign-out button.
  - Admins see a plain sidebar: Organisations, People, Events, Opportunities, Episodes, Newsletter, Submissions, Tags. Each section opens an empty page for now. There is also a sign-out button.
- **Forgot password**: a link on the sign-in tab, plus a page for setting a new password.
- No public pages and no brand design. The home page stays blank.

## Technical details
- Turn on email/password sign-in. Leave email confirmation on.
- Migration:
  - `admin_allowlist(email text primary key)`, with RLS on and no grants for anon or authenticated. Seed it with kristisaralidze@gmail.com.
  - A `BEFORE INSERT` trigger on `auth.users` calls `public.handle_admin_signup()` (security definer). If the email is not in the allowlist (ignoring capitals), it raises `not_allowed`.
  - An `AFTER INSERT` trigger inserts `(id, 'admin')` into `user_roles`.
  - Execute is revoked from public, anon and authenticated.
- Routes:
  - `src/routes/admin.login.tsx` (public, `ssr: false`). Sign-in uses `signInWithPassword`. Sign-up uses `signUp` with `emailRedirectTo` set to `/admin`, and maps the trigger error to the friendly message.
  - `src/routes/reset-password.tsx` for setting a new password.
  - Admin pages live under the managed `_authenticated` gate, which redirects to `/auth`. To meet "redirect to /admin/login", add `src/routes/auth.tsx`, which immediately redirects to `/admin/login`.
  - `src/routes/_authenticated/admin.tsx` is the layout. It checks `has_role(uid,'admin')` and shows "No access" if the check fails. Otherwise it shows the shadcn sidebar around `<Outlet />`.
  - Child pages: `admin.index.tsx`, `admin.organisations.tsx`, `admin.people.tsx`, `admin.events.tsx`, `admin.opportunities.tsx`, `admin.episodes.tsx`, `admin.newsletter.tsx`, `admin.submissions.tsx`, `admin.tags.tsx`. Each is a heading only. All admin routes are noindex.
  - One `onAuthStateChange` listener in `__root.tsx`.
- Adding the second founder later: `insert into admin_allowlist values ('their@email')`.
- Test: a small check that a non-allowlisted email is rejected and an allowlisted one gets the admin role.
