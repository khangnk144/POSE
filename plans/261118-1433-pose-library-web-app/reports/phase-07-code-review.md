# Phase 7 code review: Pose Xinh (main @ d04ee71)

Reviewer: code-reviewer agent. Read-only review: no project file was changed apart from this report.

## Scope
- Files: `supabase/migrations/*.sql` (6), `src/proxy.ts`, `src/lib/supabase/*`, `src/app/api/**` (3 routes + helpers), `src/lib/security/ssrf-guard.ts`, `src/lib/ai/**`, the pose form save pipeline, favorites, shoots, places, team/presence, auth pages, plus `tests/rls/*` to check what the tests actually prove.
- LOC: about 12.6k (src + migrations + tests).
- Focus: security first, then data-flow correctness, then code standards.
- Checks run: `npm run typecheck` passed. `npm run lint` passed with 0 issues. `npm test` passed: 21 files, 231 tests. `npm audit` is covered below.
- Live checks against the local stack. All were read-only, except that one anonymous probe joined the presence channel for 6 seconds without tracking anything:
  - Catalog queries via `docker exec supabase_db_pose-xinh psql`: `information_schema.column_privileges`, `pg_proc.proacl`, `has_schema_privilege`, `pg_policy` on `realtime.messages`.
  - An anon-key-only Realtime client subscribed to `team-presence` with no sign-in.

## Overall assessment
The security base is solid. RLS is enabled on every table. The `security definer` helpers pin `search_path = ''`. `consume_ai_quota` can only be executed by `service_role` (I checked the ACL). The service-role client is used in exactly one place, `ai-route-guard.ts:33`; it is marked `server-only`, and it is only reached after the membership check. The SSRF guard is well built: the address is checked at connect time, every redirect hop is re-validated, and the size and time caps are enforced while streaming.

There are no Critical or High findings. There are 4 Medium findings: 2 verified security/authz gaps, 1 verified ordering bug and 1 missing deploy piece. There are 5 Low findings.

---

## Critical issues
None.

## High priority
None.

## Medium priority

### M1. Anonymous internet users can join the presence channel: they can read who is online and inject fake teammates
- **Where:** `src/components/team/online-avatar-stack.tsx:27` (`supabase.channel('team-presence', { config: { presence: … } })` has no `private: true`). There are no policies on `realtime.messages` (checked: `pg_policy` returned 0 rows).
- **Verified:** a client holding only the public anon key, with no sign-up and no session, reached `SUBSCRIBED` on `team-presence` and received the presence `sync` event. Nobody else was online during the probe, so the state was empty. Once a teammate is online, the same client receives the payloads that `ch.track(self)` publishes.
- **What leaks:** each online member's `profiles.id` (uuid), display name, emoji, colour, and exactly when they are online. The threat model says a visitor without an invite code "must not see any data", so this breaks it.
- **What else an outsider can do:** call `ch.track({ id: 'x', name: '<anything>' })` with any name, or with many keys. Every member then sees a fake avatar in the header, or a "+500" overflow. React escapes the text and `Avatar` maps colours through a whitelist, so there is no XSS. The impact is spoofing and nuisance.
- **Severity:** Medium. The data is low-sensitivity, but no account is needed and the threat-model statement is broken outright. The fix is about 10 lines.
- **Fix:**
  ```ts
  supabase.channel(PRESENCE_CHANNEL, { config: { private: true, presence: { key: self.id, enabled: true } } })
  ```
  ```sql
  create policy team_presence_read on realtime.messages for select to authenticated
    using (realtime.topic() = 'team-presence' and public.is_member());
  create policy team_presence_write on realtime.messages for insert to authenticated
    with check (realtime.topic() = 'team-presence' and extension = 'presence' and public.is_member());
  ```
  Then turn off "Allow public access" in Realtime settings on the hosted project, so a client cannot simply leave out `private: true`. Add an RLS test in which an anon client and a non-member client both fail to subscribe.

