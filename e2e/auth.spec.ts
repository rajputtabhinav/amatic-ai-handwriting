import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect to sign-in when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to sign-in page
    await expect(page).toHaveURL(/sign-in/);
  });

  test('should show sign-in page elements', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Wait for Clerk to load
    await page.waitForLoadState('networkidle');
    
    // Check if sign-in form is present
    const hasClerkForm = await page.locator('[data-clerk-component]').count() > 0;
    expect(hasClerkForm).toBeTruthy();
  });

  test('should show sign-up page', async ({ page }) => {
    await page.goto('/sign-up');
    
    await page.waitForLoadState('networkidle');
    
    const hasClerkForm = await page.locator('[data-clerk-component]').count() > 0;
    expect(hasClerkForm).toBeTruthy();
  });
});

test.describe('Landing Page', () => {
  test('should load landing page', async ({ page }) => {
    await page.goto('/');
    
    // Check for key elements
    await expect(page).toHaveTitle(/Amatic/i);
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto('/');
    
    // Check for pricing link
    const pricingLink = page.locator('a[href="/pricing"]');
    await expect(pricingLink).toBeVisible();
  });

  test('should navigate to pricing page', async ({ page }) => {
    await page.goto('/');
    
    await page.click('a[href="/pricing"]');
    await expect(page).toHaveURL(/pricing/);
  });
});

