import { expect, test } from '@playwright/test';

const INVITE_CODE = process.env.E2E_INVITE_CODE ?? 'XINH2026'; // local seed.sql value

test('import-url requires a session', async ({ request }) => {
  const res = await request.post('/api/import-url', { data: { url: 'https://example.com/a.jpg' } });
  expect(res.status()).toBe(401);
});

test('import-url refuses non-public targets for a signed-in member', async ({ page }) => {
  await page.goto('/join');
  await page.getByLabel('Email').fill(`e2e-import-${Date.now()}@example.test`);
  await page.getByLabel('Mật khẩu').fill('e2e-password-123');
  await page.getByLabel('Tên hiển thị').fill('Tester Import');
  await page.getByLabel('Mã mời').fill(INVITE_CODE);
  await page.getByRole('button', { name: 'Vào team' }).click();
  await expect(page).toHaveURL(/\/$/);

  for (const url of [
    'http://example.com/a.jpg',
    'https://127.0.0.1/a.jpg',
    'https://169.254.169.254/latest/meta-data/',
    'https://[::1]/a.jpg',
    'https://localhost/a.jpg',
  ]) {
    const res = await page.request.post('/api/import-url', { data: { url } });
    expect(res.status(), url).toBe(400);
    expect((await res.json()).error).toBe('blocked');
  }
});
