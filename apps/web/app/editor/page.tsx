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
import type {
  ComponentNode,
  ComponentType,
  Site,
  SitePage
} from "@sytely/types";
import "./editor.css";

type DragPayload =
  | {
      kind: "component";
      componentType: ComponentType;
    }
  | {
      kind: "template";
      templateId: string;
    }
  | {
      kind: "node";
      nodeId: string;
    };

type DropPosition = "before" | "after" | "inside";

interface DropTarget {
  id: string | null;
  position: DropPosition;
}

interface Template {
  id: string;
  name: string;
  node: ComponentNode;
}

interface ResizeState {
  id: string;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

const DEFAULT_SECTION_PADDING = 56;

function newId(): string {
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
): ComponentNode {
  return node(
    id,
    "section",
    {},
    {
      paddingTop: DEFAULT_SECTION_PADDING,
      paddingRight: 40,
      paddingBottom: DEFAULT_SECTION_PADDING,
      paddingLeft: 40,
      ...styles
    },
    children
  );
}

/*
 * IMPORTANT:
 * Every template ID is deterministic.
 * Random IDs are created only when a user actually drops/clones a template.
 */
const templates: Template[] = [
  {
    id: "hero",
    name: "Hero",
    node: section(
      "tpl-hero",
      [
        node(
          "tpl-hero-heading",
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
          "tpl-hero-text",
          "text",
          {
            text: "Create polished websites visually without writing code."
          },
          {
            fontSize: 18,
            textAlign: "center",
            width: "100%",
            maxWidth: 700,
            alignSelf: "center"
          }
        ),
        node(
          "tpl-hero-button",
          "button",
          { text: "Get started" },
          {
            alignSelf: "center",
            background: "#111",
            color: "#fff"
          }
        )
      ],
      {
        alignItems: "center",
        gap: 20,
        background: "#fff"
      }
    )
  },

  {
    id: "split",
    name: "Split",
    node: section(
      "tpl-split",
      [
        node(
          "tpl-split-content",
          "section",
          {},
          {
            gap: 16,
            paddingTop: 0,
            paddingRight: 0,
            paddingBottom: 0,
            paddingLeft: 0
          },
          [
            node(
              "tpl-split-heading",
              "heading",
              { text: "A clear message" },
              { fontSize: 38, fontWeight: 700 }
            ),
            node(
              "tpl-split-text",
              "text",
              {
                text: "Use sections to create structure and arrange normal components inside them."
              }
            ),
            node(
              "tpl-split-button",
              "button",
              { text: "Learn more" },
              { background: "#111", color: "#fff" }
            )
          ]
        ),
        node(
          "tpl-split-image",
          "image",
          { src: "", alt: "Placeholder image" },
          {
            width: "100%",
            height: 280
          }
        )
      ],
      {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        alignItems: "center",
        gap: 48,
        background: "#fff"
      }
    )
  },

  {
    id: "features",
    name: "Features",
    node: section(
      "tpl-features",
      [
        node(
          "tpl-features-heading",
          "heading",
          { text: "Everything in one place" },
          { fontSize: 38, fontWeight: 700, textAlign: "center" }
        ),
        node(
          "tpl-features-text",
          "text",
          {
            text: "Build pages from reusable sections and ordinary components."
          },
          { textAlign: "center" }
        ),
        section(
          "tpl-feature-grid",
          [
            node(
              "tpl-feature-1",
              "section",
              {},
              { padding: 28, background: "#f6f6f6", gap: 12 },
              [
                node(
                  "tpl-feature-1-heading",
                  "heading",
                  { text: "Visual editing" },
                  { fontSize: 22, fontWeight: 700 }
                ),
                node(
                  "tpl-feature-1-text",
                  "text",
                  { text: "Move, resize and organize components directly on the canvas." }
                )
              ]
            ),
            node(
              "tpl-feature-2",
              "section",
              {},
              { padding: 28, background: "#f6f6f6", gap: 12 },
              [
                node(
                  "tpl-feature-2-heading",
                  "heading",
                  { text: "Responsive layouts" },
                  { fontSize: 22, fontWeight: 700 }
                ),
                node(
                  "tpl-feature-2-text",
                  "text",
                  { text: "Control layout, spacing and alignment without code." }
                )
              ]
            ),
            node(
              "tpl-feature-3",
              "section",
              {},
              { padding: 28, background: "#f6f6f6", gap: 12 },
              [
                node(
                  "tpl-feature-3-heading",
                  "heading",
                  { text: "Reusable sections" },
                  { fontSize: 22, fontWeight: 700 }
                ),
                node(
                  "tpl-feature-3-text",
                  "text",
                  { text: "Save time with ready-made page sections." }
                )
              ]
            )
          ],
          {
            display: "grid",
            gridTemplateColumns:
              "repeat(3,minmax(0,1fr))",
            paddingTop: 8,
            paddingRight: 0,
            paddingBottom: 0,
            paddingLeft: 0,
            gap: 20
          }
        )
      ],
      {
        gap: 20,
        background: "#fff"
      }
    )
  },

  {
    id: "cta",
    name: "CTA",
    node: section(
      "tpl-cta",
      [
        node(
          "tpl-cta-heading",
          "heading",
          { text: "Ready to build your next page?" },
          {
            fontSize: 38,
            fontWeight: 700,
            textAlign: "center"
          }
        ),
        node(
          "tpl-cta-text",
          "text",
          { text: "Start with a section and customize every part." },
          { textAlign: "center" }
        ),
        node(
          "tpl-cta-button",
          "button",
          { text: "Start building" },
          {
            alignSelf: "center",
            background: "#111",
            color: "#fff"
          }
        )
      ],
      {
        alignItems: "center",
        gap: 18,
        background: "#f1f1f1"
      }
    )
  },

  {
    id: "contact",
    name: "Contact",
    node: section(
      "tpl-contact",
      [
        node(
          "tpl-contact-heading",
          "heading",
          { text: "Let's talk" },
          { fontSize: 38, fontWeight: 700 }
        ),
        node(
          "tpl-contact-text",
          "text",
          {
            text: "Tell visitors how they can reach you."
          }
        ),
        node(
          "tpl-contact-button",
          "button",
          { text: "Contact us" },
          {
            background: "#111",
            color: "#fff"
          }
        )
      ],
      {
        gap: 18,
        background: "#fff"
      }
    )
  },

  {
    id: "stats",
    name: "Stats",
    node: section(
      "tpl-stats",
      [
        section(
          "tpl-stat-grid",
          [
            node(
              "tpl-stat-1",
              "section",
              {},
              {
                padding: 20,
                background: "#f5f5f5",
                gap: 8,
                alignItems: "center"
              },
              [
                node(
                  "tpl-stat-1-heading",
                  "heading",
                  { text: "10k+" },
                  { fontSize: 34, fontWeight: 700 }
                ),
                node(
                  "tpl-stat-1-text",
                  "text",
                  { text: "Projects" }
                )
              ]
            ),
            node(
              "tpl-stat-2",
              "section",
              {},
              {
                padding: 20,
                background: "#f5f5f5",
                gap: 8,
                alignItems: "center"
              },
              [
                node(
                  "tpl-stat-2-heading",
                  "heading",
                  { text: "99%" },
                  { fontSize: 34, fontWeight: 700 }
                ),
                node(
                  "tpl-stat-2-text",
                  "text",
                  { text: "Satisfaction" }
                )
              ]
            ),
            node(
              "tpl-stat-3",
              "section",
              {},
              {
                padding: 20,
                background: "#f5f5f5",
                gap: 8,
                alignItems: "center"
              },
              [
                node(
                  "tpl-stat-3-heading",
                  "heading",
                  { text: "24/7" },
                  { fontSize: 34, fontWeight: 700 }
                ),
                node(
                  "tpl-stat-3-text",
                  "text",
                  { text: "Availability" }
                )
              ]
            )
          ],
          {
            display: "grid",
            gridTemplateColumns:
              "repeat(3,minmax(0,1fr))",
            paddingTop: 0,
            paddingRight: 0,
            paddingBottom: 0,
            paddingLeft: 0,
            gap: 20
          }
        )
      ],
      {
        background: "#fff"
      }
    )
  }
];

const initialSite: Site = {
  id: "site-1",
  name: "Sytely Site",
  version: 1,
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
        background: "#ffffff"
      },
      components: [
        templates[0].node,
        templates[2].node
      ]
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
        background: "#ffffff"
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

