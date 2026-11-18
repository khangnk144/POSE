# Phase 1 report: Foundation

**Status: DONE_WITH_CONCERNS / partially BLOCKED.** All code is written. Build, lint, typecheck and unit tests pass. Everything that needs a running Postgres (`supabase db reset`, RLS tests, signup e2e with the shell screenshot) was NOT run, because the Docker daemon is not running.

## Blocker (exact)
```
> npx supabase start
{"_tag":"Error","error":{"code":"DockerLifecycleInspectError","message":"failed to inspect container health: failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine; check if the path is correct and if the daemon is running: open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified."}}
```
`docker info` shows the client (29.3.1) but `Server:` fails with the same pipe error. Per brief I did not start Docker Desktop or work around it. Unblock: start Docker Desktop, then run the "Finish verification" commands below.

## Test results
| Check | Result |
|---|---|
| `npm run build` (Next 16.4.6 Turbopack) | PASS, 12 routes, `ƒ Proxy (Middleware)` listed |
| `npm run lint` | PASS (no output) |
| `npm run typecheck` | PASS |
| `npm test` (vitest unit: filters-url round-trip, zod schemas) | PASS, 2 files, 19 tests |
| `supabase db reset` | NOT RUN (Docker) |
| `npm run test:rls` | NOT RUN (Docker). Tests are written: tests/rls/team-access.test.ts, content-access.test.ts |
| Playwright signup e2e + `phase-01-shell.png` | NOT RUN (Docker). Spec written: tests/e2e/shell.spec.ts |
| Visual check without DB | `/login` and `/join` rendered at 390x844 in Chromium, HTTP 200: reports/phase-01-visual-login.png, phase-01-visual-join.png (tokens, Quicksand + Be Vietnam Pro with Vietnamese diacritics look right). The app shell itself (needs a session) was not seen. |

### Finish verification (run in this order)
```
npm run db:start          # first run pulls images
npm run db:status         # copy ANON_KEY and SERVICE_ROLE_KEY into .env.local
npm run db:reset          # applies 0001-0005 + seed.sql (local invite code XINH26)
npm run db:types          # replaces the hand-written src/lib/types/database.ts
npm run test:rls
npm run test:e2e          # writes reports/phase-01-shell.png
```
Expect possible first-run fixes in the SQL, since it has never been executed (unverified, see below).

## What is covered by the RLS tests (written, unrun)
Non-member and anon read 0 poses; non-member cannot insert; member A cannot delete member B's pose (0 rows, row still exists); any member can update; creator and admin can delete; cannot forge `created_by`; wrong invite code rejected (`invalid_invite_code`), no profile created; first joined user is admin, second is member; case-insensitive code; double join rejected (`already_member`); non-admin reads 0 rows of `team_settings` and cannot update it; member cannot change own role; favorites private per user + `pose_favorite_counts` visible to members only; places/shoots delete rule; `ai_usage` invisible; bucket `pose-images` private, member can upload/sign, outsider cannot; `search_text` is lowercase and accent-free (checks that `đ` becomes `d`).

