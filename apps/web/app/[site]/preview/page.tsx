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

type Device =
  | "desktop"
  | "tablet"
  | "mobile";

const SITES =
  "sytely-sites";

const LEGACY =
  "sytely-site";

const slugify = (
  value: string
) =>
  value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      "") ||
  "website";

export default function PreviewPage() {
  const params =
    useParams<{
      site: string;
    }>();

  const query =
    useSearchParams();

  const [site, setSite] =
    useState<Site | null>(
      null
    );

  const [error, setError] =
    useState("");

  const device: Device =
    query.get("device") ===
      "tablet" ||
    query.get("device") ===
      "mobile"
      ? (query.get(
          "device"
        ) as Device)
      : "desktop";

  const requestedPage =
    query.get("page") ??
    "/";

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(
          SITES
        );

      const legacy =
        localStorage.getItem(
          LEGACY
        );

      let sites: Site[] =
        [];

      if (raw) {
        const parsed: unknown =
          JSON.parse(raw);

        if (
          Array.isArray(parsed)
        ) {
          sites =
            parsed as Site[];
        }
      }

      if (
        !sites.length &&
        legacy
      ) {
        const parsed: unknown =
          JSON.parse(legacy);

        if (
          parsed &&
          typeof parsed ===
            "object"
        ) {
          sites = [
            parsed as Site,
          ];
        }
      }

      const slug =
        params.site;

      const found =
        sites.find(
          (item) =>
            item.id ===
              slug ||
            item.slug ===
              slug ||
            slugify(
              item.name
            ) === slug
        );

      if (!found) {
        setError(
          "Website not found."
        );
      } else {
        setSite(found);
      }
    } catch {
      setError(
        "Unable to load preview."
      );
    }
  }, [params.site]);

  const page = useMemo(
    () =>
      site?.pages.find(
        (item) =>
          item.slug ===
          requestedPage
      ) ??
      site?.pages[0] ??
      null,
    [
      site,
      requestedPage,
    ]
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
      className={`preview device-${device}`}
    >
      <div
        className="preview-page"
        style={{
          background:
            typeof page
              .styles
              ?.background ===
            "string"
              ? page
                  .styles
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
          device={
            device
          }
        />
      </div>
    </main>
  );
}