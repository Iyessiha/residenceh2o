-- Table: staff
-- Employés avec leurs rôles et tokens d'accès uniques pour /staff/[token]

CREATE TABLE IF NOT EXISTS staff (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom         TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('menage', 'restauration', 'reception', 'maintenance')),
  telephone   TEXT,
  token       TEXT NOT NULL UNIQUE DEFAULT substring(md5(random()::text), 1, 12),
  actif       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour lookup rapide par token (route /staff/[token])
CREATE INDEX IF NOT EXISTS staff_token_idx ON staff (token);

-- RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Lecture et écriture pour les utilisateurs authentifiés (gérante)
CREATE POLICY IF NOT EXISTS "staff_auth_all" ON staff
  FOR ALL USING (auth.role() = 'authenticated');

-- Lecture publique par token (pour les pages /staff/[token])
CREATE POLICY IF NOT EXISTS "staff_public_read_by_token" ON staff
  FOR SELECT USING (true);
