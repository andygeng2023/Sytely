"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type PointerEvent as ReactPointerEvent
} from "react";
import { renderNode } from "@sytely/renderer";
import type { ComponentNode, ComponentType, Site, SitePage } from "@sytely/types";
import "./editor.css";

type ThemeMode = "system" | "light" | "dark";
type LeftTab = "components" | "templates" | "pages" | "layers";
type RightTab = "design" | "layout" | "position";
type Device = "desktop" | "tablet" | "mobile";
type DropPosition = "before" | "after" | "inside";

type DragPayload =
  | { kind: "component"; componentType: ComponentType }
  | { kind: "template"; templateId: string }
  | { kind: "node"; nodeIds: string[] };

interface DropTarget {
  id: string | null;
  position: DropPosition;
}

interface ResizeState {
  ids: string[];
  startX: number;
  startY: number;
  widths: Record<string, number>;
  heights: Record<string, number>;
  before: Site;
}

interface Template {
  id: string;
  name: string;
  description: string;
  node: ComponentNode;
}

const DEFAULT_SECTION_PADDING = 56;
const STORAGE_SITES = "sytely-sites";
const STORAGE_ACTIVE = "sytely-active-site";
const STORAGE_LEGACY = "sytely-site";

function newId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `node-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function node(
  id: string,
  type: ComponentType,
  props: Record<string, unknown> = {},
  styles: Record<string, unknown> = {},
  children?: ComponentNode[]
): ComponentNode {
  return {
    id,
    type,
    props,
    styles,
    ...(children ? { children } : {})
  };
}

function section(
  id: string,
  children: ComponentNode[],
  styles: Record<string, unknown> = {}
) {
  return node(
    id,
    "section",
    {},
    {
      paddingTop: DEFAULT_SECTION_PADDING,
      paddingRight: 40,
      paddingBottom: DEFAULT_SECTION_PADDING,
      paddingLeft: 40,
      gap: 24,
      ...styles
    },
    children
  );
}

const templates: Template[] = [
  {
    id: "hero",
    name: "Hero",
    description: "Centered hero with CTA",
    node: section(
      "tpl-hero",
      [
        node(
          "tpl-hero-title",
          "heading",
          { text: "Build something people remember" },
          {
            fontSize: 52,
            fontWeight: 700,
            textAlign: "center",
            width: "100%"
          }
        ),
        node(
          "tpl-hero-copy",
          "text",
          {
            text: "Create a polished website visually without writing code."
          },
          {
            fontSize: 18,
            textAlign: "center",
            maxWidth: 680,
            width: "100%",
            alignSelf: "center"
          }
        ),
        node(
          "tpl-hero-button",
          "button",
          { text: "Get started" },
          {
            background: "var(--sytely-accent)",
            color: "var(--sytely-accent-text)",
            alignSelf: "center"
          }
        )
      ],
      {
        alignItems: "center",
        background: "var(--sytely-surface)"
      }
    )
  },
  {
    id: "split",
    name: "Split",
    description: "Two-column story section",
    node: section(
      "tpl-split",
      [
        section(
          "tpl-split-copy",
          [
            node(
              "tpl-split-title",
              "heading",
              { text: "A clear message" },
              { fontSize: 38, fontWeight: 700 }
            ),
            node(
              "tpl-split-text",
              "text",
              {
                text: "Pair a strong message with supporting content, imagery, or a call to action."
              }
            ),
            node(
              "tpl-split-button",
              "button",
              { text: "Learn more" },
              {
                background: "var(--sytely-accent)",
                color: "var(--sytely-accent-text)"
              }
            )
          ],
          {
            padding: 0,
            gap: 16
          }
        ),
        node(
          "tpl-split-image",
          "image",
          { src: "", alt: "Placeholder image" },
          {
            width: "100%",
            height: 320
          }
        )
      ],
      {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
        alignItems: "center",
        gap: 48,
        background: "var(--sytely-surface)"
      }
    )
  },
  {
    id: "features",
    name: "Features",
    description: "Three flexible feature cards",
    node: section(
      "tpl-features",
      [
        node(
          "tpl-features-title",
          "heading",
          { text: "Everything in one place" },
          {
            fontSize: 38,
            fontWeight: 700,
            textAlign: "center"
          }
        ),
        node(
          "tpl-features-copy",
          "text",
          {
            text: "Build pages from reusable sections and normal components."
          },
          {
            textAlign: "center"
          }
        ),
        section(
          "tpl-feature-grid",
          [
            section(
              "tpl-feature-1",
              [
                node(
                  "tpl-feature-1-title",
                  "heading",
                  { text: "Visual editing" },
                  {
                    fontSize: 22,
                    fontWeight: 700
                  }
                ),
                node(
                  "tpl-feature-1-copy",
                  "text",
                  {
                    text: "Move, align, resize and organize directly on the canvas."
                  }
                )
              ],
              {
                padding: 28,
                background: "var(--sytely-card)",
                gap: 12
              }
            ),
            section(
              "tpl-feature-2",
              [
                node(
                  "tpl-feature-2-title",
                  "heading",
                  { text: "Responsive layouts" },
                  {
                    fontSize: 22,
                    fontWeight: 700
                  }
                ),
                node(
                  "tpl-feature-2-copy",
                  "text",
                  {
                    text: "Design once and adapt the layout across devices."
                  }
                )
              ],
              {
                padding: 28,
                background: "var(--sytely-card)",
                gap: 12
              }
            ),
            section(
              "tpl-feature-3",
              [
                node(
                  "tpl-feature-3-title",
                  "heading",
                  { text: "Reusable sections" },
                  {
                    fontSize: 22,
                    fontWeight: 700
                  }
                ),
                node(
                  "tpl-feature-3-copy",
                  "text",
                  {
                    text: "Start from templates and customize every detail."
                  }
                )
              ],
              {
                padding: 28,
                background: "var(--sytely-card)",
                gap: 12
              }
            )
          ],
          {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            padding: 0,
            gap: 20
          }
        )
      ],
      {
        background: "var(--sytely-surface)",
        gap: 18
      }
    )
  },
  {
    id: "stats",
    name: "Stats",
    description: "Compact metric cards",
    node: section(
      "tpl-stats",
      [
        section(
          "tpl-stat-grid",
          [
            section(
              "tpl-stat-1",
              [
                node(
                  "tpl-stat-1-title",
                  "heading",
                  { text: "10k+" },
                  {
                    fontSize: 34,
                    fontWeight: 700
                  }
                ),
                node(
                  "tpl-stat-1-copy",
                  "text",
                  { text: "Projects" }
                )
              ],
              {
                padding: 24,
                background: "var(--sytely-card)",
                alignItems: "center",
                gap: 8
              }
            ),
            section(
              "tpl-stat-2",
              [
                node(
                  "tpl-stat-2-title",
                  "heading",
                  { text: "99%" },
                  {
                    fontSize: 34,
                    fontWeight: 700
                  }
                ),
                node(
                  "tpl-stat-2-copy",
                  "text",
                  { text: "Satisfaction" }
                )
              ],
              {
                padding: 24,
                background: "var(--sytely-card)",
                alignItems: "center",
                gap: 8
              }
            ),
            section(
              "tpl-stat-3",
              [
                node(
                  "tpl-stat-3-title",
                  "heading",
                  { text: "24/7" },
                  {
                    fontSize: 34,
                    fontWeight: 700
                  }
                ),
                node(
                  "tpl-stat-3-copy",
                  "text",
                  { text: "Availability" }
                )
              ],
              {
                padding: 24,
                background: "var(--sytely-card)",
                alignItems: "center",
                gap: 8
              }
            )
          ],
          {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            padding: 0,
            gap: 20
          }
        )
      ],
      {
        background: "var(--sytely-surface)"
      }
    )
  },
  {
    id: "cta",
    name: "CTA",
    description: "Focused call to action",
    node: section(
      "tpl-cta",
      [
        node(
          "tpl-cta-title",
          "heading",
          { text: "Ready to build your next page?" },
          {
            fontSize: 38,
            fontWeight: 700,
            textAlign: "center"
          }
        ),
        node(
          "tpl-cta-copy",
          "text",
          {
            text: "Start with a section and customize every part."
          },
          {
            textAlign: "center"
          }
        ),
        node(
          "tpl-cta-button",
          "button",
          { text: "Start building" },
          {
            background: "var(--sytely-accent)",
            color: "var(--sytely-accent-text)",
            alignSelf: "center"
          }
        )
      ],
      {
        alignItems: "center",
        gap: 18,
        background: "var(--sytely-muted)"
      }
    )
  }
];

const initialSite: Site = {
  id: "site-1",
  name: "Sytely Site",
  version: 1,
  theme: "system",
  pages: [
    {
      id: "page-home",
      name: "Home",
      slug: "/",
      margins: {
        top: 0,
        right: 32,
        bottom: 0,
        left: 32
      },
      styles: {
        background: "var(--sytely-page)",
        theme: "system"
      },
      components: [templates[0].node, templates[2].node]
    },
    {
      id: "page-about",
      name: "About",
      slug: "/about",
      margins: {
        top: 0,
        right: 32,
        bottom: 0,
        left: 32
      },
      styles: {
        background: "var(--sytely-page)",
        theme: "system"
      },
      components: []
    }
  ]
};

function cloneWithNewIds(input: ComponentNode): ComponentNode {
  return {
    ...input,
    id: newId(),
    props: { ...input.props },
    styles: { ...(input.styles ?? {}) },
    children: input.children?.map(cloneWithNewIds)
  };
}

function makeComponent(type: ComponentType): ComponentNode {
  const id = newId();

  if (type === "section") {
    return section(id, []);
  }

  if (type === "heading") {
    return node(
      id,
      "heading",
      { text: "Heading" },
      {
        fontSize: 32,
        fontWeight: 700
      }
    );
  }

  if (type === "text") {
    return node(id, "text", {
      text: "Add your text here."
    });
  }

  if (type === "image") {
    return node(
      id,
      "image",
      {
        src: "",
        alt: "Image"
      },
      {
        width: 360,
        height: 240
      }
    );
  }

  return node(
    id,
    "button",
    {
      text: "Button"
    },
    {
      background: "var(--sytely-accent)",
      color: "var(--sytely-accent-text)"
    }
  );
}

function collectNodes(
  nodes: ComponentNode[],
  result: ComponentNode[] = []
) {
  for (const item of nodes) {
    result.push(item);
    collectNodes(item.children ?? [], result);
  }

  return result;
}

function findNode(
  nodes: ComponentNode[],
  id: string
): ComponentNode | null {
  for (const item of nodes) {
    if (item.id === id) {
      return item;
    }

    const found = findNode(item.children ?? [], id);

    if (found) {
      return found;
    }
  }

  return null;
}

function findParentId(
  nodes: ComponentNode[],
  childId: string,
  parentId: string | null = null
): string | null {
  for (const item of nodes) {
    if (item.id === childId) {
      return parentId;
    }

    const found = findParentId(
      item.children ?? [],
      childId,
      item.id
    );

    if (found !== null) {
      return found;
    }
  }

  return null;
}

function containsNode(
  item: ComponentNode,
  id: string
): boolean {
  return (
    item.id === id ||
    (item.children ?? []).some((child) =>
      containsNode(child, id)
    )
  );
}

function removeNode(
  nodes: ComponentNode[],
  id: string
): {
  nodes: ComponentNode[];
  removed: ComponentNode | null;
} {
  let removed: ComponentNode | null = null;
  const result: ComponentNode[] = [];

  for (const item of nodes) {
    if (item.id === id) {
      removed = item;
      continue;
    }

    const child = removeNode(
      item.children ?? [],
      id
    );

    if (child.removed) {
      removed = child.removed;
    }

    result.push({
      ...item,
      children:
        item.children !== undefined
          ? child.nodes
          : undefined
    });
  }

  return {
    nodes: result,
    removed
  };
}

function removeNodes(
  nodes: ComponentNode[],
  ids: Set<string>
): {
  nodes: ComponentNode[];
  removed: ComponentNode[];
} {
  const removed: ComponentNode[] = [];
  const result: ComponentNode[] = [];

  for (const item of nodes) {
    if (ids.has(item.id)) {
      removed.push(item);
      continue;
    }

    const child = removeNodes(
      item.children ?? [],
      ids
    );

    removed.push(...child.removed);

    result.push({
      ...item,
      children:
        item.children !== undefined
          ? child.nodes
          : undefined
    });
  }

  return {
    nodes: result,
    removed
  };
}

function insertNode(
  nodes: ComponentNode[],
  targetId: string,
  items: ComponentNode[],
  position: DropPosition
): ComponentNode[] {
  const result: ComponentNode[] = [];

  for (const item of nodes) {
    if (item.id === targetId) {
      if (position === "before") {
        result.push(...items, item);
      } else if (position === "after") {
        result.push(item, ...items);
      } else {
        result.push({
          ...item,
          children: [
            ...(item.children ?? []),
            ...items
          ]
        });
      }

      continue;
    }

    result.push({
      ...item,
      children:
        item.children !== undefined
          ? insertNode(
              item.children,
              targetId,
              items,
              position
            )
          : undefined
    });
  }

  return result;
}

function replaceNodeWithChildren(
  nodes: ComponentNode[],
  id: string
): ComponentNode[] {
  const result: ComponentNode[] = [];

  for (const item of nodes) {
    if (item.id === id) {
      result.push(...(item.children ?? []));
      continue;
    }

    result.push({
      ...item,
      children:
        item.children !== undefined
          ? replaceNodeWithChildren(
              item.children,
              id
            )
          : undefined
    });
  }

  return result;
}

function updateNode(
  nodes: ComponentNode[],
  id: string,
  updater: (item: ComponentNode) => ComponentNode
): ComponentNode[] {
  return nodes.map((item) =>
    item.id === id
      ? updater(item)
      : {
          ...item,
          children:
            item.children !== undefined
              ? updateNode(
                  item.children,
                  id,
                  updater
                )
              : undefined
        }
  );
}

function updateMany(
  nodes: ComponentNode[],
  ids: Set<string>,
  updater: (item: ComponentNode) => ComponentNode
): ComponentNode[] {
  return nodes.map((item) =>
    ids.has(item.id)
      ? updater(item)
      : {
          ...item,
          children:
            item.children !== undefined
              ? updateMany(
                  item.children,
                  ids,
                  updater
                )
              : undefined
        }
  );
}

function parseNumber(
  value: unknown,
  fallback: number
) {
  const parsed = Number.parseFloat(
    String(value ?? "")
  );

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function styleValue(
  item: ComponentNode,
  key: string
) {
  return item.styles?.[key];
}

function defaultPage(
  id: string,
  name: string,
  slug: string
): SitePage {
  return {
    id,
    name,
    slug,
    margins: {
      top: 0,
      right: 32,
      bottom: 0,
      left: 32
    },
    styles: {
      background: "var(--sytely-page)",
      theme: "system"
    },
    components: []
  };
}

function themeVars(
  theme: ThemeMode
): CSSProperties {
  return {
    ["--sytely-theme-mode" as string]: theme
  } as CSSProperties;
}

function EditorNode({
  nodeItem,
  selectedIds,
  dropTarget,
  onSelect,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onResizeStart,
  onDelete
}: {
  nodeItem: ComponentNode;
  selectedIds: string[];
  dropTarget: DropTarget | null;
  onSelect: (
    id: string,
    additive: boolean
  ) => void;
  onDragStart: (
    event: DragEvent,
    id: string
  ) => void;
  onDragOver: (
    event: DragEvent,
    item: ComponentNode
  ) => void;
  onDrop: (
    event: DragEvent,
    item?: ComponentNode
  ) => void;
  onDragEnd: () => void;
  onResizeStart: (
    event: ReactPointerEvent<HTMLDivElement>,
    id: string
  ) => void;
  onDelete: (id: string) => void;
}) {
  const selected = selectedIds.includes(
    nodeItem.id
  );
  const children = nodeItem.children ?? [];

  const dropClass =
    dropTarget?.id === nodeItem.id
      ? `drop-${dropTarget?.position}`
      : "";

  const visual =
    nodeItem.type === "section"
      ? renderNode(nodeItem, {
          children: children.length ? (
            <>
              {children.map((child) => (
                <EditorNode
                  key={child.id}
                  nodeItem={child}
                  selectedIds={selectedIds}
                  dropTarget={dropTarget}
                  onSelect={onSelect}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  onDragEnd={onDragEnd}
                  onResizeStart={onResizeStart}
                  onDelete={onDelete}
                />
              ))}
            </>
          ) : (
            <div className="empty-section">
              Drop components here
            </div>
          )
        })
      : renderNode(nodeItem, {
          renderChildren: false
        });

  return (
    <div
      className={[
        "editor-node",
        nodeItem.type === "section"
          ? "section-node"
          : "",
        selected ? "selected" : "",
        dropClass
      ]
        .filter(Boolean)
        .join(" ")}
      data-editor-node-id={nodeItem.id}
      draggable
      onDragStart={(event) =>
        onDragStart(event, nodeItem.id)
      }
      onDragEnd={onDragEnd}
      onDragOver={(event) =>
        onDragOver(event, nodeItem)
      }
      onDrop={(event) =>
        onDrop(event, nodeItem)
      }
      onPointerDown={(event) => {
        if (event.button !== 0) {
          return;
        }

        event.stopPropagation();

        onSelect(
          nodeItem.id,
          event.shiftKey ||
            event.metaKey ||
            event.ctrlKey
        );
      }}
    >
      <div className="node-visual">
        {visual}
      </div>

      {nodeItem.type === "section" &&
        selected && (
          <div className="padding-overlay">
            <span>padding</span>
          </div>
        )}

      {selected && (
        <>
          <div className="node-label">
            {nodeItem.type}
          </div>

          <div
            className="resize-handle resize-right"
            onPointerDown={(event) =>
              onResizeStart(
                event,
                nodeItem.id
              )
            }
          />

          <div
            className="resize-handle resize-bottom"
            onPointerDown={(event) =>
              onResizeStart(
                event,
                nodeItem.id
              )
            }
          />

          <div
            className="resize-handle resize-corner"
            onPointerDown={(event) =>
              onResizeStart(
                event,
                nodeItem.id
              )
            }
          />

          <button
            type="button"
            className="node-delete"
            onPointerDown={(event) =>
              event.stopPropagation()
            }
            onClick={(event) => {
              event.stopPropagation();
              onDelete(nodeItem.id);
            }}
          >
            ×
          </button>
        </>
      )}
    </div>
  );
}

export default function EditorPage() {
  const [site, setSite] =
    useState<Site>(initialSite);
  const [sites, setSites] = useState<Site[]>([
    initialSite
  ]);

  const [activePageId, setActivePageId] =
    useState("page-home");
  const [selectedIds, setSelectedIds] =
    useState<string[]>([]);
  const [pageSelected, setPageSelected] =
    useState(true);
  const [dropTarget, setDropTarget] =
    useState<DropTarget | null>(null);
  const [dragLabel, setDragLabel] =
    useState<string | null>(null);
  const [dragPoint, setDragPoint] = useState({
    x: 0,
    y: 0
  });
  const [zoom, setZoom] = useState(72);
  const [preview, setPreview] =
    useState(false);
  const [device, setDevice] =
    useState<Device>("desktop");
  const [leftTab, setLeftTab] =
    useState<LeftTab>("components");
  const [rightTab, setRightTab] =
    useState<RightTab>("design");
  const [history, setHistory] =
    useState<Site[]>([]);
  const [future, setFuture] =
    useState<Site[]>([]);
  const [resizeState, setResizeState] =
    useState<ResizeState | null>(null);
  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const [notice, setNotice] =
    useState("Saved locally");

  const canvasRef =
    useRef<HTMLDivElement | null>(null);

  const activePage =
    site.pages.find(
      (page) => page.id === activePageId
    ) ?? site.pages[0];

  const allNodes = useMemo(
    () =>
      collectNodes(
        activePage?.components ?? []
      ),
    [activePage]
  );

  const selectedNodes = useMemo(
    () =>
      allNodes.filter((item) =>
        selectedIds.includes(item.id)
      ),
    [allNodes, selectedIds]
  );

  const selectedNode =
    selectedIds.length === 1
      ? allNodes.find(
          (item) =>
            item.id === selectedIds[0]
        ) ?? null
      : null;

  const theme =
    String(
      activePage?.styles?.theme ??
        "system"
    ) as ThemeMode;

  useEffect(() => {
    try {
      const rawSites =
        window.localStorage.getItem(
          STORAGE_SITES
        );
      const legacy =
        window.localStorage.getItem(
          STORAGE_LEGACY
        );

      let loaded: Site[] = rawSites
        ? JSON.parse(rawSites)
        : [];

      if (!loaded.length && legacy) {
        loaded = [JSON.parse(legacy)];
      }

      if (!loaded.length) {
        loaded = [initialSite];
      }

      const activeId =
        window.localStorage.getItem(
          STORAGE_ACTIVE
        ) ?? loaded[0].id;

      const active =
        loaded.find(
          (item) => item.id === activeId
        ) ?? loaded[0];

      setSites(loaded);
      setSite(active);
      setActivePageId(
        active.pages[0]?.id ??
          "page-home"
      );
    } catch {
      setSites([initialSite]);
      setSite(initialSite);
    }
  }, []);

  useEffect(() => {
    if (!site) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        try {
          const raw =
            window.localStorage.getItem(
              STORAGE_SITES
            );

          const currentSites: Site[] = raw
            ? JSON.parse(raw)
            : [];

          const next =
            currentSites.some(
              (item) =>
                item.id === site.id
            )
              ? currentSites.map((item) =>
                  item.id === site.id
                    ? site
                    : item
                )
              : [
                  ...currentSites,
                  site
                ];

          window.localStorage.setItem(
            STORAGE_SITES,
            JSON.stringify(next)
          );

          window.localStorage.setItem(
            STORAGE_ACTIVE,
            site.id
          );

          window.localStorage.setItem(
            STORAGE_LEGACY,
            JSON.stringify(site)
          );

          setSites(next);
          setNotice("Saved locally");
        } catch {
          setNotice("Could not save");
        }
      }, 250);

    return () =>
      window.clearTimeout(timer);
  }, [site]);

  function commit(
    updater: (current: Site) => Site
  ) {
    setHistory((items) => [
      ...items.slice(-39),
      site
    ]);
    setFuture([]);
    setSite(updater(site));
    setNotice("Unsaved changes");
  }

  function updatePage(
    updater: (page: SitePage) => SitePage
  ) {
    commit((current) => ({
      ...current,
      pages: current.pages.map(
        (page) =>
          page.id === activePageId
            ? updater(page)
            : page
      )
    }));
  }

  function updatePageImmediate(
    updater: (page: SitePage) => SitePage
  ) {
    setSite((current) => ({
      ...current,
      pages: current.pages.map(
        (page) =>
          page.id === activePageId
            ? updater(page)
            : page
      )
    }));

    setNotice("Unsaved changes");
  }

  function setNodeStyle(
    key: string,
    value: unknown
  ) {
    if (!selectedIds.length) {
      return;
    }

    commit((current) => ({
      ...current,
      pages: current.pages.map(
        (page) =>
          page.id === activePageId
            ? {
                ...page,
                components:
                  updateMany(
                    page.components,
                    new Set(
                      selectedIds
                    ),
                    (item) => ({
                      ...item,
                      styles: {
                        ...(item.styles ??
                          {}),
                        [key]: value
                      }
                    })
                  )
              }
            : page
      )
    }));
  }

  function setNodeProp(
    key: string,
    value: unknown
  ) {
    if (!selectedNode) {
      return;
    }

    updatePage((page) => ({
      ...page,
      components: updateNode(
        page.components,
        selectedNode.id,
        (item) => ({
          ...item,
          props: {
            ...item.props,
            [key]: value
          }
        })
      )
    }));
  }

  function updatePageStyle(
    key: string,
    value: unknown
  ) {
    updatePage((page) => ({
      ...page,
      styles: {
        ...(page.styles ?? {}),
        [key]: value
      }
    }));
  }

  function updatePageMargin(
    key:
      | "top"
      | "right"
      | "bottom"
      | "left",
    value: number
  ) {
    updatePage((page) => ({
      ...page,
      margins: {
        ...page.margins,
        [key]: Math.max(0, value)
      }
    }));
  }

  function select(
    id: string,
    additive: boolean
  ) {
    setPageSelected(false);

    setSelectedIds((current) =>
      additive
        ? current.includes(id)
          ? current.filter(
              (item) => item !== id
            )
          : [...current, id]
        : [id]
    );
  }

  function selectPage() {
    setSelectedIds([]);
    setPageSelected(true);
  }

  function deleteNode(id: string) {
    commit((current) => ({
      ...current,
      pages: current.pages.map(
        (page) =>
          page.id === activePageId
            ? {
                ...page,
                components:
                  removeNode(
                    page.components,
                    id
                  ).nodes
              }
            : page
      )
    }));

    setSelectedIds((current) =>
      current.filter(
        (item) => item !== id
      )
    );
  }

  function parseDrag(
    event: DragEvent
  ): DragPayload | null {
    const raw =
      event.dataTransfer.getData(
        "application/x-sytely"
      );

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(
        raw
      ) as DragPayload;
    } catch {
      return null;
    }
  }

  function paletteDrag(
    event: DragEvent,
    payload: DragPayload,
    label: string
  ) {
    event.dataTransfer.effectAllowed =
      "copy";

    event.dataTransfer.setData(
      "application/x-sytely",
      JSON.stringify(payload)
    );

    setDragLabel(label);
  }

  function nodeDrag(
    event: DragEvent,
    id: string
  ) {
    const ids = selectedIds.includes(
      id
    )
      ? selectedIds
      : [id];

    event.dataTransfer.effectAllowed =
      "move";

    event.dataTransfer.setData(
      "application/x-sytely",
      JSON.stringify({
        kind: "node",
        nodeIds: ids
      } satisfies DragPayload)
    );

    setDragLabel(
      ids.length > 1
        ? `${ids.length} items`
        : "Move item"
    );
  }

  function dropPosition(
    event: DragEvent,
    target: ComponentNode
  ): DropPosition {
    const rect =
      event.currentTarget.getBoundingClientRect();

    const y = rect.height
      ? (event.clientY -
          rect.top) /
        rect.height
      : 0.5;

    if (
      target.type === "section" &&
      y > 0.16 &&
      y < 0.84
    ) {
      return "inside";
    }

    return y <= 0.5
      ? "before"
      : "after";
  }

  function nodeDragOver(
    event: DragEvent,
    target: ComponentNode
  ) {
    event.preventDefault();
    event.dataTransfer.dropEffect =
      "move";

    setDropTarget({
      id: target.id,
      position: dropPosition(
        event,
        target
      )
    });

    setDragPoint({
      x: event.clientX,
      y: event.clientY
    });
  }

  function canvasDragOver(
    event: DragEvent
  ) {
    event.preventDefault();

    setDragPoint({
      x: event.clientX,
      y: event.clientY
    });
  }

  function insertNew(
    page: SitePage,
    newNode: ComponentNode
  ): SitePage {
    const target =
      dropTarget?.id
        ? findNode(
            page.components,
            dropTarget.id
          )
        : null;

    if (
      target?.type === "section" &&
      dropTarget?.position ===
        "inside"
    ) {
      return {
        ...page,
        components: insertNode(
          page.components,
          target.id,
          [newNode],
          "inside"
        )
      };
    }

    if (!target) {
      const first =
        page.components.find(
          (item) =>
            item.type ===
            "section"
        );

      if (first) {
        return {
          ...page,
          components: insertNode(
            page.components,
            first.id,
            [newNode],
            "inside"
          )
        };
      }

      return {
        ...page,
        components: [
          ...page.components,
          section(newId(), [
            newNode
          ])
        ]
      };
    }

    return {
      ...page,
      components: insertNode(
        page.components,
        target.id,
        [newNode],
        dropTarget?.position ??
          "after"
      )
    };
  }

  function handleDrop(
    event: DragEvent,
    target?: ComponentNode
  ) {
    event.preventDefault();

    const payload = parseDrag(event);

    if (!payload) {
      return;
    }

    if (
      payload.kind ===
      "component"
    ) {
      const fresh =
        makeComponent(
          payload.componentType
        );

      updatePage((page) =>
        insertNew(page, fresh)
      );

      setSelectedIds([
        fresh.id
      ]);
    }

    if (
      payload.kind ===
      "template"
    ) {
      const tpl =
        templates.find(
          (item) =>
            item.id ===
            payload.templateId
        );

      if (!tpl) {
        return;
      }

      const fresh =
        cloneWithNewIds(
          tpl.node
        );

      updatePage((page) => ({
        ...page,
        components: [
          ...page.components,
          fresh
        ]
      }));

      setSelectedIds([
        fresh.id
      ]);
    }

    if (
      payload.kind === "node"
    ) {
      const moving =
        payload.nodeIds
          .map((id) =>
            findNode(
              activePage.components,
              id
            )
          )
          .filter(
            (
              item
            ): item is ComponentNode =>
              Boolean(item)
          );

      if (!moving.length) {
        return;
      }

      if (
        target &&
        moving.some((item) =>
          containsNode(
            item,
            target.id
          )
        )
      ) {
        return;
      }

      commit((current) => ({
        ...current,
        pages:
          current.pages.map(
            (page) => {
              if (
                page.id !==
                activePageId
              ) {
                return page;
              }

              const removed =
                removeNodes(
                  page.components,
                  new Set(
                    payload.nodeIds
                  )
                );

              if (!target) {
                return {
                  ...page,
                  components: [
                    ...removed.nodes,
                    ...removed.removed
                  ]
                };
              }

              return {
                ...page,
                components:
                  insertNode(
                    removed.nodes,
                    target.id,
                    removed.removed,
                    dropTarget?.position ??
                      "after"
                  )
              };
            }
          )
      }));
    }

    setDropTarget(null);
    setDragLabel(null);
  }

  function startMarquee(
    event: ReactPointerEvent<HTMLDivElement>
  ) {
    if (
      event.button !== 0 ||
      (
        event.target as HTMLElement
      ).closest(
        ".editor-node,.floating-toolbar,.canvas-controls,.inspector-panel,.side-rail,.topbar"
      )
    ) {
      return;
    }

    setPageSelected(false);
    setSelectedIds([]);

    setMarquee({
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      currentY: event.clientY
    });
  }

  useEffect(() => {
    if (!marquee) {
      return;
    }

    const move = (
      event: PointerEvent
    ) => {
      setMarquee(
        (current) =>
          current
            ? {
                ...current,
                currentX:
                  event.clientX,
                currentY:
                  event.clientY
              }
            : null
      );
    };

    const up = () => {
      setMarquee(
        (current) => {
          if (!current) {
            return null;
          }

          const left = Math.min(
            current.startX,
            current.currentX
          );
          const right = Math.max(
            current.startX,
            current.currentX
          );
          const top = Math.min(
            current.startY,
            current.currentY
          );
          const bottom = Math.max(
            current.startY,
            current.currentY
          );

          const selected =
            allNodes
              .filter((item) => {
                const el =
                  document.querySelector<HTMLElement>(
                    `[data-sytely-id="${item.id}"]`
                  );

                if (!el) {
                  return false;
                }

                const rect =
                  el.getBoundingClientRect();

                return (
                  rect.left < right &&
                  rect.right > left &&
                  rect.top < bottom &&
                  rect.bottom > top
                );
              })
              .map(
                (item) =>
                  item.id
              );

          if (
            right - left > 5 ||
            bottom - top > 5
          ) {
            setSelectedIds(
              selected
            );
            setPageSelected(
              false
            );
          }

          return null;
        }
      );
    };

    window.addEventListener(
      "pointermove",
      move
    );

    window.addEventListener(
      "pointerup",
      up,
      { once: true }
    );

    return () =>
      window.removeEventListener(
        "pointermove",
        move
      );
  }, [marquee, allNodes]);

  function startResize(
    event: ReactPointerEvent<HTMLDivElement>,
    id: string
  ) {
    event.preventDefault();
    event.stopPropagation();

    const ids =
      selectedIds.includes(id)
        ? selectedIds
        : [id];

    const widths: Record<
      string,
      number
    > = {};

    const heights: Record<
      string,
      number
    > = {};

    for (const itemId of ids) {
      const el =
        document.querySelector<HTMLElement>(
          `[data-sytely-id="${itemId}"]`
        );

      if (!el) {
        continue;
      }

      const rect =
        el.getBoundingClientRect();

      widths[itemId] =
        rect.width /
        (zoom / 100);

      heights[itemId] =
        rect.height /
        (zoom / 100);
    }

    setResizeState({
      ids,
      startX: event.clientX,
      startY: event.clientY,
      widths,
      heights,
      before: site
    });
  }

  useEffect(() => {
    if (!resizeState) {
      return;
    }

    const move = (
      event: PointerEvent
    ) => {
      const scale =
        zoom / 100;

      const dx =
        (event.clientX -
          resizeState.startX) /
        scale;

      const dy =
        (event.clientY -
          resizeState.startY) /
        scale;

      updatePageImmediate(
        (page) => ({
          ...page,
          components:
            updateMany(
              page.components,
              new Set(
                resizeState.ids
              ),
              (item) => ({
                ...item,
                styles: {
                  ...(item.styles ??
                    {}),
                  width: Math.max(
                    80,
                    (
                      resizeState
                        .widths[
                        item.id
                      ] ??
                      160
                    ) + dx
                  ),
                  height:
                    Math.max(
                      40,
                      (
                        resizeState
                          .heights[
                          item.id
                        ] ??
                        80
                      ) + dy
                    )
                }
              })
            )
        })
      );
    };

    const up = () => {
      setHistory((items) => [
        ...items.slice(-39),
        resizeState.before
      ]);
      setFuture([]);
      setResizeState(null);
      setNotice(
        "Unsaved changes"
      );
    };

    window.addEventListener(
      "pointermove",
      move
    );

    window.addEventListener(
      "pointerup",
      up,
      { once: true }
    );

    return () =>
      window.removeEventListener(
        "pointermove",
        move
      );
  }, [resizeState, zoom]);

  function duplicateSelected() {
    if (!selectedIds.length) {
      return;
    }

    const selectedSet =
      new Set(selectedIds);

    const clones: ComponentNode[] =
      [];

    commit((current) => ({
      ...current,
      pages: current.pages.map(
        (page) => {
          if (
            page.id !==
            activePageId
          ) {
            return page;
          }

          const top =
            page.components.filter(
              (item) =>
                selectedSet.has(
                  item.id
                )
            );

          clones.push(
            ...top.map(
              cloneWithNewIds
            )
          );

          return {
            ...page,
            components: [
              ...page.components,
              ...clones
            ]
          };
        }
      )
    }));

    if (clones.length) {
      setSelectedIds(
        clones.map(
          (item) => item.id
        )
      );
    }
  }

  function groupSelected() {
    if (
      selectedIds.length < 2
    ) {
      return;
    }

    const parentIds =
      selectedIds.map((id) =>
        findParentId(
          activePage.components,
          id
        )
      );

    if (
      new Set(parentIds)
        .size !== 1
    ) {
      setNotice(
        "Select items from the same level to group"
      );
      return;
    }

    const parentId =
      parentIds[0];

    const selectedSet =
      new Set(selectedIds);

    const group = section(
      newId(),
      selectedNodes,
      {
        paddingTop: 28,
        paddingRight: 28,
        paddingBottom: 28,
        paddingLeft: 28,
        gap: 18,
        background:
          "var(--sytely-card)"
      }
    );

    commit((current) => ({
      ...current,
      pages: current.pages.map(
        (page) => {
          if (
            page.id !==
            activePageId
          ) {
            return page;
          }

          if (
            parentId === null
          ) {
            return {
              ...page,
              components: [
                ...page.components.filter(
                  (item) =>
                    !selectedSet.has(
                      item.id
                    )
                ),
                group
              ]
            };
          }

          return {
            ...page,
            components:
              updateNode(
                page.components,
                parentId,
                (item) => ({
                  ...item,
                  children: [
                    ...(item.children ??
                      []).filter(
                      (child) =>
                        !selectedSet.has(
                          child.id
                        )
                    ),
                    group
                  ]
                })
              )
          };
        }
      )
    }));

    setSelectedIds([
      group.id
    ]);
  }

  function ungroupSelected() {
    if (
      !selectedNode?.children
        ?.length ||
      selectedNode.type !==
        "section"
    ) {
      return;
    }

    const children =
      selectedNode.children;

    commit((current) => ({
      ...current,
      pages: current.pages.map(
        (page) =>
          page.id === activePageId
            ? {
                ...page,
                components:
                  replaceNodeWithChildren(
                    page.components,
                    selectedNode.id
                  )
              }
            : page
      )
    }));

    setSelectedIds(
      children.map(
        (item) => item.id
      )
    );
  }

  function undo() {
    const previous =
      history[
        history.length - 1
      ];

    if (!previous) {
      return;
    }

    setFuture((items) => [
      site,
      ...items
    ]);

    setHistory((items) =>
      items.slice(0, -1)
    );

    setSite(previous);

    setActivePageId(
      previous.pages.find(
        (page) =>
          page.id ===
          activePageId
      )?.id ??
        previous.pages[0]?.id ??
        "page-home"
    );
  }

  function redo() {
    const next = future[0];

    if (!next) {
      return;
    }

    setHistory((items) => [
      ...items,
      site
    ]);

    setFuture((items) =>
      items.slice(1)
    );

    setSite(next);
  }

  function createPage() {
    const id = newId();

    const page = defaultPage(
      id,
      `Page ${site.pages.length + 1}`,
      `/page-${site.pages.length + 1}`
    );

    commit((current) => ({
      ...current,
      pages: [
        ...current.pages,
        page
      ]
    }));

    setActivePageId(id);
    setSelectedIds([]);
    setPageSelected(true);
  }

  function deletePage() {
    if (site.pages.length <= 1) {
      return;
    }

    const next =
      site.pages.filter(
        (page) =>
          page.id !==
          activePageId
      );

    commit((current) => ({
      ...current,
      pages: next
    }));

    setActivePageId(
      next[0].id
    );
    setSelectedIds([]);
    setPageSelected(true);
  }

  function duplicatePage() {
    const source = activePage;

    const id = newId();

    const copy: SitePage = {
      ...source,
      id,
      name: `${source.name} Copy`,
      slug: `${
        source.slug.replace(
          /\/$/,
          ""
        ) || "/page"
      }-copy`,
      components:
        source.components.map(
          cloneWithNewIds
        )
    };

    commit((current) => ({
      ...current,
      pages: [
        ...current.pages,
        copy
      ]
    }));

    setActivePageId(id);
  }

  function switchSite(id: string) {
    const next =
      sites.find(
        (item) => item.id === id
      );

    if (!next) {
      return;
    }

    setSite(next);
    setActivePageId(
      next.pages[0]?.id ??
        "page-home"
    );
    setSelectedIds([]);
    setPageSelected(true);
  }

  function createSite() {
    const id = newId();

    const fresh: Site = {
      ...initialSite,
      id,
      name: `Website ${
        sites.length + 1
      }`,
      pages:
        initialSite.pages.map(
          (page) => ({
            ...page,
            id: newId(),
            components:
              page.components.map(
                cloneWithNewIds
              )
          })
        )
    };

    setSites((current) => [
      ...current,
      fresh
    ]);

    setSite(fresh);

    setActivePageId(
      fresh.pages[0].id
    );

    setSelectedIds([]);
    setPageSelected(true);
    setNotice(
      "New website created"
    );
  }

  function duplicateSite() {
    const id = newId();

    const copy: Site = {
      ...site,
      id,
      name: `${site.name} Copy`,
      pages:
        site.pages.map(
          (page) => ({
            ...page,
            id: newId(),
            components:
              page.components.map(
                cloneWithNewIds
              )
          })
        )
    };

    setSites((current) => [
      ...current,
      copy
    ]);

    setSite(copy);

    setActivePageId(
      copy.pages[0]?.id ??
        "page-home"
    );

    setSelectedIds([]);
    setPageSelected(true);
  }

  function renameSite() {
    const name =
      window.prompt(
        "Website name",
        site.name
      );

    if (!name?.trim()) {
      return;
    }

    commit((current) => ({
      ...current,
      name: name.trim()
    }));
  }

  useEffect(() => {
    const onKey = (
      event: KeyboardEvent
    ) => {
      const target =
        event.target as HTMLElement;

      if (
        [
          "INPUT",
          "TEXTAREA",
          "SELECT"
        ].includes(
          target.tagName
        )
      ) {
        return;
      }

      const meta =
        event.metaKey ||
        event.ctrlKey;

      if (
        meta &&
        event.key.toLowerCase() ===
          "z"
      ) {
        event.preventDefault();

        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }

        return;
      }

      if (
        meta &&
        event.key.toLowerCase() ===
          "y"
      ) {
        event.preventDefault();
        redo();
        return;
      }

      if (
        meta &&
        event.key.toLowerCase() ===
          "d"
      ) {
        event.preventDefault();
        duplicateSelected();
        return;
      }

      if (
        event.key === "Delete" ||
        event.key === "Backspace"
      ) {
        if (selectedIds.length) {
          event.preventDefault();
          selectedIds.forEach(
            deleteNode
          );
        }
      }

      if (event.key === "Escape") {
        setSelectedIds([]);
        setPageSelected(true);
        setDropTarget(null);
      }

      if (
        selectedIds.length &&
        [
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown"
        ].includes(event.key)
      ) {
        event.preventDefault();

        const key =
          event.key ===
            "ArrowLeft" ||
          event.key ===
            "ArrowRight"
            ? "marginLeft"
            : "marginTop";

        const delta =
          event.shiftKey ? 10 : 1;

        const direction =
          event.key ===
            "ArrowLeft" ||
          event.key ===
            "ArrowUp"
            ? -1
            : 1;

        commit((current) => ({
          ...current,
          pages:
            current.pages.map(
              (page) =>
                page.id ===
                activePageId
                  ? {
                      ...page,
                      components:
                        updateMany(
                          page.components,
                          new Set(
                            selectedIds
                          ),
                          (item) => ({
                            ...item,
                            styles: {
                              ...(item.styles ??
                                {}),
                              [key]:
                                parseNumber(
                                  styleValue(
                                    item,
                                    key
                                  ),
                                  0
                                ) +
                                direction *
                                  delta
                            }
                          })
                        )
                    }
                  : page
            )
        }));
      }
    };

    window.addEventListener(
      "keydown",
      onKey
    );

    return () =>
      window.removeEventListener(
        "keydown",
        onKey
      );
  });

  const activePageBackground =
    String(
      activePage?.styles
        ?.background ??
        "var(--sytely-page)"
    );

  const canvasWidth =
    device === "mobile"
      ? 390
      : device === "tablet"
        ? 768
        : 1180;

  const nodeTypeLabel =
    selectedNode?.type ??
    "page";

  function alignmentButton(
    label: string,
    value: string,
    key: string
  ) {
    const current =
      String(
        styleValue(
          selectedNode ?? {
            id: "",
            type: "text",
            props: {},
            styles: {}
          },
          key
        ) ?? ""
      );

    return (
      <button
        type="button"
        className={
          current === value
            ? "active"
            : ""
        }
        onPointerDown={(event) =>
          event.stopPropagation()
        }
        onClick={() =>
          setNodeStyle(
            key,
            value
          )
        }
      >
        {label}
      </button>
    );
  }

  return (
    <div
      className="editor-shell"
      data-theme="system"
      style={themeVars(theme)}
    >
      <header className="topbar">
        <div className="brand-block">
          <a
            href="/"
            className="brand"
          >
            Sytely
          </a>
          <span className="crumb">
            / Editor
          </span>
        </div>

        <div className="site-switcher">
          <select
            value={site.id}
            onChange={(event) =>
              switchSite(
                event.target.value
              )
            }
          >
            {sites.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={createSite}
          >
            New
          </button>

          <button
            type="button"
            onClick={duplicateSite}
          >
            Duplicate
          </button>

          <button
            type="button"
            onClick={renameSite}
          >
            Rename
          </button>
        </div>

        <div className="top-actions">
          <button
            type="button"
            onClick={undo}
            disabled={!history.length}
            title="Undo"
          >
            ↶
          </button>

          <button
            type="button"
            onClick={redo}
            disabled={!future.length}
            title="Redo"
          >
            ↷
          </button>

          <span className="save-status">
            {notice}
          </span>

          <div className="device-switcher">
            {(
              [
                "desktop",
                "tablet",
                "mobile"
              ] as Device[]
            ).map((item) => (
              <button
                key={item}
                type="button"
                className={
                  device === item
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setDevice(item)
                }
              >
                {item ===
                "desktop"
                  ? "Desktop"
                  : item === "tablet"
                    ? "Tablet"
                    : "Mobile"}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              setPreview(true)
            }
            className="primary-button"
          >
            Preview
          </button>

          <button
            type="button"
            className="publish-button"
            onClick={() =>
              setNotice(
                "Publish flow ready"
              )
            }
          >
            Publish
          </button>
        </div>
      </header>

      <div className="editor-workspace">
        <aside className="side-rail left-rail">
          {(
            [
              "components",
              "templates",
              "pages",
              "layers"
            ] as LeftTab[]
          ).map((item) => (
            <button
              key={item}
              type="button"
              className={
                leftTab === item
                  ? "active"
                  : ""
              }
              onClick={() =>
                setLeftTab(item)
              }
            >
              {item[0].toUpperCase()}
            </button>
          ))}
        </aside>

        <aside className="library-panel">
          <div className="panel-heading">
            <strong>
              {leftTab[0].toUpperCase() +
                leftTab.slice(1)}
            </strong>

            <span>
              {leftTab === "layers"
                ? allNodes.length
                : leftTab === "pages"
                  ? site.pages.length
                  : ""}
            </span>
          </div>

          {leftTab ===
            "components" && (
            <>
              <div className="panel-subtitle">
                Add elements
              </div>

              {(
                [
                  "section",
                  "heading",
                  "text",
                  "image",
                  "button"
                ] as ComponentType[]
              ).map((type) => (
                <div
                  key={type}
                  className="palette-card"
                  draggable
                  onDragStart={(event) =>
                    paletteDrag(
                      event,
                      {
                        kind:
                          "component",
                        componentType:
                          type
                      },
                      type
                    )
                  }
                >
                  <span className="palette-icon">
                    {type ===
                    "section"
                      ? "▦"
                      : type ===
                          "heading"
                        ? "T"
                        : type ===
                            "text"
                          ? "≡"
                          : type ===
                              "image"
                            ? "▧"
                            : "→"}
                  </span>

                  <span>
                    {type[0].toUpperCase() +
                      type.slice(1)}
                  </span>

                  <span className="add-symbol">
                    +
                  </span>
                </div>
              ))}
            </>
          )}

          {leftTab ===
            "templates" && (
            <>
              <div className="panel-subtitle">
                Ready-made sections
              </div>

              {templates.map(
                (template) => (
                  <div
                    key={template.id}
                    className="template-card"
                    draggable
                    onDragStart={(
                      event
                    ) =>
                      paletteDrag(
                        event,
                        {
                          kind:
                            "template",
                          templateId:
                            template.id
                        },
                        template.name
                      )
                    }
                  >
                    <strong>
                      {template.name}
                    </strong>
                    <span>
                      {
                        template.description
                      }
                    </span>
                  </div>
                )
              )}
            </>
          )}

          {leftTab === "pages" && (
            <>
              <button
                type="button"
                className="full-button"
                onClick={createPage}
              >
                + New page
              </button>

              {site.pages.map(
                (page) => (
                  <button
                    key={page.id}
                    type="button"
                    className={[
                      "page-list-item",
                      activePageId ===
                      page.id
                        ? "active"
                        : ""
                    ].join(" ")}
                    onClick={() => {
                      setActivePageId(
                        page.id
                      );
                      setSelectedIds(
                        []
                      );
                      setPageSelected(
                        true
                      );
                    }}
                  >
                    {page.name}
                    <span>
                      {page.slug}
                    </span>
                  </button>
                )
              )}

              <div className="page-actions">
                <button
                  type="button"
                  onClick={
                    duplicatePage
                  }
                >
                  Duplicate
                </button>

                <button
                  type="button"
                  onClick={
                    deletePage
                  }
                  disabled={
                    site.pages.length <=
                    1
                  }
                >
                  Delete
                </button>
              </div>
            </>
          )}

          {leftTab === "layers" && (
            <div className="layer-list">
              {allNodes.map(
                (item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={
                      selectedIds.includes(
                        item.id
                      )
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      select(
                        item.id,
                        false
                      )
                    }
                  >
                    <span>
                      {item.type}
                    </span>
                    <small>
                      {item.id.slice(
                        0,
                        6
                      )}
                    </small>
                  </button>
                )
              )}
            </div>
          )}
        </aside>

        <main
          className="canvas-area"
          ref={canvasRef}
          onPointerDown={
            startMarquee
          }
          onDragOver={
            canvasDragOver
          }
          onDrop={(event) =>
            handleDrop(event)
          }
        >
          <div className="canvas-toolbar">
            <span>
              {activePage.name}
            </span>

            <span className="canvas-size">
              {canvasWidth}px
            </span>

            <div className="zoom-controls">
              <button
                type="button"
                onClick={() =>
                  setZoom(
                    (value) =>
                      Math.max(
                        40,
                        value - 10
                      )
                  )
                }
              >
                −
              </button>

              <span>{zoom}%</span>

              <button
                type="button"
                onClick={() =>
                  setZoom(
                    (value) =>
                      Math.min(
                        120,
                        value + 10
                      )
                  )
                }
              >
                +
              </button>

              <button
                type="button"
                onClick={() =>
                  setZoom(72)
                }
              >
                Fit
              </button>
            </div>
          </div>

          {preview ? (
            <div
              className="inline-preview"
              data-sytely-theme={
                theme
              }
              style={{
                background:
                  activePageBackground,
                ...themeVars(
                  theme
                )
              }}
            >
              {activePage.components.map(
                (item) => (
                  <div key={item.id}>
                    {renderNode(item)}
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="canvas-scroll">
              <div
                className="canvas-scale"
                style={{
                  width: canvasWidth,
                  transform: `scale(${
                    zoom / 100
                  })`,
                  transformOrigin:
                    "top center"
                }}
              >
                <div
                  className={[
                    "page-frame",
                    pageSelected
                      ? "page-selected"
                      : ""
                  ].join(" ")}
                  data-sytely-theme={
                    theme
                  }
                  style={{
                    background:
                      activePageBackground,
                    ...themeVars(
                      theme
                    ),
                    paddingTop:
                      activePage
                        .margins.top,
                    paddingRight:
                      activePage
                        .margins.right,
                    paddingBottom:
                      activePage
                        .margins
                        .bottom +
                      96,
                    paddingLeft:
                      activePage
                        .margins.left
                  }}
                  onPointerDown={(
                    event
                  ) => {
                    if (
                      event.target ===
                      event.currentTarget
                    ) {
                      selectPage();
                    }
                  }}
                >
                  {activePage
                    .components
                    .length ===
                    0 && (
                    <div className="empty-page">
                      Drop a section here
                      or choose a starter
                      from Templates.
                    </div>
                  )}

                  {activePage.components.map(
                    (item) => (
                      <EditorNode
                        key={item.id}
                        nodeItem={item}
                        selectedIds={
                          selectedIds
                        }
                        dropTarget={
                          dropTarget
                        }
                        onSelect={select}
                        onDragStart={
                          nodeDrag
                        }
                        onDragOver={
                          nodeDragOver
                        }
                        onDrop={
                          handleDrop
                        }
                        onDragEnd={() => {
                          setDropTarget(
                            null
                          );
                          setDragLabel(
                            null
                          );
                        }}
                        onResizeStart={
                          startResize
                        }
                        onDelete={
                          deleteNode
                        }
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {marquee && (
            <div
              className="marquee"
              style={{
                left: Math.min(
                  marquee.startX,
                  marquee.currentX
                ),
                top: Math.min(
                  marquee.startY,
                  marquee.currentY
                ),
                width: Math.abs(
                  marquee.currentX -
                    marquee.startX
                ),
                height: Math.abs(
                  marquee.currentY -
                    marquee.startY
                )
              }}
            />
          )}

          {dragLabel && (
            <div
              className="drag-ghost"
              style={{
                left:
                  dragPoint.x + 12,
                top:
                  dragPoint.y + 12
              }}
            >
              {dragLabel}
            </div>
          )}

          {selectedIds.length >
            0 &&
            !preview && (
              <div
                className="floating-toolbar"
                onPointerDown={(
                  event
                ) =>
                  event.stopPropagation()
                }
              >
                <span>
                  {selectedIds.length}{" "}
                  selected
                </span>

                <button
                  type="button"
                  onClick={
                    duplicateSelected
                  }
                >
                  Duplicate
                </button>

                <button
                  type="button"
                  onClick={
                    groupSelected
                  }
                  disabled={
                    selectedIds.length <
                    2
                  }
                >
                  Group
                </button>

                <button
                  type="button"
                  onClick={
                    ungroupSelected
                  }
                  disabled={
                    !selectedNode
                      ?.children
                      ?.length
                  }
                >
                  Ungroup
                </button>

                <button
                  type="button"
                  className="danger-text"
                  onClick={() =>
                    selectedIds.forEach(
                      deleteNode
                    )
                  }
                >
                  Delete
                </button>
              </div>
            )}
        </main>

        <aside className="inspector-panel">
          <div className="inspector-header">
            <strong>
              {pageSelected ||
              !selectedNodes.length
                ? "Page"
                : nodeTypeLabel}
            </strong>

            <span>
              {selectedNodes.length >
              1
                ? `${selectedNodes.length} selected`
                : ""}
            </span>
          </div>

          {pageSelected ||
          !selectedNodes.length ? (
            <div className="inspector-scroll">
              <div className="inspector-section">
                <div className="inspector-title">
                  Page design
                </div>

                <label>
                  Page name
                  <input
                    value={
                      activePage.name
                    }
                    onChange={(event) =>
                      updatePage(
                        (page) => ({
                          ...page,
                          name: event
                            .target
                            .value
                        })
                      )
                    }
                  />
                </label>

                <label>
                  Theme
                  <select
                    value={theme}
                    onChange={(event) =>
                      updatePageStyle(
                        "theme",
                        event.target
                          .value as ThemeMode
                      )
                    }
                  >
                    <option value="system">
                      System
                    </option>
                    <option value="light">
                      Light
                    </option>
                    <option value="dark">
                      Dark
                    </option>
                  </select>
                </label>

                <label>
                  Background
                  <input
                    value={
                      activePageBackground
                    }
                    onChange={(event) =>
                      updatePageStyle(
                        "background",
                        event.target.value
                      )
                    }
                  />
                </label>
              </div>

              <div className="inspector-section">
                <div className="inspector-title">
                  Page margins
                </div>

                {(
                  [
                    "top",
                    "right",
                    "bottom",
                    "left"
                  ] as const
                ).map((key) => (
                  <label key={key}>
                    {key}
                    <input
                      type="number"
                      value={
                        activePage
                          .margins[key]
                      }
                      onChange={(event) =>
                        updatePageMargin(
                          key,
                          Number(
                            event.target
                              .value
                          )
                        )
                      }
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : selectedNodes.length >
            1 ? (
            <div className="inspector-scroll">
              <div className="multi-selection">
                {selectedNodes.length}{" "}
                items selected
              </div>

              <div className="inspector-section">
                <div className="inspector-title">
                  Alignment
                </div>

                <div className="alignment-grid">
                  {alignmentButton(
                    "Left",
                    "flex-start",
                    "alignSelf"
                  )}
                  {alignmentButton(
                    "Center",
                    "center",
                    "alignSelf"
                  )}
                  {alignmentButton(
                    "Right",
                    "flex-end",
                    "alignSelf"
                  )}
                </div>
              </div>

              <div className="inspector-section">
                <div className="inspector-title">
                  Size
                </div>

                <label>
                  Width
                  <input
                    type="number"
                    onChange={(event) =>
                      setNodeStyle(
                        "width",
                        Number(
                          event.target
                            .value
                        )
                      )
                    }
                  />
                </label>

                <label>
                  Height
                  <input
                    type="number"
                    onChange={(event) =>
                      setNodeStyle(
                        "height",
                        Number(
                          event.target
                            .value
                        )
                      )
                    }
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="inspector-scroll">
              <div className="inspector-section">
                <div className="inspector-title">
                  Element
                </div>

                <div className="readonly-type">
                  Type
                  <strong>
                    {selectedNode?.type}
                  </strong>
                </div>
              </div>

              {selectedNode?.type ===
                "section" && (
                <div className="inspector-section">
                  <div className="inspector-title">
                    Alignment
                  </div>

                  <div className="alignment-group">
                    <span>
                      Horizontal
                    </span>

                    <div className="alignment-grid">
                      {alignmentButton(
                        "Left",
                        "flex-start",
                        "alignItems"
                      )}
                      {alignmentButton(
                        "Center",
                        "center",
                        "alignItems"
                      )}
                      {alignmentButton(
                        "Right",
                        "flex-end",
                        "alignItems"
                      )}
                    </div>

                    <span>
                      Vertical
                    </span>

                    <div className="alignment-grid">
                      {alignmentButton(
                        "Top",
                        "flex-start",
                        "justifyContent"
                      )}
                      {alignmentButton(
                        "Center",
                        "center",
                        "justifyContent"
                      )}
                      {alignmentButton(
                        "Bottom",
                        "flex-end",
                        "justifyContent"
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedNode?.type ===
                "section" && (
                <div className="inspector-section">
                  <div className="inspector-title">
                    Spacing
                  </div>

                  {(
                    [
                      "paddingTop",
                      "paddingRight",
                      "paddingBottom",
                      "paddingLeft"
                    ] as const
                  ).map((key) => (
                    <label key={key}>
                      {key.replace(
                        "padding",
                        ""
                      )}

                      <input
                        type="number"
                        value={parseNumber(
                          styleValue(
                            selectedNode,
                            key
                          ),
                          key.includes(
                            "Top"
                          ) ||
                            key.includes(
                              "Bottom"
                            )
                            ? DEFAULT_SECTION_PADDING
                            : 40
                        )}
                        onChange={(
                          event
                        ) =>
                          setNodeStyle(
                            key,
                            Number(
                              event.target
                                .value
                            )
                          )
                        }
                      />
                    </label>
                  ))}
                </div>
              )}

              {selectedNode?.type ===
                "section" && (
                <div className="inspector-section">
                  <div className="inspector-title">
                    Appearance
                  </div>

                  <label>
                    Background
                    <input
                      value={String(
                        styleValue(
                          selectedNode,
                          "background"
                        ) ?? ""
                      )}
                      onChange={(event) =>
                        setNodeStyle(
                          "background",
                          event.target
                            .value
                        )
                      }
                    />
                  </label>

                  <label>
                    Radius
                    <input
                      type="number"
                      value={parseNumber(
                        styleValue(
                          selectedNode,
                          "borderRadius"
                        ),
                        0
                      )}
                      onChange={(event) =>
                        setNodeStyle(
                          "borderRadius",
                          Number(
                            event.target
                              .value
                          )
                        )
                      }
                    />
                  </label>
                </div>
              )}

              {(selectedNode?.type ===
                "heading" ||
                selectedNode?.type ===
                  "text" ||
                selectedNode?.type ===
                  "button") && (
                <div className="inspector-section">
                  <label>
                    {selectedNode.type ===
                    "button"
                      ? "Label"
                      : "Text"}

                    {selectedNode.type ===
                      "text" ||
                    selectedNode.type ===
                      "heading" ? (
                      <textarea
                        value={String(
                          selectedNode
                            .props.text ??
                            ""
                        )}
                        onChange={(
                          event
                        ) =>
                          setNodeProp(
                            "text",
                            event.target
                              .value
                          )
                        }
                      />
                    ) : (
                      <input
                        value={String(
                          selectedNode
                            .props.text ??
                            ""
                        )}
                        onChange={(
                          event
                        ) =>
                          setNodeProp(
                            "text",
                            event.target
                              .value
                          )
                        }
                      />
                    )}
                  </label>

                  <label>
                    Font size
                    <input
                      type="number"
                      value={parseNumber(
                        styleValue(
                          selectedNode,
                          "fontSize"
                        ),
                        selectedNode.type ===
                          "heading"
                          ? 32
                          : 16
                      )}
                      onChange={(event) =>
                        setNodeStyle(
                          "fontSize",
                          Number(
                            event.target
                              .value
                          )
                        )
                      }
                    />
                  </label>

                  {selectedNode.type ===
                    "heading" && (
                    <label>
                      Weight
                      <select
                        value={String(
                          styleValue(
                            selectedNode,
                            "fontWeight"
                          ) ?? 700
                        )}
                        onChange={(
                          event
                        ) =>
                          setNodeStyle(
                            "fontWeight",
                            event.target
                              .value
                          )
                        }
                      >
                        <option value="400">
                          400
                        </option>
                        <option value="500">
                          500
                        </option>
                        <option value="600">
                          600
                        </option>
                        <option value="700">
                          700
                        </option>
                      </select>
                    </label>
                  )}

                  {selectedNode.type ===
                    "button" && (
                    <label>
                      Background
                      <input
                        value={String(
                          styleValue(
                            selectedNode,
                            "background"
                          ) ??
                            "var(--sytely-accent)"
                        )}
                        onChange={(event) =>
                          setNodeStyle(
                            "background",
                            event.target
                              .value
                          )
                        }
                      />
                    </label>
                  )}
                </div>
              )}

              {selectedNode?.type ===
                "image" && (
                <div className="inspector-section">
                  <label>
                    Image URL
                    <input
                      value={String(
                        selectedNode.props
                          .src ?? ""
                      )}
                      onChange={(event) =>
                        setNodeProp(
                          "src",
                          event.target
                            .value
                        )
                      }
                    />
                  </label>

                  <label>
                    Alt text
                    <input
                      value={String(
                        selectedNode.props
                          .alt ?? ""
                      )}
                      onChange={(event) =>
                        setNodeProp(
                          "alt",
                          event.target
                            .value
                        )
                      }
                    />
                  </label>
                </div>
              )}

              {selectedNode &&
                selectedNode.type !==
                  "section" && (
                  <div className="inspector-section">
                    <div className="inspector-title">
                      Alignment
                    </div>

                    <div className="alignment-grid">
                      {alignmentButton(
                        "Left",
                        "flex-start",
                        "alignSelf"
                      )}
                      {alignmentButton(
                        "Center",
                        "center",
                        "alignSelf"
                      )}
                      {alignmentButton(
                        "Right",
                        "flex-end",
                        "alignSelf"
                      )}
                    </div>
                  </div>
                )}

              {selectedNode && (
                <div className="inspector-section">
                  <div className="inspector-title">
                    Size
                  </div>

                  <label>
                    Width
                    <input
                      type="number"
                      value={
                        typeof styleValue(
                          selectedNode,
                          "width"
                        ) ===
                        "number"
                          ? Number(
                              styleValue(
                                selectedNode,
                                "width"
                              )
                            )
                          : ""
                      }
                      placeholder="Auto"
                      onChange={(event) =>
                        setNodeStyle(
                          "width",
                          event.target
                            .value ===
                            ""
                            ? "auto"
                            : Number(
                                event
                                  .target
                                  .value
                              )
                        )
                      }
                    />
                  </label>

                  <label>
                    Height
                    <input
                      type="number"
                      value={
                        typeof styleValue(
                          selectedNode,
                          "height"
                        ) ===
                        "number"
                          ? Number(
                              styleValue(
                                selectedNode,
                                "height"
                              )
                            )
                          : ""
                      }
                      placeholder="Auto"
                      onChange={(event) =>
                        setNodeStyle(
                          "height",
                          event.target
                            .value ===
                            ""
                            ? "auto"
                            : Number(
                                event
                                  .target
                                  .value
                              )
                        )
                      }
                    />
                  </label>
                </div>
              )}

              {selectedNode &&
                selectedNode.type !==
                  "section" && (
                  <div className="inspector-section">
                    <div className="inspector-title">
                      Link
                    </div>

                    <select
                      value={String(
                        selectedNode.props
                          .linkTo ??
                          ""
                      )}
                      onChange={(event) =>
                        setNodeProp(
                          "linkTo",
                          event.target
                            .value
                        )
                      }
                    >
                      <option value="">
                        No link
                      </option>

                      {site.pages.map(
                        (page) => (
                          <option
                            key={page.id}
                            value={
                              page.slug
                            }
                          >
                            {page.name}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                )}

              <div className="inspector-section">
                <button
                  type="button"
                  className="danger-button"
                  onClick={() =>
                    selectedNode &&
                    deleteNode(
                      selectedNode.id
                    )
                  }
                >
                  Delete element
                </button>
              </div>
            </div>
          )}
        </aside>

        <aside className="side-rail right-rail">
          {(
            [
              "design",
              "layout",
              "position"
            ] as RightTab[]
          ).map((item) => (
            <button
              key={item}
              type="button"
              className={
                rightTab === item
                  ? "active"
                  : ""
              }
              onClick={() =>
                setRightTab(item)
              }
            >
              {item[0].toUpperCase()}
            </button>
          ))}
        </aside>
      </div>

      {rightTab !== "design" &&
        selectedNode && (
          <div className="quick-panel">
            <strong>
              {rightTab ===
              "layout"
                ? "Layout"
                : "Position"}
            </strong>

            {rightTab ===
            "layout" ? (
              <>
                <label>
                  Display
                  <select
                    value={String(
                      styleValue(
                        selectedNode,
                        "display"
                      ) ?? ""
                    )}
                    onChange={(event) =>
                      setNodeStyle(
                        "display",
                        event.target
                          .value
                      )
                    }
                  >
                    <option value="">
                      Default
                    </option>
                    <option value="flex">
                      Flex
                    </option>
                    <option value="grid">
                      Grid
                    </option>
                  </select>
                </label>

                <label>
                  Gap
                  <input
                    type="number"
                    value={parseNumber(
                      styleValue(
                        selectedNode,
                        "gap"
                      ),
                      24
                    )}
                    onChange={(event) =>
                      setNodeStyle(
                        "gap",
                        Number(
                          event.target
                            .value
                        )
                      )
                    }
                  />
                </label>
              </>
            ) : (
              <>
                <label>
                  Top
                  <input
                    type="number"
                    value={parseNumber(
                      styleValue(
                        selectedNode,
                        "top"
                      ),
                      0
                    )}
                    onChange={(event) =>
                      setNodeStyle(
                        "top",
                        Number(
                          event.target
                            .value
                        )
                      )
                    }
                  />
                </label>

                <label>
                  Left
                  <input
                    type="number"
                    value={parseNumber(
                      styleValue(
                        selectedNode,
                        "left"
                      ),
                      0
                    )}
                    onChange={(event) =>
                      setNodeStyle(
                        "left",
                        Number(
                          event.target
                            .value
                        )
                      )
                    }
                  />
                </label>
              </>
            )}
          </div>
        )}

      {preview && (
        <div
          className="full-preview"
          data-sytely-theme={theme}
          style={themeVars(theme)}
        >
          <div className="full-preview-bar">
            <strong>
              {site.name}
            </strong>

            <span>
              {activePage.name}
            </span>

            <button
              type="button"
              onClick={() =>
                setPreview(false)
              }
            >
              Close preview
            </button>
          </div>

          <div
            className="full-preview-page"
            style={{
              background:
                activePageBackground,
              paddingTop:
                activePage.margins
                  .top,
              paddingRight:
                activePage.margins
                  .right,
              paddingBottom:
                activePage.margins
                  .bottom + 96,
              paddingLeft:
                activePage.margins
                  .left
            }}
          >
            {activePage.components.map(
              (item) => (
                <div key={item.id}>
                  {renderNode(item)}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}