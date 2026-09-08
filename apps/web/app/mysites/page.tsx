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

const uid = () =>
  typeof crypto !==
    "undefined" &&
  crypto.randomUUID
    ? crypto.randomUUID()
    : `site-${Date.now()}`;

function starter(): Site {
  return {
    id: uid(),
    name: "My Website",
    slug: `my-website-${Date.now().toString(
      36
    )}`,
    version: 1,
    theme: "system",
    layoutMode: "sytely",
    pages: [
      {
        id: uid(),
        name: "Home",
        slug: "/",
        margins: {
          top: 0,
          right: 32,
          bottom: 0,
          left: 32,
        },
        components: [],
      },
    ],
  };
}

export default function MySitesPage() {
  const [sites, setSites] =
    useState<Site[]>([]);

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(
          KEY
        );

      if (raw) {
        const parsed: unknown =
          JSON.parse(raw);

        if (
          Array.isArray(parsed)
        ) {
          setSites(
            parsed as Site[]
          );
          return;
        }
      }

      const legacy =
        localStorage.getItem(
          LEGACY
        );

      if (legacy) {
        const parsed: unknown =
          JSON.parse(legacy);

        if (
          parsed &&
          typeof parsed ===
            "object"
        ) {
          setSites([
            parsed as Site,
          ]);
        }
      }
    } catch {
      setSites([]);
    }
  }, []);

  const persist = (
    next: Site[]
  ) => {
    setSites(next);

    localStorage.setItem(
      KEY,
      JSON.stringify(next)
    );
  };

  const create = () => {
    const site =
      starter();

    persist([
      ...sites,
      site,
    ]);

    window.location.href =
      `/${site.slug}/configure`;
  };

  const remove = (
    id: string
  ) => {
    if (
      !window.confirm(
        "Delete this website?"
      )
    ) {
      return;
    }

    persist(
      sites.filter(
        (site) =>
          site.id !== id
      )
    );
  };

  return (
    <main className="mysites">
      <header>
        <div>
          <span>
            Sytely
          </span>

          <h1>
            My websites
          </h1>

          <p>
            Choose a website to
            edit.
          </p>
        </div>

        <button
          type="button"
          onClick={create}
        >
          New website
        </button>
      </header>

      <section className="site-grid">
        {sites.map(
          (site) => (
            <article
              key={site.id}
            >
              <div className="site-preview">
                <div className="preview-bars" />
                <div className="preview-lines" />
                <div className="preview-card" />
              </div>

              <div className="site-meta">
                <div>
                  <strong>
                    {site.name}
                  </strong>

                  <small>
                    /
                    {site.slug ||
                      slugify(
                        site.name
                      )}
                  </small>
                </div>

                <div>
                  <a
                    href={`/${
                      site.slug ||
                      slugify(
                        site.name
                      )
                    }/editor`}
                  >
                    Open
                  </a>

                  <button
                    type="button"
                    onClick={() =>
                      remove(
                        site.id
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          )
        )}

        {!sites.length && (
          <div className="empty">
            <strong>
              No websites yet.
            </strong>

            <button
              type="button"
              onClick={
                create
              }
            >
              Create your first
              website
            </button>
          </div>
        )}
      </section>
    </main>
  );
}