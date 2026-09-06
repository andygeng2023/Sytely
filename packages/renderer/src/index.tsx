import {
  Fragment,
  createElement,
  type CSSProperties,
  type ReactNode
} from "react";
import type { ComponentNode } from "@sytely/types";

export interface RenderOptions {
  children?: ReactNode;
  renderChildren?: boolean;
}

function styleObject(
  input?: Record<string, unknown>
): CSSProperties {
  return {
    ...(input ?? {})
  } as CSSProperties;
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

function renderChildren(
  children?: ComponentNode[]
): ReactNode {
  return (children ?? []).map(
    (child) =>
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
) {
  const linkTo = getString(
    node.props,
    "linkTo"
  );

  return linkTo
    ? createElement(
        "a",
        {
          href: linkTo,
          style: {
            color: "inherit",
            textDecoration: "none"
          }
        },
        content
      )
    : content;
}

export function renderNode(
  node: ComponentNode,
  options: RenderOptions = {}
): ReactNode {
  const props = node.props ?? {};
  const customStyles =
    styleObject(node.styles);

  const childContent =
    options.children !== undefined
      ? options.children
      : options.renderChildren === false
        ? null
        : renderChildren(
            node.children
          );

  switch (node.type) {
    case "section":
      return wrapLink(
        node,
        createElement(
          "section",
          {
            "data-sytely-id":
              node.id,
            "data-sytely-type":
              node.type,
            style: {
              boxSizing: "border-box",
              width: "100%",
              display: "flex",
              flexDirection: "column",
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
              ...customStyles
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
            "data-sytely-id":
              node.id,
            "data-sytely-type":
              node.type,
            style: {
              margin: 0,
              color:
                "var(--sytely-text)",
              lineHeight: 1.12,
              ...customStyles
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
            "data-sytely-id":
              node.id,
            "data-sytely-type":
              node.type,
            style: {
              margin: 0,
              lineHeight: 1.6,
              color:
                "var(--sytely-text-muted)",
              ...customStyles
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
      const src = getString(
        props,
        "src"
      );

      const alt = getString(
        props,
        "alt",
        "Image"
      );

      if (!src) {
        return wrapLink(
          node,
          createElement(
            "div",
            {
              "data-sytely-id":
                node.id,
              "data-sytely-type":
                node.type,
              style: {
                width: "100%",
                aspectRatio:
                  "16 / 9",
                minWidth: 120,
                background:
                  "repeating-linear-gradient(45deg,var(--sytely-placeholder-a) 0,var(--sytely-placeholder-a) 8px,var(--sytely-placeholder-b) 8px,var(--sytely-placeholder-b) 16px)",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                color:
                  "var(--sytely-text-muted)",
                borderRadius: 10,
                ...customStyles
              }
            },
            "Image"
          )
        );
      }

      return wrapLink(
        node,
        createElement(
          "img",
          {
            "data-sytely-id":
              node.id,
            "data-sytely-type":
              node.type,
            src,
            alt,
            style: {
              display: "block",
              width: "100%",
              maxWidth: "100%",
              height: "auto",
              objectFit: "cover",
              borderRadius: 10,
              ...customStyles
            }
          }
        )
      );
    }

    case "button": {
      const text = getString(
        props,
        "text",
        "Button"
      );

      const linkTo = getString(
        props,
        "linkTo"
      );

      const buttonStyle: CSSProperties =
        {
          display: "inline-flex",
          alignItems: "center",
          justifyContent:
            "center",
          width: "fit-content",
          padding: "12px 20px",
          minHeight: 44,
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          textDecoration: "none",
          background:
            "var(--sytely-accent)",
          color:
            "var(--sytely-accent-text)",
          boxSizing: "border-box",
          ...customStyles
        };

      if (linkTo) {
        return createElement(
          "a",
          {
            "data-sytely-id":
              node.id,
            "data-sytely-type":
              node.type,
            href: linkTo,
            style: buttonStyle
          },
          text
        );
      }

      return createElement(
        "button",
        {
          "data-sytely-id":
            node.id,
          "data-sytely-type":
            node.type,
          type: "button",
          style: buttonStyle
        },
        text
      );
    }

    default:
      return null;
  }
}

export function SytelyRenderer({
  nodes
}: {
  nodes: ComponentNode[];
}) {
  return createElement(
    Fragment,
    null,
    nodes.map((node) =>
      createElement(
        Fragment,
        { key: node.id },
        renderNode(node)
      )
    )
  );
}