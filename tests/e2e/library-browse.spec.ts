import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { createMember, PASSWORD, type TestUser } from '../rls/helpers';

// Needs the local Supabase stack and `npm run dev`. Every pose title carries a per-run token so
// assertions stay exact even when the shared database holds other poses.
const token = `zq${randomUUID().replace(/-/g, '').slice(0, 8)}`;
let user: TestUser;
const ids: Record<string, string> = {};

type Seed = { key: string; title: string; posture: string; camera_height: string };

const SEEDS: Seed[] = [
  { key: 'sofa-waist', title: `${token} Ngồi sofa đọc sách`, posture: 'sit', camera_height: 'waist' },
  { key: 'sit-eye', title: `${token} Ngồi cafe`, posture: 'sit', camera_height: 'eye' },
  { key: 'stand-waist', title: `${token} Đứng dựa tường`, posture: 'stand', camera_height: 'waist' },
];

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Mật khẩu').fill(PASSWORD);
  await page.getByRole('button', { name: /Đăng nhập/ }).click();
  await expect(page.getByRole('heading', { name: 'Thư viện dáng' })).toBeVisible();
}

const cards = (page: Page) => page.locator('article');

test.beforeAll(async () => {
  user = await createMember('library-e2e', 'Thư viện');
  for (const seed of SEEDS) {
    const { data, error } = await user.client
      .from('poses')
      .insert({
        title: seed.title,
        posture: seed.posture,
        camera_height: seed.camera_height,
        model_steps: ['Tay trái đặt lên đầu gối', 'Nhìn ra xa'],
        grid: { x: 0.33, y: 0.5, horizon: null },
      })
      .select('id')
      .single();
    if (error) throw new Error(`seed pose failed: ${error.message}`);
    ids[seed.key] = data.id;
  }
  // 30 more, to cross the 24-per-page boundary.
  const bulk = Array.from({ length: 30 }, (_, i) => ({ title: `${token} Dáng số ${i + 1}`, posture: 'walk' }));
  const { error } = await user.client.from('poses').insert(bulk);
  if (error) throw new Error(`bulk seed failed: ${error.message}`);
});

test.afterAll(async () => {
  await user.client.from('poses').delete().ilike('title', `${token}%`);
});

test('filter "Ngang hông" + "Ngồi" returns exactly the matching seed poses', async ({ page }) => {
  await login(page);
  await page.goto(`/?q=${token}`);
  await page.getByRole('button', { name: /Bộ lọc/ }).click();
  await page.getByRole('checkbox', { name: 'Ngang hông' }).click();
  await page.getByRole('checkbox', { name: 'Ngồi', exact: true }).click();
  await page.getByRole('button', { name: 'Xem 1 dáng' }).click();

  await expect(page).toHaveURL(/height=waist/);
  await expect(page).toHaveURL(/posture=sit/);
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first()).toContainText('Ngồi sofa đọc sách');
});

test('accent-free search finds accented titles', async ({ page }) => {
  await login(page);
  await page.getByLabel('Tìm dáng').fill(`ngoi sofa ${token}`);
  await expect(page).toHaveURL(/q=ngoi/);
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first()).toContainText('Ngồi sofa đọc sách');
});

test('library loads the next page when scrolling', async ({ page }) => {
  await login(page);
  await page.goto(`/?q=${token}`);
  await expect(cards(page)).toHaveCount(24);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(cards(page)).toHaveCount(33); // 3 seeded + 30 bulk
});

test('a favorite survives reload and shows in the favorites view', async ({ page }) => {
  await login(page);
  await page.goto(`/?q=${token}+sofa`);
  await cards(page).first().getByRole('button', { name: 'Yêu thích' }).click();
  await expect(cards(page).first().getByRole('button', { name: 'Bỏ yêu thích' })).toBeVisible();

  await page.reload();
  await expect(cards(page).first().getByRole('button', { name: 'Bỏ yêu thích' })).toBeVisible();

  await page.goto(`/?fav=1&q=${token}`);
  await expect(cards(page)).toHaveCount(1);
});

test('pose detail shows steps, the empty photo state and the add-to-shoot action', async ({ page }) => {
  await login(page);
  await page.goto(`/poses/${ids['sofa-waist']}`);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Ngồi sofa đọc sách');
  await expect(page.getByText('Tay trái đặt lên đầu gối')).toBeVisible();

  await expect(page.getByText('Dáng này chưa có ảnh')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Thêm vào buổi chụp' })).toBeVisible();
});

test('drafts stay out of the main library and appear under Nháp', async ({ page }) => {
  const { error } = await user.client.from('poses').insert({ title: `${token} Bản nháp`, status: 'draft' });
  expect(error).toBeNull();
  await login(page);
  await page.goto(`/?q=${token}+nhap`);
  await expect(page.getByText('Không tìm thấy dáng nào hợp')).toBeVisible();
  await page.goto(`/?status=draft&q=${token}`);
  await expect(cards(page)).toHaveCount(1);
});
