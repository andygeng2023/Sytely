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
  styles: { color?: string; background?: string; fontSize?: number; padding?: number; radius?: number; align?: string; width?: string };
};
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
  { name: "Databases", icon: Database, subtitle: "Data sources" },
  { name: "Components", icon: Shapes, subtitle: "Reusable UI" },
  { name: "Collaboration", icon: MessageSquare, subtitle: "Team workspace" },
  { name: "Add-ons", icon: Grid2X2, subtitle: "Extensions" },
];
const inspectorItems: { name: InspectorMode; icon: typeof Plus }[] = [
  { name: "Properties", icon: SlidersHorizontal }, { name: "Layout", icon: Columns2 },
  { name: "Style", icon: Paintbrush }, { name: "Responsive", icon: Smartphone },
  { name: "Interactions", icon: Zap }, { name: "Backend", icon: Braces },
  { name: "Accessibility", icon: Accessibility }, { name: "Advanced", icon: Settings2 },
];
const elementGroups: { label: string; icon: typeof Plus; items: { label: string; type: NodeKind; icon: typeof Plus; description: string }[] }[] = [
  { label: "Layout", icon: Grid2X2, items: [{ label: "Section", type: "section", icon: Square, description: "Full-width page section" }, { label: "Container", type: "container", icon: Box, description: "Constrain and group content" }] },
  { label: "Basic", icon: Type, items: [{ label: "Heading", type: "heading", icon: Heading, description: "A title or heading" }, { label: "Text", type: "paragraph", icon: Type, description: "A paragraph of text" }, { label: "Button", type: "button", icon: MousePointer2, description: "A clickable call to action" }, { label: "Divider", type: "paragraph", icon: AlignJustify, description: "Separate content visually" }] },
  { label: "Media", icon: Image, items: [{ label: "Image", type: "image", icon: Image, description: "An image with alt text" }] },
  { label: "Interactive", icon: Zap, items: [{ label: "Feature card", type: "feature", icon: Box, description: "A reusable content card" }] },
  { label: "Forms", icon: FormInput, items: [{ label: "Form field", type: "paragraph", icon: FormInput, description: "A labelled form field placeholder" }] },
  { label: "Data", icon: Database, items: [{ label: "Data list", type: "feature", icon: List, description: "A collection backed by data" }] },
];
const uid = () => `node-${Math.random().toString(36).slice(2, 9)}`;

