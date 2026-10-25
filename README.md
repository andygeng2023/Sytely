# Sytely Studio

Sytely Studio is a React + TypeScript visual website editor prototype with local drafts, Supabase email/password authentication, owner-scoped cloud draft storage, and a public renderer for published snapshots.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

For verification and a local production preview:

```bash
npm test
npm run build
npm run preview
```

The app includes the public Supabase project URL and publishable browser key as defaults. These values are designed for client-side use; authorization depends on Supabase Auth and row-level security. Never put a Supabase service-role key or other server secret in frontend code.

## Supabase backend

Project: `Sytely Production` (`syylksyuulzljivcvopo`), region `eu-west-1`.

The applied database migration creates `public.sytely_projects`, owner-based RLS policies, and a published-site RPC. Anonymous users can read only published snapshots; draft documents and owner identifiers are not granted to the anonymous role. The database security advisor was checked after applying the policy changes.

The editor supports email/password sign-in and sign-up from **Cloud account**. While signed in, the current document is automatically saved to the user's cloud project. **Publish** stores a public snapshot; the resulting link uses `?site=<slug>` on the same frontend host.

Before using real accounts, open Supabase Dashboard → **Authentication → URL Configuration** and set:
- **Site URL** to the deployed editor URL, for example `https://andygeng2023.github.io/Sytely/`.
- **Redirect URLs** to include that deployed URL and `http://localhost:5173/**` for local development.

Email confirmation settings depend on your Supabase Auth configuration. For production, configure an appropriate email provider, recovery flow, rate limits, and account policies. No service-role key is required in the browser.

## Deploy on GitHub Pages

The GitHub Actions workflow builds and deploys the static frontend on pushes to `main`. In repository **Settings → Pages**, set the source to **GitHub Actions**. The expected URL is `https://andygeng2023.github.io/Sytely/`; use it only after the workflow and Pages deployment succeed.

GitHub Pages serves static files. Supabase provides the remote database and authentication. This repository's Pages deployment has not been declared production-verified until the CI/build and live deployment checks pass.

## Deploy on InfinityFree or another static host

```bash
npm install
npm test
npm run build
```

Upload the **contents of `dist/`** to the host's web root (often `htdocs` or `public_html`). For a root domain, build with the default base path. For a subdirectory, set `VITE_BASE_PATH` to that path (for example `VITE_BASE_PATH=/demo/`). Configure the same deployed URL in Supabase Authentication → URL Configuration.

## Current limitations

This is an early-stage visual editor, not yet a fully production-ready website-builder product. The cloud layer currently saves one active project per browser profile and does not yet provide a project dashboard, switch/load/delete project flows, custom domains, image uploads, a real export pipeline, multi-page routing, collaboration, or executable backend/event blocks. The published renderer supports the current node schema, not arbitrary custom HTML or application code.

The Publish action stores a snapshot in Supabase and renders it at a query-string URL on the same host; it does not generate a standalone export or a separate custom-domain site. Test and build status must be confirmed in GitHub Actions before merging or relying on the deployment. Do not store secrets or sensitive personal information in page content.

## Included editor capabilities

- Visual element catalogue, selection, inline content editing, and contextual inspector.
- Element insertion, duplication, deletion, visibility/locking, drag-and-drop, and circular-move prevention.
- Undo/redo, responsive viewport presets, zoom, preview mode, and keyboard shortcuts.
- Browser-local draft persistence and workspace panel preferences.
- Supabase email/password authentication and owner-scoped cloud draft saving.
- Public published snapshot renderer with anonymous access limited by RLS.
- Vite production build, GitHub Pages workflow, and editor smoke tests.
