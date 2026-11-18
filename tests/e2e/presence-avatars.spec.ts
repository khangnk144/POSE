import { expect, test } from '@playwright/test';
import { joinTeam } from './shoots-helpers';

// Needs <OnlineAvatarStack /> mounted in the app header (done at integration).
test('two members see each other online within 3 seconds, and leave when the tab closes', async ({ browser }) => {
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();

  const nameA = await joinTeam(pageA, 'presence-a');
  const nameB = await joinTeam(pageB, 'presence-b');

  await expect(pageA.getByTestId('online-avatar-stack').getByRole('img', { name: `Avatar của ${nameB}` })).toBeVisible({ timeout: 3000 });
  await expect(pageB.getByTestId('online-avatar-stack').getByRole('img', { name: `Avatar của ${nameA}` })).toBeVisible({ timeout: 3000 });

  await pageB.close();
  await expect(pageA.getByTestId('online-avatar-stack')).toHaveCount(0, { timeout: 10_000 });

  await ctxA.close();
  await ctxB.close();
});
