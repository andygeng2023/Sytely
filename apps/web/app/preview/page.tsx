"use client";

import { useEffect, useState } from "react";
import { SytelyRenderer } from "@sytely/renderer";
import type {
  Site,
  SiteWorkspace
} from "@sytely/types";

export default function PreviewPage() {
  const [site, setSite] =
    useState<Site | null>(null);
  const [error, setError] =
    useState(false);

  useEffect(() => {
    try {
      const raw =
        window.localStorage.getItem(
          "sytely-workspace"
        );

      if (!raw) return;

      const workspace =
        JSON.parse(raw) as SiteWorkspace;

      const params =
        new URLSearchParams(
          window.location.search
        );

      const siteId =
        params.get("site") ??
        workspace.activeSiteId;

      const site =
        workspace.sites.find(
          (item) =>
            item.id === siteId
        ) ?? workspace.sites[0];

      if (site) setSite(site);
    } catch {
      setError(true);
    }
  }, []);

  if (error) {
    return (
      <main className="preview-error">
        Could not load this preview.
      </main>
    );
  }

  if (!site) {
    return (
      <main className="preview-error">
        No saved website yet.{" "}
        <a href="/editor">
          Open the editor
        </a>
        .
      </main>
    );
  }

  const params =
    new URLSearchParams(
      window.location.search
    );

  const slug =
    params.get("page") ?? "/";

  const page =
    site.pages.find(
      (item) =>
        item.slug === slug
    ) ?? site.pages[0];

  if (!page) return null;

  return (
    <main
      className={`preview-site theme-${site.theme}`}
      data-sytely-theme={
        site.theme
      }
      style={{
        background: String(
          page.styles?.background ??
            (site.theme === "dark"
              ? "#111113"
              : "#fff")
        ),
        color:
          site.theme === "dark"
            ? "#f7f7f8"
            : "#171719",
        paddingTop:
          page.margins.top,
        paddingRight:
          page.margins.right,
        paddingBottom:
          page.margins.bottom + 96,
        paddingLeft:
          page.margins.left,
        minHeight: "100vh",
        boxSizing: "border-box"
      }}
    >
      <SytelyRenderer
        nodes={page.components}
        theme={site.theme}
      />
    </main>
  );
}