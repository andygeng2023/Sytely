-- Keep the published-site RPC as SECURITY INVOKER while exposing only published snapshots.
drop policy if exists "Public can read published site snapshots" on public.sytely_projects;
create policy "Public can read published site snapshots"
  on public.sytely_projects for select to anon
  using (is_published = true);

grant select (name, slug, published_document, published_at, is_published)
  on public.sytely_projects to anon;

create or replace function public.get_sytely_published_site(site_slug text)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'name', p.name,
    'slug', p.slug,
    'document', p.published_document,
    'published_at', p.published_at
  )
  from public.sytely_projects p
  where p.slug = site_slug and p.is_published = true
  limit 1;
$$;

revoke all on function public.get_sytely_published_site(text) from public;
grant execute on function public.get_sytely_published_site(text) to anon, authenticated;
