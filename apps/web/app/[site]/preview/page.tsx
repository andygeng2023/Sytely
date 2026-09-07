"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useSearchParams,
} from "next/navigation";

import {
  SytelyRenderer,
} from "@sytely/renderer";

import type { Site } from "@sytely/types";

import "./preview.css";

const SITES_KEY =
  "sytely-sites";

const LEGACY_KEY =
  "sytely-site";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") ||
  "website";

export default function PreviewPage() {
  const {
    site: routeSite,
  } =
    useParams<{
      site: string;
    }>();

  const params =
    useSearchParams();

  const [site, setSite] =
    useState<Site | null>(null);

  const [error, setError] =
    useState("");

  const requestedPage =
    params.get("page") || "/";

  const device =
    params.get("device") ===
      "mobile" ||
    params.get("device") ===
      "tablet"
      ? (params.get(
          "device"
        ) as
          | "mobile"
          | "tablet")
      : "desktop";

  useEffect(() => {
    try {
      let sites: Site[] = [];

      const raw =
        localStorage.getItem(
          SITES_KEY
        );

      if (raw) {
        const parsed =
          JSON.parse(raw);

        if (Array.isArray(parsed)) {
          sites = parsed;
        }
      }

      if (!sites.length) {
        const legacy =
          localStorage.getItem(
            LEGACY_KEY
          );

        if (legacy) {
          const parsed =
            JSON.parse(legacy);

          if (parsed) {
            sites = [parsed];
          }
        }
      }

      const found =
        sites.find(item => {
          const slug =
            (
              item as Site & {
                slug?: string;
              }
            ).slug ||
            slugify(item.name);

          return (
            slug === routeSite ||
            item.id === routeSite ||
            slugify(item.name) ===
              routeSite
          );
        });

      if (!found) {
        setError(
          "Website not found."
        );
        return;
      }

      setSite(found);
    } catch {
      setError(
        "Unable to load preview."
      );
    }
  }, [routeSite]);

  const page = useMemo(
    () =>
      site?.pages.find(
        item =>
          item.slug ===
          requestedPage
      ) ??
      site?.pages[0] ??
      null,
    [site, requestedPage]
  );

  if (error) {
    return (
      <main className="preview-state">
        <div>
          <h1>
            {error}
          </h1>

          <a href="/mysites">
            Back to My Sites
          </a>
        </div>
      </main>
    );
  }

  if (!site || !page) {
    return (
      <main className="preview-state">
        Loading preview…
      </main>
    );
  }

  return (
    <main
      className={`sytely-preview ${device}`}
    >
      <div
        className="preview-page"
        style={{
          background:
            typeof page.styles
              ?.background ===
            "string"
              ? page.styles
                  .background
              : undefined,
          paddingTop:
            page.margins.top,
          paddingRight:
            page.margins.right,
          paddingBottom:
            page.margins.bottom,
          paddingLeft:
            page.margins.left,
        }}
      >
        <SytelyRenderer
          nodes={
            page.components
          }
          device={device}
        />
      </div>
    </main>
  );
}