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
  FileText,
  Package,
  CreditCard,
  Menu,
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
    .select('*, tenants(name)')
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
          <Link
            href="/login"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </Link>
        </div>
      </aside>

      {/* Sidebar móvil (drawer) */}
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
            <Link
              href="/login"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Cerrar sesión
            </Link>
          </div>
        </div>
      </div>

      {/* Header móvil */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => {
            const sidebar = document.getElementById('mobile-sidebar');
            if (sidebar) sidebar.classList.remove('hidden');
          }}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-green-700">Mi Estadía</h1>
        <div className="w-10" /> {/* Spacer para centrar el título */}
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