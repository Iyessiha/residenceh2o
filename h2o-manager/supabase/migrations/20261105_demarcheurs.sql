-- ============================================================
-- Migration : démarcheurs (apporteurs de clients)
-- Un démarcheur amène des clients ; il touche un pourcentage (10 % par défaut).
-- Les clients de segment « entreprise » ont un nom, un contact et une adresse.
-- À appliquer via Supabase > SQL Editor
-- ============================================================

create table if not exists demarcheurs (
  id           uuid primary key default gen_random_uuid(),
  nom          text not null,
  prenom       text not null default '',
  telephone    text not null default '',
  pourcentage  numeric(5,2) not null default 10,
  notes        text,
  created_at   timestamptz not null default now()
);

alter table demarcheurs enable row level security;

drop policy if exists "demarcheurs_auth" on demarcheurs;
create policy "demarcheurs_auth" on demarcheurs
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Contact de l'entreprise (personne à joindre) et démarcheur qui a apporté le client
alter table clients add column if not exists contact text not null default '';
alter table clients add column if not exists demarcheur_id uuid references demarcheurs(id) on delete set null;

create index if not exists clients_demarcheur_idx on clients(demarcheur_id);
