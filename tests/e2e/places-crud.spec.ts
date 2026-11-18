import { expect, test } from '@playwright/test';
import { adminClient, joinTeam } from './shoots-helpers';

test('create a place, see it in the list with a Google Maps link, delete it', async ({ page }) => {
  await joinTeam(page, 'places');
  const placeName = `Quán test ${Date.now()}`;

  await page.goto('/places');
  await page.getByRole('button', { name: 'Thêm địa điểm' }).click();
  const sheet = page.getByRole('dialog');
  await sheet.getByLabel('Tên địa điểm').fill(placeName);
  await sheet.getByLabel('Địa chỉ').fill('12 Lê Lợi, Đà Lạt');
  await sheet.getByRole('button', { name: 'Thêm địa điểm' }).click();

  const card = page.getByRole('listitem').filter({ hasText: placeName });
  await expect(card).toBeVisible();
  await expect(card.getByText('0 dáng')).toBeVisible();
  const maps = card.getByRole('link', { name: /Google Maps/ });
  await expect(maps).toHaveAttribute('href', /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
  await expect(maps).toHaveAttribute('target', '_blank');

  await card.getByRole('link', { name: new RegExp(placeName) }).first().click();
  await expect(page.getByRole('heading', { name: placeName })).toBeVisible();

  page.once('dialog', (d) => void d.accept());
  await page.getByRole('button', { name: 'Xoá' }).click();
  await expect(page).toHaveURL(/\/places$/);
  await expect(page.getByText(placeName)).toHaveCount(0);
});

test('a javascript: Maps link is rejected by the form', async ({ page }) => {
  await joinTeam(page, 'places-bad');
  await page.goto('/places');
  await page.getByRole('button', { name: 'Thêm địa điểm' }).click();
  const sheet = page.getByRole('dialog');
  await sheet.getByLabel('Tên địa điểm').fill('Chỗ lạ');
  await sheet.getByLabel('Link Google Maps').fill('javascript:alert(1)');
  await sheet.getByRole('button', { name: 'Thêm địa điểm' }).click();
  await expect(sheet.getByText('Link Google Maps cần bắt đầu bằng http hoặc https.')).toBeVisible();
  const { count } = await adminClient().from('places').select('id', { count: 'exact', head: true }).eq('name', 'Chỗ lạ');
  expect(count).toBe(0);
});
