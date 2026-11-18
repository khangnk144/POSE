# Phase 8 report: easy upload UX

Status: code done, typecheck/lint/unit/build green. RLS and e2e NOT run (per instructions).

## Verified (ran)
- `npm run typecheck`, `npm run lint`: clean.
- `npm test`: 28 files, 272 tests pass (new: missing-specs, filters-url need=1, recordEdit unlock, autofill-prompt, autofill-input, autofill-client, autofill route caption).
- `npm run build`: passes.
- Dev server (:3000) driven with Playwright at 390x844: quick form, details with pictograms, AI-locked hint (no key in this env), card badge, detail invitation, filter sheet switch, `need=1` returns the pose (real PostgREST `or` expression works against local DB), `?focus=camera` focuses first radio. Screenshots: `reports/phase-08-{quick,details,ai-locked,card-badge,detail-invite,filter-sheet,focus-camera}.png` (full-page shots show sticky bars overlapping; artifact of fullPage capture).
- Test user `agent-p8@test.local` still exists (never deleted); its test poses were deleted via the UI.

## Files
- Rule: `src/lib/poses/missing-specs.ts` (`isMissingSpecs`, `specGaps`), used by card, detail page, tests; DB side `NEEDS_DETAILS_CONDITION` in `pose-query-builder.ts` (`camera_height.is.null,model_steps.eq.{}`, status forced to published). Filter: `needsDetails`, URL `need=1` (types, zod schema, filters-url, filter sheet via new `pose-filter-switch.tsx`, empty state in `pose-infinite-grid.tsx`). `PoseCardData` gained `status`, `modelStepCount`; card select adds `status`.
- UI: `ui/pictograms.tsx` (27 SVG generated from the spec), `ui/pictogram-select.tsx`, `lib/types/pose-hints.ts`, `chip.tsx` (`todo` tone), `pose-card.tsx`, `pose-missing-specs-invite.tsx`, detail page, edit page (`?focus=`).
- Form: basics (title + caption), `ai-fill-button`, `details-toggle`, `pose-details-panel`, `use-details-panel`, camera/steps/classify/extras sections, `pictogram-options`, `pose-form`, `use-ai-autofill`, `merge-ai-draft` (`recordEdit`), `form-values` (`DETAIL_KEYS`).
- AI: `autofill-input.ts` (zod, caption max 2000 -> 400 `invalid_images`), route, `autofill-client.ts` (`requestAutofill(images, caption?, signal?)`; signal moved to 3rd arg, no existing caller used it), `autofill-prompt.ts` (caption only in user message inside `<video_caption>`, `<`/`>` escaped; system prompt declares it data-only).
- e2e: `tests/e2e/easy-upload.spec.ts` (not run). No existing spec needed edits (none asserted renamed strings).

## Deviations / notes
- Invitation block and badge both hide on drafts (one rule). Not in spec for the invitation; follows main's single-function decision.
- Pictogram hint text sits in a sibling `sr-only` span (not inside the button) so the radio's accessible name stays the short label.
- Caption box uses CSS `field-sizing: content` (auto-grow, max ~8 lines); in browsers without it the box stays 3 lines and scrolls.
- Toast copy for "AI nothing new" changed per spec; success toast "Đã lưu dáng 💗" added before navigation (unverified it survives the route change).
- Pre-existing: "Địa điểm" label appears twice (form span + PlacePicker); left alone.
- Pre-existing CRLF/LF mix; new files are LF.

## Unverified
- e2e spec itself, RLS suite, dark mode, real devices, `field-sizing` on Safari, AI call with a real key + caption (unit tests mock the model).

## Main must run (after agreeing to a reset)
`npm run db:reset` (if needed), `npm run test:rls`, `npm run test:e2e`.
