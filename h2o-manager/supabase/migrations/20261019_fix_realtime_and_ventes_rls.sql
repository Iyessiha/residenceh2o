-- ============================================================
-- Migration : Activer Supabase Realtime + fix RLS ventes guest
-- Les managers reçoivent les nouvelles commandes en temps réel.
-- Le guest portal peut insérer des commandes boutique (ventes).
-- ============================================================

-- Ajouter les tables au canal Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE commandes_restaurant;
ALTER PUBLICATION supabase_realtime ADD TABLE demandes_assistance;
ALTER PUBLICATION supabase_realtime ADD TABLE ventes;

-- Policy manquante : le guest portal (anon) peut insérer dans ventes
CREATE POLICY IF NOT EXISTS "ventes_guest_insert" ON ventes
  FOR INSERT WITH CHECK (true);

-- Policy manquante : le guest portal (anon) peut lire les articles
CREATE POLICY IF NOT EXISTS "articles_public_read" ON articles
  FOR SELECT USING (actif = true);
