# Phase 5 report: places, shoots, team, presence (agent D)

Branch `feat/shoots-places-team` (worktree `D:\POSE-worktrees\shoots-places-team`). Status: DONE_WITH_CONCERNS (e2e specs written, not run per brief; presence and the main flows were checked by hand against the shared local stack, see below).

## Test results (run in the worktree)
| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (no output) |
| `npm test` | PASS, 8 files, 43 tests (new: reorder, maps-link, place-search, format-date, presence, invite-code) |
| `npm run build` | PASS, routes /places, /places/[id], /shoots, /shoots/[id], /team, /profile listed |
| `not implemented` in files I own | none (grep exit 1) |
| Playwright e2e / RLS tests | NOT RUN (brief forbids). Specs written: `tests/e2e/places-crud.spec.ts`, `shoots-flow.spec.ts`, `presence-avatars.spec.ts` (+ `shoots-helpers.ts`) |

Manual verification against the shared Supabase stack, dev server on :3004 (stopped), via a throwaway Playwright script at 390x844:
- Created a place, 3 poses with images (service role), a shoot (name, date, place picked in the nested picker sheet) through the UI; list/detail render, done tick persists, shooting mode opens on the first undone pose, Escape closes it.
- Presence: second browser context joined; A saw B's avatar after 261 ms and 537 ms (two runs), avatar cleared in A within 10 s after B's page closed. (Needed `OnlineAvatarStack` mounted; I mounted it temporarily on the team page for the test and removed it.)
- A member (not admin) sees no invite code on /team (`invite-code` count 0). The admin view of the invite panel was NOT seen (agent-d was a member, the admin is another user).
- No browser console errors/warnings on /shoots, /places, /team, /profile.
- Test data cleaned up: my poses, place, shoot, storage objects and the users agent-d / agent-d2 were deleted.

Screenshots (390x844 @2x, in this folder): `phase-05-places-list.png`, `phase-05-shoot-detail.png`, `phase-05-team.png` (the two small avatars at the top are the temporary mount), plus `phase-05-shooting-mode.png`, `phase-05-place-picker.png`. The "1 Issue" badge in them is the Next dev overlay (no console errors found; not from this phase as far as I can tell, unverified).

## What was built
- **Places** `/places`, `/places/[id]`: list A-Z with cover (newest published pose that has an image), pose count, address, Google Maps button; create/edit sheet, delete (button only for creator/admin; RLS also enforces, and a 0-row delete is reported as an error). Detail = place header + actions + `PlacePoseGrid` (first page from `listPoseCards`, "Xem thêm" loads more in the browser, error boundary around `PoseCardGrid`).
- **PlacePicker** (replaces stub, same name/props): search saved places (accent-insensitive), quick create (name, address, Maps link), clear button.
- **Shoots** `/shoots`, `/shoots/[id]`: list with progress bar; create/edit sheet (name, date, place); detail with dnd-kit sortable (drag handle, keyboard sensor), done checkbox, remove item, delete shoot (creator/admin), full-screen **shooting mode** (embla swipe, photo, camera height/zoom/photographer position, first 3 steps, mark done, Screen Wake Lock re-requested on visibility change).
- `addPosesToShoot(shootId, poseIds): Promise<number>` implemented (skips poses already present, appends after max position). Extra export `AddToShootSheet` (`src/components/shoot/add-to-shoot-sheet.tsx`) for the library to open: pick/create a shoot and add given pose ids.
- **Team** `/team`: members (admins first), admin-only invite code panel (copy, rotate; code is only fetched server-side for admins, RLS returns nothing otherwise). **Profile** `/profile`: name, emoji (24 presets), colour (8) picker.
- **Presence**: `OnlineAvatarStack` (self-contained client component, channel `team-presence`, key = user id). Joins while the tab is visible, leaves on hidden/pagehide, rejoins on visible/pageshow. Max 5 avatars then "+N". Renders nothing unless 2+ people are online (the viewer alone would duplicate the header avatar).

