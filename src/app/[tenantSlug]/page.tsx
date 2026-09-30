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
  Star,
  Package,
  ExternalLink,
  Navigation,
  Info,
  LogOut,
  ChevronDown,
  ChevronUp,
  History,
  DollarSign,
  Send,
  UserCheck,
  Edit3,
  X,
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
  description?: string;
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
  notes?: string;
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

interface Payment {
  id: string;
  amount: number;
  method: string;
  date: string;
  notes?: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  price?: number;
  is_requestable: boolean;
}

interface DestinationPlace {
  id: string;
  name: string;
  description?: string;
  category?: string;
  is_favorite: boolean;
  google_maps_url?: string;
  address?: string;
  phone?: string;
  website?: string;
  hours?: string;
  tips?: string;
  image_url?: string;
  contact_info?: any;
}

interface WeatherData {
  date: string;
  temp_max: number;
  temp_min: number;
  condition: string;
  icon: string;
}

type SectionKey = "precheckin" | "arrival" | "guide" | "services" | "checkout" | "emergency" | "contact";

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
  const [payments, setPayments] = useState<Payment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [destinationPlaces, setDestinationPlaces] = useState<DestinationPlace[]>([]);
  const [weather, setWeather] = useState<WeatherData[]>([]);
  const [weatherLocation, setWeatherLocation] = useState("");
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showUnitDetails, setShowUnitDetails] = useState(false);
  const [expandedPlace, setExpandedPlace] = useState<string | null>(null);
  const [editingPreCheckin, setEditingPreCheckin] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    precheckin: true, // Pre check-in abierto por defecto
    arrival: false,
    guide: false,
    services: false,
    checkout: false,
    emergency: false,
    contact: false,
  });
  const supabase = createClient();

  const [formData, setFormData] = useState({
    document_number: "",
    vehicle_plate: "",
    emergency_contact: "",
    special_requests: "",
  });

  const toggleSection = (key: SectionKey) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
          .select("id, name, type, capacity, description")
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

        // Cargar datos del pre-checkin si ya existe
        if (reservationData.notes) {
          try {
            const preCheckinData = JSON.parse(reservationData.notes);
            setFormData({
              document_number: preCheckinData.document_number || "",
              vehicle_plate: preCheckinData.vehicle_plate || "",
              emergency_contact: preCheckinData.emergency_contact || "",
              special_requests: preCheckinData.special_requests || "",
            });
          } catch (e) {
            // Si no es JSON válido, usar como texto libre
            setFormData({
              document_number: "",
              vehicle_plate: "",
              emergency_contact: "",
              special_requests: reservationData.notes || "",
            });
          }
        }

        const { data: paymentsData } = await supabase
          .from("payments")
          .select("id, amount, method, date, notes")
          .eq("reservation_id", reservationData.id)
          .order("date", { ascending: false });
        setPayments(paymentsData || []);

        const { data: servicesData } = await supabase
          .from("services")
          .select("id, name, description, price, is_requestable")
          .eq("tenant_id", tenantData.id);
        setServices(servicesData || []);

        const { data: placesData } = await supabase
          .from("destination_places")
          .select("id, name, description, category, is_favorite, google_maps_url, address, phone, website, hours, tips, image_url, contact_info")
          .eq("tenant_id", tenantData.id)
          .order("sort_order", { ascending: true });
        setDestinationPlaces(placesData || []);

        // Clima real con Open-Meteo
        const settings = tenantData.settings || {};
        const lat = settings.latitude || -34.6037;
        const lon = settings.longitude || -58.3816;

        let locationName = "Tu destino";
        if (settings.googleMapsUrl) {
          try {
            const url = new URL(settings.googleMapsUrl);
            const pathParts = url.pathname.split("/");
            const placeIndex = pathParts.findIndex((p) => p === "place");
            if (placeIndex !== -1 && pathParts[placeIndex + 1]) {
              locationName = decodeURIComponent(pathParts[placeIndex + 1].replace(/\+/g, " "));
            }
          } catch (e) {
            locationName = tenantData.name;
          }
        }
        setWeatherLocation(locationName);

        const checkIn = new Date(reservationData.check_in);
        const checkOut = new Date(reservationData.check_out);
        const startDate = checkIn.toISOString().split("T")[0];
        const endDate = checkOut.toISOString().split("T")[0];

        try {
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&start_date=${startDate}&end_date=${endDate}`
          );
          const weatherData = await weatherRes.json();

          if (weatherData.daily) {
            const weatherIcons: Record<number, string> = {
              0: "️", 1: "🌤️", 2: "⛅", 3: "☁️",
              45: "️", 48: "🌫️", 51: "🌦️", 53: "🌦️", 55: "🌧️",
              61: "🌧️", 63: "🌧️", 65: "️", 71: "🌨️", 73: "🌨️", 75: "❄️",
              80: "🌦️", 81: "🌧️", 82: "️", 95: "⛈️", 96: "⛈️", 99: "⛈️",
            };
            const weatherConditions: Record<number, string> = {
              0: "Despejado", 1: "Mayormente despejado", 2: "Parcialmente nublado", 3: "Nublado",
              45: "Niebla", 48: "Niebla con escarcha", 51: "Llovizna leve", 53: "Llovizna moderada", 55: "Llovizna intensa",
              61: "Lluvia leve", 63: "Lluvia moderada", 65: "Lluvia intensa", 71: "Nevada leve", 73: "Nevada moderada", 75: "Nevada intensa",
              80: "Chubascos leves", 81: "Chubascos moderados", 82: "Chubascos violentos", 95: "Tormenta", 96: "Tormenta con granizo", 99: "Tormenta con granizo intenso",
            };

            const days: WeatherData[] = weatherData.daily.time.map((date: string, i: number) => ({
              date,
              temp_max: Math.round(weatherData.daily.temperature_2m_max[i]),
              temp_min: Math.round(weatherData.daily.temperature_2m_min[i]),
              condition: weatherConditions[weatherData.daily.weathercode[i]] || "Desconocido",
              icon: weatherIcons[weatherData.daily.weathercode[i]] || "🌡️",
            }));
            setWeather(days);
          }
        } catch (e) {
          console.error("Error cargando clima:", e);
        }
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
      const preCheckinData = {
        document_number: formData.document_number,
        vehicle_plate: formData.vehicle_plate,
        emergency_contact: formData.emergency_contact,
        special_requests: formData.special_requests,
        completed_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("reservations")
        .update({
          status: "pre_checkin",
          notes: JSON.stringify(preCheckinData),
        })
        .eq("id", reservation.id);

      if (error) throw error;

      // Actualizar estado local
      setReservation({ ...reservation, status: "pre_checkin", notes: JSON.stringify(preCheckinData) });
      setEditingPreCheckin(false);
      alert("Pre check-in guardado correctamente. ✓");
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

  const settings = tenant.settings || {};
  const totalAmount = reservation.total_amount || 0;
  const paidAmount = reservation.paid_amount || 0;
  const pendingAmount = Math.max(0, totalAmount - paidAmount);
  const paymentPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  const isFullyPaid = pendingAmount === 0;

  const checkInDate = new Date(reservation.check_in);
  const checkOutDate = new Date(reservation.check_out);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const checkInDateOnly = new Date(reservation.check_in);
  checkInDateOnly.setHours(0, 0, 0, 0);
  const checkOutDateOnly = new Date(reservation.check_out);
  checkOutDateOnly.setHours(0, 0, 0, 0);

  const daysUntilCheckIn = Math.ceil((checkInDateOnly.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilCheckOut = Math.ceil((checkOutDateOnly.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const isCheckInToday = daysUntilCheckIn === 0;
  const isCheckOutToday = daysUntilCheckOut === 0;

  // Verificar si el pre-checkin ya está completado
  const isPreCheckinDone = reservation.status === "pre_checkin" || reservation.status === "checked_in" || reservation.status === "checked_out";

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash": return "Efectivo";
      case "transfer": return "Transferencia";
      case "card": return "Tarjeta";
      case "mercadopago": return "Mercado Pago";
      default: return method || "—";
    }
  };

  const whatsappBaseMessage = `Hola ${tenant.name}! Soy ${reservation.guest?.first_name} ${reservation.guest?.last_name} (código ${reservation.reservation_code}).`;

  const getServiceWhatsAppMessage = (service: Service) => {
    return `${whatsappBaseMessage}\n\nMe interesa el servicio: *${service.name}*${service.description ? `\n${service.description}` : ""}${service.price ? `\nPrecio: $${service.price.toLocaleString("es-AR")}` : ""}\n\n¿Está disponible durante mi estadía?`;
  };

  const getMapsEmbedUrl = () => {
    const lat = settings.latitude;
    const lon = settings.longitude;
    if (lat && lon) {
      return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${lon}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${lat},${lon}!5e0!3m2!1ses!2sar!4v1`;
    }
    return null;
  };

  const mapsEmbedUrl = getMapsEmbedUrl();

  const SectionHeader = ({ title, icon: Icon, gradient, sectionKey, badge }: { title: string; icon: any; gradient: string; sectionKey: SectionKey; badge?: React.ReactNode }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className={`w-full ${gradient} px-4 py-3 flex items-center justify-between text-left`}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-white" />
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {badge}
      </div>
      {expandedSections[sectionKey] ? (
        <ChevronUp className="w-5 h-5 text-white" />
      ) : (
        <ChevronDown className="w-5 h-5 text-white" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
<header className="bg-gradient-to-r from-[#0F766E] to-[#166534] text-white py-6 px-4">
  <div className="max-w-4xl mx-auto">
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
      {/* Logo del alojamiento */}
      {(() => {
        try {
          const branding = typeof tenant.branding === 'string' ? JSON.parse(tenant.branding) : tenant.branding;
          const logoUrl = branding?.logoUrl;
          if (logoUrl) {
            return (
              <div className="mb-3 flex justify-center">
                <img
                  src={logoUrl}
                  alt={tenant.name}
                  className="h-16 w-auto rounded-lg bg-white/10 p-2"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            );
          }
        } catch (e) {}
        return null;
      })()}
      <h1 className="text-2xl font-bold mb-1">¡Hola, {reservation.guest?.first_name || "huésped"}!</h1>
      <p className="text-white/90 text-sm">{tenant.name} • {reservation.unit?.name || "—"}</p>
      <p className="text-white/70 text-xs mt-1">Código: {reservation.reservation_code}</p>
    </motion.div>
  </div>
</header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* ===== PRE CHECK-IN - SECCIÓN PRINCIPAL ===== */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <SectionHeader
            title="Pre Check-in"
            icon={UserCheck}
            gradient="bg-gradient-to-r from-[#EA580C] to-[#C2410C]"
            sectionKey="precheckin"
            badge={isPreCheckinDone && (
              <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Completado
              </span>
            )}
          />
          {expandedSections.precheckin && (
            <div className="p-4">
              {isPreCheckinDone && !editingPreCheckin ? (
                // Vista de éxito - Pre check-in ya completado
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-green-900">¡Pre check-in completado con éxito!</p>
                      <p className="text-sm text-green-700 mt-1">Tus datos fueron registrados correctamente. Te esperamos en tu check-in.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Documento</p>
                      <p className="text-sm font-semibold text-gray-900">{formData.document_number || "—"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Patente del vehículo</p>
                      <p className="text-sm font-semibold text-gray-900">{formData.vehicle_plate || "—"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Contacto de emergencia</p>
                      <p className="text-sm font-semibold text-gray-900">{formData.emergency_contact || "—"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Solicitudes especiales</p>
                      <p className="text-sm font-semibold text-gray-900">{formData.special_requests || "—"}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setEditingPreCheckin(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Editar datos
                  </button>
                </div>
              ) : (
                // Formulario de pre check-in
                <div className="space-y-4">
                  {!isPreCheckinDone && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
                      <Info className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-orange-800">Completá tus datos antes de llegar para agilizar tu check-in.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
                      <input
                        type="text"
                        value={reservation.guest?.first_name || ""}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Apellido</label>
                      <input
                        type="text"
                        value={reservation.guest?.last_name || ""}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={reservation.guest?.email || ""}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                      type="tel"
                      value={reservation.guest?.phone || ""}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Documento (DNI/Pasaporte) *</label>
                    <input
                      type="text"
                      value={formData.document_number}
                      onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                      placeholder="Número de documento"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EA580C] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Patente del vehículo (opcional)</label>
                    <input
                      type="text"
                      value={formData.vehicle_plate}
                      onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value })}
                      placeholder="ABC123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EA580C] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Contacto de emergencia *</label>
                    <input
                      type="text"
                      value={formData.emergency_contact}
                      onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                      placeholder="Nombre y teléfono"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EA580C] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Solicitudes especiales (opcional)</label>
                    <textarea
                      value={formData.special_requests}
                      onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                      rows={3}
                      placeholder="Alergias, necesidades especiales, hora estimada de llegada, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EA580C] text-sm"
                    />
                  </div>

                  <div className="flex gap-3">
                    {editingPreCheckin && (
                      <button
                        onClick={() => setEditingPreCheckin(false)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Cancelar
                      </button>
                    )}
                    <button
                      onClick={handleSavePreCheckin}
                      disabled={saving || !formData.document_number || !formData.emergency_contact}
                      className="flex-1 bg-[#EA580C] text-white py-2 rounded-lg font-medium hover:bg-[#C2410C] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          {isPreCheckinDone ? "Actualizar datos" : "Completar pre check-in"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* ===== PAGO ===== */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#0F766E] to-[#166534] px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white">Estado de Pago</h2>
              </div>
              {payments.length > 0 && (
                <button onClick={() => setShowPaymentHistory(!showPaymentHistory)} className="text-white text-xs flex items-center gap-1 hover:underline">
                  <History className="w-3 h-3" />
                  {showPaymentHistory ? "Ocultar" : "Ver historial"} ({payments.length})
                </button>
              )}
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

            {showPaymentHistory && payments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">Historial de pagos</p>
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div key={payment.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-gray-900">${payment.amount.toLocaleString("es-AR")}</p>
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">{getPaymentMethodLabel(payment.method)}</span>
                      </div>
                      <p className="text-xs text-gray-500">{new Date(payment.date).toLocaleDateString("es-AR", { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      {payment.notes && <p className="text-xs text-gray-600 mt-1 italic">"{payment.notes}"</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ===== CLIMA ===== */}
        {weather.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#00B4D8] to-[#0077B6] px-4 py-3">
              <div className="flex items-center gap-2">
                <CloudSun className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white">Clima en {weatherLocation}</h2>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {weather.map((day, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">
                      {new Date(day.date).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}
                    </p>
                    <p className="text-3xl mb-1">{day.icon}</p>
                    <p className="text-sm font-bold text-gray-900">{day.temp_max}° / {day.temp_min}°</p>
                    <p className="text-xs text-gray-600">{day.condition}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== ESTADÍA ===== */}
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
                <p className="text-sm font-bold text-gray-900">
                  {checkInDate.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}
                </p>
                {isCheckInToday ? (
                  <p className="text-xs text-[#0F766E] mt-1 font-bold"> HOY</p>
                ) : daysUntilCheckIn > 0 ? (
                  <p className="text-xs text-[#0F766E] mt-1">En {daysUntilCheckIn} {daysUntilCheckIn === 1 ? "día" : "días"}</p>
                ) : null}
                <p className="text-xs text-gray-500 mt-1">Desde las {settings.checkInTime || "15:00"}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-[#EA580C]" />
                  <span className="text-xs text-gray-600">Check-out</span>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {checkOutDate.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}
                </p>
                {isCheckOutToday ? (
                  <p className="text-xs text-[#EA580C] mt-1 font-bold">📍 HOY</p>
                ) : daysUntilCheckOut > 0 && daysUntilCheckOut <= 3 ? (
                  <p className="text-xs text-[#EA580C] mt-1">En {daysUntilCheckOut} {daysUntilCheckOut === 1 ? "día" : "días"}</p>
                ) : null}
                <p className="text-xs text-gray-500 mt-1">Hasta las {settings.checkOutTime || "10:00"}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-[#0F766E]" />
                  <span className="text-xs text-gray-600">Unidad</span>
                </div>
                {reservation.unit?.description && (
                  <button onClick={() => setShowUnitDetails(!showUnitDetails)} className="text-xs text-[#0F766E] flex items-center gap-1 hover:underline">
                    {showUnitDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {showUnitDetails ? "Ocultar detalles" : "Ver detalles"}
                  </button>
                )}
              </div>
              <p className="text-sm font-bold text-gray-900">{reservation.unit?.name || "—"}</p>
              {reservation.unit && (
                <p className="text-xs text-gray-500 mt-1">{reservation.unit.type} • {reservation.unit.capacity} personas</p>
              )}
              {showUnitDetails && reservation.unit?.description && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-700 whitespace-pre-line">{reservation.unit.description}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ===== WIFI ===== */}
        {settings.wifiNetworks && settings.wifiNetworks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#6366F1] to-[#4F46E5] px-4 py-3">
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white">Conexión Wi-Fi</h2>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {settings.wifiNetworks.map((network: any, index: number) => (
                  <div key={network.id || index} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Red {settings.wifiNetworks.length > 1 ? `${index + 1}` : ""}</p>
                    <p className="text-sm font-bold text-gray-900">{network.ssid}</p>
                    <p className="text-xs text-gray-500 mt-1">Contraseña: <span className="font-semibold text-gray-700">{network.password}</span></p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== MAPA ===== */}
        {mapsEmbedUrl && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#EF4444] to-[#DC2626] px-4 py-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white">Ubicación</h2>
              </div>
            </div>
            <div className="p-4">
              {settings.address && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-gray-500 mb-1">Dirección</p>
                  <p className="text-sm font-bold text-gray-900">{settings.address}</p>
                </div>
              )}
              <div className="rounded-lg overflow-hidden border border-gray-200 mb-3">
                <iframe src={mapsEmbedUrl} width="100%" height="250" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Mapa de ubicación" />
              </div>
              {settings.googleMapsUrl && (
                <a href={settings.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-[#EF4444] text-white py-2 rounded-lg font-medium hover:bg-[#DC2626] transition-colors flex items-center justify-center gap-2 text-sm">
                  <Navigation className="w-4 h-4" />
                  Abrir en Google Maps
                </a>
              )}
            </div>
          </motion.div>
        )}

        {/* ===== INSTRUCCIONES DE LLEGADA ===== */}
        {settings.arrivalInstructions?.enabled && settings.arrivalInstructions?.steps && settings.arrivalInstructions.steps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <SectionHeader title="Instrucciones de Llegada" icon={Info} gradient="bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED]" sectionKey="arrival" />
            {expandedSections.arrival && (
              <div className="p-4">
                <div className="space-y-3 text-sm text-gray-700">
                  {settings.arrivalInstructions.steps.map((step: any, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-6 h-6 bg-[#8B5CF6] text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                        {step.order || index + 1}
                      </div>
                      <p>{step.text}</p>
                    </div>
                  ))}
                </div>
                {settings.arrivalInstructions.parkingInfo && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Estacionamiento</p>
                    <p className="text-sm text-gray-700">{settings.arrivalInstructions.parkingInfo}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ===== GUÍA DEL DESTINO ===== */}
        {destinationPlaces.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <SectionHeader title="Guía del Destino" icon={Compass} gradient="bg-gradient-to-r from-[#F59E0B] to-[#D97706]" sectionKey="guide" />
            {expandedSections.guide && (
              <div className="p-4">
                <div className="space-y-3">
                  {destinationPlaces.map((place) => {
                    const isExpanded = expandedPlace === place.id;
                    const hasExtraInfo = place.address || place.phone || place.hours || place.website || place.tips || place.image_url || place.google_maps_url || (place.contact_info && Object.keys(place.contact_info).length > 0);
                    return (
                      <div key={place.id} className={`rounded-lg border ${place.is_favorite ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-gray-200"}`}>
                        <div className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                {place.name}
                                {place.is_favorite && <Star className="w-3 h-3 text-yellow-600 fill-yellow-600" />}
                              </p>
                              {place.category && <p className="text-xs text-gray-500">{place.category}</p>}
                              {place.description && <p className="text-xs text-gray-600 mt-1">{place.description}</p>}
                            </div>
                            {hasExtraInfo && (
                              <button onClick={() => setExpandedPlace(isExpanded ? null : place.id)} className="text-xs text-[#F59E0B] flex items-center gap-1 hover:underline ml-2 flex-shrink-0">
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                {isExpanded ? "Menos" : "Más info"}
                              </button>
                            )}
                          </div>
                        </div>
                        {isExpanded && hasExtraInfo && (
                          <div className="px-3 pb-3 border-t border-gray-200 pt-3 space-y-2">
                            {place.image_url && (
                              <div className="rounded-lg overflow-hidden">
                                <img src={place.image_url} alt={place.name} className="w-full h-40 object-cover" />
                              </div>
                            )}
                            {place.address && (
                              <div className="flex items-start gap-2">
                                <MapPin className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-gray-700">{place.address}</p>
                              </div>
                            )}
                            {place.hours && (
                              <div className="flex items-start gap-2">
                                <Clock className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-gray-700">{place.hours}</p>
                              </div>
                            )}
                            {place.phone && (
                              <div className="flex items-start gap-2">
                                <Phone className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                                <a href={`tel:${place.phone}`} className="text-xs text-[#F59E0B] hover:underline">{place.phone}</a>
                              </div>
                            )}
                            {place.website && (
                              <div className="flex items-start gap-2">
                                <ExternalLink className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                                <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-xs text-[#F59E0B] hover:underline">{place.website}</a>
                              </div>
                            )}
                            {place.tips && (
                              <div className="bg-white rounded-lg p-2 border border-gray-200">
                                <p className="text-xs font-semibold text-gray-700 mb-1">💡 Tips</p>
                                <p className="text-xs text-gray-600">{place.tips}</p>
                              </div>
                            )}
                            {place.contact_info && typeof place.contact_info === "object" && Object.keys(place.contact_info).length > 0 && (
                              <div className="bg-white rounded-lg p-2 border border-gray-200">
                                <p className="text-xs font-semibold text-gray-700 mb-1">ℹ️ Información</p>
                                {Object.entries(place.contact_info).map(([key, value]) => (
                                  <p key={key} className="text-xs text-gray-600"><span className="font-medium capitalize">{key}:</span> {String(value)}</p>
                                ))}
                              </div>
                            )}
                            {place.google_maps_url && (
                              <a href={place.google_maps_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#F59E0B] hover:underline">
                                <Navigation className="w-3 h-3" />
                                Ver en Google Maps
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ===== SERVICIOS ADICIONALES ===== */}
        {services.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <SectionHeader title="Servicios Adicionales" icon={Package} gradient="bg-gradient-to-r from-[#10B981] to-[#059669]" sectionKey="services" />
            {expandedSections.services && (
              <div className="p-4">
                <div className="space-y-2">
                  {services.map((service) => (
                    <div key={service.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{service.name}</p>
                          {service.description && <p className="text-xs text-gray-500 mt-1">{service.description}</p>}
                        </div>
                        {service.price && <p className="text-sm font-bold text-[#0F766E] ml-2">${service.price.toLocaleString("es-AR")}</p>}
                      </div>
                      {service.is_requestable && (
                        <a
                          href={`https://wa.me/${settings.whatsappNumber || "5491131923742"}?text=${encodeURIComponent(getServiceWhatsAppMessage(service))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#25D366] text-white text-xs font-medium rounded-lg hover:bg-[#128C7E] transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          Solicitar por WhatsApp
                        </a>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">Consultá disponibilidad con el anfitrión</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ===== CHECK-OUT ===== */}
        {settings.checkoutInstructions?.enabled && settings.checkoutInstructions?.steps && settings.checkoutInstructions.steps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <SectionHeader title="Check-out" icon={LogOut} gradient="bg-gradient-to-r from-[#64748B] to-[#475569]" sectionKey="checkout" />
            {expandedSections.checkout && (
              <div className="p-4">
                <div className="space-y-3 text-sm text-gray-700">
                  {settings.checkoutInstructions.steps.map((step: any, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#64748B] mt-0.5 flex-shrink-0" />
                      <p>{step.text}</p>
                    </div>
                  ))}
                </div>
                {settings.checkoutInstructions.keyReturnLocation && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Devolución de llaves</p>
                    <p className="text-sm text-gray-700">{settings.checkoutInstructions.keyReturnLocation}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ===== CONTACTOS DE EMERGENCIA ===== */}
        {settings.emergencyContacts && settings.emergencyContacts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <SectionHeader title="Contactos de Emergencia" icon={AlertCircle} gradient="bg-gradient-to-r from-[#DC2626] to-[#B91C1C]" sectionKey="emergency" />
            {expandedSections.emergency && (
              <div className="p-4">
                <div className="space-y-3">
                  {settings.emergencyContacts.map((contact: any, index: number) => (
                    <div key={contact.id || index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm font-bold text-gray-900">{contact.name}</p>
                      {contact.role && <p className="text-xs text-gray-500">{contact.role}</p>}
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="text-xs text-red-600 hover:underline mt-1 block">
                          <Phone className="w-3 h-3 inline mr-1" />
                          {contact.phone}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ===== CONTACTO ===== */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <SectionHeader title="Contacto" icon={MessageCircle} gradient="bg-gradient-to-r from-[#25D366] to-[#128C7E]" sectionKey="contact" />
          {expandedSections.contact && (
            <div className="p-4">
              {settings.whatsappNumber && (
                <a
                  href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(whatsappBaseMessage + " Necesito ayuda.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] text-white py-2 rounded-lg font-medium hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Contactar anfitrión por WhatsApp
                </a>
              )}
              <div className="mt-3 space-y-2 text-sm">
                {settings.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{settings.phone}</span>
                  </div>
                )}
                {settings.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MessageCircle className="w-4 h-4" />
                    <span>{settings.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>

        <div className="text-center py-6 text-xs text-gray-500">
          <p>Gestionado con Mi Estadía</p>
          <p className="mt-1">{tenant.name}</p>
        </div>
      </div>
    </div>
  );
}