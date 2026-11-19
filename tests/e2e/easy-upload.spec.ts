import { expect, test, type Page } from '@playwright/test';

const INVITE_CODE = process.env.E2E_INVITE_CODE ?? 'XINH2026'; // local seed.sql value

// 1x1 PNG, same as pose-form-create-edit.spec.ts.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

async function signUp(page: Page) {
  await page.goto('/join');
  await page.getByLabel('Email').fill(`e2e-easy-${Date.now()}@example.test`);
  await page.getByLabel('Mật khẩu').fill('e2e-password-123');
  await page.getByLabel('Tên hiển thị').fill('Tester Easy');
  await page.getByLabel('Mã mời').fill(INVITE_CODE);
  await page.getByRole('button', { name: 'Vào team' }).click();
  await expect(page).toHaveURL(/\/$/);
}

test('quick add (image + title), "Thiếu thông số", "Cần bổ sung" filter, ?focus=camera, then complete it', async ({
  page,
}) => {
  await signUp(page);
  const token = String(Date.now());
  const title = `Thêm nhanh ${token}`;

  // Quick add: after picking the image it takes two taps (title field, "Lưu dáng").
  await page.goto('/poses/new');
  await page.getByTestId('pose-image-input').setInputFiles([{ name: 'a.png', mimeType: 'image/png', buffer: PNG }]);
  const details = page.getByRole('button', { name: /Thêm chi tiết/ });
  await expect(details).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('radiogroup', { name: 'Máy cao ngang đâu?' })).toBeHidden();
  await page.getByLabel('Tên dáng *').click(); // tap 1
  await page.getByLabel('Tên dáng *').fill(title);
  await page.getByRole('button', { name: 'Lưu dáng' }).click(); // tap 2
  await expect(page).toHaveURL(/\/poses\/([0-9a-f-]{36})$/);
  const id = page.url().split('/').pop();

  // Detail page invites contributions instead of an empty gap.
  const invite = page.getByRole('region', { name: 'Cần bổ sung' });
  await expect(invite).toContainText('Dáng này mới có ảnh thôi');
  await expect(invite.getByRole('link', { name: 'Bổ sung chi tiết' })).toHaveAttribute(
    'href',
    `/poses/${id}/edit?focus=camera`,
  );

  // The new pose carries the label in the library, and the filter finds it.
  await page.goto(`/?q=${token}`);
  const card = page.locator('article').filter({ hasText: title });
  await expect(card.getByText('Thiếu thông số')).toBeVisible();
  await page.getByRole('button', { name: /Bộ lọc/ }).click();
  await page.getByRole('switch', { name: /Cần bổ sung/ }).click();
  await page.getByRole('button', { name: /^Xem \d+ dáng$/ }).click();
  await expect(page).toHaveURL(/need=1/);
  await expect(card).toHaveCount(1);

  // ?focus=camera opens the form at "Cách cầm máy" with the first picture option focused.
  await page.goto(`/poses/${id}/edit?focus=camera`);
  await expect(page.getByRole('button', { name: /Thêm chi tiết/ })).toHaveAttribute('aria-expanded', 'true');
  const heights = page.getByRole('radiogroup', { name: 'Máy cao ngang đâu?' });
  await expect(heights).toBeVisible();
  await expect(heights.getByRole('radio').first()).toBeFocused();

  // Adding a camera height and one step removes the label and the invitation.
  await heights.getByRole('radio', { name: 'Ngang hông', exact: true }).click();
  await page.getByRole('button', { name: 'Thêm bước' }).click();
  await page.getByLabel('Bước 1', { exact: true }).fill('Nghiêng vai về phía máy');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page).toHaveURL(new RegExp(`/poses/${id}$`));
  await expect(page.getByRole('region', { name: 'Cần bổ sung' })).toHaveCount(0);

  await page.goto(`/?q=${token}`);
  await expect(page.locator('article').filter({ hasText: title })).toBeVisible();
  await expect(page.locator('article').filter({ hasText: title }).getByText('Thiếu thông số')).toHaveCount(0);
});

test('"Không rõ" is the default choice and picking a height can be undone', async ({ page }) => {
  await signUp(page);
  await page.goto('/poses/new');
  await page.getByRole('button', { name: /Thêm chi tiết/ }).click();
  const heights = page.getByRole('radiogroup', { name: 'Máy cao ngang đâu?' });
  await expect(heights.getByRole('radio', { name: 'Không rõ' })).toHaveAttribute('aria-checked', 'true');
  await heights.getByRole('radio', { name: 'Ngang mắt', exact: true }).click();
  await expect(heights.getByRole('radio', { name: 'Không rõ' })).toHaveAttribute('aria-checked', 'false');
  await heights.getByRole('radio', { name: 'Không rõ' }).click();
  await expect(heights.getByRole('radio', { name: 'Không rõ' })).toHaveAttribute('aria-checked', 'true');
});
