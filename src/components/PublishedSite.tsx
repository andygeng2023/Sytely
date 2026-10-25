import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { supabase } from "../lib/supabase";

type SiteNode = { id: string; type: string; name: string; text: string; parentId: string | null; visible: boolean; href?: string; openInNewTab?: boolean; src?: string; styles?: Record<string, string | number | undefined> };
type Site = { name: string; slug: string; document: { nodes?: SiteNode[] }; published_at: string | null };

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
      else setSite(data as Site);
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
      color: typeof styles.color === "string" ? styles.color : undefined,
      background: typeof styles.background === "string" ? styles.background : undefined,
      fontSize: typeof styles.fontSize === "number" ? styles.fontSize : undefined,
      padding: typeof styles.padding === "number" ? styles.padding : undefined,
      borderRadius: typeof styles.radius === "number" ? styles.radius : undefined,
      textAlign: styles.align === "left" || styles.align === "right" ? styles.align : "center",
      width: typeof styles.width === "string" && styles.width !== "Auto" ? styles.width : undefined,
      boxSizing: "border-box",
      maxWidth: "100%",
    };
    const nested = children(node.id).map(child => <div key={child.id}>{renderNode(child)}</div>);
    if (node.type === "heading") return <h1 key={node.id} style={style}>{node.text}</h1>;
    if (node.type === "paragraph") return <p key={node.id} style={style}>{node.text}</p>;
    if (node.type === "button") return <a key={node.id} className="published-button" href={node.href || "#"} target={node.openInNewTab ? "_blank" : undefined} rel={node.openInNewTab ? "noreferrer" : undefined} onClick={event => { if (!node.href) event.preventDefault(); }} style={style}>{node.text}</a>;
    if (node.type === "image") return node.src ? <img key={node.id} className="published-image" style={{ ...style, display: "block", objectFit: "cover" }} src={node.src} alt={node.text} /> : <div key={node.id} className="published-image" style={style} role="img" aria-label={node.text}>{node.text || "Image placeholder"}</div>;
    return <section key={node.id} className={node.type === "feature" ? "published-feature" : "published-section"} style={style}>{node.type === "feature" && <strong>{node.text}</strong>}{node.type !== "feature" && node.text && <p>{node.text}</p>}{nested}</section>;
  };
  return <main className="published-site"><header className="published-header"><a href="./" className="published-brand">{site.name}</a></header><article className="published-content">{children(null).map(node => <div key={node.id}>{renderNode(node)}</div>)}</article><footer className="published-footer">Published with Sytely</footer></main>;
}
