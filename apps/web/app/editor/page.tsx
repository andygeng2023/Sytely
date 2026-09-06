"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type PointerEvent as ReactPointerEvent
} from "react";
import { renderNode } from "@sytely/renderer";
import type {
  ComponentNode,
  ComponentType,
  Site,
  SitePage,
  SiteTheme,
  SiteWorkspace
} from "@sytely/types";
import "./editor.css";

type Tool =
  | "components"
  | "templates"
  | "pages"
  | "layers";

type InspectorTab =
  | "design"
  | "layout"
  | "position";

type Device =
  | "desktop"
  | "tablet"
  | "mobile";

type DropPosition =
  | "before"
  | "after"
  | "inside";

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
      nodeIds: string[];
    };

interface DropTarget {
  id: string | null;
  position: DropPosition;
}

const SECTION_PAD = 56;

const uid = () =>
  typeof crypto !== "undefined" &&
  crypto.randomUUID
    ? crypto.randomUUID()
    : `node-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

function makeNode(
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

function makeSection(
  id: string,
  children: ComponentNode[] = [],
  styles: Record<string, unknown> = {}
): ComponentNode {
  return makeNode(
    id,
    "section",
    {},
    {
      paddingTop: SECTION_PAD,
      paddingRight: 40,
      paddingBottom: SECTION_PAD,
      paddingLeft: 40,
      background: "#fff",
      ...styles
    },
    children
  );
}

const starterSite = (): Site => ({
  id: uid(),
  name: "Untitled Website",
  version: 4,
  theme: "system",
  pages: [
    {
      id: uid(),
      name: "Home",
      slug: "/",
      margins: {
        top: 0,
        right: 0,
        bottom: 96,
        left: 0
      },
      styles: {
        background: "#fff"
      },
      components: [
        makeSection(uid(), [
          makeNode(
            uid(),
            "heading",
            {
              text: "Build something people remember"
            },
            {
              fontSize: 52,
              fontWeight: 750,
              textAlign: "center",
              alignSelf: "center"
            }
          ),
          makeNode(
            uid(),
            "text",
            {
              text: "Create polished websites visually without writing code."
            },
            {
              fontSize: 18,
              textAlign: "center",
              maxWidth: 680,
              alignSelf: "center"
            }
          ),
          makeNode(
            uid(),
            "button",
            {
              text: "Get started"
            },
            {
              background: "#111",
              color: "#fff",
              alignSelf: "center"
            }
          )
        ], {
          alignItems: "center"
        })
      ]
    }
  ]
});

const componentCatalog: {
  type: ComponentType;
  label: string;
  category: string;
  description: string;
}[] = [
  ["section", "Section", "Layout", "Page section"],
  ["heading", "Heading", "Basic", "Large text"],
  ["text", "Text", "Basic", "Paragraph"],
  ["button", "Button", "Basic", "Call to action"],
  ["image", "Image", "Media", "Image"],
  ["video", "Video", "Media", "Video"],
  ["gallery", "Gallery", "Media", "Image grid"],
  ["divider", "Divider", "Basic", "Separator"],
  ["icon", "Icon", "Basic", "Icon block"],
  ["logo", "Logo", "Navigation", "Brand"],
  ["menu", "Menu", "Navigation", "Navigation"],
  ["social", "Social links", "Navigation", "Social links"],
  ["form", "Form", "Forms", "Contact form"],
  ["card", "Card", "Layout", "Content card"],
  ["features", "Features", "Sections", "Feature grid"],
  ["pricing", "Pricing", "Sections", "Pricing"],
  ["testimonial", "Testimonial", "Sections", "Quote"],
  ["faq", "FAQ", "Sections", "Questions"],
  ["contact", "Contact", "Sections", "Contact"],
  ["footer", "Footer", "Sections", "Footer"]
].map(
  ([type, label, category, description]) => ({
    type: type as ComponentType,
    label,
    category,
    description
  })
);

const templates = [
  {
    id: "hero",
    name: "Hero",
    category: "Landing",
    node: makeSection("hero-template", [
      makeNode(
        "hero-heading",
        "heading",
        {
          text: "Build something people remember"
        },
        {
          fontSize: 52,
          fontWeight: 750,
          textAlign: "center"
        }
      ),
      makeNode(
        "hero-text",
        "text",
        {
          text: "A polished starting point for your next website."
        },
        {
          fontSize: 18,
          textAlign: "center",
          maxWidth: 680
        }
      ),
      makeNode(
        "hero-button",
        "button",
        {
          text: "Get started"
        },
        {
          background: "#111",
          color: "#fff"
        }
      )
    ], {
      alignItems: "center",
      gap: 20
    })
  },
  {
    id: "features",
    name: "Features",
    category: "SaaS",
    node: makeSection("features-template", [
      makeNode(
        "features-heading",
        "heading",
        {
          text: "Everything you need"
        },
        {
          fontSize: 40,
          fontWeight: 750,
          textAlign: "center"
        }
      ),
      makeNode("features-grid", "features")
    ], {
      alignItems: "center"
    })
  },
  {
    id: "pricing",
    name: "Pricing",
    category: "SaaS",
    node: makeSection("pricing-template", [
      makeNode(
        "pricing-heading",
        "heading",
        {
          text: "Simple pricing"
        },
        {
          fontSize: 40,
          fontWeight: 750,
          textAlign: "center"
        }
      ),
      makeNode("pricing-grid", "pricing")
    ], {
      alignItems: "center"
    })
  },
  {
    id: "portfolio",
    name: "Portfolio",
    category: "Portfolio",
    node: makeSection("portfolio-template", [
      makeNode(
        "portfolio-heading",
        "heading",
        {
          text: "Selected work"
        },
        {
          fontSize: 42,
          fontWeight: 750
        }
      ),
      makeNode("portfolio-gallery", "gallery")
    ])
  },
  {
    id: "contact",
    name: "Contact",
    category: "Business",
    node: makeSection("contact-template", [
      makeNode(
        "contact-heading",
        "heading",
        {
          text: "Let's talk"
        },
        {
          fontSize: 40,
          fontWeight: 750
        }
      ),
      makeNode("contact-details", "contact"),
      makeNode("contact-form", "form")
    ])
  }
];

function cloneIds(
  node: ComponentNode
): ComponentNode {
  return {
    ...node,
    id: uid(),
    props: { ...node.props },
    styles: { ...(node.styles ?? {}) },
    children: node.children?.map(cloneIds)
  };
}

function findNode(
  nodes: ComponentNode[],
  id: string
): ComponentNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;

    const result = findNode(
      node.children ?? [],
      id
    );

    if (result) return result;
  }

  return null;
}

function findParent(
  nodes: ComponentNode[],
  id: string,
  parent: ComponentNode | null = null
): ComponentNode | null {
  for (const node of nodes) {
    if (node.id === id) return parent;

    const result = findParent(
      node.children ?? [],
      id,
      node
    );

    if (result) return result;
  }

  return null;
}

function collect(
  nodes: ComponentNode[],
  result: ComponentNode[] = []
): ComponentNode[] {
  nodes.forEach((node) => {
    result.push(node);
    collect(node.children ?? [], result);
  });

  return result;
}

function contains(
  node: ComponentNode,
  id: string
): boolean {
  return (
    node.id === id ||
    (node.children ?? []).some((child) =>
      contains(child, id)
    )
  );
}

function updateTree(
  nodes: ComponentNode[],
  id: string,
  updater: (node: ComponentNode) => ComponentNode
): ComponentNode[] {
  return nodes.map((node) =>
    node.id === id
      ? updater(node)
      : {
          ...node,
          children: node.children
            ? updateTree(
                node.children,
                id,
                updater
              )
            : undefined
        }
  );
}

function removeTree(
  nodes: ComponentNode[],
  id: string
): ComponentNode[] {
  return nodes.flatMap((node) => {
    if (node.id === id) return [];

    return [
      {
        ...node,
        children: node.children
          ? removeTree(node.children, id)
          : undefined
      }
    ];
  });
}

function insertTree(
  nodes: ComponentNode[],
  targetId: string,
  item: ComponentNode,
  position: DropPosition
): ComponentNode[] {
  return nodes.flatMap((node) => {
    if (node.id === targetId) {
      if (position === "before") {
        return [item, node];
      }

      if (position === "after") {
        return [node, item];
      }

      return [
        {
          ...node,
          children: [
            ...(node.children ?? []),
            item
          ]
        }
      ];
    }

    return [
      {
        ...node,
        children: node.children
          ? insertTree(
              node.children,
              targetId,
              item,
              position
            )
          : undefined
      }
    ];
  });
}

function makeComponent(
  type: ComponentType
): ComponentNode {
  switch (type) {
    case "section":
      return makeSection(uid());

    case "heading":
      return makeNode(
        uid(),
        type,
        { text: "Heading" },
        {
          fontSize: 32,
          fontWeight: 700
        }
      );

    case "text":
      return makeNode(
        uid(),
        type,
        { text: "Add your text here." }
      );

    case "button":
      return makeNode(
        uid(),
        type,
        { text: "Button" },
        {
          background: "#111",
          color: "#fff"
        }
      );

    case "image":
      return makeNode(
        uid(),
        type,
        {
          src: "",
          alt: "Image"
        },
        {
          maxWidth: 520
        }
      );

    case "icon":
      return makeNode(
        uid(),
        type,
        { symbol: "✦" }
      );

    case "logo":
      return makeNode(
        uid(),
        type,
        { text: "Sytely" }
      );

    case "testimonial":
      return makeNode(
        uid(),
        type,
        {
          text: "A thoughtful testimonial from a happy customer."
        }
      );

    default:
      return makeNode(uid(), type);
  }
}

function EditorNode({
  node,
  selectedIds,
  dropTarget,
  onSelect,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onDelete,
  onResize
}: {
  node: ComponentNode;
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
    node: ComponentNode
  ) => void;
  onDrop: (
    event: DragEvent,
    node: ComponentNode
  ) => void;
  onDragEnd: () => void;
  onDelete: (id: string) => void;
  onResize: (
    event: ReactPointerEvent<HTMLDivElement>,
    id: string
  ) => void;
}) {
  const selected = selectedIds.includes(
    node.id
  );

  const children = node.children ?? [];

  const content =
    node.type === "section"
      ? renderNode(node, {
          children: children.length ? (
            children.map((child) => (
              <EditorNode
                key={child.id}
                node={child}
                selectedIds={selectedIds}
                dropTarget={dropTarget}
                onSelect={onSelect}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
                onDelete={onDelete}
                onResize={onResize}
              />
            ))
          ) : (
            <div className="empty-section">
              Drop components here
            </div>
          )
        })
      : renderNode(node, {
          renderChildren: false
        });

  const dropClass =
    dropTarget?.id === node.id
      ? `drop-${dropTarget.position}`
      : "";

  return (
    <div
      className={[
        "editor-node",
        node.type === "section"
          ? "section-node"
          : "component-node",
        selected ? "selected" : "",
        dropClass
      ]
        .filter(Boolean)
        .join(" ")}
      data-editor-node-id={node.id}
      draggable
      onDragStart={(event) => {
        event.stopPropagation();
        onDragStart(event, node.id);
      }}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDragOver(event, node);
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDrop(event, node);
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;

        event.stopPropagation();

        onSelect(
          node.id,
          event.shiftKey ||
            event.metaKey ||
            event.ctrlKey
        );
      }}
    >
      <div className="node-visual">
        {content}

        {node.type === "section" &&
          selected && (
            <div className="padding-overlay">
              <span>
                Padding
              </span>
            </div>
          )}
      </div>

      {selected && (
        <>
          <div className="node-label">
            {node.type}
          </div>

          <button
            className="node-delete"
            onPointerDown={(event) =>
              event.stopPropagation()
            }
            onClick={(event) => {
              event.stopPropagation();
              onDelete(node.id);
            }}
          >
            ×
          </button>

          <div
            className="resize-handle resize-right"
            onPointerDown={(event) =>
              onResize(event, node.id)
            }
          />

          <div
            className="resize-handle resize-bottom"
            onPointerDown={(event) =>
              onResize(event, node.id)
            }
          />

          <div
            className="resize-handle resize-corner"
            onPointerDown={(event) =>
              onResize(event, node.id)
            }
          />
        </>
      )}
    </div>
  );
}

export default function EditorPage() {
  const [workspace, setWorkspace] =
    useState<SiteWorkspace>(() => {
      const site = starterSite();

      return {
        version: 1,
        activeSiteId: site.id,
        sites: [site]
      };
    });

  const [activePageId, setActivePageId] =
    useState("");

  const [selectedIds, setSelectedIds] =
    useState<string[]>([]);

  const [pageSelected, setPageSelected] =
    useState(true);

  const [tool, setTool] =
    useState<Tool>("components");

  const [inspectorTab, setInspectorTab] =
    useState<InspectorTab>("design");

  const [device, setDevice] =
    useState<Device>("desktop");

  const [dropTarget, setDropTarget] =
    useState<DropTarget | null>(null);

  const [dragLabel, setDragLabel] =
    useState<string | null>(null);

  const [dragPoint, setDragPoint] =
    useState({ x: 0, y: 0 });

  const [zoom, setZoom] = useState(75);

  const [leftOpen, setLeftOpen] =
    useState(true);

  const [rightOpen, setRightOpen] =
    useState(true);

  const [saved, setSaved] =
    useState(true);

  const [marquee, setMarquee] =
    useState<{
      x: number;
      y: number;
      w: number;
      h: number;
    } | null>(null);

  const canvasRef =
    useRef<HTMLDivElement>(null);

  const activeSite =
    workspace.sites.find(
      (site) =>
        site.id === workspace.activeSiteId
    ) ?? workspace.sites[0];

  useEffect(() => {
    const raw =
      window.localStorage.getItem(
        "sytely-workspace"
      );

    if (raw) {
      try {
        const parsed =
          JSON.parse(raw) as SiteWorkspace;

        if (
          parsed.sites?.length &&
          parsed.activeSiteId
        ) {
          setWorkspace(parsed);
          return;
        }
      } catch {
        // Fall through to migration.
      }
    }

    const oldSite =
      window.localStorage.getItem(
        "sytely-site"
      );

    if (oldSite) {
      try {
        const site =
          JSON.parse(oldSite) as Site;

        const migrated: Site = {
          ...site,
          theme: site.theme ?? "system"
        };

        setWorkspace({
          version: 1,
          activeSiteId: migrated.id,
          sites: [migrated]
        });

        window.localStorage.setItem(
          "sytely-workspace",
          JSON.stringify({
            version: 1,
            activeSiteId: migrated.id,
            sites: [migrated]
          })
        );
      } catch {
        // Use starter site.
      }
    }
  }, []);

  useEffect(() => {
    if (!activeSite?.pages.length) return;

    if (
      !activeSite.pages.some(
        (page) => page.id === activePageId
      )
    ) {
      setActivePageId(
        activeSite.pages[0].id
      );
    }
  }, [activeSite, activePageId]);

  const activePage =
    activeSite?.pages.find(
      (page) => page.id === activePageId
    ) ?? activeSite?.pages[0];

  const allNodes = useMemo(
    () =>
      activePage
        ? collect(activePage.components)
        : [],
    [activePage]
  );

  const selectedNodes = allNodes.filter(
    (node) => selectedIds.includes(node.id)
  );

  const selectedNode =
    selectedNodes.length === 1
      ? selectedNodes[0]
      : null;

  function updateWorkspace(
    next: SiteWorkspace
  ) {
    setWorkspace(next);
    setSaved(false);
  }

  function updateSite(
    updater: (site: Site) => Site
  ) {
    updateWorkspace({
      ...workspace,
      sites: workspace.sites.map((site) =>
        site.id === activeSite.id
          ? updater(site)
          : site
      )
    });
  }

  function updatePage(
    updater: (page: SitePage) => SitePage
  ) {
    updateSite((site) => ({
      ...site,
      pages: site.pages.map((page) =>
        page.id === activePage.id
          ? updater(page)
          : page
      )
    }));
  }

  function updateNodeStyle(
    key: string,
    value: unknown
  ) {
    if (!selectedIds.length) return;

    updatePage((page) => ({
      ...page,
      components: selectedIds.reduce(
        (tree, id) =>
          updateTree(
            tree,
            id,
            (node) => ({
              ...node,
              styles: {
                ...(node.styles ?? {}),
                [key]: value
              }
            })
          ),
        page.components
      )
    }));
  }

  function updateNodeProp(
    key: string,
    value: unknown
  ) {
    if (!selectedIds.length) return;

    updatePage((page) => ({
      ...page,
      components: selectedIds.reduce(
        (tree, id) =>
          updateTree(
            tree,
            id,
            (node) => ({
              ...node,
              props: {
                ...node.props,
                [key]: value
              }
            })
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

  function makeComponentAndInsert(
    type: ComponentType
  ) {
    if (!activePage) return;

    const item = makeComponent(type);

    let components =
      activePage.components;

    if (pageSelected) {
      if (item.type !== "section") {
        components = [
          ...components,
          makeSection(uid(), [item])
        ];
      } else {
        components = [
          ...components,
          item
        ];
      }
    } else if (selectedNode) {
      if (
        selectedNode.type === "section"
      ) {
        components = insertTree(
          components,
          selectedNode.id,
          item,
          item.type === "section"
            ? "after"
            : "inside"
        );
      } else {
        const parent = findParent(
          components,
          selectedNode.id
        );

        if (parent?.type === "section") {
          components = insertTree(
            components,
            parent.id,
            item,
            item.type === "section"
              ? "after"
              : "inside"
          );
        }
      }
    } else {
      const section =
        components.find(
          (node) =>
            node.type === "section"
        );

      components = section
        ? insertTree(
            components,
            section.id,
            item,
            "inside"
          )
        : [
            ...components,
            makeSection(uid(), [item])
          ];
    }

    updatePage((page) => ({
      ...page,
      components
    }));

    setSelectedIds([item.id]);
    setPageSelected(false);
  }

  function readPayload(
    event: DragEvent
  ): DragPayload | null {
    const raw =
      event.dataTransfer.getData(
        "application/x-sytely"
      );

    if (!raw) return null;

    try {
      return JSON.parse(raw) as DragPayload;
    } catch {
      return null;
    }
  }

  function startPaletteDrag(
    event: DragEvent,
    payload: DragPayload,
    label: string
  ) {
    event.dataTransfer.effectAllowed =
      payload.kind === "node"
        ? "move"
        : "copy";

    event.dataTransfer.setData(
      "application/x-sytely",
      JSON.stringify(payload)
    );

    setDragLabel(label);
  }

  function startNodeDrag(
    event: DragEvent,
    id: string
  ) {
    const ids =
      selectedIds.includes(id)
        ? selectedIds
        : [id];

    startPaletteDrag(
      event,
      {
        kind: "node",
        nodeIds: ids
      },
      ids.length > 1
        ? `${ids.length} items`
        : "Move"
    );
  }

  function getDropPosition(
    event: DragEvent,
    node: ComponentNode
  ): DropPosition {
    const rect =
      event.currentTarget.getBoundingClientRect();

    const ratio =
      (event.clientY - rect.top) /
      Math.max(rect.height, 1);

    if (node.type === "section") {
      if (ratio < 0.18) return "before";
      if (ratio > 0.82) return "after";
      return "inside";
    }

    return ratio < 0.5
      ? "before"
      : "after";
  }

  function handleDragOver(
    event: DragEvent,
    node: ComponentNode
  ) {
    const payload = readPayload(event);

    if (!payload) return;

    const position =
      getDropPosition(event, node);

    if (
      payload.kind === "node" &&
      payload.nodeIds.some(
        (id) =>
          id === node.id ||
          Boolean(
            findNode(
              activePage.components,
              id
            ) &&
              contains(
                findNode(
                  activePage.components,
                  id
                )!,
                node.id
              )
          )
      )
    ) {
      return;
    }

    if (
      position === "inside" &&
      node.type !== "section"
    ) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect =
      payload.kind === "node"
        ? "move"
        : "copy";

    setDropTarget({
      id: node.id,
      position
    });

    setDragPoint({
      x: event.clientX,
      y: event.clientY
    });
  }

  function handleDrop(
    event: DragEvent,
    target?: ComponentNode
  ) {
    event.preventDefault();

    const payload = readPayload(event);

    if (!payload) return;

    const effectiveTarget =
      target ??
      (dropTarget?.id
        ? findNode(
            activePage.components,
            dropTarget.id
          )
        : null);

    const position = target
      ? getDropPosition(event, target)
      : dropTarget?.position ?? "after";

    let components =
      activePage.components;

    if (payload.kind === "component") {
      const item = makeComponent(
        payload.componentType
      );

      components = effectiveTarget
        ? insertTree(
            components,
            effectiveTarget.id,
            item,
            position
          )
        : [
            ...components,
            item.type === "section"
              ? item
              : makeSection(uid(), [item])
          ];

      updatePage((page) => ({
        ...page,
        components
      }));

      setSelectedIds([item.id]);
      setPageSelected(false);
    }

    if (payload.kind === "template") {
      const template =
        templates.find(
          (item) =>
            item.id ===
            payload.templateId
        );

      if (template) {
        const item = cloneIds(
          template.node
        );

        components = effectiveTarget
          ? insertTree(
              components,
              effectiveTarget.id,
              item,
              position
            )
          : [
              ...components,
              item
            ];

        updatePage((page) => ({
          ...page,
          components
        }));

        setSelectedIds([item.id]);
        setPageSelected(false);
      }
    }

    if (payload.kind === "node") {
      const moving = payload.nodeIds
        .map((id) =>
          findNode(
            activePage.components,
            id
          )
        )
        .filter(
          Boolean
        ) as ComponentNode[];

      if (
        effectiveTarget &&
        moving.length &&
        !moving.some((item) =>
          contains(
            item,
            effectiveTarget.id
          )
        )
      ) {
        for (const item of moving) {
          components = removeTree(
            components,
            item.id
          );
        }

        components = effectiveTarget
          ? moving.reduce(
              (tree, item) =>
                insertTree(
                  tree,
                  effectiveTarget.id,
                  item,
                  position
                ),
              components
            )
          : components;

        updatePage((page) => ({
          ...page,
          components
        }));

        setSelectedIds(
          moving.map(
            (item) => item.id
          )
        );
      }
    }

    setDropTarget(null);
    setDragLabel(null);
  }

  function deleteNode(id: string) {
    updatePage((page) => ({
      ...page,
      components: removeTree(
        page.components,
        id
      )
    }));

    setSelectedIds((current) =>
      current.filter(
        (item) => item !== id
      )
    );

    setPageSelected(
      selectedIds.length <= 1
    );
  }

  function deleteSelected() {
    if (!selectedIds.length) return;

    updatePage((page) => ({
      ...page,
      components: selectedIds.reduce(
        (tree, id) =>
          removeTree(tree, id),
        page.components
      )
    }));

    setSelectedIds([]);
    setPageSelected(true);
  }

  function duplicateSelected() {
    if (!selectedNodes.length) return;

    let components =
      activePage.components;

    const clones =
      selectedNodes.map(cloneIds);

    selectedNodes.forEach(
      (node, index) => {
        const parent = findParent(
          components,
          node.id
        );

        components = insertTree(
          components,
          parent?.id ?? node.id,
          clones[index],
          "after"
        );
      }
    );

    updatePage((page) => ({
      ...page,
      components
    }));

    setSelectedIds(
      clones.map((node) => node.id)
    );
  }

  function addSite() {
    const site = starterSite();

    updateWorkspace({
      ...workspace,
      activeSiteId: site.id,
      sites: [
        ...workspace.sites,
        site
      ]
    });

    setActivePageId(
      site.pages[0].id
    );
    setSelectedIds([]);
    setPageSelected(true);
  }

  function save() {
    window.localStorage.setItem(
      "sytely-workspace",
      JSON.stringify(workspace)
    );

    window.localStorage.setItem(
      "sytely-site",
      JSON.stringify(activeSite)
    );

    setSaved(true);
  }

  function updateTheme(
    theme: SiteTheme
  ) {
    updateSite((site) => ({
      ...site,
      theme
    }));
  }

  function startMarquee(
    event: ReactPointerEvent<HTMLDivElement>
  ) {
    if (event.button !== 0) return;

    if (
      (event.target as HTMLElement).closest(
        ".editor-node,.floating-toolbar,.canvas-controls,.library-panel,.right-panel,.left-rail,.right-rail,.topbar"
      )
    ) {
      return;
    }

    const startX = event.clientX;
    const startY = event.clientY;

    setSelectedIds([]);
    setPageSelected(false);

    const move = (pointer: PointerEvent) => {
      setMarquee({
        x: Math.min(
          startX,
          pointer.clientX
        ),
        y: Math.min(
          startY,
          pointer.clientY
        ),
        w: Math.abs(
          pointer.clientX - startX
        ),
        h: Math.abs(
          pointer.clientY - startY
        )
      });
    };

    const up = (pointer: PointerEvent) => {
      const left = Math.min(
        startX,
        pointer.clientX
      );

      const right = Math.max(
        startX,
        pointer.clientX
      );

      const top = Math.min(
        startY,
        pointer.clientY
      );

      const bottom = Math.max(
        startY,
        pointer.clientY
      );

      if (
        right - left > 6 ||
        bottom - top > 6
      ) {
        const ids = allNodes
          .filter((node) => {
            const element =
              document.querySelector<HTMLElement>(
                `[data-editor-node-id="${node.id}"]`
              );

            if (!element) return false;

            const rect =
              element.getBoundingClientRect();

            return (
              rect.left < right &&
              rect.right > left &&
              rect.top < bottom &&
              rect.bottom > top
            );
          })
          .map(
            (node) => node.id
          );

        setSelectedIds(ids);
        setPageSelected(false);
      } else {
        setSelectedIds([]);
        setPageSelected(true);
      }

      setMarquee(null);

      window.removeEventListener(
        "pointermove",
        move
      );

      window.removeEventListener(
        "pointerup",
        up
      );
    };

    window.addEventListener(
      "pointermove",
      move
    );

    window.addEventListener(
      "pointerup",
      up
    );
  }

  if (!activeSite || !activePage) {
    return null;
  }

  return (
    <div className="editor-shell">
      <header className="topbar">
        <div className="top-left">
          <a
            className="editor-brand"
            href="/"
          >
            Sytely
          </a>

          <select
            className="site-switcher"
            value={activeSite.id}
            onChange={(event) => {
              const id =
                event.target.value;

              const site =
                workspace.sites.find(
                  (item) =>
                    item.id === id
                );

              if (!site) return;

              setWorkspace({
                ...workspace,
                activeSiteId: id
              });

              setActivePageId(
                site.pages[0]?.id ?? ""
              );

              setSelectedIds([]);
              setPageSelected(true);
            }}
          >
            {workspace.sites.map(
              (site) => (
                <option
                  key={site.id}
                  value={site.id}
                >
                  {site.name}
                </option>
              )
            )}
          </select>

          <button
            className="new-site"
            onClick={addSite}
          >
            + Website
          </button>

          <div className="page-tabs">
            {activeSite.pages.map(
              (page) => (
                <button
                  key={page.id}
                  className={
                    page.id ===
                    activePage.id
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    setActivePageId(
                      page.id
                    );
                    setSelectedIds([]);
                    setPageSelected(true);
                  }}
                >
                  {page.name}
                </button>
              )
            )}
          </div>
        </div>

        <div className="top-center">
          {(
            [
              "desktop",
              "tablet",
              "mobile"
            ] as Device[]
          ).map((item) => (
            <button
              key={item}
              className={
                device === item
                  ? "active"
                  : ""
              }
              onClick={() =>
                setDevice(item)
              }
            >
              {item[0].toUpperCase() +
                item.slice(1)}
            </button>
          ))}
        </div>

        <div className="top-right">
          <span className="save-state">
            {saved ? "Saved" : "Unsaved"}
          </span>

          <button
            onClick={() =>
              setZoom(
                Math.max(
                  50,
                  zoom - 5
                )
              )
            }
          >
            −
          </button>

          <span className="zoom">
            {zoom}%
          </span>

          <button
            onClick={() =>
              setZoom(
                Math.min(
                  120,
                  zoom + 5
                )
              )
            }
          >
            +
          </button>

          <button
            className="secondary-action"
            onClick={save}
          >
            Save
          </button>

          <a
            className="secondary-action"
            href={`/preview?site=${encodeURIComponent(
              activeSite.id
            )}&page=${encodeURIComponent(
              activePage.slug
            )}`}
            target="_blank"
          >
            Preview
          </a>

          <button
            className="publish-action"
            onClick={save}
          >
            Publish
          </button>
        </div>
      </header>

      <div
        className={[
          "workspace",
          leftOpen
            ? "left-open"
            : "left-collapsed",
          rightOpen
            ? "right-open"
            : "right-collapsed"
        ].join(" ")}
      >
        <aside className="left-rail">
          {(
            [
              "components",
              "templates",
              "pages",
              "layers"
            ] as Tool[]
          ).map((item) => (
            <button
              key={item}
              className={
                tool === item
                  ? "active"
                  : ""
              }
              onClick={() => {
                setTool(item);
                setLeftOpen(true);
              }}
            >
              <span>
                {item === "components"
                  ? "+"
                  : item === "templates"
                    ? "▦"
                    : item === "pages"
                      ? "□"
                      : "☷"}
              </span>
              {item[0].toUpperCase() +
                item.slice(1)}
            </button>
          ))}
        </aside>

        {leftOpen && (
          <aside className="library-panel">
            <div className="panel-header">
              <div>
                <strong>
                  {tool[0].toUpperCase() +
                    tool.slice(1)}
                </strong>
                <small>
                  {tool === "components"
                    ? "Add building blocks"
                    : "Website structure"}
                </small>
              </div>

              <button
                onClick={() =>
                  setLeftOpen(false)
                }
              >
                ‹
              </button>
            </div>

            <div className="panel-scroll">
              {tool ===
                "components" && (
                <>
                  {[
                    ...new Set(
                      componentCatalog.map(
                        (item) =>
                          item.category
                      )
                    )
                  ].map(
                    (category) => (
                      <section
                        className="catalog-group"
                        key={category}
                      >
                        <h4>
                          {category}
                        </h4>

                        {componentCatalog
                          .filter(
                            (item) =>
                              item.category ===
                              category
                          )
                          .map(
                            (
                              component
                            ) => (
                              <button
                                className="catalog-item"
                                key={
                                  component.type
                                }
                                draggable
                                onDragStart={(
                                  event
                                ) =>
                                  startPaletteDrag(
                                    event,
                                    {
                                      kind: "component",
                                      componentType:
                                        component.type
                                    },
                                    component.label
                                  )
                                }
                                onClick={() =>
                                  makeComponentAndInsert(
                                    component.type
                                  )
                                }
                              >
                                <span className="catalog-icon">
                                  {component.type ===
                                  "heading"
                                    ? "H"
                                    : component.type ===
                                        "text"
                                      ? "T"
                                      : component.type ===
                                          "image"
                                        ? "▧"
                                        : "+"}
                                </span>

                                <span>
                                  <b>
                                    {
                                      component.label
                                    }
                                  </b>
                                  <small>
                                    {
                                      component.description
                                    }
                                  </small>
                                </span>
                              </button>
                            )
                          )}
                      </section>
                    )
                  )}
                </>
              )}

              {tool ===
                "templates" && (
                <div className="template-grid">
                  {templates.map(
                    (template) => (
                      <button
                        key={template.id}
                        className="template-card"
                        draggable
                        onDragStart={(
                          event
                        ) =>
                          startPaletteDrag(
                            event,
                            {
                              kind: "template",
                              templateId:
                                template.id
                            },
                            template.name
                          )
                        }
                        onClick={() => {
                          const item =
                            cloneIds(
                              template.node
                            );

                          updatePage(
                            (page) => ({
                              ...page,
                              components:
                                [
                                  ...page.components,
                                  item
                                ]
                            })
                          );

                          setSelectedIds([
                            item.id
                          ]);
                          setPageSelected(
                            false
                          );
                        }}
                      >
                        <div className="template-thumb">
                          <span />
                          <span />
                          <span />
                        </div>
                        <b>
                          {template.name}
                        </b>
                        <small>
                          {template.category}
                        </small>
                      </button>
                    )
                  )}
                </div>
              )}

              {tool === "pages" && (
                <div className="page-list">
                  {activeSite.pages.map(
                    (page) => (
                      <button
                        key={page.id}
                        className={
                          page.id ===
                          activePage.id
                            ? "selected"
                            : ""
                        }
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
                        <b>
                          {page.name}
                        </b>
                        <small>
                          {page.slug}
                        </small>
                      </button>
                    )
                  )}
                </div>
              )}

              {tool === "layers" && (
                <div className="layer-list">
                  {allNodes.map(
                    (node) => (
                      <button
                        key={node.id}
                        className={
                          selectedIds.includes(
                            node.id
                          )
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          select(
                            node.id,
                            false
                          )
                        }
                      >
                        {node.type}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </aside>
        )}

        <main
          className="canvas-area"
          ref={canvasRef}
          onPointerDown={
            startMarquee
          }
          onDragOver={(event) => {
            event.preventDefault();

            setDragPoint({
              x: event.clientX,
              y: event.clientY
            });
          }}
          onDrop={(event) =>
            handleDrop(event)
          }
        >
          <div className="canvas-controls">
            <button
              onClick={() =>
                setZoom(
                  Math.max(
                    50,
                    zoom - 5
                  )
                )
              }
            >
              −
            </button>

            <span>{zoom}%</span>

            <button
              onClick={() =>
                setZoom(
                  Math.min(
                    120,
                    zoom + 5
                  )
                )
              }
            >
              +
            </button>
          </div>

          <div
            className="canvas-scroll"
            style={{
              transform: `scale(${
                zoom / 100
              })`
            }}
          >
            <div
              className={`page-frame device-${device}`}
              style={{
                background: String(
                  activePage.styles
                    ?.background ??
                    "#fff"
                ),
                paddingTop:
                  activePage.margins
                    .top,
                paddingRight:
                  activePage.margins
                    .right,
                paddingBottom:
                  activePage.margins
                    .bottom,
                paddingLeft:
                  activePage.margins
                    .left
              }}
              onDragOver={(event) => {
                event.preventDefault();

                if (!dropTarget) {
                  setDropTarget({
                    id: null,
                    position:
                      "inside"
                  });
                }
              }}
            >
              {activePage.components.map(
                (node) => (
                  <EditorNode
                    key={node.id}
                    node={node}
                    selectedIds={
                      selectedIds
                    }
                    dropTarget={
                      dropTarget
                    }
                    onSelect={
                      select
                    }
                    onDragStart={
                      startNodeDrag
                    }
                    onDragOver={
                      handleDragOver
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
                    onDelete={
                      deleteNode
                    }
                    onResize={() => {}}
                  />
                )
              )}

              <div className="page-bottom-space" />
            </div>
          </div>

          {dragLabel && (
            <div
              className="drag-ghost"
              style={{
                left:
                  dragPoint.x + 14,
                top:
                  dragPoint.y + 14
              }}
            >
              {dragLabel}
            </div>
          )}

          {dropTarget && (
            <div
              className="global-drop-indicator"
              style={{
                left:
                  dragPoint.x + 10,
                top:
                  dragPoint.y + 10
              }}
            >
              {dropTarget.position ===
              "inside"
                ? "Drop inside"
                : "Insert here"}
            </div>
          )}

          {marquee && (
            <div
              className="marquee"
              style={{
                left: marquee.x,
                top: marquee.y,
                width: marquee.w,
                height: marquee.h
              }}
            />
          )}

          {selectedNodes.length >
            0 && (
            <div className="floating-toolbar">
              <button
                onClick={
                  duplicateSelected
                }
              >
                Duplicate
              </button>

              <button
                onClick={() => {
                  // Grouping is handled by
                  // the existing section model.
                  if (
                    selectedNodes.length <
                    2
                  )
                    return;

                  const parent =
                    findParent(
                      activePage.components,
                      selectedNodes[0]
                        .id
                    );

                  if (
                    !selectedNodes.every(
                      (node) =>
                        findParent(
                          activePage.components,
                          node.id
                        )?.id ===
                        parent?.id
                    )
                  ) {
                    return;
                  }

                  const group =
                    makeSection(
                      uid(),
                      selectedNodes
                    );

                  updatePage(
                    (page) => ({
                      ...page,
                      components:
                        parent
                          ? updateTree(
                              page.components,
                              parent.id,
                              (
                                parentNode
                              ) => ({
                                ...parentNode,
                                children:
                                  [
                                    group,
                                    ...(parentNode.children ??
                                      []).filter(
                                      (
                                        child
                                      ) =>
                                        !selectedIds.includes(
                                          child.id
                                        )
                                    )
                                  ]
                              })
                            )
                          : [
                              group,
                              ...page.components.filter(
                                (
                                  node
                                ) =>
                                  !selectedIds.includes(
                                    node.id
                                  )
                              )
                            ]
                    })
                  );

                  setSelectedIds([
                    group.id
                  ]);
                }}
                disabled={
                  selectedNodes.length <
                  2
                }
              >
                Group
              </button>

              <button
                onClick={
                  deleteSelected
                }
              >
                Delete
              </button>
            </div>
          )}
        </main>

        {rightOpen && (
          <aside className="right-panel">
            <div className="panel-header">
              <div>
                <strong>
                  {pageSelected
                    ? "Page"
                    : selectedNodes.length
                      ? `${selectedNodes.length} selected`
                      : "Inspector"}
                </strong>
                <small>
                  Properties
                </small>
              </div>

              <button
                onClick={() =>
                  setRightOpen(false)
                }
              >
                ›
              </button>
            </div>

            {pageSelected ? (
              <PageInspector
                site={activeSite}
                page={activePage}
                updateSite={updateSite}
                updatePage={
                  updatePage
                }
                updateTheme={
                  updateTheme
                }
              />
            ) : selectedNode ? (
              <NodeInspector
                node={selectedNode}
                tab={inspectorTab}
                updateStyle={
                  updateNodeStyle
                }
                updateProp={
                  updateNodeProp
                }
                onDelete={
                  deleteSelected
                }
              />
            ) : (
              <div className="inspector-empty">
                Select an element.
              </div>
            )}
          </aside>
        )}

        <aside className="right-rail">
          {(
            [
              "design",
              "layout",
              "position"
            ] as InspectorTab[]
          ).map((item) => (
            <button
              key={item}
              className={
                inspectorTab === item
                  ? "active"
                  : ""
              }
              onPointerDown={(event) =>
                event.stopPropagation()
              }
              onClick={(event) => {
                event.stopPropagation();
                setInspectorTab(item);
                setRightOpen(true);
              }}
            >
              <span>
                {item === "design"
                  ? "◈"
                  : item === "layout"
                    ? "▤"
                    : "↔"}
              </span>
              {item[0].toUpperCase() +
                item.slice(1)}
            </button>
          ))}

          <button
            className="rail-collapse"
            onClick={() =>
              setRightOpen(
                (current) => !current
              )
            }
          >
            {rightOpen ? "›" : "‹"}
          </button>
        </aside>
      </div>
    </div>
  );
}

function PageInspector({
  site,
  page,
  updateSite,
  updatePage,
  updateTheme
}: {
  site: Site;
  page: SitePage;
  updateSite: (
    updater: (site: Site) => Site
  ) => void;
  updatePage: (
    updater: (page: SitePage) => SitePage
  ) => void;
  updateTheme: (
    theme: SiteTheme
  ) => void;
}) {
  return (
    <div className="inspector-body">
      <div className="inspector-card">
        <h4>Page design</h4>

        <label>
          Page name
          <input
            value={page.name}
            onChange={(event) =>
              updatePage(
                (current) => ({
                  ...current,
                  name: event.target.value
                })
              )
            }
          />
        </label>

        <label>
          URL slug
          <input
            value={page.slug}
            onChange={(event) =>
              updatePage(
                (current) => ({
                  ...current,
                  slug: event.target.value
                })
              )
            }
          />
        </label>

        <label>
          Background
          <input
            value={String(
              page.styles
                ?.background ??
                "#fff"
            )}
            onChange={(event) =>
              updatePage(
                (current) => ({
                  ...current,
                  styles: {
                    ...(current.styles ??
                      {}),
                    background:
                      event.target
                        .value
                  }
                })
              )
            }
          />
        </label>
      </div>

      <div className="inspector-card">
        <h4>Website appearance</h4>

        <label>
          Color mode
          <select
            value={site.theme}
            onChange={(event) =>
              updateTheme(
                event.target
                  .value as SiteTheme
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

        <p className="inspector-help">
          System follows the visitor's
          device preference. This setting
          applies to the website, not the
          editor chrome.
        </p>
      </div>

      <div className="inspector-card">
        <h4>Page spacing</h4>

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
              value={page.margins[key]}
              onChange={(event) =>
                updatePage(
                  (current) => ({
                    ...current,
                    margins: {
                      ...current.margins,
                      [key]: Number(
                        event.target
                          .value
                      )
                    }
                  })
                )
              }
            />
          </label>
        ))}
      </div>

      <div className="inspector-card">
        <h4>Website</h4>

        <label>
          Website name
          <input
            value={site.name}
            onChange={(event) =>
              updateSite((current) => ({
                ...current,
                name: event.target.value
              }))
            }
          />
        </label>
      </div>
    </div>
  );
}

function NodeInspector({
  node,
  tab,
  updateStyle,
  updateProp,
  onDelete
}: {
  node: ComponentNode;
  tab: InspectorTab;
  updateStyle: (
    key: string,
    value: unknown
  ) => void;
  updateProp: (
    key: string,
    value: unknown
  ) => void;
  onDelete: () => void;
}) {
  const styles = node.styles ?? {};

  return (
    <div className="inspector-body">
      <div className="inspector-card readonly">
        <h4>Element</h4>

        <div className="readonly-row">
          <span>Type</span>
          <b>{node.type}</b>
        </div>
      </div>

      {tab === "design" && (
        <>
          {(node.type ===
            "heading" ||
            node.type === "text" ||
            node.type ===
              "button") && (
            <div className="inspector-card">
              <h4>Content</h4>

              <label>
                Text
                {node.type ===
                "text" ||
                node.type ===
                  "heading" ? (
                  <textarea
                    value={String(
                      node.props
                        .text ?? ""
                    )}
                    onChange={(event) =>
                      updateProp(
                        "text",
                        event.target
                          .value
                      )
                    }
                  />
                ) : (
                  <input
                    value={String(
                      node.props
                        .text ?? ""
                    )}
                    onChange={(event) =>
                      updateProp(
                        "text",
                        event.target
                          .value
                      )
                    }
                  />
                )}
              </label>
            </div>
          )}

          <div className="inspector-card">
            <h4>Appearance</h4>

            <label>
              Background
              <input
                value={String(
                  styles.background ??
                    ""
                )}
                onChange={(event) =>
                  updateStyle(
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
                value={Number(
                  styles.borderRadius ??
                    0
                )}
                onChange={(event) =>
                  updateStyle(
                    "borderRadius",
                    Number(
                      event.target
                        .value
                    )
                  )
                }
              />
            </label>

            {node.type !==
              "section" && (
              <label>
                Color
                <input
                  value={String(
                    styles.color ??
                      ""
                  )}
                  onChange={(event) =>
                    updateStyle(
                      "color",
                      event.target
                        .value
                    )
                  }
                />
              </label>
            )}
          </div>

          {(node.type ===
            "heading" ||
            node.type ===
              "text" ||
            node.type ===
              "button") && (
            <div className="inspector-card">
              <h4>Typography</h4>

              <label>
                Font size
                <input
                  type="number"
                  value={Number(
                    styles.fontSize ??
                      (node.type ===
                      "heading"
                        ? 32
                        : 16)
                  )}
                  onChange={(event) =>
                    updateStyle(
                      "fontSize",
                      Number(
                        event.target
                          .value
                      )
                    )
                  }
                />
              </label>

              <label>
                Text align
                <select
                  value={String(
                    styles.textAlign ??
                      "left"
                  )}
                  onChange={(event) =>
                    updateStyle(
                      "textAlign",
                      event.target
                        .value
                    )
                  }
                >
                  <option value="left">
                    Left
                  </option>
                  <option value="center">
                    Center
                  </option>
                  <option value="right">
                    Right
                  </option>
                </select>
              </label>
            </div>
          )}
        </>
      )}

      {tab === "layout" && (
        <>
          <div className="inspector-card">
            <h4>Size</h4>

            <label>
              Width
              <input
                value={String(
                  styles.width ?? ""
                )}
                onChange={(event) =>
                  updateStyle(
                    "width",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Height
              <input
                value={String(
                  styles.height ?? ""
                )}
                onChange={(event) =>
                  updateStyle(
                    "height",
                    event.target.value
                  )
                }
              />
            </label>
          </div>

          <div className="inspector-card">
            <h4>Alignment</h4>

            <div className="alignment-grid">
              <button
                type="button"
                onPointerDown={(event) =>
                  event.stopPropagation()
                }
                onClick={(event) => {
                  event.stopPropagation();
                  updateStyle(
                    "alignItems",
                    "flex-start"
                  );
                }}
              >
                ←
              </button>

              <button
                type="button"
                onPointerDown={(event) =>
                  event.stopPropagation()
                }
                onClick={(event) => {
                  event.stopPropagation();
                  updateStyle(
                    "alignItems",
                    "center"
                  );
                }}
              >
                ↔
              </button>

              <button
                type="button"
                onPointerDown={(event) =>
                  event.stopPropagation()
                }
                onClick={(event) => {
                  event.stopPropagation();
                  updateStyle(
                    "alignItems",
                    "flex-end"
                  );
                }}
              >
                →
              </button>

              <button
                type="button"
                onPointerDown={(event) =>
                  event.stopPropagation()
                }
                onClick={(event) => {
                  event.stopPropagation();
                  updateStyle(
                    "justifyContent",
                    "flex-start"
                  );
                }}
              >
                ↑
              </button>

              <button
                type="button"
                onPointerDown={(event) =>
                  event.stopPropagation()
                }
                onClick={(event) => {
                  event.stopPropagation();
                  updateStyle(
                    "justifyContent",
                    "center"
                  );
                }}
              >
                ↕
              </button>

              <button
                type="button"
                onPointerDown={(event) =>
                  event.stopPropagation()
                }
                onClick={(event) => {
                  event.stopPropagation();
                  updateStyle(
                    "justifyContent",
                    "flex-end"
                  );
                }}
              >
                ↓
              </button>
            </div>
          </div>

          <div className="inspector-card">
            <h4>Spacing</h4>

            <label>
              Gap
              <input
                type="number"
                value={Number(
                  styles.gap ?? 20
                )}
                onChange={(event) =>
                  updateStyle(
                    "gap",
                    Number(
                      event.target.value
                    )
                  )
                }
              />
            </label>

            <label>
              Padding
              <input
                value={String(
                  styles.padding ?? ""
                )}
                onChange={(event) =>
                  updateStyle(
                    "padding",
                    event.target.value
                  )
                }
              />
            </label>
          </div>
        </>
      )}

      {tab === "position" && (
        <div className="inspector-card">
          <h4>Position</h4>

          <label>
            Position
            <select
              value={String(
                styles.position ??
                  "relative"
              )}
              onChange={(event) =>
                updateStyle(
                  "position",
                  event.target.value
                )
              }
            >
              <option value="relative">
                Relative
              </option>
              <option value="absolute">
                Absolute
              </option>
            </select>
          </label>

          <label>
            Top
            <input
              value={String(
                styles.top ?? ""
              )}
              onChange={(event) =>
                updateStyle(
                  "top",
                  event.target.value
                )
              }
            />
          </label>

          <label>
            Left
            <input
              value={String(
                styles.left ?? ""
              )}
              onChange={(event) =>
                updateStyle(
                  "left",
                  event.target.value
                )
              }
            />
          </label>
        </div>
      )}

      <div className="inspector-card">
        <button
          className="danger-button"
          onClick={onDelete}
        >
          Delete element
        </button>
      </div>
    </div>
  );
}