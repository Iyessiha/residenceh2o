-- ============================================================
-- Migration : CRM (démarcheurs, entreprises), commissions,
-- alertes temps réel et RLS par rôle.
-- Idempotente : peut être rejouée sans effet de bord.
-- À appliquer via Supabase > SQL Editor, après 20261105_demarcheurs.sql
-- ============================================================

-- ── Rôle de l'utilisateur connecté (table profiles, cf. 0001_init) ──
create or replace function h2o_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

-- Tout compte authentifié doit avoir un profil (sinon aucun rôle, donc aucun accès aux nouvelles tables)
insert into profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- ── Démarcheurs ─────────────────────────────────────────────
create table if not exists demarcheurs (
  id              uuid primary key default gen_random_uuid(),
  nom             text not null,
  prenom          text not null default '',
  telephone       text not null default '',
  taux_commission numeric(5,2) not null default 10,
  notes           text,
  created_at      timestamptz not null default now()
);

-- Reprise : la version précédente du schéma nommait la colonne « pourcentage »
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'demarcheurs' and column_name = 'pourcentage')
     and not exists (select 1 from information_schema.columns
                     where table_schema = 'public' and table_name = 'demarcheurs' and column_name = 'taux_commission') then
    alter table demarcheurs rename column pourcentage to taux_commission;
  end if;
end $$;

alter table demarcheurs add column if not exists taux_commission numeric(5,2) not null default 10;
alter table demarcheurs add column if not exists prenom text not null default '';
alter table demarcheurs add column if not exists telephone text not null default '';

-- ── Entreprises ─────────────────────────────────────────────
create table if not exists entreprises (
  id         uuid primary key default gen_random_uuid(),
  nom        text not null,
  contact    text not null default '',
  adresse    text not null default '',
  created_at timestamptz not null default now()
);

-- ── Clients : type particulier / entreprise, rattachement, apporté par ──
alter table clients add column if not exists type text not null default 'particulier'
  check (type in ('particulier', 'entreprise'));
alter table clients add column if not exists entreprise_id uuid references entreprises(id) on delete set null;
alter table clients add column if not exists demarcheur_id uuid references demarcheurs(id) on delete set null;
create index if not exists clients_entreprise_idx on clients(entreprise_id);
create index if not exists clients_demarcheur_idx on clients(demarcheur_id);

-- Les anciens clients « entreprise » (segment) deviennent de type entreprise
update clients set type = 'entreprise' where segment = 'entreprise' and type = 'particulier';

-- ── Réservations : démarcheur et commission ─────────────────
alter table reservations add column if not exists demarcheur_id uuid references demarcheurs(id) on delete set null;
alter table reservations add column if not exists commission_taux numeric(5,2);
alter table reservations add column if not exists commission_montant integer not null default 0;
alter table reservations add column if not exists commission_statut text
  check (commission_statut in ('a_payer', 'payee'));
alter table reservations add column if not exists commission_payee_le timestamptz;
create index if not exists reservations_demarcheur_idx on reservations(demarcheur_id);

-- Calcul serveur : commission = montant × taux du démarcheur / 100 (taux figé à la saisie)
create or replace function h2o_calcul_commission()
returns trigger
language plpgsql
as $$
declare
  v_taux numeric;
begin
  if new.demarcheur_id is null then
    new.commission_taux := null;
    new.commission_montant := 0;
    new.commission_statut := null;
    new.commission_payee_le := null;
    return new;
  end if;

  select taux_commission into v_taux from demarcheurs where id = new.demarcheur_id;
  new.commission_taux := coalesce(v_taux, 0);
  new.commission_montant := round(coalesce(new.montant_total, 0) * coalesce(v_taux, 0) / 100);

  if tg_op = 'INSERT' then
    new.commission_statut := coalesce(new.commission_statut, 'a_payer');
  elsif new.demarcheur_id is distinct from old.demarcheur_id then
    new.commission_statut := 'a_payer';          -- nouveau démarcheur : commission à régler
  elsif new.commission_statut is null then
    new.commission_statut := 'a_payer';
  end if;

  if new.commission_statut = 'payee' then
    new.commission_payee_le := coalesce(new.commission_payee_le, now());
  else
    new.commission_payee_le := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_reservations_commission on reservations;
