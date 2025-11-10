import { test, expect } from '@playwright/test';

test.describe('Homepage smoke test', () => {
  test('renders hero, league nav, and parlay builder', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /all games/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'NFL' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /parlay builder/i })).toBeVisible();
  });
});
