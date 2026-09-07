import {
  Fragment,
  createElement,
  type CSSProperties,
  type ReactNode
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

function getString(
  props: Record<string, unknown>,
  key: string,
  fallback = ""
) {
  const value = props[key];

  return typeof value === "string"
    ? value
    : fallback;
}

function responsiveStyles(
  node: ComponentNode,
  device: RenderDevice
): CSSProperties {
  const base = {
    ...(node.styles ?? {})
  } as Record<
    string,
    unknown
  >;

  const responsive =
    base.responsive as
      | Record<
          string,
          unknown
        >
      | undefined;

  delete base.responsive;

  const tablet =
    (responsive?.tablet as
      | Record<
          string,
          unknown
        >
      | undefined) ??
    {};

  const mobile =
    (responsive?.mobile as
      | Record<
          string,
          unknown
        >
      | undefined) ??
    {};

  const override =
    device === "mobile"
      ? {
          ...tablet,
          ...mobile
        }
      : device ===
          "tablet"
        ? tablet
        : {};

  const result = {
    ...base,
    ...override
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
    result.width = `min(${result.width}px, 100%)`;
  }

  if (
    typeof result.maxWidth ===
    "number"
  ) {
    result.maxWidth = `min(${result.maxWidth}px, 100%)`;
  }

  if (
    device === "tablet" &&
    typeof result.gridTemplateColumns ===
      "string" &&
    result.gridTemplateColumns.includes(
      "repeat(3"
    )
  ) {
    result.gridTemplateColumns =
      "repeat(2,minmax(0,1fr))";
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

function renderChildren(
  children:
    | ComponentNode[]
    | undefined,
  device: RenderDevice
) {
  return (
    children ?? []
  ).map((child) =>
    createElement(
      Fragment,
      {
        key: child.id
      },
      renderNode(child, {
        device
      })
    )
  );
}

function wrapLink(
  node: ComponentNode,
  content: ReactNode
) {
  const linkTo =
    getString(
      node.props,
      "linkTo"
    );

  return linkTo
    ? createElement(
        "a",
        {
          href: linkTo,
          style: {
            color:
              "inherit",
            textDecoration:
              "none"
          }
        },
        content
      )
    : content;
}

function data(
  node: ComponentNode
) {
  return {
    "data-sytely-id":
      node.id,
    "data-sytely-type":
      node.type
  };
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
      const sectionStyles:
        CSSProperties = {
        boxSizing:
          "border-box",
        width: "100%",
        display: "flex",
        flexDirection:
          "column",
        justifyContent:
          "flex-start",
        alignItems:
          "stretch",
        gap: 24,
        paddingTop: 56,
        paddingRight: 40,
        paddingBottom: 56,
        paddingLeft: 40,
        color:
          "var(--sytely-text)",
        background:
          "var(--sytely-surface)",
        ...styles
      };

      if (
        device === "tablet"
      ) {
        sectionStyles.paddingTop =
          Math.min(
            Number(
              sectionStyles.paddingTop
            ) || 56,
            48
          );

        sectionStyles.paddingBottom =
          Math.min(
            Number(
              sectionStyles.paddingBottom
            ) || 56,
            48
          );

        sectionStyles.paddingLeft =
          Math.min(
            Number(
              sectionStyles.paddingLeft
            ) || 40,
            32
          );

        sectionStyles.paddingRight =
          Math.min(
            Number(
              sectionStyles.paddingRight
            ) || 40,
            32
          );
      }

      if (
        device === "mobile"
      ) {
        sectionStyles.paddingTop =
          Math.min(
            Number(
              sectionStyles.paddingTop
            ) || 56,
            32
          );

        sectionStyles.paddingBottom =
          Math.min(
            Number(
              sectionStyles.paddingBottom
            ) || 56,
            32
          );

        sectionStyles.paddingLeft =
          Math.min(
            Number(
              sectionStyles.paddingLeft
            ) || 40,
            20
          );

        sectionStyles.paddingRight =
          Math.min(
            Number(
              sectionStyles.paddingRight
            ) || 40,
            20
          );
      }

      return createElement(
        "section",
        {
          ...data(node),
          style:
            sectionStyles
        },
        children
      );
    }

    case "heading":
      return wrapLink(
        node,
        createElement(
          "h2",
          {
            ...data(node),
            style: {
              margin: 0,
              color:
                "var(--sytely-text)",
              lineHeight: 1.12,
              ...styles
            }
          },
          getString(
            props,
            "text",
            "Heading"
          )
        )
      );

    case "text":
      return wrapLink(
        node,
        createElement(
          "p",
          {
            ...data(node),
            style: {
              margin: 0,
              lineHeight: 1.6,
              color:
                "var(--sytely-text-muted)",
              ...styles
            }
          },
          getString(
            props,
            "text",
            "Text"
          )
        )
      );

    case "image": {
      const src =
        getString(
          props,
          "src"
        );

      const alt =
        getString(
          props,
          "alt",
          "Image"
        );

      if (!src) {
        return createElement(
          "div",
          {
            ...data(node),
            style: {
              width: "100%",
              minHeight: 180,
              aspectRatio:
                "16 / 9",
              background:
                "repeating-linear-gradient(45deg,var(--sytely-placeholder-a) 0,var(--sytely-placeholder-a) 8px,var(--sytely-placeholder-b) 8px,var(--sytely-placeholder-b) 16px)",
              display: "grid",
              placeItems:
                "center",
              color:
                "var(--sytely-text-muted)",
              borderRadius: 10,
              ...styles
            }
          },
          "Image"
        );
      }

      return createElement(
        "img",
        {
          ...data(node),
          src,
          alt,
          style: {
            display: "block",
            width: "100%",
            maxWidth: "100%",
            height: "auto",
            objectFit: "cover",
            borderRadius: 10,
            ...styles
          }
        }
      );
    }

    case "button": {
      const text =
        getString(
          props,
          "text",
          "Button"
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
        border: "none",
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
        ...styles
      };

      return getString(
        props,
        "linkTo"
      )
        ? createElement(
            "a",
            {
              ...data(node),
              href: getString(
                props,
                "linkTo"
              ),
              style:
                buttonStyle
            },
            text
          )
        : createElement(
            "button",
            {
              ...data(node),
              type: "button",
              style:
                buttonStyle
            },
            text
          );
    }

    case "video": {
      const src =
        getString(
          props,
          "src"
        );

      return createElement(
        "div",
        {
          ...data(node),
          style: {
            width: "100%",
            aspectRatio:
              "16 / 9",
            borderRadius: 12,
            overflow:
              "hidden",
            background:
              "var(--sytely-card)",
            display: "grid",
            placeItems:
              "center",
            color:
              "var(--sytely-text-muted)",
            ...styles
          }
        },
        src
          ? createElement(
              "video",
              {
                src,
                controls: true,
                style: {
                  width: "100%",
                  height: "100%"
                }
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
          : [
              "",
              "",
              ""
            ];

      return createElement(
        "div",
        {
          ...data(node),
          style: {
            display: "grid",
            gridTemplateColumns:
              "repeat(3,minmax(0,1fr))",
            gap: 12,
            width: "100%",
            ...styles
          }
        },
        (
          images.length
            ? images
            : [
                "",
                "",
                ""
              ]
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
                      borderRadius: 8
                    }
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
                        "var(--sytely-card)"
                    }
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
              "var(--sytely-text)",
            opacity: 0.15,
            ...styles
          }
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
            ...styles
          }
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
            fontWeight: 800,
            fontSize: 22,
            ...styles
          }
        },
        getString(
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
              "Contact"
            ];

      return createElement(
        "nav",
        {
          ...data(node),
          style: {
            display: "flex",
            flexWrap: "wrap",
            gap: 18,
            alignItems:
              "center",
            ...styles
          }
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
                    "none"
                }
              },
              item
            )
        )
      );
    }

    case "social":
      return createElement(
        "div",
        {
          ...data(node),
          style: {
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            ...styles
          }
        },
        [
          "in",
          "𝕏",
          "◎",
          "f"
        ].map((item) =>
          createElement(
            "span",
            {
              key: item,
              style: {
                width: 34,
                height: 34,
                borderRadius: 50,
                display: "grid",
                placeItems:
                  "center",
                background:
                  "var(--sytely-card)",
                fontWeight: 700
              }
            },
            item
          )
        )
      );

    case "form":
      return createElement(
        "form",
        {
          ...data(node),
          onSubmit: (
            event: {
              preventDefault: () => void;
            }
          ) =>
            event.preventDefault(),
          style: {
            display: "grid",
            gap: 12,
            width: "100%",
            maxWidth: 560,
            ...styles
          }
        },
        [
          "Name",
          "Email"
        ].map(
          (label) =>
            createElement(
              "label",
              {
                key: label,
                style: {
                  display:
                    "grid",
                  gap: 6
                }
              },
              label,
              createElement(
                "input",
                {
                  type:
                    label ===
                    "Email"
                      ? "email"
                      : "text",
                  placeholder:
                    label,
                  style: {
                    padding:
                      "12px 14px",
                    borderRadius: 8,
                    border:
                      "1px solid color-mix(in srgb,var(--sytely-text) 15%,transparent)",
                    background:
                      "var(--sytely-page)",
                    color:
                      "inherit"
                  }
                }
              )
            )
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
                "inherit"
            }
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
                "var(--sytely-accent-text)"
            }
          },
          "Send message"
        )
      );

    case "card":
      return createElement(
        "article",
        {
          ...data(node),
          style: {
            padding: 24,
            borderRadius: 12,
            background:
              "var(--sytely-card)",
            display: "grid",
            gap: 10,
            ...styles
          }
        },
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
              lineHeight: 1.6
            }
          },
          getString(
            props,
            "text",
            "Card description"
          )
        )
      );

    case "features": {
      if (
        props.mode ===
        "stats"
      ) {
        return createElement(
          "div",
          {
            ...data(node),
            style: {
              display: "grid",
              gridTemplateColumns:
                "repeat(3,minmax(0,1fr))",
              gap: 16,
              width: "100%",
              ...styles
            }
          },
          [
            "10k+ Projects",
            "99% Satisfaction",
            "24/7 Availability"
          ].map(
            (text) =>
              createElement(
                "article",
                {
                  key: text,
                  style: {
                    padding: 24,
                    borderRadius: 12,
                    background:
                      "var(--sytely-card)",
                    textAlign:
                      "center",
                    fontWeight: 700
                  }
                },
                text
              )
          )
        );
      }

      return createElement(
        "div",
        {
          ...data(node),
          style: {
            display: "grid",
            gridTemplateColumns:
              "repeat(3,minmax(0,1fr))",
            gap: 16,
            width: "100%",
            ...styles
          }
        },
        [
          "Visual editing",
          "Responsive layouts",
          "Reusable sections"
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
                  borderRadius: 10
                }
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
                      "var(--sytely-text-muted)"
                  }
                },
                "A reusable feature block."
              )
            )
        )
      );
    }

    case "pricing":
      return createElement(
        "div",
        {
          ...data(node),
          style: {
            display: "grid",
            gridTemplateColumns:
              "repeat(3,minmax(0,1fr))",
            gap: 16,
            width: "100%",
            ...styles
          }
        },
        [
          "Starter",
          "Pro",
          "Business"
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
                  background:
                    "var(--sytely-card)",
                  borderRadius: 12
                }
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
                      "14px 0"
                  }
                },
                `$${[
                  9,
                  24,
                  59
                ][index]}`
              ),
              createElement(
                "p",
                {
                  style: {
                    color:
                      "var(--sytely-text-muted)"
                  }
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
          ...data(node),
          style: {
            margin: 0,
            padding: 28,
            borderRadius: 12,
            background:
              "var(--sytely-card)",
            fontSize: 20,
            lineHeight: 1.5,
            ...styles
          }
        },
        `“${getString(
          props,
          "text",
          "A thoughtful product makes the whole experience easier."
        )}”`,
        createElement(
          "footer",
          {
            style: {
              marginTop: 14,
              fontSize: 13,
              color:
                "var(--sytely-text-muted)"
            }
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
        "div",
        {
          ...data(node),
          style: {
            display: "grid",
            gap: 8,
            width: "100%",
            ...styles
          }
        },
        [
          "What is Sytely?",
          "Can I edit responsive layouts?",
          "Can I create multiple pages?"
        ].map(
          (question) =>
            createElement(
              "details",
              {
                key: question,
                style: {
                  padding: 16,
                  borderRadius: 8,
                  background:
                    "var(--sytely-card)"
                }
              },
              createElement(
                "summary",
                {
                  style: {
                    cursor:
                      "pointer",
                    fontWeight: 700
                  }
                },
                question
              ),
              createElement(
                "p",
                {
                  style: {
                    color:
                      "var(--sytely-text-muted)"
                  }
                },
                "Edit this answer from the component properties."
              )
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
            gap: 8,
            ...styles
          }
        },
        createElement(
          "strong",
          null,
          "Contact"
        ),
        createElement(
          "span",
          {
            style: {
              color:
                "var(--sytely-text-muted)"
            }
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
                "var(--sytely-text-muted)"
            }
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
            ...styles
          }
        },
        getString(
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
  device = "desktop"
}: {
  nodes: ComponentNode[];
  device?: RenderDevice;
}) {
  return createElement(
    Fragment,
    null,
    nodes.map((item) =>
      createElement(
        Fragment,
        {
          key: item.id
        },
        renderNode(item, {
          device
        })
      )
    )
  );
}