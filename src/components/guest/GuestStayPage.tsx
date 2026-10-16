"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Wifi,
  MessageCircle,
  FileText,
  CheckCircle,
  ClipboardList,
  AlertCircle,
  Package,
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Home,
  Car,
  Key,
  Navigation,
  ChevronDown,
  ChevronUp,
  LogOut,
  Utensils,
  TreePalm,
  Landmark,
  ShoppingBag,
  Coffee,
  Waves,
  ExternalLink,
  DollarSign,
  CreditCard,
  TrendingUp,
  Star,
  Phone,
  Globe,
  Clock,
  Users,
  Calendar,
  Hash,
} from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ tenantSlug: string }>;
}

interface WeatherDay {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
}

interface LocationInfo {
  city: string;
  region: string;
  country: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  restaurant: { label: "Restaurante", icon: Utensils, color: "text-orange-700", bgColor: "bg-orange-100" },
  activity: { label: "Actividad", icon: TreePalm, color: "text-green-700", bgColor: "bg-green-100" },
  landmark: { label: "Punto de interés", icon: Landmark, color: "text-purple-700", bgColor: "bg-purple-100" },
  shopping: { label: "Compras", icon: ShoppingBag, color: "text-pink-700", bgColor: "bg-pink-100" },
  cafe: { label: "Café / Bar", icon: Coffee, color: "text-amber-700", bgColor: "bg-amber-100" },
  beach: { label: "Playa / Naturaleza", icon: Waves, color: "text-cyan-700", bgColor: "bg-cyan-100" },
};

function getWeatherInfo(code: number): { emoji: string; icon: any; description: string; color: string } {
  const weatherMap: Record<number, { emoji: string; icon: any; description: string; color: string }> = {
    0: { emoji: "☀️", icon: Sun, description: "Despejado", color: "text-yellow-500" },
    1: { emoji: "🌤️", icon: Sun, description: "Mayormente despejado", color: "text-yellow-400" },
    2: { emoji: "⛅", icon: Cloud, description: "Parcialmente nublado", color: "text-gray-400" },
    3: { emoji: "☁️", icon: Cloud, description: "Nublado", color: "text-gray-500" },
    45: { emoji: "🌫️", icon: Cloud, description: "Niebla", color: "text-gray-400" },
    48: { emoji: "🌫️", icon: Cloud, description: "Niebla con escarcha", color: "text-gray-400" },
    51: { emoji: "️", icon: CloudRain, description: "Llovizna ligera", color: "text-blue-400" },
    53: { emoji: "🌦️", icon: CloudRain, description: "Llovizna moderada", color: "text-blue-400" },
    55: { emoji: "🌧️", icon: CloudRain, description: "Llovizna densa", color: "text-blue-500" },
    56: { emoji: "🌧️", icon: CloudRain, description: "Llovizna helada", color: "text-blue-600" },
    57: { emoji: "🌧️", icon: CloudRain, description: "Llovizna helada densa", color: "text-blue-600" },
    61: { emoji: "🌧️", icon: CloudRain, description: "Lluvia ligera", color: "text-blue-500" },
    63: { emoji: "🌧️", icon: CloudRain, description: "Lluvia moderada", color: "text-blue-600" },
    65: { emoji: "️", icon: CloudRain, description: "Lluvia intensa", color: "text-blue-700" },
    66: { emoji: "🌧️", icon: CloudRain, description: "Lluvia helada", color: "text-blue-700" },
    67: { emoji: "🌧️", icon: CloudRain, description: "Lluvia helada intensa", color: "text-blue-700" },
    71: { emoji: "🌨️", icon: CloudSnow, description: "Nevada ligera", color: "text-blue-300" },
    73: { emoji: "🌨️", icon: CloudSnow, description: "Nevada moderada", color: "text-blue-400" },
    75: { emoji: "❄️", icon: CloudSnow, description: "Nevada intensa", color: "text-blue-500" },
    77: { emoji: "❄️", icon: CloudSnow, description: "Granizo", color: "text-blue-400" },
    80: { emoji: "🌦️", icon: CloudRain, description: "Chubascos ligeros", color: "text-blue-400" },
    81: { emoji: "️", icon: CloudRain, description: "Chubascos moderados", color: "text-blue-500" },
    82: { emoji: "🌧️", icon: CloudRain, description: "Chubascos violentos", color: "text-blue-600" },
    85: { emoji: "🌨️", icon: CloudSnow, description: "Chubascos de nieve", color: "text-blue-300" },
    86: { emoji: "❄️", icon: CloudSnow, description: "Chubascos de nieve intensos", color: "text-blue-400" },
    95: { emoji: "⛈️", icon: CloudLightning, description: "Tormenta", color: "text-purple-600" },
    96: { emoji: "⛈️", icon: CloudLightning, description: "Tormenta con granizo", color: "text-purple-700" },
    99: { emoji: "⛈️", icon: CloudLightning, description: "Tormenta con granizo intenso", color: "text-purple-800" },
  };
  return weatherMap[code] || { emoji: "🌡️", icon: Wind, description: "Desconocido", color: "text-gray-500" };
}

