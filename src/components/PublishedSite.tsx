import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { supabase } from "../lib/supabase";

type SiteInteraction = { trigger: "click"; action: "navigatePage" | "scrollTo" | "toggleVisibility" | "setText"; targetId?: string; targetPageId?: string; value?: string };
type SiteNode = { id: string; type: string; name: string; text: string; parentId: string | null; visible: boolean; href?: string; openInNewTab?: boolean; src?: string; ariaLabel?: string; semantic?: string; interaction?: SiteInteraction; styles?: Record<string, string | number | undefined>; responsive?: Record<string, Record<string, string | number | undefined> | undefined> };
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
    if (node.interaction !== undefined) {
      const action = node.interaction as SiteInteraction;
      if (!action || action.trigger !== "click" || !["navigatePage", "scrollTo", "toggleVisibility", "setText"].includes(action.action) ||
          (action.targetId !== undefined && (typeof action.targetId !== "string" || action.targetId.length > 120)) ||
          (action.targetPageId !== undefined && (typeof action.targetPageId !== "string" || action.targetPageId.length > 120)) ||
          (action.value !== undefined && (typeof action.value !== "string" || action.value.length > 20000))) return false;
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
  const [runtimeOverrides, setRuntimeOverrides] = useState<Record<string, { visible?: boolean; text?: string }>>({});
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
  const children = (parentId: string | null) => nodes.filter(node => node.parentId === parentId && node.visible !== false && runtimeOverrides[node.id]?.visible !== false);
  const runInteraction = (node: SiteNode, event: React.MouseEvent) => {
    const action = node.interaction;
    if (!action) return;
    event.stopPropagation();
    if (action.action === "navigatePage") {
      const page = storedPages.find(item => item.id === action.targetPageId);
      if (!page) { event.preventDefault(); return; }
      event.preventDefault(); setRuntimeOverrides({}); setActivePageId(page.id);
      window.history.replaceState(null, "", `#page-${encodeURIComponent(page.id)}`);
    } else if (action.action === "scrollTo" && action.targetId) {
      event.preventDefault();
      document.getElementById(`published-node-${action.targetId.replace(/[^a-zA-Z0-9_-]/g, "")}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (action.action === "toggleVisibility" && action.targetId) {
      event.preventDefault();
      const target = nodes.find(item => item.id === action.targetId);
      setRuntimeOverrides(current => ({ ...current, [action.targetId!]: { ...current[action.targetId!], visible: !(current[action.targetId!]?.visible ?? target?.visible ?? true) } }));
    } else if (action.action === "setText" && action.targetId) {
      event.preventDefault();
      setRuntimeOverrides(current => ({ ...current, [action.targetId!]: { ...current[action.targetId!], text: action.value ?? "" } }));
    }
  };
  const actionProps = (node: SiteNode) => node.interaction ? { onClick: (event: React.MouseEvent) => runInteraction(node, event) } : {};
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
    if (styles.display === "flex") declarations.push("display:flex");
    if (styles.display === "grid") declarations.push(`display:grid;grid-template-columns:repeat(${Number.isInteger(styles.gridColumns) && Number(styles.gridColumns) >= 1 && Number(styles.gridColumns) <= 12 ? styles.gridColumns : 2},minmax(0,1fr))`);
    if (styles.display === "block") declarations.push("display:block");
    if (typeof styles.gap === "number" && Number.isFinite(styles.gap) && styles.gap >= 0 && styles.gap <= 200) declarations.push(`gap:${styles.gap}px`);
    if (styles.flexDirection === "row" || styles.flexDirection === "column") declarations.push(`flex-direction:${styles.flexDirection}`);
    if (styles.justifyContent && ["start","center","end","between","around"].includes(String(styles.justifyContent))) declarations.push(`justify-content:${({start:"flex-start",center:"center",end:"flex-end",between:"space-between",around:"space-around"} as Record<string,string>)[String(styles.justifyContent)]}`);
    if (styles.alignItems && ["start","center","end","stretch"].includes(String(styles.alignItems))) declarations.push(`align-items:${({start:"flex-start",center:"center",end:"flex-end",stretch:"stretch"} as Record<string,string>)[String(styles.alignItems)]}`);
    if (styles.flexWrap === "wrap" || styles.flexWrap === "nowrap") declarations.push(`flex-wrap:${styles.flexWrap}`);
    return declarations.join(";");
  };
  const responsiveCss = nodes.flatMap(node => (["tablet", "mobile"] as const).map(breakpoint => {
    const override = cssValue(node.responsive?.[breakpoint]);
    const className = node.id.replace(/[^a-zA-Z0-9_-]/g, "");
    if (!override) return "";
    const responsiveDeclarations = override.split(";").filter(Boolean).map(declaration => `${declaration} !important`).join(";");
    return `@${breakpoint === "tablet" ? "media (max-width: 900px)" : "media (max-width: 600px)"}{.published-node-${className}{${responsiveDeclarations}}}`;
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
      display: styles.display === "flex" || styles.display === "grid" || styles.display === "block" ? styles.display : undefined,
      gap: typeof styles.gap === "number" && Number.isFinite(styles.gap) && styles.gap >= 0 && styles.gap <= 200 ? styles.gap : undefined,
      flexDirection: styles.flexDirection === "row" || styles.flexDirection === "column" ? styles.flexDirection : undefined,
      justifyContent: styles.justifyContent === "start" ? "flex-start" : styles.justifyContent === "end" ? "flex-end" : styles.justifyContent === "between" ? "space-between" : styles.justifyContent === "around" ? "space-around" : styles.justifyContent === "center" ? "center" : undefined,
      alignItems: styles.alignItems === "start" ? "flex-start" : styles.alignItems === "end" ? "flex-end" : ["center","stretch"].includes(String(styles.alignItems)) ? styles.alignItems as "center" | "stretch" : undefined,
      flexWrap: styles.flexWrap === "wrap" || styles.flexWrap === "nowrap" ? styles.flexWrap : undefined,
      gridTemplateColumns: styles.display === "grid" ? `repeat(${Number.isInteger(styles.gridColumns) && Number(styles.gridColumns) >= 1 && Number(styles.gridColumns) <= 12 ? styles.gridColumns : 2}, minmax(0, 1fr))` : undefined,
      boxSizing: "border-box",
      maxWidth: "100%",
    };
    const nested = children(node.id).map(child => <div key={child.id}>{renderNode(child)}</div>);
    const nodeClass = `published-node-${node.id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
    if (runtimeOverrides[node.id]?.visible === false) return null;
    const text = runtimeOverrides[node.id]?.text ?? node.text;
    const nodeId = `published-node-${node.id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
    if (node.type === "heading") { const HeadingTag = node.semantic === "h2" ? "h2" : node.semantic === "h3" ? "h3" : "h1"; return <HeadingTag key={node.id} id={nodeId} className={nodeClass} style={style} aria-label={node.ariaLabel || undefined} {...actionProps(node)}>{text}</HeadingTag>; }
    if (node.type === "paragraph") return <p key={node.id} id={nodeId} className={nodeClass} style={style} aria-label={node.ariaLabel || undefined} {...actionProps(node)}>{text}</p>;
    if (node.type === "button") return <a key={node.id} id={nodeId} className={`published-button ${nodeClass}`} href={safeLink(node.href) || "#"} aria-label={node.ariaLabel || undefined} target={node.openInNewTab ? "_blank" : undefined} rel={node.openInNewTab ? "noreferrer" : undefined} onClick={event => { if (node.interaction) runInteraction(node, event); else if (!safeLink(node.href)) event.preventDefault(); }} style={style}>{text}</a>;
    if (node.type === "image") return safeImageSource(node.src) ? <img key={node.id} id={nodeId} className={`published-image ${nodeClass}`} style={{ ...style, display: "block", objectFit: "cover" }} src={safeImageSource(node.src)} alt={text} {...actionProps(node)} /> : <div key={node.id} id={nodeId} className={`published-image ${nodeClass}`} style={style} role="img" aria-label={node.ariaLabel || text} {...actionProps(node)}>{text || "Image placeholder"}</div>;
    return <section key={node.id} id={nodeId} className={`${node.type === "feature" ? "published-feature" : "published-section"} ${nodeClass}`} style={style} {...actionProps(node)}>{node.type === "feature" && <strong>{text}</strong>}{node.type !== "feature" && text && <p>{text}</p>}{nested}</section>;
  };
  return <main className="published-site"><style>{responsiveCss}</style><header className="published-header"><a href="./" className="published-brand">{site.name}</a>{storedPages.length > 1 && <nav className="published-page-nav" aria-label="Website pages">{storedPages.map(page => <a key={page.id} href={`#page-${encodeURIComponent(page.id)}`} aria-current={page.id === activePage?.id ? "page" : undefined} onClick={event => { event.preventDefault(); setRuntimeOverrides({}); setActivePageId(page.id); window.history.replaceState(null, "", `#page-${encodeURIComponent(page.id)}`); }}>{page.name}</a>)}</nav>}</header><article className="published-content">{children(null).map(node => <div key={node.id}>{renderNode(node)}</div>)}</article><footer className="published-footer">Published with Sytely</footer></main>;
}
