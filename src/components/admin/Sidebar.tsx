"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Home,
  Settings,
  MessageCircle,
  BarChart3,
  CreditCard,
} from "lucide-react";

interface SidebarProps {
  tenantSlug: string;
}

export default function Sidebar({ tenantSlug }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { href: `/${tenantSlug}/admin/dashboard`, label: "Dashboard", icon: LayoutDashboard },
    { href: `/${tenantSlug}/admin/reservations`, label: "Reservas", icon: Calendar },
    { href: `/${tenantSlug}/admin/guests`, label: "Huéspedes", icon: Users },
    { href: `/${tenantSlug}/admin/units`, label: "Unidades", icon: Home },
    { href: `/${tenantSlug}/admin/messages`, label: "Mensajes", icon: MessageCircle },
    { href: `/${tenantSlug}/admin/analytics`, label: "Reportes", icon: BarChart3 },
    { href: `/${tenantSlug}/admin/billing`, label: "Pagos y Suscripción", icon: CreditCard },
    { href: `/${tenantSlug}/admin/settings`, label: "Configuración", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <Link href={`/${tenantSlug}/admin/dashboard`} className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0F766E] rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">Mi Estadía</h1>
            <p className="text-xs text-gray-500">Panel de Admin</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? "bg-[#0F766E] text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <Link
          href={`/${tenantSlug}`}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Home className="w-5 h-5" />
          <span className="font-medium">Ver sitio público</span>
        </Link>
      </div>
    </aside>
  );
}