create trigger trg_reservations_commission
  before insert or update of demarcheur_id, montant_total, commission_statut on reservations
  for each row execute function h2o_calcul_commission();

-- ── Réglages des alertes (rôles concernés, partagés) ────────
create table if not exists alertes_reglages (
  id         integer primary key check (id = 1),
  roles      text[] not null default array['admin', 'gerance', 'reception']
             check (roles <@ array['admin', 'gerance', 'reception']),
  updated_at timestamptz not null default now()
);
insert into alertes_reglages (id) values (1) on conflict (id) do nothing;

create or replace function h2o_roles_alertes()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select roles from alertes_reglages where id = 1), array['admin', 'gerance', 'reception'])
$$;

-- ── Notifications ───────────────────────────────────────────
create table if not exists notifications (
  id                 uuid primary key default gen_random_uuid(),
  type               text not null default 'reservation',
  titre              text not null default '',
  client_nom         text not null default '',
  service            text not null default '',
  montant            integer,
  demarcheur_nom     text,
  source_table       text not null default '',
  source_id          uuid,
  roles              text[] not null default array['admin', 'gerance', 'reception'],
  lu_par             uuid[] not null default '{}',
  pris_en_charge_par uuid references auth.users(id) on delete set null,
  pris_en_charge_at  timestamptz,
  created_at         timestamptz not null default now()
);
alter table notifications add column if not exists type text not null default 'reservation';
alter table notifications add column if not exists titre text not null default '';
alter table notifications add column if not exists client_nom text not null default '';
alter table notifications add column if not exists service text not null default '';
alter table notifications add column if not exists montant integer;
alter table notifications add column if not exists demarcheur_nom text;
alter table notifications add column if not exists source_table text not null default '';
alter table notifications add column if not exists source_id uuid;
alter table notifications add column if not exists roles text[] not null default array['admin', 'gerance', 'reception'];
alter table notifications add column if not exists lu_par uuid[] not null default '{}';
alter table notifications add column if not exists pris_en_charge_par uuid references auth.users(id) on delete set null;
alter table notifications add column if not exists pris_en_charge_at timestamptz;
create index if not exists notifications_created_idx on notifications(created_at desc);

-- Les notifications sont créées uniquement par les triggers ci-dessous (security definer).
-- Une erreur de notification ne doit jamais bloquer l'enregistrement d'une réservation ou d'une commande.
create or replace function h2o_notifier_reservation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lieu text;
  v_demarcheur text;
begin
  begin
    select nom into v_lieu from duplexes where code = new.duplex_id;
    if v_lieu is null and new.chambre_id is not null then
      select nom into v_lieu from chambres where id = new.chambre_id;
    end if;
    select nullif(trim(coalesce(prenom, '') || ' ' || coalesce(nom, '')), '') into v_demarcheur
      from demarcheurs where id = new.demarcheur_id;

    insert into notifications (type, titre, client_nom, service, montant, demarcheur_nom, source_table, source_id, roles)
    values ('reservation', 'Nouvelle réservation', coalesce(new.nom_client, ''),
            coalesce(v_lieu, 'Hébergement'), new.montant_total, v_demarcheur,
            'reservations', new.id, h2o_roles_alertes());
  exception when others then
    raise warning 'notification réservation ignorée : %', sqlerrm;
  end;
  return new;
end;
$$;

create or replace function h2o_notifier_commande_restaurant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into notifications (type, titre, client_nom, service, montant, source_table, source_id, roles)
    values ('commande_restaurant', 'Nouvelle commande restaurant', coalesce(new.nom_client, ''),
            'Restaurant & Bar' || coalesce(' · table ' || new.table_num, ''), new.montant_total,
            'commandes_restaurant', new.id, h2o_roles_alertes());
  exception when others then
    raise warning 'notification commande ignorée : %', sqlerrm;
  end;
  return new;
end;
$$;

