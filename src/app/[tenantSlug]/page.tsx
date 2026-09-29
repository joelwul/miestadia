"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Wifi,
  MapPin,
  CloudSun,
  MessageCircle,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Save,
  Phone,
} from "lucide-react";
import { getGuestPanelUrl, formatWhatsAppMessage } from "@/lib/config";

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
  pre_checkin_completed: boolean;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  branding: any;
  settings: any;
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

  // Estado del formulario de pre-checkin
  const [formData, setFormData] = useState({
    guest_name: "",
    guest_last_name: "",
    guest_email: "",
    guest_phone: "",
    document_number: "",
    vehicle_plate: "",
    emergency_contact: "",
    special_requests: "",
  });

  const supabase = createClient();

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
          .select("*")
          .eq("slug", tenantSlug)
          .single();

        if (tenantError || !tenantData) {
          setError("Alojamiento no encontrado.");
          setLoading(false);
          return;
        }

        setTenant(tenantData);

        const { data: reservationData, error: reservationError } = await supabase
          .from("reservations")
          .select("*")
          .eq("code", code)
          .eq("tenant_id", tenantData.id)
          .single();

        if (reservationError || !reservationData) {
          setError("Reserva no encontrada. Verificá el código.");
          setLoading(false);
          return;
        }

        if (lastNameParam && reservationData.guest_last_name) {
          if (
            reservationData.guest_last_name.toLowerCase() !==
            lastNameParam.toLowerCase()
          ) {
            setError("El apellido no coincide con la reserva.");
            setLoading(false);
            return;
          }
        }

        setReservation(reservationData);
        setFormData({
          guest_name: reservationData.guest_name || "",
          guest_last_name: reservationData.guest_last_name || "",
          guest_email: reservationData.guest_email || "",
          guest_phone: reservationData.guest_phone || "",
          document_number: reservationData.document_number || "",
          vehicle_plate: reservationData.vehicle_plate || "",
          emergency_contact: reservationData.emergency_contact || "",
          special_requests: reservationData.special_requests || "",
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
          guest_name: formData.guest_name,
          guest_last_name: formData.guest_last_name,
          guest_email: formData.guest_email,
          guest_phone: formData.guest_phone,
          document_number: formData.document_number,
          vehicle_plate: formData.vehicle_plate,
          emergency_contact: formData.emergency_contact,
          special_requests: formData.special_requests,
          pre_checkin_completed: true,
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

  // Calcular datos de pago
  const totalAmount = reservation.total_amount || 0;
  const paidAmount = reservation.paid_amount || 0;
  const pendingAmount = Math.max(0, totalAmount - paidAmount);
  const paymentPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  const isFullyPaid = pendingAmount === 0;

  // Calcular días
  const checkInDate = new Date(reservation.check_in);
  const checkOutDate = new Date(reservation.check_out);
  const now = new Date();
  const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilCheckOut = Math.ceil((checkOutDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const isBeforeCheckIn = daysUntilCheckIn > 0;
  const isDuringStay = daysUntilCheckIn <= 0 && daysUntilCheckOut > 0;
  const isAfterCheckOut = daysUntilCheckOut <= 0;

  // URL del panel del huésped (con dominio correcto)
  const guestPanelUrl = getGuestPanelUrl(tenantSlug, reservation.code, reservation.guest_last_name);

  // Mensaje de WhatsApp firmado
  const whatsappMessage = formatWhatsAppMessage(
    tenant.name,
    `Hola ${tenant.name}! Soy ${reservation.guest_name} ${reservation.guest_last_name} (código ${reservation.code}). Necesito ayuda.`
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0F766E] to-[#166534] text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl font-bold mb-2">¡Hola, {reservation.guest_name}!</h1>
            <p className="text-white/90 text-lg">{tenant.name} • {reservation.unit_name}</p>
            <p className="text-white/70 text-sm mt-2">Código: {reservation.code}</p>
          </motion.div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* TARJETA DE PAGO - Principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
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
                <p className="text-2xl font-bold text-gray-900">
                  ${totalAmount.toLocaleString("es-AR")}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pagado</p>
                <p className="text-2xl font-bold text-green-600">
                  ${paidAmount.toLocaleString("es-AR")}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pendiente</p>
                <p className={`text-2xl font-bold ${isFullyPaid ? "text-green-600" : "text-orange-600"}`}>
                  ${pendingAmount.toLocaleString("es-AR")}
                </p>
              </div>
            </div>

            {/* Barra de progreso visual */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progreso de pago</span>
                <span className="font-semibold">{paymentPercentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${paymentPercentage}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className={`h-full rounded-full ${
                    isFullyPaid
                      ? "bg-gradient-to-r from-green-500 to-green-600"
                      : paymentPercentage > 50
                      ? "bg-gradient-to-r from-[#0F766E] to-[#166534]"
                      : "bg-gradient-to-r from-orange-500 to-orange-600"
                  }`}
                />
              </div>
            </div>

            {isFullyPaid ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800 font-medium">
                  ¡Pago completo! No tenés saldo pendiente.
                </p>
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                <p className="text-sm text-orange-800 font-medium">
                  Tenés ${pendingAmount.toLocaleString("es-AR")} pendiente de pago.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* TARJETA DE PRE-CHECKIN - Editable y funcional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-[#EA580C] to-[#C2410C] px-6 py-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">
                Pre Check-in {reservation.pre_checkin_completed && "✓ Completado"}
              </h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={formData.guest_name}
                    onChange={(e) => handleInputChange("guest_name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                  <input
                    type="text"
                    value={formData.guest_last_name}
                    onChange={(e) => handleInputChange("guest_last_name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.guest_email}
                  onChange={(e) => handleInputChange("guest_email", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={formData.guest_phone}
                  onChange={(e) => handleInputChange("guest_phone", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documento (DNI/Pasaporte)</label>
                <input
                  type="text"
                  value={formData.document_number}
                  onChange={(e) => handleInputChange("document_number", e.target.value)}
                  placeholder="Número de documento"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patente del vehículo (opcional)</label>
                <input
                  type="text"
                  value={formData.vehicle_plate}
                  onChange={(e) => handleInputChange("vehicle_plate", e.target.value)}
                  placeholder="ABC123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contacto de emergencia</label>
                <input
                  type="text"
                  value={formData.emergency_contact}
                  onChange={(e) => handleInputChange("emergency_contact", e.target.value)}
                  placeholder="Nombre y teléfono"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Solicitudes especiales</label>
                <textarea
                  value={formData.special_requests}
                  onChange={(e) => handleInputChange("special_requests", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSavePreCheckin}
                  disabled={saving}
                  className="flex-1 bg-[#0F766E] text-white py-3 rounded-lg font-semibold hover:bg-[#0F766E]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {reservation.pre_checkin_completed ? "Actualizar" : "Completar pre check-in"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* TARJETA DE ESTADÍA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
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
                  <p className="text-lg font-bold text-gray-900">
                    {checkInDate.toLocaleDateString("es-AR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  {isBeforeCheckIn && (
                    <p className="text-sm text-[#0F766E] mt-1">
                      En {daysUntilCheckIn} {daysUntilCheckIn === 1 ? "día" : "días"}
                    </p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-[#EA580C]" />
                    <span className="text-sm text-gray-600">Check-out</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {checkOutDate.toLocaleDateString("es-AR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-5 h-5 text-[#0F766E]" />
                  <span className="text-sm text-gray-600">Unidad</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{reservation.unit_name}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* TARJETA DE CONTACTO - WhatsApp con firma */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] px-6 py-4">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">Contacto</h2>
            </div>
          </div>
          <div className="p-6">
            <a
              href={`https://wa.me/5491131923742?text=${encodeURIComponent(whatsappMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] text-white py-3 rounded-lg font-semibold hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Contactar anfitrión por WhatsApp
            </a>
            <p className="text-xs text-center text-gray-500 mt-3">
              El mensaje incluirá tu nombre, código de reserva y el nombre del alojamiento.
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center py-8 text-sm text-gray-500">
          <p>Gestionado con {PLATFORM_NAME}</p>
          <p className="mt-1">{tenant.name}</p>
        </div>
      </div>
    </div>
  );
}