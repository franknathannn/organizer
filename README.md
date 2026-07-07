# Campus OS

A personal dashboard for college life: budget tracker, a four-lane to-do board,
a date planner that's wired into your budget, a deadline tracker that tells you
if you finished early or late, and a bonus goal-progress gauge.

Built with **Next.js 14 (App Router)**, **Supabase** (Postgres + Auth + Row-Level
Security), **TypeScript**, **Tailwind CSS**, and **Framer Motion**.

---

## 1. Set up Supabase (5 minutes)

1. Go to [supabase.com](https://supabase.com), create a free account, and create
   a new project.
2. Once it's ready, open **SQL Editor -> New query**, paste the entire contents
   of [`supabase/schema.sql`](./supabase/schema.sql), and run it. This creates:
   - `transactions` — your budget ledger (every peso in or out)
   - `todos` — the four-lane to-do board (urgent / will become urgent / not
     urgent / accomplished)
   - `planner_events` — calendar events, optionally linked to a transaction
   - `deadlines` — things to finish by a date
   - `goals` — the bonus progress-gauge tracker
   - Row-Level Security policies so only you can ever see your own rows
3. Go to **Settings -> API** and copy:
   - `Project URL`
   - `anon public` key
4. By default Supabase requires email confirmation for new sign-ups. For a
   personal single-user app you can turn this off under **Authentication ->
   Providers -> Email -> Confirm email** (toggle off) so you can start using
   the app immediately after signing up. Leave it on if you'd rather confirm
   by email.

## 2. Run it locally

```bash
npm install
cp .env.local.example .env.local
# paste your Project URL and anon key into .env.local
npm run dev
```

Open `http://localhost:3000`, sign up with an email + password, and you're in.

## 3. Deploy (Vercel is easiest, and free for this)

1. Push this folder to a GitHub repo.
2. Go to [vercel.com](https://vercel.com) -> **New Project** -> import the repo.
3. Add the two environment variables from `.env.local` in the Vercel project
   settings.
4. Deploy. You'll get a URL you can open from your phone or laptop, and your
   data will always be there since it's in Supabase, not your browser.

---

## How the features connect

- **Budget** is a plain ledger (`transactions`): every entry is a signed amount
  (positive = money in, negative = spent). Your balance is *always* computed
  by summing the ledger — never stored — so it can't drift out of sync.
- **To-dos** live in one table with an `urgency` enum. Moving a card to
  "Accomplished" is a single update; a database trigger automatically stamps
  `done_at` and flips `is_done`, so the checklist-with-date behavior works
  even if you script against the database directly. The "unchecked only"
  toggle just filters the accomplished lane out client-side.
- **Date planner** events optionally carry a `planned_spend`. If you set one,
  the app automatically writes a matching transaction into your budget ledger
  and links the two rows together (`planner_events.transaction_id`), so
  deleting the plan also removes the matching spend.
- **Deadlines** compare `due_date` to `completed_at` the moment you check one
  off, and show a toast + badge for how many days early or late you finished.
  This is in-app (toast + badge), not a push notification — see "Extending"
  below if you want real push notifications later.
- **Goals** (bonus) are just a `current_count` / `target_count` pair with a
  gauge that fills proportionally — bump it with the +/- buttons as you
  finish steps.

## Performance choices

- Data is fetched **server-side** (React Server Components) on first load —
  no client-side loading spinners for your initial data, and no API routes
  needed for reads.
- Mutations happen directly from the browser via the Supabase JS client, with
  the UI updating **optimistically** (instantly, before the network call
  returns) so it feels instant even on a slow connection.
- Fonts (Space Grotesk, Inter, JetBrains Mono) are loaded through
  `next/font`, which self-hosts them at build time — no runtime request to
  Google Fonts, no layout shift.
- Row-Level Security means every query is already scoped to you at the
  database level, so there's no per-request filtering logic to slow things
  down or get wrong.
- Indices are included in the schema on the columns you'll actually filter
  and sort by (dates, urgency, user id).

## Extending this later

- **Real push notifications** for deadlines (e.g. a phone notification the
  morning something's due) would need a service worker + the Web Push API,
  or a scheduled Supabase Edge Function emailing you — a good next step once
  the core app feels right.
- **Drag-and-drop** on the to-do board (instead of the "move to" dropdown) —
  `@dnd-kit/core` drops in cleanly on top of the existing column structure.
- **Recurring transactions** (e.g. a weekly allowance) — a small
  `recurring_transactions` table plus a scheduled Edge Function.
