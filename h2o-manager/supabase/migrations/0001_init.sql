-- ============================================================
-- H2O Manager — Schéma Supabase initial
-- Résidences H2O · MonWe Infinity LLC · 2026
-- Coller ce script dans l'éditeur SQL de ton projet Supabase
-- ============================================================

-- Activer l'extension UUID
create extension if not exists "uuid-ossp";

-- ========================
-- TABLE: profiles (rôles)
-- ========================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  nom text,
  role text not null default 'reception' check (role in ('admin', 'gerance', 'reception')),
  created_at timestamptz default now()
);

-- Trigger: créer un profil à chaque nouvel utilisateur auth
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ========================
-- TABLE: duplexes
-- ========================
create table if not exists duplexes (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,            -- ex: D-1, D-2, D-3
  nom text not null,                    -- ex: Duplex Lac
  capacite integer not null default 2,
  surface_m2 integer,
  tarif_nuit integer,                   -- FCFA
  description text,
  statut text not null default 'disponible'
    check (statut in ('disponible', 'occupe', 'maintenance')),
  created_at timestamptz default now()
);

-- Données initiales
insert into duplexes (code, nom, capacite, surface_m2, tarif_nuit, description, statut)
values
  ('D-1', 'Duplex Lac', 4, 80, 120000, 'Vue panoramique sur le lac, piscine privée 20m², pontoon', 'disponible'),
  ('D-2', 'Duplex Jardin', 6, 100, 150000, 'Jardin privatif, 2 chambres, piscine privée 15m²', 'disponible'),
  ('D-3', 'Duplex Premium', 8, 140, 220000, 'Vue 360°, grande piscine 30m², pontoon & jacuzzi', 'disponible')
on conflict (code) do nothing;

-- ========================
-- TABLE: clients
-- ========================
create table if not exists clients (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  telephone text,
  email text,
  segment text not null default 'particulier'
    check (segment in ('particulier', 'entreprise', 'evenement')),
  adresse text,
  notes text,
  created_at timestamptz default now()
);

-- ========================
-- TABLE: reservations
-- ========================
create table if not exists reservations (
  id uuid primary key default uuid_generate_v4(),
  nom_client text not null,
  telephone text,
  email text,
  client_id uuid references clients(id) on delete set null,
  duplex_id text references duplexes(code) on delete set null,
  date_arrivee date,
  date_depart date,
  nb_personnes integer,
  montant_total integer,                -- FCFA
  statut text not null default 'en_attente'
    check (statut in ('en_attente', 'confirme', 'en_sejour', 'cloture', 'annule')),
  type text not null default 'sejour'
    check (type in ('sejour', 'evenement', 'renseignement')),
  source text not null default 'manuel'
    check (source in ('site_web', 'whatsapp', 'telephone', 'manuel')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========================
-- TABLE: evenements
-- ========================
create table if not exists evenements (
  id uuid primary key default uuid_generate_v4(),
  nom_client text not null,
  telephone text,
  email text,
  client_id uuid references clients(id) on delete set null,
  type_evenement text not null default 'mariage'
    check (type_evenement in ('mariage', 'anniversaire', 'bapteme', 'seminaire', 'fete_privee', 'autre')),
  espace text not null default 'pergola'
    check (espace in ('pergola', 'jardins', 'full_site')),
  date_evenement date,
  heure_debut time,
  nb_invites integer,
  montant_devis integer,               -- FCFA
  acompte integer default 0,           -- FCFA reçu
  statut text not null default 'en_attente'
    check (statut in ('en_attente', 'confirme', 'en_cours', 'termine', 'annule')),
  notes text,
  created_at timestamptz default now()
);

-- ========================
-- TABLE: factures
-- ========================
create table if not exists factures (
  id uuid primary key default uuid_generate_v4(),
  numero text unique,
  nom_client text not null,
  telephone text,
  client_id uuid references clients(id) on delete set null,
  reservation_id uuid references reservations(id) on delete set null,
  evenement_id uuid references evenements(id) on delete set null,
  type_prestation text not null default 'sejour'
    check (type_prestation in ('sejour', 'evenement', 'restauration', 'autre')),
  description text,
  montant_total integer not null,      -- FCFA
  montant_paye integer not null default 0,
  statut text not null default 'brouillon'
    check (statut in ('brouillon', 'envoye', 'paye', 'partiel', 'impaye')),
  date_echeance date,
  created_at timestamptz default now()
);

-- ========================
-- RLS (Row Level Security)
-- ========================
alter table profiles enable row level security;
alter table duplexes enable row level security;
alter table clients enable row level security;
alter table reservations enable row level security;
alter table evenements enable row level security;
alter table factures enable row level security;

-- Profils: chaque utilisateur voit son propre profil
create policy "profiles_own" on profiles
  for all using (auth.uid() = id);

-- Toutes les tables métier: accès uniquement aux utilisateurs authentifiés
create policy "duplexes_auth" on duplexes
  for all using (auth.role() = 'authenticated');

create policy "clients_auth" on clients
  for all using (auth.role() = 'authenticated');

create policy "reservations_auth" on reservations
  for all using (auth.role() = 'authenticated');

create policy "evenements_auth" on evenements
  for all using (auth.role() = 'authenticated');

create policy "factures_auth" on factures
  for all using (auth.role() = 'authenticated');

-- Politique spéciale pour le site public (insert réservation depuis le site)
-- À activer SEULEMENT si tu veux recevoir les réservations web sans auth
-- Utilise la service_role_key dans h2o-landing pour éviter de l'exposer
create policy "reservations_public_insert" on reservations
  for insert with check (source = 'site_web');

-- ========================
-- INDEX
-- ========================
create index if not exists reservations_statut_idx on reservations(statut);
create index if not exists reservations_date_idx on reservations(date_arrivee);
create index if not exists evenements_date_idx on evenements(date_evenement);
create index if not exists factures_statut_idx on factures(statut);
create index if not exists clients_nom_idx on clients(nom);
