-- ============================================================
-- Migration : mise à jour selon la fiche « Les Résidences H₂O »
-- Villa 1 et Villa 2 (remplacent les trois duplex), chambres VVIP / VIP /
-- Standard / non autonomes, carte du restaurant et accès piscine.
-- À appliquer via Supabase > SQL Editor
-- ============================================================

-- ── Villas : colonnes utilisées par la landing ──────────────
alter table duplexes add column if not exists chambres integer not null default 5;
alter table duplexes add column if not exists tarif_journee integer;
alter table duplexes alter column surface_m2 drop not null;

-- ── Villas : Villa 1 et Villa 2 ─────────────────────────────
-- Nuit complète 24/24 (petit déjeuner inclus) et matinée (demi-journée).
insert into duplexes (code, nom, capacite, chambres, surface_m2, tarif_nuit, tarif_journee, description, statut, tagline, badge, features) values
  ('D-1', 'Villa 1', 10, 5, null, 350000, 250000,
   'Villa 1 : piscine privée, jardin, terrasse, toit-terrasse et parking pour 2 voitures', 'disponible',
   'Duplex complet avec piscine privée, jardin et toit-terrasse', 'Duplex complet',
   array['Piscine privée','Jardin','Terrasse','Toit-terrasse','Parking 2 voitures','Cuisine équipée','Buanderie externe','Service repassage','2 toilettes visiteurs']),
  ('D-2', 'Villa 2', 10, 5, null, 350000, 250000,
   'Villa 2 : piscine privée, jardin, terrasse, toit-terrasse et parking pour 2 voitures', 'disponible',
   'Duplex complet avec piscine privée, jardin et toit-terrasse', 'Duplex complet',
   array['Piscine privée','Jardin','Terrasse','Toit-terrasse','Parking 2 voitures','Cuisine équipée','Buanderie externe','Service repassage','2 toilettes visiteurs'])
on conflict (code) do update set
  nom = excluded.nom,
  capacite = excluded.capacite,
  chambres = excluded.chambres,
  surface_m2 = excluded.surface_m2,
  tarif_nuit = excluded.tarif_nuit,
  tarif_journee = excluded.tarif_journee,
  description = excluded.description,
  tagline = excluded.tagline,
  badge = excluded.badge,
  features = excluded.features;

-- ── Ancien duplex 3 : retiré de la fiche ────────────────────
-- Supprimé s'il n'a jamais reçu de réservation. Sinon, gardé pour l'historique
-- et passé en maintenance : le site n'affiche que les duplex disponibles ou occupés.
delete from duplexes d
where d.code = 'D-3'
  and not exists (select 1 from reservations r where r.duplex_id = d.id);

update duplexes set statut = 'maintenance' where code = 'D-3';

-- ── Chambres : catégories et tarif à la journée ─────────────
alter table chambres drop constraint if exists chambres_type_check;
alter table chambres add constraint chambres_type_check
  check (type in ('vvip', 'vip', 'standard', 'non_autonome'));
alter table chambres add column if not exists tarif_journee integer not null default 0;

-- Chambres des villas 1 et 2 : par villa, 1 VVIP, 1 VIP, 2 Standard et 1 non autonome
-- (4 chambres autonomes et 1 non autonome, 2 personnes maximum par chambre).
delete from chambres
where duplex_id in (select id from duplexes where code in ('D-1', 'D-2', 'D-3'));

insert into chambres (duplex_id, duplex_nom, nom, code, type, tarif_nuit, tarif_journee, statut, capacite, description, features)
select d.id, d.nom, c.nom || ' · ' || d.nom, c.code || '-' || d.code, c.type, c.tarif_nuit, c.tarif_journee,
       'disponible', 2, c.description, c.features
from duplexes d
cross join (values
  ('Chambre VVIP',          'VVIP',       'vvip',          90000, 70000,
   'Lit 3 places, 2 personnes maximum. Petit déjeuner inclus pour la formule nuit.',
   array['Lit 3 places', 'TV', 'Salle d''eau', 'Table de bureau', 'Armoire']),
  ('Chambre VIP',           'VIP',        'vip',           80000, 60000,
   'Lit 3 places, 2 personnes maximum. Petit déjeuner inclus pour la formule nuit.',
   array['Lit 3 places', 'TV', 'Salle d''eau', 'Table de bureau', 'Armoire']),
  ('Chambre Standard 1',    'STD1',       'standard',      70000, 50000,
   'Lit 2 places, 2 personnes maximum. Petit déjeuner inclus pour la formule nuit.',
   array['Lit 2 places', 'TV', 'Salle d''eau', 'Table de bureau', 'Armoire']),
  ('Chambre Standard 2',    'STD2',       'standard',      70000, 50000,
   'Lit 2 places, 2 personnes maximum. Petit déjeuner inclus pour la formule nuit.',
   array['Lit 2 places', 'TV', 'Salle d''eau', 'Table de bureau', 'Armoire']),
  ('Chambre non autonome',  'NA',         'non_autonome',  40000, 20000,
   'Lit 2 places, 2 personnes maximum. Petit déjeuner inclus pour la formule nuit.',
   array['Lit 2 places', 'TV', 'Salle d''eau', 'Table de bureau', 'Armoire'])
) as c(nom, code, type, tarif_nuit, tarif_journee, description, features)
where d.code in ('D-1', 'D-2');

