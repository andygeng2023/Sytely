import {
  Fragment,
  createElement,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import type { ComponentNode } from "@sytely/types";

export type RenderDevice =
  | "desktop"
  | "tablet"
  | "mobile";

export interface RenderOptions {
  device?: RenderDevice;
  children?: ReactNode;
  renderChildren?: boolean;
}

function stringProp(
  props: Record<string, unknown>,
  key: string,
  fallback = ""
) {
  return typeof props[key] === "string"
    ? (props[key] as string)
    : fallback;
}

function numberProp(
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

function dataAttrs(node: ComponentNode) {
  return {
    "data-sytely-id": node.id,
    "data-sytely-type": node.type,
  };
}

function responsiveStyles(
  node: ComponentNode,
  device: RenderDevice
): CSSProperties {
  const source = {
    ...(node.styles ?? {}),
  } as Record<string, unknown>;

  const responsive =
    (source.responsive ?? {}) as Record<
      string,
      unknown
    >;

  delete source.responsive;

  const tablet =
    (responsive.tablet ?? {}) as Record<
      string,
      unknown
    >;

  const mobile =
    (responsive.mobile ?? {}) as Record<
      string,
      unknown
    >;

  const result = {
    ...source,
    ...(device === "tablet" ? tablet : {}),
    ...(device === "mobile"
      ? {
          ...tablet,
          ...mobile,
        }
      : {}),
  } as CSSProperties &
    Record<string, unknown>;

  if (
    device !== "desktop" &&
    typeof result.fontSize === "number"
  ) {
    result.fontSize = Math.max(
      12,
      result.fontSize *
        (device === "mobile"
          ? 0.76
          : 0.9)
    );
  }

  if (
    device !== "desktop" &&
    typeof result.gap === "number"
  ) {
    result.gap = Math.max(
      8,
      result.gap *
        (device === "mobile"
          ? 0.78
          : 0.9)
    );
  }

  if (
    typeof result.width === "number"
  ) {
    result.width = `min(${result.width}px,100%)`;
  }

  if (
    typeof result.maxWidth === "number"
  ) {
    result.maxWidth = `min(${result.maxWidth}px,100%)`;
  }

  if (
    device === "tablet" &&
    typeof result.gridTemplateColumns ===
      "string"
  ) {
    const value =
      result.gridTemplateColumns;

    if (value.includes("repeat(4")) {
      result.gridTemplateColumns =
        "repeat(2,minmax(0,1fr))";
    } else if (
      value.includes("repeat(3")
    ) {
      result.gridTemplateColumns =
        "repeat(2,minmax(0,1fr))";
    }
  }

  if (device === "mobile") {
    if (
      typeof result.gridTemplateColumns ===
        "string" &&
      result.gridTemplateColumns.includes(
        "repeat("
      )
    ) {
      result.gridTemplateColumns =
        "1fr";
    }

    if (
      result.flexDirection === "row"
    ) {
      result.flexDirection = "column";
    }
  }

  return result;
}

function childNodes(
  node: ComponentNode,
  device: RenderDevice
): ReactNode[] {
  return (node.children ?? []).map(
    (child) =>
      createElement(
        Fragment,
        { key: child.id },
        renderNode(child, {
          device,
        })
      )
  );
}

function defaultCards(
  node: ComponentNode,
  device: RenderDevice,
  kind: "features" | "pricing"
) {
  const labels =
    kind === "features"
      ? [
          "Visual editing",
          "Responsive layouts",
          "Reusable sections",
        ]
      : [
          "Starter",
          "Pro",
          "Business",
        ];

  return labels.map(
    (label, index) => {
      const child: ComponentNode = {
        id: `${node.id}-${kind}-${index}`,
        type: "card",
        props: {
          title: label,
          text:
            kind === "pricing"
              ? `$${[9, 24, 59][index]} / month`
              : "A reusable editable content block.",
        },
        styles: {
          minWidth: 0,
        },
      };

      return createElement(
        Fragment,
        {
          key: child.id,
        },
        renderNode(child, {
          device,
        })
      );
    }
  );
}

export function renderNode(
  node: ComponentNode,
  options: RenderOptions = {}
): ReactNode {
  const device =
    options.device ?? "desktop";

  const props = node.props ?? {};

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
        : childNodes(
            node,
            device
          );

  switch (node.type) {
    case "section":
      return createElement(
        "section",
        {
          ...dataAttrs(node),
          style: {
            boxSizing:
              "border-box",
            width: "100%",
            display: "flex",
            flexDirection:
              "column",
            alignItems:
              "stretch",
            justifyContent:
              "flex-start",
            gap: 24,
            padding:
              "56px 40px",
            background:
              "var(--sytely-surface)",
            color:
              "var(--sytely-text)",
            ...styles,
          },
        },
        children
      );

    case "heading":
      return createElement(
        "h2",
        {
          ...dataAttrs(node),
          style: {
            margin: 0,
            lineHeight: 1.12,
            color:
              "var(--sytely-text)",
            ...styles,
          },
        },
        stringProp(
          props,
          "text",
          "Heading"
        )
      );

    case "text":
      return createElement(
        "p",
        {
          ...dataAttrs(node),
          style: {
            margin: 0,
            lineHeight: 1.6,
            color:
              "var(--sytely-text-muted)",
            ...styles,
          },
        },
        stringProp(
          props,
          "text",
          "Text"
        )
      );

    case "button": {
      const href =
        stringProp(
          props,
          "linkTo"
        );

      const buttonStyle:
        CSSProperties = {
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
        boxSizing:
          "border-box",
        border: 0,
        borderRadius: 8,
        background:
          "var(--sytely-accent)",
        color:
          "var(--sytely-accent-text)",
        textDecoration:
          "none",
        ...styles,
      };

      return href
        ? createElement(
            "a",
            {
              ...dataAttrs(node),
              href,
              style:
                buttonStyle,
            },
            stringProp(
              props,
              "text",
              "Button"
            )
          )
        : createElement(
            "button",
            {
              ...dataAttrs(node),
              type: "button",
              style:
                buttonStyle,
            },
            stringProp(
              props,
              "text",
              "Button"
            )
          );
    }

    case "image": {
      const src =
        stringProp(
          props,
          "src"
        );

      const alt =
        stringProp(
          props,
          "alt",
          "Image"
        );

      if (!src) {
        return createElement(
          "div",
          {
            ...dataAttrs(node),
            style: {
              width: "100%",
              minHeight: 180,
              aspectRatio:
                "16 / 9",
              display: "grid",
              placeItems:
                "center",
              borderRadius: 10,
              color:
                "var(--sytely-text-muted)",
              background:
                "repeating-linear-gradient(45deg,var(--sytely-placeholder-a) 0,var(--sytely-placeholder-a) 8px,var(--sytely-placeholder-b) 8px,var(--sytely-placeholder-b) 16px)",
              ...styles,
            },
          },
          "Image"
        );
      }

      return createElement(
        "img",
        {
          ...dataAttrs(node),
          src,
          alt,
          style: {
            display: "block",
            width: "100%",
            maxWidth: "100%",
            height: "auto",
            objectFit: "cover",
            borderRadius: 10,
            ...styles,
          },
        }
      );
    }

    case "video":
      return createElement(
        "div",
        {
          ...dataAttrs(node),
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
        stringProp(
          props,
          "src"
        )
          ? createElement(
              "video",
              {
                src: stringProp(
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

      const count = Math.max(
        1,
        numberProp(
          props,
          "columns",
          3
        )
      );

      return createElement(
        "div",
        {
          ...dataAttrs(node),
          style: {
            display: "grid",
            gridTemplateColumns: `repeat(${count},minmax(0,1fr))`,
            gap: 12,
            width: "100%",
            ...styles,
          },
        },
        (
          images.length
            ? images
            : ["", "", ""]
        ).map(
          (
            src,
            index
          ) =>
            src
              ? createElement(
                  "img",
                  {
                    key: index,
                    src,
                    alt: `Gallery image ${index + 1}`,
                    style: {
                      width:
                        "100%",
                      aspectRatio:
                        "1",
                      objectFit:
                        "cover",
                      borderRadius: 8,
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
                      borderRadius: 8,
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
          ...dataAttrs(node),
          style: {
            width: "100%",
            height: 1,
            background:
              "currentColor",
            opacity: 0.15,
            ...styles,
          },
        }
      );

    case "icon":
      return createElement(
        "div",
        {
          ...dataAttrs(node),
          style: {
            fontSize: 40,
            lineHeight: 1,
            ...styles,
          },
        },
        stringProp(
          props,
          "icon",
          "✦"
        )
      );

    case "logo":
      return createElement(
        "div",
        {
          ...dataAttrs(node),
          style: {
            fontWeight: 800,
            fontSize: 22,
            ...styles,
          },
        },
        stringProp(
          props,
          "text",
          "Brand"
        )
      );

    case "menu": {
      const items =
        Array.isArray(
          props.items
        )
          ? props.items.filter(
              (
                value
              ): value is string =>
                typeof value ===
                "string"
            )
          : [
              "Home",
              "About",
              "Contact",
            ];

      return createElement(
        "nav",
        {
          ...dataAttrs(node),
          style: {
            display: "flex",
            flexWrap: "wrap",
            gap: 18,
            alignItems:
              "center",
            ...styles,
          },
        },
        items.map(
          (item) =>
            createElement(
              "a",
              {
                key: item,
                href: "#",
                style: {
                  color:
                    "inherit",
                  textDecoration:
                    "none",
                },
              },
              item
            )
        )
      );
    }

    case "social": {
      const items =
        Array.isArray(
          props.items
        )
          ? props.items.filter(
              (
                value
              ): value is string =>
                typeof value ===
                "string"
            )
          : [
              "in",
              "𝕏",
              "◎",
              "f",
            ];

      return createElement(
        "div",
        {
          ...dataAttrs(node),
          style: {
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            ...styles,
          },
        },
        items.map(
          (item) =>
            createElement(
              "span",
              {
                key: item,
                style: {
                  width: 34,
                  height: 34,
                  borderRadius:
                    "50%",
                  display: "grid",
                  placeItems:
                    "center",
                  background:
                    "var(--sytely-card)",
                  fontWeight: 700,
                },
              },
              item
            )
        )
      );
    }

    case "form":
      return createElement(
        "form",
        {
          ...dataAttrs(node),
          onSubmit: (
            event: FormEvent
          ) =>
            event.preventDefault(),
          style: {
            display: "grid",
            gap: 12,
            width: "100%",
            maxWidth: 560,
            ...styles,
          },
        },
        createElement(
          "input",
          {
            type: "text",
            placeholder: "Name",
            style: {
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
          "input",
          {
            type: "email",
            placeholder:
              "Email",
            style: {
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
          "textarea",
          {
            placeholder:
              "Message",
            rows: 4,
            style: {
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
          stringProp(
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
          ...dataAttrs(node),
          style: {
            minWidth: 0,
            padding: 24,
            borderRadius: 12,
            background:
              "var(--sytely-card)",
            display: "grid",
            gap: 10,
            ...styles,
          },
        },
        createElement(
          "strong",
          null,
          stringProp(
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
              lineHeight: 1.6,
            },
          },
          stringProp(
            props,
            "text",
            "Card description"
          )
        ),
        children
      );

    case "features":
      return createElement(
        "div",
        {
          ...dataAttrs(node),
          style: {
            display: "grid",
            gridTemplateColumns:
              "repeat(3,minmax(0,1fr))",
            gap: 16,
            width: "100%",
            ...styles,
          },
        },
        node.children?.length
          ? children
          : defaultCards(
              node,
              device,
              "features"
            )
      );

    case "pricing":
      return createElement(
        "div",
        {
          ...dataAttrs(node),
          style: {
            display: "grid",
            gridTemplateColumns:
              "repeat(3,minmax(0,1fr))",
            gap: 16,
            width: "100%",
            ...styles,
          },
        },
        node.children?.length
          ? children
          : defaultCards(
              node,
              device,
              "pricing"
            )
      );

    case "testimonial":
      return createElement(
        "blockquote",
        {
          ...dataAttrs(node),
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
        `“${stringProp(
          props,
          "text",
          "A thoughtful product makes the experience easier."
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
          stringProp(
            props,
            "author",
            "Customer"
          )
        )
      );

    case "faq":
      return createElement(
        "div",
        {
          ...dataAttrs(node),
          style: {
            display: "grid",
            gap: 8,
            width: "100%",
            ...styles,
          },
        },
        node.children?.length
          ? children
          : createElement(
              "details",
              {
                style: {
                  padding: 16,
                  borderRadius: 8,
                  background:
                    "var(--sytely-card)",
                },
              },
              createElement(
                "summary",
                {
                  style: {
                    cursor:
                      "pointer",
                    fontWeight:
                      700,
                  },
                },
                stringProp(
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
                stringProp(
                  props,
                  "answer",
                  "Edit this answer from the inspector."
                )
              )
            )
      );

    case "contact":
      return createElement(
        "div",
        {
          ...dataAttrs(node),
          style: {
            display: "grid",
            gap: 8,
            ...styles,
          },
        },
        createElement(
          "strong",
          null,
          stringProp(
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
          stringProp(
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
          stringProp(
            props,
            "phone",
            "+1 000 000 0000"
          )
        ),
        children
      );

    case "footer":
      return createElement(
        "footer",
        {
          ...dataAttrs(node),
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
        stringProp(
          props,
          "text",
          "© 2026 Your brand. All rights reserved."
        ),
        children
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
        {
          key: node.id,
        },
        renderNode(node, {
          device,
        })
      )
    )
  );
}