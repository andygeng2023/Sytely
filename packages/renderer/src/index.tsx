import {
  Fragment,
  createElement,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { ComponentNode } from "@sytely/types";

export type RenderDevice =
  | "desktop"
  | "tablet"
  | "mobile";

export interface RenderOptions {
  children?: ReactNode;
  renderChildren?: boolean;
  device?: RenderDevice;
}

function stringProp(
  props: Record<string, unknown>,
  key: string,
  fallback = ""
): string {
  return typeof props[key] ===
    "string"
    ? props[key] as string
    : fallback;
}

function numberProp(
  props: Record<string, unknown>,
  key: string,
  fallback: number
): number {
  const value = props[key];

  return typeof value ===
    "number" &&
    Number.isFinite(value)
    ? value
    : fallback;
}

function responsiveStyles(
  node: ComponentNode,
  device: RenderDevice
): CSSProperties {
  const raw = {
    ...(node.styles ?? {}),
  } as Record<string, unknown>;

  const responsive =
    raw.responsive as
      | Record<
          string,
          unknown
        >
      | undefined;

  delete raw.responsive;

  const tablet =
    (responsive?.tablet as
      | Record<
          string,
          unknown
        >
      | undefined) ?? {};

  const mobile =
    (responsive?.mobile as
      | Record<
          string,
          unknown
        >
      | undefined) ?? {};

  const override =
    device === "mobile"
      ? {
          ...tablet,
          ...mobile,
        }
      : device === "tablet"
      ? tablet
      : {};

  const result = {
    ...raw,
    ...override,
  } as CSSProperties;

  if (
    device !== "desktop" &&
    typeof result.fontSize ===
      "number"
  ) {
    result.fontSize =
      Math.max(
        12,
        result.fontSize *
          (device === "mobile"
            ? 0.72
            : 0.88)
      );
  }

  if (
    device !== "desktop" &&
    typeof result.gap ===
      "number"
  ) {
    result.gap =
      Math.max(
        8,
        result.gap *
          (device === "mobile"
            ? 0.75
            : 0.9)
      );
  }

  if (
    typeof result.width ===
    "number"
  ) {
    result.width = `min(${result.width}px,100%)`;
  }

  if (
    typeof result.maxWidth ===
    "number"
  ) {
    result.maxWidth = `min(${result.maxWidth}px,100%)`;
  }

  if (
    device === "tablet" &&
    typeof result.gridTemplateColumns ===
      "string"
  ) {
    const columns =
      result.gridTemplateColumns;

    if (
      columns.includes(
        "repeat(4"
      ) ||
      columns.includes(
        "repeat(3"
      )
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
      result.flexDirection ===
      "row"
    ) {
      result.flexDirection =
        "column";
    }
  }

  return result;
}

function dataAttrs(
  node: ComponentNode
) {
  return {
    "data-sytely-id":
      node.id,
    "data-sytely-type":
      node.type,
  };
}

function renderChildren(
  children: ComponentNode[] | undefined,
  device: RenderDevice
): ReactNode {
  return (children ?? []).map(
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

function withLink(
  node: ComponentNode,
  content: ReactNode
): ReactNode {
  const href =
    stringProp(
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

function responsiveGrid(
  columns: number,
  device: RenderDevice
): CSSProperties {
  let count = Math.max(
    1,
    Math.round(columns)
  );

  if (device === "tablet") {
    count = Math.min(
      count,
      2
    );
  }

  if (device === "mobile") {
    count = 1;
  }

  return {
    display: "grid",
    gridTemplateColumns: `repeat(${count},minmax(0,1fr))`,
  };
}

function renderCardChildren(
  node: ComponentNode,
  device: RenderDevice
): ReactNode {
  if (
    node.children &&
    node.children.length > 0
  ) {
    return renderChildren(
      node.children,
      device
    );
  }

  return null;
}

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

  const children =
    options.children !==
    undefined
      ? options.children
      : options.renderChildren ===
          false
      ? null
      : renderChildren(
          node.children,
          device
        );

  switch (node.type) {
    case "section": {
      const sectionStyles: CSSProperties =
        {
          boxSizing:
            "border-box",
          width: "100%",
          display: "grid",
          gridTemplateColumns:
            "1fr",
          gap: 24,
          paddingTop: 56,
          paddingRight: 40,
          paddingBottom: 56,
          paddingLeft: 40,
          color:
            "var(--sytely-text)",
          background:
            "var(--sytely-surface)",
          ...styles,
        };

      if (
        device === "tablet"
      ) {
        sectionStyles.paddingTop =
          Math.min(
            numberValue(
              sectionStyles.paddingTop,
              56
            ),
            48
          );

        sectionStyles.paddingBottom =
          Math.min(
            numberValue(
              sectionStyles.paddingBottom,
              56
            ),
            48
          );

        sectionStyles.paddingLeft =
          Math.min(
            numberValue(
              sectionStyles.paddingLeft,
              40
            ),
            32
          );

        sectionStyles.paddingRight =
          Math.min(
            numberValue(
              sectionStyles.paddingRight,
              40
            ),
            32
          );
      }

      if (
        device === "mobile"
      ) {
        sectionStyles.paddingTop =
          Math.min(
            numberValue(
              sectionStyles.paddingTop,
              56
            ),
            32
          );

        sectionStyles.paddingBottom =
          Math.min(
            numberValue(
              sectionStyles.paddingBottom,
              56
            ),
            32
          );

        sectionStyles.paddingLeft =
          Math.min(
            numberValue(
              sectionStyles.paddingLeft,
              40
            ),
            20
          );

        sectionStyles.paddingRight =
          Math.min(
            numberValue(
              sectionStyles.paddingRight,
              40
            ),
            20
          );
      }

      return createElement(
        "section",
        {
          ...dataAttrs(node),
          style:
            sectionStyles,
        },
        children
      );
    }

    case "heading":
      return withLink(
        node,
        createElement(
          "h2",
          {
            ...dataAttrs(node),
            style: {
              margin: 0,
              color:
                "var(--sytely-text)",
              lineHeight: 1.12,
              ...styles,
            },
          },
          stringProp(
            props,
            "text",
            "Heading"
          )
        )
      );

    case "text":
      return withLink(
        node,
        createElement(
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
        )
      );

    case "button": {
      const style: CSSProperties =
        {
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
          borderRadius: 8,
          cursor: "pointer",
          textDecoration:
            "none",
          background:
            "var(--sytely-accent)",
          color:
            "var(--sytely-accent-text)",
          boxSizing:
            "border-box",
          ...styles,
        };

      const label =
        stringProp(
          props,
          "text",
          "Button"
        );

      const href =
        stringProp(
          props,
          "linkTo"
        );

      if (href) {
        return createElement(
          "a",
          {
            ...dataAttrs(node),
            href,
            style,
          },
          label
        );
      }

      return createElement(
        "button",
        {
          ...dataAttrs(node),
          type: "button",
          style,
        },
        label
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
              background:
                "repeating-linear-gradient(45deg,var(--sytely-placeholder-a) 0,var(--sytely-placeholder-a) 8px,var(--sytely-placeholder-b) 8px,var(--sytely-placeholder-b) 16px)",
              color:
                "var(--sytely-text-muted)",
              borderRadius: 10,
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

    case "video": {
      const src =
        stringProp(
          props,
          "src"
        );

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
        src
          ? createElement(
              "video",
              {
                src,
                controls: true,
                style: {
                  width: "100%",
                  height: "100%",
                  objectFit:
                    "cover",
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
        numberProp(
          props,
          "columns",
          3
        );

      return createElement(
        "div",
        {
          ...dataAttrs(node),
          style: {
            ...responsiveGrid(
              columns,
              device
            ),
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
          (src, index) =>
            src
              ? createElement(
                  "img",
                  {
                    key: index,
                    src,
                    alt: `Gallery image ${
                      index + 1
                    }`,
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
                      width:
                        "100%",
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
              "var(--sytely-text)",
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
            flexWrap:
              "wrap",
            gap: 20,
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
              "Instagram",
              "X",
              "LinkedIn",
            ];

      return createElement(
        "div",
        {
          ...dataAttrs(node),
          style: {
            display: "flex",
            flexWrap:
              "wrap",
            gap: 12,
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

    case "form": {
      const title =
        stringProp(
          props,
          "title",
          "Contact us"
        );

      const submit =
        stringProp(
          props,
          "submitLabel",
          "Send message"
        );

      return createElement(
        "form",
        {
          ...dataAttrs(node),
          onSubmit: (
            event: {
              preventDefault: () => void;
            }
          ) =>
            event.preventDefault(),
          style: {
            display: "flex",
            flexDirection:
              "column",
            gap: 12,
            ...styles,
          },
        },
        createElement(
          "strong",
          null,
          title
        ),
        createElement(
          "input",
          {
            type: "text",
            placeholder:
              "Name",
            style:
              formInputStyle,
          }
        ),
        createElement(
          "input",
          {
            type: "email",
            placeholder:
              "Email",
            style:
              formInputStyle,
          }
        ),
        createElement(
          "textarea",
          {
            rows: 4,
            placeholder:
              "Message",
            style:
              formInputStyle,
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
          submit
        )
      );
    }

    case "card":
      return createElement(
        "article",
        {
          ...dataAttrs(node),
          style: {
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
        renderCardChildren(
          node,
          device
        )
      );

    case "features": {
      const hasChildren =
        Boolean(
          node.children?.length
        );

      const columns =
        numberProp(
          props,
          "columns",
          3
        );

      return createElement(
        "div",
        {
          ...dataAttrs(node),
          style: {
            ...responsiveGrid(
              columns,
              device
            ),
            gap: 16,
            width: "100%",
            ...styles,
          },
        },
        hasChildren
          ? renderChildren(
              node.children,
              device
            )
          : [
              "Visual editing",
              "Responsive layouts",
              "Reusable sections",
            ].map(
              (title) =>
                createElement(
                  "article",
                  {
                    key: title,
                    style: {
                      padding: 22,
                      background:
                        "var(--sytely-card)",
                      borderRadius: 10,
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
    }

    case "pricing": {
      const hasChildren =
        Boolean(
          node.children?.length
        );

      const columns =
        numberProp(
          props,
          "columns",
          3
        );

      return createElement(
        "div",
        {
          ...dataAttrs(node),
          style: {
            ...responsiveGrid(
              columns,
              device
            ),
            gap: 16,
            width: "100%",
            ...styles,
          },
        },
        hasChildren
          ? renderChildren(
              node.children,
              device
            )
          : [
              [
                "Starter",
                9,
              ],
              ["Pro", 24],
              ["Business", 59],
            ].map(
              ([title, price]) =>
                createElement(
                  "article",
                  {
                    key:
                      title as string,
                    style: {
                      padding: 24,
                      background:
                        "var(--sytely-card)",
                      borderRadius: 12,
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
                        fontSize:
                          32,
                        fontWeight:
                          800,
                        margin:
                          "14px 0",
                      },
                    },
                    `$${price}`
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
    }

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
          "quote",
          stringProp(
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
          stringProp(
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
          ...dataAttrs(node),
          style: {
            width: "100%",
            padding: 16,
            borderRadius: 8,
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
            "Edit this answer from the component properties."
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
        stringProp(
          props,
          "phone"
        )
          ? createElement(
              "span",
              {
                style: {
                  color:
                    "var(--sytely-text-muted)",
                },
              },
              stringProp(
                props,
                "phone"
              )
            )
          : null
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
        )
      );

    default:
      return null;
  }
}

function numberValue(
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

const formInputStyle: CSSProperties =
  {
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
    color: "inherit",
  };

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