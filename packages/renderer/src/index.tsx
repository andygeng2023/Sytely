import {
  Fragment,
  createElement,
  type CSSProperties,
  type ReactNode,
  type DragEventHandler,
  type MouseEvent as ReactMouseEvent,
  type DragEvent as ReactDragEvent,
  type FormEvent,
} from "react";

import type {
  ComponentNode,
} from "@sytely/types";

export type RenderDevice =
  | "desktop"
  | "tablet"
  | "mobile";

export interface RenderOptions {
  device?: RenderDevice;
  editable?: boolean;
  selectedIds?: string[];
  onNodeClick?: (
    id: string,
    event: ReactMouseEvent
  ) => void;
  onNodeDragStart?: DragEventHandler<HTMLElement>;
}

function stringValue(
  props: Record<string, unknown>,
  key: string,
  fallback = ""
) {
  const value = props[key];

  return typeof value === "string"
    ? value
    : fallback;
}

function numberValue(
  props: Record<string, unknown>,
  key: string,
  fallback: number
) {
  const value = props[key];

  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : fallback;
}

function responsiveStyles(
  node: ComponentNode,
  device: RenderDevice
): CSSProperties {
  const source = {
    ...(node.styles ?? {}),
  } as Record<string, unknown>;

  const responsive = source.responsive;

  delete source.responsive;

  const tablet =
    responsive &&
    typeof responsive === "object"
      ? ((responsive as Record<string, unknown>)
          .tablet as
          | Record<string, unknown>
          | undefined) ?? {}
      : {};

  const mobile =
    responsive &&
    typeof responsive === "object"
      ? ((responsive as Record<string, unknown>)
          .mobile as
          | Record<string, unknown>
          | undefined) ?? {}
      : {};

  const merged = {
    ...source,
    ...(device === "tablet"
      ? tablet
      : device === "mobile"
        ? {
            ...tablet,
            ...mobile,
          }
        : {}),
  } as CSSProperties;

  if (
    typeof merged.width ===
    "number"
  ) {
    merged.width = `min(${merged.width}px, 100%)`;
  }

  if (
    typeof merged.maxWidth ===
    "number"
  ) {
    merged.maxWidth = `min(${merged.maxWidth}px, 100%)`;
  }

  if (
    device !== "desktop" &&
    typeof merged.fontSize ===
      "number"
  ) {
    merged.fontSize = Math.max(
      12,
      merged.fontSize *
        (device === "mobile"
          ? 0.76
          : 0.9)
    );
  }

  if (
    device !== "desktop" &&
    typeof merged.gap ===
      "number"
  ) {
    merged.gap = Math.max(
      6,
      merged.gap *
        (device === "mobile"
          ? 0.75
          : 0.9)
    );
  }

  const columns =
    typeof merged.gridTemplateColumns ===
    "string"
      ? merged.gridTemplateColumns
      : "";

  if (
    device === "tablet" &&
    columns.includes("repeat(3")
  ) {
    merged.gridTemplateColumns =
      "repeat(2,minmax(0,1fr))";
  }

  if (
    device === "mobile" &&
    columns.includes("repeat(")
  ) {
    merged.gridTemplateColumns =
      "1fr";
  }

  if (
    device === "mobile" &&
    merged.flexDirection === "row"
  ) {
    merged.flexDirection = "column";
  }

  return merged;
}

function attrs(
  node: ComponentNode,
  options: RenderOptions
): Record<string, unknown> {
  const selected =
    options.selectedIds?.includes(
      node.id
    ) ?? false;

  const result: Record<
    string,
    unknown
  > = {
    "data-sytely-id": node.id,
    "data-sytely-type": node.type,
  };

  if (options.editable) {
    result[
      "data-sytely-editable"
    ] = "true";

    result[
      "aria-selected"
    ] = selected;

    result.onClick = (
      event: ReactMouseEvent
    ) => {
      options.onNodeClick?.(
        node.id,
        event
      );
    };

    result.onDragStart = (
      event: ReactDragEvent<HTMLElement>
    ) => {
      event.stopPropagation();
      options.onNodeDragStart?.(
        event
      );
    };

    result.draggable = true;
  }

  return result;
}

