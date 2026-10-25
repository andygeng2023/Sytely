import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import App from "./App";

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  window.localStorage.clear();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
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
});