## Files
Created/edited (all within ownership): `src/app/(app)/{shoots,shoots/[id],places,places/[id],team,profile}/page.tsx`; `src/components/place/{place-picker,place-form,place-form-sheet,place-card,place-detail-actions,place-pose-grid,add-place-button}.tsx`; `src/components/shoot/{shoot-detail-view,shoot-item-row,shooting-mode,shoot-form-sheet,shoot-card,add-shoot-button,add-to-shoot-sheet,use-wake-lock}`; `src/components/team/{online-avatar-stack,invite-code-panel,profile-form,member-list}.tsx`; `src/lib/places/{maps-link,place-schema,place-actions,place-queries,place-search}.ts` (+ tests for maps-link, place-search); `src/lib/shoots/{reorder,shoot-items,shoot-actions,shoot-queries,signed-urls,format-date}.ts` (+ tests for reorder, format-date); `src/lib/team/{presence,invite-code,team-actions}.ts` (+ tests); `tests/e2e/{shoots-helpers,places-crud.spec,shoots-flow.spec,presence-avatars.spec}.ts`. Largest file 159 lines.

## Requested shared changes
1. **Mount `<OnlineAvatarStack />` in the header** (`src/components/shell/app-shell.tsx`, between `Logo` and `AvatarMenu`, or beside the avatar). No props. It already renders nothing when alone. The presence e2e and the 3 s criterion depend on this.
2. **Library "Thêm vào buổi chụp"** should open `<AddToShootSheet open onOpenChange poseIds />` from `@/components/shoot/add-to-shoot-sheet` (or call `addPosesToShoot` directly). The brief's e2e "add 3 poses from the library" cannot be completed until agent A wires that; my shoots spec seeds `shoot_items` with the service role instead.
3. Optional: Realtime presence channel is public (anyone holding the anon key could join and read names/emoji). A private channel needs a `realtime.messages` RLS policy (migration); not done, low risk for a private team app.

## Deviations / decisions
- Avatar picker lives on `/profile` (matches the "Hồ sơ" menu link); the team page links to it ("Sửa hồ sơ").
- Used `@dnd-kit/core` + `sortable` only; `@dnd-kit/utilities` is not a declared dependency, so the transform is built by hand. Drag uses a handle with `PointerSensor` (6 px) and `KeyboardSensor`; no separate TouchSensor (handle has `touch-none`). Real-finger dragging on a phone is unverified.
- Shoot items are read by querying `shoots`/`shoot_items`/`poses`/`pose_images` directly (title + first image), as allowed; `PoseCardGrid` is used only on place detail.
- Reordering writes one UPDATE per changed row (no upsert, because the insert policy/columns would not fit); fine for shot lists of tens of items.
- Realtime sync of `shoot_items` between teammates not implemented (not in scope text); the publication already includes it.
- Place delete un-links its poses (`poses.place_id ... on delete set null`, verified in migration 0002).

## Unverified
- All three e2e specs (never executed). The keyboard-drag steps in `shoots-flow.spec.ts` (focus handle, Space, ArrowDown, Space) are untested; if the reorder assertion fails, the dnd-kit announcements/focus handling is the first suspect.
- Place detail with the real `PoseCardGrid`/`listPoseCards` (both still stubs here: the page degrades to a message).
- Screen Wake Lock on a real device; embla swipe by touch (only Escape/buttons/keyboard exercised).
- Admin view of invite code copy/rotate; `rotateInviteCode` relies on RLS `team_settings_update` (policy read, not executed).
- Presence with 6+ users ("+N") only covered by the unit test.

## Incident to note
The shared scratchpad folder is common to all agents; a script named `shots.mjs` I created there was overwritten by agent A. When I re-ran it by mistake it executed A's script, which wrote `phase-02-library.png` and `phase-02-filter-sheet.png` into `D:\POSE-worktrees\library\plans\...\reports\` (A's own screenshots, A's own flow against :3001; no data changes by me beyond what that script does). Nothing else outside my worktree was touched. My scripts now live in `scratchpad\agent-d\`.
