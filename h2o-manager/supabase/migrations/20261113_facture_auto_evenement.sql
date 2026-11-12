-- ============================================================
-- Chaque événement enregistré crée automatiquement sa facture (avec QR code dans le PDF).
--   • montant_total = devis, montant_paye = acompte
--   • statut : payé (acompte = devis) / partiel (acompte versé) / envoyé (rien versé)
--   • la facture suit les modifications de l'événement ; annulation ou suppression → facture retirée
--     tant qu'aucun paiement n'y est enregistré
-- Idempotente. À appliquer via Supabase > SQL Editor
-- ============================================================

create or replace function h2o_facture_evenement_sync()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_facture factures%rowtype;
  v_devis   numeric := coalesce(new.montant_devis, 0);
  v_acompte numeric := least(coalesce(new.acompte, 0), coalesce(new.montant_devis, 0));
  v_statut  text;
  v_desc    text;
begin
  select * into v_facture from factures where evenement_id = new.id limit 1;

  -- Annulé : on retire la facture si rien n'a été encaissé dessus
  if new.statut = 'annule' then
    if found and v_facture.statut not in ('paye', 'partiel') then
      delete from factures where id = v_facture.id;
    end if;
    return new;
  end if;

  if v_devis <= 0 then return new; end if;   -- pas de devis, pas encore de facture

  v_statut := case when v_acompte >= v_devis then 'paye'
                   when v_acompte > 0        then 'partiel'
                   else 'envoye' end;
  v_desc := 'Événement ' || coalesce(new.type_evenement, '') || ' du ' || to_char(new.date_evenement, 'DD/MM/YYYY')
            || case when new.nb_invites is not null then ' — ' || new.nb_invites || ' invités' else '' end;

  if not found then
    insert into factures (numero, nom_client, telephone, client_id, evenement_id, type_prestation,
                          description, montant_total, montant_paye, statut)
    values (prochain_numero_facture(), new.nom_client, new.telephone, new.client_id, new.id, 'evenement',
            v_desc, v_devis, v_acompte, v_statut);
  else
    update factures set
      nom_client = new.nom_client, telephone = new.telephone, description = v_desc,
      montant_total = v_devis, montant_paye = v_acompte, statut = v_statut
    where id = v_facture.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_facture_evenement_sync on evenements;
create trigger trg_facture_evenement_sync
  after insert or update of nom_client, telephone, type_evenement, date_evenement, nb_invites, montant_devis, acompte, statut
  on evenements
  for each row execute function h2o_facture_evenement_sync();

create or replace function h2o_facture_evenement_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from factures where evenement_id = old.id and statut not in ('paye', 'partiel');
  return old;
end;
$$;

drop trigger if exists trg_facture_evenement_delete on evenements;
create trigger trg_facture_evenement_delete
  after delete on evenements
  for each row execute function h2o_facture_evenement_delete();

revoke execute on function h2o_facture_evenement_sync(), h2o_facture_evenement_delete() from public, anon, authenticated;

-- Événements déjà enregistrés : on crée les factures manquantes
update evenements set montant_devis = montant_devis where montant_devis > 0 and not exists (select 1 from factures f where f.evenement_id = evenements.id);

notify pgrst, 'reload schema';