function isPageNodeArray(value: unknown): value is PageNode[] {
  if (!Array.isArray(value)) return false;
  const allowed = new Set<NodeKind>(["heading", "paragraph", "button", "section", "image", "feature", "container"]);
  const ids = new Set<string>();
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object") return false;
    const node = candidate as Partial<PageNode>;
    if (typeof node.id !== "string" || !node.id || ids.has(node.id) ||
        typeof node.name !== "string" || typeof node.text !== "string" ||
        typeof node.type !== "string" || !allowed.has(node.type as NodeKind) ||
        !(node.parentId === null || typeof node.parentId === "string") ||
        typeof node.visible !== "boolean" || typeof node.locked !== "boolean" ||
        !node.styles || typeof node.styles !== "object" || Array.isArray(node.styles)) return false;
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

export default function App() {
  const [nodes, setNodes] = useState<PageNode[]>(() => {
    try {
      const raw = window.localStorage.getItem("sytely:document:v1");
      if (!raw) return initialNodes;
      const parsed: unknown = JSON.parse(raw);
      if (!isPageNodeArray(parsed)) return initialNodes;
      return parsed;
    } catch { return initialNodes; }
  });
  const [selectedId, setSelectedId] = useState(() => {
    try {
      const raw = window.localStorage.getItem("sytely:document:v1");
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isPageNodeArray(parsed) && parsed.some((node) => node.id === "hero-button")) return "hero-button";
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
  const [pageName, setPageName] = useState("Home");
  const canvasRef = useRef<HTMLDivElement>(null);
  const selected = nodes.find(n => n.id === selectedId);
  const childrenOf = useCallback((parentId: string | null) => nodes.filter(n => n.parentId === parentId), [nodes]);
  const childNodes = useMemo(() => nodes.filter(n => n.parentId === selectedId), [nodes, selectedId]);

  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.matches("input,textarea,select") || target.isContentEditable || target.closest(".code-editor"));
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); setSavedLabel("All changes saved"); setSaveState("saved"); setToast("Project saved locally"); return; }
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
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem("sytely:document:v1", JSON.stringify(nodes));
        setSaveState("saved");
        setSavedLabel("Saved on this device");
      } catch {
        setSaveState("unsaved");
        setSavedLabel("Local storage unavailable");
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [nodes]);
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
    setSaveState("unsaved");
    setSavedLabel("Unsaved changes");
  };
  function undo() {
    setHistory(h => { if (!h.length) return h; const prev = h[h.length - 1]; setFuture(f => [nodes, ...f]); setNodes(prev); setSaveState("unsaved"); setSavedLabel("Unsaved changes"); return h.slice(0, -1); });
  }
  function redo() {
    setFuture(f => { if (!f.length) return f; const next = f[0]; setHistory(h => [...h, nodes]); setNodes(next); setSaveState("unsaved"); setSavedLabel("Unsaved changes"); return f.slice(1); });
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
  function updateSelected(patch: Partial<PageNode> | { styles: Partial<PageNode["styles"]> }) {
    if (!selected || selected.locked) return;
    commit(nodes.map(n => n.id === selected.id ? { ...n, ...patch, styles: "styles" in patch ? { ...n.styles, ...patch.styles } : n.styles } : n));
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
    const style: React.CSSProperties = {
      color: node.styles.color, backgroundColor: node.type === "button" ? node.styles.background : node.type === "section" || node.type === "container" || node.type === "feature" || node.type === "image" ? node.styles.background : undefined,
      fontSize: node.styles.fontSize, padding: node.type === "button" ? `${node.styles.padding ?? 12}px 22px` : node.styles.padding,
      width: node.styles.width && node.styles.width !== "Auto" ? node.styles.width === "Fit content" ? "fit-content" : node.styles.width : undefined,
      borderRadius: node.styles.radius, textAlign: (node.styles.align as React.CSSProperties["textAlign"]) ?? "center",
    };
    const inner = node.type === "heading" ? <h1 style={style} contentEditable={!preview && !node.locked} suppressContentEditableWarning onBlur={e => { if (e.currentTarget.textContent !== node.text) commit(nodes.map(n => n.id === node.id ? { ...n, text: e.currentTarget.textContent ?? "" } : n)); }} onClick={e => e.stopPropagation()}>{node.text}</h1>
      : node.type === "paragraph" ? <p style={style} contentEditable={!preview && !node.locked} suppressContentEditableWarning onBlur={e => { if (e.currentTarget.textContent !== node.text && !node.locked) commit(nodes.map(n => n.id === node.id ? { ...n, text: e.currentTarget.textContent ?? "" } : n)); }} onClick={e => e.stopPropagation()}>{node.text}</p>
      : node.type === "button" ? <a className="site-cta" style={style} href={preview ? node.href || undefined : undefined} target={node.openInNewTab ? "_blank" : undefined} rel={node.openInNewTab ? "noreferrer" : undefined} onClick={e => { if (!preview) { e.preventDefault(); e.stopPropagation(); if (!node.locked) setSelectedId(node.id); } else if (!node.href) { e.preventDefault(); } }}>{node.text}</a>
      : node.type === "image" ? node.src ? <img className="image-placeholder" style={{ ...style, objectFit: "cover", display: "block" }} src={node.src} alt={node.text} /> : <div className="image-placeholder" style={style}><Image size={24}/><span>{node.text}</span><small>Add an image URL in Properties</small></div>
      : node.type === "feature" ? <div className="feature-placeholder" style={style}><span className="feature-icon"><Sparkles size={17}/></span><p>{node.text}</p></div>
      : <div className="container-placeholder" style={style}>{(node.type === "section" || node.type === "container") ? (childrenOf(node.id).length ? childrenOf(node.id).map(renderElement) : node.text || <span className="drop-hint">Container · drop elements here</span>) : node.text}</div>;
    if (node.type === "section") return <section key={node.id} className={`site-section selectable ${isSelected && !preview ? "selected-element" : ""} ${showGuides && !preview ? "guide-visible" : ""} ${node.locked && !preview ? "locked-node" : ""}`} draggable={!preview && !node.locked} onDragStart={e => { setDraggingId(node.id); e.dataTransfer.setData("text/sytely-node", node.id); }} onDragEnd={() => setDraggingId(null)} onClick={e => { e.stopPropagation(); if (!preview && !node.locked) setSelectedId(node.id); }} onDragOver={e => e.preventDefault()} onDrop={e => onDrop(e, node.id)}>{!preview && isSelected && <span className="selection-tag">{node.name}</span>}{inner}{!preview && node.locked && <Lock className="lock-mark" size={12}/>}</section>;
    return <div key={node.id} className={`selectable node-wrap ${isSelected && !preview ? "selected-element" : ""} ${node.locked && !preview ? "locked-node" : ""}`} draggable={!preview && !node.locked} onDragStart={e => { setDraggingId(node.id); e.dataTransfer.setData("text/sytely-node", node.id); }} onDragEnd={() => setDraggingId(null)} onDragOver={e => e.preventDefault()} onDrop={e => onDrop(e, node.id)} onClick={e => { e.stopPropagation(); if (!preview && !node.locked) setSelectedId(node.id); }} onDoubleClick={e => { e.stopPropagation(); if (node.type === "heading" || node.type === "paragraph") (e.currentTarget.querySelector("[contenteditable=true]") as HTMLElement | null)?.focus(); }}>{!preview && isSelected && <span className="selection-tag">{node.name}</span>}{inner}{!preview && node.locked && <Lock className="lock-mark" size={12}/>}</div>;
  };

  const renderWorkspace = () => {
    if (workspace === "Add") return <><div className="panel-heading"><div><h2>Add elements</h2><p>Build your page, one element at a time.</p></div><button className="icon-button" title="Close panel" onClick={() => setLeftCollapsed(true)}><X size={15}/></button></div><div className="search-box"><Search size={15}/><input className="element-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search elements…"/><kbd>⌘ K</kbd></div><div className="category-pills"><button className="category-pill active">All</button><button className="category-pill" onClick={() => setSearch("layout")}>Layout</button><button className="category-pill" onClick={() => setSearch("text")}>Text</button><button className="category-pill" onClick={() => setSearch("media")}>Media</button></div><div className="workspace-scroll">{elementGroups.map(group => { const filtered = group.items.filter(item => `${item.label} ${group.label} ${item.description}`.toLowerCase().includes(search.toLowerCase())); if (!filtered.length) return null; const GroupIcon = group.icon; return <div className="element-group" key={group.label}><button className="group-heading" onClick={() => setOpenGroups(g => g.includes(group.label) ? g.filter(x => x !== group.label) : [...g, group.label])}><ChevronDown size={14} className={openGroups.includes(group.label) ? "" : "rotated"}/><GroupIcon size={14}/><span>{group.label}</span><small>{filtered.length}</small></button>{openGroups.includes(group.label) && <div className="element-grid">{filtered.map(item => { const Icon = item.icon; return <button key={item.label} className="element-tile" draggable onDragStart={e => { e.dataTransfer.setData("text/sytely-type", item.type); setDraggingId(item.type); }} onClick={() => addNode(item.type, item.label)} title={item.description}><span className="element-icon"><Icon size={18}/></span><span>{item.label}</span><Plus size={12} className="tile-add"/></button>; })}</div>}</div>; })}{search && !elementGroups.some(g => g.items.some(i => `${i.label} ${g.label} ${i.description}`.toLowerCase().includes(search.toLowerCase()))) && <p className="empty-message">No elements match “{search}”. Try another term.</p>}</div><div className="panel-footnote"><Sparkles size={14}/><span>Tip: select a container, then add an element inside it.</span></div></>;
    if (workspace === "Layers") return <><div className="panel-heading"><div><h2>Layers & pages</h2><p>Page structure and visibility</p></div><button className="icon-button" onClick={() => addNode("section")}><Plus size={16}/></button></div><div className="page-row"><FileText size={15}/><span>{pageName}</span><span className="page-tag">Page</span><ChevronDown size={13}/></div><div className="layer-toolbar"><span>ELEMENT TREE</span><button onClick={() => setToast("Layer search is available via Add search")}><Search size={14}/></button></div><div className="layer-list">{nodes.filter(n => n.parentId === null).map(n => <div key={n.id}><div className={`layer-row ${selectedId === n.id ? "active" : ""}`} onClick={() => setSelectedId(n.id)}><span className="tree-indent"/><span className="layer-type">{n.type === "section" ? <Square size={14}/> : <Box size={14}/>}</span><span className="layer-name">{n.name}</span><button title={n.visible ? "Hide layer" : "Show layer"} onClick={e => { e.stopPropagation(); toggleVisibility(n.id); }}><Eye size={13}/></button><button title={n.locked ? "Unlock layer" : "Lock layer"} onClick={e => { e.stopPropagation(); toggleLock(n.id); }}><Lock size={12}/></button></div>{childrenOf(n.id).map(child => <div key={child.id} className={`layer-row child-row ${selectedId === child.id ? "active" : ""} `} onClick={() => setSelectedId(child.id)}><span className="tree-indent child-indent"/><span className="layer-type">{child.type === "heading" ? <Heading size={13}/> : child.type === "button" ? <MousePointer2 size={13}/> : <Type size={13}/>}</span><span className="layer-name">{child.name}</span><button title={child.visible ? "Hide layer" : "Show layer"} onClick={e => { e.stopPropagation(); toggleVisibility(child.id); }}><Eye size={13}/></button><button title={child.locked ? "Unlock layer" : "Lock layer"} onClick={e => { e.stopPropagation(); toggleLock(child.id); }}><Lock size={12}/></button></div>)}</div>)}</div></>;
    const content: Record<Exclude<Workspace, "Add" | "Layers">, { icon: typeof Plus; title: string; description: string; cards: string[] }> = {
      Templates: { icon: LayoutTemplate, title: "Start with a template", description: "A strong starting point for your next idea.", cards: ["Portfolio starter", "SaaS landing page", "Studio homepage", "Product launch"] },
      Databases: { icon: Database, title: "Your data sources", description: "Connect structured data to your designs.", cards: ["Sample products", "Team members", "Blog posts", "Add a data source"] },
      Components: { icon: Shapes, title: "Reusable components", description: "Keep your design consistent across pages.", cards: ["Buttons", "Navigation", "Feature cards", "Create component"] },
      Collaboration: { icon: MessageSquare, title: "Work together", description: "Share feedback and keep the team aligned.", cards: ["Invite a collaborator", "Review comments", "Activity history", "Share review link"] },
      "Add-ons": { icon: Grid2X2, title: "Extend your workspace", description: "Connect tools and customize your workflow.", cards: ["Integrations", "Design themes", "Installed add-ons", "Manage permissions"] },
    };
    const data = content[workspace]; const Icon = data.icon;
    return <><div className="panel-heading"><div><h2>{workspace}</h2><p>{data.description}</p></div></div><div className="workspace-scroll"><div className="feature-panel-hero"><span className="large-feature-icon"><Icon size={23}/></span><h3>{data.title}</h3><p>{data.description}</p></div>{data.cards.map((card, i) => <button className="resource-row" key={card} onClick={() => { if (workspace === "Templates") { addNode("section", card); } else setToast(`${card} workspace selected`); }}><span className="resource-icon">{i === 0 ? <FolderOpen size={16}/> : i === 1 ? <Database size={16}/> : <Box size={16}/>}</span><span>{card}<small>{workspace === "Templates" ? "Starter layout" : workspace === "Databases" ? "Sample collection" : "Workspace resource"}</small></span><ChevronRight size={14}/></button>)}</div></>;
  };

  const renderInspector = () => {
    if (inspector === "Backend") return <div className="backend-content"><div className="backend-header"><div><span className="eyebrow-label">DEVELOPMENT WORKSPACE</span><h2>Backend logic</h2></div><div className="backend-size-actions"><button title="Inspector width" className={backendSize === "inspector" ? "active" : ""} onClick={() => setBackendSize("inspector")}><PanelRightClose size={14}/></button><button title="Expanded workspace" className={backendSize === "expanded" ? "active" : ""} onClick={() => setBackendSize("expanded")}><Columns2 size={14}/></button><button title="Focus mode" className={backendSize === "focus" ? "active" : ""} onClick={() => setBackendSize("focus")}><MaximizeIcon/></button></div></div><div className="backend-tabs">{(["Blocks", "Code", "Data", "Events", "Console"] as BackendTab[]).map(t => <button key={t} className={backendTab === t ? "active" : ""} onClick={() => setBackendTab(t)}>{t}</button>)}</div>{backendTab === "Blocks" ? <><div className="event-card"><div className="event-card-top"><span className="event-dot"><MousePointer2 size={13}/></span><span>EVENT TRIGGER</span><MoreHorizontal size={15}/></div><strong>When {selected?.type === "button" ? "button" : selected?.name.toLowerCase()} is clicked</strong><small>Element: {selected?.name ?? "None selected"}</small></div><div className="block-connector"/><div className="logic-block purple-block"><div className="block-top"><Zap size={13}/><span>VARIABLES</span></div><strong>Set variable</strong><div className="block-field"><span>name</span><code>message</code></div><div className="block-field"><span>value</span><code>"Welcome to Sytely"</code></div></div><div className="block-connector"/><div className="logic-block blue-block"><div className="block-top"><Type size={13}/><span>ELEMENT ACTION</span></div><strong>Set text content</strong><div className="block-field"><span>target</span><code>resultLabel</code></div><div className="block-field"><span>value</span><code>message</code></div></div><button className="add-block-button" onClick={() => setToast("Choose a block from the block library")}><Plus size={14}/> Add action block</button><div className="generated-preview"><div className="section-title">GENERATED LOGIC PREVIEW <span className="read-only-tag">READ ONLY</span></div><pre>{`async function onClick(event) {\n  const message = "Welcome to Sytely";\n  resultLabel.textContent = message;\n}`}</pre></div></> : backendTab === "Code" ? <><div className="code-toolbar"><span><Code2 size={13}/> Custom JavaScript</span><span className="read-only-tag">DRAFT</span></div><textarea className="code-editor" spellCheck={false} value={code} onChange={e => setCode(e.target.value)} aria-label="Custom JavaScript code"/><div className="code-actions"><button className="subtle-button" onClick={() => setCode("onClick(button)\n  setVariable(\"message\", \"Welcome to Sytely\")\n  setText(resultLabel, message)")}><Undo2 size={13}/> Reset</button><button className="primary-small" onClick={() => setToast("Code draft saved locally")}>Save code</button></div><p className="muted-note">Custom code is stored separately from generated visual logic.</p></> : backendTab === "Data" ? <><div className="section-title">DATA SOURCES</div>{["Products · 8 fields", "Team members · 5 fields", "Blog posts · 6 fields"].map((t, i) => <button className="resource-row" key={t} onClick={() => setToast("Sample data source selected")}><Database size={15}/><span>{t}<small>{i === 0 ? "Sample collection" : "Not connected"}</small></span><ChevronRight size={14}/></button>)}<button className="add-block-button" onClick={() => setToast("Connect a data provider to continue")}><Plus size={14}/> Add data source</button></> : backendTab === "Events" ? <><div className="section-title">EVENT HANDLERS</div><div className="event-card"><div className="event-card-top"><CircleDot size={13}/><span>CLICK EVENT</span></div><strong>When {selected?.name ?? "element"} is clicked</strong><small>2 actions · Enabled</small></div><button className="add-block-button" onClick={() => setToast("Event handler draft created")}><Plus size={14}/> Add event handler</button></> : <><div className="diagnostic-summary"><Check size={16}/><div><strong>Editor validation passed</strong><small>0 errors · 1 informational message</small></div></div><div className="console-entry"><span>07:41:02</span><code>Editor ready. No runtime execution yet.</code></div><div className="console-entry"><span>07:41:02</span><code>Visual blocks are in draft mode.</code></div><button className="subtle-button" onClick={() => setConsoleOpen(!consoleOpen)}>{consoleOpen ? "Hide details" : "Show validation details"}</button>{consoleOpen && <p className="muted-note">No event code has been executed. Publishing and live backend execution are not configured.</p>}</>}</div>;
    const common = <div className="inspector-section"><div className="section-title">SELECTED ELEMENT <span className="type-chip">{selected?.type ?? "page"}</span></div><div className="selected-object"><span className="selected-object-icon">{selected?.type === "button" ? <MousePointer2 size={16}/> : selected?.type === "heading" ? <Heading size={16}/> : selected?.type === "image" ? <Image size={16}/> : <Box size={16}/>}</span><div><strong>{selected?.name ?? "Page"}</strong><small>{selected?.id ?? "root"}</small></div><button title="Duplicate element" onClick={duplicateNode}><Copy size={14}/></button><button title="Delete element" onClick={() => selected && removeNode(selected.id)}><Trash2 size={14}/></button></div></div>;
    if (inspector === "Properties") return <><div className="panel-heading inspector-title"><div><h2>Properties</h2><p>Configure the selected element.</p></div><button className="icon-button" onClick={() => setRightCollapsed(true)}><X size={15}/></button></div>{common}<div className="inspector-section"><div className="section-title">CONTENT</div><label className="field-label">Element name<input value={selected?.name ?? ""} onChange={e => updateSelected({ name: e.target.value })}/></label>{selected?.type !== "section" && selected?.type !== "container" && <label className="field-label">Text content<textarea rows={3} value={selected?.text ?? ""} onChange={e => updateSelected({ text: e.target.value })}/></label>}{selected?.type === "button" && <><label className="field-label">Link URL<input type="url" placeholder="https://example.com" value={selected?.href ?? ""} onChange={e => updateSelected({ href: e.target.value })}/></label><label className="check-row"><input type="checkbox" checked={selected?.openInNewTab ?? false} onChange={e => updateSelected({ openInNewTab: e.target.checked })}/> Open in new tab</label></>}</div><div className="inspector-section"><div className="section-title">LAYOUT</div><div className="two-fields"><label className="field-label">Width<select value={selected?.styles.width ?? "Auto"} onChange={e => updateSelected({ styles: { width: e.target.value } })}><option>Auto</option><option>100%</option><option>Fit content</option><option>320px</option></select></label><label className="field-label">Alignment<select value={selected?.styles.align ?? "center"} onChange={e => updateSelected({ styles: { align: e.target.value } })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label></div><label className="field-label">Padding <span className="inline-value">{selected?.styles.padding ?? 0}px</span><input type="range" min="0" max="80" step="4" value={selected?.styles.padding ?? 0} onChange={e => updateSelected({ styles: { padding: Number(e.target.value) } })}/></label></div><div className="inspector-section"><div className="section-title">APPEARANCE</div><label className="field-label">Text color<div className="color-field"><input type="color" value={selected?.styles.color ?? "#202033"} onChange={e => updateSelected({ styles: { color: e.target.value } })}/><code>{selected?.styles.color ?? "Default"}</code><button onClick={() => updateSelected({ styles: { color: undefined } })}>Reset</button></div></label><label className="field-label">Background<div className="color-field"><input type="color" value={selected?.styles.background ?? "#ffffff"} onChange={e => updateSelected({ styles: { background: e.target.value } })}/><code>{selected?.styles.background ?? "Transparent"}</code><button onClick={() => updateSelected({ styles: { background: undefined } })}>Reset</button></div></label><label className="field-label">Corner radius <span className="inline-value">{selected?.styles.radius ?? 0}px</span><input type="range" min="0" max="28" step="2" value={selected?.styles.radius ?? 0} onChange={e => updateSelected({ styles: { radius: Number(e.target.value) } })}/></label></div><div className="inspector-bottom-note"><Check size={14}/> Changes update the canvas immediately</div></>;
    if (inspector === "Layout") return <><div className="panel-heading"><div><h2>Layout</h2><p>Size, spacing and alignment</p></div></div>{common}<div className="inspector-section"><div className="section-title">DIMENSIONS</div><div className="two-fields"><label className="field-label">Width<select value={selected?.styles.width ?? "Auto"} onChange={e => updateSelected({ styles: { width: e.target.value } })}><option>Auto</option><option>100%</option><option>Fit content</option><option>320px</option></select></label><label className="field-label">Height<select defaultValue="Auto"><option>Auto</option><option>100%</option><option>320px</option></select></label></div><label className="field-label">Padding<input type="range" min="0" max="80" step="4" value={selected?.styles.padding ?? 0} onChange={e => updateSelected({ styles: { padding: Number(e.target.value) } })}/></label><div className="align-controls"><button onClick={() => updateSelected({ styles: { align: "left" } })}><AlignLeft size={16}/></button><button onClick={() => updateSelected({ styles: { align: "center" } })}><AlignCenter size={16}/></button><button onClick={() => updateSelected({ styles: { align: "right" } })}><AlignJustify size={16}/></button></div></div></>;
    if (inspector === "Style") return <><div className="panel-heading"><div><h2>Style</h2><p>Typography, colors and effects</p></div></div>{common}<div className="inspector-section"><div className="section-title">TYPOGRAPHY</div><label className="field-label">Font size <span className="inline-value">{selected?.styles.fontSize ?? 16}px</span><input type="range" min="10" max="64" value={selected?.styles.fontSize ?? 16} onChange={e => updateSelected({ styles: { fontSize: Number(e.target.value) } })}/></label><div className="align-controls"><button onClick={() => updateSelected({ styles: { align: "left" } })}><AlignLeft size={16}/></button><button onClick={() => updateSelected({ styles: { align: "center" } })}><AlignCenter size={16}/></button><button onClick={() => updateSelected({ styles: { align: "right" } })}><AlignJustify size={16}/></button></div><label className="field-label">Text color<div className="color-field"><input type="color" value={selected?.styles.color ?? "#202033"} onChange={e => updateSelected({ styles: { color: e.target.value } })}/><code>{selected?.styles.color ?? "Default"}</code></div></label><label className="field-label">Background<div className="color-field"><input type="color" value={selected?.styles.background ?? "#ffffff"} onChange={e => updateSelected({ styles: { background: e.target.value } })}/><code>{selected?.styles.background ?? "Transparent"}</code></div></label></div></>;
    if (inspector === "Responsive") return <><div className="panel-heading"><div><h2>Responsive</h2><p>Preview and adapt your layout</p></div></div>{common}<div className="inspector-section"><div className="section-title">BREAKPOINT OVERRIDES</div>{["Desktop · 1280px+", "Tablet · 768px", "Mobile · 375px"].map((t, i) => <button className="resource-row" key={t} onClick={() => { setViewport(i === 0 ? "desktop" : i === 1 ? "tablet" : "mobile"); setToast(`${t.split(" · ")[0]} preview selected`); }}><span className="resource-icon">{i === 0 ? <Monitor size={15}/> : i === 1 ? <Tablet size={15}/> : <Smartphone size={15}/>}</span><span>{t}<small>{i === 0 ? "Base styles" : "Inherits desktop styles"}</small></span><ChevronRight size={14}/></button>)}</div><p className="muted-note">Breakpoint-specific overrides are a foundation feature; independent responsive style persistence is not yet implemented.</p></>;
    if (inspector === "Interactions") return <><div className="panel-heading"><div><h2>Interactions</h2><p>Define behaviour and events</p></div></div>{common}<div className="inspector-section"><div className="section-title">EVENT HANDLERS</div><div className="event-card"><div className="event-card-top"><Zap size={13}/><span>CLICK EVENT</span></div><strong>When {selected?.name ?? "element"} is clicked</strong><small>1 handler · Draft</small></div><button className="add-block-button" onClick={() => { setInspector("Backend"); setBackendTab("Blocks"); setBackendSize("expanded"); }}><Plus size={14}/> Edit event logic</button></div></>;
    if (inspector === "Accessibility") return <><div className="panel-heading"><div><h2>Accessibility</h2><p>Make your page work for everyone.</p></div></div>{common}<div className="inspector-section"><div className="section-title">SEMANTICS</div><label className="field-label">Semantic element<select defaultValue={selected?.type === "heading" ? "Heading 1" : selected?.type === "button" ? "Button" : "Default"}><option>Default</option><option>Heading 1</option><option>Heading 2</option><option>Button</option><option>Navigation</option><option>Landmark</option></select></label><label className="field-label">Accessible label<input placeholder="Describe this element"/></label>{selected?.type === "image" && <><label className="field-label">Image URL<input type="url" placeholder="https://example.com/image.jpg" value={selected.src ?? ""} onChange={e => updateSelected({ src: e.target.value })}/></label><label className="field-label">Alternative text<input value={selected.text} onChange={e => updateSelected({ text: e.target.value })} placeholder="Describe the image"/></label></>}<div className="diagnostic-summary"><Check size={15}/><div><strong>Keyboard focus available</strong><small>Review labels before publishing</small></div></div></div></>;
    return <><div className="panel-heading"><div><h2>Advanced</h2><p>Identifiers and diagnostics</p></div></div>{common}<div className="inspector-section"><div className="section-title">ELEMENT ATTRIBUTES</div><label className="field-label">Element ID<input value={selected?.id ?? ""} readOnly/></label><label className="field-label">Component type<input value={selected?.type ?? ""} readOnly/></label><label className="field-label">Parent element<input value={nodes.find(n => n.id === selected?.parentId)?.name ?? "Page root"} readOnly/></label><button className="subtle-button" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(selected, null, 2)); setToast("Element JSON copied"); }}><Copy size={13}/> Copy element JSON</button></div></>;
  };

  const canvasWidth = viewport === "desktop" ? "100%" : viewport === "tablet" ? "768px" : "390px";
  return <div className={`app-shell ${preview ? "preview-mode" : ""} ${backendSize !== "inspector" && inspector === "Backend" ? `backend-${backendSize}` : ""}`}>
    <header className="topbar"><div className="brand-lockup"><div className="brand-mark"><Shapes size={19}/></div><span className="brand-name">sytely</span><span className="brand-divider"/><button className="project-switcher" onClick={() => setToast("Project switcher coming soon")}>My Website <ChevronDown size={13}/></button></div><div className="topbar-centre"><span className={`save-indicator ${saveState}`}><span/>{savedLabel}</span></div><div className="topbar-actions"><button className="icon-button desktop-only" title="Undo (Ctrl/Cmd+Z)" onClick={undo} disabled={!history.length}><Undo2 size={16}/></button><button className="icon-button desktop-only" title="Redo (Ctrl/Cmd+Shift+Z)" onClick={redo} disabled={!future.length}><Redo2 size={16}/></button><span className="topbar-divider desktop-only"/><button className={`preview-button ${preview ? "is-active" : ""}`} onClick={() => { setPreview(!preview); setMobilePanel(null); }}><Eye size={15}/><span>{preview ? "Edit" : "Preview"}</span></button><button className="publish-button" onClick={() => window.dispatchEvent(new Event("sytely:publish"))}><Upload size={14}/><span>Publish</span></button><CloudAccount nodes={nodes} pageName={pageName} onToast={setToast} /><button className="avatar-button" title="Account menu">S</button></div></header>
    <main className={`editor-layout ${preview ? "preview-layout" : ""}`}>
      {!preview && <>{rail("left", leftCollapsed, setLeftCollapsed)}{!leftCollapsed && <><aside className={`workspace-panel ${mobilePanel === "left" ? "mobile-open" : ""}`} style={{ "--panel-width": `${leftWidth}px` } as React.CSSProperties}>{renderWorkspace()}</aside><div className="resize-handle left-resize" role="separator" aria-label="Resize left panel" aria-orientation="vertical" tabIndex={0} onMouseDown={e => changeWorkspaceSize("left", e)} onDoubleClick={() => resetWidth("left")} onKeyDown={e => { if (e.key === "ArrowLeft") setLeftWidth(w => Math.max(200, w - 12)); if (e.key === "ArrowRight") setLeftWidth(w => Math.min(480, w + 12)); }}/></>}</>}
      <section className={`canvas-workspace ${preview ? "canvas-preview" : ""}`}><div className="canvas-toolbar"><div className="canvas-page-control"><button className="page-dropdown" onClick={() => setToast("Home page selected")}><FileText size={14}/><span>{pageName}</span><ChevronDown size={12}/></button><span className="toolbar-slash">/</span><span className="toolbar-muted">Website</span></div><div className="canvas-tools"><div className="viewport-switcher"><button title="Desktop viewport" aria-label="Desktop viewport" className={viewport === "desktop" ? "active" : ""} onClick={() => setViewport("desktop")}><Monitor size={15}/></button><button title="Tablet viewport" aria-label="Tablet viewport" className={viewport === "tablet" ? "active" : ""} onClick={() => setViewport("tablet")}><Tablet size={15}/></button><button title="Mobile viewport" aria-label="Mobile viewport" className={viewport === "mobile" ? "active" : ""} onClick={() => setViewport("mobile")}><Smartphone size={15}/></button></div><span className="toolbar-divider"/><button className="zoom-control" onClick={() => setZoom(z => Math.max(50, z - 10))} title="Zoom out">−</button><button className="zoom-value" onClick={() => setZoom(100)}>{zoom}%</button><button className="zoom-control" onClick={() => setZoom(z => Math.min(150, z + 10))} title="Zoom in">+</button><span className="toolbar-divider"/><button className={`icon-button canvas-tool-button ${showGuides ? "tool-active" : ""}`} title="Toggle layout guides" onClick={() => setShowGuides(!showGuides)}><Grid2X2 size={15}/></button><button className="icon-button canvas-tool-button" title="Fit canvas to screen" onClick={() => { setZoom(100); setViewport("desktop"); }}><MaximizeIcon/></button></div></div>
        <div className="canvas-scroll" ref={canvasRef} onClick={() => { if (!preview) setSelectedId(""); }}><div className="canvas-stage" style={{ width: canvasWidth, transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}><div className={`website-page ${viewport}`} onClick={e => { if (e.target === e.currentTarget && !preview) setSelectedId(""); }}><div className="site-navbar"><div className="site-logo"><span className="site-logo-mark"><Shapes size={14}/></span> STUDIO</div><nav><button onClick={() => setPageName("Home")}>Home</button><button onClick={() => setToast("About page is not created yet")}>About</button><button onClick={() => setToast("Contact page is not created yet")}>Contact</button></nav><button className="site-nav-cta" onClick={() => setToast("Navigation action preview")}>Let's talk <ArrowRight size={13}/></button></div><div className="site-content" onDragOver={e => e.preventDefault()} onDrop={e => onDrop(e, null)}>{nodes.filter(n => n.parentId === null).map(renderElement)}{!nodes.length && <div className="canvas-empty"><Sparkles size={25}/><h2>Your canvas is ready</h2><p>Add an element to start building your page.</p><button className="primary-small" onClick={() => { setWorkspace("Add"); addNode("section"); }}>Add section</button></div>}</div><footer className="site-footer"><span>Made with <b>sytely</b></span><span>Designed with intention.</span></footer></div></div></div>
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
