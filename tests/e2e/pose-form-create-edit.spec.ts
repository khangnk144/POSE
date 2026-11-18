import { expect, test, type Page } from '@playwright/test';

const INVITE_CODE = process.env.E2E_INVITE_CODE ?? 'XINH26'; // local seed.sql value

// 1x1 PNG; the pipeline never upscales, so this also covers tiny images.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
const image = (name: string) => ({ name, mimeType: 'image/png', buffer: PNG });

async function signUp(page: Page) {
  await page.goto('/join');
  await page.getByLabel('Email').fill(`e2e-form-${Date.now()}@example.test`);
  await page.getByLabel('Mật khẩu').fill('e2e-password-123');
  await page.getByLabel('Tên hiển thị').fill('Tester Form');
  await page.getByLabel('Mã mời').fill(INVITE_CODE);
  await page.getByRole('button', { name: 'Vào team' }).click();
  await expect(page).toHaveURL(/\/$/);
}

const tiles = (page: Page) => page.getByRole('list', { name: 'Danh sách ảnh' }).getByRole('listitem');

test('add a pose with 2 images, see it in the library with a "2 ảnh" badge', async ({ page }) => {
  await signUp(page);
  await page.goto('/poses/new');
  await page.getByTestId('pose-image-input').setInputFiles([image('a.png'), image('b.png')]);
  await expect(tiles(page)).toHaveCount(2);

  const title = `Dáng e2e ${Date.now()}`;
  await page.getByLabel('Tên dáng *').fill(title);
  await page.getByRole('button', { name: 'Lưu dáng' }).click();
  await expect(page).toHaveURL(/\/poses\/[0-9a-f-]{36}$/);

  await page.goto('/');
  const card = page.getByRole('link', { name: new RegExp(title) });
  await expect(card).toBeVisible();
  await expect(card.getByText('2 ảnh')).toBeVisible();
});

test('reordering images in the edit form changes the cover', async ({ page }) => {
  await signUp(page);
  await page.goto('/poses/new');
  await page.getByTestId('pose-image-input').setInputFiles([image('a.png'), image('b.png')]);
  await expect(tiles(page)).toHaveCount(2);
  await page.getByLabel('Tên dáng *').fill('Dáng đổi bìa');
  await page.getByRole('button', { name: 'Lưu dáng' }).click();
  await expect(page).toHaveURL(/\/poses\/([0-9a-f-]{36})$/);
  const id = page.url().split('/').pop();

  await page.goto(`/poses/${id}/edit`);
  await expect(tiles(page)).toHaveCount(2);
  const secondId = await tiles(page).nth(1).getAttribute('data-image-id');
  await page.getByRole('button', { name: 'Kéo để đổi thứ tự ảnh 2' }).focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Space');
  await expect(tiles(page).first().getByText('Ảnh bìa')).toBeVisible();
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page).toHaveURL(new RegExp(`/poses/${id}$`));

  await page.goto(`/poses/${id}/edit`);
  await expect(tiles(page).first().getByText('Ảnh bìa')).toBeVisible();
  expect(await tiles(page).first().getAttribute('data-image-id')).toBe(secondId);
});

test('cancelling uploads nothing; AI button stays locked without a key', async ({ page }) => {
  await signUp(page);
  const uploads: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/storage/v1/object/') && r.method() !== 'GET') uploads.push(r.url());
  });
  await page.goto('/poses/new');
  await page.getByTestId('pose-image-input').setInputFiles([image('a.png')]);
  await expect(tiles(page)).toHaveCount(1);

  const ai = page.getByRole('button', { name: /AI điền giúp/ });
  if (await page.getByText('AI đang tạm khoá').isVisible()) {
    await expect(ai).toBeDisabled();
    await expect(ai).toHaveAttribute('aria-disabled', 'true');
  }

  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Huỷ' }).click();
  await expect(page).not.toHaveURL(/\/poses\/new/);
  expect(uploads).toEqual([]);
});

test('saving a published pose without images asks for one', async ({ page }) => {
  await signUp(page);
  await page.goto('/poses/new');
  await page.getByLabel('Tên dáng *').fill('Không ảnh');
  await page.getByRole('button', { name: 'Lưu dáng' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Thêm ít nhất 1 ảnh' })).toBeVisible();
  await expect(page).toHaveURL(/\/poses\/new/);
});
