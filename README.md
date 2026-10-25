# Sytely Studio

Sytely Studio is a React + TypeScript visual website-editor prototype. It provides an editor shell, a sample website canvas, contextual workspace/inspector panels, and browser-local draft persistence.

## Open the editor on your computer

1. Install Node.js 20 or newer from https://nodejs.org/.
2. Download or clone this repository, then open a terminal in the project folder.
3. Run:

```bash
npm install
npm run dev
```

4. Open the local URL Vite prints, usually http://localhost:5173.

To verify the production bundle locally:

```bash
npm test
npm run build
npm run preview
```

The preview command is for checking the production build locally, not for serving production traffic.

## Deploy on GitHub Pages

The repository includes a GitHub Actions deployment workflow. After merging the changes into `main`:

1. Open the repository's **Settings → Pages**.
2. Set **Build and deployment → Source** to **GitHub Actions**.
3. Open **Actions** and watch the **Deploy Sytely to GitHub Pages** workflow.
4. When it succeeds, open **Settings → Pages** to see the published URL. For this repository it will normally be `https://andygeng2023.github.io/Sytely/`.

The workflow installs dependencies, runs smoke tests, builds the Vite app with the `/Sytely/` base path, and publishes the `dist` folder. Future pushes to `main` trigger redeployment.

## Deploy on InfinityFree or another static host

Sytely's frontend can be hosted as static files. Build it for a root-domain or subdomain deployment:

```bash
npm install
npm test
npm run build
```

Then upload the **contents of the generated `dist/` folder** (not the source folder) into the hosting account's web root, usually `htdocs` or `public_html`. Make sure `index.html` is directly in that web root. For a site hosted under a subdirectory, set `VITE_BASE_PATH` to that directory before building (for example, `VITE_BASE_PATH=/demo/`).

You need Node.js on your own computer to build the React app; the host only serves the generated HTML, CSS and JavaScript. The current editor does not require a server-side PHP process.

## Current limitations — read before production use

This release is **not a production-ready multi-user website builder**. The editor draft is saved to the current browser's `localStorage`; it is not uploaded to a server, synced across devices, backed up remotely, or associated with a user account. Clearing browser storage can remove a draft. Export or back up important work before relying on it.

The Publish control is not connected to a real publishing service. The backend Blocks tab is a visual prototype, not an execution engine. Data connectors, secure authentication, access controls, collaboration, asset uploads, database operations, and full accessibility/security testing are not implemented. Do not store secrets, credentials, or sensitive personal data in editor drafts.

## Features in this foundation

- Four-area workspace with resizable/collapsible panels and keyboard-resize controls.
- Element catalogue, shared canvas/layer node state, selection and inline text editing.
- Element insertion, duplication, deletion, visibility/locking, drag-and-drop and circular-move prevention.
- Undo/redo, responsive viewport presets, zoom, preview mode and keyboard shortcuts.
- Contextual inspector modes and a backend-workspace prototype.
- Browser-local draft persistence and workspace panel preferences.
- Vite production build, GitHub Pages workflow and editor smoke tests.

## Architecture direction

Keep the serialized document independent from the React component tree. Before launching a multi-user product, add a versioned schema and migration strategy, robust document commands and history, remote persistence with authentication and authorization, asset storage, executable logic sandboxing, end-to-end browser tests, and an independent security/accessibility review.
