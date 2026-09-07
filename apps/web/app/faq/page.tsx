import Link from "next/link";

import "../marketing.css";

const questions = [
  ["Is Sytely really no-code?", "Yes. Pages are composed from visual components and edited with the library, canvas, and inspector. The rendered output is driven by the same component tree you edit."],
  ["Can I make responsive sites?", "Yes. Desktop, tablet, and mobile views share the page structure while letting you tune layout and sizing for each device."],
  ["What does zoom and pan do?", "Fit centers the complete working page in the editor. Use the slider or Ctrl/Cmd-wheel to zoom, and Shift-drag or middle-drag to move around the canvas."],
  ["Can I manage multiple pages?", "Yes. Add pages from the Pages panel, rename them, switch between them, and preview a specific route."],
  ["Can I bring my own images?", "Use the image inspector to upload local image files. Sytely keeps the content attached to the selected component while you continue editing."],
  ["Where does my work go?", "The current workspace saves sites in your browser so you can iterate immediately without configuring a backend first."],
];

export default function FaqPage() {
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
        <span className="marketing-eyebrow">A FEW GOOD ANSWERS</span>
        <h1>Questions, made less mysterious.</h1>
        <p className="marketing-lede">The short version of how Sytely works today, with enough detail to help you decide whether it belongs in your workflow.</p>
        <div className="faq-list">
          {questions.map(([question, answer]) => (
            <details key={question}><summary>{question}</summary><p>{answer}</p></details>
          ))}
        </div>
        <Link className="marketing-cta" href="/mysites">Try the builder</Link>
      </section>
    </main>
  );
}