function childNodes(
  node: ComponentNode,
  options: RenderOptions
) {
  return (
    node.children ?? []
  ).map((child) =>
    createElement(
      Fragment,
      {
        key: child.id,
      },
      renderNode(child, options)
    )
  );
}

function link(
  node: ComponentNode,
  content: ReactNode
) {
  const href = stringValue(
    node.props,
    "linkTo"
  );

  if (!href) {
    return content;
  }

  return createElement(
    "a",
    {
      href,
      style: {
        color: "inherit",
        textDecoration:
          "none",
      },
    },
    content
  );
}

function cardFromChild(
  child: ComponentNode,
  options: RenderOptions
) {
  return renderNode(
    child,
    options
  );
}

const buttonBase:
  CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 44,
  padding: "12px 20px",
  border: 0,
  borderRadius: 8,
  background:
    "var(--sytely-accent)",
  color:
    "var(--sytely-accent-text)",
  cursor: "pointer",
  boxSizing: "border-box",
};

const inputStyle:
  CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  borderRadius: 8,
  border:
    "1px solid color-mix(in srgb,var(--sytely-text) 15%,transparent)",
  background:
    "var(--sytely-page)",
  color: "inherit",
};

export function renderNode(
  node: ComponentNode,
  options: RenderOptions = {}
): ReactNode {
  const device =
    options.device ??
    "desktop";

  const props =
    node.props ?? {};

  const styles =
    responsiveStyles(
      node,
      device
    );

  const common =
    attrs(node, options);

  const children =
    childNodes(
      node,
      options
    );

  switch (node.type) {
    case "section":
      return createElement(
        "section",
        {
          ...common,
          style: {
            boxSizing:
              "border-box",
            width: "100%",
            display: "grid",
            gridTemplateColumns:
              "1fr",
            gap: 24,
            padding:
              "56px 40px",
            color:
              "var(--sytely-text)",
            background:
              "var(--sytely-surface)",
            ...styles,
          },
        },
        children
      );

    case "heading":
      return link(
        node,
        createElement(
          "h2",
          {
            ...common,
            style: {
              margin: 0,
              lineHeight: 1.12,
              color:
                "var(--sytely-text)",
              ...styles,
            },
          },
          stringValue(
            props,
            "text",
            "Heading"
          )
        )
      );

    case "text":
      return link(
        node,
        createElement(
          "p",
          {
            ...common,
            style: {
              margin: 0,
              lineHeight: 1.6,
              color:
                "var(--sytely-text-muted)",
              ...styles,
            },
          },
          stringValue(
            props,
            "text",
            "Text"
          )
        )
      );

    case "button": {
      const text =
        stringValue(
          props,
          "text",
          "Button"
        );

      const href =
        stringValue(
          props,
          "linkTo"
        );

      const style: CSSProperties = {
        ...buttonBase,
        ...styles,
        textDecoration:
          "none",
      };

      if (href) {
        return createElement(
          "a",
          {
            ...common,
            href,
            style,
          },
          text
        );
      }

      return createElement(
        "button",
        {
          ...common,
          type: "button",
          style,
        },
        text
      );
    }

    case "image": {
      const src =
        stringValue(
          props,
          "src"
        );

      if (!src) {
        return createElement(
          "div",
          {
            ...common,
            style: {
              minHeight: 180,
              width: "100%",
              aspectRatio:
                "16 / 9",
              display: "grid",
              placeItems:
                "center",
              borderRadius: 12,
              background:
                "repeating-linear-gradient(45deg,var(--sytely-placeholder-a) 0 8px,var(--sytely-placeholder-b) 8px 16px)",
              color:
                "var(--sytely-text-muted)",
              ...styles,
            },
          },
          "Image"
        );
      }

      return createElement(
        "img",
        {
          ...common,
          src,
          alt: stringValue(
            props,
            "alt",
            "Image"
          ),
          style: {
            display: "block",
            width: "100%",
            maxWidth: "100%",
            height: "auto",
            objectFit: "cover",
            borderRadius: 12,
            ...styles,
          },
        }
      );
    }

    case "video": {
      const src =
        stringValue(
          props,
          "src"
        );

      return createElement(
        "div",
        {
          ...common,
          style: {
            width: "100%",
            aspectRatio:
              "16 / 9",
            borderRadius: 12,
            overflow: "hidden",
            background: "#111",
            ...styles,
          },
        },
        src
          ? createElement(
              "video",
              {
                src,
                controls: true,
                style: {
                  width: "100%",
                  height: "100%",
                  display: "block",
                },
              }
            )
          : "Video"
      );
    }

    case "gallery": {
      const images =
        Array.isArray(
          props.images
        )
          ? props.images.filter(
              (
                value
              ): value is string =>
                typeof value ===
                "string"
            )
          : [];

      const columns =
        Math.max(
          1,
          Math.min(
            6,
            numberValue(
              props,
              "columns",
              3
            )
          )
        );

      return createElement(
        "div",
        {
          ...common,
          style: {
            display: "grid",
            gridTemplateColumns: `repeat(${columns},minmax(0,1fr))`,
            gap: 14,
            width: "100%",
            ...styles,
          },
        },
        images.length
          ? images.map(
              (
                src,
                index
              ) =>
                createElement(
                  "img",
                  {
                    key: `${src}-${index}`,
                    src,
                    alt: `Gallery image ${
                      index + 1
                    }`,
                    style: {
                      width: "100%",
                      aspectRatio:
                        "4 / 3",
                      objectFit:
                        "cover",
                      borderRadius: 10,
                      display:
                        "block",
                    },
                  }
                )
            )
          : createElement(
              "div",
              {
                style: {
                  gridColumn:
                    "1 / -1",
                  minHeight: 150,
                  display: "grid",
                  placeItems:
                    "center",
                  border:
                    "1px dashed #bbb",
                  borderRadius: 10,
                },
              },
              "Gallery"
            )
      );
    }

    case "divider":
      return createElement(
        "hr",
        {
          ...common,
          style: {
            width: "100%",
            border: 0,
            borderTop:
              "1px solid color-mix(in srgb,var(--sytely-text) 15%,transparent)",
            margin: 0,
            ...styles,
          },
        }
      );

    case "icon":
      return createElement(
        "span",
        {
          ...common,
          style: {
            display:
              "inline-block",
            ...styles,
          },
        },
        stringValue(
          props,
          "icon",
          "✦"
        )
      );

    case "logo":
      return createElement(
        "strong",
        {
          ...common,
          style: {
            display:
              "inline-block",
            ...styles,
          },
        },
        stringValue(
          props,
          "text",
          "Sytely"
        )
      );

    case "menu":
      return createElement(
        "nav",
        {
          ...common,
          style: {
            display: "flex",
            flexWrap: "wrap",
            gap: 20,
            ...styles,
          },
        },
        (
          Array.isArray(
            props.items
          )
            ? props.items
            : [
                "Home",
                "About",
                "Contact",
              ]
        ).map(
          (
            item,
            index
          ) =>
            createElement(
              "a",
              {
                key: index,
                href: "#",
                style: {
                  color:
                    "inherit",
                  textDecoration:
                    "none",
                },
              },
              typeof item ===
                "string"
                ? item
                : `Link ${
                    index + 1
                  }`
            )
        )
      );

    case "social":
      return createElement(
        "div",
        {
          ...common,
          style: {
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            ...styles,
          },
        },
        (
          Array.isArray(
            props.items
          )
            ? props.items
            : [
                "Instagram",
                "X",
                "LinkedIn",
              ]
        ).map(
          (
            item,
            index
          ) =>
            createElement(
              "a",
              {
                key: index,
                href: "#",
                style: {
                  padding:
                    "7px 10px",
                  borderRadius: 7,
                  background:
                    "var(--sytely-card)",
                  color:
                    "inherit",
                  textDecoration:
                    "none",
                },
              },
              typeof item ===
                "string"
                ? item
                : `Social ${
                    index + 1
                  }`
            )
        )
      );

    case "form":
      return createElement(
        "form",
        {
          ...common,
          onSubmit: (
            event: FormEvent
          ) =>
            event.preventDefault(),
          style: {
            display: "grid",
            gap: 12,
            maxWidth: 620,
            ...styles,
          },
        },
        createElement(
          "strong",
          null,
          stringValue(
            props,
            "title",
            "Contact us"
          )
        ),
        [
          "Name",
          "Email",
        ].map(
          (label) =>
            createElement(
              "input",
              {
                key: label,
                type:
                  label ===
                  "Email"
                    ? "email"
                    : "text",
                placeholder:
                  label,
                style:
                  inputStyle,
              }
            )
        ),
        createElement(
          "textarea",
          {
            placeholder:
              "Message",
            rows: 5,
            style:
              inputStyle,
          }
        ),
        createElement(
          "button",
          {
            type: "submit",
            style: {
              ...buttonBase,
              width:
                "fit-content",
            },
          },
          stringValue(
            props,
            "submitLabel",
            "Send message"
          )
        )
      );

    case "card":
      return createElement(
        "article",
        {
          ...common,
          style: {
            padding: 24,
            borderRadius: 14,
            background:
              "var(--sytely-card)",
            display: "grid",
            gap: 9,
            ...styles,
          },
        },
        children.length
          ? children
          : [
              createElement(
                "strong",
                {
                  key: "title",
                },
                stringValue(
                  props,
                  "title",
                  "Card title"
                )
              ),
              createElement(
                "p",
                {
                  key: "text",
                  style: {
                    margin: 0,
                    color:
                      "var(--sytely-text-muted)",
                    lineHeight: 1.6,
                  },
                },
                stringValue(
                  props,
                  "text",
                  "Card description"
                )
              ),
            ]
      );

    case "features":
      return createElement(
        "div",
        {
          ...common,
          style: {
            display: "grid",
            gridTemplateColumns: `repeat(${Math.max(
              1,
              Math.min(
                6,
                numberValue(
                  props,
                  "columns",
                  3
                )
              )
            )},minmax(0,1fr))`,
            gap: 16,
            width: "100%",
            ...styles,
          },
        },
        children.length
          ? children.map(
              (child) =>
                cardFromChild(
                  child,
                  options
                )
            )
          : [
              "Visual editing",
              "Responsive layouts",
              "Reusable sections",
            ].map((title) =>
              createElement(
                "article",
                {
                  key: title,
                  style: {
                    padding: 22,
                    borderRadius: 12,
                    background:
                      "var(--sytely-card)",
                  },
                },
                createElement(
                  "strong",
                  null,
                  title
                ),
                createElement(
                  "p",
                  {
                    style: {
                      color:
                        "var(--sytely-text-muted)",
                    },
                  },
                  "A reusable feature block."
                )
              )
            )
      );

    case "pricing":
      return createElement(
        "div",
        {
          ...common,
          style: {
            display: "grid",
            gridTemplateColumns: `repeat(${Math.max(
              1,
              Math.min(
                6,
                numberValue(
                  props,
                  "columns",
                  3
                )
              )
            )},minmax(0,1fr))`,
            gap: 16,
            width: "100%",
            ...styles,
          },
        },
        children.length
          ? children.map(
              (child) =>
                cardFromChild(
                  child,
                  options
                )
            )
          : [
              "Starter",
              "Pro",
              "Business",
            ].map(
              (
                title,
                index
              ) =>
                createElement(
                  "article",
                  {
                    key: title,
                    style: {
                      padding: 24,
                      borderRadius: 12,
                      background:
                        "var(--sytely-card)",
                    },
                  },
                  createElement(
                    "strong",
                    null,
                    title
                  ),
                  createElement(
                    "div",
                    {
                      style: {
                        fontSize: 32,
                        fontWeight: 800,
                        margin:
                          "14px 0",
                      },
                    },
                    `$${[
                      9,
                      24,
                      59,
                    ][index]}`
                  ),
                  createElement(
                    "p",
                    {
                      style: {
                        color:
                          "var(--sytely-text-muted)",
                      },
                    },
                    "Flexible plan for your needs."
                  )
                )
            )
      );

    case "testimonial":
      return createElement(
        "blockquote",
        {
          ...common,
          style: {
            margin: 0,
            padding: 28,
            borderRadius: 12,
            background:
              "var(--sytely-card)",
            fontSize: 20,
            lineHeight: 1.5,
            ...styles,
          },
        },
        `“${stringValue(
          props,
          "quote",
          stringValue(
            props,
            "text",
            "A thoughtful product makes the whole experience easier."
          )
        )}”`,
        createElement(
          "footer",
          {
            style: {
              marginTop: 14,
              fontSize: 13,
              color:
                "var(--sytely-text-muted)",
            },
          },
          stringValue(
            props,
            "author",
            "Customer"
          )
        )
      );

    case "faq":
      return createElement(
        "details",
        {
          ...common,
          style: {
            padding: 17,
            borderRadius: 9,
            background:
              "var(--sytely-card)",
            ...styles,
          },
        },
        createElement(
          "summary",
          {
            style: {
              cursor:
                "pointer",
              fontWeight: 700,
            },
          },
          stringValue(
            props,
            "question",
            "Frequently asked question"
          )
        ),
        createElement(
          "p",
          {
            style: {
              color:
                "var(--sytely-text-muted)",
            },
          },
          stringValue(
            props,
            "answer",
            "Edit this answer in the inspector."
          )
        )
      );

    case "contact":
      return createElement(
        "div",
        {
          ...common,
          style: {
            display: "grid",
            gap: 8,
            ...styles,
          },
        },
        createElement(
          "strong",
          null,
          stringValue(
            props,
            "title",
            "Contact"
          )
        ),
        createElement(
          "span",
          {
            style: {
              color:
                "var(--sytely-text-muted)",
            },
          },
          stringValue(
            props,
            "email",
            "hello@example.com"
          )
        ),
        createElement(
          "span",
          {
            style: {
              color:
                "var(--sytely-text-muted)",
            },
          },
          stringValue(
            props,
            "phone",
            "+1 000 000 0000"
          )
        )
      );

    case "footer":
      return createElement(
        "footer",
        {
          ...common,
          style: {
            width: "100%",
            padding: 28,
            background:
              "var(--sytely-card)",
            color:
              "var(--sytely-text-muted)",
            ...styles,
          },
        },
        stringValue(
          props,
          "text",
          "© 2026 Your brand. All rights reserved."
        )
      );

    default:
      return null;
  }
}

export function SytelyRenderer({
  nodes,
  device = "desktop",
  editable = false,
  selectedIds,
  onNodeClick,
  onNodeDragStart,
}: {
  nodes: ComponentNode[];
  device?: RenderDevice;
  editable?: boolean;
  selectedIds?: string[];
  onNodeClick?: (
    id: string,
    event: ReactMouseEvent
  ) => void;
  onNodeDragStart?: DragEventHandler<HTMLElement>;
}) {
  const options: RenderOptions = {
    device,
    editable,
    selectedIds,
    onNodeClick,
    onNodeDragStart,
  };

  return createElement(
    Fragment,
    null,
    nodes.map((node) =>
      createElement(
        Fragment,
        {
          key: node.id,
        },
        renderNode(
          node,
          options
        )
      )
    )
  );
}