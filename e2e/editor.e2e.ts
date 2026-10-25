import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Build something remarkable.")).toBeVisible();
});

test("layout controls apply flex and grid styles to the selected element", async ({ page }) => {
  await page.getByRole("button", { name: "Layout", exact: true }).click();
  await page.getByLabel("Layout display").selectOption("flex");
  await page.getByLabel("Layout gap").fill("18");
  await expect(page.locator(".site-content .site-cta")).toHaveCSS("display", "flex");
  await expect(page.locator(".site-content .site-cta")).toHaveCSS("gap", "18px");

  await page.getByLabel("Layout display").selectOption("grid");
  await page.getByLabel("Grid columns").selectOption("3");
  await expect(page.locator(".site-content .site-cta")).toHaveCSS("display", "grid");
  await expect(page.locator(".site-content .site-cta")).toHaveCSS("grid-template-columns", /repeat\(3/);
});

test("saves and inserts a reusable component with unique element IDs", async ({ page }) => {
  await page.getByRole("button", { name: "Components", exact: true }).click();
  await page.getByLabel("Component name").fill("Primary CTA");
  await page.getByRole("button", { name: "Save selected element and children" }).click();
  await expect(page.getByText("Primary CTA", { exact: true })).toBeVisible();

  await page.locator(".component-insert").filter({ hasText: "Primary CTA" }).click();
  await expect(page.locator(".site-content .site-cta")).toHaveCount(2);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("sytely:components:v1") ?? "[]").length)).toBe(1);
});

test("runs a configured click action in preview mode", async ({ page }) => {
  await page.getByRole("button", { name: "Interactions", exact: true }).click();
  await page.getByLabel("Click action").selectOption("setText");
  await page.getByLabel("Interaction target element").selectOption({ label: "Heading" });
  await page.getByLabel("Replacement text").fill("Interaction runtime works");

  await page.getByRole("button", { name: "Preview" }).click();
  await page.locator(".site-content .site-cta").click();
  await expect(page.getByRole("heading", { name: "Interaction runtime works" })).toBeVisible();
});

test("exports a standalone HTML file from the editor", async ({ page }) => {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export site" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.html$/i);
});
