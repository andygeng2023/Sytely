"use client";

import {
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode
} from "react";

import type {
  ComponentNode,
  ComponentType,
  Site,
  SitePage
} from "@sytely/types";

import { renderNode } from "@sytely/renderer";

import "./editor.css";

function newId(): string {
  return crypto.randomUUID();
}

function createNode(
  type: ComponentType,
  id = newId()
): ComponentNode {
  const base: ComponentNode = {
    id,
    type,
    props: {},
    styles: {},
    children: []
  };

  switch (type) {
    case "section":
      return {
        ...base,
        props: {
          name: "Section"
        },
        styles: {
          minHeight: 180,
          padding: 32,
          background: "#ffffff",
          borderRadius: 0
        }
      };

    case "heading":
      return {
        ...base,
        props: {
          text: "Your heading"
        },
        styles: {
          width: "100%",
          fontSize: 42,
          fontWeight: 700,
          color: "#111827",
          lineHeight: 1.1
        }
      };

    case "text":
      return {
        ...base,
        props: {
          text: "Add your text here."
        },
        styles: {
          width: "100%",
          fontSize: 18,
          color: "#4b5563",
          lineHeight: 1.6
        }
      };

    case "image":
      return {
        ...base,
        props: {
          src: "",
          alt: ""
        },
        styles: {
          width: 400,
          height: 250,
          borderRadius: 12
        }
      };

    case "button":
      return {
        ...base,
        props: {
          text: "Get Started",
          linkTo: ""
        },
        styles: {
          width: 160,
          height: 48,
          fontSize: 16,
          fontWeight: 600,
          color: "#ffffff",
          background: "#111827",
          borderRadius: 8,
          border: "none"
        }
      };
  }
}

function createHeroSection(): ComponentNode {
  const section = createNode("section", "section-hero");

  section.props = {
    name: "Hero"
  };

  section.styles = {
    minHeight: 420,
    padding: 56,
    background: "#f8fafc",
    borderRadius: 0,
    display: "flex",
    flexDirection: "column",
    gap: 18,
    justifyContent: "center"
  };

  section.children = [
    {
      ...createNode("heading", "hero-heading"),
      props: {
        text: "Build your website with Sytely"
      },
      styles: {
        width: "100%",
        fontSize: 52,
        fontWeight: 800,
        color: "#111827",
        lineHeight: 1.05
      }
    },
    {
      ...createNode("text", "hero-text"),
      props: {
        text: "Design pages visually without writing code."
      },
      styles: {
        width: "100%",
        fontSize: 20,
        color: "#64748b",
        lineHeight: 1.5
      }
    },
    {
      ...createNode("button", "hero-button"),
      props: {
        text: "Start Building",
        linkTo: ""
      }
    }
  ];

  return section;
}

function createFeaturesSection(): ComponentNode {
  const section = createNode("section", "section-features");

  section.props = {
    name: "Features"
  };

  section.styles = {
    minHeight: 300,
    padding: 40,
    background: "#ffffff",
    display: "flex",
    flexDirection: "column",
    gap: 20
  };

  section.children = [
    {
      ...createNode("heading", "features-heading"),
      props: {
        text: "Everything you need"
      },
      styles: {
        fontSize: 34,
        fontWeight: 700,
        color: "#111827"
      }
    },
    {
      ...createNode("text", "features-text"),
      props: {
        text: "Drag components, create sections, and build multiple pages."
      },
      styles: {
        fontSize: 17,
        color: "#64748b"
      }
    },
    {
      ...createNode("section", "feature-cards"),
      props: {
        name: "Feature Cards"
      },
      styles: {
        width: "100%",
        minHeight: 120,
        padding: 24,
        background: "#f8fafc",
        borderRadius: 12,
        display: "flex",
        flexDirection: "row",
        gap: 24
      },
      children: [
        {
          ...createNode("heading", "feature-card-one"),
          props: {
            text: "Visual editing"
          },
          styles: {
            fontSize: 20,
            fontWeight: 700
          }
        },
        {
          ...createNode("heading", "feature-card-two"),
          props: {
            text: "Multiple pages"
          },
          styles: {
            fontSize: 20,
            fontWeight: 700
          }
        },
        {
          ...createNode("heading", "feature-card-three"),
          props: {
            text: "Responsive design"
          },
          styles: {
            fontSize: 20,
            fontWeight: 700
          }
        }
      ]
    }
  ];

  return section;
}

