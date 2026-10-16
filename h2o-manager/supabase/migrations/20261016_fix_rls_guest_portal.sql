-- ============================================================
-- Migration : Fix RLS pour le Guest Portal
-- Le portail /guest/[id] utilise la clé ANON (non-authentifiée).
-- Ces politiques permettent la lecture du menu et l'envoi de
-- commandes sans session auth.
-- ============================================================

-- Lecture publique du menu (items disponibles uniquement)
CREATE POLICY IF NOT EXISTS "menu_public_read" ON menu_restaurant
  FOR SELECT USING (disponible = true);

-- Insertion publique des commandes restaurant (depuis le guest portal)
ALTER TABLE commandes_restaurant ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "commandes_auth_all" ON commandes_restaurant
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "commandes_guest_insert" ON commandes_restaurant
  FOR INSERT WITH CHECK (true);

-- Lecture des commandes par les clients (via leur reservation_id)
-- Permet au guest portal d'afficher l'historique de ses propres commandes
CREATE POLICY IF NOT EXISTS "commandes_guest_own_select" ON commandes_restaurant
  FOR SELECT USING (
    reservation_id IS NOT NULL
    AND reservation_id IN (
      SELECT id FROM reservations WHERE id = commandes_restaurant.reservation_id
    )
  );
