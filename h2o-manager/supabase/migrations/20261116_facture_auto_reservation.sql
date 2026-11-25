-- ============================================================
-- Chaque réservation enregistrée crée automatiquement sa facture (avec QR code dans le PDF).
--   • montant_total = montant de la réservation, montant_paye = avance
--   • statut : payé (avance = total) / partiel (avance versée) / envoyé (rien versé)
--   • la facture suit les modifications de la réservation ; annulation ou suppression → facture retirée
--     tant qu'aucun paiement n'y est enregistré
--   • sens inverse : un paiement saisi sur la facture met à jour l'avance de la réservation
--   • pas de facture pour un simple renseignement ni tant qu'aucun montant n'est fixé
-- Idempotente. À appliquer via Supabase > SQL Editor
-- ============================================================

create or replace function h2o_facture_reservation_sync()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_facture factures%rowtype;
  v_total   numeric := coalesce(new.montant_total, 0);
  v_avance  numeric := least(coalesce(new.avance, 0), coalesce(new.montant_total, 0));
  v_statut  text;
  v_desc    text;
begin
  select * into v_facture from factures where reservation_id = new.id limit 1;

  -- Annulée ou simple renseignement : on retire la facture si rien n'a été encaissé dessus
  if new.statut = 'annule' or new.type = 'renseignement' then
    if found and v_facture.statut not in ('paye', 'partiel') then
      delete from factures where id = v_facture.id;
    end if;
    return new;
  end if;

  if v_total <= 0 then return new; end if;   -- pas de montant, pas encore de facture

  v_statut := case when v_avance >= v_total then 'paye'
                   when v_avance > 0        then 'partiel'
                   else 'envoye' end;
  v_desc := 'Séjour du ' || coalesce(to_char(new.date_arrivee, 'DD/MM/YYYY'), '?')
            || ' au ' || coalesce(to_char(new.date_depart, 'DD/MM/YYYY'), '?')
            || case when new.nb_personnes is not null then ' — ' || new.nb_personnes || ' pers.' else '' end;

  if not found then
    insert into factures (numero, nom_client, telephone, client_id, reservation_id, type_prestation,
                          description, montant_total, montant_paye, statut)
    values (prochain_numero_facture(), new.nom_client, new.telephone, new.client_id, new.id, 'sejour',
            v_desc, v_total, v_avance, v_statut);
  else
    update factures set
      nom_client = new.nom_client, telephone = new.telephone, description = v_desc,
      montant_total = v_total, montant_paye = v_avance, statut = v_statut
    where id = v_facture.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_facture_reservation_sync on reservations;
create trigger trg_facture_reservation_sync
  after insert or update of nom_client, telephone, date_arrivee, date_depart, nb_personnes, montant_total, avance, statut, type
  on reservations
  for each row execute function h2o_facture_reservation_sync();

create or replace function h2o_facture_reservation_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from factures where reservation_id = old.id and statut not in ('paye', 'partiel');
  return old;
end;
$$;

drop trigger if exists trg_facture_reservation_delete on reservations;
create trigger trg_facture_reservation_delete
  before delete on reservations
  for each row execute function h2o_facture_reservation_delete();

-- Sens inverse : paiement saisi sur la facture → avance de la réservation
create or replace function h2o_reservation_depuis_facture()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_paye numeric;
begin
  if new.reservation_id is null then return new; end if;
  v_paye := case when new.statut = 'paye' then coalesce(new.montant_total, 0) else coalesce(new.montant_paye, 0) end;
  update reservations
     set avance = least(v_paye, coalesce(montant_total, v_paye))
   where id = new.reservation_id
     and coalesce(avance, 0) is distinct from least(v_paye, coalesce(montant_total, v_paye));
  return new;
end;
$$;

drop trigger if exists trg_reservation_depuis_facture on factures;
create trigger trg_reservation_depuis_facture
  after update of statut, montant_paye on factures
  for each row execute function h2o_reservation_depuis_facture();

revoke execute on function h2o_facture_reservation_sync(), h2o_facture_reservation_delete(), h2o_reservation_depuis_facture()
  from public, anon, authenticated;

-- Réservations déjà enregistrées : on crée les factures manquantes
update reservations set montant_total = montant_total
 where montant_total > 0 and statut <> 'annule' and type <> 'renseignement'
   and not exists (select 1 from factures f where f.reservation_id = reservations.id);

notify pgrst, 'reload schema';