function createInitialSite(): Site {
  const homePage: SitePage = {
    id: "page-home",
    name: "Home",
    slug: "/",
    margins: {
      top: 40,
      right: 40,
      bottom: 40,
      left: 40
    },
    components: [
      createHeroSection(),
      createFeaturesSection()
    ]
  };

  return {
    id: "site-1",
    name: "My Website",
    version: 1,
    pages: [homePage]
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

    const found = findNode(node.children, id);

    if (found) {
      return found;
    }
  }

  return null;
}

function containsNode(
  node: ComponentNode,
  id: string
): boolean {
  if (node.id === id) {
    return true;
  }

  return node.children.some((child) =>
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
  for (let index = 0; index < nodes.length; index++) {
    if (nodes[index].id === id) {
      const removed = nodes[index];

      return {
        nodes: nodes.filter((_, i) => i !== index),
        removed
      };
    }
  }

  let removed: ComponentNode | null = null;

  const updated = nodes.map((node) => {
    if (removed) {
      return node;
    }

    const result = removeNode(node.children, id);

    if (result.removed) {
      removed = result.removed;

      return {
        ...node,
        children: result.nodes
      };
    }

    return node;
  });

  return {
    nodes: updated,
    removed
  };
}

function addChild(
  nodes: ComponentNode[],
  parentId: string,
  child: ComponentNode
): ComponentNode[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...node.children, child]
      };
    }

    return {
      ...node,
      children: addChild(node.children, parentId, child)
    };
  });
}

function updateNode(
  nodes: ComponentNode[],
  id: string,
  updater: (node: ComponentNode) => ComponentNode
): ComponentNode[] {
  return nodes.map((node) => {
    if (node.id === id) {
      return updater(node);
    }

    return {
      ...node,
      children: updateNode(node.children, id, updater)
    };
  });
}

function deleteNode(
  nodes: ComponentNode[],
  id: string
): ComponentNode[] {
  return removeNode(nodes, id).nodes;
}

type DragData =
  | {
      kind: "new-component";
      type: ComponentType;
    }
  | {
      kind: "new-section";
      node: ComponentNode;
    }
  | {
      kind: "existing";
      id: string;
    };

function setDragData(
  event: DragEvent,
  data: DragData
) {
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(
    "application/x-sytely",
    JSON.stringify(data)
  );
}

function getDragData(
  event: DragEvent
): DragData | null {
  const value = event.dataTransfer.getData(
    "application/x-sytely"
  );

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as DragData;
  } catch {
    return null;
  }
}

function EditorNode({
  node,
  selectedId,
  onSelect,
  onDropNode,
  onDragStart
}: {
  node: ComponentNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDropNode: (
    event: DragEvent,
    targetId: string
  ) => void;
  onDragStart: (
    event: DragEvent,
    id: string
  ) => void;
}) {
  const selected = selectedId === node.id;

  /*
   * Render only this node's visual element here.
   * Its children are rendered below exactly once.
   */
  const visualNode: ComponentNode = {
    ...node,
    children: []
  };

  return (
    <div
      className={`editor-node ${
        selected ? "selected" : ""
      }`}
      data-sytely-id={node.id}
      draggable
      onDragStart={(event) =>
        onDragStart(event, node.id)
      }
      onClick={(event) => {
        event.stopPropagation();
        onSelect(node.id);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        event.stopPropagation();
        onDropNode(event, node.id);
      }}
    >
      <div className="editor-node-content">
        {renderNode(visualNode)}
      </div>

      {node.children.length > 0 && (
        <div className="editor-node-children">
          {node.children.map((child) => (
            <EditorNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              onDropNode={onDropNode}
              onDragStart={onDragStart}
            />
          ))}
        </div>
      )}

      {selected && (
        <div className="resize-handle resize-se" />
      )}
    </div>
  );
}