create or replace function h2o_notifier_vente()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into notifications (type, titre, client_nom, service, montant, source_table, source_id, roles)
    values ('vente_boutique', 'Nouvelle vente boutique', coalesce(new.nom_client, ''),
            'Boutique', new.montant_total, 'ventes', new.id, h2o_roles_alertes());
  exception when others then
    raise warning 'notification vente ignorée : %', sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists trg_notif_reservation on reservations;
create trigger trg_notif_reservation after insert on reservations
  for each row execute function h2o_notifier_reservation();

drop trigger if exists trg_notif_commande_restaurant on commandes_restaurant;
create trigger trg_notif_commande_restaurant after insert on commandes_restaurant
  for each row execute function h2o_notifier_commande_restaurant();

drop trigger if exists trg_notif_vente on ventes;
create trigger trg_notif_vente after insert on ventes
  for each row execute function h2o_notifier_vente();

-- Actions des managers : lue, prise en charge (fonctions atomiques, pas d'écriture directe)
create or replace function h2o_marquer_lues(p_ids uuid[])
returns void
language sql
security definer
set search_path = public
as $$
  update notifications
     set lu_par = array_append(lu_par, auth.uid())
   where id = any(p_ids)
     and not (auth.uid() = any(lu_par))
     and h2o_role() = any(roles);
$$;

create or replace function h2o_prendre_en_charge(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update notifications
     set pris_en_charge_par = auth.uid(),
         pris_en_charge_at  = now(),
         lu_par = case when auth.uid() = any(lu_par) then lu_par else array_append(lu_par, auth.uid()) end
   where id = p_id
     and pris_en_charge_par is null
     and h2o_role() = any(roles);
$$;

revoke all on function h2o_marquer_lues(uuid[]) from public, anon;
revoke all on function h2o_prendre_en_charge(uuid) from public, anon;
grant execute on function h2o_marquer_lues(uuid[]) to authenticated;
grant execute on function h2o_prendre_en_charge(uuid) to authenticated;

-- Temps réel : le manager reçoit chaque nouvelle notification et chaque prise en charge
do $$
begin
  alter publication supabase_realtime add table notifications;
exception when duplicate_object then null;
end $$;

-- ── RLS : nouvelles tables ──────────────────────────────────
-- Rôles : admin, gerance, reception (profiles.role)

alter table demarcheurs enable row level security;
drop policy if exists demarcheurs_auth on demarcheurs;
drop policy if exists demarcheurs_equipe on demarcheurs;
create policy demarcheurs_equipe on demarcheurs for all
  using (h2o_role() in ('admin', 'gerance', 'reception'))
  with check (h2o_role() in ('admin', 'gerance', 'reception'));

alter table entreprises enable row level security;
drop policy if exists entreprises_equipe on entreprises;
create policy entreprises_equipe on entreprises for all
  using (h2o_role() in ('admin', 'gerance', 'reception'))
  with check (h2o_role() in ('admin', 'gerance', 'reception'));

alter table alertes_reglages enable row level security;
drop policy if exists alertes_reglages_lecture on alertes_reglages;
drop policy if exists alertes_reglages_modif on alertes_reglages;
create policy alertes_reglages_lecture on alertes_reglages for select
  using (h2o_role() in ('admin', 'gerance', 'reception'));
create policy alertes_reglages_modif on alertes_reglages for update
  using (h2o_role() in ('admin', 'gerance'))
  with check (h2o_role() in ('admin', 'gerance'));

alter table notifications enable row level security;
drop policy if exists notifications_lecture on notifications;
drop policy if exists notifications_mise_a_jour on notifications;
create policy notifications_lecture on notifications for select
  using (h2o_role() = any(roles));
create policy notifications_mise_a_jour on notifications for update
  using (h2o_role() = any(roles))
  with check (h2o_role() = any(roles));

-- Vérification (à lancer après l'application) :
-- select table_name, rowsecurity from pg_tables where schemaname = 'public'
--   and tablename in ('demarcheurs','entreprises','alertes_reglages','notifications');
-- select id, email, role from profiles;   -- le compte direction doit être « admin »
