import path from 'node:path';
import { expect, test } from '@playwright/test';

const INVITE_CODE = process.env.E2E_INVITE_CODE ?? 'XINH2026'; // local seed.sql value
const SCREENSHOT = path.resolve(
  __dirname,
  '../../plans/261118-1433-pose-library-web-app/reports/phase-04-suggest-locked.png',
);

// Runs against a server started WITHOUT ANTHROPIC_API_KEY (the default local .env.local).
test('AI suggest tab opens in a locked state when no API key is set', async ({ page }) => {
  const email = `e2e-ai-${Date.now()}@example.test`;
  await page.goto('/join');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mật khẩu').fill('e2e-password-123');
  await page.getByLabel('Tên hiển thị').fill('Linh');
  await page.getByLabel('Mã mời').fill(INVITE_CODE);
  await page.getByRole('button', { name: 'Vào team' }).click();
  await expect(page).toHaveURL(/\/$/);

  const apiCalls: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/api/ai/')) apiCalls.push(r.url());
  });

  await page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('link', { name: 'AI gợi ý' }).click();
  await expect(page).toHaveURL(/\/suggest$/);

  await expect(page.getByRole('heading', { name: 'Chụp cảnh bạn đang đứng' })).toBeVisible();
  for (const name of ['Chụp ảnh', 'Chọn từ máy']) {
    const button = page.getByRole('button', { name });
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute('aria-disabled', 'true');
  }
  await expect(page.getByRole('note')).toContainText('AI đang tạm khoá vì chưa cài API key');
  await expect(page.locator('input[type="file"]')).toHaveCount(0);

  await page.screenshot({ path: SCREENSHOT });
  expect(apiCalls).toEqual([]); // nothing paid ran on page load
});

test('API returns 503 ai_not_configured without a key, even when signed out', async ({ request }) => {
  const res = await request.post('/api/ai/suggest', { multipart: { peopleCount: 'solo' } });
  expect(res.status()).toBe(503);
  expect(await res.json()).toEqual({ error: 'ai_not_configured' });
});
