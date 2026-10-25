import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { supabase } from "../lib/supabase";

type SiteNode = { id: string; type: string; name: string; text: string; parentId: string | null; visible: boolean; href?: string; openInNewTab?: boolean; src?: string; ariaLabel?: string; semantic?: string; styles?: Record<string, string | number | undefined> };
type Site = { name: string; slug: string; document: { nodes?: SiteNode[] }; published_at: string | null };

function safeLink(value?: string): string | undefined {
  if (!value) return undefined;
  const url = value.trim();
  if (/^(https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i.test(url) && !url.startsWith("//")) return url;
  return undefined;
}

function safeImageSource(value?: string): string | undefined {
  if (!value) return undefined;
  const url = value.trim();
  if (/^https?:\/\//i.test(url) || /^(\/|\.\/|\.\.\/)/.test(url) && !url.startsWith("//")) return url;
  return undefined;
}

function isSafeNodeTree(value: unknown): value is SiteNode[] {
  if (!Array.isArray(value) || value.length > 2000) return false;
  const ids = new Set<string>();
  const types = new Set(["heading", "paragraph", "button", "section", "image", "feature", "container"]);
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object") return false;
    const node = candidate as Partial<SiteNode>;
    if (typeof node.id !== "string" || !node.id || ids.has(node.id) ||
        typeof node.type !== "string" || !types.has(node.type) ||
        typeof node.name !== "string" || node.name.length > 160 ||
        typeof node.text !== "string" || node.text.length > 20000 ||
        !(node.parentId === null || typeof node.parentId === "string") ||
        typeof node.visible !== "boolean") return false;
    ids.add(node.id);
  }
  for (const node of value as SiteNode[]) {
    if (node.parentId !== null && !ids.has(node.parentId)) return false;
    const ancestors = new Set([node.id]);
    let parentId = node.parentId;
    while (parentId !== null) {
      if (ancestors.has(parentId)) return false;
      ancestors.add(parentId);
      const parent = (value as SiteNode[]).find(item => item.id === parentId);
      if (!parent) return false;
      parentId = parent.parentId;
    }
  }
  return true;
}

export default function PublishedSite({ slug }: { slug: string }) {
  const [site, setSite] = useState<Site | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    if (!supabase) { setError("Site service is not configured."); return; }
    void supabase.rpc("get_sytely_published_site", { site_slug: slug }).then(({ data, error: queryError }) => {
      if (!active) return;
      if (queryError) setError("This site could not be loaded.");
      else if (!data) setError("This site does not exist or has not been published.");
      else {
        const candidate = data as Site;
        if (!candidate || typeof candidate.name !== "string" || typeof candidate.slug !== "string" || !candidate.document || !isSafeNodeTree(candidate.document.nodes)) setError("This published site contains invalid content.");
        else setSite(candidate);
      }
    });
    return () => { active = false; };
  }, [slug]);

  if (error) return <main className="published-message"><h1>Site unavailable</h1><p>{error}</p><a href="./">Open Sytely Studio</a></main>;
  if (!site) return <main className="published-message"><p>Loading published site…</p></main>;
  const nodes = Array.isArray(site.document?.nodes) ? site.document.nodes : [];
  const children = (parentId: string | null) => nodes.filter(node => node.parentId === parentId && node.visible !== false);
  const renderNode = (node: SiteNode): ReactNode => {
    const styles = node.styles ?? {};
    const style: CSSProperties = {
      color: typeof styles.color === "string" && /^#[0-9a-f]{3,8}$/i.test(styles.color) ? styles.color : undefined,
      background: typeof styles.background === "string" && /^#[0-9a-f]{3,8}$/i.test(styles.background) ? styles.background : undefined,
      fontSize: typeof styles.fontSize === "number" && Number.isFinite(styles.fontSize) && styles.fontSize >= 0 && styles.fontSize <= 128 ? styles.fontSize : undefined,
      padding: typeof styles.padding === "number" && Number.isFinite(styles.padding) && styles.padding >= 0 && styles.padding <= 200 ? styles.padding : undefined,
      borderRadius: typeof styles.radius === "number" && Number.isFinite(styles.radius) && styles.radius >= 0 && styles.radius <= 100 ? styles.radius : undefined,
      textAlign: styles.align === "left" || styles.align === "right" || styles.align === "center" ? styles.align : "center",
      width: typeof styles.width === "string" && ["100%", "Fit content", "320px"].includes(styles.width) ? styles.width === "Fit content" ? "fit-content" : styles.width : undefined,
      height: typeof styles.height === "string" && ["100%", "320px", "480px"].includes(styles.height) ? styles.height : undefined,
      boxSizing: "border-box",
      maxWidth: "100%",
    };
    const nested = children(node.id).map(child => <div key={child.id}>{renderNode(child)}</div>);
    if (node.type === "heading") { const HeadingTag = node.semantic === "h2" ? "h2" : node.semantic === "h3" ? "h3" : "h1"; return <HeadingTag key={node.id} style={style} aria-label={node.ariaLabel || undefined}>{node.text}</HeadingTag>; }
    if (node.type === "paragraph") return <p key={node.id} style={style} aria-label={node.ariaLabel || undefined}>{node.text}</p>;
    if (node.type === "button") return <a key={node.id} className="published-button" href={safeLink(node.href) || "#"} aria-label={node.ariaLabel || undefined} target={node.openInNewTab ? "_blank" : undefined} rel={node.openInNewTab ? "noreferrer" : undefined} onClick={event => { if (!safeLink(node.href)) event.preventDefault(); }} style={style}>{node.text}</a>;
    if (node.type === "image") return safeImageSource(node.src) ? <img key={node.id} className="published-image" style={{ ...style, display: "block", objectFit: "cover" }} src={safeImageSource(node.src)} alt={node.text} /> : <div key={node.id} className="published-image" style={style} role="img" aria-label={node.ariaLabel || node.text}>{node.text || "Image placeholder"}</div>;
    return <section key={node.id} className={node.type === "feature" ? "published-feature" : "published-section"} style={style}>{node.type === "feature" && <strong>{node.text}</strong>}{node.type !== "feature" && node.text && <p>{node.text}</p>}{nested}</section>;
  };
  return <main className="published-site"><header className="published-header"><a href="./" className="published-brand">{site.name}</a></header><article className="published-content">{children(null).map(node => <div key={node.id}>{renderNode(node)}</div>)}</article><footer className="published-footer">Published with Sytely</footer></main>;
}
