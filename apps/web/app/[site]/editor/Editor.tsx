"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
  type Dispatch,
  type SetStateAction,
} from "react";

import {
  SytelyRenderer,
} from "@sytely/renderer";

import type {
  ComponentNode,
  ComponentType,
  Site,
  SitePage,
} from "@sytely/types";

type Device =
  | "desktop"
  | "tablet"
  | "mobile";

type Panel =
  | "components"
  | "templates"
  | "pages"
  | "layers";

type DropPosition =
  | "before"
  | "after"
  | "inside";

type DropTarget = {
  id: string | null;
  parentId: string | null;
  index: number;
  position: DropPosition;
  sectionId: string | null;
};

type DragPayload =
  | {
      kind: "component";
      type: ComponentType;
    }
  | {
      kind: "template";
      node: ComponentNode;
    }
  | {
      kind: "node";
      ids: string[];
    };

const STORAGE_SITES =
  "sytely-sites";

const STORAGE_LEGACY =
  "sytely-site";

const info: Record<
  ComponentType,
  [string, string]
> = {
  section: ["▦", "Section"],
  heading: ["T", "Heading"],
  text: ["≡", "Text"],
  button: ["→", "Button"],
  image: ["▧", "Image"],
  video: ["▶", "Video"],
  gallery: ["▥", "Gallery"],
  divider: ["—", "Divider"],
  icon: ["✦", "Icon"],
  logo: ["◎", "Logo"],
  menu: ["☰", "Menu"],
  social: ["●", "Social"],
  form: ["□", "Form"],
  card: ["▣", "Card"],
  features: ["◆", "Features"],
  pricing: ["$", "Pricing"],
  testimonial: [
    "“",
    "Testimonial",
  ],
  faq: ["?", "FAQ"],
  contact: ["@", "Contact"],
  footer: ["▰", "Footer"],
};

const types =
  Object.keys(
    info
  ) as ComponentType[];

