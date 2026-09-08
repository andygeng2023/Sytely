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
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderNode } from "@sytely/renderer";
import type {
  ComponentNode,
  ComponentType,
  Site,
  SitePage,
  LayoutMode,
} from "@sytely/types";
import "./editor.css";

type Device = "desktop" | "tablet" | "mobile";
type LeftTab =
  | "components"
  | "templates"
  | "pages"
  | "layers";

type DropPosition =
  | "before"
  | "after"
  | "inside";

type DropLayout =
  | "stack"
  | "columns"
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
  parentId: string | null;
  index: number;
  position: DropPosition;
  layout: DropLayout;
  containerLabel: string;
  columnCount: number;
  createsColumns: boolean;
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

interface MarqueeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface TouchGesture {
  startPan: {
    x: number;
    y: number;
  };
  startZoom: number;
  startPoint: {
    x: number;
    y: number;
  };
  startDistance: number;
  startMidpoint: {
    x: number;
    y: number;
  };
}

const STORAGE_SITES = "sytely-sites";
const STORAGE_LEGACY = "sytely-site";

const DEFAULT_SECTION_PADDING = 56;

const componentInfo: Record<
  ComponentType,
  {
    icon: string;
    label: string;
  }
> = {
  section: {
    icon: "▦",
    label: "Section",
  },
  heading: {
    icon: "T",
    label: "Heading",
  },
  text: {
    icon: "≡",
    label: "Text",
  },
  button: {
    icon: "→",
    label: "Button",
  },
  image: {
    icon: "▧",
    label: "Image",
  },
  video: {
    icon: "▶",
    label: "Video",
  },
  gallery: {
    icon: "▥",
    label: "Gallery",
  },
  divider: {
    icon: "—",
    label: "Divider",
  },
  icon: {
    icon: "✦",
    label: "Icon",
  },
  logo: {
    icon: "◎",
    label: "Logo",
  },
  menu: {
    icon: "☰",
    label: "Menu",
  },
  social: {
    icon: "●",
    label: "Social",
  },
  form: {
    icon: "□",
    label: "Form",
  },
  card: {
    icon: "▣",
    label: "Card",
  },
  features: {
    icon: "◆",
    label: "Features",
  },
  pricing: {
    icon: "$",
    label: "Pricing",
  },
  testimonial: {
    icon: "“",
    label: "Testimonial",
  },
  faq: {
    icon: "?",
    label: "FAQ",
  },
  contact: {
    icon: "@",
    label: "Contact",
  },
  footer: {
    icon: "▰",
    label: "Footer",
  },
};

