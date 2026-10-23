-- ============================================================
-- Migration : informations légales de l'entreprise (factures)
-- Une seule ligne, modifiable depuis Paramètres.
-- À appliquer via Supabase > SQL Editor
-- ============================================================

create table if not exists entreprise (
  id          integer primary key check (id = 1),
  rccm        text not null default '',
  ifu         text not null default '',
  tva         text not null default '',
  updated_at  timestamptz not null default now()
);

insert into entreprise (id) values (1) on conflict (id) do nothing;

alter table entreprise enable row level security;

drop policy if exists "auth_entreprise" on entreprise;
create policy "auth_entreprise" on entreprise
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
