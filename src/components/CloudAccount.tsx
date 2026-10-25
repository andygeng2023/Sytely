import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

type Node = { id: string; type: string; name: string; text: string; parentId: string | null; visible: boolean; locked: boolean; href?: string; openInNewTab?: boolean; src?: string; ariaLabel?: string; semantic?: string; interaction?: { trigger: "click"; action: "navigatePage" | "scrollTo" | "toggleVisibility" | "setText"; targetId?: string; targetPageId?: string; value?: string }; styles: Record<string, string | number | undefined>; responsive?: Record<string, Record<string, string | number | undefined> | undefined> };
type PageSnapshot = { id: string; name: string; nodes: Node[] };
type CloudProject = { id: string; name: string; slug: string; document: unknown; is_published: boolean; updated_at: string };
type Props = { nodes: Node[]; pages: PageSnapshot[]; activePageId: string; pageName: string; onToast: (message: string) => void; onLoadProject: (project: { id: string; name: string; document: unknown }) => void; onCreateProject: () => void };

async function sharePublishedSite(slug: string, onToast: (message: string) => void) {
  const url = new URL(window.location.href);
  url.searchParams.set("site", slug);
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(url.toString());
    onToast(`Published. Link copied: ${url.toString()}`);
  } catch { onToast(`Published site: ${url.toString()}`); }
}

