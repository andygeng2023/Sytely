# Sytely Studio

A React + TypeScript foundation for a visual website editor. The current implementation focuses on the editor shell, shared document state, direct canvas editing, contextual panels, and a first backend-workspace prototype.

## Getting started

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Build and type-check:

```bash
npm run typecheck
npm run build
```

## Implemented foundation

- Four-area editor: left tool rail, contextual workspace, central canvas, contextual inspector, plus top and bottom toolbars.
- Resizable side panels with pointer drag, double-click reset, keyboard resizing, collapse/expand, and mobile drawer behaviour.
- Searchable Add catalogue with Layout, Basic, Media, Interactive, Forms, and Data categories.
- Shared document-node state used by the canvas and Layers panel.
- Element selection, inline text editing, property/style changes, add, duplicate, delete, visibility, locking, and sibling reordering shortcuts.
- Undo/redo history, local draft save indicator, desktop/tablet/mobile canvas presets, zoom, preview mode, and layout guides.
- Inspector modes for Properties, Layout, Style, Responsive, Interactions, Backend, Accessibility, and Advanced.
- Backend workspace prototype with Blocks, Code, Data, Events, and Console tabs.
- Responsive editor layout, keyboard focus styles, and reduced-motion support.

## Current limitations

This is an editor foundation, not a production website builder yet. Persistence currently lives in memory; the save action marks the local draft as saved but does not write to a server or browser database. Publish is a placeholder. The block editor illustrates an event/action sequence but does not execute arbitrary code. Code editing is a local draft textarea rather than a syntax-highlighted IDE. Database connectors, authentication, collaboration, templates, asset uploads, and independently persisted responsive overrides are not connected.

## Architecture direction

Keep the document model independent from React rendering. As the project grows, move node types/schema, validated commands, undo history, serialization, and persistence into separate modules. Keep generated block logic separate from custom code modules, and introduce schema validation and automated tests before adding production data operations.
