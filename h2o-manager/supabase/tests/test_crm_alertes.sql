-- Tests de 20261106_crm_alertes.sql (à lancer après stub_h2o_schema.sql et 20261105_demarcheurs.sql).
\set ON_ERROR_STOP on

-- Utilisateurs : admin, réception, gérance (les profils sont créés par la migration)
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'admin@h2o.test'),
  ('22222222-2222-2222-2222-222222222222', 'recep@h2o.test'),
  ('33333333-3333-3333-3333-333333333333', 'gerance@h2o.test');

-- Villas (logements « Villa 1 » et « Villa 2 »)
insert into duplexes (code, nom, tarif_nuit) values ('V1', 'Villa 1', 100000), ('V2', 'Villa 2', 120000);

-- État légué par la version précédente : colonne « pourcentage »
insert into demarcheurs (nom, prenom, telephone, pourcentage)
  values ('Diallo', 'Awa', '0700000000', 12);

-- Application de la migration, deux fois (idempotence)
\i /home/user/residenceh2o/h2o-manager/supabase/migrations/20261106_crm_alertes.sql
\i /home/user/residenceh2o/h2o-manager/supabase/migrations/20261106_crm_alertes.sql

update profiles set role = 'admin' where id = '11111111-1111-1111-1111-111111111111';
update profiles set role = 'gerance' where id = '33333333-3333-3333-3333-333333333333';

do $$
begin
  -- 1. Schéma
  if not exists (select 1 from information_schema.columns where table_name = 'demarcheurs' and column_name = 'taux_commission') then
    raise exception 'FAIL: taux_commission absent';
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'demarcheurs' and column_name = 'pourcentage') then
    raise exception 'FAIL: pourcentage non renommée';
  end if;
  if (select taux_commission from demarcheurs where nom = 'Diallo') <> 12 then
    raise exception 'FAIL: la valeur du taux n a pas été reprise lors du renommage';
  end if;
  if (select count(*) from profiles) <> 3 then raise exception 'FAIL: profils non créés pour les 3 comptes'; end if;
  raise notice 'OK 1 schéma, renommage, backfill profils';
end $$;

-- 2. Commission : montant × taux / 100, taux figé, statut à payer
insert into reservations (nom_client, duplex_id, montant_total, demarcheur_id, date_arrivee, date_depart)
  select 'Koné', 'V1', 150000, id, '2026-12-01', '2026-12-03' from demarcheurs where nom = 'Diallo';
insert into reservations (nom_client, duplex_id, montant_total, date_arrivee, date_depart)
  values ('Sans démarcheur', 'V2', 240000, '2026-12-10', '2026-12-12');

do $$
declare r reservations%rowtype;
begin
  select * into r from reservations where nom_client = 'Koné';
  if r.commission_montant <> 18000 or r.commission_statut <> 'a_payer' or r.commission_taux <> 12 then
    raise exception 'FAIL commission : %, %, %', r.commission_montant, r.commission_statut, r.commission_taux;
  end if;
  select * into r from reservations where nom_client = 'Sans démarcheur';
  if r.commission_montant <> 0 or r.commission_statut is not null then
    raise exception 'FAIL réservation sans démarcheur : %, %', r.commission_montant, r.commission_statut;
  end if;
  raise notice 'OK 2 commission calculée (18 000 FCFA = 150 000 × 12 %%)';
end $$;

-- 3. Modification du montant : recalcul ; passage à « payée » ; le montant change sans repasser à « à payer »
update reservations set montant_total = 200000 where nom_client = 'Koné';
update reservations set commission_statut = 'payee' where nom_client = 'Koné';
update reservations set montant_total = 210000 where nom_client = 'Koné';

do $$
declare r reservations%rowtype;
begin
  select * into r from reservations where nom_client = 'Koné';
  if r.commission_montant <> 25200 then raise exception 'FAIL recalcul après modification : %', r.commission_montant; end if;
  if r.commission_statut <> 'payee' or r.commission_payee_le is null then
    raise exception 'FAIL statut payée / date de paiement : %, %', r.commission_statut, r.commission_payee_le;
  end if;
  raise notice 'OK 3 recalcul et statut payée conservés';
end $$;

-- 4. Changement de démarcheur : la commission repart à payer
insert into demarcheurs (nom, prenom, taux_commission) values ('Traoré', 'Ibrahim', 8);
update reservations set demarcheur_id = (select id from demarcheurs where nom = 'Traoré')
  where nom_client = 'Koné';

do $$
declare r reservations%rowtype;
begin
  select * into r from reservations where nom_client = 'Koné';
  if r.commission_statut <> 'a_payer' or r.commission_payee_le is not null or r.commission_montant <> 16800 then
    raise exception 'FAIL changement de démarcheur : %, %, %', r.commission_statut, r.commission_payee_le, r.commission_montant;
  end if;
  raise notice 'OK 4 changement de démarcheur réinitialise le statut';
end $$;

-- 5. Notifications créées par les triggers (réservation, commande restaurant, vente boutique)
insert into reservations (nom_client, duplex_id, montant_total, demarcheur_id, date_arrivee, date_depart)
  select 'Web', 'V1', 90000, id, '2026-12-20', '2026-12-21' from demarcheurs where nom = 'Diallo';
