"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type DragEvent,
  type MouseEvent as ReactMouseEvent,
  type SetStateAction,
} from "react";

import {
  renderNode,
} from "@sytely/renderer";

import type {
  ComponentNode,
  ComponentType,
  Site,
  SitePage,
} from "@sytely/types";

import "./editor.css";

type Device =
  | "desktop"
  | "tablet"
  | "mobile";

type Tab =
  | "components"
  | "templates"
  | "pages"
  | "layers";

const SITES_KEY =
  "sytely-sites";

const LEGACY_KEY =
  "sytely-site";

const catalog: {
  type: ComponentType;
  label: string;
  icon: string;
}[] = [
  ["section", "Section", "▦"],
  ["heading", "Heading", "T"],
  ["text", "Text", "≡"],
  ["button", "Button", "→"],
  ["image", "Image", "▧"],
  ["video", "Video", "▶"],
  ["gallery", "Gallery", "▥"],
  ["divider", "Divider", "—"],
  ["icon", "Icon", "✦"],
  ["logo", "Logo", "◎"],
  ["menu", "Menu", "☰"],
  ["social", "Social", "●"],
  ["form", "Form", "□"],
  ["card", "Card", "▣"],
  ["features", "Features", "◆"],
  ["pricing", "Pricing", "$"],
  ["testimonial", "Testimonial", "“"],
  ["faq", "FAQ", "?"],
  ["contact", "Contact", "@"],
  ["footer", "Footer", "▰"],
].map(
  ([type, label, icon]) => ({
    type: type as ComponentType,
    label,
    icon,
  })
);

const uid = () =>
  typeof crypto !== "undefined" &&
  typeof crypto.randomUUID ===
    "function"
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") ||
  "website";

const numberValue = (
  value: unknown,
  fallback = 0
) => {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
};

const stringValue = (
  value: unknown,
  fallback = ""
) =>
  typeof value === "string"
    ? value
    : fallback;

function createNode(
  type: ComponentType
): ComponentNode {
  const base: ComponentNode = {
    id: uid(),
    type,
    props: {},
    styles: {},
  };

  switch (type) {
    case "section":
      return {
        ...base,
        styles: {
          display: "flex",
          flexDirection:
            "column",
          gap: 24,
          paddingTop: 56,
          paddingRight: 40,
          paddingBottom: 56,
          paddingLeft: 40,
          width: "100%",
        },
        children: [
          createNode("heading"),
          createNode("text"),
        ],
      };

    case "heading":
      return {
        ...base,
        props: {
          text: "Your heading",
        },
        styles: {
          fontSize: 48,
          fontWeight: 700,
          lineHeight: 1.1,
        },
      };

    case "text":
      return {
        ...base,
        props: {
          text:
            "Add your content here.",
        },
        styles: {
          fontSize: 18,
          lineHeight: 1.6,
          maxWidth: 720,
        },
      };

    case "button":
      return {
        ...base,
        props: {
          text: "Get started",
          linkTo: "#",
        },
        styles: {
          width: "fit-content",
          borderRadius: 10,
          fontWeight: 650,
        },
      };

    case "image":
      return {
        ...base,
        props: {
          src: "",
          alt: "Image",
        },
        styles: {
          width: "100%",
          maxWidth: 900,
          borderRadius: 16,
        },
      };

    case "video":
      return {
        ...base,
        props: {
          src: "",
        },
        styles: {
          width: "100%",
          maxWidth: 900,
        },
      };

    case "gallery":
      return {
        ...base,
        props: {
          columns: 3,
          images: [],
        },
        styles: {
          width: "100%",
          gap: 16,
        },
      };

    case "card":
      return {
        ...base,
        props: {
          title: "Card title",
          text:
            "Describe this card.",
        },
        styles: {
          padding: 24,
          borderRadius: 16,
        },
      };

    case "features":
      return {
        ...base,
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
          createNode("card"),
          createNode("card"),
          createNode("card"),
        ],
      };

    case "pricing":
      return {
        ...base,
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
          createNode("card"),
          createNode("card"),
          createNode("card"),
        ],
      };

    case "logo":
      return {
        ...base,
        props: {
          text: "Sytely",
        },
        styles: {
          fontSize: 22,
          fontWeight: 700,
        },
      };

    case "menu":
      return {
        ...base,
        props: {
          items: [
            "Home",
            "About",
            "Contact",
          ],
        },
        styles: {
          display: "flex",
          gap: 20,
        },
      };

    case "social":
      return {
        ...base,
        props: {
          items: [
            "Instagram",
            "X",
            "LinkedIn",
          ],
        },
        styles: {
          display: "flex",
          gap: 12,
        },
      };

    case "form":
      return {
        ...base,
        props: {
          title: "Contact us",
          submitLabel:
            "Send message",
        },
        styles: {
          display: "grid",
          gap: 12,
          maxWidth: 560,
        },
      };

    case "testimonial":
      return {
        ...base,
        props: {
          quote:
            "A great experience.",
          author: "Customer",
        },
        styles: {
          padding: 28,
        },
      };

    case "faq":
      return {
        ...base,
        props: {
          question:
            "Frequently asked question",
          answer:
            "Write the answer here.",
        },
        styles: {
          padding: 20,
        },
      };

    case "contact":
      return {
        ...base,
        props: {
          title: "Contact",
          email:
            "hello@example.com",
        },
        styles: {
          padding: 32,
        },
      };

    case "footer":
      return {
        ...base,
        props: {
          text:
            "© 2026 Your Company",
        },
        styles: {
          paddingTop: 32,
          paddingBottom: 32,
        },
      };

    default:
      return base;
  }
}

