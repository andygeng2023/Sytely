"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Site, SiteLayoutMode } from "@sytely/types";

const KEY = "sytely-sites";
const LEGACY = "sytely-site";

function readSites(): Site[] {
  try {
    const raw = localStorage.getItem(KEY);

    if (raw) {
      const parsed: unknown = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        return parsed as Site[];
      }
    }

    const legacy = localStorage.getItem(LEGACY);

    if (legacy) {
      return [JSON.parse(legacy) as Site];
    }
  } catch {
    return [];
  }

  return [];
}

function slugFor(site: Site): string {
  return (
    site.slug ||
    site.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") ||
    "website"
  );
}

export default function ConfigurePage() {
  const params = useParams<{ site: string }>();
  const router = useRouter();

  const [site, setSite] = useState<Site | null>(null);
  const [mode, setMode] = useState<SiteLayoutMode>("sytely");

  const requestedSlug = useMemo(
    () => String(params.site || "").toLowerCase(),
    [params.site],
  );

  useEffect(() => {
    const found =
      readSites().find((item) => {
        const slug = slugFor(item).toLowerCase();

        return (
          slug === requestedSlug ||
          item.id.toLowerCase() === requestedSlug ||
          item.name.toLowerCase() === requestedSlug
        );
      }) ?? null;

    if (!found) {
      router.replace("/mysites");
      return;
    }

    setSite(found);
    setMode(found.layoutMode ?? "sytely");
  }, [requestedSlug, router]);

  const continueToEditor = () => {
    if (!site) return;

    const next: Site = {
      ...site,
      layoutMode: mode,
    };

    const sites = readSites();
    const updated = sites.some((item) => item.id === next.id)
      ? sites.map((item) => (item.id === next.id ? next : item))
      : [...sites, next];

    localStorage.setItem(KEY, JSON.stringify(updated));
    localStorage.setItem(LEGACY, JSON.stringify(next));

    router.push(`/${slugFor(next)}/editor`);
  };

  if (!site) {
    return null;
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.brand}>Sytely</div>

        <h1 style={styles.title}>Configure your website</h1>
        <p style={styles.subtitle}>
          Choose the layout system you want to use. You can change this later in Website settings.
        </p>

        <div style={styles.options}>
          <button
            type="button"
            onClick={() => setMode("sytely")}
            style={{
              ...styles.option,
              ...(mode === "sytely" ? styles.optionActive : {}),
            }}
          >
            <span style={styles.icon}>▦</span>
            <span>
              <strong style={styles.optionTitle}>Sytely Design</strong>
              <small style={styles.optionText}>
                Structured sections, automatic columns and guided layout.
              </small>
            </span>
            <span style={styles.radio}>{mode === "sytely" ? "●" : "○"}</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("custom")}
            style={{
              ...styles.option,
              ...(mode === "custom" ? styles.optionActive : {}),
            }}
          >
            <span style={styles.icon}>✦</span>
            <span>
              <strong style={styles.optionTitle}>Custom Design</strong>
              <small style={styles.optionText}>
                A flexible layout mode for designs that need more control.
              </small>
            </span>
            <span style={styles.radio}>{mode === "custom" ? "●" : "○"}</span>
          </button>
        </div>

        <div style={styles.actions}>
          <button
            type="button"
            style={styles.back}
            onClick={() => router.push("/mysites")}
          >
            Back
          </button>

          <button
            type="button"
            style={styles.continue}
            onClick={continueToEditor}
          >
            Continue to editor
          </button>
        </div>
      </section>

      <style>{`
        @media (max-width: 700px) {
          .sytely-config-page {
            padding: 24px !important;
          }
          .sytely-config-card {
            padding: 24px !important;
          }
        }
      `}</style>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    boxSizing: "border-box" as const,
    display: "grid",
    placeItems: "center",
    padding: 32,
    background: "#f3f4f6",
    color: "#111827",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  card: {
    width: "min(680px, 100%)",
    boxSizing: "border-box" as const,
    padding: 36,
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    background: "#fff",
    boxShadow: "0 18px 50px rgb(0 0 0 / 8%)",
  },
  brand: {
    fontSize: 12,
    fontWeight: 750,
    marginBottom: 28,
  },
  title: {
    margin: 0,
    fontSize: 26,
    lineHeight: 1.15,
    letterSpacing: "-0.03em",
  },
  subtitle: {
    margin: "10px 0 24px",
    color: "#6b7280",
    fontSize: 12,
    lineHeight: 1.6,
  },
  options: {
    display: "grid",
    gap: 9,
  },
  option: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "28px 1fr 20px",
    alignItems: "center",
    gap: 12,
    padding: "15px 16px",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    background: "#fff",
    color: "#111827",
    textAlign: "left" as const,
    cursor: "pointer",
  },
  optionActive: {
    borderColor: "#111827",
    boxShadow: "0 0 0 1px #111827",
  },
  icon: {
    width: 28,
    height: 28,
    display: "grid",
    placeItems: "center",
    borderRadius: 7,
    background: "#f3f4f6",
    fontSize: 15,
  },
  optionTitle: {
    display: "block",
    fontSize: 12,
  },
  optionText: {
    display: "block",
    marginTop: 3,
    color: "#6b7280",
    fontSize: 10,
    lineHeight: 1.4,
  },
  radio: {
    color: "#111827",
    fontSize: 14,
    textAlign: "center" as const,
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 24,
  },
  back: {
    padding: "9px 13px",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    background: "#fff",
    color: "#111827",
    fontSize: 11,
    cursor: "pointer",
  },
  continue: {
    padding: "9px 14px",
    border: "1px solid #111827",
    borderRadius: 8,
    background: "#111827",
    color: "#fff",
    fontSize: 11,
    fontWeight: 650,
    cursor: "pointer",
  },
} as const;