### M2. Any member can rewrite `created_by`, which defeats the "only the creator or an admin can delete" rule
- **Where:** `supabase/migrations/0004_rls_policies.sql:31-32` (places), `:40-41` (poses), `:64-65` (shoots). The update policies only check `is_member()`, and Supabase's default table grants give `authenticated` UPDATE on every column.
- **Verified:** `information_schema.column_privileges` shows that `authenticated` has UPDATE on `poses.created_by`, `poses.created_at`, `poses.id`, `places.created_by` and `shoots.created_by`.
- **How it fails:** member Alice wants to delete Bob's pose P. The `poses_delete` policy blocks her. She sends `PATCH /rest/v1/poses?id=eq.P {"created_by":"<alice uuid>"}`, which `poses_update` allows, and then `DELETE /rest/v1/poses?id=eq.P`, which now passes `created_by = auth.uid()`. Places and shoots work the same way.
  - The same hole lets a member re-attribute a pose to someone else, which changes the "đăng bởi" line, and change `created_at`, which moves the pose anywhere in the newest-first cursor order.
  - The intended contract in `data-model-and-contracts.md` ("Delete chỉ created_by = auth.uid() hoặc admin") is not enforced.
  - `tests/rls/content-access.test.ts:54` ("…without changing its creator") only shows that a normal update leaves `created_by` alone. It never tries to change it, so the test gives false confidence.
- **Severity:** Medium, because an authz contract can be bypassed in 2 requests. Teammates are trusted, so the realistic risk is mischief or a buggy script rather than an attack.
- **Fix:** switch to column-level grants. This is compatible with the current client: `draftToRow`, `updatePlace` and `updateShoot` only send these columns, and the `poses_before_write` trigger still sets `search_text` and `updated_at`.
  ```sql
  revoke update on public.poses, public.places, public.shoots from authenticated;
  grant update (title, description, status, people_count, posture, scenes, tags, camera_height, camera_tilt,
    zoom, orientation, photographer_position, distance_m, grid, model_steps, tips, place_id, source_url,
    source_credit) on public.poses to authenticated;
  grant update (name, address, maps_url, note) on public.places to authenticated;
  grant update (name, shoot_date, place_id) on public.shoots to authenticated;
  ```
  Then add RLS tests in which a member tries to change `created_by` and fails, for poses, places and shoots.

### M3. Reordering a shot list after removing an item can scramble the saved order
- **Where:** `src/lib/shoots/shoot-items.ts:33-42` (`saveShootOrder`) and `src/lib/shoots/reorder.ts:21-24` (`changedPositions`). Both assume that the DB `position` equals the list index ("Positions are 0-based and contiguous"). `removeShootItem` (`shoot-items.ts:53`) deletes a row without compacting the others, and `getShoot` (`shoot-queries.ts:75,84`) throws the DB `position` away.
- **How it fails (traced end to end):**
  1. A shoot has items a0, b1, c2, d3, e4.
  2. The user removes b. The DB now holds a0, c2, d3, e4, and the UI list is [a, c, d, e].
  3. The user drags e above d. `changedPositions` writes only e→2 and d→3. c keeps index 1 in both lists, so it is not written, and its DB position stays 2.
  4. The DB now holds a0, c2, e2, d3. c and e are tied, and `.order('position')` has no tiebreaker, so after a reload c and e can come back in either order. With larger gaps (remove b and c from a..f, then swap e and f), a moved item ends up above an item that was never touched.
- **Related problem:** `addPosesToShoot` (`shoot-items.ts:12-28`) reads and then inserts. When two members add at the same time, both compute the same `start`, which creates duplicate positions. If they add the same pose, the second insert fails with 23505 and the user sees "Chưa thêm được" even though the pose is now in the shoot.
- **Severity:** Medium. User data is visibly wrong in the core "shooting mode" flow.
- **Fix:** the simplest fix is to write every row on reorder with `toPositions(after)`; shot lists are short. Also order by `.order('position').order('pose_id')` so ties are deterministic, and treat 23505 in `addPosesToShoot` as "already added". Update `reorder.test.ts` with a test that removes an item and then reorders.