function newId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `sytely-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") ||
    "website"
  );
}

function node(
  id: string,
  type: ComponentType,
  props: Record<string, unknown> = {},
  styles: Record<string, unknown> = {},
  children?: ComponentNode[],
): ComponentNode {
  return {
    id,
    type,
    props,
    styles,
    ...(children
      ? { children }
      : {}),
  };
}

function section(
  children: ComponentNode[] = [],
  styles: Record<string, unknown> = {},
): ComponentNode {
  return node(
    newId(),
    "section",
    {},
    {
      paddingTop:
        DEFAULT_SECTION_PADDING,
      paddingRight: 0,
      paddingBottom:
        DEFAULT_SECTION_PADDING,
      paddingLeft: 0,
      gap: 24,
      ...styles,
    },
    children,
  );
}

function makeComponent(
  type: ComponentType,
): ComponentNode {
  switch (type) {
    case "section":
      return section([
        node(
          newId(),
          "heading",
          {
            text: "Your heading",
          },
          {
            fontSize: 44,
            fontWeight: 700,
          },
        ),
        node(
          newId(),
          "text",
          {
            text:
              "Add your content here.",
          },
          {
            fontSize: 18,
            lineHeight: 1.6,
            maxWidth: 720,
          },
        ),
      ]);

    case "heading":
      return node(
        newId(),
        type,
        {
          text: "Your heading",
        },
        {
          fontSize: 44,
          fontWeight: 700,
        },
      );

    case "text":
      return node(
        newId(),
        type,
        {
          text:
            "Add your content here.",
        },
        {
          fontSize: 18,
          lineHeight: 1.6,
          maxWidth: 720,
        },
      );

    case "button":
      return node(
        newId(),
        type,
        {
          text: "Get started",
          linkTo: "#",
        },
        {
          width: "fit-content",
        },
      );

    case "image":
      return node(
        newId(),
        type,
        {
          src: "",
          alt: "Image",
        },
        {
          width: "100%",
          maxWidth: 900,
        },
      );

    case "video":
      return node(
        newId(),
        type,
        {
          src: "",
        },
        {
          width: "100%",
          maxWidth: 900,
        },
      );

    case "gallery":
      return node(
        newId(),
        type,
        {
          images: [],
        },
        {
          width: "100%",
        },
      );

    case "divider":
      return node(
        newId(),
        type,
        {},
        {
          width: "100%",
          height: 1,
          background:
            "currentColor",
          opacity: 0.16,
        },
      );

    case "icon":
      return node(
        newId(),
        type,
        {
          icon: "✦",
        },
        {
          fontSize: 32,
        },
      );

    case "logo":
      return node(
        newId(),
        type,
        {
          text: "Sytely",
        },
        {
          fontSize: 22,
          fontWeight: 700,
        },
      );

    case "menu":
      return node(
        newId(),
        type,
        {
          items: [
            "Home",
            "About",
            "Contact",
          ],
        },
        {
          display: "flex",
          gap: 20,
        },
      );

    case "social":
      return node(
        newId(),
        type,
        {
          items: [
            "Instagram",
            "X",
            "LinkedIn",
          ],
        },
        {
          display: "flex",
          gap: 12,
        },
      );

    case "form":
      return node(
        newId(),
        type,
        {
          title: "Contact us",
          submitLabel:
            "Send message",
        },
        {
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxWidth: 560,
        },
      );

    case "card":
      return node(
        newId(),
        type,
        {
          title: "Card title",
          text:
            "Describe this card.",
        },
        {
          padding: 24,
          borderRadius: 16,
        },
      );

    case "features":
      return node(
        newId(),
        type,
        {
          columns: 3,
        },
        {
          display: "grid",
          gridTemplateColumns:
            "repeat(3,minmax(0,1fr))",
          gap: 20,
        },
        [
          makeComponent("card"),
          makeComponent("card"),
          makeComponent("card"),
        ],
      );

    case "pricing":
      return node(
        newId(),
        type,
        {
          columns: 3,
        },
        {
          display: "grid",
          gridTemplateColumns:
            "repeat(3,minmax(0,1fr))",
          gap: 20,
        },
        [
          makeComponent("card"),
          makeComponent("card"),
          makeComponent("card"),
        ],
      );

    case "testimonial":
      return node(
        newId(),
        type,
        {
          quote:
            "A great experience.",
          author: "Customer",
        },
        {
          padding: 28,
        },
      );

    case "faq":
      return node(
        newId(),
        type,
        {
          question:
            "Frequently asked question",
          answer:
            "Write the answer here.",
        },
        {
          padding: 20,
        },
      );

    case "contact":
      return node(
        newId(),
        type,
        {
          title: "Contact",
          email:
            "hello@example.com",
        },
        {
          padding: 32,
        },
      );

    case "footer":
      return node(
        newId(),
        type,
        {
          text:
            "© 2026 Your brand. All rights reserved.",
        },
        {
          paddingTop: 32,
          paddingBottom: 32,
        },
      );

    default:
      return node(
        newId(),
        type,
      );
  }
}

function cloneWithNewIds(
  item: ComponentNode,
): ComponentNode {
  return {
    ...item,
    id: newId(),
    props: {
      ...item.props,
    },
    styles: item.styles
      ? {
          ...item.styles,
        }
      : undefined,
    children:
      item.children?.map(
        cloneWithNewIds,
      ),
  };
}

const templates: Template[] = [
  {
    id: "hero",
    name: "Hero",
    description:
      "Headline, copy and CTA",
    node: section(
      [
        node(
          newId(),
          "heading",
          {
            text:
              "Build something people remember",
          },
          {
            fontSize: 54,
            fontWeight: 750,
            maxWidth: 820,
          },
        ),
        node(
          newId(),
          "text",
          {
            text:
              "A polished responsive starting point for your next website.",
          },
          {
            fontSize: 19,
            maxWidth: 720,
          },
        ),
        node(
          newId(),
          "button",
          {
            text: "Get started",
            linkTo: "#",
          },
          {
            width:
              "fit-content",
          },
        ),
      ],
      {
        alignItems:
          "flex-start",
      },
    ),
  },
  {
    id: "features",
    name: "Feature grid",
    description:
      "Three editable columns",
    node: section([
      makeComponent("features"),
    ]),
  },
  {
    id: "pricing",
    name: "Pricing",
    description:
      "Three-column pricing layout",
    node: section([
      makeComponent("pricing"),
    ]),
  },
  {
    id: "contact",
    name: "Contact",
    description:
      "Contact section",
    node: section([
      makeComponent("contact"),
      makeComponent("form"),
    ]),
  },
];

function createInitialSite(): Site {
  return {
    id: "site-1",
    name: "Sytely Site",
    version: 3,
    theme: "system",
    layoutMode: "sytely",
    pages: [
      {
        id: "page-home",
        name: "Home",
        slug: "/",
        margins: {
          top: 0,
          right: 32,
          bottom: 0,
          left: 32,
        },
        styles: {
          background:
            "var(--sytely-page)",
          theme: "system",
        },
        components: [
          cloneWithNewIds(
            templates[0].node,
          ),
          cloneWithNewIds(
            templates[1].node,
          ),
          cloneWithNewIds(
            templates[2].node,
          ),
        ],
      },
    ],
  };
}

/*
 * Explicit return type is intentional.
 * This prevents the recursive TS7023 /
 * implicit-any error.
 */
function containsNode(
  item: ComponentNode,
  id: string,
): boolean {
  if (item.id === id) {
    return true;
  }

  const children: ComponentNode[] =
    item.children ?? [];

  return children.some(
    (
      child: ComponentNode,
    ): boolean =>
      containsNode(child, id),
  );
}

/*
 * Explicit recursive return type is intentional.
 * This prevents TypeScript from inferring
 * `any` through recursive calls.
 */
function mapNodes(
  nodes: ComponentNode[],
  mapper: (
    node: ComponentNode,
  ) => ComponentNode,
): ComponentNode[] {
  return nodes.map(
    (
      item: ComponentNode,
    ): ComponentNode => {
      const mapped: ComponentNode =
        mapper(item);

      if (!mapped.children) {
        return mapped;
      }

      return {
        ...mapped,
        children: mapNodes(
          mapped.children,
          mapper,
        ),
      };
    },
  );
}

function findNode(
  nodes: ComponentNode[],
  id: string,
): ComponentNode | null {
  for (
    const item of nodes
  ) {
    if (item.id === id) {
      return item;
    }

    const found:
      | ComponentNode
      | null = findNode(
      item.children ?? [],
      id,
    );

    if (found) {
      return found;
    }
  }

  return null;
}

function findParentId(
  nodes: ComponentNode[],
  childId: string,
): string | null {
  for (
    const item of nodes
  ) {
    if (
      (item.children ?? []).some(
        (
          child: ComponentNode,
        ): boolean =>
          child.id === childId,
      )
    ) {
      return item.id;
    }

    const found: string | null =
      findParentId(
        item.children ?? [],
        childId,
      );

    if (found !== null) {
      return found;
    }
  }

  return null;
}

function findChildren(
  nodes: ComponentNode[],
  parentId: string | null,
): ComponentNode[] {
  if (parentId === null) {
    return nodes;
  }

  return (
    findNode(
      nodes,
      parentId,
    )?.children ?? []
  );
}

function removeNodes(
  nodes: ComponentNode[],
  ids: Set<string>,
): {
  nodes: ComponentNode[];
  removed: ComponentNode[];
} {
  const removed: ComponentNode[] =
    [];

  const result: ComponentNode[] =
    [];

  for (
    const item of nodes
  ) {
    if (ids.has(item.id)) {
      removed.push(item);
      continue;
    }

    if (item.children) {
      const childResult =
        removeNodes(
          item.children,
          ids,
        );

      removed.push(
        ...childResult.removed,
      );

      result.push({
        ...item,
        children:
          childResult.nodes,
      });
    } else {
      result.push(item);
    }
  }

  return {
    nodes: result,
    removed,
  };
}

function insertAt(
  nodes: ComponentNode[],
  parentId: string | null,
  index: number,
  items: ComponentNode[],
): ComponentNode[] {
  if (parentId === null) {
    const result: ComponentNode[] =
      [...nodes];

    result.splice(
      Math.max(
        0,
        Math.min(
          index,
          result.length,
        ),
      ),
      0,
      ...items,
    );

    return result;
  }

  return nodes.map(
    (
      item: ComponentNode,
    ): ComponentNode => {
      if (item.id === parentId) {
        const children: ComponentNode[] =
          [...(item.children ?? [])];

        children.splice(
          Math.max(
            0,
            Math.min(
              index,
              children.length,
            ),
          ),
          0,
          ...items,
        );

        return {
          ...item,
          children,
        };
      }

      if (!item.children) {
        return item;
      }

      return {
        ...item,
        children: insertAt(
          item.children,
          parentId,
          index,
          items,
        ),
      };
    },
  );
}

function withColumns(
  node: ComponentNode,
): ComponentNode {
  const count = node.children?.length ?? 0;

  return {
    ...node,
    styles: {
      ...(node.styles ?? {}),
      display: "grid",
      gridAutoColumns: "minmax(0,1fr)",
      gridTemplateColumns:
        `repeat(${Math.max(2, count)},minmax(0,1fr))`,
      alignItems: "stretch",
    },
  };
}

function columnItem(
  item: ComponentNode,
  reference?: ComponentNode,
): ComponentNode {
  const source = reference?.styles ?? {};
  const current = item.styles ?? {};
  const compatibleSize = [
    "height",
    "minHeight",
    "maxHeight",
  ].reduce(
    (
      result: Record<string, unknown>,
      key: string,
    ): Record<string, unknown> =>
      source[key] !== undefined
        ? {
            ...result,
            [key]: source[key],
          }
        : result,
    {},
  );

  return {
    ...item,
    styles: {
      ...current,
      ...compatibleSize,
      width: "100%",
      minWidth: 0,
      maxWidth: "none",
    },
  };
}

function groupRootNodes(
  nodes: ComponentNode[],
  ids: Set<string>,
): ComponentNode[] {
  const selected = nodes.filter(
    (item: ComponentNode): boolean =>
      ids.has(item.id),
  );

  if (selected.length < 2) {
    return nodes;
  }

  const firstIndex = nodes.findIndex(
    (item: ComponentNode): boolean =>
      ids.has(item.id),
  );
  const remaining = nodes.filter(
    (item: ComponentNode): boolean =>
      !ids.has(item.id),
  );
  const reference = selected[0];
  const group = section(
    selected.map((item) =>
      columnItem(item, reference),
    ),
    {
    display: "grid",
      gridAutoColumns: "minmax(0,1fr)",
    gridTemplateColumns:
      `repeat(${selected.length},minmax(0,1fr))`,
      alignItems: "stretch",
    },
  );

  remaining.splice(firstIndex, 0, group);
  return remaining;
}

function applyColumnDrop(
  nodes: ComponentNode[],
  targetId: string,
  insertedIds: string[],
  referenceId = targetId,
): ComponentNode[] {
  const parentId = findParentId(
    nodes,
    targetId,
  );

  if (parentId !== null) {
    const parent = findNode(
      nodes,
      parentId,
    );

    if (parent?.type === "section") {
      return replaceNode(
        nodes,
        parentId,
        (sectionNode: ComponentNode): ComponentNode =>
          withColumns({
            ...sectionNode,
            children: (sectionNode.children ?? []).map(
              (item: ComponentNode): ComponentNode =>
                  columnItem(
                    item,
                    findNode(
                      sectionNode.children ?? [],
                      referenceId,
                  ) ?? sectionNode.children?.[0] ?? undefined,
                  ),
            ),
          }),
      );
    }
  }

  return groupRootNodes(
    nodes,
    new Set([targetId, ...insertedIds]),
  );
}

function placeDroppedNodes(
  nodes: ComponentNode[],
  target: DropTarget,
  items: ComponentNode[],
): ComponentNode[] {
  const reference = target.id
    ? findNode(nodes, target.id) ?? undefined
    : undefined;
  const normalizedItems =
    target.layout === "columns"
      ? items.map((item) =>
          columnItem(item, reference),
        )
      : items;
  const destination =
    target.position === "inside"
      ? target.id
      : target.parentId;
  const next = insertAt(
    nodes,
    destination,
    target.index,
    normalizedItems,
  );

  return target.layout === "columns" &&
    target.id
    ? applyColumnDrop(
        next,
        target.id,
        items.map(
          (item: ComponentNode): string =>
            item.id,
        ),
          target.id,
      )
    : next;
}

function replaceNode(
  nodes: ComponentNode[],
  id: string,
  updater: (
    node: ComponentNode,
  ) => ComponentNode,
): ComponentNode[] {
  return mapNodes(
    nodes,
    (
      item: ComponentNode,
    ): ComponentNode =>
      item.id === id
        ? updater(item)
        : item,
  );
}

function collectNodes(
  nodes: ComponentNode[],
  result: ComponentNode[] = [],
): ComponentNode[] {
  for (
    const item of nodes
  ) {
    result.push(item);

    if (item.children) {
      collectNodes(
        item.children,
        result,
      );
    }
  }

  return result;
}

function safeNumber(
  value: unknown,
  fallback = 0,
): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string"
  ) {
    const parsed = Number(value);

    if (
      Number.isFinite(parsed)
    ) {
      return parsed;
    }
  }

  return fallback;
}

function stringValue(
  value: unknown,
  fallback = "",
): string {
  return typeof value ===
    "string"
    ? value
    : fallback;
}

function getSiteSlug(
  site: Site,
): string {
  const candidate =
    (
      site as Site & {
        slug?: string;
      }
    ).slug;

  return (
    candidate ||
    slugify(site.name)
  );
}

function readSites(): Site[] {
  try {
    const raw =
      localStorage.getItem(
        STORAGE_SITES,
      );

    if (raw) {
      const parsed: unknown =
        JSON.parse(raw);

      if (Array.isArray(parsed)) {
        return parsed as Site[];
      }
    }

    const legacy =
      localStorage.getItem(
        STORAGE_LEGACY,
      );

    if (legacy) {
      return [
        JSON.parse(legacy) as Site,
      ];
    }
  } catch {
    return [];
  }

  return [];
}

export default function Editor({
  siteSlug: requestedSlug,
}: {
  siteSlug: string;
}) {
  const [site, setSite] =
    useState<Site | null>(null);

  const [activePageId, setActivePageId] =
    useState("");

  const [selectedIds, setSelectedIds] =
    useState<string[]>([]);

  const [pageSelected, setPageSelected] =
    useState(true);

  const [leftTab, setLeftTab] =
    useState<LeftTab>("components");

  const [device, setDevice] =
    useState<Device>("desktop");

  const [zoom, setZoom] =
    useState(75);

  const [pan, setPan] = useState({
    x: 0,
    y: 0,
  });

  const [search, setSearch] =
    useState("");

  const [history, setHistory] =
    useState<Site[]>([]);

  const [future, setFuture] =
    useState<Site[]>([]);

  const [dirty, setDirty] =
    useState(false);

  const [notice, setNotice] =
    useState("Saved");

  const [dropTarget, setDropTarget] =
    useState<DropTarget | null>(null);

  const [dragLabel, setDragLabel] =
    useState<string | null>(null);

  const [marquee, setMarquee] =
    useState<MarqueeState | null>(
      null,
    );

  const [resizeState, setResizeState] =
    useState<ResizeState | null>(
      null,
    );

  const [numericDrafts, setNumericDrafts] =
    useState<
      Record<string, string>
    >({});

  const [layoutTick, setLayoutTick] =
    useState(0);

  const canvasRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const uploadTarget =
    useRef<string | null>(null);

  const panState =
    useRef<{
      x: number;
      y: number;
      startX: number;
      startY: number;
    } | null>(null);

  const touchPoints =
    useRef<Map<number, { x: number; y: number }>>(
      new Map(),
    );

  const touchGesture =
    useRef<TouchGesture | null>(null);

  const activePage: SitePage | null =
    useMemo(() => {
      if (!site) {
        return null;
      }

      return (
        site.pages.find(
          (
            page: SitePage,
          ): boolean =>
            page.id ===
            activePageId,
        ) ??
        site.pages[0] ??
        null
      );
    }, [
      site,
      activePageId,
    ]);

  const allNodes: ComponentNode[] =
    useMemo(
      () =>
        collectNodes(
          activePage
            ?.components ?? [],
        ),
      [
        activePage,
        layoutTick,
      ],
    );

  const selectedNode:
    | ComponentNode
    | null =
    selectedIds.length === 1
      ? allNodes.find(
          (
            item: ComponentNode,
          ): boolean =>
            item.id ===
            selectedIds[0],
        ) ?? null
      : null;

  useEffect(() => {
    const sites = readSites();

    const list: Site[] =
      sites.length
        ? sites
        : [createInitialSite()];

    const wanted =
      requestedSlug.toLowerCase();

    const found =
      list.find(
        (item: Site): boolean => {
          const slug =
            getSiteSlug(
              item,
            ).toLowerCase();

          return (
            slug === wanted ||
            item.id ===
              requestedSlug ||
            slugify(item.name) ===
              wanted
          );
        },
      ) ?? null;

    if (!found) {
      setNotice(
        "Website not found",
      );
      return;
    }

    setSite(found);

    setActivePageId(
      found.pages[0]?.id ?? "",
    );
  }, [
    requestedSlug,
  ]);

  const commit = useCallback(
    (
      updater: (
        current: Site,
      ) => Site,
    ): void => {
      setSite(
        (
          current: Site | null,
        ): Site | null => {
          if (!current) {
            return current;
          }

          setHistory(
            (
              items: Site[],
            ): Site[] => [
              ...items.slice(-49),
              current,
            ],
          );

          setFuture([]);

          setDirty(true);

          setNotice(
            "Unsaved changes",
          );

          return updater(
            current,
          );
        },
      );
    },
    [],
  );

  const updatePage = useCallback(
    (
      updater: (
        page: SitePage,
      ) => SitePage,
    ): void => {
      commit(
        (
          current: Site,
        ): Site => ({
          ...current,
          pages:
            current.pages.map(
              (
                page: SitePage,
              ): SitePage =>
                page.id ===
                activePageId
                  ? updater(
                      page,
                    )
                  : page,
            ),
        }),
      );
    },
    [
      activePageId,
      commit,
    ],
  );

  const updateNode = useCallback(
    (
      nodeId: string,
      updater: (
        node: ComponentNode,
      ) => ComponentNode,
    ): void => {
      updatePage(
        (
          page: SitePage,
        ): SitePage => ({
          ...page,
          components:
            replaceNode(
              page.components,
              nodeId,
              updater,
            ),
        }),
      );
    },
    [updatePage],
  );

  const updateProp = useCallback(
    (
      nodeId: string,
      key: string,
      value: unknown,
    ): void => {
      updateNode(
        nodeId,
        (
          item: ComponentNode,
        ): ComponentNode => ({
          ...item,
          props: {
            ...item.props,
            [key]: value,
          },
        }),
      );
    },
    [updateNode],
  );

  const updateStyle = useCallback(
    (
      nodeId: string,
      key: string,
      value: unknown,
    ): void => {
      updateNode(
        nodeId,
        (
          item: ComponentNode,
        ): ComponentNode => ({
          ...item,
          styles: {
            ...(item.styles ?? {}),
            [key]: value,
          },
        }),
      );
    },
    [updateNode],
  );

  const updateLayoutMode = useCallback(
    (
      nodeId: string,
      mode: LayoutMode,
    ): void => {
      updateNode(
        nodeId,
        (
          item: ComponentNode,
        ): ComponentNode => ({
          ...item,
          layoutMode: mode,
        }),
      );
    },
    [updateNode],
  );

  const save = useCallback(
    (): void => {
      if (!site) {
        return;
      }

      try {
        const sites =
          readSites();

        const next =
          sites.some(
            (
              item: Site,
            ): boolean =>
              item.id ===
              site.id,
          )
            ? sites.map(
                (
                  item: Site,
                ): Site =>
                  item.id ===
                  site.id
                    ? site
                    : item,
              )
            : [
                ...sites,
                site,
              ];

        localStorage.setItem(
          STORAGE_SITES,
          JSON.stringify(next),
        );

        localStorage.setItem(
          STORAGE_LEGACY,
          JSON.stringify(site),
        );

        setDirty(false);
        setNotice("Saved");
      } catch {
        setNotice(
          "Save failed",
        );
      }
    },
    [site],
  );

  useEffect(() => {
    if (!dirty) {
      return;
    }

    const timer = window.setTimeout(() => {
      save();
    }, 900);

    return () => {
      window.clearTimeout(timer);
    };
  }, [dirty, save]);

  const undo = useCallback(
    (): void => {
      setHistory(
        (
          items: Site[],
        ): Site[] => {
          const previous =
            items[
              items.length - 1
            ];

          if (!previous) {
            return items;
          }

          setSite(
            (
              current: Site | null,
            ): Site | null => {
              if (current) {
                setFuture(
                  (
                    values: Site[],
                  ): Site[] => [
                    ...values,
                    current,
                  ],
                );
              }

              return previous;
            },
          );

          setDirty(true);
          setNotice(
            "Unsaved changes",
          );

          return items.slice(
            0,
            -1,
          );
        },
      );
    },
    [],
  );

  const redo = useCallback(
    (): void => {
      setFuture(
        (
          items: Site[],
        ): Site[] => {
          const next =
            items[
              items.length - 1
            ];

          if (!next) {
            return items;
          }

          setSite(
            (
              current: Site | null,
            ): Site | null => {
              if (current) {
                setHistory(
                  (
                    values: Site[],
                  ): Site[] => [
                    ...values,
                    current,
                  ],
                );
              }

              return next;
            },
          );

          setDirty(true);
          setNotice(
            "Unsaved changes",
          );

          return items.slice(
            0,
            -1,
          );
        },
      );
    },
    [],
  );

  const select = useCallback(
    (
      id: string,
      additive: boolean,
    ): void => {
      setPageSelected(false);

      setSelectedIds(
        (
          current: string[],
        ): string[] => {
          if (!additive) {
            return [id];
          }

          return current.includes(
            id,
          )
            ? current.filter(
                (
                  value: string,
                ): boolean =>
                  value !== id,
              )
            : [
                ...current,
                id,
              ];
        },
      );
    },
    [],
  );

  const deleteSelected =
    useCallback((): void => {
      if (!selectedIds.length) {
        return;
      }

      const ids =
        new Set(
          selectedIds,
        );

      updatePage(
        (
          page: SitePage,
        ): SitePage => ({
          ...page,
          components:
            removeNodes(
              page.components,
              ids,
            ).nodes,
        }),
      );

      setSelectedIds([]);
      setPageSelected(true);
    }, [
      selectedIds,
      updatePage,
    ]);

  const duplicateSelected =
    useCallback((): void => {
      if (
        !activePage ||
        !selectedIds.length
      ) {
        return;
      }

      const selected =
        selectedIds
          .map(
            (
              id: string,
            ): ComponentNode | null =>
              findNode(
                activePage.components,
                id,
              ),
          )
          .filter(
            (
              item:
                | ComponentNode
                | null,
            ): item is ComponentNode =>
              item !== null,
          );

      if (!selected.length) {
        return;
      }

      const parentId =
        findParentId(
          activePage.components,
          selected[0].id,
        );

      const siblings =
        findChildren(
          activePage.components,
          parentId,
        );

      const firstIndex =
        siblings.findIndex(
          (
            item: ComponentNode,
          ): boolean =>
            item.id ===
            selected[0].id,
        );

      const clones =
        selected.map(
          cloneWithNewIds,
        );

      updatePage(
        (
          page: SitePage,
        ): SitePage => ({
          ...page,
          components:
            insertAt(
              page.components,
              parentId,
              firstIndex + 1,
              clones,
            ),
        }),
      );

      setSelectedIds(
        clones.map(
          (
            item: ComponentNode,
          ): string =>
            item.id,
        ),
      );
    }, [
      activePage,
      selectedIds,
      updatePage,
    ]);

  const moveSelected =
    useCallback(
      (
        direction: -1 | 1,
      ): void => {
        if (!activePage || !selectedIds.length) {
          return;
        }

        const id = selectedIds[0];

        const parentId =
          findParentId(
            activePage.components,
            id,
          );

        const siblings =
          findChildren(
            activePage.components,
            parentId,
          );

        const selected = siblings.filter(
          (item: ComponentNode): boolean =>
            selectedIds.includes(item.id),
        );
        const indexes = selected.map((item) =>
          siblings.findIndex(
            (sibling) => sibling.id === item.id,
          ),
        );
        const nextIndex =
          direction < 0
            ? Math.min(...indexes) - 1
            : Math.max(...indexes) + 1;

        if (
          !selected.length ||
          nextIndex < 0 ||
          nextIndex >= siblings.length
        ) {
          return;
        }

        const reordered = siblings.filter(
          (item) => !selectedIds.includes(item.id),
        );
        const insertion = Math.max(
          0,
          Math.min(
            nextIndex -
              indexes.filter((index) => index < nextIndex).length,
            reordered.length,
          ),
        );
        reordered.splice(insertion, 0, ...selected);

        updatePage(
          (
            page: SitePage,
          ): SitePage =>
            parentId === null
              ? {
                  ...page,
                  components:
                    reordered,
                }
              : {
                  ...page,
                  components:
                    replaceNode(
                      page.components,
                      parentId,
                      (
                        parent:
                          ComponentNode,
                      ): ComponentNode => ({
                        ...parent,
                        children:
                          reordered,
                      }),
                    ),
                },
        );
      },
      [
        activePage,
        selectedIds,
        updatePage,
      ],
    );

  const ungroupSelected =
    useCallback((): void => {
      if (!activePage || selectedIds.length !== 1) {
        return;
      }

      const selected = findNode(
        activePage.components,
        selectedIds[0],
      );

      if (
        !selected ||
        selected.type !== "section" ||
        !selected.children?.length
      ) {
        return;
      }

      const parentId = findParentId(
        activePage.components,
        selected.id,
      );
      const siblings = findChildren(
        activePage.components,
        parentId,
      );
      const index = siblings.findIndex(
        (item) => item.id === selected.id,
      );
      const next = [...siblings];
      next.splice(index, 1, ...selected.children);

      updatePage((page) =>
        parentId === null
          ? { ...page, components: next }
          : {
              ...page,
              components: replaceNode(
                page.components,
                parentId,
                (parent) => ({
                  ...parent,
                  children: next,
                }),
              ),
            },
      );
      setSelectedIds(
        selected.children.map((item) => item.id),
      );
    }, [
      activePage,
      selectedIds,
      updatePage,
    ]);

  const groupSelected =
    useCallback((): void => {
      if (
        !activePage ||
        selectedIds.length < 2
      ) {
        return;
      }

      const parentId = findParentId(
        activePage.components,
        selectedIds[0],
      );

      if (
        selectedIds.some(
          (id: string): boolean =>
            findParentId(
              activePage.components,
              id,
            ) !== parentId,
        )
      ) {
        return;
      }

      const siblings = findChildren(
        activePage.components,
        parentId,
      );
      const selected = siblings.filter(
        (item: ComponentNode): boolean =>
          selectedIds.includes(item.id),
      );

      if (selected.length < 2) {
        return;
      }

      const firstIndex = siblings.findIndex(
        (item: ComponentNode): boolean =>
          selectedIds.includes(item.id),
      );
      const selectedSet = new Set(
        selectedIds,
      );
      const remaining = siblings.filter(
        (item: ComponentNode): boolean =>
          !selectedSet.has(item.id),
      );
      const grouped = section(selected, {
        display: "grid",
        gridTemplateColumns:
          `repeat(${selected.length},minmax(0,1fr))`,
      });

      remaining.splice(firstIndex, 0, grouped);

      updatePage(
        (page: SitePage): SitePage =>
          parentId === null
            ? {
                ...page,
                components: remaining,
              }
            : {
                ...page,
                components: replaceNode(
                  page.components,
                  parentId,
                  (parent: ComponentNode) => ({
                    ...parent,
                    children: remaining,
                  }),
                ),
              },
      );

      setSelectedIds([grouped.id]);
      setPageSelected(false);
    }, [
      activePage,
      selectedIds,
      updatePage,
    ]);

  const addComponent =
    useCallback(
      (
        type: ComponentType,
      ): void => {
        const fresh =
          makeComponent(type);

        updatePage(
          (
            page: SitePage,
          ): SitePage => ({
            ...page,
            components: [
              ...page.components,
              fresh,
            ],
          }),
        );

        setSelectedIds([
          fresh.id,
        ]);

        setPageSelected(false);
      },
      [updatePage],
    );

  const renameSite =
    useCallback((): void => {
      if (!site) {
        return;
      }

      const value =
        window.prompt(
          "Website name",
          site.name,
        );

      if (!value?.trim()) {
        return;
      }

      commit(
        (
          current: Site,
        ): Site => ({
          ...current,
          name: value.trim(),
        }),
      );
    }, [
      site,
      commit,
    ]);

  const addPage =
    useCallback((): void => {
      const page: SitePage = {
        id: newId(),
        name: "New Page",
        slug: "/new-page",
        margins: {
          top: 0,
          right: 32,
          bottom: 0,
          left: 32,
        },
        styles: {
          background:
            "var(--sytely-page)",
        },
        components: [
          makeComponent(
            "section",
          ),
        ],
      };

      commit(
        (
          current: Site,
        ): Site => ({
          ...current,
          pages: [
            ...current.pages,
            page,
          ],
        }),
      );

      setActivePageId(
        page.id,
      );

      setSelectedIds([]);
      setPageSelected(true);
    }, [commit]);

  const renamePage =
    useCallback(
      (
        pageId: string,
      ): void => {
        const page =
          site?.pages.find(
            (
              item: SitePage,
            ): boolean =>
              item.id ===
              pageId,
          );

        if (!page) {
          return;
        }

        const value =
          window.prompt(
            "Page name",
            page.name,
          );

        if (!value?.trim()) {
          return;
        }

        const name =
          value.trim();

        commit(
          (
            current: Site,
          ): Site => ({
            ...current,
            pages:
              current.pages.map(
                (
                  item: SitePage,
                ): SitePage =>
                  item.id ===
                  pageId
                    ? {
                        ...item,
                        name,
                        slug:
                          item.id ===
                          current
                            .pages[0]
                            ?.id
                            ? "/"
                            : `/${slugify(
                                name,
                              )}`,
                      }
                    : item,
              ),
          }),
        );
      },
      [site, commit],
    );

  const deletePage =
    useCallback(
      (
        pageId: string,
      ): void => {
        if (
          !site ||
          site.pages.length <=
            1
        ) {
          return;
        }

        if (
          !window.confirm(
            "Delete this page?",
          )
        ) {
          return;
        }

        const remaining =
          site.pages.filter(
            (
              page: SitePage,
            ): boolean =>
              page.id !==
              pageId,
          );

        commit(
          (
            current: Site,
          ): Site => ({
            ...current,
            pages: remaining,
          }),
        );

        if (
          activePageId ===
          pageId
        ) {
          setActivePageId(
            remaining[0].id,
          );
        }
      },
      [
        site,
        activePageId,
        commit,
      ],
    );

  const parseDrag =
    useCallback(
      (
        event: DragEvent,
      ): DragPayload | null => {
        const raw =
          event.dataTransfer.getData(
            "application/x-sytely",
          );

        if (!raw) {
          return null;
        }

        try {
          return JSON.parse(
            raw,
          ) as DragPayload;
        } catch {
          return null;
        }
      },
      [],
    );

  const startDrag =
    useCallback(
      (
        event: DragEvent,
        payload: DragPayload,
        label: string,
      ): void => {
        event.dataTransfer.effectAllowed =
          payload.kind ===
          "node"
            ? "move"
            : "copy";

        event.dataTransfer.setData(
          "application/x-sytely",
          JSON.stringify(
            payload,
          ),
        );

        setDragLabel(label);
      },
      [],
    );

  const computeDropTarget =
    useCallback(
      (
        event: DragEvent,
      ): DropTarget | null => {
        if (!activePage) {
          return null;
        }

        const element =
          document
            .elementsFromPoint(
              event.clientX,
              event.clientY,
            )
            .find(
              (
                item: Element,
              ): boolean =>
                Boolean(
                  (
                    item as HTMLElement
                  ).dataset
                    .sytelyId,
                ),
            ) as
            | HTMLElement
            | undefined;

        if (!element) {
          return {
            id: null,
            parentId: null,
            index:
              activePage
                .components
                .length,
            position: "after",
            layout: "stack",
            containerLabel: "Page",
            columnCount: 1,
            createsColumns: false,
          };
        }

        const id =
          element.dataset
            .sytelyId;

        if (!id) {
          return null;
        }

        const target =
          findNode(
            activePage.components,
            id,
          );

        if (!target) {
          return null;
        }

        const rect =
          element.getBoundingClientRect();

        const relX =
          rect.width
            ? (event.clientX -
                rect.left) /
              rect.width
            : 0.5;

        const relY =
          rect.height
            ? (event.clientY -
                rect.top) /
              rect.height
            : 0.5;

        const parentId =
          findParentId(
            activePage.components,
            id,
          );

        const siblings =
          findChildren(
            activePage.components,
            parentId,
          );

        const index =
          siblings.findIndex(
            (
              item: ComponentNode,
            ): boolean =>
              item.id === id,
          );

        /*
         * Dropping in the middle of a section
         * means "inside".
         */
        if (
          target.type ===
            "section" &&
          relY > 0.2 &&
          relY < 0.8
        ) {
          return {
            id,
            parentId: id,
            index:
              target.children
                ?.length ?? 0,
            position:
              "inside",
            layout: "inside",
            containerLabel: "Section",
            columnCount:
              (target.children?.length ?? 0) + 1,
            createsColumns:
              (target.children?.length ?? 0) >= 1,
          };
        }

        const beside =
          relX < 0.25 ||
          relX > 0.75;

        const before = beside
          ? relX < 0.5
          : relY < 0.5;

        return {
          id,
          parentId,
          index: before
            ? index
            : index + 1,
          position: before
            ? "before"
            : "after",
          layout: beside
            ? "columns"
            : "stack",
          containerLabel:
            parentId
              ? componentInfo[
                  findNode(
                    activePage.components,
                    parentId,
                  )?.type ?? "section"
                ].label
              : "Page",
          columnCount:
            parentId &&
            findNode(
              activePage.components,
              parentId,
            )?.type === "section"
              ? (findNode(
                  activePage.components,
                  parentId,
                )?.children?.length ?? 0) + 1
              : 1,
          createsColumns:
            Boolean(
              parentId &&
                findNode(
                  activePage.components,
                  parentId,
                )?.type === "section" &&
                (findNode(
                  activePage.components,
                  parentId,
                )?.children?.length ?? 0) >= 1,
            ),
        };
      },
      [activePage],
    );

  const handleDragOver =
    useCallback(
      (
        event: DragEvent,
      ): void => {
        event.preventDefault();

        const target =
          computeDropTarget(
            event,
          );

        if (target) {
          setDropTarget(
            target,
          );
        }

        const payload =
          parseDrag(event);

        event.dataTransfer.dropEffect =
          payload?.kind ===
          "node"
            ? "move"
            : "copy";
      },
      [
        computeDropTarget,
        parseDrag,
      ],
    );

  const handleDrop =
    useCallback(
      (
        event: DragEvent,
      ): void => {
        event.preventDefault();
        event.stopPropagation();

        const payload =
          parseDrag(event);

        const target =
          dropTarget ??
          computeDropTarget(
            event,
          );

        if (
          !payload ||
          !target ||
          !activePage
        ) {
          return;
        }

        const destination =
          target.position === "inside"
            ? target.id
            : target.parentId;

        const insertionIndex = target.index;

        if (
          payload.kind ===
          "component"
        ) {
          const fresh =
            makeComponent(
              payload.componentType,
            );

          commit(
            (
              current: Site,
            ): Site => ({
              ...current,
              pages:
                current.pages.map(
                  (
                    page: SitePage,
                  ): SitePage =>
                    page.id !==
                    activePageId
                      ? page
                      : {
                          ...page,
                          components: placeDroppedNodes(
                            page.components,
                            target,
                            [fresh],
                          ),
                        },
                ),
            }),
          );

          setSelectedIds([
            fresh.id,
          ]);
        } else if (
          payload.kind ===
          "template"
        ) {
          const template =
            templates.find(
              (
                item: Template,
              ): boolean =>
                item.id ===
                payload.templateId,
            );

          if (!template) {
            return;
          }

          const fresh =
            cloneWithNewIds(
              template.node,
            );

          commit(
            (
              current: Site,
            ): Site => ({
              ...current,
              pages:
                current.pages.map(
                  (
                    page: SitePage,
                  ): SitePage =>
                    page.id !==
                    activePageId
                      ? page
                      : {
                          ...page,
                          components: placeDroppedNodes(
                            page.components,
                            target,
                            [fresh],
                          ),
                        },
                ),
            }),
          );

          setSelectedIds([
            fresh.id,
          ]);
        } else {
          const moving =
            payload.nodeIds
              .map(
                (
                  id: string,
                ): ComponentNode | null =>
                  findNode(
                    activePage.components,
                    id,
                  ),
              )
              .filter(
                (
                  item:
                    | ComponentNode
                    | null,
                ): item is ComponentNode =>
                  item !== null,
              );

          if (!moving.length) {
            return;
          }

          if (
            target.id &&
            payload.nodeIds.some(
              (
                movingId: string,
              ): boolean =>
                movingId ===
                target.id,
            )
          ) {
            setDropTarget(
              null,
            );
            return;
          }

          if (
            target.id &&
            moving.some(
              (
                item: ComponentNode,
              ): boolean =>
                containsNode(
                  item,
                  target.id as string,
                ),
            )
          ) {
            setDropTarget(
              null,
            );
            return;
          }

          const movingIds =
            new Set(
              payload.nodeIds,
            );

          commit(
            (
              current: Site,
            ): Site => ({
              ...current,
              pages:
                current.pages.map(
                  (
                    page: SitePage,
                  ): SitePage => {
                    if (
                      page.id !==
                      activePageId
                    ) {
                      return page;
                    }

                    const originalSiblings =
                      findChildren(
                        page.components,
                        destination,
                      );

                    const removed =
                      removeNodes(
                        page.components,
                        movingIds,
                      );

                    const removedBefore =
                      originalSiblings
                        .slice(
                          0,
                          insertionIndex,
                        )
                        .filter(
                          (
                            item: ComponentNode,
                          ): boolean =>
                            movingIds.has(
                              item.id,
                            ),
                        ).length;

                    const adjustedIndex =
                      Math.max(
                        0,
                        target.index -
                          removedBefore,
                      );

                    let next =
                      insertAt(
                        removed.nodes,
                        destination,
                        adjustedIndex,
                        removed.removed,
                      );

                    if (
                      target.layout ===
                        "columns" &&
                      target.id
                    ) {
                      next =
                        applyColumnDrop(
                          next,
                          target.id,
                          removed.removed.map(
                            (
                              item: ComponentNode,
                            ): string =>
                              item.id,
                          ),
                        );
                    }

                    return {
                      ...page,
                      components:
                        next,
                    };
                  },
                ),
            }),
          );

          setSelectedIds(
            payload.nodeIds,
          );
        }

        setDropTarget(
          null,
        );
        setDragLabel(
          null,
        );
      },
      [
        activePage,
        activePageId,
        commit,
        computeDropTarget,
        dropTarget,
        parseDrag,
      ],
    );

  const startResize =
    useCallback(
      (
        event: ReactPointerEvent<HTMLButtonElement>,
      ): void => {
        event.preventDefault();
        event.stopPropagation();

        if (
          !site ||
          !selectedIds.length
        ) {
          return;
        }

        const widths: Record<
          string,
          number
        > = {};

        const heights: Record<
          string,
          number
        > = {};

        for (
          const id of selectedIds
        ) {
          const element =
            document.querySelector<HTMLElement>(
              `[data-sytely-id="${CSS.escape(
                id,
              )}"]`,
            );

          if (!element) {
            continue;
          }

          const rect =
            element.getBoundingClientRect();

          widths[id] =
            rect.width /
            (zoom / 100);

          heights[id] =
            rect.height /
            (zoom / 100);
        }

        setResizeState({
          ids: selectedIds,
          startX:
            event.clientX,
          startY:
            event.clientY,
          widths,
          heights,
          before: site,
        });
      },
      [
        selectedIds,
        site,
        zoom,
      ],
    );

  useEffect(() => {
    if (!resizeState) {
      return;
    }

    const move = (
      event: PointerEvent,
    ): void => {
      const dx =
        (event.clientX -
          resizeState.startX) /
        (zoom / 100);

      const dy =
        (event.clientY -
          resizeState.startY) /
        (zoom / 100);

      const ids =
        new Set(
          resizeState.ids,
        );

      setSite(
        (
          current: Site | null,
        ): Site | null => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            pages:
              current.pages.map(
                (
                  page: SitePage,
                ): SitePage =>
                  page.id !==
                  activePageId
                    ? page
                    : {
                        ...page,
                        components:
                          mapNodes(
                            page.components,
                            (
                              item: ComponentNode,
                            ): ComponentNode =>
                              ids.has(
                                item.id,
                              )
                                ? {
                                    ...item,
                                    styles:
                                      {
                                        ...(item.styles ??
                                          {}),
                                        width:
                                          Math.max(
                                            40,
                                            (resizeState
                                              .widths[
                                              item.id
                                            ] ??
                                              100) +
                                              dx,
                                          ),
                                        height:
                                          Math.max(
                                            30,
                                            (resizeState
                                              .heights[
                                              item.id
                                            ] ??
                                              60) +
                                              dy,
                                          ),
                                      },
                                  }
                                : item,
                          ),
                      },
              ),
          };
        },
      );

      setDirty(true);
      setNotice(
        "Unsaved changes",
      );
      setLayoutTick(
        (
          value: number,
        ): number =>
          value + 1,
      );
    };

    const up = (): void => {
      setHistory(
        (
          items: Site[],
        ): Site[] => [
          ...items.slice(-49),
          resizeState.before,
        ],
      );

      setFuture([]);
      setResizeState(null);
    };

    window.addEventListener(
      "pointermove",
      move,
    );

    window.addEventListener(
      "pointerup",
      up,
      {
        once: true,
      },
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        move,
      );

      window.removeEventListener(
        "pointerup",
        up,
      );
    };
  }, [
    resizeState,
    zoom,
    activePageId,
  ]);

  const startPan =
    useCallback(
      (
        event: ReactPointerEvent<HTMLDivElement>,
      ): void => {
        const shouldPan =
          event.button === 1 ||
          (event.button === 0 &&
            event.shiftKey);

        if (!shouldPan) {
          return;
        }

        event.preventDefault();

        panState.current = {
          x: pan.x,
          y: pan.y,
          startX:
            event.clientX,
          startY:
            event.clientY,
        };

        const move = (
          pointer: PointerEvent,
        ): void => {
          const state =
            panState.current;

          if (!state) {
            return;
          }

          setPan({
            x:
              state.x +
              pointer.clientX -
              state.startX,
            y:
              state.y +
              pointer.clientY -
              state.startY,
          });
        };

        const up = (): void => {
          panState.current =
            null;

          window.removeEventListener(
            "pointermove",
            move,
          );

          window.removeEventListener(
            "pointerup",
            up,
          );
        };

        window.addEventListener(
          "pointermove",
          move,
        );

        window.addEventListener(
          "pointerup",
          up,
          {
            once: true,
          },
        );
      },
      [pan],
    );

  const fitCanvas =
    useCallback((): void => {
      const canvas =
        canvasRef.current;

      if (!canvas) {
        return;
      }

      const width =
        device === "mobile"
          ? 390
          : device === "tablet"
            ? 768
            : 1180;

      const availableWidth =
        Math.max(
          320,
          canvas.clientWidth - 318,
        );

      const availableHeight =
        Math.max(
          420,
          canvas.clientHeight - 32,
        );

      const nextZoom = Math.max(
        30,
        Math.min(
          100,
          Math.floor(
            Math.min(
              availableWidth / width,
              availableHeight / 700,
            ) * 100,
          ),
        ),
      );

      setZoom(nextZoom);
      setPan({
        x: 0,
        y: 0,
      });
    }, [device]);

  useEffect(() => {
    fitCanvas();
  }, [activePageId, device, fitCanvas]);

  const handleCanvasWheel =
    useCallback(
      (event: React.WheelEvent<HTMLDivElement>): void => {
        if (!event.ctrlKey && !event.metaKey) {
          return;
        }

        event.preventDefault();
        setZoom(
          (value: number): number =>
            Math.max(
              30,
              Math.min(
                150,
                value -
                  Math.sign(event.deltaY) * 5,
              ),
            ),
        );
      },
      [],
    );

  const handleCanvasPointerDown =
    useCallback(
      (
        event: ReactPointerEvent<HTMLDivElement>,
      ): void => {
        if (event.pointerType !== "touch") {
          startPan(event);
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(
          event.pointerId,
        );

        touchPoints.current.set(
          event.pointerId,
          {
            x: event.clientX,
            y: event.clientY,
          },
        );

        const points = [
          ...touchPoints.current.values(),
        ];

        if (points.length === 1) {
          const point = points[0];

          touchGesture.current = {
            startPan: pan,
            startZoom: zoom,
            startPoint: point,
            startDistance: 0,
            startMidpoint: point,
          };
        } else if (points.length === 2) {
          const first = points[0];
          const second = points[1];

          touchGesture.current = {
            startPan: pan,
            startZoom: zoom,
            startPoint: first,
            startDistance: Math.hypot(
              second.x - first.x,
              second.y - first.y,
            ),
            startMidpoint: {
              x: (first.x + second.x) / 2,
              y: (first.y + second.y) / 2,
            },
          };
        }
      },
      [pan, startPan, zoom],
    );

  const handleCanvasPointerMove =
    useCallback(
      (
        event: ReactPointerEvent<HTMLDivElement>,
      ): void => {
        if (event.pointerType !== "touch") {
          return;
        }

        const point = {
          x: event.clientX,
          y: event.clientY,
        };

        if (!touchPoints.current.has(event.pointerId)) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        touchPoints.current.set(
          event.pointerId,
          point,
        );

        const points = [
          ...touchPoints.current.values(),
        ];
        const gesture = touchGesture.current;

        if (!gesture) {
          return;
        }

        if (points.length >= 2) {
          const first = points[0];
          const second = points[1];
          const distance = Math.hypot(
            second.x - first.x,
            second.y - first.y,
          );
          const midpoint = {
            x: (first.x + second.x) / 2,
            y: (first.y + second.y) / 2,
          };
          const ratio =
            gesture.startDistance > 0
              ? distance / gesture.startDistance
              : 1;

          setZoom(
            Math.max(
              30,
              Math.min(
                150,
                Math.round(
                  (gesture.startZoom * ratio) / 5,
                ) * 5,
              ),
            ),
          );
          setPan({
            x:
              gesture.startPan.x +
              midpoint.x -
                gesture.startMidpoint.x,
            y:
              gesture.startPan.y +
              midpoint.y -
                gesture.startMidpoint.y,
          });
          return;
        }

        setPan({
          x:
            gesture.startPan.x +
            point.x -
            gesture.startPoint.x,
          y:
            gesture.startPan.y +
            point.y -
            gesture.startPoint.y,
        });
      },
      [],
    );

  const handleCanvasPointerUp =
    useCallback(
      (
        event: ReactPointerEvent<HTMLDivElement>,
      ): void => {
        if (event.pointerType !== "touch") {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        touchPoints.current.delete(
          event.pointerId,
        );

        const remaining = [
          ...touchPoints.current.values(),
        ];

        if (remaining.length === 1) {
          touchGesture.current = {
            startPan: pan,
            startZoom: zoom,
            startPoint: remaining[0],
            startDistance: 0,
            startMidpoint: remaining[0],
          };
        } else if (!remaining.length) {
          touchGesture.current = null;
        }
      },
      [pan, zoom],
    );

  const startMarquee =
    useCallback(
      (
        event: ReactPointerEvent<HTMLDivElement>,
      ): void => {
        if (
          event.button !== 0 ||
          event.shiftKey
        ) {
          return;
        }

        const target =
          event.target as HTMLElement;

        if (
          target.closest(
            "[data-sytely-id],.editor-ui,.selection-overlay",
          )
        ) {
          return;
        }

        const canvas =
          canvasRef.current;

        if (!canvas) {
          return;
        }

        const rect =
          canvas.getBoundingClientRect();

        setMarquee({
          startX:
            event.clientX,
          startY:
            event.clientY,
          currentX:
            event.clientX,
          currentY:
            event.clientY,
        });

        const move = (
          pointer: PointerEvent,
        ): void => {
          setMarquee(
            (
              current:
                | MarqueeState
                | null,
            ): MarqueeState | null =>
              current
                ? {
                    ...current,
                    currentX:
                      pointer.clientX,
                    currentY:
                      pointer.clientY,
                  }
                : current,
          );
        };

        const up = (): void => {
          const current =
            marqueeRef.current;

          if (current) {
            const left =
              Math.min(
                current.startX,
                current.currentX,
              );

            const right =
              Math.max(
                current.startX,
                current.currentX,
              );

            const top =
              Math.min(
                current.startY,
                current.currentY,
              );

            const bottom =
              Math.max(
                current.startY,
                current.currentY,
              );

            const ids =
              allNodes
                .filter(
                  (
                    item: ComponentNode,
                  ): boolean => {
                    const element =
                      document.querySelector<HTMLElement>(
                        `[data-sytely-id="${CSS.escape(
                          item.id,
                        )}"]`,
                      );

                    if (!element) {
                      return false;
                    }

                    const elementRect =
                      element.getBoundingClientRect();

                    return (
                      elementRect.left <
                        right &&
                      elementRect.right >
                        left &&
                      elementRect.top <
                        bottom &&
                      elementRect.bottom >
                        top
                    );
                  },
                )
                .map(
                  (
                    item: ComponentNode,
                  ): string =>
                    item.id,
                );

            if (ids.length) {
              setSelectedIds(
                ids,
              );
              setPageSelected(
                false,
              );
            }
          }

          setMarquee(null);

          window.removeEventListener(
            "pointermove",
            move,
          );

          window.removeEventListener(
            "pointerup",
            up,
          );
        };

        marqueeRef.current = {
          startX:
            event.clientX,
          startY:
            event.clientY,
          currentX:
            event.clientX,
          currentY:
            event.clientY,
        };

        void rect;

        window.addEventListener(
          "pointermove",
          move,
        );

        window.addEventListener(
          "pointerup",
          up,
          {
            once: true,
          },
        );
      },
      [allNodes, marquee],
    );

  const marqueeRef =
    useRef<MarqueeState | null>(
      null,
    );

  useEffect(() => {
    marqueeRef.current =
      marquee;
  }, [marquee]);

  const uploadImage =
    useCallback(
      (
        nodeId: string,
      ): void => {
        uploadTarget.current =
          nodeId;

        fileInputRef.current?.click();
      },
      [],
    );

  const browseMedia =
    useCallback(
      (type: "image" | "video"): void => {
        const query = window.prompt(
          `${type === "image" ? "Image" : "Video"} search`,
          "",
        );

        if (!query?.trim()) {
          return;
        }

        const url =
          type === "image"
            ? `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`
            : `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

        window.open(
          url,
          "_blank",
          "noopener,noreferrer",
        );
      },
      [],
    );

  const onImageUpload =
    useCallback(
      (
        event: React.ChangeEvent<HTMLInputElement>,
      ): void => {
        const file =
          event.target.files?.[0];

        event.target.value = "";

        const target =
          uploadTarget.current;

        uploadTarget.current =
          null;

        if (
          !file ||
          !target ||
          !file.type.startsWith(
            "image/",
          )
        ) {
          return;
        }

        const reader =
          new FileReader();

        reader.onload = (): void => {
          if (
            typeof reader.result ===
            "string"
          ) {
            updateProp(
              target,
              "src",
              reader.result,
            );
          }
        };

        reader.readAsDataURL(
          file,
        );
      },
      [updateProp],
    );

  const openPreview =
    useCallback((): void => {
      if (
        !site ||
        !activePage
      ) {
        return;
      }

      const params =
        new URLSearchParams({
          page:
            activePage.slug,
          device,
        });

      window.open(
        `/${getSiteSlug(
          site,
        )}/preview?${params.toString()}`,
        "_blank",
        "noopener,noreferrer",
      );
    }, [
      site,
      activePage,
      device,
    ]);

  const openWebsiteSettings = useCallback((): void => {
    if (!site) {
      return;
    }

    window.location.href = `/${getSiteSlug(site)}/configure`;
  }, [site]);

  useEffect(() => {
    const keyboard = (
      event: KeyboardEvent,
    ): void => {
      const target =
        event.target as HTMLElement;

      const typing =
        target.matches(
          "input,textarea,select,[contenteditable=true]",
        );

      const modifier =
        event.metaKey ||
        event.ctrlKey;

      if (
        !typing &&
        modifier &&
        event.key.toLowerCase() ===
          "s"
      ) {
        event.preventDefault();
        save();
        return;
      }

      if (
        !typing &&
        modifier &&
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
        !typing &&
        modifier &&
        event.key.toLowerCase() ===
          "d"
      ) {
        event.preventDefault();
        duplicateSelected();
        return;
      }

      if (
        !typing &&
        (
          event.key ===
            "Delete" ||
          event.key ===
            "Backspace"
        )
      ) {
        event.preventDefault();
        deleteSelected();
        return;
      }

      if (
        !typing &&
        event.key ===
          "Escape"
      ) {
        setSelectedIds([]);
        setPageSelected(true);
        setDropTarget(null);
      }
    };

    window.addEventListener(
      "keydown",
      keyboard,
    );

    return () =>
      window.removeEventListener(
        "keydown",
        keyboard,
      );
  }, [
    save,
    undo,
    redo,
    duplicateSelected,
    deleteSelected,
  ]);

  if (
    !site ||
    !activePage
  ) {
    return (
      <main className="editor-loading">
        <div>
          <strong>
            {notice ===
            "Website not found"
              ? "Website not found"
              : "Loading editor…"}
          </strong>
          <a href="/mysites">
            Back to My Sites
          </a>
        </div>
      </main>
    );
  }

  const visibleComponents =
    (
      Object.keys(
        componentInfo,
      ) as ComponentType[]
    ).filter(
      (
        type: ComponentType,
      ): boolean =>
        componentInfo[
          type
        ].label
          .toLowerCase()
          .includes(
            search.toLowerCase(),
          ),
    );

  const canvasWidth =
    device === "mobile"
      ? 390
      : device === "tablet"
        ? 768
        : 1180;

  return (
    <div className="sytely-editor">
      <header className="editor-ui topbar">
        <a
          className="brand"
          href="/mysites"
        >
          <span>S</span>
          Sytely
        </a>

        <button
          className="site-name"
          type="button"
          onClick={
            renameSite
          }
        >
          {site.name}
          <span>⌄</span>
        </button>

        <div className="history-buttons">
          <button
            type="button"
            disabled={
              !history.length
            }
            onClick={undo}
            title="Undo"
          >
            ↶
          </button>

          <button
            type="button"
            disabled={
              !future.length
            }
            onClick={redo}
            title="Redo"
          >
            ↷
          </button>
        </div>

        <div className="devices">
          {(
            [
              "desktop",
              "tablet",
              "mobile",
            ] as Device[]
          ).map(
            (
              value: Device,
            ) => (
              <button
                key={value}
                type="button"
                className={
                  device ===
                  value
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setDevice(
                    value,
                  )
                }
              >
                {value}
              </button>
            ),
          )}
        </div>

        <span
          className={
            dirty
              ? "save-status dirty"
              : "save-status"
          }
        >
          {notice}
        </span>

        <button
          className="secondary"
          type="button"
          onClick={openWebsiteSettings}
        >
          Website settings
        </button>

        <button
          className="secondary"
          type="button"
          onClick={openPreview}
        >
          Preview
        </button>

        <button
          className="primary"
          type="button"
          onClick={save}
        >
          Save
        </button>
      </header>

      <div className="editor-body">
        <aside className="editor-ui library">
          <nav className="tabs">
            {(
              [
                "components",
                "templates",
                "pages",
                "layers",
              ] as LeftTab[]
            ).map(
              (
                tab: LeftTab,
              ) => (
                <button
                  key={tab}
                  type="button"
                  className={
                    leftTab ===
                    tab
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setLeftTab(
                      tab,
                    )
                  }
                >
                  {tab}
                </button>
              ),
            )}
          </nav>

          <div className="library-content">
            {leftTab ===
              "components" && (
              <>
                <h2>
                  Components
                </h2>

                <p>
                  Drag or click to
                  add.
                </p>

                <input
                  value={search}
                  onChange={(
                    event,
                  ) =>
                    setSearch(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Search components"
                />

                <div className="component-grid">
                  {visibleComponents.map(
                    (
                      type: ComponentType,
                    ) => (
                      <button
                        key={type}
                        type="button"
                        draggable
                        className="component-item"
                        onClick={() =>
                          addComponent(
                            type,
                          )
                        }
                        onDragStart={(
                          event,
                        ) =>
                          startDrag(
                            event,
                            {
                              kind:
                                "component",
                              componentType:
                                type,
                            },
                            componentInfo[
                              type
                            ].label,
                          )
                        }
                      >
                        <span>
                          {
                            componentInfo[
                              type
                            ].icon
                          }
                        </span>

                        <small>
                          {
                            componentInfo[
                              type
                            ].label
                          }
                        </small>
                      </button>
                    ),
                  )}
                </div>
              </>
            )}

            {leftTab ===
              "templates" && (
              <>
                <h2>
                  Templates
                </h2>

                <p>
                  Complete editable
                  sections.
                </p>

                {templates.map(
                  (
                    template: Template,
                  ) => (
                    <button
                      key={
                        template.id
                      }
                      type="button"
                      draggable
                      className="template-item"
                      onClick={() => {
                        const fresh =
                          cloneWithNewIds(
                            template.node,
                          );

                        updatePage(
                          (
                            page: SitePage,
                          ): SitePage => ({
                            ...page,
                            components: [
                              ...page.components,
                              fresh,
                            ],
                          }),
                        );

                        setSelectedIds(
                          [fresh.id],
                        );
                      }}
                      onDragStart={(
                        event,
                      ) =>
                        startDrag(
                          event,
                          {
                            kind:
                              "template",
                            templateId:
                              template.id,
                          },
                          template.name,
                        )
                      }
                    >
                      <strong>
                        {
                          template.name
                        }
                      </strong>

                      <span>
                        {
                          template.description
                        }
                      </span>
                    </button>
                  ),
                )}
              </>
            )}

            {leftTab ===
              "pages" && (
              <>
                <div className="panel-title">
                  <div>
                    <h2>
                      Pages
                    </h2>
                    <p>
                      Manage website
                      pages.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      addPage
                    }
                  >
                    +
                  </button>
                </div>

                {site.pages.map(
                  (
                    page: SitePage,
                  ) => (
                    <div
                      key={page.id}
                      className={
                        page.id ===
                        activePageId
                          ? "page-item active"
                          : "page-item"
                      }
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActivePageId(
                            page.id,
                          );
                          setSelectedIds(
                            [],
                          );
                          setPageSelected(
                            true,
                          );
                        }}
                      >
                        <strong>
                          {
                            page.name
                          }
                        </strong>

                        <span>
                          {
                            page.slug
                          }
                        </span>
                      </button>

                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            renamePage(
                              page.id,
                            )
                          }
                        >
                          …
                        </button>

                        <button
                          type="button"
                          disabled={
                            site.pages
                              .length <=
                            1
                          }
                          onClick={() =>
                            deletePage(
                              page.id,
                            )
                          }
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ),
                )}
              </>
            )}

            {leftTab ===
              "layers" && (
              <>
                <h2>
                  Layers
                </h2>

                <p>
                  Every rendered
                  element is selectable.
                </p>

                <LayerTree
                  nodes={
                    activePage.components
                  }
                  selectedIds={
                    selectedIds
                  }
                  onSelect={(
                    id: string,
                  ) => {
                    setSelectedIds(
                      [id],
                    );
                    setPageSelected(
                      false,
                    );
                  }}
                />
              </>
            )}
          </div>
        </aside>

        <main className="editor-main">
          <div className="editor-ui canvas-toolbar">
            <span>
              {
                activePage.name
              }

              <em>
                {
                  activePage.slug
                }
              </em>
            </span>

            <div>
              <button
                type="button"
                onClick={() =>
                  setZoom(
                    (
                      value: number,
                    ): number =>
                      Math.max(
                        30,
                        value - 5,
                      ),
                  )
                }
              >
                −
              </button>

              <span>
                {zoom}%
              </span>

              <input
                aria-label="Canvas zoom"
                type="range"
                min="30"
                max="150"
                step="5"
                value={zoom}
                onChange={(event) =>
                  setZoom(
                    Number(
                      event.target.value,
                    ),
                  )
                }
              />

              <button
                type="button"
                onClick={() =>
                  setZoom(
                    (
                      value: number,
                    ): number =>
                      Math.min(
                        150,
                        value + 5,
                      ),
                  )
                }
              >
                +
              </button>

              <button
                type="button"
                onClick={() => {
                  fitCanvas();
                }}
              >
                Fit
              </button>
            </div>
          </div>

          <div
            ref={canvasRef}
            className="canvas"
            onPointerDown={
              startPan
            }
            onPointerDownCapture={(event) => {
              if (event.pointerType === "touch") {
                handleCanvasPointerDown(event);
              } else {
                startMarquee(event);
              }
            }}
            onPointerMove={
              handleCanvasPointerMove
            }
            onPointerUp={
              handleCanvasPointerUp
            }
            onPointerCancel={
              handleCanvasPointerUp
            }
            onWheel={handleCanvasWheel}
            onDragOver={
              handleDragOver
            }
            onDragLeave={() =>
              setDropTarget(
                null,
              )
            }
            onDrop={handleDrop}
          >
            <div
              className="canvas-world"
              style={{
                width: canvasWidth,
                transform:
                  `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom / 100})`,
              }}
            >
              <div
                className="website-page"
                style={{
                  background:
                    stringValue(
                      activePage
                        .styles
                        ?.background,
                      "var(--sytely-page)",
                    ),
                  paddingTop:
                    safeNumber(
                      activePage
                        .margins
                        .top,
                    ),
                  paddingRight:
                    safeNumber(
                      activePage
                        .margins
                        .right,
                      32,
                    ),
                  paddingBottom:
                    safeNumber(
                      activePage
                        .margins
                        .bottom,
                    ),
                  paddingLeft:
                    safeNumber(
                      activePage
                        .margins
                        .left,
                      32,
                    ),
                }}
              >
                {activePage.components.map(
                  (
                    item: ComponentNode,
                  ) => (
                    <EditorNode
                      key={item.id}
                      item={item}
                      device={
                        device
                      }
                      selectedIds={
                        selectedIds
                      }
                      onSelect={
                        select
                      }
                      onDragStart={
                        startDrag
                      }
                    />
                  ),
                )}

                {pageSelected && (
                  <div className="page-selection">
                    Page
                  </div>
                )}
              </div>
            </div>

            {dropTarget && (
              <DropIndicator
                target={dropTarget}
              />
            )}

            {marquee && (
              <MarqueeBox
                state={marquee}
                canvasRef={
                  canvasRef
                }
              />
            )}
          </div>

          {dragLabel && (
            <div className="drag-label editor-ui">
              {dragLabel}
            </div>
          )}

          {selectedNode && (
            <SelectionOverlay
              nodeIds={
                selectedIds
              }
              onResize={
                startResize
              }
            />
          )}

          {selectedIds.length > 0 && (
            <div className="floating-toolbar editor-ui">
              <span>
                {
                  selectedIds.length
                }{" "}
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

              {selectedIds.length > 1 && (
                <button
                  type="button"
                  onClick={
                    groupSelected
                  }
                >
                  Group columns
                </button>
              )}

              {selectedIds.length === 1 &&
                selectedNode?.type === "section" &&
                Boolean(selectedNode.children?.length) && (
                  <button
                    type="button"
                    onClick={
                      ungroupSelected
                    }
                  >
                    Ungroup
                  </button>
                )}

              <button
                type="button"
                onClick={() =>
                  moveSelected(
                    -1,
                  )
                }
              >
                ↑
              </button>

              <button
                type="button"
                onClick={() =>
                  moveSelected(
                    1,
                  )
                }
              >
                ↓
              </button>

              <button
                type="button"
                className="danger"
                onClick={
                  deleteSelected
                }
              >
                Delete
              </button>
            </div>
          )}
        </main>

        <Inspector
          node={selectedNode}
          selectedNodes={selectedIds
            .map((id) =>
              allNodes.find(
                (item) => item.id === id,
              ),
            )
            .filter(
              (item): item is ComponentNode =>
                Boolean(item),
            )}
          updateProp={updateProp}
          updateStyle={updateStyle}
          updateLayoutMode={updateLayoutMode}
          uploadImage={uploadImage}
          browseMedia={browseMedia}
          numericDrafts={numericDrafts}
          setNumericDrafts={setNumericDrafts}
        />
      </div>

      <input
        ref={fileInputRef}
        hidden
        type="file"
        accept="image/*"
        onChange={
          onImageUpload
        }
      />
    </div>
  );
}

function EditorNode({
  item,
  device,
  selectedIds,
  onSelect,
  onDragStart,
}: {
  item: ComponentNode;
  device: Device;
  selectedIds: string[];
  onSelect: (
    id: string,
    additive: boolean,
  ) => void;
  onDragStart: (
    event: DragEvent,
    payload: DragPayload,
    label: string,
  ) => void;
}): ReactElement {
  /*
   * Children are rendered recursively through
   * the renderer itself. This keeps the real
   * rendered DOM hierarchy intact.
   */
  const children: ReactNode =
    item.children?.map(
      (
        child: ComponentNode,
      ): ReactNode => (
        <EditorNode
          key={child.id}
          item={child}
          device={device}
          selectedIds={
            selectedIds
          }
          onSelect={onSelect}
          onDragStart={
            onDragStart
          }
        />
      ),
    );

  const rendered =
    renderNode(item, {
      device,
      children,
    });

  if (
    !rendered ||
    typeof rendered !==
      "object"
  ) {
    return (
      <div
        data-sytely-id={
          item.id
        }
      >
        {children}
      </div>
    );
  }

  const element =
    rendered as ReactElement<
      Record<string, unknown>
    >;

  const originalClass =
    typeof element.props
      .className ===
    "string"
      ? element.props.className
      : "";

  const selected =
    selectedIds.includes(
      item.id,
    );

  const className =
    [
      originalClass,
      "sytely-editor-target",
      selected
        ? "is-selected"
        : "",
    ]
      .filter(Boolean)
      .join(" ");

  /*
   * Crucially, this clones the ACTUAL
   * renderer element.
   *
   * For a button, the DOM element remains
   * <button> / <a>, not <div><button /></div>.
   */
  return cloneElement(
    element,
    {
      className,
      draggable: true,

      onClick: (
        event: ReactMouseEvent<HTMLElement>,
      ): void => {
        event.stopPropagation();

        onSelect(
          item.id,
          event.metaKey ||
            event.ctrlKey ||
            event.shiftKey,
        );

        const original =
          element.props
            .onClick;

        if (
          typeof original ===
          "function"
        ) {
          original(event);
        }
      },

      onDragStart: (
        event: DragEvent,
      ): void => {
        onDragStart(
          event,
          {
            kind: "node",
            nodeIds:
              selectedIds.includes(
                item.id,
              )
                ? selectedIds
                : [item.id],
          },
          componentInfo[
            item.type
          ].label,
        );
      },
    },
  );
}

function LayerTree({
  nodes,
  selectedIds,
  onSelect,
  depth = 0,
}: {
  nodes: ComponentNode[];
  selectedIds: string[];
  onSelect: (
    id: string,
  ) => void;
  depth?: number;
}): ReactElement {
  return (
    <div className="layer-tree">
      {nodes.map(
        (
          item: ComponentNode,
        ) => (
          <div
            key={item.id}
          >
            <button
              type="button"
              className={
                selectedIds.includes(
                  item.id,
                )
                  ? "layer active"
                  : "layer"
              }
              style={{
                paddingLeft:
                  10 +
                  depth * 14,
              }}
              onClick={() =>
                onSelect(
                  item.id,
                )
              }
            >
              <span>
                {
                  componentInfo[
                    item.type
                  ].icon
                }
              </span>

              {
                componentInfo[
                  item.type
                ].label
              }
            </button>

            {item.children
              ?.length ? (
              <LayerTree
                nodes={
                  item.children
                }
                selectedIds={
                  selectedIds
                }
                onSelect={
                  onSelect
                }
                depth={
                  depth + 1
                }
              />
            ) : null}
          </div>
        ),
      )}
    </div>
  );
}

function DropIndicator({
  target,
}: {
  target: DropTarget;
}): ReactElement | null {
  const [rect, setRect] =
    useState<DOMRect | null>(null);

  useEffect(() => {
    const update = (): void => {
      const element = target.id
        ? document.querySelector<HTMLElement>(
            `[data-sytely-id="${CSS.escape(
              target.id,
            )}"]`,
          )
        : document.querySelector<HTMLElement>(
            ".website-page",
          );

      setRect(
        element?.getBoundingClientRect() ?? null,
      );
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [target.id]);

  if (!rect) {
    return null;
  }

  const line =
    target.position !== "inside";
  const columns =
    target.layout === "columns";

  return (
    <div
      className={`drop-indicator ${target.position} ${target.layout}`}
      data-drop-id={target.id ?? "page"}
      style={{
        position: "fixed",
        left: columns && target.position === "after"
          ? rect.right
          : rect.left,
        top:
          columns
            ? rect.top
            : line && target.position === "after"
            ? rect.bottom
            : rect.top,
        width: columns ? 3 : rect.width,
        height: columns ? rect.height : line ? 3 : rect.height,
      }}
    >
      <strong>
        {target.position === "inside"
          ? "Add inside"
          : target.position === "before"
            ? "Place before"
            : "Place after"}
      </strong>
      <span>
        {target.containerLabel}
        {target.columnCount > 1
          ? ` · ${target.columnCount} columns`
          : ""}
        {target.createsColumns
          ? " · Creates a column group"
          : ""}
      </span>
    </div>
  );
}

