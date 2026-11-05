-- Schéma minimal reproduisant les tables H2O utilisées par 20261106_crm_alertes.sql.
-- Sert uniquement aux tests locaux (PostgreSQL), jamais en production.

create schema if not exists auth;
create table if not exists auth.users (id uuid primary key default gen_random_uuid(), email text);

create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
create or replace function auth.role() returns text language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon')
$$;

do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
create publication supabase_realtime;

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text, nom text,
  role text not null default 'reception' check (role in ('admin', 'gerance', 'reception')),
  created_at timestamptz default now()
);
create table duplexes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null, nom text not null, tarif_nuit integer
);
create table chambres (
  id uuid primary key default gen_random_uuid(),
  nom text not null, tarif_nuit integer
);
create table clients (
  id uuid primary key default gen_random_uuid(),
  nom text not null, telephone text, email text,
  segment text not null default 'particulier' check (segment in ('particulier', 'entreprise', 'evenement')),
  adresse text, notes text, created_at timestamptz default now()
);
create table reservations (
  id uuid primary key default gen_random_uuid(),
  nom_client text not null, telephone text, email text,
  client_id uuid references clients(id) on delete set null,
  duplex_id text references duplexes(code) on delete set null,
  chambre_id uuid references chambres(id) on delete set null,
  date_arrivee date, date_depart date,
  montant_total integer,
  statut text not null default 'en_attente',
  type text not null default 'sejour',
  source text not null default 'manuel',
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table commandes_restaurant (
  id uuid primary key default gen_random_uuid(),
  nom_client text not null, table_num text,
  montant_total integer not null default 0,
  statut text not null default 'en_cours', created_at timestamptz default now()
);
create table ventes (
  id uuid primary key default gen_random_uuid(),
  nom_client text not null,
  montant_total integer not null default 0,
  statut text not null default 'payee', created_at timestamptz default now()
);

grant usage on schema public, auth to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant execute on all functions in schema auth to anon, authenticated;
-- Comme sur Supabase : les tables créées ensuite sont accessibles par défaut (la RLS filtre)
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;
