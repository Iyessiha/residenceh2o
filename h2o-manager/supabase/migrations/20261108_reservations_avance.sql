-- Avance versée à la réservation ; le reste à payer = montant_total - avance (réglé à l'arrivée)
-- Idempotente. À coller dans Supabase > SQL Editor
alter table reservations add column if not exists avance integer not null default 0;
alter table reservations drop constraint if exists reservations_avance_positive;
alter table reservations add constraint reservations_avance_positive check (avance >= 0);
