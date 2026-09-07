"use client";

import {
  cloneElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement
} from "react";
import { renderNode, SytelyRenderer } from "@sytely/renderer";
import type {
  ComponentNode,
  ComponentType,
  Site,
  SitePage
} from "@sytely/types";
import "./editor.css";

type Device = "desktop" | "tablet" | "mobile";
type LeftTab = "components" | "templates" | "pages" | "layers";
type RightTab = "design" | "layout" | "position";
type ThemeMode = "system" | "light" | "dark";
type DropPosition = "before" | "after" | "inside";

type DragPayload =
  | { kind: "component"; componentType: ComponentType }
  | { kind: "template"; templateId: string }
  | { kind: "node"; nodeIds: string[] };

interface DropTarget {
  id: string | null;
  parentId: string | null;
  index: number;
  position: DropPosition;
  sectionId: string | null;
}

interface Template {
  id: string;
  name: string;
  description: string;
  node: ComponentNode;
}

interface ResizeState {
  ids: string[];
  startX: number;
  startY: number;
  widths: Record<string, number>;
  heights: Record<string, number>;
  before: Site;
}

const STORAGE_SITES = "sytely-sites";
const STORAGE_ACTIVE = "sytely-active-site";
const STORAGE_LEGACY = "sytely-site";
const DEFAULT_SECTION_PADDING = 56;

