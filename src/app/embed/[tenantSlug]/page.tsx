"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import {
  Calendar,
  Users,
  Search,
  CheckCircle,
  Loader2,
  AlertCircle,
  ChevronLeft,
  Shield,
  Clock,
  Package,
  Star,
} from "lucide-react";

interface Unit {
  id: string;
  name: string;
  type: string;
  capacity: number;
  price_per_night: number;
  description: string;
  photos: { image_url: string; is_primary: boolean }[];
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  branding?: any;
}

type Step = "dates" | "units" | "form" | "success";

export default function EmbedReservationsPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>("dates");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestsCount, setGuestsCount] = useState(1);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    guestDocument: "",
    specialRequests: "",
  });

  const minDate = new Date().toISOString().split("T")[0];
  const inputStyle = { colorScheme: "light" as const };
  const inputClass =
    "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white";

  useEffect(() => {
    async function loadData() {
      try {
        const { data: tenantData, error: tenantError } = await supabase
          .from("tenants")
          .select("*")
          .eq("slug", tenantSlug)
          .single();

        if (tenantError || !tenantData) {
          setError("Alojamiento no encontrado");
          setLoading(false);
          return;
        }
        setTenant(tenantData);

        const { data: unitsData } = await supabase
          .from("units")
          .select("*")
          .eq("tenant_id", tenantData.id)
          .eq("status", "active");

        if (unitsData) {
          const unitsWithPhotos = await Promise.all(
            unitsData.map(async (unit) => {
              const { data: photos } = await supabase
                .from("unit_photos")
                .select("image_url, is_primary")
                .eq("unit_id", unit.id)
                .order("order_index");
              return { ...unit, photos: photos || [] };
            })
          );
          setUnits(unitsWithPhotos);
        }
      } catch (err: any) {
        setError("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [tenantSlug]);

  async function handleCheckAvailability() {
    if (!checkIn || !checkOut) {
      alert("Seleccioná las fechas de check-in y check-out");
      return;
    }
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (checkOutDate <= checkInDate) {
      alert("La fecha de check-out debe ser posterior al check-in");
      return;
    }
    setCheckingAvailability(true);
    setError("");
    try {
      const available: Unit[] = [];
      for (const unit of units) {
        if (unit.capacity < guestsCount) continue;
        const response = await fetch("/api/check-availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantSlug, unitId: unit.id, checkIn, checkOut }),
        });
        const data = await response.json();
        if (data.available) available.push(unit);
      }
      setAvailableUnits(available);
      setStep("units");
    } catch (err) {
      setError("Error al verificar disponibilidad");
    } finally {
      setCheckingAvailability(false);
    }
  }

  function selectUnit(unit: Unit) {
    setSelectedUnit(unit);
    setStep("form");
  }

  async function handleSubmitReservation(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.guestName || !formData.guestEmail || !selectedUnit) {
      alert("Completá todos los campos obligatorios");
      return;
    }
    setSubmitting(true);
    try {
      const nights = Math.ceil(
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
      );
      const totalAmount = nights * selectedUnit.price_per_night;
      const response = await fetch("/api/create-reservation-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          unitId: selectedUnit.id,
          guestName: formData.guestName,
          guestEmail: formData.guestEmail,
          guestPhone: formData.guestPhone,
          guestDocument: formData.guestDocument,
          checkIn,
          checkOut,
          guestsCount,
          totalAmount,
          specialRequests: formData.specialRequests,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al crear la solicitud");
      setStep("success");
      // Avisar al sitio padre que la reserva se completó
      if (window.parent !== window) {
        window.parent.postMessage({ type: "reservation_completed", tenantSlug, requestId: data.requestId }, "*");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function calculateNights() {
    if (!checkIn || !checkOut) return 0;
    return Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
  }

  function formatPrice(price: number) {
    if (!price || price === 0) return "A consultar";
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(price);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-gray-600">{error || "Alojamiento no encontrado"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {step === "dates" && (
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reservá tu estadía</h2>
          <p className="text-gray-600 mb-6">Elegí las fechas y descubrí nuestras unidades disponibles</p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" /> Check-in
                </label>
                <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} min={minDate} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" /> Check-out
                </label>
                <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} min={checkIn || minDate} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Users className="w-4 h-4 inline mr-1" /> Huéspedes
                </label>
                <input type="number" value={guestsCount} onChange={(e) => { const val = parseInt(e.target.value); if (!isNaN(val) && val >= 1) setGuestsCount(val); else if (e.target.value === "") setGuestsCount(1); }} min="1" max="20" className={inputClass} style={inputStyle} />
              </div>
            </div>
            <button onClick={handleCheckAvailability} disabled={checkingAvailability} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {checkingAvailability ? <><Loader2 className="w-5 h-5 animate-spin" /> Verificando...</> : <><Search className="w-5 h-5" /> Ver unidades disponibles</>}
            </button>
          </div>
        </div>
      )}

      {step === "units" && (
        <div className="p-6">
          <button onClick={() => setStep("dates")} className="text-green-600 hover:text-green-700 font-medium mb-4 flex items-center gap-2 text-sm">
            <ChevronLeft className="w-4 h-4" /> Cambiar fechas
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unidades disponibles</h2>
          {availableUnits.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No hay unidades disponibles para estas fechas</p>
              <button onClick={() => setStep("dates")} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Cambiar fechas</button>
            </div>
          ) : (
            <div className="space-y-4">
              {availableUnits.map((unit) => {
                const nights = calculateNights();
                const total = nights * unit.price_per_night;
                const primaryPhoto = unit.photos.find((p) => p.is_primary) || unit.photos[0];
                return (
                  <div key={unit.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row">
                      {primaryPhoto && <img src={primaryPhoto.image_url} alt={unit.name} className="w-full sm:w-48 h-40 object-cover" />}
                      <div className="p-4 flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{unit.name}</h3>
                        {unit.type && <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{unit.type}</span>}
                        <p className="text-sm text-gray-500 mt-1"><Users className="w-4 h-4 inline" /> {unit.capacity} personas</p>
                        {unit.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{unit.description}</p>}
                        <div className="mt-3 flex items-baseline gap-2">
                          <span className="text-xl font-bold text-gray-900">{formatPrice(unit.price_per_night)}</span>
                          {unit.price_per_night > 0 && <span className="text-sm text-gray-500">/ noche</span>}
                        </div>
                        {nights > 0 && unit.price_per_night > 0 && (
                          <div className="bg-green-50 rounded p-2 mt-2 text-sm">
                            <span className="text-gray-600">{nights} noches × {formatPrice(unit.price_per_night)}</span>
                            <span className="font-bold text-green-700 ml-2">Total: {formatPrice(total)}</span>
                          </div>
                        )}
                        <button onClick={() => selectUnit(unit)} className="w-full mt-3 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700">Reservar esta unidad</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {step === "form" && selectedUnit && (
        <div className="p-6">
          <button onClick={() => setStep("units")} className="text-green-600 hover:text-green-700 font-medium mb-4 flex items-center gap-2 text-sm">
            <ChevronLeft className="w-4 h-4" /> Volver a unidades
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Completá tus datos</h2>
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Resumen</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Unidad:</span><span className="font-medium">{selectedUnit.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Check-in:</span><span className="font-medium">{new Date(checkIn).toLocaleDateString("es-AR")}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Check-out:</span><span className="font-medium">{new Date(checkOut).toLocaleDateString("es-AR")}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Noches:</span><span className="font-medium">{calculateNights()}</span></div>
              <div className="border-t border-green-200 pt-2 mt-2 flex justify-between">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-green-700 text-lg">{formatPrice(calculateNights() * selectedUnit.price_per_night)}</span>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmitReservation} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label><input type="text" value={formData.guestName} onChange={(e) => setFormData({ ...formData, guestName: e.target.value })} required className={inputClass} style={inputStyle} placeholder="Juan Pérez" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" value={formData.guestEmail} onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })} required className={inputClass} style={inputStyle} placeholder="juan@email.com" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label><input type="tel" value={formData.guestPhone} onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })} className={inputClass} style={inputStyle} placeholder="011 1234-5678" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Documento (DNI/Pasaporte)</label><input type="text" value={formData.guestDocument} onChange={(e) => setFormData({ ...formData, guestDocument: e.target.value })} className={inputClass} style={inputStyle} placeholder="12345678" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Solicitudes especiales (opcional)</label><textarea value={formData.specialRequests} onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })} rows={2} className={inputClass} style={inputStyle} placeholder="Viajamos con mascota, etc." /></div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <Shield className="w-4 h-4 inline mr-1" /> Tu solicitud será enviada al anfitrión, quien la confirmará en las próximas 24 horas.
            </div>
            <button type="submit" disabled={submitting} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</> : <><CheckCircle className="w-5 h-5" /> Enviar solicitud</>}
            </button>
          </form>
        </div>
      )}

      {step === "success" && (
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">¡Solicitud enviada!</h2>
          <p className="text-gray-600 mb-6">El anfitrión la revisará y te enviará una confirmación por email en las próximas 24 horas.</p>
          <button onClick={() => { setStep("dates"); setCheckIn(""); setCheckOut(""); setSelectedUnit(null); setFormData({ guestName: "", guestEmail: "", guestPhone: "", guestDocument: "", specialRequests: "" }); }} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Hacer otra reserva</button>
        </div>
      )}

      <div className="border-t border-gray-200 py-3 px-6 text-center">
        <p className="text-xs text-gray-500">
          Powered by <a href="https://miestadia.online" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-medium">Mi Estadía</a>
        </p>
      </div>
    </div>
  );
}