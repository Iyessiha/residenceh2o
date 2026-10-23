-- ============================================================
-- Migration : photos des villas et des chambres
-- Adresses publiques des photos (bucket « galerie » ou galerie du site).
-- La première photo sert de couverture. À appliquer via Supabase > SQL Editor
-- ============================================================

alter table duplexes add column if not exists photos text[] not null default '{}';
alter table chambres add column if not exists photos text[] not null default '{}';
