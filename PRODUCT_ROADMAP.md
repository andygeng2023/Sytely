# Sytely product roadmap

## Product ambition

Build a website studio that beats established builders on **time-to-quality**: creators should be able to go from idea to a polished, accessible, responsive, portable website with less repetitive work and fewer hidden platform constraints.

This is a product direction, not a claim that Sytely currently matches Webflow's breadth. Ship in verified increments; don't market a capability until its end-to-end path is tested.

## Product principles

1. **Visual first, portable by default.** Editing should feel direct, and users should be able to take their content and markup with them.
2. **Quality is built in.** Responsive checks, accessibility findings, safe interactions, and publish validation should be part of the normal workflow rather than a separate audit project.
3. **A real project model.** Projects, pages, assets, reusable components, publication state, and history must be explicit and recoverable.
4. **Progressive power.** Beginners get sensible defaults; advanced users get design tokens, layout control, data binding, and predictable export.
5. **Trust before automation.** No hidden destructive changes, no execution of untrusted custom code, clear save state, recoverable edits, and owner-scoped data access.

## Milestones

### 1. Multi-site workflow and quality guardrails — in progress

- Cloud project dashboard with create/open/search/delete and publication status.
- Restore the active page when reopening a project.
- Site-wide actionable audit for missing image text/source, headings, empty copy, and button actions.
- Keep project access owner-scoped and run unit, build, security-audit, and browser tests before merge.

**Acceptance:** create two projects, switch between them without overwriting either, reload and verify content/page state, delete one with confirmation, and publish/open the remaining project. Audit findings must jump to the exact element.

### 2. Design system and asset workflow

- Global color, typography, spacing, radius, and shadow tokens with semantic names.
- Apply tokens across pages; changing a token updates every linked use.
- Component variants and detach/reset controls, with explicit instance-vs-master behavior.
- Asset library with image upload, alt text, replacement, usage references, and safe deletion.
- Responsive preview matrix and overflow diagnostics at common breakpoints.

**Acceptance:** token edits propagate consistently to the canvas, preview, published renderer, and exported HTML. Asset references remain valid after reload and project switching.

### 3. Content management and data binding

- User-owned collections with schema, validation, create/edit/delete, and sample data.
- Bind text, links, images, and lists to collection fields through a typed UI.
- Dynamic detail pages and collection templates with empty/loading/error states.
- Import/export structured content in a documented format.

**Acceptance:** CRUD, permissions, empty states, and bound content work after refresh and in published sites; invalid data never breaks rendering.

### 4. Publish like a product, not a demo

- Clear draft vs published versions and preview links.
- Custom domains, DNS status, HTTPS, redirects, and deploy health checks.
- SEO title/description, canonical URL, social preview, sitemap, robots policy, and image metadata.
- Working accessible forms with spam protection, delivery status, and privacy-conscious analytics.
- Version history, restore, and reliable rollback of a bad publication.

**Acceptance:** publish is repeatable, status is truthful, rollback is tested, and users can identify what is public before sharing.

### 5. Collaboration and expert workflows

- Invites and explicit roles/permissions, comments anchored to elements, review links.
- Conflict-safe edits and presence indicators before claiming real-time collaboration.
- Command palette, multi-select editing, batch actions, reusable presets, and keyboard-complete workflows.
- Optional AI assistance for structured page drafts, copy alternatives, responsive fixes, and accessibility remediation—with preview and approval before changes apply.

**Acceptance:** permission boundaries are tested, concurrent edits cannot silently overwrite work, and AI changes are reviewable and reversible.

## Release gates

Every milestone must pass:

- Unit tests for state transitions, invalid saved data, and destructive operations.
- TypeScript and production build.
- Browser E2E for desktop and mobile, including create/edit/reload/publish/export flows where relevant.
- Security review of authorization, RLS, uploads, URL handling, and any AI or third-party integration.
- Accessibility review with keyboard navigation and a screen reader; automated audit scores are hints, not compliance certification.
- Export parity checks so editor preview, published sites, and standalone HTML don't silently diverge.

## Measures of progress

Track outcomes rather than feature counts:

- Time from blank project to publishable first draft.
- Percentage of audit findings resolved before publish.
- Successful project restore/switch rates without data loss.
- Publish and export success rate.
- Core Web Vitals and mobile layout defects on generated sites.
- Number of tasks a user can complete without leaving the editor.

## Explicit non-goals for early milestones

Do not add arbitrary JavaScript execution, silently rewrite user designs, claim WCAG compliance from a heuristic score, promise custom-domain hosting before deploy infrastructure exists, or implement collaboration without conflict and authorization guarantees.
