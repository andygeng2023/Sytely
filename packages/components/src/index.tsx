export const COMPONENT_TYPES = [
  "section",
  "heading",
  "text",
  "button",
  "image",
  "video",
  "gallery",
  "divider",
  "icon",
  "logo",
  "menu",
  "social",
  "form",
  "card",
  "features",
  "pricing",
  "testimonial",
  "faq",
  "contact",
  "footer",
] as const;

export type ComponentPaletteType =
  (typeof COMPONENT_TYPES)[number];