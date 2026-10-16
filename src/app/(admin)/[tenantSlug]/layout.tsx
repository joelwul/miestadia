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
  CheckCircle,
  Globe,
  CreditCard,
  RefreshCw,
  Clock,
  Code,
  Home,
  BarChart3,
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
        { name: 'Pre-Checkins', href: `/${tenantSlug}/admin/pre-checkins`, icon: CheckCircle },
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
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200">
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
      <div className="pl-64">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}