export function CloudAccount({ nodes, pages, activePageId, pageName, onToast, onLoadProject, onCreateProject }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Local only");
  const [projects, setProjects] = useState<CloudProject[]>([]);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectError, setProjectError] = useState("");
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectId, setProjectId] = useState(() => {
    try { return window.localStorage.getItem("sytely:cloud-project:v1") ?? ""; } catch { return ""; }
  });

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  async function refreshProjects() {
    if (!supabase || !session?.user) return;
    setProjectsLoading(true);
    setProjectError("");
    try {
      const { data, error } = await supabase.from("sytely_projects").select("id,name,slug,document,is_published,updated_at")
        .eq("owner_id", session.user.id).order("updated_at", { ascending: false }).limit(100);
      if (error) { setProjectError("Could not load projects. Check your connection and try again."); return; }
      setProjects((data ?? []) as CloudProject[]);
    } finally { setProjectsLoading(false); }
  }

  useEffect(() => {
    if (open && session?.user) void refreshProjects();
  }, [open, session?.user?.id]);

  useEffect(() => {
    if (!supabase || !session?.user || nodes.length === 0) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const projectPages = pages.map(page => page.id === activePageId ? { ...page, nodes } : page);
      const document = { version: 2, nodes, pages: projectPages, activePageId };
      setStatus("Saving to cloud…");
      try {
        let id = projectId;
        const slug = `site-${session.user.id.slice(0, 6)}-${Math.random().toString(36).slice(2, 7)}`;
        if (!id) {
          const { data, error } = await supabase!.from("sytely_projects").insert({ owner_id: session.user.id, name: pageName || "My website", slug, document }).select("id").single();
          if (error) throw error;
          id = data.id; setProjectId(id);
          try { window.localStorage.setItem("sytely:cloud-project:v1", id); } catch { /* optional */ }
        } else {
          const { error } = await supabase!.from("sytely_projects").update({ name: pageName || "My website", document }).eq("id", id);
          if (error) throw error;
        }
        if (!cancelled) setStatus("Cloud saved");
      } catch (error) {
        if (!cancelled) setStatus("Cloud save failed");
        console.error("Sytely cloud save failed", error);
      }
    }, 900);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [nodes, pages, activePageId, pageName, session?.user?.id, projectId]);

  useEffect(() => {
    const publish = async () => {
      if (!supabase || !session?.user) { setOpen(true); onToast("Sign in to publish your website"); return; }
      const projectPages = pages.map(page => page.id === activePageId ? { ...page, nodes } : page);
      const document = { version: 2, nodes, pages: projectPages, activePageId };
      setBusy(true);
      try {
        let id = projectId;
        if (!id) {
          const slug = `site-${session.user.id.slice(0, 6)}-${Math.random().toString(36).slice(2, 7)}`;
          const { data, error } = await supabase.from("sytely_projects").insert({ owner_id: session.user.id, name: pageName || "My website", slug, document, published_document: document, is_published: true, published_at: new Date().toISOString() }).select("id,slug").single();
          if (error) throw error;
          id = data.id; setProjectId(id);
          try { window.localStorage.setItem("sytely:cloud-project:v1", id); } catch { /* optional */ }
          await sharePublishedSite(data.slug, onToast);
        } else {
          const { data: row, error: readError } = await supabase.from("sytely_projects").select("slug").eq("id", id).single();
          if (readError) throw readError;
          const { error } = await supabase.from("sytely_projects").update({ name: pageName || "My website", document, published_document: document, is_published: true, published_at: new Date().toISOString() }).eq("id", id);
          if (error) throw error;
          await sharePublishedSite(row.slug, onToast);
        }
        setStatus("Published"); await refreshProjects();
      } catch (error) {
        console.error("Sytely publish failed", error);
        onToast(error instanceof Error ? `Publish failed: ${error.message}` : "Publish failed");
      } finally { setBusy(false); }
    };
    window.addEventListener("sytely:publish", publish);
    return () => window.removeEventListener("sytely:publish", publish);
  }, [session, projectId, nodes, pages, activePageId, pageName, onToast]);

  async function submitAuth(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    try {
      const result = mode === "sign-up" ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (mode === "sign-up" && !result.data.session) onToast("Check your email to confirm your account");
      else onToast("Signed in to Sytely cloud");
      setPassword("");
      if (result.data.session) { setSession(result.data.session); setMode("sign-in"); setStatus("Cloud connected"); await refreshProjects(); }
    } catch (error) { onToast(error instanceof Error ? error.message : "Authentication failed"); }
    finally { setBusy(false); }
  }

  function startNewProject() {
    setProjectId("");
    try { window.localStorage.removeItem("sytely:cloud-project:v1"); } catch { /* optional */ }
    setStatus("Creating a new project…"); onCreateProject(); setOpen(false); onToast("New project started");
  }

  function openProject(project: CloudProject) {
    setProjectId(project.id);
    try { window.localStorage.setItem("sytely:cloud-project:v1", project.id); } catch { /* optional */ }
    onLoadProject({ id: project.id, name: project.name, document: project.document });
    setStatus(`Opened ${project.name}`); setOpen(false); onToast(`Opened “${project.name}”`);
  }

  async function deleteProject(project: CloudProject) {
    if (!supabase || !window.confirm(`Delete “${project.name}” permanently? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("sytely_projects").delete().eq("id", project.id);
      if (error) throw error;
      setProjects(current => current.filter(item => item.id !== project.id));
      if (project.id === projectId) startNewProject();
      else onToast(`Deleted “${project.name}”`);
    } catch (error) { onToast(error instanceof Error ? `Could not delete project: ${error.message}` : "Could not delete project"); }
    finally { setBusy(false); }
  }

  const filteredProjects = projects.filter(project => project.name.toLowerCase().includes(projectSearch.trim().toLowerCase()));

  return <>
    <button className="cloud-account-button" onClick={() => setOpen(true)} title="Cloud account">
      <span className={session ? "cloud-status-dot connected" : "cloud-status-dot"} /><span>{session ? session.user.email : "Cloud account"}</span>
    </button>
    {open && <div className="cloud-modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
      <section className="cloud-modal cloud-dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="cloud-title" onClick={event => event.stopPropagation()}>
        <button className="cloud-modal-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
        <h2 id="cloud-title">Sytely Cloud</h2>
        <p className="cloud-modal-copy">{isSupabaseConfigured ? status : "Cloud is not configured in this build. Local drafts remain available."}</p>
        {!isSupabaseConfigured ? <p>Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before building.</p>
          : session ? <>
            <div className="cloud-account-summary"><span className="cloud-status-dot connected" /><span>Signed in as <strong>{session.user.email}</strong></span></div>
            <div className="cloud-project-toolbar"><h3>Your projects</h3><button className="cloud-new-project" disabled={busy} onClick={startNewProject}>＋ New project</button></div>
            <label className="cloud-project-search">Search projects<input value={projectSearch} onChange={event => setProjectSearch(event.target.value)} placeholder="Search by project name…" /></label>
            <div className="cloud-project-list" aria-label="Cloud projects">
              {projectError && <p className="cloud-project-error" role="alert">{projectError} <button onClick={() => void refreshProjects()}>Retry</button></p>}
              {!projectError && projectsLoading && projects.length === 0 && <div className="cloud-project-empty">Loading your projects…</div>}{!projectError && !projectsLoading && projects.length === 0 && <div className="cloud-project-empty"><strong>No cloud projects yet</strong><span>Create your first project to start building a site.</span></div>}
              {!projectError && projects.length > 0 && filteredProjects.length === 0 && <div className="cloud-project-empty">No projects match that search.</div>}
              {filteredProjects.map(project => <article className={project.id === projectId ? "cloud-project-row current" : "cloud-project-row"} key={project.id}>
                <button className="cloud-project-open" disabled={busy} onClick={() => openProject(project)}>
                  <span className="cloud-project-glyph">S</span><span className="cloud-project-copy"><strong>{project.name}</strong><small>{project.is_published ? "Published" : "Draft"} · Updated {new Date(project.updated_at).toLocaleDateString()}</small></span>
                  {project.id === projectId ? <span className="cloud-current-label">Current</span> : <span className="cloud-open-label">Open</span>}
                </button>
                <button className="cloud-project-delete" aria-label={`Delete ${project.name}`} title="Delete project" disabled={busy} onClick={() => void deleteProject(project)}>×</button>
              </article>)}
            </div>
            <p className="cloud-dashboard-note">Projects are private to your account until you publish them.</p>
            <button className="cloud-primary" disabled={busy} onClick={() => { setOpen(false); window.dispatchEvent(new Event("sytely:publish")); }}>Publish current site</button>
            <button className="cloud-secondary" disabled={busy} onClick={async () => { await supabase?.auth.signOut(); setSession(null); setProjects([]); setProjectId(""); try { window.localStorage.removeItem("sytely:cloud-project:v1"); } catch { /* optional */ } setStatus("Local only"); }}>Sign out</button>
          </>
          : <form onSubmit={submitAuth}><label>Email<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label><label>Password<input type="password" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} minLength={8} required value={password} onChange={e => setPassword(e.target.value)} /></label><button className="cloud-primary" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "sign-up" ? "Create account" : "Sign in"}</button><button className="cloud-secondary" type="button" onClick={() => setMode(mode === "sign-up" ? "sign-in" : "sign-up")}>{mode === "sign-up" ? "Already have an account? Sign in" : "New to Sytely? Create account"}</button></form>}
      </section>
    </div>}
  </>;
}
