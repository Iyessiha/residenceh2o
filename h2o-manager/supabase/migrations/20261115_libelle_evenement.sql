-- Libellé lisible dans la facture d'un événement (« fête privée » au lieu de « fete_privee »)
create or replace function h2o_facture_evenement_sync()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_facture factures%rowtype;
  v_devis   numeric := coalesce(new.montant_devis, 0);
  v_acompte numeric := least(coalesce(new.acompte, 0), coalesce(new.montant_devis, 0));
  v_statut  text;
  v_desc    text;
  v_type    text := case new.type_evenement
                      when 'mariage' then 'mariage' when 'anniversaire' then 'anniversaire'
                      when 'bapteme' then 'baptême' when 'seminaire' then 'séminaire'
                      when 'fete_privee' then 'fête privée' else 'privé' end;
begin
  select * into v_facture from factures where evenement_id = new.id limit 1;

  if new.statut = 'annule' then
    if found and v_facture.statut not in ('paye', 'partiel') then
      delete from factures where id = v_facture.id;
    end if;
    return new;
  end if;

  if v_devis <= 0 then return new; end if;

  v_statut := case when v_acompte >= v_devis then 'paye'
                   when v_acompte > 0        then 'partiel'
                   else 'envoye' end;
  v_desc := 'Événement ' || v_type || ' du ' || to_char(new.date_evenement, 'DD/MM/YYYY')
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

-- Met à jour les descriptions déjà créées
update evenements set nom_client = nom_client;
