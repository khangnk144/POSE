# Phase 2 report: Library, filters, pose detail, favorites (agent A)

**Status: DONE_WITH_CONCERNS.** Typecheck, lint, unit tests and build pass. E2E spec is written but NOT run (shared DB rule). UI was verified by hand against the shared local Supabase with Playwright scripts on port 3001.

## Results
| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm test` | PASS, 5 files, 71 tests (query builder, search normalisation, cursor, grid text, relative time, plus phase-1 tests) |
| `npm run build` | PASS, 12 routes |
| `grep "not implemented"` in owned files | none left |
| Manual run (dev :3001, 30 seeded poses as agent-a@test.local) | pagination 24 then 27 total (3 drafts hidden); search `ngoi sofa` -> 4 (all "Ngồi sofa" titles); filter waist+stand -> 5 (matches seed math); favorite survives reload; `?fav=1` -> 1; `?status=draft` -> 3; long-press selects (no navigation); grid overlay + subject marker; delete (confirm -> "Đã xoá dáng" -> gone); random uuid -> "Dáng này không còn nữa" |
| `explain analyze`, 2033 poses (inserted inside BEGIN/ROLLBACK, rollback verified 0 rows left) | page 1 with image embed 0.42 ms, keyset page 2 0.33 ms, search `ngoi sofa` 0.13 ms, filters 0.8 ms, rare-term search 3.2 ms. Target was < 300 ms (DB side only; HTTP round-trip not measured) |
| Playwright `tests/e2e/library-browse.spec.ts` | NOT RUN (resets/mutates shared data); only typechecked and linted |

Screenshots (390x844, @2x) in this folder: `phase-02-library.png`, `phase-02-detail.png`, `phase-02-detail-grid.png`, `phase-02-detail-scrolled.png`, `phase-02-filter-sheet.png`.

## Files
- Pages: `src/app/(app)/page.tsx` (server, first page from searchParams; also serves `?fav=1` and `?status=draft`), `src/app/(app)/poses/[id]/page.tsx`.
- `src/components/pose/`: `pose-card`, `pose-card-grid` (stubs replaced, same exports/props, `PoseCardGrid` got an optional `selection` prop), `pose-heart-button`, `pose-infinite-grid`, `library-toolbar`, `pose-filter-sheet`, `pose-filter-groups`, `add-to-shoot-sheet`, `pose-image-carousel`, `pose-spec-card`, `pose-step-list`, `pose-detail-actions`.
- `src/lib/poses/`: `pose-query-builder` (filters -> plain condition list + keyset cursor + select string), `pose-card-query` (`getPoseCardsByIds`, `listPoseCards` signatures kept; added `countPoses`), `favorites` (`toggleFavorite`), `signed-urls` (batch `createSignedUrls`, 1 h), `search-normalize`, `grid-position`, `relative-time`, `use-library-filters`; tests: `pose-query-builder.test`, `search-normalize.test`, `pose-detail-helpers.test`.
- `tests/e2e/library-browse.spec.ts` (filter, accent-free search, paging, favorite reload, detail, drafts; each pose title carries a per-run token so it is exact on a shared DB).
- `/favorites` and `/drafts` routes were NOT created: the avatar menu links to `/?fav=1` and `/?status=draft`, so the library page handles them (matches the existing shell).

## Decisions / deviations
1. Query builder is data-first (`buildPoseConditions` returns conditions, `applyPoseConditions` applies them) so every filter is unit-testable without mocking supabase-js. One documented cast inside `applyPoseConditions`; the card select string is dynamic so its row type is hand-written in `pose-card-query.ts`.
2. Favorites flag: `fav:favorites(user_id)` embed; RLS only exposes the caller's rows, so no user id filter. `favoritesOnly` switches the embed to `!inner`.
3. Multi-word search = one `ilike` per accent-free word on `search_text` (order independent). `%` `_` `\` escaped. Scenes filter = array overlap (any), other lists = `IN`.
4. Cursor = url-safe base64 of `created_at|id`, validated on decode (timestamp + uuid regex) before being placed in the `.or()` expression.
5. Page size 24 (phase file), search debounce 250 ms (phase file; design.md says 300/20, phase file wins).
6. `<img>` instead of `next/image` for private signed thumbnails (eslint-disable with reason); no `next.config` remotePatterns needed.
7. Filter sheet: applies on "Xem N dáng" with live count (`countPoses`), draft view `status=draft` is kept when resetting and not counted in the badge. Places and people (`createdBy`) are fed from `places`/`profiles` when the sheet opens. "Xem thêm" for >10 scenes not built (12 fixed scenes shown).
8. Shoot picker: contracts only define `addPosesToShoot(shootId, ids)`, so `add-to-shoot-sheet.tsx` lists the 30 latest shoots and can insert a new shoot (name only) directly into `shoots`. Until agent D implements `addPosesToShoot` it throws and the sheet shows an error toast (verified). Agent D may want to replace this sheet with a richer picker.
9. Delete: confirm sheet, row delete then best-effort storage cleanup. "Hoàn tác 5 s" from design.md NOT built (hard delete). Delete menu item only for creator/admin; failure toast otherwise.
10. Detail bottom bar uses z-45 to sit above the FAB (shell is read-only).

## Not built (design.md items outside the phase list or needing shared data)
Realtime "Có N dáng mới" pill, pull-to-refresh, offline banner, search bar collapse on scroll, poster avatar on the card (`PoseCardData` has no author field), double-tap to like, pinch zoom, undo after delete, "Xem thêm" in scenes.

## Requested shared changes
- `src/components/shell/app-shell.tsx`: hide `AddFab` on `/poses/[id]` (regex `^/poses/[^/]+$`); the 56 px FAB peeks above the detail action bar (visible in `phase-02-detail*.png`).
- `PoseCardData` could carry `author` (emoji, colour) if the card avatar is wanted.

## Unverified
- Long-press on a real touch device (verified with mouse press in Chromium with `hasTouch`; iOS callout suppression relies on `-webkit-touch-callout`).
- Browser behaviour of vaul sheets on iOS; drag-to-dismiss untested.
- HTTP latency for 2,000 poses (only DB time measured; the Next dev server was slow under shared load, 7-30 s on cold routes).
- `tests/e2e/library-browse.spec.ts` has never executed.
- Perf seed data was synthetic and correlated (e.g. waist+sit returned 0 rows in the SQL test); index use for `scenes`/`posture` filters on large data was not exercised beyond seq scan at 2k rows (fine at this size).

## Test data left behind
Local DB: user `agent-a@test.local` (profile "Agent A"), 29 poses tagged `agent-a` with 1-2 PNG images each in storage, 1 favorite, 2 shoots named "Test buổi" (created by my manual add-to-shoot test; the add itself failed because `addPosesToShoot` is still a stub). Safe to delete.

**Status:** DONE_WITH_CONCERNS
**Summary:** Library (masonry, infinite scroll, search, filter sheet, URL sync), PoseCard with optimistic hearts and long-press multi-select, pose detail with embla carousel, 3x3 grid overlay, spec/step/tips, delete, plus favorites/drafts views via the existing menu links.
**Concerns/Blockers:** E2E spec unrun; `addPosesToShoot` depends on agent D; shell FAB overlaps detail bar (shared change requested); a few design extras deferred (listed above).
