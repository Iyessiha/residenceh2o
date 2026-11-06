-- ============================================================
-- Migration : facture générée automatiquement pour chaque commande Restaurant & Bar
-- - À l'enregistrement d'une commande (saisie interne ou portail client), une facture
--   est créée dans « factures » (type Restauration, numéro FAC-AAAA-NNN).
-- - Si la commande est modifiée (articles, total, statut), la facture non encaissée suit.
-- - Si la commande est annulée ou supprimée, sa facture est supprimée tant qu'elle n'est
--   pas encaissée (statut Payé ou Partiel : elle est conservée).
-- Le lien commande ↔ facture est le repère « Commande restaurant n° XXXXXXXX » placé
-- au début de la description (utilisé aussi par le bouton « Facture » de l'application).
-- Idempotente. À appliquer via Supabase > SQL Editor
-- ============================================================

create or replace function h2o_repere_commande(p_id uuid)
returns text language sql immutable as $$
  select 'Commande restaurant n° ' || left(p_id::text, 8)
$$;

create or replace function h2o_description_commande(c commandes_restaurant)
returns text language sql stable as $$
  select h2o_repere_commande(c.id)
    || case when coalesce(c.table_num, '') <> '' then ' (' || c.table_num || ')' else '' end
    || E'\n' || coalesce((
         select string_agg(
                  (l->>'nom') || ' × ' || coalesce(l->>'qte', '1') || ' — '
                  || replace(to_char(coalesce((l->>'qte')::numeric, 0) * coalesce((l->>'prix')::numeric, 0), 'FM999G999G999G990'), ',', ' ')
                  || ' FCFA',
                  E'\n' order by ord)
           from jsonb_array_elements(coalesce(c.lignes, '[]'::jsonb)) with ordinality as t(l, ord)
       ), '')
$$;

-- ── Création / mise à jour ───────────────────────────────────
create or replace function h2o_facture_commande_sync()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_repere text := h2o_repere_commande(new.id);
  v_facture factures%rowtype;
begin
  select * into v_facture from factures where description like v_repere || '%' limit 1;

  -- Commande annulée : on retire sa facture si elle n'est pas encaissée
  if new.statut = 'annulee' then
    if found and v_facture.statut not in ('paye', 'partiel') then
      delete from factures where id = v_facture.id;
    end if;
    return new;
  end if;

  if not found then
    insert into factures (numero, nom_client, telephone, client_id, type_prestation,
                          description, montant_total, montant_paye, statut)
    values (prochain_numero_facture(), new.nom_client, new.telephone, new.client_id, 'restauration',
            h2o_description_commande(new), coalesce(new.montant_total, 0),
            case when new.statut = 'payee' then coalesce(new.montant_total, 0) else 0 end,
            case when new.statut = 'payee' then 'paye' else 'envoye' end);
  else
    update factures set
      nom_client      = new.nom_client,
      telephone       = new.telephone,
      description     = h2o_description_commande(new),
      montant_total   = coalesce(new.montant_total, 0),
      montant_paye    = case when new.statut = 'payee' then coalesce(new.montant_total, 0)
                             when v_facture.statut in ('paye', 'partiel') then v_facture.montant_paye
                             else 0 end,
      statut          = case when new.statut = 'payee' then 'paye'
                             when v_facture.statut in ('paye', 'partiel') then v_facture.statut
                             else 'envoye' end
    where id = v_facture.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_facture_commande_sync on commandes_restaurant;
create trigger trg_facture_commande_sync
  after insert or update of nom_client, telephone, lignes, montant_total, statut, table_num
  on commandes_restaurant
  for each row execute function h2o_facture_commande_sync();

-- ── Suppression de la commande ───────────────────────────────
create or replace function h2o_facture_commande_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from factures
   where description like h2o_repere_commande(old.id) || '%'
     and statut not in ('paye', 'partiel');
  return old;
end;
$$;

drop trigger if exists trg_facture_commande_delete on commandes_restaurant;
create trigger trg_facture_commande_delete
  after delete on commandes_restaurant
  for each row execute function h2o_facture_commande_delete();

-- ── Numéro de facture attribué par la base ───────────────────
-- Corrige « duplicate key value violates unique constraint factures_numero_key » :
-- le numéro n'est plus calculé côté application. S'il est vide, la base le donne.
-- La fonction voit toutes les factures (security definer), sans être filtrée par la RLS.
create or replace function prochain_numero_facture()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  annee text := to_char(now(), 'YYYY');
  dernier integer;
begin
  perform pg_advisory_xact_lock(hashtext('numero_facture'));
  select coalesce(max(substring(numero from '(\d+)$')::integer), 0)
    into dernier
    from factures
    where numero like 'FAC-' || annee || '-%';
  return 'FAC-' || annee || '-' || lpad((dernier + 1)::text, 3, '0');
end;
$$;

create or replace function h2o_facture_numero_auto()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.numero is null or btrim(new.numero) = '' then
    new.numero := prochain_numero_facture();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_facture_numero_auto on factures;
create trigger trg_facture_numero_auto
  before insert on factures
  for each row execute function h2o_facture_numero_auto();

-- Factures existantes sans numéro : on leur en donne un, dans l'ordre de création
do $$
declare r record;
begin
  for r in select id from factures where numero is null or btrim(numero) = '' order by created_at loop
    update factures set numero = prochain_numero_facture() where id = r.id;
  end loop;
end $$;
