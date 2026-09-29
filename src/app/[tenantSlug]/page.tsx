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
  CloudSun,
  Wifi,
  MapPin,
  Compass,
  ShoppingBag,
  UtensilsCrossed,
  Star,
  Package,
  ExternalLink,
  Navigation,
  Info,
  LogOut,
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
  settings: any;
  branding: any;
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
  const [weather, setWeather] = useState<any>(null);
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
          .select("id, name, slug, settings, branding")
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
          .eq("reservation_code", code)
          .eq("tenant_id", tenantData.id)
          .single();

        if (reservationError || !reservationData) {
          setError("Reserva no encontrada. Verificá el código.");
          setLoading(false);
          return;
        }

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

        if (lastNameParam && enriched.guest?.last_name) {
          if (enriched.guest.last_name.toLowerCase() !== lastNameParam.toLowerCase()) {
            setError("El apellido no coincide con la reserva.");
            setLoading(false);
            return;
          }
        }

        setReservation(enriched);

        // Simular clima (en producción usarías una API real)
        setWeather({
          temp: 24,
          condition: "Parcialmente nublado",
          icon: "⛅",
          location: "Villa Carlos Paz",
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
  const daysUntilCheckOut = Math.ceil((checkOutDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const guestPanelUrl = `https://miestadia.online/${tenantSlug}?code=${reservation.reservation_code}&lastName=${encodeURIComponent(reservation.guest?.last_name || "")}`;
  const whatsappMessage = `Hola ${tenant.name}! Soy ${reservation.guest?.first_name} ${reservation.guest?.last_name} (código ${reservation.reservation_code}). Necesito ayuda.`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header compacto */}
      <header className="bg-gradient-to-r from-[#0F766E] to-[#166534] text-white py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="text-2xl font-bold mb-1">¡Hola, {reservation.guest?.first_name || "huésped"}!</h1>
            <p className="text-white/90 text-sm">{tenant.name} • {reservation.unit?.name || "—"}</p>
            <p className="text-white/70 text-xs mt-1">Código: {reservation.reservation_code}</p>
          </motion.div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* TARJETA DE PAGO - Compacta */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#0F766E] to-[#166534] px-4 py-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">Estado de Pago</h2>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase">Total</p>
                <p className="text-lg font-bold text-gray-900">${totalAmount.toLocaleString("es-AR")}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase">Pagado</p>
                <p className="text-lg font-bold text-green-600">${paidAmount.toLocaleString("es-AR")}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase">Pendiente</p>
                <p className={`text-lg font-bold ${isFullyPaid ? "text-green-600" : "text-orange-600"}`}>${pendingAmount.toLocaleString("es-AR")}</p>
              </div>
            </div>
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progreso</span>
                <span className="font-semibold">{paymentPercentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${paymentPercentage}%` }} transition={{ duration: 1 }} className={`h-full rounded-full ${isFullyPaid ? "bg-green-500" : paymentPercentage > 50 ? "bg-[#0F766E]" : "bg-orange-500"}`} />
              </div>
            </div>
            {isFullyPaid ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-xs text-green-800 font-medium">¡Pago completo!</p>
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <p className="text-xs text-orange-800 font-medium">Tenés ${pendingAmount.toLocaleString("es-AR")} pendiente</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* TARJETA DE CLIMA */}
        {weather && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#00B4D8] to-[#0077B6] px-4 py-3">
              <div className="flex items-center gap-2">
                <CloudSun className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white">Clima en {weather.location}</h2>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold text-gray-900">{weather.icon} {weather.temp}°C</p>
                  <p className="text-sm text-gray-600">{weather.condition}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Durante tu estadía</p>
                  <p className="text-sm font-medium text-gray-700">{checkInDate.toLocaleDateString("es-AR")} - {checkOutDate.toLocaleDateString("es-AR")}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TARJETA DE ESTADÍA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#166534] to-[#0F766E] px-4 py-3">
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">Tu Estadía</h2>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-[#0F766E]" />
                  <span className="text-xs text-gray-600">Check-in</span>
                </div>
                <p className="text-sm font-bold text-gray-900">{checkInDate.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}</p>
                {daysUntilCheckIn > 0 && <p className="text-xs text-[#0F766E] mt-1">En {daysUntilCheckIn} {daysUntilCheckIn === 1 ? "día" : "días"}</p>}
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-[#EA580C]" />
                  <span className="text-xs text-gray-600">Check-out</span>
                </div>
                <p className="text-sm font-bold text-gray-900">{checkOutDate.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}</p>
                {daysUntilCheckOut > 0 && daysUntilCheckOut <= 3 && <p className="text-xs text-[#EA580C] mt-1">En {daysUntilCheckOut} {daysUntilCheckOut === 1 ? "día" : "días"}</p>}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Home className="w-4 h-4 text-[#0F766E]" />
                <span className="text-xs text-gray-600">Unidad</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{reservation.unit?.name || "—"}</p>
            </div>
          </div>
        </motion.div>

        {/* TARJETA DE WIFI */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#6366F1] to-[#4F46E5] px-4 py-3">
            <div className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">Conexión Wi-Fi</h2>
            </div>
          </div>
          <div className="p-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Red</p>
              <p className="text-sm font-bold text-gray-900">{tenant.name.replace(/\s+/g, "_")}_Guest</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 mt-2">
              <p className="text-xs text-gray-500 mb-1">Contraseña</p>
              <p className="text-sm font-bold text-gray-900">bienvenidos2024</p>
            </div>
          </div>
        </motion.div>

        {/* TARJETA DE UBICACIÓN Y MAPA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#EF4444] to-[#DC2626] px-4 py-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">Ubicación</h2>
            </div>
          </div>
          <div className="p-4">
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-500 mb-1">Dirección</p>
              <p className="text-sm font-bold text-gray-900">Av. San Martín 1234, Villa Carlos Paz, Córdoba</p>
            </div>
            <div className="rounded-lg overflow-hidden border border-gray-200">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3348.123456789!2d-64.498123456789!3d-31.423456789012!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzHCsDI1JzI0LjQiUyA2NMKwMjknNTMuMiJX!5e0!3m2!1ses!2sar!4v1234567890123!5m2!1ses!2sar"
                width="100%"
                height="200"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a href="https://maps.google.com/?q=Villa+Carlos+Paz" target="_blank" rel="noopener noreferrer" className="mt-3 w-full bg-[#EF4444] text-white py-2 rounded-lg font-medium hover:bg-[#DC2626] transition-colors flex items-center justify-center gap-2 text-sm">
              <Navigation className="w-4 h-4" />
              Abrir en Google Maps
            </a>
          </div>
        </motion.div>

        {/* TARJETA DE GUÍA DEL DESTINO */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] px-4 py-3">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">Guía del Destino</h2>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <UtensilsCrossed className="w-4 h-4 text-[#F59E0B]" />
                  <span className="text-xs font-medium text-gray-700">Restaurantes cercanos</span>
                </div>
                <p className="text-sm text-gray-600">La Parrilla de Carlos, El Buen Sabor, Pizzería Don Luigi</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingBag className="w-4 h-4 text-[#F59E0B]" />
                  <span className="text-xs font-medium text-gray-700">Supermercados</span>
                </div>
                <p className="text-sm text-gray-600">Carrefour (500m), Día (300m)</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-[#F59E0B]" />
                  <span className="text-xs font-medium text-gray-700">Atracciones</span>
                </div>
                <p className="text-sm text-gray-600">Dique San Roque, Cuesta Blanca, Parque Ecoaventura</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* TARJETA DE INSTRUCCIONES DE LLEGADA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] px-4 py-3">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">Instrucciones de Llegada</h2>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-[#8B5CF6] text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
                <p>Desde la ruta E-55, tomar la salida hacia Villa Carlos Paz centro.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-[#8B5CF6] text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
                <p>Continuar por Av. San Martín durante 2 km.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-[#8B5CF6] text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
                <p>El alojamiento está sobre la derecha, frente a la plaza principal.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-[#8B5CF6] text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">4</div>
                <p>Check-in a partir de las 14:00 hs. Si llegás antes, dejá tu equipaje en recepción.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* TARJETA DE PRE-CHECKIN */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#EA580C] to-[#C2410C] px-4 py-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">Pre Check-in {reservation.status === "pre_checkin" && "✓"}</h2>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
                  <input type="text" value={reservation.guest?.first_name || ""} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Apellido</label>
                  <input type="text" value={reservation.guest?.last_name || ""} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={reservation.guest?.email || ""} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
                <input type="tel" value={reservation.guest?.phone || ""} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Documento (DNI/Pasaporte)</label>
                <input type="text" value={formData.document_number} onChange={(e) => setFormData({ ...formData, document_number: e.target.value })} placeholder="Número de documento" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E] text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Patente del vehículo (opcional)</label>
                <input type="text" value={formData.vehicle_plate} onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value })} placeholder="ABC123" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E] text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Contacto de emergencia</label>
                <input type="text" value={formData.emergency_contact} onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })} placeholder="Nombre y teléfono" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E] text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Solicitudes especiales</label>
                <textarea value={formData.special_requests} onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E] text-sm" />
              </div>
              <button onClick={handleSavePreCheckin} disabled={saving} className="w-full bg-[#0F766E] text-white py-2 rounded-lg font-medium hover:bg-[#0F766E]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" />{reservation.status === "pre_checkin" ? "Actualizar" : "Completar pre check-in"}</>}
              </button>
            </div>
          </div>
        </motion.div>

        {/* TARJETA DE SERVICIOS ADICIONALES */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#10B981] to-[#059669] px-4 py-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">Servicios Adicionales</h2>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Desayuno completo</p>
                  <p className="text-xs text-gray-500">Por persona, por día</p>
                </div>
                <p className="text-sm font-bold text-[#0F766E]">$5.000</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Late check-out</p>
                  <p className="text-xs text-gray-500">Hasta las 14:00 hs</p>
                </div>
                <p className="text-sm font-bold text-[#0F766E]">$15.000</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Traslado aeropuerto</p>
                  <p className="text-xs text-gray-500">Ida y vuelta</p>
                </div>
                <p className="text-sm font-bold text-[#0F766E]">$25.000</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">Consultá disponibilidad con el anfitrión</p>
          </div>
        </motion.div>

        {/* TARJETA DE CHECKOUT */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#64748B] to-[#475569] px-4 py-3">
            <div className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">Check-out</h2>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#64748B] mt-0.5 flex-shrink-0" />
                <p>Check-out hasta las <strong>10:00 hs</strong></p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#64748B] mt-0.5 flex-shrink-0" />
                <p>Dejá las llaves en recepción o dentro de la unidad</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#64748B] mt-0.5 flex-shrink-0" />
                <p>Verificá no olvidar pertenencias personales</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#64748B] mt-0.5 flex-shrink-0" />
                <p>Apagá luces y aire acondicionado al salir</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* TARJETA DE CONTACTO */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">Contacto</h2>
            </div>
          </div>
          <div className="p-4">
            <a href={`https://wa.me/5491131923742?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noopener noreferrer" className="w-full bg-[#25D366] text-white py-2 rounded-lg font-medium hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-2 text-sm">
              <MessageCircle className="w-4 h-4" />
              Contactar anfitrión por WhatsApp
            </a>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>+54 9 11 3192-3742</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MessageCircle className="w-4 h-4" />
                <span>Respuesta en menos de 1 hora</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center py-6 text-xs text-gray-500">
          <p>Gestionado con Mi Estadía</p>
          <p className="mt-1">{tenant.name}</p>
        </div>
      </div>
    </div>
  );
}