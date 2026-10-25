import { useMemo } from "react";
import { Accessibility, AlertCircle, ArrowRight, CheckCircle2, Info, ShieldCheck, TriangleAlert } from "lucide-react";

type AuditNode = {
  id: string;
  type: string;
  name: string;
  text: string;
  parentId: string | null;
  visible: boolean;
  href?: string;
  ariaLabel?: string;
  semantic?: string;
  src?: string;
  interaction?: { action: string };
  styles?: { color?: string; background?: string; fontSize?: number };
};
type AuditPage = { id: string; name: string; nodes: AuditNode[] };
type Issue = { id: string; severity: "error" | "warning" | "info"; title: string; detail: string; pageId: string; pageName: string; nodeId?: string; nodeName?: string };
type Props = { pages: AuditPage[]; onSelect: (pageId: string, nodeId: string) => void };

function luminance(color?: string): number | null {
  if (!color || !/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) return null;
  const raw = color.slice(1);
  const hex = raw.length === 3 ? raw.split("").map(char => char + char).join("") : raw;
  const channels = [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground?: string, background?: string): number | null {
  const fg = luminance(foreground);
  const bg = luminance(background);
  if (fg === null || bg === null) return null;
  return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
}

function inspectSite(pages: AuditPage[]): Issue[] {
  const issues: Issue[] = [];
  for (const page of pages) {
    const visible = page.nodes.filter(node => node.visible);
    const headings = visible.filter(node => node.type === "heading");
    const primaryHeadings = headings.filter(node => node.semantic !== "h2" && node.semantic !== "h3");
    if (primaryHeadings.length === 0) {
      issues.push({ id: `${page.id}:missing-h1`, severity: "error", title: "Add a primary heading", detail: "Give this page one clear H1 so visitors and assistive technology can understand its purpose.", pageId: page.id, pageName: page.name });
    } else if (primaryHeadings.length > 1) {
      for (const node of primaryHeadings.slice(1)) {
        issues.push({ id: `${page.id}:${node.id}:extra-h1`, severity: "warning", title: "Review primary heading level", detail: "This heading is rendered as H1. Use H2 or H3 for supporting sections.", pageId: page.id, pageName: page.name, nodeId: node.id, nodeName: node.name });
      }
    }
    for (const node of visible) {
      if (["heading", "paragraph", "button", "feature"].includes(node.type)) {
        const ratio = contrastRatio(node.styles?.color, node.styles?.background);
        const threshold = node.type === "heading" && (node.styles?.fontSize ?? 16) >= 24 ? 3 : 4.5;
        if (ratio !== null && ratio < threshold) {
          issues.push({ id: `${page.id}:${node.id}:contrast`, severity: "warning", title: "Text contrast may be too low", detail: `The explicit text/background colors have a contrast ratio of ${ratio.toFixed(2)}:1. Aim for at least ${threshold}:1 for this text size.`, pageId: page.id, pageName: page.name, nodeId: node.id, nodeName: node.name });
        }
      }
      if (node.type === "image" && !node.text.trim()) {
        issues.push({ id: `${page.id}:${node.id}:alt`, severity: "error", title: "Image needs alternative text", detail: "Describe the meaningful information in this image, or use empty alt text only if it is purely decorative.", pageId: page.id, pageName: page.name, nodeId: node.id, nodeName: node.name });
      }
      if (node.type === "image" && !node.src?.trim()) {
        issues.push({ id: `${page.id}:${node.id}:source`, severity: "warning", title: "Image source is missing", detail: "Add an image URL or upload an image before publishing.", pageId: page.id, pageName: page.name, nodeId: node.id, nodeName: node.name });
      }
      if (node.type === "heading" && !node.text.trim()) {
        issues.push({ id: `${page.id}:${node.id}:empty-heading`, severity: "error", title: "Heading has no text", detail: "Add descriptive heading text or remove the empty heading.", pageId: page.id, pageName: page.name, nodeId: node.id, nodeName: node.name });
      }
      if (node.type === "button" && !node.text.trim() && !node.ariaLabel?.trim()) {
        issues.push({ id: `${page.id}:${node.id}:button-label`, severity: "error", title: "Button needs an accessible name", detail: "Add visible button text or an accessible label that describes its action.", pageId: page.id, pageName: page.name, nodeId: node.id, nodeName: node.name });
      }
      if (node.type === "button" && !node.href?.trim() && !node.interaction) {
        issues.push({ id: `${page.id}:${node.id}:button-action`, severity: "warning", title: "Button has no action", detail: "Set a destination URL or configure an interaction so the control does something.", pageId: page.id, pageName: page.name, nodeId: node.id, nodeName: node.name });
      }
      if (node.type === "paragraph" && !node.text.trim()) {
        issues.push({ id: `${page.id}:${node.id}:empty-copy`, severity: "info", title: "Empty text element", detail: "Remove this unused paragraph or add its content.", pageId: page.id, pageName: page.name, nodeId: node.id, nodeName: node.name });
      }
    }
    const hasH2 = headings.some(node => node.semantic === "h2");
    if (!hasH2 && headings.length > 2) {
      issues.push({ id: `${page.id}:heading-outline`, severity: "info", title: "Review the heading outline", detail: "Several headings are present but none are marked H2. A clear outline helps readers scan the page.", pageId: page.id, pageName: page.name });
    }
  }
  return issues;
}

export function SiteAudit({ pages, onSelect }: Props) {
  const issues = useMemo(() => inspectSite(pages), [pages]);
  const errors = issues.filter(issue => issue.severity === "error").length;
  const warnings = issues.filter(issue => issue.severity === "warning").length;
  const score = Math.max(0, 100 - errors * 12 - warnings * 5 - issues.filter(issue => issue.severity === "info").length);
  return <section className="site-audit" aria-label="Site quality audit">
    <div className="panel-heading"><div><h2>Site audit</h2><p>Actionable checks across every page.</p></div><Accessibility size={19}/></div>
    <div className="audit-score-card">
      <div className="audit-score-ring" aria-label={`Quality score ${score} out of 100`}><strong>{score}</strong><span>/100</span></div>
      <div><strong>{issues.length === 0 ? "Looking good" : `${issues.length} items to review`}</strong><p>{errors} errors · {warnings} warnings</p><small>Heuristic checks, not a legal compliance certification.</small></div>
    </div>
    <div className="audit-summary-row">
      <span><AlertCircle size={13}/> {errors} errors</span><span><TriangleAlert size={13}/> {warnings} warnings</span><span><Info size={13}/> {issues.filter(issue => issue.severity === "info").length} tips</span>
    </div>
    <div className="audit-issue-list">
      {issues.length === 0 ? <div className="audit-empty"><CheckCircle2 size={22}/><strong>No issues found in these checks</strong><p>Preview every breakpoint and test the published experience before launch.</p></div> : issues.map(issue => {
        const Icon = issue.severity === "error" ? AlertCircle : issue.severity === "warning" ? TriangleAlert : Info;
        return <article className={`audit-issue ${issue.severity}`} key={issue.id}>
          <span className="audit-issue-icon"><Icon size={15}/></span>
          <div className="audit-issue-copy"><strong>{issue.title}</strong><p>{issue.detail}</p><small>{issue.pageName}{issue.nodeName ? ` · ${issue.nodeName}` : ""}</small></div>
          {issue.nodeId && <button className="audit-fix-button" onClick={() => onSelect(issue.pageId, issue.nodeId!)} aria-label={`Select ${issue.nodeName} to fix ${issue.title}`} title="Select element to fix"><ArrowRight size={15}/></button>}
        </article>;
      })}
    </div>
    <div className="audit-footer"><ShieldCheck size={14}/><span>Run this audit before every publish. It complements, not replaces, manual keyboard and screen-reader testing.</span></div>
  </section>;
}
