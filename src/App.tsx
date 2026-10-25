import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CloudAccount } from "./components/CloudAccount";
import {
  Accessibility, AlignCenter, AlignLeft, ArrowDown, ArrowLeft, ArrowRight, ArrowUp,
  Bold, Box, Braces, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp,
  Code2, Columns2, Copy, Database, Eye, FileText, FolderOpen, FormInput, Globe,
  Grid2X2, Hand, Heading, Image, Layers, LayoutTemplate, Link2, List, Lock,
  MoreHorizontal, MousePointer2, PanelLeftClose, PanelRightClose, Plus, Redo2,
  Search, Settings2, Shapes, Smartphone, Sparkles, Square, Tablet, Type, Undo2,
  Upload, WandSparkles, X, Zap, Monitor, Paintbrush, Workflow, MessageSquare,
  Play, ChevronUp, Trash2, ExternalLink, AlignJustify, CircleDot, SlidersHorizontal
} from "lucide-react";

type NodeKind = "heading" | "paragraph" | "button" | "section" | "image" | "feature" | "container";
type StyleSet = { color?: string; background?: string; fontSize?: number; padding?: number; radius?: number; align?: string; width?: string; height?: string; display?: "block" | "flex" | "grid"; gap?: number; flexDirection?: "row" | "column"; justifyContent?: "start" | "center" | "end" | "between" | "around"; alignItems?: "start" | "center" | "end" | "stretch"; flexWrap?: "nowrap" | "wrap"; gridColumns?: number };
type NodeInteraction = { trigger: "click"; action: "navigatePage" | "scrollTo" | "toggleVisibility" | "setText"; targetId?: string; targetPageId?: string; value?: string };
type PageNode = {
  id: string;
  type: NodeKind;
  name: string;
  text: string;
  parentId: string | null;
  visible: boolean;
  locked: boolean;
  href?: string;
  openInNewTab?: boolean;
  src?: string;
  ariaLabel?: string;
  semantic?: string;
  interaction?: NodeInteraction;
  styles: StyleSet;
  responsive?: Partial<Record<Breakpoint, Partial<StyleSet>>>;
};
type PageSnapshot = { id: string; name: string; nodes: PageNode[] };
type ReusableComponent = { id: string; name: string; nodes: PageNode[] };
type Breakpoint = "tablet" | "mobile";
type Workspace = "Add" | "Layers" | "Templates" | "Databases" | "Components" | "Collaboration" | "Add-ons";
type InspectorMode = "Properties" | "Layout" | "Style" | "Responsive" | "Interactions" | "Backend" | "Accessibility" | "Advanced";
type BackendTab = "Blocks" | "Code" | "Data" | "Events" | "Console";

const initialNodes: PageNode[] = [
  { id: "hero", type: "section", name: "Hero section", text: "", parentId: null, visible: true, locked: false, styles: { background: "#ffffff", padding: 56, align: "center" } },
  { id: "hero-kicker", type: "paragraph", name: "Eyebrow", text: "INTRODUCING SYTELY STUDIO", parentId: "hero", visible: true, locked: false, styles: { color: "#6b63d9", fontSize: 11, align: "center" } },
  { id: "hero-heading", type: "heading", name: "Heading", text: "Build something remarkable.", parentId: "hero", visible: true, locked: false, styles: { color: "#171827", fontSize: 42, align: "center" } },
  { id: "hero-copy", type: "paragraph", name: "Paragraph", text: "Your design canvas is the centre of the workspace. Create beautiful, responsive websites with the freedom to make them your own.", parentId: "hero", visible: true, locked: false, styles: { color: "#6f7184", fontSize: 14, align: "center" } },
  { id: "hero-button", type: "button", name: "Primary button", text: "Get started", parentId: "hero", visible: true, locked: false, styles: { color: "#ffffff", background: "#6258d9", fontSize: 13, padding: 13, radius: 9, align: "center" } },
  { id: "features", type: "section", name: "Features section", text: "", parentId: null, visible: true, locked: false, styles: { background: "#f8f8fc", padding: 30, align: "center" } },
  { id: "features-heading", type: "heading", name: "Section heading", text: "Everything you need to create", parentId: "features", visible: true, locked: false, styles: { color: "#202033", fontSize: 22, align: "center" } },
  { id: "feature-one", type: "feature", name: "Feature card", text: "Responsive layouts · Components · Data", parentId: "features", visible: true, locked: false, styles: { background: "#ffffff", padding: 20, radius: 12, align: "center" } },
];
const workspaceItems: { name: Workspace; icon: typeof Plus; subtitle: string }[] = [
  { name: "Add", icon: Plus, subtitle: "Elements" },
  { name: "Layers", icon: Layers, subtitle: "Pages & layers" },
  { name: "Templates", icon: LayoutTemplate, subtitle: "Starting points" },
];
const inspectorItems: { name: InspectorMode; icon: typeof Plus }[] = [
  { name: "Properties", icon: SlidersHorizontal }, { name: "Layout", icon: Columns2 },
  { name: "Style", icon: Paintbrush }, { name: "Responsive", icon: Smartphone },
  { name: "Accessibility", icon: Accessibility }, { name: "Advanced", icon: Settings2 },
];
const elementGroups: { label: string; icon: typeof Plus; items: { label: string; type: NodeKind; icon: typeof Plus; description: string }[] }[] = [
  { label: "Layout", icon: Grid2X2, items: [{ label: "Section", type: "section", icon: Square, description: "Full-width page section" }, { label: "Container", type: "container", icon: Box, description: "Constrain and group content" }] },
  { label: "Basic", icon: Type, items: [{ label: "Heading", type: "heading", icon: Heading, description: "A title or heading" }, { label: "Text", type: "paragraph", icon: Type, description: "A paragraph of text" }, { label: "Button", type: "button", icon: MousePointer2, description: "A clickable link" }] },
  { label: "Media", icon: Image, items: [{ label: "Image", type: "image", icon: Image, description: "An image with alt text" }] },
  { label: "Interactive", icon: Zap, items: [{ label: "Feature card", type: "feature", icon: Box, description: "A reusable content card" }] },
];
const uid = () => `node-${Math.random().toString(36).slice(2, 9)}`;

