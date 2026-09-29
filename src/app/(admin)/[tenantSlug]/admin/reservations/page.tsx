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
  Copy,
  ExternalLink,
  MessageSquare,
  Upload,
  UserCheck,
  LogOut,
  Star,
  Home,
  Bell,
  DollarSign,
  History,
  Archive,
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

interface Payment {
  id: string;
  amount: number;
  method: string;
  date: string;
  notes: string;
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

type FilterType = "active" | "today" | "tomorrow" | "nextweek" | "checkedout";
type ModalType = "none" | "add" | "edit" | "qr" | "delete" | "checkin" | "checkout" | "whatsapp" | "payment";
type WhatsAppType = "reminder" | "precheckin" | "during" | "checkout" | "postcheckout";
type AddMethod = "manual" | "csv" | "text";

export default function ReservationsPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterType>("active");
  const [showCheckedOut, setShowCheckedOut] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeModal, setActiveModal] = useState<ModalType>("none");
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [addMethod, setAddMethod] = useState<AddMethod>("manual");
  const [whatsAppType, setWhatsAppType] = useState<WhatsAppType>("reminder");
  const [whatsAppMessage, setWhatsAppMessage] = useState("");
  const supabase = createClient();

  const [formData, setFormData] = useState({
    guest_id: "", unit_id: "", check_in: "", check_out: "",
    total_amount: "", paid_amount: "", payment_method: "cash", notes: "",
    new_guest_first_name: "", new_guest_last_name: "", new_guest_email: "",
    new_guest_phone: "", new_guest_nationality: "Argentina", new_guest_document: "",
    create_new_guest: false,
  });

  const [checkinData, setCheckinData] = useState({
    document_number: "", vehicle_plate: "", emergency_contact: "",
    observations: "", attended_by: "", additional_payment: "", payment_method: "cash",
  });

  const [paymentData, setPaymentData] = useState({ amount: "", method: "cash", notes: "" });

  useEffect(() => {
    async function loadData() {
      try {
        const { data: tenantData, error: tenantError } = await supabase
          .from("tenants").select("id, name, slug").eq("slug", tenantSlug).single();
        if (tenantError || !tenantData) { setError("Alojamiento no encontrado."); setLoading(false); return; }
        setTenant(tenantData);

        const { data: reservationsData } = await supabase
          .from("reservations").select("*").eq("tenant_id", tenantData.id)
          .order("check_in", { ascending: true });

        const { data: guestsData } = await supabase
          .from("guests").select("id, first_name, last_name, email, phone").eq("tenant_id", tenantData.id);

        const { data: unitsData } = await supabase
          .from("units").select("id, name, type, capacity").eq("tenant_id", tenantData.id).eq("status", "active");

        const { data: paymentsData } = await supabase
          .from("payments").select("id, reservation_id, amount, method, date, notes").eq("tenant_id", tenantData.id).order("date", { ascending: false });

        setGuests(guestsData || []);
        setUnits(unitsData || []);
        setPayments(paymentsData || []);

        const enriched: Reservation[] = (reservationsData || []).map((res: any) => ({
          ...res,
          guest: guestsData?.find((g: any) => g.id === res.guest_id),
          unit: unitsData?.find((u: any) => u.id === res.unit_id),
        }));

        setReservations(enriched);
      } catch (err: any) { setError("Error: " + err.message); } finally { setLoading(false); }
    }
    loadData();
  }, [tenantSlug]);

  const getToday = () => { const t = new Date(); t.setHours(0,0,0,0); return t; };
  const getTomorrow = () => { const t = new Date(); t.setDate(t.getDate()+1); t.setHours(0,0,0,0); return t; };
  const getNextWeekStart = () => { const t = new Date(); t.setDate(t.getDate()+7); t.setHours(0,0,0,0); return t; };
  const getNextWeekEnd = () => { const t = new Date(); t.setDate(t.getDate()+13); t.setHours(23,59,59,999); return t; };

  const filteredReservations = reservations.filter((res) => {
    const checkIn = new Date(res.check_in);
    const today = getToday(); const tomorrow = getTomorrow();
    const nextWeekStart = getNextWeekStart(); const nextWeekEnd = getNextWeekEnd();
    const guestName = `${res.guest?.first_name || ""} ${res.guest?.last_name || ""}`.toLowerCase();
    const matchesSearch = searchTerm === "" || guestName.includes(searchTerm.toLowerCase()) || res.reservation_code.toLowerCase().includes(searchTerm.toLowerCase()) || res.unit?.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (dateFrom && checkIn < new Date(dateFrom)) return false;
    if (dateTo && checkIn > new Date(dateTo)) return false;

    if (showCheckedOut) {
      return res.status === "checked_out";
    }

    if (res.status === "checked_out") return false;

    switch (filter) {
      case "today": return checkIn.toDateString() === today.toDateString();
      case "tomorrow": return checkIn.toDateString() === tomorrow.toDateString();
      case "nextweek": return checkIn >= nextWeekStart && checkIn <= nextWeekEnd;
      case "checkedout": return res.status === "checked_out";
      default: return true;
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
      case "booked": return "Reservada"; case "pre_checkin": return "Pre check-in";
      case "checked_in": return "Check-in"; case "checked_out": return "Check-out";
      case "cancelled": return "Cancelada"; default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "booked": return <CheckCircle className="w-4 h-4" />; case "pre_checkin": return <Clock className="w-4 h-4" />;
      case "checked_in": return <Calendar className="w-4 h-4" />; case "checked_out": return <CheckCircle className="w-4 h-4" />;
      case "cancelled": return <XCircle className="w-4 h-4" />; default: return <Clock className="w-4 h-4" />;
    }
  };

  const getGuestPanelUrl = (reservation: Reservation) => {
    const lastName = reservation.guest?.last_name || "";
    return `https://miestadia.online/${tenantSlug}?code=${reservation.reservation_code}&lastName=${encodeURIComponent(lastName)}`;
  };

  const getWhatsAppMessageTemplate = (type: WhatsAppType, reservation: Reservation): string => {
    if (!tenant || !reservation.guest) return "";
    const guestPanelUrl = getGuestPanelUrl(reservation);
    const checkIn = new Date(reservation.check_in).toLocaleDateString("es-AR");
    const checkOut = new Date(reservation.check_out).toLocaleDateString("es-AR");
    const unitName = reservation.unit?.name || "—";
    const code = reservation.reservation_code;
    const firstName = reservation.guest.first_name;
    switch (type) {
      case "reminder": return `¡Hola ${firstName}! 👋\n\nTe recordamos tu próxima reserva en *${tenant.name}*:\n\n📅 Check-in: ${checkIn}\n📅 Check-out: ${checkOut}\n🏠 Unidad: ${unitName}\n🔑 Código: ${code}\n\nAccedé a tu panel de huésped: ${guestPanelUrl}\n\n¡Te esperamos!\n\n— ${tenant.name}`;
      case "precheckin": return `¡Hola ${firstName}! \n\nTu check-in en *${tenant.name}* se acerca (${checkIn}).\n\nPara agilizar tu llegada, completá el pre check-in digital:\n${guestPanelUrl}\n\nAsí llegás directo a tu unidad sin trámites.\n\n— ${tenant.name}`;
      case "during": return `¡Hola ${firstName}! 😊\n\nEsperamos que estés disfrutando tu estadía en *${tenant.name}*.\n\nSi necesitás algo, no dudes en contactarnos.\n\nPanel de huésped: ${guestPanelUrl}\n\n— ${tenant.name}`;
      case "checkout": return `¡Hola ${firstName}! 🌅\n\nTe recordamos que tu check-out en *${tenant.name}* es el ${checkOut}.\n\nPor favor dejá la unidad en las condiciones acordadas.\n\n¡Gracias por elegirnos!\n\n— ${tenant.name}`;
      case "postcheckout": return `¡Hola ${firstName}! \n\nEsperamos que hayas disfrutado tu estadía en *${tenant.name}*.\n\n¿Nos ayudarías dejando una reseña en Google Maps? Nos ayuda mucho a crecer:\nhttps://g.page/r/TU_LINK_AQUI\n\n¡Te esperamos de vuelta!\n\n— ${tenant.name}`;
      default: return "";
    }
  };

  const openWhatsAppModal = (reservation: Reservation) => {
    setSelectedReservation(reservation); setWhatsAppType("reminder");
    setWhatsAppMessage(getWhatsAppMessageTemplate("reminder", reservation));
    setActiveModal("whatsapp");
  };

  const handleWhatsAppTypeChange = (type: WhatsAppType) => {
    setWhatsAppType(type);
    if (selectedReservation) setWhatsAppMessage(getWhatsAppMessageTemplate(type, selectedReservation));
  };

  const sendWhatsApp = () => {
    if (!selectedReservation?.guest) return;
    const phone = selectedReservation.guest.phone?.replace(/\D/g, "") || "";
    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(whatsAppMessage)}` : `https://wa.me/?text=${encodeURIComponent(whatsAppMessage)}`;
    window.open(url, "_blank");
    setActiveModal("none");
  };

  const openCheckInModal = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setCheckinData({
      document_number: "", vehicle_plate: "", emergency_contact: "",
      observations: "", attended_by: "", additional_payment: "", payment_method: "cash",
    });
    setActiveModal("checkin");
  };

  const handleCheckIn = async () => {
    if (!selectedReservation) return;
    setActionLoading("checkin");
    try {
      const updates: any = { status: "checked_in" };
      if (checkinData.observations) updates.notes = checkinData.observations;

      const { error } = await supabase.from("reservations").update(updates).eq("id", selectedReservation.id);
      if (error) throw error;

      if (checkinData.additional_payment && parseFloat(checkinData.additional_payment) > 0) {
        const { error: payError } = await supabase.from("payments").insert({
          tenant_id: tenant!.id,
          reservation_id: selectedReservation.id,
          amount: parseFloat(checkinData.additional_payment),
          method: checkinData.payment_method,
          date: new Date().toISOString(),
          notes: `Pago en check-in. Atendido por: ${checkinData.attended_by}`,
        });
        if (payError) console.error("Error registering payment:", payError);

        const newPaid = (selectedReservation.paid_amount || 0) + parseFloat(checkinData.additional_payment);
        const total = selectedReservation.total_amount || 0;
        await supabase.from("reservations").update({
          paid_amount: newPaid,
          payment_status: newPaid >= total ? "paid" : newPaid > 0 ? "partial" : "pending",
        }).eq("id", selectedReservation.id);
      }

      setReservations(reservations.map(r => r.id === selectedReservation.id ? { ...r, status: "checked_in" } : r));
      setActiveModal("none");
    } catch (err: any) { alert("Error: " + err.message); } finally { setActionLoading(null); }
  };

  const openCheckOutModal = (reservation: Reservation) => { setSelectedReservation(reservation); setActiveModal("checkout"); };

  const handleCheckOut = async () => {
    if (!selectedReservation) return;
    setActionLoading("checkout");
    try {
      const { error } = await supabase.from("reservations").update({ status: "checked_out" }).eq("id", selectedReservation.id);
      if (error) throw error;
      setReservations(reservations.map(r => r.id === selectedReservation.id ? { ...r, status: "checked_out" } : r));
      setActiveModal("none");
    } catch (err: any) { alert("Error: " + err.message); } finally { setActionLoading(null); }
  };

  const handleDelete = async (reservation: Reservation) => {
    if (!confirm(`¿Eliminar la reserva de ${reservation.guest?.first_name} ${reservation.guest?.last_name}?`)) return;
    setActionLoading(`delete-${reservation.id}`);
    try {
      const { error } = await supabase.from("reservations").delete().eq("id", reservation.id);
      if (error) throw error;
      setReservations(reservations.filter(r => r.id !== reservation.id));
      setActiveModal("none");
    } catch (err: any) { alert("Error: " + err.message); } finally { setActionLoading(null); }
  };

  const openPaymentModal = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setPaymentData({ amount: "", method: "cash", notes: "" });
    setActiveModal("payment");
  };

  const handleAddPayment = async () => {
    if (!selectedReservation || !paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      alert("Ingresá un monto válido."); return;
    }
    setActionLoading("payment");
    try {
      const { error } = await supabase.from("payments").insert({
        tenant_id: tenant!.id,
        reservation_id: selectedReservation.id,
        amount: parseFloat(paymentData.amount),
        method: paymentData.method,
        date: new Date().toISOString(),
        notes: paymentData.notes,
      });
      if (error) throw error;

      const newPaid = (selectedReservation.paid_amount || 0) + parseFloat(paymentData.amount);
      const total = selectedReservation.total_amount || 0;
      const { error: updateError } = await supabase.from("reservations").update({
        paid_amount: newPaid,
        payment_status: newPaid >= total ? "paid" : newPaid > 0 ? "partial" : "pending",
        payment_method: paymentData.method,
      }).eq("id", selectedReservation.id);
      if (updateError) throw updateError;

      setReservations(reservations.map(r => r.id === selectedReservation.id ? { ...r, paid_amount: newPaid, payment_status: newPaid >= total ? "paid" : "partial", payment_method: paymentData.method } : r));
      setActiveModal("none");
    } catch (err: any) { alert("Error: " + err.message); } finally { setActionLoading(null); }
  };

  const generateReservationCode = () => {
    const prefix = tenantSlug.substring(0, 3).toUpperCase();
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return `${prefix}-${code}`;
  };

  const handleCreateReservation = async () => {
    // Validar fechas
    if (formData.check_in && formData.check_out) {
      const checkIn = new Date(formData.check_in);
      const checkOut = new Date(formData.check_out);
      if (checkOut <= checkIn) {
        alert("La fecha de check-out debe ser posterior a la fecha de check-in.");
        return;
      }
    }

    setActionLoading("create");
    try {
      let guestId = formData.guest_id;
      if (formData.create_new_guest) {
        const { data: newGuest, error: guestError } = await supabase.from("guests").insert({
          tenant_id: tenant!.id, first_name: formData.new_guest_first_name, last_name: formData.new_guest_last_name,
          email: formData.new_guest_email, phone: formData.new_guest_phone,
          nationality: formData.new_guest_nationality, document_number: formData.new_guest_document,
        }).select().single();
        if (guestError) throw guestError;
        guestId = newGuest.id;
        setGuests([...guests, newGuest]);
      }
      if (!guestId) { alert("Seleccioná un huésped o creá uno nuevo."); setActionLoading(null); return; }
      if (!formData.unit_id) { alert("Seleccioná una unidad."); setActionLoading(null); return; }
      if (!formData.check_in || !formData.check_out) { alert("Completá las fechas."); setActionLoading(null); return; }

      const reservationCode = generateReservationCode();
      const total = parseFloat(formData.total_amount) || 0;
      const paid = parseFloat(formData.paid_amount) || 0;

      const { error } = await supabase.from("reservations").insert({
        tenant_id: tenant!.id, reservation_code: reservationCode, guest_id: guestId, unit_id: formData.unit_id,
        check_in: formData.check_in, check_out: formData.check_out, status: "booked", source: "manual",
        total_amount: total, paid_amount: paid,
        payment_status: paid > 0 ? (paid >= total ? "paid" : "partial") : "pending",
        payment_method: formData.payment_method || null, notes: formData.notes,
      });
      if (error) throw error;

      const { data: newRes } = await supabase.from("reservations").select("*").eq("reservation_code", reservationCode).single();
      if (newRes) {
        const enriched: Reservation = {
          ...newRes,
          guest: guests.find(g => g.id === newRes.guest_id) || (formData.create_new_guest ? { id: newRes.guest_id, first_name: formData.new_guest_first_name, last_name: formData.new_guest_last_name, email: formData.new_guest_email, phone: formData.new_guest_phone } : undefined),
          unit: units.find(u => u.id === newRes.unit_id),
        };
        setReservations([enriched, ...reservations]);
      }
      setFormData({ guest_id: "", unit_id: "", check_in: "", check_out: "", total_amount: "", paid_amount: "", payment_method: "cash", notes: "", new_guest_first_name: "", new_guest_last_name: "", new_guest_email: "", new_guest_phone: "", new_guest_nationality: "Argentina", new_guest_document: "", create_new_guest: false });
      setActiveModal("none");
    } catch (err: any) { alert("Error: " + err.message); } finally { setActionLoading(null); }
  };

  const openEditModal = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setFormData({
      guest_id: reservation.guest_id, unit_id: reservation.unit_id,
      check_in: reservation.check_in, check_out: reservation.check_out,
      total_amount: reservation.total_amount.toString(), paid_amount: reservation.paid_amount.toString(),
      payment_method: reservation.payment_method || "cash", notes: reservation.notes || "",
      new_guest_first_name: "", new_guest_last_name: "", new_guest_email: "", new_guest_phone: "",
      new_guest_nationality: "Argentina", new_guest_document: "", create_new_guest: false,
    });
    setActiveModal("edit");
  };

  const handleUpdateReservation = async () => {
    // Validar fechas
    if (formData.check_in && formData.check_out) {
      const checkIn = new Date(formData.check_in);
      const checkOut = new Date(formData.check_out);
      if (checkOut <= checkIn) {
        alert("La fecha de check-out debe ser posterior a la fecha de check-in.");
        return;
      }
    }

    if (!selectedReservation) return;
    setActionLoading("update");
    try {
      const { error } = await supabase.from("reservations").update({
        guest_id: formData.guest_id || selectedReservation.guest_id,
        unit_id: formData.unit_id || selectedReservation.unit_id,
        check_in: formData.check_in || selectedReservation.check_in,
        check_out: formData.check_out || selectedReservation.check_out,
        total_amount: formData.total_amount ? parseFloat(formData.total_amount) : selectedReservation.total_amount,
        paid_amount: formData.paid_amount ? parseFloat(formData.paid_amount) : selectedReservation.paid_amount,
        payment_method: formData.payment_method || selectedReservation.payment_method,
        notes: formData.notes,
      }).eq("id", selectedReservation.id);
      if (error) throw error;
      const { data: updatedRes } = await supabase.from("reservations").select("*").eq("id", selectedReservation.id).single();
      if (updatedRes) {
        const enriched: Reservation = { ...updatedRes, guest: guests.find(g => g.id === updatedRes.guest_id), unit: units.find(u => u.id === updatedRes.unit_id) };
        setReservations(reservations.map(r => r.id === updatedRes.id ? enriched : r));
      }
      setActiveModal("none"); setSelectedReservation(null);
    } catch (err: any) { alert("Error: " + err.message); } finally { setActionLoading(null); }
  };

  const getReservationPayments = (reservationId: string) => payments.filter(p => p.reservation_id === reservationId);

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash": return "Efectivo"; case "transfer": return "Transferencia";
      case "card": return "Tarjeta"; case "mercadopago": return "Mercado Pago";
      default: return method || "—";
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#0F766E]" /></div>;
  if (error) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-center"><AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" /><h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2><p className="text-gray-600">{error}</p></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reservas</h1>
          <p className="text-gray-500 mt-1">
            {showCheckedOut ? `${filteredReservations.length} reservas con check-out` : `${filteredReservations.length} ${filteredReservations.length === 1 ? "reserva activa" : "reservas activas"}`}
          </p>
        </div>
        <button onClick={() => { setAddMethod("manual"); setActiveModal("add"); }} className="flex items-center gap-2 px-4 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-medium hover:bg-[#0F766E]/90 transition-colors">
          <Plus className="w-4 h-4" />Nueva reserva
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar por nombre, apellido, código o unidad..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" />
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]" />
            <span className="text-gray-500">-</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setFilter("active"); setShowCheckedOut(false); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "active" && !showCheckedOut ? "bg-[#0F766E] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Activas</button>
            <button onClick={() => { setFilter("today"); setShowCheckedOut(false); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "today" && !showCheckedOut ? "bg-[#0F766E] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Hoy</button>
            <button onClick={() => { setFilter("tomorrow"); setShowCheckedOut(false); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "tomorrow" && !showCheckedOut ? "bg-[#0F766E] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Mañana</button>
            <button onClick={() => { setFilter("nextweek"); setShowCheckedOut(false); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "nextweek" && !showCheckedOut ? "bg-[#0F766E] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Semana</button>
            <button onClick={() => setShowCheckedOut(!showCheckedOut)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${showCheckedOut ? "bg-gray-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              <Archive className="w-4 h-4" />
              {showCheckedOut ? "Ocultar check-outs" : "Ver check-outs"}
            </button>
          </div>
        </div>
      </div>

      {filteredReservations.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No hay reservas</h3>
          <p className="text-gray-600">{searchTerm || filter !== "active" || dateFrom || dateTo || showCheckedOut ? "No se encontraron reservas con los filtros aplicados." : "Comenzá agregando tu primera reserva."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReservations.map((reservation) => (
            <div key={reservation.id} className={`bg-white border rounded-xl p-6 hover:shadow-md transition-shadow ${reservation.status === "checked_out" ? "border-gray-300 opacity-75" : "border-gray-200"}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-bold text-gray-900">{reservation.guest?.first_name || "—"} {reservation.guest?.last_name || ""}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(reservation.status)}`}>{getStatusIcon(reservation.status)}{getStatusLabel(reservation.status)}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div><p className="text-gray-500 text-xs">Código</p><p className="font-mono font-semibold text-gray-900">{reservation.reservation_code || "—"}</p></div>
                    <div><p className="text-gray-500 text-xs">Check-in</p><p className="font-semibold text-gray-900">{new Date(reservation.check_in).toLocaleDateString("es-AR")}</p></div>
                    <div><p className="text-gray-500 text-xs">Check-out</p><p className="font-semibold text-gray-900">{new Date(reservation.check_out).toLocaleDateString("es-AR")}</p></div>
                    <div><p className="text-gray-500 text-xs">Unidad</p><p className="font-semibold text-gray-900">{reservation.unit?.name || "—"}</p></div>
                    <div><p className="text-gray-500 text-xs">Pago</p><p className="font-semibold text-gray-900">${reservation.paid_amount || 0} / ${reservation.total_amount || 0}</p></div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    {reservation.guest?.email && <span className="text-gray-600 flex items-center gap-1"><Mail className="w-4 h-4" />{reservation.guest.email}</span>}
                    {reservation.guest?.phone && <span className="text-gray-600 flex items-center gap-1"><Phone className="w-4 h-4" />{reservation.guest.phone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {reservation.status === "booked" || reservation.status === "pre_checkin" ? (
                    <button onClick={() => openCheckInModal(reservation)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Hacer check-in"><CheckSquare className="w-5 h-5" /></button>
                  ) : reservation.status === "checked_in" ? (
                    <button onClick={() => openCheckOutModal(reservation)} className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Hacer check-out"><LogOut className="w-5 h-5" /></button>
                  ) : null}
                  <button onClick={() => openPaymentModal(reservation)} className="p-2 text-gray-400 hover:text-[#0F766E] hover:bg-gray-100 rounded-lg transition-colors" title="Registrar pago"><DollarSign className="w-5 h-5" /></button>
                  <button onClick={() => openWhatsAppModal(reservation)} className="p-2 text-gray-400 hover:text-[#25D366] hover:bg-green-50 rounded-lg transition-colors" title="Enviar WhatsApp"><Send className="w-5 h-5" /></button>
                  <button onClick={() => { setSelectedReservation(reservation); setActiveModal("qr"); }} className="p-2 text-gray-400 hover:text-[#0F766E] hover:bg-gray-100 rounded-lg transition-colors" title="Ver QR y link"><QrCode className="w-5 h-5" /></button>
                  <button onClick={() => openEditModal(reservation)} className="p-2 text-gray-400 hover:text-[#0F766E] hover:bg-gray-100 rounded-lg transition-colors" title="Editar"><Edit className="w-5 h-5" /></button>
                  <button onClick={() => { setSelectedReservation(reservation); setActiveModal("delete"); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Check-in */}
      {activeModal === "checkin" && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div><h2 className="text-2xl font-bold text-gray-900">Check-in</h2><p className="text-sm text-gray-500">{selectedReservation.guest?.first_name} {selectedReservation.guest?.last_name} • {selectedReservation.reservation_code}</p></div>
              <button onClick={() => setActiveModal("none")} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-blue-600 text-xs">Check-in</p><p className="font-semibold text-blue-900">{new Date(selectedReservation.check_in).toLocaleDateString("es-AR")}</p></div>
                  <div><p className="text-blue-600 text-xs">Check-out</p><p className="font-semibold text-blue-900">{new Date(selectedReservation.check_out).toLocaleDateString("es-AR")}</p></div>
                  <div><p className="text-blue-600 text-xs">Unidad</p><p className="font-semibold text-blue-900">{selectedReservation.unit?.name || "—"}</p></div>
                  <div><p className="text-blue-600 text-xs">Huésped</p><p className="font-semibold text-blue-900">{selectedReservation.guest?.first_name} {selectedReservation.guest?.last_name}</p></div>
                </div>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Documento (DNI/Pasaporte)</label><input type="text" value={checkinData.document_number} onChange={(e) => setCheckinData({ ...checkinData, document_number: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="Número de documento" /></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Patente del vehículo (opcional)</label><input type="text" value={checkinData.vehicle_plate} onChange={(e) => setCheckinData({ ...checkinData, vehicle_plate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="ABC123" /></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Contacto de emergencia</label><input type="text" value={checkinData.emergency_contact} onChange={(e) => setCheckinData({ ...checkinData, emergency_contact: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="Nombre y teléfono" /></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Atendido por</label><input type="text" value={checkinData.attended_by} onChange={(e) => setCheckinData({ ...checkinData, attended_by: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="Nombre de quien atiende el check-in" /></div>
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4" />Pago en check-in (opcional)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Monto</label><input type="number" value={checkinData.additional_payment} onChange={(e) => setCheckinData({ ...checkinData, additional_payment: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="0" /></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Método</label><select value={checkinData.payment_method} onChange={(e) => setCheckinData({ ...checkinData, payment_method: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"><option value="cash">Efectivo</option><option value="transfer">Transferencia</option><option value="card">Tarjeta</option><option value="mercadopago">Mercado Pago</option></select></div>
                </div>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Observaciones</label><textarea value={checkinData.observations} onChange={(e) => setCheckinData({ ...checkinData, observations: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="Estado de la unidad, llaves entregadas, etc." /></div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setActiveModal("none")} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleCheckIn} disabled={actionLoading === "checkin"} className="px-4 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-medium hover:bg-[#0F766E]/90 disabled:opacity-50 flex items-center gap-2">{actionLoading === "checkin" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckSquare className="w-4 h-4" />Confirmar check-in</>}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Registrar Pago */}
      {activeModal === "payment" && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div><h2 className="text-2xl font-bold text-gray-900">Registrar pago</h2><p className="text-sm text-gray-500">{selectedReservation.guest?.first_name} {selectedReservation.guest?.last_name} • {selectedReservation.reservation_code}</p></div>
              <button onClick={() => setActiveModal("none")} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div><p className="text-gray-500 text-xs">Total</p><p className="font-bold text-gray-900">${selectedReservation.total_amount || 0}</p></div>
                  <div><p className="text-gray-500 text-xs">Pagado</p><p className="font-bold text-green-600">${selectedReservation.paid_amount || 0}</p></div>
                  <div><p className="text-gray-500 text-xs">Pendiente</p><p className="font-bold text-orange-600">${Math.max(0, (selectedReservation.total_amount || 0) - (selectedReservation.paid_amount || 0))}</p></div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Monto a pagar</label>
                <input type="number" value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Método de pago</label>
                <select value={paymentData.method} onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]">
                  <option value="cash">Efectivo</option><option value="transfer">Transferencia</option>
                  <option value="card">Tarjeta</option><option value="mercadopago">Mercado Pago</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notas (opcional)</label>
                <textarea value={paymentData.notes} onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="Observaciones..." />
              </div>
              {getReservationPayments(selectedReservation.id).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1"><History className="w-3 h-3" />Historial de pagos</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {getReservationPayments(selectedReservation.id).map((p) => (
                      <div key={p.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-gray-900">${p.amount.toLocaleString("es-AR")}</p>
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">{getPaymentMethodLabel(p.method)}</span>
                        </div>
                        <p className="text-xs text-gray-500">{new Date(p.date).toLocaleDateString("es-AR", { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                        {p.notes && <p className="text-xs text-gray-600 mt-1 italic">"{p.notes}"</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setActiveModal("none")} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleAddPayment} disabled={actionLoading === "payment"} className="px-4 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-medium hover:bg-[#0F766E]/90 disabled:opacity-50 flex items-center gap-2">{actionLoading === "payment" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><DollarSign className="w-4 h-4" />Registrar pago</>}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: WhatsApp */}
      {activeModal === "whatsapp" && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div><h2 className="text-2xl font-bold text-gray-900">Enviar WhatsApp</h2><p className="text-sm text-gray-500">{selectedReservation.guest?.first_name} {selectedReservation.guest?.last_name} • {selectedReservation.guest?.phone || "Sin teléfono"}</p></div>
              <button onClick={() => setActiveModal("none")} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de mensaje</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { type: "reminder" as WhatsAppType, label: "Recordatorio", icon: Bell },
                    { type: "precheckin" as WhatsAppType, label: "Pre check-in", icon: UserCheck },
                    { type: "during" as WhatsAppType, label: "Durante estadía", icon: Home },
                    { type: "checkout" as WhatsAppType, label: "Check-out", icon: LogOut },
                    { type: "postcheckout" as WhatsAppType, label: "Post check-out", icon: Star },
                  ].map((item) => (
                    <button key={item.type} onClick={() => handleWhatsAppTypeChange(item.type)} className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center gap-2 ${whatsAppType === item.type ? "border-[#0F766E] bg-[#0F766E]/5" : "border-gray-200 hover:border-gray-300"}`}>
                      <item.icon className={`w-5 h-5 ${whatsAppType === item.type ? "text-[#0F766E]" : "text-gray-400"}`} />
                      <span className={`text-xs font-medium ${whatsAppType === item.type ? "text-[#0F766E]" : "text-gray-600"}`}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje (editable)</label>
                <textarea value={whatsAppMessage} onChange={(e) => setWhatsAppMessage(e.target.value)} rows={10} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E] font-mono text-sm" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setActiveModal("none")} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button onClick={sendWhatsApp} className="px-4 py-2 bg-[#25D366] text-white rounded-lg text-sm font-medium hover:bg-[#25D366]/90 flex items-center gap-2"><Send className="w-4 h-4" />Enviar por WhatsApp</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: QR */}
      {activeModal === "qr" && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div><h3 className="text-lg font-bold text-gray-900">Link de acceso del huésped</h3><p className="text-sm text-gray-500">{selectedReservation.guest?.first_name} {selectedReservation.guest?.last_name}</p></div>
              <button onClick={() => { setActiveModal("none"); setSelectedReservation(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-4 flex justify-center">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getGuestPanelUrl(selectedReservation))}`} alt="QR Code" className="w-48 h-48" />
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-xs text-gray-500 mb-1">URL de acceso (código y apellido precargados)</p>
              <p className="text-sm text-gray-900 break-all font-mono">{getGuestPanelUrl(selectedReservation)}</p>
            </div>
            <div className="flex gap-3">
              <Link href={getGuestPanelUrl(selectedReservation)} target="_blank" className="flex-1 bg-[#0F766E] text-white py-2 px-4 rounded-lg font-medium text-center hover:bg-[#0F766E]/90 transition-colors flex items-center justify-center gap-2"><ExternalLink className="w-4 h-4" />Abrir link</Link>
              <button onClick={() => { navigator.clipboard.writeText(getGuestPanelUrl(selectedReservation)); alert("Link copiado"); }} className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"><Copy className="w-4 h-4" />Copiar link</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Editar */}
      {activeModal === "edit" && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Editar reserva {selectedReservation.reservation_code}</h2>
              <button onClick={() => { setActiveModal("none"); setSelectedReservation(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Huésped</label><select value={formData.guest_id} onChange={(e) => setFormData({ ...formData, guest_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"><option value="">Seleccionar huésped...</option>{guests.map((g) => (<option key={g.id} value={g.id}>{g.first_name} {g.last_name} ({g.email})</option>))}</select></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Unidad</label><select value={formData.unit_id} onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"><option value="">Seleccionar unidad...</option>{units.map((u) => (<option key={u.id} value={u.id}>{u.name} ({u.type} - {u.capacity} pers.)</option>))}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Check-in</label><input type="date" value={formData.check_in} onChange={(e) => setFormData({ ...formData, check_in: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Check-out</label><input type="date" value={formData.check_out} onChange={(e) => setFormData({ ...formData, check_out: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Monto total</label><input type="number" value={formData.total_amount} onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Monto pagado</label><input type="number" value={formData.paid_amount} onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Método de pago</label><select value={formData.payment_method} onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"><option value="cash">Efectivo</option><option value="transfer">Transferencia</option><option value="card">Tarjeta</option><option value="mercadopago">Mercado Pago</option></select></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Notas</label><textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" /></div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => { setActiveModal("none"); setSelectedReservation(null); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleUpdateReservation} disabled={actionLoading === "update"} className="px-4 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-medium hover:bg-[#0F766E]/90 disabled:opacity-50 flex items-center gap-2">{actionLoading === "update" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Check-out */}
      {activeModal === "checkout" && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center"><LogOut className="w-6 h-6 text-orange-600" /></div>
              <div><h3 className="text-lg font-bold text-gray-900">Confirmar check-out</h3><p className="text-sm text-gray-500">{selectedReservation.guest?.first_name} {selectedReservation.guest?.last_name}</p></div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-orange-600 text-xs">Unidad</p><p className="font-semibold text-orange-900">{selectedReservation.unit?.name || "—"}</p></div>
                <div><p className="text-orange-600 text-xs">Check-out</p><p className="font-semibold text-orange-900">{new Date(selectedReservation.check_out).toLocaleDateString("es-AR")}</p></div>
              </div>
            </div>
            <p className="text-gray-600 mb-6">¿Confirmás el check-out de este huésped? Se marcará la reserva como completada.</p>
            <div className="flex gap-3">
              <button onClick={() => setActiveModal("none")} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleCheckOut} disabled={actionLoading === "checkout"} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2">{actionLoading === "checkout" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogOut className="w-4 h-4" />Confirmar check-out</>}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Eliminar */}
      {activeModal === "delete" && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center"><Trash2 className="w-6 h-6 text-red-600" /></div>
              <div><h3 className="text-lg font-bold text-gray-900">Eliminar reserva</h3><p className="text-sm text-gray-500">{selectedReservation.reservation_code}</p></div>
            </div>
            <p className="text-gray-600 mb-6">¿Estás seguro que querés eliminar la reserva de <strong>{selectedReservation.guest?.first_name} {selectedReservation.guest?.last_name}</strong>? Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => { setActiveModal("none"); setSelectedReservation(null); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button onClick={() => handleDelete(selectedReservation)} disabled={actionLoading === `delete-${selectedReservation.id}`} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">{actionLoading === `delete-${selectedReservation.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" />Eliminar</>}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Nueva Reserva */}
      {activeModal === "add" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Nueva reserva</h2>
              <button onClick={() => setActiveModal("none")} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              <div className="flex gap-2 mb-6">
                <button onClick={() => setAddMethod("manual")} className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${addMethod === "manual" ? "bg-[#0F766E] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}><Edit className="w-4 h-4" />Manual</button>
                <button onClick={() => setAddMethod("csv")} className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${addMethod === "csv" ? "bg-[#0F766E] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}><Upload className="w-4 h-4" />Importar CSV</button>
                <button onClick={() => setAddMethod("text")} className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${addMethod === "text" ? "bg-[#0F766E] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}><MessageSquare className="w-4 h-4" />Mensaje de texto</button>
              </div>
              {addMethod === "manual" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.create_new_guest} onChange={(e) => setFormData({ ...formData, create_new_guest: e.target.checked, guest_id: "" })} className="w-4 h-4 rounded border-gray-300" />
                      <span className="text-sm font-medium text-gray-700">Crear huésped nuevo</span>
                    </label>
                  </div>
                  {formData.create_new_guest ? (
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label><input type="text" value={formData.new_guest_first_name} onChange={(e) => setFormData({ ...formData, new_guest_first_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="Juan" /></div>
                        <div><label className="block text-xs font-medium text-gray-700 mb-1">Apellido</label><input type="text" value={formData.new_guest_last_name} onChange={(e) => setFormData({ ...formData, new_guest_last_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="Pérez" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-medium text-gray-700 mb-1">Email</label><input type="email" value={formData.new_guest_email} onChange={(e) => setFormData({ ...formData, new_guest_email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="juan@email.com" /></div>
                        <div><label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label><input type="text" value={formData.new_guest_phone} onChange={(e) => setFormData({ ...formData, new_guest_phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="01131923742" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-medium text-gray-700 mb-1">Nacionalidad</label><input type="text" value={formData.new_guest_nationality} onChange={(e) => setFormData({ ...formData, new_guest_nationality: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" /></div>
                        <div><label className="block text-xs font-medium text-gray-700 mb-1">Documento</label><input type="text" value={formData.new_guest_document} onChange={(e) => setFormData({ ...formData, new_guest_document: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="DNI/Pasaporte" /></div>
                      </div>
                    </div>
                  ) : (
                    <div><label className="block text-xs font-medium text-gray-700 mb-1">Huésped existente</label><select value={formData.guest_id} onChange={(e) => setFormData({ ...formData, guest_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"><option value="">Seleccionar huésped...</option>{guests.map((g) => (<option key={g.id} value={g.id}>{g.first_name} {g.last_name} ({g.email})</option>))}</select></div>
                  )}
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Unidad</label><select value={formData.unit_id} onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"><option value="">Seleccionar unidad...</option>{units.map((u) => (<option key={u.id} value={u.id}>{u.name} ({u.type} - {u.capacity} pers.)</option>))}</select></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-gray-700 mb-1">Check-in</label><input type="date" value={formData.check_in} onChange={(e) => setFormData({ ...formData, check_in: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" /></div>
                    <div><label className="block text-xs font-medium text-gray-700 mb-1">Check-out</label><input type="date" value={formData.check_out} onChange={(e) => setFormData({ ...formData, check_out: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-gray-700 mb-1">Monto total</label><input type="number" value={formData.total_amount} onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="0" /></div>
                    <div><label className="block text-xs font-medium text-gray-700 mb-1">Monto pagado</label><input type="number" value={formData.paid_amount} onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="0" /></div>
                  </div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Método de pago</label><select value={formData.payment_method} onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"><option value="cash">Efectivo</option><option value="transfer">Transferencia</option><option value="card">Tarjeta</option><option value="mercadopago">Mercado Pago</option></select></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Notas</label><textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="Observaciones..." /></div>
                </div>
              )}
              {addMethod === "csv" && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800"><strong>Formato CSV esperado:</strong></p>
                    <p className="text-xs text-blue-700 mt-1 font-mono">first_name,last_name,email,phone,check_in,check_out,unit_name,total_amount</p>
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-3">Arrastrá tu archivo CSV o hacé clic para seleccionar</p>
                    <input type="file" accept=".csv" className="hidden" id="csv-upload" />
                    <label htmlFor="csv-upload" className="inline-block px-4 py-2 bg-[#0F766E] text-white rounded-lg cursor-pointer hover:bg-[#0F766E]/90">Seleccionar archivo</label>
                  </div>
                </div>
              )}
              {addMethod === "text" && (
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-purple-800"><strong>Parser inteligente:</strong> Pegá un mensaje de WhatsApp o texto libre y el sistema detectará automáticamente los datos de la reserva.</p>
                  </div>
                  <textarea rows={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="Ej: Hola, quiero reservar para Juan Pérez, del 15 al 20 de octubre, cabaña 3, total $50000..." />
                  <button className="w-full bg-[#0F766E] text-white py-3 rounded-lg font-medium hover:bg-[#0F766E]/90 flex items-center justify-center gap-2"><MessageSquare className="w-4 h-4" />Analizar texto</button>
                </div>
              )}
            </div>
            {addMethod === "manual" && (
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button onClick={() => setActiveModal("none")} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button onClick={handleCreateReservation} disabled={actionLoading === "create"} className="px-4 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-medium hover:bg-[#0F766E]/90 disabled:opacity-50 flex items-center gap-2">{actionLoading === "create" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Crear reserva</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}