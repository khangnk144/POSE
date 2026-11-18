# Phase 4 report: AI autofill + AI pose suggestion (agent C)

**Status: DONE_WITH_CONCERNS.** All code written; typecheck, lint, unit tests, build pass in `D:\POSE-worktrees\ai` (branch `feat/ai`). No live Claude call was possible (no key), so the model path is verified against the SDK type definitions only, not against real responses.

## Test results (run in this worktree)
| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm test` | PASS, 7 files, 52 tests (5 new files, 33 new tests) |
| `npm run build` | PASS; `/api/ai/autofill`, `/api/ai/suggest`, `/suggest` listed as dynamic |
| Migration 0030 | Validated, not applied: `BEGIN; ...; ROLLBACK;` in the shared DB container. Calls with limit 2 returned `1 2 -1` |
| Dev server :3003 (stopped afterwards) | `/suggest` opens locked at 390x844; both buttons `disabled` + `aria-disabled=true`, hint visible, 0 file inputs, 0 `/api/ai/*` requests on load; `POST /api/ai/suggest` and `/autofill` return `503 {"error":"ai_not_configured"}` (signed in) and curl without a session also 503 |
| RLS quota test, e2e spec | Written, NOT run (shared stack rule): `tests/rls/ai-quota.test.ts`, `tests/e2e/ai-suggest-locked.spec.ts` |
| `not implemented` in my files | none |

Screenshot: `plans/261118-1433-pose-library-web-app/reports/phase-04-suggest-locked.png`.

## Files
- Migration: `supabase/migrations/0030_ai_quota_rpc.sql` (`consume_ai_quota(p_user_id, p_limit)`, security definer, one upsert with `WHERE count < limit`, returns new count or -1, execute granted to `service_role` only; day boundary = Asia/Ho_Chi_Minh).
- `src/lib/ai/`: `ai-config.ts` (AI_MODEL default `claude-sonnet-5-5`, AI_DAILY_LIMIT_PER_USER default 40, timeout 40s), `ai-quota.ts`, `ai-route-guard.ts` (503 -> 401 -> 403, quota 429, failure mapping), `claude-client.ts`, `image-input.ts`, `load-stored-images.ts`, `parse-ai-output.ts`, `prompts/{pose-fields-schema,autofill-prompt,suggest-prompt,pose-catalog}.ts`, client side `ai-http.ts`, `autofill-client.ts` (stub replaced), `suggest-client.ts`, `shrink-image.ts`, `save-idea-as-draft.ts`; tests next to them.
- `src/app/api/ai/{autofill,suggest}/route.ts` + `ai-routes.test.ts`.
- `src/app/(app)/suggest/page.tsx`, `src/components/ai/{suggest-screen,suggest-capture,suggest-waiting,suggest-result,suggest-error,idea-card,photo-pick-button}.tsx`.
- `package.json` / `package-lock.json`: only `@anthropic-ai/sdk ^1.10.0` added (installed 1.10.0).

## SDK / API choices, and where I verified them
All in `node_modules/@anthropic-ai/sdk` v1.10.0:
- Base64 image: `ImageBlockParam.source = Base64ImageSource {type:'base64', media_type: 'image/jpeg'|'image/png'|'image/gif'|'image/webp', data}` (`resources/messages/messages.d.ts` ~L298, L3661).
- Structured JSON: the SDK exposes both `output_config.format` (`JSONOutputFormat`, json_schema) and tool use. I chose **forced tool use**: `tools:[{name, input_schema}]` + `tool_choice:{type:'tool', name}`; the answer is `ToolUseBlock.input` (L4387, L4517, L4737). Reason: input arrives as an object (no text parsing), and it does not depend on a newer feature. `strict` not used (zod validates per field anyway).
- Cache: `system` accepts `TextBlockParam[]` with `cache_control:{type:'ephemeral'}` (L5783, L2122). The pose catalog is the cached system block so repeated suggest calls re-read it cheaply (whether it hits depends on the 1024+ token minimum and catalog stability; unverified in practice).
- Abort/timeout: per-request `RequestOptions {signal, timeout, maxRetries}` (`internal/request-options.d.ts`); client `maxRetries: 1`. Errors: `Anthropic.APIUserAbortError`, `APIConnectionTimeoutError`, `APIError.status` (`core/error.d.ts`, `client.d.ts` L414). Mapping: abort -> 499 `ai_aborted`, timeout -> 504 `ai_timeout`, 429/529/503 -> 503 `ai_busy`, other/bad output/max_tokens cut -> 502 `ai_failed`.
- Model IDs `claude-sonnet-5-5`, `claude-haiku-5-5`, `claude-opus-5-5` are in the SDK `Model` union (L3916). Default Sonnet for both routes; switch via `AI_MODEL`. Haiku-vs-Sonnet quality on 10 images (as the phase file asked) was NOT done: needs a key.

## Prompt summary (Vietnamese, in `src/lib/ai/prompts/`)
- Autofill: friendly assistant for a photo team; must answer by calling `fill_pose`; fill only fields it can see or reasonably infer; enum values exactly as listed (value = Vietnamese label glossary generated from `pose-labels.ts`); multiple images = same pose; camera fields inferred from viewpoint; no naming people. Tool schema = all pose fields, none required.
- Suggest: "cô bạn thân rành chụp ảnh"; `suggest_poses` returns `sceneClear`/`unclearReason`, `scene{summary,light,setting[],tips[]}`, `matches[{ref,reason,cameraTip}]` (max 8, empty array allowed), `ideas[]` (3, pose fields). Catalog as a cached system block, one line per pose: `n|title|posture|people|scenes|height`.

## Deviations from the contract (with reason)
1. **Model sees catalog numbers (1..N), not UUIDs.** A UUID costs about 20+ tokens and invites typos; the server maps number -> real id, and unknown numbers are dropped (this is the "keep only existing published poseIds" rule). The API response to the client still has real `poseId`.
2. **Catalog cap**: if more than 600 published poses, filter by `peopleCount` (poses without a count kept) when given, then keep the newest 600. Scenes cannot be pre-filtered because the scene is only known from the photo. DB fetch is limited to 1000 rows (PostgREST default max).
3. **Unclear scene** returns `422 {error:'scene_unclear', message}` instead of the normal body (contract had no slot for it). The quota call is already spent.
4. **`requestAutofill(images, signal?)`** has an optional second parameter (abort). Errors are `AiClientError` whose `message` is the code: `ai_quota`, `ai_disabled`, `ai_timeout`, `ai_busy`, `ai_failed`, `network`, `aborted`, `invalid_image`.
5. **Autofill route** accepts JSON `{imageIds}` or multipart (`image` x1-3 and/or repeated `imageIds`); stored images are read as the signed-in member (full image, thumbnail if full > 4 MB). An all-empty model answer returns 502 `ai_failed`.
6. **Quota is spent per attempt, after input validation**, and not refunded when Claude fails. Bad requests are free. Counter DB errors fail closed (500).
7. **Matched pose cards** are loaded client-side with `getPoseCardsByIds(browserClient, ids)` after the response, not in the route (it is agent A's stub until integration; if it throws the screen shows a short "could not load cards" line).
8. Selecting/capturing a photo starts the call (that tap is the explicit action); nothing runs on load (checked in the browser run above).
9. The first match note is prefixed "Hợp nhất:" via `notes`; design's horizontal card layout and "thư viện chưa có dáng hợp" copy are implemented, but "back from pose detail keeps the result" is NOT (state is in memory only).
10. Scan animation uses Tailwind `animate-pulse`/`animate-spin` under `motion-safe:`; I did not add keyframes to `globals.css` (not mine).

## Estimated tokens per call (ESTIMATES, not measured)
- Autofill: tool schema + system about 1.5k, 1-3 images of 1024px about 1.4k each (image tokens ~ w*h/750, from general knowledge, unverified), output about 300-500. Roughly 3-6k input per call.
- Suggest: schema + system about 2k, image about 1.4k, catalog about 25 tokens per pose (150 poses = 4k, 600 poses = 15k), output about 1-2k (3 ideas). Roughly 8k to 19k input. The cached catalog should cut repeat-call cost if the cache hits.
- Actual numbers get logged per call by the routes (`[ai] autofill` / `[ai] suggest` lines with input/output/cache tokens) to fill in the smoke test table. Prices not checked; look them up before budgeting.

## Requested shared changes
- `.env.example`: add `AI_MODEL=claude-sonnet-5-5` (comment: model for both AI routes; `claude-haiku-5-5` is cheaper). `AI_DAILY_LIMIT_PER_USER=40` is already there.
- After integration, run `npm run db:types` so `consume_ai_quota` appears in `src/lib/types/database.ts`; then the `as unknown as QuotaRpcClient` cast in `src/lib/ai/ai-route-guard.ts` and the cast in `tests/rls/ai-quota.test.ts` can go.
- Agent B's form should call `requestAutofill` only from the button, pass `{imageId}` for uploaded images, and handle `AiClientError.code`.

## Unverified / must be done once a key exists
- **Test fixtures are SYNTHETIC.** `parse-ai-output.test.ts` and `claude-client.test.ts` use hand-written objects shaped like `tool_use.input` / SDK `Message`. The phase file requires recorded real responses (3-5 calls); replace them after the smoke test.
- Smoke test not done: 5 pose photos, 3 scene photos, latency, real tokens and cost. Whether Claude honours the enum glossary and `tool_choice` with these schemas is unconfirmed.
- 5 MB per-image limit and 1024px token formula are from general knowledge, not read from docs this session.
- Quota test with concurrency (`tests/rls/ai-quota.test.ts`) and the e2e spec have not been executed; the SQL itself was exercised in a rolled-back transaction.
- Camera permission denied: with `capture` the browser falls back to the file picker; no special copy written.
- Mobile Safari `createImageBitmap(..., {imageOrientation:'from-image'})` behaviour not tested on a device.

## Noticed but not done
- `src/lib/types/database.ts` hand-written types do not include the new RPC (see above).
- Autofill result never includes `placeId`, `sourceUrl`, `sourceCredit`, `status` by design.

**Status:** DONE_WITH_CONCERNS