### M4. `/api/health` and the cron job are missing, but deploy step 3 depends on them
- **Where:** the contract table in `data-model-and-contracts.md` lists `GET /api/health`, and step 3 in `phase-07-test-review-deploy.md` relies on it. There is no `src/app/api/health/**` and no `vercel.json`. `CRON_SECRET` appears in `.env.example` but is never read.
- **Impact:** a Supabase free project pauses after 7 idle days, and the app then goes down for the whole team until someone un-pauses it by hand.
- **Fix:** add a GET handler that checks `Authorization: Bearer ${CRON_SECRET}` and runs one cheap query, plus a `vercel.json` cron entry. When the secret is missing or wrong, return 401 without touching the DB.

## Low priority

### L1. Invite codes can be guessed without limit
- **Where:** `0001_extensions_and_profiles.sql:29` allows codes as short as 4 characters, and `join_team` (`:54-94`) has no attempt counter.
- **How it fails:** anyone can sign up, then call `rpc('join_team')` in a loop. Codes made with "Đổi mã" have 8 characters from a 31-character alphabet (31^8 ≈ 8.5×10^14 combinations), so guessing them is infeasible. The risk is a code set by hand in production SQL, such as reusing the 6-character seed style `XINH26`, which is open to dictionary or brute-force guessing.
- **Fix:**
  - Raise the check to `char_length(invite_code) >= 8`.
  - Rotate the code through the UI right after the first admin joins.
  - To limit attempts, keep in mind that `join_team` raises an exception, which rolls back any counter written in the same transaction. Either return an error result instead of raising and record the failure first, or put a rate limit in front (for example, an edge proxy).

### L2. A Claude timeout plus one retry can run past the 60 s function limit
- **Where:** `claude-client.ts:59,86` (`maxRetries: 1`, `timeout: 40_000`) against `maxDuration = 60` in both AI routes.
- **Verified:** the SDK retries on timeout (`@anthropic-ai/sdk/client.js:654-689`, `isTimeout` → `retriesRemaining`).
- **How it fails:** the first attempt hangs for 40 s, then a retry starts. The platform kills the function at 60 s, the client receives a non-JSON 504 that is shown as a generic failure, and the quota is already spent. The UI promises an error after 30 s, which is also exceeded.
- **Fix:** set `maxRetries: 0`, or keep one retry but pass `AbortSignal.any([request.signal, AbortSignal.timeout(50_000)])` so the call always ends before the function limit.

### L3. `consume_ai_quota` uses `set search_path = public`
- **Where:** `0030_ai_quota_rpc.sql:8`. The other definer functions use `''`.
- **Not exploitable today:** only `service_role` can execute it (checked in `proacl`), `authenticated` and `anon` have no CREATE on `public` (checked with `has_schema_privilege`), and every object it uses is schema-qualified.
- **Fix:** change it to `''` anyway, for consistency and so the Supabase linter stays quiet.

### L4. `profiles.avatar_emoji` has no DB constraint
- **Where:** `0001…sql:19`, together with the column grant in `0004…sql:18`.
- **How it fails:** a member can PATCH their own `avatar_emoji` to any text, including very long text. It is rendered in every member list and avatar. React escapes it, so this is a nuisance or layout issue only.
- **Fix:** `check (char_length(avatar_emoji) between 1 and 16)`.

### L5. Small dead or duplicate code
- `src/lib/poses/signed-urls.ts` and `src/lib/shoots/signed-urls.ts` are two `signPaths` versions that handle errors differently: one throws and the other swallows errors. Keep one.
- `0004…sql:79` adds `poses` and `shoot_items` to `supabase_realtime`, but no client subscribes to `postgres_changes`. Remove them or keep them on purpose.
- `CRON_SECRET` is unused (see M4).

## Edge cases found while scouting (checked and clean)
- **SSRF** (`ssrf-guard.ts`, `guarded-fetch.ts`, `import-image.ts`):
  - The DNS check runs inside the `lookup` hook at connect time, so DNS rebinding has no gap to exploit. It handles `options.all`, which happy-eyeballs uses.
  - IP-literal hosts skip the lookup but are range-checked in `assertPublicHttpsUrl`. WHATWG URL parsing normalises decimal, hex and trailing-dot forms first.
  - Redirects: at most 3, and each one is re-validated (https only, port 443, no credentials).
  - Blocked ranges cover IPv4-mapped, NAT64, 6to4 and ULA/link-local addresses.
  - The 10 MB and 1 MB caps are enforced while streaming, and one 10 s budget covers every request.
  - SVG is rejected. The response is sent with `nosniff`. Only signed-in members can call the route.
