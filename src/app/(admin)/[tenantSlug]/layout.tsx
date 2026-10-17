import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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
  Globe,
  CreditCard,
  RefreshCw,
  Clock,
  Code,
  Home,
  BarChart3,
  Menu,
  X,
  AlertTriangle,
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

  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('*, tenants(id, name, trial_ends_at, subscription_status)')
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

  // Verificar trial
  const trialEndsAt = tenantUser.tenants?.trial_ends_at ? new Date(tenantUser.tenants.trial_ends_at) : null
  const isTrialExpired = trialEndsAt && trialEndsAt < new Date()
  const subscriptionStatus = tenantUser.tenants?.subscription_status

  let pendingRequests = 0
  if (tenantUser.tenants?.id) {
    const { count } = await supabase
      .from('reservation_requests')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantUser.tenants.id)
      .eq('status', 'pending')
    pendingRequests = count || 0
  }

  const navigationGroups = [
    {
      label: 'OPERACIONES DIARIAS',
      items: [
        { name: 'Dashboard', href: `/${tenantSlug}/admin`, icon: LayoutDashboard },
        {
          name: 'Solicitudes',
          href: `/${tenantSlug}/admin/requests`,
          icon: Clock,
          badge: pendingRequests > 0 ? pendingRequests : null,
        },
        { name: 'Reservas', href: `/${tenantSlug}/admin/reservations`, icon: Calendar },
        { name: 'Calendario', href: `/${tenantSlug}/admin/calendar`, icon: Calendar },
        { name: 'Analytics', href: `/${tenantSlug}/admin/analytics`, icon: BarChart3 },
      ],
    },
    {
      label: 'GESTIÓN',
      items: [
        { name: 'Huéspedes', href: `/${tenantSlug}/admin/guests`, icon: Users },
        { name: 'Unidades', href: `/${tenantSlug}/admin/units`, icon: Bed },
        { name: 'Destino', href: `/${tenantSlug}/admin/destination`, icon: MapPin },
        { name: 'Mensajes', href: `/${tenantSlug}/admin/messages`, icon: MessageSquare },
        { name: 'Guías', href: `/${tenantSlug}/admin/guides`, icon: Globe },
        { name: 'Servicios', href: `/${tenantSlug}/admin/services`, icon: Home },
      ],
    },
    {
      label: 'CONFIGURACIÓN',
      items: [
        { name: 'Pagos y Suscripción', href: `/${tenantSlug}/admin/billing`, icon: CreditCard },
        { name: 'Sincro con Booking y Airbnb', href: `/${tenantSlug}/admin/calendar-sync`, icon: RefreshCw },
        { name: 'Mi Sitio Web', href: `/${tenantSlug}/admin/landing`, icon: Globe },
        { name: 'Reservador Online', href: `/${tenantSlug}/admin/embed`, icon: Code },
        { name: 'Configuración', href: `/${tenantSlug}/admin/settings`, icon: Settings },
      ],
    },
  ]

  // Si el trial expiró y no está en billing, mostrar pantalla de bloqueo
  const currentPath = `/${tenantSlug}/admin`
  const isBillingPage = currentPath.includes('/billing')

  if (isTrialExpired && subscriptionStatus !== 'active' && !isBillingPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tu trial expiró</h1>
          <p className="text-gray-600 mb-6">
            Tu período de prueba de 30 días ha finalizado. Para seguir usando Mi Estadía, necesitás activar tu suscripción.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800">
              <strong>Trial expiró el:</strong>{' '}
              {trialEndsAt?.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b border-gray-200 px-6">
            <h1 className="text-xl font-bold text-green-700">Mi Estadía</h1>
          </div>
          <div className="border-b border-gray-200 px-6 py-4">
            <p className="text-sm font-medium text-gray-900">{tenantUser.tenants?.name}</p>
            <p className="text-xs text-gray-500">Panel de administración</p>
            {isTrialExpired && subscriptionStatus !== 'active' && (
              <div className="mt-2 px-2 py-1 bg-red-100 rounded text-xs text-red-700 font-medium">
                ⚠️ Trial expirado
              </div>
            )}
          </div>
          <nav className="flex-1 space-y-4 px-3 py-4 overflow-y-auto">
            {navigationGroups.map((group) => (
              <div key={group.label}>
                <div className="px-3 py-2">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{group.label}</p>
                  <div className="mt-1 border-b border-gray-100" />
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const isDisabled = isTrialExpired && subscriptionStatus !== 'active' && !item.href.includes('/billing')
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                          isDisabled
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                        onClick={isDisabled ? (e) => e.preventDefault() : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          {item.name}
                        </div>
                        {item.badge && (
                          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="border-t border-gray-200 p-3">
            <Link
              href="/login"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Cerrar sesión
            </Link>
          </div>
        </div>
      </aside>

      {/* HEADER MÓVIL */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-green-700">Mi Estadía</h1>
        </div>
        <div className="flex items-center gap-2">
          {isTrialExpired && subscriptionStatus !== 'active' && (
            <Link href={`/${tenantSlug}/admin/billing`} className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg">
              Activar
            </Link>
          )}
          <Link href="/login" className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <LogOut className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {/* BOTTOM NAV MÓVIL */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex justify-around py-2 px-2">
        {[
          { href: `/${tenantSlug}/admin`, icon: LayoutDashboard, label: 'Inicio' },
          { href: `/${tenantSlug}/admin/reservations`, icon: Calendar, label: 'Reservas', badge: pendingRequests },
          { href: `/${tenantSlug}/admin/requests`, icon: Clock, label: 'Solicitudes' },
          { href: `/${tenantSlug}/admin/billing`, icon: CreditCard, label: 'Pagos' },
          { href: `/${tenantSlug}/admin/settings`, icon: Settings, label: 'Config' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-2 py-1 text-gray-600 hover:text-green-700 relative"
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <div className="lg:pl-64 pt-16 pb-20 lg:pt-0 lg:pb-0">
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}