import {
  createElement,
  Fragment,
  type CSSProperties,
  type ReactNode,
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
  children?: ReactNode;
  renderChildren?: boolean;
}

type AnyStyle =
  Record<string, unknown>;

function getString(
  props: Record<string, unknown>,
  key: string,
  fallback = ""
) {
  return typeof props[key] === "string"
    ? (props[key] as string)
    : fallback;
}

function getNumber(
  value: unknown,
  fallback: number
) {
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
}

function data(
  node: ComponentNode
) {
  return {
    "data-sytely-id": node.id,
    "data-sytely-type": node.type,
  };
}

function responsiveStyles(
  node: ComponentNode,
  device: RenderDevice
): CSSProperties {
  const base: AnyStyle = {
    ...(node.styles ?? {}),
  };

  const responsive =
    (base.responsive ?? {}) as AnyStyle;

  delete base.responsive;

  const tablet =
    (responsive.tablet ?? {}) as AnyStyle;

  const mobile =
    (responsive.mobile ?? {}) as AnyStyle;

  const override =
    device === "tablet"
      ? tablet
      : device === "mobile"
        ? {
            ...tablet,
            ...mobile,
          }
        : {};

  const result: AnyStyle = {
    ...base,
    ...override,
  };

  if (
    typeof result.width === "number"
  ) {
    result.width =
      `min(${result.width}px,100%)`;
  }

  if (
    typeof result.maxWidth === "number"
  ) {
    result.maxWidth =
      `min(${result.maxWidth}px,100%)`;
  }

  if (
    typeof result.fontSize === "number" &&
    device !== "desktop"
  ) {
    result.fontSize = Math.max(
      10,
      result.fontSize *
        (device === "mobile"
          ? 0.72
          : 0.88)
    );
  }

  if (
    typeof result.gap === "number" &&
    device !== "desktop"
  ) {
    result.gap = Math.max(
      6,
      result.gap *
        (device === "mobile"
          ? 0.75
          : 0.9)
    );
  }

  const gridColumns =
    result.gridTemplateColumns;

  if (
    typeof gridColumns === "string"
  ) {
    if (
      device === "tablet" &&
      gridColumns.includes("repeat(3")
    ) {
      result.gridTemplateColumns =
        "repeat(2,minmax(0,1fr))";
    }

    if (
      device === "mobile" &&
      gridColumns.includes("repeat(")
    ) {
      result.gridTemplateColumns =
        "1fr";
    }
  }

  if (
    device === "mobile" &&
    result.flexDirection === "row"
  ) {
    result.flexDirection = "column";
  }

  return result as CSSProperties;
}

function renderChildren(
  children: ComponentNode[] | undefined,
  device: RenderDevice
): ReactNode {
  return (children ?? []).map(
    (child) =>
      createElement(
        Fragment,
        {
          key: child.id,
        },
        renderNode(child, {
          device,
        })
      )
  );
}

function renderCompositeChildren(
  node: ComponentNode,
  device: RenderDevice,
  fallback: ComponentNode[]
): ReactNode {
  const children =
    node.children?.length
      ? node.children
      : fallback;

  return children.map(
    (child) =>
      createElement(
        Fragment,
        {
          key: child.id,
        },
        renderNode(child, {
          device,
        })
      )
  );
}

