export type NodeType =
  | "section"
  | "heading"
  | "paragraph"
  | "button"
  | "image"
  | "video"
  | "gallery"
  | "divider"
  | "icon"
  | "social"
  | "form"
  | "menu"
  | "logo"
  | "group";

export type Breakpoint = "desktop" | "tablet" | "mobile";

export type Align = "left" | "center" | "right" | "stretch";
export type VerticalAlign = "top" | "center" | "bottom";

export interface ResponsiveValue<T> {
  desktop?: T;
  tablet?: T;
  mobile?: T;
}

export interface NodeStyle {
  display?: "block" | "flex" | "grid";
  position?: "relative" | "absolute";
  width?: string;
  height?: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;

  flexDirection?: "row" | "column";
  justifyContent?: "flex-start" | "center" | "flex-end" | "space-between";
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
  gap?: string;

  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;

  borderTop?: string;

  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;

  background?: string;
  color?: string;
  border?: string;
  borderRadius?: string;
  boxShadow?: string;

  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  textAlign?: "left" | "center" | "right";

  opacity?: number;
  overflow?: "visible" | "hidden";
  objectFit?: "cover" | "contain";

  alignSelf?: Align;
  verticalAlign?: VerticalAlign;

  zIndex?: number;

  maxWidth?: string;
  padding?: string;
}

export interface SiteNode {
  id: string;
  type: NodeType;
  name?: string;
  content?: string;
  src?: string;
  href?: string;
  alt?: string;
  style?: NodeStyle;
  responsive?: Partial<Record<Breakpoint, NodeStyle>>;
  hidden?: ResponsiveValue<boolean>;
  children?: SiteNode[];
}

export interface PageSettings {
  title: string;
  slug: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  noIndex?: boolean;
}

export interface SitePage {
  id: string;
  name: string;
  settings: PageSettings;
  components: SiteNode[];
}

export interface Site {
  id: string;
  name: string;
  pages: SitePage[];
  theme: {
    primaryColor: string;
    fontFamily: string;
  };
}