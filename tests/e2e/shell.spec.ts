import path from 'node:path';
import { expect, test } from '@playwright/test';

const INVITE_CODE = process.env.E2E_INVITE_CODE ?? 'XINH26'; // local seed.sql value
const SCREENSHOT = path.resolve(
  __dirname,
  '../../plans/261118-1433-pose-library-web-app/reports/phase-01-shell.png',
);

test('sign up with invite code, see the shell, open the avatar menu', async ({ page }) => {
  const email = `e2e-${Date.now()}@example.test`;

  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);

  await page.getByRole('link', { name: 'Tham gia team' }).click();
  await expect(page).toHaveURL(/\/join$/);

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mật khẩu').fill('e2e-password-123');
  await page.getByLabel('Tên hiển thị').fill('Linh');
  await page.getByLabel('Mã mời').fill(INVITE_CODE);
  await page.getByRole('button', { name: 'Vào team' }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Thư viện dáng' })).toBeVisible();

  const tabs = page.getByRole('navigation', { name: 'Điều hướng chính' });
  for (const label of ['Thư viện', 'AI gợi ý', 'Buổi chụp', 'Địa điểm']) {
    await expect(tabs.getByRole('link', { name: label })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: 'Thêm' })).toBeVisible();

  await page.getByRole('button', { name: 'Mở menu tài khoản' }).click();
  const menu = page.getByRole('menu', { name: 'Menu tài khoản' });
  await expect(menu).toBeVisible();
  for (const label of ['Yêu thích', 'Nháp', 'Team', 'Hồ sơ', 'Đăng xuất']) {
    await expect(menu.getByRole('menuitem', { name: label })).toBeVisible();
  }

  await page.screenshot({ path: SCREENSHOT });
});

test('wrong invite code shows the Vietnamese error', async ({ page }) => {
  await page.goto('/join');
  await page.getByLabel('Email').fill(`bad-code-${Date.now()}@example.test`);
  await page.getByLabel('Mật khẩu').fill('e2e-password-123');
  await page.getByLabel('Tên hiển thị').fill('Mai');
  await page.getByLabel('Mã mời').fill('WRONG-CODE');
  await page.getByRole('button', { name: 'Vào team' }).click();
  await expect(page.getByText('Mã này chưa đúng, bạn hỏi lại trưởng nhóm nhé.')).toBeVisible();
});
