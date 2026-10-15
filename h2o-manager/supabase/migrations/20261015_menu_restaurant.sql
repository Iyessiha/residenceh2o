-- ============================================================
-- Migration : Menu Restaurant
-- À appliquer via Supabase > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS menu_restaurant (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom         text NOT NULL,
  description text,
  prix        integer NOT NULL DEFAULT 0,
  categorie   text NOT NULL DEFAULT 'plat'
                CHECK (categorie IN ('plat','vin','jus','boisson','dessert','entree','autre')),
  disponible  boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_categorie  ON menu_restaurant(categorie);
CREATE INDEX IF NOT EXISTS idx_menu_disponible ON menu_restaurant(disponible);

ALTER TABLE menu_restaurant ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_users_menu" ON menu_restaurant
  FOR ALL USING (auth.role() = 'authenticated');
