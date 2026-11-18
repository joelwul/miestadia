"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Calendar, Users, Settings, MapPin, Bed, MessageSquare,
  LogOut, CheckCircle, FileText, Package, CreditCard, Menu, X, Lock,
} from "lucide-react";
import { useState } from "react";

interface SubscriptionInfo {
  blocked: boolean;
  reason: string;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  subscriptionStatus: string;
}

interface Props {
  children: React.ReactNode;
  tenantName: string;
  tenantSlug: string;
  subscription: SubscriptionInfo;
}

export default function AdminShell({ children, tenantName, tenantSlug, subscription }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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
  ];

  const isBilling = pathname.includes("/admin/billing");

  // ============================================
  // PANTALLA DE BLOQUEO (si bloqueado y NO es billing)
  // ============================================
  if (subscription.blocked && !isBilling) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cuenta bloqueada</h1>
          <p className="text-gray-600 mb-4">{subscription.reason}</p>
          <p className="text-gray-600 mb-6">Para seguir usando Mi Estadía, activá tu suscripción.</p>
          {subscription.trialEndsAt && subscription.subscriptionStatus === "trial" && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>Trial expiró el:</strong>{" "}
                {new Date(subscription.trialEndsAt).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>
          )}
          {subscription.subscriptionEndsAt && (subscription.subscriptionStatus === "cancelled" || subscription.subscriptionStatus === "expired") && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>Suscripción finalizó el:</strong>{" "}
                {new Date(subscription.subscriptionEndsAt).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
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
    );
  }

  // ============================================
  // LAYOUT NORMAL (o billing habilitado)
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-64 lg:bg-white lg:border-r lg:border-gray-200 lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <h1 className="text-xl font-bold text-green-700">Mi Estadía</h1>
        </div>
        <div className="border-b border-gray-200 px-6 py-4">
          <p className="text-sm font-medium text-gray-900">{tenantName}</p>
          <p className="text-xs text-gray-500">Panel de administración</p>
          {subscription.blocked && isBilling && (
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
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl flex flex-col">
            <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
              <h1 className="text-xl font-bold text-green-700">Mi Estadía</h1>
              <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="border-b border-gray-200 px-6 py-4">
              <p className="text-sm font-medium text-gray-900">{tenantName}</p>
              <p className="text-xs text-gray-500">Panel de administración</p>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
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
      )}

      {/* Header móvil */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setMobileOpen(true)} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-green-700">Mi Estadía</h1>
        <div className="w-10" />
      </header>

      {/* Contenido */}
      <div className="lg:pl-64">
        <main className="p-4 lg:p-8 pt-20 lg:pt-8">{children}</main>
      </div>
    </div>
  );
}