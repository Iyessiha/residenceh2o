-- ============================================================
-- Migration : taxes sur les factures
-- tva_taux : taux de TVA en % (0 = pas de TVA)
-- taxes    : autres taxes [{ "nom": "...", "taux": 5 }] en % du HT
-- Les montants saisis sont TTC : le HT et chaque taxe sont calculés sur la facture.
-- À appliquer via Supabase > SQL Editor
-- ============================================================

alter table entreprise add column if not exists tva_taux numeric(5,2) not null default 0;
alter table entreprise add column if not exists taxes jsonb not null default '[]'::jsonb;
