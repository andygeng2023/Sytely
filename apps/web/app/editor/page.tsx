"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SytelyRenderer } from "@sytely/renderer";
import type {
  Breakpoint,
  NodeStyle,
  NodeType,
  Site,
  SiteNode,
  SitePage
} from "@sytely/types";
import "./editor.css";

type History = Site[];

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

const baseSection = (
  id: string,
  content: SiteNode[] = []
): SiteNode => ({
  id,
  type: "section",
  name: "Section",
  style: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    paddingTop: "72px",
    paddingRight: "48px",
    paddingBottom: "72px",
    paddingLeft: "48px",
    gap: "24px",
    background: "#ffffff",
    position: "relative"
  },
  children: content
});

const templates: Record<string, SiteNode[]> = {
  Blank: [
    baseSection("blank-section", [
      {
        id: "blank-heading",
        type: "heading",
        content: "Build something great",
        style: {
          fontSize: "56px",
          fontWeight: "700",
          textAlign: "center",
          width: "100%"
        }
      },
      {
        id: "blank-text",
        type: "paragraph",
        content: "Start creating your website.",
        style: {
          fontSize: "20px",
          textAlign: "center",
          width: "100%"
        }
      }
    ])
  ],

  Business: [
    baseSection("business-hero", [
      {
        id: "business-logo",
        type: "logo",
        content: "YOUR BRAND",
        style: {
          fontSize: "22px",
          fontWeight: "700"
        }
      },
      {
        id: "business-heading",
        type: "heading",
        content: "A better way to grow your business",
        style: {
          fontSize: "64px",
          fontWeight: "700",
          maxWidth: "900px"
        } as NodeStyle
      },
      {
        id: "business-text",
        type: "paragraph",
        content:
          "A polished website built around your brand, your customers and your goals.",
        style: {
          fontSize: "20px",
          maxWidth: "700px"
        } as NodeStyle
      },
      {
        id: "business-button",
        type: "button",
        content: "Get started",
        href: "#contact",
        style: {
          width: "180px",
          height: "52px",
          background: "#111827",
          color: "#ffffff",
          borderRadius: "8px",
          textAlign: "center",
          paddingTop: "14px",
          paddingBottom: "14px"
        }
      }
    ])
  ],

  Portfolio: [
    baseSection("portfolio", [
      {
        id: "portfolio-title",
        type: "heading",
        content: "Selected work",
        style: {
          fontSize: "54px",
          fontWeight: "700"
        }
      },
      {
        id: "portfolio-gallery",
        type: "gallery",
        style: {
          width: "100%",
          gap: "16px"
        }
      }
    ])
  ],

  SaaS: [
    baseSection("saas", [
      {
        id: "saas-heading",
        type: "heading",
        content: "The modern workspace for your team",
        style: {
          fontSize: "58px",
          fontWeight: "700",
          textAlign: "center",
          width: "100%"
        }
      },
      {
        id: "saas-copy",
        type: "paragraph",
        content:
          "Plan, build and collaborate from one simple platform.",
        style: {
          fontSize: "20px",
          textAlign: "center",
          width: "100%"
        }
      },
      {
        id: "saas-button",
        type: "button",
        content: "Start for free",
        style: {
          width: "180px",
          height: "52px",
          background: "#2563eb",
          color: "#ffffff",
          borderRadius: "8px",
          textAlign: "center",
          paddingTop: "14px",
          paddingBottom: "14px",
          alignSelf: "center"
        }
      }
    ])
  ],

  Restaurant: [
    baseSection("restaurant", [
      {
        id: "restaurant-heading",
        type: "heading",
        content: "Welcome to our table",
        style: {
          fontSize: "60px",
          fontWeight: "700",
          textAlign: "center"
        }
      },
      {
        id: "restaurant-copy",
        type: "paragraph",
        content:
          "Fresh ingredients, thoughtful cooking and a warm atmosphere.",
        style: {
          fontSize: "20px",
          textAlign: "center"
        }
      },
      {
        id: "restaurant-button",
        type: "button",
        content: "View menu",
        href: "/menu",
        style: {
          width: "160px",
          height: "50px",
          background: "#111111",
          color: "#ffffff",
          borderRadius: "6px",
          alignSelf: "center",
          textAlign: "center",
          paddingTop: "13px"
        }
      }
    ])
  ]
};

