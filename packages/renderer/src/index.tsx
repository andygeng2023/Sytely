import {
  Fragment,
  createElement,
  type CSSProperties,
  type FormEvent,
  type ReactNode
} from "react";
import type { ComponentNode, SiteTheme } from "@sytely/types";

export interface RenderOptions {
  children?: ReactNode;
  renderChildren?: boolean;
}

function styleObject(
  input?: Record<string, unknown>
): CSSProperties {
  return { ...(input ?? {}) } as CSSProperties;
}

function stringProp(
  node: ComponentNode,
  key: string,
  fallback = ""
): string {
  const value = node.props?.[key];
  return typeof value === "string" ? value : fallback;
}

function childrenOf(node: ComponentNode): ReactNode {
  return (node.children ?? []).map((child) =>
    createElement(
      Fragment,
      { key: child.id },
      renderNode(child)
    )
  );
}

function wrapLink(
  node: ComponentNode,
  content: ReactNode
): ReactNode {
  const href = stringProp(node, "linkTo");

  if (!href) return content;

  return createElement(
    "a",
    {
      href,
      style: {
        color: "inherit",
        textDecoration: "none"
      }
    },
    content
  );
}

function placeholder(
  label: string,
  styles: CSSProperties
): ReactNode {
  return createElement(
    "div",
    {
      style: {
        ...styles,
        width: "100%",
        aspectRatio: "16 / 9",
        display: "grid",
        placeItems: "center",
        boxSizing: "border-box"
      }
    },
    label
  );
}

