"use client";

import {
  useEffect,
  useState
} from "react";
import { SytelyRenderer } from "@sytely/renderer";
import type { Site } from "@sytely/types";
import "./preview.css";

export default function PreviewPage() {
  const [site, setSite] =
    useState<Site | null>(null);

  const [pageSlug, setPageSlug] =
    useState("/");

  const [error, setError] =
    useState(false);

  useEffect(() => {
    try {
      const params =
        new URLSearchParams(
          window.location.search
        );

      setPageSlug(
        params.get("page") ?? "/"
      );

      const siteId =
        params.get("site");

      const rawSites =
        window.localStorage.getItem(
          "sytely-sites"
        );

      const legacy =
        window.localStorage.getItem(
          "sytely-site"
        );

      const sites = rawSites
        ? (JSON.parse(
            rawSites
          ) as Site[])
        : legacy
          ? [
              JSON.parse(
                legacy
              ) as Site
            ]
          : [];

      const active =
        sites.find(
          (item) =>
            item.id === siteId
        ) ??
        sites.find(
          (item) =>
            item.id ===
            window.localStorage.getItem(
              "sytely-active-site"
            )
        ) ??
        sites[0] ??
        null;

      setSite(active);
    } catch {
      setError(true);
    }
  }, []);

  if (error) {
    return (
      <main className="preview-message">
        Could not load this preview.
      </main>
    );
  }

  if (!site) {
    return (
      <main className="preview-message">
        No saved site yet.{" "}
        <a href="/editor">
          Open the editor
        </a>
        .
      </main>
    );
  }

  const page =
    site.pages.find(
      (item) =>
        item.slug === pageSlug
    ) ?? site.pages[0];

  const theme = String(
    page.styles?.theme ??
      "system"
  );

  const background =
    String(
      page.styles?.background ??
        "var(--sytely-page)"
    );

  return (
    <main
      className="preview-root"
      data-sytely-theme={theme}
    >
      <header className="preview-nav">
        <strong>
          {site.name}
        </strong>

        <nav>
          {site.pages.map(
            (item) => (
              <a
                key={item.id}
                href={`/preview?site=${encodeURIComponent(
                  site.id
                )}&page=${encodeURIComponent(
                  item.slug
                )}`}
              >
                {item.name}
              </a>
            )
          )}
        </nav>
      </header>

      <div
        className="preview-page"
        style={{
          background,
          paddingTop:
            page.margins.top,
          paddingRight:
            page.margins.right,
          paddingBottom:
            page.margins.bottom +
            96,
          paddingLeft:
            page.margins.left
        }}
      >
        <SytelyRenderer
          nodes={page.components}
        />
      </div>
    </main>
  );
}