import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/landing');
    
    // Check page title
    await expect(page).toHaveTitle(/Amatic.ai/);
    
    // Check hero section is visible
    const heroSection = page.locator('text=AI Handwriting');
    await expect(heroSection).toBeVisible();
  });

  test('should navigate to sign-up page', async ({ page }) => {
    await page.goto('/landing');
    
    // Click sign-up button
    const signUpButton = page.locator('text=Get Started').first();
    await signUpButton.click();
    
    // Should navigate to sign-up page
    await expect(page).toHaveURL(/sign-up/);
  });

  test('should display all sections', async ({ page }) => {
    await page.goto('/landing');
    
    // Check all major sections are present
    await expect(page.locator('text=Features').first()).toBeVisible();
    await expect(page.locator('text=How It Works').first()).toBeVisible();
    await expect(page.locator('text=Testimonials').first()).toBeVisible();
    await expect(page.locator('text=FAQ').first()).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/landing');
    
    // Check mobile menu button exists
    const mobileMenu = page.locator('[aria-label="Menu"]').or(page.locator('button:has-text("Menu")'));
    await expect(mobileMenu).toBeVisible();
  });
});