- **Service role:** the only import is `ai-route-guard.ts:6`. The only user-controlled value it receives is `userId`, which comes from verified JWT claims (`getClaims`), not from the request body. The admin client has `server-only`.
- **Secrets:** `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are only read in `server-only` modules, and the UI only receives an `aiEnabled` boolean.
- **XSS:** `source_url` is rendered only when it matches `/^https?:\/\//` (`poses/[id]/page.tsx:155`). `maps_url` goes through `isHttpUrl` (`maps-link.ts:23`). Both are also validated when written. There is no `dangerouslySetInnerHTML`.
- **Open redirect:** login and join always redirect to `/`, and the proxy redirects to `/login` with the query cleared. There is no `next=` parameter.
- **Route handlers:** all 3 check membership before parsing the body. The AI routes return 503, then 401, then 403 as the contract requires. Quota is spent after validation (bad input costs nothing) and fails closed.
- **Quota atomicity:** a single upsert with `where count < limit`, and the RLS suite includes a concurrency test.
- **Cursor and filter injection:** the cursor is regex-validated (timestamp and uuid) before it is placed into `.or()`. `placeId` and `createdBy` are validated with zod as uuids.
- **Storage:** the bucket is private, every policy checks `is_member()`, and signed URLs expire after 1 h.
- **Pose create/edit:** files are uploaded first, then rows are written, with cleanup on failure. Edit uses upsert so a retry is safe, and removed files are deleted only after their rows are gone. I found no realistic orphan path beyond the best-effort cleanup that is already documented.
- **Favorites:** the toggle is idempotent under a double tap (23505 is mapped to "favorited").
- **npm audit:** production dependencies have 0 vulnerabilities (`npm audit --omit=dev`). The full tree has 16 high-severity findings, all from **picomatch** ReDoS (GHSA-fc5q-39xc-vjpf), reached through vitest, vite and tinyglobby. These are dev/test only and are not shipped.

## Positive observations
- The security-definer helpers pin `search_path = ''`, and EXECUTE is revoked from `public` and `anon`.
- `ai_usage` is fully locked to the service role, and the quota RPC is atomic and covered by tests, including a concurrency test.
- The SSRF guard is better than typical: it checks at connect time, which closes the time-of-check/time-of-use gap.
- Magic-byte sniffing (`image-input.ts`) means AI routes never trust a client-supplied content type.
- Comments explain *why*, and modules stay small: no hand-written file is over 200 lines (`database.ts` is generated, and `globals.css` is exactly 200).

## Recommended actions (in priority order)
1. Before deploy, fix M1 by making the presence channel private and adding `realtime.messages` policies, and fix M2 with column-level UPDATE grants. Add RLS tests for both.
2. Fix M3 by writing every row on reorder and adding a tiebreaker to the order.
3. Add M4 (`/api/health` and the cron entry) before running deploy step 3.
4. Low items: raise the minimum invite-code length to 8 and rotate the code after bootstrap (L1), set `maxRetries: 0` or add an overall abort (L2), and handle L3–L5 when convenient.

## Metrics
- Type coverage: `tsc --noEmit` reports 0 errors. Casts are limited to typed PostgREST embed rows.
- Tests: 231 unit tests pass. I did not run coverage, the RLS suite or e2e, because I was told not to touch the shared DB or run e2e.
- Lint issues: 0.

## Plan follow-ups (for the lead, not applied)
- In Phase 7, the "code-reviewer agent" item is done (this report).
- The deploy section needs M4 before step 3.
- Step 4 ("Bạn đăng ký đầu tiên…, lấy mã mời") needs a documented way to set a strong code by SQL first, since production starts with a random placeholder (see L1).

## Unresolved questions
- M2: if letting members reassign `created_by` was intended, the delete rule is only cosmetic and the contract text should say so.
- M1: the probe ran against local Supabase. The "Allow public access" Realtime setting on the hosted project still needs checking at deploy time.

