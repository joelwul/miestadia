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
  ArrowUpRight,
  LogOut,
} from "lucide-react";
import Link from "next/link";

interface Tenant {
  name: string;
  slug: string;
  subscription_status: string;
  trial_ends_at: string;
  owner_name: string;
}

interface Reservation {
  id: string;
  reservation_code: string;
  guest_id: string;
  unit_id: string;
  check_in: string;
  check_out: string;
  status: string;
  total_amount: number;
  paid_amount: number;
  guest?: { first_name: string; last_name: string };
  unit?: { name: string };
}

export default function DashboardPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    arrivalsToday: 0,
    departuresToday: 0,
    guestsCheckedIn: 0,
    upcomingReservations: 0,
    occupancy: 0,
  });
  const [upcomingArrivals, setUpcomingArrivals] = useState<Reservation[]>([]);
  const [currentGuests, setCurrentGuests] = useState<Reservation[]>([]);
  const [totalUnits, setTotalUnits] = useState(0);
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

        // Auto check-out: marcar como checked_out las reservas con check_out < hoy y status checked_in
        const { data: overdueCheckouts } = await supabase
          .from("reservations")
          .select("id")
          .eq("tenant_id", tenantData.id)
          .eq("status", "checked_in")
          .lt("check_out", todayStr);

        if (overdueCheckouts && overdueCheckouts.length > 0) {
          await supabase
            .from("reservations")
            .update({ status: "checked_out" })
            .in("id", overdueCheckouts.map(r => r.id));
        }

        // Total de unidades activas
        const { count: unitsCount } = await supabase
          .from("units")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", tenantData.id)
          .eq("status", "active");

        setTotalUnits(unitsCount || 0);

        // Llegadas hoy: check_in = hoy, status booked o pre_checkin
        const { data: arrivalsToday } = await supabase
          .from("reservations")
          .select("id")
          .eq("tenant_id", tenantData.id)
          .eq("check_in", todayStr)
          .in("status", ["booked", "pre_checkin"]);

        // Salidas hoy: check_out = hoy, status checked_in
        const { data: departuresToday } = await supabase
          .from("reservations")
          .select("id")
          .eq("tenant_id", tenantData.id)
          .eq("check_out", todayStr)
          .eq("status", "checked_in");

        // Huéspedes alojados: status = checked_in y check_out >= hoy
        const { data: checkedInRes } = await supabase
          .from("reservations")
          .select("id, guest_id, check_out")
          .eq("tenant_id", tenantData.id)
          .eq("status", "checked_in")
          .gte("check_out", todayStr);

        // Próximas reservas: check_in > hoy, status booked o pre_checkin
        const { data: upcomingRes } = await supabase
          .from("reservations")
          .select("id")
          .eq("tenant_id", tenantData.id)
          .gt("check_in", todayStr)
          .in("status", ["booked", "pre_checkin"]);

        // Próximas llegadas (próximos 7 días)
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().split("T")[0];

        const { data: upcomingData } = await supabase
          .from("reservations")
          .select("id, reservation_code, guest_id, unit_id, check_in, check_out, status, total_amount, paid_amount")
          .eq("tenant_id", tenantData.id)
          .in("status", ["booked", "pre_checkin", "checked_in"])
          .gte("check_in", todayStr)
          .lte("check_in", nextWeekStr)
          .order("check_in", { ascending: true })
          .limit(5);

        // Huéspedes alojados actualmente
        const { data: currentData } = await supabase
          .from("reservations")
          .select("id, reservation_code, guest_id, unit_id, check_in, check_out, status, total_amount, paid_amount")
          .eq("tenant_id", tenantData.id)
          .eq("status", "checked_in")
          .gte("check_out", todayStr)
          .order("check_out", { ascending: true });

        // Enriquecer con datos de huéspedes y unidades
        const { data: guestsData } = await supabase
          .from("guests")
          .select("id, first_name, last_name")
          .eq("tenant_id", tenantData.id);

        const { data: unitsData } = await supabase
          .from("units")
          .select("id, name")
          .eq("tenant_id", tenantData.id);

        const enrichReservations = (reservations: any[]) => {
          return (reservations || []).map((res: any) => ({
            ...res,
            guest: guestsData?.find((g: any) => g.id === res.guest_id),
            unit: unitsData?.find((u: any) => u.id === res.unit_id),
          }));
        };

        setUpcomingArrivals(enrichReservations(upcomingData));
        setCurrentGuests(enrichReservations(currentData));

        // Calcular ocupación
        const occupancy = totalUnits > 0 && checkedInRes ? Math.round((checkedInRes.length / totalUnits) * 100) : 0;

        setStats({
          arrivalsToday: arrivalsToday?.length || 0,
          departuresToday: departuresToday?.length || 0,
          guestsCheckedIn: checkedInRes?.length || 0,
          upcomingReservations: upcomingRes?.length || 0,
          occupancy,
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "booked": return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Confirmada</span>;
      case "pre_checkin": return <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Pre check-in</span>;
      case "checked_in": return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Alojado</span>;
      default: return null;
    }
  };

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 text-[#0F766E]" />
            <span className="text-xs bg-[#0F766E]/10 text-[#0F766E] px-2 py-1 rounded-full">Hoy</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.arrivalsToday}</p>
          <p className="text-sm text-gray-500 mt-1">Llegadas hoy</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <LogOut className="w-8 h-8 text-[#EA580C]" />
            <span className="text-xs bg-[#EA580C]/10 text-[#EA580C] px-2 py-1 rounded-full">Hoy</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.departuresToday}</p>
          <p className="text-sm text-gray-500 mt-1">Salidas hoy</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <UserCheck className="w-8 h-8 text-[#166534]" />
            <span className="text-xs bg-[#166534]/10 text-[#166534] px-2 py-1 rounded-full">Ahora</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.guestsCheckedIn}</p>
          <p className="text-sm text-gray-500 mt-1">Huéspedes alojados</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-[#7C3AED]" />
            <span className="text-xs bg-[#7C3AED]/10 text-[#7C3AED] px-2 py-1 rounded-full">Futuras</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.upcomingReservations}</p>
          <p className="text-sm text-gray-500 mt-1">Próximas reservas</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Home className="w-8 h-8 text-[#059669]" />
            <span className="text-xs bg-[#059669]/10 text-[#059669] px-2 py-1 rounded-full">Ocupación</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.occupancy}%</p>
          <p className="text-sm text-gray-500 mt-1">Unidades ocupadas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas llegadas */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Próximas llegadas
              </h3>
              <p className="text-xs text-gray-500">Reservas confirmadas para los próximos días</p>
            </div>
            <Link href={`/${tenantSlug}/admin/reservations`} className="text-xs text-[#0F766E] hover:underline flex items-center gap-1">
              Ver todas <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {upcomingArrivals.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay próximas llegadas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingArrivals.map((res) => (
                <div key={res.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{res.guest?.first_name} {res.guest?.last_name}</p>
                      <p className="text-xs text-gray-500">{res.unit?.name || "—"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{new Date(res.check_in).toLocaleDateString("es-AR")}</p>
                    {getStatusBadge(res.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Huéspedes alojados */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Huéspedes alojados
              </h3>
              <p className="text-xs text-gray-500">Huéspedes actualmente en el alojamiento</p>
            </div>
            <Link href={`/${tenantSlug}/admin/reservations`} className="text-xs text-[#0F766E] hover:underline flex items-center gap-1">
              Ver todos <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {currentGuests.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay huéspedes alojados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentGuests.map((res) => (
                <div key={res.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{res.guest?.first_name} {res.guest?.last_name}</p>
                      <p className="text-xs text-gray-500">{res.unit?.name || "—"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Check-out</p>
                    <p className="text-sm font-medium text-gray-900">{new Date(res.check_out).toLocaleDateString("es-AR")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
    </div>
  );
}