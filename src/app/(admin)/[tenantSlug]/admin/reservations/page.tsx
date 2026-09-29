"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import {
  Calendar,
  Plus,
  Search,
  MessageCircle,
  QrCode,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Send,
} from "lucide-react";
import Link from "next/link";

interface Reservation {
  id: string;
  code: string;
  guest_name: string;
  guest_last_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  unit_name: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  notes: string;
  created_at: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

type FilterType = "all" | "today" | "tomorrow" | "nextweek";

export default function ReservationsPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        const { data: tenantData, error: tenantError } = await supabase
          .from("tenants")
          .select("id, name, slug")
          .eq("slug", tenantSlug)
          .single();

        if (tenantError || !tenantData) {
          setError("Alojamiento no encontrado.");
          setLoading(false);
          return;
        }

        setTenant(tenantData);

        const { data: reservationsData, error: reservationsError } = await supabase
          .from("reservations")
          .select("*")
          .eq("tenant_id", tenantData.id)
          .order("created_at", { ascending: false });

        if (reservationsError) {
          setError("Error al cargar reservas.");
        } else {
          setReservations(reservationsData || []);
        }
      } catch (err: any) {
        setError("Error: " + err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [tenantSlug]);

  const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  };

  const getNextWeekStart = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(0, 0, 0, 0);
    return nextWeek;
  };

  const getNextWeekEnd = () => {
    const nextWeekEnd = new Date();
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 13);
    nextWeekEnd.setHours(23, 59, 59, 999);
    return nextWeekEnd;
  };

  const filteredReservations = reservations.filter((res) => {
    const checkIn = new Date(res.check_in);
    const today = getToday();
    const tomorrow = getTomorrow();
    const nextWeekStart = getNextWeekStart();
    const nextWeekEnd = getNextWeekEnd();

    const matchesSearch =
      searchTerm === "" ||
      res.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.guest_last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.unit_name.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      if (checkIn < fromDate) return false;
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      if (checkIn > toDate) return false;
    }

    switch (filter) {
      case "today":
        return checkIn.toDateString() === today.toDateString();
      case "tomorrow":
        return checkIn.toDateString() === tomorrow.toDateString();
      case "nextweek":
        return checkIn >= nextWeekStart && checkIn <= nextWeekEnd;
      default:
        return true;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "checked_in": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-gray-100 text-gray-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed": return "Confirmada";
      case "pending": return "Pendiente";
      case "checked_in": return "Check-in";
      case "completed": return "Completada";
      case "cancelled": return "Cancelada";
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed": return <CheckCircle className="w-4 h-4" />;
      case "pending": return <Clock className="w-4 h-4" />;
      case "checked_in": return <Calendar className="w-4 h-4" />;
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "cancelled": return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const sendWhatsApp = (reservation: Reservation) => {
    if (!tenant) return;
    const guestPanelUrl = `https://miestadia.online/${tenantSlug}?code=${reservation.code}&lastName=${encodeURIComponent(reservation.guest_last_name)}`;
    const message = `¡Hola ${reservation.guest_name}! Tu reserva está confirmada en ${tenant.name}:\n\nCheck-in: ${new Date(reservation.check_in).toLocaleDateString("es-AR")}\nCheck-out: ${new Date(reservation.check_out).toLocaleDateString("es-AR")}\nUnidad: ${reservation.unit_name}\nCódigo: ${reservation.code}\n\nAccedé a tu experiencia: ${guestPanelUrl}\n\n— ${tenant.name} (vía Mi Estadía)`;
    const phone = reservation.guest_phone?.replace(/\D/g, "") || "";
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reservas</h1>
          <p className="text-gray-500 mt-1">
            {filteredReservations.length} {filteredReservations.length === 1 ? "reserva" : "reservas"}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-medium hover:bg-[#0F766E]/90 transition-colors">
          <Plus className="w-4 h-4" />
          Nueva reserva
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, apellido, código o unidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              placeholder="Desde"
            />
            <span className="text-gray-500">-</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              placeholder="Hasta"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("today")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "today" ? "bg-[#0F766E] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setFilter("tomorrow")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "tomorrow" ? "bg-[#0F766E] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Mañana
            </button>
            <button
              onClick={() => setFilter("nextweek")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "nextweek" ? "bg-[#0F766E] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Semana que viene
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all" ? "bg-[#0F766E] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Todas
            </button>
          </div>
        </div>
      </div>

      {filteredReservations.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No hay reservas</h3>
          <p className="text-gray-600">
            {searchTerm || filter !== "all" || dateFrom || dateTo
              ? "No se encontraron reservas con los filtros aplicados."
              : "Comenzá agregando tu primera reserva."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReservations.map((reservation, index) => (
            <div
              key={reservation.id}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      {reservation.guest_name} {reservation.guest_last_name}
                    </h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                      {getStatusIcon(reservation.status)}
                      {getStatusLabel(reservation.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Código</p>
                      <p className="font-mono font-semibold text-gray-900">{reservation.code}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Check-in</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(reservation.check_in).toLocaleDateString("es-AR")}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Check-out</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(reservation.check_out).toLocaleDateString("es-AR")}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Unidad</p>
                      <p className="font-semibold text-gray-900">{reservation.unit_name}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <span className="text-gray-600">{reservation.guest_email}</span>
                    {reservation.guest_phone && (
                      <span className="text-gray-600">{reservation.guest_phone}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => sendWhatsApp(reservation)}
                    className="p-2 text-gray-400 hover:text-[#25D366] hover:bg-green-50 rounded-lg transition-colors"
                    title="Enviar WhatsApp"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                  <Link
                    href={`https://miestadia.online/${tenantSlug}?code=${reservation.code}&lastName=${encodeURIComponent(reservation.guest_last_name)}`}
                    target="_blank"
                    className="p-2 text-gray-400 hover:text-[#0F766E] hover:bg-gray-100 rounded-lg transition-colors"
                    title="Ver panel del huésped"
                  >
                    <QrCode className="w-5 h-5" />
                  </Link>
                  <button className="p-2 text-gray-400 hover:text-[#0F766E] hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}