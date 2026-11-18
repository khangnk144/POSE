step 1-2 done — git init, .gitignore, Next 16.4.6 scaffold at d:\POSE root, base deps installed
step 3 in progress — npm install of project deps running (check package.json for supabase/vitest)
step 4a done — migrations 0001-0005 + seed.sql (invite code XINH2026 local) written in supabase/; not yet applied (needs Docker + supabase init config.toml)
step 5a done — types (src/lib/types/pose.ts, pose-labels.ts), schemas, lib/poses/filters-url.ts, contract stubs, ai-availability.ts, .env.example written; database.ts needs db running
step 7-8 done — globals.css tokens, layout fonts, ui primitives in src/components/ui (toast, bottom-sheet, ...)
step 6,9a done — supabase clients (src/lib/supabase/*), src/proxy.ts, session.ts, app shell (src/components/shell/*), (app)/layout.tsx
step 9b,10 done — auth pages/forms (src/components/auth), placeholder pages for all routes (+ /profile)
step 3 done — all deps installed (zod 4.6.7, vitest 5.1.1, supabase CLI 3.2.0, playwright 1.65.1; @types/node bumped to ^24 because vitest 5 peer requires it)
step 11-12 done — .env.example, .env.local (keys EMPTY: Docker down), package.json scripts, hand-written database.ts; BLOCKER: docker daemon not running ('npx supabase start' -> DockerLifecycleInspectError npipe dockerDesktopLinuxEngine not found)
unit tests (19) + tsc pass; vitest note: run from cwd D:\POSE; configs vitest.config.mts (unit) / vitest.rls.config.mts
step: RLS tests (tests/rls), e2e (tests/e2e/shell.spec.ts), playwright.config.ts written but NOT RUN (docker down). build+lint+typecheck+unit green after npm ci (swc binary was corrupt from interrupted installs)
visual check done: /login /join screenshots at 390x844 (reports/phase-01-visual-*.png); Chromium installed; dev server stopped
