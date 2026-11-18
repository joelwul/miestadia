import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  MapPin,
  Bed,
  MessageSquare,
  LogOut,
  CheckCircle,
  FileText,
  Package,
  CreditCard,
  Menu,
  X,
  Lock,
} from 'lucide-react'

interface Props {
  children: React.ReactNode
  params: Promise<{ tenantSlug: string }>
}

export default async function AdminLayout({ children, params }: Props) {
  const { tenantSlug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Consultar los campos de suscripción del tenant
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('*, tenants(id, name, slug, subscription_status, trial_ends_at, subscription_ends_at)')
    .eq('user_id', user.id)
    .eq('tenants.slug', tenantSlug)
    .single()

  if (!tenantUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso no autorizado</h1>
          <p className="text-gray-600">No tenés permisos para acceder a este panel.</p>
          <Link href={`/${tenantSlug}`} className="text-green-600 hover:underline mt-4 inline-block">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  const tenant = tenantUser.tenants

  // ============================================
  // DETECTAR SI ESTÁ EN LA PÁGINA DE BILLING
  // ============================================
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || headersList.get('next-url') || ''
  const isBillingPage = pathname.includes('/admin/billing')

  // ============================================
  // LÓGICA DE BLOQUEO POR SUSCRIPCIÓN
  // ============================================
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const trialEndsAt = tenant?.trial_ends_at ? new Date(tenant.trial_ends_at) : null
  const subscriptionEndsAt = tenant?.subscription_ends_at ? new Date(tenant.subscription_ends_at) : null
  const subscriptionStatus = tenant?.subscription_status || 'trial'

  let isBlocked = false
  let blockReason = ''

  if (subscriptionStatus === 'active') {
    if (subscriptionEndsAt && subscriptionEndsAt < now) {
      isBlocked = true
      blockReason = 'Tu suscripción ha finalizado.'
    }
  } else if (subscriptionStatus === 'cancelled') {
    if (subscriptionEndsAt && subscriptionEndsAt < now) {
      isBlocked = true
      blockReason = 'Tu período pagado ha finalizado.'
    }
  } else if (subscriptionStatus === 'trial') {
    if (trialEndsAt && trialEndsAt < now) {
      isBlocked = true
      blockReason = 'Tu período de prueba ha finalizado.'
    }
  } else if (subscriptionStatus === 'expired') {
    isBlocked = true
    blockReason = 'Tu cuenta está vencida.'
  }

  // ============================================
  // NAVEGACIÓN
  // ============================================
  const navigation = [
    { name: 'Dashboard', href: `/${tenantSlug}/admin`, icon: LayoutDashboard },
    { name: 'Reservas', href: `/${tenantSlug}/admin/reservations`, icon: Calendar },
    { name: 'Pre-Checkins', href: `/${tenantSlug}/admin/pre-checkins`, icon: CheckCircle },
    { name: 'Huéspedes', href: `/${tenantSlug}/admin/guests`, icon: Users },
    { name: 'Unidades', href: `/${tenantSlug}/admin/units`, icon: Bed },
    { name: 'Calendario', href: `/${tenantSlug}/admin/calendar`, icon: Calendar },
    { name: 'Guías', href: `/${tenantSlug}/admin/guides`, icon: FileText },
    { name: 'Destino', href: `/${tenantSlug}/admin/destination`, icon: MapPin },
    { name: 'Mensajes', href: `/${tenantSlug}/admin/messages`, icon: MessageSquare },
    { name: 'Servicios', href: `/${tenantSlug}/admin/services`, icon: Package },
    { name: 'Pagos y Suscripción', href: `/${tenantSlug}/admin/billing`, icon: CreditCard },
    { name: 'Configuración', href: `/${tenantSlug}/admin/settings`, icon: Settings },
  ]

  // ============================================
  // PANTALLA DE BLOQUEO (solo si está bloqueado y NO en billing)
  // ============================================
  if (isBlocked && !isBillingPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cuenta bloqueada</h1>
          <p className="text-gray-600 mb-4">{blockReason}</p>
          <p className="text-gray-600 mb-6">
            Para seguir usando Mi Estadía, necesitás activar tu suscripción.
          </p>
          {trialEndsAt && subscriptionStatus === 'trial' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>Trial expiró el:</strong>{' '}
                {trialEndsAt.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}
          {subscriptionEndsAt && (subscriptionStatus === 'cancelled' || subscriptionStatus === 'expired') && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>Suscripción finalizó el:</strong>{' '}
                {subscriptionEndsAt.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}
          <Link
            href={`/${tenantSlug}/admin/billing`}
            className="block w-full bg-[#0F766E] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#0F766E]/90 transition-colors mb-3"
          >
            Activar suscripción
          </Link>
          <Link
            href="/login"
            className="block w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cerrar sesión
          </Link>
        </div>
      </div>
    )
  }

  // ============================================
  // LAYOUT NORMAL (cuando NO está bloqueado, o está en billing)
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-64 lg:bg-white lg:border-r lg:border-gray-200 lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <h1 className="text-xl font-bold text-green-700">Mi Estadía</h1>
        </div>
        <div className="border-b border-gray-200 px-6 py-4">
          <p className="text-sm font-medium text-gray-900">{tenantUser.tenants?.name}</p>
          <p className="text-xs text-gray-500">Panel de administración</p>
          {isBlocked && isBillingPage && (
            <div className="mt-2 px-2 py-1 bg-red-100 rounded text-xs text-red-700 font-medium flex items-center gap-1">
              <Lock className="w-3 h-3" /> Cuenta bloqueada - activá tu plan
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-200 p-3">
          <Link href="/login" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <LogOut className="h-5 w-5" /> Cerrar sesión
          </Link>
        </div>
      </aside>

      {/* Sidebar móvil */}
      <div id="mobile-sidebar" className="lg:hidden fixed inset-0 z-50 hidden">
        <div className="fixed inset-0 bg-black/50" onClick={() => {
          const sidebar = document.getElementById('mobile-sidebar');
          if (sidebar) sidebar.classList.add('hidden');
        }} />
        <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl flex flex-col">
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
            <h1 className="text-xl font-bold text-green-700">Mi Estadía</h1>
            <button onClick={() => {
              const sidebar = document.getElementById('mobile-sidebar');
              if (sidebar) sidebar.classList.add('hidden');
            }} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="border-b border-gray-200 px-6 py-4">
            <p className="text-sm font-medium text-gray-900">{tenantUser.tenants?.name}</p>
            <p className="text-xs text-gray-500">Panel de administración</p>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  const sidebar = document.getElementById('mobile-sidebar');
                  if (sidebar) sidebar.classList.add('hidden');
                }}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="border-t border-gray-200 p-3">
            <Link href="/login" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              <LogOut className="h-5 w-5" /> Cerrar sesión
            </Link>
          </div>
        </div>
      </div>

      {/* Header móvil */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button onClick={() => {
          const sidebar = document.getElementById('mobile-sidebar');
          if (sidebar) sidebar.classList.remove('hidden');
        }} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-green-700">Mi Estadía</h1>
        <div className="w-10" />
      </header>

      {/* Contenido principal */}
      <div className="lg:pl-64">
        <main className="p-4 lg:p-8 pt-20 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  )
}