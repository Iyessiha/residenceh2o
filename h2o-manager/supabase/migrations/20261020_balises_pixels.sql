-- Balises et pixels de suivi, gérés par les administrateurs depuis le manager.
-- Lecture publique des seules balises actives (elles sont de toute façon envoyées au navigateur).
create table if not exists balises_suivi (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null,
  type        text not null default 'pixel' check (type in ('balise', 'pixel')),
  emplacement text not null default 'head' check (emplacement in ('head', 'body')),
  code        text not null,
  actif       boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table balises_suivi enable row level security;

drop policy if exists "balises_public_read" on balises_suivi;
create policy "balises_public_read" on balises_suivi
  for select using (actif = true);

drop policy if exists "balises_admin_all" on balises_suivi;
create policy "balises_admin_all" on balises_suivi
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
