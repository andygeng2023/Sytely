import Link from "next/link";

import "./home.css";

export default function HomePage() {
  return (
    <main className="home">
      <header>
        <Link
          href="/"
          className="home-brand"
        >
          Sytely
        </Link>

        <nav>
          <Link href="/how-to-use">
            How to use
          </Link>

          <Link href="/pricing">
            Pricing
          </Link>

          <Link href="/faq">
            FAQ
          </Link>

          <Link href="/mysites">
            Open builder
          </Link>
        </nav>
      </header>

      <section className="hero">
        <div>
          <span className="eyebrow">
            VISUAL WEBSITE BUILDER
          </span>

          <h1>
            Build websites without
            the usual complexity.
          </h1>

          <p>
            Drag real components onto a
            responsive canvas, arrange them
            into columns, edit their content,
            pan and zoom freely, then preview
            the actual page.
          </p>

          <div className="actions">
            <Link href="/mysites">
              Open Sytely
            </Link>

            <a href="#features">
              See how it works
            </a>
          </div>
        </div>

        <div className="mock">
          <div className="mock-top">
            <b>
              Sytely / Editor
            </b>

            <span>
              Desktop&nbsp;&nbsp; Tablet&nbsp;&nbsp; Mobile
            </span>
          </div>

          <div className="mock-body">
            <aside />

            <div className="mock-page">
              <i />

              <h3>
                Build something
                people remember
              </h3>

              <p>
                Visual editing.
                Responsive structure.
                No code.
              </p>

              <button>
                Get started
              </button>

              <div className="mock-cols">
                <span />
                <span />
                <span />
              </div>
            </div>

            <aside className="mock-right" />
          </div>
        </div>
      </section>

      <section
        id="features"
        className="section"
      >
        <span className="eyebrow">
          CORE EDITING
        </span>

        <h2>
          Everything stays a real
          component.
        </h2>

        <div className="grid">
          {[
            [
              "Direct selection",
              "Select the actual heading, button, image or section — no fake editor wrapper around the element.",
            ],
            [
              "Natural columns",
              "Drop a component beside another component and Sytely turns the section into a responsive multi-column layout.",
            ],
            [
              "Free canvas",
              "Zoom in, zoom out and pan around large pages without losing your place.",
            ],
            [
              "Responsive",
              "Desktop, tablet and mobile use the same page structure with breakpoint-aware layout rules.",
            ],
            [
              "Pages and sites",
              "Manage websites separately at My Sites and keep pages organized inside each site.",
            ],
            [
              "Undo and save",
              "Use keyboard shortcuts, duplicate, reorder, group, ungroup and save the complete site.",
            ],
          ].map(
            ([title, text]) => (
              <article
                key={title}
              >
                <strong>
                  {title}
                </strong>

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
        <div>
          <span className="eyebrow">
            WORKFLOW
          </span>

          <h2>
            Place things where they
            belong.
          </h2>

          <p>
            Drag from the component
            library, move existing
            elements before or after
            siblings, or drop into a
            container. The editor computes
            the layout from the same
            component tree used by preview.
          </p>
        </div>

        <ol>
          <li>
            <b>01</b>
            <span>
              Add a section.
            </span>
          </li>

          <li>
            <b>02</b>
            <span>
              Drop components inside.
            </span>
          </li>

          <li>
            <b>03</b>
            <span>
              Drop beside components
              to create columns.
            </span>
          </li>

          <li>
            <b>04</b>
            <span>
              Refine and preview.
            </span>
          </li>
        </ol>
      </section>

      <section className="final">
        <span className="eyebrow">
          START BUILDING
        </span>

        <h2>
          Open your website
          workspace.
        </h2>

        <Link href="/mysites">
          My websites
        </Link>
      </section>
    </main>
  );
}