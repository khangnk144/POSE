import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Unit tests only. RLS tests (need local Supabase) use vitest.rls.config.mts.
export default defineConfig({
  resolve: { alias: { '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src') } },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
