-- ============================================================
-- Migration : réservations à la journée + options (extras) de séjour
-- - mode_sejour : 'nuit' (défaut) ou 'journee' ; heures d'arrivée / de départ pour la journée
-- - options     : lignes [{ "nom": "Petit-déjeuner", "prix": 5000, "qte": 2 }] ajoutées au montant
-- - options_sejour : catalogue des options (nom, prix) géré depuis le formulaire de réservation
-- Idempotente. À coller (le texte, pas le chemin) dans Supabase > SQL Editor.
-- ============================================================

alter table reservations add column if not exists mode_sejour text not null default 'nuit';
alter table reservations drop constraint if exists reservations_mode_sejour_check;
alter table reservations add constraint reservations_mode_sejour_check check (mode_sejour in ('nuit', 'journee'));
alter table reservations add column if not exists heure_arrivee time;
alter table reservations add column if not exists heure_depart time;
alter table reservations add column if not exists options jsonb not null default '[]'::jsonb;

create table if not exists options_sejour (
  id         uuid primary key default gen_random_uuid(),
  nom        text not null,
  prix       integer not null default 0 check (prix >= 0),
  actif      boolean not null default true,
  created_at timestamptz not null default now()
);
alter table options_sejour enable row level security;
drop policy if exists options_sejour_equipe on options_sejour;
create policy options_sejour_equipe on options_sejour for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

notify pgrst, 'reload schema';
