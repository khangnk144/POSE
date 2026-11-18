import { expect, test } from '@playwright/test';
import { adminClient, joinTeam, profileIdByName, seedPoses } from './shoots-helpers';

// The library "add to shoot" button belongs to the library phase, so poses are attached to the shoot
// through the same table the app writes to (service role). Reorder, done and reload run through the UI.
test('shoot: create, reorder by keyboard, mark done, reload keeps state', async ({ page }) => {
  const name = await joinTeam(page, 'shoots');
  const creator = await profileIdByName(name);
  const tag = Date.now();
  const titles = [`Dáng A ${tag}`, `Dáng B ${tag}`, `Dáng C ${tag}`];
  const poseIds = await seedPoses(creator, titles);

  await page.goto('/shoots');
  await page.getByRole('button', { name: 'Buổi chụp mới' }).click();
  await page.getByRole('dialog').getByLabel('Tên buổi chụp').fill(`Chụp thử ${tag}`);
  await page.getByRole('dialog').getByRole('button', { name: 'Tạo buổi chụp' }).click();
  await expect(page).toHaveURL(/\/shoots\/[0-9a-f-]{36}$/);
  const shootId = page.url().split('/').pop()!;

  const { error } = await adminClient()
    .from('shoot_items')
    .insert(poseIds.map((pose_id, position) => ({ shoot_id: shootId, pose_id, position })));
  expect(error).toBeNull();
  await page.reload();

  const rows = page.getByTestId('shoot-item');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText(titles[0]);

  // Move A below B with the keyboard sensor: focus handle, Space to lift, ArrowDown, Space to drop.
  const handle = page.getByRole('button', { name: `Kéo để sắp xếp ${titles[0]}` });
  await handle.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  await expect(rows.nth(0)).toContainText(titles[1]);
  await expect(rows.nth(1)).toContainText(titles[0]);

  await page.getByRole('checkbox', { name: `Đã chụp ${titles[2]}` }).click();
  await expect(page.getByText('1/3 dáng đã chụp')).toBeVisible();

  await page.reload();
  await expect(rows.nth(0)).toContainText(titles[1]);
  await expect(rows.nth(1)).toContainText(titles[0]);
  await expect(page.getByRole('checkbox', { name: `Đã chụp ${titles[2]}` })).toHaveAttribute('aria-checked', 'true');

  // Shooting mode opens on the first pose that is not done and can be left.
  await page.getByRole('button', { name: 'Bắt đầu chụp' }).click();
  const mode = page.getByRole('dialog', { name: 'Chế độ chụp' });
  await expect(mode.getByRole('heading', { name: titles[1] })).toBeVisible();
  await mode.getByRole('button', { name: 'Đánh dấu đã chụp' }).click();
  await mode.getByRole('button', { name: 'Thoát chế độ chụp' }).click();
  await expect(page.getByText('2/3 dáng đã chụp')).toBeVisible();

  await adminClient().from('shoots').delete().eq('id', shootId);
  await adminClient().from('poses').delete().in('id', poseIds);
});
