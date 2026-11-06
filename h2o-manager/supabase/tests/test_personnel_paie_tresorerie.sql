-- Tests de 20261107_personnel_paie_tresorerie.sql (à lancer sur une base vide, depuis ce dossier :
--   psql -v ON_ERROR_STOP=1 -f test_personnel_paie_tresorerie.sql)
\set ON_ERROR_STOP on
\ir stub_h2o_schema.sql

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'admin@h2o.test'),
  ('22222222-2222-2222-2222-222222222222', 'recep@h2o.test'),
  ('33333333-3333-3333-3333-333333333333', 'gerance@h2o.test');
insert into profiles (id, email, role) values
  ('11111111-1111-1111-1111-111111111111', 'admin@h2o.test', 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'recep@h2o.test', 'reception'),
  ('33333333-3333-3333-3333-333333333333', 'gerance@h2o.test', 'gerance');

\ir ../migrations/20261107_personnel_paie_tresorerie.sql
\ir ../migrations/20261107_personnel_paie_tresorerie.sql

-- Prépare des données en tant qu'admin
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
select set_config('request.jwt.claim.role', 'authenticated', false);

insert into employes (id, nom, prenom, poste, service, salaire_base, indemnites)
values ('eeeeeeee-0000-0000-0000-000000000001', 'Kouassi', 'Aya', 'Serveuse', 'restauration', 100000, '[{"nom":"Transport","montant":20000}]');

do $$
declare f fiches_paie; g fiches_paie; nb int;
begin
  -- 1. totaux et numéro calculés par la base
  insert into fiches_paie (employe_id, employe_nom, mois, salaire_base, gains, retenues, charges_patronales)
  values ('eeeeeeee-0000-0000-0000-000000000001', 'Aya Kouassi', '2026-11-01', 100000,
          '[{"nom":"Transport","montant":20000},{"nom":"Prime","montant":5000}]',
          '[{"nom":"CNPS","montant":7875},{"nom":"Avance","montant":10000}]',
          '[{"nom":"CNPS employeur","montant":9625}]')
  returning * into f;
  if f.total_brut <> 125000 or f.total_retenues <> 17875 or f.net_a_payer <> 107125 or f.total_charges <> 9625 then
    raise exception 'FAIL totaux : % % % %', f.total_brut, f.total_retenues, f.net_a_payer, f.total_charges;
  end if;
  if f.numero <> 'PAIE-2026-11-001' then raise exception 'FAIL numero : %', f.numero; end if;
  raise notice 'OK 1 totaux + numéro (net %)', f.net_a_payer;

  -- 2. un employé, un mois : pas de doublon
  begin
    insert into fiches_paie (employe_id, employe_nom, mois) values ('eeeeeeee-0000-0000-0000-000000000001', 'Aya Kouassi', '2026-11-01');
    raise exception 'FAIL doublon accepté';
  exception when unique_violation then raise notice 'OK 2 doublon employé/mois refusé'; end;

  -- 3. retenues supérieures au brut refusées
  begin
    insert into fiches_paie (employe_nom, mois, salaire_base, retenues) values ('X', '2026-10-01', 1000, '[{"nom":"A","montant":5000}]');
    raise exception 'FAIL net négatif accepté';
  exception when raise_exception then
    if sqlerrm like 'FAIL%' then raise; end if; raise notice 'OK 3 net négatif refusé'; end;

  -- 4. mois non au 1er : refusé
  begin
    insert into fiches_paie (employe_nom, mois) values ('X', '2026-10-15');
    raise exception 'FAIL date quelconque acceptée';
  exception when check_violation then raise notice 'OK 4 mois doit être le 1er'; end;

  -- 5. paiement atomique
  g := payer_fiche_paie(f.id, '2026-11-05', 'mobile_money');
  select count(*) into nb from tresorerie where fiche_paie_id = f.id and type = 'depense' and categorie = 'Salaires' and montant = 107125 and mode_paiement = 'mobile_money';
  if g.statut <> 'paye' or nb <> 1 then raise exception 'FAIL paiement'; end if;
  raise notice 'OK 5 paiement -> trésorerie';

  -- 6. double paiement, modification, suppression d'une fiche payée, suppression du mouvement salaire
  begin perform payer_fiche_paie(f.id); raise exception 'FAIL double paiement';
  exception when raise_exception then if sqlerrm like 'FAIL%' then raise; end if; end;
  begin update fiches_paie set salaire_base = 1 where id = f.id; raise exception 'FAIL modif fiche payée';
  exception when raise_exception then if sqlerrm like 'FAIL%' then raise; end if; end;
  begin delete from fiches_paie where id = f.id; raise exception 'FAIL suppression fiche payée';
  exception when raise_exception then if sqlerrm like 'FAIL%' then raise; end if; end;
  begin delete from tresorerie where fiche_paie_id = f.id; raise exception 'FAIL suppression mouvement salaire';
  exception when raise_exception then if sqlerrm like 'FAIL%' then raise; end if; end;
  raise notice 'OK 6 fiche payée verrouillée';

  -- 7. annulation du paiement
  g := annuler_paiement_fiche(f.id);
  select count(*) into nb from tresorerie where fiche_paie_id = f.id;
  if g.statut <> 'valide' or g.date_paiement is not null or nb <> 0 then raise exception 'FAIL annulation'; end if;
  update fiches_paie set salaire_base = 90000 where id = f.id returning * into g;
  if g.net_a_payer <> 97125 then raise exception 'FAIL recalcul après annulation : %', g.net_a_payer; end if;
  delete from fiches_paie where id = f.id;
  raise notice 'OK 7 annulation, modification puis suppression';

  -- 8. dépense manuelle
  insert into tresorerie (type, categorie, libelle, montant) values ('depense', 'Électricité', 'Facture CIE octobre', 85000);
  begin insert into tresorerie (type, libelle, montant) values ('depense', 'Zéro', 0); raise exception 'FAIL montant 0';
  exception when check_violation then raise notice 'OK 8 dépense manuelle, montant > 0'; end;
end $$;

-- Réception : aucun accès
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
do $$
declare n int;
begin
  select count(*) into n from employes;          if n <> 0 then raise exception 'FAIL réception voit les employés'; end if;
  select count(*) into n from tresorerie;        if n <> 0 then raise exception 'FAIL réception voit la trésorerie'; end if;
  select count(*) into n from fiches_paie;       if n <> 0 then raise exception 'FAIL réception voit les fiches'; end if;
  select count(*) into n from parametres_paie;   if n <> 0 then raise exception 'FAIL réception voit les paramètres'; end if;
  begin insert into employes (nom) values ('Pirate'); raise exception 'FAIL réception crée un employé';
  exception when insufficient_privilege then raise notice 'OK 9 réception : écriture refusée (RLS)'; end;
end $$;

-- Gérance : accès complet
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false);
do $$
declare n int;
begin
  select count(*) into n from employes;   if n <> 1 then raise exception 'FAIL gérance ne voit pas les employés'; end if;
  select count(*) into n from tresorerie; if n <> 1 then raise exception 'FAIL gérance ne voit pas la trésorerie'; end if;
  update parametres_paie set retenues = '[{"nom":"CNPS salarié","taux":6.3}]' where id = 1;
  raise notice 'OK 10 gérance : accès complet';
end $$;
select 'TOUS LES TESTS PASSENT' as resultat;