function getGoogleMapsEmbedUrl(mapsUrl: string): string | null {
  if (!mapsUrl) return null;
  if (mapsUrl.includes("/embed")) return mapsUrl;
  const patterns = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
  ];
  for (const pattern of patterns) {
    const match = mapsUrl.match(pattern);
    if (match) {
      const lat = match[1];
      const lng = match[2];
      return `https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&center=${lat},${lng}&zoom=15`;
    }
  }
  if (mapsUrl.includes("/maps/place/")) {
    const encodedUrl = encodeURIComponent(mapsUrl);
    return `https://maps.google.com/maps?q=${encodedUrl}&output=embed`;
  }
  return null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

// Componente de pestaña de color reutilizable
function ColorTab({ 
  color, 
  icon: Icon, 
  title, 
  subtitle, 
  children, 
  defaultOpen = false 
}: { 
  color: "green" | "orange" | "red" | "purple" | "blue" | "yellow" | "emerald";
  icon: any;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const colorConfig = {
    green: { bg: "bg-green-600", light: "bg-green-50", border: "border-green-200", text: "text-green-900", icon: "text-green-700" },
    orange: { bg: "bg-orange-600", light: "bg-orange-50", border: "border-orange-200", text: "text-orange-900", icon: "text-orange-700" },
    red: { bg: "bg-red-600", light: "bg-red-50", border: "border-red-200", text: "text-red-900", icon: "text-red-700" },
    purple: { bg: "bg-purple-600", light: "bg-purple-50", border: "border-purple-200", text: "text-purple-900", icon: "text-purple-700" },
    blue: { bg: "bg-blue-600", light: "bg-blue-50", border: "border-blue-200", text: "text-blue-900", icon: "text-blue-700" },
    yellow: { bg: "bg-yellow-600", light: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-900", icon: "text-yellow-700" },
    emerald: { bg: "bg-emerald-600", light: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900", icon: "text-emerald-700" },
  };

  const config = colorConfig[color];

  return (
    <div className={`rounded-2xl overflow-hidden shadow-lg border ${config.border} bg-white`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full ${config.bg} text-white p-5 flex items-center justify-between hover:opacity-95 transition-opacity`}
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Icon className="h-6 w-6" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-lg">{title}</h3>
            {subtitle && <p className="text-sm text-white/90 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5" />
        ) : (
          <ChevronDown className="h-5 w-5" />
        )}
      </button>
      {isOpen && <div className="p-6">{children}</div>}
    </div>
  );
}

export default function GuestStayPage({ params }: Props) {
  const [tenantSlug, setTenantSlug] = useState("");
  const [reservation, setReservation] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [preCheckinCompleted, setPreCheckinCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unitInventory, setUnitInventory] = useState<any[]>([]);
  const [groupedInventory, setGroupedInventory] = useState<Record<string, any[]>>({});
  const [weatherData, setWeatherData] = useState<WeatherDay[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherMessage, setWeatherMessage] = useState("");
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [destinationPlaces, setDestinationPlaces] = useState<any[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params;
      setTenantSlug(resolvedParams.tenantSlug);
      
      let sessionStr = sessionStorage.getItem("guest_session");
      if (!sessionStr) {
        sessionStr = localStorage.getItem("guest_session");
      }
      
      if (!sessionStr) {
        setError("No hay sesión activa.");
        setLoading(false);
        return;
      }
      
      try {
        const session = JSON.parse(sessionStr);
        if (session.expiresAt && Date.now() > session.expiresAt) {
          sessionStorage.removeItem("guest_session");
          localStorage.removeItem("guest_session");
          setError("La sesión expiró. Por favor, volvé a ingresar desde el link.");
          setLoading(false);
          return;
        }
        await loadStay(session.reservationId, resolvedParams.tenantSlug);
      } catch (e) {
        console.error("Error en init:", e);
        setError("Sesión inválida.");
        setLoading(false);
      }
    };
    init();
  }, [params]);

  async function getLocationName(lat: number, lng: number): Promise<LocationInfo | null> {
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`
      );
      if (!res.ok) return null;
      const data = await res.json();
      return {
        city: data.city || data.locality || data.localityInfo?.administrative?.[2]?.name || "",
        region: data.principalSubdivision || data.localityInfo?.administrative?.[1]?.name || "",
        country: data.countryName || "",
      };
    } catch {
      return null;
    }
  }

  async function loadWeather(lat: number, lng: number, startDate: string, endDate: string) {
    setWeatherLoading(true);
    setWeatherMessage("");
    setWeatherData([]);
    setLocationInfo(null);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split("T")[0];
      const maxDate = new Date(today);
      maxDate.setDate(today.getDate() + 16);
      const maxDateStr = maxDate.toISOString().split("T")[0];
      const startDateObj = new Date(startDate + "T00:00:00");
      const endDateObj = new Date(endDate + "T00:00:00");
      if (startDateObj < today) startDate = todayStr;
      if (startDate > maxDateStr) {
        setWeatherMessage(
          `El pronóstico estará disponible cuando se acerque la fecha de tu estadía (a partir del ${new Date(startDate).toLocaleDateString("es-AR")}).`
        );
        setWeatherLoading(false);
        return;
      }
      if (endDateObj > maxDate) endDate = maxDateStr;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America/Argentina/Buenos_Aires&start_date=${startDate}&end_date=${endDate}`;
      const response = await fetch(url);
      if (!response.ok) {
        setWeatherMessage("No se pudo cargar el pronóstico en este momento.");
        setWeatherLoading(false);
        return;
      }
      const data = await response.json();
      if (data.daily && data.daily.time && data.daily.time.length > 0) {
        const days: WeatherDay[] = data.daily.time.map((date: string, index: number) => ({
          date,
          weatherCode: data.daily.weathercode[index],
          tempMax: Math.round(data.daily.temperature_2m_max[index]),
          tempMin: Math.round(data.daily.temperature_2m_min[index]),
          precipitationProbability: data.daily.precipitation_probability_max[index] || 0,
        }));
        setWeatherData(days);
        if (endDate !== endDateObj.toISOString().split("T")[0]) {
          setWeatherMessage(
            `Pronóstico disponible hasta el ${new Date(endDate).toLocaleDateString("es-AR")}. El resto se actualizará más cerca de la fecha.`
          );
        }
      } else {
        setWeatherMessage("No hay datos de pronóstico disponibles para estas fechas.");
      }
      const loc = await getLocationName(lat, lng);
      if (loc) setLocationInfo(loc);
    } catch (err) {
      console.error("Error cargando clima:", err);
      setWeatherMessage("Error al cargar el pronóstico.");
    } finally {
      setWeatherLoading(false);
    }
  }

  async function loadStay(reservationId: string, slug: string) {
    const { data: res, error: resError } = await supabase
      .from("reservations")
      .select(`*, guests (first_name, last_name, email, phone), units (name, type, description, capacity)`)
      .eq("id", reservationId)
      .single();
    if (resError || !res) {
      setError("No se pudo cargar la reserva");
      setLoading(false);
      return;
    }
    setReservation(res);
    const { data: tenantData } = await supabase.from("tenants").select("*").eq("slug", slug).single();
    if (tenantData) {
      setTenant(tenantData);
      const settings = tenantData.settings || {};
      if (settings.latitude && settings.longitude) {
        const startDate = new Date(res.check_in).toISOString().split("T")[0];
        const endDate = new Date(res.check_out).toISOString().split("T")[0];
        await loadWeather(Number(settings.latitude), Number(settings.longitude), startDate, endDate);
      }
      const { data: placesData } = await supabase
        .from("destination_places")
        .select("*")
        .eq("tenant_id", tenantData.id)
        .order("order");
      if (placesData) setDestinationPlaces(placesData);
    }
    if (res.status === "booked") {
      await supabase.from("reservations").update({ status: "pre_checkin" }).eq("id", reservationId);
    }
    const { data: existingPreCheckin } = await supabase
      .from("pre_checkins")
      .select("id, status")
      .eq("reservation_id", reservationId)
      .eq("status", "completed")
      .maybeSingle();
    if (existingPreCheckin) setPreCheckinCompleted(true);
    if (res.unit_id) {
      const { data: inventoryData } = await supabase
        .from("unit_inventory_items")
        .select("*")
        .eq("unit_id", res.unit_id)
        .order("category")
        .order("order");
      if (inventoryData && inventoryData.length > 0) {
        setUnitInventory(inventoryData);
        const grouped: Record<string, any[]> = {};
        inventoryData.forEach((item) => {
          const categoryName =
            item.custom_category ||
            (item.category === "bedding"
              ? "Ropa de cama"
              : item.category === "kitchen"
              ? "Cocina"
              : item.category === "bathroom"
              ? "Baño"
              : item.category);
          if (!grouped[categoryName]) grouped[categoryName] = [];
          grouped[categoryName].push(item);
        });
        setGroupedInventory(grouped);
      }
    }
    setLoading(false);
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
  }

  function isToday(dateStr: string) {
    return dateStr === new Date().toISOString().split("T")[0];
  }

  function handlePreCheckinClick() {
    const code = reservation?.reservation_code;
    const lastName = reservation?.guests?.last_name || "";
    window.location.href = `/${tenantSlug}/pre-checkin?code=${code}&lastName=${encodeURIComponent(lastName)}`;
  }

  function handleLogout() {
    sessionStorage.removeItem("guest_session");
    localStorage.removeItem("guest_session");
    window.location.href = `/${tenantSlug}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-gray-600 font-medium">Cargando tu panel...</p>
        </div>
      </div>
    );
  }

  if (error || !reservation || !tenant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error || "No se encontró la reserva"}</p>
            <button
              onClick={() => {
                sessionStorage.removeItem("guest_session");
                localStorage.removeItem("guest_session");
                window.location.href = `/${tenantSlug}`;
              }}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Volver al inicio
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const settings = tenant.settings || {};
  const branding = tenant.branding || {};
  const checkInDate = new Date(reservation.check_in);
  const checkOutDate = new Date(reservation.check_out);
  const mapsEmbedUrl = getGoogleMapsEmbedUrl(settings.googleMapsUrl);
  const arrivalInstructions = settings.arrivalInstructions || null;
  const checkoutInstructions = settings.checkoutInstructions || null;
  const emergencyContacts = settings.emergencyContacts || [];
  const locationLabel = locationInfo
    ? [locationInfo.city, locationInfo.region, locationInfo.country].filter(Boolean).join(", ")
    : null;

  const totalAmount = reservation.total_amount || 0;
  const paidAmount = reservation.paid_amount || 0;
  const pendingAmount = Math.max(0, totalAmount - paidAmount);
  const paymentPercentage = totalAmount > 0 ? Math.min(100, (paidAmount / totalAmount) * 100) : 0;
  const paymentStatus = reservation.payment_status || "pending";

  const reviewLink = tenant.review_url || settings.googleMapsUrl;

  const statusColors: Record<string, string> = {
    pre_checkin: "bg-blue-500",
    checked_in: "bg-green-500",
    checked_out: "bg-gray-500",
    booked: "bg-purple-500",
  };

  const statusLabels: Record<string, string> = {
    pre_checkin: "Pre Check-in",
    checked_in: "Alojado",
    checked_out: "Check-out",
    booked: "Reservado",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* HEADER PREMIUM */}
      <header className="relative bg-gradient-to-br from-green-700 via-green-600 to-emerald-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 py-10 md:py-14">
          <div className="flex items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-5">
              {branding.logoUrl && (
                <img
                  src={branding.logoUrl}
                  alt="Logo"
                  className="h-20 w-auto bg-white rounded-2xl p-3 shadow-xl object-contain"
                />
              )}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">¡Hola, {reservation.guests?.first_name}! 👋</h1>
                <p className="text-green-100 text-lg mt-1">{tenant.name}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold text-white ${statusColors[reservation.status] || "bg-gray-500"}`}>
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    {statusLabels[reservation.status] || reservation.status}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur text-white rounded-xl transition-all text-sm font-medium border border-white/20"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>

          {/* CLIMA */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Clima durante tu estadía
              </h3>
              {locationLabel && (
                <span className="flex items-center gap-1.5 text-xs text-white/90 bg-white/10 px-3 py-1.5 rounded-full">
                  <MapPin className="h-3 w-3" />
                  {locationLabel}
                </span>
              )}
            </div>
            {weatherLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
              </div>
            ) : weatherData.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {weatherData.map((day, index) => {
                    const weatherInfo = getWeatherInfo(day.weatherCode);
                    const WeatherIcon = weatherInfo.icon;
                    return (
                      <div
                        key={index}
                        className={`rounded-xl p-3 text-center transition-all ${
                          isToday(day.date) 
                            ? "bg-white text-gray-900 shadow-lg scale-105" 
                            : "bg-white/10 text-white"
                        }`}
                      >
                        <p className={`text-xs font-semibold mb-2 ${isToday(day.date) ? "text-green-600" : "text-white/80"}`}>
                          {isToday(day.date) ? "Hoy" : formatDate(day.date)}
                        </p>
                        <div className="flex justify-center mb-2">
                          <WeatherIcon className={`h-8 w-8 ${isToday(day.date) ? weatherInfo.color : "text-white"}`} />
                        </div>
                        <p className={`text-xs mb-2 line-clamp-1 ${isToday(day.date) ? "text-gray-600" : "text-white/80"}`}>
                          {weatherInfo.description}
                        </p>
                        <div className="flex justify-center gap-2 text-sm font-bold">
                          <span className={isToday(day.date) ? "text-red-500" : "text-red-300"}>{day.tempMax}°</span>
                          <span className={isToday(day.date) ? "text-blue-500" : "text-blue-300"}>{day.tempMin}°</span>
                        </div>
                        {day.precipitationProbability > 0 && (
                          <p className={`text-xs mt-1.5 flex items-center justify-center gap-1 ${isToday(day.date) ? "text-blue-500" : "text-blue-300"}`}>
                            💧 {day.precipitationProbability}%
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
                {weatherMessage && (
                  <p className="text-xs text-yellow-200 mt-3 bg-yellow-500/20 border border-yellow-400/30 rounded-lg px-3 py-2">
                    {weatherMessage}
                  </p>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <Cloud className="h-12 w-12 mx-auto mb-3 text-white/40" />
                <p className="text-sm text-white/80">
                  {weatherMessage || "El pronóstico estará disponible cuando se acerque la fecha de tu estadía."}
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        
        {/* INFO DE RESERVA */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
              <Home className="h-4 w-4" />
              Unidad
            </div>
            <p className="font-bold text-gray-900 text-lg">{reservation.units?.name}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
              <Calendar className="h-4 w-4" />
              Check-in
            </div>
            <p className="font-bold text-gray-900">{checkInDate.toLocaleDateString("es-AR")}</p>
            <p className="text-sm text-gray-500">{settings.checkInTime || "15:00"}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
              <Calendar className="h-4 w-4" />
              Check-out
            </div>
            <p className="font-bold text-gray-900">{checkOutDate.toLocaleDateString("es-AR")}</p>
            <p className="text-sm text-gray-500">{settings.checkOutTime || "10:00"}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
              <Hash className="h-4 w-4" />
              Código
            </div>
            <p className="font-bold text-gray-900 font-mono text-lg">{reservation.reservation_code}</p>
          </div>
        </div>

        {/* PAGO */}
        {totalAmount > 0 && (
          <ColorTab color="emerald" icon={DollarSign} title="Estado de tu pago" subtitle="Seguimiento de tu reserva" defaultOpen={true}>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Progreso de pago</span>
                <span className="text-lg font-bold text-gray-900">{Math.round(paymentPercentage)}%</span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    paymentPercentage === 100
                      ? "bg-gradient-to-r from-green-400 to-green-600"
                      : paymentPercentage > 0
                      ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                      : "bg-gray-300"
                  }`}
                  style={{ width: `${paymentPercentage}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  <p className="text-xs text-gray-500 font-medium">Total</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-green-600 font-medium">Ya pagado</p>
                </div>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(paidAmount)}</p>
                {paidAmount > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {reservation.payment_method === "cash" && "💵 Efectivo"}
                    {reservation.payment_method === "transfer" && " Transferencia"}
                    {reservation.payment_method === "card" && "💳 Tarjeta"}
                    {reservation.payment_method === "mercadopago" && "📱 Mercado Pago"}
                  </p>
                )}
              </div>
              <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-xs text-red-600 font-medium">Pendiente</p>
                </div>
                <p className={`text-2xl font-bold ${pendingAmount > 0 ? "text-red-700" : "text-green-700"}`}>
                  {formatCurrency(pendingAmount)}
                </p>
                {pendingAmount > 0 && <p className="text-xs text-gray-500 mt-2">A pagar al llegar</p>}
              </div>
            </div>
            {pendingAmount > 0 && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-800">
                  💡 <strong>Recordá:</strong> El saldo pendiente de {formatCurrency(pendingAmount)} se abona al momento del check-in.
                </p>
              </div>
            )}
          </ColorTab>
        )}

        {/* UNIDAD + INVENTARIO */}
        <ColorTab color="blue" icon={Home} title={`Tu unidad: ${reservation.units?.name}`} subtitle={reservation.units?.description || ""} defaultOpen={true}>
          {reservation.units?.capacity && (
            <p className="text-sm text-gray-600 mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Capacidad: {reservation.units.capacity} personas
            </p>
          )}
          {unitInventory.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowInventory(!showInventory)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium mb-4"
              >
                <Package className="h-4 w-4" />
                {showInventory ? "Ocultar inventario" : "Ver inventario"}
                {showInventory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {showInventory && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    Inventario de la unidad
                  </h4>
                  {Object.entries(groupedInventory).map(([category, items]) => (
                    <div key={category} className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-3 text-sm">{category}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {items.map((item: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-gray-700">{item.name}</span>
                            <Badge variant="secondary" className="text-xs">x{item.quantity}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </ColorTab>

        {/* LLEGADA */}
        {arrivalInstructions?.enabled && (
          <ColorTab color="green" icon={Navigation} title="Instrucciones de llegada" subtitle="Cómo llegar al alojamiento" defaultOpen={true}>
            {arrivalInstructions.steps && arrivalInstructions.steps.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-3">Pasos para llegar:</h4>
                <ol className="space-y-3">
                  {arrivalInstructions.steps.map((step: any, index: number) => (
                    <li key={index} className="flex gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                        {step.order || index + 1}
                      </span>
                      <span className="text-gray-700 pt-1">{step.text}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {arrivalInstructions.parkingInfo && (
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200 mb-3">
                <Car className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900 text-sm">Estacionamiento</p>
                  <p className="text-green-800 text-sm mt-1">{arrivalInstructions.parkingInfo}</p>
                </div>
              </div>
            )}
            {arrivalInstructions.accessCode && (
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <Key className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900 text-sm">Código de acceso</p>
                  <p className="text-green-800 text-sm font-mono text-xl mt-1">{arrivalInstructions.accessCode}</p>
                </div>
              </div>
            )}
          </ColorTab>
        )}

        {/* CHECKOUT */}
        {checkoutInstructions?.enabled && (
          <ColorTab color="orange" icon={Key} title="Instrucciones de check-out" subtitle="Qué hacer al momento de salir">
            {checkoutInstructions.steps && checkoutInstructions.steps.length > 0 && (
              <ol className="space-y-3 mb-4">
                {checkoutInstructions.steps.map((step: any, index: number) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center text-sm font-bold">
                      {step.order || index + 1}
                    </span>
                    <span className="text-gray-700 pt-1">{step.text}</span>
                  </li>
                ))}
              </ol>
            )}
            {checkoutInstructions.keyReturnLocation && (
              <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <Key className="h-5 w-5 text-orange-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-900 text-sm">Dónde dejar las llaves</p>
                  <p className="text-orange-800 text-sm mt-1">{checkoutInstructions.keyReturnLocation}</p>
                </div>
              </div>
            )}
          </ColorTab>
        )}

        {/* DESTINO */}
        {destinationPlaces.length > 0 && (
          <ColorTab color="purple" icon={MapPin} title="Descubrí el destino" subtitle="Lugares recomendados por el anfitrión">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Elegí un lugar para ver más información:
                </label>
                <select
                  value={selectedPlace?.id || ""}
                  onChange={(e) => {
                    const place = destinationPlaces.find((p) => p.id === e.target.value);
                    setSelectedPlace(place || null);
                  }}
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">-- Seleccioná un lugar --</option>
                  {destinationPlaces.map((place) => {
                    const catConfig = CATEGORY_CONFIG[place.category] || CATEGORY_CONFIG.landmark;
                    return (
                      <option key={place.id} value={place.id}>
                        {place.name} ({catConfig.label})
                      </option>
                    );
                  })}
                </select>
              </div>
              {selectedPlace && (
                <div className="border border-purple-200 rounded-xl overflow-hidden bg-purple-50/30">
                  {selectedPlace.image_url && (
                    <div className="w-full h-48 bg-gray-200 overflow-hidden">
                      <img src={selectedPlace.image_url} alt={selectedPlace.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">{selectedPlace.name}</h4>
                        {(() => {
                          const catConfig = CATEGORY_CONFIG[selectedPlace.category] || CATEGORY_CONFIG.landmark;
                          const Icon = catConfig.icon;
                          return (
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium mt-2 ${catConfig.bgColor} ${catConfig.color}`}>
                              <Icon className="h-3 w-3" /> {catConfig.label}
                            </span>
                          );
                        })()}
                      </div>
                      {selectedPlace.google_maps_url && (
                        <a
                          href={selectedPlace.google_maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <ExternalLink className="h-4 w-4" /> Ver en Maps
                        </a>
                      )}
                    </div>
                    {selectedPlace.description && (
                      <p className="text-gray-700 text-sm leading-relaxed">{selectedPlace.description}</p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {selectedPlace.address && (
                        <div className="flex items-start gap-2 p-3 bg-white rounded-lg">
                          <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Dirección</p>
                            <p className="text-gray-800">{selectedPlace.address}</p>
                          </div>
                        </div>
                      )}
                      {selectedPlace.hours && (
                        <div className="flex items-start gap-2 p-3 bg-white rounded-lg">
                          <Clock className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Horarios</p>
                            <p className="text-gray-800">{selectedPlace.hours}</p>
                          </div>
                        </div>
                      )}
                      {selectedPlace.phone && (
                        <div className="flex items-start gap-2 p-3 bg-white rounded-lg">
                          <Phone className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Teléfono</p>
                            <a href={`tel:${selectedPlace.phone}`} className="text-blue-600 hover:underline">
                              {selectedPlace.phone}
                            </a>
                          </div>
                        </div>
                      )}
                      {selectedPlace.website && (
                        <div className="flex items-start gap-2 p-3 bg-white rounded-lg">
                          <Globe className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Sitio web</p>
                            <a href={selectedPlace.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {selectedPlace.website}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                    {selectedPlace.tips && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-800 font-medium mb-1">💡 Recomendación del anfitrión</p>
                        <p className="text-sm text-amber-900">{selectedPlace.tips}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {!selectedPlace && (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto mb-3 text-purple-300" />
                  <p className="text-sm text-gray-500">Seleccioná un lugar del menú desplegable para ver los detalles</p>
                </div>
              )}
            </div>
          </ColorTab>
        )}

        {/* UBICACIÓN */}
        {mapsEmbedUrl && (
          <ColorTab color="red" icon={MapPin} title="Ubicación" subtitle="Cómo llegar al alojamiento">
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <iframe
                src={mapsEmbedUrl}
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación del alojamiento"
                className="w-full"
              />
            </div>
            {settings.address && <p className="text-sm text-gray-600 mt-3 flex items-center gap-2">📍 {settings.address}</p>}
            <a
              href={settings.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-sm text-blue-600 hover:underline font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir en Google Maps
            </a>
          </ColorTab>
        )}

        {/* CONTACTOS */}
        {emergencyContacts.length > 0 && (
          <ColorTab color="red" icon={AlertCircle} title="Contactos importantes" subtitle="Números útiles durante tu estadía">
            <div className="space-y-3">
              {emergencyContacts.map((contact: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium text-gray-900">{contact.name}</p>
                    <p className="text-xs text-gray-500">{contact.role}</p>
                  </div>
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-2 text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    <Phone className="h-4 w-4" />
                    {contact.phone}
                  </a>
                </div>
              ))}
            </div>
          </ColorTab>
        )}

        {/* RESEÑAS */}
        {reservation.status === "checked_out" && reviewLink && (
          <ColorTab color="yellow" icon={Star} title="¿Cómo fue tu estadía?" subtitle="Tu opinión nos ayuda a mejorar" defaultOpen={true}>
            <div className="text-center py-4">
              <p className="text-gray-700 mb-4">
                Tu opinión nos ayuda a mejorar y a otros huéspedes a elegirnos. ¡Dejanos tu reseña!
              </p>
              <a
                href={reviewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-yellow-600 text-white px-8 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-medium shadow-lg"
              >
                <Star className="h-5 w-5" />
                Dejar reseña
                <ExternalLink className="h-4 w-4" />
              </a>
              {tenant.review_url ? (
                <p className="text-xs text-yellow-700 mt-3 flex items-center justify-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Serás dirigido a nuestra página de reseñas
                </p>
              ) : settings.googleMapsUrl ? (
                <p className="text-xs text-yellow-700 mt-3 flex items-center justify-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Serás dirigido a Google Maps para dejar tu reseña
                </p>
              ) : null}
            </div>
          </ColorTab>
        )}

        {/* CARDS INFERIORES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`rounded-2xl p-6 border-2 ${preCheckinCompleted ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"}`}>
            <div className="flex items-start gap-3">
              <ClipboardList className={`h-6 w-6 flex-shrink-0 ${preCheckinCompleted ? "text-green-600" : "text-blue-600"}`} />
              <div className="flex-1">
                <h3 className={`font-bold ${preCheckinCompleted ? "text-green-900" : "text-blue-900"}`}>
                  Pre Check-in
                </h3>
                <p className={`text-sm mt-1 mb-4 ${preCheckinCompleted ? "text-green-700" : "text-blue-700"}`}>
                  {preCheckinCompleted ? "Completado ✓" : "Completá tus datos antes de llegar"}
                </p>
                <button
                  onClick={handlePreCheckinClick}
                  className={`w-full px-4 py-2.5 rounded-lg text-white font-medium transition-colors ${
                    preCheckinCompleted ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {preCheckinCompleted ? "Editar" : "Completar"}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-6 border-2 border-green-200 bg-green-50">
            <div className="flex items-start gap-3">
              <Wifi className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">Wi-Fi</h3>
                {settings.wifiNetworks && settings.wifiNetworks.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {settings.wifiNetworks.map((wifi: any, i: number) => (
                      <div key={i} className="text-sm">
                        <p className="font-medium">Red: {wifi.ssid}</p>
                        <p className="text-gray-600">Clave: {wifi.password}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 mt-2">No configurada</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-6 border-2 border-green-200 bg-green-50">
            <div className="flex items-start gap-3">
              <MessageCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-gray-900">¿Necesitás ayuda?</h3>
                <p className="text-sm text-gray-600 mt-1">Contactanos por WhatsApp</p>
                {settings.whatsappNumber && (
                  <a
                    href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3"
                  >
                    <span className="inline-block bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium">
                      Enviar mensaje
                    </span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* GUÍA */}
        <Link href={`/${tenantSlug}/guides`} className="block">
          <div className="rounded-2xl p-6 bg-white border-2 border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-start gap-3">
              <FileText className="h-6 w-6 text-gray-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-gray-900">Guía del alojamiento</h3>
                <p className="text-sm text-gray-600 mt-1">Normas, servicios e información útil</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white py-6 mt-12">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/mi-estadia-logo.png" alt="Mi Estadía" className="h-8 w-auto" />
            <span className="text-sm text-gray-600">© 2026 Mi Estadía</span>
          </div>
          <a
            href="https://buenpuerto.online"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span>App desarrollada por</span>
            <img src="/buenpuerto-logo.png" alt="Buen Puerto" className="h-7 w-auto" />
            <span className="font-semibold text-teal-700">buenpuerto.online</span>
          </a>
        </div>
      </footer>
    </div>
  );
} 