// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import App from "./App";

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  window.localStorage.clear();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
});

describe("Sytely Studio editor smoke tests", () => {
  it("renders the editor shell and starter website", async () => {
    await act(async () => {
      root.render(createElement(App));
    });
    expect(host.textContent).toContain("sytely");
    expect(host.textContent).toContain("Add elements");
    expect(host.textContent).toContain("Build something remarkable.");
    expect(host.textContent).toContain("Get started");
  });

  it("inserts an element from the Add catalogue", async () => {
    await act(async () => {
      root.render(createElement(App));
    });
    const button = Array.from(host.querySelectorAll("button")).find(
      (item) => item.textContent?.includes("Heading") && item.classList.contains("element-tile"),
    );
    expect(button).toBeTruthy();
    await act(async () => {
      button!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(host.textContent).toContain("Your heading");
  });

  it("saves the document to local storage", async () => {
    await act(async () => {
      root.render(createElement(App));
    });
    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
    });
    const saved = window.localStorage.getItem("sytely:document:v1");
    expect(saved).toBeTruthy();
    expect(JSON.parse(saved!)).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "hero", type: "section" }),
    ]));
  });
  it("duplicates a selected section together with its descendants", async () => {
    await act(async () => { root.render(createElement(App)); });
    const layers = host.querySelector('button[aria-label="Layers"]') as HTMLButtonElement;
    await act(async () => { layers.click(); });
    const heroRow = Array.from(host.querySelectorAll(".layer-row")).find(row => row.textContent?.includes("Hero section")) as HTMLElement;
    expect(heroRow).toBeTruthy();
    await act(async () => { heroRow.click(); });
    const duplicate = host.querySelector('button[title="Duplicate element"]') as HTMLButtonElement;
    await act(async () => { duplicate.click(); });
    const repeatedHeadings = Array.from(host.querySelectorAll(".site-section h1")).filter(el => el.textContent === "Build something remarkable.");
    expect(repeatedHeadings).toHaveLength(2);
    expect(host.textContent).toContain("Hero section copy");
  });

  it("supports undo and redo for inserted elements", async () => {
    await act(async () => { root.render(createElement(App)); });
    const heading = Array.from(host.querySelectorAll("button.element-tile")).find(el => el.textContent?.includes("Heading")) as HTMLButtonElement;
    await act(async () => { heading.click(); });
    expect(host.textContent).toContain("Your heading");
    const undo = host.querySelector('button[title="Undo (Ctrl/Cmd+Z)"]') as HTMLButtonElement;
    await act(async () => { undo.click(); });
    expect(host.textContent).not.toContain("Your heading");
    const redo = host.querySelector('button[title="Redo (Ctrl/Cmd+Shift+Z)"]') as HTMLButtonElement;
    await act(async () => { redo.click(); });
    expect(host.textContent).toContain("Your heading");
  });

  it("hides invisible elements in preview mode", async () => {
    await act(async () => { root.render(createElement(App)); });
    await act(async () => { (host.querySelector('button[aria-label="Layers"]') as HTMLButtonElement).click(); });
    const buttonRow = Array.from(host.querySelectorAll(".layer-row")).find(row => row.textContent?.includes("Primary button")) as HTMLElement;
    expect(buttonRow).toBeTruthy();
    const hide = buttonRow.querySelector('button[title="Hide layer"]') as HTMLButtonElement;
    await act(async () => { hide.click(); });
    await act(async () => { (host.querySelector(".preview-button") as HTMLButtonElement).click(); });
    expect(Array.from(host.querySelectorAll(".site-content .site-cta")).some(el => el.textContent?.includes("Get started"))).toBe(false);
  });

  it("recovers from cyclic or structurally invalid saved documents", async () => {
    window.localStorage.setItem("sytely:document:v1", JSON.stringify([
      { id: "a", type: "section", name: "A", text: "", parentId: "b", visible: true, locked: false, styles: {} },
      { id: "b", type: "container", name: "B", text: "", parentId: "a", visible: true, locked: false, styles: {} },
    ]));
    await act(async () => { root.render(createElement(App)); });
    expect(host.textContent).toContain("Build something remarkable.");
  });

  it("inserts dragged elements into the section they are dropped onto", async () => {
    await act(async () => { root.render(createElement(App)); });
    const data = new Map<string, string>();
    const dataTransfer = { setData: (key: string, value: string) => data.set(key, value), getData: (key: string) => data.get(key) ?? "", effectAllowed: "move", dropEffect: "move" };
    const heading = Array.from(host.querySelectorAll("button.element-tile")).find(el => el.textContent?.includes("Heading")) as HTMLButtonElement;
    const dragStart = new Event("dragstart", { bubbles: true, cancelable: true });
    Object.defineProperty(dragStart, "dataTransfer", { value: dataTransfer });
    await act(async () => { heading.dispatchEvent(dragStart); });
    const target = host.querySelector(".site-section") as HTMLElement;
    const drop = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(drop, "dataTransfer", { value: dataTransfer });
    await act(async () => { target.dispatchEvent(drop); });
    await act(async () => { await new Promise(resolve => window.setTimeout(resolve, 500)); });
    const saved = JSON.parse(window.localStorage.getItem("sytely:document:v1") ?? "[]") as Array<{ type: string; text: string; parentId: string | null }>;
    expect(saved.some(node => node.type === "heading" && node.text === "Your heading" && node.parentId === "hero")).toBe(true);
  });

  it("applies a real editable template instead of adding an empty section", async () => {
    await act(async () => { root.render(createElement(App)); });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await act(async () => { (host.querySelector('button[aria-label="Templates"]') as HTMLButtonElement).click(); });
    const template = Array.from(host.querySelectorAll("button.resource-row")).find(el => el.textContent?.includes("Portfolio starter")) as HTMLButtonElement;
    expect(template).toBeTruthy();
    await act(async () => { template.click(); });
    expect(host.textContent).toContain("I build thoughtful digital experiences.");
    expect(host.textContent).toContain("Selected projects");
  });

  it("applies a button URL property in preview", async () => {
    await act(async () => { root.render(createElement(App)); });
    const linkInput = host.querySelector('input[placeholder="https://example.com"]') as HTMLInputElement;
    expect(linkInput).toBeTruthy();
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    await act(async () => {
      setter?.call(linkInput, "https://example.com");
      linkInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => { (host.querySelector(".preview-button") as HTMLButtonElement).click(); });
    expect(host.querySelector(".site-content .site-cta")?.getAttribute("href")).toBe("https://example.com");
  });

  it("does not allow script URLs to become preview links", async () => {
    window.localStorage.setItem("sytely:document:v1", JSON.stringify([
      { id: "unsafe-button", type: "button", name: "Unsafe link", text: "Open", parentId: null, visible: true, locked: false, href: "javascript:alert(1)", styles: {} },
    ]));
    await act(async () => { root.render(createElement(App)); });
    await act(async () => { (host.querySelector(".preview-button") as HTMLButtonElement).click(); });
    expect(host.querySelector(".site-content .site-cta")?.getAttribute("href")).toBeNull();
  });

  it("rejects malformed style values from local draft storage", async () => {
    window.localStorage.setItem("sytely:document:v1", JSON.stringify([
      { id: "broken-style", type: "heading", name: "Broken", text: "Invalid style", parentId: null, visible: true, locked: false, styles: { fontSize: {} } },
    ]));
    await act(async () => { root.render(createElement(App)); });
    expect(host.textContent).toContain("Build something remarkable.");
    expect(host.textContent).not.toContain("Invalid style");
  });

  it("does not render unsafe image URL schemes", async () => {
    window.localStorage.setItem("sytely:document:v1", JSON.stringify([
      { id: "unsafe-image", type: "image", name: "Unsafe image", text: "Alternative text", parentId: null, visible: true, locked: false, src: "javascript:alert(1)", styles: {} },
    ]));
    await act(async () => { root.render(createElement(App)); });
    expect(host.querySelector('img[src^="javascript:"]')).toBeNull();
    expect(host.textContent).toContain("Add an image URL in Properties");
  });

});