function MarqueeBox({
  state,
}: {
  state: MarqueeState;
  canvasRef: React.RefObject<
    HTMLDivElement | null
  >;
}): ReactElement {
  const left = Math.min(
    state.startX,
    state.currentX,
  );

  const top = Math.min(
    state.startY,
    state.currentY,
  );

  const width = Math.abs(
    state.currentX -
      state.startX,
  );

  const height = Math.abs(
    state.currentY -
      state.startY,
  );

  return (
    <div
      className="marquee"
      style={{
        left,
        top,
        width,
        height,
      }}
    />
  );
}

function SelectionOverlay({
  nodeIds,
  onResize,
}: {
  nodeIds: string[];
  onResize: (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => void;
}): ReactElement | null {
  const [, forceUpdate] =
    useState(0);

  useEffect(() => {
    const update =
      (): void =>
        forceUpdate(
          (
            value: number,
          ): number =>
            value + 1,
        );

    window.addEventListener(
      "resize",
      update,
    );

    window.addEventListener(
      "scroll",
      update,
      true,
    );

    return () => {
      window.removeEventListener(
        "resize",
        update,
      );

      window.removeEventListener(
        "scroll",
        update,
        true,
      );
    };
  }, []);

  const elements =
    nodeIds
      .map(
        (
          id: string,
        ): HTMLElement | null =>
          document.querySelector<HTMLElement>(
            `[data-sytely-id="${CSS.escape(
              id,
            )}"]`,
          ),
      )
      .filter(
        (
          item:
            | HTMLElement
            | null,
        ): item is HTMLElement =>
          item !== null,
      );

  if (!elements.length) {
    return null;
  }

  const rects =
    elements.map(
      (
        element: HTMLElement,
      ): DOMRect =>
        element.getBoundingClientRect(),
    );

  const left =
    Math.min(
      ...rects.map(
        (
          rect: DOMRect,
        ): number =>
          rect.left,
      ),
    );

  const top =
    Math.min(
      ...rects.map(
        (
          rect: DOMRect,
        ): number =>
          rect.top,
      ),
    );

  const right =
    Math.max(
      ...rects.map(
        (
          rect: DOMRect,
        ): number =>
          rect.right,
      ),
    );

  const bottom =
    Math.max(
      ...rects.map(
        (
          rect: DOMRect,
        ): number =>
          rect.bottom,
      ),
    );

  return (
    <div
      className="selection-overlay"
      style={{
        left,
        top,
        width:
          right - left,
        height:
          bottom - top,
      }}
    >
      <span className="selection-tag">
        {nodeIds.length > 1
          ? `${nodeIds.length} items`
          : "Selected"}
      </span>

      <button
        className="resize-handle"
        type="button"
        aria-label="Resize"
        onPointerDown={
          onResize
        }
      />
    </div>
  );
}

function Inspector({
  node,
  selectedNodes,
  updateProp,
  updateStyle,
  updateLayoutMode,
  uploadImage,
  browseMedia,
  numericDrafts,
  setNumericDrafts,
}: {
  node: ComponentNode | null;
  selectedNodes: ComponentNode[];
  updateProp: (
    id: string,
    key: string,
    value: unknown,
  ) => void;
  updateStyle: (
    id: string,
    key: string,
    value: unknown,
  ) => void;
  updateLayoutMode: (
    id: string,
    mode: LayoutMode,
  ) => void;
  uploadImage: (
    id: string,
  ) => void;
  browseMedia: (
    type: "image" | "video",
  ) => void;
  numericDrafts: Record<
    string,
    string
  >;
  setNumericDrafts: React.Dispatch<
    React.SetStateAction<
      Record<string, string>
    >
  >;
}): ReactElement {
  if (selectedNodes.length > 1) {
    return (
      <MultiInspector
        nodes={selectedNodes}
        updateStyle={updateStyle}
      />
    );
  }

  if (!node) {
    return (
      <aside className="floating-inspector inspector-empty editor-ui">
        <div className="inspector-head">
          <strong>Inspector</strong>
          <span>Page settings</span>
        </div>

        <section>
          <div className="inspector-empty-icon">+</div>
          <h3>Select an element</h3>
          <p>
            Choose a component on the canvas to edit its content, layout, and style.
          </p>
        </section>
      </aside>
    );
  }

  const textProp = (
    key: string,
    fallback = "",
  ): string =>
    stringValue(
      node.props[key],
      fallback,
    );

  const numberField = (
    key: string,
    fallback: number,
  ): ReactElement => {
    const draftKey =
      `${node.id}:${key}`;

    const committed =
      safeNumber(
        node.styles?.[key],
        fallback,
      );

    const value =
      numericDrafts[
        draftKey
      ] ??
      String(committed);

    return (
      <label className="field">
        <span>
          {key}
        </span>

        <input
          inputMode="decimal"
          value={value}
          onChange={(
            event,
          ) => {
            const text =
              event.target.value;

            setNumericDrafts(
              (
                current: Record<
                  string,
                  string
                >,
              ): Record<
                string,
                string
              > => ({
                ...current,
                [draftKey]:
                  text,
              }),
            );

            /*
             * Never write NaN into the
             * actual component styles.
             */
            if (
              text === ""
            ) {
              return;
            }

            const parsed =
              Number(text);

            if (
              Number.isFinite(
                parsed,
              )
            ) {
              updateStyle(
                node.id,
                key,
                parsed,
              );
            }
          }}
          onBlur={() => {
            const text =
              numericDrafts[
                draftKey
              ] ??
              String(
                committed,
              );

            const parsed =
              Number(text);

            setNumericDrafts(
              (
                current: Record<
                  string,
                  string
                >,
              ): Record<
                string,
                string
              > => {
                const next = {
                  ...current,
                };

                delete next[
                  draftKey
                ];

                return next;
              },
            );

            if (
              Number.isFinite(
                parsed,
              )
            ) {
              updateStyle(
                node.id,
                key,
                parsed,
              );
            }
          }}
        />
      </label>
    );
  };

  return (
    <aside className="floating-inspector editor-ui">
      <div className="inspector-head">
        <strong>
          {
            componentInfo[
              node.type
            ].label
          }
        </strong>

        <span>
          Selected element
        </span>
      </div>

      <section>
        <h3>
          Content
        </h3>

        {node.type ===
          "heading" && (
          <TextField
            label="Text"
            value={textProp(
              "text",
            )}
            onChange={(
              value: string,
            ) =>
              updateProp(
                node.id,
                "text",
                value,
              )
            }
          />
        )}

        {node.type ===
          "text" && (
          <TextArea
            label="Text"
            value={textProp(
              "text",
            )}
            onChange={(
              value: string,
            ) =>
              updateProp(
                node.id,
                "text",
                value,
              )
            }
          />
        )}

        {node.type ===
          "button" && (
          <>
            <TextField
              label="Label"
              value={textProp(
                "text",
                "Button",
              )}
              onChange={(
                value: string,
              ) =>
                updateProp(
                  node.id,
                  "text",
                  value,
                )
              }
            />

            <TextField
              label="Link"
              value={textProp(
                "linkTo",
                "#",
              )}
              onChange={(
                value: string,
              ) =>
                updateProp(
                  node.id,
                  "linkTo",
                  value,
                )
              }
            />
          </>
        )}

        {node.type ===
          "image" && (
          <>
            <TextField
              label="Image URL"
              value={textProp(
                "src",
              )}
              onChange={(
                value: string,
              ) =>
                updateProp(
                  node.id,
                  "src",
                  value,
                )
              }
            />

            <TextField
              label="Alt"
              value={textProp(
                "alt",
                "Image",
              )}
              onChange={(
                value: string,
              ) =>
                updateProp(
                  node.id,
                  "alt",
                  value,
                )
              }
            />

            <button
              type="button"
              className="upload"
              onClick={() =>
                uploadImage(
                  node.id,
                )
              }
            >
              Upload image
            </button>

            <button
              type="button"
              className="upload"
              onClick={() =>
                browseMedia("image")
              }
            >
              Browse the web
            </button>
          </>
        )}

        {node.type ===
          "video" && (
          <>
            <TextField
              label="Video URL"
              value={textProp(
                "src",
              )}
              onChange={(
                value: string,
              ) =>
                updateProp(
                  node.id,
                  "src",
                  value,
                )
              }
            />

            <button
              type="button"
              className="upload"
              onClick={() =>
                browseMedia("video")
              }
            >
              Browse the web
            </button>
          </>
        )}

        {node.type ===
          "logo" && (
          <TextField
            label="Text"
            value={textProp(
              "text",
              "Sytely",
            )}
            onChange={(
              value: string,
            ) =>
              updateProp(
                node.id,
                "text",
                value,
              )
            }
          />
        )}

        {node.type ===
          "icon" && (
          <TextField
            label="Icon"
            value={textProp(
              "icon",
              "✦",
            )}
            onChange={(
              value: string,
            ) =>
              updateProp(
                node.id,
                "icon",
                value,
              )
            }
          />
        )}

        {node.type ===
          "card" && (
          <>
            <TextField
              label="Title"
              value={textProp(
                "title",
              )}
              onChange={(
                value: string,
              ) =>
                updateProp(
                  node.id,
                  "title",
                  value,
                )
              }
            />

            <TextArea
              label="Text"
              value={textProp(
                "text",
              )}
              onChange={(
                value: string,
              ) =>
                updateProp(
                  node.id,
                  "text",
                  value,
                )
              }
            />
          </>
        )}

        {node.type ===
          "form" && (
          <>
            <TextField
              label="Title"
              value={textProp(
                "title",
              )}
              onChange={(
                value: string,
              ) =>
                updateProp(
                  node.id,
                  "title",
                  value,
                )
              }
            />

            <TextField
              label="Submit label"
              value={textProp(
                "submitLabel",
                "Send message",
              )}
              onChange={(
                value: string,
              ) =>
                updateProp(
                  node.id,
                  "submitLabel",
                  value,
                )
              }
            />
          </>
        )}
      </section>

      <section>
        <h3>
          Layout
        </h3>

        {numberField(
          "width",
          0,
        )}

        {numberField(
          "maxWidth",
          0,
        )}

        {numberField(
          "gap",
          24,
        )}

        {numberField(
          "paddingTop",
          0,
        )}

        {numberField(
          "paddingRight",
          0,
        )}

        {numberField(
          "paddingBottom",
          0,
        )}

        {numberField(
          "paddingLeft",
          0,
        )}

        {node.type ===
          "section" && (
          <>
            <SelectField
              label="Direction"
              value={stringValue(
                node.styles
                  ?.flexDirection,
                "column",
              )}
              options={[
                "column",
                "row",
              ]}
              onChange={(
                value: string,
              ) =>
                updateStyle(
                  node.id,
                  "flexDirection",
                  value,
                )
              }
            />

            <SelectField
              label="Columns"
              value={stringValue(
                node.styles
                  ?.gridTemplateColumns,
                "1fr",
              )}
              options={[
                "1fr",
                "repeat(2,minmax(0,1fr))",
                "repeat(3,minmax(0,1fr))",
                "repeat(4,minmax(0,1fr))",
                "repeat(5,minmax(0,1fr))",
                "repeat(6,minmax(0,1fr))",
              ]}
              onChange={(
                value: string,
              ) => {
                updateStyle(
                  node.id,
                  "display",
                  "grid",
                );

                updateStyle(
                  node.id,
                  "gridTemplateColumns",
                  value,
                );
              }}
            />
          </>
        )}
      </section>

      <section>
        <h3>
          Typography
        </h3>

        {numberField(
          "fontSize",
          16,
        )}

        {numberField(
          "fontWeight",
          400,
        )}

        {numberField(
          "lineHeight",
          1.5,
        )}

        <SelectField
          label="Text align"
          value={stringValue(
            node.styles
              ?.textAlign,
            "left",
          )}
          options={[
            "left",
            "center",
            "right",
          ]}
          onChange={(
            value: string,
          ) =>
            updateStyle(
              node.id,
              "textAlign",
              value,
            )
          }
        />
      </section>

      <section>
        <h3>
          Appearance
        </h3>

        <TextField
          label="Background"
          value={stringValue(
            node.styles
              ?.background,
          )}
          onChange={(
            value: string,
          ) =>
            updateStyle(
              node.id,
              "background",
              value,
            )
          }
        />

        {numberField(
          "borderRadius",
          0,
        )}

        <TextField
          label="Color"
          value={stringValue(
            node.styles
              ?.color,
          )}
          onChange={(
            value: string,
          ) =>
            updateStyle(
              node.id,
              "color",
              value,
            )
          }
        />
      </section>

      <section>
        <h3>
          Advanced
        </h3>

        <SelectField
          label="Layout mode"
          value={node.layoutMode ?? "inherit"}
          options={[
            "inherit",
            "sytely",
            "custom",
          ]}
          onChange={(value: string) =>
            updateLayoutMode(
              node.id,
              value as LayoutMode,
            )
          }
        />

        <p className="inspector-hint">
          Inherit follows the website layout. Sytely and Custom override it for this component.
        </p>
      </section>
    </aside>
  );
}

function MultiInspector({
  nodes,
  updateStyle,
}: {
  nodes: ComponentNode[];
  updateStyle: (
    id: string,
    key: string,
    value: unknown,
  ) => void;
}): ReactElement {
  const setStyle = (
    key: string,
    value: unknown,
  ): void => {
    nodes.forEach((node) =>
      updateStyle(node.id, key, value),
    );
  };

  const changeSize = (delta: number): void => {
    nodes.forEach((node) => {
      const current = safeNumber(
        node.styles?.width,
        100,
      );

      updateStyle(
        node.id,
        "width",
        Math.max(20, current + delta),
      );
    });
  };

  return (
    <aside className="floating-inspector editor-ui">
      <div className="inspector-head">
        <strong>{nodes.length} elements</strong>
        <span>Multi-selection</span>
      </div>

      <section>
        <h3>Align</h3>
        <div className="inspector-actions">
          {[
            ["left", "Align left"],
            ["center", "Align center"],
            ["right", "Align right"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              title={label}
              onClick={() =>
                setStyle("textAlign", value)
              }
            >
              {value === "left"
                ? "≡"
                : value === "center"
                  ? "☷"
                  : "≡"}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3>Size</h3>
        <div className="inspector-actions">
          <button
            type="button"
            onClick={() => changeSize(-10)}
          >
            Smaller
          </button>
          <button
            type="button"
            onClick={() => changeSize(10)}
          >
            Larger
          </button>
        </div>
        <p className="inspector-hint">
          Adjusts compatible widths while preserving each element&apos;s content.
        </p>
      </section>
    </aside>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
}): ReactElement {
  return (
    <label className="field">
      <span>
        {label}
      </span>

      <input
        value={value}
        onChange={(
          event,
        ) =>
          onChange(
            event.target.value,
          )
        }
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
}): ReactElement {
  return (
    <label className="field">
      <span>
        {label}
      </span>

      <textarea
        rows={4}
        value={value}
        onChange={(
          event,
        ) =>
          onChange(
            event.target.value,
          )
        }
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (
    value: string,
  ) => void;
}): ReactElement {
  return (
    <label className="field">
      <span>
        {label}
      </span>

      <select
        value={value}
        onChange={(
          event,
        ) =>
          onChange(
            event.target.value,
          )
        }
      >
        {options.map(
          (
            option: string,
          ) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ),
        )}
      </select>
    </label>
  );
}