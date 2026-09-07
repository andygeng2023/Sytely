"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type Dispatch,
  type DragEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import { renderNode } from "@sytely/renderer";
import type {
  ComponentNode,
  ComponentType,
  Site,
  SitePage,
} from "@sytely/types";
import "./editor.css";

type Device = "desktop" | "tablet" | "mobile";

type DragPayload =
  | {
      kind: "component";
      type: ComponentType;
    }
  | {
      kind: "node";
      nodeIds: string[];
    };

const STORAGE_SITES = "sytely-sites";
const STORAGE_LEGACY = "sytely-site";

const COMPONENTS: Array<{
  type: ComponentType;
  label: string;
  icon: string;
}> = [
  { type: "section", label: "Section", icon: "▦" },
  { type: "heading", label: "Heading", icon: "T" },
  { type: "text", label: "Text", icon: "≡" },
  { type: "button", label: "Button", icon: "→" },
  { type: "image", label: "Image", icon: "▧" },
  { type: "video", label: "Video", icon: "▶" },
  { type: "gallery", label: "Gallery", icon: "▥" },
  { type: "divider", label: "Divider", icon: "—" },
  { type: "icon", label: "Icon", icon: "✦" },
  { type: "logo", label: "Logo", icon: "◎" },
  { type: "menu", label: "Menu", icon: "☰" },
  { type: "social", label: "Social", icon: "●" },
  { type: "form", label: "Form", icon: "□" },
  { type: "card", label: "Card", icon: "▣" },
  { type: "features", label: "Features", icon: "◆" },
  { type: "pricing", label: "Pricing", icon: "$" },
  { type: "testimonial", label: "Testimonial", icon: "“" },
  { type: "faq", label: "FAQ", icon: "?" },
  { type: "contact", label: "Contact", icon: "@" },
  { type: "footer", label: "Footer", icon: "▰" },
];

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `node-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "website"
  );
}

function cloneNode(node: ComponentNode): ComponentNode {
  return {
    ...node,
    id: createId(),
    props: { ...node.props },
    styles: node.styles ? { ...node.styles } : undefined,
    children: node.children?.map(cloneNode),
  };
}

function makeNode(type: ComponentType): ComponentNode {
  switch (type) {
    case "section":
      return {
        id: createId(),
        type,
        props: {},
        styles: {
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 24,
          paddingTop: 56,
          paddingRight: 40,
          paddingBottom: 56,
          paddingLeft: 40,
          width: "100%",
        },
        children: [
          {
            id: createId(),
            type: "heading",
            props: { text: "Your heading" },
            styles: {
              fontSize: 48,
              fontWeight: 700,
              lineHeight: 1.1,
            },
          },
          {
            id: createId(),
            type: "text",
            props: {
              text: "Add your content here.",
            },
            styles: {
              fontSize: 18,
              lineHeight: 1.6,
            },
          },
        ],
      };

    case "heading":
      return {
        id: createId(),
        type,
        props: { text: "Your heading" },
        styles: {
          fontSize: 48,
          fontWeight: 700,
          lineHeight: 1.1,
        },
      };

    case "text":
      return {
        id: createId(),
        type,
        props: {
          text: "Add your content here.",
        },
        styles: {
          fontSize: 18,
          lineHeight: 1.6,
        },
      };

    case "button":
      return {
        id: createId(),
        type,
        props: {
          text: "Get started",
          linkTo: "#",
        },
        styles: {
          width: "fit-content",
          paddingTop: 12,
          paddingRight: 20,
          paddingBottom: 12,
          paddingLeft: 20,
          borderRadius: 8,
          fontWeight: 600,
        },
      };

    case "image":
      return {
        id: createId(),
        type,
        props: {
          src: "",
          alt: "Image",
        },
        styles: {
          width: "100%",
          maxWidth: 900,
          borderRadius: 12,
        },
      };

    case "video":
      return {
        id: createId(),
        type,
        props: {
          src: "",
        },
        styles: {
          width: "100%",
          maxWidth: 900,
          aspectRatio: "16 / 9",
        },
      };

    case "gallery":
      return {
        id: createId(),
        type,
        props: {
          columns: 3,
          images: [],
        },
        styles: {
          display: "grid",
          gridTemplateColumns:
            "repeat(3,minmax(0,1fr))",
          gap: 16,
          width: "100%",
        },
      };

    case "divider":
      return {
        id: createId(),
        type,
        props: {},
        styles: {
          width: "100%",
          height: 1,
          opacity: 0.16,
        },
      };

    case "icon":
      return {
        id: createId(),
        type,
        props: {
          icon: "✦",
        },
        styles: {
          fontSize: 36,
        },
      };

    case "logo":
      return {
        id: createId(),
        type,
        props: {
          text: "Brand",
        },
        styles: {
          fontSize: 22,
          fontWeight: 800,
        },
      };

    case "menu":
      return {
        id: createId(),
        type,
        props: {
          items: ["Home", "About", "Contact"],
        },
        styles: {
          display: "flex",
          gap: 20,
        },
      };

    case "social":
      return {
        id: createId(),
        type,
        props: {
          items: ["Instagram", "X", "LinkedIn"],
        },
        styles: {
          display: "flex",
          gap: 12,
        },
      };

    case "form":
      return {
        id: createId(),
        type,
        props: {
          title: "Contact us",
          submitLabel: "Send message",
        },
        styles: {
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxWidth: 560,
        },
      };

    case "card":
      return {
        id: createId(),
        type,
        props: {
          title: "Card title",
          text: "Describe this card.",
        },
        styles: {
          padding: 24,
          borderRadius: 16,
        },
      };

    case "features":
      return {
        id: createId(),
        type,
        props: {
          columns: 3,
        },
        styles: {
          display: "grid",
          gridTemplateColumns:
            "repeat(3,minmax(0,1fr))",
          gap: 20,
        },
        children: [
          makeNode("card"),
          makeNode("card"),
          makeNode("card"),
        ],
      };

    case "pricing":
      return {
        id: createId(),
        type,
        props: {
          columns: 3,
        },
        styles: {
          display: "grid",
          gridTemplateColumns:
            "repeat(3,minmax(0,1fr))",
          gap: 20,
        },
        children: [
          makeNode("card"),
          makeNode("card"),
          makeNode("card"),
        ],
      };

    case "testimonial":
      return {
        id: createId(),
        type,
        props: {
          quote: "A great experience.",
          author: "Customer",
        },
        styles: {
          padding: 28,
          borderRadius: 16,
        },
      };

    case "faq":
      return {
        id: createId(),
        type,
        props: {
          question: "Frequently asked question",
          answer: "Write the answer here.",
        },
        styles: {
          padding: 20,
        },
      };

    case "contact":
      return {
        id: createId(),
        type,
        props: {
          title: "Contact",
          email: "hello@example.com",
          phone: "",
        },
        styles: {
          padding: 32,
        },
      };

    case "footer":
      return {
        id: createId(),
        type,
        props: {
          text: "© 2026 Your Company",
        },
        styles: {
          paddingTop: 32,
          paddingBottom: 32,
        },
      };

    default:
      return {
        id: createId(),
        type,
        props: {},
        styles: {},
      };
  }
}

function normalizeSite(site: Site): Site {
  const extended = site as Site & {
    slug?: string;
  };

  return {
    ...site,
    slug: extended.slug || slugify(site.name),
    pages:
      site.pages?.length > 0
        ? site.pages
        : [makePage("Home")],
  };
}

function makePage(name: string): SitePage {
  return {
    id: createId(),
    name,
    slug: "/",
    margins: {
      top: 0,
      right: 32,
      bottom: 0,
      left: 32,
    },
    styles: {
      background: "var(--sytely-page)",
    },
    components: [makeNode("section")],
  };
}

function findNode(
  nodes: ComponentNode[],
  nodeId: string
): ComponentNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return node;
    }

    const found = findNode(
      node.children ?? [],
      nodeId
    );

    if (found) {
      return found;
    }
  }

  return null;
}

function findParent(
  nodes: ComponentNode[],
  nodeId: string
): ComponentNode | null {
  for (const node of nodes) {
    if (
      (node.children ?? []).some(
        (child) => child.id === nodeId
      )
    ) {
      return node;
    }

    const found = findParent(
      node.children ?? [],
      nodeId
    );

    if (found) {
      return found;
    }
  }

  return null;
}

function mapTree(
  nodes: ComponentNode[],
  updater: (
    node: ComponentNode
  ) => ComponentNode
): ComponentNode[] {
  return nodes.map((node) => {
    const next: ComponentNode = {
      ...node,
      children: node.children
        ? mapTree(node.children, updater)
        : node.children,
    };

    return updater(next);
  });
}

function replaceNode(
  nodes: ComponentNode[],
  nodeId: string,
  updater: (
    node: ComponentNode
  ) => ComponentNode
): ComponentNode[] {
  return mapTree(nodes, (node) =>
    node.id === nodeId
      ? updater(node)
      : node
  );
}

function removeNodes(
  nodes: ComponentNode[],
  ids: Set<string>
): {
  nodes: ComponentNode[];
  removed: ComponentNode[];
} {
  const next: ComponentNode[] = [];
  const removed: ComponentNode[] = [];

  for (const node of nodes) {
    if (ids.has(node.id)) {
      removed.push(node);
      continue;
    }

    if (node.children) {
      const result = removeNodes(
        node.children,
        ids
      );

      removed.push(...result.removed);

      next.push({
        ...node,
        children: result.nodes,
      });
    } else {
      next.push(node);
    }
  }

  return { nodes: next, removed };
}

function insertNodes(
  nodes: ComponentNode[],
  parentId: string | null,
  items: ComponentNode[],
  index = -1
): ComponentNode[] {
  if (!parentId) {
    const result = [...nodes];

    if (
      index < 0 ||
      index > result.length
    ) {
      result.push(...items);
    } else {
      result.splice(index, 0, ...items);
    }

    return result;
  }

  return nodes.map((node) => {
    if (node.id === parentId) {
      const children = [
        ...(node.children ?? []),
      ];

      if (
        index < 0 ||
        index > children.length
      ) {
        children.push(...items);
      } else {
        children.splice(
          index,
          0,
          ...items
        );
      }

      return {
        ...node,
        children,
      };
    }

    return node.children
      ? {
          ...node,
          children: insertNodes(
            node.children,
            parentId,
            items,
            index
          ),
        }
      : node;
  });
}

function getNumber(
  value: unknown,
  fallback: number
): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  return fallback;
}

function getString(
  value: unknown,
  fallback = ""
): string {
  return typeof value === "string"
    ? value
    : fallback;
}

function saveSiteCollection(
  sites: Site[]
) {
  localStorage.setItem(
    STORAGE_SITES,
    JSON.stringify(sites)
  );
}

function SiteName({
  site,
  onRename,
}: {
  site: Site;
  onRename: () => void;
}) {
  return (
    <button
      type="button"
      className="editor-site-button"
      onClick={onRename}
    >
      <span>{site.name}</span>
      <span aria-hidden="true">⌄</span>
    </button>
  );
}

export default function Editor({
  siteSlug,
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

  const [device, setDevice] =
    useState<Device>("desktop");

  const [zoom, setZoom] =
    useState(80);

  const [pan, setPan] = useState({
    x: 0,
    y: 0,
  });

  const [panel, setPanel] =
    useState<
      "components" |
      "templates" |
      "pages" |
      "layers"
    >("components");

  const [search, setSearch] =
    useState("");

  const [dirty, setDirty] =
    useState(false);

  const [status, setStatus] =
    useState("Saved");

  const [history, setHistory] =
    useState<Site[]>([]);

  const [future, setFuture] =
    useState<Site[]>([]);

  const [numericDrafts, setNumericDrafts] =
    useState<
      Record<string, string>
    >({});

  const [styleClipboard, setStyleClipboard] =
    useState<Record<
      string,
      unknown
    > | null>(null);

  const imageInput =
    useRef<HTMLInputElement>(null);

  const imageTarget =
    useRef<string | null>(null);

  const panStart =
    useRef<{
      x: number;
      y: number;
      clientX: number;
      clientY: number;
    } | null>(null);

  const currentPage = useMemo(() => {
    if (!site) {
      return null;
    }

    return (
      site.pages.find(
        (page) =>
          page.id === activePageId
      ) ??
      site.pages[0] ??
      null
    );
  }, [site, activePageId]);

  const selectedNode = useMemo(() => {
    if (
      !currentPage ||
      selectedIds.length !== 1
    ) {
      return null;
    }

    return findNode(
      currentPage.components,
      selectedIds[0]
    );
  }, [
    currentPage,
    selectedIds,
  ]);

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(
          STORAGE_SITES
        );

      const legacy =
        localStorage.getItem(
          STORAGE_LEGACY
        );

      let sites: Site[] = [];

      if (raw) {
        const parsed =
          JSON.parse(raw);

        if (Array.isArray(parsed)) {
          sites =
            parsed.map(normalizeSite);
        }
      }

      if (
        sites.length === 0 &&
        legacy
      ) {
        try {
          const parsed =
            JSON.parse(legacy);

          if (parsed) {
            sites = [
              normalizeSite(parsed),
            ];
          }
        } catch {
          // Invalid legacy storage.
        }
      }

      if (sites.length === 0) {
        sites = [
          {
            id: "site-1",
            name: "My Website",
            slug: "my-website",
            version: 1,
            theme: "system",
            pages: [
              makePage("Home"),
            ],
          } as Site,
        ];

        saveSiteCollection(sites);
      }

      const requested =
        siteSlug.toLowerCase();

      const found = sites.find(
        (candidate) => {
          const extended =
            candidate as Site & {
              slug?: string;
            };

          return (
            extended.slug?.toLowerCase() ===
              requested ||
            candidate.id.toLowerCase() ===
              requested ||
            slugify(candidate.name) ===
              requested
          );
        }
      );

      if (!found) {
        setStatus("Website not found");
        return;
      }

      setSite(found);
      setActivePageId(
        found.pages[0]?.id ?? ""
      );
    } catch {
      setStatus(
        "Unable to load website"
      );
    }
  }, [siteSlug]);

  const commit = useCallback(
    (
      updater: (
        current: Site
      ) => Site
    ) => {
      setSite((current) => {
        if (!current) {
          return current;
        }

        setHistory((items) => [
          ...items.slice(-49),
          current,
        ]);

        setFuture([]);
        setDirty(true);
        setStatus("Unsaved changes");

        return updater(current);
      });
    },
    []
  );

  const updatePage = useCallback(
    (
      updater: (
        page: SitePage
      ) => SitePage
    ) => {
      commit((current) => ({
        ...current,
        pages: current.pages.map(
          (page) =>
            page.id === activePageId
              ? updater(page)
              : page
        ),
      }));
    },
    [activePageId, commit]
  );

  const updateNode = useCallback(
    (
      nodeId: string,
      updater: (
        node: ComponentNode
      ) => ComponentNode
    ) => {
      updatePage((page) => ({
        ...page,
        components: replaceNode(
          page.components,
          nodeId,
          updater
        ),
      }));
    },
    [updatePage]
  );

  const updateProp = useCallback(
    (
      nodeId: string,
      key: string,
      value: unknown
    ) => {
      updateNode(nodeId, (node) => ({
        ...node,
        props: {
          ...node.props,
          [key]: value,
        },
      }));
    },
    [updateNode]
  );

  const updateStyle = useCallback(
    (
      nodeId: string,
      key: string,
      value: unknown
    ) => {
      updateNode(nodeId, (node) => ({
        ...node,
        styles: {
          ...(node.styles ?? {}),
          [key]: value,
        },
      }));
    },
    [updateNode]
  );

  const save = useCallback(() => {
    if (!site) {
      return;
    }

    try {
      const sitesRaw =
        localStorage.getItem(
          STORAGE_SITES
        );

      let sites: Site[] = [];

      if (sitesRaw) {
        const parsed =
          JSON.parse(sitesRaw);

        if (Array.isArray(parsed)) {
          sites = parsed;
        }
      }

      const index =
        sites.findIndex(
          (item) =>
            item.id === site.id
        );

      if (index >= 0) {
        sites[index] = site;
      } else {
        sites.push(site);
      }

      saveSiteCollection(sites);
      localStorage.setItem(
        STORAGE_LEGACY,
        JSON.stringify(site)
      );

      setDirty(false);
      setStatus("Saved");
    } catch {
      setStatus("Could not save");
    }
  }, [site]);

  const undo = useCallback(() => {
    setHistory((items) => {
      const previous =
        items[items.length - 1];

      if (!previous) {
        return items;
      }

      setSite((current) => {
        if (current) {
          setFuture((items2) => [
            ...items2,
            current,
          ]);
        }

        return previous;
      });

      setDirty(true);
      setStatus("Unsaved changes");

      return items.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((items) => {
      const next =
        items[items.length - 1];

      if (!next) {
        return items;
      }

      setSite((current) => {
        if (current) {
          setHistory((items2) => [
            ...items2,
            current,
          ]);
        }

        return next;
      });

      setDirty(true);
      setStatus("Unsaved changes");

      return items.slice(0, -1);
    });
  }, []);

  const renameSite = useCallback(() => {
    if (!site) {
      return;
    }

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
      name: name.trim(),
      slug:
        (
          current as Site & {
            slug?: string;
          }
        ).slug ||
        slugify(name),
    }));
  }, [site, commit]);

  const selectNode = useCallback(
    (
      nodeId: string,
      additive: boolean
    ) => {
      setPageSelected(false);

      setSelectedIds((current) => {
        if (!additive) {
          return [nodeId];
        }

        if (current.includes(nodeId)) {
          return current.filter(
            (item) =>
              item !== nodeId
          );
        }

        return [
          ...current,
          nodeId,
        ];
      });
    },
    []
  );

  const addComponent = useCallback(
    (type: ComponentType) => {
      const node = makeNode(type);

      updatePage((page) => ({
        ...page,
        components: [
          ...page.components,
          node,
        ],
      }));

      setSelectedIds([node.id]);
      setPageSelected(false);
    },
    [updatePage]
  );

  const addColumnBeside = useCallback(
    (
      targetId: string,
      type: ComponentType
    ) => {
      if (!currentPage) {
        return;
      }

      const target =
        findNode(
          currentPage.components,
          targetId
        );

      if (!target) {
        return;
      }

      const parent =
        findParent(
          currentPage.components,
          targetId
        );

      const column =
        makeNode(type);

      if (parent) {
        const children = [
          ...(parent.children ?? []),
        ];

        const index =
          children.findIndex(
            (child) =>
              child.id === targetId
          );

        updateNode(
          parent.id,
          (node) => ({
            ...node,
            styles: {
              ...(node.styles ?? {}),
              display: "grid",
              gridTemplateColumns:
                `repeat(${Math.max(
                  2,
                  children.length + 1
                )},minmax(0,1fr))`,
            },
            children: insertAt(
              children,
              column,
              index + 1
            ),
          })
        );
      } else {
        const components = [
          ...currentPage.components,
        ];

        const index =
          components.findIndex(
            (item) =>
              item.id === targetId
          );

        updatePage((page) => ({
          ...page,
          components: insertAt(
            components,
            column,
            index + 1
          ),
        }));
      }

      setSelectedIds([column.id]);
      setPageSelected(false);
    },
    [
      currentPage,
      updateNode,
      updatePage,
    ]
  );

  const duplicateSelected =
    useCallback(() => {
      if (
        !currentPage ||
        selectedIds.length === 0
      ) {
        return;
      }

      const clones: ComponentNode[] =
        [];

      for (const nodeId of selectedIds) {
        const node =
          findNode(
            currentPage.components,
            nodeId
          );

        if (node) {
          clones.push(
            cloneNode(node)
          );
        }
      }

      if (!clones.length) {
        return;
      }

      const first =
        selectedIds[0];

      const parent =
        findParent(
          currentPage.components,
          first
        );

      const siblings =
        parent?.children ??
        currentPage.components;

      const index =
        siblings.findIndex(
          (node) =>
            node.id === first
        );

      updatePage((page) => ({
        ...page,
        components: insertNodes(
          page.components,
          parent?.id ?? null,
          clones,
          index + 1
        ),
      }));

      setSelectedIds(
        clones.map(
          (node) => node.id
        )
      );
    }, [
      currentPage,
      selectedIds,
      updatePage,
    ]);

  const deleteSelected =
    useCallback(() => {
      if (
        !currentPage ||
        !selectedIds.length
      ) {
        return;
      }

      const ids =
        new Set(selectedIds);

      updatePage((page) => ({
        ...page,
        components:
          removeNodes(
            page.components,
            ids
          ).nodes,
      }));

      setSelectedIds([]);
      setPageSelected(true);
    }, [
      currentPage,
      selectedIds,
      updatePage,
    ]);

  const moveSelected =
    useCallback(
      (direction: -1 | 1) => {
        if (
          !currentPage ||
          selectedIds.length !== 1
        ) {
          return;
        }

        const targetId =
          selectedIds[0];

        const parent =
          findParent(
            currentPage.components,
            targetId
          );

        const siblings =
          parent?.children ??
          currentPage.components;

        const index =
          siblings.findIndex(
            (node) =>
              node.id === targetId
          );

        const target =
          index + direction;

        if (
          index < 0 ||
          target < 0 ||
          target >= siblings.length
        ) {
          return;
        }

        const next = [
          ...siblings,
        ];

        const [
          item,
        ] = next.splice(
          index,
          1
        );

        next.splice(
          target,
          0,
          item
        );

        updatePage((page) => {
          if (parent) {
            return {
              ...page,
              components:
                replaceNode(
                  page.components,
                  parent.id,
                  (node) => ({
                    ...node,
                    children:
                      next,
                  })
                ),
            };
          }

          return {
            ...page,
            components: next,
          };
        });
      },
      [
        currentPage,
        selectedIds,
        updatePage,
      ]
    );

  const groupSelected =
    useCallback(() => {
      if (
        !currentPage ||
        selectedIds.length < 2
      ) {
        return;
      }

      const selected =
        new Set(selectedIds);

      const result =
        removeNodes(
          currentPage.components,
          selected
        );

      if (
        result.removed.length <
        2
      ) {
        return;
      }

      const group: ComponentNode = {
        id: createId(),
        type: "section",
        props: {},
        styles: {
          display: "grid",
          gridTemplateColumns:
            `repeat(${result.removed.length},minmax(0,1fr))`,
          gap: 20,
          width: "100%",
        },
        children:
          result.removed,
      };

      updatePage((page) => ({
        ...page,
        components: [
          ...result.nodes,
          group,
        ],
      }));

      setSelectedIds([
        group.id,
      ]);
    }, [
      currentPage,
      selectedIds,
      updatePage,
    ]);

  const ungroupSelected =
    useCallback(() => {
      if (
        !currentPage ||
        selectedIds.length !== 1
      ) {
        return;
      }

      const node =
        findNode(
          currentPage.components,
          selectedIds[0]
        );

      if (
        !node ||
        !node.children?.length
      ) {
        return;
      }

      const parent =
        findParent(
          currentPage.components,
          node.id
        );

      const children =
        node.children;

      if (parent) {
        updateNode(
          parent.id,
          (parentNode) => ({
            ...parentNode,
            children:
              insertAfterId(
                parentNode.children ??
                  [],
                node.id,
                children
              ),
          })
        );

        updatePage((page) => ({
          ...page,
          components:
            removeNodes(
              page.components,
              new Set([
                node.id,
              ])
            ).nodes,
        }));
      } else {
        updatePage((page) => {
          const index =
            page.components.findIndex(
              (item) =>
                item.id === node.id
            );

          const next =
            page.components.filter(
              (item) =>
                item.id !== node.id
            );

          next.splice(
            index,
            0,
            ...children
          );

          return {
            ...page,
            components: next,
          };
        });
      }

      setSelectedIds(
        children.map(
          (child) => child.id
        )
      );
    }, [
      currentPage,
      selectedIds,
      updateNode,
      updatePage,
    ]);

  const addPage = useCallback(() => {
    const page =
      makePage(
        `Page ${
          (site?.pages.length ??
            0) + 1
        }`
      );

    page.slug =
      `/${slugify(page.name)}`;

    commit((current) => ({
      ...current,
      pages: [
        ...current.pages,
        page,
      ],
    }));

    setActivePageId(page.id);
    setSelectedIds([]);
    setPageSelected(true);
  }, [site, commit]);

  const renamePage = useCallback(
    (pageId: string) => {
      const page =
        site?.pages.find(
          (item) =>
            item.id === pageId
        );

      if (!page) {
        return;
      }

      const name =
        window.prompt(
          "Page name",
          page.name
        );

      if (!name?.trim()) {
        return;
      }

      commit((current) => ({
        ...current,
        pages: current.pages.map(
          (item) =>
            item.id === pageId
              ? {
                  ...item,
                  name:
                    name.trim(),
                  slug:
                    pageId ===
                    current.pages[0]
                      ?.id
                      ? "/"
                      : `/${slugify(
                          name
                        )}`,
                }
              : item
        ),
      }));
    },
    [site, commit]
  );

  const deletePage = useCallback(
    (pageId: string) => {
      if (
        !site ||
        site.pages.length <= 1
      ) {
        return;
      }

      if (
        !window.confirm(
          "Delete this page?"
        )
      ) {
        return;
      }

      const remaining =
        site.pages.filter(
          (page) =>
            page.id !== pageId
        );

      commit((current) => ({
        ...current,
        pages: remaining,
      }));

      if (
        activePageId === pageId
      ) {
        setActivePageId(
          remaining[0]?.id ?? ""
        );
        setSelectedIds([]);
        setPageSelected(true);
      }
    },
    [
      site,
      activePageId,
      commit,
    ]
  );

  const beginImageUpload =
    useCallback(
      (nodeId: string) => {
        imageTarget.current =
          nodeId;
        imageInput.current?.click();
      },
      []
    );

  const handleImageUpload =
    useCallback(
      (
        event: ChangeEvent<HTMLInputElement>
      ) => {
        const file =
          event.target.files?.[0];

        event.target.value = "";

        const target =
          imageTarget.current;

        imageTarget.current = null;

        if (
          !file ||
          !target ||
          !file.type.startsWith(
            "image/"
          )
        ) {
          return;
        }

        const reader =
          new FileReader();

        reader.onload = () => {
          if (
            typeof reader.result ===
            "string"
          ) {
            updateProp(
              target,
              "src",
              reader.result
            );
          }
        };

        reader.readAsDataURL(file);
      },
      [updateProp]
    );

  const copyStyle = useCallback(() => {
    if (selectedNode) {
      setStyleClipboard({
        ...(selectedNode.styles ??
          {}),
      });
    }
  }, [selectedNode]);

  const pasteStyle = useCallback(() => {
    if (
      selectedNode &&
      styleClipboard
    ) {
      updateNode(
        selectedNode.id,
        (node) => ({
          ...node,
          styles: {
            ...styleClipboard,
          },
        })
      );
    }
  }, [
    selectedNode,
    styleClipboard,
    updateNode,
  ]);

  const beginPan =
    useCallback(
      (
        event: ReactMouseEvent
      ) => {
        if (
          event.button !== 1 &&
          !event.altKey
        ) {
          return;
        }

        event.preventDefault();

        panStart.current = {
          x: pan.x,
          y: pan.y,
          clientX: event.clientX,
          clientY: event.clientY,
        };
      },
      [pan]
    );

  useEffect(() => {
    const move = (
      event: MouseEvent
    ) => {
      if (!panStart.current) {
        return;
      }

      setPan({
        x:
          panStart.current.x +
          event.clientX -
          panStart.current.clientX,
        y:
          panStart.current.y +
          event.clientY -
          panStart.current.clientY,
      });
    };

    const up = () => {
      panStart.current = null;
    };

    window.addEventListener(
      "mousemove",
      move
    );

    window.addEventListener(
      "mouseup",
      up
    );

    return () => {
      window.removeEventListener(
        "mousemove",
        move
      );
      window.removeEventListener(
        "mouseup",
        up
      );
    };
  }, []);

  useEffect(() => {
    const keydown = (
      event: KeyboardEvent
    ) => {
      const target =
        event.target as HTMLElement;

      const editing =
        target.tagName ===
          "INPUT" ||
        target.tagName ===
          "TEXTAREA" ||
        target.tagName ===
          "SELECT" ||
        target.isContentEditable;

      if (
        !editing &&
        (event.metaKey ||
          event.ctrlKey) &&
        event.key.toLowerCase() ===
          "s"
      ) {
        event.preventDefault();
        save();
        return;
      }

      if (
        !editing &&
        (event.metaKey ||
          event.ctrlKey) &&
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
        !editing &&
        (event.metaKey ||
          event.ctrlKey) &&
        event.key.toLowerCase() ===
          "d"
      ) {
        event.preventDefault();
        duplicateSelected();
        return;
      }

      if (
        !editing &&
        (event.key ===
          "Delete" ||
          event.key ===
            "Backspace")
      ) {
        event.preventDefault();
        deleteSelected();
        return;
      }

      if (
        !editing &&
        event.key ===
          "Escape"
      ) {
        setSelectedIds([]);
        setPageSelected(true);
      }
    };

    window.addEventListener(
      "keydown",
      keydown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        keydown
      );
  }, [
    save,
    undo,
    redo,
    duplicateSelected,
    deleteSelected,
  ]);

  const openPreview =
    useCallback(() => {
      if (!site || !currentPage) {
        return;
      }

      const slug =
        (
          site as Site & {
            slug?: string;
          }
        ).slug ||
        slugify(site.name);

      const params =
        new URLSearchParams();

      params.set(
        "page",
        currentPage.slug
      );

      params.set(
        "device",
        device
      );

      window.open(
        `/${slug}/preview?${params.toString()}`,
        "_blank",
        "noopener,noreferrer"
      );
    }, [
      site,
      currentPage,
      device,
    ]);

  const filteredComponents =
    COMPONENTS.filter(
      (component) =>
        component.label
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );

  if (!site) {
    return (
      <main className="sytely-editor-loading">
        <div>
          <strong>
            {status ===
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

  return (
    <div className="sytely-editor">
      <header className="editor-topbar">
        <a
          href="/mysites"
          className="editor-brand"
        >
          <span className="editor-brand-mark">
            S
          </span>
          <span>Sytely</span>
        </a>

        <SiteName
          site={site}
          onRename={renameSite}
        />

        <div className="editor-history">
          <button
            type="button"
            onClick={undo}
            disabled={
              history.length === 0
            }
            title="Undo"
          >
            ↶
          </button>

          <button
            type="button"
            onClick={redo}
            disabled={
              future.length === 0
            }
            title="Redo"
          >
            ↷
          </button>
        </div>

        <div className="editor-device-switcher">
          {(
            [
              [
                "desktop",
                "Desktop",
              ],
              ["tablet", "Tablet"],
              ["mobile", "Mobile"],
            ] as const
          ).map(
            ([value, label]) => (
              <button
                key={value}
                type="button"
                className={
                  device === value
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setDevice(value)
                }
              >
                {label}
              </button>
            )
          )}
        </div>

        <div className="editor-top-actions">
          <span
            className={
              dirty
                ? "save-state dirty"
                : "save-state"
            }
          >
            {status}
          </span>

          <button
            type="button"
            className="secondary-button"
            onClick={openPreview}
          >
            Preview
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={save}
          >
            Save
          </button>
        </div>
      </header>

      <div className="editor-body">
        <aside className="editor-sidebar">
          <nav className="sidebar-tabs">
            {(
              [
                [
                  "components",
                  "Build",
                ],
                [
                  "templates",
                  "Templates",
                ],
                ["pages", "Pages"],
                ["layers", "Layers"],
              ] as const
            ).map(
              ([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={
                    panel === value
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setPanel(value)
                  }
                >
                  {label}
                </button>
              )
            )}
          </nav>

          {panel ===
            "components" && (
            <div className="sidebar-content">
              <div className="panel-heading">
                <div>
                  <strong>
                    Components
                  </strong>
                  <span>
                    Drag or click to add.
                  </span>
                </div>
              </div>

              <input
                className="component-search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search components"
              />

              <div className="component-grid">
                {filteredComponents.map(
                  (component) => (
                    <button
                      key={
                        component.type
                      }
                      type="button"
                      draggable
                      className="component-card"
                      onClick={() =>
                        addComponent(
                          component.type
                        )
                      }
                      onDragStart={(
                        event
                      ) =>
                        setDragPayload(
                          event,
                          {
                            kind:
                              "component",
                            type:
                              component.type,
                          }
                        )
                      }
                    >
                      <span>
                        {
                          component.icon
                        }
                      </span>
                      <small>
                        {
                          component.label
                        }
                      </small>
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {panel ===
            "templates" && (
            <div className="sidebar-content">
              <div className="panel-heading">
                <div>
                  <strong>
                    Templates
                  </strong>
                  <span>
                    Complete editable sections.
                  </span>
                </div>
              </div>

              {[
                [
                  "Hero",
                  "heading",
                ],
                [
                  "Feature grid",
                  "features",
                ],
                [
                  "Pricing",
                  "pricing",
                ],
                [
                  "Contact",
                  "contact",
                ],
                [
                  "Footer",
                  "footer",
                ],
              ].map(
                ([label, type]) => (
                  <button
                    key={label}
                    type="button"
                    className="template-card"
                    onClick={() => {
                      const section =
                        makeNode(
                          "section"
                        );

                      section.children =
                        [
                          makeNode(
                            type as ComponentType
                          ),
                        ];

                      updatePage(
                        (page) => ({
                          ...page,
                          components:
                            [
                              ...page.components,
                              section,
                            ],
                        })
                      );

                      setSelectedIds([
                        section.id,
                      ]);
                      setPageSelected(
                        false
                      );
                    }}
                  >
                    <strong>
                      {label}
                    </strong>
                    <span>
                      Editable responsive section
                    </span>
                  </button>
                )
              )}
            </div>
          )}

          {panel === "pages" && (
            <div className="sidebar-content">
              <div className="panel-heading">
                <div>
                  <strong>
                    Pages
                  </strong>
                  <span>
                    Pages in this website.
                  </span>
                </div>

                <button
                  type="button"
                  className="small-action"
                  onClick={addPage}
                >
                  +
                </button>
              </div>

              <div className="page-list">
                {site.pages.map(
                  (page) => (
                    <div
                      key={page.id}
                      className={
                        page.id ===
                        activePageId
                          ? "page-row active"
                          : "page-row"
                      }
                    >
                      <button
                        type="button"
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
                        <strong>
                          {page.name}
                        </strong>
                        <span>
                          {page.slug}
                        </span>
                      </button>

                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            renamePage(
                              page.id
                            )
                          }
                        >
                          …
                        </button>

                        {site.pages
                          .length >
                          1 && (
                          <button
                            type="button"
                            onClick={() =>
                              deletePage(
                                page.id
                              )
                            }
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {panel === "layers" && (
            <div className="sidebar-content">
              <div className="panel-heading">
                <div>
                  <strong>
                    Layers
                  </strong>
                  <span>
                    Select any nested element.
                  </span>
                </div>
              </div>

              <LayerTree
                nodes={
                  currentPage?.components ??
                  []
                }
                selectedIds={
                  selectedIds
                }
                onSelect={(nodeId) => {
                  setSelectedIds([
                    nodeId,
                  ]);
                  setPageSelected(
                    false
                  );
                }}
              />
            </div>
          )}
        </aside>

        <main className="editor-main">
          <div className="canvas-toolbar">
            <div>
              <strong>
                {currentPage?.name}
              </strong>
              <span className="muted">
                {currentPage?.slug}
              </span>
            </div>

            <div className="canvas-actions">
              <button
                type="button"
                onClick={() =>
                  setPan({
                    x: 0,
                    y: 0,
                  })
                }
              >
                Reset pan
              </button>

              <button
                type="button"
                onClick={() =>
                  setZoom(
                    (value) =>
                      Math.max(
                        25,
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
                        200,
                        value + 5
                      )
                  )
                }
              >
                +
              </button>
            </div>
          </div>

          <div
            className="canvas-area"
            onMouseDown={beginPan}
            onClick={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setSelectedIds([]);
                setPageSelected(
                  true
                );
              }
            }}
            onDragOver={(event) =>
              event.preventDefault()
            }
            onDrop={(event) =>
              handleDrop(
                event,
                currentPage,
                updatePage,
                setSelectedIds,
                setPageSelected
              )
            }
          >
            <div
              className={`canvas-stage device-${device}`}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
              }}
            >
              <div
                className="website-page"
                style={{
                  background:
                    getString(
                      currentPage
                        ?.styles
                        ?.background,
                      "var(--sytely-page)"
                    ),
                  paddingTop:
                    getNumber(
                      currentPage
                        ?.margins
                        ?.top,
                      0
                    ),
                  paddingRight:
                    getNumber(
                      currentPage
                        ?.margins
                        ?.right,
                      32
                    ),
                  paddingBottom:
                    getNumber(
                      currentPage
                        ?.margins
                        ?.bottom,
                      0
                    ),
                  paddingLeft:
                    getNumber(
                      currentPage
                        ?.margins
                        ?.left,
                      32
                    ),
                }}
              >
                {currentPage?.components.map(
                  (node) => (
                    <EditorNode
                      key={node.id}
                      node={node}
                      selectedIds={
                        selectedIds
                      }
                      device={device}
                      onSelect={
                        selectNode
                      }
                      onDragStart={(
                        event,
                        nodeId
                      ) =>
                        setDragPayload(
                          event,
                          {
                            kind: "node",
                            nodeIds:
                              selectedIds.includes(
                                nodeId
                              )
                                ? selectedIds
                                : [
                                    nodeId,
                                  ],
                          }
                        )
                      }
                      onDropInside={(
                        event,
                        nodeId
                      ) =>
                        handleDropInside(
                          event,
                          nodeId,
                          currentPage,
                          updatePage,
                          setSelectedIds,
                          setPageSelected
                        )
                      }
                    />
                  )
                )}

                {pageSelected && (
                  <div className="page-selection">
                    <span>
                      Page
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedNode && (
            <FloatingToolbar
              selectedCount={
                selectedIds.length
              }
              onDuplicate={
                duplicateSelected
              }
              onMoveUp={() =>
                moveSelected(-1)
              }
              onMoveDown={() =>
                moveSelected(1)
              }
              onGroup={
                groupSelected
              }
              onUngroup={
                ungroupSelected
              }
              onCopyStyle={
                copyStyle
              }
              onPasteStyle={
                pasteStyle
              }
              canPasteStyle={
                Boolean(styleClipboard)
              }
              onDelete={
                deleteSelected
              }
            />
          )}

          {selectedNode && (
            <Inspector
              node={selectedNode}
              updateProp={updateProp}
              updateStyle={updateStyle}
              uploadImage={
                beginImageUpload
              }
              numericDrafts={
                numericDrafts
              }
              setNumericDrafts={
                setNumericDrafts
              }
              onAddColumn={() =>
                addColumnBeside(
                  selectedNode.id,
                  "card"
                )
              }
            />
          )}

          {!selectedNode &&
            pageSelected &&
            currentPage && (
              <PageInspector
                page={currentPage}
                updatePage={updatePage}
              />
            )}
        </main>
      </div>

      <input
        ref={imageInput}
        hidden
        type="file"
        accept="image/*"
        onChange={
          handleImageUpload
        }
      />
    </div>
  );
}

function insertAt<T>(
  items: T[],
  item: T,
  index: number
): T[] {
  const result = [...items];
  result.splice(index, 0, item);
  return result;
}

function insertAfterId(
  items: ComponentNode[],
  id: string,
  additions: ComponentNode[]
): ComponentNode[] {
  const result = [...items];
  const index =
    result.findIndex(
      (item) => item.id === id
    );

  if (index < 0) {
    return result;
  }

  result.splice(
    index + 1,
    0,
    ...additions
  );

  return result;
}

function setDragPayload(
  event: DragEvent,
  payload: DragPayload
) {
  event.dataTransfer.effectAllowed =
    payload.kind === "node"
      ? "move"
      : "copy";

  event.dataTransfer.setData(
    "application/sytely",
    JSON.stringify(payload)
  );
}

function handleDrop(
  event: DragEvent,
  page: SitePage | null,
  updatePage: (
    updater: (
      page: SitePage
    ) => SitePage
  ) => void,
  setSelectedIds: Dispatch<
    SetStateAction<string[]>
  >,
  setPageSelected: Dispatch<
    SetStateAction<boolean>
  >
) {
  event.preventDefault();

  if (!page) {
    return;
  }

  const raw =
    event.dataTransfer.getData(
      "application/sytely"
    );

  if (!raw) {
    return;
  }

  try {
    const payload =
      JSON.parse(raw) as DragPayload;

    if (
      payload.kind ===
        "component" &&
      payload.type
    ) {
      const node =
        makeNode(payload.type);

      updatePage((current) => ({
        ...current,
        components: [
          ...current.components,
          node,
        ],
      }));

      setSelectedIds([node.id]);
      setPageSelected(false);
      return;
    }

    if (
      payload.kind === "node" &&
      payload.nodeIds.length
    ) {
      const ids = new Set(
        payload.nodeIds
      );

      const result =
        removeNodes(
          page.components,
          ids
        );

      if (!result.removed.length) {
        return;
      }

      const clones =
        result.removed.map(
          cloneNode
        );

      updatePage((current) => ({
        ...current,
        components:
          insertNodes(
            result.nodes,
            null,
            clones
          ),
      }));

      setSelectedIds(
        clones.map(
          (node) => node.id
        )
      );

      setPageSelected(false);
    }
  } catch {
    // Invalid drag payload.
  }
}

function handleDropInside(
  event: DragEvent,
  targetId: string,
  page: SitePage | null,
  updatePage: (
    updater: (
      page: SitePage
    ) => SitePage
  ) => void,
  setSelectedIds: Dispatch<
    SetStateAction<string[]>
  >,
  setPageSelected: Dispatch<
    SetStateAction<boolean>
  >
) {
  event.preventDefault();
  event.stopPropagation();

  if (!page) {
    return;
  }

  const raw =
    event.dataTransfer.getData(
      "application/sytely"
    );

  if (!raw) {
    return;
  }

  try {
    const payload =
      JSON.parse(raw) as DragPayload;

    if (
      payload.kind ===
      "component"
    ) {
      const node =
        makeNode(payload.type);

      updatePage((current) => ({
        ...current,
        components:
          insertNodes(
            current.components,
            targetId,
            [node]
          ),
      }));

      setSelectedIds([node.id]);
      setPageSelected(false);
      return;
    }

    if (
      payload.kind === "node"
    ) {
      const ids = new Set(
        payload.nodeIds
      );

      if (ids.has(targetId)) {
        return;
      }

      const result =
        removeNodes(
          page.components,
          ids
        );

      if (!result.removed.length) {
        return;
      }

      const target =
        findNode(
          result.nodes,
          targetId
        );

      if (!target) {
        return;
      }

      const moved =
        result.removed;

      updatePage((current) => ({
        ...current,
        components:
          insertNodes(
            result.nodes,
            targetId,
            moved
          ),
      }));

      setSelectedIds(
        moved.map(
          (node) => node.id
        )
      );

      setPageSelected(false);
    }
  } catch {
    // Invalid payload.
  }
}

function EditorNode({
  node,
  selectedIds,
  device,
  onSelect,
  onDragStart,
  onDropInside,
}: {
  node: ComponentNode;
  selectedIds: string[];
  device: Device;
  onSelect: (
    id: string,
    additive: boolean
  ) => void;
  onDragStart: (
    event: DragEvent,
    nodeId: string
  ) => void;
  onDropInside: (
    event: DragEvent,
    nodeId: string
  ) => void;
}) {
  const selected =
    selectedIds.includes(node.id);

  const children =
    node.children ?? [];

  /*
   * The rendered component itself is the
   * visual target. The editor overlay is
   * absolutely positioned and does not
   * create a layout box around buttons,
   * images, text, etc.
   */
  return (
    <div
      className={
        selected
          ? "editor-node editor-node-selected"
          : "editor-node"
      }
      data-editor-id={node.id}
      draggable
      onDragStart={(event) =>
        onDragStart(
          event,
          node.id
        )
      }
      onDragOver={(event) =>
        event.preventDefault()
      }
      onDrop={(event) =>
        onDropInside(
          event,
          node.id
        )
      }
      onClick={(event) => {
        event.stopPropagation();

        onSelect(
          node.id,
          event.metaKey ||
            event.ctrlKey ||
            event.shiftKey
        );
      }}
    >
      <div className="editor-rendered-node">
        {renderNode(node, {
          device,
          renderChildren: false,
        })}
      </div>

      {children.length > 0 && (
        <div className="editor-node-children">
          {children.map(
            (child) => (
              <EditorNode
                key={child.id}
                node={child}
                selectedIds={
                  selectedIds
                }
                device={device}
                onSelect={
                  onSelect
                }
                onDragStart={
                  onDragStart
                }
                onDropInside={
                  onDropInside
                }
              />
            )
          )}
        </div>
      )}

      {selected && (
        <div
          className="editor-selection-overlay"
          aria-hidden="true"
        >
          <span className="editor-node-label">
            {node.type}
          </span>
        </div>
      )}
    </div>
  );
}

function FloatingToolbar({
  selectedCount,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onGroup,
  onUngroup,
  onCopyStyle,
  onPasteStyle,
  canPasteStyle,
  onDelete,
}: {
  selectedCount: number;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onCopyStyle: () => void;
  onPasteStyle: () => void;
  canPasteStyle: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="floating-toolbar">
      <span>
        {selectedCount} selected
      </span>

      <button
        type="button"
        onClick={onDuplicate}
      >
        Duplicate
      </button>

      <button
        type="button"
        onClick={onMoveUp}
      >
        ↑
      </button>

      <button
        type="button"
        onClick={onMoveDown}
      >
        ↓
      </button>

      <button
        type="button"
        onClick={onGroup}
        disabled={
          selectedCount < 2
        }
      >
        Group
      </button>

      <button
        type="button"
        onClick={onUngroup}
      >
        Ungroup
      </button>

      <button
        type="button"
        onClick={onCopyStyle}
      >
        Copy style
      </button>

      <button
        type="button"
        onClick={onPasteStyle}
        disabled={!canPasteStyle}
      >
        Paste style
      </button>

      <button
        type="button"
        className="danger"
        onClick={onDelete}
      >
        Delete
      </button>
    </div>
  );
}

function Inspector({
  node,
  updateProp,
  updateStyle,
  uploadImage,
  numericDrafts,
  setNumericDrafts,
  onAddColumn,
}: {
  node: ComponentNode;
  updateProp: (
    nodeId: string,
    key: string,
    value: unknown
  ) => void;
  updateStyle: (
    nodeId: string,
    key: string,
    value: unknown
  ) => void;
  uploadImage: (
    nodeId: string
  ) => void;
  numericDrafts: Record<
    string,
    string
  >;
  setNumericDrafts: Dispatch<
    SetStateAction<
      Record<string, string>
    >
  >;
  onAddColumn: () => void;
}) {
  const textProp = (
    key: string,
    fallback = ""
  ) =>
    getString(
      node.props[key],
      fallback
    );

  const numberControl = (
    key: string,
    fallback: number
  ) => {
    const draftKey =
      `${node.id}:${key}`;

    const committed =
      getNumber(
        node.styles?.[key],
        fallback
      );

    const value =
      numericDrafts[
        draftKey
      ] ?? String(committed);

    return (
      <NumberField
        key={key}
        label={key}
        value={value}
        onChange={(text) => {
          setNumericDrafts(
            (current) => ({
              ...current,
              [draftKey]: text,
            })
          );

          if (text === "") {
            return;
          }

          const parsed =
            Number(text);

          if (
            Number.isFinite(parsed)
          ) {
            updateStyle(
              node.id,
              key,
              parsed
            );
          }
        }}
        onCommit={(text) => {
          const parsed =
            Number(text);

          setNumericDrafts(
            (current) => {
              const next = {
                ...current,
              };

              delete next[
                draftKey
              ];

              return next;
            }
          );

          if (
            Number.isFinite(parsed)
          ) {
            updateStyle(
              node.id,
              key,
              parsed
            );
          }
        }}
      />
    );
  };

  return (
    <aside className="floating-inspector">
      <div className="inspector-header">
        <div>
          <strong>
            {node.type}
          </strong>
          <span>
            Selected component
          </span>
        </div>
      </div>

      <InspectorSection title="Content">
        {node.type ===
          "heading" && (
          <TextField
            label="Text"
            value={textProp(
              "text"
            )}
            onChange={(value) =>
              updateProp(
                node.id,
                "text",
                value
              )
            }
          />
        )}

        {node.type === "text" && (
          <TextAreaField
            label="Text"
            value={textProp(
              "text"
            )}
            onChange={(value) =>
              updateProp(
                node.id,
                "text",
                value
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
                "Button"
              )}
              onChange={(value) =>
                updateProp(
                  node.id,
                  "text",
                  value
                )
              }
            />

            <TextField
              label="Link"
              value={textProp(
                "linkTo",
                "#"
              )}
              onChange={(value) =>
                updateProp(
                  node.id,
                  "linkTo",
                  value
                )
              }
            />
          </>
        )}

        {node.type === "image" && (
          <>
            <TextField
              label="Image URL"
              value={textProp(
                "src"
              )}
              onChange={(value) =>
                updateProp(
                  node.id,
                  "src",
                  value
                )
              }
            />

            <TextField
              label="Alt text"
              value={textProp(
                "alt",
                "Image"
              )}
              onChange={(value) =>
                updateProp(
                  node.id,
                  "alt",
                  value
                )
              }
            />

            <button
              type="button"
              className="upload-button"
              onClick={() =>
                uploadImage(
                  node.id
                )
              }
            >
              Upload image
            </button>
          </>
        )}

        {node.type ===
          "video" && (
          <TextField
            label="Video URL"
            value={textProp(
              "src"
            )}
            onChange={(value) =>
              updateProp(
                node.id,
                "src",
                value
              )
            }
          />
        )}

        {node.type ===
          "logo" && (
          <TextField
            label="Logo"
            value={textProp(
              "text",
              "Brand"
            )}
            onChange={(value) =>
              updateProp(
                node.id,
                "text",
                value
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
              "✦"
            )}
            onChange={(value) =>
              updateProp(
                node.id,
                "icon",
                value
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
                "title"
              )}
              onChange={(value) =>
                updateProp(
                  node.id,
                  "title",
                  value
                )
              }
            />

            <TextAreaField
              label="Text"
              value={textProp(
                "text"
              )}
              onChange={(value) =>
                updateProp(
                  node.id,
                  "text",
                  value
                )
              }
            />
          </>
        )}

        {node.type ===
          "testimonial" && (
          <>
            <TextAreaField
              label="Quote"
              value={textProp(
                "quote",
                textProp(
                  "text"
                )
              )}
              onChange={(value) =>
                updateProp(
                  node.id,
                  "quote",
                  value
                )
              }
            />

            <TextField
              label="Author"
              value={textProp(
                "author"
              )}
              onChange={(value) =>
                updateProp(
                  node.id,
                  "author",
                  value
                )
              }
            />
          </>
        )}

        {node.type ===
          "faq" && (
          <>
            <TextField
              label="Question"
              value={textProp(
                "question"
              )}
              onChange={(value) =>
                updateProp(
                  node.id,
                  "question",
                  value
                )
              }
            />

            <TextAreaField
              label="Answer"
              value={textProp(
                "answer"
              )}
              onChange={(value) =>
                updateProp(
                  node.id,
                  "answer",
                  value
                )
              }
            />
          </>
        )}

        {node.type ===
          "contact" && (
          <>
            <TextField
              label="Title"
              value={textProp(
                "title",
                "Contact"
              )}
              onChange={(value) =>
                updateProp(
                  node.id,
                  "title",
                  value
                )
              }
            />

            <TextField
              label="Email"
              value={textProp(
                "email"
              )}
              onChange={(value) =>
                updateProp(
                  node.id,
                  "email",
                  value
                )
              }
            />

            <TextField
              label="Phone"
              value={textProp(
                "phone"
              )}
              onChange={(value) =>
                updateProp(
                  node.id,
                  "phone",
                  value
                )
              }
            />
          </>
        )}

        {node.type ===
          "footer" && (
          <TextAreaField
            label="Text"
            value={textProp(
              "text"
            )}
            onChange={(value) =>
              updateProp(
                node.id,
                "text",
                value
              )
            }
          />
        )}
      </InspectorSection>

      <InspectorSection title="Layout">
        {numberControl(
          "width",
          0
        )}

        {numberControl(
          "maxWidth",
          0
        )}

        {numberControl(
          "gap",
          16
        )}

        {numberControl(
          "paddingTop",
          0
        )}

        {numberControl(
          "paddingRight",
          0
        )}

        {numberControl(
          "paddingBottom",
          0
        )}

        {numberControl(
          "paddingLeft",
          0
        )}

        {(node.type ===
          "section" ||
          node.type ===
            "features" ||
          node.type ===
            "pricing") && (
          <>
            <SelectField
              label="Columns"
              value={getString(
                node.styles
                  ?.gridTemplateColumns,
                "1fr"
              )}
              options={[
                [
                  "1fr",
                  "1 column",
                ],
                [
                  "repeat(2,minmax(0,1fr))",
                  "2 columns",
                ],
                [
                  "repeat(3,minmax(0,1fr))",
                  "3 columns",
                ],
                [
                  "repeat(4,minmax(0,1fr))",
                  "4 columns",
                ],
              ]}
              onChange={(value) => {
                updateStyle(
                  node.id,
                  "display",
                  "grid"
                );
                updateStyle(
                  node.id,
                  "gridTemplateColumns",
                  value
                );
              }}
            />

            <button
              type="button"
              className="upload-button"
              onClick={onAddColumn}
            >
              Add column
            </button>
          </>
        )}
      </InspectorSection>

      <InspectorSection title="Typography">
        {numberControl(
          "fontSize",
          16
        )}

        {numberControl(
          "fontWeight",
          400
        )}

        {numberControl(
          "lineHeight",
          1.5
        )}

        <SelectField
          label="Alignment"
          value={getString(
            node.styles
              ?.textAlign,
            "left"
          )}
          options={[
            ["left", "Left"],
            [
              "center",
              "Center",
            ],
            [
              "right",
              "Right",
            ],
          ]}
          onChange={(value) =>
            updateStyle(
              node.id,
              "textAlign",
              value
            )
          }
        />
      </InspectorSection>

      <InspectorSection title="Appearance">
        <TextField
          label="Background"
          value={getString(
            node.styles
              ?.background
          )}
          onChange={(value) =>
            updateStyle(
              node.id,
              "background",
              value
            )
          }
        />

        {numberControl(
          "borderRadius",
          0
        )}

        <TextField
          label="Color"
          value={getString(
            node.styles?.color
          )}
          onChange={(value) =>
            updateStyle(
              node.id,
              "color",
              value
            )
          }
        />
      </InspectorSection>
    </aside>
  );
}

function PageInspector({
  page,
  updatePage,
}: {
  page: SitePage;
  updatePage: (
    updater: (
      page: SitePage
    ) => SitePage
  ) => void;
}) {
  return (
    <aside className="floating-inspector">
      <div className="inspector-header">
        <div>
          <strong>Page</strong>
          <span>
            {page.name}
          </span>
        </div>
      </div>

      <InspectorSection title="Margins">
        <NumberField
          label="Top"
          value={String(
            page.margins.top
          )}
          onChange={(text) => {
            const value =
              Number(text);

            if (
              Number.isFinite(value)
            ) {
              updatePage(
                (current) => ({
                  ...current,
                  margins: {
                    ...current.margins,
                    top: value,
                  },
                })
              );
            }
          }}
        />

        <NumberField
          label="Right"
          value={String(
            page.margins.right
          )}
          onChange={(text) => {
            const value =
              Number(text);

            if (
              Number.isFinite(value)
            ) {
              updatePage(
                (current) => ({
                  ...current,
                  margins: {
                    ...current.margins,
                    right: value,
                  },
                })
              );
            }
          }}
        />

        <NumberField
          label="Bottom"
          value={String(
            page.margins.bottom
          )}
          onChange={(text) => {
            const value =
              Number(text);

            if (
              Number.isFinite(value)
            ) {
              updatePage(
                (current) => ({
                  ...current,
                  margins: {
                    ...current.margins,
                    bottom: value,
                  },
                })
              );
            }
          }}
        />

        <NumberField
          label="Left"
          value={String(
            page.margins.left
          )}
          onChange={(text) => {
            const value =
              Number(text);

            if (
              Number.isFinite(value)
            ) {
              updatePage(
                (current) => ({
                  ...current,
                  margins: {
                    ...current.margins,
                    left: value,
                  },
                })
              );
            }
          }}
        />
      </InspectorSection>
    </aside>
  );
}

function InspectorSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="inspector-section">
      <h3>{title}</h3>
      <div className="inspector-fields">
        {children}
      </div>
    </section>
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
    value: string
  ) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea
        rows={4}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  onCommit,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  onCommit?: (
    value: string
  ) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        onBlur={(event) =>
          onCommit?.(
            event.target.value
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
  options: Array<
    [string, string]
  >;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      >
        {options.map(
          ([option, label]) => (
            <option
              key={option}
              value={option}
            >
              {label}
            </option>
          )
        )}
      </select>
    </label>
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
    id: string
  ) => void;
  depth?: number;
}) {
  return (
    <div>
      {nodes.map((node) => (
        <div key={node.id}>
          <button
            type="button"
            className={
              selectedIds.includes(
                node.id
              )
                ? "layer-row active"
                : "layer-row"
            }
            style={{
              paddingLeft:
                10 +
                depth * 14,
            }}
            onClick={() =>
              onSelect(
                node.id
              )
            }
          >
            <span>
              {
                COMPONENTS.find(
                  (item) =>
                    item.type ===
                    node.type
                )?.icon
              }
            </span>
            <strong>
              {node.type}
            </strong>
          </button>

          {node.children
            ?.length ? (
            <LayerTree
              nodes={
                node.children
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
      ))}
    </div>
  );
}