function cloneNode(
  node: ComponentNode
): ComponentNode {
  return {
    ...node,
    id: uid(),
    props: {
      ...node.props,
    },
    styles: node.styles
      ? { ...node.styles }
      : undefined,
    children:
      node.children?.map(
        cloneNode
      ),
  };
}

function findNode(
  nodes: ComponentNode[],
  id: string
): ComponentNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }

    const found = findNode(
      node.children ?? [],
      id
    );

    if (found) {
      return found;
    }
  }

  return null;
}

function findParent(
  nodes: ComponentNode[],
  id: string
): ComponentNode | null {
  for (const node of nodes) {
    if (
      (node.children ?? []).some(
        child =>
          child.id === id
      )
    ) {
      return node;
    }

    const found = findParent(
      node.children ?? [],
      id
    );

    if (found) {
      return found;
    }
  }

  return null;
}

function replaceNode(
  nodes: ComponentNode[],
  id: string,
  updater: (
    node: ComponentNode
  ) => ComponentNode
): ComponentNode[] {
  return nodes.map(node =>
    node.id === id
      ? updater(node)
      : {
          ...node,
          children:
            node.children
              ? replaceNode(
                  node.children,
                  id,
                  updater
                )
              : node.children,
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
  const next: ComponentNode[] = [];
  const removed: ComponentNode[] =
    [];

  for (const node of nodes) {
    if (ids.has(node.id)) {
      removed.push(node);
      continue;
    }

    const result =
      node.children
        ? removeNodes(
            node.children,
            ids
          )
        : {
            nodes: [],
            removed: [],
          };

    removed.push(
      ...result.removed
    );

    next.push({
      ...node,
      children:
        node.children
          ? result.nodes
          : node.children,
    });
  }

  return {
    nodes: next,
    removed,
  };
}

function insertNodes(
  nodes: ComponentNode[],
  parentId: string | null,
  items: ComponentNode[],
  index = -1
): ComponentNode[] {
  if (!parentId) {
    const next = [...nodes];

    if (
      index < 0 ||
      index > next.length
    ) {
      next.push(...items);
    } else {
      next.splice(
        index,
        0,
        ...items
      );
    }

    return next;
  }

  return nodes.map(node => {
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
          children:
            insertNodes(
              node.children,
              parentId,
              items,
              index
            ),
        }
      : node;
  });
}

function createPage(
  name: string
): SitePage {
  return {
    id: uid(),
    name,
    slug:
      name === "Home"
        ? "/"
        : `/${slugify(name)}`,
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
      createNode("section"),
    ],
  };
}

function normalizeSite(
  site: Site
): Site {
  const stored =
    site as Site & {
      slug?: string;
    };

  return {
    ...site,
    slug:
      stored.slug ||
      slugify(site.name),
    pages:
      site.pages?.length
        ? site.pages
        : [createPage("Home")],
  };
}

function loadSites(): Site[] {
  try {
    const raw =
      localStorage.getItem(
        SITES_KEY
      );

    if (raw) {
      const parsed =
        JSON.parse(raw);

      if (Array.isArray(parsed)) {
        return parsed.map(
          normalizeSite
        );
      }
    }

    const legacy =
      localStorage.getItem(
        LEGACY_KEY
      );

    if (legacy) {
      const parsed =
        JSON.parse(legacy);

      if (parsed) {
        return [
          normalizeSite(parsed),
        ];
      }
    }
  } catch {
    // Invalid local storage.
  }

  return [];
}

function persistSite(
  site: Site
) {
  const existing =
    loadSites();

  const next =
    existing.some(
      item =>
        item.id === site.id
    )
      ? existing.map(item =>
          item.id === site.id
            ? site
            : item
        )
      : [...existing, site];

  localStorage.setItem(
    SITES_KEY,
    JSON.stringify(next)
  );

  localStorage.setItem(
    LEGACY_KEY,
    JSON.stringify(site)
  );
}