function uid() {
  if (
    typeof crypto !==
      "undefined" &&
    crypto.randomUUID
  ) {
    return crypto.randomUUID();
  }

  return `node-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function slugify(
  value: string
) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        "") ||
    "website"
  );
}

function n(
  type: ComponentType,
  props: Record<
    string,
    unknown
  > = {},
  styles: Record<
    string,
    unknown
  > = {},
  children?: ComponentNode[]
): ComponentNode {
  return {
    id: uid(),
    type,
    props,
    styles,
    ...(children
      ? { children }
      : {}),
  };
}

function makeComponent(
  type: ComponentType
): ComponentNode {
  switch (type) {
    case "section":
      return n(
        type,
        {},
        {
          display: "grid",
          gridTemplateColumns:
            "1fr",
          gap: 24,
          paddingTop: 56,
          paddingRight: 40,
          paddingBottom: 56,
          paddingLeft: 40,
        },
        [
          n(
            "heading",
            {
              text:
                "Your heading",
            },
            {
              fontSize: 46,
              fontWeight: 700,
            }
          ),
          n(
            "text",
            {
              text:
                "Add your content here.",
            },
            {
              fontSize: 18,
            }
          ),
        ]
      );

    case "heading":
      return n(
        type,
        {
          text:
            "Your heading",
        },
        {
          fontSize: 46,
          fontWeight: 700,
        }
      );

    case "text":
      return n(
        type,
        {
          text:
            "Add your content here.",
        },
        {
          fontSize: 18,
          maxWidth: 720,
        }
      );

    case "button":
      return n(
        type,
        {
          text:
            "Get started",
          linkTo: "#",
        }
      );

    case "image":
      return n(
        type,
        {
          src: "",
          alt: "Image",
        },
        {
          maxWidth: 900,
        }
      );

    case "video":
      return n(
        type,
        {
          src: "",
        },
        {
          maxWidth: 900,
        }
      );

    case "gallery":
      return n(
        type,
        {
          images: [],
          columns: 3,
        }
      );

    case "divider":
      return n(
        type
      );

    case "icon":
      return n(
        type,
        {
          icon: "✦",
        },
        {
          fontSize: 32,
        }
      );

    case "logo":
      return n(
        type,
        {
          text: "Sytely",
        },
        {
          fontSize: 22,
          fontWeight: 700,
        }
      );

    case "menu":
      return n(
        type,
        {
          items: [
            "Home",
            "About",
            "Contact",
          ],
        }
      );

    case "social":
      return n(
        type,
        {
          items: [
            "Instagram",
            "X",
            "LinkedIn",
          ],
        }
      );

    case "form":
      return n(
        type,
        {
          title:
            "Contact us",
          submitLabel:
            "Send message",
        }
      );

    case "card":
      return n(
        type,
        {
          title:
            "Card title",
          text:
            "Describe this card.",
        }
      );

    case "features":
      return n(
        type,
        {
          columns: 3,
        },
        {
          display: "grid",
          gridTemplateColumns:
            "repeat(3,minmax(0,1fr))",
          gap: 18,
        },
        [
          makeComponent(
            "card"
          ),
          makeComponent(
            "card"
          ),
          makeComponent(
            "card"
          ),
        ]
      );

    case "pricing":
      return n(
        type,
        {
          columns: 3,
        },
        {
          display: "grid",
          gridTemplateColumns:
            "repeat(3,minmax(0,1fr))",
          gap: 18,
        },
        [
          n(
            "card",
            {
              title:
                "Starter",
              text:
                "$9 / month",
            }
          ),
          n(
            "card",
            {
              title: "Pro",
              text:
                "$24 / month",
            }
          ),
          n(
            "card",
            {
              title:
                "Business",
              text:
                "$59 / month",
            }
          ),
        ]
      );

    case "testimonial":
      return n(
        type,
        {
          quote:
            "A thoughtful product makes the whole experience easier.",
          author:
            "Customer",
        }
      );

    case "faq":
      return n(
        type,
        {
          question:
            "Frequently asked question",
          answer:
            "Write the answer here.",
        }
      );

    case "contact":
      return n(
        type,
        {
          title: "Contact",
          email:
            "hello@example.com",
          phone:
            "+1 000 000 0000",
        }
      );

    case "footer":
      return n(
        type,
        {
          text:
            "© 2026 Your brand. All rights reserved.",
        }
      );
  }
}

function section(
  children: ComponentNode[],
  styles: Record<
    string,
    unknown
  > = {}
) {
  return n(
    "section",
    {},
    {
      display: "grid",
      gridTemplateColumns:
        "1fr",
      gap: 24,
      paddingTop: 56,
      paddingRight: 40,
      paddingBottom: 56,
      paddingLeft: 40,
      ...styles,
    },
    children
  );
}

const initialSite: Site = {
  id: "site-1",
  name: "My Website",
  slug: "my-website",
  version: 1,
  theme: "system",
  pages: [
    {
      id: "home",
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
      },
      components: [
        section(
          [
            n(
              "heading",
              {
                text:
                  "Build websites visually.",
              },
              {
                fontSize: 56,
                fontWeight: 750,
                textAlign:
                  "center",
                width: "100%",
              }
            ),
            n(
              "text",
              {
                text:
                  "Create polished responsive websites without fighting the layout.",
              },
              {
                fontSize: 18,
                textAlign:
                  "center",
                maxWidth: 700,
                justifySelf:
                  "center",
              }
            ),
            n(
              "button",
              {
                text:
                  "Get started",
                linkTo: "#",
              },
              {
                justifySelf:
                  "center",
              }
            ),
          ],
          {
            alignItems:
              "center",
          }
        ),
        section([
          makeComponent(
            "features"
          ),
        ]),
        section([
          makeComponent(
            "pricing"
          ),
        ]),
      ],
    },
  ],
};

function normalizeSite(
  site: Site
): Site {
  return {
    ...site,
    slug:
      site.slug ||
      slugify(site.name),
    pages:
      site.pages?.length
        ? site.pages
        : [
            {
              id: uid(),
              name: "Home",
              slug: "/",
              margins: {
                top: 0,
                right: 32,
                bottom: 0,
                left: 32,
              },
              components: [],
            },
          ],
  };
}

function clone(
  node: ComponentNode
): ComponentNode {
  return {
    ...node,
    id: uid(),
    props: {
      ...node.props,
    },
    styles: node.styles
      ? {
          ...node.styles,
        }
      : {},
    children:
      node.children?.map(
        clone
      ),
  };
}

function find(
  nodes: ComponentNode[],
  id: string
): ComponentNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }

    const child = find(
      node.children ?? [],
      id
    );

    if (child) {
      return child;
    }
  }

  return null;
}

function parentOf(
  nodes: ComponentNode[],
  id: string
): ComponentNode | null {
  for (const node of nodes) {
    if (
      (node.children ?? []).some(
        (child) =>
          child.id === id
      )
    ) {
      return node;
    }

    const parent =
      parentOf(
        node.children ?? [],
        id
      );

    if (parent) {
      return parent;
    }
  }

  return null;
}

function contains(
  node: ComponentNode,
  id: string
) {
  return (
    node.id === id ||
    (node.children ?? []).some(
      (child) =>
        contains(
          child,
          id
        )
    )
  );
}

function mapNodes(
  nodes: ComponentNode[],
  fn: (
    node: ComponentNode
  ) => ComponentNode
) {
  return nodes.map(
    (node) =>
      fn({
        ...node,
        children:
          node.children
            ? mapNodes(
                node.children,
                fn
              )
            : node.children,
      })
  );
}

function removeIds(
  nodes: ComponentNode[],
  ids: Set<string>
): {
  nodes: ComponentNode[];
  removed: ComponentNode[];
} {
  const removed: ComponentNode[] =
    [];

  const next: ComponentNode[] =
    [];

  for (const node of nodes) {
    if (ids.has(node.id)) {
      removed.push(node);
      continue;
    }

    const childResult =
      removeIds(
        node.children ?? [],
        ids
      );

    removed.push(
      ...childResult.removed
    );

    next.push({
      ...node,
      children: node.children
        ? childResult.nodes
        : node.children,
    });
  }

  return {
    nodes: next,
    removed,
  };
}

function insertAt(
  nodes: ComponentNode[],
  parentId: string | null,
  index: number,
  items: ComponentNode[]
) {
  if (!parentId) {
    const next = [
      ...nodes,
    ];

    next.splice(
      Math.max(
        0,
        Math.min(
          index,
          next.length
        )
      ),
      0,
      ...items
    );

    return next;
  }

  return nodes.map(
    (node) => {
      if (node.id === parentId) {
        const children = [
          ...(node.children ??
            []),
        ];

        children.splice(
          Math.max(
            0,
            Math.min(
              index,
              children.length
            )
          ),
          0,
          ...items
        );

        return {
          ...node,
          children,
        };
      }

      return node.children
        ? {
            ...node,
            children:
              insertAt(
                node.children,
                parentId,
                index,
                items
              ),
          }
        : node;
    }
  );
}

function updateOne(
  nodes: ComponentNode[],
  id: string,
  fn: (
    node: ComponentNode
  ) => ComponentNode
) {
  return mapNodes(
    nodes,
    (node) =>
      node.id === id
        ? fn(node)
        : node
  );
}

function pageWith(
  site: Site,
  pageId: string,
  fn: (
    page: SitePage
  ) => SitePage
): Site {
  return {
    ...site,
    pages: site.pages.map(
      (page) =>
        page.id === pageId
          ? fn(page)
          : page
    ),
  };
}

function px(
  value: unknown,
  fallback: number
) {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  const parsed =
    Number(value);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : fallback;
}

function applyColumns(
  nodes: ComponentNode[],
  sectionId: string
) {
  const sectionNode =
    find(
      nodes,
      sectionId
    );

  if (
    !sectionNode ||
    sectionNode.type !==
      "section" ||
    (sectionNode.children
      ?.length ?? 0) < 2
  ) {
    return nodes;
  }

  const count =
    Math.max(
      2,
      Math.min(
        6,
        sectionNode.children
          ?.length ?? 2
      )
    );

  return updateOne(
    nodes,
    sectionId,
    (node) => ({
      ...node,
      styles: {
        ...(node.styles ??
          {}),
        display: "grid",
        gridTemplateColumns: `repeat(${count},minmax(0,1fr))`,
        gap: px(
          node.styles?.gap,
          18
        ),
      },
    })
  );
}

function findAncestorSection(
  nodes: ComponentNode[],
  id: string,
  current: string | null = null
): string | null {
  for (const node of nodes) {
    if (node.id === id) {
      return current;
    }

    const result =
      findAncestorSection(
        node.children ?? [],
        id,
        node.type ===
          "section"
          ? node.id
          : current
      );

    if (result) {
      return result;
    }
  }

  return null;
}

export default function Editor({
  siteSlug,
}: {
  siteSlug: string;
}) {
  const [site, setSite] =
    useState<Site | null>(
      null
    );

  const [pageId, setPageId] =
    useState("");

  const [selected, setSelected] =
    useState<string[]>([]);

  const [panel, setPanel] =
    useState<Panel>(
      "components"
    );

  const [device, setDevice] =
    useState<Device>(
      "desktop"
    );

  const [zoom, setZoom] =
    useState(80);

  const [pan, setPan] =
    useState({
      x: 0,
      y: 0,
    });

  const [panMode, setPanMode] =
    useState(false);

  const [dirty, setDirty] =
    useState(false);

  const [status, setStatus] =
    useState("Saved");

  const [history, setHistory] =
    useState<Site[]>([]);

  const [future, setFuture] =
    useState<Site[]>([]);

  const [search, setSearch] =
    useState("");

  const [drop, setDrop] =
    useState<DropTarget | null>(
      null
    );

  const [dragging, setDragging] =
    useState(false);

  const [
    numericDraft,
    setNumericDraft,
  ] = useState<
    Record<string, string>
  >({});

  const [
    imageTarget,
    setImageTarget,
  ] = useState<string | null>(
    null
  );

  const [marquee, setMarquee] =
    useState<{
      x: number;
      y: number;
      w: number;
      h: number;
    } | null>(null);

  const fileRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const panningRef =
    useRef<{
      x: number;
      y: number;
      sx: number;
      sy: number;
    } | null>(null);

  const page = useMemo(
    () =>
      site?.pages.find(
        (item) =>
          item.id === pageId
      ) ??
      site?.pages[0] ??
      null,
    [site, pageId]
  );

  const selectedNode =
    useMemo(
      () =>
        page &&
        selected.length === 1
          ? find(
              page.components,
              selected[0]
            )
          : null,
      [
        page,
        selected,
      ]
    );

  const selectedNodes =
    useMemo(
      () =>
        page
          ? selected
              .map((id) =>
                find(
                  page.components,
                  id
                )
              )
              .filter(
                Boolean
              ) as ComponentNode[]
          : [],
      [
        page,
        selected,
      ]
    );

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
        const parsed: unknown =
          JSON.parse(raw);

        if (
          Array.isArray(parsed)
        ) {
          sites =
            parsed.map(
              (item) =>
                normalizeSite(
                  item as Site
                )
            );
        }
      }

      if (
        !sites.length &&
        legacy
      ) {
        const parsed: unknown =
          JSON.parse(legacy);

        if (
          parsed &&
          typeof parsed ===
            "object"
        ) {
          sites = [
            normalizeSite(
              parsed as Site
            ),
          ];
        }
      }

      if (!sites.length) {
        sites = [
          initialSite,
        ];
      }

      const wanted =
        siteSlug.toLowerCase();

      const found =
        sites.find(
          (item) =>
            item.id ===
              siteSlug ||
            item.slug?.toLowerCase() ===
              wanted ||
            slugify(
              item.name
            ) === wanted
        );

      if (!found) {
        setStatus(
          "Website not found"
        );
        return;
      }

      setSite(found);
      setPageId(
        found.pages[0]?.id ??
          ""
      );
    } catch {
      setStatus(
        "Unable to load website"
      );
    }
  }, [siteSlug]);

  const commit = useCallback(
    (
      fn: (
        current: Site
      ) => Site
    ) => {
      setSite(
        (current) => {
          if (!current) {
            return current;
          }

          setHistory(
            (items) => [
              ...items.slice(
                -39
              ),
              current,
            ]
          );

          setFuture([]);

          setDirty(true);

          setStatus(
            "Unsaved changes"
          );

          return fn(
            current
          );
        }
      );
    },
    []
  );

  const updatePage =
    useCallback(
      (
        fn: (
          page: SitePage
        ) => SitePage
      ) => {
        commit((current) =>
          pageWith(
            current,
            pageId,
            fn
          )
        );
      },
      [
        commit,
        pageId,
      ]
    );

  const updateNode =
    useCallback(
      (
        id: string,
        fn: (
          node: ComponentNode
        ) => ComponentNode
      ) => {
        updatePage(
          (current) => ({
            ...current,
            components:
              updateOne(
                current.components,
                id,
                fn
              ),
          })
        );
      },
      [updatePage]
    );

  const save = useCallback(
    () => {
      if (!site) return;

      try {
        const raw =
          localStorage.getItem(
            STORAGE_SITES
          );

        const parsed: unknown =
          raw
            ? JSON.parse(raw)
            : [];

        const sites: Site[] =
          Array.isArray(parsed)
            ? (parsed as Site[])
            : [];

        const index =
          sites.findIndex(
            (item) =>
              item.id ===
              site.id
          );

        if (index >= 0) {
          sites[index] =
            site;
        } else {
          sites.push(site);
        }

        localStorage.setItem(
          STORAGE_SITES,
          JSON.stringify(
            sites
          )
        );

        localStorage.setItem(
          STORAGE_LEGACY,
          JSON.stringify(
            site
          )
        );

        setDirty(false);
        setStatus("Saved");
      } catch {
        setStatus(
          "Could not save"
        );
      }
    },
    [site]
  );

  const undo = useCallback(
    () => {
      setHistory(
        (items) => {
          const previous =
            items.at(-1);

          if (!previous) {
            return items;
          }

          setSite(
            (current) =>
              current
                ? (setFuture(
                    (futureItems) =>
                      [
                        ...futureItems,
                        current,
                      ]
                  ),
                  previous)
                : current
          );

          setDirty(true);
          setStatus(
            "Unsaved changes"
          );

          return items.slice(
            0,
            -1
          );
        }
      );
    },
    []
  );

  const redo = useCallback(
    () => {
      setFuture(
        (items) => {
          const next =
            items.at(-1);

          if (!next) {
            return items;
          }

          setSite(
            (current) =>
              current
                ? (setHistory(
                    (historyItems) =>
                      [
                        ...historyItems,
                        current,
                      ]
                  ),
                  next)
                : current
          );

          setDirty(true);
          setStatus(
            "Unsaved changes"
          );

          return items.slice(
            0,
            -1
          );
        }
      );
    },
    []
  );

  const selectNode =
    useCallback(
      (
        id: string,
        event: ReactMouseEvent
      ) => {
        event.stopPropagation();

        const additive =
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey;

        setSelected(
          (current) =>
            additive
              ? current.includes(id)
                ? current.filter(
                    (item) =>
                      item !== id
                  )
                : [
                    ...current,
                    id,
                  ]
              : [id]
        );
      },
      []
    );

  const addComponent =
    useCallback(
      (
        type: ComponentType,
        target:
          | DropTarget
          | null = null
      ) => {
        const item =
          makeComponent(
            type
          );

        updatePage(
          (current) => {
            let components =
              target
                ? insertAt(
                    current.components,
                    target.parentId,
                    target.index,
                    [item]
                  )
                : [
                    ...current.components,
                    item,
                  ];

            if (
              target?.sectionId &&
              target.position !==
                "inside"
            ) {
              components =
                applyColumns(
                  components,
                  target.sectionId
                );
            }

            return {
              ...current,
              components,
            };
          }
        );

        setSelected([
          item.id,
        ]);
      },
      [updatePage]
    );

  const addTemplate =
    useCallback(
      (
        template: ComponentNode
      ) => {
        const fresh =
          clone(template);

        updatePage(
          (current) => ({
            ...current,
            components: [
              ...current.components,
              fresh,
            ],
          })
        );

        setSelected([
          fresh.id,
        ]);
      },
      [updatePage]
    );

  const duplicate =
    useCallback(() => {
      if (
        !page ||
        !selected.length
      ) {
        return;
      }

      const clones =
        selectedNodes.map(
          clone
        );

      const parent =
        selectedNodes[0]
          ? parentOf(
              page.components,
              selectedNodes[0]
                .id
            )
          : null;

      const siblings =
        parent?.children ??
        page.components;

      const lastIndex =
        Math.max(
          ...selectedNodes.map(
            (node) =>
              siblings.findIndex(
                (item) =>
                  item.id ===
                  node.id
              )
          )
        );

      updatePage(
        (current) => ({
          ...current,
          components:
            insertAt(
              current.components,
              parent?.id ??
                null,
              lastIndex + 1,
              clones
            ),
        })
      );

      setSelected(
        clones.map(
          (item) =>
            item.id
        )
      );
    }, [
      page,
      selected,
      selectedNodes,
      updatePage,
    ]);

  const removeSelected =
    useCallback(() => {
      if (!selected.length) {
        return;
      }

      const ids =
        new Set<string>(
          selected
        );

      updatePage(
        (current) => ({
          ...current,
          components:
            removeIds(
              current.components,
              ids
            ).nodes,
        })
      );

      setSelected([]);
    }, [
      selected,
      updatePage,
    ]);

  const move =
    useCallback(
      (
        direction: -1 | 1
      ) => {
        if (
          !page ||
          selected.length !==
            1
        ) {
          return;
        }

        const targetId =
          selected[0];

        const parent =
          parentOf(
            page.components,
            targetId
          );

        const siblings =
          parent?.children ??
          page.components;

        const index =
          siblings.findIndex(
            (item) =>
              item.id ===
              targetId
          );

        const nextIndex =
          index + direction;

        if (
          index < 0 ||
          nextIndex < 0 ||
          nextIndex >=
            siblings.length
        ) {
          return;
        }

        const reordered =
          [
            ...siblings,
          ];

        const [item] =
          reordered.splice(
            index,
            1
          );

        reordered.splice(
          nextIndex,
          0,
          item
        );

        updatePage(
          (current) =>
            parent
              ? {
                  ...current,
                  components:
                    updateOne(
                      current.components,
                      parent.id,
                      (
                        node
                      ) => ({
                        ...node,
                        children:
                          reordered,
                      })
                    ),
                }
              : {
                  ...current,
                  components:
                    reordered,
                }
        );
      },
      [
        page,
        selected,
        updatePage,
      ]
    );

  const group =
    useCallback(() => {
      if (
        !page ||
        selected.length < 2
      ) {
        return;
      }

      const parent =
        parentOf(
          page.components,
          selected[0]
        );

      const siblings =
        parent?.children ??
        page.components;

      const chosen =
        siblings.filter(
          (item) =>
            selected.includes(
              item.id
            )
        );

      const first =
        siblings.findIndex(
          (item) =>
            item.id ===
            chosen[0]?.id
        );

      if (!chosen.length) {
        return;
      }

      const groupNode =
        section(
          chosen,
          {
            display: "grid",
            gridTemplateColumns: `repeat(${Math.max(
              1,
              chosen.length
            )},minmax(0,1fr))`,
            gap: 18,
          }
        );

      const ids =
        new Set<string>(
          chosen.map(
            (item) =>
              item.id
          )
        );

      updatePage(
        (current) => {
          const without =
            removeIds(
              current.components,
              ids
            ).nodes;

          return {
            ...current,
            components:
              insertAt(
                without,
                parent?.id ??
                  null,
                first,
                [groupNode]
              ),
          };
        }
      );

      setSelected([
        groupNode.id,
      ]);
    }, [
      page,
      selected,
      updatePage,
    ]);

  const ungroup =
    useCallback(() => {
      if (
        !page ||
        selected.length !==
          1
      ) {
        return;
      }

      const target =
        find(
          page.components,
          selected[0]
        );

      if (
        !target?.children
          ?.length
      ) {
        return;
      }

      const parent =
        parentOf(
          page.components,
          target.id
        );

      const siblings =
        parent?.children ??
        page.components;

      const index =
        siblings.findIndex(
          (item) =>
            item.id ===
            target.id
        );

      updatePage(
        (current) => {
          const removed =
            removeIds(
              current.components,
              new Set<string>([
                target.id,
              ])
            ).nodes;

          return {
            ...current,
            components:
              insertAt(
                removed,
                parent?.id ??
                  null,
                index,
                target.children ??
                  []
              ),
          };
        }
      );

      setSelected(
        target.children.map(
          (item) =>
            item.id
        )
      );
    }, [
      page,
      selected,
      updatePage,
    ]);

  const renameSite =
    useCallback(() => {
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

      commit(
        (current) => ({
          ...current,
          name:
            name.trim(),
          slug:
            current.slug ||
            slugify(name),
        })
      );
    }, [
      site,
      commit,
    ]);

  const addPage =
    useCallback(() => {
      const name = `Page ${
        (site?.pages.length ??
          0) + 1
      }`;

      const newPage: SitePage =
        {
          id: uid(),
          name,
          slug: `/${slugify(
            name
          )}`,
          margins: {
            top: 0,
            right: 32,
            bottom: 0,
            left: 32,
          },
          components: [],
        };

      commit(
        (current) => ({
          ...current,
          pages: [
            ...current.pages,
            newPage,
          ],
        })
      );

      setPageId(
        newPage.id
      );

      setSelected([]);
    }, [
      site,
      commit,
    ]);

  const renamePage =
    useCallback(
      (targetId: string) => {
        const target =
          site?.pages.find(
            (item) =>
              item.id ===
              targetId
          );

        if (!target) {
          return;
        }

        const name =
          window.prompt(
            "Page name",
            target.name
          );

        if (!name?.trim()) {
          return;
        }

        commit(
          (current) => ({
            ...current,
            pages:
              current.pages.map(
                (item) =>
                  item.id ===
                  targetId
                    ? {
                        ...item,
                        name:
                          name.trim(),
                        slug:
                          targetId ===
                          current
                            .pages[0]
                            ?.id
                            ? "/"
                            : `/${slugify(
                                name
                              )}`,
                      }
                    : item
              ),
          })
        );
      },
      [site, commit]
    );

  const deletePage =
    useCallback(
      (targetId: string) => {
        if (
          !site ||
          site.pages.length <=
            1
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

        const next =
          site.pages.find(
            (item) =>
              item.id !==
              targetId
          );

        commit(
          (current) => ({
            ...current,
            pages:
              current.pages.filter(
                (item) =>
                  item.id !==
                  targetId
              ),
          })
        );

        if (
          pageId === targetId
        ) {
          setPageId(
            next?.id ?? ""
          );
        }

        setSelected([]);
      },
      [
        site,
        pageId,
        commit,
      ]
    );

  const parseDrag =
    useCallback(
      (
        event: DragEvent
      ): DragPayload | null => {
        try {
          const raw =
            event.dataTransfer.getData(
              "application/x-sytely"
            );

          return raw
            ? (JSON.parse(
                raw
              ) as DragPayload)
            : null;
        } catch {
          return null;
        }
      },
      []
    );

  const calculateDrop =
    useCallback(
      (
        event: DragEvent
      ): DropTarget | null => {
        if (!page) {
          return null;
        }

        const targetElement =
          (
            event.target as HTMLElement
          ).closest(
            "[data-sytely-id]"
          ) as HTMLElement | null;

        if (!targetElement) {
          return {
            id: null,
            parentId: null,
            index:
              page.components
                .length,
            position:
              "after",
            sectionId: null,
          };
        }

        const targetId =
          targetElement.dataset
            .sytelyId ??
          null;

        if (!targetId) {
          return null;
        }

        const target =
          find(
            page.components,
            targetId
          );

        if (!target) {
          return null;
        }

        const rect =
          targetElement.getBoundingClientRect();

        const x =
          event.clientX -
          rect.left;

        const y =
          event.clientY -
          rect.top;

        const horizontal =
          rect.width >
          rect.height * 1.25;

        const canContain = [
          "section",
          "card",
          "features",
          "pricing",
          "footer",
        ].includes(
          target.type
        );

        const inside =
          canContain &&
          x >
            rect.width *
              0.18 &&
          x <
            rect.width *
              0.82 &&
          y >
            rect.height *
              0.18 &&
          y <
            rect.height *
              0.82;

        if (inside) {
          return {
            id: targetId,
            parentId:
              targetId,
            index:
              target.children
                ?.length ?? 0,
            position:
              "inside",
            sectionId:
              target.type ===
              "section"
                ? targetId
                : findAncestorSection(
                    page.components,
                    target.id
                  ),
          };
        }

        const parent =
          parentOf(
            page.components,
            targetId
          );

        const siblings =
          parent?.children ??
          page.components;

        const index =
          siblings.findIndex(
            (item) =>
              item.id ===
              targetId
          );

        const after =
          horizontal
            ? x >
              rect.width / 2
            : y >
              rect.height / 2;

        const sectionId =
          parent?.type ===
          "section"
            ? parent.id
            : parent
              ? findAncestorSection(
                  page.components,
                  parent.id
                )
              : null;

        return {
          id: targetId,
          parentId:
            parent?.id ?? null,
          index:
            index +
            (after ? 1 : 0),
          position:
            after
              ? "after"
              : "before",
          sectionId,
        };
      },
      [page]
    );

  const onDragOver =
    useCallback(
      (event: DragEvent) => {
        event.preventDefault();

        setDrop(
          calculateDrop(
            event
          )
        );
      },
      [calculateDrop]
    );

  const performDrop =
    useCallback(
      (event: DragEvent) => {
        event.preventDefault();

        const payload =
          parseDrag(event);

        const target =
          calculateDrop(event);

        setDrop(null);
        setDragging(false);

        if (
          !payload ||
          !target ||
          !page
        ) {
          return;
        }

        if (
          payload.kind ===
          "component"
        ) {
          const item =
            makeComponent(
              payload.type
            );

          updatePage(
            (current) => {
              let components =
                insertAt(
                  current.components,
                  target.parentId,
                  target.index,
                  [item]
                );

              if (
                target.sectionId &&
                target.position !==
                  "inside"
              ) {
                components =
                  applyColumns(
                    components,
                    target.sectionId
                  );
              }

              return {
                ...current,
                components,
              };
            }
          );

          setSelected([
            item.id,
          ]);

          return;
        }

        if (
          payload.kind ===
          "template"
        ) {
          addTemplate(
            payload.node
          );

          return;
        }

        const sourceIds =
          payload.ids;

        if (
          !sourceIds.length
        ) {
          return;
        }

        const sourceNodes =
          sourceIds
            .map((id) =>
              find(
                page.components,
                id
              )
            )
            .filter(
              Boolean
            ) as ComponentNode[];

        if (
          !sourceNodes.length
        ) {
          return;
        }

        if (
          sourceNodes.some(
            (source) =>
              target.id ===
                source.id ||
              contains(
                source,
                target.id ??
                  ""
              )
          )
        ) {
          return;
        }

        const ids =
          new Set<string>(
            sourceIds
          );

        const result =
          removeIds(
            page.components,
            ids
          );

        let index =
          target.index;

        const oldParent =
          parentOf(
            page.components,
            sourceNodes[0]
              .id
          );

        const oldSiblings =
          oldParent?.children ??
          page.components;

        const beforeTargetIndex =
          target.id
            ? oldSiblings.findIndex(
                (item) =>
                  item.id ===
                  target.id
              )
            : -1;

        if (
          oldParent?.id ===
            target.parentId &&
          beforeTargetIndex >=
            0 &&
          beforeTargetIndex <
            target.index
        ) {
          index -=
            sourceNodes.length;
        }

        updatePage(
          (current) => {
            let components =
              insertAt(
                result.nodes,
                target.parentId,
                index,
                sourceNodes
              );

            if (
              target.sectionId &&
              target.position !==
                "inside"
            ) {
              components =
                applyColumns(
                  components,
                  target.sectionId
                );
            }

            return {
              ...current,
              components,
            };
          }
        );

        setSelected(
          sourceNodes.map(
            (node) =>
              node.id
          )
        );
      },
      [
        parseDrag,
        calculateDrop,
        page,
        updatePage,
        addTemplate,
      ]
    );

  const onDragStart =
    useCallback(
      (
        event: DragEvent<HTMLElement>,
        nodeId: string
      ) => {
        const ids =
          selected.includes(
            nodeId
          )
            ? selected
            : [nodeId];

        event.dataTransfer.effectAllowed =
          "move";

        event.dataTransfer.setData(
          "application/x-sytely",
          JSON.stringify({
            kind: "node",
            ids,
          } satisfies DragPayload)
        );

        setDragging(true);
      },
      [selected]
    );

  const paletteDrag =
    useCallback(
      (
        event: DragEvent<HTMLElement>,
        type: ComponentType
      ) => {
        event.dataTransfer.effectAllowed =
          "copy";

        event.dataTransfer.setData(
          "application/x-sytely",
          JSON.stringify({
            kind: "component",
            type,
          } satisfies DragPayload)
        );

        setDragging(true);
      },
      []
    );

  const templateDrag =
    useCallback(
      (
        event: DragEvent<HTMLElement>,
        template: ComponentNode
      ) => {
        event.dataTransfer.effectAllowed =
          "copy";

        event.dataTransfer.setData(
          "application/x-sytely",
          JSON.stringify({
            kind: "template",
            node: clone(
              template
            ),
          } satisfies DragPayload)
        );

        setDragging(true);
      },
      []
    );

  const onImageUpload =
    useCallback(
      (
        event: ChangeEvent<HTMLInputElement>
      ) => {
        const files =
          Array.from(
            event.target.files ??
              []
          ) as File[];

        event.target.value =
          "";

        const id =
          imageTarget;

        setImageTarget(
          null
        );

        if (
          !id ||
          !files.length
        ) {
          return;
        }

        const node =
          page
            ? find(
                page.components,
                id
              )
            : null;

        const images =
          files.filter(
            (file) =>
              file.type.startsWith(
                "image/"
              )
          );

        if (
          !node ||
          !images.length
        ) {
          return;
        }

        Promise.all(
          images.map(
            (file) =>
              new Promise<string>(
                (
                  resolve
                ) => {
                  const reader =
                    new FileReader();

                  reader.onload =
                    () =>
                      resolve(
                        typeof reader.result ===
                          "string"
                          ? reader.result
                          : ""
                      );

                  reader.onerror =
                    () =>
                      resolve(
                        ""
                      );

                  reader.readAsDataURL(
                    file
                  );
                }
              )
          )
        ).then(
          (results) => {
            const usable =
              results.filter(
                Boolean
              );

            if (
              !usable.length
            ) {
              return;
            }

            if (
              node.type ===
              "gallery"
            ) {
              const existing =
                Array.isArray(
                  node.props
                    .images
                )
                  ? node.props.images.filter(
                      (
                        value
                      ): value is string =>
                        typeof value ===
                        "string"
                    )
                  : [];

              updateNode(
                id,
                (current) => ({
                  ...current,
                  props: {
                    ...current.props,
                    images: [
                      ...existing,
                      ...usable,
                    ],
                  },
                })
              );
            } else {
              updateNode(
                id,
                (current) => ({
                  ...current,
                  props: {
                    ...current.props,
                    src:
                      usable[0],
                  },
                })
              );
            }
          }
        );
      },
      [
        imageTarget,
        page,
        updateNode,
      ]
    );

  const updateProp =
    useCallback(
      (
        key: string,
        value: unknown
      ) => {
        if (
          !selectedNode
        ) {
          return;
        }

        updateNode(
          selectedNode.id,
          (node) => ({
            ...node,
            props: {
              ...node.props,
              [key]: value,
            },
          })
        );
      },
      [
        selectedNode,
        updateNode,
      ]
    );

  const updateStyle =
    useCallback(
      (
        key: string,
        value: unknown
      ) => {
        if (
          !selectedNode
        ) {
          return;
        }

        updateNode(
          selectedNode.id,
          (node) => ({
            ...node,
            styles: {
              ...(node.styles ??
                {}),
              [key]: value,
            },
          })
        );
      },
      [
        selectedNode,
        updateNode,
      ]
    );

  useEffect(() => {
    const onKey =
      (event: KeyboardEvent) => {
        const target =
          event.target as HTMLElement;

        const typing =
          [
            "INPUT",
            "TEXTAREA",
            "SELECT",
          ].includes(
            target.tagName
          ) ||
          target.isContentEditable;

        if (
          !typing &&
          (event.metaKey ||
            event.ctrlKey) &&
          event.key.toLowerCase() ===
            "s"
        ) {
          event.preventDefault();
          save();
        } else if (
          !typing &&
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
          !typing &&
          (event.metaKey ||
            event.ctrlKey) &&
          event.key.toLowerCase() ===
            "d"
        ) {
          event.preventDefault();
          duplicate();
        } else if (
          !typing &&
          (event.key ===
            "Delete" ||
            event.key ===
              "Backspace")
        ) {
          event.preventDefault();
          removeSelected();
        } else if (
          !typing &&
          event.key ===
            "Escape"
        ) {
          setSelected([]);
          setDrop(null);
        } else if (
          !typing &&
          selected.length &&
          [
            "ArrowUp",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight",
          ].includes(
            event.key
          )
        ) {
          event.preventDefault();

          if (
            event.key ===
            "ArrowUp"
          ) {
            move(-1);
          } else if (
            event.key ===
            "ArrowDown"
          ) {
            move(1);
          } else {
            const delta =
              event.shiftKey
                ? 10
                : 1;

            const direction =
              event.key ===
              "ArrowLeft"
                ? -1
                : 1;

            const ids =
              new Set<string>(
                selected
              );

            commit(
              (current) =>
                pageWith(
                  current,
                  pageId,
                  (
                    currentPage
                  ) => ({
                    ...currentPage,
                    components:
                      mapNodes(
                        currentPage.components,
                        (node) =>
                          ids.has(
                            node.id
                          )
                            ? {
                                ...node,
                                styles: {
                                  ...(node.styles ??
                                    {}),
                                  marginLeft:
                                    px(
                                      node
                                        .styles
                                        ?.marginLeft,
                                      0
                                    ) +
                                    delta *
                                      direction,
                                },
                              }
                            : node
                      ),
                  })
                )
            );
          }
        } else if (
          !typing &&
          event.code ===
            "Space"
        ) {
          setPanMode(true);
        }
      };

    const up =
      (event: KeyboardEvent) => {
        if (
          event.code ===
          "Space"
        ) {
          setPanMode(false);
        }
      };

    window.addEventListener(
      "keydown",
      onKey
    );

    window.addEventListener(
      "keyup",
      up
    );

    return () => {
      window.removeEventListener(
        "keydown",
        onKey
      );

      window.removeEventListener(
        "keyup",
        up
      );
    };
  }, [
    save,
    redo,
    undo,
    duplicate,
    removeSelected,
    selected,
    move,
    commit,
    pageId,
  ]);

  const beginCanvasInteraction =
    useCallback(
      (
        event: ReactMouseEvent<HTMLDivElement>
      ) => {
        const target =
          event.target as HTMLElement;

        const nodeElement =
          target.closest(
            "[data-sytely-id]"
          );

        if (
          panMode ||
          event.button === 1
        ) {
          event.preventDefault();

          panningRef.current =
            {
              x: pan.x,
              y: pan.y,
              sx: event.clientX,
              sy: event.clientY,
            };

          return;
        }

        if (
          event.button !== 0 ||
          nodeElement
        ) {
          return;
        }

        setMarquee({
          x: event.clientX,
          y: event.clientY,
          w: 0,
          h: 0,
        });
      },
      [
        pan,
        panMode,
      ]
    );

  const canvasMove =
    useCallback(
      (
        event: ReactMouseEvent<HTMLDivElement>
      ) => {
        if (
          panningRef.current
        ) {
          setPan({
            x:
              panningRef.current
                .x +
              event.clientX -
              panningRef.current
                .sx,
            y:
              panningRef.current
                .y +
              event.clientY -
              panningRef.current
                .sy,
          });

          return;
        }

        if (marquee) {
          setMarquee({
            x: Math.min(
              marquee.x,
              event.clientX
            ),
            y: Math.min(
              marquee.y,
              event.clientY
            ),
            w: Math.abs(
              event.clientX -
                marquee.x
            ),
            h: Math.abs(
              event.clientY -
                marquee.y
            ),
          });
        }
      },
      [marquee]
    );

  const endCanvasInteraction =
    useCallback(() => {
      panningRef.current =
        null;

      if (
        !marquee ||
        !page
      ) {
        setMarquee(null);
        return;
      }

      const left =
        marquee.x;

      const top =
        marquee.y;

      const right =
        marquee.x +
        marquee.w;

      const bottom =
        marquee.y +
        marquee.h;

      if (
        marquee.w > 4 ||
        marquee.h > 4
      ) {
        const hits =
          Array.from(
            document.querySelectorAll(
              "[data-sytely-id]"
            )
          )
            .filter(
              (element) => {
                const rect =
                  (
                    element as HTMLElement
                  ).getBoundingClientRect();

                return (
                  rect.left <
                    right &&
                  rect.right >
                    left &&
                  rect.top <
                    bottom &&
                  rect.bottom >
                    top
                );
              }
            )
            .map(
              (element) =>
                (
                  element as HTMLElement
                ).dataset
                  .sytelyId
            )
            .filter(
              (
                value
              ): value is string =>
                Boolean(value)
            );

        setSelected(
          hits
        );
      }

      setMarquee(null);
    }, [
      marquee,
      page,
    ]);

  const resizeNode =
    useCallback(
      (
        nodeId: string,
        edge:
          | "right"
          | "bottom"
          | "corner",
        event: ReactMouseEvent
      ) => {
        event.preventDefault();
        event.stopPropagation();

        const element =
          document.querySelector(
            `[data-sytely-id="${CSS.escape(
              nodeId
            )}"]`
          ) as HTMLElement | null;

        if (!element) {
          return;
        }

        const startX =
          event.clientX;

        const startY =
          event.clientY;

        const startWidth =
          element.getBoundingClientRect()
            .width;

        const startHeight =
          element.getBoundingClientRect()
            .height;

        const move =
          (
            e: globalThis.MouseEvent
          ) => {
            const dx =
              e.clientX -
              startX;

            const dy =
              e.clientY -
              startY;

            if (
              edge ===
                "right" ||
              edge === "corner"
            ) {
              element.style.width = `${Math.max(
                40,
                Math.round(
                  startWidth +
                    dx
                )
              )}px`;
            }

            if (
              edge ===
                "bottom" ||
              edge === "corner"
            ) {
              element.style.minHeight = `${Math.max(
                30,
                Math.round(
                  startHeight +
                    dy
                )
              )}px`;
            }
          };

        const up = () => {
          const finalWidth =
            parseFloat(
              element.style
                .width
            );

          const finalHeight =
            parseFloat(
              element.style
                .minHeight
            );

          if (
            edge ===
              "right" ||
            edge === "corner"
          ) {
            updateNode(
              nodeId,
              (node) => ({
                ...node,
                styles: {
                  ...(node.styles ??
                    {}),
                  width:
                    Number.isFinite(
                      finalWidth
                    )
                      ? finalWidth
                      : startWidth,
                },
              })
            );
          }

          if (
            edge ===
              "bottom" ||
            edge === "corner"
          ) {
            updateNode(
              nodeId,
              (node) => ({
                ...node,
                styles: {
                  ...(node.styles ??
                    {}),
                  minHeight:
                    Number.isFinite(
                      finalHeight
                    )
                      ? finalHeight
                      : startHeight,
                },
              })
            );
          }

          window.removeEventListener(
            "mousemove",
            move
          );

          window.removeEventListener(
            "mouseup",
            up
          );
        };

        window.addEventListener(
          "mousemove",
          move
        );

        window.addEventListener(
          "mouseup",
          up
        );
      },
      [updateNode]
    );

  const resetView = () => {
    setZoom(80);
    setPan({
      x: 0,
      y: 0,
    });
  };

  const openPreview = () => {
    if (
      !site ||
      !page
    ) {
      return;
    }

    const slug =
      site.slug ||
      slugify(
        site.name
      );

    const query =
      new URLSearchParams({
        page: page.slug,
        device,
      }).toString();

    window.open(
      `/${slug}/preview?${query}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const filtered =
    types.filter(
      (type) =>
        info[type][1]
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );

  if (!site || !page) {
    return (
      <main className="editor-loading">
        <strong>
          {status ===
          "Website not found"
            ? status
            : "Loading editor…"}
        </strong>

        <a href="/mysites">
          Back to My Sites
        </a>
      </main>
    );
  }

  return (
    <div className="editor-shell">
      <header className="topbar">
        <div className="brand-block">
          <a
            className="brand"
            href="/mysites"
          >
            Sytely
          </a>

          <span>/</span>
        </div>

        <button
          className="site-name-button"
          type="button"
          onClick={
            renameSite
          }
        >
          {site.name}

          <span>⌄</span>
        </button>

        <div className="top-center">
          <button
            type="button"
            onClick={undo}
            disabled={
              !history.length
            }
          >
            ↶
          </button>

          <button
            type="button"
            onClick={redo}
            disabled={
              !future.length
            }
          >
            ↷
          </button>

          <div className="device-switcher">
            {(
              [
                "desktop",
                "tablet",
                "mobile",
              ] as Device[]
            ).map(
              (item) => (
                <button
                  key={item}
                  className={
                    device ===
                    item
                      ? "active"
                      : ""
                  }
                  type="button"
                  onClick={() =>
                    setDevice(
                      item
                    )
                  }
                >
                  {item}
                </button>
              )
            )}
          </div>
        </div>

        <div className="top-actions">
          <span
            className={
              dirty
                ? "dirty"
                : ""
            }
          >
            {status}
          </span>

          <button
            type="button"
            onClick={
              openPreview
            }
          >
            Preview
          </button>

          <button
            className="primary-button"
            type="button"
            onClick={save}
          >
            Save
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className="left-panel">
          <nav className="tabs">
            {(
              [
                "components",
                "templates",
                "pages",
                "layers",
              ] as Panel[]
            ).map(
              (item) => (
                <button
                  key={item}
                  className={
                    panel ===
                    item
                      ? "active"
                      : ""
                  }
                  type="button"
                  onClick={() =>
                    setPanel(
                      item
                    )
                  }
                >
                  {item}
                </button>
              )
            )}
          </nav>

          {panel ===
            "components" && (
            <div className="panel-content">
              <input
                className="search"
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Search components"
              />

              <p className="hint">
                Drag into the page.
                Drop beside another
                component to create
                columns.
              </p>

              <div className="palette">
                {filtered.map(
                  (type) => (
                    <button
                      key={type}
                      draggable
                      type="button"
                      className="palette-item"
                      onClick={() =>
                        addComponent(
                          type
                        )
                      }
                      onDragStart={(
                        event
                      ) =>
                        paletteDrag(
                          event,
                          type
                        )
                      }
                    >
                      <b>
                        {
                          info[
                            type
                          ][0]
                        }
                      </b>

                      <span>
                        {
                          info[
                            type
                          ][1]
                        }
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {panel ===
            "templates" && (
            <div className="panel-content">
              <p className="hint">
                Editable starter
                sections.
              </p>

              {[
                [
                  "Hero",
                  section(
                    [
                      makeComponent(
                        "heading"
                      ),
                      makeComponent(
                        "text"
                      ),
                      makeComponent(
                        "button"
                      ),
                    ],
                    {
                      alignItems:
                        "center",
                    }
                  ),
                ],
                [
                  "Split",
                  section(
                    [
                      section([
                        makeComponent(
                          "heading"
                        ),
                        makeComponent(
                          "text"
                        ),
                      ]),
                      makeComponent(
                        "image"
                      ),
                    ],
                    {
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(2,minmax(0,1fr))",
                    }
                  ),
                ],
                [
                  "Features",
                  section([
                    makeComponent(
                      "features"
                    ),
                  ]),
                ],
                [
                  "Stats",
                  section([
                    n(
                      "features",
                      {
                        columns: 3,
                      },
                      {
                        display:
                          "grid",
                        gridTemplateColumns:
                          "repeat(3,minmax(0,1fr))",
                      }
                    ),
                  ]),
                ],
                [
                  "Pricing",
                  section([
                    makeComponent(
                      "pricing"
                    ),
                  ]),
                ],
                [
                  "Testimonial",
                  section([
                    makeComponent(
                      "testimonial"
                    ),
                  ]),
                ],
                [
                  "FAQ",
                  section([
                    makeComponent(
                      "faq"
                    ),
                    makeComponent(
                      "faq"
                    ),
                    makeComponent(
                      "faq"
                    ),
                  ]),
                ],
                [
                  "Contact",
                  section(
                    [
                      makeComponent(
                        "contact"
                      ),
                      makeComponent(
                        "form"
                      ),
                    ],
                    {
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(2,minmax(0,1fr))",
                    }
                  ),
                ],
                [
                  "Footer",
                  section([
                    makeComponent(
                      "footer"
                    ),
                  ]),
                ],
              ].map(
                ([
                  name,
                  template,
                ]) => (
                  <button
                    key={String(
                      name
                    )}
                    draggable
                    type="button"
                    className="template-item"
                    onClick={() =>
                      addTemplate(
                        template as ComponentNode
                      )
                    }
                    onDragStart={(
                      event
                    ) =>
                      templateDrag(
                        event,
                        template as ComponentNode
                      )
                    }
                  >
                    <strong>
                      {String(
                        name
                      )}
                    </strong>

                    <span>
                      Drag or click
                      to add
                    </span>
                  </button>
                )
              )}
            </div>
          )}

          {panel ===
            "pages" && (
            <div className="panel-content">
              <div className="panel-heading">
                <strong>
                  Pages
                </strong>

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
                (item) => (
                  <div
                    key={item.id}
                    className={
                      item.id ===
                      page.id
                        ? "page-item active"
                        : "page-item"
                    }
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setPageId(
                          item.id
                        );
                        setSelected(
                          []
                        );
                      }}
                    >
                      <strong>
                        {item.name}
                      </strong>

                      <small>
                        {item.slug}
                      </small>
                    </button>

                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          renamePage(
                            item.id
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
                              item.id
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
          )}

          {panel ===
            "layers" && (
            <div className="panel-content">
              <LayerTree
                nodes={
                  page.components
                }
                selected={
                  selected
                }
                onSelect={(
                  id
                ) =>
                  setSelected([
                    id,
                  ])
                }
              />
            </div>
          )}
        </aside>

        <main
          className={
            panMode
              ? "canvas-area panning"
              : "canvas-area"
          }
          onMouseDown={
            beginCanvasInteraction
          }
          onMouseMove={
            canvasMove
          }
          onMouseUp={
            endCanvasInteraction
          }
          onMouseLeave={
            endCanvasInteraction
          }
          onClick={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelected([]);
            }
          }}
          onDragOver={
            onDragOver
          }
          onDrop={
            performDrop
          }
        >
          <div className="canvas-tools">
            <span>
              {page.name}

              <small>
                {page.slug}
              </small>
            </span>

            <div>
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

              <b>
                {zoom}%
              </b>

              <button
                type="button"
                onClick={() =>
                  setZoom(
                    (value) =>
                      Math.min(
                        180,
                        value + 5
                      )
                  )
                }
              >
                +
              </button>

              <button
                type="button"
                onClick={
                  resetView
                }
              >
                Reset
              </button>

              <button
                type="button"
                className={
                  panMode
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPanMode(
                    (value) =>
                      !value
                  )
                }
              >
                Pan
              </button>
            </div>
          </div>

          <div className="canvas-scroll">
            <div
              className="canvas-space"
              style={{
                transform: `translate(${pan.x}px,${pan.y}px)`,
              }}
            >
              <div
                className={`page-frame device-${device}`}
                style={{
                  transform: `scale(${
                    zoom / 100
                  })`,
                  transformOrigin:
                    "top left",
                }}
              >
                <div
                  className="page-content"
                  style={{
                    background:
                      typeof page
                        .styles
                        ?.background ===
                      "string"
                        ? page
                            .styles
                            .background
                        : "var(--sytely-page)",

                    paddingTop:
                      px(
                        page
                          .margins
                          .top,
                        0
                      ),

                    paddingRight:
                      px(
                        page
                          .margins
                          .right,
                        32
                      ),

                    paddingBottom:
                      px(
                        page
                          .margins
                          .bottom,
                        0
                      ),

                    paddingLeft:
                      px(
                        page
                          .margins
                          .left,
                        32
                      ),
                  }}
                  onClick={(
                    event
                  ) => {
                    if (
                      event.target ===
                      event.currentTarget
                    ) {
                      setSelected(
                        []
                      );
                    }
                  }}
                >
                  <SytelyRenderer
                    nodes={
                      page.components
                    }
                    device={
                      device
                    }
                    editable
                    selectedIds={
                      selected
                    }
                    onNodeClick={
                      selectNode
                    }
                    onNodeDragStart={(
                      event
                    ) => {
                      const id =
                        (
                          event.currentTarget as HTMLElement
                        ).dataset
                          .sytelyId;

                      if (id) {
                        onDragStart(
                          event,
                          id
                        );
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {marquee && (
            <div
              className="marquee"
              style={{
                left:
                  marquee.x,
                top:
                  marquee.y,
                width:
                  marquee.w,
                height:
                  marquee.h,
              }}
            />
          )}

          {drop && (
            <DropMarker
              target={drop}
            />
          )}

          {dragging && (
            <div className="drag-hint">
              Drop before, after,
              or inside. Drop
              beside a component
              to make columns.
            </div>
          )}

          {selectedNode && (
            <SelectionOverlay
              nodeId={
                selectedNode.id
              }
              onDelete={
                removeSelected
              }
              onResize={
                resizeNode
              }
            />
          )}

          {selected.length >
            0 && (
            <div className="floating-toolbar">
              <span>
                {selected.length}{" "}
                selected
              </span>

              <button
                type="button"
                onClick={
                  duplicate
                }
              >
                Duplicate
              </button>

              <button
                type="button"
                onClick={() =>
                  move(-1)
                }
              >
                ↑
              </button>

              <button
                type="button"
                onClick={() =>
                  move(1)
                }
              >
                ↓
              </button>

              <button
                type="button"
                onClick={
                  group
                }
                disabled={
                  selected.length <
                  2
                }
              >
                Group
              </button>

              <button
                type="button"
                onClick={
                  ungroup
                }
              >
                Ungroup
              </button>

              <button
                className="danger"
                type="button"
                onClick={
                  removeSelected
                }
              >
                Delete
              </button>
            </div>
          )}
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
            numericDraft={
              numericDraft
            }
            setNumericDraft={
              setNumericDraft
            }
            uploadImage={() => {
              setImageTarget(
                selectedNode.id
              );

              fileRef.current?.click();
            }}
          />
        )}
      </div>

      <input
        ref={fileRef}
        hidden
        type="file"
        accept="image/*"
        multiple={
          selectedNode?.type ===
          "gallery"
        }
        onChange={
          onImageUpload
        }
      />
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
      {nodes.map(
        (node) => (
          <div key={node.id}>
            <button
              type="button"
              className={
                selected.includes(
                  node.id
                )
                  ? "layer active"
                  : "layer"
              }
              style={{
                paddingLeft:
                  8 +
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
                  info[
                    node.type
                  ][0]
                }
              </span>

              <b>
                {
                  info[
                    node.type
                  ][1]
                }
              </b>
            </button>

            {node.children
              ?.length ? (
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
            ) : null}
          </div>
        )
      )}
    </>
  );
}

function DropMarker({
  target,
}: {
  target: DropTarget;
}) {
  const [rect, setRect] =
    useState<DOMRect | null>(
      null
    );

  useEffect(() => {
    if (!target.id) {
      return;
    }

    const element =
      document.querySelector(
        `[data-sytely-id="${CSS.escape(
          target.id
        )}"]`
      ) as HTMLElement | null;

    if (element) {
      setRect(
        element.getBoundingClientRect()
      );
    }
  }, [target]);

  if (!rect) {
    return null;
  }

  if (
    target.position ===
    "inside"
  ) {
    return (
      <div
        className="drop-inside"
        style={{
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        }}
      >
        <span>
          Drop inside
        </span>
      </div>
    );
  }

  const after =
    target.position ===
    "after";

  return (
    <div
      className="drop-line"
      style={{
        left: after
          ? rect.right - 2
          : rect.left - 2,
        top: rect.top,
        width: 4,
        height:
          rect.height,
      }}
    />
  );
}