const initialSite: Site = {
  id: "site",
  name: "My Site",
  theme: {
    primaryColor: "#2563eb",
    fontFamily: "Inter, Arial, sans-serif"
  },
  pages: [
    {
      id: "home",
      name: "Home",
      settings: {
        title: "Home",
        slug: "/",
        description: "My Sytely website"
      },
      components: templates.Business
    },
    {
      id: "about",
      name: "About",
      settings: {
        title: "About",
        slug: "/about",
        description: "About us"
      },
      components: [
        baseSection("about-section", [
          {
            id: "about-heading",
            type: "heading",
            content: "About us",
            style: {
              fontSize: "56px",
              fontWeight: "700"
            }
          },
          {
            id: "about-text",
            type: "paragraph",
            content: "Tell visitors about your company or project.",
            style: {
              fontSize: "20px",
              maxWidth: "720px"
            } as NodeStyle
          }
        ])
      ]
    }
  ]
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function findNode(nodes: SiteNode[], id: string): SiteNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children ?? [], id);
    if (found) return found;
  }
  return null;
}

function walkNodes(
  nodes: SiteNode[],
  callback: (node: SiteNode) => void
) {
  for (const node of nodes) {
    callback(node);
    walkNodes(node.children ?? [], callback);
  }
}

function contains(nodes: SiteNode[], ancestorId: string, targetId: string) {
  const ancestor = findNode(nodes, ancestorId);
  if (!ancestor) return false;
  return !!findNode(ancestor.children ?? [], targetId);
}

function updateNode(
  nodes: SiteNode[],
  id: string,
  updater: (node: SiteNode) => SiteNode
): SiteNode[] {
  return nodes.map((node) => {
    if (node.id === id) return updater(node);

    return {
      ...node,
      children: node.children
        ? updateNode(node.children, id, updater)
        : node.children
    };
  });
}

function removeNodes(
  nodes: SiteNode[],
  ids: Set<string>
): { nodes: SiteNode[]; removed: SiteNode[] } {
  const removed: SiteNode[] = [];

  const result = nodes
    .filter((node) => {
      if (ids.has(node.id)) {
        removed.push(node);
        return false;
      }
      return true;
    })
    .map((node) => {
      if (!node.children) return node;

      const childResult = removeNodes(node.children, ids);
      removed.push(...childResult.removed);

      return {
        ...node,
        children: childResult.nodes
      };
    });

  return { nodes: result, removed };
}

function insertInto(
  nodes: SiteNode[],
  parentId: string,
  children: SiteNode[]
): SiteNode[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...(node.children ?? []), ...children]
      };
    }

    return node.children
      ? {
          ...node,
          children: insertInto(node.children, parentId, children)
        }
      : node;
  });
}

function nodeLabel(node: SiteNode) {
  return node.name || node.type[0].toUpperCase() + node.type.slice(1);
}

