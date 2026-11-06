-- ============================================================
-- Migration : Personnel, fiches de paie, trésorerie
-- - employes         : salariés (poste, contrat, salaire de base, indemnités fixes, mode de paiement)
-- - parametres_paie  : retenues et charges patronales par défaut (taux saisis par la gérance)
-- - fiches_paie      : une fiche par employé et par mois (brouillon → validée → payée)
-- - tresorerie       : dépenses et recettes ; le paiement d'une fiche y crée une dépense « Salaires »
-- Accès réservé aux rôles admin et gérance (table profiles) : la réception ne voit ni salaires ni trésorerie.
-- Les taux de cotisations ne sont PAS préremplis : à renseigner avec votre comptable.
-- Idempotente. À appliquer via Supabase > SQL Editor
-- ============================================================

-- ── Rôles ────────────────────────────────────────────────────
create or replace function h2o_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function h2o_est_gestion()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(h2o_role() in ('admin', 'gerance'), false)
$$;

-- ── Employés ─────────────────────────────────────────────────
create table if not exists employes (
  id              uuid primary key default gen_random_uuid(),
  nom             text not null,
  prenom          text not null default '',
  poste           text not null default '',
  service         text not null default 'autre'
                    check (service in ('direction','reception','restauration','bar','menage','entretien','securite','administration','autre')),
  type_contrat    text not null default 'cdi'
                    check (type_contrat in ('cdi','cdd','journalier','stage','prestataire')),
  date_embauche   date,
  date_fin        date,
  telephone       text not null default '',
  email           text not null default '',
  numero_cnps     text not null default '',
  mode_paiement   text not null default 'especes'
                    check (mode_paiement in ('especes','mobile_money','virement','cheque')),
  numero_paiement text not null default '',
  salaire_base    integer not null default 0 check (salaire_base >= 0),
  indemnites      jsonb not null default '[]'::jsonb,   -- [{ "nom": "Transport", "montant": 20000 }] ajoutées chaque mois
  actif           boolean not null default true,
  notes           text,
  created_at      timestamptz not null default now()
);
create index if not exists idx_employes_actif on employes(actif);

-- ── Paramètres de paie (une seule ligne) ─────────────────────
create table if not exists parametres_paie (
  id                  integer primary key check (id = 1),
  retenues            jsonb not null default '[]'::jsonb,   -- [{ "nom": "CNPS salarié", "taux": 6.3 }] en % du brut
  charges_patronales  jsonb not null default '[]'::jsonb,   -- [{ "nom": "CNPS employeur", "taux": 7.7 }] en % du brut
  updated_at          timestamptz not null default now()
);
insert into parametres_paie (id) values (1) on conflict (id) do nothing;

-- ── Fiches de paie ───────────────────────────────────────────
create table if not exists fiches_paie (
  id                  uuid primary key default gen_random_uuid(),
  numero              text unique,
  employe_id          uuid references employes(id) on delete set null,
  employe_nom         text not null,
  employe_poste       text not null default '',
  employe_cnps        text not null default '',
  mois                date not null check (mois = date_trunc('month', mois)::date),
  salaire_base        integer not null default 0 check (salaire_base >= 0),
  gains               jsonb not null default '[]'::jsonb,        -- [{ "nom": "Prime", "montant": 15000 }]
  retenues            jsonb not null default '[]'::jsonb,        -- [{ "nom": "Avance", "montant": 10000 }]
  charges_patronales  jsonb not null default '[]'::jsonb,        -- information : coût employeur
  total_brut          integer not null default 0,
  total_retenues      integer not null default 0,
  net_a_payer         integer not null default 0,
  total_charges       integer not null default 0,
  statut              text not null default 'brouillon' check (statut in ('brouillon','valide','paye')),
  date_paiement       date,
  mode_paiement       text,
  created_at          timestamptz not null default now(),
  unique (employe_id, mois)
);
create index if not exists idx_fiches_mois on fiches_paie(mois desc);