export function renderNode(
  node: ComponentNode,
  options: RenderOptions = {}
): ReactNode {
  const device =
    options.device ?? "desktop";

  const props =
    node.props ?? {};

  const styles =
    responsiveStyles(
      node,
      device
    );

  const children =
    options.children !== undefined
      ? options.children
      : options.renderChildren === false
        ? null
        : renderChildren(
            node.children,
            device
          );

  const linked = (
    content: ReactNode
  ) =>
    getString(props, "linkTo")
      ? createElement(
          "a",
          {
            href: getString(
              props,
              "linkTo"
            ),
            style: {
              color: "inherit",
              textDecoration:
                "none",
            },
          },
          content
        )
      : content;

  switch (node.type) {
    case "section":
      return createElement(
        "section",
        {
          ...data(node),
          style: {
            boxSizing: "border-box",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent:
              "flex-start",
            alignItems: "stretch",
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
      return linked(
        createElement(
          "h2",
          {
            ...data(node),
            style: {
              margin: 0,
              color:
                "var(--sytely-text)",
              lineHeight: 1.1,
              ...styles,
            },
          },
          getString(
            props,
            "text",
            "Heading"
          )
        )
      );

    case "text":
      return linked(
        createElement(
          "p",
          {
            ...data(node),
            style: {
              margin: 0,
              lineHeight: 1.6,
              color:
                "var(--sytely-text-muted)",
              ...styles,
            },
          },
          getString(
            props,
            "text",
            "Text"
          )
        )
      );

    case "button":
      return createElement(
        "a",
        {
          ...data(node),
          href: getString(
            props,
            "linkTo",
            "#"
          ),
          style: {
            display:
              "inline-flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            width: "fit-content",
            minHeight: 44,
            padding:
              "12px 20px",
            border: 0,
            borderRadius: 9,
            background:
              "var(--sytely-accent)",
            color:
              "var(--sytely-accent-text)",
            textDecoration:
              "none",
            boxSizing:
              "border-box",
            ...styles,
          },
        },
        getString(
          props,
          "text",
          "Button"
        )
      );

    case "image": {
      const src =
        getString(
          props,
          "src"
        );

      if (!src) {
        return createElement(
          "div",
          {
            ...data(node),
            style: {
              width: "100%",
              minHeight: 200,
              display: "grid",
              placeItems:
                "center",
              borderRadius: 12,
              background:
                "var(--sytely-placeholder)",
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
          ...data(node),
          src,
          alt: getString(
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

    case "video":
      return createElement(
        "div",
        {
          ...data(node),
          style: {
            width: "100%",
            aspectRatio:
              "16 / 9",
            overflow:
              "hidden",
            borderRadius: 12,
            background:
              "var(--sytely-card)",
            display: "grid",
            placeItems:
              "center",
            ...styles,
          },
        },
        getString(props, "src")
          ? createElement(
              "video",
              {
                src: getString(
                  props,
                  "src"
                ),
                controls: true,
                style: {
                  width: "100%",
                  height: "100%",
                },
              }
            )
          : "Video"
      );

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

      const list =
        images.length
          ? images
          : ["", "", ""];

      const columns =
        Math.max(
          1,
          Math.min(
            6,
            getNumber(
              props.columns,
              3
            )
          )
        );

      return createElement(
        "div",
        {
          ...data(node),
          style: {
            display: "grid",
            gridTemplateColumns:
              `repeat(${columns},minmax(0,1fr))`,
            gap: 12,
            width: "100%",
            ...styles,
          },
        },
        list.map(
          (src, index) =>
            src
              ? createElement(
                  "img",
                  {
                    key: index,
                    src,
                    alt:
                      `Gallery image ${index + 1}`,
                    style: {
                      width:
                        "100%",
                      aspectRatio:
                        "1",
                      objectFit:
                        "cover",
                      borderRadius: 9,
                    },
                  }
                )
              : createElement(
                  "div",
                  {
                    key: index,
                    style: {
                      aspectRatio:
                        "1",
                      borderRadius: 9,
                      background:
                        "var(--sytely-card)",
                    },
                  }
                )
        )
      );
    }

    case "divider":
      return createElement(
        "div",
        {
          ...data(node),
          style: {
            width: "100%",
            height: 1,
            background:
              "currentColor",
            opacity: 0.16,
            ...styles,
          },
        }
      );

    case "icon":
      return createElement(
        "div",
        {
          ...data(node),
          style: {
            fontSize: 40,
            lineHeight: 1,
            ...styles,
          },
        },
        getString(
          props,
          "icon",
          "✦"
        )
      );

    case "logo":
      return createElement(
        "div",
        {
          ...data(node),
          style: {
            fontSize: 22,
            fontWeight: 750,
            ...styles,
          },
        },
        getString(
          props,
          "text",
          "Logo"
        )
      );

    case "menu":
      return createElement(
        "nav",
        {
          ...data(node),
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
          (item, index) =>
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
              String(item)
            )
        )
      );

    case "social":
      return createElement(
        "div",
        {
          ...data(node),
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
          (item, index) =>
            createElement(
              "a",
              {
                key: index,
                href: "#",
                style: {
                  padding:
                    "8px 11px",
                  borderRadius: 8,
                  background:
                    "var(--sytely-card)",
                  color:
                    "inherit",
                  textDecoration:
                    "none",
                },
              },
              String(item)
            )
        )
      );

    case "form":
      return createElement(
        "form",
        {
          ...data(node),
          onSubmit: (
            event: any
          ) => event.preventDefault(),
          style: {
            display: "grid",
            gap: 12,
            maxWidth: 560,
            ...styles,
          },
        },
        createElement(
          "h3",
          { style: { margin: 0 } },
          getString(
            props,
            "title",
            "Contact us"
          )
        ),
        ["Name", "Email"].map(
          (label) =>
            createElement(
              "input",
              {
                key: label,
                type:
                  label === "Email"
                    ? "email"
                    : "text",
                placeholder:
                  label,
                style: {
                  width: "100%",
                  boxSizing:
                    "border-box",
                  padding:
                    "12px 14px",
                  borderRadius: 8,
                  border:
                    "1px solid color-mix(in srgb,var(--sytely-text) 15%,transparent)",
                  background:
                    "var(--sytely-page)",
                  color:
                    "inherit",
                },
              }
            )
        ),
        createElement(
          "textarea",
          {
            placeholder:
              "Message",
            rows: 4,
            style: {
              width: "100%",
              boxSizing:
                "border-box",
              padding:
                "12px 14px",
              borderRadius: 8,
              border:
                "1px solid color-mix(in srgb,var(--sytely-text) 15%,transparent)",
              background:
                "var(--sytely-page)",
              color:
                "inherit",
            },
          }
        ),
        createElement(
          "button",
          {
            type: "submit",
            style: {
              width:
                "fit-content",
              padding:
                "12px 18px",
              border: 0,
              borderRadius: 8,
              background:
                "var(--sytely-accent)",
              color:
                "var(--sytely-accent-text)",
            },
          },
          getString(
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
          ...data(node),
          style: {
            padding: 24,
            borderRadius: 14,
            background:
              "var(--sytely-card)",
            display: "grid",
            gap: 10,
            ...styles,
          },
        },
        node.children?.length
          ? children
          : createElement(
              Fragment,
              null,
              createElement(
                "strong",
                null,
                getString(
                  props,
                  "title",
                  "Card title"
                )
              ),
              createElement(
                "p",
                {
                  style: {
                    margin: 0,
                    color:
                      "var(--sytely-text-muted)",
                    lineHeight:
                      1.6,
                  },
                },
                getString(
                  props,
                  "text",
                  "Card description"
                )
              )
            )
      );

    case "features":
      return createElement(
        "div",
        {
          ...data(node),
          style: {
            display: "grid",
            gridTemplateColumns:
              `repeat(${Math.max(
                1,
                Math.min(
                  4,
                  getNumber(
                    props.columns,
                    3
                  )
                )
              )},minmax(0,1fr))`,
            gap: 16,
            width: "100%",
            ...styles,
          },
        },
        renderCompositeChildren(
          node,
          device,
          [
            "Visual editing",
            "Responsive layouts",
            "Reusable sections",
          ].map(
            (title, index) => ({
              id:
                `${node.id}-feature-${index}`,
              type: "card",
              props: {
                title,
                text:
                  "A reusable feature block.",
              },
              styles: {},
            })
          )
        )
      );

    case "pricing":
      return createElement(
        "div",
        {
          ...data(node),
          style: {
            display: "grid",
            gridTemplateColumns:
              `repeat(${Math.max(
                1,
                Math.min(
                  4,
                  getNumber(
                    props.columns,
                    3
                  )
                )
              )},minmax(0,1fr))`,
            gap: 16,
            width: "100%",
            ...styles,
          },
        },
        renderCompositeChildren(
          node,
          device,
          [
            ["Starter", "$9"],
            ["Pro", "$24"],
            ["Business", "$59"],
          ].map(
            ([title, price], index) => ({
              id:
                `${node.id}-plan-${index}`,
              type: "card",
              props: {
                title,
                text: price,
              },
              styles: {},
            })
          )
        )
      );

    case "testimonial":
      return createElement(
        "blockquote",
        {
          ...data(node),
          style: {
            margin: 0,
            padding: 28,
            borderRadius: 14,
            background:
              "var(--sytely-card)",
            fontSize: 20,
            lineHeight: 1.5,
            ...styles,
          },
        },
        `“${getString(
          props,
          "quote",
          getString(
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
          getString(
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
          ...data(node),
          style: {
            padding: 18,
            borderRadius: 10,
            background:
              "var(--sytely-card)",
            ...styles,
          },
        },
        createElement(
          "summary",
          {
            style: {
              cursor: "pointer",
              fontWeight: 700,
            },
          },
          getString(
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
          getString(
            props,
            "answer",
            "Edit this answer."
          )
        )
      );

    case "contact":
      return createElement(
        "div",
        {
          ...data(node),
          style: {
            display: "grid",
            gap: 7,
            ...styles,
          },
        },
        createElement(
          "strong",
          null,
          getString(
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
          getString(
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
          getString(
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
          ...data(node),
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
        node.children?.length
          ? children
          : getString(
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
}: {
  nodes: ComponentNode[];
  device?: RenderDevice;
}) {
  return createElement(
    Fragment,
    null,
    nodes.map((node) =>
      createElement(
        Fragment,
        { key: node.id },
        renderNode(node, {
          device,
        })
      )
    )
  );
}