export default function Editor({
  siteSlug,
}: {
  siteSlug: string;
}) {
  const [site, setSite] =
    useState<Site | null>(null);

  const [pageId, setPageId] =
    useState("");

  const [selected, setSelected] =
    useState<string[]>([]);

  const [tab, setTab] =
    useState<Tab>(
      "components"
    );

  const [device, setDevice] =
    useState<Device>("desktop");

  const [zoom, setZoom] =
    useState(80);

  const [query, setQuery] =
    useState("");

  const [dirty, setDirty] =
    useState(false);

  const [status, setStatus] =
    useState("Saved");

  const [undoStack, setUndoStack] =
    useState<Site[]>([]);

  const [redoStack, setRedoStack] =
    useState<Site[]>([]);

  const [drafts, setDrafts] =
    useState<
      Record<string, string>
    >({});

  const [uploadTarget, setUploadTarget] =
    useState<string | null>(
      null
    );

  const fileRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const page = useMemo(
    () =>
      site?.pages.find(
        item =>
          item.id === pageId
      ) ??
      site?.pages[0] ??
      null,
    [site, pageId]
  );

  const selectedNode = useMemo(
    () =>
      page &&
      selected.length === 1
        ? findNode(
            page.components,
            selected[0]
          )
        : null,
    [page, selected]
  );

  useEffect(() => {
    const sites =
      loadSites();

    let found =
      sites.find(site => {
        const slug =
          (
            site as Site & {
              slug?: string;
            }
          ).slug ||
          slugify(site.name);

        return (
          slug === siteSlug ||
          site.id === siteSlug ||
          slugify(site.name) ===
            siteSlug
        );
      });

    if (!found) {
      if (sites.length === 0) {
        found = {
          id: uid(),
          name: "My Website",
          slug: "my-website",
          version: 1,
          theme: "system",
          pages: [
            createPage("Home"),
          ],
        };

        persistSite(found);
      }
    }

    if (found) {
      found =
        normalizeSite(found);

      setSite(found);
      setPageId(
        found.pages[0]?.id ?? ""
      );
    }
  }, [siteSlug]);

  const commit = useCallback(
    (
      updater: (
        site: Site
      ) => Site
    ) => {
      setSite(current => {
        if (!current) {
          return current;
        }

        setUndoStack(history => [
          ...history.slice(-39),
          current,
        ]);

        setRedoStack([]);
        setDirty(true);
        setStatus(
          "Unsaved changes"
        );

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
      commit(current => ({
        ...current,
        pages:
          current.pages.map(
            page =>
              page.id === pageId
                ? updater(page)
                : page
          ),
      }));
    },
    [commit, pageId]
  );

  const updateNode = useCallback(
    (
      nodeId: string,
      updater: (
        node: ComponentNode
      ) => ComponentNode
    ) => {
      updatePage(page => ({
        ...page,
        components:
          replaceNode(
            page.components,
            nodeId,
            updater
          ),
      }));
    },
    [updatePage]
  );

  const updateProp =
    useCallback(
      (
        nodeId: string,
        key: string,
        value: unknown
      ) => {
        updateNode(
          nodeId,
          node => ({
            ...node,
            props: {
              ...node.props,
              [key]: value,
            },
          })
        );
      },
      [updateNode]
    );

  const updateStyle =
    useCallback(
      (
        nodeId: string,
        key: string,
        value: unknown
      ) => {
        updateNode(
          nodeId,
          node => ({
            ...node,
            styles: {
              ...(node.styles ?? {}),
              [key]: value,
            },
          })
        );
      },
      [updateNode]
    );

  const save = useCallback(
    () => {
      if (!site) {
        return;
      }

      persistSite(site);
      setDirty(false);
      setStatus("Saved");
    },
    [site]
  );

  const undo = useCallback(
    () => {
      setUndoStack(history => {
        const previous =
          history[
            history.length - 1
          ];

        if (!previous) {
          return history;
        }

        setSite(current => {
          if (current) {
            setRedoStack(
              future => [
                ...future,
                current,
              ]
            );
          }

          return previous;
        });

        setDirty(true);
        setStatus(
          "Unsaved changes"
        );

        return history.slice(
          0,
          -1
        );
      });
    },
    []
  );

  const redo = useCallback(
    () => {
      setRedoStack(future => {
        const next =
          future[
            future.length - 1
          ];

        if (!next) {
          return future;
        }

        setSite(current => {
          if (current) {
            setUndoStack(
              history => [
                ...history,
                current,
              ]
            );
          }

          return next;
        });

        setDirty(true);
        setStatus(
          "Unsaved changes"
        );

        return future.slice(
          0,
          -1
        );
      });
    },
    []
  );

  const addComponent =
    useCallback(
      (
        type: ComponentType
      ) => {
        const newNode =
          createNode(type);

        updatePage(page => ({
          ...page,
          components: [
            ...page.components,
            newNode,
          ],
        }));

        setSelected([
          newNode.id,
        ]);
      },
      [updatePage]
    );

  const deleteSelected =
    useCallback(() => {
      if (!selected.length) {
        return;
      }

      updatePage(page => ({
        ...page,
        components:
          removeNodes(
            page.components,
            new Set(selected)
          ).nodes,
      }));

      setSelected([]);
    }, [selected, updatePage]);

  const duplicateSelected =
    useCallback(() => {
      if (
        !page ||
        !selected.length
      ) {
        return;
      }

      const originals =
        selected
          .map(id =>
            findNode(
              page.components,
              id
            )
          )
          .filter(
            (
              value
            ): value is ComponentNode =>
              Boolean(value)
          );

      if (!originals.length) {
        return;
      }

      const copies =
        originals.map(
          cloneNode
        );

      const first =
        originals[0];

      const parent =
        findParent(
          page.components,
          first.id
        );

      const list =
        parent?.children ??
        page.components;

      const index =
        list.findIndex(
          item =>
            item.id === first.id
        );

      updatePage(page => ({
        ...page,
        components:
          insertNodes(
            page.components,
            parent?.id ?? null,
            copies,
            index + 1
          ),
      }));

      setSelected(
        copies.map(
          item => item.id
        )
      );
    }, [
      page,
      selected,
      updatePage,
    ]);

  const moveSelected =
    useCallback(
      (direction: -1 | 1) => {
        if (
          !page ||
          selected.length !== 1
        ) {
          return;
        }

        const id =
          selected[0];

        const parent =
          findParent(
            page.components,
            id
          );

        const list =
          parent?.children ??
          page.components;

        const index =
          list.findIndex(
            item =>
              item.id === id
          );

        const nextIndex =
          index + direction;

        if (
          index < 0 ||
          nextIndex < 0 ||
          nextIndex >= list.length
        ) {
          return;
        }

        const reordered =
          [...list];

        const item =
          reordered.splice(
            index,
            1
          )[0];

        reordered.splice(
          nextIndex,
          0,
          item
        );

        updatePage(page => {
          if (parent) {
            return {
              ...page,
              components:
                replaceNode(
                  page.components,
                  parent.id,
                  parentNode => ({
                    ...parentNode,
                    children:
                      reordered,
                  })
                ),
            };
          }

          return {
            ...page,
            components:
              reordered,
          };
        });
      },
      [
        page,
        selected,
        updatePage,
      ]
    );

  const renameSite =
    useCallback(() => {
      if (!site) {
        return;
      }

      const value =
        window.prompt(
          "Website name",
          site.name
        );

      if (!value?.trim()) {
        return;
      }

      commit(current => ({
        ...current,
        name: value.trim(),
      }));
    }, [site, commit]);

  const addPage =
    useCallback(() => {
      const nextPage =
        createPage(
          `Page ${
            (site?.pages.length ??
              0) + 1
          }`
        );

      commit(current => ({
        ...current,
        pages: [
          ...current.pages,
          nextPage,
        ],
      }));

      setPageId(
        nextPage.id
      );

      setSelected([]);
    }, [site, commit]);

  const renamePage =
    useCallback(
      (id: string) => {
        const current =
          site?.pages.find(
            page =>
              page.id === id
          );

        if (!current) {
          return;
        }

        const value =
          window.prompt(
            "Page name",
            current.name
          );

        if (!value?.trim()) {
          return;
        }

        commit(site => ({
          ...site,
          pages:
            site.pages.map(
              page =>
                page.id === id
                  ? {
                      ...page,
                      name:
                        value.trim(),
                      slug:
                        id ===
                        site.pages[0]?.id
                          ? "/"
                          : `/${slugify(
                              value
                            )}`,
                    }
                  : page
            ),
        }));
      },
      [site, commit]
    );

  const deletePage =
    useCallback(
      (id: string) => {
        if (
          !site ||
          site.pages.length <= 1
        ) {
          return;
        }

        const current =
          site.pages.find(
            page =>
              page.id === id
          );

        if (
          !current ||
          !window.confirm(
            `Delete “${current.name}”?`
          )
        ) {
          return;
        }

        const remaining =
          site.pages.filter(
            page =>
              page.id !== id
          );

        commit(site => ({
          ...site,
          pages: remaining,
        }));

        if (pageId === id) {
          setPageId(
            remaining[0].id
          );
        }
      },
      [
        site,
        pageId,
        commit,
      ]
    );

  const startUpload =
    useCallback(
      (id: string) => {
        setUploadTarget(id);
        fileRef.current?.click();
      },
      []
    );

  const handleUpload =
    useCallback(
      (
        event: ChangeEvent<HTMLInputElement>
      ) => {
        const file =
          event.target.files?.[0];

        event.target.value = "";

        const target =
          uploadTarget;

        setUploadTarget(null);

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
      [
        uploadTarget,
        updateProp,
      ]
    );

  const handleDrop =
    useCallback(
      (event: DragEvent) => {
        event.preventDefault();

        const raw =
          event.dataTransfer.getData(
            "application/sytely"
          );

        if (!raw) {
          return;
        }

        try {
          const payload =
            JSON.parse(raw);

          if (
            payload.kind ===
              "component" &&
            payload.type
          ) {
            addComponent(
              payload.type
            );
            return;
          }

          if (
            payload.kind ===
              "node" &&
            page
          ) {
            const result =
              removeNodes(
                page.components,
                new Set(
                  payload.ids ??
                    []
                )
              );

            const copies =
              result.removed.map(
                cloneNode
              );

            updatePage(page => ({
              ...page,
              components:
                insertNodes(
                  page.components,
                  null,
                  copies
                ),
            }));

            setSelected(
              copies.map(
                item => item.id
              )
            );
          }
        } catch {
          // Ignore invalid drag data.
        }
      },
      [
        addComponent,
        page,
        updatePage,
      ]
    );

  const openPreview =
    useCallback(() => {
      if (!site || !page) {
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
        new URLSearchParams({
          page: page.slug,
          device,
        });

      window.open(
        `/${slug}/preview?${params.toString()}`,
        "_blank",
        "noopener,noreferrer"
      );
    }, [
      site,
      page,
      device,
    ]);

  useEffect(() => {
    const handler =
      (event: KeyboardEvent) => {
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
        } else if (
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
        } else if (
          !editing &&
          (event.metaKey ||
            event.ctrlKey) &&
          event.key.toLowerCase() ===
            "d"
        ) {
          event.preventDefault();
          duplicateSelected();
        } else if (
          !editing &&
          (event.key ===
            "Delete" ||
            event.key ===
              "Backspace")
        ) {
          event.preventDefault();
          deleteSelected();
        } else if (
          !editing &&
          event.key ===
            "Escape"
        ) {
          setSelected([]);
        }
      };

    window.addEventListener(
      "keydown",
      handler
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handler
      );
  }, [
    save,
    undo,
    redo,
    duplicateSelected,
    deleteSelected,
  ]);

  if (!site) {
    return (
      <main className="editor-loading">
        <strong>
          Website not found
        </strong>

        <a href="/mysites">
          Back to My Sites
        </a>
      </main>
    );
  }

  const filtered =
    catalog.filter(item =>
      item.label
        .toLowerCase()
        .includes(
          query.toLowerCase()
        )
    );

  return (
    <div className="sytely-editor">
      <header className="editor-topbar">
        <a
          className="editor-logo"
          href="/mysites"
        >
          <span>S</span>
          Sytely
        </a>

        <button
          className="site-title"
          onClick={renameSite}
        >
          {site.name}
          <small>⌄</small>
        </button>

        <div className="history">
          <button
            disabled={
              !undoStack.length
            }
            onClick={undo}
          >
            ↶
          </button>

          <button
            disabled={
              !redoStack.length
            }
            onClick={redo}
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
          ).map(value => (
            <button
              key={value}
              className={
                device === value
                  ? "active"
                  : ""
              }
              onClick={() =>
                setDevice(value)
              }
            >
              {value}
            </button>
          ))}
        </div>

        <div className="top-actions">
          <span
            className={
              dirty ? "dirty" : ""
            }
          >
            {status}
          </span>

          <button
            onClick={openPreview}
          >
            Preview
          </button>

          <button
            className="save"
            onClick={save}
          >
            Save
          </button>
        </div>
      </header>

      <div className="editor-body">
        <aside className="left-panel">
          <div className="tabs">
            {(
              [
                "components",
                "templates",
                "pages",
                "layers",
              ] as Tab[]
            ).map(value => (
              <button
                key={value}
                className={
                  tab === value
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setTab(value)
                }
              >
                {value}
              </button>
            ))}
          </div>

          {tab ===
            "components" && (
            <div className="panel-content">
              <h2>
                Components
              </h2>

              <p>
                Drag or click to add.
              </p>

              <input
                value={query}
                onChange={event =>
                  setQuery(
                    event.target.value
                  )
                }
                placeholder="Search components"
              />

              <div className="component-grid">
                {filtered.map(
                  component => (
                    <button
                      key={
                        component.type
                      }
                      draggable
                      onClick={() =>
                        addComponent(
                          component.type
                        )
                      }
                      onDragStart={event =>
                        event.dataTransfer.setData(
                          "application/sytely",
                          JSON.stringify(
                            {
                              kind:
                                "component",
                              type:
                                component.type,
                            }
                          )
                        )
                      }
                    >
                      <b>
                        {component.icon}
                      </b>

                      <span>
                        {
                          component.label
                        }
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {tab ===
            "templates" && (
            <div className="panel-content">
              <h2>
                Sections
              </h2>

              <p>
                Insert editable sections.
              </p>

              {[
                [
                  "Hero",
                  "heading",
                ],
                [
                  "Features",
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
                    className="template"
                    key={label}
                    onClick={() => {
                      const section =
                        createNode(
                          "section"
                        );

                      section.children =
                        [
                          createNode(
                            type as ComponentType
                          ),
                        ];

                      updatePage(
                        page => ({
                          ...page,
                          components:
                            [
                              ...page.components,
                              section,
                            ],
                        })
                      );

                      setSelected([
                        section.id,
                      ]);
                    }}
                  >
                    <b>
                      {label}
                    </b>

                    <span>
                      Responsive section
                    </span>
                  </button>
                )
              )}
            </div>
          )}

          {tab === "pages" && (
            <div className="panel-content">
              <div className="panel-title">
                <div>
                  <h2>
                    Pages
                  </h2>

                  <p>
                    Pages in this website.
                  </p>
                </div>

                <button
                  onClick={addPage}
                >
                  +
                </button>
              </div>

              {site.pages.map(
                pageItem => (
                  <div
                    className={
                      pageItem.id ===
                      pageId
                        ? "page-row active"
                        : "page-row"
                    }
                    key={
                      pageItem.id
                    }
                  >
                    <button
                      onClick={() => {
                        setPageId(
                          pageItem.id
                        );
                        setSelected(
                          []
                        );
                      }}
                    >
                      <b>
                        {
                          pageItem.name
                        }
                      </b>

                      <span>
                        {
                          pageItem.slug
                        }
                      </span>
                    </button>

                    <button
                      onClick={() =>
                        renamePage(
                          pageItem.id
                        )
                      }
                    >
                      …
                    </button>

                    {site.pages.length >
                      1 && (
                      <button
                        onClick={() =>
                          deletePage(
                            pageItem.id
                          )
                        }
                      >
                        ×
                      </button>
                    )}
                  </div>
                )
              )}
            </div>
          )}

          {tab === "layers" && (
            <div className="panel-content">
              <h2>
                Layers
              </h2>

              <p>
                Click a layer to select it.
              </p>

              <LayerTree
                nodes={
                  page?.components ??
                  []
                }
                selected={
                  selected
                }
                onSelect={id =>
                  setSelected([
                    id,
                  ])
                }
              />
            </div>
          )}
        </aside>

        <main className="canvas-main">
          <div className="canvas-bar">
            <span>
              {page?.name}
              <em>
                {page?.slug}
              </em>
            </span>

            <div>
              <button
                onClick={() =>
                  setZoom(
                    value =>
                      Math.max(
                        40,
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
                onClick={() =>
                  setZoom(
                    value =>
                      Math.min(
                        120,
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
            className="canvas"
            onDragOver={event =>
              event.preventDefault()
            }
            onDrop={handleDrop}
            onClick={() =>
              setSelected([])
            }
          >
            <div
              className={`frame ${device}`}
              style={{
                transform:
                  `scale(${zoom / 100})`,
              }}
            >
              <div
                className="website-page"
                onClick={event =>
                  event.stopPropagation()
                }
                style={{
                  background:
                    stringValue(
                      page?.styles
                        ?.background,
                      "var(--sytely-page)"
                    ),
                  paddingTop:
                    numberValue(
                      page?.margins
                        .top
                    ),
                  paddingRight:
                    numberValue(
                      page?.margins
                        .right,
                      32
                    ),
                  paddingBottom:
                    numberValue(
                      page?.margins
                        .bottom
                    ),
                  paddingLeft:
                    numberValue(
                      page?.margins
                        .left,
                      32
                    ),
                }}
              >
                {page?.components.map(
                  component => (
                    <EditorNode
                      key={
                        component.id
                      }
                      item={
                        component
                      }
                      device={
                        device
                      }
                      selected={
                        selected
                      }
                      onSelect={(
                        id,
                        additive
                      ) =>
                        setSelected(
                          current =>
                            additive
                              ? current.includes(
                                  id
                                )
                                ? current.filter(
                                    value =>
                                      value !==
                                      id
                                  )
                                : [
                                    ...current,
                                    id,
                                  ]
                              : [id]
                        )
                      }
                      onDragStart={(
                        event,
                        id
                      ) =>
                        event.dataTransfer.setData(
                          "application/sytely",
                          JSON.stringify(
                            {
                              kind:
                                "node",
                              ids: selected.includes(
                                id
                              )
                                ? selected
                                : [
                                    id,
                                  ],
                            }
                          )
                        )
                      }
                    />
                  )
                )}
              </div>
            </div>
          </div>
        </main>

        {selectedNode && (
          <Inspector
            node={
              selectedNode
            }
            updateProp={
              updateProp
            }
            updateStyle={
              updateStyle
            }
            upload={
              startUpload
            }
            close={() =>
              setSelected([])
            }
            drafts={
              drafts
            }
            setDrafts={
              setDrafts
            }
          />
        )}
      </div>

      {selectedNode && (
        <div className="selection-toolbar">
          <span>
            {selected.length} selected
          </span>

          <button
            onClick={
              duplicateSelected
            }
          >
            Duplicate
          </button>

          <button
            onClick={() =>
              moveSelected(-1)
            }
          >
            ↑
          </button>

          <button
            onClick={() =>
              moveSelected(1)
            }
          >
            ↓
          </button>

          <button
            className="danger"
            onClick={
              deleteSelected
            }
          >
            Delete
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        hidden
        type="file"
        accept="image/*"
        onChange={
          handleUpload
        }
      />
    </div>
  );
}

function EditorNode({
  item,
  device,
  selected,
  onSelect,
  onDragStart,
}: {
  item: ComponentNode;
  device: Device;
  selected: string[];
  onSelect: (
    id: string,
    additive: boolean
  ) => void;
  onDragStart: (
    event: DragEvent,
    id: string
  ) => void;
}) {
  const active =
    selected.includes(
      item.id
    );

  const children =
    item.children?.map(
      child => (
        <EditorNode
          key={child.id}
          item={child}
          device={device}
          selected={selected}
          onSelect={onSelect}
          onDragStart={
            onDragStart
          }
        />
      )
    );

  return (
    <div
      className={
        active
          ? "editor-node active"
          : "editor-node"
      }
      draggable
      onDragStart={event =>
        onDragStart(
          event,
          item.id
        )
      }
      onClick={event => {
        event.stopPropagation();

        onSelect(
          item.id,
          event.metaKey ||
            event.ctrlKey ||
            event.shiftKey
        );
      }}
    >
      {renderNode(item, {
        device,
        children,
      })}

      {active && (
        <span className="node-tag">
          {item.type}
        </span>
      )}
    </div>
  );
}

function LayerTree({
  nodes,
  selected,
  onSelect,
  depth = 0,
}: {
  nodes: ComponentNode[];
  selected: string[];
  onSelect: (
    id: string
  ) => void;
  depth?: number;
}) {
  return (
    <>
      {nodes.map(node => (
        <div key={node.id}>
          <button
            className={
              selected.includes(
                node.id
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
                node.id
              )
            }
          >
            <span>
              {node.type}
            </span>
          </button>

          {node.children && (
            <LayerTree
              nodes={
                node.children
              }
              selected={
                selected
              }
              onSelect={
                onSelect
              }
              depth={
                depth + 1
              }
            />
          )}
        </div>
      ))}
    </>
  );
}

function Inspector({
  node,
  updateProp,
  updateStyle,
  upload,
  close,
  drafts,
  setDrafts,
}: {
  node: ComponentNode;
  updateProp: (
    id: string,
    key: string,
    value: unknown
  ) => void;
  updateStyle: (
    id: string,
    key: string,
    value: unknown
  ) => void;
  upload: (
    id: string
  ) => void;
  close: () => void;
  drafts: Record<
    string,
    string
  >;
  setDrafts: Dispatch<
    SetStateAction<
      Record<string, string>
    >
  >;
}) {
  const getProp = (
    key: string,
    fallback = ""
  ) =>
    stringValue(
      node.props[key],
      fallback
    );

  const numberField = (
    key: string,
    fallback = 0
  ) => {
    const draftKey =
      `${node.id}:${key}`;

    const committed =
      numberValue(
        node.styles?.[key],
        fallback
      );

    const value =
      drafts[draftKey] ??
      String(committed);

    return (
      <label>
        <span>{key}</span>

        <input
          inputMode="decimal"
          value={value}
          onChange={event => {
            const next =
              event.target.value;

            setDrafts(
              current => ({
                ...current,
                [draftKey]:
                  next,
              })
            );

            if (
              next !== "" &&
              Number.isFinite(
                Number(next)
              )
            ) {
              updateStyle(
                node.id,
                key,
                Number(next)
              );
            }
          }}
          onBlur={event => {
            const parsed =
              Number(
                event.target.value
              );

            setDrafts(
              current => {
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
              Number.isFinite(
                parsed
              )
            ) {
              updateStyle(
                node.id,
                key,
                parsed
              );
            }
          }}
        />
      </label>
    );
  };

  return (
    <aside className="inspector">
      <div className="inspector-head">
        <div>
          <b>
            {node.type}
          </b>
          <small>
            Selected element
          </small>
        </div>

        <button
          onClick={close}
        >
          ×
        </button>
      </div>

      <section>
        <h3>
          Content
        </h3>

        {node.type ===
          "heading" && (
          <TextField
            label="Text"
            value={getProp(
              "text"
            )}
            onChange={value =>
              updateProp(
                node.id,
                "text",
                value
              )
            }
          />
        )}

        {node.type ===
          "text" && (
          <TextField
            label="Text"
            value={getProp(
              "text"
            )}
            area
            onChange={value =>
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
              value={getProp(
                "text"
              )}
              onChange={value =>
                updateProp(
                  node.id,
                  "text",
                  value
                )
              }
            />

            <TextField
              label="Link"
              value={getProp(
                "linkTo"
              )}
              onChange={value =>
                updateProp(
                  node.id,
                  "linkTo",
                  value
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
              value={getProp(
                "src"
              )}
              onChange={value =>
                updateProp(
                  node.id,
                  "src",
                  value
                )
              }
            />

            <TextField
              label="Alt"
              value={getProp(
                "alt"
              )}
              onChange={value =>
                updateProp(
                  node.id,
                  "alt",
                  value
                )
              }
            />

            <button
              className="upload"
              onClick={() =>
                upload(
                  node.id
                )
              }
            >
              Upload image
            </button>
          </>
        )}

        {node.type ===
          "logo" && (
          <TextField
            label="Logo text"
            value={getProp(
              "text"
            )}
            onChange={value =>
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
            value={getProp(
              "icon",
              "✦"
            )}
            onChange={value =>
              updateProp(
                node.id,
                "icon",
                value
              )
            }
          />
        )}

        {node.type ===
          "video" && (
          <TextField
            label="Video URL"
            value={getProp(
              "src"
            )}
            onChange={value =>
              updateProp(
                node.id,
                "src",
                value
              )
            }
          />
        )}

        {node.type ===
          "form" && (
          <>
            <TextField
              label="Title"
              value={getProp(
                "title"
              )}
              onChange={value =>
                updateProp(
                  node.id,
                  "title",
                  value
                )
              }
            />

            <TextField
              label="Submit label"
              value={getProp(
                "submitLabel",
                "Send message"
              )}
              onChange={value =>
                updateProp(
                  node.id,
                  "submitLabel",
                  value
                )
              }
            />
          </>
        )}

        {node.type ===
          "card" && (
          <>
            <TextField
              label="Title"
              value={getProp(
                "title"
              )}
              onChange={value =>
                updateProp(
                  node.id,
                  "title",
                  value
                )
              }
            />

            <TextField
              label="Description"
              value={getProp(
                "text"
              )}
              area
              onChange={value =>
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
          "faq" && (
          <>
            <TextField
              label="Question"
              value={getProp(
                "question"
              )}
              onChange={value =>
                updateProp(
                  node.id,
                  "question",
                  value
                )
              }
            />

            <TextField
              label="Answer"
              value={getProp(
                "answer"
              )}
              area
              onChange={value =>
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
          "testimonial" && (
          <>
            <TextField
              label="Quote"
              value={getProp(
                "quote"
              )}
              area
              onChange={value =>
                updateProp(
                  node.id,
                  "quote",
                  value
                )
              }
            />

            <TextField
              label="Author"
              value={getProp(
                "author"
              )}
              onChange={value =>
                updateProp(
                  node.id,
                  "author",
                  value
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
          0
        )}

        {numberField(
          "maxWidth",
          0
        )}

        {numberField(
          "gap",
          24
        )}

        {numberField(
          "paddingTop",
          0
        )}

        {numberField(
          "paddingRight",
          0
        )}

        {numberField(
          "paddingBottom",
          0
        )}

        {numberField(
          "paddingLeft",
          0
        )}

        {node.type ===
          "section" && (
          <>
            <label>
              <span>
                Direction
              </span>

              <select
                value={stringValue(
                  node.styles
                    ?.flexDirection,
                  "column"
                )}
                onChange={event =>
                  updateStyle(
                    node.id,
                    "flexDirection",
                    event.target
                      .value
                  )
                }
              >
                <option value="column">
                  Column
                </option>
                <option value="row">
                  Row
                </option>
              </select>
            </label>

            <label>
              <span>
                Columns
              </span>

              <select
                value={stringValue(
                  node.styles
                    ?.gridTemplateColumns,
                  "1fr"
                )}
                onChange={event => {
                  updateStyle(
                    node.id,
                    "display",
                    "grid"
                  );

                  updateStyle(
                    node.id,
                    "gridTemplateColumns",
                    event.target
                      .value
                  );
                }}
              >
                <option value="1fr">
                  1 column
                </option>

                <option value="repeat(2,minmax(0,1fr))">
                  2 columns
                </option>

                <option value="repeat(3,minmax(0,1fr))">
                  3 columns
                </option>

                <option value="repeat(4,minmax(0,1fr))">
                  4 columns
                </option>
              </select>
            </label>
          </>
        )}
      </section>

      <section>
        <h3>
          Typography
        </h3>

        {numberField(
          "fontSize",
          16
        )}

        {numberField(
          "fontWeight",
          400
        )}

        {numberField(
          "lineHeight",
          1.5
        )}

        <label>
          <span>
            Align
          </span>

          <select
            value={stringValue(
              node.styles
                ?.textAlign,
              "left"
            )}
            onChange={event =>
              updateStyle(
                node.id,
                "textAlign",
                event.target
                  .value
              )
            }
          >
            <option value="left">
              left
            </option>
            <option value="center">
              center
            </option>
            <option value="right">
              right
            </option>
          </select>
        </label>
      </section>

      <section>
        <h3>
          Appearance
        </h3>

        <TextField
          label="Background"
          value={stringValue(
            node.styles
              ?.background
          )}
          onChange={value =>
            updateStyle(
              node.id,
              "background",
              value
            )
          }
        />

        {numberField(
          "borderRadius",
          0
        )}

        <TextField
          label="Color"
          value={stringValue(
            node.styles?.color
          )}
          onChange={value =>
            updateStyle(
              node.id,
              "color",
              value
            )
          }
        />
      </section>
    </aside>
  );
}

function TextField({
  label,
  value,
  onChange,
  area = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  area?: boolean;
}) {
  return (
    <label>
      <span>{label}</span>

      {area ? (
        <textarea
          rows={4}
          value={value}
          onChange={event =>
            onChange(
              event.target.value
            )
          }
        />
      ) : (
        <input
          value={value}
          onChange={event =>
            onChange(
              event.target.value
            )
          }
        />
      )}
    </label>
  );
}