# Optional Supabase cloud backup

The app works without Supabase. This setup is required for persistent cloud snapshots; it has not been run for a live project.

1. Create a Supabase project you control.
2. Open its SQL editor and run `supabase/schema.sql` once. This creates one backup row per authenticated user, enables Row Level Security, and grants only owner-scoped select/insert/update. Re-running the policy creation statements unchanged will report duplicate policies.
3. In Supabase Authentication, create your personal user with a confirmed email and password (or use the dashboard invitation/password setup flow). The app has sign-in only, not public sign-up or password-reset UI. Disable public signups if this is only your workspace.
4. Put the project HTTPS URL and **publishable key** (or legacy anon key) into `config.js`. These are public client values. Never use a secret/service_role key, database password or personal access token. The standard `*.supabase.co` hosted project URL is supported.
5. Push the change and deploy. In the website, open **Cloud backup**, sign in, and select **Save cloud backup** from the device with your current progress.
6. Sign in on another browser and **Restore cloud backup**. Export any existing local progress before replacing it.

The client uses Supabase's Auth password endpoint and PostgREST API over HTTPS. Session tokens stay in memory: refresh requires sign-in again. Expired sessions require re-authentication. No email or password is committed to the repo.

## Conflict handling

This is manual backup/restore, not realtime multi-device synchronization. A new browser INSERTs its first backup and cannot silently overwrite an existing one. Restore it first. Subsequent saves PATCH only the revision read by this browser; a stale save is rejected. Export local changes and reconcile them before restoring if another device has updated the cloud backup. No automatic merge or durable version history exists in the database. Keep occasional JSON exports.

## Verify before relying on it

- User A can save and restore their own row.
- User B cannot select or change User A's row, even by changing the user_id filter/body.
- Unauthenticated requests cannot read or write rows.
- A second device cannot overwrite an existing backup before restoring it.
- After both devices restore revision N, saving on one prevents a stale save on the other.
- Failed sign-in/network requests and cancelled restore leave local progress intact.
- An export from the original Site imports with its answers and notes preserved.

References: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [REST API](https://supabase.com/docs/guides/api), [Auth](https://supabase.com/docs/guides/auth).
