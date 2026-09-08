export type ComponentType =
  | "section"
  | "heading"
  | "text"
  | "button"
  | "image"
  | "video"
  | "gallery"
  | "divider"
  | "icon"
  | "logo"
  | "menu"
  | "social"
  | "form"
  | "card"
  | "features"
  | "pricing"
  | "testimonial"
  | "faq"
  | "contact"
  | "footer";

export type SiteTheme = "system" | "light" | "dark";

export type NodeStyles = Record<string, unknown>;

export type LayoutMode =
  | "inherit"
  | "sytely"
  | "custom";

export interface CustomPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface ComponentNode {
  id: string;
  type: ComponentType;
  props: Record<string, unknown>;
  styles?: NodeStyles;
  children?: ComponentNode[];

  /**
   * inherit = use the nearest parent's mode
   * sytely = responsive flow layout
   * custom = freeform absolute positioning
   */
  layoutMode?: LayoutMode;

  customPosition?: CustomPosition;
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
  slug?: string;
  version: number;
  theme: SiteTheme;
  layoutMode: "sytely" | "custom";
  pages: SitePage[];
}

export interface SiteWorkspace {
  version: number;
  activeSiteId: string;
  sites: Site[];
}