export default function EditorPage() {
  const [site, setSite] = useState<Site>(() => clone(initialSite));
  const [history, setHistory] = useState<History>([]);
  const [future, setFuture] = useState<History>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pageId, setPageId] = useState("home");
  const [breakpoint, setBreakpoint] =
    useState<Breakpoint>("desktop");
  const [zoom, setZoom] = useState(100);
  const [leftTab, setLeftTab] =
    useState<"add" | "pages" | "layers">("add");
  const [inspectorTab, setInspectorTab] =
    useState<"design" | "layout" | "position" | "page">("design");
  const [marquee, setMarquee] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const clipboard = useRef<SiteNode[]>([]);

  const page = site.pages.find((item) => item.id === pageId)!;
  const selectedNodes = selectedIds
    .map((id) => findNode(page.components, id))
    .filter(Boolean) as SiteNode[];

  const selected = selectedNodes[0] ?? null;

  const commit = useCallback(
    (next: Site) => {
      setHistory((previous) => [
        ...previous.slice(-49),
        clone(site)
      ]);
      setFuture([]);
      setSite(clone(next));
    },
    [site]
  );

  const mutatePage = useCallback(
    (fn: (page: SitePage) => SitePage) => {
      const next = clone(site);
      const target = next.pages.find((item) => item.id === pageId);
      if (!target) return;
      const changed = fn(target);
      next.pages = next.pages.map((item) =>
        item.id === pageId ? changed : item
      );
      commit(next);
    },
    [site, pageId, commit]
  );

  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;

    setFuture((items) => [clone(site), ...items]);
    setHistory((items) => items.slice(0, -1));
    setSite(clone(previous));
    setSelectedIds([]);
  };

  const redo = () => {
    const next = future[0];
    if (!next) return;

    setHistory((items) => [...items, clone(site)]);
    setFuture((items) => items.slice(1));
    setSite(clone(next));
    setSelectedIds([]);
  };

  const addNode = (type: NodeType) => {
    const defaults: Record<NodeType, SiteNode> = {
      section: baseSection(uid()),
      heading: {
        id: uid(),
        type: "heading",
        content: "New heading",
        style: {
          fontSize: "48px",
          fontWeight: "700"
        }
      },
      paragraph: {
        id: uid(),
        type: "paragraph",
        content: "New paragraph",
        style: {
          fontSize: "18px"
        }
      },
      button: {
        id: uid(),
        type: "button",
        content: "Button",
        style: {
          width: "160px",
          height: "48px",
          background: site.theme.primaryColor,
          color: "#fff",
          borderRadius: "8px",
          paddingTop: "12px",
          paddingBottom: "12px",
          textAlign: "center"
        }
      },
      image: {
        id: uid(),
        type: "image",
        style: {
          width: "420px",
          height: "280px",
          objectFit: "cover",
          borderRadius: "8px"
        }
      },
      video: {
        id: uid(),
        type: "video",
        style: {
          width: "600px",
          height: "340px"
        }
      },
      gallery: {
        id: uid(),
        type: "gallery",
        style: {
          width: "100%"
        }
      },
      divider: {
        id: uid(),
        type: "divider",
        style: {
          width: "100%",
          border: "none",
          borderTop: "1px solid #ddd"
        }
      },
      icon: {
        id: uid(),
        type: "icon",
        content: "★",
        style: {
          fontSize: "40px"
        }
      },
      social: {
        id: uid(),
        type: "social",
        content: "Instagram   X   Facebook",
        style: {
          fontSize: "16px"
        }
      },
      form: {
        id: uid(),
        type: "form",
        style: {
          width: "360px",
          padding: "20px"
        } as NodeStyle
      },
      menu: {
        id: uid(),
        type: "menu",
        content: "Home   About   Contact",
        style: {
          fontSize: "16px"
        }
      },
      logo: {
        id: uid(),
        type: "logo",
        content: site.name,
        style: {
          fontSize: "22px",
          fontWeight: "700"
        }
      },
      group: {
        id: uid(),
        type: "group",
        style: {
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }
      }
    };

    const node = defaults[type];

    mutatePage((current) => {
      if (selected?.type === "section") {
        return {
          ...current,
          components: insertInto(
            current.components,
            selected.id,
            [node]
          )
        };
      }

      const firstSection = current.components.find(
        (item) => item.type === "section"
      );

      if (firstSection) {
        return {
          ...current,
          components: insertInto(
            current.components,
            firstSection.id,
            [node]
          )
        };
      }

      return {
        ...current,
        components: [...current.components, node]
      };
    });

    setSelectedIds([node.id]);
  };

  const applyTemplate = (name: string) => {
    const nodes = clone(templates[name]);

    mutatePage((current) => ({
      ...current,
      components: nodes
    }));

    setSelectedIds([]);
  };

  const changeStyle = (key: keyof NodeStyle, value: string) => {
    if (!selectedIds.length) return;

    mutatePage((current) => {
      let components = current.components;

      for (const id of selectedIds) {
        components = updateNode(
          components,
          id,
          (node) => ({
            ...node,
            style: {
              ...(node.style ?? {}),
              [key]: value
            }
          })
        );
      }

      return {
        ...current,
        components
      };
    });
  };

  const changeResponsiveStyle = (
    key: keyof NodeStyle,
    value: string
  ) => {
    if (!selectedIds.length) return;

    mutatePage((current) => {
      let components = current.components;

      for (const id of selectedIds) {
        components = updateNode(
          components,
          id,
          (node) => ({
            ...node,
            responsive: {
              ...(node.responsive ?? {}),
              [breakpoint]: {
                ...(node.responsive?.[breakpoint] ?? {}),
                [key]: value
              }
            }
          })
        );
      }

      return {
        ...current,
        components
      };
    });
  };

  const changeContent = (value: string) => {
    if (!selected) return;

    mutatePage((current) => ({
      ...current,
      components: updateNode(
        current.components,
        selected.id,
        (node) => ({
          ...node,
          content: value
        })
      )
    }));
  };

  const changePageSetting = (
    key: keyof SitePage["settings"],
    value: string | boolean
  ) => {
    mutatePage((current) => ({
      ...current,
      settings: {
        ...current.settings,
        [key]: value
      }
    }));
  };

  const deleteSelected = () => {
    if (!selectedIds.length) return;

    mutatePage((current) => ({
      ...current,
      components: removeNodes(
        current.components,
        new Set(selectedIds)
      ).nodes
    }));

    setSelectedIds([]);
  };

  const duplicateSelected = () => {
    if (!selectedIds.length) return;

    const copies = selectedNodes.map((node) => ({
      ...clone(node),
      id: uid(),
      children: node.children?.map((child) => ({
        ...clone(child),
        id: uid()
      }))
    }));

    mutatePage((current) => ({
      ...current,
      components: [...current.components, ...copies]
    }));

    setSelectedIds(copies.map((node) => node.id));
  };

  const groupSelected = () => {
    if (selectedIds.length < 2) return;

    const selectedSet = new Set(selectedIds);
    const removed = removeNodes(
      page.components,
      selectedSet
    );

    const group: SiteNode = {
      id: uid(),
      type: "group",
      name: "Group",
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      },
      children: removed.removed
    };

    mutatePage((current) => ({
      ...current,
      components: [
        ...removed.nodes,
        group
      ]
    }));

    setSelectedIds([group.id]);
  };

  const ungroup = () => {
    if (!selected || selected.type !== "group") return;

    const children = selected.children ?? [];

    mutatePage((current) => ({
      ...current,
      components: [
        ...removeNodes(
          current.components,
          new Set([selected.id])
        ).nodes,
        ...children
      ]
    }));

    setSelectedIds(children.map((child) => child.id));
  };

  const copySelected = () => {
    clipboard.current = clone(selectedNodes);
  };

  const paste = () => {
    if (!clipboard.current.length) return;

    const copies = clipboard.current.map((node) => ({
      ...clone(node),
      id: uid()
    }));

    mutatePage((current) => ({
      ...current,
      components: [
        ...current.components,
        ...copies
      ]
    }));

    setSelectedIds(copies.map((node) => node.id));
  };

  const moveSelected = (
    dx: number,
    dy: number
  ) => {
    if (!selectedIds.length) return;

    mutatePage((current) => {
      let components = current.components;

      for (const id of selectedIds) {
        components = updateNode(
          components,
          id,
          (node) => ({
            ...node,
            style: {
              ...(node.style ?? {}),
              position: "absolute",
              left: `calc(${node.style?.left || "0px"} + ${dx}px)`,
              top: `calc(${node.style?.top || "0px"} + ${dy}px)`
            }
          })
        );
      }

      return {
        ...current,
        components
      };
    });
  };

  const handleSelect = (
    id: string,
    event: React.MouseEvent
  ) => {
    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      setSelectedIds((ids) =>
        ids.includes(id)
          ? ids.filter((item) => item !== id)
          : [...ids, id]
      );
    } else {
      setSelectedIds([id]);
    }

    setPageId(pageId);
    setInspectorTab("design");
  };

  const handleCanvasPointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (
      event.target !== event.currentTarget &&
      !(event.target as HTMLElement).classList.contains(
        "canvas-stage"
      )
    ) {
      return;
    }

    dragStart.current = {
      x: event.clientX,
      y: event.clientY
    };

    setMarquee({
      x: event.clientX,
      y: event.clientY,
      width: 0,
      height: 0
    });
  };

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!dragStart.current) return;

      const x = Math.min(
        dragStart.current.x,
        event.clientX
      );
      const y = Math.min(
        dragStart.current.y,
        event.clientY
      );
      const width = Math.abs(
        event.clientX - dragStart.current.x
      );
      const height = Math.abs(
        event.clientY - dragStart.current.y
      );

      setMarquee({
        x,
        y,
        width,
        height
      });
    };

    const up = () => {
      if (!marquee) {
        dragStart.current = null;
        return;
      }

      const elements = document.querySelectorAll(
        "[data-sytely-node]"
      );

      const ids: string[] = [];

      elements.forEach((element) => {
        const rect = element.getBoundingClientRect();

        const intersects =
          rect.left < marquee.x + marquee.width &&
          rect.right > marquee.x &&
          rect.top < marquee.y + marquee.height &&
          rect.bottom > marquee.y;

        if (intersects) {
          const id = element.getAttribute(
            "data-sytely-node"
          );

          if (id) ids.push(id);
        }
      });

      setSelectedIds(
        Array.from(new Set(ids)).filter(
          (id) => !!findNode(page.components, id)
        )
      );

      setMarquee(null);
      dragStart.current = null;
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [marquee, page.components]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "z"
      ) {
        event.preventDefault();

        if (event.shiftKey) redo();
        else undo();

        return;
      }

      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "c"
      ) {
        event.preventDefault();
        copySelected();
        return;
      }

      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "v"
      ) {
        event.preventDefault();
        paste();
        return;
      }

      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "d"
      ) {
        event.preventDefault();
        duplicateSelected();
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelected();
        return;
      }

      if (event.key === "ArrowLeft") moveSelected(-5, 0);
      if (event.key === "ArrowRight") moveSelected(5, 0);
      if (event.key === "ArrowUp") moveSelected(0, -5);
      if (event.key === "ArrowDown") moveSelected(0, 5);
    };

    window.addEventListener("keydown", keydown);

    return () =>
      window.removeEventListener("keydown", keydown);
  });

  const layerList = useMemo(() => {
    const list: SiteNode[] = [];
    walkNodes(page.components, (node) => list.push(node));
    return list;
  }, [page.components]);

  return (
    <div
      className="sytely-editor"
      style={{
        fontFamily: site.theme.fontFamily
      }}
    >
      <header className="topbar">
        <div className="brand">Sytely</div>

        <button
          onClick={undo}
          disabled={!history.length}
          title="Undo"
        >
          ↶
        </button>

        <button
          onClick={redo}
          disabled={!future.length}
          title="Redo"
        >
          ↷
        </button>

        <div className="device-switcher">
          {(["desktop", "tablet", "mobile"] as Breakpoint[]).map(
            (item) => (
              <button
                key={item}
                className={
                  breakpoint === item ? "active" : ""
                }
                onClick={() => setBreakpoint(item)}
              >
                {item === "desktop"
                  ? "Desktop"
                  : item === "tablet"
                    ? "Tablet"
                    : "Mobile"}
              </button>
            )
          )}
        </div>

        <div className="top-spacer" />

        <button onClick={() => setZoom(zoom - 10)}>
          −
        </button>

        <span className="zoom">{zoom}%</span>

        <button onClick={() => setZoom(zoom + 10)}>
          +
        </button>

        <button
          onClick={() =>
            window.open(
              `/preview?page=${encodeURIComponent(page.settings.slug)}`,
              "_blank"
            )
          }
        >
          Preview
        </button>

        <button
          className="primary-button"
          onClick={() => {
            localStorage.setItem(
              "sytely-site",
              JSON.stringify(site)
            );
            alert("Site saved.");
          }}
        >
          Save
        </button>

        <button
          className="publish-button"
          onClick={() => {
            localStorage.setItem(
              "sytely-site",
              JSON.stringify(site)
            );
            window.open("/", "_blank");
          }}
        >
          Publish
        </button>
      </header>

      <div className="workspace">
        <aside className="left-panel">
          <div className="panel-tabs">
            <button
              className={leftTab === "add" ? "active" : ""}
              onClick={() => setLeftTab("add")}
            >
              Add
            </button>
            <button
              className={leftTab === "pages" ? "active" : ""}
              onClick={() => setLeftTab("pages")}
            >
              Pages
            </button>
            <button
              className={leftTab === "layers" ? "active" : ""}
              onClick={() => setLeftTab("layers")}
            >
              Layers
            </button>
          </div>

          {leftTab === "add" && (
            <div className="panel-scroll">
              <h3>Elements</h3>

              <div className="element-grid">
                {[
                  ["section", "Section"],
                  ["heading", "Heading"],
                  ["paragraph", "Text"],
                  ["button", "Button"],
                  ["image", "Image"],
                  ["video", "Video"],
                  ["gallery", "Gallery"],
                  ["divider", "Divider"],
                  ["icon", "Icon"],
                  ["social", "Social"],
                  ["form", "Form"],
                  ["menu", "Menu"],
                  ["logo", "Logo"]
                ].map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() =>
                      addNode(type as NodeType)
                    }
                  >
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              <h3>Templates</h3>

              <div className="template-list">
                {Object.keys(templates).map((name) => (
                  <button
                    key={name}
                    onClick={() => applyTemplate(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {leftTab === "pages" && (
            <div className="panel-scroll">
              <div className="panel-heading">
                <h3>Pages</h3>

                <button
                  onClick={() => {
                    const newPage: SitePage = {
                      id: uid(),
                      name: "New Page",
                      settings: {
                        title: "New Page",
                        slug: "/new-page"
                      },
                      components: [
                        baseSection(uid())
                      ]
                    };

                    const next = clone(site);
                    next.pages.push(newPage);
                    commit(next);
                    setPageId(newPage.id);
                  }}
                >
                  +
                </button>
              </div>

              {site.pages.map((item) => (
                <button
                  className={
                    item.id === pageId
                      ? "page-item active"
                      : "page-item"
                  }
                  key={item.id}
                  onClick={() => {
                    setPageId(item.id);
                    setSelectedIds([]);
                  }}
                >
                  <span>{item.name}</span>
                  <small>{item.settings.slug}</small>
                </button>
              ))}
            </div>
          )}

          {leftTab === "layers" && (
            <div className="panel-scroll">
              <h3>Layers</h3>

              {layerList.map((node) => (
                <button
                  className={
                    selectedIds.includes(node.id)
                      ? "layer-item active"
                      : "layer-item"
                  }
                  key={node.id}
                  onClick={() =>
                    setSelectedIds([node.id])
                  }
                >
                  <span>{nodeLabel(node)}</span>
                  <small>{node.type}</small>
                </button>
              ))}
            </div>
          )}
        </aside>

        <main className="canvas-area">
          <div className="ruler-horizontal">
            {Array.from({ length: 20 }).map((_, index) => (
              <span key={index}>{index * 100}</span>
            ))}
          </div>

          <div className="ruler-vertical">
            {Array.from({ length: 20 }).map((_, index) => (
              <span key={index}>{index * 100}</span>
            ))}
          </div>

          <div
            className="canvas-scroll"
            ref={canvasRef}
            onPointerDown={handleCanvasPointerDown}
          >
            <div
              className="canvas-stage"
              style={{
                width:
                  breakpoint === "desktop"
                    ? 1200
                    : breakpoint === "tablet"
                      ? 768
                      : 390,
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center"
              }}
            >
              <div className="snap-guide horizontal" />
              <div className="snap-guide vertical" />

              <SytelyRenderer
                nodes={page.components}
                breakpoint={breakpoint}
                editable
                selectedIds={selectedIds}
                onSelect={handleSelect}
              />

              {page.components.length === 0 && (
                <div className="empty-canvas">
                  Add a section to start building.
                </div>
              )}
            </div>
          </div>

          {marquee && (
            <div
              className="marquee"
              style={{
                left: marquee.x,
                top: marquee.y,
                width: marquee.width,
                height: marquee.height
              }}
            />
          )}

          <div className="page-tabs">
            {site.pages.map((item) => (
              <button
                className={
                  item.id === pageId ? "active" : ""
                }
                key={item.id}
                onClick={() => {
                  setPageId(item.id);
                  setSelectedIds([]);
                }}
              >
                {item.name}
              </button>
            ))}
          </div>
        </main>

        <aside className="inspector">
          <div className="inspector-tabs">
            <button
              className={
                inspectorTab === "design" ? "active" : ""
              }
              onClick={() => setInspectorTab("design")}
            >
              Design
            </button>
            <button
              className={
                inspectorTab === "layout" ? "active" : ""
              }
              onClick={() => setInspectorTab("layout")}
            >
              Layout
            </button>
            <button
              className={
                inspectorTab === "position" ? "active" : ""
              }
              onClick={() => setInspectorTab("position")}
            >
              Position
            </button>
            <button
              className={
                inspectorTab === "page" ? "active" : ""
              }
              onClick={() => setInspectorTab("page")}
            >
              Page
            </button>
          </div>

          <div className="inspector-scroll">
            {selected && inspectorTab !== "page" ? (
              <>
                <div className="selection-title">
                  <strong>
                    {selectedIds.length > 1
                      ? `${selectedIds.length} elements selected`
                      : nodeLabel(selected)}
                  </strong>

                  <small>
                    Type: {selected.type}
                  </small>
                </div>

                {selectedIds.length > 1 && (
                  <div className="inspector-section">
                    <h4>Selection</h4>

                    <button onClick={groupSelected}>
                      Group
                    </button>

                    <button
                      onClick={() => {
                        selectedNodes.forEach(() =>
                          changeStyle(
                            "alignSelf",
                            "center"
                          )
                        );
                      }}
                    >
                      Align center
                    </button>
                  </div>
                )}

                {(selected.type === "heading" ||
                  selected.type === "paragraph" ||
                  selected.type === "button" ||
                  selected.type === "logo" ||
                  selected.type === "menu" ||
                  selected.type === "social" ||
                  selected.type === "icon") && (
                  <div className="inspector-section">
                    <h4>Content</h4>

                    <textarea
                      value={selected.content || ""}
                      onChange={(event) =>
                        changeContent(event.target.value)
                      }
                    />
                  </div>
                )}

                {inspectorTab === "design" && (
                  <>
                    {selected.type !== "section" && (
                      <div className="inspector-section">
                        <h4>Typography</h4>

                        <label>
                          Font size
                          <input
                            value={
                              selected.responsive?.[
                                breakpoint
                              ]?.fontSize ||
                              selected.style?.fontSize ||
                              ""
                            }
                            onChange={(event) =>
                              changeResponsiveStyle(
                                "fontSize",
                                event.target.value
                              )
                            }
                            placeholder="18px"
                          />
                        </label>

                        <label>
                          Weight
                          <select
                            value={
                              selected.style
                                ?.fontWeight || "400"
                            }
                            onChange={(event) =>
                              changeStyle(
                                "fontWeight",
                                event.target.value
                              )
                            }
                          >
                            <option value="400">
                              Regular
                            </option>
                            <option value="500">
                              Medium
                            </option>
                            <option value="600">
                              Semibold
                            </option>
                            <option value="700">
                              Bold
                            </option>
                          </select>
                        </label>

                        <label>
                          Text align
                          <select
                            value={
                              selected.style?.textAlign ||
                              "left"
                            }
                            onChange={(event) =>
                              changeStyle(
                                "textAlign",
                                event.target.value
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

                        <label>
                          Color
                          <input
                            value={
                              selected.style?.color || ""
                            }
                            onChange={(event) =>
                              changeStyle(
                                "color",
                                event.target.value
                              )
                            }
                            placeholder="#111111"
                          />
                        </label>
                      </div>
                    )}

                    <div className="inspector-section">
                      <h4>Appearance</h4>

                      <label>
                        Background
                        <input
                          value={
                            selected.style?.background ||
                            ""
                          }
                          onChange={(event) =>
                            changeStyle(
                              "background",
                              event.target.value
                            )
                          }
                          placeholder="#ffffff"
                        />
                      </label>

                      <label>
                        Border
                        <input
                          value={
                            selected.style?.border || ""
                          }
                          onChange={(event) =>
                            changeStyle(
                              "border",
                              event.target.value
                            )
                          }
                          placeholder="1px solid #ddd"
                        />
                      </label>

                      <label>
                        Radius
                        <input
                          value={
                            selected.style
                              ?.borderRadius || ""
                          }
                          onChange={(event) =>
                            changeStyle(
                              "borderRadius",
                              event.target.value
                            )
                          }
                          placeholder="8px"
                        />
                      </label>

                      <label>
                        Shadow
                        <input
                          value={
                            selected.style
                              ?.boxShadow || ""
                          }
                          onChange={(event) =>
                            changeStyle(
                              "boxShadow",
                              event.target.value
                            )
                          }
                          placeholder="0 8px 30px #0001"
                        />
                      </label>
                    </div>

                    <div className="inspector-section">
                      <h4>Link</h4>

                      <input
                        value={selected.href || ""}
                        onChange={(event) => {
                          const value =
                            event.target.value;

                          mutatePage((current) => ({
                            ...current,
                            components:
                              updateNode(
                                current.components,
                                selected.id,
                                (node) => ({
                                  ...node,
                                  href: value
                                })
                              )
                          }));
                        }}
                        placeholder="/about or https://..."
                      />
                    </div>
                  </>
                )}

                {inspectorTab === "layout" && (
                  <>
                    <div className="inspector-section">
                      <h4>Size</h4>

                      <label>
                        Width
                        <input
                          value={
                            selected.style?.width || ""
                          }
                          onChange={(event) =>
                            changeResponsiveStyle(
                              "width",
                              event.target.value
                            )
                          }
                          placeholder="100%"
                        />
                      </label>

                      <label>
                        Height
                        <input
                          value={
                            selected.style?.height || ""
                          }
                          onChange={(event) =>
                            changeResponsiveStyle(
                              "height",
                              event.target.value
                            )
                          }
                          placeholder="auto"
                        />
                      </label>
                    </div>

                    <div className="inspector-section">
                      <h4>Spacing</h4>

                      {(
                        [
                          "paddingTop",
                          "paddingRight",
                          "paddingBottom",
                          "paddingLeft",
                          "gap"
                        ] as (keyof NodeStyle)[]
                      ).map((key) => (
                        <label key={key}>
                          {key
                            .replace("padding", "Padding ")
                            .replace(
                              "paddingTop",
                              "Padding top"
                            )
                            .replace(
                              "paddingRight",
                              "Padding right"
                            )
                            .replace(
                              "paddingBottom",
                              "Padding bottom"
                            )
                            .replace(
                              "paddingLeft",
                              "Padding left"
                            )
                            .replace("gap", "Gap")}
                          <input
                            value={
                              selected.style?.[key] || ""
                            }
                            onChange={(event) =>
                              changeResponsiveStyle(
                                key,
                                event.target.value
                              )
                            }
                            placeholder="24px"
                          />
                        </label>
                      ))}
                    </div>

                    <div className="inspector-section">
                      <h4>Alignment</h4>

                      <label>
                        Horizontal
                        <select
                          value={
                            selected.style
                              ?.alignSelf || "stretch"
                          }
                          onChange={(event) =>
                            changeStyle(
                              "alignSelf",
                              event.target.value
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
                          <option value="stretch">
                            Stretch
                          </option>
                        </select>
                      </label>

                      {selected.type === "section" && (
                        <label>
                          Vertical
                          <select
                            value={
                              selected.style
                                ?.verticalAlign ||
                              "top"
                            }
                            onChange={(event) =>
                              changeStyle(
                                "verticalAlign",
                                event.target.value
                              )
                            }
                          >
                            <option value="top">
                              Top
                            </option>
                            <option value="center">
                              Center
                            </option>
                            <option value="bottom">
                              Bottom
                            </option>
                          </select>
                        </label>
                      )}
                    </div>
                  </>
                )}

                {inspectorTab === "position" && (
                  <div className="inspector-section">
                    <h4>Position</h4>

                    <label>
                      Position
                      <select
                        value={
                          selected.style?.position ||
                          "relative"
                        }
                        onChange={(event) =>
                          changeStyle(
                            "position",
                            event.target.value
                          )
                        }
                      >
                        <option value="relative">
                          Normal
                        </option>
                        <option value="absolute">
                          Absolute
                        </option>
                      </select>
                    </label>

                    {selected.style?.position ===
                      "absolute" && (
                      <>
                        <label>
                          Left
                          <input
                            value={
                              selected.style?.left || ""
                            }
                            onChange={(event) =>
                              changeResponsiveStyle(
                                "left",
                                event.target.value
                              )
                            }
                          />
                        </label>

                        <label>
                          Top
                          <input
                            value={
                              selected.style?.top || ""
                            }
                            onChange={(event) =>
                              changeResponsiveStyle(
                                "top",
                                event.target.value
                              )
                            }
                          />
                        </label>
                      </>
                    )}

                    {selected.type === "group" && (
                      <button onClick={ungroup}>
                        Ungroup
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="selection-title">
                  <strong>Page Inspector</strong>
                  <small>{page.name}</small>
                </div>

                <div className="inspector-section">
                  <h4>Page settings</h4>

                  <label>
                    Page name
                    <input
                      value={page.name}
                      onChange={(event) => {
                        const value = event.target.value;

                        mutatePage((current) => ({
                          ...current,
                          name: value
                        }));
                      }}
                    />
                  </label>

                  <label>
                    URL slug
                    <input
                      value={page.settings.slug}
                      onChange={(event) =>
                        changePageSetting(
                          "slug",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    SEO title
                    <input
                      value={
                        page.settings.seoTitle || ""
                      }
                      onChange={(event) =>
                        changePageSetting(
                          "seoTitle",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    SEO description
                    <textarea
                      value={
                        page.settings.seoDescription || ""
                      }
                      onChange={(event) =>
                        changePageSetting(
                          "seoDescription",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={
                        page.settings.noIndex || false
                      }
                      onChange={(event) =>
                        changePageSetting(
                          "noIndex",
                          event.target.checked
                        )
                      }
                    />
                    Hide from search engines
                  </label>
                </div>

                <div className="inspector-section">
                  <h4>Site</h4>

                  <label>
                    Site name
                    <input
                      value={site.name}
                      onChange={(event) => {
                        const next = clone(site);
                        next.name =
                          event.target.value;
                        commit(next);
                      }}
                    />
                  </label>

                  <label>
                    Primary color
                    <input
                      value={
                        site.theme.primaryColor
                      }
                      onChange={(event) => {
                        const next = clone(site);
                        next.theme.primaryColor =
                          event.target.value;
                        commit(next);
                      }}
                    />
                  </label>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}