Write-Host "📦 Creando SQL para storage..." -ForegroundColor Cyan

$sql = @"
-- Crear bucket para assets de tenants
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tenant-assets', 'tenant-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para permitir upload y lectura
CREATE POLICY "Allow authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tenant-assets');

CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'tenant-assets');

CREATE POLICY "Allow authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'tenant-assets');
"@

$sql | Out-File -FilePath "setup-storage.sql" -Encoding UTF8
Write-Host "✅ SQL creado: setup-storage.sql" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Ejecutá este SQL en Supabase > SQL Editor" -ForegroundColor Yellow