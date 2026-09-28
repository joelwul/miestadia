-- Tabla de facturas
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  plan VARCHAR(20) NOT NULL,
  period VARCHAR(100) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_subscription_id VARCHAR(255),
  provider_payment_id VARCHAR(255),
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date DESC);

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Tenants can view their own invoices"
  ON invoices
  FOR SELECT
  USING (tenant_id IN (
    SELECT id FROM tenants WHERE owner_id = auth.uid()
  ));

CREATE POLICY "System can insert invoices"
  ON invoices
  FOR INSERT
  WITH CHECK (true);