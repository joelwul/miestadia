-- Agregar columnas de suscripción a tenants si no existen
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'trial';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255);

-- Establecer trial de 30 días para tenants existentes que no tienen trial_ends_at
UPDATE tenants 
SET trial_ends_at = NOW() + INTERVAL '30 days'
WHERE trial_ends_at IS NULL AND subscription_status = 'trial';

-- Índices
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_status ON tenants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_tenants_trial_ends_at ON tenants(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_ends_at ON tenants(subscription_ends_at);