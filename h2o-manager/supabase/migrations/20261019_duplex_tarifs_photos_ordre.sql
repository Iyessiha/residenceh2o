-- Duplex : tarifs et contenu affichés sur la landing (lecture publique via RLS existante)
alter table duplexes add column if not exists tagline text;
alter table duplexes add column if not exists badge text;
alter table duplexes add column if not exists features text[] not null default '{}';

update duplexes set nom = 'Duplex Signature' where code = 'D-3' and nom = 'Duplex Premium';

update duplexes set
  tarif_nuit = 350000,
  tagline    = 'Vue panoramique sur la lagune & pontoon privé',
  badge      = 'Vue Lagune',
  features   = array['Piscine privée 20m²','Pontoon privé','Chambre king size','Cuisine équipée','Terrasse vue lagune']
where code = 'D-1';

update duplexes set
  tarif_nuit = 350000,
  tagline    = 'Intimité, verdure et sérénité tropicale',
  badge      = 'Idéal Famille',
  features   = array['Piscine privée 15m²','Jardin privatif paysager','2 chambres avec dressing','Cuisine & bar équipés','Salon lounge']
where code = 'D-2';

update duplexes set
  tarif_nuit = 350000,
  tagline    = 'Le summum du luxe privé avec jacuzzi et rooftop',
  badge      = 'Prestige VIP',
  features   = array['Grande piscine privée 30m²','Pontoon & jacuzzi chauffé','3 suites parentales','Espace BBQ & rooftop','Vue lagune 360°']
where code = 'D-3';

