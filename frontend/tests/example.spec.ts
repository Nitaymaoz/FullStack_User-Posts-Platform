import { test, expect } from '@playwright/test';

test('toggle mode', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  await page.click('button[name="change_theme"]');
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');
  
  await page.click('button[name="change_theme"]');
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'light');
});

test('First button exists', async ({ page }) => {

  await page.goto('http://localhost:3000');

 const firstButton = page.locator('button[name="first"]');
 
 await expect(firstButton).toBeVisible();
});

test('last button exists', async ({ page }) => {

  await page.goto('http://localhost:3000');

 const lastButton = page.locator('button[name="last"]');
 
 await expect(lastButton).toBeVisible();
});

test('change theme button exists', async ({ page }) => {

  await page.goto('http://localhost:3000');

 const changeTheme = page.locator('button[name="change_theme"]');
 
 await expect(changeTheme).toBeVisible();
});

test('login form exists', async ({ page }) => {

  await page.goto('http://localhost:3000');

  const loginForm = page.locator('form[name="login_form"]');
 
 await expect(loginForm).toBeVisible();
});