## Files created (all under d:\POSE)
- Config: `package.json` (scripts: dev, build, start, lint, typecheck, test, test:unit, test:rls, test:e2e, db:start, db:stop, db:status, db:reset, db:types), `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.mts`, `vitest.rls.config.mts`, `playwright.config.ts`, `.gitignore`, `.env.example`, `.env.local` (gitignored)
- DB: `supabase/config.toml` (project_id `pose-xinh`, analytics off), `supabase/migrations/0001..0005_*.sql`, `supabase/seed.sql`
- Types/schemas: `src/lib/types/{pose,pose-labels,database}.ts`, `src/lib/schemas/{pose-draft-schema,pose-filters-schema}.ts`, `src/lib/poses/filters-url.ts`, `src/lib/utils/cn.ts`
- Supabase: `src/lib/supabase/{browser-client,server-client,admin-client,session}.ts`, `src/proxy.ts`
- UI primitives (`src/components/ui/`): button, icon-button, chip (CameraChip + FilterChip), bottom-sheet, input, textarea, segmented-select, toast, skeleton, empty-state, avatar, logo, feature-locked-hint
- Shell: `src/components/shell/{app-shell,avatar-menu,bottom-tab-bar,add-fab}.tsx` (header lives inside app-shell.tsx), auth: `src/components/auth/{login-form,join-form}.tsx`
- Pages: `src/app/layout.tsx`, `globals.css`, `(auth)/layout`, `(auth)/login`, `(auth)/join`, `(app)/layout.tsx`, placeholder pages (title only) for `/`, `poses/new`, `poses/[id]`, `poses/[id]/edit`, `suggest`, `shoots`, `shoots/[id]`, `places`, `places/[id]`, `team`, `profile`
- Contract stubs: `src/lib/ai/autofill-client.ts`, `src/components/place/place-picker.tsx`, `src/lib/poses/favorites.ts`, `src/lib/shoots/shoot-items.ts` (all `throw new Error('not implemented')`)
- Real implementation: `src/lib/ai/ai-availability.ts` (`isAiConfigured()`, `server-only`), `src/components/ui/feature-locked-hint.tsx` (exact copy from the brief, `.env.local` has `ANTHROPIC_API_KEY=` empty)
- Tests: `src/lib/poses/filters-url.test.ts`, `src/lib/schemas/pose-schemas.test.ts`, `tests/rls/{helpers,team-access.test,content-access.test}.ts`, `tests/e2e/shell.spec.ts`
- Progress log: `reports/phase-01-progress.md`

