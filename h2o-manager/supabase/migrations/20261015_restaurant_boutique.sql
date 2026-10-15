-- ============================================================
-- Migration : Module Restaurant & Module Boutique
-- À appliquer via Supabase > SQL Editor
-- ============================================================

-- ── Restaurant : commandes ──────────────────────────────────
CREATE TABLE IF NOT EXISTS commandes_restaurant (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid REFERENCES clients(id) ON DELETE SET NULL,
  nom_client    text NOT NULL,
  telephone     text,
  table_num     text,
  lignes        jsonb NOT NULL DEFAULT '[]',
  montant_total integer NOT NULL DEFAULT 0,
  mode_paiement text NOT NULL DEFAULT 'especes',
  statut        text NOT NULL DEFAULT 'en_cours'
                  CHECK (statut IN ('en_cours','servie','payee','annulee')),
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Index pour filtrer par statut et date rapidement
CREATE INDEX IF NOT EXISTS idx_cmd_rest_statut    ON commandes_restaurant(statut);
CREATE INDEX IF NOT EXISTS idx_cmd_rest_client    ON commandes_restaurant(client_id);
CREATE INDEX IF NOT EXISTS idx_cmd_rest_created   ON commandes_restaurant(created_at DESC);

-- RLS : activer et protéger
ALTER TABLE commandes_restaurant ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_users_cmd_rest" ON commandes_restaurant
  FOR ALL USING (auth.role() = 'authenticated');

-- ── Boutique : catalogue articles ───────────────────────────
CREATE TABLE IF NOT EXISTS articles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom         text NOT NULL,
  description text,
  prix        integer NOT NULL DEFAULT 0,
  stock       integer NOT NULL DEFAULT 0,
  categorie   text,
  actif       boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_users_articles" ON articles
  FOR ALL USING (auth.role() = 'authenticated');

-- ── Boutique : ventes ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS ventes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid REFERENCES clients(id) ON DELETE SET NULL,
  nom_client    text NOT NULL,
  telephone     text,
  lignes        jsonb NOT NULL DEFAULT '[]',
  montant_total integer NOT NULL DEFAULT 0,
  mode_paiement text NOT NULL DEFAULT 'especes',
  statut        text NOT NULL DEFAULT 'payee'
                  CHECK (statut IN ('en_attente','payee','annulee')),
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ventes_statut   ON ventes(statut);
CREATE INDEX IF NOT EXISTS idx_ventes_client   ON ventes(client_id);
CREATE INDEX IF NOT EXISTS idx_ventes_created  ON ventes(created_at DESC);

ALTER TABLE ventes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_users_ventes" ON ventes
  FOR ALL USING (auth.role() = 'authenticated');
