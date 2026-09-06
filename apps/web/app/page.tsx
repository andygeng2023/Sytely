import Link from "next/link";
import "./home.css";

const features = [
  [
    "Visual canvas",
    "Drag, arrange, resize and align normal components directly on the page."
  ],
  [
    "Reusable sections",
    "Start from polished sections and keep nesting flexible without container components."
  ],
  [
    "Pages and layers",
    "Manage multiple pages, inspect the layer tree and keep navigation organized."
  ],
  [
    "Responsive design",
    "Switch desktop, tablet and mobile views while keeping the same visual structure."
  ],
  [
    "Themes",
    "Choose System, Light or Dark per page so the site can follow the visitor's device preference."
  ],
  [
    "Multiple websites",
    "Keep separate sites in the same local workspace and switch between them instantly."
  ]
];

const templates = [
  "Hero",
  "Split",
  "Features",
  "Stats",
  "CTA"
];

export default function HomePage() {
  return (
    <main className="home-page">
      <header className="home-nav">
        <Link
          href="/"
          className="home-brand"
        >
          Sytely
        </Link>

        <nav>
          <a href="#features">
            Features
          </a>
          <a href="#workflow">
            Workflow
          </a>
          <a href="#templates">
            Templates
          </a>
          <Link href="/editor">
            Open editor
          </Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            VISUAL WEBSITE BUILDER
          </span>

          <h1>
            Build websites without
            the usual complexity.
          </h1>

          <p>
            Design pages on a visual
            canvas, organize real
            components, manage multiple
            pages and preview the result
            without leaving Sytely.
          </p>

          <div className="hero-actions">
            <Link
              href="/editor"
              className="cta-button"
            >
              Open the editor
            </Link>

            <a
              href="#features"
              className="secondary-button"
            >
              Explore features
            </a>
          </div>

          <div className="hero-meta">
            <span>
              Drag and drop
            </span>
            <span>
              Responsive views
            </span>
            <span>
              System themes
            </span>
          </div>
        </div>

        <div className="hero-editor">
          <div className="mock-top">
            <span />
            <span />
            <span />
            <b>
              Sytely / Editor
            </b>
          </div>

          <div className="mock-body">
            <aside>
              <i />
              <i />
              <i />
              <i />
            </aside>

            <section>
              <div className="mock-toolbar">
                Home
                <small>
                  1180px
                </small>
                <em>
                  72%
                </em>
              </div>

              <div className="mock-page">
                <div className="mock-hero">
                  <small>
                    SECTION
                  </small>

                  <h3>
                    Build something
                    people remember
                  </h3>

                  <p>
                    Create polished
                    websites visually.
                  </p>

                  <button>
                    Get started
                  </button>
                </div>

                <div className="mock-cards">
                  <div />
                  <div />
                  <div />
                </div>
              </div>
            </section>

            <aside className="mock-inspector">
              <b>
                Design
              </b>
              <span />
              <span />
              <span />
              <span />
            </aside>
          </div>
        </div>
      </section>

      <section className="stats-row">
        <div>
          <strong>
            Visual
          </strong>
          <span>
            editing first
          </span>
        </div>

        <div>
          <strong>
            Multi-site
          </strong>
          <span>
            workspace
          </span>
        </div>

        <div>
          <strong>
            3 views
          </strong>
          <span>
            desktop · tablet · mobile
          </span>
        </div>

        <div>
          <strong>
            System
          </strong>
          <span>
            theme support
          </span>
        </div>
      </section>

      <section
        id="features"
        className="feature-section"
      >
        <div className="section-heading">
          <span className="eyebrow">
            WHY SYTELY
          </span>

          <h2>
            A cleaner foundation
            for website building.
          </h2>

          <p>
            The editor is designed
            around normal website
            structure rather than a pile
            of special layout primitives.
          </p>
        </div>

        <div className="feature-grid">
          {features.map(
            ([title, text], index) => (
              <article key={title}>
                <span className="feature-number">
                  0{index + 1}
                </span>

                <h3>
                  {title}
                </h3>

                <p>
                  {text}
                </p>
              </article>
            )
          )}
        </div>
      </section>

      <section
        id="workflow"
        className="workflow"
      >
        <div className="workflow-copy">
          <span className="eyebrow">
            WORKFLOW
          </span>

          <h2>
            From blank page to
            published structure.
          </h2>

          <p>
            Add a section, drop
            components into it, adjust
            spacing and alignment,
            switch breakpoints, then
            preview the actual page.
          </p>

          <ol>
            <li>
              <b>01</b>
              <span>
                Add a section or starter
                template.
              </span>
            </li>

            <li>
              <b>02</b>
              <span>
                Drag components where
                they belong.
              </span>
            </li>

            <li>
              <b>03</b>
              <span>
                Refine design, layout
                and position.
              </span>
            </li>

            <li>
              <b>04</b>
              <span>
                Preview the same
                component sizing
                visitors receive.
              </span>
            </li>
          </ol>
        </div>

        <div className="workflow-card">
          <div className="workflow-window">
            <div className="window-title">
              Page Design
            </div>

            <div className="setting">
              <span>
                Theme
              </span>
              <strong>
                System
              </strong>
            </div>

            <div className="setting">
              <span>
                Background
              </span>
              <strong>
                var(--page)
              </strong>
            </div>

            <div className="setting">
              <span>
                Margins
              </span>
              <strong>
                32 / 32
              </strong>
            </div>

            <div className="setting">
              <span>
                Responsive
              </span>
              <strong>
                Desktop
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section
        id="templates"
        className="templates-section"
      >
        <div className="section-heading">
          <span className="eyebrow">
            STARTER SECTIONS
          </span>

          <h2>
            Useful starting points,
            not locked layouts.
          </h2>
        </div>

        <div className="template-grid">
          {templates.map(
            (name, index) => (
              <Link
                href="/editor"
                className="template-preview"
                key={name}
              >
                <span>
                  0{index + 1}
                </span>

                <div
                  className={`template-art art-${index}`}
                >
                  <i />
                  <i />
                  <i />
                </div>

                <strong>
                  {name}
                </strong>

                <small>
                  Open in editor
                </small>
              </Link>
            )
          )}
        </div>
      </section>

      <section className="final-cta">
        <span className="eyebrow">
          START BUILDING
        </span>

        <h2>
          Your next website can start
          with a blank canvas.
        </h2>

        <p>
          Keep the structure simple.
          Add the details when you
          need them.
        </p>

        <Link
          href="/editor"
          className="cta-button"
        >
          Open Sytely
        </Link>
      </section>

      <footer className="home-footer">
        <strong>
          Sytely
        </strong>

        <span>
          Visual website building,
          without the clutter.
        </span>

        <Link href="/editor">
          Editor
        </Link>
      </footer>
    </main>
  );
}