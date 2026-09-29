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
  Globe,
  Clock4,
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

        // Cargar pagos
        const { data: paymentsData } = await supabase
          .from("payments")
          .select("id, amount, method, date, notes")
          .eq("reservation_id", reservationData.id)
          .order("date", { ascending: false });
        setPayments(paymentsData || []);

        // Cargar servicios
        const { data: servicesData } = await supabase
          .from("services")
          .select("id, name, description, price, is_requestable")
          .eq("tenant_id", tenantData.id);
        setServices(servicesData || []);

        // Cargar lugares del destino
        const { data: placesData } = await supabase
          .from("destination_places")
          .select("*")
          .eq("tenant_id", tenantData.id)
          .order("sort_order", { ascending: true });
        setDestinationPlaces(placesData || []);

        // Cargar clima real usando Open-Meteo
        const settings = tenantData.settings || {};
        const lat = settings.latitude || -34.6037;
        const lon = settings.longitude || -58.3816;
        
        let locationName = "Tu destino";
        if (settings.googleMapsUrl) {
          try {
            const url = new URL(settings.googleMapsUrl);
            const pathParts = url.pathname.split("/");
            const placeIndex = pathParts.findIndex(p => p === "place");
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
              45: "🌫️", 48: "️", 51: "🌦️", 53: "🌦️", 55: "🌧️",
              61: "🌧️", 63: "🌧️", 65: "🌧️", 71: "️", 73: "🌨️", 75: "❄️",
              80: "🌦️", 81: "🌧️", 82: "🌧️", 95: "️", 96: "⛈️", 99: "⛈️",
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
      const { error } = await supabase
        .from("reservations")
        .update({ status: "pre_checkin", notes: formData.special_requests })
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

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash": return "Efectivo";
      case "transfer": return "Transferencia";
      case "card": return "Tarjeta";
      case "mercadopago": return "Mercado Pago";
      default: return method || "—";
    }
  };

  const whatsappMessage = `Hola ${tenant.name}! Soy ${reservation.guest?.first_name} ${reservation.guest?.last_name} (código ${reservation.reservation_code}). Necesito ayuda.`;

  const getMapsEmbedUrl = () => {
    const lat = settings.latitude;
    const lon = settings.longitude;
    if (lat && lon) {
      return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${lon}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${lat},${lon}!5e0!3m2!1ses!2sar!4v1`;
    }
    return null;
  };

  const mapsEmbedUrl = getMapsEmbedUrl();

  return (
    <div className="min-h-screen bg-gray-50">
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
        {/* TARJETA DE PAGO */}
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

        {/* TARJETA DE CLIMA */}
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

        {/* TARJETA DE WIFI */}
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

        {/* TARJETA DE UBICACIÓN Y MAPA */}
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
                <iframe
                  src={mapsEmbedUrl}
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mapa de ubicación"
                />
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

        {/* INSTRUCCIONES DE LLEGADA */}
        {settings.arrivalInstructions?.enabled && settings.arrivalInstructions?.steps && settings.arrivalInstructions.steps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] px-4 py-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white">Instrucciones de Llegada</h2>
              </div>
            </div>
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
          </motion.div>
        )}

        {/* GUÍA DEL DESTINO - Desplegable */}
        {destinationPlaces.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] px-4 py-3">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white">Guía del Destino</h2>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {destinationPlaces.map((place) => {
                  const isExpanded = expandedPlace === place.id;
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
                          {(place.address || place.phone || place.hours || place.website || place.tips || place.image_url || place.google_maps_url) && (
                            <button onClick={() => setExpandedPlace(isExpanded ? null : place.id)} className="text-xs text-[#F59E0B] flex items-center gap-1 hover:underline ml-2 flex-shrink-0">
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {isExpanded ? "Menos" : "Más info"}
                            </button>
                          )}
                        </div>
                      </div>
                      {isExpanded && (
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
                              <Clock4 className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
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
                              <Globe className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
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
          </motion.div>
        )}

        {/* SERVICIOS ADICIONALES */}
        {services.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#10B981] to-[#059669] px-4 py-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white">Servicios Adicionales</h2>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {services.map((service) => (
                  <div key={service.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{service.name}</p>
                      {service.description && <p className="text-xs text-gray-500">{service.description}</p>}
                    </div>
                    {service.price && <p className="text-sm font-bold text-[#0F766E]">${service.price.toLocaleString("es-AR")}</p>}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">Consultá disponibilidad con el anfitrión</p>
            </div>
          </motion.div>
        )}

        {/* INSTRUCCIONES DE CHECKOUT */}
        {settings.checkoutInstructions?.enabled && settings.checkoutInstructions?.steps && settings.checkoutInstructions.steps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#64748B] to-[#475569] px-4 py-3">
              <div className="flex items-center gap-2">
                <LogOut className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white">Check-out</h2>
              </div>
            </div>
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
          </motion.div>
        )}

        {/* CONTACTOS DE EMERGENCIA */}
        {settings.emergencyContacts && settings.emergencyContacts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#DC2626] to-[#B91C1C] px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white">Contactos de Emergencia</h2>
              </div>
            </div>
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
          </motion.div>
        )}

        {/* TARJETA DE CONTACTO */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">Contacto</h2>
            </div>
          </div>
          <div className="p-4">
            {settings.whatsappNumber && (
              <a href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noopener noreferrer" className="w-full bg-[#25D366] text-white py-2 rounded-lg font-medium hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-2 text-sm">
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
        </motion.div>

        <div className="text-center py-6 text-xs text-gray-500">
          <p>Gestionado con Mi Estadía</p>
          <p className="mt-1">{tenant.name}</p>
        </div>
      </div>
    </div>
  );
}