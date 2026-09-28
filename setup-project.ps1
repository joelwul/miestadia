# setup-project.ps1 - Crea toda la estructura automáticamente

Write-Host "🚀 Configurando proyecto Mi Estadía..." -ForegroundColor Green

$root = Get-Location

# Crear carpetas
$folders = @(
    "src/lib/supabase",
    "src/components/ui",
    "src/app/(guest)/[tenantSlug]",
    "src/app/(guest)/[tenantSlug]/stay",
    "src/app/(admin)/[tenantSlug]/admin/login",
    "src/app/(admin)/[tenantSlug]/admin/reservations",
    "src/app/(admin)/[tenantSlug]/admin/guests",
    "src/app/(admin)/[tenantSlug]/admin/units",
    "src/app/(admin)/[tenantSlug]/admin/destination",
    "src/app/(admin)/[tenantSlug]/admin/settings",
    "src/app/(admin)/[tenantSlug]/admin/messages"
)

foreach ($folder in $folders) {
    $path = Join-Path $root $folder
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
        Write-Host "✓ Creado: $folder" -ForegroundColor Yellow
    }
}

# Crear archivo .env.local si no existe
$envPath = Join-Path $root ".env.local"
if (-not (Test-Path $envPath)) {
    @"
NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_aqui
"@ | Out-File -FilePath $envPath -Encoding UTF8
    Write-Host "✓ Creado: .env.local" -ForegroundColor Yellow
}

# Crear lib/utils.ts
$utilsContent = @'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'ARS') {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function formatDate(date: string | Date, locale: string = 'es-AR') {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatTime(date: string | Date, locale: string = 'es-AR') {
  return new Date(date).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
}
'@

$utilsPath = Join-Path $root "src/lib/utils.ts"
$utilsContent | Out-File -FilePath $utilsPath -Encoding UTF8
Write-Host "✓ Creado: src/lib/utils.ts" -ForegroundColor Yellow

Write-Host "`n✅ ¡Setup completado!" -ForegroundColor Green
Write-Host "`nAhora ejecutá: npm run dev" -ForegroundColor Cyan