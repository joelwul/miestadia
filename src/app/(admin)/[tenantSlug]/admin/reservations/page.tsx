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
  CheckSquare,
  X,
  Mail,
  Phone,
  User,
  Home,
  DollarSign,
  Copy,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface Unit {
  id: string;
  name: string;
  type: string;
  capacity: number;
}

interface Reservation {
  id: string;
  tenant_id: string;
  reservation_code: string;
  guest_id: string;
  unit_id: string;
  check_in: string;
  check_out: string;
  status: string;
  source: string;
  total_amount: number;
  paid_amount: number;
  payment_status: string;
  payment_method: string;
  notes: string;
  created_at: string;
  guest?: Guest;
  unit?: Unit;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

type FilterType = "all" | "today" | "tomorrow" | "nextweek";

type ModalType = "none" | "add" | "edit" | "qr" | "delete";

export default function ReservationsPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeModal, setActiveModal] = useState<ModalType>("none");
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const supabase = createClient();

  // Estados del formulario
  const [formData, setFormData] = useState({
    guest_id: "",
    unit_id: "",
    check_in: "",
    check_out: "",
    total_amount: "",
    paid_amount: "",
    payment_method: "cash",
    notes: "",
    // Para crear nuevo huésped
    new_guest_first_name: "",
    new_guest_last_name: "",
    new_guest_email: "",
    new_guest_phone: "",
    create_new_guest: false,
  });

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

        // Cargar reservas
        const { data: reservationsData, error: reservationsError } = await supabase
          .from("reservations")
          .select("*")
          .eq("tenant_id", tenantData.id)
          .order("check_in", { ascending: false });

        if (reservationsError) {
          setError("Error al cargar reservas.");
          setLoading(false);
          return;
        }

        // Cargar huéspedes
        const { data: guestsData } = await supabase
          .from("guests")
          .select("id, first_name, last_name, email, phone")
          .eq("tenant_id", tenantData.id);

        // Cargar unidades
        const { data: unitsData } = await supabase
          .from("units")
          .select("id, name, type, capacity")
          .eq("tenant_id", tenantData.id)
          .eq("status", "active");

        setGuests(guestsData || []);
        setUnits(unitsData || []);

        // Unir datos: reservas + huéspedes + unidades
        const enrichedReservations: Reservation[] = (reservationsData || []).map((res: any) => ({
          ...res,
          guest: guestsData?.find((g: any) => g.id === res.guest_id),
          unit: unitsData?.find((u: any) => u.id === res.unit_id),
        }));

        setReservations(enrichedReservations);
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

    const guestName = `${res.guest?.first_name || ""} ${res.guest?.last_name || ""}`.toLowerCase();
    const matchesSearch =
      searchTerm === "" ||
      guestName.includes(searchTerm.toLowerCase()) ||
      res.reservation_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.unit?.name.toLowerCase().includes(searchTerm.toLowerCase());

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
      case "booked": return "bg-green-100 text-green-800 border-green-200";
      case "pre_checkin": return "bg-purple-100 text-purple-800 border-purple-200";
      case "checked_in": return "bg-blue-100 text-blue-800 border-blue-200";
      case "checked_out": return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "booked": return "Reservada";
      case "pre_checkin": return "Pre check-in";
      case "checked_in": return "Check-in";
      case "checked_out": return "Check-out";
      case "cancelled": return "Cancelada";
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "booked": return <CheckCircle className="w-4 h-4" />;
      case "pre_checkin": return <Clock className="w-4 h-4" />;
      case "checked_in": return <Calendar className="w-4 h-4" />;
      case "checked_out": return <CheckCircle className="w-4 h-4" />;
      case "cancelled": return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "text-green-600";
      case "partial": return "text-orange-600";
      case "pending": return "text-gray-500";
      default: return "text-gray-500";
    }
  };

  const getGuestPanelUrl = (reservation: Reservation) => {
    const lastName = reservation.guest?.last_name || "";
    return `https://miestadia.online/${tenantSlug}?code=${reservation.reservation_code}&lastName=${encodeURIComponent(lastName)}`;
  };

  const sendWhatsApp = async (reservation: Reservation) => {
    if (!tenant || !reservation.guest) return;
    setActionLoading(`whatsapp-${reservation.id}`);
    try {
      const guestPanelUrl = getGuestPanelUrl(reservation);
      const message = `¡Hola ${reservation.guest.first_name}! Tu reserva está confirmada en ${tenant.name}:\n\n📅 Check-in: ${new Date(reservation.check_in).toLocaleDateString("es-AR")}\n Check-out: ${new Date(reservation.check_out).toLocaleDateString("es-AR")}\n Unidad: ${reservation.unit?.name || "—"}\n🔑 Código: ${reservation.reservation_code}\n\nAccedé a tu experiencia: ${guestPanelUrl}\n\n— ${tenant.name} (vía Mi Estadía)`;
      const phone = reservation.guest.phone?.replace(/\D/g, "") || "";
      const url = phone
        ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckIn = async (reservation: Reservation) => {
    if (!confirm(`¿Confirmar check-in de ${reservation.guest?.first_name} ${reservation.guest?.last_name}?`)) return;
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
    if (!confirm(`¿Eliminar la reserva de ${reservation.guest?.first_name} ${reservation.guest?.last_name}? Esta acción no se puede deshacer.`)) return;
    setActionLoading(`delete-${reservation.id}`);
    try {
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", reservation.id);
      if (error) throw error;
      setReservations(reservations.filter(r => r.id !== reservation.id));
      setActiveModal("none");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const generateReservationCode = () => {
    const prefix = tenantSlug.substring(0, 3).toUpperCase();
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${code}`;
  };

  const handleCreateReservation = async () => {
    setActionLoading("create");
    try {
      let guestId = formData.guest_id;

      // Si es huésped nuevo, crearlo primero
      if (formData.create_new_guest) {
        const { data: newGuest, error: guestError } = await supabase
          .from("guests")
          .insert({
            tenant_id: tenant!.id,
            first_name: formData.new_guest_first_name,
            last_name: formData.new_guest_last_name,
            email: formData.new_guest_email,
            phone: formData.new_guest_phone,
            country: "Argentina",
          })
          .select()
          .single();

        if (guestError) throw guestError;
        guestId = newGuest.id;
        setGuests([...guests, newGuest]);
      }

      if (!guestId) {
        alert("Seleccioná un huésped o creá uno nuevo.");
        setActionLoading(null);
        return;
      }

      if (!formData.unit_id) {
        alert("Seleccioná una unidad.");
        setActionLoading(null);
        return;
      }

      if (!formData.check_in || !formData.check_out) {
        alert("Completá las fechas de check-in y check-out.");
        setActionLoading(null);
        return;
      }

      const reservationCode = generateReservationCode();

      const { error } = await supabase
        .from("reservations")
        .insert({
          tenant_id: tenant!.id,
          reservation_code: reservationCode,
          guest_id: guestId,
          unit_id: formData.unit_id,
          check_in: formData.check_in,
          check_out: formData.check_out,
          status: "booked",
          source: "manual",
          total_amount: parseFloat(formData.total_amount) || 0,
          paid_amount: parseFloat(formData.paid_amount) || 0,
          payment_status: parseFloat(formData.paid_amount) > 0 ? (parseFloat(formData.paid_amount) >= parseFloat(formData.total_amount) ? "paid" : "partial") : "pending",
          payment_method: formData.payment_method || null,
          notes: formData.notes,
        });

      if (error) throw error;

      // Recargar datos
      const { data: newReservation } = await supabase
        .from("reservations")
        .select("*")
        .eq("reservation_code", reservationCode)
        .single();

      if (newReservation) {
        const enriched: Reservation = {
          ...newReservation,
          guest: guests.find(g => g.id === newReservation.guest_id) || (formData.create_new_guest ? {
            id: newReservation.guest_id,
            first_name: formData.new_guest_first_name,
            last_name: formData.new_guest_last_name,
            email: formData.new_guest_email,
            phone: formData.new_guest_phone,
          } : undefined),
          unit: units.find(u => u.id === newReservation.unit_id),
        };
        setReservations([enriched, ...reservations]);
      }

      // Resetear formulario
      setFormData({
        guest_id: "",
        unit_id: "",
        check_in: "",
        check_out: "",
        total_amount: "",
        paid_amount: "",
        payment_method: "cash",
        notes: "",
        new_guest_first_name: "",
        new_guest_last_name: "",
        new_guest_email: "",
        new_guest_phone: "",
        create_new_guest: false,
      });

      setActiveModal("none");
    } catch (err: any) {
      alert("Error al crear reserva: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateReservation = async () => {
    if (!selectedReservation) return;
    setActionLoading("update");
    try {
      const { error } = await supabase
        .from("reservations")
        .update({
          guest_id: formData.guest_id || selectedReservation.guest_id,
          unit_id: formData.unit_id || selectedReservation.unit_id,
          check_in: formData.check_in || selectedReservation.check_in,
          check_out: formData.check_out || selectedReservation.check_out,
          total_amount: formData.total_amount ? parseFloat(formData.total_amount) : selectedReservation.total_amount,
          paid_amount: formData.paid_amount ? parseFloat(formData.paid_amount) : selectedReservation.paid_amount,
          payment_method: formData.payment_method || selectedReservation.payment_method,
          notes: formData.notes,
        })
        .eq("id", selectedReservation.id);

      if (error) throw error;

      // Recargar
      const { data: updatedRes } = await supabase
        .from("reservations")
        .select("*")
        .eq("id", selectedReservation.id)
        .single();

      if (updatedRes) {
        const enriched: Reservation = {
          ...updatedRes,
          guest: guests.find(g => g.id === updatedRes.guest_id),
          unit: units.find(u => u.id === updatedRes.unit_id),
        };
        setReservations(reservations.map(r => r.id === updatedRes.id ? enriched : r));
      }

      setActiveModal("none");
      setSelectedReservation(null);
    } catch (err: any) {
      alert("Error al actualizar: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setFormData({
      guest_id: reservation.guest_id,
      unit_id: reservation.unit_id,
      check_in: reservation.check_in,
      check_out: reservation.check_out,
      total_amount: reservation.total_amount.toString(),
      paid_amount: reservation.paid_amount.toString(),
      payment_method: reservation.payment_method || "cash",
      notes: reservation.notes || "",
      new_guest_first_name: "",
      new_guest_last_name: "",
      new_guest_email: "",
      new_guest_phone: "",
      create_new_guest: false,
    });
    setActiveModal("edit");
  };

  const openAddModal = () => {
    setSelectedReservation(null);
    setFormData({
      guest_id: "",
      unit_id: "",
      check_in: "",
      check_out: "",
      total_amount: "",
      paid_amount: "",
      payment_method: "cash",
      notes: "",
      new_guest_first_name: "",
      new_guest_last_name: "",
      new_guest_email: "",
      new_guest_phone: "",
      create_new_guest: false,
    });
    setActiveModal("add");
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
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-medium hover:bg-[#0F766E]/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva reserva
        </button>
      </div>

      {/* Filtros */}
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

      {/* Lista de reservas */}
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
                      {reservation.guest?.first_name || "—"} {reservation.guest?.last_name || ""}
                    </h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(reservation.status)}`}>
                      {getStatusIcon(reservation.status)}
                      {getStatusLabel(reservation.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Código</p>
                      <p className="font-mono font-semibold text-gray-900">{reservation.reservation_code || "—"}</p>
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
                      <p className="font-semibold text-gray-900">{reservation.unit?.name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Pago</p>
                      <p className={`font-semibold ${getPaymentStatusColor(reservation.payment_status)}`}>
                        ${reservation.paid_amount || 0} / ${reservation.total_amount || 0}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-sm">
                    {reservation.guest?.email && (
                      <span className="text-gray-600 flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {reservation.guest.email}
                      </span>
                    )}
                    {reservation.guest?.phone && (
                      <span className="text-gray-600 flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {reservation.guest.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {reservation.status !== "checked_in" && reservation.status !== "checked_out" && reservation.status !== "cancelled" && (
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
                    onClick={() => { setSelectedReservation(reservation); setActiveModal("qr"); }}
                    className="p-2 text-gray-400 hover:text-[#0F766E] hover:bg-gray-100 rounded-lg transition-colors"
                    title="Ver QR y link del huésped"
                  >
                    <QrCode className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openEditModal(reservation)}
                    className="p-2 text-gray-400 hover:text-[#0F766E] hover:bg-gray-100 rounded-lg transition-colors"
                    title="Editar reserva"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => { setSelectedReservation(reservation); setActiveModal("delete"); }}
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

      {/* MODAL: Nueva Reserva */}
      {activeModal === "add" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Nueva reserva</h2>
              <button onClick={() => setActiveModal("none")} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Huésped */}
              <div className="flex items-center gap-3 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.create_new_guest}
                    onChange={(e) => setFormData({ ...formData, create_new_guest: e.target.checked, guest_id: "" })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">Crear huésped nuevo</span>
                </label>
              </div>

              {formData.create_new_guest ? (
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
                      <input
                        type="text"
                        value={formData.new_guest_first_name}
                        onChange={(e) => setFormData({ ...formData, new_guest_first_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                        placeholder="Juan"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Apellido</label>
                      <input
                        type="text"
                        value={formData.new_guest_last_name}
                        onChange={(e) => setFormData({ ...formData, new_guest_last_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                        placeholder="Pérez"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.new_guest_email}
                        onChange={(e) => setFormData({ ...formData, new_guest_email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                        placeholder="juan@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
                      <input
                        type="text"
                        value={formData.new_guest_phone}
                        onChange={(e) => setFormData({ ...formData, new_guest_phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                        placeholder="01131923742"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Huésped existente</label>
                  <select
                    value={formData.guest_id}
                    onChange={(e) => setFormData({ ...formData, guest_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  >
                    <option value="">Seleccionar huésped...</option>
                    {guests.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.first_name} {g.last_name} ({g.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Unidad */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Unidad</label>
                <select
                  value={formData.unit_id}
                  onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                >
                  <option value="">Seleccionar unidad...</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.type} - {u.capacity} pers.)
                    </option>
                  ))}
                </select>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Check-in</label>
                  <input
                    type="date"
                    value={formData.check_in}
                    onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Check-out</label>
                  <input
                    type="date"
                    value={formData.check_out}
                    onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
              </div>

              {/* Montos */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Monto total</label>
                  <input
                    type="number"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Monto pagado</label>
                  <input
                    type="number"
                    value={formData.paid_amount}
                    onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Método de pago */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Método de pago</label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                >
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                  <option value="card">Tarjeta</option>
                  <option value="mercadopago">Mercado Pago</option>
                </select>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  placeholder="Observaciones..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setActiveModal("none")}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateReservation}
                disabled={actionLoading === "create"}
                className="px-4 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-medium hover:bg-[#0F766E]/90 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading === "create" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Crear reserva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Editar Reserva */}
      {activeModal === "edit" && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Editar reserva {selectedReservation.reservation_code}</h2>
              <button onClick={() => { setActiveModal("none"); setSelectedReservation(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Huésped</label>
                <select
                  value={formData.guest_id}
                  onChange={(e) => setFormData({ ...formData, guest_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                >
                  <option value="">Seleccionar huésped...</option>
                  {guests.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.first_name} {g.last_name} ({g.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Unidad</label>
                <select
                  value={formData.unit_id}
                  onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                >
                  <option value="">Seleccionar unidad...</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.type} - {u.capacity} pers.)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Check-in</label>
                  <input
                    type="date"
                    value={formData.check_in}
                    onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Check-out</label>
                  <input
                    type="date"
                    value={formData.check_out}
                    onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Monto total</label>
                  <input
                    type="number"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Monto pagado</label>
                  <input
                    type="number"
                    value={formData.paid_amount}
                    onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Método de pago</label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                >
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                  <option value="card">Tarjeta</option>
                  <option value="mercadopago">Mercado Pago</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => { setActiveModal("none"); setSelectedReservation(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateReservation}
                disabled={actionLoading === "update"}
                className="px-4 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-medium hover:bg-[#0F766E]/90 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading === "update" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: QR / Link */}
      {activeModal === "qr" && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Link de acceso del huésped</h3>
                <p className="text-sm text-gray-500">{selectedReservation.guest?.first_name} {selectedReservation.guest?.last_name}</p>
              </div>
              <button onClick={() => { setActiveModal("none"); setSelectedReservation(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-xs text-gray-500 mb-1">URL de acceso (código y apellido precargados)</p>
              <p className="text-sm text-gray-900 break-all font-mono">{getGuestPanelUrl(selectedReservation)}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                Al escanear el QR o abrir el link, el huésped ingresa directamente a su panel con su código y apellido ya cargados.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href={getGuestPanelUrl(selectedReservation)}
                target="_blank"
                className="flex-1 bg-[#0F766E] text-white py-2 px-4 rounded-lg font-medium text-center hover:bg-[#0F766E]/90 transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir link
              </Link>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getGuestPanelUrl(selectedReservation));
                  alert("Link copiado al portapapeles");
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copiar link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirmar Eliminar */}
      {activeModal === "delete" && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Eliminar reserva</h3>
                <p className="text-sm text-gray-500">{selectedReservation.reservation_code}</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro que querés eliminar la reserva de <strong>{selectedReservation.guest?.first_name} {selectedReservation.guest?.last_name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setActiveModal("none"); setSelectedReservation(null); }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(selectedReservation)}
                disabled={actionLoading === `delete-${selectedReservation.id}`}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === `delete-${selectedReservation.id}` ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}