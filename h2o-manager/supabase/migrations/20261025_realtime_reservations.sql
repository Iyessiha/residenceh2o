-- ============================================================
-- Migration : notifications temps réel des réservations du site
-- Le manager reçoit un évènement à chaque nouvelle demande.
-- À appliquer via Supabase > SQL Editor
-- ============================================================

do $$
begin
  alter publication supabase_realtime add table reservations;
exception when duplicate_object then null;
end $$;
