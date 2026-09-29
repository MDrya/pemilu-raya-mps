# Database setup (Supabase)

| File | What it is |
|---|---|
| `migrations/20260929000000_init.sql` | Tables, row level security, RPC functions, Realtime. **Run once** on a fresh project. |
| `seed.sql` | Election, 3 candidate pairs, 3 booths, 400 fictional voters. Generated — edit `src/config/election.ts` and run `npm run seed:generate`. Re-running it wipes all election data. |
| `staff_roles.sql` | Links the two staff accounts to their roles. Run after creating the users. |

## Option A — Supabase dashboard (simplest)

1. Create a project at [supabase.com](https://supabase.com) (free tier; region *Southeast Asia (Singapore)* is closest).
2. **SQL Editor → New query**, paste all of `migrations/20260929000000_init.sql`, **Run**.
3. **SQL Editor → New query**, paste all of `seed.sql`, **Run**.
4. **Authentication → Users → Add user → Create new user**, tick **Auto Confirm User**:
   - `panitia@demo.local` + a password
   - `bilik@demo.local` + a password
5. **SQL Editor → New query**, paste `staff_roles.sql`, **Run**. The result should list both emails with their roles.
6. **Authentication → Sign In / Providers**: turn **off** “Allow new users to sign up”. (Unknown accounts get no role and can't do anything, but there's no reason to allow sign-ups.)
7. **Project Settings → API Keys**: copy the Project URL and the **anon / publishable** key into `.env.local`:
   ```
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon or publishable key>
   ```
   Never use the `service_role` / secret key in this app.

## Option B — Supabase CLI

```bash
npx supabase login
npx supabase init            # creates supabase/config.toml, keeps existing files
npx supabase link --project-ref <project-ref>
npx supabase db push --include-seed
```

Then do steps 4–7 above.

## Resetting

- During a demo: the **Reset Demo** button (`demo_reset()`) clears votes but keeps voters and candidates.
- Full reset (e.g. after editing candidate text): regenerate and re-run `seed.sql`. Staff accounts are kept.