const componentInfo: Record<ComponentType, { icon: string; label: string }> = {
  section: { icon: "▦", label: "Section" },
  heading: { icon: "T", label: "Heading" },
  text: { icon: "≡", label: "Text" },
  button: { icon: "→", label: "Button" },
  image: { icon: "▧", label: "Image" },
  video: { icon: "▶", label: "Video" },
  gallery: { icon: "▥", label: "Gallery" },
  divider: { icon: "—", label: "Divider" },
  icon: { icon: "✦", label: "Icon" },
  logo: { icon: "◎", label: "Logo" },
  menu: { icon: "☰", label: "Menu" },
  social: { icon: "●", label: "Social" },
  form: { icon: "□", label: "Form" },
  card: { icon: "▣", label: "Card" },
  features: { icon: "◆", label: "Features" },
  pricing: { icon: "$", label: "Pricing" },
  testimonial: { icon: "“", label: "Testimonial" },
  faq: { icon: "?", label: "FAQ" },
  contact: { icon: "@", label: "Contact" },
  footer: { icon: "▰", label: "Footer" }
};

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `sytely-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
  children: ComponentNode[] = [],
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

function cloneWithNewIds(item: ComponentNode): ComponentNode {
  return {
    ...item,
    id: newId(),
    props: { ...item.props },
    styles: {
      ...(item.styles ?? {}),
      ...(item.styles?.responsive
        ? {
            responsive: {
              ...(item.styles.responsive as Record<string, unknown>)
            }
          }
        : {})
    },
    children: item.children?.map(cloneWithNewIds)
  };
}

function starterSection(title: string, copy: string) {
  return section(newId(), [
    node(
      newId(),
      "heading",
      { text: title },
      { fontSize: 44, fontWeight: 750, maxWidth: 760 }
    ),
    node(
      newId(),
      "text",
      { text: copy },
      { fontSize: 18, maxWidth: 720 }
    )
  ]);
}

const templates: Template[] = [
  {
    id: "hero",
    name: "Hero",
    description: "Headline, supporting copy and CTA",
    node: section(
      newId(),
      [
        node(
          newId(),
          "heading",
          { text: "Build something people remember" },
          {
            fontSize: 54,
            fontWeight: 750,
            textAlign: "center",
            width: "100%"
          }
        ),
        node(
          newId(),
          "text",
          {
            text: "Create a polished website visually without writing code."
          },
          {
            fontSize: 18,
            textAlign: "center",
            maxWidth: 680,
            alignSelf: "center"
          }
        ),
        node(
          newId(),
          "button",
          { text: "Get started" },
          { alignSelf: "center" }
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
    description: "Responsive text and image layout",
    node: section(
      newId(),
      [
        section(
          newId(),
          [
            node(
              newId(),
              "heading",
              { text: "A clear message" },
              { fontSize: 38, fontWeight: 750 }
            ),
            node(
              newId(),
              "text",
              {
                text: "Pair a strong message with supporting content and a clear action."
              }
            ),
            node(newId(), "button", { text: "Learn more" })
          ],
          {
            padding: 0,
            gap: 16
          }
        ),
        node(
          newId(),
          "image",
          { src: "", alt: "Placeholder image" },
          { width: 520, height: 320 }
        )
      ],
      {
        display: "grid",
        gridTemplateColumns: "repeat(2,minmax(0,1fr))",
        gap: 48
      }
    )
  },
  {
    id: "features",
    name: "Features",
    description: "Three responsive feature cards",
    node: section(
      newId(),
      [
        node(
          newId(),
          "heading",
          { text: "Everything in one place" },
          {
            fontSize: 38,
            fontWeight: 750,
            textAlign: "center"
          }
        ),
        node(
          newId(),
          "text",
          {
            text: "Build pages from reusable sections and components."
          },
          {
            textAlign: "center"
          }
        ),
        node(newId(), "features")
      ],
      {
        alignItems: "stretch"
      }
    )
  },
  {
    id: "stats",
    name: "Stats",
    description: "Compact metrics section",
    node: section(
      newId(),
      [node(newId(), "features", { mode: "stats" })],
      {
        alignItems: "stretch"
      }
    )
  },
  {
    id: "pricing",
    name: "Pricing",
    description: "Three plan comparison cards",
    node: section(newId(), [
      node(
        newId(),
        "heading",
        { text: "Simple pricing" },
        {
          fontSize: 40,
          fontWeight: 750,
          textAlign: "center"
        }
      ),
      node(
        newId(),
        "text",
        {
          text: "Choose the plan that fits your next project."
        },
        {
          textAlign: "center"
        }
      ),
      node(newId(), "pricing")
    ])
  },
  {
    id: "testimonial",
    name: "Testimonial",
    description: "Customer quote with attribution",
    node: section(
      newId(),
      [
        node(newId(), "testimonial", {
          text: "Sytely made our site structure much easier to iterate.",
          author: "Alex Morgan"
        })
      ],
      {
        alignItems: "center"
      }
    )
  },
  {
    id: "faq",
    name: "FAQ",
    description: "Expandable questions and answers",
    node: section(newId(), [
      node(
        newId(),
        "heading",
        { text: "Frequently asked questions" },
        {
          fontSize: 38,
          fontWeight: 750
        }
      ),
      node(newId(), "faq")
    ])
  },
  {
    id: "contact",
    name: "Contact",
    description: "Contact details and message form",
    node: section(newId(), [
      node(
        newId(),
        "heading",
        { text: "Let's talk" },
        {
          fontSize: 40,
          fontWeight: 750
        }
      ),
      node(
        newId(),
        "text",
        {
          text: "Tell us what you are building and how we can help."
        }
      ),
      node(newId(), "form")
    ])
  },
  {
    id: "footer",
    name: "Footer",
    description: "Responsive footer navigation",
    node: section(
      newId(),
      [
        node(newId(), "logo", { text: "Sytely" }),
        node(newId(), "menu"),
        node(newId(), "social")
      ],
      {
        display: "grid",
        gridTemplateColumns: "1fr auto auto",
        alignItems: "center",
        paddingTop: 32,
        paddingBottom: 32
      }
    )
  }
];

const initialSite: Site = {
  id: "site-1",
  name: "Sytely Site",
  version: 2,
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
      components: [
        cloneWithNewIds(templates[0].node),
        cloneWithNewIds(templates[2].node),
        cloneWithNewIds(templates[1].node),
        cloneWithNewIds(templates[7].node)
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
        background: "var(--sytely-page)",
        theme: "system"
      },
      components: [
        starterSection(
          "A better way to build",
          "Design pages visually, keep reusable sections organized, and switch between responsive breakpoints without rebuilding your layout."
        )
      ]
    },
    {
      id: "page-services",
      name: "Services",
      slug: "/services",
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
      components: [
        cloneWithNewIds(templates[2].node),
        cloneWithNewIds(templates[1].node)
      ]
    },
    {
      id: "page-pricing",
      name: "Pricing",
      slug: "/pricing",
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
      components: [
        cloneWithNewIds(templates[4].node),
        cloneWithNewIds(templates[6].node)
      ]
    },
    {
      id: "page-contact",
      name: "Contact",
      slug: "/contact",
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
      components: [
        cloneWithNewIds(templates[0].node),
        cloneWithNewIds(templates[2].node),
        cloneWithNewIds(templates[1].node),
        cloneWithNewIds(templates[7].node)
      ]
    }
  ]
};

function makeComponent(type: ComponentType): ComponentNode {
  const id = newId();

  const defaults: Record<ComponentType, ComponentNode> = {
    section: section(id),
    heading: node(
      id,
      "heading",
      { text: "Heading" },
      {
        fontSize: 32,
        fontWeight: 700
      }
    ),
    text: node(id, "text", {
      text: "Add your text here."
    }),
    button: node(id, "button", {
      text: "Button"
    }),
    image: node(
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
    ),
    video: node(id, "video", {
      src: ""
    }),
    gallery: node(id, "gallery", {
      images: ["", "", ""]
    }),
    divider: node(id, "divider"),
    icon: node(id, "icon", {
      icon: "✦"
    }),
    logo: node(id, "logo", {
      text: "Brand"
    }),
    menu: node(id, "menu", {
      items: ["Home", "About", "Contact"]
    }),
    social: node(id, "social"),
    form: node(id, "form"),
    card: node(
      id,
      "card",
      {
        title: "Card title",
        text: "Card description"
      }
    ),
    features: node(id, "features"),
    pricing: node(id, "pricing"),
    testimonial: node(id, "testimonial", {
      text: "A thoughtful product makes the experience easier.",
      author: "Customer"
    }),
    faq: node(id, "faq"),
    contact: node(id, "contact", {
      email: "hello@example.com",
      phone: "+1 000 000 0000"
    }),
    footer: node(id, "footer", {
      text: "© 2026 Your brand. All rights reserved."
    })
  };

  return defaults[type];
}

function collectNodes(
  nodes: ComponentNode[],
  result: ComponentNode[] = []
) {
  nodes.forEach((item) => {
    result.push(item);
    collectNodes(item.children ?? [], result);
  });

  return result;
}

function findNode(
  nodes: ComponentNode[],
  id: string
): ComponentNode | null {
  for (const item of nodes) {
    if (item.id === id) return item;

    const found = findNode(item.children ?? [], id);

    if (found) return found;
  }

  return null;
}

function findParentId(
  nodes: ComponentNode[],
  childId: string,
  parentId: string | null = null
): string | null {
  for (const item of nodes) {
    if (item.id === childId) return parentId;

    const found = findParentId(
      item.children ?? [],
      childId,
      item.id
    );

    if (found !== null) return found;
  }

  return null;
}

function findSiblingList(
  nodes: ComponentNode[],
  parentId: string | null
): ComponentNode[] {
  if (parentId === null) return nodes;

  return findNode(nodes, parentId)?.children ?? [];
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
          children: item.children
            ? updateNode(item.children, id, updater)
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
          children: item.children
            ? updateMany(item.children, ids, updater)
            : undefined
        }
  );
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

  nodes.forEach((item) => {
    if (ids.has(item.id)) {
      removed.push(item);
    } else {
      const child = removeNodes(
        item.children ?? [],
        ids
      );

      removed.push(...child.removed);

      result.push({
        ...item,
        children: item.children
          ? child.nodes
          : undefined
      });
    }
  });

  return {
    nodes: result,
    removed
  };
}

function insertAt(
  nodes: ComponentNode[],
  parentId: string | null,
  index: number,
  items: ComponentNode[]
): ComponentNode[] {
  if (parentId === null) {
    const copy = [...nodes];

    copy.splice(
      Math.max(0, Math.min(index, copy.length)),
      0,
      ...items
    );

    return copy;
  }

  return nodes.map((item) =>
    item.id === parentId
      ? {
          ...item,
          children: (() => {
            const copy = [...(item.children ?? [])];

            copy.splice(
              Math.max(
                0,
                Math.min(index, copy.length)
              ),
              0,
              ...items
            );

            return copy;
          })()
        }
      : {
          ...item,
          children: item.children
            ? insertAt(
                item.children,
                parentId,
                index,
                items
              )
            : undefined
        }
  );
}

function replaceWithChildren(
  nodes: ComponentNode[],
  id: string
): ComponentNode[] {
  const result: ComponentNode[] = [];

  nodes.forEach((item) => {
    if (item.id === id) {
      result.push(...(item.children ?? []));
    } else {
      result.push({
        ...item,
        children: item.children
          ? replaceWithChildren(item.children, id)
          : undefined
      });
    }
  });

  return result;
}

function removeSingle(
  nodes: ComponentNode[],
  id: string
): ComponentNode[] {
  return nodes
    .filter((item) => item.id !== id)
    .map((item) => ({
      ...item,
      children: item.children
        ? removeSingle(item.children, id)
        : undefined
    }));
}

function parseNumber(
  value: unknown,
  fallback = 0
) {
  const number = Number.parseFloat(
    String(value ?? "")
  );

  return Number.isFinite(number)
    ? number
    : fallback;
}

function styleValue(
  item: ComponentNode,
  key: string
) {
  return item.styles?.[key];
}

function themeVars(
  theme: ThemeMode
): CSSProperties {
  return {
    ["--sytely-theme-mode" as string]: theme
  } as CSSProperties;
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

function EditorNode({
  item,
  selectedIds,
  onSelect,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  device
}: {
  item: ComponentNode;
  selectedIds: string[];
  onSelect: (
    id: string,
    additive: boolean
  ) => void;
  onDragStart: (
    event: DragEvent,
    id: string
  ) => void;
  onDragEnd: () => void;
  onDragOver: (
    event: DragEvent,
    item: ComponentNode
  ) => void;
  onDrop: (
    event: DragEvent,
    item?: ComponentNode
  ) => void;
  device: Device;
}) {
  const selected = selectedIds.includes(item.id);
  const children = item.children ?? [];

  const content = renderNode(item, {
    device,
    children:
      item.type === "section"
        ? children.map((child) => (
            <EditorNode
              key={child.id}
              item={child}
              selectedIds={selectedIds}
              onSelect={onSelect}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDrop={onDrop}
              device={device}
            />
          ))
        : undefined,
    renderChildren: item.type !== "section"
  });

  if (
    !content ||
    typeof content !== "object" ||
    !("type" in content)
  ) {
    return null;
  }

  const element =
    content as ReactElement<
      Record<string, unknown>
    >;

  const originalClass =
    typeof element.props.className === "string"
      ? element.props.className
      : "";

  return cloneElement(element, {
    ...element.props,

    "data-editor-node-id": item.id,

    draggable: true,

    onDragStart: (event: DragEvent) => {
      onDragStart(event, item.id);
    },

    onDragEnd,

    onDragOver: (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      onDragOver(event, item);
    },

    onDrop: (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      onDrop(event, item);
    },

    onClick: (event: unknown) => {
      const mouseEvent = event as {
        preventDefault?: () => void;
        stopPropagation?: () => void;
      };

      mouseEvent.preventDefault?.();
      mouseEvent.stopPropagation?.();
    },

    onPointerDown: (
      event: ReactPointerEvent<HTMLElement>
    ) => {
      if (event.button !== 0) return;

      event.stopPropagation();

      onSelect(
        item.id,
        event.shiftKey ||
          event.metaKey ||
          event.ctrlKey
      );
    },

    className:
      `${originalClass} sytely-editor-target ${
        selected
          ? "sytely-editor-selected"
          : ""
      }`.trim()
  });
}

export default function EditorPage() {
  const [site, setSite] =
    useState<Site>(initialSite);

  const [sites, setSites] =
    useState<Site[]>([initialSite]);

  const [activePageId, setActivePageId] =
    useState("page-home");

  const [selectedIds, setSelectedIds] =
    useState<string[]>([]);

  const [pageSelected, setPageSelected] =
    useState(true);

  const [leftTab, setLeftTab] =
    useState<LeftTab>("components");

  const [rightTab, setRightTab] =
    useState<RightTab>("design");

  const [device, setDevice] =
    useState<Device>("desktop");

  const [zoom, setZoom] =
    useState(72);

  const [search, setSearch] =
    useState("");

  const [preview, setPreview] =
    useState(false);

  const [dragLabel, setDragLabel] =
    useState<string | null>(null);

  const [dropTarget, setDropTarget] =
    useState<DropTarget | null>(null);

  const [history, setHistory] =
    useState<Site[]>([]);

  const [future, setFuture] =
    useState<Site[]>([]);

  const [notice, setNotice] =
    useState("Saved");

  const [dirty, setDirty] =
    useState(false);

  const [marquee, setMarquee] =
    useState<{
      startX: number;
      startY: number;
      currentX: number;
      currentY: number;
    } | null>(null);

  const [resizeState, setResizeState] =
    useState<ResizeState | null>(null);

  const [, setLayoutTick] =
    useState(0);

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
    selectedNodes.length === 1
      ? selectedNodes[0]
      : null;

  const theme =
    String(
      activePage?.styles?.theme ?? "system"
    ) as ThemeMode;

  const activePageBackground =
    String(
      activePage?.styles?.background ??
        "var(--sytely-page)"
    );

  const canvasWidth =
    device === "mobile"
      ? 390
      : device === "tablet"
        ? 768
        : 1180;

  const persist = useCallback(
    (next: Site) => {
      try {
        const raw =
          window.localStorage.getItem(
            STORAGE_SITES
          );

        const current: Site[] = raw
          ? JSON.parse(raw)
          : [];

        const merged = current.some(
          (item) => item.id === next.id
        )
          ? current.map((item) =>
              item.id === next.id
                ? next
                : item
            )
          : [...current, next];

        window.localStorage.setItem(
          STORAGE_SITES,
          JSON.stringify(merged)
        );

        window.localStorage.setItem(
          STORAGE_ACTIVE,
          next.id
        );

        window.localStorage.setItem(
          STORAGE_LEGACY,
          JSON.stringify(next)
        );

        setSites(merged);
        setNotice("Saved");
        setDirty(false);
      } catch {
        setNotice("Save failed");
      }
    },
    []
  );

  useEffect(() => {
    const refreshOverlay = () =>
      setLayoutTick(
        (value) => value + 1
      );

    const element =
      canvasRef.current;

    window.addEventListener(
      "resize",
      refreshOverlay
    );

    element?.addEventListener(
      "scroll",
      refreshOverlay,
      {
        passive: true
      }
    );

    return () => {
      window.removeEventListener(
        "resize",
        refreshOverlay
      );

      element?.removeEventListener(
        "scroll",
        refreshOverlay
      );
    };
  }, []);

  useEffect(() => {
    try {
      const raw =
        window.localStorage.getItem(
          STORAGE_SITES
        );

      const legacy =
        window.localStorage.getItem(
          STORAGE_LEGACY
        );

      const parsed = raw
        ? JSON.parse(raw)
        : legacy
          ? [JSON.parse(legacy)]
          : [initialSite];

      const loaded: Site[] =
        Array.isArray(parsed) &&
        parsed.length
          ? parsed
          : [initialSite];

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
      setActivePageId("page-home");
    }
  }, []);

  function commit(
    updater: (current: Site) => Site
  ) {
    setHistory((items) => [
      ...items.slice(-49),
      site
    ]);

    setFuture([]);

    setSite((current) =>
      updater(current)
    );

    setDirty(true);
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

  function updateNodeStyles(
    key: string,
    value: unknown
  ) {
    if (!selectedIds.length) return;

    const selectedSet =
      new Set(selectedIds);

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
                    selectedSet,
                    (item) => ({
                      ...item,
                      styles: {
                        ...(item.styles ?? {}),
                        [key]: value
                      }
                    })
                  )
              }
            : page
      )
    }));
  }

  function updateNodeProp(
    key: string,
    value: unknown
  ) {
    if (!selectedNode) return;

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

  function deleteSelected() {
    if (!selectedIds.length) return;

    const ids =
      new Set(selectedIds);

    commit((current) => ({
      ...current,
      pages: current.pages.map(
        (page) =>
          page.id === activePageId
            ? {
                ...page,
                components:
                  removeNodes(
                    page.components,
                    ids
                  ).nodes
              }
            : page
      )
    }));

    setSelectedIds([]);
  }

  function parseDrag(
    event: DragEvent
  ): DragPayload | null {
    const raw =
      event.dataTransfer.getData(
        "application/x-sytely"
      );

    if (!raw) return null;

    try {
      return JSON.parse(
        raw
      ) as DragPayload;
    } catch {
      return null;
    }
  }

  function setDrag(
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

  function nodeDragStart(
    event: DragEvent,
    id: string
  ) {
    const ids =
      selectedIds.includes(id)
        ? selectedIds
        : [id];

    setDrag(
      event,
      {
        kind: "node",
        nodeIds: ids
      },
      ids.length > 1
        ? `${ids.length} items`
        : "Move item"
    );
  }

  function paletteDrag(
    event: DragEvent,
    payload: DragPayload,
    label: string
  ) {
    setDrag(
      event,
      payload,
      label
    );
  }

  function computeDropTarget(
    event: DragEvent
  ): DropTarget | null {
    const point =
      document
        .elementsFromPoint(
          event.clientX,
          event.clientY
        )
        .find(
          (element) =>
            (
              element as HTMLElement
            ).dataset
              .editorNodeId
        ) as
        | HTMLElement
        | undefined;

    if (!point) {
      const root =
        activePage.components;

      return {
        id: null,
        parentId: null,
        index: root.length,
        position: "after",
        sectionId: null
      };
    }

    const id =
      point.dataset.editorNodeId;

    if (!id) return null;

    const target = findNode(
      activePage.components,
      id
    );

    if (!target) return null;

    const rect =
      point.getBoundingClientRect();

    const y = rect.height
      ? (event.clientY - rect.top) /
        rect.height
      : 0.5;

    const parentId =
      findParentId(
        activePage.components,
        id
      );

    const siblings =
      findSiblingList(
        activePage.components,
        parentId
      );

    const index = Math.max(
      0,
      siblings.findIndex(
        (item) =>
          item.id === id
      )
    );

    if (
      target.type === "section" &&
      y > 0.18 &&
      y < 0.82
    ) {
      return {
        id,
        parentId: id,
        index:
          target.children?.length ??
          0,
        position: "inside",
        sectionId: id
      };
    }

    const before =
      y < 0.5;

    const sectionId =
      target.type === "section"
        ? target.id
        : parentId &&
            findNode(
              activePage.components,
              parentId
            )?.type === "section"
          ? parentId
          : null;

    return {
      id,
      parentId,
      index: before
        ? index
        : index + 1,
      position: before
        ? "before"
        : "after",
      sectionId
    };
  }

  function onCanvasDragOver(
    event: DragEvent
  ) {
    event.preventDefault();

    const target =
      computeDropTarget(event);

    if (target) {
      setDropTarget(target);
    }

    event.dataTransfer.dropEffect =
      parseDrag(event)?.kind === "node"
        ? "move"
        : "copy";
  }

  function handleDrop(
    event: DragEvent
  ) {
    event.preventDefault();
    event.stopPropagation();

    const payload =
      parseDrag(event);

    const target =
      dropTarget ??
      computeDropTarget(event);

    if (!payload || !target) {
      return;
    }

    if (
      payload.kind === "component"
    ) {
      const fresh =
        makeComponent(
          payload.componentType
        );

      commit((current) => ({
        ...current,
        pages: current.pages.map(
          (page) =>
            page.id === activePageId
              ? {
                  ...page,
                  components:
                    insertAt(
                      page.components,
                      target.position ===
                        "inside"
                        ? target.id
                        : target.parentId,
                      target.index,
                      [fresh]
                    )
                }
              : page
        )
      }));

      setSelectedIds([
        fresh.id
      ]);
    } else if (
      payload.kind === "template"
    ) {
      const template =
        templates.find(
          (item) =>
            item.id ===
            payload.templateId
        );

      if (template) {
        const fresh =
          cloneWithNewIds(
            template.node
          );

        commit((current) => ({
          ...current,
          pages: current.pages.map(
            (page) =>
              page.id ===
              activePageId
                ? {
                    ...page,
                    components:
                      insertAt(
                        page.components,
                        target.position ===
                          "inside"
                          ? target.id
                          : target.parentId,
                        target.index,
                        [fresh]
                      )
                  }
                : page
          )
        }));

        setSelectedIds([
          fresh.id
        ]);
      }
    } else {
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

      if (
        !moving.length ||
        moving.some((item) =>
          target.id
            ? containsNode(
                item,
                target.id
              )
            : false
        )
      ) {
        setDropTarget(null);
        setDragLabel(null);
        return;
      }

      const movingSet =
        new Set(
          payload.nodeIds
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

            const destinationParent =
              target.position ===
              "inside"
                ? target.id
                : target.parentId;

            const siblings =
              findSiblingList(
                page.components,
                destinationParent
              );

            const removed =
              removeNodes(
                page.components,
                movingSet
              );

            const movingBeforeTarget =
              siblings
                .slice(
                  0,
                  target.index
                )
                .filter((item) =>
                  movingSet.has(
                    item.id
                  )
                ).length;

            const adjustedIndex =
              Math.max(
                0,
                target.index -
                  movingBeforeTarget
              );

            return {
              ...page,
              components:
                insertAt(
                  removed.nodes,
                  destinationParent,
                  adjustedIndex,
                  removed.removed
                )
            };
          }
        )
      }));
    }

    setDropTarget(null);
    setDragLabel(null);
  }

  function moveSelected(
    direction: -1 | 1
  ) {
    if (!selectedIds.length) {
      return;
    }

    const selectedSet =
      new Set(selectedIds);

    function reorder(
      nodes: ComponentNode[]
    ): ComponentNode[] {
      const result =
        nodes.map((item) => ({
          ...item,
          children:
            item.children
              ? reorder(
                  item.children
                )
              : undefined
        }));

      const selectedIndexes =
        result
          .map((item, index) =>
            selectedSet.has(
              item.id
            )
              ? index
              : -1
          )
          .filter(
            (index) =>
              index >= 0
          );

      if (
        !selectedIndexes.length
      ) {
        return result;
      }

      if (direction < 0) {
        for (
          const index of
            selectedIndexes
        ) {
          if (
            index <= 0 ||
            selectedSet.has(
              result[index - 1].id
            )
          ) {
            continue;
          }

          [
            result[index - 1],
            result[index]
          ] = [
            result[index],
            result[index - 1]
          ];
        }
      } else {
        for (
          let i =
            selectedIndexes.length -
            1;
          i >= 0;
          i -= 1
        ) {
          const index =
            selectedIndexes[i];

          if (
            index >=
              result.length - 1 ||
            selectedSet.has(
              result[index + 1].id
            )
          ) {
            continue;
          }

          [
            result[index],
            result[index + 1]
          ] = [
            result[index + 1],
            result[index]
          ];
        }
      }

      return result;
    }

    commit((current) => ({
      ...current,
      pages: current.pages.map(
        (page) =>
          page.id === activePageId
            ? {
                ...page,
                components:
                  reorder(
                    page.components
                  )
              }
            : page
      )
    }));
  }

  function duplicateSelected() {
    if (!selectedIds.length) {
      return;
    }

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

          const selectedSet =
            new Set(
              selectedIds
            );

          const parentId =
            findParentId(
              page.components,
              selectedIds[0]
            );

          const sameParent =
            selectedIds.every(
              (id) =>
                findParentId(
                  page.components,
                  id
                ) === parentId
            );

          if (!sameParent) {
            return page;
          }

          const siblings =
            findSiblingList(
              page.components,
              parentId
            );

          const selectedInOrder =
            siblings.filter(
              (item) =>
                selectedSet.has(
                  item.id
                )
            );

          clones.push(
            ...selectedInOrder.map(
              cloneWithNewIds
            )
          );

          if (
            !selectedInOrder.length
          ) {
            return page;
          }

          const last =
            Math.max(
              ...selectedInOrder.map(
                (item) =>
                  siblings.findIndex(
                    (sibling) =>
                      sibling.id ===
                      item.id
                  )
              )
            );

          return {
            ...page,
            components:
              insertAt(
                page.components,
                parentId,
                last + 1,
                clones
              )
          };
        }
      )
    }));

    setSelectedIds(
      clones.map(
        (item) => item.id
      )
    );
  }

  function groupSelected() {
    if (
      selectedIds.length < 2
    ) {
      return;
    }

    const parentId =
      findParentId(
        activePage.components,
        selectedIds[0]
      );

    if (
      !selectedIds.every(
        (id) =>
          findParentId(
            activePage.components,
            id
          ) === parentId
      )
    ) {
      setNotice(
        "Group items from the same level"
      );
      return;
    }

    const selectedSet =
      new Set(selectedIds);

    const siblings =
      findSiblingList(
        activePage.components,
        parentId
      );

    const chosen =
      siblings.filter(
        (item) =>
          selectedSet.has(
            item.id
          )
      );

    if (!chosen.length) {
      return;
    }

    const group = section(
      newId(),
      chosen,
      {
        paddingTop: 24,
        paddingRight: 24,
        paddingBottom: 24,
        paddingLeft: 24,
        gap: 16,
        background:
          "var(--sytely-card)"
      }
    );

    const start =
      siblings.findIndex(
        (item) =>
          item.id ===
          chosen[0].id
      );

    commit((current) => ({
      ...current,
      pages: current.pages.map(
        (page) =>
          page.id === activePageId
            ? {
                ...page,
                components:
                  insertAt(
                    removeNodes(
                      page.components,
                      selectedSet
                    ).nodes,
                    parentId,
                    start,
                    [group]
                  )
              }
            : page
      )
    }));

    setSelectedIds([
      group.id
    ]);
  }

  function ungroupSelected() {
    if (
      !selectedNode ||
      selectedNode.type !==
        "section"
    ) {
      return;
    }

    const parentId =
      findParentId(
        activePage.components,
        selectedNode.id
      );

    const siblings =
      findSiblingList(
        activePage.components,
        parentId
      );

    const index =
      siblings.findIndex(
        (item) =>
          item.id ===
          selectedNode.id
      );

    const children =
      selectedNode.children ?? [];

    commit((current) => ({
      ...current,
      pages: current.pages.map(
        (page) =>
          page.id === activePageId
            ? {
                ...page,
                components:
                  insertAt(
                    removeSingle(
                      page.components,
                      selectedNode.id
                    ),
                    parentId,
                    index,
                    children
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

    ids.forEach((itemId) => {
      const element =
        document.querySelector<HTMLElement>(
          `[data-sytely-id="${itemId}"]`
        );

      if (!element) {
        return;
      }

      const rect =
        element.getBoundingClientRect();

      widths[itemId] =
        rect.width /
        (zoom / 100);

      heights[itemId] =
        rect.height /
        (zoom / 100);
    });

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
      const dx =
        (event.clientX -
          resizeState.startX) /
        (zoom / 100);

      const dy =
        (event.clientY -
          resizeState.startY) /
        (zoom / 100);

      const selectedSet =
        new Set(
          resizeState.ids
        );

      setSite((current) => ({
        ...current,
        pages: current.pages.map(
          (page) =>
            page.id === activePageId
              ? {
                  ...page,
                  components:
                    updateMany(
                      page.components,
                      selectedSet,
                      (item) => ({
                        ...item,
                        styles: {
                          ...(item.styles ??
                            {}),
                          width: Math.max(
                            80,
                            (resizeState
                              .widths[
                              item.id
                            ] ??
                              160) + dx
                          ),
                          height: Math.max(
                            40,
                            (resizeState
                              .heights[
                              item.id
                            ] ??
                              80) + dy
                          )
                        }
                      })
                    )
                }
              : page
        )
      }));

      setDirty(true);
      setNotice("Unsaved changes");
    };

    const up = () => {
      setHistory((items) => [
        ...items.slice(-49),
        resizeState.before
      ]);

      setFuture([]);
      setResizeState(null);
    };

    window.addEventListener(
      "pointermove",
      move
    );

    window.addEventListener(
      "pointerup",
      up,
      {
        once: true
      }
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        move
      );

      window.removeEventListener(
        "pointerup",
        up
      );
    };
  }, [
    resizeState,
    zoom,
    activePageId
  ]);

  function startMarquee(
    event: ReactPointerEvent<HTMLDivElement>
  ) {
    const target =
      event.target as HTMLElement;

    if (
      event.button !== 0 ||
      target.closest(
        [
          ".sytely-editor-target",
          ".floating-toolbar",
          ".canvas-toolbar",
          ".inspector-panel",
          ".side-rail",
          ".topbar",
          ".drop-overlay"
        ].join(",")
      )
    ) {
      return;
    }

    const additive =
      event.shiftKey ||
      event.metaKey ||
      event.ctrlKey;

    if (!additive) {
      setSelectedIds([]);
    }

    setPageSelected(false);

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

    const up = (
      event: PointerEvent
    ) => {
      setMarquee((current) => {
        if (!current) {
          return null;
        }

        const left =
          Math.min(
            current.startX,
            current.currentX
          );

        const right =
          Math.max(
            current.startX,
            current.currentX
          );

        const top =
          Math.min(
            current.startY,
            current.currentY
          );

        const bottom =
          Math.max(
            current.startY,
            current.currentY
          );

        if (
          right - left < 6 &&
          bottom - top < 6
        ) {
          return null;
        }

        const hit =
          allNodes
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
            .map(
              (item) => item.id
            );

        setSelectedIds(
          (ids) =>
            event.shiftKey ||
            event.metaKey ||
            event.ctrlKey
              ? Array.from(
                  new Set([
                    ...ids,
                    ...hit
                  ])
                )
              : hit
        );

        return null;
      });
    };

    window.addEventListener(
      "pointermove",
      move
    );

    window.addEventListener(
      "pointerup",
      up,
      {
        once: true
      }
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        move
      );

      window.removeEventListener(
        "pointerup",
        up
      );
    };
  }, [
    marquee,
    allNodes
  ]);

  function undo() {
    const previous =
      history.at(-1);

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
    setDirty(true);
    setNotice("Unsaved changes");
  }

  function redo() {
    const next =
      future[0];

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
    setDirty(true);
    setNotice("Unsaved changes");
  }

  function createPage(
    template?: Template
  ) {
    const id = newId();

    const page =
      defaultPage(
        id,
        template
          ? template.name
          : `Page ${site.pages.length + 1}`,
        template
          ? `/${template.id}-${site.pages.length + 1}`
          : `/page-${site.pages.length + 1}`
      );

    page.components =
      template
        ? [
            cloneWithNewIds(
              template.node
            )
          ]
        : [];

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

  function duplicatePage() {
    const copy: SitePage = {
      ...activePage,
      id: newId(),
      name: `${activePage.name} Copy`,
      slug: `${
        activePage.slug.replace(
          /\/$/,
          ""
        ) || "/page"
      }-copy`,
      margins: {
        ...activePage.margins
      },
      styles: {
        ...(activePage.styles ??
          {})
      },
      components:
        activePage.components.map(
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

    setActivePageId(
      copy.id
    );

    setSelectedIds([]);
    setPageSelected(true);
  }

  function deletePage() {
    if (
      site.pages.length <= 1
    ) {
      return;
    }

    const remaining =
      site.pages.filter(
        (page) =>
          page.id !==
          activePageId
      );

    commit((current) => ({
      ...current,
      pages: remaining
    }));

    setActivePageId(
      remaining[0].id
    );

    setSelectedIds([]);
    setPageSelected(true);
  }

  function renamePage() {
    const name =
      window.prompt(
        "Page name",
        activePage.name
      );

    if (!name?.trim()) {
      return;
    }

    updatePage((page) => ({
      ...page,
      name: name.trim()
    }));
  }

  function createSite() {
    const fresh: Site = {
      ...initialSite,
      id: newId(),
      name: `Website ${sites.length + 1}`,
      pages:
        initialSite.pages.map(
          (page) => ({
            ...page,
            id: newId(),
            margins: {
              ...page.margins
            },
            styles: {
              ...(page.styles ??
                {})
            },
            components:
              page.components.map(
                cloneWithNewIds
              )
          })
        )
    };

    setSites((items) => [
      ...items,
      fresh
    ]);

    setSite(fresh);

    setActivePageId(
      fresh.pages[0].id
    );

    setSelectedIds([]);
    setPageSelected(true);
    setDirty(true);
    setNotice(
      "Unsaved changes"
    );
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

  function setResponsiveStyle(
    key: string,
    value: unknown
  ) {
    if (!selectedIds.length) {
      return;
    }

    const selectedSet =
      new Set(selectedIds);

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
                    selectedSet,
                    (item) => ({
                      ...item,
                      styles: {
                        ...(item.styles ??
                          {}),
                        responsive: {
                          ...(
                            (item.styles
                              ?.responsive as
                              | Record<
                                  string,
                                  unknown
                                >
                              | undefined) ??
                            {}
                          ),
                          [device]: {
                            ...(
                              (
                                (
                                  item.styles
                                    ?.responsive as
                                    | Record<
                                        string,
                                        unknown
                                      >
                                    | undefined
                                )?.[
                                  device
                                ] as
                                  | Record<
                                      string,
                                      unknown
                                    >
                                  | undefined
                              ) ?? {}
                            ),
                            [key]: value
                          }
                        }
                      }
                    })
                  )
              }
            : page
      )
    }));
  }

  useEffect(() => {
    const keyHandler = (
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
          "s"
      ) {
        event.preventDefault();
        persist(site);
        return;
      }

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
        event.key ===
        "Escape"
      ) {
        setSelectedIds([]);
        setPageSelected(true);
        setDropTarget(null);
        setMarquee(null);
        return;
      }

      if (
        (
          event.key ===
            "Delete" ||
          event.key ===
            "Backspace"
        ) &&
        selectedIds.length
      ) {
        event.preventDefault();
        deleteSelected();
        return;
      }

      if (
        selectedIds.length &&
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight"
        ].includes(event.key)
      ) {
        event.preventDefault();

        if (
          event.key ===
          "ArrowUp"
        ) {
          moveSelected(-1);
        }

        if (
          event.key ===
          "ArrowDown"
        ) {
          moveSelected(1);
        }

        if (
          event.key ===
            "ArrowLeft" ||
          event.key ===
            "ArrowRight"
        ) {
          const key =
            "marginLeft";

          const delta =
            event.shiftKey
              ? 10
              : 1;

          const direction =
            event.key ===
            "ArrowLeft"
              ? -1
              : 1;

          const selectedSet =
            new Set(
              selectedIds
            );

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
                            selectedSet,
                            (item) => ({
                              ...item,
                              styles: {
                                ...(item.styles ??
                                  {}),
                                [key]:
                                  parseNumber(
                                    item
                                      .styles?.[
                                      key
                                    ]
                                  ) +
                                  delta *
                                    direction
                              }
                            })
                          )
                      }
                    : page
              )
          }));
        }
      }
    };

    window.addEventListener(
      "keydown",
      keyHandler
    );

    return () =>
      window.removeEventListener(
        "keydown",
        keyHandler
      );
  }, [
    activePageId,
    deleteSelected,
    duplicateSelected,
    moveSelected,
    persist,
    redo,
    selectedIds,
    site,
    undo
  ]);

  const filteredComponents =
    (
      Object.keys(
        componentInfo
      ) as ComponentType[]
    ).filter((type) =>
      componentInfo[
        type
      ].label
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  const filteredTemplates =
    templates.filter(
      (template) =>
        `${template.name} ${template.description}`
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );

  function styleInput(
    key: string,
    responsive = false
  ) {
    const value =
      responsive
        ? (
            (
              selectedNode
                ?.styles
                ?.responsive as
                | Record<
                    string,
                    unknown
                  >
                | undefined
            )?.[device] as
              | Record<
                  string,
                  unknown
                >
              | undefined
          )?.[key]
        : selectedNode?.styles?.[
            key
          ];

    return value;
  }

  function renderSelectionOverlay() {
    if (
      !selectedIds.length ||
      preview
    ) {
      return null;
    }

    return selectedIds.map(
      (id) => {
        const element =
          document.querySelector<HTMLElement>(
            `[data-sytely-id="${id}"]`
          );

        if (!element) {
          return null;
        }

        const rect =
          element.getBoundingClientRect();

        const type =
          findNode(
            activePage.components,
            id
          )?.type ??
          "section";

        return (
          <div
            key={id}
            className="selection-overlay"
            style={{
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height
            }}
          >
            <span>
              {
                componentInfo[
                  type
                ].label
              }
            </span>

            {selectedIds.length ===
              1 && (
              <button
                type="button"
                className="overlay-delete"
                onPointerDown={(
                  event
                ) =>
                  event.stopPropagation()
                }
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedIds([
                    id
                  ]);
                  deleteSelected();
                }}
              >
                ×
              </button>
            )}

            {selectedIds.length ===
              1 && (
              <>
                <div
                  className="overlay-resize overlay-resize-right"
                  onPointerDown={(
                    event
                  ) =>
                    startResize(
                      event,
                      id
                    )
                  }
                />

                <div
                  className="overlay-resize overlay-resize-bottom"
                  onPointerDown={(
                    event
                  ) =>
                    startResize(
                      event,
                      id
                    )
                  }
                />

                <div
                  className="overlay-resize overlay-resize-corner"
                  onPointerDown={(
                    event
                  ) =>
                    startResize(
                      event,
                      id
                    )
                  }
                />
              </>
            )}
          </div>
        );
      }
    );
  }

  const dropStyle =
    useMemo(() => {
      if (
        !dropTarget ||
        !dragLabel
      ) {
        return null;
      }

      if (!dropTarget.id) {
        return {
          left: 20,
          right: 20,
          top: 20,
          height: 3
        };
      }

      const element =
        document.querySelector<HTMLElement>(
          `[data-sytely-id="${dropTarget.id}"]`
        );

      if (!element) {
        return null;
      }

      const rect =
        element.getBoundingClientRect();

      if (
        dropTarget.position ===
        "inside"
      ) {
        return {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        };
      }

      return {
        left: rect.left,
        top:
          dropTarget.position ===
          "before"
            ? rect.top - 2
            : rect.bottom - 1,
        width: rect.width,
        height: 3
      };
    }, [
      dropTarget,
      dragLabel,
      allNodes
    ]);

  return (
    <div
      className="editor-shell"
      style={themeVars(theme)}
      data-theme={theme}
    >
      <header className="topbar">
        <div className="brand-block">
          <a
            href="/"
            className="brand"
            onClick={(event) =>
              event.preventDefault()
            }
          >
            Sytely
          </a>

          <span>/ Editor</span>
        </div>

        <div className="site-switcher">
          <select
            value={site.id}
            onChange={(event) => {
              const next =
                sites.find(
                  (item) =>
                    item.id ===
                    event.target.value
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
              setDirty(false);
              setNotice("Saved");
              setHistory([]);
              setFuture([]);
            }}
          >
            {sites.map(
              (item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              )
            )}
          </select>

          <button
            type="button"
            onClick={createSite}
          >
            New
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
            disabled={
              !history.length
            }
            aria-label="Undo"
          >
            ↶
          </button>

          <button
            type="button"
            onClick={redo}
            disabled={
              !future.length
            }
            aria-label="Redo"
          >
            ↷
          </button>

          <button
            type="button"
            className={
              dirty
                ? "save-button dirty"
                : "save-button"
            }
            onClick={() =>
              persist(site)
            }
          >
            Save
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
                  : item ===
                      "tablet"
                    ? "Tablet"
                    : "Mobile"}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              setPreview(true)
            }
          >
            Preview
          </button>

          <button
            type="button"
            className="publish-button"
            onClick={() =>
              persist(site)
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
          ).map((tab) => (
            <button
              key={tab}
              type="button"
              className={
                leftTab === tab
                  ? "active"
                  : ""
              }
              onClick={() =>
                setLeftTab(tab)
              }
              title={
                tab[0].toUpperCase() +
                tab.slice(1)
              }
            >
              {tab[0].toUpperCase()}
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
              {leftTab ===
              "layers"
                ? allNodes.length
                : leftTab ===
                    "pages"
                  ? site.pages
                      .length
                  : ""}
            </span>
          </div>

          {leftTab ===
            "components" && (
            <>
              <input
                className="panel-search"
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Search elements"
              />

              <p className="panel-hint">
                Drag anything to
                the insertion
                line. Drop inside
                a highlighted
                section to nest it.
              </p>

              <div className="palette-grid">
                {filteredComponents.map(
                  (type) => (
                    <div
                      key={type}
                      className="palette-card"
                      draggable
                      onDragStart={(
                        event
                      ) =>
                        paletteDrag(
                          event,
                          {
                            kind:
                              "component",
                            componentType:
                              type
                          },
                          componentInfo[
                            type
                          ].label
                        )
                      }
                    >
                      <b>
                        {
                          componentInfo[
                            type
                          ].icon
                        }
                      </b>

                      <span>
                        {
                          componentInfo[
                            type
                          ].label
                        }
                      </span>

                      <small>
                        Drag
                      </small>
                    </div>
                  )
                )}
              </div>
            </>
          )}

          {leftTab ===
            "templates" && (
            <>
              <input
                className="panel-search"
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Search templates"
              />

              <p className="panel-hint">
                Templates are full
                sections. They can
                be inserted into
                existing sections.
              </p>

              {filteredTemplates.map(
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

          {leftTab ===
            "pages" && (
            <>
              <button
                type="button"
                className="full-button"
                onClick={() =>
                  createPage()
                }
              >
                + New page
              </button>

              {site.pages.map(
                (page) => (
                  <button
                    type="button"
                    key={page.id}
                    className={`page-list-item ${
                      page.id ===
                      activePageId
                        ? "active"
                        : ""
                    }`}
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
                    <span>
                      {page.name}
                    </span>

                    <small>
                      {page.slug}
                    </small>
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
                    renamePage
                  }
                >
                  Rename
                </button>

                <button
                  type="button"
                  onClick={
                    deletePage
                  }
                  disabled={
                    site.pages
                      .length <= 1
                  }
                >
                  Delete
                </button>
              </div>

              <div className="page-templates">
                <small>
                  Start from template
                </small>

                {templates
                  .slice(0, 6)
                  .map(
                    (template) => (
                      <button
                        type="button"
                        key={
                          template.id
                        }
                        onClick={() =>
                          createPage(
                            template
                          )
                        }
                      >
                        {
                          template.name
                        }
                      </button>
                    )
                  )}
              </div>
            </>
          )}

          {leftTab ===
            "layers" && (
            <div className="layer-list">
              {allNodes.map(
                (item) => (
                  <button
                    type="button"
                    key={item.id}
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
                      {
                        componentInfo[
                          item.type
                        ].label
                      }
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
            onCanvasDragOver
          }
          onDrop={
            handleDrop
          }
        >
          <div className="canvas-toolbar">
            <div>
              <strong>
                {activePage.name}
              </strong>

              <span>
                {activePage.slug}
              </span>
            </div>

            <div className="canvas-toolbar-right">
              <span>
                {canvasWidth}px
              </span>

              <button
                type="button"
                onClick={() =>
                  setZoom(
                    (value) =>
                      Math.max(
                        35,
                        value - 5
                      )
                  )
                }
              >
                −
              </button>

              <span>
                {zoom}%
              </span>

              <button
                type="button"
                onClick={() =>
                  setZoom(
                    (value) =>
                      Math.min(
                        125,
                        value + 5
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

          {dragLabel && (
            <div className="drag-banner">
              {dragLabel}

              {dropTarget ? (
                <span>
                  {" · "}
                  {dropTarget.position ===
                  "inside"
                    ? `Inside section ${
                        dropTarget.sectionId?.slice(
                          0,
                          6
                        ) ?? ""
                      }`
                    : `${dropTarget.position} component`}
                </span>
              ) : null}
            </div>
          )}

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
                className={`page-frame ${
                  pageSelected
                    ? "page-selected"
                    : ""
                }`}
                data-sytely-theme={
                  theme
                }
                style={{
                  ...themeVars(
                    theme
                  ),
                  background:
                    activePageBackground,
                  paddingTop:
                    activePage
                      .margins
                      .top,
                  paddingRight:
                    activePage
                      .margins
                      .right,
                  paddingBottom:
                    activePage
                      .margins
                      .bottom +
                    100,
                  paddingLeft:
                    activePage
                      .margins
                      .left
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
                  .length === 0 ? (
                  <div className="empty-page">
                    Drop a section
                    here or choose
                    a template.
                  </div>
                ) : (
                  activePage.components.map(
                    (item) => (
                      <EditorNode
                        key={item.id}
                        item={item}
                        selectedIds={
                          selectedIds
                        }
                        onSelect={
                          select
                        }
                        onDragStart={
                          nodeDragStart
                        }
                        onDragEnd={() => {
                          setDropTarget(
                            null
                          );
                          setDragLabel(
                            null
                          );
                        }}
                        onDragOver={(
                          event
                        ) => {
                          event.preventDefault();

                          const target =
                            computeDropTarget(
                              event
                            );

                          if (target) {
                            setDropTarget(
                              target
                            );
                          }
                        }}
                        onDrop={
                          handleDrop
                        }
                        device={device}
                      />
                    )
                  )
                )}
              </div>
            </div>
          </div>

          {dropStyle && (
            <div
              className={`drop-overlay ${
                dropTarget?.position ===
                "inside"
                  ? "inside"
                  : "line"
              }`}
              style={
                dropStyle as CSSProperties
              }
            >
              {dropTarget?.position ===
                "inside" && (
                <span>
                  Drop into section
                </span>
              )}
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

          {renderSelectionOverlay()}

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
                <span className="selection-count">
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
                  onClick={() =>
                    moveSelected(-1)
                  }
                >
                  Move up
                </button>

                <button
                  type="button"
                  onClick={() =>
                    moveSelected(1)
                  }
                >
                  Move down
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
                    !selectedNode ||
                    selectedNode.type !==
                      "section" ||
                    !(
                      selectedNode
                        .children
                        ?.length
                    )
                  }
                >
                  Ungroup
                </button>

                <button
                  type="button"
                  onClick={
                    deleteSelected
                  }
                  className="danger-text"
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
                : selectedNodes.length >
                    1
                  ? `${selectedNodes.length} elements`
                  : componentInfo[
                      selectedNode?.type ??
                        "section"
                    ].label}
            </strong>
          </div>

          <div className="inspector-scroll">
            {pageSelected ||
            !selectedNode ? (
              <>
                <div className="inspector-section">
                  <div className="inspector-title">
                    Page
                  </div>

                  <label>
                    Theme

                    <select
                      value={theme}
                      onChange={(
                        event
                      ) =>
                        updatePage(
                          (page) => ({
                            ...page,
                            styles: {
                              ...(page.styles ??
                                {}),
                              theme:
                                event
                                  .target
                                  .value
                            }
                          })
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
                      onChange={(
                        event
                      ) =>
                        updatePage(
                          (page) => ({
                            ...page,
                            styles: {
                              ...(page.styles ??
                                {}),
                              background:
                                event
                                  .target
                                  .value
                            }
                          })
                        )
                      }
                    />
                  </label>
                </div>

                <div className="inspector-section">
                  <div className="inspector-title">
                    Page spacing
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
                            .margins[
                            key
                          ]
                        }
                        onChange={(
                          event
                        ) =>
                          updatePage(
                            (page) => ({
                              ...page,
                              margins: {
                                ...page.margins,
                                [key]:
                                  Math.max(
                                    0,
                                    Number(
                                      event
                                        .target
                                        .value
                                    )
                                  )
                              }
                            })
                          )
                        }
                      />
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="inspector-section">
                  <div className="inspector-title">
                    Element
                  </div>

                  <div className="readonly-type">
                    <span>
                      Type
                    </span>

                    <strong>
                      {
                        componentInfo[
                          selectedNode.type
                        ].label
                      }
                    </strong>
                  </div>
                </div>

                {(
                  selectedNode.type ===
                    "heading" ||
                  selectedNode.type ===
                    "text" ||
                  selectedNode.type ===
                    "button" ||
                  selectedNode.type ===
                    "logo" ||
                  selectedNode.type ===
                    "footer" ||
                  selectedNode.type ===
                    "testimonial" ||
                  selectedNode.type ===
                    "card"
                ) && (
                  <div className="inspector-section">
                    <label>
                      {selectedNode.type ===
                        "button" ||
                      selectedNode.type ===
                        "logo"
                        ? "Label"
                        : "Text"}

                      {selectedNode.type ===
                        "text" ||
                      selectedNode.type ===
                        "heading" ||
                      selectedNode.type ===
                        "testimonial" ? (
                        <textarea
                          value={String(
                            selectedNode
                              .props
                              .text ??
                              ""
                          )}
                          onChange={(
                            event
                          ) =>
                            updateNodeProp(
                              "text",
                              event
                                .target
                                .value
                            )
                          }
                        />
                      ) : (
                        <input
                          value={String(
                            selectedNode
                              .props
                              .text ??
                              selectedNode
                                .props
                                .title ??
                              ""
                          )}
                          onChange={(
                            event
                          ) =>
                            updateNodeProp(
                              selectedNode.type ===
                                "card"
                                ? "title"
                                : "text",
                              event
                                .target
                                .value
                            )
                          }
                        />
                      )}
                    </label>
                  </div>
                )}

                {selectedNode.type ===
                  "card" && (
                  <div className="inspector-section">
                    <label>
                      Description

                      <textarea
                        value={String(
                          selectedNode
                            .props
                            .text ??
                            ""
                        )}
                        onChange={(
                          event
                        ) =>
                          updateNodeProp(
                            "text",
                            event
                              .target
                              .value
                          )
                        }
                      />
                    </label>
                  </div>
                )}

                {selectedNode.type ===
                  "testimonial" && (
                  <div className="inspector-section">
                    <label>
                      Author

                      <input
                        value={String(
                          selectedNode
                            .props
                            .author ??
                            ""
                        )}
                        onChange={(
                          event
                        ) =>
                          updateNodeProp(
                            "author",
                            event
                              .target
                              .value
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
                          selectedNode
                            .props
                            .src ??
                            ""
                        )}
                        onChange={(
                          event
                        ) =>
                          updateNodeProp(
                            "src",
                            event
                              .target
                              .value
                          )
                        }
                      />
                    </label>

                    <label>
                      Alt text

                      <input
                        value={String(
                          selectedNode
                            .props
                            .alt ??
                            ""
                        )}
                        onChange={(
                          event
                        ) =>
                          updateNodeProp(
                            "alt",
                            event
                              .target
                              .value
                          )
                        }
                      />
                    </label>
                  </div>
                )}

                {selectedNode.type ===
                  "video" && (
                  <div className="inspector-section">
                    <label>
                      Video URL

                      <input
                        value={String(
                          selectedNode
                            .props
                            .src ??
                            ""
                        )}
                        onChange={(
                          event
                        ) =>
                          updateNodeProp(
                            "src",
                            event
                              .target
                              .value
                          )
                        }
                      />
                    </label>
                  </div>
                )}

                {selectedNode.type ===
                  "icon" && (
                  <div className="inspector-section">
                    <label>
                      Icon

                      <input
                        value={String(
                          selectedNode
                            .props
                            .icon ??
                            "✦"
                        )}
                        onChange={(
                          event
                        ) =>
                          updateNodeProp(
                            "icon",
                            event
                              .target
                              .value
                          )
                        }
                      />
                    </label>
                  </div>
                )}

                {selectedNode.type ===
                  "menu" && (
                  <div className="inspector-section">
                    <label>
                      Menu items

                      <input
                        value={
                          Array.isArray(
                            selectedNode
                              .props
                              .items
                          )
                            ? selectedNode
                                .props
                                .items
                                .join(
                                  ", "
                                )
                            : ""
                        }
                        onChange={(
                          event
                        ) =>
                          updateNodeProp(
                            "items",
                            event.target.value
                              .split(
                                ","
                              )
                              .map(
                                (
                                  item
                                ) =>
                                  item.trim()
                              )
                              .filter(
                                Boolean
                              )
                          )
                        }
                      />
                    </label>
                  </div>
                )}

                {selectedNode.type ===
                  "contact" && (
                  <div className="inspector-section">
                    <label>
                      Email

                      <input
                        value={String(
                          selectedNode
                            .props
                            .email ??
                            ""
                        )}
                        onChange={(
                          event
                        ) =>
                          updateNodeProp(
                            "email",
                            event
                              .target
                              .value
                          )
                        }
                      />
                    </label>

                    <label>
                      Phone

                      <input
                        value={String(
                          selectedNode
                            .props
                            .phone ??
                            ""
                        )}
                        onChange={(
                          event
                        ) =>
                          updateNodeProp(
                            "phone",
                            event
                              .target
                              .value
                          )
                        }
                      />
                    </label>
                  </div>
                )}

                {selectedNode.type ===
                  "section" && (
                  <div className="inspector-section">
                    <div className="inspector-title">
                      Alignment
                    </div>

                    <div className="alignment-grid">
                      {[
                        [
                          "Left",
                          "flex-start"
                        ],
                        [
                          "Center",
                          "center"
                        ],
                        [
                          "Right",
                          "flex-end"
                        ]
                      ].map(
                        ([
                          label,
                          value
                        ]) => (
                          <button
                            key={
                              label
                            }
                            type="button"
                            className={
                              styleValue(
                                selectedNode,
                                "alignItems"
                              ) ===
                              value
                                ? "active"
                                : ""
                            }
                            onClick={() =>
                              updateNodeStyles(
                                "alignItems",
                                value
                              )
                            }
                          >
                            {label}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

                <div className="inspector-section">
                  <div className="inspector-title">
                    Responsive{" "}
                    {device}
                  </div>

                  <label>
                    Width

                    <input
                      value={String(
                        styleInput(
                          "width"
                        ) ?? ""
                      )}
                      onChange={(
                        event
                      ) =>
                        updateNodeStyles(
                          "width",
                          event
                            .target
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
                      placeholder="Auto"
                    />
                  </label>

                  <label>
                    Font size

                    <input
                      type="number"
                      value={String(
                        styleInput(
                          "fontSize"
                        ) ?? ""
                      )}
                      onChange={(
                        event
                      ) =>
                        updateNodeStyles(
                          "fontSize",
                          Number(
                            event
                              .target
                              .value
                          )
                        )
                      }
                      placeholder="Auto"
                    />
                  </label>

                  <label>
                    Device override
                    width

                    <input
                      value={String(
                        styleInput(
                          "width",
                          true
                        ) ?? ""
                      )}
                      onChange={(
                        event
                      ) =>
                        setResponsiveStyle(
                          "width",
                          event
                            .target
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
                      placeholder="Auto"
                    />
                  </label>
                </div>

                <div className="inspector-section">
                  <div className="inspector-title">
                    Layout
                  </div>

                  <label>
                    Display

                    <select
                      value={String(
                        styleValue(
                          selectedNode,
                          "display"
                        ) ?? ""
                      )}
                      onChange={(
                        event
                      ) =>
                        updateNodeStyles(
                          "display",
                          event
                            .target
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
                      onChange={(
                        event
                      ) =>
                        updateNodeStyles(
                          "gap",
                          Number(
                            event
                              .target
                              .value
                          )
                        )
                      }
                    />
                  </label>

                  <label>
                    Border radius

                    <input
                      type="number"
                      value={parseNumber(
                        styleValue(
                          selectedNode,
                          "borderRadius"
                        ),
                        0
                      )}
                      onChange={(
                        event
                      ) =>
                        updateNodeStyles(
                          "borderRadius",
                          Number(
                            event
                              .target
                              .value
                          )
                        )
                      }
                    />
                  </label>
                </div>

                <div className="inspector-section">
                  <label>
                    Link

                    <select
                      value={String(
                        selectedNode
                          .props
                          .linkTo ??
                          ""
                      )}
                      onChange={(
                        event
                      ) =>
                        updateNodeProp(
                          "linkTo",
                          event
                            .target
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
                            key={
                              page.id
                            }
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

                <div className="inspector-section">
                  <button
                    type="button"
                    className="danger-button"
                    onClick={
                      deleteSelected
                    }
                  >
                    Delete element
                  </button>
                </div>
              </>
            )}
          </div>
        </aside>

        <aside className="side-rail right-rail">
          {(
            [
              "design",
              "layout",
              "position"
            ] as RightTab[]
          ).map((tab) => (
            <button
              key={tab}
              type="button"
              className={
                rightTab === tab
                  ? "active"
                  : ""
              }
              onClick={() =>
                setRightTab(tab)
              }
              title={
                tab[0].toUpperCase() +
                tab.slice(1)
              }
            >
              {tab[0].toUpperCase()}
            </button>
          ))}
        </aside>
      </div>

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
              {activePage.name} ·{" "}
              {device}
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
            className="preview-canvas"
            style={{
              maxWidth:
                canvasWidth,
              margin: "0 auto",
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
            <SytelyRenderer
              nodes={
                activePage.components
              }
              device={device}
            />
          </div>
        </div>
      )}
    </div>
  );
}