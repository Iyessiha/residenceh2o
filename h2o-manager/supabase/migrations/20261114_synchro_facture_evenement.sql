-- Sens inverse : un paiement saisi sur la facture d'un événement met à jour l'acompte de l'événement
-- (l'encaissé du tableau de bord, de la trésorerie et des rapports vient de l'acompte).
-- Idempotente. À appliquer via Supabase > SQL Editor

create or replace function h2o_evenement_depuis_facture()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_paye numeric;
begin
  if new.evenement_id is null then return new; end if;
  v_paye := case when new.statut = 'paye' then coalesce(new.montant_total, 0) else coalesce(new.montant_paye, 0) end;
  update evenements
     set acompte = least(v_paye, coalesce(montant_devis, v_paye))
   where id = new.evenement_id
     and coalesce(acompte, 0) is distinct from least(v_paye, coalesce(montant_devis, v_paye));
  return new;
end;
$$;

drop trigger if exists trg_evenement_depuis_facture on factures;
create trigger trg_evenement_depuis_facture
  after update of statut, montant_paye on factures
  for each row execute function h2o_evenement_depuis_facture();

revoke execute on function h2o_evenement_depuis_facture() from public, anon, authenticated;
notify pgrst, 'reload schema';