  switch (type) {
    case "section":
      return section(id, []);

    case "heading":
      return node(
        id,
        "heading",
        { text: "Heading" },
        { fontSize: 32, fontWeight: 700 }
      );

    case "text":
      return node(
        id,
        "text",
        { text: "Add your text here." }
      );

    case "image":
      return node(
        id,
        "image",
        { src: "", alt: "Image" },
        { width: 320, height: 220 }
      );

    case "button":
      return node(
        id,
        "button",
        { text: "Button" },
        {
          background: "#111",
          color: "#fff"
        }
      );
  }
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

function containsNode(
  nodeItem: ComponentNode,
  id: string
): boolean {
  if (nodeItem.id === id) {
    return true;
  }

  return (nodeItem.children ?? []).some((child) =>
    containsNode(child, id)
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

    const childResult = removeNode(item.children ?? [], id);

    if (childResult.removed) {
      removed = childResult.removed;
    }

    result.push({
      ...item,
      children:
        item.children !== undefined
          ? childResult.nodes
          : undefined
    });
  }

  return { nodes: result, removed };
}

function insertNode(
  nodes: ComponentNode[],
  targetId: string,
  itemToInsert: ComponentNode,
  position: DropPosition
): ComponentNode[] {
  const result: ComponentNode[] = [];

  for (const item of nodes) {
    if (item.id === targetId) {
      if (position === "before") {
        result.push(itemToInsert, item);
      } else if (position === "after") {
        result.push(item, itemToInsert);
      } else {
        result.push({
          ...item,
          children: [
            ...(item.children ?? []),
            itemToInsert
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
              itemToInsert,
              position
            )
          : undefined
    });
  }

  return result;
}

function updateNode(
  nodes: ComponentNode[],
  id: string,
  updater: (node: ComponentNode) => ComponentNode
): ComponentNode[] {
  return nodes.map((item) => {
    if (item.id === id) {
      return updater(item);
    }

    return {
      ...item,
      children:
        item.children !== undefined
          ? updateNode(item.children, id, updater)
          : undefined
    };
  });
}

function collectNodes(
  nodes: ComponentNode[],
  result: ComponentNode[] = []
): ComponentNode[] {
  for (const item of nodes) {
    result.push(item);
    collectNodes(item.children ?? [], result);
  }

  return result;
}

function parseNumber(
  value: unknown,
  fallback: number
): number {
  const parsed = Number.parseFloat(String(value ?? ""));

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function getStyleValue(
  nodeItem: ComponentNode,
  key: string
): unknown {
  return nodeItem.styles?.[key];
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
    nodeItem: ComponentNode
  ) => void;
  onDrop: (
    event: DragEvent,
    nodeItem: ComponentNode
  ) => void;
  onDragEnd: () => void;
  onResizeStart: (
    event: ReactPointerEvent<HTMLDivElement>,
    id: string
  ) => void;
  onDelete: (id: string) => void;
}) {
  const selected = selectedIds.includes(nodeItem.id);
  const children = nodeItem.children ?? [];

  const dropClass =
    dropTarget?.id === nodeItem.id
      ? `drop-${dropTarget.position}`
      : "";

  const width =
    getStyleValue(nodeItem, "width") ??
    (nodeItem.type === "section"
      ? "100%"
      : "fit-content");

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
      style={{ width: String(width) }}
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

        onSelect(
          nodeItem.id,
          event.shiftKey || event.metaKey || event.ctrlKey
        );
      }}
    >
      <div className="node-visual">
        {visual}

