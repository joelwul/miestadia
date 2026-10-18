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
  MoreHorizontal,
  X,
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
    .select('*, tenants(id, name)')
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SIDEBAR DESKTOP - Solo visible en lg+ */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b border-gray-200 px-6">
            <h1 className="text-xl font-bold text-green-700">Mi Estadía</h1>
          </div>
          <div className="border-b border-gray-200 px-6 py-4">
            <p className="text-sm font-medium text-gray-900">
              {tenantUser.tenants?.name}
            </p>
            <p className="text-xs text-gray-500">Panel de administración</p>
          </div>
          <nav className="flex-1 space-y-4 px-3 py-4 overflow-y-auto">
            {navigationGroups.map((group) => (
              <div key={group.label}>
                <div className="px-3 py-2">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    {group.label}
                  </p>
                  <div className="mt-1 border-b border-gray-100" />
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
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
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold text-green-700">Mi Estadía</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Cerrar sesión">
            <LogOut className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {/* BOTTOM NAV MÓVIL */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex justify-around py-1.5 px-1">
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
              className="flex flex-col items-center gap-0.5 px-1.5 py-1 text-gray-600 hover:text-green-700 relative min-w-0 flex-1"
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-medium truncate max-w-full">{item.label}</span>
            </Link>
          )
        })}
        {/* Botón Más */}
        <button
          onClick={() => {
            const drawer = document.getElementById('mobile-menu-drawer')
            if (drawer) drawer.classList.remove('translate-x-full')
          }}
          className="flex flex-col items-center gap-0.5 px-1.5 py-1 text-gray-600 hover:text-green-700 min-w-0 flex-1"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[9px] font-medium">Más</span>
        </button>
      </nav>

      {/* DRAWER MÓVIL - Menú completo */}
      <div id="mobile-menu-drawer" className="lg:hidden fixed inset-0 z-50 translate-x-full transition-transform duration-300">
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => {
            const drawer = document.getElementById('mobile-menu-drawer')
            if (drawer) drawer.classList.add('translate-x-full')
          }}
        />
        <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Menú</h2>
            <button
              onClick={() => {
                const drawer = document.getElementById('mobile-menu-drawer')
                if (drawer) drawer.classList.add('translate-x-full')
              }}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4 space-y-6">
            {navigationGroups.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{group.label}</p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => {
                          const drawer = document.getElementById('mobile-menu-drawer')
                          if (drawer) drawer.classList.add('translate-x-full')
                        }}
                        className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
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
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="lg:pl-64 pt-14 pb-16 lg:pt-0 lg:pb-0">
        <main className="p-3 sm:p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}