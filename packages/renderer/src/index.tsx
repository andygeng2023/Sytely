import {
  createElement,
  Fragment,
  type CSSProperties,
  type ReactNode
} from "react";

import type { ComponentNode } from "@sytely/types";

function getStyleValue(
  styles: Record<string, unknown>,
  key: string
): unknown {
  return styles[key];
}

function getStyles(node: ComponentNode): CSSProperties {
  const styles = node.styles ?? {};

  return {
    width: getStyleValue(styles, "width") as CSSProperties["width"],
    height: getStyleValue(styles, "height") as CSSProperties["height"],
    minHeight: getStyleValue(
      styles,
      "minHeight"
    ) as CSSProperties["minHeight"],
    maxWidth: getStyleValue(
      styles,
      "maxWidth"
    ) as CSSProperties["maxWidth"],
    background: getStyleValue(
      styles,
      "background"
    ) as CSSProperties["background"],
    backgroundColor: getStyleValue(
      styles,
      "backgroundColor"
    ) as CSSProperties["backgroundColor"],
    color: getStyleValue(styles, "color") as CSSProperties["color"],
    fontFamily: getStyleValue(
      styles,
      "fontFamily"
    ) as CSSProperties["fontFamily"],
    fontSize: getStyleValue(
      styles,
      "fontSize"
    ) as CSSProperties["fontSize"],
    fontWeight: getStyleValue(
      styles,
      "fontWeight"
    ) as CSSProperties["fontWeight"],
    textAlign: getStyleValue(
      styles,
      "textAlign"
    ) as CSSProperties["textAlign"],
    lineHeight: getStyleValue(
      styles,
      "lineHeight"
    ) as CSSProperties["lineHeight"],
    padding: getStyleValue(
      styles,
      "padding"
    ) as CSSProperties["padding"],
    borderRadius: getStyleValue(
      styles,
      "borderRadius"
    ) as CSSProperties["borderRadius"],
    border: getStyleValue(styles, "border") as CSSProperties["border"],
    display: getStyleValue(
      styles,
      "display"
    ) as CSSProperties["display"],
    flexDirection: getStyleValue(
      styles,
      "flexDirection"
    ) as CSSProperties["flexDirection"],
    gap: getStyleValue(styles, "gap") as CSSProperties["gap"],
    alignItems: getStyleValue(
      styles,
      "alignItems"
    ) as CSSProperties["alignItems"],
    justifyContent: getStyleValue(
      styles,
      "justifyContent"
    ) as CSSProperties["justifyContent"],
    overflow: getStyleValue(
      styles,
      "overflow"
    ) as CSSProperties["overflow"]
  };
}

function renderChildren(children: ComponentNode[]): ReactNode {
  return children.map((child) =>
    createElement(
      Fragment,
      { key: child.id },
      renderNode(child)
    )
  );
}

export function renderNode(node: ComponentNode): ReactNode {
  const styles = getStyles(node);
  const props = node.props ?? {};
  const linkTo =
    typeof props.linkTo === "string" ? props.linkTo : "";

  let element: ReactNode;

  switch (node.type) {
    case "section":
      element = createElement(
        "section",
        {
          style: {
            width: "100%",
            boxSizing: "border-box",
            ...styles
          }
        },
        renderChildren(node.children)
      );
      break;

    case "heading":
      element = createElement(
        "h2",
        {
          style: styles
        },
        typeof props.text === "string" ? props.text : "Heading"
      );
      break;

    case "text":
      element = createElement(
        "p",
        {
          style: styles
        },
        typeof props.text === "string" ? props.text : "Text"
      );
      break;

    case "button":
      element = createElement(
        "button",
        {
          type: "button",
          style: styles
        },
        typeof props.text === "string" ? props.text : "Button"
      );
      break;

    case "image":
      element = createElement("img", {
        src:
          typeof props.src === "string" && props.src.length > 0
            ? props.src
            : "https://placehold.co/800x500?text=Image",
        alt: typeof props.alt === "string" ? props.alt : "",
        style: {
          display: "block",
          maxWidth: "100%",
          objectFit: "cover",
          ...styles
        }
      });
      break;

    default:
      element = null;
  }

  /*
   * Do not wrap arbitrary components in <span>.
   * A span around a section, heading, or other block element
   * can create invalid HTML and hydration problems.
   */
  if (linkTo && node.type !== "button") {
    return createElement(
      "a",
      {
        href: linkTo,
        style: {
          color: "inherit",
          textDecoration: "none",
          display: "contents"
        }
      },
      element
    );
  }

  return element;
}