        {nodeItem.type === "section" && (
          <div className="padding-overlay">
            <span className="padding-label">
              padding
            </span>
          </div>
        )}
      </div>

      {selected && (
        <>
          <div className="node-label">
            {nodeItem.type}
          </div>

          <div
            className="resize-handle resize-right"
            onPointerDown={(event) =>
              onResizeStart(event, nodeItem.id)
            }
          />

          <div
            className="resize-handle resize-bottom"
            onPointerDown={(event) =>
              onResizeStart(event, nodeItem.id)
            }
          />

          <div
            className="resize-handle resize-corner"
            onPointerDown={(event) =>
              onResizeStart(event, nodeItem.id)
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
  const [site, setSite] = useState<Site>(initialSite);
  const [activePageId, setActivePageId] =
    useState("page-home");

  const [selectedIds, setSelectedIds] = useState<string[]>(
    []
  );

  const [pageSelected, setPageSelected] =
    useState(false);

  const [dropTarget, setDropTarget] =
    useState<DropTarget | null>(null);

  const [dragLabel, setDragLabel] =
    useState<string | null>(null);

  const [dragPoint, setDragPoint] = useState({
    x: 0,
    y: 0
  });

  const [zoom, setZoom] = useState(100);
  const [preview, setPreview] = useState(false);

  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const [resizeState, setResizeState] =
    useState<ResizeState | null>(null);

  const canvasRef = useRef<HTMLDivElement | null>(
    null
  );

  const activePage = site.pages.find(
    (page) => page.id === activePageId
  ) ?? site.pages[0];

  const allNodes = useMemo(
    () => collectNodes(activePage?.components ?? []),
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
          (item) => item.id === selectedIds[0]
        ) ?? null
      : null;

  function updatePage(
    updater: (page: SitePage) => SitePage
  ) {
    setSite((current) => ({
      ...current,
      pages: current.pages.map((page) =>
        page.id === activePageId
          ? updater(page)
          : page
      )
    }));
  }

  function updateSelectedNodes(
    updater: (nodeItem: ComponentNode) => ComponentNode
  ) {
    updatePage((page) => ({
      ...page,
      components: selectedIds.reduce(
        (components, id) =>
          updateNode(
            components,
            id,
            updater
          ),
        page.components
      )
    }));
  }

  function select(
    id: string,
    additive: boolean
  ) {
    setPageSelected(false);

    if (additive) {
      setSelectedIds((current) =>
        current.includes(id)
          ? current.filter((item) => item !== id)
          : [...current, id]
      );
      return;
    }

    setSelectedIds([id]);
  }

  function deleteNode(id: string) {
    updatePage((page) => ({
      ...page,
      components: removeNode(
        page.components,
        id
      ).nodes
    }));

    setSelectedIds((current) =>
      current.filter((item) => item !== id)
    );
  }

  function handlePaletteDragStart(
    event: DragEvent,
    payload: DragPayload,
    label: string
  ) {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(
      "application/x-sytely",
      JSON.stringify(payload)
    );

    setDragLabel(label);
  }

  function handleNodeDragStart(
    event: DragEvent,
    id: string
  ) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(
      "application/x-sytely",
      JSON.stringify({
        kind: "node",
        nodeId: id
      } satisfies DragPayload)
    );

    setDragLabel(
      selectedIds.length > 1 &&
        selectedIds.includes(id)
        ? `${selectedIds.length} components`
        : "Component"
    );
  }

  function getDropPosition(
    event: DragEvent,
    target: ComponentNode
  ): DropPosition {
    const rect =
      event.currentTarget.getBoundingClientRect();

    const y =
      (event.clientY - rect.top) / rect.height;

    if (
      target.type === "section" &&
      y > 0.25 &&
      y < 0.75
    ) {
      return "inside";
    }

    return y <= 0.5 ? "before" : "after";
  }

  function handleNodeDragOver(
    event: DragEvent,
    target: ComponentNode
  ) {
    event.preventDefault();

    const payloadText =
      event.dataTransfer.types.includes(
        "application/x-sytely"
      );

    if (!payloadText) {
      return;
    }

    if (
      target.type !== "section" &&
      getDropPosition(event, target) === "inside"
    ) {
      return;
    }

    setDropTarget({
      id: target.id,
      position: getDropPosition(event, target)
    });

    setDragPoint({
      x: event.clientX,
      y: event.clientY
    });
  }

  function handleCanvasDragOver(
    event: DragEvent
  ) {
    event.preventDefault();

    setDragPoint({
      x: event.clientX,
      y: event.clientY
    });
  }

  function readPayload(
    event: DragEvent
  ): DragPayload | null {
    const value = event.dataTransfer.getData(
      "application/x-sytely"
    );

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as DragPayload;
    } catch {
      return null;
    }
  }

  function insertNewComponent(
    page: SitePage,
    newNode: ComponentNode
  ): SitePage {
    const target = dropTarget?.id
      ? findNode(page.components, dropTarget.id)
      : null;

    if (
      target?.type === "section" &&
      dropTarget?.position === "inside"
    ) {
      return {
        ...page,
        components: insertNode(
          page.components,
          target.id,
          newNode,
          "inside"
        )
      };
    }

    const firstSection = page.components.find(
      (item) => item.type === "section"
    );

    if (!target && firstSection) {
      return {
        ...page,
        components: insertNode(
          page.components,
          firstSection.id,
          newNode,
          "inside"
        )
      };
    }

    if (!target) {
      const newSection = section(newId(), [
        newNode
      ]);

      return {
        ...page,
        components: [
          ...page.components,
          newSection
        ]
      };
    }

    return {
      ...page,
      components: insertNode(
        page.components,
        target.id,
        newNode,
        dropTarget?.position === "inside"
          ? "inside"
          : dropTarget?.position ?? "after"
      )
    };
  }

  function handleDrop(
    event: DragEvent,
    target?: ComponentNode
  ) {
    event.preventDefault();

    const payload = readPayload(event);

    if (!payload) {
      return;
    }

    if (
      payload.kind === "node" &&
      target &&
      containsNode(
        findNode(activePage.components, payload.nodeId) ??
          target,
        target.id
      )
    ) {
      setDropTarget(null);
      return;
    }

    if (payload.kind === "component") {
      const newNode = makeComponent(
        payload.componentType
      );

      updatePage((page) =>
        insertNewComponent(page, newNode)
      );

      setSelectedIds([newNode.id]);
    }

    if (payload.kind === "template") {
      const template = templates.find(
        (item) => item.id === payload.templateId
      );

      if (!template) {
        return;
      }

      const cloned = cloneWithNewIds(
        template.node
      );

      updatePage((page) => ({
        ...page,
        components: [
          ...page.components,
          cloned
        ]
      }));

      setSelectedIds([cloned.id]);
    }

    if (payload.kind === "node") {
      const moving = findNode(
        activePage.components,
        payload.nodeId
      );

      if (!moving) {
        return;
      }

      if (
        target &&
        containsNode(moving, target.id)
      ) {
        setDropTarget(null);
        return;
      }

      updatePage((page) => {
        const removed = removeNode(
          page.components,
          payload.nodeId
        );

        if (!removed.removed) {
          return page;
        }

        if (!target) {
          return {
            ...page,
            components: [
              ...removed.nodes,
              removed.removed
            ]
          };
        }

        return {
          ...page,
          components: insertNode(
            removed.nodes,
            target.id,
            removed.removed,
            dropTarget?.position ?? "after"
          )
        };
      });
    }

    setDropTarget(null);
    setDragLabel(null);
  }

  function startMarquee(
    event: ReactPointerEvent<HTMLDivElement>
  ) {
    if (event.button !== 0) {
      return;
    }

    if (
      (event.target as HTMLElement).closest(
        ".editor-node"
      )
    ) {
      return;
    }

    const rect =
      canvasRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    setPageSelected(true);
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

    function move(event: PointerEvent) {
      setMarquee((current) =>
        current
          ? {
              ...current,
              currentX: event.clientX,
              currentY: event.clientY
            }
          : null
      );
    }

    function up() {
      setMarquee((current) => {
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

        const selected = allNodes
          .filter((item) => {
            const element =
              document.querySelector<HTMLElement>(
                `[data-sytely-id="${item.id}"]`
              );

            if (!element) {
              return false;
            }

            const rect =
              element.getBoundingClientRect();

            return (
              rect.left < right &&
              rect.right > left &&
              rect.top < bottom &&
              rect.bottom > top
            );
          })
          .map((item) => item.id);

        if (
          Math.abs(right - left) > 5 ||
          Math.abs(bottom - top) > 5
        ) {
          setSelectedIds(selected);
          setPageSelected(false);
        }

        return null;
      });
    }

    window.addEventListener(
      "pointermove",
      move
    );
    window.addEventListener(
      "pointerup",
      up,
      { once: true }
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        move
      );
    };
  }, [marquee, allNodes]);

  useEffect(() => {
    if (!resizeState) {
      return;
    }

    const activeResizeState = resizeState;

    function move(event: PointerEvent) {
      const dx =
        (event.clientX -
          activeResizeState.startX) /
        (zoom / 100);

      const dy =
        (event.clientY -
          activeResizeState.startY) /
        (zoom / 100);

      updatePage((page) => ({
        ...page,
        components: updateNode(
          page.components,
          activeResizeState.id,
          (item) => ({
            ...item,
            styles: {
              ...(item.styles ?? {}),
              width: Math.max(
                80,
                activeResizeState.startWidth + dx
              ),
              height: Math.max(
                40,
                activeResizeState.startHeight + dy
              )
            }
          })
        )
      }));
    }

    function up() {
      setResizeState(null);
    }

    window.addEventListener(
      "pointermove",
      move
    );
    window.addEventListener(
      "pointerup",
      up,
      { once: true }
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        move
      );
    };
  }, [resizeState, zoom]);

  function startResize(
    event: ReactPointerEvent<HTMLDivElement>,
    id: string
  ) {
    event.preventDefault();
    event.stopPropagation();

    const element =
      document.querySelector<HTMLElement>(
        `[data-sytely-id="${id}"]`
      );

    if (!element) {
      return;
    }

    const rect =
      element.getBoundingClientRect();

    setResizeState({
      id,
      startX: event.clientX,
      startY: event.clientY,
      startWidth:
        rect.width / (zoom / 100),
      startHeight:
        rect.height / (zoom / 100)
    });
  }

  function groupSelected() {
    if (selectedIds.length < 2) {
      return;
    }

    const selectedSet = new Set(selectedIds);

    const group = section(
      newId(),
      selectedNodes.map((item) => item),
      {
        paddingTop: DEFAULT_SECTION_PADDING,
        paddingRight: 40,
        paddingBottom: DEFAULT_SECTION_PADDING,
        paddingLeft: 40
      }
    );

    updatePage((page) => {
      const remaining = page.components.filter(
        (item) => !selectedSet.has(item.id)
      );

      return {
        ...page,
        components: [
          ...remaining,
          group
        ]
      };
    });

    setSelectedIds([group.id]);
  }

  function ungroupSelected() {
    if (
      selectedNodes.length !== 1 ||
      selectedNodes[0].type !== "section"
    ) {
      return;
    }

    const group = selectedNodes[0];

    updatePage((page) => {
      const removed = removeNode(
        page.components,
        group.id
      );

      if (!removed.removed) {
        return page;
      }

      return {
        ...page,
        components: [
          ...removed.nodes,
          ...(group.children ?? [])
        ]
      };
    });

    setSelectedIds(
      (group.children ?? []).map(
        (item) => item.id
      )
    );
  }

  function addPage() {
    const id = newId();

    const page: SitePage = {
      id,
      name: `Page ${site.pages.length + 1}`,
      slug: `/page-${site.pages.length + 1}`,
      margins: {
        top: 0,
        right: 32,
        bottom: 0,
        left: 32
      },
      styles: {
        background: "#ffffff"
      },
      components: []
    };

    setSite((current) => ({
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
    key: "top" | "right" | "bottom" | "left",
    value: number
  ) {
    updatePage((page) => ({
      ...page,
      margins: {
        ...page.margins,
        [key]: value
      }
    }));
  }

  function setNodeStyle(
    key: string,
    value: unknown
  ) {
    updateSelectedNodes((item) => ({
      ...item,
      styles: {
        ...(item.styles ?? {}),
        [key]: value
      }
    }));
  }

  function setNodeProp(
    key: string,
    value: unknown
  ) {
    updateSelectedNodes((item) => ({
      ...item,
      props: {
        ...item.props,
        [key]: value
      }
    }));
  }

  function alignSection(
    horizontal:
      | "left"
      | "center"
      | "right",
    vertical:
      | "top"
      | "center"
      | "bottom"
  ) {
    if (!selectedNode) {
      return;
    }

    if (selectedNode.type !== "section") {
      return;
    }

    const horizontalValue =
      horizontal === "left"
        ? "flex-start"
        : horizontal === "right"
          ? "flex-end"
          : "center";

    const verticalValue =
      vertical === "top"
        ? "flex-start"
        : vertical === "bottom"
          ? "flex-end"
          : "center";

    updatePage((page) => ({
      ...page,
      components: updateNode(
        page.components,
        selectedNode.id,
        (item) => ({
          ...item,
          styles: {
            ...(item.styles ?? {}),
            alignItems: horizontalValue,
            justifyContent: verticalValue
          }
        })
      )
    }));
  }

  const commonFontSize = (() => {
    if (!selectedNodes.length) {
      return "";
    }

    const values = selectedNodes
      .filter(
        (item) =>
          item.type === "heading" ||
          item.type === "text" ||
          item.type === "button"
      )
      .map((item) =>
        getStyleValue(item, "fontSize")
      );

    if (!values.length) {
      return "";
    }

    return values.every(
      (value) => value === values[0]
    )
      ? String(values[0] ?? "")
      : "";
  })();

  if (!activePage) {
    return null;
  }

  return (
    <div
      className={
        preview
          ? "editor preview-mode"
          : "editor"
      }
    >
      {!preview && (
        <>
          <header className="topbar">
            <div className="brand">
              Sytely
            </div>

            <div className="page-tabs">
              {site.pages.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  className={
                    page.id === activePageId
                      ? "page-tab active"
                      : "page-tab"
                  }
                  onClick={() => {
                    setActivePageId(page.id);
                    setSelectedIds([]);
                    setPageSelected(true);
                  }}
                >
                  {page.name}
                </button>
              ))}

              <button
                type="button"
                className="page-add"
                onClick={addPage}
              >
                +
              </button>
            </div>

            <div className="top-actions">
              <button
                type="button"
                onClick={() =>
                  setZoom(
                    Math.max(50, zoom - 10)
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
                    Math.min(150, zoom + 10)
                  )
                }
              >
                +
              </button>

              <button
                type="button"
                onClick={() =>
                  setPreview(true)
                }
              >
                Preview
              </button>
            </div>
          </header>

          <aside className="left-panel">
            <div className="panel-title">
              Components
            </div>

            <div className="component-group">
              <div className="group-title">
                Components
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
                  className="palette-item"
                  draggable
                  onDragStart={(event) =>
                    handlePaletteDragStart(
                      event,
                      {
                        kind: "component",
                        componentType: type
                      },
                      type
                    )
                  }
                >
                  <span>
                    {type === "section"
                      ? "Section"
                      : type[0].toUpperCase() +
                        type.slice(1)}
                  </span>
                  <span>+</span>
                </div>
              ))}
            </div>

            <div className="component-group">
              <div className="group-title">
                Sections
              </div>

              {templates.map((template) => (
                <div
                  key={template.id}
                  className="template-item"
                  draggable
                  onDragStart={(event) =>
                    handlePaletteDragStart(
                      event,
                      {
                        kind: "template",
                        templateId:
                          template.id
                      },
                      template.name
                    )
                  }
                >
                  {template.name}
                </div>
              ))}
            </div>
          </aside>
        </>
      )}

      <main
        className="canvas-area"
        ref={canvasRef}
        onPointerDown={startMarquee}
        onDragOver={handleCanvasDragOver}
        onDrop={(event) =>
          handleDrop(event)
        }
      >
        {preview ? (
          <div
            className="preview-page"
            style={{
              background:
                String(
                  activePage.styles
                    ?.background ??
                    "#fff"
                ),
              paddingTop:
                activePage.margins.top,
              paddingRight:
                activePage.margins.right,
              paddingBottom:
                activePage.margins.bottom,
              paddingLeft:
                activePage.margins.left
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
          <div
            className="canvas-scroll"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin:
                "top center"
            }}
          >
            <div
              className={
                pageSelected
                  ? "page-frame page-selected"
                  : "page-frame"
              }
              style={{
                background:
                  String(
                    activePage.styles
                      ?.background ??
                      "#fff"
                  ),
                paddingTop:
                  activePage.margins.top,
                paddingRight:
                  activePage.margins.right,
                paddingBottom:
                  activePage.margins.bottom,
                paddingLeft:
                  activePage.margins.left
              }}
            >
              {activePage.components.length ===
                0 && (
                <div className="empty-page">
                  Drag a component or section here
                </div>
              )}

              {activePage.components.map(
                (item) => (
                  <EditorNode
                    key={item.id}
                    nodeItem={item}
                    selectedIds={selectedIds}
                    dropTarget={dropTarget}
                    onSelect={select}
                    onDragStart={
                      handleNodeDragStart
                    }
                    onDragOver={
                      handleNodeDragOver
                    }
                    onDrop={handleDrop}
                    onDragEnd={() => {
                      setDropTarget(null);
                      setDragLabel(null);
                    }}
                    onResizeStart={
                      startResize
                    }
                    onDelete={deleteNode}
                  />
                )
              )}
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
              left: dragPoint.x + 14,
              top: dragPoint.y + 14
            }}
          >
            {dragLabel}
          </div>
        )}
      </main>

      {!preview && (
        <aside className="right-panel">
          <div className="inspector-header">
            Inspector
          </div>

          {pageSelected || !selectedNodes.length ? (
            <div className="inspector">
              <div className="inspector-section">
                <div className="inspector-title">
                  Page
                </div>

                <label>
                  Page name
                  <input
                    value={activePage.name}
                    onChange={(event) =>
                      updatePage((page) => ({
                        ...page,
                        name: event.target.value
                      }))
                    }
                  />
                </label>

                <label>
                  Background
                  <input
                    type="text"
                    value={String(
                      activePage.styles
                        ?.background ??
                        "#ffffff"
                    )}
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
                        activePage.margins[key]
                      }
                      onChange={(event) =>
                        updatePageMargin(
                          key,
                          Number(
                            event.target.value
                          )
                        )
                      }
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : selectedNodes.length > 1 ? (
            <div className="inspector">
              <div className="multi-selection">
                {selectedNodes.length} selected
              </div>

              <div className="inspector-section">
                <div className="inspector-title">
                  Alignment
                </div>

                <div className="alignment-grid">
                  <button
                    type="button"
                    onClick={() =>
                      setNodeStyle(
                        "alignSelf",
                        "flex-start"
                      )
                    }
                  >
                    Left
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNodeStyle(
                        "alignSelf",
                        "center"
                      )
                    }
                  >
                    Center
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNodeStyle(
                        "alignSelf",
                        "flex-end"
                      )
                    }
                  >
                    Right
                  </button>
                </div>
              </div>

              {commonFontSize && (
                <div className="inspector-section">
                  <div className="inspector-title">
                    Common text
                  </div>

                  <label>
                    Font size
                    <input
                      type="number"
                      value={commonFontSize}
                      onChange={(event) =>
                        setNodeStyle(
                          "fontSize",
                          Number(
                            event.target.value
                          )
                        )
                      }
                    />
                  </label>
                </div>
              )}

              <div className="inspector-section">
                <button
                  type="button"
                  className="full-button"
                  onClick={groupSelected}
                >
                  Group into section
                </button>
              </div>
            </div>
          ) : selectedNode ? (
            <div className="inspector">
              <div className="inspector-section">
                <div className="inspector-title">
                  {selectedNode.type}
                </div>

                <div className="readonly-type">
                  Type:{" "}
                  <strong>
                    {selectedNode.type}
                  </strong>
                </div>
              </div>

              {selectedNode.type ===
                "section" && (
                <>
                  <div className="inspector-section">
                    <div className="inspector-title">
                      Alignment
                    </div>

                    <div className="alignment-group">
                      <div>
                        <span>Horizontal</span>
                        <div className="alignment-grid">
                          <button
                            type="button"
                            onClick={() =>
                              setNodeStyle(
                                "alignItems",
                                "flex-start"
                              )
                            }
                          >
                            Left
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setNodeStyle(
                                "alignItems",
                                "center"
                              )
                            }
                          >
                            Center
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setNodeStyle(
                                "alignItems",
                                "flex-end"
                              )
                            }
                          >
                            Right
                          </button>
                        </div>
                      </div>

                      <div>
                        <span>Vertical</span>
                        <div className="alignment-grid">
                          <button
                            type="button"
                            onClick={() =>
                              setNodeStyle(
                                "justifyContent",
                                "flex-start"
                              )
                            }
                          >
                            Top
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setNodeStyle(
                                "justifyContent",
                                "center"
                              )
                            }
                          >
                            Center
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setNodeStyle(
                                "justifyContent",
                                "flex-end"
                              )
                            }
                          >
                            Bottom
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="inspector-section">
                    <div className="inspector-title">
                      Padding
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
                        {key
                          .replace(
                            "padding",
                            ""
                          )}
                        <input
                          type="number"
                          value={parseNumber(
                            getStyleValue(
                              selectedNode,
                              key
                            ),
                            key ===
                              "paddingTop" ||
                            key ===
                              "paddingBottom"
                              ? DEFAULT_SECTION_PADDING
                              : 40
                          )}
                          onChange={(event) =>
                            setNodeStyle(
                              key,
                              Number(
                                event.target.value
                              )
                            )
                          }
                        />
                      </label>
                    ))}
                  </div>

                  <div className="inspector-section">
                    <div className="inspector-title">
                      Appearance
                    </div>

                    <label>
                      Background
                      <input
                        type="text"
                        value={String(
                          getStyleValue(
                            selectedNode,
                            "background"
                          ) ?? "#ffffff"
                        )}
                        onChange={(event) =>
                          setNodeStyle(
                            "background",
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label>
                      Border radius
                      <input
                        type="number"
                        value={parseNumber(
                          getStyleValue(
                            selectedNode,
                            "borderRadius"
                          ),
                          0
                        )}
                        onChange={(event) =>
                          setNodeStyle(
                            "borderRadius",
                            Number(
                              event.target.value
                            )
                          )
                        }
                      />
                    </label>
                  </div>

                  <div className="inspector-section">
                    <button
                      type="button"
                      className="full-button"
                      onClick={ungroupSelected}
                      disabled={
                        !selectedNode.children?.length
                      }
                    >
                      Ungroup section
                    </button>
                  </div>
                </>
              )}

              {selectedNode.type ===
                "heading" && (
                <>
                  <div className="inspector-section">
                    <label>
                      Text
                      <textarea
                        value={String(
                          selectedNode.props
                            .text ?? ""
                        )}
                        onChange={(event) =>
                          setNodeProp(
                            "text",
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label>
                      Font size
                      <input
                        type="number"
                        value={parseNumber(
                          getStyleValue(
                            selectedNode,
                            "fontSize"
                          ),
                          32
                        )}
                        onChange={(event) =>
                          setNodeStyle(
                            "fontSize",
                            Number(
                              event.target.value
                            )
                          )
                        }
                      />
                    </label>

                    <label>
                      Weight
                      <select
                        value={String(
                          getStyleValue(
                            selectedNode,
                            "fontWeight"
                          ) ?? "700"
                        )}
                        onChange={(event) =>
                          setNodeStyle(
                            "fontWeight",
                            event.target.value
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
                  </div>
                </>
              )}

              {selectedNode.type ===
                "text" && (
                <div className="inspector-section">
                  <label>
                    Text
                    <textarea
                      value={String(
                        selectedNode.props
                          .text ?? ""
                      )}
                      onChange={(event) =>
                        setNodeProp(
                          "text",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Font size
                    <input
                      type="number"
                      value={parseNumber(
                        getStyleValue(
                          selectedNode,
                          "fontSize"
                        ),
                        16
                      )}
                      onChange={(event) =>
                        setNodeStyle(
                          "fontSize",
                          Number(
                            event.target.value
                          )
                        )
                      }
                    />
                  </label>
                </div>
              )}

              {selectedNode.type ===
                "button" && (
                <div className="inspector-section">
                  <label>
                    Text
                    <input
                      value={String(
                        selectedNode.props
                          .text ?? ""
                      )}
                      onChange={(event) =>
                        setNodeProp(
                          "text",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Font size
                    <input
                      type="number"
                      value={parseNumber(
                        getStyleValue(
                          selectedNode,
                          "fontSize"
                        ),
                        16
                      )}
                      onChange={(event) =>
                        setNodeStyle(
                          "fontSize",
                          Number(
                            event.target.value
                          )
                        )
                      }
                    />
                  </label>

                  <label>
                    Background
                    <input
                      type="text"
                      value={String(
                        getStyleValue(
                          selectedNode,
                          "background"
                        ) ?? "#111111"
                      )}
                      onChange={(event) =>
                        setNodeStyle(
                          "background",
                          event.target.value
                        )
                      }
                    />
                  </label>
                </div>
              )}

              {selectedNode.type ===
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
                          event.target.value
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
                          event.target.value
                        )
                      }
                    />
                  </label>
                </div>
              )}

              {selectedNode.type !==
                "section" && (
                <div className="inspector-section">
                  <div className="inspector-title">
                    Link
                  </div>

                  <label>
                    Page
                    <select
                      value={String(
                        selectedNode.props
                          .linkTo ?? ""
                      )}
                      onChange={(event) =>
                        setNodeProp(
                          "linkTo",
                          event.target.value
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
                  </label>
                </div>
              )}

              <div className="inspector-section">
                <button
                  type="button"
                  className="danger-button"
                  onClick={() =>
                    deleteNode(
                      selectedNode.id
                    )
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          ) : null}
        </aside>
      )}

      {preview && (
        <button
          type="button"
          className="exit-preview"
          onClick={() => setPreview(false)}
        >
          Exit preview
        </button>
      )}
    </div>
  );
}