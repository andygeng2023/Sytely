import React, { createElement, Fragment } from "react";
import type {
  Breakpoint,
  NodeStyle,
  SiteNode
} from "@sytely/types";

export interface RendererProps {
  nodes: SiteNode[];
  breakpoint?: Breakpoint;
  editable?: boolean;
  selectedIds?: string[];
  onSelect?: (id: string, event: React.MouseEvent) => void;
}

function mergeStyle(
  node: SiteNode,
  breakpoint: Breakpoint
): NodeStyle {
  return {
    ...(node.style ?? {}),
    ...(node.responsive?.[breakpoint] ?? {})
  };
}

function isHidden(node: SiteNode, breakpoint: Breakpoint) {
  return node.hidden?.[breakpoint] === true;
}

function LinkWrapper({
  href,
  children
}: {
  href?: string;
  children: React.ReactNode;
}) {
  if (!href) return <>{children}</>;

  return (
    <a
      href={href}
      style={{
        color: "inherit",
        textDecoration: "none"
      }}
    >
      {children}
    </a>
  );
}

function renderNode(
  node: SiteNode,
  breakpoint: Breakpoint,
  editable: boolean,
  selectedIds: string[],
  onSelect?: (id: string, event: React.MouseEvent) => void
): React.ReactNode {
  if (isHidden(node, breakpoint)) return null;

  const style = mergeStyle(node, breakpoint);
  const selected = selectedIds.includes(node.id);

  const commonProps = {
    style,
    "data-sytely-node": node.id,
    onClick: editable
      ? (event: React.MouseEvent) => {
          event.stopPropagation();
          onSelect?.(node.id, event);
        }
      : undefined
  };

  const children = node.children?.map((child) =>
    renderNode(
      child,
      breakpoint,
      editable,
      selectedIds,
      onSelect
    )
  );

  const editorStyle: React.CSSProperties = editable
    ? {
        outline: selected
          ? "2px solid #4c8dff"
          : "1px solid transparent",
        outlineOffset: -1,
        cursor: "pointer"
      }
    : {};

  const finalStyle = {
    ...style,
    ...editorStyle
  };

  switch (node.type) {
    case "section":
      return (
        <section
          {...commonProps}
          style={finalStyle}
        >
          {children}
        </section>
      );

    case "heading":
      return (
        <h2 {...commonProps} style={finalStyle}>
          {node.content || "Heading"}
          {children}
        </h2>
      );

    case "paragraph":
      return (
        <p {...commonProps} style={finalStyle}>
          {node.content || "Start writing here..."}
          {children}
        </p>
      );

    case "button":
      return (
        <div {...commonProps} style={finalStyle}>
          <LinkWrapper href={node.href}>
            <button
              type="button"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                background: "transparent",
                color: "inherit",
                font: "inherit",
                cursor: "pointer"
              }}
            >
              {node.content || "Button"}
            </button>
          </LinkWrapper>
          {children}
        </div>
      );

    case "image":
      return (
        <img
          {...commonProps}
          src={
            node.src ||
            "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80"
          }
          alt={node.alt || ""}
          style={{
            ...finalStyle,
            display: "block"
          }}
        />
      );

    case "video":
      return (
        <video
          {...commonProps}
          src={node.src}
          controls={!editable}
          style={finalStyle}
        />
      );

    case "divider":
      return (
        <hr
          {...commonProps}
          style={finalStyle}
        />
      );

    case "icon":
      return (
        <div {...commonProps} style={finalStyle}>
          {node.content || "★"}
          {children}
        </div>
      );

    case "logo":
      return (
        <div {...commonProps} style={finalStyle}>
          {node.content || "Sytely"}
          {children}
        </div>
      );

    case "menu":
      return (
        <nav {...commonProps} style={finalStyle}>
          {node.content || "Home   About   Contact"}
          {children}
        </nav>
      );

    case "social":
      return (
        <div {...commonProps} style={finalStyle}>
          {node.content || "Instagram   X   Facebook"}
          {children}
        </div>
      );

    case "form":
      return (
        <form {...commonProps} style={finalStyle}>
          <input
            placeholder="Email address"
            style={{
              width: "100%",
              padding: 12,
              marginBottom: 8
            }}
          />
          <button type="submit">Submit</button>
          {children}
        </form>
      );

    case "gallery":
      return (
        <div
          {...commonProps}
          style={{
            ...finalStyle,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: style.gap || "12px"
          }}
        >
          {[
            "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80"
          ].map((src) => (
            <img
              key={src}
              src={src}
              alt=""
              style={{
                width: "100%",
                aspectRatio: "1",
                objectFit: "cover",
                borderRadius: 8
              }}
            />
          ))}
          {children}
        </div>
      );

    case "group":
      return (
        <div {...commonProps} style={finalStyle}>
          {children}
        </div>
      );

    default:
      return (
        <Fragment>
          {children}
        </Fragment>
      );
  }
}

export function SytelyRenderer({
  nodes,
  breakpoint = "desktop",
  editable = false,
  selectedIds = [],
  onSelect
}: RendererProps) {
  return (
    <>
      {nodes.map((node) =>
        renderNode(
          node,
          breakpoint,
          editable,
          selectedIds,
          onSelect
        )
      )}
    </>
  );
}

export default SytelyRenderer;