-- Colonne « modifié le » attendue par certaines pages (sans risque si elle existe déjà)
alter table duplexes       add column if not exists updated_at timestamptz default now();
alter table chambres       add column if not exists updated_at timestamptz default now();
alter table reservations   add column if not exists updated_at timestamptz default now();
alter table parametres_paie add column if not exists updated_at timestamptz default now();
notify pgrst, 'reload schema';
