-- ============================================================
-- Migration : Module Chambres
-- Chambres individuelles dans les duplexes (standard / VIP)
-- ============================================================

CREATE TABLE IF NOT EXISTS chambres (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duplex_id   uuid REFERENCES duplexes(id) ON DELETE CASCADE,
  duplex_nom  text,
  nom         text NOT NULL,
  code        text,
  type        text NOT NULL DEFAULT 'standard'
                CHECK (type IN ('standard', 'vip')),
  tarif_nuit  integer NOT NULL DEFAULT 60000,
  statut      text NOT NULL DEFAULT 'disponible'
                CHECK (statut IN ('disponible', 'occupee', 'maintenance')),
  capacite    integer NOT NULL DEFAULT 1,
  description text,
  features    text[] DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chambres_duplex  ON chambres(duplex_id);
CREATE INDEX IF NOT EXISTS idx_chambres_statut  ON chambres(statut);
CREATE INDEX IF NOT EXISTS idx_chambres_type    ON chambres(type);

ALTER TABLE chambres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_chambres_all" ON chambres
  FOR ALL USING (auth.role() = 'authenticated');

-- Lecture publique (landing + guest portal)
CREATE POLICY "public_read_chambres" ON chambres
  FOR SELECT USING (true);

-- Realtime pour le manager
ALTER PUBLICATION supabase_realtime ADD TABLE chambres;
