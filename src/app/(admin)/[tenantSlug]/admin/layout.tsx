"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Lock, Crown, Clock } from "lucide-react";
import TrialBanner from "@/components/billing/TrialBanner";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSubLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    async function check() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: tenantUser } = await supabase
          .from("tenant_users")
          .select("tenants(id, slug, subscription_status, trial_ends_at, subscription_ends_at)")
          .eq("user_id", user.id)
          .single();

        if (tenantUser?.tenants) {
          const t = tenantUser.tenants;
          // Si está activo, verificar si expiró
          if (t.subscription_status === "active" && t.subscription_ends_at) {
            const end = new Date(t.subscription_ends_at);
            if (end < new Date()) {
              setBlocked(true);
            }
          }
          // Si está en trial y expiró
          else if (t.subscription_status === "trial" && t.trial_ends_at) {
            const end = new Date(t.trial_ends_at);
            if (end < new Date()) {
              setBlocked(true);
            }
          }

          // Cargar solicitudes pendientes
          if (!blocked) {
            const { count } = await supabase
              .from("reservation_requests")
              .select("*", { count: "exact", head: true })
              .eq("tenant_id", t.id)
              .eq("status", "pending");
            
            setPendingRequests(count || 0);
          }
        }
      } catch (err) {
        console.error("Error checking subscription:", err);
      } finally {
        setLoading(false);
      }
    }
    check();
  }, [blocked]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#0F766E]" />
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Período expirado
          </h1>
          <p className="text-gray-600 mb-6">
            Tu período de prueba o suscripción ha finalizado. Suscribite para reactivar tu cuenta y continuar usando Mi Estadía.
          </p>
          <button
            onClick={() => router.push(`/${tenantSlug}/admin/billing`)}
            className="w-full bg-[#0F766E] text-white py-3 rounded-lg font-semibold hover:bg-[#0F766E]/90 transition-colors flex items-center justify-center gap-2"
          >
            <Crown className="w-5 h-5" />
            Ver planes y suscribirme
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: `/${tenantSlug}/admin`, label: "Dashboard", icon: null },
    { 
      href: `/${tenantSlug}/admin/requests`, 
      label: "Solicitudes", 
      icon: Clock,
      badge: pendingRequests > 0 ? pendingRequests : null
    },
    { href: `/${tenantSlug}/admin/reservations`, label: "Reservas", icon: null },
    { href: `/${tenantSlug}/admin/pre-checkins`, label: "Pre-Checkins", icon: null },
    { href: `/${tenantSlug}/admin/guests`, label: "Huéspedes", icon: null },
    { href: `/${tenantSlug}/admin/units`, label: "Unidades", icon: null },
    { href: `/${tenantSlug}/admin/calendar`, label: "Calendario", icon: null },
    { href: `/${tenantSlug}/admin/guides`, label: "Guías", icon: null },
    { href: `/${tenantSlug}/admin/destination`, label: "Destino", icon: null },
    { href: `/${tenantSlug}/admin/messages`, label: "Mensajes", icon: null },
    { href: `/${tenantSlug}/admin/services`, label: "Servicios", icon: null },
    { href: `/${tenantSlug}/admin/billing`, label: "Pagos y Suscripción", icon: null },
    { href: `/${tenantSlug}/admin/settings`, label: "Configuración", icon: null },
  ];

  return (
    <>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 fixed h-full overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-[#0F766E]">Mi Estadía</h1>
            <p className="text-sm text-gray-500 mt-1">{tenantSlug}</p>
          </div>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#0F766E] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {Icon && <Icon className="w-4 h-4" />}
                    {item.label}
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-red-100 text-red-700"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 ml-64">
          {children}
        </main>
      </div>
      <TrialBanner />
    </>
  );
}