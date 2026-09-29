"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Home,
  UserCheck,
} from "lucide-react";
import Link from "next/link";

interface Tenant {
  name: string;
  slug: string;
  subscription_status: string;
  trial_ends_at: string;
  owner_name: string;
}

export default function DashboardPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeReservations: 0,
    guestsCheckedIn: 0,
    pendingCheckins: 0,
    revenue: 0,
  });
  const supabase = createClient();

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { data: tenantData, error: tenantError } = await supabase
          .from("tenants")
          .select("*")
          .eq("slug", tenantSlug)
          .single();

        if (tenantError || !tenantData) {
          setLoading(false);
          return;
        }

        setTenant(tenantData);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split("T")[0];

        // Reservas activas (booked, pre_checkin, checked_in)
        const { data: activeRes } = await supabase
          .from("reservations")
          .select("id")
          .eq("tenant_id", tenantData.id)
          .in("status", ["booked", "pre_checkin", "checked_in"]);

        // Huéspedes actualmente alojados (checked_in con check_out >= hoy)
        const { data: checkedInRes } = await supabase
          .from("reservations")
          .select("id, guest_id, check_out")
          .eq("tenant_id", tenantData.id)
          .eq("status", "checked_in")
          .gte("check_out", todayStr);

        // Check-ins pendientes para hoy
        const { data: pendingCheckins } = await supabase
          .from("reservations")
          .select("id")
          .eq("tenant_id", tenantData.id)
          .in("status", ["booked", "pre_checkin"])
          .eq("check_in", todayStr);

        // Ingresos del mes
        const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const { data: payments } = await supabase
          .from("reservations")
          .select("paid_amount")
          .eq("tenant_id", tenantData.id)
          .gte("created_at", firstOfMonth);

        const totalRevenue = (payments || []).reduce((sum: number, r: any) => sum + (r.paid_amount || 0), 0);

        setStats({
          activeReservations: activeRes?.length || 0,
          guestsCheckedIn: checkedInRes?.length || 0,
          pendingCheckins: pendingCheckins?.length || 0,
          revenue: totalRevenue,
        });
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [tenantSlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F766E]" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No se encontró el alojamiento</h2>
          <p className="text-gray-600">El slug "{tenantSlug}" no existe en la base de datos.</p>
        </div>
      </div>
    );
  }

  const trialEnds = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : null;
  const daysLeft = trialEnds ? Math.ceil((trialEnds.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  const isTrial = tenant.subscription_status === "trial";
  const isActive = tenant.subscription_status === "active";

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#0F766E] to-[#166534] rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">¡Bienvenido{tenant.owner_name ? `, ${tenant.owner_name}` : ""}!</h1>
        <p className="text-white/90 text-lg">Panel de administración de <strong>{tenant.name}</strong></p>
      </div>

      {isTrial && daysLeft !== null && (
        <div className={`rounded-lg p-4 border ${daysLeft <= 3 ? "bg-red-50 border-red-200" : daysLeft <= 7 ? "bg-yellow-50 border-yellow-200" : "bg-blue-50 border-blue-200"}`}>
          <div className="flex items-center gap-3">
            <Clock className={`w-5 h-5 ${daysLeft <= 3 ? "text-red-600" : daysLeft <= 7 ? "text-yellow-600" : "text-blue-600"}`} />
            <div>
              <p className="font-semibold text-gray-900">Período de prueba: {daysLeft} {daysLeft === 1 ? "día" : "días"} restantes</p>
              <p className="text-sm text-gray-600">{daysLeft <= 3 ? "¡Últimos días! Suscribite ahora para no perder acceso." : "Disfrutá de todas las funcionalidades durante tu prueba."}</p>
            </div>
          </div>
        </div>
      )}

      {isActive && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">Plan activo</p>
              <p className="text-sm text-green-700">Tu suscripción está activa y al día.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 text-[#0F766E]" />
            <span className="text-xs bg-[#0F766E]/10 text-[#0F766E] px-2 py-1 rounded-full">Activas</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.activeReservations}</p>
          <p className="text-sm text-gray-500 mt-1">Reservas activas</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <UserCheck className="w-8 h-8 text-[#EA580C]" />
            <span className="text-xs bg-[#EA580C]/10 text-[#EA580C] px-2 py-1 rounded-full">Hoy</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.guestsCheckedIn}</p>
          <p className="text-sm text-gray-500 mt-1">Huéspedes alojados</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-[#F59E0B]" />
            <span className="text-xs bg-[#F59E0B]/10 text-[#F59E0B] px-2 py-1 rounded-full">Pendientes</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.pendingCheckins}</p>
          <p className="text-sm text-gray-500 mt-1">Check-ins hoy</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-[#166534]" />
            <span className="text-xs bg-[#166534]/10 text-[#166534] px-2 py-1 rounded-full">Este mes</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">${stats.revenue.toLocaleString("es-AR")}</p>
          <p className="text-sm text-gray-500 mt-1">Ingresos</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Accesos rápidos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href={`/${tenantSlug}/admin/reservations`} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#0F766E] hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-3">
              <Calendar className="w-6 h-6 text-[#0F766E]" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Reservas</h3>
            <p className="text-sm text-gray-500">Gestioná tus reservas y check-ins</p>
          </Link>
          <Link href={`/${tenantSlug}/admin/guests`} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#0F766E] hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-6 h-6 text-[#EA580C]" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Huéspedes</h3>
            <p className="text-sm text-gray-500">Información de tus huéspedes</p>
          </Link>
          <Link href={`/${tenantSlug}/admin/billing`} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#0F766E] hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-3">
              <DollarSign className="w-6 h-6 text-[#166534]" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Pagos y Suscripción</h3>
            <p className="text-sm text-gray-500">Gestioná tu plan de pago</p>
          </Link>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Estado del sistema</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-700">Alojamiento</span>
            <span className="font-medium text-gray-900">{tenant.name}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-700">Slug</span>
            <span className="font-mono text-sm text-gray-900">{tenant.slug}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-700">Estado de suscripción</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${isActive ? "bg-green-100 text-green-700" : isTrial ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
              {tenant.subscription_status || "trial"}
            </span>
          </div>
          {trialEnds && (
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-700">Fin del trial</span>
              <span className="font-medium text-gray-900">{trialEnds.toLocaleDateString("es-AR")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}