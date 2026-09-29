"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  MessageCircle,
  Calendar,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  Phone,
  Clock,
} from "lucide-react";

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
  reservation_code: string;
  guest_id: string;
  unit_id: string;
  check_in: string;
  check_out: string;
  status: string;
  total_amount: number;
  paid_amount: number;
  payment_status: string;
  guest?: Guest;
  unit?: Unit;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export default function GuestPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tenantSlug = params.tenantSlug as string;
  const code = searchParams.get("code") || "";
  const lastNameParam = searchParams.get("lastName") || "";

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    document_number: "",
    vehicle_plate: "",
    emergency_contact: "",
    special_requests: "",
  });

  useEffect(() => {
    async function loadData() {
      if (!code) {
        setError("No se proporcionó un código de reserva.");
        setLoading(false);
        return;
      }

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

        // IMPORTANTE: Buscar por reservation_code (no por "code")
        const { data: reservationData, error: reservationError } = await supabase
          .from("reservations")
          .select("*")
          .eq("reservation_code", code)
          .eq("tenant_id", tenantData.id)
          .single();

        if (reservationError || !reservationData) {
          setError("Reserva no encontrada. Verificá el código.");
          setLoading(false);
          return;
        }

        // Cargar datos del huésped y unidad
        const { data: guestData } = await supabase
          .from("guests")
          .select("id, first_name, last_name, email, phone")
          .eq("id", reservationData.guest_id)
          .single();

        const { data: unitData } = await supabase
          .from("units")
          .select("id, name, type, capacity")
          .eq("id", reservationData.unit_id)
          .single();

        const enriched: Reservation = {
          ...reservationData,
          guest: guestData || undefined,
          unit: unitData || undefined,
        };

        // Validar apellido si viene en la URL
        if (lastNameParam && enriched.guest?.last_name) {
          if (enriched.guest.last_name.toLowerCase() !== lastNameParam.toLowerCase()) {
            setError("El apellido no coincide con la reserva.");
            setLoading(false);
            return;
          }
        }

        setReservation(enriched);
        setFormData({
          document_number: "",
          vehicle_plate: "",
          emergency_contact: "",
          special_requests: "",
        });
      } catch (err: any) {
        setError("Error al cargar los datos: " + err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [tenantSlug, code, lastNameParam]);

  const handleSavePreCheckin = async () => {
    if (!reservation) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("reservations")
        .update({
          status: "pre_checkin",
          notes: formData.special_requests,
        })
        .eq("id", reservation.id);

      if (error) throw error;
      alert("Pre check-in guardado correctamente.");
    } catch (err: any) {
      alert("Error al guardar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F766E] to-[#166534] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F766E] to-[#166534] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!reservation || !tenant) return null;

  const totalAmount = reservation.total_amount || 0;
  const paidAmount = reservation.paid_amount || 0;
  const pendingAmount = Math.max(0, totalAmount - paidAmount);
  const paymentPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  const isFullyPaid = pendingAmount === 0;

  const checkInDate = new Date(reservation.check_in);
  const checkOutDate = new Date(reservation.check_out);
  const now = new Date();
  const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const guestPanelUrl = `https://miestadia.online/${tenantSlug}?code=${reservation.reservation_code}&lastName=${encodeURIComponent(reservation.guest?.last_name || "")}`;
  const whatsappMessage = `Hola ${tenant.name}! Soy ${reservation.guest?.first_name} ${reservation.guest?.last_name} (código ${reservation.reservation_code}). Necesito ayuda.`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-[#0F766E] to-[#166534] text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="text-3xl font-bold mb-2">¡Hola, {reservation.guest?.first_name || "huésped"}!</h1>
            <p className="text-white/90 text-lg">{tenant.name} • {reservation.unit?.name || "—"}</p>
            <p className="text-white/70 text-sm mt-2">Código: {reservation.reservation_code}</p>
          </motion.div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* TARJETA DE PAGO */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#0F766E] to-[#166534] px-6 py-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">Estado de Pago</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-900">${totalAmount.toLocaleString("es-AR")}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pagado</p>
                <p className="text-2xl font-bold text-green-600">${paidAmount.toLocaleString("es-AR")}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pendiente</p>
                <p className={`text-2xl font-bold ${isFullyPaid ? "text-green-600" : "text-orange-600"}`}>${pendingAmount.toLocaleString("es-AR")}</p>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progreso de pago</span>
                <span className="font-semibold">{paymentPercentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${paymentPercentage}%` }} transition={{ duration: 1, delay: 0.3 }} className={`h-full rounded-full ${isFullyPaid ? "bg-gradient-to-r from-green-500 to-green-600" : paymentPercentage > 50 ? "bg-gradient-to-r from-[#0F766E] to-[#166534]" : "bg-gradient-to-r from-orange-500 to-orange-600"}`} />
              </div>
            </div>
            {isFullyPaid ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800 font-medium">¡Pago completo! No tenés saldo pendiente.</p>
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                <p className="text-sm text-orange-800 font-medium">Tenés ${pendingAmount.toLocaleString("es-AR")} pendiente de pago.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* TARJETA DE PRE-CHECKIN */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#EA580C] to-[#C2410C] px-6 py-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">Pre Check-in {reservation.status === "pre_checkin" && "✓ Completado"}</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input type="text" value={reservation.guest?.first_name || ""} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                  <input type="text" value={reservation.guest?.last_name || ""} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={reservation.guest?.email || ""} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input type="tel" value={reservation.guest?.phone || ""} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documento (DNI/Pasaporte)</label>
                <input type="text" value={formData.document_number} onChange={(e) => setFormData({ ...formData, document_number: e.target.value })} placeholder="Número de documento" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patente del vehículo (opcional)</label>
                <input type="text" value={formData.vehicle_plate} onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value })} placeholder="ABC123" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contacto de emergencia</label>
                <input type="text" value={formData.emergency_contact} onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })} placeholder="Nombre y teléfono" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Solicitudes especiales</label>
                <textarea value={formData.special_requests} onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" />
              </div>
              <button onClick={handleSavePreCheckin} disabled={saving} className="w-full bg-[#0F766E] text-white py-3 rounded-lg font-semibold hover:bg-[#0F766E]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" />{reservation.status === "pre_checkin" ? "Actualizar" : "Completar pre check-in"}</>}
              </button>
            </div>
          </div>
        </motion.div>

        {/* TARJETA DE ESTADÍA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#166534] to-[#0F766E] px-6 py-4">
            <div className="flex items-center gap-3">
              <Home className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">Tu Estadía</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-[#0F766E]" />
                    <span className="text-sm text-gray-600">Check-in</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{checkInDate.toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                  {daysUntilCheckIn > 0 && <p className="text-sm text-[#0F766E] mt-1">En {daysUntilCheckIn} {daysUntilCheckIn === 1 ? "día" : "días"}</p>}
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-[#EA580C]" />
                    <span className="text-sm text-gray-600">Check-out</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{checkOutDate.toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-5 h-5 text-[#0F766E]" />
                  <span className="text-sm text-gray-600">Unidad</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{reservation.unit?.name || "—"}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* TARJETA DE CONTACTO */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] px-6 py-4">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">Contacto</h2>
            </div>
          </div>
          <div className="p-6">
            <a href={`https://wa.me/5491131923742?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noopener noreferrer" className="w-full bg-[#25D366] text-white py-3 rounded-lg font-semibold hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Contactar anfitrión por WhatsApp
            </a>
          </div>
        </motion.div>

        <div className="text-center py-8 text-sm text-gray-500">
          <p>Gestionado con Mi Estadía</p>
          <p className="mt-1">{tenant.name}</p>
        </div>
      </div>
    </div>
  );
}