## Deviations from the contracts doc (with reason)
1. **`src/lib/types/database.ts` is hand-written**, not generated: the CLI needs a running DB. Same shape as generated output (incl. relationships so embedded selects type-check). Run `npm run db:types` to replace it.
2. **`PoseDraft` is camelCase** (`cameraHeight`, `photographerPosition`, ...) with optional fields absent rather than null; DB rows are snake_case. No mapper exists yet; phase 3/4/6 should add one in their own folders (or ask me).
3. **`PoseCardData.modelStepsPreview` is `string[]`** (max 2 steps); contract only gave the name.
4. **`requestAutofill(images: AutofillImage[])`** with `AutofillImage = { imageId: string } | { file: Blob }` (in `lib/types/pose.ts`). Contract left `images` untyped. `toggleFavorite` returns `Promise<boolean>` (new state); `addPosesToShoot` returns `Promise<number>` (rows added).
5. **Added `/profile` placeholder page** (design's avatar menu has "Hồ sơ"; folder structure lacked it). Menu links: Yêu thích -> `/?fav=1`, Nháp -> `/?status=draft`, Team -> `/team`, Hồ sơ -> `/profile`.
6. **`src/lib/poses/filters-url.ts` created by phase 1** (needed for the round-trip test) though `lib/poses/` belongs to phase 2. Exports `parseFilters`, `serializeFilters`, `countActiveFilters`. URL keys: `q, people, posture, scenes, height, tilt, zoom, orientation` (comma lists), `place, by, fav=1, status`.
7. **`pose_images` delete policy follows the parent pose's creator-or-admin rule** (the contract says delete = creator or admin, and `pose_images` has no `created_by`). Consequence for phase 3: a member editing someone else's pose cannot remove that pose's image rows (insert/update are allowed). If wiki-style image removal is wanted, relax this policy; I did not decide that silently. Storage object delete is member-level.
8. **Realtime publication** now includes `poses` and `shoot_items` (migration 0004) for the "new poses" pill and shoot sync.
9. **Env var name** stays `NEXT_PUBLIC_SUPABASE_ANON_KEY` as briefed (Supabase docs now call it a "publishable key"; legacy anon key still works locally).
10. **Template tweaks**: removed `cacheComponents` and `partialPrefetching` from the generated `next.config.ts` (they force Suspense around all cookie access; not in the plan). `@types/node` bumped to ^24 because vitest 5.1.1 peer requires `^22 || >=24`.
11. Local invite code: migration inserts a random code; `seed.sql` sets `XINH26` for local dev only. Production: set it with SQL (`update team_settings set invite_code = '...'`). No rate limit on `join_team` code guessing (out of scope, flag for phase 7).

## What later phases must know
- **Supabase clients**: browser `createSupabaseBrowserClient()`; server `await createSupabaseServerClient()` (user session, RLS applies); admin `createSupabaseAdminClient()` (service role, bypasses RLS, `server-only`, check membership first).
- **Session helpers** (`src/lib/supabase/session.ts`, server-only): `getCurrentUserId()`, `getCurrentProfile()`, `requireMember()` (redirects to /login or /join). Route handlers should return 401 themselves (the proxy only redirects pages, not `/api/*`). Auth uses `supabase.auth.getClaims()` (per Supabase docs), not `getSession()`.
- **Next 16**: file is `src/proxy.ts` exporting `proxy` (middleware is deprecated); `params`/`searchParams` are Promises.
- **Signed URLs**: bucket `pose-images` is private. Use `supabase.storage.from('pose-images').createSignedUrl(path, seconds)` or `createSignedUrls(paths, seconds)` with the server client (member session is enough). Paths: `poses/{pose_id}/{image_id}-{full|thumb}.webp`; allowed MIME webp/jpeg/png, max 5 MB per file.
- **RPC**: `join_team(invite_code, display_name)` returns the `profiles` row; error messages: `invalid_invite_code`, `invalid_display_name`, `already_member`, `not_authenticated`.
- **Views/tables**: `pose_favorite_counts(pose_id, favorite_count)`; `created_by` and `favorites.user_id` default to `auth.uid()` (insert policy requires it to equal the caller). `ai_usage` has no user policies: write it only through the admin client. `poses.updated_at` and `search_text` are maintained by trigger (do not send them).
- **How tests create users**: `tests/rls/helpers.ts` -> `createTestUser(label)`, `createMember(label, name)` (real `join_team` call, first member = admin), `admin` (service role), `anon()`, `resetTeam()`. Needs `.env.local` keys. Run from cwd `D:\POSE`.
- **UI**: tokens are Tailwind classes (`bg-surface`, `text-text-2`, `border-border-strong`, `bg-primary text-on-primary`, `rounded-lg`, `shadow-fab`, `font-display`, `bg-avatar-1..8`). `useToast()` returns `showToast(message, { kind?: 'error', action? })`. `Button` variants: primary, secondary, text, danger, ai (+ `loading`, `loadingLabel`). `FeatureLockedHint` goes under disabled AI buttons; pass `aiEnabled` from a server component using `isAiConfigured()`.
- **Shell**: tab bar and FAB are hidden on `/poses/new` and `/poses/[id]/edit` (regexes in `app-shell.tsx`); pages must not render their own header. `BottomSheet` is vaul-based.
- Dark mode: tokens defined under `[data-theme="dark"]`, no toggle yet.

## Unverified items
- All SQL migrations (never executed). Specific risks: `immutable_unaccent` with the `extensions` schema, `create policy` on `storage.objects` from a migration, `alter publication supabase_realtime`, `unaccent` mapping `đ` to `d`.
- `getClaims()` return shape was taken from Supabase docs and compiled against the installed types, not executed against a real server.
- vaul `Drawer` behaviour (focus trap, drag) not exercised in a browser. App shell visuals not seen. Playwright selectors assume the labels in the components.
- Non-Windows platforms: install hit corrupted native packages (`@next/swc-win32-x64-msvc`, rolldown binding) from killed installs; fixed by `npm ci`. A clean `npm ci` works now; if vitest says "Cannot find native binding" again, rerun `npm ci`.
- First vitest runs showed a transient `Cannot read properties of undefined (reading 'config')`; after `npm ci` and running from `D:\POSE` it was stable across 3 runs. Cause not isolated.

## Noticed but not done
- `AGENTS.md` (from create-next-app) is at the repo root; I left it.
- No `/api/health` route (listed in contracts, no phase-1 task); the `CRON_SECRET` env is reserved.
- Nothing committed (git init only); `package-lock.json` is untracked and should be committed with the code.

**Status:** DONE_WITH_CONCERNS (BLOCKED on Docker for DB-dependent acceptance items)