insert into commandes_restaurant (nom_client, table_num, montant_total) values ('Mensah', '4', 15000);
insert into ventes (nom_client, montant_total) values ('Ouattara', 7500);

do $$
declare n notifications%rowtype;
begin
  select * into n from notifications where client_nom = 'Web';
  if n.type <> 'reservation' or n.service <> 'Villa 1' or n.montant <> 90000 or n.demarcheur_nom <> 'Awa Diallo' then
    raise exception 'FAIL notification réservation : %, %, %, %', n.type, n.service, n.montant, n.demarcheur_nom;
  end if;
  if (select count(*) from notifications where type = 'commande_restaurant' and service like 'Restaurant%table 4') <> 1 then
    raise exception 'FAIL notification commande restaurant';
  end if;
  if (select count(*) from notifications where type = 'vente_boutique' and service = 'Boutique') <> 1 then
    raise exception 'FAIL notification vente';
  end if;
  raise notice 'OK 5 notifications : réservation, commande restaurant, vente boutique';
end $$;

-- 6. RLS : réception (rôle par défaut) voit les notifications, puis admin seul
set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
select set_config('request.jwt.claim.role', 'authenticated', false);

do $$
begin
  -- 2 réservations (étape 2), 1 réservation web, 1 commande restaurant, 1 vente boutique
  if (select count(*) from notifications) <> 5 then
    raise exception 'FAIL RLS réception : attendu 5 notifications, obtenu %', (select count(*) from notifications);
  end if;
  if (select count(*) from demarcheurs) <> 2 then raise exception 'FAIL RLS réception démarcheurs'; end if;
  -- Réception ne peut pas modifier les rôles concernés
  update alertes_reglages set roles = array['reception'] where id = 1;
  if (select roles from alertes_reglages where id = 1) <> array['admin', 'gerance', 'reception'] then
    raise exception 'FAIL RLS : la réception a modifié les rôles concernés';
  end if;
  raise notice 'OK 6a RLS réception : lecture oui, modification des rôles non';
end $$;

-- Réception : marquer lue puis prise en charge
select h2o_marquer_lues((select array_agg(id) from notifications));
select h2o_prendre_en_charge((select id from notifications where client_nom = 'Mensah'));

do $$
declare n notifications%rowtype;
begin
  select * into n from notifications where client_nom = 'Mensah';
  if not ('22222222-2222-2222-2222-222222222222'::uuid = any(n.lu_par)) then raise exception 'FAIL marquer lue'; end if;
  if n.pris_en_charge_par <> '22222222-2222-2222-2222-222222222222' or n.pris_en_charge_at is null then
    raise exception 'FAIL prise en charge';
  end if;
  -- Une seconde prise en charge ne remplace pas la première
  perform h2o_prendre_en_charge(n.id);
  if (select pris_en_charge_par from notifications where id = n.id) <> '22222222-2222-2222-2222-222222222222' then
    raise exception 'FAIL double prise en charge';
  end if;
  raise notice 'OK 6b marquer lue, prise en charge unique';
end $$;

reset role;

-- 7. Admin : modifie les rôles concernés ; la nouvelle notification n'est visible que de l'admin
update alertes_reglages set roles = array['admin'] where id = 1;
insert into commandes_restaurant (nom_client, table_num, montant_total) values ('Admin only', '1', 0);
-- (en superutilisateur : le trigger lit les rôles du moment)

set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
select set_config('request.jwt.claim.role', 'authenticated', false);

do $$
begin
  if exists (select 1 from notifications where client_nom = 'Admin only') then
    raise exception 'FAIL RLS : la réception voit une alerte réservée à l admin';
  end if;
  raise notice 'OK 7a réception ne voit pas l alerte réservée à l admin';
end $$;

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
do $$
begin
  if not exists (select 1 from notifications where client_nom = 'Admin only') then
    raise exception 'FAIL RLS : l admin ne voit pas son alerte';
  end if;
  update alertes_reglages set roles = array['admin', 'gerance', 'reception'] where id = 1;
  if (select roles from alertes_reglages where id = 1) <> array['admin', 'gerance', 'reception'] then
    raise exception 'FAIL : l admin ne peut pas modifier les rôles';
  end if;
  raise notice 'OK 7b admin voit son alerte et modifie les rôles';
end $$;

-- 8. Anonyme : aucun accès aux nouvelles tables
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claim.role', 'anon', false);
do $$
begin
  if (select count(*) from notifications) <> 0 then raise exception 'FAIL RLS anon notifications'; end if;
  if (select count(*) from demarcheurs) <> 0 then raise exception 'FAIL RLS anon démarcheurs'; end if;
  raise notice 'OK 8 anonyme ne lit aucune notification ni démarcheur';
end $$;
reset role;

-- 9. Réservation du site web (anonyme) : le trigger notifie, même sans droit d'écriture sur notifications
set role anon;
insert into reservations (nom_client, duplex_id, montant_total, source, date_arrivee, date_depart)
  values ('Visiteur web', 'V2', 60000, 'site_web', '2026-12-25', '2026-12-26');
reset role;
do $$
begin
  if not exists (select 1 from notifications where client_nom = 'Visiteur web' and service = 'Villa 2') then
    raise exception 'FAIL notification réservation site web';
  end if;
  raise notice 'OK 9 réservation anonyme notifiée';
end $$;
