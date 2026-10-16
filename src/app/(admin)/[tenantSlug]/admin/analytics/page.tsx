"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Bed,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MonthlyStats {
  month: string;
  reservations: number;
  revenue: number;
  occupancy: number;
  directReservations: number;
  externalReservations: number;
}

interface UnitStats {
  name: string;
  reservations: number;
  revenue: number;
}

export default function AnalyticsPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [unitStats, setUnitStats] = useState<UnitStats[]>([]);
  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    totalReservations: 0,
    occupancyRate: 0,
    uniqueGuests: 0,
    revenueChange: 0,
    reservationsChange: 0,
  });
  const supabase = createClient();

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const { data: tenant } = await supabase
          .from("tenants")
          .select("id")
          .eq("slug", tenantSlug)
          .single();

        if (!tenant) {
          setError("Tenant no encontrado");
          setLoading(false);
          return;
        }

        // 1. KPIs generales (últimos 30 días)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const { data: recentReservations } = await supabase
          .from("reservations")
          .select("id, total_amount, guest_id, check_in, check_out, unit_id")
          .eq("tenant_id", tenant.id)
          .gte("check_in", thirtyDaysAgo.toISOString().split("T")[0])
          .in("status", ["booked", "pre_checkin", "checked_in", "checked_out"]);

        const { data: previousReservations } = await supabase
          .from("reservations")
          .select("id, total_amount")
          .eq("tenant_id", tenant.id)
          .gte("check_in", sixtyDaysAgo.toISOString().split("T")[0])
          .lt("check_in", thirtyDaysAgo.toISOString().split("T")[0])
          .in("status", ["booked", "pre_checkin", "checked_in", "checked_out"]);

        const totalRevenue = recentReservations?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0;
        const previousRevenue = previousReservations?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0;
        const revenueChange = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

        const totalReservations = recentReservations?.length || 0;
        const previousReservationsCount = previousReservations?.length || 0;
        const reservationsChange = previousReservationsCount > 0 
          ? ((totalReservations - previousReservationsCount) / previousReservationsCount) * 100 
          : 0;

        // Calcular ocupación (días ocupados / días totales en el período)
        const totalDays = 30;
        let occupiedDays = 0;
        recentReservations?.forEach((r) => {
          const checkIn = new Date(r.check_in);
          const checkOut = new Date(r.check_out);
          const days = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
          occupiedDays += days;
        });
        const occupancyRate = Math.min(100, (occupiedDays / (totalDays * 10)) * 100); // Asumiendo 10 unidades

        const uniqueGuests = new Set(recentReservations?.map((r) => r.guest_id)).size;

        setKpis({
          totalRevenue,
          totalReservations,
          occupancyRate,
          uniqueGuests,
          revenueChange,
          reservationsChange,
        });

        // 2. Estadísticas mensuales (últimos 6 meses)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const { data: allReservations } = await supabase
          .from("reservations")
          .select("check_in, total_amount, source")
          .eq("tenant_id", tenant.id)
          .gte("check_in", sixMonthsAgo.toISOString().split("T")[0])
          .in("status", ["booked", "pre_checkin", "checked_in", "checked_out"]);

        const monthlyData: Record<string, MonthlyStats> = {};
        allReservations?.forEach((r) => {
          const month = new Date(r.check_in).toLocaleDateString("es-AR", { month: "short" });
          if (!monthlyData[month]) {
            monthlyData[month] = {
              month,
              reservations: 0,
              revenue: 0,
              occupancy: 0,
              directReservations: 0,
              externalReservations: 0,
            };
          }
          monthlyData[month].reservations++;
          monthlyData[month].revenue += r.total_amount || 0;
          if (r.source?.startsWith("ical_")) {
            monthlyData[month].externalReservations++;
          } else {
            monthlyData[month].directReservations++;
          }
        });

        setMonthlyStats(Object.values(monthlyData));

        // 3. Estadísticas por unidad
        const { data: units } = await supabase
          .from("units")
          .select("id, name")
          .eq("tenant_id", tenant.id)
          .eq("status", "active");

        const unitData: UnitStats[] = [];
        for (const unit of units || []) {
          const { data: unitReservations } = await supabase
            .from("reservations")
            .select("id, total_amount")
            .eq("tenant_id", tenant.id)
            .eq("unit_id", unit.id)
            .gte("check_in", sixMonthsAgo.toISOString().split("T")[0])
            .in("status", ["booked", "pre_checkin", "checked_in", "checked_out"]);

          unitData.push({
            name: unit.name,
            reservations: unitReservations?.length || 0,
            revenue: unitReservations?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0,
          });
        }

        setUnitStats(unitData.sort((a, b) => b.reservations - a.reservations));
      } catch (err: any) {
        console.error("Error cargando analytics:", err);
        setError("Error al cargar las métricas");
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [tenantSlug]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F766E]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const COLORS = ["#0F766E", "#F59E0B", "#3B82F6", "#EF4444", "#8B5CF6", "#EC4899"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics y Reportes</h1>
        <p className="text-gray-500 mt-1">Métricas clave de tu alojamiento</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-700" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${kpis.revenueChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                {kpis.revenueChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(kpis.revenueChange).toFixed(1)}%
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Ingresos (30 días)</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(kpis.totalRevenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-700" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${kpis.reservationsChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                {kpis.reservationsChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(kpis.reservationsChange).toFixed(1)}%
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Reservas (30 días)</p>
            <p className="text-2xl font-bold text-gray-900">{kpis.totalReservations}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-700" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Tasa de ocupación</p>
            <p className="text-2xl font-bold text-gray-900">{kpis.occupancyRate.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-amber-700" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Huéspedes únicos</p>
            <p className="text-2xl font-bold text-gray-900">{kpis.uniqueGuests}</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de ingresos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Ingresos mensuales
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyStats.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Sin datos de ingresos</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="revenue" stroke="#0F766E" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Reservas mensuales
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyStats.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Sin datos de reservas</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="directReservations" fill="#0F766E" name="Directas" />
                  <Bar dataKey="externalReservations" fill="#F59E0B" name="Externas" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top unidades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bed className="w-5 h-5" />
            Top unidades más reservadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unitStats.length === 0 ? (
            <div className="text-center py-12">
              <Bed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Sin datos de unidades</p>
            </div>
          ) : (
            <div className="space-y-4">
              {unitStats.slice(0, 5).map((unit, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#0F766E] text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{unit.name}</p>
                      <p className="text-sm text-gray-500">{unit.reservations} reservas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(unit.revenue)}</p>
                    <p className="text-sm text-gray-500">ingresos</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribución de reservas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Distribución de reservas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyStats.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Sin datos</p>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Directas", value: monthlyStats.reduce((sum, m) => sum + m.directReservations, 0) },
                      { name: "Externas (Airbnb/Booking)", value: monthlyStats.reduce((sum, m) => sum + m.externalReservations, 0) },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#0F766E" />
                    <Cell fill="#F59E0B" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}