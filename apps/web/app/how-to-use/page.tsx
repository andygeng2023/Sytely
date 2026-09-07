import Link from "next/link";

import "../marketing.css";

const steps = [
  ["01", "Start with a canvas", "Create a site from My Sites and choose the device view you want to shape first."],
  ["02", "Build with real components", "Drag sections, headings, media, forms, and navigation into the page. Every element remains editable."],
  ["03", "Compose the layout", "Drop items beside one another to create responsive columns, or into a section to keep the hierarchy clear."],
  ["04", "Refine every breakpoint", "Switch between desktop, tablet, and mobile, then use the inspector for spacing, sizing, content, and visual details."],
  ["05", "Preview and publish", "Fit the canvas, zoom into the details, preview the real rendered page, and save when the site is ready."],
];

export default function HowToUsePage() {
  return (
    <main className="marketing">
      <header>
        <Link className="marketing-brand" href="/">Sytely</Link>
        <nav>
          <Link href="/how-to-use">How to use</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/mysites">Open builder</Link>
        </nav>
      </header>
      <section className="marketing-main">
        <span className="marketing-eyebrow">A CALM, CAPABLE WORKFLOW</span>
        <h1>From first block to finished site.</h1>
        <p className="marketing-lede">Sytely keeps the visual freedom of a design tool and the structure of a proper website. Build quickly, then keep control when the details matter.</p>
        <ol className="marketing-steps">
          {steps.map(([number, title, text]) => (
            <li key={number}><b>{number}</b><div><strong>{title}</strong><p>{text}</p></div></li>
          ))}
        </ol>
        <Link className="marketing-cta" href="/mysites">Start building</Link>
      </section>
    </main>
  );
}
