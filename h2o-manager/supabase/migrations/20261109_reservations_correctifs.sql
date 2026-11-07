-- ============================================================
-- Migration : correctifs « Nouvelle réservation »
-- 1. Type « chambre » autorisé (la base ne connaissait que sejour / evenement / renseignement :
--    toute réservation d'une chambre à la nuit était refusée).
-- 2. Avance versée (reste à payer = montant_total - avance).
-- 3. Entreprise rattachée à la réservation (comme le démarcheur).
-- Idempotente. À coller (le texte, pas le chemin) dans Supabase > SQL Editor.
-- Prérequis : 20261106_crm_alertes.sql déjà appliquée (tables demarcheurs / entreprises).
-- ============================================================

do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'public.reservations'::regclass and contype = 'c'
       and pg_get_constraintdef(oid) like '%renseignement%'
  loop
    execute format('alter table public.reservations drop constraint %I', c.conname);
  end loop;
end $$;

alter table reservations add constraint reservations_type_check
  check (type in ('sejour', 'chambre', 'evenement', 'renseignement'));

alter table reservations add column if not exists avance integer not null default 0;
alter table reservations drop constraint if exists reservations_avance_positive;
alter table reservations add constraint reservations_avance_positive check (avance >= 0);

alter table reservations add column if not exists entreprise_id uuid references entreprises(id) on delete set null;
create index if not exists reservations_entreprise_idx on reservations(entreprise_id);
