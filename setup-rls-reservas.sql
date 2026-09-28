-- Políticas RLS para reservas (multi-tenant seguro)

-- Habilitar RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- Política para que cada tenant solo vea sus reservas
CREATE POLICY "tenants_can_view_own_reservations"
ON reservations FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM tenant_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "tenants_can_insert_own_reservations"
ON reservations FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM tenant_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "tenants_can_update_own_reservations"
ON reservations FOR UPDATE
USING (
  tenant_id IN (
    SELECT tenant_id FROM tenant_users 
    WHERE user_id = auth.uid()
  )
);

-- Huéspedes: mismo aislamiento
CREATE POLICY "tenants_can_view_own_guests"
ON guests FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM tenant_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "tenants_can_insert_own_guests"
ON guests FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM tenant_users 
    WHERE user_id = auth.uid()
  )
);

-- Unidades
CREATE POLICY "tenants_can_view_own_units"
ON units FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM tenant_users 
    WHERE user_id = auth.uid()
  )
);

-- Permitir acceso público para huéspedes (sin auth)
CREATE POLICY "public_can_view_reservations_by_code"
ON reservations FOR SELECT
USING (true);

CREATE POLICY "public_can_view_guests_for_reservation"
ON guests FOR SELECT
USING (true);

CREATE POLICY "public_can_view_units"
ON units FOR SELECT
USING (true);
