# Phase 3 report: pose form, image pipeline, import-url

**Status: DONE_WITH_CONCERNS.** typecheck, lint, unit tests (122), build all pass. Create/edit/reorder flow, WebP upload and SSRF route verified by hand against the shared local Supabase (dev server on :3002, now stopped, test data removed). Playwright specs are written but NOT run (per brief).

## Test results
| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm test` | PASS, 7 files, 122 tests (phase 1: 19; this phase: ssrf-guard, import-image + og-image, resize, dominant-color, merge-ai-draft) |
| `npm run build` | PASS, `/api/import-url`, `/poses/new`, `/poses/[id]/edit` listed |
| Manual flow (Playwright script, since deleted) | PASS: 2 PNG (2400x3000, 1200x800) -> 2 pose_images rows, WebP full 1280x1600 / 1200x800, thumb files, dominant colour stored, grid/steps/tags/scenes saved; edit reorder via keyboard swapped the cover and persisted |
| Live `/api/import-url` | anon 401; `http://`, `127.0.0.1`, `169.254.169.254`, `[::1]`, `localhost`, `localtest.me` (DNS -> 127.0.0.1) all 400 `blocked`; `example.com` (no og:image) 422; a real public https PNG 200 with bytes |

Screenshots (390x844, aiEnabled=false, locked hint visible): `reports/phase-03-new-pose-ai-locked.png`, plus `-new-pose-filled-top.png`, `-new-pose-grid.png`, `-edit-pose.png`. The "N Issues" badge in them is the Next dev overlay (caused by the expected `PlacePicker` stub error and Playwright's injected style), not app UI.

## Files (all within ownership)
- `src/lib/security/ssrf-guard.ts` (+test): `isBlockedIp` (IPv4, IPv6, mapped, NAT64, 6to4, Teredo, ULA, link-local, multicast, malformed = blocked), `assertPublicHttpsUrl` (https, port 443, no credentials, IP literal check), `guardedLookup` (DNS check at connect time, no rebinding gap).
- `src/app/api/import-url/`: `route.ts` (POST, 401 for non-members), `guarded-fetch.ts` (node:https transport, max 3 redirects each re-validated, streaming size cap, 10s total timeout), `import-image.ts` (image/* except svg, 10 MB, og:image fallback with 1 MB HTML cap), `og-image.ts`, `import-image.test.ts`.
- `src/lib/images/`: `resize-math`, `dominant-color`, `process-image` (createImageBitmap with EXIF orientation, full 1600 q.85 + thumb 640 q.8 WebP, JPEG fallback if the browser cannot encode WebP, `makeAiJpeg` 1024px), `upload-pose-images`, `import-clipboard-and-url` (+ tests for the pure parts).
- `src/components/pose-form/`: `pose-form`, `image-picker`, `sortable-image-tile`, `basics-section`, `camera-section`, `extras-section`, `grid-picker`, `steps-editor`, `tag-input`, `ai-fill-button`, `flash-field`, `place-picker-boundary`, hooks (`use-pose-form-state`, `use-image-intake`, `use-ai-autofill`), `merge-ai-draft` (+test), `form-values`, `form-image`, `pose-row-mapping`, `save-pose`, `fetch-form-data`.
- Pages: `src/app/(app)/poses/new/page.tsx`, `poses/[id]/edit/page.tsx` (server components call `isAiConfigured()`).
- E2E (not run): `tests/e2e/pose-form-create-edit.spec.ts`, `tests/e2e/pose-form-import-url.spec.ts`.

## Behaviour notes / deviations
1. **Save order**: files upload first, then pose row, then image rows (not pose-first as the phase text reads), so a pose never appears without images. Any failure removes uploaded files and the pose row. Closing the tab mid-upload can still leave orphan files (no pose row).
2. **Upload progress** is per image at 0.5 / 1.0 (full, then thumb); the storage client has no byte progress.
3. **Published poses need >= 1 image**; "Nháp" may have none (text-only AI ideas exist per design). Spec did not say; flagging as an assumption.
4. **AI never runs automatically.** Button: disabled when `!aiEnabled`, no image, or running; locked hint always shown when `!aiEnabled`. Merge fills only fields not touched by the user and not pre-filled from the saved pose; scenes outside the fixed vocabulary are dropped; status/place/source are never AI-filled. Filled fields pulse for 1.6s.
5. **Autofill input to C**: up to 3 images as `AutofillImage[]`: saved images as `{ imageId }`, fresh ones as `{ file: JPEG <= 1024px }`. A mix of both kinds is possible in edit mode; C's `requestAutofill` must accept that (contract text says "ids OR one file"). Errors are mapped by message: `ai_quota`, `ai_disabled`, anything else = generic toast.
6. `PlacePicker` currently throws; it is rendered client-only inside an error boundary so the page does not 500 and the form still saves. Remove nothing when D lands; it just starts working.
7. Tag suggestions: PostgREST cannot do `select distinct unnest(tags)`, so the server component reads `poses.tags` (limit 2000) and ranks by frequency in JS.
8. Link import uses a plain div + Enter handler (a nested `<form>` caused a hydration error).
9. Storage upload uses `upsert: true` and image rows use `upsert` in edit mode so a retry after a partial failure does not collide.
10. Edit-mode removal deletes `pose_images` rows then storage files (best effort). Phase 1 deviation 7 said `pose_images` delete was creator/admin only, but the committed `0004_rls_policies.sql` uses `is_member()` for delete, so any member can remove images (verified by reading the migration; not exercised by a second user).

## Requested shared changes
None required. Optional: `globals.css` has no named flash animation; I used Tailwind `animate-pulse` + `ring-ai` for the AI-filled highlight.

## Unverified
- iOS Safari: `navigator.clipboard.read()` prompt, HEIC through `<input type=file>`, and WebP canvas encoding fallback were not tested on a real device. HEIC that cannot decode gives a friendly error (not tested with a real HEIC file).
- Touch drag-and-drop reorder (only keyboard reorder was exercised); handles are 44px with `touch-action: none`.
- Playwright specs not executed. The "2 ảnh" badge assertion depends on the library card from Phase 2.
- AI autofill path itself (needs C's client and an API key); only the merge logic is unit tested.
- Instagram/TikTok/Pinterest links in practice (best effort); only example.com and a Wikimedia PNG were tried.

## Noticed but not done
- Test data `poses/99d34e69-.../test-thumb.webp` in the shared bucket has no pose; not mine.

**Status:** DONE_WITH_CONCERNS
