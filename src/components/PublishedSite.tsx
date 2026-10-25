import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { supabase } from "../lib/supabase";

type SiteNode = { id: string; type: string; name: string; text: string; parentId: string | null; visible: boolean; href?: string; openInNewTab?: boolean; src?: string; ariaLabel?: string; semantic?: string; styles?: Record<string, string | number | undefined>; responsive?: Record<string, Record<string, string | number | undefined> | undefined> };
type PublishedPage = { id: string; name: string; nodes: SiteNode[] };
type Site = { name: string; slug: string; document: { nodes?: SiteNode[]; pages?: PublishedPage[] }; published_at: string | null };

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
  if (url.length <= 1_500_000 && /^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/]+=*$/i.test(url)) return url;
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
    if (node.src !== undefined && (typeof node.src !== "string" || node.src.length > 1_500_000)) return false;
    if (node.responsive !== undefined) {
      if (!node.responsive || typeof node.responsive !== "object" || Array.isArray(node.responsive)) return false;
      for (const breakpoint of ["tablet", "mobile"] as const) {
        const override = node.responsive[breakpoint];
        if (override !== undefined && (!override || typeof override !== "object" || Array.isArray(override))) return false;
      }
    }
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
  const [activePageId, setActivePageId] = useState("");
  useEffect(() => {
    let active = true;
    if (!supabase) { setError("Site service is not configured."); return; }
    void supabase.rpc("get_sytely_published_site", { site_slug: slug }).then(({ data, error: queryError }) => {
      if (!active) return;
      if (queryError) setError("This site could not be loaded.");
      else if (!data) setError("This site does not exist or has not been published.");
      else {
        const candidate = data as Site;
        const validPages = candidate?.document?.pages === undefined ||
          (Array.isArray(candidate.document.pages) && candidate.document.pages.length > 0 && candidate.document.pages.length <= 50 &&
            candidate.document.pages.every(page => !!page && typeof page.id === "string" && page.id.length <= 120 &&
              typeof page.name === "string" && page.name.length <= 80 && isSafeNodeTree(page.nodes)));
        if (!candidate || typeof candidate.name !== "string" || typeof candidate.slug !== "string" ||
            !candidate.document || !isSafeNodeTree(candidate.document.nodes) || !validPages) setError("This published site contains invalid content.");
        else setSite(candidate);
      }
    });
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (!site) return;
    const pages = site.document.pages;
    if (!Array.isArray(pages) || pages.length === 0) { setActivePageId(""); return; }
    const hashId = decodeURIComponent(window.location.hash.replace(/^#page-/, ""));
    setActivePageId(current => pages.some(page => page.id === current) ? current : pages.find(page => page.id === hashId)?.id ?? pages[0].id);
  }, [site]);

  if (error) return <main className="published-message"><h1>Site unavailable</h1><p>{error}</p><a href="./">Open Sytely Studio</a></main>;
  if (!site) return <main className="published-message"><p>Loading published site…</p></main>;
  const storedPages = Array.isArray(site.document.pages) && site.document.pages.length > 0
    ? site.document.pages
    : [{ id: "home", name: site.name, nodes: Array.isArray(site.document?.nodes) ? site.document.nodes : [] }];
  const activePage = storedPages.find(page => page.id === activePageId) ?? storedPages[0];
  const nodes = activePage?.nodes ?? [];
  const children = (parentId: string | null) => nodes.filter(node => node.parentId === parentId && node.visible !== false);
  const cssValue = (styles?: Record<string, string | number | undefined>) => {
    if (!styles) return "";
    const declarations: string[] = [];
    if (typeof styles.color === "string" && /^#[0-9a-f]{3,8}$/i.test(styles.color)) declarations.push(`color:${styles.color}`);
    if (typeof styles.background === "string" && /^#[0-9a-f]{3,8}$/i.test(styles.background)) declarations.push(`background:${styles.background}`);
    for (const key of ["fontSize", "padding", "radius"] as const) {
      const value = styles[key];
      const max = key === "fontSize" ? 128 : key === "padding" ? 200 : 100;
      if (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max) declarations.push(`${key === "radius" ? "border-radius" : key === "fontSize" ? "font-size" : "padding"}:${value}px`);
    }
    if (styles.align === "left" || styles.align === "center" || styles.align === "right") declarations.push(`text-align:${styles.align}`);
    if (typeof styles.width === "string" && ["100%", "Fit content", "320px"].includes(styles.width)) declarations.push(`width:${styles.width === "Fit content" ? "fit-content" : styles.width}`);
    if (typeof styles.height === "string" && ["100%", "320px", "480px"].includes(styles.height)) declarations.push(`height:${styles.height}`);
    return declarations.join(";");
  };
  const responsiveCss = nodes.flatMap(node => (["tablet", "mobile"] as const).map(breakpoint => {
    const override = cssValue(node.responsive?.[breakpoint]);
    const className = node.id.replace(/[^a-zA-Z0-9_-]/g, "");
    return override ? `@${breakpoint === "tablet" ? "media (max-width: 900px)" : "media (max-width: 600px)"}{.published-node-${className}{${override}}}` : "";
  })).filter(Boolean).join("\n");
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
    const nodeClass = `published-node-${node.id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
    if (node.type === "heading") { const HeadingTag = node.semantic === "h2" ? "h2" : node.semantic === "h3" ? "h3" : "h1"; return <HeadingTag key={node.id} className={nodeClass} style={style} aria-label={node.ariaLabel || undefined}>{node.text}</HeadingTag>; }
    if (node.type === "paragraph") return <p key={node.id} className={nodeClass} style={style} aria-label={node.ariaLabel || undefined}>{node.text}</p>;
    if (node.type === "button") return <a key={node.id} className={`published-button ${nodeClass}`} href={safeLink(node.href) || "#"} aria-label={node.ariaLabel || undefined} target={node.openInNewTab ? "_blank" : undefined} rel={node.openInNewTab ? "noreferrer" : undefined} onClick={event => { if (!safeLink(node.href)) event.preventDefault(); }} style={style}>{node.text}</a>;
    if (node.type === "image") return safeImageSource(node.src) ? <img key={node.id} className={`published-image ${nodeClass}`} style={{ ...style, display: "block", objectFit: "cover" }} src={safeImageSource(node.src)} alt={node.text} /> : <div key={node.id} className={`published-image ${nodeClass}`} style={style} role="img" aria-label={node.ariaLabel || node.text}>{node.text || "Image placeholder"}</div>;
    return <section key={node.id} className={`${node.type === "feature" ? "published-feature" : "published-section"} ${nodeClass}`} style={style}>{node.type === "feature" && <strong>{node.text}</strong>}{node.type !== "feature" && node.text && <p>{node.text}</p>}{nested}</section>;
  };
  return <main className="published-site"><style>{responsiveCss}</style><header className="published-header"><a href="./" className="published-brand">{site.name}</a>{storedPages.length > 1 && <nav className="published-page-nav" aria-label="Website pages">{storedPages.map(page => <a key={page.id} href={`#page-${encodeURIComponent(page.id)}`} aria-current={page.id === activePage?.id ? "page" : undefined} onClick={event => { event.preventDefault(); setActivePageId(page.id); window.history.replaceState(null, "", `#page-${encodeURIComponent(page.id)}`); }}>{page.name}</a>)}</nav>}</header><article className="published-content">{children(null).map(node => <div key={node.id}>{renderNode(node)}</div>)}</article><footer className="published-footer">Published with Sytely</footer></main>;
}
