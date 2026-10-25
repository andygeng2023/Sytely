import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".canvas-workspace")).toBeVisible();
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
  await expect(sectionLayout).toHaveAttribute("style", /grid-template-columns:\s*repeat\(3/);
});

test("style inspector applies typography and responsive overrides to the canvas", async ({ page, isMobile }) => {
  test.skip(isMobile, "The full editor inspector is desktop-oriented; mobile canvas coverage is tested separately.");
  const heading = page.locator(".site-content h1").first();
  await page.getByRole("button", { name: "Layers", exact: true }).click();
  await page.locator(".layer-row").filter({ hasText: "Heading" }).first().click();
  await page.getByRole("button", { name: "Style", exact: true }).click();
  await page.getByLabel("Font family").selectOption("Georgia");
  await page.getByLabel("Text transform").selectOption("uppercase");
  await expect(heading).toHaveCSS("font-family", /Georgia/);
  await expect(heading).toHaveCSS("text-transform", "uppercase");

  await page.locator('.viewport-switcher button[aria-label="Tablet viewport"]').click();
  await page.getByLabel("Font family").selectOption("Arial");
  await expect(heading).toHaveCSS("font-family", /Arial/);
  await expect(heading).toHaveAttribute("style", /font-family:\s*Arial/i);
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
  expect(download.suggestedFilename()).toMatch(/\.html$/i);
});

test("site audit flags missing image alt text and selects the element to fix", async ({ page, isMobile }) => {
  test.skip(isMobile, "The full editor inspector is desktop-oriented; mobile canvas coverage is tested separately.");
  await page.getByRole("button", { name: "Image", exact: true }).click();
  await page.getByLabel("Text content").fill("");
  await page.getByRole("button", { name: "Audit", exact: true }).click();
  await expect(page.getByText("Image needs alternative text")).toBeVisible();
  await page.getByRole("button", { name: /Select Image to fix Image needs alternative text/ }).click();
  await expect(page.getByRole("heading", { name: "Accessibility" })).toBeVisible();
  await expect(page.getByPlaceholder("Describe the image")).toBeVisible();
});

test("mobile viewport keeps the editor canvas usable", async ({ page, isMobile }) => {
  test.skip(!isMobile, "This check is specific to mobile browser emulation.");
  await expect(page.locator(".site-content")).toBeVisible();
  // Trigger the viewport control directly: on narrow emulated screens the toolbar can be
  // partially clipped, which makes pointer-based clicks unreliable despite the control existing.
  await page.locator('.viewport-switcher button[aria-label="Mobile viewport"]').evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.locator(".website-page")).toHaveClass(/mobile/);
  await expect(page.locator(".canvas-stage")).toHaveCSS("width", "390px");
});
