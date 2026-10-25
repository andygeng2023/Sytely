import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Build something remarkable.")).toBeVisible();
});

test("layout controls apply flex and grid styles to the selected element", async ({ page, isMobile }) => {
  test.skip(isMobile, "The full editor inspector is desktop-oriented; mobile canvas coverage is tested separately.");
  await page.getByRole("button", { name: "Layers", exact: true }).click();
  await page.locator(".layer-row").filter({ hasText: "Hero section" }).first().click();
  await page.getByRole("button", { name: "Layout", exact: true }).click();
  const sectionLayout = page.locator(".site-content .site-section .container-placeholder").first();
  await page.getByLabel("Layout display").selectOption("flex");
  await page.getByLabel("Layout gap").fill("18");
  await expect(sectionLayout).toHaveCSS("display", "flex");
  await expect(sectionLayout).toHaveCSS("gap", "18px");

  await page.getByLabel("Layout display").selectOption("grid");
  await page.getByLabel("Grid columns").selectOption("3");
  await expect(sectionLayout).toHaveCSS("display", "grid");
  await expect(sectionLayout).toHaveAttribute("style", /grid-template-columns:\\s*repeat\\(3/);
});

test("saves and inserts a reusable component with unique element IDs", async ({ page, isMobile }) => {
  test.skip(isMobile, "The full editor inspector is desktop-oriented; mobile canvas coverage is tested separately.");
  await page.locator(".site-content .site-cta").first().click();
  await page.getByRole("button", { name: "Components", exact: true }).click();
  await page.getByLabel("Component name").fill("Primary CTA");
  await page.getByRole("button", { name: "Save selected element and children" }).click();
  const savedComponent = page.locator(".component-insert").filter({ hasText: "Primary CTA" });
  await expect(savedComponent).toBeVisible();

  await savedComponent.click();
  await expect(page.locator(".site-content .site-cta")).toHaveCount(2);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("sytely:components:v1") ?? "[]").length)).toBe(1);
});

test("runs a configured click action in preview mode", async ({ page, isMobile }) => {
  test.skip(isMobile, "The full editor inspector is desktop-oriented; mobile canvas coverage is tested separately.");
  await page.locator(".site-content .site-cta").first().click();
  await page.getByRole("button", { name: "Interactions", exact: true }).click();
  await page.getByLabel("Click action").selectOption("setText");
  await page.getByLabel("Interaction target element").selectOption({ label: "Heading" });
  await page.getByLabel("Replacement text").fill("Interaction runtime works");

  await page.getByRole("button", { name: "Preview" }).click();
  await page.locator(".site-content .site-cta").click();
  await expect(page.getByRole("heading", { name: "Interaction runtime works" })).toBeVisible();
});

test("exports a standalone HTML file from the editor", async ({ page, isMobile }) => {
  test.skip(isMobile, "HTML export is covered in desktop browser projects; mobile canvas coverage is tested separately.");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export site" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\\.html$/i);
});

test("mobile viewport keeps the editor canvas usable", async ({ page, isMobile }) => {
  test.skip(!isMobile, "This check is specific to mobile browser emulation.");
  await expect(page.locator(".site-content")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Build something remarkable." })).toBeVisible();
  await page.getByLabel("Mobile viewport").click();
  await expect(page.locator(".canvas-stage")).toHaveCSS("width", "390px");
});