function SelectionOverlay({
  nodeId,
  onDelete,
  onResize,
}: {
  nodeId: string;
  onDelete: () => void;
  onResize: (
    nodeId: string,
    edge:
      | "right"
      | "bottom"
      | "corner",
    event: ReactMouseEvent
  ) => void;
}) {
  const [rect, setRect] =
    useState<DOMRect | null>(
      null
    );

  useEffect(() => {
    const update = () => {
      const element =
        document.querySelector(
          `[data-sytely-id="${CSS.escape(
            nodeId
          )}"]`
        ) as HTMLElement | null;

      if (element) {
        setRect(
          element.getBoundingClientRect()
        );
      }
    };

    update();

    window.addEventListener(
      "resize",
      update
    );

    window.addEventListener(
      "scroll",
      update,
      true
    );

    const timer =
      window.setInterval(
        update,
        120
      );

    return () => {
      window.removeEventListener(
        "resize",
        update
      );

      window.removeEventListener(
        "scroll",
        update,
        true
      );

      window.clearInterval(
        timer
      );
    };
  }, [nodeId]);

  if (!rect) {
    return null;
  }

  return (
    <div
      className="selection-overlay"
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }}
    >
      <span>
        Selected
      </span>

      <button
        type="button"
        onClick={onDelete}
      >
        ×
      </button>

      <i
        className="resize-right"
        onMouseDown={(event) =>
          onResize(
            nodeId,
            "right",
            event
          )
        }
      />

      <i
        className="resize-bottom"
        onMouseDown={(event) =>
          onResize(
            nodeId,
            "bottom",
            event
          )
        }
      />

      <i
        className="resize-corner"
        onMouseDown={(event) =>
          onResize(
            nodeId,
            "corner",
            event
          )
        }
      />
    </div>
  );
}