export function renderNode(
  node: ComponentNode,
  options: RenderOptions = {}
): ReactNode {
  const custom = styleObject(node.styles);

  const childContent =
    options.children !== undefined
      ? options.children
      : options.renderChildren === false
        ? null
        : childrenOf(node);

  const common = {
    "data-sytely-id": node.id,
    "data-sytely-type": node.type
  };

  switch (node.type) {
    case "section":
      return createElement(
        "section",
        {
          ...common,
          style: {
            boxSizing: "border-box",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "stretch",
            gap: 20,
            padding: "56px 40px",
            position: "relative",
            ...custom
          }
        },
        createElement(
          "div",
          {
            style: {
              width: "100%",
              maxWidth: "1100px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems:
                custom.alignItems === "center"
                  ? "center"
                  : custom.alignItems === "flex-end"
                    ? "flex-end"
                    : "stretch",
              justifyContent:
                custom.justifyContent === "center"
                  ? "center"
                  : custom.justifyContent === "flex-end"
                    ? "flex-end"
                    : "flex-start",
              gap: Number(custom.gap ?? 20)
            }
          },
          childContent
        )
      );

    case "heading":
      return wrapLink(
        node,
        createElement(
          "h2",
          {
            ...common,
            style: {
              margin: 0,
              lineHeight: 1.08,
              ...custom
            }
          },
          stringProp(node, "text", "Heading")
        )
      );

    case "text":
      return wrapLink(
        node,
        createElement(
          "p",
          {
            ...common,
            style: {
              margin: 0,
              lineHeight: 1.6,
              maxWidth: "70ch",
              ...custom
            }
          },
          stringProp(
            node,
            "text",
            "Add your text here."
          )
        )
      );

    case "button": {
      const button = createElement(
        "button",
        {
          ...common,
          type: "button",
          style: {
            border: 0,
            borderRadius: 9,
            padding: "12px 20px",
            cursor: "pointer",
            width: "fit-content",
            ...custom
          }
        },
        stringProp(node, "text", "Button")
      );

      const href = stringProp(node, "linkTo");

      return href
        ? createElement(
            "a",
            {
              href,
              style: {
                display: "block",
                width: "fit-content",
                color: "inherit",
                textDecoration: "none"
              }
            },
            button
          )
        : button;
    }

    case "image": {
      const src = stringProp(node, "src");

      return wrapLink(
        node,
        src
          ? createElement("img", {
              ...common,
              src,
              alt: stringProp(node, "alt", "Image"),
              loading: "lazy",
              style: {
                display: "block",
                width: "100%",
                maxWidth: "100%",
                height: "auto",
                objectFit: "cover",
                ...custom
              }
            })
          : placeholder("Image", {
              background:
                "repeating-linear-gradient(135deg,#f4f4f5 0,#f4f4f5 9px,#e8e8ea 9px,#e8e8ea 18px)",
              color: "#777",
              ...custom
            })
      );
    }

    case "video": {
      const src = stringProp(node, "src");

      return src
        ? createElement("video", {
            ...common,
            src,
            controls: true,
            preload: "metadata",
            style: {
              display: "block",
              width: "100%",
              maxWidth: "100%",
              ...custom
            }
          })
        : placeholder("Video", {
            background: "#151515",
            color: "#fff",
            ...custom
          });
    }

    case "gallery":
      return createElement(
        "div",
        {
          ...common,
          style: {
            width: "100%",
            display: "grid",
            gridTemplateColumns:
              "repeat(3,minmax(0,1fr))",
            gap: 16,
            ...custom
          }
        },
        ["01", "02", "03", "04", "05", "06"].map(
          (label) =>
            createElement(
              "div",
              {
                key: label,
                style: {
                  minWidth: 0,
                  aspectRatio: "4 / 3",
                  borderRadius: 10,
                  background: "#ececf0",
                  display: "grid",
                  placeItems: "center",
                  color: "#777"
                }
              },
              label
            )
        )
      );

    case "divider":
      return createElement("hr", {
        ...common,
        style: {
          width: "100%",
          border: 0,
          borderTop: "1px solid #d9d9dd",
          margin: 0,
          ...custom
        }
      });

    case "icon":
      return createElement(
        "div",
        {
          ...common,
          style: {
            width: 48,
            height: 48,
            display: "grid",
            placeItems: "center",
            borderRadius: 12,
            background: "#f0f0f3",
            fontSize: 24,
            ...custom
          }
        },
        stringProp(node, "symbol", "✦")
      );

    case "logo":
      return createElement(
        "div",
        {
          ...common,
          style: {
            fontWeight: 800,
            fontSize: 22,
            ...custom
          }
        },
        stringProp(node, "text", "Sytely")
      );

    case "menu":
      return createElement(
        "nav",
        {
          ...common,
          style: {
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
            alignItems: "center",
            ...custom
          }
        },
        ["Home", "About", "Services", "Contact"].map(
          (item) =>
            createElement(
              "a",
              {
                key: item,
                href:
                  item === "Home"
                    ? "/"
                    : `/${item.toLowerCase()}`,
                style: {
                  color: "inherit",
                  textDecoration: "none"
                }
              },
              item
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
            gap: 10,
            ...custom
          }
        },
        ["f", "x", "in", "◎"].map((item) =>
          createElement(
            "span",
            {
              key: item,
              style: {
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#eee",
                display: "grid",
                placeItems: "center"
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
          ...common,
          onSubmit: (event: FormEvent) =>
            event.preventDefault(),
          style: {
            display: "grid",
            gap: 12,
            width: "100%",
            maxWidth: 520,
            ...custom
          }
        },
        [
          ...["Name", "Email"].map((label) =>
            createElement("input", {
              key: label,
              placeholder: label,
              style: {
                width: "100%",
                padding: "12px 14px",
                border: "1px solid #d8d8dc",
                borderRadius: 8
              }
            })
          ),
          createElement("textarea", {
            key: "message",
            placeholder: "Message",
            rows: 5,
            style: {
              width: "100%",
              padding: "12px 14px",
              border: "1px solid #d8d8dc",
              borderRadius: 8,
              resize: "vertical"
            }
          }),
          createElement(
            "button",
            {
              key: "submit",
              type: "submit",
              style: {
                width: "fit-content",
                padding: "11px 18px",
                border: 0,
                borderRadius: 8,
                background: "#111",
                color: "#fff"
              }
            },
            "Send"
          )
        ]
      );

    case "card":
      return createElement(
        "article",
        {
          ...common,
          style: {
            width: "100%",
            minWidth: 0,
            padding: 24,
            border: "1px solid #e2e2e6",
            borderRadius: 16,
            background: "#fff",
            ...custom
          }
        },
        childContent ||
          createElement(
            Fragment,
            null,
            createElement(
              "h3",
              { style: { margin: "0 0 8px" } },
              stringProp(node, "title", "Card title")
            ),
            createElement(
              "p",
              { style: { margin: 0, color: "#666" } },
              stringProp(
                node,
                "text",
                "Card content"
              )
            )
          )
      );

    case "features":
      return createElement(
        "div",
        {
          ...common,
          style: {
            width: "100%",
            display: "grid",
            gridTemplateColumns:
              "repeat(3,minmax(0,1fr))",
            gap: 16,
            ...custom
          }
        },
        ["Fast", "Flexible", "Responsive"].map(
          (item) =>
            createElement(
              "div",
              {
                key: item,
                style: {
                  minWidth: 0,
                  padding: 24,
                  border: "1px solid #e5e5e8",
                  borderRadius: 14,
                  background: "#fff"
                }
              },
              createElement(
                "h3",
                { style: { margin: "0 0 8px" } },
                item
              ),
              createElement(
                "p",
                {
                  style: {
                    margin: 0,
                    color: "#666"
                  }
                },
                "A ready-made feature block."
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
            width: "100%",
            display: "grid",
            gridTemplateColumns:
              "repeat(3,minmax(0,1fr))",
            gap: 16,
            ...custom
          }
        },
        ["Starter", "Pro", "Business"].map(
          (item, index) =>
            createElement(
              "div",
              {
                key: item,
                style: {
                  minWidth: 0,
                  padding: 28,
                  border: "1px solid #e2e2e6",
                  borderRadius: 16,
                  background: "#fff"
                }
              },
              createElement(
                "h3",
                { style: { marginTop: 0 } },
                item
              ),
              createElement(
                "strong",
                { style: { fontSize: 30 } },
                `$${[19, 49, 99][index]}`
              ),
              createElement(
                "p",
                { style: { color: "#666" } },
                "per month"
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
            borderRadius: 16,
            background: "#f5f5f7",
            ...custom
          }
        },
        `“${stringProp(
          node,
          "text",
          "A thoughtful testimonial from a happy customer."
        )}”`
      );

    case "faq":
      return createElement(
        "div",
        {
          ...common,
          style: {
            display: "grid",
            gap: 10,
            width: "100%",
            ...custom
          }
        },
        [
          "What is Sytely?",
          "Can I edit this?",
          "Is it responsive?"
        ].map((question) =>
          createElement(
            "details",
            {
              key: question,
              style: {
                border: "1px solid #e3e3e7",
                borderRadius: 10,
                padding: 14
              }
            },
            createElement("summary", null, question),
            createElement(
              "p",
              { style: { color: "#666" } },
              "Add your answer here."
            )
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
            ...custom
          }
        },
        createElement(
          "h3",
          { style: { margin: 0 } },
          "Let's talk"
        ),
        createElement(
          "p",
          { style: { margin: 0, color: "#666" } },
          "hello@example.com"
        ),
        createElement(
          "p",
          { style: { margin: 0, color: "#666" } },
          "+1 000 000 0000"
        ),
        childContent
      );

    case "footer":
      return createElement(
        "footer",
        {
          ...common,
          style: {
            display: "flex",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
            padding: "32px 0",
            color: "#666",
            ...custom
          }
        },
        createElement("span", null, "© Sytely"),
        createElement("span", null, "Built visually"),
        childContent
      );

    default:
      return childContent;
  }
}

export function SytelyRenderer({
  nodes,
  className,
  style,
  theme = "system"
}: {
  nodes: ComponentNode[];
  className?: string;
  style?: CSSProperties;
  theme?: SiteTheme;
}) {
  return createElement(
    "div",
    {
      className: `sytely-renderer theme-${theme}`,
      "data-sytely-theme": theme,
      style: {
        color:
          theme === "dark"
            ? "#f7f7f8"
            : undefined,
        background:
          theme === "dark"
            ? "#111113"
            : undefined,
        ...style
      }
    },
    nodes.map((item) =>
      createElement(
        Fragment,
        { key: item.id },
        renderNode(item)
      )
    )
  );
}