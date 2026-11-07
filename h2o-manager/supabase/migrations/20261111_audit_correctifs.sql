-- Correctifs issus de l'audit (peut être exécuté plusieurs fois sans risque)

-- 1) Réservations de chambre déjà saisies : relier la chambre (visible au calendrier + contrôle des doubles réservations)
update reservations r
set chambre_id = c.id
from chambres c
where r.type = 'chambre'
  and r.chambre_id is null
  and r.notes ilike 'Chambre souhait%: ' || c.nom || '%';

-- 2) La liste de l'équipe (noms, téléphones, jetons d'accès) ne doit pas être lisible sans connexion
drop policy if exists staff_public_read_by_token on staff;

-- 3) Les fonctions de déclencheurs ne doivent pas être appelables depuis l'extérieur
revoke execute on function
  public.h2o_facture_commande_delete(),
  public.h2o_facture_commande_sync(),
  public.h2o_facture_numero_auto(),
  public.h2o_notifier_commande_restaurant(),
  public.h2o_notifier_reservation(),
  public.h2o_notifier_vente()
from public, anon, authenticated;
revoke execute on function public.prochain_numero_facture() from public, anon;

-- 4) Chemin de recherche figé sur les fonctions signalées par Supabase
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('h2o_somme_montants','h2o_fiche_paie_avant','h2o_fiche_paie_suppression',
                        'h2o_tresorerie_suppression','payer_fiche_paie','annuler_paiement_fiche',
                        'h2o_calcul_commission','h2o_repere_commande','h2o_description_commande')
  loop
    execute format('alter function %s set search_path = public, pg_temp', f.sig);
  end loop;
end $$;

notify pgrst, 'reload schema';
