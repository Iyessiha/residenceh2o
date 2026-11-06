-- ============================================================
-- Rattrapage : crée la facture des commandes Restaurant & Bar enregistrées AVANT
-- 20261106_facture_auto_commande.sql (à lancer APRÈS ce fichier, une seule fois).
-- - Les commandes annulées sont ignorées.
-- - Une commande qui a déjà sa facture n'est pas refacturée (le script peut être relancé).
-- - Les factures sont numérotées dans l'ordre des commandes (la plus ancienne d'abord).
-- - La date de chaque facture est celle de la commande : les « Revenus du mois »
--   du tableau de bord ne sont pas faussés par ce rattrapage.
-- ============================================================

do $$
declare r record;
begin
  for r in
    select c.id
      from commandes_restaurant c
     where c.statut <> 'annulee'
       and not exists (select 1 from factures f where f.description like h2o_repere_commande(c.id) || '%')
     order by c.created_at
  loop
    -- « UPDATE OF statut » déclenche la création de la facture (trigger de 20261106_facture_auto_commande)
    update commandes_restaurant set statut = statut where id = r.id;
  end loop;
end $$;

-- Date de la facture = date de la commande
update factures f
   set created_at = c.created_at
  from commandes_restaurant c
 where f.description like h2o_repere_commande(c.id) || '%'
   and f.created_at <> c.created_at;