-- ── Trésorerie ───────────────────────────────────────────────
create table if not exists tresorerie (
  id             uuid primary key default gen_random_uuid(),
  date           date not null default current_date,
  type           text not null check (type in ('depense','recette')),
  categorie      text not null default 'Autre',
  libelle        text not null,
  montant        integer not null check (montant > 0),
  mode_paiement  text not null default 'especes'
                   check (mode_paiement in ('especes','mobile_money','virement','cheque','carte')),
  beneficiaire   text not null default '',
  reference      text not null default '',
  employe_id     uuid references employes(id) on delete set null,
  fiche_paie_id  uuid references fiches_paie(id) on delete set null,
  source         text not null default 'manuel' check (source in ('manuel','paie')),
  created_by     uuid default auth.uid(),
  created_at     timestamptz not null default now()
);
create index if not exists idx_tresorerie_date on tresorerie(date desc);
create unique index if not exists uq_tresorerie_fiche on tresorerie(fiche_paie_id) where fiche_paie_id is not null;

-- ── Fiches de paie : totaux calculés par la base, numéro, verrou ─
create or replace function h2o_somme_montants(p_lignes jsonb)
returns integer
language sql
immutable
as $$
  select coalesce(sum(
           case when jsonb_typeof(l->'montant') = 'number' then round((l->>'montant')::numeric)::integer else 0 end
         ), 0)::integer
    from jsonb_array_elements(coalesce(p_lignes, '[]'::jsonb)) as l
$$;

create or replace function h2o_fiche_paie_avant()
returns trigger
language plpgsql
as $$
declare
  dernier integer;
