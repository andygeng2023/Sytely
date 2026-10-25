import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

type Node = { id: string; type: string; name: string; text: string; parentId: string | null; visible: boolean; locked: boolean; styles: Record<string, string | number | undefined> };
type Props = { nodes: Node[]; pageName: string; onToast: (message: string) => void };

async function sharePublishedSite(slug: string, onToast: (message: string) => void) {
  const url = new URL(window.location.href);
  url.searchParams.set("site", slug);
  const shareUrl = url.toString();
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(shareUrl);
    onToast(`Published. Link copied: ${shareUrl}`);
  } catch {
    onToast(`Published site: ${shareUrl}`);
  }
}

export function CloudAccount({ nodes, pageName, onToast }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Local only");
  const [projectId, setProjectId] = useState(() => {
    try { return window.localStorage.getItem("sytely:cloud-project:v1") ?? ""; } catch { return ""; }
  });

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user || nodes.length === 0) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setStatus("Saving to cloud…");
      try {
        let id = projectId;
        const slug = `site-${session.user.id.slice(0, 6)}-${Math.random().toString(36).slice(2, 7)}`;
        if (!id) {
          const { data, error } = await supabase!.from("sytely_projects").insert({
            owner_id: session.user.id, name: pageName || "My website", slug, document: { version: 1, nodes }
          }).select("id").single();
          if (error) throw error;
          id = data.id;
          setProjectId(id);
          try { window.localStorage.setItem("sytely:cloud-project:v1", id); } catch { /* optional */ }
        } else {
          const { error } = await supabase!.from("sytely_projects").update({
            name: pageName || "My website", document: { version: 1, nodes }
          }).eq("id", id);
          if (error) throw error;
        }
        if (!cancelled) setStatus("Cloud saved");
      } catch (error) {
        if (!cancelled) setStatus("Cloud save failed");
        console.error("Sytely cloud save failed", error);
      }
    }, 900);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [nodes, pageName, session?.user?.id]);

  useEffect(() => {
    const publish = async () => {
      if (!supabase || !session?.user) { setOpen(true); onToast("Sign in to publish your website"); return; }
      setBusy(true);
      try {
        let id = projectId;
        if (!id) {
          const slug = `site-${session.user.id.slice(0, 6)}-${Math.random().toString(36).slice(2, 7)}`;
          const { data, error } = await supabase.from("sytely_projects").insert({
            owner_id: session.user.id, name: pageName || "My website", slug,
            document: { version: 1, nodes }, published_document: { version: 1, nodes },
            is_published: true, published_at: new Date().toISOString()
          }).select("id,slug").single();
          if (error) throw error;
          id = data.id; setProjectId(id);
          try { window.localStorage.setItem("sytely:cloud-project:v1", id); } catch { /* optional */ }
          await sharePublishedSite(data.slug, onToast);
        } else {
          const { data: row, error: readError } = await supabase.from("sytely_projects").select("slug").eq("id", id).single();
          if (readError) throw readError;
          const { error } = await supabase.from("sytely_projects").update({
            name: pageName || "My website", document: { version: 1, nodes },
            published_document: { version: 1, nodes }, is_published: true, published_at: new Date().toISOString()
          }).eq("id", id);
          if (error) throw error;
          await sharePublishedSite(row.slug, onToast);
        }
        setStatus("Published");
      } catch (error) {
        console.error("Sytely publish failed", error);
        onToast(error instanceof Error ? `Publish failed: ${error.message}` : "Publish failed");
      } finally { setBusy(false); }
    };
    window.addEventListener("sytely:publish", publish);
    return () => window.removeEventListener("sytely:publish", publish);
  }, [session, projectId, nodes, pageName, onToast]);

  async function submitAuth(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    try {
      const result = mode === "sign-up"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (mode === "sign-up" && !result.data.session) onToast("Check your email to confirm your account");
      else onToast("Signed in to Sytely cloud");
      setOpen(false); setPassword("");
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Authentication failed");
    } finally { setBusy(false); }
  }

  return <>
    <button className="cloud-account-button" onClick={() => setOpen(true)} title="Cloud account">
      <span className={session ? "cloud-status-dot connected" : "cloud-status-dot"} />
      <span>{session ? session.user.email : "Cloud account"}</span>
    </button>
    {open && <div className="cloud-modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
      <section className="cloud-modal" role="dialog" aria-modal="true" aria-labelledby="cloud-title" onClick={event => event.stopPropagation()}>
        <button className="cloud-modal-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
        <h2 id="cloud-title">Sytely Cloud</h2>
        <p className="cloud-modal-copy">{isSupabaseConfigured ? status : "Cloud is not configured in this build. Local drafts remain available."}</p>
        {!isSupabaseConfigured ? <p>Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before building.</p>
          : session ? <><p>Signed in as <strong>{session.user.email}</strong></p><p>Cloud saves are automatic while signed in. Publish creates a public snapshot.</p><button className="cloud-primary" disabled={busy} onClick={() => { setOpen(false); window.dispatchEvent(new Event("sytely:publish")); }}>Publish current site</button><button className="cloud-secondary" disabled={busy} onClick={async () => { await supabase?.auth.signOut(); setProjectId(""); try { window.localStorage.removeItem("sytely:cloud-project:v1"); } catch { /* optional */ } setStatus("Local only"); }}>Sign out</button></>
          : <form onSubmit={submitAuth}><label>Email<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label><label>Password<input type="password" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} minLength={8} required value={password} onChange={e => setPassword(e.target.value)} /></label><button className="cloud-primary" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "sign-up" ? "Create account" : "Sign in"}</button><button className="cloud-secondary" type="button" onClick={() => setMode(mode === "sign-up" ? "sign-in" : "sign-up")}>{mode === "sign-up" ? "Already have an account? Sign in" : "New to Sytely? Create account"}</button></form>}
      </section>
    </div>}
  </>;
}