function Inspector({
  node,
  updateProp,
  updateStyle,
  numericDraft,
  setNumericDraft,
  uploadImage,
}: {
  node: ComponentNode;

  updateProp: (
    key: string,
    value: unknown
  ) => void;

  updateStyle: (
    key: string,
    value: unknown
  ) => void;

  numericDraft: Record<
    string,
    string
  >;

  setNumericDraft: Dispatch<
    SetStateAction<
      Record<string, string>
    >
  >;

  uploadImage: () => void;
}) {
  const number = (
    key: string,
    fallback: number
  ) => {
    const id = `${node.id}:${key}`;

    const committed =
      px(
        node.styles?.[key],
        fallback
      );

    const value =
      numericDraft[id] ??
      String(committed);

    return (
      <label>
        <span>
          {key}
        </span>

        <input
          value={value}
          inputMode="decimal"
          onChange={(event) => {
            const text =
              event.target
                .value;

            setNumericDraft(
              (current) => ({
                ...current,
                [id]: text,
              })
            );

            const parsed =
              Number(text);

            if (
              text !== "" &&
              Number.isFinite(
                parsed
              )
            ) {
              updateStyle(
                key,
                parsed
              );
            }
          }}
          onBlur={() =>
            setNumericDraft(
              (current) => {
                const next = {
                  ...current,
                };

                delete next[id];

                return next;
              }
            )
          }
        />
      </label>
    );
  };

  const text = (
    key: string,
    fallback = ""
  ) => (
    <label>
      <span>
        {key}
      </span>

      <input
        value={
          typeof node.props[
            key
          ] === "string"
            ? String(
                node.props[
                  key
                ]
              )
            : fallback
        }
        onChange={(event) =>
          updateProp(
            key,
            (
              node.type ===
                "menu" ||
              node.type ===
                "social"
            ) &&
            key === "items"
              ? event.target.value
                  .split(",")
                  .map(
                    (
                      item
                    ) =>
                      item.trim()
                  )
                  .filter(
                    Boolean
                  )
              : event.target
                  .value
          )
        }
      />
    </label>
  );

  return (
    <aside className="inspector">
      <header>
        <div>
          <strong>
            {
              info[
                node.type
              ][1]
            }
          </strong>

          <small>
            Real component
          </small>
        </div>
      </header>

      <section>
        <h3>
          Content
        </h3>

        {(node.type ===
          "heading" ||
          node.type ===
            "text") &&
          text(
            "text",
            node.type ===
              "heading"
              ? "Heading"
              : "Text"
          )}

        {node.type ===
          "button" && (
          <>
            {text(
              "text",
              "Button"
            )}

            {text(
              "linkTo",
              "#"
            )}
          </>
        )}

        {node.type ===
          "image" && (
          <>
            {text("src")}

            {text(
              "alt",
              "Image"
            )}

            <button
              className="upload"
              type="button"
              onClick={
                uploadImage
              }
            >
              Upload image
            </button>
          </>
        )}

        {node.type ===
          "gallery" && (
          <>
            <label>
              <span>
                Columns
              </span>

              <input
                value={String(
                  node.props
                    .columns ??
                    3
                )}
                onChange={(
                  event
                ) => {
                  const value =
                    Number(
                      event.target
                        .value
                    );

                  if (
                    Number.isFinite(
                      value
                    )
                  ) {
                    updateProp(
                      "columns",
                      Math.max(
                        1,
                        Math.min(
                          6,
                          value
                        )
                      )
                    );
                  }
                }}
              />
            </label>

            <button
              className="upload"
              type="button"
              onClick={
                uploadImage
              }
            >
              Upload images
            </button>
          </>
        )}

        {node.type ===
          "video" &&
          text("src")}

        {node.type ===
          "logo" &&
          text(
            "text",
            "Sytely"
          )}

        {node.type ===
          "icon" &&
          text(
            "icon",
            "✦"
          )}

        {node.type ===
          "menu" &&
          text(
            "items",
            Array.isArray(
              node.props
                .items
            )
              ? node.props.items.join(
                  ", "
                )
              : "Home, About, Contact"
          )}

        {node.type ===
          "social" &&
          text(
            "items",
            Array.isArray(
              node.props
                .items
            )
              ? node.props.items.join(
                  ", "
                )
              : "Instagram, X, LinkedIn"
          )}

        {node.type ===
          "form" && (
          <>
            {text(
              "title",
              "Contact us"
            )}

            {text(
              "submitLabel",
              "Send message"
            )}
          </>
        )}

        {node.type ===
          "card" && (
          <>
            {text(
              "title",
              "Card title"
            )}

            {text(
              "text",
              "Description"
            )}
          </>
        )}

        {node.type ===
          "testimonial" && (
          <>
            {text(
              "quote",
              "Quote"
            )}

            {text(
              "author",
              "Customer"
            )}
          </>
        )}

        {node.type ===
          "faq" && (
          <>
            {text(
              "question",
              "Question"
            )}

            {text(
              "answer",
              "Answer"
            )}
          </>
        )}

        {node.type ===
          "contact" && (
          <>
            {text(
              "title",
              "Contact"
            )}

            {text(
              "email",
              "hello@example.com"
            )}

            {text(
              "phone",
              "+1 000 000 0000"
            )}
          </>
        )}

        {node.type ===
          "footer" &&
          text(
            "text",
            "Footer"
          )}
      </section>

      <section>
        <h3>
          Layout
        </h3>

        {number(
          "width",
          0
        )}

        {number(
          "maxWidth",
          0
        )}

        {number(
          "gap",
          18
        )}

        {number(
          "paddingTop",
          0
        )}

        {number(
          "paddingRight",
          0
        )}

        {number(
          "paddingBottom",
          0
        )}

        {number(
          "paddingLeft",
          0
        )}

        {(node.type ===
          "section" ||
          node.type ===
            "features" ||
          node.type ===
            "pricing") && (
          <label>
            <span>
              Columns
            </span>

            <select
              value={
                typeof node
                  .props
                  .columns ===
                "number"
                  ? String(
                      node
                        .props
                        .columns
                    )
                  : ""
              }
              onChange={(
                event
              ) => {
                const count =
                  Number(
                    event.target
                      .value
                  );

                if (
                  !Number.isFinite(
                    count
                  )
                ) {
                  return;
                }

                updateProp(
                  "columns",
                  count
                );

                updateStyle(
                  "display",
                  "grid"
                );

                updateStyle(
                  "gridTemplateColumns",
                  `repeat(${count},minmax(0,1fr))`
                );
              }}
            >
              <option value="">
                Auto
              </option>

              {[
                1,
                2,
                3,
                4,
                5,
                6,
              ].map(
                (count) => (
                  <option
                    key={
                      count
                    }
                    value={
                      count
                    }
                  >
                    {count}
                  </option>
                )
              )}
            </select>
          </label>
        )}
      </section>

      <section>
        <h3>
          Typography
        </h3>

        {number(
          "fontSize",
          16
        )}

        {number(
          "fontWeight",
          400
        )}

        {number(
          "lineHeight",
          1.5
        )}

        <label>
          <span>
            Align
          </span>

          <select
            value={String(
              node.styles
                ?.textAlign ??
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
            <option>
              left
            </option>

            <option>
              center
            </option>

            <option>
              right
            </option>
          </select>
        </label>
      </section>

      <section>
        <h3>
          Appearance
        </h3>

        <label>
          <span>
            Background
          </span>

          <input
            value={
              typeof node
                .styles
                ?.background ===
              "string"
                ? String(
                    node
                      .styles
                      .background
                  )
                : ""
            }
            onChange={(event) =>
              updateStyle(
                "background",
                event.target
                  .value
              )
            }
          />
        </label>

        <label>
          <span>
            Color
          </span>

          <input
            value={
              typeof node
                .styles
                ?.color ===
              "string"
                ? String(
                    node
                      .styles
                      .color
                  )
                : ""
            }
            onChange={(event) =>
              updateStyle(
                "color",
                event.target
                  .value
              )
            }
          />
        </label>

        {number(
          "borderRadius",
          0
        )}
      </section>
    </aside>
  );
}