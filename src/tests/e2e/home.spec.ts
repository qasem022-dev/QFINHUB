import { test, expect } from "@playwright/test";

test.describe("QFINHUB Homepage", () => {
  test("should display the correct title and navigation", async ({ page }) => {
    await page.goto("/");

    // Check page title
    await expect(page).toHaveTitle(/QFINHUB/);

    // Check hero section
    await expect(
      page.getByRole("heading", { name: /Finance Toolkit/i }),
    ).toBeVisible();

    // Check navigation buttons
    await expect(
      page.getByRole("link", { name: /Explore Calculators/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Try AI Specialist/i }),
    ).toBeVisible();
  });

  test("should navigate to calculators page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Explore Calculators/i }).click();
    await page.waitForURL("**/calculators");
    await expect(page).toHaveTitle(/Financial Calculators/);
  });

  test("should show calculator cards on calculators page", async ({
    page,
  }) => {
    await page.goto("/calculators");
    // Check that calculator cards are rendered
    const cards = page.locator("h3").filter({ hasText: /Calculator|Interest|Loan|Retirement/i });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should navigate to AI Specialist page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Try AI Specialist/i }).click();
    await page.waitForURL("**/ai-specialist");
    await expect(page.getByText(/AI Financial Specialist/i)).toBeVisible();
  });

  test("should show auth pages", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();

    await page.goto("/auth/signup");
    await expect(
      page.getByRole("heading", { name: /Create your account/i }),
    ).toBeVisible();
  });

  test("should show legal pages", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: /Privacy Policy/i })).toBeVisible();

    await page.goto("/terms");
    await expect(
      page.getByRole("heading", { name: /Terms of Service/i }),
    ).toBeVisible();
  });
});
