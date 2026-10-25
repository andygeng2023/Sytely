create extension if not exists pgcrypto;

create table if not exists public.sytely_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Untitled website' check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  document jsonb not null default '{"version":1,"nodes":[]}'::jsonb check (jsonb_typeof(document) = 'object'),
  published_document jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists sytely_projects_owner_updated_idx
  on public.sytely_projects (owner_id, updated_at desc);
create index if not exists sytely_projects_public_slug_idx
  on public.sytely_projects (slug) where is_published = true;

alter table public.sytely_projects enable row level security;

create policy "Owners can read their projects"
  on public.sytely_projects for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "Owners can create their projects"
  on public.sytely_projects for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy "Owners can update their projects"
  on public.sytely_projects for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "Owners can delete their projects"
  on public.sytely_projects for delete to authenticated
  using ((select auth.uid()) = owner_id);

-- Public site reads expose only the immutable publication snapshot, not draft data.
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

-- Automatically maintain updated_at.
create or replace function public.set_sytely_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sytely_projects_updated_at on public.sytely_projects;
create trigger sytely_projects_updated_at
before update on public.sytely_projects
for each row execute function public.set_sytely_updated_at();

grant select, insert, update, delete on public.sytely_projects to authenticated;
