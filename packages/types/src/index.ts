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
  theme: SiteTheme;
  pages: SitePage[];
}

export interface SiteWorkspace {
  version: number;
  activeSiteId: string;
  sites: Site[];
}