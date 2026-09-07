import Link from "next/link";
import "./home.css";

const features = [
  [
    "Visual canvas",
    "Drag, arrange and edit real components directly on the page.",
  ],
  [
    "Responsive design",
    "Preview desktop, tablet and mobile layouts from one editor.",
  ],
  [
    "Pages and layers",
    "Organize pages and inspect the complete component tree.",
  ],
  [
    "Editable sections",
    "Use ready-made sections while keeping every element editable.",
  ],
  [
    "Multiple websites",
    "Manage separate websites from one simple workspace.",
  ],
  [
    "Local-first",
    "Your current workspace persists in the browser without a backend requirement.",
  ],
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

          <Link href="/mysites">
            My Sites
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
            Design responsive pages on
            a visual canvas, edit
            components directly, and
            keep separate websites
            organized in one workspace.
          </p>

          <div className="hero-actions">
            <Link
              href="/mysites"
              className="hero-primary"
            >
              Open Sytely
            </Link>

            <a
              href="#features"
              className="hero-secondary"
            >
              Explore features
            </a>
          </div>
        </div>

        <div className="hero-window">
          <div className="window-bar">
            <i />
            <i />
            <i />
          </div>

          <div className="window-layout">
            <aside />

            <div className="window-canvas">
              <b />
              <span />

              <div>
                <i />
                <i />
                <i />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="feature-section"
      >
        <div className="section-heading">
          <span>
            BUILT FOR VISUAL WORK
          </span>

          <h2>
            Everything important stays
            close to the canvas.
          </h2>
        </div>

        <div className="feature-grid">
          {features.map(
            ([title, description]) => (
              <article key={title}>
                <b>{title}</b>

                <p>
                  {description}
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
        <span>
          WORKFLOW
        </span>

        <h2>
          Choose a website. Edit it.
          Preview it. Save it.
        </h2>

        <p>
          The editor is site-specific,
          so the workspace stays focused
          on the website you are actually
          building.
        </p>

        <Link href="/mysites">
          Go to My Sites →
        </Link>
      </section>
    </main>
  );
}