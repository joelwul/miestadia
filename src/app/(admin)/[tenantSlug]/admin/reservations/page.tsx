"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import {
  Calendar,
  Plus,
  Search,
  QrCode,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  Download,
  CheckSquare,
  X,
  User,
  Mail,
  Phone,
  Home,
  DollarSign,
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState<Reservation | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
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
          .order("check_in", { ascending: false });

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
      case "confirmed": return "bg-green-100 text-green-800 border-green-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "checked_in": return "bg-blue-100 text-blue-800 border-blue-200";
      case "pre_checkin": return "bg-purple-100 text-purple-800 border-purple-200";
      case "completed": return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed": return "Confirmada";
      case "pending": return "Pendiente";
      case "checked_in": return "Check-in";
      case "pre_checkin": return "Pre check-in";
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
      case "pre_checkin": return <Clock className="w-4 h-4" />;
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "cancelled": return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const sendWhatsApp = async (reservation: Reservation) => {
    if (!tenant) return;
    setActionLoading(`whatsapp-${reservation.id}`);
    try {
      const guestPanelUrl = `https://miestadia.online/${tenantSlug}?code=${reservation.code}&lastName=${encodeURIComponent(reservation.guest_last_name)}`;
      const message = `¡Hola ${reservation.guest_name}! Tu reserva está confirmada en ${tenant.name}:\n\n Check-in: ${new Date(reservation.check_in).toLocaleDateString("es-AR")}\n Check-out: ${new Date(reservation.check_out).toLocaleDateString("es-AR")}\n Unidad: ${reservation.unit_name}\n🔑 Código: ${reservation.code}\n\nAccedé a tu experiencia: ${guestPanelUrl}\n\n— ${tenant.name} (vía Mi Estadía)`;
      const phone = reservation.guest_phone?.replace(/\D/g, "") || "";
      const url = phone
        ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckIn = async (reservation: Reservation) => {
    if (!confirm(`¿Confirmar check-in de ${reservation.guest_name} ${reservation.guest_last_name}?`)) return;
    setActionLoading(`checkin-${reservation.id}`);
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status: "checked_in" })
        .eq("id", reservation.id);
      if (error) throw error;
      setReservations(reservations.map(r => r.id === reservation.id ? { ...r, status: "checked_in" } : r));
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reservation: Reservation) => {
    if (!confirm(`¿Eliminar la reserva de ${reservation.guest_name} ${reservation.guest_last_name}? Esta acción no se puede deshacer.`)) return;
    setActionLoading(`delete-${reservation.id}`);
    try {
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", reservation.id);
      if (error) throw error;
      setReservations(reservations.filter(r => r.id !== reservation.id));
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getGuestPanelUrl = (reservation: Reservation) => {
    return `https://miestadia.online/${tenantSlug}?code=${reservation.code}&lastName=${encodeURIComponent(reservation.guest_last_name)}`;
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
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-medium hover:bg-[#0F766E]/90 transition-colors"
        >
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
            />
            <span className="text-gray-500">-</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
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
          {filteredReservations.map((reservation) => (
            <div
              key={reservation.id}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-bold text-gray-900">
                      {reservation.guest_name} {reservation.guest_last_name}
                    </h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(reservation.status)}`}>
                      {getStatusIcon(reservation.status)}
                      {getStatusLabel(reservation.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Código</p>
                      <p className="font-mono font-semibold text-gray-900">{reservation.code || "—"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Check-in</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(reservation.check_in).toLocaleDateString("es-AR")}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Check-out</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(reservation.check_out).toLocaleDateString("es-AR")}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Unidad</p>
                      <p className="font-semibold text-gray-900">{reservation.unit_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Pago</p>
                      <p className="font-semibold text-gray-900">
                        ${reservation.paid_amount || 0} / ${reservation.total_amount || 0}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-sm">
                    {reservation.guest_email && (
                      <span className="text-gray-600 flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {reservation.guest_email}
                      </span>
                    )}
                    {reservation.guest_phone && (
                      <span className="text-gray-600 flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {reservation.guest_phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {reservation.status !== "checked_in" && reservation.status !== "completed" && reservation.status !== "cancelled" && (
                    <button
                      onClick={() => handleCheckIn(reservation)}
                      disabled={actionLoading === `checkin-${reservation.id}`}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Hacer check-in"
                    >
                      {actionLoading === `checkin-${reservation.id}` ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckSquare className="w-5 h-5" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => sendWhatsApp(reservation)}
                    disabled={actionLoading === `whatsapp-${reservation.id}`}
                    className="p-2 text-gray-400 hover:text-[#25D366] hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Enviar WhatsApp"
                  >
                    {actionLoading === `whatsapp-${reservation.id}` ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowQrModal(reservation)}
                    className="p-2 text-gray-400 hover:text-[#0F766E] hover:bg-gray-100 rounded-lg transition-colors"
                    title="Ver QR y link del huésped"
                  >
                    <QrCode className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-[#0F766E] hover:bg-gray-100 rounded-lg transition-colors" title="Editar">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(reservation)}
                    disabled={actionLoading === `delete-${reservation.id}`}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Eliminar"
                  >
                    {actionLoading === `delete-${reservation.id}` ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal QR */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Link de acceso del huésped</h3>
                <p className="text-sm text-gray-500">{showQrModal.guest_name} {showQrModal.guest_last_name}</p>
              </div>
              <button onClick={() => setShowQrModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-xs text-gray-500 mb-1">URL de acceso</p>
              <p className="text-sm text-gray-900 break-all font-mono">{getGuestPanelUrl(showQrModal)}</p>
            </div>
            <div className="flex gap-3">
              <Link
                href={getGuestPanelUrl(showQrModal)}
                target="_blank"
                className="flex-1 bg-[#0F766E] text-white py-2 px-4 rounded-lg font-medium text-center hover:bg-[#0F766E]/90 transition-colors"
              >
                Abrir link
              </Link>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getGuestPanelUrl(showQrModal));
                  alert("Link copiado al portapapeles");
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Copiar link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Reserva */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Nueva reserva</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 text-center py-8">
                El formulario de nueva reserva se está implementando. Por ahora podés crear reservas manualmente desde la base de datos o importando un CSV.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}