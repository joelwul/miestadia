"use client";
import { useState, useEffect } from "react";
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
  Filter,
  Info,
  RefreshCw,
  MoreVertical,
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
  reservation_id: string;
  amount: number;
  method: string;
  date: string;
  notes: string;
}

interface PreCheckin {
  id: string;
  reservation_id: string;
  status: string;
  document_number: string;
  vehicle_plate: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  special_requests: string;
  arrival_time: string;
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
  preCheckin?: PreCheckin | null;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

type FilterType = "all" | "today" | "tomorrow" | "nextweek";
type StatusFilterType = "all" | "booked" | "pre_checkin_completed" | "checked_in" | "checked_out" | "cancelled";
type ModalType = "none" | "add" | "edit" | "qr" | "delete" | "checkin" | "checkout" | "whatsapp" | "payment" | "legend";
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
  const [preCheckins, setPreCheckins] = useState<PreCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeModal, setActiveModal] = useState<ModalType>("none");
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [addMethod, setAddMethod] = useState<AddMethod>("manual");
  const [whatsAppType, setWhatsAppType] = useState<WhatsAppType>("reminder");
  const [whatsAppMessage, setWhatsAppMessage] = useState("");
  const [mobileActionMenu, setMobileActionMenu] = useState<string | null>(null);
  const supabase = createClient();

  const [formData, setFormData] = useState({
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
    new_guest_nationality: "Argentina",
    new_guest_document: "",
    create_new_guest: false,
  });

  const [checkinData, setCheckinData] = useState({
    document_number: "",
    vehicle_plate: "",
    emergency_contact: "",
    observations: "",
    attended_by: "",
    additional_payment: "",
    payment_method: "cash",
  });

  const [paymentData, setPaymentData] = useState({ amount: "", method: "cash", notes: "" });

  async function loadData() {
    setRefreshing(true);
    try {
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("id, name, slug")
        .eq("slug", tenantSlug)
        .single();

      if (tenantError || !tenantData) {
        setError("Alojamiento no encontrado.");
        setLoading(false);
        setRefreshing(false);
        return;
      }
      setTenant(tenantData);

      const { data: reservationsData } = await supabase
        .from("reservations")
        .select("*")
        .eq("tenant_id", tenantData.id)
        .order("check_in", { ascending: true });

      const { data: guestsData } = await supabase
        .from("guests")
        .select("id, first_name, last_name, email, phone")
        .eq("tenant_id", tenantData.id);

      const { data: unitsData } = await supabase
        .from("units")
        .select("id, name, type, capacity")
        .eq("tenant_id", tenantData.id)
        .eq("status", "active");

      const { data: paymentsData } = await supabase
        .from("reservation_payments")
        .select("id, reservation_id, amount, payment_method as method, payment_date as date, notes")
        .eq("tenant_id", tenantData.id)
        .order("payment_date", { ascending: false });

      const { data: preCheckinsData } = await supabase
        .from("pre_checkins")
        .select("*")
        .eq("tenant_id", tenantData.id);

      setGuests(guestsData || []);
      setUnits(unitsData || []);
      setPayments(paymentsData || []);
      setPreCheckins(preCheckinsData || []);

      const enriched: Reservation[] = (reservationsData || []).map((res: any) => {
        const preCheckin = (preCheckinsData || []).find((pc: any) => pc.reservation_id === res.id);
        return {
          ...res,
          guest: guestsData?.find((g: any) => g.id === res.guest_id),
          unit: unitsData?.find((u: any) => u.id === res.unit_id),
          preCheckin: preCheckin || null,
        };
      });
      setReservations(enriched);
    } catch (err: any) {
      setError("Error: " + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [tenantSlug]);

  const getToday = () => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  };
  const getTomorrow = () => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    t.setHours(0, 0, 0, 0);
    return t;
  };
  const getNextWeekStart = () => {
    const t = new Date();
    t.setDate(t.getDate() + 7);
    t.setHours(0, 0, 0, 0);
    return t;
  };
  const getNextWeekEnd = () => {
    const t = new Date();
    t.setDate(t.getDate() + 13);
    t.setHours(23, 59, 59, 999);
    return t;
  };

  const getRealStatus = (res: Reservation): string => {
    if (res.status === "cancelled") return "cancelled";
    if (res.status === "checked_in") return "checked_in";
    if (res.status === "checked_out") return "checked_out";
    if (res.preCheckin && res.preCheckin.status === "completed") {
      return "pre_checkin_completed";
    }
    return "booked";
  };

  const filteredReservations = reservations.filter((res) => {
    const checkIn = new Date(res.check_in);
    const today = getToday();
    const tomorrow = getTomorrow();
    const nextWeekStart = getNextWeekStart();
    const nextWeekEnd = getNextWeekEnd();
    const guestName = `${res.guest?.first_name || ""} ${res.guest?.last_name || ""}`.toLowerCase();
    const realStatus = getRealStatus(res);

    const matchesSearch =
      searchTerm === "" ||
      guestName.includes(searchTerm.toLowerCase()) ||
      res.reservation_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.unit?.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (dateFrom && checkIn < new Date(dateFrom)) return false;
    if (dateTo && checkIn > new Date(dateTo)) return false;

    switch (filter) {
      case "today":
        if (checkIn.toDateString() !== today.toDateString()) return false;
        break;
      case "tomorrow":
        if (checkIn.toDateString() !== tomorrow.toDateString()) return false;
        break;
      case "nextweek":
        if (checkIn < nextWeekStart || checkIn > nextWeekEnd) return false;
        break;
    }

    if (statusFilter !== "all" && realStatus !== statusFilter) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "booked": return "bg-blue-100 text-blue-800 border-blue-200";
      case "pre_checkin_completed": return "bg-green-100 text-green-800 border-green-200";
      case "checked_in": return "bg-purple-100 text-purple-800 border-purple-200";
      case "checked_out": return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "booked": return "Reservada";
      case "pre_checkin_completed": return "Pre-checkin";
      case "checked_in": return "Check-in";
      case "checked_out": return "Check-out";
      case "cancelled": return "Cancelada";
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "booked": return <CheckCircle className="w-4 h-4" />;
      case "pre_checkin_completed": return <CheckCircle className="w-4 h-4" />;
      case "checked_in": return <Calendar className="w-4 h-4" />;
      case "checked_out": return <CheckCircle className="w-4 h-4" />;
      case "cancelled": return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
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
      case "reminder":
        return `¡Hola ${firstName}! 👋\n\nTe recordamos tu próxima reserva en *${tenant.name}*:\n\n📅 Check-in: ${checkIn}\n📅 Check-out: ${checkOut}\n🏠 Unidad: ${unitName}\n🔑 Código: ${code}\n\nAccedé a tu panel de huésped: ${guestPanelUrl}\n\n¡Te esperamos!\n\n— ${tenant.name}`;
      case "precheckin":
        return `¡Hola ${firstName}! \n\nTu check-in en *${tenant.name}* se acerca (${checkIn}).\n\nPara agilizar tu llegada, completá el pre check-in digital:\n${guestPanelUrl}\n\nAsí llegás directo a tu unidad sin trámites.\n\n— ${tenant.name}`;
      case "during":
        return `¡Hola ${firstName}! 😊\n\nEsperamos que estés disfrutando tu estadía en *${tenant.name}*.\n\nSi necesitás algo, no dudes en contactarnos.\n\nPanel de huésped: ${guestPanelUrl}\n\n— ${tenant.name}`;
      case "checkout":
        return `¡Hola ${firstName}! 📅\n\nTe recordamos que tu check-out en *${tenant.name}* es el ${checkOut}.\n\nPor favor dejá la unidad en las condiciones acordadas.\n\n¡Gracias por elegirnos!\n\n— ${tenant.name}`;
      case "postcheckout":
        return `¡Hola ${firstName}! \n\nEsperamos que hayas disfrutado tu estadía en *${tenant.name}*.\n\n¿Nos ayudarías dejando una reseña en Google Maps? Nos ayuda mucho a crecer:\nhttps://g.page/r/TU_LINK_AQUI\n\n¡Te esperamos de vuelta!\n\n— ${tenant.name}`;
      default:
        return "";
    }
  };

  const openWhatsAppModal = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setWhatsAppType("reminder");
    setWhatsAppMessage(getWhatsAppMessageTemplate("reminder", reservation));
    setActiveModal("whatsapp");
    setMobileActionMenu(null);
  };

  const handleWhatsAppTypeChange = (type: WhatsAppType) => {
    setWhatsAppType(type);
    if (selectedReservation) setWhatsAppMessage(getWhatsAppMessageTemplate(type, selectedReservation));
  };

  const sendWhatsApp = () => {
    if (!selectedReservation?.guest) return;
    const phone = selectedReservation.guest.phone?.replace(/\D/g, "") || "";
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(whatsAppMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(whatsAppMessage)}`;
    window.open(url, "_blank");
    setActiveModal("none");
  };

  const openCheckInModal = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    const preCheckin = reservation.preCheckin;
    setCheckinData({
      document_number: preCheckin?.document_number || "",
      vehicle_plate: preCheckin?.vehicle_plate || "",
      emergency_contact: preCheckin?.emergency_contact_name
        ? `${preCheckin.emergency_contact_name} - ${preCheckin.emergency_contact_phone || ""}`
        : "",
      observations: preCheckin?.special_requests || "",
      attended_by: "",
      additional_payment: "",
      payment_method: "cash",
    });
    setActiveModal("checkin");
    setMobileActionMenu(null);
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
        const paymentAmount = parseFloat(checkinData.additional_payment);
        const currentPaid = selectedReservation.paid_amount || 0;
        const total = selectedReservation.total_amount || 0;
        if (currentPaid + paymentAmount > total) {
          alert(`El pago excede el total. Máximo permitido: $${total - currentPaid}`);
          setActionLoading(null);
          return;
        }
        await supabase.from("reservation_payments").insert({
          tenant_id: tenant!.id,
          reservation_id: selectedReservation.id,
          amount: paymentAmount,
          payment_method: checkinData.payment_method,
          payment_date: new Date().toISOString(),
          notes: `Pago en check-in. Atendido por: ${checkinData.attended_by}`,
        });
        const newPaid = currentPaid + paymentAmount;
        await supabase.from("reservations").update({
          paid_amount: newPaid,
          payment_status: newPaid >= total ? "paid" : newPaid > 0 ? "partial" : "pending",
        }).eq("id", selectedReservation.id);
      }
      setReservations(reservations.map((r) => (r.id === selectedReservation.id ? { ...r, status: "checked_in" } : r)));
      setActiveModal("none");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openCheckOutModal = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setActiveModal("checkout");
    setMobileActionMenu(null);
  };

  const handleCheckOut = async () => {
    if (!selectedReservation) return;
    setActionLoading("checkout");
    try {
      const { error } = await supabase.from("reservations").update({ status: "checked_out" }).eq("id", selectedReservation.id);
      if (error) throw error;
      setReservations(reservations.map((r) => (r.id === selectedReservation.id ? { ...r, status: "checked_out" } : r)));
      setActiveModal("none");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reservation: Reservation) => {
    if (!confirm(`¿Eliminar la reserva de ${reservation.guest?.first_name} ${reservation.guest?.last_name}?`)) return;
    setActionLoading(`delete-${reservation.id}`);
    try {
      const { error } = await supabase.from("reservations").delete().eq("id", reservation.id);
      if (error) throw error;
      setReservations(reservations.filter((r) => r.id !== reservation.id));
      setActiveModal("none");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openPaymentModal = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setPaymentData({ amount: "", method: "cash", notes: "" });
    setActiveModal("payment");
    setMobileActionMenu(null);
  };

  const handleAddPayment = async () => {
    if (!selectedReservation || !paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      alert("Ingresá un monto válido.");
      return;
    }
    const paymentAmount = parseFloat(paymentData.amount);
    const currentPaid = selectedReservation.paid_amount || 0;
    const total = selectedReservation.total_amount || 0;
    if (currentPaid + paymentAmount > total) {
      alert(`El pago excede el total. Máximo permitido: $${total - currentPaid}`);
      return;
    }
    setActionLoading("payment");
    try {
      const { error } = await supabase.from("reservation_payments").insert({
        tenant_id: tenant!.id,
        reservation_id: selectedReservation.id,
        amount: paymentAmount,
        payment_method: paymentData.method,
        payment_date: new Date().toISOString(),
        notes: paymentData.notes,
      });
      if (error) throw error;
      const newPaid = currentPaid + paymentAmount;
      await supabase.from("reservations").update({
        paid_amount: newPaid,
        payment_status: newPaid >= total ? "paid" : newPaid > 0 ? "partial" : "pending",
        payment_method: paymentData.method,
      }).eq("id", selectedReservation.id);
      setReservations(reservations.map((r) => r.id === selectedReservation.id ? { ...r, paid_amount: newPaid, payment_status: newPaid >= total ? "paid" : "partial", payment_method: paymentData.method } : r));
      const { data: newPayment } = await supabase.from("reservation_payments").select("*").eq("reservation_id", selectedReservation.id).order("payment_date", { ascending: false }).limit(1).single();
      if (newPayment) {
        setPayments([{ id: newPayment.id, reservation_id: newPayment.reservation_id, amount: newPayment.amount, method: newPayment.payment_method, date: newPayment.payment_date, notes: newPayment.notes }, ...payments]);
      }
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
    for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return `${prefix}-${code}`;
  };

  const handleCreateReservation = async () => {
    setActionLoading("create");
    try {
      let guestId = formData.guest_id;
      if (formData.create_new_guest) {
        const { data: newGuest, error: guestError } = await supabase.from("guests").insert({ tenant_id: tenant!.id, first_name: formData.new_guest_first_name, last_name: formData.new_guest_last_name, email: formData.new_guest_email, phone: formData.new_guest_phone, nationality: formData.new_guest_nationality, document_number: formData.new_guest_document }).select().single();
        if (guestError) throw guestError;
        guestId = newGuest.id;
        setGuests([...guests, newGuest]);
      }
      if (!guestId) { alert("Seleccioná un huésped o creá uno nuevo."); setActionLoading(null); return; }
      if (!formData.unit_id) { alert("Seleccioná una unidad."); setActionLoading(null); return; }
      if (!formData.check_in || !formData.check_out) { alert("Completá las fechas."); setActionLoading(null); return; }
      const total = parseFloat(formData.total_amount) || 0;
      const paid = parseFloat(formData.paid_amount) || 0;
      if (paid > total) { alert("El monto pagado no puede ser mayor al total."); setActionLoading(null); return; }
      const reservationCode = generateReservationCode();
      const { error } = await supabase.from("reservations").insert({ tenant_id: tenant!.id, reservation_code: reservationCode, guest_id: guestId, unit_id: formData.unit_id, check_in: formData.check_in, check_out: formData.check_out, status: "booked", source: "manual", total_amount: total, paid_amount: paid, payment_status: paid > 0 ? (paid >= total ? "paid" : "partial") : "pending", payment_method: formData.payment_method || null, notes: formData.notes });
      if (error) throw error;
      if (paid > 0) {
        const { data: newRes } = await supabase.from("reservations").select("id").eq("reservation_code", reservationCode).single();
        if (newRes) {
          await supabase.from("reservation_payments").insert({ tenant_id: tenant!.id, reservation_id: newRes.id, amount: paid, payment_method: formData.payment_method, payment_date: new Date().toISOString(), notes: "Pago inicial al crear reserva" });
        }
      }
      const { data: newRes } = await supabase.from("reservations").select("*").eq("reservation_code", reservationCode).single();
      if (newRes) {
        const enriched: Reservation = { ...newRes, guest: guests.find((g) => g.id === newRes.guest_id) || (formData.create_new_guest ? { id: newRes.guest_id, first_name: formData.new_guest_first_name, last_name: formData.new_guest_last_name, email: formData.new_guest_email, phone: formData.new_guest_phone } : undefined), unit: units.find((u) => u.id === newRes.unit_id), preCheckin: null };
        setReservations([enriched, ...reservations]);
        try {
          await fetch("/api/send-confirmation-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reservationId: newRes.id, tenantId: tenant!.id }),
          });
        } catch (emailErr) {
          console.error("Error enviando email:", emailErr);
        }
      }
      setFormData({ guest_id: "", unit_id: "", check_in: "", check_out: "", total_amount: "", paid_amount: "", payment_method: "cash", notes: "", new_guest_first_name: "", new_guest_last_name: "", new_guest_email: "", new_guest_phone: "", new_guest_nationality: "Argentina", new_guest_document: "", create_new_guest: false });
      setActiveModal("none");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    let realNotes = reservation.notes || "";
    try {
      const parsed = JSON.parse(reservation.notes);
      if (parsed.special_requests) realNotes = parsed.special_requests;
      else if (parsed.observations) realNotes = parsed.observations;
      else realNotes = "";
    } catch (e) { realNotes = reservation.notes || ""; }
    setFormData({ guest_id: reservation.guest_id, unit_id: reservation.unit_id, check_in: reservation.check_in, check_out: reservation.check_out, total_amount: reservation.total_amount.toString(), paid_amount: reservation.paid_amount.toString(), payment_method: reservation.payment_method || "cash", notes: realNotes, new_guest_first_name: "", new_guest_last_name: "", new_guest_email: "", new_guest_phone: "", new_guest_nationality: "Argentina", new_guest_document: "", create_new_guest: false });
    setActiveModal("edit");
    setMobileActionMenu(null);
  };

  const handleUpdateReservation = async () => {
    if (!selectedReservation) return;
    setActionLoading("update");
    try {
      const total = formData.total_amount ? parseFloat(formData.total_amount) : selectedReservation.total_amount;
      const paid = formData.paid_amount ? parseFloat(formData.paid_amount) : selectedReservation.paid_amount;
      if (paid > total) { alert("El monto pagado no puede ser mayor al total."); setActionLoading(null); return; }
      const { error } = await supabase.from("reservations").update({ guest_id: formData.guest_id || selectedReservation.guest_id, unit_id: formData.unit_id || selectedReservation.unit_id, check_in: formData.check_in || selectedReservation.check_in, check_out: formData.check_out || selectedReservation.check_out, total_amount: total, paid_amount: paid, payment_method: formData.payment_method || selectedReservation.payment_method, notes: formData.notes }).eq("id", selectedReservation.id);
      if (error) throw error;
      const { data: updatedRes } = await supabase.from("reservations").select("*").eq("id", selectedReservation.id).single();
      if (updatedRes) {
        const enriched: Reservation = { ...updatedRes, guest: guests.find((g) => g.id === updatedRes.guest_id), unit: units.find((u) => u.id === updatedRes.unit_id), preCheckin: preCheckins.find((pc) => pc.reservation_id === updatedRes.id) || null };
        setReservations(reservations.map((r) => (r.id === updatedRes.id ? enriched : r)));
      }
      setActiveModal("none");
      setSelectedReservation(null);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getReservationPayments = (reservationId: string) => payments.filter((p) => p.reservation_id === reservationId);
  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash": return "Efectivo";
      case "transfer": return "Transferencia";
      case "card": return "Tarjeta";
      case "mercadopago": return "Mercado Pago";
      default: return method || "—";
    }
  };

  const statusCounts = {
    all: reservations.length,
    booked: reservations.filter((r) => getRealStatus(r) === "booked").length,
    pre_checkin_completed: reservations.filter((r) => getRealStatus(r) === "pre_checkin_completed").length,
    checked_in: reservations.filter((r) => getRealStatus(r) === "checked_in").length,
    checked_out: reservations.filter((r) => getRealStatus(r) === "checked_out").length,
    cancelled: reservations.filter((r) => getRealStatus(r) === "cancelled").length,
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#0F766E]" /></div>;
  if (error) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-center"><AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" /><h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2><p className="text-gray-600">{error}</p></div></div>;

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 truncate">Reservas</h1>
          <p className="text-sm text-gray-500 mt-1">{filteredReservations.length} {filteredReservations.length === 1 ? "reserva" : "reservas"}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => loadData()}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
          </button>
          <button
            onClick={() => { setAddMethod("manual"); setActiveModal("add"); }}
            className="flex items-center gap-2 px-3 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-medium hover:bg-[#0F766E]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva reserva</span>
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 lg:p-4 space-y-3">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, código o unidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          />
        </div>

        {/* Fechas - scroll horizontal en móvil */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs lg:text-sm flex-shrink-0" />
          <span className="text-gray-500 text-xs flex-shrink-0">-</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs lg:text-sm flex-shrink-0" />
        </div>

        {/* Filtros de fecha - scroll horizontal */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {[
            { key: "all", label: "Todas" },
            { key: "today", label: "Hoy" },
            { key: "tomorrow", label: "Mañana" },
            { key: "nextweek", label: "Semana" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as FilterType)}
              className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                filter === f.key ? "bg-[#0F766E] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* FILTROS DE ESTADO - scroll horizontal */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <Filter className="w-4 h-4 text-gray-600 flex-shrink-0" />
          {[
            { key: "all", label: "Todas", count: statusCounts.all, color: "gray" },
            { key: "booked", label: "Reservada", count: statusCounts.booked, color: "blue" },
            { key: "pre_checkin_completed", label: "Pre-checkin", count: statusCounts.pre_checkin_completed, color: "green" },
            { key: "checked_in", label: "Check-in", count: statusCounts.checked_in, color: "purple" },
            { key: "checked_out", label: "Check-out", count: statusCounts.checked_out, color: "gray" },
            { key: "cancelled", label: "Cancelada", count: statusCounts.cancelled, color: "red" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key as StatusFilterType)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 flex-shrink-0 ${
                statusFilter === item.key ? "bg-[#0F766E] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                item.color === "blue" ? "bg-blue-500" :
                item.color === "green" ? "bg-green-500" :
                item.color === "purple" ? "bg-purple-500" :
                item.color === "red" ? "bg-red-500" :
                "bg-gray-400"
              }`} />
              {item.label}
              {item.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  statusFilter === item.key ? "bg-white/20" : "bg-gray-200"
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
          <button onClick={() => setActiveModal("legend")} className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0" title="Ver leyenda de colores">
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline">¿Qué significa cada color?</span>
          </button>
        </div>
      </div>

      {/* LISTA DE RESERVAS */}
      {filteredReservations.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 lg:p-12 text-center">
          <Calendar className="w-12 h-12 lg:w-16 lg:h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2">No hay reservas</h3>
          <p className="text-sm text-gray-600">
            {searchTerm || filter !== "all" || statusFilter !== "all" || dateFrom || dateTo
              ? "No se encontraron reservas con los filtros aplicados."
              : "Comenzá agregando tu primera reserva."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReservations.map((reservation) => {
            const realStatus = getRealStatus(reservation);
            return (
              <div key={reservation.id} className="bg-white border border-gray-200 rounded-xl p-3 lg:p-6 hover:shadow-md transition-shadow">
                {/* Header de la reserva */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base lg:text-lg font-bold text-gray-900 truncate">
                        {reservation.guest?.first_name || "—"} {reservation.guest?.last_name || ""}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(realStatus)}`}>
                        {getStatusIcon(realStatus)}
                        <span className="hidden sm:inline">{getStatusLabel(realStatus)}</span>
                        <span className="sm:hidden">{getStatusLabel(realStatus).split(' ')[0]}</span>
                      </span>
                    </div>
                  </div>
                  {/* Menú móvil (3 puntos) */}
                  <div className="relative lg:hidden flex-shrink-0">
                    <button
                      onClick={() => setMobileActionMenu(mobileActionMenu === reservation.id ? null : reservation.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {mobileActionMenu === reservation.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setMobileActionMenu(null)} />
                        <div className="absolute right-0 top-10 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-48">
                          {(reservation.status === "booked" || realStatus === "pre_checkin_completed") && (
                            <button onClick={() => { openCheckInModal(reservation); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100">
                              <CheckSquare className="w-4 h-4" /> Check-in
                            </button>
                          )}
                          {reservation.status === "checked_in" && (
                            <button onClick={() => { openCheckOutModal(reservation); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100">
                              <LogOut className="w-4 h-4" /> Check-out
                            </button>
                          )}
                          <button onClick={() => { openPaymentModal(reservation); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100">
                            <DollarSign className="w-4 h-4" /> Pago
                          </button>
                          <button onClick={() => { openWhatsAppModal(reservation); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100">
                            <Send className="w-4 h-4" /> WhatsApp
                          </button>
                          <button onClick={() => { setSelectedReservation(reservation); setActiveModal("qr"); setMobileActionMenu(null); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100">
                            <QrCode className="w-4 h-4" /> QR
                          </button>
                          <button onClick={() => { openEditModal(reservation); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100">
                            <Edit className="w-4 h-4" /> Editar
                          </button>
                          <button onClick={() => { setSelectedReservation(reservation); setActiveModal("delete"); setMobileActionMenu(null); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2">
                            <Trash2 className="w-4 h-4" /> Eliminar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  {/* Acciones desktop */}
                  <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
                    {reservation.status === "booked" || realStatus === "pre_checkin_completed" ? (
                      <button onClick={() => openCheckInModal(reservation)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Check-in">
                        <CheckSquare className="w-5 h-5" />
                      </button>
                    ) : reservation.status === "checked_in" ? (
                      <button onClick={() => openCheckOutModal(reservation)} className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg" title="Check-out">
                        <LogOut className="w-5 h-5" />
                      </button>
                    ) : null}
                    <button onClick={() => openPaymentModal(reservation)} className="p-2 text-gray-400 hover:text-[#0F766E] hover:bg-gray-100 rounded-lg" title="Pago">
                      <DollarSign className="w-5 h-5" />
                    </button>
                    <button onClick={() => openWhatsAppModal(reservation)} className="p-2 text-gray-400 hover:text-[#25D366] hover:bg-green-50 rounded-lg" title="WhatsApp">
                      <Send className="w-5 h-5" />
                    </button>
                    <button onClick={() => { setSelectedReservation(reservation); setActiveModal("qr"); }} className="p-2 text-gray-400 hover:text-[#0F766E] hover:bg-gray-100 rounded-lg" title="QR">
                      <QrCode className="w-5 h-5" />
                    </button>
                    <button onClick={() => openEditModal(reservation)} className="p-2 text-gray-400 hover:text-[#0F766E] hover:bg-gray-100 rounded-lg" title="Editar">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button onClick={() => { setSelectedReservation(reservation); setActiveModal("delete"); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Info grid - 2 cols en móvil, 5 en desktop */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-4 text-xs lg:text-sm">
                  <div>
                    <p className="text-gray-500 text-[10px] lg:text-xs">Código</p>
                    <p className="font-mono font-semibold text-gray-900 truncate">{reservation.reservation_code || "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] lg:text-xs">Check-in</p>
                    <p className="font-semibold text-gray-900">{new Date(reservation.check_in).toLocaleDateString("es-AR", { day: '2-digit', month: '2-digit' })}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] lg:text-xs">Check-out</p>
                    <p className="font-semibold text-gray-900">{new Date(reservation.check_out).toLocaleDateString("es-AR", { day: '2-digit', month: '2-digit' })}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] lg:text-xs">Unidad</p>
                    <p className="font-semibold text-gray-900 truncate">{reservation.unit?.name || "—"}</p>
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <p className="text-gray-500 text-[10px] lg:text-xs">Pago</p>
                    <p className="font-semibold text-gray-900">${reservation.paid_amount || 0} / ${reservation.total_amount || 0}</p>
                  </div>
                </div>

                {/* Contacto */}
                <div className="mt-2 lg:mt-3 flex flex-wrap items-center gap-2 lg:gap-4 text-xs">
                  {reservation.guest?.email && (
                    <span className="text-gray-600 flex items-center gap-1 min-w-0">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate max-w-[140px]">{reservation.guest.email}</span>
                    </span>
                  )}
                  {reservation.guest?.phone && (
                    <span className="text-gray-600 flex items-center gap-1">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      {reservation.guest.phone}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Leyenda de colores */}
      {activeModal === "legend" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Info className="w-5 h-5 text-[#0F766E]" />Estados de reservas</h3>
              <button onClick={() => setActiveModal("none")} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-3">
              {[
                { color: "bg-blue-100 text-blue-800 border-blue-200", label: "Reservada", desc: "Reserva confirmada. El huésped aún no completó el pre-checkin." },
                { color: "bg-green-100 text-green-800 border-green-200", label: "Pre-checkin completado", desc: "El huésped completó el formulario de pre-checkin con sus datos." },
                { color: "bg-purple-100 text-purple-800 border-purple-200", label: "Check-in", desc: "El admin confirmó la llegada del huésped. Está alojado actualmente." },
                { color: "bg-gray-100 text-gray-800 border-gray-200", label: "Check-out", desc: "El huésped ya se fue. Reserva finalizada." },
                { color: "bg-red-100 text-red-800 border-red-200", label: "Cancelada", desc: "Reserva cancelada por el admin o el huésped." },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${item.color} flex-shrink-0`}>{item.label}</span>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setActiveModal("none")} className="w-full mt-6 px-4 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-medium hover:bg-[#0F766E]/90">Entendido</button>
          </div>
        </div>
      )}

      {/* MODAL: Check-in */}
      {activeModal === "checkin" && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">Check-in</h2>
                <p className="text-xs lg:text-sm text-gray-500 truncate">{selectedReservation.guest?.first_name} {selectedReservation.guest?.last_name} • {selectedReservation.reservation_code}</p>
              </div>
              <button onClick={() => setActiveModal("none")} className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-4 lg:p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 lg:p-4">
                <div className="grid grid-cols-2 gap-3 text-xs lg:text-sm">
                  <div><p className="text-blue-600 text-[10px] lg:text-xs">Check-in</p><p className="font-semibold text-blue-900">{new Date(selectedReservation.check_in).toLocaleDateString("es-AR")}</p></div>
                  <div><p className="text-blue-600 text-[10px] lg:text-xs">Check-out</p><p className="font-semibold text-blue-900">{new Date(selectedReservation.check_out).toLocaleDateString("es-AR")}</p></div>
                  <div><p className="text-blue-600 text-[10px] lg:text-xs">Unidad</p><p className="font-semibold text-blue-900 truncate">{selectedReservation.unit?.name || "—"}</p></div>
                  <div><p className="text-blue-600 text-[10px] lg:text-xs">Huésped</p><p className="font-semibold text-blue-900 truncate">{selectedReservation.guest?.first_name} {selectedReservation.guest?.last_name}</p></div>
                </div>
              </div>
              {selectedReservation.preCheckin && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 lg:p-4">
                  <p className="text-xs font-bold text-green-800 mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4" />Datos del pre-checkin completado</p>
                  <div className="grid grid-cols-2 gap-3 text-xs lg:text-sm">
                    {selectedReservation.preCheckin.document_number && <div><p className="text-green-600 text-[10px] lg:text-xs">Documento</p><p className="font-semibold text-green-900">{selectedReservation.preCheckin.document_number}</p></div>}
                    {selectedReservation.preCheckin.vehicle_plate && <div><p className="text-green-600 text-[10px] lg:text-xs">Patente</p><p className="font-semibold text-green-900">{selectedReservation.preCheckin.vehicle_plate}</p></div>}
                    {selectedReservation.preCheckin.arrival_time && <div><p className="text-green-600 text-[10px] lg:text-xs">Hora de llegada</p><p className="font-semibold text-green-900">{selectedReservation.preCheckin.arrival_time}</p></div>}
                    {selectedReservation.preCheckin.emergency_contact_name && <div><p className="text-green-600 text-[10px] lg:text-xs">Contacto emergencia</p><p className="font-semibold text-green-900">{selectedReservation.preCheckin.emergency_contact_name}</p>{selectedReservation.preCheckin.emergency_contact_phone && <p className="text-green-700 text-[10px] lg:text-xs">{selectedReservation.preCheckin.emergency_contact_phone}</p>}</div>}
                    {selectedReservation.preCheckin.special_requests && <div className="col-span-2"><p className="text-green-600 text-[10px] lg:text-xs">Solicitudes especiales</p><p className="font-semibold text-green-900">{selectedReservation.preCheckin.special_requests}</p></div>}
                  </div>
                </div>
              )}
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
            <div className="p-4 lg:p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setActiveModal("none")} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleCheckIn} disabled={actionLoading === "checkin"} className="px-4 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-medium hover:bg-[#0F766E]/90 disabled:opacity-50 flex items-center gap-2">
                {actionLoading === "checkin" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckSquare className="w-4 h-4" />Confirmar check-in</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Registrar Pago */}
      {activeModal === "payment" && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">Registrar pago</h2>
                <p className="text-xs lg:text-sm text-gray-500 truncate">{selectedReservation.guest?.first_name} {selectedReservation.guest?.last_name} • {selectedReservation.reservation_code}</p>
              </div>
              <button onClick={() => setActiveModal("none")} className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-4 lg:p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 lg:p-4">
                <div className="grid grid-cols-3 gap-2 lg:gap-3 text-xs lg:text-sm">
                  <div><p className="text-gray-500 text-[10px] lg:text-xs">Total</p><p className="font-bold text-gray-900">${selectedReservation.total_amount || 0}</p></div>
                  <div><p className="text-gray-500 text-[10px] lg:text-xs">Pagado</p><p className="font-bold text-green-600">${selectedReservation.paid_amount || 0}</p></div>
                  <div><p className="text-gray-500 text-[10px] lg:text-xs">Pendiente</p><p className="font-bold text-orange-600">${Math.max(0, (selectedReservation.total_amount || 0) - (selectedReservation.paid_amount || 0))}</p></div>
                </div>
              </div>
              {getReservationPayments(selectedReservation.id).length > 0 && (
                <div className="border-2 border-green-200 bg-green-50 rounded-lg p-3 lg:p-4">
                  <p className="text-xs lg:text-sm font-bold text-green-900 mb-2 lg:mb-3 flex items-center gap-2"><History className="w-4 h-4" />Historial ({getReservationPayments(selectedReservation.id).length})</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {getReservationPayments(selectedReservation.id).map((p) => {
                      const paymentDate = new Date(p.date);
                      const formattedDate = paymentDate.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
                      const formattedTime = paymentDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
                      return (
                        <div key={p.id} className="bg-white border border-green-200 rounded-lg p-2 lg:p-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0" />
                              <p className="font-bold text-green-900 text-sm">${p.amount.toLocaleString("es-AR")}</p>
                            </div>
                            <span className="text-[10px] lg:text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-medium flex-shrink-0 ml-2">{getPaymentMethodLabel(p.method)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] lg:text-xs text-gray-600"><Calendar className="w-3 h-3" /><span className="font-medium">{formattedDate}</span><span className="text-gray-400">•</span><Clock className="w-3 h-3" /><span>{formattedTime} hs</span></div>
                          {p.notes && <p className="text-[10px] lg:text-xs text-gray-600 mt-1 italic truncate">"{p.notes}"</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Nuevo pago</p>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Monto a pagar</label><input type="number" value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="0" /><p className="text-xs text-gray-500 mt-1">Máximo: ${Math.max(0, (selectedReservation.total_amount || 0) - (selectedReservation.paid_amount || 0))}</p></div>
                <div className="mt-3"><label className="block text-xs font-medium text-gray-700 mb-1">Método de pago</label><select value={paymentData.method} onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"><option value="cash">Efectivo</option><option value="transfer">Transferencia</option><option value="card">Tarjeta</option><option value="mercadopago">Mercado Pago</option></select></div>
                <div className="mt-3"><label className="block text-xs font-medium text-gray-700 mb-1">Notas (opcional)</label><textarea value={paymentData.notes} onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="Observaciones..." /></div>
              </div>
            </div>
            <div className="p-4 lg:p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setActiveModal("none")} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleAddPayment} disabled={actionLoading === "payment"} className="px-4 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-medium hover:bg-[#0F766E]/90 disabled:opacity-50 flex items-center gap-2">
                {actionLoading === "payment" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><DollarSign className="w-4 h-4" />Registrar pago</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: WhatsApp */}
      {activeModal === "whatsapp" && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">Enviar WhatsApp</h2>
                <p className="text-xs lg:text-sm text-gray-500 truncate">{selectedReservation.guest?.first_name} {selectedReservation.guest?.last_name} • {selectedReservation.guest?.phone || "Sin teléfono"}</p>
              </div>
              <button onClick={() => setActiveModal("none")} className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-4 lg:p-6 space-y-4">
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
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Mensaje (editable)</label><textarea value={whatsAppMessage} onChange={(e) => setWhatsAppMessage(e.target.value)} rows={8} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E] font-mono text-sm" /></div>
            </div>
            <div className="p-4 lg:p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setActiveModal("none")} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button onClick={sendWhatsApp} className="px-4 py-2 bg-[#25D366] text-white rounded-lg text-sm font-medium hover:bg-[#25D366]/90 flex items-center gap-2"><Send className="w-4 h-4" />Enviar por WhatsApp</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: QR */}
      {activeModal === "qr" && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-gray-900 truncate">Link de acceso</h3>
                <p className="text-sm text-gray-500 truncate">{selectedReservation.guest?.first_name} {selectedReservation.guest?.last_name}</p>
              </div>
              <button onClick={() => { setActiveModal("none"); setSelectedReservation(null); }} className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"><X className="w-6 h-6" /></button>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4 lg:p-6 mb-4 flex justify-center">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getGuestPanelUrl(selectedReservation))}`} alt="QR Code" className="w-40 h-40 lg:w-48 lg:h-48" />
            </div>
            <div className="bg-gray-50 rounded-lg p-3 lg:p-4 mb-4">
              <p className="text-xs text-gray-500 mb-1">URL de acceso</p>
              <p className="text-xs lg:text-sm text-gray-900 break-all font-mono">{getGuestPanelUrl(selectedReservation)}</p>
            </div>
            <div className="flex gap-3">
              <Link href={getGuestPanelUrl(selectedReservation)} target="_blank" className="flex-1 bg-[#0F766E] text-white py-2 px-3 lg:px-4 rounded-lg font-medium text-center hover:bg-[#0F766E]/90 transition-colors flex items-center justify-center gap-2 text-xs lg:text-sm">
                <ExternalLink className="w-4 h-4" />Abrir
              </Link>
              <button onClick={() => { navigator.clipboard.writeText(getGuestPanelUrl(selectedReservation)); alert("Link copiado"); }} className="flex-1 border border-gray-300 text-gray-700 py-2 px-3 lg:px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-xs lg:text-sm">
                <Copy className="w-4 h-4" />Copiar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Editar */}
      {activeModal === "edit" && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">Editar reserva {selectedReservation.reservation_code}</h2>
              <button onClick={() => { setActiveModal("none"); setSelectedReservation(null); }} className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-4 lg:p-6 space-y-4">
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
            <div className="p-4 lg:p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => { setActiveModal("none"); setSelectedReservation(null); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleUpdateReservation} disabled={actionLoading === "update"} className="px-4 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-medium hover:bg-[#0F766E]/90 disabled:opacity-50 flex items-center gap-2">
                {actionLoading === "update" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Check-out */}
      {activeModal === "checkout" && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 lg:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <LogOut className="w-6 h-6 text-orange-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-gray-900 truncate">Confirmar check-out</h3>
                <p className="text-sm text-gray-500 truncate">{selectedReservation.guest?.first_name} {selectedReservation.guest?.last_name}</p>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 lg:p-4 mb-4">
              <div className="grid grid-cols-2 gap-3 text-xs lg:text-sm">
                <div><p className="text-orange-600 text-[10px] lg:text-xs">Unidad</p><p className="font-semibold text-orange-900 truncate">{selectedReservation.unit?.name || "—"}</p></div>
                <div><p className="text-orange-600 text-[10px] lg:text-xs">Check-out</p><p className="font-semibold text-orange-900">{new Date(selectedReservation.check_out).toLocaleDateString("es-AR")}</p></div>
              </div>
            </div>
            <p className="text-gray-600 mb-6 text-sm">¿Confirmás el check-out de este huésped?</p>
            <div className="flex gap-3">
              <button onClick={() => setActiveModal("none")} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleCheckOut} disabled={actionLoading === "checkout"} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {actionLoading === "checkout" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogOut className="w-4 h-4" />Confirmar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Eliminar */}
      {activeModal === "delete" && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 lg:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-gray-900 truncate">Eliminar reserva</h3>
                <p className="text-sm text-gray-500 truncate">{selectedReservation.reservation_code}</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6 text-sm">¿Eliminar la reserva de <strong>{selectedReservation.guest?.first_name} {selectedReservation.guest?.last_name}</strong>? Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => { setActiveModal("none"); setSelectedReservation(null); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button onClick={() => handleDelete(selectedReservation)} disabled={actionLoading === `delete-${selectedReservation.id}`} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {actionLoading === `delete-${selectedReservation.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" />Eliminar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Nueva Reserva */}
      {activeModal === "add" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">Nueva reserva</h2>
              <button onClick={() => setActiveModal("none")} className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-4 lg:p-6">
              <div className="flex gap-2 mb-6">
                <button onClick={() => setAddMethod("manual")} className={`flex-1 py-3 px-2 lg:px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-xs lg:text-sm ${addMethod === "manual" ? "bg-[#0F766E] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}><Edit className="w-4 h-4" /><span className="hidden sm:inline">Manual</span></button>
                <button onClick={() => setAddMethod("csv")} className={`flex-1 py-3 px-2 lg:px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-xs lg:text-sm ${addMethod === "csv" ? "bg-[#0F766E] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}><Upload className="w-4 h-4" /><span className="hidden sm:inline">CSV</span></button>
                <button onClick={() => setAddMethod("text")} className={`flex-1 py-3 px-2 lg:px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-xs lg:text-sm ${addMethod === "text" ? "bg-[#0F766E] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}><MessageSquare className="w-4 h-4" /><span className="hidden sm:inline">Texto</span></button>
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
                    <div className="space-y-3 bg-gray-50 p-3 lg:p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label><input type="text" value={formData.new_guest_first_name} onChange={(e) => setFormData({ ...formData, new_guest_first_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Juan" /></div>
                        <div><label className="block text-xs font-medium text-gray-700 mb-1">Apellido</label><input type="text" value={formData.new_guest_last_name} onChange={(e) => setFormData({ ...formData, new_guest_last_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Pérez" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-medium text-gray-700 mb-1">Email</label><input type="email" value={formData.new_guest_email} onChange={(e) => setFormData({ ...formData, new_guest_email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="juan@email.com" /></div>
                        <div><label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label><input type="text" value={formData.new_guest_phone} onChange={(e) => setFormData({ ...formData, new_guest_phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="01131923742" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-medium text-gray-700 mb-1">Nacionalidad</label><input type="text" value={formData.new_guest_nationality} onChange={(e) => setFormData({ ...formData, new_guest_nationality: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                        <div><label className="block text-xs font-medium text-gray-700 mb-1">Documento</label><input type="text" value={formData.new_guest_document} onChange={(e) => setFormData({ ...formData, new_guest_document: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="DNI/Pasaporte" /></div>
                      </div>
                    </div>
                  ) : (
                    <div><label className="block text-xs font-medium text-gray-700 mb-1">Huésped existente</label><select value={formData.guest_id} onChange={(e) => setFormData({ ...formData, guest_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="">Seleccionar huésped...</option>{guests.map((g) => (<option key={g.id} value={g.id}>{g.first_name} {g.last_name} ({g.email})</option>))}</select></div>
                  )}
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Unidad</label><select value={formData.unit_id} onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="">Seleccionar unidad...</option>{units.map((u) => (<option key={u.id} value={u.id}>{u.name} ({u.type} - {u.capacity} pers.)</option>))}</select></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-gray-700 mb-1">Check-in</label><input type="date" value={formData.check_in} onChange={(e) => setFormData({ ...formData, check_in: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-medium text-gray-700 mb-1">Check-out</label><input type="date" value={formData.check_out} onChange={(e) => setFormData({ ...formData, check_out: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-gray-700 mb-1">Monto total</label><input type="number" value={formData.total_amount} onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="0" /></div>
                    <div><label className="block text-xs font-medium text-gray-700 mb-1">Monto pagado</label><input type="number" value={formData.paid_amount} onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="0" /></div>
                  </div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Método de pago</label><select value={formData.payment_method} onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="cash">Efectivo</option><option value="transfer">Transferencia</option><option value="card">Tarjeta</option><option value="mercadopago">Mercado Pago</option></select></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Notas</label><textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Observaciones..." /></div>
                </div>
              )}
              {addMethod === "csv" && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 lg:p-4">
                    <p className="text-xs lg:text-sm text-blue-800"><strong>Formato CSV:</strong></p>
                    <p className="text-[10px] lg:text-xs text-blue-700 mt-1 font-mono break-all">first_name,last_name,email,phone,check_in,check_out,unit_name,total_amount</p>
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 lg:p-8 text-center">
                    <Upload className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-3">Arrastrá tu archivo CSV o hacé clic</p>
                    <input type="file" accept=".csv" className="hidden" id="csv-upload" />
                    <label htmlFor="csv-upload" className="inline-block px-4 py-2 bg-[#0F766E] text-white rounded-lg cursor-pointer hover:bg-[#0F766E]/90 text-sm">Seleccionar archivo</label>
                  </div>
                </div>
              )}
              {addMethod === "text" && (
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 lg:p-4">
                    <p className="text-xs lg:text-sm text-purple-800"><strong>Parser inteligente:</strong> Pegá un mensaje de WhatsApp o texto libre.</p>
                  </div>
                  <textarea rows={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Ej: Hola, quiero reservar para Juan Pérez..." />
                  <button className="w-full bg-[#0F766E] text-white py-3 rounded-lg font-medium hover:bg-[#0F766E]/90 flex items-center justify-center gap-2 text-sm"><MessageSquare className="w-4 h-4" />Analizar texto</button>
                </div>
              )}
            </div>
            {addMethod === "manual" && (
              <div className="p-4 lg:p-6 border-t border-gray-200 flex justify-end gap-3">
                <button onClick={() => setActiveModal("none")} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button onClick={handleCreateReservation} disabled={actionLoading === "create"} className="px-4 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-medium hover:bg-[#0F766E]/90 disabled:opacity-50 flex items-center gap-2">
                  {actionLoading === "create" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Crear
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}