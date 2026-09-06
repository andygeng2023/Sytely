export type ComponentType =
  | "section"
  | "heading"
  | "text"
  | "image"
  | "button";

export interface ComponentNode {
  id: string;
  type: ComponentType;
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
  children: ComponentNode[];
}

export interface SitePage {
  id: string;
  name: string;
  slug: string;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  components: ComponentNode[];
}

export interface Site {
  id: string;
  name: string;
  version: number;
  pages: SitePage[];
}