// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SiteAudit } from "./SiteAudit";

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe("SiteAudit", () => {
  it("reports actionable accessibility and content issues across pages", async () => {
    await act(async () => {
      root.render(createElement(SiteAudit, {
        pages: [
          { id: "home", name: "Home", nodes: [
            { id: "image-1", type: "image", name: "Hero image", text: "", parentId: null, visible: true },
            { id: "button-1", type: "button", name: "Primary CTA", text: "", parentId: null, visible: true },
            { id: "copy-1", type: "paragraph", name: "Empty paragraph", text: "", parentId: null, visible: true },
          ] },
          { id: "about", name: "About", nodes: [
            { id: "heading-1", type: "heading", name: "About heading", text: "About us", parentId: null, visible: true, semantic: "h2" },
          ] },
        ],
        onSelect: vi.fn(),
      }));
    });
    expect(host.textContent).toContain("Image needs alternative text");
    expect(host.textContent).toContain("Image source is missing");
    expect(host.textContent).toContain("Button needs an accessible name");
    expect(host.textContent).toContain("Button has no action");
    expect(host.textContent).toContain("Empty text element");
    expect(host.textContent).toContain("Add a primary heading");
    expect(host.textContent).toContain("Home");
    expect(host.textContent).toContain("About");
    expect(host.textContent).toContain("errors");
  });

  it("lets a user jump directly to the element that needs fixing", async () => {
    const onSelect = vi.fn();
    await act(async () => {
      root.render(createElement(SiteAudit, {
        pages: [{ id: "home", name: "Home", nodes: [
          { id: "image-1", type: "image", name: "Hero image", text: "", parentId: null, visible: true },
        ] }],
        onSelect,
      }));
    });
    const fixButton = host.querySelector('button[aria-label="Select Hero image to fix Image needs alternative text"]') as HTMLButtonElement;
    expect(fixButton).toBeTruthy();
    await act(async () => { fixButton.click(); });
    expect(onSelect).toHaveBeenCalledWith("home", "image-1");
  });

  it("flags explicit text and background colors with insufficient contrast", async () => {
    await act(async () => {
      root.render(createElement(SiteAudit, {
        pages: [{ id: "home", name: "Home", nodes: [
          { id: "heading-1", type: "heading", name: "Low contrast heading", text: "Hard to read", parentId: null, visible: true, styles: { color: "#aaaaaa", background: "#ffffff", fontSize: 16 } },
        ] }],
        onSelect: vi.fn(),
      }));
    });
    expect(host.textContent).toContain("Text contrast may be too low");
    expect(host.textContent).toContain("2.32:1");
  });

  it("shows a clean state when no heuristic issues are detected", async () => {
    await act(async () => {
      root.render(createElement(SiteAudit, {
        pages: [{ id: "home", name: "Home", nodes: [
          { id: "heading-1", type: "heading", name: "Main heading", text: "Welcome", parentId: null, visible: true },
          { id: "button-1", type: "button", name: "Contact", text: "Contact us", parentId: null, visible: true, href: "mailto:hello@example.com" },
        ] }],
        onSelect: vi.fn(),
      }));
    });
    expect(host.textContent).toContain("No issues found in these checks");
    expect(host.querySelector(".audit-issue")).toBeNull();
  });
});