-- ── Restaurant : carte et accès piscine de la fiche ─────────
alter table menu_restaurant add column if not exists section text not null default '';
alter table menu_restaurant add column if not exists ordre integer not null default 0;
alter table menu_restaurant add column if not exists prix_libelle text;

alter table menu_restaurant drop constraint if exists menu_restaurant_categorie_check;
alter table menu_restaurant add constraint menu_restaurant_categorie_check
  check (categorie in ('petit_dejeuner', 'entree', 'plat', 'accompagnement', 'jus', 'boisson', 'vin', 'dessert', 'piscine', 'autre'));

-- Lecture publique de la carte (landing, page Restaurant). Les écritures restent réservées au manager.
drop policy if exists "public_read_menu" on menu_restaurant;
create policy "public_read_menu" on menu_restaurant
  for select using (disponible = true);

-- La carte est remplacée par celle de la fiche.
delete from menu_restaurant;

insert into menu_restaurant (ordre, section, categorie, nom, description, prix, prix_libelle) values
  (1,  'Petit déjeuner', 'petit_dejeuner', 'Croissant & cake', null, 0, 'Inclus'),
  (2,  'Petit déjeuner', 'petit_dejeuner', 'Jus naturel', null, 0, 'Inclus'),
  (3,  'Petit déjeuner', 'petit_dejeuner', 'Yaourt', null, 0, 'Inclus'),
  (4,  'Petit déjeuner', 'petit_dejeuner', 'Pain', null, 0, 'Inclus'),
  (5,  'Petit déjeuner', 'petit_dejeuner', 'Omelette, jambon & saucisse', null, 0, 'Inclus'),
  (6,  'Petit déjeuner', 'petit_dejeuner', 'Café', null, 0, 'Inclus'),

  (7,  'Volailles', 'plat', 'Poulet entier', 'Avec attiéké', 8000, null),
  (8,  'Volailles', 'plat', 'Demi poulet', 'Avec attiéké', 5000, null),
  (9,  'Volailles', 'plat', 'Pondeuse entière', 'Avec attiéké', 10000, null),
  (10, 'Volailles', 'plat', 'Demi pondeuse', null, 5000, null),
  (11, 'Volailles', 'plat', 'Pintade entière', 'Avec attiéké', 12000, null),
  (12, 'Volailles', 'plat', 'Demi pintade', 'Avec attiéké', 6000, null),
  (13, 'Volailles', 'plat', 'Grouillon de dinde', null, 5000, null),
  (14, 'Volailles', 'plat', 'Saucisse de Toulouse', null, 0, 'Sur demande'),

  (15, 'Porc', 'plat', 'Plat de porc', 'Avec attiéké', 10000, null),

  (16, 'Poissons & fruits de mer', 'plat', 'Tilapia / Carpe', null, 6000, '6 000 – 12 000 F'),
  (17, 'Poissons & fruits de mer', 'plat', 'Saint-Pierre · Soso · Sol', null, 0, 'Selon taille'),
  (18, 'Poissons & fruits de mer', 'plat', 'Écrevisse', null, 10000, null),
  (19, 'Poissons & fruits de mer', 'plat', 'Gambas', null, 10000, null),
  (20, 'Poissons & fruits de mer', 'plat', 'Escargot', null, 10000, null),

  (21, 'Accompagnements', 'accompagnement', 'Attiéké', null, 500, null),
  (22, 'Accompagnements', 'accompagnement', 'Frite', null, 1000, null),
  (23, 'Accompagnements', 'accompagnement', 'Alloco', null, 1000, null),
  (24, 'Accompagnements', 'accompagnement', 'Djabloci', null, 1000, null),
  (25, 'Accompagnements', 'accompagnement', 'Igname', null, 1000, null),

  (26, 'Boissons', 'jus', 'Jus naturel', null, 1000, null),
  (27, 'Boissons', 'boisson', 'Eau', null, 1000, null),
  (28, 'Boissons', 'boisson', 'Sucrerie (sodas)', null, 1000, null),
  (29, 'Boissons', 'boisson', 'Bière', null, 2000, null),
  (30, 'Boissons', 'boisson', 'Cocktail', null, 2000, '2 000 – 3 000 F'),
  (31, 'Boissons', 'boisson', 'Shots (short)', null, 1000, '1 000 – 5 000 F'),
  (32, 'Boissons', 'vin', 'Vin', null, 5000, '5 000 – 10 000 F'),
  (33, 'Boissons', 'boisson', 'Liqueurs', null, 15000, '15 000 – 30 000 F'),
  (34, 'Boissons', 'vin', 'Champagne', null, 40000, '40 000 – 60 000 F'),

  (35, 'Piscine — accès externe (restaurant)', 'piscine', 'Nage simple — adulte', null, 5000, null),
  (36, 'Piscine — accès externe (restaurant)', 'piscine', 'Nage simple — adulte avec serviette', null, 7000, null),
  (37, 'Piscine — accès externe (restaurant)', 'piscine', 'Nage simple — enfant', null, 3000, null),
  (38, 'Piscine — accès externe (restaurant)', 'piscine', 'Nage simple — enfant (boisson sans alcool)', null, 1000, null),
  (39, 'Piscine — accès externe (restaurant)', 'piscine', 'Droit piscine via consommation — adulte', 'Consommation minimum', 10000, null),
  (40, 'Piscine — accès externe (restaurant)', 'piscine', 'Droit piscine via consommation — enfant', 'Consommation minimum', 5000, null);
