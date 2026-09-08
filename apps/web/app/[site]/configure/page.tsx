"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Site } from "@sytely/types";

const STORAGE_SITES = "sytely-sites";
const STORAGE_LEGACY = "sytely-site";

export default function ConfigurePage() {
  const params = useParams<{ site: string }>();
  const router = useRouter();
  const [site, setSite] = useState<Site | null>(null);
  const [mode, setMode] = useState<"sytely" | "custom">("sytely");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SITES);
      const sites = raw ? JSON.parse(raw) as Site[] : [];
      const slug = String(params.site).toLowerCase();
      const found = sites.find((item) =>
        (item.slug ?? item.name).toLowerCase() === slug ||
        item.id.toLowerCase() === slug
      );
      if (found) {
        setSite(found);
        setMode(found.layoutMode ?? "sytely");
      }
    } catch {
      setSite(null);
    }
  }, [params.site]);

  const continueToEditor = () => {
    if (!site) return;
    const next: Site = { ...site, layoutMode: mode };
    try {
      const raw = localStorage.getItem(STORAGE_SITES);
      const sites = raw ? JSON.parse(raw) as Site[] : [];
      const updated = sites.some((item) => item.id === next.id)
        ? sites.map((item) => item.id === next.id ? next : item)
        : [...sites, next];
      localStorage.setItem(STORAGE_SITES, JSON.stringify(updated));
      localStorage.setItem(STORAGE_LEGACY, JSON.stringify(next));
    } catch {
      // The editor will still open and can save later.
    }
    router.push(`/${site.slug}/editor`);
  };

  if (!site) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <strong>Website not found</strong>
          <button type="button" onClick={() => router.push("/mysites")} style={styles.button}>
            Back to websites
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.header}>
          <span style={styles.brand}>Sytely</span>
          <span style={styles.step}>Website setup</span>
        </div>

        <div style={styles.content}>
          <div>
            <p style={styles.eyebrow}>New website</p>
            <h1 style={styles.title}>How do you want to design it?</h1>
            <p style={styles.subtitle}>
              You can change this later from Website settings.
            </p>
          </div>

          <div style={styles.options}>
            <button
              type="button"
              onClick={() => setMode("sytely")}
              style={{
                ...styles.option,
                ...(mode === "sytely" ? styles.optionSelected : {}),
              }}
            >
              <span style={styles.icon}>▦</span>
              <span style={styles.optionText}>
                <strong>Sytely Design</strong>
                <small>Structured sections, automatic columns and responsive flow.</small>
              </span>
              <span style={styles.radio}>{mode === "sytely" ? "●" : "○"}</span>
            </button>

            <button
              type="button"
              onClick={() => setMode("custom")}
              style={{
                ...styles.option,
                ...(mode === "custom" ? styles.optionSelected : {}),
              }}
            >
              <span style={styles.icon}>✥</span>
              <span style={styles.optionText}>
                <strong>Custom Design</strong>
                <small>Free canvas positioning with x and y coordinates, like a design tool.</small>
              </span>
              <span style={styles.radio}>{mode === "custom" ? "●" : "○"}</span>
            </button>
          </div>

          <button type="button" onClick={continueToEditor} style={styles.continue}>
            Continue to editor →
          </button>
        </div>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#f5f6f8",
    color: "#111827",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    padding: 24,
    boxSizing: "border-box",
  } as CSSProperties,
  shell: {
    width: "min(720px, 100%)",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    boxShadow: "0 18px 60px rgb(0 0 0 / 8%)",
    overflow: "hidden",
  } as CSSProperties,
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 22px",
    borderBottom: "1px solid #eef0f2",
  } as CSSProperties,
  brand: { fontWeight: 800, fontSize: 14 } as CSSProperties,
  step: { color: "#6b7280", fontSize: 11 } as CSSProperties,
  content: { padding: 34 } as CSSProperties,
  card: { padding: 30, display: "grid", gap: 10 } as CSSProperties,
  eyebrow: { margin: 0, color: "#6b7280", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em" } as CSSProperties,
  title: { margin: "7px 0 7px", fontSize: 30, lineHeight: 1.15 } as CSSProperties,
  subtitle: { margin: 0, color: "#6b7280", fontSize: 13 } as CSSProperties,
  options: { display: "grid", gap: 10, marginTop: 28 } as CSSProperties,
  option: {
    display: "grid",
    gridTemplateColumns: "38px 1fr 24px",
    alignItems: "center",
    gap: 14,
    width: "100%",
    padding: 18,
    textAlign: "left",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#e1e4e8",
    borderRadius: 12,
    background: "#fff",
    color: "#111827",
    cursor: "pointer",
  } as CSSProperties,
  optionSelected: { borderWidth: 2, borderStyle: "solid", borderColor: "#111827", padding: 17 } as CSSProperties,
  icon: { display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 9, background: "#f3f4f6", fontSize: 18 } as CSSProperties,
  optionText: { display: "grid", gap: 4 } as CSSProperties,
  radio: { fontSize: 14, textAlign: "center" } as CSSProperties,
  continue: {
    marginTop: 22,
    width: "100%",
    border: "1px solid #111827",
    borderRadius: 9,
    padding: "11px 14px",
    background: "#111827",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  } as CSSProperties,
  button: { marginTop: 14, padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" } as CSSProperties,
} as const;