function safeLink(value?: string): string | undefined {
  if (!value) return undefined;
  const url = value.trim();
  if (/^(https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i.test(url) && !/^\/\//.test(url)) return url;
  return undefined;
}

function safeImageSource(value?: string): string | undefined {
  if (!value) return undefined;
  const url = value.trim();
  if (/^https?:\/\//i.test(url) || /^(\/|\.\/|\.\.\/)/.test(url) && !url.startsWith("//")) return url;
  if (url.length <= 1_500_000 && /^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/]+=*$/i.test(url)) return url;
  return undefined;
}

function isPageNodeArray(value: unknown): value is PageNode[] {
  if (!Array.isArray(value) || value.length > 2000) return false;
  const allowed = new Set<NodeKind>(["heading", "paragraph", "button", "section", "image", "feature", "container"]);
  const allowedSemantics = new Set(["default", "h1", "h2", "h3", "button", "section"]);
  const ids = new Set<string>();
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object") return false;
    const node = candidate as Partial<PageNode>;
    const styles = node.styles as Record<string, unknown> | undefined;
    if (typeof node.id !== "string" || !node.id || node.id.length > 120 || ids.has(node.id) ||
        typeof node.name !== "string" || node.name.length > 160 ||
        typeof node.text !== "string" || node.text.length > 20000 ||
        typeof node.type !== "string" || !allowed.has(node.type as NodeKind) ||
        !(node.parentId === null || typeof node.parentId === "string") ||
        typeof node.visible !== "boolean" || typeof node.locked !== "boolean" ||
        !styles || typeof styles !== "object" || Array.isArray(styles) ||
        (node.href !== undefined && (typeof node.href !== "string" || node.href.length > 2048)) ||
        (node.src !== undefined && (typeof node.src !== "string" || node.src.length > 1_500_000)) ||
        (node.ariaLabel !== undefined && (typeof node.ariaLabel !== "string" || node.ariaLabel.length > 300)) ||
        (node.semantic !== undefined && (typeof node.semantic !== "string" || !allowedSemantics.has(node.semantic)))) return false;
    for (const key of ["color", "background"] as const) {
      const color = styles[key];
      if (color !== undefined && (typeof color !== "string" || !/^#[0-9a-f]{3,8}$/i.test(color))) return false;
    }
    if (styles.align !== undefined && !["left", "center", "right"].includes(String(styles.align))) return false;
    if (styles.display !== undefined && !["block", "flex", "grid"].includes(String(styles.display))) return false;
    if (styles.flexDirection !== undefined && !["row", "column"].includes(String(styles.flexDirection))) return false;
    if (styles.justifyContent !== undefined && !["start", "center", "end", "between", "around"].includes(String(styles.justifyContent))) return false;
    if (styles.alignItems !== undefined && !["start", "center", "end", "stretch"].includes(String(styles.alignItems))) return false;
    if (styles.flexWrap !== undefined && !["nowrap", "wrap"].includes(String(styles.flexWrap))) return false;
    if (styles.gridColumns !== undefined && (typeof styles.gridColumns !== "number" || !Number.isInteger(styles.gridColumns) || styles.gridColumns < 1 || styles.gridColumns > 12)) return false;
    if (styles.gap !== undefined && (typeof styles.gap !== "number" || !Number.isFinite(styles.gap) || styles.gap < 0 || styles.gap > 200)) return false;
    if (styles.width !== undefined && !["Auto", "100%", "Fit content", "320px"].includes(String(styles.width))) return false;
    if (styles.height !== undefined && !["Auto", "100%", "320px", "480px"].includes(String(styles.height))) return false;
    for (const key of ["fontSize", "padding", "radius"] as const) {
      const number = styles[key];
      const max = key === "fontSize" ? 128 : key === "padding" ? 200 : 100;
      if (number !== undefined && (typeof number !== "number" || !Number.isFinite(number) || number < 0 || number > max)) return false;
    }
    if (node.openInNewTab !== undefined && typeof node.openInNewTab !== "boolean") return false;
    if (node.interaction !== undefined) {
      const interaction = node.interaction as NodeInteraction;
      if (!interaction || typeof interaction !== "object" || interaction.trigger !== "click" ||
          !["navigatePage", "scrollTo", "toggleVisibility", "setText"].includes(interaction.action) ||
          (interaction.targetId !== undefined && (typeof interaction.targetId !== "string" || interaction.targetId.length > 120)) ||
          (interaction.targetPageId !== undefined && (typeof interaction.targetPageId !== "string" || interaction.targetPageId.length > 120)) ||
          (interaction.value !== undefined && (typeof interaction.value !== "string" || interaction.value.length > 20000))) return false;
    }
    if (node.responsive !== undefined) {
      const responsive = node.responsive as Record<string, unknown> | undefined;
      if (!responsive || typeof responsive !== "object" || Array.isArray(responsive) ||
          Object.keys(responsive).some(key => key !== "tablet" && key !== "mobile")) return false;
      for (const breakpoint of ["tablet", "mobile"] as const) {
        const override = responsive[breakpoint] as Record<string, unknown> | undefined;
        if (override === undefined) continue;
        if (!override || typeof override !== "object" || Array.isArray(override)) return false;
        for (const key of ["color", "background"]) {
          const color = override[key];
          if (color !== undefined && (typeof color !== "string" || !/^#[0-9a-f]{3,8}$/i.test(color))) return false;
        }
        if (override.align !== undefined && !["left", "center", "right"].includes(String(override.align))) return false;
        if (override.display !== undefined && !["block", "flex", "grid"].includes(String(override.display))) return false;
        if (override.flexDirection !== undefined && !["row", "column"].includes(String(override.flexDirection))) return false;
        if (override.justifyContent !== undefined && !["start", "center", "end", "between", "around"].includes(String(override.justifyContent))) return false;
        if (override.alignItems !== undefined && !["start", "center", "end", "stretch"].includes(String(override.alignItems))) return false;
        if (override.flexWrap !== undefined && !["nowrap", "wrap"].includes(String(override.flexWrap))) return false;
        if (override.gridColumns !== undefined && (typeof override.gridColumns !== "number" || !Number.isInteger(override.gridColumns) || override.gridColumns < 1 || override.gridColumns > 12)) return false;
        if (override.gap !== undefined && (typeof override.gap !== "number" || !Number.isFinite(override.gap) || override.gap < 0 || override.gap > 200)) return false;
        if (override.width !== undefined && !["Auto", "100%", "Fit content", "320px"].includes(String(override.width))) return false;
        if (override.height !== undefined && !["Auto", "100%", "320px", "480px"].includes(String(override.height))) return false;
        for (const key of ["fontSize", "padding", "radius"]) {
          const number = override[key];
          const max = key === "fontSize" ? 128 : key === "padding" ? 200 : 100;
          if (number !== undefined && (typeof number !== "number" || !Number.isFinite(number) || number < 0 || number > max)) return false;
        }
      }
    }
    ids.add(node.id);
  }
  for (const candidate of value as PageNode[]) {
    if (candidate.parentId !== null && !ids.has(candidate.parentId)) return false;
    const ancestors = new Set<string>([candidate.id]);
    let parentId = candidate.parentId;
    while (parentId !== null) {
      if (ancestors.has(parentId)) return false;
      ancestors.add(parentId);
      const parent = (value as PageNode[]).find(node => node.id === parentId);
      if (!parent) return false;
      parentId = parent.parentId;
    }
  }
  return true;
}

function isPageSnapshotArray(value: unknown): value is PageSnapshot[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 50) return false;
  const ids = new Set<string>();
  return value.every((item) => {
    if (!item || typeof item !== "object") return false;
    const page = item as Partial<PageSnapshot>;
    if (typeof page.id !== "string" || !page.id || page.id.length > 120 || ids.has(page.id) ||
        typeof page.name !== "string" || !page.name.trim() || page.name.length > 80 ||
        !isPageNodeArray(page.nodes)) return false;
    ids.add(page.id);
    return true;
  });
}

function loadReusableComponents(): ReusableComponent[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem("sytely:components:v1") ?? "[]");
    if (!Array.isArray(parsed) || parsed.length > 100) return [];
    return parsed.filter((item): item is ReusableComponent =>
      !!item && typeof item.id === "string" && typeof item.name === "string" &&
      Array.isArray(item.nodes) && item.nodes.length > 0 && isPageNodeArray(item.nodes));
  } catch { return []; }
}

function loadSavedPages(): PageSnapshot[] | null {
  try {
    const raw = window.localStorage.getItem("sytely:pages:v1");
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isPageSnapshotArray(parsed) ? parsed : null;
  } catch { return null; }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function staticStyle(styles: PageNode["styles"] = {}): string {
  const declarations: string[] = [];
  if (typeof styles.color === "string" && /^#[0-9a-f]{3,8}$/i.test(styles.color)) declarations.push(`color:${styles.color}`);
  if (typeof styles.background === "string" && /^#[0-9a-f]{3,8}$/i.test(styles.background)) declarations.push(`background:${styles.background}`);
  if (typeof styles.fontSize === "number" && Number.isFinite(styles.fontSize) && styles.fontSize >= 0 && styles.fontSize <= 128) declarations.push(`font-size:${styles.fontSize}px`);
  if (typeof styles.padding === "number" && Number.isFinite(styles.padding) && styles.padding >= 0 && styles.padding <= 200) declarations.push(`padding:${styles.padding}px`);
  if (typeof styles.radius === "number" && Number.isFinite(styles.radius) && styles.radius >= 0 && styles.radius <= 100) declarations.push(`border-radius:${styles.radius}px`);
  if (styles.align === "left" || styles.align === "center" || styles.align === "right") declarations.push(`text-align:${styles.align}`);
  if (typeof styles.width === "string" && ["100%", "Fit content", "320px"].includes(styles.width)) declarations.push(`width:${styles.width === "Fit content" ? "fit-content" : styles.width}`);
  if (typeof styles.height === "string" && ["100%", "320px", "480px"].includes(styles.height)) declarations.push(`height:${styles.height}`);
  if (styles.display === "flex") declarations.push("display:flex");
  if (styles.display === "grid") declarations.push(`display:grid;grid-template-columns:repeat(${Number.isInteger(styles.gridColumns) && styles.gridColumns! >= 1 && styles.gridColumns! <= 12 ? styles.gridColumns : 2},minmax(0,1fr))`);
  if (styles.display === "block") declarations.push("display:block");
  if (typeof styles.gap === "number" && Number.isFinite(styles.gap) && styles.gap >= 0 && styles.gap <= 200) declarations.push(`gap:${styles.gap}px`);
  if (styles.flexDirection === "row" || styles.flexDirection === "column") declarations.push(`flex-direction:${styles.flexDirection}`);
  if (styles.justifyContent && ["start", "center", "end", "between", "around"].includes(styles.justifyContent)) declarations.push(`justify-content:${({start:"flex-start",center:"center",end:"flex-end",between:"space-between",around:"space-around"} as const)[styles.justifyContent as "start" | "center" | "end" | "between" | "around"]}`);
  if (styles.alignItems && ["start", "center", "end", "stretch"].includes(styles.alignItems)) declarations.push(`align-items:${({start:"flex-start",center:"center",end:"flex-end",stretch:"stretch"} as const)[styles.alignItems as "start" | "center" | "end" | "stretch"]}`);
  if (styles.flexWrap === "wrap" || styles.flexWrap === "nowrap") declarations.push(`flex-wrap:${styles.flexWrap}`);
  return declarations.join(";");
}

function buildStaticHtml(pages: PageSnapshot[], siteName: string): string {
  const cssRules: string[] = [];
  const renderNode = (node: PageNode, all: PageNode[]): string => {
    if (!node.visible) return "";
    const className = `node-${node.id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const style = staticStyle(node.styles);
    const interactionAttrs = node.interaction ? ` data-sytely-action="${node.interaction.action}" data-target-id="${escapeHtml(node.interaction.targetId ?? "")}" data-target-page="${escapeHtml(node.interaction.targetPageId ?? "")}" data-action-value="${escapeHtml(node.interaction.value ?? "")}"` : "";
    const attrs = `id="preview-node-${escapeHtml(node.id)}" class="${className}"${style ? ` style="${style}"` : ""}${node.ariaLabel ? ` aria-label="${escapeHtml(node.ariaLabel)}"` : ""}${interactionAttrs}`;
    const nested = all.filter(child => child.parentId === node.id).map(child => renderNode(child, all)).join("");
    for (const breakpoint of ["tablet", "mobile"] as const) {
      const overrideStyle = staticStyle(node.responsive?.[breakpoint]);
      if (overrideStyle) cssRules.push(`@${breakpoint === "tablet" ? "media (max-width: 900px)" : "media (max-width: 600px)"}{.${className}{${overrideStyle}}}`);
    }
    const text = escapeHtml(node.text);
    if (node.type === "heading") {
      const tag = node.semantic === "h2" || node.semantic === "h3" ? node.semantic : "h1";
      return `<${tag} ${attrs}>${text}</${tag}>`;
    }
    if (node.type === "paragraph") return `<p ${attrs}>${text}</p>`;
    if (node.type === "button") {
      const href = safeLink(node.href) ?? "#";
      return `<a ${attrs} href="${escapeHtml(href)}"${node.openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : ""}>${text}</a>`;
    }
    if (node.type === "image") {
      const src = safeImageSource(node.src);
      return src ? `<img ${attrs} src="${escapeHtml(src)}" alt="${text}" loading="lazy">` : `<div ${attrs} role="img" aria-label="${escapeHtml(node.text || "Image placeholder")}">${text || "Image placeholder"}</div>`;
    }
    if (node.type === "feature") return `<article ${attrs}><p>${text}</p>${nested}</article>`;
    return `<section ${attrs}>${node.text && node.type !== "section" && node.type !== "container" ? `<p>${text}</p>` : ""}${nested}</section>`;
  };
  const pageMarkup = pages.map((page, index) => {
    const pageId = `page-${page.id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const content = page.nodes.filter(node => node.parentId === null).map(node => renderNode(node, page.nodes)).join("");
    return `<section class="export-page" id="${pageId}" data-page-id="${page.id.replace(/[^a-zA-Z0-9_-]/g, "")}" ${index ? "hidden" : ""} aria-label="${escapeHtml(page.name)}">${content || "<p>Start creating this page in Sytely.</p>"}</section>`;
  }).join("");
  const nav = pages.map((page, index) => `<a href="#page-${page.id.replace(/[^a-zA-Z0-9_-]/g, "")}" data-page="${page.id.replace(/[^a-zA-Z0-9_-]/g, "")}" ${index === 0 ? 'aria-current="page"' : ""}>${escapeHtml(page.name)}</a>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escapeHtml(siteName)}"><title>${escapeHtml(siteName)}</title><style>*{box-sizing:border-box}body{margin:0;font:16px/1.6 Inter,system-ui,sans-serif;color:#202033}header{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:18px clamp(18px,5vw,72px);border-bottom:1px solid #e8e8ef}header strong{font-size:18px}nav{display:flex;flex-wrap:wrap;gap:16px}nav a{color:inherit;text-decoration:none}nav a[aria-current="page"]{font-weight:700;color:#6258d9}main{max-width:1200px;margin:auto;padding:0 clamp(16px,4vw,48px)}.export-page{min-height:70vh;padding:32px 0}.export-page[hidden]{display:none!important}h1,h2,h3,p{max-width:100%;overflow-wrap:anywhere}a[class^="node-"]{display:inline-block;text-decoration:none;border-radius:8px}img{max-width:100%;height:auto}section,article{max-width:100%}footer{padding:24px;text-align:center;color:#777;border-top:1px solid #eee}${cssRules.join("")}</style></head><body><header><strong>${escapeHtml(siteName)}</strong><nav aria-label="Pages">${nav}</nav></header><main>${pageMarkup}</main><footer>Made with Sytely</footer><script>(()=>{const pages=[...document.querySelectorAll('.export-page')];const links=[...document.querySelectorAll('nav a[data-page]')];function show(id){const key=(id||'').replace(/^#page-/,'');let found=false;for(const page of pages){const active=page.id==='page-'+key || (!key && page===pages[0]);page.hidden=!active;if(active)found=true;}if(!found&&pages[0])pages.forEach((page,index)=>page.hidden=index!==0);for(const link of links){if(link.dataset.page===key)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}}links.forEach(link=>link.addEventListener('click',()=>show('#page-'+link.dataset.page)));window.addEventListener('hashchange',()=>show(location.hash));document.addEventListener('click',event=>{const target=event.target.closest('[data-sytely-action]');if(!target)return;const action=target.dataset.sytelyAction;const id=target.dataset.targetId;const page=target.dataset.targetPage;event.preventDefault();if(action==='navigatePage'&&page){location.hash='page-'+page;show(location.hash);}else if(action==='scrollTo'&&id){document.getElementById('preview-node-'+id)?.scrollIntoView({behavior:'smooth',block:'center'});}else if(action==='toggleVisibility'&&id){const el=document.getElementById('preview-node-'+id)||document.querySelector('.node-'+id);if(el)el.hidden=!el.hidden;}else if(action==='setText'&&id){const el=document.getElementById('preview-node-'+id)||document.querySelector('.node-'+id);if(el)el.textContent=target.dataset.actionValue||'';}});show(location.hash);})();</script></body></html>`;
}

export default function App() {
  const [pages, setPages] = useState<PageSnapshot[]>(() => {
    const saved = loadSavedPages();
    if (saved) return saved;
    try {
      const raw = window.localStorage.getItem("sytely:document:v1");
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      return [{ id: "page-home", name: "Home", nodes: isPageNodeArray(parsed) ? parsed : initialNodes }];
    } catch { return [{ id: "page-home", name: "Home", nodes: initialNodes }]; }
  });
  const [activePageId, setActivePageId] = useState(() => {
    const saved = loadSavedPages();
    try {
      const stored = window.localStorage.getItem("sytely:active-page:v1");
      return saved?.some(page => page.id === stored) ? stored! : saved?.[0]?.id ?? "page-home";
    } catch { return saved?.[0]?.id ?? "page-home"; }
  });
  const [nodes, setNodes] = useState<PageNode[]>(() => {
    const saved = loadSavedPages();
    try {
      const stored = window.localStorage.getItem("sytely:active-page:v1");
      const active = saved?.find(page => page.id === stored) ?? saved?.[0];
      if (active) return active.nodes;
      const raw = window.localStorage.getItem("sytely:document:v1");
      if (!raw) return initialNodes;
      const parsed: unknown = JSON.parse(raw);
      if (!isPageNodeArray(parsed)) return initialNodes;
      return parsed;
    } catch { return initialNodes; }
  });
  const [selectedId, setSelectedId] = useState(() => {
    const saved = loadSavedPages();
    try {
      const stored = window.localStorage.getItem("sytely:active-page:v1");
      const activeNodes = saved?.find(page => page.id === stored)?.nodes ?? saved?.[0]?.nodes;
      if (activeNodes?.some(node => node.id === "hero-button")) return "hero-button";
      if (activeNodes?.[0]?.id) return activeNodes[0].id;
      const raw = window.localStorage.getItem("sytely:document:v1");
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isPageNodeArray(parsed) && parsed.some(node => node.id === "hero-button")) return "hero-button";
        if (isPageNodeArray(parsed) && parsed[0]?.id) return parsed[0].id;
      }
    } catch { /* recover with the starter document */ }
    return "hero-button";
  });
  const [workspace, setWorkspace] = useState<Workspace>("Add");
  const [inspector, setInspector] = useState<InspectorMode>("Properties");
  const [backendTab, setBackendTab] = useState<BackendTab>("Blocks");
  const [backendSize, setBackendSize] = useState<"inspector" | "expanded" | "focus">("inspector");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [leftWidth, setLeftWidth] = useState(276);
  const [rightWidth, setRightWidth] = useState(310);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [zoom, setZoom] = useState(100);
  const [preview, setPreview] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  const [search, setSearch] = useState("");
  const [openGroups, setOpenGroups] = useState<string[]>(["Layout", "Basic", "Media"]);
  const [history, setHistory] = useState<PageNode[][]>([]);
  const lastCommitAt = useRef(0);
  const [future, setFuture] = useState<PageNode[][]>([]);
  const [saveState, setSaveState] = useState<"saved" | "unsaved">("saved");
  const [savedLabel, setSavedLabel] = useState("All changes saved");
  const [mobilePanel, setMobilePanel] = useState<"left" | "right" | null>(null);
  const [code, setCode] = useState("onClick(button)\n  setVariable(\"message\", \"Welcome to Sytely\")\n  setText(resultLabel, message)");
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [components, setComponents] = useState<ReusableComponent[]>(() => loadReusableComponents());
  const [componentName, setComponentName] = useState("");
  const [runtimeOverrides, setRuntimeOverrides] = useState<Record<string, { visible?: boolean; text?: string }>>({});
  const [pageName, setPageName] = useState(() => pages.find(page => page.id === activePageId)?.name ?? "Home");
  const [projectName, setProjectName] = useState(() => {
    try { return window.localStorage.getItem("sytely:project-name:v1") || "My Website"; } catch { return "My Website"; }
  });
  const canvasRef = useRef<HTMLDivElement>(null);
  const selected = nodes.find(n => n.id === selectedId);
  const activePage = pages.find(page => page.id === activePageId) ?? pages[0];
  const childrenOf = useCallback((parentId: string | null) => nodes.filter(n => n.parentId === parentId), [nodes]);
  const childNodes = useMemo(() => nodes.filter(n => n.parentId === selectedId), [nodes, selectedId]);

  useEffect(() => {
    try { window.localStorage.setItem("sytely:components:v1", JSON.stringify(components)); }
    catch { setToast("Component library could not be saved on this device"); }
  }, [components]);

  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.matches("input,textarea,select") || target.isContentEditable || target.closest(".code-editor"));
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        try {
          window.localStorage.setItem("sytely:document:v1", JSON.stringify(nodes));
          window.localStorage.setItem("sytely:pages:v1", JSON.stringify(pages.map(page => page.id === activePageId ? { ...page, name: pageName, nodes } : page)));
          window.localStorage.setItem("sytely:active-page:v1", activePageId);
          setSavedLabel("Saved on this device");
          setSaveState("saved");
          setToast("Project saved locally");
        } catch {
          setSavedLabel("Local storage unavailable");
          setSaveState("unsaved");
          setToast("Could not save this draft on the device");
        }
        return;
      }
      if (typing) return;
      if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      if (mod && e.key.toLowerCase() === "d") { e.preventDefault(); duplicateNode(); }
      if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); setWorkspace("Add"); document.querySelector<HTMLInputElement>(".element-search")?.focus(); }
      if ((e.key === "Delete" || e.key === "Backspace") && selected && !selected.locked && !preview) { e.preventDefault(); removeNode(selected.id); }
      if (e.key === "Escape") { setPreview(false); setMobilePanel(null); setBackendSize("inspector"); }
      if (e.key === "ArrowUp" && mod) { e.preventDefault(); moveNode(-1); }
      if (e.key === "ArrowDown" && mod) { e.preventDefault(); moveNode(1); }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  });
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    setPages(current => {
      const page = current.find(item => item.id === activePageId);
      if (!page || JSON.stringify(page.nodes) === JSON.stringify(nodes)) return current;
      return current.map(item => item.id === activePageId ? { ...item, nodes } : item);
    });
  }, [nodes, activePageId]);
  useEffect(() => {
    setPages(current => {
      const page = current.find(item => item.id === activePageId);
      if (!page || page.name === pageName) return current;
      return current.map(item => item.id === activePageId ? { ...item, name: pageName } : item);
    });
  }, [pageName, activePageId]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem("sytely:document:v1", JSON.stringify(nodes));
        const persistedPages = pages.map(page => page.id === activePageId ? { ...page, name: pageName, nodes } : page);
        window.localStorage.setItem("sytely:pages:v1", JSON.stringify(persistedPages));
        window.localStorage.setItem("sytely:active-page:v1", activePageId);
        setSaveState("saved");
        setSavedLabel("Saved on this device");
      } catch {
        setSaveState("unsaved");
        setSavedLabel("Local storage unavailable");
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [nodes, pages, activePageId, pageName]);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("sytely:workspace:v1");
      if (!raw) return;
      const value = JSON.parse(raw) as { leftWidth?: number; rightWidth?: number; leftCollapsed?: boolean; rightCollapsed?: boolean };
      if (typeof value.leftWidth === "number") setLeftWidth(Math.max(200, Math.min(480, value.leftWidth)));
      if (typeof value.rightWidth === "number") setRightWidth(Math.max(240, Math.min(600, value.rightWidth)));
      if (typeof value.leftCollapsed === "boolean") setLeftCollapsed(value.leftCollapsed);
      if (typeof value.rightCollapsed === "boolean") setRightCollapsed(value.rightCollapsed);
    } catch { /* ignore invalid workspace preferences */ }
  }, []);
  useEffect(() => {
    try { window.localStorage.setItem("sytely:project-name:v1", projectName); } catch { /* optional preference */ }
  }, [projectName]);
  useEffect(() => {
    try {
      window.localStorage.setItem("sytely:workspace:v1", JSON.stringify({ leftWidth, rightWidth, leftCollapsed, rightCollapsed }));
    } catch { /* workspace preferences are optional */ }
  }, [leftWidth, rightWidth, leftCollapsed, rightCollapsed]);
  const commit = (next: PageNode[]) => {
    const now = Date.now();
    if (now - lastCommitAt.current > 500) setHistory(h => [...h.slice(-49), nodes]);
    lastCommitAt.current = now;
    setFuture([]);
    setNodes(next);
    setPages(current => current.map(page => page.id === activePageId ? { ...page, nodes: next } : page));
    setSaveState("unsaved");
    setSavedLabel("Unsaved changes");
  };
  function undo() {
    lastCommitAt.current = 0;
    setHistory(h => { if (!h.length) return h; const prev = h[h.length - 1]; setFuture(f => [nodes, ...f]); setNodes(prev); setSaveState("unsaved"); setSavedLabel("Unsaved changes"); return h.slice(0, -1); });
  }
  function redo() {
    lastCommitAt.current = 0;
    setFuture(f => { if (!f.length) return f; const next = f[0]; setHistory(h => [...h, nodes]); setNodes(next); setSaveState("unsaved"); setSavedLabel("Unsaved changes"); return f.slice(1); });
  }
  function switchPage(pageId: string) {
    const page = pages.find(item => item.id === pageId);
    if (!page) return;
    setHistory([]);
    setFuture([]);
    setActivePageId(page.id);
    setNodes(page.nodes);
    setPageName(page.name);
    setSelectedId(page.nodes.find(node => node.id === "hero-button")?.id ?? page.nodes[0]?.id ?? "");
    setWorkspace("Layers");
    setToast(`Opened page: ${page.name}`);
  }
  function addPage() {
    const name = window.prompt("New page name", `Page ${pages.length + 1}`);
    if (!name?.trim()) return;
    const pageId = `page-${uid()}`;
    const sectionId = uid();
    const titleId = uid();
    const newNodes: PageNode[] = [
      { id: sectionId, type: "section", name: "Page section", text: "", parentId: null, visible: true, locked: false, styles: { background: "#ffffff", padding: 48, align: "center" } },
      { id: titleId, type: "heading", name: "Page heading", text: name.trim(), parentId: sectionId, visible: true, locked: false, styles: { color: "#202033", fontSize: 36, align: "center" } },
      { id: uid(), type: "paragraph", name: "Page introduction", text: "Add your content here.", parentId: sectionId, visible: true, locked: false, styles: { color: "#6f7184", fontSize: 16, align: "center" } },
    ];
    const page = { id: pageId, name: name.trim().slice(0, 80), nodes: newNodes };
    setPages(current => [...current, page]);
    setHistory([]);
    setFuture([]);
    setActivePageId(pageId);
    setNodes(newNodes);
    setPageName(page.name);
    setSelectedId(titleId);
    setWorkspace("Add");
    setInspector("Properties");
    setToast(`Created page: ${page.name}`);
  }
  function renameActivePage() {
    const name = window.prompt("Page name", pageName);
    if (!name?.trim()) return;
    setPageName(name.trim().slice(0, 80));
    setToast("Page renamed");
  }
  function deleteActivePage() {
    if (pages.length <= 1) { setToast("A website must have at least one page"); return; }
    if (!window.confirm(`Delete the page “${pageName}”? This cannot be undone.`)) return;
    const remaining = pages.filter(page => page.id !== activePageId);
    setPages(remaining);
    switchPage(remaining[0].id);
    setToast("Page deleted");
  }
  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file || selected?.type !== "image") return;
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      setToast("Choose a PNG, JPEG, WebP or GIF image");
      return;
    }
    if (file.size > 1_000_000) {
      setToast("Images must be 1 MB or smaller for local project storage");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string" || !reader.result.startsWith("data:image/")) {
        setToast("Could not read that image");
        return;
      }
      updateSelected({ src: reader.result });
      setToast("Image added to your project");
    };
    reader.onerror = () => setToast("Could not read that image");
    reader.readAsDataURL(file);
  }
  function exportSiteHtml() {
    const exportPages = pages.map(page => page.id === activePageId ? { ...page, name: pageName, nodes } : page);
    const html = buildStaticHtml(exportPages, projectName);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${projectName.trim().replace(/[^a-z0-9-_]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "sytely-site"}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast("Standalone website exported with all pages and responsive styles.");
  }

  function addNode(type: NodeKind, name?: string, parentOverride?: string | null) {
    const defaults: Record<NodeKind, { text: string; styles: PageNode["styles"] }> = {
      heading: { text: "Your heading", styles: { fontSize: 30, color: "#202033", align: "center" } },
      paragraph: { text: "Add your text here. Tell your story clearly.", styles: { fontSize: 14, color: "#6f7184", align: "center" } },
      button: { text: "Get started", styles: { background: "#6258d9", color: "#ffffff", padding: 12, radius: 9, align: "center" } },
      section: { text: "", styles: { background: "#ffffff", padding: 36, align: "center" } },
      image: { text: "Image placeholder", styles: { background: "#eeedf9", padding: 48, align: "center", radius: 12 } },
      feature: { text: "A feature worth sharing", styles: { background: "#ffffff", padding: 20, radius: 12, align: "center" } },
      container: { text: "", styles: { background: "#fafaff", padding: 20, radius: 10, align: "center" } },
    };
    const d = defaults[type];
    const node: PageNode = { id: uid(), type, name: name ?? (type === "paragraph" ? "Text" : type[0].toUpperCase() + type.slice(1)), text: d.text, parentId: parentOverride !== undefined ? parentOverride : selected?.type === "section" || selected?.type === "container" ? selected.id : selected?.parentId ?? null, visible: true, locked: false, styles: { ...d.styles } };
    commit([...nodes, node]); setSelectedId(node.id); setInspector("Properties"); setToast(`${node.name} added to canvas`);
  }
  function applyTemplate(templateName: string) {
    if (!window.confirm("Replace the current page with this template? You can undo the change immediately.")) return;
    const make = (
      type: NodeKind, name: string, text: string, parentId: string | null,
      styles: PageNode["styles"] = {}, extra: Pick<PageNode, "href" | "openInNewTab" | "src"> = {},
    ): PageNode => ({ id: uid(), type, name, text, parentId, visible: true, locked: false, styles: { ...styles }, ...extra });
    let next: PageNode[];
    if (templateName === "Portfolio starter") {
      const hero = make("section", "Hero section", "", null, { background: "#f8f7ff", padding: 64, align: "center" });
      const kicker = make("paragraph", "Eyebrow", "INDEPENDENT DESIGNER & DEVELOPER", hero.id, { color: "#6258d9", fontSize: 11, align: "center" });
      const title = make("heading", "Hero heading", "I build thoughtful digital experiences.", hero.id, { color: "#202033", fontSize: 44, align: "center" });
      const copy = make("paragraph", "Introduction", "A short introduction to your work, approach, and what makes your projects different.", hero.id, { color: "#66677b", fontSize: 15, align: "center" });
      const button = make("button", "Portfolio link", "Explore my work", hero.id, { color: "#ffffff", background: "#6258d9", padding: 13, radius: 9, align: "center" }, { href: "#projects" });
      const projects = make("section", "Projects section", "", null, { background: "#ffffff", padding: 36, align: "center" });
      const projectsTitle = make("heading", "Projects heading", "Selected projects", projects.id, { fontSize: 28, align: "center" });
      const projectA = make("feature", "Project card", "Project One · Product design and development", projects.id, { background: "#f8f8fc", padding: 24, radius: 12, align: "left" });
      const projectB = make("feature", "Project card", "Project Two · Brand and web experience", projects.id, { background: "#f8f8fc", padding: 24, radius: 12, align: "left" });
      next = [hero, kicker, title, copy, button, projects, projectsTitle, projectA, projectB];
    } else if (templateName === "SaaS landing page") {
      const hero = make("section", "Hero section", "", null, { background: "#f7f8ff", padding: 60, align: "center" });
      const kicker = make("paragraph", "Eyebrow", "A BETTER WAY TO WORK", hero.id, { color: "#6258d9", fontSize: 11, align: "center" });
      const title = make("heading", "Hero heading", "Your team's next big idea starts here.", hero.id, { fontSize: 42, align: "center" });
      const copy = make("paragraph", "Hero description", "Bring your workflow together, move faster, and spend more time doing meaningful work.", hero.id, { color: "#68697d", fontSize: 15, align: "center" });
      const cta = make("button", "Primary CTA", "Get started", hero.id, { color: "#fff", background: "#6258d9", padding: 13, radius: 9, align: "center" });
      const features = make("section", "Features section", "", null, { background: "#fff", padding: 36, align: "center" });
      const featuresTitle = make("heading", "Features heading", "Everything in one place", features.id, { fontSize: 28, align: "center" });
      const f1 = make("feature", "Feature card", "Plan clearly · Keep priorities visible and your team aligned.", features.id, { background: "#fafaff", padding: 22, radius: 12 });
      const f2 = make("feature", "Feature card", "Work together · Share progress and make decisions faster.", features.id, { background: "#fafaff", padding: 22, radius: 12 });
      const f3 = make("feature", "Feature card", "Measure progress · Understand what is working and what needs attention.", features.id, { background: "#fafaff", padding: 22, radius: 12 });
      next = [hero, kicker, title, copy, cta, features, featuresTitle, f1, f2, f3];
    } else if (templateName === "Product launch") {
      const hero = make("section", "Hero section", "", null, { background: "#202033", padding: 64, align: "center" });
      const kicker = make("paragraph", "Eyebrow", "INTRODUCING SOMETHING NEW", hero.id, { color: "#bcb5ff", fontSize: 11, align: "center" });
      const title = make("heading", "Hero heading", "Meet your new favorite tool.", hero.id, { color: "#ffffff", fontSize: 42, align: "center" });
      const copy = make("paragraph", "Hero description", "Explain the problem you solve, the people you help, and why now is the right time.", hero.id, { color: "#e0dfeb", fontSize: 15, align: "center" });
      const cta = make("button", "Primary CTA", "Discover the product", hero.id, { color: "#202033", background: "#ffffff", padding: 13, radius: 9, align: "center" });
      const details = make("section", "Benefits section", "", null, { background: "#fff", padding: 38, align: "center" });
      const detailsTitle = make("heading", "Benefits heading", "Designed for your next chapter", details.id, { fontSize: 27, align: "center" });
      const detail = make("feature", "Benefit card", "Simple to start. Powerful as you grow.", details.id, { background: "#f8f8fc", padding: 24, radius: 12 });
      next = [hero, kicker, title, copy, cta, details, detailsTitle, detail];
    } else {
      const ids = new Map(initialNodes.map(node => [node.id, uid()]));
      next = initialNodes.map(node => ({ ...node, id: ids.get(node.id)!, parentId: node.parentId ? ids.get(node.parentId)! : null, styles: { ...node.styles } }));
    }
    commit(next);
    setSelectedId(next[0]?.id ?? "");
    setPageName("Home");
    setWorkspace("Add");
    setInspector("Properties");
    setToast(`${templateName} template applied`);
  }

  function saveSelectedAsComponent() {
    if (!selected || selected.locked) { setToast("Select an unlocked element to create a component"); return; }
    const name = (componentName.trim() || selected.name).slice(0, 80);
    const ids = new Set<string>([selected.id]);
    let changed = true;
    while (changed) {
      changed = false;
      nodes.forEach(node => { if (node.parentId && ids.has(node.parentId) && !ids.has(node.id)) { ids.add(node.id); changed = true; } });
    }
    const subtree = nodes.filter(node => ids.has(node.id)).map(node => ({ ...node, parentId: node.id === selected.id ? null : node.parentId, styles: { ...node.styles } }));
    setComponents(current => [...current, { id: uid(), name, nodes: subtree }].slice(-100));
    setComponentName("");
    setToast(`Saved reusable component “${name}”`);
  }
  function insertReusableComponent(component: ReusableComponent) {
    const parentId = selected?.type === "section" || selected?.type === "container" ? selected.id : selected?.parentId ?? null;
    const idMap = new Map(component.nodes.map(node => [node.id, uid()]));
    const copies = component.nodes.map(node => ({
      ...node, id: idMap.get(node.id)!, name: node.parentId === null ? component.name : node.name,
      parentId: node.parentId === null ? parentId : idMap.get(node.parentId)!,
      styles: { ...node.styles }, responsive: node.responsive ? { ...node.responsive } : undefined,
      interaction: node.interaction ? { ...node.interaction } : undefined,
    }));
    commit([...nodes, ...copies]);
    setSelectedId(copies.find(node => node.parentId === parentId)?.id ?? copies[0].id);
    setToast(`Inserted component “${component.name}”`);
  }
  function deleteReusableComponent(id: string) {
    setComponents(current => current.filter(component => component.id !== id));
    setToast("Reusable component removed");
  }
  function runInteraction(node: PageNode, event?: React.MouseEvent) {
    const action = node.interaction;
    if (!preview || !action) return;
    event?.stopPropagation();
    if (action.action === "navigatePage") {
      const page = pages.find(item => item.id === action.targetPageId);
      if (!page) { event?.preventDefault(); setToast("Interaction target page no longer exists"); return; }
      event?.preventDefault(); setRuntimeOverrides({});
      setActivePageId(page.id); setNodes(page.nodes); setPageName(page.name);
      setSelectedId(page.nodes[0]?.id ?? ""); setHistory([]); setFuture([]);
    } else if (action.action === "scrollTo") {
      event?.preventDefault();
      document.getElementById(`preview-node-${action.targetId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (action.action === "toggleVisibility" && action.targetId) {
      event?.preventDefault();
      const target = nodes.find(item => item.id === action.targetId);
      setRuntimeOverrides(current => ({ ...current, [action.targetId!]: { ...current[action.targetId!], visible: !(current[action.targetId!]?.visible ?? target?.visible ?? true) } }));
    } else if (action.action === "setText" && action.targetId) {
      event?.preventDefault();
      setRuntimeOverrides(current => ({ ...current, [action.targetId!]: { ...current[action.targetId!], text: action.value ?? "" } }));
    }
  }

  function updateSelected(patch: Partial<PageNode> | { styles: Partial<PageNode["styles"]> }) {
    if (!selected || selected.locked) return;
    commit(nodes.map(n => n.id === selected.id ? {
      ...n, ...patch,
      styles: "styles" in patch ? { ...n.styles, ...patch.styles } : n.styles,
      responsive: "responsive" in patch ? { ...n.responsive, ...patch.responsive } : n.responsive,
    } : n));
  }
  function updateResponsive(patch: Partial<PageNode["styles"]>) {
    if (!selected || selected.locked) return;
    if (viewport === "desktop") { updateSelected({ styles: patch }); return; }
    const breakpoint = viewport as Breakpoint;
    updateSelected({ responsive: {
      ...selected.responsive,
      [breakpoint]: { ...selected.responsive?.[breakpoint], ...patch },
    } });
  }
  function removeNode(id: string) {
    const ids = new Set<string>([id]);
    let changed = true;
    while (changed) { changed = false; nodes.forEach(n => { if (n.parentId && ids.has(n.parentId) && !ids.has(n.id)) { ids.add(n.id); changed = true; } }); }
    const next = nodes.filter(n => !ids.has(n.id));
    if (next.length === 0) { setToast("Keep at least one element on the page"); return; }
    commit(next); setSelectedId(next[Math.max(0, next.findIndex(n => n.id === id) - 1)]?.id ?? next[0].id); setToast("Element removed · undo available");
  }
  function duplicateNode() {
    if (!selected || selected.locked) return;
    const subtreeIds = new Set<string>([selected.id]);
    let changed = true;
    while (changed) {
      changed = false;
      nodes.forEach(node => {
        if (node.parentId && subtreeIds.has(node.parentId) && !subtreeIds.has(node.id)) {
          subtreeIds.add(node.id);
          changed = true;
        }
      });
    }
    const clones = nodes.filter(node => subtreeIds.has(node.id));
    const idMap = new Map(clones.map(node => [node.id, uid()]));
    const copies = clones.map((node, index) => ({
      ...node,
      id: idMap.get(node.id)!,
      name: index === 0 ? `${node.name} copy` : node.name,
      parentId: node.id === selected.id ? node.parentId : idMap.get(node.parentId!)!,
      styles: { ...node.styles },
    }));
    commit([...nodes, ...copies]);
    setSelectedId(copies[0].id);
    setToast(`Duplicated ${copies.length === 1 ? "element" : `element and ${copies.length - 1} nested elements`}`);
  }
  function moveNode(direction: number) {
    if (!selected) return;
    const siblings = nodes.filter(n => n.parentId === selected.parentId);
    const index = siblings.findIndex(n => n.id === selected.id);
    const target = index + direction;
    if (target < 0 || target >= siblings.length) return;
    const a = nodes.findIndex(n => n.id === siblings[index].id);
    const b = nodes.findIndex(n => n.id === siblings[target].id);
    const next = [...nodes]; [next[a], next[b]] = [next[b], next[a]];
    commit(next);
  }
  function toggleVisibility(id: string) { commit(nodes.map(n => n.id === id ? { ...n, visible: !n.visible } : n)); }
  function toggleLock(id: string) { commit(nodes.map(n => n.id === id ? { ...n, locked: !n.locked } : n)); }
  function changeWorkspaceSize(side: "left" | "right", e: React.MouseEvent<HTMLDivElement>) {
    const startX = e.clientX; const startWidth = side === "left" ? leftWidth : rightWidth;
    const move = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      if (side === "left") setLeftWidth(Math.max(200, Math.min(480, startWidth + delta)));
      else setRightWidth(Math.max(240, Math.min(600, startWidth - delta)));
    };
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); document.body.style.cursor = ""; document.body.style.userSelect = ""; };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
    document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none";
  }
  function resetWidth(side: "left" | "right") { side === "left" ? setLeftWidth(276) : setRightWidth(310); }
  function onDrop(e: React.DragEvent, targetId: string | null) {
    e.preventDefault();
    e.stopPropagation();
    const id = e.dataTransfer.getData("text/sytely-node") || (draggingId && nodes.some(n => n.id === draggingId) ? draggingId : null);
    const draggedType = e.dataTransfer.getData("text/sytely-type");
    if (!id && draggedType && ["heading", "paragraph", "button", "section", "image", "feature", "container"].includes(draggedType)) {
      const target = targetId ? nodes.find(n => n.id === targetId) : undefined;
      if (target?.locked) { setToast("Unlock this element before dropping content into it"); setDraggingId(null); return; }
      const parentId = target && (target.type === "section" || target.type === "container")
        ? target.id
        : target?.parentId ?? null;
      addNode(draggedType as NodeKind, undefined, parentId);
      setDraggingId(null);
      return;
    }
    if (!id) { setDraggingId(null); return; }
    const moving = nodes.find(n => n.id === id);
    const target = targetId ? nodes.find(n => n.id === targetId) : undefined;
    if (!moving || moving.locked || id === targetId) { setDraggingId(null); return; }
    if (target?.locked) { setToast("Unlock the target element before dropping here"); setDraggingId(null); return; }

    const subtreeIds = new Set<string>([id]);
    let foundChild = true;
    while (foundChild) {
      foundChild = false;
      nodes.forEach(n => {
        if (n.parentId && subtreeIds.has(n.parentId) && !subtreeIds.has(n.id)) {
          subtreeIds.add(n.id);
          foundChild = true;
        }
      });
    }
    if (targetId && subtreeIds.has(targetId)) {
      setToast("An element cannot be moved inside itself");
      setDraggingId(null);
      return;
    }

    const newParentId = target && (target.type === "section" || target.type === "container")
      ? target.id
      : target?.parentId ?? null;
    if (newParentId === id || (newParentId !== null && subtreeIds.has(newParentId))) {
      setToast("An element cannot be moved inside itself");
      setDraggingId(null);
      return;
    }

    const moved = nodes.filter(n => subtreeIds.has(n.id)).map(n =>
      n.id === id ? { ...n, parentId: newParentId } : n
    );
    const remaining = nodes.filter(n => !subtreeIds.has(n.id));
    let insertAt = remaining.length;
    if (target && !(target.type === "section" || target.type === "container")) {
      const targetSubtree = new Set<string>([target.id]);
      let expanded = true;
      while (expanded) {
        expanded = false;
        remaining.forEach(n => {
          if (n.parentId && targetSubtree.has(n.parentId) && !targetSubtree.has(n.id)) {
            targetSubtree.add(n.id);
            expanded = true;
          }
        });
      }
      const positions = remaining.map((n, i) => targetSubtree.has(n.id) ? i : -1).filter(i => i >= 0);
      if (positions.length) insertAt = Math.max(...positions) + 1;
    }
    const next = [...remaining.slice(0, insertAt), ...moved, ...remaining.slice(insertAt)];
    commit(next);
    setSelectedId(id);
    setDraggingId(null);
  }

  const rail = (side: "left" | "right", collapsed: boolean, setCollapsed: (v: boolean) => void) => (
    <div className={`mini-rail ${side}-mini-rail`}>
      <button className="rail-collapse" title={collapsed ? "Expand panel" : "Collapse panel"} onClick={() => setCollapsed(!collapsed)}>{side === "left" ? <PanelLeftClose size={15}/> : <PanelRightClose size={15}/>}</button>
      {(side === "left" ? workspaceItems : inspectorItems).map(item => {
        const active = side === "left" ? workspace === item.name : inspector === item.name;
        const Icon = item.icon;
        return <button key={item.name} title={item.name} aria-label={item.name} className={`rail-icon ${active ? "active" : ""}`} onClick={() => { if (side === "left") { setWorkspace(item.name as Workspace); setLeftCollapsed(false); } else { setInspector(item.name as InspectorMode); setRightCollapsed(false); if (item.name === "Backend") setBackendSize("expanded"); } setMobilePanel(side); }}><Icon size={17}/></button>;
      })}
      <div className="rail-spacer"/>
      <button className="rail-icon" title="Help" onClick={() => setToast("Help centre coming soon")}><CircleHelp size={17}/></button>
    </div>
  );

  const renderElement = (node: PageNode) => {
    if (!node.visible && preview) return null;
    if (!node.visible && !preview) return <div className="hidden-node" key={node.id} onClick={() => setSelectedId(node.id)}><Eye size={12}/> {node.name} <span>Hidden in editor</span></div>;
    const isSelected = selectedId === node.id;
    const appliedStyles = { ...node.styles, ...(viewport === "desktop" ? {} : node.responsive?.[viewport]) };
    const style: React.CSSProperties = {
      color: appliedStyles.color, backgroundColor: node.type === "button" ? appliedStyles.background : node.type === "section" || node.type === "container" || node.type === "feature" || node.type === "image" ? appliedStyles.background : undefined,
      fontSize: appliedStyles.fontSize, padding: node.type === "button" ? `${appliedStyles.padding ?? 12}px 22px` : appliedStyles.padding,
      width: appliedStyles.width && appliedStyles.width !== "Auto" ? appliedStyles.width === "Fit content" ? "fit-content" : appliedStyles.width : undefined,
      height: appliedStyles.height && appliedStyles.height !== "Auto" ? appliedStyles.height : undefined,
      borderRadius: appliedStyles.radius, textAlign: (appliedStyles.align as React.CSSProperties["textAlign"]) ?? "center",
      display: appliedStyles.display,
      gap: appliedStyles.gap,
      flexDirection: appliedStyles.flexDirection,
      justifyContent: appliedStyles.justifyContent === "start" ? "flex-start" : appliedStyles.justifyContent === "end" ? "flex-end" : appliedStyles.justifyContent === "between" ? "space-between" : appliedStyles.justifyContent === "around" ? "space-around" : appliedStyles.justifyContent,
      alignItems: appliedStyles.alignItems === "start" ? "flex-start" : appliedStyles.alignItems === "end" ? "flex-end" : appliedStyles.alignItems,
      flexWrap: appliedStyles.flexWrap,
      gridTemplateColumns: appliedStyles.display === "grid" ? `repeat(${appliedStyles.gridColumns ?? 2}, minmax(0, 1fr))` : undefined,
    };
    const displayText = runtimeOverrides[node.id]?.text ?? node.text;
    if (preview && runtimeOverrides[node.id]?.visible === false) return null;
    const HeadingTag = node.semantic === "h2" ? "h2" : node.semantic === "h3" ? "h3" : "h1";
    const inner = node.type === "heading" ? <HeadingTag id={`preview-node-${node.id}`} style={style} aria-label={node.ariaLabel || undefined} contentEditable={!preview && !node.locked} suppressContentEditableWarning onBlur={e => { if (e.currentTarget.textContent !== node.text && !node.locked) commit(nodes.map(n => n.id === node.id ? { ...n, text: e.currentTarget.textContent ?? "" } : n)); }} onClick={e => { if (preview) { if (node.interaction) runInteraction(node, e); } else e.stopPropagation(); }}>{displayText}</HeadingTag>
       : node.type === "paragraph" ? <p id={`preview-node-${node.id}`} style={style} aria-label={node.ariaLabel || undefined} contentEditable={!preview && !node.locked} suppressContentEditableWarning onBlur={e => { if (e.currentTarget.textContent !== node.text && !node.locked) commit(nodes.map(n => n.id === node.id ? { ...n, text: e.currentTarget.textContent ?? "" } : n)); }} onClick={e => { if (preview) { if (node.interaction) runInteraction(node, e); } else e.stopPropagation(); }}>{displayText}</p>
      : node.type === "button" ? <a id={`preview-node-${node.id}`} className="site-cta" style={style} href={preview ? safeLink(node.href) : undefined} aria-label={node.ariaLabel || undefined} target={node.openInNewTab ? "_blank" : undefined} rel={node.openInNewTab ? "noreferrer" : undefined} onClick={e => { if (!preview) { e.preventDefault(); e.stopPropagation(); if (!node.locked) setSelectedId(node.id); } else if (node.interaction) runInteraction(node, e); else if (!node.href) { e.preventDefault(); } }}>{displayText}</a>
      : node.type === "image" ? safeImageSource(node.src) ? <img id={`preview-node-${node.id}`} className="image-placeholder" style={{ ...style, objectFit: "cover", display: "block" }} src={safeImageSource(node.src)} alt={displayText} aria-label={node.ariaLabel || undefined} /> : <div id={`preview-node-${node.id}`} className="image-placeholder" style={style}><Image size={24}/><span>{displayText}</span><small>Add an image URL in Properties</small></div>
      : node.type === "feature" ? <div id={`preview-node-${node.id}`} className="feature-placeholder" style={style} aria-label={node.ariaLabel || undefined}><span className="feature-icon"><Sparkles size={17}/></span><p>{displayText}</p></div>
      : <div id={`preview-node-${node.id}`} className="container-placeholder" style={style} aria-label={node.ariaLabel || undefined}>{(node.type === "section" || node.type === "container") ? (childrenOf(node.id).length ? childrenOf(node.id).map(renderElement) : displayText || <span className="drop-hint">Container · drop elements here</span>) : displayText}</div>;
    if (node.type === "section") return <section key={node.id} aria-label={node.ariaLabel || undefined} className={`site-section selectable ${isSelected && !preview ? "selected-element" : ""} ${showGuides && !preview ? "guide-visible" : ""} ${node.locked && !preview ? "locked-node" : ""}`} draggable={!preview && !node.locked} onDragStart={e => { setDraggingId(node.id); e.dataTransfer.setData("text/sytely-node", node.id); }} onDragEnd={() => setDraggingId(null)} onClick={e => { e.stopPropagation(); if (preview) runInteraction(node, e); else if (!node.locked) setSelectedId(node.id); }} onDragOver={e => e.preventDefault()} onDrop={e => onDrop(e, node.id)}>{!preview && isSelected && <span className="selection-tag">{node.name}</span>}{inner}{!preview && node.locked && <Lock className="lock-mark" size={12}/>}</section>;
    return <div key={node.id} className={`selectable node-wrap ${isSelected && !preview ? "selected-element" : ""} ${node.locked && !preview ? "locked-node" : ""}`} draggable={!preview && !node.locked} onDragStart={e => { setDraggingId(node.id); e.dataTransfer.setData("text/sytely-node", node.id); }} onDragEnd={() => setDraggingId(null)} onDragOver={e => e.preventDefault()} onDrop={e => onDrop(e, node.id)} onClick={e => { e.stopPropagation(); if (preview) runInteraction(node, e); else if (!node.locked) setSelectedId(node.id); }} onDoubleClick={e => { e.stopPropagation(); if (node.type === "heading" || node.type === "paragraph") (e.currentTarget.querySelector("[contenteditable=true]") as HTMLElement | null)?.focus(); }}>{!preview && isSelected && <span className="selection-tag">{node.name}</span>}{inner}{!preview && node.locked && <Lock className="lock-mark" size={12}/>}</div>;
  };

  const renderWorkspace = () => {
    const renderLayerNode = (node: PageNode, depth = 0): React.ReactNode => (
      <div key={node.id}>
        <div className={`layer-row ${depth > 0 ? "child-row" : ""} ${selectedId === node.id ? "active" : ""}`} style={{ paddingLeft: `${depth * 14 + 6}px` }} onClick={() => setSelectedId(node.id)}>
          <span className="layer-type">{node.type === "section" ? <Square size={14}/> : node.type === "heading" ? <Heading size={13}/> : node.type === "button" ? <MousePointer2 size={13}/> : node.type === "image" ? <Image size={13}/> : <Box size={13}/>}</span>
          <span className="layer-name">{node.name}</span>
          <button title={node.visible ? "Hide layer" : "Show layer"} aria-label={node.visible ? `Hide ${node.name}` : `Show ${node.name}`} onClick={e => { e.stopPropagation(); toggleVisibility(node.id); }}><Eye size={13}/></button>
          <button title={node.locked ? "Unlock layer" : "Lock layer"} aria-label={node.locked ? `Unlock ${node.name}` : `Lock ${node.name}`} onClick={e => { e.stopPropagation(); toggleLock(node.id); }}><Lock size={12}/></button>
        </div>
        {childrenOf(node.id).map(child => renderLayerNode(child, depth + 1))}
      </div>
    );
    if (workspace === "Add") return <><div className="panel-heading"><div><h2>Add elements</h2><p>Build your page, one element at a time.</p></div><button className="icon-button" title="Close panel" onClick={() => setLeftCollapsed(true)}><X size={15}/></button></div><div className="search-box"><Search size={15}/><input className="element-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search elements…"/><kbd>⌘ K</kbd></div><div className="category-pills"><button className="category-pill active">All</button><button className="category-pill" onClick={() => setSearch("layout")}>Layout</button><button className="category-pill" onClick={() => setSearch("text")}>Text</button><button className="category-pill" onClick={() => setSearch("media")}>Media</button></div><div className="workspace-scroll">{elementGroups.map(group => { const filtered = group.items.filter(item => `${item.label} ${group.label} ${item.description}`.toLowerCase().includes(search.toLowerCase())); if (!filtered.length) return null; const GroupIcon = group.icon; return <div className="element-group" key={group.label}><button className="group-heading" onClick={() => setOpenGroups(g => g.includes(group.label) ? g.filter(x => x !== group.label) : [...g, group.label])}><ChevronDown size={14} className={openGroups.includes(group.label) ? "" : "rotated"}/><GroupIcon size={14}/><span>{group.label}</span><small>{filtered.length}</small></button>{openGroups.includes(group.label) && <div className="element-grid">{filtered.map(item => { const Icon = item.icon; return <button key={item.label} className="element-tile" draggable onDragStart={e => { e.dataTransfer.setData("text/sytely-type", item.type); setDraggingId(item.type); }} onClick={() => addNode(item.type, item.label)} title={item.description}><span className="element-icon"><Icon size={18}/></span><span>{item.label}</span><Plus size={12} className="tile-add"/></button>; })}</div>}</div>; })}{search && !elementGroups.some(g => g.items.some(i => `${i.label} ${g.label} ${i.description}`.toLowerCase().includes(search.toLowerCase()))) && <p className="empty-message">No elements match “{search}”. Try another term.</p>}</div><div className="panel-footnote"><Sparkles size={14}/><span>Tip: select a container, then add an element inside it.</span></div></>;
    if (workspace === "Layers") return <><div className="panel-heading"><div><h2>Layers & pages</h2><p>Page structure and visibility</p></div><button className="icon-button" title="Add section" onClick={() => addNode("section")}><Plus size={16}/></button></div><div className="page-list">{pages.map(page => <div className={`page-list-row ${page.id === activePageId ? "active" : ""}`} key={page.id}><button className="page-list-open" onClick={() => switchPage(page.id)} title={`Open ${page.name}`}><FileText size={14}/><span>{page.name}</span><small>{page.nodes.length}</small></button>{page.id === activePageId && <button className="page-list-menu" title="Rename page" onClick={renameActivePage}><MoreHorizontal size={15}/></button>}</div>)}</div><div className="page-actions"><button onClick={addPage}><Plus size={13}/> New page</button><button onClick={renameActivePage}><FileText size={13}/> Rename</button><button onClick={deleteActivePage} disabled={pages.length <= 1}><Trash2 size={13}/> Delete</button></div><div className="layer-toolbar"><span>ELEMENT TREE</span></div><div className="layer-list">{nodes.filter(n => n.parentId === null).map(n => renderLayerNode(n))}</div></>;
    if (workspace === "Components") return <><div className="panel-heading"><div><h2>Reusable components</h2><p>Save a selection once, insert it anywhere.</p></div></div><div className="inspector-section"><label className="field-label">Component name<input aria-label="Component name" placeholder={selected?.name ?? "e.g. Pricing card"} value={componentName} onChange={e => setComponentName(e.target.value)}/></label><button className="primary-small" onClick={saveSelectedAsComponent} disabled={!selected || selected.locked}><Plus size={13}/> Save selected element and children</button></div><div className="layer-toolbar"><span>COMPONENT LIBRARY ({components.length})</span></div><div className="workspace-scroll">{components.length === 0 ? <p className="muted-note">Select a container, section or element, then save it here as a reusable component.</p> : components.map(component => <div className="resource-row component-library-row" key={component.id}><button className="component-insert" onClick={() => insertReusableComponent(component)}><span className="resource-icon"><Shapes size={15}/></span><span>{component.name}<small>{component.nodes.length} elements · local library</small></span></button><button className="page-list-menu" title={`Delete component ${component.name}`} onClick={() => deleteReusableComponent(component.id)}><Trash2 size={13}/></button></div>)}</div></>;
    const content: Record<Exclude<Workspace, "Add" | "Layers">, { icon: typeof Plus; title: string; description: string; cards: string[] }> = {
      Templates: { icon: LayoutTemplate, title: "Start with a template", description: "A strong starting point for your next idea.", cards: ["Portfolio starter", "SaaS landing page", "Studio homepage", "Product launch"] },
      Databases: { icon: Database, title: "Your data sources", description: "Connect structured data to your designs.", cards: ["Sample products", "Team members", "Blog posts", "Add a data source"] },
      Components: { icon: Shapes, title: "Reusable components", description: "Keep your design consistent across pages.", cards: ["Buttons", "Navigation", "Feature cards", "Create component"] },
      Collaboration: { icon: MessageSquare, title: "Work together", description: "Share feedback and keep the team aligned.", cards: ["Invite a collaborator", "Review comments", "Activity history", "Share review link"] },
      "Add-ons": { icon: Grid2X2, title: "Extend your workspace", description: "Connect tools and customize your workflow.", cards: ["Integrations", "Design themes", "Installed add-ons", "Manage permissions"] },
    };
    const data = content[workspace]; const Icon = data.icon;
    return <><div className="panel-heading"><div><h2>{workspace}</h2><p>{data.description}</p></div></div><div className="workspace-scroll"><div className="feature-panel-hero"><span className="large-feature-icon"><Icon size={23}/></span><h3>{data.title}</h3><p>{data.description}</p></div>{data.cards.map((card, i) => <button className="resource-row" key={card} onClick={() => { if (workspace === "Templates") applyTemplate(card); else setToast(`${card} is not available in this build yet`); }}><span className="resource-icon">{i === 0 ? <FolderOpen size={16}/> : i === 1 ? <Database size={16}/> : <Box size={16}/>}</span><span>{card}<small>{workspace === "Templates" ? "Starter layout" : workspace === "Databases" ? "Sample collection" : "Workspace resource"}</small></span><ChevronRight size={14}/></button>)}</div></>;
  };

  const renderInspector = () => {
    if (inspector === "Backend") return <div className="backend-content"><div className="backend-header"><div><span className="eyebrow-label">DEVELOPMENT WORKSPACE</span><h2>Backend logic</h2></div><div className="backend-size-actions"><button title="Inspector width" className={backendSize === "inspector" ? "active" : ""} onClick={() => setBackendSize("inspector")}><PanelRightClose size={14}/></button><button title="Expanded workspace" className={backendSize === "expanded" ? "active" : ""} onClick={() => setBackendSize("expanded")}><Columns2 size={14}/></button><button title="Focus mode" className={backendSize === "focus" ? "active" : ""} onClick={() => setBackendSize("focus")}><MaximizeIcon/></button></div></div><div className="backend-tabs">{(["Blocks", "Code", "Data", "Events", "Console"] as BackendTab[]).map(t => <button key={t} className={backendTab === t ? "active" : ""} onClick={() => setBackendTab(t)}>{t}</button>)}</div>{backendTab === "Blocks" ? <><div className="event-card"><div className="event-card-top"><span className="event-dot"><MousePointer2 size={13}/></span><span>EVENT TRIGGER</span><MoreHorizontal size={15}/></div><strong>When {selected?.type === "button" ? "button" : selected?.name.toLowerCase()} is clicked</strong><small>Element: {selected?.name ?? "None selected"}</small></div><div className="block-connector"/><div className="logic-block purple-block"><div className="block-top"><Zap size={13}/><span>VARIABLES</span></div><strong>Set variable</strong><div className="block-field"><span>name</span><code>message</code></div><div className="block-field"><span>value</span><code>"Welcome to Sytely"</code></div></div><div className="block-connector"/><div className="logic-block blue-block"><div className="block-top"><Type size={13}/><span>ELEMENT ACTION</span></div><strong>Set text content</strong><div className="block-field"><span>target</span><code>resultLabel</code></div><div className="block-field"><span>value</span><code>message</code></div></div><button className="add-block-button" onClick={() => setToast("Choose a block from the block library")}><Plus size={14}/> Add action block</button><div className="generated-preview"><div className="section-title">GENERATED LOGIC PREVIEW <span className="read-only-tag">READ ONLY</span></div><pre>{`async function onClick(event) {\n  const message = "Welcome to Sytely";\n  resultLabel.textContent = message;\n}`}</pre></div></> : backendTab === "Code" ? <><div className="code-toolbar"><span><Code2 size={13}/> Custom JavaScript</span><span className="read-only-tag">DRAFT</span></div><textarea className="code-editor" spellCheck={false} value={code} onChange={e => setCode(e.target.value)} aria-label="Custom JavaScript code"/><div className="code-actions"><button className="subtle-button" onClick={() => setCode("onClick(button)\n  setVariable(\"message\", \"Welcome to Sytely\")\n  setText(resultLabel, message)")}><Undo2 size={13}/> Reset</button><button className="primary-small" onClick={() => setToast("Code draft saved locally")}>Save code</button></div><p className="muted-note">Custom code is stored separately from generated visual logic.</p></> : backendTab === "Data" ? <><div className="section-title">DATA SOURCES</div>{["Products · 8 fields", "Team members · 5 fields", "Blog posts · 6 fields"].map((t, i) => <button className="resource-row" key={t} onClick={() => setToast("Sample data source selected")}><Database size={15}/><span>{t}<small>{i === 0 ? "Sample collection" : "Not connected"}</small></span><ChevronRight size={14}/></button>)}<button className="add-block-button" onClick={() => setToast("Connect a data provider to continue")}><Plus size={14}/> Add data source</button></> : backendTab === "Events" ? <><div className="section-title">EVENT HANDLERS</div><div className="event-card"><div className="event-card-top"><CircleDot size={13}/><span>CLICK EVENT</span></div><strong>When {selected?.name ?? "element"} is clicked</strong><small>2 actions · Enabled</small></div><button className="add-block-button" onClick={() => setToast("Event handler draft created")}><Plus size={14}/> Add event handler</button></> : <><div className="diagnostic-summary"><Check size={16}/><div><strong>Editor validation passed</strong><small>0 errors · 1 informational message</small></div></div><div className="console-entry"><span>07:41:02</span><code>Editor ready. No runtime execution yet.</code></div><div className="console-entry"><span>07:41:02</span><code>Visual blocks are in draft mode.</code></div><button className="subtle-button" onClick={() => setConsoleOpen(!consoleOpen)}>{consoleOpen ? "Hide details" : "Show validation details"}</button>{consoleOpen && <p className="muted-note">No event code has been executed. Publishing and live backend execution are not configured.</p>}</>}</div>;
    const common = <div className="inspector-section"><div className="section-title">SELECTED ELEMENT <span className="type-chip">{selected?.type ?? "page"}</span></div><div className="selected-object"><span className="selected-object-icon">{selected?.type === "button" ? <MousePointer2 size={16}/> : selected?.type === "heading" ? <Heading size={16}/> : selected?.type === "image" ? <Image size={16}/> : <Box size={16}/>}</span><div><strong>{selected?.name ?? "Page"}</strong><small>{selected?.id ?? "root"}</small></div><button title="Duplicate element" onClick={duplicateNode}><Copy size={14}/></button><button title="Delete element" onClick={() => selected && removeNode(selected.id)}><Trash2 size={14}/></button></div></div>;
    if (inspector === "Properties") return <><div className="panel-heading inspector-title"><div><h2>Properties</h2><p>Configure the selected element.</p></div><button className="icon-button" onClick={() => setRightCollapsed(true)}><X size={15}/></button></div>{common}<div className="inspector-section"><div className="section-title">CONTENT</div><label className="field-label">Element name<input value={selected?.name ?? ""} onChange={e => updateSelected({ name: e.target.value })}/></label>{selected?.type !== "section" && selected?.type !== "container" && <label className="field-label">Text content<textarea rows={3} value={selected?.text ?? ""} onChange={e => updateSelected({ text: e.target.value })}/></label>}{selected?.type === "button" && <><label className="field-label">Link URL<input type="url" placeholder="https://example.com" value={selected?.href ?? ""} onChange={e => updateSelected({ href: e.target.value })}/></label><label className="check-row"><input type="checkbox" checked={selected?.openInNewTab ?? false} onChange={e => updateSelected({ openInNewTab: e.target.checked })}/> Open in new tab</label></>}{selected?.type === "image" && <><label className="field-label">Image URL<input type="text" placeholder="https://example.com/image.jpg" value={selected?.src ?? ""} onChange={e => updateSelected({ src: e.target.value })}/></label><label className="field-label">Upload image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleImageUpload}/></label><p className="muted-note">PNG, JPEG, WebP or GIF · up to 1 MB. Embedded images travel with the exported site.</p></>}</div><div className="inspector-section"><div className="section-title">LAYOUT</div><div className="two-fields"><label className="field-label">Width<select value={selected?.styles.width ?? "Auto"} onChange={e => updateSelected({ styles: { width: e.target.value } })}><option>Auto</option><option>100%</option><option>Fit content</option><option>320px</option></select></label><label className="field-label">Alignment<select value={selected?.styles.align ?? "center"} onChange={e => updateSelected({ styles: { align: e.target.value } })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label></div><label className="field-label">Padding <span className="inline-value">{selected?.styles.padding ?? 0}px</span><input type="range" min="0" max="80" step="4" value={selected?.styles.padding ?? 0} onChange={e => updateSelected({ styles: { padding: Number(e.target.value) } })}/></label></div><div className="inspector-section"><div className="section-title">APPEARANCE</div><label className="field-label">Text color<div className="color-field"><input type="color" value={selected?.styles.color ?? "#202033"} onChange={e => updateSelected({ styles: { color: e.target.value } })}/><code>{selected?.styles.color ?? "Default"}</code><button onClick={() => updateSelected({ styles: { color: undefined } })}>Reset</button></div></label><label className="field-label">Background<div className="color-field"><input type="color" value={selected?.styles.background ?? "#ffffff"} onChange={e => updateSelected({ styles: { background: e.target.value } })}/><code>{selected?.styles.background ?? "Transparent"}</code><button onClick={() => updateSelected({ styles: { background: undefined } })}>Reset</button></div></label><label className="field-label">Corner radius <span className="inline-value">{selected?.styles.radius ?? 0}px</span><input type="range" min="0" max="28" step="2" value={selected?.styles.radius ?? 0} onChange={e => updateSelected({ styles: { radius: Number(e.target.value) } })}/></label></div><div className="inspector-bottom-note"><Check size={14}/> Changes update the canvas immediately</div></>;
    if (inspector === "Layout") return <><div className="panel-heading"><div><h2>Layout</h2><p>Size, spacing and alignment</p></div></div>{common}<div className="inspector-section"><div className="section-title">LAYOUT MODE</div><label className="field-label">Display<select aria-label="Layout display" value={selected?.styles.display ?? "block"} onChange={e => updateSelected({ styles: { display: e.target.value as StyleSet["display"] } })}><option value="block">Block</option><option value="flex">Flex</option><option value="grid">Grid</option></select></label>{(selected?.styles.display === "flex" || selected?.styles.display === "grid") && <><div className="two-fields"><label className="field-label">Gap (px)<input aria-label="Layout gap" type="number" min="0" max="200" value={selected?.styles.gap ?? 12} onChange={e => updateSelected({ styles: { gap: Math.max(0, Math.min(200, Number(e.target.value) || 0)) } })}/></label>{selected?.styles.display === "grid" ? <label className="field-label">Columns<select aria-label="Grid columns" value={selected?.styles.gridColumns ?? 2} onChange={e => updateSelected({ styles: { gridColumns: Number(e.target.value) } })}>{[1,2,3,4,5,6,8,12].map(n => <option key={n} value={n}>{n}</option>)}</select></label> : <label className="field-label">Direction<select aria-label="Flex direction" value={selected?.styles.flexDirection ?? "row"} onChange={e => updateSelected({ styles: { flexDirection: e.target.value as StyleSet["flexDirection"] } })}><option value="row">Row</option><option value="column">Column</option></select></label>}</div>{selected?.styles.display === "flex" && <><label className="field-label">Justify content<select aria-label="Justify content" value={selected?.styles.justifyContent ?? "start"} onChange={e => updateSelected({ styles: { justifyContent: e.target.value as StyleSet["justifyContent"] } })}><option value="start">Start</option><option value="center">Center</option><option value="end">End</option><option value="between">Space between</option><option value="around">Space around</option></select></label><label className="field-label">Align items<select aria-label="Align items" value={selected?.styles.alignItems ?? "stretch"} onChange={e => updateSelected({ styles: { alignItems: e.target.value as StyleSet["alignItems"] } })}><option value="start">Start</option><option value="center">Center</option><option value="end">End</option><option value="stretch">Stretch</option></select></label><label className="check-row"><input aria-label="Wrap flex items" type="checkbox" checked={selected?.styles.flexWrap === "wrap"} onChange={e => updateSelected({ styles: { flexWrap: e.target.checked ? "wrap" : "nowrap" } })}/> Wrap items</label></>}</>}<div className="section-title" style={{marginTop:18}}>DIMENSIONS</div><div className="two-fields"><label className="field-label">Width<select value={selected?.styles.width ?? "Auto"} onChange={e => updateSelected({ styles: { width: e.target.value } })}><option>Auto</option><option>100%</option><option>Fit content</option><option>320px</option></select></label><label className="field-label">Height<select value={selected?.styles.height ?? "Auto"} onChange={e => updateSelected({ styles: { height: e.target.value } })}><option>Auto</option><option>100%</option><option>320px</option><option>480px</option></select></label></div><label className="field-label">Padding<input type="range" min="0" max="80" step="4" value={selected?.styles.padding ?? 0} onChange={e => updateSelected({ styles: { padding: Number(e.target.value) } })}/></label><div className="align-controls"><button onClick={() => updateSelected({ styles: { align: "left" } })}><AlignLeft size={16}/></button><button onClick={() => updateSelected({ styles: { align: "center" } })}><AlignCenter size={16}/></button><button onClick={() => updateSelected({ styles: { align: "right" } })}><AlignJustify size={16}/></button></div></div></>;
    if (inspector === "Style") return <><div className="panel-heading"><div><h2>Style</h2><p>Typography, colors and effects</p></div></div>{common}<div className="inspector-section"><div className="section-title">TYPOGRAPHY</div><label className="field-label">Font size <span className="inline-value">{selected?.styles.fontSize ?? 16}px</span><input type="range" min="10" max="64" value={selected?.styles.fontSize ?? 16} onChange={e => updateSelected({ styles: { fontSize: Number(e.target.value) } })}/></label><div className="align-controls"><button onClick={() => updateSelected({ styles: { align: "left" } })}><AlignLeft size={16}/></button><button onClick={() => updateSelected({ styles: { align: "center" } })}><AlignCenter size={16}/></button><button onClick={() => updateSelected({ styles: { align: "right" } })}><AlignJustify size={16}/></button></div><label className="field-label">Text color<div className="color-field"><input type="color" value={selected?.styles.color ?? "#202033"} onChange={e => updateSelected({ styles: { color: e.target.value } })}/><code>{selected?.styles.color ?? "Default"}</code></div></label><label className="field-label">Background<div className="color-field"><input type="color" value={selected?.styles.background ?? "#ffffff"} onChange={e => updateSelected({ styles: { background: e.target.value } })}/><code>{selected?.styles.background ?? "Transparent"}</code></div></label></div></>;
    if (inspector === "Responsive") return <><div className="panel-heading"><div><h2>Responsive</h2><p>Set styles per viewport</p></div></div>{common}<div className="inspector-section"><div className="section-title">BREAKPOINTS</div>{["Desktop · 1280px+", "Tablet · 768px", "Mobile · 390px"].map((t, i) => <button className={`resource-row ${viewport === (i === 0 ? "desktop" : i === 1 ? "tablet" : "mobile") ? "active" : ""}`} key={t} onClick={() => { setViewport(i === 0 ? "desktop" : i === 1 ? "tablet" : "mobile"); setToast(`${t.split(" · ")[0]} styles selected`); }}><span className="resource-icon">{i === 0 ? <Monitor size={15}/> : i === 1 ? <Tablet size={15}/> : <Smartphone size={15}/>}</span><span>{t}<small>{i === 0 ? "Base styles" : selected?.responsive?.[i === 1 ? "tablet" : "mobile"] ? "Custom overrides" : "Inherits desktop styles"}</small></span><ChevronRight size={14}/></button>)}</div>{selected && <div className="inspector-section"><div className="section-title">{viewport === "desktop" ? "BASE STYLES" : `${viewport.toUpperCase()} OVERRIDES`}</div><label className="field-label">Font size <span className="inline-value">{(viewport === "desktop" ? selected.styles.fontSize : selected.responsive?.[viewport]?.fontSize) ?? selected.styles.fontSize ?? 16}px</span><input type="range" min="10" max="64" value={(viewport === "desktop" ? selected.styles.fontSize : selected.responsive?.[viewport]?.fontSize) ?? selected.styles.fontSize ?? 16} onChange={e => updateResponsive({ fontSize: Number(e.target.value) })}/></label><label className="field-label">Padding <span className="inline-value">{(viewport === "desktop" ? selected.styles.padding : selected.responsive?.[viewport]?.padding) ?? selected.styles.padding ?? 0}px</span><input type="range" min="0" max="100" step="4" value={(viewport === "desktop" ? selected.styles.padding : selected.responsive?.[viewport]?.padding) ?? selected.styles.padding ?? 0} onChange={e => updateResponsive({ padding: Number(e.target.value) })}/></label><label className="field-label">Alignment<select value={(viewport === "desktop" ? selected.styles.align : selected.responsive?.[viewport]?.align) ?? selected.styles.align ?? "center"} onChange={e => updateResponsive({ align: e.target.value })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label><button className="subtle-button" onClick={() => { if (viewport === "desktop") updateSelected({ styles: { fontSize: undefined, padding: undefined, align: undefined } }); else updateSelected({ responsive: { ...selected.responsive, [viewport]: undefined } }); }}>Reset {viewport} styles</button></div>}<p className="muted-note">Tablet and mobile overrides are saved with each element and included in exported HTML.</p></>;
    if (inspector === "Interactions") return <><div className="panel-heading"><div><h2>Interactions</h2><p>Real click actions in preview and published sites</p></div></div>{common}<div className="inspector-section"><div className="section-title">ON CLICK</div><label className="field-label">Action<select aria-label="Click action" value={selected?.interaction?.action ?? "toggleVisibility"} onChange={e => updateSelected({ interaction: { trigger: "click", action: e.target.value as NodeInteraction["action"], targetId: selected?.interaction?.targetId, targetPageId: selected?.interaction?.targetPageId, value: selected?.interaction?.value } })}><option value="toggleVisibility">Toggle element visibility</option><option value="setText">Change element text</option><option value="scrollTo">Scroll to element</option><option value="navigatePage">Navigate to page</option></select></label>{selected?.interaction?.action !== "navigatePage" && <label className="field-label">Target element<select aria-label="Interaction target element" value={selected?.interaction?.targetId ?? ""} onChange={e => updateSelected({ interaction: { trigger: "click", action: selected?.interaction?.action ?? "toggleVisibility", targetId: e.target.value || undefined, targetPageId: selected?.interaction?.targetPageId, value: selected?.interaction?.value } })}><option value="">Choose an element…</option>{nodes.filter(n => n.id !== selected?.id).map(n => <option key={n.id} value={n.id}>{n.name}</option>)}</select></label>}{selected?.interaction?.action === "navigatePage" && <label className="field-label">Destination page<select aria-label="Interaction destination page" value={selected?.interaction?.targetPageId ?? ""} onChange={e => updateSelected({ interaction: { trigger: "click", action: "navigatePage", targetPageId: e.target.value } })}><option value="">Choose a page…</option>{pages.filter(p => p.id !== activePageId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}{selected?.interaction?.action === "setText" && <label className="field-label">Replacement text<textarea aria-label="Replacement text" value={selected?.interaction?.value ?? ""} onChange={e => updateSelected({ interaction: { trigger: "click", action: "setText", targetId: selected?.interaction?.targetId, value: e.target.value } })}/></label>}<p className="muted-note">Test the action with Preview. Actions are stored with the page and run without custom JavaScript.</p><button className="subtle-button" onClick={() => updateSelected({ interaction: undefined })} disabled={!selected?.interaction}>Remove interaction</button></div></>;
    if (inspector === "Accessibility") return <><div className="panel-heading"><div><h2>Accessibility</h2><p>Make your page work for everyone.</p></div></div>{common}<div className="inspector-section"><div className="section-title">SEMANTICS</div><label className="field-label">Semantic element<select value={selected?.semantic ?? (selected?.type === "heading" ? "h1" : selected?.type === "button" ? "button" : "default")} onChange={e => updateSelected({ semantic: e.target.value })}><option value="default">Default</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option><option value="button">Button</option><option value="section">Section</option></select></label><label className="field-label">Accessible label<input placeholder="Describe this element" value={selected?.ariaLabel ?? ""} onChange={e => updateSelected({ ariaLabel: e.target.value })}/></label>{selected?.type === "image" && <><label className="field-label">Image URL<input type="url" placeholder="https://example.com/image.jpg" value={selected.src ?? ""} onChange={e => updateSelected({ src: e.target.value })}/></label><label className="field-label">Alternative text<input value={selected.text} onChange={e => updateSelected({ text: e.target.value })} placeholder="Describe the image"/></label></>}<div className="diagnostic-summary"><Check size={15}/><div><strong>Keyboard focus available</strong><small>Review labels before publishing</small></div></div></div></>;
    return <><div className="panel-heading"><div><h2>Advanced</h2><p>Identifiers and diagnostics</p></div></div>{common}<div className="inspector-section"><div className="section-title">ELEMENT ATTRIBUTES</div><label className="field-label">Element ID<input value={selected?.id ?? ""} readOnly/></label><label className="field-label">Component type<input value={selected?.type ?? ""} readOnly/></label><label className="field-label">Parent element<input value={nodes.find(n => n.id === selected?.parentId)?.name ?? "Page root"} readOnly/></label><button className="subtle-button" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(selected, null, 2)); setToast("Element JSON copied"); }}><Copy size={13}/> Copy element JSON</button></div></>;
  };

  const canvasWidth = viewport === "desktop" ? "100%" : viewport === "tablet" ? "768px" : "390px";
  return <div className={`app-shell ${preview ? "preview-mode" : ""} ${backendSize !== "inspector" && inspector === "Backend" ? `backend-${backendSize}` : ""}`}>
    <header className="topbar"><div className="brand-lockup"><div className="brand-mark"><Shapes size={19}/></div><span className="brand-name">sytely</span><span className="brand-divider"/><button className="project-switcher" title="Rename website" onClick={() => { const name = window.prompt("Website name", projectName); if (name?.trim()) setProjectName(name.trim().slice(0, 80)); }}>{projectName} <ChevronDown size={13}/></button></div><div className="topbar-centre"><span className={`save-indicator ${saveState}`}><span/>{savedLabel}</span></div><div className="topbar-actions"><button className="icon-button desktop-only" title="Undo (Ctrl/Cmd+Z)" onClick={undo} disabled={!history.length}><Undo2 size={16}/></button><button className="icon-button desktop-only" title="Redo (Ctrl/Cmd+Shift+Z)" onClick={redo} disabled={!future.length}><Redo2 size={16}/></button><span className="topbar-divider desktop-only"/><button className={`preview-button ${preview ? "is-active" : ""}`} onClick={() => { setPreview(!preview); setMobilePanel(null); }}><Eye size={15}/><span>{preview ? "Edit" : "Preview"}</span></button><button className="export-button" onClick={exportSiteHtml} title="Download a standalone HTML site with all pages"><ExternalLink size={14}/><span>Export site</span></button><button className="publish-button" onClick={() => window.dispatchEvent(new Event("sytely:publish"))}><Upload size={14}/><span>Publish</span></button><CloudAccount nodes={nodes} pages={pages} activePageId={activePageId} pageName={projectName} onToast={setToast} /><button className="avatar-button" title="Account menu" onClick={() => document.querySelector<HTMLButtonElement>(".cloud-account-button")?.click()}>S</button></div></header>
    <main className={`editor-layout ${preview ? "preview-layout" : ""}`}>
      {!preview && <>{rail("left", leftCollapsed, setLeftCollapsed)}{!leftCollapsed && <><aside className={`workspace-panel ${mobilePanel === "left" ? "mobile-open" : ""}`} style={{ "--panel-width": `${leftWidth}px` } as React.CSSProperties}>{renderWorkspace()}</aside><div className="resize-handle left-resize" role="separator" aria-label="Resize left panel" aria-orientation="vertical" tabIndex={0} onMouseDown={e => changeWorkspaceSize("left", e)} onDoubleClick={() => resetWidth("left")} onKeyDown={e => { if (e.key === "ArrowLeft") setLeftWidth(w => Math.max(200, w - 12)); if (e.key === "ArrowRight") setLeftWidth(w => Math.min(480, w + 12)); }}/></>}</>}
      <section className={`canvas-workspace ${preview ? "canvas-preview" : ""}`}><div className="canvas-toolbar"><div className="canvas-page-control"><button className="page-dropdown" title="Rename page" onClick={() => { const name = window.prompt("Page name", pageName); if (name?.trim()) setPageName(name.trim().slice(0, 80)); }}><FileText size={14}/><span>{pageName}</span><ChevronDown size={12}/></button><span className="toolbar-slash">/</span><span className="toolbar-muted">Website</span></div><div className="canvas-tools"><div className="viewport-switcher"><button title="Desktop viewport" aria-label="Desktop viewport" className={viewport === "desktop" ? "active" : ""} onClick={() => setViewport("desktop")}><Monitor size={15}/></button><button title="Tablet viewport" aria-label="Tablet viewport" className={viewport === "tablet" ? "active" : ""} onClick={() => setViewport("tablet")}><Tablet size={15}/></button><button title="Mobile viewport" aria-label="Mobile viewport" className={viewport === "mobile" ? "active" : ""} onClick={() => setViewport("mobile")}><Smartphone size={15}/></button></div><span className="toolbar-divider"/><button className="zoom-control" onClick={() => setZoom(z => Math.max(50, z - 10))} title="Zoom out">−</button><button className="zoom-value" onClick={() => setZoom(100)}>{zoom}%</button><button className="zoom-control" onClick={() => setZoom(z => Math.min(150, z + 10))} title="Zoom in">+</button><span className="toolbar-divider"/><button className={`icon-button canvas-tool-button ${showGuides ? "tool-active" : ""}`} title="Toggle layout guides" onClick={() => setShowGuides(!showGuides)}><Grid2X2 size={15}/></button><button className="icon-button canvas-tool-button" title="Fit canvas to screen" onClick={() => { setZoom(100); setViewport("desktop"); }}><MaximizeIcon/></button></div></div>
        <div className="canvas-scroll" ref={canvasRef} onClick={() => { if (!preview) setSelectedId(""); }}><div className="canvas-stage" style={{ width: canvasWidth, transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}><div className={`website-page ${viewport}`} onClick={e => { if (e.target === e.currentTarget && !preview) setSelectedId(""); }}><div className="site-navbar"><div className="site-logo"><span className="site-logo-mark"><Shapes size={14}/></span> STUDIO</div><nav>{pages.map(page => <button key={page.id} onClick={() => switchPage(page.id)}>{page.name}</button>)}</nav><button className="site-nav-cta" onClick={() => setToast("Navigation action preview")}>Let's talk <ArrowRight size={13}/></button></div><div className="site-content" onDragOver={e => e.preventDefault()} onDrop={e => onDrop(e, null)}>{nodes.filter(n => n.parentId === null).map(renderElement)}{!nodes.length && <div className="canvas-empty"><Sparkles size={25}/><h2>Your canvas is ready</h2><p>Add an element to start building your page.</p><button className="primary-small" onClick={() => { setWorkspace("Add"); addNode("section"); }}>Add section</button></div>}</div><footer className="site-footer"><span>Made with <b>sytely</b></span><span>Designed with intention.</span></footer></div></div></div>
        {!preview && <div className="canvas-statusbar"><div><span className="status-dot"/><span>{selected ? selected.name : "No selection"}</span><span className="status-separator">·</span><span>{viewport === "desktop" ? "Desktop" : viewport === "tablet" ? "Tablet" : "Mobile"} preview</span></div><div><span>{nodes.length} elements</span><span className="status-separator">·</span><span>Canvas ready</span></div></div>}
      </section>
      {!preview && <>{!rightCollapsed && <div className="resize-handle right-resize" role="separator" aria-label="Resize inspector panel" aria-orientation="vertical" tabIndex={0} onMouseDown={e => changeWorkspaceSize("right", e)} onDoubleClick={() => resetWidth("right")} onKeyDown={e => { if (e.key === "ArrowLeft") setRightWidth(w => Math.min(600, w + 12)); if (e.key === "ArrowRight") setRightWidth(w => Math.max(240, w - 12)); }}/ >}{!rightCollapsed && <aside className={`inspector-panel ${mobilePanel === "right" ? "mobile-open" : ""}`} style={{ "--panel-width": `${rightWidth}px` } as React.CSSProperties}>{renderInspector()}</aside>}{rail("right", rightCollapsed, setRightCollapsed)}</>}
    </main>
    {!preview && <footer className="global-status"><div><span className="green-status"><Check size={12}/></span><span>{saveState === "saved" ? "All changes saved" : "Unsaved changes"}</span><span className="status-separator">·</span><span>Local draft</span></div><div><button onClick={() => setToast("Keyboard shortcuts: ⌘/Ctrl Z undo · ⌘/Ctrl D duplicate · ⌘/Ctrl S save · ⌘/Ctrl K add elements")}><CircleHelp size={13}/> Shortcuts</button><span className="status-separator">·</span><span> Sytely Studio <span className="version-label">v0.1</span></span></div></footer>}
    {preview && <div className="preview-exit"><span><Eye size={14}/> Preview mode</span><button onClick={() => setPreview(false)}>Return to editor <ArrowRight size={14}/></button></div>}
    {mobilePanel && <button className="mobile-scrim" aria-label="Close panel" onClick={() => setMobilePanel(null)}/>}
    {toast && <div className="toast-message"><Check size={15}/>{toast}<button onClick={() => setToast("")}><X size={13}/></button></div>}
  </div>;
}

function MaximizeIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>}
