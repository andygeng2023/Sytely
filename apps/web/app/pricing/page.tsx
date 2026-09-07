import Link from "next/link";

import "../marketing.css";

const plans = [
  ["Starter", "$0", "For exploring the visual workflow.", "1 site, core components, responsive preview"],
  ["Studio", "$12", "For creators shipping polished sites.", "Unlimited pages, advanced layout controls, version history"],
  ["Team", "$29", "For teams building together.", "Shared workspaces, roles, reusable sections, priority support"],
];

export default function PricingPage() {
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
        <span className="marketing-eyebrow">SIMPLE BY DEFAULT</span>
        <h1>Room to grow, without the noise.</h1>
        <p className="marketing-lede">Start free and move up when your workflow needs more space. Every plan keeps the editor fast, visual, and easy to understand.</p>
        <div className="marketing-grid pricing-grid">
          {plans.map(([name, price, description, features], index) => (
            <article className={`marketing-card pricing-card ${index === 1 ? "featured" : ""}`} key={name}>
              <strong>{name}</strong>
              <div className="price">{price}</div>
              <span className="price-note">per editor / month</span>
              <p>{description}</p>
              <p>{features}</p>
              <Link className="marketing-cta" href="/mysites">Choose {name}</Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
