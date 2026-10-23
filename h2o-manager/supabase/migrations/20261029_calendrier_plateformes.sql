-- ============================================================
-- Migration : calendrier et réservations Airbnb / Booking
-- Les réservations des plateformes sont saisies dans le manager et bloquent les dates.
-- À appliquer via Supabase > SQL Editor
-- ============================================================

-- Nouvelles origines de réservation
alter table reservations drop constraint if exists reservations_source_check;
alter table reservations add constraint reservations_source_check
  check (source in ('site_web', 'whatsapp', 'telephone', 'manuel', 'airbnb', 'booking'));

-- Lien vers la chambre (les villas restent reliées par duplex_id)
alter table reservations add column if not exists chambre_id uuid references chambres(id) on delete set null;
create index if not exists idx_reservations_chambre on reservations(chambre_id);
