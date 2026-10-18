"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Wifi, MessageCircle, FileText, CheckCircle, ClipboardList, AlertCircle,
  Package, Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Home, Car, Key,
  Navigation, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, LogOut, Utensils,
  TreePalm, Landmark, ShoppingBag, Coffee, Waves, ExternalLink, DollarSign, TrendingUp,
  Star, Phone, Globe, Clock, Users, Calendar, Hash,
} from "lucide-react";
import Link from "next/link";
import LanguageSelector from "@/components/LanguageSelector";

interface Props { params: Promise<{ tenantSlug: string }>; }
interface WeatherDay { date: string; weatherCode: number; tempMax: number; tempMin: number; precipitationProbability: number; }
interface LocationInfo { city: string; region: string; country: string; }
interface Service { id: string; name: string; description: string; price?: number; whatsapp?: string; photos?: { image_url: string }[]; }

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  restaurant: { label: "Restaurante", icon: Utensils, color: "text-orange-700", bgColor: "bg-orange-100" },
  activity: { label: "Actividad", icon: TreePalm, color: "text-green-700", bgColor: "bg-green-100" },
  landmark: { label: "Punto de interés", icon: Landmark, color: "text-purple-700", bgColor: "bg-purple-100" },
  shopping: { label: "Compras", icon: ShoppingBag, color: "text-pink-700", bgColor: "bg-pink-100" },
  cafe: { label: "Café / Bar", icon: Coffee, color: "text-amber-700", bgColor: "bg-amber-100" },
  beach: { label: "Playa / Naturaleza", icon: Waves, color: "text-cyan-700", bgColor: "bg-cyan-100" },
};

function getWeatherInfo(code: number) {
  const map: Record<number, { emoji: string; icon: any; description: string; color: string }> = {
    0: { emoji: "☀️", icon: Sun, description: "Despejado", color: "text-yellow-500" },
    1: { emoji: "🌤️", icon: Sun, description: "Mayormente despejado", color: "text-yellow-400" },
    2: { emoji: "⛅", icon: Cloud, description: "Parcialmente nublado", color: "text-gray-400" },
    3: { emoji: "️", icon: Cloud, description: "Nublado", color: "text-gray-500" },
    61: { emoji: "🌧️", icon: CloudRain, description: "Lluvia", color: "text-blue-500" },
    71: { emoji: "🌨️", icon: CloudSnow, description: "Nieve", color: "text-blue-300" },
    95: { emoji: "⛈️", icon: CloudLightning, description: "Tormenta", color: "text-purple-600" },
  };
  return map[code] || { emoji: "🌡️", icon: Wind, description: "Desconocido", color: "text-gray-500" };
}

