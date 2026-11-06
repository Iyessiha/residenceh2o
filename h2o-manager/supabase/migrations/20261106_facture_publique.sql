-- ============================================================
-- Migration : récupération d'une facture par le client (QR code)
-- Le QR code de la facture ouvre /facture/<id>. L'identifiant (uuid aléatoire) sert de
-- secret : seule la facture demandée est renvoyée, jamais une liste. Aucune autre table
-- n'est ouverte au public ; les factures restent protégées par la RLS.
-- Idempotente. À appliquer via Supabase > SQL Editor
-- ============================================================

create or replace function facture_publique(p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'facture',    to_jsonb(f),
    'entreprise', (select jsonb_build_object('rccm', e.rccm, 'ifu', e.ifu, 'tva', e.tva,
                                             'tva_taux', e.tva_taux, 'taxes', e.taxes)
                     from entreprise e where e.id = 1)
  )
  from factures f
  where f.id = p_id
    and f.statut <> 'brouillon'
$$;

revoke all on function facture_publique(uuid) from public;
grant execute on function facture_publique(uuid) to anon, authenticated;
