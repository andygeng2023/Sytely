export type ComponentType =
  | "section"
  | "heading"
  | "text"
  | "image"
  | "button";

export type NodeStyles = Record<string, unknown>;

export interface ComponentNode {
  id: string;
  type: ComponentType;
  props: Record<string, unknown>;
  styles?: NodeStyles;
  children?: ComponentNode[];
}

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface SitePage {
  id: string;
  name: string;
  slug: string;
  margins: PageMargins;
  styles?: NodeStyles;
  components: ComponentNode[];
}

export interface Site {
  id: string;
  name: string;
  version: number;
  pages: SitePage[];
}