export default function EditorPage() {
  const [site, setSite] = useState<Site>(
    createInitialSite
  );

  const [currentPageId, setCurrentPageId] =
    useState("page-home");

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [device, setDevice] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");

  const [zoom, setZoom] = useState(100);

  const currentPage =
    site.pages.find(
      (page) => page.id === currentPageId
    ) ?? site.pages[0];

  const selectedNode = currentPage
    ? findNode(currentPage.components, selectedId ?? "")
    : null;

  function updateCurrentPage(
    updater: (page: SitePage) => SitePage
  ) {
    setSite((previous) => ({
      ...previous,
      pages: previous.pages.map((page) =>
        page.id === currentPage.id
          ? updater(page)
          : page
      )
    }));
  }

  function addNodeToPage(
    node: ComponentNode
  ) {
    updateCurrentPage((page) => ({
      ...page,
      components: [
        ...page.components,
        node
      ]
    }));

    setSelectedId(node.id);
  }

  function handlePanelDragStart(
    event: DragEvent,
    type: ComponentType
  ) {
    setDragData(event, {
      kind: "new-component",
      type
    });
  }

  function handleSectionDragStart(
    event: DragEvent,
    section: ComponentNode
  ) {
    setDragData(event, {
      kind: "new-section",
      node: section
    });
  }

  function handleExistingDragStart(
    event: DragEvent,
    id: string
  ) {
    setDragData(event, {
      kind: "existing",
      id
    });
  }

  function moveExistingNode(
    id: string,
    targetId?: string
  ) {
    if (id === targetId) {
      return;
    }

    const sourceNode = findNode(
      currentPage.components,
      id
    );

    if (!sourceNode) {
      return;
    }

    if (
      targetId &&
      containsNode(sourceNode, targetId)
    ) {
      return;
    }

    const removed = removeNode(
      currentPage.components,
      id
    );

    if (!removed.removed) {
      return;
    }

    let components = removed.nodes;

    if (targetId) {
      const target = findNode(
        components,
        targetId
      );

      if (target?.type === "section") {
        components = addChild(
          components,
          targetId,
          removed.removed
        );
      } else {
        const insertBefore = (
          nodes: ComponentNode[]
        ): ComponentNode[] => {
          const result: ComponentNode[] = [];

          for (const node of nodes) {
            if (node.id === targetId) {
              result.push(removed.removed!);
            }

            result.push({
              ...node,
              children: insertBefore(node.children)
            });
          }

          return result;
        };

        components = insertBefore(components);
      }
    } else {
      components = [
        ...components,
        removed.removed
      ];
    }

    updateCurrentPage((page) => ({
      ...page,
      components
    }));
  }

  function handleDropNode(
    event: DragEvent,
    targetId: string
  ) {
    event.preventDefault();

    const data = getDragData(event);

    if (!data) {
      return;
    }

    if (data.kind === "new-component") {
      const node = createNode(data.type);

      updateCurrentPage((page) => ({
        ...page,
        components:
          page.components.map((item) =>
            item.id === targetId &&
            item.type === "section"
              ? {
                  ...item,
                  children: [
                    ...item.children,
                    node
                  ]
                }
              : item
          )
      }));

      setSelectedId(node.id);
      return;
    }

    if (data.kind === "new-section") {
      const node = {
        ...data.node,
        id: newId()
      };

      updateCurrentPage((page) => ({
        ...page,
        components:
          page.components.map((item) =>
            item.id === targetId &&
            item.type === "section"
              ? {
                  ...item,
                  children: [
                    ...item.children,
                    node
                  ]
                }
              : item
          )
      }));

      setSelectedId(node.id);
      return;
    }

    if (data.kind === "existing") {
      moveExistingNode(
        data.id,
        targetId
      );
    }
  }

  function handlePageDrop(
    event: DragEvent
  ) {
    event.preventDefault();

    const data = getDragData(event);

    if (!data) {
      return;
    }

    if (data.kind === "new-component") {
      const node = createNode(data.type);

      addNodeToPage(node);
      return;
    }

    if (data.kind === "new-section") {
      const node = {
        ...data.node,
        id: newId()
      };

      addNodeToPage(node);
      return;
    }

    if (data.kind === "existing") {
      moveExistingNode(data.id);
    }
  }

  function updateSelected(
    updater: (node: ComponentNode) => ComponentNode
  ) {
    if (!selectedId) {
      return;
    }

    updateCurrentPage((page) => ({
      ...page,
      components: updateNode(
        page.components,
        selectedId,
        updater
      )
    }));
  }

  function updateProp(
    key: string,
    value: unknown
  ) {
    updateSelected((node) => ({
      ...node,
      props: {
        ...node.props,
        [key]: value
      }
    }));
  }

  function updateStyle(
    key: string,
    value: unknown
  ) {
    updateSelected((node) => ({
      ...node,
      styles: {
        ...node.styles,
        [key]: value
      }
    }));
  }

  function handleImageUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        return;
      }

      updateProp("src", reader.result);
    };

    reader.readAsDataURL(file);
  }

  function deleteSelected() {
    if (!selectedId) {
      return;
    }

    updateCurrentPage((page) => ({
      ...page,
      components: deleteNode(
        page.components,
        selectedId
      )
    }));

    setSelectedId(null);
  }

  function addPage() {
    const pageNumber =
      site.pages.length + 1;

    const page: SitePage = {
      id: newId(),
      name: `Page ${pageNumber}`,
      slug: `/page-${pageNumber}`,
      margins: {
        top: 40,
        right: 40,
        bottom: 40,
        left: 40
      },
      components: []
    };

    setSite((previous) => ({
      ...previous,
      pages: [
        ...previous.pages,
        page
      ]
    }));

    setCurrentPageId(page.id);
    setSelectedId(null);
  }

  const templates = [
    {
      name: "Hero",
      create: createHeroSection
    },
    {
      name: "Features",
      create: createFeaturesSection
    }
  ];

  return (
    <div className="editor">
      <header className="topbar">
        <div className="brand">
          Sytely
        </div>

        <input
          className="site-name"
          value={site.name}
          onChange={(event) =>
            setSite((previous) => ({
              ...previous,
              name: event.target.value
            }))
          }
        />

        <div className="device-switcher">
          {(
            ["desktop", "tablet", "mobile"] as const
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
              {item}
            </button>
          ))}
        </div>

        <div className="zoom">
          <button
            onClick={() =>
              setZoom((value) =>
                Math.max(50, value - 10)
              )
            }
          >
            −
          </button>

          <span>{zoom}%</span>

          <button
            onClick={() =>
              setZoom((value) =>
                Math.min(150, value + 10)
              )
            }
          >
            +
          </button>
        </div>

        <button className="top-button">
          Preview
        </button>

        <button className="publish-button">
          Publish
        </button>
      </header>

      <div className="editor-layout">
        <aside className="sidebar left-sidebar">
          <div className="panel-title">
            Pages
          </div>

          <div className="pages">
            {site.pages.map((page) => (
              <button
                key={page.id}
                className={
                  page.id === currentPage.id
                    ? "page-item active"
                    : "page-item"
                }
                onClick={() => {
                  setCurrentPageId(page.id);
                  setSelectedId(null);
                }}
              >
                {page.name}
              </button>
            ))}
          </div>

          <button
            className="add-page"
            onClick={addPage}
          >
            + Add page
          </button>

          <div className="panel-divider" />

          <div className="panel-title">
            Components
          </div>

          <div className="component-list">
            {(
              [
                "heading",
                "text",
                "image",
                "button"
              ] as ComponentType[]
            ).map((type) => (
              <button
                key={type}
                draggable
                className="component-item"
                onDragStart={(event) =>
                  handlePanelDragStart(
                    event,
                    type
                  )
                }
                onClick={() =>
                  addNodeToPage(
                    createNode(type)
                  )
                }
              >
                {type}
              </button>
            ))}
          </div>

          <div className="panel-title template-title">
            Sections
          </div>

          <div className="component-list">
            {templates.map((template) => (
              <button
                key={template.name}
                draggable
                className="component-item section-item"
                onDragStart={(event) =>
                  handleSectionDragStart(
                    event,
                    template.create()
                  )
                }
                onClick={() =>
                  addNodeToPage(
                    template.create()
                  )
                }
              >
                {template.name}
              </button>
            ))}
          </div>
        </aside>

        <main
          className={`workspace ${device}`}
          onClick={() =>
            setSelectedId(null)
          }
        >
          <div
            className="canvas-scale"
            style={{
              transform: `scale(${zoom / 100})`
            }}
          >
            <div
              className="page"
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect =
                  "move";
              }}
              onDrop={handlePageDrop}
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div
                className="page-content"
                style={{
                  paddingTop:
                    currentPage.margins.top,
                  paddingRight:
                    currentPage.margins.right,
                  paddingBottom:
                    currentPage.margins.bottom,
                  paddingLeft:
                    currentPage.margins.left
                }}
              >
                {currentPage.components.length ===
                0 ? (
                  <div className="empty-page">
                    <strong>
                      Drop components here
                    </strong>

                    <span>
                      Drag a component or section
                      from the left panel.
                    </span>
                  </div>
                ) : (
                  currentPage.components.map(
                    (node) => (
                      <EditorNode
                        key={node.id}
                        node={node}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onDropNode={
                          handleDropNode
                        }
                        onDragStart={
                          handleExistingDragStart
                        }
                      />
                    )
                  )
                )}
              </div>
            </div>
          </div>
        </main>

        <aside className="sidebar right-sidebar">
          <div className="panel-title">
            Inspector
          </div>

          {!selectedNode ? (
            <div className="inspector-empty">
              Select an element to edit it.
            </div>
          ) : (
            <div className="inspector">
              <div className="field">
                <label>Type</label>
                <input
                  value={selectedNode.type}
                  readOnly
                />
              </div>

              {selectedNode.type ===
                "section" && (
                <div className="field">
                  <label>Name</label>
                  <input
                    value={
                      typeof selectedNode.props
                        .name === "string"
                        ? selectedNode.props
                            .name
                        : ""
                    }
                    onChange={(event) =>
                      updateProp(
                        "name",
                        event.target.value
                      )
                    }
                  />
                </div>
              )}

              {(
                ["heading", "text", "button"] as ComponentType[]
              ).includes(
                selectedNode.type
              ) && (
                <div className="field">
                  <label>Text</label>
                  <textarea
                    value={
                      typeof selectedNode.props
                        .text === "string"
                        ? selectedNode.props
                            .text
                        : ""
                    }
                    onChange={(event) =>
                      updateProp(
                        "text",
                        event.target.value
                      )
                    }
                  />
                </div>
              )}

              {selectedNode.type ===
                "image" && (
                <>
                  <div className="field">
                    <label>Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={
                        handleImageUpload
                      }
                    />
                  </div>

                  <div className="field">
                    <label>Alt text</label>
                    <input
                      value={
                        typeof selectedNode
                          .props.alt ===
                        "string"
                          ? selectedNode.props
                              .alt
                          : ""
                      }
                      onChange={(event) =>
                        updateProp(
                          "alt",
                          event.target.value
                        )
                      }
                    />
                  </div>
                </>
              )}

              <div className="field-row">
                <div className="field">
                  <label>Width</label>
                  <input
                    value={
                      String(
                        selectedNode.styles
                          .width ?? ""
                      )
                    }
                    onChange={(event) =>
                      updateStyle(
                        "width",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="field">
                  <label>Height</label>
                  <input
                    value={
                      String(
                        selectedNode.styles
                          .height ?? ""
                      )
                    }
                    onChange={(event) =>
                      updateStyle(
                        "height",
                        event.target.value
                      )
                    }
                  />
                </div>
              </div>

              <div className="field">
                <label>Min height</label>
                <input
                  value={String(
                    selectedNode.styles
                      .minHeight ?? ""
                  )}
                  onChange={(event) =>
                    updateStyle(
                      "minHeight",
                      event.target.value
                    )
                  }
                />
              </div>

              {selectedNode.type !==
                "image" && (
                <>
                  <div className="field">
                    <label>Font</label>
                    <select
                      value={String(
                        selectedNode.styles
                          .fontFamily ??
                          "Inter"
                      )}
                      onChange={(event) =>
                        updateStyle(
                          "fontFamily",
                          event.target.value
                        )
                      }
                    >
                      <option>Inter</option>
                      <option>Arial</option>
                      <option>Georgia</option>
                      <option>Times New Roman</option>
                      <option>Verdana</option>
                    </select>
                  </div>

                  <div className="field-row">
                    <div className="field">
                      <label>
                        Font size
                      </label>
                      <input
                        value={String(
                          selectedNode
                            .styles
                            .fontSize ?? ""
                        )}
                        onChange={(event) =>
                          updateStyle(
                            "fontSize",
                            event.target.value
                          )
                        }
                      />
                    </div>

                    <div className="field">
                      <label>
                        Weight
                      </label>
                      <select
                        value={String(
                          selectedNode
                            .styles
                            .fontWeight ??
                            400
                        )}
                        onChange={(event) =>
                          updateStyle(
                            "fontWeight",
                            Number(
                              event.target
                                .value
                            )
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
                        <option value="800">
                          800
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="field">
                    <label>Text color</label>
                    <input
                      type="text"
                      value={String(
                        selectedNode.styles
                          .color ?? ""
                      )}
                      onChange={(event) =>
                        updateStyle(
                          "color",
                          event.target.value
                        )
                      }
                    />
                  </div>
                </>
              )}

              <div className="field">
                <label>Background</label>
                <input
                  value={String(
                    selectedNode.styles
                      .background ?? ""
                  )}
                  onChange={(event) =>
                    updateStyle(
                      "background",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="field">
                <label>Border radius</label>
                <input
                  value={String(
                    selectedNode.styles
                      .borderRadius ?? ""
                  )}
                  onChange={(event) =>
                    updateStyle(
                      "borderRadius",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="field">
                <label>Link to page</label>
                <select
                  value={
                    typeof selectedNode
                      .props.linkTo ===
                    "string"
                      ? selectedNode.props
                          .linkTo
                      : ""
                  }
                  onChange={(event) =>
                    updateProp(
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
                        value={page.slug}
                      >
                        {page.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <button
                className="delete-button"
                onClick={deleteSelected}
              >
                Delete
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}