function getGoogleMapsEmbedUrl(mapsUrl: string): string | null {
  if (!mapsUrl) return null;
  if (mapsUrl.includes("/embed")) return mapsUrl;
  const patterns = [/@(-?\d+\.\d+),(-?\d+\.\d+)/, /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/];
  for (const pattern of patterns) {
    const match = mapsUrl.match(pattern);
    if (match) {
      const lat = match[1]; const lng = match[2];
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
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(amount || 0);
}

function ColorTab({ color, icon: Icon, title, subtitle, children, defaultOpen = false }: {
  color: "green" | "orange" | "red" | "purple" | "blue" | "yellow" | "emerald";
  icon: any; title: string; subtitle?: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const colorConfig = {
    green: { bg: "bg-green-600", border: "border-green-200" },
    orange: { bg: "bg-orange-600", border: "border-orange-200" },
    red: { bg: "bg-red-600", border: "border-red-200" },
    purple: { bg: "bg-purple-600", border: "border-purple-200" },
    blue: { bg: "bg-blue-600", border: "border-blue-200" },
    yellow: { bg: "bg-yellow-600", border: "border-yellow-200" },
    emerald: { bg: "bg-emerald-600", border: "border-emerald-200" },
  };
  const config = colorConfig[color];
  return (
    <div className={`rounded-xl lg:rounded-2xl overflow-hidden shadow-lg border ${config.border} bg-white`}>
      <button onClick={() => setIsOpen(!isOpen)} className={`w-full ${config.bg} text-white p-3 lg:p-5 flex items-center justify-between hover:opacity-95 transition-opacity`}>
        <div className="flex items-center gap-2 lg:gap-4 min-w-0 flex-1">
          <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 lg:h-6 lg:w-6" />
          </div>
          <div className="text-left min-w-0">
            <h3 className="font-bold text-sm lg:text-lg truncate">{title}</h3>
            {subtitle && <p className="text-xs lg:text-sm text-white/90 mt-0.5 truncate hidden sm:block">{subtitle}</p>}
          </div>
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5 flex-shrink-0" /> : <ChevronDown className="h-5 w-5 flex-shrink-0" />}
      </button>
      {isOpen && <div className="p-4 lg:p-6">{children}</div>}
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
  const [services, setServices] = useState<Service[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [unitPhotos, setUnitPhotos] = useState<{ image_url: string }[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params;
      setTenantSlug(resolvedParams.tenantSlug);
      let sessionStr = sessionStorage.getItem("guest_session");
      if (!sessionStr) sessionStr = localStorage.getItem("guest_session");
      if (!sessionStr) { setError("No hay sesión activa."); setLoading(false); return; }
      try {
        const session = JSON.parse(sessionStr);
        if (session.expiresAt && Date.now() > session.expiresAt) {
          sessionStorage.removeItem("guest_session");
          localStorage.removeItem("guest_session");
          setError("La sesión expiró. Volvé a ingresar desde el link.");
          setLoading(false); return;
        }
        await loadStay(session.reservationId, resolvedParams.tenantSlug);
      } catch (e) { console.error("Error en init:", e); setError("Sesión inválida."); setLoading(false); }
    };
    init();
  }, [params]);

  async function getLocationName(lat: number, lng: number): Promise<LocationInfo | null> {
    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`);
      if (!res.ok) return null;
      const data = await res.json();
      return { city: data.city || data.locality || data.localityInfo?.administrative?.[2]?.name || "", region: data.principalSubdivision || data.localityInfo?.administrative?.[1]?.name || "", country: data.countryName || "" };
    } catch { return null; }
  }

  async function loadWeather(lat: number, lng: number, startDate: string, endDate: string) {
    setWeatherLoading(true); setWeatherMessage(""); setWeatherData([]); setLocationInfo(null);
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split("T")[0];
      const maxDate = new Date(today); maxDate.setDate(today.getDate() + 16);
      const maxDateStr = maxDate.toISOString().split("T")[0];
      const startDateObj = new Date(startDate + "T00:00:00");
      const endDateObj = new Date(endDate + "T00:00:00");
      if (startDateObj < today) startDate = todayStr;
      if (startDate > maxDateStr) { setWeatherMessage(`El pronóstico estará disponible cuando se acerque la fecha.`); setWeatherLoading(false); return; }
      if (endDateObj > maxDate) endDate = maxDateStr;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America/Argentina/Buenos_Aires&start_date=${startDate}&end_date=${endDate}`;
      const response = await fetch(url);
      if (!response.ok) { setWeatherMessage("No se pudo cargar el pronóstico."); setWeatherLoading(false); return; }
      const data = await response.json();
      if (data.daily && data.daily.time && data.daily.time.length > 0) {
        const days: WeatherDay[] = data.daily.time.map((date: string, index: number) => ({ date, weatherCode: data.daily.weathercode[index], tempMax: Math.round(data.daily.temperature_2m_max[index]), tempMin: Math.round(data.daily.temperature_2m_min[index]), precipitationProbability: data.daily.precipitation_probability_max[index] || 0 }));
        setWeatherData(days);
      } else { setWeatherMessage("No hay datos de pronóstico."); }
      const loc = await getLocationName(lat, lng); if (loc) setLocationInfo(loc);
    } catch (err) { console.error("Error cargando clima:", err); setWeatherMessage("Error al cargar el pronóstico."); }
    finally { setWeatherLoading(false); }
  }

  async function loadStay(reservationId: string, slug: string) {
    const { data: res, error: resError } = await supabase.from("reservations").select(`*, guests (first_name, last_name, email, phone), units (name, type, description, capacity)`).eq("id", reservationId).single();
    if (resError || !res) { setError("No se pudo cargar la reserva"); setLoading(false); return; }
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
      const { data: placesData } = await supabase.from("destination_places").select("*").eq("tenant_id", tenantData.id).order("order");
      if (placesData) setDestinationPlaces(placesData);
      
      // Cargar servicios
      const { data: servicesData } = await supabase.from("services").select("*").eq("tenant_id", tenantData.id).eq("active", true).order("order");
      if (servicesData) {
        const servicesWithPhotos = await Promise.all(
          servicesData.map(async (service: any) => {
            const { data: photos } = await supabase.from("service_photos").select("image_url").eq("service_id", service.id).order("order_index");
            return { ...service, photos: photos || [] };
          })
        );
        setServices(servicesWithPhotos);
      }
    }
    if (res.status === "booked") await supabase.from("reservations").update({ status: "pre_checkin" }).eq("id", reservationId);
    const { data: existingPreCheckin } = await supabase.from("pre_checkins").select("id, status").eq("reservation_id", reservationId).eq("status", "completed").maybeSingle();
    if (existingPreCheckin) setPreCheckinCompleted(true);
    
    // Cargar fotos de la unidad
    if (res.unit_id) {
      const { data: photos } = await supabase.from("unit_photos").select("image_url").eq("unit_id", res.unit_id).order("order_index");
      if (photos) setUnitPhotos(photos);
      
      const { data: inventoryData } = await supabase.from("unit_inventory_items").select("*").eq("unit_id", res.unit_id).order("category").order("order");
      if (inventoryData && inventoryData.length > 0) {
        setUnitInventory(inventoryData);
        const grouped: Record<string, any[]> = {};
        inventoryData.forEach((item) => {
          const categoryName = item.custom_category || (item.category === "bedding" ? "Ropa de cama" : item.category === "kitchen" ? "Cocina" : item.category === "bathroom" ? "Baño" : item.category);
          if (!grouped[categoryName]) grouped[categoryName] = [];
          grouped[categoryName].push(item);
        });
        setGroupedInventory(grouped);
      }
    }
    setLoading(false);
  }

  function formatDate(dateStr: string) { const date = new Date(dateStr + "T00:00:00"); return date.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" }); }
  function isToday(dateStr: string) { return dateStr === new Date().toISOString().split("T")[0]; }
  function handlePreCheckinClick() { const code = reservation?.reservation_code; const lastName = reservation?.guests?.last_name || ""; window.location.href = `/${tenantSlug}/pre-checkin?code=${code}&lastName=${encodeURIComponent(lastName)}`; }
  function handleLogout() { sessionStorage.removeItem("guest_session"); localStorage.removeItem("guest_session"); window.location.href = `/${tenantSlug}`; }

  if (loading) return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100"><div className="text-center"><div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent mx-auto"></div><p className="mt-6 text-gray-600 font-medium">Cargando tu panel...</p></div></div>);
  if (error || !reservation || !tenant) return (<div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4"><Card className="max-w-md w-full"><CardContent className="p-8 text-center"><div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><AlertCircle className="h-8 w-8 text-red-600" /></div><h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2><p className="text-gray-600 mb-6">{error || "No se encontró la reserva"}</p><button onClick={() => { sessionStorage.removeItem("guest_session"); localStorage.removeItem("guest_session"); window.location.href = `/${tenantSlug}`; }} className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium">Volver al inicio</button></CardContent></Card></div>);

  const settings = tenant.settings || {};
  const branding = tenant.branding || {};
  const checkInDate = new Date(reservation.check_in);
  const checkOutDate = new Date(reservation.check_out);
  const mapsEmbedUrl = getGoogleMapsEmbedUrl(settings.googleMapsUrl);
  const arrivalInstructions = settings.arrivalInstructions || null;
  const checkoutInstructions = settings.checkoutInstructions || null;
  const emergencyContacts = settings.emergencyContacts || [];
  const locationLabel = locationInfo ? [locationInfo.city, locationInfo.region, locationInfo.country].filter(Boolean).join(", ") : null;
  const totalAmount = reservation.total_amount || 0;
  const paidAmount = reservation.paid_amount || 0;
  const pendingAmount = Math.max(0, totalAmount - paidAmount);
  const paymentPercentage = totalAmount > 0 ? Math.min(100, (paidAmount / totalAmount) * 100) : 0;
  const reviewLink = tenant.review_url || settings.googleMapsUrl;
  const whatsappHelpNumber = settings.whatsappHelpNumber || settings.whatsappNumber;

  const statusColors: Record<string, string> = { pre_checkin: "bg-blue-500", checked_in: "bg-green-500", checked_out: "bg-gray-500", booked: "bg-purple-500" };
  const statusLabels: Record<string, string> = { pre_checkin: "Pre Check-in", checked_in: "Alojado", checked_out: "Check-out", booked: "Reservado" };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* ANIMACIÓN DE BIENVENIDA */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-20 left-10 animate-bounce-slow opacity-20">
          <svg className="w-16 h-16 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
        </div>
        <div className="absolute bottom-20 right-10 animate-bounce-slow opacity-20" style={{ animationDelay: '1s' }}>
          <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
      </div>

      {/* HEADER */}
      <header className="relative bg-gradient-to-br from-green-700 via-green-600 to-emerald-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 lg:px-6 py-4 lg:py-10">
          <div className="flex items-center justify-between gap-2 lg:gap-6 mb-3 lg:mb-8">
            <div className="flex items-center gap-2 lg:gap-5 min-w-0 flex-1">
              {branding.logoUrl && (
                <img src={branding.logoUrl} alt="Logo" className="h-10 w-10 lg:h-20 lg:w-auto bg-white rounded-lg lg:rounded-2xl p-1.5 lg:p-3 shadow-xl object-contain flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-lg lg:text-3xl lg:text-4xl font-bold truncate">¡Hola, {reservation.guests?.first_name}! 👋</h1>
                <p className="text-green-100 text-xs lg:text-lg mt-0.5 lg:mt-1 truncate">{tenant.name}</p>
                <div className="flex items-center gap-2 mt-1 lg:mt-3">
                  <span className={`inline-flex items-center gap-2 px-2 lg:px-4 py-1 rounded-full text-[10px] lg:text-sm font-semibold text-white ${statusColors[reservation.status] || "bg-gray-500"}`}>
                    <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-white animate-pulse"></span>
                    {statusLabels[reservation.status] || reservation.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 lg:gap-3 flex-shrink-0">
              <LanguageSelector variant="dropdown" />
              <button onClick={handleLogout} className="flex items-center gap-1 lg:gap-2 px-2 lg:px-5 py-1.5 lg:py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur text-white rounded-lg text-xs lg:text-sm font-medium border border-white/20">
                <LogOut className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>

          {/* CLIMA */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl lg:rounded-2xl p-3 lg:p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2 lg:mb-4">
              <h3 className="font-semibold text-white text-xs lg:text-base flex items-center gap-2">
                <Cloud className="h-4 w-4 lg:h-5 lg:w-5" />
                <span className="hidden sm:inline">Clima durante tu estadía</span>
                <span className="sm:hidden">Clima</span>
              </h3>
              {locationLabel && (
                <span className="flex items-center gap-1 text-[10px] lg:text-xs text-white/90 bg-white/10 px-2 py-1 rounded-full">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-[100px]">{locationLabel}</span>
                </span>
              )}
            </div>
            {weatherLoading ? (
              <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div></div>
            ) : weatherData.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 lg:gap-3">
                {weatherData.slice(0, 7).map((day, index) => {
                  const weatherInfo = getWeatherInfo(day.weatherCode);
                  const WeatherIcon = weatherInfo.icon;
                  return (
                    <div key={index} className={`rounded-lg lg:rounded-xl p-2 lg:p-3 text-center transition-all ${isToday(day.date) ? "bg-white text-gray-900 shadow-lg scale-105" : "bg-white/10 text-white"}`}>
                      <p className={`text-[10px] lg:text-xs font-semibold mb-1 ${isToday(day.date) ? "text-green-600" : "text-white/80"}`}>{isToday(day.date) ? "Hoy" : day.date.split("-")[2]}</p>
                      <div className="flex justify-center mb-1"><WeatherIcon className={`h-6 w-6 lg:h-8 lg:w-8 ${isToday(day.date) ? weatherInfo.color : "text-white"}`} /></div>
                      <div className="flex justify-center gap-1 lg:gap-2 text-xs lg:text-sm font-bold">
                        <span className={isToday(day.date) ? "text-red-500" : "text-red-300"}>{day.tempMax}°</span>
                        <span className={isToday(day.date) ? "text-blue-500" : "text-blue-300"}>{day.tempMin}°</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4"><Cloud className="h-10 w-10 mx-auto mb-2 text-white/40" /><p className="text-xs lg:text-sm text-white/80">{weatherMessage || "El pronóstico estará disponible pronto."}</p></div>
            )}
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <div className="relative z-10 max-w-5xl mx-auto px-3 lg:px-6 py-4 lg:py-8 space-y-3 lg:space-y-6">
        {/* INFO DE RESERVA */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
          <div className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 text-[10px] lg:text-sm mb-1 lg:mb-2"><Home className="h-3 w-3 lg:h-4 lg:w-4" />Unidad</div>
            <p className="font-bold text-gray-900 text-sm lg:text-lg truncate">{reservation.units?.name}</p>
          </div>
          <div className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 text-[10px] lg:text-sm mb-1 lg:mb-2"><Calendar className="h-3 w-3 lg:h-4 lg:w-4" />Check-in</div>
            <p className="font-bold text-gray-900 text-sm lg:text-base">{checkInDate.toLocaleDateString("es-AR", { day: '2-digit', month: '2-digit' })}</p>
            <p className="text-[10px] lg:text-sm text-gray-500">{settings.checkInTime || "15:00"}</p>
          </div>
          <div className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 text-[10px] lg:text-sm mb-1 lg:mb-2"><Calendar className="h-3 w-3 lg:h-4 lg:w-4" />Check-out</div>
            <p className="font-bold text-gray-900 text-sm lg:text-base">{checkOutDate.toLocaleDateString("es-AR", { day: '2-digit', month: '2-digit' })}</p>
            <p className="text-[10px] lg:text-sm text-gray-500">{settings.checkOutTime || "10:00"}</p>
          </div>
          <div className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 text-[10px] lg:text-sm mb-1 lg:mb-2"><Hash className="h-3 w-3 lg:h-4 lg:w-4" />Código</div>
            <p className="font-bold text-gray-900 text-sm lg:text-lg font-mono truncate">{reservation.reservation_code}</p>
          </div>
        </div>

        {/* CAROUSEL DE FOTOS DE LA UNIDAD */}
        {unitPhotos.length > 0 && (
          <div className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Home className="h-5 w-5 text-green-600" />
              Tu unidad
            </h3>
            <div className="relative rounded-xl overflow-hidden bg-gray-100">
              <img src={unitPhotos[currentPhotoIndex]?.image_url || ''} alt={`Foto ${currentPhotoIndex + 1}`} className="w-full h-48 lg:h-64 object-cover" />
              {unitPhotos.length > 1 && (
                <>
                  <button onClick={() => setCurrentPhotoIndex((currentPhotoIndex - 1 + unitPhotos.length) % unitPhotos.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setCurrentPhotoIndex((currentPhotoIndex + 1) % unitPhotos.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg">
                    <ChevronRight className="w-5 w-5" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {unitPhotos.map((_, idx) => (
                      <button key={idx} onClick={() => setCurrentPhotoIndex(idx)} className={`h-2 rounded-full transition-all ${idx === currentPhotoIndex ? 'bg-white w-6' : 'bg-white/50 w-2'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">{currentPhotoIndex + 1} de {unitPhotos.length} fotos</p>
            {reservation.units?.description && <p className="text-sm text-gray-600 mt-3">{reservation.units.description}</p>}
            {reservation.units?.capacity && <p className="text-sm text-gray-600 mt-2 flex items-center gap-2"><Users className="h-4 w-4" />Capacidad: {reservation.units.capacity} personas</p>}
          </div>
        )}

        {/* PRE CHECK-IN */}
        <div className={`rounded-xl lg:rounded-2xl p-4 lg:p-6 border-2 shadow-lg ${preCheckinCompleted ? "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50" : "border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50"}`}>
          <div className="flex items-start gap-3 lg:gap-4">
            <div className={`h-12 w-12 lg:h-14 lg:w-14 rounded-xl flex items-center justify-center flex-shrink-0 ${preCheckinCompleted ? "bg-green-600" : "bg-blue-600"}`}>
              <ClipboardList className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-lg lg:text-xl ${preCheckinCompleted ? "text-green-900" : "text-blue-900"}`}>Pre Check-in</h3>
              <p className={`text-xs lg:text-sm mt-1 mb-3 lg:mb-4 ${preCheckinCompleted ? "text-green-700" : "text-blue-700"}`}>
                {preCheckinCompleted ? "✓ Completado. Podés editar tus datos." : "Completá tus datos antes de llegar."}
              </p>
              <button onClick={handlePreCheckinClick} className={`px-4 lg:px-6 py-2 lg:py-3 rounded-xl text-white font-semibold transition-all shadow-md hover:shadow-lg text-sm lg:text-base ${preCheckinCompleted ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}>
                {preCheckinCompleted ? "Editar datos" : "Completar Pre Check-in"}
              </button>
            </div>
          </div>
        </div>

        {/* PAGO */}
        {totalAmount > 0 && (
          <ColorTab color="emerald" icon={DollarSign} title="Estado de tu pago" subtitle="Seguimiento de tu reserva" defaultOpen={true}>
            <div className="mb-4 lg:mb-6">
              <div className="flex items-center justify-between mb-2 lg:mb-3">
                <span className="text-xs lg:text-sm font-medium text-gray-700">Progreso de pago</span>
                <span className="text-base lg:text-lg font-bold text-gray-900">{Math.round(paymentPercentage)}%</span>
              </div>
              <div className="w-full h-3 lg:h-4 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${paymentPercentage === 100 ? "bg-gradient-to-r from-green-400 to-green-600" : paymentPercentage > 0 ? "bg-gradient-to-r from-yellow-400 to-yellow-600" : "bg-gray-300"}`} style={{ width: `${paymentPercentage}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
              <div className="bg-gray-50 rounded-xl p-4 lg:p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-1 lg:mb-2"><TrendingUp className="h-3 w-3 lg:h-4 lg:w-4 text-gray-500" /><p className="text-xs text-gray-500 font-medium">Total</p></div>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 lg:p-5 border border-green-200">
                <div className="flex items-center gap-2 mb-1 lg:mb-2"><CheckCircle className="h-3 w-3 lg:h-4 lg:w-4 text-green-600" /><p className="text-xs text-green-600 font-medium">Ya pagado</p></div>
                <p className="text-xl lg:text-2xl font-bold text-green-700">{formatCurrency(paidAmount)}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 lg:p-5 border border-red-200">
                <div className="flex items-center gap-2 mb-1 lg:mb-2"><AlertCircle className="h-3 w-3 lg:h-4 lg:w-4 text-red-600" /><p className="text-xs text-red-600 font-medium">Pendiente</p></div>
                <p className={`text-xl lg:text-2xl font-bold ${pendingAmount > 0 ? "text-red-700" : "text-green-700"}`}>{formatCurrency(pendingAmount)}</p>
                {pendingAmount > 0 && <p className="text-xs text-gray-500 mt-1 lg:mt-2">A pagar al llegar</p>}
              </div>
            </div>
          </ColorTab>
        )}

        {/* UNIDAD + INVENTARIO */}
        {unitPhotos.length === 0 && (
          <ColorTab color="blue" icon={Home} title={`Tu unidad: ${reservation.units?.name}`} subtitle={reservation.units?.description || ""} defaultOpen={true}>
            {reservation.units?.capacity && (<p className="text-sm text-gray-600 mb-4 flex items-center gap-2"><Users className="h-4 w-4" />Capacidad: {reservation.units.capacity} personas</p>)}
            {unitInventory.length > 0 && (
              <div className="mt-4">
                <button onClick={() => setShowInventory(!showInventory)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium mb-4">
                  <Package className="h-4 w-4" />{showInventory ? "Ocultar inventario" : "Ver inventario"}{showInventory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {showInventory && (
                  <div className="space-y-3">
                    {Object.entries(groupedInventory).map(([category, items]) => (
                      <div key={category} className="border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-3 text-sm">{category}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {items.map((item: any, index: number) => (
                            <div key={index} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                              <span className="text-gray-700 truncate">{item.name}</span>
                              <Badge variant="secondary" className="text-xs flex-shrink-0 ml-2">x{item.quantity}</Badge>
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
        )}

        {/* SERVICIOS - Scroll horizontal tipo ecommerce */}
        {services.length > 0 && (
          <ColorTab color="purple" icon={Star} title="Servicios disponibles" subtitle="Experiencias y servicios del alojamiento" defaultOpen={true}>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x snap-mandatory">
              {services.map((service, index) => (
                <div key={index} className="flex-shrink-0 w-64 snap-start">
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {service.photos && service.photos.length > 0 && (
                      <div className="w-full h-32 bg-gray-100 overflow-hidden">
                        <img src={service.photos[0].image_url} alt={service.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-4">
                      <h4 className="font-bold text-gray-900 mb-1">{service.name}</h4>
                      {service.description && (<p className="text-sm text-gray-600 mb-2 line-clamp-2">{service.description}</p>)}
                      {service.price && (<p className="text-lg font-bold text-green-700 mb-2">{formatCurrency(service.price)}</p>)}
                      {service.whatsapp && (
                        <a href={`https://wa.me/${service.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="mt-2 w-full inline-flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                          <MessageCircle className="h-4 w-4" />Reservar
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ColorTab>
        )}

        {/* LLEGADA */}
        {arrivalInstructions?.enabled && (
          <ColorTab color="green" icon={Navigation} title="Instrucciones de llegada" subtitle="Cómo llegar al alojamiento" defaultOpen={true}>
            {arrivalInstructions.steps && arrivalInstructions.steps.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-3">Pasos para llegar:</h4>
                <ol className="space-y-3">
                  {arrivalInstructions.steps.map((step: any, index: number) => (
                    <li key={index} className="flex gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">{step.order || index + 1}</span>
                      <span className="text-gray-700 pt-1">{step.text}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {arrivalInstructions.parkingInfo && (
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200 mb-3">
                <Car className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
                <div><p className="font-medium text-green-900 text-sm">Estacionamiento</p><p className="text-green-800 text-sm mt-1">{arrivalInstructions.parkingInfo}</p></div>
              </div>
            )}
            {arrivalInstructions.accessCode && (
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <Key className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
                <div><p className="font-medium text-green-900 text-sm">Código de acceso</p><p className="text-green-800 text-sm font-mono text-xl mt-1">{arrivalInstructions.accessCode}</p></div>
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
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center text-sm font-bold">{step.order || index + 1}</span>
                    <span className="text-gray-700 pt-1">{step.text}</span>
                  </li>
                ))}
              </ol>
            )}
            {checkoutInstructions.keyReturnLocation && (
              <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <Key className="h-5 w-5 text-orange-700 flex-shrink-0 mt-0.5" />
                <div><p className="font-medium text-orange-900 text-sm">Dónde dejar las llaves</p><p className="text-orange-800 text-sm mt-1">{checkoutInstructions.keyReturnLocation}</p></div>
              </div>
            )}
          </ColorTab>
        )}

        {/* DESTINO */}
        {destinationPlaces.length > 0 && (
          <ColorTab color="purple" icon={MapPin} title="Descubrí el destino" subtitle="Lugares recomendados por el anfitrión">
            <div className="space-y-4">
              <select value={selectedPlace?.id || ""} onChange={(e) => { const place = destinationPlaces.find((p) => p.id === e.target.value); setSelectedPlace(place || null); }} className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="">-- Seleccioná un lugar --</option>
                {destinationPlaces.map((place) => { const catConfig = CATEGORY_CONFIG[place.category] || CATEGORY_CONFIG.landmark; return (<option key={place.id} value={place.id}>{place.name} ({catConfig.label})</option>); })}
              </select>
              {selectedPlace && (
                <div className="border border-purple-200 rounded-xl overflow-hidden bg-purple-50/30">
                  {selectedPlace.image_url && (<div className="w-full h-48 bg-gray-200 overflow-hidden"><img src={selectedPlace.image_url} alt={selectedPlace.name} className="w-full h-full object-cover" /></div>)}
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xl font-bold text-gray-900 truncate">{selectedPlace.name}</h4>
                        {(() => { const catConfig = CATEGORY_CONFIG[selectedPlace.category] || CATEGORY_CONFIG.landmark; const Icon = catConfig.icon; return (<span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium mt-2 ${catConfig.bgColor} ${catConfig.color}`}><Icon className="h-3 w-3" /> {catConfig.label}</span>); })()}
                      </div>
                      {selectedPlace.google_maps_url && (<a href={selectedPlace.google_maps_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex-shrink-0"><ExternalLink className="h-4 w-4" />Maps</a>)}
                    </div>
                    {selectedPlace.description && (<p className="text-gray-700 text-sm leading-relaxed">{selectedPlace.description}</p>)}
                  </div>
                </div>
              )}
            </div>
          </ColorTab>
        )}

        {/* UBICACIÓN */}
        {mapsEmbedUrl && (
          <ColorTab color="red" icon={MapPin} title="Ubicación" subtitle="Cómo llegar al alojamiento">
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <iframe src={mapsEmbedUrl} width="100%" height="300" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Ubicación del alojamiento" className="w-full" />
            </div>
            {settings.address && <p className="text-sm text-gray-600 mt-3 flex items-center gap-2">📍 {settings.address}</p>}
            <a href={settings.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-3 text-sm text-blue-600 hover:underline font-medium"><ExternalLink className="h-4 w-4" />Abrir en Google Maps</a>
          </ColorTab>
        )}

        {/* CONTACTOS */}
        {emergencyContacts.length > 0 && (
          <ColorTab color="red" icon={AlertCircle} title="Contactos importantes" subtitle="Números útiles durante tu estadía">
            <div className="space-y-3">
              {emergencyContacts.map((contact: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{contact.name}</p>
                    <p className="text-xs text-gray-500">{contact.role}</p>
                  </div>
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium flex-shrink-0 ml-3">
                    <Phone className="h-4 w-4" />{contact.phone}
                  </a>
                </div>
              ))}
            </div>
          </ColorTab>
        )}

        {/* CARDS INFERIORES: Wi-Fi, WhatsApp Ayuda, Guía */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
          {/* Wi-Fi */}
          <div className="rounded-xl lg:rounded-2xl p-4 lg:p-6 border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-lg lg:rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0">
                <Wifi className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-base lg:text-lg">Wi-Fi</h3>
                {settings.wifiNetworks && settings.wifiNetworks.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {settings.wifiNetworks.map((wifi: any, i: number) => (
                      <div key={i} className="text-xs lg:text-sm">
                        <p className="font-medium text-gray-900 truncate">Red: {wifi.ssid}</p>
                        <p className="text-gray-600">Clave: {wifi.password}</p>
                      </div>
                    ))}
                  </div>
                ) : (<p className="text-xs lg:text-sm text-gray-600 mt-2">No configurada</p>)}
              </div>
            </div>
          </div>

          {/* WhatsApp Ayuda */}
          <div className="rounded-xl lg:rounded-2xl p-4 lg:p-6 border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-lg lg:rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-base lg:text-lg">¿Necesitás ayuda?</h3>
                <p className="text-xs text-gray-600 mt-1 mb-2">Contactanos por WhatsApp</p>
                {whatsappHelpNumber && (
                  <a href={`https://wa.me/${whatsappHelpNumber.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 lg:gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-xs lg:text-sm font-medium shadow-sm">
                    <MessageCircle className="h-3 w-3 lg:h-4 lg:w-4" />Enviar mensaje
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Guía */}
          <Link href={`/${tenantSlug}/guides`} className="block">
            <div className="rounded-xl lg:rounded-2xl p-4 lg:p-6 border-2 border-gray-200 bg-white hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-lg lg:rounded-xl bg-gray-600 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-base lg:text-lg">Guía</h3>
                  <p className="text-xs text-gray-600 mt-1">Normas e info útil</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* RESEÑAS */}
        {reviewLink && (
          <ColorTab color="yellow" icon={Star} title="¿Cómo fue tu estadía?" subtitle="Tu opinión nos ayuda a mejorar" defaultOpen={true}>
            <div className="text-center py-4">
              <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4"><Star className="h-8 w-8 text-yellow-600" /></div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">¡Gracias por elegirnos!</h4>
              <p className="text-gray-700 mb-6 max-w-md mx-auto text-sm">Tu opinión nos ayuda a mejorar. ¡Dejanos tu reseña!</p>
              <a href={reviewLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-yellow-600 text-white px-6 py-3 lg:px-8 lg:py-4 rounded-xl hover:bg-yellow-700 transition-colors font-semibold shadow-lg hover:shadow-xl text-sm lg:text-base">
                <Star className="h-5 w-5" />Dejar reseña<ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </ColorTab>
        )}
      </div>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white py-6 mt-8 lg:mt-12">
        <div className="max-w-5xl mx-auto px-4 lg:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/mi-estadia-logo.png" alt="Mi Estadía" className="h-8 w-auto" />
            <span className="text-sm text-gray-600">© 2026 Mi Estadía</span>
          </div>
          <a href="https://buenpuerto.online" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
            <span>App desarrollada por</span>
            <img src="/buenpuerto-logo.png" alt="Buen Puerto" className="h-7 w-auto" />
            <span className="font-semibold text-teal-700">buenpuerto.online</span>
          </a>
        </div>
      </footer>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}