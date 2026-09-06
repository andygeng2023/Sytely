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

function styleObject(input?: Record<string, unknown>): CSSProperties {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input ?? {})) {
    result[key] = value;
  }

  return result as CSSProperties;
}

function getString(
  props: Record<string, unknown>,
  key: string,
  fallback = ""
): string {
  const value = props[key];
  return typeof value === "string" ? value : fallback;
}

function renderChildren(children?: ComponentNode[]): ReactNode {
  return (children ?? []).map((child) =>
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
  const linkTo = getString(node.props, "linkTo");

  if (!linkTo) {
    return content;
  }

  return createElement(
    "a",
    {
      href: linkTo,
      style: {
        color: "inherit",
        textDecoration: "none"
      }
    },
    content
  );
}

export function renderNode(
  node: ComponentNode,
  options: RenderOptions = {}
): ReactNode {
  const props = node.props ?? {};
  const customStyles = styleObject(node.styles);

  const childContent =
    options.children !== undefined
      ? options.children
      : options.renderChildren === false
        ? null
        : renderChildren(node.children);

  switch (node.type) {
    case "section": {
      const style: CSSProperties = {
        boxSizing: "border-box",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "stretch",
        gap: 24,
        paddingTop: 56,
        paddingRight: 40,
        paddingBottom: 56,
        paddingLeft: 40,
        position: "relative",
        ...customStyles
      };

      return wrapLink(
        node,
        createElement(
          "section",
          {
            "data-sytely-id": node.id,
            "data-sytely-type": node.type,
            style
          },
          childContent
        )
      );
    }

    case "heading":
      return wrapLink(
        node,
        createElement(
          "h2",
          {
            "data-sytely-id": node.id,
            "data-sytely-type": node.type,
            style: {
              margin: 0,
              ...customStyles
            }
          },
          getString(props, "text", "Heading")
        )
      );

    case "text":
      return wrapLink(
        node,
        createElement(
          "p",
          {
            "data-sytely-id": node.id,
            "data-sytely-type": node.type,
            style: {
              margin: 0,
              lineHeight: 1.6,
              ...customStyles
            }
          },
          getString(props, "text", "Text")
        )
      );

    case "image": {
      const src = getString(props, "src");
      const alt = getString(props, "alt", "Image");

      if (!src) {
        return wrapLink(
          node,
          createElement(
            "div",
            {
              "data-sytely-id": node.id,
              "data-sytely-type": node.type,
              style: {
                width: "100%",
                height: 220,
                minWidth: 120,
                background:
                  "repeating-linear-gradient(45deg,#f1f1f1 0,#f1f1f1 8px,#e7e7e7 8px,#e7e7e7 16px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#777",
                ...customStyles
              }
            },
            "Image"
          )
        );
      }

      return wrapLink(
        node,
        createElement("img", {
          "data-sytely-id": node.id,
          "data-sytely-type": node.type,
          src,
          alt,
          style: {
            display: "block",
            maxWidth: "100%",
            height: "auto",
            objectFit: "cover",
            ...customStyles
          }
        })
      );
    }

    case "button": {
      const text = getString(props, "text", "Button");
      const linkTo = getString(props, "linkTo");

      const buttonStyle: CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "fit-content",
        padding: "12px 20px",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        textDecoration: "none",
        ...customStyles
      };

      if (linkTo) {
        return createElement(
          "a",
          {
            "data-sytely-id": node.id,
            "data-sytely-type": node.type,
            href: linkTo,
            style: buttonStyle
          },
          text
        );
      }

      return createElement(
        "button",
        {
          "data-sytely-id": node.id,
          "data-sytely-type": node.type,
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