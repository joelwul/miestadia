# setup-completo.ps1 - Setup COMPLETO automatizado
# Ejecutar: .\setup-completo.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MI ESTADIA - Setup Completo" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$root = Get-Location

# ============================================
# 1. INSTALAR DEPENDENCIAS
# ============================================
Write-Host "1️⃣  Instalando dependencias..." -ForegroundColor Yellow
npm install class-variance-authority clsx tailwind-merge lucide-react @supabase/supabase-js @supabase/ssr zod react-hook-form @hookform/resolvers date-fns uuid
if ($LASTEXITCODE -ne 0) {
    Write-Host " Error instalando dependencias" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
Write-Host ""

# ============================================
# 2. CREAR CARPETAS
# ============================================
Write-Host "2️⃣  Creando estructura de carpetas..." -ForegroundColor Yellow

$folders = @(
    "src/lib/supabase",
    "src/components/ui",
    "src/app/(guest)/[tenantSlug]",
    "src/app/(guest)/[tenantSlug]/stay",
    "src/app/(admin)/[tenantSlug]/admin/(auth)/login",
    "src/app/(admin)/[tenantSlug]/admin/dashboard",
    "src/app/(admin)/[tenantSlug]/admin/reservations",
    "src/app/(admin)/[tenantSlug]/admin/guests",
    "src/app/(admin)/[tenantSlug]/admin/units",
    "src/app/(admin)/[tenantSlug]/admin/destination",
    "src/app/(admin)/[tenantSlug]/admin/settings"
)

foreach ($folder in $folders) {
    $path = Join-Path $root $folder
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
        Write-Host "   ✓ $folder" -ForegroundColor Green
    }
}
Write-Host ""

# ============================================
# 3. CREAR ARCHIVOS BASE
# ============================================
Write-Host "3️⃣  Creando archivos base..." -ForegroundColor Yellow

# utils.ts
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

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
'@

Set-Content -Path (Join-Path $root "src/lib/utils.ts") -Value $utilsContent -Encoding UTF8
Write-Host "   ✓ src/lib/utils.ts" -ForegroundColor Green

# .env.local (si no existe)
if (-not (Test-Path (Join-Path $root ".env.local"))) {
    $envContent = @'
NEXT_PUBLIC_SUPABASE_URL=tu_project_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
'@
    Set-Content -Path (Join-Path $root ".env.local") -Value $envContent -Encoding UTF8
    Write-Host "   ✓ .env.local" -ForegroundColor Green
}
Write-Host ""

# ============================================
# 4. CREAR COMPONENTES UI
# ============================================
Write-Host "4️  Creando componentes UI..." -ForegroundColor Yellow

$uiComponents = @{
    "button.tsx" = @'
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
        destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        ghost: "hover:bg-gray-100 text-gray-700",
        link: "text-green-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
'@

    "card.tsx" = @'
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-xl border border-gray-200 bg-white shadow-sm", className)} {...props} />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-gray-500", className)} {...props} />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
'@

    "input.tsx" = @'
import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
'@

    "badge.tsx" = @'
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-green-100 text-green-800",
        secondary: "border-transparent bg-gray-100 text-gray-900",
        destructive: "border-transparent bg-red-100 text-red-800",
        outline: "text-gray-950",
        warning: "border-transparent bg-yellow-100 text-yellow-800",
        info: "border-transparent bg-blue-100 text-blue-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
'@
}

foreach ($component in $uiComponents.Keys) {
    $path = Join-Path $root "src/components/ui/$component"
    $uiComponents[$component] | Set-Content -Path $path -Encoding UTF8
    Write-Host "   ✓ components/ui/$component" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   ✅ ¡Setup completado!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar:" -ForegroundColor Cyan
Write-Host "  .\iniciar.bat" -ForegroundColor White
Write-Host ""
Write-Host "URLs:" -ForegroundColor Cyan
Write-Host "  Huésped: http://localhost:3000/centroelprogreso" -ForegroundColor White
Write-Host "  Admin:   http://localhost:3000/centroelprogreso/admin/login" -ForegroundColor White
Write-Host ""