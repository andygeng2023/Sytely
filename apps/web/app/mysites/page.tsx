"use client";

import {
  useEffect,
  useState,
} from "react";

import type { Site } from "@sytely/types";

import "./mysites.css";

const KEY =
  "sytely-sites";

const LEGACY =
  "sytely-site";

const makeId = () =>
  typeof crypto !==
    "undefined" &&
  crypto.randomUUID
    ? crypto.randomUUID()
    : `site-${Date.now()}`;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") ||
  "website";

function starter(
  name: string
): Site {
  const siteId =
    makeId();

  const pageId =
    makeId();

  const sectionId =
    makeId();

  return {
    id: siteId,
    name,
    slug: slugify(name),
    version: 1,
    theme: "system",
    pages: [
      {
        id: pageId,
        name: "Home",
        slug: "/",
        margins: {
          top: 0,
          right: 32,
          bottom: 0,
          left: 32,
        },
        styles: {
          background:
            "var(--sytely-page)",
        },
        components: [
          {
            id: sectionId,
            type: "section",
            props: {},
            styles: {
              display: "flex",
              flexDirection:
                "column",
              gap: 20,
              padding:
                "72px 48px",
              background:
                "var(--sytely-surface)",
            },
            children: [
              {
                id: makeId(),
                type: "heading",
                props: {
                  text: name,
                },
                styles: {
                  fontSize: 52,
                  fontWeight: 750,
                  maxWidth: 760,
                },
              },
              {
                id: makeId(),
                type: "text",
                props: {
                  text:
                    "Build and publish a polished responsive website with Sytely.",
                },
                styles: {
                  fontSize: 18,
                  maxWidth: 650,
                },
              },
              {
                id: makeId(),
                type: "button",
                props: {
                  text:
                    "Get started",
                  linkTo: "#",
                },
                styles: {},
              },
            ],
          },
        ],
      },
    ],
  };
}

function readSites(): Site[] {
  try {
    const raw =
      localStorage.getItem(
        KEY
      );

    if (raw) {
      const parsed =
        JSON.parse(raw);

      if (Array.isArray(parsed)) {
        return parsed;
      }
    }

    const legacy =
      localStorage.getItem(
        LEGACY
      );

    if (legacy) {
      const parsed =
        JSON.parse(legacy);

      if (parsed) {
        return [parsed];
      }
    }
  } catch {
    // Ignore malformed storage.
  }

  return [
    starter("My Website"),
  ];
}

export default function MySitesPage() {
  const [sites, setSites] =
    useState<Site[]>([]);

  useEffect(() => {
    const loaded =
      readSites();

    setSites(loaded);

    localStorage.setItem(
      KEY,
      JSON.stringify(loaded)
    );
  }, []);

  const create = () => {
    const name =
      window
        .prompt(
          "Website name",
          `Website ${
            sites.length + 1
          }`
        )
        ?.trim();

    if (!name) {
      return;
    }

    const site =
      starter(name);

    const next = [
      ...sites,
      site,
    ];

    setSites(next);

    localStorage.setItem(
      KEY,
      JSON.stringify(next)
    );
  };

  const remove = (
    site: Site
  ) => {
    if (
      !window.confirm(
        `Delete “${site.name}”?`
      )
    ) {
      return;
    }

    const next =
      sites.filter(
        item =>
          item.id !== site.id
      );

    setSites(next);

    localStorage.setItem(
      KEY,
      JSON.stringify(next)
    );
  };

  return (
    <main className="mysites-page">
      <header className="mysites-header">
        <a
          className="mysites-brand"
          href="/"
        >
          <span>S</span>
          Sytely
        </a>

        <button
          className="mysites-create"
          onClick={create}
        >
          + New website
        </button>
      </header>

      <section className="mysites-content">
        <div className="mysites-intro">
          <div>
            <p>
              WORKSPACE
            </p>

            <h1>
              Your websites
            </h1>

            <span>
              Open a site to edit it
              visually.
            </span>
          </div>

          <strong>
            {sites.length} site
            {sites.length ===
            1
              ? ""
              : "s"}
          </strong>
        </div>

        <div className="site-grid">
          {sites.map(site => (
            <article
              className="site-card"
              key={site.id}
            >
              <a
                href={`/${
                  site.slug ||
                  slugify(
                    site.name
                  )
                }/editor`}
                className="site-card-open"
              >
                <div className="site-preview">
                  <div className="preview-line" />

                  <div className="preview-boxes">
                    <i />
                    <i />
                    <i />
                  </div>

                  <div className="preview-line short" />
                </div>

                <div className="site-card-info">
                  <h2>
                    {site.name}
                  </h2>

                  <span>
                    /
                    {site.slug ||
                      slugify(
                        site.name
                      )}
                  </span>
                </div>
              </a>

              <button
                className="site-delete"
                onClick={() =>
                  remove(site)
                }
              >
                ×
              </button>
            </article>
          ))}

          <button
            className="new-site-card"
            onClick={create}
          >
            <span>+</span>
            <strong>
              Create website
            </strong>
            <small>
              Start from a blank site
            </small>
          </button>
        </div>
      </section>
    </main>
  );
}