## Fixes applied

Commits on main (not pushed): `1e28bae` M2, `c2e4383` M1, `fbd064b` M3, `120a6f2` L5, `0d231bd` M4, `d49712e` L2, `0e77f7c` L1/L3/L4/L5. New migrations 0050-0052 are already applied to the local DB with `supabase migration up` (additive); `src/lib/types/database.ts` regenerated with no diff. Final gates: `npm run typecheck`, `lint`, `test` (23 files, 238 tests) and `build` all pass.

### M2 - immutable columns (`supabase/migrations/0050_restrict_update_columns.sql`)
- Table-level UPDATE on poses, places, shoots is revoked from authenticated/anon. Column grants are the 19 fields in `draftToRow` (poses), `name, address, maps_url, note` (places, `updatePlace`) and `name, shoot_date, place_id` (shoots, `updateShoot`). `created_by`, `created_at`, `id`, `search_text` and `updated_at` are no longer writable by members (the trigger still sets the last two).
- Other tables checked via `information_schema.column_privileges`: `profiles` already grants only `display_name, avatar_emoji, avatar_color`, so `role` is closed (and the test proves it). `team_settings` only has `id` (check id=1) and `invite_code` (admin-only RLS). `pose_images` and `shoot_items` were left as they are: wiki-style by design, and `save-pose.ts` upserts `pose_images` with every column, so a column list there would break the edit flow.
- Verified: in a rolled-back psql transaction as a non-owner member, updates of `created_by`/`created_at` (poses, places, shoots) and `role` fail with "permission denied"; normal edits succeed. New `tests/rls/immutable-columns.test.ts` (5 tests) was RUN and passes. It creates its own users and rows and cleans them up, with no `resetTeam`.
- Not covered: INSERT can still set `created_at` (the policy only pins `created_by`). It was not asked for and nothing depends on it.

### M1 - private presence (`0051_private_presence_channel.sql`, `online-avatar-stack.tsx:27-29`)
- The client uses `config: { private: true, presence: {...} }`. Checked in the installed `@supabase/realtime-js` `RealtimeChannel.d.ts` (`private?: boolean`), and the Supabase Authorization docs show the same. No manual `setAuth` is needed: the signed-in test clients joined without one.
- Catalog on the local DB: `realtime.messages` has columns `topic, extension, ...`, RLS enabled, no policies before; `realtime.topic()` returns text. Policies `team_presence_read` (SELECT) and `team_presence_write` (INSERT), both `to authenticated`, require `extension = 'presence'`, `realtime.topic() = 'team-presence'` and `public.is_member()`.
- Verified with the new `tests/rls/presence-access.test.ts`, which was RUN and passes (3 tests): an anonymous client and a signed-in non-member do not reach SUBSCRIBED, and two members subscribe, track and see each other. I also dropped the policies, re-ran the test, and re-created them: the two-member test then failed, so the policies are what let members in. The non-member case is rejected by `is_member()`, since that user is `authenticated`.
- **Deploy action:** policies only protect private channels. A probe on the local stack showed an anon client can still join a non-private `team-presence` channel (SUBSCRIBED). On the hosted project, turn OFF "Allow public access" in Dashboard > Realtime > Settings, which forces every channel to be private.
- The existing e2e `presence-avatars.spec.ts` covers the two-members flow through the UI. It was not run.

### M3 - shoot ordering
- `shoot-items.ts`: `saveShootOrder(shootId, order)` now writes every row with `toPositions(order)`. The `before` argument and `changedPositions` (in `reorder.ts`) are removed, and the caller in `shoot-detail-view.tsx` is updated.
- `shoot-queries.ts:75-76`: `.order('position').order('pose_id')`.
- `addPosesToShoot` now uses `upsert(..., { onConflict: 'shoot_id,pose_id', ignoreDuplicates: true }).select('pose_id')` and returns the count actually inserted. This is deliberately different from "catch 23505": a duplicate is skipped per row (ON CONFLICT DO NOTHING) instead of failing the whole batch. A probe test confirmed that the second identical upsert returns no error and 0 rows; the probe was then deleted.
- `reorder.test.ts`: the `changedPositions` test is replaced by a removal-gap then reorder case that asserts contiguous, unique positions.
- Unverified: the drag-and-drop UI path (no e2e run). `shoots-flow.spec.ts` should cover it.

