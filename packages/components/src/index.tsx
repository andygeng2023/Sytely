export const COMPONENT_TYPES = [
  "section",
  "heading",
  "text",
  "image",
  "button"
] as const;

export type ComponentPaletteType = (typeof COMPONENT_TYPES)[number];