-- Photos de la galerie : ordre modifiable depuis le manager (page Photos)
create table if not exists photos_galerie (
  id          uuid primary key default gen_random_uuid(),
  fichier     text not null unique,                 -- chemin public, ex: /images/gallery/IMG_2868.jpg
  alt         text,
  duplex_code text references duplexes(code) on delete set null,
  position    integer not null default 0,
  visible     boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists idx_photos_galerie_position on photos_galerie(position);

alter table photos_galerie enable row level security;

drop policy if exists "public_read_photos" on photos_galerie;
create policy "public_read_photos" on photos_galerie
  for select using (visible = true);

drop policy if exists "photos_auth" on photos_galerie;
create policy "photos_auth" on photos_galerie
  for all using (auth.role() = 'authenticated');

insert into photos_galerie (fichier, position) values
  ('/images/gallery/IMG_2868.jpg', 1),
  ('/images/gallery/IMG_2869.jpg', 2),
  ('/images/gallery/IMG_2870.jpg', 3),
  ('/images/gallery/IMG_2873.jpg', 4),
  ('/images/gallery/IMG_2875.jpg', 5),
  ('/images/gallery/IMG_2877.jpg', 6),
  ('/images/gallery/IMG_2879.jpg', 7),
  ('/images/gallery/IMG_2880.jpg', 8),
  ('/images/gallery/IMG_2881.jpg', 9),
  ('/images/gallery/IMG_2884.jpg', 10),
  ('/images/gallery/IMG_2885.jpg', 11),
  ('/images/gallery/IMG_2887.jpg', 12),
  ('/images/gallery/IMG_2890.jpg', 13),
  ('/images/gallery/IMG_2891.jpg', 14),
  ('/images/gallery/IMG_2892.jpg', 15),
  ('/images/gallery/IMG_2893.jpg', 16),
  ('/images/gallery/IMG_2894.jpg', 17),
  ('/images/gallery/IMG_2895.jpg', 18),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.12.54 (1).jpeg', 19),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.12.54 (2).jpeg', 20),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.12.54 (3).jpeg', 21),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.12.54.jpeg', 22),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.12.55 (1).jpeg', 23),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.12.55 (2).jpeg', 24),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.12.55 (3).jpeg', 25),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.12.55 (4).jpeg', 26),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.12.55 (5).jpeg', 27),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.12.55.jpeg', 28),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.12.56 (1).jpeg', 29),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.12.56 (2).jpeg', 30),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.12.56 (3).jpeg', 31),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.12.56.jpeg', 32),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.12.57 (1).jpeg', 33),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.12.57 (2).jpeg', 34),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.12.57 (3).jpeg', 35),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.12.57.jpeg', 36),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.12.58 (1).jpeg', 37),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.12.58.jpeg', 38),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.12.59 (1).jpeg', 39),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.12.59.jpeg', 40),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.00 (1).jpeg', 41),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.00 (2).jpeg', 42),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.00 (3).jpeg', 43),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.00.jpeg', 44),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.01 (1).jpeg', 45),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.01 (2).jpeg', 46),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.01 (3).jpeg', 47),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.01.jpeg', 48),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.02 (1).jpeg', 49),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.02 (2).jpeg', 50),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.02 (3).jpeg', 51),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.02.jpeg', 52),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.03 (1).jpeg', 53),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.03 (2).jpeg', 54),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.03 (3).jpeg', 55),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.03.jpeg', 56),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.04 (1).jpeg', 57),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.04 (2).jpeg', 58),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.04 (3).jpeg', 59),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.04.jpeg', 60),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.05 (1).jpeg', 61),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.05 (2).jpeg', 62),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.05 (3).jpeg', 63),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.05 (4).jpeg', 64),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.05 (5).jpeg', 65),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.05.jpeg', 66),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.06 (1).jpeg', 67),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.06 (2).jpeg', 68),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.06 (3).jpeg', 69),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.06.jpeg', 70),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.07 (1).jpeg', 71),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.07 (2).jpeg', 72),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.07 (3).jpeg', 73),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.07.jpeg', 74),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.08 (1).jpeg', 75),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.08.jpeg', 76),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.10 (1).jpeg', 77),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.10 (2).jpeg', 78),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.10 (3).jpeg', 79),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.10.jpeg', 80),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.11 (1).jpeg', 81),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.11.jpeg', 82),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.13 (1).jpeg', 83),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.13 (2).jpeg', 84),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.13 (3).jpeg', 85),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.13.jpeg', 86),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.14 (1).jpeg', 87),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.14.jpeg', 88),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.21 (1).jpeg', 89),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.21.jpeg', 90),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.22 (1).jpeg', 91),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.22 (2).jpeg', 92),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.22 (3).jpeg', 93),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.22.jpeg', 94),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.23 (1).jpeg', 95),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.23.jpeg', 96),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.25 (1).jpeg', 97),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.25.jpeg', 98),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.26 (1).jpeg', 99),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.26.jpeg', 100),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.27 (1).jpeg', 101),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.27.jpeg', 102),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.28 (1).jpeg', 103),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.28.jpeg', 104),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.36 (1).jpeg', 105),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.36.jpeg', 106),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.37 (1).jpeg', 107),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.13.37.jpeg', 108),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.21.43.jpeg', 109),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.22.03.jpeg', 110),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.22.07.jpeg', 111),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.24.15 (1).jpeg', 112),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.24.15 (2).jpeg', 113),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.24.15.jpeg', 114),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.24.16 (1).jpeg', 115),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.24.16 (2).jpeg', 116),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.24.16.jpeg', 117),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.24.17 (1).jpeg', 118),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.24.17 (2).jpeg', 119),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.24.17.jpeg', 120),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.24.18 (1).jpeg', 121),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.24.18.jpeg', 122),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.24.19 (1).jpeg', 123),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.24.19 (2).jpeg', 124),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.24.19.jpeg', 125),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.24.20 (1).jpeg', 126),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.24.20 (2).jpeg', 127),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.24.20.jpeg', 128),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.25.22.jpeg', 129),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.25.23 (1).jpeg', 130),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.25.23 (2).jpeg', 131),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.25.23.jpeg', 132),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.25.24 (1).jpeg', 133),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.25.24.jpeg', 134),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.25.25.jpeg', 135),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.25.27.jpeg', 136),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.25.29.jpeg', 137),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.25.32.jpeg', 138),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.25.34.jpeg', 139),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.25.35.jpeg', 140),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.25.59 (1).jpeg', 141),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.25.59.jpeg', 142),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.26.24.jpeg', 143),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.26.29.jpeg', 144),
  ('/images/gallery/WhatsApp Image 2026-10-16 at 14.26.45.jpeg', 145)
on conflict (fichier) do nothing;

-- Rattachement initial des photos aux duplex (photos de couverture de la landing)
update photos_galerie set duplex_code = 'D-1' where fichier in ('/images/gallery/IMG_2868.jpg','/images/gallery/IMG_2869.jpg','/images/gallery/IMG_2870.jpg');
update photos_galerie set duplex_code = 'D-2' where fichier in ('/images/gallery/IMG_2873.jpg','/images/gallery/IMG_2877.jpg');
update photos_galerie set duplex_code = 'D-3' where fichier in ('/images/gallery/IMG_2875.jpg','/images/gallery/IMG_2879.jpg','/images/gallery/IMG_2880.jpg','/images/gallery/IMG_2881.jpg');

-- Bucket public des photos téléversées depuis le manager
insert into storage.buckets (id, name, public)
values ('galerie', 'galerie', true)
on conflict (id) do nothing;

drop policy if exists "galerie_public_read" on storage.objects;
create policy "galerie_public_read" on storage.objects
  for select using (bucket_id = 'galerie');

drop policy if exists "galerie_auth_write" on storage.objects;
create policy "galerie_auth_write" on storage.objects
  for all using (bucket_id = 'galerie' and auth.role() = 'authenticated')
  with check (bucket_id = 'galerie' and auth.role() = 'authenticated');