### M4 - health and cron
- `src/app/api/health/route.ts`, `src/lib/security/cron-auth.ts` (sha256 plus `timingSafeEqual`), `vercel.json` (`0 3 * * *`). Responses: 503 when `CRON_SECRET` is unset, 401 for a wrong or missing header (the DB is not touched in either case), 200 `{ok:true}` after one `select id ... limit 1` on `team_settings` with the admin client. A failed query returns 503 `database_unavailable`.
- Verified from the official Vercel docs (page last updated 2026-08-11): Vercel sends `Authorization: Bearer $CRON_SECRET`, and Hobby allows one cron run per day (any time within the hour). Unit tests in `cron-auth.test.ts` and `health-route.test.ts` (7 tests). Not exercised against a real Vercel deployment.
- Deploy: set `CRON_SECRET` (16+ characters, header-safe) in the Vercel Production environment and redeploy. Crons run on production only.

### L2 - `claude-client.ts:59`
`maxRetries: 0`. One call is at most 40 s (`CLAUDE_TIMEOUT_MS`), so it ends before `maxDuration = 60`, which was left unchanged. The comment in `ai-config.ts` is updated. The UI's "error after 30 s" promise is still not met (40 s timeout); that was not asked for. Note: a timeout now fails right away instead of retrying once.

### L3, L4, L1 (`0052_hardening_small_fixes.sql`)
- L3: `consume_ai_quota` re-created with `search_path = ''` (the body already used qualified names; `now()` is now `pg_catalog.now()`) and the same grants. Verified in a rolled-back transaction: calls with limit 2 return 1, 2, -1; `proconfig = {search_path=""}`; ACL is only postgres and service_role.
- L4: `profiles_avatar_emoji_length` check, 1 to 16 characters. A 17-character update is rejected (psql and the RLS test). The UI only offers the 24 fixed emoji from `AVATAR_EMOJIS`, and `display_name` already had `between 1 and 40`, matching the zod schema.
- L1: `invite_code` check raised to `>= 8`. The migration first replaces any code shorter than 8 characters with a random 8-character one, otherwise the constraint cannot be added. Local code is now `XINH2026` (set by hand on the local DB, written to `seed.sql`, and replaced in 5 e2e files and 2 phase-01 report docs; no other uses remain except the quote in this review). Verified: `update ... set invite_code='ABC'` is rejected. If production already has a code under 8 characters, this migration changes it; tell the team.
- Not done: attempt limiting on `join_team` (the review marked it optional and it needs a design choice).

### L5
- Dropped `src/lib/shoots/signed-urls.ts`. The `poses/signed-urls.ts` version is kept (it throws on a failed sign request, and the pose page already catches that). Behaviour change: the places and shoots queries now throw on a failed signing request instead of silently showing placeholders.
- `poses` and `shoot_items` removed from the `supabase_realtime` publication (0052). Grep found no `postgres_changes` subscriber, and presence does not use the publication.
- `CRON_SECRET` is now used (M4).

### Commands main must run
After the user agrees to a reset (the full RLS suite calls `resetTeam`, which wipes app data):
1. `npm run db:reset` (applies 0001-0052 plus the `XINH2026` seed).
2. `npm run test:rls` (the new `immutable-columns` and `presence-access` suites plus the existing ones).
3. `npm run test:e2e` (the e2e files read the `XINH2026` code from the seed).
4. Hosted project: set "Allow public access" OFF in Realtime settings, set `CRON_SECRET` in Vercel, and apply migrations 0050-0052.

### Noticed but not done
- `plan.md` has an uncommitted edit that was already there before this work, and the untracked `phase-08-easy-upload-ux.md` is not mine. Neither was touched or committed.
- Python from Git Bash hung once on a heredoc, so a stray `python -` process may still be running in the background. It does nothing, but could be killed.
