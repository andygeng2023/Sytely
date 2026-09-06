import Link from "next/link";
import "./home.css";

const features = [
  {
    title: "Visual editing",
    text: "Build pages directly on a visual canvas with sections, components, groups, and responsive layouts."
  },
  {
    title: "Flexible layouts",
    text: "Control spacing, alignment, sizing, positioning, backgrounds, borders, and typography without writing code."
  },
  {
    title: "Reusable building blocks",
    text: "Start from templates or add individual components whenever you need them."
  }
];

const templates = [
  "Business",
  "Portfolio",
  "SaaS",
  "Restaurant",
  "Landing page",
  "Blog"
];

export default function HomePage() {
  return (
    <main className="home">
      <nav className="home-nav">
        <Link href="/" className="home-brand">
          <span className="home-brand-mark">S</span>
          <span>Sytely</span>
        </Link>

        <div className="home-nav-links">
          <a href="#features">Features</a>
          <a href="#templates">Templates</a>
        </div>

        <Link href="/editor" className="home-nav-button">
          Open Editor
        </Link>
      </nav>

      <section className="home-hero">
        <div className="home-hero-copy">
          <div className="home-eyebrow">THE VISUAL WEBSITE BUILDER</div>

          <h1>
            Build your website
            <br />
            <span>without the complexity.</span>
          </h1>

          <p>
            Design polished websites visually with sections, components,
            responsive layouts, templates, and a powerful editor.
          </p>

          <div className="home-actions">
            <Link href="/editor" className="home-primary-button">
              Start building
              <span>→</span>
            </Link>

            <Link href="/preview" className="home-secondary-button">
              Preview Sytely
            </Link>
          </div>

          <div className="home-meta">
            <span>Visual editor</span>
            <span>Responsive</span>
            <span>No code required</span>
          </div>
        </div>

        <div className="home-editor-preview">
          <div className="preview-window">
            <div className="preview-window-bar">
              <div className="preview-dots">
                <i />
                <i />
                <i />
              </div>

              <div className="preview-address">sytely.app/editor</div>
            </div>

            <div className="preview-editor">
              <aside className="preview-left">
                <div className="preview-small-title">ADD</div>
                <div className="preview-tool active">Components</div>
                <div className="preview-tool">Templates</div>
                <div className="preview-tool">Pages</div>
                <div className="preview-tool">Layers</div>
              </aside>

              <div className="preview-canvas-area">
                <div className="preview-topbar">
                  <span>Home</span>
                  <span>Desktop</span>
                  <span>100%</span>
                </div>

                <div className="preview-canvas">
                  <div className="preview-site">
                    <div className="preview-site-nav">
                      <strong>Sytely</strong>
                      <span>Home</span>
                      <span>About</span>
                      <span>Contact</span>
                      <b>Get started</b>
                    </div>

                    <div className="preview-site-hero">
                      <small>BUILD SOMETHING GREAT</small>
                      <h2>Make your next idea real.</h2>
                      <p>
                        A clean visual website built with Sytely.
                      </p>
                      <button>Get started</button>
                    </div>

                    <div className="preview-cards">
                      <div />
                      <div />
                      <div />
                    </div>
                  </div>
                </div>
              </div>

              <aside className="preview-right">
                <div className="preview-inspector-title">Design</div>
                <div className="preview-control">
                  <span>Width</span>
                  <b>100%</b>
                </div>
                <div className="preview-control">
                  <span>Padding</span>
                  <b>48</b>
                </div>
                <div className="preview-control">
                  <span>Radius</span>
                  <b>16</b>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="home-section">
        <div className="home-section-heading">
          <span>WHY SYTELY</span>
          <h2>Everything you need to design a real website.</h2>
        </div>

        <div className="home-feature-grid">
          {features.map((feature, index) => (
            <article className="home-feature" key={feature.title}>
              <div className="home-feature-number">
                0{index + 1}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="templates" className="home-templates">
        <div>
          <span className="home-section-label">START FASTER</span>
          <h2>Choose a starting point.</h2>
          <p>
            Start with a complete site template or build everything from
            individual components.
          </p>
        </div>

        <div className="home-template-list">
          {templates.map((template) => (
            <Link
              href="/editor"
              className="home-template"
              key={template}
            >
              <span>{template}</span>
              <b>→</b>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-cta">
        <div>
          <span>READY TO BUILD?</span>
          <h2>Your next website starts here.</h2>
        </div>

        <Link href="/editor" className="home-primary-button">
          Open Sytely
          <span>→</span>
        </Link>
      </section>

      <footer className="home-footer">
        <span>© {new Date().getFullYear()} Sytely</span>
        <span>Visual website builder</span>
      </footer>
    </main>
  );
}