begin
  -- Une fiche payée est figée : il faut d'abord annuler son paiement
  if tg_op = 'UPDATE' and old.statut = 'paye' and new.statut = 'paye' then
    raise exception 'Fiche déjà payée : annulez le paiement avant de la modifier.';
  end if;

  new.total_brut      := new.salaire_base + h2o_somme_montants(new.gains);
  new.total_retenues  := h2o_somme_montants(new.retenues);
  new.net_a_payer     := new.total_brut - new.total_retenues;
  new.total_charges   := h2o_somme_montants(new.charges_patronales);
  if new.net_a_payer < 0 then
    raise exception 'Les retenues (%) dépassent le brut (%).', new.total_retenues, new.total_brut;
  end if;

  if new.numero is null or btrim(new.numero) = '' then
    perform pg_advisory_xact_lock(hashtext('numero_fiche_paie'));
    select coalesce(max(substring(numero from '(\d+)$')::integer), 0) into dernier
      from fiches_paie
     where numero like 'PAIE-' || to_char(new.mois, 'YYYY-MM') || '-%';
    new.numero := 'PAIE-' || to_char(new.mois, 'YYYY-MM') || '-' || lpad((dernier + 1)::text, 3, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_fiche_paie_avant on fiches_paie;
create trigger trg_fiche_paie_avant
  before insert or update on fiches_paie
  for each row execute function h2o_fiche_paie_avant();

create or replace function h2o_fiche_paie_suppression()
returns trigger
language plpgsql
as $$
begin
  if old.statut = 'paye' then
    raise exception 'Fiche payée : annulez le paiement avant de la supprimer.';
  end if;
  return old;
end;
$$;

drop trigger if exists trg_fiche_paie_suppression on fiches_paie;
create trigger trg_fiche_paie_suppression
  before delete on fiches_paie
  for each row execute function h2o_fiche_paie_suppression();

-- Le mouvement de trésorerie d'un salaire ne se supprime qu'en annulant le paiement de la fiche
create or replace function h2o_tresorerie_suppression()
returns trigger
language plpgsql
as $$
begin
  if old.source = 'paie' and exists (select 1 from fiches_paie where id = old.fiche_paie_id and statut = 'paye') then
    raise exception 'Cette dépense est un salaire payé : annulez le paiement depuis la fiche de paie.';
  end if;
  return old;
end;
$$;

drop trigger if exists trg_tresorerie_suppression on tresorerie;
create trigger trg_tresorerie_suppression
  before delete on tresorerie
  for each row execute function h2o_tresorerie_suppression();

-- ── Payer / annuler le paiement d'une fiche (atomique) ───────
create or replace function payer_fiche_paie(p_id uuid, p_date date default current_date, p_mode text default null)
returns fiches_paie
language plpgsql
as $$
declare
  f fiches_paie;
  e employes;
  v_mode text;
begin
  select * into f from fiches_paie where id = p_id for update;
  if not found then raise exception 'Fiche de paie introuvable.'; end if;
  if f.statut = 'paye' then raise exception 'Cette fiche est déjà payée.'; end if;
  if f.net_a_payer <= 0 then raise exception 'Net à payer nul : rien à payer.'; end if;

  select * into e from employes where id = f.employe_id;
  v_mode := coalesce(nullif(p_mode, ''), e.mode_paiement, 'especes');

  insert into tresorerie (date, type, categorie, libelle, montant, mode_paiement, beneficiaire, reference, employe_id, fiche_paie_id, source)
  values (coalesce(p_date, current_date), 'depense', 'Salaires',
          'Salaire ' || to_char(f.mois, 'MM/YYYY') || ' — ' || f.employe_nom,
          f.net_a_payer, v_mode, f.employe_nom, f.numero, f.employe_id, f.id, 'paie');

  update fiches_paie set statut = 'paye', date_paiement = coalesce(p_date, current_date), mode_paiement = v_mode
   where id = f.id returning * into f;
  return f;
end;
$$;

create or replace function annuler_paiement_fiche(p_id uuid)
returns fiches_paie
language plpgsql
as $$
declare f fiches_paie;
begin
  select * into f from fiches_paie where id = p_id for update;
  if not found then raise exception 'Fiche de paie introuvable.'; end if;
  if f.statut <> 'paye' then raise exception 'Cette fiche n''est pas payée.'; end if;

  update fiches_paie set statut = 'valide', date_paiement = null, mode_paiement = null where id = p_id returning * into f;
  delete from tresorerie where fiche_paie_id = p_id;
  return f;
end;
$$;

-- ── Accès : admin et gérance uniquement ──────────────────────
alter table employes        enable row level security;
alter table parametres_paie enable row level security;
alter table fiches_paie     enable row level security;
alter table tresorerie      enable row level security;

drop policy if exists employes_gestion on employes;
create policy employes_gestion on employes for all
  using (h2o_est_gestion()) with check (h2o_est_gestion());

drop policy if exists parametres_paie_gestion on parametres_paie;
create policy parametres_paie_gestion on parametres_paie for all
  using (h2o_est_gestion()) with check (h2o_est_gestion());

drop policy if exists fiches_paie_gestion on fiches_paie;
create policy fiches_paie_gestion on fiches_paie for all
  using (h2o_est_gestion()) with check (h2o_est_gestion());

drop policy if exists tresorerie_gestion on tresorerie;
create policy tresorerie_gestion on tresorerie for all
  using (h2o_est_gestion()) with check (h2o_est_gestion());

revoke all on function payer_fiche_paie(uuid, date, text) from public;
revoke all on function annuler_paiement_fiche(uuid) from public;
grant execute on function payer_fiche_paie(uuid, date, text) to authenticated;
grant execute on function annuler_paiement_fiche(uuid) to authenticated;

-- Rappel : sans compte admin ou gérance, personne ne verra ces modules
do $$
begin
  if not exists (select 1 from profiles where role in ('admin', 'gerance')) then
    raise notice 'Aucun profil admin/gérance : lancez  update profiles set role = ''admin'' where email = ''votre@email'';';
  end if;
end $$;
