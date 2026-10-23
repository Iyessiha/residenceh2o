-- ============================================================
-- Migration : numérotation des factures FAC-AAAA-NNN
-- Le numéro suivant est calculé dans la base, sous verrou, pour éviter
-- deux numéros identiques lors de saisies simultanées.
-- À appliquer via Supabase > SQL Editor
-- ============================================================

create or replace function prochain_numero_facture()
returns text
language plpgsql
as $$
declare
  annee text := to_char(now(), 'YYYY');
  dernier integer;
begin
  -- Verrou jusqu'à la fin de la transaction
  perform pg_advisory_xact_lock(hashtext('numero_facture'));

  select coalesce(max(substring(numero from '(\d+)$')::integer), 0)
    into dernier
    from factures
    where numero like 'FAC-' || annee || '-%';

  return 'FAC-' || annee || '-' || lpad((dernier + 1)::text, 3, '0');
end;
$$;
