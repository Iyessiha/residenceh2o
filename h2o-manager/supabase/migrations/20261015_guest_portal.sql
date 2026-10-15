-- ============================================================
-- Migration : Portail invité (Guest Portal)
-- À appliquer via Supabase > SQL Editor
-- ============================================================

-- ── Table demandes_assistance ──────────────────────────────
CREATE TABLE IF NOT EXISTS demandes_assistance (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duplex_id   uuid REFERENCES duplexes(id) ON DELETE SET NULL,
  duplex_code text,
  duplex_nom  text,
  message     text NOT NULL,
  nom_client  text,
  telephone   text,
  statut      text NOT NULL DEFAULT 'nouveau'
                CHECK (statut IN ('nouveau', 'en_cours', 'resolu')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assistance_statut   ON demandes_assistance(statut);
CREATE INDEX IF NOT EXISTS idx_assistance_duplex   ON demandes_assistance(duplex_id);
CREATE INDEX IF NOT EXISTS idx_assistance_created  ON demandes_assistance(created_at DESC);

ALTER TABLE demandes_assistance ENABLE ROW LEVEL SECURITY;

-- Staff : tout faire
CREATE POLICY "auth_staff_assistance" ON demandes_assistance
  FOR ALL USING (auth.role() = 'authenticated');

-- Invités (anon) : seulement insérer
CREATE POLICY "guest_insert_assistance" ON demandes_assistance
  FOR INSERT WITH CHECK (true);

-- ── Accès public lecture (menu + articles + duplexes) ─────
-- menu_restaurant : lecture publique
CREATE POLICY "public_read_menu" ON menu_restaurant
  FOR SELECT USING (true);

-- articles boutique : lecture publique (uniquement actifs)
CREATE POLICY "public_read_articles" ON articles
  FOR SELECT USING (actif = true);

-- duplexes : lecture publique (nom, code — pas les données sensibles)
CREATE POLICY "public_read_duplexes" ON duplexes
  FOR SELECT USING (true);

-- ── Accès public insertion (commandes & ventes invités) ───
-- commandes_restaurant : les invités peuvent passer commande
CREATE POLICY "guest_insert_cmd_rest" ON commandes_restaurant
  FOR INSERT WITH CHECK (true);

-- ventes boutique : les invités peuvent commander
CREATE POLICY "guest_insert_ventes" ON ventes
  FOR INSERT WITH CHECK (true);
